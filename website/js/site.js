/* Launch Studio — page interactions */
(function () {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- config (edit here) ---------- */
  const VIDEOS = {
    'reel':        { src: 'assets/video/reel.mp4',        title: 'Launch Studio — Reel 2026' },
    'dig-ai':      { src: 'assets/video/dig-ai.mp4',      title: 'DIG AI — Product launch' },
    'latentgraph': { src: 'assets/video/latentgraph.mp4', title: 'LatentGraph — Launch film' },
    'island':      { src: 'assets/video/island.mp4',      title: 'Island — Feature campaign' },
  };
  const PREVIEWS = {
    'reel':        { src: 'assets/video/reel-loop.mp4',           poster: 'assets/img/reel-poster.jpg',        cap: 'Customer stories / brand' },
    'dig-ai':      { src: 'assets/video/dig-ai-preview.mp4',      poster: 'assets/img/dig-ai-poster.jpg',      cap: 'DIG AI / launch' },
    'latentgraph': { src: 'assets/video/latentgraph-preview.mp4', poster: 'assets/img/latentgraph-poster.jpg', cap: 'LatentGraph / explain' },
    'island':      { src: 'assets/video/island-preview.mp4',      poster: 'assets/img/island-poster.jpg',      cap: 'Island / convert' },
  };
  const PRICES = {
    type:  { feature: 1500, launch: 2500, social: 750, brand: 3500 },
    level: { standard: 0, premium: 750, cinematic: 1500 },
    speed: { normal: 0, fast: 500, rush: 1000 },
  };

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const inks = $$('.band-ink');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    nav.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !menuOpen());
    if (y < lastY - 4 || y < 400) nav.classList.remove('is-hidden');
    lastY = y;
    nav.classList.toggle('on-ink', inks.some(el => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom >= 40; }));
  }, { passive: true });

  const menuBtn = $('#menu-btn'), menu = $('#mobile-menu');
  const menuOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen()));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen()) setMenu(false); });

  /* ---------- reveal (only things below the fold start hidden) ---------- */
  const revealTargets = $$('.sec-head, .project, .offer, .includes, .estimator, .about > *, .faq-list details, .work-foot, .play-head, .contact-inner > *');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.remove('is-pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el, i) => {
      el.classList.add('rv');
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add('is-pre');
        el.style.transitionDelay = (i % 4) * 70 + 'ms';
        io.observe(el);
      }
    });
  }

  /* ---------- statement: words sharpen as you scroll ---------- */
  const st = $('#statement');
  if (st) {
    const wrapWords = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    };
    wrapWords(st);
    const words = $$('.w', st);
    if (!reduce) {
      const upd = () => {
        const r = st.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
        const lit = p * words.length * 1.15;
        words.forEach((w, i) => {
          const k = Math.min(1, Math.max(0, lit - i));
          w.style.setProperty('--o', (0.16 + k * 0.84).toFixed(3));
          w.style.setProperty('--b', ((1 - k) * 3).toFixed(2) + 'px');
        });
      };
      addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    }
  }

  /* ---------- work: lazy hover previews ---------- */
  $$('.project').forEach(card => {
    const v = $('video', card);
    const load = () => { if (!v.src) { v.src = v.dataset.src; } };
    if (fine) {
      card.addEventListener('mouseenter', () => { load(); v.play().catch(() => {}); });
      card.addEventListener('mouseleave', () => { v.pause(); });
    }
  });
  if (!fine && 'IntersectionObserver' in window && !reduce) {
    const vio = new IntersectionObserver(es => es.forEach(en => {
      const v = $('video', en.target);
      if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.6 });
    $$('.project').forEach(c => vio.observe(c));
  }

  /* ---------- player ---------- */
  const dlg = $('#player'), pv = $('#player-video'), pt = $('#player-title');
  function openPlayer(key) {
    const v = VIDEOS[key]; if (!v) return;
    pt.textContent = v.title;
    pv.src = v.src;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    pv.play().catch(() => {});
  }
  function closePlayer() { pv.pause(); pv.removeAttribute('src'); pv.load(); if (dlg.open) dlg.close(); }
  $$('[data-play]').forEach(el => {
    el.addEventListener('click', () => openPlayer(el.dataset.play));
    if (el.getAttribute('role') === 'button') el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(el.dataset.play); } });
  });
  $('#player-close').addEventListener('click', closePlayer);
  dlg.addEventListener('close', () => { pv.pause(); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closePlayer(); });

  /* ---------- services: auto-cycling list ---------- */
  const svcWrap = $('.svc'), svcItems = $$('.svc-item'), svcVideo = $('#svc-video'), svcStage = $('.svc-stage'), svcCap = $('#svc-caption');
  let svcIdx = 0, svcTimer = null;
  const SVC_MS = 6000;
  function setSvc(i, user) {
    svcIdx = (i + svcItems.length) % svcItems.length;
    svcItems.forEach((it, k) => {
      const on = k === svcIdx;
      it.classList.toggle('is-active', on);
      $('.svc-btn', it).setAttribute('aria-expanded', String(on));
      const bar = $('.svc-bar i', it); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    const m = PREVIEWS[svcItems[svcIdx].dataset.media];
    svcStage.classList.add('is-swapping');
    setTimeout(() => {
      svcVideo.poster = m.poster; svcVideo.src = m.src; svcCap.textContent = m.cap;
      svcVideo.play().catch(() => {});
      svcStage.classList.remove('is-swapping');
    }, 220);
    schedule(user);
  }
  function schedule(user) {
    clearTimeout(svcTimer);
    if (reduce) return;
    svcTimer = setTimeout(() => { if (svcVisible && !svcWrap.classList.contains('is-paused')) setSvc(svcIdx + 1); else schedule(); }, user ? SVC_MS * 1.5 : SVC_MS);
    svcWrap.style.setProperty('--dur', (user ? SVC_MS * 1.5 : SVC_MS) + 'ms');
  }
  let svcVisible = false;
  new IntersectionObserver(([e]) => {
    svcVisible = e.isIntersecting;
    if (svcVisible) { svcVideo.play().catch(() => {}); } else svcVideo.pause();
  }, { threshold: 0.3 }).observe(svcWrap);
  svcItems.forEach((it, k) => $('.svc-btn', it).addEventListener('click', () => setSvc(k, true)));
  svcWrap.addEventListener('mouseenter', () => svcWrap.classList.add('is-paused'));
  svcWrap.addEventListener('mouseleave', () => svcWrap.classList.remove('is-paused'));
  if (reduce) svcItems.forEach(it => $('.svc-bar', it).hidden = true);
  schedule();

  /* ---------- process: rocket travels the timeline ---------- */
  const track = $('#track'), steps = $$('.step');
  const updTrack = () => {
    const r = track.getBoundingClientRect();
    const p = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height * 0.9)));
    track.style.setProperty('--p', p.toFixed(4));
    steps.forEach((s, i) => s.classList.toggle('is-lit', p >= i / steps.length + 0.02 || reduce));
  };
  addEventListener('scroll', updTrack, { passive: true }); addEventListener('resize', updTrack); updTrack();

  /* ---------- estimator ---------- */
  const state = { type: 'launch', level: 'standard', speed: 'normal' };
  const out = $('#est-value'), brk = $('#est-break');
  const fmt = n => '$' + n.toLocaleString('en-US');
  function updEst() {
    const b = PRICES.type[state.type], l = PRICES.level[state.level], s = PRICES.speed[state.speed];
    const total = b + l + s;
    out.classList.add('is-changing');
    setTimeout(() => {
      out.textContent = `${fmt(total)} – ${fmt(Math.round(total * 1.5))}`;
      brk.innerHTML = `<div><dt>Base</dt><dd>${fmt(b)}</dd></div><div><dt>Production</dt><dd>+${fmt(l)}</dd></div><div><dt>Speed</dt><dd>+${fmt(s)}</dd></div>`;
      out.classList.remove('is-changing');
    }, 140);
  }
  function pick(group, value) {
    state[group] = value;
    $$(`.seg[data-group="${group}"] button`).forEach(b => {
      const on = b.dataset.value === value;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
    });
    updEst();
  }
  $$('.seg').forEach(g => $$('button', g).forEach(b => b.addEventListener('click', () => pick(g.dataset.group, b.dataset.value))));
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => {
    pick('type', b.dataset.pick);
    $('#estimate').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }));
  Object.keys(state).forEach(k => pick(k, state[k]));

  /* ---------- contact: "Launch" stretches as you arrive ---------- */
  const arcText = $('#arc-text'), arcWrap = $('.arc-wrap');
  if (arcText) {
    let lastN = -1;
    const updArc = () => {
      const r = arcWrap.getBoundingClientRect();
      const p = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9)));
      const n = 1 + Math.round(p * 6);
      if (n !== lastN) { arcText.textContent = 'L' + 'a'.repeat(n) + 'unch.'; lastN = n; }
    };
    addEventListener('scroll', updArc, { passive: true }); updArc();
  }

  /* ---------- copy email ---------- */
  const copyBtn = $('#copy-email');
  copyBtn.addEventListener('click', () => {
    const email = 'hello@thelaunchstudio.org';
    const done = ok => { copyBtn.textContent = ok ? 'Copied' : 'Select & copy'; setTimeout(() => copyBtn.textContent = 'Copy email', 1800); };
    try {
      navigator.clipboard.writeText(email).then(() => done(true), () => { selectEmail(); done(false); });
    } catch (e) { selectEmail(); done(false); }
  });
  function selectEmail() { const r = document.createRange(); r.selectNodeContents($('.email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  /* ---------- physics pit ---------- */
  const pit = $('#pit');
  if (pit && window.Matter && !reduce) {
    let started = false;
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting && !started) { started = true; obs.disconnect(); startPit(); } }, { threshold: 0.25 }).observe(pit);
  }

  function startPit() {
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Runner } = Matter;
    const chips = $$('.chip', pit);
    // measure natural sizes before going absolute
    const sizes = chips.map(c => { const r = c.getBoundingClientRect(); return { w: r.width, h: r.height }; });
    pit.classList.add('is-live');

    const engine = Engine.create({ gravity: { y: 1.1 } });
    const world = engine.world;
    let W = pit.clientWidth, H = pit.clientHeight;
    const T = 200;
    let walls = [];
    function buildWalls() {
      Composite.remove(world, walls);
      walls = [
        Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
        Bodies.rectangle(-T / 2, H / 2 - 400, T, H * 3, { isStatic: true }),
        Bodies.rectangle(W + T / 2, H / 2 - 400, T, H * 3, { isStatic: true }),
      ];
      Composite.add(world, walls);
    }
    buildWalls();

    const bodies = chips.map((c, i) => {
      const { w, h } = sizes[i];
      const isDisc = c.classList.contains('chip-disc');
      const x = 60 + Math.random() * Math.max(10, W - 120);
      const y = -120 - i * 70;
      const opts = { restitution: 0.35, friction: 0.4, frictionAir: 0.012, density: 0.0018, angle: (Math.random() - 0.5) * 0.8 };
      const b = isDisc ? Bodies.circle(x, y, w / 2, opts)
        : Bodies.rectangle(x, y, w, h, { ...opts, chamfer: { radius: c.classList.contains('chip-square') ? 20 : Math.min(h / 2 - 0.5, 999) } });
      b.plugin = { el: c, w, h };
      return b;
    });
    // drop in a stagger
    bodies.forEach((b, i) => setTimeout(() => Composite.add(world, b), i * 90));

    if (fine) {
      const mouse = Mouse.create(pit);
      mouse.pixelRatio = 1;
      // keep page scroll working
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } } });
      Composite.add(world, mc);
      // give a nudge when the cursor brushes a resting chip
      let lastHit = 0;
      Events.on(engine, 'beforeUpdate', () => {
        if (mc.body || performance.now() - lastHit < 120) return;
        const p = mouse.position;
        for (const b of bodies) {
          if (Matter.Bounds.contains(b.bounds, p) && Matter.Vertices.contains(b.vertices, p) && b.speed < 0.6) {
            Body.applyForce(b, p, { x: (Math.random() - 0.5) * 0.02 * b.mass, y: -0.035 * b.mass });
            lastHit = performance.now(); break;
          }
        }
      });
    } else {
      // touch: tap a chip to toss it, scroll still works everywhere
      pit.addEventListener('click', e => {
        const r = pit.getBoundingClientRect();
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        const hit = bodies.find(b => Matter.Vertices.contains(b.vertices, p));
        (hit ? [hit] : bodies).forEach(b => Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.03 * b.mass, y: -0.06 * b.mass }));
      });
    }

    const runner = Runner.create();
    let running = true;
    Runner.run(runner, engine);

    function render() {
      for (const b of bodies) {
        const { el, w, h } = b.plugin;
        el.style.transform = `translate(${(b.position.x - w / 2).toFixed(1)}px, ${(b.position.y - h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(4)}rad)`;
        // rescue anything that escaped
        if (b.position.y > H + 300 || b.position.x < -300 || b.position.x > W + 300) {
          Body.setPosition(b, { x: W / 2, y: -100 }); Body.setVelocity(b, { x: 0, y: 0 });
        }
      }
      if (running) requestAnimationFrame(render);
    }
    render();

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; Runner.run(runner, engine); render(); }
      else if (!e.isIntersecting && running) { running = false; Runner.stop(runner); }
    }).observe(pit);

    new ResizeObserver(() => {
      const nw = pit.clientWidth, nh = pit.clientHeight;
      if (Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return;
      W = nw; H = nh; buildWalls();
      bodies.forEach(b => { if (b.position.x > W - 20) Body.setPosition(b, { x: W - 60, y: b.position.y - 50 }); });
    }).observe(pit);
  }
})();
