# talmolab brand kit (v003)

The logo, its colours and the scripts that make every file here, in one place. The site's
footer links to this folder.

- **Logo files**: `svg/` (any size), `png/` (512 and 1024 px wide), `favicon/`, `og/`.
  Read the [usage rules](#usage-rules) first.
- **Colours**: `palette.css`, and the tables under [Palette](#palette).
- **Type**: `type.css`, and [Type](#type).
- **Sources**: `talmolab-logo.v003.ai` (Illustrator) and `talmolab-logo.v003.svg` (the
  normalised export every script reads).

**Status.** v003 is the v002 mark recoloured **Ink & Violet** (2026-09-09), in use on
talmolab.org. It was not put to a lab vote the way v002's blue was. The horizontal lockup
was redrawn on 2026-11-20 so the wordmark is as tall as the mark's `l`
([below](#the-horizontal-lockup)). Until then this kit lived only in the old site's
gitignored `scratch/` folder; it moved here, into `talmolab/lab-website`, on 2026-11-20.

---

## Usage rules

1. **Never set “talmolab” in type.** Not in a heading, a slide title or a sign. Use a
   lockup from `svg/`: its letters are outlines from the master, not a font. In running
   text the lab is “Talmo Lab”.
2. **Keep clear space**: `2b` on every side, which is 0.232 × the logo's height
   (9 px around a 38 px logo). Details under [Clear space](#clear-space).
3. **Stay above the minimum sizes** below.
4. **One accent.** Violet is the only colour beside ink and paper. Structure comes from
   weight, rules and position, not from a second hue, a gradient or a tint of the violet.
5. **The violet is for the logo and non-text marks.** It is 3.80:1 on paper, under AA.
   Text and links use `#805fc9` on paper (4.50:1) and `#8c6bd6` on the dark ground
   (4.56:1). The logo's violet is `#8b6dd2` in both themes; only its ink reverses.
6. **Match the colourway to the ground**: `-light` on light grounds, `-dark` on dark ones,
   `-on-paper` or `-on-ground` where transparency is not available, `-mono-ink` for
   one-colour printing, `-mono-white` over photographs. See [Colourways](#colourways).
7. **Do not alter it.** No other colours, no stretching, rotating, outlines, shadows or
   effects, no rearranging the mark and the wordmark, no redrawn letters. The layouts are
   the shapes in `svg/`; the only other cut is the favicon's.

### Minimum sizes

Height on screen, judged from renders at 1× pixel density, where detail goes first. On 2×
screens these hold with room to spare.

| Shape | Smallest | Below that | What fails first |
|---|---|---|---|
| `lockup-h` | 24 px tall | the favicon cut | the arbor and the skeleton blur together |
| `lockup` (stacked) | 64 px tall | `lockup-h` | the mark above, then the small wordmark |
| `mark` | 32 px tall | the favicon cut | the arbor and the skeleton turn to noise |
| `wordmark` | 12 px tall | `lockup-h` | the counters of a, o and b close |
| `favicon` | 16 px | nothing smaller | drawn for 16 px |

The site's header uses `lockup-h` at 38 px, 32 px on phones, and never below 24 px.

---

## Type

**Source Sans 3 only**, weights 400, 500 and 600 with italics, self-hosted with Latin,
Latin-ext, Vietnamese and Greek subsets. No serif and no monospace. `type.css` has the face
and the site's scale. It was chosen on coverage of the site's real content (Vietnamese
names, Greek, maths); `og/type-system.css` is the record of that decision from 2026-08-30,
which also chose JetBrains Mono, since dropped.

---

## What's here

```
brand/
  talmolab-logo.v003.ai        Illustrator source
  talmolab-logo.v003.svg       master: the .ai export, transforms baked out
  talmolab-logo.v003.svg.orig  the raw export, before normalize-svg.py
  palette.css                  colour tokens, named as on the site
  type.css                     the typeface and the site's type scale
  scripts/                     the generators (Python 3, headless Chrome, ImageMagick)
  svg/        36   every shape in every colourway, tight-cropped
  png/        66   512 and 1024 px (and 256 for the mark); the 2048 px renders are gitignored
  favicon/    49   simplified cut, 16 to 512 px, plus favicon.ico
  og/              link-unfurl cards, app icons, meta-tags.html, type-system.css
  contact-sheet*.png           every variant in one grid, three backgrounds
  clear-space.png, favicon-simplified.png   the two rule diagrams
```

The 2048 px PNGs (30 files, 4.8 MB) are left out of git because every one of them is a
single command away, and anything larger than 1024 px is better served by the SVG.

### The site's copies

The site serves 13 of these files from `public/` under its own names (the header logo,
the favicons, the app icons and `og-card.png`). They are copies. Change the logo here,
regenerate, then:

```bash
python3 brand/scripts/sync-public.py           # copy into public/
python3 brand/scripts/sync-public.py --check   # exit 1 if public/ has drifted (CI runs this)
```

The list of files, and what the site uses each for, is at the top of `sync-public.py`.
`src/components/Logo.astro` inlines `public/talmolab-lockup-h-light.svg` and recolours its
ink with CSS, so one file serves both themes.

### Regenerating everything

```bash
cd brand/scripts
python3 mkassets.py   # 36 SVGs, and variants.json
python3 raster.py     # 144 PNGs + favicon.ico   (raster.py lockup-h: just one shape)
python3 mkog.py       # 4 unfurl cards + 5 app icons
python3 mksheet.py    # 3 contact sheets (reads the 2048 px PNGs)
python3 mkdocs.py     # clear-space.png + favicon-simplified.png
python3 sync-public.py
```

The scripts expect Chrome at `/Applications/Google Chrome.app` (edit `CHROME` at the top of
each to move it) and ImageMagick's `magick` on the path.

---

## The decision

**Option 08 — Ink & Violet**, the runner-up in the round-26 vote that picked Ink & SLEAP
Blue for v002.

| Role | Hex | OKLCH | Carries |
|---|---|---|---|
| Ink | `#1e1a29` | 23.0% 0.029 296° | the `t`, the dendritic arbor, “talmo” |
| Accent | `#8b6dd2` | 60.9% 0.150 295° | the `l` bar, the pose skeleton, the soma dot, “lab” |

Where v002's blue sat at hue 245–254°, the whole v003 family sits at 293–298°. The ink is
violet-tinted rather than blue-tinted, so the two logo values share a hue rather than
contrasting across one.

Geometry is v002's. The v003 master is a pure recolour, verified rather than assumed: with
both rendered in the same colour at 2048 px, 17 pixels of 2,908,160 differ (RMSE 0.0009),
which is antialiasing.

### What this buys, from the round-26 numbers

|  | Ink & SLEAP Blue (v002) | Ink & Violet (v003) |
|---|---|---|
| Accent lightness | 54.7 | **60.9** |
| Separation between the two values | 31.3 | **39.8** |
| Colour-blind separation | 30.2 | **37.7** |
| Drift between logo and UI accent | 4.3 | **4.0** |

Violet wins on every one of those, and it is the least-used hue in the field; v002's own
record was that blue on near-black “is what most of computational neuroscience looks like”.

### What violet costs

**The brand violet fails WCAG AA on paper.** This inverts v002 exactly:

| Accent on … | v002 blue `#2176b3` | v003 violet `#8b6dd2` |
|---|---|---|
| paper | 4.62 : 1 ✅ | **3.80 : 1 ❌** |
| dark ground | 3.79 : 1 ❌ | **4.59 : 1 ✅** |

So:

- **The logo does not switch.** It is `#8b6dd2` in both themes, in every asset here.
- **Light-mode text switches.** Links, buttons and inline accents use `#805fc9` (4.50:1).
- Dark-mode text can use `#8c6bd6` (4.56:1) or the brand violet itself (4.59:1).

---

## Palette

`palette.css` has these as custom properties. Contrast is against `paper` in the light
column and `ground` in the dark.

### Light

| Token | Hex | Contrast |
|---|---|---|
| `paper` | `#f8f8fb` | ground |
| `sunk` | `#f0eff4` | — |
| `rule` | `#dedde3` | — |
| `text` | `#1e1a29` | 16.04 : 1 |
| `muted` | `#5c5965` | 6.45 : 1 |
| `link` | `#805fc9` | 4.50 : 1 |
| `mark` | `#8b6dd2` | 3.80 : 1 — **logo only, not for text** |

### Dark

| Token | Hex | Contrast |
|---|---|---|
| `ground` | `#141319` | ground |
| `text` | `#e8e7eb` | 15.01 : 1 |
| `muted` | `#abaab1` | 8.02 : 1 |
| `rule` | `#2c2a31` | — |
| `link` | `#8c6bd6` | 4.56 : 1 |
| `mark` | `#8b6dd2` | 4.59 : 1 |

---

## Shapes

| Shape | Contents | Aspect |
|---|---|---|
| `lockup` | mark above wordmark | 1191 × 1087 |
| `lockup-h` | mark beside wordmark, the wordmark as tall as the `l` | 4446 × 778 (5.7 : 1) |
| `mark` | mark only, no wordmark | 1106 × 767 |
| `wordmark` | “talmolab” only | 1114 × 237 |
| `lockup-square` | stacked lockup, padded to 1:1 | 1 : 1 — **avatars only** |
| `favicon` | simplified cut, squared | 1 : 1 |

### The horizontal lockup

Chosen 2026-11-20 from three ways of making the typemark as tall as the mark. The mark is
the letters `t` and `l`, so the wordmark is scaled (2.84×, one uniform transform on the
master's outlined paths) until **its `l` is the mark's violet `l` bar: the same top
(y 164.56) and the same baseline (y 823.10)**. The arbor rises above both. The gap between
mark and wordmark is 2b, the clear-space unit.

- The lockup is as tall as the mark, plus about 11 units for the round letters' overshoot, so
  the clear-space rule below holds unchanged.
- The wordmark's stroke is 1.24× the bar's width, so at large sizes the type carries more
  weight than the mark. That was the accepted cost.
- The rejected options were the wordmark reaching the top of the arbor (too wide for a
  phone header at 32 px) and two lines, “talmo” over “lab” (it splits the name).
- Before this, `lockup-h` set the wordmark at its native size, 30% of the mark's height,
  optically centred with a 104-unit gap. That version is in git history, in `mkassets.py`
  and in `public/talmolab-lockup-h-light.svg`.

On the site the header shows it 38 px tall (217 px wide), and 32 px on phones, shrinking to
24 px below about 370 px wide so the header stays on one row.

### Colourways

| Suffix | Ink | Accent | Background | Use |
|---|---|---|---|---|
| `-light` | `#1e1a29` | `#8b6dd2` | transparent | on light backgrounds |
| `-dark` | `#e8e7eb` | `#8b6dd2` | transparent | on dark backgrounds |
| `-on-paper` | `#1e1a29` | `#8b6dd2` | `#f8f8fb` | when transparency is unavailable |
| `-on-ground` | `#e8e7eb` | `#8b6dd2` | `#141319` | dark, opaque |
| `-mono-ink` | `#1e1a29` | `#1e1a29` | transparent | single-colour print, fax, embroidery |
| `-mono-white` | `#ffffff` | `#ffffff` | transparent | knockout on photos or colour |

### Sizes

- `lockup`, `lockup-h`, `lockup-square`, `wordmark`: 512, 1024 (and 2048) px wide
- `mark`: 256, 512, 1024 (and 2048) px wide
- `favicon`: 16, 32, 48, 64, 96, 128, 256, 512 px square, plus `favicon.ico` (16/32/48)

### Contact sheets

The full **6 colourways × 5 shapes = 30-tile** matrix on a 4320 × 2520 canvas, in three
views: `contact-sheet.png` (checkerboard, to see transparency), `contact-sheet-transparent.png`
(real RGBA) and `contact-sheet-white.png` (plain white). On white the `mono-white` column is
blank and `-dark` reads faint; both are cut for dark grounds.

---

## Clear space

**Unit `b` = the width of the violet bar in the mark = 88.91 viewBox units.**

**Rule: clear space = `2b` on all four sides**: 23.2% of the logo's height, 4.0% of the
horizontal lockup's width.

| Logo height | Clear space each side |
|---|---|
| 28 px | 6.5 px |
| 38 px (site header) | 8.8 px |
| 52 px | 12.1 px |
| 80 px | 18.6 px |
| 120 px | 27.8 px |

```css
.logo { height: 38px; margin: calc(38px * 0.232); }
```

The tight-cropped SVGs (`-light`, `-dark`, `-mono-*`) have no built-in margin, so clear
space must come from layout. The `-on-paper` / `-on-ground` variants carry 6%, which is less
than `2b`: they are tiles for slots that supply their own space, not a substitute for the
rule. Favicons carry 9–11% and maskable icons 26%, set by platform masking. See
`clear-space.png` for the diagram and the common violations.

### The squared cut, `lockup-square`

The stacked lockup is 1.096 : 1, close enough to square that avatar uploaders (GitHub org
profiles, Slack, Zenodo, ORCID) centre-crop it and clip the `t` and the `b` off the
wordmark. `lockup-square-*` pads to a true 1:1 with `2b` on all four sides, then grows the
short axis.

Use it for avatars and any 1:1 slot that crops. Upload `lockup-square-on-paper-1024.png` to
GitHub: it renders org avatars on both themes, so an opaque ground beats transparency, and
1024 is the safe size for its 260 px (520 px at 2×) profile image. Only the stacked lockup
gets a square cut; at avatar sizes use `favicon/` or the `og/` app icons instead of the mark.

---

## The simplified favicon cut

The full mark collapses below 32 px, so favicons keep only the `t` and the `l` bar: the two
elements dense enough to survive, and the two letters the name is built from.
`favicon-simplified.png` compares them at 16/32/48/64, magnified with no smoothing.

- **The `t` and the arbor are one path in the master**, so the arbor is clipped away at
  `x >= 480`. Below ~470 an arbor stub survives; above ~500 the `t` loses its left arm.
- **Cropping the viewBox does not work.** Squaring the tall, narrow `t`+bar region pulls the
  arbor and skeleton back in. Clip first, then square.
- **The bar is trimmed to the `t`'s height** (`y 236`, `height 587`); full height unbalances it.

| Family | Art | Sizes | Why |
|---|---|---|---|
| `favicon/` | **simplified cut** | 16–512 + `.ico` | never rendered large; must hold at 16px |
| `og/` app icons | **full mark** | 180–512 | never below 180px, where the full mark is legible |

---

## Link unfurls, `og/`

| File | Size | Use |
|---|---|---|
| `talmolab-og-light-1200x630.png` | 1200 × 630 | **the default card** (the site's `og-card.png`) |
| `talmolab-og-dark-1200x630.png` | 1200 × 630 | dark alternate |
| `talmolab-og-square-light-1200x1200.png` | 1200 × 1200 | platforms that prefer 1:1 |
| `talmolab-og-square-dark-1200x1200.png` | 1200 × 1200 | dark 1:1 |
| `talmolab-apple-touch-icon.png` | 180 × 180 | iOS home screen |
| `talmolab-icon-192.png`, `-512.png` | 192, 512 | web app manifest |
| `talmolab-maskable-512.png`, `-dark-512.png` | 512 × 512 | Android maskable, 26% safe zone (the site uses the dark one) |

All are opaque sRGB with no alpha, which is what unfurl scrapers expect. `og/meta-tags.html`
is the `<head>` block the site serves, with literal values and the site's file names. Two traps the scripts already handle: `og:image` must be an
absolute URL, and Chrome's minimum window width means icons render at 1024 and downsample.

**Type caveat.** The cards are set in Bricolage Grotesque and IBM Plex Mono, carried over
from v002, with the old tagline, while the site sets its type in Source Sans 3. Changing
that is a design decision of its own: edit `scripts/og-template.html`, then run `mkog.py` and
`sync-public.py`.

---

## The Illustrator export bug

Illustrator writes the `l` of “talmo” as a rect rotated `-89.9966°`:

```xml
<rect class="st0" x="190.75" y="1004.01" width="231.85" height="38.67"
      transform="translate(-716.6843 1329.9619) rotate(-89.9966)"/>
```

ImageMagick's built-in SVG renderer silently drops rotated rects with non-zero `x`/`y`,
with no warning and exit 0, so `magick` renders the wordmark as “ta molab”. `normalize-svg.py`
bakes it to the axis-aligned equivalent. Re-run it after every export from the `.ai` file:

```bash
python3 scripts/normalize-svg.py talmolab-logo.v003.svg          # bakes, keeps a .orig
python3 scripts/normalize-svg.py talmolab-logo.v003.svg --check  # non-zero if any remain
```

---

## Changing the colours

The logo is two fills. Change `INK` and `ACC` in `scripts/mkassets.py` (and the master SVG),
regenerate everything, then update `palette.css` and the site's `src/styles/global.css`. If
the accent's contrast changes, re-check the light/dark text accent split above: it is the
part of the palette that does not follow from the two logo values.

---

## Script history

The v002 scripts were ported to v003 with four fixes: `mkassets.py` generates `lockup-h`
(v002 shipped those SVGs with no generator); `mksheet.py` and `mkdocs.py` are new (v002's
sheets and diagrams had none); and `og-template.html` uses `#805fc9` for accent-coloured type.

Two ImageMagick traps, both silent: `magick montage` needs a font even with `+label`
(`mksheet.py` appends cells instead), and compositing onto an all-grey PNG writes greyscale
and drops the violet (`-define png:color-type=2` is load-bearing).

---

## Where these files came from

Two sources, both read-only: the v003 kit in `talmolab/lab-website-legacy`'s local
`scratch/2026-10-03-redesign-redux/talmolab-logo.v003/` (gitignored there, so never on
GitHub), and the v002 kit in that repository's `design/` folder.

**Copied unchanged from the v003 kit**: `talmolab-logo.v003.ai`, `.svg` and `.svg.orig`;
`raster.py`, `mkog.py`, `mksheet.py`, `normalize-svg.py`, `og-template.html`; 30 of the 36
SVGs; every PNG except `lockup-h`'s; `favicon/`; the cards and icons in `og/`.

**Regenerated here, 2026-11-20**, after the `lockup-h` change: the six `lockup-h` SVGs and
their 18 PNGs (`mkassets.py`, `raster.py lockup-h`), the three contact sheets (`mksheet.py`),
`clear-space.png` and `favicon-simplified.png` (`mkdocs.py`). The other 30 SVGs came out
byte-identical to the kit's, which is the check that nothing else moved.

**Changed**:
- `scripts/mkassets.py`: `build_h()` builds the taller `lockup-h`.
- `scripts/mkdocs.py`: reads the lockup's width from its SVG instead of assuming 2323 units,
  and computes the "% of the width" caption, so the diagram follows any change of layout.
- `og/meta-tags.html`: the kit's version pointed at `/og/…` and `/talmolab-icon-…` paths
  and used “talmolab” as the site name. It now matches what `src/layouts/Base.astro` serves.
- `og/type-system.css`: a note at the top that it is superseded by `type.css`.

**Written for this repository**:
- `palette.css`: the v003 README's palette tables as custom properties named like the site's,
  plus the site's dark `sunk`, which the round-26 sheet does not give.
- `type.css`: the face from the site's `astro.config.mjs` and the scale from
  `src/styles/global.css`, as of 2026-11-20.
- `scripts/sync-public.py`: the v002 kit's script of the same name, re-targeted at this
  site's `public/` file names, with `--check` for CI.
- `README.md`: the v003 kit's README, plus the usage rules, minimum sizes, type,
  `lockup-h` and this section.

**Superseded in `lab-website-legacy`'s `design/` (v002, blue), not copied**: `README.md`,
`palette.css` and `scripts/`, which have v003 versions here; `type-system.css`, the same file
as `og/type-system.css` before its note; `meta-tags.html` and `site.webmanifest`, which carry the v002 blue
(`#2176b3`) and are replaced by `og/meta-tags.html` and the site's own manifest;
`talmolab-logo.v002.svg`, the same geometry as the v003 master. `layout.css` (the old site's
measure system) is not brand material, and the site's CSS replaced it.
