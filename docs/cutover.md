# Cutover: putting this site on talmolab.org

**Done on 2026-11-20, about 22:10 UTC.** talmolab.org is served by the Worker
`talmolab-org` from this repo's `main`; the Jekyll site still runs on GitHub Pages as the
rollback (see *Rollback*). The rest of this page is the procedure as written beforehand,
corrected where reality differed, so it can be followed again or undone.

## What actually happened

1. Both Cloudflare secrets added; a CI deploy of the preview passed the URL gate.
2. The `www` Redirect Rule added (zero visible change: GitHub had been doing the same 301).
3. `PRODUCTION_DOMAIN` set and Deploy run. The production build passed its checks and
   uploaded `talmolab-org`, but attaching the custom domain failed: *"Hostname
   'talmolab.org' already has externally managed DNS records (A, CNAME, etc). Delete them
   first"* (code 100117). Wrangler does not replace existing records, contrary to the note
   below as first written. Nothing changed for visitors.
4. The four apex A records were deleted and `talmolab.org` attached to `talmolab-org` in
   the dashboard right after (Workers & Pages → talmolab-org → Domains → Add domain). The
   new site answered on the first request: a gap of seconds.
5. The failed job re-run: the deploy (now only a version upload) and both checks passed,
   177/177 URLs and 23/23 production checks.

Since then every merge to `main` deploys, and `main` requires a PR with a green `build`.

## How the two sites were served before

| | Live site | This rebuild |
|---|---|---|
| Source | `talmolab/lab-website`, `main` | this repo, `main` |
| Host | GitHub Pages, behind Cloudflare's proxy (`server: cloudflare`, `x-github-request-id`) | Cloudflare Workers static assets |
| Address | `talmolab.org`; `www` and `http://` 301 to `https://talmolab.org/` | `talmolab-next.talmo-lab.workers.dev` (noindexed) |

So the zone is already on Cloudflare, and the cutover is a DNS change inside one
account: `talmolab.org` stops pointing at GitHub Pages and starts pointing at a Worker.

## What is already in place

- `wrangler.jsonc` has an `env.production` block: Worker `talmolab-org`, custom domain
  `talmolab.org`, no workers.dev address.
- `.github/workflows/deploy.yaml` has a `production` job. It runs only on `main` and only
  while the repository variable `PRODUCTION_DOMAIN` is `talmolab.org`. It builds with
  `SITE_URL=https://talmolab.org`, refuses to ship a build that is noindexed, deploys,
  then runs both checks below against the live domain.
- `scripts/check-urls.sh <base>`: all 177 paths in `test/live-urls.txt` (every page in
  the live sitemap, and every image and icon the live site serves) return 200 or
  redirect to a 200.
- `scripts/check-production.sh <base>`: the pages are the rebuild, indexable, canonical
  to talmolab.org; robots.txt and the sitemap are production ones; `.html` member URLs
  301; hashed assets are immutable; and, on the real domain, `www` and `http` redirect.

**One thing to know before touching anything.** Deploying `--env production` *is* the
cutover: a custom domain tells Cloudflare to point the hostname at the Worker. Never run
`wrangler deploy --env production` to "test" it; use `--dry-run`, which uploads nothing.
(This note first said wrangler would replace the hostname's existing DNS records when not
in a terminal. It does not: Cloudflare refused while the A records existed, error
100117, and they had to be deleted first. See *What actually happened*.)

## Before

1. **Give CI its Cloudflare credentials.** As of 2026-11-14 the repository has neither
   secret, so CI builds but has never deployed: every preview so far was deployed by
   hand. Repository → Settings → Secrets and variables → Actions → Secrets:
   - `CLOUDFLARE_ACCOUNT_ID`: the account that holds the `talmolab.org` zone.
   - `CLOUDFLARE_API_TOKEN`: an account API token (Manage Account → Account API
     Tokens) with two grants. **Workers, scoped to the whole product, role Admin**: the
     first production deploy *creates* the `talmolab-org` Worker, which Cloudflare's
     Workers permissions docs say needs Admin, and custom domains do not support
     per-Worker scopes. **Zone → Workers Routes → Write on `talmolab.org`**: required to
     add a custom domain. Once `talmolab-org` exists the role could drop to Editor.
2. **Deploy the preview from CI and check it.** Actions → **Deploy** → Run workflow, on
   `main`. With the secrets in place the `build` job deploys `talmolab-next` and then
   runs the URL gate against it; `production` is skipped. This is the rehearsal: the
   same build, on Cloudflare, with nothing at stake. To run the gate yourself:
   ```bash
   ./scripts/check-urls.sh https://talmolab-next.talmo-lab.workers.dev
   ```
