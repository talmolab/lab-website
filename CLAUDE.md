# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

The media-first redesign of [talmolab.org](https://talmolab.org) (direction C,
"Instrument"): an **Astro 6** static site on **Cloudflare Workers**, live as a preview at
https://talmolab-redux.talmo-lab.workers.dev. talmolab.org itself is still served from
`talmolab/lab-website`; nothing here can affect it. This Worker (`talmolab-redux`)
declares no routes, and non-production builds are noindexed.

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
- **repos**: `src/data/repos.yaml`, array order is display order; `media:` names a clip.
- **areas**: `src/content/areas/*.md`, prose plus `lead` and `media` clip references.
- **media**: `src/data/media.yaml`, written by `scripts/encode-media.py` (do not edit by
  hand). 51 encodes in `public/media/`; each `source` is a catalogue ID in
  `lab-website/scratch/2026-10-03-redesign-redux/CATALOGUE.md`. Clips with identifiable
  people are excluded until there is consent.
- **posts / news**: empty today; news arrives as `draft: true`.

## Design rules

- v003 brand, dark only: ground `#141319`, text `#e8e7eb`, muted `#abaab1`, rule `#2c2a31`,
  one accent `#8c6bd6` (4.56:1). The brand violet `#8b6dd2` is the logo's, not UI text.
- Source Sans 3 + JetBrains Mono, self-hosted via Astro's Fonts API. No serif.
- Never set "talmolab" in type: use the SVG lockup.
- One accent: categorical state comes from weight, rule and position.
- Video plays only on screen and while motion is on (the rail's Pause motion button,
  remembered; off under `prefers-reduced-motion`). Keep it that way: WCAG 2.2.2.
- `.jrow` justified rows give each clip a flex-grow equal to its aspect ratio; use
  `pack()` from `src/lib/media.ts` and the `Wall` component rather than fixed grids.

## Things that will waste your time

- The content-layer cache is `node_modules/.astro/data-store.json`, not `.astro/`.
- `The collection "posts"/"news" does not exist or is empty` is expected.
- npm 11 blocks install scripts; `esbuild`, `sharp` and `workerd` are allowed in
  `package.json` `allowScripts`. A new native dependency needs `npm approve-scripts`.
- `output: 'static'` throughout. If something seems to need SSR, reconsider.
