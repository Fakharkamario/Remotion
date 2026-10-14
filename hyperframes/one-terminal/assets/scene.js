// "One terminal, every market" — same type and motion language as sentence-trade, 30 fps, 210 frames.
// Every element is a pure function of a continuous frame number, so the 240 fps motion-blur render can
// sample between frames; discrete state (which words are on screen) uses the nearest whole frame.
//
//   0–26    "One" grows, "terminal," joins, the line squeezes shut
//   27–46   "every" punches in big and settles, "market" joins
//   47–60   a dark pill grows behind "market", the label fades, the pill rounds into a circle
//   56–84   the camera pulls back: the circle is the selected Crypto button; the Explore screen fades up
//   84–126  the cursor comet swoops in and taps Stocks, then ETFs; the content swaps with a stagger
//   126–162 it drags the category row left (the row keeps gliding after release)
//   162–209 it taps Pre-IPO and drifts off; the camera keeps a slow push-in
(function () {
  const FPS = 30;
  const FRAMES = 210;

  // ------------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));

  // monotone cubic (PCHIP) through [frame, value] keys: velocity is continuous at every key
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
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };

  // ------------------------------------------------------------------ headline
  const INK = "#1c1d21";
  // Font size runs as one continuous curve per phrase; a joining word starts the line nudged right
  // and glides it to centre (as in sentence-trade).
  function headline(f, fi) {
    if (fi < 27) {
      let size = 142 + 50 * (1 - Math.exp(-f / 4)) + 0.95 * f;
      let gap = 0;
      if (f > 19) size *= 1 - 0.15 * Math.pow((f - 19) / 7, 2.6);
      if (f > 22) gap = -0.27 * Math.pow((f - 22) / 4, 1.8);
      return fi < 7 ? { words: ["One"], size } : { words: ["One", "terminal,"], size, gap, join: { at: 7, prev: "One" } };
    }
    f = Math.max(f, 27); // a beat's motion starts at its cut (no backwards blur samples)
    const size = 140 + 76 * Math.exp(-(f - 27) / 1.6) - 0.35 * (f - 27);
    return fi < 35 ? { words: ["every"], size } : { words: ["every", "market"], size, join: { at: 35, prev: "every", k: 0.14 } };
  }

  // ------------------------------------------------------------------ phone + camera
  const K = 700 / UI.W; // pt -> px
  const PHONE = { x: 585, y: 64, bezel: 25 };
  const world = (x, y) => ({ x: PHONE.x + PHONE.bezel + x * K, y: PHONE.y + PHONE.bezel + y * K });
  const CAT_D = 56 * K;
  const P = world(UI.CAT_X[0], UI.CAT_Y); // the Crypto circle: the pill becomes it, the camera pulls back from it
  // The circle's on-screen path (centre + diameter) is ONE spline from the pill to the button's resting
  // place. Before frame 60 it shapes the pill; from 60 it *is* the camera (Z = diameter / button size,
  // anchored on the button), so the hand-off has no seam and the pull-back never stalls.
  const CIR_D = spline([[52, 172], [56, 204], [60, 222], [64, 207], [68, 170], [72, 134], [76, 110], [80, 98], [84, 92.6], [88, CAT_D]]);
  const CIR_X = spline([[52, 1040], [56, 990], [60, 930], [64, 878], [70, 800], [76, 742], [82, 708], [88, P.x]]);
  const CIR_Y = spline([[52, 540], [56, 532], [60, 518], [64, 496], [70, 450], [76, 404], [82, 370], [88, P.y]]);
  const Wd = { x: 960, y: 520 };

  // after the pull-back: anchor glides to the phone, a slow push-in runs, and the frame leans a little
  // toward where the cursor is working (set per frame through camera.lean)
  function camera(f, lean) {
    const Z = (CIR_D(f) / CAT_D) * (1 + 0.075 * smoother((f - 88) / 122));
    const v = smoother((f - 84) / 46);
    const W = { x: lerp(P.x, Wd.x, v), y: lerp(P.y, Wd.y, v) };
    const lx = lean ? lean.x : 0, ly = lean ? lean.y : 0;
    const C = { x: lerp(CIR_X(f), Wd.x, v) - lx, y: lerp(CIR_Y(f), Wd.y, v) - 14 * smoother((f - 92) / 110) - ly };
    return { Z, W, C };
  }
  // lean toward the cursor's recent average position (only while it is on screen)
  function lean(f) {
    const w = smoother((f - 84) / 22) * (1 - smoother((f - 180) / 26));
    if (w <= 0) return { x: 0, y: 0 };
    let ax = 0, ay = 0;
    for (let k = 0; k < 9; k++) { const p = CUR(f - k); const q = world(p.x, p.y); ax += q.x; ay += q.y; }
    return { x: 0.07 * (ax / 9 - 960) * w, y: 0.04 * (ay / 9 - 520) * w };
  }
  const cam = (f) => camera(f, lean(f));
  const project = (cam, p) => ({ x: cam.C.x + cam.Z * (p.x - cam.W.x), y: cam.C.y + cam.Z * (p.y - cam.W.y) });

  // ------------------------------------------------------------------ interaction script
  const CLICKS = [
    { f: 99, cat: 1 }, // Stocks
    { f: 121, cat: 2 }, // ETFs
    { f: 168, cat: 6 }, // Pre-IPO
  ];
  const DRAG = { from: 140, to: 154 };
  const SWAPS = [
    { f: 99, from: "crypto", to: "stocks" },
    { f: 121, from: "stocks", to: "etfs" },
    { f: 168, from: "etfs", to: "preipo" },
  ];
  // category row scroll (pt): follows the finger, then glides to rest after release
  const rowX = spline([[140, 0], [143, -10], [149, -74], [154, -132], [158, -146.5], [163, UI.ROW_SCROLL]]);

  // cursor path in screen points (pt); holds where it taps; during the drag it rides the row
  const CUR = (() => {
    const keys = [
      [84, 690, 420], [88, 560, 395], [92, 380, 310], [95.5, 215, 222], [99, 130, UI.CAT_Y], [106, 130, UI.CAT_Y],
      [111, 150, 228], [116, 192, 200], [120, UI.CAT_X[2], UI.CAT_Y], [126, UI.CAT_X[2], UI.CAT_Y],
      [131, 270, 232], [136, 345, 200], [139.5, UI.CAT_X[4], UI.CAT_Y], [140, UI.CAT_X[4], UI.CAT_Y],
      [154, UI.CAT_X[4] - 132, UI.CAT_Y], // placeholder for the drag segment (overridden below)
      [159, 290, 226], [164, 360, 202], [167, UI.CAT_X[6] + UI.ROW_SCROLL, UI.CAT_Y], [175, UI.CAT_X[6] + UI.ROW_SCROLL, UI.CAT_Y],
      [183, 440, 262], [192, 540, 420], [202, 690, 650],
    ];
    const sx = spline(keys.map((k) => [k[0], k[1]])), sy = spline(keys.map((k) => [k[0], k[2]]));
    return (f) => {
      if (f >= DRAG.from && f <= DRAG.to) return { x: UI.CAT_X[4] + rowX(f), y: UI.CAT_Y };
      return { x: sx(f), y: sy(f) };
    };
  })();
  const cursorOpacity = (f) => smoother((f - 84) / 4) * (1 - smoother((f - 180) / 16));
  const pressed = (f) => {
    // 0..1 how hard the cursor is "down": short taps, and held through the drag
    let p = 0;
    for (const c of CLICKS) p = Math.max(p, smoother((f - c.f + 1.5) / 1.5) * (1 - smoother((f - c.f - 2) / 4)));
    p = Math.max(p, smoother((f - DRAG.from + 1.5) / 1.5) * (1 - smoother((f - DRAG.to) / 3)));
    return p;
  };

  // the selection puck's centre in row points: glides to each tapped category on a C2 ease;
  // long hops take longer so its speed stays in the same range
  function puckX(f) {
    let x = UI.CAT_X[0];
    for (const c of CLICKS) {
      const to = UI.CAT_X[c.cat], dur = 8 + Math.abs(to - x) / 75;
      x = lerp(x, to, smoother((f - c.f) / dur));
    }
    return x;
  }
  const pressDip = (i, f) => {
    let d = 0;
    for (const c of CLICKS) if (c.cat === i) d = Math.max(d, Math.sin(Math.PI * clamp((f - c.f + 1) / 9, 0, 1)));
    return 1 - 0.08 * d;
  };

  // content swap: out items leave left with a quick stagger, in items arrive from the right
  function itemStyle(k, j, f) {
    let op = k === "crypto" ? 1 : 0, tx = 0;
    for (const s of SWAPS) {
      if (s.to === k) {
        const p = outCubic((f - (s.f + 5) - j * 1.3) / 11);
        op = p; tx = 34 * (1 - p);
      }
      if (s.from === k) {
        const p = smoother((f - (s.f + 1) - j * 0.45) / 5);
        op *= 1 - p; tx += -22 * p;
      }
    }
    return { op, tx };
  }

  // ------------------------------------------------------------------ mount
  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    stage.innerHTML = `<div id="reveal"><div id="cam"><div id="phoneWrap"></div></div></div><div id="pill"></div><div id="line"></div>
      <svg id="cursor" width="1920" height="1080" viewBox="0 0 1920 1080">
        <circle id="ring" r="0" fill="#7ee2a8"/>
        <path id="trail" fill="none" stroke="#3d9ef2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg><span id="meas"></span>`;
    const camEl = stage.querySelector("#cam");
    const reveal = stage.querySelector("#reveal");
    const phoneWrap = stage.querySelector("#phoneWrap");
    const ui = UI.build(phoneWrap);
    const line = stage.querySelector("#line");
    const pill = stage.querySelector("#pill");
    const meas = stage.querySelector("#meas");
    const trail = stage.querySelector("#trail");
    const ring = stage.querySelector("#ring");
    const widthOf = (text, size, gap) => {
      meas.textContent = text;
      meas.style.fontSize = size + "px";
      meas.style.wordSpacing = (gap || 0) + "em";
      return meas.getBoundingClientRect().width;
    };
    let lastKey = null;

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1);
      const fi = Math.round(f);
      const c = cam(f);

      // ---------------- headline + pill (until the hand-off at frame 60)
      if (f < 60) {
        const h = headline(f, fi);
        const key = h.words.join(" ");
        if (key !== lastKey) {
          lastKey = key;
          line.innerHTML = h.words.map((w) => `<span>${w}</span>`).join(" ");
        }
        line.style.display = "block";
        line.style.fontSize = h.size + "px";
        line.style.wordSpacing = (h.gap || 0) + "em";
        let dx = 0;
        if (h.join) {
          const grow = widthOf(h.words.join(" "), h.size, h.gap) - widthOf(h.join.prev, h.size, h.gap);
          dx = (h.join.k || 0.3) * (grow / 2) * Math.exp(-(f - h.join.at) / 1.5);
        }
        line.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), -54%)`;
        const spans = [...line.children];
        spans.forEach((s) => { s.style.opacity = 1; s.style.transform = "none"; s.style.color = INK; s.style.filter = "none"; });

        if (f >= 46.5 && spans.length === 2) {
          // "every" steps back; "market" turns into a button
          const a = smoother((f - 47) / 4);
          const e = smoother((f - 47) / 6);
          spans[0].style.opacity = 1 - e;
          spans[0].style.transform = `translateX(${(-26 * e).toFixed(2)}px)`;
          spans[1].style.color = mix(INK, "#f9f8f4", a);
          const lf = smoother((f - 51) / 6);
          spans[1].style.opacity = 1 - lf;
          spans[1].style.filter = lf > 0.01 ? `blur(${(lf * 6).toFixed(2)}px)` : "none";
          const r = spans[1].getBoundingClientRect();
          // pill around the word, then a morph onto the projected Crypto circle (which the camera is
          // already starting to pull back from, so the hand-off at frame 60 is exact)
          const R0 = { x: r.left + r.width / 2, y: r.top + r.height * 0.54, w: r.width + 0.62 * h.size, h: 1.22 * h.size };
          const T = { x: CIR_X(f), y: CIR_Y(f) }, D = CIR_D(f);
          const m = smoother((f - 52) / 8);
          const mw = smoother((f - 51.5) / 7.5); // width leads a touch: the pill squeezes, then rounds
          const w = lerp(R0.w, D, mw), hh = lerp(R0.h, D, m);
          const sc = lerp(0.9, 1, a);
          pill.style.display = "block";
          pill.style.opacity = a;
          pill.style.width = w + "px";
          pill.style.height = hh + "px";
          pill.style.borderRadius = Math.min(w, hh) / 2 + "px";
          pill.style.transform = `translate(${(lerp(R0.x, T.x, m) - w / 2).toFixed(2)}px, ${(lerp(R0.y, T.y, m) - hh / 2).toFixed(2)}px) scale(${sc.toFixed(4)})`;
        } else pill.style.display = "none";
      } else {
        line.style.display = "none";
        pill.style.display = "none";
      }

      // ---------------- camera + phone
      const showPhone = f >= 60;
      reveal.style.display = showPhone ? "block" : "none";
      camEl.style.transform = `translate(${(c.C.x - c.Z * c.W.x).toFixed(3)}px, ${(c.C.y - c.Z * c.W.y).toFixed(3)}px) scale(${c.Z.toFixed(5)})`;

      // category row: scroll, press dips, and the dark puck sliding between categories
      ui.row.style.transform = `translateX(${rowX(f).toFixed(3)}px)`;
      const px = puckX(f), pv = puckX(f + 0.5) - puckX(f - 0.5);
      const stretch = Math.min(46, Math.abs(pv) * 1.15), squash = Math.min(7, Math.abs(pv) * 0.18);
      const pw = 56 + stretch, ph = 56 - squash;
      let dip = 1;
      UI.CAT_X.forEach((x, i) => {
        const near = smoother(1 - Math.abs(px - x) / 44); // how much the puck sits on this category
        const d = pressDip(i, f);
        if (near > 0.5) dip = Math.min(dip, d);
        ui.discs[i].style.transform = ui.glyphs[i].style.transform = `scale(${d.toFixed(4)})`;
        ui.glyphs[i].style.color = mix("#5f5f5d", "#ffffff", near);
        const tapped = i === 0 || CLICKS.some((ck) => ck.cat === i);
        ui.labels[i].style.color = mix("#6e6e6c", "#262626", tapped ? smoother(1 - Math.abs(px - x) / 18) : 0);
        ui.glyphs[i].firstElementChild.style.opacity = i === 0 ? smoother((f - 61) / 8) : 1;
      });
      ui.puck.style.width = pw + "px";
      ui.puck.style.height = ph + "px";
      ui.puck.style.borderRadius = ph / 2 + "px";
      ui.puck.style.transform = `translate(${(px - pw / 2).toFixed(3)}px, ${(squash / 2).toFixed(3)}px) scale(${dip.toFixed(4)})`;

      // the screen is revealed by a circle growing out of the Crypto button (solid UI, no ghosting)
      if (f < 84) {
        const cp = project(c, P);
        const R = (CAT_D * c.Z) / 2 + 2400 * Math.pow(smoother((f - 60) / 24), 1.35);
        reveal.style.clipPath = `circle(${R.toFixed(2)}px at ${cp.x.toFixed(2)}px ${cp.y.toFixed(2)}px)`;
      } else reveal.style.clipPath = "none";

      // content blocks
      for (const k in ui.blocks) {
        let any = false;
        ui.blocks[k].items.forEach((el, j) => {
          const st = itemStyle(k, j, f);
          el.style.opacity = st.op.toFixed(4);
          el.style.transform = `translateX(${st.tx.toFixed(3)}px)`;
          if (st.op > 0.002) any = true;
        });
        ui.blocks[k].el.style.visibility = any ? "visible" : "hidden";
      }

      // ---------------- cursor: a brush-stroke comet (its recent path) that collapses to a dot at rest
      const co = cursorOpacity(f);
      const toScreen = (ff) => { const p = CUR(ff); return project(cam(ff), world(p.x, p.y)); };
      if (co > 0.002) {
        const pts = [];
        for (let k = 0; k <= 12; k++) pts.push(toScreen(f - k * 0.26)); // ~3 frames of path
        trail.setAttribute("d", pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(2) + " " + p.y.toFixed(2)).join(" "));
        trail.setAttribute("stroke-width", (13 * c.Z).toFixed(2));
        trail.style.opacity = co;
        const pr = pressed(f), head = pts[0];
        ring.setAttribute("cx", head.x); ring.setAttribute("cy", head.y);
        ring.setAttribute("r", (pr * 17 * c.Z).toFixed(2));
        ring.style.opacity = (0.9 * co).toFixed(3);
      } else { trail.setAttribute("d", ""); ring.setAttribute("r", 0); }

      // tap halos (row points, under the buttons): a soft mint bloom that grows and fades; one held
      // under the finger through the drag
      const halo = (el, x, r, op) => {
        el.style.width = el.style.height = (2 * r).toFixed(3) + "px";
        el.style.transform = `translate(${(x - r).toFixed(3)}px, ${(UI.CAT_Y - r).toFixed(3)}px)`;
        el.style.opacity = op.toFixed(3);
      };
      CLICKS.forEach((ck, i) => {
        const tt = f - ck.f;
        if (tt < -1 || tt > 26) return halo(ui.halos[i], 0, 0, 0);
        halo(ui.halos[i], UI.CAT_X[ck.cat], 30 + 34 * (1 - Math.exp(-Math.max(0, tt) / 3.4)),
          0.6 * smoother((tt + 1) / 2.5) * (1 - smoother(tt / 22)));
      });
      const dt = f - DRAG.from;
      if (dt >= -1 && f <= DRAG.to + 14)
        halo(ui.halos[3], UI.CAT_X[4], 30 + 10 * smoother(dt / 4) + 26 * smoother((f - DRAG.to) / 12),
          0.5 * smoother((dt + 1) / 3) * (1 - smoother((f - DRAG.to) / 14)));
      else halo(ui.halos[3], 0, 0, 0);
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };

  window.SCENE = SCENE;
})();
