#!/usr/bin/env python3
"""Build all talmolab logo SVG variants from the v003 master.

Reads ../../talmolab-logo.v003.svg, splits it into mark/wordmark and ink/accent,
and writes tight-cropped SVGs into ../svg/.

To recolour the whole identity, change INK and ACC below (or edit the master SVG).

Changes from the v002 copy of this script:
  - palette is Ink & Violet (round-26 option 08) instead of Ink & SLEAP Blue
  - the horizontal lockup (`lockup-h`) is generated here. In v002 those six SVGs
    existed but nothing in scripts/ produced them, so they could not be rebuilt.

Changed 2026-11-20: `lockup-h` sets the wordmark as tall as the mark's l (option B
of the equal-height round). See build_h().
"""
import re, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
# The master sat one level above this package when the script was written; the
# v003 directory has since been moved, so resolve whichever location holds it.
MASTER = next(p for p in (os.path.join(HERE, '..', 'talmolab-logo.v003.svg'),
                          os.path.join(HERE, '..', '..', 'talmolab-logo.v003.svg'))
              if os.path.exists(p))
OUT    = os.path.join(HERE, '..', 'svg')

# --- palette -----------------------------------------------------------------
# The two logo values come from the master SVG's .st0 / .st1 classes. The three
# neutrals are the Ink & Violet column of the round-26 review sheet
# (scratch/2026-08-29-migration/palette-round26.html, card 08) -- they are not
# re-derived here, so this set matches what the lab actually looked at.
INK, ACC  = '#1e1a29', '#8b6dd2'   # the two logo values
DMINK     = '#e8e7eb'              # ink, reversed for dark grounds
PAPER     = '#f8f8fb'
GROUND    = '#141319'

# --- geometry ----------------------------------------------------------------
# Tight bounds in viewBox units, measured from the rendered alpha channel.
# v003 is a pure recolour of v002 -- the path data is byte-identical after
# normalise, so these carry over unchanged. checkgeom.py re-measures them
# against the actual render and fails if that ever stops being true.
BOX = {'lockup':   (16.5,  57.0, 1191.5, 1086.5),
       'mark':     (102.5, 57.0, 1105.5,  766.5),
       'wordmark': (16.5, 907.0, 1113.5,  236.5)}
# Master group order: 1="talmo", 2="lab", 3=l-bar+skeleton, 4=t+arbor+soma
SETS = {'lockup': [0,1,2,3], 'mark': [2,3], 'wordmark': [0,1]}

# Horizontal lockup (changed 2026-11-20, option B of the equal-height round): the
# wordmark is scaled so that its l is the mark's violet l bar -- the same top and the
# same baseline -- and set 2b to the right of the mark. The lockup stays the mark's
# height (plus the round letters' overshoot), so the 2b clear-space rule is unchanged.
# Until then the wordmark sat at its native size, 30% of the mark's height, optically
# centred with a 104-unit gap; that layout is in git history.
# Reference lines, measured from the master with getBBox in Chrome:
BAR_TOP, BASELINE = 164.56, 823.10   # the violet l bar: top, and bottom = baseline
W_ASC, W_BASE     = 907.42, 1139.30  # the wordmark's l: top, and baseline
GAP_H = 2 * 88.91                    # 2b; b is the bar's width (B, below)

# Square cut: the stacked lockup is 1191.5 x 1086.5, i.e. 1.096:1 -- near enough
# to square that avatar uploaders (GitHub org profile, Slack, Zenodo) centre-crop
# it to 1086.5 x 1086.5 and shave 52.5 units off each side of the wordmark. These
# variants pad to a true square so nothing is cropped.
#
# PAD_SQ is the clear-space rule, not a guess: 2b = 177.82 units (b = 88.91, the
# violet bar's width), expressed as a fraction of the lockup box's long side.
# build() applies it to all four sides, then grows the short axis to square -- so
# left/right get exactly 2b and top/bottom get 2b + (1191.5 - 1086.5)/2 = 230.32.
B      = 88.91
PAD_SQ = (2 * B) / 1191.5          # 0.14924


def load_groups(path):
    body = open(path).read().split('</defs>', 1)[1].rsplit('</svg>', 1)[0]
    out = []
    for g in re.findall(r'<g>(.*?)</g>', body, re.S):
        els = re.findall(r'<(?:path|rect)\b[^>]*?/>', g, re.S)
        out.append([('ink' if 'st0' in e else 'acc',
                     re.sub(r'\s*class="st[01]"', '', e)) for e in els])
    if len(out) != 4:
        raise SystemExit(f'expected 4 groups in master, found {len(out)}')
    return out


