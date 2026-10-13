// Part 4 — "你就按照这5点去筛选股票。对了，就拿住，而且是死拿，拿到基本面不行的、大家都在喊跌喊空了、没有更高的预期
// 空间的，再去把它卖掉。那错了的话呢，直接一刀砍掉，不要留恋，不要跟股票谈恋爱，直接去找下一档，周而复始。只要根据这
// 5点，你绝对可以买到一个飙股，大部分都是时间问题而已。" — 24.2 s, 30 fps (726 frames). Same system as parts 1–3.
//
//   0–82     wall: 你就按照, five chips 1–5 pop on 这5点 (part 3's list), huge 筛选股票 flashes in BEHIND him
//   83–147   chest: 对了 就拿住 而且是 / 死拿 (it grips: a squeeze as 拿 lands)
//   148–196  name-tag lower third (reference: "Piers F. / COMMERCIAL DIRECTOR"): ■ 基本面不行, rule, 卖出信号 01
//   197–247  dark grid, pink circle (reference: "with ↑ AI"): the arrow swings from up to DOWN on 喊跌; 大家都在 / 喊跌喊空
//   248–305  wall: thin 没有更高的, huge 预期空间 lands green behind his hair and washes to ink
//   306–340  chest: 再去把它 / 卖掉
//   341–417  chest: 那错了的话呢 -> 直接一刀 / 砍掉, then a red slash cuts the word and the halves slide apart
//   418–487  wall: 不要留恋 / 不要跟股票 / huge 谈恋爱 behind him; a gold hand-drawn heart draws round it
//            (reference: the gold script "2 years"), then a red scrawl crosses it out
//   488–525  dark: chart cards slide past, the pill 直接去找下一档; the next card lands centre-stage
//   526–548  dark: 周而复始 inside a dot ring and an arrow that keep coming round
//   549–589  wall: 只要根据, the five chips light up green one by one on 这5点
//   590–660  chest: 你 绝对可以 买到一个 / 飙股, the key word shooting up into place
//   661–725  dark: a clock face draws on, its hands sweep; 大部分都是 / 时间问题 / 而已 (reference: the clock)
//
// Word frames are ASR (SenseVoice) onsets checked against the voice's loudness envelope.
(function () {
  const FPS = 30;
  const FRAMES = 726;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const outBack = (t, k = 1.9) => (t <= 0 ? 0 : 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2));
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mix = (c0, c1, t) => c0.map((v, i) => Math.round(lerp(v, c1[i], t)));
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

  const WHITE = [255, 255, 255];
  const CREAM = [255, 244, 226];
  const INK = [22, 22, 22];
  const GREEN = [12, 216, 102];
  const PURPLE = [176, 72, 236];
  const GOLD = [247, 196, 72];
  const REDC = [255, 74, 74];
  const BG = [27, 27, 27];
  const RED = "#e5252a";

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
  const chars = (parent, text, cls) => [...text].map((c) => el("span", "ch" + (cls ? " " + cls : ""), parent, c));
  const words = (parent, list) => list.map((w) => el("span", "ch", parent, w));
  const place = (e, x, y, extra) => (e.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)${extra || ""}`);
  // characters toggle visibility (they keep their layout); containers toggle display
  const show = (e, on) => (e.style.visibility = on ? "visible" : "hidden");
  const disp = (e, on, kind) => (e.style.display = on ? kind || "block" : "none");

  function flashColor(f, at, settled) {
    if (f < at + 1) return PURPLE;
    if (f < at + 3) return GOLD;
    return mix(GOLD, settled, outCubic(prog(f, at + 3, at + 7)));
  }
  const writeColor = (f, at, settled, hold = 2, wash = 7) => mix(GREEN, settled, inOut(prog(f, at + hold, at + hold + wash)));
  function writeOn(cs, ats, f, fi, settled, hold, wash) {
    cs.forEach((c, i) => {
      show(c, fi >= ats[i]);
      c.style.color = rgb(writeColor(f, ats[i], Array.isArray(settled[0]) ? settled[i] : settled, hold, wash));
    });
  }
  function heroIn(e, f, at, settled, x, y, sx, extra) {
    const hp = outExpo(prog(f, at, at + 6));
    disp(e, f >= at);
    e.style.color = rgb(flashColor(f, at, settled));
    e.style.filter = hp < 1 ? `blur(${(9 * (1 - hp)).toFixed(2)}px)` : "none";
    place(e, x, y + 60 * (1 - hp), ` scaleX(${(sx === undefined ? 0.8 : sx).toFixed(4)})${extra || ""}`);
    return hp;
  }
  const popWords = (ws, ats, fi) => ws.forEach((w, i) => show(w, fi >= ats[i]));

  // Camera: each A-roll beat lands with a small punch and keeps pushing.
  const LEFT = [[1004, 502, 1.1], [990, 492, 1.16]];
  const CHEST_A = [[880, 520, 1.08], [880, 516, 1.14]];
  const CHEST_B = [[820, 520, 1.3], [820, 516, 1.25]];
  const SHOTS = [
    [0, 82, ...LEFT], [83, 147, ...CHEST_A], [148, 196, [900, 540, 1.04], [900, 530, 1.09]], [248, 305, ...LEFT],
    [306, 340, ...CHEST_B], [341, 417, ...CHEST_A], [418, 487, ...LEFT], [549, 589, ...LEFT], [590, 660, ...CHEST_B],
  ];
  function cam(f) {
    let sh = null;
    for (const s of SHOTS) if (f >= s[0] && f <= s[1] + 0.999) sh = s;
    if (!sh) return null;
    const p = prog(f, sh[0], sh[1] + 1);
    const k = { cx: lerp(sh[2][0], sh[3][0], p), cy: lerp(sh[2][1], sh[3][1], p), s: lerp(sh[2][2], sh[3][2], p) };
    k.s *= 1 + 0.035 * (1 - outCubic(prog(f, sh[0], sh[0] + 8)));
    const hw = 960 / k.s, hh = 540 / k.s;
    return { s: k.s, cx: clamp(k.cx, hw, 1920 - hw), cy: clamp(k.cy, hh, 1080 - hh) };
  }
  const camCss = (k) => `translate(${(960 - k.cx * k.s).toFixed(2)}px, ${(540 - k.cy * k.s).toFixed(2)}px) scale(${k.s.toFixed(4)})`;

  const SCENES = [
    ["S1", 0, 82], ["S2", 83, 147], ["S3", 148, 196], ["S4", 197, 247], ["S5", 248, 305], ["S6", 306, 340], ["S7", 341, 417],
    ["S8", 418, 487], ["S9", 488, 525], ["S10", 526, 548], ["S11", 549, 589], ["S12", 590, 660], ["S13", 661, 725],
  ];

  const SCENE = {};
  SCENE.mount = function (L) {
    const S = {};
    SCENES.forEach(([id]) => (S[id] = { behind: el("div", "scene", L.behind), front: el("div", "scene", L.front), top: el("div", "scene", L.stage) }));
    const smear = document.getElementById("smearBlur");

    const cutImgs = {};
    (window.CUTOUTS || []).forEach((n) => {
      const img = el("img", "", L.cut);
      img.src = `assets/cut/c${String(n).padStart(4, "0")}.webp`;
      cutImgs[n] = img;
    });
    let shownCut = null;

    const inkCap = (parent, size) => {
      const e = el("div", "abs cap", parent);
      e.style.color = rgb(INK); e.style.textShadow = "none"; e.style.fontSize = size + "px";
      return e;
    };
    const thinInk = (parent, size, text, spacing) => {
      const e = el("div", "abs thin", parent);
      e.style.fontSize = size + "px"; e.style.color = rgb(INK); e.style.fontWeight = "400"; e.style.letterSpacing = (spacing || 0.18) + "em";
      return { e, cs: chars(e, text) };
    };
    const capLine = (parent, size, list) => {
      const e = el("div", "abs cap", parent);
      e.style.fontSize = size + "px";
      return { e, ws: words(e, list) };
    };
    const darkBg = (parent, color) => {
      const b = el("div", "abs", parent);
      b.style.width = "1920px"; b.style.height = "1080px"; b.style.background = color;
      return b;
    };
    // the five chips: rounded white cells with their numbers (part 3's list)
    const mkChips = (parent) => [1, 2, 3, 4, 5].map((n) => {
      const c = el("div", "cell", parent);
      c.style.width = c.style.height = "96px"; c.style.borderRadius = "16px";
      c.style.display = "flex"; c.style.alignItems = "center"; c.style.justifyContent = "center";
      c.style.fontWeight = "800"; c.style.fontSize = "58px"; c.style.color = rgb(INK); c.style.lineHeight = "1";
      c.textContent = String(n);
      return c;
    });
    const CHIP_X = 1070, CHIP_Y = 196, CHIP_STEP = 116;

    // ============================================================ S1
    const s1Wrap = el("div", "abs", S.S1.behind);
    const s1L1 = inkCap(s1Wrap, 66), s1L1W = words(s1L1, ["你就", "按照"]);
    const s1Chips = mkChips(s1Wrap);
    const S1_CHIPS = [34, 36, 38, 40, 42];
    const s1Hero = el("div", "abs hero ink", s1Wrap, "筛选股票");
    s1Hero.style.fontSize = "272px";

    // ============================================================ S2
    const s2Wrap = el("div", "abs", S.S2.front);
    const s2L = capLine(s2Wrap, 64, ["对了 ", "就拿住 ", "而且是"]);
    const s2Hero = el("div", "abs hero light", s2Wrap, "死拿");
    s2Hero.style.fontSize = "280px";

    // ============================================================ S3: lower third
    const s3Wrap = el("div", "abs", S.S3.front);
    s3Wrap.style.textShadow = "0 3px 16px rgba(0,0,0,.45)";
    const s3Pre = el("div", "abs thin", s3Wrap);
    s3Pre.style.fontSize = "46px"; s3Pre.style.color = rgb(WHITE); s3Pre.style.fontWeight = "400"; s3Pre.style.letterSpacing = "0.2em";
    const s3PreC = chars(s3Pre, "拿到");
    const s3Bullet = el("div", "abs");
    s3Wrap.appendChild(s3Bullet);
    s3Bullet.style.width = s3Bullet.style.height = "22px"; s3Bullet.style.background = rgb(WHITE);
    const s3Title = el("div", "abs", s3Wrap);
    s3Title.style.fontWeight = "500"; s3Title.style.fontSize = "84px"; s3Title.style.lineHeight = "1"; s3Title.style.color = rgb(WHITE);
    s3Title.style.whiteSpace = "nowrap";
    const s3TitleC = chars(s3Title, "基本面不行");
    const s3Rule = el("div", "abs", s3Wrap);
    s3Rule.style.height = "2px"; s3Rule.style.background = "rgba(255,255,255,.75)"; s3Rule.style.transformOrigin = "0 50%";
    const s3Sub = el("div", "abs", s3Wrap);
    s3Sub.style.fontFamily = "ui-monospace, 'JetBrains Mono', monospace"; s3Sub.style.fontWeight = "500"; s3Sub.style.fontSize = "34px";
    s3Sub.style.letterSpacing = "0.32em"; s3Sub.style.color = rgb(WHITE); s3Sub.style.lineHeight = "1"; s3Sub.style.whiteSpace = "nowrap";
    const s3SubC = chars(s3Sub, "卖出信号 01");

    // ============================================================ S4: dark grid, pink circle, arrow
    darkBg(S.S4.top, "#0b0b0d");
    const s4World = el("div", "abs", S.S4.top);
    s4World.style.width = "1920px"; s4World.style.height = "1080px"; s4World.style.transformOrigin = "960px 540px";
    s4World.insertAdjacentHTML("beforeend",
      `<svg class="abs" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-dasharray="6 9">` +
      [480, 960, 1440].map((x) => `<line x1="${x}" x2="${x}" y1="0" y2="1080"/>`).join("") +
      [270, 540, 810].map((y) => `<line x1="0" x2="1920" y1="${y}" y2="${y}"/>`).join("") + `</svg>`);
    const r4 = rng(21);
    const PIX = ["#f2ead8", "#f2ead8", "#f2ead8", "#f0a030", "#e0402a", "#3a5be0"];
    const s4Pix = Array.from({ length: 90 }, () => {
      const a = r4() * Math.PI * 2, r = 150 + Math.pow(r4(), 0.7) * 230;
      const e = el("div", "abs", s4World);
      const sz = 10 + Math.round(r4() * 4) * 6;
      e.style.width = e.style.height = sz + "px"; e.style.background = PIX[Math.floor(r4() * PIX.length)];
      return { e, a, r, sz, at: 199 + r4() * 14, j: r4() * 100 };
    });
    const s4Circle = el("div", "abs", s4World);
    s4Circle.style.width = s4Circle.style.height = "250px"; s4Circle.style.borderRadius = "50%"; s4Circle.style.background = "#f6d3df";
    s4Circle.innerHTML = `<svg width="250" height="250" viewBox="-125 -125 250 250"><g id="arr" stroke="#111" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
      `<line x1="0" y1="62" x2="0" y2="-62"/><polyline points="-40,-22 0,-62 40,-22"/></g></svg>`;
    const s4Arrow = s4Circle.querySelector("#arr");
    // up while the line builds, then a hard swing to down on 跌 with an overshoot
    const s4Angle = spline([[197, 90], [204, 10], [209, 0], [221, 0], [223.5, 196], [226, 174], [229, 182], [232, 180], [248, 180]]);
    const s4Left = el("div", "abs grot", s4World);
    s4Left.style.fontSize = "104px"; s4Left.style.textAlign = "right";
    const s4LeftC = chars(s4Left, "大家都在");
    const s4Right = el("div", "abs grot", s4World);
    s4Right.style.fontSize = "104px";
    const s4RightC = chars(s4Right, "喊跌喊空");
    const S4_L = [200, 204, 207, 213], S4_R = [216, 222, 231, 238];

    // ============================================================ S5
    const s5Thin = thinInk(S.S5.behind, 58, "没有更高的");
    const S5_THIN = [259, 263, 268, 274, 281];
    const s5Hero = el("div", "abs grot", S.S5.behind);
    s5Hero.style.fontSize = "222px";
    const s5HeroC = chars(s5Hero, "预期空间");
    const S5_AT = [285, 290, 295, 299];

    // ============================================================ S6
    const s6Wrap = el("div", "abs", S.S6.front);
    const s6L = capLine(s6Wrap, 64, ["再去", "把它"]);
    const s6Hero = el("div", "abs hero light", s6Wrap, "卖掉");
    s6Hero.style.fontSize = "250px";

    // ============================================================ S7: 砍掉, slashed
    const s7Wrap = el("div", "abs", S.S7.front);
    const s7La = capLine(s7Wrap, 64, ["那", "错了的话呢"]);
    const s7Lb = capLine(s7Wrap, 64, ["直接", "一刀"]);
    const s7HeroBox = el("div", "abs", s7Wrap);
    const s7Top = el("div", "abs hero light", s7HeroBox, "砍掉");
    const s7Bot = el("div", "abs hero light", s7HeroBox, "砍掉");
    [s7Top, s7Bot].forEach((h) => (h.style.fontSize = "270px"));
    s7Top.style.clipPath = "polygon(-10% -10%, 110% -10%, 110% 30%, -10% 66%)";
    s7Bot.style.clipPath = "polygon(-10% 66%, 110% 30%, 110% 110%, -10% 110%)";
    const s7Slash = el("div", "abs");
    s7HeroBox.appendChild(s7Slash);
    s7Slash.style.height = "14px"; s7Slash.style.background = RED; s7Slash.style.transformOrigin = "0 50%"; s7Slash.style.borderRadius = "7px";
    s7Slash.style.boxShadow = "0 0 24px rgba(229,37,42,.7)";

    // ============================================================ S8: 谈恋爱, the heart, the scrawl
    const s8Thin1 = thinInk(S.S8.behind, 58, "不要留恋");
    const s8Thin2 = thinInk(S.S8.behind, 58, "不要跟股票");
    const S8_T1 = [418, 423, 429, 432], S8_T2 = [441, 445, 448, 454, 459];
    const s8Hero = el("div", "abs grot", S.S8.behind);
    s8Hero.style.fontSize = "262px";
    const s8HeroC = chars(s8Hero, "谈恋爱");
    const S8_AT = [465, 468, 472];
    S.S8.behind.insertAdjacentHTML("beforeend",
      `<svg class="abs" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      `<path id="heart" d="M 1395 640 C 1250 560 990 470 1000 330 C 1010 190 1200 160 1300 270 C 1340 220 1400 180 1480 175 ` +
      `C 1640 165 1790 250 1800 360 C 1815 480 1610 560 1395 650 C 1380 655 1372 652 1366 646" stroke="#e3a21e" stroke-width="9"/>` +
      `<path id="scrawl" d="M 990 520 C 1150 470 1250 400 1380 380 C 1500 362 1620 330 1830 230" stroke="${RED}" stroke-width="16"/></svg>`);
    const s8Heart = S.S8.behind.querySelector("#heart"), s8Scrawl = S.S8.behind.querySelector("#scrawl");
    let heartLen = null, scrawlLen = null;

    // ============================================================ S9: cards carousel, pill
    darkBg(S.S9.top, rgb(BG));
    const s9World = el("div", "abs", S.S9.top);
    s9World.style.width = "1920px"; s9World.style.height = "1080px";
    const CARD_W = 560, CARD_H = 340;
    const cardSvg = (seed, up) => {
      const r = rng(seed);
      let pts = [], v = 0.5;
      for (let i = 0; i <= 14; i++) { v = clamp(v + (r() - (up ? 0.38 : 0.6)) * 0.22, 0.08, 0.92); pts.push([30 + i * 35, 300 - v * 240]); }
      const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      return `<svg width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">` +
        `<defs><linearGradient id="cg${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f6584"/><stop offset=".6" stop-color="#b89fa8"/><stop offset="1" stop-color="#d9b48f"/></linearGradient></defs>` +
        `<rect width="${CARD_W}" height="${CARD_H}" fill="url(#cg${seed})"/>` +
        `<path d="${d}" fill="none" stroke="${up ? "#0e7a3e" : "#5a2430"}" stroke-width="7" stroke-linejoin="round"/></svg>`;
    };
    const s9Cards = [0, 1, 2, 3, 4].map((i) => {
      const c = el("div", "card2", s9World);
      c.style.width = CARD_W + "px"; c.style.height = CARD_H + "px"; c.style.borderRadius = "14px";
      c.innerHTML = cardSvg(31 + i * 7, i >= 3);
      return c;
    });
    // which card is centre-stage: card 1, then 2 on 下, then 3 (the good one) on 档
    const s9Pos = spline([[488, 0.6], [492, 1], [508, 1], [512, 2], [515, 2], [519, 3], [526, 3.15]]);
    const s9Pill = el("div", "pill", s9World);
    const s9PillT = el("div", "txt", s9Pill);
    s9PillT.style.fontSize = "70px";
    const s9PillC = chars(s9PillT, "直接去找下一档");
    const S9_AT = [490, 495, 501, 504, 510, 513, 517];
    const s9PillW = spline([[488, 8], [490, 70], ...S9_AT.map((a, i) => [a + 2, 76 + 70 * 0.98 * (i + 1)])]);

    // ============================================================ S10: 周而复始 in a turning ring
    darkBg(S.S10.top, rgb(BG));
    const s10World = el("div", "abs", S.S10.top);
    s10World.style.width = "1920px"; s10World.style.height = "1080px"; s10World.style.transformOrigin = "960px 540px";
    const r10 = rng(5);
    const s10Dots = Array.from({ length: 120 }, (_, i) => {
      const e = el("div", "pdot", s10World);
      const sz = 4 + Math.round(r10() * 6);
      e.style.width = e.style.height = sz + "px";
      return { e, sz, a: (i / 120) * Math.PI * 2 + r10() * 0.05, r: 330 + (i % 3) * 26 + (r10() - 0.5) * 18, o: 0.35 + r10() * 0.55 };
    });
    s10World.insertAdjacentHTML("beforeend",
      `<svg class="abs" width="1920" height="1080" viewBox="0 0 1920 1080"><g id="s10arc" fill="none" stroke="${rgb(GREEN)}" stroke-width="6" stroke-linecap="round">` +
      `<path d="M 960 140 A 400 400 0 0 1 1307 340"/><polyline points="1272,318 1307,340 1312,298" stroke-linejoin="round"/></g></svg>`);
    const s10Arc = s10World.querySelector("#s10arc");
    const s10Word = el("div", "abs grot", s10World);
    s10Word.style.fontSize = "178px"; s10Word.style.fontWeight = "700";
    const s10WordC = chars(s10Word, "周而复始");
    const S10_AT = [529, 533, 540, 544];

    // ============================================================ S11: chips light up
    const s11Wrap = el("div", "abs", S.S11.front);
    const s11L1 = inkCap(s11Wrap, 66), s11L1W = words(s11L1, ["只要", "根据"]);
    const s11Chips = mkChips(s11Wrap);
    const S11_LIT = [573, 576, 579, 582, 585];
    const s11Tail = inkCap(s11Wrap, 66), s11TailW = words(s11Tail, ["这5点"]);

    // ============================================================ S12: 飙股 shoots up
    const s12Wrap = el("div", "abs", S.S12.front);
    const s12L = capLine(s12Wrap, 64, ["你", "绝对可以", "买到一个"]);
    const s12Hero = el("div", "abs hero light", s12Wrap, "飙股");
    s12Hero.style.fontSize = "262px";

    // ============================================================ S13: the clock
    darkBg(S.S13.top, "#101010");
    const s13World = el("div", "abs", S.S13.top);
    s13World.style.width = "1920px"; s13World.style.height = "1080px"; s13World.style.transformOrigin = "960px 470px";
    const CKX = 960, CKY = 440, CKR = 250;
    let ticks = "";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0, r0 = CKR - (big ? 34 : 16);
      ticks += `<line class="tk" x1="${(CKX + Math.sin(a) * r0).toFixed(1)}" y1="${(CKY - Math.cos(a) * r0).toFixed(1)}" x2="${(CKX + Math.sin(a) * (CKR - 4)).toFixed(1)}" y2="${(CKY - Math.cos(a) * (CKR - 4)).toFixed(1)}" stroke="#f2f2f2" stroke-width="${big ? 7 : 3}" stroke-linecap="round"/>`;
    }
    s13World.insertAdjacentHTML("beforeend",
      `<svg class="abs" width="1920" height="1080" viewBox="0 0 1920 1080">` +
      `<circle id="ckRing" cx="${CKX}" cy="${CKY}" r="${CKR + 14}" fill="none" stroke="#f2f2f2" stroke-width="5"/>` + ticks +
      `<g id="ckGhost" opacity=".25"><line id="ckMinG" x1="${CKX}" y1="${CKY}" x2="${CKX}" y2="${CKY - CKR + 50}" stroke="#f2f2f2" stroke-width="8" stroke-linecap="round"/></g>` +
      `<line id="ckHour" x1="${CKX}" y1="${CKY}" x2="${CKX}" y2="${CKY - CKR + 110}" stroke="#f2f2f2" stroke-width="14" stroke-linecap="round"/>` +
      `<line id="ckMin" x1="${CKX}" y1="${CKY}" x2="${CKX}" y2="${CKY - CKR + 50}" stroke="#f2f2f2" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="${CKX}" cy="${CKY}" r="14" fill="${rgb(GREEN)}"/></svg>`);
    const ckRing = s13World.querySelector("#ckRing"), ckTicks = [...s13World.querySelectorAll(".tk")];
    const ckHour = s13World.querySelector("#ckHour"), ckMin = s13World.querySelector("#ckMin"), ckMinG = s13World.querySelector("#ckMinG");
    // the minute hand races, then slows as the line ends
    const ckMinA = spline([[661, 0], [675, 900], [700, 1800], [718, 2120], [725, 2160]]);
    const s13Pre = el("div", "abs thin", s13World);
    s13Pre.style.fontSize = "56px"; s13Pre.style.color = rgb(WHITE); s13Pre.style.fontWeight = "300"; s13Pre.style.letterSpacing = "0.3em";
    const s13PreC = chars(s13Pre, "大部分都是");
    const S13_PRE = [663, 668, 673, 681, 688];
    const s13Big = el("div", "abs grot", s13World);
    s13Big.style.fontSize = "150px"; s13Big.style.fontWeight = "700";
    const s13BigC = chars(s13Big, "时间问题");
    const S13_BIG = [693, 699, 706, 709];
    const s13Tail = el("div", "abs thin", s13World);
    s13Tail.style.fontSize = "56px"; s13Tail.style.color = rgb(WHITE); s13Tail.style.fontWeight = "300"; s13Tail.style.letterSpacing = "0.3em";
    const s13TailC = chars(s13Tail, "而已");
    const S13_TAIL = [715, 720];

    // ============================================================ render
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);

      SCENES.forEach(([id, a, b]) => {
        const on = fi >= a && fi <= b ? "block" : "none";
        S[id].behind.style.display = S[id].front.style.display = S[id].top.style.display = on;
      });
      const k = cam(f);
      if (k) L.cam.style.transform = L.cut.style.transform = camCss(k);
      const cutNow = cutImgs[fi] ? fi : null;
      if (cutNow !== shownCut) {
        if (shownCut !== null) cutImgs[shownCut].style.display = "none";
        if (cutNow !== null) cutImgs[cutNow].style.display = "block";
        shownCut = cutNow;
      }
      L.wash.style.opacity = 0;
      smear.setAttribute("stdDeviation", "0 0");

      // ---------------------------------------------------------- S1
      if (fi <= 82) {
        const p = prog(f, 0, 83);
        s1Wrap.style.transformOrigin = "1400px 330px";
        s1Wrap.style.transform = `translateY(${lerp(6, -12, p).toFixed(2)}px) scale(${lerp(1.03, 1.0, p).toFixed(4)})`;
        place(s1L1, CHIP_X, 86);
        popWords(s1L1W, [9, 18], fi);
        s1Chips.forEach((c, i) => {
          const q = prog(f, S1_CHIPS[i], S1_CHIPS[i] + 6);
          disp(c, q > 0, "flex");
          place(c, CHIP_X + i * CHIP_STEP, CHIP_Y, ` scale(${outBack(q, 2.4).toFixed(4)})`);
        });
        heroIn(s1Hero, f, 52, INK, 1000, 324);
      }

      // ---------------------------------------------------------- S2
      if (fi >= 83 && fi <= 147) {
        const p = prog(f, 83, 148);
        s2Wrap.style.transformOrigin = "900px 860px";
        s2Wrap.style.transform = `translateY(${lerp(0, -14, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        place(s2L.e, 900 - (8 * 64) / 2, 736);
        popWords(s2L.ws, [85, 101, 123], fi);
        const hw = 280 * 2 * 0.8;
        // 死拿: it lands, then grips — a hard squeeze as the second 拿 is said, and it holds
        const grip = Math.sin(Math.PI * prog(f, 144, 150)) * 0.09;
        heroIn(s2Hero, f, 137, CREAM, 900 - hw / 2, 806, 0.8 - grip, ` scaleY(${(1 + grip * 0.6).toFixed(4)})`);
        s2Hero.style.transformOrigin = "50% 70%";
      }

      // ---------------------------------------------------------- S3
      if (fi >= 148 && fi <= 196) {
        const X = 150, Y = 770;
        place(s3Pre, X + 46, Y - 74);
        writeOn(s3PreC, [155, 160], f, fi, WHITE);
        const bq = outBack(prog(f, 166, 171), 2.4);
        disp(s3Bullet, f >= 166);
        place(s3Bullet, X, Y + 30, ` scale(${bq.toFixed(4)})`);
        place(s3Title, X + 46, Y);
        writeOn(s3TitleC, [169, 173, 177, 184, 187], f, fi, WHITE, 2, 7);
        s3Rule.style.width = "470px";
        place(s3Rule, X, Y + 108, ` scaleX(${outExpo(prog(f, 172, 186)).toFixed(4)})`);
        place(s3Sub, X, Y + 132);
        s3SubC.forEach((c, i) => show(c, fi >= 176 + i * 2));
        s3Wrap.style.transform = `translateX(${lerp(0, -8, prog(f, 148, 197)).toFixed(2)}px)`;
      }

      // ---------------------------------------------------------- S4
      if (fi >= 197 && fi <= 247) {
        const p = prog(f, 197, 248);
        s4World.style.transform = `scale(${lerp(1.0, 1.07, p).toFixed(4)})`;
        const cq = outBack(prog(f, 197, 204), 2.0);
        place(s4Circle, 960 - 125, 540 - 125, ` scale(${cq.toFixed(4)})`);
        s4Arrow.setAttribute("transform", `rotate(${s4Angle(f).toFixed(2)})`);
        // pixels flicker in around the circle, jittering on twos, bursting outward on 跌
        const burst = outExpo(prog(f, 222, 232)) * 70;
        const step = Math.floor(f / 2);
        s4Pix.forEach((q) => {
          const on = f >= q.at;
          disp(q.e, on);
          if (!on) return;
          const jx = (((step * 13 + q.j * 7) % 9) - 4) * 2, jy = (((step * 7 + q.j * 11) % 9) - 4) * 2;
          const r = q.r + burst * (q.r / 380);
          place(q.e, 960 + Math.cos(q.a) * r - q.sz / 2 + jx, 540 + Math.sin(q.a) * r - q.sz / 2 + jy);
        });
        const lw = 4 * 104 * 0.955;
        place(s4Left, 960 - 170 - lw, 540 - 58);
        writeOn(s4LeftC, S4_L, f, fi, WHITE);
        place(s4Right, 960 + 170, 540 - 58);
        writeOn(s4RightC, S4_R, f, fi, [WHITE, REDC, WHITE, REDC]);
      }

      // ---------------------------------------------------------- S5
      if (fi >= 248 && fi <= 305) {
        place(s5Thin.e, 1090, 150);
        writeOn(s5Thin.cs, S5_THIN, f, fi, INK);
        const p = prog(f, 283, 306);
        s5Hero.style.transformOrigin = "0 0";
        place(s5Hero, 1000 - 26 * p, 236, ` scale(${lerp(1.04, 0.97, p).toFixed(4)})`);
        writeOn(s5HeroC, S5_AT, f, fi, INK, 3, 6);
      }

      // ---------------------------------------------------------- S6
      if (fi >= 306 && fi <= 340) {
        const p = prog(f, 306, 341);
        s6Wrap.style.transformOrigin = "850px 860px";
        s6Wrap.style.transform = `translateY(${lerp(0, -12, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        place(s6L.e, 850 - (4 * 64) / 2, 766);
        popWords(s6L.ws, [310, 317], fi);
        const hw = 250 * 2 * 0.8;
        heroIn(s6Hero, f, 326, CREAM, 850 - hw / 2, 832);
      }

      // ---------------------------------------------------------- S7
      if (fi >= 341 && fi <= 417) {
        const p = prog(f, 341, 418);
        s7Wrap.style.transformOrigin = "900px 860px";
        s7Wrap.style.transform = `translateY(${lerp(0, -14, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        // the small line swaps, as the reference's third line does
        const b = fi >= 384;
        disp(s7La.e, !b); disp(s7Lb.e, b);
        place(s7La.e, 900 - (6 * 64) / 2, 736);
        popWords(s7La.ws, [344, 353], fi);
        place(s7Lb.e, 900 - (4 * 64) / 2, 736);
        popWords(s7Lb.ws, [384, 394], fi);
        const hw = 270 * 2 * 0.8, hh = 270 * 0.9;
        place(s7HeroBox, 900 - hw / 2, 0);
        heroIn(s7Top, f, 405, CREAM, 0, 806);
        heroIn(s7Bot, f, 405, CREAM, 0, 806);
        // the slash, then the halves slide apart along the cut
        const sl = outExpo(prog(f, 409, 412));
        const gone = prog(f, 414, 418);
        disp(s7Slash, sl > 0 && gone < 1);
        const ang = Math.atan2(-0.36 * hh, hw) * 180 / Math.PI;
        s7Slash.style.width = hw * 1.45 + "px";
        s7Slash.style.opacity = (1 - gone).toFixed(3);
        place(s7Slash, -hw * 0.2, 806 + 0.72 * hh, ` rotate(${ang.toFixed(2)}deg) scaleX(${sl.toFixed(4)})`);
        const sp = outExpo(prog(f, 411, 418));
        if (f >= 411) {
          heroIn(s7Top, f, 405, CREAM, 26 * sp, 806 - 14 * sp);
          heroIn(s7Bot, f, 405, CREAM, -26 * sp, 806 + 14 * sp);
        }
      }

      // ---------------------------------------------------------- S8
      if (fi >= 418 && fi <= 487) {
        place(s8Thin1.e, 1090, 92);
        writeOn(s8Thin1.cs, S8_T1, f, fi, INK);
        place(s8Thin2.e, 1090, 172);
        writeOn(s8Thin2.cs, S8_T2, f, fi, INK);
        const p = prog(f, 463, 488);
        s8Hero.style.transformOrigin = "0 0";
        place(s8Hero, 1010 - 20 * p, 282, ` scale(${lerp(1.04, 0.98, p).toFixed(4)})`);
        writeOn(s8HeroC, S8_AT, f, fi, INK, 3, 6);
        if (heartLen === null && s8Heart.getTotalLength) { heartLen = s8Heart.getTotalLength(); scrawlLen = s8Scrawl.getTotalLength(); }
        const hl = heartLen || 2000, sl = scrawlLen || 1000;
        s8Heart.style.strokeDasharray = `${hl}`;
        s8Heart.style.strokeDashoffset = (hl * (1 - inOut(prog(f, 470, 482)))).toFixed(1);
        s8Scrawl.style.strokeDasharray = `${sl}`;
        s8Scrawl.style.strokeDashoffset = (sl * (1 - outCubic(prog(f, 481, 486)))).toFixed(1);
        // round caps would show a dot before a stroke starts drawing
        s8Heart.style.opacity = f >= 470 ? 1 : 0;
        s8Scrawl.style.opacity = f >= 481 ? 1 : 0;
      }

      // ---------------------------------------------------------- S9
      if (fi >= 488 && fi <= 525) {
        const pos = s9Pos(f);
        s9Cards.forEach((c, i) => {
          const d = i - pos;
          const sc = lerp(1, 0.72, Math.min(1, Math.abs(d)));
          const x = 960 + d * 600 - CARD_W / 2, y = 600 - CARD_H / 2;
          place(c, x, y, ` scale(${sc.toFixed(4)})`);
          c.style.opacity = lerp(1, 0.35, Math.min(1, Math.abs(d))).toFixed(3);
          const good = i === 3 ? outExpo(prog(f, 518, 524)) : 0;
          c.style.boxShadow = good > 0 ? `0 0 0 ${(5 * good).toFixed(1)}px ${rgb(GREEN)}, 0 0 ${(40 * good).toFixed(1)}px rgba(12,216,102,.5)` : "0 20px 50px rgba(0,0,0,.5)";
        });
        const n = S9_AT.filter((a) => fi >= a).length;
        const pw = s9PillW(f);
        s9Pill.style.width = pw + "px"; s9Pill.style.height = "108px";
        place(s9Pill, 960 - pw / 2, 230);
        s9PillC.forEach((c, i) => show(c, i < n));
        s9PillT.style.transform = `translate(${(-(n * 70 * 0.98) / 2).toFixed(1)}px, -54%)`;
      }

      // ---------------------------------------------------------- S10
      if (fi >= 526 && fi <= 548) {
        const p = prog(f, 526, 549);
        s10World.style.transform = `scale(${lerp(1.06, 1.0, outCubic(p)).toFixed(4)})`;
        const spin = (f - 526) * 0.07;
        s10Dots.forEach((d) => {
          const a = d.a + spin;
          d.e.style.opacity = (d.o * Math.min(1, (f - 525) / 3)).toFixed(3);
          place(d.e, 960 + Math.cos(a) * d.r - d.sz / 2, 540 + Math.sin(a) * d.r - d.sz / 2);
        });
        s10Arc.setAttribute("transform", `rotate(${((f - 526) * 9).toFixed(1)} 960 540)`);
        const ww = 4 * 178 * 0.955;
        place(s10Word, 960 - ww / 2, 540 - 98);
        writeOn(s10WordC, S10_AT, f, fi, WHITE, 2, 6);
      }

      // ---------------------------------------------------------- S11
      if (fi >= 549 && fi <= 589) {
        place(s11L1, CHIP_X, 86);
        popWords(s11L1W, [555, 564], fi);
        s11Chips.forEach((c, i) => {
          const q = outBack(prog(f, 549 + i, 555 + i), 2.4);
          const lit = prog(f, S11_LIT[i], S11_LIT[i] + 3);
          const pulse = Math.sin(Math.PI * prog(f, S11_LIT[i], S11_LIT[i] + 6)) * 0.14;
          c.style.background = rgb(mix([244, 244, 244], GREEN, lit));
          c.style.color = rgb(mix(INK, WHITE, lit));
          c.style.boxShadow = lit > 0 ? `0 0 ${(26 * lit).toFixed(1)}px rgba(12,216,102,${(0.55 * lit).toFixed(2)})` : "";
          place(c, CHIP_X + i * CHIP_STEP, CHIP_Y, ` scale(${(q * (1 + pulse)).toFixed(4)})`);
        });
        place(s11Tail, CHIP_X, 330);
        popWords(s11TailW, [576], fi);
      }

      // ---------------------------------------------------------- S12
      if (fi >= 590 && fi <= 660) {
        const p = prog(f, 590, 661);
        s12Wrap.style.transformOrigin = "850px 860px";
        s12Wrap.style.transform = `translateY(${lerp(0, -12, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        place(s12L.e, 850 - (9 * 64) / 2, 766);
        popWords(s12L.ws, [592, 600, 619], fi);
        // 飙: the word shoots up from below, smeared vertically, and lands
        const hw = 262 * 2 * 0.8;
        const up = outExpo(prog(f, 639, 646));
        heroIn(s12Hero, f, 639, CREAM, 850 - hw / 2, 832 + 220 * (1 - up) - 60 * (1 - outExpo(prog(f, 639, 645))));
        const sm = 1 - prog(f, 639, 644);
        if (f >= 639 && sm > 0) { smear.setAttribute("stdDeviation", `0 ${(36 * sm).toFixed(1)}`); s12Hero.style.filter = "url(#smear)"; }
      }

      // ---------------------------------------------------------- S13
      if (fi >= 661) {
        const p = prog(f, 661, 726);
        s13World.style.transform = `scale(${lerp(1.0, 1.06, p).toFixed(4)})`;
        const ring = 2 * Math.PI * (CKR + 14);
        ckRing.style.strokeDasharray = `${ring}`;
        ckRing.style.strokeDashoffset = (ring * (1 - outExpo(prog(f, 661, 672)))).toFixed(1);
        ckTicks.forEach((tk, i) => (tk.style.opacity = f >= 662 + (i / 60) * 9 ? 1 : 0));
        const ma = ckMinA(f);
        ckMin.setAttribute("transform", `rotate(${ma.toFixed(2)} ${CKX} ${CKY})`);
        ckMinG.setAttribute("transform", `rotate(${(ma - Math.max(0, ckMinA(f) - ckMinA(f - 1)) * 0.8).toFixed(2)} ${CKX} ${CKY})`);
        ckHour.setAttribute("transform", `rotate(${(ma / 12 + 300).toFixed(2)} ${CKX} ${CKY})`);
        [ckMin, ckHour].forEach((h) => (h.style.opacity = f >= 666 ? 1 : 0));
        place(s13Pre, 960 - (5 * 56 * 1.3) / 2, 92);
        writeOn(s13PreC, S13_PRE, f, fi, WHITE);
        const bw = 4 * 150 * 0.955;
        place(s13Big, 960 - bw / 2 - 60, 750);
        writeOn(s13BigC, S13_BIG, f, fi, WHITE, 2, 7);
        place(s13Tail, 960 + bw / 2 - 40, 750 + 150 * 0.92 - 56);
        writeOn(s13TailC, S13_TAIL, f, fi, WHITE);
      }
    }

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
