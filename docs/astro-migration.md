# talmolab.org — Astro Migration Handoff

> Moved into the repo 2026-08-30 so it survives outside one machine's scratch directory.
> Sections 1–12 are the original plan as written 2026-08-29; §13 is the running decision log.
> Where the two disagree, §13 is newer.

**Target repo:** `talmolab/lab-website`
**Strategy:** in-place migration on a new branch; `main` keeps serving the live Jekyll site until DNS cutover.
**Status of this doc:** architecture decisions are locked. Implementation details are expected to be iterated on during the session.

---

## 1. Mission

Replace the Greene Lab Jekyll template with a modern Astro 6 site. Three goals, in priority order:

1. **Fix the publication list.** It is badly stale and is actively misrepresenting the lab's output (details in §3). This is the highest-value change and matters for in-flight grant applications.
2. **Make the content model structural** rather than hand-maintained prose, so staleness becomes hard instead of easy.
3. **Modernize the frontend** and add a working blog/news surface.

Non-goals for v1: download/usage statistics, AIRC or SLEAP site consolidation, redesigning the Research page's written content.

---

## 2. Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Component library | **Starwind UI** + Tailwind CSS v4 |
| 2 | Host / deploy | **Cloudflare Workers**, pure static assets. No SSR, no adapter. |
| 3 | Publication source of truth | **OpenAlex** by author ID, auto-discovered, with a curated local overlay |
| 3b | New publication handling | **Open a PR**, never auto-commit to `main` |
| 4 | Blog structure | **Two collections, one merged reverse-chron stream** |
| 4b | Derived news items | **Queued for approval via PR**, not auto-published |
| 5 | Interactivity | **Zero-JS baseline** + Pagefind for static search |
| 6 | Editor UI | **None.** Git + Claude Code skills only. Keystatic explicitly deferred. |
| 7 | Migration | **In-place**, on a branch in `talmolab/lab-website` |
| 8 | Tools page | **Curated repo list**, no usage stats. GitHub token for rate limits. |

---

## 3. Verified current state

Facts below were confirmed by cloning the repo and querying live APIs on 2026-08-29. Do not re-derive; do re-verify anything that looks stale by the time you run.

### Stack
- Jekyll, generated from `greenelab/lab-website-template` v0.4.1 (2021-08-23). 142 commits.
- **No build workflow.** The only GitHub Action is `auto-cite.yaml`. The site is built by *classic* GitHub Pages Jekyll (hence `theme: null` and the whitelisted-plugin constraint).
- Hosting confirmed via headers: GitHub Pages origin (Fastly — `via: 1.1 varnish`, `x-served-by: cache-chi-*`) behind Cloudflare DNS. **Cloudflare already fronts the domain**, which makes the Workers move a DNS change rather than a new dependency.
- `CNAME` file present. `/sitemap.xml` → 200. **`/feed.xml` → 404** — there is no RSS feed today, because `jekyll-feed` is commented out in `_config.yaml`.
- Assets: `images/` is 19 MB across 67 files. `css/` is 1,801 lines of Greene template SCSS across 38 partials (to be discarded).
- `/f/RAPTR_HPI_Recruitment.pdf` is a short-link recruitment PDF. **Must keep working.**

### Content
- `_members/` — 55 markdown files. Frontmatter: `name`, `image`, `role`, `description` (free text), `links` (map). Body is prose bio.
- `_data/sources.yaml` — 26 hand-maintained entries, mostly `id: doi:...` plus optional `publisher`/`image`, with a few fully-manual entries (e.g. Maree 2024, a PDF link with no DOI).
- `_data/citations.yaml` — generated, marked DO NOT EDIT.
- `_data/roles.yaml` — 12 roles with FontAwesome icons.
- `_data/tools.yaml` — **still 100% template lorem ipsum** ("Cool Dataset", `repo: greenelab/lab-website-template`).
- `_posts/` — only the three 2019–2020 template example posts.
- `blog/index.md` — exists, nav commented out, **still embeds @GreeneScientist's Twitter timeline**.
- `tools/index.md` — exists, nav commented out, lorem ipsum body.
- Nav is only: Home (0), Research (1), Publications (2), Team (3), Join us (4).

### The alumni problem
`team/index.md` contains a **hand-written markdown list of 33 alumni**, duplicating information that does not exist anywhere in structured form. Example line:

```
- 2024: [**Aaditya Prasad**](/members/aaditya-prasad.html) (Undergraduate Research Intern, Master's Student). **Next:** MIT pursuing a PhD in Brain and Cognitive Sciences.
```

The corresponding `_members/aaditya-prasad.md` carries only `role: alumni` and `description: Master's Student`. **Year, prior roles, role transitions, and "Next:" destination exist only in that prose bullet.** A one-time extraction script is required (§9, Phase 2).

