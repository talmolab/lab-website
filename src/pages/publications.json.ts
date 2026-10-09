import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/** §6.1: static export endpoints, cheap to produce and genuinely useful for
 *  grant and biosketch prep. Nothing here is computed at request time. */
export const GET: APIRoute = async () => {
  const pubs = (await getCollection('publications'))
    .map((p) => p.data)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  return new Response(JSON.stringify(pubs, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
