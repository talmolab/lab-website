# Lab Roster Usage Examples

This document shows concrete examples of using the lab roster skill in different scenarios.

## Example 1: Quick CSV Generation

**Scenario**: You need to quickly regenerate the roster CSV with current data.

**User request**:
> "Can you generate the lab roster CSV?"

**What happens**:
1. Skill activates automatically (matches "roster" keyword)
2. Claude chooses Mode 1 (quick generation)
3. Runs Python script to analyze git history
4. Generates `lab_roster.csv`
5. Shows summary

**Output**:
```
✓ Generated roster with 58 entries
✓ Saved to: lab_roster.csv

Summary:
  Total entries: 58
  Unique members: 51
  Currently active: 17
  Alumni entries: 41
```

**Time**: ~10 seconds

---

## Example 2: Comprehensive First-Time Generation

**Scenario**: First time creating roster, want high accuracy and verification.

**User request**:
> "I need to create a comprehensive lab roster with everyone who's ever been in the lab"

**What happens**:
1. Skill activates automatically
2. Claude chooses Mode 2 (comprehensive)
3. Lists all member files (57 found)
4. Launches subagents in batches:
   - Batch 1: Aaditya Prasad, Adam Lee, Advaith Ravishankar, Amick Licup
   - Batch 2: Amitha Attapu, Andrew Park, Arlo Sheridan, Arnav Dagar
   - ... (continues for all members)
5. Each subagent:
   - Reads member file
   - Analyzes git history
   - Checks alumni list
   - Infers team from bio keywords
   - Extracts co-advisor, previous/next positions
6. Creates/updates `ROSTER.md` with all entries
7. Generates `lab_roster.csv` from ROSTER.md
8. Shows summary with validation

**Output**:
```
✓ Created ROSTER.md with 58 entries
✓ Generated lab_roster.csv

Summary:
  Total entries: 58
  Unique members: 51
  Currently active: 17
  Alumni entries: 41
  Team distribution:
    - software_engineering: 20
    - phenoinformatics: 28
    - virtual_biology: 10
```

**Time**: ~2-3 minutes (depending on batch processing)

---

## Example 3: Adding New Members

**Scenario**: Several new members joined, need to update roster.

**User request**:
> "Update the roster with the new members who joined this quarter"

**What happens**:
1. Skill activates
2. Claude lists current member files
3. Compares with existing ROSTER.md
4. Identifies new members not in roster
5. Launches subagents for only new members
6. Appends entries to ROSTER.md
7. Regenerates CSV
8. Shows summary of additions

**Example interaction**:
```
Found 3 new members not in roster:
- New Member 1
- New Member 2
- New Member 3

Gathering information...
✓ Added New Member 1 (undergrad, software_engineering)
✓ Added New Member 2 (ra, phenoinformatics)
✓ Added New Member 3 (programmer, software_engineering)

✓ Updated ROSTER.md
✓ Regenerated lab_roster.csv

Summary:
  Total entries: 61 (+3)
  Currently active: 20 (+3)
```

**Time**: ~30 seconds

---

## Example 4: Handling Role Transitions

**Scenario**: Student transitioned from undergrad to MS, need to update roster.

**User request**:
> "Scott Yang just started his PhD, can you update the roster?"

**What happens**:
1. Skill activates
2. Claude reads Scott's member file
3. Checks git history for role changes
4. Finds: `undergrad` (2023-09) → `ms` (2023-11) → `phd` (2025-05)
5. Updates ROSTER.md with proper date on MS end
6. Adds new PhD entry
7. Regenerates CSV

**ROSTER.md before**:
```markdown
- **Name**: Scott Yang
  - Role: undergrad
  - Start: 2023-09
  - End: 2023-11
  - Previous: Majoring in Data Science and Cognitive Science at UCSD
  - Next:
  - Team: virtual_biology
  - Co-advisor:

- **Name**: Scott Yang
  - Role: ms
  - Start: 2023-11
  - End:
  - Previous:
  - Next:
  - Team: virtual_biology
  - Co-advisor:
```

**ROSTER.md after**:
```markdown
- **Name**: Scott Yang
  - Role: undergrad
  - Start: 2023-09
  - End: 2023-11
  - Previous: Majoring in Data Science and Cognitive Science at UCSD
  - Next:
  - Team: virtual_biology
  - Co-advisor:

- **Name**: Scott Yang
  - Role: ms
  - Start: 2023-11
  - End: 2025-05
  - Previous:
  - Next:
  - Team: virtual_biology
  - Co-advisor:

- **Name**: Scott Yang
  - Role: phd
  - Start: 2025-05
  - End:
  - Previous:
  - Next:
  - Team: virtual_biology
  - Co-advisor:
```

---

## Example 5: Verifying Team Assignments

**Scenario**: Want to verify all team assignments are correct.

**User request**:
> "Show me everyone on the software engineering team"

**What happens**:
1. Reads `lab_roster.csv`
2. Filters by `team == "software_engineering"`
3. Shows list with roles and status

**Output**:
```
Software Engineering Team (20 entries, 8 currently active):

Currently Active:
- Andrew Park (undergrad)
- Benfica Xavier Fernando (programmer)
- Divya Seshadri Murali (programmer)
- Elizabeth Berrigan (programmer)
- Eric Leonardis (postdoc)
- Liezl Maree (programmer)
- Mustafa Shaikh (ra)
- Amick Licup (ra)

Alumni:
- Aaditya Prasad (undergrad 2021-11 to 2022-11)
- Aaditya Prasad (ms 2022-11 to 2024-10)
- Advaith Ravishankar (undergrad 2022-05 to 2025-05)
- Arlo Sheridan (programmer 2022-03 to 2023-08)
- ... (continues)
```

