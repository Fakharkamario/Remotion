# AI Mentor — gold orb reveal

A 7.4 s, 30 fps (222 frame) frame-by-frame recreation of the "Meet AI Mentor" trading-coach clip, with the
reference's yellow gold pushed a little warmer toward amber / copper.

- 0–86: the orb blooms; six stat cards fly out of it and count up, drift, then whip round
- 87–141: "Meet" glides in, "AI Mentor" decodes out of glyph noise, the orb swings in, the words split away
- 141–221: the orb dives left, "Personal" + a typed "Trading Coach" pill slide in, a gold slab flips up into
  the glass AI Mentor card, "On demand" flickers in, and the card tips away in 3D

Every position, size, angle and count comes from keyframe tables measured off the reference video
(`assets/scene.js`), joined with monotone cubic splines. After the flip, the card is pinned to the reference's
measured corners through a projective (matrix3d) transform, and the orb rides a point on that card face.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/ai-mentor.mp4`)
