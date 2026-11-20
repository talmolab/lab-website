---
name: add-publication
description: Add or update a publication in the curated overlay, including resolving a preprint to its published version. Use when a paper comes out, a preprint is accepted, or the publications list needs correcting.
version: 1.0.0
allowed-tools: Read, Write, Edit, Bash, WebFetch, AskUserQuestion, Glob, Grep
---

# Add or Update a Publication

Publications live in **`src/data/publications.yaml`**, the curated overlay.
Metadata is *not* stored there — titles, authors, venues and dates are resolved
from OpenAlex at build time by `src/loaders/openalex.ts`. The overlay records only
what an API cannot know: whether to list a work at all, the preprint↔published
pairing, thumbnails, tags, and extra links.

## The overlay is an allowlist

This is the thing to understand before editing. OpenAlex holds 69 works for this
author, and roughly 40 of them are not publications: twelve Figshare `MOESM`
supplementary-material stubs, three `Author response:` peer-review records, a
publisher erratum, Research Square duplicates of papers already listed, and
conference abstracts. Nothing appears on the site unless it is in this file.

So "the paper isn't showing up" is almost always "it isn't in the overlay", not a
bug.

## Adding a published paper

1. Get the DOI.
2. Add a stanza. Keys are **permanent** and derived from first author surname plus
   the year of the *earliest* version:

   ```yaml
   - key: maree-2023
     published: { doi: "10.1016/j.biopsych.2023.02.038" }
   ```

3. `npm run build`. The loader resolves the rest. If the DOI cannot be resolved the
   build fails loudly rather than shipping a blank entry.

Optional fields: `image` (relative to `public/images/`, or an absolute URL),
`tags`, `highlight: true`, `links: [{ label, url }]`, and `equal` / `corresponding`
(next section).

### Co-first and corresponding authors

