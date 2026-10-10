// Shared canvas kit for the Fluxdesk early access compositions.
// Every scene is a pure function of the reference animation frame (24 fps), drawn on a 1920x1080
// canvas, so any frame can be seeked and rendered in isolation. The clip renders at 30 fps; like the
// reference, each output frame shows animation frame floor(t * 24), so every fifth frame repeats.
(function () {
  const K = {};
  K.W = 1920;
  K.H = 1080;
  K.FPS = 24;

  K.C = {
    bg: "#110503",
    bg2: "#1c0905",
    orange: "#F2592A",
    orange2: "#FF7A3D",
    ember: "#C8401C",
    peach: "#FFD898",
    cream: "#FBE6D2",
    light: "#FBF1EB",
    grey: "#8F817C",
    blue: "#2E36F6",
    blueLt: "#E9EBFB",
    lav: "#8E93F2",
    green: "#36E08A",
    teal: "#2EE6B8",
    brown: "#3E1A0C",
  };

  // ------------------------------------------------------------------ math
  K.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.inv = (a, b, v) => K.clamp((v - a) / (b - a || 1e-6), 0, 1);
  K.eo = (t, p) => 1 - Math.pow(1 - K.clamp(t, 0, 1), p || 3);
  K.ei = (t, p) => Math.pow(K.clamp(t, 0, 1), p || 3);
  K.eio = (t) => { t = K.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  // monotone cubic through [[frame, value], ...]; clamps outside the keys
  K.key = function (pts) {
    const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    if (n === 1) return () => ys[0];
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1e-6));
    for (let i = 0; i < n; i++) {
      if (i === 0) m.push(d[0]);
      else if (i === n - 1) m.push(d[n - 2]);
      else m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
    }
    return function (t) {
      if (t <= xs[0]) return ys[0];
      if (t >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (t > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h;
      const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
      return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
    };
  };
  // step table [[frame, value], ...]: value of the last key at or before f
  K.step = (pts) => (f) => { let v = pts[0][1]; for (const p of pts) if (f >= p[0]) v = p[1]; return v; };

  // ---------------------------------------------------------------- colour
  K.hex = function (h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  K.mix = function (a, b, t) {
    const A = K.hex(a), B = K.hex(b);
    t = K.clamp(t, 0, 1);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  K.rgba = function (h, a) {
    const c = K.hex(h);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  };

  // ---------------------------------------------------------------- canvas
  K.canvas = function (w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const pool = {};
  K.buf = function (name, w, h) {
    const k = name + w + "x" + h;
    if (!pool[k]) pool[k] = K.canvas(w || K.W, h || K.H);
    const c = pool[k];
    const g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.filter = "none";
    g.clearRect(0, 0, c.width, c.height);
    return c;
  };

  // Draw fn into an offscreen layer, then composite it blurred (glow) and sharp.
  K.glow = function (ctx, fn, o) {
    o = Object.assign({ blur: 18, alpha: 0.9, sharp: true, mode: "lighter", passes: 1 }, o || {});
    const c = K.buf("glow");
    const g = c.getContext("2d");
    fn(g);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.blur > 0 && o.alpha > 0) {
      ctx.globalCompositeOperation = o.mode;
      for (let i = 0; i < o.passes; i++) {
        ctx.globalAlpha = o.alpha;
        ctx.filter = `blur(${o.blur * (i + 1)}px)`;
        ctx.drawImage(c, 0, 0);
      }
      ctx.filter = "none";
    }
    if (o.sharp) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = o.sharpAlpha == null ? 1 : o.sharpAlpha;
      if (o.sharpBlur) ctx.filter = `blur(${o.sharpBlur}px)`;
      ctx.drawImage(c, 0, 0);
      ctx.filter = "none";
    }
    ctx.restore();
  };

  // Whole-frame bloom: a downscaled blurred copy screened back over the frame.
  K.bloom = function (cv, amount, radius) {
    if (!(amount > 0)) return;
    const ctx = cv.getContext("2d");
    const s = K.buf("bloom", 480, 270);
    const g = s.getContext("2d");
    g.filter = `blur(${(radius || 40) / 4}px)`;
    g.drawImage(cv, 0, 0, 480, 270);
    g.filter = "none";
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = K.clamp(amount, 0, 1);
    ctx.drawImage(s, 0, 0, K.W, K.H);
    ctx.restore();
  };

  // Blur the whole frame in place (defocus / motion smear).
  K.defocus = function (cv, px, o) {
    if (!(px > 0.3)) return;
    o = o || {};
    const ctx = cv.getContext("2d");
    const c = K.buf("defocus");
    const g = c.getContext("2d");
    g.drawImage(cv, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.dx || o.dy) {
      // directional smear: several shifted copies
      const n = 8;
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, K.W, K.H);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1) - 0.5;
        ctx.globalAlpha = 1 / (i + 1);
        ctx.drawImage(c, u * (o.dx || 0), u * (o.dy || 0));
      }
    } else {
      // oversize the source a little so the blur doesn't pull transparency in at the edges
      const m = px * 3;
      ctx.clearRect(0, 0, K.W, K.H);
      ctx.filter = `blur(${px}px)`;
      ctx.drawImage(c, -m, -m, K.W + m * 2, K.H + m * 2);
    }
    ctx.restore();
  };

  K.vignette = function (ctx, a, color) {
    const g = ctx.createRadialGradient(K.W / 2, K.H / 2, K.H * 0.35, K.W / 2, K.H / 2, K.W * 0.62);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, color || `rgba(0,0,0,${a == null ? 0.55 : a})`);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, K.W, K.H);
    ctx.restore();
  };

  // film grain, seeded per frame
  const grainTiles = [];
  K.grain = function (ctx, f, a) {
    if (!grainTiles.length) {
      for (let k = 0; k < 4; k++) {
        const c = K.canvas(256, 256), g = c.getContext("2d"), im = g.createImageData(256, 256), r = K.rng(99 + k);
        for (let i = 0; i < im.data.length; i += 4) {
          const v = Math.floor(r() * 255);
          im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
          im.data[i + 3] = 255;
        }
        g.putImageData(im, 0, 0);
        grainTiles.push(c);
      }
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a == null ? 0.05 : a;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = ctx.createPattern(grainTiles[Math.floor(f) % 4], "repeat");
    ctx.fillRect(0, 0, K.W, K.H);
    ctx.restore();
  };

  K.fill = function (ctx, color) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, K.W, K.H);
    ctx.restore();
  };

  // Warm radial glow (the soft ember light behind most scenes).
  K.ember = function (ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, K.rgba(color || K.C.orange, a == null ? 0.5 : a));
    g.addColorStop(1, K.rgba(color || K.C.orange, 0));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };

  // ------------------------------------------------------------------ grid
  // Infinite grid in the current transform: cell size, origin, line colour/width, view bounds.
  K.grid = function (ctx, o) {
    o = Object.assign({ cell: 120, ox: 0, oy: 0, color: K.C.orange, alpha: 0.35, width: 1.5, x0: -3000, y0: -3000, x1: 4920, y1: 4080, dash: null, dots: false }, o || {});
    ctx.save();
    ctx.strokeStyle = K.rgba(o.color, o.alpha);
    ctx.lineWidth = o.width;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    const sx = Math.floor((o.x0 - o.ox) / o.cell), ex = Math.ceil((o.x1 - o.ox) / o.cell);
    const sy = Math.floor((o.y0 - o.oy) / o.cell), ey = Math.ceil((o.y1 - o.oy) / o.cell);
    if (ex - sx > 400 || ey - sy > 400) { ctx.restore(); return; }
    for (let i = sx; i <= ex; i++) { const x = o.ox + i * o.cell; ctx.moveTo(x, o.y0); ctx.lineTo(x, o.y1); }
    for (let j = sy; j <= ey; j++) { const y = o.oy + j * o.cell; ctx.moveTo(o.x0, y); ctx.lineTo(o.x1, y); }
    ctx.stroke();
    if (o.dots) {
      ctx.fillStyle = K.rgba(o.color, Math.min(1, o.alpha * 2.2));
      const d = o.width * 2.2;
      for (let i = sx; i <= ex; i++) for (let j = sy; j <= ey; j++) ctx.fillRect(o.ox + i * o.cell - d / 2, o.oy + j * o.cell - d / 2, d, d);
    }
    ctx.restore();
  };

  // Broken "segment" grid: short lit segments along grid lines (the flickering background).
  K.segGrid = function (ctx, f, o) {
    o = Object.assign({ cell: 150, ox: 0, oy: 0, color: K.C.orange, alpha: 0.5, width: 1.5, seed: 3, density: 0.5 }, o || {});
    const r = K.rng(o.seed);
    ctx.save();
    ctx.strokeStyle = K.rgba(o.color, o.alpha);
    ctx.lineWidth = o.width;
    ctx.beginPath();
    for (let i = -2; i < K.W / o.cell + 3; i++) {
      for (let j = -2; j < K.H / o.cell + 3; j++) {
        const x = o.ox % o.cell + i * o.cell, y = o.oy % o.cell + j * o.cell;
        const a = r(), b = r(), c = r();
        if (a < o.density) { ctx.moveTo(x, y); ctx.lineTo(x + o.cell * (0.3 + 0.7 * c), y); }
        if (b < o.density) { ctx.moveTo(x, y); ctx.lineTo(x, y + o.cell * (0.3 + 0.7 * r())); }
      }
    }
    ctx.stroke();
    ctx.restore();
  };

  // ---------------------------------------------------------------- glyphs
  // Vector glyphs used throughout: "/", ">", "<", "+", ".", "x". Centered at (x, y), em size s.
  K.glyph = function (ctx, type, x, y, s, color, rot, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.fillStyle = color;
    const t = s * (o.weight || 0.16);
    ctx.beginPath();
    if (type === "/") {
      const h = s * 0.5, w = s * 0.2;
      ctx.moveTo(-w - t * 0.5, h); ctx.lineTo(-w + t * 0.6, h); ctx.lineTo(w + t * 0.5, -h); ctx.lineTo(w - t * 0.6, -h); ctx.closePath();
    } else if (type === ">" || type === "<") {
      const k = type === ">" ? 1 : -1, w = s * 0.3, h = s * 0.3;
      ctx.moveTo(-w * k, -h); ctx.lineTo(w * k, 0); ctx.lineTo(-w * k, h);
      ctx.lineTo(-w * k, h - t * 1.15); ctx.lineTo((w - t * 1.6) * k, 0); ctx.lineTo(-w * k, -h + t * 1.15); ctx.closePath();
    } else if (type === "+") {
      const a = s * 0.32;
      ctx.rect(-a, -t / 2, a * 2, t); ctx.rect(-t / 2, -a, t, a * 2);
    } else if (type === ".") {
      const a = s * 0.12;
      ctx.rect(-a, -a, a * 2, a * 2);
    } else if (type === "=") {
      const a = s * 0.3;
      ctx.rect(-a, -t * 1.2, a * 2, t * 0.8); ctx.rect(-a, t * 0.4, a * 2, t * 0.8);
    } else if (type === "|") {
      ctx.rect(-t / 2, -s * 0.36, t, s * 0.72);
    }
    ctx.fill();
    ctx.restore();
  };

  // Glyph tile: a filled square with a dark glyph, optional corner marks.
  K.tile = function (ctx, x, y, size, o) {
    o = Object.assign({ fill: K.C.peach, glyph: null, gcolor: K.C.brown, gsize: 0.45, rot: 0, corners: false, ccolor: K.C.orange2, stroke: null, alpha: 1 }, o || {});
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot);
    ctx.globalAlpha *= o.alpha;
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(-size / 2, -size / 2, size, size); }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 3; ctx.strokeRect(-size / 2, -size / 2, size, size); }
    if (o.glyph) K.glyph(ctx, o.glyph, 0, 0, size * o.gsize, o.gcolor, 0, { weight: o.gweight });
    if (o.corners) {
      const c = size / 2;
      [[-c, -c], [c, -c], [c, c], [-c, c]].forEach(([cx, cy]) => K.glyph(ctx, "+", cx, cy, size * 0.18, o.ccolor, 0, { weight: 0.22 }));
    }
    if (o.nodes) {
      const c = size / 2, n = o.nodes;
      ctx.fillStyle = o.ncolor || o.stroke || K.C.orange;
      [[-c, -c], [c, -c], [c, c], [-c, c]].forEach(([cx, cy]) => ctx.fillRect(cx - n / 2, cy - n / 2, n, n));
    }
    ctx.restore();
  };

  // Dashed connector with a small arrow head midway.
  K.dashed = function (ctx, x0, y0, x1, y1, o) {
    o = Object.assign({ color: "rgba(255,230,210,0.55)", width: 1.5, dash: [5, 6], arrow: true, curve: 0 }, o || {});
    ctx.save();
    ctx.strokeStyle = o.color;
    ctx.fillStyle = o.color;
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash);
    ctx.beginPath();
    const mx = (x0 + x1) / 2 - (y1 - y0) * o.curve, my = (y0 + y1) / 2 + (x1 - x0) * o.curve;
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    if (o.arrow) {
      const t = 0.5, ax = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, ay = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
      const dx = 2 * (1 - t) * (mx - x0) + 2 * t * (x1 - mx), dy = 2 * (1 - t) * (my - y0) + 2 * t * (y1 - my);
      const a = Math.atan2(dy, dx), L = 7;
      ctx.beginPath();
      ctx.moveTo(ax + Math.cos(a) * L, ay + Math.sin(a) * L);
      ctx.lineTo(ax + Math.cos(a + 2.5) * L, ay + Math.sin(a + 2.5) * L);
      ctx.lineTo(ax + Math.cos(a - 2.5) * L, ay + Math.sin(a - 2.5) * L);
      ctx.fill();
    }
    ctx.restore();
  };

  // Dashed ellipse orbit with arrow heads.
  K.orbit = function (ctx, cx, cy, rx, ry, rot, o) {
    o = Object.assign({ color: "rgba(255,230,210,0.5)", width: 1.5, dash: [4, 6], from: 0, to: Math.PI * 2, arrows: 2 }, o || {});
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot || 0);
    ctx.strokeStyle = o.color;
    ctx.fillStyle = o.color;
    ctx.lineWidth = o.width;
    ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, o.from, o.to);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < o.arrows; i++) {
      const a = o.from + (o.to - o.from) * ((i + 0.5) / o.arrows);
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry, tx = -Math.sin(a) * rx, ty = Math.cos(a) * ry, an = Math.atan2(ty, tx), L = 7;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(an) * L, y + Math.sin(an) * L);
      ctx.lineTo(x + Math.cos(an + 2.5) * L, y + Math.sin(an + 2.5) * L);
      ctx.lineTo(x + Math.cos(an - 2.5) * L, y + Math.sin(an - 2.5) * L);
      ctx.fill();
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------ text
  K.font = (size, weight, fam) => `${weight || 500} ${size}px ${fam || '"Inter", system-ui, sans-serif'}`;
  K.measure = function (ctx, str, size, weight, ls) {
    ctx.save();
    ctx.font = K.font(size, weight);
    ctx.letterSpacing = (ls == null ? -0.035 : ls) * size + "px";
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };
  K.text = function (ctx, str, x, y, o) {
    o = Object.assign({ size: 96, weight: 500, color: K.C.cream, align: "left", base: "alphabetic", ls: -0.035, alpha: 1, fam: null }, o || {});
    ctx.save();
    ctx.font = K.font(o.size, o.weight, o.fam);
    ctx.letterSpacing = o.ls * o.size + "px";
    ctx.textAlign = o.align;
    ctx.textBaseline = o.base;
    ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = o.color;
    ctx.fillText(str, x, y);
    if (o.stroke) {
      ctx.lineWidth = o.lw || 2;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(str, x, y);
    }
    ctx.restore();
  };
  // Lay out a line of words: returns [{w, x, width}] with x relative to the line's left edge.
  K.layout = function (ctx, words, size, weight, ls) {
    const sp = K.measure(ctx, " ", size, weight, ls);
    let x = 0;
    const out = words.map((w) => {
      const width = K.measure(ctx, w, size, weight, ls);
      const r = { w, x, width };
      x += width + sp;
      return r;
    });
    out.total = x - sp;
    return out;
  };

  // ------------------------------------------------------------ pixel art
  // Pixel pointing-hand cursor (original 14x16 sprite). o = outline, w = fill.
  const HAND = [
    "....oo........",
    "...owwo.......",
    "...owwo.......",
    "...owwo.......",
    "...owwooo.....",
    "...owwowwooo..",
    "oo.owwowwowwo.",
    "owwowwwwwwowwo",
    "owwwwwwwwwwwwo",
    ".owwwwwwwwwwwo",
    ".owwwwwwwwwwwo",
    "..owwwwwwwwwo.",
    "..owwwwwwwwwo.",
    "...owwwwwwwo..",
    "...owwwwwwwo..",
    "...ooooooooo..",
  ];
  K.hand = function (ctx, x, y, px, o) {
    o = Object.assign({ fill: "#FFFFFF", line: "#1A0A05", rot: 0, flip: false, alpha: 1 }, o || {});
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    ctx.globalAlpha *= o.alpha;
    const w = HAND[0].length, h = HAND.length;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const c = HAND[j][i];
        if (c === ".") continue;
        ctx.fillStyle = c === "o" ? o.line : o.fill;
        ctx.fillRect((i - 4.5) * px, (j - 1) * px, px + 0.5, px + 0.5);
      }
    }
    ctx.restore();
  };

  // Blocky pixel cloud (the cursor trail / burst): seeded cells inside a soft blob.
  K.pixelCloud = function (ctx, cx, cy, r, cell, seed, color, k) {
    const rnd = K.rng(seed);
    ctx.save();
    ctx.fillStyle = color || K.C.orange2;
    const n = Math.ceil(r / cell) + 1;
    for (let j = -n; j <= n; j++) {
      for (let i = -n; i <= n; i++) {
        const x = i * cell, y = j * cell;
        const d = Math.hypot(x, y * 1.1) / r + (rnd() - 0.5) * 0.45;
        if (d < (k == null ? 1 : k)) ctx.fillRect(cx + x - cell / 2, cy + y - cell / 2, cell + 0.5, cell + 0.5);
      }
    }
    ctx.restore();
  };

  // 5x7 pixel font for the big pixel letters
  const PIX = {
    N: ["X...X", "XX..X", "X.X.X", "X.X.X", "X..XX", "X...X", "X...X"],
    O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
    V: ["X...X", "X...X", "X...X", "X...X", ".X.X.", ".X.X.", "..X.."],
    A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
    $: ["..X..", ".XXXX", "X.X..", ".XXX.", "..X.X", "XXXX.", "..X.."],
  };
  K.pixelLetter = function (ctx, ch, x, y, cell, color, o) {
    o = o || {};
    const g = PIX[ch];
    if (!g) return;
    const rnd = K.rng(o.seed || 5);
    ctx.save();
    ctx.fillStyle = color;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) {
      if (g[j][i] !== "X") continue;
      if (o.drop && rnd() < o.drop) continue;
      ctx.fillRect(x + i * cell, y + j * cell, cell + 0.5, cell + 0.5);
    }
    ctx.restore();
  };

  // ------------------------------------------------------------- 3D bits
  // Project a 3D point with a simple camera: rotate (rx, ry, rz), translate z, perspective.
  K.proj = function (p, cam) {
    let [x, y, z] = p;
    const { rx = 0, ry = 0, rz = 0 } = cam;
    let c = Math.cos(ry), s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rx); s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(rz); s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
    const d = cam.d || 1600, zz = z + (cam.z || 0);
    const k = d / Math.max(50, d + zz);
    return [(cam.cx == null ? K.W / 2 : cam.cx) + x * k * (cam.s || 1), (cam.cy == null ? K.H / 2 : cam.cy) + y * k * (cam.s || 1), k];
  };
  // CSS-style matrix for drawing a flat layer in 3D: maps the layer's rect corners via proj and
  // draws it as two affine triangles (good enough for mild perspective).
  K.drawQuad = function (ctx, img, sw, sh, P) {
    // P: 4 projected corners [tl, tr, br, bl]
    const tri = (s0, s1, s2, d0, d1, d2) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.lineTo(d2[0], d2[1]); ctx.closePath();
      ctx.clip();
      const den = s0[0] * (s2[1] - s1[1]) - s1[0] * s2[1] + s2[0] * s1[1] + (s1[0] - s2[0]) * s0[1];
      const a = -(s0[1] * (d2[0] - d1[0]) - s1[1] * d2[0] + s2[1] * d1[0] + (s1[1] - s2[1]) * d0[0]) / den;
      const b = (s1[1] * d2[1] + s0[1] * (d1[1] - d2[1]) - s2[1] * d1[1] + (s2[1] - s1[1]) * d0[1]) / den;
      const c = (s0[0] * (d2[0] - d1[0]) - s1[0] * d2[0] + s2[0] * d1[0] + (s1[0] - s2[0]) * d0[0]) / den;
      const d = -(s1[0] * d2[1] + s0[0] * (d1[1] - d2[1]) - s2[0] * d1[1] + (s2[0] - s1[0]) * d0[1]) / den;
      const e = (s0[0] * (s2[1] * d1[0] - s1[1] * d2[0]) + s0[1] * (s1[0] * d2[0] - s2[0] * d1[0]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[0]) / den;
      const f = (s0[0] * (s2[1] * d1[1] - s1[1] * d2[1]) + s0[1] * (s1[0] * d2[1] - s2[0] * d1[1]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[1]) / den;
      ctx.transform(a, b, c, d, e, f);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    // subdivide into a grid for better perspective
    const N = 8;
    const lerp2 = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N;
      const at = (u, v) => P(u, v);
      const d00 = at(u0, v0), d10 = at(u1, v0), d11 = at(u1, v1), d01 = at(u0, v1);
      const s00 = [u0 * sw, v0 * sh], s10 = [u1 * sw, v0 * sh], s11 = [u1 * sw, v1 * sh], s01 = [u0 * sw, v1 * sh];
      // expand dest slightly to hide seams
      tri(s00, s10, s11, d00, d10, d11);
      tri(s00, s11, s01, d00, d11, d01);
    }
    void lerp2;
  };

  // ----------------------------------------------------------------- mount
  // Mounts a canvas scene into the composition root `id`. draw(ctx, f, cv) is called with the
  // reference frame number f = base + local frame. Driven by a GSAP setter tween so seeks redraw.
  K.mount = function (id, base, frames, draw) {
    const host = document.querySelector(`[data-composition-id="${id}"] .stage`);
    const cv = K.canvas(K.W, K.H);
    cv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block";
    host.appendChild(cv);
    const ctx = cv.getContext("2d");
    let cur = -1;
    const render = (lf) => {
      const f = base + Math.min(frames - 1, Math.max(0, Math.floor(lf + 1e-3)));
      cur = lf;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      ctx.clearRect(0, 0, K.W, K.H);
      draw(ctx, f, cv);
    };
    const R = { frame(v) { if (v === undefined) return cur; render(v); } };
    const tl = gsap.timeline({ paused: true });
    const dur = frames / K.FPS;
    tl.fromTo(R, { frame: 0 }, { frame: frames, duration: dur, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, dur);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(Math.max(0, cur)));
    tl.seek(0.001).seek(0);
    window.__timelines = window.__timelines || {};
    window.__timelines[id] = tl;
    return tl;
  };

  window.K = K;
})();
