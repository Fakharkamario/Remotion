// "做股票投资呢，你只要能避开这5种公司，你的投资绩效绝对会高于90%的人。" — 7 s, 30 fps (210 frames).
// The talking head runs as one continuous take under the whole clip; the animated scenes cover it on hard cuts,
// standing in for the B-roll of the style reference. Every element is a pure function of the frame number f.
//
//   0–47     A-roll, slow push:     做 / 股票投资 呢        (each character lands green, settles to white)
//   48–69    animation, typed line: 你只要能避开          (caret, the line slides left, lime highlighter on 避开)
//   70–101   A-roll, punch-in:      避开这 / 5种公司      (ink on the wall beside the open hand, red strike)
//   102–138  animation, dot ring:   a dot becomes a chart card, 你的投资绩效 pill
//   139–172  A-roll, tight:         绝对会 / 高于
//   173–209  animation, 10x10 grid: counter to 90%, 90 cells dim, the top row goes green: 你
//
// Character landing frames are word onsets from ASR (SenseVoice) checked against the voice's loudness envelope.
(function () {
  const FPS = 30;
  const FRAMES = 210;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const outQuint = (t) => 1 - Math.pow(1 - t, 5);
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const outBack = (t, k = 1.9) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
  const mix = (c0, c1, t) => c0.map((v, i) => Math.round(lerp(v, c1[i], t)));
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

  const WHITE = [255, 255, 255];
  const INK = [20, 20, 20];
  const GREEN = [12, 216, 102];
  const GREY = [58, 58, 58];

  // Monotone cubic (PCHIP) through [frame, value] keys: continuous velocity, no overshoot.
  function spline(keys) {
    const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]);
    const h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; d[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return (f) => {
      if (f <= x[0]) return y[0];
      if (f >= x[n - 1]) return y[n - 1];
      let i = 0;
      while (f > x[i + 1]) i++;
      const t = (f - x[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
  }

  // seeded random so the dot ring is the same on every render
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  const el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const chars = (row, text, cls) => [...text].map((c) => el("span", "ch" + (cls ? " " + cls : ""), row, c));

  // A character lands: rises a few px, fades up over ~2 frames, and settles from slightly large.
  function land(e, f, at, o = {}) {
    const dur = o.dur || 5, dy = o.dy === undefined ? 22 : o.dy, s0 = o.s0 || 1.14;
    if (f < at) { e.style.opacity = 0; return 0; }
    const p = prog(f, at, at + dur);
    const k = o.back ? outBack(p, o.back) : outCubic(p);
    e.style.opacity = Math.min(1, (f - at + 1) / 2.5);
    e.style.transform = `translateY(${(dy * (1 - k)).toFixed(2)}px) scale(${lerp(s0, 1, k).toFixed(4)})`;
    return p;
  }

  // Scene windows [first, last] in frames
  const SCENES = [
    ["s1", 0, 47], ["s2", 48, 69], ["s3", 70, 101], ["s4", 102, 138], ["s5", 139, 172], ["s6", 173, 209],
  ];

  // Camera on the A-roll: scale about a point (origin in source px). Each shot moves the whole time it is on.
  function cam(f) {
    if (f < 48) return { s: lerp(1.0, 1.055, inOut(prog(f, 0, 48))), ox: 750, oy: 470 };
    if (f < 102) return { s: lerp(1.2, 1.235, prog(f, 70, 102)), ox: 580, oy: 486 }; // keeps the open hand in frame
    return { s: lerp(1.36, 1.31, outCubic(prog(f, 139, 173))), ox: 750, oy: 430 };   // tight, easing back out
  }

  const SCENE = {};
  SCENE.mount = function (stage, camLayer) {
    const S = {};
    SCENES.forEach(([id]) => (S[id] = el("div", "scene", stage)));

    // ---------------------------------------------------------------- s1: 做 / 股票投资 呢
    // one row, as the reference's "I found a WAY to have": small lead-in, huge key words, small tail
    const s1 = el("div", "stack onvideo", S.s1);
    const s1b = el("div", "row", s1);
    const s1a = el("div", "row small", s1b);
    s1a.style.marginRight = "14px";
    s1a.style.marginBottom = "18px";
    const s1aC = chars(s1a, "做");
    const s1bC = chars(el("div", "row big", s1b), "股票投资");
    const s1tail = el("div", "row small", s1b);
    s1tail.style.marginLeft = "14px";
    s1tail.style.marginBottom = "18px";
    const s1cC = chars(s1tail, "呢");
    s1.style.left = "760px"; s1.style.top = "818px";
    const S1_AT = { small: [11], big: [18, 22, 30, 34], tail: [41] };

    // ---------------------------------------------------------------- s2: typed line
    S.s2.classList.add("dark");
    const s2line = el("div", "typed", S.s2);
    const S2_TEXT = "你只要能避开";
    const s2hl = el("div", "hl", s2line);
    const s2C = chars(s2line, S2_TEXT);
    const s2caret = el("span", "caret", s2line);
    const S2_AT = [50, 53, 57, 61, 64, 67];
    const CW = 250 * 0.98; // CJK advance at 300px with -0.02em tracking
    s2hl.style.left = 4 * CW - 10 + "px";
    s2hl.style.width = 2 * CW + 20 + "px";
    // the line is centred on what has been typed, then keeps drifting left (as the reference scrolls off)
    const s2x = spline([[48, 960 - CW * 0.5], ...S2_AT.map((at, i) => [at + 1, 960 - (CW * (i + 1)) / 2 - 14]), [70, 960 - CW * 3 - 50]]);

    // ---------------------------------------------------------------- s3: 避开这 / 5种公司 (on the wall)
    const s3 = el("div", "stack onwall", S.s3);
    const s3aC = chars(el("div", "row small", s3), "避开这");
    const s3b = el("div", "row", s3);
    s3b.style.position = "relative";
    const s3five = el("span", "ch num", s3b, "5");
    s3five.style.fontSize = "262px";
    s3five.style.color = rgb(GREEN);
    s3five.style.marginRight = "10px";
    const s3bC = chars(el("div", "row big", s3b), "种公司");
    const s3strike = el("div", "strike", s3b);
    s3.style.left = "1545px"; s3.style.top = "330px";
    s3.querySelectorAll(".big").forEach((b) => (b.style.fontSize = "200px"));
    const S3_AT = { small: 70, five: 75, big: [81, 86, 89], strike: [92, 99] };

    // ---------------------------------------------------------------- s4: dot ring, chart card, pill
    S.s4.classList.add("dark");
    const s4 = el("div", "layer", S.s4);
    const CX = 960, CY = 440;
    const r4 = rng(7);
    const dots = Array.from({ length: 132 }, (_, i) => {
      const ring = i % 3;
      const d = {
        a: r4() * Math.PI * 2,
        r: 410 + ring * 50 + (r4() - 0.5) * 34,
        sz: 5 + Math.round(r4() * 8),
        o: 0.4 + r4() * 0.6,
        at: 102 + r4() * 6,
        spin: (ring === 1 ? -1 : 1) * (0.004 + r4() * 0.003),
        e: el("div", "dot", s4),
      };
      d.e.style.width = d.e.style.height = d.sz + "px";
      d.e.style.background = r4() < 0.12 ? rgb(GREEN) : "#b4b4b4";
      return d;
    });
    const card = el("div", "card", s4);
    const CARD_W = 700, CARD_H = 440;
    const PTS = [0.1, 0.2, 0.16, 0.3, 0.26, 0.42, 0.37, 0.55, 0.5, 0.68, 0.84];
    const px = (i) => 46 + (i / (PTS.length - 1)) * (CARD_W - 92);
    const py = (v) => CARD_H - 40 - v * (CARD_H - 90);
    const linePath = PTS.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
    card.innerHTML =
      `<svg viewBox="0 0 ${CARD_W} ${CARD_H}">` +
      `<defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0cd866" stop-opacity=".32"/><stop offset="1" stop-color="#0cd866" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="reveal"><rect id="revealRect" x="0" y="0" width="0" height="${CARD_H}"/></clipPath></defs>` +
      [0.25, 0.5, 0.75].map((g) => `<line x1="46" x2="${CARD_W - 46}" y1="${py(g)}" y2="${py(g)}" stroke="#dcdcd8" stroke-width="2" stroke-dasharray="6 8"/>`).join("") +
      `<g clip-path="url(#reveal)"><path d="${linePath} L${px(PTS.length - 1)},${CARD_H - 40} L${px(0)},${CARD_H - 40} Z" fill="url(#area)"/>` +
      `<path d="${linePath}" fill="none" stroke="#0cd866" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/></g>` +
      `<circle id="tipPulse" cx="${px(PTS.length - 1)}" cy="${py(PTS[PTS.length - 1])}" r="14" fill="none" stroke="#0cd866" stroke-width="4"/>` +
      `<circle id="tip" cx="${px(PTS.length - 1)}" cy="${py(PTS[PTS.length - 1])}" r="13" fill="#0cd866"/>` +
      `</svg>`;
    const cardSvg = card.querySelector("svg");
    const revealRect = card.querySelector("#revealRect");
    const tip = card.querySelector("#tip");
    const tipPulse = card.querySelector("#tipPulse");
    const pill = el("div", "pill", s4);
    const S4_TEXT = "你的投资绩效";
    const pillC = chars(pill, S4_TEXT);
    const S4_AT = [105, 109, 115, 121, 127, 132];
    const PCW = 70 * 1.02;
    const pillW = spline([[104, 60], ...S4_AT.map((at, i) => [at + 3, 96 + PCW * (i + 1)])]);

    // ---------------------------------------------------------------- s5: 绝对会 / 高于
    const s5 = el("div", "stack onvideo", S.s5);
    const s5aC = chars(el("div", "row small", s5), "绝对会");
    const s5big = el("div", "row big", s5);
    s5big.style.fontSize = "240px";
    const s5bC = chars(s5big, "高于");
    s5.style.left = "760px"; s5.style.top = "872px";
    const S5_AT = { small: [142, 149, 155], big: [163, 167] };

    // ---------------------------------------------------------------- s6: 10x10 grid, counter
    S.s6.classList.add("dark");
    const s6 = el("div", "layer", S.s6);
    s6.style.transformOrigin = "960px 540px";
    const G0X = 300, G0Y = 256, STEP = 58;
    const cells = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
      const e = el("div", "cell", s6);
      const d = Math.hypot(r - 4.5, c - 4.5);
      cells.push({ r, c, e, at: 173 + d * 1.25, dimAt: 186 + r * 0.9 + c * 0.25, glowAt: 191 + c * 0.55 });
    }
    const counter = el("div", "counter", s6);
    counter.style.left = "1040px"; counter.style.top = "312px";
    const cNum = el("span", "", counter);
    const cPct = el("span", "pct", counter, "%");
    const s6tail = el("div", "stack onvideo", s6);
    s6tail.style.left = "1046px"; s6tail.style.top = "700px";
    s6tail.style.alignItems = "flex-start";
    const s6tailRow = el("div", "row small", s6tail);
    s6tailRow.style.fontSize = "84px";
    const s6tC = chars(s6tailRow, "的人");
    const S6_AT = { counter: [175, 193], tail: [194, 200] };
    const tag = el("div", "tag", s6);
    const chip = el("span", "chip", tag, "你");
    tag.style.left = G0X + 10 * STEP + 14 + "px";
    tag.style.top = G0Y + 23 - 34 + "px";

    // f is continuous; scene choice and typing use the whole frame fi
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);

      SCENES.forEach(([id, a, b]) => (S[id].style.display = fi >= a && fi <= b ? "block" : "none"));

      // camera on the A-roll (hidden behind the opaque animated scenes)
      const k = cam(f);
      camLayer.style.transform = `translate(${(k.ox * (1 - k.s)).toFixed(2)}px, ${(k.oy * (1 - k.s)).toFixed(2)}px) scale(${k.s.toFixed(4)})`;

      if (fi <= 47) {
        s1.style.transform = "translate(-50%, -50%)";
        S1_AT.small.forEach((at, i) => land(s1aC[i], f, at));
        S1_AT.big.forEach((at, i) => {
          land(s1bC[i], f, at, { dy: 34, s0: 1.22, dur: 6 });
          s1bC[i].style.color = rgb(mix(GREEN, WHITE, prog(f, at + 5, at + 13)));
        });
        S1_AT.tail.forEach((at, i) => land(s1cC[i], f, at));
      }

      if (fi >= 48 && fi <= 69) {
        const n = S2_AT.filter((at) => fi >= at).length;
        s2C.forEach((c, i) => (c.style.display = i < n ? "inline-block" : "none"));
        const sc = lerp(1.04, 1.0, outCubic(prog(f, 48, 70)));
        s2line.style.transform = `translate(${s2x(f).toFixed(2)}px, -50%) scale(${sc.toFixed(4)})`;
        s2line.style.transformOrigin = "0 50%";
        const hp = inOut(prog(f, 64, 69));
        s2hl.style.transform = `scaleX(${hp.toFixed(4)})`;
        s2hl.style.display = hp > 0 ? "block" : "none";
        // characters under the highlighter switch to ink as the bar passes their centre
        [4, 5].forEach((i) => {
          const over = hp * 2 > i - 4 + 0.5;
          s2C[i].style.color = over ? rgb(INK) : rgb(WHITE);
        });
        s2caret.style.opacity = fi < 67 ? 1 : (Math.floor((fi - 67) / 5) % 2 ? 0 : 1);
      }

      if (fi >= 70 && fi <= 101) {
        s3.style.transform = "translate(-50%, -50%)";
        s3aC.forEach((c) => land(c, f, S3_AT.small, { dy: 16 }));
        land(s3five, f, S3_AT.five, { dy: 10, s0: 1.7, dur: 7, back: 2.2 });
        S3_AT.big.forEach((at, i) => land(s3bC[i], f, at, { dy: 34, s0: 1.2, dur: 6 }));
        const sp = outQuint(prog(f, S3_AT.strike[0], S3_AT.strike[1]));
        s3strike.style.transform = `rotate(-2.5deg) scaleX(${sp.toFixed(4)})`;
        s3strike.style.opacity = sp > 0 ? 1 : 0;
      }

      if (fi >= 102 && fi <= 138) {
        // dot ring: spreads out from the centre and turns slowly
        dots.forEach((d) => {
          const p = outCubic(prog(f, d.at, d.at + 12));
          const a = d.a + d.spin * (f - 102);
          const r = d.r * lerp(0.45, 1, p);
          d.e.style.opacity = (d.o * p).toFixed(3);
          d.e.style.transform = `translate(${(CX + Math.cos(a) * r - d.sz / 2).toFixed(2)}px, ${(CY + Math.sin(a) * r - d.sz / 2).toFixed(2)}px)`;
        });
        // dot -> square -> card
        let w, h, rad;
        if (f < 105) { w = h = lerp(0, 26, outBack(prog(f, 102, 105), 2)); rad = w / 2; }
        else if (f < 108) { w = h = lerp(26, 104, outCubic(prog(f, 105, 108))); rad = lerp(13, 20, prog(f, 105, 108)); }
        else {
          const p = outQuint(prog(f, 108, 116));
          w = lerp(104, CARD_W, p); h = lerp(104, CARD_H, p); rad = lerp(20, 30, p);
        }
        card.style.width = w + "px"; card.style.height = h + "px"; card.style.borderRadius = rad + "px";
        card.style.transform = `translate(${-w / 2}px, ${CY - h / 2}px)`;
        cardSvg.style.opacity = prog(f, 111, 115);
        cardSvg.style.transform = `scale(${(w / CARD_W).toFixed(4)})`;
        cardSvg.style.transformOrigin = "0 0";
        revealRect.setAttribute("width", (CARD_W * inOut(prog(f, 112, 133))).toFixed(1));
        const tp = prog(f, 132, 135);
        tip.setAttribute("r", (13 * outBack(tp, 2.4)).toFixed(2));
        tip.style.opacity = tp > 0 ? 1 : 0;
        const pp = prog(f, 133, 139);
        tipPulse.setAttribute("r", (14 + 30 * outCubic(pp)).toFixed(2));
        tipPulse.style.opacity = pp > 0 ? (1 - pp).toFixed(3) : 0;
        // pill: grows to fit what has been said
        const n = S4_AT.filter((at) => fi >= at).length;
        const pw = pillW(f);
        pill.style.display = f >= 104 ? "flex" : "none";
        pill.style.width = pw + "px";
        pill.style.transform = `translate(${-pw / 2}px, ${CY + CARD_H / 2 - 10}px)`;
        pillC.forEach((c, i) => {
          c.style.display = i < n ? "inline-block" : "none";
          if (i < n) land(c, f, S4_AT[i], { dy: 10, s0: 1.08, dur: 4 });
        });
      }

      if (fi >= 139 && fi <= 172) {
        s5.style.transform = "translate(-50%, -50%)";
        S5_AT.small.forEach((at, i) => land(s5aC[i], f, at));
        S5_AT.big.forEach((at, i) => {
          land(s5bC[i], f, at, { dy: 40, s0: 1.25, dur: 6 });
          s5bC[i].style.color = rgb(mix(GREEN, WHITE, prog(f, at + 6, at + 14)));
        });
      }

      if (fi >= 173) {
        s6.style.transform = `scale(${lerp(1.0, 1.045, prog(f, 173, 210)).toFixed(4)})`;
        cells.forEach((c) => {
          const p = prog(f, c.at, c.at + 6);
          const top = c.r === 0;
          let col = WHITE, sc = outBack(p, 2.2), glow = 0;
          if (!top) col = mix(WHITE, GREY, inOut(prog(f, c.dimAt, c.dimAt + 5)));
          else {
            const g = prog(f, c.glowAt, c.glowAt + 4);
            col = mix(WHITE, GREEN, g);
            sc *= 1 + 0.16 * Math.sin(Math.PI * g);
            glow = g;
          }
          c.e.style.opacity = p > 0 ? 1 : 0;
          c.e.style.background = rgb(col);
          c.e.style.boxShadow = glow > 0 ? `0 0 ${(26 * glow).toFixed(1)}px rgba(12,216,102,${(0.55 * glow).toFixed(3)})` : "none";
          c.e.style.transform = `translate(${G0X + c.c * STEP}px, ${G0Y + c.r * STEP}px) scale(${sc.toFixed(4)})`;
        });
        const cp = prog(f, S6_AT.counter[0], S6_AT.counter[1]);
        cNum.textContent = String(Math.round(90 * outCubic(cp)));
        land(counter, f, S6_AT.counter[0] - 1, { dy: 26, s0: 1.1, dur: 6 });
        S6_AT.tail.forEach((at, i) => land(s6tC[i], f, at));
        land(tag, f, 199, { dy: 0, s0: 0.6, dur: 6, back: 2.4 });
        tag.style.transformOrigin = "0 50%";
      }
    }

    // GSAP proxy tween drives the frame so HyperFrames seeks redraw deterministically
    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
