// Frames 48-101: a dark slash on flat orange; the orange shrinks to a square while a diamond grows
// through the slash; the square turns into a glowing wireframe that cycles glyphs ( > + . < ),
// tips into a cube and dives in; cut to two solid cubes on orange; the camera pulls back as the
// cubes tumble down and click together into the Fluxdesk mark.
(function () {
  const K = window.K;
  const OR = "#EF5F2E", WIRE = "#FF5A26", NODE = "#FF6A33", DARK = "#4E0A04";
  const D2R = Math.PI / 180;

  // ------------------------------------------------------------------ grounds
  function darkGrid(ctx, f, cell, ox, oy) {
    K.fill(ctx, "#0B0302");
    K.ember(ctx, 960, 540, 900, "#4A0C04", 0.35);
    K.glow(ctx, (g) => K.grid(g, { cell, ox, oy, color: "#D0201A", alpha: 0.38, width: 1.6, dots: true }), { blur: 6, alpha: 0.6 });
  }

  // ------------------------------------------------------- slash + XOR shapes
  function slashPath(g, cx, cy, s) {
    // parallelogram: top edge 160 wide at y-460, bottom edge at y+450 (measured on the full slash)
    const P = [[100, -460], [260, -460], [-100, 450], [-260, 450]];
    g.beginPath();
    P.forEach(([x, y], i) => (i ? g.lineTo(cx + x * s, cy + y * s) : g.moveTo(cx + x * s, cy + y * s)));
    g.closePath();
  }
  function rectPath(g, cx, cy, w, h, rot) {
    g.save(); g.translate(cx, cy); g.rotate(rot); g.rect(-w / 2, -h / 2, w, h); g.restore();
  }
  // the square's content: slash XOR a growing rotated block
  function glyphMix(ctx, f, cx, cy, s) {
    const c = K.buf("xor"), g = c.getContext("2d");
    g.fillStyle = DARK;
    slashPath(g, cx, cy, s); g.fill();
    if (f >= 50) {
      g.globalCompositeOperation = "xor";
      g.beginPath();
      if (f === 50) {
        rectPath(g, cx, cy, 80, 80, 30 * D2R); g.fill();
        g.beginPath(); rectPath(g, cx + 2, cy, 46, 46, -12 * D2R);
      } else if (f === 51) rectPath(g, cx, cy, 270, 270, 45 * D2R);
      else rectPath(g, cx, cy, 330, 300, 30 * D2R);
      g.fill();
    }
    ctx.drawImage(c, 0, 0);
  }

  function orangePhase(ctx, f) {
    if (f <= 49) {
      K.fill(ctx, OR);
      K.grid(ctx, { cell: 240, ox: 120, oy: 60, color: "#FF8050", alpha: 0.12, width: 1.4 });
      ctx.save(); ctx.globalAlpha = 0.9; ctx.filter = "blur(1.2px)";
      glyphMix(ctx, f, 960, 535, 1); ctx.restore();
      K.glyph(ctx, "+", 960, 535, 30, "rgba(255,200,180,0.45)", 0, { weight: 0.1 });
      return;
    }
    darkGrid(ctx, f, 226, 960 - 226 * 2, 540 - 226);
    const side = K.key([[50, 1470], [51, 932], [52, 668], [53, 544]])(f);
    const cy = f >= 53 ? 523 : 540, cx = f >= 53 ? 978 : 961;
    K.glow(ctx, (g) => { g.fillStyle = "#F0602E"; g.fillRect(cx - side / 2, cy - side / 2, side, side); }, { blur: 26, alpha: 0.7, mode: "lighter" });
    if (f <= 52) {
      const s = { 50: 0.75, 51: 0.62, 52: 0.53 }[f];
      glyphMix(ctx, f, 960, 540, s);
    }
  }

  // ------------------------------------------------------------- wire cube
  // camera keys for the wire cube (degrees); the face-on square turns, tips and dives
  const CAM = {
    rz: K.key([[53, 18], [55, 11.6], [56, 6], [57, 2.3], [58, 1.1], [63, -1.1], [66, -5.2], [68, -12.5], [70, -17], [71, -28], [72, -45], [73, 8], [75, 0], [76, 2]]),
    rx: K.key([[53, 0], [65, 0], [66, 4], [68, 6], [70, 9], [71, 12], [72, 16], [73, 34], [75, 35.3], [76, 32]]),
    ry: K.key([[53, 0], [65, 0], [66, -3], [68, -4], [70, -5], [71, -6], [72, 10], [73, -36], [75, -45], [76, -60]]),
    s: K.key([[53, 0.83], [55, 0.9], [56, 0.944], [57, 0.98], [58, 0.996], [63, 1.0], [66, 1.02], [68, 1.05], [70, 1.09], [71, 1.13], [72, 1.25], [73, 1.12], [75, 1.27], [76, 1.5]]),
    cx: K.key([[53, 960], [55, 960], [58, 956], [63, 958], [70, 960], [71, 967], [72, 958], [73, 950], [75, 954], [76, 820]]),
    cy: K.key([[53, 545], [55, 537], [58, 539], [70, 540], [71, 560], [72, 540], [73, 540], [75, 540], [76, 560]]),
  };
  const DIVE = {
    rx: K.key([[73, 16.4], [75, 32.5], [76, 16.4]]),
    ry: K.key([[73, -40.8], [75, -49.2], [76, -41]]),
    rz: K.key([[73, 20], [75, 2.4], [76, -17.4]]),
    s: K.key([[73, 1.42], [75, 1.61], [76, 1.69]]),
    cx: K.key([[73, 1186], [75, 1190], [76, 1000]]),
    cy: K.key([[73, 573], [75, 409], [76, 392]]),
  };
  const GLY = K.step([[53, ">"], [58, "+"], [63, "."], [68, "<"], [74, null]]);
  const GSZ = K.key([[53, 480], [55, 480], [56, 430], [57, 400], [58, 345], [60, 330], [62, 300], [63, 170], [67, 170], [68, 380], [70, 340], [73, 240]]);

  function cubeVerts(e, cam, off) {
    const V = [];
    for (const z of [-e, e]) for (const y of [-e, e]) for (const x of [-e, e]) V.push(K.proj([x + (off || 0), y, z], cam));
    return V;
  }
  const EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

  function wire(ctx, f) {
    const gcell = K.key([[53, 226], [63, 250], [70, 270], [75, 340]])(f);
    darkGrid(ctx, f, gcell, 960 - gcell * 2, 540 - gcell);
    if (f <= 54) orangePhase(ctx, 53);
    // from 73 the dive uses the solid-cube camera (fitted to the reference), with the second cube
    // beside the first, so the cut to the solid cubes at 77 is seamless
    const dive = f >= 73;
    const cam = dive
      ? { rx: DIVE.rx(f) * D2R, ry: DIVE.ry(f) * D2R, rz: DIVE.rz(f) * D2R, d: 2200, s: DIVE.s(f), cx: DIVE.cx(f), cy: DIVE.cy(f) }
      : { rx: CAM.rx(f) * D2R, ry: CAM.ry(f) * D2R, rz: CAM.rz(f) * D2R, d: 1700, s: CAM.s(f), cx: CAM.cx(f), cy: CAM.cy(f) };
    const e = dive ? 200 : 250;
    const cubes = dive ? [-200, 200 + K.key([[73, 170], [75, 180], [76, 60]])(f)] : [0];
    const front = f <= 54;
    if (front) {
      // dark face filling the turning square
      const V = cubeVerts(e, cam);
      ctx.beginPath(); [0, 1, 3, 2].forEach((i, k) => (k ? ctx.lineTo(V[i][0], V[i][1]) : ctx.moveTo(V[i][0], V[i][1]))); ctx.closePath();
      ctx.fillStyle = "#140302"; ctx.fill();
    }
    const showBack = f >= 70;
    K.glow(ctx, (g) => {
      g.strokeStyle = WIRE; g.lineWidth = dive ? 8 : 6.5; g.lineJoin = "round";
      cubes.forEach((off, ci) => {
        const V = cubeVerts(e, cam, off);
        const far = V.reduce((m, p, i) => (p[2] < V[m][2] ? i : m), 0);
        // the second cube shows only its front face and its outer side, as in the reference
        const keep2 = [0, 1, 2, 3, 9, 11, 5];
        EDGES.forEach(([a, b], i) => {
          if (ci === 1 && !keep2.includes(i)) return;
          if (!showBack && i >= 4) return;
          if (f >= 72 && (a === far || b === far)) return;
          g.beginPath(); g.moveTo(V[a][0], V[a][1]); g.lineTo(V[b][0], V[b][1]); g.stroke();
        });
        const n = 22 * Math.min(1.8, Math.sqrt(cam.s));
        g.fillStyle = NODE;
        V.forEach((p, i) => {
          if ((!showBack && i >= 4) || (f >= 72 && i === far)) return;
          if (ci === 1 && (i === 4 || i === 6)) return;
          if (!dive) { g.fillRect(p[0] - n / 2, p[1] - n / 2, n, n); return; }
          // hexagon nodes with small corner brackets once the cube is close
          const r = 27 * cam.s / 1.5;
          g.beginPath();
          for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; k ? g.lineTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r) : g.moveTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r); }
          g.fill();
          g.save(); g.strokeStyle = K.rgba(NODE, 0.6); g.lineWidth = 1.5; const b = r * 1.45, l = r * 0.5;
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { g.beginPath(); g.moveTo(p[0] + sx * b, p[1] + sy * (b - l)); g.lineTo(p[0] + sx * b, p[1] + sy * b); g.lineTo(p[0] + sx * (b - l), p[1] + sy * b); g.stroke(); });
          g.restore();
        });
      });
      const gl = GLY(f);
      if (gl) {
        const c = K.proj([0, 0, -e], cam), s = GSZ(f);
        g.strokeStyle = K.rgba(NODE, 0.5); g.lineWidth = 1.5;
        const b = s * 0.42;
        // corner brackets round the glyph
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
          g.beginPath(); g.moveTo(c[0] + sx * b, c[1] + sy * b * 0.6); g.lineTo(c[0] + sx * b, c[1] + sy * b); g.lineTo(c[0] + sx * b * 0.6, c[1] + sy * b); g.stroke();
        });
        K.glyph(g, gl, c[0], c[1], s, front ? "#F0602E" : NODE, cam.rz, { weight: 0.12 });
      }
    }, { blur: 12, alpha: 0.85, passes: 2, mode: "lighter" });
    // the glyph again, crisp on top of its glow
    const gl = GLY(f);
    if (gl) { const c = K.proj([0, 0, -e], cam); K.glyph(ctx, gl, c[0], c[1], GSZ(f), front ? "#F0602E" : NODE, cam.rz, { weight: 0.12 }); }
    // dashed construction lines with arrows
    const dc = "rgba(255,225,210,0.6)";
    cubes.forEach((off) => {
      const V = cubeVerts(e, cam, off);
      K.dashed(ctx, V[0][0], V[0][1], V[3][0], V[3][1], { color: dc, width: 1.3 });
      K.dashed(ctx, V[1][0], V[1][1], V[2][0], V[2][1], { color: dc, width: 1.3 });
      K.dashed(ctx, V[0][0], V[0][1], V[1][0], V[1][1], { color: dc, width: 1.3 });
      K.dashed(ctx, V[3][0], V[3][1], V[2][0], V[2][1], { color: dc, width: 1.3 });
      if (showBack) {
        K.dashed(ctx, V[0][0], V[0][1], V[7][0], V[7][1], { color: dc, width: 1.3 });
        K.dashed(ctx, V[4][0], V[4][1], V[3][0], V[3][1], { color: dc, width: 1.3 });
      }
    });
  }

  // ---------------------------------------------------------- solid boxes
  // box with half extents (ex, ey, ez) at world offset o, drawn with dark radial faces and lit edges
  function solidBox(ctx, cam, o, ex, ey, ez, st) {
    st = st || {};
    const V = [];
    for (const z of [-ez, ez]) for (const y of [-ey, ey]) for (const x of [-ex, ex]) V.push(K.proj([x + o[0], y + o[1], z + o[2]], cam));
    const F = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
    // painter's order: farthest faces first (k grows toward the camera); fills first, then the
    // three faces toward the camera get their lit edges, so no fill cuts a stroke in half
    const faces = F.map((idx) => ({ idx, k: idx.reduce((a, i) => a + V[i][2], 0) })).sort((a, b) => a.k - b.k);
    const path = (P) => { ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
    faces.forEach(({ idx }) => {
      const P = idx.map((i) => V[i]);
      const mx = P.reduce((a, p) => a + p[0], 0) / 4, my = P.reduce((a, p) => a + p[1], 0) / 4;
      const r = Math.max(...P.map((p) => Math.hypot(p[0] - mx, p[1] - my)));
      path(P);
      if (st.flat) ctx.fillStyle = st.flat;
      else {
        const gr = ctx.createRadialGradient(mx, my, 0, mx, my, r);
        gr.addColorStop(0, "#000000"); gr.addColorStop(0.6, "#160101"); gr.addColorStop(0.92, "#3A0703"); gr.addColorStop(1, "#6A1206");
        ctx.fillStyle = gr;
      }
      ctx.fill();
      if (st.flat) { ctx.strokeStyle = st.edge || "#F2602E"; ctx.lineWidth = st.lw || 3; ctx.lineJoin = "round"; ctx.stroke(); }
    });
    if (!st.flat) {
      ctx.save();
      ctx.strokeStyle = st.edge || "#F2602E"; ctx.lineWidth = st.lw || 3; ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255,110,60,0.8)"; ctx.shadowBlur = st.lw * 1.6;
      faces.slice(3).forEach(({ idx }) => { path(idx.map((i) => V[i])); ctx.stroke(); });
      ctx.restore();
    }
    if (st.nodes) {
      // a hexagon node on the corner nearest the camera
      const near = V.reduce((m, p, i) => (p[2] > V[m][2] ? i : m), 0), p = V[near];
      ctx.save();
      ctx.fillStyle = "#F4683A"; ctx.shadowColor = "rgba(255,120,70,0.9)"; ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; const x = p[0] + Math.cos(a) * st.nodes, y = p[1] + Math.sin(a) * st.nodes; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.fill();
      ctx.restore();
    }
  }

  // two solid cubes on orange, slowly settling to an iso view
  // camera fitted to corner positions measured on the reference; dz slides the right cube forward
  const SOL = {
    rx: K.key([[77, 48], [78, 45.1], [80, 40], [81, 38.5], [83, 36.5], [85, 35.2], [86, 35], [88, 34], [90, 33], [91, 32.5]]),
    ry: K.key([[77, -57], [78, -55.2], [80, -50.9], [81, -48.5], [83, -45.5], [85, -43.3], [86, -43.3], [88, -43.3], [90, -43.3], [91, -43.3]]),
    rz: K.key([[77, 20], [78, 14.2], [80, 6.4], [81, 4], [83, 1], [85, -0.8], [86, -0.8], [88, -0.5], [90, 0], [91, 0]]),
    s: K.key([[77, 2.15], [78, 2.05], [80, 1.9], [81, 1.88], [83, 1.82], [85, 1.8], [86, 1.8], [88, 1.79], [90, 1.79], [91, 1.79]]),
    cx: K.key([[77, 820], [78, 800], [80, 771], [81, 760], [83, 740], [85, 726], [86, 726], [88, 722], [90, 715], [91, 712]]),
    cy: K.key([[77, 470], [78, 540], [80, 632], [81, 670], [83, 718], [85, 745], [86, 750], [88, 760], [90, 770], [91, 775]]),
    gap: K.key([[77, 30], [78, 30], [80, 45], [81, 30], [83, 10], [85, 0], [86, 0], [88, 0], [90, 0], [91, 0]]),
    dz: K.key([[77, 0], [78, 0], [80, 0], [81, 0], [83, 0], [85, 0], [86, -40], [88, -160], [90, -320], [91, -400]]),
  };
  function solids(ctx, f) {
    K.fill(ctx, "#F15E31");
    const gc = K.key([[77, 500], [85, 520], [91, 500]])(f);
    K.grid(ctx, { cell: gc, ox: 230 - (f - 77) * 6, oy: 130 - (f - 77) * 4, color: "#4A0E04", alpha: 0.7, width: 2.2 });
    const cam = { rx: SOL.rx(f) * D2R, ry: SOL.ry(f) * D2R, rz: SOL.rz(f) * D2R, d: 2200, s: SOL.s(f), cx: SOL.cx(f), cy: SOL.cy(f) };
    const e = 200, gp = SOL.gap(f);
    const st = { nodes: 28, lw: 8 };
    // farther cube first
    const dz = SOL.dz(f) / 2;
    [[e + gp / 2, 0, dz], [-e - gp / 2, 0, -dz]]
      .map((o) => ({ o, k: K.proj(o, cam)[2] }))
      .sort((a, b) => a.k - b.k)
      .forEach(({ o }) => solidBox(ctx, cam, o, e, e, e, st));
  }

  // ------------------------------------------------- pull back into the mark
  // blocks: the 2-long bar becomes the bottom row, the two cubes stack into the top-right block
  const MB = 150, MC = 165, MX = 900, MY = 540; // final block size, cell, mark centre
  const CELL = (i, j) => [MX + (i - 0.5) * MC, MY + (j - 0.5) * MC];
  const pathXY = (pts) => { const X = K.key(pts.map((p) => [p[0], p[1]])), Y = K.key(pts.map((p) => [p[0], p[2]])); return (f) => [X(f), Y(f)]; };
  const BAR = pathXY([[91, -300, -260], [92, 305, 60], [93, 480, 130], [95, 680, 315], [96, 880, 600], [97, 897, 618], [98, 900, 622], [101, 900, 622]]);
  const CA = pathXY([[92, 980, 700], [93, 1010, 650], [95, 980, 700], [96, 1060, 420], [97, 1000, 445], [98, 984, 456], [101, 982, 458]]);
  const CB = pathXY([[92, 1240, 700], [93, 1200, 640], [95, 1180, 590], [96, 1150, 500], [97, 1040, 470], [98, 990, 460], [101, 982, 458]]);
  const BS = K.key([[92, 250], [93, 225], [95, 180], [96, 150], [97, 148], [98, 145], [101, 150]]);
  const TUMBLE = {
    rx: K.key([[92, 35], [93, 40], [95, 28], [96, 10], [97, 8], [98, 6], [100, 2], [101, 1]]),
    ry: K.key([[92, -45], [93, -30], [95, -20], [96, -12], [97, -10], [98, -14], [100, -9], [101, -8]]),
    rz: K.key([[92, 0], [93, -18], [95, -14], [96, -4], [97, -6], [98, -3], [100, -1], [101, 0]]),
  };
  function blocks(ctx, f) {
    K.fill(ctx, "#F15E31");
    const gc = K.key([[92, 504], [93, 400], [95, 262], [96, 222], [97, 204], [98, 194], [101, 192]])(f);
    K.grid(ctx, { cell: gc, ox: 960, oy: f >= 96 ? 560 : 56, color: "#4A0E04", alpha: 0.75, width: 2 });
    const b = BS(f);
    const cam = (x, y, extra) => ({ rx: (TUMBLE.rx(f) + (extra || 0)) * D2R, ry: TUMBLE.ry(f) * D2R, rz: TUMBLE.rz(f) * D2R, d: 2600, s: 1, cx: x, cy: y });
    const st = { flat: "#4A0803", edge: "#E8562A", lw: 2 };
    const [bx, by] = BAR(f);
    // bar: two blocks long; tumbles end-over-end before it lands
    const barCam = cam(bx, by);
    if (f <= 95) barCam.rz = (K.key([[92, 0], [93, 22], [95, 14]])(f)) * D2R;
    solidBox(ctx, barCam, [0, 0, 0], b * 1.05, b / 2, b / 2, st);
    const [ax, ay] = CA(f), [cx2, cy2] = CB(f);
    solidBox(ctx, cam(cx2, cy2, 6), [0, 0, 0], b / 2, b / 2, b / 2, st);
    solidBox(ctx, cam(ax, ay), [0, 0, 0], b / 2, b / 2, b / 2, st);
  }

  K.SCENES = K.SCENES || {};
  K.SCENES.forge = function (ctx, f, cv) {
    if (f <= 52) orangePhase(ctx, f);
    else if (f <= 76) wire(ctx, f);
    else if (f <= 91) solids(ctx, f);
    else blocks(ctx, f);
    if (f >= 50 && f <= 76) K.vignette(ctx, 0.5);
    K.bloom(cv, f >= 50 && f <= 76 ? 0.25 : 0.08, 50);
    K.grain(ctx, f, 0.05);
  };
  K.forgeMark = { MB, MC, MX, MY, CELL };
})();
