// "Meet AI Mentor" — a 7.4 s, 30 fps (222 frame) recreation of the gold-orb trading-coach clip.
// Every property runs off the frame number through keyframe tables that were measured from the
// reference, frame by frame, and joined with monotone cubic splines, so the motion keeps the reference's
// timing and easing while staying smooth between the samples.
//
//   0–86    the orb blooms in the centre; six stat cards fly out of it while their numbers count up,
//           the ring of cards drifts, then whips round and cuts away
//   87–141  "Meet" glides in from the right, "AI Mentor" decodes out of glyph noise from the left,
//           the orb swings in beside "Meet"; the words then split up and down as the orb grows
//   141–221 the orb dives round to the left, "Personal" and a typed "Trading Coach" pill slide in,
//           a gold slab flips up into a glass "AI Mentor" card that the orb settles on, "On demand"
//           flickers in, and the card tips away in 3D
(function () {
  const FPS = 30, FRAMES = 222;
  const SUB = 0; // sub-frame offset used by the motion-blur render
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (t) => (t = clamp(t, 0, 1), t * t * (3 - 2 * t));
  const outCubic = (t) => (t = clamp(t, 0, 1), 1 - Math.pow(1 - t, 3));
  const rad = (d) => (d * Math.PI) / 180;

  // monotone cubic (Fritsch–Carlson) through [[frame, value], ...]; holds the end values outside the range
  function kf(pts) {
    const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    if (n > 1) { m[0] = d[0]; m[n - 1] = d[n - 2]; }
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (xs[i + 1] - xs[i - 1])) / ((2 * xs[i + 1] - xs[i] - xs[i - 1]) / d[i - 1] + (xs[i + 1] - 2 * xs[i] + xs[i - 1]) / d[i]);
    for (let i = 0; i < n - 1; i++) if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }
  // stepped table (for flicker): value of the last key at or before x
  const steps = (pts) => (x) => { let v = pts[0][1]; for (const p of pts) if (x >= p[0]) v = p[1]; return v; };
  // deterministic hash → [0,1)
  const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; };

  // ---------------- keyframes (measured from the reference) ----------------
  // scene 1
  const S1 = {
    orbD: kf([[0, 70], [3, 170], [5, 205], [8, 222], [12, 238], [30, 245], [86, 250]]),
    // the ring of cards drifts anticlockwise, then whips round before the cut
    phi: kf([[0, 58], [12, 40], [36, 18], [60, 0], [70, -18], [79, -46], [82, -80], [84, -113], [86, -190], [87, -240]]),
  };
  // scenes 2 + 3: the one orb's flight
  const ORB = {
    x: kf([[94, 2120], [97, 1860], [98, 1799], [99, 1706], [100, 1626], [101, 1568], [102, 1522], [103, 1482], [104, 1453], [105, 1418], [106, 1395], [108, 1360], [112, 1305], [120, 1245], [124, 1268], [127, 1325], [129, 1400], [130, 1480], [131, 1560], [132, 1625], [133, 1670], [134, 1705], [136, 1725], [139, 1732], [142, 1728], [143, 1712], [144, 1695], [145, 1675], [146, 1652], [147, 1612], [148, 1556], [149, 1475], [150, 1350], [151, 1180], [152, 950], [153, 760], [154, 620], [155, 548], [157, 540], [159, 588], [161, 640], [163, 692]]),
    y: kf([[94, 375], [120, 375], [124, 378], [127, 384], [129, 380], [130, 370], [131, 357], [132, 344], [133, 320], [134, 302], [136, 284], [139, 272], [141, 284], [142, 300], [143, 330], [144, 357], [145, 380], [146, 433], [147, 492], [148, 560], [149, 635], [150, 715], [151, 772], [152, 790], [153, 755], [154, 680], [155, 606], [157, 490], [159, 392], [161, 345], [163, 312]]),
    d: kf([[94, 240], [120, 240], [127, 262], [130, 300], [133, 345], [136, 380], [139, 400], [145, 405], [150, 420], [151, 410], [153, 300], [155, 230], [157, 182], [160, 156], [163, 144], [175, 124], [190, 126], [193, 142], [195, 158], [200, 165], [210, 178], [215, 174], [221, 156]]),
    // once the card is up the orb rides it, at (u, v) on the card face
    u: kf([[163, 0.0], [165, 0.1], [169, 0.25], [175, 0.41], [182, 0.48], [190, 0.5], [212, 0.5], [221, 0.62]]),
    v: kf([[163, 0.136], [175, 0.19], [182, 0.2], [190, 0.14], [195, 0.11], [200, 0.095], [210, 0.1], [221, 0.1]]),
  };
  const S2 = {
    meetCx: kf([[87, 2400], [88, 1612], [89, 1372], [90, 1235], [92, 1068], [97, 862], [101, 785], [106, 727], [112, 685], [120, 665], [128, 655], [134, 646], [141, 640]]),
    meetCy: kf([[86, 388], [129, 388], [131, 378], [133, 348], [134, 332], [135, 317], [136, 300], [137, 277], [138, 248], [139, 185], [140, 70], [141, -80], [142, -240]]),
    mentorL: kf([[87, -1100], [88, -650], [90, -200], [92, 60], [97, 255], [101, 315], [106, 369], [112, 405], [120, 429], [128, 435], [134, 444], [141, 450]]),
    mentorCy: kf([[86, 706], [129, 706], [131, 720], [133, 748], [134, 760], [135, 774], [136, 787], [137, 810], [138, 840], [139, 905], [140, 1010], [141, 1150], [142, 1320]]),
    reveal: kf([[89, -0.8], [92, 0.6], [97, 4.3], [101, 7.3], [106, 8.6], [109, 9.6]]),
  };
  const S3 = {
    personalL: kf([[149, -330], [151, -40], [153, 87], [155, 155], [157, 190], [163, 240], [175, 270], [221, 272]]),
    pillChars: kf([[155, 0], [157, 2], [177, 13]]),
    pillOp: kf([[154.5, 0], [156, 1]]),
    pillL: kf([[153, -80], [155, 30], [157, 120], [163, 200], [169, 240], [175, 260], [221, 262]]),
    // card flip: scale, tilt (deg, top edge toward camera), centre
    s: kf([[150, 0.02], [151, 0.06], [153, 0.29], [155, 0.58], [157, 0.76], [159, 0.83], [161, 0.9], [163, 0.93], [167, 0.97], [171, 0.995], [175, 1]]),
    a: kf([[150, 88], [151, 86], [153, 80], [155, 75], [157, 72], [159, 52], [161, 34], [163, 26], [167, 11], [171, 2], [175, 0]]),
    cx: kf([[150, 915], [151, 920], [153, 945], [155, 958], [157, 955], [159, 960], [163, 962], [175, 958]]),
    cy: kf([[150, 495], [153, 498], [155, 515], [157, 505], [159, 485], [161, 478], [163, 494], [175, 508]]),
    sheen: kf([[151, 1], [156, 0.95], [159, 0.6], [161, 0.32], [163, 0.12], [166, 0]]),
    face: kf([[157, 0], [160, 0.5], [164, 1]]),
    // after the flip, the card's corners (TL, TR, BR, BL) as they sit in the reference
    corners: [
      [175, [660, 190, 1256, 190, 1256, 826, 660, 826]],
      [182, [653, 180, 1267, 180, 1267, 837, 653, 837]],
      [190, [636, 184, 1290, 184, 1312, 866, 610, 868]],
      [195, [618, 194, 1305, 195, 1350, 870, 572, 878]],
      [200, [615, 202, 1314, 204, 1380, 870, 572, 878]],
      [205, [615, 206, 1320, 208, 1400, 870, 588, 876]],
      [210, [618, 205, 1322, 210, 1436, 870, 618, 876]],
      [215, [662, 203, 1335, 216, 1500, 868, 722, 878]],
      [217, [765, 200, 1350, 218, 1562, 860, 900, 862]],
      [219, [905, 195, 1366, 228, 1652, 850, 1152, 828]],
      [221, [1068, 187, 1400, 245, 1748, 842, 1416, 784]],
    ],
    onL: kf([[181, 1480], [182, 1400], [185, 1250], [186, 1220], [188, 1180], [189, 1165], [191, 1150], [195, 1116], [200, 1097], [210, 1090], [221, 1088]]),
    onOp: steps([[0, 0], [182, 0.35], [183, 0], [185, 0.35], [186, 0.45], [187, 0], [188, 1]]),
  };
  const cornerFns = [];
  for (let k = 0; k < 8; k++) cornerFns.push(kf(S3.corners.map(([f, c]) => [f, c[k]])));

  // ---------------- geometry helpers ----------------
  // projective map of a W×H rect onto quad [x0,y0, x1,y1, x2,y2, x3,y3] (TL, TR, BR, BL)
  function homography(W, H, q) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
    const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
    return {
      css: `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${h / H},0,0,1,0,${c},${f},0,1)`,
      at: (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + c) / w, (d * u + e * v + f) / w]; },
    };
  }
  // the flip model: a card W×H·s centred at (cx, cy), tilted by a about its horizontal axis, seen with perspective P
  function flipQuad(W, H, s, a, cx, cy) {
    const P = 3200, hw = (W * s) / 2, hh = (H * s) / 2, ca = Math.cos(rad(a)), sa = Math.sin(rad(a));
    const pt = (X, Y) => { const z = Y * sa, k = P / (P + z); return [cx + X * k, cy + Y * ca * k]; };
    return [...pt(-hw, -hh), ...pt(hw, -hh), ...pt(hw, hh), ...pt(-hw, hh)].map((v, i) => v);
  }

  // ---------------- builders ----------------
  const GOLD_GRAD = `<defs><linearGradient id="gArc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient></defs>`;
  function orbHTML(id) {
    const C = 2 * Math.PI * 145;
    return `<div class="orb" id="${id}"><div class="glow"></div><div class="halo"></div>
      <svg viewBox="-150 -150 300 300">${GOLD_GRAD}
        <circle r="145" fill="none" stroke="rgba(255,222,170,0.26)" stroke-width="1.5"/>
        <g class="arcs">
          <circle r="145" fill="none" stroke="url(#gArc)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="${0.2 * C} ${C}" transform="rotate(10)"/>
          <circle r="145" fill="none" stroke="rgba(255,236,200,0.75)" stroke-width="2" stroke-linecap="round" stroke-dasharray="${0.06 * C} ${C}" transform="rotate(-62)"/>
        </g>
      </svg>
      <div class="ball"><div class="refl"></div><div class="hl"></div></div></div>`;
  }

  const bars = (hs, gold) => hs.map((h, i) => `<span style="display:block;width:8px;height:${h}px;border-radius:2px;background:${i === hs.length - 1 && gold ? "linear-gradient(180deg,var(--g-hi),var(--g-1))" : "rgba(255,255,255,0.22)"}"></span>`).join("");
  // the six stat cards. th: angle on the orbit (deg, screen space, y down), r: orbit radius factor, w/h: size
  const CARDS = [
    { id: "dd", th: 100, r: 1.11, w: 326, h: 196, st: 0,
      html: `<div class="lbl" style="justify-content:space-between"><span style="display:flex;gap:9px;align-items:center"><i></i>Max drawdown</span><span class="chip" style="letter-spacing:.06em">SAFE</span></div>
        <div class="val" data-v style="font-size:52px;margin-top:20px">−3.1%</div><div class="sub" style="margin-top:12px">Limit 10%</div>
        <div style="position:absolute;left:24px;right:24px;bottom:20px;height:6px;border-radius:3px;background:rgba(255,255,255,0.08)"><div data-bar style="height:100%;border-radius:3px;background:rgba(255,255,255,0.45);width:31%"></div></div>`,
      upd: (el, p) => { el.v.textContent = "−" + (3.1 * p).toFixed(1) + "%"; el.bar.style.width = 31 * p + "%"; } },
    { id: "win", th: 34, r: 1.12, w: 326, h: 190, st: 0,
      html: `<div class="lbl"><i></i>Win rate</div><div class="val" data-v style="font-size:52px;margin-top:22px">64.2%</div><div class="sub" style="margin-top:12px">312 of 486 trades</div>
        <svg viewBox="0 0 100 100" style="position:absolute;right:22px;top:58px;width:96px;height:96px"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"/>
        <circle data-ring cx="50" cy="50" r="40" fill="none" stroke="url(#gRing)" stroke-width="7" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="0 252"/>
        <defs><linearGradient id="gRing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd79a"/><stop offset="1" stop-color="#e08f3c"/></linearGradient></defs></svg>`,
      upd: (el, p) => { el.v.textContent = (64.2 * p).toFixed(1) + "%"; el.ring.setAttribute("stroke-dasharray", `${(251.3 * 0.642 * p).toFixed(2)} 252`); } },
    { id: "pnl", th: -23, r: 0.95, w: 392, h: 204, st: 0.5,
      html: `<div class="lbl" style="justify-content:space-between"><span style="display:flex;gap:9px;align-items:center"><i></i>Net P&amp;L</span><span class="chip green">+18.4%</span></div>
        <div class="val" data-v style="font-size:46px;margin-top:18px">+$12,480</div><div class="sub" style="margin-top:10px">Last 30 days</div>
        <svg viewBox="0 0 140 60" style="position:absolute;right:20px;bottom:18px;width:140px;height:60px;overflow:visible"><defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,190,110,0.35)"/><stop offset="1" stop-color="rgba(255,190,110,0)"/></linearGradient></defs>
        <path data-area d="M0 52 L20 44 L36 48 L56 34 L74 38 L94 24 L112 28 L136 6 L136 60 L0 60 Z" fill="url(#gArea)"/>
        <path data-line d="M0 52 L20 44 L36 48 L56 34 L74 38 L94 24 L112 28 L136 6" fill="none" stroke="#ffc77d" stroke-width="2.4" stroke-linejoin="round" stroke-dasharray="200" stroke-dashoffset="200"/><circle data-dot cx="136" cy="6" r="4" fill="#ffe6c0"/></svg>`,
      upd: (el, p) => { el.v.textContent = "+$" + Math.round(12480 * p).toLocaleString("en-US"); el.line.setAttribute("stroke-dashoffset", (200 * (1 - p)).toFixed(1)); el.area.style.opacity = p; el.dot.style.opacity = sstep((p - 0.85) / 0.15); } },
    { id: "trades", th: -81, r: 0.87, w: 312, h: 178, st: 2,
      html: `<div class="lbl"><i></i>Total trades</div><div class="val" data-v style="font-size:44px;margin-top:20px">1,284</div><div class="sub" style="margin-top:12px">Forex · Futures</div>
        <div data-bars style="position:absolute;right:24px;bottom:24px;display:flex;gap:6px;align-items:flex-end;height:60px">${bars([24, 32, 28, 40, 56], true)}</div>`,
      upd: (el, p) => { el.v.textContent = Math.round(1284 * p).toLocaleString("en-US"); [...el.bars.children].forEach((b, i) => (b.style.transform = `scaleY(${clamp(p * 1.2 - i * 0.04, 0.15, 1)})`)); } },
    { id: "london", th: -140, r: 0.9, w: 334, h: 172, st: 2.5,
      html: `<div class="lbl"><i></i>Best session</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:18px"><div class="val" style="font-size:40px">London</div>
        <div style="text-align:right"><div class="pos" style="font-size:17px;font-weight:600">+$4,920</div><div class="sub" style="font-size:11px">this month</div></div></div>
        <div style="display:flex;gap:8px;margin-top:16px"><span class="chip">ASIA</span><span class="chip on">LONDON</span><span class="chip">NEW YORK</span></div>`,
      upd: () => {} },
    { id: "rr", th: 165, r: 1.06, w: 306, h: 182, st: 3,
      html: `<div class="lbl"><i></i>Avg R:R</div><div class="val" data-v style="font-size:50px;margin-top:22px;letter-spacing:0">1 : 2.4</div><div class="sub" style="margin-top:12px">Risk to reward</div>
        <div style="position:absolute;right:26px;bottom:20px;display:flex;gap:14px;align-items:flex-end">
          <div style="text-align:center"><span data-b1 style="display:block;margin:0 auto;width:14px;height:24px;border-radius:3px;background:rgba(255,255,255,0.25);transform-origin:bottom"></span><div class="sub" style="font-size:10px;margin-top:5px">1R</div></div>
          <div style="text-align:center"><span data-b2 style="display:block;margin:0 auto;width:14px;height:64px;border-radius:3px;background:linear-gradient(180deg,var(--g-hi),var(--g-2));transform-origin:bottom"></span><div class="sub" style="font-size:10px;margin-top:5px">2.4R</div></div></div>`,
      upd: (el, p) => { el.v.textContent = "1 : " + (2.4 * p).toFixed(1); el.b2.style.transform = `scaleY(${clamp(p, 0.1, 1)})`; } },
  ];

  function gridCanvas(alpha, seed) {
    const c = document.createElement("canvas"); c.width = 1920; c.height = 1080; c.className = "grid";
    const x = c.getContext("2d"), P = 64, S = 54;
    for (let gy = -1; gy < 18; gy++) for (let gx = 0; gx < 31; gx++) {
      const r = hash(gx, gy, seed), a = alpha * (0.55 + 0.9 * r * r);
      x.fillStyle = `rgba(255,236,200,${a.toFixed(4)})`;
      const px = gx * P + 5, py = gy * P + 30;
      x.beginPath(); x.roundRect(px, py, S, S, 8); x.fill();
    }
    return c;
  }

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <div id="bg1"></div><div id="bg2"></div>
      <div id="s1" class="layer">${CARDS.map((c) => `<div class="card" id="c-${c.id}" style="width:${c.w}px;height:${c.h}px">${c.html}</div>`).join("")}</div>
      <div id="s2" class="layer"><div id="meet" class="big">Meet</div><div id="mentor" class="big">${"AI Mentor".split("").map((ch) => `<span>${ch}</span>`).join("")}</div><div id="glyphs"></div></div>
      <div id="s3" class="layer">
        <div id="personal" class="big">Personal</div>
        <div id="pill"><span class="ico"><svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="8" r="4" fill="#ffd9a0"/><path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6z" fill="#ffd9a0"/></svg></span><span id="pilltxt"></span></div>
        <div id="card3"><div class="sheen"></div><div class="shine"></div><div class="face"><div class="name">AI Mentor</div><div class="input"><div class="send"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 19V6M6 11.5L12 5.5l6 6" fill="none" stroke="#2a1606" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div></div></div>
        <div id="ondemand" class="big"><span class="on">On </span><span class="dm">demand</span></div>
      </div>
      ${orbHTML("orb")}`;
    const $ = (s) => stage.querySelector(s);
    const bg1 = $("#bg1"), bg2 = $("#bg2"), s1 = $("#s1"), s2 = $("#s2"), s3 = $("#s3");
    bg1.appendChild(gridCanvas(0.011, 1));
    bg2.appendChild(gridCanvas(0.007, 2));
    const orb = $("#orb"), arcs = orb.querySelector(".arcs"), refl = orb.querySelector(".refl"), glow = orb.querySelector(".glow");
    const meet = $("#meet"), mentor = $("#mentor"), glyphs = $("#glyphs"), mSpans = [...mentor.children];
    const personal = $("#personal"), pill = $("#pill"), pilltxt = $("#pilltxt"), card3 = $("#card3"), sheen = card3.querySelector(".sheen"), face = card3.querySelector(".face"), ondemand = $("#ondemand");
    const cardEls = CARDS.map((c) => {
      const el = $("#c-" + c.id), q = (k) => el.querySelector(`[data-${k}]`);
      return { c, el, v: q("v"), bar: q("bar"), ring: q("ring"), line: q("line"), area: q("area"), dot: q("dot"), bars: q("bars"), b2: q("b2") };
    });

    // fit the headline words to the widths they have in the reference
    let fitted = false, charX = [];
    function fit() {
      const shown = [s2, s3].map((l) => l.style.display);
      s2.style.display = s3.style.display = "block";
      const set = (el, w) => { el.style.fontSize = "100px"; const k = w / el.offsetWidth; el.style.fontSize = 100 * k + "px"; return 100 * k; };
      set(meet, 585); set(mentor, 1200); set(personal, 310); set(ondemand, 645);
      pilltxt.style.fontSize = "24px";
      charX = mSpans.map((s) => [s.offsetLeft, s.offsetWidth]);
      [s2, s3].forEach((l, i) => (l.style.display = shown[i]));
      fitted = document.fonts ? document.fonts.check('500 100px "Inter"') && document.fonts.check('600 100px "Inter"') : true;
    }
    const place = (el, left, cy, extra = "") => { el.style.transform = `translate(${left.toFixed(2)}px, ${cy.toFixed(2)}px) translateY(-50%) ${extra}`; };
    const GLYPHS = "#*%@=+:.-•";

    function setOrb(x, y, d, f, glowK = 1) {
      orb.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(d / 200).toFixed(4)})`;
      arcs.setAttribute("transform", `rotate(${(60 - f * 1.2).toFixed(2)})`);
      refl.style.transform = `rotate(${(14 * Math.sin(f / 26)).toFixed(2)}deg)`;
      glow.style.opacity = glowK.toFixed(3);
    }

    function render(t) {
      if (!fitted) fit();
      let f = clamp(t, 0, FRAMES - 1);
      // the reference stays sharp through the card whip and the headline's exit, so those windows skip motion blur
      if ((f >= 79.5 && f < 87.5) || (f >= 136.5 && f < 141.5)) f = Math.round(f);

      // ---------- scene 1 ----------
      const fr = Math.round(f); // discrete state (cuts, flicker, typing) snaps to whole frames so motion blur never ghosts it
      const sc1 = fr < 87;
      bg1.style.display = s1.style.display = sc1 ? "block" : "none";
      bg2.style.display = sc1 ? "none" : "block";
      if (sc1) {
        const phi = S1.phi(f);
        setOrb(960, 540, S1.orbD(f), f, 1.25 - 0.35 * sstep(f / 20));
        orb.style.zIndex = 100;
        cardEls.forEach((ce) => {
          const c = ce.c, th = rad(c.th + phi), st = c.st;
          const spread = 0.2 + 0.8 * outCubic((f - 1 - st) / 40);
          const x = 960 + 680 * c.r * Math.cos(th) * spread, y = 540 + 260 * c.r * Math.sin(th) * spread;
          const ds = 1 + 0.2 * Math.sin(th), as = 0.22 + 0.78 * outCubic((f - 2.5 - st) / 14);
          const op = clamp((f - 1.5 - st) / 4, 0, 1);
          ce.el.style.transform = `translate(${(x - c.w / 2).toFixed(2)}px, ${(y - c.h / 2).toFixed(2)}px) perspective(1400px) rotateX(9deg) rotateY(${(-10 * Math.cos(th)).toFixed(2)}deg) rotateZ(${(5.5 * Math.cos(th)).toFixed(2)}deg) scale(${(ds * as).toFixed(4)})`;
          ce.el.style.opacity = op.toFixed(3);
          ce.el.style.filter = op < 1 ? `blur(${(5 * (1 - op)).toFixed(2)}px)` : "none";
          ce.el.style.zIndex = Math.round(100 + 60 * Math.sin(th));
          c.upd(ce, outCubic((f - 4 - st * 0.5) / 32));
        });
        s2.style.display = s3.style.display = "none";
        return;
      }

      // ---------- scenes 2 + 3 ----------
      s2.style.display = fr < 143 ? "block" : "none";
      s3.style.display = fr >= 148 ? "block" : "none";
      orb.style.zIndex = 300;

      if (f < 143) {
        place(meet, S2.meetCx(f) - meet.offsetWidth / 2, S2.meetCy(f));
        const ml = S2.mentorL(f), my = S2.mentorCy(f);
        place(mentor, ml, my);
        // decode: revealed letters, a soft-edged letter on the boundary, then a band of glyph noise ahead of it
        const rv = S2.reveal(f), LEAD = 5, fi = Math.round(f);
        let gh = "";
        mSpans.forEach((s, i) => {
          const fr = clamp(rv - i, 0, 1);
          s.style.clipPath = fr >= 1 ? "none" : `inset(0 ${(100 * (1 - fr)).toFixed(1)}% 0 0)`;
          s.style.visibility = fr > 0 ? "visible" : "hidden";
          const ahead = i + 1 - rv; // how far this letter sits in front of the reveal edge
          if (fr < 1 && ahead < LEAD && ahead > -1) {
            const [cx0, cw] = charX[i], fs = parseFloat(mentor.style.fontSize);
            const dens = 0.82 - 0.55 * clamp(ahead / LEAD, 0, 1);
            const cols = Math.max(2, Math.round(cw / 34)), rows = 4;
            for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
              const u = (k + 0.5) / cols;
              if (i + u < rv) continue; // already revealed part of the letter
              const h1 = hash(fi, i * 16 + r * 4 + k, 7);
              if (h1 > dens) continue;
              const ch = GLYPHS[Math.floor(hash(fi, i * 16 + r * 4 + k, 11) * GLYPHS.length)];
              const gx = ml + cx0 + u * cw, gy = my - fs * 0.30 + (r + 0.5) * (fs * 0.62 / rows);
              const a = 0.45 + 0.55 * hash(fi, i, r * 8 + k);
              gh += `<b style="left:${gx.toFixed(1)}px;top:${gy.toFixed(1)}px;opacity:${a.toFixed(2)}">${ch}</b>`;
            }
          }
        });
        glyphs.innerHTML = gh;
      }

      // orb flight, then riding the card
      let ox = ORB.x(f), oy = ORB.y(f);
      let H = null;
      if (f >= 148) {
        // ----- scene 3 -----
        const pl = S3.personalL(f);
        place(personal, pl, 330);
        const n = Math.round(clamp(S3.pillChars(fr), 0, 13));
        pilltxt.textContent = "Trading Coach".slice(0, n);
        pill.style.opacity = S3.pillOp(f).toFixed(3);
        pill.style.transform = `translate(${S3.pillL(f).toFixed(2)}px, ${444 - 29}px)`;

        let q;
        if (f < 175) q = flipQuad(596, 636, S3.s(f), S3.a(f), S3.cx(f), S3.cy(f));
        else q = cornerFns.map((fn) => fn(f));
        H = homography(596, 636, q);
        card3.style.transform = H.css;
        sheen.style.opacity = S3.sheen(f).toFixed(3);
        face.style.opacity = S3.face(f).toFixed(3);
        card3.style.opacity = f < 150 ? 0 : 1;

        ondemand.style.opacity = S3.onOp(fr);
        place(ondemand, S3.onL(f), 834);

        if (f >= 161) {
          const [ax, ay] = H.at(ORB.u(f), ORB.v(f));
          const w = sstep((f - 161) / 4);
          ox = lerp(ox, ax, w); oy = lerp(oy, ay, w);
        }
      }
      setOrb(ox, oy, ORB.d(f), f, 0.85);
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v + SUB); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts) Promise.all(["400", "500", "600"].map((w) => document.fonts.load(`${w} 100px "Inter"`))).then(() => { fitted = false; render(R._f + SUB); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
