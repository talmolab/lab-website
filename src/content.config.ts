import { existsSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { file, glob } from 'astro/loaders';
import { publications as publicationsLoader } from './loaders/openalex';
import { repos as reposLoader } from './loaders/github';

/** "2024" or "2024-06". Deliberately allows year-only: for most alumni the month
 *  genuinely is not known, and padding it to "-01" would invent a fact. */
const yearMonth = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, 'expected YYYY or YYYY-MM');

/** Ordered most to least senior. Position in this array IS the sort rank, so the
 *  team page never needs hand-ordering (§6.2) — the live site currently shows
 *  staff scientists below undergraduate interns because ordering is manual. */
export const ROLE_ORDER = [
  'pi',
  'admin',
  'software-engineer',
  'scientific-programmer',
  'bioinformatics-analyst',
  'staff-scientist',
  'postdoc',
  'phd-student',
  'phd-rotation',
  'ms-student',
  'research-assistant',
  'undergrad-intern',
  'undergrad-summer-intern',
  'highschool-intern',
  'highschool-summer-intern',
  'friend',
  /** Not people: never counted as lab members (isMember in src/lib/people.ts). */
  'robot',
] as const;

export const ROLE_LABEL: Record<(typeof ROLE_ORDER)[number], string> = {
  'pi': 'Principal Investigator',
  'admin': 'Lab Administrator',
  'staff-scientist': 'Staff Scientist',
  'postdoc': 'Postdoctoral Researcher',
  'scientific-programmer': 'Scientific Programmer',
  'software-engineer': 'Software Engineer',
  'bioinformatics-analyst': 'Bioinformatics Analyst',
  'phd-student': 'PhD Student',
  'phd-rotation': 'PhD Rotation Student',
  'ms-student': "Master's Student",
  'research-assistant': 'Research Assistant',
  'undergrad-intern': 'Undergraduate Research Intern',
  'undergrad-summer-intern': 'Undergraduate Summer Research Intern',
  'highschool-intern': 'High School Research Intern',
  'highschool-summer-intern': 'High School Summer Research Intern',
  'friend': 'Friend of the Lab',
  'robot': 'Robot',
};

/** Graduate programs, keyed by a short id that appointments reference
 *  (`program: ngp`). Shown on the member page, linked. */
const programs = defineCollection({
  loader: file('src/data/programs.yaml'),
  schema: z.object({
    name: z.string(),
    school: z.string(),
    url: z.url(),
  }),
});

/** The lab's project groups (VNL, Pheno, ...), referenced from people (`projects:`). */
const projects = defineCollection({
  loader: file('src/data/projects.yaml'),
  schema: z.object({
    /** As the lab writes it on cards: "VNL", "Pheno". */
    name: z.string(),
    /** Spelled out, where the short name needs it. */
    title: z.string().optional(),
    url: z.string().optional(),
  }),
});

/** Lab pages for co-advisors, keyed by the name exactly as `coAdvisor` writes it. A
 *  co-advisor without an entry is shown as plain text. */
const pis = defineCollection({
  loader: file('src/data/pis.yaml', { parser: (text) => Object.entries(parse(text) ?? {}).map(([id, url]) => ({ id, url })) }),
  schema: z.object({ url: z.url() }),
});

/** A file under public/, named by its URL path. Checked at build time, so a typo in
 *  a media reference fails the build instead of shipping a broken figure. */
const publicFile = z
  .string()
  .regex(/^\/[^\s]+$/, 'expected a site path such as /media/clip.mp4')
  .refine((p) => existsSync(`public${p}`), { message: 'no such file under public/' });

/** One figure: a still image or a short muted loop. Clips are added by encoding with
 *  scripts/encode-clip.sh (which prints this block) and referencing them from an
 *  area's or a repo's `media:` list. A .webm beside an .mp4 is offered first. */
export const mediaItem = z.object({
  src: publicFile,
  poster: publicFile.optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** What is on screen, for screen readers. Required: these are content, not decoration. */
  alt: z.string().min(1),
  caption: z.string().optional(),
  credit: z.string().optional(),
  /** Paint a light plate behind the figure in dark mode, for transparent PNGs and
   *  figures drawn for paper (black text, white ground). */
  plate: z.boolean().default(false),
});

