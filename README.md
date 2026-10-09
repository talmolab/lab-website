# talmolab redux

A media-first redesign of [talmolab.org](https://talmolab.org), the website of Talmo
Pereira's lab at the Salk Institute. Direction **C, "Instrument"**, from round r35 of the
redesign (design canvas: https://claude.ai/artifact/Abwat2Q9tPbQPQx4u6nvoM).

**Preview:** https://talmolab-redux.talmo-lab.workers.dev (kept out of search indexes).

This repo does not touch the live site. talmolab.org is still served from
[`talmolab/lab-website`](https://github.com/talmolab/lab-website), and that repo's own Astro
preview deploys to a different Worker (`talmolab-site`). This one deploys to
`talmolab-redux`, which declares no routes.

## Commands

```bash
npm run dev        # astro dev on :4321
npm run build      # astro check && astro build
npm run preview    # wrangler dev over dist/, the way Workers serves it
npm run deploy     # build, then wrangler deploy
```

Set `GITHUB_TOKEN` (e.g. `export GITHUB_TOKEN=$(gh auth token)`) before building: the tools
page enriches `src/data/repos.yaml` from the GitHub API, and unauthenticated calls run out
quickly. Publications come from OpenAlex and need no key.

## What came from where

Content, schemas and loaders are carried over from `lab-website` (branch `astro-migration`),
so the rules in its `CLAUDE.md` still hold: alumni status is derived from `end`, the
publications overlay is an allowlist, keys are permanent. New here:

- **`media` collection** (`src/data/media.yaml`): 51 web encodes in `public/media/`, each with
  a poster that matches its first frame. Written by `scripts/encode-media.py` from the source
  footage, which is not in this repo (3 GB); every clip's `source` is a catalogue ID in
  `lab-website/scratch/2026-10-03-redesign-redux/CATALOGUE.md`.
- **Research areas** point at clips (`lead`, `media`); `phenotyping.md` is a new area.
- **Repos** may name a clip (`media:` in `repos.yaml`).

## Design

v003 brand: the dark ground `#141319`, text `#e8e7eb`, one accent `#8c6bd6` (4.56:1). The logo
is always the SVG lockup. Type is Source Sans 3 and JetBrains Mono, self-hosted.

Video autoplays only on screen and only while motion is on. The rail's **Pause motion**
button switches it off site-wide and is remembered; `prefers-reduced-motion` starts with it
off. Clicking a clip plays or pauses that clip alone.

`src/styles/global.css` holds the whole system. Justified rows (`.jrow`) give each clip a
`flex-grow` equal to its aspect ratio, so clips of any shape share a row height without
cropping.

Clips with identifiable people (gait recordings, a home recording) are deliberately not
included: they need consent first.
