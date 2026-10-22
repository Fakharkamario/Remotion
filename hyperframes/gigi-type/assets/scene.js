// Gigi kinetic type — 9.2 s, 30 fps, 276 frames, in the launch video's look (Inter, white/grey, brand blue, black).
// Rebuilt on the reference edit's own frames and measurements:
//   - every line is laid out whole and its words pop in place: highlighted, a touch big, low and soft, settling in
//     ~3 frames (only the second line re-centres, lagging, as it grows, like the reference)
//   - words drop off from the left without the rest moving
//   - backgrounds are very soft fields: a glowing arc rising on dark, a pale haze, black, and a bloom from below
//   - the boxed words ride the reference's measured drag paths with their cursors
//   0–13     "Are you" zooms in from far as the arc rises
//   13–74    "looking for a", then the words drop off from the left
//   65–132   the arc melts into the pale haze; two cursors drag "motion" and "designer?" in
//   133–160  "Hit me up,"
//   160–191  cut to black: "let's COOK"
//   191–231  a bloom from below: "together!", italicising at the end
//   232–276  cut: the profile card flips up in 3D and holds
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
    { a: 0, b: 13, bg: "arc", w: 760, words: [["Are", 0], ["you", 5, "hi"]] },
    { a: 13, b: 74, bg: "arc", w: 1150, grow: true, words: [["looking", 13, "hi"], ["for", 23], ["a", 26, "hi"]], exits: [[51, 0], [53, 1]] },
    { a: 74, b: 133, bg: "haze", w: 1250, words: [["motion", 65, "box"], ["designer?", 73, "box2"]] },
    { a: 133, b: 160, bg: "haze", w: 900, words: [["Hit", 133, "hi"], ["me", 135], ["up,", 137, "hi"]] },
    { a: 160, b: 191, bg: "dark", w: 880, words: [["let's", 160], ["COOK", 163, "fast"]] },
    { a: 191, b: 232, bg: "bloom", w: 860, words: [["together!", 192, "hi"]] },
  ];
  const CARD = 232;
  // the reference's own line motion, measured on every frame (1280×720): [source frame, ink left, ink right, ink mid-y].
  // It never sits still: the second line drifts left and speeds up, each line accelerates up or down out of its cut
  // and the next one arrives still carrying that motion, the last line slowly grows.
  const TRACK = [[3,406,513,355.0],[4,356,495,347.0],[5,356,495,347.0],[6,330,755,348.0],[7,322,759,345.0],[8,322,955,345.0],[9,322,956,342.0],[10,322,956,342.0],[11,322,957,338.0],[12,322,957,332.0],[13,322,957,321.0],[17,508,779,370.0],[18,505,777,368.0],[19,499,775,366.0],[20,499,775,366.0],[21,494,769,364.0],[22,488,763,364.0],[23,479,755,363.0],[24,466,743,363.0],[25,466,743,363.0],[26,449,725,363.0],[27,422,899,365.0],[28,380,936,364.0],[29,332,928,364.0],[30,332,928,364.0],[31,296,895,363.0],[32,274,1105,363.0],[33,260,1091,363.0],[34,248,1081,362.0],[35,248,1081,362.0],[36,240,1073,362.0],[37,234,1067,361.0],[38,230,1063,361.0],[39,226,1059,361.0],[40,226,1059,361.0],[41,224,1057,361.0],[42,222,1055,361.0],[43,218,1051,361.0],[44,215,1048,361.0],[45,215,1048,361.0],[46,210,1043,361.0],[47,204,1039,361.0],[48,198,1031,361.0],[49,188,1022,361.0],[50,188,1022,361.0],[51,178,1011,361.0],[52,464,997,360.0],[53,648,979,359.0],[54,625,955,359.0],[55,625,955,359.0],[56,708,922,360.0],[57,630,845,360.0],[58,404,805,359.0],[59,390,791,359.0],[60,390,791,359.0],[61,378,781,359.0],[62,372,915,358.0],[63,366,913,358.0],[64,362,911,358.0],[65,362,911,358.0],[66,358,909,358.0],[67,354,905,358.0],[68,350,901,358.0],[69,346,895,357.0],[70,346,895,357.0],[85,181,1131,360.0],[86,181,1123,360.0],[87,183,1118,358.0],[88,186,1114,358.0],[89,186,1110,358.0],[90,186,1110,358.0],[91,186,1108,357.0],[92,186,1106,357.0],[93,186,1104,357.0],[94,186,1102,357.0],[95,186,1102,357.0],[96,186,1101,357.0],[97,186,1100,357.0],[98,186,1099,357.0],[99,186,1098,357.0],[100,186,1098,357.0],[101,186,1098,357.0],[102,186,1098,357.0],[103,186,1098,357.0],[104,186,1098,357.0],[105,186,1098,357.0],[106,186,1098,357.0],[107,186,1098,357.0],[108,186,1098,357.0],[109,186,1098,357.0],[110,186,1098,357.0],[111,186,1098,358.0],[112,186,1098,358.0],[113,186,1098,355.0],[114,186,1098,357.0],[115,186,1098,357.0],[116,186,1097,355.0],[117,186,1097,356.0],[118,186,1098,354.0],[119,186,1097,353.0],[120,186,1097,353.0],[121,186,1097,352.0],[122,186,1097,352.0],[123,186,1097,349.0],[124,186,1097,349.0],[125,186,1097,349.0],[126,186,1097,347.0],[127,186,1095,345.0],[128,186,1097,341.0],[129,186,1096,339.0],[130,186,1096,339.0],[131,186,1095,333.0],[132,186,1096,329.0],[133,186,1097,315.0],[136,331,687,368.0],[137,331,688,365.0],[138,331,689,361.0],[139,331,947,364.0],[140,331,947,364.0],[141,331,948,361.0],[142,331,949,358.0],[143,331,949,357.0],[144,331,949,356.0],[145,331,949,356.0],[146,331,949,355.0],[147,331,949,355.0],[148,331,949,356.0],[149,331,949,356.0],[150,331,949,356.0],[151,331,949,357.0],[152,331,949,358.0],[153,331,949,359.0],[154,331,949,361.0],[155,331,949,361.0],[156,331,949,363.0],[157,331,949,366.0],[158,331,949,371.0],[159,331,949,380.0],[160,331,949,380.0],[161,322,501,357.0],[162,322,627,356.0],[163,322,627,360.0],[164,322,626,362.0],[165,322,626,362.0],[166,322,626,364.0],[167,322,959,358.0],[168,322,959,361.0],[169,322,959,362.0],[170,322,959,362.0],[171,322,959,363.0],[172,322,959,364.0],[173,322,959,364.0],[174,322,959,365.0],[175,322,959,365.0],[176,322,959,365.0],[177,322,959,365.0],[178,322,959,365.0],[179,322,959,365.0],[180,322,959,365.0],[181,322,959,365.0],[182,322,959,365.0],[183,322,959,364.0],[184,322,959,363.0],[185,322,959,363.0],[186,322,959,362.0],[187,322,959,360.0],[188,322,959,357.0],[189,322,959,352.0],[190,322,959,352.0],[191,322,959,344.0],[197,207,1073,371.0],[198,206,1074,367.0],[199,205,1074,364.0],[200,205,1074,364.0],[201,205,1075,361.0],[202,204,1075,359.0],[203,203,1076,358.0],[204,203,1077,357.0],[205,203,1077,357.0],[206,202,1077,356.0],[207,201,1078,356.0],[208,200,1079,356.0],[209,200,1079,356.0],[210,200,1079,356.0],[211,199,1080,356.0],[212,198,1081,356.0],[213,198,1081,356.0],[214,197,1082,356.0],[215,197,1082,356.0],[216,196,1083,356.0],[217,196,1083,356.0],[218,195,1084,356.0],[219,194,1084,356.0],[220,194,1084,356.0],[221,194,1085,356.0],[222,193,1086,356.0],[223,192,1086,356.0],[224,191,1087,356.0],[225,191,1087,356.0],[226,190,1088,356.0],[227,189,1090,356.0],[228,187,1091,356.0],[229,185,1092,356.0],[230,185,1092,356.0],[231,183,1094,357.0],[232,180,1097,357.0]];
  const seg = (a, b) => TRACK.filter((r) => r[0] >= a && r[0] <= b);
  const at = (rows, n, j) => {
    if (n <= rows[0][0]) return rows[0][j];
    for (let i = 1; i < rows.length; i++) if (n <= rows[i][0]) { const a = rows[i - 1], b = rows[i]; return lerp(a[j], b[j], (n - a[0]) / (b[0] - a[0])); }
    const a = rows[rows.length - 2], b = rows[rows.length - 1];
    return b[j] + (b[j] - a[j]) / (b[0] - a[0]) * (n - b[0]);      // carry on at the last speed
  };
  const SEG = [seg(3, 13), seg(14, 51), seg(85, 133), seg(137, 159), seg(161, 191), seg(197, 231)];
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
    const card = el("div", "pcard", stage, `<i class="sheen"></i><img class="av" src="assets/img/avatar.jpg" alt=""><div class="tx"><div class="nm">Aizal Khan <span class="bd">${BADGE}</span></div><div class="hn">@aizal_mp4</div></div>`);

    const sheen = card.querySelector(".sheen");
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

    // where the reference puts the line at this frame: its mid-y, and for the drifting lines its left edge
    const lineXform = (k, F, g) => {
      const n = F + 1, rows = SEG[k], cy = 1.5 * at(rows, n, 3) + 0.08 * g.h;
      let x = 960 - lineShift(k, F), sc = 1;
      if (k === 1) x = 1.5 * at(rows, n, 1) - (g.x[0] - g.lw[0] / 2);    // the visible span's left edge, drifting
      if (k === 5) sc = (at(rows, n, 2) - at(rows, n, 1)) / (rows[0][2] - rows[0][1]);
      return `translate(${px(x)}, ${px(cy - g.h / 2)}) translate(${px(g.rw / 2)}, ${px(g.h / 2)}) scale(${sc.toFixed(4)}) translate(${px(-g.rw / 2)}, ${px(-g.h / 2)})`;
    };

    function render(F) {
      // ---- backgrounds: soft fields
      const up = eo(ramp(F, 0, 7));
      if (show(bg.arc, F < 77)) {
        // a glowing arc on dark: rises at the open, then splits into two lobes with a dark notch between
        const y = lerp(175, 102, up), split = eo(ramp(F, 10, 26)) * 22, d = F / 24;
        bg.arc.style.background = [
          `radial-gradient(30% 24% at 50% ${Math.min(108, y + 12)}%, rgba(255,255,255,.9), rgba(255,255,255,0) 72%)`,
          ...[-1, 1].map((sg) => `radial-gradient(70% 140% at ${50 + sg * split + 1.5 * Math.sin(d + sg)}% ${y + 2 * Math.cos(d * 0.7 + sg)}%, rgba(28,140,250,1) 0%, rgba(28,140,250,1) 56%, rgba(28,140,250,0) 72%)`),
          ...[-1, 1].map((sg) => `radial-gradient(76% 150% at ${50 + sg * split + 1.5 * Math.sin(d + sg)}% ${y + 2 * Math.cos(d * 0.7 + sg)}%, rgba(150,130,255,.95) 52%, rgba(150,130,255,.65) 64%, rgba(150,130,255,0) 78%)`),
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
        row.style.transform = lineXform(k, F, g);
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
          const it = k === 5 ? ramp(F, 227 + i * 1.2, 229 + i * 1.2) : 0;
          w.style.transform = `translate(${px(dx)}, ${px(dy)}) scale(${sc.toFixed(4)}) skewX(${(-11 * it).toFixed(2)}deg)`;
        });
      };
      const li = LINES.findIndex((L) => F >= L.a && F < L.b);
      if (li >= 0) drawLine(li);
      if (F >= 65 && F < 74) { drawLine(1, 1 - ramp(F, 69, 73)); drawLine(2); }
      // the zoom in from far at the open
      const z = lerp(0.32, 1, eo(ramp(F, 0, 4.5)));
      group.style.transform = `scale(${z.toFixed(4)})`;
      group.style.filter = blurOf(5 * (1 - eo(ramp(F, 0, 4))));

      // ---- cursors carry the boxes, then let go: G drifts off bottom-left, C flies up
      const g3 = G[2], sh3 = lineShift(2, F);
      [[curG, GOOD, 0, [-0.38, 0.62], [97, 106, -560, 240]], [curC, REL, 1, [0.36, 0.42], [97, 106, -40, -620]]].forEach(([c, P, wi, off, lv]) => {
        if (!show(c, F >= P[0][0] && F < lv[1])) return;
        const [x0, y0] = path(F, P), [, x1, y1] = P[P.length - 1];
        const bx = 960 - sh3 + g3.x[wi] + (x0 - x1) * 1920, by = 1.5 * at(SEG[2], F + 1, 3) + 0.08 * g3.h + (y0 - y1) * 1080;
        const q = ei(ramp(F, lv[0], lv[1]));
        c.style.transform = `translate(${px(bx + off[0] * g3.lw[wi] + lv[2] * q)}, ${px(by + off[1] * g3.fs + lv[3] * q)})`;
      });

      // ---- the card flips up in 3D: it tips up from lying flat on a damped spring (a gentle overshoot past face-on
      // and back), rising and growing as it comes; its shadow lands with it, then a light sheen crosses it
      if (show(card, F >= CARD, "flex")) {
        const p = ramp(F, CARD, CARD + 22), spring = 1 - Math.exp(-5.5 * p) * Math.cos(7 * p), e = eo(ramp(F, CARD, CARD + 15));
        const rx = 82 * (1 - spring), ry = -6 * (1 - e), ty = 90 * (1 - e), sc = (0.84 + 0.16 * e) * (1 + 0.0009 * (F - CARD));
        card.style.transform = `translate(-50%, -50%) translateY(${px(ty)}) perspective(1800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        card.style.opacity = clamp((F - CARD + 1) / 2, 0, 1).toFixed(3);
        card.style.filter = blurOf(2.5 * (1 - eo(ramp(F, CARD, CARD + 5))));
        card.style.boxShadow = `0 ${px(14 + 30 * e)} ${px(30 + 60 * e)} rgba(20,24,40,${(0.1 + 0.18 * e).toFixed(3)}), 0 ${px(4 + 6 * e)} ${px(10 + 14 * e)} rgba(20,24,40,${(0.06 + 0.1 * e).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,.06)`;
        sheen.style.transform = `translateX(${px(-700 + 2200 * eo(ramp(F, CARD + 14, CARD + 34)))}) skewX(-20deg)`;
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