3. **The current DNS records are the rollback.** As read from the dashboard on
   2026-11-20 (talmolab.org → DNS → Records; re-check on the day):

   | Name | Type | Content | Proxy |
   |---|---|---|---|
   | `talmolab.org` | A | `185.199.108.153` | Proxied |
   | `talmolab.org` | A | `185.199.109.153` | Proxied |
   | `talmolab.org` | A | `185.199.110.153` | Proxied |
   | `talmolab.org` | A | `185.199.111.153` | Proxied |
   | `www` | CNAME | `talmolab.org` | Proxied |

   The zone has no Redirect Rules, Page Rules or Workers Routes. Leave every other
   record alone: `lablink`, `mimic-mjx` and `vibes` (CNAME `talmolab.github.io`, other
   repos' Pages sites), `wiki` (Notion), the Google Workspace `MX` records, the `TXT`
   verifications, and a stray apex `NS ns2.101domain.com` left from the old registrar.
4. **Move the `www` redirect to Cloudflare before the cutover.** Today GitHub Pages
   does `www` → `talmolab.org`. But `www` is a CNAME to the apex, so it follows the
   apex: the moment the custom domain replaces the A records, `www` requests go to the
   Worker, which answers only the exact hostname `talmolab.org`. Add a Single Redirect
   rule (Rules → Redirect Rules): when the hostname equals `www.talmolab.org`, 301 to
   `https://talmolab.org` plus the request path, keeping the query string. Nothing
   visible changes (same 301, now with no `x-github-request-id` header), the existing
   proxied CNAME is all the rule needs, and `check-production.sh` tests it.
   ```bash
   curl -sI https://www.talmolab.org/team/?x=1 | grep -iE '^(HTTP|location|x-github)'
   ```
5. **Decide the two open content questions** in PR 7 if you want them settled first
   (the mills-2022 association, the site name). Neither blocks the cutover.

## Cutover

1. Repository → Settings → Secrets and variables → Actions → Variables → **New
   repository variable**: `PRODUCTION_DOMAIN` = `talmolab.org`.
2. Actions → **Deploy** → Run workflow, on `main`.
3. Watch the `production` job. Its last two steps are the checks; green means every
   live URL resolves on the real domain and the production build is what is answering.

If the deploy step fails because of the existing DNS records (Cloudflare's docs say a
custom domain cannot be created on a hostname that has a CNAME; the apex here has four
A records): delete the four apex A records from step 3 of *Before*, and re-run the job.
The site is unreachable between those two actions, so do them back to back.

From here on every push to `main`, and the Monday rebuild, deploys to talmolab.org.

## After

Status as of 2026-11-20.

- **`www`.** Done: handled by the Redirect Rule from step 4 of *Before*, not by GitHub,
  so it does not depend on the old site. `check-production.sh` tests it, so the Monday
  deploy fails loudly if it ever stops.
- **Search Console.** Not done: no Search Console property exists for talmolab.org yet
  (the `google-site-verification` TXT record belongs to Google Workspace). Add a domain
  property, verify it with the TXT record Search Console gives, then submit
  `https://talmolab.org/sitemap-index.xml`. The old `/sitemap.xml` 301s to it.
- **Link unfurls.** Slack, X and LinkedIn cache the old card. Each has a debugger that
  refetches; the new card is `/og-card.png`.
- **The old site.** Leave `lab-website` and its Pages deployment alone for a few weeks:
  it is the rollback. Then switch Pages off, archive the repo, and revoke its Cloudflare
  API token (Account API Tokens: "lab-website deploy - GitHub Actions (2026-08)").
- **The previews.** Done: `talmolab-next` keeps deploying from `main` as the noindexed
  preview; `talmolab-site` (lab-website's first Astro build) and `talmolab-redux`
  (direction C) were deleted on 2026-11-20. Their code is in git history.
- **Docs.** Done: `CLAUDE.md` and `README.md` describe the live site.

## Rollback

1. Delete the repository variable `PRODUCTION_DOMAIN` (stops further production deploys).
2. Cloudflare → Workers & Pages → `talmolab-org` → Domains →
   remove `talmolab.org`.
3. Recreate the four apex A records from step 3 of *Before* (`185.199.108.153` to
   `185.199.111.153`, proxied). GitHub Pages is still serving the old site and picks up
   immediately. The `www` Redirect Rule can stay: it points at the apex either way.

The Advanced Certificate Cloudflare issued for the custom domain is not removed with
it; delete it under SSL/TLS → Edge Certificates if you want it gone. It does no harm.

## What changes for visitors

Nothing breaks: every page, image and file the live site serves keeps answering
(`docs/parity.md` has the full map, including the handful of deliberate redirects).
What is different is the design and the logo, `/tools/` and `/blog/` have real content
instead of template filler, `/contact/` and the three example posts redirect, and
member pages lose their `.html` (the old URL 301s).
