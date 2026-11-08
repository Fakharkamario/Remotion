// Launch Studio — "You built the product" spot.
// Every frame is a pure function of the frame number f (30 fps, 1920x1080), drawn on one canvas,
// so HyperFrames can seek and render any frame in isolation.
//
//   Scene 1  f 0-80    "You built / the product"        blue gradient type, blue wave wipes up
//   Scene 2  f 78-172  "But nobody / understands it."   3D cursor pops in and looks around, whip pan out
//   Scene 3  f 170-250 "Let's launch it / with Launch Studio"  cursor rides the caret
//   Outro    f 246-330 cursor grows and turns into the Launch Studio mark, wordmark tracks in
(function (G) {
  const W = 1920, H = 1080, FPS = 30, TOTAL = 330;

  // ------------------------------------------------------------------ math
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
  const E = {
    lin: (t) => t,
    in2: (t) => t * t,
    out2: (t) => 1 - (1 - t) * (1 - t),
    io2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    in3: (t) => t * t * t,
    out3: (t) => 1 - Math.pow(1 - t, 3),
    io3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out5: (t) => 1 - Math.pow(1 - t, 5),
    in4: (t) => t * t * t * t,
    io5: (t) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
    outBack: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const ease = (name, t) => E[name](clamp(t, 0, 1));
  // keyframes [[frame, value, easeIntoThisKey], ...]
  function kf(pts) {
    return function (f) {
      if (f <= pts[0][0]) return pts[0][1];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (f <= b[0]) return lerp(a[1], b[1], ease(b[2] || "io3", (f - a[0]) / (b[0] - a[0])));
      }
      return pts[pts.length - 1][1];
    };
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
  function hex(h) { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    t = clamp(t, 0, 1);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  // ---------------------------------------------------------------- palette
  const C = {
    paper: "#F4F5F7",
    ink: "#232428",
    ink2: "#2C2D31",
    ghost: "#A9ADB5",
    blueDeep: "#0B2E9E",
    blue: "#1670E8",
    blueMid: "#2F8FF3",
    cyan: "#6CC8F8",
    sky: "#9FDcFF",
  };
  const FONT = '"Inter", "SF Pro Display", system-ui, sans-serif';

  // ------------------------------------------------------------- canvases
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

  // ------------------------------------------------------------ typing plan
  // Human-ish typing: uneven gaps, a breath at spaces. Returns the frame each char lands.
  function typeTimes(text, start, gap, seed) {
    const r = rng(seed), out = [];
    let t = start;
    for (let i = 0; i < text.length; i++) {
      out.push(t);
      const ch = text[i];
      t += gap * (0.65 + r() * 0.75) + (ch === " " ? gap * 0.9 : 0);
    }
    return out;
  }
  // Word-at-a-time lines: [[word, frame], ...] -> per char times
  function wordTimes(words) {
    const out = [];
    words.forEach(([w, t], i) => {
      for (let k = 0; k < w.length; k++) out.push(t);
      if (i < words.length - 1) out.push(t);
    });
    return out;
  }

  const S1L1 = { text: "You built", size: 196, weight: 640, times: typeTimes("You built", -5, 2.3, 7) };
  const S1L2 = { text: "the product", size: 118, weight: 420, times: wordTimes([["the", 31], ["product", 38]]) };
  const S2L1 = { text: "But nobody", size: 172, weight: 640, times: typeTimes("But nobody", 82, 2.1, 19) };
  const S2L2 = { text: "understands it.", size: 150, weight: 400, times: wordTimes([["understands", 104], ["it.", 115]]) };
  const S3L1 = { text: "Let's launch it", size: 172, weight: 640, times: typeTimes("Let's launch it", 175, 1.75, 31) };
  const S3L2 = { text: "with Launch Studio", size: 138, weight: 420, times: wordTimes([["with", 203], ["Launch", 209], ["Studio", 216]]), blueFrom: 5 };

  // ------------------------------------------------------------ text layout
  let meas = null;
  function setFont(g, line) {
    g.font = `${line.weight} ${line.size}px ${FONT}`;
    g.letterSpacing = `${(-0.034 * line.size).toFixed(2)}px`;
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
  }
  function prefixWidths(line) {
    if (line._pw && line._pwFont === document.fonts.status) return line._pw;
    if (!meas) meas = canvas(8, 8).getContext("2d");
    setFont(meas, line);
    const pw = [];
    for (let i = 0; i <= line.text.length; i++) pw.push(meas.measureText(line.text.slice(0, i)).width);
    line._pw = pw;
    line._pwFont = document.fonts.status;
    return pw;
  }
  const widthOf = (line) => { const pw = prefixWidths(line); return pw[pw.length - 1]; };
  // caret x (relative to line start) eased between char landings
  function caret(line, f) {
    const pw = prefixWidths(line), t = line.times;
    if (f < t[0]) return 0;
    for (let i = 0; i < t.length; i++) {
      const next = i + 1 < t.length ? t[i + 1] : t[i] + 3;
      if (f < next || i === t.length - 1) {
        const k = ease("out3", (f - t[i]) / Math.max(1.5, Math.min(4, next - t[i])));
        return lerp(pw[i], pw[i + 1], k);
      }
    }
    return pw[pw.length - 1];
  }

  // Blue gradient fill used for headline type and the mark.
  function blueGradient(g, x0, x1, y0, y1) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, "#0E5FD8");
    gr.addColorStop(0.28, "#2B88EE");
    gr.addColorStop(0.5, "#72CBF8");
    gr.addColorStop(0.66, "#3A9BF2");
    gr.addColorStop(1, "#1166E0");
    return gr;
  }

  // Draw a typed line into g. mode: "ink" | "blue" | "white".
  // Fresh characters arrive light and soft, then settle to ink (the reference's look).
  function drawLine(g, line, x, y, f, mode, opts) {
    opts = opts || {};
    const pw = prefixWidths(line), t = line.times;
    setFont(g, line);
    const blueFrom = line.blueFrom == null ? 1e9 : line.blueFrom;
    let anyBlue = false;
    // ink / white characters
    for (let i = 0; i < line.text.length; i++) {
      const ch = line.text[i];
      if (ch === " " || f < t[i]) continue;
      const age = f - t[i];
      const a = ease("out2", age / 3.2);
      const isBlue = mode === "blue" || i >= blueFrom;
      if (isBlue) { anyBlue = true; continue; }
      g.globalAlpha = a * (opts.alpha == null ? 1 : opts.alpha);
      if (mode === "white") g.fillStyle = "#FFFFFF";
      else g.fillStyle = mix(C.ghost, line.weight > 500 ? C.ink : C.ink2, ease("io2", (age - 1) / 7));
      g.fillText(ch, x + pw[i], y + (1 - a) * line.size * 0.05);
    }
    g.globalAlpha = 1;
    if (anyBlue) {
      // blue run goes through its own layer so one gradient spans the whole word group
      const L = buf("blueText");
      const lg = L.getContext("2d");
      setFont(lg, line);
      let xa = 1e9, xb = -1e9;
      for (let i = 0; i < line.text.length; i++) {
        const ch = line.text[i];
        const isBlue = mode === "blue" || i >= blueFrom;
        if (!isBlue) continue;
        xa = Math.min(xa, x + pw[i]); xb = Math.max(xb, x + pw[i + 1]);
        if (ch === " " || f < t[i]) continue;
        const a = ease("out2", (f - t[i]) / 3.2);
        lg.globalAlpha = a;
        lg.fillStyle = "#000";
        lg.fillText(ch, x + pw[i], y + (1 - a) * line.size * 0.05);
      }
      lg.globalAlpha = 1;
      lg.globalCompositeOperation = "source-in";
      // gradient slowly drifts so the sheen feels alive
      const sh = Math.sin(f * 0.035) * 0.12 * (xb - xa);
      lg.fillStyle = blueGradient(lg, xa - 40 + sh, xb + 40 + sh, y - line.size, y);
      lg.fillRect(0, 0, W, H);
      // a soft top highlight
      const hi = lg.createLinearGradient(0, y - line.size * 0.78, 0, y);
      hi.addColorStop(0, "rgba(255,255,255,0.22)");
      hi.addColorStop(0.45, "rgba(255,255,255,0)");
      hi.addColorStop(1, "rgba(0,30,120,0.10)");
      lg.globalCompositeOperation = "source-atop";
      lg.fillStyle = hi;
      lg.fillRect(0, 0, W, H);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
      // faint blue bloom under the type
      g.filter = "blur(14px)";
      g.globalAlpha *= 0.28;
      g.drawImage(L, 0, 6);
      g.filter = "none";
      g.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
      g.drawImage(L, 0, 0);
      g.restore();
    }
  }

  // ------------------------------------------------------------ background
  // Off-white paper with soft window-blind shadows and a pale frame column on the left.
  let BG = null;
  const BGW = 2700, BGH = 1500;
  function buildBG() {
    const c = canvas(BGW, BGH), g = c.getContext("2d");
    g.fillStyle = "#F1F2F5";
    g.fillRect(0, 0, BGW, BGH);
    const rg = g.createRadialGradient(BGW * 0.52, BGH * 0.42, 80, BGW * 0.5, BGH * 0.5, 1500);
    rg.addColorStop(0, "#FDFDFE");
    rg.addColorStop(0.55, "#F5F6F8");
    rg.addColorStop(1, "#E6E8EC");
    g.fillStyle = rg;
    g.fillRect(0, 0, BGW, BGH);
    // blind shadows: diagonal bands, very soft
    const s = canvas(BGW / 4, BGH / 4), sg = s.getContext("2d");
    sg.translate(s.width / 2, s.height / 2);
    sg.rotate((19 * Math.PI) / 180);
    const r = rng(3);
    for (let k = -6; k <= 6; k++) {
      const yy = k * 104 + r() * 30;
      sg.fillStyle = `rgba(120,126,140,${0.12 + r() * 0.06})`;
      sg.fillRect(-1200, yy, 2400, 26 + r() * 22);
    }
    sg.setTransform(1, 0, 0, 1, 0, 0);
    // window frame column + mullion
    sg.fillStyle = "rgba(120,126,140,0.12)";
    sg.fillRect(s.width * 0.215, 0, 30, s.height);
    sg.fillStyle = "rgba(120,126,140,0.08)";
    sg.fillRect(s.width * 0.83, 0, 22, s.height);
    g.filter = "blur(52px)";
    g.globalCompositeOperation = "multiply";
    g.drawImage(s, 0, 0, BGW, BGH);
    g.filter = "none";
    g.globalCompositeOperation = "source-over";
    // light leak, warm-white, upper right
    const lk = g.createRadialGradient(BGW * 0.72, BGH * 0.2, 10, BGW * 0.72, BGH * 0.2, 700);
    lk.addColorStop(0, "rgba(255,255,255,0.55)");
    lk.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lk;
    g.fillRect(0, 0, BGW, BGH);
    return c;
  }
  // film grain, a few precomputed tiles
  let GRAIN = null;
  function buildGrain() {
    const out = [];
    const r = rng(99);
    for (let n = 0; n < 4; n++) {
      const c = canvas(480, 270), g = c.getContext("2d");
      const im = g.createImageData(480, 270);
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

  // background drift: slow pan, plus parallax with the whip pan
  const bgPanX = kf([[0, 0], [330, -160, "lin"]]);
  function drawBG(g, f, whipX) {
    if (!BG) BG = buildBG();
    const breathe = Math.sin(f * 0.02) * 10;
    const x = -(BGW - W) / 2 + bgPanX(f) + whipX * 0.04;
    const y = -(BGH - H) / 2 + breathe - f * 0.18;
    g.drawImage(BG, x, y);
  }

  // ------------------------------------------------------------------ wave
  // A thick blurred ribbon of blues that rises from the bottom and sweeps off the top (scene 1 -> 2).
  const waveY = kf([[14, 1500], [48, 770, "out3"], [60, 700, "io2"], [84, -560, "in3"]]);
  const waveBow = kf([[14, 0.00022], [56, 0.00028], [84, 0.00005]]);
  function waveCenter(f, x) {
    const Y = waveY(f);
    return Y + waveBow(f) * (x - 980) * (x - 980) - 70 + Math.sin(x * 0.0021 + f * 0.09) * 46;
  }
  function drawWave(g, f) {
    if (f < 14 || f > 86) return;
    const s = 4, w = W / s, h = H / s;
    const c = buf("wave", w, h), wg = c.getContext("2d");
    const half = 330 / s;
    const path = (off, th) => {
      wg.beginPath();
      for (let i = -2; i <= w + 2; i += 2) wg.lineTo(i, (waveCenter(f, i * s) + off) / s - th);
      for (let i = w + 2; i >= -2; i -= 2) wg.lineTo(i, (waveCenter(f, i * s) + off) / s + th);
      wg.closePath();
    };
    // main band: light top edge, saturated body, deep navy belly
    path(0, half);
    const cy = waveY(f) / s;
    const gr = wg.createLinearGradient(0, cy - half - 40, 0, cy + half + 40);
    gr.addColorStop(0, "rgba(120,205,255,0.0)");
    gr.addColorStop(0.16, "rgba(96,190,250,0.95)");
    gr.addColorStop(0.42, "#1E7DEE");
    gr.addColorStop(0.62, "#1561DE");
    gr.addColorStop(0.86, "rgba(60,150,245,0.95)");
    gr.addColorStop(1, "rgba(150,210,255,0.0)");
    wg.fillStyle = gr;
    wg.fill();
    // travelling deep-navy lobes
    const lobes = [[0.78, 0.18, 1.0], [0.08, 0.1, 0.75]];
    lobes.forEach(([px, py, k], i) => {
      const lx = (px * W + Math.sin(f * 0.05 + i * 2) * 140 + (f - 50) * (i ? 3 : -4)) / s;
      const ly = (waveCenter(f, px * W) + 60 + py * 100) / s;
      const lg = wg.createRadialGradient(lx, ly, 2, lx, ly, 230 / s);
      lg.addColorStop(0, `rgba(8,30,140,${0.95 * k})`);
      lg.addColorStop(0.5, `rgba(10,45,170,${0.55 * k})`);
      lg.addColorStop(1, "rgba(10,45,170,0)");
      wg.fillStyle = lg;
      wg.save();
      wg.translate(lx, ly); wg.scale(1.9, 0.75); wg.translate(-lx, -ly);
      wg.fillRect(lx - 260 / s, ly - 260 / s, 520 / s, 520 / s);
      wg.restore();
    });
    // cyan highlight streak just under the top edge
    path(-half * s * 0.55, 18 / s * 1.6);
    wg.fillStyle = "rgba(170,228,255,0.55)";
    wg.fill();
    // soften everything
    const c2 = buf("wave2", w, h), g2 = c2.getContext("2d");
    g2.filter = "blur(13px)";
    g2.drawImage(c, 0, 0);
    g2.filter = "none";
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingQuality = "high";
    g.drawImage(c2, 0, 0, W, H);
    g.restore();
  }

  // ---------------------------------------------------------------- cursor
  // Glossy 3D navigation-arrow cursor. (x, y) is its centre, h its height, rot in degrees
  // (0 = pointing up), yaw squashes it as if turning in 3D.
  function cursorPath(g) {
    g.beginPath();
    g.moveTo(0, -0.5);
    g.bezierCurveTo(0.03, -0.5, 0.05, -0.47, 0.07, -0.43);
    g.lineTo(0.43, 0.36);
    g.bezierCurveTo(0.47, 0.45, 0.39, 0.5, 0.31, 0.46);
    g.quadraticCurveTo(0, 0.26, -0.31, 0.46);
    g.bezierCurveTo(-0.39, 0.5, -0.47, 0.45, -0.43, 0.36);
    g.lineTo(-0.07, -0.43);
    g.bezierCurveTo(-0.05, -0.47, -0.03, -0.5, 0, -0.5);
    g.closePath();
  }
  function drawCursor(g, cs) {
    if (!cs || cs.a <= 0 || cs.h <= 0.5) return;
    const { x, y, h, rot, a } = cs;
    const yaw = cs.yaw || 0, sx = (cs.sx || 1) * Math.max(0.12, Math.cos(yaw)), blur = cs.blur || 0;
    const L = buf("cursor"), lg = L.getContext("2d");
    const R = (rot * Math.PI) / 180;
    const place = (gg, dx, dy) => {
      gg.setTransform(1, 0, 0, 1, 0, 0);
      gg.translate(x + dx, y + dy);
      gg.rotate(R);
      gg.scale(h * 0.92 * sx, h);
    };
    // body
    place(lg, 0, 0);
    cursorPath(lg);
    const light = 0.5 + 0.5 * Math.sin(yaw + R * 0.6);
    const gr = lg.createLinearGradient(-0.45, -0.5, 0.45, 0.5);
    gr.addColorStop(0, mix("#56B9FF", "#7FD0FF", light));
    gr.addColorStop(0.45, "#1E86F6");
    gr.addColorStop(1, mix("#0A55D6", "#0B4CC4", light));
    lg.fillStyle = gr;
    lg.fill();
    // rim light along the notch
    lg.save();
    lg.clip();
    lg.lineWidth = 0.05;
    lg.strokeStyle = "rgba(140,215,255,0.5)";
    lg.beginPath();
    lg.moveTo(0.31, 0.46);
    lg.quadraticCurveTo(0, 0.26, -0.31, 0.46);
    lg.stroke();
    // specular on the left flank
    const sp = lg.createLinearGradient(-0.4, 0, 0.1, -0.1);
    sp.addColorStop(0, `rgba(255,255,255,${0.32 * (0.6 + 0.4 * light)})`);
    sp.addColorStop(1, "rgba(255,255,255,0)");
    lg.fillStyle = sp;
    lg.fillRect(-0.6, -0.6, 1.2, 1.2);
    // shade the right flank
    const sd = lg.createLinearGradient(0.05, 0, 0.45, 0.1);
    sd.addColorStop(0, "rgba(0,30,120,0)");
    sd.addColorStop(1, `rgba(0,30,120,${0.22 * (1 - light * 0.5)})`);
    lg.fillStyle = sd;
    lg.fillRect(-0.6, -0.6, 1.2, 1.2);
    lg.restore();
    lg.setTransform(1, 0, 0, 1, 0, 0);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    // soft coloured shadow on the paper
    g.globalAlpha = a * 0.42;
    g.filter = `blur(${(h * 0.12 + blur).toFixed(1)}px)`;
    g.drawImage(L, h * 0.05, h * 0.16);
    g.globalAlpha = a;
    g.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none";
    g.drawImage(L, 0, 0);
    g.restore();
  }

  // ------------------------------------------------------------------ logo
  const IMG = {};
  function img(name) {
    if (!IMG[name]) { IMG[name] = new Image(); IMG[name].src = "assets/" + name; }
    return IMG[name];
  }
  const LETTERS = {
    "launch.png": [[5, 351], [804, 1296], [1797, 2219], [2741, 3169], [3693, 4123], [4655, 5054]],
    "studio.png": [[4, 128], [428, 568], [870, 1015], [1329, 1482], [1792, 1819], [2126, 2298]],
  };
  const LK = 0.19; // mask px -> screen px (masks were traced at 6x the source logo)
  const MARK = { cx: 967, cy: 412, w: 2128 * LK, h: 1893 * LK };
  function drawMark(g, f, a, scale, blur) {
    const im = img("mark.png");
    if (!im.complete || !im.naturalWidth || a <= 0) return;
    const L = buf("mark"), lg = L.getContext("2d");
    const w = MARK.w * scale, h = MARK.h * scale, x = MARK.cx - w / 2, y = MARK.cy - h / 2;
    lg.drawImage(im, x, y, w, h);
    lg.globalCompositeOperation = "source-in";
    lg.fillStyle = blueGradient(lg, x, x + w, y, y + h);
    lg.fillRect(0, 0, W, H);
    // light sweep across the mark once it lands
    const sw = inv(270, 296, f);
    if (sw > 0 && sw < 1) {
      lg.globalCompositeOperation = "source-atop";
      const sx = lerp(x - w * 0.6, x + w * 1.4, ease("io2", sw));
      const s = lg.createLinearGradient(sx - 120, y, sx + 120, y + h * 0.4);
      s.addColorStop(0, "rgba(255,255,255,0)");
      s.addColorStop(0.5, "rgba(255,255,255,0.55)");
      s.addColorStop(1, "rgba(255,255,255,0)");
      lg.fillStyle = s;
      lg.fillRect(0, 0, W, H);
    }
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = a * 0.35;
    g.filter = `blur(${22 + blur}px)`;
    g.drawImage(L, 0, 18);
    g.globalAlpha = a;
    g.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none";
    g.drawImage(L, 0, 0);
    g.restore();
  }
  function drawWordmark(g, f, name, cy, start, stagger, spreadFrom) {
    const im = img(name);
    if (!im.complete || !im.naturalWidth) return;
    const segs = LETTERS[name];
    const totalW = im.naturalWidth * LK, h = im.naturalHeight * LK;
    const x0 = 960 - totalW / 2, y0 = cy - h / 2;
    g.save();
    segs.forEach(([a, b], i) => {
      const t = f - (start + i * stagger);
      if (t <= 0) return;
      const k = ease("out5", t / 16);
      const mid = (a + b) / 2 - im.naturalWidth / 2;
      const dx = mid * LK * (lerp(spreadFrom, 1, k) - 1);
      const bl = (1 - k) * 10;
      g.globalAlpha = ease("out2", t / 7);
      g.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : "none";
      const pad = 14;
      g.drawImage(im, a - pad, 0, b - a + pad * 2, im.naturalHeight,
        x0 + (a - pad) * LK + dx, y0 + (1 - k) * 18, (b - a + pad * 2) * LK, h);
    });
    g.restore();
  }

  // -------------------------------------------------------------- the film
  // Scene positions (layout space, before camera)
  function layoutS1() {
    const w1 = widthOf(S1L1);
    return { x1: 960 - w1 / 2, y1: 500, x2: 960 - w1 / 2 + 14, y2: 632 };
  }
  function layoutS2() {
    const w1 = widthOf(S2L1), w2 = widthOf(S2L2);
    const off = 150, tot = Math.max(w1, off + w2);
    const x1 = 960 - tot / 2;
    return { x1, y1: 470, x2: x1 + off, y2: 616, w1, w2 };
  }
  function layoutS3() {
    const w1 = widthOf(S3L1), w2 = widthOf(S3L2);
    const off = 110, tot = Math.max(w1 + 150, off + w2);
    const x1 = 960 - tot / 2;
    return { x1, y1: 470, x2: x1 + off, y2: 612, w1, w2 };
  }

  // camera: scale about screen centre + offset
  function applyCam(g, cam) {
    g.translate(960 + cam.x, 540 + cam.y);
    g.scale(cam.s, cam.s);
    g.translate(-960, -540);
  }
  const camPt = (cam, x, y) => [960 + cam.x + (x - 960) * cam.s, 540 + cam.y + (y - 540) * cam.s];

  // --- scene 1
  const s1Scale = kf([[0, 1.1], [44, 1.0, "out3"], [80, 0.97, "lin"]]);
  const s1Lift = kf([[24, 0], [70, -46, "io2"]]);
  function cam1(f) {
    // camera leans toward the caret while the first line types, then settles
    const lay = layoutS1(), w1 = widthOf(S1L1);
    const follow = (caret(S1L1, f) - w1) * 0.32 * (1 - ease("io3", inv(14, 34, f)));
    return { x: -follow * 0.9, y: s1Lift(f), s: s1Scale(f), lay };
  }
  function scene1(g, f) {
    const cam = cam1(f), lay = cam.lay;
    g.save();
    const L = buf("s1"), lg = L.getContext("2d");
    applyCam(lg, cam);
    drawLine(lg, S1L1, lay.x1, lay.y1, f, "blue");
    // swallowed as the wave's body passes over it
    const sy = camPt(cam, 960, lay.y1 - 60)[1];
    const gone = inv(sy + 120, sy - 140, waveCenter(f, 960));
    g.globalAlpha = 1 - ease("io2", gone);
    // depth of field: soft on arrival
    const bl = (1 - ease("out3", inv(0, 16, f))) * 7 + gone * 14;
    g.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : "none";
    g.drawImage(L, 0, 0);
    g.filter = "none";
    g.restore();
    return cam;
  }
  function scene1Over(g, f) {
    // the second line is white: it only reads where the wave is behind it
    const cam = cam1(f), lay = cam.lay;
    const sy = camPt(cam, 960, lay.y2 - 40)[1];
    const gone = inv(sy + 60, sy - 170, waveCenter(f, 960));
    if (gone >= 1) return;
    const L = buf("s1b"), lg = L.getContext("2d");
    applyCam(lg, cam);
    lg.shadowColor = "rgba(30,90,190,0.20)";
    lg.shadowBlur = 18;
    drawLine(lg, S1L2, lay.x2, lay.y2, f, "white");
    g.save();
    g.globalAlpha = 1 - ease("io2", gone);
    const bl = gone * 12;
    g.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : "none";
    g.drawImage(L, 0, 0);
    g.restore();
  }

  // --- scene 2
  const whipOut = kf([[156, 0], [171, -2500, "in4"]]);
  const whipIn = kf([[169, 2500], [187, 0, "out5"]]);
  const s2Scale = kf([[76, 1.06], [100, 1.0, "out3"], [158, 1.035, "lin"], [170, 1.09, "in3"]]);
  function cam2(f) { return { x: whipOut(f), y: -8 + Math.sin(f * 0.04) * 4, s: s2Scale(f) }; }
  function scene2(g, f) {
    const cam = cam2(f), lay = layoutS2();
    g.save();
    g.beginPath();
    g.moveTo(0, H);
    g.lineTo(W, H);
    for (let x = W; x >= 0; x -= 40) g.lineTo(x, waveCenter(f, x) + 40);
    g.closePath();
    g.clip();
    applyCam(g, cam);
    drawLine(g, S2L1, lay.x1, lay.y1, f, "ink");
    drawLine(g, S2L2, lay.x2, lay.y2, f, "ink");
    g.restore();
    return cam;
  }

  // --- scene 3
  const s3Scale = kf([[170, 1.08], [190, 1.0, "out3"], [246, 1.03, "lin"], [262, 1.12, "in3"]]);
  const s3Out = kf([[246, 0], [262, 1, "in2"]]);
  function cam3(f) { return { x: whipIn(f), y: -10 - s3Out(f) * 70, s: s3Scale(f) }; }
  function scene3(g, f) {
    const cam = cam3(f), lay = layoutS3();
    const out = s3Out(f);
    if (out >= 1) return cam;
    const L = buf("s3"), lg = L.getContext("2d");
    applyCam(lg, cam);
    drawLine(lg, S3L1, lay.x1, lay.y1, f, "ink");
    drawLine(lg, S3L2, lay.x2, lay.y2, f, "ink");
    g.save();
    g.globalAlpha = 1 - out;
    const bl = out * 16;
    g.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : "none";
    g.drawImage(L, 0, 0);
    g.restore();
    return cam;
  }

  // --- cursor choreography
  const c2Pop = (f) => ease("outBack", (f - 88) / 12);
  const c2Rot = kf([[100, 0], [109, -34, "io3"], [119, 28, "io3"], [128, -12, "io3"], [136, 4, "io3"], [142, 0], [158, 90, "io5"]]);
  const c2Yaw = kf([[100, 0], [109, 0.5], [119, -0.55], [128, 0.25], [136, 0]]);
  function cursorAt(f) {
    if (f < 88) return null;
    const lay2 = layoutS2();
    // scene 2 home: under the text, then drifts toward "understands"
    const hx = kf([[88, lay2.x1 + lay2.w1 * 0.42], [104, lay2.x1 + lay2.w1 * 0.42], [126, lay2.x2 + lay2.w2 * 0.45, "io3"], [158, lay2.x2 + lay2.w2 * 0.62, "io2"]])(f);
    const hy = kf([[88, 790], [104, 770], [126, 760], [140, 752], [158, 748]])(f) + Math.sin(f * 0.16) * 5;
    const p = c2Pop(f);
    const cs2 = (() => {
      const cam = cam2(Math.min(f, 156));
      const [sx, sy] = camPt(cam, hx, hy + (1 - clamp(p, 0, 1)) * 70);
      return { x: sx, y: sy, h: 118 * cam.s * Math.max(0, p), rot: c2Rot(f), yaw: c2Yaw(f), a: clamp(p * 2, 0, 1) };
    })();
    if (f < 156) return cs2;
    // scene 3: rides just right of the caret on line 1
    const s3 = (ff) => {
      const lay3 = layoutS3(), cam = cam3(ff);
      const cx = lay3.x1 + caret(S3L1, ff + 2) + 100;
      const [sx, sy] = camPt(cam, cx, lay3.y1 - 70 + Math.sin(ff * 0.15) * 4);
      return { x: sx, y: sy, h: 104 * cam.s, rot: 72 + Math.sin(ff * 0.11) * 4, yaw: 0.25 + Math.sin(ff * 0.07) * 0.15, a: 1 };
    };
    if (f < 182) {
      // hand-off through the whip pan: cursor stays on screen, leading the move
      const end = s3(182);
      const k = ease("io3", inv(156, 182, f));
      const arc = Math.sin(k * Math.PI) * -60;
      const st = cs2;
      return {
        x: lerp(st.x, end.x, k), y: lerp(st.y, end.y, k) + arc,
        h: lerp(st.h, end.h, k), rot: lerp(90, end.rot, k), yaw: lerp(0, end.yaw, k),
        sx: 1 + Math.sin(k * Math.PI) * 0.18, a: 1, blur: Math.sin(k * Math.PI) * 2.5,
      };
    }
    if (f < 246) return s3(f);
    // outro: cursor glides to the logo spot, turns up and grows into the mark
    const st = s3(246);
    const k = ease("io3", inv(246, 268, f));
    const fade = 1 - ease("io2", inv(262, 272, f));
    return {
      x: lerp(st.x, MARK.cx, k), y: lerp(st.y, MARK.cy + 6, k),
      h: lerp(st.h, MARK.h * 1.02, k), rot: lerp(st.rot, 0, ease("io3", inv(246, 264, f))),
      yaw: lerp(st.yaw, 0, k), sx: lerp(1, 1.28, ease("io3", inv(254, 270, f))),
      a: fade, blur: inv(262, 272, f) * 8,
    };
  }

  // ------------------------------------------------------------ assemble
  function drawFG(g, f) {
    if (f < 86) scene1(g, f);
    if (f >= 74 && f < 174) scene2(g, f);
    if (f >= 168 && f < 264) scene3(g, f);
  }
  // horizontal motion blur samples during the whip
  function whipSpeed(f) { return Math.abs(whipOut(f + 0.5) - whipOut(f - 0.5)) + Math.abs(whipIn(f + 0.5) - whipIn(f - 0.5)); }

  function draw(ctx, f) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    ctx.clearRect(0, 0, W, H);
    drawBG(ctx, f, whipOut(f) + whipIn(f) - 2500);

    // foreground with shutter (accumulated sub-frames when moving fast)
    const sp = whipSpeed(f);
    if (sp > 40) {
      const N = 24, A = buf("acc"), ag = A.getContext("2d"), S = buf("smp"), sg = S.getContext("2d");
      for (let i = 0; i < N; i++) {
        sg.setTransform(1, 0, 0, 1, 0, 0);
        sg.clearRect(0, 0, W, H);
        drawFG(sg, f - 0.7 + i / (N - 1) * 0.7);
        ag.globalAlpha = 1 / (i + 1);
        ag.drawImage(S, 0, 0);
      }
      // a touch of extra softness at peak speed hides the sub-frame steps
      const sb = Math.min(10, sp * 0.012);
      ctx.save();
      ctx.filter = sb > 0.3 ? `blur(${sb.toFixed(1)}px)` : "none";
      ctx.drawImage(A, 0, 0);
      ctx.restore();
    } else {
      drawFG(ctx, f);
    }

    drawWave(ctx, f);
    if (f < 86) scene1Over(ctx, f);

    // logo
    if (f >= 258) {
      const k = inv(260, 274, f);
      const sc = lerp(0.9, 1, ease("out3", k)) * (1 + inv(274, 330, f) * 0.02);
      drawMark(ctx, f, ease("io2", k), sc, (1 - ease("out3", k)) * 10);
      const W2 = buf("wm"), wg = W2.getContext("2d");
      drawWordmark(wg, f, "launch.png", 722, 276, 2.2, 0.82);
      drawWordmark(wg, f, "studio.png", 831, 292, 1.6, 1.35);
      wg.globalCompositeOperation = "source-in";
      wg.fillStyle = C.ink;
      wg.fillRect(0, 0, W, H);
      ctx.drawImage(W2, 0, 0);
    }

    drawCursor(ctx, cursorAt(f));

    // final soft vignette + grain
    if (!GRAIN) GRAIN = buildGrain();
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.05;
    ctx.drawImage(GRAIN[Math.floor(f) % 4], 0, 0, W, H);
    ctx.restore();
  }

  // ------------------------------------------------------------- sound cues
  // Frame times of every sound event, used by scripts/make-audio.mjs.
  function cues() {
    const ev = [];
    const keys = (line, vel) => line.times.forEach((t, i) => { if (line.text[i] !== " " && (i === 0 || line.times[i - 1] !== t)) ev.push({ f: t, type: "key", v: vel }); });
    keys(S1L1, 1); keys(S1L2, 0.6); keys(S2L1, 1); keys(S2L2, 0.7); keys(S3L1, 1); keys(S3L2, 0.7);
    ev.push({ f: 16, type: "swell" });
    ev.push({ f: 88, type: "pop" });
    ev.push({ f: 108, type: "tick" }, { f: 118, type: "tick" }, { f: 127, type: "tick" });
    ev.push({ f: 154, type: "whoosh" });
    ev.push({ f: 246, type: "riser" });
    ev.push({ f: 266, type: "impact" });
    ev.push({ f: 276, type: "shimmer" });
    return ev;
  }

  G.FILM = { W, H, FPS, TOTAL, draw, cues };
})(typeof window !== "undefined" ? window : globalThis);
