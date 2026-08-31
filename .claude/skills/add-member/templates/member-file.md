# Member File Template

Files live in `src/content/people/<firstname-lastname>.md` and are validated by the
`people` collection schema in `src/content.config.ts`. Run `npx astro check` after
editing — with no CMS, that schema is the only guardrail on content input (§7).

---

## Template

```markdown
---
name: "Full Name"
image: ../../assets/people/firstname-lastname.jpg
appointments:
  - role: research-assistant
    start: "2025-01"
links:
  email: "name@salk.edu"
  github: "username"
---

[Bio text in markdown, third person]
```

---

## Field Reference

### `name` (required)
Full preferred name as it should appear. Quote it.

### `image` (optional)
Path **relative to the content file**, pointing into `src/assets/people/`:
`../../assets/people/<slug>.jpg`

It must be under `src/` — that is what lets Astro optimise and hash it (portraits
drop from ~500 KB to ~5 KB webp). A path into `public/` or `images/` will fail the
build. Omit the field entirely if there is no photo; the team page falls back to
the person's initials.

### `page` (optional, default `true`)
Set `page: false` for someone who should appear in the alumni table but not get
their own `/members/<slug>.html` page. Used for brief visitors with no real bio.

### `appointments` (required, at least one)
An ordered list, oldest first. **This is the whole model** — current-vs-alumni,
role history, tenure and sort order all derive from it.

| Field | Notes |
|---|---|
| `role` | Category. One of the `ROLE_ORDER` values below. Never displayed raw. |
| `title` | What the site shows, when the lab's wording beats the category label. |
| `salkTitle` | The official Salk HR title, where it differs from both. |
| `start` | `YYYY-MM`, or `YYYY` if the month is genuinely unknown. |
| `end` | Omit if still here. `"unknown"` if departed on an unrecorded date. |
| `coAdvisor` | For jointly supervised appointments. Per-appointment. |
| `note` | Free text that qualifies without naming: `"TRELS Scholar"`, `"remote"`. |

**`role` values**, most to least senior — position in this list *is* the sort rank,
so the team page never needs hand-ordering:

```
pi                        staff-scientist           postdoc
scientific-programmer     software-engineer         bioinformatics-analyst
phd-student               phd-rotation              ms-student
research-assistant        undergrad-intern          undergrad-summer-intern
highschool-intern         highschool-summer-intern  friend
```

### `next` (optional)
Where they went. Renders in the alumni table.

```yaml
next:
  org: "MIT"
  what: "PhD in Brain and Cognitive Sciences"   # optional
  url: "https://e11.bio/"                        # optional, for a company
```

### `links` (optional)
`email`, `github`, `linkedin`, `twitter`, `orcid`, `scholar`, `home-page`.
Handles and usernames, not full URLs — except `home-page`.

---

## The three rules that are easy to get wrong

**1. `end` is the only thing that marks an alumnus.** There is no `role: alumni`.
The old site had one, plus a hand-written list on the team page, and the two fell
out of sync — four people ended up filtered off the team page *and* missing from
the list, with live pages nothing linked to. Omitting `end` means "still here".
If they left and you do not know when, write `end: "unknown"`.

**2. A role change appends an appointment; it does not overwrite one.**

```yaml
# right — the transition is the information
appointments:
  - { role: undergrad-intern, start: "2021-11", end: "2022-11" }
  - { role: ms-student,       start: "2022-11", end: "2024-10" }

# wrong — silently destroys their history
appointments:
  - { role: ms-student, start: "2021-11", end: "2024-10" }
```

**3. Two bounded appointments mean two separate stints; an open boundary means one
continuous tenure.** This is how the table tells a repeat summer intern from a
promotion, and both look identical in prose:

```yaml
# Will Knickrehm — two separate summers -> renders "2023, 2024"
- { role: highschool-summer-intern, start: "2023-06", end: "2023-08" }
- { role: highschool-summer-intern, start: "2024-06", end: "2024-08" }

# Aaditya Prasad — one tenure, role changed -> renders "2021–2024"
- { role: undergrad-intern, start: "2021-11" }        # no end
- { role: ms-student,       end: "2024-10" }          # no start
```

If you do not know a handover date, leave the boundary open rather than inventing
one. An invented date is indistinguishable from a real one a week later.

---

## Complete Examples

### Current research assistant

```markdown
---
name: "Amick Licup"
image: ../../assets/people/amick-licup.jpg
appointments:
  - role: undergrad-intern
    start: "2025-01"
    end: "2025-06"
  - role: research-assistant
    start: "2025-06"
links:
  github: "alicup29"
  linkedin: "amick-licup"
---

Amick is a research assistant who joined the lab in January 2025. He received his
B.S. in Computer Science with a specialization in Bioinformatics from UC San Diego.
He is working on developing cloud-based infrastructure for SLEAP.
```

### Current member with a display title and a co-advisor

```markdown
---
name: "Elizabeth Berrigan"
image: ../../assets/people/elizabeth-berrigan.jpg
appointments:
  - role: scientific-programmer
    title: "Bioinformatics Analyst"
    start: "2024-01"
    coAdvisor: "Wolfgang Busch"
---

Elizabeth is a bioinformatics analyst who joined the lab in January 2024…
```

### Alumnus with a destination

```markdown
---
name: "Sean Afshar"
image: ../../assets/people/sean-afshar.jpg
appointments:
  - role: research-assistant
    start: "2022-01"
    end: "2023-09"
next:
  org: "Princeton"
  what: "PhD in Neuroscience"
---

Sean was a research assistant in the lab from 2022 to 2023…
```

### Alumnus with no page of their own

```markdown
---
name: "Pranav Sankar"
page: false
appointments:
  - role: highschool-intern
    start: "2021"
    end: "2021"
next:
  org: "UCLA"
  what: "for undergrad"
---
```

---

## Filename Convention

`firstname-lastname.md`, lowercase kebab-case, matching the image basename. The
filename becomes the URL: `/members/firstname-lastname.html` (which 301s to the
extensionless canonical form). **Renaming a file changes a live URL** — add a
redirect to `public/_redirects` if you do.