def build(G, shape, ink, acc, bg=None, pad=0.0, square=False):
    x, y, w, h = BOX[shape]
    p = pad * max(w, h)
    x, y, w, h = x - p, y - p, w + 2 * p, h + 2 * p
    if square:
        s = max(w, h); x -= (s - w) / 2; y -= (s - h) / 2; w = h = s
    inks = [e for i in SETS[shape] for c, e in G[i] if c == 'ink']
    accs = [e for i in SETS[shape] for c, e in G[i] if c == 'acc']
    rect = f'  <rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>\n' if bg else ''
    gi = f'  <g fill="{ink}">\n' + '\n'.join('    ' + e for e in inks) + '\n  </g>\n' if inks else ''
    ga = f'  <g fill="{acc}">\n' + '\n'.join('    ' + e for e in accs) + '\n  </g>\n' if accs else ''
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}">\n'
            f'  <title>talmolab</title>\n{rect}{gi}{ga}</svg>\n')


def build_h(G, ink, acc, bg=None, pad=0.0):
    """Horizontal lockup: the mark, then the wordmark scaled and moved to its right.

    One uniform scale puts the wordmark's l exactly on the mark's l bar (top and
    baseline); the paths themselves are untouched, so the letters stay outlines.
    """
    mx, my, mw, mh = BOX['mark']
    wx, wy, ww, wh = BOX['wordmark']
    s  = (BASELINE - BAR_TOP) / (W_BASE - W_ASC)    # 2.840
    tx = mx + mw + GAP_H - wx * s                   # the wordmark starts 2b after the mark
    ty = BASELINE - W_BASE * s                      # baselines coincide
    bottom = max(my + mh, ty + (wy + wh) * s)       # round letters dip below the baseline
    x, y, w, h = mx, my, tx + (wx + ww) * s - mx, bottom - my
    p = pad * max(w, h)
    x, y, w, h = x - p, y - p, w + 2 * p, h + 2 * p

    def grp(fill, idxs, want, shift):
        els = [e for i in idxs for c, e in G[i] if c == want]
        if not els:
            return ''
        t = f' transform="matrix({s:.5f} 0 0 {s:.5f} {tx:.2f} {ty:.2f})"' if shift else ''
        return f'  <g fill="{fill}"{t}>\n' + '\n'.join('    ' + e for e in els) + '\n  </g>\n'

    rect = f'  <rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>\n' if bg else ''
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}">\n'
            f'  <title>talmolab</title>\n{rect}'
            + grp(ink, SETS['mark'],     'ink', False)
            + grp(acc, SETS['mark'],     'acc', False)
            + grp(ink, SETS['wordmark'], 'ink', True)
            + grp(acc, SETS['wordmark'], 'acc', True)
            + '</svg>\n')


# --- simplified favicon cut -------------------------------------------------
# The full mark collapses below 32px: the arbor and the skeleton both turn to
# noise. This cut keeps only the two elements that survive -- the `t` and the
# `l` bar -- which are also the two letters the name is built from.
#
# The `t` and the arbor are a SINGLE path in the master, so the arbor cannot be
# deleted; it is clipped away at x >= FAV_CLIP instead. Measured empirically:
# below 470 an arbor stub survives, above 500 the t's crossbar starts losing its
# left arm. The bar is trimmed to the t's cap height so the pair balances in a
# square (the full-height bar overshoots and wastes the box).
FAV_CLIP  = 480
FAV_BAR_Y = 236.0
FAV_BAR_H = 587.0

