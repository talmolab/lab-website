# Parity with talmolab.org

What the live Jekyll site serves today, and where each piece lands in this rebuild.
Crawled 2026-11-04 from https://talmolab.org (sitemap: 69 URLs, plus the three paths in
`test/live-urls.txt` that the sitemap omits). The live source is `talmolab/lab-website` (since renamed `lab-website-legacy`)
`main` @ `345c678`, read with `git show` only.

**Status key:** **kept** = same content, new design · **moved** = same content, different
page · **improved** = same intent, real content where live has filler · **301** = decided
redirect · **dropped** = template filler, deliberately not carried.

The hard gate is `scripts/check-urls.sh <preview>`: every path in `test/live-urls.txt`
returns 200, or a redirect that ends in 200. `docs/cutover.md` is how the site goes
onto talmolab.org once the gate passes.

## Site-wide chrome

| Live | Media / links | Behaviour | New site | Status |
|---|---|---|---|---|
| Header: old logo + "Talmo Lab" set in type, over `background.jpg` | `images/logo.svg`, `images/background.jpg` | Nav: Home, Research, Publications, Team, Join us (Tools and Blog hidden) | Header with the v003 horizontal lockup (inline SVG, never live type), clear space 2b. Nav: Research, Publications, Tools, Team, Join. Search and theme buttons. Menu button under 760 px. | improved |
| Footer over `banner.jpg` | `images/banner.jpg`; email, Google Scholar, GitHub (talmolab), Twitter (talmop) | "Last updated on" build date; © line | Footer: lab name and Salk address, email, Google Scholar, GitHub, X/Twitter, site links, exports, RSS, last-updated date, ©. `banner.jpg` is not used (a 141 px strip, the old header art). | kept |
| Search: `js/search.js` + Mark.js | — | Only `/publications/` shows a box. Every page honours `?search=` and filters `.card`, `.citation`, `.post_excerpt`: terms AND, `"phrase"` OR, `"tag: x"` OR; "Showing x of n"; highlights matches. Member pages link to `/publications/?search="Name"`. 404 has a Google `site:` search. | (1) `/publications/` filter box, same syntax, same `?search=` URLs, "Showing x of n", highlights, URL kept in sync. (2) Site-wide search dialog in the header (`/` or the Search button) over a build-time index `/search.json`: pages, people, papers, tools, research areas. (3) The 404 page carries the same search. | improved |
| Tooltips (Popper) on nav and icons | — | hover hints | Real text labels; no tooltips needed | dropped |
| Fonts: Poppins, Lora, Cousine (Google CDN); Font Awesome kit | — | — | Source Sans 3 + JetBrains Mono, self-hosted (Greek + Vietnamese subsets) | improved |
| Favicons, `share-thumbnail.jpg` | `favicons/*` | relative `og:image` (broken on every platform) | v003 favicons, manifest, absolute `og:image` (`/og-card.png`) | improved |
| No `/feed.xml` (jekyll-feed commented out) | — | 404 | `/feed.xml` RSS (posts) | new |
| `/sitemap.xml` | — | — | `/sitemap-index.xml`; `/sitemap.xml` 301s to it | kept |
| Google Analytics include (empty) | — | — | none | dropped |

## `/` Home

| Block | Media | Links | New site | Status |
|---|---|---|---|---|
| H1 "Welcome to Talmo Pereira's Lab at Salk!" | — | — | Home statement: what the lab builds and for which systems | improved |
| Intro: led by Talmo Pereira, at the Salk Institute; deep learning + computer vision tools for complex biological systems | — | `/members/talmo-pereira.html`, salk.edu | Home lede, same facts and links | kept |
| Buttons "Learn about our work", "Join us" | — | `/research`, `/join` | Text links under the lede, plus the research panel and the join block below | kept |
| Figure: "The lab, ca. 2024. Photo credit: Chris Keeney" | `2024-08-06.lab-group1.jpg` | → `/team` | Home, lab section, same caption and credit, links to Team | kept |
| Figure: "The lab, ca. 2022. Photo credit: Chris Keeney" | `the-lab.jpg` | → `/team` | Team page, beside the alumni list, same caption and credit | moved |
| — | `sleap_movie.gif`, `root_sleap.gif`, `nn_systems.png` | → research | Home "Research" panel: three figures, one per area, each linking to its section on `/research/` | new (old media) |
| — | — | — | Home: recent publications, maintained tools, join block | new |

## `/research/`

