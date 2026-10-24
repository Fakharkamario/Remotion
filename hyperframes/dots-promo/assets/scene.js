// Dots — 23.3 s promo, 30 fps, 700 frames, cut to the voiceover in assets/voiceover.mp3.
// The shot list and motion follow the reference edit beat for beat, with the Dots story on top:
//   0–58     dark: big scattered serif letters fly into "What", the line builds word by word
//   58–108   cream: a huge to-do list ticks itself off and scrolls; orange dots burst from the checks
//   108–160  the dots fly together into the Dots mark; "Dots" types beside it
//   160–214  dark: a prompt types with tool chips; smash zoom onto the send button, press
//   214–240  mail UI, "Finding what matters" pill
//   240–280  calendar UI, "Organizing your day"
//   280–352  research UI, "Researching" → "Getting answers", the answer writes on
//   352–423  team chat UI, "Drafting plan", a doc lands; pixel dissolve into
//   404–570  gradient mosaic: the Daily brief card, then a close-up while the days roll Mon → Fri
//   570–700  cream: "You focus on what's next." types, breaks into squares, the squares rebuild "OpenAI Dots"
(function () {
  const FPS = 30, FRAMES = 700, W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const ei = (t) => Math.pow(clamp(t, 0, 1), 3);
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

  const ORANGE = "#DD663D", SALMON = "#F1AA90", INK = "#1d1d1b", GRAY = "#a29e98";
  const SERIF = '"SourceSerif", Georgia, serif';

  const ICON = {
    mail: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="#fff"/><path d="M3.5 6.5l8.5 6.3 8.5-6.3" fill="none" stroke="#E5533D" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="2.5" y="3.5" width="19" height="18" rx="3.5" fill="#4C8BF5"/><path d="M2.5 9h19" stroke="#2F6FDB" stroke-width="3"/><path d="M7.5 2.5v3M16.5 2.5v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/><text x="12" y="18.6" font-family="Inter" font-weight="700" font-size="8.5" fill="#fff" text-anchor="middle">24</text></svg>',
    docs: '<svg viewBox="0 0 24 24"><path d="M5.5 2.5h9l4 4v15h-13z" fill="#F4B63F"/><path d="M14.5 2.5v4h4" fill="#D99A22"/><path d="M8.5 11h7M8.5 14h7M8.5 17h4.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M12 20V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg class="mic" viewBox="0 0 24 24"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="#d6d6d6"/><path d="M5 11.5a7 7 0 0014 0M12 18.5v3" fill="none" stroke="#d6d6d6" stroke-width="2" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#6b6b6b" stroke-width="2.2"/><path d="M15.5 15.5l5 5" stroke="#6b6b6b" stroke-width="2.2" stroke-linecap="round"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M5.5 2.5h9l4 4v15h-13z" fill="none" stroke="#2BAC76" stroke-width="2"/><path d="M8.5 11h7M8.5 14h7M8.5 17h4.5" stroke="#2BAC76" stroke-width="1.8" stroke-linecap="round"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 11-2.1-5" fill="none" stroke="#5f6368" stroke-width="2.2" stroke-linecap="round"/><path d="M17.5 3v4.5H13" fill="none" stroke="#5f6368" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" fill="#5f6368"/><circle cx="12" cy="12" r="2" fill="#5f6368"/><circle cx="12" cy="19" r="2" fill="#5f6368"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="none" stroke="#c4c7c5" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  };

  // the Dots mark: a centre dot and six petals; every piece is driven per frame
  const markHTML = (cls = "") => `<svg class="mark ${cls}" viewBox="-50 -50 100 100"><circle class="mc" r="15" fill="${ORANGE}"/>${`<circle class="mp" r="11" fill="${ORANGE}"/>`.repeat(6)}</svg>`;
  function setMark(svg, o) {
    svg.querySelector(".mc").setAttribute("r", (15 * Math.max(0, o.c)).toFixed(2));
    svg.querySelectorAll(".mp").forEach((c, i) => {
      const a = ((i * 60 - 90 + (o.rot || 0)) * Math.PI) / 180;
      const d = Array.isArray(o.d) ? o.d[i] : o.d, s = Array.isArray(o.p) ? o.p[i] : o.p;
      c.setAttribute("cx", (d * Math.cos(a)).toFixed(2));
      c.setAttribute("cy", (d * Math.sin(a)).toFixed(2));
      c.setAttribute("r", (11 * Math.max(0, s)).toFixed(2));
      c.setAttribute("opacity", o.op ? o.op[i].toFixed(3) : "1");
    });
  }
  // the mark "growing": centre first, then the petals push out one after another
  const growMark = (svg, f, t0, rot0 = -90) => setMark(svg, {
    c: back(ramp(f, t0, t0 + 4), 2.2),
    p: [0, 1, 2, 3, 4, 5].map((i) => back(ramp(f, t0 + 1.5 + i * 0.7, t0 + 5.5 + i * 0.7), 2.4)),
    d: [0, 1, 2, 3, 4, 5].map((i) => 32 * eo(ramp(f, t0 + 1.5 + i * 0.7, t0 + 6 + i * 0.7))),
    rot: lerp(rot0, 0, eo(ramp(f, t0, t0 + 14))),
  });
  const spinMark = (svg, f) => setMark(svg, { c: 1, p: 1, d: 32, rot: f * 9, op: [0, 1, 2, 3, 4, 5].map((i) => 0.3 + 0.7 * ((((i - f * 0.35) % 6) + 6) % 6) / 5) });

  const SCENE = {};
  SCENE.mount = function (stage) {
    const $ = (sel) => stage.querySelector(sel);
    const vis = (el, on, d = "block") => { el.style.display = on ? d : "none"; };

    // text measuring (offscreen, always laid out, so it works while a scene is hidden)
    const meas = document.createElement("span");
    meas.style.cssText = "position:absolute;left:-12000px;top:0;white-space:pre;visibility:hidden";
    let mcache = {};
    const measure = (text, font) => {
      const k = font + "|" + text;
      if (mcache[k] != null) return mcache[k];
      meas.style.font = font;
      meas.textContent = text;
      return (mcache[k] = meas.getBoundingClientRect().width / (stageScale() || 1));
    };
    // the preview may scale the page; measure in composition pixels
    const stageScale = () => { const r = stage.getBoundingClientRect(); return r.width / W; };

    // ---------- faint orbit backdrops (rings, drifting nodes, tiny labels) ----------
    function makeOrbits(host, cfg) {
      const R = rng(cfg.seed);
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
      cfg.sys.forEach((y) => y.r.forEach((r) => (s += `<circle cx="${y.cx}" cy="${y.cy}" r="${r}" fill="none" stroke="${cfg.ring}" stroke-width="2"/>`)));
      (cfg.lines || []).forEach((l) => (s += `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${cfg.ring}" stroke-width="2"/>`));
      host.innerHTML = s + "</svg>";
      const nodes = [];
      cfg.sys.forEach((y) => y.r.forEach((r) => {
        for (let k = 0; k < (cfg.per || 2); k++) {
          const el = document.createElement("div");
          el.className = "onode";
          const size = 8 + R() * 9, warm = R() < cfg.warm;
          const lab = cfg.labels && R() < 0.65 ? `<span style="color:${cfg.labelCol}">${cfg.labels[Math.floor(R() * cfg.labels.length)]}</span>` : "";
          el.innerHTML = `<i style="width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;background:${warm ? cfg.warmCol : cfg.coolCol}"></i>${lab}`;
          host.appendChild(el);
          nodes.push({ el, y, r, a0: R() * 360, sp: (R() < 0.5 ? -1 : 1) * (0.2 + R() * 0.3) * (cfg.speed || 1), op: 0.55 + R() * 0.45 });
        }
      }));
      return (f) => nodes.forEach((n) => {
        const a = ((n.a0 + n.sp * f) * Math.PI) / 180;
        n.el.style.transform = `translate(${px(n.y.cx + n.r * Math.cos(a))}, ${px(n.y.cy + n.r * Math.sin(a))})`;
        n.el.style.opacity = n.op.toFixed(3);
      });
    }
    const LABELS = ["Inbox", "Calendar", "Notes", "Tasks", "Docs", "Messages", "Research", "Drive"];
    const DARK_ORB = { ring: "rgba(255,255,255,0.032)", warm: 0.45, warmCol: "#8a3f25", coolCol: "#323232", labelCol: "#2f2f2f", labels: LABELS };
    const LIGHT_ORB = { ring: "rgba(0,0,0,0.04)", warm: 0.3, warmCol: "#efd3c7", coolCol: "#e1ded8" };

    // ---------- DOM ----------
    const LIST = ["Sort the inbox", "Reply to the client thread", "Find the Q3 numbers", "Book the team sync", "Check the calendar", "Research competitors",
      "Draft the proposal", "Update the tracker", "Follow up with Sam", "Prep tomorrow's agenda", "Clean up the notes", "Plan next week"];
    const S1W = ["What", "if", "your", "AI", "could", "do", "the", "work,"];

    const MAIL = [["Maya Chen", "Q3 numbers are in - Final figures attached for your review"], ["Support", "Ticket #20418 was updated - A new reply is waiting"],
      ["Northwind Studio", "Contract renewal, next steps - Attaching the draft"], ["Leo Park", "Feedback on the deck - Two quick notes on slide 4"],
      ["Calendar", "Reminder: Design review at 11:00 - Room 4B"], ["Priya Nair", "Standup notes, Tuesday - Quick recap since Monday"],
      ["Harbor Bank", "Your monthly statement is ready - View it online"], ["Sam Ortiz", "Re: launch plan - Approved on our side, go ahead"]];
    const SIDE = [["Starred", 339], ["Snoozed", 426], ["Sent", 510], ["Drafts", 597], ["Purchases", 681], ["More", 768]];

    // calendar events: [col x, y, w, h, title, time, style, appear frame]
    const EVT = [
      [-60, 300, 462, 270, "Weekly report", "8:30am", "blue", 240], [-60, 660, 462, 120, "Submit timesheet", "", "green", 250], [-60, 795, 462, 180, "Dinner with family", "", "lilacO", 266],
      [441, 234, 1038, 147, "Team standup", "9:00am", "blue", 240], [441, 396, 1038, 147, "Focus time", "10:00am", "lilac", 245], [441, 558, 1038, 396, "Client review", "11:30am", "blue", 248],
      [1515, 231, 460, 225, "Design sync", "9:00am", "blueO", 258], [1515, 609, 460, 261, "Send invoices", "1:00pm", "green", 262],
    ];
    const EVS = { blue: ["#5189DC", "#fff", "none"], lilac: ["#A895D6", "#fff", "none"], green: ["#74BC88", "#fff", "none"], blueO: ["#fff", "#5189DC", "3px solid #5189DC"], lilacO: ["#fff", "#9b7fd4", "3px solid #A895D6"] };

    const SOURCES = [["#4C8BF5", "workplace.report", "How teams use AI agents in 2026"], ["#E5533D", "hbr-notes.com", "From chat to action: the agent shift"],
      ["#2BAC76", "teamstudy.org", "Survey: where busywork goes"], ["#9b7fd4", "futureofwork.io", "Agents that do the work"]];
    const ANSWER = ["Teams are moving from chat to action. Most now use", "agents to triage email, plan schedules and draft first", "versions of docs [1][2]. The biggest win is hours", "handed back for focused work [3]."];

    const DAYS = [
      { wd: "Mon", d: "26", b1: "Three emails need you today, starting with the client reply at 9:30. You're free after 3 for focused work.", b2: "Research notes on pricing are ready in Docs. The team left feedback on the plan overnight." },
      { wd: "Tue", d: "27", b1: "Light day today. Two client replies are drafted and waiting for your OK before noon." },
      { wd: "Wed", d: "28", b1: "Two deadlines today: the launch deck and the Q3 report. Both first drafts are ready." },
      { wd: "Thu", d: "29", b1: "Quiet morning. Your inbox is sorted and three clear hours are blocked for the big idea." },
      { wd: "Fri", d: "30", b1: "Inbox zero by nine. The weekly recap is written and Monday's sync is already booked." },
    ];
    const DAY_T = [455, 478, 501, 524];

    const TAG = "You focus on what's next.";
    const END = "OpenAI Dots";

    stage.innerHTML = `
      <div id="s1" class="scene dark paper"><div class="orb" id="orb1"></div><div id="s1line" class="layer">${S1W.map((w) => `<span class="abs serif w1">${w}</span>`).join("")}</div>
        <div class="layer">${"What".split("").map((c) => `<span class="abs serif l1">${c}</span>`).join("")}</div></div>
      <div id="s2" class="scene light paper"><div class="orb" id="orb2"></div>${LIST.map((t) => `<div class="row"><i class="ck">${ICON.check}</i><span>${t}</span></div>`).join("")}</div>
      <div id="s3" class="scene light paper"><div class="orb" id="orb3"></div><div id="g3" class="layer">${markHTML("m3")}${"Dots".split("").map((c) => `<span class="abs serif l3">${c}</span>`).join("")}</div></div>
      <div id="dotsL" class="layer" style="display:none"></div>
      <div id="s4" class="scene dark paper"><div class="orb" id="orb4"></div>
        <div id="cam4"><div id="pIcons"></div>
          <div id="prompt"><div id="ptext"></div>
            <div id="pctl"><span class="plus">+</span><div class="rt"><span class="model">Dots 1</span>${ICON.mic}<div id="send"><div id="ring"></div>${ICON.arrow}</div></div></div></div></div></div>
      <div id="s5" class="scene ui" style="background:#f8fafd"><div class="cam" id="cam5">
          <div class="bx" style="left:0;top:0;width:490px;height:1080px;background:#f3f6fc"></div>
          <div class="bx" style="left:-40px;top:52px;width:274px;height:106px;border-radius:32px;background:#c2e7ff"></div>
          <div class="bx" style="left:20px;top:82px;font:500 38px Inter;color:#0b2a44">Compose</div>
          <div class="bx" style="left:-40px;top:216px;width:496px;height:78px;border-radius:39px;background:#d3e3fd"></div>
          <div class="bx" style="left:-12px;top:232px;font:700 34px Inter;color:#0b2a44">Inbox</div>
          <div class="bx" id="inboxN" style="left:360px;top:236px;width:70px;text-align:right;font:700 28px Inter;color:#0b2a44">68</div>
          ${SIDE.map(([t, y]) => `<div class="bx" style="left:-12px;top:${y - 20}px;font:400 34px Inter;color:#202124">${t}</div>`).join("")}
          <div class="bx" style="left:360px;top:665px;width:70px;text-align:right;font:500 26px Inter;color:#444">11</div>
          <div class="bx" style="left:535px;top:37px;width:34px;height:34px;border:3px solid #5f6368;border-radius:5px"></div>
          <div class="bx" style="left:631px;top:34px;width:40px;height:40px">${ICON.refresh}</div>
          <div class="bx" style="left:733px;top:34px;width:40px;height:40px">${ICON.dots}</div>
          ${MAIL.map(([a, b], i) => `<div class="bx mrow" style="left:490px;top:${114 + i * 120}px;width:1430px;height:120px;border-top:2px solid #eceff3">
              <div class="bx" style="left:53px;top:43px;width:30px;height:30px;border:2.5px solid #c4c7c5;border-radius:4px"></div>
              <div class="bx" style="left:133px;top:40px;width:38px;height:38px">${ICON.star}</div>
              <div class="bx" style="left:227px;top:36px;font:600 40px Inter;color:#1f1f1f">${a}</div>
              <div class="bx" style="left:635px;top:36px;font:400 40px Inter;color:#444746">${b}</div></div>`).join("")}
        </div>${pillHTML("pill5")}</div>
      <div id="s6" class="scene ui" style="background:#f0f0f0"><div class="cam" id="cam6">
          <div class="bx" style="left:426px;top:-200px;width:2px;height:1500px;background:#d8d8d8"></div>
          <div class="bx" style="left:1491px;top:-200px;width:2px;height:1500px;background:#d8d8d8"></div>
          <div class="bx" style="left:-10px;top:192px;width:1940px;height:2px;background:#d8d8d8"></div>
          <div class="bx" style="left:871px;top:-23px;width:178px;height:178px;border-radius:50%;background:#5189DC;color:#fff;font:400 88px Inter;display:grid;place-items:center">24</div>
          ${EVT.map(([x, y, w, h, t, tm, st]) => { const [bg, fg, bd] = EVS[st]; return `<div class="bx evt" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${bg};border:${bd};border-radius:10px;color:${fg};transform-origin:50% 0;overflow:hidden">
              <div class="evl" style="position:absolute;left:${x < 0 ? 80 : 20}px;top:14px"><div style="font:500 40px Inter">${t}</div><div style="font:400 25px Inter;opacity:.85;margin-top:2px">${tm}</div></div></div>`; }).join("")}
        </div>${pillHTML("pill6")}</div>
      <div id="s7" class="scene ui" style="background:#faf9f6"><div class="cam" id="cam7">
          <div class="bx" style="left:0;top:0;width:360px;height:1080px;background:#f1efea"></div>
          ${[["+ New search", 100], ["Home", 210], ["Library", 290], ["Spaces", 370]].map(([t, y]) => `<div class="bx" style="left:${t[0] === "+" ? 40 : -14}px;top:${y}px;font:${t[0] === "+" ? 600 : 400} 36px Inter;color:#4a4a4a">${t}</div>`).join("")}
          <div class="bx" style="left:440px;top:60px;width:1560px;height:130px;border-radius:65px;background:#fff;border:2px solid #e4e1db"></div>
          <div class="bx" style="left:490px;top:101px;width:48px;height:48px">${ICON.search}</div>
          <div class="bx" id="q7" style="left:565px;top:97px;font:400 44px Inter;color:#1f1f1f"></div>
          ${SOURCES.map(([c, d, t], i) => `<div class="bx src" style="left:${440 + i * 400}px;top:240px;width:370px;height:170px;border-radius:22px;background:#fff;border:2px solid #ebe8e2">
              <div class="bx" style="left:24px;top:24px;width:38px;height:38px;border-radius:10px;background:${c}"></div>
              <div class="bx" style="left:76px;top:28px;font:400 25px Inter;color:#8a8a8a">${d}</div>
              <div style="position:absolute;left:24px;top:80px;width:322px;font:500 29px/37px Inter;color:#222;white-space:normal">${t}</div></div>`).join("")}
          <div class="bx" style="left:440px;top:470px;width:46px;height:46px">${markHTML("m7")}</div>
          <div class="bx" style="left:505px;top:470px;font:650 38px Inter;color:#1f1f1f">Answer</div>
          ${ANSWER.map((t, i) => `<div class="bx sk7" style="left:440px;top:${560 + i * 74}px;width:${[1380, 1320, 1400, 820][i]}px;height:34px;border-radius:17px"></div>
              <div class="bx an7" style="left:440px;top:${548 + i * 74}px;font:400 44px Inter;color:#222">${t}</div>`).join("")}
        </div>${pillHTML("pill7")}</div>
      <div id="s8" class="scene ui" style="background:#fff"><div class="cam" id="cam8">
          <div id="msgs" class="layer"></div>
          <div class="bx" style="left:0;top:0;width:498px;height:1080px;background:#3a0b3d"></div>
          ${[["ouncements", 165], ["nch-team", 354], ["ssages", 459], ["ntions & you", 576], ["n, Jon Patel ...", 660], ["mates", 756], ["alendar", 966]].map(([t, y]) => `<div class="bx" style="left:-6px;top:${y - 24}px;font:400 40px Inter;color:rgba(255,255,255,.78)">${t}</div>`).join("")}
          <div class="bx" style="left:540px;top:878px;width:1440px;height:260px;border-radius:16px;border:2px solid #c9c9c9;background:#fff"></div>
          <div class="bx" style="left:582px;top:910px;font:400 38px Inter;color:#8a8a8a">Message #launch-team</div>
          <div class="bx" style="left:582px;top:1010px;font:700 34px Inter;color:#9a9a9a;letter-spacing:.9em">⚡B<i style="font-style:italic">I</i>S</div>
        </div>${pillHTML("pill8")}</div>
      <div id="s9" class="scene"><canvas id="mos" width="${W}" height="${H}"></canvas>
        <div id="cam9"><div id="card">
            <div class="date"><span id="wd"></span><span id="oct">Oct </span><span id="dg"></span></div>
            <div class="ttl">Daily brief</div><div class="rule"></div>
            <div class="body" id="b1" style="top:244px"></div><div class="body" id="b2" style="top:394px"></div>
            <div class="foot">Next run: tomorrow, 7:00 AM</div><div class="btn">Show more</div></div></div></div>
      <div id="s10" class="scene light paper"><div class="orb" id="orb10"></div>
        <div id="tagL" class="layer">${TAG.split("").map((c) => `<span class="abs serif t10">${c}</span>`).join("")}<div id="tcur"></div></div>
        <div id="endG" class="layer" style="transform-origin:960px 540px">${markHTML("m11")}${END.split("").map((c) => `<span class="abs serif e11">${c}</span>`).join("")}<div id="sqs"></div></div></div>
    `;
    stage.appendChild(meas);
    function pillHTML(id) { return `<div class="pill" id="${id}">${markHTML()}<span class="pt"></span></div>`; }

    const sc = {}; ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"].forEach((k) => (sc[k] = $("#" + k)));
    const orb1 = makeOrbits($("#orb1"), { ...DARK_ORB, seed: 11, sys: [{ cx: 640, cy: 760, r: [170, 270, 400] }, { cx: 1500, cy: 260, r: [200, 330] }, { cx: 1180, cy: 1000, r: [240] }] });
    const orb2 = makeOrbits($("#orb2"), { ...LIGHT_ORB, seed: 5, per: 1, sys: [{ cx: 1500, cy: 700, r: [260, 420] }] });
    const orb3 = makeOrbits($("#orb3"), { ...LIGHT_ORB, seed: 9, per: 1, sys: [{ cx: 960, cy: 540, r: [380, 560] }] });
    const orb4 = makeOrbits($("#orb4"), { ...DARK_ORB, seed: 21, speed: 1.6, sys: [{ cx: 1450, cy: 330, r: [330, 520, 720] }, { cx: 330, cy: 940, r: [260, 430] }],
      lines: [[1250, 0, 1700, 260], [380, 1080, 760, 640], [1640, 620, 1920, 560], [0, 380, 300, 520]] });
    const orb10 = makeOrbits($("#orb10"), { ...LIGHT_ORB, seed: 31, per: 2, sys: [{ cx: 960, cy: 540, r: [300, 470, 650] }, { cx: 260, cy: 180, r: [240] }, { cx: 1700, cy: 900, r: [280] }] });

    // ---------- S1 ----------
    const w1 = [...stage.querySelectorAll(".w1")], l1 = [...stage.querySelectorAll(".l1")];
    const F1 = "400 60px " + SERIF;
    const W1_IN = [0, 27, 29, 32, 35.5, 38, 40, 43];
    const L1_POS = [[300, 190], [1490, 150], [1300, 360], [700, 860]], L1_IN = [0, 4, 7, 11], L1_GO = [15, 16.5, 18, 19.5], L1_BIG = 2.8;
    function renderS1(f) {
      orb1(f);
      const sp = measure(" ", F1);
      const ws = S1W.map((w) => measure(w, F1));
      const con = ws.map((w, i) => (i === 0 ? w : (sp + w) * eo(ramp(f, W1_IN[i], W1_IN[i] + 5))));
      const total = con.reduce((a, b) => a + b, 0);
      const left = 960 - total / 2;
      const zoom = 1 + 0.035 * eo(ramp(f, 27, 58));
      $("#s1line").style.transform = `scale(${zoom.toFixed(4)})`;
      $("#s1line").style.transformOrigin = "960px 540px";
      let x = left;
      w1.forEach((el, i) => {
        const xi = i === 0 ? x : x + sp;
        x += con[i];
        const a = i === 0 ? (f >= 27 ? 1 : 0) : ramp(f, W1_IN[i], W1_IN[i] + 3);
        el.style.opacity = a.toFixed(3);
        el.style.color = "#f1eee8";
        el.style.font = F1;
        el.style.filter = i === 0 ? "none" : blurOf(4 * (1 - eo(ramp(f, W1_IN[i], W1_IN[i] + 4))));
        el.style.transform = `translate(${px(xi)}, ${px(510 + (i === 0 ? 0 : 12 * (1 - eo(ramp(f, W1_IN[i], W1_IN[i] + 4)))))})`;
      });
      // big letters: pop in where they are scattered, then fly into "What" (only "What" is on the line while they fly)
      const lineLeft = 960 - ws[0] / 2;
      l1.forEach((el, k) => {
        const on = f >= L1_IN[k] && f < 27;
        vis(el, on);
        if (!on) return;
        const lw = measure("What"[k], F1), off = measure("What".slice(0, k), F1);
        const t = eio(ramp(f, L1_GO[k], L1_GO[k] + 7));
        const drift = Math.min(f - L1_IN[k], 15);
        const x0 = L1_POS[k][0] + drift * 0.8, y0 = L1_POS[k][1] - drift * 0.5;
        const cx = lerp(x0, lineLeft + off + lw / 2, t), cy = lerp(y0, 540, t);
        const s = lerp(L1_BIG * lerp(0.75, 1, back(ramp(f, L1_IN[k], L1_IN[k] + 3), 2)), 1, t);
        el.style.font = F1;
        el.style.color = "#f1eee8";
        el.style.opacity = ramp(f, L1_IN[k], L1_IN[k] + 1.5).toFixed(3);
        el.style.transformOrigin = "50% 50%";
        el.style.transform = `translate(${px(cx - lw / 2)}, ${px(cy - 30)}) scale(${s.toFixed(4)})`;
        el.style.filter = blurOf(3.5 * Math.sin(Math.PI * t));
      });
    }

    // ---------- S2 ----------
    const rows = [...stage.querySelectorAll(".row")];
    const CUR = [-1e9, -1e9, 60.5, 63, 67, 80, 95, 1e9, 1e9, 1e9, 1e9, 1e9, 1e9];
    const TOP0 = [[58, 80], [59, 62], [64, -117], [69, -148], [77, -172], [89, -320], [99, -486], [104, -492], [108, -494]];
    function renderS2(f) {
      orb2(f);
      const top0 = keys(f, TOP0);
      rows.forEach((el, i) => {
        const y = top0 + i * 172;
        el.style.transform = `translateY(${px(y - 86)})`;
        const ck = el.children[0], tx = el.children[1], chk = ck.children[0];
        const start = CUR[i], end = CUR[i + 1];
        if (f < start) { // still to do
          ck.style.background = "transparent";
          ck.style.boxShadow = "inset 0 0 0 4px #d6d1cb";
          ck.style.transform = "none";
          chk.style.opacity = 0;
          tx.style.color = GRAY;
        } else if (f < end) { // the one being done right now: a pie fill, then the tick
          const a = ramp(f, start, start + 2.2);
          ck.style.background = a >= 1 ? ORANGE : `conic-gradient(${ORANGE} ${(a * 360).toFixed(1)}deg, transparent 0)`;
          ck.style.boxShadow = a >= 1 ? "none" : "inset 0 0 0 4px #d6d1cb";
          ck.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * ramp(f, start + 1.5, start + 4.5))).toFixed(4)})`;
          chk.style.opacity = ramp(f, start + 1.2, start + 2.4).toFixed(3);
          tx.style.color = mix(GRAY, INK, ramp(f, start, start + 2));
        } else { // done: fades back to a soft check
          const d = ramp(f, end, end + 3);
          ck.style.background = mix(ORANGE, SALMON, d);
          ck.style.boxShadow = "none";
          ck.style.transform = "none";
          chk.style.opacity = 1;
          tx.style.color = mix(INK, GRAY, d);
        }
      });
    }

    // ---------- orange dots: burst out of the list, then fly together into the mark ----------
    const DOTS = [
      { t0: 96, p0: [560, 470], p1: [489, 540], r: 30, c: ORANGE, tc: 110, te: 117 },
      { t0: 97, p0: [1860, 930], p1: [1725, 990], r: 24, c: "#E58A6A", tc: 111, te: 118 },
      { t0: 99, p0: [1420, 860], p1: [1080, 879], r: 20, c: "#EBA285", tc: 109, te: 116 },
      { t0: 100, p0: [300, 830], p1: [294, 795], r: 30, c: ORANGE, tc: 110, te: 118 },
      { t0: 102, p0: [760, 230], p1: [747, 198], r: 15, c: "#EBA285", tc: 108, te: 116 },
      { t0: 103, p0: [1470, 360], p1: [1503, 336], r: 13, c: "#EBA285", tc: 109, te: 117 },
      { t0: 104, p0: [1150, 700], p1: [1190, 760], r: 18, c: ORANGE, tc: 112, te: 118 },
    ];
    const dotsL = $("#dotsL");
    dotsL.innerHTML = DOTS.map(() => `<i class="abs" style="border-radius:50%"></i>`).join("");
    function renderDots(f) {
      const on = f >= 96 && f < 119;
      vis(dotsL, on);
      if (!on) return;
      [...dotsL.children].forEach((el, i) => {
        const d = DOTS[i];
        if (f < d.t0 || f >= d.te) { el.style.display = "none"; return; }
        el.style.display = "block";
        const m = eo(ramp(f, d.t0, d.tc)), c = ei(ramp(f, d.tc, d.te));
        const x = lerp(lerp(d.p0[0], d.p1[0], m), 960, c), y = lerp(lerp(d.p0[1], d.p1[1], m), 540, c);
        const r = d.r * back(ramp(f, d.t0, d.t0 + 3), 2) * lerp(1, 0.55, c);
        el.style.width = el.style.height = px(2 * r);
        el.style.background = d.c;
        el.style.transform = `translate(${px(x - r)}, ${px(y - r)})`;
      });
    }

    // ---------- S3 ----------
    const m3 = $(".m3"), l3 = [...stage.querySelectorAll(".l3")];
    const F3 = "560 200px " + SERIF, MK3 = 190, L3_IN = [126, 127.5, 129, 130.5];
    function renderS3(f) {
      orb3(f);
      growMark(m3, f, 116);
      const lw = "Dots".split("").map((c, i) => measure("Dots".slice(0, i + 1), F3) - measure("Dots".slice(0, i), F3));
      const typed = lw.reduce((a, w, i) => a + w * eo(ramp(f, L3_IN[i], L3_IN[i] + 2)), 0);
      const gap = 34 * eo(ramp(f, L3_IN[0], L3_IN[0] + 2));
      const gw = MK3 + gap + typed;
      const drift = keys(f, [[140, 0], [150, -18], [155, -45], [160, -110]]);
      const left = 960 - gw / 2;
      m3.style.width = m3.style.height = px(MK3);
      m3.style.left = px(left);
      m3.style.top = px(540 - MK3 / 2);
      l3.forEach((el, i) => {
        el.style.font = F3;
        el.style.color = "#1f1e1c";
        el.style.letterSpacing = "0";
        el.style.opacity = f >= L3_IN[i] ? 1 : 0;
        el.style.transform = `translate(${px(left + MK3 + gap + measure("Dots".slice(0, i), F3))}, ${px(540 - 128)})`;
      });
      const g = $("#g3");
      g.style.transformOrigin = "960px 540px";
      g.style.transform = `translateX(${px(drift)}) scale(${keys(f, [[140, 1], [160, 0.96]]).toFixed(4)})`;
    }

    // ---------- S4: prompt ----------
    const PT = [{ t: "Find what matters in my " }, { chip: "mail", label: "Mail" }, { t: " inbox, keep my " }, { chip: "cal", label: "Calendar" }, { t: " organized, draft in " }, { chip: "docs", label: "Docs" }];
    const EV4 = []; // typing events: [time, kind, payload]
    {
      let t = 160, first = true;
      PT.forEach((tok) => {
        if (tok.t) tok.t.split("").forEach((ch, i) => { EV4.push([first && i < 5 ? 160 : t, "c", ch]); if (!(first && i < 5)) t += 1 / 2.2; });
        else { EV4.push([t, "at"]); t += 2.5; EV4.push([t, "chip", tok]); t += 1.5; }
        first = false;
      });
    }
    const T4_DONE = EV4[EV4.length - 1][0];
    const ptext = $("#ptext"), pIcons = $("#pIcons"), send = $("#send"), ring = $("#ring");
    const arrowSvg = send.querySelector("svg");
    function renderS4(f) {
      orb4(f);
      let html = "", icons = [], atOpen = false;
      EV4.forEach(([t, k, p]) => {
        if (t > f) return;
        if (k === "c") html += p === " " ? " " : p.replace("'", "&#39;");
        else if (k === "at") { html += "@"; atOpen = true; }
        else {
          if (atOpen) { html = html.slice(0, -1); atOpen = false; }
          const s = lerp(0.6, 1, back(ramp(f, t, t + 3), 2.5));
          html += `<span class="chip" style="transform:scale(${s.toFixed(3)})">${ICON[p.chip]}${p.label}</span>`;
          icons.push([p.chip, t]);
        }
      });
      const blink = f < T4_DONE + 2 || Math.floor((f - T4_DONE) / 7) % 2 === 0;
      html += `<span class="cur" style="opacity:${f < 199 && blink ? 1 : 0}"></span>`;
      ptext.innerHTML = html;
      pIcons.innerHTML = icons.map(([k, t], i) => `<div class="appic" style="left:${i * 66}px;transform:scale(${back(ramp(f, t, t + 3), 2.5).toFixed(3)});opacity:${ramp(f, t, t + 1.5).toFixed(3)}">${ICON[k]}</div>`).join("");

      // camera: a slow push, then a smash zoom onto the end of the prompt and the send button
      const s = keys(f, [[160, 1], [186, 1.05], [188, 1.07], [189, 1.55], [190, 2.05], [191, 2.28], [193, 2.4], [214, 2.52]]);
      const Px = keys(f, [[160, 960], [188, 990], [189, 1180], [190, 1310], [191, 1350], [214, 1372]]);
      const Py = keys(f, [[160, 560], [188, 562], [191, 578], [214, 584]]);
      const cam = $("#cam4");
      cam.style.transform = `translate(${px(960 - s * Px)}, ${px(540 - s * Py)}) scale(${s.toFixed(4)})`;
      cam.style.filter = blurOf(keys(f, [[187.5, 0], [188.5, 5], [190, 5], [191.5, 0]]));

      // send: the arrow turns up, a press with a ring, then the button stretches as we cut
      arrowSvg.style.transform = `rotate(${keys(f, [[195, 45], [198, 0]]).toFixed(2)}deg)`;
      const press = keys(f, [[199, 1], [201, 0.88], [203, 1.05], [205, 1]]);
      const stretch = keys(f, [[206, 1], [209, 1.2], [213, 1.5]]);
      send.style.transform = `scale(${press.toFixed(4)}, ${(press * stretch).toFixed(4)})`;
      send.style.background = mix("#F26B3A", "#FF8A5B", ramp(f, 200, 203) * (1 - ramp(f, 205, 210)) + ramp(f, 208, 213) * 0.6);
      const rr = lerp(70, 150, eo(ramp(f, 200, 208)));
      ring.style.width = ring.style.height = px(rr);
      ring.style.margin = px(-rr / 2) + " 0 0 " + px(-rr / 2);
      ring.style.opacity = (f >= 200 ? 0.9 * (1 - ramp(f, 202, 208)) : 0).toFixed(3);
    }

    // ---------- pills ----------
    function setPill(el, f, t0, text, k = 1, y = 540) {
      el.style.display = k > 0.002 ? "flex" : "none";
      const pop = back(ramp(f, t0, t0 + 4), 2);
      el.style.top = px(y);
      el.style.transform = `translate(-50%, -50%) scale(${(k * lerp(0.86, 1, pop)).toFixed(4)})`;
      el.style.opacity = ramp(f, t0, t0 + 1.5).toFixed(3);
      const pt = el.querySelector(".pt");
      if (pt.textContent !== text) pt.textContent = text;
      pt.style.backgroundPosition = `${(1.15 - (((f - t0) / 22) % 1.6)) * 100}% 0`;
      spinMark(el.querySelector(".mark"), f);
    }

    // ---------- S5: mail ----------
    const mrows = [...stage.querySelectorAll(".mrow")];
    function renderS5(f) {
      const cam = $("#cam5");
      cam.style.transform = `translateY(${px(lerp(0, -14, ramp(f, 214, 240)))}) scale(${lerp(1, 1.03, eo(ramp(f, 214, 240))).toFixed(4)})`;
      mrows.forEach((el, i) => {
        const t = i === 0 ? 214 : 216 + i * 1.6, a = eo(ramp(f, t, t + 3));
        el.style.opacity = a.toFixed(3);
        el.style.transform = `translateY(${px(16 * (1 - a))})`;
      });
      $("#inboxN").textContent = String(68 + Math.min(7, Math.max(0, Math.floor((f - 216) / 1.6))));
      setPill($("#pill5"), f, 214, "Finding what matters");
    }

    // ---------- S6: calendar ----------
    const evts = [...stage.querySelectorAll(".evt")];
    function renderS6(f) {
      const cam = $("#cam6");
      cam.style.transform = `translateY(${px(keys(f, [[240, 60], [262, 22], [280, 0]]))}) scale(${keys(f, [[240, 1.03], [280, 1]]).toFixed(4)})`;
      evts.forEach((el, i) => {
        const t = EVT[i][7], a = eo(ramp(f, t, t + 4));
        el.style.display = f >= t ? "block" : "none";
        el.style.transform = `scaleY(${lerp(0.2, 1, a).toFixed(4)})`;
        el.style.opacity = ramp(f, t, t + 1.5).toFixed(3);
        el.children[0].style.opacity = ramp(f, t + (i === 5 ? 8 : 2), t + (i === 5 ? 10 : 4)).toFixed(3);
      });
      setPill($("#pill6"), f, 240, "Organizing your day");
    }

    // ---------- S7: research ----------
    const srcs = [...stage.querySelectorAll(".src")], sk7 = [...stage.querySelectorAll(".sk7")], an7 = [...stage.querySelectorAll(".an7")];
    const Q7 = "How are teams using AI agents at work?";
    function renderS7(f) {
      const cam = $("#cam7");
      cam.style.transform = `scale(${lerp(1, 1.05, eio(ramp(f, 280, 352))).toFixed(4)})`;
      $("#q7").textContent = Q7.slice(0, Math.floor(clamp((f - 280) * 3.2, 0, Q7.length)));
      srcs.forEach((el, i) => {
        const t = 288 + i * 4, a = eo(ramp(f, t, t + 5));
        el.style.opacity = a.toFixed(3);
        el.style.transform = `translateY(${px(30 * (1 - a))})`;
      });
      growMark(stage.querySelector(".m7"), f, 300);
      sk7.forEach((el, i) => {
        el.style.background = `linear-gradient(90deg, #ece8e1 0%, #ece8e1 35%, #f7f4ef 50%, #ece8e1 65%, #ece8e1 100%)`;
        el.style.backgroundSize = "300% 100%";
        el.style.backgroundPosition = `${100 - (((f - 280 + i * 3) * 4) % 140)}% 0`;
        el.style.opacity = (ramp(f, 296 + i * 2, 300 + i * 2) * (1 - ramp(f, 328 + i * 5, 331 + i * 5))).toFixed(3);
      });
      an7.forEach((el, i) => {
        const t = 328 + i * 5, a = ramp(f, t, t + 6);
        el.style.clipPath = `inset(0 ${((1 - eo(a)) * 100).toFixed(2)}% 0 0)`;
        el.style.opacity = a > 0 ? 1 : 0;
      });
      const k = 1 - eo(ramp(f, 330, 335));
      setPill($("#pill7"), f, 280, f < 318 ? "Researching" : "Getting answers", k, 700);
    }

    // ---------- S8: team chat ----------
    const AV = (bg, ini) => `<div class="bx" style="width:108px;height:108px;border-radius:18px;background:${bg};color:#fff;font:600 42px Inter;display:grid;place-items:center">${ini}</div>`;
    const MSG = (y, av, name, time, text, extra = "") => `<div class="bx msg" style="left:0;top:${y}px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px">${av}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#1d1c1d">${name} <span style="font:400 30px Inter;color:#616061;margin-left:10px">${time}</span>${extra}</div>
        <div class="bx" style="left:717px;top:56px;font:400 40px Inter;color:#1d1c1d">${text}</div></div>`;
    const MEN = (t) => `<span style="color:#1264a3">${t}</span>`;
    $("#msgs").innerHTML =
      MSG(20, AV("#c2734f", "AB"), "Ava Brooks", "12:22", `Quick reminder: ${MEN("@Noah")} should send the final deck today`) +
      MSG(185, AV("#4f7cc2", "NK"), "Noah Kim", "12:24", `On it. I'll share the notes with ${MEN("@Mia")} and ${MEN("@Jon")} soon`) +
      MSG(350, AV("#8a6bbf", "ML"), "Mia Lopez", "12:45", `Great. I'll keep the thread open until ${MEN("@Noah")} shares the final draft`) +
      `<div class="bx msg" style="left:0;top:515px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px;width:108px;height:108px">${ICON.cal}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#1d1c1d">Calendar <span style="font:600 22px Inter;color:#616061;background:#ececec;border-radius:6px;padding:3px 8px;margin-left:8px;vertical-align:5px">APP</span> <span style="font:400 30px Inter;color:#616061;margin-left:6px">12:59</span></div>
        <div class="bx" style="left:717px;top:56px;font:400 40px Inter;color:#1d1c1d">Event starting in 30 seconds:</div>
        <div class="bx" style="left:717px;top:126px;width:6px;height:118px;border-radius:3px;background:#1d9bd1"></div>
        <div class="bx" style="left:752px;top:126px;font:700 40px Inter;color:#1264a3">Launch sync</div>
        <div class="bx" style="left:752px;top:186px;font:400 40px Inter;color:#1d1c1d">Today from 13:00 to 13:30</div></div>
      <div class="bx msg" id="m4" style="left:0;top:800px;width:1920px;height:10px">
        <div class="bx" style="left:567px;top:6px">${AV("#8a6bbf", "ML")}</div>
        <div class="bx" style="left:717px;top:0;font:700 40px Inter;color:#1d1c1d">Mia Lopez <span style="font:400 30px Inter;color:#616061;margin-left:10px">13:33</span></div>
        <div class="bx" id="file8" style="left:717px;top:190px;width:900px;height:140px;border:2px solid #dedede;border-radius:16px;background:#fff">
          <div class="bx" style="left:30px;top:34px;width:70px;height:70px">${ICON.doc}</div>
          <div class="bx" style="left:126px;top:24px;font:500 38px Inter;color:#1d1c1d">Launch plan v1</div>
          <div class="bx" style="left:126px;top:76px;font:400 30px Inter;color:#616061">Last edited just now</div></div></div>`;
    function renderS8(f) {
      $("#msgs").style.transform = `translateY(${px(keys(f, [[352, 30], [368, 0], [371, -6], [377, -290], [382, -300], [423, -318]]))})`;
      const m4 = $("#m4"), a4 = eo(ramp(f, 370, 374));
      m4.style.opacity = a4.toFixed(3);
      const fc = $("#file8"), af = back(ramp(f, 392, 397), 1.6);
      fc.style.opacity = ramp(f, 392, 394).toFixed(3);
      fc.style.transform = `translateY(${px(24 * (1 - eo(ramp(f, 392, 397))))}) scale(${lerp(0.94, 1, af).toFixed(4)})`;
      fc.style.transformOrigin = "0 0";
      setPill($("#pill8"), f, 352, "Drafting plan", 1, 600);
      $("#cam8").style.transform = `scale(${lerp(1, 1.025, ramp(f, 352, 423)).toFixed(4)})`;
    }

    // ---------- S9: mosaic background, the brief card ----------
    const mos = $("#mos"), mctx = mos.getContext("2d");
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const octx = off.getContext("2d");
    const CS = 96, COLS = 20, ROWS = 12;
    const cells = [];
    { const R = rng(77); for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) cells.push({ i, j, d: R(), t: R(), u: R() }); }
    const PAL = [
      ["#FCE5CF", "#F6AE6C", "#FFD6A8"], // orange
      ["#F7DFE4", "#EBA6C6", "#F7C2A6"], // pink
      ["#DFE6F6", "#A7BDEA", "#F2C9B4"], // blue
      ["#E3F0E6", "#A6D3B5", "#EEF4EA"], // green
      ["#ECE5F6", "#C3B2EA", "#F6D6C6"], // lilac
    ];
    function paintBg(f) {
      const p = DAY_T.reduce((a, t) => a + ramp(f, t, t + 7), 0);
      const k = Math.min(4, Math.floor(p)), q = p - k, n = Math.min(4, k + 1);
      const pal = [0, 1, 2].map((i) => mixHex(PAL[k][i], PAL[n][i], q));
      octx.globalAlpha = 1;
      octx.fillStyle = pal[0];
      octx.fillRect(0, 0, W, H);
      const blobs = [
        [380 + 140 * Math.sin(f * 0.021), 220 + 60 * Math.cos(f * 0.017), 760, pal[1], 0.9],
        [1620 - 120 * Math.sin(f * 0.019), 900, 820, pal[1], 0.85],
        [1150 + 90 * Math.cos(f * 0.023), 60, 620, pal[2], 0.9],
        [520, 1040 - 50 * Math.sin(f * 0.02), 560, "#ffffff", 0.6],
      ];
      blobs.forEach(([x, y, r, c, a]) => {
        const g = octx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, a));
        g.addColorStop(1, rgba(c, 0));
        octx.fillStyle = g;
        octx.fillRect(0, 0, W, H);
      });
      cells.forEach((c) => {
        octx.fillStyle = c.u < 0.5 ? `rgba(255,255,255,${(0.16 * c.t).toFixed(3)})` : rgba(pal[1], (0.14 * c.t).toFixed(3));
        octx.fillRect(c.i * CS, c.j * CS, CS, CS);
      });
      octx.strokeStyle = "rgba(255,255,255,0.42)";
      octx.lineWidth = 2;
      octx.beginPath();
      for (let x = CS; x < W; x += CS) { octx.moveTo(x, 0); octx.lineTo(x, H); }
      for (let y = CS; y < H; y += CS) { octx.moveTo(0, y); octx.lineTo(W, y); }
      octx.stroke();
    }
    const card = $("#card"), wd = $("#wd"), dg = $("#dg"), b1 = $("#b1"), b2 = $("#b2");
    const btn = card.querySelector(".btn"), foot = card.querySelector(".foot");
    const lines = (text) => {
      // break the body into the lines the card would wrap it into
      const F = "400 45px " + SERIF, out = [];
      let cur = "";
      text.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (measure(t, F) > 1400 && cur) { out.push(cur); cur = w; } else cur = t; });
      if (cur) out.push(cur);
      return out;
    };
    const bodyHTML = (text, f, t0, step) => lines(text).map((l, i) => {
      const a = ramp(f, t0 + i * step, t0 + (i + 1) * step);
      return `<span class="ln" style="clip-path:inset(0 ${((1 - a) * 100).toFixed(2)}% 0 0)">${l}</span>`;
    }).join("");
    function renderS9(f) {
      paintBg(f);
      mctx.clearRect(0, 0, W, H);
      if (f >= 422) mctx.drawImage(off, 0, 0);
      else cells.forEach((c) => {
        const t = 404 + 13 * (0.55 * c.d + 0.45 * (1 - c.i / COLS) * 0.6 + 0.45 * (c.j / ROWS) * 0.4);
        const a = ramp(f, t, t + 2.5);
        if (a <= 0) return;
        mctx.globalAlpha = a;
        mctx.drawImage(off, c.i * CS, c.j * CS, CS, CS, c.i * CS, c.j * CS, CS, CS);
        mctx.globalAlpha = 1;
      });

      // card: swings in skewed, settles, writes on; then a hard cut to a close-up
      const ci = ramp(f, 410, 424), cb = back(ci, 1.3);
      card.style.opacity = ramp(f, 410, 412).toFixed(3);
      card.style.transform = f < 424
        ? `translate(${px(lerp(-260, 0, cb))}, ${px(lerp(110, 0, cb))}) rotate(${lerp(-5, 0, cb).toFixed(3)}deg) skewY(${lerp(3.5, 0, eo(ci)).toFixed(3)}deg) scale(${lerp(0.78, 1, cb).toFixed(4)})`
        : "none";
      let s, tx, ty;
      if (f < 450) { s = lerp(1, 1.03, ramp(f, 424, 450)); tx = 960 * (1 - s); ty = 540 * (1 - s); }
      else { s = keys(f, [[450, 2.55], [570, 2.64]]); tx = keys(f, [[450, 279 - 2.55 * 174], [570, 250 - 2.64 * 174]]); ty = keys(f, [[450, 108 - 2.55 * 189], [570, 92 - 2.64 * 189]]); }
      $("#cam9").style.transform = `translate(${px(tx)}, ${px(ty)}) scale(${s.toFixed(4)})`;

      // which day, and how far through its change
      let k = 0;
      DAY_T.forEach((t) => { if (f >= t) k++; });
      const t0 = k > 0 ? DAY_T[k - 1] : -1e9;
      const day = DAYS[k], prev = DAYS[Math.max(0, k - 1)];
      const head = ramp(f, 418, 421);
      // weekday: the old one deletes letter by letter, the new one types in
      let wdText;
      if (k === 0) wdText = day.wd + ", ";
      else if (f < t0 + 3.5) wdText = (prev.wd + ", ").slice(0, Math.max(0, 5 - Math.floor((f - t0) * 1.6)));
      else wdText = (day.wd + ", ").slice(0, Math.min(5, Math.floor((f - t0 - 3.5) * 1.8)));
      wd.textContent = wdText;
      wd.style.width = px(measure((k > 0 && f < t0 + 3.5 ? prev.wd : day.wd) + ", ", "400 39px " + SERIF));
      // the date digit drops out, the new one comes in raised and settles
      const swap = k > 0 && f < t0 + 3;
      dg.textContent = swap ? prev.d : day.d;
      if (k > 0 && f < t0 + 3) { const a = ramp(f, t0 + 0.5, t0 + 3); dg.style.transform = `translateY(${px(16 * a)})`; dg.style.opacity = (1 - a).toFixed(3); }
      else if (k > 0) { const a = eo(ramp(f, t0 + 3, t0 + 9)); dg.style.transform = `translateY(${px(-18 * (1 - a))}) scale(${lerp(0.72, 1, a).toFixed(3)})`; dg.style.transformOrigin = "0 100%"; dg.style.opacity = ramp(f, t0 + 3, t0 + 4).toFixed(3); }
      else { dg.style.transform = "none"; dg.style.opacity = 1; }
      card.querySelector(".date").style.opacity = head.toFixed(3);
      card.querySelector(".ttl").style.opacity = head.toFixed(3);
      card.querySelector(".rule").style.opacity = head.toFixed(3);
      // body: Mon writes on line by line; later days push the old text up and out and bring the new one up from below
      if (k === 0) {
        b1.innerHTML = bodyHTML(day.b1, f, 423, 4);
        b2.innerHTML = bodyHTML(day.b2, f, 434, 4.5);
        b1.style.transform = b2.style.transform = "none";
        b1.style.opacity = b2.style.opacity = 1;
        b1.style.filter = "none";
      } else {
        const out = f < t0 + 5;
        const src = out ? prev : day;
        b1.innerHTML = bodyHTML(src.b1, 1e9, 0, 1).replace(/clip-path:[^"]*/g, "");
        const a = out ? eo(ramp(f, t0 + 1, t0 + 5)) : 1 - eo(ramp(f, t0 + 5, t0 + 9));
        b1.style.transform = `translateY(${px((out ? -30 : 30) * a)})`;
        b1.style.opacity = (1 - a).toFixed(3);
        b1.style.filter = blurOf(6 * a);
        b2.style.opacity = k === 1 && out ? (1 - a).toFixed(3) : 0;
      }
      foot.style.opacity = ramp(f, 430, 433).toFixed(3);
      btn.style.opacity = ramp(f, 430, 431).toFixed(3);
      btn.style.transform = `scaleY(${back(ramp(f, 430, 434), 2).toFixed(4)})`;
    }

    // ---------- S10/S11: tagline types, breaks into squares, squares rebuild the end card ----------
    const t10 = [...stage.querySelectorAll(".t10")], e11 = [...stage.querySelectorAll(".e11")], m11 = $(".m11"), tcur = $("#tcur");
    const F10 = "400 50px " + SERIF, F11 = "560 66px " + SERIF, MK11 = 118;
    const TT = []; // when each tagline letter appears
    { let t = 573; TAG.split("").forEach((c, i) => { TT.push(t); t += c === " " ? 2.6 : 1.8; }); }
    const T10_DONE = TT[TT.length - 1];
    // one square per tagline letter; ten become the end letters, four the corner marks, the rest dive into the mark
    const SQ = [];
    {
      const R = rng(404);
      const letters = TAG.split("").map((c, i) => [c, i]).filter(([c]) => c !== " ");
      const ends = END.split("").map((c, i) => [c, i]).filter(([c]) => c !== " ");
      const order = letters.map((_, i) => i).sort(() => R() - 0.5);
      letters.forEach(([c, li], n) => {
        const slot = order[n];
        const role = slot < ends.length ? ["end", ends[slot][1]] : slot < ends.length + 4 ? ["corner", slot - ends.length] : ["mark", 0];
        SQ.push({ li, role, size: 11 + R() * 11, tb: 627 + R() * 4, tm: 632 + R() * 3, dur: 8 + R() * 3, jx: (R() - 0.5) * 70, jy: (R() - 0.5) * 60 });
      });
    }
    const sqs = $("#sqs");
    sqs.innerHTML = SQ.map(() => `<i class="sq"></i>`).join("");
    function renderS10(f) {
      orb10(f);
      const tw = (n) => measure(TAG.slice(0, n), F10);
      const nTyped = TT.filter((t) => t <= f).length;
      const left = 960 - tw(nTyped) / 2;
      const broke = (i) => SQ.find((q) => q.li === i);
      t10.forEach((el, i) => {
        const q = broke(i);
        const on = TT[i] <= f && !(q && f >= q.tb);
        el.style.display = on ? "block" : "none";
        if (!on) return;
        el.style.font = F10;
        el.style.color = "#1f1e1c";
        el.style.transform = `translate(${px(left + tw(i))}, ${px(540 - 33)})`;
      });
      const blink = f < T10_DONE + 2 || Math.floor((f - T10_DONE) / 8) % 2 === 0;
      tcur.style.display = f >= 571 && f < 627 && blink ? "block" : "none";
      tcur.style.transform = `translate(${px(left + tw(nTyped) + 4)}, ${px(540 - 33)})`;

      // end layout
      const ew = measure(END, F11), gw = MK11 + 30 + ew, gl = 960 - gw / 2;
      const tl0 = gl + MK11 + 30;
      const corners = [[gl - 64, 540 - 86], [gl + gw + 64, 540 - 86], [gl - 64, 540 + 86], [gl + gw + 64, 540 + 86]];
      const fullLeft = 960 - tw(TAG.length) / 2;
      const arrive = {};
      [...sqs.children].forEach((el, n) => {
        const q = SQ[n];
        const lw = measure(TAG[q.li], F10);
        const sx = fullLeft + tw(q.li) + lw / 2, sy = 540 - 4;
        let tx, ty, endSize;
        if (q.role[0] === "end") { const j = q.role[1]; tx = tl0 + measure(END.slice(0, j), F11) + measure(END[j], F11) / 2; ty = 540 - 4; endSize = q.size * 0.8; }
        else if (q.role[0] === "corner") { [tx, ty] = corners[q.role[1]]; endSize = 11; }
        else { tx = gl + MK11 / 2; ty = 540; endSize = 0; }
        const ta = q.tm + q.dur;
        if (q.role[0] === "end") arrive[q.role[1]] = ta;
        const on = f >= q.tb && (q.role[0] === "corner" || f < ta + 2);
        el.style.display = on ? "block" : "none";
        if (!on) return;
        const hover = eo(ramp(f, q.tb, q.tm + 1));
        const hx = sx + q.jx * hover, hy = sy + q.jy * hover;
        const m = eio(ramp(f, q.tm, ta));
        const x = lerp(hx, tx, m), y = lerp(hy, ty, m) - Math.sin(Math.PI * m) * 40;
        let size = lerp(q.size * back(ramp(f, q.tb, q.tb + 2), 2), endSize, eo(ramp(f, ta - 3, ta + 1)));
        if (q.role[0] === "end") size *= 1 - ramp(f, ta, ta + 2);
        el.style.width = el.style.height = px(Math.max(0, size));
        el.style.transform = `translate(${px(x - size / 2)}, ${px(y - size / 2)})`;
      });
      e11.forEach((el, j) => {
        const t = END[j] === " " ? 1e9 : arrive[j];
        el.style.display = f >= t ? "block" : "none";
        el.style.font = F11;
        el.style.color = "#1f1e1c";
        el.style.opacity = ramp(f, t, t + 1.5).toFixed(3);
        el.style.transform = `translate(${px(tl0 + measure(END.slice(0, j), F11))}, ${px(540 - 44)})`;
      });
      vis(m11, f >= 634, "block");
      m11.style.width = m11.style.height = px(MK11);
      m11.style.left = px(gl);
      m11.style.top = px(540 - MK11 / 2);
      growMark(m11, f, 634, -60);
      $("#endG").style.transform = `scale(${(1 + 0.03 * eio(ramp(f, 648, 700))).toFixed(4)})`;
    }

    // ---------- frame ----------
    function render(t) {
      const f = clamp(t, 0, FRAMES - 0.001);
      const R = [["s1", f < 58], ["s2", f >= 58 && f < 108], ["s3", f >= 108 && f < 160], ["s4", f >= 160 && f < 214], ["s5", f >= 214 && f < 240],
        ["s6", f >= 240 && f < 280], ["s7", f >= 280 && f < 352], ["s8", f >= 352 && f < 423], ["s9", f >= 404 && f < 570], ["s10", f >= 570]];
      R.forEach(([k, on]) => vis(sc[k], on));
      if (f < 58) renderS1(f);
      else if (f < 108) renderS2(f);
      else if (f < 160) renderS3(f);
      else if (f < 214) renderS4(f);
      else if (f < 240) renderS5(f);
      else if (f < 280) renderS6(f);
      else if (f < 352) renderS7(f);
      if (f >= 352 && f < 423) renderS8(f);
      if (f >= 404 && f < 570) renderS9(f);
      if (f >= 570) renderS10(f);
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
