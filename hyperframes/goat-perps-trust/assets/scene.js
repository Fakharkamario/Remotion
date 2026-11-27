// GOAT Funded Perps: "Trust" (363 frames @ 30 fps), built on the supplied reference: gold rods drifting over a
// typed line; a product card that tumbles in and switches tabs; people cards that arrive white-hot and cool to
// photographs; a pill toggle that flips to gold while a heavy dark shape dissolves; a crowd glowing gold.
// In the Perps brand, timed to the supplied voiceover:
//   "Backed by GOAT Funded, with over 3 years in business, more than 1.1 million traders and over $33 million
//    in rewards paid out, rated 4.7 by over 17,000 traders."
// render(f) is a pure function of the frame number.
(function () {
  const FPS = 30, FRAMES = 363;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const glide = (a, b) => {
    const N = 400, T = [0];
    for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N; T.push(T[i - 1] + Math.pow(u, a) * Math.pow(1 - u, b)); }
    return (x) => { const v = clamp(x, 0, 1) * N, i = Math.min(N - 1, Math.floor(v)); return mix(T[i], T[i + 1], v - i) / T[N]; };
  };
  const gW = glide(1.6, 3.2), gIn = glide(1.15, 4), gHand = glide(2, 3), gCount = glide(1.3, 2.6);

  // ---------------- timing (frames) from the voiceover's word times ----------------
  // Backed 0, GOAT Funded 0.58-1.22 | with over 3 years 1.50-2.40, business 2.62-2.92 | more than 1.1 million
  // 3.32-4.68, traders 4.68-5.18 | and over $33 million 5.18-6.84, rewards 7.46, paid out 7.82-8.50 |
  // rated 4.7 8.56-9.72, by over 17,000 9.72-11.40, traders 11.40-11.74
  const CUT1 = 48, CUT2 = 98, CUT3 = 166, CUT4 = 256;
  const TABS = [56, 64, 73];
  const PEOPLE_AT = [100, 113, 126];
  const T_PAID = 234, T_RATED = 260, T_17K = 300;

  const star = `<svg viewBox="0 0 24 24"><path d="M12 2.2l2.95 6.3 6.85.75-5.1 4.65 1.42 6.75L12 17.2l-6.12 3.45 1.42-6.75-5.1-4.65 6.85-.75z"/></svg>`;
  const LINE = "Backed by";

  const SCENE = {};
  SCENE.mount = function (stage) {
    const dust = Array.from({ length: 46 }, (_, i) => { const r = rng(40 + i); return [r() * 1920, r() * 1080, 0.4 + r() * 1.6, r()]; });
    stage.innerHTML = `
      <div class="shot bgw2" id="s1">
        ${dust.map((d, i) => `<i class="dust" id="d${i}"></i>`).join("")}
        <div class="rod" id="rodA"><div class="bd"></div><div class="tp"></div></div>
        <div class="rod silver" id="rodB"><div class="bd"></div><div class="tp"></div></div>
        <div class="rod" id="rodC"><div class="bd"></div><div class="tp"></div></div>
        <div id="line1"><div class="w" id="w1">${[...LINE].map((c) => `<span>${c === " " ? "&nbsp;" : c}</span>`).join("")}</div>
          <div id="logoW"><img src="assets/goat-logo-white.svg" alt=""/><b>GOAT FUNDED</b></div></div>
      </div>
      <div class="shot bgw" id="s2" style="display:none"><div class="persp">
        <div id="card2"><small>TRUSTED SINCE 2023</small><h2><em>3+ YEARS</em> IN BUSINESS</h2>
          <div class="tabs" id="tabs"><i class="knob" id="tk"></i><span>2023</span><span>2024</span><span>2025</span><span>2026</span></div>
          <div class="val">${["YEAR 1", "YEAR 2", "YEAR 3", "3+ YEARS"].map((v, i) => `<div id="v${i}">${v}</div>`).join("")}</div>
          <span class="btn2">Trade with GOAT Funded</span></div></div></div>
      <div class="shot bgw" id="s3" style="display:none">
        <div class="layer" id="row3">
          ${[["p1", "TRADER", "246,192,80"], ["p2", "FUNDED", "236,139,27"], ["p3", "PAID OUT", "200,214,232"]].map(([p, l, c], i) => `
          <div class="pc" id="pc${i}" data-c="${c}"><div class="fr"><img src="assets/${p}.jpg" alt=""/><div class="tint" style="background:linear-gradient(0deg, rgba(${c},0.55), rgba(${c},0) 55%)"></div></div><small>${l}</small></div>`).join("")}
        </div>
        <div class="tg" id="tg3" style="top:790px"><i class="knob g" id="k3"></i><span id="a3">TRADERS</span><span id="b3" style="color:#1C1604">1.1M+</span></div>
      </div>
      <div class="shot bgw2" id="s4" style="display:none">
        <div id="cap4">IN REWARDS</div>
        <div class="persp"><div id="fig4" class="layer" style="transform-style:preserve-3d"><div id="big4">$33M+</div><div id="gold4">$33M+</div></div></div>
        <div class="tg" id="tg4" style="top:760px"><i class="knob w" id="k4w"></i><i class="knob g" id="k4g"></i><span id="a4">PENDING</span><span id="b4">PAID OUT</span></div>
      </div>
      <div class="shot bgw2" id="s5" style="display:none">
        <svg width="0" height="0" style="position:absolute"><defs>${[0, 1, 2, 3, 4].map((i) => `<filter id="hf${i}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR id="hr${i}" type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncG id="hg${i}" type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncB id="hb${i}" type="gamma" amplitude="1" exponent="1" offset="0"/></feComponentTransfer><feColorMatrix id="hm${i}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>`).join("")}</defs></svg>
        <div class="layer" id="crowd">
          ${[["p2", 340, 440, -600, 0.62, 1], ["p1", 340, 440, 600, 0.62, 1], ["p1", 440, 600, -360, 0.82, 0], ["p2", 440, 600, 360, 0.82, 0], ["p3", 560, 960, 0, 1, 0]]
            .map(([p, w, h, x, s, fl], i) => `<div class="ppl" id="pp${i}" data-x="${x}" data-s="${s}" style="width:${w}px;height:${h}px;margin-left:${-w / 2}px"><img src="assets/${p}.jpg" alt="" style="${fl ? "transform:scaleX(-1)" : ""}"/><i class="heat"></i></div>`).join("")}
        </div>
        <div class="tg" id="tg5" style="top:700px"><i class="knob g" id="k5"></i>
          <span id="a5"><span class="stars">${[0, 1, 2, 3, 4].map((i) => `<i>${star.replace("<path", '<path fill="rgba(255,255,255,0.14)"')}<b id="st${i}" style="position:absolute;inset:0;overflow:hidden;width:0">${star.replace("<path", '<path fill="#F2C14E"')}</b></i>`).join("")}</span><b id="r5">4.7</b></span>
          <span id="b5"><b id="n5">17,000+</b> TRADERS</span></div>
      </div>
      <div id="flash" class="layer"></div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;

    const $ = (s) => stage.querySelector(s);
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    const shots = [1, 2, 3, 4, 5].map((i) => $(`#s${i}`));
    const letters = [...$("#w1").children];

    // toggle geometry, measured once the fonts are in
    const G = {};
    const geo = (id) => { const e = $(id); return [e.offsetLeft, e.offsetWidth]; };
    const layout = () => {
      const keep = shots.map((s) => s.style.display); shots.forEach((s) => (s.style.display = ""));
      ["#b3", "#n5", "#r5"].forEach((id) => { const e = $(id); e.style.minWidth = ""; e.style.display = "inline-block"; e.style.textAlign = "center"; e.style.minWidth = `${e.offsetWidth + 2}px`; });
      ["#a3", "#b3", "#a4", "#b4", "#a5", "#b5"].forEach((id) => (G[id] = geo(id)));
      const t = $("#tabs").children; G.tab = [t[1].offsetLeft, t[1].offsetWidth, t[2].offsetLeft - t[1].offsetLeft];
      shots.forEach((s, i) => (s.style.display = keep[i]));
    };
    layout();
    const knob = (el, a, b, k) => { el.style.left = `${mix(G[a][0], G[b][0], k).toFixed(1)}px`; el.style.width = `${mix(G[a][1], G[b][1], k).toFixed(1)}px`; };
    const heatFilter = (h, gray) => `grayscale(${((1 - h) * gray).toFixed(3)}) brightness(${(0.92 + 4.2 * h).toFixed(3)}) sepia(${(0.85 * h).toFixed(3)}) saturate(${(1 + 2.2 * h).toFixed(3)}) contrast(${(1 + 0.25 * h).toFixed(3)})`;

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const shot = f < CUT1 ? 1 : f < CUT2 ? 2 : f < CUT3 ? 3 : f < CUT4 ? 4 : 5;
      shots.forEach((s, i) => (s.style.display = i + 1 === shot ? "" : "none"));
      // a warm flash carries the cut from the opening line to the card (the reference's light flash)
      $("#flash").style.opacity = (f < CUT1 ? 0.95 * Math.pow(span(f, CUT1 - 5, CUT1), 2) : 0.95 * (1 - gIn(span(f, CUT1, CUT1 + 9)))).toFixed(3);

      if (shot === 1) {
        // rods drift slowly along their own axes; dust floats; the line types on and the logo wipes in
        const u = f / CUT1;
        const rod = (id, x, y, rot, dx, dy, s, bl) => { $(id).style.transform = `translate(${(x + dx * u).toFixed(1)}px, ${(y + dy * u).toFixed(1)}px) rotate(${rot}deg) scale(${s})`; $(id).style.filter = `blur(${bl}px)`; };
        rod("#rodA", 1160, -150, 208, -70, 110, 1.0, 0.6); rod("#rodB", 300, 820, 22, 50, -60, 0.8, 1.4); rod("#rodC", 1640, 760, 200, -40, 50, 0.5, 3.2);
        dust.forEach(([x, y, s, ph], i) => { const e = $(`#d${i}`); e.style.transform = `translate(${(x - 40 * u * s).toFixed(1)}px, ${(y - 26 * u * s).toFixed(1)}px) scale(${s.toFixed(2)})`; e.style.opacity = (0.25 + 0.5 * Math.abs(Math.sin(ph * 6 + f * 0.08))).toFixed(3); });
        letters.forEach((s, i) => {
          const k = span(f, 1 + i * 1.3, 4 + i * 1.3);
          s.style.opacity = k.toFixed(3);
          s.style.color = k < 1 ? "#F6D06A" : "#F2EFE8";
          s.style.textShadow = k < 1 ? "0 0 16px rgba(246,200,90,0.9)" : "none";
        });
        const lw = gW(span(f, 16, 32));
        $("#logoW").style.clipPath = `inset(-20px ${(100 - lw * 100).toFixed(1)}% -20px -20px)`;
        $("#logoW").style.filter = lw < 1 ? `drop-shadow(0 0 ${(18 * (1 - lw)).toFixed(1)}px rgba(246,200,90,0.9))` : "none";
        $("#line1").style.transform = `translate(-50%, -50%) scale(${(1 + 0.07 * gIn(span(f, 0, 60))).toFixed(4)})`;
      } else if (shot === 2) {
        // the card tumbles in, settles, and keeps turning slowly while its tabs step through the years
        const a = gIn(span(f, CUT1, CUT1 + 26)), d = span(f, CUT1 + 10, CUT2);
        $("#card2").style.transform = `translateZ(${mix(-520, 0, a).toFixed(1)}px) rotateX(${(mix(64, 10, a) - 4 * d).toFixed(2)}deg) rotateY(${(mix(-34, -14, a) + 18 * d).toFixed(2)}deg) rotateZ(${(mix(-26, -4, a) + 3 * d).toFixed(2)}deg)`;
        const k = TABS.reduce((s, t) => s + gW(span(f, t, t + 8)), 0);
        const tk = $("#tk"); tk.style.left = `${(G.tab[0] + k * G.tab[2]).toFixed(1)}px`; tk.style.width = `${G.tab[1]}px`;
        [...$("#tabs").children].slice(1).forEach((s, i) => (s.style.color = Math.abs(k - i) < 0.5 ? "#1C1604" : "#A9AFB7"));
        [0, 1, 2, 3].forEach((i) => { const e = $(`#v${i}`), dd = i - k; e.style.opacity = Math.max(0, 1 - Math.abs(dd) * 1.7).toFixed(3); e.style.transform = `translateY(${(dd * 60).toFixed(1)}px)`; });
      } else if (shot === 3) {
        // people: each arrives white-hot and cools to a photograph; the row re-centres as the next one lands
        const c = gW(span(f, PEOPLE_AT[1] - 2, PEOPLE_AT[1] + 12)) + gW(span(f, PEOPLE_AT[2] - 2, PEOPLE_AT[2] + 12));
        const pull = gIn(span(f, CUT2, CUT3 + 20));
        $("#row3").style.transform = `scale(${mix(1.08, 0.96, pull).toFixed(4)})`;
        PEOPLE_AT.forEach((t, i) => {
          const e = $(`#pc${i}`), a = gIn(span(f, t - 2, t + 10)), h = 1 - gHand(span(f, t + 2, t + 18)), col = e.dataset.c;
          e.style.transform = `translate(${((i - c / 2) * 400).toFixed(1)}px, ${mix(50, 0, a).toFixed(1)}px) scale(${mix(1.14, 1, a).toFixed(4)})`;
          e.style.opacity = Math.min(1, a * 2).toFixed(3);
          e.querySelector("img").style.filter = heatFilter(h, 1);
          e.style.filter = `blur(${((1 - a) * 10).toFixed(1)}px) drop-shadow(0 ${(18 - 8 * h).toFixed(1)}px ${(30 + 40 * h).toFixed(1)}px rgba(${h > 0.3 ? "255,236,190" : col},${(0.45 + 0.4 * h).toFixed(2)}))`;
        });
        const p = gIn(span(f, 102, 118));
        $("#tg3").style.opacity = p.toFixed(3); $("#tg3").style.transform = `translate(-50%, ${mix(40, 0, p).toFixed(1)}px)`;
        knob($("#k3"), "#b3", "#b3", 0);
        $("#b3").textContent = `${(1.1 * gCount(span(f, 106, 142))).toFixed(1)}M+`;
      } else if (shot === 4) {
        // a heavy dark figure counts up; on "paid out" the switch flips to gold and the figure dissolves to gold
        const u = span(f, CUT3, CUT4), a = gIn(span(f, CUT3, CUT3 + 30));
        $("#fig4").style.transform = `translateZ(${mix(-260, 0, a).toFixed(1)}px) rotateY(${mix(-14, 8, u).toFixed(2)}deg) rotateX(${mix(10, 2, a).toFixed(2)}deg)`;
        const m = Math.round(33 * gCount(span(f, CUT3 + 6, 206)));
        $("#big4").textContent = $("#gold4").textContent = `$${m}M+`;
        $("#cap4").style.opacity = (0.6 * gIn(span(f, CUT3 + 4, CUT3 + 20))).toFixed(3);
        const X = mix(-25, 125, gW(span(f, T_PAID + 2, T_PAID + 18))), R = 20 * gHand(span(f, T_PAID + 2, T_PAID + 16));
        const g4 = $("#gold4");
        if (f >= T_PAID + 20) { g4.style.webkitMaskImage = g4.style.maskImage = "none"; g4.style.opacity = 1; }
        else if (f < T_PAID + 2) g4.style.opacity = 0;
        else {
          g4.style.opacity = 1;
          const mk = `radial-gradient(circle, #000 ${R.toFixed(2)}px, transparent ${(R + 1).toFixed(2)}px), linear-gradient(90deg, #000 ${(X - 25).toFixed(1)}%, transparent ${X.toFixed(1)}%)`;
          g4.style.webkitMaskImage = g4.style.maskImage = mk;
          g4.style.webkitMaskSize = g4.style.maskSize = "26px 26px, 100% 100%";
          g4.style.webkitMaskComposite = "source-in"; g4.style.maskComposite = "intersect";
        }
        $("#big4").style.opacity = (1 - span(f, T_PAID + 10, T_PAID + 20)).toFixed(3);
        const p = gIn(span(f, CUT3 + 8, CUT3 + 26)), sw = gW(span(f, T_PAID - 2, T_PAID + 8));
        $("#tg4").style.opacity = p.toFixed(3); $("#tg4").style.transform = `translate(-50%, ${mix(40, 0, p).toFixed(1)}px)`;
        knob($("#k4w"), "#a4", "#b4", sw); knob($("#k4g"), "#a4", "#b4", sw);
        $("#k4w").style.opacity = (1 - span(sw, 0.3, 0.8)).toFixed(3); $("#k4g").style.opacity = span(sw, 0.3, 0.8).toFixed(3);
        $("#a4").style.color = sw < 0.5 ? "#15171B" : "#C9CDD3"; $("#b4").style.color = sw > 0.5 ? "#1C1604" : "#C9CDD3";
      } else {
        // the crowd glows gold and cools from the centre outward; the switch reads the rating, then the count
        const u = span(f, CUT4, FRAMES), a = gIn(span(f, CUT4, CUT4 + 30));
        $("#crowd").style.transform = `translateY(${mix(30, -10, a).toFixed(1)}px) scale(${mix(1.0, 1.07, u).toFixed(4)})`;
        [3, 3, 1, 1, 0].forEach((ring, i) => {
          const e = $(`#pp${i}`), x = +e.dataset.x, s = +e.dataset.s, t = CUT4 + 16 + ring * 8;
          const h = 1 - gHand(span(f, t, t + 26)), rise = gIn(span(f, CUT4 + ring * 3, CUT4 + 26 + ring * 3));
          e.style.transform = `translateX(${(x * mix(0.9, 1, a)).toFixed(1)}px) translateY(${mix(60, 0, rise).toFixed(1)}px) scale(${s})`;
          e.style.opacity = Math.min(1, rise * 2).toFixed(3);
          // white-hot: a gamma curve keeps the near-black backdrop black and blows skin, chains and edges out to gold-white
          e.querySelector("img").style.filter = `contrast(${(1 + 1.5 * h).toFixed(3)}) brightness(${(1 + 2.8 * h).toFixed(3)}) sepia(${(0.85 * h).toFixed(3)}) saturate(${(1 + 1.6 * h).toFixed(3)}) blur(${(s < 0.7 ? 2.5 : s < 0.9 ? 1 : 0)}px)`;
          e.style.zIndex = ring === 0 ? 3 : ring === 1 ? 2 : 1;
        });
        const p = gIn(span(f, CUT4 + 2, CUT4 + 20)), sw = gW(span(f, T_17K - 6, T_17K + 6));
        $("#tg5").style.opacity = p.toFixed(3); $("#tg5").style.transform = `translate(-50%, ${mix(40, 0, p).toFixed(1)}px)`;
        $("#tg5").style.zIndex = 5;
        knob($("#k5"), "#a5", "#b5", sw);
        $("#a5").style.color = sw < 0.5 ? "#1C1604" : "#C9CDD3"; $("#b5").style.color = sw > 0.5 ? "#1C1604" : "#C9CDD3";
        const F = 4.7 * gCount(span(f, T_RATED, T_RATED + 30));
        $("#r5").textContent = F.toFixed(1);
        for (let i = 0; i < 5; i++) $(`#st${i}`).style.width = `${(34 * clamp(F - i, 0, 1)).toFixed(1)}px`;
        $("#n5").style.opacity = span(f, T_17K - 14, T_17K - 6).toFixed(3);
        for (let i = 0; i < 5; i++) $(`#st${i} path`).setAttribute("fill", sw < 0.5 ? "#1C1604" : "#F2C14E");
        $("#n5").textContent = `${Math.round(17000 * gCount(span(f, T_17K - 10, T_17K + 40))).toLocaleString("en-US")}+`;
      }
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    const ready = () => { layout(); render(R._f); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready);
    window.addEventListener("load", ready);
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
