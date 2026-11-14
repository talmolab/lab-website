#!/usr/bin/env bash
# Cutover check, part two. check-urls.sh proves the old addresses resolve; this proves
# the thing answering is the rebuild, built for production, and behaving like a site
# search engines and browsers should see.
#
#   scripts/check-production.sh https://talmolab.org        # after cutover
#   scripts/check-production.sh http://127.0.0.1:8790       # a local production build:
#       SITE_URL=https://talmolab.org npm run build && npm run preview -- --port 8790
#
# The www and http redirects are only checked when the base is talmolab.org itself.
set -uo pipefail

BASE="${1:?usage: check-production.sh <base-url>}"
BASE="${BASE%/}"
SITE="https://talmolab.org"
pass=0; fail=0

ok()  { pass=$((pass+1)); printf '  ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf '  FAIL %s\n       %s\n' "$1" "$2"; }
# check <label> <actual> <expected substring>
has() { if [[ "$2" == *"$3"* ]]; then ok "$1"; else bad "$1" "expected to find: $3"; fi; }
not() { if [[ "$2" != *"$3"* ]]; then ok "$1"; else bad "$1" "did not expect: $3"; fi; }
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
is()  { local got; got="$(status "$2")"; if [[ "$got" == "$3" ]]; then ok "$1"; else bad "$1" "$2 returned $got, expected $3"; fi; }

home="$(curl -s "$BASE/")"
has 'home is the rebuild (v003 lockup, not the Jekyll theme)' "$home" 'class="site-head"'
not 'home does not load the old theme' "$home" '/css/header.css'
not 'home is indexable (no noindex)' "$home" 'content="noindex'
has 'home canonical is talmolab.org' "$home" "rel=\"canonical\" href=\"$SITE/\""
has 'og:image is absolute' "$home" "property=\"og:image\" content=\"$SITE/og-card.png\""

robots="$(curl -s "$BASE/robots.txt")"
has 'robots.txt allows crawling' "$robots" 'Allow: /'
not 'robots.txt does not disallow the site' "$robots" 'Disallow: /'
has 'robots.txt names the sitemap' "$robots" "Sitemap: $SITE/sitemap-index.xml"

sitemap="$(curl -s "$BASE/sitemap-0.xml")"
has 'sitemap lists talmolab.org URLs' "$sitemap" "<loc>$SITE/publications/</loc>"
not 'sitemap has no preview URLs' "$sitemap" 'workers.dev'

member="$(curl -s "$BASE/members/talmo-pereira")"
has 'member canonical has no .html' "$member" "rel=\"canonical\" href=\"$SITE/members/talmo-pereira\""

is 'unknown path is a real 404' "$BASE/no-such-page-$$/" 404
is 'feed.xml' "$BASE/feed.xml" 200
is 'publications.bib' "$BASE/publications.bib" 200
is 'search index' "$BASE/search.json" 200
is 'og card' "$BASE/og-card.png" 200
is 'favicon' "$BASE/favicon.ico" 200

loc="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE/members/talmo-pereira.html")"
has '.html member URL is a 301, not a 307' "$loc" '301 '
has '.html member URL lands on the extensionless page' "$loc" '/members/talmo-pereira'

cc="$(curl -sI "$BASE$(printf '%s' "$home" | grep -o '/_astro/[^"]*\.css' | head -1)" | tr -d '\r' | grep -i '^cache-control:')"
has 'hashed assets are cached as immutable' "$cc" 'immutable'

if [[ "$BASE" == "$SITE" ]]; then
  loc="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.talmolab.org/team/")"
  has 'www redirects permanently' "$loc" '301 '
  has 'www redirects to the apex, keeping the path' "$loc" "$SITE/team/"
  loc="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://talmolab.org/")"
  has 'http redirects to https' "$loc" "$SITE/"
fi

echo
echo "passed $pass, failed $fail"
[[ "$fail" -eq 0 ]] || { echo "NOT A CLEAN PRODUCTION DEPLOY"; exit 1; }
echo "production build is live and correct"
