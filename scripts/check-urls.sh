#!/usr/bin/env bash
# §8 cutover gate. Asserts every URL the live site serves still resolves.
#
#   scripts/check-urls.sh https://talmolab-site.talmo-lab.workers.dev
#
# Pass = every path returns 200, or redirects to something that returns 200.
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
  read -r first final <<<"$(curl -s -o /dev/null -w '%{http_code} ' "$BASE$path"; curl -sL -o /dev/null -w '%{http_code}' "$BASE$path")"
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
