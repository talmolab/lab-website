#!/usr/bin/env python3
"""Build the three contact sheets from the rendered PNGs.

Run mkassets.py and raster.py first.

Grid is 6 colourways across x 5 shapes down = 30 tiles, i.e. every SVG variant
in the set, on a 4320x2520 canvas (720x504 per cell). v002 used the same canvas
but showed a hand-picked 12 of its assets at mixed scales; its generator was
never saved, so this is a rewrite rather than a port.

Three views of the same grid:
  contact-sheet.png              checkerboard  -- see exactly where transparency is
  contact-sheet-transparent.png  real RGBA     -- drop onto any surface to test
  contact-sheet-white.png        pure white    -- how the set reads on a plain page

Expected oddities, all correct: `mono-white` is invisible on the white sheet and
a white silhouette on the checkerboard; the `-dark` variants read very faint on
white. Those variants are cut for dark grounds.

NOTE: this deliberately does NOT use `magick montage`. Montage insists on a font
even with +label (it is used for the caption machinery regardless) and aborts
with "unable to read font" on a machine without one configured. Cells are built
to an exact size and appended instead, which needs no font at all.
"""
import os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
PNG  = os.path.join(ROOT, 'png')
FAV  = os.path.join(ROOT, 'favicon')

WAYS   = ['light', 'dark', 'on-paper', 'on-ground', 'mono-ink', 'mono-white']
SHAPES = ['lockup', 'lockup-h', 'mark', 'wordmark', 'favicon']

CELL_W, CELL_H = 720, 504          # 6 x 720 = 4320, 5 x 504 = 2520
PAD            = 22                # inner gap, so tiles do not touch
CHECK          = 72                # checkerboard square, divides both dimensions


def src(shape, way):
    """Largest raster for the shape. Favicons top out at 512."""
    if shape == 'favicon':
        return os.path.join(FAV, f'talmolab-favicon-{way}-512.png')
    return os.path.join(PNG, f'talmolab-{shape}-{way}-2048.png')


def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'failed: {" ".join(args[:5])} ...\n{r.stderr.strip()}')


def main():
    work = tempfile.mkdtemp()
    rows = []
    for ri, shape in enumerate(SHAPES):
        cells = []
        for way in WAYS:
            p = src(shape, way)
            if not os.path.exists(p):
                sys.exit(f'missing {p} — run mkassets.py then raster.py first')
            cell = os.path.join(work, f'c{ri}_{way}.png')
            run(['magick', p, '-resize', f'{CELL_W-2*PAD}x{CELL_H-2*PAD}',
                 '-background', 'none', '-gravity', 'center',
                 '-extent', f'{CELL_W}x{CELL_H}',
                 '-define', 'png:color-type=6', cell])
            cells.append(cell)
        row = os.path.join(work, f'row{ri}.png')
        run(['magick', *cells, '-background', 'none', '+append', row])
        rows.append(row)

    transparent = os.path.join(ROOT, 'contact-sheet-transparent.png')
    checker     = os.path.join(ROOT, 'contact-sheet.png')
    white       = os.path.join(ROOT, 'contact-sheet-white.png')

    run(['magick', *rows, '-background', 'none', '-append', '-strip',
         '-define', 'png:color-type=6', transparent])

    # Checkerboard: the grey MUST be forced to sRGB TrueColor on the BACKGROUND
    # before the composite. Doing it to the result instead drags the whole sheet
    # to greyscale and the violet disappears.
    tile = os.path.join(work, 'checker.png')
    run(['magick', '-size', f'{CHECK*2}x{CHECK*2}', 'xc:#ffffff', '-fill', '#d9d9d9',
         '-draw', f'rectangle 0,0 {CHECK-1},{CHECK-1}',
         '-draw', f'rectangle {CHECK},{CHECK} {CHECK*2-1},{CHECK*2-1}', tile])
    bg = os.path.join(work, 'bg.png')
    run(['magick', '-size', f'{len(WAYS)*CELL_W}x{len(SHAPES)*CELL_H}',
         f'tile:{tile}', '-colorspace', 'sRGB', '-type', 'TrueColor',
         '-define', 'png:color-type=2', bg])
    # png:color-type=2 on BOTH writes is load-bearing. Without it the all-grey
    # background is saved as a greyscale PNG, the composite inherits that
    # colourspace, and the violet silently drops out of the finished sheet --
    # the exact failure the v002 notes describe, in a new place.
    run(['magick', bg, transparent, '-composite', '-alpha', 'remove', '-alpha', 'off',
         '-colorspace', 'sRGB', '-type', 'TrueColor', '-strip',
         '-define', 'png:color-type=2', checker])

    run(['magick', transparent, '-background', 'white',
         '-alpha', 'remove', '-alpha', 'off',
         '-colorspace', 'sRGB', '-type', 'TrueColor', '-strip',
         '-define', 'png:color-type=2', white])

    shutil.rmtree(work, ignore_errors=True)
    for f in (checker, transparent, white):
        d = subprocess.run(['magick', 'identify', '-format', '%wx%h %[channels]', f],
                           capture_output=True, text=True).stdout
        print(f'  {os.path.basename(f):<32} {d}')
    print(f'{len(WAYS)*len(SHAPES)} tiles ({len(WAYS)} colourways x {len(SHAPES)} shapes)')


if __name__ == '__main__':
    main()
