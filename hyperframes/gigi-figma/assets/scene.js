// Gigi storyboard — 11.5 s, 30 fps, 345 frames. Follows the launch video: same white/grey palette, Inter, brand blue
// for selection and the cursor, black accents. A design-tool window with the Gigi storyboard, cut kinetically:
//   0–26     the window rises from below (continuing the launch video's lift), close on the first frame
//   26–72    the title text is selected; the font menu flicks through faces and lands on the brand's Inter Display
//   72–160   whip along the board to the database frame; its line swaps word by word, pushed in close
//   160–214  whip to Gigi's profile frame, which gets selected
//   214–256  pull all the way back to the whole storyboard
//   256–316  Share → Copy link → "Link copied"
//   316–345  the window slides off left for the match cut
// Everything is a pure function of the frame.
(function () {
  const FPS = 30, FRAMES = 345;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const E = {
    l: (t) => t,
    s: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
    o: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    i: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    // the kinetic move: slow out, very fast middle, long soft landing
    io: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
    x: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  };
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const back = (t, s = 1.8) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  // [frame, value, ease-into-this-key] tracks
  const tw = (f, k) => {
    if (f <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (f <= k[i][0]) {
      const [f0, v0] = k[i - 1], [f1, v1, e = "io"] = k[i];
      return lerp(v0, v1, E[e]((f - f0) / (f1 - f0)));
    }
    return k[k.length - 1][1];
  };

  // ---- storyboard layout (world px): a column per beat, caption on top, frames stacked under it
  const COLW = 620, ROWH = 344, FW = 560, FH = 316;
  const COLS = [
    ["Who knows who in your network?", ["#who", "who2", "who3", "who4"]],
    ["All the data in the world.", ["keys", "sheet", "mail"]],
    ["But no human or agent can access it.", ["whois", "cal", "chat"]],
    ["Which is a terrible database", ["asks", "which", "respect", "#big"]],
    ["Which is why you do this:", ["phone", "post"]],
    ["Gigi understands who you know, and how well.", ["network", "hugo"]],
    ["Connect your agent to the places your relationships live.", ["ask", "features"]],
    ["But no worries", ["worries", "send", "convo"]],
    ["The network for agents to access people.", ["logo", "site"]],
  ];
  const frameAt = (c, r) => ({ x: c * COLW, y: r * ROWH, cx: c * COLW + FW / 2, cy: r * ROWH + FH / 2 });
  const WHO = frameAt(0, 0), BIG = frameAt(3, 3), HUGO = frameAt(5, 1);
  const GRID = { cx: (8 * COLW + FW) / 2, cy: (-120 + 3 * ROWH + FH) / 2 };

  // ---- cameras
  // window: screen = (p - F) * s + (960 + ox, 540 + oy)
  const WIN = {
    s: [[0, 1.3], [26, 1.3], [70, 1.36, "s"], [80, 1.28], [100, 1.3, "s"], [114, 1.66], [160, 1.74, "s"], [180, 1.24], [214, 1.3, "s"], [244, 0.9], [258, 0.9, "s"], [278, 1.72], [304, 1.78, "s"], [318, 0.92]],
    fx: [[0, 960], [258, 960], [278, 1630], [304, 1640, "s"], [318, 960]],
    fy: [[0, 564], [214, 564], [244, 540], [258, 540], [278, 250], [304, 256, "s"], [318, 540]],
    oy: [[0, 1250], [28, 0, "o"]],
    ox: [[0, 0], [318, 0], [345, -2900, "i"]],
  };
  // canvas inside the viewport: world point (cx, cy) at the viewport centre, zoom z
  const CAN = {
    cx: [[0, WHO.cx], [72, WHO.cx], [98, BIG.cx], [160, BIG.cx], [186, HUGO.cx], [214, HUGO.cx], [246, GRID.cx]],
    cy: [[0, WHO.cy], [72, WHO.cy], [98, BIG.cy], [160, BIG.cy], [186, HUGO.cy], [214, HUGO.cy], [246, GRID.cy]],
    z: [[0, 1.75], [72, 1.75], [86, 1.3], [98, 1.75], [160, 1.78, "s"], [174, 1.1], [186, 1.35], [214, 1.42, "s"], [246, 0.24]],
  };
  const VP = { x: 240, y: 48, w: 1440, h: 1032 };
  const canAt = (f) => ({ cx: tw(f, CAN.cx), cy: tw(f, CAN.cy), z: tw(f, CAN.z) });
  const toWin = (c, x, y) => [VP.x + VP.w / 2 + (x - c.cx) * c.z, VP.y + VP.h / 2 + (y - c.cy) * c.z];

  const FONTS = ["Liberation Serif", "Caladea", "FreeSerif", "JetBrains Mono", "DejaVu Serif", "Inter Display"];
  const HOVER = [[40, 0], [44, 1], [48, 2], [52, 3], [56, 4], [60, 5]];
  const WORDS = [["Your inbox.", -1], ["Your calendar.", 106], ["Your messages.", 118], ["Your WhatsApp.", 130], ["is a terrible database", 142]];
  const CLICKS = [32, 63, 190, 264, 286];

  const ICON = {
    move: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 7-6 1.6L10.5 18z"/></svg>',
    frame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3v18M17 3v18M3 7h18M3 17h18"/></svg>',
    rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="14" rx="1.5"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l6 9-6 9-6-9z"/><circle cx="12" cy="12" r="1.6"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 6h14M12 6v13"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  };

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };

    // background
    const bg = el("div", "layer", stage); bg.id = "bg";
    const blobs = [["#e7e7ea", 1100, -200, 620], ["#ffffff", 900, 1150, 160], ["#ececef", 1000, 1500, 900]].map(([c, s, x, y]) => {
      const b = el("div", "blob", bg); b.style.cssText += `width:${s}px;height:${s}px;background:${c}`; return { b, s, x, y };
    });

    // ---------- window ----------
    const win = el("div", "", stage); win.id = "win";
    const top = el("div", "top", win, `
      <span class="tool on">${ICON.move}</span><span class="tool">${ICON.frame}</span><span class="tool">${ICON.rect}</span>
      <span class="tool">${ICON.pen}</span><span class="tool">${ICON.text}</span><span class="tool">${ICON.chat}</span>
      <span class="title">Gigi / <b>Gigi Storyboard</b></span>
      <span class="right"><span class="av">A</span><span class="av b">G</span><span class="play">${ICON.play}</span><span id="share">Share</span><span class="zoom">175%</span></span>`);
    const share = top.querySelector("#share"), zoomTxt = top.querySelector(".zoom");
    const left = el("div", "left", win, `<div class="tabs"><span>Layers</span><span>Assets</span></div>
      <div class="sect"><h6>Pages</h6><div class="page on">Storyboard</div><div class="page">Moodboard</div><div class="page">Archive</div></div>
      <div class="sect lays"></div>`);
    const lays = left.querySelector(".lays");
    const LAYERS = ["01 Who knows", "02 All the data", "03 No access", "04 Database", "05 Ask around", "06 Gigi profile", "07 Connect", "08 No worries", "09 Logo"];
    const layEls = LAYERS.map((n) => el("div", "lay", lays, `<i></i>${n}`));
    const right = el("div", "right", win, `<div class="tabs"><span>Design</span><span>Prototype</span></div>
      <div class="sect"><h6 class="kind">Frame</h6><div class="row"><div class="fld"><small>X</small>0</div><div class="fld"><small>Y</small>0</div></div>
        <div class="row"><div class="fld"><small>W</small>1920</div><div class="fld"><small>H</small>1080</div></div></div>
      <div class="sect"><h6>Typography</h6><div class="row"><div class="fld font"><span class="fname2">Liberation Serif</span><small>⌄</small></div></div>
        <div class="row"><div class="fld"><span class="fwt">Regular</span></div><div class="fld">96</div></div></div>
      <div class="sect"><h6>Fill</h6><div class="row"><div class="fld"><span class="sw"></span>0D0D0F<small style="margin-left:auto">100%</small></div></div></div>
      <div class="sect"><h6>Export</h6><div class="row"><div class="fld">1x · PNG</div></div></div>`);
    const kind = right.querySelector(".kind"), fname2 = right.querySelector(".fname2"), fwt = right.querySelector(".fwt");

    const vp = el("div", "", win); vp.id = "viewport";
    const canvas = el("div", "", vp); canvas.id = "canvas";
    let whoText = null, bigWords = [];
    const LABELS = {};
    COLS.forEach(([cap, frames], c) => {
      const cp = el("div", "cap", canvas, cap); cp.style.left = c * COLW + "px"; cp.style.top = "-120px";
      frames.forEach((name, r) => {
        const p = frameAt(c, r), fr = el("div", "fr", canvas);
        fr.style.left = p.x + "px"; fr.style.top = p.y + "px";
        const lab = el("div", "fname", canvas, `${String(c + 1).padStart(2, "0")}.${r + 1}`); lab.style.left = p.x + "px"; lab.style.top = p.y + "px";
        LABELS[`${c},${r}`] = lab;
        if (name === "#who") {
          fr.classList.add("who");
          [[70, 26, -6, "#f4b56a,#f6e2c8"], [400, 40, 8, "#f1b9da,#f7d4c4"], [36, 160, -5, "#e9c6f0,#f7c99a"], [250, 190, 4, "#f5a9a0,#f3b26b"], [430, 180, -4, "#dfe9f5,#f3d6e9"]].forEach(([x, y, r2, g]) => {
            const k = el("div", "card", fr); k.style.cssText += `left:${x}px;top:${y}px;transform:rotate(${r2}deg);background:linear-gradient(180deg,${g})`;
          });
          whoText = el("div", "t", fr, "Who knows");
        } else if (name === "#big") {
          fr.classList.add("big");
          bigWords = WORDS.map(([w]) => { const d = el("div", "w", fr, w); if (w.length > 16) d.style.fontSize = "46px"; return d; });
        } else el("img", "", fr).src = `assets/sb/${name}.jpg`;
      });
    });

    // overlays (window space)
    const ov = el("div", "layer", win);
    const selBox = (tag) => {
      const s = el("div", "sel", ov, `<span class="tag">${tag}</span><span class="dim"></span>`);
      [[-6, -6], [-6, null], [null, -6], [null, null]].forEach(([l, t]) => {
        const h = el("span", "h", s); h.style.left = l == null ? "auto" : l + "px"; h.style.top = t == null ? "auto" : t + "px";
        if (l == null) h.style.right = "-6px"; if (t == null) h.style.bottom = "-6px";
      });
      return { s, tag: s.querySelector(".tag"), dim: s.querySelector(".dim") };
    };
    const selText = selBox("Text"), selFrame = selBox("Frame"), selHugo = selBox("Image");
    const menu = el("div", "", ov); menu.id = "menu";
    el("div", "hd", menu, "Font family");
    const items = FONTS.map((n) => { const it = el("div", "it", menu, n); it.style.fontFamily = `"${n}"`; return it; });
    const pop = el("div", "", ov); pop.id = "pop";
    pop.innerHTML = `<h4>Share Gigi Storyboard</h4>
      <div class="inv"><div class="fld">Add people, emails or teams</div><div class="btn">Invite</div></div>
      <div class="who2"><span class="av">A</span><span>Aizal <small>(you)</small></span><span class="sp"></span><small>owner</small></div>
      <hr><div class="lnk"><span class="ic">${ICON.link}</span><span class="tx">Anyone with the link<small>can view</small></span><span id="copy">${ICON.link}<span class="cl">Copy link</span></span></div>`;
    const copy = pop.querySelector("#copy"), copyLabel = copy.querySelector(".cl");
    const toast = el("div", "", ov); toast.id = "toast"; toast.innerHTML = `<i>${ICON.check}</i>Link copied to clipboard`;
    const ripple = el("div", "", ov); ripple.id = "ripple";
    const cursor = el("div", "", ov); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    // fixed spots in window space
    const POP = { x: 1430, y: 58 };
    const posIn = (node, root) => { let x = 0, y = 0; for (let n = node; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };
    let SPOT = null;
    const measure = () => {
      pop.style.transform = "none"; pop.style.left = POP.x + "px"; pop.style.top = POP.y + "px"; pop.style.display = "block";
      const [sx, sy] = posIn(share, win), [cx2, cy2] = posIn(copy, win);
      SPOT = { share: [sx + share.offsetWidth * 0.62, sy + share.offsetHeight * 0.62], copy: [cx2 + copy.offsetWidth * 0.6, cy2 + copy.offsetHeight * 0.62], popB: POP.y + pop.offsetHeight,
        whoW: whoText.offsetWidth, whoH: whoText.offsetHeight };
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(R0._f); });

    // cursor path in window space: [frame, x, y, ease]
    const curKeys = () => {
      const c0 = canAt(32), [tx, ty] = toWin(c0, WHO.cx + 30, WHO.cy + 8);
      const mx = MENU_AT(c0)[0] + 150, my = (i) => MENU_AT(c0)[1] + 8 + 23 + 19 + 38 * i;
      const [hx, hy] = toWin(canAt(190), HUGO.cx + 90, HUGO.cy - 30);
      return [
        [24, 1500, 980], [32, tx, ty], [38, tx + 10, ty + 14, "s"], [40, mx, my(0)], [44, mx, my(1)], [48, mx, my(2)], [52, mx, my(3)], [56, mx, my(4)], [60, mx, my(5)], [66, mx + 6, my(5) + 4, "s"], [76, 1500, 1000],
        [182, 1500, 900], [190, hx, hy], [212, hx + 30, hy + 20, "s"], [244, 1250, 760], [264, SPOT.share[0], SPOT.share[1]], [272, SPOT.share[0] - 6, SPOT.share[1] + 30, "s"],
        [286, SPOT.copy[0], SPOT.copy[1]], [312, SPOT.copy[0] + 20, SPOT.copy[1] + 26, "s"],
      ];
    };
    const MENU_AT = (c) => { const [x, y] = toWin(c, WHO.cx, WHO.cy); return [x - 120, y + 46]; };
    const curVisible = (f) => (f >= 24 && f < 76) || (f >= 182 && f < 345);

    function render(f) {
      blobs.forEach((o, i) => {
        const t = f / FRAMES;
        o.b.style.transform = `translate(${px(o.x - o.s / 2 + 160 * Math.sin(t * 3.1 + i * 1.7))}, ${px(o.y - o.s / 2 + 110 * Math.cos(t * 2.6 + i))})`;
      });

      // window camera
      const s = tw(f, WIN.s), Fx = tw(f, WIN.fx), Fy = tw(f, WIN.fy), ox = tw(f, WIN.ox), oy = tw(f, WIN.oy);
      win.style.transform = `translate(${px(960 + ox)}, ${px(540 + oy)}) scale(${s.toFixed(5)}) translate(${px(-Fx)}, ${px(-Fy)})`;
      win.style.borderRadius = px(22 / Math.max(s, 0.5));

      // canvas camera
      const c = canAt(f);
      canvas.style.transform = `translate(${px(VP.w / 2)}, ${px(VP.h / 2)}) scale(${c.z.toFixed(5)}) translate(${px(-c.cx)}, ${px(-c.cy)})`;
      zoomTxt.textContent = Math.round(c.z * 100) + "%";

      // ---- title font: preview each face while hovering, land on Inter Display
      const hov = f < 40 || f >= 66 ? -1 : HOVER.filter(([k]) => f >= k).pop()[1];
      const face = f >= 63 ? 5 : hov >= 0 ? hov : 0;
      const lastSwap = f >= 63 ? 63 : hov >= 0 ? HOVER[hov][0] : -99;
      whoText.style.fontFamily = `"${FONTS[face]}"`;
      whoText.style.fontWeight = face === 5 ? "700" : "400";
      whoText.style.letterSpacing = face === 5 ? "-0.03em" : "0";
      whoText.style.transform = `translate(-50%, -50%) scale(${(1 + 0.07 * (1 - eo(ramp(f, lastSwap, lastSwap + 5)))).toFixed(4)})`;
      fname2.textContent = FONTS[face]; fwt.textContent = face === 5 ? "Bold" : "Regular";
      items.forEach((it, i) => it.classList.toggle("on", i === (f >= 63 ? 5 : hov)));

      // selection on the title text
      if (show(selText.s, f >= 33 && f < 72)) {
        const w = whoText.offsetWidth * (face === 5 ? 1 : 1), h = whoText.offsetHeight;
        const [x0, y0] = toWin(c, WHO.cx - w / 2 - 6, WHO.cy - h / 2 - 4);
        const a = eo(ramp(f, 33, 36));
        selText.s.style.left = px(x0); selText.s.style.top = px(y0);
        selText.s.style.width = px((w + 12) * c.z); selText.s.style.height = px((h + 8) * c.z);
        selText.s.style.opacity = a.toFixed(3);
        selText.dim.textContent = `${Math.round(w * 2.4)} × ${Math.round(h * 2.4)}`;
      }
      // font menu
      if (show(menu, f >= 37 && f < 68)) {
        const [mx, my] = MENU_AT(canAt(32));
        const o = back(ramp(f, 37, 43), 1.4), shut = eo(ramp(f, 64, 68));
        menu.style.transform = `translate(${px(mx)}, ${px(my)}) scale(${(0.9 + 0.1 * o - 0.06 * shut).toFixed(4)})`;
        menu.style.opacity = (clamp(ramp(f, 37, 40), 0, 1) * (1 - shut)).toFixed(3);
      }

      // ---- the database frame: lines swap kinetically
      const cur = WORDS.reduce((k, [, at], i) => (f >= at ? i : k), 0);
      bigWords.forEach((w, i) => {
        const at = WORDS[i][1], next = WORDS[i + 1] ? WORDS[i + 1][1] : 1e9;
        const pin = i === 0 && f < 106 ? 1 : E.o(ramp(f, at + 2, at + 10)), pout = E.i(ramp(f, next, next + 4));
        const vis = (i === cur || (i === cur - 1 && f < WORDS[cur][1] + 6));
        w.style.display = vis ? "block" : "none";
        if (!vis) return;
        const y = 0.9 * (1 - pin) - 0.9 * pout;
        w.style.transform = `translateY(calc(-50% + ${y.toFixed(3)}em)) scale(${(1.12 - 0.12 * pin).toFixed(4)})`;
        w.style.filter = blurOf(14 * (1 - pin) + 14 * pout);
        w.style.opacity = (Math.min(pin * 1.4, 1) * (1 - pout)).toFixed(3);
      });
      if (show(selFrame.s, f >= 100 && f < 162)) {
        const [x0, y0] = toWin(c, BIG.x, BIG.y);
        selFrame.s.style.left = px(x0); selFrame.s.style.top = px(y0);
        selFrame.s.style.width = px(FW * c.z); selFrame.s.style.height = px(FH * c.z);
        selFrame.s.style.opacity = eo(ramp(f, 100, 104)).toFixed(3);
        selFrame.tag.textContent = "04.4 Database"; selFrame.dim.textContent = "1920 × 1080";
      }
      if (show(selHugo.s, f >= 190 && f < 222)) {
        const [x0, y0] = toWin(c, HUGO.x, HUGO.y);
        selHugo.s.style.left = px(x0); selHugo.s.style.top = px(y0);
        selHugo.s.style.width = px(FW * c.z); selHugo.s.style.height = px(FH * c.z);
        selHugo.s.style.opacity = (eo(ramp(f, 190, 193)) * (1 - ramp(f, 216, 222))).toFixed(3);
        selHugo.tag.textContent = "06.2 Gigi profile"; selHugo.dim.textContent = "1920 × 1080";
      }
      // the selection tag takes the place of the frame's own label
      LABELS["3,3"].style.visibility = f >= 100 && f < 162 ? "hidden" : "visible";
      LABELS["5,1"].style.visibility = f >= 190 && f < 222 ? "hidden" : "visible";
      kind.textContent = f < 72 ? "Text" : f < 170 ? "Frame" : f < 226 ? "Image" : "Frame";
      const activeLayer = f < 72 ? 0 : f < 170 ? 3 : f < 226 ? 5 : -1;
      layEls.forEach((l, i) => l.classList.toggle("on", i === activeLayer));

      // ---- share → copy link
      const sp = f >= 264 ? back(ramp(f, 264, 268), 2) : 0;
      share.style.transform = `scale(${(1 - 0.08 * Math.sin(Math.PI * ramp(f, 263, 268))).toFixed(4)})`;
      if (show(pop, f >= 265)) {
        const a = back(ramp(f, 265, 273), 1.3);
        pop.style.left = POP.x + "px"; pop.style.top = POP.y + "px";
        pop.style.transform = `translateY(${px(-14 * (1 - eo(ramp(f, 265, 272))))}) scale(${(0.92 + 0.08 * a).toFixed(4)})`;
        pop.style.opacity = eo(ramp(f, 265, 269)).toFixed(3);
      }
      const copied = f >= 287;
      copy.style.background = copied ? "#111214" : "#2f93fb";
      copy.querySelector("svg").innerHTML = copied ? '<path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ICON.link.replace(/^<svg[^>]*>|<\/svg>$/g, "");
      copyLabel.textContent = copied ? "Copied" : "Copy link";
      copy.style.transform = `scale(${(1 - 0.08 * Math.sin(Math.PI * ramp(f, 285, 290))).toFixed(4)})`;
      if (show(toast, f >= 290, "flex")) {
        const a = back(ramp(f, 290, 298), 1.6);
        toast.style.transform = `translate(${px(POP.x + 210 - toast.offsetWidth / 2)}, ${px(SPOT.popB + 26 + 20 * (1 - eo(ramp(f, 290, 297))))}) scale(${(0.8 + 0.2 * a).toFixed(4)})`;
        toast.style.opacity = eo(ramp(f, 290, 294)).toFixed(3);
      }

      // ---- cursor
      if (show(cursor, curVisible(f))) {
        const k = curKeys();
        const x = tw(f, k.map((r) => [r[0], r[1], r[3] || "io"])), y = tw(f, k.map((r) => [r[0], r[2], r[3] || "io"]));
        const press = CLICKS.reduce((m, cf) => Math.max(m, Math.sin(Math.PI * ramp(f, cf - 1, cf + 3))), 0);
        cursor.style.transform = `translate(${px(x)}, ${px(y)}) scale(${((1 - 0.16 * press) / Math.max(s, 0.6) * 1.2).toFixed(4)})`;
      }
      const rc = CLICKS.find((cf) => f >= cf && f < cf + 10);
      if (show(ripple, rc != null && curVisible(f))) {
        const k = curKeys(), x = tw(rc, k.map((r) => [r[0], r[1], r[3] || "io"])), y = tw(rc, k.map((r) => [r[0], r[2], r[3] || "io"]));
        const p = ramp(f, rc, rc + 10);
        ripple.style.transform = `translate(${px(x)}, ${px(y)}) scale(${((0.3 + 1.1 * eo(p)) / Math.max(s, 0.6)).toFixed(3)})`;
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
