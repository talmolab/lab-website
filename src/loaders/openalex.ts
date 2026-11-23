import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
  /** Co-first (equal-contribution), corresponding and jointly supervising (co-senior)
   *  authors, as named on the paper. */
  equal?: string[];
  corresponding?: string[];
  senior?: string[];
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
 * 4 s, plus jitter; a Retry-After header wins, capped at 30 s). A single failed lookup
 * fails the build, so when every build resolved every entry, a one-off 429 or 503 from
 * OpenAlex blocked a production deploy until someone re-ran it (twice on 2026-11-20,
 * for entries that resolved on the job before and after). Builds now ask only about
 * DOIs missing from the snapshot (below), but a refresh still asks about all of them.
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

/** An API's answer for one DOI. `answered` is false when the API never gave a real answer
 *  (still throttled or failing after every retry): a 404 is an answer, a 503 is not. */
type Answer = { meta: Meta | null; answered: boolean };

async function openalexByDoi(doi: string, logger: any): Promise<Answer> {
  const url = new URL(`${OPENALEX}/works/doi:${doi}`);
  url.searchParams.set('mailto', MAILTO);
  const k = key();
  if (k) url.searchParams.set('api_key', k);
  const res = await fetchWithRetry(url, `OpenAlex ${doi}`, logger);
  if (!res.ok) {
    if (res.status !== 404) logger.warn(`OpenAlex ${doi}: HTTP ${res.status}`);
    return { meta: null, answered: res.status === 404 };
  }
  const w: any = await res.json();
  const cost = w?.meta?.cost_usd;
  if (cost) logger.info(`openalex cost ${cost} for ${doi}`);
  return {
    answered: true,
    meta: {
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
    },
  };
}

