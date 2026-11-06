// The acting: per shot, where every character stands, how it moves (IK hand targets, swings, walks, kneeling),
// its face (expression, blinks, lip-sync from the voice envelope) and the props' states (katana grips, crumple,
// glow; tomato halves; the cut mat; hair; paper; obsidian; the macuahuitl; the atom lattice; the edge diagram) and the
// sprite effects (sparks, steam, glints). Pure function of (shot, frame).
import * as THREE from "three";
import type { Objs } from "./world";
import { Character, Pose } from "./rig";
import { Expr, FaceState } from "./face";
import { orient } from "./props";
import { whetMat, STONE_X, WORK_H } from "./sets";
import { MOUTH } from "./voicedata";
import {
  V3, B, clamp01, smooth, easeOut, easeIn, lerp, lerp3, N1, N2, N3, N5, N6, N7, N9, N10, N11, N12, N13, N16, AZTEC_AT,
  SMITH_AT, ANVIL, TROUGH, WHET, TABLE, MAT, BAMBOO_T, POLISHER_AT, STONES_Z, ENGAWA_Y, NANO, DIAG, LAB, glide,
} from "./story";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** blinks every 0.5-2.3 s, 4 frames long */
const blinkAt = (f: number, seed: number) => {
  let t = Math.floor(hash(seed) * 30);
  while (t <= f) { if (f - t < 4) return [0.6, 1, 1, 0.6][f - t]; t += 16 + Math.floor(hash(t + seed * 7) * 52); }
  return 0;
};
const talk = (f: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, f))] ?? 0;
const face = (expr: Expr, f: number, opts: { talk?: boolean; look?: [number, number]; seed?: number; blink?: number } = {}): FaceState => ({
  expr, mouth: opts.talk === false ? 0 : Math.round(talk(f) * 10) / 10, blink: opts.blink ?? blinkAt(f, opts.seed ?? 1), look: opts.look ?? [0, 0],
});
/** expression schedule: [[frame, expr], ...] */
const sched = (f: number, list: [number, Expr][]) => { let e = list[0][1]; for (const [k, x] of list) if (f >= k) e = x; return e; };
/** character-local (feet origin, facing +z) -> world */
const L = (p: V3, yaw: number, v: V3) => V(p[0] + v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), p[1] + v[1], p[2] - v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw));
const Ld = (yaw: number, v: V3): V3 => [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1], -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)];
const yawTo = (a: V3, b: V3) => Math.atan2(b[0] - a[0], b[2] - a[2]);
const norm = (v: V3): V3 => { const n = Math.hypot(...v) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
const slerpV = (a: V3, b: V3, k: number): V3 => {
  const va = V(...norm(a)), vb = V(...norm(b)), q = new THREE.Quaternion().setFromUnitVectors(va, vb);
  const qk = new THREE.Quaternion().slerp(q, k); const r = va.applyQuaternion(qk); return [r.x, r.y, r.z];
};
const tv = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
const BLADE_GRIP = 0.075, BL = 0.74;
/** hand position so that blade point s (0..1 along the blade) lands on P */
const handFor = (P: THREE.Vector3, dir: V3, s: number) => { const d = V(...norm(dir)); return P.clone().addScaledVector(d, -(s * BL + BLADE_GRIP)); };

const show = (o: { visible: boolean }, v = true) => { o.visible = v; };

export function stage(id: number, f: number, o: Objs, cam: THREE.PerspectiveCamera, _fill: THREE.PointLight) {
  const { N, smith, polisher, aztec, kat, kat2, blade, tomato, mat, hair, paper, mac, core, flake, hammerStone, hammer, tongs, workStone, nano, diag, fx } = o;
  // everything hidden unless a shot shows it
  for (const c of [N, smith, polisher, aztec]) show(c.root, false);
  for (const x of [kat.group, kat2.group, blade.group, tomato.group, mat.group, hair.group, paper.mesh, mac.group, core, flake, hammerStone, hammer, tongs, workStone]) show(x, false);
  kat.setHot(0); kat2.setHot(0); blade.setHot(0); kat.setCrumple(0);
  const camR = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
  const glint = (p: THREE.Vector3, f0: number, dur = 10, size = 0.22) => {
    const u = (f - f0) / dur; if (u < 0 || u > 1) return;
    fx.add("star", p, size * Math.sin(Math.PI * u), [2.2, 2.1, 1.9], 1, u * 1.2, true);
  };
  const pose = (c: Character, p: Pose) => { show(c.root); c.pose(p); };
  const sparks = (p0: THREE.Vector3, f0: number, n: number, seed: number, speed = 2.2, life = 14) => {
    const t = (f - f0) / 30; if (f < f0 || f - f0 > life) return;
    for (let k = 0; k < n; k++) {
      const a = hash(seed + k) * 6.28, up = 0.4 + hash(seed + k * 3) * 1.2, v = speed * (0.5 + hash(seed + k * 7));
      const p = V(p0.x + Math.cos(a) * v * t, p0.y + up * v * t - 4.9 * t * t, p0.z + Math.sin(a) * v * t);
      fx.add("soft", p, 0.028 * (1 - (f - f0) / life) + 0.01, [3.0, 1.6, 0.4], 1, 0, true);
    }
  };
  const steam = (p0: V3, f0: number, n: number, seed: number) => {
    for (let k = 0; k < n; k++) {
      const born = f0 + k * 1.6, t = (f - born) / 30; if (t < 0 || t > 1.4) continue;
      const a = hash(seed + k) * 6.28, r = 0.15 + 0.25 * hash(seed + k * 5);
      const p = V(p0[0] + Math.cos(a) * r * (0.5 + t), p0[1] + 0.1 + t * (0.8 + 0.6 * hash(k)), p0[2] + Math.sin(a) * r * (0.5 + t));
      fx.add("puff", p, 0.25 + t * 0.6, [1.05, 1.07, 1.12], Math.max(0, 0.95 - t * 0.68), a, false);
    }
  };

  switch (id) {
    // ------------------------------------------------------------------ 1: hook
    case 1: {
      const yaw = 0.12, shrug = smooth((f - B.shrug + 6) / 10);
      const hand = lerp3([0.14, 1.06, 0.3], [0.36, 1.0, 0.22], shrug);
      const dir = slerpV([-0.12, 1, 0.12], [0.55, 0.75, 0.15], shrug);
      pose(N, {
        pos: N1, yaw, head: [lerp(f < 30 ? 0.35 : 0, 0, shrug), lerp(f < 30 ? -0.12 : 0, 0, shrug), 0.18 * shrug],
        handWR: L(N1, yaw, hand), handL: shrug > 0.01 ? [lerp(-0.25, -0.36, shrug), lerp(0.0, 0.32, shrug), lerp(0.03, 0.25, shrug)] : undefined,
        elbowL: [-1, -0.5, -0.4],
        face: face(sched(f, [[0, "smile"], [30, "thinking"], [B.cantCut, "worried"]]), f, { look: f < 30 ? [0.6, 0.35] : [0, 0] }),
      });
      show(kat.group); kat.hold(N.handWorld("R"), Ld(yaw, dir), Ld(yaw, [-1, 0, 0.1]));
      const u = clamp01((f - 6) / 22);
      if (f > 6 && f < 30) glint(kat.pointWorld(0.15 + 0.8 * u), 6, 22, 0.3);
      break;
    }
    // ------------------------------------------------------------------ 2: sharpening like mad
    case 2: {
      const yaw = 0, up = smooth((f - 136) / 14), stone = V(WHET[0], 0.47, WHET[2]);
      const st = 0.13 * Math.sin((2 * Math.PI * (f - 68)) / 9) * (1 - up);
      const handDown = stone.clone().add(V(0.37 + BLADE_GRIP + st, 0.035, 0));
      const handUp = L(N2, yaw, [0.14, 1.02, 0.32]);
      const hand = handDown.clone().lerp(handUp, up);
      pose(N, {
        pos: N2, yaw, drop: lerp(0.3, 0.05, up), lean: lerp(0.5, 0.05, up), head: [0, lerp(0.35, 0, up), 0],
        handWR: hand, handWL: up < 0.5 ? stone.clone().add(V(-0.02 + st, 0.06, 0.03)) : undefined,
        face: face(sched(f, [[68, "determined"], [100, "grin"], [136, "determined"]]), f, { look: up > 0.5 ? [0, 0] : [0, -0.6] }),
      });
      show(kat.group);
      kat.hold(N.handWorld("R"), slerpV([-1, 0, 0], [-0.1, 1, 0.1], up), slerpV([0, 0, 1], [-1, 0, 0.1], up));
      if (up < 0.5) for (let k = 0; k < 3; k++) { const ph = (f + k * 3) % 9; if (ph < 4) fx.add("star", stone.clone().add(V(-0.15 + hash(f * 3 + k) * 0.3, 0.02 + hash(f + k) * 0.05, 0.04)), 0.07 * Math.sin((ph / 4) * Math.PI), [2.2, 2.0, 1.6], 1, f * 0.3, true); }
      if (f > B.why - 6) glint(kat.pointWorld(0.85), B.why - 4, 12, 0.3);
      break;
    }
    // ------------------------------------------------------------------ 3: forge, quench, hand over
    case 3: {
      if (f < 207) {
        const yaw = 0, top = V(ANVIL[0] + 0.02, 0.69, ANVIL[2]);
        // hammer: down on the hit frames, up between
        const hits = [B.hit1, B.hit2, B.hit3];
        let y = 1;
        for (const h of hits) { const d = f - h; if (d >= -6 && d < 0) y = Math.min(y, easeIn(-d / 6)); if (d >= 0 && d < 3) y = 0; if (d >= 3 && d < 9) y = Math.min(y, easeOut((d - 3) / 6)); }
        const strike = top.clone().add(V(0.06, 0.08, 0.02)), raised = L(SMITH_AT, yaw, [0.25, 1.55, 0.25]);
        const handR = strike.clone().add(V(0.0, 0.05, -0.28)).lerp(raised, y);
        pose(smith, {
          pos: SMITH_AT, yaw, lean: 0.3, head: [0, 0.35, 0],
          handWR: handR, handWL: L(SMITH_AT, yaw, [-0.25, 0.75, 0.42]),
          face: face(y < 0.2 ? "determined" : "serious", f, { talk: false, seed: 5, look: [0, -0.7] }),
        });
        show(hammer); orient(hammer, smith.handWorld("R"), slerpV([0, 0.2, 1], [0, 0.9, -0.3], y), slerpV([0, 1, -0.2], [0, 0.3, 1], y));
        show(blade.group); blade.setHot(0.85 + 0.15 * Math.sin(f * 0.7));
        orient(blade.group, V(ANVIL[0] - 0.4, 0.705, ANVIL[2]), [1, 0, 0], [0, 0, 1]);
        show(tongs); orient(tongs, smith.handWorld("L"), norm([0.6, -0.12, -0.55]), [0, 1, 0]);
        for (const h of hits) sparks(strike.clone().add(V(0, 0.03, 0)), h, 22, h);
      } else if (f < 228) {
        const at: V3 = [TROUGH[0] - 0.78, 0, TROUGH[2] + 0.05], yaw = Math.PI / 2;
        const dip = easeIn((f - B.quench + 4) / 6);
        const hand = L(at, yaw, [0.05, lerp(1.15, 0.95, dip), 0.52]);
        pose(smith, { pos: at, yaw, lean: 0.35, head: [0, 0.5, 0], handWL: hand, handWR: hand.clone().add(V(0, -0.06, -0.06)), face: face(dip > 0.5 ? "squint" : "serious", f, { talk: false, seed: 5, look: [0, -0.8] }) });
        show(blade.group); blade.setHot(f < B.quench ? 0.9 : Math.max(0, 0.9 - (f - B.quench) / 10));
        const tip = smith.handWorld("L").clone().add(V(0.14, -0.06, 0));
        orient(blade.group, tip, [0.1, -1, 0], [1, 0, 0]);
        show(tongs); orient(tongs, smith.handWorld("L"), [0.4, -0.6, 0], [0, 0, 1]);
        if (f >= B.quench) steam([TROUGH[0], 0.48, TROUGH[2]], B.quench, 18, 4);
      } else {
        const sAt: V3 = [-8.2, 0, -0.45], nAt: V3 = [-7.32, 0, -0.3];
        const sy = yawTo(sAt, nAt) - 0.5, ny = yawTo(nAt, sAt) + 0.55;
        const take = smooth((f - 236) / 8), pull = smooth((f - 244) / 10);
        const mid = L(sAt, sy, [0.05, 1.0, 0.42]).lerp(L(nAt, ny, [0, 1.0, 0.4]), take * 0.6);
        const held = take < 1 ? mid : L(nAt, ny, [0.12, 1.02, 0.32]).lerp(mid, 1 - pull);
        pose(smith, { pos: sAt, yaw: sy, lean: 0.12 * (1 - take), head: [0.2, 0.15, 0], handWR: f < 240 ? mid.clone().add(V(0.12, 0, 0)) : undefined, handWL: f < 240 ? mid.clone().add(V(-0.2, -0.02, 0.02)) : undefined, face: face(sched(f, [[228, "serious"], [244, "content"]]), f, { talk: false, seed: 5, look: [0.5, 0] }) });
        pose(N, { pos: nAt, yaw: ny, head: [pull * -0.4, 0.1, 0], handWR: f > 232 ? held : undefined, handWL: f > 236 && f < 246 ? held.clone().add(V(-0.25, 0, 0)) : undefined, face: face(sched(f, [[228, "smile"], [244, "grin"]]), f, { look: [-0.4, 0] }) });
        show(kat.group);
        const dir = Ld(sy, [-1, 0, 0.1]);
        if (f < 240) kat.hold(mid, dir, [0, 1, 0], 0.1);
        else kat.hold(N.handWorld("R"), slerpV(dir, Ld(ny, [-0.2, 1, 0.2]), pull), slerpV([0, 1, 0], Ld(ny, [-1, 0, 0]), pull));
      }
      break;
    }
    // ------------------------------------------------------------------ 4: dull, paper bends
    case 4: {
      const yaw = 0.18, dir = Ld(yaw, [-1, 0, 0.06]);
      const hand = L(N3, yaw, [0.36, 1.02, 0.34]);
      const lower = smooth((f - 286) / 12), bend = smooth((f - B.paper) / 12), drape = f >= B.paper - 1;
      pose(N, {
        pos: N3, yaw, head: [0, lerp(0.1, 0.25, lower), 0.08 * bend],
        handWR: hand, handWL: drape ? L(N3, yaw, [-0.32, 1.0, 0.2 + 0.05 * bend]) : L(N3, yaw, [-0.12, lerp(1.25, 1.06, lower), 0.33]),
        face: face(sched(f, [[255, "smile"], [B.dull, "dazed"], [B.paper, "squint"]]), f, { look: f < B.dull ? [0, -0.3] : [0, 0] }),
      });
      show(kat.group); kat.hold(N.handWorld("R"), dir, [0, 1, 0]);
      show(paper.mesh);
      const onEdge = kat.pointWorld(0.48).add(V(0, 0.004, 0));
      const inHand = N.handWorld("L").add(V(0.09, -0.02, 0));
      paper.set(drape ? bend : 0.05 * Math.sin(f * 0.3));
      orient(paper.mesh, drape ? onEdge : inHand.lerp(onEdge, lower * 0.9), [0, 1, 0], dir);
      break;
    }
    // ------------------------------------------------------------------ 5: the polisher
    case 5: case 14: {
      const gold = id === 14;
      const stop = gold ? smooth((f - B.stop) / 14) : 0;
      const stroke = 0.07 * Math.sin((2 * Math.PI * f) / 15) * (1 - stop);
      const lift = gold ? smooth((f - B.stop - 6) / 16) : 0;
      const stoneTop = V(POLISHER_AT[0], ENGAWA_Y + WORK_H + 0.05, STONES_Z);
      const grit = gold ? 4 : Math.max(0, Math.min(4, Math.floor((f - 322) / 36)));
      workStone.material = whetMat(grit); show(workStone);
      const hR = stoneTop.clone().add(V(0.38, 0.012, stroke)), hL = stoneTop.clone().add(V(0.02, 0.03, stroke + 0.02));
      const lifted = L(POLISHER_AT, 0, [0.12, 0.82, 0.32]);
      pose(polisher, {
        pos: POLISHER_AT, yaw: 0, drop: 0.3, lean: lerp(0.45, 0.12, lift), head: [0, lerp(0.15, -0.1, lift), 0],
        footL: [-0.12, -0.36, -0.2], footR: [0.12, -0.36, -0.2], knee: [0, -0.5, 1],
        handWR: hR.clone().lerp(lifted, lift), handWL: lift > 0.5 ? undefined : hL,
        face: face(lift > 0.6 ? (f > B.stop + 26 ? "content" : "serious") : "serious", f, { talk: false, seed: 9, look: lift > 0.5 ? [0, 0.3] : [0, -0.8] }),
      });
      show(blade.group);
      const dir = slerpV([-1, 0, 0], [-0.05, 1, 0.1], lift), edge = slerpV([0, 0, 1], [-1, 0, 0], lift);
      blade.hold(polisher.handWorld("R"), dir, edge, 0.05);
      if (!gold) {
        if (f < 396) {
          const yaw = yawTo(N5, [6.8, 0, 5.6]) * 0.6 - 0.3;
          const gest = smooth((f - 330) / 12) * (1 - smooth((f - 385) / 10));
          pose(N, { pos: N5, yaw, head: [-0.35 * gest, 0, 0], handL: [lerp(-0.25, -0.42, gest), lerp(0, 0.32, gest), lerp(0.03, 0.25, gest)], elbowL: [-1, -0.6, 0], face: face(sched(f, [[322, "smile"], [360, "talk"], [376, "smile"]]), f, { look: gest > 0.5 ? [-0.6, 0] : [0, 0] }) });
        }
        if (f >= 444) for (let i = 0; i < 5; i++) { const cx = STONE_X(i), cf = 444 + ((cx - 1.0) / 2.9) * 52; glint(V(cx, ENGAWA_Y + 0.13, STONES_Z + 0.04), cf, 10, 0.12); }
        for (let k = 0; k < 2; k++) if ((f + k * 5) % 10 < 3) fx.add("soft", stoneTop.clone().add(V(-0.08 + 0.16 * hash(f + k), 0.01, stroke)), 0.02, [1.2, 1.25, 1.35], 0.6, 0, false);
      } else if (f > B.stop + 10) glint(blade.pointWorld(0.6), B.stop + 22, 12, 0.22);
      break;
    }
    // ------------------------------------------------------------------ 6: tomato
    case 6: {
      // pre-pass: where the blade's middle comes down at the bottom of the cut -> the tomato sits there
      const tomAt = (fr: number) => {
      const f = fr;
      const yaw = 0, tom = V(TABLE[0], 0.886, TABLE[2]);
      const dir = Ld(yaw, norm([-0.62, -0.12, 0.78]));
      const low = handFor(tom.clone().add(V(-0.01, -0.045, 0)), dir, 0.5), high = handFor(tom.clone().add(V(-0.01, 0.42, -0.05)), dir, 0.5);
      const rest = L(N6, yaw, [0.25, 0.95, 0.28]);
      let hand: THREE.Vector3;
      if (f < 522) hand = rest.clone().lerp(high, smooth((f - 500) / 20));
      else if (f < 532) hand = high.clone().lerp(low, easeIn((f - 522) / 10));
      else if (f < 556) hand = low;
      else hand = low.clone().lerp(rest, smooth((f - 556) / 16));
      pose(N, { pos: N6, yaw, lean: f >= 524 && f < 560 ? 0.25 : 0.08, head: [0, f < 553 ? 0.35 : 0.05, f >= 553 && f < 572 ? 0.15 : 0], handWR: hand,
        face: face(sched(f, [[497, "determined"], [532, "neutral"], [B.tomato, "thinking"], [B.halved, "shocked"], [B.halved + 8, "grin"]]), f, { look: f < 553 ? [0, -0.7] : f < 572 ? [0, 0] : [0, -0.5] }) });
      show(kat.group); kat.hold(N.handWorld("R"), dir, [0, -1, 0]);
      return kat.pointWorld(0.5);
      };
      const p = tomAt(540);
      tomato.group.position.set(p.x, 0.886, p.z);
      tomAt(f);
      show(tomato.group); tomato.set(f >= B.halved, (f - B.halved) / 10);
      break;
    }
    // ------------------------------------------------------------------ 7: tatami mat
    case 7: {
      const yaw = yawTo(N7, MAT) + 0.15;
      const wind = smooth((f - 596) / 24), sw = clamp01((f - 622) / 10), ret = smooth((f - 668) / 26);
      const u = easeIn(sw) * 0.5 + 0.5 * smooth(sw);
      const D0: V3 = [0.15, -0.3, 0.95], D1: V3 = [0.35, 0.8, -0.5], DM: V3 = [-0.05, 0.3, 1], D2: V3 = [-0.55, -0.5, 0.65];
      const H0: V3 = [0.24, 0.98, 0.3], H1: V3 = [0.22, 1.5, 0.05], HM: V3 = [0.04, 1.22, 0.42], H2: V3 = [-0.18, 0.88, 0.38];
      let dir: V3, hand: V3;
      if (sw <= 0) { dir = slerpV(D0, D1, wind); hand = lerp3(H0, H1, wind); }
      else if (u < 0.5) { dir = slerpV(D1, DM, u * 2); hand = lerp3(H1, HM, u * 2); }
      else { dir = slerpV(DM, D2, (u - 0.5) * 2); hand = lerp3(HM, H2, (u - 0.5) * 2); }
      if (ret > 0) { dir = slerpV(dir, D0, ret); hand = lerp3(hand, H0, ret); }
      const prev = sw > 0 && sw < 1 ? slerpV(DM, D2, 0.3) : dir;
      const edge = sw > 0 && ret < 0.5 ? norm([D2[0] - D1[0], D2[1] - D1[1], D2[2] - D1[2]]) : [0, -1, 0.3] as V3;
      void prev;
      pose(N, { pos: N7, yaw, lean: 0.1 + 0.15 * (sw > 0 ? 1 - ret : 0), twist: lerp(0.25 * wind, -0.3, sw > 0 ? u * (1 - ret) : 0), head: [f > 690 ? -0.25 : 0, 0.05, 0], handWR: L(N7, yaw, hand), handWL: sw <= 0 && wind > 0.2 ? L(N7, yaw, [hand[0] - 0.1, hand[1] - 0.14, hand[2] - 0.05]) : undefined,
        face: face(sched(f, [[588, "smile"], [600, "determined"], [634, "smile"], [B.sits - 20, "thinking"], [B.slide, "grin"]]), f, { look: f > 690 ? [-0.5, 0] : [0, 0] }) });
      show(kat.group); kat.hold(N.handWorld("R"), Ld(yaw, dir), Ld(yaw, edge));
      show(mat.group);
      const cut = f >= 630, slide = f < B.sits ? 0 : f < B.slide ? 0.004 * smooth((f - B.sits) / 6) : 0.004 + 0.2 * easeIn((f - B.slide) / 10);
      mat.set(cut, slide, f > B.slide + 10 ? (f - B.slide - 10) / 30 : 0);
      if (f >= 629 && f < 634) sparks(V(MAT[0], 1.15, MAT[2]), 629, 10, 7, 1.0, 6);
      break;
    }
    // ------------------------------------------------------------------ 8: hair
    case 8: {
      const yaw = 0;
      const close = f >= 818;
      const pluck = smooth((f - 790) / 10), away = smooth((f - 806) / 10);
      let dir: V3 = [-0.1, 1, 0.1], edge: V3 = [-1, 0, 0.1], hand = L(N7, yaw, [0.14, 1.04, 0.3]);
      const P = L(N7, yaw, [-0.01, 1.1, 0.89]);
      if (close) { dir = norm([-0.5, 0, 0.85]); edge = [0, 1, 0]; hand = L(N7, yaw, [0.25, 1.1, 0.45]); }
      const wipe = f >= 752 && f < 772 ? kat.pointWorld(0.2 + 0.7 * ((f - 752) / 20)).add(V(0.0, 0, 0.03)) : undefined;
      let handL: THREE.Vector3 | undefined = wipe;
      if (!close && f >= 786) handL = L(N7, yaw, [-0.06, 1.7, 0.08]).lerp(L(N7, yaw, [-0.25, 1.35, 0.35]), away);
      if (close) handL = L(N7, yaw, [-0.2, 1.3, 0.55]).lerp(L(N7, yaw, [-0.3, 1.0, 0.2]), smooth((f - 826) / 10));
      pose(N, { pos: N7, yaw, head: [close ? 0 : 0.1 * pluck, close ? 0.3 : -0.1 * pluck * (1 - away), 0], handWR: hand, handWL: handL, elbowL: [-1, 0.2, -0.3],
        face: face(sched(f, [[746, "grin"], [B.razor, "determined"], [796, "ouch"], [812, "smile"], [828, "squint"], [B.split, "shocked"]]), f, { look: close ? [0, -0.6] : [0, 0] }) });
      show(kat.group); kat.hold(N.handWorld("R"), Ld(yaw, dir), Ld(yaw, edge));
      if (f >= B.razor && f < B.razor + 16) glint(kat.pointWorld(0.7), B.razor, 14, 0.32);
      if (f >= 800) {
        show(hair.group);
        const fall = clamp01((f - 824) / 20);
        let hp: THREE.Vector3;
        if (!close) hp = N.handWorld("L").add(V(0.03, -0.03, 0.02));
        else { const e = kat.pointWorld(0.6); hp = V(e.x + 0.004 * Math.sin(f * 0.4) * (1 - fall), lerp(e.y + 0.18, e.y + 0.025, fall), e.z); }
        if (f >= B.split) hp.y -= 0.02 * ((f - B.split) / 10) ** 2;
        hair.group.position.copy(hp); hair.group.rotation.set(0, 0.2, close ? 0.1 * Math.sin(f * 0.3) * (1 - fall) : 1.2);
        hair.set(f >= B.split ? Math.min(1.6, (f - B.split) / 8) : 0);
        if (f >= B.split && f < B.split + 8) glint(kat.pointWorld(0.6), B.split, 8, 0.1);
      }
      break;
    }
    // ------------------------------------------------------------------ 9: bamboo
    case 9: {
      const close = f >= 912;
      const yaw = close ? 0.25 : yawTo(N9, BAMBOO_T) - 0.05;
      if (!close) {
        const wind = smooth((f - 866) / 12), sw = easeIn(clamp01((f - 880) / 13)), rec = smooth((f - B.hit) / 8);
        const D0: V3 = [0.2, -0.3, 0.9], D1: V3 = [0.95, 0.15, -0.3], DI: V3 = [-0.28, 0.0, 1];
        const H0: V3 = [0.24, 0.98, 0.3], H1: V3 = [0.32, 1.12, -0.02], HI: V3 = [0.12, 1.1, 0.42];
        let dir = f < 880 ? slerpV(D0, D1, wind) : slerpV(D1, DI, sw), hand = f < 880 ? lerp3(H0, H1, wind) : lerp3(H1, HI, sw);
        if (f >= B.hit) { dir = slerpV(DI, [0.1, 0.1, 1], rec * 0.4); hand = lerp3(HI, [0.18, 1.12, 0.33], rec); }
        pose(N, { pos: N9, yaw, twist: f < 880 ? 0.35 * wind : lerp(0.35, -0.15, sw), lean: 0.1, handWR: L(N9, yaw, hand), handWL: L(N9, yaw, [hand[0] - 0.12, hand[1] - 0.06, hand[2] - 0.02]),
          face: face(sched(f, [[863, "determined"], [B.hit, "shocked"]]), f) });
        show(kat.group); kat.hold(N.handWorld("R"), Ld(yaw, dir), Ld(yaw, f < 880 ? [0, -1, 0.3] : [-0.95, 0, -0.25]));
        kat.setCrumple(f >= B.hit ? 0.25 : 0);
        if (f >= B.hit) sparks(kat.pointWorld(0.62), B.hit, 16, 12, 1.6, 10);
      } else {
        const dir: V3 = norm([-1, 0.12, 0.05]), edge: V3 = norm([0, 0.55, 0.85]);
        const P = L(N9, yaw, [0.0, 1.18, 0.38]);
        pose(N, { pos: N9, yaw, head: [0, 0.3, 0.1], handWR: handFor(P, Ld(yaw, dir), 0.5), handWL: undefined,
          face: face(sched(f, [[912, "worried"], [B.crumple + 6, "sad"]]), f, { look: [0, -0.6] }) });
        show(kat.group); kat.hold(N.handWorld("R"), Ld(yaw, dir), Ld(yaw, edge));
        kat.setCrumple(lerp(0.25, 1, smooth((f - B.crumple + 4) / 18)));
      }
      break;
    }
    // ------------------------------------------------------------------ 10: obsidian
    case 10: {
      const yaw = 0.12;
      const toss = clamp01((f - 958) / 20);
      const knap = f - B.knap;
      const hr: V3 = f < 975 ? lerp3([0.3, 1.0, 0.2], [0.35, 1.5, -0.1], smooth((f - 954) / 6)) : knap < -6 ? [0.2, 1.22, 0.32] : knap < 0 ? lerp3([0.25, 1.32, 0.3], [0.06, 1.1, 0.36], easeIn((knap + 6) / 6)) : f < 1030 ? [0.12, 1.1, 0.36] : [0.22, 1.14, 0.42];
      const hl: V3 = f < 970 ? [-0.25, -0.02, 0.03] : [-0.12, 1.05, 0.36];
      pose(N, { pos: N10, yaw, head: [0, f > 990 ? 0.3 : 0, 0], handWR: L(N10, yaw, hr), handL: f < 970 ? hl : undefined, handWL: f >= 970 ? L(N10, yaw, hl) : undefined,
        face: face(sched(f, [[953, "smile"], [B.obsidian, "thinking"], [B.knap, "shocked"], [B.knap + 8, "smile"], [1030, "squint"], [B.nm, "grin"]]), f, { look: f > 990 ? [0, -0.6] : [0, 0] }) });
      if (f < 990) {
        show(kat.group); kat.setCrumple(1);
        if (f < 958) kat.hold(N.handWorld("R"), Ld(yaw, [0.2, 1, 0.1]), Ld(yaw, [-1, 0, 0]));
        else {
          const p0 = N.handWorld("R"), t = toss * 0.7;
          kat.group.position.set(p0.x + 1.8 * t, p0.y + 3.6 * t - 4.9 * t * t, p0.z - 2.4 * t);
          kat.group.rotation.set(t * 14, 0, t * 9);
        }
      }
      if (f >= 970) {
        show(core); core.position.copy(N.handWorld("L")).add(V(0.02, 0.05, 0.03)); core.rotation.set(0.3, 0.6, 0.2);
        if (f < B.knap + 4) { show(hammerStone); hammerStone.position.copy(N.handWorld("R")).add(V(-0.03, 0.03, 0.02)); }
        show(flake);
        if (knap < 0) { flake.position.copy(core.position).add(V(0.05, 0.03, 0.04)); flake.rotation.set(0.3, 0.6, 0.2); }
        else if (knap < 10) { const t = knap / 30; flake.position.copy(core.position).add(V(0.05 + 0.5 * t, 0.03 + 1.2 * t - 4.9 * t * t, 0.04 + 0.2 * t)); flake.rotation.set(0.3 + t * 20, 0.6, 0.2 + t * 12); }
        else { flake.position.copy(N.handWorld("R")).add(V(-0.04, 0.04, 0.03)); flake.rotation.set(1.2, 0.3, 0.4); }
        if (knap >= 0) sparks(core.position.clone().add(V(0.05, 0.03, 0.04)), B.knap, 8, 21, 0.8, 8);
        if (f >= B.nm - 4) {
          const a = flake.position;
          for (let k = 0; k < 5; k++) { const s = k / 4 - 0.5; fx.add("soft", V(a.x + s * 0.08, a.y + 0.006 - Math.abs(s) * 0.01, a.z + 0.02), 0.006, [2.4, 2.6, 3.2], clamp01((f - B.nm + 4) / 6), 0, true); }
          glint(V(a.x + 0.03, a.y + 0.005, a.z + 0.02), B.nm + 2, 14, 0.14);
        }
      }
      break;
    }
    // ------------------------------------------------------------------ 11: macuahuitl vs steel
    case 11: {
      const ay = yawTo(AZTEC_AT, N11) + 0.4, ny = yawTo(N11, AZTEC_AT) - 0.4;
      const raise = smooth((f - 1095) / 22), sw = easeIn(clamp01((f - 1138) / 14)), hit = f >= B.steel;
      const block = smooth((f - 1128) / 14);
      // narrator: katana raised flat over his head
      const nHand = L(N11, ny, lerp3([0.24, 0.98, 0.3], [0.32, 1.78, 0.28], block));
      pose(N, { pos: N11, yaw: ny, lean: -0.05 * block, drop: hit ? 0.06 * Math.exp(-(f - B.steel) / 6) : 0, head: [0, -0.25 * block, 0], handWR: nHand, handWL: block > 0.3 ? L(N11, ny, [-0.22, 1.76, 0.3]) : undefined, elbowR: [1, 0, -0.4], elbowL: [-1, 0, -0.4],
        face: face(sched(f, [[1085, "worried"], [1128, "nervous"], [B.steel, "shocked"]]), f, { look: [0, block > 0.5 ? 0.6 : 0] }) });
      show(kat.group);
      kat.hold(N.handWorld("R"), slerpV(Ld(ny, [0.1, -0.3, 0.9]), Ld(ny, [-1, 0.05, 0.05]), block), slerpV([0, 0, 1], [0, 1, 0], block));
      // the warrior: club up, then down onto the blade
      const top: V3 = [0.22, 1.85, -0.05], strike = tv(kat.pointWorld(0.42).add(V(0, 0.06, 0)));
      const hStrikeL = (() => { const w = new THREE.Vector3(...strike); const dx = w.x - AZTEC_AT[0], dz = w.z - AZTEC_AT[2]; const c = Math.cos(-ay), s = Math.sin(-ay); return [dx * c + dz * s - 0.0, w.y + 0.25, -dx * s + dz * c - 0.5] as V3; })();
      let hand = lerp3([0.24, 0.98, 0.3], top, raise);
      if (f >= 1138) hand = lerp3(top, hStrikeL, sw);
      if (hit) hand = lerp3(hStrikeL, [0.28, 1.25, 0.32], smooth((f - B.steel) / 16));
      const clubUp: V3 = [0.1, 0.6, -0.8], clubHit: V3 = [-0.05, -0.15, 1];
      const cdir = f < 1138 ? slerpV([0.2, 0.9, 0.3], clubUp, raise) : hit ? slerpV(clubHit, [0.4, 0.6, 0.6], smooth((f - B.steel) / 16)) : slerpV(clubUp, clubHit, sw);
      pose(aztec, { pos: AZTEC_AT, yaw: ay, lean: 0.1 + 0.25 * sw * (hit ? Math.exp(-(f - B.steel) / 10) : 1), handWR: L(AZTEC_AT, ay, hand), handWL: L(AZTEC_AT, ay, [hand[0] - 0.08, hand[1] - 0.12, hand[2] - 0.02]),
        face: face(sched(f, [[1085, "serious"], [1138, "determined"], [B.shatter, "shocked"]]), f, { talk: false, seed: 13, look: [0, -0.2] }) });
      show(mac.group); orient(mac.group, aztec.handWorld("R"), Ld(ay, cdir), Ld(ay, [0, -1, 0.1]).map((v, i) => v + [0, 0, 0][i]) as V3);
      mac.shatter(hit ? (f - B.steel) / 30 : -1);
      if (hit) sparks(V(...strike), B.steel, 26, 31, 2.6, 12);
      if (hit && f < B.steel + 5) glint(V(...strike), B.steel, 5, 0.6);
      break;
    }
    // ------------------------------------------------------------------ 12: the tungsten needle
    case 12: {
      const walkU = clamp01((f - 1198) / 26);
      const from: V3 = [N12[0] + 1.6, 0, N12[2] + 0.2];
      const pos = lerp3(from, N12, smooth(walkU));
      const yaw = walkU < 1 ? yawTo(from, N12) * (1 - smooth((f - 1214) / 12)) - 0.35 * smooth((f - 1214) / 12) : -0.35;
      const gest = smooth((f - 1226) / 10);
      pose(N, { pos, yaw, walk: walkU < 1 ? (f - 1198) * 0.42 : undefined, head: [-0.5 * gest, 0.25 * gest, 0], handL: [lerp(-0.25, -0.44, gest), lerp(0, 0.38, gest), lerp(0.03, 0.18, gest)], elbowL: [-1, -0.4, 0],
        face: face(sched(f, [[1198, "smile"], [1226, "talk"], [1250, "smile"]]), f, { look: gest > 0.5 ? [-0.7, -0.2] : [0, 0] }) });
      if (f > B.needle - 4) glint(o.lab.needleTip, B.needle, 14, 0.06);
      break;
    }
    // ------------------------------------------------------------------ 13: nano
    case 13: {
      const close = f >= 1400;
      const tb = f >= B.bump ? (f - B.bump) / 30 : -1;
      nano.pose(tb, f >= 1366 ? Math.min(1, easeIn((f - 1366) / 20)) + (tb > 0 ? Math.min(0.15, tb * 0.5) : 0) : -1);
      const flinch = f >= B.bump ? smooth((f - B.bump) / 6) : 0;
      const yaw = close ? 0.2 : -0.2;
      pose(N, { pos: N13, yaw, drop: 0.08 * flinch, head: [close ? 0 : -0.45, close ? 0 : -0.55 * (1 - flinch * 0.7), 0], handL: flinch > 0 ? [-0.15, 0.5, 0.25] : undefined, handR: flinch > 0 ? [0.15, 0.52, 0.25] : undefined,
        face: face(sched(f, [[1328, "smile"], [B.atom, "talk"], [1370, "worried"], [B.bump, "shocked"], [1400, "nervous"]]), f, { look: close ? [0, 0] : [-0.5, 0.8] }) });
      if (tb < 0) { const p = nano.tipAtom.position; const k = 0.5 + 0.5 * Math.sin(f * 0.25); fx.add("soft", p, 1.3 + 0.2 * k, [1.6, 1.2, 0.4], 0.55, 0, true); }
      if (f >= B.atom - 2 && f < B.atom + 14) glint(nano.tipAtom.position.clone().add(V(0, 0, 0.3)), B.atom - 2, 14, 1.2);
      break;
    }
    // ------------------------------------------------------------------ 15: rounded edge, cross-section
    case 15: {
      const k = smooth((f - B.round) / 40);
      diag.set(k);
      const at: V3 = [DIAG[0] - 0.98, 0, DIAG[2] + 0.55], yaw = 0.35;
      const point = smooth((f - 1512) / 10) * (1 - smooth((f - 1560) / 10));
      pose(N, { pos: at, yaw, head: [0.4 * point, -0.15 * point, 0], handR: point > 0.01 ? [lerp(0.25, 0.4, point), lerp(-0.02, 0.55, point), lerp(0.03, 0.2, point)] : undefined, elbowR: [1, -0.5, 0],
        handL: f > 1562 ? [-0.36, 0.32 * smooth((f - 1562) / 8), 0.24] : undefined, elbowL: [-1, -0.5, -0.3],
        face: face(sched(f, [[1500, "smile"], [1512, "talk"], [B.less, "thinking"], [1580, "content"]]), f, { look: point > 0.5 ? [0.7, 0.3] : [0, 0] }) });
      if (f >= 1530 && f < 1560) glint(V(DIAG[0], 0.3 + 2.06, DIAG[2] + 0.2), 1536, 16, 0.35);
      break;
    }
    // ------------------------------------------------------------------ 16: the best sword
    case 16: {
      const yaw = -0.2;
      const up = smooth((f - 1600) / 18);
      pose(N, { pos: N16, yaw, head: [lerp(0, 0.3, up * (1 - smooth((f - 1610) / 12))), lerp(0, -0.1, up), 0], handWR: L(N16, yaw, lerp3([0.24, 0.98, 0.3], [0.15, 1.08, 0.3], up)),
        face: face(sched(f, [[1595, "smile"], [B.best, "grin"], [B.sharpest, "content"]]), f) });
      show(kat.group); kat.hold(N.handWorld("R"), Ld(yaw, slerpV([0.2, -0.4, 0.8], [-0.12, 1, 0.12], up)), Ld(yaw, [-1, 0, 0.1]));
      if (f > 1616 && f < 1632) glint(kat.pointWorld(0.8), 1616, 14, 0.28);
      pose(polisher, { pos: POLISHER_AT, yaw: 0.5, drop: 0.3, lean: 0.1, footL: [-0.12, -0.36, -0.2], footR: [0.12, -0.36, -0.2], knee: [0, -0.5, 1], handL: [-0.12, 0.05, 0.28], handR: [0.12, 0.05, 0.28],
        face: face("content", f, { talk: false, seed: 9 }) });
      show(workStone); workStone.material = whetMat(4);
      break;
    }
  }
  void glide; void LAB; void N2; void NANO; void N1; void MAT; void camR;
}