def build_favicon(G, ink, acc, bg=None, pad=0.16):
    tpath = [e for i in (3,) for c, e in G[i] if c == 'ink'][0]
    bar   = [e for i in (2,) for c, e in G[i] if 'rect' in e][0]
    bar   = re.sub(r'y="[\d.]+"',      f'y="{FAV_BAR_Y}"',   bar)
    bar   = re.sub(r'height="[\d.]+"', f'height="{FAV_BAR_H}"', bar)
    # ink box of the composed pair, measured once from the rendered result
    x, y, w, h = 478.0, 226.0, 472.0, 745.0
    s = max(w, h) * (1 + 2 * pad)
    X = x + w / 2 - s / 2
    Y = y + h / 2 - s / 2
    rect = f'  <rect x="{X:.2f}" y="{Y:.2f}" width="{s:.2f}" height="{s:.2f}" fill="{bg}"/>\n' if bg else ''
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X:.2f} {Y:.2f} {s:.2f} {s:.2f}">\n'
            '  <title>talmolab</title>\n'
            '  <defs><clipPath id="fc">'
            f'<rect x="{FAV_CLIP}" y="0" width="3000" height="2000"/></clipPath></defs>\n'
            + rect
            + f'  <g clip-path="url(#fc)" fill="{ink}">\n    {tpath}\n  </g>\n'
            + f'  <g fill="{acc}">\n    {bar}\n  </g>\n</svg>\n')


def main():
    G = load_groups(MASTER)
    os.makedirs(OUT, exist_ok=True)
    variants = []
    for shape in ('lockup', 'mark', 'wordmark'):
        variants += [
            (f'{shape}-light',      build(G, shape, INK,       ACC)),
            (f'{shape}-dark',       build(G, shape, DMINK,     ACC)),
            (f'{shape}-on-paper',   build(G, shape, INK,       ACC, bg=PAPER,  pad=0.06)),
            (f'{shape}-on-ground',  build(G, shape, DMINK,     ACC, bg=GROUND, pad=0.06)),
            (f'{shape}-mono-ink',   build(G, shape, INK,       INK)),
            (f'{shape}-mono-white', build(G, shape, '#ffffff', '#ffffff')),
        ]
    # Square cut of the stacked lockup -- see PAD_SQ. Only the stacked lockup gets
    # one: the mark (1.44:1), wordmark (4.7:1) and horizontal lockup (5.7:1) are
    # nowhere near square, so squaring them would be letterboxing, not padding.
    variants += [
        ('lockup-square-light',      build(G, 'lockup', INK,       ACC,              pad=PAD_SQ, square=True)),
        ('lockup-square-dark',       build(G, 'lockup', DMINK,     ACC,              pad=PAD_SQ, square=True)),
        ('lockup-square-on-paper',   build(G, 'lockup', INK,       ACC, bg=PAPER,    pad=PAD_SQ, square=True)),
        ('lockup-square-on-ground',  build(G, 'lockup', DMINK,     ACC, bg=GROUND,   pad=PAD_SQ, square=True)),
        ('lockup-square-mono-ink',   build(G, 'lockup', INK,       INK,              pad=PAD_SQ, square=True)),
        ('lockup-square-mono-white', build(G, 'lockup', '#ffffff', '#ffffff',        pad=PAD_SQ, square=True)),
    ]
    variants += [
        ('lockup-h-light',      build_h(G, INK,       ACC)),
        ('lockup-h-dark',       build_h(G, DMINK,     ACC)),
        ('lockup-h-on-paper',   build_h(G, INK,       ACC, bg=PAPER,  pad=0.06)),
        ('lockup-h-on-ground',  build_h(G, DMINK,     ACC, bg=GROUND, pad=0.06)),
        ('lockup-h-mono-ink',   build_h(G, INK,       INK)),
        ('lockup-h-mono-white', build_h(G, '#ffffff', '#ffffff')),
    ]
    # Favicons use the SIMPLIFIED cut -- see build_favicon(). The full mark is
    # kept for app icons (og/), which never render below 180px.
    variants += [
        ('favicon-light',     build_favicon(G, INK,   ACC)),
        ('favicon-dark',      build_favicon(G, DMINK, ACC)),
        ('favicon-on-paper',  build_favicon(G, INK,   ACC, bg=PAPER)),
        ('favicon-on-ground', build_favicon(G, DMINK, ACC, bg=GROUND)),
        ('favicon-mono-ink',  build_favicon(G, INK,   INK)),
        ('favicon-mono-white',build_favicon(G, '#ffffff', '#ffffff')),
    ]
    for name, svg in variants:
        open(os.path.join(OUT, f'talmolab-{name}.svg'), 'w').write(svg)
    json.dump([n for n, _ in variants], open(os.path.join(HERE, 'variants.json'), 'w'))
    print(f'wrote {len(variants)} SVGs to {os.path.normpath(OUT)}')


if __name__ == '__main__':
    main()