### auto-cite already supports ORCID
`auto-cite/plugins/orcid.py` exists and the workflow watches `_data/orcid.yaml`. The weekly `schedule` cron is commented out. So automated fetching is a *present but disabled* capability — the reason to migrate is the **schema**, not the fetching.

---

## 4. Bugs to fix (independent of framework)

### 4.1 Publication list is stale — CRITICAL
Queried OpenAlex against ORCID `0000-0001-9075-8365` → author `A5006740810` (69 works, 3,603 citations). **13 works are missing since the site's newest entry.** Four are journal articles:

| Date | Venue | Current state on site |
|---|---|---|
| 2026-08-25 | **Nature Neuroscience** (Patel et al., social isolation) | shown as *bioRxiv · 10 Nov 2023* |
| 2026-08-19 | **Nature** (asymmetric prefrontal, leader–follower) | absent |
| 2025-12-04 | **Nature Methods** (DISK) | shown as *bioRxiv · 05 May 2024* |
| 2025-09-08 | **PLoS Biology** | absent |

Two Nature-family papers are currently displayed as unpublished preprints. This is the single most important thing to fix.

### 4.2 Broken Google Scholar link (sitewide footer)
`_config.yaml` has `google-scholar: Talmo Pereira`, producing `scholar.google.com/citations?hl=en&user=Talmo Pereira`.
**Correct value: `tFrElIUAAAAJ`**

### 4.3 arXiv dates resolve to Jan 1
`citations.yaml` has MIMIC-MJX as `2025-01-01`. Actual: `2025-12-02`. arXiv DOIs resolve year-only and auto-cite falls back to January 1. **Never trust DOI-resolved dates for arXiv; use OpenAlex `publication_date`.**

### 4.4 Hotlinked publisher images
Several thumbnails are hotlinked live from `media.springernature.com`, `iiif.elifesciences.org`, `els-jbs-prod-cdn.jbs.elsevierhealth.com`. Astro 6 caches remote images between builds using conditional requests — use `<Image />` with remote domains allowlisted so these get pulled local and optimized.

### 4.5 Dead template content
`_data/tools.yaml` lorem ipsum; the @GreeneScientist Twitter embed in `blog/index.md`; three example posts.

---

## 5. Target stack

```
Astro 6 — fully static output, no adapter, no server runtime
├── Tailwind CSS v4          @tailwindcss/vite
├── Starwind UI              CLI copies .astro sources into repo; no React
├── Astro Fonts API          self-hosted, auto preload + fallback metrics
├── View Transitions         ClientRouter, portrait → member page morph
├── Pagefind                 static full-text search, zero infra
├── @astrojs/rss             feed.xml + JSON feed (does not exist today)
└── Sharp                    default image pipeline in Astro 6.1+
```

### Astro 6 gotchas to respect
- **`output: 'static'` throughout.** No route sets `prerender = false`. If something later seems to need SSR, stop and reconsider — the whole site is deployable as flat files, and that is a property worth defending.
- Astro 6 uses **Zod 4**. Check schema syntax against Zod 4, not Zod 3.
- Live Content Collections are stable in 6.0 but **not needed here** — everything is build-time.
- Sharp is the default image processor as of 6.1; codec defaults are set once in config.

---

## 5b. Navigation

Five items. Home is the **logo only** (no "Home" label), which is conventional and frees a slot.

```
[talmolab]    Research   Publications   Tools   Team   Blog
```

- **Tools**, not "Software".
- **Join us** is folded into the Team page, with a CTA in the footer. It is a conversion page, not a browse page, and it was competing with Publications for attention.
- `/join/` must still resolve (§8) — 301 to the Team page anchor.

## 6. Content model

Sketches, not final. Iterate during implementation.

### 6.1 `publications`
Two layers. A custom Content Layer loader fetches canonical metadata; a local YAML file holds only what an API cannot know.

**Loader** — `src/loaders/openalex.ts`

⚠️ **OpenAlex moved to usage-based pricing in Feb 2026.** Earlier guidance about `mailto=` polite-pool access is obsolete.
- **An API key is now required.** Free to create; a free key gets $1/day of budget. Without a key you get a fraction of that — enough for a smoke test, not a build.
- Pricing by operation: **singleton lookups (by ID or DOI) are free**, list+filter is ~$0.10 per 1,000 calls, full-text search is ~$1 per 1,000.
- **Use filter calls, not search calls.** `?filter=author.id:A5006740810&per-page=100` covers all ~69 works in one call for roughly $0.0001. Enrich individual records with free singleton lookups.
- Response `meta.cost_usd` and the `X-RateLimit-*` headers report spend; log them so cost never becomes a surprise.
- Talmo is an academic researcher — OpenAlex grants higher limits to academics for free on request (support@openalex.org). Worth doing once.
- Use the Content Layer `store` + digest so builds don't refetch unchanged records.

