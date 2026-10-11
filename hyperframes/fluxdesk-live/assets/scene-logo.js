// Frames 102-174: a white flash; the wordmark types in letter by letter beside the mark as the
// ground falls to black and focus pulls in; it holds; dashed arcs tie the letters together and
// they are eaten by glyphs ( / > + . ); the domain types out with a glyph cursor running ahead.
(function () {
  const K = window.K;
  const RED = "#FF4B1C";

  const COUNT = K.step([[102, 1], [103, 2], [105, 4], [106, 5], [108, 6], [110, 7], [115, 8]]);
  const NEWAT = [102, 103, 105, 105, 106, 108, 110, 115]; // frame each letter appears
  const MARKS = K.key([[101, 1.8], [102, 1.46], [103, 1.09], [105, 1.0], [108, 0.94], [110, 1.0]]);
  const BG = { 102: "#FEF7F9", 103: "#B3A9AC", 104: "#B3A9AC", 105: "#625D5F", 106: "#251E1B" };
  const BLUR = { 102: 14, 103: 8, 104: 8, 105: 5, 106: 2.5 };

  function ground(ctx, f) {
    K.fill(ctx, BG[f] || "#0A0201");
    if (!BG[f]) K.ember(ctx, 960, 560, 950, "#3A0703", 0.55);
  }

  // per-letter x offsets of the word laid out at the lockup size
  function letters(g, word, size) {
    const out = [];
    for (let j = 0; j < word.length; j++) {
      const a = K.measure(g, word.slice(0, j), size, K.LOCK.weight, K.LOCK.ls);
      const b = K.measure(g, word.slice(0, j + 1), size, K.LOCK.weight, K.LOCK.ls);
      out.push({ ch: word[j], x: a, w: b - a });
    }
    return out;
  }

  function typing(ctx, f) {
    const word = K.BRAND.word, size = K.LOCK.size, base = K.LOCK.base;
    const n = COUNT(f);
    const vis = word.slice(0, n);
    const L = K.lockupLayout(ctx, vis, 960, size);
    const ms = MARKS(f);
    const markCx = L.x0 + L.markW / 2, markCy = base - L.cap / 2;
    const lt = letters(ctx, word, size);
    const light = !!BG[f] && f <= 104;
    const draw = (g) => {
      const col = light ? "#F23A12" : RED;
      K.mark(g, markCx - (ms - 1) * L.markW * 0.35, markCy, L.b * ms, col);
      for (let j = 0; j < n; j++) {
        const drop = NEWAT[j] === f && (f === 105 || f === 106 || f === 110) ? 34 : 0;
        K.text(g, lt[j].ch, L.tx + lt[j].x, base + drop, { size, weight: K.LOCK.weight, color: col, ls: K.LOCK.ls });
      }
    };
    K.glow(ctx, draw, { blur: light ? 40 : 24, alpha: light ? 0.9 : 0.6, passes: 2, mode: light ? "source-over" : "lighter", sharpBlur: BLUR[f] || 0 });
  }

  // ------------------------------------------------------------ scramble
  // what is left of the word each frame: kept letter range, glyph, its slot, mark blocks hidden
  const SCR = {
    133: { from: 0, arcs: true },
    135: { from: 1, glyph: "/", gAt: 0, gScale: 1.15, hide: [1, 0, 0], arcs: true },
    136: { from: 1, glyph: "/", gAt: 0, gScale: 1.1, hide: [1, 0, 1], arcs: true },
    137: { from: 2, glyph: ">", gAt: 0.35, gScale: 0.8, mark: "dot", arcs: true },
    138: { from: 3, glyph: ">", gAt: 0.55, gScale: 0.85, mark: "dot", arcs: true },
    140: { from: 4, glyph: "+", gAt: 0.4, gScale: 0.8, mark: "none", arcs: true },
    141: { from: 6, glyph: "+", gAt: 1.2, gScale: 0.6, shift: -90, mark: "none", arcs: true },
    142: { dot: true },
  };
  const scrAt = (f) => { let s = null; for (const k of Object.keys(SCR).map(Number).sort((a, b) => a - b)) if (f >= k) s = SCR[k]; return s; };

  function scramble(ctx, f) {
    const s = scrAt(f);
    const word = K.BRAND.word, size = K.LOCK.size, base = K.LOCK.base;
    const L = K.lockupLayout(ctx, word, 960, size);
    const lt = letters(ctx, word, size);
    const markCx = L.x0 + L.markW / 2, markCy = base - L.cap / 2;
    if (s.dot) {
      K.glow(ctx, (g) => { g.fillStyle = RED; g.fillRect(870, 540, 20, 20); }, { blur: 14, alpha: 0.9, mode: "lighter" });
      return;
    }
    const sh = s.shift || 0;
    const pts = [];
    K.glow(ctx, (g) => {
      // mark
      if (!s.mark) K.mark(g, markCx, markCy, L.b, RED, { hide: s.hide });
      else if (s.mark === "dot") g.fillRect(markCx - L.b * 0.45, markCy - L.b * 0.7, L.b * 0.5, L.b * 0.5);
      if (!s.mark && f < 140) pts.push([markCx, markCy]);
      // letters still standing
      for (let j = s.from; j < word.length; j++) {
        const x = L.tx + lt[j].x + sh * (j >= 6 ? 1 : 0);
        K.text(g, lt[j].ch, x, base, { size, weight: K.LOCK.weight, color: RED, ls: K.LOCK.ls });
        pts.push([x + lt[j].w / 2, base - size * 0.36]);
      }
      // the glyph eating them
      if (s.glyph) {
        const gx = L.tx + lt[0].w * (0.5 + (s.gAt || 0)) + (s.glyph === "+" && f >= 141 ? 0 : 0) + (s.gAt > 1 ? lt[0].w * 0.6 : 0);
        const gs = size * s.gScale;
        K.glyph(g, s.glyph, gx, base - size * 0.36, gs, RED, 0, { weight: s.glyph === "+" ? 0.18 : 0.13 });
        pts.unshift([gx, base - size * 0.36]);
        g.strokeStyle = K.rgba(RED, 0.55); g.lineWidth = 1.5;
        const b = gs * 0.42;
        g.strokeRect(gx - b, base - size * 0.36 - b, b * 2, b * 2);
      }
    }, { blur: 20, alpha: 0.75, passes: 2, mode: "lighter" });
    // letter boxes + dashed arcs
    if (s.arcs) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,120,90,0.45)"; ctx.lineWidth = 1.2;
      for (let j = s.from; j < word.length; j++) {
        const x = L.tx + lt[j].x + sh * (j >= 6 ? 1 : 0);
        ctx.strokeRect(x, base - L.cap, lt[j].w, L.cap);
      }
      ctx.restore();
      const R = K.rng(9 + (f >= 140 ? 2 : f >= 137 ? 1 : 0));
      const n = pts.length;
      const arcs = f >= 140 ? 1 : f >= 137 ? 3 : 5;
      for (let i = 0; i < arcs && n > 1; i++) {
        const a = pts[Math.floor(R() * n)], b = pts[Math.min(n - 1, Math.floor(R() * n) + 1)];
        if (a === b) continue;
        const up = R() < 0.6 ? 1 : -1;
        K.dashed(ctx, a[0], a[1], b[0], b[1], { color: "rgba(255,225,210,0.6)", curve: 0.35 * up * (a[0] < b[0] ? -1 : 1), width: 1.3 });
        K.dashed(ctx, a[0], a[1], b[0], b[1], { color: "rgba(255,225,210,0.5)", curve: -0.18 * up * (a[0] < b[0] ? -1 : 1), width: 1.3 });
      }
    }
  }

  // ------------------------------------------------------------- domain
  const DOM = K.step([[143, 3], [145, 5], [146, 9], [147, 11], [148, 12], [150, 13], [152, 14]]);
  const CUR = K.step([[143, [".", 34]], [145, ["<", -6]], [146, ["+", 90]], [147, ["+", 206]], [148, ["+", 152]], [150, [".", 94]], [152, [".", 46]], [155, ["<", 10]], [161, null]]);
  function domain(ctx, f) {
    const d = K.BRAND.domain, size = 103, base = 579, ls = 0;
    const full = K.measure(ctx, d, size, 560, ls);
    const x0 = 960 - full / 2;
    const vis = d.slice(0, DOM(f));
    const vw = K.measure(ctx, vis, size, 560, ls);
    const cur = CUR(f);
    K.glow(ctx, (g) => {
      K.text(g, vis, x0, base, { size, weight: 560, color: "#FF5A2E", ls });
      if (cur) {
        const [gl, gap] = cur;
        const cx = x0 + vw + gap + (gl === "." ? 10 : 22);
        K.glyph(g, gl, cx, base - size * 0.3, gl === "." ? 80 : gl === "+" ? 100 : 92, "#FF5A2E", 0, { weight: gl === "+" ? 0.16 : 0.13 });
      }
    }, { blur: 18, alpha: 0.7, passes: 2, mode: "lighter" });
  }

  K.SCENES = K.SCENES || {};
  K.SCENES.logo = function (ctx, f, cv) {
    ground(ctx, f);
    if (f <= 132) typing(ctx, f);
    else if (f <= 142) scramble(ctx, f);
    else domain(ctx, f);
    if (!BG[f]) K.vignette(ctx, 0.6);
    if (!BG[f]) K.bloom(cv, 0.15, 60);
    K.grain(ctx, f, 0.05);
  };
})();
