#!/usr/bin/env python3
"""Copy the brand files the site serves from brand/ into public/, or check they match.

public/ holds copies, not sources: change the logo here in brand/, regenerate, then run
this. CI runs it with --check, so a hand edit to one of these files in public/ (or a
regenerated asset that was never copied over) fails the build instead of drifting.

    python3 sync-public.py           copy, and list what changed
    python3 sync-public.py --check   exit 1 if any copy in public/ differs from brand/

Only generated files are listed. public/site.webmanifest is authored by the site, and
the copies of the old site's images under public/images/ are not brand assets.
"""
import filecmp, os, shutil, sys

HERE   = os.path.dirname(os.path.abspath(__file__))
BRAND  = os.path.normpath(os.path.join(HERE, '..'))
PUBLIC = os.path.normpath(os.path.join(HERE, '..', '..', 'public'))

# (file under brand/, file under public/, what the site uses it for)
FILES = [
    ('svg/talmolab-lockup-h-light.svg',         'talmolab-lockup-h-light.svg', 'header logo, inlined by Logo.astro'),
    ('svg/talmolab-lockup-h-dark.svg',          'talmolab-lockup-h-dark.svg',  'horizontal lockup for dark grounds'),
    ('svg/talmolab-mark-light.svg',             'talmolab-mark-light.svg',     'mark alone'),
    ('svg/talmolab-mark-dark.svg',              'talmolab-mark-dark.svg',      'mark alone, dark grounds'),
    ('svg/talmolab-favicon-on-ground.svg',      'talmolab-favicon.svg',        'SVG favicon (simplified cut)'),
    ('favicon/favicon.ico',                     'favicon.ico',                 'legacy favicon, 16/32/48'),
    ('favicon/talmolab-favicon-on-ground-16.png', 'favicon-16.png',            'PNG favicon'),
    ('favicon/talmolab-favicon-on-ground-32.png', 'favicon-32.png',            'PNG favicon'),
    ('og/talmolab-apple-touch-icon.png',        'apple-touch-icon.png',        'iOS home screen'),
    ('og/talmolab-icon-192.png',                'icon-192.png',                'web manifest'),
    ('og/talmolab-icon-512.png',                'icon-512.png',                'web manifest'),
    ('og/talmolab-maskable-dark-512.png',       'maskable-512.png',            'Android maskable icon'),
    ('og/talmolab-og-light-1200x630.png',       'og-card.png',                 'link unfurls'),
]


def main():
    check = '--check' in sys.argv
    stale, missing = [], []
    for src, dst, _why in FILES:
        s, d = os.path.join(BRAND, src), os.path.join(PUBLIC, dst)
        if not os.path.exists(s):
            missing.append(f'brand/{src}')
            continue
        if os.path.exists(d) and filecmp.cmp(s, d, shallow=False):
            continue
        stale.append(f'public/{dst}  <-  brand/{src}')
        if not check:
            shutil.copyfile(s, d)
    if missing:
        sys.exit('missing in brand/ (regenerate first):\n  ' + '\n  '.join(missing))
    if check:
        if stale:
            sys.exit('public/ differs from brand/; run brand/scripts/sync-public.py:\n  '
                     + '\n  '.join(stale))
        print(f'public/ matches brand/ ({len(FILES)} files)')
    else:
        print('\n'.join(f'copied {x}' for x in stale) or f'nothing to copy ({len(FILES)} files match)')


if __name__ == '__main__':
    main()