| Block | Media | Links | New site | Status |
|---|---|---|---|---|
| Intro: deep learning and computer vision, building novel computational tools | — | — | Research page lede | kept |
| Computational ethology: pose estimation and tracking; SLEAP | `sleap_movie.gif` (600×279, 8.6 s) | talmopereira.com review PDF, sleap.ai | Area 1, live copy verbatim plus the DREEM / LUC3D paragraph from the C build. Figure re-encoded to muted looping MP4 + WebM with a poster; the GIF stays at its old URL. | kept |
| Complex morphology phenotyping: plant roots, Harnessing Plants Initiative | `root_sleap.gif` (240×180) | salk.edu power-of-plants, HPI | Area 2, live copy plus the sleap-roots sentence. MP4 + WebM. | kept |
| Neuro-AI modeling: ANNs as models of neural circuits, imitation learning | `nn_systems.png` (transparent) | — | Area 3, live copy plus the MIMIC-MJX paragraph. PNG on a light plate so its black text survives dark mode. | kept |
| "See Publications for a list of recent published works" | — | `/publications/` | Each area lists its tools and selected papers; page ends with a link to Publications | improved |
| — | — | — | "Phenotyping at scale" (an area the C build added) has no old-site media and unreviewed copy; kept in the repo as `draft: true`, not rendered | held back |

## `/publications/`

| Block | Media | Links | New site | Status |
|---|---|---|---|---|
| Intro "See below for a list of recent publications" | — | — | Page lede with the count and the preprint rule | kept |
| Search box + "Showing x of n" | — | `?search=` | Filter box, same syntax and URL parameter | kept |
| 28 citations, by year, newest first: thumbnail, title (→ paper), authors, venue · date | 19 local thumbnails (`images/papers/*`), 8 hotlinked publisher figures, `sleap_movie.gif` for SLEAP | DOI / publisher links; `maree-2024.pdf` | All overlay entries (31 today: the discovery workflow added 3), by year. Every thumbnail is a local WebP: the ones the live site kept in `images/papers/`, and 7 of the 8 figures it hotlinked from publishers, now copied in so a publisher's CDN cannot break the page. The eighth (pereira-2017, Cell Press) is refused to other sites by its publisher and is a broken image on live; it shows the venue tile until someone supplies a figure. SLEAP's thumbnail is a still from `sleap_movie.gif` (the C build had swapped in a frame of new footage). Preprint linked secondarily on the published entry. Each row has an anchor (`#key`). | kept |
| — | — | — | BibTeX, CSL-JSON and JSON exports | new |
| `/images/papers/maree-2024.pdf` | PDF | from the maree-2024 entry | Same path, linked from the same entry | kept |
| `/images/papers/prasad-2022.jpg` (externally referenced) | JPG | — | 301 to the WebP at the same name | kept |

## `/tools/`

| Block | Media | Links | New site | Status |
|---|---|---|---|---|
| Lorem ipsum intro; "Featured" and "More" cards from `_data/tools.yaml` (5 placeholder entries, `images/photo.jpg`, links to github.com) | placeholder | — | A real tools page from `src/data/repos.yaml`: Maintained, then Research code, in editorial order, each with description, language, licence, docs and source links. Not in the live nav; in the new nav. | improved |

## `/team/`

| Block | Media | Links | New site | Status |
|---|---|---|---|---|
| Portrait grid, hand-ordered by role filters (pi, programmer, postdoc, staff, phd, ms, ra, undergrad, highschool, friends) | 20 portraits (`images/*.jpg`); Yipeng Li's file is missing, so a broken image | each → `/members/<slug>.html` | Current members grouped by role (ranked by `ROLE_ORDER`, never by hand). Friends of the lab last, as live. A neutral initials tile where there is no portrait. | kept |
| Button "Join the Team" | — | `/join` | Join section `#join` at the foot of Team (target of `/contact/`), linking to `/join/` | kept |
| Alumni: hand-written list, year · name (→ page) · role · Next | — | 31 entries | Alumni table generated from appointments: years, name (→ page), roles, next. 33 entries: adds Vincent Tu, who was invisible on live (`role: alumni` bug) | improved |

## `/join/`

