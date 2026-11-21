#!/usr/bin/env node
/**
 * Turn a "Lab member update" issue (.github/ISSUE_TEMPLATE/member.yml) into an edit of
 * src/content/people/<slug>.md, plus a portrait in src/assets/people/<slug>.jpg.
 *
 * Run by .github/workflows/member.yaml, which then validates with `astro check` and
 * opens a PR. It never touches main. Locally:
 *
 *   node scripts/member-from-issue.mjs --body-file issue.md [--dry-run] [--summary out.md]
 *
 * Input is untrusted (it is whatever someone typed into an issue), so every field is
 * validated against a pattern, YAML is written by a serializer rather than by string
 * concatenation, HTML is stripped from the bio, and the portrait is only fetched from
 * GitHub's own attachment hosts.
 *
 * The rules it applies are the content model's (see CLAUDE.md):
 *   - Alumni status comes from `end` and nothing else. Leaving sets `end`.
 *   - A role change APPENDS an appointment. The previous one ends the month the new one
 *     starts, which the team page reads as one continuous tenure.
 *   - `role` is the category; `title` is what the site shows when it differs.
 */
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync, appendFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import sharp from 'sharp';

const PEOPLE = 'src/content/people';
const ASSETS = 'src/assets/people';
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const DRY = flag('--dry-run');
const SUMMARY = opt('--summary');

class Rejected extends Error {}
const reject = (msg) => { throw new Rejected(msg); };

// ── the issue form ─────────────────────────────────────────────────────────────

/** Issue forms render each field as "### <label>\n\n<value>"; empty fields read
 *  "_No response_". Keyed by label, so labels in member.yml must match these. */
function fields(body) {
  const out = {};
  const parts = body.replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = part.slice(0, nl).trim();
    const value = part.slice(nl + 1).trim();
    out[label] = value === '_No response_' ? '' : value;
  }
  return out;
}

