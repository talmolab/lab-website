#!/usr/bin/env python3
"""Render the two documentation diagrams via headless Chrome.

  clear-space.png        the 2b clear-space rule, with violations and a correct case
  favicon-simplified.png the full mark vs the simplified cut, at 16/32/48/64

Run mkassets.py and raster.py first.

Chrome rather than ImageMagick, for the same reason as mkog.py: these pages are
typeset, and `magick`'s text path needs a configured font that this machine does
not have (montage/label both abort with "unable to read font"). Chrome also gives
`image-rendering: pixelated`, which is what makes the favicon comparison legible
-- the whole point is to see the actual pixel grid at 16px.
"""
import os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SVG  = os.path.join(ROOT, 'svg')
PNG  = os.path.join(ROOT, 'png')
FAV  = os.path.join(ROOT, 'favicon')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# Ink & Violet (round-26 option 08)
INK, ACC   = '#1e1a29', '#8b6dd2'
LINK       = '#805fc9'      # AA-passing accent for text on paper; see README
PAPER      = '#f8f8fb'
SUNK       = '#f0eff4'
RULE       = '#dedde3'
MUTED      = '#5c5965'
GROUND     = '#141319'
DANGER     = '#b3384a'

# clear space: b = the violet bar's width in master viewBox units
B          = 88.91
MARK_H     = 766.5          # the mark's height, == the horizontal lockup's height
RATIO      = 2 * B / MARK_H  # 2b as a fraction of logo height

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700'
         '&family=IBM+Plex+Mono:wght@400;500&display=swap">')


PAD_BOTTOM = 22          # body padding, restored after the trim
TALL       = 1600        # generous window; the unused bottom is trimmed off

def shoot(work, html, w, out):
    """Render at 2x, trim the uniform bottom, restore the padding, halve.

    Height is not hard-coded: the page is shot into an over-tall window and the
    leftover paper is trimmed from the south edge only. Editing the copy above
    therefore cannot silently crop the diagram or leave a band of empty page.
    """
    open(os.path.join(work, 'i.html'), 'w').write(html)
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox',
                    '--hide-scrollbars', '--force-device-scale-factor=2',
                    '--virtual-time-budget=8000',
                    f'--window-size={w},{TALL}',
                    f'--screenshot={out}', f'file://{work}/i.html'],
                   capture_output=True)
    subprocess.run(['magick', out,
                    '-define', 'trim:edges=south', '-fuzz', '0%', '-trim', '+repage',
                    '-background', PAPER, '-gravity', 'south',
                    '-splice', f'0x{PAD_BOTTOM*2}',
                    '-filter', 'Lanczos', '-resize', '50%',
                    '-strip', '-colorspace', 'sRGB', '-type', 'TrueColor',
                    '-define', 'png:color-type=2', out], capture_output=True)


BASE_CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:100%;background:{PAPER};color:{INK};
  font-family:"Bricolage Grotesque",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased}}
body{{padding:22px 24px}}
h1{{font-size:21px;font-weight:700;letter-spacing:-.02em;margin-bottom:9px}}
p{{font-size:13.5px;line-height:1.5;color:{MUTED};max-width:62ch}}
p b,p strong{{color:{INK};font-weight:600}}
.mono{{font-family:"IBM Plex Mono",monospace}}
.eyebrow{{font-family:"IBM Plex Mono",monospace;font-size:10px;font-weight:500;
  letter-spacing:.09em;text-transform:uppercase;color:{LINK};margin:16px 0 7px}}
.eyebrow.bad{{color:{DANGER}}}
.cap{{font-family:"IBM Plex Mono",monospace;font-size:9.5px;line-height:1.45;
  color:{MUTED};padding:6px 8px;border-top:1px solid {RULE};background:{SUNK}}}
