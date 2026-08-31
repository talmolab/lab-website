# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

The website for [Talmo Pereira's lab](https://talmolab.org) at the Salk Institute.
An **Astro 6** static site deployed to **Cloudflare Workers**.

> **Mid-migration.** `main` still contains the Jekyll site that serves
> talmolab.org today; the Astro site lives alongside it and deploys to
> `talmolab-site.talmo-lab.workers.dev`. Jekyll files are removed in one clearly
> labelled commit *after* DNS cutover, so rollback stays available.
> **`docs/astro-migration.md` is the authoritative plan** — §1–12 are the original
> plan, §13 is the running decision log, and §13 is newer where they disagree.

## Commands

```bash
npm run dev        # astro dev on :4321 — content and layout work
npm run build      # astro check && astro build && pagefind --site dist
npm run preview    # wrangler dev on :8787 over dist/ — routing work
npm run check      # astro check on its own
npm run deploy     # build, then wrangler deploy
```

**Routing must be tested under `npm run preview`, not `npm run dev`.** The `.html`
member redirects, trailing-slash behaviour and `public/_redirects` are applied by
the Workers runtime and do not exist in the dev server. A URL can look right in
`astro dev` and 404 in production.

```bash
./scripts/check-urls.sh <base-url>            # §8 cutover gate — must pass clean
node scripts/discover-publications.mjs        # new papers, preprint upgrades
node scripts/discover-news.mjs                # new releases -> draft news
```

## Design system — do not improvise

`design/` holds the brand sources and is authoritative; `design/README.md` is the
reference. The palette and type system are **ratified** (palette by lab vote,
2026-08-30) and regenerable from two hex values via `design/scripts/`.

- **Ink `#1f2328`, SLEAP Blue `#2176b3`.** Every derived token was verified at
  WCAG AA. The site inherits SLEAP's blue deliberately.
- **Source Sans 3 + JetBrains Mono. No serif.** Coverage was a gate, not a
  preference: candidates were eliminated on Greek and Vietnamese support, measured
  against real content (author names, Greek in titles).
- `src/styles/global.css` **imports** `design/palette.css` and
  `design/type-system.css` rather than copying them, so regenerating the palette
  flows straight into the site.
- **Never set the word "talmolab" in type.** Use the SVG lockup —
  `talmolab-lockup-h-*.svg` in the nav; the stacked cut needs too much height.
- The palette deliberately has **one accent**. Encode categorical state with
  weight, rule and position, not a second hue — it survives greyscale and colour
  blindness and scales past three categories.

Three gotchas that have already bitten:

1. **Astro's Fonts API registers a hashed family name** (`Source Sans 3-16d64…`).
   `type-system.css` names the face literally, which is right as a spec and wrong
   as CSS — it resolves to a system font for visitors while looking correct on any
   machine with the face installed. `global.css` re-points the tokens; leave that
   alone.
2. **Starwind's `--color-muted` means a background; ours means text.** Ours wins the
   name, so `bg-muted` paints dark grey under dark text. Use `bg-secondary`.
   **Every `starwind add` needs this substitution** — check new components.
3. **A token correct as a foreground can fail as a fill.** `--mark` (`#2a83c4` in
   dark) is specified as link text on the dark ground; as a button fill under paper
   text it measures 3.87:1 and fails AA. Measure both themes in-browser.

## Content model

Everything is a content collection defined in `src/content.config.ts`, validated by
Zod 4 (**not** Zod 3 — check syntax accordingly). There is no CMS, so **`astro
check` is the only guardrail on content input**. It runs as part of `npm run build`.

| Collection | Source | Notes |
|---|---|---|
| `people` | `src/content/people/*.md` | Appointments timeline; everything derives |
| `publications` | `src/data/publications.yaml` + OpenAlex | Overlay is an allowlist |
| `repos` | `src/data/repos.yaml` + GitHub API | Array order is display order |
| `areas` | `src/content/areas/*.md` | Prose-first; authored, not derived |
| `posts` / `news` | `src/content/{posts,news}/` | Merged stream; empty today |

### people — the load-bearing rule

**Alumni status is derived from `end`, never stored.** There is no `role: alumni`.

The old site had one, plus a hand-written alumni list on the team page. They fell
out of sync, and four people ended up filtered off the team page *and* absent from
the list — with live pages nothing linked to. Do not reintroduce a status flag.

- No `end` → current. `end: "unknown"` → departed, date unrecorded.
  **Never omit `end` for someone who left**; that is the bug above.
- A role change **appends** an appointment. Overwriting one destroys the history
  that lets the alumni table say `2021–2024, Undergraduate Research Intern,
  Master's Student`.
- Two fully-bounded appointments mean two separate stints; an open boundary means
  one continuous tenure. That is how a repeat summer intern (`2023, 2024`) is told
  apart from a promotion (`2021–2024`) — identical in prose, distinct structurally.
- **Three fields for job titles, deliberately.** `role` is the category and drives
  sort, group and filter, never displayed raw. `title` is what the site shows.
  `salkTitle` is the official HR title. Salk HR titles historically did not reflect
  what people did, so the website used better ones; reconciling them would destroy
  information.
- Sort order comes from the `ROLE_ORDER` rank. Never hand-order.
- Portraits go in `src/assets/people/` (not `public/`, not `images/`) so Astro
  optimises them — roughly 500 KB → 5 KB webp.

### publications — the overlay is an allowlist

OpenAlex holds 69 works for this author and ~40 are **not publications**: twelve
Figshare `MOESM` stubs, three `Author response:` records, an erratum, Research
Square duplicates, conference abstracts. Nothing shows without an overlay entry.

- Keys are lab-assigned, **permanent**, and derived from the *earliest* version's
  year, so `rose-2024` survives publication in 2025. Not DOIs: MIMIC-MJX has
  `doi: null` in OpenAlex while the overlay tracks its arXiv DOI.
- Preprint and published are **one entity**, not two rows. Show published, link the
  preprint secondarily.
- Resolve preprints via Crossref `is-preprint-of`, **forward only**. Backward from
  the article lands on Research Square DOIs rather than the bioRxiv one on file.
- No Crossref relation → manual association, and **never fuzzy-match on title or
  author**. A false merge is worse than a missing link. Record the reasoning as a
  comment on the entry.
- OpenAlex resolves arXiv DOIs; Crossref 404s them (DataCite). OpenAlex is primary.
- Both filter and singleton calls answer **unauthenticated**. `OPENALEX_API_KEY`
  raises the budget but is not required.

## URL preservation — a hard requirement

**Every URL talmolab.org serves today must keep resolving.** This is in-place
migration: no grace period, no staging domain.

- `test/live-urls.txt` snapshots the live sitemap plus paths it omits.
  `scripts/check-urls.sh <base>` asserts each returns 200 or redirects to 200.
  **This gates cutover** and currently passes 72/72.
- `build.format: 'preserve'` emits `/members/<slug>.html` and `/team/index.html`
  from one build. `trailingSlash` does not affect output.
- **No `html_handling` mode serves both shapes at 200.** `none` is the only one
  keeping `.html` — and it 404s the homepage. So extensionless is the forced
  canonical, and two wildcard rules in `public/_redirects` supply real 301s where
  the default would give a 307 (which does not move Google's index).
- **`_redirects` is first-match-wins.** A specific rule must sit *above* the
  `/members/:slug.html` wildcard, or the wildcard swallows it and rewrites to a
  path that no longer exists — a 301 into a 404.
- Renaming a content file changes a live URL. Add a redirect.

## Automation

`.github/workflows/discover.yaml` runs weekly, opens a **PR**, and never commits to
`main` or publishes (decisions 3b, 4b). News items also carry `draft: true`, so even
merging does not put them on the site. Patch releases are filtered out — taking
every release produced 45 items in eight months, which is a changelog, not news.

`.github/workflows/deploy.yaml` builds and deploys on push. The Worker declares
**no routes**, so it cannot affect talmolab.org before the DNS change.

## Skills

`.claude/skills/` — these are the primary editing interface, since there is no CMS.

- **`add-member`** — add or update a person; handles departures and transitions
- **`add-publication`** — overlay entries and preprint→published resolution
- **`lab-roster`** — roster CSV from the collection, one row per appointment
- **`local-test`** — dev/preview servers, the checks worth running

## Things that will waste your time

- **The content-layer cache is `node_modules/.astro/data-store.json`**, not
  `.astro/`. Deleting the latter looks right and silently reuses stale loader
  output.
- `The collection "posts"/"news" does not exist or is empty` is **expected** until
  the blog has content. Not a misconfiguration.
- Pagefind's bundled UIs are not used. Its Component UI renders permanent
  `aria-hidden` skeletons here while the API works fine, so `/search/` is ~40 lines
  over the API directly. Verified it is not a ClientRouter interaction and not asset
  delivery before concluding that.
- Pagefind results are injected with `innerHTML`, so Astro's scoped styles never
  reach the `<mark>` highlights. That rule has to be global.
- `output: 'static'` throughout. If something seems to need SSR, stop and
  reconsider — the whole site is deployable as flat files and that is worth
  defending.

## Known-stale things on the live Jekyll site

Not migrated, and worth knowing if you look at the old site:

- **`/contact/` is unmodified Greene template filler** — "Department of Metaphor",
  `scrooge@mcduck.com`, a Google Maps pin in Nova Scotia. 301s to `/team/#join`.
- **`/CLAUDE.html` is published and indexed** — Jekyll renders this file at the site
  root. Astro does not; the indexed URL 301s to `/`.
- `_data/tools.yaml` is lorem ipsum, the blog embeds another lab's Twitter timeline,
  and the three example posts are template filler.
