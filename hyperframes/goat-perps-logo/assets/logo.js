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
  // pose per frame, solved from the reference: our shield's silhouette fitted to the reference logo's silhouette on
  // every frame (IoU + bounding box; the tilt held to the reference's visible facing, since the mark may not be
  // stretched), then smoothed over time. Frames 0-2: not on screen yet.
  const PX = key([[3, -1.05], [4, -0.4881], [5, -0.1273], [6, 0.0412], [7, 0.0427], [8, 0.0444], [9, 0.0462], [10, 0.0480], [11, 0.0499], [12, 0.0518], [13, 0.0537], [14, 0.0555], [15, 0.0573], [16, 0.0590], [17, 0.0605], [18, 0.0618], [19, 0.0630], [20, 0.0640], [21, 0.0646], [22, 0.0651], [23, 0.0652], [24, 0.0649], [25, 0.0643], [26, 0.0633], [27, 0.0619], [28, 0.0600], [29, 0.0576], [30, 0.0547], [31, 0.0513], [32, 0.0473]]);
  const PY = key([[3, -0.22], [4, -0.2478], [5, -0.2105], [6, -0.1908], [7, -0.1685], [8, -0.1481], [9, -0.1296], [10, -0.1127], [11, -0.0975], [12, -0.0838], [13, -0.0715], [14, -0.0607], [15, -0.0511], [16, -0.0426], [17, -0.0353], [18, -0.0289], [19, -0.0235], [20, -0.0189], [21, -0.0150], [22, -0.0118], [23, -0.0091], [24, -0.0069], [25, -0.0051], [26, -0.0035], [27, -0.0022], [28, -0.0009], [29, 0.0003], [30, 0.0016], [31, 0.0031], [32, 0.0048]]);
  const PZ = key([[3, -3.2], [4, -1.7102], [5, -0.9788], [6, -0.3546], [7, -0.3215], [8, -0.2943], [9, -0.2727], [10, -0.2565], [11, -0.2452], [12, -0.2386], [13, -0.2362], [14, -0.2379], [15, -0.2431], [16, -0.2517], [17, -0.2632], [18, -0.2773], [19, -0.2937], [20, -0.3120], [21, -0.3319], [22, -0.3531], [23, -0.3753], [24, -0.3980], [25, -0.4210], [26, -0.4440], [27, -0.4665], [28, -0.4882], [29, -0.5089], [30, -0.5282], [31, -0.5457], [32, -0.5611]]);
  const PITCH = key([[3, 1.3], [4, 1.0927], [5, 0.9305], [6, 0.9100], [7, 0.7753], [8, 0.6560], [9, 0.5513], [10, 0.4602], [11, 0.3819], [12, 0.3154], [13, 0.2597], [14, 0.2141], [15, 0.1774], [16, 0.1489], [17, 0.1277], [18, 0.1127], [19, 0.1031], [20, 0.0979], [21, 0.0963], [22, 0.0972], [23, 0.0999], [24, 0.1034], [25, 0.1067], [26, 0.1090], [27, 0.1093], [28, 0.1067], [29, 0.1002], [30, 0.0891], [31, 0.0723], [32, 0.0489]]);
  const YAW = key([[3, -0.55], [4, -0.4010], [5, -0.2762], [6, -0.1333], [7, -0.0651], [8, -0.0031], [9, 0.0528], [10, 0.1030], [11, 0.1478], [12, 0.1873], [13, 0.2219], [14, 0.2519], [15, 0.2776], [16, 0.2991], [17, 0.3169], [18, 0.3311], [19, 0.3421], [20, 0.3501], [21, 0.3554], [22, 0.3583], [23, 0.3590], [24, 0.3579], [25, 0.3552], [26, 0.3513], [27, 0.3462], [28, 0.3405], [29, 0.3342], [30, 0.3278], [31, 0.3215], [32, 0.3155]]);
  const ROLL = key([[3, 1.0], [4, 0.8356], [5, 0.4141], [6, 0.0964], [7, 0.0826], [8, 0.0708], [9, 0.0608], [10, 0.0524], [11, 0.0456], [12, 0.0402], [13, 0.0361], [14, 0.0331], [15, 0.0311], [16, 0.0300], [17, 0.0297], [18, 0.0299], [19, 0.0306], [20, 0.0316], [21, 0.0329], [22, 0.0342], [23, 0.0355], [24, 0.0365], [25, 0.0372], [26, 0.0375], [27, 0.0371], [28, 0.0360], [29, 0.0341], [30, 0.0311], [31, 0.0270], [32, 0.0217]]);
  const FLARE = key([[3, 0.0], [4, 0.15], [5, 0.45], [6, 0.8], [7, 1.0], [8, 0.95], [9, 0.7], [10, 0.35], [11, 0.12], [12, 0.0], [32, 0.0]]);
  const WARM = key([[3, 1.0], [4, 0.9], [5, 0.45], [6, 0.1], [7, 0.0], [32, 0.0]]);
  const SWEEP = key([[10, -1.8], [32, 1.6]]);
  const LEVEL = key([[3, 0.55], [4, 0.75], [11, 0.9], [12, 0.92], [16, 0.97], [20, 1.0], [24, 1.03], [28, 0.97], [32, 0.84]]);

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

  const L = {}; let R, scene, camera, mesh, mat, built = false, glow, gctx, rtS, rtA, qScene, qCam, qMat;
  // true motion blur: every output frame averages SAMPLES renders spread over a SHUTTER-wide window of time
  const SAMPLES = 24, SHUTTER = 0.55, FIRST = 2.75;
  // slowed playback: output frame -> reference frame. The reference's 33 frames play over 54, with the swing
  // (reference 3-7) decelerating continuously over output frames 2-22 and the settle (7-32) gliding out over 22-53
  const RMAP = key([[0, 2.2], [2, 2.85], [4, 3.75], [6, 4.538], [8, 5.215], [10, 5.786], [12, 6.253], [14, 6.621], [16, 6.892], [18, 7.074], [20, 7.173], [22, 7.2], [32, 12.5], [42, 20.5], [53, 32]]);
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
    const bb = g.boundingBox, s = 1.88 / (bb.max.x - bb.min.x);
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    g.scale(s, -s, s);
    mat = material();
    mesh = new THREE.Mesh(g, mat); scene.add(mesh);
    const opt = { type: THREE.FloatType, depthBuffer: true };
    rtS = new THREE.WebGLRenderTarget(W, H, opt); rtA = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, depthBuffer: false });
    qMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, k: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending, premultipliedAlpha: true,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: `uniform sampler2D t; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv) * k; }` });
    qScene = new THREE.Scene(); qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), qMat));
  }
  // the swing in, on one continuous ease-out: from the entry pose (reference frame 3) to the settled pose (reference
  // frame 7.2) over output frames 2-22, so the speed falls off smoothly instead of stopping at a knee
  // flare and entry warmth on output frames (the reference's ~6-frame white-hot swell, stretched only slightly)
  const FLARE_O = key([[2, 0], [5, 0.18], [8, 0.55], [11, 0.92], [13, 1.0], [15, 0.85], [17, 0.55], [19, 0.28], [21, 0.1], [23, 0.0], [53, 0.0]]);
  const WARM_O = key([[2, 1], [5, 0.9], [8, 0.45], [11, 0.12], [13, 0.0], [53, 0.0]]);
  const ARRIVE = 22, ENTRY = [-1.05, -0.22, -2.8, 1.25, -0.55, 0.9];
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  function glide(t) {
    const k = easeOut((t - 2) / (ARRIVE - 2)), S = [PX(7.2), PY(7.2), PZ(7.2), PITCH(7.2), YAW(7.2), ROLL(7.2)];
    const v = ENTRY.map((e, i) => e + (S[i] - e) * k);
    mesh.position.set(v[0], v[1], v[2]); mesh.rotation.set(v[3], v[4], v[5]);
  }
  function pose(t) {
    mesh.position.set(PX(t), PY(t), PZ(t));
    mesh.rotation.set(PITCH(t), YAW(t), ROLL(t));
    mat.uniforms.flare.value = clamp(FLARE(t), 0, 1);
    mat.uniforms.warm.value = clamp(WARM(t), 0, 1);
    mat.uniforms.sweep.value = SWEEP(t);
    mat.uniforms.level.value = LEVEL(t);
  }
  // returns true when anything was drawn
  L.render = function (Lf) {
    if (!built) { if (document.readyState !== "complete") return false; build(); }
    const on = RMAP(Lf + SHUTTER / 2) >= FIRST;
    L._c.style.display = glow.style.display = on ? "" : "none";
    if (!on) return false;
    // accumulate SAMPLES sub-frame renders (premultiplied, transparent background) into rtA, then present it
    R.setRenderTarget(rtA); R.setClearColor(0x000000, 0); R.clear();
    qMat.uniforms.k.value = 1 / SAMPLES;
    for (let i = 0; i < SAMPLES; i++) {
      const t = Lf + ((i + 0.5) / SAMPLES - 0.5) * SHUTTER;
      const r = RMAP(t);
      if (r < FIRST) continue; // the mark appears during this frame's shutter
      pose(r);
      if (t < ARRIVE) glide(t);
      mat.uniforms.flare.value = clamp(FLARE_O(t), 0, 1);
      mat.uniforms.warm.value = clamp(WARM_O(t), 0, 1);
      R.setRenderTarget(rtS); R.setClearColor(0x000000, 0); R.clear(); R.render(scene, camera);
      qMat.uniforms.t.value = rtS.texture; R.setRenderTarget(rtA); R.autoClear = false; R.render(qScene, qCam); R.autoClear = true;
    }
    qMat.uniforms.t.value = rtA.texture; qMat.uniforms.k.value = 1; qMat.blending = THREE.NoBlending;
    R.setRenderTarget(null); R.setClearColor(0x000000, 0); R.clear(); R.render(qScene, qCam);
    qMat.blending = THREE.AdditiveBlending;
    // bloom: the render downsampled, blurred and added back, much stronger during the flare
    gctx.clearRect(0, 0, glow.width, glow.height);
    gctx.filter = "blur(7px)"; gctx.drawImage(L._c, 0, 0, glow.width, glow.height); gctx.filter = "none";
    glow.style.opacity = (0.55 + 0.45 * L.flare(Lf)).toFixed(3);
    glow.style.filter = `blur(${(16 + 30 * L.flare(Lf)).toFixed(1)}px) brightness(${(1.1 + 1.4 * L.flare(Lf)).toFixed(2)})`;
    return true;
  };
  L.flare = (Lf) => clamp(FLARE_O(Lf), 0, 1);
  window.LOGO = L;
})();
