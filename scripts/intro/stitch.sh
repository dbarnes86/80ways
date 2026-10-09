#!/usr/bin/env bash
# Stitch the intro's clips into public/intro/intro.mp4: each shot fades in from black, holds, and
# fades out, so every line of the story gets its own frame.
#
#   scripts/intro/stitch.sh london.mp4 ship.mp4 train.mp4 runner.mp4
#
# Each clip is trimmed to SHOT seconds; src/game/Intro.tsx uses the same number to time the
# captions, so change it in both places. Use clips with the same frame rate (Kling is 24 fps) or
# the conform to 24 fps drops frames and stutters.
set -euo pipefail
SHOT=${SHOT:-4.0}
FADE_IN=${FADE_IN:-0.5}
FADE_OUT=${FADE_OUT:-0.4}
OUT=${OUT:-public/intro/intro.mp4}
[ $# -ge 1 ] || { echo "usage: $0 clip1.mp4 clip2.mp4 …" >&2; exit 1; }

inputs=(); filter=""; n=0
out_start=$(awk -v s="$SHOT" -v f="$FADE_OUT" 'BEGIN { printf "%.3f", s-f }')
for f in "$@"; do
  inputs+=(-i "$f")
  filter+="[$n:v]trim=0:$SHOT,setpts=PTS-STARTPTS,fps=24,scale=960:540:flags=lanczos,format=yuv420p,fade=t=in:st=0:d=$FADE_IN,fade=t=out:st=$out_start:d=$FADE_OUT[v$n];"
  n=$((n+1))
done
for ((i=0; i<n; i++)); do filter+="[v$i]"; done
filter+="concat=n=$n:v=1:a=0[out]"
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[out]" \
  -c:v libx264 -preset slow -crf 26 -profile:v high -level 4.0 -pix_fmt yuv420p -g 24 -movflags +faststart -an "$OUT"
echo "wrote $OUT ($(du -h "$OUT" | cut -f1), $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
