// Tallo — 14.67 s promo, 30 fps, 440 frames. A shot-for-shot rebuild of a reference After Effects edit:
// every position, scale, tilt and blur below is keyed per frame from measurements of the reference.
//   0–36     "We've all been there..." writes on (blue, italic, two swishes), the gaps squeeze, then it drifts off right
//   36–70    a phone spins in, emoji chips fly out of it, it settles, the chips fly up and the phone tips flat
//   70–113   vertical streaks; a Bills list builds while drifting up-left, then a cut to a close-up
//   108–141  the second check turns red and becomes a calendar dot; dates slide under it to the 21st
//   141–214  scanline glitch; "Late fees again" / "What if your money just" / "sorted itself?"
//   214–299  dark: magenta blades and three cards (Budget, Bills, Savings) on a panning strip
//   299–383  "All in one place", then Smart / Simple / Secure
//   383–440  the frame shrinks into the app icon, then the glowing wordmark shrinks away
(function () {
  const FPS = 30, FRAMES = 440, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const sm = (t) => (t = clamp(t, 0, 1), t * t * (3 - 2 * t));
  const hex = (s) => (s[0] === "#" ? [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) : s.match(/[\d.]+/g).slice(0, 3).map(Number));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); t = clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  // smooth lookup through [frame, value] pairs: a monotone cubic (Fritsch–Carlson) that passes through every
  // measured point with continuous speed and never overshoots, so moves ease like graph-editor curves
  const slope = (pts, i) => (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]);
  const tangent = (pts, k) => {
    const n = pts.length;
    if (n < 2) return 0;
    if (k === 0) return slope(pts, 0);
    if (k === n - 1) return slope(pts, n - 2);
    const d0 = slope(pts, k - 1), d1 = slope(pts, k);
    if (d0 * d1 <= 0) return 0;
    const h0 = pts[k][0] - pts[k - 1][0], h1 = pts[k + 1][0] - pts[k][0];
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const keys = (f, pts) => {
    if (f <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], h = x1 - x0, t = (f - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * tangent(pts, i - 1) + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * tangent(pts, i);
    }
    return pts[pts.length - 1][1];
  };
  const rel = (pts, base) => pts.map(([a, v]) => [a + base, v]);
  // light 1-2-1 pass over a measured glide, to take out per-frame reading error (endpoints stay put)
  const smoothPts = (pts, passes = 1) => {
    let p = pts.map((q) => q.slice());
    for (let k = 0; k < passes; k++) p = p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [q[0], 0.25 * p[i - 1][1] + 0.5 * q[1] + 0.25 * p[i + 1][1]]));
    return p;
  };
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

  const INK = "#22252b", BLUE = "#3a8fd8", BLUE2 = "#86c6f2", GRAY = "#8c8c93";

  const ICON = {
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M16 14h2"/><path d="M6 6l9-3 1.5 3"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    piggy: '<path d="M5 11a7 6 0 0112-3l3-1-1 3.5c.6.7 1 1.6 1 2.5h1.5v3H20a7 6 0 01-3 2.6V21h-3v-1.6a8 8 0 01-3 0V21H8v-2.2A6 6 0 015 13.5H3v-2.5z"/><circle cx="15.5" cy="11" r=".8"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    // home-screen glyphs (generic, drawn here)
    handset: '<path d="M6.5 3.5l3 3-2 2.5a12 12 0 006.5 6.5l2.5-2 3 3-2 3C11 19 5 13 3.5 5.5z" fill="currentColor" stroke="none"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>',
    bubble: '<path d="M12 4c5 0 8.5 3 8.5 7s-3.5 7-8.5 7c-1 0-2-.1-2.9-.4L5 19.5l1.2-3.6C4.6 14.6 3.5 12.9 3.5 11 3.5 7 7 4 12 4z" fill="currentColor" stroke="none"/>',
    note: '<path d="M9 17V6l10-2v11" /><circle cx="7" cy="17" r="2.2" fill="currentColor"/><circle cx="17" cy="15" r="2.2" fill="currentColor"/>',
    camera: '<rect x="3" y="7" width="18" height="12" rx="2.5"/><circle cx="12" cy="13" r="3.3"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    lines: '<path d="M6 7h12M6 11h12M6 15h8"/>',
    screen: '<rect x="3" y="5" width="18" height="11" rx="2"/><path d="M9 20h6"/>',
    waves: '<circle cx="12" cy="11" r="2"/><path d="M8.5 14.5a5 5 0 117 0M6 17a8.5 8.5 0 1112 0"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 016 0"/>',
    mail: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    pin: '<path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>',
    list: '<circle cx="6" cy="7" r="1.2" fill="currentColor"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="6" cy="17" r="1.2" fill="currentColor"/><path d="M10 7h9M10 12h9M10 17h9"/>',
    heart: '<path d="M12 20s-7.5-4.5-7.5-10A4.2 4.2 0 0112 7.5 4.2 4.2 0 0119.5 10c0 5.5-7.5 10-7.5 10z" fill="currentColor" stroke="none"/>',
    mountain: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 17l5.5-6 4 4 2.5-2.5 5 4.5"/><circle cx="16" cy="9" r="1.5"/>',
    sun: '<circle cx="10" cy="10" r="3.5"/><path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17"/><path d="M11 19h7a3 3 0 000-6 4 4 0 00-6.5-.5" fill="#fff"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2"/>',
  };
  const svgIcon = (name, stroke = "#fff", sw = 2) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" color="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const canvas = (parent, w, h) => { const c = el("canvas", "full", parent); c.width = w; c.height = h; return c; };

    // ---------- backgrounds ----------
    const waveC = canvas(stage, 240, 135), waveCtx = waveC.getContext("2d"), waveImg = waveCtx.createImageData(240, 135);
    const flat = el("div", "layer", stage); flat.id = "flat";
    const dark = el("div", "layer", stage); dark.id = "dark";
    const bladeC = canvas(stage, 960, 540), bladeCtx = bladeC.getContext("2d");

    // ---------- kinetic text ----------
    const textLayer = el("div", "layer", stage);
    const meas = el("span", "", textLayer); meas.style.cssText = "position:absolute;left:-9999px;top:0;white-space:nowrap;font-weight:540;letter-spacing:-0.02em;font-size:100px";
    // font size that makes the reference phrase as wide as it is in the reference frame
    const fitFont = (ref, target) => {
      meas.innerHTML = ref.split(" ").map((w, i, a) => `<span style="margin-right:${i < a.length - 1 ? 0.26 : 0}em">${w}</span>`).join("");
      return 100 * target / meas.getBoundingClientRect().width;
    };
    function makeLine(words, size) {
      const line = el("div", "kline", textLayer);
      line.style.fontSize = size + "px";
      const ws = words.map((w) => { const span = el("span", "kword", line); return { span, letters: [...w].map((ch) => el("span", "lt", span, ch)) }; });
      return { line, ws, size };
    }
    // a word lands blue, italic, oversized and soft, then settles; it turns ink at darkAt (an absolute frame)
    function landWord(w, f, inAt, darkAt, extra = {}) {
      const a = f - inAt;
      if (a < 0) { w.span.style.opacity = 0; return; }
      const p = 1 - Math.exp(-a / 1.6);
      const blue = mix(BLUE2, BLUE, a / 2.5);
      const d = ramp(f, darkAt, darkAt + 2.5);
      const out = extra.out || 0, lift = extra.lift ?? 0.16, big = extra.big ?? 0.28;
      w.span.style.opacity = (clamp(a / 1.5, 0, 1) * (1 - out)).toFixed(3);
      w.span.style.color = out > 0 ? mix(INK, GRAY, out * 2) : mix(blue, INK, d);
      const slide = (extra.slide ?? 1.1) * Math.exp(-a / 1.25);
      w.span.style.transform = `translate(${(slide + 0.06 * (1 - p)).toFixed(3)}em, ${(lift * (1 - p) - 0.35 * out).toFixed(3)}em) skewX(${(-13 * (1 - p)).toFixed(2)}deg) scale(${(1 + big * (1 - p)).toFixed(4)})`;
      w.span.style.filter = blurOf(1.6 * (1 - p) + 3 * out);
    }
    // gap: em between words; x: {left} or {cx}; returns the laid-out width
    function placeLine(L0, show, o = {}) {
      L0.line.style.display = show ? "block" : "none";
      if (!show) return 0;
      if (o.gap != null) L0.ws.forEach((w, i) => (w.span.style.marginRight = i < L0.ws.length - 1 ? o.gap.toFixed(3) + "em" : "0"));
      const w = L0.line.offsetWidth;
      const left = o.left != null ? (o.cx != null ? lerp(o.left, o.cx - w / 2, o.blend || 0) : o.left) : o.cx - w / 2;
      L0.line.style.transform = `translate(${px(left)}, -50%) translateY(${px(o.dy || 0)}) rotate(${(o.rot || 0).toFixed(2)}deg) scale(${(o.s || 1).toFixed(4)})`;
      L0.line.style.filter = blurOf(o.blur || 0);
      L0.line.style.opacity = o.alpha ?? 1;
      if (o.color) L0.line.style.color = o.color;
      return w;
    }

    const F1 = fitFont("We've all been there...", 672);
    const F2 = fitFont("What if everything just", 672);
    const F2a = fitFont("Not to miss", 422);
    const F2c = fitFont("worked together?", 650);
    const F3 = fitFont("All in one place", 461);
    const T1 = makeLine(["We've", "all", "been", "there..."], F1);
    const T2a = makeLine(["Late", "fees", "again"], F2a);
    const T2b = makeLine(["What", "if", "your", "money", "just"], F2);
    const T2c = makeLine(["sorted", "itself?"], F2c);
    const T3 = makeLine(["All", "in", "one", "place"], F3);
    const T4 = ["Smart", "Simple", "Secure"].map((w) => makeLine([w], 98));
    // the two swishes that lead the first line on
    const arcSvg = el("div", "", textLayer, `<svg class="arcs" viewBox="0 0 1920 1080"><path id="arcA" fill="none" stroke="#3d8fdc" stroke-width="5" stroke-linecap="round"/><path id="arcB" fill="none" stroke="#3d8fdc" stroke-width="5" stroke-linecap="round"/></svg>`);
    const arcA = arcSvg.querySelector("#arcA"), arcB = arcSvg.querySelector("#arcB");

    // ---------- phone ----------
    const phoneWrap = el("div", "layer", stage); phoneWrap.id = "phoneWrap";
    const phoneView = el("div", "layer view", phoneWrap);
    const rig = el("div", "", phoneView); rig.id = "rig";
    const PW = 380, PH = 790, PR = 64, TH = 40;
    el("div", "face back", rig);
    // the metal band: short slices around the rounded outline, each standing on edge and facing outwards
    {
      const pts = [];
      const add = (x, y) => pts.push([x, y]);
      const arc = (cx, cy, a0, a1) => { for (let k = 0; k <= 8; k++) { const a = lerp(a0, a1, k / 8); add(cx + PR * Math.cos(a), cy + PR * Math.sin(a)); } };
      const line = (x0, y0, x1, y1, n) => { for (let k = 1; k < n; k++) add(lerp(x0, x1, k / n), lerp(y0, y1, k / n)); };
      arc(PW - PR, PR, -Math.PI / 2, 0); line(PW, PR, PW, PH - PR, 14);
      arc(PW - PR, PH - PR, 0, Math.PI / 2); line(PW - PR, PH, PR, PH, 6);
      arc(PR, PH - PR, Math.PI / 2, Math.PI); line(0, PH - PR, 0, PR, 14);
      arc(PR, PR, Math.PI, 1.5 * Math.PI); line(PR, 0, PW - PR, 0, 6);
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        const len = Math.hypot(x1 - x0, y1 - y0) + 1.6, th = Math.atan2(y1 - y0, x1 - x0);
        const nx = Math.sin(th), ny = -Math.cos(th); // outward normal (clockwise outline)
        const lit = clamp(0.55 + 0.45 * (-0.8 * nx - 0.45 * ny), 0, 1);
        const s = el("div", "seg", rig);
        s.style.width = px(len); s.style.height = px(TH);
        s.style.background = `linear-gradient(180deg, ${mix("#1f4766", "#5f93b8", lit)}, ${mix("#3a6c90", "#c7e0ef", lit)} 45%, ${mix("#2a5678", "#8db8d4", lit)} 60%, ${mix("#173a56", "#4d7ea3", lit)})`;
        s.style.transform = `translate3d(${px((x0 + x1) / 2 - len / 2)}, ${px((y0 + y1) / 2 - TH / 2)}, 0) rotateZ(${th.toFixed(4)}rad) rotateX(90deg)`;
      }
    }
    const front = el("div", "face front", rig);
    const screen = el("div", "screen", el("div", "bezel", front));
    // optional drop-in: assets/user/phone-screen.png (your own screenshot, 1179x2556 or any ~9:19.5 image) replaces the drawn home screen
    const userShot = el("div", "usershot", screen);
    el("div", "island", screen);
    el("div", "sbar", screen, `<span>9:41</span><span style="letter-spacing:2px">▮▮▮ ◔ ▭</span>`);
    const home = el("div", "home", screen);
    home.insertAdjacentHTML("beforeend", `<div class="widget"><div class="ring"></div><b>100%</b></div>`);
    const APPS = [
      ["camera", "#3a3d44", "#cfd3da", "Camera"], ["clock", "#111215", "#ffffff", "Clock"],
      ["lines", "#fff7d6", "#e2a400", "Notes"], ["screen", "#111215", "#ffffff", "Video"],
      ["waves", "#8e4ee8", "#ffffff", "Radio"], ["bag", "#1d8cf0", "#ffffff", "Store"], ["mail", "#2d8ff5", "#ffffff", "Mail"], ["pin", "#38c172", "#ffffff", "Maps"],
      ["gear", "#8a8f99", "#ffffff", "Settings"], ["layers", "#3c4fd8", "#ffffff", "Flows"], ["list", "#ffffff", "#ff8a00", "Lists"], ["heart", "#ffffff", "#ff3b5c", "Health"],
      ["mountain", "#f4f4f6", "#3da5ff", "Gallery"], ["sun", "#3b9cf0", "#ffd84a", "Weather"], ["calc", "#2a2c31", "#ff9f0a", "Calc"], ["note", "#ff3e57", "#ffffff", "Tunes"],
    ];
    APPS.forEach(([g, bg, fg, name]) => home.insertAdjacentHTML("beforeend", `<div class="ic"><i style="background:${bg}">${svgIcon(g, fg, 2)}</i><span>${name}</span></div>`));
    const dock = el("div", "dock", screen);
    [["handset", "#33c759"], ["compass", "#1e8cf0"], ["bubble", "#33c759"], ["note", "#fc3c5a"]].forEach(([g, bg]) =>
      dock.insertAdjacentHTML("beforeend", `<div class="ic"><i style="background:${bg}">${svgIcon(g, "#fff", 2)}</i></div>`));

    // chips live on their own rig: they follow the phone's turn but not its tip-back
    const chipRig = el("div", "", el("div", "layer view", phoneWrap)); chipRig.id = "chipRig";
    const CHIPS = [
      { t: "Rent Due", e: "🏠", x: 350, y: 100, z: 90, in: 39, fly: 58, D: 950, dx: 170, rot: -12 },
      { t: "Groceries", e: "🛒", x: -18, y: 194, z: 120, in: 43, fly: 59.5, D: 190, dx: -30, rot: -4, hold: 1 },
      { t: "Savings", e: "🐷", x: 486, y: 233, z: 60, in: 40, fly: 58, D: 900, dx: 190, rot: -14, r0: -2 },
      { t: "Gifts", e: "🎁", x: -10, y: 410, z: 230, in: 44, fly: 59, D: 760, dx: -60, rot: 8, dof: 2.4 },
      { t: "Travel", e: "✈️", x: 408, y: 418, z: 80, in: 40.5, fly: 61.5, D: 560, dx: 40, rot: -6 },
      { t: "Subscriptions", e: "🔁", x: 346, y: 616, z: 100, in: 41, fly: 62, D: 420, dx: 30, rot: 5 },
    ];
    CHIPS.forEach((c) => { c.el = el("div", "chip", chipRig, `<span class="emo">${c.e}</span>${c.t}`); });

    // ---------- bills list ----------
    const tasks = el("div", "layer", stage);
    const tlist = el("div", "", tasks); tlist.id = "tlist";
    const ttl = el("div", "ttl", tlist);
    const ttlLetters = [..."Bills"].map((ch) => el("span", "", ttl, ch));
    const ROWS = [["Pay rent", 1], ["Renew phone plan", 1], ["Electricity bill", 0], ["Credit card due", 1], ["Review subscriptions", 0]];
    const ROW_Y = (i) => 121 + 110 * i, CK = 26;
    const rows = ROWS.map(([t, on], i) => {
      const r = el("div", "row", tlist, `<span class="ck ${on ? "on" : "off"}">${on ? svgIcon("check", "#fff", 3) : ""}</span><span>${t}</span>`);
      r.style.top = px(ROW_Y(i) - 30);
      return { r, ck: r.firstChild, txt: r.lastChild };
    });

    // ---------- calendar ----------
    const cal = el("div", "layer", stage);
    const nums = [];
    for (let r = -1; r <= 1; r++) for (let d = 8; d <= 28; d++) { const v = d + 7 * r; if (v >= 1 && v <= 31) nums.push({ d, r, e: el("div", "num", cal, String(v)) }); }
    const dot = el("div", "", cal); dot.id = "dot";

    // ---------- cards ----------
    const cardsL = el("div", "layer", stage); cardsL.id = "cards";
    const CARDS = [
      ["Budget", "wallet", [[217, 1.09], [218, 1.0], [219, 0.955], [220, 0.905], [221, 0.86], [222, 0.84], [223, 0.815], [224, 0.79], [225, 0.77], [226, 0.75], [227, 0.73], [228, 0.71], [230, 0.68], [232, 0.655], [234, 0.635], [236, 0.615], [238, 0.6], [240, 0.585], [242, 0.57], [244, 0.555], [246, 0.54], [248, 0.5], [249, 0.47], [250, 0.43], [251, 0.39], [252, 0.345], [253, 0.3], [254, 0.28], [255, 0.255], [256, 0.24], [257, 0.225], [258, 0.215], [260, 0.2], [263, 0.19], [266, 0.175], [269, 0.155], [272, 0.135], [274, 0.115], [275, 0.1], [276, 0.075], [277, 0.035], [278, -0.005], [279, -0.05], [280, -0.09], [282, -0.16]]],
      ["Bills", "receipt", [[245, 1.1], [246, 1.035], [247, 1.015], [248, 0.985], [249, 0.955], [250, 0.905], [251, 0.84], [252, 0.78], [253, 0.73], [254, 0.69], [255, 0.66], [256, 0.635], [257, 0.62], [258, 0.61], [260, 0.59], [263, 0.56], [266, 0.545], [269, 0.525], [272, 0.5], [273, 0.495], [274, 0.48], [275, 0.465], [276, 0.44], [277, 0.41], [278, 0.37], [279, 0.32], [280, 0.29], [281, 0.27], [282, 0.24], [283, 0.235], [284, 0.225], [285, 0.21], [286, 0.2], [287, 0.185], [288, 0.18], [290, 0.165], [292, 0.135], [294, 0.105], [295, 0.085], [296, 0.055], [297, 0.02], [298, -0.025], [299, -0.07]]],
      ["Savings", "piggy", [[273, 1.1], [274, 1.0], [275, 0.955], [276, 0.925], [277, 0.875], [278, 0.82], [279, 0.77], [280, 0.72], [281, 0.685], [282, 0.66], [283, 0.635], [284, 0.62], [285, 0.6], [286, 0.59], [287, 0.57], [288, 0.56], [290, 0.54], [292, 0.51], [294, 0.47], [296, 0.43], [297, 0.39], [298, 0.345], [299, 0.3]]],
    ].map(([t, ic, xs]) => {
      const c = el("div", "card", cardsL, `<div class="band"></div><div class="in">${svgIcon(ic, "#d9d9de", 1.6)}<b>${t}</b></div>`);
      return { el: c, inner: c.querySelector(".in"), xs: [xs[0], ...smoothPts(xs.slice(1))], e: xs[0][0] + 1 };
    });
    const cardX = (i, f) => keys(f, CARDS[i].xs) * W;

    // ---------- logo + wordmark ----------
    const logoL = el("div", "layer", stage);
    const icon = el("div", "", logoL); icon.id = "icon";
    const iconBg = el("canvas", "", icon); iconBg.id = "iconBg"; iconBg.width = 240; iconBg.height = 194;
    const iconCtx = iconBg.getContext("2d");
    // Tallo mark: a T built from rounded bars, with a coin dropping beside the stem
    const tile = el("div", "", icon, `<svg viewBox="0 0 100 100"><g id="markG" fill="#111214"><rect x="10" y="14" width="80" height="22" rx="11"/><rect x="36" y="14" width="23" height="74" rx="11.5"/><circle cx="76" cy="70" r="13"/></g></svg>`);
    tile.id = "tile";
    const markG = tile.querySelector("#markG");
    // optional drop-in: assets/user/logo.png replaces the Tallo mark on the app icon
    const userLogo = el("div", "userlogo", tile);
    const probe = (src, onOk) => { const im = new Image(); im.onload = () => { onOk(); render(R0._f); }; im.src = src; };
    probe("assets/user/phone-screen.png", () => { userShot.style.display = "block"; screen.classList.add("has-shot"); });
    probe("assets/user/logo.png", () => { userLogo.style.display = "block"; tile.querySelector("svg").style.display = "none"; });
    const glow = el("div", "", logoL); glow.id = "glow";
    const wordmark = el("div", "", logoL, "tallo.app"); wordmark.id = "wordmark";
    // scale the wordmark so it opens as wide as the reference's (790 px)
    meas.style.fontWeight = 700; meas.style.letterSpacing = "-0.035em"; meas.innerHTML = "tallo.app"; meas.style.fontSize = "196px";
    const WM_FIT = 790 / meas.getBoundingClientRect().width;

    const fxC = canvas(stage, W, H), fxCtx = fxC.getContext("2d");

    // ---------- painters ----------
    const TOP = hex("#e2e1e7"), BAND = hex("#ecebf1"), BL1 = hex("#b2d9ec"), BL2 = hex("#82c2de");
    function paintWave(f) {
      const w = 240, h = 135, d = waveImg.data;
      const tilt = keys(f, [[0, 1.15], [60, 0.8], [140, 0.7], [214, 0.3], [300, 0.05], [384, -0.05]]);
      for (let x = 0; x < w; x++) {
        const u = x / (w - 1);
        const edge = 0.74 + tilt * (0.5 - u) * 0.62 + 0.07 * Math.sin(2 * Math.PI * (0.8 * u - 0.011 * f) + 0.6) + 0.03 * Math.sin(2 * Math.PI * (1.7 * u + 0.017 * f) + 1.3);
        for (let y = 0; y < h; y++) {
          const v = y / (h - 1), k = (v - edge) / 0.16;
          const t = sm((k + 0.7) / 1.9), hl = 0.28 * Math.exp(-Math.pow((k + 0.35) / 0.55, 2)), deep = clamp((v - edge) / 0.45, 0, 1);
          const i = (y * w + x) * 4;
          for (let ch = 0; ch < 3; ch++) d[i + ch] = lerp(lerp(TOP[ch], lerp(BL1[ch], BL2[ch], deep), t), BAND[ch], hl * (1 - t));
          d[i + 3] = 255;
        }
      }
      waveCtx.putImageData(waveImg, 0, 0);
    }

    // a soft magenta blade (half-res canvas): centre, length and width in px, angle in degrees
    function blade(x, y, len, wid, ang, alpha) {
      if (alpha <= 0.01) return;
      const c = bladeCtx;
      c.save(); c.translate(x / 2, y / 2); c.rotate(ang * Math.PI / 180);
      const L = len / 2, Wd = wid * 0.9;
      const g = c.createLinearGradient(-L / 2, 0, L / 2, 0);
      g.addColorStop(0, `rgba(120,40,235,${0.15 * alpha})`);
      g.addColorStop(0.45, `rgba(150,40,230,${0.75 * alpha})`);
      g.addColorStop(0.8, `rgba(225,25,205,${alpha})`);
      g.addColorStop(1, `rgba(245,60,215,${0.85 * alpha})`);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -Wd, L / 2, 0); c.quadraticCurveTo(0, -Wd * 0.25, -L / 2, 0); c.fill();
      c.restore();
    }
    const BL = (f, k) => keys(f, k);
    function paintBlades(f) {
      bladeCtx.clearRect(0, 0, 960, 540);
      bladeCtx.filter = "blur(15px)";
      // intro: a blob drops in, splits into two leaning blades, swings into a wedge on the first card's edge, then curls away
      const A = [[213, 0], [214, 0.9], [216, 0.95], [218, 1], [228, 0.95], [234, 0.85], [237, 0.6], [240, 0.35], [244, 0.15], [247, 0]];
      blade(BL(f, [[213, 0.53], [216, 0.55], [218, 0.555], [220, 0.53], [222, 0.47], [225, 0.45], [228, 0.42], [231, 0.40], [234, 0.38], [237, 0.39], [240, 0.41]]) * W,
        BL(f, [[213, 0.47], [216, 0.47], [218, 0.45], [220, 0.5], [222, 0.55], [225, 0.57], [228, 0.52], [234, 0.55], [240, 0.5]]) * H,
        BL(f, [[213, 0.24], [216, 0.27], [218, 0.4], [220, 0.52], [222, 0.64], [225, 0.6], [228, 0.44], [234, 0.44], [237, 0.36], [240, 0.26]]) * H,
        BL(f, [[213, 0.12], [216, 0.13], [218, 0.1], [220, 0.085], [222, 0.08], [225, 0.12], [228, 0.14], [234, 0.12], [240, 0.1]]) * W,
        BL(f, [[213, -40], [216, -55], [218, -70], [220, -62], [222, -52], [225, -45], [228, -15], [231, -5], [234, 127], [237, 120], [240, 115]]), BL(f, A));
      blade(BL(f, [[218, 0.42], [220, 0.38], [222, 0.36], [225, 0.36]]) * W, BL(f, [[218, 0.5], [220, 0.55], [222, 0.6], [225, 0.62]]) * H,
        BL(f, [[218, 0.2], [220, 0.35], [222, 0.45], [225, 0.35]]) * H, 0.05 * W, BL(f, [[218, -60], [220, -58], [222, -52]]),
        BL(f, [[217, 0], [218, 0.6], [220, 0.7], [222, 0.6], [225, 0.3], [228, 0]]));
      // each later card drags a near-vertical blade along its left edge, behind the gap
      [1, 2].forEach((i) => {
        const e = CARDS[i].e, x = cardX(i, f) - 0.175 * W;
        blade(x, 0.5 * H, 0.5 * H, 0.05 * W, keys(f, rel([[-2, -60], [4, -70], [10, -82], [20, -88]], e)),
          keys(f, rel([[-4, 0], [-2, 0.5], [0, 0.85], [3, 1], [8, 0.85], [14, 0.5], [22, 0.2], [28, 0]], e)));
      });
      // a last streak lights the top-right of the final card
      blade(cardX(2, f) + 0.1 * W, 0.22 * H, 0.25 * H, 0.04 * W, -30, keys(f, [[292, 0], [296, 0.6], [298.5, 0.9]]));
      bladeCtx.filter = "none";
    }

    const R = rng(11);
    const STREAKS = Array.from({ length: 90 }, () => ({ x: R() * W, w: 1 + R() * 2.5, y0: -200 + R() * H * 0.7, len: 300 + R() * 900, a: 0.1 + R() * 0.35, ph: R() * 6 }));
    function paintFx(f) {
      fxCtx.clearRect(0, 0, W, H);
      const st = keys(f, [[68, 0], [69.5, 1], [72, 0.8], [75, 0.4], [79, 0]]);
      if (st > 0) STREAKS.forEach((s) => {
        const a = s.a * st * (0.6 + 0.4 * Math.sin(f * 1.7 + s.ph));
        fxCtx.fillStyle = `rgba(118,118,128,${a.toFixed(3)})`;
        fxCtx.fillRect(s.x, s.y0 + (f - 69) * 40, s.w, s.len);
      });
      const scan = Math.max(keys(f, [[136.5, 0], [137.5, 0.4], [139, 0.8], [140, 1], [141, 0.6], [142, 0]]), keys(f, [[298.5, 0], [299, 1], [300, 1], [301, 0.5], [302, 0]]));
      if (scan > 0) {
        fxCtx.fillStyle = `rgba(198,198,204,${(0.5 * scan).toFixed(3)})`; fxCtx.fillRect(0, 0, W, H);
        fxCtx.fillStyle = `rgba(105,105,115,${(0.5 * scan).toFixed(3)})`;
        for (let y = (f * 3) % 8; y < H; y += 8) fxCtx.fillRect(0, y + 2 * Math.sin(y * 0.05 + f), W, 2.6);
      }
    }

    // ---------- the frame ----------
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);

      // backgrounds
      const light = f < 69.5 || (f >= 140.5 && f < 214) || (f >= 299 && f < 384);
      waveC.style.display = light ? "block" : "none";
      if (light) paintWave(f); else if (f >= 383 && f < 392) paintWave(383);
      flat.style.display = (f >= 64 && f < 140.5) ? "block" : "none";
      flat.style.opacity = f < 69.5 ? ramp(f, 64, 69) : 1;
      dark.style.display = (f >= 214 && f < 299) || f >= 383 ? "block" : "none";
      dark.style.background = mix("#131418", "#000000", ramp(f, 437, 439));
      bladeC.style.display = f >= 213 && f < 299 ? "block" : "none";
      if (f >= 213 && f < 299) paintBlades(f);

      // ---- "We've all been there..." ----
      {
        const show = f >= 3.5 && f < 37;
        const cx = 960 + keys(f, [[13, 0], [17, 10], [20, 38], [24, 96], [28, 192], [30, 269], [32, 355], [34, 499], [35, 576], [36, 700]]);
        placeLine(T1, show, {
          gap: keys(f, [[0, 0.45], [10, 0.42], [12, 0.3], [15, 0.12], [17.5, 0.03], [19, 0.12], [20.5, 0.26]]),
          left: 0.31 * W, cx, blend: sm(ramp(f, 9.5, 13)), dy: 0,
          blur: keys(f, [[23, 0], [26, 1.5], [29, 3], [32, 5], [34, 8], [36, 12]]), alpha: keys(f, [[33, 1], [35.5, 0.5], [37, 0]]),
        });
        if (show) {
          const fade = ramp(f, 27, 35);
          [4, 6.5, 8, 10].forEach((s, i) => landWord(T1.ws[i], f, s, [7.5, 10, 10.5, 13.5][i]));
          if (fade > 0) T1.ws.forEach((w) => (w.span.style.color = mix(INK, "#55565c", fade)));
        }
        // swishes: one trails under the line, one leads above it
        const aA = keys(f, [[2.5, 0], [3, 1], [6, 1], [8, 0.6], [9, 0]]), aB = keys(f, [[2.5, 0], [3, 1], [8, 1], [10, 0.7], [11.5, 0]]);
        const xa0 = keys(f, [[3, 0.21], [5, 0.22], [6, 0.28], [7, 0.31], [8, 0.35]]) * W, xa1 = keys(f, [[3, 0.245], [4, 0.26], [5, 0.26], [6, 0.33], [7, 0.34], [8, 0.37]]) * W;
        const xb0 = keys(f, [[3, 0.48], [5, 0.5], [6, 0.54], [7, 0.57], [8, 0.61], [9, 0.63], [10, 0.66], [11, 0.675]]) * W, xb1 = keys(f, [[3, 0.52], [4, 0.57], [5, 0.6], [6, 0.62], [7, 0.65], [8, 0.67], [9, 0.675], [10, 0.685], [11, 0.69]]) * W;
        const ya = 0.575 * H, yb = 0.43 * H;
        arcA.setAttribute("d", `M${xa0} ${ya - 6} Q${(xa0 + xa1) / 2} ${ya + 10} ${xa1} ${ya + 2}`); arcA.style.opacity = aA;
        arcB.setAttribute("d", `M${xb0} ${yb} Q${(xb0 + xb1) / 2} ${yb - 12} ${xb1} ${yb + 6}`); arcB.style.opacity = aB;
        arcSvg.style.display = f < 12 ? "block" : "none";
      }

      // ---- phone ----
      {
        const show = f >= 35.6 && f < 70;
        phoneWrap.style.display = show ? "block" : "none";
        if (show) {
          const X = keys(f, [[35, 0.2], [36, 0.25], [37, 0.33], [38, 0.36], [39, 0.385], [40, 0.405], [41, 0.42], [42, 0.43], [43, 0.44], [44, 0.45], [46, 0.47], [47, 0.48], [52, 0.49], [58, 0.497], [69, 0.5]]) * W;
          const Y = keys(f, [[35, 0.49], [44, 0.5], [52, 0.503], [58, 0.51], [63, 0.522], [69, 0.525]]) * H;
          const S = keys(f, [[36, 1.16], [38, 1.14], [39, 1.12], [41, 1.08], [44, 1.01], [47, 1.0], [52, 0.957], [58, 0.945], [69, 0.94]]);
          const ry = keys(f, [[35, 140], [36, 96], [37, 82], [38, 66], [39, 52], [40, 44], [41, 38], [44, 27], [47, 17], [52, 9], [58, 4], [64, 2], [69, 0]]);
          const rx = keys(f, [[58, 2], [59, 10], [61, 17], [63, 24], [64, 27], [65, 32], [66, 42], [67, 53], [68, 66], [69, 82]]);
          const rz = keys(f, [[36, 8], [38, 6], [40, 3], [44, 1.5], [52, 0]]);
          rig.style.transform = `translate3d(${px(X - PW / 2)}, ${px(Y - PH / 2)}, 0) rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${S.toFixed(4)})`;
          phoneView.style.filter = blurOf(keys(f, [[35, 14], [36, 12], [37, 8], [38, 4], [39, 2], [40, 1], [42, 0], [62, 0], [64, 1], [66, 2], [67, 3], [68, 5], [69, 8]]));
          chipRig.style.transform = `translate3d(${px(X - PW / 2)}, ${px(Y - PH / 2)}, 0) rotateZ(${rz.toFixed(2)}deg) rotateY(${(0.55 * ry).toFixed(2)}deg) scale(${S.toFixed(4)})`;
          CHIPS.forEach((c) => {
            const a = f - c.in;
            if (a < 0) { c.el.style.opacity = 0; return; }
            const u = 1 - Math.exp(-a / 1.8); // flies forward out of the phone
            const spread = 1 + 0.08 * sm(ramp(f, 46, 59));
            const ft = ramp(f, c.fly, c.fly + (c.hold ? 5 : 6)), fly = c.hold ? 1 - Math.pow(1 - ft, 2) : Math.pow(ft, 1.5);
            const cx = 190 + (c.x - 190) * lerp(0.55, 1, u) * spread + c.dx * fly;
            const cy = 395 + (c.y - 395) * lerp(0.55, 1, u) * spread - c.D * fly;
            const z = lerp(-520, c.z, u) + 40 * sm(ramp(f, 46, 59));
            c.el.style.opacity = (clamp(a / 2.5, 0, 1) * (1 - (c.hold ? ramp(f, 67, 69.5) : ramp(f, c.fly + 5, c.fly + 7.5)))).toFixed(3);
            c.el.style.transform = `translate(${px(cx)}, ${px(cy)}) translate(-50%, -50%) translateZ(${px(z)}) rotateZ(${((c.r0 || 0) + c.rot * fly).toFixed(2)}deg)`;
            c.el.style.filter = blurOf(4 * (1 - u) + (c.dof || 0) + (c.hold ? 1.5 : 4) * fly);
          });
        }
      }

      // ---- bills list ----
      const P1 = { x: CK, y: ROW_Y(0) }, P2 = { x: CK, y: ROW_Y(1) };
      let cam;
      if (f < 92.5) {
        const s = keys(f, [[72, 0.4], [73, 0.48], [74, 0.58], [75, 0.75], [76, 0.85], [78, 0.9], [80, 0.93], [84, 1.0], [88, 1.0], [90, 1.03], [92, 1.12]]);
        const ax = keys(f, [[72, 0.40], [74, 0.375], [76, 0.366], [78, 0.36], [80, 0.357], [82, 0.348], [84, 0.33], [86, 0.31], [88, 0.27], [89, 0.246], [90, 0.216], [91, 0.17], [92, 0.093]]) * W;
        const ay = keys(f, [[72, 0.58], [74, 0.52], [75, 0.48], [76, 0.46], [77, 0.43], [78, 0.425], [79, 0.39], [80, 0.38], [81, 0.36], [82, 0.35], [83, 0.34], [84, 0.335], [85, 0.325], [86, 0.32], [87, 0.31], [88, 0.3], [89, 0.295], [90, 0.287], [91, 0.285], [92, 0.28]]) * H;
        cam = { s, tx: ax, ty: ay, blur: keys(f, [[85, 0], [87, 0.6], [89, 1.5], [90, 2.5], [91, 3.5], [92, 5]]) };
      } else {
        const s = keys(f, [[93, 2.95], [96, 2.9], [102, 2.78], [113, 2.75]]);
        const cx = keys(f, [[93, 0.69], [94, 0.62], [95, 0.59], [96, 0.565], [97, 0.547], [98, 0.537], [99, 0.528], [100, 0.517], [101, 0.51], [102, 0.505], [104, 0.5], [106, 0.496], [113, 0.495]]) * W;
        const cy = keys(f, [[93, 0.34], [94, 0.33], [95, 0.32], [96, 0.29], [97, 0.28], [98, 0.27], [99, 0.26], [100, 0.255], [101, 0.25], [102, 0.234], [104, 0.23], [106, 0.228], [113, 0.226]]) * H;
        cam = { s, tx: cx - s * P1.x, ty: cy - s * P1.y, blur: keys(f, [[93, 7], [94, 4.5], [95, 2.5], [96, 1.2], [97, 0.4], [98, 0]]) };
      }
      {
        const show = f >= 71.5 && f < 116;
        tasks.style.display = show ? "block" : "none";
        if (show) {
          tlist.style.transform = `translate(${px(cam.tx)}, ${px(cam.ty)}) scale(${cam.s.toFixed(4)})`;
          tlist.style.filter = blurOf(cam.blur / cam.s); // filter runs in the list's own (scaled) space
          ttlLetters.forEach((l, i) => {
            const a = f - 72 - i * 0.8;
            l.style.opacity = clamp(a / 1.5, 0, 1);
            l.style.transform = `translateY(${([0.05, -0.12, 0.18, -0.1, 0.32][i] * Math.exp(-Math.max(0, a) / 2.6)).toFixed(3)}em)`;
          });
          rows.forEach((r, i) => {
            const a = f - (75 + i * 2.2);
            const out = i === 1 ? 0 : ramp(f, 108, 113);
            r.ck.style.opacity = clamp(a / 2, 0, 1) * (i === 4 ? 0.45 : i === 2 ? 0.8 : 1);
            r.txt.style.opacity = clamp((a - 1) / 2, 0, 1) * (i === 4 ? 0.5 : 1) * (i === 1 ? 1 - ramp(f, 111, 114) : 1);
            r.r.style.opacity = 1 - out;
            r.r.style.filter = blurOf(2.5 * (1 - clamp(a / 3, 0, 1)));
          });
          rows[1].ck.style.visibility = f >= 108 ? "hidden" : "visible";
        }
      }

      // ---- calendar ----
      {
        const show = f >= 108 && f < 141;
        cal.style.display = show ? "block" : "none";
        if (show) {
          const ck2 = { x: cam.tx + cam.s * P2.x, y: cam.ty + cam.s * P2.y };
          const sp = keys(f, [[112, 0.11], [119, 0.13], [120, 0.125], [122, 0.14], [123, 0.16], [124, 0.19], [125, 0.205], [127, 0.22], [132, 0.22], [137, 0.185], [140, 0.17]]) * W;
          const cur = keys(f, [[116, 17], [117, 17.25], [118, 17.6], [119, 18], [120, 18.2], [121, 18.8], [122, 19.6], [123, 20.3], [124, 20.7], [125, 20.92], [126, 21]]);
          const persp = keys(f, [[112, 1.1], [119, 1.1], [119.5, 0.35], [124, 0.15], [127, 0]]);
          const fr = keys(f, [[112, 0.36], [119, 0.4], [119.5, 0.62], [124, 0.58], [126, 0.55]]);
          const cy = f < 113 ? ck2.y : keys(f, [[113, 540], [119, 540], [120, 508], [125, 508], [126, 529]]);
          const gblur = keys(f, [[136, 0], [137, 0.5], [138, 2], [139, 5], [140, 8]]);
          const rowsOn = ramp(f, 119.5, 123);
          nums.forEach((n) => {
            const bulge = n.r !== 0 ? lerp(1, 0.87, ramp(f, 120, 124)) : 1;
            const X = (n.d - cur) * sp * bulge;
            const k = Math.max(0.3, 1 + persp * X / W), x = 960 + X / k, sz = fr * sp * bulge / Math.sqrt(k);
            let o = f < 120 ? ramp(f, 111.5 - (n.d < 17 ? 0.5 : 0) + Math.abs(n.d - 17) * 0.4, 114 + Math.abs(n.d - 17) * 0.4) : 1;
            if (f < 121) o *= clamp(1.25 - Math.max(0, X / sp - 1) * 0.22, 0, 1) * (X < -1.6 * sp ? 0 : 1);
            if (n.r === 0 && Math.abs(X) < sp * 0.45) o = 0; // the dot carries its own number
            if (n.r !== 0) o *= rowsOn;
            if (x < -200 || x > W + 200 || o <= 0) { n.e.style.display = "none"; return; }
            n.e.style.display = "block";
            n.e.style.opacity = o.toFixed(3);
            n.e.style.fontSize = px(sz);
            n.e.style.filter = blurOf(gblur);
            n.e.style.transform = `translate(${px(x)}, ${px(cy + n.r * 0.88 * sp)}) translate(-50%, -50%) skewX(${n.r === -1 ? -10 : n.r === 1 ? -7 : 0}deg)`;
          });
          const dsz = f < 114 ? keys(f, [[108, 2.8 * 52], [110, 150], [112, 165], [113, 190], [114, 0.89 * sp]]) : f < 119.5 ? 0.89 * sp : f < 126 ? keys(f, [[119.5, 326], [122, 330], [124, 345], [126, 357]]) : 0.845 * sp;
          const dx = f < 113 ? ck2.x : 960;
          dot.style.width = dot.style.height = px(dsz);
          dot.style.transform = `translate(${px(dx - dsz / 2)}, ${px(cy - dsz / 2)})`;
          dot.style.background = f < 112 ? "#edb53a" : mix("#f07a2a", "#f1311c", ramp(f, 112, 113.5));
          dot.style.fontSize = px(dsz * 0.5);
          const day = f < 113.5 ? null : Math.round(cur);
          dot.innerHTML = day == null ? svgIcon("check", "#fff", 3) : String(day);
          dot.style.filter = blurOf(gblur * 1.2);
        }
      }

      // ---- "Late fees again" / "What if your money just" / "sorted itself?" ----
      {
        const out = [159, 160, 161];
        const showA = f >= 140.5 && f < 163;
        placeLine(T2a, showA, { gap: keys(f, [[141, 0.3], [143, 0.08], [145, 0.12], [147, 0.18], [150, 0.26]]), cx: 960, dy: 5, rot: keys(f, [[141, -1], [143, -4], [146, -4.5], [148, -2.5], [150, 0]]) });
        if (showA) [141, 143, 145].forEach((s, i) => landWord(T2a.ws[i], f, s, [144.5, 146.5, 148][i], { out: ramp(f, out[i], out[i] + 2), lift: [-0.1, -0.25, -0.3][i] }));

        const showB = f >= 159.5 && f < 193;
        const wB = T2b.line.offsetWidth || 672;
        const cxB = f < 184 ? lerp(0.29 * W + wB / 2, 0.495 * W, sm(ramp(f, 165, 170))) : keys(f, [[184, 0.495], [185, 0.485], [186, 0.46], [187, 0.44], [188, 0.4], [189, 0.33], [190, 0.27], [191, 0.19], [192, 0.08], [193, -0.1]]) * W;
        placeLine(T2b, showB, {
          gap: keys(f, [[160, 0.3], [163, 0.28], [165, 0.12], [167, 0.12], [170, 0.2], [172, 0.26]]), cx: cxB, dy: 5,
          rot: keys(f, [[163, -1], [165, -2.5], [168, -2], [170, 0]]), blur: keys(f, [[184, 0.5], [185, 2], [186, 4], [187, 6], [188, 9], [189, 12]]), alpha: 1 - ramp(f, 190, 193),
        });
        if (showB) [160, 161.2, 162.4, 163.6, 164.8].forEach((s, i) => landWord(T2b.ws[i], f, s, [160.5, 162.5, 165.5, 167.5, 168.5][i], { lift: [0.1, -0.25, 0.15, 0.15, -0.25][i] }));

        const showC = f >= 181 && f < 214;
        placeLine(T2c, showC, {
          gap: 0.26, cx: keys(f, [[181, 0.73], [184, 0.71], [186, 0.70], [188, 0.67], [189, 0.64], [190, 0.60], [191, 0.56], [192, 0.55], [194, 0.525], [197, 0.495], [200, 0.465], [203, 0.425], [206, 0.375], [208, 0.32], [210, 0.25], [212, 0.165], [213, 0.075], [214, -0.05]]) * W,
          dy: 0, s: keys(f, [[181, 0.4], [183, 0.5], [185, 0.6], [187, 0.72], [189, 0.85], [191, 0.95], [193, 1]]),
          blur: keys(f, [[181, 2], [184, 3], [187, 4], [190, 5], [192, 3], [193, 1.5], [195, 0.5], [197, 0], [204, 0], [206, 1.5], [208, 3], [210, 5], [212, 7], [213, 9]]), alpha: 1 - ramp(f, 212, 214),
        });
        if (showC) {
          [181, 188.5].forEach((s, i) => landWord(T2c.ws[i], f, s, 191 + i));
          const amp = keys(f, [[181, 0.3], [190, 0.4], [194, 0.3], [197, 0.15], [200, 0.05], [202, 0]]);
          let k = 0;
          T2c.ws.forEach((w) => w.letters.forEach((l) => { l.style.transform = `translateY(${(amp * Math.sin(k * 0.45 - f * 0.6)).toFixed(3)}em)`; k++; }));
        }
      }

      // ---- cards ----
      {
        const show = f >= 216 && f < 299;
        cardsL.style.display = show ? "block" : "none";
        if (show) CARDS.forEach((c, i) => {
          const a = f - c.xs[0][0];
          const x = cardX(i, f);
          if (a < 0 || x < -400 || x > W + 400) { c.el.style.display = "none"; return; }
          c.el.style.display = "block";
          const next = CARDS[i + 1];
          const back = next ? ramp(f, next.e + 4, next.e + 12) : 0;
          c.el.style.transform = `translate(${px(x - 320)}, ${px(545 - 320)}) rotateY(${(-22 * Math.exp(-a / 3)).toFixed(2)}deg) scale(${(1 + 0.07 * Math.exp(-a / 3)).toFixed(4)})`;
          c.el.style.filter = blurOf(2.5 * Math.exp(-a / 2) + 2.6 * back + keys(f, [[296, 0], [298.5, 2.5]]));
          c.inner.style.opacity = (1 - 0.45 * back).toFixed(3);
        });
      }

      // ---- "All in one place", Smart / Simple / Secure ----
      {
        const show = f >= 301.5 && f < 330;
        placeLine(T3, show, {
          gap: keys(f, [[302, 0.5], [304, 0.45], [305, 0.35], [307, 0.1], [308, 0], [312, 0], [313, 0.15], [314, 0.26]]),
          cx: keys(f, [[324, 0.505], [325, 0.495], [326, 0.48], [327, 0.46], [328, 0.43], [329, 0.38], [330, 0.3]]) * W, dy: -3,
          blur: keys(f, [[324, 0], [325, 1], [326, 2.5], [327, 4], [328, 7], [329, 10]]), alpha: keys(f, [[326, 1], [328, 0.6], [330, 0]]),
        });
        if (show) [302, 303, 304, 304.5].forEach((s, i) => landWord(T3.ws[i], f, s, [304, 305, 307, 308][i]));

        // Smart: slides in out of the smear, holds, smears off left
        placeLine(T4[0], f >= 328.5 && f < 343, {
          cx: keys(f, [[329, 0.55], [330, 0.535], [331, 0.535], [332, 0.52], [333, 0.51], [335, 0.505], [338, 0.49], [339, 0.47], [340, 0.45], [341, 0.425], [342, 0.385], [343, 0.33]]) * W, dy: 0,
          blur: keys(f, [[329, 8], [330, 6], [331, 3], [332, 0.5], [333, 0], [338, 0], [339, 2], [340, 3], [341, 5], [342, 8]]), alpha: keys(f, [[328.5, 0.5], [330, 1], [341, 1], [342, 0.7], [343, 0]]), color: INK,
        });
        // Simple: fades up from grey in place, holds, then drops away as the next word comes down from above
        placeLine(T4[1], f >= 341.5 && f < 360, {
          cx: keys(f, [[342, 0.535], [343, 0.52], [344, 0.515], [345, 0.505], [346, 0.5]]) * W, dy: keys(f, [[357, 0], [358, 0.03], [359, 0.035]]) * H,
          blur: keys(f, [[342, 6], [343, 0], [357, 0], [358, 1], [359, 2.5]]), alpha: keys(f, [[341.5, 0], [342, 0.5], [343, 1], [357, 1], [358, 0.8], [359, 0.55], [360, 0]]),
          color: f < 346 ? mix("#a3a3aa", INK, ramp(f, 343, 345)) : mix(INK, "#a3a3aa", ramp(f, 357, 359)),
        });
        // Secure: arrives from above, holds while it slowly shrinks, then fades
        placeLine(T4[2], f >= 358.5 && f < 384, {
          cx: 0.5 * W, dy: keys(f, [[359, -0.07], [360, -0.03], [361, -0.005], [362, 0.01]]) * H,
          s: keys(f, [[361, 1.02], [362, 1], [366, 0.98], [372, 0.94], [376, 0.9], [378, 0.86], [380, 0.8], [382, 0.76]]),
          blur: keys(f, [[359, 3], [360, 2], [361, 0.5], [362, 0]]), alpha: keys(f, [[358.5, 0.4], [360, 0.8], [361, 1], [377, 1], [379, 0.85], [380, 0.6], [381, 0.4], [382, 0.15], [383, 0]]),
          color: mix("#a3a3aa", INK, ramp(f, 359, 361)),
        });
      }

      // ---- icon + wordmark ----
      {
        const show = f >= 383;
        logoL.style.display = show ? "block" : "none";
        if (show) {
          const s = keys(f, [[383, 1900], [384, 1400], [385, 1150], [386, 940], [387, 790], [388, 670], [389, 580], [390, 500], [391, 460], [392, 410], [393, 370], [394, 345], [396, 327], [400, 318], [413, 306], [414, 270], [415, 250], [416, 228], [417, 200], [418, 172], [419, 115], [420, 69], [420.6, 0]]);
          icon.style.display = s > 1 ? "block" : "none";
          icon.style.width = icon.style.height = px(s);
          icon.style.borderRadius = px(s * 0.225);
          icon.style.transform = `translate(${px(960 - s / 2)}, ${px(540 - s / 2)})`;
          icon.style.filter = blurOf(keys(f, [[383, 12], [384, 10], [385, 8], [386, 6], [387, 4], [388, 3], [389, 2], [390, 1], [391, 0]]));
          iconBg.style.opacity = keys(f, [[389, 1], [391, 0.2], [392, 0]]);
          const ts = keys(f, [[386, 0.62], [389, 0.8], [391, 1]]), ty = keys(f, [[386, 75], [387, 52], [388, 34], [389, 8], [390, 2], [391, 0]]);
          tile.style.opacity = ramp(f, 385.5, 386.5);
          tile.style.transform = `translate(-50%, ${(-50 + ty).toFixed(2)}%) scale(${ts.toFixed(4)})`;
          tile.style.boxShadow = `0 ${px(s * 0.02)} ${px(s * 0.06)} rgba(0,0,0,${(0.12 * (1 - ramp(f, 389, 391))).toFixed(3)})`;
          markG.setAttribute("fill", mix("#a0a0a7", "#111214", ramp(f, 389.5, 391.5)));
          if (f < 392) iconCtx.drawImage(waveC, 0, 0, 240, 135, -52, 0, 344, 194);

          const wOn = f >= 420.6 && f < 439.5;
          wordmark.style.display = glow.style.display = wOn ? "block" : "none";
          const ws = WM_FIT * keys(f, [[420.6, 1.06], [421, 1], [422, 0.76], [423, 0.66], [424, 0.56], [425, 0.51], [426, 0.46], [427, 0.42], [428, 0.4], [429, 0.37], [430, 0.35], [431, 0.33], [432, 0.31], [434, 0.27], [436, 0.22], [438, 0.15], [439, 0.08]]);
          wordmark.style.transform = `translate(-50%, -52%) scale(${ws.toFixed(4)})`;
          glow.style.transform = `scale(${(ws / WM_FIT).toFixed(4)})`;
        }
      }

      paintFx(f);
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R0._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
