# Phase 2 — people collection: status

53 people, 52 member pages, every `/members/<slug>.html` URL still resolving
(the three removed ones 301 to `/team/`).

## Resolved

**Dropped entirely, per your call:** Gregory Quach, Neeraj Venna, Ramiz Hajj.
Their files and portraits are gone. Their URLs 301 to `/team/` rather than
404ing — those pages resolve on the live site today, and §8 treats that as a
hard requirement even for pages that are deliberately removed. Note this is
the one place where the removal is *not* silent: an old inbound link lands on
the team page rather than a dead end.

**Vincent Tu was kept** — you named three, not four. The roster CSV gave him
real dates (2022-02 → 2024-10), so the `end: "unknown"` case is now empty.

**The 2025 annual-review roster CSV closed almost every gap.** 47 of 53 people
matched, and it carries what the website prose never did: `YYYY-MM` precision on
both ends, co-advisors, and one row per role period — so the role transitions are
recorded facts rather than inferences. Specifically:

- **Aaditya Prasad's handover is no longer unknown**: undergrad 2021-11 → 2022-11,
  MS 2022-11 → 2024-10, co-advised by Uri Manor throughout.
- **Scott Yang** turns out to be a three-stage career the site never showed —
  undergrad, MS, then PhD student from 2025-05.
- **Amick Licup** converted undergrad → research assistant in 2025-06.
- Every alumni tenure is now a real span, e.g. Advaith Ravishankar `2022-05 → 2025-05`.

**Everyone who had a full member page keeps it**, per your call. `page: false`
stays in the schema and is used only by Pranav Sankar, who never had one.

**Job titles are now three separate fields** rather than a conflict to resolve:

| Field | Meaning |
|---|---|
| `role` | category — drives sorting, grouping, filtering; never displayed raw |
| `title` | what the site shows, when the lab's wording is better than the category |
| `salkTitle` | the official Salk HR title, when it differs from both |

13 people carry a `title` today, all back-filled from their member-file wording
(Amitha Attapu and Benfica Xavier as *Bioinformatics Analyst* under a
`scientific-programmer` category; Eric Leonardis as *Postdoctoral Fellow*).
`salkTitle` is deliberately empty everywhere — it is a slot for when you
standardize, not something to fill in by guessing.

## Still open

### 1. Three people have no start date

Not in the roster CSV and not stated in their bios. Left blank, not estimated.

- **Fabian Plum**
- **Nick Andrews**
- **Zaher Abbara**

### 2. Ten member files reference portraits that do not exist

Broken images on the live site today; the new team page falls back to initials.

Amitha Attapu, Arnav Dagar, Arthur Mayo III, Ava Barbano, Drake Thompson, Hutton Saunders, Papa Manu, Rusham Bhatt, Van Nguyen, Yipeng Li

### 3. People missing from the collection entirely

You flagged that a lot of this year's people are absent. Nothing has been added
speculatively — the collection contains exactly the 55 who had member files, minus
the three dropped, plus Pranav Sankar. Adding the rest is queued for after the
migration, as you asked.
