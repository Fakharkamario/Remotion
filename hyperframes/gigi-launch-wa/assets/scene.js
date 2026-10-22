// Gigi AI launch — 9.77 s, 30 fps, 293 frames. New content and a white UI on the motion of a reference chat edit:
//   0–100    "hey aizal" lands huge, the view pulls back as a typing bubble turns into "need a launch video", then "quick"
//   100–150  whip up-left; a blue typing bubble flies in from the right and becomes "On it", the 🔥 badge pops on
//   150–186  pull back to the whole chat; the cursor flies in and grabs "need a launch video"
//   186–238  the chat whips off left, the board whips in under the held message, which drops into To do as a card
//   238–293  the board pans off right; "Working" slides in, fills black left to right and lifts away
// No hand-made easing for the big moves: every bubble, the cursor, the badge, the board and the end line follow
// tracks measured from the reference frame by frame (assets/ref-keys.js, one row per real 24 fps frame, timed in
// 30 fps frames), threaded with a monotone cubic so the motion keeps the reference's exact speed curves.
(function () {
  const FPS = 30, FRAMES = 293;
  const REF = window.REF;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

  // monotone cubic (Fritsch–Carlson) through [t, v] pairs: passes every point, never overshoots
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
  // a measured track: rows [t, a, b, ...] split into runs wherever the element was out of view (gap > 4 frames)
  const track = (rows) => {
    const runs = [];
    rows.forEach((r) => { const last = runs[runs.length - 1]; if (!last || r[0] - last[last.length - 1][0] > 4) runs.push([r]); else last.push(r); });
    const cols = runs.map((run) => run[0].slice(1).map((_, j) => run.map((r) => [r[0], r[j + 1]])));
    // values at t, or null outside every run (pad lets a run hold its ends a little). ext carries a run past its
    // last row with its measured speed and acceleration, so an element leaving frame keeps going instead of vanishing
    return (t, pad = 0, ext = 0) => {
      const i = runs.findIndex((run) => t >= run[0][0] - pad && t <= run[run.length - 1][0] + Math.max(pad, ext));
      if (i < 0) return null;
      const run = runs[i], n = run.length, last = run[n - 1];
      if (t <= last[0] || n < 3) return cols[i].map((c) => keys(t, c));
      const [a, b, c] = run.slice(-3), dt = t - c[0];
      return c.slice(1).map((v, j) => {
        const v1 = (c[j + 1] - b[j + 1]) / (c[0] - b[0]), v0 = (b[j + 1] - a[j + 1]) / (b[0] - a[0]);
        const acc = (v1 - v0) / ((c[0] - a[0]) / 2);
        return v + v1 * dt + 0.5 * Math.max(0, acc * Math.sign(v1 || 1)) * Math.sign(v1 || 1) * dt * dt;
      });
    };
  };
  const T = { b1: track(REF.b1), b2: track(REF.b2), b3: track(REF.b3), blue: track(REF.blue), badge: track(REF.badge), cur: track(REF.cur) };
  const at = (rows, lo, hi, fn) => { const v = rows.filter((r) => r[0] >= lo && r[0] <= hi).map(fn); return v.reduce((a, b) => a + b, 0) / v.length; };

  // world sizes (the reference bubble is 192 px tall with its soft edge at scale 1)
  const BH = 176, PAD = 54, EDGE = 10, TYPING_W = 236, BLUE_TYP = 214, TS_IN = 150, TS_OUT = 215;
  const TAIL = '<svg class="tail" viewBox="0 0 52 44"><path d="M22 0 C22 20 16 34 0 44 C20 44 38 38 52 24 Z"/></svg>';
  const ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  };

  // reference normalisers: how wide each bubble reads at scale 1 while typing and when full
  const s2of = (h) => h / 186, s3of = (h) => h / 180, sbof = (t, h) => Math.max(h, t < 107 ? 258 : 0) / 184;
  const B2_TYP = at(REF.b2, 38, 43, (r) => (r[2] - r[1]) / s2of(r[4])), B2_FIN = at(REF.b2, 80, 94, (r) => (r[2] - r[1]) / s2of(r[4]));
  const BL_TYP = at(REF.blue, 108, 124, (r) => (r[2] - r[1]) / sbof(r[0], r[4])), BL_FIN = at(REF.blue, 165, 180, (r) => (r[2] - r[1]) / sbof(r[0], r[4]));

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };

    // ---------- background ----------
    const bg = el("div", "layer", stage); bg.id = "bg";
    const blobs = [];
    const doodle = el("div", "layer", stage); doodle.id = "doodle";

    // ---------- chat (screen space; each bubble rides its own measured track) ----------
    const chat = el("div", "layer", stage);
    // messenger bubbles: white incoming, green outgoing, a time stamp (and read ticks on ours) in the corner
    const TICKS = '<svg viewBox="0 0 18 12"><path d="M1 6.5l3.2 3.2L11 2.5M7.5 9.2l.6.5L15.5 2.5" fill="none" stroke="#53bdeb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    function bubble(words, cls, time) {
      const b = el("div", "bub" + (cls ? " " + cls : ""), chat, TAIL);
      const txt = el("div", "txt", b);
      const ws = words.map((w, i) => el("span", "w", txt, w + (i < words.length - 1 ? " " : "")));
      const dots = el("div", "dots", b, "<i></i><i></i><i></i>");
      const ts = el("span", "ts", b, time + (cls === "blue" ? TICKS : ""));
      return { b, txt, ws, ts, dots: [...dots.children], dotsBox: dots };
    }
    const b1 = bubble(["hey", "aizal"], "", "12:41");
    const b2 = bubble(["need", "a", "launch", "video"], "", "12:41");
    const b3 = bubble(["quick"], "", "12:41");
    const bb = bubble(["On", "it"], "blue", "12:42");
    b1.dotsBox.style.display = b3.dotsBox.style.display = "none";
    const badge = el("div", "", chat, '<img src="assets/img/fire.png" alt="">'); badge.id = "badge";

    // ---------- board ----------
    const boardWrap = el("div", "layer", stage);
    const board = el("div", "", boardWrap); board.id = "board";
    const column = (x, name) => { const c = el("div", "col", board); c.style.left = x + "px"; el("div", "hd", c, name); return c; };
    const todo = column(0, "TO-DO");
    column(828, "IN PROGRESS");
    const card = el("div", "", todo, `<div class="ttl">Launch video for gigi ai</div><div class="bar"></div><div class="ft">${ICON.clock}<span>Today</span></div>`);
    card.id = "card";

    // ---------- held message (above the board) ----------
    const heldWrap = el("div", "layer", stage);

    // ---------- cursor ----------
    const cursor = el("div", "", stage); cursor.id = "cursor";
    const ARROW = "M12 9 L86 41 L54 55 L41 90 Z";
    cursor.innerHTML = `<svg viewBox="0 0 100 100"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="24" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="11" stroke-linejoin="round"/></svg>`;

    // ---------- end line ----------
    const endWrap = el("div", "layer", stage);
    const endline = el("div", "", endWrap); endline.id = "endline";
    const wm = el("div", "wm", endline, '<span class="gh">Working</span><span class="fill">Working</span>');
    const wmFill = wm.querySelector(".fill");

    // ---------- layout from measured text (an always-visible probe; real nodes may be hidden) ----------
    const probe = el("div", "", stage);
    probe.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;pointer-events:none";
    const textW = (cls, text) => { probe.className = cls; probe.textContent = text; return probe.getBoundingClientRect().width; };
    let L = null;
    const layout = () => {
      // text plus room for the time stamp (and the ticks on ours)
      const w = (t, out) => Math.ceil(textW("bub-probe", t)) + 2 * PAD + (out ? TS_OUT : TS_IN);
      // the end word is sized to the reference word's width (1004 px)
      const fs = 236 * 1004 / textW("wm", "Working");
      wm.style.fontSize = fs.toFixed(2) + "px";
      L = { wHey: w("hey"), w1: w("hey aizal"), w2: w("need a launch video"), w3: w("quick"), wb: w("On it", true), wmW: 1004 };
      probe.className = ""; probe.textContent = "";
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    // words rise into place from below, soft and faint
    const wordIn = (span, f, at) => {
      const a = f - at;
      if (a < 0) { span.style.opacity = 0; return; }
      const p = eo(a / 5);
      span.style.opacity = clamp(a / 2.5, 0, 1).toFixed(3);
      span.style.transform = `translateY(${(0.42 * (1 - p)).toFixed(3)}em)`;
      span.style.filter = blurOf(5 * (1 - p));
    };
    const dotsAt = (b, f, fade, cx) => {
      b.dotsBox.style.display = fade >= 1 ? "none" : "flex";
      b.dotsBox.style.left = px(cx);
      b.dots.forEach((d, i) => {
        const s = 0.5 + 0.5 * Math.sin((f / 16) * Math.PI * 2 - i * 1.05);
        d.style.opacity = ((0.3 + 0.7 * s) * (1 - fade)).toFixed(3);
        d.style.transform = `translateY(${(-5 * s).toFixed(2)}px)`;
      });
    };
    // a bubble of world width w whose left edge is at x, centred on y, at scale s
    const put = (node, x, y, w, s, rot = 0, blur = 0, a = 1) => {
      node.style.width = px(w);
      node.style.transform = `translate(${px(x + (w * s) / 2 - w / 2)}, ${px(y - BH / 2)}) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      node.style.filter = blurOf(blur);
      node.style.opacity = a.toFixed(3);
    };
    const show = (node, on, mode = "block") => { node.style.display = on ? mode : "none"; return on; };

    // the blue bubble's box on screen at t (shared by the badge and the read receipt)
    const blueBox = (t) => {
      const r = T.blue(t, 0.6, 8);
      if (!r) return null;
      const [x1, x2, cy, h] = r, s = sbof(t, h);
      const p = t < 124 ? 0 : clamp(((x2 - x1) / s - BL_TYP) / (BL_FIN - BL_TYP), 0, 1);
      const w = lerp(BLUE_TYP, L.wb, eo(p));
      // centred while it is the hero; the reference's left-then-right growth, scaled to this narrower message
      let cx = (x1 + x2) / 2;
      if (t > 125 && t < 136) {
        const k = (L.wb - BLUE_TYP) / (BL_FIN - BL_TYP);
        const c0 = keys(125, REF.blue.map((q) => [q[0], (q[1] + q[2]) / 2])), c1 = keys(136, REF.blue.map((q) => [q[0], (q[1] + q[2]) / 2]));
        const base = lerp(c0, c1, (t - 125) / 11);
        cx = base + (cx - base) * k;
      }
      // once it sits in the chat, it hugs the reference bubble's right edge (its tail side)
      const cr = x2 - EDGE * s - (w * s) / 2;
      cx = lerp(cx, cr, eio(ramp(t, 149, 159)));
      return { left: cx - (w * s) / 2, cy, w, s, rx1: x1, ry1: cy - h / 2 };
    };

    function render(f) {
      // the wallpaper slides off left just ahead of the incoming board, uncovering the plain background
      const dx = f > 214 ? -1e4 : Math.min(0, (keys(f, REF.board) - keys(184, REF.board)) * 1.18);
      doodle.style.display = dx > -1930 ? "block" : "none";
      doodle.style.transform = `translateX(${px(dx)})`;
      blobs.forEach((o, i) => {
        const t = f / FRAMES;
        o.b.style.transform = `translate(${px(o.x - o.s / 2 + 160 * Math.sin(t * 3.1 + i * 1.7))}, ${px(o.y - o.s / 2 + 110 * Math.cos(t * 2.6 + i))})`;
      });

      // ---------- hey aizal ----------
      b1.b.classList.toggle("last", f < 32); b2.b.classList.toggle("last", f >= 32 && f < 78); b3.b.classList.toggle("last", f >= 78);
      const r1 = f < 120 || f > 150 ? T.b1(f, 0.6, 8) : null;
      if (show(b1.b, !!r1)) {
        const [x1, x2, cy, h] = r1, s = h / 192;
        const w = lerp(L.wHey, L.w1, eo(ramp(f, 1, 8)));
        // centred while it is alone on screen, then left-aligned with the column it heads
        const left = lerp((x1 + x2) / 2 - (w * s) / 2, x1 + EDGE * s, f > 150 ? 1 : eio(ramp(f, 26, 40)));
        const e = eo(ramp(f, 0, 6));
        put(b1.b, left, cy, w, s, -8 * (1 - e), 5 * (1 - eo(ramp(f, 0, 5))), 1);
        wordIn(b1.ws[0], f, -2); wordIn(b1.ws[1], f, 3);
      }

      // ---------- typing → need a launch video (held and carried from 178) ----------
      const holding = f >= 176;
      let r2 = T.b2(f, 0.6);
      if (holding) {
        // after the reference loses it under the board (195) the message rides the cursor
        const tEnd = 195, rr = T.b2(Math.min(f, tEnd)), c0 = T.cur(tEnd), c1 = T.cur(clamp(f, 161.25, 235));
        r2 = f <= tEnd ? rr : [rr[0] + c1[0] - c0[0], rr[1] + c1[0] - c0[0], rr[2] + c1[1] - c0[1], rr[3]];
      }
      if (r2 && f < 217 && (b2.b.parentNode === heldWrap) !== holding) (holding ? heldWrap : chat).appendChild(b2.b);
      if (show(b2.b, !!r2 && f < 217)) {
        const [x1, x2, cy, h] = r2;
        let s = s2of(h), rot = 0, a = 1, blur = 0;
        if (holding) {
          // lift: scale from the reference's width (its height grows with the tilt), then a small tilt
          const r0 = T.b2(176), rn = T.b2(Math.min(f, 195));
          s = s2of(r0[3]) * (rn[1] - rn[0]) / (r0[1] - r0[0]);
          rot = keys(f, [[178, 0], [183, 0], [187, -0.9], [190, -1.7], [192, -1.9], [195, -1.5], [205, -1.5], [212, -1]]);
          const d = eo(ramp(f, 212, 216));
          s *= 1 - 0.15 * d; a = 1 - d;
        } else {
          blur = 8 * (1 - eo(ramp(f, 31, 35)));
          a = clamp((f - 30.5) / 1.5, 0, 1);
        }
        const p = holding || f > 100 ? 1 : f < 43 ? 0 : clamp(((x2 - x1) / s2of(h) - B2_TYP) / (B2_FIN - B2_TYP), 0, 1);
        const w = lerp(TYPING_W, L.w2, p);
        let bx = x1 + EDGE * s, by = cy;
        if (holding) {
          // on release it settles into the card's slot as it fades
          const d = eio(ramp(f, 211, 216)), cx = keys(f, REF.board) + 56 + 339, ccy = 121 + 158 + 110;
          bx = lerp(bx, cx - (w * s) / 2, d); by = lerp(by, ccy, d);
        }
        put(b2.b, bx, by, w, s, rot, blur, a);
        dotsAt(b2, f, ramp(f, 44, 48), TYPING_W / 2);
        if (holding) b2.ws.forEach((sp) => wordIn(sp, f, 0));
        else [50, 52, 54, 57].forEach((at, i) => wordIn(b2.ws[i], f, at));
        b2.b.style.boxShadow = holding ? `0 ${px(30)} ${px(70)} rgba(10,10,14,.14), 0 2px 6px rgba(10,10,14,.05), inset 0 0 0 1.5px rgba(10,10,14,.045)` : "";
      }

      // ---------- quick ----------
      const r3 = T.b3(f, 0.6, 8);
      if (show(b3.b, !!r3 && !(f > 116 && f < 150))) {
        const [x1, , cy, h] = r3, s = s3of(h);
        put(b3.b, x1 + EDGE * s, cy, L.w3, s, 0, 8 * (1 - eo(ramp(f, 77, 81))), clamp((f - 77) / 1.5, 0, 1));
        wordIn(b3.ws[0], f, 78);
      }

      // ---------- On it ----------
      const B = f >= 103 && f < 206 ? blueBox(f) : null;
      show(bb.b, !!B);
      if (B) {
        put(bb.b, B.left, B.cy, B.w, B.s, 0, 0, 1);
        bb.txt.style.left = px((B.w - (L.wb - 2 * PAD)) / 2);
        dotsAt(bb, f, ramp(f, 124, 128), B.w / 2);
        wordIn(bb.ws[0], f, 128); wordIn(bb.ws[1], f, 131);
      }
      // badge: placed on the blue bubble's top-left corner as in the reference, popping with its measured size
      // past the badge's last measured row it keeps its place on the bubble
      const tb = clamp(f, 136.25, 195), rb = B && f >= 135 ? T.badge(tb, 0.6) : null, Bt = rb ? blueBox(tb) : null;
      if (show(badge, !!rb, "grid")) {
        const [, , w] = rb, s = B.s;
        const dx = (rb[0] - Bt.rx1) / Bt.s, dy = (rb[1] - Bt.ry1) / Bt.s;
        let k = (w / s) / 88;
        if (f < 136.25) k = (48 / 88) * ramp(f, 135, 136.25);
        badge.style.transform = `translate(${px(B.left + dx * s)}, ${px(B.cy - (BH / 2) * s + dy * s)}) scale(${(k * s).toFixed(4)})`;
      }

      // ---------- board ----------
      if (show(boardWrap, f >= 184 && f < 256)) {
        board.style.transform = `translateX(${px(keys(f, REF.board))})`;
        const cp = ramp(f, 212.5, 215.5);
        card.style.opacity = cp.toFixed(3);
        card.style.transform = `scale(${(0.94 + 0.06 * eo(cp)).toFixed(4)})`;
      }

      // ---------- cursor (tip follows the reference arrow's tip) ----------
      // time stamps arrive with the last word
      [b1, b2, b3, bb].forEach((B) => { B.ts.style.opacity = B.ws[B.ws.length - 1].style.opacity || "1"; });

      if (show(cursor, f >= 159.5 && f < 238)) {
        const c = T.cur(clamp(f, 161.25, 235));
        let [x, y, w] = c;
        if (f < 161.25) x += (161.25 - f) * 125;
        if (f > 235) { x += (f - 235) * 125; y -= (f - 235) * 130; }
        const s = f < 211 ? 1 : clamp(w / 112, 0.68, 1);
        cursor.style.transform = `translate(${px(x)}, ${px(y)}) scale(${s.toFixed(3)})`;
      }

      // ---------- end line ----------
      if (show(endWrap, f >= 245.5)) {
        const left = keys(f, REF.endx) + (f < 246.25 ? -(246.25 - f) * 300 : 0), cy = keys(f, REF.endy);
        endline.style.transform = `translate(${px(left + 502 - L.wmW / 2)}, ${px(cy)}) translateY(-52%)`;
        const p = keys(f, REF.fill) * 100;
        const m = `linear-gradient(90deg, #000 ${(p - 3).toFixed(2)}%, transparent ${(p + 3).toFixed(2)}%)`;
        wmFill.style.webkitMaskImage = wmFill.style.maskImage = f < 248 ? "linear-gradient(90deg, transparent, transparent)" : p >= 100 ? "none" : m;
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
