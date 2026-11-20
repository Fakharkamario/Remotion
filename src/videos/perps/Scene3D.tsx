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
import { CARD_H, CARD_W, DAY_H, DAY_W, Screen, Ticker, cached, closedTex, dayTex, dialFaceTex, tickerTex } from "./tex";

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
    return { pos: lerp3([-0.2, 0.1, 4.6], [0.25, -0.05, 3.9], k), look: [0.3, 0, 0], fov: 36, cInf: 46, focus: mix(4.6, 3.75, k) };
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
    return { pos: lerp3([0, -0.05, 3.5], [0, 0.03, 2.9], k), look: [0, 0.02, 0], fov: 34, cInf: 36 };
  },
  "2B": (t) => {
    const k = ease(span(t, 0, 42));
    return { pos: lerp3([0, 0.03, 2.9], [0, 0.05, 3.05], k), look: [0, 0.05, 0], fov: 34, cInf: 36 };
  },
  "2C": (t) => {
    const k = ease(span(t, 0, 52));
    return { pos: lerp3([0.5, 0.15, 4.4], [0.15, 0.05, 4.0], k), look: [0.6, 0, 0], fov: 34, cInf: 40, focus: mix(4.25, 3.9, k) };
  },
  "2D": (t) => {
    const k = ease(span(t, 0, 46));
    const look: V3 = [mix(-1.3, 2.25, k), -0.12, -0.2];
    const pos: V3 = [mix(-2.0, 1.45, k), 0.4, mix(4.1, 3.8, k)];
    const fx = look[0] - pos[0], fz = look[2] - pos[2];
    return { pos, look, fov: 36, cInf: 34, focus: Math.hypot(fx, fz) };
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
const GlassCard: React.FC<{ w: number; h: number; front: THREE.Texture; back?: THREE.Texture; dim?: number; depth?: number }> = ({ w, h, front, back, dim = 1, depth = 0.045 }) => {
  const body = useMemo(glassBody, []);
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

const dotTex = () =>
  cached("dots", 3, 2, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const step = W / 34;
    for (let x = step / 2; x < W; x += step)
      for (let y = step / 2; y < H; y += step) {
        const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
        const a = Math.max(0, 1 - Math.hypot(dx, dy)) * 0.9;
        if (a < 0.02) continue;
        g.beginPath();
        g.arc(x, y, step * 0.11, 0, Math.PI * 2);
        g.fillStyle = `rgba(239,244,250,${a})`;
        g.fill();
      }
  });
const Dots: React.FC<{ p: V3; s?: number; o?: number; ry?: number }> = ({ p, s = 1, o = 0.35, ry = 0 }) => (
  <mesh position={p} rotation={[0, ry, 0]} scale={s}>
    <planeGeometry args={[3, 2]} />
    <meshBasicMaterial map={dotTex()} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
  </mesh>
);

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

// glass market cards that flip to CLOSED
type FieldCard = { t: Ticker; closed: [string, string]; p: V3; r: V3 };
const FIELD: FieldCard[] = [
  { t: { sym: "BTC-PERP", kind: "CRYPTO", px: "97,412.5", chg: "+2.41%", up: true, seed: 3 }, closed: ["Coinbase", "Spot desk · offline"], p: [1.55, 0.55, 0.2], r: [0.05, -0.32, 0.02] },
  { t: { sym: "EUR/USD", kind: "FOREX", px: "1.0842", chg: "+0.12%", up: true, seed: 5 }, closed: ["EUR/USD", "FX · weekend"], p: [-1.7, 0.5, -0.4], r: [0.04, 0.38, -0.02] },
  { t: { sym: "NAS100", kind: "INDEX", px: "21,034", chg: "+0.92%", up: true, seed: 8 }, closed: ["NASDAQ", "Opens Monday 9:30"], p: [-1.15, -0.72, 0.5], r: [-0.08, 0.3, 0.02] },
  { t: { sym: "XAU/USD", kind: "COMMODITY", px: "2,654.1", chg: "+0.41%", up: true, seed: 13 }, closed: ["CME · Gold", "Session closed"], p: [1.25, -0.78, -0.3], r: [-0.06, -0.36, -0.03] },
  { t: { sym: "AAPL", kind: "STOCK", px: "229.87", chg: "−0.63%", up: false, seed: 21 }, closed: ["NYSE", "Opens Monday 9:30"], p: [0.1, 1.15, -1.8], r: [0.1, -0.05, 0] },
  { t: { sym: "ETH-PERP", kind: "CRYPTO", px: "3,618.2", chg: "−0.84%", up: false, seed: 34 }, closed: ["LSE", "Session closed"], p: [-3.0, 0.9, -2.6], r: [0, 0.45, 0] },
  { t: { sym: "GBP/JPY", kind: "FOREX", px: "193.44", chg: "+0.27%", up: true, seed: 55 }, closed: ["GBP/JPY", "FX · weekend"], p: [3.1, -0.2, -2.4], r: [0, -0.5, 0] },
  { t: { sym: "US30", kind: "INDEX", px: "43,870", chg: "+0.35%", up: true, seed: 89 }, closed: ["DOW 30", "Opens Monday"], p: [-0.3, -1.45, -2.2], r: [-0.1, 0.1, 0] },
];

const CardField: React.FC<{ t: number; flipFrom: number; dim?: number }> = ({ t, flipFrom, dim = 1 }) => (
  <group>
    {FIELD.map((c, i) => {
      const k = ease(span(t, flipFrom + i * 3, flipFrom + i * 3 + 11));
      const bob = Math.sin((t + i * 13) * 0.05) * 0.03;
      return (
        <group key={i} position={[c.p[0], c.p[1] + bob, c.p[2]]} rotation={[c.r[0], c.r[1] + k * Math.PI, c.r[2]]}>
          <GlassCard w={CARD_W} h={CARD_H} front={tickerTex(c.t)} back={closedTex(c.closed[0], c.closed[1])} dim={dim} />
          {k > 0.5 && (
            <group position={[-(CARD_W / 2 - 0.2), CARD_H / 2 - 0.06, -0.075]} rotation={[0, Math.PI, 0]} scale={mix(0.6, 1, easeOut(span(t, flipFrom + i * 3 + 6, flipFrom + i * 3 + 12)))}>
              <Padlock shut={easeIn(span(t, flipFrom + i * 3 + 10, flipFrom + i * 3 + 14))} scale={1.15} />
            </group>
          )}
        </group>
      );
    })}
  </group>
);

const BokehCards: React.FC<{ t: number; tint?: number }> = ({ t, tint = 0.55 }) => (
  <group>
    {FIELD.map((c, i) => (
      <group key={i} position={[c.p[0] * 1.6, c.p[1] * 1.3 + Math.sin((t + i * 9) * 0.03) * 0.05, -3.5 - (i % 3) * 1.4]} rotation={[0, c.r[1] * 0.6 + t * 0.002, 0]}>
        <GlassCard w={CARD_W} h={CARD_H} front={tickerTex(c.t)} dim={tint} />
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

// ---------------- 3D props: padlocks, coins, stone shards ----------------
const metal = () => new THREE.MeshPhysicalMaterial({ color: "#c9ced6", metalness: 0.62, roughness: 0.26, clearcoat: 0.8, clearcoatRoughness: 0.08, envMapIntensity: 1.8 });
const darkMetal = () => new THREE.MeshPhysicalMaterial({ color: "#a3a9b2", metalness: 0.7, roughness: 0.3, clearcoat: 0.6, envMapIntensity: 1.8 });

/** chrome padlock; `shut` 0 = shackle up and swung open, 1 = snapped shut */
const Padlock: React.FC<{ shut: number; scale?: number }> = ({ shut, scale = 1 }) => {
  const m = useMemo(metal, []);
  const lift = mix(0.075, 0, shut), swing = mix(0.75, 0, shut);
  return (
    <group scale={scale}>
      <mesh material={m} geometry={rbox(0.2, 0.16, 0.075)} />
      <mesh position={[0, 0.005, 0.039]}><circleGeometry args={[0.018, 24]} /><meshBasicMaterial color="#0a0b0d" /></mesh>
      <mesh position={[0, -0.022, 0.039]}><planeGeometry args={[0.012, 0.034]} /><meshBasicMaterial color="#0a0b0d" /></mesh>
      <group position={[-0.062, 0.08 + lift, 0]} rotation={[0, swing, 0]}>
        <group position={[0.062, 0, 0]}>
          <mesh material={m} position={[0, 0.05, 0]}><torusGeometry args={[0.062, 0.015, 16, 40, Math.PI]} /></mesh>
          <mesh material={m} position={[-0.062, 0.02, 0]}><cylinderGeometry args={[0.015, 0.015, 0.06, 16]} /></mesh>
          <mesh material={m} position={[0.062, 0.02, 0]}><cylinderGeometry args={[0.015, 0.015, 0.06, 16]} /></mesh>
        </group>
      </group>
    </group>
  );
};

const coinFace = (sym: string) =>
  cached(`coin-${sym}`, 1.2, 1.2, (g, W, H) => {
    const cx = W / 2, cy = H / 2;
    const bg = g.createRadialGradient(cx * 0.7, cy * 0.6, 0, cx, cy, W * 0.6);
    bg.addColorStop(0, "#d3d8df");
    bg.addColorStop(1, "#6f747d");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.lineWidth = W * 0.025;
    g.strokeStyle = "#c9ced6";
    g.beginPath();
    g.arc(cx, cy, W * 0.4, 0, Math.PI * 2);
    g.stroke();
    g.font = `900 ${H * 0.5}px "MD Nichrome", Impact, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#1a1c21";
    g.fillText(sym, cx + W * 0.012, cy + H * 0.045);
    g.fillStyle = "#eef1f5";
    g.fillText(sym, cx, cy + H * 0.03);
  });
const Coin: React.FC<{ sym: string; p: V3; t: number; spin: number; tilt: V3 }> = ({ sym, p, t, spin, tilt }) => {
  const side = useMemo(darkMetal, []);
  const face = useMemo(() => {
    const m = darkMetal();
    m.map = coinFace(sym);
    m.color = new THREE.Color("#ffffff");
    m.metalness = 0.45;
    return m;
  }, [sym]);
  return (
    <group position={[p[0], p[1] + Math.sin(t * 0.05 + p[0]) * 0.04, p[2]]} rotation={[tilt[0] + Math.sin(t * spin * 2) * 0.2, tilt[1] + Math.sin(t * spin * 3) * 0.45, tilt[2] + t * spin * 0.5]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={[side, face, face]}><cylinderGeometry args={[0.3, 0.3, 0.055, 72]} /></mesh>
    </group>
  );
};
const COINS: { sym: string; p: V3; spin: number; tilt: V3 }[] = [
  { sym: "₿", p: [0.45, -0.62, 1.25], spin: 0.012, tilt: [0.2, -0.3, 0.12] },
  { sym: "Ξ", p: [2.95, 0.62, 0.7], spin: -0.01, tilt: [-0.15, 0.35, -0.15] },
  { sym: "$", p: [2.75, -0.95, -0.5], spin: 0.009, tilt: [0.3, 0.2, 0.1] },
  { sym: "€", p: [1.05, 0.95, -0.9], spin: -0.012, tilt: [-0.25, -0.2, 0.2] },
  { sym: "₿", p: [2.5, 0.85, 2.55], spin: 0.008, tilt: [0.2, 0.5, 0.3] }, // foreground, out of focus
]
const Shards: React.FC<{ t: number; rise: number }> = ({ t, rise }) => {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#14161b", metalness: 0.35, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, flatShading: true, envMapIntensity: 1.6 }), []);
  const geos = useMemo(() => SHARDS.map((_, i) => {
    const g = new THREE.IcosahedronGeometry(0.16, 0);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < pos.count; k++) pos.setXYZ(k, pos.getX(k) * (0.75 + ((k * 7 + i * 3) % 5) * 0.12), pos.getY(k) * (0.8 + ((k * 3 + i) % 4) * 0.13), pos.getZ(k));
    g.computeVertexNormals();
    return g;
  }), []);
  return (
    <group>
      {SHARDS.map((d, i) => (
        <mesh key={i} geometry={geos[i]} material={mat} scale={d.s} position={[d.p[0], d.p[1] + mix(-0.6, 0, rise) * (i % 2 ? 1 : 0.6) + Math.sin(t * 0.04 + i) * 0.05, d.p[2]]} rotation={[d.r[0] + t * d.spd, d.r[1] + t * d.spd * 1.3, d.r[2]]} />
      ))}
    </group>
  );
};

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DayRow: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {DAYS.map((d, i) => {
      const x = -3.15 + i * 1.05;
      const wk = i >= 5;
      const litK = wk ? ease(span(t, 20 + (i - 5) * 5, 30 + (i - 5) * 5)) : 0;
      const inK = easeOut(span(t, i * 2, i * 2 + 14));
      return (
        <group key={d} position={[x, mix(-0.9, -0.36, inK), -0.05 * x * x]} rotation={[mix(0.6, 0, inK), -x * 0.09, 0]}>
          <GlassCard w={DAY_W} h={DAY_H} front={dayTex(d, litK > 0.5, i === 5 ? "02:14 · LIVE" : undefined)} depth={0.05} />
          {wk && litK > 0.01 && (
            <group position={[DAY_W / 2 - 0.16, DAY_H / 2 - 0.05, 0.09]} rotation={[0, -0.25, 0.08]} scale={easeOut(litK) * 1.1}>
              <Padlock shut={1 - ease(span(t, 26 + (i - 5) * 5, 34 + (i - 5) * 5))} />
            </group>
          )}
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
  if (shot === "1A") content = (<><Trader /><Room f={f} /><Dust f={f} color="#ffcf9a" center={[0, 1.4, 0]} spread={[5, 2.5, 4]} /></>);
  else if (shot === "1B") content = (<><CardField t={t} flipFrom={4} /><Dots p={[-2.6, 1.4, -3]} s={1.4} /><Dots p={[2.8, -1.2, -2.5]} s={1.2} o={0.25} /><Dust f={f} color="#c8d6e8" center={[0, 0, 0]} /></>);
  else if (shot === "1C" || shot === "1D") content = (<><CardField t={60} flipFrom={0} dim={0.75} /><Dots p={[-2.6, 1.4, -3]} s={1.4} /><Dust f={f} color="#c8d6e8" center={[0, 0, 1]} /></>);
  else if (shot === "2A" || shot === "2B") content = (<><Shield brand={brand} t={t} shot={shot} /><Shards t={f} rise={shot === "2A" ? easeOut(span(t, 0, 34)) : 1} /><BokehCards t={f} tint={0.4} /><Dust f={f} color="#ffcf9a" center={[0, 0, -1]} /></>);
  else if (shot === "2C") content = (<><Dial t={t} />{COINS.map((c, i) => <Coin key={i} {...c} t={f} />)}<BokehCards t={f} tint={0.5} /><Dots p={[-1.2, -1.3, -2]} s={1.3} o={0.3} /><Dust f={f} color="#ffcf9a" center={[0, 0, -1]} /></>);
  else content = (<><DayRow t={t} /><Dots p={[3.2, 1.0, -2.5]} s={1.3} o={0.3} /><Dust f={f} color="#ffcf9a" center={[0, 0, -1]} /></>);

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
