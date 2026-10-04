// Shared helpers for the benchlane hire clip.
// Everything is deterministic (per-frame sets and fixed tweens) so any frame can be seeked and rendered in isolation.
(function () {
  const FX = {};

  FX.C = {
    cream: "#FDF6EF",
    ink: "#16110D",
    text: "#C9684C", // accent for words as they land
    stroke: "#C26B4C", // pill outline before it inks
    mark: "#E86135",
  };

  // Clip frame (0-based, 30 fps) -> seconds inside a sub-composition that starts at frame `cut`.
  // Sets land 0.4 frame early so a seek to exactly n/30 always sees them.
  FX.at = function (n, cut) {
    return Math.max(0, (n - (cut || 0) - 0.4) / 30);
  };

  // A set at time 0 never renders while the playhead sits on 0, so initial states go straight to gsap.set.
  FX.put = function (tl, el, vars, t) {
    if (t <= 0) gsap.set(el, vars);
    else tl.set(el, vars, t);
  };

  // Smooth curve through measured keys [[frame, v1, v2, ...], ...]: monotone cubic per column, so it passes
  // through every key without overshooting between them. Returns f(frame) -> [v1, v2, ...] (held at the ends).
  FX.curve = function (rows) {
    rows = rows.slice().sort((a, b) => a[0] - b[0]);
    const xs = rows.map((r) => r[0]);
    const cols = rows[0].length - 1;
    const tangents = [];
    for (let c = 0; c < cols; c++) {
      const ys = rows.map((r) => r[c + 1]);
      const n = xs.length;
      const d = [], m = new Array(n).fill(0);
      for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
      if (n > 1) { m[0] = d[0]; m[n - 1] = d[n - 2]; }
      for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
        const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
        if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
      }
      tangents.push({ ys, m });
    }
    return function (f) {
      if (f <= xs[0]) return rows[0].slice(1);
      if (f >= xs[xs.length - 1]) return rows[rows.length - 1].slice(1);
      let i = 0;
      while (xs[i + 1] < f) i++;
      const h = xs[i + 1] - xs[i], t = (f - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return tangents.map(({ ys, m }) =>
        (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]);
    };
  };

  // Mix two #rrggbb colours.
  FX.mix = function (a, b, t) {
    const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };

  // Colour keys [[frame, "#rrggbb"], ...] -> f(frame) blending between them.
  FX.colors = function (rows) {
    return function (f) {
      if (f <= rows[0][0]) return rows[0][1];
      for (let i = 1; i < rows.length; i++) {
        if (f <= rows[i][0]) {
          const [a, ca] = rows[i - 1], [b, cb] = rows[i];
          return FX.mix(ca, cb, (f - a) / (b - a));
        }
      }
      return rows[rows.length - 1][1];
    };
  };

  // Words of a line, each in its own inline-block so it can be shown, tinted and moved alone.
  FX.words = function (el, words) {
    el.innerHTML = words
      .map((w) => {
        const cls = typeof w === "string" ? "" : w.cls || "";
        const txt = typeof w === "string" ? w : w.t;
        return `<span class="w ${cls}">${txt}</span>`;
      })
      .join('<span class="sp"> </span>');
    return Array.from(el.querySelectorAll(".w"));
  };

  // A word lands at frame `on`: fades up over two frames while it settles a few px, in `from` colour;
  // from frame `ink` it blends to `to` over three frames. `cut` is the composition's first frame.
  FX.land = function (tl, el, on, ink, cut, o) {
    o = Object.assign({ from: FX.C.text, to: FX.C.ink, rise: 0.07 }, o || {});
    FX.put(tl, el, { opacity: 0, y: o.rise + "em", color: o.from }, 0);
    tl.to(el, { opacity: 1, duration: 2 / 30, ease: "none" }, FX.at(on, cut));
    tl.to(el, { y: 0, duration: 6 / 30, ease: "power3.out" }, FX.at(on, cut));
    if (ink != null) tl.to(el, { color: o.to, duration: 3 / 30, ease: "power1.inOut" }, FX.at(ink, cut));
  };

  // benchlane mark: two L corners around a centre block.
  FX.mark = function (color) {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><g fill="${color}">
      <path class="mk-a" d="M0 0h62v26H26v36H0z"/><path class="mk-b" d="M100 100H38V74h36V38h26z"/><rect class="mk-c" x="35" y="35" width="30" height="30"/></g></svg>`;
  };

  window.FX = FX;
})();
