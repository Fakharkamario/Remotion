// Wayfold — 20.07 s, 30 fps, 602 frames. Original travel-app story cut to the rhythm of a reference "type shift"
// edit: the same shot lengths, cuts, camera moves and cursor timing, with new art, copy and brand.
// The 9 s loop plays twice (second pass with new copy), then the end card.
//   loop frame
//   0–15     postcard collage pops in on a swinging camera, confetti squares blink on the paper
//   15–17    "type shift": the postcards jump into the phone layout at large scale
//   17–63    the Wayfold phone settles, its grid reshuffles twice
//   63–97    the prompt card types the request
//   97–138   close-up on the send button: cursor rises, presses, button turns brown → orange
//   138–183  stay listing slides in; blue cursor + note pill
//   183–224  dark checkout pushes in from the left; orange cursor, tax line highlights
//   224–270  white panel pushes in; pink cursor + note pill
//   539–602  black end card, glowing wordmark shrinks away
(function () {
  const FPS = 30, FRAMES = 602, LOOP = 270, END = 539;
  // sub-frame offset for the motion-blur render's second pass (scripts/render-mb.sh)
  const SUB = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); t = clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  // monotone cubic through [frame, value] pairs, so every move eases like a graph-editor curve without overshooting
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
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const place = (e, x, y, w, h) => { e.style.left = px(x); e.style.top = px(y); if (w != null) e.style.width = px(w); if (h != null) e.style.height = px(h); };
  const show = (e, on) => { e.style.display = on ? "block" : "none"; };

  // ---------------------------------------------------------------- icons (generic, drawn here)
  const ico = (body, vb = "0 0 24 24", extra = "") =>
    `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;
  const I = {
    back: ico('<path d="M15 5l-7 7 7 7"/>'),
    bell: ico('<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/>'),
    gear: ico('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    plus: ico('<path d="M12 4v16M4 12h16"/>'),
    search: ico('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    bag: ico('<rect x="4" y="7" width="16" height="13" rx="2.5"/><path d="M9 7a3 3 0 016 0"/>'),
    arrow: ico('<path d="M4 12h15M13 6l6 6-6 6"/>'),
    bulb: ico('<path d="M8 15c-1.8-1.4-3-3.4-3-6a7 7 0 0114 0c0 2.6-1.2 4.6-3 6v2.5H8z"/><path d="M9 21h6"/>', "0 0 24 24", 'stroke-width="1.6"'),
    doc: '<svg viewBox="0 0 18 23"><path d="M0 2a2 2 0 012-2h9l7 7v14a2 2 0 01-2 2H2a2 2 0 01-2-2z" fill="#3f7fe8"/><path d="M11 0v5a2 2 0 002 2h5z" fill="#9bc0f7"/><path d="M4 11h10M4 14h10M4 17h7" stroke="#fff" stroke-width="1.4"/></svg>',
    sheet: '<svg viewBox="0 0 18 23"><path d="M0 2a2 2 0 012-2h9l7 7v14a2 2 0 01-2 2H2a2 2 0 01-2-2z" fill="#22a45d"/><path d="M11 0v5a2 2 0 002 2h5z" fill="#8fd6ad"/><rect x="3.5" y="10" width="11" height="8" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M3.5 14h11M9 10v8" stroke="#fff" stroke-width="1.3"/></svg>',
    chev: ico('<path d="M8 3l8 9-8 9"/>', "0 0 24 24", 'stroke-width="2.6"'),
    mic: ico('<rect x="8.5" y="2.5" width="7" height="12" rx="3.5"/><path d="M5 11a7 7 0 0014 0M12 18v3.5"/>', "0 0 24 24", 'stroke-width="2.2"'),
    up: ico('<path d="M12 20V5M5.5 11.5L12 5l6.5 6.5"/>', "0 0 24 24", 'stroke-width="2.4"'),
    card: ico('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>'),
    help: ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.1-1.5 2.2M12 17v.2"/>', "0 0 24 24", 'stroke-width="1.6"'),
    // Wayfold mark: a folded paper plane in three facets
    mark: '<svg viewBox="0 0 40 40"><path d="M4 20L36 4 22 36z" fill="#1d1d1f"/><path d="M36 4L17 23l5 13z" fill="#f08a24"/><path d="M17 23l-13-3 32-16z" fill="#3f6fd8" opacity=".85"/></svg>',
  };
  // navigation-style cursor, tip at (0,0) pointing up-left
  const CUR = (c) => `<svg viewBox="0 0 66 66" style="overflow:visible"><path d="M2 2L60 26 33 33 26 60z" fill="${c}" stroke="rgba(255,255,255,.9)" stroke-width="2.5" stroke-linejoin="round"/></svg>`;

  // ---------------------------------------------------------------- illustrations (flat vector postcards)
  let gid = 0;
  const art = (kind) => {
    const g = () => "g" + (++gid);
    const lin = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
    const wrap = (defs, body) => `<svg class="art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
    const s = g(), t = g(), u = g();
    switch (kind) {
      case "sunset": return wrap(lin(s, "#ff9a5a", "#ffd9a0") + lin(t, "#2c6fa8", "#5fb0d6"),
        `<rect width="200" height="200" fill="url(#${s})"/><circle cx="100" cy="112" r="34" fill="#ffefc9"/><rect y="118" width="200" height="50" fill="url(#${t})"/><path d="M60 128h80M74 138h52M86 147h28" stroke="#ffe3b0" stroke-width="3" opacity=".7"/><path d="M0 168q60-14 120 0t80 0v32H0z" fill="#f2cf98"/>`);
      case "peaks": return wrap(lin(s, "#8fc3ee", "#dff0fb") + lin(t, "#3d7fb5", "#2a5d8c"),
        `<rect width="200" height="200" fill="url(#${s})"/><path d="M-10 140L50 60l35 45 30-55 95 90z" fill="#5c7d9e"/><path d="M50 60l12 16-10 4-8-8zM115 50l14 25-12-3-9 6z" fill="#f4f8fb"/><path d="M-10 150l70-40 40 25 40-30 70 45v50H-10z" fill="#3f6a52"/><rect y="155" width="200" height="45" fill="url(#${t})"/><path d="M30 170h50M110 182h60" stroke="#a9d3f0" stroke-width="2.5" opacity=".7"/>`);
      case "dunes": return wrap(lin(s, "#f7b267", "#fde2b8"),
        `<rect width="200" height="200" fill="url(#${s})"/><circle cx="150" cy="58" r="18" fill="#fff4dc"/><path d="M0 120q50-40 110 0t90-10v90H0z" fill="#e58b44"/><path d="M0 150q70-35 130 5t70 0v45H0z" fill="#c96a2f"/><path d="M40 100q20-10 40 5" stroke="#f7c38a" stroke-width="3" fill="none"/><path d="M128 120l4-14 4 14M150 128l3-10 3 10" stroke="#6b3d1e" stroke-width="2.5"/>`);
      case "city": return wrap(lin(s, "#1b2350", "#4a3d78"),
        `<rect width="200" height="200" fill="url(#${s})"/><circle cx="150" cy="40" r="13" fill="#fff6d6"/>` +
        [[10, 90, 30], [42, 70, 26], [70, 105, 22], [94, 55, 30], [126, 85, 26], [154, 65, 34]].map(([x, y, w], i) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${200 - y}" fill="${i % 2 ? "#2b2f5e" : "#343a70"}"/>` +
          Array.from({ length: 10 }, (_, k) => `<rect x="${x + 5 + (k % 2) * (w / 2)}" y="${y + 8 + Math.floor(k / 2) * 18}" width="5" height="7" fill="${(k * 7 + i) % 3 ? "#ffd27a" : "#3f4680"}"/>`).join("")).join("") +
        `<rect y="180" width="200" height="20" fill="#14183a"/>`);
      case "lighthouse": return wrap(lin(s, "#a8d8f0", "#f0f8fc") + lin(t, "#2f7fb3", "#174f7a"),
        `<rect width="200" height="200" fill="url(#${s})"/><path d="M0 150h200v50H0z" fill="url(#${t})"/><path d="M100 170l20-70h40l20 70z" fill="#7c8a6a"/><path d="M128 100l4-50h16l4 50z" fill="#fff"/><path d="M129.5 82h21l-1 10h-19zM131 62h18l-.7 9h-16.6z" fill="#e2483d"/><rect x="132" y="38" width="16" height="12" fill="#ffe08a"/><path d="M128 38h24l-12-10z" fill="#e2483d"/><path d="M20 160q15-6 30 0M60 172q15-6 30 0" stroke="#bfe2f5" stroke-width="2.5" fill="none"/>`);
      case "island": return wrap(lin(s, "#5fd0d8", "#1f8fb0"),
        `<rect width="200" height="200" fill="url(#${s})"/><ellipse cx="100" cy="128" rx="60" ry="22" fill="#9ee6e0" opacity=".6"/><ellipse cx="100" cy="125" rx="42" ry="14" fill="#f4dca4"/><path d="M98 125q-2-35 10-55" stroke="#7a5534" stroke-width="5" fill="none"/><path d="M108 70q-25-8-38 6 18-3 38-6zM108 70q20-14 38-4-20 0-38 4zM108 70q8-22 26-24-14 10-26 24zM108 70q-14-18-30-16 18 6 30 16z" fill="#2f9a52"/><path d="M30 40q10-4 20 0M150 160q10-4 20 0" stroke="#bff2f2" stroke-width="2.5" fill="none"/>`);
      case "cabin": return wrap(lin(s, "#c9d9ea", "#f3f7fb"),
        `<rect width="200" height="200" fill="url(#${s})"/><path d="M0 140q100-30 200 0v60H0z" fill="#fff"/>` +
        [[22, 60], [52, 45], [160, 55], [182, 70]].map(([x, h]) => `<path d="M${x} ${150 - h * 1.6}l-16 ${h * 1.6}h32z" fill="#2e5a46"/>`).join("") +
        `<path d="M78 140v-34h48v34z" fill="#8a4f2a"/><path d="M70 108l32-26 32 26z" fill="#f4f6f8"/><path d="M73 108l29-23 29 23" stroke="#5a331b" stroke-width="3" fill="none"/><rect x="94" y="116" width="14" height="24" fill="#5a331b"/><rect x="112" y="114" width="10" height="10" fill="#ffd27a"/><rect x="82" y="114" width="8" height="10" fill="#ffd27a"/>`);
      case "balloon": return wrap(lin(s, "#ffc9a8", "#c9e4f6"),
        `<rect width="200" height="200" fill="url(#${s})"/><path d="M0 170q50-30 100-5t100-10v45H0z" fill="#c98a5a"/>` +
        [[70, 70, 26, "#e2483d", "#ffd27a"], [140, 50, 16, "#3f6fd8", "#ffffff"], [160, 110, 10, "#f08a24", "#fff1c9"]].map(([x, y, r, a, b]) =>
          `<path d="M${x - r} ${y}a${r} ${r} 0 0 1 ${2 * r} 0q0 ${r * 0.9}-${r * 0.6} ${r * 1.4}h-${r * 0.8}q-${r * 0.6}-${r * 0.5}-${r * 0.6}-${r * 1.4}z" fill="${a}"/><path d="M${x} ${y - r}v${r * 2.4}" stroke="${b}" stroke-width="${r / 5}"/><rect x="${x - r * 0.25}" y="${y + r * 1.6}" width="${r * 0.5}" height="${r * 0.4}" fill="#6b3d1e"/>`).join(""));
      case "tram": return wrap(lin(s, "#9fd2f2", "#e8f5fc"),
        `<rect width="200" height="200" fill="url(#${s})"/><rect x="0" y="40" width="60" height="140" fill="#f2c8a0"/><rect x="150" y="30" width="60" height="150" fill="#e8a7a0"/>` +
        [[10, 60], [32, 60], [10, 100], [32, 100], [160, 50], [182, 50], [160, 90], [182, 90]].map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="22" fill="#5b7fa8"/>`).join("") +
        `<rect x="45" y="105" width="110" height="62" rx="10" fill="#f6c21c"/><rect x="45" y="140" width="110" height="9" fill="#fff"/><rect x="54" y="113" width="20" height="20" rx="3" fill="#9fd2f2"/><rect x="80" y="113" width="20" height="20" rx="3" fill="#9fd2f2"/><rect x="106" y="113" width="20" height="20" rx="3" fill="#9fd2f2"/><rect x="132" y="113" width="16" height="20" rx="3" fill="#9fd2f2"/><path d="M100 105V70l20-14" stroke="#333" stroke-width="2.5" fill="none"/><rect y="167" width="200" height="33" fill="#9a9590"/><circle cx="70" cy="168" r="7" fill="#333"/><circle cx="130" cy="168" r="7" fill="#333"/>`);
      case "tiles": return wrap("",
        `<rect width="200" height="200" fill="#f3f6fb"/>` +
        Array.from({ length: 16 }, (_, k) => { const x = (k % 4) * 50, y = Math.floor(k / 4) * 50; return `<g transform="translate(${x} ${y})"><rect width="50" height="50" fill="#f6f8fc" stroke="#cdd8ea"/><circle cx="25" cy="25" r="13" fill="none" stroke="#2b5fb5" stroke-width="4"/><path d="M25 3v8M25 39v8M3 25h8M39 25h8" stroke="#2b5fb5" stroke-width="4"/><circle cx="25" cy="25" r="4" fill="#2b5fb5"/><path d="M0 0l9 9M50 0l-9 9M0 50l9-9M50 50l-9-9" stroke="#7aa0dc" stroke-width="3"/></g>`; }).join(""));
      case "canal": return wrap(lin(s, "#bfe0f5", "#f4ead8") + lin(t, "#4c9bbf", "#2f6f8f"),
        `<rect width="200" height="200" fill="url(#${s})"/><rect x="0" y="60" width="44" height="100" fill="#d9825b"/><rect x="40" y="76" width="36" height="84" fill="#f0c56a"/><rect x="124" y="70" width="40" height="90" fill="#8fb47e"/><rect x="160" y="56" width="40" height="104" fill="#e7a0a8"/><rect y="150" width="200" height="50" fill="url(#${t})"/><path d="M50 150q50-50 100 0h-14q-36-32-72 0z" fill="#e9dcc4"/><rect x="50" y="138" width="100" height="10" fill="#e9dcc4"/><path d="M70 178q30-6 60 0" stroke="#9fd0e6" stroke-width="2.5" fill="none"/>`);
      case "forest": return wrap(lin(s, "#d7ead2", "#a9cfa0"),
        `<rect width="200" height="200" fill="url(#${s})"/>` +
        [[20, 120, "#2f6b45"], [60, 90, "#3c7d52"], [100, 110, "#2a5e3d"], [140, 80, "#3c7d52"], [180, 115, "#2f6b45"], [40, 150, "#244f33"], [120, 150, "#244f33"], [165, 160, "#2a5e3d"]].map(([x, y, c]) =>
          `<path d="M${x} ${y - 70}l-24 ${70}h48z" fill="${c}"/><rect x="${x - 3}" y="${y}" width="6" height="14" fill="#6b4a2a"/>`).join("") +
        `<path d="M0 185q100-20 200 0v15H0z" fill="#5e8a4a"/>`);
      case "lake": return wrap(lin(s, "#ffd6a8", "#f8a07a") + lin(t, "#f4b08a", "#7a8fc0"),
        `<rect width="200" height="200" fill="url(#${s})"/><path d="M0 110l40-40 30 25 40-50 50 45 40-20v40H0z" fill="#8a6f9e"/><rect y="110" width="200" height="90" fill="url(#${t})"/><path d="M20 140h40M110 160h60M60 180h50" stroke="#ffe0c0" stroke-width="2.5" opacity=".8"/><path d="M90 150l20 0-4 6h-12z" fill="#3b2a3a"/><path d="M100 150v-16l8 12z" fill="#fff"/>`);
      // interiors for the listing
      case "room": return wrap(lin(s, "#f1ece4", "#e4ddd2") + lin(t, "#8fd0ef", "#3d97c8"),
        `<rect width="200" height="200" fill="url(#${s})"/><rect x="110" y="30" width="70" height="80" fill="url(#${t})"/><rect x="110" y="88" width="70" height="22" fill="#3a85b5"/><path d="M110 70h70M145 30v80" stroke="#fff" stroke-width="4"/><rect x="106" y="26" width="78" height="88" fill="none" stroke="#fff" stroke-width="5"/><rect x="20" y="118" width="130" height="40" rx="6" fill="#fff"/><rect x="20" y="100" width="18" height="70" rx="3" fill="#b88a5a"/><rect x="44" y="108" width="34" height="16" rx="7" fill="#f6efe6"/><rect x="84" y="108" width="34" height="16" rx="7" fill="#f6efe6"/><rect x="20" y="140" width="130" height="22" fill="#e9b382"/><rect y="170" width="200" height="30" fill="#c9b49a"/><path d="M168 140l6-18 6 18z" fill="#5f8a55"/><rect x="170" y="140" width="8" height="30" fill="#b88a5a"/>`);
      case "pool": return wrap(lin(s, "#9fdcf5", "#e6f7fd") + lin(t, "#33b6d8", "#1a86b5"),
        `<rect width="200" height="200" fill="url(#${s})"/><rect y="80" width="200" height="40" fill="#f3e2c4"/><path d="M150 80V30" stroke="#7a5534" stroke-width="5"/><path d="M150 32q-22-6-34 8 18-4 34-8zM150 32q20-10 34 0-18-2-34 0zM150 32q4-18 20-18-12 8-20 18z" fill="#2f9a52"/><rect y="120" width="200" height="80" fill="url(#${t})"/><path d="M20 140q15-5 30 0t30 0M100 165q15-5 30 0t30 0" stroke="#9eeaf8" stroke-width="3" fill="none"/><rect x="30" y="98" width="46" height="8" rx="3" fill="#fff"/><rect x="90" y="98" width="46" height="8" rx="3" fill="#fff"/><path d="M40 98l6-14M100 98l6-14" stroke="#e2483d" stroke-width="3"/>`);
      case "lounge": return wrap(lin(s, "#efe6da", "#ddd0bf"),
        `<rect width="200" height="200" fill="url(#${s})"/><rect x="30" y="30" width="54" height="40" fill="#f08a24" opacity=".8"/><rect x="96" y="22" width="40" height="52" fill="#3f6fd8" opacity=".55"/><rect x="18" y="104" width="150" height="48" rx="14" fill="#5e7f6e"/><rect x="18" y="92" width="150" height="26" rx="12" fill="#6e917f"/><rect x="26" y="150" width="6" height="20" fill="#3b2a1a"/><rect x="154" y="150" width="6" height="20" fill="#3b2a1a"/><rect y="170" width="200" height="30" fill="#b89c7a"/><ellipse cx="176" cy="96" rx="12" ry="22" fill="#4d8a4a"/><rect x="170" y="116" width="12" height="54" fill="#c48a5a"/>`);
      case "hearth": return wrap(lin(s, "#6b4a35", "#4a3123"),
        `<rect width="200" height="200" fill="url(#${s})"/><path d="M0 0h200v40H0z" fill="#3b261a"/><rect x="60" y="70" width="80" height="100" fill="#8a8178"/><rect x="74" y="100" width="52" height="70" fill="#1e1410"/><path d="M84 168q16-40 16-22 6-24 16 22z" fill="#f08a24"/><path d="M92 168q8-20 8-10 4-12 8 10z" fill="#ffd27a"/><rect x="10" y="130" width="40" height="40" rx="8" fill="#a3503a"/><rect y="170" width="200" height="30" fill="#2e1e15"/><rect x="150" y="110" width="40" height="60" fill="#d9c8a8"/>`);
    }
    return wrap("", '<rect width="200" height="200" fill="#ddd"/>');
  };

  // ---------------------------------------------------------------- copy (two passes through the loop)
  const SETS = [
    {
      collage: ["canal", "tram", "island", "sunset", "lighthouse", "tiles", "peaks"],
      phone: ["tram", "sunset", "canal", "island", "tiles", "lighthouse", "city", "balloon", "dunes", "peaks", "lake", "forest"],
      app: "WAYFOLD", title: "Where are you headed next?", cta: "SAVE TRIP",
      ideas: "Ideas", chips: ["Export itinerary to doc", "Share with travel group"],
      prompt: "Plan a 5-day trip to Lisbon for two.", action: "Plan",
      stayA: "Loft · Bairro Alto", stayB: "Casa Alfama · Sea view", price: "€149 / night", opts: ["1N", "2N", "3N", "4N", "5N"], badge: "3 nights for €390",
      imgsTop: ["lounge", "pool"], imgsLow: ["room", "pool"],
      blue: "Night picker is unclear", orange: "Surprise city tax", pink: "Should go to checkout",
      code: "Promo code or gift card", back: "Back to your stay", fee: "Service fee", tax: "Including €18.40 city tax",
      wish: "ADD TO WISHLIST", reserve: "RESERVE NOW", deal: ["STAY 3 NIGHTS", "AND SAVE 15%"],
    },
    {
      collage: ["peaks", "cabin", "lake", "forest", "balloon", "dunes", "city"],
      phone: ["cabin", "forest", "lake", "peaks", "balloon", "city", "dunes", "canal", "island", "sunset", "tram", "lighthouse"],
      app: "WAYFOLD", title: "Pick a weekend escape", cta: "SAVE TRIP",
      ideas: "Ideas", chips: ["Add packing list to doc", "Split costs in a sheet"],
      prompt: "Find a quiet cabin weekend near the Alps.", action: "Plan",
      stayA: "Larch Studio · Valley", stayB: "Pine Hollow Cabin", price: "€212 / night", opts: ["FRI", "SAT", "SUN", "MON"], badge: "2 nights for €399",
      imgsTop: ["hearth", "lounge"], imgsLow: ["hearth", "room"],
      blue: "Dates are hard to tap", orange: "Cleaning fee added late", pink: "Needs one clear CTA",
      code: "Promo code or gift card", back: "Back to your cabin", fee: "Cleaning fee", tax: "Including €35.00 cleaning fee",
      wish: "SAVE FOR LATER", reserve: "BOOK THIS CABIN", deal: ["LATE SUNDAY CHECKOUT", "ON THE HOUSE"],
    },
  ];

  const SCENE = {};
  SCENE.mount = function (stage) {
    // ============ paper backdrop: soft rings + blinking confetti squares
    const paper = el("div", "layer", stage); paper.id = "paper";
    const NS = "http://www.w3.org/2000/svg";
    const rings = document.createElementNS(NS, "svg"); rings.id = "rings"; rings.setAttribute("viewBox", "0 0 1920 1080"); paper.appendChild(rings);
    const ringEls = Array.from({ length: 7 }, () => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", 960); c.setAttribute("cy", 560); c.setAttribute("fill", "none"); c.setAttribute("stroke", "rgba(120,95,60,.06)"); c.setAttribute("stroke-width", 2);
      rings.appendChild(c); return c;
    });
    const BITS = 30;
    const bits = Array.from({ length: BITS }, () => el("div", "bit", paper));

    // ============ collage
    const collage = el("div", "layer", stage);
    const cam = el("div", "abs", collage); cam.style.width = "1920px"; cam.style.height = "1080px"; cam.style.transformOrigin = "960px 540px";
    // final layout (x, y, w, h) and the frame each postcard pops on
    const CT = [[489, 495, 261, 252, 0], [594, 219, 180, 176, 0], [726, 783, 156, 192, 2], [960, 714, 324, 363, 2], [860, 60, 200, 185, 4], [1140, 177, 234, 224, 4], [1203, 519, 261, 222, 5]];
    const ctiles = CT.map(() => el("div", "tile", cam));

    // ============ phone
    const phoneL = el("div", "layer", stage);
    const phone = el("div", "", phoneL); phone.id = "phone";
    const phoneCard = el("div", "", phone); phoneCard.id = "phoneCard";
    const phoneClip = el("div", "", phone); phoneClip.id = "phoneClip";
    const phTop = el("div", "ph-top", phoneClip);
    const phTitle = el("div", "ph-title", phoneClip);
    const phBar = el("div", "ph-bar", phoneClip,
      `<div class="ph-btn">${I.plus}</div><div class="ph-btn">${I.search}</div><div class="ph-cta">${I.bag}${I.arrow}<b class="ctaT"></b></div>`);
    // three masonry layouts the grid snaps between (x, y, w, h in card px; side columns run off the card)
    const PL = [
      [[-30, 190, 112, 200], [-30, 402, 112, 120], [-30, 534, 128, 150], [96, 178, 176, 168], [100, 358, 174, 150], [124, 520, 142, 160], [288, 164, 130, 216], [300, 392, 120, 118], [322, 522, 110, 160]],
      [[-20, 176, 118, 150], [-30, 338, 124, 196], [-24, 546, 118, 130], [104, 190, 170, 190], [96, 392, 186, 130], [110, 534, 150, 150], [296, 176, 120, 150], [282, 338, 140, 190], [306, 540, 120, 140]],
      [[-36, 200, 120, 130], [-26, 342, 118, 150], [-30, 504, 126, 178], [100, 172, 176, 150], [108, 334, 160, 196], [96, 542, 184, 140], [290, 168, 130, 180], [304, 360, 116, 170], [296, 542, 128, 140]],
    ];
    const ptiles = PL[0].map(() => el("div", "tile", phoneClip));

    // ============ prompt card
    const promptL = el("div", "layer", stage); promptL.id = "promptBg";
    const pcam = el("div", "", promptL); pcam.id = "pcam";
    const ideas = el("div", "", pcam); ideas.id = "ideas";
    const chip1 = el("div", "pchip", pcam); chip1.style.left = "246px";
    const chip2 = el("div", "pchip", pcam); chip2.id = "chip2"; chip2.style.left = "1032px"; chip2.style.width = "620px";
    const chev = el("div", "", pcam, I.chev); chev.id = "chev";
    const pcard = el("div", "", pcam); pcard.id = "pcard";
    const ptext = el("div", "", pcard); ptext.id = "ptext";
    const ptextT = el("span", "", ptext), caret = el("span", "caret", ptext);
    const pplus = el("div", "pfoot", pcard, I.plus); pplus.id = "pplus"; pplus.style.left = "50px"; pplus.style.top = "300px";
    const pmark = el("div", "pfoot", pcard); pmark.id = "pmark"; pmark.style.left = "150px"; pmark.style.top = "290px";
    const pact = el("div", "pfoot", pcard); pact.style.left = "1076px"; pact.style.top = "288px";
    const pmic = el("div", "pfoot", pcard, I.mic); pmic.id = "pmic"; pmic.style.left = "1230px"; pmic.style.top = "290px";
    const psend = el("div", "", pcard, I.up); psend.id = "psend";
    const bcur = el("div", "", promptL, CUR("#0b0b0b")); bcur.id = "bcur";
    // send button centre in prompt-world px (close-up zooms around it)
    const SEND = [213 + 1326 + 56, 468 + 264 + 54];

    // ============ audit strips
    const audit = el("div", "layer", stage); audit.id = "audit";
    const gridStrip = el("div", "strip", audit); gridStrip.id = "gridStrip";
    const gridC = el("div", "content", gridStrip);
    const darkStrip = el("div", "strip", audit); darkStrip.id = "darkStrip";
    const darkC = el("div", "content", darkStrip);
    const whiteStrip = el("div", "strip", audit); whiteStrip.id = "whiteStrip";
    const whiteC = el("div", "content", whiteStrip);
    const pillB = el("div", "pill", audit), curB = el("div", "ccur", audit, CUR("#1f6fe5"));
    const pillO = el("div", "pill", audit), curO = el("div", "ccur", audit, CUR("#f08a24"));
    const pillP = el("div", "pill", audit), curP = el("div", "ccur", audit, CUR("#d4148c"));
    pillB.style.background = "#1f6fe5"; pillO.style.background = "#f08a24"; pillP.style.background = "#d4148c";
    pillO.style.height = "54px"; pillO.style.borderRadius = "27px"; pillO.style.border = "2px solid #fff";
    pillP.style.height = "44px"; pillP.style.fontSize = "22px";

    // ============ end card
    const endc = el("div", "layer", stage); endc.id = "endc";
    const halo = el("div", "", endc); halo.id = "halo";
    const word = el("div", "", endc, "wayfold"); word.id = "word";

    // ---------------------------------------------------------------- per-pass content
    let builtSet = -1, pillW = [0, 0, 0], taxEl = null, priceEl = null;
    function build(si) {
      if (si === builtSet) return;
      builtSet = si;
      const S = SETS[si];
      gid = si * 1000;
      ctiles.forEach((t, i) => (t.innerHTML = art(S.collage[i])));
      phTop.innerHTML = `${I.back}<span>${S.app}</span><span class="sp"></span>${I.bell}${I.gear}`;
      phTitle.textContent = S.title;
      phBar.querySelector(".ctaT").textContent = S.cta;
      ideas.innerHTML = `${I.bulb}<span>${S.ideas}</span>`;
      chip1.innerHTML = `${I.doc}<span>${S.chips[0]}</span>`;
      chip2.innerHTML = `${I.sheet}<span>${S.chips[1]}</span>`;
      pmark.innerHTML = `${I.mark}<span>Wayfold</span>`;
      pact.textContent = S.action;

      // listing: two product columns, the left one cropped by the frame
      const col = (x, name, top, low, withOpts) => {
        let h = `<div class="pimg" style="left:${x}px;top:-40px;width:1000px;height:440px">${art(top)}</div>`;
        h += `<div class="plus" style="left:${x + 960}px;top:312px">${I.plus}</div>`;
        h += `<div class="pname" style="left:${x + 12}px;top:466px">${name}</div>`;
        if (withOpts) {
          h += `<div class="pprice" style="left:${x + 8}px;top:524px">${S.price}</div>`;
          h += `<div class="psizes" style="left:${x + 12}px;top:584px">${S.opts.map((o) => `<span>${o}</span>`).join("")}</div>`;
        } else {
          h += `<div class="pprice" style="left:${x + 8}px;top:524px">€168 / night</div>`;
          h += `<div class="psizes" style="left:${x + 12}px;top:584px"><span>1N</span><span>2N</span><span>3N</span></div>`;
        }
        h += `<div class="pbadge" style="left:${x}px;top:686px">${withOpts ? S.badge : "Breakfast included"}</div>`;
        h += `<div class="pimg" style="left:${x}px;top:752px;width:1000px;height:520px">${art(low)}</div>`;
        return h;
      };
      gridC.innerHTML = col(-150, S.stayA, S.imgsTop[0], S.imgsLow[0], false) + col(890, S.stayB, S.imgsTop[1], S.imgsLow[1], true);
      priceEl = gridC.querySelectorAll(".pprice")[1];

      darkC.innerHTML =
        `<div class="dk dk-in"></div><div class="dk dk-ph">${S.code}</div>` +
        `<div class="dk dk-back">${I.card}<span>${S.back}</span></div>` +
        `<div class="dk dk-row" style="top:340px">Subtotal</div>` +
        `<div class="dk dk-row" style="top:414px">${S.fee} ${I.help}</div>` +
        `<div class="dk dk-total">Total</div><div class="dk dk-tax">${S.tax}</div>` +
        `<div class="dk dk-help">HELP</div><div class="dk dk-cta"></div>`;
      taxEl = darkC.querySelector(".dk-tax");

      whiteC.innerHTML =
        `<div class="wh" style="left:106px;top:296px;font-size:25px;letter-spacing:.02em">${S.wish}</div>` +
        `<div class="wh" style="left:105px;top:360px;width:800px;height:78px;background:#141414"></div>` +
        `<div class="wh" style="left:105px;top:384px;width:620px;text-align:center;color:#fff;font-size:24px;letter-spacing:.02em">${S.reserve}</div>` +
        `<div class="wh" style="left:105px;top:500px;width:800px;height:175px;background:#9eae9c"></div>` +
        `<div class="wh" style="left:105px;top:552px;width:620px;text-align:center;color:#fff;font-size:24px;line-height:34px;letter-spacing:.02em">${S.deal[0]}<br>${S.deal[1]}</div>`;

      // measure the notes while the strip is laid out (render() sets the real visibility right after)
      audit.style.display = "block";
      [[pillB, S.blue], [pillO, S.orange], [pillP, S.pink]].forEach(([p, t], i) => {
        p.style.display = "block";
        p.innerHTML = `<span>${t}</span>`;
        pillW[i] = p.firstChild.offsetWidth + 44;
      });
    }

    // ---------------------------------------------------------------- confetti: each square blinks on for a few frames, then respawns elsewhere
    function paintPaper(f, gf) {
      ringEls.forEach((c, i) => c.setAttribute("r", 140 + i * 150 + ((gf * 0.6) % 150)));
      bits.forEach((b, i) => {
        const life = 7 + (i % 5) * 2, phase = (i * 5) % life;
        const cyc = Math.floor((gf + phase) / life), r = rng(i * 7919 + cyc * 104729);
        const onFrac = 0.65 + r() * 0.3, local = ((gf + phase) % life) / life;
        const x = r() * 1880 + 20, y = r() * 1040 + 20, sz = 12 + r() * 12, orange = r() < 0.72;
        b.style.display = local < onFrac ? "block" : "none";
        b.style.width = b.style.height = px(sz);
        b.style.background = orange ? (r() < 0.5 ? "#f4a53c" : "#f7b84a") : "#dcd7cf";
        b.style.transform = `translate(${px(x)}, ${px(y - local * 18)})`;
      });
    }

    // ---------------------------------------------------------------- render
    function render(gf) {
      gf += SUB;
      const f = gf;
      const inEnd = gf >= END;
      const si = gf < LOOP ? 0 : 1;
      const lf = inEnd ? 0 : gf - si * LOOP;
      build(si);
      const S = SETS[si];

      const sCollage = !inEnd && lf < 15, sPhone = !inEnd && lf >= 15 && lf < 63;
      const sPrompt = !inEnd && lf >= 63 && lf < 138, sAudit = !inEnd && lf >= 138;
      show(paper, sCollage || sPhone); show(collage, sCollage); show(phoneL, sPhone);
      show(promptL, sPrompt); show(audit, sAudit); show(endc, inEnd);
      if (sCollage || sPhone) paintPaper(lf, Math.floor(gf));

      // ---- collage: camera swings in from lower right while the postcards pop on
      if (sCollage) {
        const cx = keys(lf, [[0, 170], [2, 70], [5, 0], [15, -14]]), cy = keys(lf, [[0, 190], [2, 50], [5, 0], [15, -12]]);
        const cs = keys(lf, [[0, 0.8], [2, 0.92], [5, 1], [15, 1.035]]);
        cam.style.transform = `translate(${px(cx)}, ${px(cy)}) scale(${cs.toFixed(4)})`;
        ctiles.forEach((t, i) => {
          const [x, y, w, h, a] = CT[i];
          const on = lf >= a;
          t.style.display = on ? "block" : "none";
          if (!on) return;
          const s = keys(lf, [[a, 0.55], [a + 1, 1.06], [a + 2.5, 0.99], [a + 4, 1]]);
          // each card keeps a slight float of its own
          const fx = Math.sin(lf * 0.21 + i * 1.7) * 3, fy = Math.cos(lf * 0.17 + i) * 3;
          place(t, x, y, w, h);
          t.style.transform = `translate(${px(fx)}, ${px(fy)}) scale(${s.toFixed(4)})`;
        });
      }

      // ---- phone: big "type shift" jump, then the card settles and the grid reshuffles
      if (sPhone) {
        const s = keys(lf, [[15, 1.62], [16.5, 1.58], [17, 1.14], [21, 1.06], [22, 1.0], [63, 0.985]]);
        const tx = keys(lf, [[15, 150], [16.5, 140], [17, 0], [63, 6]]), ty = keys(lf, [[15, 70], [16.5, 64], [17, 0], [63, -10]]);
        phone.style.transform = `translate(${px(tx)}, ${px(ty)}) scale(${s.toFixed(4)})`;
        const cardOn = lf >= 22;
        phoneCard.style.opacity = cardOn ? 1 : 0;
        phoneClip.style.overflow = cardOn ? "hidden" : "visible";
        phTop.style.opacity = phTitle.style.opacity = lf >= 15 ? 1 : 0;
        phBar.style.opacity = lf >= 17 ? 1 : 0;
        const li = lf < 29 ? 0 : lf < 45 ? 1 : 2;
        const shift = li * 4;
        ptiles.forEach((t, i) => {
          const [x, y, w, h] = PL[li][i];
          place(t, x, y, w, h);
          const key = S.phone[(i + shift) % S.phone.length];
          if (t.dataset.k !== key + si) { t.dataset.k = key + si; t.innerHTML = art(key); }
          // tiles land a frame apart after each shuffle
          const since = lf - (li === 0 ? 15 : li === 1 ? 29 : 45);
          const pop = keys(since - (i % 3) * 0.5, [[0, 0.9], [1.5, 1.03], [3, 1]]);
          t.style.transform = `scale(${pop.toFixed(4)})`;
        });
      }

      // ---- prompt card typing, then the send-button close-up
      if (sPrompt) {
        const full = S.prompt;
        const n = Math.round(keys(lf, [[63, 15], [92, full.length]]));
        ptextT.textContent = full.slice(0, clamp(n, 0, full.length));
        let s, tx, ty;
        if (lf < 97) {
          s = keys(lf, [[63, 1], [97, 1.025]]);
          tx = 960 - s * 960 + keys(lf, [[63, 0], [97, -6]]); ty = 560 - s * 560 + keys(lf, [[63, 0], [97, -4]]);
          caret.style.opacity = 1;
          show(bcur, false);
        } else {
          s = keys(lf, [[97, 1.6], [138, 1.62]]);
          const ax = keys(lf, [[97, 1030], [100, 1002], [106, 984], [138, 972]]), ay = keys(lf, [[97, 562], [106, 545], [138, 549]]);
          tx = ax - s * SEND[0]; ty = ay - s * SEND[1];
          caret.style.opacity = Math.floor((lf - 97) / 8) % 2 ? 0 : 1;
          // cursor rises from below and parks on the button's lower-left corner
          const cx = keys(lf, [[97, 600], [99, 700], [104, 842], [108, 884], [138, 892]]);
          const cy = keys(lf, [[97, 830], [99, 760], [104, 664], [108, 640], [122, 646], [138, 642]]);
          show(bcur, true);
          bcur.style.transform = `translate(${px(cx - 10)}, ${px(cy - 6)}) rotate(28deg)`;
          bcur.style.transformOrigin = "0 0";
        }
        pcam.style.transform = `translate(${px(tx)}, ${px(ty)}) scale(${s.toFixed(4)})`;
        // press: black → brown → orange
        const c1 = mix("#0b0b0b", "#5b3a12", (lf - 106) / 4), c2 = mix("#5b3a12", "#e8930c", (lf - 115) / 3);
        psend.style.background = lf < 115 ? c1 : c2;
        psend.style.transform = `scale(${keys(lf, [[105, 1], [107, 0.94], [111, 0.97], [116, 1.02], [119, 1]]).toFixed(4)})`;
      }

      // ---- audit strips: listing, then dark checkout and white panel push in from the left
      if (sAudit) {
        // dark strip left/right edges, white strip right edge, listing shift
        const push1 = [[183, 0], [184, 0.26], [186, 0.73], [188, 0.94], [190, 0.99], [194, 1]];
        const push2 = [[224, 0], [225, 0.26], [227, 0.73], [229, 0.94], [231, 0.99], [235, 1]];
        const p1 = keys(lf, push1), p2 = keys(lf, push2);
        const dL = lerp(-950, 0, p1) + 640 * p2, dR = lerp(0, 950, p1) + 328 * p2;
        const wR = 640 * p2;
        const gShift = 485 * p1 + 151 * p2;
        const gy = keys(lf, [[138, -140], [139, -32], [141, -9], [146, 0], [270, 6]]);

        gridStrip.style.left = px(dR); gridStrip.style.width = px(1920 - dR);
        gridC.style.transform = `translate(${px(gShift - dR)}, ${px(gy)})`;
        darkStrip.style.left = px(dL); darkStrip.style.width = px(Math.max(0, dR - dL));
        const dcx = lerp(360, 267, p2) + (dL < 0 ? 0 : 0);
        darkC.style.transform = `translate(${px(dcx)}, 0px)`;
        whiteStrip.style.left = "0px"; whiteStrip.style.width = px(wR);
        whiteC.style.transform = `translate(${px(wR - 640)}, 0px)`;
        show(darkStrip, lf >= 183); show(whiteStrip, lf >= 224);

        // the price tag gets a soft blue select once the blue note lands
        priceEl.style.background = lf >= 160 ? "rgba(31,111,229,.13)" : "transparent";
        priceEl.style.color = lf >= 160 ? "#1f6fe5" : "#8a8a8a";

        // blue cursor + note (attached to the listing)
        const bx = gShift + keys(lf, [[139, -260], [142, -80], [146, -8], [150, 0]]) + 1024 + Math.sin(lf * 0.3) * 2;
        const by = gy + keys(lf, [[139, 300], [142, 90], [146, 10], [150, 0]]) + 588 + Math.cos(lf * 0.27) * 2;
        cursor(curB, pillB, lf >= 139, bx, by, bx + 34, by + 40, pillW[0] * keys(lf, [[141, 0], [146, 0.18], [152, 0.62], [160, 1]]));

        // orange cursor + note (attached to the dark panel)
        const ox = dL + dcx + 128 + keys(lf, [[190, -260], [193, -50], [197, 0]]) + Math.sin(lf * 0.25 + 1) * 2;
        const oy = keys(lf, [[190, 900], [193, 712], [197, 676], [270, 672]]);
        const ow = pillW[1] * keys(lf, [[195, 0], [199, 0.2], [205, 0.66], [212, 1]]);
        cursor(curO, pillO, lf >= 190, ox, oy, ox - 340, oy + 52, ow);
        const hl = keys(lf, [[205, 0], [213, 1]]);
        taxEl.style.background = `linear-gradient(90deg, rgba(240,138,36,.28) ${(hl * 100).toFixed(1)}%, transparent ${(hl * 100).toFixed(1)}%)`;
        taxEl.style.color = mix("#6c6c6c", "#d9813a", hl);

        // pink cursor + note (attached to the white panel)
        const kx = wR - 640 + 300 + keys(lf, [[226, -200], [229, -40], [233, 0]]) + Math.sin(lf * 0.3 + 2) * 2;
        const ky = keys(lf, [[226, 880], [229, 720], [233, 690], [270, 688]]);
        cursor(curP, pillP, lf >= 226, kx, ky, kx + 12, ky + 40, pillW[2] * keys(lf, [[231, 0], [235, 0.2], [240, 0.66], [247, 1]]));
      }

      // ---- end card
      if (inEnd) {
        const s = keys(f, [[539, 1.1], [541, 1], [588, 0.92], [594, 0.82], [598, 0.7], [602, 0.6]]);
        word.style.transform = `translate(-50%, -52%) scale(${s.toFixed(4)})`;
        word.style.filter = `blur(${keys(f, [[539, 6], [541.5, 0]]).toFixed(2)}px)`;
        halo.style.transform = `scale(${s.toFixed(4)})`;
        halo.style.opacity = keys(f, [[539, 0], [542, 1]]);
      }
    }

    function cursor(cur, pill, on, x, y, pxl, pyl, w) {
      show(cur, on);
      if (!on) { show(pill, false); return; }
      cur.style.transform = `translate(${px(x)}, ${px(y)})`;
      show(pill, w > 2);
      const h = parseFloat(pill.style.height) || 50;
      pill.style.width = px(Math.max(h, w));
      pill.style.transform = `translate(${px(pxl)}, ${px(pyl)})`;
      pill.firstChild.style.opacity = w > h * 1.2 ? 1 : 0;
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { builtSet = -1; render(R0._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
