import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { Loader } from 'astro/loaders';
import { nameKey } from '../lib/names';

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
  /** Co-first (equal-contribution) and corresponding authors, as named on the paper. */
  equal?: string[];
  corresponding?: string[];
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

/** Statuses worth asking again: throttling and server-side failures. A 404 is an
 *  answer (Crossref has no arXiv DOIs, by design) and is returned at once. */
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * `fetch` that retries network errors and RETRYABLE statuses with backoff (1 s, 2 s,
 * 4 s, plus jitter; a Retry-After header wins, capped at 30 s). Every overlay entry is
 * resolved on every build and a single failed lookup fails the build, so a one-off 429
 * or 503 from OpenAlex used to block a production deploy until someone re-ran it (twice
 * on 2026-11-20, for entries that resolved on the job before and after).
 *
 * Gives back the last response once retries run out, so callers keep their `!res.ok`
 * handling; throws only if the network never answered. `label` names the request in
 * logs, so the URL (with its api_key) is never printed.
 */
export async function fetchWithRetry(
  url: string | URL,
  label: string,
  logger?: { warn(msg: string): void },
  { tries = 4, baseMs = 1000 } = {},
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    let res: Response | undefined;
    try {
      res = await fetch(url);
      if (!RETRYABLE.has(res.status)) return res;
    } catch (e) {
      lastError = e;
    }
    if (attempt === tries) {
      if (res) {
        logger?.warn(`${label}: HTTP ${res.status} after ${tries} attempts`);
        return res;
      }
      throw new Error(`${label}: no response after ${tries} attempts (${String(lastError)})`);
    }
    const retryAfter = Number(res?.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 30_000)
      : baseMs * 2 ** (attempt - 1) + Math.random() * 250;
    logger?.warn(`${label}: ${res ? `HTTP ${res.status}` : 'network error'}, retrying in ${Math.round(wait)} ms`);
    await sleep(wait);
  }
  throw new Error('unreachable');
}

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
  const res = await fetchWithRetry(url, `OpenAlex ${doi}`, logger);
  if (!res.ok) {
    if (res.status !== 404) logger.warn(`OpenAlex ${doi}: HTTP ${res.status}`);
    return null;
  }
  const w: any = await res.json();
  const cost = w?.meta?.cost_usd;
  if (cost) logger.info(`openalex cost ${cost} for ${doi}`);
  return {
    title: w.title ?? w.display_name,
    authors: (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean).map(givenFirst),
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

async function crossrefByDoi(doi: string, logger?: any): Promise<Meta | null> {
  const res = await fetchWithRetry(`${CROSSREF}/works/${doi}?mailto=${MAILTO}`, `Crossref ${doi}`, logger);
  if (!res.ok) return null;
  const m: any = (await res.json()).message;
  const parts = m.issued?.['date-parts']?.[0] ?? [];
  return {
    title: Array.isArray(m.title) ? m.title[0] : m.title,
    authors: (m.author ?? []).map((a: any) => `${a.given ?? ''} ${a.family ?? ''}`.trim()),
    // Posted content (bioRxiv, medRxiv) has no container; the server is the institution.
    venue: (Array.isArray(m['container-title']) ? m['container-title'][0] : undefined) ?? m.institution?.[0]?.name,
    date: parts.length ? parts.map((n: number, i: number) => (i ? String(n).padStart(2, '0') : n)).join('-') : undefined,
    doi: m.DOI,
    url: m.URL,
    type: m.type,
  };
}

/** Follow `is-preprint-of` forward from a preprint. §6.1: only ever forward — the
 *  reverse direction points at a Research Square DOI rather than the bioRxiv one. */
export async function publishedVersionOf(doi: string): Promise<string | null> {
  const res = await fetchWithRetry(`${CROSSREF}/works/${doi}?mailto=${MAILTO}`, `Crossref ${doi}`);
  if (!res.ok) return null;
  const rel = (await res.json()).message?.relation?.['is-preprint-of'];
  return rel?.[0]?.id ?? null;
}

/** OpenAlex source names carry the publisher in parentheses — "arXiv (Cornell
 *  University)", "bioRxiv (Cold Spring Harbor Laboratory)". Nobody cites them that
 *  way. Strip the trailing parenthetical; the overlay can still override outright. */
function tidyVenue(v?: string, doi?: string): string | undefined {
  // An index is not a venue. MIMIC-MJX reaches OpenAlex only through PubMed, which it
  // then reports as the source; the DOI says where the work actually lives.
  const index = !!v && /^(pubmed|pubmed central|europe pmc)$/i.test(v.trim());
  if (!v || index) return doi?.toLowerCase().startsWith('10.48550/arxiv') ? 'arXiv' : undefined;
  return v.replace(/\s*\([^)]*\)\s*$/, '').trim() || v;
}

