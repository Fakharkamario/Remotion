// Frames 17-47: the headline builds word by word on the dark grid while warm tiles fly out left;
// an orange glint runs across the lead word, then lights the brand word; a grainy orange wipe
// breaks the line, the brand word flashes giant (white, then black), and settles small on orange.
(function () {
  const K = window.K;
  const CREAM = "#FFF0E2", ORANGE = "#F2592A", GOLD = "#F59A34";
  const SIZE = 109, W = 500, LS = -0.04, BASE = 581;

  const ARRIVE = [17, 17, 18, 20, 22];
  const SLIDE = K.key([[17, 150], [18, 145], [19, 145], [20, 10], [21, 0]]);
  // lead word: letters from `lo` on glow gold (the glint moving right)
  const LEAD_LO = K.step([[17, 0], [20, 1], [22, 2], [23, 99]]);

  // warm tiles flying out left: [frame, x, y, side, rotDeg]
  const tile = (pts) => {
    const k = [1, 2, 3, 4].map((c) => K.key(pts.map((p) => [p[0], p[c]])));
    return (f) => k.map((fn) => fn(f));
  };
  const FLY = [
    { at: tile([[17, 290, 350, 250, -12], [18, 400, 40, 400, -25], [20, 130, 310, 500, 3], [21, -210, 110, 520, 3]]), from: 17, to: 21 },
    { at: tile([[17, -160, 980, 300, -5], [18, 230, 625, 480, -5], [20, 190, 1000, 480, -10], [21, -150, 890, 480, -10]]), from: 18, to: 21 },
  ];

  function brandLit(f, j, n) {
    // j indexes the brand word including its trailing period (n chars)
    const dot = j === n - 1;
    if (f < 26) return false;
    if (f === 26) return j < 2;
    if (f <= 28) return j < (f === 27 ? 4 : 5);
    if (f <= 36) return !dot;
    if (f <= 39) return true;
    if (f === 40) return j >= 1 && !dot;
    if (f === 41) return j >= Math.round((n - 1) * 0.375);
    return j >= Math.round((n - 1) * 0.6);
  }

  function lineLayout(ctx) {
    const words = K.BRAND.line;
    const lay = K.layout(ctx, words, SIZE, W, LS);
    return { words, lay, x0: 960 - lay.total / 2 };
  }

  // draw the headline; o: { from: first word index kept, mono: colour override, gaps: drop seed }
  function drawLine(g, f, o) {
    o = o || {};
    const { words, lay, x0 } = lineLayout(g);
    const slide = f <= 21 ? SLIDE(f) : 0;
    words.forEach((w, i) => {
      if (f < ARRIVE[i] || i < (o.from || 0)) return;
      const brand = i === words.length - 1;
      let x = x0 + lay[i].x + slide, y = BASE;
      let sc = 1;
      if (brand && f === 22) { sc = 1.06; y += 8; }
      const R = K.rng(o.seed || 1);
      let cx = 0;
      for (let j = 0; j < w.length; j++) {
        const pre = K.measure(g, w.slice(0, j), SIZE, W, LS);
        let col = o.mono || CREAM;
        if (!o.mono && i === 0 && j >= LEAD_LO(f)) col = K.mix(GOLD, "#F07A2A", j / w.length);
        if (brand && brandLit(f, j, w.length)) col = o.lit || ORANGE;
        if (o.gaps && R() < o.gaps) continue;
        cx = x + pre * sc;
        K.text(g, w[j], cx, y, { size: SIZE * sc, weight: W, color: col, ls: LS });
      }
    });
  }

  function giant(ctx, f, color, alpha) {
    const word = K.BRAND.line[K.BRAND.line.length - 1];
    const size = 465;
    ctx.save();
    ctx.globalAlpha = alpha;
    // fades out toward the right while it is white
    K.glow(ctx, (g) => {
      K.text(g, word, 60, 712, { size, weight: 500, color, ls: -0.04 });
      if (f <= 44) {
        g.globalCompositeOperation = "destination-out";
        const gr = g.createLinearGradient(1150, 0, 1700, 0);
        gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
        g.fillStyle = gr; g.fillRect(0, 0, K.W, K.H);
      }
    }, { blur: f === 46 ? 22 : 10, alpha: f === 46 ? 0.55 : 0.35, mode: "source-over", sharpBlur: f === 46 ? 2 : 1.6 });
    ctx.restore();
  }

  function speckle(ctx, f, x1, a) {
    const R = K.rng(700 + f);
    ctx.save();
    for (let i = 0; i < 9000; i++) {
      const x = R() * x1, y = R() * K.H;
      ctx.fillStyle = R() < 0.5 ? `rgba(255,170,140,${a})` : `rgba(140,20,10,${a})`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  // Horizontal gradient rendered with stochastic dither: each 2px cell picks a colour near its
  // place on the ramp, jittered hardest where the ramp changes fastest. That gives the dense
  // film-grain dissolve the reference wipe has in its transition band.
  function hgrad(ctx, stops, f) {
    const C = 2, w = K.W / C, h = K.H / C;
    const ramp = new Float32Array(w * 3);
    const cols = stops.map(([u, c]) => [u, K.hex(c)]);
    const at = (u) => {
      let i = 0;
      while (i < cols.length - 2 && u > cols[i + 1][0]) i++;
      const [u0, a] = cols[i], [u1, b] = cols[i + 1];
      const t = K.clamp((u - u0) / (u1 - u0 || 1), 0, 1);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    };
    for (let x = 0; x < w; x++) { const c = at(x / (w - 1)); ramp[x * 3] = c[0]; ramp[x * 3 + 1] = c[1]; ramp[x * 3 + 2] = c[2]; }
    const slope = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      const a = Math.max(0, x - 12), b = Math.min(w - 1, x + 12);
      slope[x] = Math.abs(ramp[b * 3] - ramp[a * 3]) + Math.abs(ramp[b * 3 + 1] - ramp[a * 3 + 1]) + Math.abs(ramp[b * 3 + 2] - ramp[a * 3 + 2]);
    }
    const cv = K.buf("dither", w, h), g = cv.getContext("2d"), im = g.createImageData(w, h), d = im.data;
    const R = K.rng(900 + f);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      // jump along the ramp by a random offset scaled to the local slope
      const j = Math.round((R() - 0.5) * 2 * Math.min(60, 4 + slope[x] * 0.18));
      const xx = K.clamp(x + j, 0, w - 1), n = (R() - 0.5) * 18;
      const o = (y * w + x) * 4;
      d[o] = ramp[xx * 3] + n; d[o + 1] = ramp[xx * 3 + 1] + n; d[o + 2] = ramp[xx * 3 + 2] + n; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, 0, 0, K.W, K.H); ctx.restore();
    // soft low-frequency blotches over it
    const m = K.buf("mottle", 48, 27), mg = m.getContext("2d"), mi = mg.createImageData(48, 27), R2 = K.rng(70 + Math.floor(f / 2));
    for (let i = 0; i < mi.data.length; i += 4) { const v = R2() < 0.5 ? 255 : 0; mi.data[i] = mi.data[i + 1] = mi.data[i + 2] = v; mi.data[i + 3] = Math.floor(R2() * 40); }
    mg.putImageData(mi, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.imageSmoothingEnabled = true; ctx.filter = "blur(18px)"; ctx.drawImage(m, 0, 0, K.W, K.H); ctx.restore();
  }

  function darkGround(ctx, f) {
    K.fill(ctx, "#0B0302");
    K.ember(ctx, 960, 560, 980, "#5A2410", K.key([[18, 0.6], [26, 0.55], [27, 0.3], [40, 0.3]])(f));
    const ox = 40 - (f - 18) * 0.8;
    // a steady faint grid, plus lit segments that flicker on and off frame to frame
    K.grid(ctx, { cell: 176, ox, oy: 70, color: "#8A220E", alpha: 0.3, width: 1.3 });
    K.glow(ctx, (g) => {
      K.segGrid(g, f, { cell: 176, ox, oy: 70, color: "#D83A1C", alpha: 0.45, width: 1.6, seed: 23, density: 0.4 });
      K.segGrid(g, f, { cell: 176, ox, oy: 70, color: "#F04A26", alpha: 0.55, width: 1.6, seed: 100 + f, density: 0.22 });
      // bright glints on some crossings, re-picked every frame
      const R = K.rng(300 + f);
      g.fillStyle = "rgba(255,110,70,0.75)";
      for (let i = -1; i < 13; i++) for (let j = -1; j < 8; j++) {
        if (R() > 0.18) continue;
        const x = ox + i * 176, y = 70 + j * 176, a = 5 + R() * 7;
        g.fillRect(x - a, y - 1, a * 2, 2); g.fillRect(x - 1, y - a, 2, a * 2);
      }
    }, { blur: 5, alpha: 0.55 });
  }

  K.SCENES = K.SCENES || {};
  K.SCENES.line = function (ctx, f, cv, tt) {
    if (tt == null) tt = f;
    if (f === 17) {
      K.fill(ctx, "#705441");
      K.grid(ctx, { cell: 226, ox: 113, oy: 60, color: "#8A6E5C", alpha: 0.5, width: 1.2 });
      K.ember(ctx, 700, 560, 700, "#8A6A50", 0.4);
    } else if (f <= 40) {
      darkGround(ctx, f);
      if (f >= 37) {
        const a = K.key([[37, 0.45], [38, 0.65], [40, 0.9]])(f);
        const gr = ctx.createLinearGradient(0, 0, 760, 0);
        gr.addColorStop(0, `rgba(196,48,24,${a})`); gr.addColorStop(0.45, `rgba(150,36,16,${a * 0.55})`); gr.addColorStop(1, "rgba(120,30,10,0)");
        ctx.fillStyle = gr; ctx.fillRect(0, 0, K.W, K.H);
        speckle(ctx, f, 500, 0.08 * a);
      }
    }

    if (f <= 40) {
      // text with its warm halo
      // the halo is big and warm while the line builds, then pulls in tight once the brand word lights
      const halo = K.key([[17, 0.5], [21, 1.0], [26, 1.0], [27, 0.55], [36, 0.5], [38, 0.62], [40, 0.7]])(f);
      K.glow(ctx, (g) => drawLine(g, f), { blur: 30, alpha: 0.55 * halo, passes: 2, mode: "lighter", sharp: false });
      K.glow(ctx, (g) => drawLine(g, f), { blur: 10, alpha: 0.8 * halo, mode: "lighter" });
      // flying tiles in front

      if (f === 17) {
        K.tile(ctx, 1826, 366, 112, { fill: "#FA5F24" });
        K.tile(ctx, 1670, 1080, 112, { fill: "#FA5F24" });
      }
    } else if (f === 41) {
      hgrad(ctx, [[0, "#D43F29"], [0.25, "#C84A30"], [0.42, "#7E5048"], [0.55, "#5E504C"], [1, "#57504D"]], f);
      K.grid(ctx, { cell: 176, ox: 40, oy: 70, color: "#9A6050", alpha: 0.18, width: 1.2 });
      speckle(ctx, f, 600, 0.12);
      drawLine(ctx, f, { mono: "#B4A8A3", lit: "#F25A2A" });
    } else if (f === 42) {
      hgrad(ctx, [[0, "#E74628"], [0.32, "#E04A2C"], [0.5, "#CA9C8D"], [0.68, "#B7B0AF"], [1, "#B9AFAF"]], f);
      K.grid(ctx, { cell: 176, ox: 40, oy: 70, color: "#C88070", alpha: 0.22, width: 1.2 });
      speckle(ctx, f, 900, 0.16);
      drawLine(ctx, f, { from: 1, mono: "#5E5450", lit: "#F2502A" });
    } else if (f <= 44) {
      hgrad(ctx, [[0, "#E74628"], [0.36, "#EA4A2A"], [0.5, "#F2A090"], [0.62, "#FCF2EC"], [1, "#FDF8F6"]], f);
      K.grid(ctx, { cell: 176, ox: 40, oy: 70, color: "#E0C8C0", alpha: 0.5, width: 1.2 });
      speckle(ctx, f, 1000, 0.2);
      drawLine(ctx, f, { from: 1, mono: "#4A403C", lit: "#4A403C", gaps: 0.18, seed: 3 });
      giant(ctx, f, "#FFFFFF", 1);
    } else if (f === 45) {
      hgrad(ctx, [[0, "#E24324"], [0.42, "#EC4C2A"], [0.58, "#B8705E"], [0.7, "#8A7F7D"], [1, "#8A7F7D"]], f);
      speckle(ctx, f, 900, 0.12);
      ctx.save(); ctx.globalAlpha = 0.6; drawLine(ctx, f, { from: 2, mono: "#A08070", lit: "#E0603A" }); ctx.restore();
    } else if (f === 46) {
      hgrad(ctx, [[0, "#CE3C1C"], [0.3, "#EE4A26"], [0.7, "#E8502A"], [0.86, "#B03A16"], [1, "#300F06"]], f);
      K.grid(ctx, { cell: 176, ox: 40, oy: 70, color: "#FF8A6A", alpha: 0.18, width: 1.4 });
      speckle(ctx, f, 1920, 0.08);
      ctx.save(); ctx.globalAlpha = 0.35; drawLine(ctx, f, { from: 3, mono: "#F0C0A8", lit: "#F0C0A8" }); ctx.restore();
      giant(ctx, f, "#0A0202", 1);
    } else {
      // 47: small brand word alone on bright orange
      K.fill(ctx, "#F24A27");
      K.ember(ctx, 960, 540, 900, "#FF5A30", 0.35);
      K.glow(ctx, (g) => K.grid(g, { cell: 176, ox: 40, oy: 70, color: "#FF9A7A", alpha: 0.4, width: 1.6 }), { blur: 4, alpha: 0.5 });
      K.vignette(ctx, 0.5, "rgba(110,24,6,0.75)");
      const word = K.BRAND.line[K.BRAND.line.length - 1];
      const w = K.measure(ctx, word, SIZE, W, LS);
      K.glow(ctx, (g) => K.text(g, word, 960 - w / 2, 583, { size: SIZE, weight: W, color: "#FFEFE2", ls: LS }), { blur: 12, alpha: 0.45, mode: "lighter" });
    }

    if (f <= 40 && f >= 18) K.vignette(ctx, 0.55);
    // flying tiles sit in front of everything, unvignetted, at full saturation
    if (f <= 21) FLY.forEach((o) => {
      if (f < o.from || f > o.to) return;
      const [x, y, sd, r] = o.at(Math.max(o.from, tt));
      const col = f === 17 && o === FLY[0] ? "#BD5970" : "#FF6226";
      K.glow(ctx, (g) => K.tile(g, x, y, sd, { fill: col, rot: (r * Math.PI) / 180, radius: 0.035 }), { blur: 26, alpha: 0.55, mode: "lighter" });
    });
    K.bloom(cv, f <= 40 ? 0.22 : 0.1, 60);
    K.grain(ctx, f, f >= 41 ? 0.1 : 0.06);
  };
})();
