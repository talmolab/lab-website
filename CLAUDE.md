# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

The rebuild of [talmolab.org](https://talmolab.org) ("fresh start", branch `fresh-start`):
an **Astro 6** static site on **Cloudflare Workers**, live as a preview at
https://talmolab-next.talmo-lab.workers.dev. It uses only the media the live site already
has, and maps every live page to a page or a decided redirect (`docs/parity.md`).
talmolab.org itself is still served from `talmolab/lab-website`; nothing here can affect
it. This Worker (`talmolab-next`) declares no routes, and non-production builds are
noindexed. The earlier direction-C build stays up at
https://talmolab-redux.talmo-lab.workers.dev (Worker `talmolab-redux`) for comparison.

## Commands

```bash
npm run dev        # astro dev on :4321
npm run build      # astro check && astro build
npm run preview    # wrangler dev over dist/: test routing and redirects here, not in dev
npm run deploy     # build, then wrangler deploy
```

Export `GITHUB_TOKEN` before building (`export GITHUB_TOKEN=$(gh auth token)`): the repos
loader calls the GitHub API and runs out of unauthenticated quota fast.

## Keeping it current: the three workflows

| Workflow | Trigger | Does | Never |
|---|---|---|---|
| `discover.yaml` | Mondays 07:00 UTC, or by hand | Stages new papers and preprint links in `src/data/publications.yaml`, draft news in `src/content/news/`; validates; opens a PR; rewrites the open "Discovery report" issue | commits to main, publishes |
| `member.yaml` | a "Lab member update" issue (form in `.github/ISSUE_TEMPLATE/member.yml`) | `scripts/member-from-issue.mjs` edits `src/content/people/` and the portrait; validates; opens a PR closing the issue | processes issues from non-collaborators |
| `deploy.yaml` | push to main, PRs, Mondays 09:00 UTC | builds; deploys when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets exist | — |

PRs opened by these workflows use the Actions token, so they do not trigger CI
themselves. That is why each one runs `astro check` before opening its PR.

Skills in `.claude/skills/` are the local, maintainer-side route: `add-member`,
`add-publication`, `lab-roster`, `local-test`.

## Content model

Collections are defined in `src/content.config.ts` (Zod 4). `astro check` is the only
guardrail on content.

- **people**: alumni status is derived from `end`, never stored; there is no `alumni`
  role. A role change appends an appointment, closing the old one the month the new
  one starts. `role` sorts, `title` displays, `salkTitle` is HR's. Details:
  `.claude/skills/add-member/reference.md`.
- **publications**: `src/data/publications.yaml` is an allowlist overlay over OpenAlex.
  Keys are permanent. Preprint and published version are one entry. Resolve via Crossref
  `is-preprint-of`, forward only, and never fuzzy-match. Thumbnails:
  `node scripts/paper-thumb.mjs <key> <figure>`.
- **repos**: `src/data/repos.yaml`, array order is display order; optional `title`
  (display name) and `media:` list.
- **areas**: `src/content/areas/*.md`: prose plus optional `media:` (the first item leads),
  `tools:` (repo ids) and `papers:` (overlay keys). Both are `reference()`s, so a typo
  fails the build. `draft: true` keeps an area out of the site (phenotyping.md).
- **media**: inline, not a collection. Each item is `{ src, poster?, width, height, alt,
  caption?, credit?, plate? }`, and `src`/`poster` must exist under `public/` or the build
  fails. Today: the old site's `sleap_movie.gif` and `root_sleap.gif` (as MP4 + WebM in
  `public/media/`, the GIFs kept at their old URLs) and `nn_systems.png`.

### Adding a clip later

1. `scripts/encode-clip.sh <source> <name> [max-width] [poster-seconds]` writes
   `public/media/<name>.{mp4,webm,jpg}` (muted, H.264 + VP9, poster) and prints the YAML.
2. Paste it into an area's or a repo's `media:` list and write a real `alt`.
3. Build. A missing file or a typo fails `astro check`.

New footage is catalogued in `lab-website/scratch/2026-10-03-redesign-redux/CATALOGUE.md`.
Clips with identifiable people need consent first.
- **posts / news**: empty today; news arrives as `draft: true`.

## Design rules

- v003 brand. Light paper first (`#f8f8fb`, text `#1e1a29`, muted `#5c5965`, rule
  `#dedde3`, links `#805fc9` at 4.50:1), dark second (`#141319`, `#e8e7eb`, `#abaab1`,
  `#2c2a31`, links `#8c6bd6`). The theme follows the system until the header switch
  sets it (stored in `localStorage.theme`). The brand violet `#8b6dd2` is for the logo
  and non-text marks only: it is 3.80:1 on paper.
- Source Sans 3 (400/500/600, italic) + JetBrains Mono (400), self-hosted via Astro's
  Fonts API with Greek and Vietnamese subsets. No serif.
- Never set "talmolab" in type: `src/components/Logo.astro` inlines the lockup so its ink
  follows the theme and its violet never changes. Clear space is 2b (0.232 × height).
- One accent. Structure comes from weight, rules and position. The recurring layout is
  the ledger (`.ledger`): a sticky label column beside the content.
- Clips play only while on screen, never automatically under `prefers-reduced-motion`,
  and each has its own pause button (WCAG 2.2.2). See the script in `Base.astro`.
- Figures that share a row (`.panel`) get `flex-grow` equal to their aspect ratio, so
  they share a height without cropping.
- Text contrast ≥ 4.5:1, visible focus, real buttons, no overflow at 375 px. Check every
  page type at 1440 and 375, light and dark, under `npm run preview`.

## Search

`/search.json` is built from the collections; `SearchDialog.astro` searches it (`/` or
Cmd-K, the header button, the 404 page). `/publications/` also has an in-page filter that
keeps the Greene template's `?search=` syntax: words AND, `"phrases"` OR, `"tag: x"`.
Member pages link to `/publications/?search="Name"`, as the live site did.

## Things that will waste your time

- The content-layer cache is `node_modules/.astro/data-store.json`, not `.astro/`.
- `The collection "posts"/"news" does not exist or is empty` is expected.
- npm 11 blocks install scripts; `esbuild`, `sharp` and `workerd` are allowed in
  `package.json` `allowScripts`. A new native dependency needs `npm approve-scripts`.
- `output: 'static'` throughout. If something seems to need SSR, reconsider.
- `npm run preview` (wrangler dev) can reload while `astro build` is emptying `dist/`
  and then 404 everything. Restart it after a rebuild.
- OpenAlex merges preprints with their published versions and answers a preprint DOI with
  the journal's record. The loader takes Crossref's exact record when the DOIs differ;
  do not "fix" that by accepting OpenAlex's answer.
