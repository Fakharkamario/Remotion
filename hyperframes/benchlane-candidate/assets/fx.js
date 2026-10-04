// Shared helpers for the benchlane candidate clip.
// Everything is deterministic so any frame can be seeked and rendered in isolation.
(function () {
  const FX = {};

  FX.C = {
    ink: "#16110D",
    orange: "#EA5E39",
    dark: "#0D0B07",
    purple: "#8B6CF2",
    cream: "#FDF8F5",
  };

  // Reference frame -> seconds inside a sub-composition that starts at reference frame `cut`.
  // Sets land 0.4 frame early so a seek to exactly n/30 always sees them.
  FX.at = function (n, cut) {
    return Math.max(0, (n - (cut || 0) - 0.4) / 30);
  };

  // A set at time 0 never renders while the playhead sits on 0, so initial states go straight to gsap.set.
  FX.put = function (tl, el, vars, t) {
    if (t <= 0) gsap.set(el, vars);
    else tl.set(el, vars, t);
  };

  // One set per measured frame. rows: [[frame, ...values]], map(values) -> vars.
  FX.track = function (tl, el, rows, cut, map) {
    rows.forEach((r) => FX.put(tl, el, map(r.slice(1), r[0]), FX.at(r[0], cut)));
  };

  // Cursor (48x56 box, tip at 4,4) and Candidate tag (220x60 box) driven from measured tables.
  FX.cursorTrack = function (tl, el, rows, cut) {
    gsap.set(el, { transformOrigin: "4px 4px" });
    FX.track(tl, el, rows, cut, ([x, y, s, r]) => ({ x: x - 4, y: y - 4, scale: s, rotation: r, opacity: 1 }));
  };
  FX.tagTrack = function (tl, el, rows, cut) {
    gsap.set(el, { transformOrigin: "50% 50%" });
    FX.track(tl, el, rows, cut, ([x, y, s]) => ({ x: x - 110, y: y - 30, scale: s, opacity: 1 }));
  };

  // The two button clicks share one flash: cream -> lavender -> purple -> lavender -> cream.
  FX.flash = {
    bg: ["#DACCF2", "#AA7EFA", "#865AF8", "#9D70F8", "#C4A8F5", "#EEDEF7"],
    fg: ["#8f82a6", "#e2d6fd", "#d9cafd", "#e0d3fd", "#e8defc", "#3b3240"],
  };

  // Pixel mascot ("Volt"): a boxy robot with an antenna and stubby legs.
  // With eyeBg, the eye holes are drawn as rects (class "eye") so they can blink.
  FX.mascot = function (color, eyeBg) {
    const rows = [
      "......##......",
      "......##......",
      "..##########..",
      ".############.",
      ".##..####..##.",
      ".##..####..##.",
      ".############.",
      "##.########.##",
      "##.##....##.##",
      ".############.",
      "...##....##...",
      "..###....###..",
    ];
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 12" shape-rendering="crispEdges">`;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const eye = eyeBg && (y === 4 || y === 5) && (x === 3 || x === 4 || x === 9 || x === 10);
        if (row[x] === "#" || eye) s += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${color}"/>`;
      }
    });
    if (eyeBg) s += `<rect class="eye" x="3" y="4" width="2" height="2" fill="${eyeBg}"/><rect class="eye" x="9" y="4" width="2" height="2" fill="${eyeBg}"/>`;
    return s + "</svg>";
  };

  // Blink: steps is [[frame, "half" | "shut" | "open"], ...]; shut leaves a thin dash.
  FX.blink = function (tl, eyes, steps, cut) {
    const st = { half: { y: 4.7, height: 1.3 }, shut: { y: 4.85, height: 0.35 }, open: { y: 4, height: 2 } };
    steps.forEach(([n, s]) => FX.put(tl, eyes, { attr: st[s] }, FX.at(n, cut)));
  };

  FX.cursor = function (fill, stroke) {
    return `<svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l19 10.5-8.2 2.1L9 23z" fill="${fill}" stroke="${stroke || fill}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  };

  FX.plane = function (color, w) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${color}" stroke-width="${w || 1.8}" stroke-linejoin="round" stroke-linecap="round"><path d="M21.5 2.5L10.5 13.5"/><path d="M21.5 2.5l-7 19-4-8-8-4z"/></svg>`;
  };

  window.FX = FX;
})();
