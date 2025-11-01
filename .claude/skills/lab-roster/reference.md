# Lab Roster Reference Documentation

This document provides detailed information about member file formats, git history patterns, and data inference rules.

## Member File Format

Member files are stored in `_members/[name].md` with YAML frontmatter and markdown bio.

### Example Member File

```markdown
---
name: Jane Doe
image: images/jane-doe.jpg
role: phd
description: PhD Student
links:
  github: janedoe
  linkedin: jane-doe
---

Jane is a PhD student who joined the lab in Fall 2023. She is working on
developing machine learning methods for behavioral phenotyping in mouse models
of Alzheimer's disease, co-advised by John Smith. Prior to joining, she
received her BS in Neuroscience from MIT where she worked on systems
neuroscience.
```

### Frontmatter Fields

- `name`: Full name (required)
- `image`: Profile image path (optional)
- `role`: Current role short code (required)
  - Valid roles: `pi`, `postdoc`, `staff`, `phd`, `ms`, `ra`, `programmer`, `undergrad`, `highschool`, `alumni`, `friends`
- `description`: Role description (optional)
- `links`: Social/professional links (optional)

### Bio Text Patterns

The bio text (after frontmatter) contains rich information for extraction:

**Join dates**: "joined the lab in [time period]"
**Projects**: Descriptions of what they're working on
**Co-advisors**: "co-advised by [Name]", "jointly with [Name]"
**Previous positions**: "Prior to joining...", "previously worked...", "received [degree] from..."
**Education**: Degree programs and institutions
**Teams**: Inferred from project keywords

## Git History Analysis

### Finding Member File Creation

```bash
git log --follow --format="%aI|%s" -- _members/[name].md
```

Output format:
```
2023-09-15T10:30:00-07:00|Add Jane Doe
2024-01-10T14:20:00-07:00|Update Jane's bio
2024-05-01T09:15:00-07:00|Change role to PhD
```

The **oldest commit** indicates when they joined (use date as start_date).

### Detecting Role Transitions

Check file content at different commits:

```bash
git show <commit-hash>:_members/[name].md
```

Look for changes in the `role:` frontmatter field. Common transitions:
- `undergrad` → `ms` → `phd`
- `undergrad` → `ra`
- `ms` → `programmer`
- Any role → `alumni`

**Important**: Create separate roster entries for each distinct role.

### Handling Alumni

When `role: alumni`, check git history to find their actual roles before alumni status:
1. Get all commits
2. Check role field at each commit
3. Identify non-alumni roles
4. Create entries for actual roles, not "alumni"

## Team Assignment Logic

Teams are inferred from bio keywords using a priority system.

### Priority 1: Virtual Biology

**Keywords** (highest priority, check first):
- VNL
- virtual lab
- virtual animal
- embodied
- neuromechanical simulation

**Example bio text**:
> "working on the Virtual Neuroscience Lab (VNL) to create embodied simulations"

### Priority 2: Software Engineering

**Keywords**:
- SLEAP
- DREEM
- cloud
- infrastructure
- plant / root
- AWS / Google Cloud
- full-stack
- data pipeline
- software engineer
- programmer
- bioinformatics analyst
- scientific programmer
- computer vision algorithm
- pose estimation

**Exclusion**: If bio also contains phenotyping/behavior/disease keywords, might be phenoinformatics instead.

**Example bio text**:
> "developing cloud infrastructure for SLEAP deployment on AWS"

### Priority 3: Phenoinformatics

**Keywords**:
- phenotyp / phenotyping
- behavior / behavioral
- ALS
- Alzheimer / Alzheimer's
- disease / disease model
- mice / mouse
- longitudinal
- space / spaceflight
- neurodegenerative
- multi-animal
- tracking pipeline

**Example bio text**:
> "analyzing behavioral phenotypes in mouse models of ALS"

### Edge Cases

