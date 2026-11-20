import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/** Escape the five characters that break a .bib file. */
const tex = (s: string) =>
  String(s).replace(/([&%$#_])/g, '\\$1').replace(/[{}]/g, '');

/** The overlay's `equal:` and `corresponding:` as a biblatex `author+an` value. */
function annotations(p: { authors: string[]; equal: string[]; corresponding: string[] }): string | undefined {
  const items = p.authors
    .map((a, i) => {
      const an = [p.equal.includes(a) && 'equal', p.corresponding.includes(a) && 'corresponding'].filter(Boolean);
      return an.length ? `${i + 1}=${an.join(', ')}` : '';
    })
    .filter(Boolean);
  return items.length ? items.join('; ') : undefined;
}

export const GET: APIRoute = async () => {
  const pubs = (await getCollection('publications'))
    .map((p) => p.data)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const body = pubs
    .map((p) => {
      const year = (p.date ?? '').slice(0, 4);
      const fields: [string, string | undefined][] = [
        ['title', tex(p.title)],
        // BibTeX wants " and " between authors, not commas.
        ['author', p.authors.map(tex).join(' and ')],
        // biblatex data annotations (manual: "Data Annotations"): "1=equal, corresponding; 3=equal"
        // marks co-first and corresponding authors by position. BibTeX ignores the field.
        ['author+an', annotations(p)],
        ['journal', p.venue ? tex(p.venue) : undefined],
        ['year', year || undefined],
        ['doi', p.doi],
        ['url', p.url],
      ];
      const inner = fields
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k} = {${v}}`)
        .join(',\n');
      return `@article{${p.key},\n${inner}\n}`;
    })
    .join('\n\n');

  return new Response(body + '\n', {
    headers: { 'content-type': 'application/x-bibtex; charset=utf-8' },
  });
};
