# Complete Member File Template

This template shows the full structure of a member file.

---

## Template

```markdown
---
name: Full Name
image: images/firstname-lastname.jpg
role: role_code
description: Role Display Text
links:
  email: name@salk.edu
  github: username
  linkedin: profile-id
  home-page: https://example.com
---

[Bio text here in markdown format]
```

---

## Field Reference

### name (required)
Full legal or preferred name as it should appear on the website.

**Examples**:
- `Jane Doe`
- `John Smith`
- `Yaxin (Nancy) Guo`

### image (required)
Relative path to profile image from site root.

**Format**: `images/filename.jpg`

**Examples**:
- `images/jane-doe.jpg`
- `images/john-smith.png`
- `images/placeholder.svg` (if no photo yet)

### role (required)
Short code for role category.

**Valid values**:
- `pi` - Principal Investigator
- `postdoc` - Postdoctoral Researcher
- `staff` - Staff Scientist
- `phd` - PhD Student
- `ms` - MS Student
- `undergrad` - Undergraduate Student
- `highschool` - High School Student
- `programmer` - Programmer
- `ra` - Research Assistant
- `friends` - Friends of the Lab
- `alumni` - Alumni

### description (optional)
Short text describing the role. Usually matches the role display text from `_data/roles.yaml`.

**Examples**:
- `PhD Student`
- `Scientific Programmer`
- `Research Assistant`
- `Undergraduate Summer Research Intern`

### links (optional)
Dictionary of social and professional links.

**Supported keys**:
- `email` - Email address
- `github` - GitHub username (not full URL)
- `linkedin` - LinkedIn profile ID (not full URL)
- `twitter` - Twitter handle (not full URL)
- `home-page` - Personal website (full URL)
- `orcid` - ORCID identifier

**Example**:
```yaml
links:
  email: jane.doe@salk.edu
  github: janedoe
  linkedin: jane-doe-scientist
  home-page: https://janedoe.com
```

---

## Complete Examples

### PhD Student

```markdown
---
name: Jane Doe
image: images/jane-doe.jpg
role: phd
description: PhD Student
links:
  email: jane.doe@salk.edu
  github: janedoe
  linkedin: jane-doe
---

Jane is a PhD student who joined the lab in September 2024. She received her BS in Neuroscience from MIT. Her research focuses on developing computational methods for behavioral analysis in mouse models. She is interested in applying machine learning to understand complex social behaviors.
```

### Programmer

```markdown
---
name: John Smith
image: images/john-smith.jpg
role: programmer
description: Scientific Programmer
links:
  email: john.smith@salk.edu
  github: jsmith
---

John is a scientific programmer who joined the lab in January 2025. He received his MS in Computer Science from Stanford University. He is working on cloud deployment and infrastructure for SLEAP. Prior to joining, he worked as a software engineer at Google for three years, focusing on distributed systems and machine learning infrastructure.
```

### Undergraduate

```markdown
---
name: Alex Chen
image: images/alex-chen.jpg
role: undergrad
description: Undergraduate Student
links:
  email: alex.chen@ucsd.edu
  github: achen
---

Alex is a third-year undergraduate at UC San Diego, majoring in Data Science. He joined the lab in February 2024 and is working on improving pose estimation algorithms for multi-animal tracking. He was a 2023 UCSD URS Eureka! Summer Fellow.
```

### Research Assistant

```markdown
---
name: Maria Garcia
image: images/maria-garcia.jpg
role: ra
description: Research Assistant
links:
  email: maria.garcia@salk.edu
---

Maria is a research assistant who joined the lab in July 2024. She received her BS in Cognitive Science with a minor in Computer Science from UCSD. She is working on behavioral phenotyping and data analysis for neurodegenerative disease models.
```

### Alumni (Summer Intern)

```markdown
---
name: David Park
image: images/placeholder.svg
role: alumni
description: Undergraduate Summer Research Intern
---

David was an undergraduate summer research intern in 2025. He is studying Computer Science at Columbia University. He worked on virtual animal simulations and neuromechanical modeling, mentored by Jason Foat.
```

### Alumni (Longer Tenure)

```markdown
---
name: Sarah Lee
image: images/sarah-lee.jpg
role: alumni
description: Research Assistant
links:
  email: sarah.lee@princeton.edu
  github: slee
---

Sarah was a research assistant in the lab from 2022 to 2024. She received her BS in Biology from UC Berkeley and her MS in Neuroscience from UCSD. Her work focused on behavioral analysis in disease models. She is now pursuing a PhD in Neuroscience at Princeton.
```

