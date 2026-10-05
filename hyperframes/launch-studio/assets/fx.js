// Shared helpers for the Launch Studio film.
// Everything is deterministic (fixed tweens and per-frame sets), so any frame can be seeked and rendered alone.
(function () {
  const FX = {};

  FX.FPS = 30;
  FX.C = {
    bg: "#07070A",
    ink: "#F5F3EE",
    dim: "#5B5A62",
    orange: "#FF5B2E",
    amber: "#FFB547",
    violet: "#8C7BFF",
    lime: "#C9F45B",
    sky: "#5CC8FF",
    pink: "#FF5FA2",
  };

  // A set at time 0 never renders while the playhead sits on 0, so initial states go straight to gsap.set.
  FX.put = function (tl, el, vars, t) {
    if (t <= 0) gsap.set(el, vars);
    else tl.set(el, vars, t);
  };

  // Call fn(frameIndex, seconds) for every frame in [t0, t1] (local seconds), landing each set a hair early.
  FX.each = function (t0, t1, fn) {
    const a = Math.round(t0 * FX.FPS), b = Math.round(t1 * FX.FPS);
    for (let f = a; f <= b; f++) fn(f, Math.max(0, (f - 0.4) / FX.FPS), (f - a) / Math.max(1, b - a));
  };

  // Seeded random so every render is identical.
  FX.rand = function (seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };

  // Split a string into one inline-block span per character (spaces kept as fixed-width gaps).
  FX.chars = function (el, text, cls) {
    el.innerHTML = Array.from(text)
      .map((ch) => (ch === " " ? '<span class="ch sp">&nbsp;</span>' : `<span class="ch ${cls || ""}">${ch}</span>`))
      .join("");
    return Array.from(el.querySelectorAll(".ch"));
  };

  // Split into words.
  FX.words = function (el, words) {
    el.innerHTML = words
      .map((w) => {
        const t = typeof w === "string" ? w : w.t;
        const c = typeof w === "string" ? "" : w.cls || "";
        return `<span class="w ${c}">${t}</span>`;
      })
      .join('<span class="ws"> </span>');
    return Array.from(el.querySelectorAll(".w"));
  };

  // Scramble a span's text through code glyphs, resolving to its final character at `lock` seconds.
  const GLYPHS = "▲◆■●/\\<>+*#%=?▮▯";
  FX.scramble = function (tl, span, final, t0, lock, seed) {
    const r = FX.rand(seed);
    // glyph frames stop one frame short of the lock so the final character always wins
    FX.each(t0, lock - 1 / FX.FPS, (f, t) => {
      const ch = GLYPHS[Math.floor(r() * GLYPHS.length)];
      tl.set(span, { textContent: ch, color: r() > 0.6 ? FX.C.orange : FX.C.ink }, t);
    });
    tl.set(span, { textContent: final, color: FX.C.ink }, Math.max(lock, (Math.round(lock * FX.FPS) + 0.2) / FX.FPS));
  };

  // Launch Studio mark: an orange tile with a rising arrow cut through a launch arc.
  FX.mark = function () {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="26" fill="${FX.C.orange}"/>
      <path d="M24 74 C 34 56, 48 44, 70 32" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".35"/>
      <path d="M33 67 L67 33 M44 32 H68 V56" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  };

  // Small line icons for the process rail.
  FX.icon = function (name) {
    const p = {
      brief: '<rect x="6" y="4" width="20" height="24" rx="3"/><path d="M11 11h10M11 16h10M11 21h6"/>',
      script: '<path d="M7 25l3-9L22 4l6 6-12 12z"/><path d="M19 7l6 6"/>',
      design: '<circle cx="12" cy="12" r="6"/><rect x="15" y="15" width="12" height="12" rx="2"/>',
      animate: '<path d="M4 24c6 0 8-16 14-16s6 10 10 10"/><circle cx="4" cy="24" r="2"/><circle cx="28" cy="18" r="2"/>',
      ship: '<path d="M16 3c6 4 8 10 7 17l-7 4-7-4c-1-7 1-13 7-17z"/><circle cx="16" cy="13" r="3"/><path d="M12 27l4 3 4-3"/>',
    }[name];
    return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  };

  // Format a number with optional decimals.
  FX.num = function (v, dec) {
    return v.toFixed(dec || 0);
  };

  window.FX = FX;
})();
