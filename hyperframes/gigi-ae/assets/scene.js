// Gigi in After Effects — 11.07 s, 30 fps, 332 frames, in the launch video's look (white/grey, Inter, brand blue, black).
// We animate storyboard frame 04 ("Which / respectfully / is a terrible database") inside a light After Effects UI.
// The motion is the storyboard cut's (../gigi-figma), which copies the reference edit beat for beat: hard cuts on its
// exact frames, instant swaps on its 25 fps cadence, pills staggering in, an iridescent blur for changes, and
// scrolls driven by the reference's measured per-frame speeds.
//   0–37     the app rises in close on the comp; the preset menu flicks through entrances, lands on Gigi Ease
//   38–91    the phone layer: Effect Controls + pills; Motion blur → iridescent bloom, the layer gains a trail
//   92–129   the graph editor: the curve picker swaps easing curves
//   130–145  the whole After Effects window, slow push, playhead running
//   146–208  a prompt is typed over "Which" and sent
//   209–238  the word morphs to "respectfully" and the comp scrolls away
//   239–275  the dark preview: "Which respectfully" morphs to "is a terrible database"
//   276–332  the window again: Export → Render → progress → "Render complete", then it whips off left
(function () {
  const FPS = 30, FRAMES = 332;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  const sio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const kick = (F, at, amt = 0.07, dur = 7) => 1 + amt * (1 - eo(ramp(F, at, at + dur)));
  const back = (t, s = 1.8) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  const bounce = (t) => { t = clamp(t, 0, 1); const n = 7.5625, d = 2.75;
    return t < 1 / d ? n * t * t : t < 2 / d ? n * (t -= 1.5 / d) * t + 0.75 : t < 2.5 / d ? n * (t -= 2.25 / d) * t + 0.9375 : n * (t -= 2.625 / d) * t + 0.984375; };
  const q = (F) => { const i = Math.floor(F); return i % 6 === 1 ? i - 1 : i; };
  const step = (f, k) => k.reduce((v, [at, x]) => (f >= at ? x : v), k[0][1]);
  const glide = (f, k, e = eo) => {
    if (f <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (f <= k[i][0]) return lerp(k[i - 1][1], k[i][1], e((f - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
    return k[k.length - 1][1];
  };

  // measured scroll speeds of the reference (px per frame at 1280 wide; key f is the move from f to f+1)
  const SCROLL = {
    p1: { 210: 12, 211: 8, 212: 12, 213: 38, 214: 58, 216: 54, 217: 28, 218: 18, 219: 14, 220: 12, 222: 10, 223: 8, 224: 8, 225: 8, 226: 6, 228: 6, 229: 8, 230: 10, 231: 14, 232: 16, 234: 22, 235: 30, 236: 70, 237: 96 },
    p2: { 240: 94, 241: 28, 242: 22, 243: 16, 244: 12, 246: 10, 247: 8, 248: 8, 249: 8, 250: 8, 252: 8, 253: 8, 254: 8, 255: 8, 256: 8, 258: 8, 259: 8, 260: 8, 261: 8, 262: 8, 264: 8, 265: 8, 266: 8, 267: 10, 268: 20, 270: 22, 271: 30, 272: 50, 273: 70, 274: 66 },
    p3: { 276: 20, 277: 16, 278: 12, 279: 8, 280: 6, 282: 6, 283: 4, 284: 2, 285: 2, 286: 2 },
  };
  const scrollAt = (tab, F) => {
    const i = Math.floor(F);
    let s = 0;
    for (const [k, v] of Object.entries(tab)) if (+k < i) s += v;
    return 1.5 * (s + (tab[i] || 0) * (F - i));
  };
  const scrollTotal = (tab) => 1.5 * Object.values(tab).reduce((a, b) => a + b, 0);

  const SHOTS = [[0, 38], [38, 92], [92, 130], [130, 146], [146, 239], [239, 276], [276, 333]];
  const PRESETS = ["Gigi Ease", "Typewriter", "Pop", "Blur In", "Bounce", "Fade Up"];
  const PRESET_SEQ = [[0, 3], [6, 1], [12, 2], [18, 4], [24, 5], [30, 0]];
  // graph editor: [frame, picker icon, curve]
  const CURVE_SEQ = [[0, -1, 0], [100, 0, 1], [106, 2, 3], [112, 3, 4], [118, 1, 5]];
  // easing curves in a 1000×500 box (time →, value ↑)
  const CURVES = [
    "M0 500 L1000 0",
    "M0 500 C420 500 580 0 1000 0",
    "M0 500 C700 500 900 260 1000 0",
    "M0 500 C120 40 380 0 1000 0",
    "M0 500 C260 -190 560 40 1000 0",
    "M0 500 C180 -40 330 0 1000 0",
  ];
  const PROMPT = "Animate it the way Gigi would";
  const CLICKS = [31, 68, 122, 206, 294, 306];
  const CUTS = [38, 92, 130, 146, 239, 276];
  const RENDER = { click: 306, start: 307, end: 312 };

  const ICON = {
    sparkle: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  };
  const DIA = (c = "#2f93fb") => `<svg class="kf" viewBox="0 0 12 12"><path d="M6 0.8L11.2 6 6 11.2 0.8 6z" fill="${c}"/></svg>`;

  // frame 04's collage (positions in a 1640×925 frame)
  const COLLAGE = [["cal", 150, 70, 300, 200, -4], ["chat", -30, 470, 330, 190, 3], ["phone", 1180, 60, 300, 172, 5], ["keys", 1290, 330, 330, 186, -3], ["network", 1080, 640, 340, 270, 2], ["convo", 300, 690, 330, 188, -2]];

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };
    const at = (n, x, y, w, h) => { n.style.left = px(x); n.style.top = px(y); if (w != null) n.style.width = px(w); if (h != null) n.style.height = px(h); return n; };
    const art = (parent, src, x, y, w, h) => { const a = at(el("div", "art", parent), x, y, w, h); const im = el("img", "", a); im.src = `assets/sb/${src}.jpg`; return { a, im }; };
    const selBox = (parent, tag) => {
      const s = el("div", "xsel", parent, `<span class="tag">${tag}</span>`);
      [["-8px", "-8px", "", ""], ["", "-8px", "-8px", ""], ["-8px", "", "", "-8px"], ["", "", "-8px", "-8px"]].forEach(([l, t, r, b]) => {
        const h = el("span", "h", s); Object.assign(h.style, { left: l || "auto", top: t || "auto", right: r || "auto", bottom: b || "auto" });
      });
      return s;
    };
    const bar = (parent, x, y, items) => at(el("div", "bar", parent, items.map((i) => (i === "|" ? '<span class="vs"></span>' : i.startsWith("*") ? `<span class="b ai"><i></i>${i.slice(1)}</span>` : `<span class="b">${i}</span>`)).join("")), x, y);
    const pills = (parent, rightX, ys, labels) => labels.map((t, i) => { const p = el("div", "pill", parent, t); p.style.top = px(ys[i]); p.style.right = px(1920 - rightX); return p; });
    const orb = (parent, x, y) => at(el("div", "orb", parent, ICON.sparkle), x, y);
    const twoLayer = (parent, text, size) => {
      const w = el("div", "hl", parent); w.style.fontSize = px(size);
      const b = el("div", "", w, text), i = el("div", "irid", w, text);
      i.style.position = "absolute"; i.style.left = "0"; i.style.top = "0";
      return { w, b, i };
    };
    // a frame-04 comp: white, the serif word, the collage around it
    const comp = (parent, x, y, w, h, word, size) => {
      const c = at(el("div", "art comp", parent), x, y, w, h);
      const k = w / 1640;
      COLLAGE.forEach(([src, cx, cy, cw, ch, r]) => { const a = art(c, src, cx * k, cy * k, cw * k, ch * k); a.a.style.transform = `rotate(${r}deg)`; a.a.style.borderRadius = px(10 * k); });
      const t = el("div", "word", c, word); t.style.fontSize = px(size * k);
      return { c, t };
    };

    // ---------- shots ----------
    const shots = SHOTS.map(() => el("div", "shot", stage));
    shots.forEach((s, i) => { if (i !== 3 && i !== 6) el("div", "cv", s); });

    // S1 · entrance presets flicking on the word
    const s1 = shots[0];
    const C1 = comp(s1, 140, 130, 1640, 925, "Which", 190);
    const whoT = C1.t;
    const sel1 = selBox(s1, "Text layer");
    const bar1 = bar(s1, 470, 40, ["*Gigi AI", "|", "Animate In ⌄", '<span class="fn">Gigi Ease</span> ⌄', "0.6s ⌄", "|", DIA(), "Keyframes", "|", "⋯"]);
    const bar1font = bar1.querySelector(".fn");
    const dd = at(el("div", "card2 dd", s1), 250, 590, 300);
    const ddItems = PRESETS.map((n) => el("div", "it", dd, `<span class="pv"></span>${n}`));
    const pills1 = pills(s1, 1770, [610, 690, 770], ["Smoother", "Add overshoot", "Match Gigi motion"]);
    orb(s1, 1736, 860);
    // the preset swatch: a little bar that plays the entrance
    ddItems.forEach((it) => (it.querySelector(".pv").innerHTML = "<b></b>"));

    // S2 · the phone layer: effect controls, motion blur
    const s2 = shots[1];
    art(s2, "cal", 1480, -150, 760, 428);
    art(s2, "convo", -280, 760, 660, 372);
    const trail = [0.28, 0.14].map((o) => { const g = art(s2, "phone", 500, 170, 1020, 574); g.a.style.opacity = "0"; g.a.dataset.o = o; return g.a; });
    const img2 = art(s2, "phone", 500, 170, 1020, 574);
    const irid2 = el("div", "abs", img2.a); irid2.style.cssText += "width:100%;height:100%;background:linear-gradient(120deg,#cfc6ff,#c9f3d6 45%,#bfe0ff 75%,#e5d4ff);opacity:0;filter:blur(18px)";
    const sel2 = at(selBox(s2, "phone.jpg"), 500, 170, 1020, 574);
    bar(s2, 520, 40, ["*Gigi AI", "|", "Transform", "Effects", "Masks", "|", DIA(), "⤢", "⋯"]);
    const SL = [["Position", "960, 540", 50], ["Scale", "100%", 42], ["Rotation", "0°", 50], ["Opacity", "100%", 92], ["Motion blur", "Off", 8]];
    const adj = at(el("div", "card2 fx", s2, `<div class="hd">Effect Controls<span>phone.jpg</span></div>` +
      SL.map(([n, v, p]) => `<div class="sl"><div class="ln">${DIA("#c9cad0")}${n}<em>${v}</em></div><div class="tr"><s></s><i style="left:${p}%"></i></div></div>`).join("")), 300, 440, 330);
    const adjRows = [...adj.querySelectorAll(".sl")];
    const pills2 = pills(s2, 1770, [610, 690, 770], ["Add keyframes", "Easy ease", "Motion blur"]);
    const orb2 = orb(s2, 1736, 860);

    // S3 · graph editor + curve picker
    const s3 = shots[2];
    art(s3, "chat", 1560, -170, 560, 316);
    art(s3, "network", -300, 820, 620, 350);
    const ge = at(el("div", "art graph", s3), 380, 200, 1180, 665);
    ge.innerHTML = `<div class="gh"><span>Graph Editor</span><span class="gs">Value · Position</span><span class="gt">0;00;00;00</span><span class="gt">0;00;00;18</span></div>
      <svg viewBox="-90 -95 1180 640" preserveAspectRatio="none"><g class="grid">${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${i * 200} -120V600"/>`).join("")}${[0, 1, 2, 3].map((i) => `<path d="M-60 ${i * 166.7}H1060"/>`).join("")}</g>
      <path class="base" d="M0 500 L1000 0"/><path class="curve" d="${CURVES[0]}"/><line class="hn a"/><line class="hn b"/><circle class="hd a" r="12"/><circle class="hd b" r="12"/>
      <circle class="end" cx="0" cy="500" r="15"/><circle class="end" cx="1000" cy="0" r="15"/><circle class="dot" r="18"/></svg>`;
    const gCurve = ge.querySelector(".curve"), gDot = ge.querySelector(".dot"), gHn = [...ge.querySelectorAll(".hn")], gHd = [...ge.querySelectorAll("circle.hd")];
    at(selBox(s3, "Graph Editor"), 380, 200, 1180, 665);
    bar(s3, 520, 40, ["*Gigi AI", "|", "Graph ⌄", "Speed", "Value", "|", "⤢", "⋯"]);
    const lgCard = at(el("div", "card2", s3), 250, 560); lgCard.style.transformOrigin = "0 0";
    const lg = el("div", "lg", lgCard);
    const ICONC = [0, 1, 3, 4, 2, 5];
    const lgIcons = ICONC.map((c) => el("div", "ic", lg, `<svg viewBox="-60 -220 1120 780"><path d="${CURVES[c]}"/></svg>`));
    const pills3 = pills(s3, 1770, [640, 720, 800], ["Ease in", "Ease out", "Overshoot"]);
    orb(s3, 1736, 890);

    // S4 and S8 · the whole After Effects window
    const LAYERS = [["T", "Which", "#2f93fb", 2, 40, [0, 12]], ["T", "respectfully", "#2f93fb", 30, 70, [30, 42]], ["T", "is a terrible database", "#2f93fb", 64, 100, [64, 78]],
      ["▣", "phone.jpg", "#f2b04e", 0, 100, [6, 20]], ["▣", "cal.jpg", "#f2b04e", 0, 100, [10, 24]], ["▣", "chat.jpg", "#f2b04e", 0, 100, [14, 28]], ["▣", "keys.jpg", "#f2b04e", 0, 100, [18, 32]], ["■", "Background", "#c9cad0", 0, 100, []]];
    const buildWindow = (parent) => {
      const gl = el("div", "gl", parent);
      const win = el("div", "aewin", parent);
      const top = el("div", "top", win, `<span class="ae">Ae</span>${["File", "Edit", "Composition", "Layer", "Effect", "Animation", "View", "Window"].map((m) => `<span class="mn">${m}</span>`).join("")}
        <span class="title">Gigi Promo.aep — <b>04 Database</b></span>
        <span class="right"><span class="av">A</span><span class="av b">G</span><span class="play">${ICON.play}</span><span class="shareb">${ICON.dl}Export</span></span>`);
      el("div", "pnl left", win, `<div class="tabs"><span>Project</span><span>Effect Controls</span></div>
        <div class="thumb"><div class="tb"></div><div class="ti"><b>04 Database</b><small>1920 × 1080 (1.00)<br>Δ 0;00;10;00, 30.00 fps</small></div></div>
        <div class="fld srch">⌕ &nbsp;Search</div>
        <div class="sect">${["01 Who knows", "02 All the data", "03 No access", "04 Database", "05 Ask around", "06 Gigi profile", "07 Connect", "08 No worries", "09 Logo"].map((n, i) => `<div class="lay${i === 3 ? " on" : ""}"><i></i>${n}</div>`).join("")}</div>
        <div class="sect"><h6>Footage</h6>${["phone.jpg", "cal.jpg", "chat.jpg", "keys.jpg", "network.jpg"].map((n) => `<div class="lay ft"><i></i>${n}</div>`).join("")}</div>`);
      el("div", "pnl right", win, `<div class="tabs"><span>Effects &amp; Presets</span><span>Character</span></div>
        <div class="fld srch">⌕ &nbsp;ease</div>
        <div class="sect"><h6>▾ Animation Presets › Text › Animate In</h6>${PRESETS.map((n, i) => `<div class="lay${i === 0 ? " on" : ""}"><i class="pz"></i>${n}</div>`).join("")}</div>
        <div class="sect"><h6>Character</h6><div class="row"><div class="fld">Liberation Serif</div></div><div class="row"><div class="fld">150 px</div><div class="fld">−20</div></div>
        <div class="row"><div class="fld"><span class="sw"></span>Ink</div><div class="fld"><span class="sw" style="background:#2f93fb"></span>Brand</div></div></div>
        <div class="sect"><h6>Motion</h6><div class="row"><div class="fld">Motion blur · On</div></div><div class="row"><div class="fld">Shutter 180°</div></div></div>`);
      const vw = el("div", "viewer", win);
      el("div", "vtabs", vw, `<span class="on">Composition: 04 Database</span><span>Layer: phone.jpg</span>`);
      const vc = comp(vw, 0, 0, 900, 506, "Which", 190); vc.c.classList.add("vcomp");
      el("div", "vbar", vw, `<span>50% ⌄</span><span>Full ⌄</span><span class="tc2">0;00;02;14</span><span>⊞</span><span>Active Camera ⌄</span><span>1 View ⌄</span>`);
      const tlp = el("div", "tlp", win);
      tlp.innerHTML = `<div class="tlh"><span class="tab">04 Database ×</span><span class="tc">0;00;00;00</span><span class="fps">00000 (30.00 fps)</span></div>
        <div class="cols"><span>#</span><span>Source Name</span><span>Mode</span><span>Parent</span></div>
        <div class="ruler">${Array.from({ length: 11 }, (_, i) => `<span style="left:${i * 10}%">${String(i).padStart(2, "0")}s</span>`).join("")}</div>
        <div class="rows">${LAYERS.map(([ic, n, c, a, b, kf], i) => `<div class="lr${i === 0 ? " on" : ""}"><span class="eye">${ICON.eye}</span><span class="lc" style="background:${c}"></span><span class="ix">${i + 1}</span><span class="ic">${ic}</span><span class="nm">${n}</span><span class="md">Normal ⌄</span><span class="pr">None ⌄</span>
          <div class="tk"><div class="bar2" style="left:${a}%;width:${b - a}%;background:${c}33;border-color:${c}88"></div>${kf.map((k) => `<span class="kfw" style="left:${k}%">${DIA(c === "#c9cad0" ? "#9a9ba1" : "#2f93fb")}</span>`).join("")}</div></div>`).join("")}</div>
        <div class="ph"><i></i></div>`;
      const ov = el("div", "layer", win);
      return { gl, win, ov, vc, share: top.querySelector(".shareb"), tc: tlp.querySelector(".tc"), tc2: vw.querySelector(".tc2"), fps: tlp.querySelector(".fps"), ph: tlp.querySelector(".ph"), tlp };
    };
    const W4 = buildWindow(shots[3]);
    const W8 = buildWindow(shots[6]);
    const pop = el("div", "", W8.ov); pop.id = "pop";
    pop.innerHTML = `<h4>Export “04 Database”</h4>
      <div class="kv"><span>Format</span><div class="fld">H.264 · MP4</div></div>
      <div class="kv"><span>Resolution</span><div class="fld">1920 × 1080</div></div>
      <div class="kv"><span>Frame rate</span><div class="fld">30 fps</div></div>
      <div class="kv"><span>Output</span><div class="fld">gigi-database.mp4</div></div>
      <hr><div class="prog"><div class="st"><span class="sl2">Ready to render</span><span class="pc"></span></div><div class="trk"><i></i></div></div>
      <div class="btns"><span class="btn2">Cancel</span><span id="copy">${ICON.film}<span class="cl">Render</span></span></div>`;
    const popRows = [...pop.children];
    const copy = pop.querySelector("#copy"), copyLabel = copy.querySelector(".cl"), copyIcon = copy.querySelector("svg");
    const progFill = pop.querySelector(".trk i"), progSt = pop.querySelector(".sl2"), progPc = pop.querySelector(".pc");
    const toast = el("div", "", W8.ov); toast.id = "toast"; toast.innerHTML = `<i>${ICON.check}</i>Render complete · gigi-database.mp4`;
    const POP = { x: 1430, y: 58 };

    // S5/S6 · the comp up close: prompt over "Which", then morph and scroll
    const s5 = shots[4];
    const p1 = el("div", "abs", s5); p1.style.cssText += "width:1920px;height:2400px;background:#fff";
    el("div", "lbl", p1, "04 Database").style.cssText += "left:60px;top:40px;font-size:20px";
    el("div", "lbl", p1, "0;00;01;12 &nbsp;&nbsp; 1920 × 1080 &nbsp;&nbsp; 30 fps").style.cssText += "left:1300px;top:44px;font-size:15px;letter-spacing:.04em";
    el("div", "lbl", p1, "/ Kinetic type<small>One word at a time, 0.6 s each.</small>").style.cssText += "left:60px;top:470px";
    art(p1, "phone", 1600, 300, 320, 620);
    const H1a = twoLayer(p1, "Which", 270), H1b = twoLayer(p1, "respectfully", 270);
    [H1a, H1b].forEach((h) => { h.w.classList.add("serif"); at(h.w, 40, 690); });
    const sel5 = selBox(p1, "Text layer");
    at(el("div", "stripe", p1, "<span>gigi.co</span><span>The network for agents to access people</span><span>04 Database</span><span>gigi.co</span>"), 0, 1080);
    el("div", "lbl", p1, "/ Every app<small>Your relationships, scattered.</small>").style.cssText += "left:60px;top:1230px";
    const H2 = twoLayer(p1, "is a terrible", 300); H2.w.classList.add("serif"); at(H2.w, 40, 1380); H2.i.style.display = "none";
    art(p1, "cal", 1260, 1220, 600, 338);
    art(p1, "chat", 1180, 1640, 620, 350);
    bar(p1, 560, 22, ["*Ask Gigi", "Animate", "|", "⊕", DIA(), "⤢", "⋯"]);
    const prompt = at(el("div", "card2 prompt", p1, `<div class="row2"><i></i>Make it snappier</div><div class="row2"><i></i>Add a little overshoot</div><div class="row2"><i></i>Stagger the words</div>
      <div class="inp"><span class="ty"></span><span class="send">${ICON.arrow}</span></div>`), 560, 92, 660);
    const typed = prompt.querySelector(".ty"), sendB = prompt.querySelector(".send");

    // S7 · the dark preview, morph while scrolling
    const s6 = shots[5];
    const p2 = el("div", "abs dark", s6); p2.style.cssText += "width:1920px;height:2600px";
    const glow7 = el("div", "abs", p2); glow7.style.cssText += "width:1920px;height:2600px;background:radial-gradient(60% 40% at 80% 30%, rgba(47,147,251,.22), rgba(47,147,251,0) 70%), radial-gradient(50% 35% at 10% 75%, rgba(47,147,251,.14), rgba(47,147,251,0) 70%)";
    el("div", "lbl", p2, "/ RAM preview<small style='color:#9a9ba1'>04 Database · Full · 30 fps</small>").style.cssText += "left:60px;top:120px;color:#fff";
    const H3a = twoLayer(p2, "Which", 280), H3b = twoLayer(p2, "is a terrible", 280), H4a = twoLayer(p2, "respectfully", 280), H4b = twoLayer(p2, "database", 280);
    [H3a, H3b].forEach((h) => at(h.w, 40, 300)); [H4a, H4b].forEach((h) => at(h.w, 40, 600));
    [H3a, H3b, H4a, H4b].forEach((h) => { h.b.style.color = "#fff"; h.w.classList.add("serif"); });
    art(p2, "phone", 1240, 470, 560, 316);
    art(p2, "network", 980, 860, 520, 293);
    art(p2, "keys", 240, 980, 600, 338);
    el("div", "lbl", p2, "/ No database<small style='color:#9a9ba1'>Just memory and luck.</small>").style.cssText += "left:1560px;top:960px;color:#fff";
    const sel7 = selBox(p2, "Text layer");
    art(p2, "hugo", 1100, 1480, 640, 360);
    art(p2, "convo", 160, 1560, 620, 350);
    el("div", "lbl", p2, "gigi.co").style.cssText += "left:60px;top:2050px;color:#fff;font-size:22px";

    const wash = el("div", "layer", stage);
    wash.style.cssText += "pointer-events:none;background:linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(47,147,251,.0) 18%, rgba(110,180,255,.85) 38%, rgba(205,190,255,.8) 52%, rgba(190,240,210,.75) 66%, rgba(255,255,255,0) 86%);background-size:320% 100%;filter:blur(24px)";

    const ripple = el("div", "", stage); ripple.id = "ripple"; ripple.style.cssText += "width:70px;height:70px;margin:-35px 0 0 -35px";
    const cursor = el("div", "", stage); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64" style="width:86px;height:86px;left:-12px;top:-12px"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    const posIn = (node, root) => { let x = 0, y = 0; for (let n = node; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };
    let M = null;
    const measure = () => {
      shots.forEach((s) => (s.style.display = "block"));
      pills2.forEach((pl) => { pl.style.display = "flex"; pl.style.transform = "none"; });
      pop.style.left = POP.x + "px"; pop.style.top = POP.y + "px"; pop.style.display = "block";
      const eh = pills2[2].getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const [shx, shy] = posIn(W8.share, W8.win), [cpx, cpy] = posIn(copy, W8.win), [sbx, sby] = posIn(sendB, p1);
      M = {
        dd: (i) => [250 + 200, 590 + 14 + 22 + 44 * i],
        enhance: [eh.left - sr.left + eh.width * 0.42, eh.top - sr.top + eh.height * 0.55],
        share: [shx + W8.share.offsetWidth * 0.55, shy + W8.share.offsetHeight * 0.6], copy: [cpx + copy.offsetWidth * 0.55, cpy + copy.offsetHeight * 0.62], popB: POP.y + pop.offsetHeight,
        send: [sbx + 22, sby + 24],
        h1w: H1a.w.offsetWidth, h3w: Math.max(H3a.w.offsetWidth, H4a.w.offsetWidth),
        ww: (whoT.textContent = "Which", whoT.style.transform = "none", whoT.offsetWidth), wh: whoT.offsetHeight,
        lg: (i) => [250 + 14 + 33 + (i % 2) * 78, 560 + 14 + 33 + Math.floor(i / 2) * 78],
      };
      shots.forEach((s) => (s.style.display = "none"));
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(R0._f); });

    const morph = (A, B, f, t0) => {
      const p = f - t0;
      [A.i, B.i].forEach((n) => { n.style.backgroundSize = "220% 100%"; n.style.backgroundPosition = `${(100 - p * 9).toFixed(1)}% 0`; });
      A.w.style.display = p < 3 ? "block" : "none";
      B.w.style.display = p >= 3 ? "block" : "none";
      A.b.style.opacity = p < 0 ? 1 : 0; A.i.style.opacity = p < 0 ? 0 : 0.85; A.w.style.filter = blurOf(p < 0 ? 0 : 1.5);
      B.i.style.opacity = (1 - ramp(p, 6, 10)).toFixed(3); B.b.style.opacity = ramp(p, 6, 10).toFixed(3);
      B.w.style.filter = blurOf(p >= 3 ? 2.5 * (1 - ramp(p, 3, 8)) : 0);
    };
    const pillIn = (pl, f, t0) => pl.forEach((p, i) => {
      const k = ramp(f, t0 + 2 * i, t0 + 2 * i + 4);
      p.style.display = k > 0 ? "flex" : "none";
      p.style.transform = `scaleX(${(0.2 + 0.8 * eo(k)).toFixed(3)})`;
      p.style.color = k < 0.7 ? "transparent" : "#26272b";
    });
    const flow = (F) => {
      const a = F / 20;
      return `radial-gradient(55% 60% at ${50 + 30 * Math.sin(a)}% ${85 + 12 * Math.cos(a * 0.8)}%, rgba(47,147,251,.62), rgba(47,147,251,0) 70%),` +
        `radial-gradient(45% 50% at ${12 + 14 * Math.cos(a * 1.1)}% ${18 + 10 * Math.sin(a)}%, rgba(160,140,255,.38), rgba(160,140,255,0) 70%),` +
        `radial-gradient(40% 45% at ${88 + 8 * Math.sin(a * 1.3)}% ${20 + 14 * Math.cos(a * 0.9)}%, rgba(120,225,185,.32), rgba(120,225,185,0) 70%),` +
        `linear-gradient(180deg, #ffffff 0%, #eaf3ff 100%)`;
    };
    // the comp's own little animation, played by the window's playhead (comp time t in frames, 0–300)
    const tcode = (n) => { n = Math.max(0, Math.floor(n)); const s = Math.floor(n / 30); return `0;00;${String(s).padStart(2, "0")};${String(n % 30).padStart(2, "0")}`; };
    const WORDS = ["Which", "respectfully", "is a terrible database"];
    const playComp = (W, t) => {
      const wi = t < 30 ? 0 : t < 64 ? 1 : 2, t0 = [2, 30, 64][wi], k = ramp(t, t0, t0 + 14);
      if (W.vc.t.textContent !== WORDS[wi]) W.vc.t.textContent = WORDS[wi];
      W.vc.t.style.fontSize = px((wi === 2 ? 96 : 190) * 900 / 1640);
      W.vc.t.style.opacity = eo(k * 1.6).toFixed(3);
      W.vc.t.style.transform = `translate(-50%, -50%) translateY(${px(26 * (1 - back(k, 1.4)))})`;
      W.tc.textContent = W.tc2.textContent = tcode(t);
      W.fps.textContent = `${String(Math.floor(t)).padStart(5, "0")} (30.00 fps)`;
      W.ph.style.left = `calc(560px + (100% - 580px) * ${(t / 300).toFixed(4)})`;
    };
    const windowAt = (W, s, oy, ox, t, F) => {
      W.gl.style.background = flow(F);
      W.win.style.transform = `translate(${px(960 + ox)}, ${px(540 + oy)}) scale(${s.toFixed(5)}) translate(-960px, -540px)`;
      playComp(W, t);
    };
    const RISE = [900, 420, 190, 90, 40];
    // entrance per preset, p in 0..1
    const entrance = (n, idx, p, text) => {
      let ty = 0, sc = 1, op = 1, bl = 0, shown = text;
      if (idx === 0) { ty = 70 * (1 - back(p, 1.3)); op = eo(p * 1.8); }
      else if (idx === 1) { shown = text.slice(0, Math.ceil(text.length * clamp(p * 1.4, 0, 1))); }
      else if (idx === 2) { sc = 0.55 + 0.45 * back(p, 2.2); op = eo(p * 3); }
      else if (idx === 3) { bl = 22 * (1 - eo(p)); op = eo(p * 1.5); sc = 1.06 - 0.06 * eo(p); }
      else if (idx === 4) { ty = -160 * (1 - bounce(p)); }
      else if (idx === 5) { ty = 40 * (1 - eo(p)); op = eo(p); }
      if (n.textContent !== shown) n.textContent = shown || "​";
      n.style.transform = `translate(-50%, -50%) translateY(${px(ty)}) scale(${sc.toFixed(4)})`;
      n.style.opacity = op.toFixed(3); n.style.filter = blurOf(bl);
    };

    function render(F) {
      const f = q(F);
      const shot = SHOTS.findIndex(([a, b]) => F >= a && F < b);
      shots.forEach((s, i) => (s.style.display = i === shot ? "block" : "none"));
      let cur = null, curScale = 1;

      if (shot === 0) {
        const i = Math.floor(F), rise = i < 5 ? lerp(RISE[i], RISE[i + 1] ?? 0, F - i) : 0;
        const sc = F < 5 ? 1.16 : 1 + 0.0007 * (f - 5);
        shots[0].style.transform = `translateY(${px(rise)}) scale(${sc.toFixed(4)})`;
        const pi = step(f, PRESET_SEQ);
        bar1font.textContent = PRESETS[pi];
        const lastSwap = PRESET_SEQ.filter(([k]) => f >= k).pop()[0];
        // every preview replays the word's entrance in that preset (stepped on the reference's cadence)
        entrance(whoT, pi, ramp(F, lastSwap, lastSwap + (pi === 4 ? 9 : 6)), "Which");
        ddItems.forEach((it, j) => it.classList.toggle("on", j === pi));
        const ww = M.ww, wh = M.wh;
        at(sel1, 960 - ww / 2 - 14, 592 - wh / 2 - 8, ww + 28, wh + 16);
        pillIn(pills1, f, -10);
        const tx = M.dd(0)[0] + 10 * Math.sin(F / 9), ty = glide(F, PRESET_SEQ.map(([k, i]) => [k, M.dd(i)[1]]), sio);
        cur = [960 + (tx - 960) * sc, 540 + (ty - 540) * sc + rise]; curScale = sc;
      } else if (shot === 1) {
        const sc2 = (1 + 0.0005 * (f - 38)) * kick(F, 38);
        shots[1].style.transform = `scale(${sc2.toFixed(4)})`;
        pillIn(pills2, f, 38);
        const fade = ramp(f, 86, 91);
        pills2.forEach((p) => (p.style.opacity = (1 - fade).toFixed(3)));
        adj.style.opacity = (eo(ramp(f, 38, 42)) * (1 - fade)).toFixed(3);
        irid2.style.opacity = (eo(ramp(f, 70, 76)) * (1 - ramp(f, 80, 88))).toFixed(3);
        img2.im.style.filter = blurOf(8 * Math.sin(Math.PI * ramp(f, 70, 88)));
        // after the bloom the layer drifts with a motion-blur trail; the controls get keyframes
        const on = f >= 77, drift = on ? 60 * eo(ramp(F, 77, 92)) : 0;
        img2.a.style.transform = sel2.style.transform = `translateX(${px(drift)})`;
        trail.forEach((g, i) => { g.style.opacity = on ? (+g.dataset.o * ramp(F, 77, 80)).toFixed(3) : "0"; g.style.transform = `translateX(${px(drift - 34 * (i + 1) * ramp(F, 77, 82))})`; });
        adjRows.forEach((r, i) => {
          r.querySelector(".kf path").setAttribute("fill", on && i < 2 ? "#2f93fb" : f >= 64 && i === 4 ? "#2f93fb" : "#c9cad0");
          if (i === 4) r.querySelector("em").textContent = on ? "On · 180°" : "Off";
          if (i === 0) r.querySelector("em").textContent = on ? `${Math.round(960 + drift)}, 540` : "960, 540";
          if (i === 4) r.querySelector("i").style.left = (on ? 50 : 8) + "%";
        });
        orb2.style.background = f >= 68 ? `conic-gradient(from ${f * 24}deg, #2f93fb, #9bd0ff, #2f93fb)` : "#111214";
        pills2[2].style.background = f >= 64 && f < 86 ? "#eef5ff" : "#fff";
        const ex = M.enhance[0], ey = M.enhance[1];
        const cx2 = glide(F, [[38, 640], [64, ex], [92, ex + 8]], sio), cy2 = glide(F, [[38, 990], [64, ey], [92, ey + 6]], sio);
        cur = [960 + (cx2 - 960) * sc2, 540 + (cy2 - 540) * sc2]; curScale = sc2;
      } else if (shot === 2) {
        const sc3 = (1 + 0.0005 * (f - 92)) * kick(F, 92);
        shots[2].style.transform = `scale(${sc3.toFixed(4)})`;
        pillIn(pills3, f, 92);
        lgCard.style.transform = `scale(${(0.9 + 0.1 * back(ramp(f, 92, 96), 1.4)).toFixed(4)})`;
        const [last, li, ci] = CURVE_SEQ.filter(([k]) => f >= k).pop();
        const d = CURVES[ci];
        if (gCurve.getAttribute("d") !== d) gCurve.setAttribute("d", d);
        // bezier handles from the curve's control points
        const n = d.match(/-?\d+(\.\d+)?/g).map(Number);
        const hs = n.length >= 8 ? [[0, 500, n[2], n[3]], [1000, 0, n[4], n[5]]] : [[0, 500, 0, 500], [1000, 0, 1000, 0]];
        hs.forEach(([x1, y1, x2, y2], i) => { gHn[i].setAttribute("x1", x1); gHn[i].setAttribute("y1", y1); gHn[i].setAttribute("x2", x2); gHn[i].setAttribute("y2", y2); gHd[i].setAttribute("cx", x2); gHd[i].setAttribute("cy", y2); });
        // a value dot runs along the new curve each time it changes
        const L = gCurve.getTotalLength(), pt = gCurve.getPointAtLength(L * ramp(F, Math.max(92, last), Math.max(92, last) + 12));
        gDot.setAttribute("cx", pt.x.toFixed(1)); gDot.setAttribute("cy", pt.y.toFixed(1));
        lgIcons.forEach((ic, i) => ic.classList.toggle("on", i === li));
        const pts = CURVE_SEQ.slice(1).map(([k, i]) => [k, ...M.lg(i)]);
        const cx3 = glide(F, [[92, 1240], ...pts.map(([k, x]) => [k, x])], sio), cy3 = glide(F, [[92, 990], ...pts.map(([k, , y]) => [k, y])], sio);
        cur = [960 + (cx3 - 960) * sc3, 540 + (cy3 - 540) * sc3]; curScale = sc3;
      } else if (shot === 3) {
        windowAt(W4, (0.84 + 0.0022 * (f - 130)) * kick(F, 130, 0.14, 9), 0, 0, 20 + (F - 130) * 2, F);
      } else if (shot === 4) {
        const sy = F >= 209 ? scrollAt(SCROLL.p1, F) : 0;
        p1.style.transform = `translateY(${px(-sy)})`;
        const sc5 = (1 + 0.0003 * (f - 146)) * kick(F, 146) * (1 + 0.035 * eo(ramp(F, 176, 180)));
        shots[4].style.transform = `scale(${sc5.toFixed(4)})`;
        typed.textContent = PROMPT.slice(0, clamp(Math.floor((f - 150) / 1.45), 0, PROMPT.length));
        morph(H1a, H1b, f, 209);
        at(sel5, 24, 682, M.h1w + 32, 316); show(sel5, f < 209);
        sendB.style.transform = `scale(${(1 - 0.12 * Math.sin(Math.PI * ramp(f, 205, 210))).toFixed(3)})`;
        const cx5 = glide(F, [[146, 1040], [184, 1080], [204, M.send[0]], [239, M.send[0] + 10]], sio), cy5 = glide(F, [[146, 470], [184, 500], [204, M.send[1]], [239, M.send[1] + 8]], sio) - sy;
        cur = [960 + (cx5 - 960) * sc5, 540 + (cy5 - 540) * sc5]; curScale = sc5;
      } else if (shot === 5) {
        p2.style.transform = `translateY(${px(-scrollAt(SCROLL.p2, F))})`;
        shots[5].style.transform = `scale(${kick(F, 239, 0.05).toFixed(4)})`;
        glow7.style.transform = `translate(${px(160 * Math.sin(F / 14))}, ${px(120 * Math.cos(F / 17))})`;
        morph(H3a, H3b, f, 246); morph(H4a, H4b, f, 246);
        at(sel7, 30, 290, M.h3w + 24, 600); show(sel7, f < 246 || f >= 256);
      } else if (shot === 6) {
        const oy = scrollTotal(SCROLL.p3) - scrollAt(SCROLL.p3, F);
        const ox = -2700 * ei(ramp(F, 314, 332));
        const s = (0.9 + 0.0012 * (f - 276)) * kick(F, 276, 0.06);
        // the playhead parks at the end once the render starts
        windowAt(W8, s, oy, ox, F < RENDER.start ? 230 + (F - 276) * 1.2 : lerp(270, 300, ramp(F, RENDER.start, RENDER.end)), F);
        const toScr = ([x, y]) => [960 + ox + (x - 960) * s, 540 + oy + (y - 540) * s];
        W8.share.style.transform = `scale(${(1 - 0.08 * Math.sin(Math.PI * ramp(f, 293, 298))).toFixed(3)})`;
        if (show(pop, f >= 295)) {
          pop.style.left = POP.x + "px"; pop.style.top = POP.y + "px";
          pop.style.transform = `scale(${(0.92 + 0.08 * back(ramp(f, 295, 300), 1.4)).toFixed(4)})`;
          pop.style.opacity = eo(ramp(f, 295, 298)).toFixed(3);
          popRows.forEach((r, i) => { r.style.opacity = eo(ramp(f, 296 + i * 0.6, 299 + i * 0.6)).toFixed(3); });
        }
        // render: the button turns into progress, the bar fills, then done
        const pr = ramp(F, RENDER.start, RENDER.end), done = F >= RENDER.end;
        progFill.style.width = (100 * sio(pr)).toFixed(2) + "%";
        progSt.textContent = done ? "Done" : F >= RENDER.start ? "Rendering…" : "Ready to render";
        progPc.textContent = F >= RENDER.start ? `${Math.round(100 * sio(pr))}%` : "";
        copy.style.background = done ? "#111214" : "#2f93fb";
        copyIcon.innerHTML = done ? '<path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ICON.film.replace(/^<svg[^>]*>|<\/svg>$/g, "");
        copyLabel.textContent = done ? "Rendered" : F >= RENDER.start ? "Rendering" : "Render";
        copy.style.transform = `scale(${(1 - 0.1 * Math.sin(Math.PI * ramp(f, RENDER.click - 1, RENDER.click + 4))).toFixed(3)})`;
        if (show(toast, F >= RENDER.end - 1, "flex")) {
          toast.style.transform = `translate(${px(POP.x + 210 - toast.offsetWidth / 2)}, ${px(M.popB + 22 + 16 * (1 - eo(ramp(F, RENDER.end - 1, RENDER.end + 5))))}) scale(${(0.82 + 0.18 * back(ramp(F, RENDER.end - 1, RENDER.end + 5), 1.6)).toFixed(4)})`;
          toast.style.opacity = eo(ramp(F, RENDER.end - 1, RENDER.end + 2)).toFixed(3);
        }
        const wx = glide(F, [[276, 1250], [292, M.share[0]], [296, M.share[0] - 4], [305, M.copy[0]], [332, M.copy[0] + 18]], sio);
        const wy = glide(F, [[276, 760], [292, M.share[1]], [296, M.share[1] + 30], [305, M.copy[1]], [332, M.copy[1] + 22]], sio);
        cur = toScr([wx, wy]); curScale = s;
      }

      const wc = CUTS.find((c) => F >= c - 3 && F < c + 6);
      if (show(wash, wc != null)) {
        const p = ramp(F, wc - 3, wc + 6);
        wash.style.opacity = (0.5 * Math.sin(Math.PI * p)).toFixed(3);
        wash.style.backgroundPosition = `${(110 - 120 * p).toFixed(1)}% 0`;
      }

      if (show(cursor, !!cur)) {
        const press = CLICKS.reduce((m, c) => Math.max(m, Math.sin(Math.PI * ramp(F, c - 1, c + 3))), 0);
        cursor.style.transform = `translate(${px(cur[0])}, ${px(cur[1])}) scale(${((1 - 0.15 * Math.min(1, press)) * curScale).toFixed(4)})`;
      }
      const rc = CLICKS.find((c) => f >= c && f < c + 9);
      if (show(ripple, rc != null && !!cur)) {
        const p = ramp(f, rc, rc + 9);
        ripple.style.transform = `translate(${px(cur[0])}, ${px(cur[1])}) scale(${(0.3 + 1.1 * eo(p)).toFixed(3)})`;
        ripple.style.opacity = (0.6 * (1 - p)).toFixed(3);
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
