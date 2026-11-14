import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { getCollection, type CollectionEntry } from 'astro:content';

export type Pub = CollectionEntry<'publications'>;

/** Every publication, newest first. Undated entries sort last. */
export async function allPubs(): Promise<Pub[]> {
  return (await getCollection('publications')).sort(
    (a, b) => (b.data.date ?? '').localeCompare(a.data.date ?? '') || a.id.localeCompare(b.id),
  );
}

export function byYear(pubs: Pub[]): [string, Pub[]][] {
  const m = new Map<string, Pub[]>();
  for (const p of pubs) {
    const y = (p.data.date ?? '').slice(0, 4) || 'Undated';
    m.set(y, [...(m.get(y) ?? []), p]);
  }
  return [...m.entries()];
}

/** Thumbnails live in public/images/papers/ (scripts/paper-thumb.mjs makes them). The
 *  overlay names a file; older entries name the original PNG or JPG, which was
 *  converted to WebP, so that is tried first. An absolute URL is still accepted, but
 *  nothing uses one now: the publisher figures the live site hotlinked were copied in.
 *  No file, no thumbnail: never a broken image. */
export function thumb(image?: string): string | undefined {
  if (!image || image.endsWith('.pdf')) return undefined;
  if (/^https?:\/\//.test(image)) return image;
  const candidates = [`/images/${image.replace(/\.(png|jpe?g)$/i, '.webp')}`, `/images/${image}`];
  return candidates.find((rel) => existsSync(`public${rel}`));
}

/** A thumbnail with its pixel size when it is ours, so the page reserves the right
 *  space before it loads (anchors like /publications/#key then land where they
 *  should). Hotlinked publisher figures have no known size and get a fixed box. */
export async function thumbInfo(image?: string): Promise<{ src: string; width?: number; height?: number } | undefined> {
  const src = thumb(image);
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return { src };
  const m = await sharp(`public${src}`).metadata();
  return { src, width: m.width, height: m.height };
}

/** Where the title links: the overlay's own link, else the DOI. */
export function href(p: Pub['data']): string | undefined {
  return p.url ?? (p.doi ? `https://doi.org/${p.doi}` : undefined);
}

export function fmtDate(d?: string, month: 'short' | 'long' = 'short'): string {
  if (!d) return '';
  if (d.length === 4) return d;
  return new Date(`${d.length === 7 ? `${d}-01` : d}T00:00:00Z`).toLocaleDateString('en-US', {
    month,
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "bioRxiv", "arXiv" and friends are preprint servers; the venue line says so. */
export function isPreprintVenue(venue?: string): boolean {
  return !!venue && /\b(biorxiv|medrxiv|arxiv|research square|ssrn)\b/i.test(venue);
}
