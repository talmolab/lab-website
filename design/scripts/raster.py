#!/usr/bin/env python3
"""Rasterise the SVG variants to PNG via headless Chrome.

Chrome is used deliberately: ImageMagick's SVG renderer drops the rotated <rect>
that forms the `l` in "talmo". Masters render at 2048px, then downsample with
Lanczos so every size shares identical geometry.

Run mkassets.py first.
"""
import json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SVG  = os.path.join(HERE, '..', 'build', 'svg')
ROOT = os.path.join(HERE, '..', 'build')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
MASTER_W = 2048
SIZES = {'lockup': [512, 1024, 2048],
         'lockup-h': [512, 1024, 2048], 'mark': [256, 512, 1024, 2048],
         'wordmark': [512, 1024, 2048], 'favicon': [16, 32, 48, 64, 96, 128, 256, 512]}


def main():
    if not os.path.exists(CHROME):
        sys.exit(f'Chrome not found at {CHROME} — edit CHROME in this script.')
    names = json.load(open(os.path.join(ROOT, 'variants.json')))
    for sub in ('png', 'favicon'):
        os.makedirs(os.path.join(ROOT, sub), exist_ok=True)
    work = tempfile.mkdtemp()
    made = 0
    for name in names:
        shape = 'lockup-h' if name.startswith('lockup-h') else name.split('-')[0]
        src = os.path.join(SVG, f'talmolab-{name}.svg')
        vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', open(src).read()).group(1).split()]
        ar = vb[3] / vb[2]
        mh = max(1, round(MASTER_W * ar))
        shutil.copy(src, os.path.join(work, 's.svg'))
        open(os.path.join(work, 'w.html'), 'w').write(
            f'<style>html,body{{margin:0;padding:0;background:transparent}}'
            f'img{{display:block;width:{MASTER_W}px}}</style><img src="s.svg">')
        subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox',
                        '--hide-scrollbars', '--default-background-color=00000000',
                        f'--window-size={MASTER_W},{mh}',
                        f'--screenshot={work}/m.png', f'file://{work}/w.html'],
                       capture_output=True)
        dest = os.path.join(ROOT, 'favicon' if shape == 'favicon' else 'png')
        for s in SIZES[shape]:
            h = max(1, round(s * ar))
            subprocess.run(['magick', f'{work}/m.png', '-filter', 'Lanczos',
                            '-resize', f'{s}x{h}!', '-strip',
                            '-define', 'png:color-type=6',
                            os.path.join(dest, f'talmolab-{name}-{s}.png')],
                           capture_output=True)
            made += 1
    # 16/32/48 only. Modern browsers take the SVG or a PNG; bundling 128/256 into
    # the .ico inflated it from ~15 KB to 361 KB for sizes nothing reads from it.
    ico = [os.path.join(ROOT, 'favicon', f'talmolab-favicon-light-{s}.png')
           for s in (16, 32, 48)]
    subprocess.run(['magick'] + ico + [os.path.join(ROOT, 'favicon', 'favicon.ico')],
                   capture_output=True)
    shutil.rmtree(work, ignore_errors=True)
    print(f'rendered {made} PNGs + favicon.ico')


if __name__ == '__main__':
    main()
