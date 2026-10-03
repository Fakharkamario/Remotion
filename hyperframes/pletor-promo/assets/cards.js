// Stylised stand-ins for the product / campaign photos in the reference video.
// Each art is an SVG drawn in a 200x250 box and cropped with "slice", so any
// card size works. Swap a card for a real photo by giving it an `img` field.
(function () {
  const NAVY = "#1d2a6b";
  const SKIN = "#e9c2a4";

  // Simple poseable figure. (x, y) is the top of the head.
  function figure(x, y, s, o) {
    const top = o.top || NAVY;
    const legs = o.legs || NAVY;
    const pose = o.pose || "stand";
    const w = 13 * s;
    const head = `<circle cx="${x}" cy="${y + 9 * s}" r="${9 * s}" fill="${o.skin || SKIN}"/>
      <path d="M${x - 9 * s} ${y + 7 * s} q${9 * s} -${12 * s} ${18 * s} 0" fill="${o.hair || "#2b1d16"}"/>`;
    const torso = `<rect x="${x - 12 * s}" y="${y + 19 * s}" width="${24 * s}" height="${34 * s}" rx="${8 * s}" fill="${top}"/>`;
    const limb = (x1, y1, x2, y2, c) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w * 0.62}" stroke-linecap="round"/>`;
    const sy = y + 24 * s;
    const hy = y + 52 * s;
    let arms;
    let legsSvg;
    if (pose === "star") {
      arms = limb(x - 9 * s, sy, x - 38 * s, sy - 26 * s, top) + limb(x + 9 * s, sy, x + 38 * s, sy - 26 * s, top);
      legsSvg = limb(x - 6 * s, hy, x - 30 * s, hy + 46 * s, legs) + limb(x + 6 * s, hy, x + 30 * s, hy + 46 * s, legs);
    } else if (pose === "run") {
      arms = limb(x - 9 * s, sy, x - 30 * s, sy + 18 * s, top) + limb(x + 9 * s, sy, x + 26 * s, sy - 16 * s, top);
      legsSvg = limb(x - 5 * s, hy, x - 30 * s, hy + 36 * s, legs) + limb(x + 5 * s, hy, x + 22 * s, hy + 26 * s, legs) +
        limb(x + 22 * s, hy + 26 * s, x + 16 * s, hy + 50 * s, legs);
    } else if (pose === "jump") {
      arms = limb(x - 9 * s, sy, x - 34 * s, sy - 30 * s, top) + limb(x + 9 * s, sy, x + 34 * s, sy - 30 * s, top);
      legsSvg = limb(x - 6 * s, hy, x - 34 * s, hy + 22 * s, legs) + limb(x + 6 * s, hy, x + 34 * s, hy + 22 * s, legs);
    } else {
      arms = limb(x - 11 * s, sy, x - 16 * s, sy + 32 * s, top) + limb(x + 11 * s, sy, x + 16 * s, sy + 32 * s, top);
      legsSvg = limb(x - 6 * s, hy, x - 8 * s, hy + 50 * s, legs) + limb(x + 6 * s, hy, x + 8 * s, hy + 50 * s, legs);
    }
    return legsSvg + arms + torso + head;
  }

  function flower(cx, cy, r, color, center) {
    let p = "";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      p += `<circle cx="${cx + Math.cos(a) * r * 0.62}" cy="${cy + Math.sin(a) * r * 0.62}" r="${r * 0.5}" fill="${color}"/>`;
    }
    return p + `<circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="${center || color}"/>`;
  }

  function tee(x, y, s, fill, icon) {
    return `<line x1="${x}" y1="${y - 14 * s}" x2="${x}" y2="${y}" stroke="#ccc" stroke-width="2"/>
      <path d="M${x - 14 * s} ${y} l-22 ${12 * s} l8 ${18 * s} l10 -4 v${62 * s} h${36 * s + 0} v-${62 * s} l10 4 l8 -${18 * s} l-22 -${12 * s} q-14 ${10 * s} -28 0z"
        transform="translate(${-4 * s} 0)" fill="${fill}"/>
      ${figure(x - 2 * s, y + 18 * s, 0.42 * s, { top: icon, legs: icon, skin: icon, hair: icon, pose: "run" })}`;
  }

  function words(lines, x, y, size, color, weight) {
    return lines
      .map((l, i) => `<text x="${x}" y="${y + i * size * 0.95}" font-family="Inter, sans-serif" font-weight="${weight || 900}"
        font-size="${size}" fill="${color}" letter-spacing="-1">${l}</text>`)
      .join("");
  }

  const svg = (bg, body) =>
    `<svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${bg}${body}</svg>`;
  const grad = (id, a, b, vertical) =>
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="200" height="250" fill="url(#${id})"/>`;

  const ARTS = {
    pinkJump: (k) => svg(grad(`g${k}`, "#e8357a", "#c71f63", true),
      figure(100, 40, 1.6, { top: NAVY, legs: NAVY, pose: "jump" }) + flower(88, 110, 7, "#3fa9f5") + flower(116, 92, 6, "#3fa9f5")),
    tees: (k) => svg(grad(`g${k}`, "#e0428a", "#c9276f", true),
      `<line x1="10" y1="56" x2="190" y2="56" stroke="#f3b6cf" stroke-width="3"/>` +
      tee(62, 70, 1, "#f7f5f2", "#2d49c8") + tee(138, 70, 1, "#f7f5f2", "#2d49c8")),
    blueRun: (k) => svg(grad(`g${k}`, "#2a4fd0", "#1a34a0", true),
      figure(100, 50, 1.55, { top: "#f2efe6", legs: "#22305e", pose: "run" })),
    portrait: (k) => svg(grad(`g${k}`, "#d9d3c6", "#a9a294", true),
      `<rect x="20" y="150" width="160" height="120" rx="40" fill="#1e2b55"/>
       <path d="M76 150 l24 40 l24 -40" fill="#f2efe6"/>
       ${flower(52, 182, 9, "#4fb3f0")}${flower(150, 176, 8, "#4fb3f0")}
       <rect x="86" y="118" width="28" height="40" fill="${SKIN}"/>
       <ellipse cx="100" cy="92" rx="36" ry="44" fill="${SKIN}"/>
       <path d="M62 86 q4 -52 44 -50 q34 2 34 44 q-6 -22 -30 -26 q-30 -2 -48 32z" fill="#7a4a2c"/>
       <circle cx="86" cy="96" r="3" fill="#2b1d16"/><circle cx="114" cy="96" r="3" fill="#2b1d16"/>
       <path d="M90 120 q10 6 20 0" stroke="#a5644a" stroke-width="3" fill="none"/>`),
    flowerSky: (k) => svg(grad(`g${k}`, "#1b5fe0", "#45c0f2", true),
      `<path d="M0 170 q100 -40 200 -10 v90 h-200z" fill="#e8327c"/>` + flower(118, 92, 46, "#3ea6f4", "#2a8de0") +
      words(["FAMOUS", "LAST", "WORDS"], 12, 200, 16, "#ffd2e4")),
    firstDay: (k) => svg(`<rect width="200" height="250" fill="#141414"/>`,
      words(["FIRST DAY", "AGAIN."], 12, 46, 34, "#fff") +
      `<rect x="44" y="150" width="112" height="120" rx="44" fill="#e8418d"/>` + flower(100, 196, 24, "#f7c7dc", "#f4a7c8") +
      `<rect x="88" y="128" width="24" height="28" fill="${SKIN}"/><ellipse cx="100" cy="114" rx="24" ry="28" fill="${SKIN}"/>
       <path d="M74 112 q0 -38 26 -38 q28 0 28 40 l-6 30 q2 -36 -22 -40 q-24 4 -20 40z" fill="#2b1d16"/>`),
    skyStar: (k) => svg(grad(`g${k}`, "#8ccbee", "#d6eef9", true),
      figure(100, 52, 1.45, { top: "#2c3a72", legs: "#2c3a72", pose: "star" }) + flower(96, 106, 6, "#5fb8f0")),
    green: (k) => svg(grad(`g${k}`, "#2f7048", "#235837", true),
      `<rect x="86" y="18" width="28" height="12" rx="2" fill="#f2efe6"/>` +
      [[46, 70], [150, 92], [70, 160], [140, 196], [36, 214], [108, 126]].map(([x, y]) => flower(x, y, 14, "#9ad39a", "#7cc07e")).join("") +
      `<line x1="100" y1="34" x2="100" y2="250" stroke="#1d4a2e" stroke-width="3"/>
       ${[60, 100, 140, 180, 220].map((y) => `<circle cx="100" cy="${y}" r="4" fill="#e8e2cc"/>`).join("")}`),
    notGoing: (k) => svg(`<rect width="200" height="250" fill="#f4c22f"/>`,
      words(["NOT GOING", "BACK TO", "ANYTHING"], 12, 44, 27, "#e8327c") +
      `<ellipse cx="104" cy="214" rx="64" ry="60" fill="#ea5b9a"/>` + flower(104, 206, 22, "#f6c9dc")),
    greenOne: (k) => svg(grad(`g${k}`, "#e3468a", "#c7316f", true),
      words(["GREEN", "ONE.", "NOW"], 14, 50, 36, "#fff") + figure(140, 120, 1.05, { top: "#2f7a4a", legs: "#203a6b" })),
    street: (k) => svg(grad(`g${k}`, "#c89a76", "#5d4b45", true),
      `<rect x="0" y="0" width="60" height="250" fill="#8a6a55" opacity=".5"/><rect x="150" y="20" width="50" height="230" fill="#3f3330" opacity=".5"/>` +
      figure(78, 70, 1.15, { top: "#e8418d", legs: "#2b2b3a", hair: "#a3401f" }) + figure(128, 64, 1.2, { top: "#1e2b55", legs: "#20202a" })),
    runners: (k) => svg(`<rect width="200" height="250" fill="#1f3fb8"/><rect x="12" y="12" width="176" height="226" rx="6" fill="#f7f5f2"/>`,
      [0, 1, 2].map((r) => [0, 1, 2].map((c) =>
        figure(46 + c * 54, 30 + r * 56, 0.42, { top: "#2d49c8", legs: "#2d49c8", skin: "#2d49c8", hair: "#2d49c8", pose: r % 2 ? "run" : "star" })).join("")).join("") +
      words(["RUN WITH IT"], 34, 222, 18, "#2d49c8")),
    laundry: (k) => svg(grad(`g${k}`, "#ece6d2", "#c9c2aa", true),
      `<rect x="14" y="120" width="80" height="120" rx="8" fill="#f4f1e6" stroke="#bdb59c" stroke-width="3"/>
       <circle cx="54" cy="184" r="28" fill="#9fb4bb" stroke="#8a8f8a" stroke-width="5"/>` +
      figure(138, 70, 1.25, { top: "#1e2b55", legs: "#1e2b55", hair: "#a3401f" }) + flower(132, 106, 7, "#e8418d")),
    hoodie: (k) => svg(grad(`g${k}`, "#f6d3de", "#eaa9c1", true),
      `<rect x="34" y="128" width="132" height="140" rx="50" fill="#e8418d"/>` + flower(100, 190, 28, "#fbe1ec", "#f4a7c8") +
      `<rect x="88" y="104" width="24" height="30" fill="${SKIN}"/><ellipse cx="100" cy="88" rx="26" ry="30" fill="${SKIN}"/>
       <path d="M72 88 q0 -42 28 -42 q30 0 30 42 q-6 -26 -30 -28 q-22 2 -28 28z" fill="#3a2418"/>`),
  };

  // Card art is a picture, not copy: emit it as an <img> so layout/contrast
  // checks treat it like the photos it stands in for.
  let counter = 0;
  function cardArt(key) {
    const markup = ARTS[key](`${key}${counter++}`);
    return `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}"/>`;
  }

  // Deterministic PRNG (mulberry32) so every render is identical.
  function prng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A card centred on its transform origin. twoSided adds an unmirrored back face
  // for cards that spin past 90deg; placeholder adds a pastel overlay to fade out.
  function makeCard(parent, art, w, h, opts) {
    const o = opts || {};
    const el = document.createElement("div");
    el.className = "card";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.style.marginLeft = -w / 2 + "px";
    el.style.marginTop = -h / 2 + "px";
    const ph = o.placeholder ? `<div class="ph" style="background:${o.placeholder}"></div>` : "";
    let html = `<div class="face">${cardArt(art)}${ph}</div>`;
    if (o.twoSided) html += `<div class="face back">${cardArt(art)}</div>`;
    el.innerHTML = html;
    parent.appendChild(el);
    return el;
  }

  window.PletorCards = { keys: Object.keys(ARTS), makeCard, prng };
})();
