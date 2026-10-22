// Gigi kinetic type — 9.2 s, 30 fps, 276 frames, in the launch video's look (Inter, white/grey, brand blue, black).
// The type motion copies the reference edit on its own frames: each word pops in highlighted, a touch big and soft,
// and settles while the line re-centres; words drop off from the left; two cursors drag boxed words into a sentence;
// the background wipes and cuts on the reference's frames. It ends on Aizal's profile card flipping up.
//   0–14     "We see you" zooms in as the blue arc rises
//   14–58    "spent way too long", then the words drop off from the left
//   58–78    "hunting for"; the arc sinks away to the light scene
//   68–121   two cursors drag "solid" and "legit" in; "& … designers" completes the line
//   121–145  "But no stress"
//   145–193  cut to black: "we move FAST fr!!"
//   193–217  a light bloom: "Let's cook something up!"
//   217–276  cut: the profile card flips up and holds
(function () {
  const FPS = 30, FRAMES = 276;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => (t = clamp(t, 0, 1), t * t * t);
  const sio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t, s = 1.7) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  const INK = [28, 28, 31], WHITE = [255, 255, 255], BLUE = [47, 147, 251], LILAC = [138, 108, 255], PASTEL = [190, 225, 255];
  // lines: [start, end, background, words [text, at, kind], target width at 1920, exits [[at, index]]]
  // kind: "hi" — arrives highlighted and settles to the line colour; "fast" — stays brand blue; "box" — boxed, dragged in
  const LINES = [
    { a: 0, b: 14, bg: "blue", w: 960, words: [["We", 0], ["see", 2, "hi"], ["you", 6, "hi"]] },
    { a: 14, b: 58, bg: "blue", w: 1250, words: [["spent", 14, "hi"], ["way", 29, "hi"], ["too", 32], ["long", 35, "hi"]], exits: [[52, 0], [53, 1], [56, 2]] },
    { a: 58, b: 79, bg: "blue", w: 860, words: [["hunting", 58], ["for", 59, "hi"]] },
    { a: 79, b: 121, bg: "light", w: 1330, words: [["solid", 70, "box"], ["&", 81], ["legit", 76, "box2"], ["designers", 83, "hi"]] },
    { a: 121, b: 145, bg: "light", w: 930, words: [["But", 121, "hi"], ["no", 123], ["stress", 125, "hi"]] },
    { a: 145, b: 193, bg: "dark", w: 1010, words: [["we", 145], ["move", 147], ["FAST", 149, "fast"], ["fr!!", 151]] },
    { a: 193, b: 217, bg: "bloom", w: 1320, words: [["Let's", 193], ["cook", 193, "hi"], ["something", 197], ["up!", 199, "hi"]] },
  ];
  const CARD_AT = 217;

  const ARROW = "M10 7 L56 27 L36 36 L28 57 Z";
  const cursorSvg = (fill, halo) => `<svg viewBox="0 0 64 64"><path d="${ARROW}" fill="${halo}" stroke="${halo}" stroke-width="15" stroke-linejoin="round" opacity=".85"/><path d="${ARROW}" fill="${fill}" stroke="${fill}" stroke-width="7" stroke-linejoin="round"/></svg>`;
  const BADGE = '<svg viewBox="0 0 24 24"><path fill="#2f93fb" d="M12 1.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-.9 2.9-3-.2L12 20.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7.9-2.9-.9-2.9 2.5-1.7.9-2.9 3 .2z"/><path d="M7.6 11.6l3 3 5.8-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };

    const bgs = { blue: el("div", "layer bgblue", stage), light: el("div", "layer bglight", stage), dark: el("div", "layer bgdark", stage), bloom: el("div", "layer bgbloom", stage), card: el("div", "layer bgcard", stage) };
    const bloomDisc = el("div", "disc", stage);
    const group = el("div", "grp", stage);

    // each line: a row of word spans at a fitted size; boxes for the dragged words
    const lines = LINES.map((L) => {
      const row = el("div", "row", group);
      const ws = L.words.map(([t, , kind]) => {
        const w = el("span", "wd" + (kind === "fast" ? " fast" : ""), row, t);
        if (kind && kind.startsWith("box")) { w.classList.add("bx", kind); el("i", "hd", w); el("i", "hd r", w); el("i", "hd b", w); el("i", "hd r b", w); }
        return w;
      });
      return { L, row, ws };
    });
    const curA = el("div", "cur", stage, cursorSvg("#178bfc", "#cfe6ff"));
    const curB = el("div", "cur", stage, cursorSvg("#111214", "#e9e9ed"));

    // the profile card
    const card = el("div", "pcard", stage, `<img class="av" src="assets/img/avatar.jpg" alt=""><div class="tx"><div class="nm">Aizal Khan <span class="bd">${BADGE}</span></div><div class="hn">@aizal_mp4</div></div>`);

    // layout: fit each line to its width, remember every word's centre within the line
    let G = null;
    const layout = () => {
      G = lines.map(({ L, row, ws }) => {
        row.style.display = "block"; row.style.fontSize = "100px";
        ws.forEach((w) => { w.style.transform = "none"; w.style.filter = "none"; });
        const fs = Math.min(170, (100 * L.w) / row.offsetWidth);
        row.style.fontSize = px(fs);
        const x = ws.map((w) => w.offsetLeft + w.offsetWidth / 2), lw = ws.map((w) => w.offsetWidth), rw = row.offsetWidth;
        row.style.display = "none";
        return { fs, x, lw, rw };
      });
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    // which words are on screen at F, and the centre of their span
    const visible = (li, F) => lines[li].L.words.map(([, at], i) => F >= at && !(lines[li].L.exits || []).some(([e, k]) => k === i && F >= e));
    const spanCentre = (li, vis) => {
      const g = G[li]; let a = Infinity, b = -Infinity;
      vis.forEach((v, i) => { if (v) { a = Math.min(a, g.x[i] - g.lw[i] / 2); b = Math.max(b, g.x[i] + g.lw[i] / 2); } });
      return a === Infinity ? g.rw / 2 : (a + b) / 2;
    };
    // the line re-centres with an ease each time a word arrives or leaves
    const shiftAt = (li, F) => {
      const L = lines[li].L, ev = [...new Set([L.a, ...L.words.map(([, at]) => at), ...(L.exits || []).map(([e]) => e)])].filter((t) => t >= L.a).sort((p, q) => p - q);
      let s = spanCentre(li, visible(li, ev[0]));
      for (let k = 1; k < ev.length; k++) { const c0 = spanCentre(li, visible(li, ev[k] - 0.01)), c1 = spanCentre(li, visible(li, ev[k])); s += (c1 - c0) * eo(ramp(F, ev[k], ev[k] + 7)); }
      return s;
    };

    // dragged words: start off-screen, glide into the line
    const DRAG = { box: { from: [-80, -260], t: [70, 87], cur: curA, off: [-0.42, 0.5], leave: [97, 112, -520, 420] }, box2: { from: [260, 760], t: [76, 95], cur: curB, off: [0.46, 0.5], leave: [99, 113, 140, -760] } };

    function render(F) {
      // ---- backgrounds
      const li = LINES.findIndex((L) => F >= L.a && F < L.b), inCard = F >= CARD_AT;
      // the blue arc: rises at the start, sinks away into the light scene
      const rise = 1 - eo(ramp(F, 0, 9)), sink = ei(ramp(F, 71, 80));
      const WAVES = [[22, 0], [50, 1.7], [78, 3.1]];
      const ay = 116 + 80 * rise + 110 * sink, ph = F / 9;
      show(bgs.blue, F < 81);
      bgs.blue.style.background = [
        `radial-gradient(40% 34% at 50% ${ay - 14}%, rgba(255,255,255,.8), rgba(255,255,255,0) 70%)`,
        // three overlapping waves: their solid blue on top, the light bands beneath, so only the wavy rim glows
        ...WAVES.map(([x, o]) => `radial-gradient(62% 150% at ${x + 4 * Math.sin(ph + o)}% ${ay - 3 * Math.cos(ph * 0.8 + o)}%, #2f93fb 0%, #2f93fb 64%, rgba(47,147,251,0) 66.5%)`),
        ...WAVES.map(([x, o]) => `radial-gradient(62% 150% at ${x + 4 * Math.sin(ph + o)}% ${ay - 3 * Math.cos(ph * 0.8 + o)}%, rgba(150,200,255,.95) 64%, rgba(170,150,255,.55) 72%, rgba(13,15,20,0) 82%)`),
        "linear-gradient(180deg, #0d0f14, #0d0f14)",
      ].join(",");
      show(bgs.light, F >= 71 && F < 145);
      bgs.light.style.background = `radial-gradient(60% 55% at ${30 + 10 * Math.sin(F / 30)}% 112%, rgba(120,180,255,.42), rgba(120,180,255,0) 70%), radial-gradient(50% 45% at ${76 + 8 * Math.cos(F / 26)}% -8%, rgba(190,175,255,.35), rgba(190,175,255,0) 70%), linear-gradient(180deg, #f3f5f8, #e8edf3)`;
      show(bgs.dark, F >= 145 && F < CARD_AT);
      bgs.dark.style.background = `radial-gradient(45% 50% at ${20 + 6 * Math.sin(F / 20)}% 105%, rgba(47,147,251,.22), rgba(47,147,251,0) 70%), #111214`;
      // the bloom: a light disc grows from the top, then a flowing pastel field
      const bl = ramp(F, 193, 198);
      show(bloomDisc, F >= 193 && F < 199);
      bloomDisc.style.transform = `translate(960px, -120px) scale(${(0.05 + 4 * eo(bl)).toFixed(4)})`;
      show(bgs.bloom, F >= 197 && F < CARD_AT);
      const fa = F / 16;
      bgs.bloom.style.background = `radial-gradient(45% 60% at ${30 + 18 * Math.sin(fa)}% ${20 + 10 * Math.cos(fa)}%, rgba(120,195,255,.75), rgba(120,195,255,0) 70%), radial-gradient(45% 60% at ${80 + 10 * Math.cos(fa * 0.8)}% ${80 + 10 * Math.sin(fa)}%, rgba(170,230,210,.7), rgba(170,230,210,0) 70%), radial-gradient(40% 50% at ${60 + 14 * Math.sin(fa * 1.2)}% 40%, rgba(200,185,255,.5), rgba(200,185,255,0) 70%), linear-gradient(180deg, #eef3f8, #e3ebf3)`;
      show(bgs.card, inCard);
      bgs.card.style.background = `radial-gradient(40% 50% at ${18 + 4 * Math.sin(F / 25)}% -5%, rgba(110,175,255,.55), rgba(110,175,255,0) 70%), radial-gradient(45% 45% at 85% 110%, rgba(190,175,255,.3), rgba(190,175,255,0) 70%), #eef0f3`;

      // ---- the type
      lines.forEach(({ row }) => (row.style.display = "none"));
      // "hunting for" stays a beat into the light scene, fading off as the boxes arrive
      const draw = (k, alphaAll = 1) => {
        const { L, row, ws } = lines[k], g = G[k], vis = visible(k, F);
        row.style.display = "block"; row.style.fontSize = px(g.fs);
        const base = L.bg === "light" || L.bg === "bloom" ? INK : WHITE, hiC = L.bg === "blue" ? PASTEL : BLUE;
        const sh = shiftAt(k, F);
        row.style.transform = `translate(${px(960 - sh)}, 540px) translateY(-50%)`;
        ws.forEach((w, i) => {
          const [, at, kind] = L.words[i];
          if (!vis[i]) { w.style.opacity = "0"; return; }
          const p = ramp(F, at, at + 5);
          let dx = 0, dy = 26 * (1 - eo(p)), sc = 1 + 0.18 * (1 - eo(p)), bl = 7 * (1 - eo(p)), op = clamp((F - at + 1) / 2, 0, 1);
          let col = base;
          if (kind === "hi") col = mix(hiC, base, ramp(F, at + 3, at + 9));
          if (kind === "fast") col = BLUE;
          if (kind && kind.startsWith("box")) {
            const D = DRAG[kind], q = sio(ramp(F, D.t[0], D.t[1]));
            dx = D.from[0] * (1 - q); dy = D.from[1] * (1 - q);
            sc = 1; bl = 0; op = clamp((F - D.t[0] + 2) / 2, 0, 1);
            col = kind === "box" ? BLUE : LILAC;
          }
          w.style.opacity = (op * alphaAll).toFixed(3);
          w.style.color = rgb(col);
          w.style.filter = blurOf(bl);
          w.style.transform = `translate(${px(dx)}, ${px(dy)}) scale(${sc.toFixed(4)})`;
        });
      };
      if (li >= 0) draw(li);
      if (F >= 68 && F < 79) draw(2, 1 - ramp(F, 72, 78));            // fades as the arc sinks
      if (F >= 68 && F < 79) draw(3);                                // the boxes are already on their way in
      // the italic flick on "Let's" before the cut
      const lw = lines[6].ws[0];
      lw.style.fontStyle = F >= 212 && F < CARD_AT ? "italic" : "normal";
      // the opening zoom: the first words arrive from far away
      const z0 = 0.32 + 0.68 * eo(ramp(F, 0, 6));
      group.style.transform = `scale(${(z0 * (1 + 0.0009 * F)).toFixed(4)})`;
      group.style.filter = blurOf(8 * (1 - eo(ramp(F, 0, 5))));

      // ---- cursors: they carry the boxes in, then leave
      [["box", 0], ["box2", 2]].forEach(([kind, idx]) => {
        const D = DRAG[kind], c = D.cur, wi = kind === "box" ? 0 : 2;
        if (!show(c, F >= D.t[0] - 2 && F < D.leave[1] && li !== -1 && F < 121)) return;
        const g = G[3], sh = shiftAt(3, F), q = sio(ramp(F, D.t[0], D.t[1]));
        const wx = 960 - sh + g.x[wi] + D.from[0] * (1 - q), wy = 540 + D.from[1] * (1 - q);
        const z = 1 + 0.0009 * F, sx = 960 + (wx - 960) * z, sy = 540 + (wy - 540) * z;
        const ox = D.off[0] * g.lw[wi] * z, oy = D.off[1] * g.fs * 0.95 * z;
        const lv = sio(ramp(F, D.leave[0], D.leave[1]));
        c.style.transform = `translate(${px(sx + ox + D.leave[2] * lv)}, ${px(sy + oy + D.leave[3] * lv)})`;
      });

      // ---- profile card: flips up from flat, a touch of overshoot, then a slow push
      if (show(card, inCard, "flex")) {
        const p = ramp(F, CARD_AT, CARD_AT + 6);
        const rx = 88 * (1 - back(p, 1.2)), sc = (0.94 + 0.06 * eo(p)) * (1 + 0.0012 * (F - CARD_AT));
        card.style.transform = `translate(-50%, -50%) perspective(1400px) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        card.style.filter = blurOf(4 * (1 - eo(p)));
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
