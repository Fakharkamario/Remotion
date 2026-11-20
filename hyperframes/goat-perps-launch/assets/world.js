// The 3D layer (three r149): trader room, crimson card field, chrome shield, 24h dial, weekend cards.
// Every pose is a pure function of the frame, so any frame renders on its own. A two-pass thin-lens
// depth-of-field gather runs after the scene (focus distance + blur per shot), like a real lens.
(function () {
  const W = 1920, H = 1080;
  const { softCard, SOFT_W, SOFT_H, Screen, dialFace } = TEX;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const mix = (a, b, k) => a + (b - a) * k;
  const ease = (x) => { const t = clamp(x, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const easeIn = (x) => Math.pow(clamp(x, 0, 1), 3);
  // the reference's camera moves glide at near-constant speed: linear with a short soft start and stop
  const glide = (x, s) => { const t = clamp(x, 0, 1), e = s || 0.18; if (t < e) return (t * t) / (2 * e * (1 - e)); if (t > 1 - e) return 1 - ((1 - t) * (1 - t)) / (2 * e * (1 - e)); return (t - e / 2) / (1 - e); };
  const lerp3 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

  // ---------------- shot table (global frames, 30 fps) ----------------
  const SHOTS = { "1A": [0, 52], "1B": [52, 92], "1C": [92, 128], "1D": [128, 150], "2A": [150, 190], "2B": [190, 232], "2C": [232, 284], "2D": [284, 330] };
  const shotAt = (f) => { for (const k in SHOTS) if (f >= SHOTS[k][0] && f < SHOTS[k][1]) return k; return "2D"; };

  // whip pan between the lockup and 24/7 (yaw offset of the look target, in metres at the subject)
  const WHIP_OUT = (f) => 3.2 * easeIn(span(f, 225, 232));
  const WHIP_IN = (f) => -3.2 * (1 - easeOut(span(f, 232, 241)));

  // ---------------- camera per shot: pos, look, fov, blur at infinity (px), focus (m) ----------------
  const RIG = {
    "1A": (t) => {
      const push = glide(span(t, 0, 40), 0.3), dive = easeIn(span(t, 34, 52));
      let pos = lerp3([-0.32, 1.52, 2.0], [-0.2, 1.47, 1.6], push);
      pos = lerp3(pos, [0.0, 1.4, -0.6], dive);
      const look = lerp3([0.12, 1.3, -1.0], [0, 1.4, -1.0], dive);
      const head = Math.hypot(pos[0] - 0.36, pos[1] - 1.32, pos[2]);
      return { pos, look, fov: 34, cInf: mix(14, 5, dive), focus: mix(head, 1.0, dive) };
    },
    // a steady truck right-to-left through the field, as in the reference's red section
    "1B": (t) => {
      const k = glide(span(t, 0, 40), 0.12);
      const pos = [mix(2.1, -0.15, k), mix(0.08, -0.04, k), mix(4.5, 4.05, k)];
      return { pos, look: [pos[0] - 0.35, pos[1] - 0.05, 0], fov: 36, cInf: 22, focus: Math.hypot(pos[0] - 1.7, pos[2]) };
    },
    "1C": (t) => {
      const k = span(t, 0, 36);
      const pos = [mix(-0.15, -0.75, k), -0.04, mix(4.05, 3.85, k)];
      return { pos, look: [pos[0] - 0.35, -0.08, 0], fov: 36, cInf: 34, focus: 1.1 };
    },
    "1D": (t) => {
      const sh = t > 6 && t < 14 ? Math.sin(t * 9) * 0.015 : 0;
      const pos = [mix(-0.75, -0.95, span(t, 0, 22)) + sh, -0.04 + sh, 3.85];
      return { pos, look: [pos[0] - 0.35, -0.08, 0], fov: 36, cInf: 34, focus: 1.1 };
    },
    "2A": (t) => {
      const k = glide(span(t, 0, 40), 0.3);
      return { pos: lerp3([0, 0.35, 4.3], [0, 0.05, 3.5], k), look: [0, 0.06, 0], fov: 34, cInf: 16 };
    },
    "2B": (t, f) => {
      const k = glide(span(t, 0, 36), 0.3);
      return { pos: lerp3([0, 0.05, 3.5], [0, 0.05, 3.15], k), look: [WHIP_OUT(f), 0.05, 0], fov: 34, cInf: 16 };
    },
    "2C": (t, f) => {
      const k = glide(span(t, 0, 52), 0.2);
      const pos = lerp3([0.55, 0.12, 4.4], [0.05, 0.02, 3.95], k);
      return { pos, look: [0.6 + WHIP_IN(f), 0, 0], fov: 34, cInf: 18, focus: Math.hypot(pos[0] - 1.75, pos[2]) };
    },
    // the camera tracks along the week, landing on Saturday and Sunday as they light up
    "2D": (t) => {
      const k = glide(span(t, 0, 46), 0.2);
      const pos = [mix(-1.5, 1.15, k), mix(0.24, 0.16, k), mix(4.15, 3.95, k)];
      return { pos, look: [pos[0] + 0.1, 0.05, 0], fov: 36, cInf: 18, focus: pos[2] };
    },
  };

  // ---------------- materials ----------------
  const rimMaterial = (rim, power) => new THREE.ShaderMaterial({
    uniforms: { rim: { value: rim }, power: { value: power } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 rim; uniform float power; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 n = normalize(vN); float f = pow(1.-max(dot(n, normalize(vV)),0.), power); float up = smoothstep(-0.3, 0.9, n.y)*0.7 + 0.3; gl_FragColor = vec4(rim*f*up, 1.); }`,
  });
  const chromeMaterial = () => new THREE.ShaderMaterial({
    uniforms: { sweep: { value: -3 }, hot: { value: new THREE.Color(1.05, 0.9, 0.72) }, glow: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vL = position; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float sweep; uniform vec3 hot; uniform float glow; varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW); vec3 r = reflect(-v, n);
        float face = smoothstep(0.85, 0.98, abs(n.z));
        float d = clamp(0.5 + (-vL.x*0.35 + vL.y*0.55), 0., 1.);
        vec3 faceCol = mix(vec3(0.07,0.075,0.085), vec3(0.6,0.63,0.68), smoothstep(0.1, 0.95, d));
        float y = r.y;
        vec3 env = mix(vec3(0.03,0.035,0.04), vec3(0.95,0.97,1.0), smoothstep(-0.05, 0.35, y));
        env = env*0.75 + vec3(0.9)*exp(-pow((y-0.12)*14.,2.));
        vec3 col = mix(env, faceCol, face);
        float s = exp(-pow((vW.x*0.9 + vW.y*0.45 - sweep)*2.4, 2.));
        col += vec3(1.05,1.03,1.0) * s * mix(0.9, 0.42, face);
        float fr = pow(1. - max(dot(n, v), 0.), 3.);
        col += hot * fr * (1.0 - face) * (0.25 + glow);
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.DoubleSide,
  });
  const glassBody = () => new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.6 });

  // rounded slab (the card body): extruded rounded rect with a small bevel so edges catch the light
  const slabCache = new Map();
  const slab = (w, h, d) => {
    const key = `${w}x${h}x${d}`;
    if (slabCache.has(key)) return slabCache.get(key);
    const r = Math.min(w, h) * 0.085, b = Math.min(0.012, d * 0.3), x = -w / 2 + b, y = -h / 2 + b, ww = w - 2 * b, hh = h - 2 * b, rr = r - b;
    const s = new THREE.Shape();
    s.moveTo(x + rr, y); s.lineTo(x + ww - rr, y); s.quadraticCurveTo(x + ww, y, x + ww, y + rr);
    s.lineTo(x + ww, y + hh - rr); s.quadraticCurveTo(x + ww, y + hh, x + ww - rr, y + hh);
    s.lineTo(x + rr, y + hh); s.quadraticCurveTo(x, y + hh, x, y + hh - rr);
    s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 10 });
    g.translate(0, 0, -(d - 2 * b) / 2);
    slabCache.set(key, g);
    return g;
  };

  /** matte glass card: a slab + printed UI layers that cross-fade between states */
  function makeCard(states, depth) {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(slab(SOFT_W, SOFT_H, depth || 0.035), glassBody()));
    const layers = states.map((tex, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(SOFT_W, SOFT_H), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: i ? 0 : 1 }));
      m.position.z = (depth || 0.035) / 2 + 0.0015 + i * 0.0005;
      grp.add(m);
      return m;
    });
    grp.userData.set = (k, dim) => layers.forEach((m, i) => {
      const o = i === 0 ? 1 : (i === layers.length - 1 ? k : 0);
      m.material.opacity = o;
      m.material.color.setScalar(dim == null ? 1 : dim);
    });
    return grp;
  }

  // the GOAT shield path (assets/logo/goat-logo-white.svg), parsed here so no loader is needed
  const SHIELD_D = "M121.794 47.1025C121.794 54.7416 117.98 61.8764 111.627 66.1191L60.8975 100L10.167 66.1191C3.81437 61.8765 1.77793e-05 54.7416 0 47.1025V0H121.794V47.1025ZM41.8223 9.30078C38.4792 9.30089 35.7686 12.0114 35.7686 15.3545V72.0283L59.499 87.8779V15.3545C59.499 12.0113 56.7885 9.30078 53.4453 9.30078H41.8223ZM68.3477 9.30078C65.0046 9.30089 62.294 12.0114 62.2939 15.3545V87.8779L70.4609 82.4238V45.2451L77.8584 40.3047V77.4834L86.0244 72.0283V9.30078H68.3477ZM51.333 73.4072L43.9355 68.4668V16.8242H51.333V73.4072ZM9.30371 47.1084C9.30371 51.6348 11.5631 55.8629 15.3271 58.377L33.0332 70.2021V29.2031L24.8672 23.7441V55.7324L20.1934 52.6113C18.4916 51.4747 17.4698 49.563 17.4697 47.5166V16.8242H33.0332V9.30078H9.30371V47.1084ZM88.7578 16.8242H96.54V65.0039L104.707 59.5498V16.8242H112.488V9.30078H88.7578V16.8242ZM77.8584 31.2891L70.4609 36.2295V16.8242H77.8584V31.2891Z";
  function shieldShapes() {
    const tok = SHIELD_D.match(/[MCLHVZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
    const sp = new THREE.ShapePath();
    let i = 0, cx = 0, cy = 0, cmd = "";
    const n = () => parseFloat(tok[i++]);
    while (i < tok.length) {
      if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
      if (cmd === "M") { cx = n(); cy = n(); sp.moveTo(cx, cy); cmd = "L"; }
      else if (cmd === "L") { cx = n(); cy = n(); sp.lineTo(cx, cy); }
      else if (cmd === "H") { cx = n(); sp.lineTo(cx, cy); }
      else if (cmd === "V") { cy = n(); sp.lineTo(cx, cy); }
      else if (cmd === "C") { const a = n(), b = n(), c = n(), d = n(); cx = n(); cy = n(); sp.bezierCurveTo(a, b, c, d, cx, cy); }
      else if (cmd === "Z") { cmd = ""; }
      else i++;
    }
    // islands inside letter counters (e.g. inside the O) are separate solid shapes; toShapes sorts holes by winding
    return sp.toShapes(true);
  }

  // ---------------- depth of field (two-pass Vogel gather with occlusion rules) ----------------
  const dofFrag = `#include <packing>
    varying vec2 vUv;
    uniform sampler2D tColor; uniform sampler2D tDepth;
    uniform float cameraNear; uniform float cameraFar; uniform float focus; uniform float cInf; uniform float maxCoC; uniform float spread; uniform float rot; uniform vec2 res;
    float zAt(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
    float cocAt(float z){ float c = cInf*(1.0 - focus/max(z, 1e-3)); if (c < 0.0) c *= 1.35; return clamp(c, -maxCoC, maxCoC); }
    void main(){
      vec3 col0 = texture2D(tColor, vUv).rgb;
      if (cInf < 0.25) { gl_FragColor = vec4(col0, 1.); return; }
      float z0 = zAt(vUv), r0 = abs(cocAt(z0));
      float R = maxCoC*spread;
      vec3 acc = col0; float ws = 1.;
      for (int i = 0; i < 56; i++) {
        float fi = float(i); float rr = sqrt((fi + 0.5)/56.)*R; float a = fi*2.39996323 + rot;
        vec2 suv = vUv + vec2(cos(a), sin(a))*rr/res;
        float zs = zAt(suv); float cs = abs(cocAt(zs))*spread;
        float rs = zs > z0 ? min(cs, r0*spread) : cs;     // background never bleeds over a nearer pixel
        float w = clamp(rs - rr + 0.75, 0., 1.);
        acc += texture2D(tColor, suv).rgb*w; ws += w;
      }
      gl_FragColor = vec4(acc/ws, 1.);
    }`;

  const W3 = {};
  let R, scene, camera, rtA, rtB, quad, qscene, qcam, dofMat, built = false;
  const G = {};

  function build(canvas) {
    built = true;
    R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false });
    R.setPixelRatio(1);
    R.setSize(W, H, false);
    R.outputEncoding = THREE.LinearEncoding; // colours as authored (the canvas textures are already display values)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040507);
    camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 60);

    // studio environments the glass and chrome reflect
    const env = (panels) => {
      const s = new THREE.Scene();
      s.background = new THREE.Color(0);
      panels.forEach(([w, h, p, col, k]) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(...p); m.lookAt(0, 0, 0); s.add(m);
      });
      const pm = new THREE.PMREMGenerator(R);
      const t = pm.fromScene(s, 0.03).texture;
      pm.dispose();
      return t;
    };
    const top = [9, 0.5, [0, 3.2, 4.5], "#ffffff", 2.2], ceil = [10, 6, [0, 7, 0], "#ffffff", 0.18];
    G.env = {
      amber: env([top, ceil, [1.2, 5, [-5, 0.5, 2], "#ffb35c", 1.4]]),
      cold: env([top, ceil, [1.2, 5, [-5, 0.5, 2], "#a9bbd6", 1.0], [1.2, 5, [5, 0.5, 1], "#ff6a5c", 0.55]]),
      perps: env([top, ceil, [1.4, 5, [-5, 1, 1.5], "#EC8B1B", 1.6], [1.2, 5, [5, 0.5, 2], "#ffffff", 0.6]]),
    };
    G.amb = new THREE.AmbientLight(0xffffff, 0.35); scene.add(G.amb);
    G.key = new THREE.DirectionalLight(0xffe2bf, 2.0); G.key.position.set(-2.5, 3, 4); scene.add(G.key);
    G.fill = new THREE.DirectionalLight(0xEC8B1B, 0.6); G.fill.position.set(3, -1, 2); scene.add(G.fill);

    // ---- 1A: the trader's room ----
    G.room = new THREE.Group(); scene.add(G.room);
    const rim = rimMaterial(new THREE.Color(1.15, 0.92, 0.7), 7.0);
    const bust = [[0, 0.38], [0.34, 0.38], [0.39, 0.62], [0.42, 0.86], [0.41, 0.95], [0.34, 1.01], [0.2, 1.06], [0.075, 1.1], [0, 1.11]].map(([x, y]) => new THREE.Vector2(x, y));
    const trader = new THREE.Group(); trader.position.x = 0.36; G.room.add(trader);
    const add = (parent, geo, mat, p, s, r) => { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(...p); if (s) m.scale.set(...s); if (r) m.rotation.set(...r); parent.add(m); return m; };
    add(trader, new THREE.LatheGeometry(bust, 64), rim, null, [1, 1, 0.56]);
    add(trader, new THREE.CylinderGeometry(0.068, 0.078, 0.16, 24), rim, [0, 1.16, 0]);
    add(trader, new THREE.SphereGeometry(0.12, 48, 48), rim, [0, 1.32, 0], [0.92, 1.1, 1]);
    add(trader, new THREE.SphereGeometry(0.128, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), rim, [0, 1.355, 0.01], [1, 0.78, 1.08]);
    add(trader, new THREE.CylinderGeometry(0.105, 0.11, 0.01, 32, 1, false, Math.PI * 0.5, Math.PI), rim, [0, 1.36, -0.15], [1, 1, 1.15], [0.1, 0, 0]);
    G.screens = [new Screen(1.75, 1.0, 11, "BTC-PERP  ·  97,412.5"), new Screen(1.2, 0.95, 23, "ETH-PERP"), new Screen(1.2, 0.95, 37, "SOL-PERP")];
    const place = [[[0, 1.4, -1.0], 0], [[-1.5, 1.36, -0.66], 0.6], [[1.5, 1.36, -0.66], -0.6]];
    const dark = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.55, metalness: 0.2 });
    G.screens.forEach((s, i) => {
      const g = new THREE.Group(); g.position.set(...place[i][0]); g.rotation.y = place[i][1]; G.room.add(g);
      add(g, new THREE.BoxGeometry(s.w + 0.04, s.h + 0.04, 0.04), dark, [0, 0, -0.03]);
      add(g, new THREE.PlaneGeometry(s.w, s.h), new THREE.MeshBasicMaterial({ map: s.tex, color: new THREE.Color(1.15, 1.15, 1.15) }));
      add(g, new THREE.BoxGeometry(0.06, 0.34, 0.04), dark, [0, -s.h / 2 - 0.16, -0.06]);
      add(g, new THREE.BoxGeometry(0.36, 0.014, 0.2), dark, [0, -s.h / 2 - 0.33, -0.02]);
      const pl = new THREE.PointLight(0xd8efe4, 1.6, 2.6, 2); pl.position.set(0, -0.1, 0.35); g.add(pl);
    });
    add(G.room, new THREE.BoxGeometry(4.6, 0.04, 1.3), new THREE.MeshStandardMaterial({ color: 0x16130f, roughness: 0.42, metalness: 0.05 }), [0, 0.7, -0.55]);
    add(G.room, new THREE.BoxGeometry(0.46, 0.018, 0.15), dark, [0.34, 0.73, -0.42], null, [0.05, 0, 0]);
    add(G.room, new THREE.BoxGeometry(0.07, 0.01, 0.11), dark, [0.74, 0.73, -0.36]);
    const mugM = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.3 });
    add(G.room, new THREE.CylinderGeometry(0.045, 0.042, 0.11, 32), mugM, [-0.62, 0.77, -0.42]);
    add(G.room, new THREE.TorusGeometry(0.025, 0.008, 12, 24, Math.PI), mugM, [-0.565, 0.77, -0.42], null, [0, 0, Math.PI / 2]);

    // ---- 1B-1D: the crimson field (cards go from LIVE to CLOSED in place as the camera passes) ----
    G.field = new THREE.Group(); scene.add(G.field);
    const FIELD = [
      [["BTC-PERP", "97,412.5"], "₿", ["Crypto", "exchanges"], [1.7, -0.72, 0], -0.2],
      [["EUR/USD", "1.0842"], "€", ["Forex", "desks"], [-1.85, 0.62, -0.7], 0.3],
      [["NAS100", "21,034"], "N", ["Stock", "markets"], [2.75, 0.75, -1.5], -0.34],
      [["XAU/USD", "2,654.1"], "G", ["Gold", "futures"], [-3.3, -0.62, -1.1], 0.36],
      [["US30", "43,870"], "D", ["Index", "futures"], [4.4, -0.5, -2.6], -0.4],
      [["AAPL", "229.87"], "A", ["NYSE", "equities"], [-0.9, 1.45, -3.6], 0.12],
      [["GBP/JPY", "193.44"], "£", ["FX", "weekend"], [1.9, -1.55, -3.3], -0.2],
    ];
    G.fieldCards = FIELD.map(([front, glyph, back, p, ry]) => {
      const c = makeCard([softCard(front, "LIVE", "open", glyph), softCard(back, "CLOSED", "closed")]);
      c.position.set(...p); c.rotation.y = ry; c.userData.base = p; G.field.add(c); return c;
    });
    // the wipe: a card passing right in front of the lens carries us from 1B into 1C
    G.wipe = makeCard([softCard(["Crypto", "exchanges"], "CLOSED", "closed")]);
    scene.add(G.wipe);

    // ---- 2A-2B: chrome shield ----
    G.shield = new THREE.Group(); scene.add(G.shield);
    const sg = new THREE.ExtrudeGeometry(shieldShapes(), { depth: 10, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelSegments: 5, curveSegments: 14 });
    sg.computeBoundingBox();
    const bb = sg.boundingBox, sc = 1.3 / (bb.max.x - bb.min.x);
    sg.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    sg.scale(sc, -sc, sc);
    G.chrome = chromeMaterial();
    G.shieldMesh = new THREE.Mesh(sg, G.chrome); G.shield.add(G.shieldMesh);

    // soft LIVE cards far behind the product shots
    G.bokeh = new THREE.Group(); scene.add(G.bokeh);
    [[["BTC-PERP", "97,412.5"], "₿", [-2.9, 1.0, -3.6], 0.35], [["XAU/USD", "2,654.1"], "G", [3.1, -0.9, -4.2], -0.4], [["NAS100", "21,034"], "N", [2.6, 1.35, -5.4], -0.3]].forEach(([t, gl, p, ry]) => {
      const c = makeCard([softCard(t, "LIVE", "open", gl)]); c.position.set(...p); c.rotation.y = ry; c.userData.base = p; c.userData.ry = ry; G.bokeh.add(c);
    });

    // ---- 2C: 24h dial ----
    G.dial = new THREE.Group(); G.dial.position.set(1.75, 0.02, 0); G.dial.rotation.set(0.08, -0.5, 0.03); G.dial.scale.setScalar(0.8); scene.add(G.dial);
    add(G.dial, new THREE.CylinderGeometry(1.18, 1.18, 0.06, 96), glassBody(), null, null, [Math.PI / 2, 0, 0]);
    add(G.dial, new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: dialFace(), transparent: true, depthWrite: false }), [0, 0, 0.032]);
    add(G.dial, new THREE.RingGeometry(0.985, 1.035, 160), new THREE.MeshBasicMaterial({ color: 0x1b1e24 }), [0, 0, 0.033]);
    G.arcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.56, 0.12) });
    G.arc = add(G.dial, new THREE.RingGeometry(0.985, 1.035, 8, 1, 0, 0.01), G.arcMat, [0, 0, 0.034]);
    G.dot = add(G.dial, new THREE.CircleGeometry(0.045, 32), new THREE.MeshBasicMaterial({ color: 0xfff1df }), [0, 1.01, 0.036]);
    G.wipe2 = makeCard([softCard(["Saturday", "Trading"], "OPEN", "lit", "S")]);
    scene.add(G.wipe2);

    // ---- 2D: Friday, Saturday, Sunday ----
    G.week = new THREE.Group(); scene.add(G.week);
    G.weekCards = [["Friday", "Trading", [-1.55, -0.28, -0.35], 0.26], ["Saturday", "02:14 · live", [0.12, -0.18, 0.05], 0.02], ["Sunday", "Trading", [1.8, -0.24, -0.3], -0.24]].map(([d, sub, p, ry], i) => {
      const c = makeCard([softCard([d, sub], "OPEN", "plain", d[0]), softCard([d, sub], "OPEN", i ? "lit" : "plain", d[0])]);
      c.position.set(...p); c.rotation.y = ry; c.userData.base = p; c.userData.ry = ry; G.week.add(c); return c;
    });

    // dust motes catching the light
    const N = 60, pos = new Float32Array(N * 3), r = TEX.rng(7);
    G.dustBase = Array.from({ length: N }, () => [r() - 0.5, r() - 0.5, r() - 0.5, r()]);
    G.dustGeo = new THREE.BufferGeometry(); G.dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    G.dustMat = new THREE.PointsMaterial({ color: 0xffcf9a, size: 0.012, sizeAttenuation: true, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.Points(G.dustGeo, G.dustMat));

    // ---- post: scene -> rtA (colour + depth) -> DOF pass 1 -> rtB -> DOF pass 2 -> canvas ----
    const mk = () => { const t = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }); t.depthTexture = new THREE.DepthTexture(W, H); t.depthTexture.type = THREE.UnsignedIntType; return t; };
    rtA = mk(); rtB = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
    dofMat = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: null }, tDepth: { value: rtA.depthTexture }, cameraNear: { value: 0.05 }, cameraFar: { value: 60 }, focus: { value: 4 }, cInf: { value: 0 }, maxCoC: { value: 26 }, spread: { value: 1 }, rot: { value: 0 }, res: { value: new THREE.Vector2(W, H) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: dofFrag, depthTest: false, depthWrite: false,
    });
    qscene = new THREE.Scene(); qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dofMat); qscene.add(quad);
  }

  W3.mount = (canvas) => { W3._canvas = canvas; };
  W3.SHOTS = SHOTS; W3.shotAt = shotAt;

  W3.render = function (f) {
    if (!built) { if (document.readyState !== "complete" || (document.fonts && document.fonts.status !== "loaded")) return; build(W3._canvas); }
    const shot = shotAt(f), t = f - SHOTS[shot][0];
    const rig = RIG[shot](t, f);
    camera.position.set(...rig.pos); camera.lookAt(...rig.look);
    if (camera.fov !== rig.fov) { camera.fov = rig.fov; camera.updateProjectionMatrix(); }
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const focus = rig.focus != null ? rig.focus : new THREE.Vector3(...rig.look).sub(camera.position).dot(fwd);

    const kind = shot === "1A" ? "amber" : shot[0] === "1" ? "cold" : "perps";
    scene.environment = G.env[kind];
    G.key.color.set(kind === "cold" ? 0xc9d6ea : 0xffe2bf);
    G.fill.color.set(kind === "cold" ? 0xff8a7a : 0xEC8B1B);
    G.amb.visible = G.key.visible = G.fill.visible = shot !== "1A";

    G.room.visible = shot === "1A";
    G.field.visible = shot === "1B" || shot === "1C" || shot === "1D";
    G.wipe.visible = shot === "1B" && t >= 30;
    G.shield.visible = shot === "2A" || shot === "2B";
    G.bokeh.visible = shot === "2A" || shot === "2B" || shot === "2C";
    G.dial.visible = shot === "2C";
    G.wipe2.visible = shot === "2C" && t >= 42;
    G.week.visible = shot === "2D";

    if (G.room.visible) G.screens.forEach((s, i) => s.draw(f + i * 17));
    if (G.field.visible) {
      const ft = shot === "1B" ? t : 60;
      G.fieldCards.forEach((c, i) => {
        // cards close one after another, from the right of frame to the left as the camera trucks past
        const order = [0, 2, 4, 6, 1, 5, 3][i];
        const k = easeOut(span(ft, 4 + order * 3.2, 10 + order * 3.2));
        c.userData.set(k, shot === "1B" ? 1 : 0.8);
        const b = c.userData.base;
        c.position.set(b[0], b[1] + Math.sin((f + i * 13) * 0.045) * 0.022, b[2]);
      });
    }
    if (G.wipe.visible) {
      // 1 m in front of the lens, crossing from right to left in 9 frames; the lens blurs it into a soft wall
      const k = span(t, 30, 40), cp = camera.position;
      G.wipe.position.set(cp.x + mix(1.6, -1.9, k), cp.y - 0.05, cp.z - 0.95);
      G.wipe.rotation.set(0, -0.1, 0);
      G.wipe.userData.set(1, 0.9);
    }
    if (G.shield.visible) {
      let y, s = 1, ry = 0;
      if (shot === "2A") {
        const k = easeOut(span(t, 0, 30));
        y = mix(-0.5, 0.1, k); ry = mix(0.32, 0, ease(span(t, 0, 36)));
        G.chrome.uniforms.sweep.value = mix(-2.2, 2.4, ease(span(t, 6, 36)));
        G.chrome.uniforms.glow.value = 0.25 * k;
      } else {
        const k = ease(span(t, 0, 16));
        y = mix(0.1, 0.5, k); s = mix(1, 0.52, k);
        G.chrome.uniforms.sweep.value = mix(-2.2, 2.2, ease(span(t, 14, 40)));
        G.chrome.uniforms.glow.value = 0.25;
      }
      G.shield.position.set(0, y, 0); G.shield.rotation.y = ry; G.shield.scale.setScalar(s);
    }
    if (G.bokeh.visible) G.bokeh.children.forEach((c, i) => {
      const b = c.userData.base;
      c.position.set(b[0], b[1] + Math.sin((f + i * 11) * 0.03) * 0.05, b[2]);
      c.rotation.y = c.userData.ry + Math.sin(f * 0.01 + i) * 0.05;
      c.userData.set(0, 0.55);
    });
    if (G.dial.visible) {
      const p = ease(span(t, 8, 40)), len = Math.max(0.01, p * Math.PI * 2), a = Math.PI / 2 - len;
      G.arc.geometry.dispose();
      G.arc.geometry = new THREE.RingGeometry(0.985, 1.035, Math.max(8, Math.round(160 * p)), 1, a, len);
      G.dot.position.set(Math.cos(a) * 1.01, Math.sin(a) * 1.01, 0.036);
    }
    if (G.wipe2.visible) {
      const k = span(t, 42, 52), cp = camera.position;
      G.wipe2.position.set(cp.x + mix(1.7, -1.9, k), cp.y - 0.05, cp.z - 0.95);
      G.wipe2.userData.set(1, 0.95);
    }
    if (G.week.visible) G.weekCards.forEach((c, i) => {
      const inK = easeOut(span(t, i * 3, i * 3 + 16));
      const lit = i === 0 ? 0 : easeOut(span(t, 14 + (i - 1) * 10, 20 + (i - 1) * 10));
      const b = c.userData.base;
      c.position.set(b[0], b[1] + mix(-0.35, 0, inK) + Math.sin((t + i * 9) * 0.05) * 0.02, b[2]);
      c.rotation.set(mix(0.35, 0, inK), c.userData.ry, 0);
      c.userData.set(lit, 1);
    });
    const dc = shot === "1A" ? [0, 1.4, 0] : [0, 0, -1];
    const arr = G.dustGeo.attributes.position.array;
    G.dustBase.forEach(([x, y, z, ph], i) => {
      arr[i * 3] = dc[0] + x * 7 + Math.sin(f * 0.02 + ph * 6) * 0.05;
      arr[i * 3 + 1] = dc[1] + y * 3.5 + f * 0.0016 * (0.5 + ph);
      arr[i * 3 + 2] = dc[2] + z * 5;
    });
    G.dustGeo.attributes.position.needsUpdate = true;
    G.dustMat.color.set(kind === "cold" ? 0xffb0a0 : 0xffcf9a);

    // render + depth of field
    R.setRenderTarget(rtA); R.render(scene, camera);
    const u = dofMat.uniforms;
    u.focus.value = Math.max(0.3, focus); u.cInf.value = rig.cInf; u.cameraNear.value = camera.near; u.cameraFar.value = camera.far;
    u.tColor.value = rtA.texture; u.spread.value = 0.3; u.rot.value = 0.61;
    R.setRenderTarget(rtB); R.render(qscene, qcam);
    u.tColor.value = rtB.texture; u.spread.value = 1.0; u.rot.value = 0;
    R.setRenderTarget(null); R.render(qscene, qcam);
  };

  window.WORLD = W3;
})();
