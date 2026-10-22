#!/usr/bin/env bash
# Motion-blurred render: sample the timeline at 240 fps, then average the three samples around each
# 30 fps frame (a short ~135-degree shutter: the reference stays crisp through its moves) and keep one in eight.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 240 -q high -o renders/gigi-type-240.mp4
ffmpeg -v error -y -i renders/gigi-type-240.mp4 \
  -vf "tmix=frames=3:weights='1 1 1',select='eq(mod(n\,8)\,1)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart \
  renders/gigi-type.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/gigi-type.mp4
