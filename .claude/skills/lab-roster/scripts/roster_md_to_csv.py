#!/usr/bin/env python
"""Convert ROSTER.md to CSV format."""

import re
import csv
from pathlib import Path

def parse_roster_md(md_file):
    """Parse ROSTER.md and extract all entries."""
    content = Path(md_file).read_text()

    # Find the "## Roster Entries" section
    roster_section = re.search(r'## Roster Entries\s*\n(.*)', content, re.DOTALL)
    if not roster_section:
        print("Error: Could not find '## Roster Entries' section")
        return []

    entries_text = roster_section.group(1)

    # Split by entry (each starts with "- **Name**:")
    # Use a pattern that captures the name and all following indented lines until the next entry or end
    entry_pattern = r'- \*\*Name\*\*: (.+?)\n((?:  - .+?\n)+)'
    matches = re.finditer(entry_pattern, entries_text, re.MULTILINE)

    roster_entries = []

    for match in matches:
        name = match.group(1).strip()
        fields_text = match.group(2)

        # Parse each field
        entry = {'name': name}

        # Extract each field
        for line in fields_text.split('\n'):
            line = line.strip()
            if not line or not line.startswith('- '):
                continue

            # Remove leading "- " and split on ": "
            line = line[2:]  # Remove "- "
            if ': ' in line:
                key, value = line.split(': ', 1)
                key = key.strip().lower()
                value = value.strip()

                # Map field names to CSV column names
                if key == 'role':
                    entry['role'] = value
                elif key == 'start':
                    entry['start_date'] = value
                elif key == 'end':
                    entry['end_date'] = value
                elif key == 'previous':
                    entry['previous_position'] = value
                elif key == 'next':
                    entry['next_position'] = value
                elif key == 'team':
                    entry['team'] = value
                elif key == 'co-advisor':
                    entry['co_advisor'] = value

        # Ensure all fields exist (empty string if not present)
        for field in ['role', 'start_date', 'end_date', 'previous_position', 'next_position', 'team', 'co_advisor']:
            if field not in entry:
                entry[field] = ''

        roster_entries.append(entry)

    return roster_entries

def main():
    roster = parse_roster_md('ROSTER.md')

    if not roster:
        print("No entries found!")
        return

    # Write to CSV
    output_file = 'lab_roster.csv'
    fieldnames = ['name', 'role', 'start_date', 'end_date', 'previous_position', 'next_position', 'team', 'co_advisor']

    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(roster)

    print(f"✓ Generated roster with {len(roster)} entries")
    print(f"✓ Saved to: {output_file}")

    # Print summary
    print(f"\nSummary:")
    print(f"  Total entries: {len(roster)}")
    print(f"  Unique members: {len(set(r['name'] for r in roster))}")
    print(f"  Currently active: {sum(1 for r in roster if not r['end_date'])}")
    print(f"  Alumni entries: {sum(1 for r in roster if r['end_date'])}")

if __name__ == '__main__':
    main()
