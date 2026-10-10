// Fluxdesk mark + wordmark, shared by the logo and outro scenes.
// The mark is an original three-block stair: two blocks along the bottom, one on top at the right.
(function () {
  const K = window.K;
  K.BRAND = { red: "#FF5222", word: "Fluxdesk", domain: "fluxdesk.trade" };
  // block centres in mark units (block = 1)
  K.MARK = [[1, 0], [0, 1], [1, 1]];
  // draw the mark centred at (x, y); b = block size; gap between blocks
  K.mark = function (g, x, y, b, color, o) {
    o = o || {};
    const gap = b * 0.1;
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    g.fillStyle = color;
    K.MARK.forEach(([i, j], k) => {
      if (o.only != null && o.only !== k) return;
      const dx = (o.offs && o.offs[k] ? o.offs[k][0] : 0), dy = (o.offs && o.offs[k] ? o.offs[k][1] : 0);
      const cx = (i - 0.5) * (b + gap) + dx, cy = (j - 0.5) * (b + gap) + dy;
      g.fillRect(cx - b / 2, cy - b / 2, b, b);
    });
    g.restore();
  };
  // Wordmark lockup: mark + word. Returns layout so callers can place a typing cursor.
  K.lockup = function (g, cx, cy, size, color, o) {
    o = o || {};
    const word = o.text == null ? K.BRAND.word : o.text;
    const full = K.measure(g, K.BRAND.word, size, 600, -0.045);
    const vis = K.measure(g, word, size, 600, -0.045);
    const b = size * 0.32, markW = b * 2.1, gap = size * 0.3;
    // centre on what is visible (the lockup re-centres while typing)
    const total = markW + gap + (o.centerOnFull ? full : vis);
    const x0 = cx - total / 2;
    if (o.mark !== false) K.mark(g, x0 + markW / 2, cy - size * 0.36, b, color, o.markOpts);
    const tx = x0 + markW + gap;
    K.text(g, word, tx, cy, { size, weight: 600, color, ls: -0.045 });
    return { x0, tx, end: tx + vis, b, markW };
  };
})();
