// "just ask" — picks up on the last frame of one-terminal (Explore, Pre-IPO selected) and runs in the same type and
// motion language. 30 fps, 410 frames. Every element is a pure function of a continuous frame number so the 240 fps
// motion-blur render can sample between frames; discrete state (typed characters, words) uses whole frames.
//
//   0–27    the camera pushes into the Pre-IPO button while a feathered mask dissolves the screen around it; the
//           button floats free as a dark circle
//   25–80   the circle stretches into a pill that shows "ask" in white; "just" joins in ink: just [ask]
//   76–118  "just" leaves, the pill rounds back into a circle that becomes the "M" avatar on Home while the camera
//           pulls back and a feathered circle reveals Home; the balance counts up to $1,350.00
//   118–200 the camera eases out to the whole phone; the cursor taps AI; Home slides away, the AI screen builds in
//   200–262 tap the input: the keyboard slides up and the prompt types itself with key presses; tap send
//   262–330 the message flies up into a bubble, a typing indicator, a streamed reply and three low-risk asset cards
//   330–409 the cursor taps Coca-Cola: the trade sheet springs up; the cursor settles on Buy
(function () {
  const FPS = 30;
  const FRAMES = 410;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));
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
  const D1 = spline([[0, BTN_D * Z_END], [3, BTN_D * Z_END + 0.8], [8, 112], [13, 140], [18, 170], [22, 192], [27, 206]]);
  const X1 = spline([[0, C0.x], [3, C0.x - 1.5], [8, C0.x - 30], [13, 1160], [18, 1094], [22, 1062], [27, 1048]]);
  const Y1 = spline([[0, C0.y], [3, C0.y + 1], [8, C0.y + 24], [13, 412], [18, 474], [22, 512], [27, 536]]);

  // ---- transition 2: pill -> circle -> the M avatar, driving the pull-back onto Home
  const D2 = spline([[80, 177], [84, 168], [88, 155], [90, 147], [94, 127], [98, 107], [102, 90], [106, 76.5], [110, 67], [114, 61.2], [118, AV_D]]);
  const X2 = spline([[80, 1049], [84, 1058], [88, 1082], [90, 1097], [94, 1137], [98, 1178], [102, 1212], [106, 1234], [110, 1246], [114, 1252.4], [118, AV.x]]);
  const Y2 = spline([[80, 543], [84, 531], [88, 507], [90, 492], [94, 453], [98, 405], [102, 351], [106, 300], [110, 261], [114, 233], [118, AV.y - 20]]);

  // ---- camera shots after the reveal (C fixed at screen centre): [frame, world focus x, y, zoom]
  const SHOT = [
    [118, 960, 560, 1.0], [146, 960, 612, 0.955], [172, 960, 847.5, 0.655], [199, 960, 847.5, 0.655],
    [221, 960, 1262, 1.0], [258, 960, 1276, 1.0], [280, 960, 652, 1.0], [330, 960, 694, 1.0],
    [354, 960, 1082, 0.92], [409, 960, 1104, 0.955],
  ];
  const SW = { x: spline(SHOT.map((s) => [s[0], s[1]])), y: spline(SHOT.map((s) => [s[0], s[2]])), z: spline(SHOT.map((s) => [s[0], s[3]])) };

  // camera as screen = O + Z * world
  function camera(f) {
    const fromPath = (Z, W, C) => ({ Z, O: { x: C.x - Z * W.x, y: C.y - Z * W.y } });
    if (f <= 24) return fromPath(D1(f) / BTN_D, P1, { x: X1(f), y: Y1(f) });
    const t2 = fromPath(D2(f) / AV_D, AV, { x: X2(f), y: Y2(f) });
    const zs = SW.z(f);
    const shot = fromPath(zs, { x: SW.x(f), y: SW.y(f) }, { x: 960, y: 540 });
    const b = smoother((f - 112) / 12);
    return { Z: lerp(t2.Z, shot.Z, b), O: { x: lerp(t2.O.x, shot.O.x, b), y: lerp(t2.O.y, shot.O.y, b) } };
  }
  const project = (c, p) => ({ x: c.O.x + c.Z * p.x, y: c.O.y + c.Z * p.y });

  // ------------------------------------------------------------------ interaction script
  const TAP = { ai: 176, input: 204, send: 262, card: 342 };
  const TYPE0 = 224; // first typed character
  const CUR = (() => {
    const keys = [
      [156, 560, 1010], [160, 486, 936], [165, 380, 868], [170, 302, 818], [174.5, 269, 797], [182, 269, 797],
      [188, 246, 775], [194, 214, 752], [198.5, 196, 739], [206, 196, 739],
      [212, 248, 650], [218, 296, 566], [224, 318, 524], [254, 328, 528], [258, 372, 586], [261.5, 395, 609], [267, 395, 609],
      [276, 452, 540], [322, 470, 600], [327, 420, 540], [333, 340, 484], [338, 276, 456], [341.5, 252, 451], [349, 252, 451],
      [356, 272, 560], [364, 252, 720], [372, 230, 840], [378, 224, 870], [409, 222, 874],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => ({ x: sx(f), y: sy(f) });
  })();
  const cursorOpacity = (f) =>
    smoother((f - 156) / 4) * (1 - smoother((f - 264) / 10)) + smoother((f - 322) / 5) * (1 - smoother((f - 398) / 11));
  const pressed = (f) => {
    let p = 0;
    for (const k in TAP) p = Math.max(p, smoother((f - TAP[k] + 1.5) / 1.5) * (1 - smoother((f - TAP[k] - 2) / 4)));
    return p;
  };
  // keyboard sheet offset in pt (0 = up): rises after the input tap, drops after send
  const kbOff = (f) => 300 * (1 - outCubic((f - 205) / 13)) + 300 * smoother((f - 263) / 12);

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
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
    const widthOf = (t, size) => { meas.textContent = t; meas.style.fontSize = size + "px"; return meas.getBoundingClientRect().width; };
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
      const phoneOn = f < 22.5 || f >= 90;
      reveal.style.display = phoneOn ? "block" : "none";
      camEl.style.transform = `translate(${c.O.x.toFixed(3)}px, ${c.O.y.toFixed(3)}px) scale(${c.Z.toFixed(5)})`;
      let mask = "none";
      if (f < 22.5) {
        // dissolve the Explore screen around the Pre-IPO button as the camera pushes in
        const cp = project(c, P1);
        const R = D1(f) / 2 + 2300 * Math.pow(1 - smoother(f / 22), 1.5);
        const F = 0.5 + 260 * (1 - smoother((f - 4) / 18));
        mask = `radial-gradient(circle at ${cp.x.toFixed(2)}px ${cp.y.toFixed(2)}px, #000 ${R.toFixed(2)}px, transparent ${(R + F).toFixed(2)}px)`;
      } else if (f >= 90 && f < 120) {
        // reveal Home from the M avatar as the camera pulls back
        const cp = project(c, AV);
        const R = (AV_D * c.Z) / 2 + 2300 * Math.pow(smoother((f - 90) / 26), 1.5);
        const F = 0.5 + 260 * smoother((f - 90) / 14);
        mask = `radial-gradient(circle at ${cp.x.toFixed(2)}px ${cp.y.toFixed(2)}px, #000 ${R.toFixed(2)}px, transparent ${(R + F).toFixed(2)}px)`;
      }
      reveal.style.webkitMaskImage = reveal.style.maskImage = mask;
      app.explore.style.display = f < 22.5 ? "block" : "none";
      rocket.style.opacity = 1 - smoother((f - 11) / 9);
      const homeOn = f >= 89;
      app.home.style.display = homeOn ? "block" : "none";
      app.ai.style.display = f >= 176 ? "block" : "none";
      phoneWrap.querySelector(".tabbar").style.display = homeOn ? "flex" : "none";

      // ---------------- words: just [ask]
      if (f >= 22 && f < 90.5) {
        const size = 150 * (1 + 0.045 * smoother((f - 26) / 56));
        const wJ = widthOf("just", size), wA = widthOf("ask", size);
        const padX = 0.33 * size, pillW = wA + 2 * padX, pillH = 1.18 * size, gap = 0.27 * size;
        const total = wJ + gap + pillW, left = 960 - total / 2;
        const boxTop = 540 - size / 2, cy = boxTop + 0.52 * size;
        const pcx = left + wJ + gap + pillW / 2;
        // the shape: path circle -> pill -> back to a circle on its way to the avatar
        let cx = X1(f), cyy = Y1(f), w = D1(f), h = D1(f);
        const m1 = smoother((f - 25) / 11);
        cx = lerp(cx, pcx, m1); cyy = lerp(cyy, cy, m1); w = lerp(w, pillW, m1); h = lerp(h, pillH, m1);
        const m2 = smoother((f - 80) / 10);
        if (m2 > 0) { cx = lerp(cx, X2(f), m2); cyy = lerp(cyy, Y2(f), m2); w = lerp(w, D2(f), m2); h = lerp(h, D2(f), m2); }
        pill.style.display = "block";
        pill.style.width = w + "px"; pill.style.height = h + "px";
        pill.style.borderRadius = Math.min(w, h) / 2 + "px";
        pill.style.transform = `translate(${(cx - w / 2).toFixed(2)}px, ${(cyy - h / 2).toFixed(2)}px)`;
        pillM.style.fontSize = (h * 14.5) / 36 + "px";
        pillM.style.opacity = smoother((f - 84) / 6);
        // "ask" sits in the pill; "just" joins from the left
        const aIn = smoother((f - 31) / 7), aOut = smoother((f - 79) / 6), aOp = aIn * (1 - aOut);
        askEl.style.fontSize = justEl.style.fontSize = size + "px";
        askEl.style.opacity = aOp.toFixed(3);
        askEl.style.filter = aOp < 0.995 ? `blur(${(6 * (1 - aOp)).toFixed(2)}px)` : "none";
        askEl.style.transform = `translate(${(cx - wA / 2).toFixed(2)}px, ${(cyy - 0.52 * size).toFixed(2)}px)`;
        const jIn = smoother((f - 33) / 8), jOut = smoother((f - 76) / 7);
        justEl.style.opacity = (jIn * (1 - jOut)).toFixed(3);
        justEl.style.transform = `translate(${(left - 24 * (1 - jIn) - 22 * jOut).toFixed(2)}px, ${boxTop.toFixed(2)}px)`;
        $("#words").style.display = "block";
      } else $("#words").style.display = "none";

      // ---------------- Home: cascade in, balance counts up, sparklines draw; slides out on the AI tap
      if (homeOn) {
        app.homeItems.forEach((el, i) => {
          if (el === app.avatarM) return;
          const s0 = 95 + i * 1.25;
          const p = outCubic((f - s0) / 14);
          const o = smoother((f - TAP.ai - 1 - i * 0.35) / 6);
          el.style.opacity = (p * (1 - o)).toFixed(4);
          el.style.transform = `translate(${(-18 * o).toFixed(2)}px, ${(14 * (1 - p)).toFixed(2)}px)`;
        });
        const ao = smoother((f - TAP.ai - 1) / 6);
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
        const out = smoother((f - TAP.send - 1) / 8); // title + suggestions leave after send
        app.aiItems.forEach((el, j) => {
          const p = outCubic((f - 181 - j * 2) / 13);
          el.style.opacity = (p * (1 - out)).toFixed(4);
          el.style.transform = `translateY(${(16 * (1 - p) - 14 * out).toFixed(2)}px)`;
        });
        phoneWrap.querySelector(".a-edit").style.opacity = outCubic((f - 181) / 12).toFixed(4);
        // dock: fades in, rides the keyboard
        const dIn = outCubic((f - 184) / 12);
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
        // key presses
        for (const k in app.keys) { app.keys[k].style.background = ""; app.keys[k].style.transform = ""; }
        for (let i = 0; i < APP.PROMPT.length; i++) {
          const tt = f - (TYPE0 + i);
          if (tt < -0.5 || tt > 4) continue;
          const key = app.keys[APP.PROMPT[i].toLowerCase()];
          if (!key) continue;
          const p = 1 - smoother(tt / 4);
          key.style.background = mix("#ffffff", "#c9ccd3", p);
          key.style.transform = `scale(${(1 + 0.07 * p).toFixed(4)})`;
        }
        // the sent message flies from the input up into a bubble
        if (!bubbleW) bubbleW = app.bubble.offsetWidth; // layout width in pt (unaffected by transforms)
        const fl = smoother((f - TAP.send - 1) / 15);
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
          const p = outCubic((f - s0) / 13);
          const press = j === 2 ? Math.sin(Math.PI * clamp((f - TAP.card + 1) / 10, 0, 1)) : 0;
          el.style.opacity = p.toFixed(4);
          el.style.transform = `translateY(${(18 * (1 - p)).toFixed(2)}px) scale(${((0.97 + 0.03 * p) * (1 - 0.018 * press)).toFixed(4)})`;
          if (j < 3) el.style.background = mix("#f9f8f4", "#efeee9", press);
        });
        app.amts.forEach((a, j) => { a.textContent = money(+a.dataset.v * outCubic((f - 306 - j * 3.2) / 16)); });
        app.fills.forEach((b, j) => { b.style.transform = `scaleX(${outCubic((f - 309 - j * 3.2) / 18).toFixed(4)})`; });
      }

      // ---------------- trade sheet
      const sh = f - (TAP.card + 3);
      app.backdrop.style.opacity = (smoother(sh / 10)).toFixed(4);
      app.sheet.style.display = sh > -1 ? "block" : "none";
      app.sheet.style.transform = `translateY(${(520 * (1 - outBack(sh / 20, 0.9))).toFixed(2)}px)`;
      app.sheetItems.forEach((el, j) => {
        const p = outCubic((f - TAP.card - 9 - j * 1.6) / 13);
        el.style.opacity = p.toFixed(4);
        el.style.transform = `translateY(${(14 * (1 - p)).toFixed(2)}px)`;
      });
      const ca = outCubic((f - TAP.card - 12) / 18);
      app.sAmt.textContent = money(APP.TRADE.amt * ca);
      app.sShares.textContent = "≈ " + ((APP.TRADE.amt / APP.TRADE.price) * ca).toFixed(2) + " KO";
      app.sLine.style.strokeDasharray = "1";
      app.sLine.style.strokeDashoffset = (1 - outCubic((f - TAP.card - 14) / 20)).toFixed(4);
      app.sArea.style.opacity = smoother((f - TAP.card - 22) / 12).toFixed(4);
      const hov = smoother((f - 376) / 6);
      app.sBuy.style.background = mix("#31302e", "#1f1e1c", hov);

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
        const tp = CUR(TAP[k]);
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
