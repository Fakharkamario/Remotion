// Logo reveal (frames 67-99 of the opener), rebuilt from the supplied reference clip (33 frames, measured):
//   L 1-3   the shield enters from the lower left, almost edge-on, warm-lit by the room
//   L 4-7   it swings to the centre and opens to camera, slightly oversized, flaring white-hot (peak at 7)
//   L 7-12  the flare cools to the finished metal; the shield is still turned, its thick left side showing
//   L 12-32 a slow continued turn (width 785 -> 690 px) and rise (~40 px) while a highlight sweeps the face
// The GOAT mark stays monochrome (brand rule): the flare is white light and the finish is brushed chrome; Perps
// orange only lights the room behind it. LOGO.render(L) is a pure function of the local frame L (0..32).
(function () {
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // monotone cubic through [[frame, value], ...]
  const key = (pts) => {
    const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
    return (t) => {
      if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (t > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h;
      return (2 * u ** 3 - 3 * u ** 2 + 1) * ys[i] + (u ** 3 - 2 * u ** 2 + u) * h * m[i] + (-2 * u ** 3 + 3 * u ** 2) * ys[i + 1] + (u ** 3 - u ** 2) * h * m[i + 1];
    };
  };

  // pose keys fitted to the reference's measured centre / size per frame (camera at z = 4, fov 34)
  const PX = key([[1, -1.6], [3, -1.26], [4, -0.45], [5, -0.03], [6, 0.1], [7, 0.1], [9, 0.04], [11, 0.06], [32, 0.06]]);
  const PY = key([[1, -0.45], [3, -0.29], [4, -0.2], [5, -0.17], [6, -0.15], [7, -0.14], [9, -0.11], [11, -0.09], [14, -0.085], [26, -0.07], [32, -0.065]]);
  const PZ = key([[1, -4.0], [3, -3.0], [4, -1.1], [5, -0.15], [6, 0.08], [7, 0.08], [9, 0.02], [12, 0.0], [32, -0.04]]);
  const PITCH = key([[1, 1.35], [3, 1.2], [4, 0.95], [5, 0.72], [6, 0.64], [7, 0.58], [9, 0.45], [11, 0.28], [14, 0.14], [20, 0.07], [32, 0.04]]);
  const YAW = key([[1, -0.9], [3, -0.55], [5, 0.1], [7, 0.5], [10, 0.62], [12, 0.58], [32, 0.32]]);
  const ROLL = key([[1, 0.35], [4, 0.12], [7, 0.0], [32, 0.0]]);
  const FLARE = key([[3, 0], [4, 0.15], [5, 0.5], [6, 0.82], [7, 0.95], [8, 0.9], [9, 0.62], [10, 0.34], [11, 0.14], [13, 0.0], [32, 0.0]]);
  const WARM = key([[1, 1], [4, 1], [6, 0.4], [9, 0], [32, 0]]);
  const SWEEP = key([[10, -1.8], [32, 1.6]]);
  const LEVEL = key([[11, 0.88], [13, 0.9], [24, 1.04], [28, 1.0], [32, 0.88]]);

  const D = "M121.794 47.1025C121.794 54.7416 117.98 61.8764 111.627 66.1191L60.8975 100L10.167 66.1191C3.81437 61.8765 1.77793e-05 54.7416 0 47.1025V0H121.794V47.1025ZM41.8223 9.30078C38.4792 9.30089 35.7686 12.0114 35.7686 15.3545V72.0283L59.499 87.8779V15.3545C59.499 12.0113 56.7885 9.30078 53.4453 9.30078H41.8223ZM68.3477 9.30078C65.0046 9.30089 62.294 12.0114 62.2939 15.3545V87.8779L70.4609 82.4238V45.2451L77.8584 40.3047V77.4834L86.0244 72.0283V9.30078H68.3477ZM51.333 73.4072L43.9355 68.4668V16.8242H51.333V73.4072ZM9.30371 47.1084C9.30371 51.6348 11.5631 55.8629 15.3271 58.377L33.0332 70.2021V29.2031L24.8672 23.7441V55.7324L20.1934 52.6113C18.4916 51.4747 17.4698 49.563 17.4697 47.5166V16.8242H33.0332V9.30078H9.30371V47.1084ZM88.7578 16.8242H96.54V65.0039L104.707 59.5498V16.8242H112.488V9.30078H88.7578V16.8242ZM77.8584 31.2891L70.4609 36.2295V16.8242H77.8584V31.2891Z";
  function shapes() {
    const tok = D.match(/[MCLHVZ]|-?\d*\.?\d+(?:e-?\d+)?/gi), sp = new THREE.ShapePath();
    let i = 0, cx = 0, cy = 0, cmd = "";
    const n = () => parseFloat(tok[i++]);
    while (i < tok.length) {
      if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
      if (cmd === "M") { cx = n(); cy = n(); sp.moveTo(cx, cy); cmd = "L"; }
      else if (cmd === "L") { cx = n(); cy = n(); sp.lineTo(cx, cy); }
      else if (cmd === "H") { cx = n(); sp.lineTo(cx, cy); }
      else if (cmd === "V") { cy = n(); sp.lineTo(cx, cy); }
      else if (cmd === "C") { const a = n(), b = n(), c = n(), d = n(); cx = n(); cy = n(); sp.bezierCurveTo(a, b, c, d, cx, cy); }
      else if (cmd === "Z") cmd = "";
      else i++;
    }
    return sp.toShapes(true);
  }

  // brushed chrome: diagonal face gradient, studio-horizon reflections on the bevels and sides, a moving highlight,
  // and a flare term that blows the whole mark out to white-hot (and a warm term for the entry, lit by the room)
  const material = () => new THREE.ShaderMaterial({
    uniforms: { sweep: { value: -2 }, flare: { value: 0 }, warm: { value: 0 }, level: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vO;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vL = position; vO = normal; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float sweep; uniform float flare; uniform float warm; uniform float level; varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vO;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW); vec3 r = reflect(-v, n);
        float face = smoothstep(0.82, 0.97, abs(normalize(vO).z));
        float d = clamp(0.55 + (-vL.x*0.32 + vL.y*0.5), 0., 1.);
        vec3 faceCol = mix(vec3(0.1,0.1,0.11), vec3(1.0,1.0,1.02), smoothstep(0.12, 0.9, d));
        float y = r.y;
        vec3 env = mix(vec3(0.02,0.022,0.026), vec3(0.75,0.77,0.8), smoothstep(-0.1, 0.4, y));
        env += vec3(1.4)*exp(-pow((y-0.15)*9.,2.)) + vec3(0.5)*exp(-pow((r.x+0.5)*4.,2.));
        env *= mix(1.0, 0.75, smoothstep(0.3, -0.3, y));
        vec3 col = mix(env, faceCol, face);
        float s = exp(-pow((vW.x*0.8 + vW.y*0.5 - sweep)*2.2, 2.));
        col += vec3(1.0,0.98,0.95) * s * mix(0.55, 0.3, face);
        col *= level;
        float fr = pow(1. - max(dot(n, v), 0.), 2.5);
        col = mix(col, col * vec3(1.25,0.78,0.38) + vec3(0.35,0.16,0.02) * (0.4 + fr), warm);
        col = mix(col, mix(vec3(1.0,0.97,0.9), vec3(1.0,0.86,0.6), smoothstep(0.2,-0.6,vL.x+vL.y*0.3)) * (0.95 + 0.5*face + 0.6*fr) + col*0.2, flare);
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.DoubleSide,
  });

  const L = {}; let R, scene, camera, mesh, mat, built = false, glow, gctx;
  L.mount = (canvas, glowCanvas) => { L._c = canvas; glow = glowCanvas; gctx = glow.getContext("2d"); };
  function build() {
    built = true;
    R = new THREE.WebGLRenderer({ canvas: L._c, antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.setSize(W, H, false); R.setClearColor(0x000000, 0); R.outputEncoding = THREE.LinearEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 50); camera.position.set(0, 0, 4); camera.lookAt(0, 0, 0);
    // a deep extrusion: the reference shield is thick (its side reads at ~15% of its width)
    const g = new THREE.ExtrudeGeometry(shapes(), { depth: 11, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 1.5, bevelSegments: 4, curveSegments: 16 });
    g.computeBoundingBox();
    const bb = g.boundingBox, s = 1.7 / (bb.max.x - bb.min.x);
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    g.scale(s, -s, s);
    mat = material();
    mesh = new THREE.Mesh(g, mat); scene.add(mesh);
  }
  // returns true when anything was drawn
  L.render = function (Lf) {
    if (!built) { if (document.readyState !== "complete") return false; build(); }
    const on = Lf >= 1;
    L._c.style.display = glow.style.display = on ? "" : "none";
    if (!on) return false;
    mesh.position.set(PX(Lf), PY(Lf), PZ(Lf));
    mesh.rotation.set(PITCH(Lf), YAW(Lf), ROLL(Lf));
    mat.uniforms.flare.value = clamp(FLARE(Lf), 0, 1);
    mat.uniforms.warm.value = clamp(WARM(Lf), 0, 1);
    mat.uniforms.sweep.value = SWEEP(Lf);
    mat.uniforms.level.value = LEVEL(Lf);
    R.render(scene, camera);
    // bloom: the render downsampled, blurred and added back, much stronger during the flare
    gctx.clearRect(0, 0, glow.width, glow.height);
    gctx.filter = "blur(7px)"; gctx.drawImage(L._c, 0, 0, glow.width, glow.height); gctx.filter = "none";
    glow.style.opacity = (0.55 + 0.45 * clamp(FLARE(Lf), 0, 1)).toFixed(3);
    glow.style.filter = `blur(${(16 + 30 * clamp(FLARE(Lf), 0, 1)).toFixed(1)}px) brightness(${(1.1 + 1.4 * clamp(FLARE(Lf), 0, 1)).toFixed(2)})`;
    return true;
  };
  L.flare = (Lf) => clamp(FLARE(Lf), 0, 1);
  window.LOGO = L;
})();
