// GOAT Funded Perps opener: "Markets don't sleep." over a trader at a live chart, rebuilt beat for beat from the
// supplied reference clip ("Every Trade tells a story", 68 frames @ 30 fps):
//   0-7    camera cranes up from low, decelerating hard, then keeps a slow push-in
//   9-34   copy builds word by word: each word focuses in from a soft blur where it stands (no slide)
//   58-67  the screen light dies and the room falls to black, the copy dims last
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 68;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const easeOut = (x, p) => 1 - Math.pow(1 - clamp(x, 0, 1), p || 3);
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const FB = 'Altform, sans-serif';

  // ---------------- live trading screen ----------------
  function makeChart(canvas) {
    const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    const r = rng(11); let v = 0.62; const walk = [];
    // shape like the reference: a sell-off, a base, then a steady climb into the right edge
    // a V like the reference: sell-off into a base on the left third, then a steady climb to the right edge
    for (let i = 0; i < 200; i++) walk.push((r() - 0.5) * 0.07);
    const price = (u) => (u < 0.42 ? 0.7 - 1.05 * u : 0.26 + 1.02 * (u - 0.42)) ;
    const txt = (s, x, y, px, col, w, al) => { g.font = `${w || 400} ${px}px ${FB}`; g.fillStyle = col; g.textAlign = al || "left"; g.fillText(s, x, y); };
    return function draw(frame) {
      g.fillStyle = "#040607"; g.fillRect(0, 0, W, H);
      const top = 54, cw = W * 0.82, ch = H - top - 30;
      txt("BTC-PERP  ·  97,412.5", 22, 36, 22, "#cfd6dc", 600);
      g.fillStyle = "#ff5b52"; g.fillRect(250, 26, 70, 4);
      txt("Order Book", cw + 24, 36, 20, "#cfd6dc", 600);
      g.strokeStyle = "rgba(255,255,255,0.045)"; g.lineWidth = 1;
      for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, top + ch * i / 8); g.lineTo(cw, top + ch * i / 8); g.stroke(); }
      const N = 34, bw = cw / N, yOf = (q) => top + ch * 0.02 + (1 - q) * ch * 0.78;
      const ma = [];
      for (let i = 0; i < N; i++) {
        const u = (i + frame * 0.05) / N, k = Math.floor(i + frame * 0.05);
        const o = clamp(price((k) / N) + walk[k % 200], 0.04, 0.96), c0 = clamp(price((k + 1) / N) + walk[(k + 1) % 200], 0.04, 0.96);
        const fr = (i + frame * 0.05) % 1, c = i === N - 1 ? o + (c0 - o) * fr : c0, up = c >= o, x = i * bw + bw / 2;
        g.strokeStyle = g.fillStyle = up ? "#3ce68a" : "#ff4f4f"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, yOf(Math.max(o, c) + 0.03)); g.lineTo(x, yOf(Math.min(o, c) - 0.03)); g.stroke();
        g.fillRect(x - bw * 0.3, yOf(Math.max(o, c)), bw * 0.6, Math.max(4, yOf(Math.min(o, c)) - yOf(Math.max(o, c))));
        const vol = 0.3 + Math.abs(c - o) * 6;
        g.globalAlpha = 0.8; g.fillRect(x - bw * 0.34, H - 30 - vol * ch * 0.12, bw * 0.68, vol * ch * 0.12); g.globalAlpha = 1;
        ma.push([x, yOf(price(u) - 0.05)]);
        void u;
      }
      g.strokeStyle = "#e0a63a"; g.lineWidth = 3; g.beginPath();
      ma.forEach(([x, y], i) => { const s = ma.slice(Math.max(0, i - 6), i + 1), yy = s.reduce((a, p) => a + p[1], 0) / s.length; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
      // last price line + tag
      const last = ma[ma.length - 1][1] - 10;
      g.strokeStyle = "rgba(80,230,150,0.7)"; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, last); g.lineTo(cw, last); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#5ff0a6"; g.fillRect(cw - 74, last - 16, 74, 32);
      // order book
      const bx = cw + 16, bwid = W - bx - 16, rows = 20, rh = (H - top - 30) / (rows + 1), rb = rng(5 + Math.floor(frame / 3));
      for (let i = 0; i < rows; i++) {
        const ask = i < rows / 2, y = top + rh * (i + 1), d = 0.25 + rb() * 0.75;
        g.fillStyle = ask ? "rgba(255,77,77,0.22)" : "rgba(51,209,122,0.22)"; g.fillRect(bx + bwid * (1 - d), y - rh * 0.74, bwid * d, rh * 0.7);
        g.fillStyle = ask ? "rgba(255,107,99,0.85)" : "rgba(64,224,138,0.85)"; g.fillRect(bx + 6, y - rh * 0.5, bwid * 0.22, rh * 0.2);
        g.fillStyle = "rgba(220,225,230,0.45)"; g.fillRect(bx + bwid * 0.6, y - rh * 0.5, bwid * 0.26, rh * 0.2);
      }
    };
  }

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <svg width="0" height="0" style="position:absolute"><filter id="vblur" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur id="vbs" stdDeviation="0 0"/></filter></svg>
      <div id="world" class="layer">
        <div id="wall" class="layer"></div>
        <div id="far" class="far"><canvas width="300" height="560"></canvas></div>
        <div id="mon" class="mon"><canvas id="chart" width="1280" height="784"></canvas></div>
        <div id="spill" class="layer"></div>
        <div id="person" class="person"><img src="assets/trader.png" alt=""></div>
        <div id="key" class="layer"></div>
      </div>
      <div id="copy" class="copy">
        <div class="l1"><span>Markets</span> <span>don’t</span></div>
        <div class="l2"><span>sleep.</span></div>
      </div>
      <div id="dark" class="layer"></div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>
      <div class="bar top"></div><div class="bar bot"></div>`;
    const $ = (s) => stage.querySelector(s);
    const draw = makeChart($("#chart"));
    { const fc = $("#far canvas").getContext("2d"); fc.fillStyle = "#050607"; fc.fillRect(0, 0, 300, 560); for (let i = 0; i < 14; i++) { fc.fillStyle = i % 3 ? "rgba(255,77,77,0.8)" : "rgba(51,209,122,0.8)"; fc.fillRect(20 + i * 18, 200 + Math.sin(i) * 60, 10, 120 + (i % 4) * 30); } }
    const vbs = stage.querySelector("#vbs");
    const world = $("#world"), mon = $("#mon"), far = $("#far"), person = $("#person"), key = $("#key"), spill = $("#spill");
    const words = [...stage.querySelectorAll("#copy span")], copy = $("#copy"), dark = $("#dark"), grain = $("#grain");
    // the reference's word timing (first visible frame of each word): 9, 14, 20 (the last word is the payoff, a touch slower)
    const WT = [[9, 7], [14, 7], [20, 9]];

    const tiles = Array.from({ length: 6 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      draw(f);
      // camera: crane up from low (fast, hard ease-out over ~8 frames), then a slow constant push-in
      const rise = 1 - easeOut(f / 9, 3.4);
      const push = mix(1.0, 1.045, f / (FRAMES - 1));
      const lift = 640 * rise;
      world.style.transform = `translate(${(-14 * f / FRAMES).toFixed(2)}px, 0) scale(${push.toFixed(4)})`;
      person.style.transform = `translateY(${(lift * 1.0).toFixed(1)}px)`;      // nearest: moves most
      // camera-speed motion blur along the crane (px per frame -> a vertical smear about half a frame long)
      const speed = 640 * (Math.max(0, 1 - easeOut((f - 0.5) / 9, 3.4)) - Math.max(0, 1 - easeOut((f + 0.5) / 9, 3.4)));
      const sb = speed * 0.14;
      vbs.setAttribute("stdDeviation", `0 ${sb.toFixed(2)}`);
      world.style.filter = sb > 0.4 ? "url(#vblur)" : "none";
      mon.style.transform = `translateY(${(lift * 0.82).toFixed(1)}px) perspective(1800px) rotateY(-4deg)`;
      far.style.transform = `translateY(${(lift * 0.82).toFixed(1)}px) perspective(1800px) rotateY(-14deg)`;
      key.style.transform = `translateY(${(lift * 0.5).toFixed(1)}px)`;

      // the copy: each word focuses in where it stands
      words.forEach((w, i) => {
        const [s, d] = WT[i], k = smooth(span(f, s, s + d));
        w.style.opacity = (k < 0.001 ? 0 : 0.15 + 0.85 * k).toFixed(3);
        w.style.filter = k < 0.999 ? `blur(${((1 - k) * 12).toFixed(2)}px)` : "none";
      });
      const glow = smooth(span(f, 22, 34));
      words[2].style.textShadow = `0 0 ${(26 * glow).toFixed(1)}px rgba(246,160,58,${(0.55 * glow).toFixed(3)})`;

      // end: the screen dies first, then the room; the copy dims last (frames 58-67)
      const off = smooth(span(f, 57, 66));
      mon.style.filter = `brightness(${mix(1, 0.06, off).toFixed(3)}) blur(0.8px)`;
      spill.style.opacity = (1 - off).toFixed(3);
      dark.style.opacity = (0.82 * smooth(span(f, 59, 67))).toFixed(3);
      copy.style.opacity = mix(1, 0.62, smooth(span(f, 61, 67))).toFixed(3);
      grain.style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    window.addEventListener("load", () => render(R._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
