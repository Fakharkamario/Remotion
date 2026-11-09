// Launch Studio — 3D hero: a procedurally built rocket (echoing the logo mark),
// floating geometry, and an exhaust that intensifies as you scroll.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const canvas = document.getElementById('hero-canvas');
const hero = canvas && canvas.closest('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fail() { document.documentElement.classList.add('no-webgl'); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { fail(); }

if (renderer) init();

function init() {
  const C = { paper: 0xf4f3ee, ink: 0x11110f, acid: 0xdfff19 };
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 8);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // ---------- materials ----------
  const ceramic = new THREE.MeshPhysicalMaterial({ color: C.paper, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12 });
  const inkGloss = new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdedcd4, roughness: 0.12, metalness: 1 });
  const acidMat = new THREE.MeshPhysicalMaterial({ color: C.acid, roughness: 0.28, clearcoat: 1, emissive: C.acid, emissiveIntensity: 0.12 });

  // ---------- rocket ----------
  const rocket = new THREE.Group();
  const lathe = (pts, mat, seg = 72) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);

  // body: ceramic from y=-1.25 to y=0.95
  const bodyPts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, y = -1.25 + t * 2.2;
    const r = 0.56 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * 0.1 - Math.max(0, t - 0.55) * 0.42;
    bodyPts.push([r, y]);
  }
  rocket.add(lathe(bodyPts, ceramic));
  // nose cone: ink, continues the taper to a soft point
  const r0 = bodyPts[bodyPts.length - 1][0];
  const nosePts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; nosePts.push([r0 * Math.cos(t * Math.PI / 2) ** 0.9 + 0.0001, 0.95 + Math.sin(t * Math.PI / 2) * 1.05]); }
  rocket.add(lathe(nosePts, inkGloss));
  // acid band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.012, r0 + 0.012, 0.09, 72, 1, true), acidMat);
  band.position.y = 0.92; rocket.add(band);
  // tail skirt + nozzle
  rocket.add(lathe([[0.001, -1.25], [0.58, -1.25], [0.6, -1.32], [0.5, -1.38], [0.001, -1.38]], inkGloss));
  rocket.add(lathe([[0.22, -1.36], [0.3, -1.52], [0.4, -1.72], [0.36, -1.73], [0.26, -1.55], [0.18, -1.38]], chrome));

  // porthole
  const port = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.055, 24, 64), chrome);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.24, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x1b1b18, roughness: 0.05, metalness: 0.3, clearcoat: 1 }));
  glass.rotation.x = Math.PI / 2; glass.scale.z = 0.35;
  port.add(ring, glass);
  port.position.set(0, 0.25, 0.64); rocket.add(port);

  // fins
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.55); finShape.bezierCurveTo(0.35, 0.3, 0.75, -0.2, 0.78, -0.85);
  finShape.lineTo(0.55, -0.92); finShape.quadraticCurveTo(0.3, -0.62, 0, -0.55); finShape.lineTo(0, 0.55);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 24 });
  finGeo.translate(0, 0, -0.035);
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(finGeo, i === 0 ? acidMat : inkGloss);
    const a = i / 3 * Math.PI * 2 + Math.PI / 2;
    fin.position.set(Math.cos(a) * 0.5, -0.78, Math.sin(a) * 0.5);
    fin.rotation.y = -a;
    rocket.add(fin);
  }

  // flame (shader cone, additive)
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0.6 }, uAcid: { value: new THREE.Color(C.acid) } },
    vertexShader: `uniform float uTime; uniform float uPower; varying float vY; varying vec2 vUv;
      void main(){ vUv=uv; vec3 p=position; vY=uv.y;
        float w = sin(uTime*30.0 + p.y*8.0)*0.03*(1.0-uv.y);
        p.x += w; p.z += w*0.6; p.y *= mix(0.7,1.35,uPower) + sin(uTime*24.0)*0.05;
        gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);} `,
    fragmentShader: `uniform vec3 uAcid; uniform float uPower; varying float vY; varying vec2 vUv;
      void main(){ float t = vY; // 0 tip -> 1 base
        vec3 col = mix(uAcid, vec3(1.0,1.0,0.92), smoothstep(0.55,1.0,t));
        float edge = sin(vUv.x*3.14159*2.0)*0.0+1.0;
        float a = smoothstep(0.0,0.75,t) * (0.55+0.45*uPower) * edge;
        gl_FragColor = vec4(col*1.15, a);} `,
  });
  const flameGeo = new THREE.ConeGeometry(0.3, 1.6, 40, 8, true);
  flameGeo.rotateX(Math.PI); flameGeo.translate(0, -0.8, 0);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = -1.7; rocket.add(flame);
  const flameCore = new THREE.Mesh(flameGeo, flameMat.clone());
  flameCore.material.uniforms = { uTime: flameMat.uniforms.uTime, uPower: flameMat.uniforms.uPower, uAcid: { value: new THREE.Color(0xffffff) } };
  flameCore.scale.set(0.5, 0.7, 0.5); flameCore.position.y = -1.7; rocket.add(flameCore);

  // exhaust sparks
  const SPARKS = 140;
  const sparkGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(SPARKS * 3), sv = [];
  for (let i = 0; i < SPARKS; i++) { sv.push({ life: Math.random(), x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }); }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparkMat = new THREE.PointsMaterial({ color: C.acid, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);

  // smoke puffs (soft paper-tone spheres that drift out of the nozzle)
  const puffGeo = new THREE.IcosahedronGeometry(1, 2);
  const puffs = [];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0 }));
    m.userData = { life: i / 18, vx: 0, vy: 0, s: 0, born: false };
    scene.add(m); puffs.push(m);
  }

  const rocketRig = new THREE.Group();
  rocketRig.add(rocket);
  rocket.rotation.z = -0.5; // pointing up-right like the logo
  scene.add(rocketRig);

  // ---------- floating geometry ----------
  const floaters = [];
  const addF = (geo, mat, pos, s, spin) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.scale.setScalar(s);
    m.userData = { base: new THREE.Vector3(...pos), spin, phase: Math.random() * 6.28, depth: pos[2] };
    scene.add(m); floaters.push(m); return m;
  };
  addF(new THREE.TorusGeometry(0.6, 0.22, 32, 80), acidMat, [3.6, 2.4, -2], 1, [0.4, 0.6]);
  addF(new THREE.SphereGeometry(0.5, 48, 32), inkGloss, [-1.6, -2.6, -1], 0.9, [0, 0]);
  addF(new THREE.SphereGeometry(0.5, 48, 32), chrome, [4.6, -1.8, 0.5], 0.55, [0, 0]);
  addF(new THREE.CapsuleGeometry(0.3, 0.8, 12, 32), ceramic, [-3.2, 1.8, -3], 1, [0.5, 0.3]);
  addF(new THREE.OctahedronGeometry(0.55, 0), inkGloss, [1.4, 3.2, -4], 1, [0.6, 0.4]);
  addF(new THREE.TorusKnotGeometry(0.35, 0.12, 120, 16), chrome, [-4.6, -0.6, -5], 1, [0.3, 0.5]);

  // ---------- layout ----------
  let W = 1, H = 1, mobile = false;
  function layout() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    mobile = W < 900;
    // place rocket toward right side in desktop, top-right on mobile
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    // size against the first screen, not the full (taller) hero
    const screenH = Math.min(H, innerHeight);
    const unitsPerPx = visH / H;
    const topPx = mobile ? 150 : screenH * 0.5;
    const yAtTop = visH / 2 - topPx * unitsPerPx;
    const sc = mobile ? Math.min(0.62, visW / 9.5) : Math.min(1.05, (screenH * 0.62 * unitsPerPx) / 4.2);
    rocketRig.scale.setScalar(sc);
    rocketRig.userData.base = mobile ? new THREE.Vector3(visW * 0.33, yAtTop - 0.4, 0) : new THREE.Vector3(visW * 0.27, yAtTop + 0.2, 0);
    const fl = mobile ? [] : [
      [visW * 0.44, yAtTop + screenH * 0.32 * unitsPerPx], [visW * 0.08, yAtTop - screenH * 0.38 * unitsPerPx],
      [visW * 0.42, yAtTop - screenH * 0.3 * unitsPerPx], [visW * 0.12, yAtTop + screenH * 0.3 * unitsPerPx],
      [visW * 0.36, yAtTop + screenH * 0.42 * unitsPerPx], [visW * 0.47, yAtTop - screenH * 0.05 * unitsPerPx],
    ];
    floaters.forEach((f, i) => {
      f.visible = !mobile;
      if (fl[i]) { f.userData.base.x = fl[i][0]; f.userData.base.y = fl[i][1]; f.position.x = fl[i][0]; f.userData.px = 0; }
    });
  }
  layout();
  new ResizeObserver(layout).observe(hero);

  // ---------- input ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  let scrollP = 0;
  const onScroll = () => { scrollP = Math.min(1, Math.max(0, scrollY / (H * 0.9))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce) tick(); }).observe(hero);

  // ---------- loop ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3(), nozzle = new THREE.Vector3(), dir = new THREE.Vector3();
  let running = false;

  function step(dt, t) {
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    const base = rocketRig.userData.base;
    const lift = scrollP * scrollP * 9;
    rocketRig.position.set(base.x + Math.sin(t * 0.8) * 0.06 + lift * 0.45, base.y + Math.sin(t * 1.3) * 0.14 + lift, 0);
    rocket.rotation.y = t * 0.45 + mouse.x * 0.6;
    rocketRig.rotation.x = mouse.y * 0.18;
    rocketRig.rotation.z = -mouse.x * 0.12;
    const power = 0.45 + scrollP * 1.2 + Math.sin(t * 9) * 0.04;
    flameMat.uniforms.uTime.value = t; flameMat.uniforms.uPower.value = power;

    rocket.updateMatrixWorld(true);
    nozzle.set(0, -1.75, 0).applyMatrix4(rocket.matrixWorld);
    dir.set(0, -1, 0).transformDirection(rocket.matrixWorld);

    const arr = sparkGeo.attributes.position.array;
    for (let i = 0; i < SPARKS; i++) {
      const s = sv[i];
      s.life += dt * (1.1 + power);
      if (s.life >= 1) {
        s.life = 0; s.born = true; s.x = nozzle.x; s.y = nozzle.y; s.z = nozzle.z;
        const sp = 2.4 + Math.random() * 2.5 * power;
        s.vx = dir.x * sp + (Math.random() - .5) * 1.2; s.vy = dir.y * sp + (Math.random() - .5) * 1.2; s.vz = dir.z * sp + (Math.random() - .5) * 1.2;
      }
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (!s.born) { arr[i * 3] = nozzle.x; arr[i * 3 + 1] = nozzle.y; arr[i * 3 + 2] = nozzle.z; continue; }
      arr[i * 3] = s.x; arr[i * 3 + 1] = s.y; arr[i * 3 + 2] = s.z;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkMat.size = 0.06 * rocketRig.scale.x;

    for (const p of puffs) {
      const u = p.userData;
      u.life += dt * 0.45;
      if (u.life >= 1) {
        u.life = 0; u.born = true; p.position.copy(nozzle).addScaledVector(dir, 0.6);
        u.vx = dir.x * 1.2 + (Math.random() - .5) * .6; u.vy = dir.y * 1.2 + (Math.random() - .5) * .4; u.s = 0.12 + Math.random() * 0.14;
      }
      p.position.x += u.vx * dt; p.position.y += u.vy * dt;
      u.vx *= 0.985; u.vy *= 0.985;
      const s = (u.s + u.life * 0.9) * rocketRig.scale.x * (0.6 + power * 0.5);
      p.scale.setScalar(s);
      p.material.opacity = u.born ? Math.sin(u.life * Math.PI) * 0.55 : 0;
    }

    for (const f of floaters) {
      const u = f.userData;
      f.position.y = u.base.y + Math.sin(t * 0.7 + u.phase) * 0.25 - scrollP * (2 + u.depth * -0.4);
      f.rotation.x += u.spin[0] * dt; f.rotation.y += u.spin[1] * dt;
      f.position.z = u.depth + mouse.x * 0.01;
      tmp.set(mouse.x * (0.4 - u.depth * 0.08), -mouse.y * (0.3 - u.depth * 0.06), 0);
      f.position.x += (tmp.x - (f.userData.px || 0)); f.userData.px = tmp.x;
    }
    camera.position.x = mouse.x * 0.25; camera.position.y = -mouse.y * 0.2;
    camera.lookAt(0, 0, 0);
  }

  function tick() {
    if (running) return;
    running = true;
    requestAnimationFrame(function loop() {
      if (!visible) { running = false; return; }
      const dt = Math.min(clock.getDelta(), 0.05);
      step(dt, clock.elapsedTime);
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    });
  }

  if (reduce) {
    // one settled frame, no animation loop
    for (let i = 0; i < 90; i++) step(1 / 60, i / 60);
    renderer.render(scene, camera);
    new ResizeObserver(() => renderer.render(scene, camera)).observe(hero);
  } else {
    clock.start(); tick();
  }
  document.documentElement.classList.add('webgl-on');
}
