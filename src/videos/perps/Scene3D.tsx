// The 3D layer: camera rig per shot, trader silhouette + live screens, glass market cards, the extruded chrome
// shield, the 24h dial and the week of day cards. Depth of field (thin lens) + bloom come from the shared
// molasses post passes.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect } from "postprocessing";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { LensBlur } from "../molasses/lensblur";
import { Brand, ease, easeIn, easeOut, mix, span } from "./brand";
import { shotAt, local, ShotId } from "./timeline";
import { SOFT_H, SOFT_W, softCard, Screen, dialFaceTex } from "./tex";

type V3 = [number, number, number];
type Rig = { pos: V3; look: V3; fov: number; cInf: number; focus?: number };

const lerp3 = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

// ---------------- camera per shot (t = local frame) ----------------
const RIG: Record<ShotId, (t: number) => Rig> = {
  "1A": (t) => {
    const push = ease(span(t, 0, 40));
    const dive = easeIn(span(t, 36, 52));
    let pos = lerp3([-0.32, 1.52, 2.0], [-0.2, 1.47, 1.6], push);
    pos = lerp3(pos, [0.0, 1.4, -0.6], dive);
    const look: V3 = lerp3([0.12, 1.3, -1.0], [0, 1.4, -1.0], dive);
    const head = Math.hypot(pos[0] - TRADER_X, pos[1] - 1.32, pos[2]);
    return { pos, look, fov: 34, cInf: mix(26, 8, dive), focus: mix(head, 1.0, dive) };
  },
  "1B": (t) => {
    const k = ease(span(t, 0, 40));
    return { pos: lerp3([-0.25, 0.08, 6.1], [0.2, -0.04, 5.5], k), look: [0.15, 0, 0], fov: 36, cInf: 40, focus: mix(6.0, 5.4, k) };
  },
  "1C": (t) => {
    const k = ease(span(t, 0, 36));
    return { pos: lerp3([0.25, 0, 5.4], [0.1, 0, 5.0], k), look: [0, 0, 0], fov: 36, cInf: 70, focus: 1.2 };
  },
  "1D": (t) => {
    const sh = t > 6 && t < 14 ? Math.sin(t * 9) * 0.02 : 0;
    return { pos: [0.1 + sh, sh, 5.0 - t * 0.01], look: [0, 0, 0], fov: 36, cInf: 70, focus: 1.2 };
  },
  "2A": (t) => {
    const k = ease(span(t, 0, 40));
    return { pos: lerp3([0, -0.05, 4.1], [0, 0.03, 3.5], k), look: [0, 0.06, 0], fov: 34, cInf: 36 };
  },
  "2B": (t) => {
    const k = ease(span(t, 0, 42));
    return { pos: lerp3([0, 0.03, 3.5], [0, 0.05, 3.1], k), look: [0, 0.05, 0], fov: 34, cInf: 36 };
  },
  "2C": (t) => {
    const k = ease(span(t, 0, 52));
    return { pos: lerp3([0.5, 0.15, 4.4], [0.15, 0.05, 4.0], k), look: [0.6, 0, 0], fov: 34, cInf: 40, focus: mix(4.25, 3.9, k) };
  },
  "2D": (t) => {
    const k = ease(span(t, 0, 46));
    return { pos: lerp3([-0.5, 0.3, 4.6], [0.15, 0.18, 4.05], k), look: [0.2, 0.08, 0], fov: 36, cInf: 34 };
  },

};

