// DOM layer over the 3D: cinematic copy (blur-in words, scramble, big MD Nichrome punches), light leaks in the
// brand's light shapes (comet, louvre), transition flashes, vignette and film grain.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FB, FD, clamp01, ease, easeIn, easeOut, mix, span } from "./brand";
import { SHOTS, ShotId, local, shotAt } from "./timeline";
import { rng } from "./tex";

type Seg = { t: string; c?: string };

type Line = { segs: Seg[]; size: number; weight?: number; color?: string };
/** reference typography: a small quiet line over a larger, heavier one; words arrive one by one, sliding sideways
 *  out of a directional blur (like the reference's "Too many traders / only learned"). */
const Words: React.FC<{ lines: Line[]; t: number; start?: number; stagger?: number; out?: [number, number]; align?: "left" | "center" }> = ({ lines, t, start = 0, stagger = 3, out, align = "left" }) => {
  let n = 0;
  const o = out ? 1 - ease(span(t, out[0], out[1])) : 1;
  const ob = out ? ease(span(t, out[0], out[1])) : 0;
  return (
    <div style={{ fontFamily: FB, textAlign: align, opacity: o, transform: `translateX(${ob * -24}px)`, filter: ob ? `blur(${ob * 10}px)` : undefined }}>
      {lines.map((line, li) => (
        <div key={li} style={{ fontSize: line.size, fontWeight: line.weight ?? 400, lineHeight: 1.08, letterSpacing: line.size > 70 ? "-0.022em" : "-0.005em", color: line.color ?? C.text, marginTop: li ? line.size * 0.02 : 0 }}>
          {line.segs.flatMap((seg) => seg.t.split(" ").filter(Boolean).map((w) => ({ w, c: seg.c }))).map(({ w, c }, wi) => {
            const k = easeOut(span(t, start + n * stagger, start + n++ * stagger + 12));
            return (
              <span key={wi} style={{ display: "inline-block", marginRight: "0.24em", color: c, opacity: k, filter: k < 1 ? `blur(${(1 - k) * 9}px)` : undefined, transform: `translateX(${(1 - k) * 34}px)` }}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const GLYPHS = "#%&@$?!0123456789";
const Scramble: React.FC<{ s: string; t: number; start: number; rate: number }> = ({ s, t, start, rate }) => (
  <>
    {s.split("").map((ch, i) => {
      const lock = start + i * rate + 6;
      if (t < start + i * rate) return <span key={i} style={{ opacity: 0 }}>{ch}</span>;
      if (t >= lock) return <span key={i}>{ch}</span>;
      const r = rng(i * 131 + Math.floor(t) * 7)();
      return <span key={i} style={{ color: C.perps, opacity: 0.92 }}>{GLYPHS[Math.floor(r * GLYPHS.length)]}</span>;
    })}
  </>
);

const Light: React.FC<{ bg: string; opacity?: number; blend?: React.CSSProperties["mixBlendMode"]; blur?: number }> = ({ bg, opacity = 1, blend = "screen", blur = 0 }) =>
  opacity > 0.001 ? <AbsoluteFill style={{ background: bg, opacity, mixBlendMode: blend, filter: blur ? `blur(${blur}px)` : undefined }} /> : null;

/** the brand comet: a soft streak of Perps light along the top edge */
const Comet: React.FC<{ t: number; opacity?: number; y?: number }> = ({ t, opacity = 1, y = -230 }) => (
  <div style={{ position: "absolute", left: -300, top: y, width: 2600, height: 360, opacity: opacity * 0.85, mixBlendMode: "screen", transform: `rotate(-5deg) translateX(${Math.sin(t * 0.02) * 50}px)`, filter: "blur(38px)",
    background: "radial-gradient(ellipse 46% 40% at 64% 50%, rgba(248,165,64,0.9) 0%, rgba(236,139,27,0.55) 32%, rgba(236,139,27,0.1) 60%, transparent 74%)" }} />
);

/** thin diagonal light lines crossing the frame (reference: hairline streaks over the red section) */
const Streaks: React.FC<{ t: number; tint?: string; opacity?: number }> = ({ t, tint = "255,255,255", opacity = 1 }) => (
  <>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: "absolute", left: 300 + i * 620 + t * (1.2 + i * 0.4), top: -300, width: 1.5, height: 1800, transform: "rotate(48deg)", transformOrigin: "top left", opacity: opacity * [0.5, 0.28, 0.38][i], mixBlendMode: "screen",
        background: `linear-gradient(180deg, transparent 0%, rgba(${tint},0.0) 20%, rgba(${tint},0.75) 48%, rgba(${tint},0.0) 80%, transparent)` }} />
    ))}
  </>
);

/** the brand louvre: diagonal slats of Perps light falling from the top */
const Louvre: React.FC<{ t: number; opacity?: number }> = ({ t, opacity = 1 }) => (
  <div style={{ position: "absolute", left: -300, right: -300, top: -300, height: 820, opacity: opacity * 0.75, mixBlendMode: "screen", filter: "blur(26px)",
    WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.75) 40%, transparent 88%)", maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.75) 40%, transparent 88%)",
    background: `repeating-linear-gradient(108deg, transparent 0 90px, rgba(240,148,40,0.9) 170px 270px, transparent 350px 440px)`, backgroundPosition: `${t * 3}px 0` }} />
);

const Flash: React.FC<{ f: number; at: number; up: number; down: number; color: string; max?: number }> = ({ f, at, up, down, color, max = 1 }) => {
  const o = f < at ? easeIn(span(f, at - up, at)) : 1 - easeOut(span(f, at, at + down));
  return o > 0.001 ? <AbsoluteFill style={{ background: color, opacity: o * max, mixBlendMode: "screen" }} /> : null;
};

const Grain: React.FC<{ f: number }> = ({ f }) => {
  const tiles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, k) => {
        const c = document.createElement("canvas");
        c.width = c.height = 384;
        const g = c.getContext("2d")!;
        const img = g.createImageData(384, 384);
        const r = rng(1000 + k);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = 128 + (r() + r() + r() - 1.5) * 120;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        return c.toDataURL("image/png");
      }),
    [],
  );
  return <AbsoluteFill style={{ backgroundImage: `url(${tiles[f % tiles.length]})`, backgroundSize: "384px 384px", mixBlendMode: "overlay", opacity: 0.17, pointerEvents: "none" }} />;
};

