#!/bin/bash
# Full 2K render of SwordShort in chunks (restartable: finished chunks are skipped), then concat + mux the mix.
set -e
cd "$(dirname "$0")/.."
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out/sword/chunks
for r in 0-424 425-849 850-1274 1275-1694; do
  f=out/sword/chunks/c_$r.mp4
  [ -s "$f" ] && continue
  npx remotion render src/index.ts SwordShort "$f.tmp.mp4" --frames=$r --scale=1.3333333333333333 --gl=swangle --concurrency=3 \
    --timeout=600000 --browser-executable=$B --codec=h264 --crf=16 --log=error
  mv "$f.tmp.mp4" "$f"
  echo "chunk $r done $(date +%T)"
done
for r in 0-424 425-849 850-1274 1275-1694; do echo "file 'c_$r.mp4'"; done > out/sword/chunks/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/sword/chunks/list.txt -c copy out/sword/video.mp4
ffmpeg -v error -y -i out/sword/video.mp4 -i shorts/sword/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest out/sword/how_sharp_can_a_sword_get.mp4
echo ALL DONE
