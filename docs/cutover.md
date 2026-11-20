# Cutover: putting this site on talmolab.org

Everything needed to replace the live Jekyll site is in this repo and is switched off.
This page is the switch, and how to undo it.

## How the two sites are served today

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
- `scripts/check-urls.sh <base>`: all 152 paths in `test/live-urls.txt` (every page in
  the live sitemap, and every image and icon the live site serves) return 200 or
  redirect to a 200.
- `scripts/check-production.sh <base>`: the pages are the rebuild, indexable, canonical
  to talmolab.org; robots.txt and the sitemap are production ones; `.html` member URLs
  301; hashed assets are immutable; and, on the real domain, `www` and `http` redirect.

**One thing to know before touching anything.** Deploying `--env production` *is* the
cutover. A custom domain tells Cloudflare to point the hostname at the Worker, and when
wrangler is not attached to a terminal (CI, a script, an agent) it replaces the existing
DNS record without asking. Never run `wrangler deploy --env production` to "test" it.
Use `--dry-run`, which uploads nothing.

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

- **`www`.** Handled by the Redirect Rule from step 4 of *Before*, not by GitHub, so it
  does not depend on the old site. `check-production.sh` tests it, so the Monday deploy
  fails loudly if it ever stops.
- **Search Console.** Submit `https://talmolab.org/sitemap-index.xml`. The old
  `/sitemap.xml` 301s to it.
- **Link unfurls.** Slack, X and LinkedIn cache the old card. Each has a debugger that
  refetches; the new card is `/og-card.png`.
- **The old site.** Leave `lab-website` and its Pages deployment alone for a few weeks:
  it is the rollback. Then switch Pages off and archive the repo.
- **The previews.** `talmolab-next` keeps deploying from `main` as the noindexed
  preview. `talmolab-redux` (direction C) can be deleted when nobody needs the
  comparison.
- Update `CLAUDE.md` and `README.md`, which still describe the site as a preview.

## Rollback

1. Delete the repository variable `PRODUCTION_DOMAIN` (stops further production deploys).
2. Cloudflare → Workers & Pages → `talmolab-org` → Settings → Domains & Routes →
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
