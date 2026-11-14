import { getCollection, type CollectionEntry } from 'astro:content';
import { ROLE_ORDER, ROLE_LABEL } from '../content.config';

export type Person = CollectionEntry<'people'>;
type Appointment = Person['data']['appointments'][number];

/** The most recent appointment — the one that decides how someone is labelled. */
export const latest = (p: Person): Appointment =>
  p.data.appointments[p.data.appointments.length - 1];

/** Current iff the last appointment has no `end` at all. `end: "unknown"` is a
 *  departure whose date was never recorded, and must NOT read as still-here. */
export const isCurrent = (p: Person): boolean => latest(p).end === undefined;

export const rank = (p: Person): number => ROLE_ORDER.indexOf(latest(p).role);

/** What to show for an appointment. `title` is the lab's own wording, which is
 *  often more accurate than either the category or the Salk HR title — those are
 *  kept as separate fields rather than reconciled into one. */
export const label = (a: Appointment): string => a.title ?? ROLE_LABEL[a.role];

/** The one line under a portrait. A note that refines the label ("Postdoctoral Fellow
 *  (Visiting)") replaces it rather than repeating it on a second line. */
export const displayTitle = (a: Appointment): string => {
  const l = label(a);
  return a.note && a.note.startsWith(l) ? a.note : l;
};

/** How the team page groups current members: by kind of appointment, in ROLE_ORDER,
 *  never by hand. Friends of the lab come last, as on the live site. */
export const GROUPS: { name: string; roles: (typeof ROLE_ORDER)[number][] }[] = [
  { name: 'Principal investigator', roles: ['pi'] },
  {
    name: 'Research staff',
    roles: ['staff-scientist', 'postdoc', 'scientific-programmer', 'software-engineer', 'bioinformatics-analyst'],
  },
  { name: 'Graduate students', roles: ['phd-student', 'phd-rotation', 'ms-student'] },
  { name: 'Research assistants', roles: ['research-assistant'] },
  {
    name: 'Interns',
    roles: ['undergrad-intern', 'undergrad-summer-intern', 'highschool-intern', 'highschool-summer-intern'],
  },
  { name: 'Friends of the lab', roles: ['friend'] },
];

export function grouped(people: Person[]) {
  return GROUPS.map((g) => ({
    name: g.name,
    people: people.filter((p) => g.roles.includes(latest(p).role)),
  })).filter((g) => g.people.length > 0);
}

/** Every distinct role held, oldest first, deduped — "Undergraduate Research
 *  Intern, Master's Student" for someone who converted. */
export function roleHistory(p: Person): string[] {
  const seen = new Set<string>();
  return p.data.appointments
    .map((a) => label(a))
    .filter((l) => (seen.has(l) ? false : seen.add(l)));
}

/** Years to show in the alumni table.
 *
 *  Two cases look identical in the source prose and must not look identical here:
 *
 *    Will Knickrehm  2023, 2024  two separate summers, same role   -> "2023, 2024"
 *    Aaditya Prasad  2021 -> 2024 one tenure, role changed midway  -> "2021–2024"
 *
 *  They are told apart structurally rather than by guessing: a run is contiguous
 *  when an appointment has no `end` or the next has no `start`, which is exactly
 *  how a role handover with an unrecorded boundary is encoded. Two appointments
 *  that are both fully bounded are genuinely separate stints. */
export function years(p: Person): string {
  type Run = { start?: string; end?: string; endRaw?: string; open: boolean };
  const runs: Run[] = [];

  for (const a of p.data.appointments) {
    const s = a.start?.slice(0, 4);
    const e = a.end && a.end !== 'unknown' ? a.end.slice(0, 4) : undefined;
    const open = a.end === 'unknown';
    const prev = runs[runs.length - 1];
    // A role change is recorded as one appointment ending the month the next one
    // starts (Aaditya Prasad: intern to 2022-11, MS student from 2022-11). That is a
    // handover, not a gap, so it continues the run; so does an unrecorded boundary.
    const contiguous =
      prev && (prev.endRaw === undefined || a.start === undefined || handover(prev.endRaw, a.start));
    if (contiguous) {
      if (e) prev.end = e;
      prev.endRaw = a.end && a.end !== 'unknown' ? a.end : undefined;
      if (open) prev.open = true;
      if (!prev.start && s) prev.start = s;
    } else {
      runs.push({ start: s, end: e, endRaw: a.end && a.end !== 'unknown' ? a.end : undefined, open });
    }
  }

  const parts = runs.map(({ start, end, open }) => {
    if (open) return start ? `${start}–?` : undefined;
    if (start && end) return start === end ? start : `${start}–${end}`;
    return end ?? start;
  });
  const seen = new Set<string>();
  const uniq = parts.filter((x): x is string => !!x && !seen.has(x) && !!seen.add(x));
  return uniq.length ? uniq.join(', ') : '—';
}

/** True when `start` follows `end` with no gap: the same month or the next one. Year-only
 *  values compare on the year, since the month was never recorded. */
function handover(end: string, start: string): boolean {
  if (end.length === 4 || start.length === 4) return start.slice(0, 4) === end.slice(0, 4);
  const [ey, em] = end.split('-').map(Number);
  const next = em === 12 ? `${ey + 1}-01` : `${ey}-${String(em + 1).padStart(2, '0')}`;
  return start <= next;
}

/** Sort key for alumni: most recent departure first, then name. */
function lastYear(p: Person): number {
  const ys = p.data.appointments
    .map((a) => (a.end && a.end !== 'unknown' ? +a.end.slice(0, 4) : 0))
    .filter(Boolean);
  return ys.length ? Math.max(...ys) : 0;
}

export async function team() {
  const all = await getCollection('people');
  const current = all
    .filter(isCurrent)
    // Role rank, then seniority within a role — never hand-ordered (§6.2).
    .sort((a, b) => rank(a) - rank(b) || (a.data.appointments[0].start ?? '').localeCompare(b.data.appointments[0].start ?? '') || a.data.name.localeCompare(b.data.name));
  const alumni = all
    .filter((p) => !isCurrent(p))
    .sort((a, b) => lastYear(b) - lastYear(a) || a.data.name.localeCompare(b.data.name));
  return { current, alumni, all };
}
