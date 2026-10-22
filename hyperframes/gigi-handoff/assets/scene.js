// Gigi handoff — 9.53 s, 30 fps, 286 frames. Continues the storyboard cut (which leaves to the left) in the launch
// video's look: frosted white incoming bubbles, brand-blue outgoing ones, Inter, near-white background.
//   0–20     the old chat slides in from the right; the composer rises from below
//   20–60    "storyboard done " is typed, the Figma link is pasted, sent
//   60–92    the message flies up into the chat, the link preview pops in above it, the composer drops away
//   92–145   "i fucking love it!!" and "let's continue" pop in word by word while the view drifts and pushes in
//   145–240  a whip up-left lands close on "Perfect"; a typing bubble pulses under it
//   240–262  it opens into "Let's animate" with a tilt that settles
//   262–286  everything lifts away upward
// The camera follows the reference edit's measured per-frame motion (pan deltas and zoom steps); every bubble is
// placed by inverting that camera at the frame where the reference shows its counterpart.
(function () {
  const FPS = 30, FRAMES = 286;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  const sio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t, s = 1.8) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  // the reference holds every fifth frame (24 fps content in 30); pops step on that cadence
  const q = (F) => { const i = Math.floor(F); return i % 5 === 4 ? i - 1 : i; };
  const glide = (f, k, e = sio) => {
    if (f <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (f <= k[i][0]) return lerp(k[i - 1][1], k[i][1], e((f - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
    return k[k.length - 1][1];
  };

  // ---- measured camera of the reference (screen px per frame at 1280 wide; key f = move from f to f+1)
  const DX = { 82: -4, 83: 4, 87: 10, 88: 18, 90: 46, 91: 42, 92: 22, 93: 14, 95: 10, 96: 8, 97: 6, 98: 4, 100: 2, 101: 2, 102: 2, 127: -2, 128: -2, 130: -2, 131: -2, 132: -2, 133: -2, 135: -2, 136: -2, 137: -2, 145: -2, 146: -4, 147: -4, 148: -6, 150: -8, 151: -12, 152: -14, 153: -20, 155: -24, 156: -32, 157: -42, 158: -56, 160: -82, 161: -104, 162: -160, 163: -128, 165: -52, 166: -34, 167: -26, 168: -18, 170: -14, 171: -10, 172: -8, 173: -6, 175: -6, 176: -4, 177: -4, 178: -2, 180: -2 };
  const DY = { 5: -10, 6: 2, 7: 8, 8: 12, 10: 14, 11: 12, 12: 12, 13: 10, 15: 8, 16: 4, 17: 4, 18: 2, 57: -2, 58: -6, 60: -18, 61: -30, 62: -22, 63: -14, 65: -10, 66: -8, 67: -6, 68: -4, 70: -4, 71: -2, 72: -10, 73: -46, 75: -86, 76: -52, 77: -30, 82: -2, 83: 2, 87: 2, 88: -4, 90: -8, 91: -14, 92: -26, 93: -26, 95: -20, 96: -14, 97: -12, 98: -10, 100: -8, 101: -6, 102: -4, 103: -4, 105: -4, 106: -2, 107: -2, 108: -2, 110: -2, 111: -2, 112: -2, 113: -2, 115: -2, 116: -4, 117: -4, 118: -4, 120: -6, 121: -10, 122: -12, 123: -14, 125: -18, 126: -22, 127: -24, 128: -24, 130: -22, 131: -18, 132: -16, 133: -14, 135: -10, 136: -10, 137: -8, 138: -6, 140: -4, 141: -4, 142: -2, 143: -2, 145: -2, 146: -2, 147: -4, 148: -4, 150: -6, 151: -6, 152: -8, 153: -10, 155: -14, 156: -16, 157: -22, 158: -28, 160: -42, 161: -64, 162: -90, 163: -86, 165: -34, 166: -26, 167: -20, 168: -16, 170: -12, 171: -10, 172: -8, 173: -6, 175: -6, 176: -4, 177: -4, 178: -4, 180: -2, 181: -2, 182: -2, 183: -2 };
  const cum = (tab, F) => { const i = Math.floor(F); let s = 0; for (const k in tab) if (+k < i) s += tab[k]; return 1.5 * (s + (tab[i] || 0) * (F - i)); };
  // zoom steps read off bubble heights in the reference: 1.0 → 1.25 on the diagonal pan, → 1.93 on the whip
  const ZK = [[0, 1], [82, 1], [98, 1.25], [145, 1.25], [168, 1.93], [240, 1.97]];
  const P = [960, 540];
  // the old chat arrives from the right (the storyboard cut left to the left), on the reference's opening speed curve
  const ENTRY = [[0, 1900], [1, 1240], [2, 580], [3, 250], [4, 80], [5, 30], [6, 0]];
  const LIFT = (F) => -1500 * ei(ramp(F, 263, 284));
  const cam = (F) => ({ z: glide(F, ZK), tx: cum(DX, F) + (F < 6 ? glide(F, ENTRY, (t) => t) : 0), ty: cum(DY, F) + LIFT(F) });
  const toScr = (c, x, y) => [P[0] + (x - P[0]) * c.z + c.tx, P[1] + (y - P[1]) * c.z + c.ty];
  const toWorld = (F, sx, sy) => { const c = cam(F); return [P[0] + (sx - c.tx - P[0]) / c.z, P[1] + (sy - c.ty - P[1]) / c.z]; };

  const BH = 120;
  const OLD = [["hey aizal", 219], ["need a launch video", 378], ["quick", 543]];
  const TYPED = "storyboard done ", LINK = "https://figma.com/gigiai";
  const CLICKS = [21, 58];
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

    const world = el("div", "", stage); world.id = "world";
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
    card.id = "card";
    const sheen = card.querySelector(".sheen");
    const sent = bubble(TYPED + LINK, true);
    const in1 = bubble("i fucking love it!!"), in2 = bubble("let's continue");
    const perfect = bubble("Perfect", true);
    const typing = el("div", "bub blue", world, TAIL + '<div class="dots"><i></i><i></i><i></i></div>');
    const dots = [...typing.querySelectorAll(".dots i")];
    const anim = bubble("Let's animate", true);

    const composer = el("div", "", stage); composer.id = "composer";
    composer.innerHTML = `<div class="plus">${PLUS}</div><div class="barc"><div class="tx"></div><div class="send">${SEND}</div></div>`;
    const ctx = composer.querySelector(".tx"), sendBtn = composer.querySelector(".send");
    const COMP = { x: 368, y: 848 };

    const wash = el("div", "layer", stage); wash.id = "wash";
    const cursor = el("div", "", stage); cursor.id = "cursor";
    const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
    cursor.innerHTML = `<svg viewBox="0 0 64 64"><path d="${ARROW}" fill="#cfe6ff" stroke="#e3f0ff" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="#178bfc" stroke="#178bfc" stroke-width="7" stroke-linejoin="round"/></svg>`;

    // ---- layout: widths from the text, places by inverting the camera at the reference's frames
    let L = null;
    const layout = () => {
      // measure with everything shown (fonts can land while some bubbles are hidden)
      [...world.children].forEach((n) => (n.style.display = "block"));
      const w = (b) => b.b.offsetWidth;
      const wOld = old.map(w), wOn = w(onit), wSent = w(sent), wIn1 = w(in1), wIn2 = w(in2), wPer = w(perfect), wAnim = w(anim);
      const at24 = (sx, sy) => toWorld(24, sx, sy);
      const oldPos = OLD.map(([, y]) => at24(420, y));
      const onR = at24(1515, 714);
      const sentR = toWorld(84, 1530, 723);
      // the preview sits between "On it" and the sent message
      const cardTop = onR[1] + BH / 2 + 22, cardBot = sentR[1] - BH / 2 - 22, ch = cardBot - cardTop, cw = ch * 16 / 9;
      L = {
        wOld, wOn, wSent, wIn1, wIn2, wPer, wAnim, oldPos, onR, sentR,
        card: [sentR[0] + 40 - cw, cardTop, cw, ch],
        in1: toWorld(99, 465, 825), in2: toWorld(130, 450, 804),
        per: toWorld(169, 1029, 468), typ: toWorld(190, 1014, 676),
        sendSpot: [COMP.x + 130 + 1020 - 30 - 32, COMP.y - 8 + 60], inputSpot: [COMP.x + 130 + 330, COMP.y + 70],
      };
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    const place = (n, x, y, s = 1, r = 0, blur = 0, a = 1, origin) => {
      if (origin) n.style.transformOrigin = origin;
      n.style.transform = `translate(${px(x)}, ${px(y)}) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      n.style.filter = blurOf(blur); n.style.opacity = a.toFixed(3);
    };
    // incoming pop: grows from its tail corner with a soft blur, words dropping in one after another
    const popIn = (B, f, at, x, y) => {
      const on = show(B.b, f >= at);
      if (!on) return;
      const p = ramp(f, at, at + 6);
      place(B.b, x, y - BH / 2 + 26 * (1 - eo(p)), 0.55 + 0.45 * back(p, 1.6), 0, 6 * (1 - eo(p)), clamp((f - at + 1) / 2, 0, 1), "0% 100%");
      B.ws.forEach((w, i) => {
        const k = ramp(f, at + 1 + i * 1.2, at + 5 + i * 1.2);
        w.style.opacity = eo(k).toFixed(3);
        w.style.transform = `translateY(${(0.4 * (1 - eo(k))).toFixed(3)}em)`;
      });
    };

    function render(F) {
      const f = q(F);
      blobs.forEach((o, i) => {
        const t = F / FRAMES;
        o.b.style.transform = `translate(${px(o.x - o.s / 2 + 160 * Math.sin(t * 3.1 + i * 1.7))}, ${px(o.y - o.s / 2 + 110 * Math.cos(t * 2.6 + i))})`;
      });
      const c = cam(F);
      world.style.transform = `translate(${px(c.tx)}, ${px(c.ty)}) translate(${px(P[0])}, ${px(P[1])}) scale(${c.z.toFixed(5)}) translate(${px(-P[0])}, ${px(-P[1])})`;

      // old chat (already there; it rides in with the camera, and the opening preview shoves it further up)
      const push = 110 * eo(ramp(F, 76, 84));
      old.forEach((B, i) => { show(B.b, true); place(B.b, L.oldPos[i][0], L.oldPos[i][1] - BH / 2 - push, 1, 0, 0, 1, "0 50%"); B.ws.forEach((w) => { w.style.opacity = 1; w.style.transform = "none"; }); });
      show(onit.b, true); place(onit.b, L.onR[0] - L.wOn, L.onR[1] - BH / 2 - push, 1, 0, 0, 1);
      show(badge, true); place(badge, L.onR[0] - L.wOn - 30, L.onR[1] - BH / 2 - 34 - push, 1);

      // composer: rises from below, holds the typing and the paste, drops away after sending
      const cy = COMP.y + 300 * (1 - eo(ramp(F, 2, 14))) + 340 * ei(ramp(F, 80, 92));
      show(composer, F < 93);
      composer.style.transform = `translate(${px(COMP.x)}, ${px(cy)})`;
      const nTyped = clamp(Math.floor((f - 22) / 1.15), 0, TYPED.length);
      const pasted = f >= 45, hl = pasted ? 1 - ramp(f, 47, 52) : 0;
      ctx.innerHTML = f >= 60 ? '<span class="caret"></span>' :
        TYPED.slice(0, nTyped).replace(/ /g, "&nbsp;") + (pasted ? `<span class="paste" style="background:rgba(47,147,251,${(0.22 * hl).toFixed(3)})">${LINK}</span>` : "") + (Math.floor(F / 8) % 2 === 0 || f < 60 ? '<span class="caret"></span>' : "");
      sendBtn.style.transform = `scale(${(1 - 0.18 * Math.sin(Math.PI * ramp(F, 57, 61))).toFixed(3)})`;

      // the sent message lifts out of the composer and stays pinned just above it (the reference keeps the
      // newest message in place while the preview pushes the older chat up); from 84 it rides the camera
      const sentAt = (G) => {
        const Gc = Math.min(G, 84), c2 = cam(Gc), p = eo(ramp(Gc, 60, 69));
        const left = lerp(COMP.x + 130 + 44 - 40, 1530 - L.wSent * c2.z, p), y = glide(Gc, [[60, COMP.y + 52], [69, 716], [84, 723]]);
        return toWorld(Gc, left, y);
      };
      const sw = sentAt(F);
      if (show(sent.b, f >= 60)) {
        const p = eo(ramp(F, 60, 69));
        place(sent.b, sw[0], sw[1] - BH / 2, lerp(0.86, 1, p), 0, 4 * (1 - p), 1, "0 50%");
      }
      // link preview pops in above it
      if (show(card, f >= 77)) {
        const h = 435, w = h * 16 / 9, p = ramp(F, 77, 84);
        card.style.width = px(w); card.style.height = px(h);
        place(card, sw[0] + L.wSent + 40 - w, sw[1] - BH / 2 - 22 - h, 0.25 + 0.75 * back(p, 1.5), 0, 8 * (1 - eo(p)), eo(ramp(F, 77, 79)), "100% 100%");
        sheen.style.transform = `translateX(${px(-w + 2 * w * ramp(F, 82, 100))})`;
      }
      // tails move to the newest incoming message
      old[2].b.classList.toggle("last", f < 93);
      in1.b.classList.toggle("last", f >= 93 && f < 123);
      in2.b.classList.toggle("last", f >= 123);
      popIn(in1, f, 93, L.in1[0], L.in1[1]);
      popIn(in2, f, 123, L.in2[0], L.in2[1]);

      // "Perfect" rides in on the whip from the lower right
      if (show(perfect.b, f >= 157)) {
        const p = ramp(F, 157, 166);
        place(perfect.b, L.per[0] - L.wPer / 2, L.per[1] - BH / 2, 0.3 + 0.7 * back(p, 1.3), 0, 6 * (1 - eo(p)), eo(ramp(F, 157, 159)), "100% 100%");
      }
      // typing bubble under it, then it opens into "Let's animate"
      const open = ramp(F, 240, 247);
      if (show(typing, f >= 175 && f < 244, "block")) {
        const p = ramp(F, 175, 179);
        const w = 200;
        typing.style.width = px(w); typing.style.padding = "0 0 0 52px";
        place(typing, L.typ[0] - w / 2, L.typ[1] - BH / 2, (0.2 + 0.8 * back(p, 1.6)) * (1 + 0.06 * Math.sin(Math.PI * open)), 0, 0, 1 - ramp(F, 242, 244), "100% 100%");
        dots.forEach((d, i) => { const s = 0.5 + 0.5 * Math.sin(F / 4 - i * 1.1); d.style.opacity = (0.45 + 0.55 * s).toFixed(3); d.style.transform = `translateY(${(-4 * s).toFixed(2)}px)`; });
      }
      if (show(anim.b, f >= 242)) {
        const p = ramp(F, 242, 249), settle = ramp(F, 246, 260);
        const rot = lerp(-8, 0, back(settle, 1.2));
        place(anim.b, L.typ[0] - L.wAnim / 2, L.typ[1] - BH / 2, (0.7 + 0.3 * back(p, 1.6)) * (1 + 0.05 * (1 - eo(settle))), rot, 4 * (1 - eo(p)), eo(ramp(F, 242, 244)), "50% 50%");
        anim.b.style.boxShadow = `0 16px 40px rgba(30,130,250,.22), 0 0 ${px(60 * (1 - settle) + 20)} rgba(47,147,251,${(0.45 * (1 - settle) + 0.15).toFixed(3)})`;
        anim.ws.forEach((w, i) => { const k = ramp(F, 243 + i * 1.5, 248 + i * 1.5); w.style.opacity = eo(k).toFixed(3); w.style.transform = `translateY(${(0.35 * (1 - eo(k))).toFixed(3)}em)`; });
      }

      // colour wash rides the whip and the lift
      const wc = F >= 154 && F < 168 ? [154, 168] : F >= 262 && F < 282 ? [262, 282] : null;
      if (show(wash, !!wc)) {
        const p = ramp(F, wc[0], wc[1]);
        wash.style.opacity = (0.45 * Math.sin(Math.PI * p)).toFixed(3);
        wash.style.backgroundPosition = `${(110 - 120 * p).toFixed(1)}% 0`;
      }

      // cursor: arrives with the chat, clicks into the input, rests while typing, presses send, leaves with the composer
      if (show(cursor, F < 93)) {
        const entry = F < 6 ? glide(F, ENTRY, (t) => t) : 0;
        const x = glide(F, [[0, 760], [8, 760], [21, L.inputSpot[0]], [44, L.inputSpot[0] + 40], [56, L.sendSpot[0]], [92, L.sendSpot[0] + 10]]) + entry;
        const y = glide(F, [[0, 600], [8, 600], [21, L.inputSpot[1]], [44, L.inputSpot[1] + 10], [56, L.sendSpot[1]], [80, L.sendSpot[1] + 6]]) + 340 * ei(ramp(F, 80, 92));
        const press = CLICKS.reduce((m, k) => Math.max(m, Math.sin(Math.PI * ramp(F, k - 1, k + 3))), 0);
        cursor.style.transform = `translate(${px(x)}, ${px(y)}) scale(${(1 - 0.15 * press).toFixed(3)})`;
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
