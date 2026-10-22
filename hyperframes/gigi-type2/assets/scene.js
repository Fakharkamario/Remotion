// Gigi kinetic type, second style — 9.2 s, 30 fps, 276 frames, in the launch video's look (Inter, light grey, brand
// blue, black). The type follows the second reference edit:
//   - the opener types on letter by letter, each letter sweeping white → pale blue → brand blue → ink as it lands
//   - after that, words rise into place from just under the baseline; the line re-centres smoothly as it grows
//   - accent words wipe in from the right in a deep-to-bright blue gradient, then either fade to a pale tint,
//     settle to ink, or stay brand blue
//   - a light canvas and a black beat
//   0–22     "Are you..." types on, big and bold
//   23–51    "Are you looking"
//   52–112   black: "for a motion designer?"
//   113–152  "Hit me up,"
//   153–212  "let's cook together!"
//   213–276  the profile card flips up in 3D and holds
(function () {
  const FPS = 30, FRAMES = 276;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const sio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], clamp(t, 0, 1))));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  // a colour ramp through several stops, t in 0..1
  const ramp3 = (stops, t) => { t = clamp(t, 0, 1) * (stops.length - 1); const i = Math.min(stops.length - 2, Math.floor(t)); return mix(stops[i], stops[i + 1], t - i); };

  const INK = [24, 26, 32], WHITE = [255, 255, 255], GREY = [150, 154, 162], NAVY = [14, 52, 110], BLUE = [47, 147, 251], BLUE2 = [120, 190, 255], PALE = [205, 228, 255];
  const OPEN = { a: 0, b: 23, text: "Are you...", at: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] };
  // lines: [word, frame, kind] — kind: "fade" / "settle" / "keep" accent, otherwise a plain word
  // fs: font size; z0: the line arrives this much bigger and eases out to 1 (the reference's "It's" beat);
  // fit: the scale it eases down to after the given frame, as it grows past the frame (the reference's bloom line)
  const LINES = [
    { a: 23, b: 52, bg: "light", fs: 100, words: [["Are", 23], ["you", 23], ["looking", 35, "settle"]] },
    { a: 52, b: 113, bg: "dark", fs: 112, z0: 1.4, words: [["for", 53], ["a", 58], ["motion", 63, "keep"], ["designer?", 79, "keep"]] },
    { a: 113, b: 153, bg: "light", fs: 84, words: [["Hit", 115], ["me", 118], ["up,", 128, "fade"]] },
    { a: 153, b: 213, bg: "light", fs: 100, fit: [189, 0.84], words: [["let's", 154], ["cook", 159], ["together!", 189, "keep"]] },
  ];
  const BLOOM = 184, CARD = 213;
  const BADGE = '<svg viewBox="0 0 24 24"><path fill="#2f93fb" d="M12 1.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-.9 2.9-3-.2L12 20.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7.9-2.9-.9-2.9 2.5-1.7.9-2.9 3 .2z"/><path d="M7.6 11.6l3 3 5.8-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const SCENE = { FRAMES };
  SCENE.mount = function (stage) {
    const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
    const show = (n, on, mode = "block") => { n.style.display = on ? mode : "none"; return on; };

    const bgLight = el("div", "layer", stage), bgDark = el("div", "layer", stage), bgBloom = el("div", "layer", stage), bgCard = el("div", "layer", stage);
    bgLight.style.background = "#f3f3f4"; bgDark.style.background = "#161617";

    const open = el("div", "open", stage);
    const chars = [...OPEN.text].map((c) => el("span", "ch", open, c === " " ? "&nbsp;" : c));
    const lines = LINES.map((L) => {
      const row = el("div", "row " + L.bg, stage);
      // accent words are typed character by character, so each letter can sweep its own colour as it lands
      const ws = L.words.map(([t, , kind]) => el("span", "wd" + (kind ? " acc" : ""), row, kind ? `<span class="t">${[...t].map((c) => `<span class="c">${c}</span>`).join("")}</span>` : `<span class="t">${t}</span>`));
      return { L, row, ws };
    });
    const card = el("div", "pcard", stage, `<img class="av" src="assets/img/avatar.jpg" alt=""><div class="tx"><div class="nm">Aizal Khan <span class="bd">${BADGE}</span></div><div class="hn">@aizal_mp4</div></div>`);

    let G = null, OW = 0;
    const layout = () => {
      open.style.display = "block"; OW = open.offsetWidth; open.style.display = "none";
      G = lines.map(({ row, ws }) => {
        row.style.display = "block"; row.style.fontSize = px(LINES[lines.findIndex((x) => x.row === row)].fs);
        ws.forEach((w) => { w.style.transform = "none"; });
        const g = { x: ws.map((w) => w.offsetLeft + w.offsetWidth / 2), lw: ws.map((w) => w.offsetWidth), h: row.offsetHeight, rw: row.offsetWidth };
        row.style.display = "none";
        return g;
      });
    };
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(R0._f); });

    // the line keeps its visible words centred, gliding (not jumping) each time a word lands
    const centreAt = (k, F) => {
      const { L } = lines[k], g = G[k];
      const span = (n) => { let a = Infinity, b = -Infinity; L.words.forEach(([, at], i) => { if (at <= n) { a = Math.min(a, g.x[i] - g.lw[i] / 2); b = Math.max(b, g.x[i] + g.lw[i] / 2); } }); return a === Infinity ? g.rw / 2 : (a + b) / 2; };
      const ev = [...new Set(L.words.map(([, at]) => at))];
      let s = span(ev[0]);
      for (let i = 1; i < ev.length; i++) s += (span(ev[i]) - span(ev[i] - 0.01)) * sio(ramp(F, ev[i], ev[i] + 10));
      return s;
    };

    function render(F) {
      // ---- backgrounds
      const li = LINES.findIndex((L) => F >= L.a && F < L.b), dark = li >= 0 && LINES[li].bg === "dark";
      show(bgDark, dark); show(bgLight, !dark && F < CARD);
      // the bloom: wipes in from the left, then its colours slowly swirl round a pale centre
      if (show(bgBloom, false)) {
        const w = eo(ramp(F, BLOOM, BLOOM + 7)), r = (F - BLOOM) / 20;
        bgBloom.style.clipPath = `inset(0 ${(100 * (1 - w)).toFixed(2)}% 0 0)`;
        bgBloom.style.background = `radial-gradient(52% 46% at 50% 50%, rgba(246,247,250,1) 0%, rgba(246,247,250,.92) 45%, rgba(246,247,250,0) 100%),` +
          `radial-gradient(60% 70% at ${50 + 46 * Math.cos(r + 3.6)}% ${50 + 52 * Math.sin(r + 3.6)}%, rgba(140,110,255,.95), rgba(140,110,255,0) 70%),` +
          `radial-gradient(65% 75% at ${50 + 46 * Math.cos(r + 0.5)}% ${50 + 52 * Math.sin(r + 0.5)}%, rgba(47,147,251,.9), rgba(47,147,251,0) 70%),` +
          `radial-gradient(50% 60% at ${50 + 40 * Math.cos(r + 2)}% ${50 + 46 * Math.sin(r + 2)}%, rgba(150,205,255,.85), rgba(150,205,255,0) 70%), #eef1f6`;
      }
      if (show(bgCard, F >= CARD)) bgCard.style.background = "#f3f3f4";

      // ---- the opener: typed letter by letter, each sweeping through the colour ramp as it lands
      if (show(open, F < OPEN.b)) {
        // grows steadily while typing, and a little faster into the cut (as the reference's "Well..." does)
        open.style.transform = `translate(${px(960 - OW / 2)}, 540px) translateY(-50%) scale(${((1 + 0.004 * F) * (1 + 0.06 * Math.pow(ramp(F, 16, 23), 2))).toFixed(4)})`;
        chars.forEach((c, i) => {
          const t0 = OPEN.at[i], k = F - t0;
          if (k < 0) { c.style.opacity = "0"; return; }
          c.style.opacity = clamp((k + 1) / 2, 0, 1).toFixed(3);
          c.style.color = rgb(ramp3([WHITE, PALE, BLUE, NAVY, INK], k / 9));
          c.style.transform = `translateY(${(0.12 * (1 - eo(k / 5))).toFixed(3)}em) scale(${(1 + 0.06 * (1 - eo(k / 5))).toFixed(4)})`;
        });
      }

      // ---- the lines
      lines.forEach(({ row }) => (row.style.display = "none"));
      if (li >= 0) {
        const { L, row, ws } = lines[li], g = G[li];
        row.style.display = "block";
        const life = F - L.a, base = dark ? WHITE : INK, start = dark ? [120, 122, 128] : GREY;
        // a slow drift up and a gentle push across the line's life
        // the line's own motion: it arrives a touch low (and, for some, big) and eases into place, pushes in slowly,
        // then accelerates up out of its cut; the visible words stay centred as the line grows
        const enter = eo(life / 12), out = Math.pow(ramp(F, L.b - 8, L.b), 2);
        const sc = lerp(L.z0 || 1, 1, eo(life / 10)) * (1 + 0.0011 * life) * (L.fit ? lerp(1, L.fit[1], sio(ramp(F, L.fit[0], L.fit[0] + 10))) : 1);
        const cy = 540 + 26 * (1 - enter) - 70 * out;
        row.style.transform = `translate(960px, ${px(cy)}) scale(${sc.toFixed(4)}) translate(${px(-centreAt(li, F))}, ${px(-g.h / 2)})`;
        ws.forEach((w, i) => {
          const [, at, kind] = L.words[i], t = w.firstChild, k = F - at;
          if (k < 0) { w.style.opacity = "0"; return; }
          w.style.opacity = "1";
          if (!kind) {
            // rises into place from just under the baseline, darkening as it lands
            const p = eo(k / 5);
            w.style.transform = `translateY(${(0.32 * (1 - p)).toFixed(3)}em)`;
            w.style.opacity = clamp((k + 1) / 2, 0, 1).toFixed(3);
            t.style.color = rgb(mix(start, base, k / 5));
            t.style.backgroundImage = "none";
            return;
          }
          // accent: typed letter by letter; each letter rises a touch and sweeps white → pale → bright blue, then
          // "keep" stays blue, "settle" carries on down to the line colour, "fade" pales again from the tail end
          w.style.transform = "none";
          const cs = [...t.children], n = cs.length;
          cs.forEach((c, j) => {
            const kj = k - j * 1.15;
            if (kj < 0) { c.style.opacity = "0"; return; }
            c.style.opacity = clamp((kj + 1) / 2, 0, 1).toFixed(3);
            c.style.transform = `translateY(${(0.22 * (1 - eo(kj / 5))).toFixed(3)}em)`;
            let col = ramp3([WHITE, PALE, BLUE2, BLUE], kj / 7);
            if (kind === "settle") col = ramp3([WHITE, PALE, BLUE2, BLUE, NAVY, base], kj / 16);
            if (kind === "fade") col = mix(col, PALE, sio(ramp(k, n * 1.15 + 8 + j * 1.5, n * 1.15 + 22 + j * 1.5)) * clamp(0.25 + 0.9 * j / Math.max(1, n - 1), 0, 1));
            c.style.color = rgb(col);
          });
        });
      }

      // ---- the card flips up in 3D: it tips up from lying flat on a damped spring (a gentle overshoot past
      // face-on and back), rising and growing as it comes; its shadow lands with it, then holds
      if (show(card, F >= CARD, "flex")) {
        const p = ramp(F, CARD, CARD + 22), spring = 1 - Math.exp(-5.5 * p) * Math.cos(7 * p), e = eo(ramp(F, CARD, CARD + 15));
        const rx = 82 * (1 - spring), ry = -6 * (1 - e), ty = 90 * (1 - e), sc = (0.84 + 0.16 * e) * (1 + 0.0009 * (F - CARD));
        card.style.transform = `translate(-50%, -50%) translateY(${px(ty)}) perspective(1800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        card.style.opacity = clamp((F - CARD + 1) / 2, 0, 1).toFixed(3);
        card.style.filter = blurOf(2.5 * (1 - eo(ramp(F, CARD, CARD + 5))));
        card.style.boxShadow = `0 ${px(14 + 30 * e)} ${px(30 + 60 * e)} rgba(20,24,40,${(0.1 + 0.18 * e).toFixed(3)}), 0 ${px(4 + 6 * e)} ${px(10 + 14 * e)} rgba(20,24,40,${(0.06 + 0.1 * e).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,.06)`;
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
