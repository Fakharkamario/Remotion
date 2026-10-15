// "just ask" on the acend desktop app, in the same type and motion language as the earlier clips. 30 fps, 471 frames.
// Every element is a pure function of a continuous frame number so the 240 fps motion-blur render can sample
// between frames; discrete state (words, typed characters) uses whole frames.
//
//   0–30    "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white
//   30–72   the pill becomes the Account button while the camera pulls back and the Markets page is revealed around it
//   46–92   the page cascades in, the candles draw, the USDC balance counts up to $1,350.00
//   92–140  the cursor clicks AI: the tab pill glides over and the AI page rises in
//   140–196 click the message box: the camera eases in, the prompt types itself, click send
//   196–290 the message flies up into a bubble, a typing indicator, a streamed reply and three low-risk asset cards
//   300–392 click Coca-Cola: its Markets page cascades in, the camera pushes in on the order panel, 375 is typed,
//           click Buy
//   392–470 the camera eases back to the whole window; a toast drops in, "Buying 4.00 KO", then "Bought"; the
//           balance settles to $975.00
(function () {
  const FPS = 30;
  const FRAMES = 471;

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
  const ZS = 2.6;
  const pullE = (f) => smoother((f - 30) / 42);
  let ASK_C = { x: 1090, y: 540 }; // measured once the fonts are in
  function pullCam(f) {
    const e = pullE(f), Z = Math.exp(lerp(Math.log(ZS), Math.log(ZF), e));
    const end = fromFocus(FULL.x, FULL.y, ZF), endA = { x: end.O.x + ZF * ACC.x, y: end.O.y + ZF * ACC.y };
    const S = { x: lerp(ASK_C.x, endA.x, e), y: lerp(ASK_C.y, endA.y, e) };
    return { Z, O: { x: S.x - Z * ACC.x, y: S.y - Z * ACC.y } };
  }
  // after the reveal: one keyframed path [frame, focus x, focus y, zoom], joined linearly and Gaussian-smoothed
  // (sigma 6 frames), so velocity and acceleration are continuous and moves never start or stop abruptly
  const CAMK = [
    [0, 960, 450, ZF], [128, 960, 450, ZF], [148, 960, 610, 1.1], [190, 960, 610, 1.1], [210, 960, 440, 1.0],
    [292, 960, 445, 1.0], [326, 1683, 470, 1.5], [394, 1683, 470, 1.5], [420, 960, 450, ZF], [520, 960, 450, ZF],
  ];
  const CAM = (() => {
    const STEP = 0.1, F0 = 60, F1 = 500, n = Math.round((F1 - F0) / STEP) + 1;
    const raw = (f, k) => {
      if (f <= CAMK[0][0]) return CAMK[0][k];
      for (let i = 1; i < CAMK.length; i++) if (f <= CAMK[i][0]) {
        const t = (f - CAMK[i - 1][0]) / (CAMK[i][0] - CAMK[i - 1][0]);
        return k === 3 ? Math.exp(lerp(Math.log(CAMK[i - 1][3]), Math.log(CAMK[i][3]), t)) : lerp(CAMK[i - 1][k], CAMK[i][k], t);
      }
      return CAMK[CAMK.length - 1][k];
    };
    const sig = 6, R = Math.round((3 * sig) / STEP), w = [];
    for (let j = -R; j <= R; j++) w.push(Math.exp(-0.5 * Math.pow((j * STEP) / sig, 2)));
    const ws = w.reduce((x, y) => x + y, 0);
    const X = new Float64Array(n), Y = new Float64Array(n), Zl = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0, z = 0;
      for (let j = -R; j <= R; j++) {
        const f = F0 + (i + j) * STEP, wj = w[j + R];
        x += wj * raw(f, 1); y += wj * raw(f, 2); z += wj * Math.log(raw(f, 3));
      }
      X[i] = x / ws; Y[i] = y / ws; Zl[i] = z / ws;
    }
    return (f) => {
      const u = clamp((f - F0) / STEP, 0, n - 1.001), i = Math.floor(u), t = u - i;
      return { x: lerp(X[i], X[i + 1], t), y: lerp(Y[i], Y[i + 1], t), z: Math.exp(lerp(Zl[i], Zl[i + 1], t)) };
    };
  })();
  function camera(f) {
    if (f < 72) return pullCam(f);
    const c = CAM(f);
    return fromFocus(c.x, c.y, c.z);
  }
  const project = (c, p) => ({ x: c.O.x + c.Z * p.x, y: c.O.y + c.Z * p.y });

  // ------------------------------------------------------------------ interaction script (window px)
  const TAP = { ai: 112, input: 146, send: 190, card: 300, amount: 342, buy: 388 };
  const TYPE0 = 152; // first prompt character, one a frame
  const DIGITS = [354, 362, 370]; // 3, 7, 5
  const BOUGHT = 420;
  const CARD_KO = { x: 980, y: DESK.CARD0 + 2 * DESK.CARD_PITCH + DESK.CARD_H / 2 };
  const CUR = (() => {
    const A = DESK.AI_TAB, S = DESK.SEND, M = DESK.AMOUNT, B = DESK.BUY;
    const keys = [
      [90, 760, 640], [96, 660, 380], [102, 580, 170], [107, 534, 64], [110.5, A.x, A.y], [116, A.x, A.y],
      [124, 590, 300], [132, 690, 640], [140, 760, 820], [144.5, 772, 845], [150, 772, 845],
      [160, 900, 870], [178, 1250, 872], [185, 1405, 852], [188.5, S.x, S.y], [194, S.x, S.y], [204, 1500, 700],
      [276, 1560, 760], [286, 1360, 650], [294, 1080, 612], [298.5, CARD_KO.x, CARD_KO.y], [304, CARD_KO.x, CARD_KO.y],
      [314, 1200, 560], [326, 1470, 470], [335, 1630, 436], [340.5, M.x, M.y], [374, M.x, M.y],
      [380, 1690, 490], [385, 1685, 570], [386.5, B.x, B.y], [392, B.x, B.y], [402, 1760, 690], [414, 1840, 820],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => ({ x: sx(f), y: sy(f) });
  })();
  const cursorOpacity = (f) =>
    smoother((f - 90) / 5) * (1 - smoother((f - 196) / 8)) + smoother((f - 276) / 5) * (1 - smoother((f - 398) / 12));
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
    stage.innerHTML = `<div id="reveal"><div id="cam"><div id="win"></div></div></div>
      <div id="pill"></div><div id="line"></div>
      <svg id="cursor" width="1920" height="1080" viewBox="0 0 1920 1080">
        <circle id="halo" r="0" fill="#7ee2a8"/><circle id="ring" r="0" fill="#7ee2a8"/>
        <path id="trail" fill="none" stroke="#3d9ef2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg><span id="meas"></span>`;
    const $ = (s) => stage.querySelector(s);
    const reveal = $("#reveal"), camEl = $("#cam"), ui = DESK.build($("#win"));
    const line = $("#line"), pill = $("#pill"), meas = $("#meas");
    const trail = $("#trail"), ring = $("#ring"), halo = $("#halo");
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
      const c = camera(f);
      camEl.style.transform = `translate(${c.O.x.toFixed(3)}px, ${c.O.y.toFixed(3)}px) scale(${c.Z.toFixed(5)})`;

      // ---------------- reveal: a feathered circle opens out of the Account button
      const winOn = f >= 33;
      reveal.style.display = winOn ? "block" : "none";
      if (winOn && f < 78) {
        const cp = project(c, ACC);
        const R = 40 * c.Z + 2600 * Math.pow(smoother((f - 33) / 40), 1.5);
        const F = 0.5 + 280 * smoother((f - 33) / 18);
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
      const toAI = smoother((f - TAP.ai) / 10), back = smoother((f - TAP.card - 2) / 10);
      const onAI = toAI * (1 - back);
      const tm = DESK.TAB.markets, ta = DESK.TAB.ai;
      ui.tabpill.style.left = lerp(tm.x, ta.x, onAI) + "px";
      ui.tabpill.style.width = lerp(tm.w, ta.w, onAI) + "px";
      ui.tabs.forEach((el) => { const on = el.dataset.k === "ai" ? onAI : 1 - onAI; el.style.color = mix("#6b6a66", INK, on); });
      if (!solW) solW = ui.solbal.firstElementChild.offsetWidth;
      ui.solbal.style.width = (solW * (1 - onAI)).toFixed(2) + "px";
      ui.solbal.style.opacity = (1 - onAI).toFixed(3);
      const bal = DESK.BALANCE * outCubic((f - 60) / 30) - 375 * outCubic((f - BOUGHT - 2) / 18);
      ui.usdv.textContent = money(bal);
      ui.account.style.opacity = smoother((f - 47) / 6).toFixed(3); // under the pill until it hands over

      // ---------------- pages
      const solOut = smoother((f - TAP.ai) / 9);
      ui.sol.style.display = f < TAP.ai + 10 ? "block" : "none";
      ui.solItems.forEach((el, i) => {
        const p = outCubic((f - 46 - i * 2) / 16);
        el.style.opacity = (p * (1 - solOut)).toFixed(4);
        el.style.transform = `translate(${(-16 * solOut).toFixed(2)}px, ${(18 * (1 - p)).toFixed(2)}px)`;
      });
      ui.solCnd.style.clipPath = `inset(0 ${(100 * (1 - outCubic((f - 56) / 28))).toFixed(2)}% 0 0)`;

      const aiIn = f >= TAP.ai + 2, aiOut = smoother((f - TAP.card - 1) / 10);
      ui.ai.style.display = aiIn && f < TAP.card + 12 ? "block" : "none";
      ui.ai.style.opacity = (smoother((f - TAP.ai - 2) / 8) * (1 - aiOut)).toFixed(4);
      if (aiIn) {
        const gone = smoother((f - TAP.send) / 10); // title + suggestions drift away after send
        ui.aiItems.forEach((el, j) => {
          const p = smoother((f - 118 - j * 2) / 14);
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
        ui.cards.forEach((el, j) => {
          const p = smoother((f - 258 - j * 4) / 17);
          const press = j === 2 ? bump(f, TAP.card - 1, 10) : 0;
          el.style.opacity = p.toFixed(4);
          el.style.transform = `translateY(${(20 * (1 - p)).toFixed(2)}px) scale(${((0.98 + 0.02 * p) * (1 - 0.012 * press)).toFixed(4)})`;
          el.style.background = mix("#ffffff", "#f3f2ee", press);
        });
        ui.amts.forEach((a, j) => { a.textContent = money(+a.dataset.v * outCubic((f - 262 - j * 4) / 16)); });
        ui.sparks.forEach((p, j) => { p.style.strokeDasharray = "1"; p.style.strokeDashoffset = (1 - outCubic((f - 264 - j * 4) / 18)).toFixed(4); });
        ui.hint.style.opacity = smoother((f - 278) / 10).toFixed(3);
      }

      // ---------------- Coca-Cola: its Markets page, the amount typed, Buy
      const koOn = f >= TAP.card + 1;
      ui.ko.style.display = koOn ? "block" : "none";
      if (koOn) {
        ui.koItems.forEach((el, i) => {
          const p = outCubic((f - TAP.card - 3 - i * 1.6) / 15);
          el.style.opacity = p.toFixed(4);
          el.style.transform = `translateY(${(18 * (1 - p)).toFixed(2)}px)`;
        });
        ui.koCnd.style.clipPath = `inset(0 ${(100 * (1 - outCubic((f - TAP.card - 10) / 26))).toFixed(2)}% 0 0)`;
        const foc = smoother((f - TAP.amount) / 5);
        ui.koAmtBox.style.boxShadow = `inset 0 0 0 ${(1.6 * foc).toFixed(2)}px #31302e`;
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
        ui.buy.style.background = mix("#c9d9cf", "#4f8c68", ready);
        ui.buy.style.boxShadow = `inset 0 0 0 60px rgba(0,0,0,${(0.1 * busy * (1 - done)).toFixed(3)})`;
        ui.buy.style.transform = `scale(${(1 - 0.02 * bump(f, TAP.buy - 1, 8)).toFixed(4)})`;
        ui.bb0.style.opacity = (1 - busy).toFixed(3);
        ui.bb1.style.opacity = (busy * (1 - done)).toFixed(3);
        ui.bb2.style.opacity = done.toFixed(3);
        ui.bbSpin.style.transform = `rotate(${((f - TAP.buy) * 22).toFixed(1)}deg)`;
        ui.bbSpin.style.transformOrigin = "50% 50%";
      }

      // ---------------- toast: drops in at the top of the window as the camera eases back, "Buying" -> "Bought"
      const tt = f - 400;
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

      // ---------------- cursor: brush-stroke comet + mint tap halo (as in the earlier clips)
      const co = cursorOpacity(f);
      const toScreen = (ff) => project(camera(ff), CUR(ff));
      if (co > 0.002) {
        const pts = [];
        for (let k = 0; k <= 12; k++) pts.push(toScreen(f - k * 0.26));
        trail.setAttribute("d", pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(2) + " " + p.y.toFixed(2)).join(" "));
        trail.setAttribute("stroke-width", (15 * c.Z).toFixed(2));
        trail.style.opacity = co.toFixed(3);
        const head = pts[0];
        ring.setAttribute("cx", head.x); ring.setAttribute("cy", head.y);
        ring.setAttribute("r", (pressed(f) * 19 * c.Z).toFixed(2));
        ring.style.opacity = (0.9 * co).toFixed(3);
      } else { trail.setAttribute("d", ""); ring.setAttribute("r", 0); }
      let hr = 0, hop = 0, hp = null;
      for (const k in TAP) {
        const d = f - TAP[k];
        if (d < -1 || d > 24) continue;
        hp = project(c, CUR(TAP[k]));
        hr = (22 + 62 * (1 - Math.exp(-Math.max(0, d) / 3.2))) * c.Z;
        hop = 0.34 * smoother((d + 1) / 2.5) * (1 - smoother(d / 20));
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
