#!/usr/bin/env python3
"""Render OpenGraph / link-unfurl cards and touch icons via headless Chrome.

Outputs to ../build/og/. Uses the real lockup SVG art (not re-typeset), so the wordmark
matches the logo exactly.
"""
import os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', 'build')
SVG  = os.path.join(ROOT, 'svg')
OG   = os.path.join(ROOT, 'og')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# name, width, height, body-class, lockup variant
CARDS = [
    ('talmolab-og-light',        1200,  630, 'wide',           'lockup-light'),
    ('talmolab-og-dark',         1200,  630, 'wide dark',      'lockup-dark'),
    ('talmolab-og-square-light', 1200, 1200, 'square',         'lockup-light'),
    ('talmolab-og-square-dark',  1200, 1200, 'square dark',    'lockup-dark'),
]
# Opaque square icons. `inset` is the margin as a % of the box.
# Maskable icons need >=20% so the content survives Android's shape masking
# (the safe zone is a circle of 40% radius); plain icons want much less.
ICONS = [
    ('talmolab-apple-touch-icon', 180, 'mark-light', '#f7f9fb', 14),
    ('talmolab-icon-192',         192, 'mark-light', '#f7f9fb', 12),
    ('talmolab-icon-512',         512, 'mark-light', '#f7f9fb', 12),
    ('talmolab-maskable-512',     512, 'mark-light', '#f7f9fb', 26),
    ('talmolab-maskable-dark-512',512, 'mark-dark',  '#101419', 26),
]


def shoot(work, html, w, h, out):
    open(os.path.join(work, 'i.html'), 'w').write(html)
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox',
                    '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--virtual-time-budget=8000',      # let webfonts load
                    f'--window-size={w},{h}',
                    f'--screenshot={out}', f'file://{work}/i.html'],
                   capture_output=True)


def main():
    if not os.path.exists(CHROME):
        sys.exit(f'Chrome not found at {CHROME}')
    os.makedirs(OG, exist_ok=True)
    tpl = open(os.path.join(HERE, 'og-template.html')).read()
    work = tempfile.mkdtemp()
    made = []
    for name, w, h, cls, lock in CARDS:
        shutil.copy(os.path.join(SVG, f'talmolab-{lock}.svg'), os.path.join(work, 'lockup.svg'))
        html = tpl.replace('<div class="card">', f'<div class="card">', 1)
        html = f'<body class="{cls}">' + html
        out = os.path.join(OG, f'{name}-{w}x{h}.png')
        shoot(work, html, w, h, out)
        made.append(out)
    # Icons: transparent mark centred on an explicit background (painted by the page,
    # not the SVG, so no white hairline survives at the edge).
    #
    # Always render at ICON_MASTER then downsample. Chrome enforces a minimum window
    # width, so asking it for a 180x180 screenshot lays the page out far wider and
    # crops -- which silently produced near-empty icons. Rendering large and resizing
    # sidesteps it and matches the raster.py pipeline.
    ICON_MASTER = 1024
    for name, size, variant, bg, inset in ICONS:
        src = os.path.join(SVG, f'talmolab-{variant}.svg')
        shutil.copy(src, os.path.join(work, 'lockup.svg'))
        vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', open(src).read()).group(1).split()]
        ar = vb[3] / vb[2]
        avail = ICON_MASTER * (100 - 2 * inset) / 100.0
        w = avail if ar <= 1 else avail / ar
        h = w * ar
        html = ('<style>html,body{margin:0;padding:0;width:100%;height:100%}'
                f'body{{background:{bg};display:flex;align-items:center;justify-content:center}}'
                f'img{{display:block;width:{w:.2f}px;height:{h:.2f}px;min-width:0;min-height:0}}'
                '</style><img src="lockup.svg">')
        shoot(work, html, ICON_MASTER, ICON_MASTER, os.path.join(work, 'icon.png'))
        out = os.path.join(OG, f'{name}.png')
        subprocess.run(['magick', os.path.join(work, 'icon.png'), '-filter', 'Lanczos',
                        '-resize', f'{size}x{size}!', '-strip', '-background', bg,
                        '-alpha', 'remove', '-alpha', 'off', out], capture_output=True)
        made.append(out)
    shutil.rmtree(work, ignore_errors=True)
    for m in made:
        print('  ', os.path.basename(m))
    print(f'wrote {len(made)} files to {os.path.normpath(OG)}')


if __name__ == '__main__':
    main()
