# Gigi AI — launch chat

A 9.77 s, 30 fps, 1920×1080 clip. The motion follows a reference chat edit shot for shot. The content is new and the UI is white with black accents:

| frames | beat |
| --- | --- |
| 0–100 | "hey aizal" drops in huge and tilted. The camera pulls back while a typing bubble becomes "need a launch video", then "quick" pops in |
| 100–150 | whip up-left. A blue typing bubble flies in from the right and becomes "On it", then the 🔥 badge pops on |
| 150–186 | pull back to the whole chat. The cursor flies in and grabs "need a launch video" |
| 186–238 | the chat whips off left and the board slides in under the held message. The message drops into To do as the "Launch video for gigi ai" card |
| 238–293 | the board pans off right. "Working" slides in, fills black left to right, a spinner joins, and it lifts away |

Everything is drawn in `assets/scene.js` as a pure function of the frame. The camera, cursor, board and end-line paths are dense `[frame, value]` tables read off the reference and run through a monotone cubic. The fire badge uses `assets/img/fire.png`. No audio track.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-launch.mp4`)
