// "your intelligent trading terminal" — the reference's motion beat for beat (30 fps, 230 frames), in the acend style.
//
//   0–52    3D "Slide to buy": the green knob flicks away up the track, the camera flies low along it and over it
//   53–102  cut: the order pop-up fills 17% → 100% while it slowly grows, turns to "Bought", then whips past camera
//   103–162 cut: "your intelligent trading terminal" builds word by word, the line re-centring as each word lands
//   163–229 cut: the acend wordmark, held
//
// Every element is a pure function of a continuous frame number (the 240 fps motion-blur render samples between
// frames); the cuts use the whole frame so blur samples never mix two shots.
(function () {
  const FPS = 30, FRAMES = 230;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));
  function spline(keys) {
    const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]);
    const h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; d[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
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
  const CUT_CARD = 53, CUT_TEXT = 103, CUT_LOGO = 163;

  // ---- beat 1: camera + knob (world units; track top at y 0.12, near end z 4, far end z -27)
  const knobZ = (f) => lerp(2.6, -20, outCubic(f / 11)); // a quick flick that settles near the far end
  const CY = spline([[0, 9.5], [12, 6.2], [24, 3.6], [34, 2.0], [40, 1.32], [46, 1.04], [53, 0.97]]);
  const CZ = spline([[0, 10.5], [12, 4.5], [24, -5.5], [34, -13.2], [40, -17.3], [46, -19.85], [53, -21.5]]);
  const LY = spline([[0, 0], [24, 0.05], [40, 0.32], [53, 0.45]]);
  const LZ = spline([[0, -9], [12, -15], [24, -21], [34, -26], [40, -30], [53, -40]]);

  // ---- beat 2: the pop-up card (base 828 px wide, centred), scale + centre
  const CS = spline([[53, 1.0], [57, 1.14], [66, 1.34], [78, 1.48], [90, 1.76], [96, 2.17], [99, 2.9], [102.9, 4.6]]);
  const CX = spline([[53, 960], [90, 960], [96, 966], [99, 1170], [102.9, 1720]]);
  const CYc = spline([[53, 540], [66, 538], [78, 548], [90, 612], [96, 720], [99, 880], [102.9, 1250]]);
  const FILL = spline([[53, 17], [57, 36], [66, 78], [78, 97], [86, 100]]);
  const BOUGHT = 87;

  // ---- beat 3: words
  const WORDS = ["your", "intelligent", "trading", "terminal"];
  const WT = [103, 109, 121, 133];

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <canvas id="gl" width="1920" height="1080"></canvas>
      <div id="ghost">$375 <span>Receive ~4.00 ko</span></div>
      <div id="cardScene"><div id="card">
        <div class="c-row1"><span class="tag">Buy · Market</span><span class="done">Done</span></div>
        <div class="c-row2"><img src="assets/icons/cocacola.png" alt=""><b>KO</b><i>@</i><b>$93.76</b>
          <span class="stat"><svg class="ring" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#e3e1dc" stroke-width="3.4"/>
            <circle class="arc" cx="16" cy="16" r="12" fill="none" stroke="#4f8c68" stroke-width="3.4" stroke-linecap="round" pathLength="100" transform="rotate(-90 16 16)"/></svg>
            <svg class="ok" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#4f8c68"/><path d="m9.5 16.5 4.4 4.4 8.6-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="pct">17% filled</span><span class="bought">Bought</span></span></div>
        <div class="c-div"></div>
        <div class="c-row3"><span>Amount <b>$375.00</b></span><span>Shares <b>4.00 KO</b></span></div>
      </div></div>
      <div id="textScene"><div id="line">${WORDS.map((w) => `<span>${w}</span>`).join(" ")}</div></div>
      <div id="logoScene"><img src="assets/acend-logo.png" alt="acend"></div>
      <span id="meas"></span>`;
    const $ = (s) => stage.querySelector(s);
    const gl = $("#gl"), ghost = $("#ghost"), cardScene = $("#cardScene"), card = $("#card"), arc = $(".arc"), pct = $(".pct");
    const okEl = $(".ok"), ring = $(".ring"), boughtEl = $(".bought"), textScene = $("#textScene"), line = $("#line"), logo = $("#logoScene"), meas = $("#meas");
    const spans = [...line.children];
    SLIDER3D.mount(gl);
    const widthOf = (t) => { meas.textContent = t; return meas.getBoundingClientRect().width; };

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1), fi = Math.round(f);
      const shot = fi < CUT_CARD ? 1 : fi < CUT_TEXT ? 2 : fi < CUT_LOGO ? 3 : 4;
      // keep each shot's motion inside its own window, so blur samples near a cut stay in that shot
      const g = shot === 1 ? Math.min(f, CUT_CARD - 0.5) : shot === 2 ? clamp(f, CUT_CARD, CUT_TEXT - 0.1) : shot === 3 ? Math.max(f, CUT_TEXT) : f;

      gl.style.display = shot === 1 ? "block" : "none";
      ghost.style.display = shot === 1 && g < 6 ? "block" : "none";
      if (shot === 1) {
        SLIDER3D.render({ knobZ: knobZ(g), cy: CY(g), cz: CZ(g), ly: LY(g), lz: LZ(g) });
        ghost.style.opacity = (0.35 * (1 - smoother(g / 4))).toFixed(3);
        ghost.style.transform = `translate(-50%, ${(-20 * smoother(g / 5)).toFixed(2)}px)`;
      }

      cardScene.style.display = shot === 2 ? "block" : "none";
      if (shot === 2) {
        const s = CS(g);
        card.style.transform = `translate(${(CX(g) - 414).toFixed(2)}px, ${(CYc(g) - 118).toFixed(2)}px) scale(${s.toFixed(4)})`;
        const p = Math.round(FILL(g));
        arc.style.strokeDasharray = `${FILL(g).toFixed(2)} 100`;
        pct.textContent = p + "% filled";
        const b = smoother((g - BOUGHT) / 5);
        ring.style.opacity = (1 - b).toFixed(3); pct.style.opacity = (1 - b).toFixed(3);
        okEl.style.opacity = b.toFixed(3); okEl.style.transform = `scale(${(0.7 + 0.3 * b).toFixed(4)})`;
        boughtEl.style.opacity = b.toFixed(3);
      }

      textScene.style.display = shot === 3 ? "block" : "none";
      if (shot === 3) {
        // line width eases from the previous word count to the current one; new words fade in at their final place
        let n = 0; WT.forEach((w) => { if (g >= w) n++; });
        const wOf = (k) => (k ? widthOf(WORDS.slice(0, k).join(" ")) : 0);
        const e = smoother((g - WT[n - 1]) / 6);
        const w = lerp(wOf(n - 1), wOf(n), n > 1 ? e : 1);
        const sc = 1 + 0.035 * smoother((g - CUT_TEXT) / 60);
        line.style.transform = `translate(${(960 - w / 2).toFixed(2)}px, -50%) scale(${sc.toFixed(4)})`;
        spans.forEach((sp, i) => { sp.style.opacity = g >= WT[i] ? smoother((g - WT[i] + 0.6) / 3.4).toFixed(3) : 0; });
      }

      logo.style.display = shot === 4 ? "flex" : "none";
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { SLIDER3D.redrawLabel(); render(R._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
