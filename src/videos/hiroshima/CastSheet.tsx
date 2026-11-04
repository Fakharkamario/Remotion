// test sheet: the cast drawn flat (not part of the film)
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Pen, bodyFront, NARRATOR, GRANDPA, GRANDMA, jkid, jfolk, FrontOpts, Outfit } from "./toon";
const ITEMS: [Outfit, FrontOpts][] = [
  [NARRATOR, { mode: "stand", expr: "smile", pose: "pocket" }],
  [NARRATOR, { mode: "stand", expr: "talk", pose: "point", k: 0.5 }],
  [NARRATOR, { mode: "stand", expr: "think", pose: "chin", look: 1, lookY: -1 }],
  [NARRATOR, { mode: "stand", expr: "shock", pose: "shrug" }],
  [NARRATOR, { mode: "stand", expr: "worry", pose: "brow", lookY: -1, headTilt: -6 }],
  [NARRATOR, { mode: "stand", expr: "sad", pose: "pocket" }],
  [GRANDPA, { mode: "sit", expr: "smile_closed", pose: "paper" }],
  [GRANDMA, { mode: "sit", expr: "laugh", pose: "cup", k: 0.2 }],
  [GRANDPA, { mode: "stand", expr: "worry", pose: "reach", k: 1, lookY: -1 }],
  [GRANDMA, { mode: "stand", expr: "smile", pose: "pat", k: 0.3 }],
  [jkid(0), { mode: "march", expr: "grin", phase: 0.2 }],
  [jkid(1), { mode: "march", expr: "laugh", phase: 0.6 }],
  [jfolk(0), { mode: "stand", expr: "neutral" }],
  [jfolk(1), { mode: "stand", expr: "smile" }],
  [GRANDMA, { mode: "sit", expr: "smile", pose: "cup", k: 1 }],
];
export const CastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#cfd2d6"; g.fillRect(0, 0, 1800, 2000);
    ITEMS.forEach(([o, fo], i) => {
      g.setTransform(0.6, 0, 0, 0.6, (i % 5) * 360, Math.floor(i / 5) * 640);
      bodyFront(new Pen(g), o, { light: (-120 * Math.PI) / 180, seed: 3, ...fo });
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
  }, [f]);
  return <AbsoluteFill><canvas ref={ref} width={1800} height={2000} /></AbsoluteFill>;
};
