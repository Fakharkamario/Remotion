// "做股票投资呢，你只要能避开这5种公司，你的投资绩效绝对会高于90%的人。" — 7 s, 30 fps (210 frames).
// The take runs unbroken under the whole clip (the voice never jumps). Beats cut hard, as both references do.
//
//   0–47     A-roll, framed left, pushing in. 做 / 股票投资 / 呢 stand on the wall BEHIND him (his cutout is
//            layered over them); the key word flashes purple -> gold -> ink like the reference's DRAFTKINGS.
//   48–69    charcoal. 你只要 typed huge, the camera chasing the caret so the line runs off the left;
//            cut wide on a grey panel frame, 能避开 typed, a yellow -> lime highlighter grows under 避开,
//            the line smears out sideways.
//   70–101   A-roll punch-in on the open hand. 避开这 pops word by word, 5种公司 flashes in, a red strike wipes it.
//   102–138  A-roll. thin 你的 writes on green -> white; an outline box opens from a line around 投资绩效;
//            the picture washes out to white.
//   139–172  A-roll, flashing back in from white. thin 绝对 会 write on; huge 高于 lands green behind his
//            hair and washes to ink letter by letter, drifting smaller.
//   173–209  charcoal grid: a dot, a square, particles gather to a ring, the square splits 2x2 -> 4x4 -> 10x10,
//            a green caret opens into the grey pill "90%的人"; 90 cells dim, the top row lights green.
//
// Word frames are onsets from ASR (SenseVoice) checked against the voice's loudness envelope.
(function () {
  const FPS = 30;
  const FRAMES = 210;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mix = (c0, c1, t) => c0.map((v, i) => Math.round(lerp(v, c1[i], t)));
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

  const WHITE = [255, 255, 255];
  const CREAM = [255, 244, 226];
  const INK = [22, 22, 22];
  const GREEN = [12, 216, 102];
  const LIME = [160, 247, 46];
  const YELLOW = [233, 245, 60];
  const PURPLE = [176, 72, 236];
  const GOLD = [247, 196, 72];
  const BG = [27, 27, 27];
  const PANEL = [51, 51, 51];
  const DIM = [62, 62, 62];

  // Monotone cubic (PCHIP) through [frame, value] keys: continuous velocity, no overshoot.
  function spline(keys) {
    const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]);
    const h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; d[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return (f) => {
      if (f <= x[0]) return y[0];
      if (f >= x[n - 1]) return y[n - 1];
      let i = 0;
      while (f > x[i + 1]) i++;
      const t = (f - x[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
  }

  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  const el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const chars = (parent, text, cls) => [...text].map((c) => el("span", "ch" + (cls ? " " + cls : ""), parent, c));
  const place = (e, x, y, extra) => (e.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)${extra || ""}`);
  // characters toggle visibility (they keep their layout); containers toggle display, since a hidden parent
  // would not hide children that are set visible
  const show = (e, on) => (e.style.visibility = on ? "visible" : "hidden");
  const disp = (e, on) => (e.style.display = on ? "block" : "none");

  // The talking-head reference's key-word flash: one purple frame, two gold frames, then the settled colour.
  function flashColor(f, at, settled) {
    if (f < at + 1) return PURPLE;
    if (f < at + 3) return GOLD;
    return mix(GOLD, settled, outCubic(prog(f, at + 3, at + 7)));
  }
  // The animation reference's write-on: a letter appears green and washes to its settled colour.
  function writeColor(f, at, settled, hold = 2, wash = 7) {
    return mix(GREEN, settled, inOut(prog(f, at + hold, at + hold + wash)));
  }

  // Camera on the take: a view centred on source point (cx, cy) at scale s.
  function cam(f) {
    if (f < 48) { const p = prog(f, 0, 48); return { cx: lerp(1004, 990, p), cy: lerp(502, 492, p), s: lerp(1.1, 1.165, p) }; }
    if (f < 102) { const p = prog(f, 70, 102); return { cx: 812, cy: lerp(566, 560, p), s: lerp(1.2, 1.25, p) }; }
    if (f < 139) { const p = prog(f, 102, 139); return { cx: 930, cy: 520, s: lerp(1.06, 1.12, p) }; }
    const p = prog(f, 139, 173); return { cx: lerp(1004, 996, p), cy: 474, s: lerp(1.22, 1.29, p) };
  }
  // the view never runs off the 1920x1080 source
  function fit(k) {
    const hw = 960 / k.s, hh = 540 / k.s;
    return { s: k.s, cx: clamp(k.cx, hw, 1920 - hw), cy: clamp(k.cy, hh, 1080 - hh) };
  }
  const camCss = (k) => `translate(${(960 - k.cx * k.s).toFixed(2)}px, ${(540 - k.cy * k.s).toFixed(2)}px) scale(${k.s.toFixed(4)})`;

  const SCENES = [["A", 0, 47], ["B", 48, 69], ["C", 70, 101], ["D", 102, 138], ["E", 139, 172], ["F", 173, 209]];

  const SCENE = {};
  SCENE.mount = function (L) {
    // each beat has a layer behind his cutout, one in front of him, and one above the wash
    const S = {};
    SCENES.forEach(([id]) => (S[id] = { behind: el("div", "scene", L.behind), front: el("div", "scene", L.front), top: el("div", "scene", L.stage) }));
    const smear = document.getElementById("smearBlur");

    // his cutout, one image per matted frame (assets/cutouts.js lists them)
    const cutImgs = {};
    (window.CUTOUTS || []).forEach((n) => {
      const img = el("img", "", L.cut);
      img.src = `assets/cut/c${String(n).padStart(4, "0")}.webp`;
      cutImgs[n] = img;
    });
    let shownCut = null;

    // ============================================================ A: on the wall, behind him
    const aWrap = el("div", "abs", S.A.behind);
    const aSmall = el("div", "abs cap", aWrap);
    aSmall.style.color = rgb(INK); aSmall.style.textShadow = "none"; aSmall.style.fontSize = "66px";
    const aSmallW = chars(aSmall, "做");
    const aHero = el("div", "abs hero ink", aWrap, "股票投资");
    aHero.style.fontSize = "282px";
    const aTail = el("div", "abs cap", aWrap);
    aTail.style.color = rgb(INK); aTail.style.textShadow = "none"; aTail.style.fontSize = "66px";
    const aTailW = chars(aTail, "呢");
    const A_AT = { small: 11, hero: 18, tail: 41 };

    // ============================================================ B: typed line
    const bBg = el("div", "abs", S.B.top);
    bBg.style.width = "1920px"; bBg.style.height = "1080px";
    // phase 1: huge, the camera chasing the caret
    const b1 = el("div", "abs grot", S.B.top);
    b1.style.fontSize = "640px"; b1.style.color = rgb(WHITE);
    const b1C = chars(b1, "你只要");
    const b1Caret = el("div", "caret", S.B.top);
    const B1_AT = [48, 53, 57];
    const B1_CW = 640 * 0.955;
    // each pan lands as the character appears, so the caret never leaves the frame
    const b1Left = spline([[48, 1300 - B1_CW], [52.4, 1290 - B1_CW], [53.6, 1660 - 2 * B1_CW], [56.4, 1640 - 2 * B1_CW], [57.6, 1790 - 3 * B1_CW], [61, 1740 - 3 * B1_CW]]);
    // phase 2: wide, highlighter
    const b2 = el("div", "abs", S.B.top);
    const b2hl = el("div", "hl", b2);
    const b2line = el("div", "abs grot", b2);
    b2line.style.fontSize = "176px"; b2line.style.color = rgb(WHITE);
    const b2C = chars(b2line, "你只要能避开");
    const b2Caret = el("div", "caret", b2);
    const B2_AT = [0, 0, 0, 61, 64, 67];
    const B2_CW = 176 * 0.955;

    // ============================================================ C: on his chest
    const cWrap = el("div", "abs", S.C.front);
    const cSmall = el("div", "abs cap", cWrap);
    const cSmallW = [el("span", "ch", cSmall, "避开"), el("span", "ch", cSmall, "这")];
    const cHeroBox = el("div", "abs", cWrap);
    const cHero = el("div", "abs hero light", cHeroBox, "5种公司");
    cHero.style.fontSize = "250px";
    const cStrike = el("div", "strike", cHeroBox);
    const C_AT = { small: [70, 71], hero: 75, strike: [90, 98] };

    // ============================================================ D: box opens on his chest, wash
    const dThin = el("div", "abs thin", S.D.top);
    dThin.style.fontSize = "58px";
    const dThinC = chars(dThin, "你的");
    const dBox = el("div", "box", S.D.top);
    const dTxt = el("div", "txt", dBox, "投资绩效");
    dTxt.style.fontSize = "100px";
    const D_AT = { thin: [105, 109] };
    const D_BOX_H = 140;
    const dBoxW = spline([[114, 3], [116, 96], [121, 170], [127, 300], [132, 410], [136, 452], [139, 458]]);

    // ============================================================ E: behind his hair
    const eThin = el("div", "abs thin", S.E.behind);
    eThin.style.color = rgb(INK); eThin.style.fontSize = "58px"; eThin.style.fontWeight = "400";
    const eThinC = chars(eThin, "绝对   会");
    const E_THIN_AT = [142, 149, null, null, null, 155];
    const eHero = el("div", "abs grot", S.E.behind);
    eHero.style.fontSize = "440px";
    const eHeroC = chars(eHero, "高于");
    const E_AT = [163, 167];

    // ============================================================ F: grid, pill
    const fBg = el("div", "abs", S.F.top);
    fBg.style.width = "1920px"; fBg.style.height = "1080px"; fBg.style.background = rgb(BG);
    const fWorld = el("div", "abs", S.F.top);
    fWorld.style.width = "1920px"; fWorld.style.height = "1080px"; fWorld.style.transformOrigin = "960px 520px";
    const FCX = 960, FCY = 520;
    const r6 = rng(11);
    const pdots = Array.from({ length: 170 }, (_, i) => {
      const ring = i % 4;
      return {
        x0: r6() * 1920, y0: r6() * 1080,
        a: r6() * Math.PI * 2, r: 1 + ring * 0.12 + (r6() - 0.5) * 0.1,
        sz: 4 + Math.round(r6() * 6), o: 0.35 + r6() * 0.5,
        at: 173 + r6() * 5, spin: 0.004 + r6() * 0.004,
        e: el("div", "pdot", fWorld),
      };
    });
    pdots.forEach((d) => { d.e.style.width = d.e.style.height = d.sz + "px"; });
    const cells = Array.from({ length: 100 }, () => el("div", "cell", fWorld));
    const fCaret = el("div", "abs", fWorld);
    fCaret.style.background = rgb(GREEN); fCaret.style.width = "4px";
    const fPill = el("div", "pill", fWorld);
    const fTxt = el("div", "txt", fPill);
    fTxt.style.fontSize = "84px";
    const fTxtC = chars(fTxt, "90%的人");
    const F_AT = [185, 186, 187, 194, 200];
    const F_W = [0.56, 0.56, 0.86, 1, 1].map((k) => k * 84);
    // grid stages: N per side, the frame its cracks open, its overall size
    const STAGES = [[1, 175, 150], [2, 179, 196], [4, 182, 290], [10, 186, 470]];
    const gridSize = spline([[175, 22], ...STAGES.map((s) => [s[1] + 3, s[2]]), [210, 500]]);
    const pillW = spline([[185, 6], [187, 100], ...F_AT.slice(2).map((x, i) => [x + 2, 70 + F_W.slice(0, i + 3).reduce((a, b) => a + b, 0)])]);

    // ============================================================ render
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);

      SCENES.forEach(([id, a, b]) => {
        const on = fi >= a && fi <= b ? "block" : "none";
        S[id].behind.style.display = S[id].front.style.display = S[id].top.style.display = on;
      });

      const k = fit(cam(f));
      L.cam.style.transform = L.cut.style.transform = camCss(k);
      const cutNow = cutImgs[fi] ? fi : null;
      if (cutNow !== shownCut) {
        if (shownCut !== null) cutImgs[shownCut].style.display = "none";
        if (cutNow !== null) cutImgs[cutNow].style.display = "block";
        shownCut = cutNow;
      }

      // wash: D washes out to white, E flashes back in from it
      let wash = 0;
      if (fi >= 124 && fi <= 138) wash = inOut(prog(f, 124, 138));
      else if (fi >= 139 && fi <= 147) wash = 1 - outCubic(prog(f, 139, 147));
      L.wash.style.opacity = wash.toFixed(3);
      smear.setAttribute("stdDeviation", "0 0");

      // ---------------------------------------------------------- A
      if (fi <= 47) {
        // the block drifts up and shrinks a touch the whole time it is on (the reference never parks)
        const p = prog(f, 0, 48);
        aWrap.style.transformOrigin = "1400px 330px";
        aWrap.style.transform = `translateY(${lerp(6, -10, p).toFixed(2)}px) scale(${lerp(1.035, 1.0, p).toFixed(4)})`;
        place(aSmall, 1010, 122);
        show(aSmallW[0], fi >= A_AT.small);
        // key word: rises from below out of a blur, flashing colour, squeezed to a condensed cut
        const hp = outExpo(prog(f, A_AT.hero, A_AT.hero + 6));
        disp(aHero, fi >= A_AT.hero);
        aHero.style.color = rgb(flashColor(f, A_AT.hero, INK));
        aHero.style.filter = hp < 1 ? `blur(${(9 * (1 - hp)).toFixed(2)}px)` : "none";
        place(aHero, 984, 200 + 60 * (1 - hp), " scaleX(0.8)");
        place(aTail, 1010, 470);
        show(aTailW[0], fi >= A_AT.tail);
      }

      // ---------------------------------------------------------- B
      if (fi >= 48 && fi <= 69) {
        const phase2 = fi >= 61;
        const panel = fi <= 49 || fi === 61 || fi === 62;
        bBg.style.background = rgb(panel ? PANEL : BG);
        disp(b1, !phase2); disp(b1Caret, !phase2); disp(b2, phase2);
        if (!phase2) {
          const n = B1_AT.filter((at) => fi >= at).length;
          b1C.forEach((c, i) => show(c, i < n));
          const left = b1Left(f);
          place(b1, left, 540 - 640 * 0.56);
          b1Caret.style.height = 640 * 0.74 + "px"; b1Caret.style.width = "12px";
          place(b1Caret, left + n * B1_CW + 14, 540 - 640 * 0.37);
        } else {
          const n = B2_AT.filter((at) => fi >= at).length;
          b2C.forEach((c, i) => show(c, i < n));
          // keeps sliding left; the last frames smear out sideways
          const out = prog(f, 67.5, 69.5);
          const x = 330 - 3.2 * (f - 61) - 140 * out * out;
          place(b2, x, 540 - 176 * 0.56);
          b2Caret.style.height = 176 * 0.8 + "px"; b2Caret.style.width = "6px";
          place(b2Caret, n * B2_CW + 10, 176 * 0.14);
          show(b2Caret, fi < 68 || fi % 4 < 2);
          // highlighter: a sliver under 避 that grows with each character, yellow turning lime
          const hlW = spline([[62.5, 0], [63, 0.22], [65, 1.0], [67, 1.25], [69, 2.0]])(f) * B2_CW;
          b2hl.style.display = f >= 62.5 ? "block" : "none";
          b2hl.style.background = rgb(mix(YELLOW, LIME, prog(f, 63, 67)));
          b2hl.style.width = (hlW + 8).toFixed(1) + "px";
          b2hl.style.height = 176 * 0.86 + "px";
          place(b2hl, 3 * B2_CW + B2_CW - 4, 176 * 0.1);
          if (out > 0) { smear.setAttribute("stdDeviation", `${(46 * out).toFixed(1)} 0`); b2.style.filter = "url(#smear)"; }
          else b2.style.filter = "none";
        }
      }

      // ---------------------------------------------------------- C
      if (fi >= 70 && fi <= 101) {
        const p = prog(f, 70, 102);
        cWrap.style.transformOrigin = "990px 820px";
        cWrap.style.transform = `translateY(${lerp(0, -14, p).toFixed(2)}px) scale(${lerp(1.02, 0.975, p).toFixed(4)})`;
        cSmallW.forEach((w, i) => show(w, fi >= C_AT.small[i]));
        cSmall.style.fontSize = "66px";
        place(cSmall, 990 - (3 * 66) / 2, 632);
        const hp = outExpo(prog(f, C_AT.hero, C_AT.hero + 6));
        disp(cHeroBox, fi >= C_AT.hero);
        cHero.style.color = rgb(flashColor(f, C_AT.hero, CREAM));
        cHero.style.filter = hp < 1 ? `blur(${(9 * (1 - hp)).toFixed(2)}px)` : "none";
        cHero.style.transform = "scaleX(0.8)";
        const heroW = 250 * 3.62 * 0.8;
        place(cHeroBox, 990 - heroW / 2, 712 + 50 * (1 - hp));
        const sp = outCubic(prog(f, C_AT.strike[0], C_AT.strike[1]));
        cStrike.style.top = 250 * 0.42 + "px";
        cStrike.style.width = heroW * 1.06 + "px";
        cStrike.style.left = -heroW * 0.03 + "px";
        cStrike.style.transform = `scaleX(${sp.toFixed(4)})`;
        disp(cStrike, sp > 0);
      }

      // ---------------------------------------------------------- D
      if (fi >= 102 && fi <= 138) {
        const drift = 30 * prog(f, 102, 139);
        dThin.style.letterSpacing = "0.5em";
        place(dThin, 800 - 56 - drift, 724);
        dThinC.forEach((c, i) => {
          show(c, fi >= D_AT.thin[i]);
          c.style.color = rgb(writeColor(f, D_AT.thin[i], WHITE));
        });
        const on = f >= 114;
        dBox.style.display = on ? "block" : "none";
        if (on) {
          // opens from a vertical line; the word sits centred and the opening reveals it
          const h = D_BOX_H * outCubic(prog(f, 114, 116));
          const w = dBoxW(f);
          dBox.style.width = w + "px"; dBox.style.height = h + "px";
          place(dBox, 800 - drift - w / 2, 862 - h / 2);
          dTxt.style.transform = "translate(-50%, -54%)";
        }
      }

      // ---------------------------------------------------------- E
      if (fi >= 139 && fi <= 172) {
        place(eThin, 1012, 150);
        eThinC.forEach((c, i) => {
          const at = E_THIN_AT[i];
          if (at === null) return;
          show(c, fi >= at);
          c.style.color = rgb(writeColor(f, at, INK));
        });
        // huge word: lands green at full size, washes to ink letter by letter, keeps drifting smaller
        const p = prog(f, 160, 173);
        eHero.style.transformOrigin = "0 0";
        place(eHero, 1000 - 26 * p, 236, ` scale(${lerp(1.04, 0.985, p).toFixed(4)})`);
        eHeroC.forEach((c, i) => {
          show(c, fi >= E_AT[i]);
          c.style.color = rgb(writeColor(f, E_AT[i], INK, 3, 6));
        });
      }

      // ---------------------------------------------------------- F
      if (fi >= 173) {
        const p = prog(f, 173, 210);
        fWorld.style.transform = `translate(${lerp(0, -24, p).toFixed(2)}px, ${lerp(0, -8, p).toFixed(2)}px) scale(${lerp(1.04, 0.96, p).toFixed(4)})`;

        // grid: the current split, its cracks opening, its size
        let st = 0;
        for (let i = 0; i < STAGES.length; i++) if (f >= STAGES[i][1]) st = i;
        const [N, at] = STAGES[st];
        const size = f < 175 ? lerp(0, 22, prog(f, 173, 175)) : gridSize(f);
        const gap = N === 1 ? 0 : lerp(0, N === 10 ? 7 : 9, outCubic(prog(f, at, at + 3)));
        const cs = (size - gap * (N - 1)) / N;
        const g0x = FCX - size / 2, g0y = FCY - size / 2;
        cells.forEach((e, i) => {
          const r = Math.floor(i / 10), c = i % 10;
          const on = r < N && c < N && f >= 173.5;
          e.style.display = on ? "block" : "none";
          if (!on) return;
          e.style.width = e.style.height = cs.toFixed(2) + "px";
          e.style.borderRadius = Math.max(2, cs * 0.12).toFixed(1) + "px";
          let col = [244, 244, 244], glow = 0;
          if (N === 10) {
            if (r > 0) col = mix(col, DIM, inOut(prog(f, 194 + (9 - r) * 0.7, 199 + (9 - r) * 0.7)));
            else { glow = prog(f, 199 + c * 0.45, 203 + c * 0.45); col = mix(col, GREEN, glow); }
          }
          e.style.background = rgb(col);
          e.style.boxShadow = glow > 0 ? `0 0 ${(22 * glow).toFixed(1)}px rgba(12,216,102,${(0.6 * glow).toFixed(2)})` : "";
          place(e, g0x + c * (cs + gap), g0y + r * (cs + gap));
        });

        // particles: scattered, then drawn into a ring that hugs the grid
        const ringR = Math.max(150, size * 0.78 + 40);
        pdots.forEach((d) => {
          const q = outCubic(prog(f, d.at, d.at + 13));
          const a = d.a + d.spin * (f - 173);
          const tx = FCX + Math.cos(a) * ringR * d.r, ty = FCY + Math.sin(a) * ringR * d.r;
          d.e.style.opacity = (d.o * Math.min(1, (f - 172) / 3)).toFixed(3);
          place(d.e, lerp(d.x0, tx, q) - d.sz / 2, lerp(d.y0, ty, q) - d.sz / 2);
        });

        // caret -> pill that grows as the words are typed into it
        fCaret.style.display = f >= 183 && f < 186 ? "block" : "none";
        fCaret.style.height = 100 * outCubic(prog(f, 183, 184.5)) + "px";
        place(fCaret, FCX - 2, FCY - 50);
        const n = F_AT.filter((x) => fi >= x).length;
        const textW = F_W.slice(0, n).reduce((a, b) => a + b, 0);
        const pw = f < 185 ? 0 : pillW(f);
        fPill.style.display = f >= 185 ? "block" : "none";
        fPill.style.width = pw + "px"; fPill.style.height = "122px";
        place(fPill, FCX - pw / 2, FCY - 61);
        fTxtC.forEach((c, i) => show(c, i < n));
        fTxt.style.transform = `translate(${(-textW / 2).toFixed(1)}px, -54%)`;
      }
    }

    // GSAP proxy tween drives the frame so HyperFrames seeks redraw deterministically
    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
