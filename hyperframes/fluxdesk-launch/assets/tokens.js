// Original token artwork for the market scenes, drawn once into small canvases and cached.
// Each art is a function (g, s) drawing an s x s square.
(function () {
  const K = window.K;
  const ART = {};
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

  ART.letter = (g, s) => {
    g.fillStyle = "#1B130F"; g.fillRect(0, 0, s, s);
    K.text(g, "K", s / 2, s * 0.74, { size: s * 0.66, weight: 800, color: "#FFFFFF", align: "center", ls: 0 });
  };
  ART.bolt = (g, s) => {
    // original mascot: a small round-headed robot with an antenna
    g.fillStyle = "#FFF5DE"; g.fillRect(0, 0, s, s);
    const u = s / 100;
    g.strokeStyle = "#2A1A12"; g.lineWidth = 3 * u;
    g.beginPath(); g.moveTo(50 * u, 22 * u); g.lineTo(50 * u, 12 * u); g.stroke();
    g.fillStyle = "#FF6A2B"; g.beginPath(); g.arc(50 * u, 10 * u, 5 * u, 0, 7); g.fill();
    g.fillStyle = "#3FD1B4"; rr(g, 26 * u, 22 * u, 48 * u, 38 * u, 12 * u); g.fill(); g.stroke();
    g.fillStyle = "#2A1A12";
    g.beginPath(); g.arc(41 * u, 40 * u, 4.5 * u, 0, 7); g.fill();
    g.beginPath(); g.arc(59 * u, 40 * u, 4.5 * u, 0, 7); g.fill();
    g.beginPath(); g.arc(50 * u, 48 * u, 6 * u, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = "#FFC94A"; rr(g, 34 * u, 62 * u, 32 * u, 24 * u, 6 * u); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(34 * u, 68 * u); g.lineTo(22 * u, 76 * u); g.moveTo(66 * u, 68 * u); g.lineTo(78 * u, 76 * u); g.stroke();
  };
  ART.orb = (g, s) => {
    g.fillStyle = "#2B1630"; g.fillRect(0, 0, s, s);
    const gr = g.createRadialGradient(s * 0.4, s * 0.38, s * 0.05, s * 0.5, s * 0.5, s * 0.42);
    gr.addColorStop(0, "#FFE2A8"); gr.addColorStop(0.45, "#FF8A4C"); gr.addColorStop(1, "#7A2E8C");
    g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, s * 0.36, 0, 7); g.fill();
  };
  ART.coin = (g, s) => {
    g.fillStyle = "#1A120C"; g.fillRect(0, 0, s, s);
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, "#FFD86B"); gr.addColorStop(1, "#C98A12");
    g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, s * 0.38, 0, 7); g.fill();
    g.strokeStyle = "#8A5A08"; g.lineWidth = s * 0.03; g.beginPath(); g.arc(s / 2, s / 2, s * 0.3, 0, 7); g.stroke();
    K.text(g, "FX", s / 2, s * 0.6, { size: s * 0.28, weight: 800, color: "#7A4A06", align: "center", ls: 0 });
  };
  ART.land = (g, s) => {
    const gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, "#F6C07C"); gr.addColorStop(0.6, "#8FB7D2"); gr.addColorStop(1, "#5E8F5A");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = "#4E7E48"; g.beginPath(); g.moveTo(0, s * 0.75); g.quadraticCurveTo(s * 0.3, s * 0.55, s * 0.6, s * 0.72); g.quadraticCurveTo(s * 0.8, s * 0.8, s, s * 0.66); g.lineTo(s, s); g.lineTo(0, s); g.fill();
    g.fillStyle = "#F4F1EA"; g.fillRect(s * 0.4, s * 0.36, s * 0.2, s * 0.2);
    g.fillStyle = "#C9C2B6"; g.beginPath(); g.moveTo(s * 0.6, s * 0.36); g.lineTo(s * 0.68, s * 0.3); g.lineTo(s * 0.68, s * 0.5); g.lineTo(s * 0.6, s * 0.56); g.fill();
  };
  ART.chev = (g, s) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, "#4A4440"); gr.addColorStop(1, "#1E1A18");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = "#F4F0EA";
    g.beginPath(); g.moveTo(s * 0.28, s * 0.3); g.lineTo(s * 0.72, s * 0.3); g.lineTo(s * 0.5, s * 0.5); g.lineTo(s * 0.62, s * 0.5); g.lineTo(s * 0.4, s * 0.74); g.lineTo(s * 0.44, s * 0.54); g.lineTo(s * 0.32, s * 0.54); g.closePath(); g.fill();
  };
  ART.sprout = (g, s) => {
    g.fillStyle = "#D9D6D0"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "#3C8A3A"; g.lineWidth = s * 0.05;
    g.beginPath(); g.moveTo(s * 0.5, s * 0.82); g.lineTo(s * 0.5, s * 0.45); g.stroke();
    g.fillStyle = "#56D15A";
    g.beginPath(); g.ellipse(s * 0.36, s * 0.42, s * 0.16, s * 0.08, -0.6, 0, 7); g.fill();
    g.beginPath(); g.ellipse(s * 0.64, s * 0.36, s * 0.18, s * 0.09, 0.6, 0, 7); g.fill();
  };
  ART.dots = (g, s) => {
    g.fillStyle = "#3A322E"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#D8D0C8"; g.fillRect(s * 0.38, s * 0.48, s * 0.08, s * 0.06); g.fillRect(s * 0.54, s * 0.48, s * 0.08, s * 0.06);
  };
  ART.flame = (g, s) => {
    g.fillStyle = "#2A140A"; g.fillRect(0, 0, s, s);
    const gr = g.createLinearGradient(0, s * 0.2, 0, s * 0.85);
    gr.addColorStop(0, "#FFD05A"); gr.addColorStop(1, "#E2471C");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(s * 0.5, s * 0.15); g.bezierCurveTo(s * 0.8, s * 0.45, s * 0.78, s * 0.85, s * 0.5, s * 0.85); g.bezierCurveTo(s * 0.22, s * 0.85, s * 0.2, s * 0.55, s * 0.38, s * 0.4); g.bezierCurveTo(s * 0.4, s * 0.55, s * 0.48, s * 0.55, s * 0.5, s * 0.15); g.fill();
  };
  ART.stripes = (g, s) => {
    g.fillStyle = "#F3E7D3"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#3D5AF1";
    for (let k = -4; k < 8; k++) { g.beginPath(); g.moveTo(k * s * 0.18, 0); g.lineTo(k * s * 0.18 + s * 0.08, 0); g.lineTo(k * s * 0.18 + s * 0.08 + s, s); g.lineTo(k * s * 0.18 + s, s); g.fill(); }
  };
  ART.moon = (g, s) => {
    g.fillStyle = "#14193A"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#F6E7C8"; g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.28, 0, 7); g.fill();
    g.fillStyle = "#14193A"; g.beginPath(); g.arc(s * 0.62, s * 0.42, s * 0.24, 0, 7); g.fill();
  };
  ART.wave = (g, s) => {
    g.fillStyle = "#0F3B3A"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "#4FE3C4"; g.lineWidth = s * 0.05;
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x <= s; x += s / 16) { const y = s * (0.35 + k * 0.16) + Math.sin(x / s * 6.3 + k) * s * 0.05; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  };

  const cache = {};
  K.art = function (name, s) {
    s = Math.max(8, Math.round(s));
    const key = name + s;
    if (!cache[key]) {
      const c = K.canvas(s, s);
      ART[name](c.getContext("2d"), s);
      cache[key] = c;
    }
    return cache[key];
  };
  K.ARTS = Object.keys(ART);

  // A token tile as seen in the feed: art, green outline, a small pill badge at the corner.
  K.token = function (g, name, x, y, s, o) {
    o = Object.assign({ outline: "#4CD86E", badge: true, alpha: 1, rot: 0, blur: 0, hot: 0 }, o || {});
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    g.globalAlpha *= o.alpha;
    if (o.blur > 0.5) g.filter = `blur(${o.blur}px)`;
    const lw = Math.max(2, s * 0.035);
    // dark mat
    g.fillStyle = "#120A07";
    g.fillRect(-s / 2 - lw * 1.4, -s / 2 - lw * 1.4, s + lw * 2.8, s + lw * 2.8);
    g.drawImage(K.art(name, s), -s / 2, -s / 2, s, s);
    if (o.hot > 0) { g.fillStyle = `rgba(255,170,110,${0.55 * o.hot})`; g.fillRect(-s / 2, -s / 2, s, s); }
    g.strokeStyle = o.outline;
    g.lineWidth = lw;
    g.strokeRect(-s / 2 - lw * 1.4, -s / 2 - lw * 1.4, s + lw * 2.8, s + lw * 2.8);
    if (o.badge) {
      const r = s * 0.13, bx = s / 2 + lw, by = s / 2 + lw;
      g.fillStyle = o.badgeFill || "#173A22";
      g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
      g.strokeStyle = o.outline; g.lineWidth = Math.max(1.5, r * 0.2); g.stroke();
      if (o.badgeGlyph === "+") {
        K.glyph(g, "+", bx, by, r * 1.5, "#E8E4FF", 0, { weight: 0.2 });
      } else {
        g.save(); g.translate(bx, by); g.rotate(-0.75);
        g.fillStyle = "#EAF8EE"; g.beginPath(); g.roundRect(-r * 0.6, -r * 0.28, r * 1.2, r * 0.56, r * 0.28); g.fill();
        g.restore();
      }
    }
    if (name === "letter" && o.side !== false) {
      K.text(g, "K", s / 2 + s * 0.22, -s * 0.2, { size: s * 0.2, weight: 600, color: "rgba(240,230,220,0.85)", ls: 0 });
      K.text(g, "5", s / 2 + s * 0.22, s * 0.1, { size: s * 0.17, weight: 500, color: "rgba(240,230,220,0.5)", ls: 0 });
    }
    g.restore();
  };
})();
