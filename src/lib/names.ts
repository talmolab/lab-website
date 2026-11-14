import type { CollectionEntry } from 'astro:content';

/** A name reduced to "first last": case, accents, punctuation and middle names or
 *  initials dropped. "Talmo D. Pereira" and "Talmo Pereira" agree; "TD Pereira" and
 *  "Talmo Periera" do not. That is deliberate: a missed paper costs a line on a member
 *  page, a false match puts someone's name on work that is not theirs. */
export function nameKey(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    // Generational suffixes are not surnames: "Arthur Mayo III".
    .filter((w) => !/^(jr|sr|ii|iii|iv)$/.test(w));
  if (words.length < 2) return words.join(' ');
  return `${words[0]} ${words[words.length - 1]}`;
}

type Person = CollectionEntry<'people'>;

/** Map from nameKey to person, over each person's name and aliases. */
export function peopleByName(people: Person[]): Map<string, Person> {
  const m = new Map<string, Person>();
  for (const p of people) {
    for (const n of [p.data.name, ...p.data.aliases]) m.set(nameKey(n), p);
  }
  return m;
}

/** Whether `author` (as printed on a paper) is this person. */
export function isAuthor(p: Person, author: string): boolean {
  const k = nameKey(author);
  return [p.data.name, ...p.data.aliases].some((n) => nameKey(n) === k);
}
