// "just ask" on the acend desktop app, in the same type and motion language as the earlier clips. 30 fps, 500 frames.
// Every element is a pure function of a continuous frame number so the 240 fps motion-blur render can sample
// between frames; discrete state (words, typed characters, the page swaps) uses whole frames.
//
//   0–30    "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white
//   30–90   the pill becomes the Account button while the camera pulls back (one slow sine-eased move) and the
//           Markets page opens out around it; the USDC balance counts up to $1,350.00
//   90–132  the cursor (a soft mint dot) clicks AI: the tab grows into the AI page, which settles in
//   143–298 it settles on the input, rides along it as the prompt types, then follows the message up into the chat:
//           typing dots, a streamed reply, three plan cards arriving with pastel washes
//   296–336 click Coca-Cola: the card expands into Coca-Cola's page and its logo glides onto the page's header logo,
//           while the camera eases out and the window floats up in 3D
//   356–456 in to the order panel: 375 is typed, Buy lights up, "Buying…", "Bought 4.00 KO"; back out to the
//           floating window, a toast drops in and the balance settles to $975.00
(function () {
  const FPS = 30;
  const FRAMES = 524;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  const money = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bump = (f, t0, d) => Math.sin(Math.PI * clamp((f - t0) / d, 0, 1)); // 0 -> 1 -> 0

  // ------------------------------------------------------------------ headline (as in one-terminal)
  const INK = "#1c1d21", PAPER = "#f9f8f4";
  function headline(f, fi) {
    const size = 142 + 50 * (1 - Math.exp(-f / 4)) + 0.6 * f;
    return fi < 7 ? { words: ["just"], size } : { words: ["just", "ask"], size, join: { at: 7, prev: "just" } };
  }

  // ------------------------------------------------------------------ camera: screen = O + Z * window point
  const ZF = 0.92; // the whole window in view
  const FULL = { x: 960, y: 450, z: ZF };
  const ACC = { x: DESK.ACCOUNT.x + DESK.ACCOUNT.w / 2, y: DESK.ACCOUNT.y + DESK.ACCOUNT.h / 2 };
  const fromFocus = (fx, fy, z) => ({ Z: z, O: { x: 960 - z * fx, y: 540 - z * fy } });
  // pull-back: the Account button starts where "ask" sits, large, and the camera eases out to the whole window
  const ZS = 2.3;
  const pullE = (f) => { const t = clamp((f - 30) / 62, 0, 1); return 0.5 - 0.5 * Math.cos(Math.PI * t); }; // sine ease: gentlest peak speed
  let ASK_C = { x: 1090, y: 540 }; // measured once the fonts are in
  function pullCam(f) {
    const e = pullE(f), Z = Math.exp(lerp(Math.log(ZS), Math.log(ZF), e));
    const end = fromFocus(FULL.x, FULL.y, ZF), endA = { x: end.O.x + ZF * ACC.x, y: end.O.y + ZF * ACC.y };
    const S = { x: lerp(ASK_C.x, endA.x, e), y: lerp(ASK_C.y, endA.y, e) };
    return { Z, O: { x: S.x - Z * ACC.x, y: S.y - Z * ACC.y } };
  }
  // After the reveal the camera is one continuous move on Gaussian-smoothed keyframes [frame, focus x, focus y,
  // zoom, tilt x, tilt y] (sigma 5 frames), so velocity and acceleration stay continuous. The two screen changes are
  // match moves on the clicked element instead of cuts: the AI tab grows into the AI page, and the Coca-Cola card
  // expands into Coca-Cola's page while its logo glides onto the page's header logo.
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
      return { x: g(0), y: g(1), z: Math.exp(g(2)), rx: g(3), ry: g(4) };
    };
  }
  const PATH = smoothPath([
    [90, 960, 450, ZF, 0, 0], [100, 945, 445, 0.94, 0, 0], [128, 960, 470, 1.0, 0, 0], [146, 960, 640, 1.15, 0, 0],
    [148, 960, 640, 1.15, 0, 0], [170, 800, 846, 1.82, 0, 0], [188, 1120, 840, 1.95, 0, 0], [196, 1150, 820, 1.9, 0, 0],
    [234, 960, 330, 1.32, 0, 0], [284, 960, 470, 1.25, 0, 0], [298, 960, 500, 1.18, 0, 0], [326, 960, 455, 0.86, 7, -11],
    [348, 960, 450, 0.8, 10, -16], [358, 990, 452, 0.84, 9, -14], [400, 1660, 476, 1.95, 0, 0], [440, 1690, 490, 2.06, 0, 0],
    [448, 1680, 496, 1.98, 0, 0], [496, 960, 452, 0.82, 11, 13], [524, 960, 444, 0.84, 7, 9], [544, 960, 444, 0.84, 7, 9],
  ], 80, 534, 6);
  const CUT_AI = 118, CUT_KO = 318; // the pages swap under the growing surface, on whole frames
  // the growing surfaces (window px): tab pill -> page, card -> page
  const PAGE_R = { x: 12, y: 72, w: 1896, h: 820 };
  const TAB_R = { x: 493, y: 8, w: 52, h: 48 };
  const CARD_R = { x: 456, y: DESK.CARD0 + 2 * DESK.CARD_PITCH, w: 1008, h: DESK.CARD_H };
  const CARD_LOGO = { x: 456 + 19, y: DESK.CARD0 + 2 * DESK.CARD_PITCH + 16, s: 54 };
  const HEAD_LOGO = { x: 69, y: 152, s: 26 };
  function camera(f, fi) {
    if (fi === undefined) fi = Math.round(f);
    if (fi < 90) return { ...pullCam(f), rx: 0, ry: 0, dark: 0 };
    const p = PATH(f), c = fromFocus(p.x, p.y, p.z);
    c.rx = p.rx; c.ry = p.ry; c.dark = smoother((f - 318) / 22);
    return c;
  }
  const project = (c, p) => ({ x: c.O.x + c.Z * p.x, y: c.O.y + c.Z * p.y });

  // ------------------------------------------------------------------ interaction script (window px)
  const TAP = { ai: 99, input: 148, send: 190, card: 296, amount: 402, buy: 434 };
  const TYPE0 = 154; // first prompt character, one a frame
  const DIGITS = [411, 418, 425]; // 3, 7, 5
  const BOUGHT = 452;
  const KO_IN = 318; // the Coca-Cola page swaps in under the expanding card
  const CARD_KO = { x: 980, y: DESK.CARD0 + 2 * DESK.CARD_PITCH + DESK.CARD_H / 2 };
  const CUR = (() => {
    const A = DESK.AI_TAB, S = DESK.SEND, M = DESK.AMOUNT, B = DESK.BUY;
    const keys = [
      [88, 860, 520], [93, 700, 300], [97, 560, 90], [99, A.x, A.y], [104, A.x + 8, A.y + 6],
      [140, 700, 980], [146, 772, 850], [149, 778, 848], [162, 820, 900], [178, 1240, 905], [186, 1410, 860], [189, S.x, S.y], [196, S.x + 14, S.y + 20],
      [286, 820, 700], [294, CARD_KO.x - 140, CARD_KO.y + 4], [296, CARD_KO.x - 150, CARD_KO.y], [302, CARD_KO.x - 156, CARD_KO.y + 4],
      [388, 1820, 560], [398, M.x + 24, M.y + 6], [402, M.x, M.y], [426, M.x + 6, M.y + 2],
      [430, 1700, 500], [433, B.x + 4, B.y], [434, B.x, B.y], [440, B.x + 10, B.y + 8],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => ({ x: sx(f), y: sy(f) });
  })();
  // the pointer only appears in the shots where it acts (it cuts with them)
  const CUR_ON = [[88, 106], [141, 197], [284, 304], [388, 442]];
  const cursorOpacity = (f, fi) => {
    for (const [a, b] of CUR_ON) if (fi >= a && fi < b) return smoother((f - a + 0.5) / 4) * (1 - smoother((f - b + 5) / 4));
    return 0;
  };
  const pressed = (f) => {
    let p = 0;
    for (const k in TAP) p = Math.max(p, smoother((f - TAP[k] + 1.5) / 1.5) * (1 - smoother((f - TAP[k] - 2) / 4)));
    return p;
  };
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

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE._probe = { camera, project, CUR };
  SCENE.mount = function (stage) {
    stage.innerHTML = `<div id="bg"></div><div id="reveal"><div id="cam"><div id="win"></div></div></div>
      <div id="pill"></div><div id="line"></div>
      <svg id="cursor" width="1920" height="1080" viewBox="0 0 1920 1080">
        <defs><radialGradient id="dotg"><stop offset="0" stop-color="#b9dcc5"/><stop offset="1" stop-color="#7fb894"/></radialGradient></defs>
        <circle id="halo" r="0" fill="#9fd0b0"/><circle id="ring" r="0" fill="none" stroke="#7fb894" stroke-width="2"/>
        <circle id="dot" r="0" fill="url(#dotg)" stroke="#ffffff" stroke-width="2.5"/>
      </svg><span id="meas"></span>`;
    const $ = (s) => stage.querySelector(s);
    const reveal = $("#reveal"), camEl = $("#cam"), ui = DESK.build($("#win"));
    const line = $("#line"), pill = $("#pill"), meas = $("#meas");
    const dot = $("#dot"), ring = $("#ring"), halo = $("#halo"), bg = $("#bg"), winEl = $("#win");
    const widthOf = (text, size) => { meas.textContent = text; meas.style.fontSize = size + "px"; return meas.getBoundingClientRect().width; };
    let lastKey = null, bubbleW = 0, solW = 0, toastW = 0;

    // where "ask" sits on screen at the hand-off (the camera starts with the Account button there)
    const measureAsk = () => {
      const h = headline(30, 30);
      const wl = widthOf("just ask", h.size), wa = widthOf("ask", h.size);
      ASK_C = { x: 960 + wl / 2 - wa / 2, y: 540 };
    };
    measureAsk();

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);
      const c = camera(f, fi);
      camEl.style.transform = `translate(${c.O.x.toFixed(3)}px, ${c.O.y.toFixed(3)}px) scale(${c.Z.toFixed(5)})`;
      winEl.style.transform = c.rx || c.ry ? `rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg)` : "none";
      bg.style.setProperty("--dark", c.dark.toFixed(3));

      // ---------------- reveal: a feathered circle opens out of the Account button
      const winOn = f >= 33;
      reveal.style.display = winOn ? "block" : "none";
      if (winOn && f < 96) {
        const cp = project(c, ACC);
        const R = 40 * c.Z + 2600 * Math.pow(smoother((f - 33) / 56), 1.5);
        const F = 0.5 + 320 * smoother((f - 33) / 24);
        reveal.style.webkitMaskImage = reveal.style.maskImage =
          `radial-gradient(circle at ${cp.x.toFixed(2)}px ${cp.y.toFixed(2)}px, #000 ${R.toFixed(2)}px, transparent ${(R + F).toFixed(2)}px)`;
      } else reveal.style.webkitMaskImage = reveal.style.maskImage = "none";

      // ---------------- headline + pill
      if (f < 56) {
        const h = headline(f, fi);
        const key = h.words.join(" ");
        if (key !== lastKey) { lastKey = key; line.innerHTML = h.words.map((w) => `<span>${w}</span>`).join(" "); }
        line.style.display = "block";
        line.style.fontSize = h.size + "px";
        let dx = 0;
        if (h.join) dx = 0.3 * ((widthOf(key, h.size) - widthOf(h.join.prev, h.size)) / 2) * Math.exp(-(f - h.join.at) / 1.5);
        line.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), -54%)`;
        const spans = [...line.children];
        spans.forEach((s) => { s.style.opacity = 1; s.style.transform = "none"; s.style.color = INK; s.style.filter = "none"; });
        if (spans.length === 2 && f >= 21.5) {
          // "just" steps back; "ask" turns white as a dark pill grows behind it, then the pill flies onto the
          // Account button (which the camera is already pulling back from) and its label fades
          const a = smoother((f - 22) / 5), e = smoother((f - 22) / 7);
          spans[0].style.opacity = 1 - e;
          spans[0].style.transform = `translateX(${(-30 * e).toFixed(2)}px)`;
          spans[1].style.color = mix(INK, PAPER, a);
          const lf = smoother((f - 31) / 7);
          spans[1].style.opacity = 1 - lf;
          spans[1].style.filter = lf > 0.01 ? `blur(${(lf * 6).toFixed(2)}px)` : "none";
          const r = spans[1].getBoundingClientRect();
          const W0 = { x: r.left + r.width / 2, y: r.top + r.height * 0.54, w: r.width + 0.62 * h.size, h: 1.22 * h.size };
          const tl = project(c, { x: DESK.ACCOUNT.x, y: DESK.ACCOUNT.y }), br = project(c, { x: DESK.ACCOUNT.x + DESK.ACCOUNT.w, y: DESK.ACCOUNT.y + DESK.ACCOUNT.h });
          const T = { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2, w: br.x - tl.x, h: br.y - tl.y };
          const m = smoother((f - 30) / 14);
          const w = lerp(W0.w, T.w, m), hh = lerp(W0.h, T.h, m), rad = lerp(hh / 2, 10 * c.Z, m);
          const sc = lerp(0.9, 1, a);
          pill.style.display = "block";
          pill.style.opacity = (a * (1 - smoother((f - 48) / 6))).toFixed(4);
          pill.style.width = w + "px"; pill.style.height = hh + "px"; pill.style.borderRadius = rad + "px";
          pill.style.transform = `translate(${(lerp(W0.x, T.x, m) - w / 2).toFixed(2)}px, ${(lerp(W0.y, T.y, m) - hh / 2).toFixed(2)}px) scale(${sc.toFixed(4)})`;
        } else pill.style.display = "none";
      } else { line.style.display = "none"; pill.style.display = "none"; }

      // ---------------- top bar: tab pill (Markets -> AI -> Markets), Solana balance hides on the AI page,
      // USDC balance counts up, then settles after the buy
      const toAI = smoother((f - TAP.ai) / 10), back = smoother((f - KO_IN + 3) / 8);
      const onAI = toAI * (1 - back);
      const tm = DESK.TAB.markets, ta = DESK.TAB.ai;
      ui.tabpill.style.left = lerp(tm.x, ta.x, onAI) + "px";
      ui.tabpill.style.width = lerp(tm.w, ta.w, onAI) + "px";
      ui.tabs.forEach((el) => {
        const on = el.dataset.k === "ai" ? onAI : 1 - onAI;
        el.style.color = mix("#6b6a66", INK, on);

      });
      if (!solW) solW = ui.solbal.firstElementChild.offsetWidth;
      ui.solbal.style.width = (solW * (1 - onAI)).toFixed(2) + "px";
      ui.solbal.style.opacity = (1 - onAI).toFixed(3);
      const bal = DESK.BALANCE * outCubic((f - 60) / 30) - 375 * outCubic((f - 478) / 20);
      ui.usdv.textContent = money(bal);
      ui.account.style.opacity = smoother((f - 47) / 6).toFixed(3); // under the pill until it hands over

      // ---------------- pages
      const solOut = 0;
      ui.sol.style.display = fi < CUT_AI ? "block" : "none";
      ui.solItems.forEach((el, i) => {
        const p = outCubic((f - 46 - i * 2) / 16);
        el.style.opacity = (p * (1 - solOut)).toFixed(4);
        el.style.transform = `translate(${(-16 * solOut).toFixed(2)}px, ${(18 * (1 - p)).toFixed(2)}px)`;
      });
      ui.solCnd.style.clipPath = `inset(0 ${(100 * (1 - outCubic((f - 56) / 28))).toFixed(2)}% 0 0)`;

      const aiIn = fi >= CUT_AI;
      ui.ai.style.display = aiIn && fi < KO_IN ? "block" : "none";
      ui.ai.style.opacity = 1;
      if (aiIn) {
        const gone = smoother((f - TAP.send) / 10); // title + suggestions drift away after send
        ui.aiItems.forEach((el, j) => {
          const p = smoother((f - 120 - j * 2) / 14);
          el.style.opacity = (p * (1 - gone)).toFixed(4);
          el.style.transform = `translateY(${(18 * (1 - p) - 16 * gone).toFixed(2)}px)`;
        });
        const dIn = smoother((f - 124) / 14);
        ui.dock.style.opacity = dIn.toFixed(4);
        ui.dock.style.transform = `translateY(${(14 * (1 - dIn)).toFixed(2)}px)`;
        ui.dock.style.boxShadow = `0 0 0 ${lerp(1, 1.6, smoother((f - TAP.input) / 5)).toFixed(2)}px ${mix("#e3e1dc", "#b9b8b5", smoother((f - TAP.input) / 5) * (1 - smoother((f - TAP.send) / 6)))}`;
        // typing
        const n = f >= TAP.send + 1 ? 0 : clamp(fi - TYPE0 + 1, 0, DESK.PROMPT.length);
        ui.typed.textContent = DESK.PROMPT.slice(0, n);
        ui.ph.style.display = n > 0 ? "none" : "inline";
        const focused = f >= TAP.input && f < TAP.send + 1;
        ui.caret.style.opacity = focused ? (n > 0 && n < DESK.PROMPT.length ? 1 : Math.floor(fi / 8) % 2 ? 0 : 1) : 0;
        ui.caret.style.order = n === 0 ? -1 : 0;
        const live = smoother((f - TYPE0) / 3) * (1 - smoother((f - TAP.send - 1) / 3));
        ui.send.style.background = mix("#b9b8b5", "#31302e", live);
        ui.send.style.transform = `scale(${(1 - 0.1 * bump(f, TAP.send - 1, 8)).toFixed(4)})`;
        // the sent message flies from the input up into a bubble
        if (!bubbleW) bubbleW = ui.bubble.offsetWidth;
        const fl = smoother((f - TAP.send - 1) / 20);
        const sx = 460 - 21 - (1463 - bubbleW), sy = 845 - 178.5;
        ui.bubble.style.opacity = smoother((f - TAP.send) / 4).toFixed(4);
        ui.bubble.style.background = mix("#ffffff", "#efeeea", smoother((f - TAP.send - 2) / 8));
        ui.bubble.style.transform = `translate(${(sx * (1 - fl)).toFixed(2)}px, ${(sy * (1 - fl)).toFixed(2)}px) scale(${(0.97 + 0.03 * fl).toFixed(4)})`;
        // typing indicator, streamed reply, plan cards
        ui.typing.style.opacity = (smoother((f - 206) / 4) * (1 - smoother((f - 217) / 4))).toFixed(3);
        ui.dots.forEach((d, i) => {
          const ph = Math.sin(((f - i * 3) / 9) * Math.PI * 2) * 0.5 + 0.5;
          d.style.opacity = (0.35 + 0.65 * ph).toFixed(3);
          d.style.transform = `translateY(${(-3 * ph).toFixed(2)}px)`;
        });
        ui.words.forEach((w, i) => {
          const p = outCubic((f - 220 - i * 0.9) / 5);
          w.style.opacity = p.toFixed(3);
          w.style.transform = `translateY(${(7 * (1 - p)).toFixed(2)}px)`;
        });
        // each card arrives with a pastel wash sweeping across it (as the reference's highlighted rows); the
        // clicked one keeps a soft mint tint
        const TINT = [[251, 240, 214], [248, 227, 225], [220, 238, 227]];
        ui.cards.forEach((el, j) => {
          const t0 = 258 + j * 4, p = smoother((f - t0) / 17);
          const press = j === 2 ? bump(f, TAP.card - 1, 10) : 0;
          el.style.opacity = p.toFixed(4);
          el.style.transform = `translateY(${(20 * (1 - p)).toFixed(2)}px) scale(${((0.98 + 0.02 * p) * (1 - 0.014 * press)).toFixed(4)})`;
          const sw = 100 * outCubic((f - t0 - 3) / 16), fade = 1 - smoother((f - t0 - 18) / 18);
          const keep = j === 2 ? smoother((f - TAP.card) / 4) : 0;
          const a = Math.max(fade, keep), tc = `rgba(${TINT[j].join(",")},${a.toFixed(3)})`;
          el.style.background = keep > fade
            ? `linear-gradient(${tc}, ${tc}), #ffffff`
            : `linear-gradient(90deg, ${tc} 0%, ${tc} ${sw.toFixed(1)}%, rgba(255,255,255,0) ${(sw + 16).toFixed(1)}%), #ffffff`;
          el.style.boxShadow = `0 0 0 1px ${keep > 0.01 ? mix("#e3e1dc", "#9fcfb1", keep) : "#e3e1dc"}${keep > 0.01 ? `, 0 10px 30px rgba(40,90,60,${(0.12 * keep).toFixed(3)})` : ""}`;
        });
        ui.amts.forEach((a, j) => { a.textContent = money(+a.dataset.v * outCubic((f - 262 - j * 4) / 16)); });
        ui.sparks.forEach((p, j) => { p.style.strokeDasharray = "1"; p.style.strokeDashoffset = (1 - outCubic((f - 264 - j * 4) / 18)).toFixed(4); });
        ui.hint.style.opacity = smoother((f - 278) / 10).toFixed(3);
      }

      // ---------------- Coca-Cola: its Markets page, the amount typed, Buy
      const koOn = fi >= KO_IN;
      ui.koHeadIcon.style.opacity = smoother((f - CUT_KO - 4) / 4).toFixed(3);
      ui.ko.style.display = koOn ? "block" : "none";
      if (koOn) {
        ui.koItems.forEach((el, i) => {
          // the header is where the camera comes out of the logo, so it is there from the cut; the rest cascades in
          const p = outCubic((f - KO_IN - 2 - i * 1.6) / 14);
          el.style.opacity = p.toFixed(4);
          el.style.transform = `translateY(${(18 * (1 - p)).toFixed(2)}px)`;
        });
        ui.koCnd.style.clipPath = `inset(0 ${(100 * (1 - outCubic((f - KO_IN - 4) / 24))).toFixed(2)}% 0 0)`;
        const foc = smoother((f - TAP.amount) / 5);
        ui.koAmtBox.style.boxShadow = `inset 0 0 0 ${(1.6 * foc).toFixed(2)}px #31302e, 0 0 0 ${(6 * foc).toFixed(2)}px rgba(127,184,148,${(0.28 * foc).toFixed(3)})`;
        ui.koAmtBox.style.background = mix("#eeede9", "#fdfcfa", foc);
        const typedN = DIGITS.filter((d) => fi >= d).length;
        const str = DESK.TRADE.digits.slice(0, typedN);
        if (ui.koTyped._k !== str) { ui.koTyped._k = str; ui.koTyped.innerHTML = [...str].map((ch) => `<span>${ch}</span>`).join(""); }
        const last = typedN ? DIGITS[typedN - 1] : 0;
        const spans = ui.koTyped.children;
        if (typedN && spans.length) {
          const q = smoother((f - last) / 7), nd = spans[spans.length - 1];
          nd.style.opacity = q.toFixed(3);
          nd.style.transform = `translateY(${(14 * (1 - q)).toFixed(2)}px)`;
        }
        ui.koPh.style.display = typedN ? "none" : "inline";
        ui.koCaret.style.opacity = f >= TAP.amount && f < TAP.buy ? (typedN && typedN < 3 ? 1 : Math.floor(fi / 8) % 2 ? 0 : 1) : 0;
        ui.koCaret.style.order = typedN ? 0 : -1;
        const amtNow = typedN ? +str : 0, prev = typedN > 1 ? +str.slice(0, -1) : 0;
        const shown = lerp(prev, amtNow, typedN ? smoother((f - last) / 8) : 1);
        ui.koRecv.textContent = "≈ " + (shown / DESK.TRADE.price).toFixed(2) + " KO";
        const ready = smoother((f - DIGITS[2] - 2) / 8);
        const busy = smoother((f - TAP.buy) / 4), done = smoother((f - BOUGHT) / 6);
        const base = mix("#c9d9cf", "#4f8c68", ready), shp = lerp(-30, 130, (f - DIGITS[2] - 4) / 16);
        ui.buy.style.background = shp > -30 && shp < 130
          ? `linear-gradient(105deg, ${base} ${(shp - 18).toFixed(1)}%, #7fb894 ${shp.toFixed(1)}%, ${base} ${(shp + 18).toFixed(1)}%)` : base;
        ui.buy.style.boxShadow = `inset 0 0 0 60px rgba(0,0,0,${(0.1 * busy * (1 - done)).toFixed(3)})`;
        ui.buy.style.transform = `scale(${(1 - 0.02 * bump(f, TAP.buy - 1, 8)).toFixed(4)})`;
        ui.bb0.style.opacity = (1 - busy).toFixed(3);
        ui.bb1.style.opacity = (busy * (1 - done)).toFixed(3);
        ui.bb2.style.opacity = done.toFixed(3);
        ui.bbSpin.style.transform = `rotate(${((f - TAP.buy) * 22).toFixed(1)}deg)`;
        ui.bbSpin.style.transformOrigin = "50% 50%";
      }

      // ---------------- toast: drops in at the top of the window as the camera eases back, "Buying" -> "Bought"
      const tt = f - 470;
      if (!toastW) toastW = 66 + Math.max(ui.tTxt.scrollWidth, 236) + 56;
      const tw = lerp(64, toastW, smoother((tt - 2) / 14));
      ui.toast.style.opacity = smoother(tt / 4).toFixed(3);
      ui.toast.style.width = tw.toFixed(2) + "px";
      ui.toast.style.transform = `translate(${(-tw / 2).toFixed(2)}px, ${lerp(20, 84, outCubic(tt / 14)).toFixed(2)}px)`;
      const inner = smoother((tt - 8) / 8), ok = smoother((f - BOUGHT) / 7);
      ui.tTxt.style.opacity = inner.toFixed(3);
      ui.tOk.style.opacity = ok.toFixed(3);
      ui.tOk.style.transform = `scale(${(0.6 + 0.4 * smoother((f - BOUGHT) / 9)).toFixed(4)})`;
      ui.tT0.style.opacity = (1 - ok).toFixed(3);
      ui.tT1.style.opacity = ok.toFixed(3);
      ui.tSpin.style.opacity = (inner * (1 - ok)).toFixed(3);
      ui.tSpin.style.transform = `rotate(${(f * 22).toFixed(1)}deg)`;

      // ---------------- the growing surface: the AI tab grows into the AI page; the Coca-Cola card expands into its page
      const box = (A, B, k) => ({ x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), w: lerp(A.w, B.w, k), h: lerp(A.h, B.h, k) });
      let mr = null, mo = 0, mbg = "#fdfcfa", mrad = 10, ml = 0;
      if (f >= TAP.ai + 1 && f < 132) {
        const k = smoother((f - TAP.ai - 1) / 18);
        mr = box(TAB_R, PAGE_R, k); mrad = lerp(10, 12, k);
        mo = 1 - smoother((f - CUT_AI - 2) / 12);
        mbg = mix("#fdfcfa", "#f9f8f4", k);
      } else if (f >= TAP.card + 2 && f < 336) {
        const k = smoother((f - TAP.card - 2) / 20);
        mr = box(CARD_R, PAGE_R, k); mrad = 12;
        mo = 1 - smoother((f - CUT_KO - 2) / 14);
        mbg = mix("#dcede3", "#f1f0ec", smoother((f - TAP.card - 2) / 16));
        ml = 1;
      }
      ui.morph.style.display = mr ? "block" : "none";
      if (mr) {
        ui.morph.style.left = mr.x.toFixed(2) + "px"; ui.morph.style.top = mr.y.toFixed(2) + "px";
        ui.morph.style.width = mr.w.toFixed(2) + "px"; ui.morph.style.height = mr.h.toFixed(2) + "px";
        ui.morph.style.borderRadius = mrad.toFixed(2) + "px";
        ui.morph.style.background = mbg;
        ui.morph.style.opacity = mo.toFixed(4);
        ui.morph.style.boxShadow = `0 0 0 1px rgba(28,29,33,${(0.06 * mo).toFixed(3)}), 0 30px 80px rgba(40,30,10,${(0.12 * mo).toFixed(3)})`;
      }
      // the card's logo glides onto Coca-Cola's header logo, riding above the surface, then hands over to it
      const lg = ml ? smoother((f - TAP.card - 4) / 22) : 0;
      ui.mlogo.style.display = ml && f < CUT_KO + 14 ? "block" : "none";
      if (ml) {
        const sz = lerp(CARD_LOGO.s, HEAD_LOGO.s, lg);
        ui.mlogo.style.width = ui.mlogo.style.height = sz.toFixed(2) + "px";
        ui.mlogo.style.borderRadius = lerp(12, 6, lg).toFixed(2) + "px";
        ui.mlogo.style.transform = `translate(${lerp(CARD_LOGO.x, HEAD_LOGO.x, lg).toFixed(2)}px, ${lerp(CARD_LOGO.y, HEAD_LOGO.y, lg).toFixed(2)}px)`;
        ui.mlogo.style.opacity = (1 - smoother((f - CUT_KO - 6) / 6)).toFixed(3);
      }

      // ---------------- cursor: a soft mint dot (as in the motion reference); each click blooms and rings
      const co = cursorOpacity(f, fi);
      if (co > 0.002) {
        const head = project(c, CUR(f)), pr = pressed(f);
        dot.setAttribute("cx", head.x.toFixed(2)); dot.setAttribute("cy", head.y.toFixed(2));
        dot.setAttribute("r", (15 * (1 - 0.22 * pr)).toFixed(2));
        dot.style.opacity = (0.92 * co).toFixed(3);
      } else dot.setAttribute("r", 0);
      ring.setAttribute("r", 0);
      for (const k in TAP) {
        const d = f - TAP[k];
        if (d < 0 || d > 16) continue;
        const rp = project(c, CUR(TAP[k]));
        ring.setAttribute("cx", rp.x.toFixed(2)); ring.setAttribute("cy", rp.y.toFixed(2));
        ring.setAttribute("r", (16 + 46 * outCubic(d / 14)).toFixed(2));
        ring.style.opacity = (0.9 * (1 - smoother(d / 15))).toFixed(3);
      }
      let hr = 0, hop = 0, hp = null;
      for (const k in TAP) {
        const d = f - TAP[k];
        if (d < -1 || d > 24) continue;
        hp = project(c, CUR(TAP[k]));
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
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { bubbleW = solW = toastW = 0; measureAsk(); render(R._f); });
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
