// Shared helpers for the benchlane promo compositions.
// Everything here is deterministic (seeded) so any frame can be seeked and rendered in isolation.
(function () {
  const FX = {};

  FX.C = {
    cream: "#FDF6EF",
    ink: "#16110D",
    orange: "#EA5E39",
    dark: "#0D0B07",
    purple: "#8B6CF2",
    lav: "#B9A4F7",
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

  // ------------------------------------------------------------------ words
  // A "slot" is an inline-grid whose single column tweens 0fr -> 1fr, so a centred line
  // re-centres smoothly as each word opens up, without measuring any text.
  FX.line = function (el, words) {
    el.innerHTML = words
      .map((w, i) => {
        const cls = typeof w === "string" ? "" : w.cls || "";
        const txt = typeof w === "string" ? w : w.t;
        const last = i === words.length - 1;
        return `<span class="slot" data-i="${i}"><span class="w ${cls}${last ? " last" : ""}">${txt}</span></span>`;
      })
      .join("");
    return Array.from(el.querySelectorAll(".slot"));
  };

  // Word drop-in: slot opens, word appears in accent colour offset below the line,
  // lifts into place, then settles to the line colour.
  FX.wordIn = function (tl, slot, t, o) {
    o = Object.assign({ dy: 0.32, open: 0.18, lead: 0.06, lift: 0.16, settle: 0.1, hold: 0.06, from: FX.C.orange, to: FX.C.ink, dx: 0 }, o || {});
    const w = slot.firstElementChild;
    tl.set(slot, { gridTemplateColumns: "0fr" }, 0);
    tl.set(w, { opacity: 0, color: o.from, y: o.dy + "em", x: o.dx + "em" }, 0);
    tl.to(slot, { gridTemplateColumns: "1fr", duration: o.open, ease: "power2.inOut" }, Math.max(0, t - o.lead));
    tl.set(w, { opacity: 1 }, t);
    tl.to(w, { y: 0, x: 0, duration: o.lift, ease: "power3.out" }, t);
    if (o.to) tl.to(w, { color: o.to, duration: o.settle, ease: "none" }, t + o.hold);
  };

  // Word drop-out: turns accent colour, then the slot collapses.
  FX.wordOut = function (tl, slot, t, o) {
    o = Object.assign({ flash: 0.06, close: 0.16, color: FX.C.orange }, o || {});
    const w = slot.firstElementChild;
    tl.set(w, { color: o.color }, t);
    tl.set(w, { opacity: 0 }, t + o.flash);
    tl.to(slot, { gridTemplateColumns: "0fr", duration: o.close, ease: "power2.inOut" }, t + o.flash * 0.5);
  };

  // ----------------------------------------------------------------- curves
  // Motion measured off the reference, frame by frame. pts: [[frame30, value], ...] (reference frame
  // numbers at 30 fps). Interpolated with monotone cubic (no overshoot) and written out as one set per
  // output frame, so the curve is reproduced exactly whatever the render fps.
  FX.FPS = 24;
  FX.mono = function (pts0) {
    // reference frames that show the same 24 fps source frame collapse to one key
    const pts = pts0.filter((p, i) => i === 0 || FX.f(p[0]) > FX.f(pts0[i - 1][0]));
    const n = pts.length, xs = pts.map((p) => FX.f(p[0])), ys = pts.map((p) => p[1]);
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1e-6));
    for (let i = 0; i < n; i++) {
      if (i === 0) m.push(d[0] || 0);
      else if (i === n - 1) m.push(d[n - 2] || 0);
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
  // props: { prop: pts | [pts, fn(v) -> value] }; written from the first to the last key time.
  // o.base: reference frame where this composition starts (its local time 0).
  FX.curve = function (tl, el, props, o) {
    o = o || {};
    const fps = o.fps || FX.FPS;
    const off = o.base ? FX.f(o.base) : 0;
    Object.keys(props).forEach((k) => {
      const spec = props[k];
      const pts = Array.isArray(spec[0][0]) || typeof spec[1] === "function" ? spec[0] : spec;
      const fn = typeof spec[1] === "function" ? spec[1] : (v) => v;
      const f = FX.mono(pts);
      const a = FX.f(pts[0][0]) - off, b = FX.f(pts[pts.length - 1][0]) - off;
      const k0 = Math.max(0, Math.ceil(a * fps - 1e-6)), k1 = Math.floor(b * fps + 1e-6);
      tl.set(el, { [k]: fn(f(Math.max(a, 0) + off)) }, 0);
      for (let q = k0; q <= k1; q++) tl.set(el, { [k]: fn(f(q / fps + off)) }, q / fps);
      if (b >= 0) tl.set(el, { [k]: fn(f(b + off)) }, b);
    });
  };
  // local time (s) of reference frame n in a composition that starts at reference frame base
  FX.at = (n, base) => FX.f(n) - FX.f(base || 0);

  // Decode-style reveal: the word's letters pop in, in random order, over `frames` reference frames
  // (accent colour), then the whole word settles to `ink` at reference frame `inkAt`.
  FX.decode = function (tl, el, o) {
    const txt = el.textContent;
    el.innerHTML = txt.split("").map((c) => `<span class="dc">${c === " " ? "&nbsp;" : c}</span>`).join("");
    const r = FX.rng(o.seed || 7);
    const L = Array.from(el.children);
    tl.set(L, { opacity: 0 }, 0);
    tl.set(el, { color: o.accent || FX.C.orange }, 0);
    L.forEach((c) => tl.set(c, { opacity: 1 }, FX.at(o.at + Math.floor(r() * o.frames), o.base)));
    tl.set(L, { opacity: 1 }, FX.at(o.at + o.frames, o.base));
    if (o.ink) tl.set(el, { color: o.inkColor || FX.C.ink }, FX.at(o.inkAt, o.base));
    return L;
  };
  // Reverse: letters drop out in random order over `frames`.
  FX.undecode = function (tl, L, o) {
    const r = FX.rng(o.seed || 9);
    L.forEach((c) => tl.set(c, { opacity: 0 }, FX.at(o.at + Math.floor(r() * o.frames), o.base)));
    tl.set(L, { opacity: 0 }, FX.at(o.at + o.frames, o.base));
  };
  // reference frame number -> seconds. The reference is 24 fps footage in a 30 fps file: its frame n
  // shows source frame floor(n * 0.8), so events are placed on that 24 fps frame.
  FX.f = (n) => Math.floor(n * 0.8 + 1e-6) / 24;

  // --------------------------------------------------------------- blinkers
  // Small orange squares that pop on/off around the type. spec: [x, y, w, h, [[on, off], ...]]
  FX.squares = function (host, tl, spec, color) {
    spec.forEach(([x, y, w, h, spans]) => {
      const d = document.createElement("div");
      d.className = "sq";
      Object.assign(d.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px", background: color || FX.C.orange });
      host.appendChild(d);
      tl.set(d, { opacity: 0 }, 0);
      spans.forEach(([a, b]) => {
        tl.set(d, { opacity: 1 }, a);
        if (b != null) tl.set(d, { opacity: 0 }, b);
      });
    });
  };

  // Deterministic random blinking squares inside a box.
  FX.randomSquares = function (host, tl, o) {
    const r = FX.rng(o.seed || 1);
    const out = [];
    for (let i = 0; i < o.count; i++) {
      const x = o.x0 + r() * (o.x1 - o.x0);
      const y = o.y0 + r() * (o.y1 - o.y0);
      const s = o.size;
      const shape = r();
      const w = shape < 0.2 ? s * 2 : s;
      const h = shape > 0.85 ? s * 2 : s;
      const spans = [];
      let t = o.t0 + r() * o.stagger;
      while (t < o.t1) {
        const on = o.minOn + r() * (o.maxOn - o.minOn);
        spans.push([t, Math.min(t + on, o.t1)]);
        t += on + o.minOff + r() * (o.maxOff - o.minOff);
      }
      out.push([Math.round(x), Math.round(y), w, h, spans]);
    }
    FX.squares(host, tl, out, o.color);
  };

  // ----------------------------------------------------------------- canvas
  FX.canvas = function (w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };

  // Blocky mosaic: fn(cx, cy, rand) returns rgba string or null per cell.
  FX.mosaic = function (w, h, cell, seed, fn) {
    const c = FX.canvas(w, h);
    const g = c.getContext("2d");
    const r = FX.rng(seed);
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const col = fn(x + cell / 2, y + cell / 2, r);
        if (col) {
          g.fillStyle = col;
          g.fillRect(x, y, cell, cell);
        }
      }
    }
    return c;
  };

  // A rectangular "frame" of pixel squares (used for the pixel-ring transitions).
  // Returns an SVG string sized w x h whose squares fill the band between inner box and outer edge.
  FX.pixelRing = function (w, h, cell, gap, band, color, seed, holes) {
    const r = FX.rng(seed || 3);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    const cols = Math.floor(w / cell);
    const rows = Math.floor(h / cell);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const inBand = i < band || j < band || i >= cols - band || j >= rows - band;
        if (!inBand) continue;
        if (holes && r() < holes) continue;
        s += `<rect x="${i * cell + gap / 2}" y="${j * cell + gap / 2}" width="${cell - gap}" height="${cell - gap}" fill="${color}"/>`;
      }
    }
    return s + "</svg>";
  };

  // ------------------------------------------------------------------ art
  // Original pixel mascot ("Volt"): a TV-screen robot head with an antenna.
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

  // benchlane mark: two L corners around a centre block.
  FX.mark = function (color, cls) {
    return `<svg class="${cls || ""}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="${color}">
      <path class="mk-a" d="M0 0h62v26H26v36H0z"/><path class="mk-b" d="M100 100H38V74h36V38h26z"/><rect class="mk-c" x="35" y="35" width="30" height="30"/></g></svg>`;
  };

  FX.cursor = function (fill, stroke) {
    return `<svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l19 10.5-8.2 2.1L9 23z" fill="${fill}" stroke="${stroke || fill}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  };

  FX.plane = function (color, w) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${color}" stroke-width="${w || 1.8}" stroke-linejoin="round" stroke-linecap="round"><path d="M21.5 2.5L10.5 13.5"/><path d="M21.5 2.5l-7 19-4-8-8-4z"/></svg>`;
  };

  // App-tile icons for the "alongside AI" field (all original glyphs).
  FX.icons = {
    ripple: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="9" fill="#EA5E39"/><circle cx="50" cy="50" r="22" fill="none" stroke="#EA5E39" stroke-width="6"/><circle cx="50" cy="50" r="36" fill="none" stroke="#EA5E39" stroke-width="5" stroke-dasharray="14 9"/></svg>`,
    atom: `<svg viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="5"><ellipse cx="50" cy="50" rx="40" ry="15"/><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(120 50 50)"/><circle cx="50" cy="50" r="6" fill="#fff" stroke="none"/></svg>`,
    wave: `<svg viewBox="0 0 100 100"><defs><linearGradient id="fxw" x1="0" x2="1"><stop offset="0" stop-color="#2F7BFF"/><stop offset="1" stop-color="#18B4FF"/></linearGradient></defs><path d="M10 58c10-26 20-26 27 0s17 26 26 0 18-26 27 0" fill="none" stroke="url(#fxw)" stroke-width="10" stroke-linecap="round"/></svg>`,
    chevrons: `<svg viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M34 30L14 50l20 20M66 30l20 20-20 20M57 22L43 78"/></svg>`,
    devkit: `<svg viewBox="0 0 100 100"><text x="50" y="57" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="17" font-weight="700" fill="#fff">devkit</text></svg>`,
    bot: null, // filled below with the mascot head
    cube: `<svg viewBox="0 0 100 100"><path d="M50 14l34 19v38L50 90 16 71V33z" fill="#3a3a3c"/><path d="M50 14l34 19-34 19-34-19z" fill="#9b9ba0"/><path d="M50 52l34-19v38L50 90z" fill="#5d5d61"/></svg>`,
    dots: `<svg viewBox="0 0 100 100"><defs><linearGradient id="fxd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1FD1A5"/><stop offset="1" stop-color="#3B6BFF"/></linearGradient></defs><g fill="url(#fxd)"><circle cx="28" cy="28" r="10"/><circle cx="50" cy="28" r="10"/><circle cx="72" cy="28" r="10"/><circle cx="28" cy="50" r="10"/><circle cx="50" cy="50" r="10"/><circle cx="72" cy="50" r="10"/><circle cx="28" cy="72" r="10"/><circle cx="50" cy="72" r="10"/><circle cx="72" cy="72" r="10"/></g></svg>`,
    prism: `<svg viewBox="0 0 100 100"><defs><linearGradient id="fxp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5FA2"/><stop offset=".5" stop-color="#FFC547"/><stop offset="1" stop-color="#36C6FF"/></linearGradient></defs><path d="M50 12l38 70H12z" fill="url(#fxp)"/><path d="M50 12L50 82" stroke="#fff" stroke-opacity=".5" stroke-width="3"/></svg>`,
    bolt: `<svg viewBox="0 0 100 100"><path d="M57 8L22 56h24l-6 36 38-50H53z" fill="#fff"/></svg>`,
  };
  FX.icons.bot = `<div style="width:100%;height:100%;padding:20%">${FX.mascot("#fff")}</div>`;

  window.FX = FX;
})();