**Overlay** — `src/data/publications.yaml`
Only lab-curated fields: thumbnail, project tags, highlight flag, code/data links, press coverage, manual entries that have no DOI (e.g. Maree 2024 Measuring Behavior).

**Critical schema requirement — preprint/published versioning.** Model one publication entity with both versions, not two rows:

```yaml
- key: rose-disk
  preprint:  { doi: "10.1101/2024.05.03.592173", venue: bioRxiv }
  published: { doi: "...", venue: "Nature Methods", date: 2025-12-04 }
  tags: [pose, imputation]
```

Display rules: show the published version when it exists, link the preprint secondarily, never list both as separate items. This is what currently breaks (§4.1).

**Reconciliation is via Crossref, not OpenAlex.** Verified empirically:

- **OpenAlex cannot do this.** The DISK preprint (`W4396672893`) has `versions: null` and `locations_count: 1`, with no pointer to the Nature Methods article. They are unrelated records.
- **Crossref carries the relation.** `GET api.crossref.org/works/10.1101/2024.05.03.592173` returns `relation["is-preprint-of"] → 10.1038/s41592-025-02893-y`. Free, no key.
- **Traverse forward from preprints only.** The reverse direction is unreliable: the Nature Methods record's `has-preprint` points to `10.21203/rs.3.rs-4359486/v1` — a Research Square DOI, *not* the bioRxiv preprint on file. Querying backward from articles produces wrong or missing links.

**Algorithm:** for each tracked preprint DOI, fetch Crossref and follow `is-preprint-of`. Surface the result as a **suggestion in the PR body**; a human approves. Never auto-merge.

**When Crossref has no relation**, the association is made **manually in the overlay**. Do not fuzzy-match on title or author — a false merge of two distinct papers is a worse failure than a missing link. The Action may note "possible match" for a human to judge, but must not act on it.

**Canonical key must be a lab-assigned slug, not a DOI.** Verified failure case: MIMIC-MJX has `doi: null` in OpenAlex (indexed from PubMed) while `sources.yaml` tracks its arXiv DOI — one work, two identifiers, potentially two OpenAlex records.

**Export endpoints** (static endpoints, cheap and genuinely useful for grant/biosketch prep):
`/publications.json`, `/publications.bib`, `/publications.csl.json`

### 6.2 `people`
Model appointments as a timeline. Everything else derives.

```yaml
name: Aaditya Prasad
slug: aaditya-prasad
appointments:
  - { role: undergrad-intern, start: 2021-11, end: 2023-08 }
  - { role: ms-student,       start: 2023-09, end: 2024-06 }
next: { org: MIT, what: "PhD in Brain and Cognitive Sciences" }
links: { github: ..., orcid: ..., scholar: ... }
```

Derive from this: current team, alumni-by-year, role transitions, and the repeat-intern case (`2023, 2024: Will Knickrehm`) which currently requires a hand-written comma. Sort order comes from a role-rank enum plus start date — **not** hand-ordering. The live team page currently shows staff scientists after undergraduate interns because ordering is manual.

Link `people ↔ publications ↔ projects` with `reference()` so a typo'd slug fails the build instead of shipping a dead link.

### 6.2b Alumni presentation (decision #5)

Alumni render as a **table** on the Team page: years, name, role(s), next destination. The name **links to a member page if one exists, and is plain text if not.**

This matches existing precedent — Pranav Sankar is already plain bold text in the current alumni list while everyone else is a link, so the "everyone has a page" invariant is already broken.

Consequences:
- All 55 existing `/members/<slug>.html` URLs must still resolve (§8). Where a member page is dropped, 301 to the alumni table anchor.
- Whether a given alum keeps a full page is a **judgment call on bio substance**, made per person. The agent should surface a proposed list for review rather than deciding silently. Aaditya Prasad has a real bio and a notable destination — keep. A two-sentence summer-intern entry is better as a table row.

### 6.3 `repos` — the Tools page
Per decision #8: **a curated list, no usage statistics.** Page is named **Tools** (not Software).

**Design principle for this collection: minimal structure.** Curation lives in prose and ordering, not in a relational schema. Do **not** add rigid relation fields like `supersedes`/`superseded_by` — if one tool replaces another, say so in its blurb.

