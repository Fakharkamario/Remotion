// Part 3 (on screen in Traditional Chinese) — "你一定要看到最後。第一，虧損的公司不買。第二，本月成長率低於40%的公司不買。第三，股價沒有創近一年新高的
// 公司不買。第四，沒有新產品、新服務、新市場的公司不買。第五點最重要：產品沒有供不應求的公司不買。" — 21.63 s, 30 fps.
// Same system as parts 1 and 2. The list has one rhythm, repeated five times:
//   number beat  — a huge green numeral lands BEHIND him (purple -> gold flash) as he counts on his fingers, 第N above;
//   rule beat    — the rule, each in a different move from the animation reference;
//   verdict      — on 不買 the talking-head reference's red strike wipes through the rule, and 不買 pops in red.
//
//   0–49     chest stack: 你一定要 / 看到最後
//   50–73    1          74–125   dark: 虧損的公司 typed huge chasing the caret, cut wide, struck
//   126–148  2          149–249  dark: 本月成長率 pill, a row of ten cells fills short of the green 40% mark, 低於40%, struck
//   250–274  3          275–375  white: a price line creeps up to the dashed 一年新高 line and never breaks it;
//                                 black box 股價沒有創近一年新高, struck (the dot stays on the end of the line)
//   376–398  4          399–514  on the wall: 沒有 / three boxes open from a line (新產品 新服務 新市場) / 的公司, struck
//   515–557  5 with the pill 第五點 最重要   558–648  tight: 產品沒有 / 供不應求 / 的公司, struck
//
// Word frames are ASR (SenseVoice) onsets checked against the voice's loudness envelope.
(function () {
  const FPS = 30;
  const FRAMES = 649;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mix = (c0, c1, t) => c0.map((v, i) => Math.round(lerp(v, c1[i], t)));
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

  const WHITE = [255, 255, 255];
  const CREAM = [255, 244, 226];
  const INK = [22, 22, 22];
  const GREEN = [12, 216, 102];
  const PURPLE = [176, 72, 236];
  const GOLD = [247, 196, 72];
  const BG = [27, 27, 27];
  const PANEL = [51, 51, 51];
  const DIM = [58, 58, 58];
  const BOXGREEN = [98, 201, 74];
  const BOXBLACK = [13, 13, 13];
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
  const sum = (a, n) => a.slice(0, n).reduce((x, y) => x + y, 0);

  function flashColor(f, at, settled) {
    if (f < at + 1) return PURPLE;
    if (f < at + 3) return GOLD;
    return mix(GOLD, settled, outCubic(prog(f, at + 3, at + 7)));
  }
  const writeColor = (f, at, settled, hold = 2, wash = 7) => mix(GREEN, settled, inOut(prog(f, at + hold, at + hold + wash)));
  function writeOn(cs, ats, f, fi, settled, hold, wash) {
    cs.forEach((c, i) => {
      show(c, fi >= ats[i]);
      c.style.color = rgb(writeColor(f, ats[i], settled, hold, wash));
    });
  }
  function heroIn(e, f, at, settled, x, y, sx) {
    const hp = outExpo(prog(f, at, at + 6));
    disp(e, f >= at);
    e.style.color = rgb(flashColor(f, at, settled));
    e.style.filter = hp < 1 ? `blur(${(9 * (1 - hp)).toFixed(2)}px)` : "none";
    place(e, x, y + 60 * (1 - hp), ` scaleX(${(sx === undefined ? 0.8 : sx).toFixed(4)})`);
    return hp;
  }
  // the verdict: a red strike that wipes left to right with an ease-out, and 不買 popping in red
  function strike(bar, f, at, x, y, w, h, rot) {
    const sp = outCubic(prog(f, at, at + 7));
    disp(bar, sp > 0);
    bar.style.width = w + "px"; bar.style.height = (h || 24) + "px";
    place(bar, x, y, ` rotate(${rot === undefined ? -2 : rot}deg) scaleX(${sp.toFixed(4)})`);
  }
  function verdict(tag, f, at, x, y) {
    const p = outExpo(prog(f, at, at + 5));
    disp(tag, f >= at);
    place(tag, x, y, ` scale(${lerp(1.5, 1, p).toFixed(4)})`);
    tag.style.filter = p < 1 ? `blur(${(6 * (1 - p)).toFixed(2)}px)` : "none";
  }
  const mkStrike = (parent) => { const b = el("div", "abs", parent); b.style.background = RED; b.style.transformOrigin = "0 50%"; b.style.borderRadius = "3px"; return b; };
  const mkVerdict = (parent, size) => {
    const t = el("div", "abs", parent, "不買");
    t.style.fontWeight = "900"; t.style.fontSize = (size || 84) + "px"; t.style.lineHeight = "1"; t.style.color = RED;
    t.style.transformOrigin = "0 50%"; t.style.whiteSpace = "nowrap";
    return t;
  };

  // Camera: each A-roll beat lands with a small punch and keeps pushing.
  const LEFT = [[1004, 502, 1.1], [990, 492, 1.16]]; // framed left, the wall free on the right
  const SHOTS = [
    [0, 49, [880, 520, 1.08], [880, 516, 1.14]],
    [50, 73, ...LEFT], [126, 148, ...LEFT], [250, 274, ...LEFT], [376, 398, ...LEFT],
    [399, 514, [1010, 500, 1.13], [996, 496, 1.19]],
    [515, 557, [1004, 492, 1.14], [990, 488, 1.2]],
    [558, 648, [820, 520, 1.3], [820, 516, 1.25]],
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
    ["I", 0, 49], ["N1", 50, 73], ["R1", 74, 125], ["N2", 126, 148], ["R2", 149, 249], ["N3", 250, 274], ["R3", 275, 375],
    ["N4", 376, 398], ["R4", 399, 514], ["N5", 515, 557], ["R5", 558, 648],
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
    const darkBg = (parent, color) => {
      const b = el("div", "abs", parent);
      b.style.width = "1920px"; b.style.height = "1080px"; b.style.background = color;
      return b;
    };

    // ============================================================ I: 你一定要 / 看到最後 (chest)
    const iWrap = el("div", "abs", S.I.front);
    const iL1 = el("div", "abs cap", iWrap);
    iL1.style.fontSize = "64px";
    const iL1W = words(iL1, ["你", "一定要"]);
    const iHero = el("div", "abs hero light", iWrap, "看到最後");
    iHero.style.fontSize = "230px";
    const I_AT = { l1: [9, 13], hero: 19 };

    // ============================================================ number beats: 第N on the wall, a huge numeral behind him
    const NUMS = [
      { id: "N1", label: "第一", n: "1", at: 51 },
      { id: "N2", label: "第二", n: "2", at: 127 },
      { id: "N3", label: "第三", n: "3", at: 251 },
      { id: "N4", label: "第四", n: "4", at: 377 },
      { id: "N5", label: "第五點", n: "5", at: 516, numAt: 521, pill: { t: "最重要", ats: [532, 537, 541] } },
    ];
    NUMS.forEach((N) => {
      N.lab = inkCap(S[N.id].behind, 70);
      N.labW = words(N.lab, [N.label]);
      N.num = el("div", "abs bignum", S[N.id].behind, N.n);
      N.num.style.fontSize = (N.pill ? 900 : 820) + "px";
      if (N.pill) {
        N.pillE = el("div", "pill", S[N.id].front);
        N.pillT = el("div", "txt", N.pillE);
        N.pillT.style.fontSize = "84px";
        N.pillC = chars(N.pillT, N.pill.t);
        N.pillW = spline([[N.pill.ats[0] - 2, 8], [N.pill.ats[0], 80], ...N.pill.ats.map((a, i) => [a + 2, 84 + 84 * 0.98 * (i + 1)])]);
      }
    });

    // ============================================================ R1: typing, cut wide, struck
    const r1Bg = darkBg(S.R1.top, rgb(BG));
    const r1Big = el("div", "abs grot", S.R1.top);
    r1Big.style.fontSize = "560px"; r1Big.style.color = rgb(WHITE);
    const r1BigC = chars(r1Big, "虧損的公司");
    const r1Caret = el("div", "caret", S.R1.top);
    const R1_AT = [75, 78, 86, 91, 95];
    const R1_CW = 560 * 0.955;
    const r1Left = spline([[74, 1290 - R1_CW], [77.4, 1290 - R1_CW], [78.6, 1640 - 2 * R1_CW], [85.4, 1630 - 2 * R1_CW], [86.6, 1780 - 3 * R1_CW],
      [90.4, 1770 - 3 * R1_CW], [91.6, 1790 - 4 * R1_CW], [94.4, 1780 - 4 * R1_CW], [95.6, 1795 - 5 * R1_CW], [100, 1760 - 5 * R1_CW]]);
    const r1Wide = el("div", "abs", S.R1.top);
    const r1Line = el("div", "abs grot", r1Wide);
    r1Line.style.fontSize = "220px"; r1Line.style.color = rgb(WHITE);
    chars(r1Line, "虧損的公司");
    const r1Strike = mkStrike(r1Wide);
    const r1Verdict = mkVerdict(r1Wide, 92);
    const R1_W = 5 * 220 * 0.955;

    // ============================================================ R2: pill, ten cells, 40% mark, 低於40%
    darkBg(S.R2.top, rgb(BG));
    const r2World = el("div", "abs", S.R2.top);
    r2World.style.width = "1920px"; r2World.style.height = "1080px"; r2World.style.transformOrigin = "960px 540px";
    const r2Pill = el("div", "pill", r2World);
    const r2PillT = el("div", "txt", r2Pill);
    r2PillT.style.fontSize = "70px";
    const r2PillC = chars(r2PillT, "本月成長率");
    const R2_PILL = [149, 154, 165, 170, 174];
    const r2PillW = spline([[147, 8], [149, 70], ...R2_PILL.map((a, i) => [a + 2, 76 + 70 * 0.98 * (i + 1)])]);
    const CELL = 118, GAP = 16, ROWX = 960 - (10 * CELL + 9 * GAP) / 2, ROWY = 470;
    const r2Cells = Array.from({ length: 10 }, (_, i) => ({ e: el("div", "cell", r2World), at: 150 + Math.abs(i - 4.5) * 1.1 }));
    const r2Fill = [[165, 0], [170, 1], [176, 2.1], [184, 2.55], [190, 2.5]];
    const r2FillF = spline(r2Fill);
    const r2Mark = el("div", "abs", r2World);
    r2Mark.style.background = rgb(GREEN); r2Mark.style.width = "6px"; r2Mark.style.borderRadius = "3px";
    r2Mark.style.boxShadow = "0 0 18px rgba(12,216,102,.7)";
    const r2Bracket = el("div", "abs", r2World);
    r2Bracket.style.border = "4px solid " + rgb(GREEN); r2Bracket.style.borderRadius = "14px";
    const r2MarkLab = el("div", "abs", r2World, "40%");
    r2MarkLab.style.fontWeight = "800"; r2MarkLab.style.fontSize = "54px"; r2MarkLab.style.color = rgb(GREEN); r2MarkLab.style.lineHeight = "1";
    const r2Big = el("div", "abs grot", r2World);
    r2Big.style.fontSize = "170px"; r2Big.style.fontWeight = "700";
    const r2BigC = chars(r2Big, "低於40%");
    const R2_BIG = [181, 186, 194, 199, 204];
    const R2_BW = [1, 1, 0.58, 0.58, 0.9].map((k) => k * 170 * 0.955);
    const r2Tail = el("div", "abs thin", r2World);
    r2Tail.style.fontSize = "64px"; r2Tail.style.color = rgb(WHITE); r2Tail.style.fontWeight = "400";
    const r2TailC = chars(r2Tail, "的公司");
    const R2_TAIL = [213, 217, 221];
    const r2Strike = mkStrike(r2World);
    const r2Verdict = mkVerdict(r2World, 92);

    // ============================================================ R3: white, the line that never makes a new high
    darkBg(S.R3.top, "#fafafa");
    const r3World = el("div", "abs", S.R3.top);
    r3World.style.width = "1920px"; r3World.style.height = "1080px"; r3World.style.transformOrigin = "960px 460px";
    const CH_X0 = 470, CH_X1 = 1450, CH_TOP = 230, CH_BOT = 560, HIGH_Y = 270;
    const PTS = [[0, 0.1], [0.08, 0.3], [0.15, 0.22], [0.24, 0.48], [0.31, 0.4], [0.4, 0.62], [0.47, 0.55], [0.56, 0.74], [0.63, 0.68],
      [0.72, 0.84], [0.79, 0.78], [0.87, 0.9], [0.93, 0.86], [1, 0.9]];
    const px = (u) => CH_X0 + u * (CH_X1 - CH_X0);
    const py = (v) => CH_BOT - v * (CH_BOT - (HIGH_Y + 14)) ;
    const path = PTS.map(([u, v], i) => `${i ? "L" : "M"}${px(u).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
    r3World.insertAdjacentHTML("beforeend",
      `<svg class="abs" width="1920" height="1080" viewBox="0 0 1920 1080">` +
      `<defs><clipPath id="r3clip"><rect id="r3rect" x="0" y="0" width="0" height="1080"/></clipPath>` +
      `<clipPath id="r3hi"><rect id="r3hiRect" x="${CH_X0 - 30}" y="0" width="0" height="1080"/></clipPath></defs>` +
      `<line x1="${CH_X0 - 30}" x2="${CH_X1 + 40}" y1="${HIGH_Y}" y2="${HIGH_Y}" stroke="${rgb(GREEN)}" stroke-width="5" stroke-dasharray="18 14" clip-path="url(#r3hi)"/>` +
      `<path d="${path}" fill="none" stroke="#161616" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#r3clip)"/>` +
      `<circle id="r3tip" cx="0" cy="0" r="14" fill="${RED}"/></svg>`);
    const r3rect = r3World.querySelector("#r3rect"), r3hiRect = r3World.querySelector("#r3hiRect"), r3tip = r3World.querySelector("#r3tip");
    const r3HiLab = el("div", "abs", r3World);
    r3HiLab.style.fontWeight = "700"; r3HiLab.style.fontSize = "50px"; r3HiLab.style.lineHeight = "1"; r3HiLab.style.whiteSpace = "nowrap";
    const r3HiLabC = chars(r3HiLab, "一年新高");
    const R3_HI = [318, 323, 330, 336];
    // price runs along the line as he speaks and stalls just under the high
    const r3Run = spline([[275, 0], [300, 0.45], [325, 0.8], [340, 0.93], [346, 1]]);
    const r3Box = el("div", "dbox", r3World);
    r3Box.innerHTML =
      `<svg class="tex" viewBox="0 0 800 200" preserveAspectRatio="none" width="100%" height="100%">` +
      `<defs><filter id="fx3"><feTurbulence type="fractalNoise" baseFrequency=".012 .09" numOctaves="3" seed="3"/>` +
      `<feColorMatrix values="0 0 0 0 .55  0 0 0 0 .55  0 0 0 0 .55  0 0 0 1.1 -.35"/></filter></defs>` +
      `<rect width="800" height="200" filter="url(#fx3)"/></svg>`;
    const r3BoxT = el("div", "txt", r3Box);
    r3BoxT.style.fontSize = "84px";
    const r3BoxC = chars(r3BoxT, "股價沒有創近一年新高");
    const R3_BOX = [275, 280, 291, 294, 302, 307, 318, 323, 330, 336];
    const R3_BW = 10 * 84 * 0.97 + 90, R3_BH = 132, R3_BY = 790;
    const r3Strike = mkStrike(r3World);
    const r3Verdict = mkVerdict(r3World, 92);

    // ============================================================ R4: 沒有 / three boxes / 的公司 (wall)
    const r4Wrap = el("div", "abs", S.R4.behind);
    const r4Thin = el("div", "abs thin", r4Wrap);
    r4Thin.style.fontSize = "62px"; r4Thin.style.color = rgb(INK); r4Thin.style.fontWeight = "400"; r4Thin.style.letterSpacing = "0.2em";
    const r4ThinC = chars(r4Thin, "沒有");
    const R4_THIN = [399, 402];
    const R4_ITEMS = [
      { t: "新產品", at: 410, chars: [410, 417, 420], y: 270, strike: 494 },
      { t: "新服務", at: 433, chars: [433, 440, 444], y: 418, strike: 497 },
      { t: "新市場", at: 456, chars: [456, 464, 467], y: 566, strike: 500 },
    ];
    R4_ITEMS.forEach((it) => {
      it.box = el("div", "box", r4Wrap);
      it.txt = el("div", "txt", it.box);
      it.txt.style.fontSize = "92px";
      it.cs = chars(it.txt, it.t);
      it.bar = mkStrike(r4Wrap);
    });
    const R4_BW = 3 * 92 * 0.98 + 70, R4_BH = 124, R4_X = 1470;
    const r4Tail = el("div", "abs thin", r4Wrap);
    r4Tail.style.fontSize = "62px"; r4Tail.style.color = rgb(INK); r4Tail.style.fontWeight = "400"; r4Tail.style.letterSpacing = "0.2em";
    const r4TailC = chars(r4Tail, "的公司");
    const R4_TAIL = [473, 478, 482];
    const r4Verdict = mkVerdict(r4Wrap, 80);

    // ============================================================ R5: 產品沒有 / 供不應求 / 的公司 (chest)
    const r5Wrap = el("div", "abs", S.R5.front);
    const r5L1 = el("div", "abs cap", r5Wrap);
    r5L1.style.fontSize = "64px";
    const r5L1W = words(r5L1, ["產品", "沒有"]);
    const r5Hero = el("div", "abs hero light", r5Wrap, "供不應求");
    r5Hero.style.fontSize = "232px";
    const r5L3 = el("div", "abs cap", r5Wrap);
    r5L3.style.fontSize = "64px";
    const r5L3W = words(r5L3, ["的公司"]);
    const r5Strike = mkStrike(r5Wrap);
    const r5Verdict = mkVerdict(r5Wrap, 96);
    r5Verdict.style.textShadow = "0 4px 18px rgba(0,0,0,.35)";
    const R5 = { l1: [559, 572], hero: 584, l3: [604], strike: 626, verdict: 631 };

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
      // R3's white card flashes back out to camera
      let wash = 0;
      if (fi >= 376 && fi <= 383) wash = 1 - outCubic(prog(f, 376, 384));
      L.wash.style.opacity = wash.toFixed(3);
      smear.setAttribute("stdDeviation", "0 0");

      // ---------------------------------------------------------- I
      if (fi <= 49) {
        const p = prog(f, 0, 50);
        iWrap.style.transformOrigin = "900px 820px";
        iWrap.style.transform = `translateY(${lerp(0, -14, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        place(iL1, 900 - (4 * 64) / 2, 736);
        iL1W.forEach((w, i) => show(w, fi >= I_AT.l1[i]));
        const hw = 230 * 3.62 * 0.8;
        heroIn(iHero, f, I_AT.hero, CREAM, 900 - hw / 2, 806);
      }

      // ---------------------------------------------------------- number beats
      NUMS.forEach((N) => {
        const [, a, b] = SCENES.find((s) => s[0] === N.id);
        if (fi < a || fi > b) return;
        const p = prog(f, a, b + 1);
        place(N.lab, 1070, 70 - 10 * p);
        show(N.labW[0], fi >= N.at);
        const nAt = N.numAt || N.at;
        const hp = outExpo(prog(f, nAt, nAt + 6));
        disp(N.num, f >= nAt);
        N.num.style.color = rgb(flashColor(f, nAt, GREEN));
        N.num.style.filter = hp < 1 ? `blur(${(10 * (1 - hp)).toFixed(2)}px)` : "none";
        N.num.style.transformOrigin = "30% 60%";
        place(N.num, N.pill ? 1010 : 1000, (N.pill ? 180 : 160) + 70 * (1 - hp), ` scale(${lerp(1.0, 1.07, prog(f, nAt, b + 1)).toFixed(4)})`);
        if (N.pill) {
          const n = N.pill.ats.filter((x) => fi >= x).length;
          const on = f >= N.pill.ats[0] - 2;
          disp(N.pillE, on);
          if (on) {
            const pw = N.pillW(f);
            N.pillE.style.width = pw + "px"; N.pillE.style.height = "124px";
            place(N.pillE, 1290 - pw / 2, 600 - 12 * p);
            N.pillC.forEach((c, i) => show(c, i < n));
            N.pillT.style.transform = `translate(${(-(n * 84 * 0.98) / 2).toFixed(1)}px, -54%)`;
          }
        }
      });

      // ---------------------------------------------------------- R1
      if (fi >= 74 && fi <= 125) {
        const wide = fi >= 100;
        r1Bg.style.background = rgb(fi <= 75 || fi === 100 || fi === 101 ? PANEL : BG);
        disp(r1Big, !wide); disp(r1Caret, !wide); disp(r1Wide, wide);
        if (!wide) {
          const n = R1_AT.filter((a) => fi >= a).length;
          r1BigC.forEach((c, i) => show(c, i < n));
          const left = r1Left(f);
          place(r1Big, left, 540 - 560 * 0.56);
          r1Caret.style.height = 560 * 0.74 + "px"; r1Caret.style.width = "12px";
          place(r1Caret, left + n * R1_CW + 14, 540 - 560 * 0.37);
        } else {
          // wide: the line keeps sliding left, the strike lands on 不, 不買 on 買, then it smears out
          const out = prog(f, 122.5, 125.5);
          const x = 960 - R1_W / 2 + 40 - 2.4 * (f - 100) - 160 * out * out;
          place(r1Wide, x, 540 - 220 * 0.56);
          strike(r1Strike, f, 105, -24, 220 * 0.44, R1_W + 48, 26);
          verdict(r1Verdict, f, 111, R1_W + 40, 220 * 0.98);
          if (out > 0) { smear.setAttribute("stdDeviation", `${(46 * out).toFixed(1)} 0`); r1Wide.style.filter = "url(#smear)"; }
          else r1Wide.style.filter = "none";
        }
      }

      // ---------------------------------------------------------- R2
      if (fi >= 149 && fi <= 249) {
        const p = prog(f, 149, 250);
        r2World.style.transform = `translate(${lerp(0, -18, p).toFixed(2)}px, ${lerp(0, -10, p).toFixed(2)}px) scale(${lerp(1.03, 0.97, p).toFixed(4)})`;
        // pill
        const n = R2_PILL.filter((a) => fi >= a).length;
        const pw = r2PillW(f);
        r2Pill.style.width = pw + "px"; r2Pill.style.height = "108px";
        place(r2Pill, 960 - pw / 2, 190);
        r2PillC.forEach((c, i) => show(c, i < n));
        r2PillT.style.transform = `translate(${(-(n * 70 * 0.98) / 2).toFixed(1)}px, -54%)`;
        // cells build in from the centre, then fill white from the left and stall short of the mark
        const fill = r2FillF(f);
        r2Cells.forEach((c, i) => {
          const q = prog(f, c.at, c.at + 6);
          const sc = q <= 0 ? 0 : 1 + (2.2 + 1) * Math.pow(q - 1, 3) + 2.2 * Math.pow(q - 1, 2);
          const lit = clamp(fill - i, 0, 1);
          c.e.style.width = c.e.style.height = CELL + "px";
          c.e.style.borderRadius = "16px";
          c.e.style.background = rgb(mix(DIM, [244, 244, 244], lit));
          c.e.style.opacity = q > 0 ? 1 : 0;
          place(c.e, ROWX + i * (CELL + GAP), ROWY, ` scale(${sc.toFixed(4)})`);
        });
        // the 40% bracket and mark arrive with "40%"
        const mk = outExpo(prog(f, 194, 202));
        disp(r2Bracket, mk > 0); disp(r2Mark, mk > 0); disp(r2MarkLab, f >= 199);
        const bw = 4 * CELL + 3 * GAP + 20;
        r2Bracket.style.width = (bw * mk).toFixed(1) + "px"; r2Bracket.style.height = CELL + 20 + "px";
        place(r2Bracket, ROWX - 10, ROWY - 10);
        const mx = ROWX + 4 * CELL + 3.5 * GAP - 3;
        r2Mark.style.height = (CELL + 90) * mk + "px";
        place(r2Mark, mx, ROWY - 45);
        place(r2MarkLab, mx - 50, ROWY - 110, ` scale(${lerp(1.4, 1, outExpo(prog(f, 199, 204))).toFixed(3)})`);
        // 低於40% / 的公司
        // 低於40% 的公司 不買 as one line, centred
        const bigW = sum(R2_BW, 5), tailW = 3 * 64 * 1.0, lineW = bigW + 28 + tailW + 40 + 2 * 92;
        const bx = 960 - lineW / 2;
        place(r2Big, bx, 690);
        writeOn(r2BigC, R2_BIG, f, fi, WHITE, 3, 7);
        place(r2Tail, bx + bigW + 28, 690 + 170 * 0.92 - 64);
        writeOn(r2TailC, R2_TAIL, f, fi, WHITE);
        strike(r2Strike, f, 231, bx - 20, 690 + 170 * 0.46, bigW + 28 + tailW + 40, 24);
        verdict(r2Verdict, f, 235, bx + bigW + 28 + tailW + 40, 690 + 170 * 0.92 - 92);
      }

      // ---------------------------------------------------------- R3
      if (fi >= 275 && fi <= 375) {
        const p = prog(f, 275, 376);
        r3World.style.transform = `translate(${lerp(0, -16, p).toFixed(2)}px, ${lerp(0, -12, p).toFixed(2)}px) scale(${lerp(1.0, 1.06, p).toFixed(4)})`;
        const run = r3Run(f);
        const xr = px(run);
        r3rect.setAttribute("width", xr.toFixed(1));
        // the tip rides the line
        let tipY = py(PTS[0][1]);
        for (let i = 0; i < PTS.length - 1; i++) {
          if (run >= PTS[i][0] && run <= PTS[i + 1][0]) { const u = (run - PTS[i][0]) / (PTS[i + 1][0] - PTS[i][0]); tipY = py(lerp(PTS[i][1], PTS[i + 1][1], u)); }
        }
        if (run >= 1) tipY = py(PTS[PTS.length - 1][1]);
        r3tip.setAttribute("cx", xr.toFixed(1)); r3tip.setAttribute("cy", tipY.toFixed(1));
        r3tip.setAttribute("r", (14 * outExpo(prog(f, 276, 280))).toFixed(2));
        // the dashed high line draws across when 一年新高 is said
        r3hiRect.setAttribute("width", ((CH_X1 - CH_X0 + 80) * outCubic(prog(f, 316, 330))).toFixed(1));
        place(r3HiLab, CH_X1 + 56, HIGH_Y - 25);
        writeOn(r3HiLabC, R3_HI, f, fi, INK);
        // the box opens from a line, green turning black, and the rule is typed into it
        const on = f >= 274;
        disp(r3Box, on);
        if (on) {
          const h = R3_BH * outCubic(prog(f, 274, 276));
          const w = lerp(4, R3_BW, outExpo(prog(f, 275, 284)));
          r3Box.style.width = w + "px"; r3Box.style.height = h + "px";
          place(r3Box, 960 - w / 2, R3_BY - h / 2);
          const dark = inOut(prog(f, 279, 285));
          r3Box.style.background = rgb(mix(BOXGREEN, BOXBLACK, dark));
          r3Box.querySelector(".tex").style.opacity = (0.5 * dark).toFixed(3);
          r3BoxT.style.transform = `translate(${((w - (R3_BW - 90)) / 2).toFixed(1)}px, -54%)`;
          writeOn(r3BoxC, R3_BOX, f, fi, WHITE, 3, 8);
        }
        strike(r3Strike, f, 357, 960 - R3_BW / 2 - 24, R3_BY - 13, R3_BW + 48, 26);
        verdict(r3Verdict, f, 363, 960 + R3_BW / 2 + 30, R3_BY - 46);
      }

      // ---------------------------------------------------------- R4
      if (fi >= 399 && fi <= 514) {
        const p = prog(f, 399, 515);
        r4Wrap.style.transform = `translate(${lerp(8, -10, p).toFixed(2)}px, ${lerp(8, -16, p).toFixed(2)}px)`;
        place(r4Thin, 1200, 140);
        writeOn(r4ThinC, R4_THIN, f, fi, INK);
        R4_ITEMS.forEach((it) => {
          const on = f >= it.at - 1;
          disp(it.box, on);
          if (on) {
            const h = R4_BH * outCubic(prog(f, it.at - 1, it.at + 1));
            const w = lerp(4, R4_BW, outExpo(prog(f, it.at, it.at + 9)));
            it.box.style.width = w + "px"; it.box.style.height = h + "px";
            place(it.box, R4_X - w / 2, it.y + (R4_BH - h) / 2);
            it.txt.style.transform = "translate(-50%, -54%)";
            writeOn(it.cs, it.chars, f, fi, WHITE, 2, 6);
          }
          strike(it.bar, f, it.strike, R4_X - R4_BW / 2 - 20, it.y + R4_BH / 2 - 12, R4_BW + 40, 24, -3);
        });
        place(r4Tail, 1200, 726);
        writeOn(r4TailC, R4_TAIL, f, fi, INK);
        verdict(r4Verdict, f, 500, 1460, 712);
      }

      // ---------------------------------------------------------- R5
      if (fi >= 558) {
        const p = prog(f, 558, 649);
        r5Wrap.style.transformOrigin = "850px 860px";
        r5Wrap.style.transform = `translateY(${lerp(0, -16, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        place(r5L1, 850 - (4 * 64) / 2, 766);
        r5L1W.forEach((w, i) => show(w, fi >= R5.l1[i]));
        const hw = 232 * 3.62 * 0.8;
        heroIn(r5Hero, f, R5.hero, CREAM, 850 - hw / 2, 832);
        place(r5L3, 850 + hw / 2 + 14, 832 + 232 * 0.9 - 64);
        r5L3W.forEach((w, i) => show(w, fi >= R5.l3[i]));
        strike(r5Strike, f, R5.strike, 850 - hw / 2 - 26, 832 + 232 * 0.4, hw + 52, 28);
        verdict(r5Verdict, f, R5.verdict, 850 + hw / 2 + 14 + 3 * 64 + 26, 832 + 232 * 0.9 - 96);
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
