// Gigi storyboard — 11.07 s, 30 fps, 332 frames, in the launch video's look (white/grey, Inter, brand blue, black).
// The motion copies the reference edit's grammar beat for beat: hard cuts on its exact frames, instant swaps
// stepped on its 25 fps cadence, UI pills staggering in, an iridescent blur for content changes, and page scrolls
// driven by the reference's measured per-frame scroll speeds (jolt, cut at peak speed, the next shot carrying it).
//   0–37     the window rises in close on the title; the font menu flicks through faces, lands on Inter Display
//   38–91    a storyboard image: adjust panel + pills; Enhance → iridescent regenerate
//   92–129   the "Who knows / Who is" section: layout picker swaps arrangements
//   130–145  the whole design tool, slow push
//   146–208  a prompt is typed over "Your inbox." and sent
//   209–238  the line morphs to "Your calendar." and the page scrolls away
//   239–275  dark section scrolling: "Your WhatsApp." morphs to "is a terrible database"
//   276–332  the design tool again: Share → Copy link → Link copied, then it whips off left for the match cut
(function () {
  const FPS = 30, FRAMES = 332;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  // professional cursor moves: gentle start, gentle stop
  const sio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // a punch on a cut: the shot lands a touch oversized and settles
  const kick = (F, at, amt = 0.07, dur = 7) => 1 + amt * (1 - eo(ramp(F, at, at + dur)));
  const back = (t, s = 1.8) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  // the reference runs 25 fps content in 30: every sixth frame repeats the one before
  const q = (F) => { const i = Math.floor(F); return i % 6 === 1 ? i - 1 : i; };
  // [frame, value] steps → value of the latest step at f
  const step = (f, k) => k.reduce((v, [at, x]) => (f >= at ? x : v), k[0][1]);
  // [frame, value] keys with an eased glide between them
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
  // scrolled distance at (fractional) frame F, continuous within a frame so 240 fps sampling blurs it naturally
  const scrollAt = (tab, F) => {
    const i = Math.floor(F);
    let s = 0;
    for (const [k, v] of Object.entries(tab)) if (+k < i) s += v;
    return 1.5 * (s + (tab[i] || 0) * (F - i));
  };
  const scrollTotal = (tab) => 1.5 * Object.values(tab).reduce((a, b) => a + b, 0);

  const SHOTS = [[0, 38], [38, 92], [92, 130], [130, 146], [146, 239], [239, 276], [276, 333]];
  const FONTS = ["Inter Display", "Liberation Serif", "Caladea", "JetBrains Mono", "DejaVu Serif", "FreeSerif"];
  const FONT_SEQ = [[0, 3], [6, 1], [12, 2], [18, 4], [24, 5], [30, 0]];
  const LAYOUT_SEQ = [[0, -1, "whoisD"], [100, 0, "whoisA"], [106, 2, "whoisB"], [112, 3, "whoisC"], [118, 1, "whoisD"]];
  const PROMPT = "Say it the way Gigi would";
  const CLICKS = [31, 68, 122, 206, 294, 306];
  const CUTS = [38, 92, 130, 146, 239, 276];

  const ICON = {
    sparkle: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
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

  // storyboard columns for the design-tool shots
  const COLW = 620, ROWH = 344, FW = 560;
  const COLS = [
    ["Who knows who in your network?", ["who1", "who2", "who3", "who4"]],
    ["All the data in the world.", ["keys", "sheet", "mail"]],
    ["But no human or agent can access it.", ["whoisD", "cal", "chat"]],
    ["Which is a terrible database", ["asks", "which", "respect"]],
    ["Which is why you do this:", ["phone", "post"]],
    ["Gigi understands who you know, and how well.", ["network", "hugo"]],
    ["Connect your agent to the places your relationships live.", ["ask", "features"]],
    ["But no worries", ["worries", "send", "convo"]],
    ["The network for agents to access people.", ["logo", "site"]],
  ];

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

    // ---------- shots ----------
    const shots = SHOTS.map(() => el("div", "shot", stage));
    shots.forEach((s, i) => { if (i !== 3 && i !== 6) el("div", "cv", s); });

    // S1 · font flick on the "Who knows" title
    const s1 = shots[0];
    const who = at(el("div", "art", s1), 140, 130, 1640, 925); who.style.background = "#f3f1ee";
    [[70, 26, -6, "#f4b56a,#f6e2c8"], [400, 40, 8, "#f1b9da,#f7d4c4"], [36, 160, -5, "#e9c6f0,#f7c99a"], [250, 190, 4, "#f5a9a0,#f3b26b"], [430, 180, -4, "#dfe9f5,#f3d6e9"]].forEach(([x, y, r, g]) => {
      const k = at(el("div", "abs", who), x * 2.93, y * 2.93, 92 * 2.93, 116 * 2.93);
      k.style.cssText += `border-radius:14px;transform:rotate(${r}deg);background:linear-gradient(180deg,${g});box-shadow:0 6px 20px rgba(30,32,40,.08)`;
    });
    const whoT = el("div", "abs", who, "Who knows"); whoT.style.cssText += "left:50%;top:50%;font-size:124px;line-height:1;white-space:nowrap;color:#1c1c1f;transform:translate(-50%,-50%)";
    const sel1 = selBox(s1, "Text");
    const bar1 = bar(s1, 520, 40, ["*Gigi AI", "|", "Heading 1 ⌄", '<span class="fn">Inter Display</span> ⌄', "124 ⌄", "|", "<b>B</b>", "<i>I</i>", "<u>U</u>", "|", "≡", "⋯"]);
    const bar1font = bar1.querySelector(".fn");
    const dd = at(el("div", "card2 dd", s1), 250, 590, 300);
    const ddItems = FONTS.map((n) => { const it = el("div", "it", dd, n); it.style.fontFamily = `"${n}"`; if (n === "Inter Display") it.style.fontWeight = 700; return it; });
    const pills1 = pills(s1, 1770, [610, 690, 770], ["Tighten spacing", "Make it bolder", "Match Gigi brand"]);
    orb(s1, 1736, 860);

    // S2 · image adjust + enhance
    const s2 = shots[1];
    art(s2, "who1", 1480, -150, 760, 428);
    art(s2, "keys", -280, 760, 660, 372);
    const img2 = art(s2, "who3", 500, 170, 1020, 574), img2b = el("img", "", img2.a); img2b.src = "assets/sb/who4.jpg"; img2b.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;opacity:0";
    const irid2 = el("div", "abs", img2.a); irid2.style.cssText += "width:100%;height:100%;background:linear-gradient(120deg,#cfc6ff,#c9f3d6 45%,#bfe0ff 75%,#e5d4ff);opacity:0;filter:blur(18px)";
    at(selBox(s2, "Image"), 500, 170, 1020, 574);
    bar(s2, 560, 40, ["*Gigi AI", "|", "Replace", "Crop", "Adjust", "|", "⤢", "◐", "⋯"]);
    const adj = at(el("div", "card2", s2, `<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:600;padding:2px 4px">Adjust<span style="color:#9a9ba1">✕</span></div>` +
      [["Exposure", 55], ["Contrast", 40], ["Saturation", 62], ["Highlights", 30]].map(([n, v]) => `<div class="sl">${n}<div class="tr"><i style="left:${v}%"></i></div></div>`).join("")), 330, 480, 290);
    const pills2 = pills(s2, 1770, [610, 690, 770], ["Replace image", "Crop to frame", "Enhance"]);
    const orb2 = orb(s2, 1736, 860);

    // S3 · layout picker
    const s3 = shots[2];
    art(s3, "asks", 1560, -170, 560, 316);
    art(s3, "sheet", -300, 820, 620, 350);
    const img3 = art(s3, "whoisD", 380, 200, 1180, 665);
    at(selBox(s3, "Section"), 380, 200, 1180, 665);
    bar(s3, 520, 40, ["*Gigi AI", "|", "Layout ⌄", "Auto layout", "|", "⊞", "⇆", "⋯"]);
    const lgCard = at(el("div", "card2", s3), 250, 560); lgCard.style.transformOrigin = "0 0";
    const lg = el("div", "lg", lgCard);
    const lgIcons = [4, 3, 4, 2, 4, 3].map((n) => el("div", "ic", lg, "<b></b>".repeat(n)));
    const pills3 = pills(s3, 1770, [640, 720, 800], ["Shuffle frames", "Align to grid", "Tidy up"]);
    orb(s3, 1736, 890);

    // S4 and S8 · the whole design tool
    const buildWindow = (parent) => {
      const gl = el("div", "gl", parent);
      const win = el("div", "", parent);
      win.style.cssText = "position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 40px 120px rgba(30,32,40,.18),0 8px 24px rgba(30,32,40,.08),0 0 0 1px rgba(30,32,40,.06)";
      const top = el("div", "top", win, `<span class="tool on">${ICON.move}</span><span class="tool">${ICON.frame}</span><span class="tool">${ICON.rect}</span>
        <span class="tool">${ICON.pen}</span><span class="tool">${ICON.text}</span><span class="tool">${ICON.chat}</span>
        <span class="title">Gigi / <b>Gigi Storyboard</b></span>
        <span class="right"><span class="av">A</span><span class="av b">G</span><span class="play">${ICON.play}</span><span class="shareb" style="height:32px;padding:0 16px;border-radius:8px;background:#2f93fb;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center">Share</span><span class="zoom">26%</span></span>`);
      el("div", "left", win, `<div class="tabs"><span>Layers</span><span>Assets</span></div>
        <div class="sect"><h6>Pages</h6><div class="page on">Storyboard</div><div class="page">Moodboard</div><div class="page">Archive</div></div>
        <div class="sect">${["01 Who knows", "02 All the data", "03 No access", "04 Database", "05 Ask around", "06 Gigi profile", "07 Connect", "08 No worries", "09 Logo"].map((n) => `<div class="lay"><i></i>${n}</div>`).join("")}</div>`);
      el("div", "right", win, `<div class="tabs"><span>Design</span><span>Prototype</span></div>
        <div class="sect"><h6>Page</h6><div class="row"><div class="fld"><span class="sw" style="background:#f3f3f5;border:1px solid #e3e3e7"></span>F3F3F5<small style="margin-left:auto">100%</small></div></div></div>
        <div class="sect"><h6>Local variables</h6><div class="row"><div class="fld">Brand · Gigi</div></div></div>
        <div class="sect"><h6>Styles</h6><div class="row"><div class="fld">Inter Display / Bold</div></div><div class="row"><div class="fld"><span class="sw" style="background:#2f93fb"></span>Brand blue</div></div><div class="row"><div class="fld"><span class="sw"></span>Ink</div></div></div>
        <div class="sect"><h6>Export</h6><div class="row"><div class="fld">1x · PNG</div></div></div>`);
      const vp = el("div", "", win); vp.style.cssText = "position:absolute;left:240px;top:48px;width:1440px;height:1032px;overflow:hidden;background:#f3f3f5";
      const canvas = el("div", "", vp); canvas.style.cssText = "position:absolute;left:0;top:0;transform-origin:0 0";
      COLS.forEach(([cap, frames], c) => {
        const cp = el("div", "cap", canvas, cap); cp.style.left = c * COLW + "px"; cp.style.top = "-120px";
        frames.forEach((name, r) => { const fr = el("div", "fr", canvas); fr.style.left = c * COLW + "px"; fr.style.top = r * ROWH + "px"; el("img", "", fr).src = `assets/sb/${name}.jpg`; });
      });
      const ov = el("div", "layer", win);
      return { gl, win, canvas, ov, share: top.querySelector(".shareb"), zoom: top.querySelector(".zoom") };
    };
    const W4 = buildWindow(shots[3]);
    const W8 = buildWindow(shots[6]);
    const pop = el("div", "", W8.ov); pop.id = "pop";
    pop.innerHTML = `<h4>Share Gigi Storyboard</h4>
      <div class="inv"><div class="fld">Add people, emails or teams</div><div class="btn">Invite</div></div>
      <div class="who2"><span class="av">A</span><span>Aizal <small>(you)</small></span><span class="sp"></span><small>owner</small></div>
      <hr><div class="lnk"><span class="ic">${ICON.link}</span><span class="tx">Anyone with the link<small>can view</small></span><span id="copy">${ICON.link}<span class="cl">Copy link</span></span></div>`;
    const popRows = [...pop.children];
    const copy = pop.querySelector("#copy"), copyLabel = copy.querySelector(".cl"), copyIcon = copy.querySelector("svg");
    const toast = el("div", "", W8.ov); toast.id = "toast"; toast.innerHTML = `<i>${ICON.check}</i>Link copied to clipboard`;
    const POP = { x: 1430, y: 58 };

    // S5/S6 · prompt over "Your inbox.", then morph and scroll
    const s5 = shots[4];
    const p1 = el("div", "abs", s5); p1.style.cssText += "width:1920px;height:2400px;background:#fff";
    el("div", "lbl", p1, "gigi.co").style.cssText += "left:60px;top:40px;font-size:20px";
    el("div", "lbl", p1, "STORY &nbsp;&nbsp; FRAMES &nbsp;&nbsp; NETWORK").style.cssText += "left:1300px;top:44px;font-size:15px;letter-spacing:.06em";
    el("div", "lbl", p1, "/ Who knows who<small>Your network lives in a hundred places.</small>").style.cssText += "left:60px;top:470px";
    art(p1, "asks", 1500, 300, 420, 760);
    const H1a = twoLayer(p1, "Your inbox.", 300), H1b = twoLayer(p1, "Your calendar.", 300);
    [H1a, H1b].forEach((h) => at(h.w, 24, 690));
    const sel5 = selBox(p1, "Text");
    at(el("div", "stripe", p1, "<span>gigi.co</span><span>The network for agents to access people</span><span>Who knows who</span><span>gigi.co</span>"), 0, 1080);
    el("div", "lbl", p1, "/ Every app<small>Your relationships, scattered.</small>").style.cssText += "left:60px;top:1230px";
    const H2 = twoLayer(p1, "Your messages.", 300); at(H2.w, 24, 1380); H2.i.style.display = "none";
    art(p1, "cal", 1260, 1220, 600, 338);
    art(p1, "chat", 1180, 1640, 620, 330);
    bar(p1, 560, 22, ["*Ask Gigi", "Edit text", "|", "⊕", "T", "⤢", "⋯"]);
    const prompt = at(el("div", "card2 prompt", p1, `<div class="row2"><i></i>Make it punchier</div><div class="row2"><i></i>Change tone to confident</div><div class="row2"><i></i>Shorten it</div>
      <div class="inp"><span class="ty"></span><span class="send">${ICON.arrow}</span></div>`), 560, 92, 660);
    const typed = prompt.querySelector(".ty"), sendB = prompt.querySelector(".send");

    // S7 · dark section, morph while scrolling
    const s6 = shots[5];
    const p2 = el("div", "abs dark", s6); p2.style.cssText += "width:1920px;height:2600px";
    const glow7 = el("div", "abs", p2); glow7.style.cssText += "width:1920px;height:2600px;background:radial-gradient(60% 40% at 80% 30%, rgba(47,147,251,.22), rgba(47,147,251,0) 70%), radial-gradient(50% 35% at 10% 75%, rgba(47,147,251,.14), rgba(47,147,251,0) 70%)";
    el("div", "lbl", p2, "/ Your network<small style='color:#9a9ba1'>Every conversation, a different app.</small>").style.cssText += "left:60px;top:120px;color:#fff";
    const H3a = twoLayer(p2, "Your", 280), H3b = twoLayer(p2, "is a terrible", 280), H4a = twoLayer(p2, "WhatsApp.", 280), H4b = twoLayer(p2, "database", 280);
    [H3a, H3b].forEach((h) => at(h.w, 40, 300)); [H4a, H4b].forEach((h) => at(h.w, 40, 600));
    [H3a, H3b, H4a, H4b].forEach((h) => (h.b.style.color = "#fff"));
    art(p2, "phone", 1240, 470, 560, 316);
    art(p2, "network", 980, 860, 520, 293);
    art(p2, "post", 240, 980, 600, 338);
    el("div", "lbl", p2, "/ No database<small style='color:#9a9ba1'>Just memory and luck.</small>").style.cssText += "left:1560px;top:960px;color:#fff";
    const sel7 = selBox(p2, "Text");
    art(p2, "hugo", 1100, 1480, 640, 360);
    art(p2, "convo", 160, 1560, 620, 350);
    el("div", "lbl", p2, "gigi.co").style.cssText += "left:60px;top:2050px;color:#fff;font-size:22px";

    // a soft colour wash rides across every cut
    const wash = el("div", "layer", stage);
    wash.style.cssText += "pointer-events:none;background:linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(47,147,251,.0) 18%, rgba(110,180,255,.85) 38%, rgba(205,190,255,.8) 52%, rgba(190,240,210,.75) 66%, rgba(255,255,255,0) 86%);background-size:320% 100%;filter:blur(24px);mix-blend-mode:normal";

    // cursor + ripple (screen space, on top)
    const ripple = el("div", "", stage); ripple.id = "ripple"; ripple.style.cssText += "width:70px;height:70px;margin:-35px 0 0 -35px";
    const cursor = el("div", "", stage); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64" style="width:86px;height:86px;left:-12px;top:-12px"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    // measured spots (with every shot laid out once)
    const posIn = (node, root) => { let x = 0, y = 0; for (let n = node; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };
    let M = null;
    const measure = () => {
      shots.forEach((s) => (s.style.display = "block"));
      pop.style.left = POP.x + "px"; pop.style.top = POP.y + "px"; pop.style.display = "block";
      const [shx, shy] = posIn(W8.share, W8.win), [cpx, cpy] = posIn(copy, W8.win), [sbx, sby] = posIn(sendB, p1);
      M = {
        dd: (i) => [250 + 200, 590 + 14 + 22 + 44 * i],
        share: [shx + W8.share.offsetWidth * 0.6, shy + W8.share.offsetHeight * 0.6], copy: [cpx + copy.offsetWidth * 0.6, cpy + copy.offsetHeight * 0.62], popB: POP.y + pop.offsetHeight,
        send: [sbx + 22, sby + 24],
        h1w: H1a.w.offsetWidth, h3w: Math.max(H3a.w.offsetWidth, H4a.w.offsetWidth),
        lg: (i) => [250 + 14 + 33 + (i % 2) * 78, 560 + 14 + 33 + Math.floor(i / 2) * 78],
      };
      shots.forEach((s) => (s.style.display = "none"));
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(R0._f); });

    // iridescent change: the old line turns pastel for a beat, the new one arrives pastel, then settles solid
    const morph = (A, B, f, t0) => {
      const p = f - t0;
      [A.i, B.i].forEach((n) => { n.style.backgroundSize = "220% 100%"; n.style.backgroundPosition = `${(100 - p * 9).toFixed(1)}% 0`; });
      A.w.style.display = p < 3 ? "block" : "none";
      B.w.style.display = p >= 3 ? "block" : "none";
      A.b.style.opacity = p < 0 ? 1 : 0; A.i.style.opacity = p < 0 ? 0 : 0.85; A.w.style.filter = blurOf(p < 0 ? 0 : 1.5);
      B.i.style.opacity = (1 - ramp(p, 6, 10)).toFixed(3); B.b.style.opacity = ramp(p, 6, 10).toFixed(3);
      B.w.style.filter = blurOf(p >= 3 ? 2.5 * (1 - ramp(p, 3, 8)) : 0);
    };
    // pills grow out from the right edge one after another
    const pillIn = (pl, f, t0) => pl.forEach((p, i) => {
      const k = ramp(f, t0 + 2 * i, t0 + 2 * i + 4);
      p.style.display = k > 0 ? "flex" : "none";
      p.style.transform = `scaleX(${(0.2 + 0.8 * eo(k)).toFixed(3)})`;
      p.style.color = k < 0.7 ? "transparent" : "#26272b";
    });
    // brand gradient behind the tool: blue, lilac and mint light drifting like the reference's colour fields
    const flow = (F) => {
      const a = F / 20;
      return `radial-gradient(55% 60% at ${50 + 30 * Math.sin(a)}% ${85 + 12 * Math.cos(a * 0.8)}%, rgba(47,147,251,.62), rgba(47,147,251,0) 70%),` +
        `radial-gradient(45% 50% at ${12 + 14 * Math.cos(a * 1.1)}% ${18 + 10 * Math.sin(a)}%, rgba(160,140,255,.38), rgba(160,140,255,0) 70%),` +
        `radial-gradient(40% 45% at ${88 + 8 * Math.sin(a * 1.3)}% ${20 + 14 * Math.cos(a * 0.9)}%, rgba(120,225,185,.32), rgba(120,225,185,0) 70%),` +
        `linear-gradient(180deg, #ffffff 0%, #eaf3ff 100%)`;
    };
    const windowAt = (W, s, oy, ox, z, cx, cy, F = 0) => {
      W.gl.style.background = flow(F);
      W.win.style.transform = `translate(${px(960 + ox)}, ${px(540 + oy)}) scale(${s.toFixed(5)}) translate(-960px, -540px)`;
      W.canvas.style.transform = `translate(720px, 516px) scale(${z.toFixed(5)}) translate(${px(-cx)}, ${px(-cy)})`;
      W.zoom.textContent = Math.round(z * 100) + "%";
    };
    const RISE = [900, 420, 190, 90, 40];

    function render(F) {
      const f = q(F);
      const shot = SHOTS.findIndex(([a, b]) => F >= a && F < b);
      shots.forEach((s, i) => (s.style.display = i === shot ? "block" : "none"));
      let cur = null, curScale = 1;

      if (shot === 0) {
        // rises in close (the reference's opening beat is tight), snaps wider on the first swap, then a slow push
        const i = Math.floor(F), rise = i < 5 ? lerp(RISE[i], RISE[i + 1] ?? 0, F - i) : 0;
        const sc = F < 5 ? 1.16 : 1 + 0.0007 * (f - 5);
        shots[0].style.transform = `translateY(${px(rise)}) scale(${sc.toFixed(4)})`;
        const fi = step(f, FONT_SEQ);
        whoT.style.fontFamily = `"${FONTS[fi]}"`; whoT.style.fontWeight = fi === 0 ? 700 : 400; whoT.style.letterSpacing = fi === 0 ? "-0.03em" : "0";
        bar1font.textContent = FONTS[fi];
        // each new face lands with a small pop
        const lastSwap = FONT_SEQ.filter(([k]) => f >= k).pop()[0];
        whoT.style.transform = `translate(-50%, -50%) scale(${(1 + 0.06 * (1 - eo(ramp(F, lastSwap, lastSwap + 4))) * (lastSwap > 0 ? 1 : 0)).toFixed(4)})`;
        ddItems.forEach((it, j) => it.classList.toggle("on", j === fi));
        const ww = whoT.offsetWidth, wh = whoT.offsetHeight;
        at(sel1, 140 + 820 - ww / 2 - 14, 130 + 462 - wh / 2 - 8, ww + 28, wh + 16);
        pillIn(pills1, f, -10);
        // the cursor glides down the list and arrives on each face as it previews
        const tx = M.dd(0)[0] + 10 * Math.sin(F / 9), ty = glide(F, FONT_SEQ.map(([k, i]) => [k, M.dd(i)[1]]), sio);
        cur = [960 + (tx - 960) * sc, 540 + (ty - 540) * sc + rise]; curScale = sc;
      } else if (shot === 1) {
        shots[1].style.transform = `scale(${((1 + 0.0005 * (f - 38)) * kick(F, 38)).toFixed(4)})`;
        pillIn(pills2, f, 38);
        const fade = ramp(f, 86, 91);
        pills2.forEach((p) => (p.style.opacity = (1 - fade).toFixed(3)));
        adj.style.opacity = (eo(ramp(f, 38, 42)) * (1 - fade)).toFixed(3);
        // enhance: a pastel bloom over the frame, the new image underneath, then it clears
        irid2.style.opacity = (eo(ramp(f, 70, 76)) * (1 - ramp(f, 80, 88))).toFixed(3);
        img2b.style.opacity = f >= 77 ? 1 : 0;
        img2.im.style.filter = img2b.style.filter = blurOf(8 * Math.sin(Math.PI * ramp(f, 70, 88)));
        orb2.style.background = f >= 68 ? `conic-gradient(from ${f * 24}deg, #2f93fb, #9bd0ff, #2f93fb)` : "#111214";
        pills2[2].style.background = f >= 64 && f < 86 ? "#eef5ff" : "#fff";
        cur = [glide(F, [[38, 640], [64, 1600], [92, 1612]], sio), glide(F, [[38, 990], [64, 800], [92, 808]], sio)];
      } else if (shot === 2) {
        shots[2].style.transform = `scale(${((1 + 0.0005 * (f - 92)) * kick(F, 92)).toFixed(4)})`;
        pillIn(pills3, f, 92);
        lgCard.style.transform = `scale(${(0.9 + 0.1 * back(ramp(f, 92, 96), 1.4)).toFixed(4)})`;
        const [, li, src] = LAYOUT_SEQ.filter(([k]) => f >= k).pop();
        if (!img3.im.src.endsWith(src + ".jpg")) img3.im.src = `assets/sb/${src}.jpg`;
        lgIcons.forEach((ic, i) => ic.classList.toggle("on", i === li));
        const pts = LAYOUT_SEQ.slice(1).map(([k, i]) => [k, ...M.lg(i)]);
        cur = [glide(F, [[92, 1240], ...pts.map(([k, x]) => [k, x])], sio), glide(F, [[92, 990], ...pts.map(([k, , y]) => [k, y])], sio)];
      } else if (shot === 3) {
        windowAt(W4, (0.84 + 0.0022 * (f - 130)) * kick(F, 130, 0.14, 9), 0, 0, 0.4, 1210, 520, F);
      } else if (shot === 4) {
        const sy = F >= 209 ? scrollAt(SCROLL.p1, F) : 0;
        p1.style.transform = `translateY(${px(-sy)})`;
        // lands with a punch, then a snap push mid-shot like the reference's step zooms
        shots[4].style.transform = `scale(${((1 + 0.0003 * (f - 146)) * kick(F, 146) * (1 + 0.035 * eo(ramp(F, 176, 180)))).toFixed(4)})`;
        typed.textContent = PROMPT.slice(0, clamp(Math.floor((f - 150) / 1.45), 0, PROMPT.length));
        morph(H1a, H1b, f, 209);
        at(sel5, 16, 682, M.h1w + 16, 316); show(sel5, f < 209);
        sendB.style.transform = `scale(${(1 - 0.12 * Math.sin(Math.PI * ramp(f, 205, 210))).toFixed(3)})`;
        cur = [glide(F, [[146, 1040], [184, 1080], [204, M.send[0]], [239, M.send[0] + 10]], sio), glide(F, [[146, 470], [184, 500], [204, M.send[1]], [239, M.send[1] + 8]], sio) - sy];
      } else if (shot === 5) {
        p2.style.transform = `translateY(${px(-scrollAt(SCROLL.p2, F))})`;
        shots[5].style.transform = `scale(${kick(F, 239, 0.05).toFixed(4)})`;
        glow7.style.transform = `translate(${px(160 * Math.sin(F / 14))}, ${px(120 * Math.cos(F / 17))})`;
        morph(H3a, H3b, f, 246); morph(H4a, H4b, f, 246);
        at(sel7, 30, 290, M.h3w + 24, 600); show(sel7, f < 246 || f >= 256);
      } else if (shot === 6) {
        // arrives still drifting up with the reference's settle, then the share flow, then whips off left
        const oy = scrollTotal(SCROLL.p3) - scrollAt(SCROLL.p3, F);
        const ox = -2700 * ei(ramp(F, 314, 332));
        const s = (0.9 + 0.0012 * (f - 276)) * kick(F, 276, 0.06);
        windowAt(W8, s, oy, ox, 0.26, (8 * COLW + FW) / 2, 600, F);
        const toScr = ([x, y]) => [960 + ox + (x - 960) * s, 540 + oy + (y - 540) * s];
        W8.share.style.transform = `scale(${(1 - 0.08 * Math.sin(Math.PI * ramp(f, 293, 298))).toFixed(3)})`;
        if (show(pop, f >= 295)) {
          pop.style.left = POP.x + "px"; pop.style.top = POP.y + "px";
          pop.style.transform = `scale(${(0.92 + 0.08 * back(ramp(f, 295, 300), 1.4)).toFixed(4)})`;
          pop.style.opacity = eo(ramp(f, 295, 298)).toFixed(3);
          popRows.forEach((r, i) => { r.style.opacity = eo(ramp(f, 296 + i, 299 + i)).toFixed(3); });
        }
        const copied = f >= 307;
        copy.style.background = copied ? "#111214" : "#2f93fb";
        copyIcon.innerHTML = copied ? '<path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ICON.link.replace(/^<svg[^>]*>|<\/svg>$/g, "");
        copyLabel.textContent = copied ? "Copied" : "Copy link";
        copy.style.transform = `scale(${(1 - 0.1 * Math.sin(Math.PI * ramp(f, 305, 310))).toFixed(3)})`;
        if (show(toast, f >= 308, "flex")) {
          toast.style.transform = `translate(${px(POP.x + 210 - toast.offsetWidth / 2)}, ${px(M.popB + 22 + 16 * (1 - eo(ramp(f, 308, 314))))}) scale(${(0.82 + 0.18 * back(ramp(f, 308, 314), 1.6)).toFixed(4)})`;
          toast.style.opacity = eo(ramp(f, 308, 311)).toFixed(3);
        }
        const wx = glide(F, [[276, 1250], [292, M.share[0]], [296, M.share[0] - 4], [305, M.copy[0]], [332, M.copy[0] + 18]], sio);
        const wy = glide(F, [[276, 760], [292, M.share[1]], [296, M.share[1] + 30], [305, M.copy[1]], [332, M.copy[1] + 22]], sio);
        cur = toScr([wx, wy]); curScale = s;
      }

      // colour wash across the nearest cut
      const wc = CUTS.find((c) => F >= c - 3 && F < c + 6);
      if (show(wash, wc != null)) {
        const p = ramp(F, wc - 3, wc + 6);
        wash.style.opacity = (0.5 * Math.sin(Math.PI * p)).toFixed(3);
        wash.style.backgroundPosition = `${(110 - 120 * p).toFixed(1)}% 0`;
      }

      // cursor
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
