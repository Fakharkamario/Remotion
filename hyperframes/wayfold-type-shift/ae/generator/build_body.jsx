// =============================================================================
// Wayfold "type shift" - After Effects rebuild (body). The generator pastes ae_build_lib.jsx above this and
// the measured layout + fitted keys (DATA) between them. ExtendScript ES3 only.
// =============================================================================

// ---------------------------------------------------------------- small helpers on top of the library
var FONT_FILES = ["Inter-Regular", "Inter-Medium", "Inter-SemiBold", "Inter-Bold"];
var ASSET_CACHE = {};
var ROOT = null, FOLD = null;

function asset(rel) {
  if (ASSET_CACHE[rel] !== undefined) return ASSET_CACHE[rel];
  var it = importAsset(ROOT, rel, FOLD.ref);
  ASSET_CACHE[rel] = it;
  return it;
}

// Keys from the generator: [t (s, comp time), value, speedIn, speedOut, inflIn %, inflOut %, holdIn, holdOut].
// Values and speeds are numbers, or arrays for multi-value properties (Scale, Rect Size).
function applyKeys(L, which, K) {
  if (!K || !K.length) return;
  var p = getter(L, which)(), i, d, n = easeCount(p), times = [];
  for (i = 0; i < K.length; i++) { times.push(fr(K[i][0])); setKeySafe(p, times[i], K[i][1]); }
  var bez = canBezier(p);
  for (i = 0; i < K.length; i++) {
    var k = p.nearestKeyIndex(times[i]);
    if (!bez) { try { p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (e0) { } KEY_COUNT++; continue; }
    var tin = K[i][6] ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.BEZIER;
    var tout = K[i][7] ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.BEZIER;
    p.setInterpolationTypeAtKey(k, tin, tout);
    var inE = [], outE = [];
    for (d = 0; d < n; d++) {
      var si = (K[i][2] instanceof Array) ? (d < K[i][2].length ? K[i][2][d] : 0) : K[i][2];
      var so = (K[i][3] instanceof Array) ? (d < K[i][3].length ? K[i][3][d] : 0) : K[i][3];
      inE.push(new KeyframeEase(si, Math.max(0.1, Math.min(100, K[i][4]))));
      outE.push(new KeyframeEase(so, Math.max(0.1, Math.min(100, K[i][5]))));
    }
    setEaseSafe(p, k, inE, outE);
    KEY_COUNT++;
  }
}
// Hold keys on any property: [[t, value], ...]
function holdKeys(L, which, K) {
  if (!K || !K.length) return;
  var p = getter(L, which)(), i;
  for (i = 0; i < K.length; i++) setKeySafe(p, fr(K[i][0]), K[i][1]);
  for (i = 0; i < K.length; i++) { try { p.setInterpolationTypeAtKey(p.nearestKeyIndex(fr(K[i][0])), KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (e) { } KEY_COUNT++; }
}
function rectShape(x, y, w, h) { var s = new Shape(); s.vertices = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; s.closed = true; return s; }
// Mask keys: [[t, w, h, in, out]] where in/out = "hold" or "linear"; the mask is a centred w x h box on a 1000 px art image.
function maskKeys(L, K) {
  var m = prop(prop(prop(L, "ADBE Mask Parade"), "Crop"), "ADBE Mask Shape"), i;
  for (i = 0; i < K.length; i++) m.setValueAtTime(fr(K[i][0]), rectShape(500 - K[i][1] / 2, 500 - K[i][2] / 2, K[i][1], K[i][2]));
  for (i = 0; i < K.length; i++) {
    var ti = (K[i][3] == "hold") ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.LINEAR;
    var to = (K[i][4] == "hold") ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.LINEAR;
    try { m.setInterpolationTypeAtKey(m.nearestKeyIndex(fr(K[i][0])), ti, to); } catch (e) { }
    KEY_COUNT++;
  }
}
function fontFor(weight) { if (weight < 475) return "Inter-Regular"; if (weight < 550) return "Inter-Medium"; if (weight < 650) return "Inter-SemiBold"; return "Inter-Bold"; }

// One measured text line: anchor = baseline-left (or baseline-centre), position = (x, baseline).
function textAt(c, it) {
  var L = c.layers.addText(it.str); L.name = it.name;
  var sp = prop(prop(L, "ADBE Text Properties"), "ADBE Text Document"), d = sp.value;
  if (d.resetCharStyle) d.resetCharStyle(); if (d.resetParagraphStyle) d.resetParagraphStyle();
  setFont(d, fontFor(it.weight)); d.fontSize = it.size; d.applyFill = true; d.fillColor = rgb(it.color); d.applyStroke = false;
  d.tracking = it.track || 0;
  d.justification = (it.just == "center") ? ParagraphJustification.CENTER_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
  sp.setValue(d);
  setv(A(L), [0, it.ay || 0]); setv(P(L), [it.x, it.y]);
  L.label = 15; LAYER_COUNT++;
  if (it.op != null) setv(O(L), it.op);
  return L;
}
// Rounded box (fill and/or stroke). Anchor = top-left corner of the box unless it.anchor says otherwise.
function boxAt(c, it) {
  var L = shp(c, it.name, it.x, it.y);
  var g = grp(L, it.name);
  var w = it.w, h = it.h, inset = it.sw ? it.sw / 2 : 0;   // CSS borders sit inside the box; AE strokes sit on the path
  rect(g, w - 2 * inset, h - 2 * inset, w / 2, h / 2, Math.max(0, (it.r || 0) - inset));
  if (it.fill) fill(g, it.fill, it.fop == null ? 100 : it.fop);
  if (it.sw) stroke(g, it.stroke, it.sw);
  if (it.op != null) setv(O(L), it.op);
  return L;
}
// Icon PNG exported at 4x its size: placed centred on its measured box at 25 %.
function iconAt(c, it) {
  var item = asset("assets/icons/" + it.file + ".png");
  if (!item) return null;
  var L = c.layers.add(item); L.name = it.name;
  var iw = (typeof item.width == "number" && item.width > 0) ? item.width : it.w * 4;     // icons are exported at 4x
  var ih = (typeof item.height == "number" && item.height > 0) ? item.height : it.h * 4;
  setv(A(L), [iw / 2, ih / 2]);
  setv(P(L), [it.x + it.w / 2, it.y + it.h / 2]); sv(L, [25, 25]);
  L.label = 15; LAYER_COUNT++; return L;
}
// Illustration (1000 x 1000 PNG) cropped to a box by a mask: cover-fit, centred.
function artAt(c, it) {
  var item = asset("assets/art/" + it.file + ".png");
  if (!item) return null;
  var L = c.layers.add(item); L.name = it.name;
  setv(A(L), [500, 500]);
  var s = Math.max(it.w, it.h) / 1000;
  setv(P(L), [it.x + it.w / 2, it.y + it.h / 2]); sv(L, [s * 100, s * 100]);
  try { addMask(L, "Crop", rectShape(500 - it.w / s / 2, 500 - it.h / s / 2, it.w / s, it.h / s)); L.cropped = true; }
  catch (e) { WARN.push(c.name + " > " + it.name + ": crop mask failed, image is uncropped (" + e.toString() + ")"); }
  L.label = 15; LAYER_COUNT++; return L;
}
function drawItems(c, items, parent) {
  var out = {}, i;
  for (i = 0; i < items.length; i++) {
    var it = items[i], L = null;
    if (it.k == "text") L = textAt(c, it);
    else if (it.k == "box") L = boxAt(c, it);
    else if (it.k == "icon") L = iconAt(c, it);
    else if (it.k == "art") L = artAt(c, it);
    if (!L) continue;
    if (parent) parentTo(L, parent);
    if (it.blur) blur(L);
    out[it.name] = L;
  }
  return out;
}
function solid(c, hex, name) { var L = c.layers.addSolid(rgb(hex), name, W, H, 1); L.name = name; L.label = 15; LAYER_COUNT++; return L; }
function trimTo(L, a, b) { if (a != null) L.inPoint = fr(a); if (b != null) L.outPoint = fr(b); }
function guide(c, lines) {
  var L = c.layers.addText(lines.join("\r")); L.name = "GUIDE_READ_ME";
  var sp = prop(prop(L, "ADBE Text Properties"), "ADBE Text Document"), d = sp.value;
  setFont(d, "Inter-Regular"); d.fontSize = 20; d.applyFill = true; d.fillColor = [1, 1, 1]; d.applyStroke = true; d.strokeColor = [0, 0, 0]; d.strokeWidth = 3;
  d.justification = ParagraphJustification.LEFT_JUSTIFY; sp.setValue(d);
  setv(P(L), [40, 60]); L.guideLayer = true; L.enabled = false; L.label = 2; LAYER_COUNT++;
  try { L.comment = lines.join("\n"); } catch (e) { }
  return L;
}
function markers(L, list) {
  var mp = prop(L, "ADBE Marker"), i;
  for (i = 0; i < list.length; i++) mp.setValueAtTime(fr(list[i][0]), new MarkerValue(list[i][1]));
}
function compMarkers(c, list) { try { for (var i = 0; i < list.length; i++) c.markerProperty.setValueAtTime(fr(list[i][0]), new MarkerValue(list[i][1])); } catch (e) { } }
function shapeProp(L, gname, mn, sub) { return function () { var g = prop(prop(L, "ADBE Root Vectors Group"), gname); var s = prop(prop(g, "ADBE Vectors Group"), mn); return sub ? prop(s, sub) : s; }; }
function fxProp(L, fxName, idx) { return function () { return prop(prop(L, "ADBE Effect Parade"), fxName).property(idx); }; }
function pre(name, w, h, dur, comment) { return makeComp(name, dur, FOLD.pre, comment, w, h); }
function place(c, comp, name, ax, ay, x, y) { var L = c.layers.add(comp); L.name = name; setv(A(L), [ax, ay]); setv(P(L), [x, y]); L.label = 15; LAYER_COUNT++; return L; }

// ---------------------------------------------------------------- PRE_Paper: cream paper, slow rings, blinking confetti
function buildPaper() {
  var D = DATA.paper, c = pre("PRE_Paper", W, H, DATA.dur, "Shared background for the collage and phone shots: cream paper, slow rings and blinking confetti squares. Used in S1/S2 of both passes with a start offset so the confetti keeps going across the cut.");
  var bg = solid(c, D.base, "BG_Paper");
  try {
    var fx = prop(bg, "ADBE Effect Parade").addProperty("ADBE Ramp"); fx.name = "Paper Glow";
    fx.property(1).setValue(D.ramp[0]); fx.property(2).setValue(rgb(D.ramp[1])); fx.property(3).setValue(D.ramp[2]); fx.property(4).setValue(rgb(D.ramp[3])); fx.property(5).setValue(2);
  } catch (e) { WARN.push("PRE_Paper: paper glow skipped, flat paper colour instead (" + e.toString() + ")"); }
  bg.locked = true;
  var cp = nul(c, "CTRL_Paper", 960, 560);
  ctl(cp, "slider", "First Ring (px)", D.ring0); ctl(cp, "slider", "Ring Gap (px)", D.gap); ctl(cp, "slider", "Ring Speed (px/s)", D.speed);
  var cc = nul(c, "CTRL_Confetti", 960, 540);
  ctl(cc, "slider", "Life (frames)", D.life); ctl(cc, "slider", "Life Spread (frames)", D.spread); ctl(cc, "slider", "On Time (%)", D.onMin);
  ctl(cc, "slider", "On Time Spread (%)", D.onSpread); ctl(cc, "slider", "Drift (px)", D.drift); ctl(cc, "slider", "Size Min (px)", D.sizeMin);
  ctl(cc, "slider", "Size Max (px)", D.sizeMax); ctl(cc, "slider", "Orange Share (%)", D.orange); ctl(cc, "slider", "Seed", 1);
  ctl(cc, "color", "Orange A", rgb(D.cols[0])); ctl(cc, "color", "Orange B", rgb(D.cols[1])); ctl(cc, "color", "Grey", rgb(D.cols[2]));
  var i;
  for (i = 1; i <= D.rings; i++) {
    var R1 = shp(c, "Ring_" + i, 960, 560), g = grp(R1, "Ring");
    ell(g, 300, 300, 0, 0); stroke(g, D.ringCol, 2);
    prop(prop(prop(g, "ADBE Vectors Group"), "ADBE Vector Graphic - Stroke"), "ADBE Vector Stroke Opacity").setValue(D.ringOp);
    ctl(R1, "slider", "Order", i); R1.label = 10;
    expr(R1, shapeProp(R1, "Ring", "ADBE Vector Shape - Ellipse", "ADBE Vector Ellipse Size"),
      ["// RINGS: each ring grows slowly outward and wraps round to the inside. Controls: CTRL_Paper > First Ring (px), Ring Gap (px), Ring Speed (px/s). This layer: Order.",
       "var c = thisComp.layer(\"CTRL_Paper\");",
       "var gap = Math.max(1, c.effect(\"Ring Gap (px)\")(\"Slider\"));",
       "var r = c.effect(\"First Ring (px)\")(\"Slider\") + (effect(\"Order\")(\"Slider\") - 1) * gap + ((time * c.effect(\"Ring Speed (px/s)\")(\"Slider\")) % gap);",
       "[2 * r, 2 * r];"].join("\n"));
  }
  // every confetti expression replays the same random numbers for its square and cycle, in the same order:
  // 1 on-time, 2 x, 3 y, 4 size, 5 orange or grey, 6 which orange
  var head = ["var c = thisComp.layer(\"CTRL_Confetti\");",
    "var o = effect(\"Order\")(\"Slider\");",
    "var life = Math.max(2, c.effect(\"Life (frames)\")(\"Slider\") + (o % 5) * c.effect(\"Life Spread (frames)\")(\"Slider\"));",
    "var f = Math.floor(timeToFrames(time)) + (o * 5) % life;",
    "var cyc = Math.floor(f / life), local = (f % life) / life;",
    "seedRandom(c.effect(\"Seed\")(\"Slider\") * 1000 + o * 7919 + cyc * 104729, true);",
    "var onT = (c.effect(\"On Time (%)\")(\"Slider\") + random() * c.effect(\"On Time Spread (%)\")(\"Slider\")) / 100;",
    "var x = random(20, thisComp.width - 20), y = random(20, thisComp.height - 20);",
    "var sz = c.effect(\"Size Min (px)\")(\"Slider\") + random() * (c.effect(\"Size Max (px)\")(\"Slider\") - c.effect(\"Size Min (px)\")(\"Slider\"));",
    "var isOrange = random() * 100 < c.effect(\"Orange Share (%)\")(\"Slider\"), pick = random();"].join("\n");
  var ctrlLine = "Controls: CTRL_Confetti > Life (frames), Life Spread (frames), On Time (%), On Time Spread (%), Drift (px), Size Min/Max (px), Orange Share (%), colours, Seed. This layer: Order.";
  for (i = 1; i <= D.count; i++) {
    var Q = shp(c, "Confetti_" + (i < 10 ? "0" : "") + i, 0, 0), q = grp(Q, "Square");
    rect(q, 16, 16, 0, 0, 0); fill(q, D.cols[0]);
    ctl(Q, "slider", "Order", i - 1); Q.label = 10;
    expr(Q, "pos", "// CONFETTI POSITION: blinks on at a random spot, drifts up while on, then respawns elsewhere. " + ctrlLine + "\n" + head + "\n[x, y - local * c.effect(\"Drift (px)\")(\"Slider\")];");
    expr(Q, "op", "// CONFETTI BLINK: on for the first On Time of each life, then off. " + ctrlLine + "\n" + head + "\nlocal < onT ? 100 : 0;");
    expr(Q, shapeProp(Q, "Square", "ADBE Vector Shape - Rect", "ADBE Vector Rect Size"), "// CONFETTI SIZE: random between Size Min and Size Max each life. " + ctrlLine + "\n" + head + "\n[sz, sz];");
    expr(Q, shapeProp(Q, "Square", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color"), "// CONFETTI COLOUR: Orange A or B (Orange Share % of the time) or Grey. " + ctrlLine + "\n" + head + "\nisOrange ? (pick < 0.5 ? c.effect(\"Orange A\")(\"Color\") : c.effect(\"Orange B\")(\"Color\")) : c.effect(\"Grey\")(\"Color\");");
  }
  guide(c, ["PRE_Paper: background for the collage and phone shots.",
    "Rings: CTRL_Paper > First Ring (px), Ring Gap (px), Ring Speed (px/s) (0 = still).",
    "Confetti: CTRL_Confetti > Life (frames) = how long each square lives, On Time (%) = how much of it it is visible,",
    "  Drift (px) = how far it rises while on, Size Min/Max, Orange Share (%), the three colours, Seed = a new random layout.",
    "Confetti is random (seeded), so squares sit in different places than the HTML render; the rhythm and look match.",
    "Want plain keys instead? Select the property > Animation > Keyframe Assistant > Convert Expression to Keyframes."]);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- S1: postcard collage
function buildCollage(pi) {
  var D = DATA.passes[pi], S1 = D.collage;
  var c = makeComp("S1" + D.tag + "_Collage_" + D.name, S1.dur, FOLD.scenes, "Pass " + D.tag + " (" + D.name + "). Postcards pop on in type-shift steps (frames 0, 2, 4, 5), then a slow push-in. Starts at frame " + S1.at + " in MAIN.");
  var pp = place(c, PAPER, "Paper", 960, 540, 960, 540); pp.startTime = -S1.at / FPS; pp.locked = true;
  var cam = nul(c, "CAM_Collage", 960, 540, 1);
  applyKeys(cam, "scale", S1.cam);
  var i;
  for (i = 0; i < S1.tiles.length; i++) {
    var T = S1.tiles[i], L = artAt(c, { name: "Postcard_" + (i + 1) + "_" + T.file, file: T.file, x: T.x, y: T.y, w: T.w, h: T.h });
    if (!L) continue;
    parentTo(L, cam); sep(L); blur(L);
    applyKeys(L, "x", T.kx); applyKeys(L, "y", T.ky); applyKeys(L, "scale", T.ks);
    trimTo(L, T.inAt, null);
  }
  compMarkers(c, S1.markers);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- S2: phone
function buildPhone(pi) {
  var D = DATA.passes[pi], S2 = D.phone;
  var c = makeComp("S2" + D.tag + "_Phone_" + D.name, S2.dur, FOLD.scenes, "Pass " + D.tag + " (" + D.name + "). The postcards re-flow into the Wayfold phone, the card settles, then scrolls out upwards. Starts at frame " + S2.at + " in MAIN.");
  var pp = place(c, PAPER, "Paper", 960, 540, 960, 540); pp.startTime = -S2.at / FPS; pp.locked = true;
  var g = nul(c, "GRP_Phone", 960, 540, 1);
  applyKeys(g, "scale", S2.grpS); sep(g); applyKeys(g, "y", S2.grpY);
  var card = boxAt(c, S2.card); parentTo(card, g); blur(card); trimTo(card, S2.cardIn, null);
  try {
    var fx = prop(card, "ADBE Effect Parade").addProperty("ADBE Drop Shadow"); fx.name = "Card Shadow";
    fx.property(1).setValue(rgb(S2.shadow.col)); fx.property(3).setValue(180); fx.property(4).setValue(S2.shadow.dist); fx.property(5).setValue(S2.shadow.soft);
    var op = fx.property(2); try { op.setValue((op.hasMax && op.maxValue > 100) ? S2.shadow.op * 2.55 : S2.shadow.op); } catch (e) { op.setValue(S2.shadow.op); }
  } catch (e2) { WARN.push(c.name + ": card shadow skipped (" + e2.toString() + ")"); }
  var head = drawItems(c, S2.header, g), k;
  for (k in head) { if (head.hasOwnProperty(k)) blur(head[k]); }
  var bar = drawItems(c, S2.bar, g);
  for (k in bar) { if (bar.hasOwnProperty(k)) { blur(bar[k]); trimTo(bar[k], S2.cardIn, null); } }
  var matte = boxAt(c, S2.matte); matte.name = "MATTE_PhoneScreen"; parentTo(matte, g);
  holdKeys(matte, shapeProp(matte, S2.matte.name, "ADBE Vector Shape - Rect", "ADBE Vector Rect Size"), S2.matteSize);
  matte.comment = "Clips the postcards to the phone screen once the white card appears (before that it is big enough to show everything). Parented to GRP_Phone.";
  var i;
  for (i = 0; i < S2.tiles.length; i++) {
    var T = S2.tiles[i], L = artAt(c, { name: "Tile_" + (i + 1) + "_" + T.file, file: T.file, x: T.x, y: T.y, w: T.w, h: T.h });
    if (!L) continue;
    parentTo(L, g); sep(L); blur(L);
    applyKeys(L, "x", T.kx); applyKeys(L, "y", T.ky); applyKeys(L, "scale", T.ks); if (L.cropped) maskKeys(L, T.mask);
    MATTES.push([L, matte, TrackMatteType.ALPHA]);
  }
  compMarkers(c, S2.markers);
  guide(c, ["S2 Phone: GRP_Phone carries the whole phone (Scale and Y keys = the settle and the exit).",
    "Tiles re-flow by keys on their own Position, Scale and Crop mask (frames 24-30).",
    "Clip: every Tile uses MATTE_PhoneScreen (alpha); its Size is held huge until the card appears."]);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- S3: prompt card + send close-up
function buildPrompt(pi) {
  var D = DATA.passes[pi], S3 = D.prompt;
  var c = makeComp("S3" + D.tag + "_Prompt_" + D.name, S3.dur, FOLD.scenes, "Pass " + D.tag + " (" + D.name + "). The prompt card glides up and types the request, then a 1.6x close-up on the send button: the button heats from black to orange and the cursor presses. Starts at frame " + S3.at + " in MAIN.");
  solid(c, S3.bg, "BG_Prompt").locked = true;
  var cam = nul(c, "CAM_Prompt", 0, 0, 1);
  sep(cam); applyKeys(cam, "x", S3.camX); applyKeys(cam, "y", S3.camY); applyKeys(cam, "scale", S3.camS);
  cam.comment = "Anchor and position start at 0,0 so children use the prompt's own layout coordinates. Wide shot until the cut, then Scale 160 = the close-up.";
  var ct = nul(c, "CTRL_Type", 0, 0);
  ctl(ct, "slider", "Typed (%)", 0); ctl(ct, "slider", "Caret Gap (px)", S3.caretGap); ctl(ct, "slider", "Caret Lift (px)", S3.caretLift);
  applyKeys(ct, function () { return ctlProp(ct, "Typed (%)"); }, S3.typed);
  var cs = nul(c, "CTRL_Send", S3.sendC[0], S3.sendC[1]);
  ctl(cs, "slider", "Heat (%)", 0); ctl(cs, "color", "Cold Colour", rgb(S3.cold)); ctl(cs, "color", "Hot Colour", rgb(S3.hot));
  applyKeys(cs, function () { return ctlProp(cs, "Heat (%)"); }, S3.heat);
  var items = drawItems(c, S3.items, cam), k;
  for (k in items) { if (items.hasOwnProperty(k)) blur(items[k]); }
  // chip 2 fades out to the right
  var fm = solid(c, "#FFFFFF", "MATTE_Chip2Fade"); setv(A(fm), [0, 0]); setv(P(fm), [S3.fade.x, S3.fade.y]);
  sv(fm, [S3.fade.w / W * 100, S3.fade.h / H * 100]); parentTo(fm, cam);
  var wipeOk = true;
  try {
    var lw = prop(fm, "ADBE Effect Parade").addProperty("ADBE Linear Wipe"); lw.name = "Fade";
    lw.property(1).setValue(S3.fade.completion); lw.property(2).setValue(270); lw.property(3).setValue(S3.fade.feather);
  } catch (e3) { wipeOk = false; WARN.push(c.name + ": chip fade skipped, chip 2 shows unfaded (" + e3.toString() + ")"); fm.remove(); }
  if (wipeOk) {
    fm.comment = "Alpha matte that fades the second chip out on the right (Linear Wipe: Completion = where, Feather = how soft).";
    for (k = 0; k < S3.fadeTargets.length; k++) if (items[S3.fadeTargets[k]]) MATTES.push([items[S3.fadeTargets[k]], fm, TrackMatteType.ALPHA]);
  }
  // typed text + caret
  var txt = items[S3.textName];
  ctl(ct, "layer", "Text Layer", txt);
  expr(txt, function () { return prop(prop(txt, "ADBE Text Properties"), "ADBE Text Document"); },
    ["// TYPING: shows the first Typed (%) of this layer's text. Controls: CTRL_Type > Typed (%) keys (the typing speed). Edit the full line in this layer's text.",
     "var p = thisComp.layer(\"CTRL_Type\").effect(\"Typed (%)\")(\"Slider\") / 100;",
     "var full = value.toString();",
     "full.substr(0, Math.floor(Math.max(0, Math.min(1, p)) * full.length + 0.001));"].join("\n"));
  txt.label = 10;
  var caret = boxAt(c, S3.caret); parentTo(caret, cam); caret.label = 10; blur(caret);
  expr(caret, "pos", ["// CARET: sits just after the typed text. Controls: CTRL_Type > Text Layer, Caret Gap (px), Caret Lift (px).",
    "var c = thisComp.layer(\"CTRL_Type\");",
    "var L = c.effect(\"Text Layer\")(\"Layer\");",
    "var r = L.sourceRectAtTime(time, false);",
    "[L.transform.position[0] + r.left + r.width + c.effect(\"Caret Gap (px)\")(\"Slider\"), L.transform.position[1] - c.effect(\"Caret Lift (px)\")(\"Slider\")];"].join("\n"));
  holdKeys(caret, "op", S3.caretOp);
  // send button: GRP_Send carries the press, the button colour follows CTRL_Send > Heat (%)
  var gs = nul(c, "GRP_Send", S3.sendC[0], S3.sendC[1], 1); parentTo(gs, cam);
  applyKeys(gs, "scale", S3.press);
  var btn = boxAt(c, S3.sendBox); parentTo(btn, gs); blur(btn); btn.label = 10;
  expr(btn, shapeProp(btn, S3.sendBox.name, "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color"),
    ["// SEND HEAT: blends Cold Colour into Hot Colour as Heat (%) goes from 0 to 100. Controls: CTRL_Send > Heat (%) keys (when and how fast), Cold Colour, Hot Colour.",
     "var c = thisComp.layer(\"CTRL_Send\");",
     "var h = Math.max(0, Math.min(1, c.effect(\"Heat (%)\")(\"Slider\") / 100));",
     "add(mul(c.effect(\"Cold Colour\")(\"Color\"), 1 - h), mul(c.effect(\"Hot Colour\")(\"Color\"), h));"].join("\n"));
  var up = iconAt(c, S3.up); if (up) { parentTo(up, gs); blur(up); }
  // the black cursor (screen space, not under the camera)
  var cur = shp(c, "CURSOR_Click", 0, 0), cg = grp(cur, "Cursor");
  pth(cg, S3.cursor.pts, true); fill(cg, "#0B0B0B"); stroke(cg, "#FFFFFF", 4, true);
  sep(cur); applyKeys(cur, "x", S3.curX); applyKeys(cur, "y", S3.curY); applyKeys(cur, "scale", S3.curS);
  trimTo(cur, S3.curIn, null); blur(cur);
  cur.comment = "Anchor = top-left of the cursor's box (as in the source), so the press shrinks it towards that corner.";
  compMarkers(c, S3.markers);
  guide(c, ["S3 Prompt: CAM_Prompt = wide glide, then the close-up (Scale 160) at the cut marker.",
    "Typing speed: CTRL_Type > Typed (%) keys. The full line lives in the PromptText layer.",
    "Caret: follows the text (CTRL_Type > Caret Gap/Lift); blink = hold keys on its Opacity.",
    "Button colour: CTRL_Send > Heat (%) keys + Cold/Hot Colour. Press = GRP_Send Scale keys; cursor press = CURSOR_Click Scale keys.",
    "Mattes: Chip 2 bg/icon/text use MATTE_Chip2Fade (Linear Wipe).",
    "Want plain keys instead? Select the property > Animation > Keyframe Assistant > Convert Expression to Keyframes."]);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- S4 precomps: listing, checkout, white panel
function buildListing(pi) {
  var D = DATA.passes[pi], A4 = D.audit.listing;
  var c = pre("PRE_Listing_" + D.tag, A4.w, A4.h, D.audit.dur, "Pass " + D.tag + ": the stay listing (two product columns). Laid out " + A4.ox + "," + A4.oy + " px in from the top-left; S4 places it. Time 0 = start of S4.");
  solid(c, "#FFFFFF", "BG_White").locked = true;
  var it = drawItems(c, A4.items, null);
  var sel = A4.select, i;
  for (i = 0; i < sel.names.length; i++) { var Lx = it[sel.names[i]]; if (Lx) holdKeys(Lx, "op", sel.keys[i]); }
  finishComp(c);
  return c;
}
function buildCheckout(pi) {
  var D = DATA.passes[pi], A4 = D.audit.checkout;
  var c = pre("PRE_Checkout_" + D.tag, A4.w, A4.h, D.audit.dur, "Pass " + D.tag + ": the dark checkout panel content (transparent; the dark strip in S4 is its background). Origin " + A4.ox + "," + A4.oy + " px = the left edge of 'Total'.");
  var it = drawItems(c, A4.items, null);
  var hl = it[A4.hlName]; if (hl) applyKeys(hl, "scale", A4.hlKeys);
  var hot = it[A4.hotName]; if (hot) applyKeys(hot, "op", A4.hotKeys);
  finishComp(c);
  return c;
}
function buildWhite(pi) {
  var D = DATA.passes[pi], A4 = D.audit.white;
  var c = pre("PRE_WhitePanel_" + D.tag, A4.w, A4.h, D.audit.dur, "Pass " + D.tag + ": the white panel content. S4 slides it in from the left.");
  solid(c, "#FFFFFF", "BG_White").locked = true;
  drawItems(c, A4.items, null);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- S4: UX audit (listing, dark checkout, white panel, cursors with notes)
function pillLayer(c, P4, side) {
  var L = shp(c, "NOTE_" + P4.name, 0, 0), g = grp(L, "Pill");
  rect(g, 100, P4.h - (P4.border ? P4.border : 0), 0, 0, P4.r);
  fill(g, P4.col); if (P4.border) stroke(g, "#FFFFFF", P4.border);
  ctl(L, "slider", "Text Inset (px)", P4.tx);
  sep(L); applyKeys(L, "x", P4.kx); applyKeys(L, "y", P4.ky);
  applyKeys(L, shapeProp(L, "Pill", "ADBE Vector Shape - Rect", "ADBE Vector Rect Size"), P4.kw);
  expr(L, shapeProp(L, "Pill", "ADBE Vector Shape - Rect", "ADBE Vector Rect Position"),
    ["// NOTE PILL: keeps the pill's " + (side == "right" ? "right" : "left") + " edge on this layer's anchor while its width (Size keys) grows. Controls: this layer > Contents > Pill > Rectangle > Size keys.",
     "var s = content(\"Pill\").content(1).size;",
     "[" + (side == "right" ? "-" : "") + "s[0] / 2, s[1] / 2];"].join("\n"));
  L.label = 10; blur(L);
  var T = textAt(c, { name: "NOTE_" + P4.name + "_Text", str: P4.str, weight: P4.weight, size: P4.size, color: "#FFFFFF", x: 0, y: P4.base });
  parentTo(T, L); T.label = 10; blur(T);
  expr(T, "pos", ["// NOTE TEXT: sits Text Inset (px) in from the pill's left edge, so it slides as the pill grows. Controls: NOTE_" + P4.name + " > Text Inset (px), Size keys.",
    "var p = thisComp.layer(\"NOTE_" + P4.name + "\");",
    "var w = p.content(\"Pill\").content(1).size[0] + " + (P4.border ? P4.border : 0) + ";",
    "[" + (side == "right" ? "-w + " : "") + "p.effect(\"Text Inset (px)\")(\"Slider\"), value[1]];"].join("\n"));
  holdKeys(T, "op", P4.textOp);
  MATTES.push([T, L, TrackMatteType.ALPHA]);
  trimTo(L, P4.inAt, null); trimTo(T, P4.inAt, null);
  return L;
}
function cursorLayer(c, C4) {
  var L = shp(c, "CURSOR_" + C4.name, 0, 0), g = grp(L, "Cursor");
  pth(g, C4.pts, true); fill(g, C4.col); stroke(g, "#FFFFFF", 2.5, true);
  sep(L); applyKeys(L, "x", C4.kx); applyKeys(L, "y", C4.ky); if (C4.ks) applyKeys(L, "scale", C4.ks);
  trimTo(L, C4.inAt, null); blur(L);
  L.comment = "Anchor = top-left of the cursor's 70 px box (the source's transform origin).";
  return L;
}
function stripExpr(left, right) {
  return ["// STRIP: this box spans from " + left[1] + " to " + right[1] + " across the full height. Controls: CTRL_Strips > " + left[1] + ", " + right[1] + " keys (the push timing).",
    "var c = thisComp.layer(\"CTRL_Strips\");",
    "var a = " + left[0] + ", b = " + right[0] + ";"];
}
function stripLayer(c, name, hex, left, right) {
  var L = shp(c, name, 0, 0), g = grp(L, "Strip");
  rect(g, 10, H, 0, H / 2, 0); fill(g, hex); L.label = 10;
  var head = stripExpr(left, right).join("\n");
  expr(L, shapeProp(L, "Strip", "ADBE Vector Shape - Rect", "ADBE Vector Rect Size"), head + "\n[Math.max(0, b - a), thisComp.height];");
  expr(L, shapeProp(L, "Strip", "ADBE Vector Shape - Rect", "ADBE Vector Rect Position"), head + "\n[(a + b) / 2, thisComp.height / 2];");
  return L;
}
function buildAudit(pi, PL, PC, PW) {
  var D = DATA.passes[pi], S4 = D.audit;
  var c = makeComp("S4" + D.tag + "_UXAudit_" + D.name, S4.dur, FOLD.scenes, "Pass " + D.tag + " (" + D.name + "). A stay listing slides in with a blue note; a dark checkout eases in, whips across and settles (orange note, fee highlight); a white panel pushes in (pink note); everything eases off right into the cut. Starts at frame " + S4.at + " in MAIN.");
  solid(c, "#FFFFFF", "BG_White").locked = true;
  var cs = nul(c, "CTRL_Strips", 960, 540);
  ctl(cs, "slider", "Dark Left (px)", 0); ctl(cs, "slider", "Dark Right (px)", 0); ctl(cs, "slider", "White Right (px)", 0);
  applyKeys(cs, function () { return ctlProp(cs, "Dark Left (px)"); }, S4.dL);
  applyKeys(cs, function () { return ctlProp(cs, "Dark Right (px)"); }, S4.dR);
  applyKeys(cs, function () { return ctlProp(cs, "White Right (px)"); }, S4.wR);
  var DL = ["c.effect(\"Dark Left (px)\")(\"Slider\")", "Dark Left (px)"], DR = ["c.effect(\"Dark Right (px)\")(\"Slider\")", "Dark Right (px)"];
  var WR = ["c.effect(\"White Right (px)\")(\"Slider\")", "White Right (px)"], ZERO = ["0", "the left edge"], FULL = ["thisComp.width", "the right edge"];
  // listing (clipped to the right of the dark strip)
  var mg = stripLayer(c, "MATTE_GridStrip", "#FFFFFF", DR, FULL);
  var lst = place(c, PL, "Listing", S4.listing.ox, S4.listing.oy, 0, 0); sep(lst); blur(lst);
  applyKeys(lst, "x", S4.gx); applyKeys(lst, "y", S4.gy);
  MATTES.push([lst, mg, TrackMatteType.ALPHA]);
  // dark strip + checkout content
  var dbg = stripLayer(c, "Strip_Dark", S4.darkCol, DL, DR);
  var md = stripLayer(c, "MATTE_DarkStrip", "#FFFFFF", DL, DR);
  var chk = place(c, PC, "Checkout", S4.checkout.ox, S4.checkout.oy, 0, 0); sep(chk); blur(chk);
  applyKeys(chk, "x", S4.cx); setv(PY(chk), 0);
  MATTES.push([chk, md, TrackMatteType.ALPHA]);
  // white panel
  var mw = stripLayer(c, "MATTE_WhiteStrip", "#FFFFFF", ZERO, WR);
  var wp = place(c, PW, "WhitePanel", 0, 0, 0, 0); sep(wp); blur(wp);
  applyKeys(wp, "x", S4.wx); setv(PY(wp), 0);
  MATTES.push([wp, mw, TrackMatteType.ALPHA]);
  dbg.comment = "Dark background of the checkout strip; its edges follow CTRL_Strips.";
  // notes and cursors, in the source's stacking order (later = in front)
  var i;
  for (i = 0; i < S4.notes.length; i++) { pillLayer(c, S4.notes[i], S4.notes[i].side); cursorLayer(c, S4.cursors[i]); }
  compMarkers(c, S4.markers);
  guide(c, ["S4 UX audit: CTRL_Strips > Dark Left / Dark Right / White Right keys = when and how the panels push in (graph editor = the feel).",
    "Listing / Checkout / WhitePanel are precomps; their X (and Listing Y) keys are the content moving with the push (parallax).",
    "Mattes: Listing uses MATTE_GridStrip, Checkout uses MATTE_DarkStrip, WhitePanel uses MATTE_WhiteStrip. Each NOTE_ text uses its pill (alpha).",
    "Notes: NOTE_ layers = the pills (X, Y and Size keys); CURSOR_ layers = the cursors (X, Y and Scale keys).",
    "Want plain keys instead? Select the property > Animation > Keyframe Assistant > Convert Expression to Keyframes."]);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- S9: end card
function buildWordmark() {
  var E = DATA.end, c = pre("PRE_Wordmark", W, H, E.dur, "The glowing wayfold wordmark: the text plus three blurred copies behind it as the glow.");
  var i;
  for (i = E.glows.length - 1; i >= 0; i--) {
    var G = textAt(c, { name: "Glow_" + (i + 1), str: E.str, weight: E.weight, size: E.size, color: E.glows[i][2], track: E.track, x: E.x, y: E.base, just: "center", op: E.glows[i][1] });
    var fx = prop(G, "ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2"); fx.name = "Glow Blur"; fx.property(1).setValue(E.glows[i][0]);
    G.locked = true;
  }
  textAt(c, { name: "Wordmark", str: E.str, weight: E.weight, size: E.size, color: "#FFFFFF", track: E.track, x: E.x, y: E.base, just: "center" });
  finishComp(c);
  return c;
}
function buildEnd(WM) {
  var E = DATA.end;
  var c = makeComp("S9_EndCard", E.dur, FOLD.scenes, "Black end card: the glowing wordmark lands big and blurred, settles, holds, then shrinks away. Starts at frame " + E.at + " in MAIN.");
  solid(c, "#000000", "BG_Black").locked = true;
  var halo = solid(c, "#000000", "Halo");
  try {
    var fx = prop(halo, "ADBE Effect Parade").addProperty("ADBE Ramp"); fx.name = "Halo Ramp";
    fx.property(1).setValue([960, 540]); fx.property(2).setValue(rgb(E.halo)); fx.property(3).setValue([960 + E.haloR, 540]); fx.property(4).setValue([0, 0, 0]); fx.property(5).setValue(2);
    setv(A(halo), [960, 540]); setv(P(halo), [960, 540]);
    applyKeys(halo, "scale", E.haloS); applyKeys(halo, "op", E.op); trimTo(halo, null, E.out);
    halo.comment = "Soft grey glow behind the word (radial Gradient Ramp, squashed to an ellipse by its Scale keys).";
  } catch (e) { WARN.push("S9_EndCard: halo skipped (" + e.toString() + ")"); halo.remove(); }
  var L = place(c, WM, "Wordmark", E.cx, E.cy, E.cx, E.cy); blur(L);
  applyKeys(L, "scale", E.wordS); applyKeys(L, "op", E.op); trimTo(L, null, E.out);
  var bfx = prop(L, "ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2"); bfx.name = "Land Blur";
  applyKeys(L, fxProp(L, "Land Blur", 1), E.blurK);
  compMarkers(c, E.markers);
  finishComp(c);
  return c;
}

// ---------------------------------------------------------------- MAIN
function buildMain(scenes, endc) {
  var c = makeComp("MAIN_Wayfold", DATA.dur, FOLD.main, "Wayfold, 20 s at 30 fps. Pass A (Lisbon) frames 0-268, pass B (Alps) 269-537, end card 538-599. Each scene comp sits at its start frame.");
  solid(c, "#000000", "BG_Black").locked = true;
  var i;
  for (i = 0; i < scenes.length; i++) {
    if (!scenes[i][0]) { ERRORS.push("MAIN: scene missing, gap at frame " + scenes[i][1]); continue; }
    var L = c.layers.add(scenes[i][0]); L.startTime = scenes[i][1] / FPS; LAYER_COUNT++;
  }
  if (endc) { var Le = c.layers.add(endc); Le.startTime = DATA.end.at / FPS; LAYER_COUNT++; }
  var bm = nul(c, "DIALOGUE_MARKERS", 960, 540, 2); bm.enabled = false;
  bm.comment = "No voiceover in this film: these markers name the beats instead (scene starts, the send press, panel pushes).";
  markers(bm, DATA.beats); compMarkers(c, DATA.beats);
  if (DATA.guide) {
    var f = File.openDialog("Pick the rendered wayfold-type-shift.mp4 to use as a guide layer (Cancel to skip)");
    if (f) {
      try { var it = app.project.importFile(new ImportOptions(f)); it.parentFolder = FOLD.ref; var G = c.layers.add(it); G.name = "GUIDE_Render"; G.guideLayer = true; G.enabled = false; G.label = 2; G.moveToBeginning(); G.comment = "The HTML render, for comparing frame by frame. Turn its eye on; it never renders."; LAYER_COUNT++; }
      catch (e) { WARN.push("Guide footage could not be imported: " + e.toString()); }
    } else WARN.push("Guide footage skipped.");
  }
  guide(c, ["MAIN_Wayfold: 20 s, 30 fps. Scene comps in time order; S9_EndCard at the end.",
    "Folders: 00_MAIN, 01_SCENES (one comp per shot and pass), 03_PRECOMPS (paper, listing, checkout, white panel, wordmark), 05_REFERENCE (images, icons, guide MP4).",
    "Labels: red = controls/cameras (CTRL_, CAM_, GRP_), purple = driven by an expression, aqua = mattes, yellow = guides, sandstone = art.",
    "Every move is keyframed from the original's own curves; change a feel in the graph editor.",
    "GUIDE_Render (if imported) is the original render: turn its eye on to compare."]);
  finishComp(c);
  try { c.openInViewer(); } catch (e2) { }
  return c;
}

// ---------------------------------------------------------------- run
var PAPER = null;
(function () {
  FPS = DATA.fps; W = DATA.w; H = DATA.h; SHUTTER_ANGLE = 180;
  app.beginUndoGroup("Wayfold rebuild");
  ROOT = findProjectFolder("assets/art/sunset.png");
  checkFonts(FONT_FILES, ROOT);
  FOLD = { main: folder("00_MAIN"), scenes: folder("01_SCENES"), rigs: folder("02_RIGS"), pre: folder("03_PRECOMPS"), solids: folder("04_SOLIDS"), ref: folder("05_REFERENCE") };
  PAPER = safe("PRE_Paper", function () { return buildPaper(); });
  var scenes = [], pi;
  for (pi = 0; pi < DATA.passes.length; pi++) {
    var D = DATA.passes[pi];
    var s1 = PAPER ? safe("S1" + D.tag + "_Collage", function () { return buildCollage(pi); }) : null;
    var s2 = PAPER ? safe("S2" + D.tag + "_Phone", function () { return buildPhone(pi); }) : null;
    var s3 = safe("S3" + D.tag + "_Prompt", function () { return buildPrompt(pi); });
    var pl = safe("PRE_Listing_" + D.tag, function () { return buildListing(pi); });
    var pc = safe("PRE_Checkout_" + D.tag, function () { return buildCheckout(pi); });
    var pw = safe("PRE_WhitePanel_" + D.tag, function () { return buildWhite(pi); });
    var s4 = (pl && pc && pw) ? safe("S4" + D.tag + "_UXAudit", function () { return buildAudit(pi, pl, pc, pw); }) : null;
    scenes.push([s1, D.collage.at], [s2, D.phone.at], [s3, D.prompt.at], [s4, D.audit.at]);
  }
  var wm = safe("PRE_Wordmark", function () { return buildWordmark(); });
  var endc = wm ? safe("S9_EndCard", function () { return buildEnd(wm); }) : null;
  safe("MAIN_Wayfold", function () { return buildMain(scenes, endc); });
  report("Wayfold Rebuild", DATA.totalComps);
  app.endUndoGroup();
})();
