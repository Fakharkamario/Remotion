// Gigi delivery — 4.87 s, 30 fps, 146 frames. The messenger chat again, with the same motion as the handoff chat:
//   0–20     the old chat swings in from the right; the composer rises from below
//   20–60    the cursor clicks attach, "gigi video.mp4" lands in the composer, "done" is typed, the cursor clicks send
//   60–92    the message grows out of the composer into the chat, the video pops in above its caption, the composer drops
//   92–122   "You guys cooked!! 🔥" pops in word by word while the view drifts and pushes in
//   122–146  everything drops away downward
// Every element rides a track measured from its counterpart in the reference edit, one row per real source frame
// at its true (24 fps) time, threaded with a monotone cubic (assets/ref-keys.js). Coordinates there are 1280×720.
(function () {
  const FPS = 30, FRAMES = 146, S = 1.5;
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
  const TR = { old: track(REF.old), cur: track(REF.cur), arrow: track(REF.arrow), sent: track(REF.sent), card: track(REF.card, 1) };
  // the chat's zoom, read off the sent message's height and fitted as a clean curve (raw heights step 2 px at a time)
  const ZOOM = [[0, 1], [88, 1], [91, 1.07], [93, 1.15], [96, 1.19], [100, 1.215], [106, 1.235], [130, 1.245], [140, 1.255], [146, 1.28], [152, 1.31], [162, 1.34]];
  const zoomAt = (F) => keys(F, ZOOM);
  const range = (rows) => [T(rows[0][0]), T(rows[rows.length - 1][0])];
  const R = Object.fromEntries(["sent", "card"].map((k) => [k, range(REF[k])]));
  // the chat settles here: after it the reference whips on to its next beat, we hold and drop away instead
  const HOLD = 116;

  // our old chat sits where the reference's sits, relative to its blue bubble (1280 px, zoom 1)
  // the last chat: their two replies, then our "Perfect" / "Let's animate" on the right
  const OLD = [["i fucking love it!!", -330], ["let's continue", -224]];
  const OURS = [["Perfect", -115], ["Let's animate", 0]];
  const COL = -740;                 // the old chat's left edge, from the blue bubble's right edge
  const IN = [["You guys cooked!! 🔥", 131, 93]];
  const IN_COL = -780;              // replies' left edge, from the sent message's right edge
  // the old chat swings in from the right: the reference's arrival (from below, overshoot, settle) turned sideways
  const ENTRY = [[0, 0], [1, 0]];
  const TYPED = "done", FILE = "gigi video.mp4";
  const BH = 120, CARD = [819, 460];
  const DROP = (F) => 1500 * ei(ramp(F, 124, 145));
  const ATTACH = 24, LCLICK = 59;

  const TAIL = '<svg class="tail" viewBox="0 0 52 44"><path d="M22 0 C22 20 16 34 0 44 C20 44 38 38 52 24 Z"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24"><path d="M4 12l15-7-4 7 4 7z" fill="#1fa855" stroke="#1fa855" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const CLIP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5l-8.2 8.2a5 5 0 01-7.1-7.1l8.5-8.5a3.3 3.3 0 014.7 4.7l-8.5 8.5a1.7 1.7 0 01-2.4-2.4l7.8-7.8"/></svg>';
  const VID = '<svg viewBox="0 0 24 24" fill="#fff"><rect x="2" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l6-3.5v11L16 14z"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const FIRE = '<img class="emo" src="assets/img/fire.png" alt="">';

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
      const ws = text.split(" ").map((w, i, a) => el("span", "w", b, (w === "🔥" ? FIRE : w) + (i < a.length - 1 ? " " : "")));
      const ts = el("span", "ts", b, time + (blue ? TICKS : ""));
      const B = { b, ws, ts }; stamps.push(B);
      return B;
    };
    const old = OLD.map(([t]) => bubble(t, false, "12:59"));
    old[1].b.classList.add("last");
    const ours = OURS.map(([t]) => bubble(t, true, "1:00"));
    ours[1].b.classList.add("notail");     // WhatsApp: only the first bubble of a run has a tail
    // the video message: the thumbnail in a pale-green frame, a play button, its length; the caption bubble below
    const card = el("div", "", world, `<div class="th"><img src="assets/img/thumb.jpg" alt=""><div class="shade"></div><div class="pl">${PLAY}</div><div class="len">${VID}0:45</div></div>`);
    card.id = "card"; card.style.width = CARD[0] + "px"; card.style.height = CARD[1] + "px";
    const sent = bubble(TYPED, true, "1:01");
    sent.b.classList.add("cap");
    const sendIco = () => composer.querySelector(".send");
    const ins = IN.map(([t]) => bubble(t, false, "1:01"));

    const composer = el("div", "", lift); composer.id = "composer";
    composer.innerHTML = `<div class="plus">${CLIP}</div><div class="barc"><div class="att"><img src="assets/img/thumb.jpg" alt=""><span><b>${FILE.replace(".mp4", "")}</b><small>MP4 · 0:45 · 12.4 MB</small></span></div><div class="tx"></div><div class="send">${SEND}</div></div>`;
    const plus = composer.querySelector(".plus"), bar = composer.querySelector(".barc"), ctx = composer.querySelector(".tx"), att = composer.querySelector(".att");
    bar.style.width = px(680 * S); bar.style.left = "0"; bar.style.top = "0";

    const cursor = el("div", "", lift); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    let L = null;
    const layout = () => {
      [...world.children].forEach((n) => (n.style.display = "block"));
      const w = (b) => b.b.offsetWidth;
      // the caption bubble is as wide as the video above it once the chat has pushed in
      sent.b.style.width = px((1054 - 536) * S);
      L = { ours: ours.map(w), sent: w(sent) };
      const cd = composer.style.display; composer.style.display = "block";
      const sd = bar.querySelector(".send"); L.sendX = sd.offsetLeft + sd.offsetWidth / 2; L.sendY = sd.offsetTop + sd.offsetHeight / 2;
      // each reply's word right edges, so the bubble can widen word by word like the reference's
      ins.forEach((B) => { B.b.style.width = ""; B.edges = B.ws.map((w) => w.offsetLeft + w.offsetWidth); B.pad = B.b.offsetWidth - B.edges[B.edges.length - 1]; });
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
    // the reference's reply: the bubble widens as each word hops in from below (slight overshoot, no fade-blur)
    const grow = (B, F, at, gap = 2.5) => {
      let right = 0;
      B.ws.forEach((w, i) => {
        const k = ramp(F, at + i * gap, at + 5 + i * gap), prev = i ? B.edges[i - 1] : 0;
        if (k > 0) right = prev + (B.edges[i] - prev) * eo(k / 0.7);
        w.style.opacity = clamp(k * 3, 0, 1).toFixed(3);
        w.style.transform = `translateY(${(0.55 * (1 - back(k, 2.2))).toFixed(3)}em)`;
      });
      B.b.style.width = px(B.pad + Math.max(right, 30));
      B.b.style.overflow = "hidden";
      B.ts.style.opacity = ramp(F, at + (B.ws.length - 1) * gap + 2, at + (B.ws.length - 1) * gap + 6).toFixed(3);
    };
    const cardBox = (F, full = false) => {
      const [, x2, cy, h] = TR.sent(F), z = zoomAt(F);
      const scF = (1054 - 536) * S / CARD[0] * z, p = full ? 1 : ramp(F, R.card[0], R.card[1]);
      const [c1, , c2] = TR.card(F), sc = scF * (full || F >= R.card[1] ? 1 : (c2 - c1) / 518);
      const right = x2 * S, bottom = (cy - h / 2 - 8 * z) * S;
      // scaled about its bottom-right corner (transform-origin 100% 100%), so place the unscaled box there
      return { x1: right - CARD[0], y1: bottom - CARD[1], sc, p, cx: right - (CARD[0] * scF) / 2, cyc: bottom - (CARD[1] * scF) / 2 };
    };

    function render(F) {
      blobs.forEach((o, i) => {
        const t = F / FRAMES;
        o.b.style.transform = `translate(${px(o.x - o.s / 2 + 160 * Math.sin(t * 3.1 + i * 1.7))}, ${px(o.y - o.s / 2 + 110 * Math.cos(t * 2.6 + i))})`;
      });
      lift.style.transform = `translateY(${px(DROP(F))})`;
      const entry = keys(F, ENTRY);
      const Fh = Math.min(F, HOLD);            // the chat's tracks hold here; a slow push carries on

      // the sent message's track drives the chat's zoom once it exists
      const [, sx2, scy] = TR.sent(Fh);
      const Z = zoomAt(Fh) * (1 + 0.0016 * Math.max(0, F - HOLD));

      // ---- old chat: rides the reference's blue bubble; its arrival is turned sideways
      const [ox2, ocy] = TR.old(F);
      const sideways = F < 20 ? (ocy - 478) * S : 0;
      const X2 = ox2 * S + sideways + entry, CY = (F < 20 ? 478 : ocy) * S;
      const zo = F >= 88 ? Z : 1, showOld = F < 96;
      old.forEach((B, i) => { if (show(B.b, showOld)) put(B.b, X2 + COL * S * zo, CY + OLD[i][1] * S * zo, zo); B.ws.forEach((w) => { w.style.opacity = 1; w.style.transform = "none"; }); });
      ours.forEach((B, i) => { if (show(B.b, showOld)) put(B.b, X2 - L.ours[i], CY + OURS[i][1] * S * zo, zo, "100% 50%"); B.ws.forEach((w) => { w.style.opacity = 1; w.style.transform = "none"; }); });

      // ---- composer, placed by the reference's send arrow
      const [ax, ay] = TR.arrow(F), AX = ax * S, AY = ay * S;
      if (show(composer, F < 90)) {
        plus.style.transform = `translate(${px(AX - 712 * S - 52)}, ${px(AY - 52)})`;
        bar.style.transform = `translate(${px(AX - 632 * S)}, ${px(AY - 60)})`;
        // the clip dips as it's clicked; the file chip lands in the box, then "done" is typed after it
        plus.style.transform += ` scale(${(1 - 0.12 * Math.sin(Math.PI * ramp(F, ATTACH - 1, ATTACH + 3))).toFixed(3)})`;
        plus.style.color = F >= ATTACH && F < ATTACH + 8 ? "#1fa855" : "";
        const a = ramp(F, ATTACH + 1, ATTACH + 7);
        show(att, F >= ATTACH + 1 && F < 64, "flex");
        att.style.transform = `translateY(${px(26 * (1 - eo(a)))}) scale(${(0.6 + 0.4 * back(a, 1.6)).toFixed(4)})`;
        att.style.opacity = eo(a * 2).toFixed(3);
        const nTyped = clamp(Math.floor((F - 36) / 2), 0, TYPED.length);
        sendIco().style.transform = `scale(${(1 - 0.22 * Math.sin(Math.PI * ramp(F, LCLICK - 1, LCLICK + 3))).toFixed(3)})`;
        ctx.innerHTML = (F >= 64 ? "" : TYPED.slice(0, nTyped)) + '<span class="caret"></span>';
      }

      // ---- the sent message grows out of the composer (right edge and height from the reference)
      // as in the reference: the message slides up and right out from behind the input, full size, and settles
      if (show(sent.b, F >= 61.5)) {
        if (F < 71) {
          const p = clamp((553 - scy) / (553 - 480), 0, 1);
          const x0 = AX - 632 * S + 44 - 40, y0 = AY, x1 = 1030 * S - L.sent, y1 = 480 * S;
          put(sent.b, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, 0.88 + 0.12 * p, "0 50%");
        } else put(sent.b, sx2 * S - L.sent, scy * S, Z, "100% 50%");
      }

      // ---- the video pops in from its corner just above the caption (the reference's preview pop), then rides with it
      if (show(card, F >= R.card[0])) {
        const { x1, y1, sc } = cardBox(Fh);
        card.style.transformOrigin = "100% 100%";
        card.style.transform = `translate(${px(x1)}, ${px(y1)}) scale(${(sc * Z / zoomAt(Fh)).toFixed(4)})`;
      }

      // ---- replies: ride with the message, pop in word by word
      ins.forEach((B, i) => {
        const [, dy, at] = IN[i];
        if (!show(B.b, F >= at)) return;
        const p = ramp(F, at, at + 5);
        const x = (sx2 + IN_COL * Z) * S, cy = (scy + dy * Z) * S;
        put(B.b, x, cy, Z * (0.35 + 0.65 * back(p, 1.4)), "0% 100%", 0, 0, clamp((F - at + 1) / 1.5, 0, 1));
        grow(B, F, at);
        B.b.classList.add("last");
      });

      stamps.forEach((B) => { if (!ins.includes(B)) B.ts.style.opacity = B.ws[B.ws.length - 1].style.opacity || "1"; });

      // ---- cursor: the reference's path, a detour to the paperclip and a click, back while "done" is typed,
      // then a calm glide onto the send icon, a click, and the reference's slip down out of frame
      if (show(cursor, F < 78)) {
        const io = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
        const [ax0, ay0] = TR.arrow(F), [rx, ry] = TR.cur(Math.min(F, 46)).map((v) => v * S);
        const lx = ax0 * S - 632 * S + L.sendX + 4, ly = ay0 * S - 60 + L.sendY + 6;
        const k = io(ramp(F, 46, LCLICK - 1)), drop = Math.pow(ramp(F, LCLICK + 4, 77), 2);
        // the paperclip: there by ATTACH-2, back on the reference's path by 40
        const px0 = ax0 * S - 712 * S + 4, py0 = ay0 * S + 8, d = io(ramp(F, 10, ATTACH - 2)) * (1 - io(ramp(F, ATTACH + 4, 40)));
        const cx = rx + (px0 - rx) * d + (lx - rx) * k + 30 * drop, cy = ry + (py0 - ry) * d + (ly - ry) * k + 520 * drop;
        const press = Math.max(Math.sin(Math.PI * ramp(F, ATTACH - 1, ATTACH + 3)), Math.sin(Math.PI * ramp(F, LCLICK - 1, LCLICK + 3)));
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