const ROLES = (() => {
  const src = readFileSync('src/content.config.ts', 'utf8');
  const block = src.slice(src.indexOf('export const ROLE_ORDER = ['), src.indexOf('] as const;'));
  return [...block.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
})();

// Graduate programs the site knows (src/data/programs.yaml). A form answer is matched by
// the program's id or its full name appearing in the text: "UCSD Neurosciences Graduate
// Program" -> ngp. Anything else is left for a maintainer, and the PR says so.
const PROGRAMS = (() => {
  try { return parse(readFileSync('src/data/programs.yaml', 'utf8')) ?? {}; } catch { return {}; }
})();
const programId = (s) => {
  if (!s) return undefined;
  const t = s.trim().toLowerCase();
  return Object.entries(PROGRAMS).find(([id, p]) => t === id || t.includes(String(p.name).toLowerCase()))?.[0];
};

const YM = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const one = (s, max = 120) => {
  if (!s) return undefined;
  if (/[\n\r]/.test(s) || s.length > max) reject(`"${s.slice(0, 40)}…" should be one short line.`);
  return s.trim();
};
const date = (s, what) => {
  if (!s) return undefined;
  if (!YM.test(s)) reject(`${what} should be YYYY-MM (or YYYY if the month is not known), not "${s}".`);
  return s;
};
const url = (s, what) => {
  if (!s) return undefined;
  let u;
  try { u = new URL(s); } catch { reject(`${what} should be a full URL starting with https://, not "${s}".`); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') reject(`${what} should be an http(s) URL.`);
  return u.href;
};
const handle = (s, what, re = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/) => {
  if (!s) return undefined;
  const v = s.replace(/^@/, '').trim();
  if (!re.test(v)) reject(`${what} "${s}" does not look like a username.`);
  return v;
};

function slugify(name) {
  return name
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Markdown is kept; raw HTML is not, since it would be rendered as-is. */
function cleanBio(s) {
  if (!s) return undefined;
  const t = s.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (t.length > 6000) reject('The bio is over 6000 characters; please shorten it.');
  return t;
}

// ── people files ───────────────────────────────────────────────────────────────

function load(slug) {
  const text = readFileSync(`${PEOPLE}/${slug}.md`, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) reject(`${PEOPLE}/${slug}.md has no front matter.`);
  return { data: parse(m[1]), body: m[2].trim() };
}

function save(slug, data, body) {
  // Every string double-quoted, as the hand-written files are. A bare 2024 would
  // otherwise be read back as a number and fail the schema.
  const order = ['name', 'image', 'page', 'appointments', 'next', 'links'];
  const ordered = Object.fromEntries(
    [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k))].map((k) => [k, data[k]]),
  );
  const fm = stringify(ordered, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN', lineWidth: 0 });
  const text = `---\n${fm}---\n${body ? `\n${body}\n` : ''}`;
  if (!DRY) writeFileSync(`${PEOPLE}/${slug}.md`, text);
  return text;
}

function findExisting(name, slugHint) {
  if (slugHint) {
    if (!/^[a-z0-9-]+$/.test(slugHint)) reject(`"${slugHint}" is not a page name (lowercase letters, digits, hyphens).`);
    if (!existsSync(`${PEOPLE}/${slugHint}.md`)) reject(`There is no page called "${slugHint}".`);
    return slugHint;
  }
  const bySlug = slugify(name);
  if (existsSync(`${PEOPLE}/${bySlug}.md`)) return bySlug;
  for (const f of readdirSync(PEOPLE)) {
    if (!f.endsWith('.md')) continue;
    const m = readFileSync(`${PEOPLE}/${f}`, 'utf8').match(/^name:\s*"?(.+?)"?\s*$/m);
    if (m && m[1].toLowerCase() === name.toLowerCase()) return f.slice(0, -3);
  }
  return undefined;
}

// ── portrait ───────────────────────────────────────────────────────────────────

const ATTACHMENT = /https:\/\/(?:github\.com\/user-attachments\/assets\/[A-Za-z0-9-]+|(?:private-)?user-images\.githubusercontent\.com\/[^\s)"'<>]+)/;

async function portrait(field, slug) {
  if (!field) return { status: 'none' };
  const m = field.match(ATTACHMENT);
  if (!m) return { status: 'skipped', note: 'No image uploaded to the issue was found; add the portrait to the PR by hand.' };
  const headers = {};
  // Attachments on a private repository need a token that can read the repository.
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let res;
  try {
    res = await fetch(m[0], { headers, redirect: 'follow' });
  } catch (e) {
    return { status: 'skipped', note: `The portrait could not be downloaded (${e.message}); add it to the PR by hand.` };
  }
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.startsWith('image/')) {
    return { status: 'skipped', note: `The portrait could not be downloaded (HTTP ${res.status}, ${type || 'no type'}); add it to the PR by hand.` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 25 * 1024 * 1024) reject('The portrait is over 25 MB; please upload a smaller one.');
  const out = `${ASSETS}/${slug}.jpg`;
  // Square, cropped around what the attention heuristic thinks is the subject (usually
  // the face). 800 px is plenty: Astro makes the small sizes from this at build time.
  const img = sharp(buf).rotate().resize(800, 800, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 85, mozjpeg: true });
  if (!DRY) await img.toFile(out);
  return { status: 'saved', path: out };
}

// ── apply ──────────────────────────────────────────────────────────────────────

async function apply(body) {
  const f = fields(body);
  const change = f['Change'];
  const name = one(f['Full name'], 80) ?? reject('The full name is required.');
  if (!/\[x\]/i.test(f['Consent'] ?? '')) reject('The consent box must be ticked before anything goes on the website.');

  const roleField = f['Role'] ?? '';
  const role = roleField.match(/\(([a-z-]+)\)\s*$/)?.[1];
  if (role && !ROLES.includes(role)) reject(`Unknown role "${roleField}".`);
  const title = one(f['Title on the site']);
  const start = date(f['Start (YYYY-MM)'], 'Start');
  const end = date(f['End (YYYY-MM)'], 'End');
  const coAdvisor = one(f['Co-advisor']);
  const programText = one(f['Graduate program']);
  const program = programId(programText);
  const bio = cleanBio(f['Bio']);
  const links = Object.fromEntries(
    Object.entries({
      email: f['Email'] ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f['Email']) ? f['Email'].trim() : reject(`"${f['Email']}" is not an email address.`)) : undefined,
      github: handle(f['GitHub username'], 'GitHub username', /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/),
      linkedin: f['LinkedIn'] ? (/^https?:/.test(f['LinkedIn']) ? url(f['LinkedIn'], 'LinkedIn') : handle(f['LinkedIn'], 'LinkedIn')) : undefined,
      twitter: handle(f['X / Twitter'], 'X / Twitter', /^[A-Za-z0-9_]{1,15}$/),
      'home-page': url(f['Website'], 'Website'),
      orcid: f['ORCID'] ? (/^(https:\/\/orcid\.org\/)?\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(f['ORCID']) ? f['ORCID'].trim() : reject(`"${f['ORCID']}" is not an ORCID iD.`)) : undefined,
      scholar: url(f['Google Scholar'], 'Google Scholar'),
    }).filter(([, v]) => v !== undefined),
  );
  const next = f['Where next'] ? {
    org: one(f['Where next']),
    ...(f['Doing what'] ? { what: one(f['Doing what']) } : {}),
    ...(f['Link for where next'] ? { url: url(f['Link for where next'], 'Link for where next') } : {}),
  } : undefined;

  const existing = findExisting(name, one(f['Existing page'], 60));
  const notes = [];
  if (programText && !program) notes.push(`The graduate program "${programText}" is not in src/data/programs.yaml yet. Add it there and set \`program\` on the appointment.`);
  let slug, data, text;

  if (change === 'Joining the lab') {
    if (existing) reject(`There is already a page for ${name} (${existing}). Use "Updating my entry" or "Changing role" instead.`);
    if (!role) reject('Choose a role.');
    if (!start) reject('Give a start month (YYYY-MM).');
    slug = slugify(name);
    if (!slug) reject('The name has no letters that can make a page address.');
    data = {
      name,
      appointments: [{ role, ...(title ? { title } : {}), start, ...(coAdvisor ? { coAdvisor } : {}), ...(program ? { program } : {}) }],
      ...(Object.keys(links).length ? { links } : {}),
    };
    text = bio ?? '';
    if (!bio) notes.push('No bio was given, so the page has a header only. Add one with a follow-up update.');
  } else {
    if (!existing) reject(`No page found for "${name}". Check the spelling, or give the page name in "Existing page".`);
    slug = existing;
    ({ data, body: text } = load(slug));
    const appts = data.appointments;
    const last = appts[appts.length - 1];

    if (change === 'Updating my entry') {
      if (title) last.title = title;
      if (coAdvisor) last.coAdvisor = coAdvisor;
      if (program) last.program = program;
    } else if (change === 'Changing role') {
      if (last.end) reject(`${name} is recorded as having left (${last.end}). A role change needs a current appointment.`);
      if (!role) reject('Choose the new role.');
      if (!start) reject('Give the month the new role starts (YYYY-MM).');
      if (last.start && start < last.start) reject(`The new role cannot start (${start}) before the current one did (${last.start}).`);
      // Close the current appointment the month the new one starts: a handover, which
      // the team page reads as one continuous tenure. Never overwrite it.
      last.end = start;
      appts.push({ role, ...(title ? { title } : {}), start, ...(coAdvisor ? { coAdvisor } : {}), ...(program ? { program } : {}) });
    } else if (change === 'Leaving the lab') {
      if (last.end) reject(`${name} is already recorded as having left (${last.end}).`);
      if (!end) reject('Give the last month in the lab (YYYY-MM). Leaving without an end date is the bug the content model exists to prevent.');
      if (last.start && end < last.start) reject(`The end (${end}) is before the start (${last.start}).`);
      last.end = end;
      if (next) data.next = next;
    } else {
      reject(`Unknown change "${change}".`);
    }
    if (Object.keys(links).length) data.links = { ...(data.links ?? {}), ...links };
    if (bio) text = bio;
  }

  const photo = await portrait(f['Portrait'], slug);
  if (photo.status === 'saved') {
    const rel = `../../assets/people/${slug}.jpg`;
    // Drop a previous portrait with another extension so it is not left orphaned.
    if (data.image && data.image !== rel) {
      const old = data.image.replace('../../assets/people/', `${ASSETS}/`);
      if (!DRY && existsSync(old) && old.startsWith(`${ASSETS}/`)) unlinkSync(old);
    }
    data.image = rel;
  } else if (photo.note) {
    notes.push(photo.note);
  }

  const written = save(slug, data, text);
  return { change, name, slug, photo: photo.status, notes, written };
}