---

## Filename Convention

**Format**: `firstname-lastname.md`

**Rules**:
- All lowercase
- Use hyphens for spaces (kebab-case)
- No special characters
- Match the name reasonably close
- Should be URL-friendly

**Examples**:
- Jane Doe → `jane-doe.md`
- John Smith III → `john-smith.md`
- María García → `maria-garcia.md`
- Yaxin (Nancy) Guo → `nancy-guo.md` or `yaxin-guo.md`

---

## Bio Text Guidelines

See the specific bio templates for detailed guidance:
- [bio-student.md](bio-student.md) - PhD, MS, Undergraduate
- [bio-staff.md](bio-staff.md) - Programmer, Staff, RA
- [bio-alumni.md](bio-alumni.md) - Former members

**General rules**:
- Third person voice
- Professional, academic tone
- Include: education, join date, research focus
- Length: 80-250 words depending on role and tenure
- Use markdown for formatting if needed (links, bold, etc.)

---

## Creating a New Member File

### Checklist

Before creating:
- [ ] Have full name
- [ ] Know their role
- [ ] Have or can get profile image
- [ ] Know when they joined
- [ ] Know their education background
- [ ] Know what they're working on
- [ ] Have contact info (email minimum)

### Steps

1. **Create file**: `_members/firstname-lastname.md`
2. **Add frontmatter** with required fields (name, image, role)
3. **Add optional fields** (description, links)
4. **Write bio** following role-appropriate template
5. **Validate** YAML frontmatter
6. **Add/optimize image** to `images/` directory
7. **Test** by building site locally (optional)
8. **Commit** changes

### Validation

Before committing:
- [ ] YAML frontmatter is valid
- [ ] Role is one of the valid codes
- [ ] Image path is correct
- [ ] Image file exists (or is placeholder)
- [ ] Bio is third person
- [ ] Bio has appropriate length
- [ ] Join date mentioned
- [ ] Education included
- [ ] Links are properly formatted

---

## Common Mistakes to Avoid

### YAML Formatting Errors

**Colons in values need quotes**:
```yaml
❌ description: Co-advised by: Jane Smith
✓ description: "Co-advised by: Jane Smith"
```

**Indentation must be consistent**:
```yaml
❌ links:
email: test@salk.edu
  github: user

✓ links:
  email: test@salk.edu
  github: user
```

**No tabs, only spaces**:
```yaml
❌ links:
→   email: test@salk.edu

✓ links:
    email: test@salk.edu
```

### Content Errors

**First person instead of third**:
```markdown
❌ I am a PhD student working on behavior.
✓ Jane is a PhD student working on behavior.
```

**Missing key information**:
```markdown
❌ Jane works on behavior.
✓ Jane is a PhD student who joined the lab in September 2024. She received her BS from MIT and is working on behavioral analysis.
```

**Too much detail**:
```markdown
❌ Jane graduated summa cum laude with a 3.95 GPA from MIT where she took courses in neuroscience, computer science, statistics, and machine learning. She then...

✓ Jane received her BS in Neuroscience from MIT. She is working on...
```

### Link Formatting Errors

**Using full URLs for social**:
```yaml
❌ github: https://github.com/janedoe
✓ github: janedoe

❌ linkedin: https://linkedin.com/in/jane-doe
✓ linkedin: jane-doe
```

**Incorrect email format**:
```yaml
❌ email: mailto:jane@salk.edu
✓ email: jane@salk.edu
```

---

## File Location and Jekyll Processing

### How It Works

1. File placed in `_members/` directory
2. Jekyll reads file and parses frontmatter
3. Bio content processed as Markdown
4. Member added to `site.members` collection
5. Individual page generated at `/members/firstname-lastname.html`
6. Member appears on team page filtered by role

### Display Locations

**Team page** (`/team`):
- Displays all active members grouped by role
- Shows portrait with image, name, role icon
- Links to individual member page

**Individual page** (`/members/firstname-lastname.html`):
- Full profile with large image
- Complete bio
- All links as buttons
- Related content (if configured)

**Alumni section** (team/index.md):
- Listed in markdown
- Only shown if `role: alumni`
- Must be manually added to list
