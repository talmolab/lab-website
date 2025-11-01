#!/usr/bin/env python
"""Script to generate a comprehensive CSV roster of all lab members."""

import re
import subprocess
import csv
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

def parse_frontmatter(content):
    """Extract YAML frontmatter from markdown file."""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    frontmatter = {}
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip()
    return frontmatter

def get_bio_text(content):
    """Extract bio text (everything after frontmatter)."""
    match = re.match(r'^---\s*\n.*?\n---\s*\n(.*)$', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def get_git_history(filepath):
    """Get full git history of a file including role changes."""
    try:
        result = subprocess.run(
            ['git', 'log', '--follow', '--format=%H|%aI', '--', filepath],
            capture_output=True,
            text=True,
            check=True
        )
        commits = []
        for line in result.stdout.strip().split('\n'):
            if line:
                commit_hash, date_str = line.split('|')
                commits.append({
                    'hash': commit_hash,
                    'date': datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                })
        return commits
    except:
        return []

def get_role_at_commit(filepath, commit_hash):
    """Get the role field value at a specific commit."""
    try:
        result = subprocess.run(
            ['git', 'show', f'{commit_hash}:{filepath}'],
            capture_output=True,
            text=True,
            check=True
        )
        frontmatter = parse_frontmatter(result.stdout)
        return frontmatter.get('role', '')
    except:
        return None

def infer_team(bio_text, role=''):
    """Infer team from bio text keywords and role."""
    bio_lower = bio_text.lower()

    # Check for virtual_biology keywords (highest priority)
    if any(kw in bio_lower for kw in ['vnl', 'virtual lab', 'virtual animal', 'embodied', 'neuromechanical simulation']):
        return 'virtual_biology'

    # Check for software_engineering keywords
    se_keywords = ['sleap', 'dreem', 'cloud', 'infrastructure', 'plant', 'root', 'aws', 'full-stack',
                   'data pipeline', 'software engineer', 'programmer', 'bioinformatics analyst',
                   'scientific programmer', 'computer vision algorithm', 'pose estimation']
    if any(kw in bio_lower for kw in se_keywords):
        # But check if it's phenotyping work (overrides software engineering)
        if not any(kw in bio_lower for kw in ['phenotyp', 'behavior', 'als', 'alzheimer', 'disease model']):
            return 'software_engineering'

    # Check for phenoinformatics keywords
    pheno_keywords = ['phenotyp', 'behavior', 'als', 'alzheimer', 'disease', 'mice', 'mouse',
                      'longitudinal', 'space', 'neurodegenerative', 'multi-animal', 'tracking pipeline']
    if any(kw in bio_lower for kw in pheno_keywords):
        return 'phenoinformatics'

    # Fallback to role-based inference
    if role in ['programmer', 'undergrad'] and 'computer' in bio_lower:
        return 'software_engineering'

    return ''

def extract_co_advisor(bio_text):
    """Extract co-advisor from bio text."""
    # First, simplify markdown links in the text
    simplified_text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', bio_text)

    patterns = [
        r'co-advised by ([^,\.\n]+?)(?:\.|$)',
        r'co-supervised by ([^,\.\n]+?)(?:\.|$)',
        r'jointly with (?:the )?([^,\.\n]+?)(?: Lab)?(?:\.|$)',
        r'joint with ([^,\.\n]+?)(?:\.|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, simplified_text, re.IGNORECASE)
        if match:
            advisor = match.group(1).strip()
            # Remove trailing phrases and relative clauses
            advisor = re.sub(r'\s+and\s+.*$', '', advisor)
            advisor = re.sub(r'\s+at\s+.*$', '', advisor)
            advisor = re.sub(r'\s+who\s+.*$', '', advisor)
            advisor = re.sub(r'\s+where\s+.*$', '', advisor)
            return advisor.strip()

    return ''

def extract_previous_position(bio_text):
    """Extract previous position from bio text."""
    patterns = [
        r'Prior to joining (?:the lab, )?(?:he|she|they) (?:was|worked) ([^\.]+)',
        r'previously (?:worked|held positions?) (?:at|as) ([^\.]+)',
        r'after which (?:he|she|they) worked ([^\.]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, bio_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return ''

def load_alumni_info():
    """Load alumni info (roles and next positions) from team/index.md alumni list."""
    alumni_info = {}
    try:
        team_index = Path('team/index.md').read_text()
        # Find alumni section
        alumni_section = re.search(r'## Alumni\s*\n(.*)', team_index, re.DOTALL)
        if alumni_section:
            # Parse each alumni entry
            for line in alumni_section.group(1).split('\n'):
                if not line.strip() or not line.startswith('-'):
                    continue

                # Match pattern: - YEAR: [**Name**](...) (Role Description). **Next:** destination
                name_match = re.search(r'\*\*([^\*]+)\*\*', line)
                if not name_match:
                    continue

                name = name_match.group(1).strip()
                alumni_info[name] = {'role_desc': '', 'next': '', 'year': ''}

                # Extract year
                year_match = re.search(r'-\s*(\d{4}(?:,\s*\d{4})?)', line)
                if year_match:
                    alumni_info[name]['year'] = year_match.group(1)

                # Extract role description (text in parentheses)
                role_match = re.search(r'\(([^\)]+)\)\.', line)
                if role_match:
                    alumni_info[name]['role_desc'] = role_match.group(1).strip()

                # Extract next position (greedy match to handle periods in text like "Mt.")
                next_match = re.search(r'\*\*Next:\*\*\s*(.+?)$', line)
                if next_match:
                    next_text = next_match.group(1).strip()
                    # Remove trailing period if present
                    next_text = re.sub(r'\.$', '', next_text)
                    alumni_info[name]['next'] = next_text

    except Exception as e:
        print(f"Warning: Failed to parse alumni info: {e}")

    return alumni_info

def detect_role_transitions(filepath, commits, current_role):
    """Detect role transitions in git history."""
    transitions = []
    prev_role = None

    # Go through commits from oldest to newest
    for commit in reversed(commits):
        role = get_role_at_commit(filepath, commit['hash'])
        if role and role != prev_role:
            # Skip friends but include everything else
            if role != 'friends':
                transitions.append({
                    'role': role,
                    'date': commit['date'],
                    'is_alumni': role == 'alumni'
                })
                prev_role = role

    # If current_role is alumni but we didn't find any non-alumni roles,
    # it means they were added directly as alumni. We need to infer their actual role
    # from the alumni list description
    if current_role == 'alumni' and all(t['is_alumni'] for t in transitions if 'is_alumni' in t):
        # Remove alumni entries, we'll handle them separately
        transitions = []

    return transitions

def estimate_end_date(role, start_date):
    """Estimate end date based on role and typical durations."""
    role_durations = {
        'undergrad': timedelta(days=365),  # 1 year
        'ms': timedelta(days=730),  # 2 years
        'highschool': timedelta(days=90),  # 3 months (summer)
    }

    if role in role_durations:
        return start_date + role_durations[role]

    return None

def infer_role_from_description(role_desc):
    """Infer role short code from alumni list description."""
    desc_lower = role_desc.lower()

    if 'summer' in desc_lower and 'intern' in desc_lower:
        if 'undergrad' in desc_lower:
            return 'undergrad'
        elif 'high school' in desc_lower:
            return 'highschool'

    if 'undergrad' in desc_lower or 'research intern' in desc_lower:
        return 'undergrad'
    if 'high school' in desc_lower:
        return 'highschool'
    if 'research assistant' in desc_lower:
        return 'ra'
    if 'software engineer' in desc_lower or 'scientific programmer' in desc_lower:
        return 'programmer'
    if 'master' in desc_lower:
        return 'ms'
    if 'phd' in desc_lower or 'rotation' in desc_lower:
        return 'phd'
    if 'postdoc' in desc_lower:
        return 'postdoc'

    return 'unknown'

def generate_roster():
    """Generate comprehensive CSV roster."""
    members_dir = Path('_members')
    alumni_info = load_alumni_info()

    roster_rows = []

    for md_file in sorted(members_dir.glob('*.md')):
        content = md_file.read_text()
        frontmatter = parse_frontmatter(content)
        bio_text = get_bio_text(content)

        # Skip friends
        current_role = frontmatter.get('role', '')
        if current_role == 'friends':
            continue

        name = frontmatter.get('name', 'Unknown')

        # Get git history and detect transitions
        commits = get_git_history(str(md_file))
        transitions = detect_role_transitions(str(md_file), commits, current_role)

        # Handle alumni added directly as alumni (e.g., summer interns)
        if current_role == 'alumni' and not transitions:
            # Try to infer role from alumni info
            if name in alumni_info:
                role_desc = alumni_info[name]['role_desc']
                inferred_role = infer_role_from_description(role_desc)
                year = alumni_info[name]['year']

                if commits:
                    # Use when they were added as the start date, estimate end
                    start_date = commits[-1]['date']
                    if 'summer' in role_desc.lower():
                        # Summer interns: June to August
                        year_val = int(year.split(',')[-1].strip()) if year else start_date.year
                        start_date = datetime(year_val, 6, 1)
                        end_date = datetime(year_val, 8, 31)
                    else:
                        # Estimate based on role
                        estimated = estimate_end_date(inferred_role, start_date)
                        end_date = estimated if estimated else start_date + timedelta(days=365)

                    transitions = [{
                        'role': inferred_role,
                        'date': start_date,
                        'end_date_override': end_date if 'summer' in role_desc.lower() else None,
                        'is_alumni': False
                    }]

        # If still no transitions but member exists, use current role
        if not transitions and current_role and current_role != 'alumni':
            if commits:
                transitions = [{'role': current_role, 'date': commits[-1]['date'], 'is_alumni': False}]

        # Infer team and extract other info (use first role for team inference)
        first_role = transitions[0]['role'] if transitions else current_role
        team = infer_team(bio_text, first_role)
        co_advisor = extract_co_advisor(bio_text)
        previous_position = extract_previous_position(bio_text)
        next_position = alumni_info.get(name, {}).get('next', '')

        # Create rows for each role transition
        if transitions:
            for i, transition in enumerate(transitions):
                role = transition['role']
                start_date = transition['date'].strftime('%Y-%m')

                # Determine end_date
                # Check if there's an override (e.g., for summer interns)
                if 'end_date_override' in transition and transition['end_date_override']:
                    end_date = transition['end_date_override'].strftime('%Y-%m')
                elif i < len(transitions) - 1:
                    # Not the last role - use next role's start date
                    next_transition = transitions[i + 1]
                    if next_transition.get('is_alumni', False):
                        # Next is alumni status - estimate end date
                        estimated = estimate_end_date(role, transition['date'])
                        end_date = estimated.strftime('%Y-%m') if estimated else next_transition['date'].strftime('%Y-%m')
                    else:
                        # Normal role transition
                        end_date = next_transition['date'].strftime('%Y-%m')
                elif current_role == 'alumni' or transition.get('is_alumni', False):
                    # Last role and now alumni - estimate end date
                    estimated = estimate_end_date(role, transition['date'])
                    end_date = estimated.strftime('%Y-%m') if estimated else transition['date'].strftime('%Y-%m')
                else:
                    # Currently active in this role
                    end_date = ''

                # Only create row for non-alumni roles
                if role != 'alumni':
                    roster_rows.append({
                        'name': name,
                        'role': role,
                        'start_date': start_date,
                        'end_date': end_date,
                        'previous_position': previous_position if i == 0 else '',  # Only show on first role
                        'next_position': next_position if (i == len(transitions) - 1 and end_date) else '',
                        'team': team,
                        'co_advisor': co_advisor
                    })

    return roster_rows

def main():
    # Debug: Check alumni_info
    alumni_info = load_alumni_info()
    print(f"\nLoaded alumni info for {len(alumni_info)} people")
    # Show a few examples
    for name in list(alumni_info.keys())[:5]:
        info = alumni_info[name]
        print(f"  {name}: role_desc='{info['role_desc']}', next='{info['next']}'")

    roster = generate_roster()

    # Sort by start_date
    roster_sorted = sorted(roster, key=lambda x: (x['start_date'], x['name']))

    # Write to CSV
    output_file = 'lab_roster.csv'
    with open(output_file, 'w', newline='') as f:
        fieldnames = ['name', 'role', 'start_date', 'end_date', 'previous_position', 'next_position', 'team', 'co_advisor']
        writer = csv.DictWriter(f, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(roster_sorted)

    print(f"\nGenerated roster with {len(roster_sorted)} rows")
    print(f"Saved to: {output_file}")

    # Print summary
    print("\nSummary:")
    print(f"  Total rows: {len(roster_sorted)}")
    print(f"  Unique members: {len(set(r['name'] for r in roster_sorted))}")
    print(f"  Currently active: {sum(1 for r in roster_sorted if not r['end_date'])}")
    print(f"  Alumni entries: {sum(1 for r in roster_sorted if r['end_date'])}")

if __name__ == '__main__':
    main()
