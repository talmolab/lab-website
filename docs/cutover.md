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

1. **Merge to `main`** and confirm the preview is right:
   ```bash
   ./scripts/check-urls.sh https://talmolab-next.talmo-lab.workers.dev
   ```
2. **Write down the current DNS records** for `talmolab.org` and `www` (Cloudflare
   dashboard → talmolab.org → DNS → Records). They are the rollback. Expect the apex
   to be `A` records for GitHub Pages (`185.199.108.153` … `111.153`) or a flattened
   `CNAME` to `talmolab.github.io`, proxied.
3. **Check the API token.** The preview deploy only needs to upload a Worker. This one
   also attaches a custom domain, which touches the `talmolab.org` zone, so
   `CLOUDFLARE_API_TOKEN` must include that zone. Cloudflare's custom-domain page does
   not list the scopes and this was not tested against the real account: if the deploy
   step ends in an authorization error, give the token Zone → Workers Routes → Edit and
   Zone → DNS → Edit on `talmolab.org` and re-run.
4. **Decide the two open content questions** in PR 7 if you want them settled first
   (the mills-2022 association, the site name). Neither blocks the cutover.

## Cutover

1. Repository → Settings → Secrets and variables → Actions → Variables → **New
   repository variable**: `PRODUCTION_DOMAIN` = `talmolab.org`.
2. Actions → **Deploy** → Run workflow, on `main`.
3. Watch the `production` job. Its last two steps are the checks; green means every
   live URL resolves on the real domain and the production build is what is answering.

If the deploy step fails because of the existing DNS record (Cloudflare's docs say a
custom domain cannot be created on a hostname that has a CNAME): delete the apex record
you wrote down in step 2 of *Before*, and re-run the job. The site is unreachable
between those two actions, so do them back to back.

From here on every push to `main`, and the Monday rebuild, deploys to talmolab.org.

## After

- **`www`.** It keeps redirecting for as long as its DNS record still points at GitHub
  Pages and `lab-website` still has Pages switched on, because GitHub does that
  redirect. Do not rely on it: a custom domain is an exact match, so the Worker never
  sees `www`. Add a Cloudflare Redirect Rule from `www.talmolab.org` to the root now,
  and give `www` a proxied DNS record of its own (Cloudflare's docs suggest
  `A www 192.0.2.0`). `check-production.sh` tests this redirect, so the Monday deploy
  will fail loudly if it ever stops.
- **Search Console.** Submit `https://talmolab.org/sitemap-index.xml`. The old
  `/sitemap.xml` 301s to it.
- **Link unfurls.** Slack, X and LinkedIn cache the old card. Each has a debugger that
  refetches; the new card is `/og-card.png`.
- **The old site.** Leave `lab-website` and its Pages deployment alone for a few weeks:
  it is the rollback. Then archive the repo, or at least switch Pages off after the
  `www` rule is in.
- **The previews.** `talmolab-next` keeps deploying from `main` as the noindexed
  preview. `talmolab-redux` (direction C) can be deleted when nobody needs the
  comparison.
- Update `CLAUDE.md` and `README.md`, which still describe the site as a preview.

## Rollback

1. Delete the repository variable `PRODUCTION_DOMAIN` (stops further production deploys).
2. Cloudflare → Workers & Pages → `talmolab-org` → Settings → Domains & Routes →
   remove `talmolab.org`.
3. Recreate the DNS records you wrote down. GitHub Pages is still serving the old site
   and picks up immediately.

The Advanced Certificate Cloudflare issued for the custom domain is not removed with
it; delete it under SSL/TLS → Edge Certificates if you want it gone. It does no harm.

## What changes for visitors

Nothing breaks: every page, image and file the live site serves keeps answering
(`docs/parity.md` has the full map, including the handful of deliberate redirects).
What is different is the design and the logo, `/tools/` and `/blog/` have real content
instead of template filler, `/contact/` and the three example posts redirect, and
member pages lose their `.html` (the old URL 301s).
