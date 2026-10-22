// Gigi kinetic type — 9.2 s, 30 fps, 276 frames, in the launch video's look (Inter, white/grey, brand blue, black).
// Rebuilt on the reference edit's own frames and measurements:
//   - every line is laid out whole and its words pop in place: highlighted, a touch big, low and soft, settling in
//     ~3 frames (only the second line re-centres, lagging, as it grows, like the reference)
//   - words drop off from the left without the rest moving
//   - backgrounds are very soft fields: a glowing arc rising on dark, a pale haze, black, and a bloom from below
//   - the boxed words ride the reference's measured drag paths with their cursors
//   0–13     "We see you" zooms in from far as the arc rises
//   13–57    "spent way too long", then the words drop off from the left
//   57–70    "hunting for"; the arc melts into the pale haze
//   65–132   two cursors drag "solid" and "legit" in; "& … designers" completes the line
//   133–160  "But no stress"
//   160–191  cut to black: "we move FAST fr!!"
//   191–231  a bloom from below: "Let's cook it up!", italicising word by word at the end
//   232–276  cut: the profile card flips up and holds
(function () {
  const FPS = 30, FRAMES = 276;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t * t * t);
  const back = (t, s = 1.7) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  // keyed path [frame, x, y] (screen fractions), eased between keys
  const path = (f, k) => {
    if (f <= k[0][0]) return [k[0][1], k[0][2]];
    for (let i = 1; i < k.length; i++) if (f <= k[i][0]) { const a = k[i - 1], b = k[i], t = (f - a[0]) / (b[0] - a[0]), s = t * t * (3 - 2 * t); return [lerp(a[1], b[1], s), lerp(a[2], b[2], s)]; }
    const z = k[k.length - 1]; return [z[1], z[2]];
  };

  const WHITE = [255, 255, 255], NAVY = [36, 50, 72], BLUE = [47, 147, 251], MINT = [184, 247, 214];
  // [text, frame, kind]: "hi" arrives highlighted and settles; "fast" keeps the brand gradient; "box"/"box2" are dragged in
  const LINES = [
    { a: 0, b: 13, bg: "arc", w: 950, words: [["We", 0], ["see", 1, "hi"], ["you", 5, "hi"]] },
    { a: 13, b: 57, bg: "arc", w: 1250, grow: true, words: [["spent", 13, "hi"], ["way", 23, "hi"], ["too", 26], ["long", 28, "hi"]], exits: [[51, 0], [52, 1], [55, 2]] },
    { a: 57, b: 74, bg: "arc", w: 830, words: [["hunting", 57], ["for", 58, "hi"]] },
    { a: 74, b: 133, bg: "haze", w: 1380, words: [["solid", 65, "box"], ["&", 80], ["legit", 73, "box2"], ["designers", 82, "hi"]] },
    { a: 133, b: 160, bg: "haze", w: 940, words: [["But", 133, "hi"], ["no", 135, "hi"], ["stress", 137, "hi"]] },
    { a: 160, b: 191, bg: "dark", w: 960, words: [["we", 160], ["move", 161], ["FAST", 163, "fast"], ["fr!!", 166]] },
    { a: 191, b: 232, bg: "bloom", w: 1240, words: [["Let's", 192], ["cook", 192, "hi"], ["it", 195], ["up!", 195, "hi"]] },
  ];
  const CARD = 232;
  // the reference's drag paths: box centres in screen fractions, ending where the line puts them
  const GOOD = [[65, 0.5, -0.06], [69, 0.51, 0.05], [70, 0.5, 0.1], [71, 0.46, 0.17], [72, 0.41, 0.25], [73, 0.375, 0.29], [75, 0.335, 0.345], [76, 0.305, 0.39], [77, 0.285, 0.42], [78, 0.265, 0.435], [80, 0.245, 0.455], [81, 0.235, 0.475], [83, 0.235, 0.48], [97, 0.225, 0.495]];
  const REL = [[73, 0.63, 1.06], [75, 0.62, 0.99], [76, 0.595, 0.91], [77, 0.575, 0.83], [78, 0.55, 0.755], [80, 0.535, 0.7], [81, 0.52, 0.645], [82, 0.5, 0.575], [84, 0.49, 0.57], [85, 0.49, 0.55], [86, 0.48, 0.525], [88, 0.47, 0.505], [89, 0.47, 0.485], [97, 0.47, 0.48]];

  const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
  const cur = (fill, letter) => `<svg viewBox="0 0 64 64"><path d="${ARROW}" fill="${fill}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg><b style="background:${fill}">${letter}</b>`;
  const BADGE = '<svg viewBox="0 0 24 24"><path fill="#2f93fb" d="M12 1.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-.9 2.9-3-.2L12 20.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7.9-2.9-.9-2.9 2.5-1.7.9-2.9 3 .2z"/><path d="M7.6 11.6l3 3 5.8-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };

    const bg = { arc: el("div", "layer", stage), haze: el("div", "layer", stage), dark: el("div", "layer", stage), bloom: el("div", "layer", stage), card: el("div", "layer", stage) };
    const rise = el("div", "rise", stage);            // the bloom's light rising from below
    const group = el("div", "grp", stage);
    const lines = LINES.map((L) => {
      const row = el("div", "row " + L.bg, group);
      const ws = L.words.map(([t, , kind]) => {
        const w = el("span", "wd" + (kind === "fast" ? " fast" : ""), row, `<span class="t">${t}</span>`);
        if (kind && kind.startsWith("box")) { w.classList.add("bx", kind); ["", " r", " b", " r b"].forEach((c) => el("i", "hd" + c, w)); }
        return w;
      });
      return { L, row, ws };
    });
    const curG = el("div", "cur", stage, cur("#2f93fb", "G")), curC = el("div", "cur", stage, cur("#111214", "C"));
    const card = el("div", "pcard", stage, `<img class="av" src="assets/img/avatar.jpg" alt=""><div class="tx"><div class="nm">Aizal Khan <span class="bd">${BADGE}</span></div><div class="hn">@aizal_mp4</div></div>`);

    let G = null;
    const layout = () => {
      G = lines.map(({ L, row, ws }) => {
        row.style.display = "block"; row.style.fontSize = "100px";
        ws.forEach((w) => { w.style.transform = "none"; w.style.filter = "none"; });
        const fs = (100 * L.w) / row.offsetWidth;
        row.style.fontSize = px(fs);
        const g = { fs, x: ws.map((w) => w.offsetLeft + w.offsetWidth / 2), lw: ws.map((w) => w.offsetWidth), h: row.offsetHeight, rw: row.offsetWidth };
        row.style.display = "none";
        return g;
      });
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    // only the growing line re-centres (lagging); the others sit at their full-line centre from the first word
    const lineShift = (k, F) => {
      const { L } = lines[k], g = G[k];
      if (!L.grow) return g.rw / 2;
      const span = (n) => { let a = Infinity, b = -Infinity; L.words.forEach(([, at], i) => { if (at <= n) { a = Math.min(a, g.x[i] - g.lw[i] / 2); b = Math.max(b, g.x[i] + g.lw[i] / 2); } }); return (a + b) / 2; };
      const ev = L.words.map(([, at]) => at);
      let s = span(ev[0]);
      for (let i = 1; i < ev.length; i++) s += (span(ev[i]) - span(ev[i] - 0.01)) * eo(ramp(F, ev[i], ev[i] + 9));
      return s;
    };

    function render(F) {
      // ---- backgrounds: soft fields
      const up = eo(ramp(F, 0, 7));
      if (show(bg.arc, F < 77)) {
        // a glowing arc on dark: rises at the open, then splits into two lobes with a dark notch between
        const y = lerp(150, 92, up), split = eo(ramp(F, 10, 26)) * 13, d = F / 24;
        bg.arc.style.background = [
          `radial-gradient(34% 26% at 50% ${y + 30}%, rgba(255,255,255,.9), rgba(255,255,255,0) 72%)`,
          ...[-1, 1].map((sg) => `radial-gradient(64% 92% at ${50 + sg * split + 1.5 * Math.sin(d + sg)}% ${y + 2 * Math.cos(d * 0.7 + sg)}%, rgba(28,140,250,1) 0%, rgba(28,140,250,1) 56%, rgba(28,140,250,0) 74%)`),
          ...[-1, 1].map((sg) => `radial-gradient(70% 100% at ${50 + sg * split + 1.5 * Math.sin(d + sg)}% ${y + 2 * Math.cos(d * 0.7 + sg)}%, rgba(150,130,255,.95) 52%, rgba(150,130,255,.6) 66%, rgba(150,130,255,0) 82%)`),
          "linear-gradient(180deg, #0b0d12, #0f1218)",
        ].join(",");
        bg.arc.style.opacity = (1 - ramp(F, 70, 76)).toFixed(3);
      }
      const hz = (F) => `radial-gradient(46% 42% at ${26 + 6 * Math.sin(F / 40)}% -4%, rgba(170,215,240,.75), rgba(170,215,240,0) 72%), radial-gradient(40% 40% at ${88 + 4 * Math.cos(F / 34)}% 6%, rgba(225,225,250,.9), rgba(225,225,250,0) 72%), radial-gradient(70% 50% at ${60 + 8 * Math.sin(F / 30)}% 108%, rgba(150,185,255,.55), rgba(150,185,255,0) 72%), linear-gradient(180deg, #e3ecf3 0%, #d8e0ea 100%)`;
      if (show(bg.haze, F >= 69 && F < 160)) { bg.haze.style.background = hz(F); bg.haze.style.opacity = ramp(F, 69, 75).toFixed(3); }
      if (show(bg.dark, F >= 160 && F < 197)) bg.dark.style.background = `radial-gradient(42% 46% at ${30 + 5 * Math.sin(F / 18)}% 98%, rgba(47,147,251,.18), rgba(47,147,251,0) 72%), #121314`;
      // the bloom: light rises from below over the black, then a flowing pastel field
      const br = ramp(F, 190, 197);
      if (show(rise, F >= 190 && F < 198)) rise.style.transform = `translate(960px, ${px(lerp(1500, 520, eo(br)))}) scale(${(0.6 + 1.8 * eo(br)).toFixed(4)})`;
      if (show(bg.bloom, F >= 196 && F < CARD)) {
        const a = F / 14;
        bg.bloom.style.background = `radial-gradient(38% 55% at ${36 + 12 * Math.sin(a)}% ${18 + 8 * Math.cos(a)}%, rgba(110,195,255,.85), rgba(110,195,255,0) 72%), radial-gradient(45% 55% at ${88 + 6 * Math.cos(a * 0.8)}% ${86 + 6 * Math.sin(a)}%, rgba(170,160,255,.6), rgba(170,160,255,0) 72%), radial-gradient(40% 45% at ${8 + 6 * Math.sin(a * 1.2)}% 92%, rgba(150,215,255,.7), rgba(150,215,255,0) 72%), linear-gradient(180deg, #eaf0f6, #dfe7ef)`;
      }
      if (show(bg.card, F >= CARD)) bg.card.style.background = `radial-gradient(40% 50% at ${18 + 4 * Math.sin(F / 25)}% -5%, rgba(110,175,255,.55), rgba(110,175,255,0) 70%), radial-gradient(45% 45% at 85% 110%, rgba(190,175,255,.3), rgba(190,175,255,0) 70%), #eef0f3`;

      // ---- the type
      lines.forEach(({ row }) => (row.style.display = "none"));
      const drawLine = (k, fade = 1) => {
        const { L, row, ws } = lines[k], g = G[k];
        row.style.display = "block"; row.style.fontSize = px(g.fs);
        const light = L.bg === "haze" || L.bg === "bloom", base = light ? NAVY : WHITE, hiC = light ? BLUE : MINT;
        row.style.transform = `translate(${px(960 - lineShift(k, F))}, ${px(540 - g.h / 2)})`;
        ws.forEach((w, i) => {
          const [, at, kind] = L.words[i], t = w.firstChild;
          const gone = (L.exits || []).some(([e, j]) => j === i && F >= e);
          if (F < at || gone) { w.style.opacity = "0"; return; }
          // the pop: arrives a touch big, low and soft, settles in ~3 frames
          const p = eo(ramp(F, at, at + 3.5));
          let dx = 0, dy = 0.16 * g.fs * (1 - p), sc = 1 + 0.12 * (1 - p), bl = 6 * (1 - p), op = fade * clamp((F - at + 1) / 1.5, 0, 1);
          let col = base, glow = 0;
          if (kind === "hi") { const s = ramp(F, at + 1, at + 5); col = mix(hiC, base, s); glow = light ? 0 : 1 - s; }
          if (kind === "fast") { col = null; }
          if (kind && kind.startsWith("box")) {
            const P = kind === "box" ? GOOD : REL, [x0, y0] = path(F, P), [, x1, y1] = P[P.length - 1];
            dx = (x0 - x1) * 1920; dy = (y0 - y1) * 1080; sc = 1; bl = 0; op = 1; col = null;
          }
          w.style.opacity = op.toFixed(3);
          t.style.color = col ? rgb(col) : "";
          t.style.textShadow = glow > 0.02 ? `0 0 ${(0.18 * g.fs).toFixed(1)}px ${rgb(MINT, 0.7 * glow)}` : "";
          w.style.filter = blurOf(bl);
          // the italic flick at the end, word by word
          const it = k === 6 ? ramp(F, 227 + i * 1.2, 229 + i * 1.2) : 0;
          w.style.transform = `translate(${px(dx)}, ${px(dy)}) scale(${sc.toFixed(4)}) skewX(${(-11 * it).toFixed(2)}deg)`;
        });
      };
      const li = LINES.findIndex((L) => F >= L.a && F < L.b);
      if (li >= 0) drawLine(li);
      if (F >= 65 && F < 74) { drawLine(2, 1 - ramp(F, 69, 73)); drawLine(3); }
      // the zoom in from far at the open
      const z = lerp(0.32, 1, eo(ramp(F, 0, 4.5)));
      group.style.transform = `scale(${z.toFixed(4)})`;
      group.style.filter = blurOf(5 * (1 - eo(ramp(F, 0, 4))));

      // ---- cursors carry the boxes, then let go: G drifts off bottom-left, C flies up
      const g3 = G[3], sh3 = lineShift(3, F);
      [[curG, GOOD, 0, [-0.38, 0.62], [97, 106, -560, 240]], [curC, REL, 2, [0.36, 0.42], [97, 106, -40, -620]]].forEach(([c, P, wi, off, lv]) => {
        if (!show(c, F >= P[0][0] && F < lv[1])) return;
        const [x0, y0] = path(F, P), [, x1, y1] = P[P.length - 1];
        const bx = 960 - sh3 + g3.x[wi] + (x0 - x1) * 1920, by = 540 + (y0 - y1) * 1080;
        const q = ei(ramp(F, lv[0], lv[1]));
        c.style.transform = `translate(${px(bx + off[0] * g3.lw[wi] + lv[2] * q)}, ${px(by + off[1] * g3.fs + lv[3] * q)})`;
      });

      // ---- the card flips up (the reference's turn: flat, then face-on in ~4 frames), then a slow push
      if (show(card, F >= CARD, "flex")) {
        const p = ramp(F, CARD, CARD + 4);
        card.style.transform = `translate(-50%, -50%) perspective(1600px) rotateX(${(86 * (1 - back(p, 1.1))).toFixed(2)}deg) scale(${((0.97 + 0.03 * eo(p)) * (1 + 0.0009 * (F - CARD))).toFixed(4)})`;
        card.style.filter = blurOf(3 * (1 - eo(p)));
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