- `src/data/repos.yaml` — hand-curated and **explicitly ordered** (array order is display order; do not sort by stars or date).
- Grouping: **`maintained` / `research` / `archived`.** These are lifecycle states and set support expectations.
- Each entry: a **lab-written blurb** of arbitrary length that overrides the GitHub description, plus optional freeform links (docs, paper, project page) and an optional thumbnail.
- Any field beyond `repo`, `group`, and `blurb` should be optional. Prefer adding a sentence to the blurb over adding a schema field.
- Loader enriches each from the GitHub API: description, topics, language, license, last-pushed, stars/forks (available if wanted for display later, but **do not build a stats page**).
- **Rate limits are real.** Unauthenticated GitHub API was exhausted in three calls during research. Requires:
  - `GITHUB_TOKEN` in Actions (5,000 req/hr)
  - a local `.env` token for dev
  - Content Layer caching so repeat builds don't refetch
  - graceful degradation: if the API fails, render from `repos.yaml` alone rather than failing the build
- Candidate repos to seed: `sleap`, `sleap-io`, `sleap-nn`, `dreem`, `sleap-roots`, `vnl-playground`, `lablink`. Confirm the final list during implementation.

### 6.3b `areas` and `projects` — the Research page

The Research page is **prose-first**. It is not a generated index of tagged collections; the writing is the point. Structure exists to support it, not replace it.

- **`areas`** — a small number of research areas, each with a hand-written prose description. These are authored, not derived.
- **`projects`** — named efforts (e.g. MIMIC-MJX, SLUMBR). Lighter weight than areas.
- **Associations are many-to-many and entirely optional.** A project may belong to several areas or none. Publications and repos may associate with areas, projects, both, or neither. Nothing requires a tag.
- **Do not over-specify the taxonomy now.** Ship the loosest schema that works; the association model will be revised once real content exists. Resist adding required fields or enforcing that every publication belongs to an area.
- Area pages render prose plus whatever happens to be associated, with associated content as a supplement below the writing rather than the page's substance.

### 6.4 `posts` and `news`
Two collections, one merged reverse-chron stream with type badges.

- **`posts`** — long-form. Markdown/MDX, full page, own URL, in RSS.
- **`news`** — short items: 1–3 sentences plus a link. Paper out, person joined, release shipped, talk given. No dedicated page; renders inline in the stream.

**Derived news** (per decision 4b, **queued not auto-published**): a scheduled Action detects new OpenAlex works and new GitHub releases, and opens a PR adding draft `news` entries with `draft: true`. A human merges. Same mechanism as the publications PR flow — reuse it.

RSS via `@astrojs/rss`. No comments.

---

## 7. Editing workflow (decision #6 — no CMS)

There is no admin UI. All content is markdown and YAML in the repo, edited via git and the Claude Code skills in `.claude/skills/`. Consequences to design around:

- **The `add-member` skill is now the primary interface** for the most common content task, not a convenience. It deserves proportionate care — see §10. Same for the new publication-overlay skill.
- **Schema errors must surface locally, not in CI.** Since no UI validates input, `astro check` and the Zod schemas are the only guardrail. Make `local-test` run them.
- **Keystatic remains viable later** and nothing here forecloses it: it is a git-backed CMS, so adopting it would mean adding an adapter and a config, not migrating content. Revisit only if non-git-fluent people need to edit directly.

## 8. URL preservation — hard requirement

**Every URL currently resolving on talmolab.org must continue to resolve.** In-place migration means there is no grace period and no separate staging domain to absorb mistakes. Treat this as an acceptance criterion, not a cleanup task.

### The mismatch
Jekyll collections with `output: true` and no `permalink` default to `/:collection/:path:output_ext`, which is why member pages carry a **`.html` extension**: `/members/talmo-pereira.html`. Astro's default `build.format: 'directory'` would emit `/members/talmo-pereira/`. Different URL, silent 404.

### Approach
1. **Try `build.format: 'preserve'` first.** It mirrors the source file layout, so `src/pages/members/[slug].astro` emits `/members/<slug>.html` while `src/pages/team/index.astro` emits `/team/`. That mixed shape is exactly what the current site has. Verify empirically before assuming.
2. **Back it with real 301s in Cloudflare `_redirects`.** Astro's built-in `redirects` config emits meta-refresh pages in static mode, which search engines weight less than an HTTP 301. Since deployment is Workers, `_redirects` is free.
3. Where a URL must change, serve the new canonical and 301 the old one. Never leave an old URL unhandled.

### Inventory
| Existing URL | Note |
|---|---|
| `/members/<slug>.html` | 55 of these. `.html` suffix. Linked from the alumni list and externally. |
| `/team/`, `/publications/`, `/research/`, `/join/`, `/contact/` | trailing slash, in nav |
| `/blog/`, `/tools/` | exist but not in nav — still indexable, still must resolve |
| `/f/RAPTR_HPI_Recruitment.pdf` | recruitment short link; likely printed or emailed. Ship as `public/f/`. |
| `/images/papers/maree-2024.pdf` | **not a thumbnail** — the actual publication target for the Measuring Behavior paper, which has no DOI. If this 404s, a cited work becomes unreachable. |
| `/images/**` | 19 MB, 67 files. Audit for external hotlinks before pruning anything. |
| `/sitemap.xml` | currently 200; must stay 200 |
| `/feed.xml` | currently **404** — new feed here is additive, no preservation concern |

