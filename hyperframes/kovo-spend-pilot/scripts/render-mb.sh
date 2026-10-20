#!/usr/bin/env bash
# Motion-blurred render: sample the timeline at 120 fps, then average the three samples around each
# 30 fps frame (t-1/4 .. t+1/4 of a frame, a 180-degree shutter) and keep one in four.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 120 -q high -o renders/kovo-spend-pilot-120.mp4
ffmpeg -v error -y -i renders/kovo-spend-pilot-120.mp4 \
  -vf "tmix=frames=3:weights='1 1 1',select='eq(mod(n\,4)\,1)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart \
  renders/kovo-spend-pilot.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/kovo-spend-pilot.mp4
