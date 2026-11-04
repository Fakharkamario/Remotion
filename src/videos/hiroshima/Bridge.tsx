// "The Sweetest Disaster" (Great Molasses Flood, 1919), built on the bridge short's engine: an original 30 s short in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, SHOTS, layersAt, dofAt, COUNT, FLASH_F, WHITE_FULL, WHITE_HOLD, WHITE_OUT, FADE0, windowGlow, W } from "./story";
import "@fontsource-variable/inter";

export const HIRO_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("hiroshima kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => {
    const kids = [
      on.ink && <primitive key="ink" object={fx.ink} dispose={null} />,
      on.lens && on.pre && <primitive key="pre" object={fx.lens.pre} dispose={null} />,
      on.lens && <primitive key="lens" object={fx.lens.main} dispose={null} />,
      on.bloom && <primitive key="bloom" object={fx.bloom} dispose={null} />,
      <primitive key="tone" object={fx.tone} dispose={null} />,
      on.grade && <primitive key="grade" object={fx.grade} dispose={null} />,
      on.grain && <primitive key="grain" object={fx.grain} dispose={null} />,
    ].filter(Boolean) as React.ReactElement[];
    return <EffectComposer multisampling={4}>{kids}</EffectComposer>;
  }, [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** countdown beat: a big inked number that punches in, holds and fades (no other on-screen text) */
const Countdown: React.FC<{ f: number }> = ({ f }) => {
  let cur: [number, number] | null = null;
  for (const c of COUNT) if (f >= c[0] - 1) cur = c;
  if (!cur) return null;
  const age = f - (cur[0] - 1), next = COUNT.find((c) => c[0] > cur![0]);
  const life = Math.min(42, (next ? next[0] : 99999) - cur[0]);
  if (age >= life) return null;
  const pop = age < 4 ? [1.35, 1.18, 1.06, 1.0][age] : 1;
  const a = age < 2 ? 0.6 + 0.2 * age : age > life - 8 ? Math.max(0, (life - age) / 8) : 1;
  const red = cur[1] <= 10;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: "13%" }}>
      <div style={{ fontFamily: "'Inter Variable', sans-serif", fontWeight: 900, fontSize: 300, lineHeight: 1, letterSpacing: -8, color: red ? "#ffdfd2" : "#fff8ec",
        WebkitTextStroke: "14px #241726", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(${(cur[1] % 20 === 0 ? -1 : 1) * 3}deg)`, opacity: a,
        textShadow: "0 14px 0 rgba(36,23,38,0.55)" }}>{cur[1]}</div>
    </AbsoluteFill>
  );
};

export const HiroshimaShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  // the white: a hard pop on the detonation, building to full white, held, then opening onto the aftermath
  let white = 0;
  if (f >= FLASH_F && f < WHITE_HOLD) white = Math.min(1, 0.55 * (f < FLASH_F + 3 ? 1 : 0.6) + Math.pow(Math.max(0, (f - FLASH_F) / (WHITE_FULL - FLASH_F)), 1.4));
  else if (f >= WHITE_HOLD && f < WHITE_OUT) white = 1 - Math.pow((f - WHITE_HOLD) / (WHITE_OUT - WHITE_HOLD), 0.7);
  if (f >= W.one + 10 && f < FLASH_F) white = Math.max(white, 0.35 * windowGlow(f));
  const black = f >= FADE0 ? Math.min(1, (f - FADE0) / (TOTAL - 10 - FADE0)) : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {white > 0 && <AbsoluteFill style={{ background: "#fffaf0", opacity: white }} />}
      {white < 0.6 && <Countdown f={f} />}
      {black > 0 && <AbsoluteFill style={{ background: "#000000", opacity: black }} />}
    </AbsoluteFill>
  );
};
