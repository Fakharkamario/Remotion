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

  // ---------------- pixel-dissolve copy (the reference's "Rules running in the background" build) ----------------
  // A block of lines is pre-rendered twice: in its final colours, and flat in a tint. The reveal sweeps left to right
  // through a band of noisy cells: cells ahead of the band flicker in the tint, cells in the band show the tint, cells
  // behind it show the final type. A dashed selection box hugs each line while it builds, then the tint settles out.
  class Dissolve {
    constructor(el, lines, opts) {
      this.el = el; this.lines = lines; this.o = Object.assign({ align: "left", tint: C.perps, cell: 5 }, opts);
      this.cv = document.createElement("canvas"); el.appendChild(this.cv); this.ready = false;
    }
    build() {
      const pad = 40, lh = this.lines.map((l) => l.size * 1.12);
      const ctx = document.createElement("canvas").getContext("2d");
      const font = (l) => `${l.weight || 400} ${l.size}px ${FB}`;
      const widths = this.lines.map((l) => { ctx.font = font(l); ctx.letterSpacing = `${l.size > 70 ? -0.022 * l.size : -0.005 * l.size}px`; return ctx.measureText(l.segs.map((s) => s.t).join("")).width; });
      const W = Math.ceil(Math.max(...widths)) + pad * 2, H = Math.ceil(lh.reduce((a, b) => a + b, 0)) + pad * 2;
      this.W = W; this.H = H; this.pad = pad; this.boxes = [];
      const draw = (tint) => {
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const g = c.getContext("2d");
        let y = pad;
        this.lines.forEach((l, i) => {
          g.font = font(l); g.letterSpacing = `${l.size > 70 ? -0.022 * l.size : -0.005 * l.size}px`; g.textBaseline = "alphabetic";
          let x = this.o.align === "center" ? (W - widths[i]) / 2 : pad;
          const base = y + l.size * 0.92;
          if (!tint) this.boxes.push([x - 10, y + l.size * 0.12, widths[i] + 20, l.size * 1.0]);
          l.segs.forEach((s) => { g.fillStyle = tint || s.c || l.color || C.text; g.fillText(s.t, x, base); x += g.measureText(s.t).width; });
          y += lh[i];
        });
        return c;
      };
      this.F = draw(null); this.T = draw(this.o.tint);
      this.cv.width = W; this.cv.height = H;
      this.cv.style.width = W + "px"; this.cv.style.height = H + "px";
      this.ready = true;
    }
    // p: 0..1 reveal, settle: 0..1 tint -> final colours, out: 0..1 dissolve away
    draw(p, settle, out, frame) {
      if (!this.ready) { if (!document.fonts || document.fonts.status !== "loaded") return; this.build(); }
      const g = this.cv.getContext("2d"), W = this.W, H = this.H, cs = this.o.cell;
      g.clearRect(0, 0, W, H);
      if (p <= 0 || out >= 1) return;
      const band = 0.18, head = p * (1 + band * 2) - band, outHead = out * (1 + band * 2) - band;
      const r = rng(Math.floor(frame) * 7919 + 13);
      for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) {
        const h = ((x * 73856093) ^ (y * 19349663)) >>> 0, n = (h % 1000) / 1000;
        const u = x / W + (n - 0.5) * 0.16;           // where this cell sits along the sweep
        let src = null, a = 1;
        const d = head - u;
        if (d > band) src = "F";
        else if (d > 0) src = r() < 0.82 ? "T" : null;
        else if (d > -band * 0.7) { if (r() < 0.12) { src = "T"; a = 0.8; } }
        if (src && out > 0) { const e = outHead - u; if (e > band) src = null; else if (e > 0) src = r() < 0.5 ? "T" : null; }
        if (!src) continue;
        g.globalAlpha = a;
        if (src === "F" && settle < 1) {
          g.drawImage(this.T, x, y, cs, cs, x, y, cs, cs);
          g.globalAlpha = a * settle;
        }
        g.drawImage(src === "F" ? this.F : this.T, x, y, cs, cs, x, y, cs, cs);
      }
      g.globalAlpha = 1;
      // dashed selection box while the line builds
      const boxA = clamp(1 - settle * 1.4, 0, 1) * (p > 0.02 ? 1 : 0) * (1 - out);
      if (boxA > 0.01) {
        g.save(); g.globalAlpha = boxA * 0.85; g.strokeStyle = this.o.tint; g.lineWidth = 2; g.setLineDash([3, 4]);
        g.lineDashOffset = -frame * 2;
        this.boxes.forEach(([bx, by, bw, bh]) => { const ww = bw * clamp(head * 1.1, 0, 1); if (ww > 4) g.strokeRect(bx, by, ww, bh); });
        g.restore();
      }
    }
  }

  const GLYPHS = "#%&@$?!0123456789";
  const scramble = (s, t, start, rate) =>
    s.split("").map((ch, i) => {
      const lock = start + i * rate + 6;
      if (t < start + i * rate) return `<span style="opacity:0">${ch}</span>`;
      if (t >= lock) return `<span>${ch}</span>`;
      const g = GLYPHS[Math.floor(rng(i * 131 + Math.floor(t) * 7)() * GLYPHS.length)];
      return `<span style="color:${C.perps};opacity:.92">${g}</span>`;
    }).join("");

  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <canvas id="gl" width="1920" height="1080"></canvas>
      <div id="wash" class="layer"></div>
      <div id="lights" class="layer"><div class="comet"></div><div class="louvre"></div><div class="streaks"><i></i><i></i><i></i></div></div>
      <div id="whipA" class="layer">
        <div id="t1" class="copy" style="left:110px;top:50%;transform:translateY(-50%)"></div>
        <div id="t2" class="copy" style="left:50%;top:50%;transform:translate(-50%,-52%)"></div>
        <div id="closed" class="punch"><div class="chrome">MARKET</div><div class="chrome">CLOSED?</div></div>
        <div id="intro" class="intro"><span></span>INTRODUCING</div>
        <div id="lockup" class="lockup"><div class="ln"><div>GOAT FUNDED</div></div><div class="ln"><div>PERPS</div></div><p>Trade perps with our simulated capital</p></div>
      </div>
      <div id="whipB" class="layer">
        <div id="h247" class="h247"><div class="big chrome">24/7</div><div class="row"><b>001</b><span>days a year</span></div></div>
      </div>
      <div id="t3" class="copy" style="left:90px;top:80px"></div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>`;
    const $ = (s) => stage.querySelector(s);
    const gl = $("#gl");
    WORLD.mount(gl);

    const T1 = new Dissolve($("#t1"), [{ segs: [{ t: "Markets don’t" }], size: 50, color: C.t2 }, { segs: [{ t: "sleep.", c: C.perps }], size: 112, weight: 600 }], { tint: "#F6A03A" });
    const T2 = new Dissolve($("#t2"), [{ segs: [{ t: "Why should" }], size: 50, color: C.t2 }, { segs: [{ t: "your " }, { t: "trading?", c: C.perps }], size: 104, weight: 600 }], { tint: "#FF6F63", align: "center" });
    const T3 = new Dissolve($("#t3"), [{ segs: [{ t: "Weekends" }], size: 50, color: C.t2 }, { segs: [{ t: "included.", c: C.perps }], size: 112, weight: 600 }], { tint: "#F6A03A" });

    const wash = $("#wash"), comet = $(".comet"), louvre = $(".louvre"), streaks = $(".streaks");
    const closed = $("#closed");
    const intro = $("#intro"), lockup = $("#lockup"), lns = [...lockup.querySelectorAll(".ln > div")], sub = $("#lockup p");
    const h247 = $("#h247"), big = $("#h247 .big"), row = $("#h247 .row"), n365 = $("#h247 b");
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

    const show = (el, on) => { el.style.display = on ? "" : "none"; };

    // the reference's impact type ("NOT ANYMORE"): cuts in oversized, sheared and motion-blurred, snaps to size in
    // ~6 frames, then keeps shrinking slowly and dims toward the next cut
    const punch = (el, t, len, base) => {
      const k = expoOut(span(t, 0, 7));
      const sc = mix(1.85, 1, k) * mix(1, 0.9, span(t, 7, len));
      const sk = mix(-14, 0, k), bl = (1 - k) * 16, dim = mix(1, 0.62, span(t, len - 14, len));
      el.style.transform = `${base} scale(${sc.toFixed(4)}) skewX(${sk.toFixed(2)}deg)`;
      el.style.filter = `blur(${bl.toFixed(1)}px) brightness(${dim.toFixed(3)})`;
      el.style.opacity = t < 0 ? 0 : 1;
    };

    function render(fr) {
      const f = clamp(fr, 0, FRAMES - 1), shot = WORLD.shotAt(Math.round(f)), t = f - S[shot][0];
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
      if (shot === "1A") T1.draw(easeOut(span(t, 8, 26)), span(t, 26, 34), 0, f);
      show($("#t2"), shot === "1B");
      if (shot === "1B") T2.draw(easeOut(span(t, 12, 30)), span(t, 30, 38), 0, f);
      show($("#t3"), shot === "2D");
      if (shot === "2D") T3.draw(easeOut(span(t, 4, 21)), span(t, 21, 29), 0, f);

      show(closed, shot === "1C");
      if (shot === "1C") punch(closed, t, 38, "translate(-50%,-50%)");
      show(intro, shot === "2A");
      if (shot === "2A") { const k = easeOut(span(t, 14, 30)); intro.style.opacity = k; intro.style.filter = `blur(${((1 - k) * 8).toFixed(1)}px)`; }
      show(lockup, shot === "2B");
      if (shot === "2B") {
        [easeOut(span(t, 6, 18)), easeOut(span(t, 10, 22))].forEach((k, i) => { lns[i].style.transform = `translateY(${((1 - k) * 105).toFixed(1)}%)`; lns[i].style.filter = `blur(${((1 - k) * 6).toFixed(1)}px)`; });
        const s = easeOut(span(t, 22, 34)); sub.style.opacity = s; sub.style.transform = `translateY(${((1 - s) * 14).toFixed(1)}px)`;
      }
      show(h247, shot === "2C");
      if (shot === "2C") {
        punch(big, t, 52, "");
        row.style.opacity = easeOut(span(t, 8, 16));
        n365.textContent = String(Math.round(mix(1, 365, ease(span(t, 8, 40))))).padStart(3, "0");
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
