// fable-reel: 1080x1920, 30 fps. Everything below is a pure function of time t (seconds on the cut take),
// so any frame seeks and renders on its own. Beat times live in assets/plan.js (shared with the audio build).
//
// Layouts (from the style references):
//   full   the take full-frame, jump-zooms on key words, pill captions on the chest
//   split  cream/peach ground, white label at the top, a card in the top half, the take below a wavy edge
//   inset  cream ground, a big card, the take shrunk to a rounded inset under it, captions between them
//   broll  the clip itself, large on a dark ground
(function () {
  const P = window.PLAN, WORDS = window.WORDS;
  const FPS = P.fps, DUR = P.duration;
  const W = 1080, H = 1920;
  const FACE = [540, 700]; // face anchor in the take

  // ------------------------------------------------------------ helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, d) => clamp((t - a) / d, 0, 1);
  const outCubic = (x) => 1 - Math.pow(1 - x, 3);
  const outQuint = (x) => 1 - Math.pow(1 - x, 5);
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const outBack = (x, s = 1.9) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
  const el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const show = (e, on) => { e.style.display = on ? "" : "none"; };
  const shot = (id) => P.shots.find((s) => s.id === id);
  const inShot = (t, id) => { const s = shot(id); return t >= s.a && t < s.b; };
  const currentShot = (t) => P.shots.find((s) => t >= s.a && t < s.b) || P.shots[P.shots.length - 1];
  // pop-in: returns {o, s, y, b} for opacity, scale, y offset, blur
  function popIn(t, a, d = 0.24, from = 0.86, dy = 26) {
    const x = prog(t, a, d);
    const k = outBack(x, 1.7);
    return { o: clamp(x * 2.2, 0, 1), s: lerp(from, 1, k), y: lerp(dy, 0, outCubic(x)), b: lerp(10, 0, outCubic(clamp(x * 1.6, 0, 1))), x };
  }
  const applyPop = (e, p, extra = "") => {
    e.style.opacity = p.o.toFixed(3);
    e.style.transform = `translateY(${p.y.toFixed(1)}px) scale(${p.s.toFixed(4)})${extra}`;
    e.style.filter = p.b > 0.2 ? `blur(${p.b.toFixed(1)}px)` : "none";
  };
  // a word-or-later step hold: piecewise-constant keys [[t, v], ...] eased across a few frames
  function stepKeys(keys, t, ease = 0.0) {
    let v = keys[0][1];
    for (let i = 0; i < keys.length; i++) {
      if (t >= keys[i][0]) {
        const prev = i > 0 ? keys[i - 1][1] : keys[i][1];
        v = ease > 0 ? lerp(prev, keys[i][1], outQuint(prog(t, keys[i][0], ease))) : keys[i][1];
      }
    }
    return v;
  }

  const ICON = {
    check: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#22b35e"/><path d="M6.8 12.4l3.4 3.3 7-7.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v5.4l3.4 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    cash: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="2" y="6" width="20" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.3"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>',
    brain: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M9 4.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 4.5 13a3 3 0 0 0 2 4.7A3 3 0 0 0 12 18V6a2.6 2.6 0 0 0-3-1.5zM15 4.5a3 3 0 0 1 3 3v.3a3 3 0 0 1 1.5 5.2 3 3 0 0 1-2 4.7A3 3 0 0 1 12 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cursor: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 3l13 8.2-5.8 1.3 3.4 6.6-2.6 1.3-3.4-6.6L5 18z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    music: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="17.5" cy="16" r="2.6" fill="currentColor"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2.5l1.6 6.2 6.2-2.3-4.3 5 5.2 3.8-6.4.2.4 6.4L12 18l-2.7 5.8.4-6.4-6.4-.2 5.2-3.8-4.3-5 6.2 2.3z" fill="#fff"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 5v13M6.5 12.5L12 18l5.5-5.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M3 11.5L21 3l-6.5 18-3.3-7.2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  };

  const SCENE = {};
  SCENE.mount = function (L) {
    // ---------------------------------------------------------------- the take
    const camShell = L.camShell, cam = L.cam, aroll = L.aroll, insetFrame = L.insetFrame;
    const ui = L.ui, capLayer = L.cap, flash = L.flash, darkBg = L.darkBg;

    // wavy top edge for the split layout
    function wavePath(t) {
      const ph = t * 0.6;
      const y0 = 905, amp = 34;
      let d = `M0 ${H} L0 ${(y0 + amp * Math.sin(ph)).toFixed(1)}`;
      for (let x = 0; x <= W; x += 30) {
        const y = y0 + amp * Math.sin(ph + x / 175) + 12 * Math.sin(ph * 1.7 + x / 61);
        d += ` L${x} ${y.toFixed(1)}`;
      }
      return d + ` L${W} ${H} Z`;
    }

    // ---------------------------------------------------------------- b-roll slots
    const brollEls = {};
    P.broll.forEach((b) => { brollEls[b.id] = L.broll[b.id]; });

    // media card: white card with a browser bar; holds one b-roll video while its shot runs
    function mediaCard(parent, w, vh, opts = {}) {
      const c = el("div", "card media", parent);
      c.style.width = w + "px";
      if (!opts.nobar) el("div", "bar", c, "<i></i><i></i><i></i><b></b>");
      const slot = el("div", "slot", c);
      slot.style.height = vh + "px";
      return { c, slot };
    }
    const attach = (id, slot) => {
      const v = brollEls[id];
      if (v.parentNode !== slot) slot.appendChild(v);
    };

    // ---------------------------------------------------------------- top label
    const label = el("div", "label", ui, '<div class="eb"></div><div class="tt"></div>');
    const LABELS = {
      buzz: ["Everyone's talking", "The internet is losing it"],
      bench: ["People are calling it", "The next stage"],
      dot: ["One user asked for", "A single dot"],
      pixar: ["Hand-coded", "A full Pixar-style film"],
      hist: ["Another prompt", "All of human history"],
      future: ["And then it predicted", "The next 30 years"],
      think: ["Now always on", "Deep thinking"],
      speed: ["Fable 5.1 vs 5.2", "30% faster"],
      price: ["Per million tokens", "The price dropped"],
      typed: ["My one-line prompt", "Cyberpunk Tokyo"],
      tokyoA: ["One prompt later", "It built this"],
      tokyoB: ["All generated", "In a single prompt"],
      skill: ["I made it a", "One-click skill"],
    };
    // labels change on the beat inside a shot
    const LABEL_SWAP = { bench: [8.36, ["People are calling it", "Human evolution?"]] };

    // ---------------------------------------------------------------- shots' content
    const S = {};

    // hook ----------------------------------------------------------
    S.hook = (() => {
      const root = el("div", "hook", ui);
      const shade = el("div", "hookShade", root);
      const eb = el("div", "hookEb", root, "");
      const ebTxt = "A FEW HOURS AGO";
      const l1 = el("div", "hookL1", root, '<span>ANTHROPIC</span> <span>DROPPED</span>');
      const l2 = el("div", "hookL2", root, "CLAUDE");
      const l3 = el("div", "hookL3", root, '<span>FABLE</span> <span>5.2</span>');
      const l1w = [...l1.querySelectorAll("span")], l3w = [...l3.querySelectorAll("span")];
      return (t) => {
        const on = inShot(t, "hook");
        show(root, on);
        if (!on) return;
        shade.style.opacity = (0.85 * outCubic(prog(t, 0, 0.3))).toFixed(3);
        const n = Math.floor(clamp((t - 0.05) / 0.07, 0, ebTxt.length));
        eb.textContent = ebTxt.slice(0, n);
        eb.style.opacity = n > 0 ? 1 : 0;
        [1.72, 2.14].forEach((a, i) => applyPop(l1w[i], popIn(t, a, 0.2, 1.5, 0)));
        applyPop(l2, popIn(t, 2.54, 0.2, 1.6, 0));
        [2.96, 3.38].forEach((a, i) => applyPop(l3w[i], popIn(t, a, 0.22, 1.8, 0)));
        // the whole block nudges up as the big line lands
        const lift = -40 * outCubic(prog(t, 2.54, 0.3));
        root.style.transform = `translateY(${lift.toFixed(1)}px)`;
      };
    })();

    // buzz ----------------------------------------------------------
    S.buzz = (() => {
      const root = el("div", "abs", ui);
      const chips = P.buzz.map((b, i) => {
        const c = el("div", "react", root, `<span class="av" style="background:${b.c}">${String.fromCharCode(65 + ((i * 7) % 26))}</span><span>${b.txt}</span>`);
        c.style.left = b.x + "px"; c.style.top = b.y + "px";
        return c;
      });
      return (t) => {
        const on = inShot(t, "buzz");
        show(root, on);
        if (!on) return;
        chips.forEach((c, i) => {
          const b = P.buzz[i];
          const p = popIn(t, b.t, 0.22, 0.6, 30);
          const fl = Math.sin((t - b.t) * 2.2 + i) * 6;
          applyPop(c, p, ` translateY(${fl.toFixed(1)}px) rotate(${((i % 2 ? 1 : -1) * (1.5 + (i % 3))).toFixed(1)}deg)`);
          show(c, t >= b.t);
        });
      };
    })();

    // bench -> quote ------------------------------------------------
    S.bench = (() => {
      const root = el("div", "abs", ui);
      const m = mediaCard(root, 900, 560);
      m.c.style.left = "90px"; m.c.style.top = "260px";
      attach("bench", m.slot);
      const q = el("div", "card quote", root, '<div class="qmark">“</div><div class="qt">The next stage in <span class="hl"><em></em><span>human evolution.</span></span></div><div class="qs">— what people are saying about Fable 5.2</div>');
      q.style.left = "80px"; q.style.top = "300px";
      const hl = q.querySelector(".hl em");
      return (t) => {
        const on = inShot(t, "bench");
        show(root, on);
        if (!on) return;
        const a = shot("bench").a, sw = 8.36;
        const out = prog(t, sw - 0.12, 0.14);
        const p = popIn(t, a, 0.26);
        show(m.c, t < sw);
        applyPop(m.c, { ...p, y: p.y - 220 * outCubic(out), o: p.o * (1 - out) });
        show(q, t >= sw - 0.02);
        applyPop(q, popIn(t, sw, 0.26, 0.9, 120));
        hl.style.transform = `scaleX(${outCubic(prog(t, 9.3, 0.45)).toFixed(3)})`;
      };
    })();

    // worth (full) --------------------------------------------------
    S.worth = (() => {
      const root = el("div", "abs", ui);
      const a = el("div", "tag big", root, `<i class="ic">${ICON.clock}</i>Time?`);
      const b = el("div", "tag big", root, `<i class="ic">${ICON.cash}</i>Money?`);
      a.style.left = "90px"; a.style.top = "1080px";
      b.style.left = "640px"; b.style.top = "1000px";
      return (t) => {
        const on = inShot(t, "worth");
        show(root, on);
        if (!on) return;
        show(a, t >= 12.11); show(b, t >= 12.51);
        applyPop(a, popIn(t, 12.11, 0.2, 0.5, 0), " rotate(-5deg)");
        applyPop(b, popIn(t, 12.51, 0.2, 0.5, 0), " rotate(4deg)");
      };
    })();

    // dot -----------------------------------------------------------
    S.dot = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card dotcard", root, '<div class="bubble"><span class="bt"></span><i class="caret"></i></div><div class="floor"></div><div class="shadow"></div><div class="ball"></div>');
      card.style.left = "90px"; card.style.top = "250px";
      const bt = card.querySelector(".bt"), caret = card.querySelector(".caret"), ball = card.querySelector(".ball"), sh = card.querySelector(".shadow");
      const txt = "a dot.";
      return (t) => {
        const on = inShot(t, "dot");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("dot").a, 0.26));
        const n = Math.floor(clamp((t - 14.15) / 0.11, 0, txt.length));
        bt.textContent = txt.slice(0, n);
        caret.style.opacity = (Math.floor(t * 3) % 2 === 0 || (t > 14.1 && t < 14.9)) ? 1 : 0;
        // the ball drops in on "dot." and bounces
        const t0 = 15.43;
        const floorY = 470, R = 46;
        let y, sq = 1;
        if (t < t0) y = -200;
        else {
          const tt = t - t0;
          const bounces = [[0, 0.22, -260], [0.22, 0.32, 120], [0.54, 0.2, 40], [0.74, 0.12, 10]];
          y = floorY;
          for (const [s, d, hgt] of bounces) {
            if (tt >= s && tt < s + d) {
              const u = (tt - s) / d;
              y = hgt < 0 ? lerp(floorY + hgt, floorY, u * u) : floorY - hgt * 4 * u * (1 - u);
            }
          }
          const impacts = [0.22, 0.54, 0.74];
          impacts.forEach((ti, k) => { const dd = tt - ti; if (dd >= 0 && dd < 0.09) sq = Math.min(sq, 1 - (0.32 / (k + 1)) * Math.sin((dd / 0.09) * Math.PI)); });
        }
        ball.style.display = t >= t0 ? "" : "none";
        ball.style.transform = `translate(${450 - R}px, ${(y - 2 * R + (1 - sq) * R).toFixed(1)}px) scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})`;
        ball.style.transformOrigin = "50% 100%";
        const hgt = clamp((floorY - y) / 300, 0, 1);
        sh.style.opacity = t >= t0 ? (0.35 * (1 - hgt * 0.7)).toFixed(3) : 0;
        sh.style.transform = `translate(${450 - 60}px, ${floorY - 10}px) scale(${(1 - hgt * 0.5).toFixed(3)}, 1)`;
      };
    })();

    // pixar (inset) -------------------------------------------------
    S.pixar = (() => {
      const root = el("div", "abs", ui);
      const m = mediaCard(root, 980, 395);
      m.c.style.left = "50px"; m.c.style.top = "250px";
      attach("pixar", m.slot);
      const row = el("div", "tagrow", m.c);
      const tags = [["Hand-coded", 16.8], ["Pixar-style", 18.14], ["Short film", 18.98]].map(([s, a]) => {
        const e = el("div", "tag", row, s); return [e, a];
      });
      return (t) => {
        const on = inShot(t, "pixar");
        show(root, on);
        if (!on) return;
        applyPop(m.c, popIn(t, shot("pixar").a, 0.26));
        tags.forEach(([e, a]) => { e.style.visibility = t >= a ? "visible" : "hidden"; applyPop(e, popIn(t, a, 0.2, 0.6, 0)); });
      };
    })();

    // music (full) --------------------------------------------------
    S.music = (() => {
      const root = el("div", "abs", ui);
      const tag = el("div", "tag big dark", root, `<i class="ic">${ICON.music}</i>Original music<span class="eq">${"<b></b>".repeat(7)}</span>`);
      tag.style.left = "250px"; tag.style.top = "1150px";
      const bars = [...tag.querySelectorAll(".eq b")];
      return (t) => {
        const on = inShot(t, "music");
        show(root, on);
        if (!on) return;
        show(tag, t >= 19.9);
        applyPop(tag, popIn(t, 19.9, 0.22, 0.6, 0), " rotate(-3deg)");
        bars.forEach((b, i) => {
          const h = 0.25 + 0.75 * Math.abs(Math.sin(t * (7 + i * 1.3) + i * 1.7)) * (0.6 + 0.4 * Math.sin(t * 3.1 + i));
          b.style.transform = `scaleY(${h.toFixed(3)})`;
        });
      };
    })();

    // history -------------------------------------------------------
    S.hist = (() => {
      const root = el("div", "abs", ui);
      const m = mediaCard(root, 940, 352);
      m.c.style.left = "70px"; m.c.style.top = "250px";
      attach("hist", m.slot);
      const stat = el("div", "statrow", m.c, '<div class="num">0.0M</div><div class="lbl">years of human<br>history, mapped</div>');
      const num = stat.querySelector(".num");
      return (t) => {
        const on = inShot(t, "hist");
        show(root, on);
        if (!on) return;
        applyPop(m.c, popIn(t, shot("hist").a, 0.26));
        const v = 3.3 * outCubic(prog(t, 22.6, 1.2));
        num.textContent = v.toFixed(1) + "M";
        const k = prog(t, 23.68, 0.2);
        num.style.transform = `scale(${(1 + 0.12 * Math.sin(k * Math.PI)).toFixed(3)})`;
      };
    })();

    // future --------------------------------------------------------
    S.future = (() => {
      const root = el("div", "abs", ui);
      const m = mediaCard(root, 940, 380);
      m.c.style.left = "70px"; m.c.style.top = "250px";
      attach("future", m.slot);
      const stat = el("div", "statrow", m.c, '<div class="num">2026</div><div class="track"><i></i></div><div class="lbl r">+30<br>years</div>');
      const num = stat.querySelector(".num"), fill = stat.querySelector(".track i");
      return (t) => {
        const on = inShot(t, "future");
        show(root, on);
        if (!on) return;
        applyPop(m.c, popIn(t, shot("future").a, 0.26));
        const k = inOut(prog(t, 25.6, 1.7));
        num.textContent = String(Math.round(2026 + 30 * k));
        fill.style.transform = `scaleX(${k.toFixed(3)})`;
      };
    })();

    // deep thinking -------------------------------------------------
    S.think = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card think", root, `<div class="trow"><i class="ic">${ICON.brain}</i><span>Deep thinking</span><div class="tog"><b></b></div></div><div class="sep"></div><div class="big247"><span>24/7</span><em>active</em></div>`);
      card.style.left = "90px"; card.style.top = "270px";
      const tog = card.querySelector(".tog"), knob = tog.querySelector("b"), big = card.querySelector(".big247");
      return (t) => {
        const on = inShot(t, "think");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("think").a, 0.26));
        const k = outBack(prog(t, 29.18, 0.22), 1.4);
        knob.style.transform = `translateX(${(k * 64).toFixed(1)}px)`;
        tog.style.background = k > 0.5 ? "#ee6a3a" : "#d9d4cf";
        big.style.visibility = t >= 29.78 ? "visible" : "hidden";
        applyPop(big, popIn(t, 29.78, 0.24, 1.7, 0));
      };
    })();

    // speed ---------------------------------------------------------
    S.speed = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card speed", root,
        '<div class="pct">+<span>0</span>%</div>' +
        '<div class="srow"><span>Fable 5.1</span><div class="sbar"><i class="g"></i></div></div>' +
        `<div class="srow"><span>Fable 5.2</span><div class="sbar"><i class="o"></i></div><em class="ck">${ICON.check}</em></div>`);
      card.style.left = "90px"; card.style.top = "270px";
      const [b1, b2] = card.querySelectorAll(".sbar i"), ck = card.querySelector(".ck"), pct = card.querySelector(".pct span"), pctBox = card.querySelector(".pct");
      return (t) => {
        const on = inShot(t, "speed");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("speed").a, 0.24));
        const a = 31.55;
        b1.style.transform = `scaleX(${clamp((t - a) / 1.55, 0, 1).toFixed(3)})`;
        b2.style.transform = `scaleX(${clamp((t - a) / 1.07, 0, 1).toFixed(3)})`;
        ck.style.visibility = t >= a + 1.07 ? "visible" : "hidden";
        applyPop(ck, popIn(t, a + 1.07, 0.2, 0.3, 0));
        pct.textContent = String(Math.round(30 * outCubic(prog(t, 32.2, 0.4))));
        applyPop(pctBox, popIn(t, 32.2, 0.22, 1.5, 0));
      };
    })();

    // price ---------------------------------------------------------
    S.price = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card price", root,
        `<div class="badge"><i class="ic">${ICON.down}</i>20%</div>` +
        '<div class="cols">' +
        '<div class="col"><div class="k">Input</div><div class="old">$10<s></s></div><div class="new">$8</div></div>' +
        '<div class="col"><div class="k">Output</div><div class="old">$50<s></s></div><div class="new">$40</div></div>' +
        "</div>");
      card.style.left = "90px"; card.style.top = "250px";
      const badge = card.querySelector(".badge"), strikes = card.querySelectorAll(".old s"), olds = card.querySelectorAll(".old"), news = card.querySelectorAll(".new");
      return (t) => {
        const on = inShot(t, "price");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("price").a, 0.24));
        badge.style.visibility = t >= 35.47 ? "visible" : "hidden";
        applyPop(badge, popIn(t, 35.47, 0.22, 1.6, 0));
        strikes.forEach((s, i) => { s.style.transform = `scaleX(${outCubic(prog(t, 34.97 + i * 0.08, 0.2)).toFixed(3)})`; });
        olds.forEach((o) => { o.style.opacity = (1 - 0.55 * prog(t, 35.4, 0.2)).toFixed(3); o.style.fontSize = lerp(96, 54, outCubic(prog(t, 35.47, 0.25))).toFixed(1) + "px"; });
        news.forEach((n, i) => { n.style.visibility = t >= 35.47 + i * 0.06 ? "visible" : "hidden"; applyPop(n, popIn(t, 35.47 + i * 0.06, 0.24, 1.6, 0)); });
      };
    })();

    // test (full): "just one line" ---------------------------------
    S.test = (() => {
      const root = el("div", "abs", ui);
      const tag = el("div", "tag big", root, '<b class="one">1</b>line. that\'s it.');
      tag.style.left = "300px"; tag.style.top = "1130px";
      return (t) => {
        const on = inShot(t, "test");
        show(root, on);
        if (!on) return;
        show(tag, t >= 38.7);
        applyPop(tag, popIn(t, 38.7, 0.2, 0.5, 0), " rotate(-3deg)");
      };
    })();

    // typed prompt --------------------------------------------------
    S.typed = (() => {
      const root = el("div", "abs", ui);
      const box = el("div", "card prompt", root,
        '<div class="ptxt"><span class="pt"></span><i class="caret"></i><span class="ph">Ask anything…</span></div>' +
        `<div class="pbar"><i class="ic plus">${ICON.plus}</i><div class="model">Fable 5.2 <span>⌄</span></div><div class="sendb">${ICON.arrowUp}</div></div>`);
      box.style.left = "70px"; box.style.top = "330px";
      const pt = box.querySelector(".pt"), caret = box.querySelector(".caret"), ph = box.querySelector(".ph"), sendb = box.querySelector(".sendb");
      const cur = el("div", "cursor", root, ICON.cursor);
      const T = P.typed;
      // characters are typed so each word lands on its spoken onset
      const wordsAt = WORDS.filter((w) => w.s >= T.a - 0.05 && w.s <= T.b + 0.3);
      const parts = T.text.split(" ");
      const starts = parts.map((_, i) => (wordsAt[i] ? wordsAt[i].s : T.a + i * 0.35));
      return (t) => {
        const on = inShot(t, "typed");
        show(root, on);
        if (!on) return;
        applyPop(box, popIn(t, shot("typed").a, 0.26));
        let s = "";
        parts.forEach((w, i) => {
          const d = Math.max(0.12, (i + 1 < parts.length ? starts[i + 1] - starts[i] : 0.35) * 0.8);
          const n = Math.floor(clamp((t - starts[i]) / d, 0, 1) * w.length + 1e-6);
          if (t >= starts[i]) s += (i ? " " : "") + w.slice(0, Math.max(1, n));
        });
        pt.textContent = s;
        ph.style.display = s ? "none" : "";
        caret.style.opacity = Math.floor(t * 3.2) % 2 === 0 || (t > T.a && t < T.b) ? 1 : 0;
        // cursor glides to send and clicks
        const k = inOut(prog(t, 41.9, 0.65));
        const x = lerp(1000, 900, k), y = lerp(1000, 640, k);
        cur.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(t >= 42.6 && t < 42.7 ? 0.85 : 1)})`;
        cur.style.opacity = prog(t, 41.8, 0.15).toFixed(3);
        const pr = t >= 42.6 && t < 42.72;
        sendb.style.transform = `scale(${pr ? 0.86 : 1})`;
        sendb.style.boxShadow = t >= 42.6 ? `0 0 0 ${(18 * prog(t, 42.6, 0.25)).toFixed(1)}px rgba(238,106,58,${(0.35 * (1 - prog(t, 42.6, 0.25))).toFixed(3)})` : "none";
      };
    })();

    // tokyo A -------------------------------------------------------
    S.tokyoA = (() => {
      const root = el("div", "abs", ui);
      const m = mediaCard(root, 960, 466);
      m.c.style.left = "60px"; m.c.style.top = "270px";
      attach("tokyoA", m.slot);
      return (t) => {
        const on = inShot(t, "tokyoA");
        show(root, on);
        if (!on) return;
        applyPop(m.c, popIn(t, shot("tokyoA").a, 0.24, 0.8, 80));
      };
    })();

    // tokyo B (split -> full) --------------------------------------
    S.tokyoB = (() => {
      const root = el("div", "abs", ui);
      const holder = el("div", "tbHolder", root);
      const v = brollEls.tokyoB;
      holder.appendChild(v);
      const chips = el("div", "checks", root);
      const mp = el("div", "mp", root, '<div class="m1">AN ABSOLUTE</div><div class="m2">MASTERPIECE</div>');
      const [m1, m2] = mp.children;
      const items = [["Lighting", 44.95], ["Sound", 45.81], ["Camera motion", 46.59]].map(([s, a]) => [el("div", "tag chk", chips, `<i class="ic">${ICON.check}</i>${s}`), a]);
      return (t) => {
        const on = inShot(t, "tokyoB") || inShot(t, "tokyoFull");
        show(root, on);
        if (!on) return;
        // card rect -> full bleed
        const k = outQuint(prog(t, shot("tokyoFull").a, 0.32));
        const p = popIn(t, shot("tokyoB").a, 0.24, 0.85, 60);
        const x0 = 70, y0 = 250, w0 = 940, h0 = 600;
        const w1 = W * 1.0, h1 = 810 * 1.32, x1 = (W - w1) / 2, y1 = 470;
        const x = lerp(x0, x1, k), y = lerp(y0, y1, k), w = lerp(w0, w1, k), h = lerp(h0, h1, k);
        holder.style.left = x + "px"; holder.style.top = y + "px"; holder.style.width = w + "px"; holder.style.height = h + "px";
        holder.style.borderRadius = lerp(26, 0, k) + "px";
        holder.style.borderWidth = lerp(12, 0, k) + "px";
        const push = 1 + 0.06 * prog(t, shot("tokyoFull").a, 2.1);
        v.style.transform = `scale(${push.toFixed(4)})`;
        applyPop(holder, k > 0 ? { o: 1, s: 1, y: 0, b: 0 } : p);
        chips.style.opacity = (1 - k).toFixed(3);
        show(mp, inShot(t, "tokyoFull"));
        applyPop(m1, popIn(t, 47.95, 0.2, 0.6, 0));
        applyPop(m2, popIn(t, 48.45, 0.22, 1.7, 0));
        items.forEach(([e, a]) => { e.style.visibility = t >= a ? "visible" : "hidden"; applyPop(e, popIn(t, a, 0.2, 0.5, 0)); });
      };
    })();

    // zero edits (full) ---------------------------------------------
    S.zero = (() => {
      const root = el("div", "abs", ui);
      const shade = el("div", "hookShade", root);
      const stamp = el("div", "stamp", root, "ZERO<br>EDITS");
      return (t) => {
        const on = inShot(t, "zero");
        show(root, on);
        if (!on) return;
        shade.style.opacity = 0.8;
        applyPop(stamp, popIn(t, 49.61, 0.2, 2.0, 0), " rotate(-4deg)");
      };
    })();

    // skill (inset) -------------------------------------------------
    S.skill = (() => {
      const root = el("div", "abs", ui);
      const steps = [["Exact prompt", 51.05], ["Lighting + sound setup", 51.47], ["Camera motion", 51.97], ["Scene build steps", 52.35]];
      const card = el("div", "card skill", root,
        `<div class="sh"><div class="sic">${ICON.spark}</div><div><div class="sn">Cyberpunk Scene Builder</div><div class="ss">Custom skill · Fable 5.2</div></div></div>` +
        steps.map(([s]) => `<div class="step"><span>${s}</span><em class="ck">${ICON.check}</em></div>`).join("") +
        '<div class="run">Run in one click</div>');
      card.style.left = "90px"; card.style.top = "250px";
      const rows = [...card.querySelectorAll(".step")], run = card.querySelector(".run");
      const cur = el("div", "cursor", root, ICON.cursor);
      return (t) => {
        const on = inShot(t, "skill");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("skill").a, 0.26));
        rows.forEach((r, i) => {
          const a = steps[i][1];
          r.style.opacity = t >= a - 0.3 ? 1 : 0.35;
          const ck = r.querySelector(".ck");
          ck.style.visibility = t >= a ? "visible" : "hidden";
          applyPop(ck, popIn(t, a, 0.2, 0.3, 0));
        });
        const k = inOut(prog(t, 52.5, 0.55));
        cur.style.opacity = prog(t, 52.45, 0.12).toFixed(3);
        const pressed = t >= 53.1 && t < 53.22;
        cur.style.transform = `translate(${lerp(980, 640, k).toFixed(1)}px, ${lerp(1000, 905, k).toFixed(1)}px) scale(${pressed ? 0.85 : 1})`;
        run.style.transform = `scale(${pressed ? 0.95 : 1})`;
        run.classList.toggle("done", t >= 53.12);
        run.textContent = t >= 53.12 ? "Done in one click" : "Run in one click";
      };
    })();

    // cta (full) ----------------------------------------------------
    S.cta = (() => {
      const root = el("div", "abs", ui);
      const box = el("div", "cta", root, '<div class="c1">COMMENT THE WORD</div><div class="c2">FABLE</div><div class="c3">and I\'ll send the skill to your DMs</div>');
      const dm = el("div", "tag big", root, `<i class="ic">${ICON.send}</i>Straight to your DMs`);
      dm.style.left = "250px"; dm.style.top = "1150px";
      const c2 = box.querySelector(".c2");
      return (t) => {
        const on = inShot(t, "cta");
        show(root, on);
        if (!on) return;
        applyPop(box, popIn(t, 54.17, 0.28, 0.7, 40));
        const fl = t < 54.6 ? (Math.floor(t * 20) % 3 === 0 ? 0.45 : 1) : 1;
        c2.style.opacity = fl;
        c2.style.transform = `scale(${(1 + 0.08 * Math.sin(prog(t, 54.6, 0.25) * Math.PI)).toFixed(3)})`;
        show(dm, t >= 55.98);
        applyPop(dm, popIn(t, 55.98, 0.22, 0.5, 0), " rotate(-2deg)");
      };
    })();

    // ---------------------------------------------------------------- captions
    // ASR tokens like "-coded", ".2" join the word before them
    const toks = [];
    WORDS.forEach((w) => {
      if (/^[-.]/.test(w.w) && toks.length) { const p = toks[toks.length - 1]; p.w += w.w; p.e = w.e; }
      else toks.push({ ...w });
    });
    // "24 slash 7" reads as 24/7
    for (let i = 1; i + 1 < toks.length; i++) {
      if (toks[i].w.toLowerCase() === "slash") {
        toks[i - 1].w += "/" + toks[i + 1].w; toks[i - 1].e = toks[i + 1].e;
        toks.splice(i, 2);
      }
    }
    const groups = [];
    let g = null;
    toks.forEach((w, i) => {
      const prev = toks[i - 1];
      const brk = !g || /[.,?!]$/.test(prev.w) || g.words.length >= 3 || g.words.map((x) => x.w).join(" ").length + w.w.length > 17 || w.s - prev.e > 0.35;
      if (brk) { g = { words: [] }; groups.push(g); }
      g.words.push(w);
    });
    groups.forEach((gr, i) => {
      gr.a = gr.words[0].s - 0.04;
      gr.b = i + 1 < groups.length ? groups[i + 1].words[0].s - 0.04 : gr.words[gr.words.length - 1].e + 0.6;
    });
    const pill = el("div", "cap", capLayer);
    const clean = (s) => s.replace(/[.,!]+$/, "").replace(/^Fable$/, "Fable");
    const NO_CAPS = ["hook", "zero", "tokyoFull"];
    function renderCaption(t, sh) {
      const gr = groups.find((x) => t >= x.a && t < x.b);
      if (!gr || NO_CAPS.includes(sh.id)) { pill.style.display = "none"; return; }
      pill.style.display = "";
      const key = groups.indexOf(gr);
      if (pill.dataset.k !== String(key)) {
        pill.dataset.k = String(key);
        pill.innerHTML = gr.words.map((w) => `<span>${clean(w.w)}</span>`).join(" ");
      }
      [...pill.children].forEach((s, i) => s.classList.toggle("on", t >= gr.words[i].s - 0.03));
      const Y = { full: 1450, split: 1610, inset: 1095, broll: 1640 }[sh.L];
      const p = popIn(t, gr.a, 0.14, 0.88, 0);
      pill.style.top = Y + "px";
      pill.style.opacity = p.o.toFixed(3);
      pill.style.transform = `translateX(-50%) scale(${p.s.toFixed(4)})`;
    }

    // ---------------------------------------------------------------- frame
    function render(f) {
      const t = Math.min(f / FPS, DUR - 1e-4);
      const sh = currentShot(t);
      const Lk = sh.L;
      const local = t - sh.a;

      // ground
      darkBg.style.display = Lk === "broll" ? "" : "none";
      L.bg.style.display = Lk === "full" ? "none" : "";

      // the take
      camShell.style.display = Lk === "broll" ? "none" : "";
      insetFrame.style.display = Lk === "inset" ? "" : "none";
      let tf = "", clip = "none";
      if (Lk === "full") {
        const z = (P.zoom[sh.id] ? stepKeys(P.zoom[sh.id], t, 0) : 1.06) * (1 + 0.025 * local / (sh.b - sh.a));
        // a short shake when a jump-zoom slams in
        let sx = 0, sy = 0;
        (P.zoom[sh.id] || []).forEach(([kt, kz], i) => {
          const d = t - kt;
          if (d >= 0 && d < 0.22 && (i > 0 || sh.id !== "hook") && kz >= 1.2) { const a = 9 * (1 - d / 0.22); sx += a * Math.sin(d * 90); sy += a * Math.cos(d * 70); }
        });
        tf = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${z.toFixed(4)})`;
        cam.style.transformOrigin = `${FACE[0]}px ${FACE[1]}px`;
      } else if (Lk === "split") {
        const z = 1.0 + 0.03 * local / (sh.b - sh.a);
        tf = `translateY(430px) scale(${z.toFixed(4)})`;
        cam.style.transformOrigin = `${FACE[0]}px ${FACE[1]}px`;
        clip = `path("${wavePath(t)}")`;
      } else if (Lk === "inset") {
        const s = 0.5, bx = 375, by = 1180, bw = 330, bh = 420;
        // face (540,700) -> centre of the box, a little high
        const tx = bx + bw / 2 - FACE[0] * s, ty = by + bh * 0.42 - FACE[1] * s;
        tf = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s})`;
        cam.style.transformOrigin = "0 0";
        clip = `inset(${by}px ${W - bx - bw}px ${H - by - bh}px ${bx}px round 34px)`;
        const p = popIn(t, sh.a, 0.24, 0.8, 30);
        insetFrame.style.opacity = p.o;
        insetFrame.style.transform = `translateY(${p.y}px)`;
      }
      cam.style.transform = tf;
      camShell.style.clipPath = clip;
      camShell.style.filter = Lk === "split" ? "drop-shadow(0 -10px 24px rgba(120,64,24,0.28))" : "none";

      // label
      const lab = LABELS[sh.id];
      show(label, !!lab);
      if (lab) {
        let txt = lab, at = sh.a;
        const sw = LABEL_SWAP[sh.id];
        if (sw && t >= sw[0]) { txt = sw[1]; at = sw[0]; }
        const eb = label.firstChild, tt = label.lastChild;
        if (eb.textContent !== txt[0]) eb.textContent = txt[0];
        if (tt.textContent !== txt[1]) tt.textContent = txt[1];
        const p = popIn(t, at, 0.22, 0.8, -20);
        label.style.opacity = p.o.toFixed(3);
        label.style.transform = `translateX(-50%) translateY(${p.y.toFixed(1)}px) scale(${p.s.toFixed(4)})`;
      }

      // b-roll videos: visible only inside their window (HyperFrames seeks them by data-start)
      P.broll.forEach((b) => { brollEls[b.id].style.visibility = t >= b.a && t < b.a + b.d + 0.05 ? "visible" : "hidden"; });

      Object.values(S).forEach((fn) => fn(t));
      renderCaption(t, sh);

      // warm flash on the big transitions
      let fo = 0;
      P.flash.forEach((ft) => { const d = t - ft; if (d >= -0.04 && d < 0.3) fo = Math.max(fo, d < 0 ? (d + 0.04) / 0.04 : Math.pow(1 - d / 0.3, 2)); });
      flash.style.opacity = (0.9 * fo).toFixed(3);
    }

    const R = { _f: 0 };
    Object.defineProperty(R, "frame", { get: () => R._f, set: (v) => { R._f = v; render(v); } });
    const FR = Math.round(DUR * FPS);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(R, { frame: 0 }, { frame: FR, duration: FR / FPS, ease: "none", immediateRender: true }, 0);
    tl.set({}, {}, DUR);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(R._f));
    tl.seek(0.001).seek(0);
    SCENE.render = render;
    return tl;
  };
  window.SCENE = SCENE;
})();
