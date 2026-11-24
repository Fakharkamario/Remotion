// Text animations copied from the GOAT Trade Copier reference ad (953154e2 in the brief's reference set):
//  - GlowText "glow"   : "Switching": the line sits in a soft halo, tiny bright pixels crawl over the glyphs, slow drift
//  - GlowText "writer" : "COPIER": a cluster of glowing pixels sweeps left to right and the letters appear behind it
//  - Tumble            : "5 TIMES": letters flip in from 3D, scattered, and lock into place one after another
//  - counter()         : "8 -> 27": a big metallic number ticking up every second frame
//  - dotPatch()        : the glowing pixel-dot patches drifting behind the counter
(function () {
  const { rng } = TEX;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const expoOut = (x) => { const t = clamp(x, 0, 1); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  class GlowText {
    // segs: [{t, c}], o: {size, weight, family, spacing, glow, spark, mode}
    constructor(el, segs, o) {
      this.el = el; this.segs = segs;
      this.o = Object.assign({ size: 64, weight: 400, family: "Altform", spacing: 0, glow: "#FF6F63", spark: "#FFD2CC", mode: "glow" }, o);
      this.cv = document.createElement("canvas"); el.appendChild(this.cv); this.ready = false;
    }
    build() {
      const o = this.o, pad = Math.round(o.size * 0.9);
      const m = document.createElement("canvas").getContext("2d");
      const font = `${o.weight} ${o.size}px "${o.family}", sans-serif`;
      m.font = font; m.letterSpacing = `${o.spacing}px`;
      const widths = this.segs.map((s) => m.measureText(s.t).width), tw = widths.reduce((a, b) => a + b, 0);
      const W = Math.ceil(tw) + pad * 2, H = Math.ceil(o.size * 1.3) + pad * 2;
      const F = document.createElement("canvas"); F.width = W; F.height = H;
      const g = F.getContext("2d"); g.font = font; g.letterSpacing = `${o.spacing}px`; g.textBaseline = "alphabetic";
      let x = pad; const base = pad + o.size * 1.0;
      this.segs.forEach((s, i) => { g.fillStyle = s.c || "#EFF4FA"; g.fillText(s.t, x, base); x += widths[i]; });
      // halo: the type blurred wide and tinted with the glow colour
      const G = document.createElement("canvas"); G.width = W; G.height = H;
      const gg = G.getContext("2d");
      gg.filter = `blur(${(o.size * 0.16).toFixed(1)}px)`; gg.drawImage(F, 0, 0);
      gg.filter = `blur(${(o.size * 0.42).toFixed(1)}px)`; gg.globalAlpha = 0.8; gg.drawImage(F, 0, 0);
      gg.filter = "none"; gg.globalAlpha = 1; gg.globalCompositeOperation = "source-in"; gg.fillStyle = o.glow; gg.fillRect(0, 0, W, H);
      // glyph sample points for the sparkles
      const d = g.getImageData(0, 0, W, H).data, pts = [];
      for (let y = 0; y < H; y += 3) for (let xx = 0; xx < W; xx += 3) if (d[(y * W + xx) * 4 + 3] > 140) pts.push([xx, y]);
      Object.assign(this, { W, H, pad, tw, F, G, pts, ready: true });
      this.cv.width = W; this.cv.height = H; this.cv.style.width = W + "px"; this.cv.style.height = H + "px";
      this.cv.style.marginLeft = this.cv.style.marginTop = -pad + "px";
    }
    // t: local frame; in: [start, end] of the reveal
    draw(t, a0, a1, frame) {
      if (!this.ready) { if (!document.fonts || document.fonts.status !== "loaded") return; this.build(); }
      const g = this.cv.getContext("2d"), { W, H, pad, tw, F, G, pts, o } = this;
      g.clearRect(0, 0, W, H);
      if (t < a0) return;
      const r = rng(Math.floor(frame) * 4099 + 7);
      const spark = (x, y, s, a) => {
        g.globalAlpha = a * 0.35; g.fillStyle = o.glow; g.fillRect(x - s, y - s, s * 3, s * 3);
        g.globalAlpha = a; g.fillStyle = o.spark; g.fillRect(x, y, s, s);
      };
      if (o.mode === "writer") {
        const p = easeOut(span(t, a0, a1)), front = pad - 30 + p * (tw + 60);
        g.save(); g.beginPath(); g.rect(0, 0, front, H); g.clip();
        g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.85; g.drawImage(G, 0, 0);
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.drawImage(F, 0, 0);
        g.restore();
        g.globalCompositeOperation = "lighter";
        const near = pts.filter(([x]) => x > front - 70 && x < front + 14);
        const n = p < 1 ? 70 : 0;
        for (let i = 0; i < n && near.length; i++) { const q = near[Math.floor(r() * near.length)]; spark(q[0] + (r() - 0.5) * 6, q[1] + (r() - 0.5) * 6, 2 + Math.floor(r() * 2), 0.5 + r() * 0.5); }
        for (let i = 0; i < 8; i++) { const q = pts[Math.floor(r() * pts.length)]; if (q[0] < front) spark(q[0], q[1], 2, 0.25 + r() * 0.35); }
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      } else {
        const k = easeOut(span(t, a0, a1));
        this.cv.style.filter = k < 1 ? `blur(${((1 - k) * 8).toFixed(1)}px)` : "none";
        g.globalAlpha = k * 0.9; g.globalCompositeOperation = "lighter"; g.drawImage(G, 0, 0);
        g.globalCompositeOperation = "source-over"; g.globalAlpha = k; g.drawImage(F, 0, 0);
        g.globalCompositeOperation = "lighter";
        for (let i = 0; i < 16; i++) {
          const q = pts[Math.floor(r() * pts.length)];
          spark(q[0] + (r() - 0.5) * 4, q[1] + (r() - 0.5) * 4, 2 + Math.floor(r() * 2), k * (0.35 + r() * 0.6));
        }
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      }
    }
  }

  // letters flip in from 3D and lock into place one after another (the reference's "5 TIMES")
  class Tumble {
    constructor(el, parts) { // parts: [{t, cls}]
      this.el = el;
      el.innerHTML = parts.map((p) => p.t.split("").map((ch) => ch === " " ? `<span class="sp"> </span>` : `<span class="${p.cls}">${ch}</span>`).join("")).join("");
      this.letters = [...el.querySelectorAll("span:not(.sp)")];
      const r = rng(4242);
      // [delay, rotX, rotY, rotZ, dx, dy, z]
      this.rnd = this.letters.map(() => [r() * 5, (r() < 0.5 ? -1 : 1) * (120 + r() * 160), (r() - 0.5) * 120, (r() - 0.5) * 50, (r() - 0.5) * 220, (r() - 0.5) * 260, -300 + r() * 700]);
    }
    draw(t, len) {
      this.letters.forEach((s, i) => {
        const [dl, rx, ry, rz, dx, dy, z] = this.rnd[i], k = expoOut(span(t, dl, dl + 11)), u = 1 - k;
        s.style.opacity = clamp(span(t, dl - 1, dl + 2), 0, 1).toFixed(3);
        s.style.transform = `translate3d(${(u * dx).toFixed(1)}px, ${(u * dy).toFixed(1)}px, ${(u * z).toFixed(1)}px) rotateX(${(u * rx).toFixed(1)}deg) rotateY(${(u * ry).toFixed(1)}deg) rotateZ(${(u * rz).toFixed(1)}deg)`;
        s.style.filter = u > 0.02 ? `blur(${(u * 12).toFixed(1)}px)` : "none";
      });
      this.el.style.transform = `translate(-50%,-50%) scale(${mix(1.04, 0.97, span(t, 0, len)).toFixed(4)})`;
    }
  }

  // glowing pixel-dot patch (pre-rendered), drifting
  const dotPatch = (w, h, col, seed) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), r = rng(seed), step = 9;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      const dx = (x - w / 2) / (w / 2), dy = (y - h / 2) / (h / 2), fall = Math.max(0, 1 - Math.hypot(dx * 0.9, dy * 1.1));
      const a = fall * (0.25 + r() * 0.75);
      if (a < 0.05) continue;
      g.fillStyle = col; g.globalAlpha = a; g.fillRect(x, y, 5, 5);
    }
    return c.toDataURL("image/png");
  };

  window.TYPE = { GlowText, Tumble, dotPatch };
})();
