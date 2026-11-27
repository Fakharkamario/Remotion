// GOAT Funded Perps: "Pick your path" (220 frames @ 30 fps), built on the supplied reference (a glowing line climbs
// through tier cards that light up as it reaches them, a hero LEGEND card blooms at the top, then a product screen
// with a cursor and a golden flash), in the Perps brand, timed to the supplied voiceover:
//   "Pick your path: Legacy, Blitz, or GOAT, three one-step challenges.
//    Flip the toggles and build your challenge your way."
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 220;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const expoOut = (x) => { const t = clamp(x, 0, 1); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  const easeOut = (x, p) => 1 - Math.pow(1 - clamp(x, 0, 1), p || 3);
  const ease = (x) => { const t = clamp(x, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // monotone cubic through [[x, y], ...]
  const key = (pts) => {
    const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
    return (t) => {
      if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (t > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h;
      return (2 * u ** 3 - 3 * u ** 2 + 1) * ys[i] + (u ** 3 - 2 * u ** 2 + u) * h * m[i] + (-2 * u ** 3 + 3 * u ** 2) * ys[i + 1] + (u ** 3 - u ** 2) * h * m[i + 1];
    };
  };

  // ---------------- timing (frames), from the voiceover's word times ----------------
  // legacy 1.16 s, blitz 1.96, GOAT 2.46, "three one-step challenges" 3.08-4.38, flip 4.70, toggles 5.06,
  // build 5.70, challenge 6.10, "your way" 6.50-7.08
  const CUT = 138;                               // cut to the builder on "flip"
  const CLICKS = [150, 156, 162];                // the toggles flip in a cascade on "flip the toggles"
  const START = 194;                             // one deliberate click on the start button, on "your way"
  const LEAD = 150;                              // the glowing tip rides LEAD px ahead of the camera
  // glide(a, b): an S-curve whose speed follows u^a (1-u)^b. Measured on the reference, every camera move
  // builds up over its first quarter and then bleeds off on a long tail, so a ~ 1.5-2 and b ~ 4.
  const glide = (a, b) => {
    const N = 400, T = [0];
    for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N; T.push(T[i - 1] + Math.pow(u, a) * Math.pow(1 - u, b)); }
    return (x) => { const v = clamp(x, 0, 1) * N, i = Math.min(N - 1, Math.floor(v)); return mix(T[i], T[i + 1], v - i) / T[N]; };
  };
  const gCam = glide(1.7, 4), gIn = glide(1.2, 4), gHand = glide(2, 3);
  const vClimb = (f) => 12 * smooth(f / 60) * (1 - smooth((f - 76) / 22)); // world px per frame, keeps building
  const SURGE = [74, 128, 360];                    // [from, to, px]: the push up onto the hero, never a snap
  const CAMS = [300];
  for (let k = 1; k <= CUT + 2; k++) CAMS.push(CAMS[k - 1] - vClimb(k - 0.5));
  const CAM = (f) => { const i = clamp(Math.floor(f), 0, CAMS.length - 2), u = f - i; return mix(CAMS[i], CAMS[i + 1], u) - SURGE[2] * gCam(span(f, SURGE[0], SURGE[1])) - 0.9 * Math.max(0, f - SURGE[1]); };
  const HERO_C = CAM(CUT) - 121;                 // the hero card ends centred in frame
  const HERO_Y = HERO_C + 175;                   // world y of the hero card's bottom edge (where the line meets it)
  const TIP = (f) => Math.max(HERO_Y, mix(CAM(f) + 420, CAM(f) - LEAD, easeOut(f / 8, 2)));
  let HERO_AT = 0; while (HERO_AT < CUT && TIP(HERO_AT) > HERO_Y + 2) HERO_AT++;
  const CARDS = [
    { id: "legacy", name: "LEGACY", tag: "CHALLENGE 01", letter: "L", side: -1, at: 33, col: "silver" },
    { id: "blitz", name: "BLITZ", tag: "CHALLENGE 02", letter: "B", side: 1, at: 57, col: "orange" },
    { id: "goat", name: "GOAT", tag: "CHALLENGE 03", letter: "G", side: -1, at: 72, col: "gold" },
  ].map((c) => Object.assign(c, { y: Math.round(TIP(c.at)) }));

  const hex = (letter, cls) => `<svg class="hex ${cls}" viewBox="0 0 100 100"><path d="M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z"/><text x="50" y="62" text-anchor="middle">${letter}</text></svg>`;

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <div id="A" class="layer">
        <div id="aBg" class="layer"></div>
        <div id="world" class="world">
          <div id="rail" class="rail"></div>
          <div id="line" class="line"></div>
          <div id="tip" class="tip"></div>
          ${CARDS.map((c) => `
            <div class="node" id="n-${c.id}" style="top:${c.y}px"></div>
            <div class="arm ${c.side < 0 ? "l" : "r"}" id="a-${c.id}" style="top:${c.y}px"></div>
            <div class="tier ${c.col} ${c.side < 0 ? "l" : "r"}" id="c-${c.id}" style="top:${c.y - 62}px">
              ${hex(c.letter, "")}
              <div class="tx"><small>${c.tag}</small><b>${c.name}</b></div>
              <span class="pill">LOCKED</span>
            </div>`).join("")}
          <div id="hero" class="hero" style="top:${HERO_Y - 350}px">
            <div class="hbadge">${hex("1", "big")}</div>
            <div class="htitle">ONE STEP</div>
            <div class="hsub">Three challenges. One step each.</div>
          </div>
        </div>
      </div>
      <div id="B" class="layer">
        <div id="bBg" class="layer"></div>
        <div id="cam" class="cam">
          <div class="panel">
            <div class="ph"><div><small>NEW CHALLENGE</small><h1>BUILD YOUR CHALLENGE</h1></div>
              <div class="seg"><span>Legacy</span><span>Blitz</span><span class="on">GOAT</span></div></div>
            <div class="pb">
              <div class="opts">
                <div class="sizes"><small>Account size</small><div><span>$5K</span><span>$10K</span><span>$25K</span><span class="on">$50K</span><span>$100K</span></div></div>
                ${[["Daily payouts", "Request a reward any day, paid the same day"], ["90% profit split", "Keep more of every winning trade"], ["Weekend holding", "Hold positions through Saturday and Sunday"], ["Boosted leverage", "Up to 25x on forex, 10x on BTC and ETH"]]
                  .map(([t, d], i) => `<div class="row" id="row${i}"><div><b>${t}</b><small>${d}</small></div><div class="tog ${i === 3 ? "on" : ""}" id="tog${i}"><i></i></div></div>`).join("")}
              </div>
              <div class="sum">
                <small>Your challenge</small>
                <div class="sname">GOAT · $50K</div>
                <div class="sline"><span>Type</span><b>1-Step</b></div>
                <div class="sline"><span>Profit target</span><b>8%</b></div>
                <div class="sline"><span>Daily loss</span><b>Balance-based</b></div>
                <div class="price"><small>Price</small><b id="price">$249</b></div>
                <div class="go" id="go">Start challenge</div>
              </div>
            </div>
          </div>
          <div class="rip" id="rip0"></div><div class="rip" id="rip1"></div><div class="rip" id="rip2"></div><div class="rip" id="rip3"></div>
          <div id="cursor" class="cursor"><svg viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.4 L18 13.4 Z"/></svg></div>
        </div>
        <div id="flash" class="layer"></div>
        <div id="result" class="result" style="display:none"><div class="rc-in">
          <small>YOUR CHALLENGE</small><h2>GOAT · $50K</h2>
          <div class="rc-tags"><span>1-Step</span><span>Daily payouts</span><span>90% split</span><span>Weekend holding</span><span>Boosted leverage</span></div>
          <div class="rc-f"><div><small>Price</small><b>$319</b></div><div class="rc-go">Ready to trade</div></div>
        </div><div class="rc-heat"></div></div>
      </div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);
    const world = $("#world"), line = $("#line"), tip = $("#tip"), hero = $("#hero");
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });

    // part B camera. Reference: the page cuts in already moving up and bleeds that off; before it has fully
    // stopped a push-in builds, peaks and tails off onto the button. The moves overlap, so it never sits dead.
    const MOVES = [ // [from, to, dx, dy, dscale, curve]
      [CUT, CUT + 40, 0, -300, 0.05, gIn],          // arrive: rise into place
      [158, 204, -210, -120, 0.26, gCam],           // push in toward the summary and its button
      [190, 240, -20, -14, 0.03, gCam],             // a last drift under the click, still settling at the end
    ];
    const camB = (f) => {
      let x = 0, y = 300, sc = 0.95;
      MOVES.forEach(([t0, t1, dx, dy, ds, g]) => { const k = g(span(f, t0, t1)); x += dx * k; y += dy * k; sc += ds * k; });
      return { x, y, sc };
    };
    const toggleXY = (i) => [-18, -122 + i * 92];
    const GO = [362, 204];
    // the cursor drifts in from the lower right with the push, decelerates onto the button, rests, clicks
    const HAND = [164, START - 4, [640, 470], GO];
    const cursorAt = (f) => {
      const k = gHand(span(f, HAND[0], HAND[1])), bow = Math.sin(Math.PI * k) * 40;
      return [mix(HAND[2][0], HAND[3][0], k) - bow * 0.3, mix(HAND[2][1], HAND[3][1], k) + bow];
    };
    const PRESSES = [START];
    const pressAt = (f) => (f >= START - 1 && f <= START + 5 ? Math.sin(Math.PI * (f - START + 1) / 6) : 0);

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const inA = f < CUT;
      $("#A").style.display = inA ? "" : "none"; $("#B").style.display = inA ? "none" : "";
      if (inA) {
        const cam = CAM(f), tipY = TIP(f);
        world.style.transform = `translate(960px, ${(680 - cam * 1.16).toFixed(1)}px) scale(1.16)`;
        // the glowing line from below the frame up to the tip
        line.style.top = `${tipY.toFixed(1)}px`; line.style.height = `${(900 - tipY).toFixed(1)}px`;
        tip.style.top = `${tipY.toFixed(1)}px`;
        tip.style.opacity = f < HERO_AT + 4 ? 1 : 1 - span(f, HERO_AT + 4, HERO_AT + 10);
        CARDS.forEach((c) => {
          const reached = span(f, c.at - 3, c.at + 1);          // the line arrives at the branch
          const arm = easeOut(span(f, c.at - 1, c.at + 5), 2);   // the connector draws out to the card
          const lit = easeOut(span(f, c.at + 2, c.at + 10), 2.4);// and the card lights up
          const a = $(`#a-${c.id}`), n = $(`#n-${c.id}`), card = $(`#c-${c.id}`);
          a.style.transform = `scaleX(${arm.toFixed(3)})`;
          n.style.opacity = (0.35 + 0.65 * reached).toFixed(3);
          n.style.boxShadow = `0 0 ${(18 * reached).toFixed(1)}px rgba(246,170,80,${(0.9 * reached).toFixed(2)})`;
          card.classList.toggle("lit", lit > 0.5);
          card.style.setProperty("--lit", lit.toFixed(3));
          card.style.transform = `translateY(-50%) scale(${(1 + 0.05 * Math.sin(Math.PI * lit)).toFixed(4)})`;
          card.querySelector(".pill").textContent = lit > 0.5 ? "1-STEP" : "LOCKED";
        });
        // the hero card blooms out of a soft glow as the line reaches it, then settles and breathes
        const hk = easeOut(span(f, HERO_AT - 2, HERO_AT + 12), 2.4);
        hero.style.opacity = Math.min(1, hk * 1.6).toFixed(3);
        hero.style.filter = hk < 1 ? `blur(${((1 - hk) * 16).toFixed(1)}px)` : "none";
        hero.style.transform = `translateX(-50%) scale(${(mix(1.16, 1, hk) * mix(1, 1.04, span(f, HERO_AT + 12, CUT))).toFixed(4)})`;
        hero.style.setProperty("--glow", (Math.max(0, 1 - span(f, HERO_AT + 4, HERO_AT + 24)) * 0.8 + 0.35).toFixed(3));
        const t2 = easeOut(span(f, HERO_AT + 4, HERO_AT + 14), 2.4);
        hero.querySelector(".htitle").style.opacity = t2.toFixed(3);
        hero.querySelector(".htitle").style.transform = `translateY(${((1 - t2) * 16).toFixed(1)}px)`;
        hero.querySelector(".hsub").style.opacity = easeOut(span(f, HERO_AT + 10, HERO_AT + 20), 2).toFixed(3);
        $("#aBg").style.transform = `translateY(${(-cam * 0.12).toFixed(1)}px)`;
      } else {
        const cam = $("#cam"), C = camB(f);
        cam.style.transform = `translate(-50%, -50%) translate(${C.x.toFixed(1)}px, ${C.y.toFixed(1)}px) perspective(2200px) rotateX(${mix(9, 3, gIn(span(f, CUT, CUT + 60))).toFixed(2)}deg) scale(${C.sc.toFixed(4)})`;
        cam.style.opacity = (0.35 + 0.65 * easeOut(span(f, CUT, CUT + 5), 2)).toFixed(3);
        // after the start click the page behind softens and dims under the result card, as in the reference
        const modal = gHand(span(f, START + 2, START + 18));
        cam.style.filter = f < CUT + 6 ? `blur(${((1 - easeOut(span(f, CUT, CUT + 6), 2)) * 10).toFixed(1)}px)` : modal > 0 ? `blur(${(modal * 7).toFixed(1)}px) brightness(${(1 - modal * 0.4).toFixed(3)})` : "none";
        // cursor: quick settling moves with a press dip on every click
        const cur = $("#cursor"), [cx, cy] = cursorAt(f), pr = Math.min(1, pressAt(f));
        cur.style.transform = `translate(${cx.toFixed(1)}px, ${(cy + pr * 3).toFixed(1)}px) scale(${(1 - 0.16 * pr).toFixed(3)})`;
        cur.style.opacity = (easeOut(span(f, HAND[0], HAND[0] + 8), 2) * (1 - span(f, START + 8, START + 14))).toFixed(3);
        PRESSES.forEach((c, i) => {
          const rp = $(`#rip${i}`), k = span(f, c, c + 10);
          const [x, y] = [GO[0] + 7, GO[1] + 70];
          rp.style.transform = `translate(${x}px, ${y}px) scale(${(0.3 + 1.3 * easeOut(k, 2.4)).toFixed(3)})`;
          rp.style.opacity = (k > 0 && k < 1 ? Math.pow(1 - k, 1.5) * 0.85 : 0).toFixed(3);
        });
        let price = 249;
        CLICKS.forEach((c, i) => {
          const k = gHand(span(f, c, c + 7)), t = $(`#tog${i}`);
          t.style.setProperty("--k", k.toFixed(3)); t.classList.toggle("on", k > 0.5);
          $(`#row${i}`).style.setProperty("--hl", (Math.sin(Math.PI * span(f, c - 2, c + 18)) * 0.9).toFixed(3));
          if (f >= c + 2) price += [20, 30, 20][i];
        });
        $("#price").textContent = `$${price}`;
        $("#price").style.transform = `scale(${(1 + 0.1 * CLICKS.reduce((a, c) => a + Math.max(0, 1 - Math.abs(f - c - 3) / 4), 0)).toFixed(3)})`;
        const go = $("#go"), gp = Math.max(0, 1 - Math.abs(f - START - 1) / 3);
        go.style.transform = `scale(${(1 - 0.06 * gp).toFixed(3)})`;
        go.style.filter = `brightness(${(1 - 0.18 * gp).toFixed(3)})`;
        go.style.boxShadow = `0 0 ${(20 + 50 * gp).toFixed(1)}px rgba(246,160,58,${(0.35 + 0.4 * gp).toFixed(2)})`;
        $("#flash").style.opacity = 0;
        // the result: a card slides in from the right white-hot and cools to its colours (the reference's modal)
        const rc = $("#result"), rk = gIn(span(f, START + 2, START + 30)), heat = 1 - gHand(span(f, START + 3, START + 17));
        rc.style.display = f >= START + 2 ? "" : "none";
        rc.style.transform = `translate(-50%, -50%) translate(${mix(520, 0, rk).toFixed(1)}px, ${mix(60, 0, rk).toFixed(1)}px) rotate(${mix(3, 0, rk).toFixed(2)}deg) scale(${mix(0.9, 1, rk).toFixed(4)})`;
        rc.style.setProperty("--heat", heat.toFixed(3)); rc.style.opacity = easeOut(span(f, START + 2, START + 7), 2).toFixed(3);
      }
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
