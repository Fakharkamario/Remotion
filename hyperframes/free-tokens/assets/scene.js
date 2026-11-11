// free-tokens: 1080x1920, 30 fps, edited in the style of the talking-head references (same system as fable-reel).
// The take is square (1080x1080); each layout frames it differently:
//   full   scaled to cover the 9:16 frame, jump-zooms on the face
//   split  native size under a wavy edge, cream/peach ground and a card above
//   inset  shrunk into a rounded window under a big card
//   intro  punch on the face, then settled under the hero panel that drops in
// Everything is a pure function of time t (seconds on the cut take); beat times live in assets/plan.js.
(function () {
  const P = window.PLAN, WORDS = window.WORDS;
  const FPS = P.fps, DUR = P.duration;
  const W = 1080, H = 1920;
  const FACE = [540, 300]; // face in the square take
  const COVER = H / 1080, COVER_X = -(1080 * COVER - W) / 2;

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
  const vis = (e, on) => { e.style.visibility = on ? "visible" : "hidden"; };
  const shot = (id) => P.shots.find((s) => s.id === id);
  const inShot = (t, id) => { const s = shot(id); return t >= s.a && t < s.b; };
  const currentShot = (t) => P.shots.find((s) => t >= s.a && t < s.b) || P.shots[P.shots.length - 1];
  function popIn(t, a, d = 0.24, from = 0.86, dy = 26) {
    const x = prog(t, a, d);
    return { o: clamp(x * 2.2, 0, 1), s: lerp(from, 1, outBack(x, 1.7)), y: lerp(dy, 0, outCubic(x)), b: lerp(10, 0, outCubic(clamp(x * 1.6, 0, 1))), x };
  }
  const applyPop = (e, p, extra = "") => {
    e.style.opacity = p.o.toFixed(3);
    e.style.transform = `translateY(${p.y.toFixed(1)}px) scale(${p.s.toFixed(4)})${extra}`;
    e.style.filter = p.b > 0.2 ? `blur(${p.b.toFixed(1)}px)` : "none";
  };
  const popAt = (e, t, a, d, from, dy, extra) => { vis(e, t >= a); applyPop(e, popIn(t, a, d, from, dy), extra); };
  function stepKeys(keys, t) { let v = keys[0][1]; keys.forEach(([kt, kv]) => { if (t >= kt) v = kv; }); return v; }
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const logo = (n) => `<img src="assets/img/logo_${n}.png" alt="">`;

  const ICON = {
    check: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#22b35e"/><path d="M6.8 12.4l3.4 3.3 7-7.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#e5483a"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#f2b632"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 17l6-6 4 4 6-7M14 8h6v6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pen: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 20l1-5L15.5 4.5a2 2 0 0 1 3 3L8 18z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.3"/></svg>',
  };

  const SCENE = {};
  SCENE.mount = function (L) {
    const camShell = L.camShell, cam = L.cam, aroll = L.aroll, insetFrame = L.insetFrame;
    const ui = L.ui, capLayer = L.cap, flash = L.flash;

    function wavePath(t) {
      const ph = t * 0.6, y0 = 905, amp = 34;
      let d = `M0 ${H} L0 ${(y0 + amp * Math.sin(ph)).toFixed(1)}`;
      for (let x = 0; x <= W; x += 30) d += ` L${x} ${(y0 + amp * Math.sin(ph + x / 175) + 12 * Math.sin(ph * 1.7 + x / 61)).toFixed(1)}`;
      return d + ` L${W} ${H} Z`;
    }

    // ---------------------------------------------------------------- top label
    const label = el("div", "label", ui, '<div class="eb"></div><div class="tt"></div>');
    const LABELS = {
      counter: [[3.8, "Every single month", "800M tokens"], [5.53, "Every single month", "For $0"]],
      tiers: [[11.12, "Every big AI company", "Gives a free tier"]],
      stack: [[17.02, "Small limits, sure", "This repo stacks them"]],
      route: [[20.18, "How it works", "One request"], [22.81, "How it works", "Limit hit? Next."], [26.40, "How it works", "You never hit a wall"]],
      words: [[29.19, "800M tokens is about", "600M words"], [32.29, "Write every day", "For the rest of your life"]],
      bills: [[35.75, "Meanwhile, developers", "Pay $200+ a month"]],
      github: [[41.52, "Right now", "Blowing up on GitHub"]],
    };

    const S = {};

    // ================================================================ intro (references' opener)
    const INTRO = { drop: 0.08, l1: 0.2, l1step: 0.034, l2gap: 0.06, l2step: 0.075, burn: 3.5 };
    S.hook = (() => {
      const root = el("div", "intro", ui);
      const shade = el("div", "introShade", root);
      const hero = el("div", "hero", root);
      const heroIn = el("div", "heroIn", hero);
      const win = el("div", "hwin", heroIn, '<img src="assets/img/repo.png" alt="">');
      const tk = el("div", "htok", heroIn, '<div class="hk">FREE TOKENS / MONTH</div><div class="hv">0</div>');
      const hv = tk.querySelector(".hv");
      const toast = el("div", "rtoast green", heroIn, "<i></i>Somebody just figured it out");
      const edge = el("div", "heroEdge green", root, '<svg width="1080" height="160" viewBox="0 0 1080 160"><path class="g" d=""/><path class="l" d=""/></svg>');
      const [edgeGlow, edgeLine] = edge.querySelectorAll("path");
      const mk = (cls, text) => { const d = el("div", cls, root); return [[...text].map((c) => el("span", c === " " ? "sp" : "", d, c === " " ? "&nbsp;" : c)), d]; };
      const [L1] = mk("iL1", "STOP PAYING FOR AI");
      const [L2] = mk("iL2 green", "800M FREE");
      const HERO_H = 700;
      const waveY = (x, t) => HERO_H - 40 + 26 * Math.sin(x / 150 + t * 1.3) + 10 * Math.sin(x / 53 - t * 2.1);
      function letter(sp, t, a, dist, blur) {
        const x = prog(t, a, 0.12), k = outCubic(x);
        sp.style.opacity = clamp(x * 3, 0, 1).toFixed(3);
        sp.style.transform = `translateX(${((1 - k) * -dist).toFixed(1)}px) scaleX(${(1 + 0.6 * (1 - k)).toFixed(3)})`;
        sp.style.filter = x < 1 ? `blur(${(blur * (1 - k)).toFixed(1)}px)` : "none";
      }
      return (t) => {
        const on = inShot(t, "hook");
        show(root, on); show(edge, on);
        if (!on) return;
        const d = outBack(prog(t, INTRO.drop, 0.34), 1.2);
        const hy = lerp(-HERO_H - 120, 0, d);
        let path = `M0 0 L1080 0 L1080 ${waveY(1080, t).toFixed(1)}`, line = "";
        for (let x = 1080; x >= 0; x -= 24) {
          const y = waveY(x, t);
          path += ` L${x} ${y.toFixed(1)}`;
          line += (x === 1080 ? "M" : " L") + `${x} ${(y - (HERO_H - 120)).toFixed(1)}`;
        }
        hero.style.clipPath = `path("${path} Z")`;
        hero.style.transform = `translateY(${hy.toFixed(1)}px)`;
        hero.style.filter = t < INTRO.drop + 0.25 ? `blur(${(8 * (1 - prog(t, INTRO.drop, 0.25))).toFixed(1)}px)` : "none";
        edge.style.transform = `translateY(${(hy + HERO_H - 120).toFixed(1)}px)`;
        edgeGlow.setAttribute("d", line); edgeLine.setAttribute("d", line);
        heroIn.style.transform = `scale(${(1 + 0.04 * prog(t, 0.4, 3.4)).toFixed(4)})`;
        // the screenshot scrolls a touch, the token counter spins up
        win.firstChild.style.transform = `translateY(${(-30 * inOut(prog(t, 0.6, 2.6))).toFixed(1)}px)`;
        popAt(tk, t, 0.55, 0.24, 0.7, 0);
        hv.textContent = fmt(800e6 * Math.pow(outCubic(prog(t, 0.6, 1.9)), 1.4));
        popAt(toast, t, 2.1, 0.22, 0.9, -30);
        toast.firstChild.style.opacity = (0.5 + 0.5 * Math.abs(Math.sin(t * 5))).toFixed(3);
        L1.forEach((sp, i) => letter(sp, t, INTRO.l1 + i * INTRO.l1step, 34, 10));
        const l2a = INTRO.l1 + L1.length * INTRO.l1step + INTRO.l2gap;
        L2.forEach((sp, i) => letter(sp, t, l2a + i * INTRO.l2step, 90, 22));
        shade.style.opacity = outCubic(prog(t, 0.1, 0.3)).toFixed(3);
      };
    })();

    // ================================================================ counter
    S.counter = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card cnt", root,
        '<div class="cbig">0</div><div class="csub">tokens, every month</div>' +
        '<div class="crow"><span>What you pay</span><b class="old">$200<s></s></b><b class="new">$0.00</b></div>');
      card.style.left = "70px"; card.style.top = "260px";
      const big = card.querySelector(".cbig"), s = card.querySelector(".old s"), nw = card.querySelector(".new"), old = card.querySelector(".old");
      return (t) => {
        const on = inShot(t, "counter");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("counter").a, 0.26));
        big.textContent = fmt(800e6 * outCubic(prog(t, 3.85, 1.1)));
        const k = prog(t, 4.95, 0.12);
        big.style.transform = `scale(${(1 + 0.08 * Math.sin(k * Math.PI)).toFixed(3)})`;
        s.style.transform = `scaleX(${outCubic(prog(t, 5.6, 0.2)).toFixed(3)})`;
        old.style.opacity = (1 - 0.6 * prog(t, 5.8, 0.2)).toFixed(3);
        popAt(nw, t, 5.89, 0.24, 1.8, 0, " rotate(-4deg)");
      };
    })();

    // ================================================================ zeros (full)
    S.zeros = (() => {
      const root = el("div", "abs", ui);
      const tag = el("div", "tag big zeros", root, "800<i>,000,000</i>");
      tag.style.left = "50%"; tag.style.top = "1080px";
      const no = el("div", "tag big", root, `<i class="ic">${ICON.x}</i>no extra zeros`);
      no.style.left = "120px"; no.style.top = "1010px";
      return (t) => {
        const on = inShot(t, "zeros");
        show(root, on);
        if (!on) return;
        popAt(no, t, 7.66, 0.2, 0.5, 0, " rotate(-4deg)");
        show(no, t < 8.85);
        popAt(tag, t, 8.88, 0.22, 1.8, 0, " translateX(-50%) rotate(-3deg)");
        tag.style.transformOrigin = "0 50%";
      };
    })();

    // ================================================================ how (full)
    S.how = (() => {
      const root = el("div", "abs", ui);
      const tag = el("div", "tag big dark", root, `Here's how it works<i class="ic">${ICON.arrow}</i>`);
      tag.style.left = "210px"; tag.style.top = "1080px";
      return (t) => {
        const on = inShot(t, "how");
        show(root, on);
        if (!on) return;
        popAt(tag, t, 9.95, 0.22, 0.5, 0, " rotate(-3deg)");
      };
    })();

    // ================================================================ free tiers
    S.tiers = (() => {
      const root = el("div", "abs", ui);
      const items = [["openai", "OpenAI", 13.54], ["gemini", "Google", 14.22], ["meta", "Meta · Llama", 14.92], ["mistral", "Mistral", 15.66]];
      const card = el("div", "card tiers", root,
        items.map(([n, name]) => `<div class="tile"><div class="lg">${logo(n)}</div><div class="nm">${name}</div><div class="ft">FREE TIER</div></div>`).join("") +
        '<div class="allof">…and all the others too</div>');
      card.style.left = "60px"; card.style.top = "250px";
      const tiles = [...card.querySelectorAll(".tile")], allof = card.querySelector(".allof");
      return (t) => {
        const on = inShot(t, "tiers");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("tiers").a, 0.26));
        tiles.forEach((e, i) => {
          const a = items[i][2];
          // before its name is said, a tile waits greyed
          e.classList.toggle("on", t >= a);
          const p = popIn(t, a, 0.24, 0.8, 0);
          e.style.transform = t >= a ? `scale(${p.s.toFixed(4)})` : "scale(0.94)";
          e.querySelector(".ft").style.opacity = prog(t, a + 0.12, 0.15).toFixed(3);
        });
        popAt(allof, t, 16.3, 0.22, 0.7, 0);
      };
    })();

    // ================================================================ stack
    S.stack = (() => {
      const root = el("div", "abs", ui);
      const ns = ["openai", "gemini", "meta", "mistral"];
      const card = el("div", "card stack", root,
        ns.map((n) => `<div class="srow2"><div class="lg sm">${logo(n)}</div><div class="meter"><i></i></div><span class="lim">limit</span></div>`).join("") +
        '<div class="combo"><div class="meter big"><i></i><b></b><b></b><b></b></div><div class="clbl"><span>Stacked</span><strong>800M / month</strong></div></div>');
      card.style.left = "70px"; card.style.top = "250px";
      const rows = [...card.querySelectorAll(".srow2")], fills = rows.map((r) => r.querySelector(".meter i"));
      const combo = card.querySelector(".combo"), cfill = combo.querySelector(".meter i"), segs = [...combo.querySelectorAll(".meter b")];
      return (t) => {
        const on = inShot(t, "stack");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("stack").a, 0.26));
        // each free tier fills its small limit fast
        fills.forEach((f, i) => { f.style.transform = `scaleX(${(0.22 * outCubic(prog(t, 17.1 + i * 0.12, 0.35))).toFixed(3)})`; });
        rows.forEach((r, i) => r.querySelector(".lim").style.opacity = prog(t, 17.5 + i * 0.08, 0.15).toFixed(3));
        // "stacks them all together": the four chunks fly into one big bar
        const k = inOut(prog(t, 18.9, 0.6));
        rows.forEach((r, i) => { r.style.opacity = (1 - 0.65 * k).toFixed(3); });
        vis(combo, t >= 18.85);
        applyPop(combo, popIn(t, 18.85, 0.24, 0.9, 30));
        cfill.style.transform = `scaleX(${inOut(prog(t, 19.0, 0.9)).toFixed(3)})`;
        segs.forEach((b, i) => { b.style.opacity = t >= 19.0 + 0.22 * (i + 1) ? 1 : 0; });
      };
    })();

    // ================================================================ routing
    S.route = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card route", root);
      card.style.left = "60px"; card.style.top = "250px";
      const CW = 960, CH = 610;
      const svg = el("div", "rsvg", card, `<svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"></svg>`).firstChild;
      const req = el("div", "rq", card, "Your request");
      const hub = el("div", "hub", card, `<i>${ICON.code}</i><span>the repo</span>`);
      const ns = ["openai", "gemini", "meta", "mistral"];
      const X = [150, 370, 590, 810], Y = 470;
      const nodes = ns.map((n, i) => {
        const e = el("div", "node", card, `<div class="lg">${logo(n)}</div><div class="nm2"></div><div class="bad">LIMIT</div>`);
        e.style.left = X[i] - 66 + "px"; e.style.top = Y - 66 + "px";
        return e;
      });
      const NSV = "http://www.w3.org/2000/svg";
      const ln = (x1, y1, x2, y2) => { const l = document.createElementNS(NSV, "path"); l.setAttribute("d", `M${x1} ${y1} C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`); svg.appendChild(l); return l; };
      const HX = 480, HY = 250;
      ln(HX, 110, HX, HY - 60).setAttribute("class", "wire");
      const wires = X.map((x) => { const l = ln(HX, HY + 60, x, Y - 70); l.setAttribute("class", "wire"); return l; });
      const dot = el("div", "packet", card);
      const okBox = el("div", "nowall", card, `<i class="ic">${ICON.check}</i>No wall. Ever.`);
      // which model the request lands on over time
      const ACTIVE = [[21.6, 0], [24.82, 1], [26.40, 2]];
      const LIMIT = [22.81, 26.05];
      function along(path, u) { const L = path.getTotalLength(); const p = path.getPointAtLength(L * u); return [p.x, p.y]; }
      return (t) => {
        const on = inShot(t, "route");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("route").a, 0.26));
        popAt(req, t, 20.38, 0.2, 0.7, 0);
        popAt(hub, t, 20.5, 0.22, 0.6, 0);
        nodes.forEach((n, i) => popAt(n, t, 20.6 + i * 0.07, 0.22, 0.6, 0));
        let act = -1;
        ACTIVE.forEach(([a, i]) => { if (t >= a) act = i; });
        nodes.forEach((n, i) => {
          const lim = i < LIMIT.length && t >= LIMIT[i];
          n.classList.toggle("lim", lim);
          n.classList.toggle("act", i === act && !lim);
          n.querySelector(".bad").style.transform = lim ? `scale(${outBack(prog(t, LIMIT[i], 0.2)).toFixed(3)})` : "scale(0)";
        });
        wires.forEach((w, i) => w.setAttribute("class", "wire" + (i === act ? " hot" : "") + (i < LIMIT.length && t >= LIMIT[i] ? " dead" : "")));
        // the packet: request -> repo, then repo -> the active model each time it switches
        let px = -100, py = -100, po = 0;
        const legs = [[20.38, 0.45, [[HX, 110], [HX, HY - 60]]]];
        ACTIVE.forEach(([a, i]) => legs.push([a - 0.32, 0.36, wires[i]]));
        legs.forEach(([a, d, path]) => {
          const u = prog(t, a, d);
          if (t >= a && t <= a + d + 0.05) {
            po = 1;
            if (Array.isArray(path)) { px = lerp(path[0][0], path[1][0], inOut(u)); py = lerp(path[0][1], path[1][1], inOut(u)); }
            else [px, py] = along(path, inOut(u));
          }
        });
        dot.style.opacity = po;
        dot.style.transform = `translate(${(px - 16).toFixed(1)}px, ${(py - 16).toFixed(1)}px)`;
        popAt(okBox, t, 27.14, 0.24, 0.6, 0, " rotate(-2deg)");
      };
    })();

    // ================================================================ number (full)
    S.number = (() => {
      const root = el("div", "abs", ui);
      const tag = el("div", "tag big", root, "800,000,000");
      tag.style.left = "270px"; tag.style.top = "1060px";
      return (t) => {
        const on = inShot(t, "number");
        show(root, on);
        if (!on) return;
        popAt(tag, t, 28.46, 0.22, 1.7, 0, " rotate(-3deg)");
      };
    })();

    // ================================================================ tokens -> words
    S.words = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card words", root,
        '<div class="eq2"><div class="pill">800M <small>tokens</small></div><div class="approx">≈</div><div class="pill dark"><span class="wv">0</span>M <small>words</small></div></div>' +
        `<div class="life"><div class="lh"><i class="ic">${ICON.pen}</i><span>2,000 words a day for 80 years</span><b>≈ 58M</b></div>` +
        '<div class="lbar"><i class="used"></i><i class="left"></i></div><div class="lfoot"><span>your whole life</span><span class="rem">still 90% left</span></div></div>');
      card.style.left = "70px"; card.style.top = "250px";
      const wv = card.querySelector(".wv"), life = card.querySelector(".life"), used = card.querySelector(".used"), rem = card.querySelector(".rem");
      return (t) => {
        const on = inShot(t, "words");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("words").a, 0.26));
        wv.textContent = String(Math.round(600 * outCubic(prog(t, 30.6, 0.9))));
        popAt(life, t, 32.29, 0.26, 0.9, 40);
        used.style.transform = `scaleX(${(0.097 * outCubic(prog(t, 32.6, 2.0))).toFixed(4)})`;
        popAt(rem, t, 34.73, 0.22, 1.5, 0);
      };
    })();

    // ================================================================ bills (inset)
    S.bills = (() => {
      const root = el("div", "abs", ui);
      const mkBill = (amt, cls) => el("div", "card bill " + cls, root,
        `<div class="bt2">AI subscription</div><div class="ba">${amt}<small>/month</small></div><div class="bl"><span>Access to</span><b>1 model</b></div><div class="perf"></div>`);
      const b1 = mkBill("$200", "b1"), b2 = mkBill("$300", "b2");
      const one = el("div", "tag big onem", root, `<i class="ic">${ICON.lock}</i>just ONE model`);
      return (t) => {
        const on = inShot(t, "bills");
        show(root, on);
        if (!on) return;
        popAt(b1, t, 37.4, 0.26, 0.8, 60, " rotate(-5deg)");
        popAt(b2, t, 38.4, 0.26, 0.8, 60, " rotate(4deg)");
        // before the numbers are said, the first bill sits there blank-ish
        vis(b1, t >= shot("bills").a + 0.05);
        if (t < 37.4) applyPop(b1, popIn(t, shot("bills").a, 0.26, 0.85, 40), " rotate(-5deg)");
        b1.querySelector(".ba").style.opacity = t >= 37.45 ? 1 : 0.12;
        popAt(one, t, 40.44, 0.22, 0.5, 0, " rotate(-3deg)");
      };
    })();

    // ================================================================ github
    S.github = (() => {
      const root = el("div", "abs", ui);
      const card = el("div", "card media", root, '<div class="bar"><i></i><i></i><i></i><b></b></div><div class="slot img"><img src="assets/img/stars.png" alt=""></div>');
      card.style.left = "70px"; card.style.top = "250px"; card.style.width = "940px";
      const img = card.querySelector("img");
      const trend = el("div", "tag big trend", root, `<i class="ic">${ICON.up}</i>Trending on GitHub`);
      return (t) => {
        const on = inShot(t, "github");
        show(root, on);
        if (!on) return;
        applyPop(card, popIn(t, shot("github").a, 0.26));
        img.style.transform = `scale(${(1.02 + 0.05 * prog(t, 41.5, 2.1)).toFixed(4)})`;
        popAt(trend, t, 42.12, 0.22, 0.5, 0, " rotate(-3deg)");
      };
    })();

    // ================================================================ silent (full)
    S.silent = (() => {
      const root = el("div", "abs", ui);
      const row = el("div", "lrow", root, ["openai", "gemini", "meta", "mistral"].map((n) => `<div class="lg">${logo(n)}</div>`).join(""));
      const tag = el("div", "tag big dark", root, "No comment… yet.");
      tag.style.left = "250px"; tag.style.top = "1140px";
      const lgs = [...row.children];
      return (t) => {
        const on = inShot(t, "silent");
        show(root, on);
        if (!on) return;
        lgs.forEach((l, i) => {
          popAt(l, t, 44.32 + i * 0.06, 0.22, 0.5, 0);
          l.style.filter = `grayscale(${prog(t, 44.86, 0.4).toFixed(3)})`;
        });
        popAt(tag, t, 45.98, 0.22, 1.6, 0, " rotate(-3deg)");
      };
    })();

    // ================================================================ captions
    const toks = [];
    WORDS.forEach((w) => {
      if (/^[-.]/.test(w.w) && toks.length) { const p = toks[toks.length - 1]; p.w += w.w; p.e = w.e; } else toks.push({ ...w });
    });
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
    const clean = (s) => s.replace(/[.,!]+$/, "");
    const NO_CAPS = ["hook"];
    function renderCaption(t, sh) {
      const gr = groups.find((x) => t >= x.a && t < x.b);
      if (!gr || NO_CAPS.includes(sh.id)) { pill.style.display = "none"; return; }
      pill.style.display = "";
      const key = String(groups.indexOf(gr));
      if (pill.dataset.k !== key) { pill.dataset.k = key; pill.innerHTML = gr.words.map((w) => `<span>${clean(w.w)}</span>`).join(" "); }
      [...pill.children].forEach((s, i) => s.classList.toggle("on", t >= gr.words[i].s - 0.03));
      const p = popIn(t, gr.a, 0.14, 0.88, 0);
      pill.style.top = { full: 1450, split: 1640, inset: 1095 }[sh.L] + "px";
      pill.style.opacity = p.o.toFixed(3);
      pill.style.transform = `translateX(-50%) scale(${p.s.toFixed(4)})`;
    }

    // ================================================================ frame
    function render(f) {
      const t = Math.min(f / FPS, DUR - 1e-4);
      const sh = currentShot(t), Lk = sh.L, local = t - sh.a;

      L.bg.style.display = Lk === "full" ? "none" : "";
      insetFrame.style.display = Lk === "inset" ? "" : "none";
      let tf = "", clip = "none", blur = 0;
      if (sh.id === "hook") {
        // tight punch on frame 0, whipping out to the take sitting under the hero panel
        const k = outQuint(prog(t, 0.04, 0.42));
        const fx = W / 2, fy = FACE[1] * COVER;
        const zp = 1.35;
        // start: cover-framed, zoomed on the face; end: 1.13x at y 700, face centred
        const s0 = COVER * zp, x0 = fx - FACE[0] * s0, y0 = fy - FACE[1] * s0;
        const s1 = 1.24 * (1 + 0.03 * prog(t, 0.5, 3.3)), x1 = W / 2 - FACE[0] * s1, y1 = 600;
        const s = lerp(s0, s1, k), x = lerp(x0, x1, k), y = lerp(y0, y1, k);
        tf = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
        blur = k < 0.98 ? 7 * Math.sin(k * Math.PI) : 0;
      } else if (Lk === "full") {
        const z = (P.zoom[sh.id] ? stepKeys(P.zoom[sh.id], t) : 1.06) * (1 + 0.025 * local / (sh.b - sh.a));
        let sx = 0, sy = 0;
        (P.zoom[sh.id] || []).forEach(([kt, kz]) => { const d = t - kt; if (d >= 0 && d < 0.22 && kz >= 1.2) { const a = 9 * (1 - d / 0.22); sx += a * Math.sin(d * 90); sy += a * Math.cos(d * 70); } });
        const s = COVER * z, fx = W / 2, fy = FACE[1] * COVER;
        tf = `translate(${(fx - FACE[0] * s + sx).toFixed(1)}px, ${(fy - FACE[1] * s + sy).toFixed(1)}px) scale(${s.toFixed(4)})`;
      } else if (Lk === "split") {
        const s = 1.0 + 0.03 * local / (sh.b - sh.a);
        tf = `translate(${(W / 2 - FACE[0] * s).toFixed(1)}px, ${(1160 - FACE[1] * s).toFixed(1)}px) scale(${s.toFixed(4)})`;
        clip = `path("${wavePath(t)}")`;
      } else if (Lk === "inset") {
        const s = 0.5, bx = 375, by = 1180, bw = 330, bh = 420;
        tf = `translate(${(bx + bw / 2 - FACE[0] * s).toFixed(1)}px, ${(by + bh * 0.42 - FACE[1] * s).toFixed(1)}px) scale(${s})`;
        clip = `inset(${by}px ${W - bx - bw}px ${H - by - bh}px ${bx}px round 34px)`;
        const p = popIn(t, sh.a, 0.24, 0.8, 30);
        insetFrame.style.opacity = p.o;
        insetFrame.style.transform = `translateY(${p.y}px)`;
      }
      cam.style.transformOrigin = "0 0";
      cam.style.transform = tf;
      aroll.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";
      camShell.style.clipPath = clip;
      camShell.style.filter = Lk === "split" ? "drop-shadow(0 -10px 24px rgba(120,64,24,0.28))" : "none";

      const labs = LABELS[sh.id];
      show(label, !!labs);
      if (labs) {
        let cur = labs[0];
        labs.forEach((l) => { if (t >= l[0]) cur = l; });
        const eb = label.firstChild, tt = label.lastChild;
        if (eb.textContent !== cur[1]) eb.textContent = cur[1];
        if (tt.textContent !== cur[2]) tt.textContent = cur[2];
        const p = popIn(t, cur[0], 0.22, 0.8, -20);
        label.style.opacity = p.o.toFixed(3);
        label.style.transform = `translateX(-50%) translateY(${p.y.toFixed(1)}px) scale(${p.s.toFixed(4)})`;
      }

      Object.values(S).forEach((fn) => fn(t));
      renderCaption(t, sh);

      // light burn out of the intro, warm flashes on the big transitions
      const burnK = sh.id === "hook" ? prog(t, INTRO.burn, shot("hook").b - INTRO.burn) : 0;
      L.burn.style.opacity = (burnK * burnK).toFixed(3);
      ui.style.filter = burnK > 0.01 ? `brightness(${(1 + 1.4 * burnK * burnK).toFixed(3)})` : "none";
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
