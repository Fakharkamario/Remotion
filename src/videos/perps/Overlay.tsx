// DOM layer over the 3D: cinematic copy (blur-in words, scramble, big MD Nichrome punches), light leaks in the
// brand's light shapes (comet, louvre), transition flashes, vignette and film grain.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FB, FD, clamp01, ease, easeIn, easeOut, mix, span } from "./brand";
import { SHOTS, ShotId, local, shotAt } from "./timeline";
import { rng } from "./tex";

type Seg = { t: string; c?: string };

/** words fade up from blurred to sharp, one after another (reference: "Every Trade tells a story") */
const Words: React.FC<{ lines: Seg[][]; t: number; start?: number; stagger?: number; size: number; out?: [number, number]; align?: "left" | "center"; weight?: number }> = ({
  lines, t, start = 0, stagger = 3.5, size, out, align = "left", weight = 400,
}) => {
  let n = 0;
  const o = out ? 1 - ease(span(t, out[0], out[1])) : 1;
  const ob = out ? ease(span(t, out[0], out[1])) * 14 : 0;
  return (
    <div style={{ fontFamily: FB, fontWeight: weight, fontSize: size, lineHeight: 1.12, color: C.text, textAlign: align, letterSpacing: "-0.01em", opacity: o, filter: `blur(${ob}px)` }}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.flatMap((seg) => seg.t.split(" ").filter(Boolean).map((w) => ({ w, c: seg.c }))).map(({ w, c }, wi) => {
            const k = easeOut(span(t, start + n * stagger, start + n++ * stagger + 14));
            return (
              <span key={wi} style={{ display: "inline-block", marginRight: "0.26em", color: c ?? C.text, opacity: k, filter: `blur(${(1 - k) * 16}px)`, transform: `translateY(${(1 - k) * 0.35}em)` }}>
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
const Comet: React.FC<{ t: number; opacity?: number; y?: number }> = ({ t, opacity = 1, y = -170 }) => (
  <div style={{ position: "absolute", left: -400, top: y, width: 2800, height: 420, opacity, mixBlendMode: "screen", transform: `rotate(-6deg) translateX(${Math.sin(t * 0.02) * 60}px)`, filter: "blur(46px)",
    background: "radial-gradient(ellipse 48% 44% at 66% 52%, rgba(250,170,70,0.95) 0%, rgba(236,139,27,0.75) 30%, rgba(236,139,27,0.18) 58%, transparent 74%)" }} />
);

/** the brand louvre: diagonal slats of Perps light falling from the top */
const Louvre: React.FC<{ t: number; opacity?: number }> = ({ t, opacity = 1 }) => (
  <div style={{ position: "absolute", left: -300, right: -300, top: -260, height: 900, opacity, mixBlendMode: "screen", filter: "blur(34px)",
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
  return <AbsoluteFill style={{ backgroundImage: `url(${tiles[f % tiles.length]})`, backgroundSize: "384px 384px", mixBlendMode: "overlay", opacity: 0.32, pointerEvents: "none" }} />;
};

const Vignette = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse 78% 78% at 50% 50%, transparent 52%, rgba(0,0,0,0.72) 100%)" }} />;

const shotOverlay = (id: ShotId, t: number, f: number): React.ReactNode => {
  switch (id) {
    case "1A":
      return (
        <>
          <Light bg="radial-gradient(ellipse 55% 75% at 0% 45%, rgba(236,139,27,0.42), transparent 70%)" />
          <Light bg="radial-gradient(ellipse 50% 40% at 60% 0%, rgba(246,160,58,0.18), transparent 70%)" />
          <AbsoluteFill style={{ padding: "0 0 0 150px", justifyContent: "center" }}>
            <Words t={t} start={5} size={84} out={[38, 48]} lines={[[{ t: "Markets don't" }], [{ t: "sleep.", c: C.perps }]]} />
          </AbsoluteFill>
        </>
      );
    case "1B": {
      const g = t > 12 && t < 19 && t % 2 === 0;
      return (
        <>
          <Light bg="radial-gradient(ellipse 60% 45% at 50% 0%, rgba(149,167,197,0.22), transparent 70%)" />
          <Light bg="radial-gradient(ellipse 45% 40% at 50% 100%, rgba(255,92,80,0.10), transparent 70%)" />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ transform: g ? "translateX(6px)" : undefined, textShadow: g ? "-6px 0 rgba(255,117,106,0.8), 6px 0 rgba(31,177,255,0.5)" : undefined }}>
              <Words t={t} start={3} size={84} align="center" out={[33, 40]} lines={[[{ t: "Why should" }], [{ t: "your" }, { t: "trading?", c: C.perps }]]} />
            </div>
          </AbsoluteFill>
        </>
      );
    }
    case "1C": {
      const slam = easeOut(span(t, 0, 7));
      return (
        <>
          <Light bg="radial-gradient(ellipse 60% 45% at 50% 0%, rgba(149,167,197,0.16), transparent 70%)" />
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
          <Louvre t={t + 40} opacity={0.6} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 455 }}>
            <div style={{ fontFamily: FD, fontWeight: 900, fontSize: 148, lineHeight: 0.86, textAlign: "center", color: C.text }}>
              {line("GOAT FUNDED", l1)}
              {line("PERPS", l2)}
            </div>
            <div style={{ marginTop: 34, fontFamily: FB, fontSize: 32, color: C.t2, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>Trade perps with our simulated capital</div>
          </AbsoluteFill>
        </>
      );
    }
    case "2C": {
      const slam = easeOut(span(t, 0, 8));
      const n = Math.round(mix(1, 365, ease(span(t, 8, 40))));
      const done = t >= 40;
      return (
        <>
          <Comet t={f} opacity={0.8} />
          <div style={{ position: "absolute", left: 130, top: 250, fontFamily: FD, fontWeight: 900, color: C.text }}>
            <div style={{ fontSize: 360, lineHeight: 0.82, opacity: slam, transform: `scale(${mix(1.22, 1, slam)})`, transformOrigin: "left center", filter: `blur(${(1 - slam) * 16}px)` }}>24/7</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 34, opacity: easeOut(span(t, 6, 14)) }}>
              <span style={{ fontSize: 150, lineHeight: 0.85, color: C.perps, fontVariantNumeric: "tabular-nums", textShadow: done ? "0 0 40px rgba(236,139,27,0.55)" : undefined }}>{String(n).padStart(3, "0")}</span>
              <span style={{ fontFamily: FB, fontWeight: 600, fontSize: 28, letterSpacing: "0.3em", color: C.t2 }}>DAYS A YEAR</span>
            </div>
          </div>
        </>
      );
    }
    case "2D":
      return (
        <>
          <Comet t={f} opacity={0.75} />
          <AbsoluteFill style={{ padding: "150px 0 0 130px" }}>
            <Words t={t} start={2} size={92} lines={[[{ t: "Weekends" }], [{ t: "included.", c: C.perps }]]} />
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
      <Flash f={f} at={SHOTS["1B"][0]} up={10} down={10} color="rgba(255,236,210,1)" max={0.9} />
      <Flash f={f} at={SHOTS["2A"][0]} up={14} down={14} color="rgba(255,196,130,1)" />
      <Flash f={f} at={SHOTS["2C"][0]} up={4} down={8} color="rgba(236,139,27,1)" max={0.35} />
      <Flash f={f} at={SHOTS["2D"][0]} up={4} down={8} color="rgba(236,139,27,1)" max={0.35} />
      <Vignette />
      <Grain f={f} />
    </AbsoluteFill>
  );
};
