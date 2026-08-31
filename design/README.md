# talmolab logo — v002

**Status: final.** Colours chosen 2026-08-30 and ratified by lab vote — Ink & SLEAP Blue won by
16 votes over the runner-up (08 Ink & Violet). Everything here regenerates from two hex values, so
a future change costs one script run — see [Changing the colours](#changing-the-colours).

---

## What's here

**Sources are tracked; generated assets are not.** ~316 KB of text regenerates ~16.6 MB of
binaries, so this directory commits the inputs and `.gitignore`s the outputs — the same reason you
would not commit `dist/`.

```
design/
  talmolab-logo.v002.svg    master art (transforms normalised — see below)
  palette.css               colour tokens, all contrast-verified
  type-system.css           Source Sans 3 + JetBrains Mono, with the evidence
  meta-tags.html            the <head> block for link unfurls
  scripts/                  the generators
  build/                    GITIGNORED — 30 SVGs, 126 PNGs, the .ico
public/                     the 12 files the site actually serves (237 KB)
```

Regenerate everything:

```bash
cd design/scripts
python3 mkassets.py     # 30 SVGs from the master
python3 raster.py       # 126 PNGs + favicon.ico, via headless Chrome
python3 mkog.py         # unfurl cards + app icons
python3 sync-public.py  # copy the 12 served files into public/
```

`sync-public.py --check` exits non-zero if `public/` has drifted from `build/`, which is the useful
thing to run in CI.

The exploration behind these decisions — the ten colour options, the round sheets, the type
comparisons — is archive rather than build input and lives outside the repo.

---

## The decision

**Option 01 — Ink & SLEAP Blue.**

| Role | Hex | OKLCH | Carries |
|---|---|---|---|
| Ink | `#1f2328` | 23.5% 0.008 250° | the `t`, the dendritic arbor, “talmo” |
| Accent | `#2176b3` | 54.7% 0.123 250° | the `l` bar, the pose skeleton, the soma dot, “lab” |

Chosen from ten pairings rendered on the finished mark (round 26 review sheet). Why this one:

- **The accent works unmodified as interface colour.** At 4.62:1 on paper it carries link text
  and buttons as-is. Its light- and dark-mode siblings sit 4.3 lightness points away, so the
  colour in the logo is effectively the colour on the site. Most alternatives drift much further —
  chartreuse by 20.5, amber by 15.5, at which point the logo's colour never appears in the UI.
- **It inherits SLEAP's blue**, which settles the open question in §12.3 of the migration doc:
  the lab's existing visual equity carries over rather than being discarded.
- **Colour-blind separation of 30.2**, comfortably clear of the point where the mark's two halves
  start reading as one object.

The trade-off, recorded honestly: this is the **least distinctive** option of the ten. Blue on
near-black is what most of computational neuroscience looks like. It was chosen for practicality
over distinctiveness, and that is a real cost.

### Changes from v001

- Colours: `#32383a` / `#cc6633` (slate & terracotta) → `#1f2328` / `#2176b3`.
- Geometry: wordmark spacing adjusted; the mark shifted right relative to v001. **v002 is the
  source of truth** — do not regenerate assets from v001 paths.

---

## Palette

The two logo values plus everything derived from them for the site. Every pair below was verified
at WCAG AA or better (70/70 token pairs passing).

### Light

| Token | Hex | Contrast |
|---|---|---|
| `paper` | `#f7f9fb` | ground |
| `surface` | `#feffff` | — |
| `sunk` | `#edf0f4` | — |
| `rule` | `#dadee3` | — |
| `text` | `#1f2328` | 14.97 : 1 |
| `muted` | `#555b64` | 6.49 : 1 |
| `link` | `#1776b6` | 4.62 : 1 |
| `mark` | `#2176b3` | 4.62 : 1 |

### Dark

| Token | Hex | Contrast |
|---|---|---|
| `ground` | `#101419` | ground |
| `text` | `#e5e8ec` | 15.04 : 1 |
| `muted` | `#a7abb1` | 8.01 : 1 |
| `rule` | `#272c31` | — |
| `accent` | `#2a83c4` | 4.53 : 1 |

**Note on the two blues.** `#2176b3` is the brand blue and appears in the logo in both themes.
`#2a83c4` is the dark-mode *interface* accent — used for link text and buttons on the dark ground,
where the brand blue only reaches 3.79:1. The logo does not switch; only UI text does.

---

## Assets

Generated from `talmolab-logo.v002.svg` with Chrome as the rasteriser. All paths below are under `design/build/`.

```
build/svg/       30 files — vector, tight-cropped viewBoxes
build/png/       90 files — transparent and solid-background rasters
build/favicon/   36 PNGs + favicon.ico (16/32/48)
build/og/        4 unfurl cards, 5 app icons
```

### The Illustrator export had a portability bug — fixed

The original export drew the `l` of “talmo” as a rect rotated `-89.9966°`:

```xml
<rect x="190.75" y="1004.01" width="231.85" height="38.67"
      transform="translate(-716.6843 1329.9619) rotate(-89.9966)"/>
```

**ImageMagick's built-in SVG renderer silently drops rotated rects that have non-zero `x`/`y`** —
isolated and confirmed, not guessed. It emits no warning and exits 0, so `magick` rendered the
wordmark as “ta molab” and looked like it had worked.

The rotation was **0.0034° off square** — a 0.023 px deviation at 2048 px wide — so the rect was
replaced with its axis-aligned equivalent, `x="287.34" y="907.42" width="38.68" height="231.85"`.
Verified against Chrome before and after: **5 pixels differ out of 2,683,200** (RMSE 0.0004), which
is the antialiasing that rotation was producing. The master now has **zero transforms** and renders
correctly in ImageMagick, Chrome, librsvg and anything else.

Illustrator will reintroduce the transform on every re-export. After exporting a new master:

```bash
python3 scripts/normalize-svg.py talmolab-logo.v002.svg          # bakes transforms, keeps a .orig
python3 scripts/normalize-svg.py talmolab-logo.v002.svg --check  # exits non-zero if any remain
```

The original export is preserved as `talmolab-logo.v002.svg.orig`.

*Separately:* this machine has no `rsvg-convert`, so ImageMagick falls back to its weak internal
renderer even though `magick -list delegate` advertises librsvg. `brew install librsvg` makes
ImageMagick considerably more trustworthy on SVG generally. The scripts use Chrome regardless,
since it is the same engine that will render the logo on the site.

### Shapes

| Shape | Contents | Aspect |
|---|---|---|
| `lockup` | mark + wordmark, stacked | 1191 × 1087 |
| `lockup-h` | mark + wordmark, side by side — **use this in the nav** | 2323 × 767 |
| `mark` | mark only, no wordmark | 1106 × 767 |
| `wordmark` | “talmolab” only | 1114 × 237 |
| `favicon` | mark, squared with 9% padding | 1 : 1 |

### Colourways

| Suffix | Ink | Accent | Background | Use |
|---|---|---|---|---|
| `-light` | `#1f2328` | `#2176b3` | transparent | on light backgrounds |
| `-dark` | `#e5e8ec` | `#2176b3` | transparent | on dark backgrounds |
| `-on-paper` | `#1f2328` | `#2176b3` | `#f7f9fb` | when transparency is unavailable |
| `-on-ground` | `#e5e8ec` | `#2176b3` | `#101419` | dark, opaque |
| `-mono-ink` | `#1f2328` | `#1f2328` | transparent | single-colour print, fax, embroidery |
| `-mono-white` | `#ffffff` | `#ffffff` | transparent | knockout on photos or colour |

### Sizes

- `lockup`, `wordmark` — 512, 1024, 2048 px wide
- `mark` — 256, 512, 1024, 2048 px wide
- `favicon` — 16, 32, 48, 64, 128, 256, 512 px square, plus `favicon.ico` (16–256 bundled)

---

## Link unfurls — `og/`

What Slack, iMessage, Twitter/X, LinkedIn and Discord show when a talmolab.org URL is pasted.
**`meta-tags.html` is the thing to actually use** — a drop-in `<head>` block plus the
`site.webmanifest` contents and cache-busting notes for each platform.

| File | Size | Use |
|---|---|---|
| `talmolab-og-light-1200x630.png` | 1200 × 630 | **the default card** |
| `talmolab-og-dark-1200x630.png` | 1200 × 630 | dark alternate |
| `talmolab-og-square-light-1200x1200.png` | 1200 × 1200 | platforms that prefer 1:1 |
| `talmolab-og-square-dark-1200x1200.png` | 1200 × 1200 | dark 1:1 |
| `talmolab-apple-touch-icon.png` | 180 × 180 | iOS home screen / share sheet |
| `talmolab-icon-192.png`, `-512.png` | 192, 512 | web app manifest |
| `talmolab-maskable-512.png` | 512 × 512 | Android maskable — 26% safe-zone padding |
| `talmolab-maskable-dark-512.png` | 512 × 512 | dark maskable |

All are **opaque 3-channel sRGB with no alpha**, which is what unfurl scrapers expect.
The cards use the real lockup art rather than re-typesetting the wordmark, so the letterforms
match the logo exactly.

Card copy is drawn from the site's own words — the home page's "computational tools that leverage
deep learning and computer vision to study complex biological systems", condensed. **Change it in
`scripts/og-template.html` if you'd rather it said something else**; it is one line of HTML.

Two things that bite here, both already handled in the scripts but worth knowing:

- **`og:image` must be an absolute URL.** A relative path yields a card with no image on every
  platform, silently. `meta-tags.html` shows the Astro `new URL(..., Astro.site)` form.
- **Chrome enforces a minimum window width**, so screenshotting a 180 × 180 icon directly lays the
  page out much wider and crops it — which produced near-empty icons twice before this was caught.
  Icons render at 1024 and downsample. Don't "simplify" that.

### Type

The card text is set in **Source Sans 3** with the URL in **JetBrains Mono**, matching the site
(`type-system.css`). Cards were re-rendered 2026-08-30 when the type system was settled; they
previously used Bricolage Grotesque and IBM Plex Mono, carried over from earlier identity rounds.

Source Sans 3 is a text face rather than a display one, so the headline runs at **700 / -0.02em**
where Bricolage sat at 600 / -0.025em — that is the site's own `h1` spec, so an unfurl card and a
page heading now agree.

**The type is baked into the PNG.** Changing a face means editing the font link *and* the weights
in `scripts/og-template.html`, then re-running `scripts/mkog.py` and `scripts/sync-public.py`.
Watch the weights specifically: `.meta` asks for 500, and if the stylesheet link does not request
it the browser silently rounds to the nearest loaded instance.

---

## Known gaps

- ~~The favicon does not survive 16px.~~ **Fixed — simplified cut, see below.**
- ~~No clear-space rule.~~ **Defined — see below.**
- **Wordmark weight is untouched** — still the inherited assumption from earlier rounds, not a
  designed choice.

---

## The simplified favicon cut

The full mark collapses below 32px — the arbor and the skeleton both turn to noise. Verified by
magnifying the rendered output, not assumed. The before/after is in the archive (`favicon-simplified.png`).

**The cut keeps the `t` and the `l` bar**, which are the two elements dense enough to survive and,
conveniently, the two letters the name is built from. The arbor, the skeleton and the soma dot are
dropped.

Three things had to be worked out, and are worth not rediscovering:

- **The `t` and the arbor are a single path in the master**, so the arbor cannot be deleted. It is
  clipped away at `x >= 480` instead. That value is empirical: below ~470 an arbor stub survives,
  above ~500 the `t`'s crossbar starts losing its left arm.
- **Cropping the viewBox does not work.** The `t`+bar region is tall and narrow, so squaring it for
  an icon expands it horizontally and pulls the arbor and skeleton straight back in. Clipping first,
  then squaring, adds empty space instead.
- **The bar is trimmed to the `t`'s height** (`y 236`, `height 587`). At its full height it
  overshoots the `t` and unbalances the square.

The soma dot was tried and rejected: with the arbor gone it floats unattached to the left of the
`t`, and at 16px it reads as a stray pixel rather than a feature.

### Where each icon family is used

| Family | Art | Sizes | Why |
|---|---|---|---|
| `favicon/` | **simplified cut** | 16–512 + `.ico` | never rendered large; must hold at 16px |
| `og/` app icons | **full mark** | 180–512 | apple-touch and maskable never render below 180px, where the full mark is legible and richer |

The clipPath is standard SVG and renders correctly in ImageMagick as well as browsers — verified,
since the master's earlier `rotate` did not.

---

## Clear space

The minimum empty margin around the logo that nothing else may enter — no text, image, rule, or
container edge. Measured in a unit taken from the logo itself, so it scales automatically.

**Unit `b` = the width of the blue bar in the mark = 88.91 viewBox units.**

**Rule: clear space = `2b` on all four sides** — 23% of the logo's height, 7.7% of the horizontal
lockup's width. Chosen because `b` is the single most identifiable measure in the mark and holds
its proportion in every variant.

| Logo height | Clear space each side |
|---|---|
| 28 px | 6.5 px |
| 40 px | 9.3 px |
| 52 px (site nav) | 12.1 px |
| 80 px | 18.6 px |
| 120 px | 27.8 px |

In CSS the rule falls out of the height, so it needs no magic numbers:

```css
.logo { height: 52px; margin: calc(var(--logo-h) * 0.232); }
/* or, in a flex nav */
nav { gap: calc(52px * 0.232); padding-inline: calc(52px * 0.232); }
```

**Where the shipped assets already stand.** The tight-cropped SVGs (`-light`, `-dark`, `-mono-*`)
have **zero** built-in margin — clear space must come from layout. The `-on-paper` / `-on-ground`
variants carry 6% built in, which is *less* than `2b`; they are drop-in tiles for slots that supply
their own surrounding space, not a substitute for the rule. Favicons carry 9–11% and maskable
icons 26%, both governed by platform masking rather than this rule.

The diagram and the common violations are in the archive (`clear-space.png`).

---

## Changing the colours

The logo is two fills. To regenerate the entire set in different colours, change `INK` and `ACC` in
`scripts/mkassets.py` (and the master SVG) and re-run:

```bash
cd scripts
python3 mkassets.py   # 22 SVGs
python3 raster.py     # 88 PNGs + favicon.ico
python3 mkog.py       # 4 unfurl cards + 5 app icons
```

The ten-option review sheet and the nine rejected pairings remain in
the archive for the record.

---

*Generated 2026-08-30. `scratch/` is gitignored — these assets are not tracked in the repo.*
