// Launch Studio — live 3D props for the hero.
// One shared WebGL renderer draws every prop into its own 2D canvas, so the page
// keeps a single GPU context. three.js loads only after the page is idle; until
// then each prop shows a pre-rendered PNG of itself.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const objs = [...document.querySelectorAll('.obj[data-kind]')];
const posterMode = new URLSearchParams(location.search).has('posters');

if (objs.length) {
  await new Promise(r => {
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 1500 }) : setTimeout(r, 300));
    document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  });
  try { await start(); } catch (e) { console.warn('3D disabled:', e); }
}

async function start() {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('../vendor/RoomEnvironment.js');
  if (document.fonts) await document.fonts.ready;

  const SIZE = 640;
  const glCanvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.setScissorTest(true);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const C = { paper: 0xf7f7f7, ink: 0x111111, acid: 0xdfff19 };
  const M = {
    ceramic: new THREE.MeshPhysicalMaterial({ color: C.paper, roughness: .35, clearcoat: 1, clearcoatRoughness: .15 }),
    ink: new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: .3, metalness: .1, clearcoat: 1, clearcoatRoughness: .1 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe2e0d8, roughness: .14, metalness: 1 }),
    accent: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .25, clearcoat: 1 }),
  };

  function makeScene(aspect, camZ = 7) {
    const scene = new THREE.Scene();
    scene.environment = env;
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 6); scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, .25));
    const camera = new THREE.PerspectiveCamera(30, aspect, .1, 50);
    camera.position.set(0, 0, camZ);
    return { scene, camera };
  }
  const lathe = (pts, mat, seg = 64) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  const slab = (w, h, d, r, mat, bevel = .06) => {
    const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 16 });
    g.translate(0, 0, -d / 2);
    return new THREE.Mesh(g, mat);
  };
  const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    t.userData = { ctx, draw, w, h };
    return t;
  };

  // ---------------- props ----------------
  const builders = {
    rocket() {
      const { scene, camera } = makeScene(1, 9.6);
      const g = new THREE.Group();
      const body = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24, y = -1.25 + t * 2.2; body.push([.56 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * .1 - Math.max(0, t - .55) * .42, y]); }
      g.add(lathe(body, M.ceramic));
      const r0 = body[body.length - 1][0], nose = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; nose.push([r0 * Math.cos(t * Math.PI / 2) ** .9 + .0001, .95 + Math.sin(t * Math.PI / 2) * 1.05]); }
      g.add(lathe(nose, M.ink));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r0 + .012, r0 + .012, .09, 64, 1, true), M.ink); band.position.y = .92; g.add(band);
      g.add(lathe([[.001, -1.25], [.58, -1.25], [.6, -1.32], [.5, -1.38], [.001, -1.38]], M.ink));
      g.add(lathe([[.22, -1.36], [.3, -1.52], [.4, -1.72], [.36, -1.73], [.26, -1.55], [.18, -1.38]], M.chrome));
      const port = new THREE.Group();
      port.add(new THREE.Mesh(new THREE.TorusGeometry(.25, .055, 20, 48), M.chrome));
      const glass = new THREE.Mesh(new THREE.SphereGeometry(.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x1b1b18, roughness: .05, clearcoat: 1 }));
      glass.rotation.x = Math.PI / 2; glass.scale.z = .35; port.add(glass);
      port.position.set(0, .25, .64); g.add(port);
      const fs = new THREE.Shape();
      fs.moveTo(0, .55); fs.bezierCurveTo(.35, .3, .75, -.2, .78, -.85); fs.lineTo(.55, -.92); fs.quadraticCurveTo(.3, -.62, 0, -.55); fs.lineTo(0, .55);
      const fg = new THREE.ExtrudeGeometry(fs, { depth: .06, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 3, curveSegments: 20 });
      fg.translate(0, 0, -.03);
      for (let i = 0; i < 3; i++) {
        const f = new THREE.Mesh(fg, M.ink), a = i / 3 * Math.PI * 2 + Math.PI / 2;
        f.position.set(Math.cos(a) * .5, -.78, Math.sin(a) * .5); f.rotation.y = -a; g.add(f);
      }
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(.24, 1, 32, 1, true), flameMat);
      flame.rotation.x = Math.PI; flame.position.y = -2.25; g.add(flame);
      const core = new THREE.Mesh(new THREE.ConeGeometry(.12, .6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.rotation.x = Math.PI; core.position.y = -2.03; g.add(core);
      g.rotation.z = -.32; g.position.set(.45, .45, 0);
      scene.add(g);
      let boost = 0;
      return {
        scene, camera, aspect: 1,
        poke() { boost = 1; },
        update(t, dt, tilt) {
          boost = Math.max(0, boost - dt * .8);
          g.rotation.y = t * .6 + boost * 6 + tilt.x * .5;
          g.rotation.x = tilt.y * .25;
          const f = 1 + Math.sin(t * 30) * .08 + boost * .8;
          flame.scale.set(1, f, 1); core.scale.set(1, f, 1);
        },
      };
    },

    clap() {
      const { scene, camera } = makeScene(1, 9.2);
      const g = new THREE.Group();
      const slateTex = canvasTex(512, 380, (x, w, h) => {
        x.fillStyle = '#111111'; x.fillRect(0, 0, w, h);
        x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 3;
        [[0, 120, w, 120], [0, 250, w, 250], [w / 2, 120, w / 2, 250]].forEach(([a, b, c, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); });
        x.fillStyle = '#ffffff'; x.font = '600 58px Geist, Arial, sans-serif'; x.fillText('LAUNCH STUDIO', 28, 86);
        x.font = '500 30px Geist, Arial, sans-serif'; x.fillStyle = 'rgba(255,255,255,.6)';
        x.fillText('SCENE', 28, 160); x.fillText('TAKE', w / 2 + 24, 160); x.fillText('ROLL', 28, 292);
        x.fillStyle = '#ffffff'; x.font = '600 66px Geist, Arial, sans-serif';
        x.fillText('01', 28, 228); x.fillText('03', w / 2 + 24, 228);
        x.fillStyle = '#ffffff'; x.font = '600 50px Geist, Arial, sans-serif'; x.fillText('LAUNCH DAY', 28, 352);
      });
      const board = slab(2.6, 1.9, .14, .1, [M.ink, new THREE.MeshPhysicalMaterial({ map: slateTex, roughness: .5, clearcoat: .6 })], .03);
      // put the label on the front cap only
      board.geometry.groups.forEach(gr => { gr.materialIndex = gr.materialIndex === 0 ? 1 : 0; });
      fixFrontUV(board.geometry, 2.6 + .06, 1.9 + .06);
      board.position.y = -.35; g.add(board);
      const stripeTex = canvasTex(512, 64, (x, w, h) => {
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#111111';
        for (let i = -2; i < 10; i++) { x.beginPath(); x.moveTo(i * 64, h); x.lineTo(i * 64 + 32, h); x.lineTo(i * 64 + 64, 0); x.lineTo(i * 64 + 32, 0); x.fill(); }
      });
      const stripeMat = new THREE.MeshPhysicalMaterial({ map: stripeTex, roughness: .4, clearcoat: .8 });
      const mkBar = () => { const b = new THREE.Mesh(new THREE.BoxGeometry(2.66, .34, .16), [M.ink, M.ink, M.ink, M.ink, stripeMat, stripeMat]); return b; };
      const base = mkBar(); base.position.set(0, .78, 0); g.add(base);
      const armPivot = new THREE.Group(); armPivot.position.set(-1.33, .95, 0); g.add(armPivot);
      const arm = mkBar(); arm.position.set(1.33, .17, 0); armPivot.add(arm);
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .22, 24), M.chrome); hinge.rotation.x = Math.PI / 2; hinge.position.set(-1.33, .95, 0); g.add(hinge);
      g.rotation.set(.1, -.35, .06); g.position.y = -.3;
      scene.add(g);
      let clapT = 0;
      return {
        scene, camera, aspect: 1,
        poke() { clapT = 1; },
        update(t, dt, tilt) {
          const cyc = (t % 4.2) / 4.2;
          let open = cyc < .7 ? Math.min(1, cyc / .15) : Math.max(0, 1 - (cyc - .7) / .04);
          if (clapT > 0) { clapT = Math.max(0, clapT - dt * 2.2); open = Math.max(open, Math.sin(clapT * Math.PI)); }
          armPivot.rotation.z = open * .42;
          g.rotation.y = -.35 + tilt.x * .45 + Math.sin(t * .5) * .08;
          g.rotation.x = .1 + tilt.y * .25;
        },
      };
    },

    key() {
      const { scene, camera } = makeScene(1, 7);
      const g = new THREE.Group();
      const baseM = new THREE.MeshPhysicalMaterial({ color: 0xd4d4d4, roughness: .5, clearcoat: .4 });
      const base = slab(2, 2, .5, .32, baseM, .08); g.add(base);
      const cap = new THREE.Group();
      const top = slab(1.7, 1.7, .5, .3, M.ceramic, .12); cap.add(top);
      const tri = new THREE.Shape(); tri.moveTo(-.28, -.36); tri.lineTo(.42, 0); tri.lineTo(-.28, .36); tri.lineTo(-.28, -.36);
      const triM = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: .06, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 }), M.ink);
      triM.position.z = .37; cap.add(triM);
      cap.position.z = .55; g.add(cap);
      g.rotation.set(-.55, .45, .1);
      scene.add(g);
      let press = 0;
      return {
        scene, camera, aspect: 1,
        poke() { press = 1; },
        update(t, dt, tilt) {
          const auto = Math.max(0, Math.sin(t * 1.4) - .92) * 12;
          press = Math.max(0, press - dt * 3);
          cap.position.z = .55 - Math.min(1, auto + Math.sin(press * Math.PI)) * .2;
          g.rotation.y = .45 + tilt.x * .5; g.rotation.x = -.55 + tilt.y * .3;
        },
      };
    },

    clock() {
      const { scene, camera } = makeScene(1.5, 6.3);
      const g = new THREE.Group();
      const shell = slab(3.4, 1.7, .7, .3, new THREE.MeshPhysicalMaterial({ color: 0x1c1c1c, roughness: .35, metalness: .2, clearcoat: 1, clearcoatRoughness: .1 }), .1);
      g.add(shell);
      let label = '';
      const screenTex = canvasTex(640, 300, () => {});
      const drawScreen = text => {
        const { ctx: x, w, h } = screenTex.userData;
        x.fillStyle = '#0d0d0b'; x.fillRect(0, 0, w, h);
        x.font = '500 170px "Geist Mono", ui-monospace, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
        const live = text === 'LIVE';
        x.fillStyle = 'rgba(255,255,255,.06)'; x.fillText(text ? text.replace(/[0-9A-Z]/g, '8') : '8888', w / 2, h / 2 + 6);
        x.shadowColor = live ? 'rgba(223,255,25,.9)' : 'rgba(255,255,255,.75)'; x.shadowBlur = 22; x.fillStyle = live ? '#e9ff5a' : '#ffffff'; x.fillText(text, w / 2, h / 2 + 6);
        x.shadowBlur = 0;
        screenTex.needsUpdate = true;
      };
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.3), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
      screen.position.z = .46; g.add(screen);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: 0, transparent: true, opacity: .08, clearcoat: 1 }));
      glass.position.z = .48; g.add(glass);
      g.rotation.set(-.12, -.42, .05);
      scene.add(g);
      let offset = 0;
      return {
        scene, camera, aspect: 1.5,
        poke() { offset += 3; },
        update(t, dt, tilt) {
          const cyc = Math.floor(t + offset) % 14;
          const text = cyc < 10 ? 'T-' + String(10 - cyc).padStart(2, '0') : (cyc % 2 ? 'LIVE' : '');
          if (text !== label) { label = text; drawScreen(text); }
          g.rotation.y = -.42 + tilt.x * .45; g.rotation.x = -.12 + tilt.y * .25;
        },
      };
    },
  };

  // map the front cap of an extruded slab to the full texture
  function fixFrontUV(geo, w, h) {
    const pos = geo.attributes.position, uv = geo.attributes.uv, n = geo.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      if (n.getZ(i) > .9) uv.setXY(i, pos.getX(i) / w + .5, pos.getY(i) / h + .5);
    }
    uv.needsUpdate = true;
  }

  // ---------------- wire props to the page ----------------
  const props = [];
  for (const el of objs) {
    const b = builders[el.dataset.kind]; if (!b) continue;
    const p = b();
    const cv = el.querySelector('canvas');
    p.el = el; p.cv = cv; p.ctx = cv.getContext('2d');
    p.tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    el.addEventListener('pointerenter', () => p.poke());
    el.addEventListener('pointerdown', () => p.poke());
    props.push(p);
  }

  function sizeCanvas(p) {
    const r = p.el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.min(SIZE, Math.round(r.width * dpr)) || 300;
    const h = Math.round(w / p.aspect);
    if (p.cv.width !== w || p.cv.height !== h) { p.cv.width = w; p.cv.height = h; }
  }
  props.forEach(sizeCanvas);
  addEventListener('resize', () => props.forEach(sizeCanvas));

  function draw(p) {
    const vw = SIZE, vh = Math.round(SIZE / p.aspect);
    renderer.setViewport(0, 0, vw, vh); renderer.setScissor(0, 0, vw, vh);
    renderer.clear();
    renderer.render(p.scene, p.camera);
    p.ctx.clearRect(0, 0, p.cv.width, p.cv.height);
    p.ctx.drawImage(glCanvas, 0, SIZE - vh, vw, vh, 0, 0, p.cv.width, p.cv.height);
  }

  // poster export for build time (?posters)
  if (posterMode) {
    window.__posters = () => props.map(p => {
      const vh = Math.round(SIZE / p.aspect);
      p.update(1.2, 0, { x: 0, y: 0 });
      renderer.setViewport(0, 0, SIZE, vh); renderer.setScissor(0, 0, SIZE, vh); renderer.clear();
      renderer.render(p.scene, p.camera);
      const c = document.createElement('canvas'); c.width = SIZE; c.height = vh;
      c.getContext('2d').drawImage(glCanvas, 0, SIZE - vh, SIZE, vh, 0, 0, SIZE, vh);
      return { kind: p.el.dataset.kind, url: c.toDataURL('image/png') };
    });
    window.__postersReady = true;
    return;
  }

  // pointer → tilt
  let mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  const hero = document.getElementById('hero');
  let visible = true, running = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { rootMargin: '100px' }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    for (const p of props) {
      const r = p.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      p.tilt.tx = Math.max(-1, Math.min(1, (mx - cx) / 500));
      p.tilt.ty = Math.max(-1, Math.min(1, (my - cy) / 500));
      p.tilt.x += (p.tilt.tx - p.tilt.x) * .06; p.tilt.y += (p.tilt.ty - p.tilt.y) * .06;
      p.update(t, dt, p.tilt);
      draw(p);
    }
  }
  function loop() {
    if (running || reduce) return;
    running = true;
    requestAnimationFrame(function tick() {
      if (!visible || document.hidden) { running = false; return; }
      frame(); requestAnimationFrame(tick);
    });
  }

  // first frame, then reveal the live canvases
  frame();
  objs.forEach(el => el.classList.add('has-3d'));
  if (!reduce) { clock.start(); loop(); }
}
