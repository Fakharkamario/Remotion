// GOAT Funded Perps: leverage beat (149 frames @ 30 fps), rebuilt from the supplied reference
// (gold counter 6 -> 28 "GFT TRADING ACCOUNT" -> whip -> red "STOP PLACING / THE SAME TRADE" -> "5 TIMES" tumble)
// in the Perps brand, timed to the supplied voiceover:
//   "Up to 25x boosted leverage on Forex and 10x on Bitcoin and Ethereum."
// render(f) is a pure function of the frame. Fast moves carry a directional blur sized to their speed, so every
// move smears like a camera shutter instead of stepping.
(function () {
  const FPS = 30, FRAMES = 149;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (x, p) => 1 - Math.pow(1 - clamp(x, 0, 1), p || 3);
  const easeIn = (x, p) => Math.pow(clamp(x, 0, 1), p || 3);
  const expoOut = (x) => { const t = clamp(x, 0, 1); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // ---------------- timing (frames), from the voiceover ----------------
  // "up to 25x" 0.36-1.10 s, "boosted leverage on Forex" 1.10-2.56, "10x" 2.80-3.32, "on Bitcoin and Ethereum" 3.32-4.50
  const COUNT = [2, 46];      // 1x -> 25x
  const CHIP = 33;            // the label chip on "boosted leverage"
  const WHIP = [62, 80];      // the camera whips up out of the counter (accelerating, as measured)
  const B = 80;               // cut to the second section
  const PILL = 85, SUB = 85;  // "10X LEVERAGE" pill and the line under it
  const WIPE = [101, 108];    // a bar of light wipes the pill away
  const TUMBLE = 106;         // "BTC & ETH" tumbles in on "Bitcoin and Ethereum"

  // ---------------- order-ticket cards (section A's floating UI, the reference's account cards) ----------------
  const ticket = (pair, side, lev, margin, size) => `
    <div class="tk ${size || ""}">
      <div class="tk-h"><span class="tk-ic">${pair[0]}</span><b>${pair}</b><span class="tk-pill ${side === "Long" ? "up" : "dn"}">${side}</span><span class="tk-live">Live</span></div>
      <div class="tk-r"><div><small>Leverage</small><b class="or">${lev}</b></div><div><small>Margin</small><b>${margin}</b></div><div><small>Mark price</small><b>${pair.includes("BTC") ? "97,412.5" : pair.includes("ETH") ? "3,618.2" : "1.0842"}</b></div></div>
      <div class="tk-slider"><i style="width:${Math.min(100, parseInt(lev) * 4)}%"></i><em style="left:${Math.min(100, parseInt(lev) * 4)}%"></em></div>
      <div class="tk-b"><span class="ghost">Close</span><span class="ghost">TP / SL</span><span class="go">Open position</span></div>
    </div>`;

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <div id="A" class="layer">
        <div id="aWorld" class="layer">
          <div id="aBg" class="layer"></div>
          <div class="ghosttext" id="ghost">BOOSTED LEVERAGE</div>
          <canvas id="dots1" class="dots" width="420" height="300"></canvas>
          <canvas id="dots2" class="dots" width="260" height="200"></canvas>
          <canvas id="dots3" class="dots" width="300" height="220"></canvas>
          <div id="c1" class="card3d">${ticket("EUR/USD", "Long", "25x", "$2,000")}</div>
          <div id="c2" class="card3d">${ticket("GBP/USD", "Short", "20x", "$1,500")}</div>
          <div id="c3" class="card3d far">${ticket("BTC-PERP", "Long", "10x", "$5,000", "sm")}</div>
          <div id="counter" class="counter"><div class="num"><span id="n">1</span><span class="x">x</span></div>
            <div id="chip" class="chip">BOOSTED LEVERAGE <span>·</span> FOREX</div></div>
        </div>
      </div>
      <div id="B" class="layer">
        <div id="bBg" class="layer"></div>
        <canvas id="bars" class="layer" width="1920" height="1080"></canvas>
        <div id="cL" class="candle orange"><i class="wick"></i><b class="body"><s class="f"></s><s class="s"></s><s class="t"></s></b></div>
        <div id="cR" class="candle white"><i class="wick"></i><b class="body"><s class="f"></s><s class="s"></s><s class="t"></s></b></div>
        <div id="pillWrap" class="pillwrap"><div id="pill" class="pill">10X LEVERAGE</div><div id="sub" class="sub">ON CRYPTO</div></div>
        <div id="wipe" class="wipe"></div>
        <div id="tumble" class="tumble"></div>
      </div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);

    // glowing pixel patches (the reference's gold dot clusters), drawn once
    const patch = (cv, seed) => {
      const g = cv.getContext("2d"), W = cv.width, H = cv.height, r = rng(seed), st = 12;
      for (let y = 0; y < H; y += st) for (let x = 0; x < W; x += st) {
        const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2), fall = Math.max(0, 1 - Math.hypot(dx * 0.85, dy * 1.1));
        const a = fall * (0.2 + r() * 0.8); if (a < 0.06) continue;
        g.fillStyle = `rgba(246,166,70,${a})`; g.fillRect(x, y, 7, 7);
      }
    };
    patch($("#dots1"), 11); patch($("#dots2"), 23); patch($("#dots3"), 37);

    // section B: a faint candle chart behind everything, as in the reference's dark red backdrop
    { const g = $("#bars").getContext("2d"), r = rng(5); let v = 540;
      for (let i = 0; i < 64; i++) { const x = 20 + i * 30, o = v; v += (r() - 0.48) * 70; const top = Math.min(o, v), h = Math.abs(v - o) + 20;
        g.fillStyle = `rgba(255,170,90,${0.035 + r() * 0.03})`; g.fillRect(x, top - 40, 14, h + 80); } }

    // the tumble: each letter flips down from edge-on (around X), staggered, with a little scatter, as in the reference
    const tum = $("#tumble");
    const parts = [["BTC", "acc"], [" ", ""], ["&", "chrome"], [" ", ""], ["ETH", "chrome"]];
    tum.innerHTML = parts.map(([t, c]) => t.split("").map((ch) => ch === " " ? `<span class="sp"> </span>` : `<span class="${c}">${ch}</span>`).join("")).join("");
    const letters = [...tum.querySelectorAll("span:not(.sp)")];
    const lr = rng(77), LR = letters.map((_, i) => [i * 1.1 + lr() * 2.2, (lr() < 0.5 ? -1 : 1) * (70 + lr() * 30), (lr() - 0.5) * 40, (lr() - 0.5) * 70]);

    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    // a directional motion blur for a layer moving (vx, vy) px per frame: a half-frame smear, via an SVG filter
    stage.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute"><filter id="mbA" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur id="mbAs" stdDeviation="0 0"/></filter><filter id="mbB" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur id="mbBs" stdDeviation="0 0"/></filter></svg>`);
    const blurA = (el, vx, vy) => { const sx = Math.abs(vx) * 0.32, sy = Math.abs(vy) * 0.32; $("#mbAs").setAttribute("stdDeviation", `${sx.toFixed(2)} ${sy.toFixed(2)}`); el.style.filter = sx + sy > 0.3 ? "url(#mbA)" : "none"; };

    // section A camera: a slow rise + push (measured on the reference: the number drifts up ~35 px over 2 s), then
    // the whip: an accelerating rise that throws everything up out of frame
    const aCam = (f) => {
      const rise = 100 * (1 - easeOut(f / 5, 2.5));                 // the opening frames settle up into place
      const hold = 10 * smooth(span(f, 10, 60));                    // then a barely-there sink
      const whip = -1500 * easeIn(span(f, WHIP[0], WHIP[1]), 3.4);  // and the whip up out of frame
      return { y: rise + hold + whip, s: mix(1.47, 1.0, easeOut(span(f, 0, 48), 2.6)) };
    };
    // the candles: drift in from the lower corners and settle at the frame edges, slowly turning
    const candle = (el, side, f) => {
      const k = expoOut(span(f, B, B + 18)), t = f - B;
      const x = side < 0 ? mix(-260, 40, k) : mix(2180, 1720, k), y = mix(900, side < 0 ? 330 : 380, k) + Math.sin(t * 0.05 + side) * 10;
      const rz = side < 0 ? mix(-80, -62, k) + t * 0.05 : mix(80, 58, k) - t * 0.05, ry = (side < 0 ? 30 : -30) + t * 0.25 * side;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotateZ(${rz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateX(12deg)`;
      const v = (1 - k) * 22; el.style.filter = v > 1 ? `blur(${(v * 0.35).toFixed(1)}px)` : "none";
    };

    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      const inA = f < B;
      $("#A").style.display = inA ? "" : "none"; $("#B").style.display = inA ? "none" : "";
      if (inA) {
        const c = aCam(f), cn = aCam(f + 0.5), cp = aCam(f - 0.5);
        const w = $("#aWorld");
        w.style.transform = `translateY(${c.y.toFixed(1)}px) scale(${c.s.toFixed(4)})`;
        blurA(w, 0, cn.y - cp.y);
        // counter: ticks 1 -> 25, one step every ~1.8 frames, easing off into 25 (the reference's ticks are even;
        // ours settle onto the spoken "25x")
        const n = Math.max(1, Math.min(25, Math.round(1 + 24 * easeOut(span(f, COUNT[0], COUNT[1]), 1.6))));
        $("#n").textContent = String(n);
        const num = $("#counter .num"), pulse = f >= COUNT[1] ? 0 : 1;
        num.style.transform = `scale(${mix(1.0, 1.04, span(f, 0, 70)).toFixed(4)})`;
        // the chip slides up out of a soft blur on "boosted leverage"
        const ck = expoOut(span(f, CHIP, CHIP + 10)), chip = $("#chip");
        chip.style.opacity = ck.toFixed(3); chip.style.transform = `translateY(${((1 - ck) * 18).toFixed(1)}px)`; chip.style.filter = ck < 1 ? `blur(${((1 - ck) * 8).toFixed(1)}px)` : "none";
        // floating cards: slow 3D drift (and they rise with the camera)
        const t = f;
        $("#c1").style.transform = `translate(${mix(1290, 1250, t / 80).toFixed(1)}px, ${mix(70, 40, t / 80).toFixed(1)}px) perspective(1400px) rotateX(18deg) rotateY(-24deg) rotateZ(-9deg)`;
        $("#c2").style.transform = `translate(${mix(-70, -40, t / 80).toFixed(1)}px, ${mix(640, 610, t / 80).toFixed(1)}px) perspective(1400px) rotateX(22deg) rotateY(26deg) rotateZ(-14deg)`;
        $("#c3").style.transform = `translate(${mix(1330, 1310, t / 80).toFixed(1)}px, ${mix(700, 680, t / 80).toFixed(1)}px) perspective(1400px) rotateX(10deg) rotateY(-12deg) rotateZ(-2deg) scale(0.62)`;
        $("#dots1").style.transform = `translate(${(1420 + t * 1.1).toFixed(1)}px, ${(-40 - t * 0.4).toFixed(1)}px) rotate(-18deg)`;
        $("#dots2").style.transform = `translate(${(1500 - t * 0.6).toFixed(1)}px, ${(650 - t * 0.3).toFixed(1)}px)`;
        $("#dots3").style.transform = `translate(${(120 + t * 0.5).toFixed(1)}px, ${(800 - t * 0.5).toFixed(1)}px) rotate(12deg)`;
        $("#ghost").style.transform = `translate(${(-t * 0.6).toFixed(1)}px, 0)`;
        void pulse;
      } else {
        const t = f - B;
        // the room: dark, with Perps orange light pooling up from the floor; brightens in as the section opens
        $("#bBg").style.opacity = (0.55 + 0.45 * expoOut(span(f, B, B + 12))).toFixed(3);
        candle($("#cL"), -1, f); candle($("#cR"), 1, f);
        // pill: focuses in at its place; the line under it rises from below into place under the pill
        // the whip's motion carries through the cut and settles (reference: ~30 px/frame decaying over 6 frames)
        const carry = 150 * (1 - easeOut(span(f, B, B + 7), 2.4)), vCarry = 150 * (easeOut(span(f, B, B + 7), 2.4) - easeOut(span(f - 1, B, B + 7), 2.4));
        $("#B").style.transform = `translateY(${carry.toFixed(1)}px)`;
        const pk = f < PILL - 1 ? 1 : easeOut(span(f, PILL, PILL + 6), 2.2), pill = $("#pill");
        const dip = f >= PILL - 1 && f < PILL ? 0.15 : 1;
        const wipe = span(f, WIPE[0], WIPE[1]), gone = easeIn(span(f, WIPE[0] + 2, WIPE[0] + 7), 2);
        pill.style.opacity = (Math.max(0.15, pk) * dip * (1 - gone)).toFixed(3);
        pill.style.filter = f < PILL - 1 ? `blur(${(vCarry * 0.25).toFixed(1)}px)` : `blur(${((1 - pk) * 9 + gone * 14).toFixed(1)}px)`;
        pill.style.transform = "none";
        const sk = easeOut(span(f, SUB + 1, SUB + 8), 2.6), sub = $("#sub");
        sub.style.transform = `translateY(${mix(90, 0, sk).toFixed(1)}px)`;
        sub.style.opacity = (Math.min(1, sk * 1.6) * (1 - gone)).toFixed(3);
        sub.style.filter = `blur(${((1 - sk) * 6 + gone * 12).toFixed(1)}px)`;
        $("#pillWrap").style.transform = `translate(-50%, -50%) scale(${mix(1, 1.07, span(f, PILL, WIPE[0] + 4)).toFixed(4)})`;
        // the wipe: a vertical bar of hot light sweeping across the pill as it goes
        const wp = $("#wipe");
        wp.style.opacity = (Math.sin(Math.PI * wipe)).toFixed(3);
        wp.style.transform = `translate(${mix(-260, 260, smooth(wipe)).toFixed(1)}px, -50%)`;
        // the tumble
        tum.style.display = f >= TUMBLE - 1 ? "" : "none";
        letters.forEach((s, i) => {
          const [, , dy, rz] = LR[i], d = i * 0.35;
          const k = easeOut(span(f, TUMBLE + d, TUMBLE + d + 15), 2.4), u = 1 - k;
          const prev = easeOut(span(f - 1, TUMBLE + d, TUMBLE + d + 15), 2.4);
          s.style.opacity = clamp(span(f, TUMBLE - 1, TUMBLE + 1), 0, 1).toFixed(3);
          s.style.transform = `translateY(${(u * dy * 0.6).toFixed(1)}px) rotateX(${(-200 * u).toFixed(1)}deg) rotateZ(${(u * rz * 0.15).toFixed(1)}deg)`;
          const spin = Math.abs(200 * (k - prev));
          s.style.filter = spin > 3 ? `blur(${Math.min(8, spin * 0.12).toFixed(1)}px)` : "none";
        });
        const tk = easeOut(span(f, TUMBLE, TUMBLE + 16), 2.6);
        tum.style.transform = `translate(-50%, -50%) scale(${(mix(1.55, 1.0, tk) * mix(1.0, 1.06, span(f, TUMBLE + 16, FRAMES))).toFixed(4)})`;
        $("#bars").style.transform = `translateX(${(-t * 0.8).toFixed(1)}px)`;
      }
      $("#grain").style.backgroundImage = tiles[Math.round(f) % tiles.length];
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
