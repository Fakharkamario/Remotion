// Tallo — 14.67 s promo, 30 fps, 440 frames. Same cut and motion as the reference edit, new brand and story.
//   0–36     "We've all been there..." pops in word by word, then smears off to the right
//   36–70    a phone spins in, money chips burst out around it, then it tips back and the chips fly up
//   70–106   vertical streaks wipe to a flat page; a small Bills list builds, then a whip zoom into it
//   106–138  the second check turns red and becomes a calendar dot: dates slide under it to the 21st
//   138–214  scanline glitch; "Late fees again" / "What if your money just" / "sorted itself?"
//   214–300  dark: magenta blades and three cards (Budget, Bills, Savings) slide in on a panning strip
//   300–384  "All in one place", then Smart / Simple / Secure
//   384–440  the frame shrinks into the app icon, then the glowing wordmark shrinks away
(function () {
  const FPS = 30, FRAMES = 440, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const sm = (t) => (t = clamp(t, 0, 1), t * t * (3 - 2 * t));
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const eOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eIn = (t) => Math.pow(clamp(t, 0, 1), 3);
  const backOut = (t) => { t = clamp(t, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mixA = (a, b, t) => { const A = hex(a), B = hex(b); return A.map((v, i) => lerp(v, B[i], clamp(t, 0, 1))); };
  const mix = (a, b, t) => `rgb(${mixA(a, b, t).map(Math.round).join(",")})`;
  // piecewise-linear lookup through [frame, value] pairs
  const keys = (f, pts) => {
    if (f <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (f - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts[pts.length - 1][1];
  };
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

  const INK = "#1b1c20", BLUE = "#2f86cf", BLUE2 = "#7cc3f0", RED = "#f2341f";

  // ---- small line icons (24 grid, white stroke) ----
  const ICON = {
    house: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    cart: '<path d="M3 4h3l2 11h10l2-8H7"/><circle cx="10" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9M9.5 9.8c0-1.2 1.1-1.8 2.5-1.8s2.5.7 2.5 1.8-1.2 1.6-2.5 1.9-2.6.8-2.6 2c0 1.2 1.2 1.9 2.6 1.9s2.5-.6 2.5-1.8"/>',
    repeat: '<path d="M4 11V9a3 3 0 013-3h12l-3-3M20 13v2a3 3 0 01-3 3H5l3 3"/>',
    plane: '<path d="M2.5 13.5l19-8-6 15-3.5-6.5z M12 14l9.5-8.5"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M16 14h2"/><path d="M6 6l9-3 1.5 3"/>',
    piggy: '<path d="M5 11a7 6 0 0112-3l3-1-1 3.5c.6.7 1 1.6 1 2.5h1.5v3H20a7 6 0 01-3 2.6V21h-3v-1.6a8 8 0 01-3 0V21H8v-2.2A6 6 0 015 13.5H3v-2.5z"/><circle cx="15.5" cy="11" r=".8"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  };
  const svgIcon = (name, stroke = "#fff", sw = 2) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    // ---------- DOM ----------
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const L = {};
    L.wave = el("canvas", "", stage); L.wave.id = "wave"; L.wave.width = 240; L.wave.height = 135;
    L.flat = el("div", "layer", stage); L.flat.id = "flat";
    L.dark = el("div", "layer", stage); L.dark.id = "dark";
    L.swoosh = el("canvas", "", stage); L.swoosh.id = "swoosh"; L.swoosh.width = 960; L.swoosh.height = 540;
    const waveCtx = L.wave.getContext("2d"), swCtx = L.swoosh.getContext("2d");
    const waveImg = waveCtx.createImageData(240, 135);

    // kinetic lines
    const textLayer = el("div", "layer", stage);
    function makeLine(words, size) {
      const line = el("div", "kline", textLayer);
      line.style.fontSize = size + "px";
      const ws = words.map((w, wi) => {
        const span = el("span", "kword", line);
        const letters = [...w].map((ch) => el("span", "lt", span, ch));
        // a thin blue swish that draws past each word as it lands
        const flip = wi % 2 ? -1 : 1;
        span.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M2 ${50 + 30 * flip} Q 40 ${50 + 46 * flip} 98 ${50 - 10 * flip}" fill="none" stroke="${BLUE2}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linecap="round" pathLength="1"/></svg>`);
        const arc = span.querySelector("path");
        if (wi < words.length - 1) span.style.marginRight = "0.26em";
        return { span, letters, arc };
      });
      return { line, ws, size };
    }
    // one word's landing: blue, italic and soft, then settling to ink. a = frames since it started.
    function landWord(w, a, opt = {}) {
      if (a < 0) { w.span.style.opacity = 0; w.arc.style.opacity = 0; return; }
      const p = 1 - Math.exp(-a / 2.2);
      const c = sm((a - 2) / 9);
      w.span.style.opacity = clamp(a / 2, 0, 1) * (opt.alpha ?? 1);
      w.span.style.color = opt.blue === false ? INK : c < 0.5 ? mix(BLUE2, BLUE, c * 2) : mix(BLUE, INK, c * 2 - 1);
      w.span.style.transform = `translate(${(0.45 * (1 - p)).toFixed(3)}em, ${(0.22 * (1 - p)).toFixed(3)}em) skewX(${(-16 * (1 - p)).toFixed(2)}deg) scale(${(0.86 + 0.14 * p).toFixed(4)})`;
      w.span.style.filter = blurOf(5 * (1 - p) + (opt.blur || 0));
      // words land crowded and open out
      w.span.style.letterSpacing = (lerp(-0.07, -0.02, sm(a / 12))).toFixed(4) + "em";
      const draw = clamp(a / 5, 0, 1), fade = 1 - ramp(a, 3, 8);
      w.arc.style.opacity = opt.arc === false ? 0 : fade;
      w.arc.setAttribute("stroke-dasharray", `${draw.toFixed(3)} 1`);
      w.arc.setAttribute("stroke-dashoffset", `${(-ramp(a, 3, 8)).toFixed(3)}`);
    }
    function placeLine(L0, f, show, dx = 0, dy = 0, s = 1, blur = 0, alpha = 1) {
      L0.line.style.display = show ? "block" : "none";
      if (!show) return;
      L0.line.style.transform = `translate(-50%, -54%) translate(${px(dx)}, ${px(dy)}) scale(${s.toFixed(4)})`;
      L0.line.style.filter = blurOf(blur);
      L0.line.style.opacity = alpha;
    }

    const T1 = makeLine(["We've", "all", "been", "there..."], 62);
    const T2a = makeLine(["Late", "fees", "again"], 64);
    const T2b = makeLine(["What", "if", "your", "money", "just"], 64);
    const T2c = makeLine(["sorted", "itself?"], 84);
    const T3 = makeLine(["All", "in", "one", "place"], 62);
    const T4 = ["Smart", "Simple", "Secure"].map((w) => makeLine([w], 94));

    // phone
    const phoneWrap = el("div", "layer", stage); phoneWrap.id = "phoneWrap";
    const rig = el("div", "", phoneWrap); rig.id = "rig";
    el("div", "face back", rig); el("div", "side l", rig); el("div", "side r", rig);
    const front = el("div", "face front", rig);
    const screen = el("div", "screen", front);
    el("div", "island", screen);
    el("div", "sbar", screen, "<span>9:41</span><span>●●● ▮</span>");
    const apps = el("div", "apps", screen);
    const APPC = ["#ff6159", "#34c759", "#0a84ff", "#ff9f0a", "#5e5ce6", "#ff375f", "#30b0c7", "#ffd60a", "#64d2ff", "#bf5af2", "#32d74b", "#ff453a", "#8e8e93", "#0a84ff", "#ff9f0a", "#30d158", "#5856d6", "#ff2d55", "#00c7be", "#ffcc00"];
    APPC.forEach((c, i) => { const a = el("div", "app " + ["", "c", "b"][i % 3], apps); a.style.background = `linear-gradient(160deg, ${c}, ${mix(c, "#000000", 0.25)})`; });
    const dock = el("div", "dock", screen);
    ["#34c759", "#0a84ff", "#ffffff", "#ff3b30"].forEach((c, i) => { const a = el("div", "app " + ["c", "", "c", "b"][i], dock); a.style.background = c; });
    const CHIPS = [
      { t: "Rent", ic: "house", c: "#ff6b57", x: 350, y: 120, z: 90 },
      { t: "Groceries", ic: "cart", c: "#f2a93b", x: 10, y: 215, z: 120 },
      { t: "Savings", ic: "coin", c: "#2fbf71", x: 520, y: 300, z: 60 },
      { t: "Subscriptions", ic: "repeat", c: "#8b6cf0", x: 110, y: 470, z: 130 },
      { t: "Travel", ic: "plane", c: "#3aa0ff", x: 420, y: 455, z: 95 },
      { t: "Bills", ic: "receipt", c: "#ff8a3d", x: 330, y: 635, z: 75 },
    ];
    const chipIn = [40, 41, 42, 43, 44.5, 45.5];
    CHIPS.forEach((c) => { c.el = el("div", "chip", rig, `<i style="background:${c.c}">${svgIcon(c.ic, "#fff", 2.2)}</i>${c.t}`); });

    // bills list
    const tasks = el("div", "layer", stage);
    const tlist = el("div", "", tasks); tlist.id = "tlist";
    const ttl = el("div", "ttl", tlist);
    const ttlLetters = [..."Bills"].map((ch) => el("span", "", ttl, ch));
    const ROWS = [["Pay rent", 1], ["Renew phone plan", 1], ["Electricity bill", 0], ["Credit card due", 1], ["Move $200 to savings", 0]];
    const rows = ROWS.map(([t, on]) => {
      const r = el("div", "row", tlist, `<span class="ck ${on ? "on" : "off"}">${on ? svgIcon("check", "#fff", 3.2) : ""}</span><span>${t}</span>`);
      return { r, ck: r.firstChild };
    });
    // local geometry of the list (title 60px tall, rows 44px)
    const ROW_Y = (i) => 60 + 44 * i + 22;
    const CK_X = 11;

    // calendar
    const cal = el("div", "layer", stage);
    const strip = el("div", "", cal); strip.id = "strip";
    const stripNums = [];
    for (let d = 12; d <= 26; d++) stripNums.push({ d, e: el("div", "num", strip, String(d)) });
    const grid = el("div", "", cal); grid.id = "grid";
    const gridNums = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      const d = 4 + r * 7 + c - 7; // rows: (-3..3), 4..10, 11..17, 18..24, 25..31
      if (d < 1 || d > 31) continue;
      gridNums.push({ d, r, c, e: el("div", "num", grid, String(d)) });
    }
    const dot = el("div", "", cal); dot.id = "dot";

    // cards
    const cardsL = el("div", "layer", stage); cardsL.id = "cards";
    const CARDS = [["Budget", "wallet", 220], ["Bills", "receipt", 246], ["Savings", "piggy", 272]].map(([t, ic, e], i) => {
      const c = el("div", "card", cardsL, `<div class="band"></div><div class="in">${svgIcon(ic, "#e9e9ee", 1.7)}<b>${t}</b></div>`);
      return { el: c, inner: c.querySelector(".in"), e, i };
    });

    // logo + wordmark
    const logoL = el("div", "layer", stage);
    const icon = el("div", "", logoL); icon.id = "icon";
    const iconBg = el("div", "", icon); iconBg.id = "iconBg";
    // Tallo mark: a T whose bar and stem are rounded bars, and a coin dropping beside it
    const mark = el("div", "", icon, `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="14" y="18" width="72" height="20" rx="10" fill="#111214"/><rect x="38" y="18" width="20" height="66" rx="10" fill="#111214"/><circle cx="74" cy="66" r="11" fill="#111214"/></svg>`);
    mark.id = "mark";
    const glow = el("div", "", logoL); glow.id = "glow";
    const wordmark = el("div", "", logoL, "tallo.app"); wordmark.id = "wordmark";

    const fx = el("canvas", "", stage); fx.id = "fx"; fx.width = W; fx.height = H;
    const fxCtx = fx.getContext("2d");

    // ---------- painters ----------
    const TOP = "#e2e1e7", BAND = "#eeeef3", BL1 = "#b4dbee", BL2 = "#7fc0dd";
    function paintWave(f) {
      const w = 240, h = 135, d = waveImg.data;
      const tilt = keys(f, [[0, 1.1], [60, 0.75], [140, 0.65], [214, 0.25], [300, -0.05], [384, -0.1]]);
      const top = hex(TOP), band = hex(BAND), b1 = hex(BL1), b2 = hex(BL2);
      for (let x = 0; x < w; x++) {
        const u = x / (w - 1);
        const edge = 0.74 + tilt * (0.5 - u) * 0.62 + 0.07 * Math.sin(2 * Math.PI * (0.8 * u - 0.011 * f) + 0.6) + 0.03 * Math.sin(2 * Math.PI * (1.7 * u + 0.017 * f) + 1.3);
        for (let y = 0; y < h; y++) {
          const v = y / (h - 1);
          const k = (v - edge) / 0.16;
          const t = sm((k + 0.7) / 1.9);
          const hl = 0.28 * Math.exp(-Math.pow((k + 0.35) / 0.55, 2));
          const deep = clamp((v - edge) / 0.45, 0, 1);
          const i = (y * w + x) * 4;
          for (let ch = 0; ch < 3; ch++) {
            const blue = lerp(b1[ch], b2[ch], deep);
            let c = lerp(top[ch], blue, t);
            c = lerp(c, band[ch], hl * (1 - t));
            d[i + ch] = c;
          }
          d[i + 3] = 255;
        }
      }
      waveCtx.putImageData(waveImg, 0, 0);
    }

    function blade(ctx, x, y, len, wid, ang, alpha) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ang * Math.PI / 180);
      const g = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
      g.addColorStop(0, `rgba(110,40,240,0)`);
      g.addColorStop(0.35, `rgba(130,45,235,${0.75 * alpha})`);
      g.addColorStop(0.75, `rgba(225,30,210,${alpha})`);
      g.addColorStop(1, `rgba(255,60,200,${0.6 * alpha})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.quadraticCurveTo(0, -wid, len / 2, 0);
      ctx.quadraticCurveTo(0, -wid * 0.32, -len / 2, 0);
      ctx.fill();
      ctx.restore();
    }

    // card strip: screen x of card i's centre
    const camX = (f) => -1130 + 820 * (smoother(ramp(f, 245, 263)) + smoother(ramp(f, 272, 290))) + 1.6 * (f - 222);
    const cardX = (i, f) => i * 820 - camX(f) + 1000 * Math.exp(-Math.max(0, f - CARDS[i].e) / 3.2);

    function paintSwoosh(f) {
      swCtx.clearRect(0, 0, 960, 540);
      swCtx.filter = "blur(18px)";
      // intro: a single soft blade drops in at the top, then splits into two leaning ones
      const intro = ramp(f, 213, 216) * (1 - ramp(f, 232, 246));
      if (intro > 0) {
        const u = smoother(ramp(f, 214, 226));
        const x = lerp(450, cardX(0, Math.max(f, 220)) / 2 - 190, u), y = lerp(200, 280, u);
        blade(swCtx, x, y, lerp(260, 380, u), lerp(150, 130, u), lerp(-25, -58, u), intro);
        if (u > 0.2) blade(swCtx, x - 70 * u, y + 40 * u, lerp(200, 330, u), 120, lerp(-35, -66, u) + 6 * Math.sin(f * 0.3), intro * ramp(u, 0.2, 0.5));
      }
      // each card drags a pair of blades along its left edge, bright as it lands, then dim
      CARDS.forEach((c, i) => {
        const a = f - c.e;
        if (a < -1) return;
        const I = (0.3 + 0.7 * Math.exp(-Math.max(0, a) / 9)) * ramp(a, -1, 2) * (i === 0 ? ramp(f, 230, 238) : 1);
        const x = cardX(i, f) / 2 - 178, y = 270;
        const sw = Math.sin(a * 0.16);
        blade(swCtx, x, y + 10, 340, 130, -60 + 14 * sw, I);
        blade(swCtx, x + 14, y + 60, 280, 100, -75 - 10 * sw, I * 0.75);
      });
      swCtx.filter = "none";
    }

    const R = rng(7);
    const STREAKS = Array.from({ length: 70 }, () => ({ x: R() * W, w: 1 + R() * 2.5, y0: R() * H * 0.6, len: 200 + R() * 800, a: 0.15 + R() * 0.35, t0: 66 + R() * 6, life: 2 + R() * 6 }));
    function paintFx(f) {
      fxCtx.clearRect(0, 0, W, H);
      // vertical streak wipe (phone -> list)
      if (f >= 66 && f < 80) {
        STREAKS.forEach((s) => {
          const a = (f - s.t0) / s.life;
          if (a < 0 || a > 1) return;
          fxCtx.fillStyle = `rgba(120,120,130,${(s.a * Math.sin(Math.PI * a)).toFixed(3)})`;
          fxCtx.fillRect(s.x, s.y0 + a * 200, s.w, s.len);
        });
      }
      // scanline glitches (calendar -> text, cards -> text)
      const scan = Math.max(keys(f, [[135, 0], [137.5, 0.5], [140, 1], [141.5, 0.6], [143.5, 0]]), keys(f, [[296, 0], [299, 1], [300.5, 0.7], [302.5, 0]]));
      if (scan > 0) {
        fxCtx.fillStyle = `rgba(200,200,206,${(0.55 * scan).toFixed(3)})`;
        fxCtx.fillRect(0, 0, W, H);
        fxCtx.fillStyle = `rgba(110,110,120,${(0.45 * scan).toFixed(3)})`;
        for (let y = (f * 3) % 9; y < H; y += 9) fxCtx.fillRect(0, y, W, 3);
      }
    }

    // ---------- the frame ----------
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);

      // backgrounds
      const light = (f < 67) || (f >= 140.5 && f < 214) || (f >= 299.5 && f < 384);
      L.wave.style.display = light ? "block" : "none";
      if (light) paintWave(f);
      L.flat.style.display = f >= 67 && f < 140.5 ? "block" : "none";
      L.dark.style.display = (f >= 214 && f < 299.5) || f >= 384 ? "block" : "none";
      L.dark.style.background = f >= 436 ? mix("#131418", "#000000", ramp(f, 436, 439)) : "#131418";
      L.swoosh.style.display = f >= 213 && f < 300 ? "block" : "none";
      if (f >= 213 && f < 300) paintSwoosh(f);

      // ---- "We've all been there..." ----
      {
        const show = f < 37;
        placeLine(T1, f, show, 40 * sm(ramp(f, 12, 26)) + 1150 * eIn(ramp(f, 25, 37)), 0, 1 + 0.04 * ramp(f, 0, 36), 16 * Math.pow(ramp(f, 26, 35), 1.4), 1 - ramp(f, 33, 37));
        if (show) [4, 6, 8, 10].forEach((s, i) => landWord(T1.ws[i], f - s));
      }

      // ---- phone ----
      {
        const show = f >= 36 && f < 70;
        phoneWrap.style.display = show ? "block" : "none";
        if (show) {
          const a = f - 36;
          let ry = -30 - 560 * Math.exp(-a / 2.3) + 46 * smoother(ramp(f, 41, 62));
          let rx = 7 - 4 * ramp(f, 40, 60) + 62 * eIn(ramp(f, 59, 69));
          const rz = -4 * Math.exp(-a / 3) + 2 * sm(ramp(f, 45, 60));
          const dx = -330 * Math.exp(-a / 2.6) + 30 * sm(ramp(f, 42, 60));
          const dy = 8 * Math.sin(a * 0.18) - 30 * eIn(ramp(f, 60, 69));
          const sc = 1.0 + 0.08 * eOut(ramp(f, 36, 43)) - 0.1 * eIn(ramp(f, 60, 69));
          rig.style.left = px(870 - 180); rig.style.top = px(540 - 370);
          rig.style.transform = `translate3d(${px(dx)}, ${px(dy)}, 0) rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
          rig.style.filter = blurOf(9 * Math.exp(-a / 2.2) + 6 * ramp(f, 63, 69));
          rig.style.opacity = 1 - ramp(f, 67, 70);
          CHIPS.forEach((c, i) => {
            const ca = f - chipIn[i];
            if (ca < 0) { c.el.style.opacity = 0; return; }
            const u = eOut(ramp(ca, 0, 5)), s = backOut(ramp(ca, 0, 6));
            const fly = eIn(ramp(f, 58 + i * 0.7, 66 + i * 0.7));
            const x = lerp(180, c.x, u), y = lerp(370, c.y, u) - 1300 * fly;
            c.el.style.opacity = clamp(ca / 1.5, 0, 1);
            c.el.style.transform = `translate(${px(x)}, ${px(y)}) translate(-50%, -50%) translateZ(${px(c.z * u + 200 * fly)}) scale(${(0.3 + 0.7 * s).toFixed(4)}) rotateZ(${(-8 * fly * (i % 2 ? 1 : -1)).toFixed(2)}deg)`;
            c.el.style.filter = blurOf(3 * (1 - u) + 5 * fly);
          });
        }
      }

      // ---- bills list ----
      const P2 = { x: CK_X, y: ROW_Y(1) }; // second check: becomes the calendar dot
      let cam = null;
      {
        const show = f >= 72 && f < 116;
        tasks.style.display = show ? "block" : "none";
        // camera: screen = T + s * local
        const sWide = 1.5 + 0.012 * (f - 74), S0 = { x: 690 + 1.3 * (f - 74), y: 405 - 0.7 * (f - 74) }, P0 = { x: 0, y: 0 };
        const Sc = { x: lerp(1100, 950, ramp(f, 95, 110)), y: lerp(640, 546, eOut(ramp(f, 95, 110))) };
        const sClose = 7.4 + 0.035 * Math.max(0, f - 95);
        const u = smoother(ramp(f, 87, 93.5));
        const s = Math.exp(lerp(Math.log(sWide), Math.log(sClose), u));
        const P = { x: lerp(P0.x, P2.x, u), y: lerp(P0.y, P2.y, u) }, S = { x: lerp(S0.x, Sc.x, u), y: lerp(S0.y, Sc.y, u) };
        cam = { s, tx: S.x - s * P.x, ty: S.y - s * P.y };
        if (show) {
          tlist.style.transform = `translate(${px(cam.tx)}, ${px(cam.ty)}) scale(${s.toFixed(4)})`;
          tlist.style.filter = blurOf(keys(f, [[87, 0], [89, 2], [91, 6], [93, 4], [94.5, 1.5], [96, 0]])); // in local px, so it scales with the zoom
          ttlLetters.forEach((l, i) => {
            const a = f - 74 - i * 0.8;
            const j = [0.3, -0.25, 0.35, -0.3, 0.45][i];
            l.style.opacity = clamp(a / 2, 0, 1);
            l.style.transform = `translateY(${(j * Math.exp(-Math.max(0, a) / 3)).toFixed(3)}em) scale(${(0.8 + 0.2 * eOut(a / 4)).toFixed(3)})`;
          });
          rows.forEach((r, i) => {
            const a = f - (77 + i * 2.6);
            const out = i === 1 ? ramp(f, 110, 113) : ramp(f, 108 + i * 0.6, 112 + i * 0.6);
            r.r.style.opacity = clamp(a / 3, 0, 1) * (1 - out) * (i === 4 ? 0.55 : 1);
            r.r.style.transform = `translateY(${px(10 * (1 - eOut(a / 5)))})`;
            r.r.style.filter = blurOf(1.6 * (1 - clamp(a / 4, 0, 1)));
          });
          rows[1].ck.style.visibility = f >= 108 ? "hidden" : "visible";
        }
      }

      // ---- calendar ----
      {
        const show = f >= 108 && f < 141;
        cal.style.display = show ? "block" : "none";
        if (show) {
          // the dot: it is the list's second check, it turns red, grows, then rides the dates to the 21st
          const ckScreen = { x: cam.tx + cam.s * P2.x, y: cam.ty + cam.s * P2.y };
          const C = f < 113 ? ckScreen : { x: lerp(ckScreen.x, 960, 1), y: 546 };
          const size = keys(f, [[108, 22 * cam.s], [113, 190], [115, 213], [118, 225], [121, 280], [126, 350], [137, 360]]);
          const day = f < 113 ? null : f < 116 ? 17 : Math.round(keys(f, [[116, 17], [121, 21]]));
          dot.style.width = dot.style.height = px(size);
          dot.style.transform = `translate(${px(C.x - size / 2)}, ${px(C.y - size / 2)}) scaleX(${(1 + 0.35 * Math.sin(Math.PI * ramp(f, 115, 122))).toFixed(3)})`;
          dot.style.background = mix("#e8b23a", RED, ramp(f, 109, 113));
          dot.style.fontSize = px(size * 0.47);
          dot.innerHTML = day == null ? svgIcon("check", "#fff", 3.2) : String(day);
          dot.style.filter = blurOf(keys(f, [[115, 0], [118, 5], [121, 8], [124, 2], [127, 0], [136, 0], [140, 8]]));

          // a short row of dates in perspective; it slides left under the dot from 17 to 21
          const sOn = ramp(f, 111, 114) * (1 - ramp(f, 120, 122));
          strip.style.display = sOn > 0 ? "block" : "none";
          if (sOn > 0) {
            const cur = lerp(17, 21, eIn(ramp(f, 115, 118.5)) * 0.4 + 0.6 * smoother(ramp(f, 116, 121)));
            strip.style.transform = `perspective(1400px) rotateY(${(34 - 6 * ramp(f, 111, 121)).toFixed(2)}deg)`;
            strip.style.filter = blurOf(keys(f, [[115, 0], [117, 4], [120, 9]]));
            stripNums.forEach((n) => {
              const k = n.d - cur;
              const o = clamp(Math.abs(k) * 2 - 0.4, 0, 1) * clamp(1 - (Math.abs(k) - 2) / 1.5, 0, 1) * (k > 0 ? 1 - 0.18 * k : 1) * sOn;
              n.e.style.opacity = o;
              n.e.style.fontSize = "96px";
              n.e.style.transform = `translate(${px(960 + k * 215)}, 546px) translate(-50%, -50%)`;
            });
          }
          // the month grid, landing big and tilted
          const gOn = ramp(f, 119.5, 122);
          grid.style.display = gOn > 0 ? "block" : "none";
          if (gOn > 0) {
            const u = eOut(ramp(f, 120, 129));
            const sc = lerp(1.55, 1, u) + 0.04 * ramp(f, 128, 138);
            const ry = lerp(-38, -7, u) + 3 * ramp(f, 128, 138), rx = lerp(20, 7, u);
            grid.style.transform = `translateX(${px(320 * (1 - u))}) perspective(1800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
            grid.style.filter = blurOf(14 * (1 - u) + keys(f, [[135, 0], [138, 4], [140, 10]]));
            grid.style.opacity = gOn;
            gridNums.forEach((n) => {
              n.e.style.fontSize = "196px";
              n.e.style.color = n.d === 21 ? "#fff" : INK;
              n.e.style.zIndex = n.d === 21 ? 2 : 0;
              n.e.style.transform = `translate(${px(960 + (n.c - 3) * 410)}, ${px(546 + (n.r - 3) * 365)}) translate(-50%, -50%) skewX(${[-10, -10, -8, 0, -6][n.r]}deg)`;
            });
            dot.style.opacity = 1;
          }
          // the dot sits under the grid's 21 once the grid lands
          dot.style.zIndex = 1; grid.style.zIndex = 2;
          if (gOn > 0) gridNums.find((n) => n.d === 21).e.style.opacity = 1;
          dot.style.color = gOn > 0.5 ? "transparent" : "#fff";
        }
      }

      // ---- "Late fees again" / "What if your money just" / "sorted itself?" ----
      {
        const bIn = [158, 160, 161.5, 163, 164.5];
        const showA = f >= 140 && f < 172;
        placeLine(T2a, f, showA, 0, 0, 1 + 0.03 * ramp(f, 142, 170));
        if (showA) [140.5, 142, 144].forEach((s, i) => {
          landWord(T2a.ws[i], f - s, { alpha: 1 - ramp(f, bIn[i], bIn[i] + 2.5), blur: 6 * ramp(f, bIn[i], bIn[i] + 2.5) });
        });
        const showB = f >= 159 && f < 194;
        placeLine(T2b, f, showB, -1000 * eIn(ramp(f, 184, 193)), 0, 1 + 0.02 * ramp(f, 160, 184), 14 * ramp(f, 185, 192));
        if (showB) bIn.forEach((s, i) => landWord(T2b.ws[i], f - s));
        const showC = f >= 181 && f < 214;
        const enter = 1 - eOut(ramp(f, 184, 195));
        placeLine(T2c, f, showC, 360 * enter - 1250 * eIn(ramp(f, 204, 213)), 0, 1 + 0.03 * ramp(f, 194, 204), 10 * enter * ramp(f, 183, 186) + 16 * ramp(f, 205, 212));
        if (showC) {
          [181, 187].forEach((s, i) => landWord(T2c.ws[i], f - s, { arc: i === 0 }));
          // the letters ride a wave that dies down as the line lands
          let k = 0;
          T2c.ws.forEach((w) => w.letters.forEach((l) => {
            const a = f - 185;
            l.style.transform = `translateY(${(0.22 * Math.sin(k * 0.75 - a * 0.55) * Math.exp(-Math.max(0, a) / 6) * ramp(f, 182, 185)).toFixed(3)}em)`;
            k++;
          }));
        }
      }

      // ---- cards ----
      {
        const show = f >= 214 && f < 300;
        cardsL.style.display = show ? "block" : "none";
        if (show) CARDS.forEach((c, i) => {
          const a = f - c.e;
          if (a < 0) { c.el.style.display = "none"; return; }
          c.el.style.display = "block";
          const x = cardX(i, f);
          const ry = -30 * Math.exp(-a / 4), rz = 1.5 * Math.exp(-a / 4);
          c.el.style.transform = `translate(${px(x - 330)}, ${px(540 - 330 + 6 * Math.sin(a * 0.07))}) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
          c.el.style.opacity = clamp(a / 1.5, 0, 1);
          const next = CARDS[i + 1];
          c.inner.style.opacity = 1 - (next ? 0.55 * ramp(f, next.e + 2, next.e + 10) : 0);
          c.el.style.filter = blurOf(3 * Math.exp(-a / 2) + 8 * ramp(f, 294, 299.5));
        });
      }

      // ---- "All in one place", Smart / Simple / Secure ----
      {
        const show = f >= 300 && f < 330;
        placeLine(T3, f, show, -1000 * eIn(ramp(f, 322, 330)), 0, 1 + 0.03 * ramp(f, 301, 322), 14 * ramp(f, 323, 329));
        if (show) [300.5, 301.3, 302.1, 302.9].forEach((s, i) => landWord(T3.ws[i], f - s, { arc: false }));
        const WIN = [[327, 333, 338, 343], [339, 345, 355, 359], [356, 362, 999, 999]];
        T4.forEach((L4, i) => {
          const [a0, a1, b0, b1] = WIN[i];
          const vis = f >= a0 && f < Math.min(b1, 385);
          const inn = eOut(ramp(f, a0, a1)), out = eIn(ramp(f, b0, b1));
          let s = 1, alpha = clamp((f - a0) / 3, 0, 1) * (b0 < 999 ? 1 - ramp(f, b0 + 1, b1 - 0.5) : 1);
          if (i === 2) { s = lerp(1.08, 1, inn) - 0.07 * sm(ramp(f, 362, 383)); alpha *= 1 - ramp(f, 376, 384); }
          placeLine(L4, f, vis, 140 * (1 - inn) - 520 * out, 0, s, 9 * (1 - inn) + 18 * out, alpha * (i ? clamp((f - a0 - 1) / 3, 0, 1) : 1));
          L4.ws[0].span.style.color = mix("#8a8a92", INK, inn);
          L4.ws[0].arc.style.opacity = 0;
        });
      }

      // ---- icon + wordmark ----
      {
        const show = f >= 384;
        logoL.style.display = show ? "block" : "none";
        if (show) {
          const s = keys(f, [[384, 1480], [386, 940], [388, 660], [390, 500], [392, 404], [394, 346], [396, 318], [404, 298], [412, 272], [416, 218], [418, 158], [420, 78], [421.5, 0]]);
          icon.style.display = s > 1 ? "block" : "none";
          icon.style.width = icon.style.height = px(s);
          icon.style.borderRadius = px(s * 0.23);
          icon.style.transform = `translate(${px(960 - s / 2)}, ${px(540 - s / 2)})`;
          icon.style.filter = blurOf(keys(f, [[384, 10], [388, 4], [392, 1], [394, 0]]));
          icon.style.boxShadow = `0 0 ${px(s * 0.25)} rgba(255,255,255,${(0.12 * ramp(f, 390, 396)).toFixed(3)})`;
          iconBg.style.opacity = 1 - ramp(f, 387, 391);
          const rise = 1 - eOut(ramp(f, 387, 393));
          mark.style.transform = `translate(-50%, ${(-50 + 90 * rise).toFixed(2)}%)`;
          mark.style.opacity = ramp(f, 387, 389);
          mark.style.filter = blurOf(4 * rise);

          const wOn = f >= 421.5 && f < 439;
          wordmark.style.display = glow.style.display = wOn ? "block" : "none";
          const ws = keys(f, [[421.5, 1.06], [422, 1], [424, 0.78], [426, 0.63], [428, 0.52], [430, 0.47], [432, 0.42], [434, 0.36], [436, 0.29], [438, 0.17], [439, 0.06]]);
          wordmark.style.transform = `translate(-50%, -52%) scale(${ws.toFixed(4)})`;
          glow.style.transform = `scale(${(0.4 + 0.6 * ws).toFixed(4)})`;
          glow.style.opacity = 1 - ramp(f, 434, 439);
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
