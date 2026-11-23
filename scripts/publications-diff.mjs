#!/usr/bin/env node
/**
 * What a metadata refresh changed in src/data/publications.resolved.json, against the
 * committed copy (git HEAD), as Markdown for the weekly discovery PR. Citation counts
 * move every week and are summed up in one line; any other change (a corrected title, a
 * new author, a venue) is listed, since merging puts it on the site.
 *
 * Usage: node scripts/publications-diff.mjs [--report FILE]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/data/publications.resolved.json';
const args = process.argv.slice(2);
const REPORT = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;

const parse = (text) => (text ? JSON.parse(text) : {});
let before = {};
try {
  before = parse(execFileSync('git', ['show', `HEAD:${FILE}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
} catch {
  // Not committed yet: everything is new.
}
const after = parse(existsSync(FILE) ? readFileSync(FILE, 'utf8') : '');

const FIELDS = ['title', 'authors', 'venue', 'date', 'doi', 'url', 'type'];
const show = (v) => (v === undefined ? '(none)' : `"${v}"`);
/** One field's change, in words. Author lists say who came and went, since a respelt
 *  name is exactly what breaks an `equal`/`corresponding`/`senior` mark. */
function describe(f, a, b) {
  if (f !== 'authors') return `${f} ${show(a)} → ${show(b)}`;
  const [was, is] = [a ?? [], b ?? []];
  const moves = [...was.filter((n) => !is.includes(n)).map((n) => `−${n}`), ...is.filter((n) => !was.includes(n)).map((n) => `+${n}`)];
  return `authors ${moves.length ? moves.join(', ') : 'reordered'}`;
}
const flat = (snap) =>
  new Map(Object.entries(snap).flatMap(([key, dois]) => Object.entries(dois).map(([doi, m]) => [`${key} ${doi}`, m])));

const old = flat(before);
const now = flat(after);
const other = [];
let moved = 0;
let delta = 0;

for (const [id, m] of now) {
  const [key, doi] = id.split(' ');
  const label = `\`${key}\` (${doi})`;
  if (!old.has(id)) {
    other.push(`${label}: new record${m ? `, "${m.title}"` : ', does not resolve'}`);
    continue;
  }
  const o = old.get(id);
  if (!o || !m) {
    if (o !== m) other.push(`${label}: ${m ? 'resolves now' : 'no longer resolves'}`);
    continue;
  }
  const changed = FIELDS.filter((f) => JSON.stringify(o[f]) !== JSON.stringify(m[f]));
  if (changed.length) other.push(`${label}: ${changed.map((f) => describe(f, o[f], m[f])).join('; ')}`);
  if (o.citations !== m.citations) {
    moved++;
    delta += (m.citations ?? 0) - (o.citations ?? 0);
  }
}
for (const id of old.keys()) {
  if (!now.has(id)) {
    const [key, doi] = id.split(' ');
    other.push(`\`${key}\` (${doi}): record dropped (no longer in the overlay)`);
  }
}

const L = ['## Paper metadata', ''];
if (!moved && !other.length) {
  L.push(`Refetched every DOI in the overlay; \`${FILE}\` is unchanged.`);
} else {
  L.push(`Refetched every DOI in the overlay into \`${FILE}\`. Merging puts this on the site.`, '');
  if (moved) L.push(`- Citation counts changed for ${moved} record(s), ${delta >= 0 ? '+' : ''}${delta} in all.`);
  if (other.length) {
    L.push(`- ${other.length} other change(s), worth a look:`);
    for (const line of other) L.push(`  - ${line}`);
  }
}
L.push('');

const report = L.join('\n');
if (REPORT) writeFileSync(REPORT, report);
console.log(report);
