// Shared helpers for the benchlane hire clip.
// Everything is deterministic (per-frame sets) so any frame can be seeked and rendered in isolation.
(function () {
  const FX = {};

  FX.C = {
    cream: "#FDF6EF",
    ink: "#16110D",
    text: "#C9684C", // accent for words as they land
    stroke: "#C26B4C", // pill outline before it inks
    mark: "#E86135",
  };

  // Clip frame (0-based, 30 fps) -> seconds inside a sub-composition that starts at frame `cut`.
  // Sets land 0.4 frame early so a seek to exactly n/30 always sees them.
  FX.at = function (n, cut) {
    return Math.max(0, (n - (cut || 0) - 0.4) / 30);
  };

  // The reference moves on a 24 fps cadence inside 30 fps: every fifth frame (1, 6, 11, ...) repeats the one before it.
  FX.held = function (n) {
    return n % 5 === 1;
  };

  // A set at time 0 never renders while the playhead sits on 0, so initial states go straight to gsap.set.
  FX.put = function (tl, el, vars, t) {
    if (t <= 0) gsap.set(el, vars);
    else tl.set(el, vars, t);
  };

  // One set per measured frame. rows: [[frame, ...values]], map(values, frame) -> vars.
  FX.track = function (tl, el, rows, cut, map) {
    rows.forEach((r) => FX.put(tl, el, map(r.slice(1), r[0]), FX.at(r[0], cut)));
  };

  // Words of a line, each in its own inline-block so it can be shown, tinted and moved alone.
  FX.words = function (el, words) {
    el.innerHTML = words
      .map((w) => {
        const cls = typeof w === "string" ? "" : w.cls || "";
        const txt = typeof w === "string" ? w : w.t;
        return `<span class="w ${cls}">${txt}</span>`;
      })
      .join('<span class="sp"> </span>');
    return Array.from(el.querySelectorAll(".w"));
  };

  // benchlane mark: two L corners around a centre block. `pull` (0-1) draws the corners in toward the block.
  FX.mark = function (color) {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><g fill="${color}">
      <path class="mk-a" d="M0 0h62v26H26v36H0z"/><path class="mk-b" d="M100 100H38V74h36V38h26z"/><rect class="mk-c" x="35" y="35" width="30" height="30"/></g></svg>`;
  };

  window.FX = FX;
})();
