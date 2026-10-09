import { getEntry, type CollectionEntry } from 'astro:content';

export type Clip = CollectionEntry<'media'>;

export const videoUrl = (c: Clip) => `/media/${c.id}.mp4`;
export const posterUrl = (c: Clip) => `/media/${c.id}.jpg`;
export const ratio = (c: Clip) => c.data.width / c.data.height;

/** Inline custom properties for a justified-row item (see .jrow in global.css). */
export const shape = (c: Clip) =>
  `--ar: ${ratio(c).toFixed(4)}; --w: ${c.data.width}; --h: ${c.data.height}`;

/** Resolve clip ids or references; a missing id fails the build rather than a page. */
export async function clips(refs: (string | { id: string })[]): Promise<Clip[]> {
  return Promise.all(
    refs.map(async (r) => {
      const id = typeof r === 'string' ? r : r.id;
      const c = await getEntry('media', id);
      if (!c) throw new Error(`media: no clip "${id}" in src/data/media.yaml`);
      return c;
    }),
  );
}

/** Greedy justified-row packing: fill a line until its summed aspect ratio reaches
 *  `target` (about 5 reads well at 1200px: rows near 240px tall). Order is kept. */
export function pack(list: Clip[], target = 5): Clip[][] {
  const rows: Clip[][] = [];
  let row: Clip[] = [];
  let sum = 0;
  for (const c of list) {
    row.push(c);
    sum += ratio(c);
    if (sum >= target) {
      rows.push(row);
      row = [];
      sum = 0;
    }
  }
  if (row.length) rows.push(row);
  return rows;
}
