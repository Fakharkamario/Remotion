// "Your next trade starts with a sentence" — beat-for-beat rebuild of the reference cut at 30 fps (153 frames).
// Every element is a pure function of the frame number f, so any seek redraws the exact frame.
//
//   0–26    "Your next" grows, "trade" joins, the line squeezes shut
//   27–46   "starts" punches in big and settles, "with a" joins
//   47–74   "sentence" rises in with a warm-grey sweep; four coins flip in and keep turning
//   74–88   the word dissolves letter by letter, the top coin spins toward the phone
//   81–108  the Explore screen rises; each coin flies down and becomes its card icon
//   96–152  percentages tick, the screen scrolls to the AI input + keyboard and a prompt is typed
(function () {
  const FPS = 30;
  const FRAMES = 153;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));

  // Smooth motion: a monotone cubic (PCHIP) through [frame, value] keys. Velocity is continuous at
  // every key, so nothing stops and restarts between keys; a turn-around eases through zero.
  function spline(keys) {
    const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]);
    const h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; d[i] = (y[i + 1] - y[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
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
  const mix = (c0, c1, t) => c0.map((v, i) => Math.round(lerp(v, c1[i], t)));
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

  // ------------------------------------------------------------------ headline
  // Brand palette from the Acend app screens: warm paper, near-black ink, warm grey for the sweep.
  // INK is the one accent token for the hero word; swap it here to retint the whole beat.
  const INK = [28, 29, 33];
  const SWEEP = [164, 160, 150];
  const PALE = [232, 230, 224];
  const WORD = "sentence";

  // Font size runs as one continuous curve per phrase, as in the reference: it keeps easing and never
  // parks. When a word joins, the line starts nudged right (the old words barely move) and glides to centre.
  // f: continuous frame (motion), fi: whole frame (which words are on screen)
  function headline(f, fi) {
    if (fi < 27) {
      let size = 142 + 50 * (1 - Math.exp(-f / 4)) + 0.95 * f;
      let gap = 0;
      if (f > 19) size *= 1 - 0.15 * Math.pow((f - 19) / 7, 2.6);
      if (f > 22) gap = -0.27 * Math.pow((f - 22) / 4, 1.8);
      return fi < 7
        ? { text: "Your next", size }
        : { text: "Your next trade", size, gap, join: { at: 7, prev: "Your next" } };
    }
    // a beat's motion starts at its cut: blur samples taken just before the cut must not run its
    // curve backwards (that doubles the outline on the cut frame)
    if (fi < 47) {
      f = Math.max(f, 27);
      const size = 140 + 76 * Math.exp(-(f - 27) / 1.6) - 0.35 * (f - 27);
      return fi < 35 ? { text: "starts", size } : { text: "starts with a", size, join: { at: 35, prev: "starts", k: 0.14 } };
    }
    // the hero word arrives low and rises into place, decelerating, then keeps a slow drift
    f = Math.max(f, 47);
    if (fi < 90) return { text: WORD, size: 258 + 0.12 * (f - 47), blue: true, dy: 89 * Math.exp(-(f - 47) / 3.4) - 0.45 * (f - 47) };
    return null;
  }

  function letterColor(i, f) {
    // lavender sweep left to right while the coins arrive, then a dissolve left to right
    const c = (f - 47) / 1.9;
    let t = Math.exp(-Math.pow((i - c) / 1.1, 2)) * 0.85;
    if (i >= WORD.length - 2) t = Math.max(t, 0.32 * smoother((f - 58) / 4) * (1 - smoother((f - 64) / 10)));
    let col = mix(INK, SWEEP, t);
    const s = 74 + i * 1.25;
    const u = (f - s) / 3;
    if (u <= 0) return rgb(col);
    col = u < 1 ? mix(col, SWEEP, smoother(u)) : mix(SWEEP, PALE, smoother(u - 1));
    return rgb(col, 1 - smoother((f - s - 3.5) / 3.5));
  }

  // ------------------------------------------------------------------ phone
  const K = 650 / PHONE.W; // pt -> px on screen
  const BEZEL = 23, HALF_W = 348; // phone frame: 696 px wide, centred on x = 960
  // rise, slow drift, a long scroll that peaks around frame 120, settle, then the next scroll starts
  const phoneTop = spline([
    [81, 640], [82, 540], [84, 434], [86, 312], [88, 244], [90, 200], [92, 162], [94, 135], [96, 116], [100, 92], [104, 80], [108, 66],
    [114, 34], [118, -60], [121, -186], [124, -280], [128, -334], [134, -358], [140, -370], [146, -384], [152, -430],
  ]);
  // the screen arrives a touch large and settles to size while it rises (scaled about its top centre)
  const phoneScale = (f) => 1 + 0.05 * (1 - smoother((f - 82) / 18));
  // keyboard sheet: parked below the screen, slides up as the scroll starts (pt)
  const sheetOffset = (f) => 352 * (1 - smoother((f - 112) / 11));
  const phoneOpacity = (f) => smoother((f - 81) / 8);
  const phoneBlur = (f) => 12 * (1 - smoother((f - 81) / 9));
  const iconPos = (i, f) => {
    const sc = phoneScale(f);
    return {
      x: 960 + (BEZEL + PHONE.iconCenter(i).x * K - HALF_W) * sc,
      y: phoneTop(f) + (BEZEL + PHONE.iconCenter(i).y * K) * sc,
      s: sc,
    };
  };
  const ICON_D = PHONE.ICON * K;

  // ------------------------------------------------------------------ coins
  // Tracked off the reference frame by frame (viewport px / degrees), mapped onto our four tokens by where
  // each lands on the 2 x 2 "Most popular" card grid (so no flight paths cross):
  //   bitcoin  = the small coin over the word: flips up out of the text (X-axis toss), spins on its
  //              vertical axis, turns its back, then drops face-up onto the top-right card
  //   solana   = the side coin: enters bottom-left showing its back, lies flat, tips edge-on and flies
  //              away in depth behind the big coin, turns its face and lands on the top-left card
  //   zcash    = the right coin: rises from the corner showing its back, flips edge-on to its face,
  //              keeps turning, then slides left onto the second-row right card
  //   ethereum = the big near coin: swings in from the left as a rim wall, opens to its face, lands last on
  //              the second-row left card
  // rx past 90 shows the plain back. Nothing ever holds still: idle is a slow continuous turn.
  const COINS = [
    {
      key: "bitcoin", row: 1, from: 47, thick: 0.12,
      x: [[47, 962], [66, 956], [76, 944], [82, 922], [86, 891], [90, 830]],
      y: [[47, 500], [49, 440], [51, 402], [54, 376], [60, 342], [66, 328], [74, 333], [80, 352], [84, 376], [88, 432], [90, 470]],
      d: [[47, 70], [50, 160], [53, 192], [60, 201], [76, 206], [82, 196], [86, 176], [90, 140]],
      rx: [[47, -360], [48, -220], [50, -100], [52, -30], [55, -6], [62, 4], [72, 7], [84, 3], [92, 0]],
      ry: [[47, 0], [58, -14], [64, -24], [70, -10], [76, 16], [80, 62], [84, 130], [88, 206], [92, 320]],
      rz: [[47, 0], [60, -4], [80, 4], [92, 0]],
      land: [86, 98],
    },
    {
      key: "solana", row: 0, from: 48, thick: 0.11,
      x: [[48, 120], [50, 140], [53, 250], [56, 315], [59, 358], [62, 386], [66, 362], [76, 355], [86, 384]],
      y: [[48, 1040], [50, 840], [53, 826], [56, 806], [59, 790], [61, 722], [63, 604], [66, 562], [76, 574], [86, 598]],
      d: [[48, 470], [54, 488], [58, 468], [60, 420], [62, 312], [64, 238], [67, 204], [80, 192], [86, 186]],
      rx: [[48, 96], [51, 138], [53, 150], [55, 120], [58, 101], [62, 89], [64, 78], [67, 54], [74, 32], [86, 16]],
      ry: [[48, -30], [52, -6], [56, 0], [66, -8], [76, 10], [86, 18]],
      rz: [[48, 42], [50, 84], [53, 58], [55, 6], [58, -34], [62, -58], [65, -60], [70, -38], [80, -20], [86, -14]],
      land: [84, 100],
    },
    {
      key: "zcash", row: 3, from: 49, thick: 0.13,
      x: [[49, 2010], [50, 1940], [52, 1858], [55, 1786], [58, 1758], [66, 1722], [76, 1645], [86, 1574], [92, 1480]],
      y: [[49, 1110], [51, 970], [54, 905], [58, 880], [66, 894], [80, 880], [92, 870]],
      d: [[49, 580], [52, 556], [54, 520], [58, 470], [62, 432], [66, 410], [80, 400], [92, 384]],
      rx: [[49, 160], [52, 140], [55, 110], [57, 90], [59, 52], [62, 25], [66, 14], [80, 10], [92, 6]],
      ry: [[49, 0], [56, -4], [59, -38], [64, -38], [72, -18], [78, 0], [84, 18], [92, 26]],
      rz: [[49, 10], [53, 24], [57, 40], [59, 27], [62, 11], [66, 6], [92, 2]],
      land: [88, 104],
    },
    {
      key: "ethereum", row: 2, from: 60, thick: 0.17,
      x: [[60, -150], [62, 140], [64, 282], [66, 384], [70, 448], [80, 490], [90, 518], [96, 560], [101, 618]],
      y: [[60, 880], [62, 920], [66, 944], [74, 958], [86, 964], [94, 968], [98, 968], [101, 966]],
      d: [[60, 690], [62, 672], [66, 650], [74, 628], [86, 602], [94, 576], [98, 540], [101, 500]],
      rx: [[60, 10], [66, 14], [80, 12], [101, 6]],
      ry: [[60, -86], [62, -58], [64, -41], [66, -32], [72, -20], [84, -2], [92, 8], [101, 12]],
      rz: [[60, 6], [66, 2], [101, -2]],
      land: [96, 111],
    },
  ];
  COINS.forEach((c) => ["x", "y", "d", "rx", "ry", "rz"].forEach((k) => (c[k] = spline(c[k]))));

  // Landing: one quintic Hermite per channel, worked out in the phone's own frame. It starts from the
  // coin's position, velocity *and acceleration* at the start of the landing (so the hand-over has no
  // jolt and the coin picks up speed gradually) and ends on the card icon at rest relative to the phone
  // (a soft arrival that rides along with the rising screen). Spins finish on the nearest whole turn.
  const q0 = (u) => 1 - 10 * u ** 3 + 15 * u ** 4 - 6 * u ** 5;
  const q1 = (u) => u - 6 * u ** 3 + 8 * u ** 4 - 3 * u ** 5;
  const q2 = (u) => 0.5 * u * u - 1.5 * u ** 3 + 1.5 * u ** 4 - 0.5 * u ** 5;
  const q5 = (u) => 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
  const ICON_R = (9.5 / 40) * 100; // the card icon's corner radius, % of its size
  function freePose(c, f) {
    return { x: c.x(f), y: c.y(f), d: c.d(f), rx: c.rx(f), ry: c.ry(f), rz: c.rz(f) };
  }
  function landingStart(c) {
    if (c._ls) return c._ls;
    const t0 = c.land[0], D = c.land[1] - c.land[0], e = 0.5;
    // backward differences (the free tracks end soon after t0), relative to the phone for position
    const p = freePose(c, t0), q = freePose(c, t0 - e), r = freePose(c, t0 - 2 * e);
    const i0 = iconPos(c.row, t0), i1 = iconPos(c.row, t0 - e), i2 = iconPos(c.row, t0 - 2 * e);
    p.x -= i0.x; q.x -= i1.x; r.x -= i2.x;
    p.y -= i0.y; q.y -= i1.y; r.y -= i2.y;
    const v = {}, a = {};
    for (const k in p) { v[k] = (p[k] - q[k]) / e; a[k] = (p[k] - 2 * q[k] + r[k]) / (e * e); }
    const spinEnd = (r, vr) => Math.round((r + vr * D * 0.35) / 360) * 360;
    c._ls = { t0, D, p, v, a,
      end: { rx: spinEnd(p.rx, v.rx), ry: spinEnd(p.ry, v.ry), rz: spinEnd(p.rz, v.rz) } };
    return c._ls;
  }
  function coinPose(c, f) {
    if (f <= c.land[0]) return { ...freePose(c, f), r: 50, bevel: 1, landed: false };
    const L = landingStart(c), u = clamp((f - L.t0) / L.D, 0, 1), D = L.D;
    const t = iconPos(c.row, f);
    const herm = (k, p1) => q0(u) * L.p[k] + q1(u) * D * L.v[k] + q2(u) * D * D * L.a[k] + q5(u) * p1;
    return {
      x: t.x + herm("x", 0),
      y: t.y + herm("y", 0),
      d: herm("d", ICON_D * t.s),
      rx: herm("rx", L.end.rx),
      ry: herm("ry", L.end.ry),
      rz: herm("rz", L.end.rz),
      r: lerp(50, ICON_R, smoother((u - 0.45) / 0.55)),
      bevel: 1 - smoother((u - 0.4) / 0.6), // the face settles into the flat icon art
      landed: u >= 1,
    };
  }

  const BASE = 600, LAYERS = 64;
  function buildCoin(key, thickK) {
    const g = LOGOS[key];
    const T = BASE * thickK;
    const el = document.createElement("div");
    el.className = "coin";
    // rim: stacked discs with a conic shade so the side reads as a lit cylinder; the angle follows the
    // coin's spin each frame (--lit) so the highlight stays on the upper left of the screen
    const rimShade = `conic-gradient(from var(--lit, 0deg), ${g.rim}, ${g.rimDark} 30%, ${g.rimDark} 55%, ${g.rim} 80%, ${g.rim})`;
    let html = "";
    for (let i = 0; i < LAYERS; i++) {
      const z = -T / 2 + (T * i) / (LAYERS - 1);
      html += `<div class="rim" style="transform:translateZ(${z.toFixed(2)}px);background:${rimShade}"></div>`;
    }
    const front = `<div class="face" style="transform:translateZ(${T / 2 + 0.6}px);background:${g.bg}">${LOGOS.art(key)}<div class="bevel"></div></div>`;
    // the back is the plain coin colour, as in the reference (the logo only shows on the face)
    const back = `<div class="face back" style="transform:translateZ(${-T / 2 - 0.6}px) rotateY(180deg);background:${g.rimDark}"><div class="bevel"></div></div>`;
    el.innerHTML = html + back + front;
    return el;
  }

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE._debug = { COINS, coinPose, iconPos }; // for offline checks of the coin paths

  SCENE.mount = function (stage) {
    stage.innerHTML = `<div id="phoneWrap"></div><div id="line"></div><div id="coins"></div><span id="meas"></span>`;
    const phoneWrap = stage.querySelector("#phoneWrap");
    const ui = PHONE.build(phoneWrap);
    const line = stage.querySelector("#line");
    const meas = stage.querySelector("#meas");
    const widthOf = (text, size, gap) => {
      meas.textContent = text;
      meas.style.fontSize = size + "px";
      meas.style.wordSpacing = (gap || 0) + "em";
      return meas.getBoundingClientRect().width;
    };
    const coinHost = stage.querySelector("#coins");

    const coins = COINS.map((c) => {
      const wrap = document.createElement("div");
      wrap.className = "coinWrap";
      const el = buildCoin(c.key, c.thick);
      wrap.appendChild(el);
      coinHost.appendChild(wrap);
      el.querySelectorAll(".bevel").forEach((b) => {
        b.style.boxShadow = `inset 0 0 0 30px ${LOGOS[c.key].rim}55, inset 0 0 0 34px rgba(0,0,0,.10), inset 0 0 60px rgba(255,255,255,.10)`;
      });
      return { c, wrap, el };
    });

    let lastText = null;
    const PROMPT = "Buy $100 of SOL";

    // f is continuous so motion can be sampled between frames (the 120 fps motion-blur render);
    // discrete state (words, price ticks, typing) uses the nearest whole frame fi
    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);

      // headline
      const h = headline(f, fi);
      if (!h) {
        line.style.display = "none";
      } else {
        line.style.display = "block";
        const key = h.text + (h.blue ? "|b" : "");
        if (key !== lastText) {
          lastText = key;
          line.className = h.blue ? "blue" : "";
          line.innerHTML = h.blue ? [...h.text].map((ch) => `<span>${ch}</span>`).join("") : h.text;
        }
        line.style.fontSize = h.size + "px";
        line.style.wordSpacing = (h.gap || 0) + "em";
        let dx = 0;
        if (h.join) {
          const grow = widthOf(h.text, h.size, h.gap) - widthOf(h.join.prev, h.size, h.gap);
          dx = (h.join.k || 0.3) * (grow / 2) * Math.exp(-(f - h.join.at) / 1.5);
        }
        line.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), calc(-54% + ${(h.dy || 0).toFixed(2)}px))`;
        if (h.blue) [...line.children].forEach((s, i) => (s.style.color = letterColor(i, f)));
        else line.style.color = rgb(INK);
      }

      // phone
      const top = phoneTop(f);
      const op = phoneOpacity(f);
      phoneWrap.style.display = op > 0 ? "block" : "none";
      phoneWrap.style.transform = `translateY(${top}px) scale(${phoneScale(f).toFixed(4)})`;
      phoneWrap.style.opacity = op;
      const blur = phoneBlur(f);
      phoneWrap.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";

      const so = sheetOffset(f);
      ui.sheet.style.transform = `translateY(${so.toFixed(2)}px)`;
      ui.sheet.style.visibility = so > 351 ? "hidden" : "visible";

      // live card percentages: tick every other frame once the screen is up
      const tk = Math.max(0, Math.floor((fi - 86) / 2));
      PHONE.cards.forEach((c, i) => {
        const step = Math.floor((tk + i) / 2) - Math.floor(i / 2);
        const wob = ((step * 7 + i * 3) % 5) - 2; // small deterministic up/down ticks
        const v = Math.max(0.01, Math.abs(c.pct) + 0.01 * (step * (c.pct >= 0 ? 1 : 0.6) + wob * 0.5));
        ui.pcts[i].textContent = v.toFixed(2) + "%";
      });

      // AI prompt: caret blinks, then the sentence is typed once the keyboard is in view
      const n = clamp(fi - 124, 0, PROMPT.length);
      ui.typed.textContent = PROMPT.slice(0, n);
      ui.ph.style.display = n > 0 ? "none" : "inline";
      ui.caret.style.opacity = n > 0 && n < PROMPT.length ? 1 : Math.floor(fi / 8) % 2 ? 0 : 1;
      if (n === 0) ui.caret.style.order = -1;
      else ui.caret.style.order = 0;

      // coins
      coins.forEach(({ c, wrap, el }) => {
        const slot = ui.slots[c.row];
        if (fi < c.from) { wrap.style.display = "none"; slot.style.opacity = 0; return; }
        const p = coinPose(c, f);
        slot.style.opacity = p.landed ? 1 : 0;
        if (p.landed) { wrap.style.display = "none"; return; }
        wrap.style.display = "block";
        wrap.style.perspectiveOrigin = `${p.x}px ${p.y}px`;
        el.style.setProperty("--r", p.r + "%");
        el.style.setProperty("--bevel", p.bevel.toFixed(3));
        el.style.setProperty("--lit", (200 - p.rz - p.ry * 0.5).toFixed(1) + "deg");
        el.style.transform =
          `translate3d(${(p.x - BASE / 2).toFixed(2)}px, ${(p.y - BASE / 2).toFixed(2)}px, 0) scale(${(p.d / BASE).toFixed(4)}) ` +
          `rotateZ(${p.rz.toFixed(2)}deg) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg)`;
      });

    }

    // GSAP proxy tween drives the frame so HyperFrames seeks redraw deterministically
    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
