// GOAT Funded Perps logo reveal, standalone (33 frames @ 30 fps = 1.1 s), rebuilt from the supplied reference clip.
// The shield and its motion live in logo.js; this file runs the timeline and the room around it.
(function () {
  const FPS = 30, FRAMES = 33;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const SCENE = {};
  SCENE.mount = function (stage) {
    stage.innerHTML = `
      <div id="room" class="layer"></div>
      <canvas id="logo" class="layer" width="1920" height="1080"></canvas>
      <canvas id="logoglow" class="layer" width="480" height="270"></canvas>
      <div id="lflash" class="layer"></div>
      <div id="vig" class="layer"></div>
      <div id="grain" class="layer"></div>
      <div class="bar top"></div><div class="bar bot"></div>`;
    const $ = (s) => stage.querySelector(s);
    LOGO.mount($("#logo"), $("#logoglow"));
    const lflash = $("#lflash"), grain = $("#grain"), room = $("#room");
    const tiles = Array.from({ length: 8 }, (_, k) => {
      const c = document.createElement("canvas"); c.width = c.height = 320;
      const g = c.getContext("2d"), img = g.createImageData(320, 320), r = rng(900 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); return `url(${c.toDataURL("image/png")})`;
    });
    function render(fr) {
      let f = clamp(fr, 0, FRAMES - 1);
      if (Math.abs(f - Math.round(f)) < 0.02) f = Math.round(f);
      LOGO.render(f);
      const fl = LOGO.flare(f);
      lflash.style.opacity = (0.32 * fl).toFixed(3);
      // the room warms a little as the flare lights it, then settles
      room.style.filter = `brightness(${(1 + 0.6 * fl).toFixed(3)})`;
      grain.style.backgroundImage = tiles[Math.round(f) % tiles.length];
    }
    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FRAMES, duration: FRAMES / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, FRAMES / FPS);
    window.addEventListener("load", () => render(R._f));
    tl.seek(0.001).seek(0);
    return tl;
  };
  window.SCENE = SCENE;
})();
