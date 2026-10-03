/* LUNARO launch film: drawn product "photography" (SVG) + shared motion helpers.
   Every scene is a full 1920x1080 SVG so it can be cloned into glitch slices. */
(function () {
  const W = 1920;
  const H = 1080;

  // Deterministic PRNG so every render (and every worker) draws the same frame.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let uid = 0;
  const nextId = () => "s" + (uid++).toString(36) + "_";

  // ------------------------------------------------------------- backdrops
  function studio(p, tone) {
    const white = tone === "white";
    const top = white ? "#f1f1f0" : "#dcdedd";
    const mid = white ? "#f4f4f3" : "#e8e9e7";
    const floor = white ? "#f7f7f6" : "#f1f1ef";
    const r = rng(11);
    let folds = "";
    for (let i = 0; i < 11; i++) {
      const x = i * 185 + r() * 80 - 40;
      const w = 70 + r() * 120;
      const lightFold = i % 2 === 0;
      folds += `<rect x="${x.toFixed(0)}" y="-40" width="${w.toFixed(0)}" height="${(700 + r() * 120).toFixed(0)}" fill="${lightFold ? "#ffffff" : "#c9cbc9"}" opacity="${(lightFold ? 0.5 : 0.35).toFixed(2)}" />`;
    }
    return `
      <defs>
        <linearGradient id="${p}wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${top}" />
          <stop offset="0.62" stop-color="${mid}" />
          <stop offset="0.74" stop-color="${floor}" />
          <stop offset="1" stop-color="${floor}" />
        </linearGradient>
        <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26" /></filter>
        <filter id="${p}sh" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="16" /></filter>
        <filter id="${p}glowf" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="40" /></filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#${p}wall)" />
      <g filter="url(#${p}soft)" opacity="${white ? 0.35 : 0.8}">${folds}</g>
      <rect x="-100" y="770" width="2120" height="60" fill="${floor}" filter="url(#${p}soft)" opacity="0.9" />`;
  }

  function room(p) {
    const r = rng(23);
    let dots = "";
    for (let i = 0; i < 260; i++) {
      const x = r() * W;
      const y = 800 + r() * 280;
      const s = 2 + r() * 5;
      const c = ["#6d655e", "#ece6de", "#8c8279", "#d8d0c6", "#4d4640"][Math.floor(r() * 5)];
      dots += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${s.toFixed(1)}" ry="${(s * 0.55).toFixed(1)}" fill="${c}" opacity="0.8" />`;
    }
    return `
      <defs>
        <linearGradient id="${p}wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5f5248" />
          <stop offset="0.45" stop-color="#8d7a6b" />
          <stop offset="1" stop-color="#6c5d52" />
        </linearGradient>
        <radialGradient id="${p}pool" cx="0.5" cy="0.4" r="0.5">
          <stop offset="0" stop-color="#ffcf92" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffcf92" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="${p}floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9c948b" />
          <stop offset="1" stop-color="#b9b1a7" />
        </linearGradient>
        <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26" /></filter>
        <filter id="${p}sh" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="16" /></filter>
        <filter id="${p}glowf" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="40" /></filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#${p}wall)" />
      <rect x="0" y="0" width="260" height="${H}" fill="#3f352f" opacity="0.55" />
      <ellipse cx="960" cy="430" rx="900" ry="520" fill="url(#${p}pool)" />
      <rect y="800" width="${W}" height="280" fill="url(#${p}floor)" />
      <g>${dots}</g>`;
  }

  function shadow(p, cx, cy, rx, op) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.11).toFixed(0)}" fill="#2a2420" opacity="${op}" filter="url(#${p}sh)" />`;
  }

  // ------------------------------------------------------------- products
  // ORB: frosted glass globe on a travertine puck, sitting on an oak pedestal table.
  function orbSet(p, lit) {
    return `
      <defs>
        <linearGradient id="${p}oak" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stop-color="#c4935a" /><stop offset="0.5" stop-color="#ddb17a" /><stop offset="1" stop-color="#b98650" />
        </linearGradient>
        <linearGradient id="${p}ped" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#c7baab" /><stop offset="0.35" stop-color="#ebe2d6" /><stop offset="0.7" stop-color="#ddd2c5" /><stop offset="1" stop-color="#b9ab9b" />
        </linearGradient>
        <linearGradient id="${p}trav" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#c3b097" /><stop offset="0.4" stop-color="#e8dccb" /><stop offset="1" stop-color="#b8a389" />
        </linearGradient>
        <radialGradient id="${p}globe" cx="0.4" cy="0.36" r="0.68">
          <stop offset="0" stop-color="#fffefa" /><stop offset="0.5" stop-color="#fdf3e2" /><stop offset="1" stop-color="#e6cfa9" />
        </radialGradient>
        <radialGradient id="${p}halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffd9a0" stop-opacity="0.75" /><stop offset="1" stop-color="#ffd9a0" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${shadow(p, 960, 1012, 280, 0.28)}
      <rect x="872" y="690" width="176" height="325" fill="url(#${p}ped)" />
      <ellipse cx="960" cy="682" rx="335" ry="66" fill="#a8763f" />
      <ellipse cx="960" cy="662" rx="335" ry="66" fill="url(#${p}oak)" />
      <g fill="none" stroke="#9c6a37" stroke-width="2" opacity="0.25">
        <ellipse cx="930" cy="662" rx="250" ry="44" /><ellipse cx="985" cy="664" rx="180" ry="30" /><ellipse cx="950" cy="660" rx="96" ry="15" />
      </g>
      ${shadow(p, 960, 660, 120, 0.25)}
      <circle class="glow" cx="960" cy="470" r="330" fill="url(#${p}halo)" opacity="${lit ? 1 : 0.35}" />
      <rect x="898" y="606" width="124" height="44" rx="5" fill="url(#${p}trav)" />
      <ellipse cx="960" cy="606" rx="62" ry="11" fill="#efe6d8" />
      <circle cx="960" cy="486" r="122" fill="url(#${p}globe)" />
      <ellipse cx="918" cy="438" rx="34" ry="22" fill="#ffffff" opacity="0.75" transform="rotate(-28 918 438)" />
      <g fill="none" stroke="#1d1d1d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1360 1010 L1372 720 Q1376 690 1410 690 L1560 690 Q1590 690 1590 720 L1598 1010" />
        <path d="M1384 1010 L1392 760 L1576 760 L1580 1010" opacity="0.8" />
        <path d="M1380 860 L1592 860" />
      </g>
      <path d="M1376 858 L1596 858 L1588 880 L1384 880 Z" fill="#2b2b2b" />`;
  }

  // TWIN: a pair of cork column lamps whose slots glow on.
  function twinSet(p) {
    const r = rng(5);
    let specks = "";
    for (let i = 0; i < 220; i++) {
      const left = i % 2 === 0;
      const cx = left ? 880 : 1068;
      const rad = left ? 80 : 76;
      const top = left ? 650 : 690;
      const x = cx - rad + r() * rad * 2;
      const y = top + r() * (960 - top);
      const s = 2 + r() * 5;
      specks += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${s.toFixed(1)}" ry="${(s * 0.7).toFixed(1)}" fill="${r() > 0.5 ? "#6b431d" : "#e2b778"}" opacity="0.55" />`;
    }
    const col = (cx, top, rad) => `
      <rect x="${cx - rad}" y="${top}" width="${rad * 2}" height="${960 - top}" fill="url(#${p}cork)" />
      <ellipse cx="${cx}" cy="960" rx="${rad}" ry="14" fill="#8f5d2c" />
      <ellipse cx="${cx}" cy="${top}" rx="${rad}" ry="15" fill="#c9965a" />
      <rect x="${cx + 10}" y="${top + 46}" width="24" height="${960 - top - 92}" rx="3" fill="#2e1d0f" />
      <rect class="lit" x="${cx + 10}" y="${top + 46}" width="24" height="${960 - top - 92}" rx="3" fill="#ffd79a" opacity="0" />`;
    return `
      <defs>
        <linearGradient id="${p}cork" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7c5026" /><stop offset="0.3" stop-color="#c08a4c" /><stop offset="0.55" stop-color="#d6a465" /><stop offset="1" stop-color="#83552a" />
        </linearGradient>
        <clipPath id="${p}cols"><rect x="800" y="630" width="70" height="340" /><rect x="800" y="630" width="160" height="340" /><rect x="990" y="670" width="155" height="300" /></clipPath>
      </defs>
      ${shadow(p, 975, 968, 230, 0.3)}
      <ellipse class="lit" cx="975" cy="800" rx="260" ry="240" fill="#ffcf8a" opacity="0" filter="url(#${p}glowf)" />
      ${col(880, 650, 80)}
      ${col(1068, 690, 76)}
      <g clip-path="url(#${p}cols)">${specks}</g>`;
  }

  // ARC: angular smoked-oak tripod lamp with a tilted block shade.
  function arcSet(p) {
    return `
      <defs>
        <linearGradient id="${p}leg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#2c211a" /><stop offset="0.5" stop-color="#5a4433" /><stop offset="1" stop-color="#2a1f18" />
        </linearGradient>
        <linearGradient id="${p}face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5b4838" /><stop offset="1" stop-color="#3a2d23" />
        </linearGradient>
      </defs>
      ${shadow(p, 965, 985, 210, 0.32)}
      <ellipse class="lit" cx="965" cy="720" rx="240" ry="160" fill="#ffd08f" opacity="0.5" filter="url(#${p}glowf)" />
      <path d="M948 690 L976 690 L880 975 L852 972 Z" fill="url(#${p}leg)" />
      <path d="M962 690 L988 690 L1078 968 L1050 974 Z" fill="url(#${p}leg)" />
      <path d="M955 690 L975 690 L1000 990 L976 990 Z" fill="#3a2c22" />
      <rect x="930" y="640" width="70" height="60" fill="#33271f" />
      <path d="M872 452 L1060 430 L1074 642 L858 664 Z" fill="url(#${p}face)" />
      <path d="M1060 430 L1112 470 L1124 668 L1074 642 Z" fill="#2a2019" />
      <path d="M872 452 L1060 430 L1112 470 L924 494 Z" fill="#76604c" />
      <path d="M870 664 L1074 642 L1124 668 L920 690 Z" fill="#ffd9a1" class="lit" opacity="0.85" />`;
  }

  // PILLAR: tall paper lantern in a solid-wood frame (wood colour is tweenable via .wood).
  function pillarSet(p, wood) {
    return `
      <defs>
        <linearGradient id="${p}paper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#f3e2c4" /><stop offset="0.5" stop-color="#fdf6ea" /><stop offset="1" stop-color="#efd9b4" />
        </linearGradient>
      </defs>
      ${shadow(p, 975, 985, 200, 0.3)}
      <ellipse cx="975" cy="680" rx="250" ry="330" fill="#ffd9a0" opacity="0.45" filter="url(#${p}glowf)" />
      <path d="M1074 486 L1116 466 L1116 892 L1074 906 Z" fill="#e6c99a" />
      <rect x="872" y="486" width="202" height="420" fill="url(#${p}paper)" />
      <g stroke="#e3cba4" stroke-width="2" opacity="0.7">
        <line x1="872" y1="590" x2="1074" y2="590" /><line x1="872" y1="696" x2="1074" y2="696" /><line x1="872" y1="800" x2="1074" y2="800" />
      </g>
      <g class="wood" fill="${wood}">
        <rect x="856" y="470" width="20" height="450" />
        <rect x="1070" y="470" width="20" height="450" />
        <path d="M1104 456 L1122 448 L1122 900 L1104 908 Z" />
        <path d="M846 456 L1090 456 L1132 440 L888 440 Z" />
        <rect x="846" y="456" width="244" height="22" />
        <path d="M1090 456 L1132 440 L1132 460 L1090 478 Z" />
        <rect x="856" y="906" width="234" height="16" />
      </g>
      <g fill="#9a9c9e"><rect x="860" y="920" width="12" height="62" /><rect x="1074" y="920" width="12" height="66" /><rect x="1108" y="904" width="10" height="60" /></g>`;
  }

  // DUNE: the hero floor lamp, a linen dome over a brass stem and oak base.
  function duneSet(p) {
    return `
      <defs>
        <linearGradient id="${p}linen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#cbbfac" /><stop offset="0.38" stop-color="#eee7db" /><stop offset="0.62" stop-color="#e6ddcf" /><stop offset="1" stop-color="#bfb19c" />
        </linearGradient>
        <radialGradient id="${p}under" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#fff6e0" /><stop offset="1" stop-color="#e9c48a" />
        </radialGradient>
        <linearGradient id="${p}brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8a6a33" /><stop offset="0.5" stop-color="#e2c27a" /><stop offset="1" stop-color="#7a5b29" />
        </linearGradient>
        <linearGradient id="${p}base" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#b98650" /><stop offset="0.5" stop-color="#dcae74" /><stop offset="1" stop-color="#a8753f" />
        </linearGradient>
        <filter id="${p}weave" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.28" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id="${p}dome"><path d="M770 330 C 700 410, 600 520, 598 640 Q 960 712 1322 640 C 1320 520 1220 410 1150 330 Q 960 300 770 330 Z" /></clipPath>
      </defs>
      ${shadow(p, 960, 1000, 300, 0.3)}
      <ellipse cx="960" cy="960" rx="420" ry="90" fill="#ffd79a" opacity="0.5" filter="url(#${p}glowf)" />
      <rect x="951" y="660" width="18" height="300" fill="url(#${p}brass)" />
      <ellipse cx="960" cy="985" rx="178" ry="30" fill="#9b6a37" />
      <rect x="782" y="958" width="356" height="27" fill="url(#${p}base)" />
      <ellipse cx="960" cy="958" rx="178" ry="30" fill="#dcb07a" />
      <ellipse cx="960" cy="646" rx="358" ry="52" fill="url(#${p}under)" />
      <g clip-path="url(#${p}dome)">
        <rect x="560" y="290" width="800" height="440" fill="url(#${p}linen)" />
        <rect x="560" y="290" width="800" height="440" fill="#000" filter="url(#${p}weave)" opacity="0.6" />
        <path d="M960 300 L960 720" stroke="#b9ab96" stroke-width="2" opacity="0.6" />
        <path d="M770 330 C 700 410, 600 520, 598 640" fill="none" stroke="#fff" stroke-width="10" opacity="0.18" />
      </g>
      <ellipse cx="960" cy="330" rx="190" ry="24" fill="#d9cfc0" />
      <path d="M598 640 Q 960 712 1322 640" fill="none" stroke="#b3a48d" stroke-width="5" />`;
  }

  // ------------------------------------------------------------- scene assembly
  const SETS = {
    orb: (p) => studio(p) + orbSet(p, true),
    orbRoom: (p) => room(p) + orbSet(p, true),
    twin: (p) => studio(p) + twinSet(p),
    arc: (p) => studio(p) + arcSet(p),
    pillar: (p) => studio(p) + pillarSet(p, "#4f3322"),
    dune: (p) => studio(p) + duneSet(p),
    twinCard: (p) => studio(p, "white") + twinSet(p),
    arcCard: (p) => studio(p, "white") + arcSet(p),
    pillarCard: (p) => studio(p, "white") + pillarSet(p, "#b07c47"),
    orbCard: (p) => studio(p, "white") + orbSet(p, true),
  };

  function scene(name, viewBox) {
    const p = nextId();
    const vb = viewBox || `0 0 ${W} ${H}`;
    return `<svg class="scene-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${SETS[name](p)}</svg>`;
  }

  // ------------------------------------------------------------- text helpers
  // A line is a centred flex row. Words start collapsed (max-width 0) and grow,
  // so the line re-centres smoothly as each word lands.
  function buildLine(el, words) {
    el.innerHTML = words
      .map((w, i) => `<span class="w"><span class="wi"${i ? "" : ' style="margin-left:0"'}>${w}</span></span>`)
      .join("");
    return Array.from(el.querySelectorAll(".w"));
  }

  function natural(w) {
    const inner = w.firstElementChild;
    return inner.offsetWidth + (parseFloat(getComputedStyle(inner).marginLeft) || 0) + "px";
  }

  // Word pops in below the baseline and snaps up into place.
  function pop(tl, w, t, o) {
    o = o || {};
    const inner = w.firstElementChild;
    tl.fromTo(w, { maxWidth: 0 }, { maxWidth: () => natural(w), duration: o.grow || 0.22, ease: "power3.out", immediateRender: false }, t);
    tl.fromTo(
      inner,
      { opacity: 0, y: o.dy == null ? "0.38em" : o.dy, x: o.dx || 0, scale: o.s || 0.92 },
      { opacity: 1, duration: 0.05, ease: "none", immediateRender: true },
      t
    );
    tl.to(inner, { y: 0, x: 0, scale: 1, duration: o.settle || 0.2, ease: o.ease || "back.out(2.2)" }, t + (o.hold || 0.06));
  }

  // Typewriter: characters appear one by one and the centred line grows.
  function buildTyped(el, text) {
    el.innerHTML = Array.from(text)
      .map((c) => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`)
      .join("");
    return Array.from(el.querySelectorAll(".ch"));
  }
  function type(tl, chars, t, cps, jitter) {
    const r = rng(chars.length * 97 + Math.round(t * 10));
    let at = t;
    chars.forEach((c) => {
      tl.set(c, { display: "inline" }, at);
      at += (1 / cps) * (jitter ? 0.6 + r() * 0.8 : 1);
    });
    return at;
  }

  // ------------------------------------------------------------- glitch slices
  // Cuts `html` into horizontal bands (plus a few loose blocks) that snap into
  // place from random sideways offsets, the blocky "data-mosh" cut.
  function slices(tl, host, html, t, opts) {
    opts = opts || {};
    const r = rng(opts.seed || 1);
    const n = opts.bands || 7;
    const els = [];
    const cuts = [0];
    for (let i = 1; i < n; i++) cuts.push((i / n) * 100 + (r() - 0.5) * (60 / n));
    cuts.push(100);
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "slice";
      d.style.clipPath = `inset(${cuts[i].toFixed(2)}% 0 ${(100 - cuts[i + 1]).toFixed(2)}% 0)`;
      d.innerHTML = typeof html === "function" ? html() : html;
      host.appendChild(d);
      const x = (r() > 0.5 ? 1 : -1) * (80 + r() * (opts.spread || 260));
      const at = t + r() * 0.1;
      tl.set(d, { visibility: "visible", x }, at);
      tl.set(d, { x: x * 0.35 }, at + 0.05 + r() * 0.04);
      tl.set(d, { x: 0 }, t + 0.16 + r() * 0.04);
      tl.set(d, { visibility: "hidden" }, t + (opts.hold || 0.26));
      els.push(d);
    }
    for (let i = 0; i < (opts.blocks || 5); i++) {
      const d = document.createElement("div");
      d.className = "slice";
      const bx = 25 + r() * 50;
      const by = 20 + r() * 60;
      const bw = 5 + r() * 9;
      const bh = 6 + r() * 12;
      d.style.clipPath = `inset(${by.toFixed(1)}% ${(100 - bx - bw).toFixed(1)}% ${(100 - by - bh).toFixed(1)}% ${bx.toFixed(1)}%)`;
      d.innerHTML = typeof html === "function" ? html() : html;
      host.appendChild(d);
      const at = t - 0.05 + r() * 0.12;
      tl.set(d, { visibility: "visible", x: (r() - 0.5) * 220, y: (r() - 0.5) * 120 }, at);
      tl.set(d, { visibility: "hidden" }, at + 0.06 + r() * 0.08);
      els.push(d);
    }
    return els;
  }

  window.LX = { scene, buildLine, pop, buildTyped, type, slices, rng };
})();
