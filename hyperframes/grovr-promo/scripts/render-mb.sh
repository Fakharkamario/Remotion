#!/usr/bin/env bash
# Motion-blurred render. HyperFrames renders at most 240 fps, so this renders two 240 fps passes, the second
# shifted by half a sample (1/480 s), interleaves them into 480 samples a second, averages the nine samples
# around each 30 fps frame (a 180-degree shutter) and keeps one in sixteen. The soundtrack comes from pass A.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
HF="npx --yes hyperframes@0.8.114"
$HF render -f 240 -q high -o renders/pass-a.mp4
B=$(mktemp -d)
cp -r index.html hyperframes.json meta.json package.json assets "$B"/
sed -i 's/const SUB = 0;/const SUB = 0.0625;/' "$B/assets/scene.js"
(cd "$B" && $HF render -f 240 -q high -o pass-b.mp4)
mv "$B/pass-b.mp4" renders/pass-b.mp4
rm -rf "$B"
ffmpeg -v error -y -i renders/pass-a.mp4 -i renders/pass-b.mp4 -filter_complex \
  "[0:v]setpts=2*N/480/TB[a];[1:v]setpts=(2*N+1)/480/TB[b];[a][b]interleave,tmix=frames=9:weights='1 1 1 1 1 1 1 1 1',select='eq(mod(n\,16)\,4)',setpts=N/30/TB[v]" \
  -map "[v]" -map 0:a -r 30 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart \
  renders/grovr-promo-mb.mp4
rm -f renders/pass-a.mp4 renders/pass-b.mp4
ffprobe -v error -show_entries stream=codec_type,nb_frames,r_frame_rate -of compact renders/grovr-promo-mb.mp4
