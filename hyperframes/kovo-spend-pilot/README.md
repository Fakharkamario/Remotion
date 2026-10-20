# Kovo Spend Pilot — promo

A 47 s, 30 fps, 1920×1080 promo for **Kovo Spend Pilot**, an AI copilot that catches out-of-policy company spending before a card is charged. The shot list, timing and camera moves follow a reference edit frame by frame. The brand, logo, mascot, UI and copy are all new. There are no captions.

| frames | beat |
| --- | --- |
| 0–40 | kovo logo; the coin dot drops out of the mark and rolls away |
| 40–140 | "Meet Kovo" / "Spend Pilot" lands word by word; coin-bots float in; a giant bot rises under the title |
| 140–231 | camera rises: the bot turns to camera, coins and receipts burst out, dashed rings, white-out |
| 231–355 | vendor table: extreme close-up on a "Card" cell, whip back; approval statuses light up |
| 355–463 | dashboard close-up, the whole app on the sky, then a table close-up with a cursor |
| 463–627 | graph: the Marketing Card links out to Vendors and Budgets; the groups open and fill |
| 627–730 | the Orbit Travel panel slides in, the page pulls back into a window and tips away |
| 730–834 | a chat app: someone asks for 12 first-class flights on the marketing card; "Purchase paused" |
| 834–954 | the activity page in Kovo: risky words turn red, scroll down to the "Blocked" tool response |
| 954–1067 | a spend-alerts card on the sky between two coin-bots, then a close pan over its table |
| 1067–1160 | "Control spending" + "before the card is charged"; hills with coin stacks and bots rise |
| 1160–1243 | the card's header steps Critical → High → Medium → Low → Approved |
| 1243–1340 | "Get started at kovo.app/spend-pilot" |
| 1340–1410 | a bot flies into the mark and the logo builds |

Everything is drawn in `assets/scene.js` as a pure function of the frame (`window.__render(frame)`), with positions, scales and blur keyed as `[frame, value]` tables measured off the reference. All names, vendors and numbers in the UI are fictional. No audio track.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Plain render: `npx --yes hyperframes@0.8.114 render -o renders/kovo-30.mp4`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/kovo-spend-pilot.mp4`)