| Block | Media | Links | New site | Status |
|---|---|---|---|---|
| Figure "The group, ca. 2024. Photo credit: Chris Keeney" | `2024-08-06.lab-group2.jpg` | → team | `/join/` is a real page again; same figure and credit | kept |
| Intro: apply below or email talmo@salk.edu with CV | — | mailto, `#opportunities` | Kept | kept |
| Philosophy (mentorship, work-life balance, open communication…) | `2024-09-05.action.jpg` | — | Kept, with the photo | kept |
| "Location, location, location!" (sunny San Diego, Salk, surfing) | `salk_sunset.jpg` | salk.edu | Kept, with the photo | kept |
| Opportunities: open positions (none), software engineers, postdocs, graduate students (+ `lab-action.jpg`, four UCSD programs), internships (BISP/COGS/CSE 199, TRELS) | `lab-action.jpg` | UCSD program links | Kept in full, `#opportunities` anchor kept | kept |
| Figure "The group, ca. 2022. Photo credit: Chris Keeney" | `the-team.jpg` | → team | Kept | kept |
| `/f/RAPTR_HPI_Recruitment.pdf` (a past HPI job ad, not linked from any page) | PDF | — | Same path, still unlinked (there are no open positions) | kept |

## `/blog/` and posts

| Block | Live | New site | Status |
|---|---|---|---|
| Post list | 3 Greene template posts (lorem ipsum, invented authors), tag links `?search="tag: …"` | Merged posts + news stream; empty today, says so and links the feed. Not in the main nav (live hides it too); linked from the footer. | kept |
| News: Twitter timeline embed of `@GreeneScientist` | template filler | not carried | dropped |
| `/2019/01/07/example-post-1.html`, `/2019/12/14/example-post-2.html`, `/2020/07/02/example-post-3.html` | template posts | 301 → `/blog/` | 301 |

## Member pages: 55 live URLs

| Live | New site | Status |
|---|---|---|
| `/members/<slug>.html`: name, portrait (or placeholder), role, links (home page, email, GitHub, Twitter, ORCID, Scholar, LinkedIn), bio, button "<Name>'s papers" → `/publications/?search="<Name>"` | 52 pages, served at `/members/<slug>` (the `.html` URL 301s there). Name, portrait, every role held with years, co-advisor, where they went next, links, bio, then the lab papers they are an author on (matched at build time on first and last name, never fuzzy beyond dropping middle initials), and a "search publications" link with the same `?search=` URL as live. | improved |
| Gregory Quach, Neeraj Venna, Ramiz Hajj (`role: alumni`, unlinked on live) | 301 → `/team/` (owner decision, astro-migration §13), from both `/members/<slug>.html` and the extensionless `/members/<slug>` that GitHub Pages also serves | 301 |
| Sungwook Min: `/members/sungwook-min.html`, live from 2024 until removed in Oct 2024 (`lab-website` 371d51e); 404 on live today, but archived at 200 by the Wayback Machine | 301 → `/team/`, like the three above | 301 |
| `/members/`: never a page (404 on live) | 301 → `/team/` | new |
| Pranav Sankar | Never had a page; alumni row only, as live | kept |

## Other URLs

| Live | New site | Status |
|---|---|---|
| `/contact/`, `/contact`, `/contact/index.html`: Greene filler ("Department of Metaphor", scrooge@mcduck.com, a Nova Scotia map pin, `images/photo.jpg`) | 301 → `/team/#join`; the real address and email are in the footer and on `/join/` | 301 |
| `/CLAUDE.html`, `/CLAUDE`, `/CLAUDE.md`: internal notes, rendered as a page and served raw | 301 → `/` | 301 |
| Every section page's other two shapes: `/<section>` (GitHub Pages 301s it to the slash) and `/<section>/index.html` (200), for research, publications, team, join, tools and blog; and `/index.html` | 301 → `/<section>/` and `/`. Workers' own answer for these is a 307, which does not move a search index. | 301 |
| The three example posts without `.html` (GitHub Pages serves them) | 301 → `/blog/` | 301 |
| `/images/sleap_movie.gif` (externally referenced) | Same file at the same path | kept |
| `/404.html`: "Page Not Found" + Google `site:` search | Custom 404 with the site search and the main sections | improved |
| `/feed.xml`: 404 on live | RSS feed | new |
| `/robots.txt` | Production allows all; every other host disallows all and pages carry `noindex` | kept |

## Static files: everything else the live site serves

GitHub Pages publishes every file in the Jekyll repo that does not start with an
underscore, so the live site answers at many addresses no page links to. Each one was
requested on talmolab.org (2026-11-14, `lab-website` @ `345c678`); the 105 that return
200 are accounted for here, and the ones marked kept or 301 are in `test/live-urls.txt`.

