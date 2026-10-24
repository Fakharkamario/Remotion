// dots — 23.3 s promo, 30 fps, 700 frames, cut to the voiceover in assets/voiceover.mp3.
// Motion language follows the reference edit (kinetic type, a self-scrolling stack, a smash zoom onto a prompt,
// fast app-UI cuts with a status pill, a pixel dissolve, rolling cards, a line that breaks apart and rebuilds the
// end card); the shots themselves are written for this script and dressed in the dots brand: black, the glowing
// blue/green/yellow/pink wordmark and the four felt characters.
//   0–56     "What if your AI could do the work,"      big coloured letters fly into "What", the line builds
//   56–103   "not just talk about it?"                  a stack of chatty AI replies scrolls up, then pops into four dots
//   103–162  "Meet your new AI teammate."               the dots become the glowing "dots" wordmark; the characters pop up
//   162–214  "Find what matters…"                       a prompt types with tool chips; smash zoom, send
//   214–240  "…in your inbox"                           mail, "Finding what matters"
//   240–280  "Keep your day organized."                 calendar, "Organizing your day"
//   280–352  "Research anything. Get the answers."      research, "Researching" → "Getting answers"
//   352–422  "Turn ideas into actual work."             team chat, "Drafting plan", a doc lands; pixel dissolve
//   404–466  "Connect your tools."                      six tool tiles fly in and wire up to the dots hub
//   466–505  "Keep everything moving"                   close-up of the Daily brief as the days roll Mon → Fri
//   505–570  "One Dot. Less busywork."                  the blue dot pops up; busywork tags around it pop away
//   570–700  "You focus on what's next. OpenAI Dots."   the line types, bursts into coloured dots that rebuild the end card
(function () {
  const FPS = 30, FRAMES = 700, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = (t, s = 1.70158) => (t = clamp(t, 0, 1) - 1, 1 + (s + 1) * t * t * t + s * t * t);
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
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const px = (v) => v.toFixed(2) + "px";
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");

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
    arrow: '<svg viewBox="0 0 24 24"><path d="M12 20V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
  const charMarkup = (names) => names.map((k) => `<g class="ch" data-k="${k}"><g filter="url(#fur)">${CH[k].body}</g>${CH[k].face}${CH[k].hat ? `<g filter="url(#fur)">${CH[k].hat}</g>` : ""}</g>`).join("");

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

    // ---------- faint orbit backdrop with drifting coloured dots ----------
    const LABELS = ["Inbox", "Calendar", "Notes", "Tasks", "Docs", "Messages", "Research", "Drive"];
    function makeOrbits(host, cfg) {
      const R = rng(cfg.seed);
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
      cfg.sys.forEach((y) => y.r.forEach((r) => (s += `<circle cx="${y.cx}" cy="${y.cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.035)" stroke-width="2"/>`)));
      (cfg.lines || []).forEach((l) => (s += `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="rgba(255,255,255,0.035)" stroke-width="2"/>`));
      host.innerHTML = s + "</svg>";
      const nodes = [];
      cfg.sys.forEach((y) => y.r.forEach((r) => {
        for (let k = 0; k < (cfg.per || 2); k++) {
          const el = document.createElement("div");
          el.className = "onode";
          const size = 7 + R() * 9, col = R() < 0.6 ? BRAND[Math.floor(R() * 4)] : "#3a3a3e";
          const lab = R() < 0.5 ? `<span style="color:#2e2e33">${LABELS[Math.floor(R() * LABELS.length)]}</span>` : "";
          el.innerHTML = `<i style="width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;background:${col}"></i>${lab}`;
          host.appendChild(el);
          nodes.push({ el, y, r, a0: R() * 360, sp: (R() < 0.5 ? -1 : 1) * (0.2 + R() * 0.3) * (cfg.speed || 1), op: 0.3 + R() * 0.35 });
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
    const wmLetters = (cx, cy, s = 1) => {
      const tw = measure("dots", FWM) * s, left = cx - tw / 2;
      return "dots".split("").map((c, i) => {
        const x0 = left + measure("dots".slice(0, i), FWM) * s, w = measure(c, FWM) * s;
        return { x: x0, w, cx: x0 + w / 2, cy };
      });
    };
    // a letter of the wordmark at its slot; k = 0..1 appearance (it scales up out of a blur)
    function placeWM(el, slot, s, k) {
      el.style.display = k > 0.001 ? "block" : "none";
      el.style.transform = `translate(${px(slot.cx - slot.w / s / 2)}, ${px(slot.cy - 165)}) scale(${(s * lerp(0.35, 1, back(k, 1.8))).toFixed(4)})`;
      el.style.opacity = clamp(k * 2, 0, 1).toFixed(3);
      el.style.filter = `blur(${(1.1 + 16 * (1 - eo(k))).toFixed(2)}px)`;
    }

    // ---------- characters ----------
    // each pops up from below the frame with a springy landing, bobs, and blinks now and then
    function driveChars(svg, f, t0, gaps = 3, order = ["blue", "green", "yellow", "pink"]) {
      svg.querySelectorAll(".ch").forEach((g) => {
        const k = g.dataset.k, i = order.indexOf(k), t = t0 + i * gaps, c = CH[k];
        const a = ramp(f, t, t + 9);
        const dy = 560 * (1 - back(a, 1.5)) + (a >= 1 ? 7 * Math.sin((f - t - 9) * 0.11 + i * 1.7) - 7 * Math.sin(i * 1.7) : 0);
        const land = ramp(f, t + 5, t + 13), sq = 0.07 * Math.sin(Math.PI * land) * (1 - land * 0.4);
        g.setAttribute("transform", `translate(0 ${dy.toFixed(2)}) translate(${c.cx} 1080) scale(${(1 + sq).toFixed(4)} ${(1 - sq).toFixed(4)}) translate(${-c.cx} -1080)`);
        g.style.display = f >= t ? "" : "none";
        const eyes = g.querySelector(".eyes");
        if (eyes && (k === "blue" || k === "green")) {
          const ph = (f + i * 23) % 70, bl = ph < 4 ? 1 - Math.sin((Math.PI * ph) / 4) * 0.92 : 1;
          const [ex, ey] = eyes.dataset.c.split(" ").map(Number);
          eyes.setAttribute("transform", `translate(${ex} ${ey}) scale(1 ${bl.toFixed(3)}) translate(${-ex} ${-ey})`);
        }
        const pup = g.querySelector(".pup");
        if (pup) pup.setAttribute("transform", `translate(${(5 * Math.sin(f * 0.07)).toFixed(2)} ${(2 * Math.cos(f * 0.09)).toFixed(2)})`);
      });
    }

    // ---------- DOM ----------
    const S1W = ["What", "if", "your", "AI", "could", "do", "the", "work,"];
    const BUBS = ["Great question! Let me explain…", "Here's a 12-step plan you could try", "You might want to consider…", "In summary, it depends", "Have you tried doing it yourself?", "Happy to talk it through!", "Let me know if you need more tips", "Want me to explain again?"];
    const MAIL = [["Maya Chen", "Q3 numbers are in - Final figures attached for your review"], ["Support", "Ticket #20418 was updated - A new reply is waiting"],
      ["Northwind Studio", "Contract renewal, next steps - Attaching the draft"], ["Leo Park", "Feedback on the deck - Two quick notes on slide 4"],
      ["Calendar", "Reminder: Design review at 11:00 - Room 4B"], ["Priya Nair", "Standup notes, Tuesday - Quick recap since Monday"],
      ["Harbor Bank", "Your monthly statement is ready - View it online"], ["Sam Ortiz", "Re: launch plan - Approved on our side, go ahead"]];
    const SIDE = [["Starred", 339], ["Snoozed", 426], ["Sent", 510], ["Drafts", 597], ["Purchases", 681], ["More", 768]];
    const EVT = [ // [x, y, w, h, title, time, colour ("O" prefix = outlined), appear]
      [-60, 300, 462, 270, "Weekly report", "8:30am", BLUE, 240], [-60, 660, 462, 120, "Submit timesheet", "", GREEN, 250], [-60, 795, 462, 180, "Dinner with family", "", "O" + PINK, 266],
      [441, 234, 1038, 147, "Team standup", "9:00am", BLUE, 240], [441, 396, 1038, 147, "Focus time", "10:00am", PURPLE, 245], [441, 558, 1038, 396, "Client review", "11:30am", YELLOW, 248],
      [1515, 231, 460, 225, "Design sync", "9:00am", "O" + BLUE, 258], [1515, 609, 460, 261, "Send invoices", "1:00pm", PINK, 262],
    ];
    const darkText = (c) => c === GREEN || c === YELLOW;
    const SOURCES = [[BLUE, "workplace.report", "How teams use AI agents in 2026"], [PINK, "hbr-notes.com", "From chat to action: the agent shift"],
      [GREEN, "teamstudy.org", "Survey: where busywork goes"], [YELLOW, "futureofwork.io", "Agents that do the work"]];
    const ANSWER = ["Teams are moving from chat to action. Most now use", "agents to triage email, plan schedules and draft first", "versions of docs [1][2]. The biggest win is hours", "handed back for focused work [3]."];
    const TOOLS = [["mail", "Mail"], ["cal", "Calendar"], ["docs", "Docs"], ["chat", "Chat"], ["folder", "Drive"], ["notes", "Notes"]];
    const DAYS = [
      { wd: "Mon", d: "26", b1: "Three emails need you today, starting with the client reply at 9:30. You're free after 3 for focused work." },
      { wd: "Tue", d: "27", b1: "Light day today. Two client replies are drafted and waiting for your OK before noon." },
      { wd: "Wed", d: "28", b1: "Two deadlines today: the launch deck and the Q3 report. Both first drafts are ready." },
      { wd: "Thu", d: "29", b1: "Quiet morning. Your inbox is sorted and three clear hours are blocked for the big idea." },
      { wd: "Fri", d: "30", b1: "Inbox zero by nine. The weekly recap is written and Monday's sync is already booked." },
    ];
    const DAY_T = [474, 482, 490, 498];
    const TAGS = [["214 unread", BLUE, 240, 190], ["Reply all", PINK, 1450, 170], ["Status update", YELLOW, 120, 520], ["Reformat the deck", GREEN, 1400, 540], ["Find that file", PURPLE, 210, 830], ["Schedule a call", BLUE, 1420, 860]];
    const TAG = "You focus on what's next.";

    const pillHTML = (id) => `<div class="pill" id="${id}"><span class="spin">${BRAND.map((c, i) => `<i style="left:${i * 24}px;background:${c}"></i>`).join("")}</span><span class="pt"></span></div>`;

    stage.innerHTML = `
      <div id="s1" class="scene grain"><div class="orb" id="orb1"></div><div id="s1line" class="layer">${S1W.map((w, i) => `<span class="abs w1${i === 3 ? " grad" : ""}">${w}</span>`).join("")}</div>
        <div class="layer">${"What".split("").map((c) => `<span class="abs l1">${c}</span>`).join("")}</div></div>
      <div id="s2" class="scene grain"><div class="orb" id="orb2"></div>${BUBS.map((t) => `<div class="bub">${t}</div>`).join("")}</div>
      <div id="s3" class="scene grain"><div class="orb" id="orb3"></div><div id="g3" class="layer">${wmHTML("wm3")}</div>
        <svg class="chars" id="ch3" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${charMarkup(CH_ORDER)}</svg></div>
      <div id="dotsL" class="layer" style="display:none">${BRAND.map((c) => `<i class="abs" style="border-radius:50%;background:${c};box-shadow:0 0 30px ${rgba(c, 0.8)}"></i>`).join("")}</div>
      <div id="s4" class="scene grain"><div class="orb" id="orb4"></div>
        <div id="cam4"><div id="pIcons"></div>
          <div id="prompt"><div id="ptext"></div>
            <div id="pctl"><span class="plus">+</span><div class="rt"><span class="model">Dots 1</span>${ICON.mic}<div id="send"><div id="ring"></div>${ICON.arrow}</div></div></div></div></div></div>
      <div id="s5" class="scene ui" style="background:#121214"><div class="cam" id="cam5">
          <div class="bx" style="left:0;top:0;width:490px;height:1080px;background:#0b0b0d"></div>
          <div class="bx" style="left:-40px;top:52px;width:274px;height:106px;border-radius:32px;background:${BLUE}"></div>
          <div class="bx" style="left:20px;top:82px;font:600 38px Inter;color:#fff">Compose</div>
          <div class="bx" style="left:-40px;top:216px;width:496px;height:78px;border-radius:39px;background:rgba(20,119,240,.22)"></div>
          <div class="bx" style="left:-12px;top:232px;font:700 34px Inter;color:#fff">Inbox</div>
          <div class="bx" id="inboxN" style="left:360px;top:236px;width:70px;text-align:right;font:700 28px Inter;color:#fff">68</div>
          ${SIDE.map(([t, y]) => `<div class="bx" style="left:-12px;top:${y - 20}px;font:400 34px Inter;color:#b9b9c0">${t}</div>`).join("")}
          <div class="bx" style="left:360px;top:665px;width:70px;text-align:right;font:500 26px Inter;color:#8a8a92">11</div>
          <div class="bx" style="left:535px;top:37px;width:34px;height:34px;border:3px solid #8e8e96;border-radius:6px"></div>
          <div class="bx" style="left:631px;top:34px;width:40px;height:40px">${ICON.refresh}</div>
          <div class="bx" style="left:733px;top:34px;width:40px;height:40px">${ICON.dots}</div>
          ${MAIL.map(([a, b], i) => `<div class="bx mrow" style="left:490px;top:${114 + i * 120}px;width:1430px;height:120px;border-top:2px solid #212125">
              <div class="bx" style="left:53px;top:43px;width:30px;height:30px;border:2.5px solid #4a4a52;border-radius:5px"></div>
              <div class="bx" style="left:133px;top:40px;width:38px;height:38px">${ICON.star}</div>
              <div class="bx" style="left:227px;top:36px;font:600 40px Inter;color:#f2f2f4">${a}</div>
              <div class="bx" style="left:635px;top:36px;font:400 40px Inter;color:#9a9aa2">${b}</div></div>`).join("")}
        </div>${pillHTML("pill5")}</div>
      <div id="s6" class="scene ui" style="background:#0e0e10"><div class="cam" id="cam6">
          <div class="bx" style="left:426px;top:-200px;width:2px;height:1500px;background:#26262b"></div>
          <div class="bx" style="left:1491px;top:-200px;width:2px;height:1500px;background:#26262b"></div>
          <div class="bx" style="left:-10px;top:192px;width:1940px;height:2px;background:#26262b"></div>
          <div class="bx" style="left:871px;top:-23px;width:178px;height:178px;border-radius:50%;background:${BLUE};color:#fff;font:500 88px Inter;display:grid;place-items:center">24</div>
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
          <div class="bx" style="left:0;top:0;width:498px;height:1080px;background:#1a1226"></div>
          ${[["ouncements", 165], ["nch-team", 354], ["ssages", 459], ["ntions & you", 576], ["n, Jon Patel ...", 660], ["mates", 756], ["alendar", 966]].map(([t, y], i) => `<div class="bx" style="left:-6px;top:${y - 24}px;font:${i === 1 ? 700 : 400} 40px Inter;color:${i === 1 ? "#fff" : "rgba(255,255,255,.62)"}">${t}</div>`).join("")}
          <div class="bx" style="left:540px;top:878px;width:1440px;height:260px;border-radius:18px;border:2px solid #2e2e34;background:#17171a"></div>
          <div class="bx" style="left:582px;top:910px;font:400 38px Inter;color:#7a7a82">Message #launch-team</div>
        </div>${pillHTML("pill8")}</div>
      <div id="s9" class="scene"><canvas id="mos" width="${W}" height="${H}"></canvas>
        <div id="hub"><svg id="wires" width="${W}" height="${H}" style="position:absolute;left:0;top:0"></svg>
          <div id="hubDots" class="layer">${BRAND.map((c) => `<i class="abs" style="border-radius:50%;background:${c};box-shadow:0 0 36px ${rgba(c, 0.9)}"></i>`).join("")}</div>
          ${TOOLS.map(([k, n]) => `<div class="tile">${ICON[k]}<b>${n}</b></div>`).join("")}</div>
        <div id="cam9"><div id="card">
            <div class="date"><span id="wd"></span><span>Oct </span><span id="dg"></span></div>
            <div class="ttl">Daily brief</div><div class="rule"></div>
            <div class="body" id="b1" style="top:244px"></div></div></div></div>
      <div id="s10" class="scene grain"><div class="orb" id="orb10"></div>
        ${TAGS.map(([t, c]) => `<div class="tag"><i style="background:${c}"></i>${t}</div>`).join("")}
        <div id="one" class="layer"><span class="big b10">One </span><span class="big b10 grad">Dot.</span><span class="big b10 grad">Less </span><span class="big b10">busywork.</span></div>
        <svg class="chars" id="ch10" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g transform="translate(960 1080) scale(1.32) translate(-615 -1080)">${charMarkup(["blue"])}</g></svg></div>
      <div id="s11" class="scene grain"><div class="orb" id="orb11"></div>
        <div id="tagL" class="layer">${TAG.split("").map((c) => `<span class="abs t11">${c}</span>`).join("")}<div id="tcur"></div></div>
        <div id="endG" class="layer" style="transform-origin:960px 540px"><span class="abs" id="oai">OpenAI</span>${wmHTML("wm12")}<div id="sqs"></div>
          <svg class="chars" id="ch12" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${charMarkup(CH_ORDER)}</svg></div></div>
    `;
    stage.appendChild(meas);

    const sc = {}; ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"].forEach((k) => (sc[k] = $("#" + k)));
    const orb1 = makeOrbits($("#orb1"), { seed: 11, sys: [{ cx: 640, cy: 760, r: [170, 270, 400] }, { cx: 1500, cy: 260, r: [200, 330] }, { cx: 1180, cy: 1000, r: [240] }] });
    const orb2 = makeOrbits($("#orb2"), { seed: 5, per: 1, sys: [{ cx: 1500, cy: 620, r: [260, 420] }] });
    const orb3 = makeOrbits($("#orb3"), { seed: 9, per: 2, sys: [{ cx: 960, cy: 420, r: [460, 640] }] });
    const orb4 = makeOrbits($("#orb4"), { seed: 21, speed: 1.6, sys: [{ cx: 1450, cy: 330, r: [330, 520, 720] }, { cx: 330, cy: 940, r: [260, 430] }],
      lines: [[1250, 0, 1700, 260], [380, 1080, 760, 640], [1640, 620, 1920, 560], [0, 380, 300, 520]] });
    const orb10 = makeOrbits($("#orb10"), { seed: 17, per: 1, sys: [{ cx: 960, cy: 520, r: [520, 700] }] });
    const orb11 = makeOrbits($("#orb11"), { seed: 31, per: 2, sys: [{ cx: 960, cy: 540, r: [300, 470, 650] }, { cx: 260, cy: 180, r: [240] }, { cx: 1700, cy: 900, r: [280] }] });

    // ---------- S1: "What if your AI could do the work," ----------
    const w1 = $$(".w1"), l1 = $$(".l1");
    const F1 = `600 62px ${UI}`;
    const W1_IN = [0, 27, 29, 32, 35.5, 38, 40, 43];
    const L1_POS = [[300, 190], [1490, 150], [1300, 360], [700, 860]], L1_IN = [0, 4, 7, 11], L1_GO = [15, 16.5, 18, 19.5], L1_BIG = 3.2;
    function renderS1(f) {
      orb1(f);
      const sp = measure(" ", F1), ws = S1W.map((w) => measure(w, F1));
      const con = ws.map((w, i) => (i === 0 ? w : (sp + w) * eo(ramp(f, W1_IN[i], W1_IN[i] + 5))));
      const left = 960 - con.reduce((a, b) => a + b, 0) / 2;
      const line = $("#s1line");
      line.style.transformOrigin = "960px 540px";
      line.style.transform = `scale(${(1 + 0.04 * eo(ramp(f, 27, 56))).toFixed(4)})`;
      let x = left;
      w1.forEach((el, i) => {
        const xi = i === 0 ? x : x + sp;
        x += con[i];
        const a = i === 0 ? (f >= 27 ? 1 : 0) : ramp(f, W1_IN[i], W1_IN[i] + 3);
        const k = eo(ramp(f, W1_IN[i], W1_IN[i] + 4));
        el.style.opacity = a.toFixed(3);
        el.style.font = F1;
        if (i !== 3) { el.style.color = "#f4f4f6"; el.style.textShadow = "0 0 18px rgba(255,255,255,.25)"; }
        el.style.filter = i === 0 ? "none" : blurOf(5 * (1 - k));
        el.style.transform = `translate(${px(xi)}, ${px(509 + (i === 0 ? 0 : 14 * (1 - k)))})`;
      });
      // big letters: pop in, scattered and coloured, then fly into "What"
      const lineLeft = 960 - ws[0] / 2;
      l1.forEach((el, k) => {
        const on = f >= L1_IN[k] && f < 27;
        vis(el, on);
        if (!on) return;
        const lw = measure("What"[k], F1), off = measure("What".slice(0, k), F1);
        const t = eio(ramp(f, L1_GO[k], L1_GO[k] + 7));
        const drift = Math.min(f - L1_IN[k], 15);
        const cx = lerp(L1_POS[k][0] + drift * 0.8, lineLeft + off + lw / 2, t), cy = lerp(L1_POS[k][1] - drift * 0.5, 540, t);
        const s = lerp(L1_BIG * lerp(0.7, 1, back(ramp(f, L1_IN[k], L1_IN[k] + 3), 2)), 1, t);
        const c = BRAND[k];
        el.style.font = F1;
        el.style.color = mix(c, "#f4f4f6", ramp(f, L1_GO[k] + 2, L1_GO[k] + 7));
        el.style.textShadow = `0 0 12px ${rgba(c, (0.8 * (1 - t)).toFixed(3))}, 0 0 30px ${rgba(c, (0.5 * (1 - t)).toFixed(3))}`;
        el.style.opacity = ramp(f, L1_IN[k], L1_IN[k] + 1.5).toFixed(3);
        el.style.transformOrigin = "50% 50%";
        el.style.transform = `translate(${px(cx - lw / 2)}, ${px(cy - 31)}) scale(${s.toFixed(4)})`;
        el.style.filter = blurOf(3.5 * Math.sin(Math.PI * t));
      });
    }

    // ---------- S2: "not just talk about it?" — the chatty replies stack up ----------
    const bubs = $$(".bub");
    const BUB_T = [-99, -99, 59, 63, 67, 72, 77, 83];
    function renderS2(f) {
      orb2(f);
      const kk = 1 + BUB_T.slice(2).reduce((a, t) => a + eo(ramp(f, t, t + 5)), 0);
      bubs.forEach((el, i) => {
        const y = 760 + (i - kk) * 175;
        const pop = back(ramp(f, BUB_T[i], BUB_T[i] + 4), 2);
        const gone = i >= 3 ? ramp(f, 90 + (i % 4), 94 + (i % 4)) : 0;
        const s = pop * (1 - eo(gone)) * (1 + 0.15 * Math.sin(Math.PI * gone));
        el.style.display = f >= BUB_T[i] && s > 0.01 ? "block" : "none";
        el.style.transform = `translateY(${px(y - 75)}) scale(${s.toFixed(4)})`;
        const newest = f >= BUB_T[i] && (i === 7 || f < BUB_T[i + 1]);
        el.style.color = newest ? "#ffffff" : "#77777e";
        el.style.background = newest ? "#26262a" : "#18181a";
        el.style.opacity = clamp((y + 40) / 260, 0, 1).toFixed(3);
      });
    }

    // ---------- four dots: burst out of the last replies, then each becomes a letter of the wordmark ----------
    const dotsL = $("#dotsL");
    const DOT = [
      { t0: 92, p0: [520, 590], p1: [440, 470], r: 34 },
      { t0: 93, p0: [900, 765], p1: [1010, 690], r: 30 },
      { t0: 94, p0: [700, 930], p1: [640, 880], r: 32 },
      { t0: 95, p0: [1180, 760], p1: [1380, 760], r: 28 },
    ];
    function renderDots(f) {
      const on = f >= 92 && f < 117;
      vis(dotsL, on);
      if (!on) return;
      const slots = wmLetters(960, 410);
      [...dotsL.children].forEach((el, i) => {
        const d = DOT[i], tc = 104 + i, te = 111 + i;
        if (f < d.t0 || f >= te + 0.5) { el.style.display = "none"; return; }
        el.style.display = "block";
        const m = eo(ramp(f, d.t0, tc)), c = eio(ramp(f, tc, te));
        const x = lerp(lerp(d.p0[0], d.p1[0], m), slots[i].cx, c), y = lerp(lerp(d.p0[1], d.p1[1], m), slots[i].cy, c);
        const r = d.r * back(ramp(f, d.t0, d.t0 + 3), 2.4) * lerp(1, 1.4, c);
        el.style.width = el.style.height = px(2 * r);
        el.style.transform = `translate(${px(x - r)}, ${px(y - r)})`;
      });
    }

    // ---------- S3: "Meet your new AI teammate." ----------
    const wm3 = $$(".wm3"), ch3 = $("#ch3");
    function renderS3(f) {
      orb3(f);
      const s = 1 + 0.035 * eio(ramp(f, 114, 162));
      const slots = wmLetters(960, 410, s);
      wm3.forEach((el, i) => placeWM(el, slots[i], s, ramp(f, 111 + i, 118 + i)));
      driveChars(ch3, f, 124, 3);
    }

    // ---------- S4: prompt ----------
    const PT = [{ t: "Find what matters in my " }, { chip: "mail", label: "Mail" }, { t: " inbox, keep my " }, { chip: "cal", label: "Calendar" }, { t: " organized, draft in " }, { chip: "docs", label: "Docs" }];
    const EV4 = [];
    {
      let t = 162, first = true;
      PT.forEach((tok) => {
        if (tok.t) tok.t.split("").forEach((ch, i) => { const pre = first && i < 5; EV4.push([pre ? 162 : t, "c", ch]); if (!pre) t += 1 / 2.2; });
        else { EV4.push([t, "at"]); t += 2.5; EV4.push([t, "chip", tok]); t += 1.5; }
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
          html += `<span class="chip" style="transform:scale(${lerp(0.6, 1, back(ramp(f, t, t + 3), 2.5)).toFixed(3)})">${ICON[p.chip]}${p.label}</span>`;
          icons.push([p.chip, t]);
        }
      });
      const blink = f < T4_DONE + 2 || Math.floor((f - T4_DONE) / 7) % 2 === 0;
      html += `<span class="cur" style="opacity:${f < 199 && blink ? 1 : 0}"></span>`;
      ptext.innerHTML = html;
      pIcons.innerHTML = icons.map(([k, t], i) => `<div class="appic" style="left:${i * 66}px;transform:scale(${back(ramp(f, t, t + 3), 2.5).toFixed(3)});opacity:${ramp(f, t, t + 1.5).toFixed(3)}">${ICON[k]}</div>`).join("");
      // camera: slow push, then a smash zoom onto the end of the prompt and the send button
      const s = keys(f, [[162, 1], [186, 1.05], [188, 1.07], [189, 1.55], [190, 2.05], [191, 2.28], [193, 2.4], [214, 2.52]]);
      const Px = keys(f, [[162, 960], [188, 990], [189, 1180], [190, 1310], [191, 1350], [214, 1372]]);
      const Py = keys(f, [[162, 560], [188, 562], [191, 578], [214, 584]]);
      const cam = $("#cam4");
      cam.style.transform = `translate(${px(960 - s * Px)}, ${px(540 - s * Py)}) scale(${s.toFixed(4)})`;
      cam.style.filter = blurOf(keys(f, [[187.5, 0], [188.5, 5], [190, 5], [191.5, 0]]));
      arrowSvg.style.transform = `rotate(${keys(f, [[195, 45], [198, 0]]).toFixed(2)}deg)`;
      const press = keys(f, [[199, 1], [201, 0.88], [203, 1.05], [205, 1]]), stretch = keys(f, [[206, 1], [209, 1.2], [213, 1.5]]);
      send.style.transform = `scale(${press.toFixed(4)}, ${(press * stretch).toFixed(4)})`;
      send.style.boxShadow = `0 0 ${(10 + 40 * ramp(f, 200, 204)).toFixed(1)}px rgba(150,110,255,${(0.2 + 0.5 * ramp(f, 200, 204)).toFixed(2)})`;
      const rr = lerp(70, 150, eo(ramp(f, 200, 208)));
      ring.style.width = ring.style.height = px(rr);
      ring.style.margin = px(-rr / 2) + " 0 0 " + px(-rr / 2);
      ring.style.opacity = (f >= 200 ? 0.9 * (1 - ramp(f, 202, 208)) : 0).toFixed(3);
    }

    // ---------- pills ----------
    function setPill(el, f, t0, text, k = 1, y = 540) {
      el.style.display = k > 0.002 ? "flex" : "none";
      el.style.top = px(y);
      el.style.transform = `translate(-50%, -50%) scale(${(k * lerp(0.86, 1, back(ramp(f, t0, t0 + 4), 2))).toFixed(4)})`;
      el.style.opacity = ramp(f, t0, t0 + 1.5).toFixed(3);
      const pt = el.querySelector(".pt");
      if (pt.textContent !== text) pt.textContent = text;
      pt.style.backgroundPosition = `${(1.15 - (((f - t0) / 22) % 1.6)) * 100}% 0`;
      [...el.querySelectorAll(".spin i")].forEach((d, i) => { d.style.transform = `translateY(${px(-11 * Math.max(0, Math.sin(f * 0.42 - i * 0.9)))})`; });
    }

    // ---------- S5 mail / S6 calendar / S7 research / S8 chat ----------
    const mrows = $$(".mrow");
    function renderS5(f) {
      $("#cam5").style.transform = `translateY(${px(lerp(0, -14, ramp(f, 214, 240)))}) scale(${lerp(1, 1.03, eo(ramp(f, 214, 240))).toFixed(4)})`;
      mrows.forEach((el, i) => {
        const t = i === 0 ? 214 : 216 + i * 1.6, a = eo(ramp(f, t, t + 3));
        el.style.opacity = a.toFixed(3);
        el.style.transform = `translateY(${px(16 * (1 - a))})`;
      });
      $("#inboxN").textContent = String(68 + Math.min(7, Math.max(0, Math.floor((f - 216) / 1.6))));
      setPill($("#pill5"), f, 214, "Finding what matters");
    }
    const evts = $$(".evt");
    function renderS6(f) {
      $("#cam6").style.transform = `translateY(${px(keys(f, [[240, 60], [262, 22], [280, 0]]))}) scale(${keys(f, [[240, 1.03], [280, 1]]).toFixed(4)})`;
      evts.forEach((el, i) => {
        const t = EVT[i][7], a = eo(ramp(f, t, t + 4));
        el.style.display = f >= t ? "block" : "none";
        el.style.transform = `scaleY(${lerp(0.2, 1, a).toFixed(4)})`;
        el.style.opacity = ramp(f, t, t + 1.5).toFixed(3);
        el.children[0].style.opacity = ramp(f, t + (i === 5 ? 8 : 2), t + (i === 5 ? 10 : 4)).toFixed(3);
      });
      setPill($("#pill6"), f, 240, "Organizing your day");
    }
    const srcs = $$(".src"), sk7 = $$(".sk7"), an7 = $$(".an7");
    const Q7 = "How are teams using AI agents at work?";
    function renderS7(f) {
      $("#cam7").style.transform = `scale(${lerp(1, 1.05, eio(ramp(f, 280, 352))).toFixed(4)})`;
      $("#q7").textContent = Q7.slice(0, Math.floor(clamp((f - 280) * 3.2, 0, Q7.length)));
      srcs.forEach((el, i) => { const a = eo(ramp(f, 288 + i * 4, 293 + i * 4)); el.style.opacity = a.toFixed(3); el.style.transform = `translateY(${px(30 * (1 - a))})`; });
      sk7.forEach((el, i) => {
        el.style.background = "linear-gradient(90deg, #1f1f23 0%, #1f1f23 35%, #2c2c32 50%, #1f1f23 65%, #1f1f23 100%)";
        el.style.backgroundSize = "300% 100%";
        el.style.backgroundPosition = `${100 - (((f - 280 + i * 3) * 4) % 140)}% 0`;
        el.style.opacity = (ramp(f, 296 + i * 2, 300 + i * 2) * (1 - ramp(f, 328 + i * 5, 331 + i * 5))).toFixed(3);
      });
      an7.forEach((el, i) => { const a = ramp(f, 328 + i * 5, 334 + i * 5); el.style.clipPath = `inset(0 ${((1 - eo(a)) * 100).toFixed(2)}% 0 0)`; el.style.opacity = a > 0 ? 1 : 0; });
      setPill($("#pill7"), f, 280, f < 318 ? "Researching" : "Getting answers", 1 - eo(ramp(f, 330, 335)), 700);
    }
    const AV = (bg, ini) => `<div class="bx" style="width:108px;height:108px;border-radius:50%;background:${bg};color:${darkText(bg) ? "#151515" : "#fff"};font:700 40px Inter;display:grid;place-items:center">${ini}</div>`;
    const MSG = (y, av, name, time, text) => `<div class="bx" style="left:0;top:${y}px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px">${av}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#f2f2f4">${name} <span style="font:400 30px Inter;color:#85858d;margin-left:10px">${time}</span></div>
        <div class="bx" style="left:717px;top:56px;font:400 40px Inter;color:#dcdce2">${text}</div></div>`;
    const MEN = (t) => `<span style="color:#6ea8ff;background:rgba(20,119,240,.18);border-radius:6px;padding:0 4px">${t}</span>`;
    $("#msgs").innerHTML =
      MSG(20, AV(YELLOW, "AB"), "Ava Brooks", "12:22", `Quick reminder: ${MEN("@Noah")} should send the final deck today`) +
      MSG(185, AV(BLUE, "NK"), "Noah Kim", "12:24", `On it. I'll share the notes with ${MEN("@Mia")} and ${MEN("@Jon")} soon`) +
      MSG(350, AV(PINK, "ML"), "Mia Lopez", "12:45", `Great. I'll keep the thread open until ${MEN("@Noah")} shares the final draft`) +
      `<div class="bx" style="left:0;top:515px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px;width:108px;height:108px">${ICON.cal}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#f2f2f4">Calendar <span style="font:600 22px Inter;color:#b0b0b8;background:#26262b;border-radius:6px;padding:3px 8px;margin-left:8px;vertical-align:5px">APP</span> <span style="font:400 30px Inter;color:#85858d;margin-left:6px">12:59</span></div>
        <div class="bx" style="left:717px;top:56px;font:400 40px Inter;color:#dcdce2">Event starting in 30 seconds:</div>
        <div class="bx" style="left:717px;top:126px;width:6px;height:118px;border-radius:3px;background:${GREEN}"></div>
        <div class="bx" style="left:752px;top:126px;font:700 40px Inter;color:#6ea8ff">Launch sync</div>
        <div class="bx" style="left:752px;top:186px;font:400 40px Inter;color:#dcdce2">Today from 13:00 to 13:30</div></div>
      <div class="bx" id="m4" style="left:0;top:800px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px">${AV(PINK, "ML")}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#f2f2f4">Mia Lopez <span style="font:400 30px Inter;color:#85858d;margin-left:10px">13:33</span></div>
        <div class="bx" id="file8" style="left:717px;top:190px;width:900px;height:140px;border:2px solid #2e2e34;border-radius:18px;background:#18181b">
          <div class="bx" style="left:30px;top:34px;width:70px;height:70px">${ICON.doc}</div>
          <div class="bx" style="left:126px;top:24px;font:600 38px Inter;color:#fff">Launch plan v1</div>
          <div class="bx" style="left:126px;top:76px;font:400 30px Inter;color:#85858d">Last edited just now</div></div></div>`;
    function renderS8(f) {
      $("#msgs").style.transform = `translateY(${px(keys(f, [[352, 30], [368, 0], [371, -6], [377, -290], [382, -300], [422, -318]]))})`;
      $("#m4").style.opacity = eo(ramp(f, 370, 374)).toFixed(3);
      const fc = $("#file8");
      fc.style.opacity = ramp(f, 392, 394).toFixed(3);
      fc.style.transformOrigin = "0 0";
      fc.style.transform = `translateY(${px(24 * (1 - eo(ramp(f, 392, 397))))}) scale(${lerp(0.94, 1, back(ramp(f, 392, 397), 1.6)).toFixed(4)})`;
      setPill($("#pill8"), f, 352, "Drafting plan", 1, 600);
      $("#cam8").style.transform = `scale(${lerp(1, 1.025, ramp(f, 352, 422)).toFixed(4)})`;
    }

    // ---------- S9: dark mosaic; tools wire up to the hub; then the brief rolls through the week ----------
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
      [[380 + 140 * Math.sin(f * 0.021), 220 + 60 * Math.cos(f * 0.017), 820, pal[0], 0.55],
        [1620 - 120 * Math.sin(f * 0.019), 900, 860, pal[1], 0.5],
        [1150 + 90 * Math.cos(f * 0.023), 60, 600, PINK, 0.22],
        [520, 1040 - 50 * Math.sin(f * 0.02), 560, GREEN, 0.18]].forEach(([x, y, r, c, a]) => {
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
    wires.innerHTML = TOOLS.map((_, k) => `<line class="wire" stroke="${BRAND[k % 4]}" stroke-width="4" stroke-linecap="round" style="filter:drop-shadow(0 0 8px ${BRAND[k % 4]})"/><circle class="pulse" r="9" fill="#fff" style="filter:drop-shadow(0 0 10px ${BRAND[k % 4]})"/>`).join("");
    const wireEls = $$(".wire"), pulses = $$(".pulse");
    const wd = $("#wd"), dg = $("#dg"), b1 = $("#b1");
    function renderS9(f) {
      paintBg(f);
      mctx.clearRect(0, 0, W, H);
      if (f >= 422) mctx.drawImage(off, 0, 0);
      else cells.forEach((c) => {
        const t = 404 + 13 * (0.55 * c.d + 0.27 * (1 - c.i / COLS) + 0.18 * (c.j / ROWS));
        const a = ramp(f, t, t + 2.5);
        if (a <= 0) return;
        mctx.globalAlpha = a;
        mctx.drawImage(off, c.i * CS, c.j * CS, CS, CS, c.i * CS, c.j * CS, CS, CS);
        mctx.globalAlpha = 1;
      });

      // hub: four dots pop in a 2×2, the tiles fly in on curves, the wires draw in, pulses run along them
      const hubOn = f >= 418 && f < 466;
      vis($("#hub"), hubOn);
      if (hubOn) {
        $("#hub").style.transform = `scale(${lerp(1, 1.08, eio(ramp(f, 420, 466))).toFixed(4)}) rotate(${lerp(-2, 1, ramp(f, 420, 466)).toFixed(3)}deg)`;
        hubDots.forEach((d, i) => {
          const r = 30 * back(ramp(f, 419 + i, 423 + i), 2.5) * (1 + 0.08 * Math.sin(f * 0.3 + i));
          const x = 960 + (i % 2 ? 40 : -40), y = 540 + (i < 2 ? -40 : 40);
          d.style.width = d.style.height = px(2 * r);
          d.style.transform = `translate(${px(x - r)}, ${px(y - r)})`;
        });
        tiles.forEach((el, k) => {
          const ang = ((-90 + k * 60) * Math.PI) / 180, t = 424 + k * 2.5, a = eo(ramp(f, t, t + 9));
          const rx = lerp(1500, 560, a), ry = lerp(1500, 330, a), sp = (1 - a) * 0.9;
          const x = 960 + rx * Math.cos(ang + sp), y = 540 + ry * Math.sin(ang + sp);
          el.style.transform = `translate(${px(x - 70)}, ${px(y - 70)}) rotate(${(-40 * (1 - a)).toFixed(2)}deg) scale(${lerp(0.6, 1, back(a, 1.6)).toFixed(4)})`;
          el.style.opacity = ramp(f, t, t + 2).toFixed(3);
          const fx = 960 + 560 * Math.cos(ang), fy = 540 + 330 * Math.sin(ang);
          const D = Math.hypot(fx - 960, fy - 540), ux = (960 - fx) / D, uy = (540 - fy) / D;
          const sx = fx + ux * 90, sy = fy + uy * 90, ex = 960 - ux * 70, ey = 540 - uy * 70;
          const w = wireEls[k];
          w.setAttribute("x1", sx.toFixed(1)); w.setAttribute("y1", sy.toFixed(1)); w.setAttribute("x2", ex.toFixed(1)); w.setAttribute("y2", ey.toFixed(1));
          const dl = Math.hypot(ex - sx, ey - sy), dr = eo(ramp(f, 433 + k * 2, 441 + k * 2));
          w.setAttribute("stroke-dasharray", `${dl.toFixed(1)} ${dl.toFixed(1)}`);
          w.setAttribute("stroke-dashoffset", (dl * (1 - dr)).toFixed(1));
          w.style.opacity = dr > 0 ? 0.85 : 0;
          const pp = ((((f - 441 - k * 2) / 13) % 1) + 1) % 1;
          pulses[k].setAttribute("cx", lerp(sx, ex, pp).toFixed(1));
          pulses[k].setAttribute("cy", lerp(sy, ey, pp).toFixed(1));
          pulses[k].style.opacity = f >= 441 + k * 2 ? Math.sin(Math.PI * pp).toFixed(3) : 0;
        });
      }

      // the brief: a hard cut to a close-up, then the week rolls by quickly
      const cardOn = f >= 466;
      vis($("#cam9"), cardOn);
      if (!cardOn) return;
      const s = keys(f, [[466, 2.42], [505, 2.55]]);
      $("#cam9").style.transform = `translate(${px(keys(f, [[466, 279 - 2.42 * 174], [505, 255 - 2.55 * 174]]))}, ${px(keys(f, [[466, 112 - 2.42 * 189], [505, 98 - 2.55 * 189]]))}) scale(${s.toFixed(4)})`;
      let k = 0;
      DAY_T.forEach((t) => { if (f >= t) k++; });
      const t0 = k > 0 ? DAY_T[k - 1] : -1e9, day = DAYS[k], prev = DAYS[Math.max(0, k - 1)];
      let wdText;
      if (k === 0) wdText = day.wd + ", ";
      else if (f < t0 + 2) wdText = (prev.wd + ", ").slice(0, Math.max(0, 5 - Math.floor((f - t0) * 2.6)));
      else wdText = (day.wd + ", ").slice(0, Math.min(5, Math.floor((f - t0 - 2) * 2.6)));
      wd.textContent = wdText;
      wd.style.width = px(measure((k > 0 && f < t0 + 2 ? prev.wd : day.wd) + ", ", `400 38px ${UI}`));
      if (k > 0 && f < t0 + 2) { const a = ramp(f, t0, t0 + 2); dg.textContent = prev.d; dg.style.transform = `translateY(${px(16 * a)})`; dg.style.opacity = (1 - a).toFixed(3); }
      else if (k > 0) { const a = eo(ramp(f, t0 + 2, t0 + 6)); dg.textContent = day.d; dg.style.transformOrigin = "0 100%"; dg.style.transform = `translateY(${px(-18 * (1 - a))}) scale(${lerp(0.72, 1, a).toFixed(3)})`; dg.style.opacity = ramp(f, t0 + 2, t0 + 3).toFixed(3); }
      else { dg.textContent = day.d; dg.style.transform = "none"; dg.style.opacity = 1; }
      const out = k > 0 && f < t0 + 3, src = out ? prev : day;
      if (b1.dataset.t !== src.b1) { b1.dataset.t = src.b1; b1.textContent = src.b1; }
      const a = k === 0 ? 0 : out ? eo(ramp(f, t0, t0 + 3)) : 1 - eo(ramp(f, t0 + 3, t0 + 6));
      b1.style.transform = `translateY(${px((out ? -30 : 30) * a)})`;
      b1.style.opacity = (1 - a).toFixed(3);
      b1.style.filter = blurOf(6 * a);
    }

    // ---------- S10: "One Dot. Less busywork." ----------
    const tagEls = $$(".tag"), b10 = $$(".b10"), ch10 = $("#ch10");
    const F10 = `700 150px ${UI}`;
    function renderS10(f) {
      orb10(f);
      driveChars(ch10, f, 506, 0, ["blue"]);
      // headline: "One Dot." word by word; then it lifts away and "Less busywork." comes up
      const words = ["One ", "Dot.", "Less ", "busywork."], tin = [511, 517, 541, 546];
      const x1 = 960 - (measure(words[0], F10) + measure(words[1], F10)) / 2, x2 = 960 - (measure(words[2], F10) + measure(words[3], F10)) / 2;
      b10.forEach((el, i) => {
        const first = i < 2, k = eo(ramp(f, tin[i], tin[i] + 4));
        const outk = first ? eo(ramp(f, 538, 542)) : 0;
        const x = first ? x1 + (i === 1 ? measure(words[0], F10) : 0) : x2 + (i === 3 ? measure(words[2], F10) : 0);
        el.style.display = f >= tin[i] && outk < 1 ? "block" : "none";
        el.style.opacity = (ramp(f, tin[i], tin[i] + 2) * (1 - outk)).toFixed(3);
        el.style.transformOrigin = "0 80%";
        el.style.transform = `translate(${px(x)}, ${px(300 + 40 * (1 - k) - 70 * outk)}) scale(${lerp(0.8, 1, back(ramp(f, tin[i], tin[i] + 5), 2)).toFixed(4)})`;
        el.style.filter = blurOf(10 * (1 - k) + 12 * outk);
        if (i === 0 || i === 3) el.style.color = "#fff";
      });
      // busywork tags float in around the dot, then pop one after another
      tagEls.forEach((el, i) => {
        const [, c, x, y] = TAGS[i], tin2 = 512 + i * 2.5, tpop = 545 + i * 2.2;
        const a = back(ramp(f, tin2, tin2 + 5), 2), p = ramp(f, tpop, tpop + 4);
        const s = a * (p < 0.35 ? 1 + 0.5 * p : (1 - eo((p - 0.35) / 0.65)) * 1.17);
        el.style.display = f >= tin2 && p < 1 ? "flex" : "none";
        el.style.transform = `translate(${px(x)}, ${px(y + 10 * Math.sin(f * 0.1 + i))}) scale(${Math.max(0, s).toFixed(4)})`;
        el.style.filter = blurOf(6 * Math.max(0, p - 0.4));
        el.style.borderColor = mix("#2a2a2f", c, p * 2);
      });
    }

    // ---------- S11/S12: "You focus on what's next." → coloured dots → "OpenAI dots" end card ----------
    const t11 = $$(".t11"), tcur = $("#tcur"), wm12 = $$(".wm12"), ch12 = $("#ch12"), oai = $("#oai");
    const F11 = `600 76px ${UI}`, FO = `500 50px ${UI}`;
    const TT = [];
    { let t = 573; TAG.split("").forEach((c) => { TT.push(t); t += c === " " ? 2.6 : 1.8; }); }
    const T11_DONE = TT[TT.length - 1];
    const SQ = [];
    {
      const R = rng(404);
      TAG.split("").forEach((c, li) => {
        if (c === " ") return;
        const tgt = R() < 0.7 ? Math.floor(R() * 4) : 4 + Math.floor(R() * 6); // a letter of "dots" (0–3) or of "OpenAI" (4–9)
        SQ.push({ li, tgt, col: BRAND[Math.floor(R() * 4)], size: 16 + R() * 14, tb: 627 + R() * 4, tm: 632 + R() * 3, dur: 8 + R() * 3, jx: (R() - 0.5) * 90, jy: (R() - 0.5) * 80, ox: (R() - 0.5) * 60, oy: (R() - 0.5) * 80 });
      });
      for (let t = 0; t < 10; t++) if (!SQ.some((q) => q.tgt === t)) SQ[t].tgt = t; // every letter gets at least one
    }
    const sqs = $("#sqs");
    sqs.innerHTML = SQ.map((q) => `<i class="sq" style="background:${q.col};box-shadow:0 0 16px ${rgba(q.col, 0.8)}"></i>`).join("");
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
        el.style.textShadow = "0 0 22px rgba(255,255,255,.3)";
        el.style.transform = `translate(${px(left + tw(i))}, ${px(540 - 46)})`;
      });
      const blink = f < T11_DONE + 2 || Math.floor((f - T11_DONE) / 8) % 2 === 0;
      tcur.style.display = f >= 571 && f < 627 && blink ? "block" : "none";
      tcur.style.transform = `translate(${px(left + tw(nTyped) + 6)}, ${px(540 - 40)})`;

      // end card
      const slots = wmLetters(960, 430);
      const ow = measure("OpenAI", FO), ol = 960 - ow / 2;
      const oslot = (j) => ({ cx: ol + measure("OpenAI".slice(0, j), FO) + measure("OpenAI"[j], FO) / 2, cy: 215 });
      const fullLeft = 960 - tw(TAG.length) / 2;
      const arrive = Array(10).fill(1e9);
      [...sqs.children].forEach((el, n) => {
        const q = SQ[n], lw = measure(TAG[q.li], F11);
        const sx = fullLeft + tw(q.li) + lw / 2, sy = 540;
        const big = q.tgt < 4, tg = big ? slots[q.tgt] : oslot(q.tgt - 4);
        const tx = tg.cx + (big ? q.ox : q.ox * 0.2), ty = tg.cy + (big ? q.oy : q.oy * 0.15);
        const ta = q.tm + q.dur;
        arrive[q.tgt] = Math.min(arrive[q.tgt], ta);
        const on = f >= q.tb && f < ta + 2;
        el.style.display = on ? "block" : "none";
        if (!on) return;
        const hover = eo(ramp(f, q.tb, q.tm + 1)), m = eio(ramp(f, q.tm, ta));
        const x = lerp(sx + q.jx * hover, tx, m), y = lerp(sy + q.jy * hover, ty, m) - Math.sin(Math.PI * m) * 50;
        const size = q.size * back(ramp(f, q.tb, q.tb + 2), 2) * (1 - ramp(f, ta - 1, ta + 2));
        el.style.width = el.style.height = px(Math.max(0, size));
        el.style.transform = `translate(${px(x - size / 2)}, ${px(y - size / 2)})`;
      });
      wm12.forEach((el, i) => placeWM(el, slots[i], 1, ramp(f, arrive[i] - 1, arrive[i] + 6)));
      const o0 = Math.min(...arrive.slice(4)), oa = ramp(f, o0, o0 + 6);
      oai.style.font = FO;
      oai.style.color = "#d8d8de";
      oai.style.opacity = oa.toFixed(3);
      oai.style.filter = blurOf(8 * (1 - oa));
      oai.style.transform = `translate(${px(ol)}, ${px(215 - 30 + 10 * (1 - eo(oa)))})`;
      driveChars(ch12, f, 642, 3);
      $("#endG").style.transform = `scale(${(1 + 0.03 * eio(ramp(f, 648, 700))).toFixed(4)})`;
    }

    // ---------- frame ----------
    function render(t) {
      const f = clamp(t, 0, FRAMES - 0.001);
      const on = { s1: f < 56, s2: f >= 56 && f < 103, s3: f >= 103 && f < 162, s4: f >= 162 && f < 214, s5: f >= 214 && f < 240, s6: f >= 240 && f < 280,
        s7: f >= 280 && f < 352, s8: f >= 352 && f < 423, s9: f >= 404 && f < 505, s10: f >= 505 && f < 570, s11: f >= 570 };
      Object.keys(on).forEach((k) => vis(sc[k], on[k]));
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
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { mcache = {}; render(R0._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