No API reports these, so the overlay does. Copy them from the version of record (the
publisher's page or PDF), never from memory or a preprint, and leave them out when you
cannot check:

```yaml
- key: doe-2027                                  # an example, not a real entry
  published: { doi: "10.1234/example" }
  equal: ["Jane Doe", "Wei Zhang"]                # "These authors contributed equally"
  corresponding: ["Ana Ruiz"]
```

They go at the top level of the entry, beside `published:` or `manual:`, and apply to
the version the site shows. Each name is matched to the author list with `nameKey`
(first and last name; case, accents, middle names and initials ignored), so "Talmo
Pereira" finds "Talmo D. Pereira". Write the name **as the paper prints it**: an alias
in the people collection does not count here, so Kevin Bian's papers need "Kaiwen
Bian". A name that matches no author, or two, fails the build and prints the paper's
author list. That is the typo guard; do not loosen it.

The site marks them `*` (equal contribution) and `†` (corresponding author) wherever a
paper is listed, with a legend on `/publications/` and a tooltip on each mark.
`/publications.json` carries both lists as printed in `authors`; `/publications.bib`
carries them as a biblatex data annotation, `author+an = {1=equal; 4=corresponding}`.
CSL-JSON has no field for either, so `/publications.csl.json` leaves them out.

One mark covers co-first authors. A paper whose last authors also "contributed
equally" or "jointly supervised" would need a third mark; ask before folding them into
`equal`.

### Thumbnail

```bash
node scripts/paper-thumb.mjs <key> path/to/figure.png   # -> public/images/papers/<key>.webp
```

then `image: "papers/<key>.webp"`. Crop to the panel first: the page shows thumbnails at
4:3 with `object-fit: cover`. Entries that name an old `.png` resolve to its `.webp`
conversion; a file that does not exist simply shows no thumbnail.

## Resolving a preprint to its published version

This is the case the whole model exists for. Two Nature-family papers were
displayed as unpublished bioRxiv preprints on the old site because there was no way
to say "these are one work with two versions".

**Model one entity, not two rows:**

```yaml
- key: rose-2024
  preprint:  { doi: "10.1101/2024.05.03.592173" }
  published: { doi: "10.1038/s41592-025-02893-y" }
```

The published version is shown; the preprint is linked secondarily. Never list both
as separate entries.

**Note the key stays `rose-2024`** even though the paper appeared in 2025. Keying on
the earliest version means the identifier does not churn at the moment the record
starts to matter.

### Finding the published DOI

Traverse **forward from the preprint** via Crossref:

```bash
curl -s "https://api.crossref.org/works/10.1101/2024.05.03.592173?mailto=talmo@salk.edu" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['message'].get('relation',{}))"
```

Look for `is-preprint-of`.

**Only ever forward.** Querying backward from the published article is unreliable:
the Nature Methods record's `has-preprint` points at a Research Square DOI, not the
bioRxiv preprint actually on file.

`scripts/discover-publications.mjs` does this for every tracked preprint
automatically and reports the results.

### When Crossref has no relation

Then it is a manual association, and the bar is high. **Do not fuzzy-match on title
or author** — a false merge of two distinct papers is a worse failure than a missing
link.

What "high bar" looked like in the one case done so far (Patel et al.): all **24**
authors identical, and titles differing only by a hyphen vs an en-dash. That was
recorded as a comment above the entry so the reasoning survives.

A currently-open case shows the other side: bioRxiv `10.1101/2023.11.10.566632`
looks like the preprint of the PLoS Biology gerbil paper — 9 of 9 authors match on
surname and initials, in order — but the titles are entirely different and Crossref
carries no relation. It has **not** been merged. Surface it; do not decide it.

One trap worth knowing: comparing author lists by exact string gives **zero**
overlap there, because bioRxiv uses initials and PLoS uses full names. Compare on
surname plus first initial.

## Works with no DOI

Some genuinely have none — a Measuring Behavior paper that exists only as a PDF, a
NeurIPS workshop paper on OpenReview. Use a `manual:` block, which supplies
everything:

```yaml
- key: maree-2024
  manual:
    title: "Multi-view triangulation-enabled annotation for multi-animal 3D pose in SLEAP"
    authors: ["Liezl Maree", "Sean Afshar", "…", "Talmo Pereira"]
    venue: "Measuring Behavior 2024"
    date: "2024-05-15"
    link: "/images/papers/maree-2024.pdf"
  image: "papers/maree-2024.png"
```

`/images/papers/maree-2024.pdf` is the actual target of a cited work, not a
thumbnail. If it 404s, a published citation becomes unreachable — it is in
`public/images/papers/` and in the §8 URL fixture for that reason.

### Conference papers with an arXiv preprint (NeurIPS and its workshops)

A NeurIPS paper has no DOI, but its arXiv version does, and OpenAlex lists only the
arXiv record, so it looks like a preprint. Check the arXiv comment ("Accepted at
NeurIPS…") and OpenReview. If it was accepted, the conference version is the record: a
`manual:` block linking the OpenReview forum (or the venue page until the forum is
public), with the arXiv DOI as `preprint:`. The loader resolves that preprint and the
row shows "Preprint (arXiv)", exactly like a journal article with a bioRxiv version.

```yaml
- key: sirbu-2026
  manual:
    title: "A latent control model for realistic rodent motion"
    authors: ["Aidan Sirbu", "…", "Blake Aaron Richards"]   # as on OpenReview
    venue: "NeurIPS 2026"            # workshops: "NeurIPS 2026 Workshop: <name>"
    date: "2026-09-24"               # when OpenReview published the accepted paper
    link: "https://openreview.net/forum?id=zebI1xXFB1"
  preprint: { doi: "10.48550/arxiv.2610.27279" }
```

A workshop paper with no arXiv version is a `manual:` block alone. A trailing
parenthetical in `venue` is stripped for display, so leave out "(Proceedings Track)".

Also note MIMIC-MJX: OpenAlex has it with `doi: null`, indexed via PubMed only,
while the overlay tracks its arXiv DOI. One work, two identifiers — which is why
keys are lab-assigned slugs rather than DOIs.

## Discovery

```bash
node scripts/discover-publications.mjs              # report only
node scripts/discover-publications.mjs --write      # stage changes too
```

Runs weekly via `.github/workflows/discover.yaml` (Mondays 07:00 UTC, or by hand from
the Actions tab). It never commits to `main` and never publishes (decision 3b). It
buckets its findings into journal articles (staged), preprints of papers already listed
(staged: attached as that entry's `preprint:` when Crossref `is-preprint-of` links them),
other preprints (your call; listing a preprint is editorial), records with no DOI (need
a `manual:` block), and everything it filtered out as not a publication (listed, so the
filter stays auditable).

What it produces:

- **A PR** (`discover/<date>`) when anything is staged, validated with `astro check`
  first. Review each stanza, add a thumbnail if wanted, merge.
- **The "Discovery report" issue** (label `discovery`), edited in place every week with
  the full report, including the items that need a human decision and so are never
  staged. Work through it, then leave it open for next week.

## After editing

```bash
rm -f node_modules/.astro/data-store.json   # loader results are cached
npm run build
```

The cache is keyed on each overlay entry, so an edit normally refetches on its own.
Clear it explicitly if a change to the *loader* appears to do nothing — and note the
store is in `node_modules/.astro/`, not `.astro/`.

Check the result on `/publications/` and in `/publications.json`,
`/publications.bib` and `/publications.csl.json`, which are generated from the same
collection and are what gets used for grant and biosketch prep.
