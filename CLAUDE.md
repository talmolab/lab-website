# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

[talmolab.org](https://talmolab.org): an **Astro 6** static site on **Cloudflare
Workers**, live since 2026-11-20. It replaced the Jekyll site in `talmolab/lab-website-legacy`,
which still serves on GitHub Pages as the rollback for now. Every URL the old site served
keeps resolving: `docs/parity.md` maps each one, and `scripts/check-urls.sh` enforces it.

**Repositories** (renamed 2026-11-20): this one is `talmolab/lab-website`, public, named
`lab-website-redux` until then (local checkouts may keep that folder name; GitHub
redirects the old URL). The old Jekyll site is `talmolab/lab-website-legacy`.

**Every merge to `main` deploys to talmolab.org.** `.github/workflows/deploy.yaml` builds,
deploys the noindexed preview Worker `talmolab-next`
(https://talmolab-next.talmo-lab.workers.dev) and checks it, then, because the repository
variable `PRODUCTION_DOMAIN` is `talmolab.org`, rebuilds with `SITE_URL` set, deploys
`env.production` (Worker `talmolab-org`, custom domain `talmolab.org`) and runs both URL
checks against the live domain. So `main` takes changes only through a PR with a green
`build` check; open PRs and leave merging to the owner. Unsetting `PRODUCTION_DOMAIN`
stops production deploys; the rollback is in `docs/cutover.md`.

Do not run `wrangler deploy --env production` by hand: CI is the path, and `--dry-run`
checks the config. The custom domain is attached, so a deploy only uploads a new version.
(Attaching it the first time did not replace the apex records: Cloudflare refuses a
custom domain over existing A records, code 100117. They had to be deleted first.)

## Commands

```bash
npm run dev        # astro dev on :4321
npm run build      # astro check && astro build
npm run preview    # wrangler dev over dist/: test routing and redirects here, not in dev
npm run deploy     # build, then wrangler deploy to the PREVIEW (talmolab-next)

./scripts/check-urls.sh <base>         # every URL the live site serves resolves (177), by 200 or 301
./scripts/check-production.sh <base>   # it is the production build: indexable, canonical
```

For the second check locally: `SITE_URL=https://talmolab.org npm run build`, then
`npm run preview -- --port 8790` and point both scripts at `http://127.0.0.1:8790`.

Export `GITHUB_TOKEN` before building (`export GITHUB_TOKEN=$(gh auth token)`): the repos
loader calls the GitHub API and runs out of unauthenticated quota fast.

OpenAlex works without a key but throttles unauthenticated traffic: on 2026-11-20, a day
of many builds, it answered 429 with long Retry-After waits and a deploy spent 8 minutes
in the loader's retries. CI passes the `OPENALEX_API_KEY` secret to every step that loads
publications. Locally, set `OPENALEX_API_KEY` if you rebuild often, and don't clear
`node_modules/.astro/data-store.json` without a reason: it saves refetching every entry.

## Keeping it current: the three workflows

| Workflow | Trigger | Does | Never |
|---|---|---|---|
| `discover.yaml` | Mondays 07:00 UTC, or by hand | Stages new papers and preprint links in `src/data/publications.yaml`, draft news in `src/content/news/`; validates; opens a PR; rewrites the open "Discovery report" issue | commits to main, publishes |
| `member.yaml` | a "Lab member update" issue (form in `.github/ISSUE_TEMPLATE/member.yml`) | `scripts/member-from-issue.mjs` edits `src/content/people/` and the portrait; validates; opens a PR closing the issue | processes issues from non-collaborators |
| `deploy.yaml` | push to main, PRs, Mondays 09:00 UTC | builds; deploys the preview when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets exist; deploys talmolab.org, then runs both checks against it, only while the variable `PRODUCTION_DOMAIN` is `talmolab.org` | deploys production from a PR or a branch |

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
  `node scripts/paper-thumb.mjs <key> <figure>`. Keep them local: `image:` accepts a URL,
  but a hotlinked publisher figure breaks whenever the publisher says so.
- **repos**: `src/data/repos.yaml`, array order is display order; optional `title`
  (display name) and `media:` list.
- **areas**: `src/content/areas/*.md`, the lab's three research directions, after the
  2025 research statement: biological motion capture (the statement's "scientific
  software engineering", renamed), phenoinformatics and virtual biology. Prose plus
  optional `goal:` (the line under the heading on Research), `media:`, `tools:` (repo ids)
  and `papers:` (overlay keys). Both are `reference()`s, so a typo fails the build. The
  `###` headings in the prose are the direction's threads: the Research overview lists
  and links them, so keep them short and unique across areas.
  In `media:`, the first item leads: it opens the section (and is the home page's
  figure). Every later item names the thread it illustrates, `thread: plant-roots` (the
  heading's slug); Research sets it beside that thread from 960 px and after the
  thread's text below that, and an unknown slug fails the build. List them in thread
  order.
  Cite a paper inline as `([Last et al., *Venue*, YYYY](https://doi.org/...))`: first
  author, venue in italics and year, as the publications data has them, never a link on
  a phrase.
  The file name is the section's anchor (`/research/#virtual-biology`), which
  `src/data/projects.yaml` links to. `draft: true` keeps an area out of the site.
- **media**: inline, not a collection. Each item is `{ src, poster?, width, height, alt,
  caption?, credit?, plate? }`, and `src`/`poster` must exist under `public/` or the build
  fails. The old site's `sleap_movie.gif`, `root_sleap.gif` and `nn_systems.png` stay in
  `public/media/` (the GIFs also as MP4 + WebM) because their old URLs must resolve, even
  where no page shows them any more.

### Adding a clip later

1. `scripts/encode-clip.sh <source> <name> [max-width] [poster-seconds]` writes
   `public/media/<name>.{mp4,webm,jpg}` (muted, H.264 + VP9, poster) and prints the YAML.
2. Paste it into an area's or a repo's `media:` list and write a real `alt`.
3. Build. A missing file or a typo fails `astro check`.

New footage is catalogued in `lab-website-legacy`'s local `scratch/2026-10-03-redesign-redux/CATALOGUE.md` (gitignored, not on GitHub).
Clips with identifiable people need consent first.
- **posts / news**: empty today; news arrives as `draft: true`.

## Design rules

- v003 brand. Light paper first (`#f8f8fb`, text `#1e1a29`, muted `#5c5965`, rule
  `#dedde3`, links `#805fc9` at 4.50:1), dark second (`#141319`, `#e8e7eb`, `#abaab1`,
  `#2c2a31`, links `#8c6bd6`). The theme follows the system until the header switch
  sets it (stored in `localStorage.theme`). The brand violet `#8b6dd2` is for the logo
  and non-text marks only: it is 3.80:1 on paper.
- Source Sans 3 (400/500/600, italic), self-hosted via Astro's Fonts API with Greek and
  Vietnamese subsets, is the only face: no serif and no monospace, anywhere. Small
  metadata uses `.meta`; figures that line up (years, DOIs, counts) use
  `font-variant-numeric: tabular-nums`.
- Never set "talmolab" in type: `src/components/Logo.astro` inlines the lockup so its ink
  follows the theme and its violet never changes. Clear space is 2b (0.232 × height).
- The brand kit is `brand/` (its README is the reference): the .ai and SVG masters,
  `palette.css`, the generators and the exports. The logo files in `public/` are copies:
  regenerate in `brand/`, then `python3 brand/scripts/sync-public.py`. CI fails if they drift.
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

## Old URLs

`test/live-urls.txt` is every address the live Jekyll site answers: pages, and the
images and icons under `/images/` and `/favicons/`. All of them must keep resolving.
Pages and redirects are in `public/_redirects` (first match wins; read its comments
before reordering). The live site's photos and portraits are republished at their old
`/images/<name>` paths by `src/pages/images/[file].ts`, straight from `src/assets/`;
that list is closed, so a new portrait does not go in it.

## Things that will waste your time

- The content-layer cache is `node_modules/.astro/data-store.json`, not `.astro/`.
- `The collection "posts"/"news" does not exist or is empty` is expected.
- npm 11 blocks install scripts; `esbuild`, `sharp` and `workerd` are allowed in
  `package.json` `allowScripts`. A new native dependency needs `npm approve-scripts`.
- `output: 'static'` throughout. If something seems to need SSR, reconsider.
- After back-to-back merges, some Deploy runs show `production` as **cancelled**. That
  is expected: one production deploy runs and one waits, and a newer arrival replaces
  the waiting one. Each production job deploys the tip of `main` when it starts, not its
  own commit, so the last one to run ships the newest `main`. Its step summary says
  which commit it deployed.
- A green Deploy run does not by itself mean anything was deployed: without the
  `CLOUDFLARE_API_TOKEN` secret the preview deploy step is skipped quietly (every run up
  to 2026-11-20 was like that). The production job fails loudly instead. The secrets are
  set now; if they ever go, look at the steps, not the run.
- `npm run preview` (wrangler dev) can reload while `astro build` is emptying `dist/`
  and then 404 everything. Restart it after a rebuild.
- OpenAlex merges preprints with their published versions and answers a preprint DOI with
  the journal's record. The loader takes Crossref's exact record when the DOIs differ;
  do not "fix" that by accepting OpenAlex's answer.
