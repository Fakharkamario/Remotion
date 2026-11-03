# Why the Titanic Was Horrifying — production notes

- Final: `out/titanic/titanic_short.mp4` (1440x2560, 30 fps, 1350 frames, 45.0 s, h264 crf 16 + AAC 256k).
  Not committed (out/ is git-ignored). Rebuild:
  `npx remotion render src/index.ts TitanicShort out/titanic/video.mp4 --codec h264 --crf 16 --scale=1.3333333333333333 --gl=swangle --concurrency=2 --timeout=600000 --browser-executable=<chrome-headless-shell>`
  then mux `shorts/titanic/audio/mix.wav` with `-map 0:v:0 -map 1:a:0`.
- Host: the user's own character, cut from the supplied sheet (`host_sheet.jpg`) by `cut_host.py` into
  `public/titanic/host_{front,three,smile,shock,think,laugh}.png` (flood-filled background, largest blob kept, Lanczos
  upscale 2x/3x + light unsharp). They are unlit cards tinted per light (cast.ts `hostBody` / `hostBust`); the busts are
  held 0.78 m in front of the lens (`BUST_D`) and fill the frame width.
- Code: `src/videos/titanic/` (story.ts = shots, cameras, ship sinking pose, iceberg; world.ts = sea, sky + stars,
  the ship in two halves, iceberg, lifeboats, cabin + corridor sets; cast.ts = passengers, crew, band, the host).
  Light "day" is the moonless night outside, "golden" the lamp-lit interiors; `dark` per shot dims for the blackout.
- Voice: stand-in espeak-ng + MBROLA us2 (`voice/make_voice.py`, gaps stretched to 45.0 s). To use a real voice,
  replace voice.wav + words.json, re-time story.ts frames to the new words, then re-run `audio/make_audio.py`.
- Sound: `audio/make_audio.py` -> mix.wav (-14 LUFS, -1.0 dBTP), stems/, cues.md. Needs scipy.
- Facts and script with sources: `SCRIPT.md`.
- Rendering: one full 2K render takes ~2.2 h here and is killed by the 2 h background-job limit, so render in chunks with
  `shorts/titanic/render_chunk.sh <start> <end> <name>` (0-449, 450-899, 900-1349) and join with the ffmpeg concat demuxer.
- QA fix: the shot-11 camera rides with the sinking ship and dipped under the sea at f661 (sea vanished). Lifted it 4 m.
