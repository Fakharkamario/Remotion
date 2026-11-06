#!/bin/bash
# re-render the ranges whose depth of field went wrong (stale near plane), restartable
cd "$(dirname "$0")/.."
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
for r in 746-849 863-952 1085-1197 1328-1499 1595-1694; do
  f=out/sword/chunks/fix_$r.mp4; [ -s "$f" ] && continue
  npx remotion render src/index.ts SwordShort "$f.tmp.mp4" --frames=$r --scale=1.3333333333333333 --gl=swangle --concurrency=3 \
    --timeout=600000 --browser-executable=$B --codec=h264 --crf=16 --log=error && mv "$f.tmp.mp4" "$f" && echo "fix $r done $(date +%T)"
done
echo FIXDONE
