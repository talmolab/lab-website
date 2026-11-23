#!/usr/bin/env bash
# Encode one clip for the site: muted, looping web video plus a poster.
#
#   scripts/encode-clip.sh <input> <name> [max-width] [poster-time]
#
#   input        any video or animated GIF ffmpeg can read
#   name         file stem, e.g. sleap-flies -> public/media/sleap-flies.{mp4,webm,jpg}
#   max-width    downscale wider sources to this (default 1280; never upscales)
#   poster-time  seconds into the clip for the poster frame (default 0)
#
# Writes H.264 MP4 (every browser) and VP9 WebM (smaller, offered first), both
# without audio, plus a JPEG poster at the same size. Then prints the YAML to paste
# into an area's or a repo's `media:` list (src/content/areas/*.md, src/data/repos.yaml).
# The schema checks that the files exist, so a typo fails the build, not the page.
set -euo pipefail

IN="${1:?usage: encode-clip.sh <input> <name> [max-width] [poster-time]}"
NAME="${2:?usage: encode-clip.sh <input> <name> [max-width] [poster-time]}"
MAXW="${3:-1280}"
AT="${4:-0}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"
mkdir -p "$OUT"

# Even dimensions are required by yuv420p; pad by at most one pixel rather than crop.
VF="scale='min(${MAXW},iw)':-2:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p"

# At most 30 fps. A page plays two or three clips at once while it scrolls, and a 60 fps
# one made Research choppy in Chrome on Windows (2026-11). Slower sources keep their rate.
RATE=$(ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of csv=p=0 "$IN")
if awk -v r="$RATE" 'BEGIN { split(r, f, "/"); exit !((f[2] ? f[1] / f[2] : f[1]) > 30) }'; then
  VF="fps=30,$VF"
fi

ffmpeg -v error -y -i "$IN" -an -vf "$VF" -c:v libx264 -preset slow -crf 22 \
  -movflags +faststart "$OUT/$NAME.mp4"
ffmpeg -v error -y -i "$IN" -an -vf "$VF" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 \
  "$OUT/$NAME.webm"
ffmpeg -v error -y -ss "$AT" -i "$OUT/$NAME.mp4" -frames:v 1 -q:v 3 "$OUT/$NAME.jpg"

read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
  -of csv=p=0:s=x "$OUT/$NAME.mp4" | tr x ' ')
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$NAME.mp4")

ls -lh "$OUT/$NAME".{mp4,webm,jpg} | awk '{print $5, $9}'
cat <<YAML

media:
  - src: /media/$NAME.mp4      # the .webm beside it is picked up automatically
    poster: /media/$NAME.jpg
    width: $W
    height: $H
    alt: "Describe what is on screen."
    caption: "One sentence for under the clip."
# duration ${DUR}s
YAML
