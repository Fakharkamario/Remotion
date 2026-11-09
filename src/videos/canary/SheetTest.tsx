// 2D check sheet of the canary cast drawings (no 3D): render with `npx remotion still src/index.ts CanarySheet`.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, bodySide, setBirdHook } from "./toon";
import { drawNarrator, NExpr, NPose } from "./narrator";
import { fxCage, bird, fxPick, fxGas, fxWatch } from "./fxcanary";
import { OLD, TOMMY, miner } from "./outfits";

setBirdHook((p, x, y, s, st) => bird(p, x, y, s, { lying: st < 0.5, eye: st < 0.5 ? "shut" : "dot", open: st > 0.5 ? 1 : 0 }));
export const SheetTest: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#e9e2d6"; g.fillRect(0, 0, 2400, 2000);
    const at = (x: number, y: number, s: number, fn: (p: Pen) => void) => { g.save(); g.translate(x, y); g.scale(s, s); fn(new Pen(g)); g.restore(); };
    const poses: [NPose, NExpr][] = [["stand", "smile"], ["pockets", "neutral"], ["point", "talk"], ["explain", "grin"], ["shrug", "worried"], ["think", "think"], ["walk", "shock"], ["wave", "whistle"]];
    poses.forEach(([pose, expr], i) => at(i * 300, 0, 0.5, (p) => drawNarrator(p, { pose, expr, phase: 0.2 })));
    at(0, 520, 0.5, (p) => bodyFront(p, OLD, { mode: "stand", expr: "whistle", prop: ["pick", 0.3], seed: 3 }));
    at(300, 520, 0.5, (p) => bodyFront(p, TOMMY, { mode: "stand", expr: "laugh", seed: 5 }));
    at(600, 520, 0.5, (p) => bodyFront(p, miner(2), { mode: "stand", expr: "grin", seed: 2 }));
    at(900, 520, 0.5, (p) => bodyFront(p, OLD, { mode: "stand", expr: "nervous", prop: ["bird", 0], seed: 3 }));
    at(1200, 520, 0.5, (p) => bodySide(p, OLD, { mode: "march", phase: 0.2, expr: "stern", reach: true, seed: 3 }));
    at(1500, 520, 0.5, (p) => bodySide(p, TOMMY, { mode: "march", phase: 0.6, expr: "nervous", leanAdd: -10, seed: 5 }));
    at(1800, 520, 0.5, (p) => bodyFront(p, TOMMY, { mode: "sit", expr: "pained", seed: 5 }));
    at(0, 1060, 0.6, (p) => fxCage(p, { open: 1 }));
    at(260, 1060, 0.6, (p) => fxCage(p, { eye: "dazed", tilt: 18 }));
    at(520, 1060, 0.6, (p) => fxPick(p));
    at(780, 1060, 0.6, (p) => fxWatch(p, 0.3));
    at(1040, 1060, 0.6, (p) => fxGas(p, 0.2, 0.6));
    at(1400, 1060, 1.2, (p) => drawNarrator(p, { pose: "explain", expr: "talk", mouth: 0.8 }));
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={2400} height={2000} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
