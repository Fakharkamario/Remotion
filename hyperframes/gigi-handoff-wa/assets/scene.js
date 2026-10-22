// Gigi handoff — 9.53 s, 30 fps, 286 frames. Continues the storyboard cut (which leaves to the left) in the launch
// video's look: frosted white incoming bubbles, brand-blue outgoing ones, Inter, near-white background.
//   0–20     the old chat swings in from the right; the composer rises from below
//   20–60    "storyboard done " is typed, the Figma link is pasted, sent
//   60–92    the message grows out of the composer into the chat, the link preview pops above it, the composer drops
//   92–145   "i fucking love it!!" and "let's continue" pop in word by word while the view drifts and pushes in
//   145–240  a whip up-left lands close on "Perfect"; a typing bubble pulses under it
//   240–262  "Let's animate" pops in where the typing bubble was, like the other messages
//   262–286  everything lifts away upward
// Every element rides a track measured from its counterpart in the reference edit, one row per real source frame
// at its true (24 fps) time, threaded with a monotone cubic (assets/ref-keys.js). Coordinates there are 1280×720.
(function () {
  const FPS = 30, FRAMES = 286, S = 1.5;
  const REF = window.REF;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  const back = (t, s = 1.8) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);

  // monotone cubic (Fritsch–Carlson) through [t, v] pairs
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
  // source frame n → its true time (the reference repeats every fifth frame: 24 fps content in 30)
  const T = (n) => (n - Math.floor((n + 1) / 5)) * 1.25;
  // light 1-2-1 passes take out the 1–2 px reading noise (it showed as shake); endpoints stay put
  const smooth = (c, passes) => {
    for (let k = 0; k < passes; k++) c = c.map((q, i) => (i === 0 || i === c.length - 1 ? q : [q[0], 0.25 * c[i - 1][1] + 0.5 * q[1] + 0.25 * c[i + 1][1]]));
    return c;
  };
  const track = (rows, passes = 2) => {
    const seen = new Set(), clean = rows.filter(([n]) => { const t = T(n); if (seen.has(t)) return false; seen.add(t); return true; });
    const steady = (c) => {
      const heavy = smooth(c, 8);
      return smooth(c, passes).map((p, i) => {
        const a = heavy[Math.max(0, i - 1)], b = heavy[Math.min(heavy.length - 1, i + 1)];
        const v = Math.abs((b[1] - a[1]) / Math.max(0.5, b[0] - a[0]));
        const w = clamp(1 - (v - 2) / 8, 0, 1);
        return [p[0], w * heavy[i][1] + (1 - w) * p[1]];
      });
    };
    const cols = clean[0].slice(1).map((_, j) => (passes ? steady(clean.map((r) => [T(r[0]), r[j + 1]])) : clean.map((r) => [T(r[0]), r[j + 1]])));
    return (F) => cols.map((c) => keys(F, c));
  };
  const TR = { old: track(REF.old), cur: track(REF.cur), arrow: track(REF.arrow), sent: track(REF.sent), card: track(REF.card, 1), perfect: track(REF.perfect, 3), typing: track(REF.typing, 3), final: track(REF.final, 1), tilt: track(REF.finalTilt, 0) };
  // the chat's zoom, read off the sent message's height and fitted as a clean curve (raw heights step 2 px at a time)
  const ZOOM = [[0, 1], [88, 1], [91, 1.07], [93, 1.15], [96, 1.19], [100, 1.215], [106, 1.235], [130, 1.245], [140, 1.255], [146, 1.28], [152, 1.31], [162, 1.34]];
  const zoomAt = (F) => keys(F, ZOOM);
  const range = (rows) => [T(rows[0][0]), T(rows[rows.length - 1][0])];
  const R = Object.fromEntries(["sent", "card", "perfect", "typing", "final"].map((k) => [k, range(REF[k])]));

  // our old chat sits where the reference's sits, relative to its blue bubble (1280 px, zoom 1)
  const OLD = [["hey aizal", -330], ["need a launch video", -224], ["quick", -115]];
  const COL = -740;                 // the old chat's left edge, from the blue bubble's right edge
  const IN = [["i fucking love it!!", 131, 93], ["let's continue", 236, 123]];
  const IN_COL = -780;              // replies' left edge, from the sent message's right edge
  // the old chat swings in from the right: the reference's arrival (from below, overshoot, settle) turned sideways
  const ENTRY = [[0, 0], [1, 0]];
  const TYPED = "storyboard done ", LINK = "https://figma.com/gigiai";
  const BH = 120, CARD = [819, 426];
  const LIFT = (F) => -1600 * ei(ramp(F, 263, 284));

  const TAIL = '<svg class="tail" viewBox="0 0 52 44"><path d="M22 0 C22 20 16 34 0 44 C20 44 38 38 52 24 Z"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24"><path d="M4 12l15-7-4 7 4 7z" fill="#1fa855" stroke="#1fa855" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };

    const bg = el("div", "layer", stage); bg.id = "bg";
    const blobs = [["#e7e7ea", 1100, -200, 620], ["#ffffff", 900, 1150, 160], ["#ececef", 1000, 1500, 900], ["#e3eefc", 900, 300, 1000]].map(([c, s, x, y]) => {
      const b = el("div", "blob", bg); b.style.cssText += `width:${s}px;height:${s}px;background:${c}`; return { b, s, x, y };
    });

    const lift = el("div", "layer", stage);
    el("div", "layer", lift).id = "doodle";
    const world = el("div", "", lift); world.id = "world";
    const TICKS = '<svg viewBox="0 0 18 12"><path d="M1 6.5l3.2 3.2L11 2.5M7.5 9.2l.6.5L15.5 2.5" fill="none" stroke="#53bdeb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const stamps = [];
    const bubble = (text, blue, time = blue ? "12:58" : "12:59") => {
      const b = el("div", "bub" + (blue ? " blue" : ""), world, TAIL);
      const ws = text.split(" ").map((w, i, a) => el("span", "w", b, w + (i < a.length - 1 ? " " : "")));
      const ts = el("span", "ts", b, time + (blue ? TICKS : ""));
      const B = { b, ws, ts }; stamps.push(B);
      return B;
    };
    const old = OLD.map(([t]) => bubble(t, false, "12:41"));
    old[2].b.classList.add("last");
    const onit = bubble("On it", true, "12:42");
    const badge = el("div", "badge", world, '<img src="assets/img/fire.png" alt="">');
    const card = el("div", "", world, `<img src="assets/img/preview.jpg" alt=""><div class="sheen"></div><div class="cap">Gigi Storyboard<small>Created in Figma</small></div><div class="host">figma.com</div>`);
    card.id = "card"; card.style.width = CARD[0] + "px"; card.style.height = CARD[1] + "px";
    const sheen = card.querySelector(".sheen");
    const sent = bubble(TYPED + LINK, true);
    const ins = IN.map(([t]) => bubble(t));
    const perfect = bubble("Perfect", true, "1:00");
    const typing = el("div", "bub blue", world, TAIL + '<div class="dots"><i></i><i></i><i></i></div>');
    typing.style.width = "203px"; typing.style.padding = "0 0 0 52px";
    const dots = [...typing.querySelectorAll(".dots i")];
    const anim = bubble("Let's animate", true, "1:00");
    typing.classList.add("notail"); anim.b.classList.add("notail");   // WhatsApp: only the first bubble of a run has a tail

    const composer = el("div", "", lift); composer.id = "composer";
    composer.innerHTML = `<div class="plus">${PLUS}</div><div class="barc"><div class="tx"></div><div class="send">${SEND}</div></div>`;
    const plus = composer.querySelector(".plus"), bar = composer.querySelector(".barc"), ctx = composer.querySelector(".tx");
    bar.style.width = px(680 * S); bar.style.left = "0"; bar.style.top = "0";

    const cursor = el("div", "", lift); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    let L = null;
    const layout = () => {
      [...world.children].forEach((n) => (n.style.display = "block"));
      const w = (b) => b.b.offsetWidth;
      L = { on: w(onit), sent: w(sent), per: w(perfect), anim: w(anim) };
      // where the pasted link sits inside the text box (text starts 44 px into the bar)
      const cd = composer.style.display; composer.style.display = "block";
      ctx.innerHTML = TYPED.replace(/ /g, "&nbsp;") + `<span class="paste">${LINK}</span>`;
      const ps = ctx.querySelector(".paste");
      L.link = 44 + ps.offsetLeft - ctx.offsetLeft + ps.offsetWidth / 2; L.linkW = ps.offsetWidth;
      composer.style.display = cd;
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    // a bubble whose left edge is x and centre is cy, scaled about the given side
    const put = (n, x, cy, s, origin = "0 50%", r = 0, blur = 0, a = 1) => {
      n.style.transformOrigin = origin;
      n.style.transform = `translate(${px(x)}, ${px(cy - BH / 2)}) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      n.style.filter = blurOf(blur); n.style.opacity = a.toFixed(3);
    };
    const words = (B, F, at, gap = 1.2) => B.ws.forEach((w, i) => {
      const k = ramp(F, at + 1 + i * gap, at + 5 + i * gap);
      w.style.opacity = eo(k).toFixed(3);
      w.style.transform = `translateY(${(0.4 * (1 - eo(k))).toFixed(3)}em)`;
    });

    const LCLICK = 53;
    const cardBox = (F, full = false) => {
      const [, x2, cy, h] = TR.sent(F), z = zoomAt(F);
      const scF = (1054 - 536) * S / CARD[0] * z, p = full ? 1 : ramp(F, 76, 94);
      const sc = scF * (0.55 + 0.45 * eo(p));
      const right = (x2 + 16 * z) * S, bottom = (cy - h / 2 - 32 * z) * S + 30 * (1 - eo(p));
      // scaled about its bottom-right corner (transform-origin 100% 100%), so place the unscaled box there
      return { x1: right - CARD[0], y1: bottom - CARD[1], sc, p, cx: right - (CARD[0] * scF) / 2, cyc: bottom - (CARD[1] * scF) / 2 };
    };

    function render(F) {
      blobs.forEach((o, i) => {
        const t = F / FRAMES;
        o.b.style.transform = `translate(${px(o.x - o.s / 2 + 160 * Math.sin(t * 3.1 + i * 1.7))}, ${px(o.y - o.s / 2 + 110 * Math.cos(t * 2.6 + i))})`;
      });
      lift.style.transform = `translateY(${px(LIFT(F))})`;
      const entry = keys(F, ENTRY);

      // the sent message's track drives the chat's zoom once it exists
      const [, sx2, scy, sh] = TR.sent(F);
      const Z = zoomAt(F);

      // ---- old chat: rides the reference's blue bubble; its arrival is turned sideways
      const [ox2, ocy] = TR.old(F);
      const sideways = F < 20 ? (ocy - 478) * S : 0;
      const X2 = ox2 * S + sideways + entry, CY = (F < 20 ? 478 : ocy) * S;
      const zo = F >= 88 ? Z : 1, showOld = F < 96;
      old.forEach((B, i) => { if (show(B.b, showOld)) put(B.b, X2 + COL * S * zo, CY + OLD[i][1] * S * zo, zo); B.ws.forEach((w) => { w.style.opacity = 1; w.style.transform = "none"; }); });
      if (show(onit.b, showOld)) put(onit.b, X2 - L.on, CY, zo, "100% 50%");
      if (show(badge, showOld, "grid")) badge.style.transform = `translate(${px(X2 - L.on * zo + 6 * S * zo - 31)}, ${px(CY - 40 * S * zo + 11 * S * zo - 31)}) scale(${(1.1 * zo).toFixed(4)})`;

      // ---- composer, placed by the reference's send arrow
      const [ax, ay] = TR.arrow(F), AX = ax * S, AY = ay * S;
      if (show(composer, F < 90)) {
        plus.style.transform = `translate(${px(AX - 712 * S - 52)}, ${px(AY - 52)})`;
        bar.style.transform = `translate(${px(AX - 632 * S)}, ${px(AY - 60)})`;
        const nTyped = clamp(Math.floor((F - 22) / 1.15), 0, TYPED.length);
        // pasted at 45 (soft highlight), then the cursor clicks it at LCLICK: it turns into a link with a quick select flash
        const pasted = F >= 45, hl = pasted ? 1 - ramp(F, 46, 50) : 0, sel = Math.sin(Math.PI * ramp(F, LCLICK - 0.5, LCLICK + 6)), linked = F >= LCLICK;
        const pst = `background:rgba(47,147,251,${(0.22 * Math.max(hl, sel)).toFixed(3)});${linked ? "color:#1d8ce0;text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:2px" : ""}`;
        ctx.innerHTML = F >= 64 ? '<span class="caret"></span>' :
          TYPED.slice(0, nTyped).replace(/ /g, "&nbsp;") + (pasted ? `<span class="paste" style="${pst}">${LINK}</span>` : "") + '<span class="caret"></span>';
      }

      // ---- the sent message grows out of the composer (right edge and height from the reference)
      // as in the reference: the message slides up and right out from behind the input, full size, and settles
      if (show(sent.b, F >= 61.5 && F <= R.sent[1])) {
        if (F < 71) {
          const p = clamp((553 - scy) / (553 - 480), 0, 1);
          const x0 = AX - 632 * S + 44 - 40, y0 = AY, x1 = 1030 * S - L.sent, y1 = 480 * S;
          put(sent.b, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, 0.88 + 0.12 * p, "0 50%");
        } else put(sent.b, sx2 * S - L.sent, scy * S, Z, "100% 50%");
      }

      // ---- link preview: eases in from its corner above the message (slower than the reference's snap),
      // then rides with it
      if (show(card, F >= 76 && F < 160)) {
        const { x1, y1, sc, p } = cardBox(F);
        card.style.transformOrigin = "100% 100%";
        card.style.transform = `translate(${px(x1)}, ${px(y1)}) scale(${sc.toFixed(4)})`;
        card.style.opacity = eo(ramp(F, 76, 85)).toFixed(3);
        card.style.filter = blurOf(6 * (1 - eo(p)));
        sheen.style.transform = `translateX(${px(-CARD[0] + 2 * CARD[0] * ramp(F, 82, 102))})`;
      }

      // ---- replies: ride with the message, pop in word by word
      ins.forEach((B, i) => {
        const [, dy, at] = IN[i];
        if (!show(B.b, F >= at && F < 162)) return;
        const p = ramp(F, at, at + 6);
        const x = (sx2 + IN_COL * Z) * S, cy = (scy + dy * Z) * S;
        put(B.b, x, cy + 20 * (1 - eo(p)), Z * (0.55 + 0.45 * back(p, 1.6)), "0% 100%", 0, 6 * (1 - eo(p)), clamp((F - at + 1) / 2, 0, 1));
        words(B, F, at);
        B.b.classList.toggle("last", i === (F >= IN[1][2] ? 1 : 0));
      });

      // ---- "Perfect" flies in from the lower right and settles big
      if (show(perfect.b, F >= R.perfect[0])) {
        const [, y1, x2, y2] = TR.perfect(Math.min(F, 240));
        put(perfect.b, x2 * S - L.per, (y1 + y2) / 2 * S, (y2 - y1) / 80, "100% 50%", 0, 5 * (1 - ramp(F, 158, 166)));
      }
      // ---- typing bubble grows from its corner and pulses
      if (show(typing, F >= R.typing[0] && F < 243.5)) {
        const [, y1, x2, y2] = TR.typing(F);
        put(typing, x2 * S - 203, (y1 + y2) / 2 * S, (y2 - y1) / 80, "100% 50%");
        dots.forEach((d, i) => { const k = 0.5 + 0.5 * Math.sin(F / 4 - i * 1.1); d.style.opacity = (0.45 + 0.55 * k).toFixed(3); d.style.transform = `translateY(${(-4 * k).toFixed(2)}px)`; });
      }
      // ---- "Let's animate" takes the typing bubble's place and pops in like the other messages
      if (show(anim.b, F >= 242)) {
        const [, py1, px2, py2] = TR.perfect(240), [, , tx2] = TR.typing(242), p = ramp(F, 242, 249), sc = (py2 - py1) / 80;
        const cy = py2 * S + 22 + BH * sc / 2;   // directly under Perfect with a small gap, like a normal next message
        put(anim.b, Math.max(px2, tx2) * S - L.anim, cy + 20 * (1 - eo(p)), sc * (0.6 + 0.4 * back(p, 1.6)), "100% 50%", 0, 5 * (1 - eo(p)), clamp((F - 241) / 2, 0, 1));
        anim.b.style.boxShadow = "";
        words(anim, F, 242);
      }

      stamps.forEach((B) => { B.ts.style.opacity = B.ws[B.ws.length - 1].style.opacity || "1"; });

      // ---- cursor: the reference's path while typing, then a short glide onto the pasted link in the text box,
      // a click, and the reference's slip down out of frame as the message sends
      if (show(cursor, F < 76)) {
        const io = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
        const [ax0, ay0] = TR.arrow(F), [rx, ry] = TR.cur(Math.min(F, 45)).map((v) => v * S);
        const lx = ax0 * S - 632 * S + L.link, ly = ay0 * S + 14;
        const k = io(ramp(F, 45, 52)), drop = 1 - Math.pow(1 - ramp(F, 57, 74), 2);
        const cx = rx + (lx - rx) * k + 40 * drop, cy = ry + (ly - ry) * k + 420 * drop * drop;
        const press = Math.sin(Math.PI * ramp(F, LCLICK - 1, LCLICK + 3));
        cursor.style.transform = `translate(${px(cx)}, ${px(cy)}) scale(${(1 - 0.15 * press).toFixed(3)})`;
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
