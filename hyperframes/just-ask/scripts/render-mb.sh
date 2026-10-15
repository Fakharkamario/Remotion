#!/usr/bin/env bash
# Motion-blurred render: sample the timeline at 240 fps, then average the eight samples around each
# 30 fps frame (a full 360-degree shutter, so the zooms through the match cuts smear instead of stepping) and keep one in eight.
# Discrete state (words, prices, typing) rounds to the nearest whole frame, so cuts never ghost.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 240 -q high -o renders/just-ask-240.mp4
ffmpeg -v error -y -i renders/just-ask-240.mp4 \
  -vf "tmix=frames=8:weights='1 1 1 1 1 1 1 1',select='eq(mod(n\,8)\,3)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart \
  renders/just-ask.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/just-ask.mp4
