#!/bin/bash
# usage: shorts/titanic/stills.sh <round> <frames,...>  -> out/titanic/<round>/x_<f>.jpg + out/titanic/sheet_<round>.jpg
cd "$(dirname "$0")/../.." || exit 1
export BROWSER_EXE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell COMP=TitanicShort
mkdir -p out/titanic/$1
node scripts/bridge-stills.mjs out/titanic/$1/x_ $2 0.5 2>&1 | grep "still\|rror" | grep -v "toNonIndexed"
files=$(echo $2 | tr ',' '\n' | sed "s#^#out/titanic/$1/x_#; s#\$#.jpg#")
python3 shorts/titanic/sheet.py out/titanic/sheet_$1.jpg ${3:-6} 260 $files
