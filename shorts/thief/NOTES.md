# The Gentleman Thief — production notes

- Voice: the supplied ElevenLabs voice-over (unchanged), `voice/voice.wav` (48 kHz mono); word timings `voice/words.json`
  from faster-whisper medium.en (`voice/transcribe.py`). Every shot / reaction in `src/videos/thief/story.ts` is keyed
  to those word onsets.
- Picture: `src/videos/thief/` (composition `ThiefShort`, 1080x1920, 30 fps, 2650 frames = 88.3 s), built on the
  cartoon-3d-short engine: three.js world + flat 2D characters drawn per frame on canvases (not cut-out PNGs: every
  pose, walk cycle, blink and expression is drawn live from `toon.ts`).
  - `people.ts`: the narrator from the character sheet (curly hair cloud, round eyes, black hoodie with drawstrings
    and kangaroo pocket, grey jeans, skin-tone hands), police, chief, townsfolk.
  - `toon.ts`: added curls, round eyes + nose, hoodie, sheet poses (point, think, shrug, scratch, hold, holdUp,
    belly, pockets, reach, post, press, cheer, slap, two), held items, prop/insert drawings (newspaper, note,
    ID card, soap imprint, stopwatch, key).
  - `build.ts` buildCity / buildRooms: main street, police station with blue lamp, cars, lamps, red post box, the
    owner's 3D door/lock/window, night window glows; den, kitchen, dining room interiors.
  - `world.ts`: sets per shot, 3D wallet pile (instanced, grows 100/200/300), door swing, moon at night.
  - `lights.ts` / `grade.ts`: added `night` and `room` presets.
- Sound: `audio/make_audio.py` -> `mix.wav` (-14.4 LUFS, -1.0 dBTP), stems/, cues.md. Original caper score + SFX.
- Render: `scripts/render_thief.sh` (chunked, resumable) then concat + mux mix.wav with `-map 0:v:0 -map 1:a:0`.
  ~4.3 s/frame at 1080x1920 with software WebGL on 4 CPUs (~3.2 h). A 2K (1440x2560) render would take ~6 h here.
- Test sheet of the characters: composition `ThiefChars`.
- No on-screen captions (cartoon-3d-short rule); the reference video's word captions were not copied.
