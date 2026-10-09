#!/usr/bin/env python3
"""Generate the lab roster CSV from the `people` content collection.

Replaces generate_roster_csv.py, which parsed the team page's prose and inferred
role transitions from git history, then ESTIMATED end dates from typical role
durations. That was reasonable when the data lived only in prose. It is now wrong:
appointments are structured, so every field below is read rather than guessed, and
a blank cell means "not recorded" instead of "we made something up".

One row per appointment — a person who was an undergrad and then an MS student gets
two rows, which is what the annual review needs.

Usage:
    python roster_from_collection.py [--out lab_roster.csv] [--current-only]
"""
import argparse, csv, glob, os, re, sys

try:
    import yaml
except ImportError:
    sys.exit("needs PyYAML: pip install pyyaml")

# scripts/ -> lab-roster/ -> skills/ -> .claude/ -> repo root
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..')
PEOPLE = os.path.join(ROOT, 'src', 'content', 'people')

FIELDS = [
    'name', 'slug', 'role', 'title', 'salk_title',
    'start_date', 'end_date', 'status', 'co_advisor', 'note',
    'next_org', 'next_what', 'has_page',
]


def read(path):
    text = open(path, encoding='utf8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', text, re.S)
    if not m:
        raise SystemExit(f'malformed frontmatter: {path}')
    return yaml.safe_load(m.group(1)) or {}, m.group(2).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='lab_roster.csv')
    ap.add_argument('--current-only', action='store_true')
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(PEOPLE, '*.md')))
    if not files:
        sys.exit(f'no people found in {PEOPLE}')

    rows = []
    for path in files:
        data, _ = read(path)
        slug = os.path.basename(path)[:-3]
        appts = data.get('appointments') or []
        # Current iff the LAST appointment has no end at all. end: "unknown" is a
        # departure whose date was never recorded, and must not read as still-here.
        current = bool(appts) and appts[-1].get('end') is None
        if args.current_only and not current:
            continue
        nxt = data.get('next') or {}
        for i, a in enumerate(appts):
            end = a.get('end')
            rows.append({
                'name': data.get('name', ''),
                'slug': slug,
                'role': a.get('role', ''),
                'title': a.get('title', ''),
                'salk_title': a.get('salkTitle', ''),
                'start_date': a.get('start', ''),
                'end_date': '' if end in (None, 'unknown') else end,
                # Explicit, so a blank end_date is never ambiguous.
                'status': 'current' if end is None else ('departed' if end != 'unknown'
                                                          else 'departed, date unrecorded'),
                'co_advisor': a.get('coAdvisor', ''),
                'note': a.get('note', ''),
                # Only on the last row, since it describes the person, not the role.
                'next_org': nxt.get('org', '') if i == len(appts) - 1 else '',
                'next_what': nxt.get('what', '') if i == len(appts) - 1 else '',
                'has_page': 'yes' if data.get('page', True) else 'no',
            })

    # Most recent first, by whichever bound is known.
    rows.sort(key=lambda r: (r['start_date'] or r['end_date'] or ''), reverse=True)

    with open(args.out, 'w', newline='', encoding='utf8') as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)

    people = len({r['slug'] for r in rows})
    cur = len({r['slug'] for r in rows if r['status'] == 'current'})
    missing_start = sorted({r['name'] for r in rows if not r['start_date']})
    print(f'wrote {args.out}: {len(rows)} appointments across {people} people ({cur} current)')
    if missing_start:
        print(f'no start date recorded for: {", ".join(missing_start)}')


if __name__ == '__main__':
    main()
