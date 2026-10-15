// "One terminal, every market": the reference's circles beat in the acend style, 30 fps, 135 frames.
// Every element is a pure function of a continuous frame number, so the 240 fps motion-blur render can sample
// between frames; discrete state (which words are on screen, the cut) uses the nearest whole frame.
//
//   0–20    two huge circles slide in, turning, and frame a gap; "One" grows, "terminal," joins
//   27–55   "every" punches in and settles, "market" joins; the circles keep a slow clockwise turn
//   55–57   the words drop out, left to right
//   46–82   the camera pulls back and turns faster: four circles close up and, in one continuous move, their ink
//           rims become overlapping glass discs; the labels resolve out of a soft blur and two thin rings fade in
//   82–134  the spin decays, the 2 x 2 cluster settles, then lifts out of frame
(function () {
  const FPS = 30;
  const FRAMES = 135;

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
  const WORD_OUT = [56, 58]; // as in the reference, the words drop out left to right on whole frames

  // ------------------------------------------------------------------ circles + camera
  // Tracked off the reference frame by frame (circle fits on its rims before the cut, label positions and sizes
  // after it). The reference is a rigid cluster of equal circles seen through a camera that holds on the gap
  // between two of them, turning slowly, then pulls back while it turns faster; after the cut the glass circles
  // keep turning on a decaying spin, settle, and the cluster lifts out of frame. Our cluster is four circles in a
  // square; the pair framing the words is one side of it, placed exactly where the reference's pair is.
  //   M     the gap midpoint on screen (px)          R   circle radius on screen (px)
  //   ND    centre-to-centre distance of neighbours, in radii (the two circles close in at the start)
  //   PSI   the turn (deg, clockwise on screen) of the circle that starts at the top
  const MX = spline([[0, 988], [3, 974], [6, 966], [9, 960], [12, 956], [15, 954], [18, 952], [21, 951], [24, 950], [30, 950],
    [36, 951], [45, 952], [46, 955], [48, 966], [50, 984], [52, 1007], [54, 1036], [56, 1068], [58, 1102], [60, 1136], [62, 1171],
    [64, 1204], [66, 1235], [68, 1262], [70, 1286], [71, 1294], [72, 1301], [73, 1303], [74, 1296]]);
  const MY = spline([[0, 533], [45, 532], [46, 532], [48, 536], [50, 542], [52, 551], [54, 562], [56, 574], [58, 587], [60, 602],
    [62, 616], [64, 634], [66, 652], [68, 673], [70, 698], [71, 712], [72, 730], [73, 752], [74, 784]]);
  // after the hand-over (reference label tracks): neighbour distance, cluster centre and the decaying spin.
  // Where the reference cuts, ours keeps one continuous move: radius, spin, spacing and centre each run on one
  // curve across the hand-over, so the rim circles close up and *become* the glass circles without a jump.
  const R_ALL = spline([[0, 1660], [21, 1666], [45, 1665], [46, 1660], [48, 1642], [50, 1612], [52, 1570], [54, 1520], [56, 1456],
    [58, 1384], [60, 1304], [62, 1220], [64, 1134], [66, 1048], [68, 964], [70, 883], [72, 802], [74, 718], [76, 636], [78, 560],
    [80, 494], [82, 440], [84, 398], [87, 354], [90, 325], [94, 303], [100, 287], [108, 279], [116, 271], [124, 267], [134, 263]]);
  const ND_ALL = spline([[0, 2.783], [3, 2.545], [6, 2.417], [9, 2.33], [12, 2.27], [15, 2.227], [18, 2.197], [21, 2.177], [24, 2.166],
    [27, 2.161], [64, 2.162], [70, 2.11], [76, 1.98], [82, 1.84], [88, 1.74], [96, 1.68], [134, 1.66]]);
  // the spin, in the square's frame: the reference's turn before the hand-over, its post-cut spin after it
  const PSI_ALL = spline([[0, -68.52], [3, -64.87], [6, -62.14], [9, -59.82], [12, -57.71], [15, -55.75], [18, -53.82], [21, -51.94],
    [24, -50.04], [27, -48.14], [30, -46.19], [33, -44.2], [36, -42.23], [39, -40.3], [42, -38.44], [45, -36.63], [48, -34.86],
    [50, -33.73], [52, -32.61], [54, -31.49], [56, -30.27], [58, -28.97], [60, -27.56], [62, -25.97], [64, -24.16], [66, -22.1],
    [68, -19.59], [70, -16.44], [72, -11.93], [74, -5.5], [77, 6], [80, 22], [84, 40.5], [88, 54], [92, 64.5], [96, 73],
    [100, 79.6], [108, 89.6], [116, 97.2], [124, 103.5], [130, 108.6], [134, 112]]);
  const CXB = spline([[66, 1000], [80, 979], [84, 977], [92, 975], [108, 973], [134, 972]]);
  const CYB = spline([[66, 572], [80, 570], [88, 567], [100, 566], [116, 564], [124, 558], [125, 558],
    [126, 553], [127, 546], [128, 537], [129, 526], [130, 506], [131, 490], [132, 468], [133, 436], [134, 392]]);
  // how far the rims have turned into glass (0..1)
  const GLASS = (f) => smoother((f - 63) / 19);

  // the four markets, by where they end up (the square settles axis-aligned): i0 starts at the top
  const MARKETS = [
    { name: "ETFs", sub: "SPY / USD" }, // ends bottom-left
    { name: "Stocks", sub: "AAPL / USD" }, // top-left
    { name: "Crypto", sub: "BTC / USD" }, // top-right
    { name: "Pre-IPO", sub: "SPACEX / USD" }, // bottom-right
  ];
  const dir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];

  function circles(f) {
    const R = R_ALL(f), s = ND_ALL(f) * R, psi = PSI_ALL(f);
    // early on, the pair (i0, i1) sits where the reference's pair is: the square's centre lies half a side beyond
    // their gap (easing toward the reference cluster's centroid as the camera pulls back); then the centre hands
    // over to the reference's post-cut track
    const fa = Math.min(f, 74);
    const w = smoother((fa - 46) / 28);
    const off = lerp(s / 2, s / (2 * Math.sqrt(3)), w);
    const u = dir(psi + 225);
    const ax = MX(fa) + u[0] * off, ay = MY(fa) + u[1] * off;
    const h = smoother((f - 62) / 20);
    const cx = lerp(ax, CXB(f), h), cy = lerp(ay, CYB(f), h);
    const D = s / Math.SQRT2;
    return MARKETS.map((m, i) => {
      const d = dir(psi + 90 * i);
      return { x: cx + D * d[0], y: cy + D * d[1], r: R, m, cx, cy };
    });
  }
  // rim tone: brand ink, lightening to a hairline grey as the glass takes over (the reference's lime -> white)
  const COOL = (f) => smoother((f - 60) / 16);

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE._debug = { circles }; // for offline checks of the motion
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

    // before the cut: the circles are only their rims, glowing inward (the reference's lit edges, in brand ink)
    function drawRims(f, alpha) {
      if (alpha <= 0.002) return;
      const k = COOL(f);
      ctx.save();
      ctx.globalAlpha = alpha;
      const [r, g, b] = mixRGB("#31302e", "#b4b2ab", k);
      for (const c of circles(f)) {
        if (c.x + c.r < -40 || c.x - c.r > 1960 || c.y + c.r < -40 || c.y - c.r > 1120) continue;
        ctx.save();
        circlePath(c); ctx.clip();
        // inner glow: a wide soft stroke, clipped to the inside
        ctx.shadowColor = `rgba(${r},${g},${b},${(0.32 - 0.12 * k).toFixed(3)})`;
        ctx.shadowBlur = 34;
        ctx.lineWidth = 10;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
        circlePath(c); ctx.stroke();
        ctx.restore();
        // a faint wash just inside the rim
        const gr = ctx.createRadialGradient(c.x, c.y, Math.max(0, c.r - 90), c.x, c.y, c.r);
        gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
        gr.addColorStop(1, `rgba(${r},${g},${b},${(0.06 - 0.02 * k).toFixed(3)})`);
        ctx.fillStyle = gr; circlePath(c); ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        circlePath(c); ctx.stroke();
      }
      ctx.restore();
    }

    // after the hand-over: frosted glass discs on warm paper, hairline edges, a soft shadow each, labels on top,
    // inside a thin ring whose bright side catches the light
    function drawGlass(f, k) {
      if (k <= 0.002) return;
      const cs = circles(f), R = cs[0].r;
      const ringA = smoother((f - 70) / 16), labA = smoother((f - 72) / 12);
      ctx.save();
      // two thin rings, fitted on the reference: a lit one centred up-left of the cluster whose near side sweeps
      // across the lower-right discs, and a faint, wider one centred down-right
      const c0 = cs[0], sw = smoother((f - 72) / 18);
      const ring = { x: c0.cx - 1.48 * R, y: c0.cy - lerp(1.3, 1.42, sw) * R, r: lerp(3.14, 3.3, sw) * R };
      const faint = { x: c0.cx + 0.5 * R, y: c0.cy + 0.96 * R, r: 3.45 * R };
      const hl = ((44 + 0.12 * (PSI_ALL(f) - 103)) * Math.PI) / 180;
      ctx.globalAlpha = ringA;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(49,48,46,0.10)";
      ctx.beginPath(); ctx.arc(faint.x, faint.y, faint.r, 0, Math.PI * 2); ctx.stroke();
      // the lit ring is drawn over the glass (below)
      const drawRing = () => {
        const N = 180;
        ctx.lineWidth = 2;
        for (let s = 0; s < N; s++) {
          const a0 = (s / N) * Math.PI * 2, a1 = ((s + 1.05) / N) * Math.PI * 2;
          const lit = Math.pow(Math.max(0, Math.cos((a0 + a1) / 2 - hl)), 6);
          ctx.strokeStyle = `rgba(49,48,46,${(0.07 + 0.5 * lit).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, a0, a1); ctx.stroke();
        }
      };
      const ringR = ring.r, cx = ring.x, cy = ring.y;
      // shadows first, so a disc's shadow falls on the paper and on the discs below it
      ctx.globalAlpha = k;
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
      ctx.globalAlpha = k * ringA;
      ctx.beginPath(); cs.forEach((c) => { ctx.moveTo(c.x + c.r, c.y); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); }); ctx.clip();
      ctx.lineWidth = 0.09 * R;
      ctx.filter = `blur(${(0.035 * R).toFixed(1)}px)`;
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath(); ctx.arc(cx, cy, ringR, hl - 0.32, hl + 0.32); ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = ringA;
      drawRing();
      // labels stay upright; they resolve out of a soft blur, growing in a touch as the glass forms
      ctx.globalAlpha = labA;
      if (labA < 0.999) ctx.filter = `blur(${(9 * (1 - labA)).toFixed(2)}px)`;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      const ls = lerp(0.86, 1, smoother((f - 70) / 18));
      for (const c of cs) {
        ctx.fillStyle = INK;
        ctx.font = `500 ${(0.2 * R * ls).toFixed(1)}px Inter`;
        ctx.fillText(c.m.name, c.x, c.y + 0.05 * R * ls);
        ctx.fillStyle = "#8b8a86";
        ctx.font = `500 ${(0.068 * R * ls).toFixed(1)}px Inter`;
        ctx.fillText(c.m.sub, c.x, c.y + 0.18 * R * ls);
      }
      ctx.restore();
    }

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.fillStyle = "#f9f8f4"; ctx.fillRect(0, 0, 1920, 1080);
      // one continuous move: the glass forms on the rim circles as they close up
      const k = GLASS(f);
      drawGlass(f, k);
      drawRims(f, 1 - k);

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
