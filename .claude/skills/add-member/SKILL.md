---
name: add-member
description: Interactive guide for adding new lab members to the website. Gathers information via web research, helps write appropriate bios, optimizes images, and generates properly formatted member files. Use when adding new team members, updating member info, or marking members as alumni.
version: 1.0.0
allowed-tools: Read, Write, Edit, Bash, WebSearch, AskUserQuestion, Glob
---

# Add Lab Member

This skill guides you through adding a new lab member to the website with proper formatting, bio writing, and image handling.

## When to Use This Skill

Use this skill when:
- "Add a new lab member"
- "Create a profile for [name]"
- "Add [name] to the team page"
- "Update [name]'s role"
- "Mark [name] as alumni"
- Any request involving adding or updating team member profiles

## Interactive Workflow

### Step 1: Gather Basic Information

Ask the user for essential details:

**Required**:
- Full name
- Role category — one of:
  `pi`, `staff-scientist`, `postdoc`, `scientific-programmer`, `software-engineer`,
  `bioinformatics-analyst`, `phd-student`, `phd-rotation`, `ms-student`,
  `research-assistant`, `undergrad-intern`, `undergrad-summer-intern`,
  `highschool-intern`, `highschool-summer-intern`, `friend`
- Start date (`YYYY-MM`, or `YYYY` if the month genuinely is not known)

