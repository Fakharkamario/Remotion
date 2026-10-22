# (Messenger version) Gigi AI — launch chat

A 9.77 s, 30 fps, 1920×1080 clip. The motion follows a reference chat edit shot for shot. The content is new. This copy of `../gigi-launch` restyles the chat as a full-screen messenger: rounded white incoming bubbles and a pale-green outgoing "On it", each with a time stamp (and read ticks on ours), on the doodle wallpaper in `assets/img/doodle.jpg`. The wallpaper sits behind the chat only and slides off with it as the board comes in. The motion, the board and the "Working" ending are unchanged:

| frames | beat |
| --- | --- |
| 0–100 | "hey aizal" drops in huge and tilted. The camera pulls back while a typing bubble becomes "need a launch video", then "quick" pops in |
| 100–150 | whip up-left. A blue typing bubble flies in from the right and becomes "On it", then the 🔥 badge pops on |
| 150–186 | pull back to the whole chat. The cursor flies in and grabs "need a launch video" |
| 186–238 | the chat whips off left and the board slides in under the held message. The message drops into To do as the "Launch video for gigi ai" card |
| 238–293 | the board pans off right. "Working" slides in, fills black left to right, and lifts away |

Everything is drawn in `assets/scene.js` as a pure function of the frame. Each bubble, the badge, the cursor, the board and the end line follow tracks measured from the reference frame by frame, stored in `assets/ref-keys.js`. The reference is 24 fps footage with every fifth frame doubled, so the tracks keep one row per real frame at its true time and a monotone cubic runs through them. The result keeps the reference's speed curves and plays smoothly at 30 fps.

To re-measure, extract the reference frames as `f001.png`… and run `scripts/measure/track.py <frames> track.json`, `keys.py track.json keys.json` and `emit.py keys.json assets/ref-keys.js`. The fire badge uses `assets/img/fire.png`. No audio track.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh`. It samples at 240 fps with a 360° shutter and outputs `renders/gigi-launch.mp4`.
