// character sheet for the narrator (not part of the film): hero pose, turnaround, poses, expressions, palette
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "@fontsource-variable/inter";
import { Pen, bodyFront, NARRATOR, FrontOpts, Expr } from "./toon";

const SW = 2400, SH = 1600;
const LIGHT = (-120 * Math.PI) / 180;
const BG = "#f3eee4", PANEL = "#e6dfd1", INKT = "#241726", SUB = "#6b6157";

type Item = { x: number; y: number; s: number; o: FrontOpts; clip?: [number, number, number, number] };
const TURN: Item[] = [
  { x: 770, y: 250, s: 0.5, o: { mode: "stand", expr: "smile", pose: "pocket", facing: -1 } },
  { x: 1000, y: 250, s: 0.5, o: { mode: "stand", expr: "smile", pose: "pocket" } },
  { x: 1230, y: 250, s: 0.5, o: { mode: "stand", expr: "smile", pose: "pocket", facing: 1 } },
];
const POSES: [FrontOpts, string][] = [
  [{ mode: "stand", expr: "talk", pose: "point", k: 0.6 }, "point"],
  [{ mode: "stand", expr: "think", pose: "chin", look: 1, lookY: -1 }, "think"],
  [{ mode: "stand", expr: "shock", pose: "shrug" }, "shrug"],
  [{ mode: "stand", expr: "worry", pose: "brow", lookY: -1, headTilt: -6 }, "look up"],
  [{ mode: "stand", expr: "smileA", pose: "open" }, "explain"],
  [{ mode: "stroll", expr: "smile", phase: 0.25 }, "walk"],
];
const EXPR: [Expr, string, Partial<FrontOpts>][] = [
  ["neutral", "neutral", {}], ["smile", "smile", {}], ["laugh", "laugh", {}], ["talk", "talking", {}],
  ["think", "thinking", { look: 1, lookY: -1 }], ["worry", "worried", {}], ["sad", "sad", {}], ["sadO", "sad, talking", {}],
  ["shock", "shocked", {}], ["squint", "squint", {}], ["grin", "grin", {}], ["dazed", "dazed", {}],
  ["smile_closed", "content", {}], ["nervous", "nervous", {}], ["relief", "relieved", {}], ["stern", "serious", {}],
];
const PALETTE: [string, string][] = [
  ["#4a3226", "Curls"], ["#f6dcc6", "Skin"], ["#2e2e34", "Hoodie"], ["#6a6e78", "Jeans"], ["#2a2c34", "Shoes"], ["#8a8e98", "Soles"],
];

const draw = (g: CanvasRenderingContext2D, x: number, y: number, s: number, o: FrontOpts, clip?: [number, number, number, number]) => {
  g.save();
  g.setTransform(s, 0, 0, s, x - 300 * s, y);
  if (clip) { g.beginPath(); g.rect(clip[0], clip[1], clip[2] - clip[0], clip[3] - clip[1]); g.clip(); }
  if (!clip && o.mode !== "sit") { // soft contact shadow
    g.fillStyle = "rgba(60,40,30,0.16)"; g.beginPath(); g.ellipse(300, 978, 120, 16, 0, 0, Math.PI * 2); g.fill();
  }
  bodyFront(new Pen(g), NARRATOR, { light: LIGHT, seed: 3, ...o });
  g.restore();
};

const T: React.FC<{ x: number; y: number; size?: number; w?: number; c?: string; center?: boolean; children: React.ReactNode }> =
  ({ x, y, size = 26, w = 600, c = SUB, center, children }) => (
    <div style={{ position: "absolute", left: center ? x - 200 : x, top: y, width: center ? 400 : undefined, textAlign: center ? "center" : "left",
      fontFamily: "'Inter Variable', sans-serif", fontSize: size, fontWeight: w, color: c, letterSpacing: size > 40 ? -1.5 : 0.3 }}>{children}</div>
  );

