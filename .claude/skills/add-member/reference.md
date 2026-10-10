# Member file reference

One person, one file: `src/content/people/<slug>.md`. The schema is the `people`
collection in `src/content.config.ts` (Zod 4); `astro check` enforces it and is the only
guardrail, since there is no CMS. The slug is the file name and the page address
(`/members/<slug>`), so **renaming a file changes a live URL**: add a redirect to
`public/_redirects` above the `/members/:slug.html` wildcard if you ever do.

## Front matter

```yaml
---
name: "Full Name"
image: ../../assets/people/full-name.jpg   # optional; portraits live in src/assets/people/
page: true                                 # optional, default true; false = listed, no page
appointments:                              # at least one, oldest first
  - role: phd-student                      # category: sorts, groups, filters; never shown raw
    title: "PhD Candidate"                 # optional: what the site shows, if not the role label
    salkTitle: "Graduate Student"          # optional: official HR title, kept separately
    coAdvisor: "Eiman Azim"                # optional
    start: "2024-09"                       # YYYY-MM, or YYYY if the month is not known
    end: "2026-06"                         # absent = still here; "unknown" = left, date not recorded
    note: "TRELS Scholar"                  # optional free text
next:                                      # optional, for alumni
  org: "MIT"
  what: "PhD in Brain and Cognitive Sciences"
  url: "https://bcs.mit.edu"
links:                                     # all optional
  email: "name@salk.edu"
  github: "username"
  linkedin: "username"                     # or a full URL
  twitter: "handle"
  orcid: "0000-0000-0000-0000"
  scholar: "https://scholar.google.com/citations?user=…"
  home-page: "https://…"
---

Bio in Markdown, third person. Raw HTML is not used.
```

Quote every string. A bare `2024` is read as a number and fails the schema.

## Roles

The order of `ROLE_ORDER` in `src/content.config.ts` is the sort order of the team
page. Never hand-order people.

`pi`, `staff-scientist`, `postdoc`, `scientific-programmer`, `software-engineer`,
`bioinformatics-analyst`, `phd-student`, `phd-rotation`, `ms-student`,
`research-assistant`, `undergrad-intern`, `undergrad-summer-intern`,
`highschool-intern`, `highschool-summer-intern`, `friend`

There is **no `alumni` role**.

## The rules that matter

**Alumni status is derived from `end` on the last appointment, and nothing else.** The
old site had a `role: alumni` flag plus a hand-written alumni list; they drifted apart
and four people vanished from both. Never omit `end` for someone who left. If the date
is unknown, write `end: "unknown"`.

**A role change appends an appointment.** Close the current one with `end` equal to the
new `start`, then add the new one:

```yaml
appointments:
  - role: undergrad-intern
    start: "2021-11"
    end: "2022-11"
  - role: ms-student
    start: "2022-11"
    end: "2024-10"
```

The team page reads a start in the same month as the previous end, or the month after,
as one continuous tenure (`2021–2024`). Two appointments with a real gap between them
are separate stints (a summer intern who came back: `2023, 2024`).

**Three titles, deliberately.** `role` is the category, `title` is what the site
shows, `salkTitle` is the HR title. Salk titles historically did not describe the work,
so the site uses better ones. Do not reconcile them.

## Portraits

`src/assets/people/<slug>.jpg`, not `public/`. Astro optimises them at build time
(roughly 500 KB in, 5–30 KB WebP out), so a square original around 800 px is plenty.
The issue workflow crops to a square around the face with sharp's attention strategy;
by hand:

```bash
node -e "const s=require('sharp'); s('in.jpg').rotate().resize(800,800,{fit:'cover',position:s.strategy.attention}).jpeg({quality:85}).toFile('src/assets/people/<slug>.jpg')"
```

## The issue form route

`.github/ISSUE_TEMPLATE/member.yml` → `.github/workflows/member.yaml` →
`scripts/member-from-issue.mjs` → `astro check` → PR on `member/issue-<n>`.

- Only issues from collaborators are processed (the job can push branches).
- The script validates every field, writes YAML with a serializer, strips HTML from the
  bio, and downloads the portrait only from GitHub's attachment hosts. If the download
  fails, the PR says so and the portrait goes in by hand.
- It refuses: a join for someone who already has a file, a role change or departure for
  someone already gone, a departure without an end month, an unticked consent box.
- Field labels in the form are what the script parses. Rename one in both places.

## Checking your work

```bash
npm run build          # astro check, then the build
npm run preview        # then look at /team/ and /members/<slug>
```