async function crossrefByDoi(doi: string, logger?: any): Promise<Answer> {
  const res = await fetchWithRetry(`${CROSSREF}/works/${doi}?mailto=${MAILTO}`, `Crossref ${doi}`, logger);
  // Crossref 404s arXiv DOIs by design (DataCite registers them): that is an answer.
  if (!res.ok) return { meta: null, answered: res.status === 404 };
  const m: any = (await res.json()).message;
  const parts = m.issued?.['date-parts']?.[0] ?? [];
  return {
    answered: true,
    meta: {
      title: Array.isArray(m.title) ? m.title[0] : m.title,
      authors: (m.author ?? []).map((a: any) => `${a.given ?? ''} ${a.family ?? ''}`.trim()),
      // Posted content (bioRxiv, medRxiv) has no container; the server is the institution.
      venue: (Array.isArray(m['container-title']) ? m['container-title'][0] : undefined) ?? m.institution?.[0]?.name,
      date: parts.length ? parts.map((n: number, i: number) => (i ? String(n).padStart(2, '0') : n)).join('-') : undefined,
      doi: m.DOI,
      url: m.URL,
      type: m.type,
    },
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
 * The authors an overlay entry marks as `equal`, `corresponding` or `senior`, as `authors` prints
 * them and in author order. Names are matched by nameKey, so "Talmo Pereira" finds
 * "Talmo D. Pereira". A name that matches no author, or more than one, fails the build:
 * a typo would otherwise mark nobody, or the wrong person, without a word.
 */
function marked(entry: OverlayEntry, field: 'equal' | 'corresponding' | 'senior', authors: string[]): string[] {
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

/** A lookup's result, and whether both APIs it consulted gave a real answer. A
 *  `complete: false` result is a fallback (OpenAlex throttled, so Crossref's thinner
 *  record) and is good for one build but never written to the snapshot. */
type Resolved = { meta: Meta | null; complete: boolean };

async function resolve(ref: Ref, logger: any): Promise<Resolved> {
  // OpenAlex first: it resolves arXiv DOIs, which Crossref 404s (they are
  // registered with DataCite). Crossref is the fallback, not the primary.
  const oa = await openalexByDoi(ref.doi, logger);
  if (oa.meta && oa.meta.doi?.toLowerCase() === ref.doi.toLowerCase()) return { meta: oa.meta, complete: true };
  // OpenAlex merges a preprint and its published version into one work, and then
  // answers a lookup by the preprint's DOI with the journal's record. Taking that
  // would associate the two without Crossref's is-preprint-of, which is exactly the
  // fuzzy match the overlay forbids (and it mislabelled preprint links as journals).
  // So a different DOI in the answer means: get the exact record from Crossref.
  const cr = await crossrefByDoi(ref.doi, logger);
  const complete = oa.answered && cr.answered;
  if (cr.meta) return { meta: cr.meta, complete };
  if (oa.meta) {
    logger.warn(`${ref.doi}: OpenAlex answered with ${oa.meta.doi} and Crossref has no record; keeping the requested DOI`);
    return { meta: { ...oa.meta, doi: ref.doi, url: `https://doi.org/${ref.doi}`, venue: undefined }, complete };
  }
  return { meta: null, complete };
}

/**
 * What OpenAlex and Crossref answered, committed beside the overlay
 * (`src/data/publications.resolved.json`) so that builds do not ask again:
 *
 *   { "<overlay key>": { "<DOI as asked, lowercased>": Meta | null } }
 *
 * The answer for a DOI changes rarely (citation counts, now and then a corrected
 * title), so a build asks the APIs only about a DOI this file lacks: a new entry, or a
 * DOI that changed. Everything else an entry says (venue and date overrides, marks,
 * tags, image, links) is applied at build time on top, so editing it fetches nothing.
 * `null` is a DOI both APIs answered with nothing (a preprint link that never
 * resolved), kept so it is not asked about on every build.
 *
 * REFRESH_PUBLICATIONS=1 asks about every DOI again. discover.yaml does that each
 * Monday and commits the result in its PR, which is how citation counts stay current.
 *
 * Keys and DOIs are sorted so the file diffs cleanly; DOIs the overlay no longer
 * names are dropped whenever it is written.
 */
type Snapshot = Record<string, Record<string, Meta | null>>;

function serialize(snapshot: Snapshot): string {
  const sorted = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const out: Snapshot = {};
  for (const [key, dois] of Object.entries(sorted(snapshot))) out[key] = sorted(dois);
  return `${JSON.stringify(out, null, 2)}\n`;
}

export function publications(
  file = 'src/data/publications.yaml',
  snapshotFile = file.replace(/\.ya?ml$/, '.resolved.json'),
): Loader {
  return {
    name: 'publications',
    async load({ store, logger, parseData, generateDigest }) {
      const overlay = parse(readFileSync(file, 'utf8')) as OverlayEntry[];
      const refresh = /^(1|true|yes)$/i.test(process.env.REFRESH_PUBLICATIONS ?? '');
      const before = existsSync(snapshotFile) ? readFileSync(snapshotFile, 'utf8').replace(/\r\n/g, '\n') : '';
      const snapshot: Snapshot = before ? JSON.parse(before) : {};
      const next: Snapshot = {};
      const asked: string[] = [];
      let reused = 0;
      logger.info(`${overlay.length} curated publications${refresh ? '; REFRESH_PUBLICATIONS is set, so every DOI is fetched again' : ''}`);

      /** The metadata for one of an entry's DOIs: from the snapshot when it has it (and
       *  this is not a refresh), otherwise from the APIs. Whatever the build uses is
       *  carried into the next snapshot, except a fallback the APIs never confirmed. */
      async function lookup(key: string, ref: Ref): Promise<Meta | null> {
        const doi = ref.doi.toLowerCase();
        const held = snapshot[key] ?? {};
        const has = Object.hasOwn(held, doi);
        const keep = (meta: Meta | null) => ((next[key] ??= {})[doi] = meta);
        if (has && !refresh) {
          reused++;
          return keep(held[doi]);
        }
        asked.push(`${key} (${ref.doi})`);
        let result: Resolved;
        try {
          result = await resolve(ref, logger);
        } catch (e) {
          // The network never answered. With nothing to fall back on the build fails, as
          // it always has; on a refresh, last week's record stands.
          if (!has) throw e;
          logger.warn(`${key}: ${String(e)}; keeping the snapshot's record`);
          return keep(held[doi]);
        }
        const { meta, complete } = result;
        // A complete answer replaces what the snapshot held, unless it would replace a
        // record with nothing: a DOI does not stop existing, an API has a bad day.
        if (complete && (meta || !held[doi])) return keep(meta);
        if (has) {
          logger.warn(
            `${key}: ${ref.doi} ${complete ? 'resolved to nothing' : 'got no full answer from OpenAlex and Crossref'}; keeping the snapshot's record`,
          );
          return keep(held[doi]);
        }
        // Nothing to fall back on: use the fallback for this build only, so the next
        // build asks again rather than inheriting it.
        logger.warn(`${key}: ${ref.doi} got no full answer from OpenAlex and Crossref; not recording it`);
        return meta;
      }

      for (const entry of overlay) {
        let meta: Meta | null = null;
        let preprintMeta: Meta | null = null;

        if (entry.manual) {
          meta = entry.manual as unknown as Meta;
          // A conference paper (NeurIPS, a NeurIPS workshop) has no DOI, so its version
          // of record is a manual block, but it often has an arXiv preprint: link it the
          // same way a journal article links its bioRxiv version.
          if (entry.preprint) preprintMeta = await lookup(entry.key, entry.preprint);
        } else {
          const primary = entry.published ?? entry.preprint;
          if (!primary) throw new Error(`${entry.key}: needs published, preprint or manual`);
          meta = await lookup(entry.key, primary);
          if (!meta) throw new Error(`${entry.key}: could not resolve ${primary.doi}`);
          if (entry.published && entry.preprint) preprintMeta = await lookup(entry.key, entry.preprint);
        }
        // A preprint beside a published or manual version is a link; alone, it is the
        // entry itself and has already failed loudly above.
        if (entry.preprint && (entry.published || entry.manual) && !preprintMeta) {
          logger.warn(`${entry.key}: preprint ${entry.preprint.doi} does not resolve; listed without its preprint link`);
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
            senior: marked(entry, 'senior', authors),
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
        // Every entry is rebuilt from the overlay and the snapshot on every run (no
        // network, so it costs nothing), which keeps the store in step with both.
        store.set({ id: entry.key, data, digest: generateDigest(data) });
      }
      // An entry taken out of the overlay leaves the site, even with a warm store.
      const keys = new Set(overlay.map((e) => e.key));
      for (const id of store.keys()) if (!keys.has(id)) store.delete(id);

      logger.info(`${reused} DOIs from ${snapshotFile}, ${asked.length} requested from OpenAlex/Crossref`);
      if (asked.length && !refresh) {
        const msg =
          `${asked.length} DOI(s) not in ${snapshotFile} were fetched: ${asked.join(', ')}. ` +
          (process.env.CI
            ? 'Build locally and commit the updated file, or every CI build will fetch them again.'
            : 'Commit the updated file with the overlay change.');
        logger.warn(msg);
        if (process.env.GITHUB_ACTIONS) console.log(`::warning file=${snapshotFile}::${msg}`);
      }

      const after = serialize(next);
      if (after !== before) {
        // In CI the copy is thrown away, and nothing depends on it: a later build
        // just fetches the same DOIs again.
        writeFileSync(snapshotFile, after);
        logger.info(`updated ${snapshotFile}`);
      }
    },
  };
}
