// "Ask AI" — a short headline card in the same type and motion language as the earlier clips. 30 fps, 75 frames.
//   0–7     "Ask" grows
//   7–18    "AI" joins and the line glides to centre
//   18–30   a dark pill grows behind "AI" as it turns white
//   30–64   the line keeps a slow push
//   64–75   the letters lift away, softening, left to right; the pill shrinks out under them
(function () {
  const FPS = 30, FRAMES = 75;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => (t = clamp(t, 0, 1), t * t * t * (t * (t * 6 - 15) + 10));
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
  const INK = "#1c1d21", PAPER = "#f9f8f4";

  // font size runs as one continuous curve (as in one-terminal): a quick grow that eases into a slow push
  const sizeAt = (f) => 142 + 50 * (1 - Math.exp(-f / 4)) + 0.6 * f;
  const JOIN = 7;

  const SCENE = {};
  SCENE.FRAMES = FRAMES;
  SCENE.mount = function (stage) {
    stage.innerHTML = `<div id="pill"></div><div id="line"></div><span id="meas"></span>`;
    const pill = stage.querySelector("#pill"), line = stage.querySelector("#line"), meas = stage.querySelector("#meas");
    const widthOf = (t, size) => { meas.textContent = t; meas.style.fontSize = size + "px"; return meas.getBoundingClientRect().width; };
    let lastKey = null;

    function render(t) {
      const f = clamp(t, 0, FRAMES - 1), fi = Math.round(f);
      const words = fi < JOIN ? ["Ask"] : ["Ask", "AI"];
      const key = words.join(" ");
      if (key !== lastKey) {
        lastKey = key;
        line.innerHTML = key.split("").map((ch) => `<span>${ch === " " ? " " : ch}</span>`).join("");
      }
      const size = sizeAt(f);
      line.style.fontSize = size + "px";
      // a joining word starts the line nudged right and glides it to centre
      let dx = 0;
      if (words.length === 2) dx = 0.3 * ((widthOf("Ask AI", size) - widthOf("Ask", size)) / 2) * Math.exp(-(f - JOIN) / 1.5);
      line.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), -54%)`;

      const spans = [...line.children];
      const tw = smoother((f - 18) / 7); // "AI" turns white as the pill grows behind it
      spans.forEach((s, i) => {
        const isAI = i >= 4;
        const out = smoother((f - 64 - i * 1.2) / 8);
        s.style.color = isAI ? mix(INK, PAPER, tw) : INK;
        s.style.opacity = (1 - out).toFixed(3);
        s.style.transform = `translateY(${(-0.22 * size * out).toFixed(2)}px)`;
        s.style.filter = out > 0.01 ? `blur(${(6 * out).toFixed(2)}px)` : "none";
      });
      // the word gap opens as the pill arrives, so the pill clears the "k"
      if (spans.length > 4) spans[3].style.marginRight = (0.16 * size * smoother((f - 18) / 10)).toFixed(2) + "px";

      // the pill around "AI"
      if (spans.length > 4 && f >= 17.5) {
        const a = spans[4].getBoundingClientRect(), b = spans[5].getBoundingClientRect();
        const cx = (a.left + b.right) / 2, cy = a.top + a.height * 0.54 - (spans[4].style.transform ? 0 : 0);
        const g = smoother((f - 18) / 10), sh = smoother((f - 66) / 9);
        const w = (b.right - a.left + 0.55 * size) * (0.55 + 0.45 * g) * (1 - 0.3 * sh), h = 1.2 * size * (0.55 + 0.45 * g) * (1 - 0.3 * sh);
        pill.style.display = "block";
        pill.style.opacity = (g * (1 - sh)).toFixed(3);
        pill.style.width = w + "px"; pill.style.height = h + "px"; pill.style.borderRadius = h / 2 + "px";
        // ride the line's own position (the letters' lift-off is excluded: the pill only shrinks away)
        const lift = -0.22 * size * smoother((f - 64 - 4 * 1.2) / 8);
        pill.style.transform = `translate(${(cx - w / 2).toFixed(2)}px, ${(cy - lift - h / 2).toFixed(2)}px)`;
      } else pill.style.display = "none";
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
