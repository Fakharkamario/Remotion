// App launch promo: 21 s, 30 fps, 630 frames. Cut to assets/voiceover.mp3 (the supplied read, opened up with
// pauses) over assets/music.mp3 at 100 BPM, so a beat is 18 frames and a bar is 72.
// Look: white wall with soft window light, glassy blue shapes, a blue pointer that leads the eye, words that
// settle out of a blur, a camera that never stops drifting. Everything is a pure function of the frame.
//   0–110    "Launching your app?" / "Make people notice it."   app icon, pointer, the icon gets noticed
//   110–146  pause                                              the pointer taps the icon; we fly into it
//   136–307  "We create eye-catching animated videos …"         a video being animated; push into the phone
//            "… that show what your app does and why people need it."   the app UI builds; callouts; a 5-star review
//   307–356  pause                                              the goal ring completes in the app
//   352–448  "Simple, clear, and made to get downloads."        two words, then a Download button
//   448–502  pause                                              tap; downloads count up along a rising line
//   498–630  "Message us today."                                the call-to-action button, a tap, hold
(function () {
  const FPS = 30, FRAMES = 630;
  const SUB = 0; // sub-frame time offset; scripts/render-mb.sh sets it for its second, interleaved pass
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const eo5 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
  const ei = (t) => Math.pow(clamp(t, 0, 1), 3);
  const eio = (t) => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bump = (f, t, w = 5) => { const p = 1 - Math.abs(f - t) / w; return p <= 0 ? 0 : p * p * (3 - 2 * p); }; // soft 0 → 1 → 0 around t
  // gentle settle with one small overshoot
  const soft = (f, t0, d) => { const p = (f - t0) / d; return p <= 0 ? 0 : p >= 2.2 ? 1 : 1 - Math.exp(-4.2 * p) * Math.cos(3.2 * p); };
  // smooth lookup through [frame, value] pairs: a monotone cubic that passes through every key and never overshoots
  const slope = (p, i) => (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
  const tangent = (p, k) => {
    const n = p.length;
    if (k === 0 || k === n - 1) return 0;
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
  const blurOf = (b) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
  // translate / scale / rotate, opacity and blur in one call
  const put = (el, o) => {
    el.style.transform = `translate(${(o.x || 0).toFixed(2)}px, ${(o.y || 0).toFixed(2)}px) rotate(${(o.r || 0).toFixed(3)}deg) scale(${(o.s === undefined ? 1 : o.s).toFixed(4)})`;
    if (o.o !== undefined) el.style.opacity = clamp(o.o, 0, 1).toFixed(3);
    if (o.b !== undefined) el.style.filter = blurOf(o.b);
  };

  const SPARK = '<path d="M50 8 C54 34 66 46 92 50 C66 54 54 66 50 92 C46 66 34 54 8 50 C34 46 46 34 50 8Z" fill="#fff"/>';
  const STAR = "M12 2.6l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.1 6.3 20.2l1.2-6.4L2.8 9.3l6.4-.8z";
  const ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5C6 16.4 3 13.2 3 9.4 3 6.8 5 5 7.3 5c1.9 0 3.5 1 4.7 2.8C13.2 6 14.800 5 16.700 5 19 5 21 6.8 21 9.4c0 3.8-3 7-9 11.100z" fill="#ff5d7a"/></svg>',
    star: `<svg viewBox="0 0 24 24"><path d="${STAR}" fill="#ffb629"/></svg>`,
    up: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a84f5"/><path d="M7.5 13.500l3-3 2.500 2.500 3.500-4M13.500 9h3v3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" fill="none" stroke="#fff" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M12 3.500c5 0 9 3.400 9 7.700s-4 7.700-9 7.700c-1 0-2-.1-2.900-.4L4.500 20.500l1.100-3.700C4 15.400 3 13.400 3 11.200c0-4.300 4-7.700 9-7.700z" fill="#1a84f5"/><circle cx="8.200" cy="11.200" r="1.200" fill="#fff"/><circle cx="12" cy="11.200" r="1.200" fill="#fff"/><circle cx="15.800" cy="11.200" r="1.200" fill="#fff"/></svg>',
    play: '<svg viewBox="0 0 28 30"><path d="M4 3.500v23a2 2 0 0 0 3 1.700l19-11.500a2 2 0 0 0 0-3.400L7 1.800a2 2 0 0 0-3 1.700z" fill="#fff"/></svg>',
  };
  // [text, frame, class]; a "/" entry is a line break
  const words = (spec) => spec.map((w) => (w === "/" ? "<br>" : `<span class="w ${w[2] || ""}" data-t="${w[1]}">${w[0]}</span>`)).join(" ");

  // rising line for the downloads chart (1480 × 460)
  const PTS = [[0, 430], [150, 400], [300, 410], [450, 340], [600, 350], [760, 265], [920, 275], [1080, 180], [1240, 150], [1480, 30]];
  const chartPath = PTS.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const segLen = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
  const totLen = segLen.reduce((a, b) => a + b, 0);
  const ptAt = segLen.reduce((a, l) => (a.push(a[a.length - 1] + l / totLen), a), [0]);

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <div id="bg"><i class="band b1"></i><i class="band b2"></i><i class="band b3"></i></div>

      <div class="scene" id="s1"><div class="cam">
        <i class="ring"></i><i class="ring"></i><i class="ring"></i>
        <div class="chip glass" style="left:470px;top:262px">${ICON.heart}12.4k likes</div>
        <div class="chip glass" style="left:1210px;top:236px">${ICON.star}4.9 rating</div>
        <div class="chip glass" style="left:540px;top:432px">${ICON.up}Trending today</div>
        <div id="icon" class="abs blue"><svg viewBox="0 0 100 100">${SPARK}</svg></div>
        <div class="line" id="l1" style="top:612px;font-size:112px">${words([["Launching", 18], ["your", 29], ["app?", 34, "bl"]])}</div>
        <div class="line" id="l2" style="top:612px;font-size:112px">${words([["Make", 69], ["people", 74], ["notice", 84, "bl"], ["it.", 94, "bl"]])}</div>
      </div></div>

      <div class="scene" id="s2"><div class="cam">
        <div id="edit" class="layer" style="transform-origin:960px 540px">
          <div class="line" id="t1" style="top:92px;font-size:78px">${words([["We", 150], ["create", 153], ["eye&#8209;catching", 163, "bl"], ["animated", 182], ["videos", 196]])}</div>
          <div id="vcard" class="abs">
            <i class="glow" style="left:-80px;top:260px;width:460px;height:460px;background:rgba(80,165,255,.5)"></i>
            <i class="glow" style="left:720px;top:-160px;width:520px;height:520px;background:rgba(255,255,255,.9)"></i>
            <div class="mini glass" id="m1" style="left:92px;top:150px;width:230px;height:200px">
              <div style="font:600 20px Inter;color:#7b8190;letter-spacing:-.01em">This week</div>
              <div style="display:flex;align-items:flex-end;gap:12px;height:110px;margin-top:22px">${[46, 70, 58, 96, 80].map((h) => `<i class="bar" style="width:26px;height:${h}px;border-radius:9px;background:linear-gradient(180deg,#6ec4ff,#1a84f5);transform-origin:50% 100%"></i>`).join("")}</div>
            </div>
            <div class="mini glass" id="m2" style="left:770px;top:226px;width:240px;height:150px">
              <div style="display:flex;align-items:center;gap:12px"><i style="width:44px;height:44px;border-radius:14px;background:linear-gradient(160deg,#6ec4ff,#0c66e4)"></i><div><div style="font:600 20px Inter;letter-spacing:-.01em">New streak</div><div style="font:450 16px Inter;color:#8a90a0;margin-top:3px">7 days in a row</div></div></div>
              <div style="margin-top:22px;height:14px;border-radius:7px;background:#e3ecf8;overflow:hidden"><i id="m2bar" style="display:block;height:100%;width:100%;border-radius:7px;background:linear-gradient(90deg,#6ec4ff,#1a84f5);transform-origin:0 50%"></i></div>
            </div>
            <i id="shim"></i>
          </div>
          <i class="hd" style="left:411px;top:227px"></i><i class="hd" style="left:1491px;top:227px"></i><i class="hd" style="left:411px;top:787px"></i><i class="hd" style="left:1491px;top:787px"></i>
          <div id="tl" class="abs glass">
            <div id="play" class="blue">${ICON.play}</div>
            <i class="trk" style="top:22px;width:560px;background:linear-gradient(90deg,#6ec4ff,#1a84f5)"></i>
            <i class="trk" style="top:52px;left:260px;width:640px;background:#bcdcff"></i>
            <i class="trk" style="top:82px;left:190px;width:420px;background:#d9d2ff"></i>
            ${[[236, 25], [470, 25], [660, 25], [372, 55], [760, 55], [300, 85], [560, 85]].map((k) => `<i class="kf" data-x="${k[0]}" style="left:${k[0]}px;top:${k[1]}px;transform:rotate(45deg)"></i>`).join("")}
            <i id="head"></i>
          </div>
        </div>
        <div id="halo" class="abs"></div>
        <div class="wire" id="w1" style="left:330px;top:356px;width:98px"></div>
        <div class="wire" id="w2" style="left:316px;top:652px;width:112px"></div>
        <div class="call glass" id="c1" style="left:70px;top:322px"><i></i>Daily goals</div>
        <div class="call glass" id="c2" style="left:28px;top:618px"><i></i>Smart reminders</div>
        <div id="phw" class="abs"><div id="ph"><div id="scr">
          <div id="isl"></div>
          <div class="ui" style="top:54px"><div style="font:450 12px Inter;color:#8a90a0">Good morning</div><div style="font:650 27px Inter;letter-spacing:-.03em;margin-top:2px">Today</div></div>
          <div class="ui ucard" style="top:122px;height:156px">
            <svg viewBox="0 0 120 120" style="position:absolute;left:14px;top:18px;width:120px;height:120px"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6ec4ff"/><stop offset="1" stop-color="#0c66e4"/></linearGradient></defs>
              <circle cx="60" cy="60" r="46" fill="none" stroke="#e6edf7" stroke-width="12"/>
              <circle id="ringp" cx="60" cy="60" r="46" fill="none" stroke="url(#rg)" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="100" transform="rotate(-90 60 60)"/>
              <text id="ringt" x="60" y="68" text-anchor="middle" style="font:650 24px Inter;letter-spacing:-.03em;fill:#1b1c20">0%</text></svg>
            <div style="position:absolute;left:148px;top:38px"><div style="font:450 12px Inter;color:#8a90a0">Daily goal</div><div style="font:650 22px Inter;letter-spacing:-.03em;margin-top:3px">4 of 5</div><div style="font:500 11px Inter;color:#1a84f5;margin-top:12px">Keep going</div></div>
          </div>
          <div class="ui ucard row" style="top:290px"><i style="background:#e3f1ff"></i><div><b>Morning run</b><span>5.2 km · 28 min</span></div><em></em></div>
          <div class="ui ucard row" style="top:360px"><i style="background:#ece8ff"></i><div><b>Read 20 pages</b><span>Evening</span></div><em></em></div>
          <div class="ui ucard row" style="top:430px"><i style="background:#ffeede"></i><div><b>Drink water</b><span>6 of 8 glasses</span></div><em></em></div>
          <div class="ui" style="top:522px;display:flex;justify-content:space-around;padding:0 20px">${[1, 0, 0, 0].map((a) => `<i style="width:${a ? 34 : 12}px;height:12px;border-radius:6px;background:${a ? "#1a84f5" : "#d5dbe6"}"></i>`).join("")}</div>
          <div id="toast">${ICON.check.replace("<svg", '<svg style="width:20px;height:20px"')}Goal reached</div>
          <div id="splash"><svg viewBox="0 0 100 100">${SPARK}</svg></div>
        </div></div></div>
        <div class="t2" id="t2">${words([["that", 214], ["show", 224], ["what", 232], "/", ["your", 238, "bl"], ["app", 241, "bl"], ["does", 247, "bl"]])}</div>
        <div class="t2" id="t3">${words([["and", 260], ["why", 274], ["people", 283], "/", ["need", 291, "bl"], ["it.", 299, "bl"]])}</div>
        <div id="rev" class="abs glass"><i class="av"></i><div id="stars">${[0, 1, 2, 3, 4].map(() => `<svg viewBox="0 0 24 24"><path d="${STAR}" fill="#e3e8f0"/><path class="sf" d="${STAR}" fill="#ffb629"/></svg>`).join("")}</div><q>4.9</q><p>“Exactly what I needed.”</p></div>
      </div></div>

      <div class="scene" id="s3"><div class="cam">
        <div class="line" id="sw">${words([["Simple.", 362], ["Clear.", 380, "bl"]])}</div>
        <div class="line" id="l3">${words([["and", 405], ["made", 407], ["to", 414], ["get", 421], ["downloads.", 426, "bl"]])}</div>
        <div id="cnt" class="abs"><small>Downloads</small><b id="num">0</b></div>
        <svg id="chart" class="abs" width="1480" height="460" viewBox="0 0 1480 460">
          <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b90f7" stop-opacity=".22"/><stop offset="1" stop-color="#2b90f7" stop-opacity="0"/></linearGradient>
          <clipPath id="clipc"><rect id="clipr" x="0" y="-40" width="0" height="560"/></clipPath></defs>
          <path d="${chartPath} L1480 460 L0 460Z" fill="url(#ar)" clip-path="url(#clipc)"/>
          <path id="cline" d="${chartPath}" fill="none" stroke="#2b90f7" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" style="filter:drop-shadow(0 8px 14px rgba(26,132,245,.45))"/>
          ${PTS.map((p) => `<circle class="cd" cx="${p[0]}" cy="${p[1]}" r="13" fill="#2b90f7" stroke="#fff" stroke-width="5" style="transform-box:fill-box;transform-origin:50% 50%"/>`).join("")}
        </svg>
        <div id="dlw" class="abs">
          <i class="hal" id="h1" style="left:-70px;top:-70px;right:-70px;bottom:-70px"></i>
          <i class="hal" id="h2" style="left:-34px;top:-34px;right:-34px;bottom:-34px"></i>
          <div id="dl" class="blue"><i id="dlfill"></i><div class="lab" id="la">${ICON.down}Download</div><div class="lab" id="lb">${ICON.check}Downloaded</div></div>
        </div>
      </div></div>

      <div class="scene" id="s4"><div class="cam">
        <div id="ctaw" class="abs">
          <i class="hal" id="h3" style="left:-150px;top:-150px;right:-150px;bottom:-150px"></i>
          <i class="hal" id="h4" style="left:-72px;top:-72px;right:-72px;bottom:-72px"></i>
          <i id="rip"></i>
          <div id="cta" class="blue"><div id="cico">${ICON.chat}</div><div id="ctxt">${words([["Message", 505], ["us", 511], ["today", 517]])}</div></div>
        </div>
        <div class="line" id="cap">Animated promo videos for your app</div>
      </div></div>

      <div class="blob" id="blobB"></div><div class="blob" id="blobA"></div>
      <svg id="cur" viewBox="0 0 120 120"><defs>
        <linearGradient id="cg" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#7accff"/><stop offset=".45" stop-color="#2590f8"/><stop offset="1" stop-color="#0b5fe0"/></linearGradient>
        <linearGradient id="ch" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <g style="filter:drop-shadow(0 14px 16px rgba(20,110,240,.42)) drop-shadow(0 2px 4px rgba(20,110,240,.3))">
          <path d="M60 8 Q66 8 70 17 L103 91 Q109 106 94 101 Q76 93 60 93 Q44 93 26 101 Q11 106 17 91 L50 17 Q54 8 60 8Z" fill="url(#cg)"/>
          <path d="M60 14 Q63 14 66 20 L80 52 Q62 40 40 52 L54 20 Q57 14 60 14Z" fill="url(#ch)"/>
        </g></svg>`;

    const $ = (s) => stage.querySelector(s), $$ = (s) => [...stage.querySelectorAll(s)];
    const sc = { s1: $("#s1"), s2: $("#s2"), s3: $("#s3"), s4: $("#s4") };
    const cams = { s1: $("#s1 .cam"), s2: $("#s2 .cam"), s3: $("#s3 .cam"), s4: $("#s4 .cam") };
    const W = {}; // words by container
    ["l1", "l2", "t1", "t2", "t3", "sw", "l3", "ctxt"].forEach((id) => (W[id] = $$(`#${id} .w`).map((el) => [el, +el.dataset.t])));
    const driveWords = (id, f, d = 11) => W[id].forEach(([el, t]) => { const k = eo(ramp(f, t, t + d)); put(el, { y: 22 * (1 - k), o: k, b: 14 * (1 - k) }); });
    const bands = $$(".band"), rings = $$(".ring"), chips = $$(".chip"), bars = $$(".bar"), kfs = $$(".kf"), trks = $$(".trk"), hds = $$(".hd");
    const uis = $$("#scr .ui"), sfs = $$(".sf"), cds = $$(".cd"), ems = $$(".row em");
    const vis = (el, on) => { el.style.display = on ? "block" : "none"; };

    function renderBg(f) {
      bands.forEach((b, i) => { b.style.transform = `translate(${(-60 + f * (0.22 + i * 0.07)).toFixed(2)}px, ${(Math.sin(f / 90 + i) * 14).toFixed(2)}px) rotate(${-21 + i * 1.5}deg)`; });
    }

    // ---------- S1: the app, and getting it noticed ----------
    const CHIP_T = [86, 91, 96], CHIP_FROM = [[330, 90], [-330, 110], [270, -70]];
    function renderS1(f) {
      put(cams.s1, { s: 1 + 0.05 * (f / 120) });
      const zoom = ei(ramp(f, 122, 147)), k = eo5(ramp(f, 3, 26));
      put($("#icon"), { s: (0.55 + 0.45 * k) * (1 + 0.06 * bump(f, 86, 7)) * (1 - 0.07 * bump(f, 119, 4)) * (1 + 17 * zoom), y: 5 * Math.sin(f / 22) * (1 - zoom), o: k, b: 20 * (1 - k) });
      $("#icon svg").style.opacity = (1 - ramp(f, 123, 133)).toFixed(3);
      rings.forEach((r, i) => { const p = ramp(f, 85 + i * 8, 118 + i * 8); put(r, { s: 1 + 1.5 * eo(p), o: p > 0 && p < 1 ? 0.55 * (1 - p) : 0 }); });
      const out = eo(ramp(f, 118, 129));
      chips.forEach((c, i) => {
        const p = soft(f, CHIP_T[i], 9), a = ramp(f, CHIP_T[i], CHIP_T[i] + 8);
        put(c, { x: CHIP_FROM[i][0] * (1 - p) * 0.5, y: CHIP_FROM[i][1] * (1 - p) * 0.5 + 6 * Math.sin(f / 17 + i * 2), s: (0.7 + 0.3 * p) * (1 + 0.3 * out), o: a * (1 - out), b: 12 * (1 - a) + 12 * out });
      });
      driveWords("l1", f); driveWords("l2", f);
      const x1 = eio(ramp(f, 57, 68));
      put($("#l1"), { y: -34 * x1, o: 1 - x1, b: 16 * x1 });
      put($("#l2"), { y: -30 * out, o: 1 - out, b: 16 * out });
    }

    // ---------- S2: what the video is, and what it shows ----------
    function renderS2(f) {
      const inn = eo(ramp(f, 134, 160)), out = eio(ramp(f, 340, 356));
      put(cams.s2, { s: (1.16 - 0.16 * inn) * (1 + 0.012 * ramp(f, 160, 340)) * (1 + 0.22 * out), b: 18 * (1 - eo(ramp(f, 134, 150))) + 22 * out });
      sc.s2.style.opacity = (ramp(f, 134, 146)).toFixed(3);
      const push = eio(ramp(f, 205, 232));
      // editing view
      put($("#edit"), { s: 1 + 0.2 * push, o: 1 - ramp(f, 205, 222), b: 16 * push });
      driveWords("t1", f);
      const sh = ramp(f, 160, 186);
      $("#shim").style.left = lerp(-320, 1200, eio(sh)) + "px";
      $("#shim").style.opacity = (sh > 0 && sh < 1 ? 1 : 0);
      [["#m1", 164, -60], ["#m2", 174, 60]].forEach(([id, t, dx]) => { const p = eo(ramp(f, t, t + 16)); put($(id), { x: dx * (1 - p), y: 5 * Math.sin(f / 19 + t), o: p, b: 10 * (1 - p) }); });
      bars.forEach((b, i) => { b.style.transform = `scaleY(${eo(ramp(f, 170 + i * 3, 188 + i * 3)).toFixed(4)})`; });
      $("#m2bar").style.transform = `scaleX(${(0.2 + 0.8 * eio(ramp(f, 180, 208))).toFixed(4)})`;
      hds.forEach((h, i) => { h.style.opacity = eo(ramp(f, 150 + i * 2, 158 + i * 2)).toFixed(3); });
      trks.forEach((t, i) => { t.style.transform = `scaleX(${eo(ramp(f, 144 + i * 4, 166 + i * 4)).toFixed(4)})`; });
      const hx = lerp(150, 880, eio(ramp(f, 152, 210)));
      $("#head").style.transform = `translateX(${hx.toFixed(2)}px)`;
      kfs.forEach((k) => { const x = +k.dataset.x, hit = bump(hx, x, 46); k.style.background = hx > x ? "#1a84f5" : "#fff"; k.style.transform = `rotate(45deg) scale(${(1 + 0.5 * hit).toFixed(3)})`; k.style.opacity = eo(ramp(f, 156, 166)).toFixed(3); });
      // phone: plays inside the card, then comes forward
      const pin = eo5(ramp(f, 142, 172));
      const rotY = keys(f, [[142, 30], [176, -16], [210, 6], [232, 9], [300, 5], [340, 7]]);
      const bx = lerp(0, -350, push), by = lerp(0, 24, push) + 240 * (1 - pin) + 5 * Math.sin(f / 24);
      put($("#phw"), { x: bx, y: by, s: lerp(0.76, 1.3, push), o: ramp(f, 142, 152) });
      $("#ph").style.transform = `rotateY(${rotY.toFixed(3)}deg) rotateZ(${(-6 * (1 - pin)).toFixed(3)}deg)`;
      $("#splash").style.opacity = (1 - ramp(f, 214, 226)).toFixed(3);
      uis.forEach((u, i) => { const p = eo(ramp(f, 218 + i * 4, 234 + i * 4)); put(u, { y: 26 * (1 - p), o: p }); });
      const goal = 72 * eo(ramp(f, 226, 252)) + 28 * eio(ramp(f, 306, 330));
      $("#ringp").setAttribute("stroke-dashoffset", (100 - goal).toFixed(2));
      $("#ringt").textContent = Math.round(goal) + "%";
      ems.forEach((e, i) => { const on = f >= [244, 250, 322][i]; e.style.background = on ? "#1a84f5" : "transparent"; e.style.borderColor = on ? "#1a84f5" : "#d5dbe6"; });
      const tp = soft(f, 328, 8);
      put($("#toast"), { y: -70 * (1 - tp), o: ramp(f, 328, 333) });
      put($("#halo"), { s: 0.7 + 0.5 * eo(ramp(f, 326, 350)), o: 0.9 * bump(f, 336, 14) });
      // callouts
      const cOut = eo(ramp(f, 253, 263));
      [["#c1", "#w1", 236], ["#c2", "#w2", 246]].forEach(([c, w, t]) => {
        const p = eo(ramp(f, t, t + 14));
        put($(c), { x: -40 * (1 - p) - 30 * cOut, y: 4 * Math.sin(f / 18 + t), o: p * (1 - cOut), b: 10 * (1 - p) + 10 * cOut });
        $(w).style.transform = `scaleX(${eo(ramp(f, t + 6, t + 18)).toFixed(4)})`;
        $(w).style.opacity = (1 - cOut).toFixed(3);
      });
      // copy on the right
      driveWords("t2", f); driveWords("t3", f);
      const x2 = eio(ramp(f, 252, 262));
      put($("#t2"), { y: -30 * x2, o: 1 - x2, b: 14 * x2 });
      const rp = eo(ramp(f, 264, 280));
      put($("#rev"), { y: 40 * (1 - rp) + 4 * Math.sin(f / 21), s: 0.92 + 0.08 * rp, o: rp, b: 12 * (1 - rp) });
      sfs.forEach((s, i) => { const t = 272 + i * 6; s.style.opacity = ramp(f, t, t + 4).toFixed(3); s.style.transformOrigin = "12px 12px"; s.style.transform = `scale(${(0.4 + 0.6 * soft(f, t, 5)).toFixed(4)})`; });
    }

    // ---------- S3: simple, clear, downloads ----------
    function renderS3(f) {
      const out = eio(ramp(f, 491, 503));
      put(cams.s3, { s: (1.08 - 0.08 * eo(ramp(f, 352, 376))) * (1 + 0.02 * ramp(f, 376, 488)) * (1 + 0.2 * out), b: 16 * (1 - eo(ramp(f, 352, 366))) + 20 * out });
      driveWords("sw", f, 12); driveWords("l3", f);
      const up = eio(ramp(f, 397, 415)), go = eio(ramp(f, 450, 468));
      put($("#sw"), { y: -212 * up - 40 * go, s: 1 - 0.52 * up, o: 1 - go, b: 14 * go });
      put($("#l3"), { y: -40 * go, o: 1 - go, b: 14 * go });
      // button
      const bi = eo5(ramp(f, 409, 430));
      put($("#dlw"), { y: lerp(40 * (1 - bi), -430, go), s: (0.8 + 0.2 * bi) * (1 - 0.3 * go), o: bi, b: 14 * (1 - bi) });
      put($("#dl"), { s: 1 - 0.06 * bump(f, 447, 4) });
      put($("#h2"), { s: 0.8 + 0.2 * eo(ramp(f, 413, 436)) + 0.05 * bump(f, 452, 9), o: eo(ramp(f, 413, 432)) });
      put($("#h1"), { s: 0.7 + 0.3 * eo(ramp(f, 417, 444)) + 0.08 * bump(f, 456, 11), o: eo(ramp(f, 417, 440)) });
      $("#dlfill").style.width = (440 * eio(ramp(f, 449, 474))).toFixed(1) + "px";
      const sw = ramp(f, 472, 479);
      put($("#la"), { y: -18 * sw, o: 1 - sw }); put($("#lb"), { y: 18 * (1 - sw), o: sw });
      // counter and chart
      const ci = eo(ramp(f, 454, 470)), d = eio(ramp(f, 454, 489));
      put($("#cnt"), { y: 30 * (1 - ci), o: ci, b: 10 * (1 - ci) });
      $("#num").textContent = Math.round(128409 * d).toLocaleString("en-US");
      $("#cline").setAttribute("stroke-dashoffset", (1 - d).toFixed(4));
      $("#clipr").setAttribute("width", (1480 * d).toFixed(1));
      $("#chart").style.opacity = ci.toFixed(3);
      cds.forEach((c, i) => { const t = 454 + 35 * invEio(ptAt[i]); c.style.opacity = f >= t ? 1 : 0; c.style.transform = `scale(${soft(f, t, 5).toFixed(4)})`; });
    }
    // frame fraction at which the eased line reaches a given share of its length
    function invEio(v) { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (eio(m) < v) a = m; else b = m; } return (a + b) / 2; }

    // ---------- S4: call to action ----------
    function renderS4(f) {
      const pull = eio(ramp(f, 496, 550));
      put(cams.s4, { s: lerp(1.55, 1, pull) * (1 + 0.035 * eio(ramp(f, 550, 630))), b: 14 * (1 - eo(ramp(f, 498, 512))) });
      driveWords("ctxt", f);
      const bi = eo5(ramp(f, 498, 522));
      put($("#ctaw"), { y: 4 * Math.sin(f / 26), o: bi });
      put($("#cta"), { s: (0.9 + 0.1 * bi) * (1 - 0.045 * bump(f, 575, 4)) });
      $("#cta").style.filter = `brightness(${(1 + 0.16 * bump(f, 579, 9)).toFixed(3)})`;
      put($("#cico"), { s: soft(f, 503, 8), r: -30 * (1 - eo(ramp(f, 503, 520))) });
      put($("#h4"), { s: 0.78 + 0.22 * eo5(ramp(f, 504, 540)) + 0.04 * bump(f, 582, 10), o: eo(ramp(f, 504, 526)) });
      put($("#h3"), { s: 0.66 + 0.34 * eo5(ramp(f, 510, 552)) + 0.06 * bump(f, 587, 12), o: eo(ramp(f, 510, 536)) });
      const rp = ramp(f, 576, 606);
      put($("#rip"), { s: 1 + 0.5 * eo(rp), o: rp > 0 && rp < 1 ? 0.7 * (1 - rp) : 0 });
      const cp = eo(ramp(f, 584, 602));
      put($("#cap"), { y: 20 * (1 - cp), o: cp, b: 10 * (1 - cp) });
    }

    // ---------- blob wipes and the pointer ----------
    function renderBlob(f) {
      [354, 500].forEach((t0) => {
        if (f < t0 - 18 || f > t0 + 22) return;
        [["#blobA", 0], ["#blobB", 4]].forEach(([id, lag]) => {
          const p = eio(ramp(f, t0 - 17 + lag, t0 + 17 + lag));
          const el = $(id);
          el.style.display = "block";
          el.style.transform = `translate(${lerp(2300, -3000, p).toFixed(1)}px, ${lerp(1500, -3100, p).toFixed(1)}px) rotate(${lerp(-20, 50, p).toFixed(2)}deg)`;
        });
      });
    }
    const CX = [[0, 2150], [34, 1236], [100, 1230], [116, 1012], [150, 1012]];
    const CY = [[0, 1210], [34, 452], [100, 458], [116, 424], [150, 424]];
    function renderCursor(f) {
      const c = $("#cur");
      let x, y, r = -30, s = 1, o = 1;
      if (f < 134) {
        x = keys(f, CX); y = keys(f, CY) + 6 * Math.sin(f / 15) * ramp(f, 34, 50) * (1 - ramp(f, 100, 110));
        r = lerp(-78, -30, eo(ramp(f, 0, 36))); s = lerp(3.2, 1, eo(ramp(f, 0, 34))) * (1 - 0.14 * bump(f, 119, 4));
        o = ramp(f, 0, 6) * (1 - ramp(f, 123, 131));
        c.style.filter = blurOf(10 * (1 - eo(ramp(f, 0, 26))));
      } else if (f < 240) { // riding the playhead
        x = 420 + lerp(150, 880, eio(ramp(f, 152, 210))) + 6; y = 962 + 3 * Math.sin(f / 13);
        o = ramp(f, 148, 157) * (1 - ramp(f, 205, 214)); c.style.filter = "none";
      } else if (f < 490) { // download button
        const p = eio(ramp(f, 424, 444)), go = eio(ramp(f, 450, 468));
        x = lerp(1560, 1052, p) + 40 * go; y = lerp(1010, 716, p) + 4 * Math.sin(f / 14) + 60 * go;
        r = lerp(-10, -30, p); s = 1 - 0.14 * bump(f, 447, 4); o = ramp(f, 422, 430) * (1 - ramp(f, 452, 462)); c.style.filter = "none";
      } else { // call to action
        const p = eio(ramp(f, 538, 566));
        x = lerp(1680, 1336, p); y = lerp(1060, 604, p) + 5 * Math.sin(f / 16) * ramp(f, 566, 580);
        r = lerp(-8, -30, p); s = 1 - 0.14 * bump(f, 575, 4); o = ramp(f, 536, 545); c.style.filter = "none";
      }
      c.style.opacity = clamp(o, 0, 1).toFixed(3);
      c.style.display = o > 0.001 ? "block" : "none";
      c.style.transform = `translate(${(x - 60).toFixed(2)}px, ${(y - 8).toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    }

    function render(t) {
      const f = clamp(t, 0, FRAMES - 0.001);
      const on = { s1: f < 148, s2: f >= 134 && f < 356, s3: f >= 352 && f < 502, s4: f >= 498 };
      Object.keys(on).forEach((k) => vis(sc[k], on[k]));
      $("#blobA").style.display = "none"; $("#blobB").style.display = "none";
      renderBg(f);
      if (on.s1) renderS1(f);
      if (on.s2) renderS2(f);
      if (on.s3) renderS3(f);
      if (on.s4) renderS4(f);
      renderBlob(f);
      renderCursor(f);
    }

    const R0 = { _f: 0 };
    Object.defineProperty(R0, "frame", { get: () => R0._f, set: (v) => { R0._f = v; render(v + SUB); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R0, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R0._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