const Vignette = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 80% at 50% 48%, transparent 45%, rgba(0,0,0,0.78) 100%)" }} />;

/** whole-frame colour wash per section, like the reference grade (crimson problem section, warm gold product section) */
const Wash: React.FC<{ kind: "amber" | "crimson" | "warm" }> = ({ kind }) => {
  if (kind === "crimson")
    return (
      <>
        <Light blend="normal" bg="linear-gradient(0deg, rgba(92,16,18,0.55) 0%, rgba(60,10,12,0.28) 38%, rgba(0,0,0,0) 75%)" />
        <Light bg="radial-gradient(ellipse 60% 55% at 12% 105%, rgba(190,40,36,0.45), transparent 70%)" />
      </>
    );
  if (kind === "amber")
    return (
      <>
        <Light blend="normal" bg="linear-gradient(0deg, rgba(60,34,10,0.45) 0%, rgba(40,22,6,0.18) 40%, rgba(0,0,0,0) 70%)" />
        <Light bg="radial-gradient(ellipse 55% 70% at 0% 70%, rgba(200,110,30,0.32), transparent 70%)" />
      </>
    );
  return (
    <>
      <Light blend="normal" bg="linear-gradient(0deg, rgba(64,36,8,0.5) 0%, rgba(40,22,5,0.2) 40%, rgba(0,0,0,0) 72%)" />
      <Light bg="radial-gradient(ellipse 55% 50% at 85% 0%, rgba(200,115,30,0.22), transparent 70%)" />
    </>
  );
};

