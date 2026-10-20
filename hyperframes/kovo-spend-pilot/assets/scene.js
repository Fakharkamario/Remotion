// Kovo Spend Pilot — 47 s promo, 30 fps, 1410 frames. Shot timing and camera moves follow a reference edit;
// the brand, mascot, UI and copy are all new.
//   0–40       kovo logo; the coin dot drops out of the mark and rolls away
//   40–140     "Meet Kovo" / "Spend Pilot", coin-bots float in, a giant bot rises under the title
//   140–231    camera rises: the bot turns to camera, coins and receipts burst out, rings, white-out
//   231–355    vendor table: extreme close-up on a "Card" cell, whip back, statuses light up
//   355–463    dashboard close-up, the whole app on the sky, then a table close-up with a cursor
//   463–627    graph: a card connects out to Vendors and Budgets, groups open and fill
//   627–730    a detail panel slides in, the page pulls back into a window and tips away
//   730–834    a chat app: someone asks to book first-class flights; the purchase is paused
//   834–954    the activity page in Kovo: the risky words go red, scroll down to "Blocked"
//   954–1067   a spend-alerts card on the sky with coin-bots, then a close pan over its table
//   1067–1160  "Control spending" + "before the card is charged", hills and bots rise
//   1160–1243  the card's header: Critical → High → Medium → Low → Approved
//   1243–1340  "Get started at kovo.app/spend-pilot"
//   1340–1410  a bot flies into the mark and the logo builds
(function () {
  const FPS = 30, FRAMES = 1410, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const sm = (t) => (t = clamp(t, 0, 1), t * t * (3 - 2 * t));
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); t = clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  // monotone cubic through [frame, value] keys (Fritsch–Carlson): eases like graph-editor curves, never overshoots
  const slope = (p, i) => (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
  const tan = (p, k) => {
    const n = p.length;
    if (k === 0) return n > 1 ? slope(p, 0) * 0 : 0;
    if (k === n - 1) return 0;
    const d0 = slope(p, k - 1), d1 = slope(p, k);
    if (d0 * d1 <= 0) return 0;
    const h0 = p[k][0] - p[k - 1][0], h1 = p[k + 1][0] - p[k][0], w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const keys = (f, p) => {
    if (f <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (f <= p[i][0]) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], h = x1 - x0, t = (f - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * tan(p, i - 1) + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * tan(p, i);
    }
    return p[p.length - 1][1];
  };
  // linear keys (for measured paths that should keep their speed through the points)
  const lin = (f, p) => {
    if (f <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (f <= p[i][0]) return lerp(p[i - 1][1], p[i][1], (f - p[i - 1][0]) / (p[i][0] - p[i - 1][0]));
    return p[p.length - 1][1];
  };
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const show = (e, on) => { e.style.display = on ? e.dataset.disp || "block" : "none"; return on; };

  const ICON = {
    card: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 14.5h4"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    repeat: '<path d="M4 11a6 6 0 016-6h8M15 2l3 3-3 3M20 13a6 6 0 01-6 6H6M9 22l-3-3 3-3"/>',
    plane: '<path d="M3 13.5l18-7.5-5.5 15-3.5-5.5z"/><path d="M12 15.5l9-9.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    stack: '<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 01-.5-9A6 6 0 0118 8.5a4.8 4.8 0 01-1 9.5z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5c.8-4 3.6-6 7-6s6.2 2 7 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    clip: '<path d="M20 11l-8 8a5 5 0 01-7-7l8-8a3.4 3.4 0 015 5l-8 8a1.8 1.8 0 01-2.6-2.6L15 7"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    sort: '<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    cols: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M10 4v16"/>',
    spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20.5h4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    store: '<path d="M4 9l1.5-5h13L20 9v11H4z"/><path d="M4 9h16M9 20v-6h6v6"/>',
    team: '<circle cx="9" cy="9" r="3.2"/><circle cx="16.5" cy="10" r="2.6"/><path d="M3 19c.6-3.4 3-5 6-5s5.4 1.6 6 5M14.5 14.6c2.6-.4 5.6.8 6.5 4.4"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
    tool: '<path d="M14.5 5.5a4 4 0 00-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5L16 12l-4-4z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    fwd: '<path d="M9 5l7 7-7 7"/>',
    reload: '<path d="M19 12a7 7 0 11-2-5M19 4v4h-4"/>',
  };
  const ic = (n, stroke = "currentColor", sw = 1.9) => `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
  const vic = (n, col, size = 44) => `<span class="ico" style="width:${size}px;height:${size}px;background:${col}1f;color:${col}">${ic(n, col, 2)}</span>`;

  // the Kovo mark: six rounded bars around a coin dot (the dot is what drops out and flies back in)
  const MARK = (dotId) => {
    let bars = "";
    for (let i = 0; i < 6; i++) bars += `<rect class="bar" x="-7" y="-46" width="14" height="25" rx="7" transform="rotate(${i * 60 + 30})"/>`;
    return `<svg viewBox="-50 -50 100 100"><g class="bars" fill="#fff">${bars}</g><circle ${dotId ? `id="${dotId}"` : ""} r="12" fill="#fff"/></svg>`;
  };

  // ---------- data ----------
  const ROWS = [
    { name: "Brightline Cloud", sub: "Infrastructure", ic: "sun", col: "#ef7d2d", tags: ["new"], cat: "Card", cic: "card", owner: "Mia J", risk: ["Critical", "crit"], st: "Unreviewed", al: ["H", "5", "12"], sp: "$48.2K" },
    { name: "Orbit Travel", sub: "Travel agency", ic: "plane", col: "#2f73e0", tags: ["off"], cat: "Card", cic: "card", owner: "Jamie G", risk: ["Critical", "crit"], st: "Unreviewed", al: ["H", "6", "12"], sp: "$61.4K" },
    { name: "Quarry Data", sub: "Analytics", ic: "stack", col: "#e14a4f", tags: ["globe", "clip", "new"], cat: "Card", cic: "card", owner: "Liam K", risk: ["High", "high"], st: "Approved", al: ["M", "41", "95"], sp: "$27.0K" },
    { name: "PRINTHAUS_EU", sub: "Print vendor", ic: "printer", col: "#11a596", tags: [], cat: "Invoice", cic: "doc", owner: "Ava M", risk: ["Medium", "med"], st: "Unapproved", al: ["H", "3", "9"], sp: "$9.8K" },
    { name: "Nimbus CRM", sub: "Software seats", ic: "cloud", col: "#7c5ce6", tags: [], cat: "Subscription", cic: "repeat", owner: "Noah S", risk: ["Medium", "med"], st: "Unreviewed", al: ["M", "2", "9"], sp: "$14.1K" },
    { name: "Lattice Ads", sub: "Ad network", ic: "grid", col: "#e04b97", tags: [], cat: "Card", cic: "card", owner: "Zoe T", risk: ["Medium", "med"], st: "Unreviewed", al: ["M", "1", "4"], sp: "$33.6K" },
  ];
  // table column x (inside the table box)
  const TC = { name: 24, cat: 420, owner: 640, risk: 820, st: 970, al: 1180, sp: 1340 };
  const ROWH = 76;

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const abs = (e, x, y, w, h) => { e.style.left = x + "px"; e.style.top = y + "px"; if (w != null) e.style.width = w + "px"; if (h != null) e.style.height = h + "px"; return e; };
    const shot = () => { const s = el("div", "shot", stage); const w = el("div", "world", s); return { s, w }; };
    // camera: (fx, fy) is the world point at screen centre; pre is an optional 3D prefix applied about screen centre
    const cam = (w, fx, fy, s, pre = "") => { w.style.transform = `translate(960px,540px) ${pre} scale(${s.toFixed(5)}) translate(${px(-fx)},${px(-fy)})`; };
    let uid = 0;

    // ---------- sky ----------
    const sky = el("div", "", stage); sky.id = "sky";
    const clouds = el("canvas", "", stage); clouds.id = "clouds"; clouds.width = 1300; clouds.height = 540;
    {
      const c = clouds.getContext("2d"), r = rng(7);
      c.filter = "blur(10px)";
      for (let i = 0; i < 46; i++) {
        const x = r() * 1300, y = 40 + r() * 330, w = 90 + r() * 260, h = 6 + r() * 16;
        c.fillStyle = `rgba(255,255,255,${(0.05 + r() * 0.1).toFixed(3)})`;
        c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
      }
    }
    const SKY = {
      a: ["#0a1233", "#1a2e78", "#2f66bb", "#7fd0d2"],
      b: ["#0a1233", "#1b3792", "#2f7ad8", "#86c9ff"],
      w: ["#a8dcff", "#cdeeff", "#ecf9ff", "#ffffff"],
      c: ["#0c1540", "#21409c", "#3b86da", "#a9dcff"],
      d: ["#0a1233", "#1c3384", "#3471c8", "#88d6cf"],
    };
    const skyMix = (A, B, t) => A.map((c, i) => mix(c, B[i], t));
    const setSky = (cs) => { sky.style.background = `linear-gradient(180deg, ${cs[0]} 0%, ${cs[1]} 38%, ${cs[2]} 72%, ${cs[3]} 100%)`; };
    const wash = el("div", "", stage); wash.id = "wash";

    // ---------- coin-bot mascot ----------
    // a cream coin body with a gold rim, a navy visor with two mint eyes; yaw turns the visor around the sphere
    function makeBot(parent, d) {
      const id = "b" + (uid++);
      const e = el("div", "bot", parent);
      e.innerHTML = `<svg viewBox="-100 -100 200 200"><defs>
        <radialGradient id="${id}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fffdf6"/><stop offset=".55" stop-color="#f6ecd0"/><stop offset=".85" stop-color="#e3c98a"/><stop offset="1" stop-color="#c9a24c"/></radialGradient>
        <linearGradient id="${id}v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d5fb0"/><stop offset=".6" stop-color="#0f2f6b"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient>
        <clipPath id="${id}c"><circle r="93"/></clipPath></defs>
        <circle r="94" fill="url(#${id}g)" stroke="#d6ad4f" stroke-width="5"/>
        <g clip-path="url(#${id}c)">
          <ellipse class="band" cx="0" cy="0" rx="94" ry="20" fill="none" stroke="#d9bd78" stroke-width="3" opacity=".55"/>
          <g class="vis"><rect x="-58" y="-36" width="116" height="72" rx="34" fill="url(#${id}v)" stroke="#e8d39b" stroke-width="5"/>
            <rect class="e1" x="-29" y="-15" width="15" height="28" rx="7.5" fill="#7af5cb"/><rect class="e2" x="14" y="-15" width="15" height="28" rx="7.5" fill="#7af5cb"/>
            <path d="M-46 -20 q10 -12 26 -12" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/></g>
          <g class="ant"><rect x="-8" y="-104" width="16" height="16" rx="5" fill="#f2c45a"/></g>
        </g>
        <ellipse cx="-38" cy="-52" rx="24" ry="12" fill="#fff" opacity=".7" transform="rotate(-32 -38 -52)"/>
      </svg>`;
      const vis = e.querySelector(".vis"), band = e.querySelector(".band"), ant = e.querySelector(".ant");
      const api = {
        e,
        // x, y: centre (px); d: diameter; yaw (deg, 0 = facing camera); pitch (-1..1, + looks down)
        set(x, y, dd, yaw = 0, pitch = 0, o = {}) {
          e.style.width = e.style.height = px(dd);
          e.style.transform = `translate(${px(x - dd / 2)},${px(y - dd / 2)}) rotate(${(o.rot || 0).toFixed(2)}deg)`;
          e.style.opacity = o.alpha ?? 1;
          e.style.filter = [o.blur > 0.05 ? blurOf(o.blur) : "", o.glow ? `drop-shadow(0 0 ${px(o.glow)} rgba(255,236,190,.85))` : "", o.bright ? `brightness(${o.bright.toFixed(3)})` : ""].join(" ").trim() || "none";
          const a = (yaw * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
          const vy = pitch * 62;
          vis.setAttribute("transform", `translate(${(s * 66).toFixed(2)},${vy.toFixed(2)}) scale(${Math.max(0.02, c * (1 - 0.25 * Math.abs(pitch))).toFixed(4)},${(1 - 0.3 * Math.abs(pitch)).toFixed(4)})`);
          vis.setAttribute("opacity", clamp(c * 5, 0, 1).toFixed(3));
          band.setAttribute("cy", (vy * 0.9 + 40).toFixed(2));
          band.setAttribute("ry", (14 + 12 * Math.abs(pitch)).toFixed(2));
          ant.setAttribute("transform", `translate(${(s * 30).toFixed(2)},${(-pitch * 20).toFixed(2)})`);
          ant.setAttribute("opacity", (0.4 + 0.6 * Math.abs(c)).toFixed(3));
        },
      };
      if (d) api.set(0, 0, d);
      return api;
    }

    // ---------- landscape: layered hills with coin-stack pillars ----------
    const landWrap = el("div", "layer", stage);
    landWrap.innerHTML = `<svg id="land" viewBox="0 0 2120 520"></svg>`;
    const land = landWrap.querySelector("#land");
    {
      const r = rng(31);
      const hill = (base, amp, n, col, seed) => {
        const rr = rng(seed); let d = `M0 520 L0 ${base}`;
        const pts = []; for (let i = 0; i <= n; i++) pts.push([(i / n) * 2120, base - amp * (0.35 + 0.65 * rr())]);
        for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += ` Q${x0.toFixed(0)} ${y0.toFixed(0)} ${mx.toFixed(0)} ${((y0 + y1) / 2).toFixed(0)}`; }
        return `<path d="${d} L2120 ${base} L2120 520Z" fill="${col}"/>`;
      };
      const stack = (x, y, s) => {
        let g = ""; const n = 2 + Math.floor(r() * 4);
        for (let k = n - 1; k >= 0; k--) {
          const cy = y - k * 13 * s;
          g += `<rect x="${(x - 22 * s).toFixed(1)}" y="${cy.toFixed(1)}" width="${(44 * s).toFixed(1)}" height="${(13 * s).toFixed(1)}" fill="#d49a33"/>`;
          g += `<ellipse cx="${x.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(22 * s).toFixed(1)}" ry="${(7 * s).toFixed(1)}" fill="#f7cf6a" stroke="#c48a2a" stroke-width="1.2"/>`;
        }
        return g;
      };
      let s = hill(240, 120, 9, "#1f4f86", 3) + hill(300, 110, 12, "#146a73", 5);
      for (let i = 0; i < 9; i++) s += stack(80 + i * 240 + r() * 90, 300 + r() * 40, 0.9 + r() * 0.7);
      s += `<path d="M0 420 Q400 380 800 410 T1500 400 T2120 410 L2120 450 Q1500 440 1000 455 T0 460Z" fill="#7cc8e6" opacity=".85"/>`;
      s += hill(370, 90, 14, "#0e5551", 9);
      for (let i = 0; i < 7; i++) s += stack(150 + i * 300 + r() * 120, 400 + r() * 50, 1.3 + r() * 0.8);
      s += hill(450, 60, 16, "#0a3f3d", 13);
      land.innerHTML = s;
    }

    // ---------- floaters (S2/S3, S10, S11) ----------
    const floatL = el("div", "layer", stage); floatL.style.zIndex = 3;
    const ringsSvg = el("div", "layer", floatL); ringsSvg.innerHTML = `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;overflow:visible"><g id="rings" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-dasharray="7 9"><circle r="150"/><circle r="250"/><circle r="460"/></g></svg>`;
    const rings = ringsSvg.querySelector("#rings");
    const shards = [];
    {
      const r = rng(11);
      const spots = [[-640, -300], [-170, -420], [380, -380], [700, -150], [-430, 120], [-760, 260], [-160, 330], [290, 300], [660, 360], [-520, -110], [120, -250], [470, 110], [-300, 430], [820, -380]];
      spots.forEach(([x, y], i) => {
        const kind = i % 3 === 1 ? "slip" : "coin";
        const e = el("div", kind, floatL);
        shards.push({ e, kind, x, y, rot: r() * 360, vr: (r() - 0.5) * 3, spin: r() * 6, sz: 0.75 + r() * 0.6 });
      });
    }
    const dome = makeBot(floatL);
    const botL = makeBot(floatL), botR = makeBot(floatL);
    const botsK = []; for (let i = 0; i < 8; i++) botsK.push(makeBot(floatL));

    // ---------- kinetic text + logo ----------
    const textL = el("div", "layer", stage); textL.style.zIndex = 4;
    const meet = el("div", "ktext", textL); meet.id = "meet"; meet.textContent = "Meet Kovo";
    const prod = el("div", "ktext", textL); prod.id = "prod";
    const prodW = ["Spend", "Pilot"].map((w, i) => el("span", "kw", prod, (i ? " " : "") + w));
    const phrase = el("div", "ktext", textL); phrase.id = "phrase";
    const PW = ["Control", "spending", "before", "the", "card", "is", "charged"];
    const phW = PW.map((w, i) => el("span", "kw", phrase, (i ? " " : "") + w));
    const get1 = el("div", "ktext", textL); get1.id = "getL1"; get1.textContent = "Get started at";
    const get2 = el("div", "ktext", textL); get2.id = "getL2"; get2.textContent = "kovo.app/spend-pilot";
    const logo = el("div", "logo", textL); logo.dataset.disp = "flex";
    logo.innerHTML = MARK("mdot") + `<div class="wm">${"kovo".split("").map((c) => `<span>${c}</span>`).join("")}</div>`;
    const logoBars = logo.querySelector(".bars"), logoDot = logo.querySelector("#mdot"), logoLetters = [...logo.querySelectorAll(".wm span")], logoWm = logo.querySelector(".wm");
    const rays = el("div", "", textL); rays.id = "rays";
    const ball = makeBot(textL);

    // ================= UI shots =================
    // ---- app window: dashboard + vendor table (S4, S5) ----
    const A = shot();
    const app = el("div", "win ui", A.w); app.id = "app";
    const pillTag = (t) => t === "new" ? `<span class="pill blue" style="height:24px;font-size:14px">New</span>` : t === "off" ? `<span class="pill blue" style="height:24px;font-size:14px">Off-contract</span>`
      : `<span class="ico" style="width:28px;height:28px;border-radius:7px;background:${t === "globe" ? "#fff4dc" : "#eef3ff"};color:${t === "globe" ? "#d58a0b" : "#3e6fd8"};border:1px solid ${t === "globe" ? "#f3d48e" : "#c9d8fb"}">${ic(t, "currentColor", 2)}</span>`;
    const tableHTML = () => {
      let h = `<div class="hd">${[["Name", TC.name], ["Category", TC.cat], ["Owner", TC.owner], ["Risk", TC.risk], ["Approval Status", TC.st], ["Alerts", TC.al], ["Spend (30d)", TC.sp]].map(([t, x]) => `<div class="c" style="left:${x}px">${t} <span style="opacity:.6">ⓘ</span></div>`).join("")}</div>`;
      ROWS.forEach((r, i) => {
        h += `<div class="rw" style="top:${48 + i * ROWH}px"><div class="bg"></div>
          <div class="c" style="left:${TC.name}px">${vic(r.ic, r.col, 46)}<div><div style="display:flex;align-items:center;gap:10px"><span class="nm">${r.name}</span><span style="color:#9aa1af;font-size:15px">≡</span>${r.tags.map(pillTag).join("")}</div><div class="sb">${r.sub}</div></div></div>
          <div class="c" style="left:${TC.cat}px"><span class="catic">${ic(r.cic, "#2a3142", 1.8)}</span><span class="catx">${r.cat}</span></div>
          <div class="c" style="left:${TC.owner}px"><span class="own">${ic("user", "currentColor", 1.8)}</span>${r.owner}</div>
          <div class="c" style="left:${TC.risk}px"><span class="pill ${r.risk[1]}">${r.risk[0]}</span></div>
          <div class="c" style="left:${TC.st}px"><span class="st"><i></i>${r.st}</span></div>
          <div class="c" style="left:${TC.al}px"><span class="pill ${r.al[0] === "H" ? "high" : "med"}" style="padding:0 6px">${r.al[0]}</span> ${r.al[1]} <span class="muted">/ ${r.al[2]}</span></div>
          <div class="c" style="left:${TC.sp}px">${r.sp} <span style="color:#138a52;font-size:14px">↑ ${10 + i * 7}%</span></div></div>`;
      });
      return h;
    };
    const lineChart = (w, h, series, cols, opt = {}) => {
      const max = opt.max || 600, n = series[0].length;
      const X = (i) => 50 + (i / (n - 1)) * (w - 70), Y = (v) => 20 + (1 - v / max) * (h - 60);
      let g = "";
      [0, 200, 400, 600].forEach((v) => (g += `<line x1="50" x2="${w - 20}" y1="${Y(v)}" y2="${Y(v)}" stroke="#f0f1f4"/><text x="40" y="${Y(v) + 5}" text-anchor="end" font-size="13" fill="#8a91a0">${v}</text>`));
      series.forEach((s, k) => (g += `<path d="${s.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ")}" fill="none" stroke="${cols[k]}" stroke-width="${opt.sw || 2.4}" stroke-linejoin="round"/>`));
      (opt.dates || []).forEach((d, i, a) => (g += `<text x="${X((i / (a.length - 1)) * (n - 1))}" y="${h - 14}" text-anchor="middle" font-size="13" fill="#8a91a0">${d}</text>`));
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}</svg>`;
    };
    const RISKC = ["#e2475d", "#f08a3c", "#f3c529", "#4b7be5"];
    {
      const side = [["Dashboard", "home"], ["Ask Kovo", "spark"], ["#Triage"], ["Alerts", "bell"], ["Approvals", "check"], ["#Discovery"], ["Cards", "card"], ["Vendors", "store"], ["Subscriptions", "repeat"], ["Teams", "team"], ["Spend", "wallet", 1], ["Budgets", "chart"], ["Receipts", "doc"], ["#Management"], ["Policies", "shield"], ["Reports", "book"], ["Audit trail", "lock"], ["Integrations", "plug"], ["Settings", "gear"]];
      const r = rng(5);
      const bars = (n) => Array.from({ length: n }, () => 30 + r() * 70);
      const srcB = bars(6);
      const ser = [0, 1, 2, 3].map((k) => Array.from({ length: 22 }, (_, i) => k === 3 ? 60 + 10 * Math.sin(i) : 470 - k * 40 - i * (6 + k * 2) + 40 * Math.sin(i * 0.9 + k) + r() * 30));
      app.innerHTML = `
        <div class="top"><span style="display:flex;align-items:center;gap:9px;font-weight:650;font-size:21px;letter-spacing:-.03em"><span style="width:26px;height:26px;display:inline-block;filter:invert(1) brightness(.15)">${MARK()}</span>kovo</span>
          <span class="muted" style="margin-left:18px">Acme Inc. ▾</span><span style="margin-left:auto;display:flex;gap:18px;color:#6b7385">${ic("search")}${ic("bell")}<span style="width:28px;height:28px;border-radius:50%;background:#1f9c6b;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:600">D</span></span></div>
        <div class="side">${side.map(([t, i, on]) => t[0] === "#" ? `<div class="h">${t.slice(1)}</div>` : `<div class="it${on ? " on" : ""}">${ic(i)}${t}</div>`).join("")}</div>
        <div style="position:absolute;left:290px;top:84px;font-size:28px;font-weight:650;letter-spacing:-.02em">Spend</div>
        <div class="tabs" style="left:290px;top:140px"><span class="on">All <span class="n">312</span></span><span>Cards <span class="n">64</span></span><span>Vendors <span class="n">118</span></span><span>Subscriptions <span class="n">87</span></span><span>Travel <span class="n">43</span></span></div>
        <div class="card" style="left:290px;top:190px;width:470px;height:330px"><div class="ttl">Spend by Source <span class="muted">ⓘ</span></div>
          ${["Cards", "Invoices", "Reimburse…", "Payroll", "Subscriptions", "Travel"].map((t, i) => `<div style="position:absolute;left:22px;top:${70 + i * 38}px;font-size:14px;color:#3b4254;display:flex;gap:8px;align-items:center">${ic(["card", "doc", "wallet", "team", "repeat", "plane"][i], "#6b7385")}<span style="width:20px"></span></div><div style="position:absolute;left:24px;top:${70 + i * 38}px;font-size:14px;margin-left:24px;color:#3b4254">${t}</div><div style="position:absolute;left:160px;top:${76 + i * 38}px;height:9px;border-radius:5px;width:${srcB[i] * 2.6}px;background:#7aa5f0"></div>`).join("")}
          <div style="position:absolute;left:160px;right:24px;bottom:22px;display:flex;justify-content:space-between;font-size:12px;color:#8a91a0"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div></div>
        <div class="card" style="left:780px;top:190px;width:500px;height:330px"><div class="ttl">Vendors by Category <span class="muted">ⓘ</span></div>
          <div style="position:absolute;left:22px;right:22px;top:62px;display:flex;font-size:13px;color:#8a91a0"><span style="flex:1">Category</span><span style="width:90px"># Vendors</span><span style="width:110px">Payment rails</span></div>
          ${[["Software", "cloud", "#7c5ce6", 71], ["Travel", "plane", "#2f73e0", 40], ["Marketing", "grid", "#e04b97", 38], ["Print & office", "printer", "#11a596", 15], ["Data", "stack", "#e14a4f", 33]].map(([t, i, c, n], k) => `<div style="position:absolute;left:22px;right:22px;top:${92 + k * 44}px;height:40px;border-top:1px solid #f0f1f4;display:flex;align-items:center;font-size:15px"><span style="flex:1;display:flex;align-items:center;gap:10px">${vic(i, c, 26)}${t}</span><span style="width:90px">${n}</span><span style="width:110px;display:flex;gap:6px">${vic("card", "#2f73e0", 22)}${k % 2 ? vic("doc", "#6b7385", 22) : ""}</span></div>`).join("")}</div>
        <div class="card" style="left:1300px;top:190px;width:550px;height:330px"><div class="ttl">Spend by Risk <span class="muted">ⓘ</span></div>
          <div style="position:absolute;right:20px;top:14px;display:flex;gap:4px;font-size:13px"><span class="pill gray">1M</span><span style="padding:4px 8px" class="muted">3M</span><span style="padding:4px 8px" class="muted">6M</span></div>
          <div style="position:absolute;left:60px;top:58px;display:flex;gap:16px;font-size:13px;color:#6b7385">${["Critical", "High", "Medium", "Low"].map((t, i) => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${RISKC[i]};margin-right:5px"></i>${t}</span>`).join("")}</div>
          <div style="position:absolute;left:6px;top:80px">${lineChart(530, 240, ser, RISKC, { dates: ["20 Oct", "27 Oct", "3 Nov", "10 Nov", "17 Nov"] })}</div></div>
        <div style="position:absolute;left:290px;top:552px;font-size:16px"><b style="color:#1f63c6;font-weight:600">312</b> transactions</div>
        <div style="position:absolute;right:30px;top:540px;display:flex;gap:10px;font-size:15px">${[["search", ""], ["sort", "Sort by Risk"], ["filter", "Filters"], ["cols", "Columns"], ["", "Export CSV"]].map(([i, t]) => `<span style="height:40px;border:1px solid #e3e6ec;border-radius:9px;display:flex;align-items:center;gap:8px;padding:0 12px;white-space:nowrap">${i ? ic(i) : ""}${t}</span>`).join("")}</div>
        <div class="fbar" style="left:290px;top:600px;width:1560px"><span class="find">Find</span><span class="ai">${ic("spark", "#2fb87e")} AI Filters</span><span>${ic("target", "#8a91a0")}</span><span>Risk</span><span>Category</span><span>Team</span><span>Payment rail</span><span>Activity</span><span>Alerts</span><span>+</span></div>
        <div class="tbl" id="vtbl" style="left:290px;top:672px;width:1560px;height:510px">${tableHTML()}</div>`;
    }
    const vRows = [...app.querySelectorAll("#vtbl .rw")];
    const vCur = el("div", "cursor", A.w);

    // ---- graph + detail page (S6, S7) ----
    const G = shot();
    const page = el("div", "", G.w); page.id = "page";
    const gl = el("div", "", G.w); gl.innerHTML = `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible"><g id="links"></g></svg>`;
    const links = gl.querySelector("#links");
    const stub = el("div", "node", G.w); abs(stub, -560, -80, 300, 160);
    stub.innerHTML = `<div class="in" style="left:16px;right:16px;top:32px;bottom:32px;height:auto"><div><div style="font-size:16px;font-weight:600">Teamroom</div><div class="muted" style="font-size:13px;margin-top:3px">Channel</div></div><span style="margin-left:auto;color:#e2475d">${ic("globe", "#e2475d")}</span></div>`;
    stub.querySelector("svg").style.cssText = "width:22px;height:22px";
    const cardN = el("div", "node", G.w); abs(cardN, -215, -95, 430, 190);
    cardN.innerHTML = `<div class="lab">${ic("target", "#1f63c6")}Current Card</div><div class="in">${vic("card", "#1f9c6b", 50)}<div><div style="font-size:19px;font-weight:600;color:#1b2130;white-space:nowrap">Marketing Card</div><div class="muted" style="font-size:14px;margin-top:4px;white-space:nowrap">Virtual Visa •• 4821</div></div><span class="pill crit" style="margin-left:auto">Over budget</span></div>`;
    cardN.querySelectorAll(".lab svg").forEach((s) => (s.style.cssText = "width:16px;height:16px"));
    const gV = el("div", "grp", G.w), gB = el("div", "grp", G.w);
    el("div", "gl", gV, "Vendors"); el("div", "gl", gB, "Budgets");
    const mkItem = (parent, t, s, icn, col, pill) => { const e = el("div", "itm", parent, `${vic(icn, col, 38)}<div><div class="t">${t}</div><div class="s">${s}</div></div>${pill ? `<span class="pill ${pill[1]}">${pill[0]}</span>` : ""}`); return e; };
    const vItems = [
      mkItem(gV, "Orbit Travel", "Travel agency", "plane", "#2f73e0", ["Restricted", "crit"]),
      mkItem(gV, "Lattice Ads", "Ad network", "grid", "#e04b97", ["Restricted", "crit"]),
      mkItem(gV, "Brightline Cloud", "Infrastructure", "sun", "#ef7d2d", ["Review", "high"]),
      mkItem(gV, "Nimbus CRM", "Software seats", "cloud", "#7c5ce6", ["Review", "high"]),
      mkItem(gV, "travel-q3", "Budget · Travel", "wallet", "#1f9c6b", ["Over limit", "crit"]),
      mkItem(gV, "events-fund", "Budget · Events", "wallet", "#1f9c6b", ["Within", "ok"]),
    ];
    const bItems = [
      mkItem(gB, "auto_pay", "Pays invoices on approval", "tool", "#11a596", ["⚠ 4", "crit"]),
      mkItem(gB, "card_issue", "Issues virtual cards — limits…", "card", "#2f73e0", null),
    ];
    const gCur = el("div", "cursor", G.w);
    // detail panel + page header (world coords continue the graph's)
    const PX = 1330, PY = -520;
    const pnl = el("div", "ui", G.w); pnl.id = "pnl"; abs(pnl, PX, PY, 860, 1100);
    const dnut = (id, total, sub, segs, cols) => {
      const R = 52, C = 2 * Math.PI * R; let off = 0, s = "";
      segs.forEach((v, i) => { s += `<circle class="seg" r="${R}" fill="none" stroke="${cols[i]}" stroke-width="10" data-len="${(v * C - 4).toFixed(1)}" data-off="${(-off * C).toFixed(1)}" stroke-dasharray="0 ${C.toFixed(1)}" stroke-dashoffset="${(-off * C).toFixed(1)}" transform="rotate(-90)"/>`; off += v; });
      return `<svg class="dn" id="${id}" width="150" height="150" viewBox="-75 -75 150 150"><circle r="${R}" fill="none" stroke="#f1f2f5" stroke-width="10"/>${s}<text y="4" text-anchor="middle" font-size="25" font-weight="600" fill="#1b2130">${total}</text><text y="26" text-anchor="middle" font-size="11" fill="#8a91a0">${sub}</text></svg>`;
    };
    const legend = (items, cols) => items.map(([t, v], i) => `<div style="display:flex;align-items:center;gap:8px;font-size:13.5px;color:#4c5466;height:24px"><i style="width:8px;height:8px;border-radius:2px;background:${cols[i]}"></i>${t} <b style="font-weight:600;color:#1b2130">${v}</b></div>`).join("");
    pnl.innerHTML = `
      <div style="position:absolute;left:34px;top:30px;display:flex;align-items:center;gap:16px">${vic("plane", "#2f73e0", 52)}<div><div style="font-size:25px;font-weight:600">Orbit Travel</div><div class="muted" style="font-size:15px;margin-top:4px">Travel agency · Card spend</div></div></div>
      <div class="card" style="left:30px;top:130px;width:400px;height:250px"><div class="ttl" style="font-size:16px">Spend by Category</div><div style="position:absolute;right:18px;top:20px;font-size:13px;color:#1f63c6">View all</div>
        <div style="position:absolute;left:14px;top:66px">${dnut("dn1", "$412K", "Spend", [0.42, 0.24, 0.13, 0.09, 0.12], ["#1f63c6", "#4b8cf0", "#7fb0f7", "#a9c8fa", "#cfdcf0"])}</div>
        <div style="position:absolute;left:186px;top:76px">${legend([["Flights", "171K"], ["Hotels", "98K"], ["Ground", "54K"], ["Meals", "37K"], ["Other", "52K"]], ["#1f63c6", "#4b8cf0", "#7fb0f7", "#a9c8fa", "#cfdcf0"])}</div></div>
      <div class="card" style="left:446px;top:130px;width:386px;height:250px"><div class="ttl" style="font-size:16px">Policy Status</div><div style="position:absolute;right:16px;top:16px;display:flex;font-size:12.5px;border:1px solid #e6e8ee;border-radius:7px"><span style="padding:5px 9px;background:#f4f5f8">Bookings</span><span style="padding:5px 9px" class="muted">Amount</span></div>
        <div style="position:absolute;left:14px;top:66px">${dnut("dn2", "3.7K", "Bookings", [0.45, 0.25, 0.2, 0.1], ["#e2475d", "#f08a3c", "#f3c529", "#8fb2f2"])}</div>
        <div style="position:absolute;left:186px;top:86px">${legend([["Blocked", "1.6K"], ["Flagged", "940"], ["Within", "760"], ["Pre-approved", "380"]], ["#e2475d", "#f08a3c", "#f3c529", "#8fb2f2"])}</div></div>
      <div class="card" style="left:30px;top:400px;width:802px;height:200px"><div class="ttl" style="font-size:16px">Related Alerts</div>
        <div style="position:absolute;left:22px;right:22px;top:60px;display:flex;font-size:13px;color:#8a91a0"><span style="flex:1">Name</span><span style="width:170px">Severity</span><span style="width:150px">Actions</span><span style="width:120px">Status</span></div>
        ${[["Over-limit booking", "Critical", "crit", "Open", ""], ["First-class fare", "High", "high", "Mitigated", "ok"]].map(([n, s, c, st, sc], i) => `<div style="position:absolute;left:22px;right:22px;top:${92 + i * 50}px;height:46px;border-top:1px solid #f0f1f4;display:flex;align-items:center;font-size:15px"><span style="flex:1">${n}</span><span style="width:170px"><span class="pill ${c}">${s}</span></span><span style="width:150px;display:flex;gap:8px">${vic("tool", "#6b7385", 24)}${vic("ban", "#7c5ce6", 24)}</span><span style="width:120px;font-size:14px"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${sc ? "#1fb36a" : "#e7b21e"};margin-right:6px"></i>${st}</span></div>`).join("")}</div>
      <div class="card" style="left:30px;top:620px;width:802px;height:240px"><div class="ttl" style="font-size:16px">Charges</div>
        <div style="position:absolute;left:22px;right:22px;top:60px;display:flex;font-size:13px;color:#8a91a0"><span style="flex:1">Merchant category</span><span style="width:220px">Amount</span><span style="width:180px">Receipt</span></div>
        ${[["Airline tickets", "$171,240"], ["Hotels & lodging", "$98,115"], ["Car rental", "$12,480"]].map(([n, a], i) => `<div style="position:absolute;left:22px;right:22px;top:${92 + i * 46}px;height:44px;border-top:1px solid #f0f1f4;display:flex;align-items:center;font-size:15px"><span style="flex:1;display:flex;align-items:center;gap:8px"><i style="width:8px;height:8px;border-radius:2px;background:#e04b97"></i>${n}</span><span style="width:220px">${a}</span><span style="width:180px;font-family:monospace;color:#6b7385">•••• ${4821 - i * 1111}</span></div>`).join("")}</div>`;
    const dnSegs = [...pnl.querySelectorAll(".seg")];
    const phead = el("div", "ui", G.w); phead.style.position = "absolute"; abs(phead, 640, -630, 1530, 130);
    phead.style.cssText += ";background:#fff;border-bottom:1px solid #eceef2";
    phead.innerHTML = `<div style="position:absolute;left:30px;top:26px;display:flex;align-items:center;gap:18px">${vic("card", "#1f9c6b", 62)}<div><div style="display:flex;align-items:center;gap:12px"><span style="font-size:26px;font-weight:600">Marketing Card</span><span class="pill blue" style="height:22px;font-size:12px">Off-contract</span><span class="pill crit" style="height:22px;font-size:12px">Over budget</span></div>
      <div class="muted" style="font-size:15px;margin-top:8px;display:flex;gap:18px">Virtual Visa •• 4821 <span>|</span> Issued 3 days ago <span>|</span> Limit $25,000 <span>|</span> Last charge: Today, 5:35 AM <span>|</span> Owner: Jamie G. <span class="pill blue" style="height:22px;font-size:12px">Admin</span></div></div></div>`;

    // ---- chat app (S8) ----
    const C = shot();
    const chat = el("div", "win ui", C.w); chat.id = "chat";
    const PROMPT = "Book 12 first-class flights to Lisbon for the team offsite and put the whole thing on the marketing card.";
    chat.innerHTML = `
      <div class="chrome"><span class="dots"><i style="background:#ff6058"></i><i style="background:#ffbd2e"></i><i style="background:#28c840"></i></span>${ic("back", "#8a91a0")}${ic("fwd", "#8a91a0")}${ic("reload", "#8a91a0")}<span class="url">${ic("lock", "#8a91a0")}https://teamroom.app</span></div>
      <div class="cside"><div style="font-weight:650;font-size:19px;margin-bottom:16px">Teamroom</div><div>${ic("plus")}New chat</div><div>${ic("chat")}Chats</div><div>${ic("book")}Projects</div><div>${ic("doc")}Files</div><div style="margin-top:16px;color:#8a91a0;font-size:13px">Tools</div><div>${ic("wallet")}Expenses</div><div>${ic("plane")}Travel</div><div>${ic("gear")}Settings</div></div>
      <div class="main">
        <div id="greet" style="position:absolute;left:0;right:0;top:210px;text-align:center;font-size:44px;font-weight:450;letter-spacing:-.02em;color:#1b2130"><span style="color:#f0a425">☀</span> Good afternoon, Dana</div>
        <div id="box" style="position:absolute;left:180px;right:180px;top:320px;height:150px;border-radius:20px;background:#fff;border:1px solid #e3e5ea;box-shadow:0 8px 30px rgba(10,20,60,.06)">
          <div id="typed" style="position:absolute;left:28px;right:90px;top:24px;font-size:19px;line-height:1.55;color:#1b2130"></div>
          <span style="position:absolute;left:24px;bottom:16px;color:#8a91a0">${ic("plus")}</span>
          <span style="position:absolute;right:20px;bottom:16px;width:36px;height:36px;border-radius:10px;background:#1f9c6b;color:#fff;display:grid;place-items:center">${ic("arrowUp", "#fff", 2.4)}</span></div>
        <div id="chips" style="position:absolute;left:0;right:0;top:500px;display:flex;justify-content:center;gap:34px;font-size:16px;color:#3b4254">${[["plane", "Plan a trip"], ["doc", "Draft"], ["wallet", "Expenses"], ["spark", "Surprise me"]].map(([i, t]) => `<span style="display:flex;align-items:center;gap:8px">${ic(i, "#6b7385")}${t}</span>`).join("")}</div>
        <div id="sent" class="bubble" style="right:120px;top:60px;width:820px"></div>
        <div id="think" style="position:absolute;left:150px;top:220px;font-size:18px;color:#8a91a0;display:flex;align-items:center;gap:12px"><span id="spin" style="color:#1f9c6b;font-size:22px">✳</span>Thinking</div>
        <div id="stop" class="stop" style="left:150px;top:210px;width:640px"><div style="font-weight:650;display:flex;align-items:center;gap:8px">${ic("warn", "#b4233a")}Purchase paused</div>This booking breaks the travel policy (economy only, $8,000 cap). It's been sent to finance for review.</div>
      </div>`;
    chat.querySelectorAll(".chrome svg, .cside svg, #chips svg").forEach((s) => (s.style.cssText = "width:18px;height:18px"));
    chat.querySelectorAll(".stop svg").forEach((s) => (s.style.cssText = "width:20px;height:20px"));
    const greet = chat.querySelector("#greet"), typed = chat.querySelector("#typed"), boxC = chat.querySelector("#box"), chips = chat.querySelector("#chips"), sent = chat.querySelector("#sent"), think = chat.querySelector("#think"), spin = chat.querySelector("#spin"), stopB = chat.querySelector("#stop");
    sent.textContent = PROMPT;

    // ---- activity page (S9) ----
    const P = shot();
    const act = el("div", "win ui", P.w); act.id = "act";
    const RED = ["12", "first-class", "flights", "whole", "thing", "marketing", "card."];
    act.innerHTML = `
      <div style="position:absolute;left:0;right:0;top:0;height:84px;border-bottom:1px solid #eceef2;display:flex;align-items:center;gap:20px;padding:0 34px"><span style="color:#6b7385;font-size:26px">≡</span><span style="display:flex;align-items:center;gap:11px;font-weight:650;font-size:32px;letter-spacing:-.03em"><span style="width:34px;height:34px;display:inline-block;filter:invert(1) brightness(.15)">${MARK()}</span>kovo</span></div>
      <div style="position:absolute;left:30px;top:112px;width:740px;height:54px;border:1px solid #e6e8ee;border-radius:11px;display:flex;font-size:19px;background:#f1f2f5;padding:4px"><span style="flex:1;display:flex;align-items:center;justify-content:center;gap:9px;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08)">${ic("chat")}Chat</span><span style="flex:1;display:flex;align-items:center;justify-content:center;gap:9px" class="muted">${ic("repeat")}Steps</span></div>
      <div style="position:absolute;left:792px;top:84px;width:1px;bottom:0;background:#eceef2"></div>
      <div class="blk" style="left:100px;top:216px;width:620px;height:200px;border:none;background:#f7f8fa"><div style="display:flex;gap:9px;align-items:center;font-size:17px;color:#4c5466">${ic("chat")}Prompt</div>
        <div id="pr" style="font-size:20px;line-height:1.55;margin-top:10px;color:#1b2130">${PROMPT.split(" ").map((w) => `<span class="pw">${w}</span>`).join(" ")}</div></div>
      <div style="position:absolute;left:100px;width:620px;top:428px;text-align:right;font-size:16px" class="muted">👤 Dana R.  ·  25 Jul, 6:44 PM</div>
      <div class="sec" id="th" style="left:60px;top:500px;width:660px"><div style="display:flex;gap:9px;align-items:center;font-size:17px;color:#7c5ce6">${ic("spark", "#7c5ce6")}Thinking</div><div style="margin-top:10px;color:#9b87e8;font-size:18px">Checking the request against the travel policy, the card's limit and the travel-q3 budget before anything is booked.</div><div style="margin-top:22px;font-size:16px;color:#9b87e8">${ic("card", "#9b87e8")} Spend Pilot  ·  25 Jul, 6:44 PM</div></div>
      <div class="blk" id="tc" style="left:50px;top:690px;width:680px;height:300px"><div style="display:flex;gap:9px;align-items:center;font-size:18px;color:#2a3142">${ic("tool")}Tool Call</div>
        <div class="ln" style="margin-top:12px;font-size:17.5px;color:#3b4254">Searching fares from three booking partners</div><div class="ln" style="font-size:17.5px;color:#3b4254">12 seats matched  •  Lisbon, 14–17 Sep  •  Total $61,480</div>
        <div class="ln" style="margin-top:20px;font-size:17.5px;color:#3b4254">Policy checks:</div><div class="ln" style="margin-top:12px;font-size:17.5px;color:#3b4254">Fare class — first (economy only)</div><div class="ln" style="font-size:17.5px;color:#3b4254">Card limit — $25,000</div><div class="ln" style="font-size:17.5px;color:#3b4254">Budget travel-q3 — $8,000 left</div></div>
      <div class="sec" id="tcf" style="left:54px;top:1004px;font-size:18px;color:#2a3142">${ic("card", "#1f9c6b")} Spend Pilot  ·  25 Jul, 6:45 PM</div>
      <div class="blk" id="tr" style="left:54px;top:1066px;width:690px;height:240px;border-color:#e9ebf0"><div style="display:flex;gap:10px;align-items:center;font-size:18px;color:#c42740">${ic("tool", "#c42740")}Tool Response <span class="pill crit">${ic("ban", "#d2364b")} Blocked</span></div>
        <div style="color:#c42740;margin-top:14px;font-size:18px">book_flights blocked by policy_engine</div><div style="color:#c42740;margin-top:22px;font-size:18px">Matched policy: Travel — Economy only</div><div style="color:#c42740;margin-top:22px;font-size:18px">Purchase stopped before the card was charged.</div></div>
      <div class="sec" id="trf" style="left:58px;top:1322px;font-size:18px;color:#c42740">${ic("card", "#c42740")} Spend Pilot  ·  25 Jul, 6:45 PM</div>
      <div class="side2" style="position:absolute;left:822px;top:112px;width:420px">
        <div style="display:flex;font-size:19px;border-bottom:1px solid #eceef2"><span style="padding:12px 12px;border-bottom:2.5px solid #1b2130;font-weight:500">Overview</span><span style="padding:12px 12px" class="muted">Raw Details</span></div>
        <div style="border:1px solid #eceef2;border-radius:12px;padding:20px 22px;margin-top:22px"><div class="h">Activity Details</div><div class="k">Time</div><div class="v">25 Jul, 6:45 PM</div><div class="k">Source</div><div class="v">Teamroom</div></div>
        <div style="border:1px solid #eceef2;border-radius:12px;padding:20px 22px;margin-top:22px"><div class="h">Related Alert</div><div class="k">Name</div><div class="v">Out-of-policy travel</div></div>
        <div style="border:1px solid #eceef2;border-radius:12px;padding:20px 22px;margin-top:22px"><div class="h">Spend Pilot Summary</div><div class="k">What happened? ✦</div><div class="v" style="line-height:1.55">A teammate asked an assistant to buy 12 first-class flights on the marketing card. The total, $61,480, was over the card's limit and the travel budget. The booking was stopped before payment.</div>
        <div class="k" style="margin-top:22px">Policy</div><div class="v">Travel — Economy only</div><div class="k" style="margin-top:22px">Triggered Action</div><div class="v">Block purchase</div></div>
        <div style="border:1px solid #eceef2;border-radius:12px;padding:20px 22px;margin-top:22px"><div class="h">Tool Details</div><div class="k">Tool Used</div><div class="v">book_flights</div></div></div>`;
    act.querySelectorAll(".blk > div:first-child svg, .sec svg, #act > div svg").forEach((s) => (s.style.cssText = "width:18px;height:18px;display:inline-block;vertical-align:-3px"));
    const prWords = [...act.querySelectorAll(".pw")], thSec = act.querySelector("#th"), tcBox = act.querySelector("#tc"), tcLines = [...act.querySelectorAll("#tc .ln")], trBox = act.querySelector("#tr"), tcf = act.querySelector("#tcf"), trf = act.querySelector("#trf");

    // ---- spend-alerts card (S10) ----
    const K = shot();
    const comp = el("div", "win ui", K.w); comp.id = "comp";
    {
      const r = rng(19);
      const ser = [0, 1, 2, 3].map((k) => Array.from({ length: 11 }, (_, i) => [520, 300, 380, 160][k] - i * [26, 8, 14, 9][k] + 60 * Math.sin(i * (1.1 + k * 0.3) + k * 2) + r() * 30));
      const rows = [
        ["25 Jul, 7:47 PM", "chat", "Book the full team offsite on the marketing card…", ["C", "#e2475d"], "Over-limit Purchase Attempt", "Maya Chen"],
        ["25 Jul, 2:42 PM", "tool", "book_flights invoked for 12 first-class seats…", ["C", "#e2475d"], "Over-limit Purchase Attempt", "Travel Assistant"],
        ["25 Jul, 6:41 PM", "tool", "book_flights blocked by policy_engine…", ["H", "#f08a3c"], "Attempted Out-of-policy Fare", "Travel Assistant"],
        ["25 Jul, 1:12 PM", "chat", "Purchase paused. Fare class outside policy…", ["H", "#f08a3c"], "Out-of-policy Spend Prevented", "Ops Assistant"],
        ["25 Jul, 3:15 AM", "chat", "Renew all 40 seats of Nimbus CRM for three years…", ["H", "#f08a3c"], "Unapproved Contract Renewal", "Tom T."],
        ["25 Jul, 3:14 AM", "tool", "auto_pay blocked by policy_engine before payout…", ["M", "#e8b10f"], "Attempted Duplicate Invoice Payment", "AP Assistant"],
        ["25 Jul, 6:44 PM", "chat", "Payment held. Vendor bank details changed today…", ["M", "#e8b10f"], "Vendor Detail Change Held", "Finance Bot"],
      ];
      comp.innerHTML = `
        <div style="position:absolute;left:30px;top:28px;font-size:17px;font-weight:600">Spend Alerts by Policy</div>
        <div style="position:absolute;left:20px;top:70px">${lineChart(1360, 300, ser, ["#e2475d", "#f08a3c", "#e8c11e", "#8fb2f2"], { dates: ["25 Jun", "28 Jun", "1 Jul", "4 Jul", "7 Jul", "10 Jul", "16 Jul", "19 Jul", "22 Jul", "25 Jul"], sw: 2.2 })}</div>
        <div style="position:absolute;left:34px;top:378px;display:flex;gap:16px;font-size:13px;color:#6b7385">${["Critical", "High", "Medium", "Low"].map((t, i) => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${["#e2475d", "#f08a3c", "#e8c11e", "#8fb2f2"][i]};margin-right:5px"></i>${t}</span>`).join("")}</div>
        <div style="position:absolute;left:30px;right:30px;top:414px;height:40px;border-bottom:1px solid #eceef2;font-size:13px;color:#8a91a0"><span style="position:absolute;left:0;top:12px">Timestamp</span><span style="position:absolute;left:150px;top:12px">Activity ✦</span><span style="position:absolute;left:560px;top:12px">Policy Alert ⓘ</span><span style="position:absolute;left:900px;top:12px">Policy Set ⓘ</span><span style="position:absolute;left:1080px;top:12px">Actor ⓘ</span></div>
        ${rows.map((rw, i) => `<div class="rw2" style="top:${456 + i * 64}px;height:64px"><span style="left:0">${rw[0]}</span><span style="left:150px">${ic(rw[1], "#6b7385")}${rw[2]}</span><span style="left:560px"><span class="tag2" style="background:${rw[3][1]}22;color:${rw[3][1]}">${rw[3][0]}</span>${rw[4]}</span><span style="left:900px;color:#9aa1af">${ic(i === 2 ? "ban" : "target", "#9aa1af")}${i === 0 ? '<span class="pill gray" style="height:20px;font-size:11px;padding:0 5px">+1</span>' : ""}</span><span style="left:1080px">${vic(i % 3 ? "card" : "user", i % 3 ? "#1f9c6b" : "#2f73e0", 22)}${rw[5]}</span></div>`).join("")}
        <div style="position:absolute;left:30px;bottom:26px;font-size:13px" class="muted">Showing 7 of 108 results</div>
        <div style="position:absolute;right:30px;bottom:20px;display:flex;gap:14px;font-size:13px;align-items:center" class="muted">‹ <span style="background:#1b2130;color:#fff;padding:3px 8px;border-radius:5px">1</span> 2 3 4 5 … 9 ›</div>`;
      comp.querySelectorAll(".rw2 svg").forEach((s) => (s.style.cssText = "width:16px;height:16px"));
    }

    // ---- card header close-up (S12) ----
    const Hh = shot();
    const hdr = el("div", "ui", Hh.w); hdr.id = "hdr";
    hdr.innerHTML = `
      <div style="position:absolute;left:-200px;top:0;width:290px;height:700px;background:#f1f2f5;border-right:1px solid #e6e8ee;font-size:19px;color:#4c5466">${["Dashboard", "Ask Kovo", "Alerts", "Approvals", "Cards", "Vendors", "Subscriptions", "Teams", "Spend", "Budgets", "Receipts", "Policies", "Reports"].map((t, i) => `<div style="position:absolute;left:24px;right:16px;top:${20 + i * 52}px;height:40px;display:flex;align-items:center;padding-left:14px;border-radius:8px;${t === "Cards" ? "background:#d6f6e6;color:#0f6b47;font-weight:600" : ""}">${t}</div>`).join("")}</div>
      <div style="position:absolute;left:150px;top:30px;right:40px;height:110px;border:1px solid #eceef2;border-radius:14px;background:#fff"><div style="position:absolute;left:60px;top:44px;font-size:15px;color:#8a91a0"><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#1f63c6;margin-right:10px"></i>All Activity</div></div>
      <div style="position:absolute;left:150px;top:190px;font-size:24px;color:#4c5466">Cards  <span style="margin:0 12px">/</span>  <span style="color:#1b2130">Marketing Card</span></div>
      <div style="position:absolute;left:150px;top:250px;width:96px;height:96px;border-radius:18px;background:#eef1f4;display:grid;place-items:center"><span class="ico" style="width:62px;height:62px;background:#1f9c6b22;color:#1f9c6b">${ic("card", "#1f9c6b", 2)}</span></div>
      <div style="position:absolute;left:280px;top:256px;display:flex;align-items:center;gap:22px"><span style="font-size:38px;font-weight:600;letter-spacing:-.02em;color:#1b2130">Marketing Card</span><span id="badge"></span></div>
      <div style="position:absolute;left:280px;top:318px;font-size:23px;color:#4c5466;display:flex;align-items:center;gap:18px">Type: <span style="color:#1b2130">Virtual Visa</span><span style="width:1.5px;height:30px;background:#e1e4ea;margin:0 6px"></span>Limit: <span class="ico" style="width:34px;height:34px;background:#eef1f4;color:#4c5466">${ic("wallet", "#4c5466")}</span><span style="color:#1b2130">$25,000</span></div>
      <div style="position:absolute;left:110px;right:0;top:400px;height:1px;background:#e8eaef"></div>
      <div style="position:absolute;left:170px;top:440px;display:flex;gap:46px;font-size:24px;color:#4c5466"><span style="color:#1b2130;font-weight:600;border-bottom:3px solid #1b2130;padding-bottom:12px">Overview</span><span>Alerts <span style="background:#eef0f4;padding:2px 9px;border-radius:6px;font-size:20px;color:#1b2130">48</span></span><span>Vendors <span style="background:#eef0f4;padding:2px 9px;border-radius:6px;font-size:20px;color:#1b2130">5</span></span><span>Budgets</span><span>Receipts</span><span>Members</span></div>
      <div style="position:absolute;left:170px;top:530px;width:620px;height:200px;border:1px solid #eceef2;border-radius:14px;background:#fff"></div>
      <div style="position:absolute;left:820px;top:530px;width:620px;height:200px;border:1px solid #eceef2;border-radius:14px;background:#fff"></div>
      <div id="glowG"></div>`;
    const badge = hdr.querySelector("#badge"), glowG = hdr.querySelector("#glowG");

    // white flash / tint overlay (top)
    const flash = el("div", "layer", stage); flash.style.pointerEvents = "none"; flash.style.zIndex = 5;

    // ================= per-frame =================
    let lastBadge = "";
    function render(f) {
      f = clamp(f, 0, FRAMES - 0.001);

      // ---------- sky ----------
      let skyC = SKY.a;
      if (f >= 140 && f < 231) skyC = skyMix(skyMix(SKY.a, SKY.b, ramp(f, 140, 160)), ["#4d7fe0", "#7fb2f2", "#b6e2ff", "#f2fbff"], sm(ramp(f, 212, 229)));
      else if (f >= 463 && f < 640) skyC = SKY.c;
      else if (f >= 640 && f < 834) skyC = SKY.c;
      else if (f >= 834 && f < 1067) skyC = SKY.d;
      setSky(skyC);
      const cloudOn = f < 231 || (f >= 402 && f < 834) || f >= 954;
      clouds.style.display = cloudOn ? "block" : "none";
      if (cloudOn) {
        const cy = f < 140 ? keys(f, [[0, 0], [40, 0], [41, 40], [140, 90]]) : f < 231 ? lerp(90, 420, eo(ramp(f, 140, 175))) : 0;
        clouds.style.transform = `translate(${px(-f * 0.55 % 1300 - 200)},${px(cy - 60)}) scale(2)`;
        clouds.style.transformOrigin = "0 0";
        clouds.style.opacity = f < 40 ? 0.3 : 0.6;
      }
      // the white-out at the end of the burst (rises from the bottom)
      if (f >= 214 && f < 231) {
        const t = ramp(f, 214, 230.5);
        wash.style.display = "block";
        wash.style.background = `linear-gradient(0deg, rgba(255,255,255,${(0.3 + 0.7 * t).toFixed(3)}) 0%, rgba(200,244,255,${(0.75 * t).toFixed(3)}) ${(12 + 22 * t).toFixed(1)}%, rgba(190,236,255,0) ${(30 + 30 * t).toFixed(1)}%)`;
      } else wash.style.display = "none";

      // ---------- landscape ----------
      const landOn = (f >= 1088 && f < 1160) || (f >= 1243 && f < 1344);
      show(landWrap, landOn);
      if (landOn) {
        const top = f < 1160 ? keys(f, [[1088, 1090], [1092, 1050], [1100, 990], [1115, 900], [1130, 840], [1150, 800], [1160, 760]]) : keys(f, [[1243, 790], [1337, 805], [1339, 880], [1341, 1000], [1343, 1100]]);
        land.style.transform = `translate(${px(f < 1160 ? -(f - 1088) * 0.6 : -(f - 1243) * 0.4)},${px(top - 240)})`;
      }

      // ---------- floaters ----------
      const fl1 = f >= 40 && f < 231, fl10 = f >= 954 && f < 1014, fl11 = f >= 1092 && f < 1160;
      show(floatL, fl1 || fl10 || fl11);
      show(dome.e, f >= 78 && f < 146);
      show(botL.e, (f >= 40 && f < 148) || fl10);
      show(botR.e, (f >= 73 && f < 231) || fl10);
      show(ringsSvg, f >= 162 && f < 231);
      shards.forEach((s) => show(s.e, f >= 142 && f < 231));
      botsK.forEach((b) => show(b.e, fl11));
      if (fl1) {
        // the coin that rolled out of the logo: bounces left, climbs and leaves top right (measured path)
        if (f < 64) {
          const x = lin(f, [[40, 250], [41, 230], [42, 211], [43, 192], [44, 182], [45, 173], [46, 173], [47, 182], [48, 192], [49, 211], [50, 250], [51, 307], [52, 394], [53, 509], [54, 624], [55, 739], [56, 864], [57, 979], [58, 1094], [59, 1210], [60, 1315], [61, 1402], [62, 1490]]);
          const y = lin(f, [[40, 585], [41, 566], [42, 557], [43, 540], [44, 528], [45, 509], [46, 490], [47, 480], [48, 461], [49, 442], [50, 408], [51, 370], [52, 322], [53, 274], [54, 226], [55, 187], [56, 149], [57, 120], [58, 91], [59, 62], [60, 30], [61, 0], [62, -40]]);
          const d = keys(f, [[40, 190], [43, 160], [46, 120], [50, 70], [56, 52], [62, 46]]);
          botL.set(x, y, d, keys(f, [[40, 160], [50, 60], [62, -40]]), -0.3, { blur: keys(f, [[40, 2], [44, 0.5], [50, 1.5], [55, 3], [60, 3]]) });
        } else {
          // second entry: rolls in from the lower right, settles left, then drifts down and out as the camera rises
          const x = lin(f, [[64, 1824], [65, 1651], [66, 1507], [67, 1392], [68, 1277], [69, 1171], [70, 1085], [71, 1008], [72, 941], [73, 874], [74, 816], [75, 758], [76, 701], [77, 640], [79, 586], [80, 547], [85, 413], [89, 336], [92, 320], [105, 300], [120, 262], [140, 217], [146, 190], [150, 160]]);
          const y = keys(f, [[64, 768], [65, 873], [66, 922], [67, 950], [68, 965], [71, 975], [73, 972], [76, 950], [80, 922], [85, 870], [89, 845], [95, 840], [120, 880], [140, 941], [144, 1010], [148, 1160]]);
          botL.set(x, y, keys(f, [[64, 150], [70, 190], [90, 205], [140, 205]]), keys(f, [[64, -420], [72, -40], [90, 28], [140, 22]]), keys(f, [[64, 0], [90, -0.25], [140, -0.2]]), { blur: keys(f, [[64, 6], [67, 3], [71, 1], [74, 0]]) });
        }
        // the top-right bot: drops in, drifts left, then swings to centre and turns to camera
        const rx = lin(f, [[73, 1990], [74, 1905], [76, 1872], [78, 1824], [80, 1814], [85, 1757], [90, 1690], [120, 1520], [140, 1363], [145, 1277], [150, 1200], [155, 1056], [159, 1018], [163, 985], [170, 962], [180, 960], [231, 960]]);
        const ry = keys(f, [[73, 90], [74, 130], [76, 196], [78, 207], [80, 221], [85, 259], [90, 263], [120, 272], [140, 282], [145, 307], [150, 379], [155, 447], [160, 509], [170, 548], [180, 540], [231, 540]]);
        const rd = keys(f, [[73, 180], [80, 205], [140, 212], [150, 240], [160, 262], [175, 238], [200, 226], [229, 222]]);
        botR.set(rx, ry, rd * (f > 175 ? keys(f, [[175, 1], [229, 0.96]]) : 1), keys(f, [[73, 80], [90, -32], [120, -60], [140, -112], [152, -88], [162, -40], [172, 0], [231, 0]]), keys(f, [[73, 0.3], [90, 0.25], [140, 0.1], [165, 0.05], [175, 0]]), { blur: keys(f, [[73, 4], [76, 1], [78, 0], [150, 0], [153, 2], [157, 0]]) });
        // the giant bot rising under the title
        if (f >= 78 && f < 146) {
          const cx = keys(f, [[78, 2400], [80, 2060], [83, 1650], [86, 1420], [90, 1229], [100, 1150], [120, 1020], [140, 960]]);
          const top = keys(f, [[78, 900], [85, 815], [90, 787], [118, 800], [130, 900], [140, 1053], [146, 1180]]);
          dome.set(cx, top + 470, 940, keys(f, [[78, 40], [92, 6], [140, -4]]), -0.62, { blur: keys(f, [[78, 6], [84, 2], [88, 0]]) });
        }
        // burst: coins and receipts fly out of the bot, then orbit slowly; rings fade in around it
        if (f >= 142) {
          const t = eo(ramp(f, 142, 156)), z = keys(f, [[160, 1.08], [229, 0.97]]);
          const ang = (f - 156) * 0.0026;
          shards.forEach((s, i) => {
            const ca = Math.cos(ang), sa = Math.sin(ang);
            const X = (s.x * ca - s.y * sa) * z, Y = (s.x * sa + s.y * ca) * z;
            const x = lerp(rx, 960 + X, t), y = lerp(ry, 540 + Y, t);
            const spin = Math.cos((f + s.spin * 10) * 0.09 + s.spin);
            const sc = s.sz * lerp(0.2, 1, t);
            s.e.style.transform = `translate(${px(x - 32)},${px(y - 32)}) rotate(${(s.rot + f * s.vr).toFixed(1)}deg) scale(${(sc * (s.kind === "coin" ? Math.max(0.12, Math.abs(spin)) : 1)).toFixed(3)},${sc.toFixed(3)})`;
            s.e.style.opacity = ramp(f, 142, 145) * (1 - ramp(f, 226, 231) * 0.6);
            s.e.style.filter = blurOf(4 * (1 - t));
          });
          rings.setAttribute("transform", `translate(960 540) scale(${(keys(f, [[162, 0.82], [176, 1], [229, 1.06]])).toFixed(4)}) rotate(${((f - 162) * 0.25).toFixed(2)})`);
          rings.setAttribute("opacity", ramp(f, 162, 176).toFixed(3));
        }
      }

      // ---------- logo (open + close) ----------
      const logoOn = f < 41 || f >= 1340;
      show(logo, logoOn);
      if (logoOn) {
        const lw = logo.offsetWidth;
        if (f < 41) {
          const s = keys(f, [[0, 1], [30, 1.025], [40, 1.04]]);
          logo.style.transform = `translate(${px(960 - lw / 2)},${px(538 - 75)}) scale(${s.toFixed(4)})`;
          logo.style.transformOrigin = "50% 50%";
          logo.style.opacity = keys(f, [[0, 1], [28, 1], [34, 0.75], [38, 0.35], [40, 0.12], [40.9, 0]]);
          logo.style.filter = blurOf(keys(f, [[20, 0], [30, 0.6], [36, 2.2], [40, 3]]));
          logoBars.setAttribute("transform", `rotate(${keys(f, [[18, 0], [36, 28]]).toFixed(2)}) scale(${keys(f, [[20, 1], [36, 1.08]]).toFixed(4)})`);
          logoDot.setAttribute("opacity", f < 31 ? 1 : 0);
          logoLetters.forEach((l) => (l.style.opacity = 1));
          logoDot.setAttribute("transform", "");
        } else {
          logo.style.transform = `translate(${px(960 - lw / 2)},${px(538 - 75)})`;
          logo.style.opacity = keys(f, [[1340, 0.55], [1350, 0.75], [1358, 1]]);
          logo.style.filter = blurOf(keys(f, [[1340, 3], [1346, 1.5], [1352, 0.4], [1356, 0]]));
          logoBars.setAttribute("transform", `rotate(${keys(f, [[1341, -40], [1352, -6], [1360, 0]]).toFixed(2)}) scale(${keys(f, [[1341, 0.85], [1355, 1]]).toFixed(4)})`);
          logoDot.setAttribute("opacity", f >= 1351 ? 1 : 0);
          logoLetters.forEach((l, i) => { const a = 1342 + i * 2.6; l.style.opacity = ramp(f, a, a + 2).toFixed(3); l.style.transform = `translateX(${px(18 * (1 - eo(ramp(f, a, a + 5))))})`; });
        }
      }
      // the coin dot: drops out of the mark at the open, flies back into it at the end
      const ballOn = (f >= 31 && f < 40) || (f >= 1340 && f < 1351.5);
      show(ball.e, ballOn); show(rays, f >= 1340 && f < 1347);
      if (ballOn) {
        if (f < 40) {
          const x = lin(f, [[31, 800], [33, 812], [35, 864], [36, 835], [37, 749], [38, 614], [39, 365], [40, 250]]);
          const y = lin(f, [[31, 538], [33, 560], [35, 607], [36, 655], [37, 703], [38, 742], [39, 715], [40, 585]]);
          const d = keys(f, [[31, 24], [34, 46], [36, 80], [38, 120], [40, 190]]);
          ball.set(x, y, d, keys(f, [[31, 180], [40, 160]]), 0, { blur: keys(f, [[35, 0], [37, 3], [39, 5]]), bright: 1.08 });
        } else {
          const x = keys(f, [[1340, -260], [1341, -60], [1342, 300], [1343, 570], [1344, 700], [1345, 770], [1347, 829], [1349, 800], [1351, 770]]);
          const y = keys(f, [[1340, -100], [1341, 140], [1342, 560], [1343, 711], [1344, 690], [1345, 660], [1347, 634], [1349, 590], [1351, 548]]);
          const d = keys(f, [[1340, 1100], [1341, 760], [1342, 520], [1343, 384], [1344, 230], [1345, 130], [1347, 85], [1349, 46], [1351, 26]]);
          ball.set(x, y, d, keys(f, [[1340, 90], [1347, -30], [1351, 0]]), 0.2, { blur: keys(f, [[1340, 8], [1342, 3], [1344, 1], [1346, 0]]), glow: 30, bright: 1.1 });
          rays.style.transform = `translate(${px(x)},${px(y)}) scale(${(d / 380).toFixed(3)})`;
          rays.style.opacity = keys(f, [[1340, 0.6], [1342, 1], [1346, 0]]);
        }
      }

      // ---------- title: Meet Kovo / Spend Pilot ----------
      const titleOn = f >= 40 && f < 151;
      show(meet, titleOn); show(prod, titleOn && f >= 61.5);
      if (titleOn) {
        const my = keys(f, [[40, 518], [50, 518], [56, 500], [60, 470], [62, 442], [66, 432], [70, 427], [120, 451], [130, 513], [140, 653], [145, 787], [148, 912], [151, 1000]]);
        meet.style.transform = `translate(${px(960 - meet.offsetWidth / 2)},${px(my - 40)}) scale(${keys(f, [[40, 1.05], [48, 1], [70, 0.96], [140, 0.95]]).toFixed(4)})`;
        meet.style.opacity = keys(f, [[40, 0.55], [44, 0.9], [46, 1], [143, 1], [149, 0.2], [151, 0]]);
        meet.style.filter = blurOf(keys(f, [[40, 2.5], [45, 0.8], [48, 0], [141, 0], [145, 2], [149, 5]]));
        if (f >= 61.5) {
          const py = my + keys(f, [[62, 153], [70, 163], [140, 150]]);
          prod.style.transform = `translate(${px(960 - prod.offsetWidth / 2)},${px(py - 75)})`;
          prod.style.opacity = keys(f, [[143, 1], [148, 0.2], [150, 0]]);
          prod.style.filter = blurOf(keys(f, [[141, 0], [145, 2], [149, 6]]));
          prodW.forEach((w, i) => {
            const a = [62, 65.5][i], t = ramp(f, a, a + 4);
            w.style.opacity = (0.35 + 0.65 * t).toFixed(3) * (f >= a ? 1 : 0);
            w.style.color = mix("#9fb4e6", "#ffffff", t);
            w.style.transform = `translateY(${px(14 * (1 - eo(t)))}) scale(${(1 + 0.06 * (1 - eo(t))).toFixed(4)})`;
            w.style.filter = blurOf(3 * (1 - t));
          });
        }
      }

      // ---------- S4/S5: vendor table + dashboard ----------
      const aOn = show(A.s, f >= 231 && f < 463);
      if (aOn) {
        A.s.style.background = f < 402 ? "#fff" : "transparent";
        const tblX = 290, tblY = 672, iconX = tblX + TC.cat + 15, row2Y = tblY + 48 + ROWH * 1.5;
        let fx, fy, s;
        if (f < 290) { s = keys(f, [[231, 5.4], [233, 4.75], [235, 4.3], [237, 4.05], [240, 3.82], [250, 3.6], [262, 3.4], [289, 3.25]]); fx = iconX; fy = row2Y; }
        else if (f < 355) { s = keys(f, [[290, 2.1], [293, 1.96], [296, 1.86], [300, 1.79], [320, 1.65], [355, 1.56]]); fx = iconX + keys(f, [[290, 40], [320, 66], [355, 72]]); fy = row2Y; }
        else if (f < 402) { s = keys(f, [[355, 1.72], [401, 1.62]]); fx = keys(f, [[355, 1030], [401, 1075]]); fy = keys(f, [[355, 392], [401, 398]]); }
        else if (f < 430) { s = keys(f, [[402, 0.972], [430, 1.0]]); fx = keys(f, [[402, 962], [430, 950]]); fy = keys(f, [[402, 487], [430, 500]]); }
        else { s = keys(f, [[430, 2.36], [463, 2.28]]); fx = keys(f, [[430, 455], [463, 470]]); fy = keys(f, [[430, 818], [463, 812]]); }
        cam(A.w, fx, fy, s);
        app.style.boxShadow = f >= 402 && f < 430 ? "" : "none";
        app.style.borderRadius = f >= 402 && f < 430 ? "18px" : "0";
        // the hovered Card cell at the first frames
        const hov = 1 - ramp(f, 231, 235);
        const cat2 = vRows[1].querySelector(".catic");
        cat2.style.transform = `scale(${(1 + 0.45 * hov).toFixed(3)})`;
        cat2.style.borderColor = mix("#dfe2e8", "#1b2130", hov);
        cat2.style.borderWidth = (1.5 + 1.5 * hov).toFixed(2) + "px";
        // status lighting (S4b)
        vRows.forEach((r, i) => {
          const bg = r.querySelector(".bg"), stp = r.querySelector(".st");
          let col = null, a = 0;
          if (i === 4) { col = "#fff6dc"; a = ramp(f, 299, 302) * (1 - ramp(f, 334, 342)); }
          if (i === 3) { col = "#ffecee"; a = ramp(f, 310, 313) * (1 - ramp(f, 328, 336)); }
          if (i === 5) { col = "#fff6dc"; a = ramp(f, 317, 320) * (1 - ramp(f, 340, 348)); }
          if (col) { bg.style.background = col; bg.style.opacity = a.toFixed(3); } else bg.style.opacity = 0;
          const lit = f >= 300 && f < 463;
          stp.className = "st" + (lit ? (ROWS[i].st === "Approved" ? (f >= 306 ? " ok" : "") : ROWS[i].st === "Unapproved" ? (f >= 311 ? " bad" : "") : (f >= 301 + i * 0.6 ? " warn" : "")) : "");
          const pop = ROWS[i].st === "Approved" ? ramp(f, 306, 308) * (1 - ramp(f, 309, 314)) : ROWS[i].st === "Unapproved" ? ramp(f, 311, 312.5) * (1 - ramp(f, 313, 318)) : 0;
          stp.style.transform = `scale(${(1 + 0.12 * pop).toFixed(3)})`;
        });
        // cursor
        const cOn = f >= 355;
        show(vCur, cOn);
        if (cOn) {
          const cx = f < 402 ? keys(f, [[355, 1210], [380, 1260], [401, 1330]]) : f < 430 ? keys(f, [[402, 1300], [415, 1250], [430, 1180]]) : keys(f, [[430, 760], [445, 735], [463, 742]]);
          const cy = f < 402 ? keys(f, [[355, 562], [380, 560], [401, 555]]) : f < 430 ? keys(f, [[402, 590], [430, 640]]) : keys(f, [[430, 812], [445, 822], [463, 818]]);
          vCur.style.transform = `translate(${px(cx)},${px(cy)}) scale(${(1 / s * (f < 402 ? 1.4 : f < 430 ? 1.2 : 1.5) * 1.4).toFixed(3)})`;
        }
        // tint into the graph's sky
        flash.style.display = f >= 455 ? "block" : "none";
        if (f >= 455) flash.style.background = `rgba(60,110,220,${(0.85 * sm(ramp(f, 455, 463))).toFixed(3)})`;
      }
      const flashUsed = aOn && f >= 455;

      // ---------- S6/S7: graph → detail page → window tilt ----------
      const gOn = show(G.s, f >= 463 && f < 730);
      if (gOn) {
        let s, fx, fy, pre = "";
        if (f < 627) {
          s = keys(f, [[463, 1.8], [478, 1.82], [500, 1.9], [536, 1.9], [538, 1.78], [541, 1.48], [545, 1.25], [600, 1.21], [626, 1.2]]);
          fx = keys(f, [[463, -6], [476, 0], [484, 80], [492, 170], [500, 206], [536, 214], [539, 260], [542, 340], [545, 392], [600, 405], [626, 430]]);
          fy = keys(f, [[463, 17], [500, 15], [536, 15], [539, -40], [542, -130], [545, -168], [600, -183], [626, -182]]);
        } else if (f < 660) {
          s = 1.21;
          fx = keys(f, [[627, 1000], [628, 1089], [634, 1300], [640, 1390], [660, 1417]]);
          fy = -182;
        } else if (f < 720) {
          s = keys(f, [[660, 1.21], [672, 1.17], [688, 1.1], [700, 1.083], [719, 1.07]]);
          fx = keys(f, [[660, 1417], [700, 1408], [719, 1400]]);
          fy = keys(f, [[660, -182], [700, -198], [719, -195]]);
        } else {
          s = keys(f, [[720, 1.07], [725, 1.0], [729.9, 0.9]]); fx = 1400; fy = keys(f, [[720, -195], [729.9, -230]]);
          pre = `perspective(1500px) rotateX(${keys(f, [[720, 0], [723, 6], [726, 18], [729.9, 38]]).toFixed(2)}deg)`;
        }
        cam(G.w, fx, fy, s, pre);
        // page background (light) fades in under the panel; outside the page the sky shows
        const pg = ramp(f, 628, 638);
        page.style.display = f >= 627 ? "block" : "none";
        abs(page, 640, -630, 1530, 870);
        page.style.opacity = pg.toFixed(3);
        G.w.style.clipPath = f >= 638 ? "polygon(640px -630px, 2170px -630px, 2170px 240px, 640px 240px)" : "none";
        page.style.outline = f >= 680 ? `2px solid rgba(255,255,255,${(0.7 * ramp(f, 680, 700)).toFixed(3)})` : "none";
        page.style.boxShadow = f >= 680 ? `0 30px 90px rgba(5,15,50,${(0.35 * ramp(f, 680, 700)).toFixed(3)}), 0 0 0 2px rgba(255,255,255,.6)` : "none";
        page.style.borderRadius = f >= 670 ? "22px" : "0";
        // nodes go light-themed on the page
        cardN.style.opacity = f >= 627 ? 1 - pg : 1;
        stub.style.opacity = (f >= 627 ? 1 - pg : 1) * ramp(f, 466, 474);
        stub.style.transform = `translateX(${px(-60 * (1 - eo(ramp(f, 466, 478))))})`;
        const gx = gV, gb = gB;
        // groups: header bars until 538, then they open into boxes
        const op = eo(ramp(f, 538, 548)), grow = eo(ramp(f, 548, 560));
        abs(gx, 352, lerp(-120, -470, op), lerp(700, lerp(680, 757, grow), op), lerp(56, lerp(358, 428, grow), op));
        abs(gb, 352, lerp(70, 58, op), lerp(700, 330, op), lerp(56, 330, op));
        const gOp = f < 478 ? 0 : ramp(f, 486, 492);
        gx.style.opacity = gb.style.opacity = gOp.toFixed(3);
        gx.style.transform = gb.style.transform = `translateX(${px(40 * (1 - eo(ramp(f, 486, 496))))})`;
        if (f >= 627) {
          gx.style.background = f >= 627 ? `linear-gradient(110deg, rgba(255,255,255,${(0.34 + 0.2 * pg).toFixed(2)}), rgba(235,240,250,${(0.12 + 0.5 * pg).toFixed(2)}))` : "";
          gx.style.borderColor = gb.style.borderColor = pg > 0.5 ? "#dfe3ea" : "rgba(255,255,255,.7)";
          gb.style.background = gx.style.background;
        } else { gx.style.background = gb.style.background = ""; gx.style.borderColor = gb.style.borderColor = ""; }
        gx.querySelector(".gl").style.color = gb.querySelector(".gl").style.color = pg > 0.5 ? "#4c5466" : "";
        // items
        const IP = [[18, 60], [18, 155], [18, 250], [18, 345], [372, 60], [372, 155]];
        vItems.forEach((it, i) => {
          const a = i < 4 ? 550 + i * 3.5 : 568 + (i - 4) * 3;
          const t = eo(ramp(f, a, a + 5));
          it.style.left = IP[i][0] + "px"; it.style.top = IP[i][1] + "px";
          it.style.opacity = t.toFixed(3);
          it.style.transform = `translateY(${px(16 * (1 - t))}) scale(${(0.94 + 0.06 * t).toFixed(4)})`;
          it.style.boxShadow = i === 4 && f >= 620 ? `0 0 0 ${px(2.5 * ramp(f, 620, 624))} #1b2130, 0 6px 18px rgba(10,30,90,.1)` : "";
        });
        bItems.forEach((it, i) => {
          const t = eo(ramp(f, 574 + i * 3, 579 + i * 3));
          it.style.left = "18px"; it.style.top = 60 + i * 95 + "px";
          it.style.opacity = t.toFixed(3); it.style.transform = `translateY(${px(16 * (1 - t))})`;
        });
        // links: card → trunk → groups (grow in), then → each item once groups open
        const lg = ramp(f, 476, 490);
        const trunkX = 290, lp = [];
        lp.push(`M215 0 H${trunkX}`);
        const ky = lerp(-92, -400, op), by = lerp(98, 120, op);
        lp.push(`M${trunkX} 0 V${ky + 24} Q${trunkX} ${ky} ${trunkX + 24} ${ky} H352`);
        lp.push(`M${trunkX} 0 V${by - 24} Q${trunkX} ${by} ${trunkX + 24} ${by} H352`);
        lp.push(`M-260 0 H-215`);
        if (f >= 548) {
          const itY = [-470 + 96, -470 + 191, -470 + 286, -470 + 381];
          itY.forEach((y) => lp.push(`M${trunkX} ${y + 20} Q${trunkX} ${y} ${trunkX + 20} ${y} H370`));
          lp.push(`M${trunkX} ${-400} V${58 + 96 + 95}`);
          lp.push(`M${trunkX} ${58 + 96 + 95 - 20} Q${trunkX} ${58 + 96 + 95} ${trunkX + 20} ${58 + 96 + 95} H370`);
        }
        links.innerHTML = lp.map((d, i) => `<path d="${d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - (i === 3 ? ramp(f, 468, 476) : i < 3 ? lg : ramp(f, 548, 556))).toFixed(3)}"/>`).join("");
        links.style.opacity = f >= 627 ? 1 - pg * 0.6 : 1;
        links.querySelectorAll("path").forEach((p) => (p.style.stroke = pg > 0.5 ? "#c9cfdb" : ""));
        // panel slides in; donuts draw; page header drops in
        pnl.style.display = phead.style.display = f >= 626 ? "block" : "none";
        if (f >= 626) {
          pnl.style.transform = `translateX(${px(900 * (1 - eo(ramp(f, 626, 632))))})`;
          dnSegs.forEach((c, i) => { const t = eo(ramp(f, 633 + i * 0.8, 650 + i * 0.8)); c.setAttribute("stroke-dasharray", `${(+c.dataset.len * t).toFixed(1)} 999`); });
          phead.style.transform = `translateY(${px(-150 * (1 - eo(ramp(f, 630, 640))))})`;
          phead.style.opacity = ramp(f, 630, 634);
        }
        const gcOn = (f >= 572 && f < 627) || (f >= 640 && f < 724);
        show(gCur, gcOn);
        if (gcOn) {
          const cx = f < 627 ? keys(f, [[572, 600], [585, 700], [600, 820], [615, 860], [622, 900], [626, 905]]) : keys(f, [[640, 1700], [660, 1720], [690, 1640], [705, 1580], [723, 760]]);
          const cy = f < 627 ? keys(f, [[572, -260], [590, -340], [610, -420], [622, -436], [626, -440]]) : keys(f, [[640, -430], [660, -400], [690, -330], [705, -280], [723, 40]]);
          gCur.style.transform = `translate(${px(cx)},${px(cy)}) scale(${(1.2 / s * 1.3).toFixed(3)})`;
        }
      }

      // ---------- S8: chat ----------
      const cOn = show(C.s, f >= 730 && f < 834);
      if (cOn) {
        const rx = keys(f, [[730, -24], [733, -14], [737, -7], [742, -2.5], [748, 0]]);
        const s = keys(f, [[730, 0.86], [735, 0.92], [745, 0.95], [752, 1.0], [760, 1.07], [770, 1.08], [834, 1.11]]);
        const fy = keys(f, [[730, 480], [745, 490], [760, 500], [834, 505]]);
        cam(C.w, 900, fy, s, `perspective(1500px) rotateX(${rx.toFixed(2)}deg)`);
        chat.style.borderRadius = f < 760 ? "18px" : "0";
        const n = Math.round(PROMPT.length * ramp(f, 731, 768));
        const pre = f < 770;
        greet.style.display = boxC.style.display = chips.style.display = pre ? "block" : "none";
        chips.style.display = pre ? "flex" : "none";
        typed.textContent = PROMPT.slice(0, n) + (pre && Math.floor(f / 8) % 2 ? "|" : "");
        sent.style.display = f >= 770 ? "block" : "none";
        sent.style.opacity = ramp(f, 770, 772);
        think.style.display = f >= 771 && f < 799 ? "flex" : "none";
        spin.style.transform = `rotate(${(f * 9).toFixed(0)}deg)`;
        think.style.opacity = (0.55 + 0.45 * Math.sin(f * 0.35) ** 2).toFixed(3);
        stopB.style.display = f >= 799 ? "block" : "none";
        if (f >= 799) { const t = eo(ramp(f, 799, 804)); stopB.style.opacity = t; stopB.style.transform = `translateY(${px(14 * (1 - t))})`; }
      }

      // ---------- S9: activity page ----------
      const pOn = show(P.s, f >= 834 && f < 954);
      if (pOn) {
        const s = keys(f, [[834, 1.15], [868, 1.16], [880, 1.17], [893, 1.28], [905, 1.32], [953, 1.36]]);
        const fx = keys(f, [[834, 517], [880, 517], [905, 422], [953, 432]]);
        const fy = keys(f, [[834, 339], [868, 345], [880, 426], [893, 760], [905, 958], [953, 972]]);
        cam(P.w, fx, fy, s);
        prWords.forEach((w) => { const k = RED.indexOf(w.textContent); w.className = "pw" + (k >= 0 && f >= 845 + k * 2.2 ? " redw" : ""); });
        thSec.style.opacity = ramp(f, 874, 880);
        tcBox.style.opacity = ramp(f, 882, 885);
        tcLines.forEach((l, i) => (l.style.opacity = ramp(f, 884 + i * 2.2, 886 + i * 2.2)));
        tcf.style.opacity = ramp(f, 892, 895);
        trBox.style.opacity = trf.style.opacity = ramp(f, 897, 900);
        trBox.style.borderColor = mix("#e9ebf0", "#e0566a", ramp(f, 902, 904));
        trBox.style.background = mix("#ffffff", "#fff8f9", ramp(f, 902, 904));
      }

      // ---------- S10: spend-alerts card + bots ----------
      const kOn = show(K.s, f >= 954 && f < 1067);
      if (kOn) {
        if (f < 1014) {
          const s = keys(f, [[954, 0.95], [1000, 0.986], [1013, 0.995]]);
          const fx = keys(f, [[954, 700 - 22], [1000, 700 + 35], [1013, 700 + 45]]), fy = keys(f, [[954, 510 + 3], [1000, 510 + 5], [1013, 510 + 6]]);
          cam(K.w, fx, fy, s, `perspective(2200px) rotateY(${keys(f, [[954, -7], [1013, -3]]).toFixed(2)}deg) rotateX(${keys(f, [[954, 3], [1013, 1]]).toFixed(2)}deg)`);
          comp.style.borderRadius = "22px";
          // left-bottom bot rolls across the card and settles half off-screen; right-top bot drops in
          botL.set(keys(f, [[954, 1114], [958, 820], [962, 580], [968, 340], [975, 200], [990, 110], [1013, 77]]), keys(f, [[954, 787], [962, 820], [975, 860], [1013, 850]]), keys(f, [[954, 300], [962, 330], [975, 380], [1013, 392]]),
            keys(f, [[954, -150], [970, -40], [990, 22], [1013, 30]]), -0.15, { blur: keys(f, [[954, 3], [962, 1], [968, 0]]), alpha: keys(f, [[954, 0.55], [958, 1]]) });
          botR.set(keys(f, [[960, 2080], [964, 1930], [970, 1860], [1013, 1834]]), keys(f, [[960, 120], [970, 140], [1013, 127]]), 232, keys(f, [[960, 120], [972, -50], [1013, -38]]), 0.25, { blur: keys(f, [[960, 4], [966, 0]]) });
        } else {
          const s = keys(f, [[1014, 1.67], [1066, 1.63]]);
          cam(K.w, keys(f, [[1014, 640], [1066, 690]]), keys(f, [[1014, 514], [1066, 520]]), s);
          comp.style.borderRadius = "0";
        }
      }

      // ---------- S11: phrase + hills + bots ----------
      const phOn = show(phrase, f >= 1067 && f < 1160);
      if (phOn) {
        // each word lands grey and soft, then whitens; the line re-centres as words append
        const AT = [1067, 1069.5, 1097, 1101, 1105.5, 1110, 1114.5];
        let total = 0; const ws = phW.map((w) => w.offsetWidth);
        const shown = AT.filter((a) => f >= a).length;
        const target = ws.slice(0, shown).reduce((a, b) => a + b, 0);
        // smooth the width the line centres on
        const wPrev = ws.slice(0, Math.max(1, shown - 1)).reduce((a, b) => a + b, 0);
        const tLast = eo(ramp(f, AT[shown - 1], AT[shown - 1] + 5));
        total = shown <= 2 ? ws[0] + ws[1] : lerp(wPrev, target, tLast);
        const sc = keys(f, [[1067, 1], [1080, 0.98], [1092, 0.86], [1100, 0.8], [1115, 0.77], [1160, 0.76]]);
        const y = keys(f, [[1067, 528], [1080, 528], [1100, 512], [1130, 500], [1150, 533], [1160, 640]]);
        phrase.style.transform = `translate(${px(960 - (total * sc) / 2)},${px(y - 52 * sc)}) scale(${sc.toFixed(4)})`;
        phrase.style.transformOrigin = "0 0";
        phW.forEach((w, i) => {
          const t = ramp(f, AT[i], AT[i] + 3.5);
          w.style.opacity = f >= AT[i] ? (0.25 + 0.75 * t).toFixed(3) : 0;
          w.style.color = mix("#8ea3d8", "#ffffff", t);
          w.style.filter = blurOf(2.5 * (1 - t));
        });
      }
      if (fl11) {
        const P0 = [[1095, 640, 600, 150], [1099, 905, 300, 120], [1103, 1120, 255, 132], [1106, 1270, 360, 118], [1108, 760, 650, 126], [1111, 1050, 640, 140], [1113, 1190, 520, 112], [1116, 840, 410, 104]];
        botsK.forEach((b, i) => {
          const [a, x, y, d] = P0[i];
          const t = eo(ramp(f, a, a + 6));
          const bob = Math.sin((f - a) * 0.08 + i) * 8;
          const drift = (f - 1092) * (i % 2 ? 0.25 : -0.2);
          const yy = y + bob + keys(f, [[1145, 0], [1160, 90]]);
          b.set(x + drift, yy, d * lerp(0.4, 1, t), keys(f, [[a, -140 + i * 10], [a + 10, (i % 3 - 1) * 30], [1160, (i % 3 - 1) * 30 + 20]]), (i % 2 ? 0.2 : -0.1),
            { alpha: f >= a ? 1 : 0, glow: 26 * (1 - ramp(f, a + 2, a + 10)), bright: 1 + 0.25 * (1 - ramp(f, a + 2, a + 9)) });
        });
      }

      // ---------- S12: header close-up, badge steps to Approved ----------
      const hOn = show(Hh.s, f >= 1160 && f < 1243);
      if (hOn) {
        Hh.s.style.background = "#f7f8fa";
        const s = f < 1190 ? keys(f, [[1160, 1.25], [1189, 1.32]]) : f < 1209 ? keys(f, [[1190, 1.9], [1208, 1.97]]) : keys(f, [[1209, 2.45], [1222, 2.65], [1242, 2.85]]);
        const fx = f < 1190 ? keys(f, [[1160, 538], [1189, 540]]) : f < 1209 ? keys(f, [[1190, 523], [1208, 525]]) : keys(f, [[1209, 515], [1242, 505]]);
        const fy = f < 1190 ? keys(f, [[1160, 369], [1189, 365]]) : f < 1209 ? keys(f, [[1190, 272], [1208, 272]]) : keys(f, [[1209, 276], [1242, 272]]);
        cam(Hh.w, fx, fy, s);
        const b = f < 1190 ? ["Critical", "crit"] : f < 1200 ? ["High", "high"] : f < 1209 ? ["Medium", "med"] : f < 1222 ? ["Low", "low"] : ["Approved", "ok"];
        if (b[0] !== lastBadge) { badge.innerHTML = b[0] === "Approved" ? `<span class="st ok" style="height:44px;font-size:24px;padding:0 20px;gap:12px"><i style="width:13px;height:13px"></i>Approved</span>` : `<span class="pill ${b[1]}" style="height:38px;font-size:22px;padding:0 12px">${b[0]}</span>`; lastBadge = b[0]; }
        glowG.style.opacity = ramp(f, 1221, 1228).toFixed(3);
        Hh.w.style.filter = blurOf(keys(f, [[1160, 0.4], [1189, 0.4], [1190, 0.3], [1222, 0.3], [1225, 0.8], [1242, 1]]));
      }

      // ---------- S13: get started ----------
      const gsOn = f >= 1243 && f < 1342;
      show(get1, gsOn); show(get2, gsOn);
      if (gsOn) {
        const a = keys(f, [[1243, 1], [1335, 1], [1338, 0.6], [1341, 0.2], [1342, 0]]);
        const dy = keys(f, [[1243, 0], [1338, -4]]);
        get1.style.transform = `translate(${px(960 - get1.offsetWidth / 2)},${px(461 - 20 + dy)})`;
        get2.style.transform = `translate(${px(960 - get2.offsetWidth / 2)},${px(548 - 40 + dy)})`;
        get1.style.opacity = get2.style.opacity = a;
        get1.style.filter = get2.style.filter = blurOf(keys(f, [[1336, 0], [1341, 4]]));
      }

      // overlays
      if (!flashUsed) {
        const wf = f >= 229 && f < 231 ? keys(f, [[229.2, 0], [230, 0.55], [230.7, 0.9]]) : 0;
        flash.style.display = wf > 0.01 ? "block" : "none";
        flash.style.background = `rgba(255,255,255,${wf.toFixed(3)})`;
      }
      // the logo's sky at the very end is a touch brighter
      if (f >= 1340) sky.style.filter = "none";
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R0._f));
    tl.seek(0.001).seek(0);
    window.__render = render;
    return tl;
  };
  window.SCENE = SCENE;
})();
