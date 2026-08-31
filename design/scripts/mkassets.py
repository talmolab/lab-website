#!/usr/bin/env python3
"""Build all talmolab logo SVG variants from the v002 master.

Reads ../talmolab-logo.v002.svg, splits it into mark/wordmark and ink/accent,
and writes tight-cropped SVGs into ../build/svg/ (gitignored — these are derivatives).

To recolour the whole identity, change INK and ACC below (or edit the master SVG).
"""
import re, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
MASTER = os.path.join(HERE, '..', 'talmolab-logo.v002.svg')
OUT    = os.path.join(HERE, '..', 'build', 'svg')

# --- palette -----------------------------------------------------------------
INK, ACC  = '#1f2328', '#2176b3'   # the two logo values
DMINK     = '#e5e8ec'              # ink, reversed for dark grounds
PAPER     = '#f7f9fb'
GROUND    = '#101419'

# --- geometry ----------------------------------------------------------------
# Tight bounds in viewBox units, measured from the rendered alpha channel.
# Recompute these if the master geometry changes (see scripts/README note).
BOX = {'lockup':   (16.5,  57.0, 1191.5, 1086.5),
       'mark':     (102.5, 57.0, 1105.5,  766.5),
       'wordmark': (16.5, 907.0, 1113.5,  236.5)}
# Master group order: 1="talmo", 2="lab", 3=l-bar+skeleton, 4=t+arbor+soma
SETS = {'lockup': [0,1,2,3], 'mark': [2,3], 'wordmark': [0,1]}


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



# --- horizontal lockup ------------------------------------------------------
# The stacked lockup needs too much height before the wordmark is legible, so a
# nav gets this one instead: mark left, wordmark right, optically centred.
# A group translate is used (not a rect transform) -- translate renders fine
# everywhere, including ImageMagick; it was `rotate` on a rect that broke it.
HLOCK_GAP = 104.0

def build_horizontal(G, ink, acc, bg=None, pad=0.0):
    mx, my, mw, mh = BOX['mark']
    wx, wy, ww, wh = BOX['wordmark']
    dx = (mx + mw + HLOCK_GAP) - wx
    dy = (my + mh / 2 - wh / 2) - wy
    W, H = mw + HLOCK_GAP + ww, mh
    X, Y = mx, my
    p = pad * max(W, H); X -= p; Y -= p; W += 2 * p; H += 2 * p

    def grp(kind, idxs, tr=None):
        els = [e for i in idxs for k, e in G[i] if k == kind]
        if not els:
            return ''
        t = f' transform="translate({tr[0]:.2f} {tr[1]:.2f})"' if tr else ''
        fill = ink if kind == 'ink' else acc
        return f'  <g fill="{fill}"{t}>\n' + '\n'.join('    ' + e for e in els) + '\n  </g>\n'

    rect = f'  <rect x="{X:.2f}" y="{Y:.2f}" width="{W:.2f}" height="{H:.2f}" fill="{bg}"/>\n' if bg else ''
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X:.2f} {Y:.2f} {W:.2f} {H:.2f}">\n'
            '  <title>talmolab</title>\n' + rect
            + grp('ink', SETS['mark']) + grp('acc', SETS['mark'])
            + grp('ink', SETS['wordmark'], (dx, dy)) + grp('acc', SETS['wordmark'], (dx, dy))
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
    variants += [
        ('lockup-h-light',      build_horizontal(G, INK,       ACC)),
        ('lockup-h-dark',       build_horizontal(G, DMINK,     ACC)),
        ('lockup-h-on-paper',   build_horizontal(G, INK,       ACC, bg=PAPER,  pad=0.06)),
        ('lockup-h-on-ground',  build_horizontal(G, DMINK,     ACC, bg=GROUND, pad=0.06)),
        ('lockup-h-mono-ink',   build_horizontal(G, INK,       INK)),
        ('lockup-h-mono-white', build_horizontal(G, '#ffffff', '#ffffff')),
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
    json.dump([n for n, _ in variants], open(os.path.join(OUT, '..', 'variants.json'), 'w'))
    print(f'wrote {len(variants)} SVGs to {os.path.normpath(OUT)}')


if __name__ == '__main__':
    main()
