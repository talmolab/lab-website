# Add Lab Member - Usage Examples

Concrete examples showing the interactive workflow for different scenarios.

---

## Example 1: Adding a New PhD Student

**User request**:
> "Can you add our new PhD student Jane Doe to the website?"

**Workflow**:

### Step 1: Gather Information

**Claude asks**:
> I'll help you add Jane Doe to the website. Let me gather some information first.
>
> Questions:
> 1. What is Jane's role? (Options: phd, ms, undergrad, etc.)
> 2. Do you have her email address?
> 3. Does she have a GitHub or LinkedIn profile?
> 4. When did she join the lab?

**User provides**:
- Role: phd
- Email: jane.doe@salk.edu
- Joined: September 2024

### Step 2: Web Research

**Claude searches**:
- "Jane Doe LinkedIn neuroscience"
- "Jane Doe GitHub salk"
- "Jane Doe UCSD graduate"

**Claude finds**:
- LinkedIn: Education at MIT (BS Neuroscience 2022)
- GitHub username: jdoe
- Current: PhD student at Salk/UCSD

**Claude confirms**:
> I found the following information about Jane:
> - BS in Neuroscience from MIT (2022)
> - GitHub username: jdoe
> - Currently PhD student at UCSD/Salk
>
> Is this correct? Anything to add or correct?

**User confirms**: "Yes, that's right. She's working on behavioral analysis in mouse models."

### Step 3: Draft Bio

**Claude drafts**:
```markdown
Jane is a PhD student who joined the lab in September 2024. She received her BS in Neuroscience from MIT. Her research focuses on developing computational methods for behavioral analysis in mouse models. She is interested in applying machine learning to understand complex social behaviors.
```

**Claude asks**:
> Here's a draft bio for Jane. Would you like me to make any changes?

**User**: "Looks good!"

### Step 4: Handle Image

**Claude asks**:
> Do you have a profile photo for Jane? If so, please provide the file path.

**User provides**: `/Users/talmo/Downloads/jane_doe_photo.jpg`

**Claude checks image**:
```bash
sips -g pixelWidth -g pixelHeight -g format /Users/talmo/Downloads/jane_doe_photo.jpg
```

**Output**: 2000x2000 pixels, JPEG, 1.2 MB

**Claude offers**:
> The image is quite large (1.2 MB, 2000x2000px). Would you like me to optimize it for the web? (Target: ~200 KB, 500x500px)

**User**: "Yes, please."

**Claude optimizes**:
```bash
sips -Z 500 -s formatOptions 85 /Users/talmo/Downloads/jane_doe_photo.jpg --out images/jane-doe.jpg
```

### Step 5: Generate Member File

**Claude creates** `_members/jane-doe.md`:
```markdown
---
name: Jane Doe
image: images/jane-doe.jpg
role: phd
description: PhD Student
links:
  email: jane.doe@salk.edu
  github: jdoe
---

Jane is a PhD student who joined the lab in September 2024. She received her BS in Neuroscience from MIT. Her research focuses on developing computational methods for behavioral analysis in mouse models. She is interested in applying machine learning to understand complex social behaviors.
```

### Step 6: Validate and Present

**Claude validates**:
- ✓ File created at `_members/jane-doe.md`
- ✓ YAML frontmatter valid
- ✓ Role is valid (phd)
- ✓ Image optimized and saved
- ✓ Bio is third person
- ✓ Bio is appropriate length (86 words)

**Claude presents**:
> ✓ Created member profile for Jane Doe
> ✓ File: _members/jane-doe.md
> ✓ Role: PhD Student
> ✓ Image: images/jane-doe.jpg (optimized from 1.2 MB to 187 KB)
> ✓ Links: email, GitHub
>
> Bio preview:
> "Jane is a PhD student who joined the lab in September 2024. She received her BS in Neuroscience from MIT..."
>
> Would you like me to commit these changes?

**User**: "Yes"

**Claude commits**:
```bash
git add _members/jane-doe.md images/jane-doe.jpg
git commit -m "Add Jane Doe (PhD student)"
```

---

## Example 2: Adding Summer Intern Who Recently Left

**User request**:
> "Add Michael Chen - he was a summer intern this year and just finished."

**Workflow**:

### Step 1: Gather Information

**Claude asks**:
> I'll help you add Michael Chen. Since he's already finished, I'll set him up as an alumni member.
>
> Questions:
> 1. What was his role? (undergrad, highschool)
> 2. Which institution is he from?
> 3. What did he work on?
> 4. Who mentored him?
> 5. Where is he going next (if known)?

