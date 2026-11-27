// GOAT Funded Perps: "Daily loss limit" (208 frames @ 30 fps), built on the supplied reference: a trading terminal leaning
// back in perspective with ghost copies stacked behind it and panels floating in front, joined by a gold connector,
// the active panel lighting gold; a rolling word wheel over slanted, out-of-focus product UI; hard cuts between them.
// In the Perps brand, timed to the supplied voiceover:
//   "Your daily loss limit is based on your balance, not your open profits, so the winning trades you hold
//    overnight won't tighten your limit."
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 208;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // glide(a, b): an S-curve whose speed follows u^a (1-u)^b. Measured on the reference, its moves build up over the
  // first quarter and bleed off on a long tail; moves overlap so the frame is never dead still.
  const glide = (a, b) => {
    const N = 400, T = [0];
    for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N; T.push(T[i - 1] + Math.pow(u, a) * Math.pow(1 - u, b)); }
    return (x) => { const v = clamp(x, 0, 1) * N, i = Math.min(N - 1, Math.floor(v)); return mix(T[i], T[i + 1], v - i) / T[N]; };
  };
  const gIn = glide(1.15, 4), gCam = glide(1.7, 4), gW = glide(1.6, 3.2), gHand = glide(2, 3);
  const fmt = (v) => Math.round(v).toLocaleString("en-US");

  // ---------------- timing (frames) from the voiceover's word times ----------------
  // daily 0.22 s, loss limit 0.46-1.06, based 1.26, balance 1.78-2.18, not 2.46, open profits 2.84-3.52, so 3.76,
  // winning trades 4.18-4.66, you hold 4.66-5.06, overnight 5.06-5.50, won't 5.50, tighten 6.06, your limit 6.26-6.70
  const CUT1 = 74, CUT2 = 140;
  const T_LIMIT = 16, T_BAL = 52, T_OPEN = 85, T_STRIKE = 101, T_WIN = 121, T_NIGHT = 150, T_WONT = 166;

  // ---------------- candles ----------------
  const makeCandles = (n, seed, start, end, vol) => {
    const r = rng(seed), raw = [start];
    for (let i = 0; i < n; i++) raw.push(raw[i] + (r() - 0.5) * 2 * vol + (r() - 0.5) * vol * 0.8);
    const drift = (end - raw[n]) / n;
    const cl = raw.map((v, i) => v + drift * i);
    return Array.from({ length: n }, (_, i) => {
      const o = cl[i], c = cl[i + 1], h = Math.max(o, c) + Math.pow(r(), 1.6) * vol * 1.4, l = Math.min(o, c) - Math.pow(r(), 1.6) * vol * 1.4;
      return { o, c, h, l };
    });
  };
  const chartFrame = (W, H, pmin, pmax, step, plotW, times) => {
    const y = (p) => 26 + ((pmax - p) / (pmax - pmin)) * (H - 60);
    let s = "";
    for (let p = Math.ceil(pmin / step) * step; p <= pmax; p += step)
      s += `<line x1="0" x2="${plotW}" y1="${y(p).toFixed(1)}" y2="${y(p).toFixed(1)}" stroke="rgba(255,255,255,0.05)"/><text class="ax" x="${plotW + 14}" y="${(y(p) + 5).toFixed(1)}">${fmt(p)}</text>`;
    times.forEach((t, i) => { const x = ((i + 0.5) / times.length) * plotW; s += `<line x1="${x}" x2="${x}" y1="0" y2="${H - 34}" stroke="rgba(255,255,255,0.04)"/><text class="ax" x="${x - 18}" y="${H - 10}">${t}</text>`; });
    s += `<line x1="${plotW}" x2="${plotW}" y1="0" y2="${H}" stroke="rgba(255,255,255,0.07)"/><line x1="0" x2="${W}" y1="${H - 34}" y2="${H - 34}" stroke="rgba(255,255,255,0.07)"/>`;
    return { s, y };
  };
  const candleSVG = (cs, y, plotW, id) => {
    const dx = plotW / (cs.length + 2), w = dx * 0.6;
    return cs.map((k, i) => {
      const x = dx * (i + 1), up = k.c >= k.o, col = up ? "#3FCB7E" : "#E5484D";
      return `<g id="${id}${i}" fill="${col}" stroke="${col}"><line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y(k.h).toFixed(1)}" y2="${y(k.l).toFixed(1)}" stroke-width="1.4"/><rect x="${(x - w / 2).toFixed(1)}" width="${w.toFixed(1)}" y="${y(Math.max(k.o, k.c)).toFixed(1)}" height="${Math.max(1.5, Math.abs(y(k.o) - y(k.c))).toFixed(1)}" rx="1" stroke="none"/></g>`;
    }).join("");
  };
  const ghost = (w, h, times) => `${times.map((t, i) => `<span style="left:${((i + 0.5) / times.length) * w}px">${t}</span>`).join("")}`;

  const C1 = makeCandles(92, 11, 50450, 50380, 120), P1 = [47700, 51300];
  const C3 = makeCandles(84, 29, 50050, 53050, 110), P3 = [47700, 53500], ENTRY = 50100, LIMIT = 48000, BAL = 50000;
  const NIGHT = [34, 60];

  const SCENE = {};
  SCENE.mount = function (stage) {
    const W1 = 1240, H1 = 654, PW1 = 1140;
    const F1 = chartFrame(W1, H1, P1[0], P1[1], 500, PW1, ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]);
    const W3 = 1380, H3 = 714, PW3 = 1270;
    const F3 = chartFrame(W3, H3, P3[0], P3[1], 1000, PW3, ["16:00", "20:00", "00:00", "04:00", "08:00", "12:00"]);
    const dx3 = PW3 / (C3.length + 2);
    const lockSVG = `<svg class="lock" viewBox="0 0 18 20"><path d="M4 9V6a5 5 0 0 1 10 0v3" fill="none" stroke="#FFC27A" stroke-width="2.2"/><rect x="1.5" y="9" width="15" height="10" rx="2.5" fill="#FFC27A"/></svg>`;
    const T1 = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"], T3 = ["16:00", "20:00", "00:00", "04:00", "08:00", "12:00"];

    stage.innerHTML = `
      <div id="s1" class="layer bg13">
        <div class="persp"><div class="rig" id="rig1">
          <div class="ghost" id="g1b" style="left:-900px;top:-350px;width:${W1}px;height:700px">${ghost(W1, 700, T1)}</div>
          <div class="ghost" id="g1a" style="left:-900px;top:-350px;width:${W1}px;height:700px">${ghost(W1, 700, T1)}</div>
          <div class="win" id="chart1" style="left:-900px;top:-350px;width:${W1}px;height:${H1 + 46}px">
            <div class="bar"><b>BTC-PERP · 1H</b><span>O <span class="up">50,412.0</span></span><span>H <span class="up">50,688.5</span></span><span>L <span class="dn">50,201.3</span></span><span>C <span class="up">50,380.4</span></span><span class="tag">Daily loss limit</span></div>
            <svg width="${W1}" height="${H1}" viewBox="0 0 ${W1} ${H1}">
              <defs><linearGradient id="zg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(236,139,27,0.03)"/><stop offset="1" stop-color="rgba(236,139,27,0.16)"/></linearGradient></defs>
              ${F1.s}
              <rect id="zone1" x="0" y="${F1.y(BAL)}" width="0" height="${F1.y(LIMIT) - F1.y(BAL)}" fill="url(#zg)"/>
              <text id="zonet" x="24" y="${(F1.y(LIMIT) - 52).toFixed(1)}" style="font:600 17px Altform;letter-spacing:0.16em;fill:rgba(255,190,110,0.75)">TODAY'S LOSS ROOM · $2,000</text>
              <line x1="0" x2="${PW1}" y1="${F1.y(BAL)}" y2="${F1.y(BAL)}" stroke="rgba(237,239,242,0.5)" stroke-width="1.6" stroke-dasharray="3 7"/>
              ${candleSVG(C1, F1.y, PW1, "k1_")}
              <line id="lim1" x1="0" x2="${PW1}" y1="${F1.y(LIMIT)}" y2="${F1.y(LIMIT)}" stroke="#F6A03A" stroke-width="2.6" stroke-dasharray="10 7" style="filter:drop-shadow(0 0 6px rgba(246,160,58,0.8))"/>
            </svg>
            <div class="pricepill" style="top:${46 + F1.y(BAL)}px;background:#E9EBEE;color:#111">Balance ${fmt(BAL)}</div>
            <div class="pricepill" id="limpill1" style="top:${46 + F1.y(LIMIT)}px;background:#EC8B1B;color:#1a1006">${fmt(LIMIT)}</div>
            <div class="lim-label" id="limlab1" style="top:${46 + F1.y(LIMIT)}px">${lockSVG}Daily loss limit <span>$${fmt(LIMIT)}</span></div>
          </div>
          <svg class="conn" id="conn" width="10" height="10"><path id="connP" pathLength="100"/></svg>
          <div class="card" id="cardA" style="left:320px;top:-380px;width:500px">
            <h3>DAILY LOSS LIMIT</h3><div class="u" id="uA"></div>
            <div class="row"><span>Start-of-day balance</span><b>$50,000.00</b></div>
            <div class="row"><span>Max daily loss</span><b>4% · $2,000</b></div>
          </div>
          <div class="card lit" id="cardB" style="left:350px;top:-10px;width:520px">
            <small class="lbl">Limit based on</small><small class="sub">Set once, from your balance at the start of the day.</small>
            <div class="row sel" id="rowBal"><span style="display:flex;gap:14px;align-items:center"><i class="chk"></i>Balance</span><b>$50,000.00</b>
              <svg class="trace" id="trace"><rect id="traceR" x="1.5" y="1.5" rx="15" pathLength="100"/></svg></div>
            <div class="row" style="opacity:0.55"><span style="display:flex;gap:14px;align-items:center"><i class="chk"></i>Open profits</span><b style="color:#6F757E;font-size:18px">Not counted</b></div>
            <div class="row brk"><span>Breach level</span><b>$48,000.00</b></div>
          </div>
        </div></div>
      </div>

      <div id="s2" class="layer bg2" style="display:none">
        <div class="slant" id="slant">
          <div class="ui" style="left:420px;top:560px;width:660px"><h4>Balance-based.</h4><p>Your daily loss limit is set from your balance at the start of the day, never from floating P&amp;L.</p><span class="btn">Get funded</span></div>
          <div class="ui" style="left:1960px;top:520px;width:620px"><p>Open profit on running trades is never counted against your limit.</p><div class="bar2"></div><div class="bar2" style="width:60%"></div></div>
          <div class="ui" style="left:1900px;top:1150px;width:660px"><h4>Hold overnight.</h4><p>Winning trades can stay open. Your limit stays where it started.</p><span class="btn">Start challenge</span></div>
          <div class="ui" style="left:560px;top:1260px;width:600px"><p>4% of start-of-day balance. One number, all day.</p><div class="bar2"></div></div>
          <div class="num" style="left:1700px;top:960px">0</div><div class="num" style="left:1820px;top:1060px;width:110px">4%</div><div class="num" style="left:1290px;top:1500px">$</div>
          <div class="cap2" style="left:1500px;top:420px">ONE ACCOUNT · ANY MARKET · EVERY LIMIT SET FROM BALANCE</div>
          <div class="cap2" style="left:1150px;top:1680px">BALANCE-BASED · NOT EQUITY · NOT FLOATING P&amp;L</div>
        </div>
        <div class="wheel" id="wheel">
          <div class="wline"></div>
          <div class="marker"></div>
          <div class="pillw" id="pw0"><div class="pill gold" id="p0">Balance</div></div>
          <div class="pillw" id="pw1"><div class="pill white" id="p1">Open profits<i class="strike" id="strike"></i></div></div>
          <div class="pillw" id="pw2"><div class="pill green" id="p2">Winning trades</div></div>
        </div>
      </div>

      <div id="s3" class="layer bg13" style="display:none">
        <div class="persp"><div class="rig" id="rig3">
          <div class="ghost" id="g3b" style="left:-780px;top:-390px;width:${W3}px;height:${H3 + 46}px">${ghost(W3, H3, T3)}</div>
          <div class="ghost" id="g3a" style="left:-780px;top:-390px;width:${W3}px;height:${H3 + 46}px">${ghost(W3, H3, T3)}</div>
          <div class="win" id="chart3" style="left:-780px;top:-390px;width:${W3}px;height:${H3 + 46}px">
            <div class="bar"><b>BTC-PERP · 1H</b><span class="up" id="last3">50,050.0</span><span>Long 1.0 · entry ${fmt(ENTRY)}</span><span class="tag">Holding overnight</span></div>
            <svg width="${W3}" height="${H3}" viewBox="0 0 ${W3} ${H3}">
              <defs><linearGradient id="ng" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(120,110,200,0.17)"/><stop offset="1" stop-color="rgba(120,110,200,0.03)"/></linearGradient></defs>
              <g id="night"><rect x="${(dx3 * (NIGHT[0] + 0.5)).toFixed(1)}" width="${(dx3 * (NIGHT[1] - NIGHT[0])).toFixed(1)}" y="0" height="${H3 - 34}" fill="url(#ng)"/>
                <text x="${(dx3 * (NIGHT[0] + 1.6)).toFixed(1)}" y="34" style="font:600 15px Altform;letter-spacing:0.2em;fill:#B9A6E0">☾  OVERNIGHT</text></g>
              ${F3.s}
              <line x1="0" x2="${PW3}" y1="${F3.y(ENTRY)}" y2="${F3.y(ENTRY)}" stroke="rgba(63,203,126,0.6)" stroke-width="1.6" stroke-dasharray="3 7"/>
              <rect id="pz" x="0" width="0" y="0" height="0" fill="rgba(63,203,126,0.09)"/>
              ${candleSVG(C3, F3.y, PW3, "k3_")}
              <line id="lim3" x1="0" x2="${PW3}" y1="${F3.y(LIMIT)}" y2="${F3.y(LIMIT)}" stroke="#F6A03A" stroke-width="2.6" stroke-dasharray="10 7"/>
            </svg>
            <div class="pricepill" style="top:${46 + F3.y(ENTRY)}px;background:rgba(63,203,126,0.25);color:#7CF0AE">Entry ${fmt(ENTRY)}</div>
            <div class="pricepill" id="pnl" style="background:#3FCB7E;color:#062114">+$0</div>
            <div class="pricepill" style="top:${46 + F3.y(LIMIT)}px;background:#EC8B1B;color:#1a1006">${fmt(LIMIT)}</div>
            <div class="lim-label" id="limlab3" style="top:${46 + F3.y(LIMIT)}px"><span id="lock3" style="display:inline-flex">${lockSVG}</span>Daily loss limit <span>$${fmt(LIMIT)}</span></div>
          </div>
          <div class="card lit" id="cardC" style="left:330px;top:-170px;width:500px">
            <h3>YOUR LIMIT</h3><div class="u"></div>
            <div class="row"><span>Start-of-day balance</span><b>$50,000.00</b></div>
            <div class="row pos"><span>Open profit</span><b id="pnlC">+$0</b></div>
            <div class="row sel brk" id="rowLim"><span style="display:flex;gap:12px;align-items:center">${lockSVG}Daily loss limit</span><b>$48,000.00</b>
              <svg class="trace" id="trace3"><rect id="traceR3" x="1.5" y="1.5" rx="15" pathLength="100"/></svg></div>
            <small class="sub" id="unch" style="margin:14px 0 0;color:#C9A77A;font-size:16px">Unchanged by open profit, day or night.</small>
          </div>
        </div></div>
      </div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;

    const $ = (s) => stage.querySelector(s);
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    const k3 = C3.map((_, i) => $(`#k3_${i}`)), k1 = C1.map((_, i) => $(`#k1_${i}`));

    // layout-dependent pieces: the traces hug their rows, the connector runs from card A down to card B
    const layout = () => {
      [["#trace", "#traceR", "#rowBal"], ["#trace3", "#traceR3", "#rowLim"]].forEach(([t, r, row]) => {
        const el = $(row), w = el.offsetWidth + 12, h = el.offsetHeight + 12;
        $(t).setAttribute("width", w); $(t).setAttribute("height", h); $(t).setAttribute("viewBox", `0 0 ${w} ${h}`);
        $(r).setAttribute("width", w - 3); $(r).setAttribute("height", h - 3);
      });
      const A = $("#cardA"), aBottom = -380 + A.offsetHeight, x0 = 320 + 420, x1 = 350 + 150, yB = -10;
      const mid = (aBottom + yB) / 2, r = 14;
      const cv = $("#conn"); cv.style.left = `${x1 - 10}px`; cv.style.top = `${aBottom - 2}px`;
      cv.setAttribute("width", x0 - x1 + 20); cv.setAttribute("height", yB - aBottom + 4);
      const ox = x1 - 10, oy = aBottom - 2, X0 = x0 - ox, X1 = x1 - ox, Y0 = aBottom - oy, YM = mid - oy, YB = yB - oy;
      $("#connP").setAttribute("d", `M ${X0} ${Y0} L ${X0} ${YM - r} Q ${X0} ${YM} ${X0 - r} ${YM} L ${X1 + r} ${YM} Q ${X1} ${YM} ${X1} ${YM + r} L ${X1} ${YB}`);
    };
    layout();

    const rig = (el, t) => { el.style.transform = `translate3d(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px, ${t.z.toFixed(1)}px) rotateX(${t.rx.toFixed(3)}deg) rotateY(${t.ry.toFixed(3)}deg) rotateZ(${(t.rz || 0).toFixed(3)}deg)`; };
    const place = (el, x, y, z, op) => { el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`; if (op !== undefined) el.style.opacity = op.toFixed(3); };
    const trace = (rect, svg, t, fade) => { rect.setAttribute("stroke-dasharray", `${(100 * t).toFixed(2)} 100`); svg.style.opacity = (t > 0 ? 1 - 0.4 * fade : 0).toFixed(3); };

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const shot = f < CUT1 ? 1 : f < CUT2 ? 2 : 3;
      $("#s1").style.display = shot === 1 ? "" : "none"; $("#s2").style.display = shot === 2 ? "" : "none"; $("#s3").style.display = shot === 3 ? "" : "none";

      if (shot === 1) {
        // leaning back hard, the stack swings round and settles; a slow push toward the panels builds before it rests
        const a = gIn(span(f, 0, 66)), p = gCam(span(f, 30, 120));
        rig($("#rig1"), { x: mix(170, -10, a) - 170 * p, y: mix(70, 20, a) - 10 * p, z: mix(-330, -90, a) + 120 * p, rx: mix(20, 13, a) - 1.5 * p, ry: mix(-34, -20, a) - 4 * p, rz: mix(-2.4, -0.8, a) });
        // ghost layers fan out behind the chart
        const gs = gIn(span(f, 0, 40));
        place($("#g1a"), 34 * gs, 46 * gs, -70 * gs, 0.55); place($("#g1b"), 68 * gs, 92 * gs, -140 * gs, 0.32);
        // the panels float forward, one after the other
        const ca = gIn(span(f, 6, 38)), cb = gIn(span(f, 14, 46));
        place($("#cardA"), mix(280, 0, ca), mix(-30, 0, ca), mix(-160, 150, ca), Math.min(1, ca * 1.6));
        place($("#cardB"), mix(300, 0, cb), mix(40, 0, cb), mix(-180, 110, cb), Math.min(1, cb * 1.6));
        $("#uA").style.transform = `scaleX(${gHand(span(f, 18, 34)).toFixed(3)})`;
        place($("#conn"), 0, 0, 130, 1);
        $("#connP").setAttribute("stroke-dasharray", `${(100 * gHand(span(f, 34, 52))).toFixed(2)} 100`);
        // the newest candles print in as the shot opens
        k1.forEach((el, i) => { el.style.opacity = i < 74 ? 1 : span(f, (i - 74) * 1.6, 3 + (i - 74) * 1.6).toFixed(3); });
        // "loss limit": the line draws across, the room above it fills, its label follows
        const l = gHand(span(f, T_LIMIT, T_LIMIT + 22));
        $("#lim1").setAttribute("x2", (PW1 * l).toFixed(1)); $("#zone1").setAttribute("width", (PW1 * l).toFixed(1));
        $("#zonet").style.opacity = gIn(span(f, T_LIMIT + 14, T_LIMIT + 30)).toFixed(3);
        $("#limpill1").style.opacity = span(f, T_LIMIT + 16, T_LIMIT + 24).toFixed(3);
        const ll = gIn(span(f, T_LIMIT + 10, T_LIMIT + 30));
        $("#limlab1").style.opacity = ll.toFixed(3); $("#limlab1").style.transform = `translate(${mix(-30, 0, ll).toFixed(1)}px, -120%)`;
        // "balance": the row selects, a gold trace runs once round it, and the whole card lights
        $("#rowBal").style.setProperty("--k", gHand(span(f, T_BAL - 2, T_BAL + 8)).toFixed(3));
        trace($("#traceR"), $("#trace"), gW(span(f, T_BAL - 4, T_BAL + 14)), span(f, T_BAL + 14, T_BAL + 30));
        $("#cardB").style.setProperty("--g", gHand(span(f, T_BAL, T_BAL + 14)).toFixed(3));
      } else if (shot === 2) {
        // the wheel: cut in mid-roll, then each item rolls up to the marker as it is spoken
        const pos = -0.45 + 0.45 * gIn(span(f, CUT1, CUT1 + 14)) + gW(span(f, T_OPEN - 3, T_OPEN + 13)) + gW(span(f, T_WIN - 3, T_WIN + 13));
        const sh = span(f, CUT1 - 10, CUT2 + 10);
        $("#slant").style.transform = `translate(${(-240 * sh - 30 * pos).toFixed(1)}px, ${(-90 * sh - 90 * pos).toFixed(1)}px) rotate(-17deg) scale(${(1.04 + 0.05 * sh).toFixed(4)})`;
        $("#wheel").style.transform = `translateY(${(-14 * sh).toFixed(1)}px) scale(${(1 + 0.03 * sh).toFixed(4)})`;
        [0, 1, 2].forEach((i) => {
          const d = i - pos, ad = Math.abs(d), fo = smooth(1 - Math.min(1, ad));
          const op = ad < 1 ? mix(1, 0.8, ad) : 0.8 * (1 - span(ad, 1, 1.8));
          const w = $(`#pw${i}`), p = $(`#p${i}`);
          w.style.transform = `translateY(${(d * 225).toFixed(1)}px) scale(${(0.6 + 0.4 * fo).toFixed(4)})`;
          w.style.opacity = op.toFixed(3);
          p.style.setProperty("--f", fo.toFixed(3));
          p.style.filter = `brightness(${(0.5 + 0.5 * fo).toFixed(3)}) saturate(${(0.65 + 0.35 * fo).toFixed(3)})`;
        });
        // "not your open profits": struck out once it is said
        $("#strike").style.transform = `scaleX(${gHand(span(f, T_STRIKE, T_STRIKE + 8)).toFixed(3)})`;
        $("#p1").style.opacity = (1 - 0.3 * span(f, T_STRIKE + 4, T_STRIKE + 14)).toFixed(3);
      } else {
        // the stack from the other side: a slow dolly, then a push toward the limit on "won't tighten"
        const a = gIn(span(f, CUT2, CUT2 + 56)), p = gCam(span(f, T_WONT - 10, T_WONT + 60));
        rig($("#rig3"), { x: mix(200, 30, a) - 40 * p, y: mix(-30, 0, a) - 40 * p, z: mix(-220, -40, a) + 90 * p, rx: mix(18, 12, a) + 1 * p, ry: mix(30, 19, a) + 3 * p, rz: mix(2.2, 0.6, a) });
        const gs = gIn(span(f, CUT2 - 10, CUT2 + 30));
        place($("#g3a"), -34 * gs, 46 * gs, -70 * gs, 0.55); place($("#g3b"), -68 * gs, 92 * gs, -140 * gs, 0.32);
        // the trade prints on through the night
        const vis = 28 + 55.999 * span(f, CUT2 - 4, FRAMES + 2);
        const n = Math.floor(vis), u = vis - n;
        let last = C3[0].c;
        k3.forEach((el, i) => {
          if (i < n) { el.style.opacity = 1; last = C3[i].c; return; }
          if (i > n) { el.style.opacity = 0; return; }
          const k = C3[i], c = mix(k.o, k.c, u), y = F3.y, rect = el.querySelector("rect"), ln = el.querySelector("line");
          el.style.opacity = 1; last = c;
          const col = c >= k.o ? "#3FCB7E" : "#E5484D"; el.setAttribute("fill", col); el.setAttribute("stroke", col);
          rect.setAttribute("y", y(Math.max(k.o, c)).toFixed(1)); rect.setAttribute("height", Math.max(1.5, Math.abs(y(k.o) - y(c))).toFixed(1));
          ln.setAttribute("y1", y(Math.max(k.o, c, mix(k.o, k.h, u))).toFixed(1)); ln.setAttribute("y2", y(Math.min(k.o, c, mix(k.o, k.l, u))).toFixed(1));
        });
        const pz = $("#pz"), xe = dx3 * (vis + 1);
        pz.setAttribute("x", dx3.toFixed(1)); pz.setAttribute("width", Math.max(0, xe - dx3).toFixed(1));
        pz.setAttribute("y", F3.y(Math.max(ENTRY, last)).toFixed(1)); pz.setAttribute("height", Math.max(0, F3.y(ENTRY) - F3.y(last)).toFixed(1));
        const pv = `+$${fmt(Math.max(0, last - ENTRY))}`;
        const pnl = $("#pnl"); pnl.style.top = `${(46 + F3.y(last)).toFixed(1)}px`; pnl.textContent = pv; $("#pnlC").textContent = pv;
        $("#last3").textContent = last.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        $("#night").style.opacity = gHand(span(f, T_NIGHT - 6, T_NIGHT + 10)).toFixed(3);
        // the card floats in; on "won't tighten" the limit row traces gold, the card lights and the lock settles
        const cc = gIn(span(f, CUT2 + 4, CUT2 + 36));
        place($("#cardC"), mix(320, 0, cc), mix(30, 0, cc), mix(-160, 150, cc), Math.min(1, cc * 1.6));
        $("#rowLim").style.setProperty("--k", gHand(span(f, T_WONT, T_WONT + 10)).toFixed(3));
        trace($("#traceR3"), $("#trace3"), gW(span(f, T_WONT - 2, T_WONT + 16)), span(f, T_WONT + 16, T_WONT + 32));
        $("#cardC").style.setProperty("--g", gHand(span(f, T_WONT + 2, T_WONT + 16)).toFixed(3));
        const lk = span(f, T_WONT + 2, T_WONT + 14);
        $("#lock3").style.transform = `scale(${(1 + 0.28 * Math.sin(Math.PI * lk) * (1 - lk)).toFixed(3)})`;
        $("#limlab3").style.boxShadow = `0 0 ${(24 + 40 * Math.sin(Math.PI * lk)).toFixed(1)}px rgba(236,139,27,${(0.25 + 0.35 * Math.sin(Math.PI * lk)).toFixed(2)})`;
        $("#lim3").style.filter = `drop-shadow(0 0 ${(6 + 10 * span(f, T_WONT, T_WONT + 12)).toFixed(1)}px rgba(246,160,58,0.9))`;
        const un = gIn(span(f, T_WONT + 10, T_WONT + 28));
        $("#unch").style.opacity = un.toFixed(3); $("#unch").style.transform = `translateY(${mix(8, 0, un).toFixed(1)}px)`;
      }
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    const relayout = () => { const s3 = $("#s3"), d = s3.style.display; s3.style.display = ""; layout(); s3.style.display = d; render(R._f); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    window.addEventListener("load", relayout);
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
