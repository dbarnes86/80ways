#!/usr/bin/env bash
# Stitch the intro's six clips into public/intro/intro.mp4 with crossfades.
#
#   scripts/intro/stitch.sh london.mp4 ship.mp4 train.mp4 elephant.mp4 storm.mp4 runner.mp4
#
# Each clip is trimmed to SHOT seconds and overlaps the next by XFADE; src/game/Intro.tsx uses the
# same two numbers to time the captions, so change them in both places. Clips come from Higgsfield
# DoP (image-to-video) run over the stills in public/intro, see scripts/intro/README.md.
set -euo pipefail
SHOT=${SHOT:-4.2}
XFADE=${XFADE:-0.5}
OUT=${OUT:-public/intro/intro.mp4}
[ $# -ge 2 ] || { echo "usage: $0 clip1.mp4 clip2.mp4 …" >&2; exit 1; }

inputs=(); filter=""; n=0
for f in "$@"; do
  inputs+=(-i "$f")
  filter+="[$n:v]trim=0:$SHOT,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24,format=yuv420p[v$n];"
  n=$((n+1))
done
prev="v0"
for ((i=1; i<n; i++)); do
  offset=$(awk -v i="$i" -v s="$SHOT" -v x="$XFADE" 'BEGIN { printf "%.3f", i*(s-x) }')
  out="x$i"; [ "$i" -eq $((n-1)) ] && out="out"
  filter+="[$prev][v$i]xfade=transition=fade:duration=$XFADE:offset=$offset[$out];"
  prev=$out
done
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "${filter%;}" -map "[out]" \
  -c:v libx264 -preset slow -crf 23 -profile:v high -level 4.0 -pix_fmt yuv420p -movflags +faststart -an "$OUT"
echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
