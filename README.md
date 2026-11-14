# talmolab redux

The rebuild of [talmolab.org](https://talmolab.org), the website of Talmo Pereira's lab at
the Salk Institute: full parity with the live site, the old site's media only, and a
fresh design on the v003 brand.

**Preview:** https://talmolab-next.talmo-lab.workers.dev (kept out of search indexes).

talmolab.org is still served from
[`talmolab/lab-website`](https://github.com/talmolab/lab-website), and that repo's own Astro
preview deploys to a different Worker (`talmolab-site`). This repo deploys to
`talmolab-next`, which declares no routes. The earlier direction-C build is still at
https://talmolab-redux.talmo-lab.workers.dev for comparison.

**Going live.** The site is ready to replace talmolab.org and the switch is off:
[`docs/cutover.md`](docs/cutover.md) is the procedure (one repository variable and one
workflow run) and the rollback. [`docs/parity.md`](docs/parity.md) maps every page,
image and file of the live site to where it lands here.

## Commands

```bash
npm run dev        # astro dev on :4321
npm run build      # astro check && astro build
npm run preview    # wrangler dev over dist/, the way Workers serves it
npm run deploy     # build, then wrangler deploy to the preview

./scripts/check-urls.sh <base>         # every URL the live site serves still resolves
./scripts/check-production.sh <base>   # the build is the production one
```

Set `GITHUB_TOKEN` (e.g. `export GITHUB_TOKEN=$(gh auth token)`) before building: the tools
page enriches `src/data/repos.yaml` from the GitHub API, and unauthenticated calls run out
quickly. Publications come from OpenAlex and need no key.

## Keeping it current

- **Lab members** open a [Lab member update](../../issues/new?template=member.yml) issue to
  join the team page, update their entry, record a new role or record leaving. A workflow
  turns it into a pull request; a maintainer reviews and merges.
- **Publications** are discovered weekly from OpenAlex and Crossref. New papers and
  preprint links arrive as a pull request; anything that needs a decision is listed in
  the standing "Discovery report" issue.
- **Deploys** happen on every merge to `main`, and weekly to refresh citation counts,
  once the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets are set.
  They go to the preview, and also to talmolab.org once the cutover has been made.

`CLAUDE.md` has the details.

## What came from where

Content, schemas and loaders are carried over from `lab-website` (branch `astro-migration`),
so the rules in its `CLAUDE.md` still hold: alumni status is derived from `end`, the
publications overlay is an allowlist, keys are permanent. `docs/parity.md` maps every page
of the live site to this one.

Media is only what talmolab.org already shows: lab photos, portraits, paper thumbnails,
and three research figures (two GIFs, re-encoded as muted loops, and a diagram). New
footage is added one clip at a time: `scripts/encode-clip.sh`, then a `media:` entry in
an area or a repo (see `CLAUDE.md`).

## Design

Light paper first, with a dark theme that follows the system or the header switch. v003
brand: ink `#1e1a29`, logo violet `#8b6dd2`, links `#805fc9` on paper and `#8c6bd6` on the
dark ground. The logo is always the SVG lockup. Type is Source Sans 3 and JetBrains Mono,
self-hosted.

One structure recurs on every page: a narrow label column beside the content (`.ledger`
in `src/styles/global.css`, which holds the whole system). Clips play only while on screen,
never automatically under reduced motion, and each has its own pause button.
