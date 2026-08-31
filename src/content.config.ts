import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  role: z.enum(ROLE_ORDER),
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
          url: z.string().url().optional(),
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

export const collections = { people };
