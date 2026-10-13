#!/usr/bin/env bash
# Motion-blurred render, as the reference looks shot on a camera: sample the timeline at 120 fps, average the three
# samples around each 30 fps frame (t-1/4 .. t+1/4 of a frame, a 180-degree shutter) and keep one in four.
# Words, scene cuts and the cutouts all key off whole frames, so cuts stay clean.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 120 -q high -o renders/stock-five-4-120.mp4
ffmpeg -v error -y -i renders/stock-five-4-120.mp4 \
  -vf "tmix=frames=3:weights='1 1 1',select='eq(mod(n\,4)\,1)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart \
  renders/stock-five-4.mp4
rm renders/stock-five-4-120.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/stock-five-4.mp4