**User provides**:
- Role: undergrad
- Institution: Columbia University
- Project: Virtual animal simulations
- Mentor: Jason Foat
- Next: Continuing undergrad at Columbia

### Step 2: Web Research

**Claude searches**:
- "Michael Chen Columbia University computer science"
- "Michael Chen LinkedIn Columbia"

**Claude finds**:
- Undergrad at Columbia studying CS
- No GitHub found

**Claude confirms**:
> Found: Michael is an undergraduate at Columbia studying Computer Science. No GitHub profile found. Is there anything else to add?

**User**: "That's all I have."

### Step 3: Draft Bio

**Claude drafts**:
```markdown
Michael was an undergraduate summer research intern in 2025. He is studying Computer Science at Columbia University. He worked on virtual animal simulations and neuromechanical modeling, mentored by Jason Foat. His work focused on developing realistic physics simulations for studying neural circuit dynamics in embodied agents.
```

**Claude asks**:
> Here's a draft bio. Does this accurately describe his work?

**User**: "Perfect!"

### Step 4: Handle Image

**Claude asks**:
> Do you have a profile photo for Michael?

**User**: "No, we didn't get one."

**Claude notes**:
> No problem. I'll set up his profile with a placeholder image. You can add a photo later if needed.

### Step 5: Generate Member File

**Claude creates** `_members/michael-chen.md`:
```markdown
---
name: Michael Chen
image: images/placeholder.svg
role: alumni
description: Undergraduate Summer Research Intern
---

Michael was an undergraduate summer research intern in 2025. He is studying Computer Science at Columbia University. He worked on virtual animal simulations and neuromechanical modeling, mentored by Jason Foat. His work focused on developing realistic physics simulations for studying neural circuit dynamics in embodied agents.
```

### Step 6: Update Alumni List

**Claude reads** `team/index.md` alumni section.

**Claude adds entry** at the top (2025):
```markdown
- 2025: [**Michael Chen**](/members/michael-chen.html) (Undergraduate Summer Research Intern).
```

### Step 7: Validate and Present

**Claude presents**:
> ✓ Created member profile for Michael Chen
> ✓ File: _members/michael-chen.md
> ✓ Role: Alumni (Undergraduate Summer Research Intern)
> ✓ Image: Placeholder (can add photo later)
> ✓ Updated alumni list in team/index.md
>
> Since Michael has already left, I've marked him as alumni and added him to the 2025 alumni list.
>
> Would you like me to commit these changes?

---

## Example 3: Adding Staff Programmer with Industry Background

**User request**:
> "We need to add Dr. Sarah Martinez, our new scientific programmer who just started."

**Workflow**:

### Step 1: Gather Information

**Claude asks**:
> I'll help you add Dr. Sarah Martinez.
>
> Questions:
> 1. When did she join?
> 2. Do you have her email?
> 3. Any other contact info (GitHub, LinkedIn, website)?

**User provides**:
- Joined: January 2025
- Email: smartinez@salk.edu
- LinkedIn: sarah-martinez-phd

### Step 2: Web Research

**Claude searches extensively**:
- "Sarah Martinez PhD scientific programmer"
- "Sarah Martinez LinkedIn scientific programmer neuroscience"
- "Sarah Martinez GitHub programmer"

**Claude finds**:
- LinkedIn: PhD in Computer Science from Stanford (2020)
- Previous: Software Engineer at Google (3 years)
- GitHub: smartinez
- Research interests: Computational biology, computer vision

**Claude presents findings**:
> I found extensive information about Dr. Martinez:
> - PhD in Computer Science from Stanford (2020)
> - Previously: Software Engineer at Google (2020-2023)
> - GitHub username: smartinez
> - Research interests: Computational biology, computer vision
> - Published work on deep learning for medical imaging
>
> Is this the right person? Anything to add about her role or projects here?

**User confirms**: "Yes! She'll be working on SLEAP infrastructure and cloud deployment."

### Step 3: Draft Bio

**Claude drafts** (comprehensive bio for staff):
```markdown
Sarah is a scientific programmer who joined the lab in January 2025. She received her PhD in Computer Science from Stanford University where she developed deep learning methods for medical image analysis. Prior to joining, she worked as a software engineer at Google for three years, focusing on large-scale distributed systems and machine learning infrastructure. At Salk, she is working on cloud deployment and infrastructure for SLEAP, as well as developing scalable computer vision pipelines for pose estimation. She brings extensive experience in Python, C++, and cloud platforms including AWS and Google Cloud.
```