// ---------------- environment: studio light the glass reflects (edge glints) ----------------
type EnvKind = "amber" | "cold" | "perps";
const envCache = new Map<string, THREE.Texture>();
const useEnv = (kind: EnvKind) => {
  const { gl } = useThree();
  let t = envCache.get(kind);
  if (!t) {
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x000000);
    const panel = (w: number, h: number, pos: V3, col: string, k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      sc.add(m);
    };
    panel(9, 0.5, [0, 3.2, 4.5], "#ffffff", 2.2); // long softbox strip above/behind camera: crisp top-edge glint
    panel(10, 6, [0, 7, 0], "#ffffff", 0.18); // dim ceiling
    if (kind === "amber") { panel(1.2, 5, [-5, 0.5, 2], "#ffb35c", 1.4); panel(3, 2, [0, 0.6, -6], "#c9ffe0", 0.5); }
    if (kind === "cold") { panel(1.2, 5, [-5, 0.5, 2], "#a9bbd6", 1.0); panel(1.2, 5, [5, 0.5, 1], "#ff6a5c", 0.55); }
    if (kind === "perps") { panel(1.4, 5, [-5, 1, 1.5], "#EC8B1B", 1.6); panel(1.2, 5, [5, 0.5, 2], "#ffffff", 0.6); }
    const pm = new THREE.PMREMGenerator(gl);
    t = pm.fromScene(sc, 0.03).texture;
    pm.dispose();
    envCache.set(kind, t);
  }
  return t;
};

