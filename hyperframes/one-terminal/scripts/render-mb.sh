#!/usr/bin/env bash
# Motion-blurred render: sample the timeline at 240 fps, then average the five samples around each
# 30 fps frame (t-1/4 .. t+1/4 of a frame, a 180-degree shutter) and keep one in eight.
# Discrete state (words, prices, typing) rounds to the nearest whole frame, so cuts never ghost.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 240 -q high -o renders/one-terminal-240.mp4
ffmpeg -v error -y -i renders/one-terminal-240.mp4 \
  -vf "tmix=frames=5:weights='1 1 1 1 1',select='eq(mod(n\,8)\,2)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart \
  renders/one-terminal.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/one-terminal.mp4
