// "Google just made AI video three times longer and 30% cheaper" — a 54.8 s, 1080x1920 / 30 fps (1644 frames) edit
// of a talking-head AI-news short, in the language of the reference reel: a black canvas, clean dark product cards on
// top with the speaker cropped into the bottom of the frame, short word-timed captions on the seam, white highlighter
// sweeps on the key words, full-frame punch-ins between, and words that stand behind his head.
//
//   0–44       full: hook. "AI NEWS" tag, slow push out of a punch
//   44–150     split: 3× longer / 30% cheaper
//   150–270    full: punch on "Wait", a hidden price chip; huge CREATORS lands behind his head
//   270–470    split: Nov 5 calendar tile, the model card types its name, preview plays, "AI video model" highlighted
//   470–612    split: clip length counts to 15 s, the 10 s bar beneath, +5 s
//   612–760    graphics: the receipt slides up and prints: rate ≈ $0.07 / sec, 720p
//   760–935    split: the receipt rides up top: 15 sec, TOTAL rolls to $1.04
//   935–1050   split: output frame "consistent character", six reference images land and wire into it
//   1050–1200  split: native audio (a waveform driven by his voice), voice prompt edits then extends the clip
//   1200–1230  full: BEST PART? behind his head
//   1230–1380  split: Vids card: 15 s clip, $1.04 struck to $0.00, no extra cost, Google account
//   1380–1490  split: Gemini app rolling out: Ultra first
//   1490–1586  full: $1 behind his head
//   1586–1644  full: follow card, the tap; fade
(function () {
  const FPS = 30;
  const FRAMES = 1644;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const E = {
    lin: (t) => t,
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inCubic: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    outBack: (t) => { const c1 = 1.35, c3 = c1 + 1; return t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const ent = (f, at, dur = 14, e = E.outExpo) => e(prog(f, at, at + dur));
  const px = (v) => v.toFixed(2) + "px";

  // piecewise-linear lookup through [frame, value] keys
  const keyed = (keys, f) => {
    if (f <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], prog(f, keys[i - 1][0], keys[i][0]));
    return keys[keys.length - 1][1];
  };

  const el = (tag, cls, parent, html, style) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (style) e.style.cssText = style;
    e._d = e.style.display === "none" ? "" : e.style.display;
    if (parent) parent.appendChild(e);
    return e;
  };

  // A block enters (rise + blur + slight scale, exponential ease out) at `a` and leaves (lift + blur) at `b`.
  function blk(e, f, a, b, o) {
    o = o || {};
    const din = o.din || 14, dout = o.dout || 9;
    const k = (o.ease || E.outExpo)(prog(f, a, a + din));
    const x = b === undefined || b === null ? 0 : E.inCubic(prog(f, b, b + dout));
    const op = k * (1 - x);
    if (e._d === undefined) e._d = e.style.display === "none" ? "" : e.style.display;
    if (op <= 0.002) { e.style.display = "none"; return 0; }
    e.style.display = e._d;
    const dy = (o.dy === undefined ? 50 : o.dy) * (1 - k) - (o.ody === undefined ? 50 : o.ody) * x;
    const dx = (o.dx || 0) * (1 - k);
    const s = lerp(o.s0 === undefined ? 0.94 : o.s0, 1, k) * (1 - 0.04 * x);
    const bl = (o.blur === undefined ? 16 : o.blur) * (1 - k) + 18 * x;
    const r = (o.r || 0) * (1 - k);
    e.style.opacity = op.toFixed(3);
    e.style.transform = `translate(${px(dx)}, ${px(dy)}) scale(${s.toFixed(4)})${r ? ` rotate(${r.toFixed(2)}deg)` : ""}`;
    e.style.filter = bl > 0.25 ? `blur(${bl.toFixed(2)}px)` : "none";
    return k;
  }
  // a hero word lands large out of a blur and decays to rest
  function hero(e, f, a, b, o) {
    o = o || {};
    const k = 1 - Math.exp(-Math.max(0, f - a) / (o.tau || 4));
    const x = b === undefined || b === null ? 0 : E.inCubic(prog(f, b, b + (o.dout || 8)));
    if (e._d === undefined) e._d = e.style.display === "none" ? "" : e.style.display;
    if (f < a || x >= 1) { e.style.display = "none"; return 0; }
    e.style.display = e._d;
    const s = (1 + (o.over === undefined ? 0.28 : o.over) * (1 - k)) * (1 - 0.06 * x);
    const bl = 14 * Math.max(0, 1 - k * 1.6) + 20 * x;
    e.style.opacity = (Math.min(1, k * 2.2) * (1 - x)).toFixed(3);
    e.style.transform = `translate(0px, ${px((o.dy || 26) * (1 - k) - 50 * x)}) scale(${s.toFixed(4)})`;
    e.style.filter = bl > 0.25 ? `blur(${bl.toFixed(2)}px)` : "none";
    return k;
  }
  // highlighter sweep (a .hl child scales across, the text turns dark under it)
  function sweep(wrap, f, at, dur, dark) {
    const hl = wrap.querySelector(".hl"), tx = wrap.querySelector(".tx");
    const p = E.outExpo(prog(f, at, at + (dur || 7)));
    hl.style.transform = `scaleX(${p.toFixed(4)})`;
    if (tx && dark !== false) tx.style.color = p > 0.45 ? "#0a0a0a" : "";
  }

  // scenery for clip thumbnails: soft "generated" landscapes in CSS
  const thumbBG = (h) =>
    `radial-gradient(circle at 68% 34%, hsla(${h + 40},100%,85%,0.95) 0 9%, transparent 10%),` +
    `linear-gradient(185deg, transparent 58%, hsla(${h + 200},40%,12%,0.9) 59%),` +
    `linear-gradient(170deg, transparent 50%, hsla(${h + 180},35%,22%,0.85) 51%),` +
    `linear-gradient(180deg, hsl(${h},75%,62%), hsl(${h + 30},70%,38%))`;

  // ------------------------------------------------------------------ camera
  // FULL: the take fills the frame. SPLIT: the panel's top edge sits at 1060 and the take slides down so his head
  // and shoulders fill the bottom 860 px. GFX: the panel has slid off the bottom.
  const FULL = { top: 0, vy: 0, vs: 1 };
  const SPLIT = { top: 1060, vy: 730, vs: 1 };
  const GFX = { top: 1920, vy: 1590, vs: 1 };
  const FOCUS = [540, 700];
  const K = (at, dur, s, ease, extra) => Object.assign({ at, dur, ease: ease || E.inOutQuart }, s, extra || {});
  const CAM = [
    K(0, 0, FULL, null, { vs: 1.2 }),
    K(0, 24, FULL, E.outExpo, { vs: 1.06 }),
    K(24, 18, FULL, E.lin, { vs: 1.08 }),
    K(40, 15, SPLIT),
    K(146, 12, FULL, null, { vs: 1.04 }),
    K(155, 8, FULL, E.outExpo, { vs: 1.17 }),
    K(163, 51, FULL, E.lin, { vs: 1.21 }),
    K(214, 12, FULL, null, { vs: 1.0 }),
    K(226, 42, FULL, E.lin, { vs: 1.035 }),
    K(268, 15, SPLIT),
    K(606, 15, GFX),
    K(756, 15, SPLIT),
    K(1194, 12, FULL, null, { vs: 1.04 }),
    K(1206, 6, FULL, E.outExpo, { vs: 1.12 }),
    K(1212, 14, FULL, E.lin, { vs: 1.135 }),
    K(1226, 13, SPLIT),
    K(1486, 13, FULL, null, { vs: 1.0 }),
    K(1499, 56, FULL, E.lin, { vs: 1.06 }),
    K(1555, 10, FULL, E.outExpo, { vs: 1.02 }),
    K(1565, 21, FULL, E.lin, { vs: 1.035 }),
    K(1586, 40, FULL, E.inOut, { vs: 1.09 }),
  ];
  function camAt(f) {
    let s = { top: CAM[0].top, vy: CAM[0].vy, vs: CAM[0].vs };
    for (let i = 1; i < CAM.length; i++) {
      const k = CAM[i];
      if (f < k.at) break;
      const p = k.dur ? k.ease(prog(f, k.at, k.at + k.dur)) : 1;
      s = { top: lerp(s.top, k.top, p), vy: lerp(s.vy, k.vy, p), vs: lerp(s.vs, k.vs, p) };
    }
    return s;
  }

  // ------------------------------------------------------------------ captions
  const WORDS = (window.WORDS || []).map(([w, s, e]) => ({ w, s, e }));
  const KEYS = new Set([48, 61, 73, 100, 124, 169, 290, 298, 529, 544, 645, 688, 700, 853, 973, 1011, 1066, 1077, 1177, 1315, 1325, 1336, 1445, 1586]);
  const CAP_OFF = [[240, 268], [1205, 1229], [1557, 1586]];
  const CHUNKS = (() => {
    const out = [];
    let cur = [];
    WORDS.forEach((w, i) => {
      cur.push(w);
      const nx = WORDS[i + 1];
      const letters = cur.reduce((n, x) => n + x.w.length, 0);
      if (!nx || /[.,?!]$/.test(w.w) || cur.length >= 3 || letters >= 14 || nx.s - w.e > 8) { out.push(cur); cur = []; }
    });
    return out.map((ws, i) => {
      const nx = out[i + 1];
      const last = ws[ws.length - 1];
      let end = nx ? nx[0].s - 1 : last.e + 10;
      if (nx && nx[0].s - last.e > 14) end = last.e + 8;
      return { ws, a: ws[0].s - 1, b: end };
    });
  })();
  const capY = (top) => keyed([[0, 1395], [1060, 1060], [1920, 1730]], top);

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.mount = function (L) {
    const S = L.stage;
    const $ = (id) => document.getElementById(id);

    // backdrop glow behind the graphics
    const glow = el("div", "abs", L.back, "", "width:1600px;height:1600px;left:-260px;top:-270px;background:radial-gradient(circle at 50% 50%, rgba(107,155,255,0.20), rgba(167,139,250,0.08) 32%, transparent 60%);");
    const glowWarm = el("div", "abs", L.back, "", "width:1800px;height:1800px;left:-360px;top:60px;background:radial-gradient(circle at 50% 50%, rgba(255,200,120,0.16), transparent 58%);opacity:0");

    // soft edge where the take meets the graphics
    const seam = el("div", "abs", S, "", "width:1080px;height:90px;background:linear-gradient(180deg, rgba(0,0,0,0.55), transparent);");

    // ------------------------------------------------ captions DOM
    const capEls = CHUNKS.map((c) => {
      const box = el("div", "cap", L.caps);
      box.style.display = "none";
      c.wEls = c.ws.map((w) => {
        const isKey = KEYS.has(w.s);
        const we = el("span", "w", box, (isKey ? '<span class="hl"></span>' : "") + `<span class="t">${w.w.replace(/[,]$/, "")}</span>`);
        we._key = isKey;
        return we;
      });
      return box;
    });

    // ------------------------------------------------ cutouts (his matte, for words behind him)
    const cutImgs = {};
    (window.CUTOUTS || []).forEach((n) => {
      const im = el("img", "", L.cut);
      im.src = `assets/cut/c${String(n).padStart(4, "0")}.webp`;
      cutImgs[n] = im;
    });
    let cutShown = null;

    // ------------------------------------------------ S0 hook tag
    const s0 = el("div", "abs", S, '<span class="pill" style="font-size:30px;padding:12px 26px;background:rgba(0,0,0,0.6)"><span class="dot" style="color:#ff5d5d"></span><span class="mono" style="letter-spacing:.16em;font-weight:600">AI NEWS</span></span>', "left:0;width:1080px;top:230px;display:flex;justify-content:center;");

    // ------------------------------------------------ S1 3x longer / 30% cheaper
    const s1 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s1Lbl = el("div", "abs label", s1, "AI VIDEO &nbsp;·&nbsp; NEW MODEL", "left:110px;top:170px");
    const s13x = el("div", "abs huge", s1, "3×", "left:98px;top:228px;font-size:330px;transform-origin:20% 80%");
    const s1Long = el("div", "abs serif it", s1, "longer", "left:548px;top:330px;font-size:172px;line-height:1;color:#d7dce4;transform-origin:0 80%");
    const s1Rule = el("div", "abs", s1, "", "left:110px;top:560px;width:860px;height:2px;background:rgba(255,255,255,0.18);transform-origin:0 50%");
    const s130 = el("div", "abs huge", s1, "30%", "left:98px;top:612px;font-size:300px;color:#3ddc84;transform-origin:20% 80%");
    const s1Arrow = el("div", "abs", s1, '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="rgba(61,220,132,0.12)" stroke="rgba(61,220,132,0.55)" stroke-width="3"/><path d="M60 30 V88 M36 66 L60 90 L84 66" stroke="#3ddc84" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>', "left:840px;top:640px");
    const s1Cheap = el("div", "abs serif it", s1, "cheaper", "left:520px;top:858px;font-size:150px;line-height:1;color:#d7dce4;transform-origin:0 80%");

    // ------------------------------------------------ S2 price teaser + CREATORS behind
    const s2Chip = el("div", "abs", S, '<span class="pill mono" style="font-size:34px;padding:14px 30px;background:rgba(0,0,0,0.55);letter-spacing:.04em"><span style="color:#8a909a">PRICE</span>&nbsp;<span id="s2q" style="font-weight:700">$?.??</span></span>', "left:0;width:1080px;top:250px;display:flex;justify-content:center;");
    const s2Word = el("div", "behindword", L.behind, "", "font-size:178px;left:0;width:1080px;top:322px;text-align:center");
    const s2Ch = [..."CREATORS"].map((c) => el("span", "ch", s2Word, c));

    // ------------------------------------------------ S3 launch: date tile + model card
    const s3 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s3Tile = el("div", "abs", s3, `
      <div style="width:200px;height:226px;border-radius:30px;overflow:hidden;background:#f4f4f2;box-shadow:0 30px 80px rgba(0,0,0,.6)">
        <div class="mono" style="height:62px;background:#ff5d5d;color:#fff;font-size:30px;font-weight:700;letter-spacing:.2em;display:flex;align-items:center;justify-content:center">NOV</div>
        <div style="height:164px;display:flex;align-items:center;justify-content:center;color:#111;font-size:132px;font-weight:800;letter-spacing:-.04em">5</div>
      </div>`, "left:110px;top:160px;transform-origin:50% 100%");
    const s3Lbl = el("div", "abs label", s3, "LAUNCHED", "left:350px;top:196px");
    const s3Just = el("div", "abs serif it", s3, "just announced", "left:346px;top:236px;font-size:96px;line-height:1;color:#e8ebf0");
    const s3Card = el("div", "card", s3, "", "left:110px;top:430px;width:860px;height:594px;");
    el("div", "abs", s3Card, `<div style="width:76px;height:76px;border-radius:22px;background:linear-gradient(135deg,#6b9bff,#a78bfa);display:flex;align-items:center;justify-content:center"><svg width="34" height="34" viewBox="0 0 34 34"><path d="M9 5 L29 17 L9 29 Z" fill="#fff"/></svg></div>`, "left:40px;top:40px");
    const s3Title = el("div", "abs", s3Card, "", "left:140px;top:46px;font-size:58px;font-weight:750;letter-spacing:-.025em;white-space:nowrap");
    const s3Caret = el("span", "", null, "", "display:inline-block;width:5px;height:58px;background:#6b9bff;margin-left:6px;vertical-align:-8px");
    const s3Row = el("div", "abs", s3Card, '<span class="pill blue" style="font-size:24px;padding:8px 18px;letter-spacing:.12em" >NEW</span><span id="s3hl" class="hlwrap" style="font-size:38px;font-weight:600;color:#aab0ba"><span class="hl"></span><span class="tx">AI video model</span></span>', "left:140px;top:132px;display:flex;align-items:center;gap:26px");
    const s3Prev = el("div", "thumb", s3Card, "", "left:40px;top:222px;width:780px;height:332px;");
    const s3Grad = el("div", "abs", s3Prev, "", "width:780px;height:332px");
    el("div", "abs", s3Prev, '<svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r="53" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.7)" stroke-width="3"/><path d="M45 36 L76 55 L45 74 Z" fill="#fff"/></svg>', "left:335px;top:111px");
    const s3Time = el("div", "abs mono", s3Prev, "0:00", "right:22px;top:20px;left:auto;padding:6px 14px;border-radius:10px;background:rgba(0,0,0,.55);font-size:26px;font-weight:600");
    const s3ProgT = el("div", "abs", s3Prev, "", "left:24px;bottom:22px;top:auto;width:732px;height:8px;border-radius:4px;background:rgba(255,255,255,.25)");
    const s3Prog = el("div", "abs", s3ProgT, "", "height:8px;border-radius:4px;background:#fff;width:0");

    // ------------------------------------------------ S4 clip length
    const s4 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s4Lbl = el("div", "abs label", s4, "MAX CLIP LENGTH", "left:110px;top:170px");
    const s4Num = el("div", "abs huge", s4, "0", "left:98px;top:222px;font-size:350px;font-variant-numeric:tabular-nums");
    const s4Sec = el("div", "abs serif it", s4, "seconds", "left:560px;top:378px;font-size:130px;line-height:1;color:#d7dce4");
    const s4NowL = el("div", "abs", s4, '<span style="font-size:36px;font-weight:650">Now</span>', "left:110px;top:612px");
    const s4NowV = el("div", "abs mono", s4, "0s", "left:auto;right:110px;top:616px;font-size:32px;font-weight:600;color:#cfe0ff");
    const s4NowT = el("div", "track", s4, "", "left:110px;top:672px;width:860px");
    const s4NowF = el("div", "fill", s4NowT, "", "background:linear-gradient(90deg,#6b9bff,#a78bfa);width:0");
    const s4Plus = el("div", "fill", s4NowT, "", "left:573px;width:287px;border-radius:0 17px 17px 0;background:#3ddc84;opacity:0");
    for (let i = 1; i < 15; i++) el("div", "tick", s4NowT, "", `left:${(860 * i) / 15 - 1}px`);
    const s4BefL = el("div", "abs", s4, '<span style="font-size:36px;font-weight:650;color:#8a909a">Before</span>', "left:110px;top:752px");
    const s4BefV = el("div", "abs mono", s4, "0s", "left:auto;right:110px;top:756px;font-size:32px;font-weight:600;color:#8a909a");
    const s4BefT = el("div", "track", s4, "", "left:110px;top:812px;width:860px");
    const s4BefF = el("div", "fill", s4BefT, "", "background:#5a606a;width:0");
    for (let i = 1; i < 15; i++) el("div", "tick", s4BefT, "", `left:${(860 * i) / 15 - 1}px`);
    const s4Guide = el("div", "abs", s4, "", "left:682px;top:660px;width:0;height:200px;border-left:3px dashed rgba(61,220,132,0.6);transform-origin:50% 0");
    const s4Chip = el("div", "abs", s4, '<span class="pill green" style="font-size:36px;padding:12px 28px">+5 sec</span>', "left:732px;top:888px");

    // ------------------------------------------------ S5 receipt
    const rc = el("div", "receipt", S, `
      <div style="text-align:center;font-size:24px;letter-spacing:.3em;color:#777">RECEIPT</div>
      <div style="text-align:center;font-size:40px;font-weight:700;margin-top:16px;letter-spacing:.01em">GEMINI OMNI 1.2 FLASH</div>
      <div style="text-align:center;font-size:24px;color:#777;margin-top:10px;letter-spacing:.12em">AI VIDEO · NOV 05</div>
      <div class="rule" style="margin-top:28px"></div>
      <div class="row" id="rc1"><span class="k">RATE</span><span class="mark" id="rcm1"><span class="hl"></span><span class="tx" style="font-weight:700">≈ $0.07 / SEC</span></span></div>
      <div class="row" id="rc2"><span class="k">RESOLUTION</span><span style="font-weight:700">720p</span></div>
      <div class="row" id="rc3"><span class="k">CLIP LENGTH</span><span style="font-weight:700">15 SEC</span></div>
      <div class="rule" id="rcr2"></div>
      <div class="row" id="rc4" style="padding:18px 0 10px"><span style="font-size:40px;font-weight:800;letter-spacing:.06em">TOTAL</span><span class="mark" id="rcm2"><span class="hl"></span><span class="tx" id="rcTot" style="font-size:72px;font-weight:800;letter-spacing:-.02em">$0.00</span></span></div>
      <div class="rule" id="rcr3"></div>
      <div id="rc5" style="text-align:center;margin-top:16px">
        <div style="font-size:22px;letter-spacing:.24em;color:#666">VIDEO OUTPUT</div>
        <div style="margin:18px auto 0;width:420px;height:64px;background:repeating-linear-gradient(90deg,#141414 0 3px,transparent 3px 7px,#141414 7px 8px,transparent 8px 13px,#141414 13px 18px,transparent 18px 21px)"></div>
      </div>
      <div class="zig"></div>`, "left:210px;top:0;transform-origin:330px 0px");
    const rcRows = ["rc1", "rc2", "rc3", "rcr2", "rc4", "rcr3", "rc5"].map($);
    const rcM1 = $("rcm1"), rcM2 = $("rcm2"), rcTot = $("rcTot");

    // ------------------------------------------------ S6 consistent characters
    const s6 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s6Lbl = el("div", "abs label", s6, "REFERENCE IMAGES", "left:110px;top:150px");
    const s6Cnt = el("div", "abs mono", s6, "0 / 6", "left:auto;right:110px;top:146px;font-size:30px;font-weight:700;color:#fff");
    const s6Svg = el("div", "abs", s6, "", "width:1080px;height:1060px");
    const TW = 130, TH = 166, TY = 200;
    const s6Tiles = [];
    let paths = "";
    const GRADES = ["none", "saturate(1.25) hue-rotate(-8deg)", "grayscale(1) contrast(1.1)", "sepia(.45) saturate(1.2)", "saturate(1.1) hue-rotate(160deg) brightness(1.05)", "contrast(1.15) saturate(.8)"];
    for (let i = 0; i < 6; i++) {
      const x = 110 + i * 146;
      const t = el("div", "tile", s6, `<img src="assets/stills/ref${i + 1}.jpg" style="filter:${GRADES[i]}">`, `left:${x}px;top:${TY}px;width:${TW}px;height:${TH}px;transform-origin:50% 50%`);
      s6Tiles.push(t);
      const x0 = x + TW / 2, y0 = TY + TH + 6, x1 = 540 + (i - 2.5) * 40, y1 = 452;
      paths += `<path d="M${x0} ${y0} C${x0} ${y0 + 50}, ${x1} ${y1 - 50}, ${x1} ${y1}" stroke="rgba(107,155,255,0.85)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    s6Svg.innerHTML = `<svg width="1080" height="1060">${paths}</svg>`;
    const s6Paths = [...s6Svg.querySelectorAll("path")];
    s6Paths.forEach((p) => { const L0 = p.getTotalLength ? p.getTotalLength() : 300; p._len = L0 || 300; p.style.strokeDasharray = p._len; });
    const s6Out = el("div", "card", s6, '<img src="assets/stills/out.jpg" style="width:100%;height:100%;object-fit:cover;display:block">', "left:250px;top:452px;width:580px;height:560px;border-radius:30px;border-color:rgba(255,255,255,0.18)");
    const s6Scan = el("div", "abs", s6Out, "", "width:580px;height:140px;background:linear-gradient(180deg, transparent, rgba(107,155,255,0.35) 50%, transparent);mix-blend-mode:screen");
    el("div", "abs label", s6Out, "OUTPUT", "left:26px;top:24px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)");
    [[18, 18, "top left"], [518, 18, "top right"], [18, 498, "bottom left"], [518, 498, "bottom right"]].forEach(([x, y, c]) => {
      const b = el("div", "bracket", s6Out, "", `left:${x}px;top:${y}px`);
      const [v, h] = c.split(" ");
      b.style[`border${v[0].toUpperCase() + v.slice(1)}Width`] = "4px";
      b.style[`border${h[0].toUpperCase() + h.slice(1)}Width`] = "4px";
      b.style[`border${v[0].toUpperCase() + v.slice(1)}${h[0].toUpperCase() + h.slice(1)}Radius`] = "14px";
    });
    const s6Chip = el("div", "abs", s6Out, '<span class="pill green" style="background:rgba(8,20,12,0.85);font-size:30px"><svg width="26" height="26" viewBox="0 0 26 26"><path d="M5 13.5 L10.5 19 L21 7" stroke="#3ddc84" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Consistent character</span>', "left:0;width:580px;top:470px;display:flex;justify-content:center");

    // ------------------------------------------------ S7 native audio + talk to edit
    const s7 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s7A = el("div", "card", s7, "", "left:110px;top:150px;width:860px;height:300px");
    el("div", "abs", s7A, '<div style="width:70px;height:70px;border-radius:20px;background:rgba(107,155,255,0.16);border:1.5px solid rgba(107,155,255,0.5);display:flex;align-items:center;justify-content:center"><svg width="36" height="36" viewBox="0 0 36 36"><path d="M5 13 H11 L19 6 V30 L11 23 H5 Z" fill="#cfe0ff"/><path d="M24 12 Q28 18 24 24 M28 8 Q35 18 28 28" stroke="#cfe0ff" stroke-width="3" fill="none" stroke-linecap="round"/></svg></div>', "left:40px;top:36px");
    el("div", "abs", s7A, "Native audio", "left:132px;top:46px;font-size:48px;font-weight:750;letter-spacing:-.02em");
    el("div", "abs", s7A, '<span class="pill blue" style="font-size:22px;padding:7px 16px;letter-spacing:.12em">BUILT IN</span>', "left:auto;right:40px;top:52px");
    const s7Wave = el("div", "abs", s7A, "", "left:40px;top:138px;width:780px;height:130px");
    const NB = 56;
    const s7Bars = [];
    for (let i = 0; i < NB; i++) s7Bars.push(el("div", "bar", s7Wave, "", `left:${i * 14}px;height:10px;bottom:auto`));
    const s7B = el("div", "card", s7, "", "left:110px;top:490px;width:860px;height:530px");
    const s7In = el("div", "abs", s7B, "", "left:36px;top:36px;width:788px;height:112px;border-radius:56px;border:1.5px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.03)");
    const s7Ring = el("div", "abs", s7In, "", "left:14px;top:14px;width:84px;height:84px;border-radius:50%;border:3px solid rgba(107,155,255,0.6)");
    el("div", "abs", s7In, '<svg width="30" height="38" viewBox="0 0 30 38"><rect x="8" y="2" width="14" height="22" rx="7" fill="#fff"/><path d="M3 18 Q3 30 15 30 Q27 30 27 18 M15 30 V36" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>', "left:21px;top:21px;width:70px;height:70px;border-radius:50%;background:#3b6ff5;display:flex;align-items:center;justify-content:center");
    const s7Txt = el("div", "abs", s7In, "", "left:122px;top:33px;font-size:40px;font-weight:550;white-space:nowrap;color:#eef0f3");
    const VOICE = [["Edit", 1146], ["this", 1153], ["clip,", 1160], ["then", 1170], ["extend", 1177], ["it", 1188]];
    const s7W = VOICE.map(([w]) => el("span", "", s7Txt, w + " "));
    const s7Ph = el("span", "", s7Txt, "Talk to edit…", "color:#5a606a");
    el("div", "abs label", s7B, "TIMELINE", "left:40px;top:196px");
    const s7Clip = el("div", "abs", s7B, "", "left:40px;top:250px;width:520px;height:150px;border-radius:16px;overflow:hidden;display:flex;gap:4px");
    for (let i = 0; i < 4; i++) el("div", "", s7Clip, "", `flex:1;height:150px;background:${thumbBG(200 + i * 22)}`);
    const s7Trim = el("div", "abs", s7B, "", "left:34px;top:244px;width:532px;height:162px;border-radius:20px;border:5px solid #ffc857;box-shadow:0 0 30px rgba(255,200,87,0.35)");
    const s7Ext = el("div", "abs", s7B, "", "left:568px;top:250px;width:0;height:150px;border-radius:16px;overflow:hidden;display:flex;gap:4px;box-shadow:0 0 40px rgba(61,220,132,0.4);outline:4px solid #3ddc84;outline-offset:-4px");
    for (let i = 0; i < 2; i++) el("div", "", s7Ext, "", `flex:0 0 128px;height:150px;background:${thumbBG(290 + i * 22)}`);
    const s7ExtChip = el("div", "abs", s7B, '<span class="pill green" style="font-size:28px">+ extended</span>', "left:588px;top:424px");
    const s7Ruler = el("div", "abs mono", s7B, "", "left:40px;top:424px;width:520px;font-size:22px;color:#5a606a;display:flex;justify-content:space-between");
    s7Ruler.innerHTML = "<span>0s</span><span>5s</span><span>10s</span>";

    // ------------------------------------------------ S8 BEST PART? behind
    const s8Word = el("div", "behindword", L.behind, "", "font-size:168px;left:0;width:1080px;top:288px;text-align:center");
    const s8Ch = [..."BEST PART?"].map((c) => el("span", "ch", s8Word, c === " " ? "&nbsp;" : c));

    // ------------------------------------------------ S9 Vids card
    const s9 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s9C = el("div", "card", s9, "", "left:110px;top:150px;width:860px;height:870px");
    el("div", "abs", s9C, '<div style="width:92px;height:92px;border-radius:26px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);display:flex;align-items:center;justify-content:center"><svg width="40" height="40" viewBox="0 0 40 40"><rect x="3" y="9" width="24" height="22" rx="5" fill="#fff"/><path d="M29 15 L37 10 V30 L29 25 Z" fill="#fff"/></svg></div>', "left:40px;top:40px");
    el("div", "abs", s9C, "Google Vids", "left:156px;top:46px;font-size:54px;font-weight:750;letter-spacing:-.025em");
    const s9Sub = el("div", "abs", s9C, "15-second clips", "left:158px;top:110px;font-size:30px;color:#8a909a;font-weight:500");
    const s9Th = el("div", "thumb", s9C, "", `left:40px;top:180px;width:780px;height:300px;background:${thumbBG(16)}`);
    el("div", "abs mono", s9Th, "0:15", "left:auto;right:20px;top:18px;padding:6px 14px;border-radius:10px;background:rgba(0,0,0,.55);font-size:26px;font-weight:600");
    const s9ThBar = el("div", "abs", s9Th, "", "left:22px;bottom:20px;top:auto;height:8px;border-radius:4px;background:#fff;width:0");
    el("div", "abs label", s9C, "COST PER CLIP", "left:40px;top:528px");
    const s9Old = el("div", "abs", s9C, "$1.04", "left:auto;right:40px;top:600px;font-size:76px;font-weight:700;color:#5a606a;letter-spacing:-.03em");
    const s9Strike = el("div", "abs", s9C, "", "left:auto;right:30px;top:650px;width:220px;height:7px;border-radius:4px;background:#ff5d5d;transform-origin:0 50%");
    const s9New = el("div", "abs huge", s9C, "$0.00", "left:36px;top:568px;font-size:170px;color:#3ddc84;transform-origin:0 80%");
    const s9Pill = el("div", "abs", s9C, '<span class="pill green" style="font-size:32px;padding:12px 28px">No extra cost</span>', "left:40px;top:744px");
    const s9Acc = el("div", "abs", s9C, '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#ffb86b,#ff5d8f);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px">G</div><span style="font-size:30px;color:#aab0ba;font-weight:550">with a Google account</span>', "left:auto;right:40px;top:752px;display:flex;align-items:center;gap:16px");

    // ------------------------------------------------ S10 rollout
    const s10 = el("div", "abs", S, "", "width:1080px;height:1060px;transform-origin:540px 530px");
    const s10C = el("div", "card", s10, "", "left:110px;top:150px;width:860px;height:760px");
    el("div", "abs", s10C, '<div style="width:92px;height:92px;border-radius:26px;background:linear-gradient(135deg,#1f2937,#374151);border:1.5px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center"><svg width="44" height="44" viewBox="0 0 44 44"><path d="M8 10 H36 A4 4 0 0 1 40 14 V28 A4 4 0 0 1 36 32 H20 L12 38 V32 H8 A4 4 0 0 1 4 28 V14 A4 4 0 0 1 8 10 Z" fill="#cfe0ff"/></svg></div>', "left:40px;top:40px");
    el("div", "abs", s10C, "Gemini app", "left:156px;top:58px;font-size:54px;font-weight:750;letter-spacing:-.025em");
    const s10Pill = el("div", "abs", s10C, '<span class="pill amber" style="font-size:24px;padding:9px 20px;letter-spacing:.12em"><span class="dot" id="s10dot"></span>ROLLING OUT</span>', "left:auto;right:40px;top:66px");
    const s10T = el("div", "track", s10C, "", "left:50px;top:182px;width:760px;height:18px;border-radius:9px");
    const s10F = el("div", "fill", s10T, "", "border-radius:9px;width:0;background:repeating-linear-gradient(-45deg,#ffc857 0 14px,#e0a93a 14px 28px)");
    const TIERS = [["Ultra", "first"], ["Pro", "later"], ["Free", "later"]];
    const s10Rows = TIERS.map(([n, s], i) => el("div", "tier", s10C, (i === 0
      ? '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#3ddc84"/><path d="M11 20.5 L17 26.5 L29 14" stroke="#04140a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="#3a3f47" stroke-width="3" stroke-dasharray="5 5"/></svg>') +
      `<span style="color:${i === 0 ? "#fff" : "#5a606a"}">${n}</span><span class="sub">${i === 0 ? '<span class="pill blue" id="s10first" style="font-size:24px;padding:8px 18px;letter-spacing:.14em">FIRST</span>' : '<span class="mono" style="font-size:24px;color:#4a5058;letter-spacing:.14em">LATER</span>'}</span>`,
      `top:${250 + i * 140}px;${i === 0 ? "border-color:rgba(107,155,255,0.6);background:linear-gradient(90deg,rgba(107,155,255,0.12),rgba(167,139,250,0.06));box-shadow:0 0 50px rgba(107,155,255,0.18)" : ""}`));
    const s10First = $("s10first"), s10Dot = $("s10dot");
    const s10Sub = el("div", "abs", s10C, '<span class="label" style="letter-spacing:.14em">ROLLOUT ORDER</span>', "left:50px;top:684px");

    // ------------------------------------------------ S11 $1 behind
    const s11Word = el("div", "behindword", L.behind, "$1", "font-size:560px;left:0;width:1080px;top:70px;text-align:center;transform-origin:540px 300px");

    // ------------------------------------------------ S12 follow card
    const s12 = el("div", "abs", S, "", "left:120px;top:1450px;width:840px;height:150px;border-radius:75px;background:rgba(14,16,20,0.92);border:1.5px solid rgba(255,255,255,0.14);box-shadow:0 30px 80px rgba(0,0,0,0.6)");
    el("div", "abs", s12, '<img src="assets/stills/avatar.jpg" style="width:110px;height:110px;border-radius:50%;object-fit:cover;display:block;border:3px solid rgba(255,255,255,0.2)">', "left:20px;top:20px");
    el("div", "abs", s12, '<div style="font-size:40px;font-weight:750;letter-spacing:-.02em">Daily AI news</div><div style="font-size:26px;color:#8a909a;margin-top:6px;font-weight:500">A new story every day</div>', "left:154px;top:32px");
    const s12Btn = el("div", "abs btn", s12, "Follow", "left:auto;right:24px;top:33px;background:#3b6ff5;color:#fff;min-width:250px");
    const s12Cur = el("div", "abs", S, "", "width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.95);box-shadow:0 6px 20px rgba(0,0,0,0.5);");
    const s12Rip = el("div", "abs", S, "", "width:40px;height:40px;border-radius:50%;border:4px solid rgba(255,255,255,0.8)");

    // ------------------------------------------------------------ render
    function render(fr) {
      const f = fr;
      const fi = Math.floor(f + 1e-6);

      // camera
      const c = camAt(f);
      const tx = FOCUS[0] * (1 - c.vs), ty = FOCUS[1] * (1 - c.vs) + c.vy;
      const tr = `translate(${px(tx)}, ${px(ty)}) scale(${c.vs.toFixed(5)})`;
      L.video.style.transform = tr;
      const clip = `inset(${px(Math.min(1920, c.top))} 0px 0px 0px)`;
      L.cam.style.clipPath = clip;
      L.cut.style.clipPath = clip;
      seam.style.transform = `translateY(${px(c.top)})`;
      seam.style.opacity = c.top > 4 && c.top < 1900 ? "1" : "0";
      const gfxAmt = clamp(c.top / 1060, 0, 1);
      glow.style.opacity = (gfxAmt * (fi >= 612 && fi < 935 ? 0.3 : 1)).toFixed(3);
      glowWarm.style.opacity = (fi >= 600 && fi < 945 ? ent(f, 606, 16) * (1 - prog(f, 930, 945)) : 0).toFixed(3);

      // cutout of him (words behind)
      const cutOn = (fi >= 240 && fi <= 268) || (fi >= 1203 && fi <= 1229) || (fi >= 1555 && fi <= 1588);
      let want = null;
      if (cutOn) { if (cutImgs[fi]) want = fi; else if (cutImgs[fi - 1]) want = fi - 1; else if (cutImgs[fi + 1]) want = fi + 1; }
      if (cutShown !== want) {
        if (cutShown !== null) cutImgs[cutShown].style.display = "none";
        if (want !== null) cutImgs[want].style.display = "block";
        cutShown = want;
      }
      if (want !== null) cutImgs[want].style.transform = tr;

      // captions
      const cy = capY(c.top);
      CHUNKS.forEach((ch, i) => {
        const box = capEls[i];
        const on = fi >= ch.a && fi <= ch.b && !CAP_OFF.some(([a, b]) => fi >= a && fi <= b);
        if (!on) { if (box.style.display !== "none") box.style.display = "none"; return; }
        box.style.display = "flex";
        const k = ent(f, ch.a, 7);
        box.style.transform = `translate(-50%, -50%) translateY(${px(cy + 10 * (1 - k))}) scale(${lerp(0.92, 1, k).toFixed(4)})`;
        box.style.opacity = Math.min(1, k * 1.6).toFixed(3);
        ch.wEls.forEach((we, j) => {
          const w = ch.ws[j];
          if (we._key) {
            const hp = E.outExpo(prog(f, w.s, w.s + 6));
            we.firstChild.style.transform = `scaleX(${hp.toFixed(4)})`;
            we.lastChild.style.color = hp > 0.45 ? "#0a0a0a" : "#fff";
          }
        });
      });

      // ---------------------------------------------------------- S0
      blk(s0, f, 3, 40, { dy: -30, ody: -30 });

      // ---------------------------------------------------------- S1
      if (fi >= 40 && fi < 166) {
        s1.style.display = "";
        s1.style.transform = `scale(${lerp(1, 1.03, prog(f, 44, 160)).toFixed(4)})`;
        blk(s1Lbl, f, 46, 146, { dy: 20 });
        hero(s13x, f, 48, 146);
        blk(s1Long, f, 73, 146, { dx: 40, dy: 0 });
        s1Rule.style.transform = `scaleX(${ent(f, 83, 16).toFixed(4)})`;
        s1Rule.style.opacity = (1 - prog(f, 146, 154)).toFixed(3);
        hero(s130, f, 100, 146);
        blk(s1Arrow, f, 112, 146, { dy: -60, s0: 0.6, ease: E.outBack, din: 16 });
        blk(s1Cheap, f, 124, 146, { dx: 40, dy: 0 });
      } else s1.style.display = "none";

      // ---------------------------------------------------------- S2
      if (fi >= 165 && fi < 225) {
        blk(s2Chip, f, 169, 214, { dy: -24, ody: -30 });
        const q = $("s2q");
        const scr = "0123456789";
        q.textContent = "$" + scr[(fi * 7) % 10] + "." + scr[(fi * 3 + 1) % 10] + scr[(fi * 9 + 4) % 10];
        q.style.filter = "blur(5px)";
      } else s2Chip.style.display = "none";
      if (fi >= 240 && fi <= 270) {
        s2Word.style.display = "";
        s2Ch.forEach((ch, i) => {
          const a = 241 + i * 1.6;
          const k = E.outExpo(prog(f, a, a + 12));
          ch.style.opacity = Math.min(1, k * 1.5).toFixed(3);
          ch.style.transform = `translateY(${px(90 * (1 - k))}) scale(${lerp(1.25, 1, k).toFixed(3)})`;
          ch.style.filter = k < 0.95 ? `blur(${(12 * (1 - k)).toFixed(2)}px)` : "none";
        });
        s2Word.style.transform = `scale(${lerp(1, 1.04, prog(f, 241, 268)).toFixed(4)})`;
      } else s2Word.style.display = "none";

      // ---------------------------------------------------------- S3
      if (fi >= 280 && fi < 486) {
        s3.style.display = "";
        s3.style.transform = `scale(${lerp(1, 1.025, prog(f, 284, 476)).toFixed(4)})`;
        blk(s3Tile, f, 288, 468, { dy: 70, r: -14, ease: E.outBack, din: 18, s0: 0.7 });
        blk(s3Lbl, f, 300, 468, { dy: 20 });
        blk(s3Just, f, 324, 468, { dx: 40, dy: 0 });
        blk(s3Card, f, 322, 470, { dy: 90, din: 18 });
        const n = Math.round(keyed([[344, 0], [361, 7], [374, 12], [398, 16], [413, 21]], f));
        const T = "Gemini Omni 1.2 Flash";
        s3Title.textContent = T.slice(0, n);
        s3Title.appendChild(s3Caret);
        s3Caret.style.opacity = n < 21 || Math.floor(f / 8) % 2 === 0 ? "1" : "0";
        blk(s3Row, f, 422, null, { dy: 20, blur: 8 });
        sweep($("s3hl"), f, 446, 8);
        const pk = blk(s3Prev, f, 432, null, { dy: 30, s0: 0.97 });
        const t = f / 30;
        s3Grad.style.background =
          `radial-gradient(circle at ${50 + 30 * Math.sin(t * 0.9)}% ${40 + 25 * Math.cos(t * 0.7)}%, rgba(255,122,89,0.95), transparent 45%),` +
          `radial-gradient(circle at ${30 + 25 * Math.cos(t * 0.6)}% ${70 + 20 * Math.sin(t * 1.1)}%, rgba(124,92,255,0.95), transparent 50%),` +
          `radial-gradient(circle at ${75 + 20 * Math.sin(t * 0.5 + 1)}% ${65 + 25 * Math.sin(t * 0.8)}%, rgba(0,194,255,0.9), transparent 50%), #0b0b1a`;
        const pp = prog(f, 436, 470);
        s3Prog.style.width = px(732 * pp * 0.6);
        s3Time.textContent = "0:" + String(Math.floor(pp * 9)).padStart(2, "0") + " / 0:15";
        void pk;
      } else s3.style.display = "none";

      // ---------------------------------------------------------- S4
      if (fi >= 476 && fi < 622) {
        s4.style.display = "";
        s4.style.transform = `scale(${lerp(1, 1.025, prog(f, 480, 612)).toFixed(4)})`;
        blk(s4Lbl, f, 482, 606, { dy: 20 });
        const cnt = 15 * E.outCubic(prog(f, 503, 540));
        const nk = blk(s4Num, f, 484, 606, { dy: 40 });
        s4Num.textContent = String(Math.round(cnt));
        blk(s4Sec, f, 544, 606, { dx: 40, dy: 0 });
        blk(s4NowL, f, 500, 606, { dy: 20 });
        blk(s4NowV, f, 500, 606, { dy: 20 });
        s4NowV.textContent = Math.round(cnt) + "s";
        blk(s4NowT, f, 498, 606, { dy: 20, blur: 6 });
        s4NowF.style.width = px((860 * cnt) / 15);
        s4Plus.style.opacity = (ent(f, 598, 10) * 0.9).toFixed(3);
        const bc = 10 * E.outCubic(prog(f, 576, 598));
        blk(s4BefL, f, 568, 606, { dy: 20 });
        blk(s4BefV, f, 568, 606, { dy: 20 });
        s4BefV.textContent = Math.round(bc) + "s";
        blk(s4BefT, f, 568, 606, { dy: 20, blur: 6 });
        s4BefF.style.width = px((860 * bc) / 15);
        const gk = ent(f, 596, 12);
        s4Guide.style.transform = `scaleY(${gk.toFixed(4)})`;
        s4Guide.style.opacity = (gk * (1 - prog(f, 606, 614))).toFixed(3);
        blk(s4Chip, f, 600, 606, { dy: 30, s0: 0.6, ease: E.outBack, din: 14 });
        void nk;
      } else s4.style.display = "none";

      // ---------------------------------------------------------- S5 receipt
      if (fi >= 608 && fi < 948) {
        rc.style.display = "";
        // GFX: centred and large; SPLIT (from 756): rides up into the top panel
        const up = E.inOutQuart(prog(f, 756, 771));
        const baseY = lerp(430, 150, up), baseS = lerp(1.18, 0.98, up);
        const kin = E.outExpo(prog(f, 612, 640));
        const settle = Math.sin(prog(f, 612, 650) * Math.PI) * (1 - prog(f, 612, 650));
        const out = E.inCubic(prog(f, 935, 946));
        const rot = 9 * (1 - kin) - 2.2 * settle;
        rc.style.transform = `translate(0px, ${px(baseY + 1200 * (1 - kin) - 260 * out)}) scale(${(baseS * (1 + 0.02 * prog(f, 640, 935))).toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
        rc.style.opacity = (1 - out).toFixed(3);
        rc.style.filter = out > 0.01 ? `blur(${(16 * out).toFixed(2)}px)` : "none";
        const at = [686, 736, 801, 836, 844, 884, 898];
        rcRows.forEach((r, i) => {
          if (r._h === undefined) { r._h = r.offsetHeight || 60; r._m = r.classList.contains("rule") ? 14 : 0; r.style.overflow = "hidden"; }
          const feed = E.outCubic(prog(f, at[i] - 4, at[i] + 4));
          const k = ent(f, at[i], 10, E.outCubic);
          r.style.height = px(r._h * feed);
          if (r._m) r.style.margin = `${px(r._m * feed)} 0`;
          r.style.opacity = k.toFixed(3);
          r.style.clipPath = `inset(0 ${(100 * (1 - k)).toFixed(1)}% 0 0)`;
        });
        sweep(rcM1, f, 700, 8, false);
        const tot = 1.04 * E.outCubic(prog(f, 848, 874));
        rcTot.textContent = "$" + tot.toFixed(2);
        sweep(rcM2, f, 876, 8, false);
      } else rc.style.display = "none";

      // ---------------------------------------------------------- S6 consistent characters
      if (fi >= 940 && fi < 1062) {
        s6.style.display = "";
        s6.style.transform = `scale(${lerp(1, 1.025, prog(f, 940, 1052)).toFixed(4)})`;
        blk(s6Out, f, 945, 1050, { dy: 80, din: 18 });
        s6Scan.style.transform = `translateY(${px(-150 + ((f - 945) * 11) % 860)})`;
        blk(s6Chip, f, 973, null, { dy: 20, s0: 0.8, ease: E.outBack });
        blk(s6Lbl, f, 1001, 1050, { dy: 20 });
        blk(s6Cnt, f, 1001, 1050, { dy: 20 });
        let n = 0;
        s6Tiles.forEach((t, i) => {
          const a = 1009 + i * 4;
          if (f >= a) n++;
          blk(t, f, a, 1050, { dy: -40, s0: 0.5, ease: E.outBack, din: 14, blur: 10 });
        });
        s6Cnt.textContent = n + " / 6";
        s6Paths.forEach((p, i) => {
          const k = E.outCubic(prog(f, 1027 + i * 2, 1039 + i * 2));
          p.style.strokeDashoffset = (p._len * (1 - k)).toFixed(1);
          p.style.opacity = (1 - prog(f, 1050, 1058)).toFixed(3);
        });
      } else s6.style.display = "none";

      // ---------------------------------------------------------- S7 audio + talk
      if (fi >= 1054 && fi < 1206) {
        s7.style.display = "";
        s7.style.transform = `scale(${lerp(1, 1.025, prog(f, 1056, 1200)).toFixed(4)})`;
        blk(s7A, f, 1058, 1194, { dy: 80, din: 18 });
        const env = window.VOICE_ENV || [];
        s7Bars.forEach((b, i) => {
          const src = clamp(fi - (NB - 1 - i), 0, env.length - 1);
          const v = env[src] || 0;
          const wob = 0.5 + 0.5 * Math.sin(i * 1.7 + f * 0.3);
          const h = 8 + 116 * v * (0.75 + 0.25 * wob) * ent(f, 1062, 20);
          b.style.height = px(h);
          b.style.top = px(65 - h / 2);
        });
        blk(s7B, f, 1103, 1194, { dy: 80, din: 18 });
        const talk = fi >= 1121 && fi < 1196;
        const rp = ((f - 1121) % 24) / 24;
        s7Ring.style.transform = `scale(${talk ? 1 + 0.35 * rp : 1})`;
        s7Ring.style.opacity = talk ? (1 - rp).toFixed(3) : "0";
        let any = false;
        s7W.forEach((w, i) => { const on = f >= VOICE[i][1] - 1; w.style.display = on ? "" : "none"; any = any || on; });
        s7Ph.style.display = any ? "none" : "";
        const trk = ent(f, 1146, 10);
        s7Trim.style.opacity = (trk * (1 - prog(f, 1174, 1180))).toFixed(3);
        s7Trim.style.transform = `scale(${lerp(1.06, 1, trk).toFixed(4)})`;
        const ek = E.outExpo(prog(f, 1177, 1195));
        s7Ext.style.width = px(260 * ek);
        s7Ext.style.opacity = ek > 0.01 ? "1" : "0";
        blk(s7ExtChip, f, 1184, null, { dy: 20, s0: 0.7, ease: E.outBack });
        s7Ruler.style.width = px(520 + 260 * ek);
        s7Ruler.innerHTML = ek > 0.5 ? "<span>0s</span><span>5s</span><span>10s</span><span>15s</span>" : "<span>0s</span><span>5s</span><span>10s</span>";
      } else s7.style.display = "none";

      // ---------------------------------------------------------- S8 BEST PART?
      if (fi >= 1204 && fi <= 1231) {
        s8Word.style.display = "";
        s8Ch.forEach((ch, i) => {
          const a = (i < 5 ? 1205 : 1209) + (i % 5) * 1.2;
          const k = E.outExpo(prog(f, a, a + 10));
          ch.style.opacity = Math.min(1, k * 1.5).toFixed(3);
          ch.style.transform = `translateY(${px(80 * (1 - k))}) scale(${lerp(1.3, 1, k).toFixed(3)})`;
          ch.style.filter = k < 0.95 ? `blur(${(12 * (1 - k)).toFixed(2)}px)` : "none";
        });
        s8Word.style.transform = `scale(${lerp(1, 1.04, prog(f, 1205, 1229)).toFixed(4)})`;
      } else s8Word.style.display = "none";

      // ---------------------------------------------------------- S9 Vids
      if (fi >= 1228 && fi < 1392) {
        s9.style.display = "";
        s9.style.transform = `scale(${lerp(1, 1.025, prog(f, 1230, 1384)).toFixed(4)})`;
        blk(s9C, f, 1231, 1380, { dy: 90, din: 18 });
        blk(s9Sub, f, 1272, null, { dy: 14, blur: 6 });
        blk(s9Th, f, 1264, null, { dy: 30, s0: 0.97 });
        s9ThBar.style.width = px(736 * prog(f, 1266, 1380));
        blk(s9Old, f, 1300, null, { dy: 20 });
        s9Strike.style.transform = `scaleX(${E.outExpo(prog(f, 1315, 1325)).toFixed(4)})`;
        hero(s9New, f, 1325, null, { over: 0.22 });
        if (fi >= 1325) { const v = 1.04 * (1 - E.outCubic(prog(f, 1325, 1340))); s9New.textContent = "$" + v.toFixed(2); }
        blk(s9Pill, f, 1336, null, { dy: 20, s0: 0.8, ease: E.outBack });
        blk(s9Acc, f, 1354, null, { dx: 30, dy: 0 });
      } else s9.style.display = "none";

      // ---------------------------------------------------------- S10 rollout
      if (fi >= 1384 && fi < 1500) {
        s10.style.display = "";
        s10.style.transform = `scale(${lerp(1, 1.025, prog(f, 1386, 1490)).toFixed(4)})`;
        blk(s10C, f, 1387, 1487, { dy: 90, din: 18 });
        blk(s10Pill, f, 1424, null, { dy: 14, s0: 0.8, ease: E.outBack });
        s10Dot.style.opacity = (0.4 + 0.6 * Math.abs(Math.sin(f / 7))).toFixed(3);
        s10F.style.width = px(760 * 0.38 * E.outCubic(prog(f, 1426, 1450)));
        s10F.style.backgroundPosition = `${(f * 1.6).toFixed(1)}px 0`;
        blk(s10T, f, 1424, null, { dy: 10, blur: 4 });
        s10Rows.forEach((r, i) => blk(r, f, 1443 + i * 5, null, { dy: 40 }));
        blk(s10First, f, 1470, null, { dy: 0, s0: 0.5, ease: E.outBack, din: 12 });
        blk(s10Sub, f, 1462, null, { dy: 14 });
      } else s10.style.display = "none";

      // ---------------------------------------------------------- S11 $1
      if (fi >= 1555 && fi <= 1588) {
        hero(s11Word, f, 1557, null, { over: 0.3, tau: 4.5, dy: 60 });
      } else s11Word.style.display = "none";

      // ---------------------------------------------------------- S12 follow
      if (fi >= 1584) {
        blk(s12, f, 1586, null, { dy: 120, din: 18, s0: 0.9 });
        const tap = 1604;
        const mv = E.inOut(prog(f, 1592, tap));
        const cx = lerp(1010, 805, mv), cyy = lerp(1780, 1508, mv);
        const press = f >= tap && f < tap + 6 ? 0.82 : 1;
        s12Cur.style.display = fi >= 1590 && fi < 1626 ? "" : "none";
        s12Cur.style.opacity = (ent(f, 1590, 6) * (1 - prog(f, 1618, 1626))).toFixed(3);
        s12Cur.style.transform = `translate(${px(cx - 20)}, ${px(cyy - 20)}) scale(${press})`;
        const rp = prog(f, tap, tap + 14);
        s12Rip.style.display = rp > 0 && rp < 1 ? "" : "none";
        s12Rip.style.opacity = (1 - rp).toFixed(3);
        s12Rip.style.transform = `translate(${px(cx - 20)}, ${px(cyy - 20)}) scale(${(1 + 3 * E.outCubic(rp)).toFixed(3)})`;
        const done = f >= tap + 1;
        s12Btn.innerHTML = done ? '<svg width="30" height="30" viewBox="0 0 30 30"><path d="M6 15.5 L12.5 22 L24 9" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Following' : "Follow";
        s12Btn.style.background = done ? "#2a2f38" : "#3b6ff5";
        s12Btn.style.transform = `scale(${f >= tap && f < tap + 5 ? 0.94 : 1})`;
      } else { s12.style.display = "none"; s12Cur.style.display = "none"; s12Rip.style.display = "none"; }

      // fade out
      L.fade.style.opacity = prog(f, 1630, 1643).toFixed(3);
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
