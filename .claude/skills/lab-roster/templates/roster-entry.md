# Roster Entry Template

Use this template when adding entries to ROSTER.md.

## Format

```markdown
- **Name**: [Full Name]
  - Role: [role_code]
  - Start: YYYY-MM
  - End: YYYY-MM
  - Previous: [previous position details]
  - Next: [next position details]
  - Team: [team_name]
  - Co-advisor: [co-advisor name]
```

## Field Reference

### Name
Full name as it appears in the member file frontmatter.

**Example**: `Jane Doe`

### Role
One of these short codes:
- `pi` - Principal Investigator
- `postdoc` - Postdoctoral Fellow
- `staff` - Staff Scientist
- `phd` - PhD Student
- `ms` - Master's Student
- `ra` - Research Assistant
- `programmer` - Scientific Programmer / Software Engineer
- `undergrad` - Undergraduate Researcher
- `highschool` - High School Intern

**Example**: `phd`

### Start
When they started in this role, in YYYY-MM format.

**Example**: `2023-09`

### End
When they ended this role, in YYYY-MM format. **Leave empty if currently active**.

**Examples**:
- `2024-08` (departed)
- `` (empty - still active)

### Previous
Their position/education before joining the lab. **Only fill this for their FIRST role entry**. Leave empty for subsequent roles.

**Examples**:
- `PhD in Neuroscience from Princeton University`
- `BS in Computer Science from MIT; worked at Google`
- `Majoring in Data Science at UCSD`
- `` (empty for subsequent entries)

### Next
Where they went after leaving the lab. **Only fill this for their LAST role entry**. Leave empty if unknown or still active.

**Examples**:
- `Harvard pursuing a PhD in Computer Science`
- `AWS`
- `Mt. Sinai School of Medicine pursuing a MD`
- `` (empty if still active or unknown)

### Team
Primary team assignment. One of:
- `software_engineering` - SLEAP, DREEM, cloud infrastructure, plant phenotyping
- `phenoinformatics` - Behavioral phenotyping, disease models, space research
- `virtual_biology` - Virtual Neuroscience Lab, virtual animals, embodied simulations
- `` (empty if unclear)

**Example**: `phenoinformatics`

### Co-advisor
Name of other PI if co-advised or jointly supervised. Leave empty if not applicable.

**Examples**:
- `Uri Manor`
- `Kay Tye`
- `` (empty if no co-advisor)

## Complete Example

### Single Role Member

```markdown
- **Name**: Jane Doe
  - Role: ra
  - Start: 2023-06
  - End: 2024-08
  - Previous: BS in Neuroscience from UCLA
  - Next: MIT pursuing a PhD in Brain and Cognitive Sciences
  - Team: phenoinformatics
  - Co-advisor: Tom Albright
```

### Multi-Role Member

```markdown
- **Name**: John Smith
  - Role: undergrad
  - Start: 2022-09
  - End: 2023-06
  - Previous: Majoring in Computer Science at UCSD
  - Next:
  - Team: software_engineering
  - Co-advisor: Uri Manor

- **Name**: John Smith
  - Role: ms
  - Start: 2023-06
  - End: 2025-06
  - Previous:
  - Next:
  - Team: software_engineering
  - Co-advisor: Uri Manor

- **Name**: John Smith
  - Role: phd
  - Start: 2025-06
  - End:
  - Previous:
  - Next:
  - Team: software_engineering
  - Co-advisor: Uri Manor
```

**Note**:
- Previous field only in first entry
- Next field only in last entry (when they leave)
- Empty strings for fields that don't apply (not "N/A" or "None")

## Summer Intern Example

```markdown
- **Name**: Emily Johnson
  - Role: highschool
  - Start: 2024-06
  - End: 2024-08
  - Previous: High school student at Canyon Crest Academy
  - Next:
  - Team: software_engineering
  - Co-advisor:
```

## Currently Active Member Example

```markdown
- **Name**: Alex Chen
  - Role: programmer
  - Start: 2024-01
  - End:
  - Previous: M.S. in Computer Science from University of Southern California
  - Next:
  - Team: software_engineering
  - Co-advisor:
```

**Note**: End and Next are empty because still active in the lab.

## PI Example

```markdown
- **Name**: Talmo Pereira
  - Role: pi
  - Start: 2021-12
  - End:
  - Previous: PhD in Neuroscience from Princeton University
  - Next:
  - Team:
  - Co-advisor:
```

**Note**: PI typically has no team assignment or co-advisor.
