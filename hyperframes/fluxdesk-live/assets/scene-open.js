// Frames 0-16: a pale blue field of glyph tiles turning around "Nova"; the big tiles grow in, the
// whole field wheels counter-clockwise, then cools to taupe as "now" falls toward the headline.
(function () {
  const K = window.K;
  const BLUE = "#3544FE", VIOLET = "#7A4EBB", PINK = "#BD5970", ORANGE = "#FA5F24";

  // Screen paths measured from the reference: [frame, x, y]
  const path = (pts) => {
    const X = K.key(pts.map((p) => [p[0], p[1]])), Y = K.key(pts.map((p) => [p[0], p[2]]));
    return (f) => [X(f), Y(f)];
  };
  const TILES = [
    { id: "T", big: true, at: path([[0, 711, 67], [1, 583, 125], [2, 493, 192], [3, 437, 258], [5, 407, 315], [6, 393, 359], [7, 389, 392], [8, 383, 432], [10, 372, 489], [11, 361, 571], [12, 356, 684], [13, 377, 836], [15, 450, 950], [16, 520, 1420]]),
      side: K.key([[0, 118], [1, 215], [2, 277], [3, 322], [5, 349], [8, 367], [13, 383], [16, 392]]), rot: K.key([[0, 10], [1, 30], [2, 45], [3, 42], [5, 40], [8, 38], [13, 30], [16, 26]]), warm: 1 },
    { id: "B", big: true, at: path([[0, 471, 480], [1, 421, 627], [2, 422, 743], [3, 445, 827], [5, 477, 884], [6, 509, 917], [7, 537, 936], [8, 563, 952], [10, 601, 976], [11, 661, 1006], [12, 739, 1040], [13, 840, 1150], [16, 1000, 1500]]),
      side: K.key([[0, 231], [1, 290], [2, 314], [5, 320], [12, 330]]), rot: K.key([[0, 20], [1, 35], [2, 45], [5, 45], [8, 42], [12, 40]]), warm: 1 },
    { id: "N", big: true, at: path([[4, 1060, -330], [7, 877, 18], [8, 830, 27], [10, 796, 35], [11, 756, 45], [12, 700, 58], [13, 628, 77], [15, 530, 115], [16, 410, 216]]),
      side: K.key([[7, 250], [13, 287], [15, 331], [16, 372]]), rot: K.key([[7, 40], [13, 35], [15, 30], [16, 27]]), warm: 0.55 },
    { id: "M", big: false, at: path([[0, 656, 926], [1, 734, 1015], [2, 830, 1046], [3, 920, 1150]]),
      side: K.key([[0, 140], [2, 150]]), rot: K.key([[0, 8], [2, 12]]), warm: 1 },
    { id: "S1", at: path([[0, 1198, 408], [1, 1227, 231], [2, 1182, 103], [3, 1101, 34], [5, 990, -70]]), side: () => 86, rot: () => 0, warm: 1 },
    { id: "S2", at: path([[0, 1222, 746], [1, 1344, 614], [2, 1416, 487], [3, 1442, 375], [5, 1441, 285], [6, 1427, 215], [7, 1408, 164], [8, 1388, 129], [10, 1368, 103], [11, 1335, 64], [12, 1283, 30], [13, 1200, -30]]), side: K.key([[0, 86], [10, 98]]), rot: () => 0, warm: 1 },
    { id: "S3", at: path([[0, 1018, 1002], [1, 1160, 980], [2, 1281, 930], [3, 1375, 872], [5, 1441, 816], [6, 1487, 766], [7, 1515, 725], [8, 1535, 693], [10, 1549, 660], [11, 1569, 603], [12, 1590, 525], [13, 1606, 411], [15, 1597, 254], [16, 1530, 50]]), side: K.key([[0, 90], [10, 100], [16, 104]]), rot: () => 0, warm: 0.8 },
    { id: "S4", at: path([[9, 1120, 1170], [11, 1231, 1058], [12, 1319, 1046], [13, 1435, 1010], [15, 1578, 903], [16, 1730, 706]]), side: K.key([[11, 96], [16, 106]]), rot: () => 0, warm: 0.8 },
  ];
  const byId = Object.fromEntries(TILES.map((t) => [t.id, t]));

  // "Nova" sits fixed while the field turns: centre x, baseline, size
  const TX = K.key([[0, 953], [2, 955], [5, 955], [8, 950], [13, 912], [15, 875]]);
  const TB = K.key([[0, 600], [2, 620], [5, 625], [13, 625], [15, 604]]);
  const TS = K.key([[0, 191], [1, 222], [2, 240], [5, 259], [8, 250], [13, 228], [15, 203]]);

  // dashed links between tiles (and the word), with bend
  const LINKS = [["T", "S1", 0.22], ["S1", "S2", -0.3], ["S2", "W", 0.22], ["S3", "W", -0.22], ["B", "S3", 0.28], ["T", "W", -0.18], ["N", "S2", 0.3], ["S4", "W", 0.3]];

  // colour drift: blue -> violet -> pink -> orange as the scene hands over to the headline
  const warmK = K.key([[13, 0], [14, 0], [15, 0.42], [16, 0.72]]);
  function tileColor(f, w) {
    const k = K.clamp(warmK(f) * (0.6 + 0.4 * w) / 0.8 * (w >= 1 ? 1.15 : 1), 0, 1);
    if (k < 0.5) return K.mix(BLUE, VIOLET, k / 0.5);
    if (k < 0.85) return K.mix(VIOLET, PINK, (k - 0.5) / 0.35);
    return K.mix(PINK, ORANGE, (k - 0.85) / 0.15);
  }

  function bracket(ctx, x, y, s, color, lw) {
    // square frame drawn as four corner brackets with gaps at the side centres
    const h = s / 2, arm = s * 0.42;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw || 1.4;
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.moveTo(x + sx * h, y + sy * (h - arm)); ctx.lineTo(x + sx * h, y + sy * h); ctx.lineTo(x + sx * (h - arm), y + sy * h);
    }
    ctx.stroke();
    ctx.restore();
  }
  function plus(ctx, x, y, s, color) {
    ctx.save(); ctx.fillStyle = color;
    const t = Math.max(2, s * 0.16);
    ctx.fillRect(x - s / 2, y - t / 2, s, t); ctx.fillRect(x - t / 2, y - s / 2, t, s);
    ctx.restore();
  }

  K.SCENES = K.SCENES || {};
  K.SCENES.open = function (ctx, f, cv, t) {
    if (t == null) t = f;
    const word = K.BRAND.lead;
    const flash = f === 0 ? 1 : 0;
    // ground: a beige flash on the first frame, then near-white, cooling to taupe at the end
    const bg = f === 0 ? "#D9CFC6" : f <= 14 ? "#F8F8F8" : f === 15 ? "#D6C6BC" : "#A8907E";
    K.fill(ctx, bg);
    const fade = f >= 16 ? 0.35 : f === 15 ? 0.75 : 1; // how much of the cool field remains
    K.grid(ctx, { cell: 226, ox: 113, oy: 60, color: f >= 15 ? "#B8A89C" : "#D2D3E0", alpha: 0.55, width: 1.3 });

    // positions this frame
    const P = {};
    TILES.forEach((o) => { P[o.id] = o.at(t); });
    const ts = TS(t), tw = K.measure(ctx, word, ts, 600, -0.03), tx = TX(t) - tw / 2, tb = TB(t);
    P.W = [TX(t), tb - ts * 0.36];

    // blue haze: around the word and the big tiles
    const haze = (f >= 15 ? 0.5 : 1) * (flash ? 0.55 : 1);
    K.ember(ctx, P.W[0], P.W[1], 700, "#9CC0FF", 0.5 * haze);
    K.ember(ctx, P.W[0], P.W[1], 380, "#A8D0FF", 0.45 * haze);
    TILES.forEach((o) => { const [x, y] = P[o.id], s = o.side(t); K.ember(ctx, x, y, s * (o.big ? 1.15 : 1.0), K.mix("#6070FF", "#B060C0", warmK(t)), 0.5 * haze); });

    // dashed links
    if (f <= 15) {
      LINKS.forEach(([a, b, c]) => {
        const A = P[a], B = P[b];
        if (!A || !B) return;
        K.dashed(ctx, A[0], A[1], B[0], B[1], { color: `rgba(96,96,128,${0.7 * fade})`, curve: c, width: 1.5, dash: [5, 5] });
      });
    }

    // tiles: bracket frame (axis aligned), filled square, "+"
    TILES.forEach((o) => {
      const [x, y] = P[o.id], s = o.side(t), r = (o.rot(t) * Math.PI) / 180;
      const col = tileColor(t, o.warm);
      const bb = s * (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)));
      if (f <= 16 && (f <= 15 || o.big)) bracket(ctx, x, y, o.big ? bb * 1.04 : s * 1.18, "rgba(70,72,112,0.7)", 1.4);
      K.glow(ctx, (g) => K.tile(g, x, y, s, { fill: col, rot: r, radius: 0.06 }), { blur: o.big ? 26 : 12, alpha: 0.55, passes: 2, mode: "source-over", sharpAlpha: f >= 16 ? 0.85 : 1 });
      if (f <= 15 || o.big) plus(ctx, x, y, o.big ? 22 : 20, "rgba(255,255,255,0.95)");
    });

    // the word: pale blue fill, blue outline, letter boxes with "+" marks
    if (f <= 15) {
      const a = f === 15 ? 0.72 : 1;
      const fill = flash ? "#6A6EC0" : f === 15 ? "#7880D8" : "#4858E8";
      K.glow(ctx, (g) => K.text(g, word, tx, tb, { size: ts, weight: 600, color: K.rgba(fill, a), ls: -0.03, stroke: K.rgba(flash ? "#9A9CD8" : "#8FA6FF", 0.8 * a), lw: 1.6 }), { blur: 18, alpha: 0.35, mode: "source-over" });
      ctx.save();
      ctx.strokeStyle = K.rgba("#5868D8", 0.55 * a); ctx.lineWidth = 1.3;
      let cx = tx;
      for (let i = 0; i < word.length; i++) {
        const cw = K.measure(ctx, word.slice(0, i + 1), ts, 600, -0.03) - K.measure(ctx, word.slice(0, i), ts, 600, -0.03);
        const top = i === 0 ? tb - ts * 0.74 : tb - ts * 0.55;
        ctx.strokeRect(cx, top, cw, tb - top + ts * 0.04);
        if (f <= 14 || i === 1) plus(ctx, cx + cw * 0.5, tb - ts * (i === 0 ? 0.36 : 0.27), ts * 0.085, "rgba(255,255,255,0.95)");
        cx += cw;
      }
      ctx.restore();
    }

    // the second word of the headline falls in from lower right
    if (f >= 13) {
      const w2 = K.BRAND.line[1];
      const X = K.key([[13, 1260], [15, 1190], [16, 1040]])(Math.max(13, t)), Y = K.key([[13, 885], [15, 712], [16, 600]])(Math.max(13, t)), S = K.key([[13, 205], [15, 172], [16, 122]])(Math.max(13, t));
      const ww = K.measure(ctx, w2, S, 500, -0.03);
      K.glow(ctx, (g) => K.text(g, w2, X - ww / 2, Y, { size: S, weight: 500, color: f >= 16 ? "rgba(150,120,100,0.45)" : "#5A3420", ls: -0.03 }), { blur: f >= 16 ? 10 : 22, alpha: 0.8, mode: "source-over", sharpBlur: f >= 16 ? 3 : 1.2 });
    }

    if (flash) K.fill(ctx, "rgba(216,206,196,0.18)");
    K.defocus(cv, f >= 16 ? 3 : f === 15 ? 1.4 : 0.6);
    K.grain(ctx, f, 0.05);
  };
  // motion blur span (frames): the field moves fastest on the push-in and the hand-over
  K.SCENES.open.shutter = (f) => (f >= 15 ? 0.45 : 0);
})();
