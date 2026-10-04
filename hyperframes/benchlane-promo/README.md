# benchlane promo (HyperFrames)

A 48.6 s, 1920x1080 / 30 fps HyperFrames recreation of a hiring-platform promo. Every beat of
the reference's motion (cuts, word drop-ins, camera pulls, pixel-ring wipes, cursor clicks,
card scrolls) is matched to its timing. The content is new:

- **Brand:** *benchlane*, a mock company with its own two-corner logo mark.
- **Copy:** all lines rewritten.
- **Icons:** an original set (ripple, atom, wave, `</>`, cube, dots, prism, bolt, "devkit").
- **Mascot:** an original pixel robot head ("Volt").
- **Sample project:** a mock recipe-planner brief for "Acme Kitchen Co." driven through a
  fictional `forge-cli` agent.
- **Backdrops:** generated CSS/canvas gradients instead of photos.
- **Soundtrack:** synthesized in this project (see `scripts/make_audio.py`).

| time (s)    | composition          | beat |
|-------------|----------------------|------|
| 0.00–1.80   | `intro`              | "Teams now build *differently*", stepped camera pull-back, pink pixel noise |
| 1.80–4.50   | `icons`              | orange tiles rush in, resolve into app icons, field orbits around "alongside AI" |
| 4.50–10.67  | `words`              | glyph scramble → "Yet interviews still live in 2015." → words drop out → "Old-school coding quizzes" + code confetti → "< can't reveal how >" → dot grid "developers *truly* build now" → pixel ring burst → "Meet" corners |
| 10.67–12.67 | `logo-dark`          | corners snap into the mark, wordmark types in → "Find the real *builders*" |
| 12.67–14.23 | `cards`              | achievement cards scroll over a warm backdrop, staircase whip |
| 14.23–16.93 | `errors`             | "and the *autopilots*" → agent terminal swarmed by red error chips |
| 16.93–21.27 | `assign`             | "Assign [tile] a project" click → perspective window → brief page → whip into header → pill → agent avatars |
| 21.27–23.10 | `start`              | candidate cursor clicks "Start project" |
| 23.10–26.40 | `term`               | mascot prompt, cut-zoom, typed command with camera follow |
| 26.40–28.93 | `ide`                | IDE with editor + agent panel |
| 28.93–30.53 | `submit`             | Submit click, dark pixel ring, paper plane flies off |
| 30.53–31.57 | `watch`              | "Replay the whole *session*" zoom-out |
| 31.57–36.97 | `replay`             | Final build / Source / Agent workflow / AI review card stack |
| 36.97–39.07 | `review`             | "AI agents ◌ *grade* every session" band with pixel glows |
| 39.07–40.47 | `checklist`          | skills checklist ticking down |
| 40.47–42.97 | `calendar`           | meeting cards fly past "so you interview less", collapse between "and … hire" |
| 42.97–44.37 | `best`               | "with hard *evidence*." pill, wipe out |
| 44.37–45.97 | `logo-end`           | mark darkens, wordmark slides out from behind it |
| 45.97–48.57 | `final`              | "Hire on *proof,* not puzzles" |

```
index.html            root: mounts every scene + the soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/fx.js          shared helpers: seeded RNG, word-slot line builder, pixel rings, mark, mascot, icons
assets/audio.m4a      synthesized soundtrack (regenerate with scripts/make_audio.py)
assets/fonts, vendor  Inter, Newsreader Italic, JetBrains Mono and GSAP, stored locally
```

Lines are built from "slots" (`FX.line`): each word sits in an inline-grid whose column
tweens `0fr → 1fr`, so a centred line re-centres smoothly as words arrive, without measuring text.

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/benchlane-promo.mp4
python3 scripts/make_audio.py && ffmpeg -y -i assets/audio.wav -c:a aac -b:a 160k assets/audio.m4a && rm assets/audio.wav
```

If Chrome isn't installed, either run `npx hyperframes browser ensure` or point
`HYPERFRAMES_BROWSER_PATH` at an existing headless Chrome.

`check` reports text overlap in `calendar` at 42.3–42.95s, where the cards collapse into one
another on purpose. It also flags low contrast on the faint category labels in the mock UI.
Both are intended.
