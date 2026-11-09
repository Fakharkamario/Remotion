/* Launch Studio — page interactions */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- content config (edit here) ---------- */
  const FILMS = [
    { key: 'reel',        title: 'Reel 2026',   src: 'assets/video/reel.mp4?v=4' },
    { key: 'dig-ai',      title: 'DIG AI',      src: 'assets/video/dig-ai.mp4?v=4' },
    { key: 'latentgraph', title: 'LatentGraph', src: 'assets/video/latentgraph.mp4?v=4' },
    { key: 'island',      title: 'Island',      src: 'assets/video/island.mp4?v=4' },
  ];
  const PRICES = {
    type:  { social: 750, feature: 1500, launch: 2500, brand: 3500 },
    level: { standard: 0, premium: 750, cinematic: 1500 },
    speed: { normal: 0, fast: 500, rush: 1000 },
  };

  /* ---------- lazy videos: load + play only while on screen ---------- */
  const lazyVideos = $$('video[data-src]');
  const vio = new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      if (!reduce && !v.closest('.scene:not(.is-on)')) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '120px', threshold: .15 });
  lazyVideos.forEach(v => vio.observe(v));

  /* ---------- nav menu ---------- */
  const menuBtn = $('#menu-btn'), menu = $('#menu');
  const setMenu = open => { menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); menu.hidden = !open; };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- now playing → mini player ---------- */
  const np = $('#np'), npTitle = $('#np-title'), mini = $('#mini'), mv = $('#mini-video'), mTitle = $('#mini-title');
  let filmIdx = 0;
  function loadFilm(i, play) {
    filmIdx = (i + FILMS.length) % FILMS.length;
    const f = FILMS[filmIdx];
    npTitle.textContent = mTitle.textContent = f.title;
    if (play) {
      mv.src = f.src; mini.hidden = false;
      // if the browser refuses to start with sound, the native controls stay up so one tap plays it
      mv.play().catch(() => { np.classList.remove('is-playing'); });
    }
  }
  $('#np-play').addEventListener('click', () => {
    if (mini.hidden || !mv.src) loadFilm(filmIdx, true);
    else if (mv.paused) mv.play().catch(() => {}); else mv.pause();
  });
  $('#np-next').addEventListener('click', () => loadFilm(filmIdx + 1, !mini.hidden));
  $('#np-prev').addEventListener('click', () => loadFilm(filmIdx - 1, !mini.hidden));
  mv.addEventListener('play', () => { np.classList.add('is-playing'); $('#np-play').setAttribute('aria-label', 'Pause'); });
  mv.addEventListener('pause', () => { np.classList.remove('is-playing'); $('#np-play').setAttribute('aria-label', 'Play'); });
  mv.addEventListener('ended', () => loadFilm(filmIdx + 1, true));
  $('#mini-expand').addEventListener('click', () => { const f = FILMS[filmIdx], at = mv.currentTime; mv.pause(); openPlayer(f.key, at); });
  $('#mini-close').addEventListener('click', () => { mv.pause(); mini.hidden = true; });

  /* ---------- big player ---------- */
  const dlg = $('#player'), pv = $('#player-video'), pt = $('#player-title');
  function openPlayer(key, at = 0) {
    const f = FILMS.find(x => x.key === key); if (!f) return;
    pt.textContent = f.title; pv.src = f.src;
    pv.addEventListener('loadedmetadata', () => { if (at) pv.currentTime = at; }, { once: true });
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    pv.play().catch(() => {});
  }
  const closePlayer = () => { pv.pause(); if (dlg.open) dlg.close(); };
  $$('[data-play]').forEach(el => el.addEventListener('click', () => openPlayer(el.dataset.play)));
  $('#player-close').addEventListener('click', closePlayer);
  dlg.addEventListener('click', e => { if (e.target === dlg) closePlayer(); });
  dlg.addEventListener('close', () => pv.pause());

  /* ---------- hero: render-progress card ---------- */
  const render = $('.render');
  if (render) {
    const pct = $('.render-pct', render), state = $('.render-state', render);
    let p = reduce ? 100 : 0;
    const tickR = () => {
      p = p >= 100 ? 0 : Math.min(100, p + 1 + Math.random() * 4);
      render.style.setProperty('--p', p + '%');
      const done = p >= 100;
      render.classList.toggle('is-done', done);
      pct.textContent = done ? '✓' : Math.floor(p) + '%';
      state.textContent = done ? 'Ready to launch' : 'Exporting';
      setTimeout(tickR, done ? 2600 : 160);
    };
    reduce ? (render.style.setProperty('--p', '100%'), pct.textContent = '✓', state.textContent = 'Ready to launch', render.classList.add('is-done')) : tickR();
  }

  /* ---------- hero: objects drop when touched ---------- */
  const stage = $('#stage'), hint = $('#hero-hint');
  if (stage && !reduce) {
    const ready = () => window.Matter ? initPhysics() : setTimeout(ready, 60);
    addEventListener('load', ready);
  } else if (hint) hint.hidden = true;

  function initPhysics() {
    const { Engine, Bodies, Body, Composite, Runner, Mouse, MouseConstraint, Events } = Matter;
    const engine = Engine.create({ gravity: { y: 1.15 } });
    const world = engine.world;
    const runner = Runner.create();
    const items = $$('.obj', stage).filter(el => el.offsetParent !== null);
    let W = stage.clientWidth, H = stage.clientHeight, walls = [], running = false;

    function buildWalls() {
      Composite.remove(world, walls);
      const t = 300;
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true, friction: .8 }),
        Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
        Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
      ];
      Composite.add(world, walls);
    }
    buildWalls();

    const sr = stage.getBoundingClientRect();
    const bodies = items.map(el => {
      const r = el.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
      const rot = parseFloat(getComputedStyle(el).getPropertyValue('--r')) * Math.PI / 180 || 0;
      const isRound = el.querySelector('.sticker');
      const opts = { restitution: .25, friction: .5, frictionAir: .015, density: .002, angle: rot };
      const b = isRound ? Bodies.circle(cx, cy, w / 2, opts) : Bodies.rectangle(cx, cy, w * .86, h * .86, { ...opts, chamfer: { radius: Math.min(w, h) * .2 } });
      Body.setStatic(b, true); // pin after creation so Matter remembers the real mass
      b.plugin = { el, w, h, home: { x: cx, y: cy, a: rot } };
      el.classList.add('is-live');
      place(b);
      return b;
    });
    Composite.add(world, bodies);

    function place(b) {
      const { el, w, h } = b.plugin;
      el.style.transform = `translate(${(b.position.x - w / 2).toFixed(1)}px,${(b.position.y - h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(4)}rad)`;
    }
    function drop(b, kick = 1) {
      if (!b.isStatic) return;
      Body.setStatic(b, false);
      Body.setVelocity(b, { x: (Math.random() - .5) * 3 * kick, y: -2 * kick });
      Body.setAngularVelocity(b, (Math.random() - .5) * .08 * kick);
      b.plugin.el.classList.add('is-fallen');
      hint.classList.add('is-gone');
      resetBtn.hidden = false;
      start();
    }
    const resetBtn = $('#reset');
    resetBtn.addEventListener('click', () => {
      resetBtn.hidden = true;
      const moving = bodies.filter(b => !b.isStatic).map(b => {
        Body.setStatic(b, true);
        return { b, x0: b.position.x, y0: b.position.y, a0: b.angle };
      });
      const t0 = performance.now(), d = 900;
      (function home(now) {
        const k = clamp((now - t0) / d, 0, 1), e = 1 - Math.pow(1 - k, 4);
        moving.forEach(({ b, x0, y0, a0 }) => {
          const hm = b.plugin.home;
          Body.setPosition(b, { x: x0 + (hm.x - x0) * e, y: y0 + (hm.y - y0) * e });
          Body.setAngle(b, a0 + (hm.a - a0) * e);
          place(b);
        });
        if (k < 1) requestAnimationFrame(home);
        else { moving.forEach(({ b }) => b.plugin.el.classList.remove('is-fallen')); hint.classList.remove('is-gone'); }
      })(t0);
    });
    items.forEach((el, i) => {
      if (fine) el.addEventListener('pointerenter', () => drop(bodies[i]));
      el.addEventListener('click', () => { const b = bodies[i]; if (b.isStatic) drop(b, 1.4); else Body.setVelocity(b, { x: (Math.random() - .5) * 8, y: -12 }); });
    });

    if (fine) {
      const mouse = Mouse.create(stage);
      ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(ev => stage.removeEventListener(ev, mouse.mousewheel));
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, damping: .1, render: { visible: false } } });
      Composite.add(world, mc);
      Events.on(mc, 'startdrag', e => { if (e.body.plugin && e.body.plugin.el) e.body.plugin.el.classList.add('is-held'); });
      Events.on(mc, 'enddrag', e => { if (e.body.plugin && e.body.plugin.el) e.body.plugin.el.classList.remove('is-held'); });
    } else {
      // touch: a hint shake on a random object until the first tap
      let hinted = 0;
      const shake = () => {
        if (hint.classList.contains('is-gone') || hinted > 6) return;
        const live = items.filter((el, i) => bodies[i].isStatic);
        const el = live[Math.floor(Math.random() * live.length)];
        if (el) { el.classList.add('is-shaking'); setTimeout(() => el.classList.remove('is-shaking'), 700); }
        hinted++; setTimeout(shake, 3200);
      };
      setTimeout(shake, 3000);
    }

    function loop() {
      if (!running) return;
      bodies.forEach(b => {
        if (b.isStatic) return;
        place(b);
        if (b.position.y > H + 400 || b.position.x < -400 || b.position.x > W + 400) { Body.setPosition(b, { x: W / 2, y: -100 }); Body.setVelocity(b, { x: 0, y: 0 }); }
      });
      requestAnimationFrame(loop);
    }
    function start() { if (running) return; running = true; Runner.run(runner, engine); loop(); }
    function stop() { running = false; Runner.stop(runner); }
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) stop(); else if (bodies.some(b => !b.isStatic)) start(); }).observe(stage);
    new ResizeObserver(() => {
      const nw = stage.clientWidth, nh = stage.clientHeight;
      if (Math.abs(nw - W) < 2 && Math.abs(nh - H) < 2) return;
      // re-home everything on a real resize
      const sr2 = stage.getBoundingClientRect();
      bodies.forEach(b => {
        const el = b.plugin.el;
        el.classList.remove('is-live'); el.style.transform = '';
        const r = el.getBoundingClientRect();
        b.plugin.home = { x: r.left - sr2.left + r.width / 2, y: r.top - sr2.top + r.height / 2, a: b.plugin.home.a };
        el.classList.add('is-live');
        if (b.isStatic) { Body.setPosition(b, b.plugin.home); Body.setAngle(b, b.plugin.home.a); }
        place(b);
      });
      W = nw; H = nh; buildWalls();
    }).observe(stage);
  }

  /* ---------- statement: words sharpen with scroll ---------- */
  const bi = $('#blur-in');
  if (bi) {
    const split = node => [...node.childNodes].forEach(n => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
        else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
      });
      n.replaceWith(frag);
    });
    split(bi);
    const words = $$('.w', bi);
    if (!reduce) {
      const upd = () => {
        const r = bi.getBoundingClientRect();
        const p = clamp((innerHeight * .9 - r.top) / (r.height + innerHeight * .45), 0, 1);
        const lit = p * words.length * 1.2;
        words.forEach((w, i) => {
          const k = clamp(lit - i, 0, 1);
          w.style.setProperty('--o', (.12 + k * .88).toFixed(3));
          w.style.setProperty('--b', ((1 - k) * 8).toFixed(1) + 'px');
        });
      };
      addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    }
  }

  /* ---------- reveal (only what starts below the fold) ---------- */
  if (!reduce) {
    const rio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.remove('pre'); rio.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px' });
    $$('.ep, .clients, .tabs-card, .center-title, .left-title, .rates li, .est, .faq-list details, .dcard, .cta-copy, .foot-card').forEach(el => {
      el.classList.add('rv');
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); rio.observe(el); }
    });
  }

  /* ---------- services: tabs + animated scenes ---------- */
  const tabs = $$('.tab'), scenes = $$('.scene'), tabList = $('#tabs');
  const TAB_MS = 7000;
  let tabIdx = 0, tabTimer = 0, tabsVisible = false, sceneTimers = [];
  function setTab(i, user) {
    tabIdx = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => {
      const on = k === tabIdx;
      t.classList.toggle('is-on', on);
      $('.tab-btn', t).setAttribute('aria-expanded', String(on));
      const bar = $('.tab-bar i', t); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    scenes.forEach((s, k) => {
      const on = k === tabIdx;
      s.classList.toggle('is-on', on);
      $$('video', s).forEach(v => { if (on) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause(); });
    });
    runScene(tabIdx);
    clearTimeout(tabTimer);
    const dur = user ? TAB_MS * 1.6 : TAB_MS;
    tabList.style.setProperty('--dur', dur + 'ms');
    if (!reduce) tabTimer = setTimeout(function next() {
      if (tabsVisible && !tabList.classList.contains('is-paused')) setTab(tabIdx + 1); else tabTimer = setTimeout(next, 800);
    }, dur);
  }
  tabs.forEach((t, k) => $('.tab-btn', t).addEventListener('click', () => setTab(k, true)));
  const card = $('.tabs-card');
  card.addEventListener('mouseenter', () => tabList.classList.add('is-paused'));
  card.addEventListener('mouseleave', () => tabList.classList.remove('is-paused'));
  new IntersectionObserver(([e]) => {
    const was = tabsVisible; tabsVisible = e.isIntersecting;
    if (tabsVisible && !was) setTab(tabIdx);
  }, { threshold: .35 }).observe(card);

  function runScene(i) {
    sceneTimers.forEach(clearTimeout); sceneTimers = [];
    const s = scenes[i];
    if (s.classList.contains('scene-launch')) {
      $$('[data-to]', s).forEach(b => {
        const to = +b.dataset.to, t0 = performance.now(), d = reduce ? 0 : 2400;
        const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 1 : 2).replace(/\.?0+$/, '') + 'k' : String(n);
        (function step(now) { const k = d ? clamp((now - t0) / d, 0, 1) : 1; b.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1 && s.classList.contains('is-on')) requestAnimationFrame(step); })(t0);
      });
    }
    if (s.classList.contains('scene-convert')) {
      let r = 0; s.dataset.r = 0;
      const cycle = () => { r = (r + 1) % 3; s.dataset.r = r; sceneTimers.push(setTimeout(cycle, 2000)); };
      if (!reduce) sceneTimers.push(setTimeout(cycle, 1800));
    }
    if (s.classList.contains('scene-trust')) {
      const ws = $$('.iv-caption span', s); ws.forEach(w => w.classList.remove('on'));
      ws.forEach((w, k) => sceneTimers.push(setTimeout(() => w.classList.add('on'), reduce ? 0 : 900 + k * 320)));
    }
  }
  const ivw = $('.iv-wave');
  if (ivw) for (let i = 0; i < 40; i++) { const b = document.createElement('i'); b.style.setProperty('--d', (.4 + Math.random() * .7).toFixed(2) + 's'); b.style.height = (15 + Math.random() * 30) + '%'; ivw.appendChild(b); }

  /* ---------- process: scroll scrubs the editor playhead ---------- */
  const proc = $('#process'), editor = $('#editor'), tc = $('#ed-tc'), phases = $$('#phases li'), ruler = $$('.ed-ruler span'), clips = $$('.ed-tracks .clip');
  const wave = $('#wave');
  if (wave) for (let i = 0; i < 120; i++) { const b = document.createElement('i'); const v = Math.abs(Math.sin(i * .37) * Math.cos(i * .11)) * .8 + Math.random() * .2; b.style.height = (12 + v * 88) + '%'; wave.appendChild(b); }
  function updProc() {
    const r = proc.getBoundingClientRect();
    const scrub = getComputedStyle($('.process-sticky')).position === 'sticky';
    let p;
    if (reduce) p = 1;
    else if (scrub) p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    else { const er = editor.getBoundingClientRect(); p = clamp((innerHeight * .85 - er.top) / (innerHeight * .7), 0, 1); }
    editor.style.setProperty('--p', p.toFixed(4));
    const frames = Math.round(p * 45 * 24);
    const ff = n => String(n).padStart(2, '0');
    tc.textContent = `00:00:${ff(Math.floor(frames / 24))}:${ff(frames % 24)}`;
    const ph = Math.min(3, Math.floor(p * 4 - 1e-6 < 0 ? 0 : p * 4 * .999));
    phases.forEach((li, k) => li.classList.toggle('is-on', k === ph || !scrub));
    ruler.forEach((s, k) => s.classList.toggle('on', k === ph));
    clips.forEach(c => { const l = parseFloat(c.style.left) / 100, w = parseFloat(c.style.width) / 100; c.classList.toggle('is-hit', p >= l && p <= l + w); });
  }
  addEventListener('scroll', updProc, { passive: true }); addEventListener('resize', updProc); updProc();
  phases.forEach((li, k) => {
    const go = () => {
      if (getComputedStyle($('.process-sticky')).position !== 'sticky') return;
      const top = proc.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + (k + .5) / 4 * (proc.offsetHeight - innerHeight), behavior: reduce ? 'auto' : 'smooth' });
    };
    li.setAttribute('role', 'button'); li.tabIndex = 0;
    li.addEventListener('click', go);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* ---------- deliverables: drag to scroll ---------- */
  const strip = $('#strip');
  if (strip && fine) {
    let down = false, sx = 0, sl = 0, moved = false;
    strip.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; strip.setPointerCapture(e.pointerId); });
    strip.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; strip.classList.add('is-drag'); } strip.scrollLeft = sl - dx; });
    const up = () => { down = false; strip.classList.remove('is-drag'); };
    strip.addEventListener('pointerup', up); strip.addEventListener('pointercancel', up);
  }

  /* ---------- estimator ---------- */
  const est = { type: 'launch', level: 'standard', speed: 'normal' }, out = $('#est-val');
  const money = n => '$' + n.toLocaleString('en-US');
  function updEst() {
    const t = PRICES.type[est.type] + PRICES.level[est.level] + PRICES.speed[est.speed];
    out.classList.add('is-changing');
    setTimeout(() => { out.textContent = `${money(t)} – ${money(Math.round(t * 1.5))}`; out.classList.remove('is-changing'); }, 120);
  }
  $$('.seg').forEach(g => $$('button', g).forEach(b => b.addEventListener('click', () => {
    est[g.dataset.group] = b.dataset.value;
    $$('button', g).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    updEst();
  })));
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.classList.contains('on'))));
  $$('.rates button').forEach(b => b.addEventListener('click', () => {
    est.type = b.dataset.value;
    $$('.rates button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    updEst();
  }));

  /* ---------- CTA ring: turns with scroll ---------- */
  const ring = $('#ring'), ringText = $('#ring-text');
  if (ring) {
    // fit the stretched word to the full circle
    // stretch the word until it closes the circle
    const fit = () => {
      const full = 2 * Math.PI * 150 - 14;
      let n = 3; ringText.textContent = 'L' + 'a'.repeat(n) + 'unch';
      try { while (ringText.getComputedTextLength() < full && n < 80) { n++; ringText.textContent = 'L' + 'a'.repeat(n) + 'unch'; } if (ringText.getComputedTextLength() > full) ringText.textContent = 'L' + 'a'.repeat(n - 1) + 'unch'; } catch (e) {}
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
    if (!reduce) {
      let rot = 0, target = 0, last = scrollY, rafOn = false;
      const spin = () => { rot += (target - rot) * .06; ring.style.transform = `rotate(${rot.toFixed(2)}deg)`; if (Math.abs(target - rot) > .05) requestAnimationFrame(spin); else rafOn = false; };
      const kick = deg => { target += deg; if (!rafOn) { rafOn = true; requestAnimationFrame(spin); } };
      addEventListener('scroll', () => { kick((scrollY - last) * .15); last = scrollY; }, { passive: true });
      const wrap = $('#ring-wrap');
      $('#launch').addEventListener('click', () => {
        if (wrap.classList.contains('is-launching')) return;
        wrap.classList.add('is-launching'); kick(720);
        setTimeout(() => wrap.classList.remove('is-launching'), 1750);
      });
    }
  }

  /* ---------- cursor label: says what a click will do ---------- */
  if (fine) {
    const pill = $('#cursor-pill');
    let x = 0, y = 0, px = 0, py = 0, on = false, raf = 0;
    const follow = () => {
      px += (x - px) * .25; py += (y - py) * .25;
      pill.style.translate = `${(px + 16).toFixed(1)}px ${(py + 18).toFixed(1)}px`;
      raf = (on || Math.abs(x - px) > .5) ? requestAnimationFrame(follow) : 0;
    };
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      const t = e.target.closest && e.target.closest('[data-cursor]');
      const label = t ? (t.classList.contains('is-fallen') ? 'Throw' : t.dataset.cursor) : '';
      if (label) { if (pill.textContent !== label) pill.textContent = label; if (!on) { px = x; py = y; } }
      on = !!label; pill.classList.toggle('on', on);
      pill.classList.toggle('inv', !!(t && t.closest('.editor, .ep-media')));
      if (!raf) raf = requestAnimationFrame(follow);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { on = false; pill.classList.remove('on'); });
  }

  /* ---------- work: move across a film to scrub it ---------- */
  if (fine) $$('.ep-media').forEach(m => {
    const v = $('video', m), bar = $('.scrub i', m), tc = $('.scrub-tc', m);
    let pending = null, busy = false;
    const seek = () => {
      if (pending == null || busy || !v.duration) return;
      busy = true; v.currentTime = pending * v.duration; pending = null;
    };
    v.addEventListener('seeked', () => { busy = false; seek(); });
    m.addEventListener('pointerenter', () => { if (!v.src) v.src = v.dataset.src; m.classList.add('is-scrubbing'); v.pause(); });
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect(), k = clamp((e.clientX - r.left) / r.width, 0, 1);
      bar.style.width = (k * 100).toFixed(2) + '%';
      const t = k * (v.duration || 8);
      tc.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
      pending = k; seek();
    });
    m.addEventListener('pointerleave', () => { m.classList.remove('is-scrubbing'); if (!reduce) v.play().catch(() => {}); });
  });

  /* ---------- magnetic primary buttons ---------- */
  if (fine && !reduce) $$('.btn-dark').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  /* ---------- copy email ---------- */
  const copy = $('#copy');
  copy.addEventListener('click', () => {
    const email = $('#email').textContent.trim();
    const done = msg => { copy.textContent = msg; setTimeout(() => copy.textContent = 'Copy', 1600); };
    const selectIt = () => { const r = document.createRange(); r.selectNodeContents($('#email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(email).then(() => done('Copied'), () => { selectIt(); done('Press Ctrl+C'); }); }
    catch (e) { selectIt(); done('Press Ctrl+C'); }
  });
})();
