// "Your next trade starts with a sentence" — beat-for-beat rebuild of the reference cut at 30 fps (153 frames).
// Every element is a pure function of the frame number f, so any seek redraws the exact frame.
//
//   0–26    "Your next" grows, "trade" joins, the line squeezes shut
//   27–46   "starts" punches in big and settles, "with a" joins
//   47–74   "sentence" in blue with a lavender sweep; four coins tumble in and idle
//   74–88   the word dissolves letter by letter, the Solana coin flips toward the phone
//   81–108  the Trade screen rises; each coin flies down and becomes its row icon
//   96–141  prices tick, the screen pans to the AI input + keyboard and a prompt is typed
//   142–152 black
(function () {
  const FPS = 30;
  const FRAMES = 153;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    lin: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  };
  // keys: [[frame, value, ease?], ...]; the ease on a key shapes the segment that ends on it
  function track(keys, f) {
    if (f <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [f1, v1, e] = keys[i];
      if (f <= f1) {
        const [f0, v0] = keys[i - 1];
        return lerp(v0, v1, (E[e || "io"])((f - f0) / (f1 - f0)));
      }
    }
    return keys[keys.length - 1][1];
  }
  const mix = (c0, c1, t) => c0.map((v, i) => Math.round(lerp(v, c1[i], t)));
  const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 1 : a})`;

  // ------------------------------------------------------------------ headline
  const BLUE = [3, 0, 254];
  const LAV = [133, 127, 244];
  const PALE = [226, 224, 252];
  const WORD = "sentence";

  function headline(f) {
    // returns { text, size, gap, blue }
    if (f < 7) return { text: "Your next", size: track([[0, 142], [6, 199, "out"]], f) };
    if (f < 27) {
      const size = track([[7, 189], [21, 203, "out"], [22, 203], [23, 200, "lin"], [24, 194, "lin"], [25, 188, "lin"], [26, 176, "lin"]], f);
      const gap = track([[24, 0], [25, -0.12, "lin"], [26, -0.27, "lin"]], f);
      return { text: "Your next trade", size, gap };
    }
    if (f < 35) return { text: "starts", size: track([[27, 216], [28, 182, "lin"], [29, 166, "lin"], [32, 147, "out"], [34, 144, "lin"]], f) };
    if (f < 47) return { text: "starts with a", size: track([[35, 141], [46, 134, "lin"]], f) };
    if (f < 90) return { text: WORD, size: 262, blue: true };
    return null;
  }

  function letterColor(i, f) {
    // lavender sweep left to right while the coins land, then a dissolve left to right
    const c = (f - 47) / 1.9;
    let t = Math.max(0, 1 - Math.abs(i - c) / 1.3) * 0.9;
    if (f > 58 && i >= WORD.length - 2) t = Math.max(t, 0.35 * (1 - clamp((f - 66) / 8, 0, 1)));
    let col = mix(BLUE, LAV, t);
    const s = 74 + i * 1.25;
    if (f >= s) {
      const u = (f - s) / 3;
      col = u < 1 ? mix(col, LAV, u) : mix(LAV, PALE, clamp(u - 1, 0, 1));
      const a = 1 - clamp((f - s - 4) / 3, 0, 1);
      return rgb(col, a);
    }
    return rgb(col);
  }

  // ------------------------------------------------------------------ phone
  const K = 700 / PHONE.W; // pt -> px on screen
  const PHONE_LEFT = 585;
  const phoneTop = (f) =>
    track([[81, 560], [84, 440, "lin"], [90, 210, "out"], [96, 128, "out"], [100, 104, "out"], [117, 66, "lin"], [126, -418, "io"], [141, -446, "lin"]], f);
  const iconPos = (i, f) => ({
    x: PHONE_LEFT + 25 + (PHONE.ICON_X + PHONE.ICON / 2) * K,
    y: phoneTop(f) + 25 + (PHONE.ROW0 + i * PHONE.PITCH + PHONE.ICON / 2) * K,
  });
  const ICON_D = PHONE.ICON * K;

  // ------------------------------------------------------------------ coins
  // Free pose tracks in viewport px / degrees, then a landing blend onto the row icon.
  const wob = (f, a, p, ph) => a * Math.sin((f + ph) / p);
  const COINS = [
    {
      key: "solana", row: 0, from: 47,
      x: [[47, 966], [76, 962], [87, 884], [95, 820]],
      y: [[47, 348], [53, 342, "out"], [76, 342], [87, 436], [95, 520]],
      d: [[47, 26], [49, 120, "out"], [53, 205, "out"], [76, 205], [87, 175], [95, 120]],
      rx: (f) => (f < 53 ? 0 : wob(f, 9, 5, 0) * clamp((80 - f) / 6, 0, 1)),
      ry: (f) => track([[47, -300], [53, 0, "out"], [76, 0], [81, 90, "in"], [87, 165, "lin"], [95, 330, "out"]], f) + (f > 53 && f < 76 ? wob(f, 12, 6, 2) : 0),
      rz: () => 0,
      land: [[86, 0], [96, 1, "io"]],
    },
    {
      key: "bitcoin", row: 1, from: 48,
      x: [[48, -200], [51, 150, "out"], [54, 240, "out"], [60, 330, "out"], [75, 330, "sine"], [86, 340, "lin"]],
      y: [[48, 1200], [51, 900, "out"], [54, 820, "out"], [60, 720, "out"], [75, 575, "sine"], [86, 560, "lin"]],
      d: [[48, 430], [60, 400], [75, 300, "sine"], [86, 285]],
      rx: (f) => track([[48, 85], [52, 50, "out"], [60, 64], [75, 38, "sine"], [86, 30]], f),
      ry: (f) => track([[48, -230], [53, -40, "out"], [60, -22], [75, -42, "sine"], [86, -36]], f) + wob(f, 4, 7, 1),
      rz: (f) => track([[48, -70], [60, -40, "out"], [75, -28], [86, -22]], f),
      land: [[86, 0], [99, 1, "io"]],
    },
    {
      key: "ethereum", row: 2, from: 50,
      x: [[50, 2160], [53, 1962, "out"], [57, 1832, "out"], [60, 1752, "out"], [86, 1680, "sine"]],
      y: [[50, 1110], [53, 882, "out"], [57, 862], [60, 872], [86, 866]],
      d: [[50, 440], [60, 430], [86, 410]],
      rx: (f) => track([[50, 34], [57, 14, "out"], [60, 22], [86, 16]], f) + wob(f, 4, 6, 3),
      ry: (f) => track([[50, 260], [57, 100, "out"], [60, 58, "out"], [70, 48], [86, 40]], f) + wob(f, 5, 7, 0),
      rz: (f) => track([[50, 42], [60, 12, "out"], [86, 8]], f),
      land: [[88, 0], [102, 1, "io"]],
    },
    {
      key: "zcash", row: 3, from: 59,
      x: [[59, -360], [62, 150, "out"], [66, 380, "out"], [70, 452, "out"], [86, 482, "sine"], [97, 560]],
      y: [[59, 1360], [62, 1052, "out"], [66, 962, "out"], [70, 950], [86, 940], [97, 962]],
      d: [[59, 660], [70, 650], [86, 620], [97, 420]],
      rx: (f) => track([[59, 62], [64, 26, "out"], [70, 18], [86, 12], [97, 8]], f) + wob(f, 3, 7, 4),
      ry: (f) => track([[59, 115], [62, 76, "out"], [66, 42, "out"], [70, 32], [86, 24], [97, 12]], f),
      rz: (f) => track([[59, -22], [70, -8, "out"], [97, -4]], f),
      land: [[97, 0], [108, 1, "io"]],
    },
  ];

  function coinPose(c, f) {
    let p = {
      x: track(c.x, f), y: track(c.y, f), d: track(c.d, f),
      rx: c.rx(f), ry: c.ry(f), rz: c.rz(f), r: 50,
    };
    const L = track(c.land, f);
    if (L > 0) {
      const t = iconPos(c.row, f);
      const ryT = Math.round(p.ry / 360) * 360 || (c.key === "solana" ? 360 : 0);
      p = {
        x: lerp(p.x, t.x, L), y: lerp(p.y, t.y, L), d: lerp(p.d, ICON_D, E.out(L)),
        rx: lerp(p.rx, 0, L), ry: lerp(p.ry, ryT, L), rz: lerp(p.rz, 0, L),
        r: lerp(50, 22.5, clamp((L - 0.55) / 0.45, 0, 1)),
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
    stage.innerHTML = `<div id="phoneWrap"></div><div id="line"></div><div id="coins"></div><div id="black"></div>`;
    const phoneWrap = stage.querySelector("#phoneWrap");
    const ui = PHONE.build(phoneWrap);
    const line = stage.querySelector("#line");
    const black = stage.querySelector("#black");
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
        line.style.transform = `translate(-50%, -54%)`;
        if (h.blue) [...line.children].forEach((s, i) => (s.style.color = letterColor(i, f)));
        else line.style.color = "#0b0b0c";
      }

      // phone
      const top = phoneTop(f);
      const op = track([[81, 0], [86, 0.6, "lin"], [90, 1, "out"]], f);
      phoneWrap.style.display = op > 0 ? "block" : "none";
      phoneWrap.style.transform = `translateY(${top}px)`;
      phoneWrap.style.opacity = op;
      const blur = track([[81, 10], [89, 0, "out"]], f);
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

      black.style.display = f >= 142 ? "block" : "none";
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
