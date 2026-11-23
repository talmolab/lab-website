# talmolab.org

The website of the Talmo Lab at the Salk Institute: research, publications, software
and people. It is a static site built with [Astro](https://astro.build) and served by
Cloudflare Workers.

- **Live:** https://talmolab.org
- **Preview:** https://talmolab-next.talmo-lab.workers.dev (the same site, hidden from
  search engines)

## How changes reach the site

Every change goes through a pull request, and merging is publishing: there is no
separate deploy step.

1. **Open a pull request.** GitHub builds the site and checks the content. A misspelled
   member name, a missing image or a malformed entry fails the build at this point.
   `main` only accepts pull requests whose build passes.
2. **Merge it.** The site rebuilds, goes to the preview, has every address checked, and
   only then goes to talmolab.org, where the checks run once more. This takes a few
   minutes.

Pull requests are built but not put online anywhere. To see a change before merging,
run the site locally (below).

## What runs on its own

| Workflow | When | What it does |
|---|---|---|
| **Deploy** | Every merge to `main`, and Mondays | Builds and publishes the site. The Monday rebuild picks up new paper and repository details without needing a commit. |
| **Discover** | Mondays | Looks for new papers by the lab (OpenAlex, Crossref) and new releases of the lab's software (GitHub). Proposes them in a pull request, and keeps the **Discovery report** issue up to date with anything that needs a decision. It never publishes anything itself. |
| **Member update** | When a *Lab member update* issue is opened or edited | Turns the form into a pull request that edits that person's entry on the team page. |

The workflow files are in [`.github/workflows/`](.github/workflows/).

## Making common changes

**Joining the lab, updating your entry, or leaving.** Open a
[Lab member update](../../issues/new?template=member.yml) issue. A pull request appears
a few minutes later; edit the issue to change it. A maintainer checks it and merges.
The form works for people with access to this repository.

**Publications.** [`src/data/publications.yaml`](src/data/publications.yaml) is the list
of papers on the site: a paper that is not in it does not appear. An entry is a
permanent key and a DOI, plus the preprint's DOI if there is one. Title, authors and
venue are fetched when the site builds. To add a thumbnail, run
`node scripts/paper-thumb.mjs <key> <figure.png>`.

**Software.** [`src/data/repos.yaml`](src/data/repos.yaml) lists the repositories on the
Tools page, in the order shown. Descriptions can be written there; the rest comes from
GitHub.

**Research.** One Markdown file per research direction, in
[`src/content/areas/`](src/content/areas/).

**Videos.** `scripts/encode-clip.sh <source> <name>` makes a silent web video and a
poster image in `public/media/`, and prints the lines to paste into a research area or
a repository entry.

All of this is checked when the site builds (the schema is in
[`src/content.config.ts`](src/content.config.ts)), so a typo in a name, DOI or file path
fails the build rather than breaking a page.

If you use Claude Code, [`.claude/skills/`](.claude/skills/) has guided routines for
adding a member or a publication, making a roster, and testing locally.

## Running it locally

You need Node 24.

```bash
npm ci
export GITHUB_TOKEN=$(gh auth token)   # the Tools page calls the GitHub API
npm run dev                            # http://localhost:4321
```

| Command | Does |
|---|---|
| `npm run dev` | Development server that reloads as you edit |
| `npm run build` | Checks types and content, then builds the site into `dist/` |
| `npm run preview` | Serves `dist/` the way Cloudflare does, redirects included |
| `./scripts/check-urls.sh <url>` | Checks that every address in `test/live-urls.txt` still resolves |

Without `GITHUB_TOKEN`, the GitHub API runs out of anonymous requests after a few
builds. Paper details come from OpenAlex, which needs no key but slows down repeated
requests; set `OPENALEX_API_KEY` if you rebuild often.

## Where things are

```
src/content/people/   one file per lab member, past and present
src/content/areas/    the research directions
src/data/             publications, software, projects, graduate programs
src/pages/            one file per page, including the text of pages like Home and Join
src/styles/global.css the site's shared styles
public/               files served as they are: videos, icons, redirects
brand/                logo, colours and type (see brand/README.md)
scripts/              the discovery, member, thumbnail, video and URL-check scripts
```

## Old links

Addresses from the lab's previous website keep working. [`test/live-urls.txt`](test/live-urls.txt)
lists every one of them and [`public/_redirects`](public/_redirects) points each to its
new home. Every deploy checks the whole list, so a change that breaks an old link never
reaches talmolab.org.

## More detail

- [`CLAUDE.md`](CLAUDE.md): the maintainer's reference, with the content rules, design
  rules and known pitfalls.
- [`brand/README.md`](brand/README.md): logo, colours and typography.
- [`docs/cutover.md`](docs/cutover.md): how talmolab.org is connected to Cloudflare, and
  how to switch back to the old site.
