# Phase 2 — people collection: what needs your judgement

Generated from the one-time extraction of `team/index.md` + `_members/*.md`.
Everything below was **left as found rather than guessed**, because a wrong date
written into the collection becomes indistinguishable from a real one.

The collection itself is built and validating: 56 people, 55 member pages, all 55
existing `/members/<slug>.html` URLs still resolve.

## 1. Four people are invisible on the live site right now

Their files say `role: alumni`, which filters them **out** of the team page, and
nobody added them to the hand-written alumni list — so they appear nowhere, though
their pages still exist and are linked from nothing.

| Person | Joined (from their bio) | Left |
|---|---|---|
| Gregory Quach | 2024-06 | **unknown** |
| Neeraj Venna | 2024-09 | **unknown** |
| Ramiz Hajj | — | **unknown** |
| Vincent Tu | — | **unknown** |

They are now in the alumni table with `end: "unknown"`, rendering as `2024–?`.
**Please supply the departure years.** This class of bug is why `end` is the only
thing that marks someone as alumni now — there is no `role: alumni` flag to fall
out of sync with a separate list.

## 2. Role conflicts — the list and the member file disagree

I used the alumni list, since it is the curated public record. Confirm or correct:

| Person | Alumni list | Member file |
|---|---|---|
| Amitha Attapu | software-engineer | Bioinformatics Analyst |
| Arnav Dagar | highschool-summer-intern | High School Research Intern |
| Arthur Mayo III | undergrad-summer-intern | Undergraduate Research Intern |
| Ava Barbano | undergrad-summer-intern | Undergraduate Research Intern |
| Jason Foat | software-engineer | Scientific Programmer |
| Liezl Maree | software-engineer | Scientific Programmer |
| Will Knickrehm | highschool-summer-intern | High School Research Intern |

The last four are only summer-vs-not wording. The first three are real title
questions: Software Engineer vs Scientific Programmer vs Bioinformatics Analyst.

## 3. Missing start dates (7)

Not stated in the bio and not derivable. Left blank rather than estimated.

- **Andrew Park** — current member, join date not stated in bio
- **Dexter Tsin** — not stated in bio and not a summer stint; end=2022
- **Fabian Plum** — current member, join date not stated in bio
- **Kevin Bian** — current member, join date not stated in bio
- **Max Weinberg** — not stated in bio and not a summer stint; end=2024
- **Nick Andrews** — current member, join date not stated in bio
- **Zaher Abbara** — not stated in bio and not a summer stint; end=2024

## 4. One unrecoverable boundary

**Aaditya Prasad** — 2 roles ['undergrad-intern', 'ms-student'] but only departure year 2024; the handover date is not recorded anywhere.

Encoded as one continuous tenure with the handover date omitted, so it renders
`2021–2024` rather than implying two separate stints the way a repeat intern does.

## 5. Ten member files reference portraits that do not exist

These render a broken image on the live site today; the new team page falls back
to initials. Supply photos or accept the fallback.

Amitha Attapu, Arnav Dagar, Arthur Mayo III, Ava Barbano, Drake Thompson, Hutton Saunders, Papa Manu, Rusham Bhatt, Van Nguyen, Yipeng Li

## 6. §6.2b — who keeps a full member page?

The plan says this is a per-person judgement on bio substance, to be surfaced
rather than decided silently. **Nothing has been dropped** — all 55 existing pages
still build. Below are the thinnest alumni bios as candidates for becoming table
rows only. Dropping one means adding a 301 to the alumni anchor.

| Person | Bio length |
|---|---|
| Pranav Sankar | 0 chars |
| Ramiz Hajj | 127 chars |
| Vincent Tu | 142 chars |
| Marcus Intal | 159 chars |
| Will Knickrehm | 165 chars |
| Gregory Quach | 172 chars |
| David Samy | 173 chars |
| Neeraj Venna | 187 chars |
| Keya Loding | 191 chars |
| Nathaniel Nono | 202 chars |
| Mariela Mendoza | 205 chars |
| Sean Afshar | 213 chars |

Pranav Sankar already has no page and is listed as plain text — the precedent
§6.2b cites, now expressed as `page: false` in the collection.
