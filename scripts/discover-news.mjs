#!/usr/bin/env node
/**
 * Phase 4 news discovery: new GitHub releases in the curated repos become DRAFT
 * news items (decision 4b — queued, never auto-published).
 *
 * Every item is written with `draft: true`, so merging the PR still does not put
 * it on the site; a human clears the flag. Two gates rather than one, because a
 * release title is not necessarily something the lab wants to announce.
 *
 * Usage: node scripts/discover-news.mjs [--write] [--since YYYY-MM-DD] [--report FILE]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const REPORT = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;
const SINCE = args.includes('--since')
  ? args[args.indexOf('--since') + 1]
  // Default window matches the weekly schedule, with slack for a missed run.
  : new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10);

const NEWS_DIR = 'src/content/news';

function headers() {
  const h = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
  const t = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (t) h.authorization = `Bearer ${t}`;
  return h;
}

/** Patch releases are not news. Across these repos, taking every release produced
 *  45 items in eight months — roughly one every five days, which is a changelog,
 *  not an announcement, and it would train whoever reviews the PR to ignore it.
 *  Minor and major only (x.y.0), plus anything not following semver, which is left
 *  in rather than guessed about. */
function isNewsworthy(tag) {
  const m = /v?(\d+)\.(\d+)\.(\d+)/.exec(tag ?? '');
  if (!m) return true;
  return m[3] === '0';
}

const repos = [...readFileSync('src/data/repos.yaml', 'utf8').matchAll(/^- repo:\s*(\S+)/gm)].map(
  (m) => m[1],
);

// Whatever already exists, however it was named, so a re-run cannot duplicate.
const existing = new Set();
if (existsSync(NEWS_DIR)) {
  for (const f of readdirSync(NEWS_DIR)) {
    if (f.endsWith('.md')) existing.add(f.replace(/\.md$/, ''));
  }
}

const found = [];
for (const repo of repos) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=10`, {
    headers: headers(),
  });
  if (!res.ok) {
    console.warn(`${repo}: GitHub returned ${res.status}; skipping`);
    continue;
  }
  for (const rel of await res.json()) {
    if (rel.draft || rel.prerelease) continue;
    if (!isNewsworthy(rel.tag_name)) continue;
    const date = (rel.published_at ?? '').slice(0, 10);
    if (!date || date < SINCE) continue;
    const name = repo.split('/')[1];
    const slug = `${date}-${name}-${(rel.tag_name ?? '').replace(/[^\w.]+/g, '-')}`.toLowerCase();
    if (existing.has(slug)) continue;
    found.push({ repo, name, tag: rel.tag_name, date, slug, url: rel.html_url });
  }
}

const L = [];
L.push('## News discovery');
L.push('');
L.push(`Releases across ${repos.length} repos since ${SINCE}.`);
L.push('');
if (found.length === 0) {
  L.push('Nothing new. No action needed.');
} else {
  L.push(`### ${found.length} draft news item(s)`);
  L.push('');
  L.push('All written with `draft: true`, so merging this PR does **not** publish them.');
  L.push('Clear the flag on the ones worth announcing and delete the rest.');
  L.push('');
  for (const f of found) L.push(`- \`${f.name}\` **${f.tag}** — ${f.date} — ${f.url}`);
}
const report = L.join('\n');
if (REPORT) writeFileSync(REPORT, report);
console.log(report);

if (WRITE && found.length) {
  mkdirSync(NEWS_DIR, { recursive: true });
  for (const f of found) {
    const body = [
      '---',
      `title: "${f.name} ${f.tag} released"`,
      `date: ${f.date}`,
      `url: "${f.url}"`,
      '# Queued by scripts/discover-news.mjs. Clear this flag to publish (decision 4b).',
      'draft: true',
      '---',
      '',
    ].join('\n');
    writeFileSync(`${NEWS_DIR}/${f.slug}.md`, body);
  }
  console.log(`\nwrote ${found.length} draft item(s) to ${NEWS_DIR}`);
}
