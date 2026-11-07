# The Man Who Taxed the Dead — production notes

- Final: `out/deadtax/the_man_who_taxed_the_dead.mp4` (1440x2560, 30 fps, 1690 frames, 56.3 s, h264 crf 16 + AAC).
  Not committed (out/ is git-ignored). Rebuild: render `DeadTaxShort` with
  `--scale=1.3333333333333333 --gl=swangle --concurrency=3 --timeout=600000` (pass
  `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
  where Remotion cannot download its own Chrome), then mux `shorts/deadtax/audio/mix.wav` with `-map 0:v:0 -map 1:a:0`.
- Code: `src/videos/deadtax/` — story.ts (26 shots, cameras, word cues W), village.ts (Russian village, church,
  graveyard, fields, palace square, bank), cast.ts (who does what per shot), narrator.ts (the user's Narrator:
  15 expressions, 11 poses, lip sync from lips.ts), russians.ts (Peter, peasants, babas, grandpa, collector, clerk,
  aristocrat, banker), props2d.ts (coins, tax roll, census book, check stamp, calendar pages).
- Voice: the user's ElevenLabs take. Pauses cut to 0.11 s and +4 % tempo (`voice/cut_silence.py`), forced-aligned
  with pocketsphinx (`voice/align.py`, no network model needed). Any new voice: re-run cut_silence, align, lips,
  re-time `W` in story.ts and make_audio.py.
- Sound: `audio/make_audio.py` -> mix.wav (-14 LUFS, about -1.3 dBTP), stems/, cues.md. Original D-minor score
  (tremolo plucks, tuba oom-pah), all SFX synthesized.
- Vertical-frame lesson: two characters side by side must stay within ~1 m laterally at 4-5 m from the lens or one
  falls out of the 9:16 frame. Stack them in depth instead.
- Houses blocking any camera sight line are culled (build.ts `blocked`); the grandfather's izba is exempt (door flag).
