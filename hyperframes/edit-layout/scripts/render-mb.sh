#!/usr/bin/env bash
# Motion-blurred render with 16 samples a frame: a copy of the project plays the clip at half speed and is sampled at
# 240 fps (= 480 samples per second of the real clip); then the eight samples around each 30 fps frame
# (t-1/4 .. t+1/4 of a frame, a 180-degree shutter) are averaged and one in sixteen is kept. The dense sampling keeps
# the quick, kinetic camera moves smooth (no stepped copies). Discrete state (words, typing, the match cuts) rounds
# to the nearest whole frame, so cuts never ghost.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
mkdir -p renders
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir "$TMP/p"
cp -r index.html assets hyperframes.json package.json meta.json "$TMP/p/"
DUR=$(grep -o 'data-duration="[0-9.]*"' index.html | grep -o '[0-9.]*')
DUR2=$(python3 -c "print(round(2 * $DUR, 6))")
sed -i "s/data-duration=\"$DUR\"/data-duration=\"$DUR2\"/; s#<script src=\"assets/scene.js\"></script>#<script>window.__TIMESCALE = 2;</script><script src=\"assets/scene.js\"></script>#" "$TMP/p/index.html"
(cd "$TMP/p" && npx --yes hyperframes@0.8.114 render -f 240 -q high -o "$ROOT/renders/edit-layout-480.mp4")
ffmpeg -v error -y -i renders/edit-layout-480.mp4 \
  -vf "tmix=frames=8:weights='1 1 1 1 1 1 1 1',select='eq(mod(n\,16)\,3)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart \
  renders/edit-layout.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/edit-layout.mp4
