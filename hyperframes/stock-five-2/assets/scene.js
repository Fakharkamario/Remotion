// Part 2 (on screen in Traditional Chinese) — "多數人呢都是在思考哪家公司會漲、哪個公司賺錢，但是呢用逆向思維的方式會讓事情變得更簡單。
// 尤其是第五點，基本到不行的經濟學常識。但是多數人在做股票的時候全部都會忘光光。" — 14.73 s, 30 fps (442 frames).
// Same system as part 1 (stock-five): the take runs unbroken underneath, beats cut hard, nothing sits on his face.
//
//   0–46     A-roll framed left. 多數人呢 / 都是在 pop on the wall, huge 思考 flashes in BEHIND him.
//   47–107   dark room with neon arcs. 哪家公司會漲 huge, letters land green and sweep white (reference: AUTOPILOT);
//            a chart card opens from inside the word and 哪個公司賺錢 is written across it (AUTONOMOUS AGENTS).
//   108–170  punch-in. 但是呢 用 / 逆向思維 / 的方式 on his chest; the key word flips in mirrored ("reverse").
//   171–236  tight. thin 會讓事情變得 writes on; huge 更簡單 lands green behind his hair, washes to ink (agent).
//   237–275  wide. a huge green 5 stands behind him as he holds up five fingers; the grey pill 尤其是第五點 is
//            typed over it (2X pipe line); the picture washes to white.
//   276–336  white. 基本到不行的 writes on; a box opens green, turns black, 經濟學常識 typed inside (augmentation).
//   337–389  A-roll framed left, flashing in from white. 但是 / 多數人 / 在做股票 / 的時候 cascade down the wall.
//   390–441  tight punch-in. 全部都會 / 忘光光 flashes in, then the characters dissolve away one by one.
//
// Word frames are ASR (SenseVoice) onsets checked against the voice's loudness envelope.
(function () {
  const FPS = 30;
  const FRAMES = 442;

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
  const BOXGREEN = [98, 201, 74];
  const BOXBLACK = [13, 13, 13];

  // Monotone cubic (PCHIP) through [frame, value] keys: continuous velocity, no overshoot.
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
  // characters toggle visibility (they keep their layout); containers toggle display, since a hidden parent
  // would not hide children that are set visible
  const show = (e, on) => (e.style.visibility = on ? "visible" : "hidden");
  const disp = (e, on, kind) => (e.style.display = on ? kind || "block" : "none");

  // talking-head reference: one purple frame, two gold frames, then the settled colour
  function flashColor(f, at, settled) {
    if (f < at + 1) return PURPLE;
    if (f < at + 3) return GOLD;
    return mix(GOLD, settled, outCubic(prog(f, at + 3, at + 7)));
  }
  // animation reference: a letter appears green and washes to its settled colour
  const writeColor = (f, at, settled, hold = 2, wash = 7) => mix(GREEN, settled, inOut(prog(f, at + hold, at + hold + wash)));
  // write a run of characters on at their frames
  function writeOn(cs, ats, f, fi, settled, hold, wash) {
    cs.forEach((c, i) => {
      show(c, fi >= ats[i]);
      c.style.color = rgb(writeColor(f, ats[i], settled, hold, wash));
    });
  }
  // a key word rising out of a blur with the colour flash; returns its 0..1 landing
  function heroIn(e, f, at, settled, x, y, sx) {
    const hp = outExpo(prog(f, at, at + 6));
    disp(e, f >= at);
    e.style.color = rgb(flashColor(f, at, settled));
    e.style.filter = hp < 1 ? `blur(${(9 * (1 - hp)).toFixed(2)}px)` : "none";
    place(e, x, y + 60 * (1 - hp), ` scaleX(${(sx === undefined ? 0.8 : sx).toFixed(4)})`);
    return hp;
  }

  // Camera on the take: a view centred on source point (cx, cy) at scale s. Each A-roll beat lands with a small
  // punch (a few % large, easing out over 8 frames) and keeps pushing the whole time it is on.
  const SHOTS = [
    [0, 46, [1004, 502, 1.1], [990, 492, 1.165]],
    [108, 170, [812, 566, 1.2], [812, 560, 1.25]],
    [171, 236, [1004, 474, 1.22], [996, 474, 1.3]],
    [237, 275, [960, 540, 1.0], [985, 530, 1.05]],
    [337, 389, [1000, 500, 1.12], [990, 500, 1.17]],
    [390, 441, [820, 520, 1.3], [820, 520, 1.25]],
  ];
  function cam(f) {
    let sh = SHOTS[0];
    for (const s of SHOTS) if (f >= s[0]) sh = s;
    const p = prog(f, sh[0], sh[1] + 1);
    const k = { cx: lerp(sh[2][0], sh[3][0], p), cy: lerp(sh[2][1], sh[3][1], p), s: lerp(sh[2][2], sh[3][2], p) };
    k.s *= 1 + 0.035 * (1 - outCubic(prog(f, sh[0], sh[0] + 8)));
    const hw = 960 / k.s, hh = 540 / k.s;
    return { s: k.s, cx: clamp(k.cx, hw, 1920 - hw), cy: clamp(k.cy, hh, 1080 - hh) };
  }
  const camCss = (k) => `translate(${(960 - k.cx * k.s).toFixed(2)}px, ${(540 - k.cy * k.s).toFixed(2)}px) scale(${k.s.toFixed(4)})`;

  const SCENES = [["A", 0, 46], ["B", 47, 107], ["C", 108, 170], ["D", 171, 236], ["E", 237, 275], ["F", 276, 336], ["G", 337, 389], ["H", 390, 441]];

  const SCENE = {};
  SCENE.mount = function (L) {
    const S = {};
    SCENES.forEach(([id]) => (S[id] = { behind: el("div", "scene", L.behind), front: el("div", "scene", L.front), top: el("div", "scene", L.stage) }));

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

    // ============================================================ A: 多數人呢 / 都是在 / 思考 (behind him)
    const aWrap = el("div", "abs", S.A.behind);
    const aL1 = inkCap(aWrap, 66), aL1W = words(aL1, ["多數人", "呢"]);
    const aL2 = inkCap(aWrap, 66), aL2W = words(aL2, ["都是在"]);
    const aHero = el("div", "abs hero ink", aWrap, "思考");
    aHero.style.fontSize = "380px";
    const A_AT = { l1: [6, 21], l2: [26], hero: 37 };

    // ============================================================ B: AUTOPILOT room, chart card
    const bRoom = el("div", "abs", S.B.top);
    bRoom.style.width = "1920px"; bRoom.style.height = "1080px";
    bRoom.style.background = "radial-gradient(ellipse 70% 60% at 50% 46%, #1d201e 0%, #0c0d0c 60%, #050505 100%)";
    bRoom.innerHTML =
      `<svg class="neon" viewBox="0 0 1920 1080" width="1920" height="1080">` +
      `<defs><filter id="glowB" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" result="b"/>` +
      `<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
      `<linearGradient id="slab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2c2a"/><stop offset="1" stop-color="#0b0b0b"/></linearGradient></defs>` +
      `<polygon points="0,0 760,0 520,380 0,520" fill="url(#slab)" opacity=".55"/>` +
      `<polygon points="1920,0 1180,0 1420,380 1920,520" fill="url(#slab)" opacity=".55"/>` +
      `<polygon points="0,1080 640,1080 470,760 0,640" fill="#121312" opacity=".9"/>` +
      `<polygon points="1920,1080 1280,1080 1450,760 1920,640" fill="#121312" opacity=".9"/>` +
      `<linearGradient id="fadeUp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#33ff86" stop-opacity="1"/><stop offset="1" stop-color="#33ff86" stop-opacity="0"/></linearGradient>` +
      `<g id="arcs" filter="url(#glowB)" fill="none" stroke="url(#fadeUp)" stroke-width="4" stroke-linecap="round">` +
      `<path d="M 610 1080 C 640 930 700 830 790 770"/><path d="M 1310 1080 C 1280 930 1220 830 1130 770"/>` +
      `<path d="M 420 1080 C 470 980 520 920 600 880" stroke-width="2.5" opacity=".6"/><path d="M 1500 1080 C 1450 980 1400 920 1320 880" stroke-width="2.5" opacity=".6"/></g></svg>`;
    const bArcs = bRoom.querySelector("#arcs");
    const bWord = el("div", "abs", S.B.top);
    bWord.style.fontWeight = "800"; bWord.style.fontSize = "196px"; bWord.style.letterSpacing = "-0.03em"; bWord.style.lineHeight = "1";
    bWord.style.whiteSpace = "nowrap"; bWord.style.textShadow = "0 0 40px rgba(0,0,0,.6)";
    const bWordC = chars(bWord, "哪家公司會漲");
    const B_AT1 = [48, 53, 57, 61, 66, 71];
    const B_W1 = 6 * 196 * 0.97;
    // the card: a dusky chart "photo" that opens from inside the word
    const bCard = el("div", "card2", S.B.top);
    const CW2 = 1120, CH2 = 630;
    let candles = "";
    for (let i = 0; i < 16; i++) {
      const x = 90 + i * 60, base = 470 - i * 14 + (i % 3 === 1 ? 30 : 0), hgt = 60 + ((i * 37) % 70);
      candles += `<line x1="${x + 12}" x2="${x + 12}" y1="${base - hgt - 26}" y2="${base + 22}" stroke="#3a2c45" stroke-width="3"/>` +
        `<rect x="${x}" y="${base - hgt}" width="24" height="${hgt}" fill="#3a2c45"/>`;
    }
    bCard.innerHTML =
      `<svg viewBox="0 0 ${CW2} ${CH2}" width="${CW2}" height="${CH2}">` +
      `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f6584"/><stop offset=".55" stop-color="#b89fa8"/><stop offset="1" stop-color="#d9b48f"/></linearGradient>` +
      `<radialGradient id="sun" cx=".72" cy=".42" r=".35"><stop offset="0" stop-color="#ffe6c2" stop-opacity=".85"/><stop offset="1" stop-color="#ffe6c2" stop-opacity="0"/></radialGradient>` +
      `<filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>` +
      `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .22 0"/></filter></defs>` +
      `<rect width="${CW2}" height="${CH2}" fill="url(#sky)"/><rect width="${CW2}" height="${CH2}" fill="url(#sun)"/>` +
      `<g filter="url(#soft)" opacity=".9">${candles}` +
      `<path d="M 60 560 C 300 520 420 470 560 420 S 860 300 1060 180" fill="none" stroke="#2c2236" stroke-width="7"/>` +
      `<rect x="0" y="560" width="${CW2}" height="70" fill="#4b3a3a" opacity=".55"/></g>` +
      `<rect width="${CW2}" height="${CH2}" filter="url(#grain)"/></svg>`;
    const bCardWord = el("div", "abs", bCard);
    bCardWord.style.fontWeight = "800"; bCardWord.style.fontSize = "128px"; bCardWord.style.letterSpacing = "-0.03em";
    bCardWord.style.lineHeight = "1"; bCardWord.style.whiteSpace = "nowrap"; bCardWord.style.textShadow = "0 4px 30px rgba(40,20,50,.45)";
    const bCardC = chars(bCardWord, "哪個公司賺錢");
    const B_AT2 = [78, 82, 88, 91, 98, 102];

    // ============================================================ C: 但是呢 用 / 逆向思維 / 的方式 (chest)
    const cWrap = el("div", "abs", S.C.front);
    const cL1 = el("div", "abs cap", cWrap);
    cL1.style.fontSize = "62px";
    const cL1W = words(cL1, ["但是", "呢", " 用"]);
    const cHero = el("div", "abs hero light", cWrap, "逆向思維");
    cHero.style.fontSize = "224px";
    const cL3 = el("div", "abs cap", cWrap);
    cL3.style.fontSize = "62px";
    const cL3W = words(cL3, ["的方式"]);
    const C_AT = { l1: [113, 123, 131], hero: 138, l3: [161] };

    // ============================================================ D: 會讓事情變得 / 更簡單 (behind his hair)
    const dThin = el("div", "abs thin", S.D.behind);
    dThin.style.color = rgb(INK); dThin.style.fontSize = "58px"; dThin.style.fontWeight = "400"; dThin.style.letterSpacing = "0.18em";
    const dThinC = chars(dThin, "會讓事情變得");
    const D_THIN = [177, 181, 186, 190, 197, 201];
    const dHero = el("div", "abs grot", S.D.behind);
    dHero.style.fontSize = "300px";
    const dHeroC = chars(dHero, "更簡單");
    const D_AT = [206, 213, 219];

    // ============================================================ E: a huge 5 behind him, pill over it
    const eNum = el("div", "abs bignum", S.E.behind, "5");
    eNum.style.fontSize = "860px";
    const ePill = el("div", "pill", S.E.front);
    const eTxt = el("div", "txt", ePill);
    eTxt.style.fontSize = "74px";
    const eTxtC = chars(eTxt, "尤其是第五點");
    const E_AT = [237, 242, 248, 253, 257, 260];
    const E_CW = 74 * 0.98;
    const ePillW = spline([[236, 8], [238, 70], ...E_AT.map((a, i) => [a + 2, 76 + E_CW * (i + 1)])]);

    // ============================================================ F: white, 基本到不行的 / 經濟學常識 box
    const fBg = el("div", "abs", S.F.top);
    fBg.style.width = "1920px"; fBg.style.height = "1080px"; fBg.style.background = "#fafafa";
    const fWorld = el("div", "abs", S.F.top);
    fWorld.style.width = "1920px"; fWorld.style.height = "1080px"; fWorld.style.transformOrigin = "960px 520px";
    const fSmall = el("div", "abs", fWorld);
    fSmall.style.fontWeight = "500"; fSmall.style.fontSize = "70px"; fSmall.style.lineHeight = "1"; fSmall.style.whiteSpace = "nowrap";
    const fSmallC = chars(fSmall, "基本到不行的");
    const F_SMALL = [277, 281, 284, 288, 295, 300];
    const fBox = el("div", "dbox", fWorld);
    fBox.innerHTML =
      `<svg class="tex" viewBox="0 0 800 200" preserveAspectRatio="none" width="100%" height="100%">` +
      `<defs><filter id="fx"><feTurbulence type="fractalNoise" baseFrequency=".012 .09" numOctaves="3" seed="9"/>` +
      `<feColorMatrix values="0 0 0 0 .55  0 0 0 0 .55  0 0 0 0 .55  0 0 0 1.1 -.35"/></filter></defs>` +
      `<rect width="800" height="200" filter="url(#fx)"/></svg>`;
    const fBoxTxt = el("div", "txt", fBox);
    fBoxTxt.style.fontSize = "132px";
    const fBoxC = chars(fBoxTxt, "經濟學常識");
    const F_AT = [310, 313, 316, 320, 323];
    const F_BOX_W = 5 * 132 * 0.97 + 100, F_BOX_H = 176;

    // ============================================================ G: cascade down the wall
    const G_LINES = [
      { t: "但是", ats: [338, 341], x: 1080, y: 150, size: 62 },
      { t: "多數人", ats: [347, 350, 355], x: 1210, y: 252, size: 62 },
      { t: "在做股票", ats: [361, 365, 372, 375], x: 1120, y: 360, size: 92, bold: [2, 3] },
      { t: "的時候", ats: [379, 382, 384], x: 1330, y: 492, size: 62 },
    ];
    const gWrap = el("div", "abs", S.G.behind);
    G_LINES.forEach((ln) => {
      ln.e = el("div", "abs thin", gWrap);
      ln.e.style.fontSize = ln.size + "px"; ln.e.style.fontWeight = "400"; ln.e.style.letterSpacing = "0.06em";
      ln.cs = chars(ln.e, ln.t);
      (ln.bold || []).forEach((i) => (ln.cs[i].style.fontWeight = "800"));
    });

    // ============================================================ H: 全部都會 / 忘光光, dissolving
    const hWrap = el("div", "abs", S.H.front);
    const hL1 = el("div", "abs cap", hWrap);
    hL1.style.fontSize = "62px";
    const hL1W = words(hL1, ["全部", "都會"]);
    const hHero = el("div", "abs hero light", hWrap);
    hHero.style.fontSize = "232px";
    const hHeroC = chars(hHero, "忘光光");
    const H_AT = { l1: [390, 397], hero: 406, gone: 423 };

    // ============================================================ render
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);

      SCENES.forEach(([id, a, b]) => {
        const on = fi >= a && fi <= b ? "block" : "none";
        S[id].behind.style.display = S[id].front.style.display = S[id].top.style.display = on;
      });

      L.cam.style.transform = L.cut.style.transform = camCss(cam(f));
      const cutNow = cutImgs[fi] ? fi : null;
      if (cutNow !== shownCut) {
        if (shownCut !== null) cutImgs[shownCut].style.display = "none";
        if (cutNow !== null) cutImgs[cutNow].style.display = "block";
        shownCut = cutNow;
      }

      // E washes out to white into F; G flashes back in from white
      let wash = 0;
      if (fi >= 264 && fi <= 275) wash = inOut(prog(f, 264, 275));
      else if (fi >= 337 && fi <= 345) wash = 1 - outCubic(prog(f, 337, 345));
      L.wash.style.opacity = wash.toFixed(3);

      // ---------------------------------------------------------- A
      if (fi <= 46) {
        const p = prog(f, 0, 47);
        aWrap.style.transformOrigin = "1400px 330px";
        aWrap.style.transform = `translateY(${lerp(6, -12, p).toFixed(2)}px) scale(${lerp(1.035, 1.0, p).toFixed(4)})`;
        place(aL1, 1010, 96);
        aL1W.forEach((w, i) => show(w, fi >= A_AT.l1[i]));
        place(aL2, 1010, 180);
        aL2W.forEach((w, i) => show(w, fi >= A_AT.l2[i]));
        heroIn(aHero, f, A_AT.hero, INK, 996, 262);
      }

      // ---------------------------------------------------------- B
      if (fi >= 47 && fi <= 107) {
        const p = prog(f, 47, 108);
        bArcs.style.opacity = (0.55 + 0.35 * Math.sin(f * 0.21) * Math.sin(f * 0.07 + 1)).toFixed(3);
        bRoom.style.transformOrigin = "960px 540px";
        bRoom.style.transform = `scale(${lerp(1.0, 1.06, p).toFixed(4)})`;
        // the word lands big and settles, drifting left; each letter lands green and is swept white
        const k = outExpo(prog(f, 47, 60));
        const sc = lerp(1.14, 1.0, k) - 0.03 * p;
        bWord.style.transformOrigin = "50% 50%";
        place(bWord, 960 - B_W1 / 2 - 30 * p + 40 * (1 - k), 540 - 110, ` scale(${sc.toFixed(4)})`);
        writeOn(bWordC, B_AT1, f, fi, WHITE, 3, 8);
        // the card opens from inside the word, then keeps growing slowly
        const on = f >= 77;
        disp(bCard, on);
        if (on) {
          const q = outExpo(prog(f, 77, 89));
          const w = lerp(150, CW2, q) * lerp(1, 1.06, prog(f, 89, 108));
          const h = lerp(96, CH2, q) * lerp(1, 1.06, prog(f, 89, 108));
          bCard.style.width = w + "px"; bCard.style.height = h + "px";
          place(bCard, 960 - w / 2, 545 - h / 2);
          const svg = bCard.querySelector("svg");
          svg.style.transformOrigin = "0 0";
          svg.style.transform = `translate(${((w - CW2 * 1.06) / 2).toFixed(1)}px, ${((h - CH2 * 1.06) / 2).toFixed(1)}px) scale(1.06)`;
          const ww = 6 * 128 * 0.97;
          place(bCardWord, w / 2 - ww / 2, h / 2 - 70);
          writeOn(bCardC, B_AT2, f, fi, WHITE, 3, 8);
        }
      }

      // ---------------------------------------------------------- C
      if (fi >= 108 && fi <= 170) {
        const p = prog(f, 108, 171);
        cWrap.style.transformOrigin = "990px 820px";
        cWrap.style.transform = `translateY(${lerp(0, -16, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        place(cL1, 990 - (4.4 * 62) / 2, 668);
        cL1W.forEach((w, i) => show(w, fi >= C_AT.l1[i]));
        // 逆向: the key word comes in mirrored and flips the right way round as it lands
        const flip = outExpo(prog(f, C_AT.hero, C_AT.hero + 8));
        const heroW = 224 * 3.62 * 0.8;
        heroIn(cHero, f, C_AT.hero, CREAM, 990 - heroW / 2, 734, lerp(-0.8, 0.8, flip));
        cHero.style.transformOrigin = `${(heroW / 0.8 / 2).toFixed(1)}px 50%`;
        place(cL3, 990 - (3 * 62) / 2, 948);
        cL3W.forEach((w, i) => show(w, fi >= C_AT.l3[i]));
      }

      // ---------------------------------------------------------- D
      if (fi >= 171 && fi <= 236) {
        place(dThin, 1090, 150);
        writeOn(dThinC, D_THIN, f, fi, INK);
        const p = prog(f, 204, 237);
        dHero.style.transformOrigin = "0 0";
        place(dHero, 1000 - 30 * p, 232, ` scale(${lerp(1.04, 0.965, p).toFixed(4)})`);
        writeOn(dHeroC, D_AT, f, fi, INK, 3, 6);
      }

      // ---------------------------------------------------------- E
      if (fi >= 237 && fi <= 275) {
        // the 5 lands on 第 and keeps growing slowly, as the reference's 2X does
        const p = prog(f, 253, 276);
        const hp = outExpo(prog(f, 253, 259));
        disp(eNum, f >= 253);
        eNum.style.color = rgb(flashColor(f, 253, GREEN));
        eNum.style.filter = hp < 1 ? `blur(${(10 * (1 - hp)).toFixed(2)}px)` : "none";
        eNum.style.transformOrigin = "50% 60%";
        place(eNum, 1060, 40 + 70 * (1 - hp), ` scale(${lerp(1.0, 1.07, p).toFixed(4)})`);
        // the pill: grows as the words are typed into it, and drifts up with the number
        const n = E_AT.filter((a) => fi >= a).length;
        const pw = ePillW(f);
        ePill.style.width = pw + "px"; ePill.style.height = "112px";
        place(ePill, 1300 - pw / 2, 452 - 12 * prog(f, 237, 276));
        eTxtC.forEach((c, i) => show(c, i < n));
        eTxt.style.transform = `translate(${(-(n * E_CW) / 2).toFixed(1)}px, -54%)`;
      }

      // ---------------------------------------------------------- F
      if (fi >= 276 && fi <= 336) {
        const p = prog(f, 276, 337);
        fWorld.style.transform = `translate(${lerp(0, -20, p).toFixed(2)}px, ${lerp(0, -14, p).toFixed(2)}px) scale(${lerp(1.0, 1.06, p).toFixed(4)})`;
        place(fSmall, 960 - (6 * 70) / 2, 350);
        writeOn(fSmallC, F_SMALL, f, fi, INK);
        const on = f >= 306;
        disp(fBox, on);
        if (on) {
          const h = F_BOX_H * outCubic(prog(f, 306, 308));
          const w = lerp(4, F_BOX_W, outExpo(prog(f, 307, 316)));
          fBox.style.width = w + "px"; fBox.style.height = h + "px";
          place(fBox, 960 - w / 2, 540 - h / 2);
          const dark = inOut(prog(f, 311, 317));
          fBox.style.background = rgb(mix(BOXGREEN, BOXBLACK, dark));
          fBox.querySelector(".tex").style.opacity = (0.5 * dark).toFixed(3);
          fBoxTxt.style.transform = `translate(${((w - (F_BOX_W - 100)) / 2).toFixed(1)}px, -54%)`;
          writeOn(fBoxC, F_AT, f, fi, WHITE, 3, 8);
        }
      }

      // ---------------------------------------------------------- G
      if (fi >= 337 && fi <= 389) {
        const p = prog(f, 337, 390);
        gWrap.style.transform = `translate(${lerp(10, -14, p).toFixed(2)}px, ${lerp(10, -18, p).toFixed(2)}px)`;
        G_LINES.forEach((ln) => {
          place(ln.e, ln.x, ln.y);
          writeOn(ln.cs, ln.ats, f, fi, INK);
        });
      }

      // ---------------------------------------------------------- H
      if (fi >= 390) {
        const p = prog(f, 390, 442);
        hWrap.style.transformOrigin = "850px 860px";
        hWrap.style.transform = `translateY(${lerp(0, -14, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        const fadeAll = prog(f, H_AT.gone + 6, H_AT.gone + 14);
        place(hL1, 850 - (4 * 62) / 2, 722);
        hL1.style.opacity = (1 - fadeAll).toFixed(3);
        hL1W.forEach((w, i) => show(w, fi >= H_AT.l1[i]));
        const heroW = 232 * 3 * 0.8;
        heroIn(hHero, f, H_AT.hero, CREAM, 850 - heroW / 2, 790);
        // forgotten: each character blurs, lifts and fades away in turn
        hHeroC.forEach((c, i) => {
          const g = inOut(prog(f, H_AT.gone + i * 3, H_AT.gone + i * 3 + 9));
          c.style.opacity = (1 - g).toFixed(3);
          c.style.filter = g > 0 ? `blur(${(22 * g).toFixed(2)}px)` : "none";
          c.style.transform = `translateY(${(-46 * g).toFixed(2)}px) scale(${(1 + 0.18 * g).toFixed(3)})`;
        });
      }
    }

    // GSAP proxy tween drives the frame so HyperFrames seeks redraw deterministically
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
