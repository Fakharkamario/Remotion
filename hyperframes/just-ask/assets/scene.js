// "just ask" on the acend desktop app, in the same type and motion language as the earlier clips. 30 fps, 471 frames.
// Every element is a pure function of a continuous frame number so the 240 fps motion-blur render can sample
// between frames; discrete state (words, typed characters) uses whole frames.
//
//   0–30    "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white
//   30–72   the pill becomes the Account button while the camera pulls back and the Markets page is revealed around it
//   46–92   the page cascades in, the candles draw, the USDC balance counts up to $1,350.00
//   from 72 the edit cuts between shots, as in the motion reference: each one a slow continuous drift, close-ups on
//   the detail that matters, two floating the window in 3D on a deep backdrop
//   72–113  wide: the cursor (a soft mint dot) clicks AI, the tab pill glides over
//   113–140 close: the AI page rises in
//   140–197 macro on the message box, riding along as the prompt types; click send
//   197–297 the message flies up into a bubble, typing dots, a streamed reply, three cards with pastel washes
//   297–309 close: click Coca-Cola    309–337 3D: its Markets page cascades in
//   337–393 macro on the order panel: 375 is typed, the Buy button lights up, click
//   393–419 "Buying…" -> "Bought 4.00 KO"    419–470 3D wide: a toast drops in, the balance settles to $975.00
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
  // After the reveal the edit cuts between shots, as in the motion reference: every shot is one slow, continuous
  // drift (focus point + zoom, linear in time so the frame never parks), a few are close-ups on the detail that
  // matters, and two float the window in 3D on a deep backdrop. Cuts land on whole frames.
  const SHOTS = [
    { a: 72, b: 113, s: [960, 450, ZF], e: [925, 418, 1.0] },
    { a: 113, b: 140, s: [960, 452, 1.7], e: [960, 482, 1.86] },
    { a: 140, b: 197, caret: true },
    { a: 197, b: 297, s: [960, 322, 1.32], e: [960, 470, 1.25] },
    { a: 297, b: 309, s: [880, 600, 2.18], e: [935, 608, 2.32] },
    { a: 309, b: 337, s: [930, 470, 0.74], e: [985, 440, 0.81], tilt: [[16, -24], [7, -11]], dark: true },
    { a: 337, b: 393, s: [1650, 470, 2.42], e: [1712, 486, 2.6] },
    { a: 393, b: 419, s: [1683, 556, 1.82], e: [1683, 572, 1.98] },
    { a: 419, b: 471, s: [960, 470, 0.7], e: [960, 445, 0.79], tilt: [[10, 16], [4, 6]], dark: true },
  ];
  const shotAt = (fi) => { let k = -1; SHOTS.forEach((sh, i) => { if (fi >= sh.a) k = i; }); return k; };
  function camera(f, fi) {
    if (fi === undefined) fi = Math.round(f);
    if (fi < 72) return { ...pullCam(f), rx: 0, ry: 0, dark: false };
    const sh = SHOTS[shotAt(fi)];
    const u = clamp((f - sh.a) / (sh.b - sh.a), -0.02, 1.02);
    let x, y, z;
    if (sh.caret) {
      // the camera rides along the message box as the prompt types
      x = lerp(760, 1185, smoother((f - 148) / 44)); y = lerp(846, 838, u); z = Math.exp(lerp(Math.log(2.14), Math.log(2.3), u));
    } else {
      x = lerp(sh.s[0], sh.e[0], u); y = lerp(sh.s[1], sh.e[1], u); z = Math.exp(lerp(Math.log(sh.s[2]), Math.log(sh.e[2]), u));
    }
    const c = fromFocus(x, y, z);
    c.rx = sh.tilt ? lerp(sh.tilt[0][0], sh.tilt[1][0], smoother(u * 1.15)) : 0;
    c.ry = sh.tilt ? lerp(sh.tilt[0][1], sh.tilt[1][1], smoother(u * 1.15)) : 0;
    c.dark = !!sh.dark;
    return c;
  }
  const project = (c, p) => ({ x: c.O.x + c.Z * p.x, y: c.O.y + c.Z * p.y });

  // ------------------------------------------------------------------ interaction script (window px)
  const TAP = { ai: 108, input: 146, send: 190, card: 302, amount: 343, buy: 388 };
  const TYPE0 = 152; // first prompt character, one a frame
  const DIGITS = [354, 362, 370]; // 3, 7, 5
  const BOUGHT = 408;
  const KO_IN = 309; // the Coca-Cola page arrives on the cut
  const CARD_KO = { x: 980, y: DESK.CARD0 + 2 * DESK.CARD_PITCH + DESK.CARD_H / 2 };
  const CUR = (() => {
    const A = DESK.AI_TAB, S = DESK.SEND, M = DESK.AMOUNT, B = DESK.BUY;
    const keys = [
      [94, 860, 520], [99, 700, 300], [104, 570, 110], [107, A.x, A.y], [113, A.x + 10, A.y + 8],
      [140, 700, 980], [145, 772, 850], [148, 778, 848], [160, 820, 900], [178, 1240, 905], [186, 1410, 860], [189, S.x, S.y], [196, S.x + 14, S.y + 20],
      [296, 860, 700], [301, CARD_KO.x, CARD_KO.y], [308, CARD_KO.x + 12, CARD_KO.y + 6],
      [336, 1790, 560], [341.5, M.x + 20, M.y + 4], [343, M.x, M.y], [374, M.x + 6, M.y + 2],
      [381, 1700, 500], [386, B.x + 4, B.y], [388, B.x, B.y], [394, B.x + 10, B.y + 8],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => ({ x: sx(f), y: sy(f) });
  })();
  // the pointer only appears in the shots where it acts (it cuts with them)
  const CUR_ON = [[94, 113], [140, 197], [297, 309], [337, 393]];
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
      bg.className = c.dark ? "dark" : "";

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
      const toAI = smoother((f - TAP.ai) / 10), back = smoother((f - KO_IN + 3) / 8);
      const onAI = toAI * (1 - back);
      const tm = DESK.TAB.markets, ta = DESK.TAB.ai;
      ui.tabpill.style.left = lerp(tm.x, ta.x, onAI) + "px";
      ui.tabpill.style.width = lerp(tm.w, ta.w, onAI) + "px";
      ui.tabs.forEach((el) => { const on = el.dataset.k === "ai" ? onAI : 1 - onAI; el.style.color = mix("#6b6a66", INK, on); });
      if (!solW) solW = ui.solbal.firstElementChild.offsetWidth;
      ui.solbal.style.width = (solW * (1 - onAI)).toFixed(2) + "px";
      ui.solbal.style.opacity = (1 - onAI).toFixed(3);
      const bal = DESK.BALANCE * outCubic((f - 60) / 30) - 375 * outCubic((f - 432) / 18);
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

      const aiIn = f >= TAP.ai + 2;
      ui.ai.style.display = aiIn && fi < KO_IN ? "block" : "none";
      ui.ai.style.opacity = smoother((f - TAP.ai - 2) / 8).toFixed(4);
      if (aiIn) {
        const gone = smoother((f - TAP.send) / 10); // title + suggestions drift away after send
        ui.aiItems.forEach((el, j) => {
          const p = smoother((f - 110 - j * 2) / 14);
          el.style.opacity = (p * (1 - gone)).toFixed(4);
          el.style.transform = `translateY(${(18 * (1 - p) - 16 * gone).toFixed(2)}px)`;
        });
        const dIn = smoother((f - 116) / 14);
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
      ui.ko.style.display = koOn ? "block" : "none";
      if (koOn) {
        ui.koItems.forEach((el, i) => {
          const p = outCubic((f - KO_IN - i * 1.6) / 14);
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
      const tt = f - 424;
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