**Computer Science students**: Check for project keywords
- If working on SLEAP/infrastructure → software_engineering
- If working on behavior analysis → phenoinformatics
- If working on virtual animals → virtual_biology

**Summer interns**: Usually assigned based on mentor or project description

**Role-based fallback**:
- `programmer` with "computer" in bio → software_engineering
- `phd`/`postdoc` → infer from research description

**Unknown**: Leave team field empty if no clear indicators

## Co-Advisor Extraction

### Pattern Matching

Search bio text for these phrases (case-insensitive):

1. `co-advised by [Name]` → Extract Name
2. `co-supervised by [Name]` → Extract Name
3. `jointly with [Name]` / `jointly with the [Name] Lab` → Extract Name
4. `joint with [Name]` → Extract Name

### Cleaning

1. Remove markdown links: `[John Smith](http://...)` → `John Smith`
2. Remove trailing phrases:
   - ` and ...` → remove everything after "and"
   - ` at ...` → remove everything after "at"
   - ` who ...` → remove everything after "who"
   - ` where ...` → remove everything after "where"
3. Remove " Lab" suffix if present
4. Trim whitespace

### Examples

```
Input: "co-advised by [Uri Manor](http://manor-lab.org)"
Output: "Uri Manor"

Input: "jointly with the Todd Michael Lab"
Output: "Todd Michael"

Input: "co-supervised by John Smith and Jane Doe at MIT"
Output: "John Smith"
```

## Previous Position Extraction

### Pattern Matching

Look for these phrases in bio text:

1. `Prior to joining [the lab, ][he|she|they] [was|worked] ...`
2. `previously worked [at|as] ...`
3. `previously held position[s] [at|as] ...`
4. `after which [he|she|they] worked ...`
5. Education background (degrees from institutions)

### What to Extract

**Good previous positions**:
- Prior employment: "worked as an engineer at Google"
- Prior academic position: "postdoc at Stanford"
- Advanced degree with institution: "PhD from Princeton"
- Specific research: "worked with Anne Churchland at UCLA"

**Not previous positions**:
- Undergraduate major at current institution (e.g., "majoring in CS at UCSD")
- Current degree program
- High school attendance

### Examples

```
"Prior to joining the lab, he was a software engineer at Microsoft"
→ "software engineer at Microsoft"

"BS in Neuroscience from MIT where she worked on systems neuroscience"
→ "BS in Neuroscience from MIT; worked on systems neuroscience"

"previously worked as a quantitative analyst"
→ "quantitative analyst"
```

## Next Position Extraction

### Source: Alumni List

Next positions are found in `team/index.md` under the `## Alumni` section.

### Format

```markdown
## Alumni

- 2024: [**Jane Doe**](members/jane-doe) (PhD Student). **Next:** Harvard postdoctoral fellowship
- 2023: [**John Smith**](members/john-smith) (Research Assistant). **Next:** Princeton pursuing a PhD in Neuroscience
```

### Extraction Pattern

1. Find line with member's name in alumni section
2. Extract text after `**Next:**`
3. Remove trailing period if present
4. Handle periods in institution names (e.g., "Mt. Sinai")

### Examples

```
"**Next:** Harvard postdoctoral fellowship"
→ "Harvard postdoctoral fellowship"

"**Next:** Mt. Sinai School of Medicine pursuing a MD."
→ "Mt. Sinai School of Medicine pursuing a MD"

"**Next:** AWS"
→ "AWS"
```

## Alumni List Role Descriptions

For members added directly as alumni (common for summer interns), the alumni list contains role descriptions.

### Format

```markdown
- 2024: [**Jane Doe**](members/jane-doe) (Summer Research Intern). **Next:** Harvard
```

### Inferring Roles from Descriptions

Map description text to role codes:

