// Launch Studio — "You built the product" spot.
// Motion is lifted frame by frame from the reference clip (see assets/motion.js): camera scale/position,
// typing cadence, the blue wave, the cursor's path, size and angle, and the hard cuts between beats.
// Every frame is a pure function of the frame number f (30 fps, 1920x1080), drawn on one canvas.
//
//   f   0-42   Scene 1  "You built / the product"             reference frames 0-42   (zoom-out, wave)
//   f  43      blank paper                                    reference frame 43
//   f  44-75   Scene 2  "But nobody / understands it."        reference frames 88-119 (cursor turns)
//   f  76-120  Scene 3  "Let's launch it / with Launch Studio" reference frames 219-263
//   f 121-152  Logo     mark rises on the cursor's path        reference frames 44-75
//   f 153-189  Logo hold
(function (G) {
  const W = 1920, H = 1080, FPS = 30, TOTAL = 190;
  const M = () => G.MOTION;

  // ------------------------------------------------------------------ math
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function hex(h) { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    t = clamp(t, 0, 1);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // linear sample of a per-frame table at a fractional index
  function tab(arr, i) {
    i = clamp(i, 0, arr.length - 1);
    const a = Math.floor(i), b = Math.min(arr.length - 1, a + 1), t = i - a;
    const A = arr[a], B = arr[b];
    if (!A || !B) return A || B;
    return A.map((v, k) => lerp(v, B[k], t));
  }

  // ---------------------------------------------------------------- canvases
  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  const pool = {};
  function buf(name, w, h) {
    w = w || W; h = h || H;
    const k = name + w + "x" + h;
    if (!pool[k]) pool[k] = canvas(w, h);
    const c = pool[k], g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.filter = "none";
    g.clearRect(0, 0, w, h);
    return c;
  }
  const IMG = {};
  function img(name) {
    if (!IMG[name]) { IMG[name] = new Image(); IMG[name].src = "assets/" + name; }
    return IMG[name];
  }

  // ---------------------------------------------------------------- type
  const FONT = '"Inter", "SF Pro Display", system-ui, sans-serif';
  const INK = "#343434", FRESH = "#6C6C6C";
  // a fresh word lands at mid grey and settles to ink (measured: grey 108 -> 52, ~3.6 frame time constant)
  const settle = (age) => 1 - Math.exp(-Math.max(0, age) / 3.6);

  function setFont(g, L) {
    g.font = `${L.weight} ${L.size}px ${FONT}`;
    g.letterSpacing = `${(L.track * L.size).toFixed(2)}px`;
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
  }
  let meas = null;
  function pw(L) {
    if (L._pw && L._st === document.fonts.status) return L._pw;
    if (!meas) meas = canvas(8, 8).getContext("2d");
    setFont(meas, L);
    L._pw = [];
    for (let i = 0; i <= L.text.length; i++) L._pw.push(meas.measureText(L.text.slice(0, i)).width);
    L._st = document.fonts.status;
    return L._pw;
  }
  const width = (L) => pw(L)[L.text.length];

  // Char reveal from the reference's typed-count table (refCounts[i] chars of an refN-char word at f0+i).
  function charTimes(text, f0, refCounts, refN, gap) {
    const n = text.length, out = new Array(n).fill(1e9);
    refCounts.forEach((c, i) => {
      const ours = Math.round((c / refN) * n);
      for (let k = 0; k < ours; k++) if (out[k] > 1e8) out[k] = f0 + i;
    });
    // characters already on screen at the cut were typed before it
    const first = out.findIndex((t) => t > f0);
    const shown = first < 0 ? n : first;
    for (let k = 0; k < shown; k++) out[k] = f0 - (shown - 1 - k) * gap;
    return out;
  }
  function wordTimes(text, words) {
    const out = [], parts = text.split(" ");
    parts.forEach((p, i) => { for (let k = 0; k < p.length + (i ? 1 : 0); k++) out.push(words[i]); });
    return out;
  }

  // Blue gradient: deep blue ends, pale cyan through the middle (as in the reference headline)
  function blueGrad(g, x0, x1, y0, y1) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, "#1167D6");
    gr.addColorStop(0.3, "#3C9CEB");
    gr.addColorStop(0.48, "#7FCBF5");
    gr.addColorStop(0.62, "#4FA8EE");
    gr.addColorStop(0.85, "#1A70DA");
    gr.addColorStop(1, "#0F5CCB");
    return gr;
  }

  function inkChar(g, L, P, i, f) {
    if (L.text[i] === " " || f < L.appear[i]) return;
    const k = settle(f - L.appear[i]);
    g.fillStyle = L.mode === "white" ? mix("#D3E2F5", "#FFFFFF", k) : mix(FRESH, INK, k);
    g.fillText(L.text[i], L.x + P[i], L.y);
  }
  // Draw a line in rest-layout coords; the caller has set the camera transform on g.
  function drawLine(g, L, f) {
    const P = pw(L), t = L.appear;
    setFont(g, L);
    if (L.mode !== "blue" && L.blueFrom == null) {
      for (let i = 0; i < L.text.length; i++) inkChar(g, L, P, i, f);
      return;
    }
    const from = L.mode === "blue" ? 0 : L.blueFrom;
    for (let i = 0; i < from; i++) inkChar(g, L, P, i, f);
    const B = buf("blue"), bg = B.getContext("2d");
    bg.setTransform(g.getTransform());
    setFont(bg, L);
    let any = false;
    for (let i = from; i < L.text.length; i++) {
      if (L.text[i] === " " || f < t[i]) continue;
      any = true;
      bg.fillStyle = "#000";
      bg.fillText(L.text[i], L.x + P[i], L.y);
    }
    if (!any) return;
    bg.globalCompositeOperation = "source-in";
    const x0 = L.x + P[from], x1 = L.x + P[L.text.length];
    bg.fillStyle = blueGrad(bg, x0, x1, L.y - L.size * 0.7, L.y);
    bg.fillRect(x0 - 50, L.y - L.size * 1.2, x1 - x0 + 100, L.size * 1.6);
    // fresh characters arrive paler
    bg.globalCompositeOperation = "source-atop";
    for (let i = from; i < L.text.length; i++) {
      if (L.text[i] === " " || f < t[i]) continue;
      const k = 1 - settle(f - t[i]);
      if (k < 0.02) continue;
      bg.fillStyle = `rgba(255,255,255,${(0.5 * k).toFixed(3)})`;
      bg.fillRect(L.x + P[i], L.y - L.size, P[i + 1] - P[i], L.size * 1.3);
    }
    const m = g.getTransform();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(B, 0, 0);
    g.setTransform(m);
  }

  // ------------------------------------------------------------ background
  let BG = null;
  function buildBG() {
    const c = canvas(W, H), g = c.getContext("2d");
    g.fillStyle = "#F2F3F5";
    g.fillRect(0, 0, W, H);
    const rg = g.createRadialGradient(W * 0.55, H * 0.42, 60, W * 0.5, H * 0.5, 1250);
    rg.addColorStop(0, "#FDFDFE");
    rg.addColorStop(0.6, "#F6F7F8");
    rg.addColorStop(1, "#E6E7EA");
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    // window-blind shadows + frame column (soft, multiplied)
    const s = canvas(W / 4, H / 4), sg = s.getContext("2d");
    sg.translate(s.width / 2, s.height / 2);
    sg.rotate((20 * Math.PI) / 180);
    const r = rng(3);
    for (let k = -5; k <= 5; k++) {
      sg.fillStyle = `rgba(120,124,134,${0.12 + r() * 0.05})`;
      sg.fillRect(-900, k * 92 + r() * 20, 1800, 24 + r() * 16);
    }
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.fillStyle = "rgba(120,124,134,0.16)";
    sg.fillRect(s.width * 0.035, 0, 26, s.height);
    g.filter = "blur(46px)";
    g.globalCompositeOperation = "multiply";
    g.drawImage(s, 0, 0, W, H);
    g.filter = "none";
    g.globalCompositeOperation = "source-over";
    return c;
  }
  let GRAIN = null;
  function buildGrain() {
    const out = [], r = rng(99);
    for (let n = 0; n < 4; n++) {
      const c = canvas(480, 270), g = c.getContext("2d"), im = g.createImageData(480, 270);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = 128 + (r() - 0.5) * 255;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      out.push(c);
    }
    return out;
  }

  // ---------------------------------------------------------------- wave
  // Tint field sampled from the reference wave (frames 11-42), multiplied over the paper.
  function drawWave(g, rf) {
    if (rf <= 11 || rf > 42) return;
    const im = img("wave.png");
    if (!im.complete || !im.naturalWidth) return;
    const a = Math.floor(rf), b = Math.min(42, a + 1), t = rf - a;
    const L = buf("wave", 320, 180), lg = L.getContext("2d");
    lg.imageSmoothingQuality = "high";
    lg.drawImage(im, 0, (a - 11) * 90, 160, 90, 0, 0, 320, 180);
    if (t > 0.01) { lg.globalAlpha = t; lg.drawImage(im, 0, (b - 11) * 90, 160, 90, 0, 0, 320, 180); lg.globalAlpha = 1; }
    const L2 = buf("wave2", 320, 180), l2 = L2.getContext("2d");
    l2.fillStyle = "#fff";
    l2.fillRect(0, 0, 320, 180);
    l2.filter = "blur(3px)";
    l2.drawImage(L, 0, 0);
    const m = g.getTransform();
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "multiply";
    g.imageSmoothingQuality = "high";
    g.drawImage(L2, 0, 0, W, H);
    g.restore();
    g.setTransform(m);
  }

  // ---------------------------------------------------------------- cursor
  // Flat navigation arrow (measured: width 0.9 h, notch 0.127 h deep, centroid 0.595 h below the tip).
  function cursorPath(g) {
    g.beginPath();
    g.moveTo(-0.035, -0.47);
    g.quadraticCurveTo(0, -0.5, 0.035, -0.47);
    g.lineTo(0.415, 0.43);
    g.quadraticCurveTo(0.47, 0.5, 0.39, 0.5);
    g.quadraticCurveTo(0, 0.28, -0.39, 0.5);
    g.quadraticCurveTo(-0.47, 0.5, -0.415, 0.43);
    g.closePath();
  }
  function drawCursor(g, c) {
    if (!c) return;
    const [cx, cy, tipd, ang] = c;
    const h = tipd / 0.595, R = (ang * Math.PI) / 180;
    const L = buf("cur"), lg = L.getContext("2d");
    lg.translate(cx, cy);
    lg.rotate(R);
    lg.scale(h * 0.9, h);
    lg.translate(0, -0.095);
    cursorPath(lg);
    const gr = lg.createLinearGradient(0, -0.5, 0, 0.5);
    gr.addColorStop(0, "#1A84FA");
    gr.addColorStop(0.6, "#0A86F2");
    gr.addColorStop(1, "#2A9FEE");
    lg.fillStyle = gr;
    lg.fill();
    lg.save();
    lg.clip();
    lg.lineWidth = 0.06;
    lg.strokeStyle = "rgba(110,200,255,0.55)";
    lg.beginPath();
    lg.moveTo(0.39, 0.5);
    lg.quadraticCurveTo(0, 0.28, -0.39, 0.5);
    lg.stroke();
    lg.restore();
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 0.45;
    g.filter = `blur(${(h * 0.07).toFixed(1)}px)`;
    g.drawImage(L, 0, h * 0.05);
    g.filter = "blur(0.6px)";
    g.globalAlpha = 1;
    g.drawImage(L, 0, 0);
    g.restore();
  }

  // ------------------------------------------------------------ layouts
  // Rest layouts use the reference's screen coords at each beat's rest frame. Where our copy is
  // wider, the block shifts to keep the reference's centre and the cursor shifts with its anchor.
  let LAY = null;
  function layout() {
    if (LAY && LAY.st === document.fonts.status) return LAY;
    // scene 1: "Orchestration" spans 346-1573 (centred), baseline 592; line 2 baseline 748, +16 indent
    const S1a = { text: "You built", size: 206, weight: 600, track: -0.03, mode: "blue" };
    const S1b = { text: "the product", size: 138, weight: 400, track: -0.01, mode: "white" };
    S1a.x = 960 - width(S1a) / 2; S1a.y = 592;
    S1b.x = S1a.x + 16; S1b.y = 748;
    S1a.appear = charTimes(S1a.text, 0, [9, 10, 11, 11, 11, 12, 12, 12, 12, 12, 13], 13, 2.5);
    S1b.appear = wordTimes(S1b.text, [14, 20]);

    // scene 2: "Financing" left 453 baseline 509; "closes it." left 884 baseline 673
    const S2a = { text: "But nobody", size: 163, weight: 600, track: -0.025, mode: "ink" };
    const S2b = { text: "understands it.", size: 163, weight: 400, track: -0.015, mode: "ink" };
    S2a.y = 509; S2b.y = 673;
    {
      const ind = 431, right = Math.max(width(S2a), ind + width(S2b)), refC = (453 + 1466) / 2;
      S2a.x = Math.min(453, refC - right / 2);
      S2b.x = S2a.x + ind;
    }
    S2a.appear = charTimes(S2a.text, 44, [7, 8, 8, 9], 9, 1);
    S2b.appear = wordTimes(S2b.text, [49, 54]);
    const S2dx = S2b.x - 884; // the cursor sits by the start of line 2

    // scene 3: "Susbcription" left 343 baseline 517; "reviver saves it" left 521 baseline 679
    const S3a = { text: "Let's launch it", size: 163, weight: 600, track: -0.025, mode: "ink" };
    const S3b = { text: "with Launch Studio", size: 163, weight: 400, track: -0.015, mode: "ink", blueFrom: 5 };
    S3a.y = 517; S3b.y = 679;
    {
      const ind = 178, right = Math.max(width(S3a), ind + width(S3b)), refC = (343 + 1524) / 2;
      S3a.x = Math.min(343, refC - right / 2);
      S3b.x = S3a.x + ind;
    }
    S3a.appear = charTimes(S3a.text, 76, [6, 8, 9, 10, 10, 11, 11, 11, 12], 12, 0);
    S3b.appear = wordTimes(S3b.text, [85, 91, 98]);
    const S3dx = S3a.x + width(S3a) - 1230; // the cursor sits just past the end of line 1

    LAY = { st: document.fonts.status, S1a, S1b, S2a, S2b, S3a, S3b, S2dx, S3dx };
    return LAY;
  }

  // our frame -> beat
  function beatAt(f) {
    if (f < 43) return "s1";
    if (f < 44) return "blank";
    if (f < 76) return "s2";
    if (f < 121) return "s3";
    return "logo";
  }
  function camOf(table, i) { const c = tab(table, i); return { s: c[0], tx: c[1], ty: c[2] }; }
  const setCam = (g, c) => g.setTransform(c.s, 0, 0, c.s, c.tx, c.ty);

  // Logo: the mark rides the cursor's rise from reference beat 2 (frames 44-75), then eases to rest.
  const LOGO = { cx: 960, restCy: 423, h: 330 };
  function logoDy(rf) {
    const T = M().b2.cursor, rest = 75;
    if (rf <= rest) return (tab(T, rf - 44)[1] - T[rest - 44][1]) * 1.42;
    const v = (T[rest - 44][1] - T[rest - 45][1]) * 1.42;
    return v * 5 * (1 - Math.exp(-(rf - rest) / 5));
  }
  function drawMark(g, cy) {
    const im = img("mark.png");
    if (!im.complete || !im.naturalWidth) return;
    const h = LOGO.h, w = (h * im.naturalWidth) / im.naturalHeight;
    const L = buf("mark"), lg = L.getContext("2d");
    const x = LOGO.cx - w / 2, y = cy - h / 2;
    lg.drawImage(im, x, y, w, h);
    lg.globalCompositeOperation = "source-in";
    lg.fillStyle = blueGrad(lg, x - w * 0.1, x + w * 1.1, y, y + h);
    lg.fillRect(0, 0, W, H);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 0.4;
    g.filter = "blur(22px)";
    g.drawImage(L, 0, h * 0.05);
    g.globalAlpha = 1;
    g.filter = "blur(0.4px)";
    g.drawImage(L, 0, 0);
    g.restore();
  }
  function drawWord(g, name, cy, h, age) {
    const im = img(name);
    if (!im.complete || !im.naturalWidth || age < 0) return;
    const w = (h * im.naturalWidth) / im.naturalHeight;
    const L = buf("word"), lg = L.getContext("2d");
    lg.drawImage(im, LOGO.cx - w / 2, cy - h / 2, w, h);
    lg.globalCompositeOperation = "source-in";
    lg.fillStyle = mix(FRESH, "#1F1F22", settle(age));
    lg.fillRect(0, 0, W, H);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(L, 0, 0);
    g.restore();
  }

  // Everything that moves, at a (possibly fractional) frame f within the current beat.
  function drawMoving(g, f, beat) {
    const lay = layout();
    if (beat === "s1") {
      const c = camOf(M().b1.cam, f);
      setCam(g, c);
      drawLine(g, lay.S1a, f);
      drawWave(g, f);
      g.shadowColor = "rgba(20,80,180,0.18)";
      g.shadowBlur = 10;
      drawLine(g, lay.S1b, f);
      g.shadowColor = "transparent";
      g.shadowBlur = 0;
    } else if (beat === "s2") {
      const i = f - 44;
      setCam(g, camOf(M().b3.cam, i));
      drawLine(g, lay.S2a, f);
      drawLine(g, lay.S2b, f);
      const c = tab(M().b3.cursor, i);
      if (c) drawCursor(g, [c[0] + lay.S2dx, c[1], c[2], c[3]]);
    } else if (beat === "s3") {
      const i = f - 76;
      setCam(g, camOf(M().b6.cam, i));
      drawLine(g, lay.S3a, f);
      drawLine(g, lay.S3b, f);
      const T = M().b6.cursor, ii = clamp(i, 0, T.length - 1);
      if (T[Math.floor(ii)] && T[Math.ceil(ii)]) {
        const c = tab(T, ii);
        drawCursor(g, [c[0] + lay.S3dx, c[1], c[2], c[3]]);
      }
    } else if (beat === "logo") {
      const rf = f - 77, dy = logoDy(rf);
      drawMark(g, LOGO.restCy + dy);
      // the wordmark lands like the reference's words (instant, grey, settling) and rides with the mark
      drawWord(g, "launch.png", 703 + dy, 82, rf - 50);
      drawWord(g, "studio.png", 803 + dy, 31, rf - 55);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // how far things move between f-1 and f (px), to size the shutter
  function speedAt(f) {
    const beat = beatAt(f);
    if (beatAt(f - 1) !== beat) return 0;
    const d = (a, b) => Math.abs(b.ty - a.ty) + Math.abs(b.tx - a.tx) + Math.abs(b.s - a.s) * 900;
    const cd = (T, i) => (T[i - 1] && T[i] ? Math.hypot(T[i][0] - T[i - 1][0], T[i][1] - T[i - 1][1]) : 0);
    if (beat === "s1") return d(camOf(M().b1.cam, f - 1), camOf(M().b1.cam, f));
    if (beat === "s2") return Math.max(d(camOf(M().b3.cam, f - 45), camOf(M().b3.cam, f - 44)), cd(M().b3.cursor, f - 44));
    if (beat === "s3") return Math.max(d(camOf(M().b6.cam, f - 77), camOf(M().b6.cam, f - 76)), cd(M().b6.cursor, f - 76));
    if (beat === "logo") return Math.abs(logoDy(f - 77) - logoDy(f - 78));
    return 0;
  }

  function draw(ctx, f) {
    f = Math.round(f);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    if (!BG) BG = buildBG();
    ctx.drawImage(BG, 0, 0);
    if (!M()) return;
    const beat = beatAt(f);
    // short shutter (~0.15 frame, measured from the reference's blur on fast moves)
    const SH = 0.15, sp = speedAt(f) * SH;
    const N = sp > 3 ? Math.min(16, Math.ceil(sp / 2.5) + 1) : 1;
    if (N > 1) {
      const A = buf("acc"), ag = A.getContext("2d"), S = buf("smp"), sg = S.getContext("2d");
      for (let i = 0; i < N; i++) {
        sg.setTransform(1, 0, 0, 1, 0, 0);
        sg.drawImage(BG, 0, 0);
        drawMoving(sg, f - SH + (SH * i) / (N - 1), beat);
        ag.globalAlpha = 1 / (i + 1);
        ag.drawImage(S, 0, 0);
      }
      ctx.drawImage(A, 0, 0);
    } else {
      drawMoving(ctx, f, beat);
    }
    if (!GRAIN) GRAIN = buildGrain();
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.045;
    ctx.drawImage(GRAIN[f % 4], 0, 0, W, H);
    ctx.restore();
  }

  // ------------------------------------------------------------- sound cues
  function cues() {
    const ev = [];
    [1, 2, 5, 10].forEach((f) => ev.push({ f, type: "key", v: 1 }));         // scene 1 typing
    [14, 20].forEach((f) => ev.push({ f, type: "key", v: 0.8 }));
    [45, 47].forEach((f) => ev.push({ f, type: "key", v: 1 }));              // scene 2
    [49, 54].forEach((f) => ev.push({ f, type: "key", v: 0.8 }));
    [77, 78, 79, 81, 84].forEach((f) => ev.push({ f, type: "key", v: 1 }));  // scene 3
    [85, 91, 98].forEach((f) => ev.push({ f, type: "key", v: 0.8 }));
    ev.push({ f: 6, type: "swell" });
    ev.push({ f: 44, type: "whoosh" }, { f: 76, type: "whoosh" });
    ev.push({ f: 113, type: "riser" });
    ev.push({ f: 121, type: "impact" });
    ev.push({ f: 127, type: "key", v: 0.9 }, { f: 132, type: "key", v: 0.9 });
    ev.push({ f: 134, type: "shimmer" });
    return ev;
  }

  G.FILM = { W, H, FPS, TOTAL, draw, cues };
})(typeof window !== "undefined" ? window : globalThis);
