// remy — 30.9 s promo, 30 fps, 928 frames, 1920x1080, over the reference soundtrack (assets/audio.m4a).
// Every move is keyed to the reference edit's measured motion. Camera keys are written in reference-frame
// pixels (the reference is 854x480, so K = 2.25 maps them to 1920x1080), on reference frame numbers.
// Each camera pins one anchor (an element in the world) to a keyed screen point at a keyed scale.
//   0–200    S1  "Sync Notes" chip outline draws → event card → recap streams in → pull back to the phone, replies
//   200–297  S2  whip to the chat header: venue suggestion streams in, "u down?!?", "HAHA - ye book it."
//   297–349  S3  close-up on the reply, LFG pops
//   349–399  S4  map link bubble lands, the search types
//   399–459  S5  map zooms in on the pin
//   459–501  S6  booking page drifts up
//   501–720  S7  "dis good wine?" + photo, pull back to the phone, wine notes; cut close, pick-up line, whip-pan
//   717–744  S7  zoom out to white
//   739–846  S8  clouds: morning chat
//   846–909  S9  "Text Remy today", URL pill types
//   909–928  S10 logo
(function () {
  const FPS = 30, FRAMES = 928, W = 1920, H = 1080, K = 2.25;
  const SUB = 0; // sub-frame offset for an interleaved motion-blur pass
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eo5 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); t = clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  // monotone cubic through [frame, value] keys
  const slope = (p, i) => (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
  const tangent = (p, k) => {
    const n = p.length;
    if (n < 2) return 0;
    if (k === 0) return slope(p, 0);
    if (k === n - 1) return slope(p, n - 2);
    const d0 = slope(p, k - 1), d1 = slope(p, k);
    if (d0 * d1 <= 0) return 0;
    const h0 = p[k][0] - p[k - 1][0], h1 = p[k + 1][0] - p[k][0];
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const keys = (f, p) => {
    if (f <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (f <= p[i][0]) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], h = x1 - x0, t = (f - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * tangent(p, i - 1) + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * tangent(p, i);
    }
    return p[p.length - 1][1];
  };
  const lin = (f, p) => {
    if (f <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (f <= p[i][0]) return lerp(p[i - 1][1], p[i][1], (f - p[i - 1][0]) / (p[i][0] - p[i - 1][0]));
    return p[p.length - 1][1];
  };
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const set = (el, prop, v) => { if (el["_" + prop] !== v) { el["_" + prop] = v; el.style[prop] = v; } };
  const setHTML = (el, h) => { if (el._html !== h) { el._html = h; el.innerHTML = h; } };
  const div = (cls, html = "") => { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; return d; };
  // camera: world point P sits at screen point (sx, sy) [reference px] at scale S
  const cam = (P, sx, sy, S) => ({ S, tx: sx * K - P.x * S, ty: sy * K - P.y * S });
  const blend = (a, b, t) => ({ S: lerp(a.S, b.S, t), tx: lerp(a.tx, b.tx, t), ty: lerp(a.ty, b.ty, t) });
  const applyCam = (el, c, extra = "") => set(el, "transform", `translate(${c.tx.toFixed(2)}px,${c.ty.toFixed(2)}px) scale(${c.S.toFixed(5)})${extra}`);

  // ---------- icons ----------
  const SPARK = (fill) => `<svg viewBox="0 0 100 100"><path d="M50 8 C53.5 36 64 46.5 92 50 C64 53.5 53.5 64 50 92 C46.5 64 36 53.5 8 50 C36 46.5 46.5 36 50 8Z" fill="${fill}"/><path d="M79 12 C80 20 82 22 90 23 C82 24 80 26 79 34 C78 26 76 24 68 23 C76 22 78 20 79 12Z" fill="${fill}" opacity=".85"/></svg>`;
  const WAVE = '<svg viewBox="0 0 24 24"><g stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3"/></g></svg>';
  const SKULL = '<svg viewBox="0 0 24 24" style="display:inline-block;width:.95em;height:.95em;vertical-align:-0.12em"><path d="M12 2.5c-5 0-8.5 3.4-8.5 8 0 2.8 1.3 4.7 3.2 5.8V19a1.5 1.5 0 001.5 1.5h7.6a1.5 1.5 0 001.5-1.5v-2.7c1.9-1.1 3.2-3 3.2-5.8 0-4.6-3.5-8-8.5-8z" fill="#ececf0" stroke="#55555c" stroke-width="1.2"/><ellipse cx="8.6" cy="11.4" rx="2.2" ry="2.4" fill="#2a2a30"/><ellipse cx="15.4" cy="11.4" rx="2.2" ry="2.4" fill="#2a2a30"/><path d="M11.2 15.3l.8-1.6.8 1.6z" fill="#2a2a30"/><path d="M9.5 18.2v2M12 18.2v2M14.5 18.2v2" stroke="#55555c" stroke-width="1"/></svg>';
  const HAHA = '<svg viewBox="0 0 120 124" width="120" height="124"><circle cx="20" cy="108" r="9" fill="#2f8bff" stroke="#fff" stroke-width="4"/><circle cx="8" cy="120" r="4.5" fill="#2f8bff"/><circle cx="62" cy="56" r="50" fill="#2f8bff" stroke="#fff" stroke-width="6"/><text x="62" y="52" text-anchor="middle" font-family="Inter" font-weight="800" font-size="31" fill="#fff" letter-spacing="-1">HA</text><text x="62" y="82" text-anchor="middle" font-family="Inter" font-weight="800" font-size="31" fill="#fff" letter-spacing="-1">HA</text></svg>';
  const BANG = '<svg viewBox="0 0 110 110" width="110" height="110"><circle cx="55" cy="55" r="48" fill="#2f8bff" stroke="#fff" stroke-width="6"/><text x="55" y="74" text-anchor="middle" font-family="Inter" font-weight="900" font-size="52" fill="#fff" letter-spacing="-4">!!</text></svg>';
  const HEART = '<svg viewBox="0 0 160 160" width="160" height="160"><defs><filter id="hs" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity=".12"/></filter><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fc8"/><stop offset="1" stop-color="#f0429a"/></linearGradient></defs><g filter="url(#hs)"><circle cx="20" cy="140" r="7" fill="#fff"/><circle cx="38" cy="118" r="13" fill="#fff"/><circle cx="88" cy="70" r="58" fill="#fff"/></g><path d="M88 104 C62 86 52 72 52 60 C52 49 60 42 69 42 C77 42 84 47 88 54 C92 47 99 42 107 42 C116 42 124 49 124 60 C124 72 114 86 88 104Z" fill="url(#hg)"/><ellipse cx="68" cy="56" rx="7" ry="5" fill="#fff" opacity=".55"/></svg>';
  const TAIL_IN = '<svg class="tail" viewBox="0 0 44 44"><path d="M44 0 L44 44 L0 44 C14 40 22 30 22 12 L22 0Z" fill="currentColor"/></svg>';
  const TAIL_OUT = '<svg class="tail" viewBox="0 0 44 44"><path d="M0 0 L0 44 L44 44 C30 40 22 30 22 12 L22 0Z" fill="currentColor"/></svg>';
  const CHEV = '<svg viewBox="0 0 24 24"><path d="M15 4.5L7.5 12l7.5 7.5" fill="none" stroke="#5a5a62" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const VCAM = '<svg viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="13" height="11" rx="2.5" fill="none" stroke="#5a5a62" stroke-width="1.7"/><path d="M15.5 10.5l5-3v9l-5-3z" fill="none" stroke="#5a5a62" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" width="92" height="92"><path d="M12 4v16M4 12h16" stroke="#3a3a40" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const MIC = '<svg class="mic" viewBox="0 0 14 20"><rect x="3.5" y="1" width="7" height="11.5" rx="3.5" fill="none" stroke="#c9c9ce" stroke-width="1.4"/><path d="M1 9.5a6 6 0 0012 0M7 15.5v3.5" fill="none" stroke="#c9c9ce" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const STATUS = '<svg width="270" height="60" viewBox="0 0 90 20"><g fill="#111"><rect x="0" y="12" width="4" height="6" rx="1"/><rect x="6" y="9" width="4" height="9" rx="1"/><rect x="12" y="6" width="4" height="12" rx="1"/><rect x="18" y="3" width="4" height="15" rx="1"/></g><path d="M31 9.2a11 11 0 0115 0M34 12.3a6.5 6.5 0 019 0" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"/><circle cx="38.5" cy="15.8" r="1.9" fill="#111"/><rect x="55" y="4" width="28" height="13" rx="4" fill="none" stroke="#111" stroke-width="1.4" opacity=".45"/><rect x="57" y="6" width="24" height="9" rx="2.4" fill="#111"/><path d="M85 8.5v4" stroke="#111" stroke-width="1.6" stroke-linecap="round" opacity=".45"/></svg>';
  const PIZZA = '<svg viewBox="0 0 24 24"><path d="M5 6.5c4.5-2.3 9.6-2.3 14 0L12 21z" fill="#fff"/><path d="M5 6.5c4.5-2.3 9.6-2.3 14 0" fill="none" stroke="#ffd9a8" stroke-width="2"/><circle cx="10" cy="9.6" r="1.4" fill="#f37b1d"/><circle cx="14.2" cy="10.4" r="1.3" fill="#f37b1d"/><circle cx="12" cy="14.2" r="1.2" fill="#f37b1d"/></svg>';
  const SEARCH = '<svg viewBox="0 0 24 24" width="44" height="44"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="#9a9aa2" stroke-width="2"/><path d="M15 15l5 5" stroke="#9a9aa2" stroke-width="2" stroke-linecap="round"/></svg>';
  const MAPGLYPH = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#c4c4ca"/><path d="M9 4v14M15 6v14" stroke="#ececf0" stroke-width="1.4"/></svg>';

  // ---------- typing ----------
  // ks: [[frame, chars], ...] piecewise linear. Each character fades in over FADE frames once it is typed;
  // the untyped rest stays in the layout, invisible, so wrapping never reflows while it types.
  const FADE = 3.2;
  const esc = (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "☠" ? SKULL : c);
  const charTimes = (text, ks) => {
    const t = [];
    for (let i = 0; i < text.length; i++) {
      const need = i + 1;
      let tt = ks[ks.length - 1][0];
      if (need <= ks[0][1]) tt = ks[0][0];
      else for (let j = 1; j < ks.length; j++) if (ks[j][1] >= need) { const [f0, n0] = ks[j - 1], [f1, n1] = ks[j]; tt = f0 + ((need - n0) / (n1 - n0)) * (f1 - f0); break; }
      t.push(tt);
    }
    return t;
  };
  const typedHTML = (text, times, f, fade = FADE) => {
    let out = "", cur = -1, buf = "";
    const flush = () => { if (!buf) return; out += cur >= 1 ? buf : `<span style="opacity:${cur}">${buf}</span>`; buf = ""; };
    for (let i = 0; i < text.length; i++) {
      const op = Math.round(clamp((f - times[i] + 1) / fade, 0, 1) * 20) / 20;
      if (op !== cur) { flush(); cur = op; }
      buf += esc(text[i]);
    }
    flush();
    return out;
  };

  // ---------- generated imagery ----------
  function mapSVG(Wm, Hm, seed, opts = {}) {
    const r = rng(seed);
    const P = [];
    P.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wm}" height="${Hm}" viewBox="0 0 ${Wm} ${Hm}">`);
    P.push(`<rect width="${Wm}" height="${Hm}" fill="#f6efe5"/>`);
    // districts
    for (let i = 0; i < 26; i++) {
      const x = r() * Wm, y = r() * Hm, w = 160 + r() * 420, h = 120 + r() * 360;
      P.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${r() < 0.5 ? "#f9e6d3" : "#f2ebe0"}" transform="rotate(-16 ${x.toFixed(0)} ${y.toFixed(0)})"/>`);
    }
    // street grid, rotated, jittered
    const g = opts.grid || 150, rot = -16, sc = opts.stroke || 1;
    const lines = [];
    for (let k = -Wm; k < Wm * 2; k += g * (0.75 + r() * 0.6)) lines.push(`M${k.toFixed(0)} ${-Hm} L${(k + (r() - 0.5) * 120).toFixed(0)} ${Hm * 2}`);
    for (let k = -Hm; k < Hm * 2; k += g * (0.75 + r() * 0.6)) lines.push(`M${-Wm} ${k.toFixed(0)} Q${(Wm / 2).toFixed(0)} ${(k + (r() - 0.5) * 160).toFixed(0)} ${Wm * 2} ${(k + (r() - 0.5) * 90).toFixed(0)}`);
    const grid = lines.join(" ");
    P.push(`<g transform="rotate(${rot} ${Wm / 2} ${Hm / 2})"><path d="${grid}" fill="none" stroke="#e6dccd" stroke-width="${22 * sc}"/><path d="${grid}" fill="none" stroke="#fff" stroke-width="${15 * sc}"/></g>`);
    // arterials
    const art = [];
    for (let i = 0; i < 3; i++) {
      const y0 = r() * Hm, y1 = r() * Hm;
      art.push(`M${-100} ${y0.toFixed(0)} C${(Wm * 0.3).toFixed(0)} ${(y0 + (r() - 0.5) * 700).toFixed(0)} ${(Wm * 0.6).toFixed(0)} ${(y1 + (r() - 0.5) * 700).toFixed(0)} ${Wm + 100} ${y1.toFixed(0)}`);
    }
    for (let i = 0; i < 2; i++) {
      const x0 = r() * Wm, x1 = r() * Wm;
      art.push(`M${x0.toFixed(0)} -100 C${(x0 + (r() - 0.5) * 600).toFixed(0)} ${(Hm * 0.35).toFixed(0)} ${(x1 + (r() - 0.5) * 600).toFixed(0)} ${(Hm * 0.65).toFixed(0)} ${x1.toFixed(0)} ${Hm + 100}`);
    }
    P.push(`<path d="${art.join(" ")}" fill="none" stroke="#eadbc4" stroke-width="${26 * sc}"/><path d="${art.join(" ")}" fill="none" stroke="#fffaf0" stroke-width="${19 * sc}"/>`);
    // parks
    const pk = opts.park || [Wm * 0.62, Hm * 0.1];
    P.push(`<path d="M${pk[0]} ${pk[1]} C${pk[0] + 120} ${pk[1] + 400} ${pk[0] + 40} ${pk[1] + 900} ${pk[0] + 160} ${pk[1] + 1500} L${pk[0] + 420} ${pk[1] + 1500} C${pk[0] + 330} ${pk[1] + 900} ${pk[0] + 420} ${pk[1] + 400} ${pk[0] + 300} ${pk[1]} Z" fill="#c4e6a2"/>`);
    P.push(`<path d="M${pk[0] + 150} ${pk[1] + 60} C${pk[0] + 230} ${pk[1] + 500} ${pk[0] + 170} ${pk[1] + 900} ${pk[0] + 290} ${pk[1] + 1450}" fill="none" stroke="#fff" stroke-width="${9 * sc}" opacity=".85"/>`);
    P.push(`<circle cx="${pk[0] + 260}" cy="${pk[1] + 1180}" r="${70 * sc}" fill="none" stroke="#fff" stroke-width="${8 * sc}"/>`);
    for (let i = 0; i < 7; i++) {
      const x = r() * Wm * 0.6, y = r() * Hm, w = 90 + r() * 220, h = 70 + r() * 160;
      P.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="18" fill="#c9e8aa" transform="rotate(-16 ${x.toFixed(0)} ${y.toFixed(0)})"/>`);
    }
    // water: a coast on the right and a bay at the bottom
    const cx = opts.coast || Wm * 0.8;
    let coast = `M${cx} -50`;
    for (let y = 0; y <= Hm + 100; y += 140) coast += ` L${(cx + Math.sin(y / 260 + seed) * 70 + (r() - 0.5) * 40 + (y > Hm * 0.55 ? -(y - Hm * 0.55) * 0.35 : 0)).toFixed(0)} ${y}`;
    coast += ` L${Wm + 50} ${Hm + 100} L${Wm + 50} -50 Z`;
    P.push(`<path d="${coast}" fill="#8fd2f6"/>`);
    P.push(`<path d="M${cx + 260} ${Hm * 0.18} q140 60 120 220 q-30 140 90 260 l400 0 l0 -480 z" fill="#f6efe5" opacity=".95"/>`);
    P.push(`<path d="M-50 ${Hm * 0.92} C${Wm * 0.15} ${Hm * 0.84} ${Wm * 0.3} ${Hm * 0.97} ${Wm * 0.45} ${Hm + 60} L-50 ${Hm + 60}Z" fill="#8fd2f6"/>`);
    P.push(`</svg>`);
    return P.join("");
  }

  // clouds: fractal value noise, computed once at half resolution. Density is thresholded noise; light comes from
  // the noise's slope toward the top-left, so the billows get bright rims and blue undersides.
  function cloudsCanvas(Wc, Hc, seed) {
    const w = Math.round(Wc / 2), h = Math.round(Hc / 2);
    const N = 256, perm = new Uint8Array(N * 2), val = new Float32Array(N);
    const r = rng(seed);
    for (let i = 0; i < N; i++) { perm[i] = i; val[i] = r(); }
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (let i = 0; i < N; i++) perm[i + N] = perm[i];
    const sm = (t) => t * t * (3 - 2 * t);
    const vn = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      const a = val[perm[X + perm[Y]]], b = val[perm[X + 1 + perm[Y]]], c = val[perm[X + perm[Y + 1]]], d = val[perm[X + 1 + perm[Y + 1]]];
      const u = sm(xf), v = sm(yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const fbm = (x, y, oct = 6) => { let s = 0, amp = 0.5, f = 1; for (let o = 0; o < oct; o++) { s += amp * vn(x * f, y * f); f *= 2.03; amp *= 0.5; } return s; };
    const sc = 1 / 250;
    const F = new Float32Array(w * h), G = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const bias = 0.1 * ((x / w) * 0.6 + (1 - y / h) * 0.4) - 0.02;
      F[y * w + x] = fbm(x * sc, y * sc * 1.3) + bias;
      G[y * w + x] = fbm(x * sc, y * sc * 1.3, 4) + bias;
    }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x2 = c.getContext("2d"), img = x2.createImageData(w, h), D = img.data;
    const ss = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, f = F[i];
      const g = G[i], gx = G[i - (x > 6 ? 7 : 0)], gy = G[i - (y > 6 ? 7 * w : 0)];
      const fx = F[i - (x > 1 ? 2 : 0)], fy = F[i - (y > 1 ? 2 * w : 0)];
      const lightRaw = ((g - gx) * 0.6 + (g - gy) * 1.0) * 9 + ((f - fx) * 0.6 + (f - fy)) * 7; // rising toward the light
      const light = clamp(0.45 + lightRaw * 1.6, 0, 1);
      const dens = ss(0.38, 0.47, f);
      const core = ss(0.5, 0.75, f);
      // sky
      const t = (x / w) * 0.45 + (y / h) * 0.55;
      const sky = [lerp(84, 10, t), lerp(146, 58, t), lerp(232, 168, t)];
      // cloud body: blue-grey in the folds, white on the lit rims
      const shadow = [lerp(52, 128, core), lerp(98, 162, core), lerp(198, 226, core)];
      const litc = [255, 255, 255];
      const L = clamp(light * 0.85 + core * 0.25 - 0.08, 0, 1);
      const cl = [lerp(shadow[0], litc[0], L), lerp(shadow[1], litc[1], L), lerp(shadow[2], litc[2], L)];
      D[i * 4] = lerp(sky[0], cl[0], dens); D[i * 4 + 1] = lerp(sky[1], cl[1], dens); D[i * 4 + 2] = lerp(sky[2], cl[2], dens); D[i * 4 + 3] = 255;
    }
    x2.putImageData(img, 0, 0);
    const out = document.createElement("canvas"); out.width = Wc; out.height = Hc;
    const y3 = out.getContext("2d"); y3.imageSmoothingQuality = "high"; y3.drawImage(c, 0, 0, Wc, Hc);
    return out;
  }

  const WINE = `<svg viewBox="0 0 742 970" width="742" height="970" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc3b4"/><stop offset=".55" stop-color="#a99986"/><stop offset="1" stop-color="#6f604f"/></linearGradient>
      <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d120e"/><stop offset=".28" stop-color="#26332a"/><stop offset=".36" stop-color="#55665a"/><stop offset=".44" stop-color="#1c261f"/><stop offset=".8" stop-color="#0f1511"/><stop offset="1" stop-color="#1d2720"/></linearGradient>
      <linearGradient id="wk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c98f72"/><stop offset=".5" stop-color="#e7b293"/><stop offset="1" stop-color="#b97c60"/></linearGradient>
      <linearGradient id="wlab" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9d1c2"/><stop offset=".45" stop-color="#f4eee3"/><stop offset="1" stop-color="#cfc6b6"/></linearGradient>
      <filter id="wb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="wb2"><feGaussianBlur stdDeviation="1.1"/></filter>
    </defs>
    <rect width="742" height="970" fill="url(#wl)"/>
    <g filter="url(#wb)">
      <rect x="-40" y="560" width="840" height="460" fill="#5d4c3c"/>
      <rect x="560" y="120" width="120" height="420" rx="40" fill="#e9eef3" opacity=".85"/>
      <rect x="585" y="70" width="70" height="80" rx="14" fill="#3c6fd0" opacity=".8"/>
      <ellipse cx="660" cy="820" rx="150" ry="120" fill="#7d3c6c" opacity=".85"/>
      <rect x="470" y="520" width="300" height="160" fill="#d8dbe0" opacity=".7"/>
      <ellipse cx="90" cy="260" rx="140" ry="220" fill="#8a7764" opacity=".7"/>
    </g>
    <g filter="url(#wb2)">
      <path d="M318 -20 L318 150 C318 210 268 236 262 300 L262 1000 L478 1000 L478 300 C472 236 422 210 422 150 L422 -20 Z" fill="url(#wg)"/>
      <path d="M330 -20 L332 148 C332 196 300 226 292 262" fill="none" stroke="#7d9282" stroke-width="5" opacity=".55"/>
      <path d="M352 300 L352 1000" stroke="#8fa596" stroke-width="10" opacity=".28"/>
      <rect x="270" y="420" width="200" height="300" rx="6" fill="url(#wlab)"/>
      <text x="370" y="520" text-anchor="middle" font-family="Newsreader" font-style="italic" font-weight="500" font-size="46" fill="#3b2f2a" transform="rotate(-9 370 520)">Alta Viña</text>
      <path d="M300 560 h140 M310 584 h120 M318 640 h104 M326 658 h88" stroke="#8a7e70" stroke-width="3"/>
      <text x="370" y="616" text-anchor="middle" font-family="Newsreader" font-weight="600" font-size="22" fill="#5b4c42" letter-spacing="3">RESERVA</text>
      <text x="370" y="700" text-anchor="middle" font-family="Inter" font-weight="600" font-size="18" fill="#6a5d52" letter-spacing="2">2016</text>
      <path d="M150 560 C170 520 225 512 262 526 L262 760 C230 780 180 770 150 740 C120 700 126 600 150 560Z" fill="url(#wk)"/>
      <path d="M262 560 C300 548 330 560 342 584 C352 606 330 620 300 618 L262 616Z" fill="#dca487"/>
      <path d="M262 628 C304 618 336 630 346 652 C354 672 332 686 300 684 L262 682Z" fill="#d9a184"/>
      <path d="M262 694 C300 686 330 698 338 718 C344 736 324 748 296 746 L262 744Z" fill="#d49c80"/>
      <path d="M262 752 C292 748 314 758 318 774 C322 790 304 800 282 798 L262 796Z" fill="#cc9478"/>
      <path d="M150 740 C120 800 100 900 90 1000 L300 1000 C290 900 280 820 262 760Z" fill="url(#wk)"/>
    </g>
  </svg>`;

  const SCENE = {};
  SCENE.mount = function (stage) {
    const $ = (sel, root = stage) => root.querySelector(sel);

    // ---------- scenes ----------
    const mk = (id, bg) => { const s = div("scene"); s.id = id; s.style.background = bg; stage.appendChild(s); return s; };
    const sc = {
      p1: mk("s-p1", "#ffffff"),
      search: mk("s-search", "#ffffff"),
      map: mk("s-map", "#f6efe5"),
      book: mk("s-book", "#ffffff"),
      p2: mk("s-p2", "#ffffff"),
      clouds: mk("s-clouds", "#ffffff"),
      end: mk("s-end", "#f9f8fb"),
      logo: mk("s-logo", "#f9f8fb"),
    };

    // ---------- phone ----------
    function buildPhone(scene) {
      const bgw = div("abs"); bgw.style.width = W + "px"; bgw.style.height = H + "px";
      bgw.innerHTML = '<div class="foliage"></div><div class="grain"></div><div class="grain dk"></div>';
      scene.appendChild(bgw);
      const w = div("world");
      w.innerHTML = `<div class="pbody"><div class="pframe"></div>
          <div class="pbtn" style="left:-82px;top:820px;height:240px"></div><div class="pbtn" style="left:-82px;top:1110px;height:240px"></div>
          <div class="pbtn" style="left:2168px;top:960px;height:380px"></div><div class="pbezel"></div></div>
        <div class="pscreen">
          <div class="plist"></div>
          <div class="phead"><div class="clock">9:41</div><div class="island"></div><div class="sicons">${STATUS}</div>
            <div class="hbtn" style="left:124px">${CHEV}</div><div class="hbtn" style="left:1796px">${VCAM}</div>
            <div class="avatar">${SPARK("#fff")}</div><div class="pname">Remy</div></div>
          <div class="pinput"><div class="plus">${PLUS}</div><div class="field"><div class="ph"></div>${MIC}</div></div>
          <div class="pkbd"></div>
        </div>`;
      scene.appendChild(w);
      const kb = $(".pkbd", w);
      const rows = [["QWERTYUIOP", 0, 110], ["ASDFGHJKL", 105, 400], ["ZXCVBNM", 315, 690]];
      for (const [ks, off, y] of rows) [...ks].forEach((ch, i) => {
        const k = div("key", ch); k.style.left = 30 + off + i * 210 + "px"; k.style.top = y + "px"; k.style.width = "188px"; kb.appendChild(k);
      });
      const sp = (l, t, wd, txt, bg) => { const k = div("key", txt); k.style.left = l + "px"; k.style.top = t + "px"; k.style.width = wd + "px"; if (bg) k.style.background = bg; k.style.fontSize = "52px"; kb.appendChild(k); };
      sp(30, 690, 250, "⇧", "#b7bac2"); sp(1824, 690, 250, "⌫", "#b7bac2");
      sp(30, 980, 250, "123", "#b7bac2"); sp(310, 980, 1230, "space"); sp(1570, 980, 504, "return", "#b7bac2");
      return { bg: bgw, root: w, body: $(".pbody", w), list: $(".plist", w), input: $(".pinput", w), ph: $(".ph", w), kb, items: [], head: $(".phead", w) };
    }

    // list items. gap = space above the item; t0 = frame it starts to appear
    function addBub(ph, o) {
      const it = div("it");
      const b = div("bub " + o.side);
      b.innerHTML = '<span class="tx"></span>' + (o.side === "in" ? TAIL_IN : TAIL_OUT);
      b.style.color = "";
      it.appendChild(b);
      $(".tail", b).style.color = o.side === "in" ? "#ededf0" : "#1f80fa";
      ph.list.appendChild(it);
      const rec = { kind: "bub", el: it, bub: b, tx: $(".tx", b), side: o.side, text: o.text, ks: o.ks, t0: o.t0, gap: o.gap, times: charTimes(o.text, o.ks), react: null, name: o.name };
      $(".tx", b).innerHTML = `<span style="opacity:0">${[...o.text].map(esc).join("")}</span>`;
      if (o.react) {
        const r = div("react", o.react.type === "haha" ? HAHA : o.react.type === "bang" ? BANG : HEART);
        it.appendChild(r);
        rec.react = { el: r, t: o.react.t, type: o.react.type };
      }
      ph.items.push(rec);
      return rec;
    }
    function addQuote(ph, o) {
      const it = div("it"); const q = div("quote", o.text); it.appendChild(q); ph.list.appendChild(it);
      const rec = { kind: "quote", el: it, bub: q, t0: o.t0, gap: o.gap, side: "out" }; ph.items.push(rec); return rec;
    }
    function addPhoto(ph, o) {
      const it = div("it"); const p = div("photo", WINE); it.appendChild(p); ph.list.appendChild(it);
      const rec = { kind: "photo", el: it, bub: p, t0: o.t0, gap: o.gap, side: "out" }; ph.items.push(rec); return rec;
    }
    function addCard(ph) {
      const it = div("it");
      const c = div("card", `<div class="bg"></div><svg class="ol"><path fill="none" stroke-linecap="round"/></svg><div class="bar"></div><div class="ttl"></div><div class="tm">10:00-10:30</div>
        <div class="chip"><div class="cbg"></div><div class="ico">${WAVE}</div><div class="ct"></div></div>`);
      it.appendChild(c); ph.list.appendChild(it);
      const rec = { kind: "card", el: it, bub: c, t0: -999, gap: 0, side: "in", h: 315, w: 1282 };
      ph.items.push(rec); return rec;
    }

    const LIST_BOTTOM = 2694 - 150; // just above the input field
    function measure(ph) {
      for (const it of ph.items) {
        if (it.kind === "card") continue;
        it.h = it.bub.offsetHeight; it.w = it.bub.offsetWidth;
        it.x = it.side === "in" ? 146 : 2104 - (it.kind === "quote" ? 410 : 150) - it.w;
        if (it.react) {
          const r = it.react;
          if (r.type === "haha" && it.side === "out") { r.x = it.x - 66; r.y = -74; }
          else if (r.type === "haha") { r.x = it.x + it.w - 64; r.y = -74; }
          else if (r.type === "bang") { r.x = it.x + it.w - 10; r.y = it.h - 100; }
          else { r.x = it.x - 132; r.y = -64; }
          r.el.style.left = r.x + "px"; r.el.style.top = r.y + "px";
        }
      }
    }
    // lay the list out at frame f. mode: {bottom:true} or {idx, y} (pin item idx's top to world y)
    function layoutList(ph, f, mode) {
      let y = 0; const pos = [];
      for (const it of ph.items) {
        // the reference scrolls each new message in fast (8 frames), then settles slowly over ~25 more
        const a = it.t0 <= -999 ? 1 : 0.82 * eio(ramp(f, it.t0, it.t0 + 10)) + 0.18 * eio(ramp(f, it.t0 + 2, it.t0 + 32));
        pos.push(y + it.gap * a);
        y += (it.gap + it.h) * a;
      }
      const off = mode.bottom ? (ph.lb || LIST_BOTTOM) - y : mode.y - pos[mode.idx];
      ph.items.forEach((it, i) => { it.y = off + pos[i]; set(it.el, "transform", `translate(0px,${it.y.toFixed(2)}px)`); });
    }
    const center = (it) => ({ x: it.x + it.w / 2, y: it.y + it.h / 2 });
    function renderItems(ph, f, fadeOut) {
      for (const it of ph.items) {
        if (it.kind === "card") continue;
        const p = ramp(f, it.t0, it.t0 + 6);
        const vis = f >= it.t0;
        set(it.el, "visibility", vis ? "visible" : "hidden");
        if (!vis) continue;
        let op = eo(ramp(f, it.t0, it.t0 + 4)), bl = (1 - eo(p)) * 16, s = lerp(0.9, 1, eo5(p)), dy = 0;
        if (it.kind === "photo") { s = lerp(0.96, 1, eo5(p)); dy = (1 - eo5(ramp(f, it.t0, it.t0 + 8))) * 160; }
        if (fadeOut && it.name !== fadeOut.keep) op *= 1 - ramp(f, fadeOut.a, fadeOut.b);
        if (fadeOut && it.name === fadeOut.keep) op *= 1 - ramp(f, fadeOut.ka, fadeOut.kb);
        set(it.bub, "opacity", op.toFixed(3));
        set(it.bub, "filter", blurOf(bl));
        set(it.bub, "transform", `translateY(${dy.toFixed(1)}px) scale(${s.toFixed(4)})`);
        if (it.kind === "bub") setHTML(it.tx, typedHTML(it.text, it.times, f));
        if (it.react) {
          const r = it.react, rs = keys(f, [[r.t, 0], [r.t + 3, 1.2], [r.t + 6, 0.94], [r.t + 9, 1]]);
          set(r.el, "visibility", f >= r.t ? "visible" : "hidden");
          set(r.el, "transform", `scale(${(Math.max(0.001, rs) * (r.type === "heart" ? 0.9 : 0.66)).toFixed(4)})`);
          set(r.el, "opacity", (op * ramp(f, r.t, r.t + 2)).toFixed(3));
        }
      }
    }
    function phoneChrome(ph, f, o) {
      // o: frame (0..1), input (0..1), kb (0..1 slide), ph (placeholder ks), blur
      set(ph.body, "opacity", o.frame.toFixed(3));
      set(ph.bg, "opacity", o.frame.toFixed(3));
      set(ph.input, "opacity", o.input.toFixed(3));
      set(ph.kb, "transform", `translateY(${((1 - o.kb) * 1700).toFixed(1)}px)`);
      set(ph.kb, "opacity", o.kbOp == null ? "1" : o.kbOp.toFixed(3));
      setHTML(ph.ph, typedHTML("Message Remy", ph.phTimes, f, 2.5));
      // grain moves every frame
      const r = rng(Math.floor(f) * 7 + 3);
      ph.bg.querySelectorAll(".grain").forEach((g) => set(g, "transform", `translate(${Math.round(r() * 60 - 30)}px,${Math.round(r() * 60 - 30)}px)`));
    }

    // ======== phone 1: S1–S3 ========
    const P1 = buildPhone(sc.p1);
    P1.lb = 2381;
    P1.phTimes = charTimes("Message Remy", [[104, 0], [110, 7], [124, 12]]);
    const card = addCard(P1);
    addBub(P1, { name: "recap", side: "in", gap: 36, t0: 37, text: "btw here's the sync notes from your marketing team - looks like they want some founder reels.", ks: [[37, 0], [39, 52], [63, 94]] });
    addBub(P1, { name: "drink", side: "in", gap: 18, t0: 71, text: "sounds like you need a drink..", ks: [[71, 0], [72, 7], [99, 30]] });
    addBub(P1, { name: "omg", side: "out", gap: 40, t0: 137, text: "omg YES", ks: [[137, 0], [140, 2], [146, 5], [150, 7]], react: { type: "haha", t: 155 } });
    addBub(P1, { name: "near", side: "out", gap: 18, t0: 158, text: "whats on near the office?", ks: [[158, 0], [161, 9], [171, 25]] });
    addQuote(P1, { text: "whats on near the office?", t0: 199, gap: 64 });
    const venue = addBub(P1, { name: "venue", side: "in", gap: 10, t0: 199, text: "Tribeca has a wine tasting tonight. just 300m from your office. starts at 9p. $35 unlim", ks: [[197, 0], [200, 46], [231, 86]], react: { type: "haha", t: 216 } });
    addBub(P1, { name: "down", side: "in", gap: 18, t0: 233, text: "u down?!?", ks: [[233, 0], [236, 2], [249, 9]], react: { type: "bang", t: 245 } });
    const book = addBub(P1, { name: "book", side: "out", gap: 40, t0: 263, text: "HAHA - ye book it.", ks: [[263, 0], [267, 5], [279, 18]], react: { type: "heart", t: 275 } });
    addBub(P1, { name: "lfg", side: "out", gap: 18, t0: 304, text: "LFG", ks: [[304, 0], [307, 3]] });
    const QUOTE_IDX = 5;

    // card internals
    const cbg = $(".bg", card.bub), col = $("svg.ol", card.bub), colp = $("path", col), cbar = $(".bar", card.bub);
    const cttl = $(".ttl", card.bub), ctm = $(".tm", card.bub), cchip = $(".chip", card.bub), ccbg = $(".cbg", card.bub), cct = $(".ct", card.bub);
    const TTL_T = charTimes("Team stand up", [[20, 0], [33, 13]]), CT_T = charTimes("Sync Notes", [[-4, 0], [9, 10]]);
    function renderCard(f) {
      // the outline starts hugging the chip, then opens out to the full card
      const e = eio(ramp(f, 12, 25));
      const chipL = 1282 - 45 - 495, m = 18;
      const L = lerp(chipL - m, 0, e), R = 1282 - lerp(45 - m, 0, e), T = lerp(48 - m, 0, e), B = lerp(48 + 218 + m, 315, e);
      const w = R - L, h = B - T, rad = lerp(56, 50, e);
      set(cbg, "left", L + "px"); set(cbg, "top", T + "px"); set(cbg, "width", w + "px"); set(cbg, "height", h + "px");
      set(cbg, "boxShadow", `0 10px 34px rgba(20,20,40,${(0.06 * ramp(f, 22, 34)).toFixed(3)})`);
      // outline: drawn from a point on the top edge, anticlockwise, the tip ending back at the top-right
      const sx = L + w * 0.3;
      const d = `M${sx} ${T} L${L + rad} ${T} Q${L} ${T} ${L} ${T + rad} L${L} ${B - rad} Q${L} ${B} ${L + rad} ${B} L${R - rad} ${B} Q${R} ${B} ${R} ${B - rad} L${R} ${T + rad} Q${R} ${T} ${R - rad} ${T} L${sx} ${T}`;
      colp.setAttribute("d", d);
      const per = 2 * (w + h);
      const prog = eo(ramp(f, -9, 17));
      colp.setAttribute("stroke-dasharray", `${(per * prog).toFixed(1)} ${per * 2}`);
      colp.setAttribute("stroke", mix("#7c5cff", "#ebebef", ramp(f, 26, 40)));
      colp.setAttribute("stroke-width", lerp(7, 3, ramp(f, 26, 40)).toFixed(2));
      set(cbar, "opacity", ramp(f, 19, 22).toFixed(3));
      set(cbar, "transform", `scaleY(${eo(ramp(f, 19, 25)).toFixed(4)})`);
      setHTML(cttl, typedHTML("Team stand up", TTL_T, f));
      set(ctm, "opacity", (0.2 + 0.8 * ramp(f, 22, 30)) * ramp(f, 19, 22) + "");
      set(ccbg, "opacity", ramp(f, 13, 19).toFixed(3));
      setHTML(cct, typedHTML("Sync Notes", CT_T, f));
    }

    // ======== phone 2: S7 ========
    const P2 = buildPhone(sc.p2);
    P2.lb = 2434;
    P2.phTimes = charTimes("Message Remy", [[557, 0], [563, 7], [574, 12]]);
    const wine = addBub(P2, { name: "wine", side: "out", gap: 0, t0: 500, text: "dis good wine?", ks: [[500, 0], [503, 7], [516, 14]], react: { type: "haha", t: 509 } });
    addPhoto(P2, { t0: 532, gap: 18 });
    addQuote(P2, { text: "dis good wine?", t0: 583, gap: 40 });
    addBub(P2, { name: "notes1", side: "in", gap: 10, t0: 584, text: "it's an alta viña reserva 2016, rioja, tempranillo & garnacha", ks: [[584, 0], [587, 30], [612, 61]], react: { type: "haha", t: 605 } });
    addBub(P2, { name: "notes2", side: "in", gap: 18, t0: 619, text: "aged 14 months in french oak plus bottle time. 4.3 stars - good stuff", ks: [[619, 0], [622, 34], [637, 69]] });
    addBub(P2, { name: "lines", side: "out", gap: 40, t0: 646, text: "pick up lines based on what u know about me. QUICK", ks: [[646, 0], [650, 11], [666, 50]] });
    const forget = addBub(P2, { name: "forget", side: "in", gap: 40, t0: 678, text: "forget e-signatures, you're the only contract i want to sign right now", ks: [[682, 0], [685, 33], [711, 70]], react: { type: "haha", t: 722 } });
    $(".bub", P2.items[5].el).style.maxWidth = "1290px";

    // ======== S4: map-link bubble with a search ========
    const SW = div("world");
    SW.innerHTML = `<div class="scard"><div class="thumb">${mapSVG(608, 250, 11, { grid: 46, stroke: 0.3, park: [380, -20], coast: 540 })}</div>
      <div class="abs" style="left:262px;top:62px;width:84px;height:84px;border-radius:50%;background:#f7841f;border:5px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.15);display:grid;place-items:center"><div style="width:54px;height:54px">${PIZZA}</div></div>
      <div class="abs" style="left:150px;top:158px;width:308px;text-align:center;font:600 19px/22px Inter;color:#4a4a50">Forno Lumen<br>Pizzeria</div>
      <div class="abs" style="left:34px;top:288px">${SEARCH}</div><div class="q"></div>
      <div class="abs" style="left:40px;top:366px">${MAPGLYPH}</div><div class="sub">Maps</div>
      <svg class="abs" style="left:-6px;top:430px" width="70" height="70" viewBox="0 0 70 70"><path d="M40 0 L40 40 C30 52 16 60 0 62 C14 50 18 30 18 0Z" fill="#ececf0"/></svg></div>`;
    sc.search.appendChild(SW);
    const SWq = $(".q", SW), SQ_T = charTimes("Forno Lumen Pizzeria", [[348, 0], [349, 1], [368, 20]]);

    // ======== S5: map ========
    const MW = div("world");
    MW.innerHTML = `${mapSVG(4400, 3000, 5, { grid: 170, park: [2350, 300], coast: 2700 })}
      <div class="abs pin" style="left:1730px;top:1050px;width:140px;height:190px;transform-origin:70px 150px">
        <div class="abs" style="left:0;top:0;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffa13d,#f2750f);border:7px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.18);display:grid;place-items:center"><div style="width:88px;height:88px">${PIZZA}</div></div>
        <div class="abs" style="left:60px;top:142px;width:20px;height:20px;border-radius:50%;background:#f2750f;border:3px solid #fff"></div></div>
      <div class="abs plab" style="left:1500px;top:1290px;width:600px;text-align:center;font:500 66px/72px Inter;color:#3a3a40;paint-order:stroke;-webkit-text-stroke:12px rgba(255,255,255,.9)">Forno Lumen<br>Pizzeria</div>`;
    sc.map.appendChild(MW);
    const mpin = $(".pin", MW), mlab = $(".plab", MW);

    // ======== S6: booking page (laid out at reference frame 470, x2.25) ========
    const BW = div("world");
    const R = (x) => (x * K).toFixed(1) + "px";
    let bk = `<div class="bkt"><div class="bx" style="left:${R(78)};top:${R(118)};font:800 ${R(20.5)}/${R(25)} Inter;letter-spacing:-0.02em;color:#1c1c22">Forno Lumen<br>Pizzeria</div>
      <div class="bx" style="left:${R(78)};top:${R(173)};font:500 ${R(5.6)}/1 Inter;color:#8a8a92"><span style="color:#e2483d">★★★★★</span> 4.6 (812 reviews) &nbsp;·&nbsp; Italian &nbsp;·&nbsp; $$</div>
      <div class="bx" style="left:${R(78)};top:${R(184)};font:500 ${R(5.6)}/1 Inter;color:#8a8a92">● Hudson St, Tribeca</div>
      <div class="bx" style="left:${R(393)};top:${R(195)};font:500 ${R(5.6)}/1 Inter;color:#6a6a72">⇪ Share &nbsp;&nbsp; ♡ Save</div>`;
    [[85, "Guests", "1 Guest"], [218, "Date", "Today"], [348, "Time", "All Day"]].forEach(([x, a, b]) => {
      bk += `<div class="bx" style="left:${R(x)};top:${R(223)};font:500 ${R(4.6)}/1 Inter;color:#9a9aa2">${a}</div><div class="bx" style="left:${R(x)};top:${R(233)};font:700 ${R(5.6)}/1 Inter;color:#26262c">${b}</div>
        <div class="bx" style="left:${R(x + 108)};top:${R(230)};font:600 ${R(6)}/1 Inter;color:#7a7a82">⌄</div><div class="bx" style="left:${R(x)};top:${R(247)};width:${R(120)};height:${R(0.6)};background:#e2e2e8"></div>`;
    });
    "Fr Sa Su Mo Tu We Th Fr Sa Su Mo".split(" ").forEach((d, i) => {
      const x = 80 + i * 27, num = 14 + i;
      bk += `<div class="bx" style="left:${R(x - 6)};top:${R(260)};width:${R(12)};text-align:center;font:500 ${R(4)}/1 Inter;color:#a0a0a8">${d}</div>`;
      bk += i === 0 ? `<div class="bx" style="left:${R(x - 8)};top:${R(271)};width:${R(16)};height:${R(16)};border-radius:50%;background:#3b55d8;color:#fff;text-align:center;font:700 ${R(5)}/${R(16)} Inter">${num}</div>`
        : `<div class="bx" style="left:${R(x - 8)};top:${R(271)};width:${R(16)};text-align:center;font:600 ${R(5)}/${R(16)} Inter;color:${i === 4 ? "#e2483d" : "#3a3a42"}">${num}</div>`;
    });
    bk += `<div class="bx" style="left:${R(369)};top:${R(271)};width:${R(16)};height:${R(16)};border-radius:50%;border:${R(0.7)} solid #b0b0b8;color:#808088;text-align:center;font:600 ${R(6)}/${R(14)} Inter">›</div>
      <div class="bx" style="left:${R(86)};top:${R(314)};font:600 ${R(5)}/1 Inter;color:#55555c">Dinner</div>`;
    ["7:00 PM", "7:30 PM", "8:15 PM", "9:00 PM"].forEach((t, i) => {
      bk += `<div class="bx" style="left:${R(86 + i * 99)};top:${R(327)};width:${R(93)};height:${R(20)};border-radius:${R(2)};background:#3f5ad9;color:#fff;text-align:center;font:700 ${R(4.6)}/${R(10)} Inter;padding-top:${R(1)}">${t}<br><span style="font-weight:500;opacity:.8">${i % 2 ? "Patio" : "Indoor"}</span></div>`;
    });
    bk += `<div class="bx" style="left:${R(86)};top:${R(354)};width:${R(94)};height:${R(17)};border-radius:${R(2)};border:${R(0.7)} solid #b8b8c4;color:#3f5ad9;text-align:center;font:700 ${R(4.6)}/${R(16)} Inter">🔔︎ Notify</div></div>`;
    bk += `<div class="bimg abs" style="left:${R(547)};top:${R(120)};width:${R(233)};height:${R(232)};border-radius:${R(3)};overflow:hidden"><canvas class="bsky" width="524" height="522" style="width:100%;height:100%"></canvas>
      <svg class="abs" viewBox="0 0 100 100" style="left:${R(41)};top:${R(41)};width:${R(150)};height:${R(150)}"><circle cx="50" cy="50" r="46" fill="#0b0b0c"/><circle cx="50" cy="50" r="39" fill="none" stroke="#fff" stroke-width="2.4"/>
      <ellipse cx="38" cy="38" rx="8" ry="11" fill="#fff"/><rect x="35.6" y="46" width="4.8" height="31" rx="2.4" fill="#fff"/>
      <path d="M54 25v15a6 6 0 006 6h0a6 6 0 006-6V25M60 25v14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="57.6" y="44" width="4.8" height="33" rx="2.4" fill="#fff"/></svg></div>`;
    BW.innerHTML = `<div class="bk">${bk}</div>`;
    sc.book.appendChild(BW);
    const bkt = $(".bkt", BW), bimg = $(".bimg", BW);

    // ======== S8: clouds chat ========
    const CL = cloudsCanvas(2600, 1700, 21);
    CL.className = "abs"; CL.style.transformOrigin = "0 0";
    sc.clouds.appendChild(CL);
    const cwhite = div("abs"); cwhite.style.cssText = "width:1920px;height:1080px;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,.85) 40%,rgba(255,255,255,0) 100%)";
    sc.clouds.appendChild(cwhite);
    const CW = div("world"); sc.clouds.appendChild(CW);
    const cbubs = [
      { side: "in", t0: 745, text: "morning", ks: [[745, 0], [747, 4], [751, 7]] },
      { side: "in", t0: 755, text: "wow. party last night much? your ring just logged a sleep score of 1% ☠", ks: [[755, 0], [756, 20], [781, 70]], max: 800 },
      { side: "out", t0: 782, text: "clear my schedule. make no excuses", ks: [[782, 0], [786, 13], [807, 34]], fixed: 830 },
      { side: "in", t0: 809, text: "pick up lines work? haha", ks: [[809, 0], [810, 3], [831, 24]] },
    ].map((o) => {
      const b = div("cb " + o.side); b.innerHTML = `<span style="opacity:0">${[...o.text].map(esc).join("")}</span>`;
      if (o.max) b.style.maxWidth = o.max + "px";
      if (o.fixed) b.style.width = o.fixed + "px";
      CW.appendChild(b);
      return Object.assign(o, { el: b, times: charTimes(o.text, o.ks) });
    });
    function layoutClouds() {
      let y = 0;
      const gaps = [0, 29, 86, 72];
      cbubs.forEach((b, i) => {
        b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; y += gaps[i];
        b.x = b.side === "in" ? 0 : 1200 - b.w; b.y = y; y += b.h;
        b.el.style.left = b.x + "px"; b.el.style.top = b.y + "px";
        b.el.style.transformOrigin = b.side === "in" ? "0 100%" : "100% 100%";
      });
    }

    // ======== S9 / S10: end card, logo ========
    const EW = div("world"); sc.end.appendChild(EW);
    EW.innerHTML = `<div class="endl"><span class="w0">Text</span> <span class="w1">Remy</span> <span class="w2">today</span></div><div class="url"></div><div class="cap">Works in iMessage and WhatsApp</div>`;
    const endl = $(".endl", EW), ew = [0, 1, 2].map((i) => $(".w" + i, EW)), eurl = $(".url", EW), ecap = $(".cap", EW);
    const URL_T = charTimes("https://textremy.ai", [[855, 0], [858, 4], [873, 17], [879, 19]]);
    const LW = div("world"); sc.logo.appendChild(LW);
    LW.innerHTML = `<div class="logo"><svg viewBox="0 0 100 100"><path d="M50 6C24 6 6 23 6 46c0 13 6 24 16 31l-4 17 18-10c4 1 9 2 14 2 26 0 44-17 44-40S76 6 50 6z" fill="#18181a"/><g transform="translate(23 19) scale(.54)">${SPARK("#fff").replace(/<\/?svg[^>]*>/g, "")}</g></svg><div class="wm">remy</div></div>`;
    const logo = $(".logo", LW);

    let measured = false;
    function measureAll() {
      Object.values(sc).forEach((s) => set(s, "visibility", "hidden"));
      measure(P1); measure(P2); layoutClouds();
      // centre the end-card pieces on their measured sizes
      const lw = endl.offsetWidth, lh = endl.offsetHeight;
      endl.style.left = 947 - lw / 2 + "px"; endl.style.top = 457 - lh / 2 - 6 + "px";
      eurl.style.left = 947 - 220 + "px"; eurl.style.top = 603 - 51 + "px";
      ecap.style.left = 947 - 300 + "px"; ecap.style.top = 682 - 10 + "px";
      logo.style.left = 943 - logo.offsetWidth / 2 + "px"; logo.style.top = 513 - logo.offsetHeight / 2 + "px";
      measured = true;
    }
    // the booking image is a crop of the clouds
    const bsky = $(".bsky", BW).getContext("2d");
    bsky.drawImage(CL, 900, 420, 820, 816, 0, 0, 524, 522);

    // ---------- cameras (reference px / reference frames) ----------
    const A_S = [[0, 1.3], [9, 1.1], [18, 0.95], [27, 0.96], [36, 0.98], [46, 1], [101, 1], [104, 0.96], [106, 0.88], [108, 0.77], [110, 0.7], [114, 0.61], [120, 0.575], [126, 0.56], [136, 0.551], [196, 0.553]];
    const A_X = [[0, -152], [9, -63], [18, 37], [27, 133], [36, 139], [46, 135], [101, 135], [104, 140], [108, 180], [110, 198], [114, 205], [136, 210], [196, 210]];
    const A_Y = [[0, 147], [9, 160], [18, 172], [27, 165], [36, 165], [39, 158], [42, 112], [45, 80], [50, 58], [60, 40], [68, 32], [71, 15], [74, -70], [77, -100], [84, -112], [101, -120], [104, -105], [106, -60], [108, -8], [110, 14], [114, 32], [120, 39], [136, 40], [195, 40], [197, 26], [199, -40], [200, -70]];
    const B_X = [[200, 420], [264, 420], [273, 392], [297, 390]];
    const B_Y = [[199, 60], [200, 30], [202, 12], [207, 21], [213, 27], [216, 38], [231, 46], [240, 52], [249, 50], [252, 42], [258, 34], [264, 30], [267, 4], [270, -60], [273, -90], [280, -92], [297, -92]];
    const B_S = [[200, 0.588], [264, 0.588], [273, 0.566], [297, 0.566]];
    const C_X = [[297, 452], [300, 438], [324, 405], [336, 402], [349, 407]];
    const C_Y = [[297, 288], [300, 285], [303, 276], [306, 255], [309, 222], [312, 195], [318, 180], [324, 174], [349, 180]];
    const C_S = [[297, 1.04], [320, 1.0], [336, 0.97], [348, 0.88]];
    const F_Y = [[500, 272], [504, 267], [510, 255], [519, 235], [525, 227], [531, 208], [534, 179], [537, 125], [540, 107], [549, 88], [555, 75], [560, 62]];
    const F_S = [[500, 0.73], [555, 0.72], [560, 0.7]];
    const G_X = [[650, 48], [657, 16], [663, 13], [672, 19], [678, 37], [681, 62], [682.5, 110], [684, 157], [687, 179], [690, 190], [699, 205], [711, 211], [722, 211]];
    const Z_X = [[715, 442], [720, 400], [726, 398], [732, 398], [738, 400], [741, 420], [744, 430]];
    const Z_Y = [[715, 184], [720, 181], [726, 173], [732, 160], [738, 133], [741, 85], [744, 30]];
    const Z_S = [[715, 0.8], [720, 0.56], [726, 0.52], [744, 0.5]];
    const PLUS_W = { x: 249, y: 2797 };

    const vb = document.getElementById("vblurS");
    const vblur = (el, amt) => { vb.setAttribute("stdDeviation", `0 ${amt.toFixed(2)}`); set(el, "filter", amt > 0.05 ? "url(#vblur)" : "none"); };
    const hb = document.getElementById("hblurS");
    const hblur = (el, amt) => { hb.setAttribute("stdDeviation", `${amt.toFixed(2)} 0`); set(el, "filter", amt > 0.05 ? "url(#hblur)" : "none"); };

    // ---------- reference-driven cameras ----------
    // REFMO holds the reference's measured frame-to-frame similarity transform for each shot (pan of the frame
    // centre + zoom, in reference px). A shot's anchor starts where the hand-keyed camera puts it at the segment's
    // first frame, then rides the measured motion: p' = c + d + s (p - c), S' = S s.
    const MO = window.REFMO || {};
    const segP = {};
    function segPath(name, init) {
      if (segP[name]) return segP[name];
      const sg = MO[name], c = { x: 427, y: 240 };
      let p = { x: init.x, y: init.y }, S = init.S;
      const P = [[p.x, p.y, S]];
      for (const [dx, dy, sc] of sg.d) { p = { x: c.x + dx + sc * (p.x - c.x), y: c.y + dy + sc * (p.y - c.y) }; S *= sc; P.push([p.x, p.y, S]); }
      return (segP[name] = P);
    }
    // camera for frame f of segment name: anchorW = world anchor now; initFn() -> {x, y, S} screen (ref px) at frame a
    function segCam(name, f, anchorW, initFn) {
      const sg = MO[name];
      const P = segPath(name, segP[name] ? null : initFn());
      const k = clamp(f - sg.a, 0, P.length - 1), i = Math.min(Math.floor(k), P.length - 2), t = k - i;
      const q = P.length > 1 ? [lerp(P[i][0], P[i + 1][0], t), lerp(P[i][1], P[i + 1][1], t), P[i][2] * Math.pow(P[i + 1][2] / P[i][2], t)] : P[0];
      return cam(anchorW, q[0], q[1], q[2]);
    }
    // screen position (ref px) of world point W under camera c
    const scr = (W, c) => ({ x: (W.x * c.S + c.tx) / K, y: (W.y * c.S + c.ty) / K, S: c.S });
    const atFrame = (ph, a, mode, fn) => { layoutList(ph, a, mode); return fn(); };

    // ---------- per-scene renders ----------
    function renderP1(f) {
      let pin = f < 200 ? { bottom: true } : { idx: QUOTE_IDX, y: 830 };
      let c;
      const oldA = (g) => cam({ x: 146, y: card.y }, keys(g, A_X), keys(g, A_Y), keys(g, A_S));
      const cardA = () => ({ x: 146, y: card.y });
      const initA1 = () => atFrame(P1, 36, { bottom: true }, () => scr(cardA(), oldA(36)));
      if (f < 200) {
        layoutList(P1, f, pin);
        if (f < 36) c = oldA(f);
        else if (f < 132) c = segCam("A1", f, cardA(), initA1);
        else {
          const initA2 = () => atFrame(P1, 132, { bottom: true }, () => scr(PLUS_W, segCam("A1", 132, cardA(), initA1)));
          c = segCam("A2", f, PLUS_W, initA2);
        }
        layoutList(P1, f, pin);
        phoneChrome(P1, f, { frame: ramp(f, 104, 109), input: ramp(f, 102, 110), kb: eo(ramp(f, 111, 122)) });
        vblur(sc.p1, keys(f, [[196, 0], [199, 3], [200, 5]]));
      } else if (f < 297) {
        const top = { x: 1052, y: -70 };
        c = segCam("B", f, top, () => scr(top, cam(top, keys(201, B_X), keys(201, B_Y), keys(201, B_S))));
        // the thread scrolls up once as "u down?!?" lands (measured: ~48 ref px, fast then settling)
        pin = { idx: QUOTE_IDX, y: 830 - (0.82 * eio(ramp(f, 232, 242)) + 0.18 * eio(ramp(f, 234, 262))) * 48 * K / c.S };
        layoutList(P1, f, pin);
        phoneChrome(P1, f, { frame: 1, input: 1, kb: 1 });
        vblur(sc.p1, keys(f, [[200, 4], [201.5, 0]]));
      } else {
        layoutList(P1, f, pin);
        c = segCam("C", f, center(book), () => atFrame(P1, 297, pin, () => scr(center(book), cam(center(book), keys(297, C_X), keys(297, C_Y), keys(297, C_S)))));
        layoutList(P1, f, pin);
        phoneChrome(P1, f, { frame: 1, input: 1, kb: 1 });
        vblur(sc.p1, keys(f, [[297, 5], [299, 0]]));
      }
      renderItems(P1, f);
      renderCard(f);
      applyCam(P1.root, c);
      set(P1.bg.firstChild, "transform", `translate(${(c.tx * 0.04).toFixed(1)}px,${(c.ty * 0.03).toFixed(1)}px)`);
    }

    function renderSearch(f) {
      const S = keys(f, [[349, 270], [350, 252], [355, 222], [360, 200], [366, 188], [376, 182], [399, 181]]) / 270;
      const sx = keys(f, [[349, 421], [378, 412], [384, 405], [390, 390], [396, 352], [399, 316]]) * K, sy = keys(f, [[349, 330], [352, 290], [356, 262], [362, 242], [370, 228], [399, 232]]) * K;
      const rz = keys(f, [[349, 9], [352, 5], [356, 2], [362, 0], [370, -3], [376, -6], [383, -3], [390, 0], [399, 2]]);
      const ry = keys(f, [[349, 28], [353, 12], [358, 4], [364, 0], [376, -10], [388, 0], [399, 4]]);
      const rx = keys(f, [[349, -14], [354, -4], [360, 0], [380, 6], [399, 0]]);
      set(SW, "transform", `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px) perspective(1600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${S.toFixed(4)}) translate(-304px,-238px)`);
      set(SW, "filter", blurOf(keys(f, [[349, 7], [351, 3], [353, 0]])));
      set(SW, "opacity", (0.55 + 0.45 * ramp(f, 349, 352)).toFixed(3));
      setHTML(SWq, typedHTML("Forno Lumen Pizzeria", SQ_T, f, 2));
    }

    function renderMap(f) {
      const S = keys(f, [[399, 0.42], [404, 0.52], [410, 0.62], [420, 0.8], [432, 1.0], [445, 1.14], [459, 1.24]]);
      const PIN = { x: 1800, y: 1180 };
      const old = (g) => cam(PIN, keys(g, [[399, 455], [405, 446], [411, 420], [459, 419]]), keys(g, [[399, 240], [405, 225], [411, 226], [432, 215], [459, 200]]), keys(g, [[399, 0.62], [459, 0.62]]));
      const c = f < 400 ? old(f) : segCam("M", f, PIN, () => scr(PIN, old(400)));
      applyCam(MW, c);
      const ps = 1.45 * keys(f, [[399, 0], [403, 1.2], [407, 0.94], [411, 1]]);
      set(mpin, "transform", `scale(${Math.max(0.001, ps).toFixed(4)})`);
      set(mlab, "opacity", ramp(f, 404, 412).toFixed(3));
      set(mlab, "transform", `translateY(${((1 - eo(ramp(f, 404, 412))) * 20).toFixed(1)}px)`);
      set(MW, "filter", blurOf(keys(f, [[399, 5], [402, 0]])));
    }

    function renderBook(f) {
      const T = { x: 78 * K, y: 118 * K };
      const old = (g) => cam(T, keys(g, [[459, 66], [462, 72], [470, 78]]), keys(g, [[459, 150], [462, 132], [470, 120]]), keys(g, [[459, 1.03], [462, 1.02], [470, 1]]));
      const c = f < 462 ? old(f) : segCam("E", f, T, () => scr(T, old(462)));
      applyCam(BW, c);
      const out = 1 - ramp(f, 491, 499);
      set(bkt, "opacity", (eo(ramp(f, 459, 466)) * out).toFixed(3));
      set(bimg, "opacity", (eo(ramp(f, 462, 468)) * out).toFixed(3));
      set(BW, "filter", blurOf(keys(f, [[459, 8], [466, 0], [492, 0], [500, 8]])));
    }

    function renderP2(f) {
      const bm = { bottom: true };
      let pin = bm, c;
      layoutList(P2, f, bm);
      const oldF = (g) => cam(center(wine), 420, keys(g, F_Y), keys(g, F_S));
      const initF1 = () => atFrame(P2, 501, bm, () => scr(center(wine), oldF(501)));
      const lines = P2.items[5];
      if (f < 576) c = segCam("F1", Math.max(f, 501), center(wine), initF1);
      else if (f < 651) {
        const initF2 = () => atFrame(P2, 576, bm, () => scr(PLUS_W, segCam("F1", 576, center(wine), initF1)));
        c = segCam("F2", f, PLUS_W, initF2);
      } else if (f < 719) {
        const initG = () => scr(PLUS_W, cam(PLUS_W, keys(651, G_X), 323, 0.83));
        c = segCam("G", f, PLUS_W, initG);
      } else c = segCam("Z", Math.max(f, 720), center(forget), () => atFrame(P2, 720, bm, () => scr(center(forget), cam(center(forget), 400, 181, 0.56))));
      layoutList(P2, f, pin);
      const fo = f >= 715 ? { keep: "forget", a: 719, b: 725, ka: 737, kb: 744 } : null;
      renderItems(P2, f, fo);
      applyCam(P2.root, c);
      const chromeOut = 1 - ramp(f, 719, 723);
      phoneChrome(P2, f, { frame: ramp(f, 557, 561) * chromeOut, input: ramp(f, 557, 563) * chromeOut, kb: eo(ramp(f, 564, 575)), kbOp: chromeOut });
      set(P2.bg.firstChild, "transform", `translate(${(c.tx * 0.04).toFixed(1)}px,${(c.ty * 0.03).toFixed(1)}px)`);
      hblur(sc.p2, keys(f, [[0, 0], [646, 0], [649, 5], [650.4, 7], [651, 3], [653, 0], [679, 0], [682.5, 4], [686, 0]]));
    }

    function renderClouds(f) {
      const ent = eo(ramp(f, 737, 751));
      set(CL, "transform", `translate(${(-340 - (f - 740) * 0.5).toFixed(1)}px,${(-260 + (1 - ent) * 300 - (f - 740) * 0.35).toFixed(1)}px) scale(${lerp(1.02, 1, ent).toFixed(4)})`);
      set(CL, "opacity", ramp(f, 738, 747).toFixed(3));
      set(cwhite, "opacity", (1 - ramp(f, 741, 750)).toFixed(3));
      const m = cbubs[0];
      const MC = { x: m.x + m.w / 2, y: m.y + m.h / 2 };
      const c = segCam("H", clamp(f, 746, 846), MC, () => scr(MC, cam(MC, 235, 245, 1)));
      applyCam(CW, c);
      for (const b of cbubs) {
        const p = ramp(f, b.t0, b.t0 + 6);
        set(b.el, "visibility", f >= b.t0 ? "visible" : "hidden");
        set(b.el, "opacity", eo(ramp(f, b.t0, b.t0 + 4)).toFixed(3));
        set(b.el, "filter", blurOf((1 - eo(p)) * 12));
        set(b.el, "transform", `scale(${lerp(0.93, 1, eo5(p)).toFixed(4)})`);
        setHTML(b.el, typedHTML(b.text, b.times, f));
      }
    }

    function renderEnd(f) {
      const dx = keys(f, [[846, -100], [849, -55], [852, -31], [855, -20], [858, -12], [861, -7], [864, -4], [870, -1], [876, 0], [909, 0]]) * K;
      const dy = keys(f, [[846, 8], [855, 4], [868, 0], [909, 0]]) * K;
      const es = keys(f, [[846, 1.06], [849, 1.025], [852, 1.008], [858, 1]]);
      set(EW, "transform", `translate(${(dx + 960).toFixed(2)}px,${(dy + 540).toFixed(2)}px) scale(${es.toFixed(4)}) translate(-960px,-540px)`);
      [[846, 853], [851, 858], [857, 864]].forEach(([a, b], i) => {
        set(ew[i], "opacity", ramp(f, a - 1, a + 1.5).toFixed(3));
        set(ew[i], "color", mix("#c6c6ca", "#22302a", ramp(f, a, b)));
        set(ew[i], "filter", blurOf((1 - ramp(f, a - 1, a + 3)) * 6));
      });
      set(eurl, "opacity", ramp(f, 851, 854).toFixed(3));
      set(eurl, "background", mix("#a2a2a6", "#050505", ramp(f, 851, 856)));
      setHTML(eurl, typedHTML("https://textremy.ai", URL_T, f, 2));
      set(ecap, "opacity", ramp(f, 866, 880).toFixed(3));
    }

    function renderLogo(f) {
      const s = 1;
      set(LW, "transform", `translate(960px,540px) scale(${s.toFixed(4)}) translate(-960px,-540px)`);
    }

    function render(t) {
      if (!measured) measureAll();
      const f = clamp(t, 0, FRAMES - 0.001);
      const on = { p1: f < 349, search: f >= 349 && f < 399, map: f >= 399 && f < 459, book: f >= 459 && f < 501, p2: f >= 499 && f < 745, clouds: f >= 737 && f < 846, end: f >= 846 && f < 909, logo: f >= 909 };
      Object.keys(on).forEach((k) => set(sc[k], "visibility", on[k] ? "visible" : "hidden"));
      if (on.p1) renderP1(f);
      if (on.search) renderSearch(f);
      if (on.map) renderMap(f);
      if (on.book) renderBook(f);
      if (on.p2) renderP2(f);
      if (on.clouds) renderClouds(f);
      if (on.end) renderEnd(f);
      if (on.logo) renderLogo(f);
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v + SUB); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measured = false; render(R0._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
