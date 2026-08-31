#!/usr/bin/env python3
"""Copy the handful of generated files the site actually serves into public/.

Everything under design/build/ is a derivative and is gitignored — 16.6 MB of it
regenerates from ~316 KB of sources. Only the files listed here are committed,
because a static host has to serve them.

Run after mkassets.py -> raster.py -> mkog.py.

    python3 sync-public.py           copy, report what changed
    python3 sync-public.py --check   exit non-zero if public/ is stale (for CI)
"""
import filecmp, os, shutil, sys

HERE   = os.path.dirname(os.path.abspath(__file__))
BUILD  = os.path.join(HERE, '..', 'build')
PUBLIC = os.path.join(HERE, '..', '..', 'public')

# (source under design/build, destination under public/, why it exists)
FILES = [
    ('svg/talmolab-lockup-h-light.svg', 'talmolab-lockup-h-light.svg', 'nav, light'),
    ('svg/talmolab-lockup-h-dark.svg',  'talmolab-lockup-h-dark.svg',  'nav, dark'),
    ('svg/talmolab-lockup-light.svg',   'talmolab-lockup-light.svg',   'stacked, for sharing/print'),
    ('svg/talmolab-favicon-light.svg',  'talmolab-favicon.svg',        'SVG favicon (simplified cut)'),
    ('favicon/favicon.ico',             'favicon.ico',                 'legacy, 16/32/48'),
    ('favicon/talmolab-favicon-light-16.png', 'favicon-16.png',        'PNG fallback'),
    ('favicon/talmolab-favicon-light-32.png', 'favicon-32.png',        'PNG fallback'),
    ('og/talmolab-apple-touch-icon.png','apple-touch-icon.png',        'iOS home screen'),
    ('og/talmolab-icon-192.png',        'icon-192.png',                'web manifest'),
    ('og/talmolab-icon-512.png',        'icon-512.png',                'web manifest'),
    ('og/talmolab-maskable-512.png',    'maskable-512.png',            'Android maskable'),
    ('og/talmolab-og-light-1200x630.png','og-card.png',                'link unfurls'),
]


# Authored, not generated — copied straight from design/.
STATIC = [('site.webmanifest', 'site.webmanifest', 'PWA manifest')]


def main():
    check = '--check' in sys.argv
    if not os.path.isdir(BUILD):
        sys.exit('design/build/ missing — run mkassets.py, raster.py, mkog.py first.')
    os.makedirs(PUBLIC, exist_ok=True)
    changed, missing, total = [], [], 0
    jobs = [(BUILD, f) for f in FILES] + [(os.path.join(HERE, '..'), f) for f in STATIC]
    for root, (src, dst, _why) in jobs:
        s = os.path.join(root, src)
        d = os.path.join(PUBLIC, dst)
        if not os.path.exists(s):
            missing.append(src)
            continue
        total += os.path.getsize(s)
        if not (os.path.exists(d) and filecmp.cmp(s, d, shallow=False)):
            changed.append(dst)
            if not check:
                shutil.copy2(s, d)
    if missing:
        sys.exit('missing sources: ' + ', '.join(missing))
    if check:
        if changed:
            print('public/ is stale: ' + ', '.join(changed))
            sys.exit(1)
        print(f'public/ up to date ({len(FILES)+len(STATIC)} files, {total/1024:.0f} KB)')
        return
    if changed:
        print(f'updated {len(changed)}: ' + ', '.join(changed))
    else:
        print('no changes')
    print(f'{len(FILES)+len(STATIC)} files, {total/1024:.0f} KB in public/')


if __name__ == '__main__':
    main()
