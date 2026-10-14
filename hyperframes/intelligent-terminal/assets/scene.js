// "your intelligent trading terminal" — the reference's motion beat for beat (30 fps, 230 frames), in the acend style.
//
//   0–52    3D "Slide to buy": the knob launches up the track and cruises; the camera follows, catches up and skims over it
//   53–103  cut: the order pop-up fills 17% → 100% while it slowly grows, turns to "Bought", then drops out through
//           the bottom of frame, over the first word of the next shot (100–103)
//   100–163 "your intelligent trading terminal" builds word by word: each word pops in with extra space before it,
//           and the gap closes as the whole line glides back to centre; then the line sinks into the cut
//   164–229 cut: the acend wordmark rises a few pixels into place, held
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
  const CUT_CARD = 53, CARD_END = 103, CUT_TEXT = 100, CUT_LOGO = 164;
  const outQuart = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 4));

  // ---- beat 1: camera + knob, solved from the reference. Knob z and the camera pose at each keyframe were fitted
  // (grid search over a pinhole model, fov 38) to the reference's measured knob height, knob width and track-end
  // height on screen (and, for the final dive, the knob's far edge and chevron height), so the framing tracks the reference within ~1% per keyframe:
  //   the knob launches in from the bottom (~1 unit/frame), settles into a steady cruise (~0.57/frame) and slows
  //   near the far end; the camera follows it (the knob holds its place on screen while the label slides under
  //   it), then catches up and settles down onto its top face as the chevrons pass underneath.
  const KZ = spline([[0, 4.2], [2, 2.95], [3, 1.95], [4, 0.89], [5, 0.05], [6, -1.0], [12, -4.4], [18, -7.8], [24, -11.2],
    [30, -14.4], [36, -17.4], [38, -18.3], [42, -19.6], [46, -20.3], [53, -20.6]]);
  const CY = spline([[0, 5.55], [6, 5.42], [12, 4.94], [18, 4.5], [24, 4.0], [30, 2.95], [36, 2.1], [38, 1.82], [41, 1.0],
    [44, 0.86], [47, 0.79], [50, 0.73], [53, 0.69]]);
  const CZ = spline([[0, 10.9], [6, 10.6], [12, 8.85], [18, 4.0], [24, 0.6], [30, -5.9], [36, -12.2], [38, -14.0], [41, -17.55],
    [44, -18.75], [47, -19.55], [50, -20.4], [53, -21.0]]);
  const LY = spline([[0, 0], [53, 0]]);
  const LZ = spline([[0, -13.5], [6, -10.9], [12, -10.3], [18, -13.3], [24, -17.1], [30, -19.9], [36, -23.8], [38, -24.7],
    [41, -25.7], [44, -26], [47, -26.6], [50, -30], [53, -35]]);
  const knobZ = KZ;

  // ---- beat 2: the pop-up card (base 828 px wide, centred), scale + centre
  // measured on the reference: it keeps growing (1.57x at 84, 1.72x at 89, 1.99x at 94) while sinking, then falls
  // out through the bottom edge (top edge at 53% of frame on 99, 69% on 100, 87% on 101, gone by 103)
  const CS = spline([[53, 1.0], [57, 1.14], [66, 1.34], [78, 1.48], [84, 1.565], [89, 1.716], [94, 1.99], [99, 2.28], [103.5, 2.5]]);
  const CX = spline([[53, 960], [103.5, 960]]);
  const CYc = spline([[53, 540], [66, 538], [78, 546], [84, 551], [89, 605], [94, 702], [97, 775], [99, 850], [100, 960],
    [101, 1135], [102, 1290], [103, 1390], [103.5, 1430]]);
  const FILL = spline([[53, 17], [57, 36], [66, 78], [78, 97], [86, 100]]);
  const BOUGHT = 87;

  // ---- beat 3: words
  const WORDS = ["your", "intelligent", "trading", "terminal"];
  const WT = [100, 108, 120, 130];
  const GAP = 28, SETTLE = 14; // extra space a new word lands with; frames for the line to glide back to centre

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <canvas id="gl" width="1920" height="1080"></canvas><canvas id="dof" width="1920" height="1080"></canvas>
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
    const dof = $("#dof"), dctx = dof.getContext("2d");
    const widthOf = (t) => { meas.textContent = t; return meas.getBoundingClientRect().width; };

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1), fi = Math.round(f);
      const shot = fi < CUT_CARD ? 1 : fi < CUT_TEXT ? 2 : fi < CUT_LOGO ? 3 : 4;
      const cardOn = fi >= CUT_CARD && fi <= CARD_END; // the card stays up over the first frames of the text shot
      // keep each shot's motion inside its own window, so blur samples near a cut stay in that shot
      const g = shot === 1 ? Math.min(f, CUT_CARD - 0.5) : shot === 3 ? clamp(f, CUT_TEXT - 0.5, CUT_LOGO - 0.5) : shot === 4 ? Math.max(f, CUT_LOGO - 0.5) : f;
      const gc = clamp(f, CUT_CARD - 0.5, CARD_END + 0.5);

      gl.style.display = dof.style.display = shot === 1 ? "block" : "none";
      ghost.style.display = shot === 1 && g < 6 ? "block" : "none";
      if (shot === 1) {
        SLIDER3D.render({ knobZ: knobZ(g), cy: CY(g), cz: CZ(g), ly: LY(g), lz: LZ(g), tint: smoother(g / 40) });
        // shallow depth of field, as in the reference: focus on the knob, the foreground (bottom of frame) blurs,
        // more as the camera gets close
        const blurPx = lerp(3, 11, smoother((g - 26) / 18));
        dctx.filter = `blur(${blurPx.toFixed(2)}px)`;
        dctx.clearRect(0, 0, 1920, 1080);
        dctx.drawImage(gl, 0, 0);
        const m0 = lerp(72, 80, smoother((g - 38) / 10)), m1 = lerp(96, 100, smoother((g - 38) / 10)); // keep the chevrons in focus
        dof.style.webkitMaskImage = dof.style.maskImage = `linear-gradient(to bottom, transparent ${m0.toFixed(1)}%, #000 ${m1.toFixed(1)}%)`;
        ghost.style.opacity = (0.35 * (1 - smoother(g / 4))).toFixed(3);
        ghost.style.transform = `translate(-50%, ${(-20 * smoother(g / 5)).toFixed(2)}px)`;
      }

      cardScene.style.display = cardOn ? "block" : "none";
      cardScene.style.background = shot === 2 ? "#f9f8f4" : "transparent";
      if (cardOn) {
        const s = CS(gc);
        card.style.transform = `translate(${(CX(gc) - 414).toFixed(2)}px, ${(CYc(gc) - 118).toFixed(2)}px) scale(${s.toFixed(4)})`;
        const p = Math.round(FILL(gc));
        arc.style.strokeDasharray = `${FILL(gc).toFixed(2)} 100`;
        pct.textContent = p + "% filled";
        const b = smoother((gc - BOUGHT) / 5);
        ring.style.opacity = (1 - b).toFixed(3); pct.style.opacity = (1 - b).toFixed(3);
        okEl.style.opacity = b.toFixed(3); okEl.style.transform = `scale(${(0.7 + 0.3 * b).toFixed(4)})`;
        boughtEl.style.opacity = b.toFixed(3);
      }

      textScene.style.display = shot === 3 ? "block" : "none";
      if (shot === 3) {
        // as in the reference: a new word pops in at full opacity, landing with extra space before it while the words
        // already there hold still; then the gap closes as the whole line glides back to centre (ease-out quart, so
        // it starts at the reference's ~20 px/frame and decays smoothly to rest)
        let n = 0; WT.forEach((w) => { if (g >= w - 0.5) n++; });
        n = Math.max(n, 1);
        const wOf = (k) => widthOf(WORDS.slice(0, k).join(" "));
        const e = outQuart((g - WT[n - 1]) / (n > 1 ? SETTLE : 7));
        let left, gap = 0;
        if (n === 1) left = 960 - wOf(1) / 2 - 12 * (1 - e); // the first word drifts in from a touch left of centre
        else { left = lerp(960 - wOf(n - 1) / 2, 960 - wOf(n) / 2, e); gap = GAP * (1 - e); }
        // when the line is complete it sinks into the cut, accelerating (reference: ~18 px over its last 10 frames)
        const sink = 18 * Math.pow(clamp((g - 153) / 10, 0, 1.1), 2);
        line.style.transform = `translate(${left.toFixed(2)}px, calc(-50% + ${sink.toFixed(2)}px))`;
        spans.forEach((sp, i) => {
          sp.style.opacity = i < n ? 1 : 0;
          sp.style.transform = i === n - 1 && n > 1 ? `translateX(${gap.toFixed(2)}px)` : "none";
        });
      }

      logo.style.display = shot === 4 ? "flex" : "none";
      // hard cut onto the wordmark sitting a little low, which glides up ~19 px and settles (no scale, as in the reference)
      if (shot === 4) logo.firstElementChild.style.transform = `translateY(${(-16 + 19 * (1 - outQuart((g - CUT_LOGO) / 12))).toFixed(2)}px)`;
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { SLIDER3D.redrawLabel(); render(R._f); });
    window.addEventListener("load", () => render(R._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
