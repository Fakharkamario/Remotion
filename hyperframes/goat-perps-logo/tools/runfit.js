const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = process.argv[2], which = process.argv[3] || 'all';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 480, height: 270 } });
  p.on('console', (m) => console.log('page:', m.text()));
  await p.goto('file://' + path.join(dir, 'fit.html'));
  await p.waitForFunction('window.ready === true');
  const T = JSON.parse(fs.readFileSync(path.join(dir, 'targets_b64.json')));
  const init = [0.13, -0.11, 0.02, 0.45, 0.55, 0.0];
  let order = [[9, null]], prior = null, seed = null;
  if (which === 'all') { for (let n = 10; n <= 32; n++) order.push([n, n - 1]); for (let n = 8; n >= 3; n--) order.push([n, n + 1]); }
  if (which === 'prior') {
    const P = JSON.parse(fs.readFileSync(path.join(dir, 'poses.json')));
    const lerpK = (k, t) => { for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) { const u = (t - k[i][0]) / (k[i + 1][0] - k[i][0]); return k[i][1] + (k[i + 1][1] - k[i][1]) * u; } return k[k.length - 1][1]; };
    const PK = [[6, 0.85], [8, 0.7], [10, 0.45], [12, 0.24], [16, 0.13], [24, 0.09], [32, 0.07]], RK = [[6, 0.08], [10, 0.02], [32, 0.0]];
    prior = {}; seed = {}; order = [];
    for (let n = 6; n <= 32; n++) { prior[n] = [lerpK(PK, n), lerpK(RK, n)]; const s = P[n].x.slice(); s[3] = prior[n][0]; s[5] = prior[n][1]; seed[n] = s; order.push([n, n === 6 ? null : n - 1]); }
  }
  const t0 = Date.now();
  const out = await p.evaluate(async ([T, order, init, prior, seed]) => await window.solve(T, order, init, prior, seed), [T, order, init, prior, seed]);
  console.log('secs', (Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(dir, which === 'all' ? 'poses.json' : which === 'prior' ? 'poses_prior.json' : 'pose_test.json'), JSON.stringify(out));
  for (const k of Object.keys(out).sort((a, b) => a - b)) console.log(k, out[k].v.toFixed(3), out[k].x.map((v) => v.toFixed(3)).join(' '));
  await b.close();
})();
