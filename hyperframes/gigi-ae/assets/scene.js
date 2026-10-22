// Gigi in After Effects — 10.6 s, 30 fps, 318 frames. One continuous session in the real (dark) After Effects UI,
// animating storyboard frame 04: the camera rides the work, punching in on every interaction, and every click does
// what it does in the app.
//   0–26     the app rises in from below, slow push
//   26–60    the playhead is dragged to 1 s: the comp scrubs in the viewer, the collage pops in
//   60–132   "Which" twirled open, Scale stopwatch set at 1 s, playhead back to 10 f, Scale scrubbed to 0 %
//   132–176  both keyframes marquee-selected, right-click → Keyframe Assistant → Easy Ease
//   176–220  Graph Editor: the speed graph; the out-handle is dragged for a snappier landing
//   220–254  Play: the preview runs, the word scales in, the cache bar fills green
//   254–296  Composition → Add to Render Queue → Render; progress fills, Done
//   296–318  pull out, the whole window slides off left
(function () {
  const FPS = 30, FRAMES = 318;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  const sio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t, s = 1.7) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  // keyed glide: [frame, value]; two keys on one frame make a cut
  const glide = (f, k, e = sio) => {
    if (f < k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (f < k[i][0]) {
      const a = k[i - 1], b = k[i];
      return lerp(a[1], b[1], e((f - a[0]) / (b[0] - a[0])));
    }
    return k[k.length - 1][1];
  };
  // cubic-bezier easing (like CSS): progress and speed at u
  const bez = (x1, y1, x2, y2) => {
    const X = (s) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3, Y = (s) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
    const dX = (s) => 3 * x1 * (1 - s) ** 2 + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s, dY = (s) => 3 * y1 * (1 - s) ** 2 + 6 * (y2 - y1) * s * (1 - s) + 3 * (1 - y2) * s * s;
    const solve = (u) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (X(m) < u) lo = m; else hi = m; } return (lo + hi) / 2; };
    return { at: (u) => Y(solve(clamp(u, 0, 1))), speed: (u) => { const s = solve(clamp(u, 0.0005, 0.9995)); return dY(s) / Math.max(1e-4, dX(s)); } };
  };

  // ---- timeline geometry (UI px) ----
  const TLY = 640, ROW0 = 730, RH = 24, TX0 = 640, TX1 = 1900, SPAN = 150;
  const tx = (t) => TX0 + (t / SPAN) * (TX1 - TX0);
  const tcode = (n) => { n = Math.max(0, Math.round(n)); const s = Math.floor(n / 30); return `0;00;${String(s).padStart(2, "0")};${String(n % 30).padStart(2, "0")}`; };

  // ---- the story, in frames ----
  const T = {
    grab1: 32, drag1: [34, 56], twirl: 66, watch: 80, grab2: 88, drag2: [90, 102],
    scrub: [112, 126], mq: [138, 148], rclick: 154, hover: 160, ease: 170,
    graph: 186, hgrab: 196, hdrag: [198, 210], play: 222, comp: 258, rq: 266, render: 280, prog: [281, 291],
    out: [292, 300], whip: [302, 318],
  };
  const CLICKS = [T.grab1, T.twirl, T.watch, T.grab2, T.scrub[0] - 2, T.mq[0] - 2, T.rclick, T.ease, T.graph, T.hgrab, T.play, T.comp, T.rq, T.render];

  // layers (After Effects label colours)
  const LAYERS = [
    ["T", "Which", "#c4453f", 0, 150], ["T", "respectfully", "#c4453f", 45, 150], ["T", "is a terrible database", "#c4453f", 90, 150],
    ["img", "phone.jpg", "#8fb8b8", 0, 150], ["img", "cal.jpg", "#8fb8b8", 0, 150], ["img", "chat.jpg", "#8fb8b8", 0, 150],
    ["img", "keys.jpg", "#8fb8b8", 0, 150], ["img", "network.jpg", "#8fb8b8", 0, 150], ["sol", "Background", "#b0a385", 0, 150],
  ];
  const PROPS = [["Text", null], ["Transform", null], ["Anchor Point", "0.0,0.0"], ["Position", "960.0,540.0"], ["Scale", ""], ["Rotation", "0x+0.0°"], ["Opacity", "100%"]];
  const SCALE_ROW = 1 + 4; // row index of Scale once twirled open
  const COLLAGE = [["cal", 150, 70, 300, 200, -4], ["chat", -30, 470, 330, 190, 3], ["phone", 1180, 60, 300, 172, 5], ["keys", 1290, 330, 330, 186, -3], ["network", 1080, 640, 340, 270, 2], ["convo", 300, 690, 330, 188, -2]];

  const ICO = {
    sel: '<path d="M6 3l12 9-6 1 3 7-2 1-3-7-4 4z"/>', hand: '<path d="M8 11V5a1.5 1.5 0 013 0v5V4a1.5 1.5 0 013 0v6V5.5a1.5 1.5 0 013 0V14c0 4-2.5 7-6 7s-5-2-6.5-4L3 12.5a1.5 1.5 0 012.3-1.8z"/>',
    zoom: '<circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2.4"/>',
    rot: '<path d="M5 12a7 7 0 1112 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 12v5h-5" fill="none" stroke="currentColor" stroke-width="2"/>',
    cam: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 10l6-3v10l-6-3z"/>', rect: '<rect x="4" y="5" width="16" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>',
    pen: '<path d="M12 3l6 10-6 8-6-8z" fill="none" stroke="currentColor" stroke-width="2"/>', type: '<path d="M5 5h14v3M12 5v14M9 19h6" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    brush: '<path d="M14 4l6 6-8 8-4-4z"/><path d="M7 15c-3 0-4 3-4 6 3 0 6-1 6-4z"/>', stamp: '<path d="M9 4h6v6l3 3v3H6v-3l3-3z"/><path d="M5 19h14"/>',
    eraser: '<path d="M4 15l8-8 7 7-6 6H8z"/>', puppet: '<circle cx="12" cy="5" r="2"/><path d="M12 8v7M7 11h10M9 21l3-6 3 6" fill="none" stroke="currentColor" stroke-width="2"/>',
    eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6"/>',
    comp: '<rect x="3" y="5" width="18" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18" stroke="currentColor" stroke-width="2"/>',
    img: '<rect x="3" y="5" width="18" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 16l4-5 3 3 2-2 3 4z"/>',
    folder: '<path d="M3 6h7l2 2h9v11H3z"/>', watch: '<circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 13V9M10 3h4" stroke="currentColor" stroke-width="2"/>',
    graph: '<path d="M3 20h18M3 4v16" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M5 18C10 18 9 6 19 6" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="19" cy="6" r="2"/>',
    first: '<path d="M6 5v14M19 5l-10 7 10 7z"/>', prev: '<path d="M7 5v14M18 5l-9 7 9 7z"/>', play: '<path d="M7 4l13 8-13 8z"/>', next: '<path d="M17 5v14M6 5l9 7-9 7z"/>', last: '<path d="M18 5v14M5 5l10 7-10 7z"/>',
    link: '<path d="M9 15l6-6M8 11l-2 2a3 3 0 004 4l2-2M16 13l2-2a3 3 0 00-4-4l-2 2" fill="none" stroke="currentColor" stroke-width="2"/>',
  };
  const svg = (k, s = 16, c = "") => `<svg class="ico ${c}" viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor">${ICO[k]}</svg>`;
  const KF = '<svg class="kfi" viewBox="0 0 14 14"><path class="d" d="M7 1L13 7 7 13 1 7z"/><path class="e" d="M2 1.5h10L7 7zM2 12.5h10L7 7z"/></svg>';

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const A = (parent, cls, x, y, w, h, html) => { const e = el("div", cls, parent, html); Object.assign(e.style, { left: px(x), top: px(y) }); if (w != null) e.style.width = px(w); if (h != null) e.style.height = px(h); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };

    const gl = el("div", "gl", stage);
    const cam = el("div", "cam", stage);
    const ui = el("div", "ui", cam);

    // ---- menu bar + tools
    const mb = A(ui, "mb", 0, 0, 1920, 26);
    const MENUS = [["File", 12], ["Edit", 50], ["Composition", 88], ["Layer", 180], ["Effect", 224], ["Animation", 272], ["View", 346], ["Window", 388], ["Help", 446]];
    const menuEls = MENUS.map(([n, x]) => A(mb, "mi", x, 0, null, 26, n));
    A(mb, "app", 760, 0, 400, 26, "Adobe After Effects 2025 - Gigi Promo.aep *");
    const tb = A(ui, "tb", 0, 26, 1920, 36);
    ["sel", "hand", "zoom", "rot", "cam", "rect", "pen", "type", "brush", "stamp", "eraser", "puppet"].forEach((kk, i) => A(tb, "tool" + (i === 0 ? " on" : ""), 10 + i * 34, 4, 28, 28, svg(kk, 16)));
    A(tb, "tbt", 440, 0, 300, 36, `<span class="cb">☐</span> Snapping`);
    A(tb, "ws", 1240, 0, 660, 36, `<span class="on">Default</span><span>Review</span><span>Learn</span><span>Standard</span><span>Small Screen</span><span>Libraries</span><span class="se">⌕</span>`);

    // ---- project panel
    const pp = A(ui, "pnl", 4, 66, 326, 570);
    A(pp, "tabs", 0, 0, 326, 28, `<span class="on">Project ≡</span><span>Effect Controls Which</span>`);
    A(pp, "pthumb", 10, 38, 96, 54);
    A(pp, "pinfo", 116, 38, 200, 60, `<b>04 Database</b> ▾, used 1 time<br>1920 x 1080 (1.00)<br>Δ 0;00;05;00, 30.00 fps`);
    A(pp, "srch", 10, 104, 306, 22, "⌕");
    A(pp, "lh", 0, 132, 326, 22, `<span style="left:30px">Name</span><span style="left:196px">Type</span><span style="left:262px">Size</span>`);
    const PJ = [["folder", "Comps", "Folder", ""], ["comp", "  01 Who knows", "Composition", ""], ["comp", "  02 All the data", "Composition", ""], ["comp", "  03 No access", "Composition", ""], ["comp", "  04 Database", "Composition", ""], ["comp", "  05 Ask around", "Composition", ""],
      ["folder", "Footage", "Folder", ""], ["img", "  phone.jpg", "JPEG", "212 KB"], ["img", "  cal.jpg", "JPEG", "188 KB"], ["img", "  chat.jpg", "JPEG", "164 KB"], ["img", "  keys.jpg", "JPEG", "201 KB"], ["img", "  network.jpg", "JPEG", "176 KB"], ["folder", "Solids", "Folder", ""]];
    PJ.forEach(([ic, n, t, s], i) => A(pp, "pr" + (i === 4 ? " on" : ""), 0, 156 + i * 21, 326, 21, `<span class="ic ${ic}" style="left:${n.startsWith("  ") ? 26 : 10}px">${svg(ic, 13)}</span><span style="left:${n.startsWith("  ") ? 46 : 30}px">${n.trim()}</span><span style="left:196px" class="dim">${t}</span><span style="left:262px" class="dim">${s}</span>`));

    // ---- composition viewer
    const vp = A(ui, "pnl", 334, 66, 1162, 570);
    A(vp, "tabs", 0, 0, 1162, 28, `<span class="on">${svg("comp", 13)} Composition <b>04 Database</b> ≡</span><span>Layer (none)</span><span>Footage (none)</span>`);
    A(vp, "subt", 0, 28, 1162, 24, `<span class="on">04 Database</span>`);
    const va = A(vp, "va", 0, 52, 1162, 488);
    const compBox = A(va, "comp", 181, 19, 800, 450);
    const kk = 800 / 1640;
    const pops = COLLAGE.map(([src, cx, cy, cw, ch, r]) => { const a = A(compBox, "cimg", cx * kk, cy * kk, cw * kk, ch * kk, `<img src="assets/sb/${src}.jpg">`); a.dataset.r = r; return a; });
    const word = A(compBox, "word", 400, 225, null, null, "Which");
    const selOut = A(compBox, "lsel", 0, 0, 10, 10);
    const vbar = A(vp, "vbar", 0, 540, 1162, 30, `<span>50% ⌄</span><span>⧉</span><span class="tcv">0;00;00;00</span><span>${svg("cam", 13)}</span><span>Full ⌄</span><span>Active Camera ⌄</span><span>1 View ⌄</span><span>+0.0</span>`);
    const tcv = vbar.querySelector(".tcv");

    // ---- right column: preview, effects & presets, character
    const rp = A(ui, "pnl", 1500, 66, 416, 150);
    A(rp, "tabs", 0, 0, 416, 28, `<span class="on">Preview ≡</span><span>Info</span><span>Audio</span>`);
    const pbtn = ["first", "prev", "play", "next", "last"].map((n, i) => A(rp, "pb", 40 + i * 44, 36, 36, 28, svg(n, 15)));
    A(rp, "plist", 14, 74, 390, 70, `Shortcut <i>Spacebar ⌄</i><br>☑ Cache Before Playback<br>Frame Rate <i>(30)</i> &nbsp; Skip <i>0</i> &nbsp; Resolution <i>Auto</i>`);
    const ep = A(ui, "pnl", 1500, 220, 416, 230);
    A(ep, "tabs", 0, 0, 416, 28, `<span class="on">Effects &amp; Presets ≡</span><span>Libraries</span>`);
    A(ep, "srch", 10, 36, 396, 22, "⌕");
    A(ep, "tree", 10, 64, 396, 160, ["* Animation Presets", "3D Channel", "Audio", "Blur &amp; Sharpen", "Channel", "Color Correction", "Distort", "Expression Controls"].map((n) => `<div>▸ ${n}</div>`).join(""));
    const cp = A(ui, "pnl", 1500, 454, 416, 182);
    A(cp, "tabs", 0, 0, 416, 28, `<span class="on">Character ≡</span><span>Paragraph</span><span>Align</span>`);
    A(cp, "char", 12, 38, 392, 140, `<div class="ff">Liberation Serif ⌄</div><div class="ff">Regular ⌄</div><div class="r"><span>T&nbsp; <i>150 px</i></span><span>A&nbsp; <i>Auto</i></span></div><div class="r"><span>VA <i>Metrics</i></span><span>AV <i>-20</i></span></div><div class="r"><span class="swk"></span><span class="sww"></span></div>`);

    // ---- timeline
    const tp = A(ui, "pnl", 4, TLY, 1912, 436);
    const ttabs = A(tp, "tabs", 0, 0, 1912, 26, `<span class="rqt">Render Queue</span><span class="on cmt">■ 04 Database ≡</span>`);
    const rqTab = ttabs.querySelector(".rqt"), cmTab = ttabs.querySelector(".cmt");
    const tlBody = A(tp, "", 0, 0, 1912, 436); // everything under the tabs that the render queue replaces
    const tch = A(tlBody, "tch", 0, 26, 636, 38, `<span class="tc">0;00;00;00</span><span class="fr">00000 (30.00 fps)</span><span class="srch2">⌕</span>`);
    const tcEl = tch.querySelector(".tc"), frEl = tch.querySelector(".fr");
    A(tlBody, "swi", 440, 26, 140, 38, `<span>⧉</span><span>☀</span><span>◐</span><span>⊙</span>`);
    const gbtn = A(tlBody, "gbtn", 588, 33, 32, 24, svg("graph", 17));
    A(tlBody, "colh", 0, 64, 636, 26, `<span style="left:12px">${svg("eye", 12)}</span><span style="left:32px">◐</span><span style="left:50px">⊡</span><span style="left:116px">#</span><span style="left:154px">Source Name</span><span style="left:380px">fx</span><span style="left:446px">Mode</span><span style="left:510px">TrkMat</span><span style="left:572px">Parent</span>`);
    const ruler = A(tlBody, "ruler", TX0 - 4, 64, TX1 - TX0 + 10, 26);
    for (let i = 0; i <= 10; i++) A(ruler, "rl", (i * (TX1 - TX0)) / 10 + 4, 0, null, 26, i % 2 ? `${String(Math.floor(i / 2)).padStart(2, "0")}:15f` : `${String(i / 2).padStart(2, "0")}s`);
    A(ruler, "wa", 4, 0, TX1 - TX0, 5);
    const cache = A(ruler, "cache", 4, 5, 0, 3);
    const rowsBox = A(tlBody, "rows", 0, ROW0 - TLY, 1912, 436 - (ROW0 - TLY));
    const rowEl = [];
    LAYERS.forEach(([ic, n, c, a, b], i) => {
      const r = A(rowsBox, "lr" + (i === 0 ? " sel" : ""), 0, 0, 1912, RH, `<span class="c" style="left:12px">${svg("eye", 13)}</span><span class="tw" style="left:84px">▸</span><span class="lab" style="left:98px;background:${c}"></span><span class="c dim" style="left:116px">${i + 1}</span>
        <span class="c ic" style="left:134px">${ic === "T" ? '<b class="tt">T</b>' : ic === "img" ? svg("img", 13) : '<b class="so"></b>'}</span><span class="c nm" style="left:154px">${n}</span>
        <span class="c sw2" style="left:380px">⊘ &nbsp;/</span><span class="c dd" style="left:446px">Normal ⌄</span><span class="c dd" style="left:510px">None ⌄</span><span class="c dd" style="left:572px">⊚ None ⌄</span>
        <div class="lbar" style="left:${tx(a)}px;width:${tx(b) - tx(a)}px;background:${c}"></div>`);
      rowEl.push({ r, layer: i });
    });
    const twirl = rowEl[0].r.querySelector(".tw");
    const propEl = PROPS.map(([n, v], j) => {
      const indent = j < 2 ? 104 : 132;
      return A(rowsBox, "pr2", 0, 0, 1912, RH, `${j >= 2 ? `<span class="c kn" style="left:92px">◀ ◆ ▶</span><span class="c st" style="left:${indent}px">${svg("watch", 13)}</span>` : `<span class="c tw2" style="left:${indent - 2}px">${j === 1 ? "▾" : "▸"}</span>`}
        <span class="c pn" style="left:${indent + 22}px">${n}</span>${j === 0 ? '<span class="c ani" style="left:330px">Animate: ⊙</span>' : j === 1 ? '<span class="c ani" style="left:330px">Reset</span>' : ""}
        ${v != null ? `<span class="c pv" style="left:330px">${j === 4 ? `${svg("link", 12)} <u class="sv">100.0,100.0%</u>` : `<u>${v}</u>`}</span>` : ""}`);
    });
    const scaleRow = propEl[4], scaleVal = scaleRow.querySelector(".sv"), stopW = scaleRow.querySelector(".st"), kNav = scaleRow.querySelector(".kn");
    const kfs = [30, 10].map((t) => A(scaleRow, "kf", tx(t) - 7, 5, 14, 14, KF));
    const marquee = A(rowsBox, "mq", 0, 0, 0, 0);
    // graph editor (replaces the layer bars area)
    const GH = 436 - (ROW0 - TLY), GBASE = GH - 34, GTOP = 34, GW = TX1 - TX0 + 10;
    const ge = A(tlBody, "ge", TX0 - 4, ROW0 - TLY, GW, GH);
    ge.innerHTML = `<svg viewBox="0 0 ${GW} ${GH}"><g class="gg"></g><path class="sp"/><line class="h1"/><line class="h2"/><circle class="hd1" r="5"/><circle class="hd2" r="5"/><rect class="k1" width="8" height="8"/><rect class="k2" width="8" height="8"/></svg>
      <div class="gl1">Scale</div><div class="gax">%/sec</div>`;
    ge.querySelector(".gg").innerHTML = [0, 1, 2, 3, 4].map((i) => `<path d="M0 ${GTOP + i * (GBASE - GTOP) / 4}H${GW}"/>`).join("") + Array.from({ length: 11 }, (_, i) => `<path d="M${4 + i * (TX1 - TX0) / 10} 0V${GH}"/>`).join("");
    const gSp = ge.querySelector(".sp"), gH1 = ge.querySelector(".h1"), gH2 = ge.querySelector(".h2"), gD1 = ge.querySelector(".hd1"), gD2 = ge.querySelector(".hd2"), gK1 = ge.querySelector(".k1"), gK2 = ge.querySelector(".k2");
    const gx = (t) => tx(t) - TX0 + 4;
    const ph = A(tlBody, "ph", 0, 64, 2, 372, `<i></i>`);
    // render queue
    const rq = A(tp, "rq", 0, 26, 1912, 410, `<div class="rqh"><b>Current Render</b><div class="rqs"><span>Elapsed: <i class="el">—</i></span><span>Est. Remain: <i class="er">—</i></span></div>
        <div class="rqbar"><i></i></div><span class="rqb amw">Queue in AME</span><span class="rqb go">Render</span></div>
      <div class="rqcols"><span style="left:40px">Render</span><span style="left:100px">#</span><span style="left:130px">Comp Name</span><span style="left:420px">Status</span><span style="left:560px">Started</span><span style="left:780px">Render Time</span><span style="left:940px">Comment</span></div>
      <div class="rqrow"><span style="left:44px" class="ck">☑</span><span style="left:100px">1</span><span style="left:130px" class="cn">04 Database</span><span style="left:420px" class="stt">Queued</span><span style="left:560px" class="sta">-</span><span style="left:780px" class="rtm">-</span></div>
      <div class="rqsub"><span style="left:110px">▸ Render Settings: <i>Best Settings</i></span><span style="left:700px">Log: <i>Errors Only</i></span></div>
      <div class="rqsub"><span style="left:110px">▸ Output Module: <i>H.264 - Match Render Settings - 15 Mbps</i></span><span style="left:700px">Output To: <i>gigi-database.mp4</i></span></div>
      <div class="rqfoot">Message: <i class="msg">—</i> &nbsp;&nbsp; RAM: <i>18% used of 64 GB</i> &nbsp;&nbsp; Renders Started: <i class="rs">—</i></div>`);
    const rqBtn = rq.querySelector(".go"), rqFill = rq.querySelector(".rqbar i"), rqStt = rq.querySelector(".stt"), rqSta = rq.querySelector(".sta"), rqRtm = rq.querySelector(".rtm"), rqEl = rq.querySelector(".el"), rqEr = rq.querySelector(".er"), rqMsg = rq.querySelector(".msg"), rqRs = rq.querySelector(".rs");

    // ---- menus
    const menu = (x, y, w, items) => A(ui, "menu", x, y, w, null, items.map((n) => `<div class="it">${n.replace(" ▸", "")}${n.endsWith("▸") ? "<em>▸</em>" : ""}</div>`).join(""));
    const ctx = menu(0, 0, 230, ["Keyframe Interpolation...", "Rove Across Time", "Keyframe Velocity...", "Keyframe Assistant ▸", "Toggle Hold Keyframe", "Select Equal Keyframes", "Copy", "Delete"]);
    const ctxIt = [...ctx.children];
    const sub = menu(0, 0, 220, ["Convert Audio to Keyframes", "Easy Ease", "Easy Ease In", "Easy Ease Out", "Exponential Scale", "Sequence Layers..."]);
    const subIt = [...sub.children];
    const cmenu = menu(88, 26, 300, ["New Composition...", "Composition Settings...", "Set Poster Time", "Trim Comp to Work Area", "Crop Comp to Region of Interest", "Add to Adobe Media Encoder Queue...", "Add to Render Queue", "Add Output Module", "Preview ▸", "Save Frame As ▸", "Pre-render...", "Composition Flowchart"]);
    const cmIt = [...cmenu.children];

    // ---- cursor (screen space)
    const ripple = el("div", "", stage); ripple.id = "ripple";
    const cursor = el("div", "", stage); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64" style="width:66px;height:66px;left:-9px;top:-9px"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    // twirled or not: stack the rows
    const layoutRows = (open) => {
      let i = 0;
      rowEl.forEach(({ r, layer }) => {
        r.style.top = px(i * RH); i++;
        if (layer === 0) propEl.forEach((p) => { p.style.display = open ? "block" : "none"; if (open) { p.style.top = px(i * RH); i++; } });
      });
      twirl.textContent = open ? "▾" : "▸";
    };
    // ---- measured targets (UI space)
    const posIn = (node) => { let x = 0, y = 0; for (let n = node; n && n !== ui; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };
    const mid = (n, fx = 0.5, fy = 0.5) => { const [x, y] = posIn(n); return [x + n.offsetWidth * fx, y + n.offsetHeight * fy]; };
    let M = null;
    const ROWY = ROW0 + SCALE_ROW * RH + RH / 2;
    const measure = () => {
      layoutRows(true);
      [ctx, sub, cmenu, rq].forEach((n) => (n.style.display = "block"));
      ctx.style.left = px(tx(30) + 6); ctx.style.top = px(ROWY + 6);
      const [cxx, cyy] = posIn(ctxIt[3]);
      sub.style.left = px(cxx + ctx.offsetWidth - 14); sub.style.top = px(cyy - 5);
      M = {
        twirl: mid(twirl), watch: mid(stopW), val: (() => { const [x, y] = posIn(scaleVal); return [x + 28, y + scaleVal.offsetHeight * 0.6]; })(),
        ctx3: mid(ctxIt[3], 0.4), sub1: mid(subIt[1], 0.3), graph: mid(gbtn), play: mid(pbtn[2]), comp: mid(menuEls[2]), addRQ: mid(cmIt[6], 0.3), render: mid(rqBtn),
      };
      [ctx, sub, cmenu, rq].forEach((n) => (n.style.display = "none"));
      layoutRows(false);
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(R0._f); });

    // ---- the comp's own state at global frame F
    const hInf = (F) => lerp(0.33, 0.78, sio(ramp(F, T.hdrag[0], T.hdrag[1])));       // the dragged handle's influence
    const easing = (F) => (F < T.ease ? bez(0, 0, 1, 1) : bez(0.33, 0, 1 - hInf(F), 1));
    const scrubV = (F) => Math.round(100 * (1 - sio(ramp(F, T.scrub[0], T.scrub[1]))));
    const playT = (F) => {
      if (F < T.drag2[0]) return 30 * sio(ramp(F, T.drag1[0], T.drag1[1]));
      if (F <= T.play) return lerp(30, 10, sio(ramp(F, T.drag2[0], T.drag2[1])));
      return clamp(F - (T.play + 1), 0, 40);     // the preview plays from the start in real time
    };
    const k30 = (F) => F >= T.watch, k10 = (F) => F >= T.scrub[0];
    const scaleAt = (F, t) => {
      if (!k10(F)) return 100;
      const v10 = F <= T.scrub[1] ? scrubV(F) : 0;
      if (t <= 10) return v10; if (t >= 30) return 100;
      return v10 + (100 - v10) * easing(F).at((t - 10) / 20);
    };

    // ---- camera: [frame, cx, cy, zoom]; a repeated frame is a cut (with a punch)
    const CAM = [
      [0, 960, 560, 0.86], [26, 960, 548, 0.9],
      [26, 1000, 470, 1.25], [60, 1010, 480, 1.3],
      [60, 470, 800, 2.0], [96, 500, 805, 2.06], [132, 520, 810, 2.1],
      [132, 1010, 752, 1.62], [174, 1040, 755, 1.66],
      [190, 980, 700, 1.42], [216, 1010, 706, 1.46],
      [222, 1260, 420, 1.12],
      [224, 915, 352, 1.55], [254, 915, 352, 1.64],
      [254, 330, 210, 1.7], [270, 360, 220, 1.72],
      [278, 1150, 664, 1.3], [292, 1170, 676, 1.34],
      [T.out[1], 960, 540, 0.9],
    ];
    const CUTS = CAM.filter((c, i) => i && CAM[i - 1][0] === c[0]).map((c) => c[0]);
    const camAt = (F) => {
      const g = (j) => glide(F, CAM.map((c) => [c[0], c[j]]));
      const cut = CUTS.filter((c) => F >= c).pop();
      const kick = cut != null ? 1 + 0.06 * (1 - eo(ramp(F, cut, cut + 7))) : 1;
      return { cx: g(1), cy: g(2), z: g(3) * kick };
    };
    const RISE = [900, 420, 190, 90, 40, 14, 0];

    // ---- cursor keys (UI space): [frame, x, y]
    const curKeys = () => {
      const P = (t) => [tx(t), 716];
      const mq0 = [tx(10) - 26, ROWY - 15], mq1 = [tx(30) + 26, ROWY + 15];
      const hA = tx(30) - 0.33 * (tx(30) - tx(10)), hB = tx(30) - 0.78 * (tx(30) - tx(10)), hy = ROW0 + GBASE;
      return [
        [0, 1100, 900], [22, 900, 760], [T.grab1 - 2, ...P(0)], [T.drag1[0], ...P(0)], [T.drag1[1], ...P(30)], [T.drag1[1] + 3, ...P(30)],
        [T.twirl - 2, ...M.twirl], [T.twirl + 3, ...M.twirl], [T.watch - 2, ...M.watch], [T.watch + 2, ...M.watch],
        [T.grab2 - 2, ...P(30)], [T.drag2[0], ...P(30)], [T.drag2[1], ...P(10)], [T.drag2[1] + 2, ...P(10)],
        [T.scrub[0] - 3, ...M.val], [T.scrub[0], ...M.val], [T.scrub[1], M.val[0] - 100, M.val[1]], [T.scrub[1] + 3, M.val[0] - 100, M.val[1]],
        [T.mq[0] - 3, ...mq0], [T.mq[0], ...mq0], [T.mq[1], ...mq1], [T.mq[1] + 2, ...mq1],
        [T.rclick - 2, tx(30) + 1, ROWY + 1], [T.rclick + 1, tx(30) + 1, ROWY + 1], [T.hover, ...M.ctx3], [T.hover + 2, ...M.ctx3], [T.ease - 2, ...M.sub1], [T.ease + 2, ...M.sub1],
        [T.graph - 2, ...M.graph], [T.graph + 3, ...M.graph],
        [T.hgrab - 2, hA, hy], [T.hdrag[0], hA, hy], [T.hdrag[1], hB, hy], [T.hdrag[1] + 2, hB, hy],
        [T.play - 2, ...M.play], [T.play + 3, ...M.play],
        [T.comp - 2, ...M.comp], [T.comp + 1, ...M.comp], [T.rq - 2, ...M.addRQ], [T.rq + 1, ...M.addRQ],
        [T.render - 2, ...M.render], [T.render + 2, ...M.render], [T.out[1], M.render[0] + 20, M.render[1] + 30],
      ];
    };
    const DRAGS = [T.drag1, T.drag2, T.scrub, T.mq, T.hdrag];

    function render(F) {
      // ---- background + camera
      const a = F / 20;
      gl.style.background = `radial-gradient(55% 60% at ${50 + 30 * Math.sin(a)}% ${85 + 12 * Math.cos(a * 0.8)}%, rgba(47,147,251,.55), rgba(47,147,251,0) 70%),` +
        `radial-gradient(45% 50% at ${12 + 14 * Math.cos(a * 1.1)}% ${18 + 10 * Math.sin(a)}%, rgba(160,140,255,.32), rgba(160,140,255,0) 70%), linear-gradient(180deg, #ffffff 0%, #eaf3ff 100%)`;
      const C = camAt(F);
      const i0 = Math.floor(F), rise = i0 < RISE.length - 1 ? lerp(RISE[i0], RISE[i0 + 1], F - i0) : 0;
      const ox = -2600 * ei(ramp(F, T.whip[0], T.whip[1]));
      const toScr = ([x, y]) => [960 + ox + (x - C.cx) * C.z, 540 + rise + (y - C.cy) * C.z];
      cam.style.transform = `translate(${px(960 + ox)}, ${px(540 + rise)}) scale(${C.z.toFixed(5)}) translate(${px(-C.cx)}, ${px(-C.cy)})`;

      // ---- timeline state
      layoutRows(F >= T.twirl);
      const t = playT(F);
      tcEl.textContent = tcv.textContent = tcode(t);
      frEl.textContent = `${String(Math.round(t)).padStart(5, "0")} (30.00 fps)`;
      ph.style.left = px(tx(t) - 1);
      cache.style.width = px(F > T.play ? tx(clamp(F - (T.play + 1), 0, 40)) - TX0 : 0);
      stopW.classList.toggle("on", k30(F)); kNav.style.visibility = k30(F) ? "visible" : "hidden";
      show(kfs[0], k30(F)); show(kfs[1], k10(F));
      kfs.forEach((d) => { d.classList.toggle("on", F >= T.mq[1]); d.classList.toggle("ez", F >= T.ease); });
      const sv = F >= T.scrub[0] && F <= T.scrub[1] ? scrubV(F) : scaleAt(F, t);
      scaleVal.textContent = `${sv.toFixed(1)},${sv.toFixed(1)}%`;
      scaleVal.classList.toggle("hot", F >= T.scrub[0] - 1 && F < T.scrub[1] + 2);
      if (show(marquee, F >= T.mq[0] && F < T.mq[1] + 2)) {
        const p = sio(ramp(F, T.mq[0], T.mq[1])), x0 = tx(10) - 26, y0 = ROWY - 15 - ROW0, x1 = lerp(x0, tx(30) + 26, p), y1 = lerp(y0, ROWY + 15 - ROW0, p);
        Object.assign(marquee.style, { left: px(x0), top: px(y0), width: px(x1 - x0), height: px(y1 - y0) });
      }
      if (show(ctx, F >= T.rclick + 1 && F < T.ease + 1)) { ctx.style.opacity = eo(ramp(F, T.rclick + 1, T.rclick + 3)).toFixed(3); ctxIt.forEach((it, i) => it.classList.toggle("hi", i === 3 && F >= T.hover - 2)); }
      if (show(sub, F >= T.hover + 1 && F < T.ease + 1)) { sub.style.opacity = eo(ramp(F, T.hover + 1, T.hover + 3)).toFixed(3); subIt.forEach((it, i) => it.classList.toggle("hi", i === 1 && F >= T.ease - 3)); }
      // graph editor
      const graphOn = F >= T.graph;
      gbtn.classList.toggle("on", graphOn);
      show(ge, graphOn);
      rowEl.forEach(({ r }) => (r.querySelector(".lbar").style.visibility = graphOn ? "hidden" : "visible"));
      kfs.forEach((d) => (d.style.visibility = graphOn ? "hidden" : "visible"));
      if (graphOn) {
        const E = easing(F), x10 = gx(10), x30 = gx(30), K = (GBASE - GTOP) / 3.1;
        let d = `M0 ${GBASE}H${x10}`;
        for (let i = 0; i <= 60; i++) { const u = i / 60; d += `L${(x10 + (x30 - x10) * u).toFixed(1)} ${(GBASE - Math.min(3.1, E.speed(u)) * K).toFixed(1)}`; }
        gSp.setAttribute("d", d + `L${x30} ${GBASE}H${GW}`);
        const h1 = x10 + 0.33 * (x30 - x10), h2 = x30 - hInf(F) * (x30 - x10);
        [[gH1, x10, h1], [gH2, x30, h2]].forEach(([l, a1, b1]) => { l.setAttribute("x1", a1); l.setAttribute("y1", GBASE); l.setAttribute("x2", b1); l.setAttribute("y2", GBASE); });
        gD1.setAttribute("cx", h1); gD1.setAttribute("cy", GBASE); gD2.setAttribute("cx", h2); gD2.setAttribute("cy", GBASE);
        gD2.classList.toggle("hot", F >= T.hgrab - 1 && F < T.hdrag[1] + 2);
        gK1.setAttribute("x", x10 - 4); gK1.setAttribute("y", GBASE - 4); gK2.setAttribute("x", x30 - 4); gK2.setAttribute("y", GBASE - 4);
      }
      pbtn[2].classList.toggle("on", F >= T.play && F < T.play + 34);
      if (show(cmenu, F >= T.comp + 1 && F < T.rq + 1)) { cmenu.style.opacity = eo(ramp(F, T.comp + 1, T.comp + 3)).toFixed(3); cmIt.forEach((it, i) => it.classList.toggle("hi", i === 6 && F >= T.rq - 4)); }
      menuEls[2].classList.toggle("on", F >= T.comp && F < T.rq + 1);
      const rqOn = F >= T.rq + 1;
      show(rq, rqOn); show(tlBody, !rqOn);
      rqTab.classList.toggle("on", rqOn); cmTab.classList.toggle("on", !rqOn);
      if (rqOn) {
        const p = ramp(F, T.prog[0], T.prog[1]), started = F >= T.render + 1, done = F >= T.prog[1];
        rqFill.style.width = (100 * p).toFixed(2) + "%";
        rqBtn.classList.toggle("press", F >= T.render - 1 && F < T.render + 3);
        rqBtn.textContent = started && !done ? "Pause" : "Render";
        rqStt.textContent = done ? "Done" : started ? "Rendering" : "Queued";
        rqStt.classList.toggle("dn", done);
        rqSta.textContent = started ? "10/22/2026, 10:41:06 AM" : "-";
        rqRtm.textContent = done ? "4 Seconds" : "-";
        rqEl.textContent = started ? `${Math.round(4 * p)} Sec` : "—"; rqEr.textContent = started ? `${Math.max(0, Math.round(4 * (1 - p)))} Sec` : "—";
        rqMsg.textContent = done ? "Rendered 1 of 1" : started ? `Rendering 1 of 1 · frame ${Math.round(150 * p)} of 150` : "—";
        rqRs.textContent = started ? "1" : "—";
      }

      // ---- the comp
      const sc = scaleAt(F, t) / 100;
      word.style.transform = `translate(-50%, -50%) scale(${sc.toFixed(4)})`;
      pops.forEach((p, i) => { const k2 = ramp(t, 2 + 4 * i, 10 + 4 * i); p.style.opacity = eo(k2 * 1.6).toFixed(3); p.style.transform = `rotate(${p.dataset.r}deg) scale(${(0.7 + 0.3 * back(k2)).toFixed(4)})`; });
      const ww = word.offsetWidth * sc, wh = word.offsetHeight * sc;
      Object.assign(selOut.style, { left: px(400 - ww / 2), top: px(225 - wh / 2), width: px(Math.max(2, ww)), height: px(Math.max(2, wh)) });
      show(selOut, sc > 0.02 && !(F > T.play && F < T.play + 34));

      // ---- cursor
      const K = curKeys();
      const [sx, sy] = toScr([glide(F, K.map((k2) => [k2[0], k2[1]])), glide(F, K.map((k2) => [k2[0], k2[2]]))]);
      const hidden = F >= T.play + 3 && F < T.comp - 12;     // off while the preview plays in close-up
      if (show(cursor, !hidden)) {
        const press = CLICKS.reduce((m, c) => Math.max(m, Math.sin(Math.PI * ramp(F, c - 1, c + 3))), 0);
        const dragging = DRAGS.some(([a1, b1]) => F >= a1 - 1 && F <= b1 + 1);
        cursor.style.transform = `translate(${px(sx)}, ${px(sy)}) scale(${(dragging ? 0.88 : 1 - 0.14 * press).toFixed(3)})`;
      }
      const rc = CLICKS.find((c) => F >= c && F < c + 9);
      if (show(ripple, rc != null && !hidden)) {
        const p = ramp(F, rc, rc + 9);
        ripple.style.transform = `translate(${px(sx)}, ${px(sy)}) scale(${(0.3 + 1.1 * eo(p)).toFixed(3)})`;
        ripple.style.opacity = (0.55 * (1 - p)).toFixed(3);
      }
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
