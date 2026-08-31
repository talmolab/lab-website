---
name: lab-roster
description: Generate a lab member roster CSV from the people content collection, with one row per appointment — role transitions, tenure, co-advisors and career destinations. Use when the user mentions roster, team list, lab members, or the annual review.
version: 1.0.0
allowed-tools: Read, Glob, Grep, Bash, Task, Write, Edit
---

# Lab Roster Generator

This skill generates comprehensive rosters of all lab members with detailed tracking of roles, dates, team assignments, and career progressions.

## When to Use This Skill

Use this skill when the user requests:
- "Generate the lab roster"
- "Update the team list"
- "Create a CSV of all lab members"
- "Track who's been in the lab"
- "Show me the roster with role transitions"
- Any mention of roster, member list, or team tracking

## Two Generation Modes

### Reading, not inferring

```bash
python3 .claude/skills/lab-roster/scripts/roster_from_collection.py --out lab_roster.csv
python3 .claude/skills/lab-roster/scripts/roster_from_collection.py --current-only
```

One row per appointment, so someone who was an undergrad and then an MS student
gets two rows — which is what the annual review needs.

**This used to be much harder, and the difficulty was the point.** The old version
parsed the team page's prose bullets, inferred role transitions from git history,
and then *estimated* end dates from typical role durations. It had to, because year,
prior roles, transitions and destinations existed nowhere but a hand-written
markdown list. Appointments are structured now, so every column is read. A blank
cell means "not recorded", never "we guessed".

The `status` column is explicit — `current`, `departed`, or
`departed, date unrecorded` — so a blank `end_date` is never ambiguous. That
distinction is load-bearing: conflating "gone" with "still here" is what left four
people invisible on the old site.

The script reports anyone with no recorded start date rather than filling one in.
Three people currently have none; see `docs/phase2-people-review.md`.

### Where the older data lives

`Salk/annual-review/2025/lab_roster.csv` in Google Drive is a hand-maintained roster
through 2025-10, and it is the source most of the structured dates came from. It is
richer than the website ever was — `YYYY-MM` on both ends, co-advisors, one row per
role period. If a date is missing from the collection, check there before asking.


## Field Descriptions

- **name**: Full name of the lab member
- **role**: Short code (pi, postdoc, staff, phd, ms, ra, programmer, undergrad, highschool)
- **start_date**: When they started (YYYY-MM format)
- **end_date**: When they ended (YYYY-MM format, empty if still active)
- **previous_position**: Position before joining lab (only in first entry)
- **next_position**: Where they went after (only in last entry)
- **team**: Primary team (software_engineering, phenoinformatics, virtual_biology)
- **co_advisor**: Other PIs they work with

## Team Inference Rules

Use these keyword mappings to infer team from bio text:

**software_engineering**:
- Keywords: SLEAP, DREEM, cloud, infrastructure, plant, root, AWS, full-stack, data pipeline, software engineer, programmer, bioinformatics analyst, computer vision algorithm, pose estimation

**phenoinformatics**:
- Keywords: phenotyp, behavior, ALS, Alzheimer, disease model, mice, mouse, longitudinal, space, neurodegenerative, multi-animal, tracking pipeline

**virtual_biology** (highest priority):
- Keywords: VNL, virtual lab, virtual animal, embodied, neuromechanical simulation

Note: Check virtual_biology keywords first, then software_engineering, then phenoinformatics.

## Co-Advisor Extraction

Look for these patterns in bio text:
- "co-advised by [Name]"
- "co-supervised by [Name]"
- "jointly with [Name]"
- "joint with [Name]"

Remove markdown links and extract just the name.

## Previous/Next Position Extraction

**Previous positions** - look for:
- "Prior to joining..."
- "previously worked at/as..."
- "received [degree] from..."
- Education background

**Next positions** - look in `team/index.md` alumni section:
- Format: `**Next:** [position]`

## Validation Checklist

Before presenting results:
- [ ] All active members included
- [ ] Role transitions properly split into multiple entries
- [ ] Start dates seem reasonable
- [ ] Teams assigned for most members
- [ ] No duplicate entries
- [ ] Row count matches: appointments, not people (60 across 53 people today)
- [ ] Summary statistics make sense

## Output Format

Always show:
```
✓ Generated roster with [N] entries
✓ Saved to: lab_roster.csv

Summary:
  Total entries: [N]
  Unique members: [N]
  Currently active: [N]
  Alumni entries: [N]
  Team distribution:
    - software_engineering: [N]
    - phenoinformatics: [N]
    - virtual_biology: [N]
```

## Error Handling

If script fails:
1. Check Python version (needs Python 3.6+)
2. Verify git is available
3. Check that `src/content/people/` exists and contains `*.md`
4. Look for malformed member files

If subagents miss information:
1. Review their search patterns
2. Check if member files follow expected format
3. Manually verify edge cases

## Notes

- Multiple rows for one person are normal and expected (undergrad → MS → PhD)
- `role: friend` covers affiliates rather than lab appointments; their real title
  is in `title`. Filter them out if the roster is for headcount.
- **Start dates are read, not guessed.** If one is blank it is genuinely unrecorded
  — do not fill it in from git history, which records when the file was created
  rather than when the person arrived (they differ by months in several cases).
- The CSV is generated output. Fix the collection, then regenerate; editing the CSV
  puts the two out of sync and the collection is what the site renders.

## See Also

- [reference.md](reference.md) - Detailed documentation on member formats and inference patterns
- [examples.md](examples.md) - Example usage scenarios
- [templates/roster-entry.md](templates/roster-entry.md) - Entry format template
- `src/content.config.ts` - the `people` schema, which is the authority on fields
- `docs/phase2-people-review.md` - known gaps in the data
