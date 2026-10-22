// Gigi handoff — 9.53 s, 30 fps, 286 frames. Continues the storyboard cut (which leaves to the left) in the launch
// video's look: frosted white incoming bubbles, brand-blue outgoing ones, Inter, near-white background.
//   0–20     the old chat swings in from the right; the composer rises from below
//   20–60    "storyboard done " is typed, the Figma link is pasted, sent
//   60–92    the message grows out of the composer into the chat, the link preview pops above it, the composer drops
//   92–145   "i fucking love it!!" and "let's continue" pop in word by word while the view drifts and pushes in
//   145–240  a whip up-left lands close on "Perfect"; a typing bubble pulses under it
//   240–262  it opens into "Let's animate" with a tilt that settles
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
    const cols = clean[0].slice(1).map((_, j) => smooth(clean.map((r) => [T(r[0]), r[j + 1]]), passes));
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
  const SEND = '<svg viewBox="0 0 24 24"><path d="M4 12l15-7-4 7 4 7z" fill="#2f93fb" stroke="#2f93fb" stroke-width="1.6" stroke-linejoin="round"/></svg>';
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
    const world = el("div", "", lift); world.id = "world";
    const bubble = (text, blue) => {
      const b = el("div", "bub" + (blue ? " blue" : ""), world, TAIL);
      const ws = text.split(" ").map((w, i, a) => el("span", "w", b, w + (i < a.length - 1 ? " " : "")));
      return { b, ws };
    };
    const old = OLD.map(([t]) => bubble(t));
    old[2].b.classList.add("last");
    const onit = bubble("On it", true);
    const badge = el("div", "badge", world, '<img src="assets/img/fire.png" alt="">');
    const card = el("div", "", world, `<img src="assets/img/preview.jpg" alt=""><div class="sheen"></div><div class="cap">Gigi Storyboard<small>Created in Figma</small></div><div class="host">figma.com</div>`);
    card.id = "card"; card.style.width = CARD[0] + "px"; card.style.height = CARD[1] + "px";
    const sheen = card.querySelector(".sheen");
    const sent = bubble(TYPED + LINK, true);
    const ins = IN.map(([t]) => bubble(t));
    const perfect = bubble("Perfect", true);
    const typing = el("div", "bub blue", world, TAIL + '<div class="dots"><i></i><i></i><i></i></div>');
    typing.style.width = "203px"; typing.style.padding = "0 0 0 52px";
    const dots = [...typing.querySelectorAll(".dots i")];
    const anim = bubble("Let's animate", true);

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
        const pasted = F >= 45, hl = pasted ? 1 - ramp(F, 47, 52) : 0;
        ctx.innerHTML = F >= 64 ? '<span class="caret"></span>' :
          TYPED.slice(0, nTyped).replace(/ /g, "&nbsp;") + (pasted ? `<span class="paste" style="background:rgba(47,147,251,${(0.22 * hl).toFixed(3)})">${LINK}</span>` : "") + '<span class="caret"></span>';
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

      // ---- link preview: pops from its corner, then rides with the message
      if (show(card, F >= R.card[0] && F < 160)) {
        let x1, y1, sc;
        if (F <= R.card[1]) {
          const [cx1, cy1, cx2] = TR.card(F);
          x1 = cx1 * S; y1 = cy1 * S; sc = (cx2 - cx1) * S / CARD[0];
        } else {
          sc = (1054 - 536) * S / CARD[0] * Z;
          const right = (sx2 + 16 * Z) * S, bottom = (scy - sh / 2 - 32 * Z) * S;
          x1 = right - CARD[0] * sc; y1 = bottom - CARD[1] * sc;
        }
        card.style.transform = `translate(${px(x1)}, ${px(y1)}) scale(${sc.toFixed(4)})`;
        card.style.filter = blurOf(6 * (1 - ramp(F, 77, 81)));
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
        const [, y1, x2, y2] = TR.perfect(F);
        put(perfect.b, x2 * S - L.per, (y1 + y2) / 2 * S, (y2 - y1) / 80, "100% 50%", 0, 5 * (1 - ramp(F, 158, 166)));
      }
      // ---- typing bubble grows from its corner and pulses
      if (show(typing, F >= R.typing[0] && F < 243.5)) {
        const [, y1, x2, y2] = TR.typing(F);
        put(typing, x2 * S - 203, (y1 + y2) / 2 * S, (y2 - y1) / 80, "100% 50%");
        dots.forEach((d, i) => { const k = 0.5 + 0.5 * Math.sin(F / 4 - i * 1.1); d.style.opacity = (0.45 + 0.55 * k).toFixed(3); d.style.transform = `translateY(${(-4 * k).toFixed(2)}px)`; });
      }
      // ---- it opens into "Let's animate", tilted, then settles
      if (show(anim.b, F >= 242.5)) {
        const [x1, y1, x2, y2] = TR.final(F), [tilt] = TR.tilt(F);
        put(anim.b, (x1 + x2) / 2 * S - L.anim / 2, (y1 + y2) / 2 * S, (y2 - y1) / 80, "50% 50%", tilt, 3 * (1 - ramp(F, 243, 248)), eo(ramp(F, 242.5, 244)));
        anim.b.style.boxShadow = `0 16px 40px rgba(30,130,250,.22), 0 0 ${px(50 * (1 - ramp(F, 246, 262)) + 18)} rgba(47,147,251,${(0.4 * (1 - ramp(F, 246, 262)) + 0.12).toFixed(3)})`;
        words(anim, F, 242, 1.5);
      }

      // ---- cursor: the reference's own path (it types, then slips down out of frame as the message sends)
      if (show(cursor, F < 64)) {
        const [cx, cy] = TR.cur(F);
        cursor.style.transform = `translate(${px(cx * S + entry)}, ${px(cy * S)})`;
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
