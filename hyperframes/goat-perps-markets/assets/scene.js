// GOAT Funded Perps: "100+ perpetual markets" (231 frames @ 30 fps), rebuilt from the supplied reference clip
// ("Rules running in the background" -> Holding times / Exposure limits / News windows / Consistency checks) in the
// Perps brand, timed to the supplied voiceover:
//   "Access over 100 perpetual markets, including crypto, forex, indices, commodities, and stocks, all in one place."
// Everything lives in one three.js space: a field of glass market cards, the headline on its own plane, and a camera
// that glides between them. Each output frame averages several sub-frame renders (true motion blur) and then gets a
// thin-lens depth of field focused on whatever the camera is looking at. render(f) is a pure function of f.
(function () {
  const FPS = 30, FRAMES = 231, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const ease = (x) => { const t = clamp(x, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = (x, p) => 1 - Math.pow(1 - clamp(x, 0, 1), p || 3);
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const FB = "Altform, sans-serif";
  const ORANGE = "#EC8B1B", HOT = "#F6A03A";

  // ---------------- timing (frames), from the voiceover's word times ----------------
  // crypto 3.00 s, forex 3.80, indices 4.46, commodities 5.08, stocks 5.82, "all in one place" 6.64
  const HEAD_IN = 9, HEAD_DONE = 40, HEAD_FLARE = 72;
  const LAND = [90, 114, 134, 152, 175]; // the camera whips onto each card on its spoken word (as in the reference)
  const MOVE = 6;                         // half-width of a switch, for the card brightness ramps
  const PULL = [192, 222];                // "all in one place": the camera draws back over the whole set

  // ---------------- textures ----------------
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const CW = 640, CH = 500;
  function icon(g, kind, cx, cy, s, col) {
    g.strokeStyle = g.fillStyle = col; g.lineWidth = s * 0.11; g.lineCap = "round"; g.lineJoin = "round";
    if (kind === "crypto") { g.font = `600 ${s * 1.15}px ${FB}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("₿", cx, cy + s * 0.04); }
    if (kind === "forex") { // two arrows, exchange
      g.beginPath(); g.moveTo(cx - s * 0.45, cy - s * 0.18); g.lineTo(cx + s * 0.4, cy - s * 0.18); g.lineTo(cx + s * 0.2, cy - s * 0.38); g.stroke();
      g.beginPath(); g.moveTo(cx + s * 0.45, cy + s * 0.18); g.lineTo(cx - s * 0.4, cy + s * 0.18); g.lineTo(cx - s * 0.2, cy + s * 0.38); g.stroke(); }
    if (kind === "indices") { [[-0.36, 0.25], [-0.12, 0.05], [0.12, -0.12], [0.36, -0.32]].forEach(([x, h]) => { g.beginPath(); g.moveTo(cx + x * s, cy + s * 0.38); g.lineTo(cx + x * s, cy + h * s); g.stroke(); }); }
    if (kind === "commodities") { // gold bars
      const bar = (x, y) => { g.beginPath(); g.moveTo(x - s * 0.28, y + s * 0.13); g.lineTo(x - s * 0.19, y - s * 0.13); g.lineTo(x + s * 0.19, y - s * 0.13); g.lineTo(x + s * 0.28, y + s * 0.13); g.closePath(); g.stroke(); };
      bar(cx - s * 0.2, cy + s * 0.18); bar(cx + s * 0.2, cy + s * 0.18); bar(cx, cy - s * 0.12); }
    if (kind === "stocks") { g.beginPath(); g.moveTo(cx - s * 0.45, cy + s * 0.3); g.lineTo(cx - s * 0.12, cy - s * 0.02); g.lineTo(cx + s * 0.08, cy + s * 0.14); g.lineTo(cx + s * 0.45, cy - s * 0.3); g.stroke();
      g.beginPath(); g.moveTo(cx + s * 0.2, cy - s * 0.32); g.lineTo(cx + s * 0.46, cy - s * 0.31); g.lineTo(cx + s * 0.45, cy - s * 0.06); g.stroke(); }
    if (kind === "dot") { g.beginPath(); g.arc(cx, cy, s * 0.22, 0, 7); g.fill(); }
  }
  // the reference card, in Perps colours: dark warm glass, an inner panel with an icon tile and a two-line label,
  // and a status bar along the bottom (the reference's "HIDDEN", here a live orange "LIVE")
  function cardTex(title, kind, dim) {
    const c = document.createElement("canvas"); c.width = CW; c.height = CH;
    const g = c.getContext("2d"), r = 54;
    g.save(); rr(g, 0, 0, CW, CH, r); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, `rgba(58,36,18,${dim ? 0.82 : 0.9})`); bg.addColorStop(1, `rgba(30,18,9,${dim ? 0.82 : 0.9})`);
    g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
    const sheen = g.createLinearGradient(0, 0, CW * 0.6, CH); sheen.addColorStop(0, "rgba(255,220,180,0.09)"); sheen.addColorStop(0.5, "rgba(255,220,180,0)");
    g.fillStyle = sheen; g.fillRect(0, 0, CW, CH);
    const p = 38, ph = 250;
    rr(g, p, p, CW - 2 * p, ph, 34); g.fillStyle = "rgba(255,235,215,0.055)"; g.fill();
    g.lineWidth = 2; g.strokeStyle = "rgba(255,200,150,0.07)"; g.stroke();
    const ts = 132, tx = p + 36, ty = p + (ph - ts) / 2;
    rr(g, tx, ty, ts, ts, 34); g.fillStyle = "rgba(236,139,27,0.2)"; g.fill();
    icon(g, kind, tx + ts / 2, ty + ts / 2, ts * 0.62, HOT);
    g.fillStyle = "#F4EEE6"; g.font = `500 52px ${FB}`; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText(title[0], tx + ts + 34, p + ph * 0.46);
    g.fillStyle = "rgba(244,238,230,0.72)"; g.font = `400 44px ${FB}`;
    g.fillText(title[1], tx + ts + 34, p + ph * 0.46 + 58);
    const fy = p + ph + 30, fh = CH - fy - p;
    const fg = g.createLinearGradient(0, fy, 0, fy + fh); fg.addColorStop(0, "rgba(236,139,27,0.16)"); fg.addColorStop(1, "rgba(236,139,27,0.05)");
    rr(g, p, fy, CW - 2 * p, fh, 30); g.fillStyle = fg; g.fill();
    g.font = `600 38px ${FB}`; g.letterSpacing = "4px"; const tw = g.measureText("LIVE").width; g.letterSpacing = "0px";
    const x0 = CW / 2 - (tw + 40) / 2;
    icon(g, "dot", x0 + 10, fy + fh / 2, 40, HOT);
    g.fillStyle = HOT; g.letterSpacing = "4px"; g.fillText("LIVE", x0 + 40, fy + fh / 2 + 13); g.letterSpacing = "0px";
    g.restore();
    rr(g, 2, 2, CW - 4, CH - 4, r); g.lineWidth = 3; g.strokeStyle = "rgba(246,160,58,0.22)"; g.stroke();
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  }
  const dotsTex = () => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d");
    for (let y = 16; y < 512; y += 32) for (let x = 16; x < 512; x += 32) {
      const d = Math.hypot(x - 256, y - 256) / 256, a = Math.max(0, 1 - d) * 0.8; if (a < 0.03) continue;
      g.fillStyle = `rgba(246,170,90,${a})`; g.fillRect(x - 3, y - 3, 6, 6);
    }
    return new THREE.CanvasTexture(c);
  };

  // ---------------- the headline: pixel build, as in the reference ----------------
  // Each word resolves out of a cloud of glowing orange pixels inside a dashed selection box, left to right, then
  // the finished line holds, and flares toward white as the camera starts to move off it.
  const HW = 1500, HH = 380;
  function makeHeadline() {
    // drawn at twice the size so the finished type stays crisp on screen
    const SS = 2;
    const c = document.createElement("canvas"); c.width = HW * SS; c.height = HH * SS; const g = c.getContext("2d"); g.scale(SS, SS);
    const final = document.createElement("canvas"); final.width = HW * SS; final.height = HH * SS; const fg = final.getContext("2d"); fg.scale(SS, SS);
    const lines = [{ y: 150, size: 128, w: 500, segs: [["100+", ORANGE], [" perpetual", "#F4EEE6"]] },
                   { y: 300, size: 92, w: 400, segs: [["markets in ", "#F4EEE6"], ["one place", ORANGE]] }];
    const words = [];
    lines.forEach((L) => {
      fg.font = `${L.w} ${L.size}px ${FB}`; fg.textBaseline = "alphabetic";
      const total = L.segs.reduce((a, s) => a + fg.measureText(s[0]).width, 0);
      let x = (HW - total) / 2;
      L.segs.forEach(([txt, col]) => {
        fg.fillStyle = col; fg.fillText(txt, x, L.y);
        // split into words for the per-word build
        let cx = x;
        txt.split(/(\s+)/).forEach((w) => { const ww = fg.measureText(w).width; if (w.trim()) words.push({ x0: cx, x1: cx + ww, y0: L.y - L.size * 0.8, y1: L.y + L.size * 0.22 }); cx += ww; });
        x += fg.measureText(txt).width;
      });
    });
    const img = fg.getImageData(0, 0, HW * SS, HH * SS).data;
    const cell = 6, cells = [];
    for (let y = 0; y < HH; y += cell) for (let x = 0; x < HW; x += cell) {
      let a = 0; for (let k = 0; k < 4; k++) a += img[(((y + (k >> 1) * 3) * SS) * HW * SS + (x + (k & 1) * 3) * SS) * 4 + 3];
      if (a > 80) cells.push([x, y]);
    }
    words.forEach((w, i) => { w.t0 = HEAD_IN + i * 4.2; w.t1 = w.t0 + 13; });
    // glow: the frame blurred and added back under itself, as the reference's pixels and type bloom
    const gc = document.createElement("canvas"); gc.width = HW * SS; gc.height = HH * SS; const gg = gc.getContext("2d");
    const tex = new THREE.CanvasTexture(gc); tex.anisotropy = 8;
    const wordOf = (x, y) => words.find((w) => x >= w.x0 - 2 && x <= w.x1 + 2 && y >= w.y0 - 4 && y <= w.y1 + 4);
    const cellWord = cells.map(([x, y]) => wordOf(x, y));
    function draw(f) {
      g.clearRect(0, 0, HW, HH);
      const r = rng(Math.floor(f) * 131 + 7);
      // finished pixels: the type itself, revealed per word left to right with a noisy edge
      g.save();
      cells.forEach(([x, y], i) => {
        const w = cellWord[i]; if (!w) return;
        const u = (x - w.x0) / (w.x1 - w.x0 + 1), n = ((x * 73856093) ^ (y * 19349663)) >>> 0, jitter = ((n % 1000) / 1000 - 0.5) * 0.35;
        const p = (f - w.t0) / (w.t1 - w.t0) - u - jitter;
        if ((f - w.t0) / (w.t1 - w.t0) > 1.5) return; // finished words are drawn whole below, as smooth type
        if (p > 0.25) g.drawImage(final, x * SS, y * SS, cell * SS, cell * SS, x, y, cell, cell);
        else if (p > -0.35) { // the build front: hot orange pixels, flickering
          if (r() < 0.85) { g.fillStyle = r() < 0.35 ? "#FFE9CC" : HOT; g.fillRect(x, y, cell - 1, cell - 1); }
        } else if (p > -0.9 && r() < 0.1) { g.fillStyle = "rgba(246,160,58,0.8)"; g.fillRect(x, y, cell - 1, cell - 1); }
      });
      // finished words: the type itself, whole and anti-aliased (no pixel blocks left on the edges)
      words.forEach((w) => {
        if ((f - w.t0) / (w.t1 - w.t0) <= 1.5) return;
        const x0 = w.x0 - 14, y0 = w.y0 - 14, ww = w.x1 - w.x0 + 28, hh = (w.y1 - w.y0) + 50;
        g.drawImage(final, x0 * SS, y0 * SS, ww * SS, hh * SS, x0, y0, ww, hh);
      });
      g.restore();
      // dashed selection boxes around words while they build
      g.save(); g.setLineDash([5, 5]); g.lineDashOffset = -f * 2; g.lineWidth = 2.5;
      words.forEach((w) => {
        const k = span(f, w.t0 - 2, w.t0 + 3) * (1 - span(f, w.t1 + 2, w.t1 + 9));
        if (k <= 0.01) return;
        const grow = easeOut(span(f, w.t0 - 2, w.t1), 2);
        g.strokeStyle = `rgba(246,160,58,${0.85 * k})`;
        g.strokeRect(w.x0 - 10, w.y0 - 8, (w.x1 - w.x0 + 20) * Math.max(0.25, grow), w.y1 - w.y0 + 16);
      });
      g.restore();
      gg.clearRect(0, 0, HW * SS, HH * SS);
      gg.globalCompositeOperation = "lighter";
      gg.filter = "blur(28px)"; gg.globalAlpha = 0.75; gg.drawImage(c, 0, 0);
      gg.filter = "blur(8px)"; gg.globalAlpha = 0.6; gg.drawImage(c, 0, 0);
      gg.filter = "none"; gg.globalAlpha = 1; gg.globalCompositeOperation = "source-over"; gg.drawImage(c, 0, 0);
      tex.needsUpdate = true;
    }
    return { tex, draw };
  }

  // ---------------- depth of field (thin lens gather, as in the earlier scenes) ----------------
  const dofFrag = `#include <packing>
    varying vec2 vUv; uniform sampler2D tColor; uniform sampler2D tDepth; uniform float cameraNear; uniform float cameraFar;
    uniform float focus; uniform float cInf; uniform float maxCoC; uniform float spread; uniform float rot; uniform vec2 res;
    float zAt(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
    float cocAt(float z){ float c = cInf*(1.0 - focus/max(z,1e-3)); if (c < 0.0) c *= 1.4; return clamp(c, -maxCoC, maxCoC); }
    void main(){
      vec3 c0 = texture2D(tColor, vUv).rgb; float z0 = zAt(vUv), r0 = abs(cocAt(z0)), R = maxCoC*spread;
      vec3 acc = c0; float ws = 1.;
      for (int i = 0; i < 40; i++) { float fi = float(i); float rr = sqrt((fi+.5)/40.)*R; float a = fi*2.39996323 + rot;
        vec2 suv = vUv + vec2(cos(a), sin(a))*rr/res; float zs = zAt(suv); float cs = abs(cocAt(zs))*spread;
        float rs = zs > z0 ? min(cs, r0*spread) : cs; float w = clamp(rs - rr + .75, 0., 1.);
        acc += texture2D(tColor, suv).rgb*w; ws += w; }
      gl_FragColor = vec4(acc/ws, 1.); }`;

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <canvas id="gl" width="${W}" height="${H}"></canvas>
      <div id="wash" class="layer"></div>
      <div id="streaks" class="layer"><i></i><i></i><i></i><i></i></div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);
    let built = false, R, scene, camera, rtS, rtA, rtB, rtD, qScene, qCam, accMat, dofMat, head, mainCards = [], field = [], headMesh;
    const MARKETS = [[["Crypto", "BTC · ETH · SOL"], "crypto"], [["Forex", "EUR/USD · GBP"], "forex"], [["Indices", "NAS100 · US30"], "indices"],
      [["Commodities", "Gold · Oil"], "commodities"], [["Stocks", "AAPL · NVDA"], "stocks"]];
    // where the five main cards sit: a diagonal climbing to the upper right, as in the reference; the headline sits
    // up and to the left of the first one, a little nearer the lens
    const CP = [[1.55, -0.95, 0], [3.55, -0.05, -0.15], [5.45, 0.85, 0.05], [7.5, 1.7, -0.1], [9.45, 2.6, 0.05]];
    const HEADP = [-0.2, 0.25, 0.55];
    function build() {
      built = true;
      R = new THREE.WebGLRenderer({ canvas: $("#gl"), antialias: true, preserveDrawingBuffer: true });
      R.setPixelRatio(1); R.setSize(W, H, false); R.outputEncoding = THREE.LinearEncoding;
      scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0705);
      camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 80);
      const card = (tex, s, dim) => {
        const grp = new THREE.Group();
        const body = new THREE.Mesh(new THREE.PlaneGeometry(1.25 * s, 0.977 * s), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: true, alphaTest: 0.02, color: new THREE.Color(dim, dim, dim) }));
        grp.add(body); grp.userData.body = body; return grp;
      };
      MARKETS.forEach(([title, kind], i) => { const g = card(cardTex(title, kind), 1, 1); g.position.set(...CP[i]); g.rotation.y = -0.08; scene.add(g); mainCards.push(g); });
      // the field: dimmer cards scattered in depth around the path, a few in front of the lens path
      const r = rng(42), labels = [["BTC-PERP", "97,412.5"], ["ETH-PERP", "3,618.2"], ["EUR/USD", "1.0842"], ["NAS100", "21,034"], ["XAU/USD", "2,654.1"], ["AAPL", "229.87"], ["SOL-PERP", "212.84"], ["US30", "43,870"], ["WTI Oil", "71.26"], ["GBP/JPY", "193.44"]];
      const kinds = ["crypto", "crypto", "forex", "indices", "commodities", "stocks", "crypto", "indices", "commodities", "forex"];
      const tex = labels.map((l, i) => cardTex(l, kinds[i], true));
      for (let i = 0; i < 40; i++) {
        const along = -2 + r() * 14, side = (r() - 0.5) * 7, z = -2.2 - r() * 6 + (i % 13 === 0 ? 4.6 : 0);
        const g = card(tex[i % tex.length], 0.5 + r() * 0.3, 0.32 + r() * 0.2);
        g.position.set(along, along * 0.43 + side * 0.6 - 0.8, z); g.rotation.set((r() - 0.5) * 0.3, (r() - 0.5) * 0.6, (r() - 0.5) * 0.12);
        g.userData.phase = r() * 6.28; g.userData.base = g.position.clone();
        // keep the main cards' own spots clear
        if (CP.some((p) => Math.hypot(p[0] - g.position.x, p[1] - g.position.y) < 1.3 && z > -3.5)) continue;
        if (Math.abs(g.position.x - HEADP[0]) < 1.7 && Math.abs(g.position.y - HEADP[1]) < 0.9 && z > -4) continue;
        scene.add(g); field.push(g);
      }
      // dot-grid patches catching the light
      const dt = dotsTex();
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: dt, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
        const a = -1 + r() * 12; m.position.set(a, a * 0.43 + (r() - 0.5) * 5, -2.5 - r() * 4); scene.add(m); }
      head = makeHeadline();
      headMesh = new THREE.Mesh(new THREE.PlaneGeometry(HW / 560, HH / 560), new THREE.MeshBasicMaterial({ map: head.tex, transparent: true, depthWrite: true, alphaTest: 0.005 }));
      headMesh.position.set(...HEADP); scene.add(headMesh);

      const mk = () => { const t = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }); t.depthTexture = new THREE.DepthTexture(W, H); t.depthTexture.type = THREE.UnsignedIntType; return t; };
      rtS = mk(); rtD = mk();
      rtA = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType }); rtB = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
      qScene = new THREE.Scene(); qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      accMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, k: { value: 1 } }, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
        fragmentShader: `uniform sampler2D t; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb*k, 1.); }` });
      dofMat = new THREE.ShaderMaterial({ uniforms: { tColor: { value: null }, tDepth: { value: rtD.depthTexture }, cameraNear: { value: 0.05 }, cameraFar: { value: 80 }, focus: { value: 4 }, cInf: { value: 0 }, maxCoC: { value: 22 }, spread: { value: 1 }, rot: { value: 0 }, res: { value: new THREE.Vector2(W, H) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`, fragmentShader: dofFrag, depthTest: false, depthWrite: false });
      qScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat));
    }

    // ---------------- camera ----------------
    // The camera looks at a target that steps from the headline to each card. A move takes MOVE frames on a smooth
    // ease-in-out; between moves the camera keeps drifting slowly up and to the right, as in the reference.
    const DIST = 3.8;
    const targets = [[HEADP[0] + 0.15, HEADP[1] - 0.1, HEADP[2]], ...CP];
    // Measured on the reference: the camera never stops. It slides slowly, speeds up sharply into each switch,
    // whips across on the spoken word, then decelerates along a long tail that is already the slow slide toward
    // the next card. A Cauchy-shaped speed profile per switch (speed ~ 1 / (1 + (t/tau)^2)) gives exactly that:
    // summed over the switches it is one continuous move with a sharp peak on each word.
    const TAU = 1.3;
    const step = (x) => 0.5 + Math.atan(x / TAU) / Math.PI;
    const u0 = LAND.reduce((a, T) => a + step(-T), 0);
    const tAt = (f) => {
      let u = LAND.reduce((a, T) => a + step(f - T), 0) - u0;
      u = clamp(u, 0, targets.length - 1);
      const i = Math.min(Math.floor(u), targets.length - 2), k = u - i;
      return targets[i].map((v, j) => mix(v, targets[i + 1][j], k));
    };
    function camAt(f) {
      let t = tAt(f), d = DIST;
      // the headline shot pushes in gently while it builds
      d -= 0.35 * span(f, 0, LAND[0]);
      // "all in one place": draw back over the whole set
      const k = ease(span(f, PULL[0], PULL[1]));
      if (k > 0) { const mid = [5.4, 0.9, 0]; t = t.map((v, j) => mix(v, mid[j], k)); d = mix(d, 9.6, k); }
      return { pos: [t[0] + 0.25, t[1] - 0.12, t[2] + d], look: t, focus: d };
    }

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      if (!built) { if (document.readyState !== "complete" || (document.fonts && document.fonts.status !== "loaded")) return; build(); }
      head.draw(f);
      // headline flare toward white as the camera leaves it (reference frames 78-86)
      const fl = span(f, HEAD_FLARE, HEAD_FLARE + 10) * (1 - span(f, LAND[0] - 2, LAND[0] + 6));
      headMesh.material.color.setScalar(1 + 1.4 * fl);
      // the main cards: the one being shown is bright; earlier ones dim as they slide away
      mainCards.forEach((c, i) => {
        const on = span(f, LAND[i] - MOVE, LAND[i] + 2), off = i < LAND.length - 1 ? span(f, LAND[i + 1] - 2, LAND[i + 1] + MOVE) : 0;
        const all = span(f, PULL[0], PULL[1]);
        c.userData.body.material.color.setScalar(mix(0.55, 1.0, Math.max(on * (1 - off * 0.55), all)));
        c.position.y = CP[i][1] + Math.sin(f * 0.045 + i) * 0.015;
      });
      field.forEach((c) => { c.position.y = c.userData.base.y + Math.sin(f * 0.03 + c.userData.phase) * 0.02; });

      // motion blur: sample the camera over a 180-degree shutter; more samples while it is moving fast
      const c0 = camAt(f), c1 = camAt(f + 0.5), speed = Math.hypot(c1.pos[0] - c0.pos[0], c1.pos[1] - c0.pos[1], c1.pos[2] - c0.pos[2]);
      const N = clamp(Math.ceil(speed / 0.0025), 1, 16); // enough sub-frames that the blur never steps
      R.setRenderTarget(rtA); R.setClearColor(0, 1); R.clear();
      accMat.uniforms.k.value = 1 / N;
      for (let s = 0; s < N; s++) {
        const c = camAt(f + (N === 1 ? 0 : ((s + 0.5) / N - 0.5) * 0.5));
        camera.position.set(...c.pos); camera.lookAt(...c.look);
        R.setRenderTarget(rtS); R.setClearColor(0x0a0705, 1); R.clear(); R.render(scene, camera);
        accMat.uniforms.t.value = rtS.texture; R.setRenderTarget(rtA); R.autoClear = false; R.render(qScene, qCam); R.autoClear = true;
      }
      // depth from the centre of the shutter, for the lens blur
      camera.position.set(...c0.pos); camera.lookAt(...c0.look);
      R.setRenderTarget(rtD); R.setClearColor(0x0a0705, 1); R.clear(); R.render(scene, camera);
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      const focus = new THREE.Vector3(...c0.look).sub(camera.position).dot(fwd);
      const quad = qScene.children[0]; quad.material = dofMat;
      const u = dofMat.uniforms; u.focus.value = focus; u.cInf.value = mix(16, 7, span(f, PULL[0], PULL[1]));
      u.tColor.value = rtA.texture; u.spread.value = 0.3; u.rot.value = 0.61; R.setRenderTarget(rtB); R.render(qScene, qCam);
      u.tColor.value = rtB.texture; u.spread.value = 1; u.rot.value = 0; R.setRenderTarget(null); R.render(qScene, qCam);
      quad.material = accMat;

      // light leaks drifting across, the reference's thin diagonal streaks
      [...$("#streaks").children].forEach((s, i) => { s.style.transform = `translateX(${(-300 + ((f * (2.2 + i * 0.7) + i * 560) % 2600)).toFixed(1)}px) rotate(-38deg)`; });
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });

    const Rr = { _f: 0 };
    Object.defineProperty(Rr, "frame", { get: () => Rr._f, set: (v) => { Rr._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(Rr, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(Rr._f));
    window.addEventListener("load", () => render(Rr._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