const POSE_X0 = 820, POSE_DX = 270, POSE_Y = 905, POSE_DY = 320, EXP_X0 = 1545, EXP_Y0 = 235, EXP_DX = 200, EXP_DY = 290;
const poseXY = (i: number) => [POSE_X0 + (i % 3) * POSE_DX, POSE_Y + Math.floor(i / 3) * POSE_DY];

export const NarratorSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = BG; g.fillRect(0, 0, SW, SH);
    const panel = (x: number, y: number, w: number, h: number) => { g.fillStyle = PANEL; g.beginPath(); g.roundRect(x, y, w, h, 28); g.fill(); };
    panel(40, 170, 600, 1390); panel(670, 170, 830, 640); panel(670, 840, 830, 720); panel(1530, 170, 830, 1240); panel(1530, 1440, 830, 120);
    draw(g, 340, 250, 1.25, { mode: "stand", expr: "smile", pose: "pocket", look: 0.3 });
    TURN.forEach((t) => draw(g, t.x + 85, t.y + 20, t.s, t.o));
    POSES.forEach(([o], i) => { const [x, y] = poseXY(i); draw(g, x, y, 0.27, o); });
    EXPR.forEach(([e, , extra], i) => {
      const cx = EXP_X0 + 110 + (i % 4) * EXP_DX, cy = EXP_Y0 + Math.floor(i / 4) * EXP_DY;
      g.save(); g.beginPath(); g.arc(cx, cy + 92, 98, 0, Math.PI * 2); g.fillStyle = "#f4efe6"; g.fill(); g.clip();
      draw(g, cx, cy - 75, 0.62, { mode: "stand", expr: e, pose: "pocket", ...extra });
      g.restore();
      g.beginPath(); g.arc(cx, cy + 92, 98, 0, Math.PI * 2); g.strokeStyle = "#cfc5b3"; g.lineWidth = 4; g.stroke();
    });
    PALETTE.forEach(([c], i) => {
      const x = 1560 + i * 134, y = 1470;
      g.fillStyle = c; g.strokeStyle = INKT; g.lineWidth = 4; g.beginPath(); g.roundRect(x, y, 44, 44, 10); g.fill(); g.stroke();
    });
  }, [f]);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <canvas ref={ref} width={SW} height={SH} />
      <T x={44} y={46} size={64} w={900} c={INKT}>The Narrator</T>
      <T x={48} y={122} size={26} w={500}>Character sheet · "60s Before Nuke… (Japan)" · curly top, round eyes, black hoodie, grey jeans</T>
      <T x={70} y={192} size={24} w={800} c={INKT}>HERO POSE</T>
      <T x={700} y={192} size={24} w={800} c={INKT}>TURNAROUND</T>
      {["3/4 left", "front", "3/4 right"].map((l, i) => <T key={l} x={TURN[i].x + 85} y={770} size={22} center>{l}</T>)}
      <T x={700} y={862} size={24} w={800} c={INKT}>POSES</T>
      {POSES.map(([, l], i) => <T key={l} x={poseXY(i)[0]} y={poseXY(i)[1] + 272} size={22} center>{l}</T>)}
      <T x={1560} y={192} size={24} w={800} c={INKT}>EXPRESSIONS</T>
      {EXPR.map(([e, l], i) => <T key={e} x={EXP_X0 + 110 + (i % 4) * EXP_DX} y={EXP_Y0 + Math.floor(i / 4) * EXP_DY + 196} size={22} center>{l}</T>)}
      {PALETTE.map(([c, l], i) => (
        <React.Fragment key={c}>
          <div style={{ position: "absolute", left: 1612 + i * 134, top: 1468, fontFamily: "'Inter Variable', sans-serif", fontSize: 18, fontWeight: 700, color: INKT }}>{l}</div>
          <div style={{ position: "absolute", left: 1612 + i * 134, top: 1492, fontFamily: "ui-monospace, monospace", fontSize: 15, color: SUB }}>{c}</div>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
