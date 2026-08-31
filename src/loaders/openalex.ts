import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { Loader } from 'astro/loaders';

const OPENALEX = 'https://api.openalex.org';
const CROSSREF = 'https://api.crossref.org';
/** OpenAlex asks for a contact address; it also selects the faster pool. */
const MAILTO = 'talmo@salk.edu';

type Ref = { doi: string; venue?: string; date?: string };
type OverlayEntry = {
  key: string;
  published?: Ref;
  preprint?: Ref;
  manual?: Record<string, unknown>;
  image?: string;
  tags?: string[];
  highlight?: boolean;
  links?: { label: string; url: string }[];
};

type Meta = {
  title: string;
  authors: string[];
  venue?: string;
  date?: string;
  doi?: string;
  url?: string;
  type?: string;
  citations?: number;
};

function key() {
  // A key raises the daily budget but is not required for these calls: filter and
  // singleton lookups both answer unauthenticated (verified 2026-08-30). Singleton
  // lookups by DOI are free regardless.
  return process.env.OPENALEX_API_KEY;
}

async function openalexByDoi(doi: string, logger: any): Promise<Meta | null> {
  const url = new URL(`${OPENALEX}/works/doi:${doi}`);
  url.searchParams.set('mailto', MAILTO);
  const k = key();
  if (k) url.searchParams.set('api_key', k);
  const res = await fetch(url);
  if (!res.ok) return null;
  const w: any = await res.json();
  const cost = w?.meta?.cost_usd;
  if (cost) logger.info(`openalex cost ${cost} for ${doi}`);
  return {
    title: w.title ?? w.display_name,
    authors: (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean),
    venue: w.primary_location?.source?.display_name ?? undefined,
    date: w.publication_date,
    // OpenAlex reports doi: null for some records (MIMIC-MJX is indexed via
    // PubMed only), so fall back to the DOI we asked with.
    doi: (w.doi ?? '').replace('https://doi.org/', '') || doi,
    url: w.doi ?? undefined,
    type: w.type,
    citations: w.cited_by_count,
  };
}

async function crossrefByDoi(doi: string): Promise<Meta | null> {
  const res = await fetch(`${CROSSREF}/works/${doi}?mailto=${MAILTO}`);
  if (!res.ok) return null;
  const m: any = (await res.json()).message;
  const parts = m.issued?.['date-parts']?.[0] ?? [];
  return {
    title: Array.isArray(m.title) ? m.title[0] : m.title,
    authors: (m.author ?? []).map((a: any) => `${a.given ?? ''} ${a.family ?? ''}`.trim()),
    venue: Array.isArray(m['container-title']) ? m['container-title'][0] : undefined,
    date: parts.length ? parts.map((n: number, i: number) => (i ? String(n).padStart(2, '0') : n)).join('-') : undefined,
    doi: m.DOI,
    url: m.URL,
    type: m.type,
  };
}

/** Follow `is-preprint-of` forward from a preprint. §6.1: only ever forward — the
 *  reverse direction points at a Research Square DOI rather than the bioRxiv one. */
export async function publishedVersionOf(doi: string): Promise<string | null> {
  const res = await fetch(`${CROSSREF}/works/${doi}?mailto=${MAILTO}`);
  if (!res.ok) return null;
  const rel = (await res.json()).message?.relation?.['is-preprint-of'];
  return rel?.[0]?.id ?? null;
}

/** OpenAlex source names carry the publisher in parentheses — "arXiv (Cornell
 *  University)", "bioRxiv (Cold Spring Harbor Laboratory)". Nobody cites them that
 *  way. Strip the trailing parenthetical; the overlay can still override outright. */
function tidyVenue(v?: string): string | undefined {
  if (!v) return undefined;
  return v.replace(/\s*\([^)]*\)\s*$/, '').trim() || v;
}

async function resolve(ref: Ref, logger: any): Promise<Meta | null> {
  // OpenAlex first: it resolves arXiv DOIs, which Crossref 404s (they are
  // registered with DataCite). Crossref is the fallback, not the primary.
  return (await openalexByDoi(ref.doi, logger)) ?? (await crossrefByDoi(ref.doi));
}

export function publications(file = 'src/data/publications.yaml'): Loader {
  return {
    name: 'publications',
    async load({ store, logger, parseData, generateDigest }) {
      const overlay = parse(readFileSync(file, 'utf8')) as OverlayEntry[];
      logger.info(`${overlay.length} curated publications`);
      let fetched = 0;

      for (const entry of overlay) {
        const digest = generateDigest(entry);
        const cached = store.get(entry.key);
        if (cached?.digest === digest) continue;

        let meta: Meta | null = null;
        let preprintMeta: Meta | null = null;

        if (entry.manual) {
          meta = entry.manual as unknown as Meta;
        } else {
          const primary = entry.published ?? entry.preprint;
          if (!primary) throw new Error(`${entry.key}: needs published, preprint or manual`);
          meta = await resolve(primary, logger);
          fetched++;
          if (!meta) throw new Error(`${entry.key}: could not resolve ${primary.doi}`);
          if (entry.published && entry.preprint) {
            preprintMeta = await resolve(entry.preprint, logger);
            fetched++;
          }
        }

        const data = await parseData({
          id: entry.key,
          data: {
            key: entry.key,
            title: meta.title,
            authors: meta.authors ?? [],
            // The overlay wins over the API for every field it sets.
            venue: entry.published?.venue ?? entry.preprint?.venue ?? tidyVenue(meta.venue),
            date: entry.published?.date ?? meta.date,
            doi: meta.doi,
            url: (meta as any).link ?? meta.url,
            type: meta.type,
            citations: meta.citations,
            image: entry.image,
            tags: entry.tags ?? [],
            highlight: entry.highlight ?? false,
            links: entry.links ?? [],
            preprint: preprintMeta
              ? { doi: preprintMeta.doi, venue: tidyVenue(preprintMeta.venue), date: preprintMeta.date, url: preprintMeta.url }
              : undefined,
          },
        });
        store.set({ id: entry.key, data, digest });
      }
      logger.info(`resolved ${fetched} records from the API (rest cached)`);
    },
  };
}
