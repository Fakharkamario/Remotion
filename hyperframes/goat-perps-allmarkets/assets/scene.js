// GOAT Funded Perps: "All markets" (149 frames @ 30 fps), rebuilt on the supplied reference as closely as the content
// allows: plain matte cards (icon, title, thin bar, value, status), a carousel that starts right of centre and glides
// card to card with the focused card large and the neighbours dim, one card's bar filling and its border changing,
// a slow push in, then the set shrinking into one row with a lighter highlight passing along it.
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
  // the reference's steps: ~20-frame glides that build and settle (measured motion peaks a third of the way in)
  const gStep = glide(1.5, 3), gIn = glide(1.15, 4), gHand = glide(2, 3);

  // ---------------- timing (frames) from the voiceover ----------------
  // crypto 0.28-0.70, forex 0.96-1.48, indices 1.70-2.04, commodities 2.34-2.60, stocks 3.08-3.48, all in one place 3.90-4.88
  const FOCUS = [8, 30, 52, 71, 93];
  const ROW = [106, 132];
  const GREEN = "#3FD07F", AMBER = "#E9C34A", ORANGE = "#EC8B1B";
  const ICONS = {
    coin: `<circle cx="29" cy="29" r="20"/><path d="M24 19 V39 M31 19 V39 M21 22 H33 a5 5 0 0 1 0 10 H21 M21 32 H34 a5 5 0 0 1 0 10 H21" transform="translate(0 -3) scale(1 0.92)"/>`,
    fx: `<path d="M12 22 H44 L36 14"/><path d="M46 36 H14 L22 44"/>`,
    idx: `<path d="M12 46 H46"/><path d="M18 40 V30"/><path d="M29 40 V18"/><path d="M40 40 V25"/>`,
    drop: `<path d="M29 9 C21 21 15 28 15 36 a14 14 0 0 0 28 0 C43 28 37 21 29 9 Z"/>`,
    trend: `<path d="M10 42 L22 30 L30 36 L46 18"/><path d="M36 18 H46 V28"/>`,
  };
  // [title, icon, kind, bar fill 0-1, bar colour, value, status]
  const CARDS = [
    ["Crypto", "coin", "bar", 0.4, GREEN, "Up to 10x", "Open 24/7"],
    ["Forex", "fx", "bar", 0.62, AMBER, "Up to 25x", "Open"],
    ["Indices", "idx", "check", 0, GREEN, "", "Open"],
    ["Commodities", "drop", "bar", 0.7, GREEN, "Gold · Oil · Silver", "Open"],
    ["Stocks", "trend", "bar", 0.55, GREEN, "AAPL · TSLA · NVDA", "Open"],
  ];
  const BOOST = [30, 40];   // the reference's one card event: Forex's bar runs to full and its border lights (Perps orange)

  const SCENE = {};
  SCENE.mount = function (stage) {
    // the dark, out-of-focus chart behind (the reference's red/orange candles right of centre)
    const r = rng(77); let p = 560, bars = "";
    for (let i = 0; i < 46; i++) {
      const o = p; p = clamp(p + (r() - 0.48) * 110, 240, 860); const up = p < o, x = 1100 + i * 30;
      const col = up ? "#2B8F5A" : (r() > 0.5 ? "#C2452F" : "#D9731F");
      bars += `<line x1="${x}" x2="${x}" y1="${Math.min(o, p) - 30 - r() * 40}" y2="${Math.max(o, p) + 30 + r() * 40}" stroke="${col}" stroke-width="3"/><rect x="${x - 10}" width="20" y="${Math.min(o, p)}" height="${Math.max(5, Math.abs(o - p))}" fill="${col}"/>`;
      if (i % 5 === 0) bars += `<rect x="2240" width="120" y="${120 + i * 20}" height="26" rx="4" fill="rgba(255,255,255,0.10)"/>`;
    }
    for (let y = 80; y < 1080; y += 96) bars = `<line x1="0" x2="2400" y1="${y}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>` + bars;
    for (let x = 140; x < 2400; x += 220) bars = `<line x1="${x}" x2="${x}" y1="0" y2="1080" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>` + bars;
    for (let y = 60; y < 1040; y += 70) bars += `<rect x="2250" width="${90 + (y % 3) * 14}" y="${y}" height="24" rx="4" fill="rgba(255,255,255,${y % 140 ? 0.09 : 0.14})"/>`;
    stage.innerHTML = `
      <div id="bg" class="layer"></div>
      <svg id="chartbg" viewBox="0 0 2400 1080">${bars}</svg>
      <div id="car">${CARDS.map(([t, ic, kind, fill, col, val, st], i) => `
        <div class="card" id="c${i}"><i class="tex"></i><i class="sheen"></i><i class="edge"></i><div class="ic"><svg viewBox="0 0 58 58">${ICONS[ic]}</svg></div><h3>${t}</h3>
          ${kind === "bar" ? `<div class="bar"><i id="b${i}" style="width:${fill * 100}%;background:${col}"></i></div><div class="val" id="v${i}">${val}</div>`
            : `<svg class="chk" viewBox="0 0 74 74"><circle cx="37" cy="37" r="30" fill="${GREEN}"/><path d="M24 38 L33 47 L51 28" fill="none" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
          <div class="st" id="t${i}">${st}</div></div>`).join("")}</div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), rr = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rr() + rr() + rr() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    $("#chartbg").style.filter = "blur(12px)"; $("#chartbg").style.opacity = "0.55";
    // a fine monochrome grain for the panel surfaces
    const fine = (() => { const c = document.createElement("canvas"); c.width = c.height = 180; const g = c.getContext("2d"), img = g.createImageData(180, 180), rr = rng(555);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rr() + rr() - 1) * 150; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`; })();
    stage.querySelectorAll(".tex").forEach((e) => (e.style.backgroundImage = fine));
    const cards = CARDS.map((_, i) => $(`#c${i}`));

    // geometry, in the reference's proportions: neighbours at 0.74, the next out at 0.68, ~18 px between edges
    const W = 470, S1 = 0.74, S2 = 0.68, G = 18;
    const X1 = W / 2 + S1 * W / 2 + G, X2 = X1 + S1 * W / 2 + S2 * W / 2 + G;
    const RS = 0.56, RG = 16, ROWX = (i) => (i - 2) * (RS * W + RG);

    function render(fr0) {
      let f = clamp(fr0, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const pos = FOCUS.slice(1).reduce((s, t) => s + gStep(span(f, t - 14, t + 8)), 0);
      const q = gStep(span(f, ROW[0], ROW[1]));
      // camera: opens right of centre and drifts to it; a slow push in while the cards step; the row settles back
      const camX = mix(300, 0, gIn(span(f, -6, 40)));
      const push = 1 + 0.12 * span(f, 0, ROW[0]);
      const cs = mix(push, 1, q);
      $("#car").style.transform = `translateX(${camX.toFixed(1)}px) scale(${cs.toFixed(4)})`;
      $("#chartbg").style.transform = `translateX(${(-50 * (f / FRAMES) - 30 * pos).toFixed(1)}px) scale(1.05)`;
      cards.forEach((el, i) => {
        const d = i - pos, ad = Math.abs(d), sg = Math.sign(d);
        const sc = ad < 1 ? mix(1, S1, ad) : ad < 2 ? mix(S1, S2, ad - 1) : S2;
        const xc = sg * (ad < 1 ? X1 * ad : ad < 2 ? mix(X1, X2, ad - 1) : X2 + (ad - 2) * (S2 * W + G));
        const fo = Math.max(0, 1 - ad);
        const op = ad < 2 ? 1 : 1 - span(ad, 2, 3);
        const br = ad < 1 ? mix(1, 0.42, ad) : mix(0.42, 0.28, Math.min(1, ad - 1));
        const bl = ad < 1 ? 0 : Math.min(1, ad - 1) * 2.2;
        // the row: all five the same size; a lighter highlight passes along it, like the reference's hover
        const x = mix(xc, ROWX(i), q), s = mix(sc, RS, q);
        el.style.transform = `translate(${x.toFixed(1)}px, 0px) scale(${s.toFixed(4)})`;
        el.style.opacity = mix(op, 1, q).toFixed(3);
        el.style.zIndex = Math.round(100 - ad * 10);
        el.style.filter = `brightness(${mix(br, 1, q).toFixed(3)}) blur(${mix(bl, 0, q).toFixed(2)}px)`;
        const hl = Math.sin(Math.PI * span(f, 124 + i * 4.5, 140 + i * 4.5));
        el.style.setProperty("--hl", hl.toFixed(3));
        el.querySelector(".sheen").style.backgroundPosition = `${(50 - x * 0.02).toFixed(1)}% 0`;
      });
      // Forex: its bar runs to full and turns Perps orange, the border lights orange, the status changes
      const bk = gHand(span(f, BOOST[0], BOOST[1]));
      const b1 = $("#b1"); b1.style.width = `${(mix(0.62, 1, bk) * 100).toFixed(1)}%`;
      b1.style.background = bk > 0.5 ? ORANGE : AMBER;
      cards[1].style.borderColor = `rgba(236,139,27,${(0.09 + 0.75 * bk).toFixed(3)})`;
      $("#t1").textContent = bk > 0.5 ? "Boosted" : "Open"; $("#t1").style.color = bk > 0.5 ? "#F6A03A" : "#3FD07F";
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