### Acceptance test (blocks cutover)
The links you control get regenerated automatically. The ones that break silently are external: CVs, the SLEAP docs, other lab sites, old posts, and Google's index of the `.html` URLs. You will not hear about those.

So make it a test rather than a hope:

1. Before cutover, crawl `https://talmolab.org/sitemap.xml` and snapshot every URL to a fixture file committed to the repo.
2. Add a script that asserts each snapshotted URL returns **200 or 301-to-200** against the Workers preview deployment.
3. Extend the fixture with paths absent from the sitemap: `/f/*`, `/images/papers/*.pdf`, and any asset referenced by an external site.
4. Cutover does not proceed until the script passes clean.

## 9. Migration phases

### Phase 0 — Immediate, on `main`, before any Astro work
Ship these to the live Jekyll site now. They are independent of the migration and the publication staleness is costing something real today.
1. Fix `google-scholar: tFrElIUAAAAJ` in `_config.yaml`.
2. Add the four missing journal articles to `_data/sources.yaml`; upgrade the DISK and Patel entries from bioRxiv DOIs to their published DOIs.
3. Fix the MIMIC-MJX date.

### Phase 1 — Scaffold
Branch from `main`. Astro 6 + Tailwind v4 + Starwind, static output. Get a trivial page deploying to a Workers preview URL. Do not touch `main`'s Pages build.

**First task in this phase — the `build.format: 'preserve'` test (§8, ~15 min).** Create `src/pages/members/[slug].astro` and `src/pages/team/index.astro`, build, and inspect `dist/`. You want `/members/foo.html` and `/team/index.html` from the same build, and you need to confirm how it interacts with `trailingSlash`. The result determines whether the redirect map is nearly empty or 55+ hand-written entries — which is why it runs now and not at cutover.

### Phase 2 — Content migration
1. Convert 55 `_members/*.md` → `people` collection. Bodies carry over nearly 1:1; frontmatter needs restructuring.
2. **Write a one-time extraction script** parsing the 33 alumni bullets in `team/index.md` into `appointments[]` and `next` fields. This is lossy prose → structured data; expect to hand-check every record. Cross-reference git history for start dates where possible (the `lab-roster` skill already does something like this — reuse its logic).
3. Build the OpenAlex loader + overlay. Reconcile against the existing 26 `sources.yaml` entries so nothing currently displayed is lost, especially the non-DOI manual entries.
4. Seed `repos.yaml`.

### Phase 3 — Frontend
Layouts, Starwind components, Fonts API, View Transitions, Pagefind, RSS. Establish a type pairing and color system deliberately — this is where "modern" actually comes from, not the component library.

### Phase 4 — Automation
The scheduled Action that opens PRs for new publications and draft news items. Update the Claude Code skills (§10).

### Phase 5 — Cutover
**Gate: the §8 URL acceptance test passes clean against the Workers preview.** Only then move DNS from GitHub Pages to Workers (Cloudflare already fronts the domain, so this is a routing change). Keep `main`'s Jekyll build intact and re-runnable until the live site is verified, then remove Jekyll files in a single clearly-labelled commit so history stays legible.

Rollback plan: revert DNS to GitHub Pages. This stays available for as long as the Jekyll files remain on `main`, which is why Phase 5 removes them last and separately.

---

## 10. Claude Code skills to update

`.claude/skills/` contains three skills that all assume Jekyll. They are a real asset — preserve the workflow, update the mechanics.

| Skill | Change needed |
|---|---|
| `add-member` | Emit the new `people` schema with `appointments[]` instead of flat `role`/`description`. Keep the interactive research + bio-drafting flow and `optimize-image.sh`. Templates in `templates/` need rewriting. |
| `lab-roster` | Its role-transition and career-tracking logic becomes mostly redundant once appointments are structured — it should read the collection rather than parse prose. Its existing parsing logic is useful input for the Phase 2 extraction script. |
| `local-test` | Swap `bundle exec jekyll serve` for `astro dev`. Playwright MCP flow stays. |

Add a fourth: a skill for adding a publication overlay entry / resolving a preprint→published upgrade.

`CLAUDE.md` at repo root also needs rewriting.

---

## 11. Reference data

```
Google Scholar ID      tFrElIUAAAAJ
ORCID                  0000-0001-9075-8365
OpenAlex author        A5006740810
OpenAlex works API     https://api.openalex.org/works?filter=author.id:A5006740810&per-page=100
                       API KEY REQUIRED as of Feb 2026 (free tier = $1/day)
Crossref API           https://api.crossref.org/works/{doi}   (free, no key, mailto= polite pool)
GitHub org             talmolab
Live site              https://talmolab.org
Repo                   https://github.com/talmolab/lab-website
```

