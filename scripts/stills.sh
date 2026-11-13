#!/bin/bash
# usage: scripts/stills.sh <COMP> <outPrefix> <frames> [scale]
export REMOTION_TMP=/tmp/claude-0/-home-user-Remotion/0101c2a5-c534-58ac-b0fb-9293a0134fe2/scratchpad/rtmp
export BROWSER_EXE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
COMP=$1 node scripts/bridge-stills.mjs "$2" "$3" "${4:-0.5}" 2>&1 | grep -v "Memory reported\|inadvertently\|Using the lower\|deprecated" 
