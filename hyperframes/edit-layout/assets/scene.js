// "Edit layout" / "Ask AI" — picks up on the last frame of "just ask" and runs in the same kinetic language.
// 30 fps, 486 frames. Every element is a pure function of a continuous frame number so the 240 fps motion-blur render
// can sample between frames; discrete state (words, cuts) uses whole frames.
//
//   0–30    "just ask"'s last frame (Coca-Cola, floating in 3D): the window levels out and the camera dives into the
//           settings gear as it spins
//   30      cut on the gear to the headline: "Edit" grows, "layout" joins
//   58–96   the headline *is* the "Edit layout" item of the settings menu: the Solana page opens out around it as
//           the camera pulls back
//   96–130  click Edit layout: the menu folds away, the editor's grips, eyes, hint and drop zone arrive, in 3D
//   130–176 grab the chart and drag it down below the activity panel, which slides up into its place
//   176–220 the settings menu again: Done editing; the editor's furniture leaves, the new layout stays
//   220–306 the camera dives into the Ask AI pill: its label becomes the headline "Ask AI", and the camera pulls
//           back out to the pill again
//   306–486 click Ask AI: the side panel slides in; click Analyze: the message flies up, typing dots, a streamed
//           reply and a Solana card; the camera eases out to the floating window
(function () {
  const FPS = 30;
  const FRAMES = 486;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));
  const sine = (t) => (t = clamp(t, 0, 1), 0.5 - 0.5 * Math.cos(Math.PI * t));
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  const bump = (f, t0, d) => Math.sin(Math.PI * clamp((f - t0) / d, 0, 1));
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
  // keyframes [frame, focus x, focus y, zoom, tilt x, tilt y, backdrop], joined linearly (zoom in log space) and
  // Gaussian-smoothed, so velocity and acceleration stay continuous
  function smoothPath(keys, F0, F1, sig) {
    const STEP = 0.1, n = Math.round((F1 - F0) / STEP) + 1, CH = keys[0].length - 1;
    const raw = (f, k) => {
      if (f <= keys[0][0]) return keys[0][k];
      for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) {
        const t = (f - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
        return k === 3 ? Math.exp(lerp(Math.log(keys[i - 1][3]), Math.log(keys[i][3]), t)) : lerp(keys[i - 1][k], keys[i][k], t);
      }
      return keys[keys.length - 1][k];
    };
    const R = Math.round((3 * sig) / STEP), w = [];
    for (let j = -R; j <= R; j++) w.push(Math.exp(-0.5 * Math.pow((j * STEP) / sig, 2)));
    const ws = w.reduce((x, y) => x + y, 0);
    const out = [];
    for (let k = 1; k <= CH; k++) out.push(new Float64Array(n));
    for (let i = 0; i < n; i++) for (let k = 1; k <= CH; k++) {
      let v = 0;
      for (let j = -R; j <= R; j++) { const r = raw(F0 + (i + j) * STEP, k); v += w[j + R] * (k === 3 ? Math.log(r) : r); }
      out[k - 1][i] = v / ws;
    }
    return (f) => {
      const u = clamp((f - F0) / STEP, 0, n - 1.001), i = Math.floor(u), t = u - i;
      const g = (k) => lerp(out[k][i], out[k][i + 1], t);
      return { x: g(0), y: g(1), z: Math.exp(g(2)), rx: g(3), ry: g(4), dark: g(5) };
    };
  }

  // ------------------------------------------------------------------ headline (as in the earlier clips)
  const INK = "#1c1d21";
  const CUT_TEXT = 30, CUT_UI = 58, ASK_IN = 246, ASK_OUT = 276;
  function headline(f, fi) {
    const g = f - CUT_TEXT;
    const size = 142 + 50 * (1 - Math.exp(-g / 4)) + 0.6 * g;
    return fi < CUT_TEXT + 7 ? { words: ["Edit"], size } : { words: ["Edit", "layout"], size, join: { at: CUT_TEXT + 7, prev: "Edit" } };
  }

  // ------------------------------------------------------------------ camera: screen = O + Z * window point
  const fromFocus = (fx, fy, z) => ({ Z: z, O: { x: 960 - z * fx, y: 540 - z * fy } });
  const project = (c, p) => ({ x: c.O.x + c.Z * p.x, y: c.O.y + c.Z * p.y });
  const G = { gear: { x: 1208, y: 32 }, label: { x: 1096, y: 96 }, ask: { x: 1845, y: 850 }, labelH: 23, askH: 18 }; // measured at mount
  const Z_TEXT = { edit: 8.2, ask: 10.5 }; // headline size / UI label size (set at mount)
  // the opening: "just ask" leaves the camera at (960, 445.5) x0.788, tilted (4°, 6°); it levels out and dives into the gear
  function openCam(f) {
    const t = clamp(f / CUT_TEXT, 0, 1), L = lerp(Math.log(0.788), Math.log(9), t * t * t), Z = Math.exp(L);
    const w = smoother(t * 1.3), F0 = { x: 960, y: 445.5 };
    const d = { x: 0.788 * (G.gear.x - F0.x) * (1 - w), y: 0.788 * (G.gear.y - F0.y) * (1 - w) };
    const c = fromFocus(G.gear.x - d.x / Z, G.gear.y - d.y / Z, Z);
    c.rx = 4 * (1 - smoother(t * 1.4)); c.ry = 6 * (1 - smoother(t * 1.4)); c.dark = 1 - smoother(t * 1.6);
    return c;
  }
  // into the UI: the menu's "Edit layout" label starts where (and as large as) the headline is, and the camera pulls back
  let HEAD_C = { x: 960, y: 540 };
  function pullTo(f, a, b, P, Z0, F1, Z1, S0) {
    const t = clamp((f - a) / (b - a), 0, 1), e = sine(t), Z = Math.exp(lerp(Math.log(Z0), Math.log(Z1), e));
    const s = { x: lerp(S0.x, 960 + Z1 * (P.x - F1.x), e), y: lerp(S0.y, 540 + Z1 * (P.y - F1.y), e) };
    return { Z, O: { x: s.x - Z * P.x, y: s.y - Z * P.y } };
  }
  // After the hand-off the edit works like "just ask": every shot is a slow continuous drift (focus point + zoom,
  // linear in time so the frame never parks), close-ups on what is being clicked, cuts on the action, and two shots
  // that float the window in 3D on a deep backdrop. [from, to, start [x, y, zoom], end, tilt [[x, y] start, end], dark]
  const SHOTS = [
    { a: 96, b: 112, s: [1110, 150, 2.3], e: [1088, 162, 2.46] },
    { a: 112, b: 136, s: [930, 470, 0.74], e: [985, 445, 0.81], tilt: [[14, -20], [7, -11]], dark: 1 },
    { a: 136, b: 178, drag: true },
    { a: 178, b: 200, s: [1160, 118, 2.38], e: [1122, 138, 2.56] },
    { a: 200, b: 216, s: [960, 470, 0.72], e: [985, 450, 0.79], tilt: [[-12, 18], [-6, 10]], dark: 1 },
    { a: 216, b: 222, s: [1690, 770, 1.62], e: [1730, 790, 1.76] },
    { a: 306, b: 330, s: [1700, 760, 1.9], e: [1650, 700, 1.8] },
    { a: 330, b: 362, s: [1590, 430, 1.42], e: [1590, 385, 1.55] },
    { a: 362, b: 420, s: [1590, 215, 1.95], e: [1590, 300, 1.88] },
    { a: 420, b: 452, s: [1585, 392, 2.08], e: [1605, 404, 2.26] },
    { a: 452, b: 486, s: [960, 470, 0.72], e: [960, 445, 0.8], tilt: [[10, 16], [4, 6]], dark: 1 },
  ];
  const shotCam = (sh, f) => {
    const u = clamp((f - sh.a) / (sh.b - sh.a), -0.02, 1.02);
    let x, y, z;
    if (sh.drag) { x = lerp(690, 740, u); y = 330 + 0.78 * dragY(f); z = Math.exp(lerp(Math.log(1.46), Math.log(1.36), u)); }
    else { x = lerp(sh.s[0], sh.e[0], u); y = lerp(sh.s[1], sh.e[1], u); z = Math.exp(lerp(Math.log(sh.s[2]), Math.log(sh.e[2]), u)); }
    const c = fromFocus(x, y, z);
    c.rx = sh.tilt ? lerp(sh.tilt[0][0], sh.tilt[1][0], smoother(u * 1.15)) : 0;
    c.ry = sh.tilt ? lerp(sh.tilt[0][1], sh.tilt[1][1], smoother(u * 1.15)) : 0;
    c.dark = sh.dark || 0; c.fx = x; c.fy = y;
    return c;
  };
  const shotAt = (fi) => { let k = -1; SHOTS.forEach((sh, i) => { if (fi >= sh.a && fi < sh.b) k = i; }); return k; };
  function camera(f, fi) {
    if (fi === undefined) fi = Math.round(f);
    let c;
    if (fi < CUT_TEXT) return openCam(Math.min(f, CUT_TEXT - 0.5));
    if (fi < CUT_UI) c = { Z: 1, O: { x: 0, y: 0 } }; // the window is hidden behind the headline
    else if (fi < 96) {
      const g = Math.max(f, CUT_UI - 0.5), s0 = SHOTS[0].s;
      c = pullTo(g, CUT_UI - 0.5, 96, G.label, Z_TEXT.edit, { x: s0[0], y: s0[1] }, s0[2], HEAD_C);
    } else if (fi >= 222 && fi < ASK_IN) {
      // dive into the Ask AI pill: log-zoom accelerates until its label is headline-sized at the screen centre
      const g = Math.min(f, ASK_IN - 0.5), p0 = shotCam(SHOTS[5], 222), t = clamp((g - 222) / (ASK_IN - 222), 0, 1);
      const Z = Math.exp(lerp(Math.log(p0.Z), Math.log(Z_TEXT.ask), t * t)), w = smoother(t * 1.2);
      const d = { x: p0.Z * (G.ask.x - p0.fx) * (1 - w), y: p0.Z * (G.ask.y - p0.fy) * (1 - w) };
      c = fromFocus(G.ask.x - d.x / Z, G.ask.y - d.y / Z, Z);
    } else if (fi >= ASK_IN && fi < ASK_OUT) {
      c = fromFocus(G.ask.x, G.ask.y, Z_TEXT.ask * (1 + 0.06 * smoother((f - ASK_IN) / 30)));
    } else if (fi >= ASK_OUT && fi < 306) {
      const g = Math.max(f, ASK_OUT - 0.5), s0 = SHOTS[6].s;
      c = pullTo(g, ASK_OUT - 0.5, 306, G.ask, Z_TEXT.ask * 1.06, { x: s0[0], y: s0[1] }, s0[2], { x: 960, y: 540 });
    } else {
      const k = shotAt(fi);
      // keep each shot's samples inside its own window, so blur never mixes two shots
      const sh = SHOTS[k];
      return shotCam(sh, clamp(f, sh.a - 0.5, sh.b - 0.5));
    }
    c.rx = 0; c.ry = 0; c.dark = 0;
    return c;
  }

  // ------------------------------------------------------------------ interaction script (window px)
  const TAP = { edit: 101, grab: 142, gear: 184, done: 195, ask: 314, analyze: 356 };
  const DRAG = { from: 142, to: 172, dy: 390 }; // the chart panel moves down by the activity panel's height + gap
  const CUR_ON = [[96, 112], [136, 178], [178, 200], [306, 330], [330, 362]];
  const CUR = (() => {
    const L = G.label;
    const keys = [
      [96, 1190, 210], [99.5, 1112, 104], [101, 1104, 98], [112, 1100, 106],
      [136, 520, 330], [140, 400, 260], [142, 380, 246], [176, 420, 640],
      [178, 1310, 210], [182.5, 1216, 42], [184, 1208, 34], [189, 1160, 70], [194, 1108, 92], [195, 1100, 92], [200, 1120, 112],
      [306, 1660, 720], [312, 1822, 832], [314, 1845, 850], [330, 1700, 560], [350, 1612, 338], [356, 1590, 321], [362, 1600, 330],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => {
      if (f >= DRAG.from && f <= DRAG.to + 4) return { x: 380 + 10 * smoother((f - DRAG.from) / 30), y: 246 + dragY(f) };
      return { x: sx(f), y: sy(f) };
    };
  })();
  // the chart follows the cursor down (eased), then settles into the slot below the activity panel
  const dragY = (f) => DRAG.dy * (0.92 * smoother((f - DRAG.from) / 24) + 0.08 * smoother((f - DRAG.from - 18) / 12));
  const cursorOpacity = (f, fi) => {
    for (const [a, b] of CUR_ON) if (fi >= a && fi < b) return smoother((f - a + 0.5) / 4) * (1 - smoother((f - b + 5) / 4));
    return 0;
  };
  const pressed = (f) => {
    let p = 0;
    for (const k in TAP) if (k !== "grab") p = Math.max(p, smoother((f - TAP[k] + 1.5) / 1.5) * (1 - smoother((f - TAP[k] - 2) / 4)));
    p = Math.max(p, smoother((f - DRAG.from + 1.5) / 1.5) * (1 - smoother((f - DRAG.to) / 3)));
    return p;
  };
  const EDIT_ON = (f) => smoother((f - 104) / 12) * (1 - smoother((f - 197) / 12));

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE._probe = { camera, project };
  SCENE.mount = function (stage) {
    stage.innerHTML = `<div id="bg"></div><div id="reveal"><div id="cam"><div id="win"></div></div></div>
      <div id="line"></div><div id="askline">Ask AI</div>
      <svg id="cursor" width="1920" height="1080" viewBox="0 0 1920 1080">
        <defs><radialGradient id="dotg"><stop offset="0" stop-color="#b9dcc5"/><stop offset="1" stop-color="#7fb894"/></radialGradient></defs>
        <circle id="halo" r="0" fill="#9fd0b0"/><circle id="ring" r="0" fill="none" stroke="#7fb894" stroke-width="2"/>
        <circle id="dot" r="0" fill="url(#dotg)" stroke="#ffffff" stroke-width="2.5"/>
      </svg><span id="meas"></span>`;
    const $ = (s) => stage.querySelector(s);
    const reveal = $("#reveal"), camEl = $("#cam"), winEl = $("#win"), bg = $("#bg"), ui = DESK.build(winEl);
    const line = $("#line"), askline = $("#askline"), meas = $("#meas");
    const dot = $("#dot"), ring = $("#ring"), halo = $("#halo");
    const widthOf = (text, size) => { meas.textContent = text; meas.style.fontSize = size + "px"; return meas.getBoundingClientRect().width; };
    let lastKey = null, solW = 0;

    // "just ask"'s last frame, frozen: 375 typed, Bought, the toast down, $975.00
    ui.koTyped.textContent = "375"; ui.koPh.style.display = "none"; ui.koRecv.textContent = "≈ 4.00 KO";
    ui.koAmtBox.style.boxShadow = "inset 0 0 0 1.6px #31302e"; ui.koAmtBox.style.background = "#fdfcfa";
    ui.buy.style.background = "#4f8c68"; ui.bb0.style.opacity = 0; ui.bb2.style.opacity = 1;
    ui.tOk.style.opacity = 1; ui.tT0.style.opacity = 0; ui.tT1.style.opacity = 1; ui.tSpin.style.opacity = 0; ui.tTxt.style.opacity = 1;
    ui.tabpill.style.left = "72px"; ui.tabpill.style.width = "120px";

    // measure the UI anchors in window px (nothing is transformed yet)
    const measure = () => {
      camEl.style.transform = "none"; winEl.style.transform = "none";
      const r0 = winEl.getBoundingClientRect();
      const ctr = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - r0.left + r.width / 2, y: r.top - r0.top + r.height / 2, h: r.height, w: r.width }; };
      const gm = ui.gm0.style.display; ui.gm0.style.display = "block";
      const lab = ctr(ui.mEditLabel); ui.gm0.style.display = gm;
      G.gear = ctr(ui.gear); G.label = lab;
      G.ask = ctr(ui.askfloat);
      // headline size at the hand-off decides the zoom that makes the UI label match it
      const h = headline(CUT_UI, CUT_UI);
      Z_TEXT.edit = (h.size * 1.0) / 23; // menu items are 23 px
      Z_TEXT.ask = 200 / 18; // the pill's label is 18 px; the "Ask AI" headline is 200 px
      HEAD_C = { x: 960, y: 540 };
    };
    measure();

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);
      const c = camera(f, fi);
      camEl.style.transform = `translate(${c.O.x.toFixed(3)}px, ${c.O.y.toFixed(3)}px) scale(${c.Z.toFixed(5)})`;
      winEl.style.transform = c.rx || c.ry ? `rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg)` : "none";
      bg.style.setProperty("--dark", (c.dark || 0).toFixed(3));

      // ---------------- which page, and the UI <-> headline hand-offs (feathered circles around the label)
      const textOnly = (fi >= CUT_TEXT && fi < CUT_UI) || (fi >= ASK_IN && fi < ASK_OUT);
      reveal.style.display = textOnly ? "none" : "block";
      let mask = "none";
      if (fi >= CUT_UI && f < 92) {
        const cp = project(c, G.label), R = 0.5 * Z_TEXT.edit * 120 + 2600 * Math.pow(smoother((f - CUT_UI) / 30), 1.5);
        mask = `radial-gradient(circle at ${cp.x.toFixed(1)}px ${cp.y.toFixed(1)}px, #000 ${R.toFixed(1)}px, transparent ${(R + 260).toFixed(1)}px)`;
      } else if (fi >= 230 && fi < ASK_IN) {
        const cp = project(c, G.ask), R = 2600 * Math.pow(1 - smoother((f - 230) / 15), 1.5) + 0.6 * c.Z * 60;
        mask = `radial-gradient(circle at ${cp.x.toFixed(1)}px ${cp.y.toFixed(1)}px, #000 ${R.toFixed(1)}px, transparent ${(R + 240).toFixed(1)}px)`;
      } else if (fi >= ASK_OUT && f < 302) {
        const cp = project(c, G.ask), R = 0.6 * c.Z * 60 + 2600 * Math.pow(smoother((f - ASK_OUT) / 26), 1.5);
        mask = `radial-gradient(circle at ${cp.x.toFixed(1)}px ${cp.y.toFixed(1)}px, #000 ${R.toFixed(1)}px, transparent ${(R + 260).toFixed(1)}px)`;
      }
      reveal.style.webkitMaskImage = reveal.style.maskImage = mask;
      ui.ko.style.display = fi < CUT_TEXT ? "block" : "none";
      ui.sol.style.display = fi >= CUT_TEXT ? "block" : "none";
      ui.toast.style.display = fi < CUT_TEXT ? "block" : "none";
      if (fi < CUT_TEXT) {
        const tw = 66 + Math.max(ui.tTxt.scrollWidth, 236) + 56;
        ui.toast.style.opacity = 1; ui.toast.style.width = tw + "px";
        ui.toast.style.transform = `translate(${(-tw / 2).toFixed(2)}px, 84px)`;
      }
      ui.usdv.textContent = fi < CUT_TEXT ? "$975.00" : "$0.00";
      if (!solW) solW = ui.solbal.firstElementChild.offsetWidth;
      ui.solbal.style.width = solW + "px";
      // the gear spins as the camera dives into it
      ui.gear.style.transformOrigin = "50% 50%";
      ui.gear.style.transform = fi < CUT_TEXT ? `rotate(${(160 * Math.pow(clamp(f / CUT_TEXT, 0, 1), 2)).toFixed(2)}deg)` : `rotate(${(70 * bump(f, TAP.gear - 1, 14)).toFixed(2)}deg)`;

      // ---------------- headline "Edit layout": grows, "layout" joins; at the hand-off it is the menu label
      if (fi >= CUT_TEXT && f < 94) {
        const h = headline(Math.min(f, CUT_UI), fi);
        const key = h.words.join(" ");
        if (key !== lastKey) { lastKey = key; line.innerHTML = h.words.map((w) => `<span>${w}</span>`).join(" "); }
        line.style.display = "block";
        line.style.fontSize = h.size + "px";
        let dx = 0;
        if (h.join) dx = 0.3 * ((widthOf(key, h.size) - widthOf(h.join.prev, h.size)) / 2) * Math.exp(-(f - h.join.at) / 1.5);
        const out = smoother((f - CUT_UI) / 6);
        // after the hand-off the headline rides the label as the camera pulls back, then dissolves into it
        let sc = 1, tx = 0, ty = 0;
        if (fi >= CUT_UI) {
          const lp = project(c, G.label), z = c.Z / Z_TEXT.edit;
          sc = z; tx = lp.x - 960; ty = lp.y - 540;
        }
        const k = smoother((f - CUT_UI + 8) / 8); // into the label's weight and spacing just before the hand-off
        line.style.fontWeight = Math.round(lerp(620, 400, k));
        line.style.letterSpacing = lerp(-0.025, 0, k).toFixed(4) + "em";
        line.style.color = mix(INK, "#2a2a2a", k);
        // the headline itself rides onto the menu item and only hands over to the real label once it is small
        line.style.opacity = (1 - smoother((f - 88) / 5)).toFixed(3);
        line.style.transformOrigin = "50% 50%";
        line.style.transform = `translate(calc(-50% + ${(dx + tx).toFixed(2)}px), calc(-50% + ${(ty - 0.04 * h.size * (1 - k)).toFixed(2)}px)) scale(${sc.toFixed(4)})`;
      } else line.style.display = "none";

      // ---------------- headline "Ask AI": the pill's label, blown up; it breathes, then shrinks back into the pill
      if (fi >= 238 && fi < 306) {
        askline.style.display = "block";
        const lp = project(c, G.ask), z = c.Z / Z_TEXT.ask;
        const inn = smoother((f - 238) / 8), out = smoother((f - 298) / 5);
        askline.style.opacity = (inn * (1 - out)).toFixed(3);
        askline.style.transform = `translate(calc(-50% + ${(lp.x - 960).toFixed(2)}px), calc(-50% + ${(lp.y - 540).toFixed(2)}px)) scale(${z.toFixed(4)})`;
        askline.style.letterSpacing = lerp(0, -0.02, smoother((f - 240) / 10) * (1 - smoother((f - ASK_OUT + 4) / 8))).toFixed(4) + "em";
        // letters settle from the pill's light weight into the headline weight and back
        askline.style.fontWeight = Math.round(lerp(400, 620, smoother((f - 240) / 10) * (1 - smoother((f - ASK_OUT + 4) / 8))));
        askline.style.color = mix("#444444", INK, smoother((f - 240) / 8) * (1 - smoother((f - ASK_OUT + 4) / 8)));
      } else askline.style.display = "none";
      // the pill's own label hides while the headline stands in for it (it rides back in and hands over when small)
      ui.askfloat.style.color = fi >= 236 && fi < 304 ? `rgba(68,68,68,${(1 - smoother((f - 236) / 4) + smoother((f - 297) / 5)).toFixed(3)})` : "#444";
      ui.askfloat.style.opacity = 1;

      // ---------------- the settings menu: open around the hand-off, closes on Edit layout; reopens for Done editing
      const m0 = fi >= CUT_UI ? 1 - smoother((f - TAP.edit - 1) / 6) : 0;
      ui.gm0.style.display = m0 > 0.002 ? "block" : "none";
      ui.gm0.style.opacity = m0.toFixed(3);
      ui.gm0.style.transform = `scale(${(0.96 + 0.04 * m0).toFixed(4)})`;
      ui.mEditLabel.style.opacity = fi >= CUT_UI ? smoother((f - 87) / 5).toFixed(3) : 1;
      ui.miEdit.style.background = mix("#fdfcfa", "#eeede9", smoother((f - 97) / 4));
      const m1 = smoother((f - TAP.gear - 1) / 6) * (1 - smoother((f - TAP.done - 1) / 6));
      ui.gm1.style.display = m1 > 0.002 ? "block" : "none";
      ui.gm1.style.opacity = m1.toFixed(3);
      ui.gm1.style.transform = `scale(${(0.96 + 0.04 * m1).toFixed(4)}) translateY(${(-6 * (1 - m1)).toFixed(2)}px)`;
      ui.gearbg.style.opacity = Math.max(m0, m1).toFixed(3);

      // ---------------- the layout editor: grips + eyes, the hint, the drop zone; the chart is dragged below activity
      const ed = EDIT_ON(f);
      ui.handles.forEach((el, i) => {
        const p = smoother((f - 108 - i * 0.8) / 10) * (1 - smoother((f - 197 - i * 0.4) / 10));
        el.style.opacity = p.toFixed(3);
        el.style.transform = `translateY(${(-6 * (1 - p)).toFixed(2)}px) scale(${(0.85 + 0.15 * p).toFixed(4)})`;
      });
      ui.hint.style.opacity = ed.toFixed(3);
      ui.hint.style.transform = `translateX(${(-12 * (1 - ed)).toFixed(2)}px)`;
      ui.drop.style.opacity = ed.toFixed(3);
      ui.drop.style.transform = `translateY(${(40 * (1 - ed)).toFixed(2)}px)`;
      ui.panels.forEach((p) => { p.style.boxShadow = `0 0 0 ${lerp(1, 1.5, ed).toFixed(2)}px ${mix("#ebe9e4", "#d6d4ce", ed)}`; });
      // drag: the chart lifts and follows the cursor down; the activity panel slides up into its place
      const dy = dragY(f), lift = smoother((f - DRAG.from) / 4) * (1 - smoother((f - DRAG.to) / 6));
      ui.gChart.style.transform = `translateY(${dy.toFixed(2)}px) scale(${(1 + 0.012 * lift).toFixed(4)})`;
      ui.gChart.style.filter = lift > 0.01 ? `drop-shadow(0 ${(24 * lift).toFixed(1)}px ${(40 * lift).toFixed(1)}px rgba(40,30,10,${(0.16 * lift).toFixed(3)}))` : "none";
      ui.gChart.style.zIndex = lift > 0.01 ? 2 : 1;
      ui.gAct.style.transform = `translateY(${(-306 * smoother((f - DRAG.from - 10) / 14)).toFixed(2)}px)`;
      // a soft mint wash on the slot the chart is dropped into
      ui.drop.style.background = "#f1f0ec";

      // ---------------- page cascade after the hand-off (the area around the menu is there; the rest settles)
      ui.solItems.forEach((el, i) => {
        const p = fi >= CUT_UI ? outCubic((f - CUT_UI - 4 - i * 1.4) / 16) : 1;
        el.style.opacity = p.toFixed(4);
      });
      ui.solCnd.style.clipPath = `inset(0 ${(100 * (1 - outCubic((f - CUT_UI - 6) / 26))).toFixed(2)}% 0 0)`;

      // ---------------- Ask AI: the pill slides aside as the side panel slides in; Analyze; the reply
      const pin = smoother((f - TAP.ask - 2) / 18);
      ui.ap.style.display = f >= TAP.ask + 2 ? "block" : "none";
      ui.ap.style.transform = `translateX(${(640 * (1 - pin)).toFixed(2)}px)`;
      ui.askfloat.style.left = lerp(1800, 1291, pin).toFixed(2) + "px";
      ui.askfloat.style.top = lerp(826, 822, pin).toFixed(2) + "px";
      ui.askfloat.style.transform = `scale(${(1 - 0.06 * bump(f, TAP.ask - 1, 8)).toFixed(4)})`;
      if (f >= TAP.ask + 2) {
        const gone = smoother((f - TAP.analyze - 1) / 10);
        ui.apItems.forEach((el, j) => {
          const p = smoother((f - TAP.ask - 10 - j * 2.2) / 14);
          const press = el === ui.apSug[0] ? bump(f, TAP.analyze - 1, 9) : 0;
          el.style.opacity = (p * (1 - gone)).toFixed(4);
          el.style.transform = `translateY(${(16 * (1 - p) - 14 * gone).toFixed(2)}px) scale(${(1 - 0.02 * press).toFixed(4)})`;
          if (el === ui.apSug[0]) el.style.background = mix("#ffffff", "#e3f0e8", press);
        });
        const ii = smoother((f - TAP.ask - 14) / 14);
        ui.apInput.style.opacity = ii.toFixed(3);
        ui.apInput.style.transform = `translateY(${(14 * (1 - ii)).toFixed(2)}px)`;
        // the chip's words fly up into the message bubble
        const fl = smoother((f - TAP.analyze) / 18);
        ui.apBubble.style.opacity = smoother((f - TAP.analyze) / 4).toFixed(3);
        ui.apBubble.style.transform = `translate(${(-170 * (1 - fl)).toFixed(2)}px, ${(232 * (1 - fl)).toFixed(2)}px) scale(${(0.96 + 0.04 * fl).toFixed(4)})`;
        ui.apTyping.style.opacity = (smoother((f - 372) / 4) * (1 - smoother((f - 384) / 4))).toFixed(3);
        ui.apDots.forEach((d, i) => {
          const ph = Math.sin(((f - i * 3) / 9) * Math.PI * 2) * 0.5 + 0.5;
          d.style.opacity = (0.35 + 0.65 * ph).toFixed(3);
          d.style.transform = `translateY(${(-3 * ph).toFixed(2)}px)`;
        });
        ui.apWords.forEach((w, i) => {
          const p = outCubic((f - 386 - i * 0.9) / 5);
          w.style.opacity = p.toFixed(3);
          w.style.transform = `translateY(${(7 * (1 - p)).toFixed(2)}px)`;
        });
        const cp = smoother((f - 420) / 16);
        ui.apCard.style.opacity = cp.toFixed(3);
        const sw = 100 * outCubic((f - 423) / 16), fade = 1 - smoother((f - 438) / 18), tc = `rgba(248,227,225,${fade.toFixed(3)})`;
        ui.apCard.style.background = `linear-gradient(90deg, ${tc} 0%, ${tc} ${sw.toFixed(1)}%, rgba(255,255,255,0) ${(sw + 16).toFixed(1)}%), #ffffff`;
        ui.apCard.style.transform = `translateY(${(18 * (1 - cp)).toFixed(2)}px)`;
        ui.apSpark.style.strokeDasharray = "1"; ui.apSpark.style.strokeDashoffset = (1 - outCubic((f - 426) / 20)).toFixed(4);
      }

      // ---------------- cursor: a soft mint dot; each click blooms and rings
      const co = cursorOpacity(f, fi);
      if (co > 0.002) {
        const head = project(c, CUR(f)), pr = pressed(f);
        dot.setAttribute("cx", head.x.toFixed(2)); dot.setAttribute("cy", head.y.toFixed(2));
        dot.setAttribute("r", (15 * (1 - 0.22 * pr)).toFixed(2));
        dot.style.opacity = (0.92 * co).toFixed(3);
      } else dot.setAttribute("r", 0);
      ring.setAttribute("r", 0);
      let hr = 0, hop = 0, hp = null;
      for (const k in TAP) {
        const d = f - TAP[k];
        if (d < -1 || d > 24) continue;
        if (cursorOpacity(TAP[k], TAP[k]) < 0.5) continue;
        const rp = project(c, CUR(TAP[k]));
        if (d >= 0 && d <= 16) {
          ring.setAttribute("cx", rp.x.toFixed(2)); ring.setAttribute("cy", rp.y.toFixed(2));
          ring.setAttribute("r", (16 + 46 * outCubic(d / 14)).toFixed(2));
          ring.style.opacity = (0.9 * (1 - smoother(d / 15))).toFixed(3);
        }
        hp = rp;
        hr = (18 + 58 * (1 - Math.exp(-Math.max(0, d) / 3.2))) * Math.sqrt(c.Z);
        hop = 0.42 * smoother((d + 1) / 2.5) * (1 - smoother(d / 20));
      }
      if (hp) { halo.setAttribute("cx", hp.x); halo.setAttribute("cy", hp.y); }
      halo.setAttribute("r", hr.toFixed(2));
      halo.style.opacity = hop.toFixed(3);
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    const SLOW = window.__TIMESCALE || 1; // the motion-blur render plays the clip at half speed (see scripts/render-mb.sh)
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: (FRAMES * SLOW) / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, (FRAMES * SLOW) / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { solW = 0; measure(); render(R._f); });
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };
  window.SCENE = SCENE;
})();
