#!/usr/bin/env bash
# Motion-blurred render: sample at 240 fps, average the 5 samples around each 30 fps frame (180-degree shutter).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 240 -q high -w "${WORKERS:-3}" -o renders/goat-perps-opener-240.mp4
ffmpeg -v error -y -i renders/goat-perps-opener-240.mp4 \
  -vf "tmix=frames=5:weights='1 1 1 1 1',select='eq(mod(n\,8)\,2)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart \
  renders/goat-perps-opener.mp4
ffprobe -v error -show_entries stream=nb_frames,r_frame_rate -of compact renders/goat-perps-opener.mp4
