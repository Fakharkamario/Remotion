// "just ask" — picks up on the last frame of one-terminal (Explore, Pre-IPO selected) and runs in the same type and
// motion language. 30 fps, 500 frames. Every element is a pure function of a continuous frame number so the 240 fps
// motion-blur render can sample between frames; discrete state (typed characters, words) uses whole frames.
//
//   0–37    the camera pushes into the Pre-IPO button while a feathered mask dissolves the screen around it; the
//           button eases down and fades as "just" rises in letter by letter
//   44–74   "ask" joins and the line re-centres; a dark pill grows behind "ask" as it turns white
//   66–118  the letters lift away and the pill rounds into the circle that becomes the "M" avatar on Home while the
//           camera pulls back and a feathered circle reveals Home; the balance counts up to $1,350.00
//   118–200 the camera eases out to frame the screen; the cursor taps AI and the AI screen crossfades in
//   200–262 tap the input: the keyboard slides up and the prompt types itself with key presses; tap send
//   262–330 the message flies up into a bubble, a typing indicator, a streamed reply and three low-risk asset cards
//   342–392 the cursor taps Coca-Cola: the trade panel rises in; it taps 3, 7, 5 and the amount builds
//   394–444 "Slide to buy": the camera pushes in gently on the slider and the cursor drags the knob across
//   444–515 the camera eases back to the whole phone: a live-activity pill drops in, "Buying 4.00 KO", then "Bought"
(function () {
  const FPS = 30;
  const FRAMES = 516;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));
  const expoOut = (t) => (t = clamp(t, 0, 1), t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10)));
  const expoIn = (t) => (t = clamp(t, 0, 1), t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)));
  // critically damped spring (no overshoot), settles by t = 1
  const spring = (t) => (t = clamp(t, 0, 1), 1 - (1 + 7 * t) * Math.exp(-7 * t)) / (1 - 8 * Math.exp(-7));
  const outBack = (t, s = 1.25) => (t = clamp(t, 0, 1), 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
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
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  const money = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ------------------------------------------------------------------ phone geometry (same as one-terminal)
  const K = 700 / APP.W;
  const world = (x, y) => ({ x: 585 + 25 + x * K, y: 64 + 25 + y * K });
  const BTN_D = 56 * K; // Explore category button
  const AV_D = 36 * K; // Home avatar
  const P1 = world(UI.CAT_X[6] + UI.ROW_SCROLL, UI.CAT_Y); // Pre-IPO button where one-terminal leaves it
  const AV = world(396, 91); // the "M" avatar

  // one-terminal's last frame: screen = (960, 506) + Z_END * (world - (960, 520))
  const Z_END = 1 + 0.075 * smoother(121 / 122);
  const C0 = { x: 960 + Z_END * (P1.x - 960), y: 506 + Z_END * (P1.y - 520) };

  // ---- transition 1: one path (centre + diameter) for the Pre-IPO button, driving the push-in and then the pill
  const D1 = spline([[0, BTN_D * Z_END], [3.7, BTN_D * Z_END + 0.8], [10, 104], [17, 128], [24, 146], [33, 158]]);
  const X1 = spline([[0.0, C0.x], [3.7, C0.x - 1.5], [9.8, C0.x - 30], [15.9, 1160], [22.0, 1094], [26.9, 1062], [33.0, 1048]]);
  const Y1 = spline([[0.0, C0.y], [3.7, C0.y + 1], [9.8, C0.y + 24], [15.9, 412], [22.0, 474], [26.9, 512], [33.0, 536]]);

  // ---- transition 2: pill -> circle -> the M avatar, driving the pull-back onto Home
  const D2 = spline([[75, 138], [84, 128], [94, 110], [104, 90], [113, 74], [121, 64.5], [130, AV_D]]);
  const X2 = spline([[75.0, 1088], [81.4, 1092], [87.8, 1103], [94.2, 1120], [99.3, 1148], [104.4, 1183], [109.5, 1214], [114.7, 1235], [119.8, 1247], [124.9, 1252.6], [130.0, AV.x]]);
  const Y2 = spline([[75.0, 545], [81.4, 538], [87.8, 522], [94.2, 500], [99.3, 460], [104.4, 410], [109.5, 354], [114.7, 301], [119.8, 262], [124.9, 234], [130.0, AV.y - 20]]);

  // ---- camera after the reveal: ONE continuous path. Keyframes [frame, world focus y, zoom] are joined linearly,
  // then Gaussian-smoothed (sigma 7 frames), so velocity and acceleration are continuous everywhere: moves can't
  // start or stop abruptly and the peak speed stays low. Framing keeps whole screens in view (zoom ~0.8–0.95) so
  // the camera travels less; the only close-up is a gentle push-in on "Slide to buy".
  const CAMK = [
    [100, 560, 1.0], [140, 600, 1.0], [178, 980, 0.9], [206, 990, 0.9], [230, 1040, 0.885], [258, 1046, 0.885],
    [298, 700, 0.95], [342, 712, 0.95], [372, 860, 0.885], [394, 872, 0.89], [422, 1300, 1.42], [444, 1312, 1.46],
    [482, 715, 0.8], [520, 700, 0.83],
  ];
  const CAM = (() => {
    const STEP = 0.1, F0 = 60, F1 = 540, n = Math.round((F1 - F0) / STEP) + 1;
    const raw = (f, k) => {
      if (f <= CAMK[0][0]) return CAMK[0][k];
      for (let i = 1; i < CAMK.length; i++) if (f <= CAMK[i][0]) {
        const t = (f - CAMK[i - 1][0]) / (CAMK[i][0] - CAMK[i - 1][0]);
        return lerp(CAMK[i - 1][k], CAMK[i][k], t);
      }
      return CAMK[CAMK.length - 1][k];
    };
    const sig = 7, R = Math.round((3 * sig) / STEP), w = [];
    for (let j = -R; j <= R; j++) w.push(Math.exp(-0.5 * Math.pow((j * STEP) / sig, 2)));
    const ws = w.reduce((x, y) => x + y, 0);
    const Y = new Float64Array(n), Zl = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let y = 0, z = 0;
      for (let j = -R; j <= R; j++) {
        const f = F0 + (i + j) * STEP;
        y += w[j + R] * raw(f, 1); z += w[j + R] * Math.log(raw(f, 2)); // zoom smoothed in log space
      }
      Y[i] = y / ws; Zl[i] = z / ws;
    }
    return (f) => {
      const x = clamp((f - F0) / STEP, 0, n - 1.001), i = Math.floor(x), t = x - i;
      return { y: lerp(Y[i], Y[i + 1], t), z: Math.exp(lerp(Zl[i], Zl[i + 1], t)) };
    };
  })();

  // camera as screen = O + Z * world
  function camera(f) {
    const fromPath = (Z, W, C) => ({ Z, O: { x: C.x - Z * W.x, y: C.y - Z * W.y } });
    if (f <= 28) return fromPath(D1(f) / BTN_D, P1, { x: X1(f), y: Y1(f) });
    const t2 = fromPath(D2(f) / AV_D, AV, { x: X2(f), y: Y2(f) });
    const sh = CAM(f);
    const shot = fromPath(sh.z, { x: 960, y: sh.y }, { x: 960, y: 540 });
    const b = smoother((f - 118) / 16);
    return { Z: lerp(t2.Z, shot.Z, b), O: { x: lerp(t2.O.x, shot.O.x, b), y: lerp(t2.O.y, shot.O.y, b) } };
  }
  const project = (c, p) => ({ x: c.O.x + c.Z * p.x, y: c.O.y + c.Z * p.y });

  // ------------------------------------------------------------------ interaction script
  const TAP = { ai: 176, input: 208, send: 262, card: 342, k3: 372, k7: 381, k5: 390 };
  const KEYXY = { k3: [344.4, 506], k7: [84.3, 633.8], k5: [214.6, 569.9] };
  const TYPE0 = 226; // first typed character (32 characters, one a frame)
  const SLIDE = { from: 422, to: 442, x0: 46, travel: 389.6 - 51.8 }; // knob centre starts at 20 + 25.9 pt
  const slideE = (f) => smoother((f - SLIDE.from) / (SLIDE.to - SLIDE.from));
  const CUR = (() => {
    const keys = [
      [156, 560, 1010], [160, 486, 936], [165, 380, 868], [170, 302, 818], [174.5, 269, 797], [182, 269, 797],
      [190, 246, 775], [198, 214, 752], [202.5, 196, 739], [210, 196, 739],
      [216, 248, 650], [222, 296, 566], [228, 318, 524], [254, 328, 528], [258, 372, 586], [261.5, 395, 609], [267, 395, 609],
      [276, 452, 540], [322, 470, 600], [327, 420, 540], [333, 340, 484], [338, 276, 456], [341.5, 252, 451], [348, 252, 451],
      [356, 296, 470], [364, 334, 494], [371, ...KEYXY.k3], [374, ...KEYXY.k3],
      [377.5, 210, 600], [380.5, ...KEYXY.k7], [383, ...KEYXY.k7],
      [386.5, 150, 618], [389.5, ...KEYXY.k5], [392, ...KEYXY.k5],
      [399, 128, 690], [409, 72, 770], [420.5, SLIDE.x0, 793.4], [422, SLIDE.x0, 793.4],
      [442, SLIDE.x0 + SLIDE.travel, 793.4], // the drag itself rides the knob (below)
      [452, 352, 740], [466, 440, 640],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => (f >= SLIDE.from && f <= SLIDE.to ? { x: SLIDE.x0 + SLIDE.travel * slideE(f), y: 793.4 } : { x: sx(f), y: sy(f) });
  })();
  const cursorOpacity = (f) =>
    smoother((f - 156) / 4) * (1 - smoother((f - 264) / 10)) + smoother((f - 322) / 5) * (1 - smoother((f - 446) / 12));
  const pressed = (f) => {
    let p = 0;
    for (const k in TAP) p = Math.max(p, smoother((f - TAP[k] + 1.5) / 1.5) * (1 - smoother((f - TAP[k] - 2) / 4)));
    p = Math.max(p, smoother((f - SLIDE.from + 1.5) / 1.5) * (1 - smoother((f - SLIDE.to) / 3)));
    return p;
  };
  // keyboard sheet offset in pt (0 = up): rises after the input tap, drops after send
  const kbOff = (f) => 300 * (1 - smoother((f - 209) / 17)) + 300 * smoother((f - 263) / 17);

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE._probe = { camera, world, project }; // for offline speed checks
  SCENE.mount = function (stage) {
    stage.innerHTML = `<div id="reveal"><div id="cam"><div id="phoneWrap"></div></div></div>
      <div id="words"><div id="pill"><div id="pillM">M</div></div><div id="just">just</div><div id="ask">ask</div></div>
      <svg id="cursor" width="1920" height="1080" viewBox="0 0 1920 1080">
        <circle id="halo" r="0" fill="#7ee2a8"/><circle id="ring" r="0" fill="#7ee2a8"/>
        <path id="trail" fill="none" stroke="#3d9ef2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg><span id="meas"></span>`;
    const $ = (s) => stage.querySelector(s);
    const camEl = $("#cam"), reveal = $("#reveal"), phoneWrap = $("#phoneWrap");
    const app = APP.build(phoneWrap);
    const ex = UI.build(app.explore);
    const pill = $("#pill"), pillM = $("#pillM"), justEl = $("#just"), askEl = $("#ask"), meas = $("#meas");
    const trail = $("#trail"), ring = $("#ring"), halo = $("#halo");
    const widthOf = (t, size) => { meas.textContent = t; meas.style.fontSize = size + "px"; meas.style.fontWeight = "620"; meas.style.letterSpacing = "-0.025em"; return meas.getBoundingClientRect().width; };
    justEl.innerHTML = [..."just"].map((c) => `<span>${c}</span>`).join("");
    askEl.innerHTML = [..."ask"].map((c) => `<span>${c}</span>`).join("");
    app.ai.querySelector(".status").style.display = "none"; // Home's status bar stays up through the switch

    // ---- the Explore screen exactly as one-terminal leaves it (row scrolled, Pre-IPO selected)
    ex.row.style.transform = `translateX(${UI.ROW_SCROLL}px)`;
    const PX = UI.CAT_X[6];
    ex.puck.style.transform = `translate(${PX - 28}px, 0px)`;
    UI.CAT_X.forEach((x, i) => {
      const near = smoother(1 - Math.abs(PX - x) / 44);
      ex.glyphs[i].style.color = mix("#5f5f5d", "#ffffff", near);
      ex.labels[i].style.color = mix("#6e6e6c", "#262626", i === 6 ? 1 : 0);
    });
    for (const k in ex.blocks) ex.blocks[k].el.style.visibility = k === "preipo" ? "visible" : "hidden";
    const rocket = ex.glyphs[6].firstElementChild;

    // bubble geometry for the fly-up (measured once fonts are ready)
    let bubbleW = 0;

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);
      const c = camera(f);

      // ---------------- phone visibility + reveal masks
      const phoneOn = f < 27 || f >= 90;
      reveal.style.display = phoneOn ? "block" : "none";
      camEl.style.transform = `translate(${c.O.x.toFixed(3)}px, ${c.O.y.toFixed(3)}px) scale(${c.Z.toFixed(5)})`;
      let mask = "none";
      if (f < 27) {
        // dissolve the Explore screen around the Pre-IPO button as the camera pushes in
        const cp = project(c, P1);
        const R = D1(f) / 2 + 2300 * Math.pow(1 - smoother(f / 26), 1.5);
        const F = 0.5 + 260 * (1 - smoother((f - 4) / 22));
        mask = `radial-gradient(circle at ${cp.x.toFixed(2)}px ${cp.y.toFixed(2)}px, #000 ${R.toFixed(2)}px, transparent ${(R + F).toFixed(2)}px)`;
      } else if (f >= 90 && f < 132) {
        // reveal Home from the M avatar as the camera pulls back
        const cp = project(c, AV);
        const R = (AV_D * c.Z) / 2 + 2300 * Math.pow(smoother((f - 90) / 38), 1.5);
        const F = 0.5 + 260 * smoother((f - 90) / 20);
        mask = `radial-gradient(circle at ${cp.x.toFixed(2)}px ${cp.y.toFixed(2)}px, #000 ${R.toFixed(2)}px, transparent ${(R + F).toFixed(2)}px)`;
      }
      reveal.style.webkitMaskImage = reveal.style.maskImage = mask;
      app.explore.style.display = f < 27 ? "block" : "none";
      rocket.style.opacity = 1 - smoother((f - 12) / 12);
      const homeOn = f >= 89;
      app.home.style.display = homeOn ? "block" : "none";
      app.ai.style.display = f >= 176 ? "block" : "none";
      phoneWrap.querySelector(".tabbar").style.display = homeOn ? "flex" : "none";

      // ---------------- words. The Pre-IPO circle eases down and fades as "just" rises in letter by letter (each
      // letter lifts and un-blurs on a soft stagger); "ask" joins the same way while the line re-centres smoothly;
      // a dark pill grows behind "ask" as it turns white; then the letters lift away and the pill rounds into the
      // circle that becomes the M avatar. Everything eases in and out, and the line keeps a slow scale drift.
      const words = $("#words");
      if (f >= 25 && f < 92) {
        words.style.display = "block";
        // the collapsing circle (overlaps the first letters, so there is never an empty frame)
        if (f < 40) {
          const k = 1 - smoother((f - 25) / 10), d = D1(Math.min(f, 33)) * (0.3 + 0.7 * k);
          pill.style.display = "block";
          pill.style.opacity = smoother(k * 1.3).toFixed(4);
          pill.style.width = pill.style.height = d + "px";
          pill.style.borderRadius = d / 2 + "px";
          pill.style.transform = `translate(${(X1(Math.min(f, 33)) - d / 2).toFixed(2)}px, ${(Y1(Math.min(f, 33)) - d / 2).toFixed(2)}px) scale(1)`;
          pillM.style.opacity = 0;
        }
        const size = 148 * (1.0 + 0.05 * smoother((f - 26) / 66)); // a slow, continuous push
        const wJ = widthOf("just", size), wJs = widthOf("just ", size), wL = widthOf("just ask", size), wA = widthOf("ask", size);
        const join = smoother((f - 44) / 16); // the line widens from "just" to "just ask"
        const left = 960 - lerp(wJ, wL, join) / 2, boxTop = 540 - 0.54 * size;
        justEl.style.fontSize = askEl.style.fontSize = size + "px";
        justEl.style.opacity = askEl.style.opacity = 1;
        const step = 0.1 * size * smoother((f - 56) / 11); // "just" steps aside as the pill grows
        justEl.style.transform = `translate(${(left - step).toFixed(2)}px, ${boxTop.toFixed(2)}px)`;
        askEl.style.transform = `translate(${(left + wJs).toFixed(2)}px, ${boxTop.toFixed(2)}px)`;
        const letter = (el, i, t0, t1) => {
          const pin = smoother((f - t0 - i * 1.7) / 13), pout = smoother((f - t1 - i * 1.1) / 10);
          el.style.opacity = (pin * (1 - pout)).toFixed(4);
          const bl = 7 * (1 - pin) + 6 * pout;
          el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
          el.style.transform = `translateY(${(0.32 * size * (1 - pin) - 0.22 * size * pout).toFixed(2)}px)`;
        };
        [...justEl.children].forEach((el, i) => letter(el, i, 31, 66));
        const tw = smoother((f - 58) / 9); // "ask" turns white as the pill grows behind it
        [...askEl.children].forEach((el, i) => { letter(el, i, 45, 71); el.style.color = mix("#1c1d21", "#f9f8f4", tw); });
        if (f >= 40) {
          const acx = left + wJs + wA / 2, acy = boxTop + 0.54 * size;
          const g = smoother((f - 56) / 11); // pill grows
          const m = smoother((f - 74) / 16); // and rounds off toward the avatar
          const w0 = (wA + 0.5 * size) * (0.55 + 0.45 * g), h0 = 1.16 * size * (0.55 + 0.45 * g);
          const w = lerp(w0, D2(f), m), h = lerp(h0, D2(f), m);
          const cx = lerp(acx, X2(f), m), cy = lerp(acy, Y2(f), m);
          pill.style.display = g > 0 ? "block" : "none";
          pill.style.opacity = g.toFixed(4);
          pill.style.width = w + "px"; pill.style.height = h + "px";
          pill.style.borderRadius = Math.min(w, h) / 2 + "px";
          pill.style.transform = `translate(${(cx - w / 2).toFixed(2)}px, ${(cy - h / 2).toFixed(2)}px) scale(1)`;
          pillM.style.fontSize = (h * 14.5) / 36 + "px";
          pillM.style.opacity = smoother((f - 84) / 8);
        }
      } else words.style.display = "none";

      // ---------------- Home: cascade in, balance counts up, sparklines draw; slides out on the AI tap
      if (homeOn) {
        app.homeItems.forEach((el, i) => {
          if (el === app.avatarM) return;
          const s0 = 95 + i * 1.25;
          const p = outCubic((f - s0) / 14);
          const o = smoother((f - TAP.ai - i * 0.2) / 8);
          el.style.opacity = (p * (1 - o)).toFixed(4);
          el.style.transform = `translate(${(-18 * o).toFixed(2)}px, ${(14 * (1 - p)).toFixed(2)}px)`;
        });
        const ao = smoother((f - TAP.ai) / 8);
        app.avatarM.style.opacity = (1 - ao).toFixed(4);
        app.avatarM.style.transform = `translateX(${(-18 * ao).toFixed(2)}px)`;
        app.bal.textContent = money(APP.BALANCE * outCubic((f - 104) / 26));
        app.sparks.forEach((p, i) => { p.style.strokeDasharray = "1"; p.style.strokeDashoffset = (1 - outCubic((f - 104 - i * 1.4) / 16)).toFixed(4); });
        const tb = outCubic((f - 108) / 14);
        const tabbar = phoneWrap.querySelector(".tabbar");
        tabbar.style.opacity = tb.toFixed(4);
        tabbar.style.transform = `translateY(${(12 * (1 - tb)).toFixed(2)}px)`;
        const sw = smoother((f - TAP.ai) / 6);
        app.tabs.forEach((el) => {
          const k = el.dataset.k;
          const on = k === "home" ? 1 - sw : k === "ai" ? sw : 0;
          el.style.color = mix("#6b6b69", "#1f1f1f", on);
          el.style.transform = `scale(${(1 - 0.08 * (k === "ai" ? Math.sin(Math.PI * clamp((f - TAP.ai + 1) / 9, 0, 1)) : 0)).toFixed(4)})`;
        });
      }

      // ---------------- AI screen
      app.kbd.style.display = "none";
      if (f >= 176) {
        const out = smoother((f - TAP.send) / 11); // title + suggestions drift away after send
        app.aiItems.forEach((el, j) => {
          const p = smoother((f - 180 - j * 1.8) / 15);
          el.style.opacity = (p * (1 - out)).toFixed(4);
          el.style.transform = `translateY(${(16 * (1 - p) - 14 * out).toFixed(2)}px)`;
        });
        phoneWrap.querySelector(".a-edit").style.opacity = outCubic((f - 181) / 12).toFixed(4);
        // dock: fades in, rides the keyboard
        const dIn = smoother((f - 183) / 15);
        const ko = kbOff(f);
        app.dock.style.opacity = dIn.toFixed(4);
        app.dock.style.transform = `translateY(${(10 * (1 - dIn) - 129 * (1 - ko / 300)).toFixed(2)}px)`;
        app.kbd.style.transform = `translateY(${ko.toFixed(2)}px)`;
        app.kbd.style.display = ko < 299.5 ? "block" : "none";
        // typing
        const n = f >= TAP.send + 1 ? 0 : clamp(fi - TYPE0 + 1, 0, APP.PROMPT.length);
        app.typed.textContent = APP.PROMPT.slice(0, n);
        app.ph.style.display = n > 0 ? "none" : "inline";
        const focused = f >= TAP.input && f < TAP.send + 1;
        app.caret.style.opacity = focused ? (n > 0 && n < APP.PROMPT.length ? 1 : Math.floor(fi / 8) % 2 ? 0 : 1) : 0;
        app.caret.style.order = n === 0 ? -1 : 0;
        const live = smoother((f - TYPE0) / 3) * (1 - smoother((f - TAP.send - 1) / 3));
        app.send.style.background = mix("#b9b8b5", "#262626", live);
        app.send.style.transform = `scale(${(1 - 0.12 * Math.sin(Math.PI * clamp((f - TAP.send + 1) / 8, 0, 1))).toFixed(4)})`;
        // the sent message flies from the input up into a bubble
        if (!bubbleW) bubbleW = app.bubble.offsetWidth; // layout width in pt (unaffected by transforms)
        const fl = smoother((f - TAP.send - 1) / 20);
        const startX = 30 - 16 - (412 - bubbleW), startY = 585 + 24 - 18.85 - 107;
        app.bubble.style.opacity = smoother((f - TAP.send) / 4).toFixed(4);
        app.bubble.style.background = mix("#fbfaf7", "#efefef", smoother((f - TAP.send - 2) / 8));
        app.bubble.style.transform = `translate(${(startX * (1 - fl)).toFixed(2)}px, ${(startY * (1 - fl)).toFixed(2)}px) scale(${(0.97 + 0.03 * fl).toFixed(4)})`;
        // typing indicator, streamed reply, plan cards
        const ti = smoother((f - 276) / 4) * (1 - smoother((f - 287) / 4));
        app.typing.style.opacity = ti.toFixed(3);
        app.dots.forEach((d, i) => {
          const ph = Math.sin(((f - i * 3) / 9) * Math.PI * 2) * 0.5 + 0.5;
          d.style.opacity = (0.35 + 0.65 * ph).toFixed(3);
          d.style.transform = `translateY(${(-2.2 * ph).toFixed(2)}px)`;
        });
        app.words.forEach((w, i) => {
          const p = outCubic((f - 290 - i * 0.9) / 5);
          w.style.opacity = p.toFixed(3);
          w.style.transform = `translateY(${(6 * (1 - p)).toFixed(2)}px)`;
        });
        app.cards.forEach((el, j) => {
          const s0 = 303 + j * 3.2;
          const p = smoother((f - s0) / 17);
          const press = j === 2 ? Math.sin(Math.PI * clamp((f - TAP.card + 1) / 10, 0, 1)) : 0;
          el.style.opacity = p.toFixed(4);
          el.style.transform = `translateY(${(18 * (1 - p)).toFixed(2)}px) scale(${((0.97 + 0.03 * p) * (1 - 0.018 * press)).toFixed(4)})`;
          if (j < 3) el.style.background = mix("#f9f8f4", "#efeee9", press);
        });
        app.amts.forEach((a, j) => { a.textContent = money(+a.dataset.v * outCubic((f - 306 - j * 3.2) / 16)); });
        app.fills.forEach((b, j) => { b.style.transform = `scaleX(${outCubic((f - 309 - j * 3.2) / 18).toFixed(4)})`; });
      }

      // ---------------- trade panel: slides up over the chat, amount typed on the keypad, slide to buy
      const tp = f - (TAP.card + 2);
      const up = smoother(tp / 22);
      app.backdrop.style.opacity = (0.8 * smoother(tp / 12) * (1 - smoother((tp - 8) / 14))).toFixed(4);
      app.trade.style.display = tp > -0.5 ? "block" : "none";
      app.trade.style.transform = `translateY(${(150 * (1 - up)).toFixed(2)}px)`;
      app.trade.style.opacity = smoother(tp / 7).toFixed(4);
      app.tItems.forEach((el, j) => {
        if (el.classList.contains("t-key") || el === app.tAmt) return; // keys handled below
        const p = smoother((tp - 5 - j * 0.6) / 15);
        el.style.opacity = p.toFixed(4);
        el.style.transform = `translateY(${(12 * (1 - p)).toFixed(2)}px)`;
      });
      // keypad: digits rise in, then light up as they are tapped
      Object.entries(app.tKeys).forEach(([d, k], j) => {
        const p = smoother((tp - 8 - j * 0.6) / 15);
        k.style.opacity = p.toFixed(4);
        let pr = 0;
        for (const [name, tf] of Object.entries(TAP)) if (name === "k" + d) pr = Math.max(pr, Math.sin(Math.PI * clamp((f - tf + 1) / 11, 0, 1)));
        k.firstElementChild.style.opacity = pr.toFixed(3);
        k.style.transform = `translateY(${(12 * (1 - p)).toFixed(2)}px) scale(${(1 - 0.06 * pr).toFixed(4)})`;
      });
      // the amount: each digit drops in and the number re-centres smoothly instead of jumping
      const typedN = [TAP.k3, TAP.k7, TAP.k5].filter((tf) => fi >= tf).length;
      const str = typedN ? "$" + APP.TRADE.digits.slice(0, typedN) : "$0";
      const keyA = str + "|" + typedN;
      if (app.tAmt._k !== keyA) {
        app.tAmt._k = keyA;
        app.tAmt.innerHTML = [...str].map((ch) => `<span>${ch}</span>`).join("");
        app.tAmt._w = app.tAmt.offsetWidth;
        const prev = typedN > 1 ? "$" + APP.TRADE.digits.slice(0, typedN - 1) : "$0";
        meas.style.fontSize = "52px"; meas.style.letterSpacing = "-0.015em"; meas.style.fontWeight = "400"; meas.textContent = prev;
        app.tAmt._wp = meas.getBoundingClientRect().width; // meas is unscaled, so this is already in pt
      }
      const lastTap = typedN ? [TAP.k3, TAP.k7, TAP.k5][typedN - 1] : 0;
      const rc = typedN ? smoother((f - lastTap) / 10) : 1;
      const w = lerp(app.tAmt._wp || app.tAmt._w, app.tAmt._w, rc);
      const ap = outCubic((tp - 7) / 12);
      app.tAmt.style.color = typedN ? "#262626" : "#6b6b69";
      app.tAmt.style.opacity = ap.toFixed(4);
      app.tAmt.style.transform = `translate(${(215 - w / 2).toFixed(2)}px, ${(12 * (1 - ap)).toFixed(2)}px)`;
      const spans = app.tAmt.children;
      if (typedN && spans.length) {
        const nd = spans[spans.length - 1], q = smoother((f - lastTap) / 9);
        nd.style.opacity = q.toFixed(3);
        nd.style.transform = `translateY(${(18 * (1 - q)).toFixed(2)}px)`;
      }
      // receive line, fee and the button morph once there is an amount
      const amtNow = typedN ? +APP.TRADE.digits.slice(0, typedN) : 0;
      const shown = lerp(typedN > 1 ? +APP.TRADE.digits.slice(0, typedN - 1) : 0, amtNow, rc);
      const has = smoother((f - TAP.k3) / 6);
      app.tRecv.textContent = "Receive ~" + (shown / APP.TRADE.price).toFixed(2) + " ko";
      app.tRecv.style.opacity = (has * outCubic((tp - 6) / 12)).toFixed(4);
      app.tFee.style.opacity = (smoother((f - TAP.k5 - 2) / 6)).toFixed(4);
      const ready = smoother((f - TAP.k5 - 2) / 8);
      // slide to buy
      const se = slideE(f), kx = SLIDE.travel * se;
      app.tFill.style.width = ((51.8 + kx) * ready).toFixed(2) + "px";
      app.tKnob.style.transform = `translateX(${kx.toFixed(2)}px)`;
      app.tKnob.style.color = mix("#3a3a3a", "#ffffff", ready);
      app.tLbl0.style.opacity = (1 - ready).toFixed(3);
      app.tLbl1.style.opacity = (ready * (1 - smoother(se / 0.55))).toFixed(3);
      app.tLbl1.style.transform = `translateX(${(kx * 0.35).toFixed(2)}px)`;
      const done = smoother((f - SLIDE.to) / 4);
      app.tChev.style.opacity = (1 - done).toFixed(3);
      const bought = smoother((f - 482) / 8);
      app.tSpin.style.opacity = (done * (1 - bought)).toFixed(3);
      app.tCheck.style.opacity = bought.toFixed(3);
      app.tCheck.style.transform = `scale(${(0.6 + 0.4 * smoother((f - 482) / 10)).toFixed(4)})`;
      app.tSpin.style.transform = `rotate(${((f - SLIDE.to) * 24).toFixed(1)}deg)`;
      app.tBtn.style.transform = `scale(${(1 - 0.012 * pressed(f) * (f > SLIDE.from - 2 ? 1 : 0)).toFixed(4)})`;
      // live-activity pill: drops in from the top, "Buying" with a spinner, then "Bought" with a check
      const il = f - 452; // drops in as the camera settles back on the whole phone
      const iw = lerp(0, 378, smoother(il / 18)), ih = lerp(30, 50, smoother(il / 16));
      app.island.style.opacity = smoother(il / 3).toFixed(3);
      app.island.style.width = Math.max(0, iw).toFixed(2) + "px";
      app.island.style.height = ih.toFixed(2) + "px";
      app.island.style.transform = `translateX(${(-Math.max(0, iw) / 2).toFixed(2)}px) translateY(${(-8 * (1 - smoother(il / 14))).toFixed(2)}px)`;
      const inner = smoother((il - 8) / 9);
      app.iIc.style.opacity = app.iTxt.style.opacity = inner.toFixed(3);
      const ok = smoother((f - 482) / 8);
      app.iOk.style.opacity = ok.toFixed(3);
      app.iIc.firstElementChild.style.opacity = (1 - ok).toFixed(3);
      app.iOk.style.transform = `scale(${(0.6 + 0.4 * smoother((f - 482) / 10)).toFixed(4)})`;
      app.iT0.style.opacity = (1 - ok).toFixed(3);
      app.iT1.style.opacity = ok.toFixed(3);
      app.iSpin.style.opacity = (inner * (1 - ok)).toFixed(3);
      app.iSpin.style.transform = `rotate(${(f * 22).toFixed(1)}deg)`;

      // ---------------- cursor: brush-stroke comet + mint tap halo
      const co = cursorOpacity(f);
      const toScreen = (ff) => { const p = CUR(ff); return project(camera(ff), world(p.x, p.y)); };
      if (co > 0.002) {
        const pts = [];
        for (let k = 0; k <= 12; k++) pts.push(toScreen(f - k * 0.26));
        trail.setAttribute("d", pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(2) + " " + p.y.toFixed(2)).join(" "));
        trail.setAttribute("stroke-width", (13 * c.Z).toFixed(2));
        trail.style.opacity = co.toFixed(3);
        const pr = pressed(f), head = pts[0];
        ring.setAttribute("cx", head.x); ring.setAttribute("cy", head.y);
        ring.setAttribute("r", (pr * 17 * c.Z).toFixed(2));
        ring.style.opacity = (0.9 * co).toFixed(3);
      } else { trail.setAttribute("d", ""); ring.setAttribute("r", 0); }
      let hr = 0, hop = 0, hp = null;
      for (const k in TAP) {
        const tt = f - TAP[k];
        if (tt < -1 || tt > 24) continue;
        const tp = KEYXY[k] ? { x: KEYXY[k][0], y: KEYXY[k][1] } : CUR(TAP[k]);
        // the input and send button ride the keyboard: keep their halo on them
        const dockY = (ff) => -129 * (1 - kbOff(ff) / 300);
        const dy = k === "input" || k === "send" ? dockY(f) - dockY(TAP[k]) : 0;
        hp = project(c, world(tp.x, tp.y + dy));
        hr = (20 + 58 * (1 - Math.exp(-Math.max(0, tt) / 3.2))) * c.Z;
        hop = 0.34 * smoother((tt + 1) / 2.5) * (1 - smoother(tt / 20));
      }
      if (hp) { halo.setAttribute("cx", hp.x); halo.setAttribute("cy", hp.y); }
      halo.setAttribute("r", hr.toFixed(2));
      halo.style.opacity = hop.toFixed(3);
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { bubbleW = 0; render(R._f); });
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
