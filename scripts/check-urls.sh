#!/usr/bin/env bash
# §8 cutover gate. Asserts every URL the live site serves still resolves: pages, and
# the images and icons under /images/ and /favicons/ (test/live-urls.txt).
#
#   scripts/check-urls.sh https://talmolab-site.talmo-lab.workers.dev
#
# Pass = every path returns 200, or permanently redirects (301/308) to something that
# returns 200. A 302/307 fails: it resolves for a visitor but does not move the index.
# A 404 anywhere is a blocker: the URLs that break silently are the external
# ones — CVs, the SLEAP docs, other lab sites, and Google's index of the .html
# member pages. Nobody reports those.
set -uo pipefail

BASE="${1:?usage: check-urls.sh <base-url>}"
FIXTURE="$(dirname "$0")/../test/live-urls.txt"
pass=0; fail=0

while IFS= read -r path; do
  [[ -z "$path" || "$path" == \#* ]] && continue
  # Follow redirects and report the final status, plus the first hop for context.
  read -r first loc <<<"$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE$path")"
  final="$(curl -sL -o /dev/null -w '%{http_code}' "$BASE$path")"
  # A temporary redirect (302/307) resolves but does not move a search index, so it
  # fails. One exception: Workers answers a path containing `@` with a 307 to the same
  # path percent-encoded (`%40`). That is the same file, not a moved page.
  if [[ "$first" == "302" || "$first" == "307" ]]; then
    target="${loc#"$BASE"}"
    if [[ "${target//%40/@}" != "$path" ]]; then
      fail=$((fail+1))
      printf '  FAIL %-45s %s (temporary) -> %s\n' "$path" "$first" "${target:-?}"
      continue
    fi
  fi
  if [[ "$final" == "200" ]]; then
    pass=$((pass+1))
    [[ "$first" != "200" ]] && printf '  ok  %-46s %s -> 200\n' "$path" "$first"
  else
    fail=$((fail+1))
    printf '  FAIL %-45s %s -> %s\n' "$path" "$first" "$final"
  fi
done < "$FIXTURE"

echo
echo "passed $pass, failed $fail"
[[ "$fail" -eq 0 ]] || { echo "CUTOVER BLOCKED"; exit 1; }
echo "all live URLs resolve"
