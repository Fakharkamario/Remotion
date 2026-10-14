// Beat 1: the "Slide to buy" control as a 3D road. The green knob flicks away up the track, then the camera flies low
// along it and skims over the knob (the reference's fly-over), in the light acend palette.
(function () {
  const W = 1920, H = 1080;
  const C = { bg: "#f9f8f4", haze: "#eceee7", track: "#31302e", label: "#f3f2ee", knob: "#4f8c68", chev: "#ffffff" };

  function roundedRect(w, l, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -l / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + l - r); s.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
    s.lineTo(x + r, y + l); s.quadraticCurveTo(x, y + l, x, y + l - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function chevron(w, h, t) {
    // a "^" pointing toward +y (away from the camera once laid flat)
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2); s.lineTo(0, h / 2 - t * 0.2); s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2 - t, -h / 2); s.lineTo(0, h / 2 - t * 1.55); s.lineTo(-w / 2 + t, -h / 2);
    s.closePath();
    return s;
  }

  const S = {};
  // the scene is built lazily on the first render (after page load): building the PMREM environment and compiling
  // the physical/transmission shaders is slow on the software GL used for rendering, and must not hold up page load
  S.mount = function (canvas) {
    S._canvas = canvas;
    S.render = (pose) => { if (document.readyState !== "complete") return; build(S._canvas); S.render(pose); };
    S.redrawLabel = () => {};
  };
  function build(canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.outputEncoding = THREE.LinearEncoding; // colours stay exactly as authored (legacy colour management)
    const scene = new THREE.Scene();

    // sky: warm paper fading to a faint green haze at the horizon
    const g = document.createElement("canvas"); g.width = 4; g.height = 512;
    const gx = g.getContext("2d"), grad = gx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#fbfaf6"); grad.addColorStop(0.55, C.bg); grad.addColorStop(1, C.haze);
    gx.fillStyle = grad; gx.fillRect(0, 0, 4, 512);
    const bgTex = new THREE.CanvasTexture(g);
    scene.background = bgTex;
    scene.fog = new THREE.Fog(C.haze, 22, 62);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfccc2, 0.62));
    const key = new THREE.DirectionalLight(0xffffff, 0.5); key.position.set(4, 9, 7); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.18); rim.position.set(-6, 3, -10); scene.add(rim);

    // track: a long straight pill, top surface at y = 0.12, near end at z = 4, far end at z = -27; narrower than the
    // knob, so the knob overhangs it as in the reference
    const TRACK_W = 2.5, TRACK_L = 31;
    const trackGeo = new THREE.ExtrudeGeometry(roundedRect(TRACK_W, TRACK_L, TRACK_W / 2), { depth: 0.12, bevelEnabled: false, curveSegments: 24 });
    trackGeo.rotateX(-Math.PI / 2);
    const track = new THREE.Mesh(trackGeo, new THREE.MeshStandardMaterial({ color: 0x22211f, roughness: 0.6, metalness: 0 }));
    track.position.set(0, 0, 4 - TRACK_L / 2);
    scene.add(track);

    // label printed along the track, reading away from the viewer
    const lc = document.createElement("canvas"); lc.width = 2048; lc.height = 384;
    const labelTex = new THREE.CanvasTexture(lc); labelTex.anisotropy = 8;
    const drawLabel = () => {
      const x = lc.getContext("2d");
      x.clearRect(0, 0, lc.width, lc.height);
      x.fillStyle = C.label; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = '650 250px "Inter", sans-serif';
      // a soft glow under crisp letters: reads as light through the glass knob, as in the reference
      x.shadowColor = "rgba(220,255,236,0.55)"; x.shadowBlur = 26;
      x.fillText("Slide to buy", lc.width / 2, lc.height / 2 + 8);
      x.shadowBlur = 0;
      x.fillText("Slide to buy", lc.width / 2, lc.height / 2 + 8);
      labelTex.needsUpdate = true;
    };
    drawLabel();
    const label = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 2.02), new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false }));
    label.rotation.x = -Math.PI / 2; label.rotation.z = Math.PI / 2;
    label.position.set(0, 0.125, -9.5); label.renderOrder = 1;
    scene.add(label);

    // soft studio environment for reflections: a pale dome with a few bright soft-boxes, prefiltered (PMREM)
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0xf2f1ec, side: THREE.BackSide })));
    [[0, 30, 10, 40, 14, 3.2], [-26, 12, -8, 18, 30, 1.8], [24, 10, -4, 14, 24, 1.5], [0, 6, -40, 50, 10, 1.4]].forEach(([x, y, z, w, h, k]) => {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); m.color.multiplyScalar(k);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.lookAt(0, 0, 0); envScene.add(p);
    });
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(envScene, 0.04).texture;
    track.material.envMapIntensity = 0.12; track.material.roughness = 0.5;

    // knob: a slim translucent glass slab (the label glows through it, as in the reference), bright clear-coat edges, two small glossy white chevrons and a soft contact shadow
    const knob = new THREE.Group();
    const kGeo = new THREE.ExtrudeGeometry(roundedRect(2.9, 2.6, 0.85), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.08, bevelSegments: 8, curveSegments: 24 });
    kGeo.rotateX(-Math.PI / 2); kGeo.translate(0, 0.07, 0);
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x2c7a50, transparent: true, opacity: 0.84, roughness: 0.26, metalness: 0,
      clearcoat: 0.8, clearcoatRoughness: 0.12, specularIntensity: 0.55, envMapIntensity: 0.42, depthWrite: false,
      emissive: 0x1d5c3a, emissiveIntensity: 0.35,
    });
    const kMesh = new THREE.Mesh(kGeo, glass);
    kMesh.renderOrder = 3; knob.add(kMesh);
    const chevMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9 });
    // two small raised chevrons at the centre of the face (small against the knob, as in the reference)
    [-0.1, 0.16].forEach((dz) => {
      const cg = new THREE.ExtrudeGeometry(chevron(0.5, 0.23, 0.085), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 });
      cg.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(cg, chevMat); m.position.set(0, 0.27, -dz); knob.add(m);
    });
    const sc = document.createElement("canvas"); sc.width = sc.height = 128;
    const sx = sc.getContext("2d"), sg = sx.createRadialGradient(64, 64, 4, 64, 64, 64);
    sg.addColorStop(0, "rgba(0,0,0,0.28)"); sg.addColorStop(1, "rgba(0,0,0,0)");
    sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.126;
    knob.add(shadow);
    knob.position.y = 0.12;
    scene.add(knob);

    const cam = new THREE.PerspectiveCamera(38, W / H, 0.05, 200);
    // the sky drifts from warm paper toward a faint green haze as the camera travels (the reference's white -> lavender)
    const mixHex = (a, b, k) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
    let lastTint = -1;
    const paintSky = (k) => {
      if (Math.abs(k - lastTint) < 0.004) return;
      lastTint = k;
      const gr = gx.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, mixHex("#fbfaf6", "#eef4ef", k)); gr.addColorStop(0.55, mixHex(C.bg, "#e6efe8", k)); gr.addColorStop(1, mixHex(C.haze, "#dbe7df", k));
      gx.fillStyle = gr; gx.fillRect(0, 0, 4, 512);
      bgTex.needsUpdate = true;
      scene.fog.color.set(mixHex(C.haze, "#dbe7df", k));
    };
    S.render = (pose) => {
      paintSky(Math.min(1, Math.max(0, pose.tint || 0)));
      if (!S._fontOk && document.fonts && document.fonts.check('650 250px "Inter"')) { drawLabel(); S._fontOk = true; }
      knob.position.z = pose.knobZ;
      cam.position.set(0, pose.cy, pose.cz);
      cam.lookAt(0, pose.ly, pose.lz);
      r.render(scene, cam);
    };
    S.redrawLabel = drawLabel;
    if (document.fonts) document.fonts.load('650 250px "Inter"').then(drawLabel);
  }
  window.SLIDER3D = S;
})();
