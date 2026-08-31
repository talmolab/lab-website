import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
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
  'staff-scientist',
  'postdoc',
  'scientific-programmer',
  'software-engineer',
  'bioinformatics-analyst',
  'phd-student',
  'phd-rotation',
  'ms-student',
  'research-assistant',
  'undergrad-intern',
  'undergrad-summer-intern',
  'highschool-intern',
  'highschool-summer-intern',
  'friend',
] as const;

export const ROLE_LABEL: Record<(typeof ROLE_ORDER)[number], string> = {
  'pi': 'Principal Investigator',
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
};

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

  /** Salk co-advisor for jointly supervised appointments. */
  coAdvisor: z.string().optional(),
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
    blurb: z.string().optional(),
    image: z.string().optional(),
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
 *  the schema is deliberately minimal — associations to publications, repos and
 *  projects are all optional and will be revised once real content exists.
 *  Resist adding required fields here. */
const areas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/areas' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      image: image().optional(),
      /** Editorial order. Not alphabetical, not by output volume. */
      order: z.number().default(99),
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

export const collections = { people, publications, repos, areas, posts, news };