| Live | New site | Status |
|---|---|---|
| `/images/<name>.{jpg,jpeg,png}`: 7 lab photos and 42 portraits, at their original size | Same path, same bytes. `src/pages/images/[file].ts` republishes the originals from `src/assets/` at build time; the pages themselves use Astro's optimised copies. Five were renamed on the way into `src/assets/` (`aaditiya-prasad.jpg`, `ck.png`, `divya-murali.jpg`, `member.jpg`, `talmo-pereira-2024-09-alt@1x.png`) and keep their old names here. | kept |
| `/images/papers/*.png`, `*.jpg` (18 thumbnails) | 301 → the WebP of the same name | 301 |
| `/images/sleap_movie.gif`, `/images/root_sleap.gif`, `/images/papers/maree-2024.pdf`, `/f/RAPTR_HPI_Recruitment.pdf` | Same path, same file | kept |
| `/images/nn_systems.png` | 301 → `/media/nn-systems.png` (same file) | 301 |
| `/images/talmo-pereira.jpg`, `/images/talmo-pereira-old.jpg` (earlier portraits, unused by any live page) | 301 → the current portrait | 301 |
| `/images/logo.svg`, `logo_static.svg`, `logo_static_outline.svg`, `logo_static_grey_bg.svg`, `logo_static_grey_bg.png` (the old flask logo) | 301 → the v003 mark, so an embed elsewhere picks up the new brand | 301 |
| `/favicons/favicon.png`, `android.png`, `ios.png`, `share-thumbnail.jpg`, `site.webmanifest` | 301 → `/favicon-32.png`, `/icon-192.png`, `/apple-touch-icon.png`, `/og-card.png`, `/site.webmanifest` | 301 |
| `/images/gregory-quach.jpg`, `neeraj-venna.jpg`, `ramiz-hajj.jpg`, `sungwook-min.jpg` | 404. These people were removed from the site (owner decision); their portraits go with them. | dropped |
| `/images/background.jpg`, `/images/banner.jpg`, `/images/placeholder.svg` | 404. Header and footer art of the old theme, and its placeholder. | dropped |
| `/css/*.css`, `/js/*.js`, `/auto-cite/*`, `/cite.sh`, `/start.sh`, `/CNAME`, `/CITATION.cff`, `/README.md`, `/LICENSE.md` | 404. The Jekyll theme's own assets and repo plumbing that Pages happened to publish. No page links to them and the Wayback Machine has never archived them. | dropped |

## Old-site media: where each file went

| File | Used on |
|---|---|
| `2024-08-06.lab-group1.jpg` | Home |
| `2024-08-06.lab-group2.jpg` | Join |
| `2024-09-05.action.jpg` | Join (Philosophy) |
| `lab-action.jpg` | Join (Graduate students) |
| `the-lab.jpg` | Team |
| `the-team.jpg` | Join (foot) |
| `salk_sunset.jpg` | Join (Location) |
| `sleap_movie.gif` | Research, Home (as MP4/WebM); the GIF itself stays at its URL and is the SLEAP paper's thumbnail |
| `root_sleap.gif` | Research, Home (as MP4/WebM) |
| `nn_systems.png` | Research, Home |
| `images/papers/*` | Publications, Home, member pages (WebP) |
| Portraits | Team, member pages |
| `banner.jpg`, `background.jpg` | not used: old header/footer art, 141 px and 101 px strips |
| `logo*.svg`, `placeholder.svg` | not used: the v003 lockup replaces the logo |

## Verification (2026-11-20): every legacy URL, not just the sitemap

The legacy address space was rebuilt from three sources: a crawl of talmolab.org
following every same-host `href`, `src`, `srcset` and CSS `url()` from the sitemap and
the fixture (289 paths), every file `lab-website` @ `345c678` publishes, and every
talmolab.org URL the Wayback Machine has archived (first capture 2021-12; the site has
had this URL scheme throughout). 312 distinct paths, each requested on the live site and
on the preview, plus the other URL shapes GitHub Pages answers (`/<section>`,
`/<section>/index.html`, extensionless `.html` files).

- 24 live addresses were missing or answered with a temporary 307; they are now 301s and
  in `test/live-urls.txt` (177 paths). `check-urls.sh` now fails on a 302 or 307.
- What still 404s is exactly the "dropped" rows above: the old theme's CSS and JS, repo
  plumbing, the old header art and placeholder, and the portraits of people removed
  from the site.