.box{{border:1px solid {RULE};background:#fff;overflow:hidden}}
"""


def clear_space(work):
    src = os.path.join(SVG, 'talmolab-lockup-h-light.svg')
    shutil.copy(src, os.path.join(work, 'h.svg'))
    pct = f'{RATIO*100:.1f}'
    # CSS percentage padding always resolves against WIDTH, so the band must be
    # expressed as a fraction of the horizontal lockup's width, not its height
    # (2b/2323 = 7.655% for the original lockup-h). The width is read from the SVG, so
    # a change of layout in mkassets.py cannot leave this diagram wrong. And because
    # the padding is inside the same box it sizes, solve p = r*(W - 2p) -> p = r/(1+2r).
    vb_w = float(re.search(r'viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+)', open(src).read()).group(1))
    r    = 2 * B / vb_w
    band = f'{r/(1+2*r)*100:.2f}'
    rows = ''.join(
        f'<tr><td>{h} px</td><td class="mono">{h*RATIO:.1f} px</td></tr>'
        for h in (28, 40, 52, 80, 120))
    return f"""{FONTS}<style>{BASE_CSS}
.unit{{font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.06em;
  text-transform:uppercase;color:{MUTED};margin:15px 0 9px}}
.unit b{{color:{INK};background:{SUNK};border:1px solid {RULE};
  padding:1px 5px;border-radius:3px}}
.stage{{position:relative;border:1px solid {RULE};background:#fff;padding:34px}}
.hatch{{position:relative;padding:{band}%;
  background:repeating-linear-gradient(45deg,{SUNK} 0 6px,#fff 6px 12px);
  border:1px solid {RULE}}}
.inner{{border:1.5px dashed {ACC};background:#fff;font-size:0}}
.inner img{{display:block;width:100%;height:auto}}
.tag{{position:absolute;font-family:"IBM Plex Mono",monospace;font-size:10px;
  font-weight:500;color:{LINK}}}
.tag.t{{top:0;height:{band}%;left:50%;transform:translateX(-50%);
  display:flex;align-items:center}}
.tag.l{{left:0;width:{band}%;top:50%;transform:translateY(-50%);
  display:flex;align-items:center;justify-content:center}}
table{{border-collapse:collapse;margin-top:12px;font-size:12px}}
td{{padding:3px 22px 3px 0;color:{MUTED}}}
tr td:first-child{{color:{INK};font-weight:600}}
.ex{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
.nav{{display:flex;align-items:center;padding:9px 11px;gap:11px}}
.nav img{{height:26px;width:auto;display:block}}
.nav .lnk{{font-size:11.5px;font-weight:600;color:{INK}}}
.nav .lnk.m{{color:{MUTED};font-weight:500}}
.tight{{padding:0}}
.spaced{{padding:9px calc(26px * {RATIO:.3f} * 2)}}
.grow{{flex:1}}
</style>
<h1>Clear space</h1>
<p>The minimum empty margin around the logo that nothing else may enter — no text,
no image, no rule, no container edge. It is measured in a unit taken <i>from</i> the
logo, so it scales automatically at any size.</p>

<div class="unit">The unit — <b>b</b> = width of the violet bar = {B}u</div>

<div class="stage">
  <div class="hatch">
    <span class="tag t">2b</span><span class="tag l">2b</span>
    <div class="inner"><img src="h.svg" alt=""></div>
  </div>
</div>
<p style="margin-top:11px">Rule: <b>clear space = 2b on all four sides</b> — {pct}% of the
logo's height, {r*100:.1f}% of the horizontal lockup's width. The hatched area stays empty.</p>

<table>{rows}</table>

<div class="eyebrow bad">Violations</div>
<div class="ex">
  <div class="box">
    <div class="nav tight"><img src="h.svg" alt="">
      <span class="lnk">Research</span><span class="lnk">Publications</span></div>
    <div class="cap">nav links inside the zone — the logo reads as a menu item</div>
  </div>
  <div class="box">
    <div class="nav tight" style="padding-left:0"><img src="h.svg" alt=""></div>
    <div class="cap">flush to the container edge — nothing separates it from the page</div>
  </div>
</div>

<div class="eyebrow">Correct</div>
<div class="box" style="width:calc(50% - 6px)">
  <div class="nav spaced"><img src="h.svg" alt=""><span class="grow"></span>
    <span class="lnk m">Research</span><span class="lnk m">Tools</span></div>
  <div class="cap">&ge; 2b before the first link, &ge; 2b from the container edge</div>
</div>
"""


def favicon_cmp(work):
    """Full mark vs simplified cut at the sizes a favicon actually renders at."""
    sizes = (16, 32, 48, 64)
    # The full mark squared, downsampled from the 2048 master the same way
    # raster.py does — so this is a fair comparison, not a re-render.
    for s in sizes:
        subprocess.run(['magick', os.path.join(PNG, 'talmolab-mark-light-2048.png'),
                        '-background', 'none', '-gravity', 'center',
                        '-extent', '2048x2048', '-filter', 'Lanczos',
                        '-resize', f'{s}x{s}!', '-strip',
                        '-define', 'png:color-type=6',
                        os.path.join(work, f'full{s}.png')], capture_output=True)
        shutil.copy(os.path.join(FAV, f'talmolab-favicon-light-{s}.png'),
                    os.path.join(work, f'simp{s}.png'))
    M = 6  # magnification
    def row(prefix):
        return ''.join(
            f'<figure><img src="{prefix}{s}.png" style="width:{s*M}px;height:{s*M}px">'
            f'<figcaption>{s}px</figcaption></figure>' for s in sizes)
    return f"""{FONTS}<style>{BASE_CSS}
.row{{display:flex;align-items:flex-end;gap:26px;padding:16px 18px;
  border:1px solid {RULE};background:#fff}}
.row+.eyebrow{{margin-top:18px}}
figure{{display:flex;flex-direction:column;align-items:center;gap:7px}}
figure img{{image-rendering:pixelated;display:block;background:{PAPER}}}
figcaption{{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:{MUTED}}}
</style>
<h1>The simplified favicon cut</h1>
<p>The full mark collapses below 32px — the arbor and the skeleton both turn to noise.
Shown at true pixel size, magnified {M}&times; with no smoothing.</p>

<div class="eyebrow bad">Full mark — what it actually looks like</div>
<div class="row">{row('full')}</div>

<div class="eyebrow">Simplified cut — shipped in favicon/</div>
<div class="row">{row('simp')}</div>
<p style="margin-top:11px">The cut keeps the <b>t</b> and the <b>l</b> bar: the two elements
dense enough to survive, and the two letters the name is built from. The arbor, the
skeleton and the soma dot are dropped.</p>
"""


def main():
    if not os.path.exists(CHROME):
        sys.exit(f'Chrome not found at {CHROME}')
    work = tempfile.mkdtemp()
    jobs = [('clear-space.png',        clear_space(work),  730),
            # 4 tiles at 6x (96+192+288+384=960) plus 3x26 gaps = 1038 of content;
            # 1160 leaves room for the body padding, box border and box padding.
            ('favicon-simplified.png', favicon_cmp(work), 1160)]
    for name, html, w in jobs:
        out = os.path.join(ROOT, name)
        shoot(work, html, w, out)
        d = subprocess.run(['magick', 'identify', '-format', '%wx%h', out],
                           capture_output=True, text=True).stdout
        print(f'  {name:<26} {d}')
    shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    main()
