#!/bin/bash
# usage: render_chunk.sh <start> <end> <name>
cd /home/user/Remotion
npx remotion render src/index.ts TitanicShort out/titanic/$3.mp4 --frames=$1-$2 --codec h264 --crf 16 --scale=1.3333333333333333 --gl=swangle --concurrency=2 --timeout=600000 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell > out/titanic/$3.log 2>&1
