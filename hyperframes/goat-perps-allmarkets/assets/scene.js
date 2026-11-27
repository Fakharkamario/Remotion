// GOAT Funded Perps: "All markets" (149 frames @ 30 fps), built on the supplied reference: a carousel of product
// cards where the focused card is large and lit and its neighbours small and dim; each step is a soft glide; at the
// end the camera settles on the whole set in one row and a highlight runs across it. In the Perps brand, timed to:
//   "including crypto, forex, indices, commodities and stocks, all in one place."
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 149;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const glide = (a, b) => {
    const N = 400, T = [0];
    for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N; T.push(T[i - 1] + Math.pow(u, a) * Math.pow(1 - u, b)); }
    return (x) => { const v = clamp(x, 0, 1) * N, i = Math.min(N - 1, Math.floor(v)); return mix(T[i], T[i + 1], v - i) / T[N]; };
  };
  const gW = glide(1.6, 3.2), gIn = glide(1.15, 4), gHand = glide(2, 3);

  // ---------------- timing (frames) from the voiceover ----------------
  // crypto 0.28-0.70, forex 0.96-1.48, indices 1.70-2.04, commodities 2.34-2.60, stocks 3.08-3.48, all in one place 3.90-4.88
  const FOCUS = [8, 29, 51, 70, 92];   // each card is settled in focus as its name is said
  const ROW = [108, 134];              // the pull back to the whole set, on "all in one place"
  const MARKETS = [
    ["Crypto", "BTC · ETH · SOL", "Live 24/7", `<path d="M28 6 L47 17 V39 L28 50 L9 39 V17 Z"/><path d="M28 18 L37 23 V33 L28 38 L19 33 V23 Z"/>`],
    ["Forex", "EUR/USD · GBP/USD", "Live", `<path d="M10 20 H44 L36 12"/><path d="M46 36 H12 L20 44"/>`],
    ["Indices", "US500 · NAS100", "Live", `<path d="M10 46 H46"/><path d="M16 40 V30"/><path d="M26 40 V20"/><path d="M36 40 V26"/><path d="M46 40 V12" stroke-opacity="0"/>`],
    ["Commodities", "Gold · Oil · Silver", "Live", `<path d="M28 8 C20 20 14 27 14 35 a14 14 0 0 0 28 0 C42 27 36 20 28 8 Z"/>`],
    ["Stocks", "AAPL · TSLA · NVDA", "Live", `<path d="M10 42 L22 30 L30 36 L46 18"/><path d="M36 18 H46 V28"/>`],
  ];
  const spark = (seed) => {
    const r = rng(seed); let y = 40, pts = [];
    for (let i = 0; i <= 24; i++) { y = clamp(y + (r() - 0.56) * 16, 8, 58); pts.push([(i / 24) * 300, y]); }
    return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L");
  };

  const SCENE = {};
  SCENE.mount = function (stage) {
    // the out-of-focus chart behind
    const r = rng(77); let p = 600, bars = "";
    for (let i = 0; i < 56; i++) {
      const o = p; p = clamp(p + (r() - 0.5) * 120, 300, 900); const up = p < o;
      bars += `<line x1="${i * 44 + 22}" x2="${i * 44 + 22}" y1="${Math.min(o, p) - 40 - r() * 50}" y2="${Math.max(o, p) + 40 + r() * 50}" stroke="${up ? "#2F9E64" : "#B5443F"}" stroke-width="4"/><rect x="${i * 44 + 8}" width="28" y="${Math.min(o, p)}" height="${Math.max(6, Math.abs(o - p))}" fill="${up ? "#2F9E64" : "#B5443F"}"/>`;
    }
    stage.innerHTML = `
      <div id="bg" class="layer"></div>
      <svg id="chartbg" viewBox="0 0 2400 1080">${bars}</svg>
      <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="spg" x1="0" x2="1"><stop offset="0" stop-color="#F6A03A"/><stop offset="1" stop-color="#F2C14E"/></linearGradient></defs></svg>
      <svg id="frame" width="10" height="10"><rect id="frameR" x="1" y="1" rx="40" pathLength="100"/></svg>
      <div id="flabel"><img src="assets/gft-logo-white.png" alt=""/>ONE ACCOUNT · EVERY MARKET</div>
      <div id="car">${MARKETS.map(([n, tk, st, ic], i) => `
        <div class="card" id="c${i}"><div class="ic"><svg viewBox="0 0 56 56">${ic}</svg></div><h3>${n}</h3>
          <svg class="sp" viewBox="0 0 300 64"><path class="base" d="M0 62 H300"/><path class="ln" id="s${i}" d="${spark(10 + i * 7)}" pathLength="100"/></svg>
          <div class="tk">${tk}</div><div class="st"><i></i>${st}</div></div>`).join("")}</div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), rr = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rr() + rr() + rr() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    const cards = MARKETS.map((_, i) => $(`#c${i}`));

    // the whole set in one row, framed: geometry
    const RS = 0.66, GAP = 30, RW = 400 * RS, RH = 430 * RS, ROWX = (i) => (i - 2) * (RW + GAP);
    const FW = 5 * RW + 4 * GAP + 90, FH = RH + 120;
    const fr = $("#frame"); fr.setAttribute("width", FW + 2); fr.setAttribute("height", FH + 2);
    $("#frameR").setAttribute("width", FW); $("#frameR").setAttribute("height", FH);

    function render(fr0) {
      let f = clamp(fr0, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      // carousel position: it glides in already moving, then each step is a soft glide onto the next card
      const pos = -0.55 + 0.55 * gIn(span(f, 0, 14)) + FOCUS.slice(1).reduce((s, t) => s + gW(span(f, t - 12, t + 6)), 0);
      const q = gW(span(f, ROW[0], ROW[1]));
      $("#chartbg").style.transform = `translateX(${(-60 * (f / FRAMES) - 40 * pos).toFixed(1)}px)`;
      const cam = mix(1.18, 1.0, q) * (1 + 0.02 * (f / FRAMES));
      $("#car").style.transform = `scale(${cam.toFixed(4)})`;
      cards.forEach((el, i) => {
        const d = i - pos, ad = Math.abs(d), sg = Math.sign(d);
        // carousel layout: focused card large, neighbours tucked in close, small and dim
        const sc = ad < 1 ? mix(1, 0.66, ad) : mix(0.66, 0.6, Math.min(1, ad - 1));
        const xc = sg * (Math.min(ad, 1) * (200 + 132 + 22) + Math.max(0, ad - 1) * (264 + 22));
        const oc = ad < 1 ? mix(1, 0.5, ad) : 0.5 * (1 - span(ad, 1, 2.7));
        const fo = Math.max(0, 1 - ad * 1.5);
        // row layout: the whole set, the same size, side by side
        const x = mix(xc, ROWX(i), q), s = mix(sc, RS, q), o = mix(oc, 1, q), y = mix(-8 * Math.min(1, ad), 10, q);
        const hl = Math.sin(Math.PI * span(f, 124 + i * 4, 138 + i * 4));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
        el.style.opacity = o.toFixed(3);
        el.style.zIndex = Math.round(100 - ad * 10);
        const lit = fo * (1 - q) + 0.8 * hl;
        el.style.filter = `brightness(${(mix(0.62, 1, Math.max(fo, q * 0.92)) + 0.18 * hl).toFixed(3)}) blur(${(ad > 1.2 && q < 1 ? (ad - 1.2) * 1.6 * (1 - q) : 0).toFixed(2)}px)`;
        el.style.borderColor = `rgba(${Math.round(mix(255, 246, lit))}, ${Math.round(mix(255, 176, lit))}, ${Math.round(mix(255, 80, lit))}, ${(0.1 + 0.55 * lit).toFixed(3)})`;
        el.style.boxShadow = `0 40px 90px rgba(0,0,0,0.6), 0 0 ${(60 * lit).toFixed(1)}px rgba(236,139,27,${(0.32 * lit).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,0.08)`;
        // each card's line draws as it comes into focus
        const dr = gHand(span(f, FOCUS[i] - 10, FOCUS[i] + 12));
        $(`#s${i}`).setAttribute("stroke-dasharray", `${(100 * Math.max(dr, q)).toFixed(2)} 100`);
      });
      // "one place": a fine gold frame draws round the whole set, with the mark
      const fk = gW(span(f, 120, 142));
      const fw = FW * cam, fh = FH * cam;
      fr.style.left = `${(960 - fw / 2).toFixed(1)}px`; fr.style.top = `${(530 - fh / 2).toFixed(1)}px`;
      fr.style.transform = `scale(${cam.toFixed(4)})`; fr.style.transformOrigin = "0 0";
      $("#frameR").setAttribute("stroke-dasharray", `${(100 * fk).toFixed(2)} 100`);
      fr.style.opacity = (fk > 0 ? 1 : 0).toFixed(3);
      const fl = $("#flabel"), lk = gIn(span(f, 128, 146));
      fl.style.left = `${(960 - fw / 2 + 4).toFixed(1)}px`; fl.style.top = `${(530 - fh / 2 - 56).toFixed(1)}px`;
      fl.style.opacity = lk.toFixed(3); fl.style.transform = `translateY(${mix(10, 0, lk).toFixed(1)}px)`;
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
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