const appointment = z.object({
  /** Category. Drives sorting, grouping and filtering — never displayed raw. */
  role: z.enum(ROLE_ORDER),

  /** What the site calls this appointment, when the category label is not what
   *  the lab would say. Salk HR titles historically did not reflect what people
   *  actually did, so the website deliberately used better ones; both need to be
   *  representable rather than reconciled. Falls back to ROLE_LABEL[role]. */
  title: z.string().optional(),

  /** The official Salk job title, where it differs from both of the above. */
  salkTitle: z.string().optional(),

  /** A PI who genuinely co-advises or jointly supervises this appointment, shown on
   *  the member page and team card. NOT the lab that holds the appointment on paper
   *  (a grad program's PI of record, an HR home department): that is an HR fact and
   *  stays out of this public repository. A name in src/data/pis.yaml is linked. */
  coAdvisor: z.string().optional(),
  /** Graduate program, for student appointments: an id in src/data/programs.yaml. */
  program: reference('programs').optional(),
  start: yearMonth.optional(),
  /** Absent means still here. "Alumni" is derived from this, never stored — that
   *  is what let four people fall off the site: their file said role: alumni,
   *  which hid them from the team page, while nothing added them to the list.
   *
   *  "unknown" means departed on a date nobody wrote down. It exists so that
   *  "gone" and "still here" stay distinguishable when the date is missing —
   *  omitting `end` for a departed person recreates exactly the bug above. */
  end: z.union([yearMonth, z.literal('unknown')]).optional(),
  /** Free text for things that qualify an appointment without being one:
   *  "TRELS Scholar", "co-advised with Wolfgang Busch", "remote". */
  note: z.string().optional(),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      image: image().optional(),
      /** Whether this person gets their own /members/<slug>.html page.
       *  §6.2b: an alumnus with a real bio keeps a page; a two-sentence summer
       *  entry is better as a table row. Someone with no page still belongs in
       *  the collection — that is how Pranav Sankar stays on the alumni list,
       *  and the "everyone has a page" invariant was already broken for him on
       *  the live site. */
      page: z.boolean().default(true),
      /** Other spellings of the name as it appears on papers ("Kaiwen Bian"). Used only
       *  to list this person's publications on their page. Exact names, not patterns. */
      aliases: z.array(z.string()).default([]),
      /** Current project groups, ids in src/data/projects.yaml. Per person, not per
       *  appointment: they describe what someone works on now. */
      projects: z.array(reference('projects')).default([]),
      /** At least one. Sorted oldest-first by convention, not enforced. */
      appointments: z.array(appointment).min(1),
      next: z
        .object({
          org: z.string(),
          what: z.string().optional(),
          url: z.url().optional(),
        })
        .optional(),
      links: z
        .object({
          email: z.string().optional(),
          github: z.string().optional(),
          linkedin: z.string().optional(),
          /** A Bluesky handle ("talmo.bsky.social", or a custom domain), without the @. */
          bluesky: z.string().optional(),
          twitter: z.string().optional(),
          orcid: z.string().optional(),
          scholar: z.string().optional(),
          'home-page': z.string().optional(),
        })
        .optional(),
    }),
});

const publications = defineCollection({
  loader: publicationsLoader(),
  schema: z.object({
    key: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    /** Authors who contributed equally (co-first), corresponding authors, and authors
     *  who jointly supervised the work (co-senior), from the overlay's `equal:`,
     *  `corresponding:` and `senior:`. Each is one of `authors`, as printed there: the
     *  loader fails the build on a name it cannot find. */
    equal: z.array(z.string()).default([]),
    corresponding: z.array(z.string()).default([]),
    senior: z.array(z.string()).default([]),
    venue: z.string().optional(),
    date: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional(),
    type: z.string().optional(),
    citations: z.number().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    highlight: z.boolean().default(false),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    /** The earlier version, when this work has one. Linked secondarily; never a
     *  separate list entry — showing both is the bug this whole model exists to
     *  fix (§4.1: two Nature-family papers were displayed as bioRxiv preprints). */
    preprint: z
      .object({
        doi: z.string().optional(),
        venue: z.string().optional(),
        date: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
  }),
});

const repos = defineCollection({
  loader: reposLoader(),
  schema: z.object({
    repo: z.string(),
    owner: z.string(),
    name: z.string(),
    /** Position in repos.yaml. Display order is editorial, never derived from
     *  stars or recency (§6.3). */
    order: z.number(),
    group: z.enum(['maintained', 'research', 'archived']),
    /** How the lab writes the name, when it is not the repo name ("SLEAP", "DREEM"). */
    title: z.string().optional(),
    blurb: z.string().optional(),
    image: z.string().optional(),
    /** Figures or clips to show with this repo. None today. */
    media: z.array(mediaItem).default([]),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    // Enrichment from the GitHub API — all optional so a failed call degrades
    // to rendering from repos.yaml alone rather than breaking the build.
    description: z.string().optional(),
    language: z.string().optional(),
    license: z.string().optional(),
    topics: z.array(z.string()).default([]),
    stars: z.number().optional(),
    forks: z.number().optional(),
    pushedAt: z.string().optional(),
    homepage: z.string().optional(),
    archivedOnGitHub: z.boolean().optional(),
  }),
});

/** §6.3b: the Research page is prose-first. These are authored, not derived, and
 *  the schema is deliberately minimal: everything beyond the prose is optional.
 *  Resist adding required fields here.
 *
 *  The three areas are the lab's research directions (biological motion capture,
 *  phenoinformatics, virtual biology). The `###` headings in an area's prose are its
 *  threads: the Research page lists them in its overview and links to each, so keep
 *  them short and unique across areas. */
const areas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/areas' }),
  schema: z.object({
    name: z.string(),
    /** One sentence for the home page and the Research overview. */
    summary: z.string(),
    /** What the direction sets out to do, shown under its heading on Research. */
    goal: z.string().optional(),
    /** Editorial order. Not alphabetical, not by output volume. */
    order: z.number().default(99),
    /** The first item leads the area on Research and stands for it on Home. */
    media: z.array(mediaItem).default([]),
    /** Repos (ids from repos.yaml, "owner/name") and papers (overlay keys) that belong
     *  to this area. reference() so a typo fails the build. */
    tools: z.array(reference('repos')).default([]),
    papers: z.array(reference('publications')).default([]),
    /** Written but not shown. */
    draft: z.boolean().default(false),
  }),
});

/** §6.4: two collections, one merged reverse-chron stream with type badges.
 *  `posts` are long-form and get their own URL and RSS entry. */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      /** Slugs of people in the `people` collection. reference() so a typo fails
       *  the build instead of shipping a dead link (§6.2). */
      authors: z.array(reference('people')).default([]),
      description: z.string().optional(),
      image: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

/** `news` items are 1-3 sentences plus a link. No dedicated page — they render
 *  inline in the stream. Paper out, person joined, release shipped, talk given. */
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    url: z.url().optional(),
    /** Set by the Phase 4 Action, which opens a PR rather than publishing (4b). */
    draft: z.boolean().default(false),
  }),
});

export const collections = { people, programs, projects, pis, publications, repos, areas, posts, news };