Secrets needed: `GITHUB_TOKEN` (Actions-provided is sufficient for the repos loader), `OPENALEX_API_KEY`, and a Cloudflare API token for the Workers deploy. No GitHub App, no OAuth, no runtime secrets. Crossref needs no key.

---

## 12. Open questions for the session

1. Final list of repos for `repos.yaml`, and grouping (featured vs. supporting?).
2. Does the Research page get restructured into a `projects` collection that publications and people can `reference()`, or stay a hand-written page for v1?
1. Final contents and ordering of `repos.yaml`, and which group each tool belongs to.
2. Which research areas exist, and their prose. Needs Talmo's writing — do not draft placeholder areas.
3. ~~Visual direction — three mockups delivered; awaiting selection. Open sub-question: does the site inherit any SLEAP visual identity or stay deliberately distinct?~~ **Resolved provisionally 2026-08-30 — see below.**
4. Per-alumnus judgment on which have enough bio to warrant keeping a full member page (§6.2b). Surface for review; don't decide silently.

---

## 13. Decision log

### 2026-08-30 — Logo colour and site palette (provisional)

**Decision: Option 01, "Ink & SLEAP Blue" — `#1f2328` ink, `#2176b3` accent.**
Status: **final.** Ratified by lab vote 2026-08-30, winning by 16 votes over the runner-up
(08 Ink & Violet).

Chosen from ten two-tone pairings rendered on the finished mark (round 26 review sheet:
the round-26 review sheet; the other nine survive as standalone SVGs in the design archive).

Rationale:
- The accent works **unmodified as interface colour** — 4.62:1 on paper, so it carries links and
  buttons directly. Its light/dark UI siblings sit only 4.3 lightness points away, so the logo
  colour and the site colour are effectively the same blue. Lighter accents tested (chartreuse,
  amber) drift 20.5 and 15.5 points, at which point the logo's colour never appears in the UI.
- **Settles the SLEAP sub-question above: the site inherits SLEAP's blue.** Existing visual equity
  carries over rather than being discarded.
- Colour-blind separation 30.2, well clear of where the mark's two halves merge.
- Recorded cost: this is the **least distinctive** of the ten. Blue on near-black is the field
  default. Chosen for practicality over distinctiveness.

**Supersedes** the round-25 palette (`#d77315` / `#228cdb` / crimson alternates) entirely.

Assets and the full derived token set (paper, ground, text, muted, rule, link, dark-mode accent —
70/70 pairs verified at AA) are in **`design/`**, with `design/README.md` as the authoritative
reference, `design/palette.css` as the tokens, and `design/scripts/` to regenerate everything from
two hex values. `design/build/` is gitignored; `public/` holds the 13 files the site serves.

Feeds **Phase 3** (§9): these tokens become `src/styles/global.css`, and the palette section of the
rewritten root `CLAUDE.md`.

Outstanding: a **simplified favicon cut** — the full mark collapses at 16px and is marginal at 32px
(verified, not assumed). Likely the `t` plus soma dot alone. Also unresolved: clear-space rule and
wordmark weight.

### 2026-08-30 — Typography (final)

**Source Sans 3 (sans) + JetBrains Mono (code). No serif.**

Coverage was treated as a gate, not a preference, and it eliminated most of the field. Measured
from the actual TTFs against content the site really contains — Vietnamese author names, Greek in
titles, math in abstracts:

- **Source Sans 3** — 1615 glyphs, 100% Latin-ext / Vietnamese / Greek / super-subscript, 92% math
- **JetBrains Mono** — 976 glyphs, 100% Latin-ext / Vietnamese / Greek, 92% math

Rejected on coverage, each of which would break a word mid-name: Plus Jakarta Sans (Greek 8%),
Figtree (Greek 0%, Vietnamese 12%), **IBM Plex Serif and Mono (Greek 2%** — which kills the
otherwise-attractive Plex superfamily option), Public Sans, Newsreader, Spectral, Atkinson.

A serif-led system was proposed and rejected after building the page out with real content: it
optimised for the Research page's three paragraphs while the bulk of the site — publications,
tools, team grid, alumni table — is scanned rather than read, and a serif fights the mono DOIs
beside it. Inter passes coverage and is the fallback if Source Sans ever proves limiting, but it
is the default face of every dev tool and reads as stock beside an already-conservative palette.

Specs: `design/type-system.css`.

### 2026-08-30 — Logo asset system (final)

Horizontal lockup added for nav use (the stacked one needs too much height before the wordmark is
legible). Clear-space rule defined as `2b`, where `b` is the width of the blue bar — 23% of logo
height. Simplified favicon cut (the `t` and the `l` bar, arbor and skeleton clipped) because the
full mark collapses below 32px. Illustrator's rotated-rect export bug found and normalised out;
`scripts/normalize-svg.py --check` guards against reintroduction.