**Claude asks**:
> Here's a detailed bio highlighting her technical background and prior experience. Would you like me to make any adjustments?

**User**: "Great, but remove the mention of specific programming languages - too much detail."

**Claude revises**:
```markdown
Sarah is a scientific programmer who joined the lab in January 2025. She received her PhD in Computer Science from Stanford University where she developed deep learning methods for medical image analysis. Prior to joining, she worked as a software engineer at Google for three years, focusing on large-scale distributed systems and machine learning infrastructure. At Salk, she is working on cloud deployment and infrastructure for SLEAP, as well as developing scalable computer vision pipelines for pose estimation.
```

### Step 4: Handle Image

**User provides**: Path to image

**Claude optimizes** and saves as `images/sarah-martinez.jpg`

### Step 5: Generate Member File

**Claude creates** complete profile with all links.

### Step 6: Present Summary

**Claude presents**:
> ✓ Created member profile for Dr. Sarah Martinez
> ✓ File: _members/sarah-martinez.md
> ✓ Role: Programmer
> ✓ Image: images/sarah-martinez.jpg
> ✓ Links: email, GitHub, LinkedIn
>
> Bio emphasizes her PhD, industry experience, and current SLEAP work.

---

## Example 4: Updating Existing Member's Role (MS → PhD)

**User request**:
> "Alex Kim just advanced to PhD candidacy. Can you update their profile?"

**Workflow**:

**Claude checks** existing file:
```bash
ls _members/ | grep -i alex
```

**Finds**: `_members/alex-kim.md`

**Claude reads** current file:
```yaml
---
name: Alex Kim
image: images/alex-kim.jpg
role: ms
description: MS Student
...
```

**Claude asks**:
> I found Alex's current profile where they're listed as an MS student. Should I:
> 1. Update the role to PhD
> 2. Update the description
> 3. Update the bio to reflect the transition
>
> Do you want me to proceed?

**User**: "Yes, update everything. They advanced in May 2025."

**Claude updates** `_members/alex-kim.md`:

**Frontmatter**:
```yaml
---
name: Alex Kim
image: images/alex-kim.jpg
role: phd
description: PhD Student
links:
  ...
---
```

**Bio** (updated):
```markdown
Alex is a PhD student who joined the lab in September 2022, initially as a Master's student and advancing to PhD candidacy in May 2025. They received their BS in Bioengineering from UC Berkeley. Their research focuses on...
```

**Claude presents**:
> ✓ Updated Alex Kim's profile
> ✓ Role: MS Student → PhD Student
> ✓ Bio updated to mention advancement to candidacy
>
> Changes made:
> - Frontmatter role: ms → phd
> - Description: MS Student → PhD Student
> - Bio now mentions "advancing to PhD candidacy in May 2025"
>
> Would you like me to commit this update?

---

## Example 5: Adding Member with Co-Advisor

**User request**:
> "Add Emma Wilson, new postdoc co-advised with Tom Albright."

**Workflow**:

### Steps 1-2: Gather Info and Research

**Claude gathers**: Name, role (postdoc), join date, co-advisor (Tom Albright)

**Claude researches**: Finds PhD from Harvard, neuroscience background

### Step 3: Draft Bio

**Claude drafts** (with co-advisor emphasis):
```markdown
Emma is a postdoctoral researcher who joined the lab in November 2024, co-advised by Tom Albright. She received her PhD in Neuroscience from Harvard University where she studied visual processing in primate cortex. Her research focuses on understanding the neural mechanisms of visual perception using computational modeling and machine learning approaches. She is developing methods to integrate behavioral analysis with neural recordings to study decision-making processes.
```

**Claude notes**:
> I've mentioned the co-advising relationship with Tom Albright in the first sentence. Would you like me to add a hyperlink to his lab page?

**User**: "Yes, please."

**Claude revises**:
```markdown
Emma is a postdoctoral researcher who joined the lab in November 2024, co-advised by [Tom Albright](https://www.salk.edu/scientist/thomas-albright/). She received her PhD...
```

### Step 4-6: Complete Profile

**Claude creates** complete profile highlighting co-advised status.

---

## Example 6: Adding Member with Minimal Public Info

**User request**:
> "Add David Park, new undergraduate who just joined. He doesn't have much online presence."

**Workflow**:

### Step 1: Gather Information