| Description Pattern | Role Code |
|---------------------|-----------|
| "Summer Research Intern" + "high school" | `highschool` |
| "Summer Research Intern" + "undergrad" | `undergrad` |
| "Research Intern" / "Undergrad" | `undergrad` |
| "High school" | `highschool` |
| "Research Assistant" | `ra` |
| "Software Engineer" / "Scientific Programmer" | `programmer` |
| "Master's" | `ms` |
| "PhD" / "Rotation Student" | `phd` |
| "Postdoc" | `postdoc` |

### Summer Intern Date Handling

For summer interns (June-August):
- Extract year from alumni list
- Set start_date: `YYYY-06` (June)
- Set end_date: `YYYY-08` (August)

## Date Format Standards

### Input Formats

Git dates: ISO 8601 with timezone
```
2023-09-15T10:30:00-07:00
```

### Output Format

Always use `YYYY-MM` (year-month):
```
2023-09
```

### Estimating End Dates

For alumni without clear end dates, estimate based on role:

| Role | Typical Duration |
|------|------------------|
| `highschool` | 3 months (summer) |
| `undergrad` | 1 year |
| `ms` | 2 years |
| `ra` | 1-2 years |
| `programmer` | Varies |
| `phd` | 5+ years (usually transitions to alumni when updated) |
| `postdoc` | 2-3 years |

If person transitioned to next role, use next role's start date as end date.

## Data Quality Notes

### Expected Empty Fields

**Previous position**:
- May be empty for undergrads joining directly
- Only filled in first entry for multi-role members

**Next position**:
- Empty for currently active members
- Empty if not tracked in alumni list
- Only filled in last entry for multi-role members

**Team**:
- May be empty if bio lacks project keywords
- PI typically has no team assignment

**Co-advisor**:
- Empty if no collaborative supervision
- Common for students, rare for staff/programmers

### Common Issues

**Multiple names in alumni list**:
- Some members appear multiple times (e.g., different years, different roles)
- This is correct - they had multiple stints in the lab

**Role code mismatches**:
- Alumni list may say "PhD Student" but member file never had `role: phd`
- Trust git history over description
- For summer interns added as alumni, trust description

**Date ambiguity**:
- "Fall 2023" → use `2023-09`
- "Spring 2024" → use `2024-01`
- "Summer 2023" → use `2023-06`
- When only year known → use `-01` (January)

## Validation Rules

After generating roster, validate:

1. **No "alumni" or "friends" roles in output** - these aren't actual positions
2. **Currently active members have empty end_date**
3. **Alumni have filled end_date**
4. **Multi-role members**:
   - Entries are chronological
   - Previous only in first entry
   - Next only in last entry
   - No gaps or overlaps in dates
5. **Date format**: All dates are YYYY-MM
6. **Role codes**: All valid (pi, postdoc, staff, phd, ms, ra, programmer, undergrad, highschool)
7. **Team codes**: All valid or empty (software_engineering, phenoinformatics, virtual_biology)

## Script Behavior

### generate_roster_csv.py

**What it does**:
1. Scans `_members/` directory
2. Parses frontmatter and bio from each file
3. Analyzes git history for dates and transitions
4. Loads alumni info from `team/index.md`
5. Infers teams, extracts co-advisors and positions
6. Generates `lab_roster.csv`

**Limitations**:
- Complex inference may miss edge cases
- Git history required
- Alumni list must be well-formatted

### roster_md_to_csv.py

**What it does**:
1. Parses `ROSTER.md` roster entries
2. Extracts all fields
3. Generates `lab_roster.csv`

**Advantages**:
- Simpler, more reliable
- Allows manual verification via ROSTER.md
- No git dependency

## Best Practices

1. **Use comprehensive mode for first generation** - allows verification
2. **Keep ROSTER.md up to date** - serves as source of truth
3. **Regenerate CSV from ROSTER.md** - ensures consistency
4. **Manually verify alumni transitions** - most error-prone
5. **Check team assignments** - keyword inference may need tuning
6. **Document special cases** - add notes in ROSTER.md if needed
