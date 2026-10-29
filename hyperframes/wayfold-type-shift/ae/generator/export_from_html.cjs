// Reads the HyperFrames build (../../index.html + assets/scene.js) and writes everything the After Effects
// generator needs, so the AE project and the HTML film share one source:
//   ../assets/art/<kind>.png     each postcard / room illustration, 1000 x 1000
//   ../assets/icons/<name>.png   each icon at 4x its on-screen size, transparent
//   layout.json                  measured positions of every text line, box and icon (transforms removed),
//                                plus the layout tables and motion profiles exposed as SCENE.consts
// Run: node export_from_html.cjs
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.resolve(__dirname, "..");
const ASC = 1984 / 2048;   // Inter hhea ascender: a text range's box top + ASC * font size = its baseline

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + path.join(ROOT, "index.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  // ---------------------------------------------------------------- measurement helpers (in the page)
  await page.addScriptTag({ content: `
    window.__ASC = ${ASC};
    window.__seek = (f) => { window.__timelines.main.seek(f / 30 + 0.0001); };
    window.__flat = (els) => els.forEach((e) => { if (e) e.style.transform = "none"; });
    // every text line inside el: text, left x, baseline y, size, weight, colour, letter-spacing (relative to origin)
    window.__lines = (el, origin) => {
      const o = origin.getBoundingClientRect(), out = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.textContent; if (!t.trim()) continue;
        const cs = getComputedStyle(n.parentElement);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const size = parseFloat(cs.fontSize), ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
        // split into lines by grouping word ranges by their top
        const words = []; const re = /\\S+/g; let m;
        while ((m = re.exec(t))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const b = r.getClientRects()[0]; if (b) words.push({ w: m[0], i: m.index, b }); }
        const groups = [];
        words.forEach((w) => { const g = groups.find((g) => Math.abs(g.top - w.b.top) < size * 0.3); if (g) g.ws.push(w); else groups.push({ top: w.b.top, ws: [w] }); });
        groups.forEach((g) => {
          const a = g.ws[0], z = g.ws[g.ws.length - 1];
          const r = document.createRange(); r.setStart(n, a.i); r.setEnd(n, z.i + z.w.length);
          const b = r.getBoundingClientRect();
          out.push({ text: t.slice(a.i, z.i + z.w.length), x: b.left - o.left, base: b.top - o.top + window.__ASC * size, w: b.width,
            size, weight: parseInt(cs.fontWeight, 10), color: cs.color, ls: ls / size, transform: cs.textTransform, align: cs.textAlign });
        });
      }
      return out;
    };
    window.__box = (el, origin) => { const o = origin.getBoundingClientRect(), b = el.getBoundingClientRect(); return { x: b.left - o.left, y: b.top - o.top, w: b.width, h: b.height }; };
  ` });

  const L = { consts: await page.evaluate(() => window.SCENE.consts), copy: await page.evaluate(() => window.SCENE.sets), sets: [] };

  for (let si = 0; si < 2; si++) {
    const base = si * 269;
    const S = {};
    // ---- phone (frame 40 of the loop), measured in phone-local px
    await page.evaluate((f) => window.__seek(f), base + 40);
    S.phone = await page.evaluate(() => {
      const ph = document.getElementById("phone"); window.__flat([ph]);
      const top = ph.querySelector(".ph-top"), bar = ph.querySelector(".ph-bar");
      const svgs = (el) => Array.from(el.querySelectorAll("svg")).map((s) => window.__box(s, ph));
      return { top: { lines: window.__lines(top, ph), icons: svgs(top) }, title: window.__lines(ph.querySelector(".ph-title"), ph),
        bar: { lines: window.__lines(bar, ph), icons: svgs(bar), boxes: Array.from(bar.children).map((c) => window.__box(c, ph)) } };
    });
    // ---- prompt card (frame 95, text fully typed), measured in prompt-world px
    await page.evaluate((f) => window.__seek(f), base + 95);
    S.prompt = await page.evaluate(() => {
      const cam = document.getElementById("pcam"); window.__flat([cam]);
      const q = (id) => document.getElementById(id);
      const chips = Array.from(cam.querySelectorAll(".pchip")).map((c) => ({ box: window.__box(c, cam), icon: window.__box(c.querySelector("svg"), cam), lines: window.__lines(c, cam) }));
      const caret = q("ptext").querySelector(".caret");
      return { ideas: { lines: window.__lines(q("ideas"), cam), icon: window.__box(q("ideas").querySelector("svg"), cam) }, chips, chev: window.__box(q("chev"), cam),
        card: window.__box(q("pcard"), cam), text: window.__lines(q("ptext"), cam), caret: window.__box(caret, cam),
        plus: window.__box(q("pplus").querySelector("svg"), cam), mark: { icon: window.__box(q("pmark").querySelector("svg"), cam), lines: window.__lines(q("pmark"), cam) },
        action: window.__lines(q("pplus").parentElement.children[3], cam), mic: window.__box(q("pmic").querySelector("svg"), cam),
        send: window.__box(q("psend"), cam), up: window.__box(q("psend").querySelector("svg"), cam) };
    });
    // ---- listing, checkout and white panel (frame 250), each measured in its own content px
    await page.evaluate((f) => window.__seek(f), base + 250);
    S.audit = await page.evaluate(() => {
      const strips = ["gridStrip", "darkStrip", "whiteStrip"].map((id) => document.getElementById(id));
      strips.forEach((s) => { s.style.left = "0px"; s.style.width = "3000px"; s.style.overflow = "visible"; s.style.display = "block"; });
      const conts = strips.map((s) => s.querySelector(".content")); window.__flat(conts);
      const [g, d, w] = conts;
      const kids = (c) => Array.from(c.children).map((e) => ({ cls: e.className, box: window.__box(e, c), lines: window.__lines(e, c), icons: Array.from(e.querySelectorAll("svg")).map((s) => window.__box(s, c)),
        bg: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).borderTopColor, bw: parseFloat(getComputedStyle(e).borderTopWidth), radius: parseFloat(getComputedStyle(e).borderTopLeftRadius),
        spans: Array.from(e.querySelectorAll("span")).map((sp) => window.__lines(sp, c)) }));
      const pills = Array.from(document.querySelectorAll(".pill")).map((p) => { p.style.display = "block"; p.style.transform = "none"; p.style.width = "auto"; const sp = p.firstChild;
        return { h: p.offsetHeight, text: window.__lines(sp, p)[0], w: sp.offsetWidth + 44, bg: getComputedStyle(p).backgroundColor, border: getComputedStyle(p).borderTopWidth, radius: parseFloat(getComputedStyle(p).borderTopLeftRadius) }; });
      return { grid: kids(g), dark: kids(d), white: kids(w), pills };
    });
    L.sets.push(S);
  }
  // ---- end card wordmark (frame 570)
  await page.evaluate(() => window.__seek(570));
  L.word = await page.evaluate(() => { const w = document.getElementById("word"); w.style.transform = "none"; w.style.filter = "none";
    const o = document.getElementById("endc"); const ln = window.__lines(w, o)[0]; return { line: ln, w: w.offsetWidth, h: w.offsetHeight }; });
  fs.writeFileSync(path.join(__dirname, "layout.json"), JSON.stringify(L, null, 1));

  // ---------------------------------------------------------------- PNG exports
  const art = path.join(OUT, "assets/art"), icons = path.join(OUT, "assets/icons");
  fs.mkdirSync(art, { recursive: true }); fs.mkdirSync(icons, { recursive: true });
  const kinds = ["sunset", "peaks", "dunes", "city", "lighthouse", "island", "cabin", "balloon", "tram", "tiles", "canal", "forest", "lake", "room", "pool", "lounge", "hearth"];
  const sheet = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  await sheet.goto("file://" + path.join(ROOT, "index.html"));
  await sheet.evaluate(() => { document.body.innerHTML = '<div id="x" style="position:absolute;left:0;top:0;width:1000px;height:1000px"></div>'; document.body.style.background = "transparent"; document.documentElement.style.background = "transparent"; });
  for (const k of kinds) {
    await sheet.evaluate((k) => { document.getElementById("x").innerHTML = window.SCENE.art(k); }, k);
    await sheet.locator("#x").screenshot({ path: path.join(art, k + ".png") });
  }
  // icons: name, svg key, css box (w, h), colour
  const ICONS = [["back", "back", 18, 18, "#141414"], ["bell", "bell", 18, 18, "#141414"], ["gear", "gear", 18, 18, "#141414"],
    ["plus_22", "plus", 22, 22, "#141414"], ["search", "search", 22, 22, "#141414"], ["bag", "bag", 20, 20, "#141414"], ["arrow", "arrow", 20, 20, "#141414"],
    ["bulb", "bulb", 44, 56, "#141414"], ["doc", "doc", 36, 46, "#141414"], ["sheet", "sheet", 36, 46, "#141414"], ["chev", "chev", 30, 46, "#141414"],
    ["plus_36", "plus", 36, 36, "#141414"], ["mark", "mark", 52, 52, "#141414"], ["mic", "mic", 40, 52, "#141414"], ["up", "up", 52, 52, "#ffffff"],
    ["plus_30", "plus", 30, 30, "#141414"], ["card", "card", 40, 40, "#ffffff"], ["help", "help", 30, 30, "#ffffff"]];
  const ip = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 4 });
  await ip.goto("file://" + path.join(ROOT, "index.html"));
  await ip.evaluate(() => { document.body.innerHTML = '<div id="i" style="position:absolute;left:10px;top:10px"></div>'; document.body.style.background = "transparent"; document.documentElement.style.background = "transparent"; });
  for (const [name, key, w, h, col] of ICONS) {
    await ip.evaluate(([key, w, h, col]) => { const d = document.getElementById("i"); d.style.width = w + "px"; d.style.height = h + "px"; d.style.color = col;
      d.innerHTML = window.SCENE.icons[key]; const s = d.firstChild; s.style.width = w + "px"; s.style.height = h + "px"; s.style.display = "block"; }, [key, w, h, col]);
    await ip.locator("#i").screenshot({ path: path.join(icons, name + ".png"), omitBackground: true });
  }
  await browser.close();
  console.log("wrote layout.json,", kinds.length, "art PNGs,", ICONS.length, "icon PNGs");
})();