// ── main ───────────────────────────────────────────────────────────────────────

const body = opt('--body-file') ? readFileSync(opt('--body-file'), 'utf8') : process.env.ISSUE_BODY ?? '';
const out = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);

try {
  const r = await apply(body);
  const verb = { 'Joining the lab': 'Add', 'Updating my entry': 'Update', 'Changing role': 'Role change for', 'Leaving the lab': 'Departure of' }[r.change];
  const lines = [
    `**${r.change}: ${r.name}** → \`${PEOPLE}/${r.slug}.md\``,
    '',
    `Portrait: ${{ saved: `saved to \`${ASSETS}/${r.slug}.jpg\` (800 px square)`, none: 'none given', skipped: 'not saved' }[r.photo]}`,
    ...(r.notes.length ? ['', ...r.notes.map((n) => `- ${n}`)] : []),
    '',
    '<details><summary>The file as written</summary>',
    '',
    '```markdown',
    r.written.trim(),
    '```',
    '</details>',
  ];
  if (SUMMARY) writeFileSync(SUMMARY, lines.join('\n') + '\n');
  out('slug', r.slug);
  out('title', `${verb} ${r.name}`);
  console.log(lines.join('\n'));
  if (DRY) console.log('\n(dry run: nothing written)');
} catch (e) {
  if (!(e instanceof Rejected)) throw e;
  const msg = `This update could not be applied: ${e.message}\n\nEdit the issue to fix it and the check runs again.`;
  if (SUMMARY) writeFileSync(SUMMARY.replace(/\.md$/, '') + '.error.md', msg + '\n');
  console.error(msg);
  process.exit(2);
}
