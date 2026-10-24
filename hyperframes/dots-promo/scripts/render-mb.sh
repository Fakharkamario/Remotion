#!/usr/bin/env bash
# Motion-blurred render: sample the timeline at 480 fps, then average nine samples around each 30 fps frame
# (a 180-degree shutter) and keep one in sixteen. The voiceover is carried over from the high-rate render.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
npx --yes hyperframes@0.8.114 render -f 480 -q high -o renders/dots-promo-480.mp4
ffmpeg -v error -y -i renders/dots-promo-480.mp4 \
  -vf "tmix=frames=9:weights='1 1 1 1 1 1 1 1 1',select='eq(mod(n\,16)\,4)',setpts=N/30/TB" \
  -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart \
  renders/dots-promo.mp4
ffprobe -v error -show_entries stream=codec_type,nb_frames,r_frame_rate -of compact renders/dots-promo.mp4
