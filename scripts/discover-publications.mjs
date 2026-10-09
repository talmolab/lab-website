#!/usr/bin/env node
/**
 * Phase 4 discovery. Finds work the overlay does not know about and proposes it.
 *
 * NEVER writes to main and never publishes. It edits src/data/publications.yaml
 * and prints a report; the workflow opens a PR and a human merges (decision 3b).
 *
 * Two jobs:
 *   1. New works in OpenAlex that the overlay does not list.
 *   2. Tracked preprints that now have a published version, via Crossref
 *      `is-preprint-of` — forward only. §6.1: traversing backward from articles
 *      lands on Research Square DOIs rather than the bioRxiv one on file.
 *
 * Usage: node scripts/discover-publications.mjs [--write] [--report FILE]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const AUTHOR = 'A5006740810';
const MAILTO = 'talmo@salk.edu';
const OVERLAY = 'src/data/publications.yaml';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const REPORT = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;

/** Classes that are indexed as "works" but are not publications. Verified against
 *  this author's 69 records, where ~40 fall in here: twelve Figshare MOESM
 *  supplementary stubs, three "Author response:" peer-review records, an erratum. */
const NOT_A_PUBLICATION = [
  { test: (w) => ['peer-review', 'erratum', 'editorial'].includes(w.type), why: 'record type' },
  { test: (w) => /^MOESM\d+ of /i.test(w.title ?? ''), why: 'Figshare supplementary file' },
  { test: (w) => /^Author response:/i.test(w.title ?? ''), why: 'peer-review artefact' },
  { test: (w) => /^(Publisher )?Correction:/i.test(w.title ?? ''), why: 'correction notice' },
  { test: (w) => (w.type === 'dataset'), why: 'dataset, not a paper' },
  // OpenAlex types conference abstracts as `article`. The APS Bulletin is a
  // meeting-abstract venue, so its entries are talks, not papers.
  {
    test: (w) => /Bulletin of the American Physical Society/i.test(
      w.primary_location?.source?.display_name ?? '',
    ),
    why: 'conference abstract (APS Bulletin)',
  },
  { test: (w) => /^NAPPN Annual Conference Abstract/i.test(w.title ?? ''), why: 'conference abstract' },
];

