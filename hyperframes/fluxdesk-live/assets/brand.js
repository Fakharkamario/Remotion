// Fluxdesk mark + wordmark.
// The mark is the three-block stair: two blocks along the bottom, one on top at the right.
(function () {
  const K = window.K;
  K.BRAND = { word: "Fluxdesk", domain: "fluxdesk.trade", lead: "Nova", line: ["Nova", "now", "trades", "on", "Fluxdesk."] };
  // block centres in mark units (block = 1)
  K.MARK = [[1, 0], [0, 1], [1, 1]];
  K.markCell = (b) => b * 1.1; // block plus gap
  // draw the mark centred at (x, y); b = block size
  K.mark = function (g, x, y, b, color, o) {
    o = o || {};
    const cell = K.markCell(b);
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    g.fillStyle = color;
    K.MARK.forEach(([i, j], k) => {
      if (o.hide && o.hide[k]) return;
      const d = o.offs && o.offs[k] ? o.offs[k] : [0, 0];
      const cx = (i - 0.5) * cell + d[0], cy = (j - 0.5) * cell + d[1];
      g.fillRect(cx - b / 2, cy - b / 2, b, b);
    });
    g.restore();
  };
  // Lockup geometry: the mark is as tall as the cap height and sits on the baseline.
  K.LOCK = { size: 249, weight: 600, ls: -0.03, base: 638 };
  K.lockupLayout = function (g, text, cx, size) {
    size = size || K.LOCK.size;
    const cap = size * 0.77;
    const b = cap / 2.1, markW = K.markCell(b) + b, gap = cap * 0.36;
    const tw = K.measure(g, text, size, K.LOCK.weight, K.LOCK.ls);
    const total = markW + gap + tw;
    const x0 = cx - total / 2;
    return { x0, b, markW, cap, tx: x0 + markW + gap, tw, size };
  };
})();
