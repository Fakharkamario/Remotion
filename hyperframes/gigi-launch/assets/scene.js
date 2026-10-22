// Gigi AI launch — 9.77 s, 30 fps, 293 frames. Same motion as a reference chat edit, new content and a white UI:
//   0–100    "hey aizal" lands huge, the camera pulls back as a typing bubble turns into "need a launch video", then "quick"
//   100–150  whip up-left; a blue typing bubble flies in from the right and becomes "On it", the 🔥 badge pops on
//   150–186  pull back to the whole chat; the cursor flies in and grabs "need a launch video"
//   186–238  the chat whips off left, the board slides in under the held message, which drops into To do as a card
//   238–293  the board pans off right; "Working" slides in, fills black left to right, a spinner joins, it lifts away
// Everything is a pure function of the frame. Camera, cursor, board and end-line paths are keyed per frame from
// measurements of the reference (dense [frame, value] tables through a monotone cubic).
(function () {
  const FPS = 30, FRAMES = 293, CX = 960, CY = 540;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t, s = 2.2) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

  // monotone cubic (Fritsch–Carlson) through [frame, value] pairs: passes every point, never overshoots
  const slope = (p, i) => (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
  const tangent = (p, k) => {
    const n = p.length;
    if (n < 2) return 0;
    if (k === 0) return slope(p, 0);
    if (k === n - 1) return slope(p, n - 2);
    const d0 = slope(p, k - 1), d1 = slope(p, k);
    if (d0 * d1 <= 0) return 0;
    const h0 = p[k][0] - p[k - 1][0], h1 = p[k + 1][0] - p[k][0], w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
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
  const col = (rows, i) => rows.map((r) => [r[0], r[i]]);

  // ---- world layout (px at zoom 1). Chat column's left edge is x = 0; bubble centres sit on ROW multiples.
  const BH = 184, ROW = 232, PAD = 56, TYPING_W = 236, BLUE = [1138, 3 * ROW];

  // camera: [frame, anchor screen x, anchor screen y, zoom]. Anchor is "hey aizal"'s centre up to 106, then the
  // blue bubble's centre. Read off the reference frame by frame.
  const CAM_A = [[0, 960, 240, 2.4], [2, 975, 262, 2.32], [4, 962, 400, 2.24], [6, 960, 432, 2.18], [10, 960, 488, 2.08], [14, 960, 500, 2.03], [22, 960, 508, 2.0], [28, 960, 490, 1.96], [31, 962, 468, 1.86], [34, 980, 394, 1.56], [37, 995, 368, 1.43], [40, 1000, 356, 1.4], [48, 1000, 350, 1.37], [52, 975, 350, 1.34], [56, 850, 352, 1.3], [60, 715, 354, 1.27], [76, 672, 345, 1.24], [79, 610, 315, 1.14], [82, 562, 304, 1.07], [86, 548, 298, 1.03], [98, 505, 262, 1.0], [100, 425, 222, 1.0], [102, 336, 200, 1.02], [104, 60, 134, 1.1], [106, -198, 36, 1.2]];
  const CAM_B = [[108, 960, 650, 1.32], [110, 960, 612, 1.42], [114, 960, 556, 1.52], [118, 960, 540, 1.58], [150, 960, 540, 1.68], [152, 1056, 624, 1.48], [154, 1152, 691, 1.3], [156, 1290, 785, 1.16], [158, 1340, 840, 1.09], [160, 1362, 858, 1.055], [168, 1400, 880, 1.02], [176, 1420, 893, 1.0], [200, 1432, 899, 0.99]];
  // blue bubble's own fly-in from the right, in world px, on top of the camera
  const BLUE_DX = [[100, 760], [104, 700], [106, 690], [108, 380], [110, 200], [112, 130], [114, 62], [116, 25], [119, 0]];
  const BLUE_DY = [[100, 60], [108, 40], [114, 8], [118, 0]];
  // board: screen x of the To do column's left edge (slides in, holds, pans off right)
  const BOARD_X = [[184, 3000], [186, 2950], [188, 2780], [190, 2450], [192, 2100], [194, 1728], [196, 1400], [198, 1020], [200, 750], [202, 630], [204, 535], [206, 475], [208, 428], [210, 392], [214, 362], [220, 355], [236, 355], [238, 410], [240, 520], [242, 624], [244, 749], [246, 865], [248, 1000], [250, 1190], [252, 1420], [254, 1800], [256, 2250]];
  // cursor offset from its grab point (screen px): fly-in, carry, release, exit up-right
  const CUR = [[158, 1300, -96], [162, 1088, -77], [164, 748, -57], [166, 643, -9], [168, 413, 29], [170, 240, 38], [172, 163, 29], [174, 48, 10], [176, 19, 0], [180, 0, 0], [186, 0, -6], [192, -10, 24], [200, -4, 64], [206, -24, 48], [210, -24, 4], [212, 10, 2], [214, 16, 0], [216, -48, -38], [220, -19, -67], [226, 18, -77], [230, 163, -163], [232, 221, -211], [234, 384, -355], [236, 490, -470], [238, 600, -610], [240, 700, -760]];
  // end line: centre x, centre y, and the black wipe's progress across the word
  const END_X = [[244, -900], [246, -560], [248, -55], [250, 265], [252, 525], [254, 580], [256, 640], [260, 822], [262, 851], [266, 905], [270, 935], [278, 958], [284, 962], [293, 962]];
  const END_Y = [[276, 540], [280, 522], [284, 474], [288, 400], [291, 326], [293, 272]];
  const WIPE = [[250, 0], [252, 0.12], [256, 0.36], [260, 0.5], [266, 0.62], [270, 0.75], [276, 0.87], [280, 1.0]];

  const TAIL = '<svg class="tail" viewBox="0 0 52 44"><path d="M22 0 C22 20 16 34 0 44 C20 44 38 38 52 24 Z"/></svg>';
  const ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  };

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const svgBlur = (id) => {
      stage.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute"><filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter></svg>`);
      return stage.querySelector(`#${id} feGaussianBlur`);
    };
    // directional smear in screen space, from a velocity in px/frame
    const smear = (node, fe, id, vx, vy, k = 0.32) => {
      const sx = Math.min(60, Math.abs(vx) * k), sy = Math.min(60, Math.abs(vy) * k);
      if (sx + sy < 0.15) { node.style.filter = "none"; return; }
      fe.setAttribute("stdDeviation", `${sx.toFixed(2)} ${sy.toFixed(2)}`);
      node.style.filter = `url(#${id})`;
    };

    // ---------- background ----------
    const bg = el("div", "layer", stage); bg.id = "bg";
    const blobs = [["#e7e7ea", 1100, -200, 620], ["#ffffff", 900, 1150, 160], ["#ececef", 1000, 1500, 900], ["#f2f2f4", 800, 300, 980]].map(([c, s, x, y]) => {
      const b = el("div", "blob", bg); b.style.cssText += `width:${s}px;height:${s}px;background:${c}`; return { b, s, x, y };
    });

    // ---------- chat world ----------
    const chatWrap = el("div", "layer", stage), chatFe = svgBlur("chatSmear");
    const world = el("div", "", chatWrap); world.id = "world";
    const meta = el("div", "meta", world, '<span class="av">g</span><span>Gigi AI</span>');
    function bubble(words, cls) {
      const b = el("div", "bub" + (cls ? " " + cls : ""), world, TAIL);
      const txt = el("div", "txt", b);
      const ws = words.map((w, i) => el("span", "w", txt, w + (i < words.length - 1 ? " " : "")));
      const dots = el("div", "dots", b, "<i></i><i></i><i></i>");
      return { b, txt, ws, dots: [...dots.children], dotsBox: dots };
    }
    const b1 = bubble(["hey", "aizal"]);
    const b2 = bubble(["need", "a", "launch", "video"]);
    const b3 = bubble(["quick"]);
    const bb = bubble(["On", "it"], "blue");
    b1.dotsBox.style.display = b3.dotsBox.style.display = "none";
    const seen = el("div", "meta", world, "<span>Read 9:41</span>");
    const badge = el("div", "", world, '<img src="assets/img/fire.png" alt="">'); badge.id = "badge";

    // ---------- board ----------
    const boardWrap = el("div", "layer", stage), boardFe = svgBlur("boardSmear");
    const board = el("div", "", boardWrap); board.id = "board";
    const column = (x, dot, name, n) => {
      const c = el("div", "col", board);
      c.style.left = x + "px";
      el("div", "hd", c, `<span class="dot ${dot}"></span><span>${name}</span><span class="cnt">${n}</span><span class="sp"></span>${ICON.plus}${ICON.more}`);
      el("div", "rule", c);
      return c;
    };
    const todo = column(0, "ring", "To do", 0);
    const doing = column(796, "half", "In progress", 2);
    column(1592, "", "Done", 4);
    const todoCnt = todo.querySelector(".cnt");
    // quiet placeholders so the other columns read as a real board
    [[doing, 146], [doing, 320]].forEach(([c, y]) => { const g = el("div", "ghost", c); g.style.top = y + "px"; });
    const card = el("div", "", todo, `<div class="tags"><span class="tag dark">${ICON.bolt}Launch</span><span class="tag lite">Video</span><span class="tag lite">Urgent</span></div>
      <div class="ttl">Launch video for gigi ai</div><div class="bar"><i></i></div>
      <div class="ft">${ICON.clock}<span>Due today</span><span class="sp"></span><span class="av">A</span></div>`);
    card.id = "card";
    const cardBar = card.querySelector(".bar i");

    // ---------- held message (screen space) ----------
    const heldWrap = el("div", "layer", stage);
    const held = el("div", "", heldWrap); held.id = "held";

    // ---------- cursor ----------
    const ripple = el("div", "", stage); ripple.id = "ripple";
    const cursor = el("div", "", stage); cursor.id = "cursor";
    cursor.innerHTML = '<svg viewBox="0 0 31 35"><path d="M3 2 L3 29 L10.2 22.4 L15 33 L20 30.8 L15.4 20.6 L25 20.2 Z" fill="#0d0d0f" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg><div class="tagn">Aizal</div>';

    // ---------- end line ----------
    const endWrap = el("div", "layer", stage), endFe = svgBlur("endSmear");
    const endline = el("div", "", endWrap); endline.id = "endline";
    const wm = el("div", "wm", endline, '<span class="gh">Working</span><span class="fill">Working</span>');
    const wmFill = wm.querySelector(".fill");
    const spin = el("div", "", endline, '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="46" fill="none" stroke="#e3e3e6" stroke-width="16"/><circle class="arc" cx="60" cy="60" r="46" fill="none" stroke="#0d0d0f" stroke-width="16" stroke-linecap="round" stroke-dasharray="90 400"/></svg>');
    spin.id = "spin";
    const arc = spin.querySelector(".arc");

    // ---------- layout from measured text ----------
    // measure text in an always-visible, untransformed probe (the real nodes may be hidden when fonts land)
    const probe = el("div", "", stage);
    probe.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;pointer-events:none";
    const textW = (cls, text) => { probe.className = cls; probe.textContent = text; return probe.getBoundingClientRect().width; };
    let L = null;
    const layout = () => {
      const w = (t) => Math.ceil(textW("bub-probe", t)) + 2 * PAD;
      L = { w1: w("hey aizal"), w2: w("need a launch video"), w3: w("quick"), wb: w("On it"), wmW: textW("wm", "Working") };
      probe.className = ""; probe.textContent = "";
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    // camera as a world focus point + zoom, so the two anchors join without a jump
    const camAt = (f) => {
      const A = f <= 106 ? CAM_A : CAM_B;
      const ax = f <= 106 ? L.w1 / 2 : BLUE[0], ay = f <= 106 ? 0 : BLUE[1];
      const rows = A.map(([fr, sx, sy, z]) => [fr, ax - (sx - CX) / z, ay - (sy - CY) / z, z]);
      // bridge 106→108 with both anchors in one table so the spline is continuous
      const all = f <= 106 ? rows.concat(CAM_B.slice(0, 2).map(([fr, sx, sy, z]) => [fr, BLUE[0] - (sx - CX) / z, BLUE[1] - (sy - CY) / z, z]))
        : CAM_A.slice(-2).map(([fr, sx, sy, z]) => [fr, L.w1 / 2 - (sx - CX) / z, 0 - (sy - CY) / z, z]).concat(rows);
      return { fx: keys(f, col(all, 1)), fy: keys(f, col(all, 2)), z: keys(f, col(all, 3)) };
    };
    const toScreen = (c, x, y) => [CX + (x - c.fx) * c.z, CY + (y - c.fy) * c.z];
    const chatPan = (f) => (f < 186 ? 0 : keys(f, BOARD_X) - 2950);
    const boardX = (f) => keys(f, BOARD_X);

    // grab point: a spot on the right of "need a launch video", where the cursor lands at 180
    const grab = () => {
      const c = camAt(180);
      const [x, y] = toScreen(c, 0.72 * L.w2, ROW + 0.26 * BH);
      const [lx, ly] = toScreen(c, 0, ROW);
      return { x, y, lx, ly, z: c.z };
    };
    // the card's centre on screen when the board is at x
    const cardCentre = (bx) => [bx + 24 + 356, 121 + 146 + 159];
    const curAt = (f) => {
      const g = grab();
      let dx = keys(f, col(CUR, 1)), dy = keys(f, col(CUR, 2));
      // steer the carry so the message ends centred over the card's slot
      if (f > 186) {
        const [cx, cy] = cardCentre(boardX(213));
        const hx = g.lx + (L.w2 / 2) * g.z, hy = g.ly;
        const k = eio(ramp(f, 194, 212));
        dx += k * (cx - hx - 10); dy += k * (cy - hy - 2);
      }
      return [g.x + dx, g.y + dy];
    };

    // words rise into place from below, soft and faint, like the reference
    const wordIn = (span, f, at) => {
      const a = f - at;
      if (a < 0) { span.style.opacity = 0; return; }
      const p = eo(a / 5);
      span.style.opacity = clamp(a / 2.5, 0, 1).toFixed(3);
      span.style.transform = `translateY(${(0.42 * (1 - p)).toFixed(3)}em)`;
      span.style.filter = blurOf(5 * (1 - p));
    };
    const dotsAt = (b, f, fade) => {
      b.dots.forEach((d, i) => {
        const s = 0.5 + 0.5 * Math.sin((f / 16) * Math.PI * 2 - i * 1.05);
        d.style.opacity = ((0.3 + 0.7 * s) * (1 - fade)).toFixed(3);
        d.style.transform = `translateY(${(-5 * s).toFixed(2)}px)`;
      });
      b.dotsBox.style.display = fade >= 1 ? "none" : "flex";
    };
    // pop-in from down-right: oversized, tilted, soft
    const popIn = (f, at, dur = 5) => {
      const p = eo(ramp(f, at, at + dur));
      return { x: 150 * (1 - p), y: 150 * (1 - p), s: 1 + 0.3 * (1 - p), r: 4 * (1 - p), blur: 9 * (1 - p), a: clamp((f - at + 1) / 2.5, 0, 1) };
    };
    const place = (node, x, y, s = 1, r = 0, blur = 0, a = 1) => {
      node.style.transform = `translate(${px(x)}, ${px(y)}) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      node.style.filter = blurOf(blur);
      node.style.opacity = a.toFixed(3);
    };
    const prev = { chat: null, board: null, end: null };

    function render(f) {
      // background light drifts slowly
      blobs.forEach((o, i) => {
        const t = f / FRAMES;
        o.b.style.transform = `translate(${px(o.x - o.s / 2 + 160 * Math.sin(t * 3.1 + i * 1.7))}, ${px(o.y - o.s / 2 + 110 * Math.cos(t * 2.6 + i))})`;
      });

      // ---------- chat ----------
      const showChat = f < 224;
      chatWrap.style.display = showChat ? "block" : "none";
      if (showChat) {
        const c = camAt(f), pan = chatPan(f);
        world.style.transform = `translate(${px(CX + pan)}, ${px(CY)}) scale(${c.z.toFixed(5)}) translate(${px(-c.fx)}, ${px(-c.fy)})`;
        const c0 = camAt(Math.max(0, f - 1)), o = toScreen(c, 0, 0), o0 = toScreen(c0, 0, 0);
        const vx = o[0] - o0[0] + pan - chatPan(Math.max(0, f - 1)), vy = o[1] - o0[1];
        smear(chatWrap, chatFe, "chatSmear", f > 99 ? vx : vx * 0.4, f > 99 ? vy : vy * 0.4);

        // hey aizal: drops in from above, tilted and soft
        const e1 = eo(ramp(f, 0, 7));
        b1.b.style.width = L.w1 + "px";
        place(b1.b, 0, -BH / 2 - 150 * (1 - e1), 1 - 0.1 * (1 - e1), -9 * (1 - e1), 10 * (1 - e1), clamp((f + 1) / 2, 0, 1));
        wordIn(b1.ws[0], f, 0); wordIn(b1.ws[1], f, 3);
        place(meta, 4, -BH / 2 - 66, 1, 0, 0, eo(ramp(f, 8, 16)));

        // typing → need a launch video
        const on2 = f >= 32 && f < 180;
        b2.b.style.display = on2 ? "block" : "none";
        if (on2) {
          const p = popIn(f, 32), grow = eo(ramp(f, 47, 57));
          b2.b.style.width = px(lerp(TYPING_W, L.w2, grow));
          place(b2.b, p.x, ROW - BH / 2 + p.y, p.s, p.r, p.blur, p.a);
          dotsAt(b2, f, ramp(f, 46, 50));
          b2.dotsBox.style.left = px(TYPING_W / 2);
          [50, 52, 54, 57].forEach((at, i) => wordIn(b2.ws[i], f, at));
        }
        // quick
        b3.b.style.display = f >= 78 ? "block" : "none";
        if (f >= 78) {
          const p = popIn(f, 78);
          b3.b.style.width = L.w3 + "px";
          place(b3.b, p.x, 2 * ROW - BH / 2 + p.y, p.s, p.r, p.blur, p.a);
          wordIn(b3.ws[0], f, 79);
        }
        // On it
        const onB = f >= 101;
        bb.b.style.display = badge.style.display = seen.style.display = onB ? "block" : "none";
        if (onB) {
          const w = lerp(TYPING_W + 30, L.wb, eo(ramp(f, 125, 134)));
          bb.b.style.width = px(w);
          const dx = keys(f, BLUE_DX), dy = keys(f, BLUE_DY), s = 1 + 0.12 * (1 - eo(ramp(f, 102, 118)));
          place(bb.b, BLUE[0] - w / 2 + dx, BLUE[1] - BH / 2 + dy, s, 0, 0, 1);
          bb.txt.style.left = px((w - (L.wb - 2 * PAD)) / 2);
          dotsAt(bb, f, ramp(f, 124, 129));
          bb.dotsBox.style.left = px(w / 2);
          wordIn(bb.ws[0], f, 128); wordIn(bb.ws[1], f, 131);
          const bp = ramp(f, 138, 145), bs = f < 138 ? 0 : back(bp, 2.6);
          place(badge, BLUE[0] - w / 2 - 50, BLUE[1] - BH / 2 - 52, Math.max(0, bs), -24 * (1 - eo(bp)), 0, clamp((f - 137.5) / 1.5, 0, 1));
          badge.style.display = f >= 138 ? "grid" : "none";
          place(seen, BLUE[0] + w / 2 - 150, BLUE[1] + BH / 2 + 22, 1, 0, 0, eo(ramp(f, 144, 152)));
          seen.style.display = "flex";
        }
      }

      // ---------- held message ----------
      const holding = f >= 180 && f < 218;
      heldWrap.style.display = holding ? "block" : "none";
      if (holding) {
        if (held.firstChild !== b2.b) { held.appendChild(b2.b); }
        b2.b.style.display = "block";
        b2.dotsBox.style.display = "none";
        b2.ws.forEach((w) => wordIn(w, f, 0));
        const g = grab(), [cx, cy] = curAt(f), lift = eo(ramp(f, 180, 185));
        const drop = eo(ramp(f, 212, 217));
        const rot = keys(f, [[184, 0], [190, -2.2], [198, 1.5], [206, 3], [212, 1.5], [216, 0]]);
        const s = g.z * (1 + 0.045 * lift) * (1 - 0.14 * drop);
        // keep the grabbed point under the cursor; scale and tilt about that point
        const ox = 0.72 * L.w2, oy = BH / 2 + 0.26 * BH;
        b2.b.style.transformOrigin = `${px(ox)} ${px(oy)}`;
        b2.b.style.width = px(L.w2);
        b2.b.style.transform = `translate(${px(cx - ox)}, ${px(cy - oy)}) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
        b2.b.style.opacity = (1 - drop).toFixed(3);
        b2.b.style.filter = "none";
        b2.b.style.boxShadow = `0 ${px(12 + 26 * lift)} ${px(34 + 40 * lift)} rgba(10,10,14,${(0.075 + 0.07 * lift).toFixed(3)}), 0 2px 6px rgba(10,10,14,.05), inset 0 0 0 1.5px rgba(10,10,14,.045)`;
      } else if (f < 180 && b2.b.parentNode !== world) {
        world.insertBefore(b2.b, b3.b);
        b2.b.style.transformOrigin = ""; b2.b.style.boxShadow = "";
      }

      // ---------- board ----------
      const showBoard = f >= 185 && f < 258;
      boardWrap.style.display = showBoard ? "block" : "none";
      if (showBoard) {
        const bx = boardX(f);
        board.style.transform = `translateX(${px(bx)})`;
        smear(boardWrap, boardFe, "boardSmear", bx - boardX(f - 1), 0);
        const cp = ramp(f, 212.5, 217);
        card.style.opacity = cp.toFixed(3);
        card.style.transform = `scale(${(0.93 + 0.07 * back(cp, 1.6)).toFixed(4)})`;
        cardBar.style.width = (12 + 10 * eo(ramp(f, 218, 232))).toFixed(2) + "%";
        todoCnt.textContent = f >= 214 ? "1" : "0";
      }

      // ---------- cursor ----------
      const showCur = f >= 158 && f < 241;
      cursor.style.display = showCur ? "block" : "none";
      if (showCur) {
        const [x, y] = curAt(f);
        const press = f >= 178 && f < 213 ? eo(ramp(f, 178, 181)) * (1 - eo(ramp(f, 211, 214))) : 0;
        cursor.style.transform = `translate(${px(x)}, ${px(y)}) scale(${(1 - 0.12 * press).toFixed(3)})`;
        const [x0, y0] = curAt(f - 1);
        cursor.style.filter = blurOf(Math.min(8, Math.hypot(x - x0, y - y0) * 0.05));
      }
      const rp = ramp(f, 179, 190);
      ripple.style.display = rp > 0 && rp < 1 ? "block" : "none";
      if (rp > 0 && rp < 1) {
        const g = grab();
        ripple.style.transform = `translate(${px(g.x)}, ${px(g.y)}) scale(${(0.3 + 0.9 * eo(rp)).toFixed(3)})`;
        ripple.style.opacity = (0.5 * (1 - rp)).toFixed(3);
      }

      // ---------- end line ----------
      const showEnd = f >= 244;
      endWrap.style.display = showEnd ? "block" : "none";
      if (showEnd) {
        const ex = keys(f, END_X), ey = keys(f, END_Y);
        const sp = eo(ramp(f, 277, 284));
        spin.style.transform = `scale(${(f < 277 ? 0 : back(ramp(f, 277, 283), 2)).toFixed(4)}) rotate(${(f * 13).toFixed(1)}deg)`;
        spin.style.opacity = sp.toFixed(3);
        arc.setAttribute("stroke-dasharray", `${(60 + 80 * (0.5 + 0.5 * Math.sin(f / 5))).toFixed(1)} 400`);
        // centre the word itself while the spinner rides alongside
        endline.style.transform = `translate(${px(ex - L.wmW / 2)}, ${px(ey)}) translateY(-50%)`;
        const p = keys(f, WIPE) * 100;
        const m = `linear-gradient(90deg, #000 ${(p - 4).toFixed(2)}%, transparent ${(p + 4).toFixed(2)}%)`;
        wmFill.style.webkitMaskImage = wmFill.style.maskImage = p >= 100 ? "none" : m;
        smear(endWrap, endFe, "endSmear", ex - keys(f - 1, END_X), ey - keys(f - 1, END_Y), 0.3);
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
