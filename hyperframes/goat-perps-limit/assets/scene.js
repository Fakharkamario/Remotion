// GOAT Funded Perps: "Daily loss limit" (208 frames @ 30 fps), built on the supplied reference (a tilted trading terminal
// that dollies while a panel's outline traces gold, a rolling word wheel over slanted copy, hard cuts between them),
// in the Perps brand, timed to the supplied voiceover:
//   "Your daily loss limit is based on your balance, not your open profits, so the winning trades you hold
//    overnight won't tighten your limit."
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 208;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (x, p) => 1 - Math.pow(1 - clamp(x, 0, 1), p || 3);
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
    for (let i = 0; i < n; i++) raw.push(raw[i] + (r() - 0.5) * 2 * vol + (r() - 0.5) * vol * 0.6);
    const drift = (end - raw[n]) / n;
    const cl = raw.map((v, i) => v + drift * i);
    return Array.from({ length: n }, (_, i) => {
      const o = cl[i], c = cl[i + 1], h = Math.max(o, c) + r() * vol * 0.8, l = Math.min(o, c) - r() * vol * 0.8;
      return { o, c, h, l };
    });
  };
  const chartFrame = (W, H, pmin, pmax, step, plotW, times) => {
    const y = (p) => 26 + ((pmax - p) / (pmax - pmin)) * (H - 60);
    let s = "";
    for (let p = Math.ceil(pmin / step) * step; p <= pmax; p += step)
      s += `<line x1="0" x2="${plotW}" y1="${y(p).toFixed(1)}" y2="${y(p).toFixed(1)}" stroke="rgba(255,255,255,0.045)"/><text class="ax" x="${plotW + 14}" y="${(y(p) + 5).toFixed(1)}">${fmt(p)}</text>`;
    times.forEach((t, i) => { const x = ((i + 0.5) / times.length) * plotW; s += `<line x1="${x}" x2="${x}" y1="0" y2="${H - 34}" stroke="rgba(255,255,255,0.03)"/><text class="ax" x="${x - 18}" y="${H - 10}">${t}</text>`; });
    s += `<line x1="${plotW}" x2="${plotW}" y1="0" y2="${H}" stroke="rgba(255,255,255,0.06)"/><line x1="0" x2="${W}" y1="${H - 34}" y2="${H - 34}" stroke="rgba(255,255,255,0.06)"/>`;
    return { s, y };
  };
  const candleSVG = (cs, y, plotW, id) => {
    const dx = plotW / (cs.length + 2), w = dx * 0.62;
    return cs.map((k, i) => {
      const x = dx * (i + 1), up = k.c >= k.o, col = up ? "#3FCB7E" : "#E5484D";
      return `<g id="${id}${i}" fill="${col}" stroke="${col}"><line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y(k.h).toFixed(1)}" y2="${y(k.l).toFixed(1)}" stroke-width="1.6"/><rect x="${(x - w / 2).toFixed(1)}" width="${w.toFixed(1)}" y="${y(Math.max(k.o, k.c)).toFixed(1)}" height="${Math.max(1.5, Math.abs(y(k.o) - y(k.c))).toFixed(1)}" rx="1.5" stroke="none"/></g>`;
    }).join("");
  };

  // shot 1 chart: price hovering around the balance; shot 3: a long that climbs through the night
  const C1 = makeCandles(46, 11, 50650, 50180, 190), P1 = [47400, 51200];
  const C3 = makeCandles(60, 29, 50020, 53050, 150), P3 = [47500, 53700], ENTRY = 50100, LIMIT = 48000, BAL = 50000;
  const NIGHT = [24, 44];

  const SCENE = {};
  SCENE.mount = function (stage) {
    // ---- shot 1 ----
    const W1 = 1200, H1 = 654, PW1 = 1100;
    const F1 = chartFrame(W1, H1, P1[0], P1[1], 500, PW1, ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]);
    // ---- shot 3 ----
    const W3 = 1400, H3 = 714, PW3 = 1290;
    const F3 = chartFrame(W3, H3, P3[0], P3[1], 1000, PW3, ["16:00", "20:00", "00:00", "04:00", "08:00", "12:00"]);
    const dx3 = PW3 / (C3.length + 2);
    const lockSVG = `<svg class="lock" viewBox="0 0 18 20"><path d="M4 9V6a5 5 0 0 1 10 0v3" fill="none" stroke="#FFC27A" stroke-width="2.2"/><rect x="1.5" y="9" width="15" height="10" rx="2.5" fill="#FFC27A"/></svg>`;

    stage.innerHTML = `
      <div id="s1" class="layer bg13">
        <div class="persp"><div class="rig" id="rig1">
          <div class="win" id="chart1" style="left:-860px;top:-350px;width:${W1}px;height:${H1 + 46}px">
            <div class="bar"><b>BTC-PERP</b><span>1H</span><span class="up">50,180.4</span><span>Funded account · $50K</span><span class="tag">Daily loss limit</span></div>
            <svg width="${W1}" height="${H1}" viewBox="0 0 ${W1} ${H1}">
              ${F1.s}
              <line x1="0" x2="${PW1}" y1="${F1.y(BAL)}" y2="${F1.y(BAL)}" stroke="rgba(237,239,242,0.45)" stroke-width="1.6" stroke-dasharray="3 7"/>
              ${candleSVG(C1, F1.y, PW1, "k1_")}
              <line id="lim1" x1="0" x2="${PW1}" y1="${F1.y(LIMIT)}" y2="${F1.y(LIMIT)}" stroke="#F6A03A" stroke-width="2.4" stroke-dasharray="10 7" style="filter:drop-shadow(0 0 6px rgba(246,160,58,0.8))"/>
            </svg>
            <div class="pricepill" style="top:${46 + F1.y(BAL)}px;background:#E9EBEE;color:#111">Balance ${fmt(BAL)}</div>
            <div class="pricepill" id="limpill1" style="top:${46 + F1.y(LIMIT)}px;background:#EC8B1B;color:#1a1006">${fmt(LIMIT)}</div>
            <div class="lim-label" id="limlab1" style="top:${46 + F1.y(LIMIT)}px">${lockSVG}Daily loss limit <span>$${fmt(LIMIT)}</span></div>
          </div>
          <div class="side" id="side1" style="left:372px;top:-322px;width:480px;height:640px">
            <h3>DAILY LOSS LIMIT</h3><div class="u"></div>
            <div class="kv"><span>Start-of-day balance</span><b>$50,000.00</b></div>
            <div class="kv"><span>Max daily loss</span><b>4% · $2,000</b></div>
            <div class="basis" id="basis"><small>LIMIT BASED ON</small>
              <div class="seg"><span class="on" id="segBal">Balance</span><span>Open equity</span></div>
              <svg class="trace" id="trace" preserveAspectRatio="none"><rect id="traceR" x="1.5" y="1.5" rx="16" pathLength="100"/></svg>
            </div>
            <div class="brk"><span>Breach level</span><b>$48,000.00</b></div>
          </div>
        </div></div>
      </div>

      <div id="s2" class="layer bg2" style="display:none">
        <div class="slant" id="slant">
          <p class="big" style="left:420px;top:520px">Balance-based.<br/>Not equity.</p>
          <p style="left:460px;top:760px">Your daily loss limit is set from your balance at the start of the day. Floating profit on open trades is never counted against you.</p>
          <div class="btn" style="left:520px;top:960px">Get funded</div>
          <p style="left:1380px;top:430px">ONE ACCOUNT, ANY MARKET. EVERY LIMIT IS SET FROM YOUR BALANCE, NOT FROM FLOATING P&amp;L.</p>
          <p style="left:1500px;top:900px">Hold winners overnight. Your limit stays where it started.</p>
          <div class="btn" style="left:1560px;top:1120px">Start challenge</div>
          <div class="num" style="left:1340px;top:700px">0</div><div class="num" style="left:1760px;top:620px">4%</div><div class="num" style="left:1160px;top:1180px">$</div>
          <p style="left:2050px;top:700px">Daily payouts. 90% profit split. Weekend holding.</p>
        </div>
        <div class="wheel">
          <div class="wline"></div>
          <div class="cap" id="cap">LIMIT BASED ON</div>
          <div class="marker" id="marker"></div>
          <div class="pillw" id="pw0"><div class="pill gold" id="p0">Balance</div></div>
          <div class="pillw" id="pw1"><div class="pill white" id="p1">Open profits<i class="strike" id="strike"></i></div></div>
          <div class="pillw" id="pw2"><div class="pill green" id="p2">Winning trades</div></div>
        </div>
      </div>

      <div id="s3" class="layer bg13" style="display:none">
        <div class="persp"><div class="rig" id="rig3">
          <div class="win" id="chart3" style="left:-700px;top:-380px;width:${W3}px;height:${H3 + 46}px">
            <div class="bar"><b>BTC-PERP</b><span>1H</span><span class="up" id="last3">50,020.0</span><span>Long 1.0 · entry ${fmt(ENTRY)}</span><span class="tag">Holding overnight</span></div>
            <svg width="${W3}" height="${H3}" viewBox="0 0 ${W3} ${H3}">
              <g id="night"><rect x="${(dx3 * (NIGHT[0] + 0.5)).toFixed(1)}" width="${(dx3 * (NIGHT[1] - NIGHT[0])).toFixed(1)}" y="0" height="${H3 - 34}" fill="url(#ng)"/>
                <text x="${(dx3 * (NIGHT[0] + 1.6)).toFixed(1)}" y="34" style="font:600 15px Altform;letter-spacing:0.2em;fill:#B9A6E0">☾  OVERNIGHT</text></g>
              <defs><linearGradient id="ng" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(120,110,200,0.16)"/><stop offset="1" stop-color="rgba(120,110,200,0.03)"/></linearGradient></defs>
              ${F3.s}
              <line x1="0" x2="${PW3}" y1="${F3.y(ENTRY)}" y2="${F3.y(ENTRY)}" stroke="rgba(63,203,126,0.6)" stroke-width="1.6" stroke-dasharray="3 7"/>
              <rect id="pz" x="0" width="0" y="0" height="0" fill="rgba(63,203,126,0.08)"/>
              ${candleSVG(C3, F3.y, PW3, "k3_")}
              <line id="lim3" x1="0" x2="${PW3}" y1="${F3.y(LIMIT)}" y2="${F3.y(LIMIT)}" stroke="#F6A03A" stroke-width="2.6" stroke-dasharray="10 7"/>
            </svg>
            <div class="pricepill" style="top:${46 + F3.y(ENTRY)}px;background:rgba(63,203,126,0.25);color:#7CF0AE">Entry ${fmt(ENTRY)}</div>
            <div class="pricepill" id="pnl" style="background:#3FCB7E;color:#062114">+$0</div>
            <div class="pricepill" style="top:${46 + F3.y(LIMIT)}px;background:#EC8B1B;color:#1a1006">${fmt(LIMIT)}</div>
            <div class="lim-label" id="limlab3" style="top:${46 + F3.y(LIMIT)}px"><span id="lock3" style="display:inline-flex">${lockSVG}</span>Daily loss limit <span>$${fmt(LIMIT)}</span><i id="unch">· unchanged</i></div>
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
    const tr = $("#trace"), trR = $("#traceR");
    const sizeTrace = () => { const b = $("#basis"); const w = b.offsetWidth + 12, h = b.offsetHeight + 12; tr.setAttribute("viewBox", `0 0 ${w} ${h}`); trR.setAttribute("width", w - 3); trR.setAttribute("height", h - 3); };
    sizeTrace();

    const rig = (el, t) => { el.style.transform = `translate3d(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px, ${t.z.toFixed(1)}px) rotateX(${t.rx.toFixed(3)}deg) rotateY(${t.ry.toFixed(3)}deg) rotateZ(${(t.rz || 0).toFixed(3)}deg)`; };

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const shot = f < CUT1 ? 1 : f < CUT2 ? 2 : 3;
      $("#s1").style.display = shot === 1 ? "" : "none"; $("#s2").style.display = shot === 2 ? "" : "none"; $("#s3").style.display = shot === 3 ? "" : "none";

      if (shot === 1) {
        // the terminal swings in already moving and settles; before it rests a slow push toward the panel builds
        const a = gIn(span(f, 0, 64)), p = gCam(span(f, 34, 120));
        rig($("#rig1"), { x: mix(150, 10, a) - 230 * p, y: mix(70, 0, a) - 10 * p, z: mix(-260, -30, a) + 150 * p, rx: mix(13, 6, a) - 1 * p, ry: mix(-27, -11, a) - 5 * p, rz: mix(-1.2, 0, a) });
        // the panel slides out from behind the chart
        const s = gIn(span(f, 8, 40));
        $("#side1").style.transform = `translate3d(${mix(-260, 0, s).toFixed(1)}px, 0, ${mix(-120, 60, s).toFixed(1)}px)`;
        $("#side1").style.opacity = Math.min(1, s * 1.8).toFixed(3);
        // candles: the last few print in as the shot opens
        k1.forEach((el, i) => { el.style.opacity = i < 36 ? 1 : span(f, 2 + (i - 36) * 1.8, 5 + (i - 36) * 1.8).toFixed(3); });
        // the limit line draws across on "loss limit"; its label follows
        const l = gHand(span(f, T_LIMIT, T_LIMIT + 22));
        const lim = $("#lim1"); lim.setAttribute("x2", (PW1 * l).toFixed(1));
        $("#limpill1").style.opacity = span(f, T_LIMIT + 16, T_LIMIT + 24).toFixed(3);
        const ll = gIn(span(f, T_LIMIT + 10, T_LIMIT + 30));
        $("#limlab1").style.opacity = ll.toFixed(3); $("#limlab1").style.transform = `translate(${mix(-30, 0, ll).toFixed(1)}px, -120%)`;
        // "balance": the segment lights and a gold trace runs once round the block, then stays lit
        const b = gHand(span(f, T_BAL - 2, T_BAL + 8));
        $("#segBal").style.setProperty("--k", b.toFixed(3));
        const t = gW(span(f, T_BAL - 4, T_BAL + 14));
        trR.setAttribute("stroke-dasharray", `${(100 * t).toFixed(2)} 100`);
        tr.style.opacity = (t > 0 ? 1 - 0.35 * span(f, T_BAL + 14, T_BAL + 30) : 0).toFixed(3);
      } else if (shot === 2) {
        // the wheel: cut in mid-roll, then each item rolls up to the marker as it is spoken
        const pos = -0.45 + 0.45 * gIn(span(f, CUT1, CUT1 + 14)) + gW(span(f, T_OPEN - 3, T_OPEN + 13)) + gW(span(f, T_WIN - 3, T_WIN + 13));
        $("#slant").style.transform = `translate(${(-260 * span(f, CUT1 - 10, CUT2 + 10) - 24 * pos).toFixed(1)}px, ${(-110 * span(f, CUT1 - 10, CUT2 + 10) - 70 * pos).toFixed(1)}px) rotate(-17deg)`;
        [0, 1, 2].forEach((i) => {
          const d = i - pos, ad = Math.abs(d), fo = smooth(1 - Math.min(1, ad));
          const op = ad < 1 ? mix(1, 0.4, ad) : 0.4 * (1 - span(ad, 1, 1.9));
          const w = $(`#pw${i}`), p = $(`#p${i}`);
          w.style.transform = `translateY(${(d * 170).toFixed(1)}px) scale(${(0.6 + 0.4 * fo).toFixed(4)})`;
          w.style.opacity = op.toFixed(3);
          p.style.setProperty("--f", fo.toFixed(3));
          p.style.filter = `brightness(${(0.36 + 0.64 * fo).toFixed(3)}) saturate(${(0.55 + 0.45 * fo).toFixed(3)})`;
        });
        // "not your open profits": struck out once it is said
        const st = gHand(span(f, T_STRIKE, T_STRIKE + 8));
        $("#strike").style.transform = `scaleX(${st.toFixed(3)})`;
        $("#p1").style.opacity = (1 - 0.35 * span(f, T_STRIKE + 4, T_STRIKE + 14)).toFixed(3);
        $("#cap").style.opacity = (0.5 * (1 - span(f, T_WIN - 6, T_WIN + 4))).toFixed(3);
      } else {
        // the chart again, from the other side; a slow dolly, then a push down to the limit on "won't tighten"
        const a = gIn(span(f, CUT2, CUT2 + 56)), p = gCam(span(f, T_WONT - 8, T_WONT + 60));
        rig($("#rig3"), { x: mix(190, 0, a) + 200 * p, y: mix(-40, 0, a) - 120 * p, z: mix(-220, -40, a) + 150 * p, rx: mix(10, 6, a) + 2 * p, ry: mix(17, 8, a) + 3 * p, rz: mix(0.8, 0, a) });
        // the trade prints on through the night
        const vis = 20 + 39.999 * span(f, CUT2 - 4, FRAMES + 2);
        const n = Math.floor(vis), u = vis - n;
        let last = C3[0].c;
        k3.forEach((el, i) => {
          if (i < n) { el.style.opacity = 1; last = C3[i].c; return; }
          if (i > n) { el.style.opacity = 0; return; }
          // the live candle grows from its open
          const k = C3[i], c = mix(k.o, k.c, u), y = F3.y, rect = el.querySelector("rect"), ln = el.querySelector("line");
          el.style.opacity = 1; last = c;
          const col = c >= k.o ? "#3FCB7E" : "#E5484D"; el.setAttribute("fill", col); el.setAttribute("stroke", col);
          rect.setAttribute("y", y(Math.max(k.o, c)).toFixed(1)); rect.setAttribute("height", Math.max(1.5, Math.abs(y(k.o) - y(c))).toFixed(1));
          ln.setAttribute("y1", y(Math.max(k.o, c, mix(k.o, k.h, u))).toFixed(1)); ln.setAttribute("y2", y(Math.min(k.o, c, mix(k.o, k.l, u))).toFixed(1));
        });
        const pz = $("#pz"), xe = dx3 * (vis + 1);
        pz.setAttribute("x", (dx3 * 1).toFixed(1)); pz.setAttribute("width", Math.max(0, xe - dx3).toFixed(1));
        pz.setAttribute("y", F3.y(Math.max(ENTRY, last)).toFixed(1)); pz.setAttribute("height", Math.max(0, F3.y(ENTRY) - F3.y(last)).toFixed(1));
        const pnl = $("#pnl"); pnl.style.top = `${(46 + F3.y(last)).toFixed(1)}px`; pnl.textContent = `+$${fmt(Math.max(0, last - ENTRY))}`;
        $("#last3").textContent = last.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        $("#night").style.opacity = gHand(span(f, T_NIGHT - 6, T_NIGHT + 10)).toFixed(3);
        // "won't tighten your limit": the lock settles with a glint, and the line holds where it is
        const lk = span(f, T_WONT + 2, T_WONT + 14);
        $("#lock3").style.transform = `scale(${(1 + 0.28 * Math.sin(Math.PI * lk) * (1 - lk)).toFixed(3)})`;
        $("#limlab3").style.boxShadow = `0 0 ${(24 + 40 * Math.sin(Math.PI * lk)).toFixed(1)}px rgba(236,139,27,${(0.25 + 0.35 * Math.sin(Math.PI * lk)).toFixed(2)})`;
        $("#lim3").style.filter = `drop-shadow(0 0 ${(6 + 10 * span(f, T_WONT, T_WONT + 12)).toFixed(1)}px rgba(246,160,58,0.9))`;
        const un = gIn(span(f, T_WONT + 8, T_WONT + 26));
        $("#unch").style.opacity = un.toFixed(3); $("#unch").style.marginLeft = `${mix(-8, 0, un).toFixed(1)}px`;
      }
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sizeTrace(); render(R._f); });
    window.addEventListener("load", () => { sizeTrace(); render(R._f); });
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
