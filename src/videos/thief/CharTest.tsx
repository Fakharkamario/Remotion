// Test sheet of the narrator and cast drawings (not part of the film).
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, bodySide, FrontOpts, SideOpts } from "./toon";
import { NARRATOR, COP, citizen } from "./people";

const CELLS: { side?: boolean; o: typeof NARRATOR; fo?: FrontOpts; so?: SideOpts }[] = [
  { o: NARRATOR, fo: { mode: "stand", expr: "smile", pose: "pockets" } },
  { o: NARRATOR, fo: { mode: "stand", expr: "neutral" } },
  { o: NARRATOR, fo: { mode: "stand", expr: "grin", pose: "point" } },
  { o: NARRATOR, fo: { mode: "stand", expr: "think", pose: "think" } },
  { o: NARRATOR, fo: { mode: "stand", expr: "shock", pose: "shrug" } },
  { o: NARRATOR, fo: { mode: "stand", expr: "wink", pose: "holdUp", item: "note" } },
  { o: NARRATOR, fo: { mode: "stand", expr: "content", pose: "hold", item: "walletOpen" } },
  { o: NARRATOR, fo: { mode: "stroll", phase: 0.2, expr: "talk", look: 1 } },
  { side: true, o: NARRATOR, so: { mode: "march", phase: 0.3, stride: 0.8, stomp: 0.6, expr: "smile", item: "wallet" } },
  { side: true, o: citizen(2), so: { mode: "march", phase: 0.6, stride: 0.8, stomp: 0.6, expr: "smile", wallet: true } },
  { o: COP, fo: { mode: "stand", expr: "laugh", pose: "belly" } },
  { o: citizen(1), fo: { mode: "stand", expr: "shock", pose: "hold", item: "letters" } },
];
const Cell: React.FC<{ i: number }> = ({ i }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, 600, 1000);
    const c = CELLS[i], p = new Pen(g);
    if (c.side) bodySide(p, c.o, c.so ?? {}); else bodyFront(p, c.o, c.fo ?? {});
  }, [i]);
  return <canvas ref={ref} width={600} height={1000} style={{ width: 360, height: 600, background: "#e8e0d2", margin: 0 }} />;
};
export const CharTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#f3efe6", flexDirection: "row", flexWrap: "wrap" }}>
    {CELLS.map((_, i) => <Cell key={i} i={i} />)}
  </AbsoluteFill>
);
