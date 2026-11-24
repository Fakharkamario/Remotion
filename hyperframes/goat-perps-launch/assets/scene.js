// Timeline + DOM layer for the GOAT Funded Perps launch (scenes 1-2, 330 frames @ 30 fps).
// render(f) is a pure function of the frame: the 3D world draws on #gl, and the copy, light shapes, washes,
// flashes and grain are DOM/canvas layers above it.
(function () {
  const FPS = 30, FRAMES = 330;
  const { C, FD, FB, rng } = TEX;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const ease = (x) => { const t = clamp(x, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const easeIn = (x) => Math.pow(clamp(x, 0, 1), 3);
  const expoOut = (x) => { const t = clamp(x, 0, 1); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  const S = WORLD.SHOTS;

  const SCENE = {};
  const show = (el, on) => { el.style.display = on ? "" : "none"; };
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <canvas id="gl" width="1920" height="1080"></canvas>
      <div id="wash" class="layer"></div>
      <div id="lights" class="layer"><div class="comet"></div><div class="louvre"></div><div class="streaks"><i></i><i></i><i></i></div></div>
      <div id="ghost" class="ghost">CLOSED</div>
      <div id="dots" class="layer"><i></i><i></i><i></i></div>
      <div id="t1" class="copy"></div>
      <div id="t2" class="copy"></div>
      <div id="closed" class="tumble"></div>
      <div id="intro" class="intro"><span></span>INTRODUCING</div>
      <div id="lockup" class="lockup"><div class="gf chrome">GOAT FUNDED</div><div id="perpsw" class="copy"></div><span class="live"><i></i>LIVE</span></div>
      <div id="t247" class="tumble"></div>
      <div id="counter" class="counter"><div class="row"><b id="num">1</b><b id="s7">/7</b></div><span>HOURS A DAY</span></div>
      <div id="t3" class="copy"></div>
      <div id="mosaic" class="layer"></div>
      <div id="wflash" class="layer"></div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);
    const gl = $("#gl");
    WORLD.mount(gl);

    // copy, animated as in the GOAT Trade Copier reference
    const T1 = new TYPE.GlowText($("#t1"), [{ t: "Markets don’t ", c: "#EFF4FA" }, { t: "sleep.", c: "#F6A03A" }], { size: 84, weight: 600, mode: "writer", glow: "#EC8B1B", spark: "#FFE3BF" });
    const T2 = new TYPE.GlowText($("#t2"), [{ t: "Why should your trading?", c: "#FF8F86" }], { size: 76, weight: 400, mode: "glow", glow: "#FF3B30", spark: "#FFE1DC" });
    const T3 = new TYPE.GlowText($("#t3"), [{ t: "Weekends ", c: "#EFF4FA" }, { t: "included.", c: "#F6A03A" }], { size: 84, weight: 600, mode: "glow", glow: "#EC8B1B", spark: "#FFE3BF" });
    const PW = new TYPE.GlowText($("#perpsw"), [{ t: "PERPS", c: "#EFF4FA" }], { size: 58, weight: 600, spacing: 16, mode: "writer", glow: "#EC8B1B", spark: "#FFE3BF" });
    const TC = new TYPE.Tumble($("#closed"), [{ t: "MARKET", cls: "acc" }, { t: " ", cls: "" }, { t: "CLOSED?", cls: "chrome" }]);
    const T247 = new TYPE.Tumble($("#t247"), [{ t: "24", cls: "acco" }, { t: "/7", cls: "chrome" }]);
    const place = (el, gt, x, y, align) => { if (!gt.ready) return; el.style.left = `${align === "center" ? x - gt.tw / 2 : x}px`; el.style.top = `${y}px`; };
    const ghost = $("#ghost"), dots = $("#dots"), wflash = $("#wflash"), mosaic = $("#mosaic");
    // big blocky pixel squares behind the reveal, as in the reference's "GOAT TRADE" frame
    { const r = rng(77); let h = ""; for (let i = 0; i < 70; i++) { const x = Math.floor(r() * 30) * 64, y = Math.floor(r() * 17) * 64, a = (0.08 + r() * 0.3) * (x < 700 || x > 1250 ? 1 : 0.4); h += `<i style="left:${x}px;top:${y}px;opacity:${a.toFixed(2)}"></i>`; } mosaic.innerHTML = h; }
    [...dots.children].forEach((d, i) => { d.style.backgroundImage = `url(${TYPE.dotPatch(420, 300, "#F6A03A", 91 + i)})`; });

    const wash = $("#wash"), comet = $(".comet"), louvre = $(".louvre"), streaks = $(".streaks");
    const closed = $("#closed"), t247 = $("#t247"), counter = $("#counter"), n365 = $("#num"), s7 = $("#s7"), crow = $("#counter .row"), clabel = $("#counter span");
    const intro = $("#intro"), lockup = $("#lockup"), gf = $("#lockup .gf"), live = $("#lockup .live");
    const grain = $("#grain");

    const WASH = {
      amber: "linear-gradient(0deg, rgba(60,34,10,0.45) 0%, rgba(40,22,6,0.18) 40%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 55% 70% at 0% 70%, rgba(200,110,30,0.32), transparent 70%)",
      crimson: "linear-gradient(0deg, rgba(92,16,18,0.55) 0%, rgba(60,10,12,0.28) 38%, rgba(0,0,0,0) 75%), radial-gradient(ellipse 60% 55% at 12% 105%, rgba(190,40,36,0.45), transparent 70%)",
      warm: "linear-gradient(0deg, rgba(64,36,8,0.5) 0%, rgba(40,22,5,0.2) 40%, rgba(0,0,0,0) 72%), radial-gradient(ellipse 55% 50% at 85% 0%, rgba(200,115,30,0.22), transparent 70%)",
    };
    // film grain: a few pre-made tiles, one per frame
    const tiles = Array.from({ length: 6 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 384;
      const g = c.getContext("2d"), img = g.createImageData(384, 384), r = rng(1000 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });


    function render(fr) {
      // seek times arrive as e.g. 7.7333 s = frame 231.999: snap near-whole frames so the 3D layer and the copy
      // always agree on which shot a cut frame belongs to (sub-frame motion-blur samples stay fractional)
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const shot = WORLD.shotAt(f), t = f - S[shot][0];
      WORLD.render(f);

      // washes + light shapes
      wash.style.background = shot === "1A" ? WASH.amber : shot[0] === "1" ? WASH.crimson : WASH.warm;
      comet.style.opacity = shot === "2C" || shot === "2D" ? 0.45 : 0;
      comet.style.transform = `rotate(-5deg) translateX(${(Math.sin(f * 0.02) * 50).toFixed(1)}px)`;
      louvre.style.opacity = shot === "2A" ? easeOut(span(t, 0, 18)) * 0.75 : shot === "2B" ? 0.45 : 0;
      louvre.style.backgroundPosition = `${(f * 3).toFixed(1)}px 0`;
      streaks.style.opacity = shot === "1B" || shot === "1C" ? 0.55 : 0;
      [...streaks.children].forEach((s, i) => { s.style.left = `${300 + i * 620 + (f - 60) * (0.9 + i * 0.3)}px`; });

      // copy
      show($("#t1"), shot === "1A");
      if (shot === "1A") { T1.draw(t, 8, 30, f); place($("#t1"), T1, 150, 470); }
      show($("#t2"), shot === "1B");
      show(ghost, shot === "1B");
      if (shot === "1B") {
        T2.draw(t, 12, 20, f); place($("#t2"), T2, 960 - t * 0.6, 440, "center");
        ghost.style.transform = `translateX(${(-80 - t * 1.1).toFixed(1)}px)`;
      }
      show($("#t3"), shot === "2D");
      if (shot === "2D") { T3.draw(t, 4, 12, f); place($("#t3"), T3, 130 - t * 0.4, 130); }

      show(closed, shot === "1C");
      if (shot === "1C") TC.draw(t, 38);
      show(intro, shot === "2A");
      if (shot === "2A") { const k = easeOut(span(t, 14, 30)); intro.style.opacity = k; intro.style.filter = `blur(${((1 - k) * 8).toFixed(1)}px)`; }
      // the reference's product reveal: warm white flash, the name cuts in oversized and settles, the product
      // word is written by a cluster of glowing pixels, then a red LIVE badge pops on
      const fl = shot === "2A" ? Math.pow(span(t, 34, 40), 1.6) : shot === "2B" ? 1 - easeOut(span(t, 1, 8)) : 0;
      wflash.style.opacity = fl.toFixed(3);
      show(mosaic, shot === "2B");
      show(lockup, shot === "2B");
      if (shot === "2B") {
        const k = expoOut(span(t, 0, 8));
        const kk = expoOut(span(t, 0, 11));
        gf.style.transform = `translateX(${mix(-160, 0, kk).toFixed(1)}px) scale(${(mix(1.9, 1, kk) * mix(1, 0.97, span(t, 11, 42))).toFixed(4)}) skewX(${mix(-16, 0, kk).toFixed(2)}deg)`;
        gf.style.filter = kk < 0.99 ? `blur(${((1 - kk) * 18).toFixed(1)}px)` : "none";
        mosaic.style.opacity = (0.9 * (1 - span(t, 6, 30) * 0.5)).toFixed(3);
        mosaic.style.transform = `translateX(${(-t * 1.2).toFixed(1)}px)`;
        PW.draw(t, 10, 26, f); place($("#perpsw"), PW, 960, 640, "center");
        const lk = span(t, 24, 29), pop = lk <= 0 ? 0 : lk < 1 ? 1.18 * easeOut(lk) : 1;
        live.style.transform = `scale(${pop.toFixed(3)})`; live.style.opacity = lk > 0 ? 1 : 0;
      }
      // 24/7 tumbles in, then the counter ticks up every second frame, as in the reference's "8 -> 27"
      show(t247, shot === "2C" && t < 22);
      if (shot === "2C" && t < 22) T247.draw(t, 22);
      show(counter, shot === "2C" && t >= 22);
      show(dots, shot === "2C");
      if (shot === "2C") {
        [...dots.children].forEach((d, i) => { d.style.transform = `translate(${[-60, 40, 10][i] + f * [0.5, -0.4, 0.3][i]}px, ${[10, -20, 30][i] - f * 0.15}px)`; });
        if (t >= 22) {
          const ct = t - 22, h = Math.min(24, 1 + Math.floor(ct / 1.2));
          const seven = span(ct, 26, 30);
          n365.textContent = String(h);
          s7.style.display = seven > 0 ? "" : "none";
          s7.style.opacity = seven.toFixed(3);
          s7.style.transform = `translateX(${((1 - expoOut(seven)) * 50).toFixed(1)}px)`;
          const k = expoOut(span(ct, 0, 6));
          crow.style.transform = `scale(${(mix(1.25, 1, k) * mix(1, 0.96, span(ct, 6, 30))).toFixed(4)})`;
          crow.style.filter = `blur(${((1 - k) * 10).toFixed(1)}px) drop-shadow(0 0 30px rgba(246,160,58,0.35))`;
          clabel.textContent = ct < 26 ? "HOURS A DAY" : "365 DAYS A YEAR";
          clabel.style.opacity = easeOut(span(ct, 4, 10));
        }
      }
      grain.style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    window.addEventListener("load", () => render(R._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