// ---------------- materials ----------------
const rimMaterial = (rim: THREE.Color, base: THREE.Color, power = 2.6) =>
  new THREE.ShaderMaterial({
    uniforms: { rim: { value: rim }, base: { value: base }, power: { value: power } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vec4 mv = viewMatrix*w; vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 rim; uniform vec3 base; uniform float power; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 n = normalize(vN); float f = pow(1.-max(dot(n, normalize(vV)),0.), power);
        float up = smoothstep(-0.3, 0.9, n.y)*0.7 + 0.3;
        gl_FragColor = vec4(base + rim*f*up, 1.); }`,
  });

const chromeMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { sweep: { value: -3 }, hot: { value: new THREE.Color(1.05, 0.9, 0.72) }, glow: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vL = position; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float sweep; uniform vec3 hot; uniform float glow; varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW); vec3 r = reflect(-v, n);
        float face = smoothstep(0.85, 0.98, n.z);
        float d = clamp(0.5 + (-vL.x*0.35 + vL.y*0.55), 0., 1.);
        vec3 faceCol = mix(vec3(0.07,0.075,0.085), vec3(0.6,0.63,0.68), smoothstep(0.1, 0.95, d));
        float y = r.y;
        vec3 env = mix(vec3(0.03,0.035,0.04), vec3(0.95,0.97,1.0), smoothstep(-0.05, 0.35, y));
        env = env*0.75 + vec3(0.9)*exp(-pow((y-0.12)*14.,2.));
        vec3 col = mix(env, faceCol, face);
        float s = exp(-pow((vW.x*0.9 + vW.y*0.45 - sweep)*2.4, 2.));
        col += vec3(1.05,1.03,1.0) * s * mix(0.9, 0.42, face);
        float fr = pow(1. - max(dot(n, v), 0.), 3.);
        col += hot * fr * (1.0 - face) * (0.25 + glow);
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.DoubleSide,
  });

const glassBody = () => new THREE.MeshPhysicalMaterial({ color: "#0c0e12", roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1, reflectivity: 0.6 });
const roundedBoxes = new Map<string, THREE.BufferGeometry>();
const rbox = (w: number, h: number, d: number) => {
  const k = `${w}x${h}x${d}`;
  let g = roundedBoxes.get(k);
  if (!g) roundedBoxes.set(k, (g = new RoundedBoxGeometry(w, h, d, 6, Math.min(w, h) * 0.09)));
  return g;
};

/** a thick glossy glass card: real geometry (edge glints from the environment) + a printed UI layer on each face */
const GlassCard: React.FC<{ w: number; h: number; front: THREE.Texture; back?: THREE.Texture; dim?: number; depth?: number; matte?: boolean }> = ({ w, h, front, back, dim = 1, depth = 0.045, matte }) => {
  const body = useMemo(() => {
    const m = glassBody();
    if (matte) { m.color = new THREE.Color("#141518"); m.roughness = 0.55; m.clearcoat = 0.35; m.clearcoatRoughness = 0.3; m.envMapIntensity = 0.6; }
    return m;
  }, [matte]);
  const ui = (map: THREE.Texture, flip: boolean) => (
    <mesh position={[0, 0, (flip ? -1 : 1) * (depth / 2 + 0.0015)]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} color={new THREE.Color(dim, dim, dim)} toneMapped={false} />
    </mesh>
  );
  return (
    <group>
      <mesh geometry={rbox(w, h, depth)} material={body} />
      {ui(front, false)}
      {back && ui(back, true)}
    </group>
  );
};

// ---------------- 1A: the trader's room ----------------
const TRADER_X = 0.36;
const BUST = [[0.0, 0.38], [0.34, 0.38], [0.39, 0.62], [0.42, 0.86], [0.41, 0.95], [0.34, 1.01], [0.2, 1.06], [0.075, 1.1], [0.0, 1.11]].map(([x, y]) => new THREE.Vector2(x, y));
const Trader: React.FC = () => {
  const mat = useMemo(() => rimMaterial(new THREE.Color(1.15, 0.92, 0.7), new THREE.Color(0.0, 0.0, 0.0), 7.0), []);
  return (
    <group position={[TRADER_X, 0, 0]}>
      <mesh material={mat} scale={[1, 1, 0.56]}><latheGeometry args={[BUST, 64]} /></mesh>
      <mesh material={mat} position={[0, 1.16, 0]}><cylinderGeometry args={[0.068, 0.078, 0.16, 24]} /></mesh>
      <mesh material={mat} position={[0, 1.32, 0]} scale={[0.92, 1.1, 1.0]}><sphereGeometry args={[0.12, 48, 48]} /></mesh>
      <mesh material={mat} position={[0, 1.355, 0.01]} scale={[1.0, 0.78, 1.08]}><sphereGeometry args={[0.128, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh material={mat} position={[0, 1.36, -0.15]} rotation={[0.1, 0, 0]} scale={[1, 1, 1.15]}><cylinderGeometry args={[0.105, 0.11, 0.01, 32, 1, false, Math.PI * 0.5, Math.PI]} /></mesh>
    </group>
  );
};

let areaInit = false;
const SCREEN_PLACE: { p: V3; r: number }[] = [
  { p: [0, 1.4, -1.0], r: 0 },
  { p: [-1.5, 1.36, -0.66], r: 0.6 },
  { p: [1.5, 1.36, -0.66], r: -0.6 },
];
const Room: React.FC<{ f: number }> = ({ f }) => {
  if (!areaInit) { RectAreaLightUniformsLib.init(); areaInit = true; }
  const scr = useMemo(() => [new Screen(1.75, 1.0, 11, "BTC-PERP  ·  97,412.5"), new Screen(1.2, 0.95, 23, "ETH-PERP"), new Screen(1.2, 0.95, 37, "SOL-PERP")], []);
  scr.forEach((s, i) => s.draw(f + i * 17));
  const lit = new THREE.Color(1.5, 1.5, 1.5);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b0c0e", roughness: 0.55, metalness: 0.2 }), []);
  const desk = useMemo(() => new THREE.MeshStandardMaterial({ color: "#16130f", roughness: 0.42, metalness: 0.05 }), []);
  const mug = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1c1d20", roughness: 0.3, metalness: 0.0 }), []);
  return (
    <group>
      {scr.map((s, i) => (
        <group key={i} position={SCREEN_PLACE[i].p} rotation={[0, SCREEN_PLACE[i].r, 0]}>
          <mesh position={[0, 0, -0.03]} material={dark}><boxGeometry args={[s.w + 0.04, s.h + 0.04, 0.04]} /></mesh>
          <mesh><planeGeometry args={[s.w, s.h]} /><meshBasicMaterial map={s.tex} color={lit} toneMapped={false} /></mesh>
          <mesh position={[0, -s.h / 2 - 0.16, -0.06]} material={dark}><boxGeometry args={[0.06, 0.34, 0.04]} /></mesh>
          <mesh position={[0, -s.h / 2 - 0.33, -0.02]} material={dark}><boxGeometry args={[0.36, 0.014, 0.2]} /></mesh>
          <rectAreaLight args={["#d8efe4", 5.5, s.w, s.h]} position={[0, 0, 0.02]} rotation={[0, 0, 0]} />
        </group>
      ))}
      <mesh position={[0, 0.7, -0.55]} material={desk}><boxGeometry args={[4.6, 0.04, 1.3]} /></mesh>
      <mesh position={[TRADER_X - 0.02, 0.73, -0.42]} material={dark} rotation={[0.05, 0, 0]}><boxGeometry args={[0.46, 0.018, 0.15]} /></mesh>
      <mesh position={[TRADER_X + 0.38, 0.73, -0.36]} material={dark}><boxGeometry args={[0.07, 0.01, 0.11]} /></mesh>
      <group position={[-0.62, 0.77, -0.42]}>
        <mesh material={mug}><cylinderGeometry args={[0.045, 0.042, 0.11, 32]} /></mesh>
        <mesh material={mug} position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.025, 0.008, 12, 24, Math.PI]} /></mesh>
      </group>
    </group>
  );
};

const Dust: React.FC<{ f: number; color: string; count?: number; spread?: V3; center?: V3 }> = ({ f, color, count = 90, spread = [8, 4, 6], center = [0, 0.5, -1] }) => {
  const base = useMemo(() => {
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: count }, () => [r() - 0.5, r() - 0.5, r() - 0.5, r()]);
  }, [count]);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const arr = new Float32Array(count * 3);
  base.forEach(([x, y, z, ph], i) => {
    arr[i * 3] = center[0] + x * spread[0] + Math.sin(f * 0.02 + ph * 6) * 0.05;
    arr[i * 3 + 1] = center[1] + y * spread[1] + f * 0.0016 * (0.5 + ph);
    arr[i * 3 + 2] = center[2] + z * spread[2];
  });
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return (
    <points geometry={geo}>
      <pointsMaterial color={color} size={0.012} sizeAttenuation transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
};


// reference-style: three matte cards with lots of air, flipping from LIVE to CLOSED
const CALM: { front: [string, string]; fg: string; glyph: string; back: [string, string]; p: V3; r: V3 }[] = [
  { front: ["BTC-PERP", "97,412.5"], fg: "LIVE", glyph: "₿", back: ["Stock", "markets"], p: [-2.05, 0.5, 0.15], r: [0.04, 0.3, -0.02] },
  { front: ["EUR/USD", "1.0842"], fg: "LIVE", glyph: "€", back: ["Forex", "desks"], p: [2.0, -0.55, -0.1], r: [-0.03, -0.3, 0.02] },
  { front: ["NAS100", "21,034"], fg: "LIVE", glyph: "N", back: ["Index", "futures"], p: [1.15, 1.2, -2.4], r: [0.05, -0.25, 0] },
];
const CalmField: React.FC<{ t: number; flipFrom: number; dim?: number }> = ({ t, flipFrom, dim = 1 }) => (
  <group>
    {CALM.map((c, i) => {
      const k = ease(span(t, flipFrom + i * 5, flipFrom + i * 5 + 13));
      const bob = Math.sin((t + i * 13) * 0.045) * 0.025;
      return (
        <group key={i} position={[c.p[0], c.p[1] + bob, c.p[2]]} rotation={[c.r[0], c.r[1] + k * Math.PI, c.r[2]]}>
          <GlassCard w={SOFT_W} h={SOFT_H} depth={0.035} matte dim={dim} front={softCard(c.front, c.fg, "open", c.glyph)} back={softCard(c.back, "CLOSED", "closed")} />
        </group>
      );
    })}
  </group>
);

const SOFT_BOKEH: { title: [string, string]; glyph: string; p: V3; ry: number }[] = [
  { title: ["BTC-PERP", "97,412.5"], glyph: "₿", p: [-2.9, 1.0, -3.6], ry: 0.35 },
  { title: ["XAU/USD", "2,654.1"], glyph: "G", p: [3.1, -0.9, -4.2], ry: -0.4 },
  { title: ["NAS100", "21,034"], glyph: "N", p: [2.6, 1.35, -5.4], ry: -0.3 },
];
const SoftBokeh: React.FC<{ t: number; tint?: number }> = ({ t, tint = 0.6 }) => (
  <group>
    {SOFT_BOKEH.map((c, i) => (
      <group key={i} position={[c.p[0], c.p[1] + Math.sin((t + i * 11) * 0.03) * 0.05, c.p[2]]} rotation={[0, c.ry + Math.sin(t * 0.01 + i) * 0.05, 0]}>
        <GlassCard w={SOFT_W} h={SOFT_H} depth={0.035} matte dim={tint} front={softCard(c.title, "LIVE", "open", c.glyph)} />
      </group>
    ))}
  </group>
);

const useShieldGeometry = (svg: string) =>
  useMemo(() => {
    const data = new SVGLoader().parse(svg);
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 10, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelSegments: 5, curveSegments: 14 });
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    const s = 1.3 / (bb.max.x - bb.min.x);
    geo.scale(s, -s, s); // mirror Y (SVG is y-down); normals follow the scale, winding is covered by DoubleSide
    return geo;
  }, [svg]);

const Shield: React.FC<{ brand: Brand; t: number; shot: ShotId }> = ({ brand, t, shot }) => {
  const geo = useShieldGeometry(brand.shieldSvg);
  const mat = useMemo(chromeMaterial, []);
  let y = 0, sc = 1, ry = 0;
  if (shot === "2A") {
    const k = easeOut(span(t, 0, 30));
    y = mix(-0.5, 0.1, k);
    ry = mix(0.32, 0, ease(span(t, 0, 36)));
    mat.uniforms.sweep.value = mix(-2.2, 2.4, ease(span(t, 6, 36)));
    mat.uniforms.glow.value = 0.25 * k;
  } else {
    const k = ease(span(t, 0, 16));
    y = mix(0.1, 0.5, k);
    sc = mix(1, 0.52, k);
    mat.uniforms.sweep.value = mix(-2.2, 2.2, ease(span(t, 14, 40)));
    mat.uniforms.glow.value = 0.25;
  }
  return (
    <group position={[0, y, 0]} rotation={[0, ry, 0]} scale={sc}>
      <mesh geometry={geo} material={mat} />
    </group>
  );
};

const Dial: React.FC<{ t: number }> = ({ t }) => {
  const p = ease(span(t, 8, 40));
  const len = Math.max(0.001, p * Math.PI * 2);
  const ring = useMemo(() => new THREE.RingGeometry(0.985, 1.035, 160, 1, Math.PI / 2 - len, len), [len]);
  const body = useMemo(glassBody, []);
  const a = Math.PI / 2 - len;
  return (
    <group position={[1.75, 0.02, 0]} rotation={[0.08, -0.5, 0.03]} scale={0.8}>
      <mesh material={body} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.18, 1.18, 0.06, 96]} /></mesh>
      <mesh position={[0, 0, 0.032]}><planeGeometry args={[2.4, 2.4]} /><meshBasicMaterial map={dialFaceTex()} transparent depthWrite={false} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.033]}><ringGeometry args={[0.985, 1.035, 160]} /><meshBasicMaterial color="#1b1e24" toneMapped={false} /></mesh>
      <mesh geometry={ring} position={[0, 0, 0.034]}><meshBasicMaterial color={new THREE.Color(1.25, 0.66, 0.14)} toneMapped={false} /></mesh>
      <mesh position={[Math.cos(a) * 1.01, Math.sin(a) * 1.01, 0.036]}><circleGeometry args={[0.045, 32]} /><meshBasicMaterial color={new THREE.Color(1.6, 1.25, 0.9)} toneMapped={false} /></mesh>
    </group>
  );
};

const WEEK: { day: string; sub: string; p: V3; ry: number }[] = [
  { day: "Friday", sub: "Trading", p: [-1.55, -0.28, -0.35], ry: 0.26 },
  { day: "Saturday", sub: "02:14 · live", p: [0.12, -0.18, 0.05], ry: 0.02 },
  { day: "Sunday", sub: "Trading", p: [1.8, -0.24, -0.3], ry: -0.24 },
];
const DayRow: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {WEEK.map((d, i) => {
      const inK = easeOut(span(t, i * 4, i * 4 + 16));
      const lit = i > 0 && t >= 18 + (i - 1) * 6;
      return (
        <group key={d.day} position={[d.p[0], d.p[1] + mix(-0.5, 0, inK) + Math.sin((t + i * 9) * 0.05) * 0.02, d.p[2]]} rotation={[mix(0.5, 0, inK), d.ry, 0]}>
          <GlassCard w={SOFT_W} h={SOFT_H} depth={0.035} matte front={softCard([d.day, d.sub], "OPEN", lit ? "lit" : "plain", d.day[0])} />
        </group>
      );
    })}
  </group>
);

// ---------------- bloom ----------------
const makeBloom = () =>
  new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.32, luminanceThreshold: 1.0, luminanceSmoothing: 0.15, mipmapBlur: true, levels: 5, radius: 0.45 });

const fwd = new THREE.Vector3(), tgt = new THREE.Vector3();

export const Scene3D: React.FC<{ brand: Brand }> = ({ brand }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const fx = useMemo(() => ({ lens: new LensBlur({ maxCoC: 30, nearScale: 1.3 }), bloom: makeBloom() }), []);
  const shot = shotAt(f);
  const t = local(f, shot);
  const rig = RIG[shot](t);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...rig.pos);
  cam.lookAt(...rig.look);
  if (cam.fov !== rig.fov) {
    cam.fov = rig.fov;
    cam.updateProjectionMatrix();
  }
  cam.getWorldDirection(fwd);
  tgt.set(...rig.look);
  fx.lens.focus = rig.focus ?? Math.max(0.3, tgt.sub(cam.position).dot(fwd));
  fx.lens.cInf = rig.cInf;
  scene.background = new THREE.Color("#040507");

  const envKind: EnvKind = shot === "1A" ? "amber" : shot.startsWith("1") ? "cold" : "perps";
  scene.environment = useEnv(envKind);

  let content: React.ReactNode = null;
  if (shot === "1A") content = (<><Trader /><Room f={f} /><Dust f={f} color="#ffcf9a" count={40} center={[0, 1.4, 0]} spread={[5, 2.5, 4]} /></>);
  else if (shot === "1B") content = (<><CalmField t={t} flipFrom={2} /><Dust f={f} color="#ffb0a0" count={40} center={[0, 0, 0]} /></>);
  else if (shot === "1C" || shot === "1D") content = (<><CalmField t={60} flipFrom={0} dim={0.8} /><Dust f={f} color="#ffb0a0" count={30} center={[0, 0, 1]} /></>);
  else if (shot === "2A" || shot === "2B") content = (<><Shield brand={brand} t={t} shot={shot} /><SoftBokeh t={f} tint={0.55} /><Dust f={f} color="#ffcf9a" count={30} center={[0, 0, -1]} /></>);
  else if (shot === "2C") content = (<><Dial t={t} /><SoftBokeh t={f} tint={0.55} /><Dust f={f} color="#ffcf9a" count={30} center={[0, 0, -1]} /></>);
  else content = (<><DayRow t={t} /><Dust f={f} color="#ffcf9a" count={30} center={[0, 0, -1]} /></>);

  const key = envKind === "cold" ? "#c9d6ea" : "#ffe2bf";
  return (
    <>
      {shot !== "1A" && (<><ambientLight intensity={0.35} /><directionalLight position={[-2.5, 3, 4]} intensity={2.2} color={key} /><directionalLight position={[3, -1, 2]} intensity={0.6} color={envKind === "cold" ? "#ff8a7a" : "#EC8B1B"} /></>)}
      {content}
      <EffectComposer multisampling={4} frameBufferType={THREE.HalfFloatType}>
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
      </EffectComposer>
    </>
  );
};
