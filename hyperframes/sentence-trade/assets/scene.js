// "Your next trade starts with a sentence" — beat-for-beat rebuild of the reference cut at 30 fps (153 frames).
// Every element is a pure function of the frame number f, so any seek redraws the exact frame.
//
//   0–26    "Your next" grows, "trade" joins, the line squeezes shut
//   27–46   "starts" punches in big and settles, "with a" joins
//   47–74   "sentence" in blue with a lavender sweep; four coins tumble in and idle
//   74–88   the word dissolves letter by letter, the Solana coin flips toward the phone
//   81–108  the Trade screen rises; each coin flies down and becomes its row icon
//   96–152  prices tick, the screen scrolls to the AI input + keyboard and a prompt is typed
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
  const BLUE = [3, 0, 254];
  const LAV = [133, 127, 244];
  const PALE = [226, 224, 252];
  const WORD = "sentence";

  // Font size runs as one continuous curve per phrase, as in the reference: it keeps easing and never
  // parks. When a word joins, the line starts nudged right (the old words barely move) and glides to centre.
  function headline(f) {
    if (f < 27) {
      let size = 142 + 50 * (1 - Math.exp(-f / 4)) + 0.95 * f;
      let gap = 0;
      if (f > 19) size *= 1 - 0.15 * Math.pow((f - 19) / 7, 2.6);
      if (f > 22) gap = -0.27 * Math.pow((f - 22) / 4, 1.8);
      return f < 7
        ? { text: "Your next", size }
        : { text: "Your next trade", size, gap, join: { at: 7, prev: "Your next" } };
    }
    if (f < 47) {
      const size = 140 + 76 * Math.exp(-(f - 27) / 1.6) - 0.35 * (f - 27);
      return f < 35 ? { text: "starts", size } : { text: "starts with a", size, join: { at: 35, prev: "starts", k: 0.14 } };
    }
    if (f < 90) return { text: WORD, size: 258 + 0.12 * (f - 47), blue: true };
    return null;
  }

  function letterColor(i, f) {
    // lavender sweep left to right while the coins arrive, then a dissolve left to right
    const c = (f - 47) / 1.9;
    let t = Math.exp(-Math.pow((i - c) / 1.1, 2)) * 0.85;
    if (i >= WORD.length - 2) t = Math.max(t, 0.32 * smoother((f - 58) / 4) * (1 - smoother((f - 64) / 10)));
    let col = mix(BLUE, LAV, t);
    const s = 74 + i * 1.25;
    const u = (f - s) / 3;
    if (u <= 0) return rgb(col);
    col = u < 1 ? mix(col, LAV, smoother(u)) : mix(LAV, PALE, smoother(u - 1));
    return rgb(col, 1 - smoother((f - s - 3.5) / 3.5));
  }

  // ------------------------------------------------------------------ phone
  const K = 700 / PHONE.W; // pt -> px on screen
  const PHONE_LEFT = 585;
  // rise, slow drift, a long scroll that peaks around frame 120, settle, then the next scroll starts
  const phoneTop = spline([
    [81, 640], [84, 480], [88, 285], [92, 182], [96, 134], [100, 112], [108, 78],
    [114, 38], [118, -112], [121, -250], [124, -348], [128, -404], [134, -428], [140, -440], [146, -454], [152, -500],
  ]);
  const phoneOpacity = (f) => smoother((f - 81) / 8);
  const phoneBlur = (f) => 12 * (1 - smoother((f - 81) / 9));
  const iconPos = (i, f) => ({
    x: PHONE_LEFT + 25 + (PHONE.ICON_X + PHONE.ICON / 2) * K,
    y: phoneTop(f) + 25 + (PHONE.ROW0 + i * PHONE.PITCH + PHONE.ICON / 2) * K,
  });
  const ICON_D = PHONE.ICON * K;

  // ------------------------------------------------------------------ coins
  // Free flight as splines (viewport px / degrees); coins never hold still — after the tumble they keep
  // drifting and turning at a steady rate. Landing blends onto the row icon's live position.
  const COINS = [
    {
      key: "solana", row: 0, from: 47,
      x: [[47, 966], [53, 964], [76, 956], [81, 935], [87, 884], [95, 820]],
      y: [[47, 350], [53, 343], [76, 336], [81, 370], [87, 436], [95, 520]],
      d: [[47, 26], [49, 118], [53, 198], [60, 206], [76, 212], [87, 178], [95, 124]],
      rx: [[47, 0], [53, 6], [76, -8], [87, -14], [95, -6]],
      ry: [[47, -300], [50, -90], [53, -18], [60, -2], [76, 24], [81, 82], [87, 172], [95, 330]],
      rz: [[47, 0], [95, 0]],
      land: [86, 96], ryEnd: 360,
    },
    {
      key: "bitcoin", row: 1, from: 48,
      x: [[48, -200], [51, 140], [54, 235], [60, 318], [75, 346], [86, 362], [99, 380]],
      y: [[48, 1200], [51, 900], [54, 815], [60, 728], [75, 590], [86, 552], [99, 530]],
      d: [[48, 430], [60, 402], [75, 306], [86, 286], [99, 270]],
      rx: [[48, 85], [53, 62], [60, 54], [75, 38], [86, 30], [99, 24]],
      ry: [[48, -230], [53, -72], [60, -40], [75, -24], [86, -14], [99, -6]],
      rz: [[48, -70], [60, -42], [75, -30], [86, -24], [99, -18]],
      land: [86, 99], ryEnd: 0,
    },
    {
      key: "ethereum", row: 2, from: 50,
      x: [[50, 2160], [53, 1965], [57, 1842], [60, 1778], [86, 1690], [102, 1640]],
      y: [[50, 1110], [53, 890], [57, 858], [60, 856], [86, 846], [102, 840]],
      d: [[50, 440], [60, 430], [86, 405], [102, 390]],
      rx: [[50, 34], [57, 21], [60, 18], [86, 10], [102, 6]],
      ry: [[50, 260], [55, 130], [60, 64], [70, 50], [86, 32], [102, 20]],
      rz: [[50, 42], [60, 16], [86, 6], [102, 2]],
      land: [88, 102], ryEnd: 0,
    },
    {
      key: "zcash", row: 3, from: 59,
      x: [[59, -360], [62, 130], [66, 360], [70, 440], [86, 492], [97, 556], [108, 590]],
      y: [[59, 1360], [62, 1060], [66, 966], [70, 948], [86, 936], [97, 952], [108, 960]],
      d: [[59, 660], [70, 648], [86, 614], [97, 430], [108, 300]],
      rx: [[59, 62], [64, 30], [70, 21], [86, 12], [97, 6], [108, 3]],
      ry: [[59, 115], [62, 78], [66, 47], [70, 37], [86, 22], [97, 10], [108, 4]],
      rz: [[59, -22], [70, -10], [97, -3], [108, -1]],
      land: [97, 108], ryEnd: 0,
    },
  ];
  COINS.forEach((c) => ["x", "y", "d", "rx", "ry", "rz"].forEach((k) => (c[k] = spline(c[k]))));

  function coinPose(c, f) {
    let p = { x: c.x(f), y: c.y(f), d: c.d(f), rx: c.rx(f), ry: c.ry(f), rz: c.rz(f), r: 50 };
    const L = smoother((f - c.land[0]) / (c.land[1] - c.land[0]));
    if (L > 0) {
      const t = iconPos(c.row, f);
      p = {
        x: lerp(p.x, t.x, L), y: lerp(p.y, t.y, L), d: lerp(p.d, ICON_D, L),
        rx: lerp(p.rx, 0, L), ry: lerp(p.ry, c.ryEnd, L), rz: lerp(p.rz, 0, L),
        r: lerp(50, 22.5, smoother((L - 0.5) / 0.5)),
      };
    }
    p.landed = L >= 1;
    return p;
  }

  const BASE = 600, THICK = 92, LAYERS = 56;
  function buildCoin(key) {
    const g = LOGOS[key];
    const el = document.createElement("div");
    el.className = "coin";
    let html = "";
    for (let i = 0; i < LAYERS; i++) {
      const z = -THICK / 2 + (THICK * i) / (LAYERS - 1);
      // rim: darker toward the back, a light band near the front lip
      const u = i / (LAYERS - 1);
      const col = u > 0.86 ? g.rim : g.rimDark;
      const shade = u > 0.86 ? 1 : 0.82 + 0.18 * u;
      html += `<div style="transform:translateZ(${z.toFixed(2)}px);background:${col};filter:brightness(${shade.toFixed(3)})"></div>`;
    }
    const face = (back) =>
      `<div class="face" style="transform:translateZ(${back ? -THICK / 2 - 0.5 : THICK / 2 + 0.5}px)${back ? " rotateY(180deg)" : ""};background:${g.bg}">
        ${LOGOS.art(key)}<div class="bevel"></div></div>`;
    el.innerHTML = html + face(true) + face(false);
    return el;
  }

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;

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
      const el = buildCoin(c.key);
      wrap.appendChild(el);
      coinHost.appendChild(wrap);
      el.querySelectorAll(".bevel").forEach((b) => {
        b.style.boxShadow = `inset 0 0 0 30px ${LOGOS[c.key].rim}55, inset 0 0 0 34px rgba(0,0,0,.10), inset 0 0 60px rgba(255,255,255,.10)`;
      });
      return { c, wrap, el };
    });

    let lastText = null;
    const PROMPT = "Buy $100 of SOL";

    function render(f) {
      f = clamp(Math.round(f), 0, FRAMES - 1);

      // headline
      const h = headline(f);
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
        line.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), -54%)`;
        if (h.blue) [...line.children].forEach((s, i) => (s.style.color = letterColor(i, f)));
        else line.style.color = "#0b0b0c";
      }

      // phone
      const top = phoneTop(f);
      const op = phoneOpacity(f);
      phoneWrap.style.display = op > 0 ? "block" : "none";
      phoneWrap.style.transform = `translateY(${top}px)`;
      phoneWrap.style.opacity = op;
      const blur = phoneBlur(f);
      phoneWrap.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";

      // live prices: tick every other frame once the screen is up
      const tk = Math.max(0, Math.floor((f - 86) / 2));
      PHONE.rows.forEach((r, i) => {
        const dir = r.pct >= 0 ? 1 : (i % 2 ? -1 : 1);
        const jitter = Math.sin(tk * 1.7 + i * 2.3) * 0.25;
        const v = r.price * (1 + dir * 0.00009 * (tk + jitter));
        ui.prices[i].textContent = PHONE.fmt(v, r.dp);
        ui.pcts[i].textContent = Math.abs(r.pct + 0.01 * Math.floor(tk / 3) * (r.pct >= 0 ? 1 : -0.5)).toFixed(2) + "%";
      });

      // AI prompt: caret blinks, then the sentence is typed once the keyboard is in view
      const n = clamp(f - 124, 0, PROMPT.length);
      ui.typed.textContent = PROMPT.slice(0, n);
      ui.ph.style.display = n > 0 ? "none" : "inline";
      ui.caret.style.opacity = n > 0 && n < PROMPT.length ? 1 : Math.floor(f / 8) % 2 ? 0 : 1;
      if (n === 0) ui.caret.style.order = -1;
      else ui.caret.style.order = 0;

      // coins
      coins.forEach(({ c, wrap, el }) => {
        const slot = ui.slots[c.row];
        if (f < c.from) { wrap.style.display = "none"; slot.style.opacity = 0; return; }
        const p = coinPose(c, f);
        slot.style.opacity = p.landed ? 1 : 0;
        if (p.landed) { wrap.style.display = "none"; return; }
        wrap.style.display = "block";
        wrap.style.perspectiveOrigin = `${p.x}px ${p.y}px`;
        el.style.setProperty("--r", p.r + "%");
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
