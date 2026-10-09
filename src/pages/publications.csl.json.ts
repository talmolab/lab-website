import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/** CSL-JSON, the format Zotero, Pandoc and manubot all read. */
export const GET: APIRoute = async () => {
  const pubs = (await getCollection('publications'))
    .map((p) => p.data)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const csl = pubs.map((p) => {
    const parts = (p.date ?? '').split('-').map(Number).filter(Boolean);
    return {
      id: p.key,
      type: 'article-journal',
      title: p.title,
      author: p.authors.map((a) => {
        const bits = a.split(' ');
        return { given: bits.slice(0, -1).join(' '), family: bits[bits.length - 1] };
      }),
      'container-title': p.venue,
      issued: parts.length ? { 'date-parts': [parts] } : undefined,
      DOI: p.doi,
      URL: p.url,
    };
  });

  return new Response(JSON.stringify(csl, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
