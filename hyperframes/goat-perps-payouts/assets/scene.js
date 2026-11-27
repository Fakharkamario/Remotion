// GOAT Funded Perps: "Payouts" (171 frames @ 30 fps), built on the supplied reference: a field of small product cards
// floating at different depths (out of focus away from the focal plane) that dissolve in through a gold halftone band,
// while short centred phrases replace each other with a wipe whose leading edge breaks into gold dots; the last line
// types in through flickering gold glyphs inside a dashed selection box. In the Perps brand, timed to the voiceover:
//   "Respect your drawdown. Withdraw your profits with daily payouts and same-day processing."
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 171;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 13; return ((Math.imul(h, 1103515245) >>> 0) % 10007) / 10007; };
  const glide = (a, b) => {
    const N = 400, T = [0];
    for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N; T.push(T[i - 1] + Math.pow(u, a) * Math.pow(1 - u, b)); }
    return (x) => { const v = clamp(x, 0, 1) * N, i = Math.min(N - 1, Math.floor(v)); return mix(T[i], T[i + 1], v - i) / T[N]; };
  };
  const gW = glide(1.6, 3.2), gIn = glide(1.15, 4), gHand = glide(2, 3);

  // ---------------- timing (frames) from the voiceover's word times ----------------
  // Respect 0.00, drawdown 0.82-1.42, Withdraw 1.84, profits 2.34-2.74, daily 3.22, payouts 3.54-4.04,
  // same-day 4.26-4.72, processing 4.72-5.26
  const PHRASES = ["Respect your drawdown", "Withdraw your profits", "Daily payouts"];
  const WIPES = [ // [from, to, start, frames]; -1 is nothing
    [-1, 0, 2, 18], [0, 1, 52, 18], [1, 2, 93, 16], [2, -1, 119, 13],
  ];
  const P4 = 126, P4_TEXT = "SAME-DAY PROCESSING";

  // ---------------- the card field ----------------
  const KINDS = [
    (n) => `<div class="h"><span class="ic">⌁</span>Account ${n} · 9140${(n * 7919) % 100000}<span class="bd"><span class="b-live">Live</span><span class="b-mut">Match-Trader</span></span></div>
      <div class="meta"><i>◆</i>1-Step Challenge · GOAT<br/><i>◷</i>Started Nov 2, 2026</div>
      <div class="st"><div><small>Starting balance</small><b>$50k</b></div><div><small>Current equity</small><b>$52.4k</b></div><div><small>Phase</small><b>Funded</b></div></div>
      <div class="bt"><span>Credentials</span><span>Direct login</span><span class="gold">View dashboard</span></div>`,
    (n) => `<div class="h"><span class="ic">$</span>Payout #20${40 + n}<span class="bd"><span class="b-ok">Paid</span></span></div>
      <div class="meta"><i>◆</i>Requested 09:12 · paid same day<br/><i>◷</i>Daily payout · 90% split</div>
      <div class="st"><div><small>Amount</small><b class="g">$${(1240 + n * 317) % 3000 + 600}</b></div><div><small>Split</small><b>90%</b></div><div><small>Status</small><b>Processed</b></div></div>
      <div class="bt"><span>Receipt</span><span class="gold">Withdraw</span></div>`,
    (n) => `<div class="h"><span class="ic">◔</span>Drawdown · Account ${n}<span class="bd"><span class="b-ok">Within limit</span></span></div>
      <div class="meta"><i>◆</i>Balance-based daily loss · 4%</div>
      <div class="st"><div><small>Used today</small><b>$${(n * 263) % 900 + 120}</b></div><div><small>Limit</small><b>$2,000</b></div><div><small>Max loss</small><b>8%</b></div></div>
      <div class="dd"><i style="width:${18 + (n * 13) % 40}%"></i></div>`,
  ];
  const CARDS = [ // x, y, z, kind, frame it sweeps in (a few are in when the shot opens)
    [-660, -330, -200, 0, -30], [600, -280, -120, 1, 8], [-960, 170, -480, 2, 30], [800, 190, -60, 0, -30],
    [180, 400, -300, 1, 58], [-360, 470, 40, 2, 84], [1000, -520, -700, 1, 100], [-1140, -560, -900, 0, 18],
    [-80, -420, -1350, 1, 70], [1260, 620, -900, 2, 120], [-1520, 260, -1500, 0, 136], [240, 60, -2300, 1, 44],
  ];
  const SWEEP = 18;

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <div id="bg" class="layer"></div>
      <div id="field" class="layer"><div id="world">
        ${CARDS.map((c, i) => `<div class="acc" id="c${i}"><div class="in">${KINDS[c[3]](i + 1)}</div><div class="ht" id="h${i}"></div></div>`).join("")}
      </div></div>
      <canvas id="txt" width="1920" height="300"></canvas>
      <div id="p4"><svg class="icon" id="icon" viewBox="0 0 64 64"><defs><linearGradient id="ig" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#FFF0B8"/><stop offset="1" stop-color="#D7A82B"/></linearGradient></defs>
          <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#ig)"/><path d="M36 12 L20 36 H31 L27 52 L44 27 H33 Z" fill="#1C1604"/></svg>
        <div class="box"><div class="frame" id="frame"><b style="left:-5px;top:-5px"></b><b style="right:-5px;top:-5px"></b><b style="left:-5px;bottom:-5px"></b><b style="right:-5px;bottom:-5px"></b></div>
          <div class="t" id="t4">${[...P4_TEXT].map((ch, i) => `<span data-c="${ch}">${ch === " " ? "&nbsp;" : ch}</span>`).join("")}</div>
          ${Array.from({ length: 7 }, (_, i) => `<i class="spark" id="sp${i}"></i>`).join("")}</div>
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
    const cardEls = CARDS.map((_, i) => $(`#c${i}`)), htEls = CARDS.map((_, i) => $(`#h${i}`));

    // ---- the phrases, pre-rendered once the fonts are in, with an alpha map for the dots ----
    const TW = 1920, TH = 300, CELL = 15;
    let PH = null;
    const buildPhrases = () => {
      PH = PHRASES.map((s) => {
        const c = document.createElement("canvas"); c.width = TW; c.height = TH;
        const g = c.getContext("2d"); g.font = '600 104px Altform'; g.textAlign = "center"; g.textBaseline = "middle";
        const w = g.measureText(s).width;
        const gr = g.createLinearGradient(0, 95, 0, 205); gr.addColorStop(0, "#FFF7DE"); gr.addColorStop(0.55, "#F6DC8E"); gr.addColorStop(1, "#D9A93A");
        g.fillStyle = gr; g.fillText(s, TW / 2, TH / 2 + 4);
        const a = g.getImageData(0, 0, TW, TH).data, cols = Math.ceil(TW / CELL), rows = Math.ceil(TH / CELL), cov = new Float32Array(cols * rows);
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          let s2 = 0, n = 0;
          for (let y = r * CELL; y < Math.min(TH, r * CELL + CELL); y += 3) for (let x = q * CELL; x < Math.min(TW, q * CELL + CELL); x += 3) { s2 += a[(y * TW + x) * 4 + 3]; n++; }
          cov[r * cols + q] = s2 / (n * 255);
        }
        return { c, w, L: TW / 2 - w / 2, R: TW / 2 + w / 2, cov, cols, rows };
      });
    };
    const ctx = $("#txt").getContext("2d");
    const drawText = (f) => {
      ctx.clearRect(0, 0, TW, TH);
      if (!PH) return;
      let W = null; for (const w of WIPES) if (f >= w[2]) W = w;
      if (!W) return;
      const [from, to, t0, d] = W, A = from >= 0 ? PH[from] : null, B = to >= 0 ? PH[to] : null;
      const k = gW(span(f, t0, t0 + d));
      if (k >= 1) { if (B) ctx.drawImage(B.c, 0, 0); return; }
      const L = Math.min(A ? A.L : 1e9, B ? B.L : 1e9) - 140, Rr = Math.max(A ? A.R : -1e9, B ? B.R : -1e9) + 140;
      const fx = mix(L, Rr, k), BAND = 150;
      // the new phrase is solid behind the front; the old one dims and holds ahead of it
      if (B) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, fx - 46), TH); ctx.clip(); ctx.drawImage(B.c, 0, 0); ctx.restore(); }
      if (A) { ctx.save(); ctx.beginPath(); ctx.rect(fx + 46, 0, TW, TH); ctx.clip(); ctx.globalAlpha = 1 - 0.5 * smooth(span(f, t0 - 2, t0 + 5)); ctx.filter = "saturate(0.25) brightness(0.8)"; ctx.drawImage(A.c, 0, 0); ctx.restore(); }
      // a soft gold bloom rides with the front
      const gl = ctx.createRadialGradient(fx, TH / 2, 0, fx, TH / 2, 230);
      gl.addColorStop(0, "rgba(246,200,90,0.26)"); gl.addColorStop(1, "rgba(246,200,90,0)");
      ctx.fillStyle = gl; ctx.fillRect(fx - 240, 0, 480, TH);
      // the front itself breaks the letters into gold dots
      ctx.save(); ctx.shadowColor = "rgba(246,196,80,0.85)"; ctx.shadowBlur = 10;
      const P = B || A;
      const q0 = Math.max(0, Math.floor((fx - BAND - 60) / CELL)), q1 = Math.min(P.cols - 1, Math.ceil((fx + BAND + 60) / CELL));
      for (let q = q0; q <= q1; q++) for (let r = 0; r < P.rows; r++) {
        const cx = q * CELL + CELL / 2, cy = r * CELL + CELL / 2, j = (hash(q, r) - 0.5) * 90, dx = cx - fx + j;
        const src = dx < 0 ? B : A; if (!src) continue;
        const cov = src.cov[r * P.cols + q]; if (cov < 0.04) continue;
        const prof = Math.max(0, 1 - Math.abs(dx) / BAND); if (prof <= 0) continue;
        const rad = 7.6 * Math.sqrt(cov) * Math.pow(prof, 0.7);
        ctx.globalAlpha = Math.min(1, 0.35 + prof);
        ctx.fillStyle = hash(r, q) > 0.75 ? "#FFF1C4" : "#F2C14E";
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    // ---- the last line ----
    const t4 = $("#t4"), spans = [...t4.children], frame = $("#frame");
    const GL = "#%+*@=&$/<>";
    let offs = null;
    const measure = () => { offs = spans.map((s) => [s.offsetLeft, s.offsetWidth]); };
    const N4 = spans.length;
    const drawP4 = (f) => {
      const p4 = $("#p4"); p4.style.display = f >= P4 - 2 ? "" : "none"; if (f < P4 - 2) return;
      if (!offs) measure();
      const ic = gIn(span(f, P4 - 2, P4 + 10));
      $("#icon").style.transform = `scale(${mix(0.6, 1, ic).toFixed(3)})`; $("#icon").style.opacity = ic.toFixed(3);
      const n = (N4 + 4) * gW(span(f, P4, P4 + 22));
      spans.forEach((s, i) => {
        const c = s.dataset.c, col = `rgb(${Math.round(mix(238, 236, i / N4))}, ${Math.round(mix(240, 196, Math.pow(i / N4, 1.6)))}, ${Math.round(mix(242, 92, Math.pow(i / N4, 1.6)))})`;
        if (i < n - 4) { s.textContent = c === " " ? " " : c; s.className = ""; s.style.color = col; s.style.opacity = 1; }
        else if (i < n && c !== " ") { s.textContent = GL[Math.floor(hash(i, Math.floor(f / 2)) * GL.length)]; s.className = "gl"; s.style.color = ""; s.style.opacity = 1; }
        else { s.textContent = c === " " ? " " : c; s.style.opacity = 0; }
      });
      // the selection box grows with the type, then settles a touch dimmer
      const last = Math.min(N4 - 1, Math.max(0, Math.floor(n))), [ox, ow] = offs[last];
      frame.style.width = `${(18 + Math.min(ox + ow, offs[N4 - 1][0] + offs[N4 - 1][1]) + 18).toFixed(1)}px`;
      frame.style.opacity = (Math.min(1, n * 0.5) * (1 - 0.35 * span(f, P4 + 30, P4 + 44))).toFixed(3);
      const fpx = 18 + (offs[Math.min(N4 - 1, Math.floor(n))] || [0])[0];
      for (let i = 0; i < 7; i++) {
        const sp = $(`#sp${i}`), live = n > 0 && n < N4 + 3, h = hash(i, Math.floor(f / 3));
        sp.textContent = GL[Math.floor(hash(i + 9, Math.floor(f / 2)) * GL.length)];
        sp.style.left = `${(fpx + (h - 0.2) * 150).toFixed(1)}px`; sp.style.top = `${(10 + (hash(i + 3, Math.floor(f / 3)) - 0.5) * 120).toFixed(1)}px`;
        sp.style.opacity = live ? (0.4 + 0.6 * hash(i, f)).toFixed(3) : 0;
      }
    };

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      // camera: already drifting forward when the shot opens, with a soft surge into the field on each new phrase
      const cam = 560 * (f / FRAMES) + 150 * gW(span(f, 48, 80)) + 130 * gW(span(f, 89, 119)) + 150 * gW(span(f, 121, 155));
      const u = f / FRAMES;
      $("#world").style.transform = `translate3d(${mix(90, -90, u).toFixed(1)}px, ${mix(18, -18, u).toFixed(1)}px, ${cam.toFixed(1)}px) rotateY(${mix(-3, 2.5, u).toFixed(3)}deg) rotateX(${mix(2, -1.5, u).toFixed(3)}deg)`;
      CARDS.forEach(([x, y, z, , tin], i) => {
        const el = cardEls[i], ze = z + cam;
        // depth of field: sharp around the focal plane, softer in front and behind; cards passing the lens fade
        const blur = Math.min(9, Math.abs(ze - 60) / 170);
        el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
        el.style.filter = `blur(${blur.toFixed(2)}px) brightness(${(0.82 - Math.min(0.5, Math.max(0, -ze - 300) / 2400)).toFixed(3)})`;
        el.style.opacity = (1 - span(ze, 520, 800)).toFixed(3);
        // the halftone sweep: content revealed behind a front of gold dots
        const X = mix(-25, 135, gHand(span(f, tin, tin + SWEEP)));
        if (X >= 135) { el.style.webkitMaskImage = el.style.maskImage = "none"; htEls[i].style.opacity = 0; }
        else {
          const m = `linear-gradient(90deg, #000 ${(X - 4).toFixed(1)}%, transparent ${(X + 2).toFixed(1)}%)`;
          el.style.webkitMaskImage = el.style.maskImage = m;
          const hm = `linear-gradient(90deg, transparent ${(X - 34).toFixed(1)}%, #000 ${(X - 10).toFixed(1)}%, #000 ${(X + 2).toFixed(1)}%)`;
          htEls[i].style.webkitMaskImage = htEls[i].style.maskImage = hm; htEls[i].style.opacity = 1;
        }
      });
      const ts = 1 + 0.025 * u;
      $("#txt").style.transform = `scale(${ts.toFixed(4)})`;
      drawText(f);
      drawP4(f);
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    const ready = () => { buildPhrases(); const p = $("#p4"), d = p.style.display; p.style.display = ""; measure(); p.style.display = d; render(R._f); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready);
    window.addEventListener("load", ready);
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