Full detail and the reasoning behind each: `design/README.md`.

### 2026-08-30 — Publication reconciliation verified against live APIs

Phase 0 is **deliberately skipped.** The site is a ground-up rework; papers land once, in the
Astro overlay, not twice. Do not spend effort on Jekyll-side machinery — `auto-cite`, `Gemfile`,
`sources.yaml` — it is all being discarded.

What was worth keeping is the reconciliation itself, re-verified live and ready for the Phase 2
overlay. §4.1's four articles resolve to:

| Slug | Published DOI | Venue | Date |
|---|---|---|---|
| patel-social-isolation | `10.1038/s41593-026-02413-x` | Nature Neuroscience | 2026-08-25 |
| cheng-leader-follower | `10.1038/s41586-026-10900-1` | Nature | 2026-08-19 |
| rose-disk | `10.1038/s41592-025-02893-y` | Nature Methods | 2025-12-04 |
| mitelut-gerbils | `10.1371/journal.pbio.3003348` | PLoS Biology | 2025-09-08 |

Preprints to pair with them: `10.1101/2023.11.09.566421` (patel), `10.1101/2024.05.03.592173`
(disk), `10.1101/2025.08.27.672249` (cheng — bioRxiv, under a different title).
MIMIC-MJX's real date is **2025-12-02**, not the Jan-1 fallback.

Two findings that correct §6.1:

1. **OpenAlex answered unauthenticated.** `?filter=author.id:A5006740810&per-page=100` returned
   all 69 works, `meta.cost_usd: 0.0001`, no key. §6.1's "an API key is now required" is
   overstated for *this* call — the cost model it describes was otherwise confirmed exactly.
   Still worth getting the key before a build depends on it.
2. **Crossref has no `is-preprint-of` for the Patel preprint** — the traversal §6.1 relies on
   returns `{}`. This is the first real instance of the manual-association case, so the overlay
   needs to support it from the start rather than treating it as an edge case. The merge rests on
   hard evidence, not a fuzzy match: the two records share **all 24 authors** and a title
   identical apart from hyphen-vs-en-dash. DISK's relation *was* present and resolved as
   documented, so the traversal works — it just isn't sufficient on its own.

Also confirmed: MIMIC-MJX has `doi: null` in OpenAlex and is indexed via PubMed, exactly the
failure case §6.1 cites for why the canonical key must be a lab-assigned slug.

### 2026-08-30 — Phase 1: `build.format: 'preserve'` resolved, and the 307 trap

**`format: 'preserve'` works.** One build emits `/members/<slug>.html` and `/team/index.html`
together, exactly the mixed shape the live site has. `trailingSlash` turned out to be a
**non-factor** for output — `ignore`/`always`/`never` all emit byte-identical file layouts under
`preserve`; it only affects dev-server matching. §9's "confirm how it interacts with
`trailingSlash`" is answered: it doesn't.

**But `preserve` alone is not sufficient, and the reason is on the serving side.** Probed against
a real Workers runtime (`wrangler dev`), the four `assets.html_handling` modes give:

| mode | `/members/x.html` | `/members/x` | `/team/` | `/` |
|---|---|---|---|---|
| `auto-trailing-slash` (default) | **307** → `/members/x` | 200 | 200 | 200 |
| `none` | **200** | 404 | **404** | **404** |
| `force-trailing-slash` | 307 → `/members/x/` | 307 | 200 | 200 |
| `drop-trailing-slash` | 307 → `/members/x` | 200 | 307 → `/team` | 200 |

Two things fall out of this that §8 did not anticipate:

1. **`none` is a trap.** It is the only mode that serves `.html` at 200 — and it 404s **the
   homepage** and every directory index. Not viable, so the extensionless URL is *forced* as the
   canonical form. Preserving the `.html` URLs as-is is not on the table.
2. **The default redirect is a 307, not a 301.** A temporary redirect does not move Google's
   index or pass link equity, and §8's acceptance test demands "200 or 301-to-200". Shipping on
   defaults would have quietly failed that on all 55 member URLs — and it would have looked fine
   in a browser, which is exactly the silent-external-breakage §8 warns about.

**Resolution: two wildcard lines in `public/_redirects`, not 55 hand-written entries.** Verified
that `_redirects` is evaluated *before* `html_handling`, and that a `:slug` placeholder binds
correctly against a literal `.html` suffix:

```
/members/:slug.html  /members/:slug  301
/team/index.html     /team/          301
```

`/members/<slug>.html` → **301** → `/members/<slug>` → 200. Homepage and `/team/` stay 200.

