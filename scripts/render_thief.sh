#!/bin/bash
# chunked final render of ThiefShort at 1080x1920 (resumable: finished chunks are skipped)
cd /home/user/Remotion
export TEMP=/tmp/claude-0/-home-user-Remotion/0101c2a5-c534-58ac-b0fb-9293a0134fe2/scratchpad/rtmp TMP=$TEMP
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out/thief/chunks
for r in 0-399 400-799 800-1199 1200-1599 1600-1999 2000-2399 2400-2649; do
  o=out/thief/chunks/c_${r}.mp4
  [ -f "$o" ] && continue
  npx remotion render src/index.ts ThiefShort out/thief/chunks/tmp.mp4 --frames=$r --codec=h264 --crf=16 --gl=swangle --concurrency=4 \
    --browser-executable=$B --timeout=600000 --log=error > out/thief/chunks/log_${r}.txt 2>&1 && mv out/thief/chunks/tmp.mp4 "$o"
  echo "chunk $r done $(date +%T)" >> out/thief/chunks/progress.txt
done
echo ALLDONE >> out/thief/chunks/progress.txt
