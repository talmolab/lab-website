---

# Add Lab Member - Reference Documentation

Comprehensive reference for member file formats, bio patterns, and technical details.

## Table of Contents

1. [Member File Format](#member-file-format)
2. [Role Definitions](#role-definitions)
3. [Bio Patterns by Role](#bio-patterns-by-role)
4. [Alumni Handling](#alumni-handling)
5. [Image Specifications](#image-specifications)
6. [Link Formats](#link-formats)
7. [Jekyll Integration](#jekyll-integration)

---

## Member File Format

### Directory and Filename

**Location**: `_members/`
**Naming convention**: `firstname-lastname.md` (kebab-case, all lowercase)
**Examples**:
- `talmo-pereira.md`
- `scott-yang.md`
- `papa-manu.md`

### File Structure

```markdown
---
[YAML frontmatter]
---

[Bio text in markdown]
```

### YAML Frontmatter

#### Required Fields

```yaml
name: Full Name
image: images/filename.jpg
role: role_code
```

#### Optional Fields

```yaml
description: Short role description
links:
  email: email@domain.com
  github: username
  linkedin: profile-id
  home-page: https://example.com
  twitter: handle
```

#### Complete Example

```yaml
---
name: Jane Doe
image: images/jane-doe.jpg
role: phd
description: PhD Student
links:
  email: jane@salk.edu
  github: janedoe
  linkedin: jane-doe-123
---

Jane is a PhD student who joined the lab in September 2023. She received her BS in Neuroscience from MIT where she worked on systems neuroscience. She is working on developing machine learning methods for behavioral phenotyping in mouse models of Alzheimer's disease, co-advised by John Smith.
```

---

## Role Definitions

From `_data/roles.yaml`:

| Role Code | Display Text | Icon | Typical Use |
|-----------|-------------|------|-------------|
| `pi` | Principal Investigator | fas fa-microscope | Lab director |
| `postdoc` | Postdoctoral Researcher | fas fa-glasses | Postdoctoral fellows |
| `staff` | Staff Scientist | fas fa-user-tie | Staff scientists |
| `phd` | PhD Student | fas fa-graduation-cap | Doctoral students |
| `ms` | MS Student | fas fa-graduation-cap | Master's students |
| `undergrad` | Undergraduate Student | fas fa-user-graduate | Undergraduate researchers |
| `highschool` | High School Student | fas fa-bus-school | High school interns |
| `programmer` | Programmer | fas fa-code-compare | Software engineers, scientific programmers |
| `ra` | Research Assistant | fas fa-code | Research assistants |
| `friends` | Friends of the Lab | fas fa-heart | Collaborators, advisory board |
| `alumni` | Alumni | fas fa-graduation-cap | Former members |

### Role Display Order on Team Page

Members are displayed in this order:
1. PI
2. Programmer
3. Postdoc
4. Staff
5. PhD
6. MS
7. RA
8. Undergrad
9. High School
10. Friends

Alumni are in a separate section at the bottom.

---

## Bio Patterns by Role

### PI (Principal Investigator)

**Length**: 250-300 words
**Voice**: Can start first person, then third person for "Bio" section
**Tone**: Professional, comprehensive

**Structure**:
1. Opening (optional first person intro)
2. Current position and institution
3. PhD institution and advisors (with hyperlinks)
4. Research philosophy and approach
5. Notable work and achievements
6. Prior positions
7. Awards and honors

**Example** (from Talmo Pereira):
```markdown
Hi, I'm Talmo. I run a lab...

**Bio**: Talmo is an Assistant Professor at the Salk Institute for Biological Studies. He received his PhD in Neuroscience from Princeton University, co-advised by [Mala Murthy](https://murthylab.princeton.edu) and [Joshua Shaevitz](https://shaevitzlab.princeton.edu). His work focuses on...

Prior to Salk, he was a postdoctoral fellow at...

He has been awarded the NSF Graduate Research Fellowship...
```

**Key elements**:
- Hyperlink to advisor labs
- Mention major fellowships/awards
- Include media coverage if applicable
- Research philosophy statement
- Prior positions with details

---

### PhD Student

**Length**: 100-150 words
**Voice**: Third person
**Tone**: Professional, academic

**Structure**:
1. Opening sentence with name, role, join date
2. Education background (BS, MS institutions and majors)
3. Current research focus (1-2 sentences)
4. Co-advisor if applicable
5. Prior research experience if notable

**Example** (from Scott Yang):
```markdown
Scott is a PhD student who joined the lab in May 2025. He received his BS in Data Science and his MS in Bioengineering at UC San Diego. His research focuses on developing virtual neuroscience environments and embodied simulations for studying neural circuits underlying behavior.
```

**Key elements**:
- Join date specific (month and year)
- Degrees and institutions
- Research interests concise
- Co-advisors mentioned if applicable

---

### MS Student

**Length**: 80-120 words
**Voice**: Third person
**Tone**: Professional

**Structure**: Similar to PhD but slightly more concise

**Example** (synthesized):
```markdown
Emily is a Master's student who joined the lab in June 2023. She is pursuing her MS in Computer Science at UC San Diego with a focus on machine learning. She is working on improving pose estimation algorithms for multi-animal tracking. Previously, she received her BS in Electrical Engineering from MIT.
```

---

### Undergraduate Student

**Length**: 80-100 words
**Voice**: Third person
**Tone**: Professional

**Structure**:
1. Name, year/major, institution
2. Join date
3. Current work focus
4. Prior research experience if applicable
5. Awards/programs (TRELS, Meyerhoff, etc.) if applicable

**Example** (from Joshua Park):
```markdown
Joshua is a fourth-year at UCSD, double majoring in Computer Engineering and Neurobiology. He joined the lab in December 2024. He is working on virtual animal modeling for neuroscience research. He was a 2023 UCSD URS Eureka! Summer Fellow in the Chalasani Lab where he studied C. elegans neurophysiology and behavior.
```

**Key elements**:
- Year and major
- Join month
- Clear research focus
- Prior experience highlights programs/fellowships

---

### Programmer / Staff / RA

**Length**: 100-150 words
**Voice**: Third person
**Tone**: Professional, highlight technical skills

**Structure**:
1. Name, role, join date
2. Education (BS, MS) with specializations
3. Current projects/focus
4. Prior work experience (industry or academic)
5. Technical expertise if relevant
6. Joint appointments if applicable

**Example** (from Elizabeth Berrigan):
```markdown
Elizabeth is a scientific programmer who joined the lab in January 2024 as a joint appointment with Wolfgang Busch's Plant Molecular and Cellular Biology Laboratory. She received her MS in Physics from the University of Chicago. She is working on extending SLEAP to plant phenotyping applications and developing computer vision methods for root architecture analysis.
```

**Key elements**:
- Prior work experience emphasized
- Technical skills/domains
- Specific projects
- Joint appointments highlighted

---

### Alumni (Current/Recent)

**Length**: 50-250 words depending on tenure and accomplishments
**Voice**: Third person
**Tone**: Professional, achievement-oriented

**Structure**:
1. Name, role during tenure, dates
2. Institutional affiliation
3. What they worked on
4. Who mentored them (for short-term)
5. Achievements and honors
6. Prior experience if notable

**Summer Intern Example** (from Papa Manu):
```markdown
Papa Manu was an undergraduate summer research intern in 2025. He is an undergraduate at the University of Maryland, Baltimore County (UMBC) where he is a Meyerhoff Scholar studying Computer Science. He worked on improving computer vision algorithms for pose estimation through geometric invariance, mentored by Divya Murali. He has conducted research at NASA on the Wildfire Digital Twin project, and at the National Science Foundation on parallel algorithms for high-dimensional clustering, where he achieved a 96x speedup for K-means algorithms. He won the Award for Best Computer Science Oral Presentation at the Emerging Researchers National Conference in 2024.
```

**Longer Tenure Example** (from Aaditya Prasad):
```markdown
Aadi was an undergraduate research intern and later a Master's student in the lab from 2021 to 2024. He received his BS in Bioinformatics and his MS in Bioengineering at UC San Diego. His research focused on developing tools for plant phenotyping and improving SLEAP's multi-animal tracking capabilities, co-advised by Uri Manor. He contributed to several major software releases and published work on deep learning for behavioral analysis. He is now pursuing a PhD in Brain and Cognitive Sciences at MIT.
```

**Key elements**:
- Mention mentors for short-term positions
- Highlight achievements and honors
- Include "Next:" info if available
- Scale detail to tenure length

---

## Alumni Handling

### Marking Member as Alumni

#### In Member File

Update the `role` field:
```yaml
role: alumni
```

Keep all other information (links, image, etc.) and update bio to past tense where appropriate.

#### In team/index.md

Add entry to Alumni section in reverse chronological order:

**Format**:
```markdown
- YEAR: [**Full Name**](/members/firstname-lastname.html) (Role Description). **Next:** Next position.
```

**Examples**:
```markdown
- 2025: [**Papa Manu**](/members/papa-manu.html) (Undergraduate Summer Research Intern).
- 2024: [**Aaditya Prasad**](/members/aaditya-prasad.html) (Undergraduate Research Intern, Master's Student). **Next:** MIT pursuing a PhD in Brain and Cognitive Sciences.
- 2023: [**Sean Afshar**](/members/sean-afshar.html) (Research Assistant). **Next:** Princeton pursuing a PhD in Neuroscience.
```

### Alumni List Formatting Rules

1. **Year**: Year they left (most recent first)
2. **Name**: Bold, linked to member page
3. **Role Description**: Parentheses, descriptive (not just role code)
   - Good: "Undergraduate Research Intern, Master's Student"
   - Good: "Software Engineer"
   - Bad: "undergrad, ms"
4. **Next Position**: Optional, use `**Next:**` followed by description
   - Include institution and degree program if pursuing further education
   - Include company name if going to industry
   - Omit if unknown or not applicable

### Multiple Stints

If someone returns for multiple separate periods:
```markdown
- 2023, 2024: [**Will Knickrehm**](/members/will-knickrehm.html) (High School Summer Research Intern).
```

---

## Image Specifications

### Technical Requirements

| Property | Specification |
|----------|---------------|
| **Format** | JPG (preferred) or PNG |
| **File size** | 100-250 KB (optimized for web) |
| **Dimensions** | 400x400 to 600x600 pixels recommended |
| **Minimum** | 300x300 pixels |
| **Aspect ratio** | Square (1:1) or nearly square (4:5, 5:4) |
| **Color space** | RGB |
| **Resolution** | 72-150 DPI (web resolution) |

### File Location and Naming

**Directory**: `images/` (in site root)
**Naming**: `firstname-lastname.jpg` (kebab-case, lowercase)
**Reference in frontmatter**: `image: images/firstname-lastname.jpg`

**Examples**:
- `images/talmo-pereira-2024-09-alt@1x.png` (versioned)
- `images/scott-yang.jpg` (simple)
- `images/papa-manu.jpg` (simple)

### Display Behavior

- Rendered in portrait component at ~100-150px width
- Displayed as square crop
- Has lazy loading
- Fallback to `images/placeholder.svg` if image missing
- Clickable to member detail page

### Optimization Tools

**macOS (sips)**:
```bash
# Resize to 500px max dimension
sips -Z 500 input.jpg --out output.jpg

# Convert PNG to JPG
sips -s format jpeg input.png --out output.jpg

# Set quality
sips -s formatOptions 85 input.jpg --out output.jpg
```

**ImageMagick (convert)**:
```bash
# Resize and set quality
convert input.jpg -resize 500x500^ -quality 85 output.jpg

# Make square crop
convert input.jpg -resize 500x500^ -gravity center -extent 500x500 output.jpg
```

**Online tools** (if no command-line tools available):
- TinyJPG / TinyPNG for compression
- Squoosh.app for resizing and optimization

---

## Link Formats

### Supported Link Types

The `links` frontmatter field supports these keys:

| Key | Example Value | Display |
|-----|---------------|---------|
| `email` | `name@domain.com` | Email icon + mailto link |
| `github` | `username` | GitHub icon + link to github.com/username |
| `linkedin` | `profile-id` | LinkedIn icon + link to linkedin.com/in/profile-id |
| `twitter` | `handle` | Twitter/X icon + link to twitter.com/handle |
| `home-page` | `https://example.com` | Home icon + link |
| `orcid` | `0000-0000-0000-0000` | ORCID icon + link |

### Format Examples

**Minimal** (email only):
```yaml
links:
  email: jane@salk.edu
```

**Full** (multiple links):
```yaml
links:
  email: jane@salk.edu
  github: janedoe
  linkedin: jane-doe-researcher
  home-page: https://janedoe.com
  twitter: janedoe
```

**No links**:
```yaml
# Omit the links field entirely
```

### Link Display

Links are rendered as icon buttons on:
- Team page portraits (below name)
- Member detail pages

Icons are from Font Awesome and match the service.

---

## Jekyll Integration

### How Member Files Are Processed

1. Jekyll reads all `_members/*.md` files
2. Parses YAML frontmatter into data
3. Generates collection at `site.members`
4. Creates individual pages at `/members/firstname-lastname.html`

### Team Page Display

File: `team/index.md`

Uses Jekyll includes to filter and display by role:

```liquid
{% include list.html data="members" component="portrait" filters="role: phd" %}
```

This:
- Loads all members from `site.members`
- Filters to those with `role: phd`
- Renders each using `portrait` component
- Displays in grid layout

### Portrait Component

Renders each member card with:
- Profile image (or placeholder)
- Name (linked to detail page)
- Role icon and text
- Description
- Link icons

### Member Detail Pages

Auto-generated at `/members/[slug].html` with:
- Large profile image
- Full name
- Role badge
- Description
- Bio content (rendered from markdown)
- Link buttons
- Related content (if configured)

---

## Common Patterns and Best Practices

### Education Formatting

**Single degree**:
```markdown
She received her BS in Computer Science from MIT.
```

**Multiple degrees**:
```markdown
He received his BS in Neuroscience from UCLA and his MS in Bioengineering from UC San Diego.
```

**In progress**:
```markdown
She is pursuing her PhD in Cognitive Science at UCSD.
```

**With honors/specialization**:
```markdown
He received his BS in Biology with a specialization in Bioinformatics from UCSD.
```

### Join Date Formatting

**Standard**:
```markdown
She joined the lab in September 2023.
```

**With initial role**:
```markdown
He joined the lab as an undergraduate researcher in January 2024.
```

**Transition**:
```markdown
She joined the lab in 2022 and began her PhD in 2024.
```

### Co-Advisor Formatting

**With link**:
```markdown
...co-advised by [Uri Manor](https://manor-lab.org).
```

**Without link**:
```markdown
...co-advised by Uri Manor.
```

**Joint appointment**:
```markdown
...jointly with the [Wolfgang Busch Lab](https://buschlab.org).
```

### Research Description

**Keep concise** (1-2 sentences max):
```markdown
Her research focuses on developing deep learning methods for pose estimation in freely moving animals. She is particularly interested in multi-animal tracking in complex social behaviors.
```

**Mention specific projects**:
```markdown
He is working on extending SLEAP to plant phenotyping applications and developing automated root architecture analysis tools.
```

**Avoid excessive detail**:
```markdown
❌ She is developing a novel convolutional neural network architecture based on ResNet-50 with custom attention mechanisms that can process video at 30 fps while maintaining 95% accuracy on keypoint detection across 14 different body parts in mice under various lighting conditions...

✓ She is developing deep learning methods for pose estimation in mice.
```

### Awards and Fellowships

**Mention notable ones**:
```markdown
She is a Meyerhoff Scholar studying Computer Science.
He was awarded the NSF Graduate Research Fellowship.
She was a 2023 UCSD URS Eureka! Summer Fellow.
```

**Don't list every award**:
```markdown
❌ He received the Dean's List Award (2020, 2021, 2022), the Undergraduate Research Award (2021), the Best Poster Award at Campus Symposium (2022), the...

✓ He received his BS with honors from UCSD.
```

---

## Troubleshooting

### YAML Frontmatter Errors

**Colons in values**: Wrap in quotes
```yaml
❌ description: Co-PI: Plant Biology
✓ description: "Co-PI: Plant Biology"
```

**Line breaks**: Use YAML multiline
```yaml
❌ description: This is a very long description that goes on multiple
lines
✓ description: >
    This is a very long description
    that goes on multiple lines
```

**Special characters**: Escape or quote
```yaml
✓ name: "O'Brien, Jane"
```

### Image Issues

**Image too large**: Optimize with sips/convert (see Image Specifications)

**Wrong aspect ratio**: Crop to square before adding

**Image not displaying**: Check path and filename match exactly

**Image too small/pixelated**: Use at least 300x300px source

### Bio Writing Issues

**Too long**: Edit down to essential information only

**Wrong voice**: Convert to third person throughout

**Too casual**: Use professional academic tone

**Missing key info**: Ensure education, join date, research focus are all present

---

## Validation Checklist

Before finalizing a new member, verify:

### File Structure
- [ ] Filename follows convention: `firstname-lastname.md`
- [ ] File is in `_members/` directory
- [ ] YAML frontmatter is valid (use parser/linter)
- [ ] All required fields present: `name`, `image`, `role`

### Content
- [ ] Name is correct and complete
- [ ] Role is valid (check against roles.yaml)
- [ ] Bio uses third-person voice
- [ ] Bio is appropriate length for role
- [ ] Join date mentioned (month and year)
- [ ] Education background included
- [ ] Research focus described (if applicable)

### Images
- [ ] Image file exists at specified path
- [ ] Filename follows convention
- [ ] Image is optimized (<500 KB)
- [ ] Image has reasonable dimensions (>300px)

### Links
- [ ] All link keys are valid/supported
- [ ] Email addresses are correct
- [ ] GitHub/LinkedIn usernames are correct
- [ ] URLs are complete and working

### Alumni (if applicable)
- [ ] Role set to `alumni` in frontmatter
- [ ] Entry added to team/index.md alumni section
- [ ] Year is correct
- [ ] Role description is accurate
- [ ] "Next:" information included if known

### Display
- [ ] Member appears on team page in correct section
- [ ] Portrait displays correctly
- [ ] Links work
- [ ] Detail page generates correctly
- [ ] No formatting errors or broken markdown
