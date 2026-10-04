// Shared helpers for the benchlane replay clip.
// Everything is deterministic (seeded, per-frame sets) so any frame can be seeked and rendered in isolation.
(function () {
  const FX = {};

  FX.C = {
    cream: "#FDF6EF",
    ink: "#16110D",
    orange: "#EA5E39",
    text: "#E4623D",
    tan: "#CD745E",
    dark: "#0D0B07",
  };

  // Reference frame -> seconds inside a sub-composition that starts at reference frame `cut`.
  // Sets land 0.4 frame early so a seek to exactly n/30 always sees them.
  FX.at = function (n, cut) {
    return Math.max(0, (n - (cut || 0) - 0.4) / 30);
  };

  // A set at time 0 never renders while the playhead sits on 0, so initial states go straight to gsap.set.
  FX.put = function (tl, el, vars, t) {
    if (t <= 0) gsap.set(el, vars);
    else tl.set(el, vars, t);
  };

  // One set per measured frame. rows: [[frame, ...values]], map(values, frame) -> vars.
  FX.track = function (tl, el, rows, cut, map) {
    rows.forEach((r) => FX.put(tl, el, map(r.slice(1), r[0]), FX.at(r[0], cut)));
  };

  // Linear lookup in [[frame, value], ...] (held at the ends).
  FX.lerp = function (rows, f) {
    if (f <= rows[0][0]) return rows[0][1];
    for (let i = 1; i < rows.length; i++) {
      if (f <= rows[i][0]) {
        const [a, va] = rows[i - 1], [b, vb] = rows[i];
        return va + ((vb - va) * (f - a)) / (b - a);
      }
    }
    return rows[rows.length - 1][1];
  };

  // mulberry32
  FX.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  FX.canvas = function (w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };

  // Centred line of word "slots": each word sits in an inline-grid whose column opens 0fr -> 1fr,
  // so the visible part of the line stays centred as words arrive.
  FX.line = function (el, words) {
    el.innerHTML = words
      .map((w, i) => {
        const cls = typeof w === "string" ? "" : w.cls || "";
        const txt = typeof w === "string" ? w : w.t;
        const last = i === words.length - 1;
        return `<span class="slot"><span class="w ${cls}${last ? " last" : ""}">${txt}</span></span>`;
      })
      .join("");
    return Array.from(el.querySelectorAll(".slot"));
  };

  // Painted-looking landscape: sky gradient, soft cloud streaks, layered ridges, blocky brush grain.
  FX.land = function (seed, w, h, sky, ridges) {
    const c = FX.canvas(w, h);
    const g = c.getContext("2d");
    const r = FX.rng(seed);
    const gr = g.createLinearGradient(0, 0, 0, h);
    sky.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) {
      g.fillStyle = `rgba(255,${200 + Math.floor(r() * 40)},${190 + Math.floor(r() * 40)},${(0.08 + r() * 0.12).toFixed(2)})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h * 0.4, 40 + r() * 90, 8 + r() * 14, 0, 0, Math.PI * 2);
      g.fill();
    }
    ridges.forEach(([y0, amp, col], j) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) g.lineTo(x, y0 * h + Math.sin(x * 0.012 + j * 2 + seed) * amp + Math.sin(x * 0.041 + j) * amp * 0.35);
      g.lineTo(w, h);
      g.fill();
    });
    for (let k = 0; k < 2200; k++) {
      const y = h * 0.45 + r() * h * 0.55;
      g.fillStyle = `rgba(${90 + Math.floor(r() * 120)},${50 + Math.floor(r() * 60)},${30 + Math.floor(r() * 40)},${(0.12 + r() * 0.25).toFixed(2)})`;
      g.fillRect(r() * w, y, 2 + r() * 5, 1 + r() * 3);
    }
    return c;
  };

  // Pixel mascot ("Volt"): a TV-screen robot head with an antenna.
  FX.mascot = function (color) {
    const rows = [
      "......##......",
      "......##......",
      ".......#......",
      "..##########..",
      ".############.",
      ".##........##.",
      ".##.##..##.##.",
      ".##........##.",
      ".##..####..##.",
      ".##........##.",
      ".############.",
      "..##########..",
    ];
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 12" shape-rendering="crispEdges">`;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === "#") s += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${color}"/>`;
    });
    return s + "</svg>";
  };

  FX.plane = function (color, w) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${color}" stroke-width="${w || 1.8}" stroke-linejoin="round" stroke-linecap="round"><path d="M21.5 2.5L10.5 13.5"/><path d="M21.5 2.5l-7 19-4-8-8-4z"/></svg>`;
  };

  window.FX = FX;
})();
