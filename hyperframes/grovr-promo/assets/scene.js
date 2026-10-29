// grovr — 35.4 s promo, 30 fps, 1062 frames. Shot for shot it follows the motion of the reference edit (kinetic
// type that types, shrinks and slams, glyph cuts on alternating grounds, outline letters drawn with their bezier
// nodes, a mockup cascade, a spinning-coin ring wrapped in spiral text, app UI, 3D cards, an arched word and the
// end card). The brand, copy, palette, logo and every drawing are new: grovr rounds up card purchases and invests
// the spare change in climate projects. Lime / forest / cream / lilac / stone, the sprout mark and jade coins.
//   0–68      "Every" types huge under a pull-back, hard cut to "Every coin can", "MATTER" rises turning in perspective
//   68–122    glyph cuts on alternating grounds, then a scatter of symbols
//   116–168   "Put your → / spare (mark) change / to work." lights up word by word; push in, whip
//   168–248   outline letters of "grovr" pan past with their nodes and handles
//   248–290   the wordmark slams in, ground cuts to lime
//   290–392   "Say hello to" / "GREEN GAINS" slam / "FOR ↗ EVERYONE" rises letter by letter
//   392–478   eight brand mockups cut on the beat, cascade past "Meet the sprout", collapse to the lime card
//   478–540   "GROW / WHAT (mark) / MATTERS." rises, then shrinks into a ring of words around a spinning coin
//   540–650   coins rush in, chain into an arc, close into a ring inside spiral text; "watch it grow →" over a big coin
//   650–700   "MAKE EVERY / CENT COUNT" with three flipping coins
//   700–728   "Round up. / Invest. / Plant." with the lime pill stepping down
//   728–762   the feature list scrolls with a highlighted row
//   762–816   the app's portfolio screen grows in, the balance counts up, the chart draws
//   816–866   two poster cards
//   866–916   "Spend it. / Plant it." over 3D cards, then a close pass across the card
//   916–972   "INVEST FOR" / arched "GOOD"
//   972–1062  end card: the mark rolls in, the wordmark slides out from behind it
(function () {
  const FPS = 30, FRAMES = 1062, W = 1920, H = 1080;
  const SUB = 0; // sub-frame time offset; scripts/render-mb.sh sets it for its second, interleaved pass
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => Math.pow(clamp(t, 0, 1), 3);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const e5 = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
  // expo ease-out 0 → 1 over 2 d frames; it lands and stops, no overshoot (the reference never springs)
  const spr = (f, t0, d) => { const p = (f - t0) / (2 * d); return p <= 0 ? 0 : p >= 1 ? 1 : (1 - Math.pow(2, -10 * p)) / (1 - Math.pow(2, -10)); };
  const sprB = spr;
  const shk = (f, t0, a, ph = 0) => (f < t0 ? 0 : a * Math.exp(-(f - t0) / 3.5) * Math.sin((f - t0) * 2.6 + ph));
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); t = clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  // smooth lookup through [frame, value] pairs: a monotone cubic that passes through every key and never overshoots
  const slope = (p, i) => (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
  const tangent = (p, k) => {
    const n = p.length;
    if (n < 2) return 0;
    if (k === 0) return slope(p, 0);
    if (k === n - 1) return slope(p, n - 2);
    const d0 = slope(p, k - 1), d1 = slope(p, k);
    if (d0 * d1 <= 0) return 0;
    const h0 = p[k][0] - p[k - 1][0], h1 = p[k + 1][0] - p[k][0];
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
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
  const rel = (t, p) => p.map(([a, v]) => [t + a, v]);
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

  // a slam: from big and soft to a squashed landing, a small rebound, settled
  const SLAM_S = [[0, 1.18], [3, 1.03], [8, 1]];
  const SLAM_B = [[0, 6], [2, 0]];

  // brand
  const LIME = "#BFF24A", FOREST = "#0F2B21", CREAM = "#F2EEE3", LILAC = "#D8CFF2", STONE = "#D8D0BD", CORAL = "#FF7A59", NIGHT = "#08130E";
  const UI = '"Inter", system-ui, sans-serif';
  const F = (w, s) => `${w} ${s}px ${UI}`;

  // the sprout mark: a stem with a low leaf to the left and a high leaf to the right
  const MARK_D = "M46 92 L46 60 C27 62 10 50 8 27 C30 25 44 38 46 58 L46 52 C49 27 66 9 92 8 C93 34 76 51 54 52 L54 92 Z";
  const mark = (c, extra = "") => `<svg viewBox="0 0 100 100" ${extra}><path d="${MARK_D}" fill="${c}"/></svg>`;
  const ARROW = (c, sw = 13) => `<svg viewBox="0 0 100 100"><path d="M18 82 L80 20 M34 20 L80 20 L80 66" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="square"/></svg>`;
  const ARROW_R = (c, sw = 12) => `<svg viewBox="0 0 100 100"><path d="M10 50 L84 50 M54 20 L84 50 L54 80" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="square"/></svg>`;
  const SUN = (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="9"/><circle cx="50" cy="50" r="15" fill="${c}"/><path d="M50 10 V32 M50 68 V90 M10 50 H32 M68 50 H90" stroke="${c}" stroke-width="9"/></svg>`;
  const EMB = `<svg viewBox="0 0 100 100"><path d="${MARK_D}" fill="rgba(4,40,25,.42)" transform="translate(2.5 3)"/><path d="${MARK_D}" fill="rgba(210,255,225,.5)"/></svg>`;

  const SCENE = {};
  SCENE.mount = function (stage) {
    const vis = (el, on, d = "block") => { el.style.display = on ? d : "none"; };
    const meas = document.createElement("span");
    meas.style.cssText = "position:absolute;left:-12000px;top:0;white-space:pre;visibility:hidden";
    stage.appendChild(meas);
    const stageScale = () => stage.getBoundingClientRect().width / W || 1;
    let mcache = {};
    const measure = (text, font) => {
      const k = font + "|" + text;
      if (mcache[k] != null) return mcache[k];
      meas.style.font = font;
      meas.textContent = text;
      return (mcache[k] = meas.getBoundingClientRect().width / stageScale());
    };
    const mk = (host, cls, html, css) => { const e = document.createElement("div"); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (css) e.style.cssText = css; host.appendChild(e); return e; };
    const scene = (id, bg) => { const s = mk(stage, "scene", null, `background:${bg}`); s.id = id; return s; };
    // a text span that knows its size; place() puts its centre at (cx, cy)
    const txt = (host, s, font, color) => {
      const e = mk(host, "abs", null, `font:${font};color:${color}`);
      e.textContent = s;
      e._font = font;
      Object.defineProperty(e, "_w", { get: () => measure(e.textContent, e._font) });
      e._h = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
      return e;
    };
    const icon = (host, html, size) => { const e = mk(host, "abs", html, `width:${size}px;height:${size}px`); e.firstChild.style.cssText = "width:100%;height:100%;display:block"; Object.defineProperty(e, "_w", { value: size }); e._h = size; return e; };
    const place = (e, cx, cy, s = 1, o = 1, rot = 0, extra = "") => {
      e.style.transformOrigin = "50% 50%";
      e.style.transform = `translate(${px(cx - e._w / 2)}, ${px(cy - e._h / 2)}) rotate(${rot.toFixed(3)}deg) scale(${(+s).toFixed(4)}) ${extra}`;
      e.style.opacity = clamp(o, 0, 1).toFixed(3);
    };
    // a word broken into letters, laid out by prefix width so kerning survives
    const letters = (host, s, font, color) => s.split("").map((c, i) => {
      const e = txt(host, c, font, color);
      Object.defineProperty(e, "_x", { get: () => measure(s.slice(0, i), e._font) + measure(c, e._font) / 2 });
      return e;
    });

    // ---------- coins ----------
    const makeCoin = (host) => mk(host, "coin", `<i class="rim"></i><i class="face">${EMB}</i>`);
    const LGT = (() => { const v = [-0.45, -0.55, 0.7], m = Math.hypot(...v); return v.map((x) => x / m); })();
    // n is the coin's face normal in camera space (z toward the viewer); the disc projects to an ellipse squashed along n
    function drawCoin(el, cx, cy, d, n, o = 1, z = 0) {
      if (o <= 0.001 || d < 1) { el.style.display = "none"; return; }
      el.style.display = "block";
      const m = Math.hypot(n[0], n[1], n[2]) || 1, nx = n[0] / m, ny = n[1] / m, nz = n[2] / m;
      const sx = Math.max(0.035, Math.abs(nz)), side = Math.sqrt(Math.max(0, 1 - nz * nz)), th = d * 0.085 * side, sg = nz >= 0 ? 1 : -1;
      const ang = Math.hypot(nx, ny) < 1e-4 ? 0 : Math.atan2(ny, nx);
      el.style.width = el.style.height = px(d);
      el.style.setProperty("--d", px(d));
      el.style.transform = `translate(${px(cx - d / 2)}, ${px(cy - d / 2)}) rotate(${ang.toFixed(4)}rad)`;
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = String(Math.round(5000 - z));
      const [face, rim] = [el.children[1], el.children[0]];
      face.style.transform = `scaleX(${sx.toFixed(4)})`;
      rim.style.transform = `translateX(${px(-sg * th / 2)}) scaleX(${((d * sx + th) / d).toFixed(4)})`;
      const lit = Math.max(0, sg * (nx * LGT[0] + ny * LGT[1] + nz * LGT[2]));
      face.style.filter = `brightness(${(0.42 + 0.85 * lit).toFixed(3)})`;
      rim.style.filter = `brightness(${(0.5 + 0.5 * lit).toFixed(3)})`;
    }
    const spinN = (th, tilt = 0) => [Math.sin(th), Math.sin(tilt) * Math.cos(th), Math.cos(th) * Math.cos(tilt)];

    // =====================================================================================================
    // S1  "Every" → "Every coin can" → "MATTER"
    const s1 = scene("s1", LIME);
    const FBIG = F(800, 430), FSM = F(650, 56), FMAT = F(800, 320);
    const big1 = letters(s1, "Every", FBIG, FOREST);
    const small1 = ["coin", "can"].map((w) => txt(s1, w, FSM, FOREST));
    const mat = letters(s1, "MATTER", FMAT, FOREST);
    const persp1 = mk(s1, "abs", null, "width:1920px;height:1080px;perspective:1400px;perspective-origin:960px 600px");
    const matBox = mk(persp1, "abs", null, "width:1920px;height:1080px;transform-style:preserve-3d");
    mat.forEach((e) => matBox.appendChild(e));
    function renderS1(f) {
      // 0–23: the camera pulls back on a huge "Every" while it types; hard cut to the small line
      const big = f < 23, mid = f >= 23 && f < 49;
      s1.style.background = f < 49 ? LIME : CREAM;
      const t = [0, 3, 7, 11, 15];
      const zs = keys(f, [[0, 1.55], [8, 1.22], [16, 1.06], [23, 1]]);
      const fullW = measure("Every", FBIG);
      big1.forEach((e, i) => {
        e.style.font = big ? FBIG : FSM;
        e._font = big ? FBIG : FSM;
        e._h = big ? 430 : 56;
      });
      const lineW = measure("Every coin can", FSM), lineL = 960 - lineW / 2;
      const offs = [0, measure("Every ", FSM), measure("Every coin ", FSM)];
      const words = [big1, small1[0], small1[1]];
      if (big) {
        big1.forEach((e, i) => place(e, 60 + e._x * zs, 300 + 40 * (zs - 1), zs, f >= t[i] ? 1 : 0));
        big1.forEach((e) => (e.style.color = FOREST));
        small1.forEach((e) => (e.style.opacity = 0));
      } else if (mid) {
        // the small words arrive on staggered baselines and ease into one line while the line drifts
        const settle = eio(ramp(f, 23, 40)), lift = eio(ramp(f, 41, 49));
        const base = [22, -6, -30], ly = lerp(552, 540, ramp(f, 23, 49)) - 200 * lift;
        const spreadY = [0, 18, 34];
        words.forEach((w, i) => {
          const wy = ly + base[i] * (1 - settle) + spreadY[i] * lift;
          const on = f >= 23 + i * 2;
          if (i === 0) big1.forEach((e) => place(e, lineL + e._x, wy, 1, 1));
          else place(w, lineL + offs[i] + w._w / 2, wy, 1, on ? 1 : 0);
        });
        [...big1, ...small1].forEach((e) => (e.style.color = mix(FOREST, "#4a5a3a", lift)));
      }
      // 49–68: on cream the line sits grey above; MATTER rises in perspective and turns flat, then pulls away
      const late = f >= 49;
      persp1.style.display = late ? "block" : "none";
      if (late) {
        const ly = 330 + 8 * ramp(f, 49, 68);
        const shrink = ei(ramp(f, 63, 68)), gs = lerp(1, 0.55, shrink);
        words.forEach((w, i) => {
          const els = i === 0 ? big1 : [w];
          els.forEach((e) => {
            const x = i === 0 ? lineL + e._x : lineL + offs[i] + e._w / 2;
            place(e, 960 + (x - 960) * gs, lerp(ly, 470, shrink), gs, 1);
            e.style.color = "#8b8f86";
          });
        });
        const rise = eo(ramp(f, 49, 56));
        const mW = measure("MATTER", FMAT);
        mat.forEach((e, j) => {
          const lt = clamp((f - 49 - j * 0.6) / 7, 0, 1);
          const y = lerp(1250, 640, eo(lt));
          place(e, 960 + (e._x - mW / 2), y, 1, f >= 49 + j * 0.6 ? 1 : 0);
        });
        const ry = keys(f, [[49, 34], [56, 14], [68, -6]]), rx = keys(f, [[49, -26], [56, -8], [68, 4]]);
        matBox.style.transformOrigin = "960px 640px";
        matBox.style.transform = `translate(0, ${px(lerp(0, -90, shrink))}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(gs * lerp(1.12, 1, rise)).toFixed(4)})`;
      }
    }

    // =====================================================================================================
    // S2  glyph slams, then a scatter of symbols on lilac
    const s2 = scene("s2", FOREST);
    const GL = [
      { t: 68, bg: FOREST, c: LIME, k: "$" },
      { t: 73, bg: CREAM, c: FOREST, k: "%" },
      { t: 77, bg: FOREST, c: LIME, k: "arrow" },
      { t: 82, bg: LIME, c: FOREST, k: "mark" },
    ];
    GL.forEach((g) => {
      g.el = g.k === "arrow" ? icon(s2, ARROW(g.c, 15), 720) : g.k === "mark" ? icon(s2, mark(g.c), 760) : txt(s2, g.k, F(800, 900), g.c);
    });
    const SCAT = [["$", 380, 330, -8], ["%", 1430, 300, 6], ["+", 860, 760, 0], ["arrow", 560, 760, 0], ["mark", 1160, 520, -6], ["@", 1500, 760, 4], ["=", 300, 640, 0], ["$", 1720, 520, 10]];
    SCAT.forEach((s, i) => {
      s.el = s[0] === "arrow" ? icon(s2, ARROW(FOREST, 14), 170) : s[0] === "mark" ? icon(s2, mark(FOREST), 190) : txt(s2, s[0], F(800, 200), FOREST);
      s.t = 87 + [0, 0, 3, 3, 6, 6, 9, 9][i];
    });
    function renderS2(f) {
      const cur = [...GL].reverse().find((g) => f >= g.t);
      s2.style.background = f >= 87 ? LILAC : cur ? cur.bg : FOREST;
      GL.forEach((g) => {
        const on = f >= 87 ? false : cur === g;
        if (!on) { g.el.style.display = "none"; return; }
        g.el.style.display = "block";
        const lt = f - g.t;
        // each glyph is cut in already in place and only pushes in slowly
        place(g.el, 960, 540, 1.04 + 0.012 * lt, 1);
        g.el.style.filter = "none";
      });
      SCAT.forEach((s, i) => {
        const on = f >= s.t && f < 122;
        s.el.style.display = on ? "block" : "none";
        if (!on) return;
        const lt = f - 87;
        const drift = eio(ramp(f, 110, 120));
        const x = lerp(s[1] + lt * 2.2, 1800, drift * 0.3), y = s[2] - lt * 1.1;
        place(s.el, x, y, lerp(1.08, 1, ramp(f, 87, 116)), 1 - drift, s[3]);
      });
    }

    // =====================================================================================================
    // S3  "Put your → / spare (mark) change / to work."
    const s3 = scene("s3", LIME);
    const cam3 = mk(s3, "cam");
    const F3 = F(800, 196);
    const L3 = [
      [["Put", "t"], ["your", "t"], ["arrow", "i"]],
      [["spare", "t"], ["mark", "i"], ["change", "t"]],
      [["to", "t"], ["work.", "t"]],
    ];
    const W3 = [];
    L3.forEach((line, li) => {
      line.forEach(([w, kind]) => {
        const el = kind === "i" ? icon(cam3, w === "arrow" ? ARROW_R(FOREST, 13) : mark(FOREST), w === "arrow" ? 150 : 165) : txt(cam3, w, F3, FOREST);
        W3.push({ el, li, w, kind });
      });
    });
    const float3 = txt(cam3, "$", F(800, 150), FOREST);
    function renderS3(f) {
      s3.style.background = f < 120 ? LILAC : LIME;
      const gap = 44;
      let li = -1, x = 0, i = 0;
      W3.forEach((o) => {
        if (o.li !== li) { li = o.li; x = 70; }
        const w = o.el._w, t = 116 + i * 3.2 + (o.li === 2 ? 2 : 0);
        const a = spr(f, t, 5), c = ramp(f, t + 2, t + 12);
        const cy = 300 + o.li * 225 + (1 - a) * 50;
        place(o.el, x + w / 2, cy, 0.9 + 0.1 * a, f >= t ? 0.25 + 0.75 * c : 0, o.kind === "i" ? (1 - a) * -20 : 0);
        x += w + gap;
        i++;
      });
      // a stray glyph from the scatter drifts across and fades as the line completes
      const fa = ramp(f, 116, 150);
      place(float3, lerp(1750, 1560, eo(fa)), lerp(260, 200, eo(fa)), 1, f < 120 ? 0.9 : 0.35 * (1 - ramp(f, 120, 132)), lerp(10, -6, fa));
      // push in, then whip left
      const push = eio(ramp(f, 146, 166)), whip = ei(ramp(f, 160, 168));
      cam3.style.transformOrigin = "340px 520px";
      cam3.style.transform = `translateX(${px(-120 * push - 1700 * whip)}) scale(${(1 + 0.32 * push).toFixed(4)})`;
      cam3.style.filter = blurOf(whip * 26);
    }

    // =====================================================================================================
    // S4  outline construction letters of "grovr", then the wordmark
    const s4 = scene("s4", LIME);
    const BASE = 890, XT = 250; // baseline and x-height top
    const GLYPHS = (() => {
      const out = [];
      let x = 0;
      const add = (w, build) => { const g = build(x); g.x0 = x; g.w = w; out.push(g); x += w + 70; };
      const ring = (cx, cy, r) => {
        const k = 0.5523 * r;
        return {
          d: `M${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} Z`,
          nodes: [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]],
          handles: [[cx - k, cy - r, cx + k, cy - r], [cx + r, cy - k, cx + r, cy + k], [cx - k, cy + r, cx + k, cy + r], [cx - r, cy - k, cx - r, cy + k]],
        };
      };
      const merge = (...parts) => ({ paths: parts.map((p) => p.d), nodes: parts.flatMap((p) => p.nodes), handles: parts.flatMap((p) => p.handles || []) });
      const poly = (pts) => ({ d: "M" + pts.map((p) => p.join(" ")).join(" L") + " Z", nodes: pts });
      // g: a bowl, a stem on the right and a hooked tail below the baseline
      add(720, (x0) => {
        const cy = (XT + BASE) / 2, r = (BASE - XT) / 2;
        const o = ring(x0 + 330, cy, r), i = ring(x0 + 330, cy, r - 130);
        const sx = x0 + 530, ex = x0 + 660;
        const stem = { d: `M${sx} ${XT} L${ex} ${XT} L${ex} ${BASE + 80} C${ex} ${BASE + 300} ${x0 + 520} ${BASE + 380} ${x0 + 330} ${BASE + 380} C${x0 + 160} ${BASE + 380} ${x0 + 70} ${BASE + 300} ${x0 + 50} ${BASE + 210} L${x0 + 180} ${BASE + 190} C${x0 + 200} ${BASE + 240} ${x0 + 250} ${BASE + 260} ${x0 + 330} ${BASE + 260} C${x0 + 450} ${BASE + 260} ${sx} ${BASE + 200} ${sx} ${BASE + 80} Z`,
          nodes: [[sx, XT], [ex, XT], [ex, BASE + 80], [x0 + 330, BASE + 380], [x0 + 50, BASE + 210], [x0 + 180, BASE + 190], [x0 + 330, BASE + 260], [sx, BASE + 80]],
          handles: [[ex, BASE + 300, x0 + 520, BASE + 380], [x0 + 160, BASE + 380, x0 + 70, BASE + 300]] };
        return merge(o, i, stem);
      });
      // r: a stem with a shoulder
      const rr = (x0) => {
        const s = { d: `M${x0} ${XT} L${x0 + 130} ${XT} L${x0 + 130} ${BASE} L${x0} ${BASE} Z`, nodes: [[x0, XT], [x0 + 130, XT], [x0 + 130, BASE], [x0, BASE]] };
        const sh = { d: `M${x0 + 130} ${XT + 150} C${x0 + 180} ${XT + 40} ${x0 + 280} ${XT - 10} ${x0 + 420} ${XT} L${x0 + 420} ${XT + 130} C${x0 + 280} ${XT + 120} ${x0 + 180} ${XT + 190} ${x0 + 130} ${XT + 320} Z`,
          nodes: [[x0 + 130, XT + 150], [x0 + 420, XT], [x0 + 420, XT + 130], [x0 + 130, XT + 320]],
          handles: [[x0 + 180, XT + 40, x0 + 280, XT - 10], [x0 + 280, XT + 120, x0 + 180, XT + 190]] };
        return merge(s, sh);
      };
      add(430, rr);
      add(680, (x0) => { const cy = (XT + BASE) / 2, r = (BASE - XT) / 2; return merge(ring(x0 + 340, cy, r), ring(x0 + 340, cy, r - 130)); });
      add(640, (x0) => merge(poly([[x0, XT], [x0 + 140, XT], [x0 + 320, BASE - 190], [x0 + 500, XT], [x0 + 640, XT], [x0 + 390, BASE], [x0 + 250, BASE]])));
      add(430, rr);
      out.total = x - 70;
      return out;
    })();
    const svg4 = mk(s4, "abs", null);
    let s4html = `<svg width="${GLYPHS.total + 400}" height="1600" viewBox="-200 0 ${GLYPHS.total + 400} 1600" style="overflow:visible">`;
    GLYPHS.forEach((g, gi) => {
      g.handles.forEach((h, hi) => (s4html += `<g class="hd" data-g="${gi}" data-i="${hi}"><line x1="${h[0]}" y1="${h[1]}" x2="${h[2]}" y2="${h[3]}" stroke-width="1.6"/><circle cx="${h[0]}" cy="${h[1]}" r="6"/><circle cx="${h[2]}" cy="${h[3]}" r="6"/></g>`));
      g.paths.forEach((d) => (s4html += `<path class="op" data-g="${gi}" d="${d}" pathLength="1" fill="none" stroke-width="3" stroke-dasharray="1 1"/>`));
      g.nodes.forEach((n, ni) => (s4html += `<rect class="nd" data-g="${gi}" data-i="${ni}" x="${n[0] - 8}" y="${n[1] - 8}" width="16" height="16"/>`));
    });
    svg4.innerHTML = s4html + "</svg>";
    svg4.style.left = "-200px";
    const op4 = [...svg4.querySelectorAll(".op")], nd4 = [...svg4.querySelectorAll(".nd")], hd4 = [...svg4.querySelectorAll(".hd")];
    const wm4 = mk(s4, "abs", `${mark(LIME)}<span>grovr</span>`, `display:flex;align-items:center;gap:22px;font:${F(800, 150)};letter-spacing:-0.05em;color:${LIME}`);
    wm4.firstChild.style.cssText = "width:150px;height:150px;flex:none";
    Object.defineProperty(wm4, "_w", { get: () => 172 + measure("grovr", F(800, 150)) * 0.95 });
    wm4._h = 150;
    function renderS4(f) {
      const bg = f < 182 ? LIME : f < 214 ? FOREST : f < 236 ? LILAC : f < 248 ? FOREST : f < 257 ? FOREST : LIME;
      s4.style.background = bg;
      const ink = bg === FOREST ? LIME : FOREST;
      const letterOn = f < 249;
      svg4.style.display = letterOn ? "block" : "none";
      if (letterOn) {
        const camX = keys(f, [[168, 260], [190, -500], [214, -1300], [236, -2050], [249, -GLYPHS.total + 1700]]);
        const camY = keys(f, [[168, -40], [214, 20], [249, -60]]);
        svg4.style.transform = `translate(${px(camX)}, ${px(camY)})`;
        const prog = (gi) => clamp((1950 - (camX + GLYPHS[gi].x0)) / 650, 0, 1);
        op4.forEach((p) => { p.setAttribute("stroke", ink); p.style.strokeDashoffset = (1 - eo(prog(+p.dataset.g))).toFixed(4); });
        nd4.forEach((n) => { const g = +n.dataset.g, i = +n.dataset.i, on = prog(g) > 0.15 + (i % 8) * 0.07; n.setAttribute("fill", ink); n.style.display = on ? "" : "none"; });
        hd4.forEach((h) => { const g = +h.dataset.g, i = +h.dataset.i, on = prog(g) > 0.35 + i * 0.1; h.setAttribute("stroke", ink); h.setAttribute("fill", ink); h.style.display = on ? "" : "none"; });
      }
      const wOn = f >= 249;
      wm4.style.display = wOn ? "flex" : "none";
      if (wOn) {
        const s = keys(f, rel(249, SLAM_S));
        const bump = 1;
        place(wm4, 960 + 0.8 * (f - 249), 540 - 0.5 * (f - 249), s * bump * (1 + 0.0015 * (f - 249)) * 0.62, 1);
        wm4.style.color = f < 257 ? LIME : FOREST;
        wm4.querySelector("path").setAttribute("fill", f < 257 ? LIME : FOREST);
        wm4.style.filter = blurOf(f < 257 ? keys(f, rel(249, SLAM_B)) : 0);
      }
    }

    // =====================================================================================================
    // S5  "Say hello to" / "GREEN GAINS" / "FOR ↗ EVERYONE"
    const s5 = scene("s5", FOREST);
    const hello = ["Say", "hello", "to"].map((w) => txt(s5, w, F(500, 40), CREAM));
    const FG = F(800, 168);
    const green5 = txt(s5, "GREEN", FG, LIME), gains5 = txt(s5, "GAINS", FG, LIME);
    const sun5 = icon(s5, SUN(LIME), 140);
    const for5 = txt(s5, "FOR", F(800, 200), FOREST);
    const arr5 = icon(s5, ARROW(FOREST, 15), 170);
    const ev5 = letters(s5, "EVERYONE", F(800, 200), FOREST);
    function renderS5(f) {
      const lime = f >= 352;
      s5.style.background = lime ? LIME : FOREST;
      const ink = lime ? FOREST : CREAM;
      // the three small words pop apart, then close up into one line
      const join = eio(ramp(f, 310, 320)), hy = lerp(560, 420, eio(ramp(f, 314, 322)));
      const tight = measure("Say hello to", F(500, 40));
      const lineX = [0, measure("Say ", F(500, 40)), measure("Say hello ", F(500, 40))];
      const spreadX = [700, 960, 1210];
      hello.forEach((e, i) => {
        const t = 292 + i * 6, a = sprB(f, t, 5);
        let x = lerp(spreadX[i], 960 - tight / 2 + lineX[i] + e._w / 2, join), y = hy + (i === 1 ? 8 : 0) * (1 - join);
        let s = a * lerp(1, 0.7, join);
        if (lime) { const m = eio(ramp(f, 352, 362)); x = lerp(x, 1280 + (x - 960) * 0.8, m); y = lerp(y, 300, m); s *= 0.85; }
        if (f >= 384) x -= 2400 * ei(ramp(f, 384, 392));
        place(e, x, y, s, f >= t ? 1 : 0);
        e.style.color = lime ? FOREST : CREAM;
      });
      // GREEN GAINS slams; the colour flips lime → cream; the two words then pull apart
      const on = f >= 322 && !lime;
      [green5, gains5, sun5].forEach((e) => (e.style.display = on ? "block" : "none"));
      if (on) {
        const s = keys(f, rel(322, SLAM_S)), sp = spr(f, 345, 6);
        const gw = green5._w, aw = gains5._w, sw = 140, gap = 40, tot = gw + aw + sw + 2 * gap, l = 960 - tot / 2;
        const col = f < 327 ? LIME : CREAM;
        green5.style.color = gains5.style.color = col;
        place(green5, 960 + (l + gw / 2 - 960) * s + 60 * sp, 560 - 110 * sp, s, 1);
        place(gains5, 960 + (l + gw + gap + aw / 2 - 960) * s - 160 * sp, 560 + 120 * sp, s, 1);
        place(sun5, 960 + (l + gw + aw + 2 * gap + sw / 2 - 960) * s + 120 * sp, 560 - 110 * sp, s, 1, (f - 322) * 3);
        [green5, gains5, sun5].forEach((e) => (e.style.filter = blurOf(keys(f, rel(322, SLAM_B)))));
      }
      [for5, arr5, ...ev5].forEach((e) => (e.style.display = lime ? "block" : "none"));
      if (lime) {
        const out = ei(ramp(f, 384, 392));
        place(for5, 80 + for5._w / 2 - 600 * out, 360 + (1 - spr(f, 352, 5)) * 80, 1);
        const slide = lerp(380, 0, eo(ramp(f, 352, 372))) - 2600 * out;
        place(arr5, 100 + 85 + slide, 600 + (1 - spr(f, 354, 5)) * 160, spr(f, 354, 5), 1);
        ev5.forEach((e, j) => {
          const t = 355 + j * 1.6, a = spr(f, t, 5);
          const dy = (1 - a) * 230;
          place(e, 310 + e._x + slide, 590 + dy, 1, f >= t ? 1 : 0);
          e.style.clipPath = `inset(-20px -20px ${px(Math.max(0, dy - 4))} -20px)`;
        });
        const evR = 310 + measure("EVERYONE", F(800, 200)) + slide;
        sun5.style.display = "block";
        sun5.firstChild.querySelectorAll("*").forEach((n) => { n.getAttribute("fill") !== "none" && n.setAttribute("fill", FOREST); n.getAttribute("stroke") && n.setAttribute("stroke", FOREST); });
        const sa = eio(ramp(f, 360, 380));
        place(sun5, lerp(evR + 110, 1640, sa), lerp(590, 340, Math.sin(sa * Math.PI / 2)), 0.9, 1, -(f - 352) * 6);
        sun5.style.filter = "none";
      } else {
        sun5.firstChild.querySelectorAll("*").forEach((n) => { n.getAttribute("fill") !== "none" && n.setAttribute("fill", f < 327 ? LIME : CREAM); n.getAttribute("stroke") && n.setAttribute("stroke", f < 327 ? LIME : CREAM); });
      }
    }

    // =====================================================================================================
    // S6  brand mockups: quick cuts, a cascade past "Meet the sprout", collapse to the lime card
    const s6 = scene("s6", "#EFEBE1");
    const grid = (c) => `background-color:${LILAC};background-image:linear-gradient(${c} 1.5px, transparent 1.5px),linear-gradient(90deg, ${c} 1.5px, transparent 1.5px);background-size:62px 62px`;
    const tile = (bg, inner, s = 150) => `<div style="width:${s}px;height:${s}px;border-radius:${s * 0.24}px;background:${bg};display:grid;place-items:center;box-shadow:0 10px 24px rgba(0,0,0,.25)">${inner}</div>`;
    const MOCKS = [
      `<div style="position:absolute;inset:0;${grid("rgba(15,43,33,.12)")}"></div><svg viewBox="0 0 100 100" style="position:absolute;left:330px;top:140px;width:340px;height:340px;overflow:visible"><circle cx="27" cy="45" r="34" fill="none" stroke="rgba(15,43,33,.25)" stroke-width=".5"/><circle cx="73" cy="28" r="34" fill="none" stroke="rgba(15,43,33,.25)" stroke-width=".5"/><path d="${MARK_D}" fill="none" stroke="${FOREST}" stroke-width=".8"/></svg>`,
      `<div style="position:absolute;inset:0;background:radial-gradient(circle at 70% 30%, #2a4a3c, ${NIGHT})"></div><div style="position:absolute;left:150px;top:200px;width:700px;height:220px;border-radius:56px;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.3);display:flex;gap:50px;align-items:center;justify-content:center">${tile("#cfd2cf", '<div style="width:80px;height:80px;background:radial-gradient(circle,#555 28%,transparent 30%) 0 0/26px 26px"></div>')}${tile(LIME, mark(FOREST, 'width="100" height="100"'), 170)}${tile(LILAC, `<svg width="90" height="90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="${FOREST}" stroke-width="8"/><path d="M33 58 Q50 74 67 58" fill="none" stroke="${FOREST}" stroke-width="8" stroke-linecap="round"/></svg>`)}</div>`,
      `<div style="position:absolute;inset:0;background:${STONE}"></div><div style="position:absolute;left:80px;top:210px;width:840px;height:200px;border-radius:44px;background:rgba(255,255,255,.92);display:flex;align-items:center;gap:30px;padding:0 40px;box-shadow:0 20px 40px rgba(0,0,0,.12)">${tile(LIME, mark(FOREST, 'width="76" height="76"'), 120)}<div style="font:700 44px Inter;color:${FOREST}">grovr<div style="font:400 34px Inter;opacity:.7;margin-top:8px">You just planted tree #14</div></div></div>`,
      `<div style="position:absolute;inset:0;background:linear-gradient(90deg,#1c2722,#2c3a33 50%,#1c2722)"></div><div style="position:absolute;left:300px;top:60px;width:400px;height:500px;background:${LIME};box-shadow:0 20px 40px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font:800 64px/0.95 Inter;color:${FOREST};letter-spacing:-0.04em;text-align:center">${mark(FOREST, 'width="90" height="90"')}GROW<br>WHAT<br>MATTERS</div>`,
      `<div style="position:absolute;inset:0;background:#E6DFCE"></div><svg viewBox="0 0 100 100" style="position:absolute;left:300px;top:40px;width:400px;height:540px" preserveAspectRatio="none"><path d="M35 30 Q35 5 50 5 Q65 5 65 30" fill="none" stroke="#bfb08e" stroke-width="3"/><path d="M18 28 L82 28 L90 98 L10 98 Z" fill="#f3ead6"/></svg><div style="position:absolute;left:420px;top:300px;width:160px;height:160px">${mark(FOREST, 'width="160" height="160"')}</div>`,
      `<div style="position:absolute;inset:0;background:${CORAL}"></div><svg viewBox="0 0 200 200" style="position:absolute;left:310px;top:120px;width:380px;height:380px"><defs><path id="cir" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0"/></defs><text font-family="Inter" font-weight="800" font-size="17" fill="#7a2a14" letter-spacing="2"><textPath href="#cir">GROVR + SPARE CHANGE + GREEN FUTURE +</textPath></text><path d="${MARK_D}" fill="#7a2a14" transform="translate(62 62) scale(.76)"/></svg>`,
      `<div style="position:absolute;inset:0;background:${STONE}"></div><svg width="0" height="0"><defs><linearGradient id="gj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e9a8"/><stop offset=".45" stop-color="#b5a24a"/><stop offset="1" stop-color="#5d5320"/></linearGradient></defs></svg>${[[160, 160, -18, 220], [430, 60, 8, 240], [660, 250, 24, 230]].map(([x, y, r, s]) => `<svg viewBox="0 0 100 100" style="position:absolute;left:${x}px;top:${y}px;width:${s}px;height:${s}px;transform:rotate(${r}deg);filter:drop-shadow(8px 14px 10px rgba(0,0,0,.25))"><path d="${MARK_D}" fill="url(#gj)"/></svg>`).join("")}`,
      `<div style="position:absolute;inset:0;background:#f4f3ef"></div><div style="position:absolute;left:0;top:0;width:150px;height:620px;background:${NIGHT}"></div><div style="position:absolute;left:240px;top:60px;font:800 52px Inter;color:#9aa19c">Apps</div><div style="position:absolute;left:240px;top:170px;width:300px;height:300px;border-radius:72px;background:${LIME};display:grid;place-items:center;box-shadow:0 20px 40px rgba(15,43,33,.2)">${mark(FOREST, 'width="190" height="190"')}</div><div style="position:absolute;left:620px;top:200px;width:420px;height:110px;border-radius:24px;background:#fff;font:500 44px Inter;color:#b5b8b3;padding:30px 36px">Find</div>`,
    ];
    const mocks = MOCKS.map((h) => mk(s6, "mock", h));
    const nm6 = txt(s6, "Meet the sprout", F(700, 64), FOREST);
    const stack6 = [STONE, LILAC, LIME].map((c, i) => mk(s6, "mock", i === 2 ? `<div style="position:absolute;inset:0;display:grid;place-items:center">${mark(FOREST, 'width="220" height="220"')}</div>` : "", `background:${c}`));
    function renderS6(f) {
      const collapse = f >= 466;
      s6.style.background = collapse ? NIGHT : "#EFEBE1";
      mocks.forEach((m, i) => {
        let on = false;
        if (f < 440) {
          const t = 392 + i * 6;
          on = f >= t && f < t + 6;
          if (on) { const lt = f - t; m.style.transform = `translate(460px, 230px) scale(${(1.62 + 0.012 * lt + 0.08 * (1 - spr(lt, 0, 2))).toFixed(4)})`; m.style.zIndex = 1; m.style.boxShadow = "none"; m.style.borderRadius = "0px"; }
        } else if (!collapse) {
          const lt = f - 434 - (7 - i) * 1.6;
          on = lt >= 0;
          if (on) {
            const u = keys(lt, [[0, 0], [7, 0.44], [18, 0.56], [24, 0.75]]);
            const x = lerp(1800, -500, u), y = lerp(-330, 950, u) + (i % 2) * 40;
            m.style.transform = `translate(${px(x - 500)}, ${px(y - 310)}) scale(.4) rotate(${(-4 + (i % 3) * 3).toFixed(1)}deg)`;
            m.style.zIndex = 10 + i;
            m.style.boxShadow = "";
            m.style.borderRadius = "";
          }
        }
        m.style.display = on ? "block" : "none";
      });
      const tOn = f >= 446 && !collapse;
      nm6.style.display = tOn ? "block" : "none";
      nm6.style.zIndex = 50;
      if (tOn) { place(nm6, 1240, 690, sprB(f, 446, 5), 1); nm6.style.color = f < 450 ? "#9bc43a" : FOREST; }
      stack6.forEach((m, i) => {
        m.style.display = collapse ? "block" : "none";
        if (!collapse) return;
        const k = eio(ramp(f, 466, 476)), s = lerp(1.15, 0.36, k) * (1 + 0.04 * (2 - i) * (1 - k));
        m.style.zIndex = 20 + i;
        m.style.transform = `translate(${px(460 + (2 - i) * lerp(70, 18, k))}, ${px(230 - (2 - i) * lerp(10, 4, k))}) scale(${s.toFixed(4)})`;
      });
    }

    // =====================================================================================================
    // S7  "GROW / WHAT (mark) / MATTERS." then the ring of small words around a spinning coin
    const s7 = scene("s7", NIGHT);
    const F7 = F(800, 180);
    const L7 = ["GROW", "WHAT", "MATTERS."].map((w) => { const box = mk(s7, "abs", null, "overflow:hidden;height:200px;width:1900px"); const t = txt(box, w, F7, CREAM); return { box, t }; });
    const m7 = icon(L7[1].box, mark(LIME), 150);
    const ringWords = [["GROW", 960, 330], ["WHAT", 700, 430], ["WHAT", 1220, 430], ["MATTERS.", 620, 590], ["MATTERS.", 1300, 590]].map(([w, x, y]) => ({ el: txt(s7, w, F(700, 30), CREAM), x, y }));
    const coin7 = makeCoin(s7);
    function renderS7(f) {
      const shrink = eio(ramp(f, 503, 512));
      L7.forEach((o, i) => {
        const t = 478 + i * 4, a = spr(f, t, 6);
        o.box.style.transform = `translate(70px, ${px(150 + i * 215)})`;
        o.box.style.transformOrigin = `${px(890 - 70)} ${px(540 - 150 - i * 215)}`;
        o.box.style.transform += ` scale(${lerp(1, 0.16, shrink).toFixed(4)})`;
        o.box.style.opacity = (1 - ramp(f, 504, 508)).toFixed(3);
        place(o.t, o.t._w / 2, 100 + (1 - a) * 210, 1, 1);
        o.t.style.color = f < t + 5 ? LIME : CREAM;
      });
      place(m7, L7[1].t._w + 40 + 75, 100 + (1 - spr(f, 487, 6)) * 210, spr(f, 487, 6), 1, (1 - spr(f, 487, 6)) * -30);
      ringWords.forEach((r, i) => {
        const t = 508 + i * 0.8, a = spr(f, t, 5), dr = (f - 508) * 0.5;
        const dx = r.x - 960, dy = r.y - 470, m = Math.hypot(dx, dy) || 1;
        place(r.el, r.x + (dx / m) * dr, r.y + (dy / m) * dr, a, f >= t ? 1 : 0);
      });
      const ca = spr(f, 506, 7), zoom = ei(ramp(f, 532, 540));
      drawCoin(coin7, 960, 470 + 300 * zoom, lerp(210 * ca, 1400, zoom), spinN((f - 506) * 0.24, 0.1), f >= 506 ? 1 : 0);
    }

    // =====================================================================================================
    // S8  coins: rush in, chain into an arc, close into a ring inside spiral text; big coin with curved text
    const s8 = scene("s8", NIGHT);
    const NC = 24;
    const coins8 = Array.from({ length: NC }, () => makeCoin(s8));
    const spiral = mk(s8, "abs", null, "width:1920px;height:1080px;z-index:9000");
    const SPT = "small change grows deep roots + ";
    const RINGS = [360, 460, 570, 690, 820, 960].map((r, ri) => {
      const fs = 26 + ri * 4, font = F(600, fs), step = (measure("m", font) * 0.82) / r;
      const n = Math.floor((2 * Math.PI) / step);
      const chars = Array.from({ length: n }, (_, k) => { const c = SPT[(k + ri * 7) % SPT.length]; const e = txt(spiral, c, font, c === "+" ? LIME : CREAM); return e; });
      return { r, chars, dir: ri % 2 ? -1 : 1, a0: ri * 0.7 };
    });
    const bigCoin = makeCoin(s8);
    const CT = "watch it grow", FCT = F(700, 150);
    const curved = letters(s8, CT, FCT, CREAM);
    const carr = icon(s8, ARROW_R(LIME, 12), 130);
    // Rx(a) then Rz(b)
    const rot3 = (v, ax, az) => {
      const [x, y, z] = v;
      const y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax);
      return [x * Math.cos(az) - y1 * Math.sin(az), x * Math.sin(az) + y1 * Math.cos(az), z1];
    };
    function renderS8(f) {
      const P = 1800;
      const big = f >= 632;
      // the coin system: an open arc that closes into a ring while it turns
      coins8.forEach((el, i) => {
        if (big) { el.style.display = "none"; return; }
        const u = i / (NC - 1);
        let cx, cy, d, n, z = 0, o = 1;
        if (f < 556) {
          // rush: a loose stack of big coins sliding across, each a beat behind the last
          const j = i % 6, lt = f - 540 - j * 1.4;
          if (i >= 6 || lt < 0) { el.style.display = "none"; return; }
          const x = lerp(2300, 760 + j * 110, eo(ramp(lt, 0, 10))), y = 560 + j * 18;
          cx = x; cy = y; d = 560; z = -j * 10; n = spinN(0.45 + j * 0.07 + lt * 0.03, 0.2);
        } else {
          const k = eio(ramp(f, 556, 594));
          const span = lerp(2.2, 2 * Math.PI * (NC - 1) / NC, k);
          const R = lerp(620, 300, eio(ramp(f, 560, 598)));
          const spin = (f - 556) * 0.03;
          const a = -span / 2 + u * span + spin + Math.PI / 2;
          const tilt = lerp(1.05, 0.38, eio(ramp(f, 566, 600))), roll = lerp(-0.5, 0.15, eio(ramp(f, 556, 600)));
          const p = rot3([R * Math.cos(a), 0, R * Math.sin(a)], tilt, roll);
          const tg = [-Math.sin(a), 0, Math.cos(a)], up = [0, 1, 0];
          const lean = 0.9; // coins lean out of the ring plane so their faces show
          const nn = rot3([tg[0] * Math.cos(lean) + up[0] * Math.sin(lean), tg[1] * Math.cos(lean) + up[1] * Math.sin(lean), tg[2] * Math.cos(lean) + up[2] * Math.sin(lean)], tilt, roll);
          const pz = p[2] + 300, sc = P / (P + pz);
          cx = 960 + p[0] * sc; cy = 540 + p[1] * sc + lerp(80, 0, k); d = lerp(330, 165, eio(ramp(f, 560, 598))) * sc; z = pz; n = [nn[0], nn[1], -nn[2]];
          o = ramp(f, 556, 558);
        }
        drawCoin(el, cx, cy, d, n, o, z);
      });
      // spiral text wraps the ring, typing outward ring by ring
      spiral.style.display = f >= 596 && !big ? "block" : "none";
      if (f >= 596 && !big) {
        RINGS.forEach((rg, ri) => {
          const reveal = (f - 596 - ri * 2) * 7, n = rg.chars.length;
          rg.chars.forEach((e, k) => {
            const on = k < reveal;
            e.style.display = on ? "block" : "none";
            if (!on) return;
            const a = rg.a0 + rg.dir * (f - 596) * 0.012 + (k / n) * 2 * Math.PI;
            const r = rg.r * lerp(0.8, 1, eo(ramp(f, 596, 612)));
            place(e, 960 + r * Math.cos(a), 540 + r * Math.sin(a), 1, 1, (a * 180) / Math.PI + 90);
          });
        });
      }
      // the big coin rises, the curved line swings over it
      [bigCoin, carr, ...curved].forEach((e) => (e.style.display = big ? "block" : "none"));
      if (big) {
        const a = eo(ramp(f, 632, 646));
        drawCoin(bigCoin, 960, lerp(1500, 1120, a), 1250, spinN(-0.25 + (f - 632) * 0.006, 0.2), 1);
        const R = 900, C = [960, 1300];
        const sw = keys(f, [[632, -95], [640, -12], [650, 0]]);
        const total = measure(CT, FCT) + 170, span = total / R;
        let acc = 0;
        curved.forEach((e, k) => {
          const w = measure(CT[k], FCT), mid = measure(CT.slice(0, k), FCT) + w / 2;
          const ang = -Math.PI / 2 - span / 2 + mid / R + (sw * Math.PI) / 180;
          place(e, C[0] + R * Math.cos(ang), C[1] + R * Math.sin(ang), 1, 1, (ang * 180) / Math.PI + 90);
          acc = mid;
        });
        const angA = -Math.PI / 2 + span / 2 - 60 / R + (sw * Math.PI) / 180;
        place(carr, C[0] + R * Math.cos(angA), C[1] + R * Math.sin(angA), 1, 1, (angA * 180) / Math.PI + 90);
      }
    }

    // =====================================================================================================
    // S9  "MAKE EVERY / CENT COUNT" with three flipping coins
    const s9 = scene("s9", CREAM);
    const F9 = F(800, 96);
    const t9 = [["MAKE", 960, 200], ["EVERY", 960, 290], ["CENT", 1060, 800], ["COUNT", 1060, 890]].map(([w, x, y]) => ({ el: txt(s9, w, F9, FOREST), x, y }));
    const coins9 = [0, 1, 2].map(() => makeCoin(s9));
    function renderS9(f) {
      const out = eio(ramp(f, 690, 700)), gs = lerp(1, 0.86, out);
      t9.forEach((o, i) => {
        const t = 650 + i * 2, a = spr(f, t, 6), dir = i < 2 ? -1 : 1;
        place(o.el, 960 + (o.x - 960) * gs, 540 + (o.y - 540 + dir * (1 - a) * 120) * gs, gs, f >= t ? 1 : 0);
      });
      coins9.forEach((el, i) => {
        const a = spr(f, 652 + i * 2, 7);
        const x = lerp(960 + (i - 1) * 380, 960 + (i - 1) * 200, out);
        drawCoin(el, x, 545, 280 * a * gs, spinN((f - 650) * (0.2 + i * 0.03) + i * 1.3, 0.08), f >= 652 + i * 2 ? 1 : 0, i === 1 ? -10 : 0);
      });
    }

    // =====================================================================================================
    // S10  "Round up. / Invest. / Plant." with the stepping pill
    const s10 = scene("s10", STONE);
    const F10 = F(800, 140);
    const pill = mk(s10, "abs", null, `background:${LIME};border-radius:90px;height:170px`);
    const W10 = ["Round up.", "Invest.", "Plant."].map((w, i) => ({ el: txt(s10, w, F10, FOREST), n: txt(s10, String(i + 1), F(600, 20), FOREST) }));
    const side10 = mk(s10, "abs", "ONE HABIT,<br>REAL IMPACT.", `font:${F(800, 22)};line-height:1.15;color:${FOREST};text-align:center`);
    function renderS10(f) {
      const comp = eio(ramp(f, 721, 728));
      const ys = [320, 540, 760].map((y) => lerp(y, 540 + (y - 540) * 0.72, comp));
      const idx = f < 708 ? 0 : f < 716 ? 1 : 2;
      const pk = (a, b, t) => lerp(a, b, spr(f, t, 4));
      const py = f < 708 ? ys[0] : f < 716 ? pk(ys[0], ys[1], 708) : pk(ys[1], ys[2], 716);
      const ww = W10.map((o) => o.el._w);
      const pw = f < 708 ? ww[0] : f < 716 ? pk(ww[0], ww[1], 708) : pk(ww[1], ww[2], 716);
      const pa = spr(f, 700, 5);
      pill.style.width = px((pw + 90) * pa);
      pill.style.transform = `translate(${px(285)}, ${px(py - 85)}) scaleY(${(1 - 0.1 * comp).toFixed(3)})`;
      W10.forEach((o, i) => {
        const a = spr(f, 700 + i * 1.5, 5);
        place(o.el, 330 + o.el._w / 2, ys[i] + (1 - a) * 60, lerp(1, 0.86, comp), 1);
        place(o.n, 300, ys[i] - 40, 1, 0.7);
        o.el.style.transformOrigin = "0% 50%";
      });
      side10.style.transform = `translate(1560px, ${px(510)})`;
      side10.style.opacity = ramp(f, 702, 706).toFixed(2);
    }

    // =====================================================================================================
    // S11  the feature list
    const s11 = scene("s11", NIGHT);
    const ROWS = [["Round up every purchase", LIME], ["Pick a climate portfolio", LILAC], ["Plant a tree every month", "#8fd6a8"], ["Track CO2 you avoided", STONE], ["Set a weekly goal", CORAL], ["Invite a friend", LIME], ["Withdraw any time", LILAC]];
    const rows11 = ROWS.map(([l, c]) => mk(s11, "row", `<i style="background:${c}">${mark(FOREST)}</i>${l}<b>›</b>`));
    function renderS11(f) {
      const sc = keys(f, [[728, 1.2], [733, 2], [740, 2], [745, 3], [751, 3], [756, 2.4], [762, 2.4]]);
      rows11.forEach((r, i) => {
        const d = i - sc, ad = Math.abs(d);
        const hl = Math.max(0, 1 - ad * 1.6);
        r.style.background = mix("#2a332f", "#f7f6f2", hl);
        r.style.color = mix("#9aa39e", FOREST, hl);
        const s = lerp(0.82, 1.08, hl) * (1 - 0.05 * Math.min(ad, 3));
        r.style.transform = `translate(${px(960 - 380)}, ${px(540 - 48 + d * 128)}) scale(${s.toFixed(4)})`;
        r.style.opacity = clamp(1.2 - ad * 0.28, 0, 1).toFixed(3);
      });
    }

    // =====================================================================================================
    // S12  the portfolio screen
    const s12 = scene("s12", STONE);
    const phone = mk(s12, null, null);
    phone.id = "phone";
    const pt = (html, x, y, font, extra = "") => mk(phone, "pt", html, `left:${x}px;top:${y}px;font:${font};${extra}`);
    pt("9:41", 44, 30, F(600, 22));
    pt("Portfolio", 44, 120, F(500, 26), "opacity:.6");
    const bal = pt("€0", 44, 160, F(800, 62), "letter-spacing:-0.03em");
    const gain = pt("+ €898.44 this year", 46, 240, F(600, 22), "color:#3b8a3e");
    const chart = mk(phone, "pt", `<svg width="520" height="220" viewBox="0 0 520 220"><path id="cpath" d="M0 180 L40 170 L80 176 L120 150 L160 156 L200 128 L240 134 L280 104 L320 112 L360 80 L400 88 L440 54 L480 60 L520 30" fill="none" stroke="${FOREST}" stroke-width="4" pathLength="1" stroke-dasharray="1 1"/></svg>`, "left:0;top:290px");
    const btns = mk(phone, "pt", `<span style="display:inline-block;padding:16px 44px;border-radius:40px;background:${FOREST};color:${CREAM};margin-right:14px">Add</span><span style="display:inline-block;padding:16px 36px;border-radius:40px;background:${FOREST};color:${CREAM}">Withdraw</span>`, `left:44px;top:540px;font:${F(600, 24)}`);
    const imp = mk(phone, "pt", `<div style="font:${F(700, 26)};margin-bottom:18px">Impact</div><div style="display:flex;gap:16px">${[["Trees planted", "14"], ["CO2 avoided", "312 kg"]].map(([a, b], i) => `<div style="width:200px;height:150px;border-radius:24px;background:${i ? LILAC : LIME};padding:20px"><div style="font:${F(500, 18)};opacity:.7">${a}</div><div style="font:${F(800, 40)};margin-top:30px">${b}</div></div>`).join("")}</div>`, "left:44px;top:650px");
    const nav = mk(phone, "pt", [0, 1, 2, 3].map((i) => `<i style="display:inline-block;width:26px;height:26px;border-radius:8px;margin-right:84px;background:${i ? "#c9cbc6" : FOREST}"></i>`).join(""), "left:62px;top:990px");
    function renderS12(f) {
      const a = spr(f, 762, 9);
      const s = lerp(0.5, 0.86, a) * lerp(1, 1.18, eio(ramp(f, 800, 816)));
      const y = lerp(640, 540, a) - 200 * eio(ramp(f, 800, 816));
      phone.style.transform = `translate(${px(960 - 260)}, ${px(y - 530)}) scale(${s.toFixed(4)})`;
      const c = eio(ramp(f, 768, 802)), v = lerp(8420.2, 9318.64, c);
      bal.textContent = "€" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      bal.style.opacity = ramp(f, 765, 768).toFixed(2);
      gain.style.opacity = ramp(f, 772, 776).toFixed(2);
      chart.querySelector("path").style.strokeDashoffset = (1 - eio(ramp(f, 770, 800))).toFixed(4);
      btns.style.opacity = ramp(f, 776, 780).toFixed(2);
      imp.style.opacity = ramp(f, 782, 788).toFixed(2);
      imp.style.transform = `translateY(${px(30 * (1 - eo(ramp(f, 782, 790))))})`;
      nav.style.opacity = ramp(f, 786, 790).toFixed(2);
    }

    // =====================================================================================================
    // S13  two poster cards
    const s13 = scene("s13", NIGHT);
    const p1 = mk(s13, "abs", `<div style="position:absolute;left:0;top:0;width:330px;height:420px;background:${CREAM}"></div><div style="position:absolute;left:330px;top:0;width:330px;height:420px;background:${LIME}"></div><div class="pt1" style="position:absolute;left:30px;top:34px;font:${F(800, 86)};line-height:.9;letter-spacing:-0.03em;color:${FOREST}">BUILT<br>FOR THE<br>LONG<br>GAME.</div><div style="position:absolute;left:30px;bottom:24px;display:flex;align-items:center;gap:6px;font:${F(800, 18)};color:${FOREST}">${mark(FOREST, 'width="20" height="20"')}grovr</div>`, "width:660px;height:420px;overflow:hidden");
    const flower = Array.from({ length: 11 }, () => makeCoin(p1));
    const p2 = mk(s13, "abs", `<div style="position:absolute;inset:0;background:${STONE}"></div>`, "width:560px;height:560px;overflow:hidden");
    const p2lines = ["ROUND UP", "EVERY", "RECEIPT."].map((w) => txt(p2, w, F(800, 64), FOREST));
    const pile = Array.from({ length: 4 }, () => makeCoin(p2));
    function renderS13(f) {
      const one = f < 840;
      p1.style.display = one ? "block" : "none";
      p2.style.display = one ? "none" : "block";
      if (one) {
        const s = lerp(1.05, 1.12, ramp(f, 816, 840)) * (0.9 + 0.1 * spr(f, 816, 4));
        p1.style.transform = `translate(${px(960 - 330)}, ${px(540 - 210)}) scale(${(s * 1.3).toFixed(4)})`;
        flower.forEach((el, i) => {
          if (i === 10) { drawCoin(el, 495, 200, 92, [0, 0, 1], 1, -50); return; }
          const a = (i / 10) * 2 * Math.PI + (f - 816) * 0.03;
          drawCoin(el, 495 + 78 * Math.cos(a), 200 + 78 * Math.sin(a), 82, [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.84], 1, 0);
        });
      } else {
        const s = lerp(1.0, 1.08, ramp(f, 840, 866)) * (0.9 + 0.1 * spr(f, 840, 4));
        p2.style.transform = `translate(${px(960 - 280)}, ${px(540 - 280)}) scale(${(s * 1.3).toFixed(4)})`;
        p2lines.forEach((e, i) => {
          place(e, 280, 80 + i * 66, 1, 1);
          e.style.color = f >= 844 + i * 4 ? FOREST : "#9bc43a";
        });
        pile.forEach((el, i) => drawCoin(el, 170 + i * 75, 430 + (i % 2) * 30, 260, [0.6 - i * 0.25, -0.3, 0.75], 1, i));
      }
    }

    // =====================================================================================================
    // S14  "Spend it. / Plant it." over 3D cards
    const s14 = scene("s14", STONE);
    const persp = mk(s14, "persp");
    const cardHTML = `<div class="chip"></div><div class="wm">${mark(FOREST)}grovr</div><div class="num">•••• 4021</div><div class="net">debit</div>`;
    const cardA = mk(persp, "card", cardHTML), cardB = mk(persp, "card", cardHTML);
    const t14 = ["Spend", "it.", "Plant", "it."].map((w) => txt(s14, w, F(800, 150), FOREST));
    function renderS14(f) {
      const close = eio(ramp(f, 890, 902));
      const drift = (f - 866) * 0.25;
      const ry = lerp(26, 40, close) + drift * 0.3, z = lerp(0, 380, close);
      cardA.style.transform = `translate3d(${px(lerp(240, -40, close) - drift * 2)}, ${px(lerp(300, 160, close))}, ${px(z)}) rotateY(${ry.toFixed(2)}deg) rotateX(10deg) rotateZ(-10deg)`;
      cardB.style.transform = `translate3d(${px(lerp(980, 1060, close) - drift * 2)}, ${px(lerp(240, 140, close))}, ${px(z - 120)}) rotateY(${(-ry - 6).toFixed(2)}deg) rotateX(8deg) rotateZ(6deg)`;
      const tOut = ramp(f, 886, 890);
      t14.forEach((e, i) => {
        const t = 868 + i * 3, a = spr(f, t, 5);
        const line = Math.floor(i / 2);
        place(e, (i % 2 ? 90 + measure(i < 2 ? "Spend " : "Plant ", F(800, 150)) : 90) + e._w / 2, 190 + line * 160 + (1 - a) * 70, 1, f >= t ? 1 - tOut : 0);
        e.style.color = i >= 2 && f < t + 6 ? "#6f9a1c" : FOREST;
        e.style.zIndex = 20;
      });
    }

    // =====================================================================================================
    // S15  "INVEST FOR" / arched "GOOD"
    const s15 = scene("s15", FOREST);
    const sw15 = ["INVEST", "FOR"].map((w) => txt(s15, w, F(700, 30), LIME));
    const FGD = F(800, 260);
    const good = letters(s15, "GOOD", FGD, LIME);
    function renderS15(f) {
      const up = eio(ramp(f, 934, 942)), out = eio(ramp(f, 964, 972));
      const lw = measure("INVEST FOR", F(700, 30)), l = 960 - lw / 2;
      sw15.forEach((e, i) => {
        const t = 918 + i * 6, a = sprB(f, t, 5);
        const x = l + (i ? measure("INVEST ", F(700, 30)) : 0) + e._w / 2;
        place(e, 960 + (x - 960) * lerp(1, 0.6, out), lerp(lerp(540, 370, up), 470, out) + (1 - a) * 30, a * lerp(1, 0.6, out), f >= t ? 1 : 0);
      });
      const ga = spr(f, 936, 7), bend = spr(f, 938, 8);
      const gw = measure("GOOD", FGD), R = 1 / lerp(1 / 9000, 1 / 1150, bend); // bend in curvature so the overshoot stays sane
      const s = lerp(0.35, 1, ga) * lerp(1, 0.5, out);
      good.forEach((e, k) => {
        const off = (e._x - gw / 2) * s, ang = off / R - Math.PI / 2;
        const wob = 0;
        const cy = lerp(560, 500, out) + R;
        place(e, 960 + R * Math.cos(ang), cy + R * Math.sin(ang), s, f >= 936 ? 1 : 0, (ang + Math.PI / 2) * 180 / Math.PI + wob);
      });
    }

    // =====================================================================================================
    // S16  end card
    const s16 = scene("s16", LIME);
    const m16 = icon(s16, mark(FOREST), 150);
    const clip16 = mk(s16, "abs", null, "overflow:hidden;height:170px");
    const w16 = txt(clip16, "grovr", F(800, 150), FOREST);
    w16.style.letterSpacing = "-0.05em";
    const disc = mk(s16, "abs", "Capital at risk. The value of investments can go down as well as up, and you may get back less than you put in.<br>grovr is a fictional brand made for this demo; tree and carbon figures are illustrative.", `width:1000px;text-align:center;font:${F(500, 15)};line-height:1.45;color:rgba(15,43,33,.55);white-space:normal`);
    function renderS16(f) {
      const roll = spr(f, 972, 9), rev = eo(ramp(f, 986, 1000));
      const ww = measure("grovr", F(800, 150)) * 0.95, gap = 26, tot = 150 + gap + ww * rev;
      const mx = lerp(-200, 960 - tot / 2 + 75, roll);
      const g = 1 + 0.03 * eio(ramp(f, 1000, 1062));
      place(m16, 960 + (mx - 960) * g, 540, g * (0.6 + 0.4 * roll), 1, lerp(-300, 0, roll));
      const cx = 960 + (mx + 75 + gap - 960) * g;
      clip16.style.width = px(ww * rev + 10);
      clip16.style.transformOrigin = "0 50%";
      clip16.style.transform = `translate(${px(cx)}, ${px(540 - 88)}) scale(${g.toFixed(4)})`;
      w16.style.transform = `translate(${px(-ww * (1 - rev))}, 4px)`;
      disc.style.transform = "translate(460px, 960px)";
      disc.style.opacity = ramp(f, 994, 1006).toFixed(2);
    }

    // ---------- frame ----------
    const SC = [
      [s1, 0, 68, renderS1], [s2, 68, 122, renderS2], [s3, 116, 168, renderS3], [s4, 168, 290, renderS4], [s5, 290, 392, renderS5],
      [s6, 392, 478, renderS6], [s7, 478, 540, renderS7], [s8, 540, 650, renderS8], [s9, 650, 700, renderS9], [s10, 700, 728, renderS10],
      [s11, 728, 762, renderS11], [s12, 762, 816, renderS12], [s13, 816, 866, renderS13], [s14, 866, 916, renderS14], [s15, 916, 972, renderS15],
      [s16, 972, FRAMES + 1, renderS16],
    ];
    function render(t) {
      const f = clamp(t, 0, FRAMES - 0.001);
      // later scenes sit on top where two overlap
      let top = null;
      SC.forEach(([el, a, b]) => { if (f >= a && f < b) top = el; });
      SC.forEach(([el, a, b, fn], i) => {
        const on = f >= a && f < b && (el === top || (el === s2 && top === s3 && f < 120));
        vis(el, on);
        el.style.zIndex = String(i);
        if (on) fn(f);
      });
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v + SUB); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { mcache = {}; render(R0._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
