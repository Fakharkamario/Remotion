// "One terminal, every market": the reference's circles beat in the acend style, 30 fps, 135 frames.
// Every element is a pure function of a continuous frame number, so the 240 fps motion-blur render can sample
// between frames; discrete state (which words are on screen, the cut) uses the nearest whole frame.
//
//   0–20    two huge circles slide in, turning, and frame a gap; "One" grows, "terminal," joins
//   27–55   "every" punches in and settles, "market" joins; the circles keep a slow clockwise turn
//   55–57   the words drop out, left to right
//   55–74   the camera pulls back and keeps turning: four circles, their green rims cooling to grey
//   75–134  cut: the four markets as overlapping glass circles, still turning and pulling back, settle into a
//           2 x 2 cluster inside a thin ring
(function () {
  const FPS = 30;
  const FRAMES = 135;
  const CUT = 75;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  // monotone cubic (PCHIP) through [frame, value] keys: velocity is continuous at every key
  function spline(keys) {
    const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]);
    const h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; d[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
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
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mixRGB = (a, b, t) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], t))); };

  // ------------------------------------------------------------------ headline (as in one-terminal)
  const INK = "#1c1d21";
  function headline(f, fi) {
    if (fi < 27) {
      let size = 142 + 50 * (1 - Math.exp(-f / 4)) + 0.95 * f;
      let gap = 0;
      if (f > 19) size *= 1 - 0.15 * Math.pow((f - 19) / 7, 2.6);
      if (f > 22) gap = -0.27 * Math.pow((f - 22) / 4, 1.8);
      return fi < 7 ? { words: ["One"], size } : { words: ["One", "terminal,"], size, gap, join: { at: 7, prev: "One" } };
    }
    f = Math.max(f, 27); // a beat's motion starts at its cut (no backwards blur samples)
    const size = 140 + 76 * Math.exp(-(f - 27) / 1.6) - 0.35 * (f - 27);
    return fi < 35 ? { words: ["every"], size } : { words: ["every", "market"], size, join: { at: 35, prev: "every", k: 0.14 } };
  }
  const WORD_OUT = [55, 57]; // as in the reference, the words drop out left to right on whole frames

  // ------------------------------------------------------------------ circles + camera
  // World: four unit circles around the cluster centre, at base angles -90 / 0 / 90 / 180 degrees plus the turn
  // (clockwise on screen). Before the cut they sit apart (a rhombus: top and bottom close, so the gap between
  // them frames the words, left and right far out of shot); after it they are an overlapping diamond that the
  // turn brings round to a 2 x 2 grid (turn = 135).
  const MARKETS = [
    { name: "Pre-IPO", sub: "SPACEX / USD" }, // ends bottom-right
    { name: "ETFs", sub: "SPY / USD" }, // bottom-left
    { name: "Stocks", sub: "AAPL / USD" }, // top-left
    { name: "Crypto", sub: "BTC / USD" }, // top-right
  ];
  const BASE = [-90, 0, 90, 180];
  const APART = [1.12, 1.9, 1.12, 1.9]; // distance from the centre, circle radii, before the cut
  const CLOSE = 1.24; // after the cut: neighbours overlap by about a quarter radius, as in the reference
  // the circles come in from further out at the start
  const spread = spline([[0, 1.3], [6, 1.15], [12, 1.05], [18, 1.01], [26, 1.0]]);
  // circle radius on screen (px): the camera's pull-back. One move, slow through the words, then faster; the cut
  // keeps the scale, and the glass circles keep pulling back and settle.
  const RAD = spline([[0, 1640], [8, 1500], [16, 1440], [26, 1415], [45, 1385], [54, 1350], [58, 1240], [62, 1060], [66, 880],
    [70, 720], [74, 600], [75, 585], [78, 470], [82, 375], [88, 305], [96, 268], [110, 244], [134, 228]]);
  // the turn (deg, clockwise): swings level as the circles arrive, a slow drift under the words, then it winds
  // up with the pull-back and is fastest through the cut (where the motion blur carries it), then settles
  const TURN = spline([[0, -38], [8, -17], [16, -5], [24, 0], [40, 6], [52, 10], [58, 15], [62, 22], [66, 31], [70, 41], [74, 52],
    [75, 55], [78, 67], [82, 84], [88, 102], [96, 116], [110, 127], [134, 135]]);
  // cluster centre on screen: centred under the words, drifting a touch up and left at the end (as in the reference)
  const CX = spline([[0, 960], [74, 960], [100, 966], [134, 972]]);
  const CY = spline([[0, 540], [74, 540], [100, 528], [134, 520]]);
  // rim colour: acend green, cooling to a warm grey as the glass takes over
  const COOL = (f) => smoother((f - 64) / 11);

  function circles(f, fi) {
    const after = fi >= CUT;
    const R = RAD(f), th = TURN(f), sp = after ? 1 : spread(f);
    return BASE.map((b, i) => {
      const a = ((b + th) * Math.PI) / 180, d = (after ? CLOSE : APART[i] * sp) * R;
      return { x: CX(f) + d * Math.cos(a), y: CY(f) + d * Math.sin(a), r: R, m: MARKETS[i] };
    });
  }

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    stage.innerHTML = `<canvas id="cv" width="1920" height="1080"></canvas><div id="line"></div><span id="meas"></span>`;
    const cv = stage.querySelector("#cv"), ctx = cv.getContext("2d");
    const line = stage.querySelector("#line"), meas = stage.querySelector("#meas");
    const widthOf = (text, size, gap) => {
      meas.textContent = text;
      meas.style.fontSize = size + "px";
      meas.style.wordSpacing = (gap || 0) + "em";
      return meas.getBoundingClientRect().width;
    };
    let lastKey = null;

    const circlePath = (c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); };

    // before the cut: the circles are only their rims, glowing inward (the reference's lit edges, in acend green)
    function drawRims(f, fi) {
      const k = COOL(f);
      const [r, g, b] = mixRGB("#4f8c68", "#b9b7b0", k);
      for (const c of circles(f, fi)) {
        if (c.x + c.r < -40 || c.x - c.r > 1960 || c.y + c.r < -40 || c.y - c.r > 1120) continue;
        ctx.save();
        circlePath(c); ctx.clip();
        // inner glow: a wide soft stroke, clipped to the inside
        ctx.shadowColor = `rgba(${r},${g},${b},${(0.55 - 0.25 * k).toFixed(3)})`;
        ctx.shadowBlur = 34;
        ctx.lineWidth = 10;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        circlePath(c); ctx.stroke();
        ctx.restore();
        // a faint wash just inside the rim
        const gr = ctx.createRadialGradient(c.x, c.y, Math.max(0, c.r - 90), c.x, c.y, c.r);
        gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
        gr.addColorStop(1, `rgba(${r},${g},${b},${(0.10 - 0.04 * k).toFixed(3)})`);
        ctx.fillStyle = gr; circlePath(c); ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        circlePath(c); ctx.stroke();
      }
    }

    // after the cut: frosted glass discs on warm paper, hairline edges, a soft shadow each, labels on top,
    // inside a thin ring whose bright side catches the light
    function drawGlass(f, fi) {
      const cs = circles(f, fi), R = cs[0].r;
      // ring
      const ringR = 2.32 * R, cx = CX(f) - 0.18 * R, cy = CY(f) + 0.06 * R;
      const hl = ((-8 + 0.25 * (TURN(f) - 55)) * Math.PI) / 180; // highlight angle (right side), drifting with the turn
      const N = 180;
      ctx.lineWidth = 2;
      for (let s = 0; s < N; s++) {
        const a0 = (s / N) * Math.PI * 2, a1 = ((s + 1.05) / N) * Math.PI * 2;
        const lit = Math.pow(Math.max(0, Math.cos((a0 + a1) / 2 - hl)), 3);
        ctx.strokeStyle = `rgba(${lit > 0.02 ? "79,140,104" : "28,29,33"},${(0.07 + 0.75 * lit).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(cx, cy, ringR, a0, a1); ctx.stroke();
      }
      // shadows first, so a disc's shadow falls on the paper and on the discs below it
      for (const c of cs) {
        ctx.save();
        ctx.shadowColor = "rgba(40,30,10,0.13)";
        ctx.shadowBlur = 0.28 * R;
        ctx.shadowOffsetY = 0.07 * R;
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        circlePath(c); ctx.fill();
        ctx.restore();
      }
      for (const c of cs) {
        // a gentle top-lit sheen across each disc
        const gr = ctx.createLinearGradient(c.x, c.y - c.r, c.x, c.y + c.r);
        gr.addColorStop(0, "rgba(255,255,255,0.45)");
        gr.addColorStop(1, "rgba(255,255,255,0.0)");
        ctx.fillStyle = gr; circlePath(c); ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "rgba(28,29,33,0.17)";
        circlePath(c); ctx.stroke();
      }
      // where the ring's bright side crosses a disc, the glass catches it
      ctx.save();
      ctx.beginPath(); cs.forEach((c) => { ctx.moveTo(c.x + c.r, c.y); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); }); ctx.clip();
      ctx.lineWidth = 0.09 * R;
      ctx.filter = `blur(${(0.035 * R).toFixed(1)}px)`;
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath(); ctx.arc(cx, cy, ringR, hl - 0.55, hl + 0.55); ctx.stroke();
      ctx.restore();
      // labels stay upright
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      for (const c of cs) {
        ctx.fillStyle = INK;
        ctx.font = `500 ${(0.2 * R).toFixed(1)}px Inter`;
        ctx.fillText(c.m.name, c.x, c.y + 0.05 * R);
        ctx.fillStyle = "#8b8a86";
        ctx.font = `500 ${(0.068 * R).toFixed(1)}px Inter`;
        ctx.fillText(c.m.sub, c.x, c.y + 0.18 * R);
      }
    }

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);
      // keep each side of the cut inside its own window, so blur samples never mix the two
      const g = fi < CUT ? Math.min(f, CUT - 0.5) : Math.max(f, CUT - 0.5);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.fillStyle = "#f9f8f4"; ctx.fillRect(0, 0, 1920, 1080);
      if (fi < CUT) drawRims(g, fi); else drawGlass(g, fi);

      // headline
      if (fi < WORD_OUT[1]) {
        const h = headline(f, fi);
        const key = h.words.join(" ");
        if (key !== lastKey) { lastKey = key; line.innerHTML = h.words.map((w) => `<span>${w}</span>`).join(" "); }
        line.style.display = "block";
        line.style.fontSize = h.size + "px";
        line.style.wordSpacing = (h.gap || 0) + "em";
        let dx = 0;
        if (h.join) {
          const grow = widthOf(h.words.join(" "), h.size, h.gap) - widthOf(h.join.prev, h.size, h.gap);
          dx = (h.join.k || 0.3) * (grow / 2) * Math.exp(-(f - h.join.at) / 1.5);
        }
        line.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), -54%)`;
        [...line.children].forEach((s, i) => (s.style.visibility = i === 0 && fi >= WORD_OUT[0] ? "hidden" : "visible"));
      } else line.style.display = "none";
    }

    // GSAP proxy tween drives the frame so HyperFrames seeks redraw deterministically
    const Rr = { _f: 0 };
    Object.defineProperty(Rr, "frame", { get: () => Rr._f, set: (v) => { Rr._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(Rr, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(Rr._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