---

## Example 6: Extracting Career Trajectories

**Scenario**: Want to see where alumni went after leaving.

**User request**:
> "Show me where our alumni ended up"

**What happens**:
1. Reads `lab_roster.csv`
2. Filters entries with `end_date` filled and `next_position` filled
3. Groups by destination type
4. Shows summary

**Output**:
```
Alumni Next Positions:

PhD Programs (7):
- Aaditya Prasad → MIT PhD in Brain and Cognitive Sciences
- Adam Lee → Harvard PhD in Computer Science
- Dexter Tsin → Princeton PhD in Neuroscience
- Sean Afshar → Princeton PhD in Neuroscience
- Yaxin (Nancy) Guo → NYU PhD in Bioengineering

MS Programs (1):
- Advaith Ravishankar → Harvard MS in Computer Science

Industry (3):
- Amitha Attapu → AWS
- Arlo Sheridan → E11 Bio

Medical School (1):
- Carlos Robles → Mt. Sinai School of Medicine pursuing a MD

Other Academic Positions (1):
- Chaitanya Kapoor → UCSD RA with Meenakshi Khosla
```

---

## Example 7: Summer Intern Tracking

**Scenario**: Multiple summer interns joined and left, need proper tracking.

**User request**:
> "Add the 2025 summer interns to the roster"

**What happens**:
1. Lists member files with role `alumni` added recently
2. Checks alumni list for summer intern descriptions
3. Identifies: Drake Thompson, Hutton Saunders, Papa Manu, Rusham Bhatt, Van Nguyen
4. Infers roles from descriptions
5. Sets dates to summer period (2025-06 to 2025-08)
6. Creates roster entries

**Example entry**:
```markdown
- **Name**: Papa Manu
  - Role: undergrad
  - Start: 2025-06
  - End: 2025-08
  - Previous: Undergraduate at UMBC; Meyerhoff Scholar studying Computer Science
  - Next:
  - Team: software_engineering
  - Co-advisor:
```

---

## Example 8: Co-Advisor Analysis

**Scenario**: Want to see all collaborative projects.

**User request**:
> "Who are we collaborating with? Show me all co-advised members"

**What happens**:
1. Reads `lab_roster.csv`
2. Filters entries with `co_advisor` field filled
3. Groups by co-advisor
4. Shows summary

**Output**:
```
Collaborative Supervision:

Uri Manor (6 members):
- Aaditya Prasad (undergrad, ms)
- Arlo Sheridan (programmer)
- Mustafa Shaikh (ra)
- Theo Couris (undergrad)

Tom Albright (1 member):
- Eric Leonardis (postdoc)

Kay Tye (1 member):
- Dexter Tsin (undergrad)

Eiman Azim (2 members):
- Kaela Evans (ra)
- Nathaniel Nono (undergrad)

Todd Michael (1 member):
- Benfica Xavier Fernando (programmer)

Kuo-Fen Lee (1 member):
- Yipeng Li (ra)
```

---

## Example 9: Validation and Error Checking

**Scenario**: Generated roster but want to verify data quality.

**User request**:
> "Validate the roster and check for any issues"

**What happens**:
1. Reads both ROSTER.md and lab_roster.csv
2. Runs validation checks:
   - All active members have empty end_date ✓
   - All alumni have end_date ✓
   - No "alumni" or "friends" role codes ✓
   - All dates in YYYY-MM format ✓
   - Multi-role members have proper previous/next placement ✓
   - CSV matches ROSTER.md ✓
3. Identifies potential issues:
   - 3 members missing team assignment
   - 1 member with gap in role dates

**Output**:
```
Validation Results:

✓ All active members have empty end_date (17 members)
✓ All alumni have end_date (41 entries)
✓ No invalid role codes
✓ All dates properly formatted
✓ CSV matches ROSTER.md

⚠ Potential Issues:

Missing team assignments (3):
- Arnav Dagar (highschool)
- Theo Couris (undergrad)
- Van Nguyen (undergrad)

Recommendation: Review these member bios to infer teams, or leave empty if unclear.
```

---

## Example 10: Custom Queries

**Scenario**: Complex analysis question.

**User request**:
> "How many people have transitioned between roles in the lab?"

**What happens**:
1. Reads `lab_roster.csv`
2. Groups by name
3. Counts entries per person
4. Filters those with >1 entry
5. Analyzes transition patterns

**Output**:
```
Role Transitions Analysis:

7 members transitioned between roles:

Aaditya Prasad: undergrad → ms (2 roles)
Scott Yang: undergrad → ms → phd (3 roles)
Amick Licup: undergrad → ra (2 roles)
Divya Seshadri Murali: ms → programmer (2 roles)
David Samy: highschool → highschool (2 separate summers)
Will Knickrehm: highschool → highschool (2 separate summers)

Common transitions:
- undergrad → ms (2 cases)
- ms → phd (1 case)
- ms → programmer (1 case)
- undergrad → ra (1 case)

Average time in first role: 1.8 years
```

---

## Tips for Using the Skill

1. **Natural language works**: Just ask for what you need - "update roster", "show me the team", etc.

2. **Skill auto-activates**: No need to explicitly invoke - mention "roster" or "lab members"

3. **Choose your mode**:
   - Quick updates → Mode 1 (script)
   - Verification needed → Mode 2 (subagents)

4. **Trust ROSTER.md**: It's human-editable, so you can fix issues manually

5. **CSV regenerates**: Always regenerate CSV from ROSTER.md after manual edits

6. **Validation helps**: Ask to validate after generation to catch issues

7. **Custom queries**: Skill can analyze roster data in various ways

8. **Incremental updates**: Better to update frequently than regenerate everything
