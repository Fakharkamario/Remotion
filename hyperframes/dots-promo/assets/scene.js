// dots — 23.3 s promo, 30 fps, 700 frames, cut to the voiceover in assets/voiceover.mp3.
// Motion language follows the reference edit: everything arrives on springs with overshoot, squashes and stretches,
// the camera never sits still, and shots hand over with whips, smash zooms, a circle wipe and a pixel dissolve
// (render with scripts/render-mb.sh for real motion blur). Dressed in the dots brand: black, the glowing
// blue/green/yellow/pink wordmark and the four felt characters.
//   0–56     "What if your AI could do the work,"      coloured letters slam in, fly into the line; words spring on; zoom through
//   56–103   "not just talk about it?"                  chatty replies pile up in a tilted stack, then burst into four dots
//   103–162  "Meet your new AI teammate."               the dots arc in and slam into the "dots" wordmark; the characters jump up
//   159–214  "Find what matters…"                       whip up into a prompt; chips pop; smash zoom; send
//   205–240  "…in your inbox"                           circle wipe out of the send button into mail
//   237–280  "Keep your day organized."                 whip to calendar; events drop in and reshuffle
//   277–352  "Research anything. Get the answers."      whip to research; sources fly in; the answer writes on
//   349–422  "Turn ideas into actual work."             whip to team chat; a doc lands; pixel dissolve
//   404–466  "Connect your tools."                      tool tiles swirl in and wire up to the hub; smash zoom into it
//   466–509  "Keep everything moving"                   a tilted feed of daily briefs snaps through Mon → Fri
//   503–572  "One Dot. Less busywork."                  the blue dot jumps up; busywork tags fly in, then get swept away
//   568–700  "You focus on what's next. OpenAI Dots."   the line types, bursts into dots that slam back in as the end card
(function () {
  const FPS = 30, FRAMES = 700, W = 1920, H = 1080;
  const SUB = 0; // sub-frame time offset; scripts/render-mb.sh sets it for its second, interleaved pass
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => Math.pow(clamp(t, 0, 1), 3);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t, s = 1.70158) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
  // damped spring 0 → 1 over about d frames (settles by 1.5 d); spr overshoots ~14 %, sprB ~26 %
  const spr = (f, t0, d) => { const p = (f - t0) / d; return p <= 0 ? 0 : p >= 2 ? 1 : 1 - Math.exp(-4 * p) * Math.cos(6.5 * p); };
  const sprB = (f, t0, d) => { const p = (f - t0) / d; return p <= 0 ? 0 : p >= 2.5 ? 1 : 1 - Math.exp(-3 * p) * Math.cos(7 * p); };
  // a decaying shake that starts at t0
  const shk = (f, t0, a, ph = 0) => (f < t0 ? 0 : a * Math.exp(-(f - t0) / 3.5) * Math.sin((f - t0) * 2.6 + ph));
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); t = clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t, 0, 1))).toString(16).padStart(2, "0")).join(""); };
  const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  // smooth lookup through [frame, value] pairs: a monotone cubic that passes through every key and never overshoots
  const slope = (p, i) => (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
  const tangent = (p, k) => {
    const n = p.length;
    if (n < 2) return 0;
    if (k === 0) return slope(p, 0);
    if (k === n - 1) return slope(p, n - 2);
    const d0 = slope(p, k - 1), d1 = slope(p, k);
    if (d0 * d1 <= 0) return 0;
    const h0 = p[k][0] - p[k - 1][0], h1 = p[k + 1][0] - p[k][0];
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const keys = (f, p) => {
    if (f <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (f <= p[i][0]) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], h = x1 - x0, t = (f - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * tangent(p, i - 1) + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * tangent(p, i);
    }
    return p[p.length - 1][1];
  };
  const rel = (t, p) => p.map(([a, v]) => [t + a, v]);
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

  // a slam: from big and soft to a squashed landing, a small rebound, settled
  const SLAM_S = [[0, 2.6], [2.5, 0.9], [4.5, 1.05], [7, 0.99], [9, 1]];
  const SLAM_Q = [[0, 1], [2.5, 0.84], [4.5, 1.06], [7, 0.99], [9, 1]]; // extra vertical squash
  const SLAM_B = [[0, 14], [2.5, 0]];

  // brand
  const BLUE = "#1477F0", GREEN = "#9BD43A", YELLOW = "#F6B926", PINK = "#FD26D3", PURPLE = "#8A5CFF";
  const BRAND = [BLUE, GREEN, YELLOW, PINK];
  const WMC = [ // per-letter fill and glow of the wordmark
    { fill: "#e8f2ff", g1: "#3d7bff", g2: "#5b3dff" },
    { fill: "#f2fbe6", g1: "#8fdc3c", g2: "#2fbf8a" },
    { fill: "#fff6e3", g1: "#ffb52a", g2: "#ff7a1a" },
    { fill: "#ffe9f8", g1: "#ff3fc8", g2: "#a64dff" },
  ];
  const UI = '"Inter", system-ui, sans-serif';

  const ICON = {
    mail: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3" fill="#1477F0"/><path d="M3.8 6.8l8.2 6 8.2-6" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="2.5" y="3.5" width="19" height="18" rx="4" fill="#9BD43A"/><path d="M2.5 9h19" stroke="#6fa81e" stroke-width="3"/><path d="M7.5 2.5v3M16.5 2.5v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/><text x="12" y="18.6" font-family="Inter" font-weight="800" font-size="8.5" fill="#173000" text-anchor="middle">24</text></svg>',
    docs: '<svg viewBox="0 0 24 24"><path d="M5.5 2.5h9l4 4v15h-13z" fill="#F6B926"/><path d="M14.5 2.5v4h4" fill="#d9951a"/><path d="M8.5 11h7M8.5 14h7M8.5 17h4.5" stroke="#4a3000" stroke-width="1.6" stroke-linecap="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M12 3.5c5 0 8.5 3.2 8.5 7.2S17 18 12 18c-1 0-2-.1-2.9-.4L4.5 20l1.3-3.8C4.2 14.9 3.5 13 3.5 10.7 3.5 6.7 7 3.5 12 3.5z" fill="#FD26D3"/><circle cx="8.5" cy="10.8" r="1.3" fill="#fff"/><circle cx="12" cy="10.8" r="1.3" fill="#fff"/><circle cx="15.5" cy="10.8" r="1.3" fill="#fff"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M2.5 6.5a2 2 0 012-2h5l2 2.2h8a2 2 0 012 2v9.3a2 2 0 01-2 2h-15a2 2 0 01-2-2z" fill="#8A5CFF"/><path d="M2.5 9.5h19" stroke="#6a3fe0" stroke-width="1.5"/></svg>',
    notes: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3" fill="#2bc4a0"/><path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="#06352a" stroke-width="1.7" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M12 20V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="#111" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg class="mic" viewBox="0 0 24 24"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="#d6d6d6"/><path d="M5 11.5a7 7 0 0014 0M12 18.5v3" fill="none" stroke="#d6d6d6" stroke-width="2" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#9a9aa2" stroke-width="2.2"/><path d="M15.5 15.5l5 5" stroke="#9a9aa2" stroke-width="2.2" stroke-linecap="round"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M5.5 2.5h9l4 4v15h-13z" fill="none" stroke="#F6B926" stroke-width="2"/><path d="M8.5 11h7M8.5 14h7M8.5 17h4.5" stroke="#F6B926" stroke-width="1.8" stroke-linecap="round"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 11-2.1-5" fill="none" stroke="#8e8e96" stroke-width="2.2" stroke-linecap="round"/><path d="M17.5 3v4.5H13" fill="none" stroke="#8e8e96" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" fill="#8e8e96"/><circle cx="12" cy="12" r="2" fill="#8e8e96"/><circle cx="12" cy="19" r="2" fill="#8e8e96"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="none" stroke="#5a5a62" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  };

  // ---------- the four felt characters, drawn in frame coordinates (as they stand along the bottom of the logo card) ----------
  const CH = {
    pink: { cx: 1395, body: '<path d="M1395 1135 C1245 1035 1212 915 1290 878 C1342 854 1382 884 1395 912 C1408 884 1448 854 1500 878 C1578 915 1545 1035 1395 1135 Z" fill="url(#gPink)"/>',
      face: '<g class="eyes" data-c="1414 1018"><circle cx="1350" cy="1018" r="41" fill="#0b0b0b"/><circle cx="1478" cy="1018" r="41" fill="#0b0b0b"/><path d="M1390 1010 Q1414 998 1438 1010" fill="none" stroke="#0b0b0b" stroke-width="8"/><ellipse cx="1338" cy="1004" rx="12" ry="7" fill="#fff" opacity=".22"/><ellipse cx="1466" cy="1004" rx="12" ry="7" fill="#fff" opacity=".22"/></g>' },
    yellow: { cx: 1137, body: '<path d="M1092 878 Q1137 802 1182 878 L1370 1128 Q1396 1166 1344 1166 L930 1166 Q878 1166 904 1128 Z" fill="url(#gYellow)"/>',
      face: '<g fill="none" stroke="#0e0e0e" stroke-width="9" stroke-linecap="round"><circle cx="1088" cy="968" r="47"/><circle cx="1228" cy="968" r="47"/><path d="M1135 962 Q1158 948 1181 962M1041 960 L1010 976M1275 960 L1302 972"/></g><g class="eyes" data-c="1158 980" fill="none" stroke="#2a1b00" stroke-width="6.5" stroke-linecap="round"><path d="M1068 978 Q1088 995 1108 978"/><path d="M1208 978 Q1228 995 1248 978"/></g>' },
    green: { cx: 905, body: '<ellipse cx="905" cy="1045" rx="128" ry="140" fill="url(#gGreen)"/><circle cx="848" cy="918" r="63" fill="url(#gGreen)"/><circle cx="968" cy="928" r="63" fill="url(#gGreen)"/>',
      face: '<g class="eyes" data-c="908 918"><circle cx="850" cy="914" r="40" fill="#f6f5ef"/><circle cx="966" cy="924" r="40" fill="#f6f5ef"/><g class="pup"><circle cx="856" cy="914" r="25" fill="#0b0b0b"/><circle cx="960" cy="924" r="25" fill="#0b0b0b"/><circle cx="849" cy="905" r="6" fill="#fff"/><circle cx="953" cy="915" r="6" fill="#fff"/></g></g>' },
    blue: { cx: 615, body: '<circle cx="610" cy="935" r="150" fill="url(#gBlue)"/><circle cx="495" cy="995" r="140" fill="url(#gBlue)"/><circle cx="735" cy="990" r="140" fill="url(#gBlue)"/><circle cx="430" cy="1085" r="125" fill="url(#gBlue)"/><circle cx="805" cy="1085" r="125" fill="url(#gBlue)"/><circle cx="615" cy="1070" r="185" fill="url(#gBlue)"/>',
      face: '<g class="eyes" data-c="660 1000"><ellipse cx="614" cy="1000" rx="16" ry="27" fill="#0b0b0b"/><ellipse cx="707" cy="1000" rx="16" ry="27" fill="#0b0b0b"/><circle cx="609" cy="990" r="4.5" fill="#fff" opacity=".8"/><circle cx="702" cy="990" r="4.5" fill="#fff" opacity=".8"/></g>',
      hat: '<ellipse cx="588" cy="840" rx="196" ry="72" transform="rotate(-9 588 840)" fill="url(#gBlack)"/><circle cx="572" cy="760" r="27" fill="url(#gBlack)"/>' },
  };
  const CH_ORDER = ["pink", "yellow", "green", "blue"]; // back to front
  const CH_TILT = { blue: -9, green: 7, yellow: -6, pink: 10 };
  const charMarkup = (names) => names.map((k) => `<g class="ch" data-k="${k}"><g filter="url(#fur)">${CH[k].body}</g>${CH[k].face}${CH[k].hat ? `<g filter="url(#fur)">${CH[k].hat}</g>` : ""}</g>`).join("");
  // a character's jump: shoots up out of frame, overshoots, lands with a squash, a small rebound
  const JUMP_Y = [[0, 660], [6, -95], [9, 0], [12, -20], [15, 0]];
  const JUMP_SY = [[0, 1.32], [5, 1.12], [7, 0.99], [9, 0.8], [11.5, 1.08], [14, 0.97], [16, 1]];
  const HOP_Y = [[0, 0], [3.5, -120], [7, 0], [9, -16], [11, 0]];
  const HOP_SY = [[0, 1], [1.5, 0.85], [3.5, 1.12], [6, 1], [7, 0.84], [9, 1.05], [11, 1]];

  const SCENE = {};
  SCENE.mount = function (stage) {
    const $ = (sel) => stage.querySelector(sel);
    const $$ = (sel) => [...stage.querySelectorAll(sel)];
    const vis = (el, on, d = "block") => { el.style.display = on ? d : "none"; };

    // text measuring (offscreen, always laid out, in composition pixels)
    const meas = document.createElement("span");
    meas.style.cssText = "position:absolute;left:-12000px;top:0;white-space:pre;visibility:hidden";
    const stageScale = () => stage.getBoundingClientRect().width / W || 1;
    let mcache = {};
    const measure = (text, font) => {
      const k = font + "|" + text;
      if (mcache[k] != null) return mcache[k];
      meas.style.font = font;
      meas.textContent = text;
      return (mcache[k] = meas.getBoundingClientRect().width / stageScale());
    };

    // ---------- faint rings with a few drifting coloured specks ----------
    function makeOrbits(host, cfg) {
      const R = rng(cfg.seed);
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
      cfg.sys.forEach((y) => y.r.forEach((r) => (s += `<circle cx="${y.cx}" cy="${y.cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="2"/>`)));
      host.innerHTML = s + "</svg>";
      const nodes = [];
      cfg.sys.forEach((y) => y.r.forEach((r) => {
        for (let k = 0; k < (cfg.per || 1); k++) {
          const el = document.createElement("div");
          el.className = "onode";
          const size = 6 + R() * 7;
          el.innerHTML = `<i style="width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;background:${BRAND[Math.floor(R() * 4)]}"></i>`;
          host.appendChild(el);
          nodes.push({ el, y, r, a0: R() * 360, sp: (R() < 0.5 ? -1 : 1) * (0.3 + R() * 0.4), op: 0.25 + R() * 0.3 });
        }
      }));
      return (f) => nodes.forEach((n) => {
        const a = ((n.a0 + n.sp * f) * Math.PI) / 180;
        n.el.style.transform = `translate(${px(n.y.cx + n.r * Math.cos(a))}, ${px(n.y.cy + n.r * Math.sin(a))})`;
        n.el.style.opacity = n.op.toFixed(3);
      });
    }

    // ---------- glowing wordmark ----------
    const FWM = `700 300px ${UI}`;
    const wmHTML = (cls) => "dots".split("").map((c, i) => `<span class="wm ${cls}" style="color:${WMC[i].fill};text-shadow:0 0 5px ${WMC[i].g1},0 0 16px ${WMC[i].g1},0 0 38px ${rgba(WMC[i].g2, 0.85)},0 0 80px ${rgba(WMC[i].g2, 0.45)}">${c}</span>`).join("");
    const ringHTML = (cls) => BRAND.map((c) => `<i class="ring ${cls}" style="border-color:${c};box-shadow:0 0 24px ${c}, inset 0 0 18px ${rgba(c, 0.6)}"></i>`).join("");
    const wmLetters = (cx, cy, s = 1) => {
      const tw = measure("dots", FWM) * s, left = cx - tw / 2;
      return "dots".split("").map((c, i) => {
        const x0 = left + measure("dots".slice(0, i), FWM) * s, w = measure(c, FWM) * s;
        return { x: x0, w, cx: x0 + w / 2, cy };
      });
    };
    // a wordmark letter slamming into its slot at t, with a shockwave ring
    function slamWM(el, ring, slot, s, f, t) {
      const on = f >= t;
      el.style.display = on ? "block" : "none";
      if (!on) { ring.style.display = "none"; return; }
      const k = keys(f, rel(t, SLAM_S)), q = keys(f, rel(t, SLAM_Q));
      el.style.transformOrigin = "50% 62%";
      el.style.transform = `translate(${px(slot.cx - slot.w / s / 2)}, ${px(slot.cy - 165)}) scale(${(s * k / Math.sqrt(q)).toFixed(4)}, ${(s * k * q).toFixed(4)})`;
      el.style.opacity = ramp(f, t, t + 1).toFixed(3);
      el.style.filter = `blur(${(1.1 + keys(f, rel(t, SLAM_B))).toFixed(2)}px)`;
      const rr = lerp(60, 330, eo(ramp(f, t + 2, t + 11)));
      ring.style.display = f < t + 11 ? "block" : "none";
      ring.style.width = ring.style.height = px(2 * rr);
      ring.style.transform = `translate(${px(slot.cx - rr)}, ${px(slot.cy - rr)})`;
      ring.style.opacity = (0.8 * (1 - ramp(f, t + 2, t + 11)) * ramp(f, t + 1.5, t + 2.5)).toFixed(3);
    }

    // ---------- characters: jump up, land with a squash, bob, blink; optional extra hops ----------
    const landings = (t0, gaps, n) => Array.from({ length: n }, (_, i) => t0 + i * gaps + 9);
    function driveChars(svg, f, t0, gaps = 3, order = ["blue", "green", "yellow", "pink"], hops = []) {
      svg.querySelectorAll(".ch").forEach((g) => {
        const k = g.dataset.k, i = order.indexOf(k), t = t0 + i * gaps, c = CH[k];
        let dy = keys(f, rel(t, JUMP_Y)), sy = keys(f, rel(t, JUMP_SY));
        hops.forEach((h) => { if (f >= h && f <= h + 11) { dy += keys(f, rel(h, HOP_Y)); sy *= keys(f, rel(h, HOP_SY)); } });
        if (f > t + 16) dy += 6 * Math.sin((f - t - 16) * 0.12 + i);
        const sx = 1 + (1 - sy) * 0.85, rot = keys(f, rel(t, [[0, CH_TILT[k]], [9, 0], [12, -CH_TILT[k] * 0.25], [16, 0]]));
        g.setAttribute("transform", `translate(0 ${dy.toFixed(2)}) translate(${c.cx} 1080) rotate(${rot.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-c.cx} -1080)`);
        g.style.display = f >= t ? "" : "none";
        const eyes = g.querySelector(".eyes");
        if (eyes && (k === "blue" || k === "green")) {
          const ph = (f + i * 23) % 70, bl = ph < 4 ? 1 - Math.sin((Math.PI * ph) / 4) * 0.92 : 1;
          const [ex, ey] = eyes.dataset.c.split(" ").map(Number);
          eyes.setAttribute("transform", `translate(${ex} ${ey}) scale(1 ${bl.toFixed(3)}) translate(${-ex} ${-ey})`);
        }
        const pup = g.querySelector(".pup");
        if (pup) pup.setAttribute("transform", `translate(${(6 * Math.sin(f * 0.09)).toFixed(2)} ${(2 * Math.cos(f * 0.11)).toFixed(2)})`);
      });
    }

    // a whip: the shot flies in from the right on a spring and leaves to the left, fast; returns transform + blur
    function whip(el, f, a, b, enter = true, exit = true) {
      const xAt = (g) => (enter ? 1700 * (1 - back(ramp(g, a - 3, a + 4), 1.1)) : 0) - (exit ? 1800 * ei(ramp(g, b - 4, b)) : 0);
      const x = xAt(f), v = x - xAt(f - 1);
      el.style.transform = `translateX(${px(x)}) skewX(${clamp(-v * 0.012, -14, 14).toFixed(2)}deg)`;
      el.style.filter = blurOf(Math.min(Math.abs(v) * 0.05, 26));
    }

    // ---------- DOM ----------
    const S1W = ["What", "if", "your", "AI", "could", "do", "the", "work,"];
    const BUBS = ["Great question! Let me explain…", "Here's a 12-step plan you could try", "You might want to consider…", "In summary, it depends", "Have you tried doing it yourself?", "Happy to talk it through!", "Let me know if you need more tips", "Want me to explain again?"];
    const MAIL = [["Maya Chen", "Q3 numbers are in - Final figures attached for your review", BLUE], ["Support", "Ticket #20418 was updated - A new reply is waiting"],
      ["Northwind Studio", "Contract renewal, next steps - Attaching the draft", PINK], ["Leo Park", "Feedback on the deck - Two quick notes on slide 4"],
      ["Calendar", "Reminder: Design review at 11:00 - Room 4B"], ["Priya Nair", "Standup notes, Tuesday - Quick recap since Monday"],
      ["Harbor Bank", "Your monthly statement is ready - View it online"], ["Sam Ortiz", "Re: launch plan - Approved on our side, go ahead", GREEN]];
    const SIDE = [["Starred", 339], ["Snoozed", 426], ["Sent", 510], ["Drafts", 597], ["Purchases", 681], ["More", 768]];
    const EVT = [ // [x, y, w, h, title, time, colour ("O" prefix = outlined), appear]
      [-60, 300, 462, 270, "Weekly report", "8:30am", BLUE, 240], [-60, 660, 462, 120, "Submit timesheet", "", GREEN, 249], [-60, 795, 462, 180, "Dinner with family", "", "O" + PINK, 256],
      [441, 234, 1038, 147, "Team standup", "9:00am", BLUE, 241], [441, 396, 1038, 147, "Focus time", "10:00am", PURPLE, 244], [441, 558, 1038, 396, "Client review", "11:30am", YELLOW, 247],
      [1515, 231, 460, 225, "Design sync", "9:00am", "O" + BLUE, 251], [1515, 609, 460, 261, "Send invoices", "1:00pm", PINK, 253],
    ];
    const darkText = (c) => c === GREEN || c === YELLOW;
    const SOURCES = [[BLUE, "workplace.report", "How teams use AI agents in 2026"], [PINK, "hbr-notes.com", "From chat to action: the agent shift"],
      [GREEN, "teamstudy.org", "Survey: where busywork goes"], [YELLOW, "futureofwork.io", "Agents that do the work"]];
    const ANSWER = ["Teams are moving from chat to action. Most now use", "agents to triage email, plan schedules and draft first", "versions of docs [1][2]. The biggest win is hours", "handed back for focused work [3]."];
    const TOOLS = [["mail", "Mail"], ["cal", "Calendar"], ["docs", "Docs"], ["chat", "Chat"], ["folder", "Drive"], ["notes", "Notes"]];
    const DAYS = [
      { date: "Mon, Oct 26", b: "Three emails need you today, starting with the client reply at 9:30. You're free after 3 for focused work." },
      { date: "Tue, Oct 27", b: "Light day today. Two client replies are drafted and waiting for your OK before noon." },
      { date: "Wed, Oct 28", b: "Two deadlines today: the launch deck and the Q3 report. Both first drafts are ready." },
      { date: "Thu, Oct 29", b: "Quiet morning. Your inbox is sorted and three clear hours are blocked for the big idea." },
      { date: "Fri, Oct 30", b: "Inbox zero by nine. The weekly recap is written and Monday's sync is already booked." },
    ];
    const DAY_T = [474, 482, 490, 498];
    const TAGS = [["214 unread", BLUE, 240, 190], ["Reply all", PINK, 1450, 170], ["Status update", YELLOW, 120, 520], ["Reformat the deck", GREEN, 1400, 540], ["Find that file", PURPLE, 210, 830], ["Schedule a call", BLUE, 1420, 860]];
    const TAG = "You focus on what's next.";

    const pillHTML = (id) => `<div class="pill" id="${id}"><span class="spin">${BRAND.map((c, i) => `<i style="left:${i * 24}px;background:${c}"></i>`).join("")}</span><span class="pt"></span></div>`;

    stage.innerHTML = `
      <div id="s1" class="scene grain"><div class="orb" id="orb1"></div><div id="s1line" class="layer">${S1W.map((w) => `<span class="abs w1">${w}</span>`).join("")}</div>
        <div class="layer">${"What".split("").map((c) => `<span class="abs l1">${c}</span>`).join("")}</div></div>
      <div id="s2" class="scene grain"><div class="orb" id="orb2"></div><div id="s2in" class="layer">${BUBS.map((t) => `<div class="bub">${t}</div>`).join("")}</div></div>
      <div id="s3" class="scene grain"><div class="orb" id="orb3"></div><div id="g3" class="layer">${ringHTML("r3")}${wmHTML("wm3")}</div>
        <svg class="chars" id="ch3" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${charMarkup(CH_ORDER)}</svg></div>
      <div id="dotsL" class="layer" style="display:none">${BRAND.map((c) => `<i class="abs" style="border-radius:50%;background:${c};box-shadow:0 0 30px ${rgba(c, 0.8)}"></i>`).join("")}</div>
      <div id="s4" class="scene grain" style="background:transparent"><div class="orb" id="orb4"></div>
        <div id="cam4"><div id="pIcons"></div>
          <div id="prompt"><div id="ptext"></div>
            <div id="pctl"><span class="plus">+</span><div class="rt"><span class="model">Dots 1</span>${ICON.mic}<div id="send"><div id="ring"></div>${ICON.arrow}</div></div></div></div></div></div>
      <div id="s5" class="scene ui" style="background:#121214"><div class="cam" id="cam5">
          <div class="bx" style="left:0;top:0;width:490px;height:1080px;background:#0b0b0d"></div>
          <div class="bx" style="left:-40px;top:52px;width:274px;height:106px;border-radius:32px;background:#f2f2f4"></div>
          <div class="bx" style="left:20px;top:82px;font:600 38px Inter;color:#111">Compose</div>
          <div class="bx" style="left:-40px;top:216px;width:496px;height:78px;border-radius:39px;background:#232328"></div>
          <div class="bx" style="left:-12px;top:232px;font:700 34px Inter;color:#fff">Inbox</div>
          <div class="bx" id="inboxN" style="left:360px;top:236px;width:70px;text-align:right;font:700 28px Inter;color:#fff">68</div>
          ${SIDE.map(([t, y]) => `<div class="bx" style="left:-12px;top:${y - 20}px;font:400 34px Inter;color:#b9b9c0">${t}</div>`).join("")}
          <div class="bx" style="left:360px;top:665px;width:70px;text-align:right;font:500 26px Inter;color:#8a8a92">11</div>
          <div class="bx" style="left:535px;top:37px;width:34px;height:34px;border:3px solid #8e8e96;border-radius:6px"></div>
          <div class="bx" style="left:631px;top:34px;width:40px;height:40px">${ICON.refresh}</div>
          <div class="bx" style="left:733px;top:34px;width:40px;height:40px">${ICON.dots}</div>
          ${MAIL.map(([a, b, c], i) => `<div class="bx mrow" style="left:490px;top:${114 + i * 120}px;width:1430px;height:120px;border-top:2px solid #212125">
              ${c ? `<div class="bx mhl" style="left:0;top:0;width:1430px;height:118px;background:${rgba(c, 0.13)}"></div><div class="bx mbar" style="left:0;top:14px;width:9px;height:90px;border-radius:5px;background:${c};transform-origin:50% 50%"></div>` : ""}
              <div class="bx" style="left:53px;top:43px;width:30px;height:30px;border:2.5px solid #4a4a52;border-radius:5px"></div>
              <div class="bx" style="left:133px;top:40px;width:38px;height:38px">${ICON.star}</div>
              <div class="bx" style="left:227px;top:36px;font:600 40px Inter;color:#f2f2f4">${a}</div>
              <div class="bx" style="left:635px;top:36px;font:400 40px Inter;color:#9a9aa2">${b}</div></div>`).join("")}
        </div>${pillHTML("pill5")}</div>
      <div id="s6" class="scene ui" style="background:#0e0e10"><div class="cam" id="cam6">
          <div class="bx" style="left:426px;top:-200px;width:2px;height:1500px;background:#26262b"></div>
          <div class="bx" style="left:1491px;top:-200px;width:2px;height:1500px;background:#26262b"></div>
          <div class="bx" style="left:-10px;top:192px;width:1940px;height:2px;background:#26262b"></div>
          <div class="bx" id="date6" style="left:871px;top:-23px;width:178px;height:178px;border-radius:50%;background:#f2f2f4;color:#111;font:600 88px Inter;display:grid;place-items:center">24</div>
          ${EVT.map(([x, y, w, h, t, tm, c]) => { const o = c[0] === "O", col = o ? c.slice(1) : c, fg = o ? col : darkText(col) ? "#151515" : "#fff";
            return `<div class="bx evt" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${o ? "#0e0e10" : col};border:${o ? `3px solid ${col}` : "none"};border-radius:14px;color:${fg};transform-origin:50% 0;overflow:hidden">
              <div class="evl" style="position:absolute;left:${x < 0 ? 80 : 20}px;top:14px"><div style="font:600 40px Inter">${t}</div><div style="font:400 25px Inter;opacity:.8;margin-top:2px">${tm}</div></div></div>`; }).join("")}
        </div>${pillHTML("pill6")}</div>
      <div id="s7" class="scene ui" style="background:#111113"><div class="cam" id="cam7">
          <div class="bx" style="left:0;top:0;width:360px;height:1080px;background:#0a0a0c"></div>
          ${[["+ New search", 100], ["Home", 210], ["Library", 290], ["Spaces", 370]].map(([t, y]) => `<div class="bx" style="left:${t[0] === "+" ? 40 : -14}px;top:${y}px;font:${t[0] === "+" ? 600 : 400} 36px Inter;color:${t[0] === "+" ? "#fff" : "#9a9aa2"}">${t}</div>`).join("")}
          <div class="bx" style="left:440px;top:60px;width:1560px;height:130px;border-radius:65px;background:#1a1a1d;border:2px solid #2c2c31"></div>
          <div class="bx" style="left:490px;top:101px;width:48px;height:48px">${ICON.search}</div>
          <div class="bx" id="q7" style="left:565px;top:97px;font:400 44px Inter;color:#f2f2f4"></div>
          ${SOURCES.map(([c, d, t], i) => `<div class="bx src" style="left:${440 + i * 400}px;top:240px;width:370px;height:170px;border-radius:22px;background:#18181b;border:2px solid #26262b">
              <div class="bx" style="left:24px;top:24px;width:38px;height:38px;border-radius:50%;background:${c}"></div>
              <div class="bx" style="left:76px;top:28px;font:400 25px Inter;color:#85858d">${d}</div>
              <div style="position:absolute;left:24px;top:80px;width:322px;font:500 29px/37px Inter;color:#e6e6ea;white-space:normal">${t}</div></div>`).join("")}
          <div class="bx" style="left:440px;top:478px;width:60px;height:30px">${BRAND.map((c, i) => `<i style="position:absolute;left:${i * 16}px;top:8px;width:12px;height:12px;border-radius:50%;background:${c}"></i>`).join("")}</div>
          <div class="bx" style="left:520px;top:468px;font:650 38px Inter;color:#fff">Answer</div>
          ${ANSWER.map((t, i) => `<div class="bx sk7" style="left:440px;top:${560 + i * 74}px;width:${[1380, 1320, 1400, 820][i]}px;height:34px;border-radius:17px"></div>
              <div class="bx an7" style="left:440px;top:${548 + i * 74}px;font:400 44px Inter;color:#ececf0">${t}</div>`).join("")}
        </div>${pillHTML("pill7")}</div>
      <div id="s8" class="scene ui" style="background:#111113"><div class="cam" id="cam8">
          <div id="msgs" class="layer"></div>
          <div class="bx" style="left:0;top:0;width:498px;height:1080px;background:#0b0b0d"></div>
          ${[["ouncements", 165], ["nch-team", 354], ["ssages", 459], ["ntions & you", 576], ["n, Jon Patel ...", 660], ["mates", 756], ["alendar", 966]].map(([t, y], i) => `<div class="bx" style="left:-6px;top:${y - 24}px;font:${i === 1 ? 700 : 400} 40px Inter;color:${i === 1 ? "#fff" : "rgba(255,255,255,.55)"}">${t}</div>`).join("")}
          <div class="bx" style="left:540px;top:878px;width:1440px;height:260px;border-radius:18px;border:2px solid #2e2e34;background:#17171a"></div>
          <div class="bx" style="left:582px;top:910px;font:400 38px Inter;color:#7a7a82">Message #launch-team</div>
        </div>${pillHTML("pill8")}</div>
      <div id="s9" class="scene"><canvas id="mos" width="${W}" height="${H}"></canvas>
        <div id="hub"><svg id="wires" width="${W}" height="${H}" style="position:absolute;left:0;top:0"></svg>
          <div id="hubDots" class="layer">${BRAND.map((c) => `<i class="abs" style="border-radius:50%;background:${c};box-shadow:0 0 36px ${rgba(c, 0.9)}"></i>`).join("")}</div>
          ${TOOLS.map(([k, n]) => `<div class="tile">${ICON[k]}<b>${n}</b></div>`).join("")}</div>
        <div id="feed">${DAYS.map((d) => `<div class="fcard"><div class="date">${d.date}</div><div class="ttl">Daily brief</div><div class="rule"></div><div class="body">${d.b}</div>
            <div class="foot">${BRAND.map((c) => `<i style="background:${c}"></i>`).join("")}<span>Handled by your Dot</span></div></div>`).join("")}</div></div>
      <div id="s10" class="scene grain"><div class="orb" id="orb10"></div><div id="s10in" class="layer">
        ${TAGS.map(([t, c]) => `<div class="tag"><i style="background:${c}"></i>${t}</div>`).join("")}
        <div id="one" class="layer"><span class="big b10">One </span><span class="big b10" style="color:#3b8cff">Dot.</span><span class="big b10">Less </span><span class="big b10">busywork.</span></div>
        <svg class="chars" id="ch10" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g transform="translate(960 1080) scale(1.32) translate(-615 -1080)">${charMarkup(["blue"])}</g></svg></div></div>
      <div id="s11" class="scene grain"><div class="orb" id="orb11"></div>
        <div id="tagL" class="layer">${TAG.split("").map((c) => `<span class="abs t11">${c}</span>`).join("")}<div id="tcur"></div></div>
        <div id="endG" class="layer" style="transform-origin:960px 540px"><div class="layer">${"OpenAI".split("").map((c) => `<span class="abs oai">${c}</span>`).join("")}</div>${ringHTML("r12")}${wmHTML("wm12")}<div id="sqs"></div>
          <svg class="chars" id="ch12" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${charMarkup(CH_ORDER)}</svg></div></div>
    `;
    stage.insertAdjacentHTML("beforeend", `<i id="wipe" class="ring" style="border:10px solid #fff;box-shadow:0 0 50px #fff, inset 0 0 30px rgba(255,255,255,.6)"></i>`);
    stage.appendChild(meas);

    const sc = {}; ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"].forEach((k) => (sc[k] = $("#" + k)));
    const orb1 = makeOrbits($("#orb1"), { seed: 11, sys: [{ cx: 640, cy: 760, r: [170, 270, 400] }, { cx: 1500, cy: 260, r: [200, 330] }] });
    const orb2 = makeOrbits($("#orb2"), { seed: 5, sys: [{ cx: 1500, cy: 620, r: [260, 420] }] });
    const orb3 = makeOrbits($("#orb3"), { seed: 9, per: 2, sys: [{ cx: 960, cy: 420, r: [460, 640] }] });
    const orb4 = makeOrbits($("#orb4"), { seed: 21, sys: [{ cx: 1450, cy: 330, r: [330, 520, 720] }, { cx: 330, cy: 940, r: [260, 430] }] });
    const orb10 = makeOrbits($("#orb10"), { seed: 17, sys: [{ cx: 960, cy: 520, r: [520, 700] }] });
    const orb11 = makeOrbits($("#orb11"), { seed: 31, per: 2, sys: [{ cx: 960, cy: 540, r: [300, 470, 650] }] });

    // ---------- S1: "What if your AI could do the work," ----------
    const w1 = $$(".w1"), l1 = $$(".l1");
    const F1 = `600 66px ${UI}`;
    const W1_IN = [0, 27, 29, 32, 35.5, 38, 40, 43];
    const L1_POS = [[300, 200], [1500, 170], [1290, 380], [690, 850]], L1_IN = [0, 4, 7, 11], L1_GO = [15, 16.5, 18, 19.5], L1_BIG = 3.3, L1_ROT = [-12, 9, -7, 11];
    function renderS1(f) {
      orb1(f);
      const sp = measure(" ", F1), ws = S1W.map((w) => measure(w, F1));
      const con = ws.map((w, i) => (i === 0 ? w : (sp + w) * clamp(spr(f, W1_IN[i], 7), 0, 1.15)));
      const left = 960 - con.reduce((a, b) => a + b, 0) / 2;
      // camera: a slow push, shaken by each slam, then a zoom straight through the line
      const zoom = (1 + 0.05 * eo(ramp(f, 27, 50))) * lerp(1, 8, ei(ramp(f, 50, 56.5)));
      const shx = L1_IN.reduce((a, t) => a + shk(f, t + 2.5, 9), 0), shy = L1_IN.reduce((a, t) => a + shk(f, t + 2.5, 7, 1.3), 0);
      sc.s1.style.transform = `translate(${px(shx)}, ${px(shy)})`;
      const line = $("#s1line");
      line.style.transformOrigin = "960px 540px";
      line.style.transform = `scale(${zoom.toFixed(4)})`;
      line.style.filter = blurOf(18 * ei(ramp(f, 50, 56.5)));
      line.style.opacity = (1 - ramp(f, 54.5, 56.5)).toFixed(3);
      let x = left;
      w1.forEach((el, i) => {
        const xi = i === 0 ? x : x + sp;
        x += con[i];
        const t = W1_IN[i], k = spr(f, t, 7);
        el.style.display = (i === 0 ? f >= 27 : f >= t) ? "block" : "none";
        el.style.font = F1;
        el.style.letterSpacing = "-0.02em";
        el.style.color = "#f4f4f6";
        el.style.opacity = i === 0 ? 1 : ramp(f, t, t + 1.5).toFixed(3);
        el.style.transformOrigin = "0% 80%";
        el.style.filter = i === 0 ? "none" : blurOf(9 * (1 - eo(ramp(f, t, t + 3))));
        el.style.transform = `translate(${px(xi)}, ${px(507)}) rotate(${(i === 0 ? 0 : -12 * (1 - k)).toFixed(2)}deg) scale(${(i === 0 ? 1 : lerp(1.9, 1, k)).toFixed(4)})`;
      });
      // big letters: slam in scattered and coloured, hover, then whip into "What" on an arc
      const lineLeft = 960 - ws[0] / 2;
      l1.forEach((el, k) => {
        const on = f >= L1_IN[k] && f < 27.5;
        vis(el, on);
        if (!on) return;
        const lw = measure("What"[k], F1), off = measure("What".slice(0, k), F1);
        const t = eio(ramp(f, L1_GO[k], L1_GO[k] + 7));
        const x0 = L1_POS[k][0] + Math.min(f - L1_IN[k], 15) * 1.2, y0 = L1_POS[k][1] - Math.min(f - L1_IN[k], 15) * 0.7;
        const x1 = lineLeft + off + lw / 2, y1 = 540;
        const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1, arc = Math.sin(Math.PI * t) * 160;
        const cx = lerp(x0, x1, t) + (nx / nl) * arc, cy = lerp(y0, y1, t) + (ny / nl) * arc;
        const s = lerp(L1_BIG * keys(f, rel(L1_IN[k], SLAM_S)), 1, t);
        const c = BRAND[k];
        el.style.font = F1;
        el.style.color = mix(c, "#f4f4f6", ramp(f, L1_GO[k] + 2, L1_GO[k] + 7));
        el.style.textShadow = `0 0 14px ${rgba(c, (0.7 * (1 - t)).toFixed(3))}`;
        el.style.opacity = ramp(f, L1_IN[k], L1_IN[k] + 1).toFixed(3);
        el.style.transformOrigin = "50% 50%";
        el.style.transform = `translate(${px(cx - lw / 2)}, ${px(cy - 33)}) rotate(${(L1_ROT[k] * (1 - spr(f, L1_IN[k], 8)) + 25 * Math.sin(Math.PI * t) * (k % 2 ? 1 : -1)).toFixed(2)}deg) scale(${s.toFixed(4)})`;
        el.style.filter = blurOf(keys(f, rel(L1_IN[k], SLAM_B)) * 0.6 + 6 * Math.sin(Math.PI * t));
      });
    }

    // ---------- S2: "not just talk about it?" — replies pile up in a tilted stack ----------
    const bubs = $$(".bub");
    const BUB_T = [-99, -99, 59, 63, 67, 72, 77, 83];
    function renderS2(f) {
      orb2(f);
      const inn = $("#s2in");
      const ent = spr(f, 56, 9);
      inn.style.transformOrigin = "760px 640px";
      inn.style.transform = `perspective(1700px) rotateY(${lerp(16, -8, eio(ramp(f, 56, 100))).toFixed(2)}deg) rotateX(${lerp(10, 3, ramp(f, 56, 100)).toFixed(2)}deg) rotateZ(${lerp(-3, 1, ramp(f, 56, 100)).toFixed(2)}deg) scale(${lerp(0.55, 1, ent).toFixed(4)})`;
      inn.style.filter = blurOf(14 * (1 - eo(ramp(f, 56, 60))));
      const kk = 1 + BUB_T.slice(2).reduce((a, t) => a + spr(f, t, 8), 0);
      bubs.forEach((el, i) => {
        const y = 760 + (i - kk) * 175;
        const pop = i < 2 ? 1 : sprB(f, BUB_T[i], 7);
        const g = i >= 3 ? ramp(f, 89 + (i % 4) * 0.8, 94 + (i % 4) * 0.8) : 0;
        const burst = g < 0.3 ? 1 + 0.5 * g : (1 - eo((g - 0.3) / 0.7)) * 1.15;
        const s = pop * burst;
        el.style.display = f >= BUB_T[i] && s > 0.01 ? "block" : "none";
        el.style.transform = `translateY(${px(y - 75)}) rotate(${(-8 * (1 - pop)).toFixed(2)}deg) scale(${Math.max(0, s).toFixed(4)})`;
        const newest = f >= BUB_T[i] && (i === 7 || f < BUB_T[i + 1]);
        el.style.color = newest ? "#ffffff" : "#6f6f76";
        el.style.background = newest ? "#2a2a2e" : "#161618";
        el.style.opacity = clamp((y + 40) / 260, 0, 1).toFixed(3);
      });
    }

    // ---------- four dots: burst out of the stack, arc in, stretched along their speed, and slam into the wordmark ----------
    const dotsL = $("#dotsL");
    const DOT = [
      { t0: 91, p0: [560, 600], c: [180, 120], r: 34 },
      { t0: 92, p0: [900, 770], c: [1100, 1040], r: 30 },
      { t0: 93, p0: [700, 930], c: [1700, 900], r: 32 },
      { t0: 94, p0: [1180, 760], c: [1880, 120], r: 28 },
    ];
    const SLAM3 = [111, 112.5, 114, 115.5];
    const dotPos = (i, f, slots) => {
      const d = DOT[i], u = ramp(f, d.t0, SLAM3[i]);
      const e = u < 0.35 ? eo(u / 0.35) * 0.3 : 0.3 + 0.7 * ei((u - 0.35) / 0.65);
      const s = slots[i], a = 1 - e;
      return [a * a * d.p0[0] + 2 * a * e * d.c[0] + e * e * s.cx, a * a * d.p0[1] + 2 * a * e * d.c[1] + e * e * s.cy];
    };
    function renderDots(f) {
      const on = f >= 91 && f < 117;
      vis(dotsL, on);
      if (!on) return;
      const slots = wmLetters(960, 410);
      [...dotsL.children].forEach((el, i) => {
        const d = DOT[i];
        if (f < d.t0 || f >= SLAM3[i]) { el.style.display = "none"; return; }
        el.style.display = "block";
        const [x, y] = dotPos(i, f, slots), [x0, y0] = dotPos(i, f - 0.6, slots);
        const v = Math.hypot(x - x0, y - y0), st = 1 + Math.min(v / 18, 2.2);
        const r = d.r * sprB(f, d.t0, 4);
        el.style.width = el.style.height = px(2 * r);
        el.style.transform = `translate(${px(x - r)}, ${px(y - r)}) rotate(${Math.atan2(y - y0, x - x0).toFixed(3)}rad) scale(${st.toFixed(3)}, ${(1 / Math.sqrt(st)).toFixed(3)})`;
      });
    }

    // ---------- S3: "Meet your new AI teammate." ----------
    const wm3 = $$(".wm3"), r3 = $$(".r3"), ch3 = $("#ch3");
    const CH3 = 124;
    function renderS3(f) {
      orb3(f);
      const s = 1 + 0.04 * eio(ramp(f, 114, 158));
      const slots = wmLetters(960, 410, s);
      wm3.forEach((el, i) => slamWM(el, r3[i], slots[i], s, f, SLAM3[i]));
      driveChars(ch3, f, CH3, 3);
      const hits = [...SLAM3.map((t) => [t + 2.5, 10]), ...landings(CH3, 3, 4).map((t) => [t, 6])];
      const shx = hits.reduce((a, [t, m]) => a + shk(f, t, m), 0), shy = hits.reduce((a, [t, m]) => a + shk(f, t, m * 0.8, 1.2), 0);
      // exits by whipping up out of frame
      const up = -1150 * ei(ramp(f, 158, 163)), v = up - -1150 * ei(ramp(f - 1, 158, 163));
      sc.s3.style.transform = `translate(${px(shx)}, ${px(shy + up)})`;
      $("#g3").style.filter = blurOf(Math.abs(v) * 0.05); // not on the scene: a CSS filter above the felt SVG filter hides the characters
    }

    // ---------- S4: prompt ----------
    const PT = [{ t: "Find what matters in my " }, { chip: "mail", label: "Mail" }, { t: " inbox, keep my " }, { chip: "cal", label: "Calendar" }, { t: " organized, draft in " }, { chip: "docs", label: "Docs" }];
    const EV4 = [];
    {
      let t = 163, first = true;
      PT.forEach((tok) => {
        if (tok.t) tok.t.split("").forEach((ch, i) => { const pre = first && i < 5; EV4.push([pre ? 159 : t, "c", ch]); if (!pre) t += 1 / 2.3; });
        else { EV4.push([t, "at"]); t += 2.2; EV4.push([t, "chip", tok]); t += 1.3; }
        first = false;
      });
    }
    const T4_DONE = EV4[EV4.length - 1][0];
    const ptext = $("#ptext"), pIcons = $("#pIcons"), send = $("#send"), ring = $("#ring"), arrowSvg = send.querySelector("svg");
    function renderS4(f) {
      orb4(f);
      let html = "", icons = [], atOpen = false;
      EV4.forEach(([t, k, p]) => {
        if (t > f) return;
        if (k === "c") html += p.replace("'", "&#39;");
        else if (k === "at") { html += "@"; atOpen = true; }
        else {
          if (atOpen) { html = html.slice(0, -1); atOpen = false; }
          html += `<span class="chip" style="transform:scale(${lerp(0.3, 1, sprB(f, t, 5)).toFixed(3)}) rotate(${(-10 * (1 - spr(f, t, 5))).toFixed(2)}deg)">${ICON[p.chip]}${p.label}</span>`;
          icons.push([p.chip, t]);
        }
      });
      const blink = f < T4_DONE + 2 || Math.floor((f - T4_DONE) / 7) % 2 === 0;
      html += `<span class="cur" style="opacity:${f < 199 && blink ? 1 : 0}"></span>`;
      ptext.innerHTML = html;
      pIcons.innerHTML = icons.map(([k, t], i) => `<div class="appic" style="left:${i * 66}px;transform:translateY(${px(-40 * (1 - spr(f, t, 6)))}) scale(${sprB(f, t, 5).toFixed(3)});opacity:${ramp(f, t, t + 1).toFixed(3)}">${ICON[k]}</div>`).join("");
      // scene arrives from below (whip up), then a slow push, a smash zoom onto the send button, a shake
      const inY = 1100 * (1 - eo(ramp(f, 159, 165))), vin = inY - 1100 * (1 - eo(ramp(f - 1, 159, 165)));
      sc.s4.style.transform = `translate(${px(shk(f, 189.5, 16))}, ${px(inY + shk(f, 189.5, 12, 1))})`;
      sc.s4.style.filter = blurOf(Math.abs(vin) * 0.05);
      const s = keys(f, [[159, 0.9], [186, 1.06], [188, 1.08], [189, 1.6], [190, 2.1], [191, 2.32], [193, 2.4], [214, 2.55]]);
      const Px = keys(f, [[159, 940], [188, 990], [189, 1180], [190, 1310], [191, 1350], [214, 1372]]);
      const Py = keys(f, [[159, 560], [188, 562], [191, 578], [214, 584]]);
      const rot = keys(f, [[159, -2.5], [188, 0.5], [191, -1.2], [214, 0.6]]);
      const cam = $("#cam4");
      cam.style.transform = `translate(${px(960 - s * Px)}, ${px(540 - s * Py)}) scale(${s.toFixed(4)}) rotate(${rot.toFixed(3)}deg)`;
      cam.style.filter = blurOf(keys(f, [[187.5, 0], [188.5, 8], [190, 7], [191.5, 0]]));
      arrowSvg.style.transform = `rotate(${(45 * (1 - spr(f, 195, 5))).toFixed(2)}deg)`;
      const press = keys(f, [[199, 1], [201, 0.82], [203, 1.08], [205, 1]]);
      send.style.transform = `scale(${press.toFixed(4)})`;
      const rr = lerp(70, 170, eo(ramp(f, 200, 208)));
      ring.style.width = ring.style.height = px(rr);
      ring.style.margin = px(-rr / 2) + " 0 0 " + px(-rr / 2);
      ring.style.opacity = (f >= 200 ? 0.9 * (1 - ramp(f, 202, 208)) : 0).toFixed(3);
    }

    // ---------- pills: white, a bouncing four-dot spinner, shimmering label ----------
    function setPill(el, f, t0, text, k = 1, y = 540) {
      el.style.display = k > 0.002 ? "flex" : "none";
      el.style.top = px(y + 6 * Math.sin((f - t0) * 0.15));
      el.style.transform = `translate(-50%, -50%) scale(${(k * sprB(f, t0, 6)).toFixed(4)}) rotate(${(-6 * (1 - spr(f, t0, 6))).toFixed(2)}deg)`;
      const pt = el.querySelector(".pt");
      if (pt.textContent !== text) pt.textContent = text;
      pt.style.backgroundPosition = `${(1.15 - (((f - t0) / 22) % 1.6)) * 100}% 0`;
      [...el.querySelectorAll(".spin i")].forEach((d, i) => {
        const b = Math.max(0, Math.sin(f * 0.5 - i * 0.9));
        d.style.transform = `translateY(${px(-13 * b)}) scale(${(1 + 0.15 * b).toFixed(3)}, ${(1 - 0.1 * b).toFixed(3)})`;
      });
    }

    // ---------- S5 mail ----------
    const mrows = $$(".mrow");
    function renderS5(f) {
      // circle wipe out of the send button
      const r = lerp(30, 2300, eio(ramp(f, 205.5, 213)));
      if (f < 214) {
        const b = send.getBoundingClientRect(), st = stage.getBoundingClientRect(), k = stageScale();
        sc.s5.style.clipPath = `circle(${px(r)} at ${px((b.left + b.width / 2 - st.left) / k)} ${px((b.top + b.height / 2 - st.top) / k)})`;
        const wp = $("#wipe");
        wp.style.display = f >= 205.5 ? "block" : "none";
        wp.style.width = wp.style.height = px(2 * r);
        wp.style.transform = `translate(${px((b.left + b.width / 2 - st.left) / k - r)}, ${px((b.top + b.height / 2 - st.top) / k - r)})`;
        wp.style.opacity = (1 - ramp(f, 210, 213.5)).toFixed(3);
      } else { sc.s5.style.clipPath = "none"; $("#wipe").style.display = "none"; }
      whip(sc.s5, f, 205, 240, false, true);
      $("#cam5").style.transform = `translate(${px(lerp(60, -20, eio(ramp(f, 205, 240))))}, ${px(lerp(0, -16, ramp(f, 205, 240)))}) scale(${lerp(1.18, 1.03, eo(ramp(f, 205, 222))).toFixed(4)}) rotate(${lerp(-1.5, 0.5, eio(ramp(f, 205, 240))).toFixed(3)}deg)`;
      mrows.forEach((el, i) => {
        const t = 209 + i * 1.4, a = spr(f, t, 7);
        el.style.opacity = ramp(f, t, t + 2).toFixed(3);
        el.style.transform = `translateX(${px(520 * (1 - a))})`;
        const hl = el.querySelector(".mhl"), bar = el.querySelector(".mbar");
        if (hl) {
          const j = [0, 2, 7].indexOf(i), th = 222 + j * 2.5;
          hl.style.transformOrigin = "0 50%";
          hl.style.transform = `scaleX(${eo(ramp(f, th, th + 5)).toFixed(4)})`;
          bar.style.transform = `scaleY(${sprB(f, th, 5).toFixed(4)})`;
          el.style.transform += ` scale(${(1 + 0.025 * Math.sin(Math.PI * ramp(f, th, th + 6))).toFixed(4)})`;
        }
      });
      $("#inboxN").textContent = String(68 + Math.min(7, Math.max(0, Math.floor((f - 209) / 1.4))));
      setPill($("#pill5"), f, 211, "Finding what matters", 1, 600);
    }

    // ---------- S6 calendar: events drop in on springs, then two of them swap ----------
    const evts = $$(".evt");
    function renderS6(f) {
      whip(sc.s6, f, 240, 280);
      $("#cam6").style.transform = `translateY(${px(keys(f, [[237, 70], [262, 22], [280, 0]]))}) scale(${keys(f, [[237, 1.06], [280, 1]]).toFixed(4)}) rotate(${lerp(1.2, -0.6, eio(ramp(f, 237, 280))).toFixed(3)}deg)`;
      $("#date6").style.transform = `scale(${sprB(f, 240, 6).toFixed(4)})`;
      evts.forEach((el, i) => {
        const t = EVT[i][7], a = sprB(f, t, 6);
        const swap = i === 3 ? 162 * spr(f, 265, 8) : i === 4 ? -162 * spr(f, 266, 8) : 0;
        el.style.display = f >= t ? "block" : "none";
        el.style.transform = `translateY(${px(-140 * (1 - spr(f, t, 6)) + swap)}) scaleY(${lerp(0.25, 1, clamp(a, 0, 1.2)).toFixed(4)})`;
        el.style.opacity = ramp(f, t, t + 1).toFixed(3);
        el.style.zIndex = i === 3 ? 2 : 1;
        el.children[0].style.opacity = ramp(f, t + 2, t + 4).toFixed(3);
      });
      setPill($("#pill6"), f, 242, "Organizing your day");
    }

    // ---------- S7 research ----------
    const srcs = $$(".src"), sk7 = $$(".sk7"), an7 = $$(".an7");
    const Q7 = "How are teams using AI agents at work?";
    function renderS7(f) {
      whip(sc.s7, f, 280, 352);
      $("#cam7").style.transform = `scale(${lerp(1.04, 1.1, eio(ramp(f, 277, 352))).toFixed(4)}) rotate(${lerp(-1, 0.8, eio(ramp(f, 277, 352))).toFixed(3)}deg) translateY(${px(lerp(20, -20, ramp(f, 277, 352)))})`;
      $("#q7").textContent = Q7.slice(0, Math.floor(clamp((f - 280) * 3.4, 0, Q7.length)));
      srcs.forEach((el, i) => {
        const t = 288 + i * 3, a = spr(f, t, 7);
        el.style.opacity = ramp(f, t, t + 1.5).toFixed(3);
        el.style.transform = `translate(${px(700 * (1 - a))}, ${px(-60 * (1 - a))}) rotate(${(14 * (1 - a)).toFixed(2)}deg)`;
      });
      sk7.forEach((el, i) => {
        el.style.background = "linear-gradient(90deg, #1f1f23 0%, #1f1f23 35%, #2c2c32 50%, #1f1f23 65%, #1f1f23 100%)";
        el.style.backgroundSize = "300% 100%";
        el.style.backgroundPosition = `${100 - (((f - 280 + i * 3) * 5) % 140)}% 0`;
        el.style.opacity = (ramp(f, 298 + i * 1.5, 301 + i * 1.5) * (1 - ramp(f, 326 + i * 4, 328 + i * 4))).toFixed(3);
        el.style.transform = `scaleX(${eo(ramp(f, 298 + i * 1.5, 304 + i * 1.5)).toFixed(4)})`;
        el.style.transformOrigin = "0 50%";
      });
      an7.forEach((el, i) => { const a = ramp(f, 326 + i * 4, 331 + i * 4); el.style.clipPath = `inset(0 ${((1 - eo(a)) * 100).toFixed(2)}% 0 0)`; el.style.opacity = a > 0 ? 1 : 0; el.style.transform = `translateY(${px(14 * (1 - eo(a)))})`; });
      const swapPop = 1 + 0.18 * Math.sin(Math.PI * ramp(f, 318, 323));
      setPill($("#pill7"), f, 282, f < 319 ? "Researching" : "Getting answers", swapPop * (1 - ei(ramp(f, 327, 332))), 700);
    }

    // ---------- S8 team chat ----------
    const AV = (bg, ini) => `<div class="bx" style="width:108px;height:108px;border-radius:50%;background:${bg};color:${darkText(bg) ? "#151515" : "#fff"};font:700 40px Inter;display:grid;place-items:center">${ini}</div>`;
    const MSG = (y, av, name, time, text) => `<div class="bx msg" style="left:0;top:${y}px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px">${av}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#f2f2f4">${name} <span style="font:400 30px Inter;color:#85858d;margin-left:10px">${time}</span></div>
        <div class="bx" style="left:717px;top:56px;font:400 40px Inter;color:#dcdce2">${text}</div></div>`;
    const MEN = (t) => `<span style="color:#7fb2ff">${t}</span>`;
    $("#msgs").innerHTML =
      MSG(20, AV(YELLOW, "AB"), "Ava Brooks", "12:22", `Quick reminder: ${MEN("@Noah")} should send the final deck today`) +
      MSG(185, AV(BLUE, "NK"), "Noah Kim", "12:24", `On it. I'll share the notes with ${MEN("@Mia")} and ${MEN("@Jon")} soon`) +
      MSG(350, AV(PINK, "ML"), "Mia Lopez", "12:45", `Great. I'll keep the thread open until ${MEN("@Noah")} shares the final draft`) +
      `<div class="bx msg" style="left:0;top:515px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px;width:108px;height:108px">${ICON.cal}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#f2f2f4">Calendar <span style="font:600 22px Inter;color:#b0b0b8;background:#26262b;border-radius:6px;padding:3px 8px;margin-left:8px;vertical-align:5px">APP</span> <span style="font:400 30px Inter;color:#85858d;margin-left:6px">12:59</span></div>
        <div class="bx" style="left:717px;top:56px;font:400 40px Inter;color:#dcdce2">Event starting in 30 seconds:</div>
        <div class="bx" style="left:717px;top:126px;width:6px;height:118px;border-radius:3px;background:${GREEN}"></div>
        <div class="bx" style="left:752px;top:126px;font:700 40px Inter;color:#7fb2ff">Launch sync</div>
        <div class="bx" style="left:752px;top:186px;font:400 40px Inter;color:#dcdce2">Today from 13:00 to 13:30</div></div>
      <div class="bx" id="m4" style="left:0;top:800px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px">${AV(PINK, "ML")}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#f2f2f4">Mia Lopez <span style="font:400 30px Inter;color:#85858d;margin-left:10px">13:33</span></div>
        <div class="bx" id="file8" style="left:717px;top:190px;width:900px;height:140px;border:2px solid #2e2e34;border-radius:18px;background:#18181b">
          <div class="bx" style="left:30px;top:34px;width:70px;height:70px">${ICON.doc}</div>
          <div class="bx" style="left:126px;top:24px;font:600 38px Inter;color:#fff">Launch plan v1</div>
          <div class="bx" style="left:126px;top:76px;font:400 30px Inter;color:#85858d">Last edited just now</div></div></div>`;
    const msgEls = $$(".msg");
    function renderS8(f) {
      whip(sc.s8, f, 352, 999, true, false);
      $("#msgs").style.transform = `translateY(${px(lerp(30, 0, eo(ramp(f, 349, 368))) - 300 * spr(f, 371, 8))})`;
      msgEls.forEach((el, i) => { const a = spr(f, 350 + i * 2, 7); el.style.transform = `translateY(${px(90 * (1 - a))})`; el.style.opacity = ramp(f, 350 + i * 2, 352 + i * 2).toFixed(3); });
      const m4 = $("#m4"), a4 = spr(f, 371, 7);
      m4.style.opacity = ramp(f, 371, 373).toFixed(3);
      m4.style.transform = `translateY(${px(120 * (1 - a4))})`;
      const fc = $("#file8");
      fc.style.opacity = ramp(f, 391, 392.5).toFixed(3);
      fc.style.transformOrigin = "0 100%";
      fc.style.transform = `translateY(${px(-60 * (1 - spr(f, 391, 7)))}) rotate(${(-8 * (1 - spr(f, 391, 8))).toFixed(2)}deg) scale(${sprB(f, 391, 6).toFixed(4)})`;
      setPill($("#pill8"), f, 354, "Drafting plan", 1 - ei(ramp(f, 395, 400)), 600);
      $("#cam8").style.transform = `scale(${lerp(1.0, 1.06, eio(ramp(f, 349, 422))).toFixed(4)}) rotate(${lerp(0.8, -0.8, eio(ramp(f, 349, 422))).toFixed(3)}deg)`;
    }

    // ---------- S9: dark mosaic; tools wire up to the hub; smash zoom; then a feed of briefs ----------
    const mos = $("#mos"), mctx = mos.getContext("2d");
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const octx = off.getContext("2d");
    const CS = 96, COLS = 20, ROWS = 12, cells = [];
    { const R = rng(77); for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) cells.push({ i, j, d: R(), t: R(), u: R(), c: Math.floor(R() * 4) }); }
    const PAL = [[BLUE, PURPLE], [GREEN, BLUE], [YELLOW, PINK], [PINK, PURPLE], [PURPLE, GREEN]];
    function paintBg(f) {
      const p = DAY_T.reduce((a, t) => a + ramp(f, t, t + 4), 0);
      const k = Math.min(4, Math.floor(p)), q = p - k, n = Math.min(4, k + 1);
      const pal = [0, 1].map((i) => mixHex(PAL[k][i], PAL[n][i], q));
      octx.fillStyle = "#050507";
      octx.fillRect(0, 0, W, H);
      [[380 + 240 * Math.sin(f * 0.05), 220 + 90 * Math.cos(f * 0.04), 820, pal[0], 0.55],
        [1620 - 220 * Math.sin(f * 0.045), 900, 860, pal[1], 0.5],
        [1150 + 160 * Math.cos(f * 0.05), 60, 600, PINK, 0.22],
        [520, 1040 - 90 * Math.sin(f * 0.05), 560, GREEN, 0.18]].forEach(([x, y, r, c, a]) => {
        const g = octx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, a));
        g.addColorStop(1, rgba(c, 0));
        octx.fillStyle = g;
        octx.fillRect(0, 0, W, H);
      });
      cells.forEach((c) => { octx.fillStyle = c.u < 0.55 ? `rgba(0,0,0,${(0.28 * c.t).toFixed(3)})` : rgba(BRAND[c.c], (0.09 * c.t).toFixed(3)); octx.fillRect(c.i * CS, c.j * CS, CS, CS); });
      octx.strokeStyle = "rgba(255,255,255,0.06)";
      octx.lineWidth = 2;
      octx.beginPath();
      for (let x = CS; x < W; x += CS) { octx.moveTo(x, 0); octx.lineTo(x, H); }
      for (let y = CS; y < H; y += CS) { octx.moveTo(0, y); octx.lineTo(W, y); }
      octx.stroke();
    }
    const tiles = $$(".tile"), hubDots = [...$("#hubDots").children], wires = $("#wires");
    wires.innerHTML = TOOLS.map((_, k) => `<line class="wire" stroke="${BRAND[k % 4]}" stroke-linecap="round" style="filter:drop-shadow(0 0 8px ${BRAND[k % 4]})"/><circle class="pulse" r="9" fill="#fff" style="filter:drop-shadow(0 0 10px ${BRAND[k % 4]})"/>`).join("");
    const wireEls = $$(".wire"), pulses = $$(".pulse"), fcards = $$(".fcard");
    const WIRE_T = (k) => 433 + k * 1.8;
    function renderS9(f) {
      paintBg(f);
      mctx.clearRect(0, 0, W, H);
      if (f >= 422) mctx.drawImage(off, 0, 0);
      else cells.forEach((c) => {
        const t = 404 + 13 * (0.55 * c.d + 0.27 * (1 - c.i / COLS) + 0.18 * (c.j / ROWS));
        const a = eo(ramp(f, t, t + 3));
        if (a <= 0) return;
        const z = CS * a, o = (CS - z) / 2;
        mctx.drawImage(off, c.i * CS, c.j * CS, CS, CS, c.i * CS + o, c.j * CS + o, z, z);
      });

      // hub: dots pop, tiles swirl in on springs, wires snap in with a flash, pulses run; then a smash zoom into the hub
      const hubOn = f >= 418 && f < 467;
      const hub = $("#hub");
      vis(hub, hubOn);
      if (hubOn) {
        const smash = ei(ramp(f, 461, 467));
        hub.style.transform = `scale(${(lerp(0.92, 1.1, eio(ramp(f, 418, 461))) * lerp(1, 6, smash)).toFixed(4)}) rotate(${lerp(-8, 4, eio(ramp(f, 418, 466))).toFixed(3)}deg)`;
        hub.style.filter = blurOf(20 * smash);
        hub.style.opacity = (1 - ramp(f, 465, 467)).toFixed(3);
        const kick = (i) => TOOLS.reduce((a, _, k) => a + 0.35 * Math.exp(-Math.max(0, f - WIRE_T(k) - 8) / 3) * (f >= WIRE_T(k) + 8 ? 1 : 0), 0);
        hubDots.forEach((d, i) => {
          const r = 30 * sprB(f, 419 + i, 5) * (1 + kick(i) * 0.4);
          const x = 960 + (i % 2 ? 40 : -40), y = 540 + (i < 2 ? -40 : 40);
          d.style.width = d.style.height = px(2 * r);
          d.style.transform = `translate(${px(x - r)}, ${px(y - r)})`;
        });
        tiles.forEach((el, k) => {
          const ang = ((-90 + k * 60) * Math.PI) / 180, t = 423 + k * 2, a = spr(f, t, 9);
          const rx = lerp(1700, 560, a), ry = lerp(1700, 330, a), sw = (1 - clamp(a, 0, 1)) * 1.4;
          const x = 960 + rx * Math.cos(ang + sw), y = 540 + ry * Math.sin(ang + sw);
          el.style.transform = `translate(${px(x - 70)}, ${px(y - 70)}) rotate(${(-70 * (1 - a)).toFixed(2)}deg) scale(${lerp(0.4, 1, clamp(sprB(f, t, 8), 0, 1.3)).toFixed(4)})`;
          el.style.opacity = ramp(f, t, t + 1.5).toFixed(3);
          const fx = 960 + 560 * Math.cos(ang), fy = 540 + 330 * Math.sin(ang);
          const D = Math.hypot(fx - 960, fy - 540), ux = (960 - fx) / D, uy = (540 - fy) / D;
          const sx = fx + ux * 90, sy = fy + uy * 90, ex = 960 - ux * 70, ey = 540 - uy * 70;
          const w = wireEls[k];
          w.setAttribute("x1", sx.toFixed(1)); w.setAttribute("y1", sy.toFixed(1)); w.setAttribute("x2", ex.toFixed(1)); w.setAttribute("y2", ey.toFixed(1));
          const dl = Math.hypot(ex - sx, ey - sy), tw = WIRE_T(k), dr = eio(ramp(f, tw, tw + 6));
          w.setAttribute("stroke-dasharray", `${dl.toFixed(1)} ${dl.toFixed(1)}`);
          w.setAttribute("stroke-dashoffset", (dl * (1 - dr)).toFixed(1));
          w.setAttribute("stroke-width", (4 + 10 * Math.exp(-Math.max(0, f - tw - 6) / 2) * (f >= tw + 6 ? 1 : 0)).toFixed(2));
          w.style.opacity = dr > 0 ? 0.9 : 0;
          const pp = ((((f - tw - 6) / 9) % 1) + 1) % 1;
          pulses[k].setAttribute("cx", lerp(sx, ex, pp).toFixed(1));
          pulses[k].setAttribute("cy", lerp(sy, ey, pp).toFixed(1));
          pulses[k].style.opacity = f >= tw + 6 ? Math.sin(Math.PI * pp).toFixed(3) : 0;
        });
      }

      // feed: comes out of the smash zoom, tilted; snaps one day up on every beat, then whips away
      const feed = $("#feed"), feedOn = f >= 466;
      vis(feed, feedOn);
      if (!feedOn) return;
      const kd = DAY_T.reduce((a, t) => a + spr(f, t, 6), 0);
      const out = -1300 * ei(ramp(f, 503, 509));
      feed.style.transformOrigin = "960px 540px";
      feed.style.transform = `translateY(${px(out)}) perspective(1800px) rotateX(${lerp(22, 12, ramp(f, 466, 509)).toFixed(2)}deg) rotateZ(${lerp(-7, -3, ramp(f, 466, 509)).toFixed(2)}deg) scale(${lerp(2.6, 1, spr(f, 466, 9)).toFixed(4)})`;
      feed.style.filter = blurOf(16 * (1 - eo(ramp(f, 466, 470))) + Math.abs(out - -1300 * ei(ramp(f - 1, 503, 509))) * 0.05);
      fcards.forEach((el, i) => {
        const d = i - kd, ad = Math.min(Math.abs(d), 1.5);
        el.style.transform = `translate(${px(310)}, ${px(260 + d * 640)}) scale(${(1 - 0.1 * ad).toFixed(4)})`;
        el.style.opacity = (1 - 0.55 * Math.min(ad, 1)).toFixed(3);
      });
    }

    // ---------- S10: "One Dot. Less busywork." ----------
    const tagEls = $$(".tag"), b10 = $$(".b10"), ch10 = $("#ch10");
    const F10 = `700 150px ${UI}`;
    const T10 = [511, 517, 541, 546];
    function renderS10(f) {
      orb10(f);
      driveChars(ch10, f, 506, 0, ["blue"], [541]);
      // arrives from below
      const inY = 1100 * (1 - eo(ramp(f, 503, 509))), outY = 1200 * ei(ramp(f, 566, 571));
      const vy = inY + outY - (1100 * (1 - eo(ramp(f - 1, 503, 509))) + 1200 * ei(ramp(f - 1, 566, 571)));
      const hits = [...T10.map((t) => [t + 2.5, 12]), [515, 6], [550, 7]];
      sc.s10.style.transform = `translate(${px(hits.reduce((a, [t, m]) => a + shk(f, t, m), 0))}, ${px(inY + outY + hits.reduce((a, [t, m]) => a + shk(f, t, m * 0.7, 1), 0))})`;
      $("#one").style.filter = blurOf(Math.abs(vy) * 0.05);
      const words = ["One ", "Dot.", "Less ", "busywork."];
      const x1 = 960 - (measure(words[0], F10) + measure(words[1], F10)) / 2, x2 = 960 - (measure(words[2], F10) + measure(words[3], F10)) / 2;
      b10.forEach((el, i) => {
        const t = T10[i], first = i < 2;
        const outk = first ? ei(ramp(f, 537, 541)) : 0;
        const x = first ? x1 + (i === 1 ? measure(words[0], F10) : 0) : x2 + (i === 3 ? measure(words[2], F10) : 0);
        const k = keys(f, rel(t, SLAM_S)), q = keys(f, rel(t, SLAM_Q));
        el.style.display = f >= t && outk < 1 ? "block" : "none";
        el.style.opacity = ramp(f, t, t + 1).toFixed(3);
        el.style.transformOrigin = "50% 80%";
        el.style.transform = `translate(${px(x)}, ${px(300 - 260 * outk)}) rotate(${(first ? -14 * outk : 0).toFixed(2)}deg) scale(${(k / Math.sqrt(q) * (1 - 0.3 * outk)).toFixed(4)}, ${(k * q * (1 - 0.3 * outk)).toFixed(4)})`;
        el.style.filter = blurOf(keys(f, rel(t, SLAM_B)) + 16 * outk);
        if (i !== 1) el.style.color = "#fff";
      });
      // busywork tags fly in from the edges, float, then get swept out as the dot hops
      tagEls.forEach((el, i) => {
        const [, c, x, y] = TAGS[i], tin = 512 + i * 2, tout = 543 + i * 1.3;
        const cx = x + 180, cy = y + 42, dx = cx - 960, dy = cy - 640, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl;
        const a = spr(f, tin, 8), o = ei(ramp(f, tout, tout + 7));
        const px0 = x + ux * 900 * (1 - a) + ux * 1900 * o, py0 = y + uy * 900 * (1 - a) + uy * 1900 * o + 10 * Math.sin(f * 0.12 + i);
        el.style.display = f >= tin && o < 1 ? "flex" : "none";
        el.style.transform = `translate(${px(px0)}, ${px(py0)}) rotate(${(ux * 30 * (1 - a) + ux * 50 * o).toFixed(2)}deg) scale(${lerp(0.6, 1, clamp(a, 0, 1.2)).toFixed(4)})`;
        el.style.filter = blurOf(14 * o);
        el.style.borderColor = mix("#2a2a2f", c, ramp(f, tout - 3, tout));
      });
    }

    // ---------- S11/S12: "You focus on what's next." → coloured dots → "OpenAI dots" end card ----------
    const t11 = $$(".t11"), tcur = $("#tcur"), wm12 = $$(".wm12"), r12 = $$(".r12"), ch12 = $("#ch12"), oai = $$(".oai");
    const F11 = `600 78px ${UI}`, FO = `500 50px ${UI}`;
    const TT = [];
    { let t = 573; TAG.split("").forEach((c) => { TT.push(t); t += c === " " ? 2.6 : 1.8; }); }
    const T11_DONE = TT[TT.length - 1];
    const SQ = [];
    {
      const R = rng(404);
      let n = 0;
      TAG.split("").forEach((c, li) => {
        if (c === " ") return;
        // the first ten cover every letter of "dots" (0–3) and "OpenAI" (4–9) once; the rest pile into "dots"
        const tgt = n < 10 ? (n * 7) % 10 : Math.floor(R() * 4);
        n++;
        const ang = R() * Math.PI * 2;
        SQ.push({ li, tgt, col: BRAND[Math.floor(R() * 4)], size: 16 + R() * 14, tb: 627 + R() * 3, tm: 632 + R() * 2, dur: 7 + R() * 3, jx: Math.cos(ang) * (120 + R() * 220), jy: Math.sin(ang) * (90 + R() * 160), ox: (R() - 0.5) * 60, oy: (R() - 0.5) * 80 });
      });
    }
    const sqs = $("#sqs");
    sqs.innerHTML = SQ.map((q) => `<i class="sq" style="background:${q.col};box-shadow:0 0 16px ${rgba(q.col, 0.8)}"></i>`).join("");
    const arrive = Array(10).fill(1e9);
    SQ.forEach((q) => (arrive[q.tgt] = Math.min(arrive[q.tgt], q.tm + q.dur)));
    function renderS11(f) {
      orb11(f);
      const tw = (n) => measure(TAG.slice(0, n), F11);
      const nTyped = TT.filter((t) => t <= f).length, left = 960 - tw(nTyped) / 2;
      t11.forEach((el, i) => {
        const q = SQ.find((s) => s.li === i), on = TT[i] <= f && !(q && f >= q.tb);
        el.style.display = on ? "block" : "none";
        if (!on) return;
        el.style.font = F11;
        el.style.color = "#fff";
        el.style.transformOrigin = "50% 80%";
        el.style.transform = `translate(${px(left + tw(i))}, ${px(540 - 47 - 18 * (1 - spr(f, TT[i], 4)))}) scale(${lerp(1.5, 1, spr(f, TT[i], 4)).toFixed(4)})`;
        el.style.opacity = ramp(f, TT[i], TT[i] + 1).toFixed(3);
      });
      const blink = f < T11_DONE + 2 || Math.floor((f - T11_DONE) / 8) % 2 === 0;
      tcur.style.display = f >= 571 && f < 627 && blink ? "block" : "none";
      tcur.style.transform = `translate(${px(left + tw(nTyped) + 6)}, ${px(540 - 40)})`;
      // the line gets a slow push while it types
      $("#tagL").style.transformOrigin = "960px 540px";
      $("#tagL").style.transform = `scale(${lerp(0.94, 1.06, eio(ramp(f, 570, 627))).toFixed(4)})`;

      // end card: the dots explode outward, then whip in and slam into the letters
      const slots = wmLetters(960, 430);
      const ow = measure("OpenAI", FO), ol = 960 - ow / 2;
      const oslot = (j) => ({ cx: ol + measure("OpenAI".slice(0, j), FO) + measure("OpenAI"[j], FO) / 2, cy: 215 });
      const fullLeft = 960 - tw(TAG.length) / 2 * 1.06;
      [...sqs.children].forEach((el, n) => {
        const q = SQ[n], lw = measure(TAG[q.li], F11);
        const sx = 960 + (fullLeft - 960 + tw(q.li) * 1.06 + (lw * 1.06) / 2), sy = 540;
        const big = q.tgt < 4, tg = big ? slots[q.tgt] : oslot(q.tgt - 4);
        const tx = tg.cx + (big ? q.ox : q.ox * 0.2), ty = tg.cy + (big ? q.oy : q.oy * 0.15);
        const ta = q.tm + q.dur;
        const pos = (g) => { const h = eo(ramp(g, q.tb, q.tm + 1)), m = ei(ramp(g, q.tm, ta)); return [lerp(sx + q.jx * h, tx, m), lerp(sy + q.jy * h, ty, m)]; };
        const on = f >= q.tb && f < ta;
        el.style.display = on ? "block" : "none";
        if (!on) return;
        const [x, y] = pos(f), [x0, y0] = pos(f - 0.6);
        const v = Math.hypot(x - x0, y - y0), st = 1 + Math.min(v / 16, 2.5);
        const size = q.size * sprB(f, q.tb, 3);
        el.style.width = el.style.height = px(Math.max(0, size));
        el.style.transform = `translate(${px(x - size / 2)}, ${px(y - size / 2)}) rotate(${Math.atan2(y - y0, x - x0).toFixed(3)}rad) scale(${st.toFixed(3)}, ${(1 / Math.sqrt(st)).toFixed(3)})`;
      });
      wm12.forEach((el, i) => slamWM(el, r12[i], slots[i], 1, f, arrive[i]));
      oai.forEach((el, j) => {
        const t = arrive[4 + j], sl = oslot(j), w = measure("OpenAI"[j], FO);
        el.style.display = f >= t ? "block" : "none";
        el.style.font = FO;
        el.style.color = "#d8d8de";
        el.style.transformOrigin = "50% 70%";
        el.style.transform = `translate(${px(sl.cx - w / 2)}, ${px(185 - 30 * (1 - spr(f, t, 5)))}) scale(${sprB(f, t, 5).toFixed(4)})`;
      });
      driveChars(ch12, f, 642, 3);
      const hits = [...arrive.slice(0, 4).map((t) => [t + 2.5, 9]), ...landings(642, 3, 4).map((t) => [t, 6])];
      $("#endG").style.transform = `translate(${px(hits.reduce((a, [t, m]) => a + shk(f, t, m), 0))}, ${px(hits.reduce((a, [t, m]) => a + shk(f, t, m * 0.8, 1.1), 0))}) scale(${(1 + 0.035 * eio(ramp(f, 648, 700))).toFixed(4)})`;
    }

    // ---------- frame ----------
    function render(t) {
      const f = clamp(t, 0, FRAMES - 0.001);
      const on = { s1: f < 57, s2: f >= 56 && f < 103, s3: f >= 103 && f < 163, s4: f >= 159 && f < 214, s5: f >= 205 && f < 240, s6: f >= 237 && f < 280,
        s7: f >= 277 && f < 352, s8: f >= 349 && f < 423, s9: f >= 404 && f < 509, s10: f >= 503 && f < 571, s11: f >= 568 };
      Object.keys(on).forEach((k) => vis(sc[k], on[k]));
      if (f < 205 || f >= 214) $("#wipe").style.display = "none";
      if (on.s1) renderS1(f);
      if (on.s2) renderS2(f);
      if (on.s3) renderS3(f);
      if (on.s4) renderS4(f);
      if (on.s5) renderS5(f);
      if (on.s6) renderS6(f);
      if (on.s7) renderS7(f);
      if (on.s8) renderS8(f);
      if (on.s9) renderS9(f);
      if (on.s10) renderS10(f);
      if (on.s11) renderS11(f);
      renderDots(f);
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v + SUB); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { mcache = {}; render(R0._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
