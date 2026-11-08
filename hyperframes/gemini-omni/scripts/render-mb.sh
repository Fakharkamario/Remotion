#!/usr/bin/env bash
# Motion-blurred final render: sample the timeline at 120 fps, average the three samples around each 30 fps frame
# (a 180-degree shutter) and keep one in four, so fast moves blur like camera footage.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 120 -q high -o renders/gemini-omni-120.mp4
ffmpeg -v error -y -i renders/gemini-omni-120.mp4 \
  -vf "tmix=frames=3:weights='1 1 1',select='eq(mod(n\,4)\,1)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart \
  renders/gemini-omni.mp4
rm renders/gemini-omni-120.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/gemini-omni.mp4