Residual: `/team` (no trailing slash) still 307s to `/team/`. Harmless — Jekyll never served that
form, so it is not in the preservation inventory.

**Confirmed against a real deployment**, not just the local runtime — `wrangler dev` and
production agree exactly:

```
/members/talmo-pereira.html   301 -> /members/talmo-pereira   (final 200)
/members/aaditya-prasad.html  301 -> /members/aaditya-prasad  (final 200)
/team/                        200      /team/index.html  301 -> /team/  (final 200)
/                             200      /nope             404
```

All 13 files in `public/` serve at 200 with byte-identical sizes, and `/_redirects` correctly
404s rather than being exposed as an asset.

**Deploy target:** Worker `talmolab-site` on account `Talmo Lab` (`6b8f5183…`), preview at
`https://talmolab-site.talmo-lab.workers.dev`. `wrangler.jsonc` declares **no routes**, so it is
inert with respect to talmolab.org until the Phase 5 DNS change — the existing wrangler OAuth
token already carries `workers/workers_scripts/workers_routes (write)`, so no new credential is
needed for the cutover either.

### 2026-08-30 — Phase 1 complete: Tailwind v4 + Starwind on the ratified palette

Astro 6.4.8, Tailwind 4.3.3, Starwind 2.2.0, self-hosted fonts, deployed and verified at
`https://talmolab-site.talmo-lab.workers.dev`. `astro check` is clean (9 files, 0/0/0) and runs
as part of `npm run build`, per §7 — with no CMS, the schemas are the only guardrail, so they
must not be CI-only.

`design/palette.css` and `design/type-system.css` are **imported, not copied**, so re-running
`design/scripts/` flows straight into the site. Four things had to be resolved on the way, none
of them obvious from reading the specs:

1. **Astro's Fonts API registers a HASHED family name** — `"Source Sans 3-16d643d5…"`, not
   `"Source Sans 3"`. `type-system.css` names the face literally, which is right as a
   specification and wrong as CSS: it resolves to a system sans for every visitor *while still
   looking correct on any machine with Source Sans installed locally*. `src/styles/global.css`
   re-points `--font-sans`/`--font-mono` at Astro's generated stacks, which also carry the
   metric-matched fallbacks that suppress layout shift. Verified by measurement, not by eye —
   the rendered glyph run is 426.24px against 458.07 for Arial and 441.95 for system-ui.

2. **Starwind's `--color-muted` collides with the palette's.** The palette means muted *text*
   (`#555b64`); Starwind means a muted *background*. The palette is ratified so it wins the name,
   which makes `bg-muted` paint dark grey under dark text — Starwind's `outline` and `ghost`
   buttons use `hover:bg-muted`. Patched those to `hover:bg-secondary`. **This is a recurring
   tax: every future `starwind add` needs the same substitution.** The durable fix is renaming
   one of the two, which is a design-system decision, not a code one.

3. **Starwind switches theme on a `.dark` CLASS**, the palette on `prefers-color-scheme` +
   `data-theme`. Its `dark:` variant is redefined in the bridge to the palette's three-state
   logic, and its semantic tokens point at `--bg`/`--fg`/`--line`, which already flip — so
   components track the theme without a `.dark` class existing anywhere.

4. **Two contrast bugs, both introduced by the mapping, both caught by measuring in-browser.**
   `--secondary` pointed at the light-only `--color-sunk`, giving `#edf0f4` under `#e5e8ec` in
   dark mode — invisible. And `--primary` pointed at `--mark`, whose dark value `#2a83c4` is
   specified as a *foreground on ground*; used as a button *fill* under paper text it measures
   **3.87:1 and fails AA**. Primary now uses brand blue `#2176b3` as the fill in both themes:
   4.62:1 label contrast either way, and it still clears the 3:1 non-text minimum against each
   ground (4.62 light / 3.79 dark). Measured button contrast now runs 4.62–15.04 across both
   themes.

The palette needed one addition it did not define: a **recessed tone for dark**. On a near-black
ground "recessed" has to go lighter, not darker, so `--sunk` resolves to `--color-dark-rule` in
dark and `--color-sunk` in light. Derived in the bridge, not in `design/`.

**Settled:** the OG cards were baked in Bricolage Grotesque + IBM Plex Mono, and
`design/README.md` still described site typography as undecided. Both fixed — the four cards are
re-rendered in **Source Sans 3 + JetBrains Mono**, `public/og-card.png` re-synced, and the
README's "Type caveat" is now a "Type" section stating what is actually true. The headline sits
at **700 / -0.02em** rather than Bricolage's 600 / -0.025em, because Source Sans is a text face
and needs the extra weight to hold at display size — those are the site's own `h1` numbers, so
card and page heading now agree. Dropping IBM Plex Mono also removes the last trace of a family
§13 rejected on Greek coverage (2%).