**Optional** (we'll research if not provided):
- Email address
- GitHub username
- LinkedIn profile
- Personal website
- Current institution/program (if student)

**Use AskUserQuestion** to collect this information if not provided in the initial request.

### Step 2: Web Research

Conduct web research to gather background information:

1. **Search LinkedIn** for education and work history
   - Query: "[Full Name] LinkedIn [institution if known]"
   - Extract: degrees, institutions, prior positions

2. **Search GitHub** for username and projects
   - Query: "[Full Name] GitHub [email domain if known]"
   - Extract: username, notable repositories

3. **Search institutional pages** for bio information
   - Query: "[Full Name] [institution] neuroscience/biology/computer science"
   - Extract: research interests, current work

4. **Search publications** if applicable (PhD/postdoc)
   - Query: "[Full Name] [institution] publications"
   - Extract: research areas

**Present findings to user**:
- Show what you found
- Ask user to confirm accuracy
- Ask for clarification on anything unclear
- Request any missing critical information

### Step 3: Draft Bio

Using the gathered information and role-appropriate template:

1. **Determine bio length based on role**:
   - PI: 250-300 words (detailed)
   - PhD/Postdoc/Staff: 100-150 words
   - MS/RA/Programmer: 80-120 words
   - Undergrad: 80-100 words
   - Alumni: 50-250 words (based on tenure and achievements)

2. **Follow bio template** from templates/ directory:
   - Use third-person voice
   - Professional, academic tone
   - Include: education, join date, research focus/current work
   - Mention co-advisors if applicable
   - Highlight prior experience if relevant
   - Note awards/fellowships if notable

3. **Present draft to user**:
   - Show the drafted bio
   - Ask if they want to make any edits
   - Refine based on feedback

### Step 4: Handle Profile Image

1. **Ask user for image**:
   - "Do you have a profile photo for [name]?"
   - If yes: "Please provide the path to the image file"
   - If no: "We can use a placeholder for now and add it later"

2. **If image provided, validate and optimize**:
   - Check file size and dimensions using `file` or `sips`
   - Target specs: 100-250 KB, reasonably square aspect ratio
   - If too large (>500 KB) or wrong aspect ratio:
     - Offer to resize/optimize using scripts/optimize-image.sh
     - Use `sips` (macOS) or `convert` (ImageMagick) if available

3. **Generate image filename**:
   - Format: `firstname-lastname.jpg`
   - Ensure no spaces or special characters
   - Copy to `src/assets/people/<slug>.<ext>` (NOT `images/` — Astro's image
     pipeline needs it under `src/` to optimise and hash it)

### Step 5: Generate Member File

1. **Create filename**: `src/content/people/firstname-lastname.md`

2. **Frontmatter**:
   ```yaml
   ---
   name: "Full Name"
   image: ../../assets/people/firstname-lastname.jpg
   appointments:
     - role: [role category from the list above]
       start: "YYYY-MM"
       coAdvisor: "Name"        # only if jointly supervised
   links:
     email: "name@salk.edu"
     github: "username"
   ---
   ```

   Notes that matter:
   - **Omit `end`** for a current member. Presence of `end` is the ONLY thing that
     makes someone an alumnus — there is no `role: alumni` any more, because a
     separate flag is exactly what fell out of sync and left four people invisible
     on the old site.
   - Add `title: "..."` inside the appointment only when the lab's preferred
     wording differs from the category label (e.g. category
     `scientific-programmer`, title `Bioinformatics Analyst`). `salkTitle` exists
     for the official HR title where that differs again.
   - `image` is optional; omit it and the team page falls back to initials.

3. **Validate**: run `npx astro check`. The Zod schema rejects an unknown role, a
   malformed date, or a missing `name` — and since there is no CMS, that check is
   the only guardrail on content input.

4. **Write file** to `src/content/people/firstname-lastname.md`

### Step 6: Handle a Departure (if applicable)

Marking someone as an alumnus is now **one edit, not two**. The old flow set
`role: alumni` AND hand-added a bullet to `team/index.md`; when the second step was
forgotten, the person vanished from the site entirely — filtered off the team page
and absent from the list. That happened to four people. Nothing to forget now:

1. **Ask for**:
   - End date (`YYYY-MM`, or `YYYY`)
   - What they are doing next, if known

2. **Add `end` to their last appointment**:
   ```yaml
   appointments:
     - role: research-assistant
       start: "2024-10"
       end: "2026-03"
   next:
     org: "Stanford"
     what: "PhD in Neuroscience"     # optional
     url: "https://…"                # optional, for a company
   ```

3. **That is all.** The alumni table on `/team/` is generated from appointment
   history — years, roles and destination all derive from the fields above.
   Do NOT hand-edit any list.

4. If the departure date genuinely is not known, use `end: "unknown"`. It renders
   as `2024–?`. Do not omit `end` to avoid the question: an absent `end` means
   "still here", which is the bug this whole model removes.

### Step 7: Validate

Run validation checks:

- [ ] File exists at `src/content/people/firstname-lastname.md`
- [ ] `npx astro check` passes — this validates the schema, so it replaces
      eyeballing the YAML and checking the role by hand
- [ ] Image is under `src/assets/people/` (or omitted deliberately)
- [ ] Bio is appropriate length for role
- [ ] Bio uses third-person voice
- [ ] A departing member has `end` on their last appointment — and nothing else
- [ ] `npm run build` succeeds (the people collection is referenced by
      `reference()` from posts, so a bad slug fails the build rather than
      shipping a dead link)

### Step 8: Present Summary

Show the user what was created:

```
✓ Created member profile for [Name]
✓ File: src/content/people/firstname-lastname.md
✓ Role: [category] [+ display title, if different]
✓ Image: src/assets/people/firstname-lastname.jpg [or "none - falls back to initials"]
✓ Links: [list of included links]
[✓ Updated alumni list] [if applicable]

Bio preview:
[First 100 characters of bio]...

Would you like me to show you the full file content?
```

### Step 9: Optional Commit

Ask user if they want to commit the changes:
- If yes: Create git commit with appropriate message
- If no: Leave as unstaged changes for manual review

## Bio Writing Guidelines

### Voice and Tone
- **Always third person**: "Jane is a PhD student..." (not "I am...")
- **Professional and academic**: Formal but not stuffy
- **Factual and achievement-oriented**: Focus on credentials and work
- **Present tense for current work**: "working on", "developing", "researching"
- **Past tense for background**: "received", "worked", "joined"

### Essential Elements

**All members should include**:
1. Current role and institution
2. When they joined (month and year)
3. Education background (degree, major, institution)
4. Current research/work focus

**Additional elements by role**:

**PI**:
- PhD institution and advisors (with hyperlinks)
- Research philosophy and approach
- Notable publications or media coverage
- Prior positions
- Major awards and honors

**PhD/Postdoc**:
- Undergraduate and/or Master's institution
- Specific research interests
- Co-advisors if applicable
- Previous research experience if notable

**Staff/Programmer**:
- Prior work experience (industry or academic)
- Technical expertise and focus areas
- Projects they're working on
- Joint appointments if applicable

**Students (MS/Undergrad)**:
- Major and year
- Research interests
- Prior internships or research if applicable
- Awards/fellowships if notable

**Alumni**:
- All of above based on their role
- Mentors (especially for short-term interns)
- Achievements during time in lab
- Keep concise for summer interns (50-80 words)

### What to Avoid

- First person narrative (except possibly PI intro)
- Excessive detail about projects (keep to 1-2 sentences)
- Future tense or speculation
- Casual language or slang
- Personal information unrelated to research
- Redundancy with frontmatter (name, role already shown)

## Image Handling Details

### Preferred Specifications
- **Format**: JPG (preferred) or PNG
- **Size**: 100-250 KB for web optimization
- **Aspect ratio**: Square or nearly square (1:1 or 4:5)
- **Minimum dimensions**: 300x300 pixels
- **Recommended**: 400x400 to 600x600 pixels
- **Color**: RGB color space

### Optimization Process

If image needs optimization:

```bash
# Use the bundled script
bash .claude/skills/add-member/scripts/optimize-image.sh input.jpg output.jpg 500
```

Or manually with sips (macOS):
```bash
# Resize to 500px max dimension, maintaining aspect ratio
sips -Z 500 input.jpg --out output.jpg

# Convert PNG to JPG
sips -s format jpeg input.png --out output.jpg
```

Or with ImageMagick:
```bash
# Resize and optimize
convert input.jpg -resize 500x500^ -quality 85 output.jpg
```

### Filename Convention
- Use kebab-case: `firstname-lastname.jpg`
- No spaces, special characters, or uppercase
- Match the member file slug
- Examples: `jane-doe.jpg`, `john-smith.jpg`

## Role-Specific Notes

### Adding Alumni

When adding someone who has already left:

1. Give the appointment both `start` and `end`
2. Add `next:` if their destination is known
3. Nothing else — the alumni table derives from this

If they were only ever a brief visitor and never had a page, set `page: false`.
They still appear in the alumni table, as plain text rather than a link.

### Handling Co-Advisors

When member has co-advisor:

1. Set `coAdvisor: "Name"` on the appointment — it is structured, so it renders
   on the member page without depending on the bio wording
2. Optionally also mention it in the bio with a hyperlink
3. Co-advisors are per-appointment: someone can change advisor on promotion

### Joint Appointments

When member has joint affiliation:

1. Mention in bio: "jointly with the [Lab Name]"
2. Include hyperlink to other lab if available
3. Note collaborating PIs clearly

### Students Transitioning Roles

When student moves from undergrad → MS → PhD:

1. Create a new file? **No** — keep the same file.
2. **Close the old appointment and append a new one.** Do not overwrite the role;
   the transition is the information:
   ```yaml
   appointments:
     - role: undergrad-intern
       start: "2021-11"
       end: "2022-11"
     - role: ms-student
       start: "2022-11"
   ```
3. Update the bio to reflect the new status.

This is what makes the alumni table able to say `2021–2024` with
`Undergraduate Research Intern, Master's Student`, and to tell that apart from a
repeat intern who did two separate summers (`2023, 2024`). A run is treated as
contiguous when an appointment has no `end` or the next has no `start`, so if you
genuinely do not know the handover date, leave both blank rather than inventing one.

### Summer Interns

Short-term members (2-3 months):

1. **While active**: Add with role `undergrad` or `highschool`
2. **When leaving**: Change to `role: alumni`
3. **Bio**: Can be brief (50-80 words) but highlight:
   - Institution and program
   - What they worked on
   - Who mentored them
   - Any notable achievements

## Error Handling

**If web search finds nothing**:
- Ask user to provide information directly
- Offer to draft minimal bio and let them expand

**If image is wrong format/size**:
- Offer to optimize using provided tools
- If tools not available, provide manual instructions
- Worst case: use placeholder and note in summary

**If unsure about role**:
- Present role options from the `ROLE_ORDER` enum in `src/content.config.ts`
  (the old `_data/roles.yaml` is gone)
- Use AskUserQuestion to clarify

**If duplicate member exists**:
- Check if it's an update vs new member
- Ask user if they want to update existing or create new

## Validation Checklist

Before finalizing, verify:

- [ ] Full name matches across filename, frontmatter, and bio
- [ ] Role is valid (one of: pi, postdoc, staff, phd, ms, ra, programmer, undergrad, highschool, alumni)
- [ ] Image filename follows convention (kebab-case, .jpg)
- [ ] Bio is third person throughout
- [ ] Bio length appropriate for role (see guidelines)
- [ ] Join date mentioned in bio (month and year)
- [ ] Education background included
- [ ] All links are properly formatted
- [ ] YAML frontmatter is valid (test with parser)
- [ ] A departure is expressed ONLY as `end` on the last appointment —
      no list anywhere needs editing
- [ ] No trailing whitespace or formatting issues

## See Also

- [reference.md](reference.md) - Detailed documentation on member file format and patterns
- [examples.md](examples.md) - Example workflows for different scenarios
- [templates/](templates/) - Bio templates for each role type