const shotOverlay = (id: ShotId, t: number, f: number): React.ReactNode => {
  switch (id) {
    case "1A":
      return (
        <>
          <Wash kind="amber" />
          <AbsoluteFill style={{ padding: "0 0 0 150px", justifyContent: "center" }}>
            <Words t={t} start={5} out={[38, 48]} lines={[{ segs: [{ t: "Markets don't" }], size: 50, color: C.t2 }, { segs: [{ t: "sleep.", c: C.perps }], size: 112, weight: 600 }]} />
          </AbsoluteFill>
        </>
      );
    case "1B": {
      const g = t > 12 && t < 19 && t % 2 === 0;
      return (
        <>
          <Wash kind="crimson" />
          <Streaks t={t} tint="255,140,130" opacity={0.6} />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ transform: g ? "translateX(6px)" : undefined, textShadow: g ? "-6px 0 rgba(255,117,106,0.8), 6px 0 rgba(31,177,255,0.5)" : undefined }}>
              <Words t={t} start={3} align="center" out={[33, 40]} lines={[{ segs: [{ t: "Why should" }], size: 50, color: C.t2 }, { segs: [{ t: "your" }, { t: "trading?", c: C.perps }], size: 104, weight: 600 }]} />
            </div>
          </AbsoluteFill>
        </>
      );
    }
    case "1C": {
      const slam = easeOut(span(t, 0, 7));
      return (
        <>
          <Wash kind="crimson" />
          <Streaks t={t + 40} tint="255,140,130" opacity={0.5} />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontFamily: FD, fontWeight: 900, fontSize: 250, lineHeight: 0.84, textAlign: "center", color: C.text, transform: `scale(${mix(1.006, 1.035, t / 36)})` }}>
              <div style={{ opacity: slam, transform: `scale(${mix(1.25, 1, slam)})`, filter: `blur(${(1 - slam) * 18}px)` }}>MARKET</div>
              <div><Scramble s="CLOSED?" t={t} start={6} rate={2.6} /></div>
            </div>
          </AbsoluteFill>
        </>
      );
    }
    case "1D": {
      const pass = ease(span(t, 0, 7));
      const split = easeIn(span(t, 5, 20));
      const txt = (clip: string, dx: number, dy: number) => (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", clipPath: clip, transform: `translate(${dx}px, ${dy}px) rotate(${dy * 0.02}deg)`, opacity: 1 - split }}>
          <div style={{ fontFamily: FD, fontWeight: 900, fontSize: 250, lineHeight: 0.84, textAlign: "center", color: C.text, transform: "scale(1.035)" }}>
            <div>MARKET</div>
            <div>CLOSED?</div>
          </div>
        </AbsoluteFill>
      );
      return (
        <>
          <Wash kind="crimson" />
          {txt("polygon(0 0, 100% 0, 100% 48%, 0 64%)", -split * 120, -split * 160)}
          {txt("polygon(0 64%, 100% 48%, 100% 100%, 0 100%)", split * 120, split * 220)}
          <div style={{ position: "absolute", left: -900, top: 470, width: 3700, height: 150, transform: `rotate(-8deg) translateX(${mix(-1700, 1500, pass)}px)`, mixBlendMode: "screen", filter: "blur(10px)",
            background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,230,190,1) 0%, rgba(246,160,58,0.95) 22%, rgba(236,139,27,0.5) 45%, transparent 70%)" }} />
          <div style={{ position: "absolute", left: -200, right: -200, top: 545, height: 12, transform: "rotate(-8deg)", opacity: clamp01(1 - span(t, 6, 18)) * (t > 3 ? 1 : 0), mixBlendMode: "screen",
            background: "linear-gradient(90deg, transparent, rgba(255,220,170,0.95) 20%, rgba(236,139,27,0.9) 70%, transparent)", boxShadow: "0 0 60px 20px rgba(236,139,27,0.55)" }} />
          <Comet t={t} opacity={easeIn(span(t, 6, 22))} y={-120} />
        </>
      );
    }
    case "2A":
      return (
        <>
          <Wash kind="warm" />
          <Louvre t={t} opacity={easeOut(span(t, 0, 18))} />
          <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 }}>
            <div style={{ fontFamily: FB, fontWeight: 600, fontSize: 26, letterSpacing: "0.42em", color: C.t2, opacity: easeOut(span(t, 16, 28)), filter: `blur(${(1 - easeOut(span(t, 16, 28))) * 10}px)`, display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: C.perps, boxShadow: `0 0 14px ${C.perps}` }} />INTRODUCING
            </div>
          </AbsoluteFill>
        </>
      );
    case "2B": {
      const l1 = easeOut(span(t, 6, 18)), l2 = easeOut(span(t, 10, 22)), sub = easeOut(span(t, 22, 34));
      const line = (s: string, k: number) => (
        <div style={{ overflow: "hidden", paddingTop: 8 }}>
          <div style={{ transform: `translateY(${(1 - k) * 105}%)`, filter: `blur(${(1 - k) * 6}px)` }}>{s}</div>
        </div>
      );
      return (
        <>
          <Wash kind="warm" />
          <Louvre t={t + 40} opacity={0.6} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 455 }}>
            <div style={{ fontFamily: FD, fontWeight: 900, fontSize: 148, lineHeight: 0.86, textAlign: "center", color: C.text }}>
              {line("GOAT FUNDED", l1)}
              {line("PERPS", l2)}
            </div>
            <div style={{ marginTop: 30, fontFamily: FB, fontSize: 30, color: C.t3, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>Trade perps with our simulated capital</div>
          </AbsoluteFill>
        </>
      );
    }
    case "2C": {
      const slam = easeOut(span(t, 0, 8));
      const n = Math.round(mix(1, 365, ease(span(t, 8, 40))));
      return (
        <>
          <Wash kind="warm" />
          <Comet t={f} opacity={0.6} />
          <div style={{ position: "absolute", left: 130, top: 280, fontFamily: FD, fontWeight: 900, color: C.text }}>
            <div style={{ fontSize: 310, lineHeight: 0.82, opacity: slam, transform: `scale(${mix(1.22, 1, slam)})`, transformOrigin: "left center", filter: `blur(${(1 - slam) * 16}px)` }}>24/7</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 34, opacity: easeOut(span(t, 6, 14)) }}>
              <span style={{ fontSize: 130, lineHeight: 0.85, color: C.perps, fontVariantNumeric: "tabular-nums" }}>{String(n).padStart(3, "0")}</span>
              <span style={{ fontFamily: FB, fontWeight: 400, fontSize: 40, color: C.t2 }}>days a year</span>
            </div>
          </div>
        </>
      );
    }
    case "2D":
      return (
        <>
          <Wash kind="warm" />
          <Comet t={f} opacity={0.6} />
          <AbsoluteFill style={{ padding: "120px 0 0 130px" }}>
            <Words t={t} start={2} lines={[{ segs: [{ t: "Weekends" }], size: 50, color: C.t2 }, { segs: [{ t: "included.", c: C.perps }], size: 112, weight: 600 }]} />
          </AbsoluteFill>
        </>
      );
  }
};

export const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const id = shotAt(f);
  const t = local(f, id);
  return (
    <AbsoluteFill>
      {shotOverlay(id, t, f)}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 22%, transparent 78%, rgba(0,0,0,0.35))" }} />
      <Flash f={f} at={SHOTS["1B"][0]} up={10} down={10} color="rgba(255,236,210,1)" max={0.9} />
      <Flash f={f} at={SHOTS["2A"][0]} up={14} down={14} color="rgba(255,196,130,1)" />
      <Flash f={f} at={SHOTS["2C"][0]} up={4} down={8} color="rgba(236,139,27,1)" max={0.35} />
      <Flash f={f} at={SHOTS["2D"][0]} up={4} down={8} color="rgba(236,139,27,1)" max={0.35} />
      <Vignette />
      <Grain f={f} />
    </AbsoluteFill>
  );
};