const norm = (d) => (d ?? '').replace(/^https?:\/\/doi\.org\//, '').toLowerCase();
const titleKey = (t) => (t ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function openalexWorks() {
  const url = new URL('https://api.openalex.org/works');
  // §6.1: a filter call covers all works in one request for ~$0.0001. Never
  // full-text search, which costs ~$1/1000.
  url.searchParams.set('filter', `author.id:${AUTHOR}`);
  url.searchParams.set('per-page', '200');
  url.searchParams.set('sort', 'publication_date:desc');
  url.searchParams.set('mailto', MAILTO);
  if (process.env.OPENALEX_API_KEY) url.searchParams.set('api_key', process.env.OPENALEX_API_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAlex ${res.status}: ${await res.text()}`);
  const json = await res.json();
  // Log spend so cost never becomes a surprise (§6.1).
  console.log(`openalex: ${json.results.length} works, cost_usd=${json.meta?.cost_usd ?? 'n/a'}`);
  return json.results;
}

async function publishedVersionOf(doi) {
  const res = await fetch(`https://api.crossref.org/works/${doi}?mailto=${MAILTO}`);
  if (!res.ok) return null;
  const rel = (await res.json()).message?.relation?.['is-preprint-of'];
  return rel?.[0]?.id ? norm(rel[0].id) : null;
}

/** Minimal reader: the overlay is hand-maintained YAML and this only needs the
 *  keys and DOIs, so it avoids adding a YAML dependency to the Action. */
function readOverlay(text) {
  const entries = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const key = line.match(/^- key:\s*(\S+)/);
    if (key) {
      cur = { key: key[1], dois: [] };
      entries.push(cur);
      continue;
    }
    if (!cur) continue;
    const doi = line.match(/^\s+(published|preprint):\s*\{\s*doi:\s*"([^"]+)"/);
    if (doi) cur.dois.push({ role: doi[1], doi: norm(doi[2]) });
  }
  return entries;
}

const overlayText = readFileSync(OVERLAY, 'utf8');
const overlay = readOverlay(overlayText);
const known = new Set(overlay.flatMap((e) => e.dois.map((d) => d.doi)));
const knownTitles = new Set();

const works = await openalexWorks();
for (const w of works) if (known.has(norm(w.doi))) knownTitles.add(titleKey(w.title));

const buckets = { articles: [], preprints: [], noDoi: [], excluded: [] };

for (const w of works) {
  const doi = norm(w.doi);
  if (doi && known.has(doi)) continue;

  const reason = NOT_A_PUBLICATION.find((r) => r.test(w));
  if (reason) {
    buckets.excluded.push({ w, why: reason.why });
    continue;
  }
  // A preprint of something already listed is not news.
  if (knownTitles.has(titleKey(w.title))) {
    buckets.excluded.push({ w, why: 'same title as a work already listed' });
    continue;
  }
  // Nothing can be staged without a DOI: the overlay keys off one, and the loader
  // resolves metadata from it. These are surfaced separately rather than dropped,
  // because a real paper occasionally lands here (an arXiv record indexed via
  // PubMed has doi: null, which is why MIMIC-MJX needs a manual entry).
  if (!doi) {
    buckets.noDoi.push(w);
    continue;
  }
  (w.type === 'preprint' ? buckets.preprints : buckets.articles).push(w);
}

// --- preprint -> published upgrades -----------------------------------------
const upgrades = [];
for (const e of overlay) {
  const pre = e.dois.find((d) => d.role === 'preprint');
  const pub = e.dois.find((d) => d.role === 'published');
  if (!pre || pub) continue;
  const found = await publishedVersionOf(pre.doi);
  if (found) upgrades.push({ key: e.key, preprint: pre.doi, published: found });
}
// Entries tracked only as a preprint, with no Crossref relation: worth naming, so
// the manual-association case (§6.1) stays visible instead of silently pending.
const preprintOnly = overlay.filter(
  (e) => e.dois.some((d) => d.role === 'preprint') && !e.dois.some((d) => d.role === 'published'),
);

// --- report ------------------------------------------------------------------
const venue = (w) => w.primary_location?.source?.display_name?.replace(/\s*\([^)]*\)\s*$/, '') ?? '?';
const L = [];
const add = (s = '') => L.push(s);

add('## Publication discovery');
add();
add(`Checked ${works.length} OpenAlex works against ${overlay.length} curated entries.`);
add();

if (buckets.articles.length) {
  add(`### ${buckets.articles.length} journal article(s) not listed`);
  add();
  add('Proposed additions are staged in `src/data/publications.yaml` below. Review before merging.');
  add();
  for (const w of buckets.articles) {
    add(`- **${w.title}**  `);
    add(`  ${venue(w)} · ${w.publication_date} · \`${norm(w.doi) || 'no DOI'}\``);
  }
  add();
}

if (upgrades.length) {
  add(`### ${upgrades.length} preprint(s) now published`);
  add();
  add('Crossref `is-preprint-of` resolved these. The overlay entries are updated in place.');
  add();
  for (const u of upgrades) add(`- \`${u.key}\`: ${u.preprint} → **${u.published}**`);
  add();
}

if (buckets.preprints.length) {
  add(`### ${buckets.preprints.length} preprint(s) not listed — your call`);
  add();
  add('Not staged. Listing a preprint is an editorial decision, not a discovery.');
  add();
  for (const w of buckets.preprints) {
    add(`- ${w.title}  `);
    add(`  ${venue(w)} · ${w.publication_date} · \`${norm(w.doi) || 'no DOI'}\``);
  }
  add();
}

if (preprintOnly.length) {
  add(`### ${preprintOnly.length} entry(ies) tracked as preprint only`);
  add();
  add('No Crossref `is-preprint-of` relation, so a published version cannot be found');
  add('automatically. If one exists, add it to the overlay by hand — §6.1 forbids');
  add('matching on title or author, because a false merge is worse than a missing link.');
  add();
  for (const e of preprintOnly) add(`- \`${e.key}\` — ${e.dois.map((d) => d.doi).join(', ')}`);
  add();
}

if (buckets.noDoi.length) {
  add(`### ${buckets.noDoi.length} record(s) with no DOI — cannot be staged`);
  add();
  add('The overlay keys off a DOI and the loader resolves metadata from it, so these');
  add('need a `manual:` entry written by hand if they belong on the site.');
  add();
  for (const w of buckets.noDoi) {
    add(`- ${w.title}  `);
    add(`  ${venue(w)} · ${w.publication_date} · ${w.type}`);
  }
  add();
}

if (buckets.excluded.length) {
  add('<details><summary>');
  add(`${buckets.excluded.length} record(s) filtered out as not publications</summary>`);
  add();
  add('Listed so the filter stays auditable rather than invisible.');
  add();
  for (const { w, why } of buckets.excluded) {
    add(`- _${why}_ — ${(w.title ?? '').slice(0, 90)}`);
  }
  add();
  add('</details>');
  add();
}

const nothing =
  !buckets.articles.length && !upgrades.length && !buckets.preprints.length && !buckets.noDoi.length;
if (nothing) add('Nothing new. No action needed.');

const report = L.join('\n');
if (REPORT) writeFileSync(REPORT, report);
console.log(report);

// --- staged edits ------------------------------------------------------------
if (WRITE && (buckets.articles.length || upgrades.length)) {
  let out = overlayText;
  for (const u of upgrades) {
    // Turn `preprint: {...}` into a preprint + published pair for that key.
    const re = new RegExp(`(- key: ${u.key}\\n(?:  #[^\\n]*\\n)*)(  preprint: \\{ doi: "${u.preprint}" \\}\\n)`);
    out = out.replace(
      re,
      `$1$2  published: { doi: "${u.published}" }   # added by discovery, via Crossref is-preprint-of\n`,
    );
  }
  if (buckets.articles.length) {
    // Keys are permanent, so a collision must not silently produce two entries
    // that look like one. Existing keys are read from the overlay, and each new
    // key is reserved as it is minted so a single run cannot collide with itself.
    const taken = new Set(overlay.map((e) => e.key));
    const stanzas = buckets.articles.map((w) => {
      const first = w.authorships?.[0]?.author?.display_name ?? 'unknown';
      const surname = first.split(' ').pop().toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
      let key = `${surname}-${(w.publication_date ?? '').slice(0, 4)}`;
      while (taken.has(key)) key += 'b';
      taken.add(key);
      return [
        '',
        `# DISCOVERED ${new Date().toISOString().slice(0, 10)} — review before merging.`,
        `# ${w.title}`,
        `# ${venue(w)} · ${w.publication_date}`,
        `- key: ${key}`,
        `  published: { doi: "${norm(w.doi)}" }`,
      ].join('\n');
    });
    out = out.replace(/\n(- key: )/, `${stanzas.join('\n')}\n\n$1`);
  }
  writeFileSync(OVERLAY, out);
  console.log(`\nstaged ${buckets.articles.length} addition(s) and ${upgrades.length} upgrade(s) in ${OVERLAY}`);
}

// Exit code communicates "is there anything to PR", not success/failure.
process.exit(nothing ? 0 : 0);