**Claude asks** standard questions.

**User provides**: Basic info (name, role, join date)

### Step 2: Web Research

**Claude searches** but finds nothing substantial:
> I couldn't find much public information about David. Could you provide:
> 1. His year and major?
> 2. What is he working on?
> 3. Any prior research experience?
> 4. Institution (UCSD)?

**User provides directly**:
- Third-year, majoring in Data Science at UCSD
- Working on pose estimation algorithms
- No prior research experience
- No social media/GitHub

### Step 3: Draft Simple Bio

**Claude drafts** minimal but complete bio:
```markdown
David is a third-year undergraduate at UC San Diego majoring in Data Science. He joined the lab in October 2024 and is working on improving pose estimation algorithms for multi-animal tracking.
```

**Claude notes**:
> Since there's limited background information, I've kept the bio concise focusing on his current work. We can expand it later as he develops his research.

### Step 4: Complete with Placeholder Image

**Claude creates** profile with placeholder image and minimal links (just email if provided).

---

## Example 7: Adding Multiple Summer Interns at Once

**User request**:
> "We have 3 summer interns finishing this week. Can you add them all as alumni?"

**Workflow**:

**Claude asks**:
> I'll add all three summer interns as alumni. For each person, I'll need:
> 1. Full name
> 2. Role (undergrad or highschool)
> 3. Institution
> 4. Brief description of their work
> 5. Who mentored them
> 6. Photo (optional)
>
> Let's start with the first intern.

**User provides** information for each one by one.

**Claude processes** each intern:
1. Creates member file with role: alumni
2. Writes concise bio (50-80 words each)
3. Adds to team/index.md alumni list

**Claude presents summary**:
> ✓ Added 3 summer intern alumni:
>
> 1. **John Smith** (High School Intern)
>    - File: _members/john-smith.md
>    - Mentored by Elizabeth Berrigan
>    - Worked on plant phenotyping
>
> 2. **Maria Garcia** (Undergraduate Intern)
>    - File: _members/maria-garcia.md
>    - Mentored by Divya Murali
>    - Worked on pose estimation
>
> 3. **Kevin Lee** (Undergraduate Intern)
>    - File: _members/kevin-lee.md
>    - Mentored by Scott Yang
>    - Worked on virtual environments
>
> All three added to 2025 alumni list in team/index.md.
>
> Would you like me to commit all these additions?

---

## Example 8: Handling Image Quality Issues

**User request**:
> "Add Lisa Wong, new RA. Here's her photo."

**User provides**: Low-resolution image (150x150 pixels, 12 KB)

**Claude checks**:
```bash
sips -g pixelWidth -g pixelHeight images/lisa-wong.jpg
```

**Output**: 150x150 pixels, JPEG

**Claude warns**:
> The provided image is quite small (150x150px). This may appear pixelated on the website.
>
> Options:
> 1. Use this image for now (it will work but may not look sharp)
> 2. Request a higher resolution photo (recommended: at least 300x300px)
> 3. Use placeholder and add proper photo later
>
> What would you prefer?

**User**: "Use it for now, we'll get a better photo later."

**Claude proceeds** with note in summary:
> ⚠ Note: Profile image is low resolution (150x150px). Consider updating with higher quality image (300x300px or larger) for better display.

---

## Tips from Examples

### Best Practices

1. **Always research first**: Web search can find 80% of needed info
2. **Confirm findings**: Always verify with user before proceeding
3. **Draft and revise**: Show bio draft and refine based on feedback
4. **Handle images carefully**: Check quality before adding
5. **Be flexible**: Work with whatever information is available

### Common Patterns

**New students**: Usually have LinkedIn with education history
**Staff/postdocs**: Often have comprehensive online presence
**Summer interns**: Minimal online info, rely more on user input
**Alumni**: Same as active members but mark role appropriately

### User Interaction

**Ask follow-up questions** when:
- Web research finds multiple possibilities
- Information seems incomplete
- Details need clarification

**Present options** when:
- Image quality is questionable
- Bio could go multiple directions
- Role/status is ambiguous

**Provide summaries** at:
- End of web research (show what was found)
- After bio draft (let user review)
- Final step (complete validation)

### Edge Cases

**No online presence**: Draft minimal bio from user-provided info
**Conflicting information**: Ask user to clarify
**Missing image**: Use placeholder, note in summary
**Unusual role**: Ask user to explain or choose closest match
**Privacy concerns**: Use minimal bio, only include what user provides