- `./scripts/check-urls.sh` against a local build under `wrangler dev`: **177 passed, 0 failed**.

## Verification (2026-11-14)

Re-run against a local production build (`SITE_URL=https://talmolab.org npm run build`,
served by `wrangler dev`), with the live site crawled the same day for comparison.

- `./scripts/check-urls.sh`: **152 passed, 0 failed**: the live sitemap's 69 pages (the
  sitemap is unchanged since the fixture was taken), three external paths, and 80 static
  files (see "Static files" above).
- `./scripts/check-production.sh`: **20 passed, 0 failed**: indexable, canonical to
  talmolab.org, production robots.txt and sitemap, 301s, immutable hashed assets.
- Content, page by page, in a browser on both sites: all 20 current members and all 32
  live alumni rows are present (plus Vincent Tu); all 52 member bios match sentence for
  sentence; all 28 live publications are present (three under the titles their
  preprints now carry); every external link in the live pages' content is present,
  with `twitter.com` profile links now `x.com`.
- No failed request and no console error on any of the 67 crawled pages.
- Interaction, in Chromium: theme switch and its persistence, `/` and the header button
  opening search, results and Enter, the publications filter (`?search=`, phrases,
  highlighting, empty state, clear), author-list expansion, `#key`, `#opportunities` and
  `#join` anchors, clips playing on screen and pausing, no autoplay under reduced
  motion, the phone menu, a real 404, and the site with JavaScript off.

## Verification (2026-11-04)

- `./scripts/check-urls.sh https://talmolab-next.talmo-lab.workers.dev`: **72 passed, 0 failed**
  (every path in `test/live-urls.txt`, then the sitemap's 69 plus three external ones).
- Also served on the preview: `/feed.xml`, `/publications.bib` (text), `/publications.csl.json`,
  `/publications.json`, `/search.json`, `/sitemap-index.xml`, `/robots.txt` (Disallow: / off
  production), favicons, manifest, `/og-card.png` (absolute `og:image`), a real 404 status.
- `npm run build` (`astro check && astro build`): 0 errors, 0 warnings, 0 hints.
- Every page type reviewed in the built-in browser at 1440×900 and 375×812, light and dark;
  no horizontal overflow at 375, 768, 900, 1024, 1280 or 1440. axe-core (WCAG 2.1 AA plus
  best practice): no violations on any page type in either theme.
- Search: `/publications/?search="Talmo Pereira"` shows 29 of 31 (the live phrase search
  missed every "Talmo D. Pereira"); `?search=Benna` opens the collapsed author list that
  holds the match; the site search finds people, papers, tools, areas and pages.

## Deliberate differences from the live site

| Live | New | Why |
|---|---|---|
| `/members/<slug>.html` is the page | `/members/<slug>` is the page; `.html` 301s to it | Workers serves `build.format: 'preserve'` files without the extension; a 301 moves the index (as decided for the Astro migration) |
| `/join/` and `/contact/` both pages | `/join/` a page; `/contact/` 301 → `/team/#join` | `/contact/` is template filler |
| Example posts, `/CLAUDE.html` | 301 | template filler / internal notes |
| `/tools/` lorem ipsum | real list from `repos.yaml` | parity of intent |
| 28 publications | 31 | the discovery workflow added three since the live site was last edited |
| "mills-2022" shown as bioRxiv 2022 | still bioRxiv 2022 | OpenAlex merges it with a 2026 Neuron paper with a different title; Crossref has no `is-preprint-of` link, so the overlay rule says do not associate (see the PR's open questions) |
| Footer "Google Scholar" goes to an error page (`user=Talmo Pereira`) | the profile (`user=tFrElIUAAAAJ`), also on Talmo's member page | the live link is broken |
| Yipeng Li's portrait is a broken image | initials tile | no portrait exists in the old site's media |
| Live footer art (`banner.jpg`, `background.jpg`) | not used, and their URLs 404 | the old header/footer strips belong to the old design |
| 8 publication thumbnails hotlinked from publishers | 7 copied into `public/images/papers/`; pereira-2017 has none | a hotlink is one publisher CDN change from a broken image; Cell Press already refuses the eighth to other sites |
| Portraits of the three removed people still served | 404 | removed with their pages |
| Old flask logo and `/favicons/*` | 301 to the v003 mark and icons | the brand changed; embeds and shortcuts follow it |
