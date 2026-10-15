// "One terminal, every market": the reference's circles beat in the acend style, 30 fps, 135 frames.
// Every element is a pure function of a continuous frame number, so the 240 fps motion-blur render can sample
// between frames; discrete state (which words are on screen, the cut) uses the nearest whole frame.
//
//   0–20    two huge circles slide in, turning, and frame a gap; "One" grows, "terminal," joins
//   27–55   "every" punches in and settles, "market" joins; the circles keep a slow clockwise turn
//   55–57   the words drop out, left to right
//   55–74   the camera pulls back and keeps turning: four circles, their ink rims lightening to grey
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
  const RA = spline([[0, 1660], [21, 1666], [42, 1665], [45, 1665], [46, 1660], [48, 1642], [50, 1612], [52, 1570], [54, 1520],
    [56, 1456], [58, 1384], [60, 1304], [62, 1220], [64, 1134], [66, 1048], [68, 964], [70, 883], [71, 844], [72, 805], [73, 768], [74, 732]]);
  const ND = spline([[0, 2.783], [3, 2.545], [6, 2.417], [9, 2.33], [12, 2.27], [15, 2.227], [18, 2.197], [21, 2.177], [24, 2.166],
    [27, 2.161], [74, 2.162]]);
  const PSI_A = spline([[0, -83.52], [3, -79.87], [6, -77.14], [9, -74.82], [12, -72.71], [15, -70.75], [18, -68.82], [21, -66.94],
    [24, -65.04], [27, -63.14], [30, -61.19], [33, -59.2], [36, -57.23], [39, -55.3], [42, -53.44], [45, -51.63], [48, -49.86],
    [50, -48.73], [52, -47.61], [54, -46.49], [56, -45.27], [58, -43.97], [60, -42.56], [62, -40.97], [64, -39.16], [66, -37.1],
    [68, -34.59], [70, -31.44], [71, -29.43], [72, -26.93], [73, -23.55], [74, -18.05]]);
  // after the cut (reference label tracks): radius, neighbour distance, cluster centre and the decaying spin
  const RB = spline([[74.5, 450], [76, 425], [78, 405], [80, 375], [84, 330], [88, 312], [92, 300], [96, 293], [100, 286], [108, 279],
    [116, 271], [124, 267], [134, 263]]);
  const NDB = spline([[74.5, 1.97], [76, 1.94], [80, 1.85], [86, 1.74], [94, 1.68], [134, 1.66]]);
  const CXB = spline([[74.5, 1030], [76, 1021], [78, 992], [80, 979], [84, 977], [92, 975], [108, 973], [134, 972]]);
  const CYB = spline([[74.5, 578], [76, 576], [78, 570], [80, 570], [88, 567], [100, 566], [116, 564], [124, 558], [125, 558],
    [126, 553], [127, 546], [128, 537], [129, 526], [130, 506], [131, 490], [132, 468], [133, 436], [134, 392]]);
  const PSI_B = spline([[74.5, 5], [76, 15.6], [78, 38.7], [80, 55], [84, 75.9], [88, 90], [92, 100.3], [96, 108.4], [100, 115],
    [108, 125], [116, 132.6], [124, 138.9], [130, 144], [134, 147.4]]);

  // the four markets, by where they end up (the square settles axis-aligned): i0 starts at the top
  const MARKETS = [
    { name: "ETFs", sub: "SPY / USD" }, // ends bottom-left
    { name: "Stocks", sub: "AAPL / USD" }, // top-left
    { name: "Crypto", sub: "BTC / USD" }, // top-right
    { name: "Pre-IPO", sub: "SPACEX / USD" }, // bottom-right
  ];
  const dir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];

  function circles(f, fi) {
    let R, s, psi, cx, cy;
    if (fi < CUT) {
      // the pair (i0, i1) sits where the reference's pair is; the square's centre lies half a side beyond its
      // gap, easing toward the reference cluster's centroid as the camera pulls back (so the cut lines up)
      R = RA(f); s = ND(f) * R; psi = PSI_A(f) + 15;
      const w = smoother((f - 46) / 28);
      const off = lerp(s / 2, s / (2 * Math.sqrt(3)), w);
      const u = dir(psi + 225);
      cx = MX(f) + u[0] * off; cy = MY(f) + u[1] * off;
    } else {
      R = RB(f); s = NDB(f) * R; psi = PSI_B(f) - 10;
      cx = CXB(f); cy = CYB(f);
    }
    const D = s / Math.SQRT2;
    return MARKETS.map((m, i) => {
      const d = dir(psi + 90 * i);
      return { x: cx + D * d[0], y: cy + D * d[1], r: R, m, cx, cy };
    });
  }
  // rim tone: brand ink, lightening to a hairline grey as the glass takes over (the reference's lime -> white)
  const COOL = (f) => smoother((f - 66) / 9);

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

    // before the cut: the circles are only their rims, glowing inward (the reference's lit edges, in brand ink)
    function drawRims(f, fi) {
      const k = COOL(f);
      const [r, g, b] = mixRGB("#31302e", "#b4b2ab", k);
      for (const c of circles(f, fi)) {
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
    }

    // after the cut: frosted glass discs on warm paper, hairline edges, a soft shadow each, labels on top,
    // inside a thin ring whose bright side catches the light
    function drawGlass(f, fi) {
      const cs = circles(f, fi), R = cs[0].r;
      // two thin rings, fitted on the reference: a lit one centred up-left of the cluster whose near side sweeps
      // across the lower-right discs, and a faint, wider one centred down-right
      const c0 = cs[0], sw = smoother((f - 75) / 14);
      const ring = { x: c0.cx - 1.48 * R, y: c0.cy - lerp(1.3, 1.42, sw) * R, r: lerp(3.14, 3.3, sw) * R };
      const faint = { x: c0.cx + 0.5 * R, y: c0.cy + 0.96 * R, r: 3.45 * R };
      const hl = ((44 + 0.12 * (PSI_B(f) - 125)) * Math.PI) / 180;
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
      ctx.beginPath(); ctx.arc(cx, cy, ringR, hl - 0.32, hl + 0.32); ctx.stroke();
      ctx.restore();
      drawRing();
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