/** Records that come in through PubMed carry names as "Zhang, Charles Y."; every other
 *  record, and the site, says "Charles Y. Zhang". Only a single comma is flipped, so a
 *  suffix ("Smith, John, Jr.") is left alone rather than mangled. */
function givenFirst(name: string): string {
  const parts = name.split(',');
  if (parts.length !== 2) return name;
  const [family, given] = parts.map((s) => s.trim());
  if (!given || !family || /^(jr|sr|ii|iii|iv)\.?$/i.test(given)) return name;
  return `${given} ${family}`;
}

/**
 * The authors an overlay entry marks as `equal` or `corresponding`, as `authors` prints
 * them and in author order. Names are matched by nameKey, so "Talmo Pereira" finds
 * "Talmo D. Pereira". A name that matches no author, or more than one, fails the build:
 * a typo would otherwise mark nobody, or the wrong person, without a word.
 */
function marked(entry: OverlayEntry, field: 'equal' | 'corresponding', authors: string[]): string[] {
  const hit = new Set<string>();
  for (const name of entry[field] ?? []) {
    const matches = authors.filter((a) => nameKey(a) === nameKey(name));
    if (matches.length !== 1) {
      throw new Error(
        `${entry.key}: ${field} names "${name}", which ${matches.length ? `matches ${matches.length} authors` : 'is not one of its authors'}. ` +
          `Authors: ${authors.join(', ')}`,
      );
    }
    hit.add(matches[0]);
  }
  return authors.filter((a) => hit.has(a));
}

async function resolve(ref: Ref, logger: any): Promise<Meta | null> {
  // OpenAlex first: it resolves arXiv DOIs, which Crossref 404s (they are
  // registered with DataCite). Crossref is the fallback, not the primary.
  const oa = await openalexByDoi(ref.doi, logger);
  if (oa && oa.doi?.toLowerCase() === ref.doi.toLowerCase()) return oa;
  // OpenAlex merges a preprint and its published version into one work, and then
  // answers a lookup by the preprint's DOI with the journal's record. Taking that
  // would associate the two without Crossref's is-preprint-of, which is exactly the
  // fuzzy match the overlay forbids (and it mislabelled preprint links as journals).
  // So a different DOI in the answer means: get the exact record from Crossref.
  const cr = await crossrefByDoi(ref.doi, logger);
  if (cr) return cr;
  if (oa) {
    logger.warn(`${ref.doi}: OpenAlex answered with ${oa.doi} and Crossref has no record; keeping the requested DOI`);
    return { ...oa, doi: ref.doi, url: `https://doi.org/${ref.doi}`, venue: undefined };
  }
  return null;
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
          // A conference paper (NeurIPS, a NeurIPS workshop) has no DOI, so its version
          // of record is a manual block, but it often has an arXiv preprint: link it the
          // same way a journal article links its bioRxiv version.
          if (entry.preprint) {
            preprintMeta = await resolve(entry.preprint, logger);
            fetched++;
          }
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

        const authors = meta.authors ?? [];
        const data = await parseData({
          id: entry.key,
          data: {
            key: entry.key,
            title: meta.title,
            authors,
            equal: marked(entry, 'equal', authors),
            corresponding: marked(entry, 'corresponding', authors),
            // The overlay wins over the API for every field it sets.
            venue: entry.published?.venue ?? entry.preprint?.venue ?? tidyVenue(meta.venue, meta.doi),
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
              ? { doi: preprintMeta.doi, venue: tidyVenue(preprintMeta.venue, preprintMeta.doi), date: preprintMeta.date, url: preprintMeta.url }
              : undefined,
          },
        });
        store.set({ id: entry.key, data, digest });
      }
      logger.info(`resolved ${fetched} records from the API (rest cached)`);
    },
  };
}
