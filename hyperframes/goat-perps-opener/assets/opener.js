// GOAT Funded Perps opener: "Markets don't sleep." over a trader at a live chart, rebuilt beat for beat from the
// supplied reference clip ("Every Trade tells a story", 68 frames @ 30 fps):
//   0-8    camera cranes up from low and decelerates hard; afterwards a slow push-in and tilt continue all shot long,
//          with real parallax (the trader moves and grows more than the screen behind him)
//   9-30   the copy builds word by word: each word starts very soft and dim and resolves over ~10 frames; the block
//          drifts up with the camera
//   all    the chart is live: new candles keep printing up the right side, the price tag climbs with the last price
//   57-67  the screen light dies, the room falls to black, the copy dims last
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 68;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const easeOut = (x, p) => 1 - Math.pow(1 - clamp(x, 0, 1), p || 3);
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const FB = "Altform, sans-serif";

  // ---------------- live trading screen ----------------
  // The visible window is fixed; the series prints new candles into it as time passes (as in the reference).
  function makeChart(canvas) {
    const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    const N = 32, r = rng(11), noise = Array.from({ length: N + 4 }, () => r()), wick = Array.from({ length: N + 4 }, () => r());
    // the path: a short top on the left, a sell-off into a base, then a steady climb
    // visible left of the head: the top and the sell-off; the base sits just right of his neck; the climb prints on the right
    const path = (u) => u < 0.1 ? 0.62 + 2.4 * u : u < 0.62 ? 0.86 - 1.36 * (u - 0.1) : 0.15 + 2.0 * (u - 0.62);
    const ohlc = (i) => {
      const o = path(i / N) + (noise[i] - 0.5) * 0.09, c = path((i + 1) / N) + (noise[i + 1] - 0.5) * 0.09;
      return [o, c, Math.max(o, c) + 0.012 + wick[i] * 0.03, Math.min(o, c) - 0.012 - wick[i + 1] * 0.03];
    };
    const top = 70, cw = W * 0.79, ch = H - top - 36, yOf = (q) => top + ch * 0.0 + (1 - q) * ch * 0.92, bw = cw / N;
    const txt = (s, x, y, px, col, w, al) => { g.font = `${w || 400} ${px}px ${FB}`; g.fillStyle = col; g.textAlign = al || "left"; g.fillText(s, x, y); };
    return function draw(frame) {
      g.fillStyle = "#030506"; g.fillRect(0, 0, W, H);
      txt("BTC-PERP", 26, 44, 24, "#d9dee3", 600); g.fillStyle = "#ff4f4f"; g.fillRect(150, 34, 80, 5); g.fillRect(244, 34, 50, 5);
      txt("1m   5m   15m   1h", 520, 44, 20, "#59626b", 400);
      g.fillStyle = "#3ce68a"; g.beginPath(); g.arc(W - 30, 30, 7, 0, 7); g.fill();
      txt("Order Book", cw + 26, 92, 22, "#e5e9ed", 600);
      g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 1;
      for (let i = 1; i < 7; i++) { const y = top + ch * i / 7; g.beginPath(); g.moveTo(0, y); g.lineTo(cw - 70, y); g.stroke(); txt((43400 - i * 120).toFixed(1), cw - 10, y + 6, 15, "#5a636c", 400, "right"); }
      for (let i = 1; i < 6; i++) { const x = (cw - 70) * i / 6; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + ch); g.stroke(); }
      // candles print in over time; the newest one is still forming
      const n = 20 + frame * 0.19, full = Math.floor(n), part = n - full, last = Math.min(full, N - 1), ma = [];
      for (let i = 0; i <= last; i++) {
        let [o, c, h, l] = ohlc(i);
        if (i === full) { c = o + (c - o) * part; h = Math.max(o, c) + (h - Math.max(o, c)) * part; l = Math.min(o, c) - (Math.min(o, c) - l) * part; }
        const up = c >= o, x = i * bw * 0.93 + bw / 2;
        g.strokeStyle = g.fillStyle = up ? "#45f09a" : "#ff5252"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, yOf(h)); g.lineTo(x, yOf(l)); g.stroke();
        g.fillRect(x - bw * 0.3, yOf(Math.max(o, c)), bw * 0.6, Math.max(4, yOf(Math.min(o, c)) - yOf(Math.max(o, c))));
        const vol = 0.35 + Math.abs(c - o) * 8;
        g.globalAlpha = 0.85; g.fillRect(x - bw * 0.34, H - 36 - vol * ch * 0.11, bw * 0.68, vol * ch * 0.11); g.globalAlpha = 1;
        ma.push([x, yOf((o + c) / 2 - 0.045)]);
        if (i === last) {
          const py = yOf(c);
          g.strokeStyle = up ? "rgba(69,240,154,0.75)" : "rgba(255,82,82,0.75)"; g.lineWidth = 2; g.setLineDash([8, 7]);
          g.beginPath(); g.moveTo(0, py); g.lineTo(cw - 76, py); g.stroke(); g.setLineDash([]);
          g.fillStyle = up ? "#6ff5b0" : "#ff6b6b"; g.fillRect(cw - 150, py - 22, 112, 44);
          txt((42740 + c * 900).toFixed(1), cw - 94, py + 8, 20, "#06140c", 600, "center");
        }
      }
      g.strokeStyle = "#e7aa3a"; g.lineWidth = 4; g.beginPath();
      ma.forEach(([x, y], i) => { const s = ma.slice(Math.max(0, i - 5), i + 1), yy = s.reduce((a, p) => a + p[1], 0) / s.length; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
      // order book: asks red over bids green, depth bars flicker as orders change
      const bx = cw + 18, bwid = W - bx - 18, rows = 22, rh = (H - 120) / rows, rb = rng(5 + Math.floor(frame / 2));
      for (let i = 0; i < rows; i++) {
        const ask = i < 11, y = 112 + rh * i, d = 0.35 + rb() * 0.65;
        g.fillStyle = ask ? "rgba(225,50,50,0.62)" : "rgba(40,190,105,0.62)"; g.fillRect(bx + bwid * (1 - d * 0.75), y + rh * 0.06, bwid * d * 0.75, rh * 0.78);
        g.fillStyle = ask ? "rgba(255,120,120,0.95)" : "rgba(90,240,160,0.95)"; g.fillRect(bx + 8, y + rh * 0.28, bwid * 0.26, rh * 0.26);
        g.fillStyle = "rgba(230,235,240,0.55)"; g.fillRect(bx + bwid * 0.58, y + rh * 0.28, bwid * 0.24, rh * 0.26);
      }
    };
  }

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <svg width="0" height="0" style="position:absolute"><filter id="vblur" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur id="vbs" stdDeviation="0 0"/></filter></svg>
      <div id="world" class="layer">
        <div id="wall" class="layer"></div>
        <div id="cam2" class="layer">
          <div id="far" class="far"><canvas width="300" height="620"></canvas></div>
          <div id="mon" class="mon"><canvas id="chart" width="1400" height="860"></canvas><canvas id="bloom" width="350" height="215"></canvas><div class="glass"></div></div>
          <div id="spill" class="layer"></div>
        </div>
        <div id="cam1" class="layer">
          <div id="person" class="person">
            <img class="base" src="assets/trader.png" alt="">
            <img class="shade" src="assets/shade.png" alt="">
            <img class="rimw" src="assets/rim-warm.png" alt="">
            <img class="rims" src="assets/rim-screen.png" alt="">
          </div>
        </div>
        <div id="haze" class="layer"></div>
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
    const chart = $("#chart"), draw = makeChart(chart), bloom = $("#bloom"), bctx = bloom.getContext("2d");
    { const fc = $("#far canvas").getContext("2d"); fc.fillStyle = "#040506"; fc.fillRect(0, 0, 300, 620); const r = rng(3); for (let i = 0; i < 12; i++) { fc.fillStyle = r() < 0.55 ? "rgba(255,70,70,0.9)" : "rgba(60,230,140,0.9)"; fc.fillRect(26 + i * 21, 180 + r() * 160, 12, 60 + r() * 120); } }
    const vbs = $("#vbs"), world = $("#world"), cam1 = $("#cam1"), cam2 = $("#cam2"), mon = $("#mon"), spill = $("#spill"), rims = $(".rims");
    const words = [...stage.querySelectorAll("#copy span")], copy = $("#copy"), dark = $("#dark"), grain = $("#grain");
    // first visible frame and resolve length of each word, from the reference ("Every" 9, "Trade" 14, "tells" 19 ...)
    const WT = [[9, 10], [14, 10], [22, 13]];

    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    const crane = (x) => 1 - easeOut(x / 9, 3.4);

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      draw(f);
      // screen bloom: the chart downsampled and blurred, added back over itself
      bctx.clearRect(0, 0, 350, 215); bctx.filter = "blur(5px)"; bctx.drawImage(chart, 0, 0, 350, 215); bctx.filter = "none";

      // camera, measured on the reference: one long exponential settle (half-life ~6 frames: 190 px left at
      // frame 9, 93 at 15, 48 at 20, 13 at 30), then completely still from frame ~40. The copy rides with it.
      const settle = (x) => { const e0 = Math.exp(-0.118 * 44); return Math.max(0, (Math.exp(-0.118 * x) - e0) / (1 - e0)); };
      const lift = 560 * settle(f);
      cam1.style.transform = `translateY(${lift.toFixed(2)}px)`;
      cam2.style.transform = `translateY(${(lift * 0.86).toFixed(2)}px)`;
      copy.style.transform = `translateY(${(lift * 1.0).toFixed(2)}px)`;
      const sb = 0.16 * 560 * (settle(f - 0.5) - settle(f + 0.5));
      vbs.setAttribute("stdDeviation", `0 ${sb.toFixed(2)}`);
      world.style.filter = sb > 0.4 ? "url(#vblur)" : "none";

      // copy: soft and dim, resolving to sharp; the block rides the camera's slow tilt
      words.forEach((w, i) => {
        const [s, d] = WT[i], e = easeOut(span(f, s, s + d), 2.2);
        w.style.opacity = (f < s ? 0 : 0.25 + 0.75 * e).toFixed(3);
        const gl = i === 2 ? ` drop-shadow(0 0 ${(16 * e).toFixed(1)}px rgba(240,214,140,${(0.38 * e).toFixed(3)}))` : "";
        w.style.filter = (e < 0.995 ? `blur(${((1 - e) * 13).toFixed(2)}px)` : "") + gl || "none";
      });

      // end: the screen dies first, then the room; the copy dims last
      const off = smooth(span(f, 57, 66));
      mon.style.filter = `brightness(${mix(1, 0.05, off).toFixed(3)})`;
      spill.style.opacity = (1 - off).toFixed(3);
      rims.style.opacity = (0.22 * (1 - off)).toFixed(3);
      dark.style.opacity = (0.8 * smooth(span(f, 59, 67))).toFixed(3);
      copy.style.opacity = mix(1, 0.6, smooth(span(f, 61, 67))).toFixed(3);
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
