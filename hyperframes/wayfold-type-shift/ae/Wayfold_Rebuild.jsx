// =============================================================================
// ae_build_lib.jsx  -  helper library for After Effects rebuild scripts (ExtendScript / ES3)
//
// Paste this at the TOP of the generated build script (one self-contained .jsx is easiest for users).
// Every helper here exists because a real build broke without it. See references/ae_runtime_facts.md.
//
// ES3 RULES (ExtendScript): no let/const/arrow/template strings/forEach/map/filter/JSON/Array.indexOf,
// no trailing commas, and NEVER a reserved word as a name or property (char, int, class, default,
// final, short, long, byte, float, double, goto, native, package, public, static, super, enum...).
// =============================================================================

var FPS = 25, W = 1920, H = 1080;                 // overwritten by the build script's project settings
var HAS_NEW_MATTES = parseFloat(app.version) >= 23;
var ERRORS = [], WARN = [], DONE = [], EXPR_COUNT = 0, KEY_COUNT = 0, LAYER_COUNT = 0, MATTE_COUNT = 0;
var EXPRS = [], LCTRL = [], MATTES = [];
var OFF = 0;                                      // parent-timeline time that sits at time 0 of the comp being built

// ---------------------------------------------------------------- time: author in seconds, snapped to whole frames
function fr(t) { return Math.round(t * FPS + 1e-6) / FPS; }   // +1e-6 stops 13.35-11.81 = 1.53999 rounding the wrong way
function lt(t) { return fr(t - OFF); }

// ---------------------------------------------------------------- colours
function rgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
function rgba(h) { var c = rgb(h); c.push(1); return c; }      // shape fills/strokes want 4 values, text fillColor wants 3

// ---------------------------------------------------------------- safe property access
// AE returns NULL (no error) when a name/matchName doesn't exist. Always go through prop() so a wrong
// name fails loudly on the line that caused it, instead of "null is not an object" somewhere later.
function prop(parent, name) {
  var p = parent.property(name);
  if (p === null || p === undefined) throw new Error("AE has no property '" + name + "' under '" + parent.name + "'");
  return p;
}
function tr(L) { return prop(L, "ADBE Transform Group"); }
function P(L) { return prop(tr(L), "ADBE Position"); }
function PX(L) { return prop(tr(L), "ADBE Position_0"); }
function PY(L) { return prop(tr(L), "ADBE Position_1"); }
function S(L) { return prop(tr(L), "ADBE Scale"); }
function R(L) { return prop(tr(L), "ADBE Rotate Z"); }
function O(L) { return prop(tr(L), "ADBE Opacity"); }
function A(L) { return prop(tr(L), "ADBE Anchor Point"); }
function sep(L) { P(L).dimensionsSeparated = true; }
function fixv(p, v) { if (v instanceof Array && p.value instanceof Array && v.length < p.value.length) { var o = v.slice(0); while (o.length < p.value.length) o.push(p.value[o.length]); return o; } return v; }   // pad with the property's own value (Scale z = 100, Position z = 0)
function setv(p, v) { v = fixv(p, v); try { p.setValue(v); } catch (e) { if (v instanceof Array && v.length == 3) p.setValue(v.slice(0, 2)); else throw e; } }
function sv(L, v) { setv(S(L), v); }

// ---------------------------------------------------------------- comps, folders, layers
function folder(name, parent) { var f = app.project.items.addFolder(name); if (parent) f.parentFolder = parent; return f; }
function makeComp(name, dur, fold, comment, w, h) {
  var c = app.project.items.addComp(name, w || W, h || H, 1, dur, FPS);
  if (fold) c.parentFolder = fold; c.comment = comment || ""; matchMotionBlur(c); return c;
}
// Nulls get anchor = position, so children parented to them keep plain comp coordinates.
function nul(c, name, x, y, label) { var L = c.layers.addNull(); L.name = name; setv(A(L), [x, y]); setv(P(L), [x, y]); L.label = (label == null) ? 1 : label; LAYER_COUNT++; return L; }
function shp(c, name, x, y) { var L = c.layers.addShape(); L.name = name; setv(A(L), [0, 0]); setv(P(L), [x, y]); L.label = 15; LAYER_COUNT++; return L; }
// setParentWithJump does NOT compensate: the child's numbers stay as they are, now read in the parent's space.
// That's only "comp coordinates" when the parent is a null built with nul() (anchor = position). Never parent
// art to a shape layer expecting comp coordinates; set the child's position in the parent's space instead.
function parentTo(child, parent) { child.setParentWithJump(parent); }

// ---------------------------------------------------------------- shape contents (handle-safe)
// RULE 1: in shape Contents the FIRST item is drawn IN FRONT. grp() moves each new group to the top, so the
//         order you write code in = paint order (later = in front).
// RULE 2: adding or moving a group kills handles to its SIBLINGS ("Object is invalid"). Finish one group
//         completely (paths, fill, stroke, trim, transform) BEFORE calling grp() again on the same parent.
function grp(L, name, inGroup) {
  var host = inGroup ? prop(inGroup, "ADBE Vectors Group") : prop(L, "ADBE Root Vectors Group");
  var g = host.addProperty("ADBE Vector Group"); g.name = name;
  if (host.numProperties > 1) { g.moveTo(1); g = host.property(1); }
  return g;
}
function vg(g) { return prop(g, "ADBE Vectors Group"); }
function gtr(g) { return prop(g, "ADBE Vector Transform Group"); }
function rect(g, w, h, x, y, r) { var p = vg(g).addProperty("ADBE Vector Shape - Rect"); setv(prop(p, "ADBE Vector Rect Size"), [w, h]); setv(prop(p, "ADBE Vector Rect Position"), [x || 0, y || 0]); prop(p, "ADBE Vector Rect Roundness").setValue(r || 0); return p; }
function ell(g, w, h, x, y) { var p = vg(g).addProperty("ADBE Vector Shape - Ellipse"); setv(prop(p, "ADBE Vector Ellipse Size"), [w, h]); setv(prop(p, "ADBE Vector Ellipse Position"), [x || 0, y || 0]); return p; }
function pth(g, verts, closed, inT, outT, name) {
  var p = vg(g).addProperty("ADBE Vector Shape - Group"); if (name) p.name = name;
  var s = new Shape(); s.vertices = verts; s.closed = closed; if (inT) s.inTangents = inT; if (outT) s.outTangents = outT;
  prop(p, "ADBE Vector Shape").setValue(s); return p;
}
function fill(g, col, op, evenOdd) { var f = vg(g).addProperty("ADBE Vector Graphic - Fill"); prop(f, "ADBE Vector Fill Color").setValue(rgba(col)); if (op != null) prop(f, "ADBE Vector Fill Opacity").setValue(op); if (evenOdd) prop(f, "ADBE Vector Fill Rule").setValue(2); return f; }
function stroke(g, col, w, round) { var s = vg(g).addProperty("ADBE Vector Graphic - Stroke"); prop(s, "ADBE Vector Stroke Color").setValue(rgba(col)); prop(s, "ADBE Vector Stroke Width").setValue(w); if (round) { prop(s, "ADBE Vector Stroke Line Cap").setValue(2); prop(s, "ADBE Vector Stroke Line Join").setValue(2); } return s; }
function trim(g) { return vg(g).addProperty("ADBE Vector Filter - Trim"); }
function dashes(s, dash, gap) { try { prop(s, "ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1").setValue(dash); prop(s, "ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1").setValue(gap); } catch (e) { WARN.push("Dashes skipped (solid line instead)"); } }

// ---------------------------------------------------------------- masks (Mask Expansion's matchName is "ADBE Mask Offset")
function addMask(L, name, shape) { var m = prop(L, "ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.name = name; prop(m, "ADBE Mask Shape").setValue(shape); return m; }
function maskExpansion(L, name) { return prop(prop(prop(L, "ADBE Mask Parade"), name), "ADBE Mask Offset"); }
function circleShape(cx, cy, r) { var k = 0.5523 * r, s = new Shape(); s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]; s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }
function rrShape(x, y, w, h, r) {
  var k = 0.5523 * r, s = new Shape();
  s.vertices = [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]];
  s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
  s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]]; s.closed = true; return s;
}

// ---------------------------------------------------------------- fonts
var MISSING_FONTS = {};
function fontInstalled(psName) {
  try { if (app.fonts && app.fonts.getFontsByPostScriptName) return app.fonts.getFontsByPostScriptName(psName).length > 0; } catch (e) { }
  return null;   // unknown on older AE
}
function setFont(d, font) {
  if (fontInstalled(font) === false) { MISSING_FONTS[font] = 1; }
  try { d.font = font; } catch (e) { MISSING_FONTS[font] = 1; }
}
// Call once before building. Lists missing fonts, points at the bundled /fonts folder and opens it.
function checkFonts(list, root) {
  var miss = [], i;
  for (i = 0; i < list.length; i++) if (fontInstalled(list[i]) === false) miss.push(list[i]);
  if (!miss.length) return true;
  var fd = root ? Folder(root.fsName + "/fonts") : null;
  var msg = "These fonts are not installed:\n  " + miss.join("\n  ") + "\n\n";
  if (fd && fd.exists) msg += "They are in the 'fonts' folder next to this script. I'll open it: double-click each file > Install, restart After Effects, then run the script again.\n\nClick OK to keep building anyway (text will use a substitute font).";
  else msg += "Install them (see README), then run the script again.\n\nClick OK to keep building anyway.";
  alert(msg); if (fd && fd.exists) { try { fd.execute(); } catch (e2) { } }
  WARN.push("Missing fonts: " + miss.join(", "));
  return false;
}
function txt(c, name, str, font, size, col, tracking, x, y, pivot, just) {
  var L = c.layers.addText(str); L.name = name;
  var sp = prop(prop(L, "ADBE Text Properties"), "ADBE Text Document"), d = sp.value;
  if (d.resetCharStyle) d.resetCharStyle(); if (d.resetParagraphStyle) d.resetParagraphStyle();
  setFont(d, font); d.fontSize = size; d.applyFill = true; d.fillColor = rgb(col); d.applyStroke = false; d.tracking = tracking || 0;
  d.justification = just || ParagraphJustification.CENTER_JUSTIFY; sp.setValue(d);
  var r = L.sourceRectAtTime(0, false);
  setv(A(L), [r.left + r.width / 2, (pivot == "bottom") ? r.top + r.height : r.top + r.height / 2]);
  setv(P(L), [x, y]); L.label = 15; LAYER_COUNT++; return L;
}

// ---------------------------------------------------------------- assets next to the script (never fail silently)
function findProjectFolder(markerRelPath) {
  var tries = [], i;
  try { tries.push(File($.fileName).parent); } catch (e) { }
  for (i = 0; i < tries.length; i++) if (tries[i] && File(tries[i].fsName + "/" + markerRelPath).exists) return tries[i];
  alert("I can't see '" + markerRelPath + "' next to this script.\nIn the next window, pick the unzipped project folder.");
  var f = Folder.selectDialog("Pick the unzipped project folder");
  if (f && File(f.fsName + "/" + markerRelPath).exists) return f;
  ERRORS.push("Project folder not found: images and fonts will be missing.");
  return null;
}
function importAsset(root, rel, fold) {
  if (!root) return null; var f = File(root.fsName + "/" + rel);
  if (!f.exists) { WARN.push("Missing file: " + rel); return null; }
  var it = app.project.importFile(new ImportOptions(f)); if (fold) it.parentFolder = fold; return it;
}

// ---------------------------------------------------------------- expression controls + deferred wiring
function ctl(L, type, name, val) {
  var mn = { slider: "ADBE Slider Control", check: "ADBE Checkbox Control", point: "ADBE Point Control", layer: "ADBE Layer Control", angle: "ADBE Angle Control", color: "ADBE Color Control" }[type];
  var fx = prop(L, "ADBE Effect Parade").addProperty(mn); fx.name = name;
  if (type == "layer") LCTRL.push([L, name, val]); else if (val != null) fx.property(1).setValue(val);
  return fx;
}
function ctlProp(L, name) { return prop(prop(prop(L, "ADBE Effect Parade"), name), 1); }
function getter(L, which) {
  if (typeof which == "function") return which;
  return function () { if (which == "pos") return P(L); if (which == "x") return PX(L); if (which == "y") return PY(L); if (which == "scale") return S(L); if (which == "rot") return R(L); if (which == "op") return O(L); if (which == "anchor") return A(L); throw new Error("unknown channel " + which); };
}
// Expressions are applied LAST (finishComp), after every layer, control and parent exists.
// Every expression text must start with "// WHAT it does. Controls: CTRL_X > A, B".
function expr(L, which, text) { EXPRS.push({ L: L, g: getter(L, which), t: text }); }

// ---------------------------------------------------------------- keyframes that match the source curve
// CURVES (from scripts/ease_fit.py) are pasted here by the generator: { name: [[u, value, speed, inflIn, inflOut], ...] }
function canBezier(p) { try { return p.isInterpolationTypeValid(KeyframeInterpolationType.BEZIER); } catch (e) { return true; } }
function setKeySafe(p, t, v) { v = fixv(p, v); try { p.setValueAtTime(t, v); } catch (e) { if (v instanceof Array && v.length == 3) p.setValueAtTime(t, v.slice(0, 2)); else throw e; } }
function easeCount(p) { var t = p.propertyValueType; if (t == PropertyValueType.TwoD_SPATIAL || t == PropertyValueType.ThreeD_SPATIAL || t == PropertyValueType.OneD || t == PropertyValueType.COLOR || t == PropertyValueType.SHAPE) return 1; return (p.value instanceof Array) ? p.value.length : 1; }
function setEaseSafe(p, k, inE, outE) {
  try { p.setTemporalEaseAtKey(k, inE, outE); return; } catch (e) { }
  for (var n = 1; n <= 3; n++) { if (n == inE.length) continue; var a = [], b = []; for (var i = 0; i < n; i++) { a.push(inE[Math.min(i, inE.length - 1)]); b.push(outE[Math.min(i, outE.length - 1)]); } try { p.setTemporalEaseAtKey(k, a, b); return; } catch (e2) { } }
  WARN.push("Ease left default on " + p.name + " key " + k);
}
// Apply one fitted curve: the move from 'from' to 'to' starting at t0 (parent time) lasting dur seconds.
// All channels of one move (scale, y, rotation, opacity) should use the SAME t0/dur/curve so they stay in sync.
function applyCurve(L, which, t0, dur, from, to, curveName) {
  var g = getter(L, which), p = g(), C = CURVES[curveName]; if (!C) throw new Error("No curve named " + curveName);
  var spatial = (p.propertyValueType == PropertyValueType.TwoD_SPATIAL || p.propertyValueType == PropertyValueType.ThreeD_SPATIAL);
  var isArr = from instanceof Array, n = easeCount(p), keys = [], i, d;
  for (i = 0; i < C.length; i++) {
    var u = C[i][0], f = (i == 0) ? 0 : (i == C.length - 1 ? 1 : C[i][1]);
    var v = isArr ? [] : from + (to - from) * f; if (isArr) for (d = 0; d < from.length; d++) v.push(from[d] + (to[d] - from[d]) * f);
    var t = lt(t0 + u * dur); if (keys.length && t <= keys[keys.length - 1].t) continue;   // never two keys in one frame
    setKeySafe(p, t, v); keys.push({ t: t, c: C[i], last: i == C.length - 1 });
  }
  if (!canBezier(p)) { for (i = 0; i < keys.length; i++) { try { var kh = p.nearestKeyIndex(keys[i].t); p.setInterpolationTypeAtKey(kh, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (e) { } } return; }
  for (i = 0; i < keys.length; i++) {
    var k = p.nearestKeyIndex(keys[i].t), c = keys[i].c, inE = [], outE = [], sp = keys[i].last ? 0 : c[2];
    for (d = 0; d < n; d++) {
      var delta = spatial ? lenOf(from, to) : (isArr ? (to[Math.min(d, to.length - 1)] - from[Math.min(d, from.length - 1)]) : (to - from));
      var spd = sp * delta / dur; if (spatial) spd = Math.abs(spd);
      inE.push(new KeyframeEase(spd, Math.max(0.1, Math.min(100, c[3])))); outE.push(new KeyframeEase(spd, Math.max(0.1, Math.min(100, c[4]))));
    }
    p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    setEaseSafe(p, k, inE, outE); KEY_COUNT++;
  }
}

// PREFERRED: apply a move fitted by the generator with ease_fit.fit_move() (frame-aware, verified against the source).
// fit = [[t (parent time, already on whole frames), fraction, speed (fraction per s), inflIn %, inflOut %], ...]
function applyFit(L, which, fit, from, to) {
  var p = getter(L, which)(), isArr = from instanceof Array, n = easeCount(p), i, d;
  var spatial = (p.propertyValueType == PropertyValueType.TwoD_SPATIAL || p.propertyValueType == PropertyValueType.ThreeD_SPATIAL);
  var times = [];
  for (i = 0; i < fit.length; i++) {
    var f = fit[i][1], v = isArr ? [] : from + (to - from) * f; if (isArr) for (d = 0; d < from.length; d++) v.push(from[d] + (to[d] - from[d]) * f);
    times.push(lt(fit[i][0])); setKeySafe(p, times[i], v);
  }
  if (!canBezier(p)) { for (i = 0; i < times.length; i++) { try { p.setInterpolationTypeAtKey(p.nearestKeyIndex(times[i]), KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (e) { } } return; }
  for (i = 0; i < fit.length; i++) {
    var k = p.nearestKeyIndex(times[i]), inE = [], outE = [];
    for (d = 0; d < n; d++) {
      var delta = spatial ? lenOf(from, to) : (isArr ? (to[Math.min(d, to.length - 1)] - from[Math.min(d, from.length - 1)]) : (to - from));
      var spd = fit[i][2] * delta; if (spatial) spd = Math.abs(spd);
      inE.push(new KeyframeEase(spd, Math.max(0.1, Math.min(100, fit[i][3])))); outE.push(new KeyframeEase(spd, Math.max(0.1, Math.min(100, fit[i][4]))));
    }
    p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    setEaseSafe(p, k, inE, outE); KEY_COUNT++;
  }
}

function lenOf(a, b) { if (!(a instanceof Array)) return Math.abs(b - a); var s = 0; for (var i = 0; i < a.length; i++) s += (b[i] - a[i]) * (b[i] - a[i]); return Math.sqrt(s); }
// Hold keys (switch something on/off at a moment)
function holdKey(L, which, t, v) { var p = getter(L, which)(); setKeySafe(p, lt(t), v); var k = p.nearestKeyIndex(lt(t)); try { p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (e) { } KEY_COUNT++; }

// ---------------------------------------------------------------- motion blur that matches the source render
var SHUTTER_ANGLE = 180;   // source renders that blend N sub-frames over half a frame = 180 degrees
function matchMotionBlur(c) { try { c.motionBlur = true; c.shutterAngle = SHUTTER_ANGLE; c.shutterPhase = -SHUTTER_ANGLE / 2; c.motionBlurSamplesPerFrame = 16; c.motionBlurAdaptiveSampleLimit = 128; } catch (e) { } }
function blur(L) { try { L.motionBlur = true; } catch (e) { } return L; }   // switch on for every layer that moves

// ---------------------------------------------------------------- reaction systems a non-coder can steer
// IMPACT BURST: particles fly out from a point when something lands.
//  - The TIMING CURVE lives in keyframes on CTRL_Burst_<name> > "Progress (%)" (graph editor = the particles' ease).
//    The keys are made from a fitted curve, so out of the box it matches the source.
//  - Everything else is a named slider: Distance (%), Size (%), Spin (deg), Stagger (frames), Drift (px), Drift Speed.
//  - Particle expressions are LINEAR maps of Progress: no hidden easing maths.
function makeBurst(c, name, origin, t0, dur, curveName, parent, fit) {
  var ctrl = nul(c, "CTRL_Burst_" + name, origin[0], origin[1]);
  ctl(ctrl, "point", "Origin", origin); ctl(ctrl, "slider", "Progress (%)", 0);
  ctl(ctrl, "slider", "Distance (%)", 100); ctl(ctrl, "slider", "Size (%)", 100); ctl(ctrl, "slider", "Spin (deg)", 90);
  ctl(ctrl, "slider", "Stagger (frames)", 1); ctl(ctrl, "slider", "Drift (px)", 6); ctl(ctrl, "slider", "Drift Speed", 1.2);
  if (fit) applyFit(ctrl, function () { return ctlProp(ctrl, "Progress (%)"); }, fit, 0, 100);
  else applyCurve(ctrl, function () { return ctlProp(ctrl, "Progress (%)"); }, t0, dur, 0, 100, curveName);
  return ctrl;
}
function burstExprPos(ctrlName) {
  return ["// BURST: flies from Origin out to where this layer sits, then floats. Controls: " + ctrlName + " > Progress (%) keys (the ease), Distance, Stagger, Drift. This layer: Order.",
    "var c = thisComp.layer(\"" + ctrlName + "\");",
    "var delay = c.effect(\"Stagger (frames)\")(\"Slider\") * thisComp.frameDuration * effect(\"Order\")(\"Slider\");",
    "var p = c.effect(\"Progress (%)\")(\"Slider\").valueAtTime(time - delay) / 100;   // follows the keys exactly",
    "var reach = c.effect(\"Distance (%)\")(\"Slider\") / 100;",
    "var o = c.effect(\"Origin\")(\"Point\");",
    "var drift = c.effect(\"Drift (px)\")(\"Slider\") * Math.min(1, Math.max(0, p));",
    "var spd = c.effect(\"Drift Speed\")(\"Slider\");",
    "add(add(o, mul(sub(value, o), p * reach)), [Math.sin(time * spd + index) * drift, Math.cos(time * spd * 0.8 + index) * drift * 0.6]);"].join("\n");
}
function burstExprScale(ctrlName) {
  return ["// BURST SIZE: grows with Progress. Controls: " + ctrlName + " > Progress (%) keys, Size (%), Stagger. This layer: Order.",
    "var c = thisComp.layer(\"" + ctrlName + "\");",
    "var delay = c.effect(\"Stagger (frames)\")(\"Slider\") * thisComp.frameDuration * effect(\"Order\")(\"Slider\");",
    "var p = Math.max(0, c.effect(\"Progress (%)\")(\"Slider\").valueAtTime(time - delay) / 100);",
    "mul(value, p * c.effect(\"Size (%)\")(\"Slider\") / 100);"].join("\n");
}
function burstExprRot(ctrlName) {
  return ["// BURST SPIN: turns as it flies. Controls: " + ctrlName + " > Spin (deg), Progress (%) keys. This layer: Order.",
    "var c = thisComp.layer(\"" + ctrlName + "\");",
    "var delay = c.effect(\"Stagger (frames)\")(\"Slider\") * thisComp.frameDuration * effect(\"Order\")(\"Slider\");",
    "var p = c.effect(\"Progress (%)\")(\"Slider\").valueAtTime(time - delay) / 100;",
    "value + c.effect(\"Spin (deg)\")(\"Slider\") * p * (index % 2 ? 1 : -1);"].join("\n");
}
function addToBurst(L, ctrl, order) {
  ctl(L, "slider", "Order", order);
  expr(L, "pos", burstExprPos(ctrl.name)); expr(L, "scale", burstExprScale(ctrl.name)); expr(L, "rot", burstExprRot(ctrl.name)); L.label = 10; blur(L);
}
// STAGGER: key the Leader with applyCurve; followers copy it with a delay. Controls: Leader, Delay (frames); Order per layer.
function staggerExpr(ctrlName, path) {
  return ["// STAGGER: copies the Leader's move, delayed. Controls: " + ctrlName + " > Leader, Delay (frames). This layer: Order.",
    "var c = thisComp.layer(\"" + ctrlName + "\");",
    "var lead = c.effect(\"Leader\")(\"Layer\");",
    "lead." + path + ".valueAtTime(time - c.effect(\"Delay (frames)\")(\"Slider\") * thisComp.frameDuration * effect(\"Order\")(\"Slider\"));"].join("\n");
}
// FLOAT: idle bob/drift for held frames, with controls.
function floatExpr(ctrlName) {
  return ["// FLOAT: gentle idle bob so held frames stay alive. Controls: " + ctrlName + " > Float (px), Float Speed (0 = still).",
    "var c = thisComp.layer(\"" + ctrlName + "\");",
    "value + [0, Math.sin(time * c.effect(\"Float Speed\")(\"Slider\") + index) * c.effect(\"Float (px)\")(\"Slider\")];"].join("\n");
}


// LETTER CASCADE: each letter drops in after the one before. The ease lives in the keys of <ctrl> > Drop In (%)
// (apply a fitted curve to it, overshoot included); the selector maps it linearly per letter.
// pose = { pos: [x, y, 0], scale: 60, opacity: 0, rot: -3 } = how letters start. Controls on ctrl: Drop In (%), Letter Delay (frames).
function cascadeText(T, ctrl, pose) {
  function animProps() { return prop(prop(prop(prop(T, "ADBE Text Properties"), "ADBE Text Animators"), "Cascade"), "ADBE Text Animator Properties"); }
  var an = prop(prop(T, "ADBE Text Properties"), "ADBE Text Animators").addProperty("ADBE Text Animator"); an.name = "Cascade";
  if (pose.pos) animProps().addProperty("ADBE Text Position 3D").setValue(pose.pos);          // re-fetch after every add:
  if (pose.scale != null) animProps().addProperty("ADBE Text Scale 3D").setValue([pose.scale, pose.scale, 100]);   // adding kills sibling handles
  if (pose.opacity != null) animProps().addProperty("ADBE Text Opacity").setValue(pose.opacity);
  if (pose.rot) animProps().addProperty("ADBE Text Rotation").setValue(pose.rot);
  prop(prop(prop(prop(T, "ADBE Text Properties"), "ADBE Text Animators"), "Cascade"), "ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
  EXPRS.push({ L: T, g: function () { return prop(prop(prop(prop(prop(prop(T, "ADBE Text Properties"), "ADBE Text Animators"), "Cascade"), "ADBE Text Selectors"), 1), "ADBE Text Expressible Amount"); },
    t: ["// CASCADE: each letter follows the Drop In (%) keys, one after another. Controls: " + ctrl.name + " > Drop In (%) keys (the ease), Letter Delay (frames).",
        "var c = thisComp.layer(\"" + ctrl.name + "\");",
        "var d = c.effect(\"Letter Delay (frames)\")(\"Slider\") * thisComp.frameDuration;",
        "var a = 100 - c.effect(\"Drop In (%)\")(\"Slider\").valueAtTime(time - (textIndex - 1) * d);   // 100 = start pose, 0 = rest, below 0 = overshoot",
        "[a, a, a];"].join("\n") });
}

// ---------------------------------------------------------------- mattes
function setMatte(target, matte, type) {
  if (matte.containingComp.id !== target.containingComp.id) throw new Error("Matte must be in the same comp: " + matte.name);
  if (HAS_NEW_MATTES) target.setTrackMatte(matte, type); else { matte.moveBefore(target); target.trackMatteType = type; }
  if (matte.name.indexOf("MATTE_") === 0) { matte.enabled = false; matte.label = 3; }
  if (matte.inPoint > target.inPoint) matte.inPoint = target.inPoint;
  if (matte.outPoint < target.outPoint) matte.outPoint = target.outPoint;
  MATTE_COUNT++;
}
function checkMattes(comp) {
  var out = [];
  for (var i = 1; i <= comp.numLayers; i++) {
    var L = comp.layer(i); if (!L.hasTrackMatte) continue;
    var M = HAS_NEW_MATTES ? L.trackMatteLayer : (i > 1 ? comp.layer(i - 1) : null);
    if (!M) { out.push(L.name + ": matte missing"); continue; }
    if (M.name.indexOf("MATTE_") === 0 && M.enabled) out.push(M.name + ": video is on, it will show on screen");
    if (M.inPoint > L.inPoint + 0.001 || M.outPoint < L.outPoint - 0.001) out.push(M.name + ": shorter than " + L.name);
    if (M.hasTrackMatte) out.push(M.name + ": matte has its own matte, precomp instead");
  }
  return out;
}

// ---------------------------------------------------------------- finishing a comp (order matters)
function finishComp(c) {
  var tops = [], i;
  for (i = 1; i <= c.numLayers; i++) { var nm = c.layer(i).name; if (nm.indexOf("CTRL_") === 0 || nm.indexOf("CAM_") === 0 || nm.indexOf("GUIDE_") === 0) tops.push(c.layer(i)); }
  for (i = tops.length - 1; i >= 0; i--) tops[i].moveToBeginning();                      // 1 controls on top
  for (i = 0; i < MATTES.length; i++) setMatte(MATTES[i][0], MATTES[i][1], MATTES[i][2]); // 2 mattes once order is final
  for (i = 0; i < LCTRL.length; i++) ctlProp(LCTRL[i][0], LCTRL[i][1]).setValue(LCTRL[i][2].index);   // 3 layer pickers
  for (i = 0; i < EXPRS.length; i++) {                                                     // 4 expressions last
    var e = EXPRS[i], p = e.g();
    try { p.expression = e.t; EXPR_COUNT++; if (p.expressionError) ERRORS.push(c.name + " > " + e.L.name + ": " + p.expressionError); }
    catch (err) { ERRORS.push(c.name + " > " + e.L.name + ": " + err.toString()); }
  }
  var bad = checkMattes(c); for (i = 0; i < bad.length; i++) ERRORS.push(c.name + ": " + bad[i]);
  EXPRS = []; LCTRL = []; MATTES = [];
}

// ---------------------------------------------------------------- build isolation + honest report
function safe(name, fn) {
  try { var r = fn(); if (r) DONE.push(name); return r; }
  catch (e) { ERRORS.push(name + " FAILED: " + e.toString() + (e.line ? " (script line " + e.line + ")" : "")); EXPRS = []; LCTRL = []; MATTES = []; return null; }
}
function report(title, totalComps) {
  var head = title + "\nBuilt " + DONE.length + " of " + totalComps + " comps.  Layers: " + LAYER_COUNT + "   Keyframes: " + KEY_COUNT + "   Expressions: " + EXPR_COUNT + "   Mattes: " + MATTE_COUNT;
  var full = head + "\n\nERRORS (" + ERRORS.length + "):\n" + ERRORS.join("\n") + "\n\nNOTES (" + WARN.length + "):\n" + WARN.join("\n") + "\n\nBUILT:\n" + DONE.join("\n");
  var logPath = "";
  try { var lf = File(Folder.desktop.fsName + "/" + title.replace(/[^A-Za-z0-9]+/g, "_") + "_log.txt"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(full); lf.close(); logPath = lf.fsName; } catch (e) { }
  var msg = head + (ERRORS.length ? "\n\nERRORS (" + ERRORS.length + "):\n" + ERRORS.slice(0, 12).join("\n") : "\n\nNo errors.");
  if (WARN.length) msg += "\n\nNotes: " + WARN.length + " (see the log)."; if (logPath) msg += "\n\nFull log: " + logPath;
  alert(msg);
}

// ---------------------------------------------------------------- DATA (generated by generator/build_ae.py from the HTML build; do not edit by hand)
// Keys: [time (s), value, speed in, speed out, influence in %, influence out %, hold in, hold out], fitted to the film's own curves.
var DATA = {"fps":30,"w":1920,"h":1080,"dur":20.0,"guide":true,"totalComps":18,"beats":[[0.0,"A: collage"],[0.5667,"A: phone"],[2.1,"A: prompt"],[3.2667,"A: send close-up"],[4.0,"A: press"],[4.6,"A: listing"],[6.1667,"A: checkout whip"],[7.4333,"A: white panel whip"],[8.9667,"B: collage"],[9.5333,"B: phone"],[11.0667,"B: prompt"],[12.2333,"B: send close-up"],[12.9667,"B: press"],[13.5667,"B: listing"],[15.1333,"B: checkout whip"],[16.4,"B: white panel whip"],[17.9333,"end card"]],"paper":{"base":"#F8EEDF","ramp":[[960,594],"#FCF5EA",[2110,594],"#F4E8D6"],"rings":7,"ring0":140,"gap":150,"speed":18,"ringCol":"#785F3C","ringOp":6,"count":30,"life":7,"spread":2,"onMin":65,"onSpread":30,"drift":18,"sizeMin":12,"sizeMax":24,"orange":72,"cols":["#F4A53C","#F7B84A","#DCD7CF"]},"passes":[{"tag":"A","name":"Lisbon","collage":{"at":0,"dur":0.5667,"tiles":[{"file":"canal","x":489,"y":495,"w":261,"h":252,"inAt":0.0,"kx":[[0.0,777.6,0.0,0.0,33.33,100.0,false,false],[0.0333,777.6,0.0,0.0,0.1,33.33,false,true],[0.0667,674.74,0.0,0.0,33.33,0.1,true,false],[0.1,674.74,0.0,0.0,20.0,33.33,false,true],[0.1333,634.715,0.0,0.0,33.33,33.33,true,true],[0.1667,619.5,0.0,0.0,33.33,0.1,true,false],[0.5333,619.5,0.0,0.0,0.1,33.33,false,false]],"ky":[[0.0,844.8,0.0,0.0,33.33,0.1,false,false],[0.0333,844.8,0.0,0.0,50.0,33.33,false,true],[0.0667,752.52,0.0,0.0,33.33,0.1,true,false],[0.1,752.52,0.0,0.0,20.0,33.33,false,true],[0.1333,666.57,0.0,0.0,33.33,33.33,true,true],[0.1667,621.0,0.0,0.0,33.33,0.1,true,false],[0.5333,621.0,0.0,0.0,0.1,33.33,false,false]],"ks":[[0.0,[18.3744,18.3744],[94.0539,94.0539],[94.0539,94.0539],33.33,33.33,false,false],[0.0333,[21.5064,21.5064],[0.1878,0.1878],[0.1878,0.1878],33.33,33.33,false,true],[0.0667,[24.012,24.012],[0.0,0.0],[0.0,0.0],33.33,15.0,true,false],[0.1,[24.012,24.012],[0.0,0.0],[0.0,0.0],25.0,33.33,false,true],[0.1333,[25.317,25.317],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[26.1,26.1],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[26.1,26.1],[0.0,0.0],[0.0,0.0],90.0,33.33,false,false]]},{"file":"tram","x":594,"y":219,"w":180,"h":176,"inAt":0.0,"kx":[[0.0,939.2,0.0,0.0,33.33,0.1,false,false],[0.0333,939.2,0.0,0.0,30.0,33.33,false,true],[0.0667,811.08,0.0,0.0,33.33,90.0,true,false],[0.1,811.08,0.0,0.0,100.0,33.33,false,true],[0.1333,735.78,0.0,0.0,33.33,33.33,true,true],[0.1667,684.0,0.0,0.0,33.33,0.1,true,false],[0.5333,684.0,0.0,0.0,50.0,33.33,false,false]],"ky":[[0.0,483.6,0.0,0.0,33.33,0.1,false,false],[0.0333,483.6,0.0,0.0,0.1,33.33,false,true],[0.0667,386.64,0.0,0.0,33.33,0.1,true,false],[0.1,386.64,0.0,0.0,20.0,33.33,false,true],[0.1333,323.49,0.0,0.0,33.33,33.33,true,true],[0.1667,307.0,0.0,0.0,33.33,0.1,true,false],[0.5333,307.0,0.0,0.0,0.1,33.33,false,false]],"ks":[[0.0,[12.672,12.672],[64.8647,64.8647],[64.8647,64.8647],33.33,33.33,false,false],[0.0333,[14.832,14.832],[0.1295,0.1295],[0.1295,0.1295],33.33,33.33,false,true],[0.0667,[16.56,16.56],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.1,[16.56,16.56],[0.0,0.0],[0.0,0.0],5.0,33.33,false,true],[0.1333,[17.46,17.46],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[18.0,18.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[18.0,18.0],[0.0,0.0],[0.0,0.0],15.0,33.33,false,false]]},{"file":"island","x":726,"y":783,"w":156,"h":192,"inAt":0.0667,"kx":[[0.0667,858.48,0.0,0.0,33.33,0.1,false,false],[0.1,858.48,0.0,0.0,80.0,33.33,false,true],[0.1333,820.68,0.0,0.0,33.33,33.33,true,true],[0.1667,804.0,0.0,0.0,33.33,0.1,true,false],[0.5333,804.0,0.0,0.0,10.0,33.33,false,false]],"ky":[[0.0667,898.88,0.0,0.0,33.33,0.1,false,false],[0.1,898.88,0.0,0.0,90.0,33.33,false,true],[0.1333,871.33,0.0,0.0,33.33,33.33,true,true],[0.1667,879.0,0.0,0.0,33.33,5.0,true,false],[0.5333,879.0,0.0,0.0,80.0,33.33,false,false]],"ks":[[0.0667,[15.5443,15.5443],[79.5674,79.5674],[79.5674,79.5674],33.33,33.33,false,false],[0.1,[18.1939,18.1939],[0.1589,0.1589],[0.1589,0.1589],33.33,33.33,false,true],[0.1333,[18.624,18.624],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[19.2,19.2],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[19.2,19.2],[0.0,0.0],[0.0,0.0],10.0,33.33,false,false]]},{"file":"sunset","x":960,"y":714,"w":324,"h":363,"inAt":0.0667,"kx":[[0.0667,1228.04,0.0,0.0,33.33,0.1,false,false],[0.1,1228.04,0.0,0.0,5.0,33.33,false,true],[0.1333,1167.64,0.0,0.0,33.33,33.33,true,true],[0.1667,1122.0,0.0,0.0,33.33,0.1,true,false],[0.5333,1122.0,0.0,0.0,15.0,33.33,false,false]],"ky":[[0.0667,1019.06,0.0,0.0,33.33,0.1,false,false],[0.1,1019.06,0.0,0.0,0.1,33.33,false,true],[0.1333,939.835,0.0,0.0,33.33,33.33,true,true],[0.1667,895.5,0.0,0.0,33.33,15.0,true,false],[0.5333,895.5,0.0,0.0,100.0,33.33,false,false]],"ks":[[0.0667,[29.3885,29.3885],[150.4321,150.4321],[150.4321,150.4321],33.33,33.33,false,false],[0.1,[34.3979,34.3979],[0.3004,0.3004],[0.3004,0.3004],33.33,33.33,false,true],[0.1333,[35.211,35.211],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[36.3,36.3],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[36.3,36.3],[0.0,0.0],[0.0,0.0],0.1,33.33,false,false]]},{"file":"lighthouse","x":860,"y":60,"w":200,"h":185,"inAt":0.1333,"kx":[[0.1333,975.5,0.0,0.0,33.33,33.33,false,true],[0.1667,960.0,0.0,0.0,33.33,0.1,true,false],[0.5333,960.0,0.0,0.0,60.0,33.33,false,false]],"ky":[[0.1333,226.125,0.0,0.0,33.33,33.33,false,true],[0.1667,152.5,0.0,0.0,33.33,0.1,true,false],[0.5333,152.5,0.0,0.0,33.33,33.33,false,false]],"ks":[[0.1333,[17.072,17.072],[0.0,0.0],[0.0,0.0],33.33,33.33,false,true],[0.1667,[20.6,20.6],[-0.036,-0.036],[-0.036,-0.036],33.33,35.33,true,false],[0.2,[20.0,20.0],[-9.009,-9.009],[-9.009,-9.009],14.0,0.1,false,false],[0.5333,[20.0,20.0],[0.0,0.0],[0.0,0.0],80.0,33.33,false,false]]},{"file":"tiles","x":1140,"y":177,"w":234,"h":224,"inAt":0.1333,"kx":[[0.1333,1295.09,0.0,0.0,33.33,33.33,false,true],[0.1667,1257.0,0.0,0.0,33.33,0.1,true,false],[0.5333,1257.0,0.0,0.0,80.0,33.33,false,false]],"ky":[[0.1333,316.53,0.0,0.0,33.33,33.33,false,true],[0.1667,289.0,0.0,0.0,33.33,0.1,true,false],[0.5333,289.0,0.0,0.0,0.1,33.33,false,false]],"ks":[[0.1333,[19.9742,19.9742],[0.0,0.0],[0.0,0.0],33.33,33.33,false,true],[0.1667,[24.102,24.102],[-0.0421,-0.0421],[-0.0421,-0.0421],33.33,35.33,true,false],[0.2,[23.4,23.4],[-10.5405,-10.5405],[-10.5405,-10.5405],14.0,0.1,false,false],[0.5333,[23.4,23.4],[0.0,0.0],[0.0,0.0],80.0,33.33,false,false]]},{"file":"peaks","x":1203,"y":519,"w":261,"h":222,"inAt":0.1667,"kx":[[0.1667,1333.5,0.0,0.0,33.33,33.33,false,false]],"ky":[[0.1667,630.0,0.0,0.0,33.33,33.33,false,false]],"ks":[[0.1667,[22.968,22.968],[117.5673,117.5673],[117.5673,117.5673],33.33,33.33,false,false],[0.2,[26.883,26.883],[0.0939,0.0939],[0.0939,0.0939],33.33,35.33,false,false],[0.2333,[26.1,26.1],[-11.7567,-11.7567],[-11.7567,-11.7567],14.0,0.1,false,false],[0.5333,[26.1,26.1],[0.0,0.0],[0.0,0.0],95.0,33.33,false,false]]}],"cam":[[0.0,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.1333,[100.0,100.0],[0.0,0.0],[0.0,0.0],15.0,100.0,false,false],[0.1667,[100.0,100.0],[3.0,3.0],[3.0,3.0],0.1,0.1,false,false],[0.5333,[102.2,102.2],[6.0,6.0],[6.0,6.0],99.0,33.33,false,false]],"markers":[[0,"pairs pop on (0, 2, 4)"],[0.16666666666666666,"jump to places, slow push-in"]]},"phone":{"at":17,"dur":1.5333,"tiles":[{"file":"tram","x":590,"y":383,"w":150,"h":200,"mask":[[0.0,750.0,1000.0,"hold","hold"],[0.2333,697.75,1000.0,"hold","linear"],[0.2667,678.75,1000.0,"linear","linear"],[0.3,670.3213,1000.0,"linear","linear"],[0.3333,664.5,1000.0,"linear","linear"],[0.3667,659.5125,1000.0,"linear","linear"],[0.4,655.0,1000.0,"linear","hold"],[0.4333,560.0,1000.0,"hold","hold"]],"kx":[[0.0,665.0,0.0,0.0,33.33,0.1,false,false],[0.2,665.0,0.0,0.0,5.0,33.33,false,true],[0.2333,698.275,363.1543,363.1543,33.33,24.0,true,false],[0.4,725.5,90.7409,90.7409,91.0,33.33,false,true],[0.4333,779.91,60.0445,60.0445,33.33,20.0,true,false],[0.6667,786.0,3.4794,3.4794,81.0,0.1,false,false],[1.5,786.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,483.0,0.0,0.0,33.33,40.0,false,false],[0.2,483.0,0.0,0.0,100.0,33.33,false,true],[0.2333,470.35,-138.0587,-138.0587,33.33,24.0,true,false],[0.4,460.0,-34.4966,-34.4966,91.0,33.33,false,true],[0.4333,433.395,35.5436,35.5436,33.33,20.0,true,false],[0.6667,437.0,2.0596,2.0596,81.0,0.1,false,false],[1.2,437.0,0.0,0.0,80.0,100.0,false,false],[1.2333,437.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,397.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[20.0,20.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[20.0,20.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[20.0,20.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.4,[20.0,20.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.4333,[20.7,20.7],[-6.9017,-6.9017],[-6.9017,-6.9017],33.33,20.0,true,false],[0.6667,[20.0,20.0],[-0.3999,-0.3999],[-0.3999,-0.3999],81.0,0.1,false,false],[1.5,[20.0,20.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"sunset","x":816,"y":297,"w":288,"h":224,"mask":[[0.0,1000.0,777.7778,"hold","hold"],[0.2333,1000.0,815.5259,"hold","linear"],[0.2667,1000.0,833.3333,"linear","linear"],[0.3,1000.0,842.1701,"linear","linear"],[0.3333,1000.0,848.659,"linear","linear"],[0.3667,1000.0,854.4911,"linear","linear"],[0.4,1000.0,860.0,"linear","hold"],[0.4333,933.3333,1000.0,"hold","hold"]],"kx":[[0.0,960.0,0.0,0.0,33.33,0.1,false,false],[0.2,960.0,0.0,0.0,30.0,33.33,false,true],[0.2333,912.15,-522.2219,-522.2219,33.33,24.0,true,false],[0.4,873.0,-130.487,-130.487,91.0,33.33,false,true],[0.4333,779.91,60.0445,60.0445,33.33,20.0,true,false],[0.6667,786.0,3.4794,3.4794,81.0,0.1,false,false],[1.5,786.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,409.0,0.0,0.0,33.33,0.1,false,false],[0.2,409.0,0.0,0.0,100.0,33.33,false,true],[0.2333,464.0,600.2551,600.2551,33.33,24.0,true,false],[0.4,509.0,149.985,149.985,91.0,33.33,false,true],[0.4333,611.415,-23.8108,-23.8108,33.33,20.0,true,false],[0.6667,609.0,-1.3797,-1.3797,81.0,0.1,false,false],[1.2,609.0,0.0,0.0,80.0,100.0,false,false],[1.2333,609.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,569.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[28.8,28.8],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[28.8,28.8],[0.0,0.0],[0.0,0.0],100.0,33.33,false,true],[0.2333,[23.96,23.96],[-52.8224,-52.8224],[-52.8224,-52.8224],33.33,24.0,true,false],[0.4,[20.0,20.0],[-13.1987,-13.1987],[-13.1987,-13.1987],91.0,33.33,false,true],[0.4333,[12.42,12.42],[-4.141,-4.141],[-4.141,-4.141],33.33,20.0,true,false],[0.6667,[12.0,12.0],[-0.24,-0.24],[-0.24,-0.24],81.0,0.1,false,false],[1.5,[12.0,12.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"canal","x":1152,"y":315,"w":150,"h":236,"mask":[[0.0,635.5932,1000.0,"hold","hold"],[0.2333,677.8903,1000.0,"hold","linear"],[0.2667,695.7055,1000.0,"linear","linear"],[0.3,704.0994,1000.0,"linear","linear"],[0.3333,710.0862,1000.0,"linear","linear"],[0.3667,715.3441,1000.0,"linear","linear"],[0.4,720.2073,1000.0,"linear","hold"],[0.4333,853.3333,1000.0,"hold","hold"]],"kx":[[0.0,1227.0,0.0,0.0,33.33,0.1,false,false],[0.2,1227.0,0.0,0.0,5.0,33.33,false,true],[0.2333,1107.925,-1299.5522,-1299.5522,33.33,24.0,true,false],[0.4,1010.5,-324.7175,-324.7175,91.0,33.33,false,true],[0.4333,788.19,57.2838,57.2838,33.33,20.0,true,false],[0.6667,794.0,3.3194,3.3194,81.0,0.1,false,false],[1.5,794.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,433.0,0.0,0.0,33.33,0.1,false,false],[0.2,433.0,0.0,0.0,0.1,33.33,false,true],[0.2333,521.825,969.4119,969.4119,33.33,24.0,true,false],[0.4,594.5,242.2258,242.2258,91.0,33.33,false,true],[0.4333,763.56,-74.538,-74.538,33.33,20.0,true,false],[0.6667,756.0,-4.3192,-4.3192,81.0,0.1,false,false],[1.2,756.0,0.0,0.0,80.0,100.0,false,false],[1.2333,756.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,716.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[23.6,23.6],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[23.6,23.6],[0.0,0.0],[0.0,0.0],100.0,33.33,false,true],[0.2333,[21.235,21.235],[-25.811,-25.811],[-25.811,-25.811],33.33,24.0,true,false],[0.4,[19.3,19.3],[-6.4494,-6.4494],[-6.4494,-6.4494],91.0,33.33,false,true],[0.4333,[15.525,15.525],[-5.1763,-5.1763],[-5.1763,-5.1763],33.33,20.0,true,false],[0.6667,[15.0,15.0],[-0.2999,-0.2999],[-0.2999,-0.2999],81.0,0.1,false,false],[1.5,[15.0,15.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"island","x":610,"y":617,"w":160,"h":180,"mask":[[0.0,888.8889,1000.0,"hold","hold"],[0.2333,930.3905,1000.0,"hold","linear"],[0.2667,945.8689,1000.0,"linear","linear"],[0.3,952.8034,1000.0,"linear","linear"],[0.3333,957.6174,1000.0,"linear","linear"],[0.3667,961.758,1000.0,"linear","linear"],[0.4,965.5172,1000.0,"linear","hold"],[0.4333,1000.0,954.5455,"hold","hold"]],"kx":[[0.0,690.0,0.0,0.0,33.33,0.1,false,false],[0.2,690.0,0.0,0.0,10.0,33.33,false,true],[0.2333,759.85,762.3239,762.3239,33.33,24.0,true,false],[0.4,817.0,190.481,190.481,91.0,33.33,false,true],[0.4333,943.44,5.5213,5.5213,33.33,28.33,true,false],[0.5667,943.936,0.9932,0.9932,63.0,10.0,false,false],[1.5,944.0,0.0,0.0,91.0,33.33,false,false]],"ky":[[0.0,707.0,0.0,0.0,33.33,0.1,false,false],[0.2,707.0,0.0,0.0,40.0,33.33,false,true],[0.2333,625.05,-894.38,-894.38,33.33,24.0,true,false],[0.4,558.0,-223.4777,-223.4777,91.0,33.33,false,true],[0.4333,404.415,45.2059,45.2059,33.33,20.0,true,false],[0.6667,409.0,2.6195,2.6195,81.0,0.1,false,false],[1.2,409.0,0.0,0.0,80.0,100.0,false,false],[1.2333,409.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,369.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[18.0,18.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[18.0,18.0],[0.0,0.0],[0.0,0.0],5.0,33.33,false,true],[0.2333,[17.67,17.67],[-3.6015,-3.6015],[-3.6015,-3.6015],33.33,24.0,true,false],[0.4,[17.4,17.4],[-0.8999,-0.8999],[-0.8999,-0.8999],91.0,33.33,false,true],[0.4333,[18.216,18.216],[-6.0735,-6.0735],[-6.0735,-6.0735],33.33,20.0,true,false],[0.6667,[17.6,17.6],[-0.3519,-0.3519],[-0.3519,-0.3519],81.0,0.1,false,false],[1.5,[17.6,17.6],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"tiles","x":800,"y":539,"w":320,"h":262,"mask":[[0.0,1000.0,818.75,"hold","hold"],[0.2333,1000.0,826.1569,"hold","linear"],[0.2667,1000.0,829.4062,"linear","linear"],[0.3,1000.0,830.9651,"linear","linear"],[0.3333,1000.0,832.0881,"linear","linear"],[0.3667,1000.0,833.0821,"linear","linear"],[0.4,1000.0,834.0081,"linear","hold"],[0.4333,1000.0,862.069,"hold","hold"]],"kx":[[0.0,960.0,0.0,0.0,33.33,0.1,false,false],[0.2,960.0,0.0,0.0,30.0,33.33,false,true],[0.2333,956.425,-39.0166,-39.0166,33.33,24.0,true,false],[0.4,953.5,-9.749,-9.749,91.0,33.33,false,true],[0.4333,946.545,4.4861,4.4861,33.33,20.0,true,false],[0.6667,947.0,0.26,0.26,81.0,0.1,false,false],[1.5,947.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,670.0,0.0,0.0,33.33,0.1,false,false],[0.2,670.0,0.0,0.0,15.0,33.33,false,true],[0.2333,645.25,-270.1148,-270.1148,33.33,24.0,true,false],[0.4,625.0,-67.4933,-67.4933,91.0,33.33,false,true],[0.4333,581.4,-13.8033,-13.8033,33.33,20.0,true,false],[0.6667,580.0,-0.7999,-0.7999,81.0,0.1,false,false],[1.2,580.0,0.0,0.0,80.0,100.0,false,false],[1.2333,580.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,540.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[32.0,32.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[32.0,32.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[27.985,27.985],[-43.8186,-43.8186],[-43.8186,-43.8186],33.33,24.0,true,false],[0.4,[24.7,24.7],[-10.9489,-10.9489],[-10.9489,-10.9489],91.0,33.33,false,true],[0.4333,[18.009,18.009],[-6.0045,-6.0045],[-6.0045,-6.0045],33.33,20.0,true,false],[0.6667,[17.4,17.4],[-0.3479,-0.3479],[-0.3479,-0.3479],81.0,0.1,false,false],[1.5,[17.4,17.4],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"lighthouse","x":1144,"y":587,"w":140,"h":206,"mask":[[0.0,679.6117,1000.0,"hold","hold"],[0.2333,726.9201,1000.0,"hold","linear"],[0.2667,745.6954,1000.0,"linear","linear"],[0.3,754.3206,1000.0,"linear","linear"],[0.3333,760.3886,1000.0,"linear","linear"],[0.3667,765.6613,1000.0,"linear","linear"],[0.4,770.4918,1000.0,"linear","hold"],[0.4333,887.5,1000.0,"hold","hold"]],"kx":[[0.0,1214.0,0.0,0.0,33.33,0.1,false,false],[0.2,1214.0,0.0,0.0,0.1,33.33,false,true],[0.2333,1142.775,-777.3303,-777.3303,33.33,24.0,true,false],[0.4,1084.5,-194.2306,-194.2306,91.0,33.33,false,true],[0.4333,954.825,1.7254,1.7254,33.33,33.33,true,false],[0.5,954.94,0.8907,0.8907,33.33,9.0,false,false],[1.5,955.0,0.0,0.0,85.0,33.33,false,false]],"ky":[[0.0,690.0,0.0,0.0,33.33,0.1,false,false],[0.2,690.0,0.0,0.0,10.0,33.33,false,true],[0.2333,705.675,171.0727,171.0727,33.33,24.0,true,false],[0.4,718.5,42.7457,42.7457,91.0,33.33,false,true],[0.4333,754.245,-71.4323,-71.4323,33.33,20.0,true,false],[0.6667,747.0,-4.1392,-4.1392,81.0,0.1,false,false],[1.2,747.0,0.0,0.0,80.0,100.0,false,false],[1.2333,747.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,707.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[20.6,20.6],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[20.6,20.6],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[19.335,19.335],[-13.8059,-13.8059],[-13.8059,-13.8059],33.33,24.0,true,false],[0.4,[18.3,18.3],[-3.4497,-3.4497],[-3.4497,-3.4497],91.0,33.33,false,true],[0.4333,[16.56,16.56],[-5.5213,-5.5213],[-5.5213,-5.5213],33.33,20.0,true,false],[0.6667,[16.0,16.0],[-0.3199,-0.3199],[-0.3199,-0.3199],81.0,0.1,false,false],[1.5,[16.0,16.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"city","x":620,"y":827,"w":150,"h":150,"mask":[[0.0,1000.0,1000.0,"hold","hold"],[0.2333,859.3518,1000.0,"hold","linear"],[0.2667,815.4506,1000.0,"linear","linear"],[0.3,797.0197,1000.0,"linear","linear"],[0.3333,784.6411,1000.0,"linear","linear"],[0.3667,774.2549,1000.0,"linear","linear"],[0.4,765.0273,1000.0,"linear","hold"],[0.4333,601.8519,1000.0,"hold","hold"]],"kx":[[0.0,695.0,0.0,0.0,33.33,0.1,false,false],[0.2,695.0,0.0,0.0,30.0,33.33,false,true],[0.2333,809.95,1254.5331,1254.5331,33.33,24.0,true,false],[0.4,904.0,313.4687,313.4687,91.0,33.33,false,true],[0.4333,1118.355,-52.7978,-52.7978,33.33,20.0,true,false],[0.6667,1113.0,-3.0594,-3.0594,81.0,0.1,false,false],[1.5,1113.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,902.0,0.0,0.0,33.33,0.1,false,false],[0.2,902.0,0.0,0.0,100.0,33.33,false,true],[0.2333,769.175,-1449.616,-1449.616,33.33,24.0,true,false],[0.4,660.5,-362.2138,-362.2138,91.0,33.33,false,true],[0.4333,414.765,41.7551,41.7551,33.33,20.0,true,false],[0.6667,419.0,2.4196,2.4196,81.0,0.1,false,false],[1.2,419.0,0.0,0.0,80.0,100.0,false,false],[1.2333,419.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,379.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[15.0,15.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[15.0,15.0],[0.0,0.0],[0.0,0.0],30.0,33.33,false,true],[0.2333,[16.815,16.815],[19.8084,19.8084],[19.8084,19.8084],33.33,24.0,true,false],[0.4,[18.3,18.3],[4.9495,4.9495],[4.9495,4.9495],91.0,33.33,false,true],[0.4333,[22.356,22.356],[-7.4538,-7.4538],[-7.4538,-7.4538],33.33,20.0,true,false],[0.6667,[21.6,21.6],[-0.4319,-0.4319],[-0.4319,-0.4319],81.0,0.1,false,false],[1.5,[21.6,21.6],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"balloon","x":850,"y":823,"w":220,"h":150,"mask":[[0.0,1000.0,681.8182,"hold","hold"],[0.2333,1000.0,733.5065,"hold","linear"],[0.2667,1000.0,756.1644,"linear","linear"],[0.3,1000.0,767.0307,"linear","linear"],[0.3333,1000.0,774.8571,"linear","linear"],[0.3667,1000.0,781.7839,"linear","linear"],[0.4,1000.0,788.2353,"linear","hold"],[0.4333,1000.0,983.3333,"hold","hold"]],"kx":[[0.0,960.0,0.0,0.0,33.33,0.1,false,false],[0.2,960.0,0.0,0.0,30.0,33.33,false,true],[0.2333,1004.0,480.2041,480.2041,33.33,24.0,true,false],[0.4,1040.0,119.988,119.988,91.0,33.33,false,true],[0.4333,1125.6,-55.2133,-55.2133,33.33,20.0,true,false],[0.6667,1120.0,-3.1994,-3.1994,81.0,0.1,false,false],[1.5,1120.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,898.0,0.0,0.0,33.33,0.1,false,false],[0.2,898.0,0.0,0.0,80.0,33.33,false,true],[0.2333,815.5,-900.3826,-900.3826,33.33,24.0,true,false],[0.4,748.0,-224.9775,-224.9775,91.0,33.33,false,true],[0.4333,600.03,-20.0148,-20.0148,33.33,20.0,true,false],[0.6667,598.0,-1.1598,-1.1598,81.0,0.1,false,false],[1.2,598.0,0.0,0.0,80.0,100.0,false,false],[1.2333,598.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,558.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[22.0,22.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[22.0,22.0],[0.0,0.0],[0.0,0.0],15.0,33.33,false,true],[0.2333,[19.25,19.25],[-30.0128,-30.0128],[-30.0128,-30.0128],33.33,24.0,true,false],[0.4,[17.0,17.0],[-7.4993,-7.4993],[-7.4993,-7.4993],91.0,33.33,false,true],[0.4333,[12.42,12.42],[-4.141,-4.141],[-4.141,-4.141],33.33,20.0,true,false],[0.6667,[12.0,12.0],[-0.24,-0.24],[-0.24,-0.24],81.0,0.1,false,false],[1.5,[12.0,12.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"dunes","x":1132,"y":811,"w":150,"h":160,"mask":[[0.0,937.5,1000.0,"hold","hold"],[0.2333,868.75,1000.0,"hold","linear"],[0.2667,843.75,1000.0,"linear","linear"],[0.3,832.6596,1000.0,"linear","linear"],[0.3333,825.0,1000.0,"linear","linear"],[0.3667,818.4375,1000.0,"linear","linear"],[0.4,812.5,1000.0,"linear","hold"],[0.4333,687.5,1000.0,"hold","hold"]],"kx":[[0.0,1207.0,0.0,0.0,33.33,0.1,false,false],[0.2,1207.0,0.0,0.0,5.0,33.33,false,true],[0.2333,1187.75,-210.0893,-210.0893,33.33,24.0,true,false],[0.4,1172.0,-52.4948,-52.4948,91.0,33.33,false,true],[0.4333,1143.195,-61.0798,-61.0798,33.33,20.0,true,false],[0.6667,1137.0,-3.5393,-3.5393,81.0,0.1,false,false],[1.5,1137.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,891.0,0.0,0.0,33.33,0.1,false,false],[0.2,891.0,0.0,0.0,60.0,33.33,false,true],[0.2333,851.95,-426.1811,-426.1811,33.33,24.0,true,false],[0.4,820.0,-106.4894,-106.4894,91.0,33.33,false,true],[0.4333,756.315,-72.1224,-72.1224,33.33,20.0,true,false],[0.6667,749.0,-4.1792,-4.1792,81.0,0.1,false,false],[1.2,749.0,0.0,0.0,80.0,100.0,false,false],[1.2333,749.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,709.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[16.0,16.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[16.0,16.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[16.0,16.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.4,[16.0,16.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.4333,[16.56,16.56],[-5.5213,-5.5213],[-5.5213,-5.5213],33.33,20.0,true,false],[0.6667,[16.0,16.0],[-0.3199,-0.3199],[-0.3199,-0.3199],81.0,0.1,false,false],[1.5,[16.0,16.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]}],"header":[{"k":"icon","name":"Phone_Back_Icon","file":"back","x":786.0,"y":175.0,"w":18.0,"h":18.0,"blur":true},{"k":"icon","name":"Phone_Bell_Icon","file":"bell","x":1080.0,"y":175.0,"w":18.0,"h":18.0,"blur":true},{"k":"icon","name":"Phone_Gear_Icon","file":"gear","x":1116.0,"y":175.0,"w":18.0,"h":18.0,"blur":true},{"k":"text","name":"Phone_App_Name","str":"WAYFOLD","weight":600,"size":14,"color":"#141414","track":20.0,"x":822.0,"y":189.0625,"just":"left","blur":true},{"k":"text","name":"Phone_Title_1","str":"WHERE ARE YOU HEADED","weight":600,"size":21,"color":"#141414","track":-5.0,"x":784.0,"y":245.3438,"just":"left","blur":true},{"k":"text","name":"Phone_Title_2","str":"NEXT?","weight":600,"size":21,"color":"#141414","track":-5.0,"x":784.0,"y":270.3438,"just":"left","blur":true}],"bar":[{"k":"box","name":"Bar_Button_Plus","x":778.0,"y":866.0,"w":46.0,"h":46.0,"r":12,"blur":true,"fill":"#F1F1F1"},{"k":"box","name":"Bar_Button_Search","x":832.0,"y":866.0,"w":46.0,"h":46.0,"r":12,"blur":true,"fill":"#F1F1F1"},{"k":"box","name":"Bar_CTA","x":886.0,"y":866.0,"w":256.0,"h":46.0,"r":12,"blur":true,"fill":"#F1F1F1"},{"k":"icon","name":"Bar_Plus_Icon","file":"plus_22","x":790.0,"y":878.0,"w":22.0,"h":22.0,"blur":true},{"k":"icon","name":"Bar_Search_Icon","file":"search","x":844.0,"y":878.0,"w":22.0,"h":22.0,"blur":true},{"k":"icon","name":"Bar_Bag_Icon","file":"bag","x":902.0,"y":879.0,"w":20.0,"h":20.0,"blur":true},{"k":"icon","name":"Bar_Arrow_Icon","file":"arrow","x":934.0,"y":879.0,"w":20.0,"h":20.0,"blur":true},{"k":"text","name":"Bar_CTA_Text","str":"SAVE TRIP","weight":900,"size":18,"color":"#141414","track":0,"x":966.0,"y":895.9375,"just":"left","blur":true}],"cardIn":0.0667,"card":{"k":"box","name":"Phone_Card","x":760,"y":147,"w":400,"h":786,"r":26,"fill":"#FFFFFF"},"matte":{"k":"box","name":"MATTE_PhoneScreen","x":760,"y":147,"w":400,"h":786,"r":26,"fill":"#FFFFFF"},"matteSize":[[0,[4000,4000]],[0.0667,[400,786]]],"shadow":{"col":"#785A32","op":14,"dist":18,"soft":50},"grpS":[[0.0,[92.5,92.5],[0.0,0.0],[0.0,0.0],33.33,100.0,false,false],[0.0667,[92.5,92.5],[0.0029,0.0029],[0.0029,0.0029],0.1,33.33,false,false],[0.1,[92.6571,92.6571],[8.4025,8.4025],[8.4025,8.4025],33.33,100.0,false,false],[0.2333,[93.7,93.7],[9.9618,9.9618],[9.9618,9.9618],0.1,33.33,false,false],[0.2667,[94.4,94.4],[9.9616,9.9616],[9.9616,9.9616],33.33,20.0,false,false],[0.4,[95.5,95.5],[20.2991,20.2991],[20.2991,20.2991],27.0,33.33,false,false],[0.4333,[98.1,98.1],[31.5042,31.5042],[31.5042,31.5042],33.33,9.0,false,false],[0.6667,[100.0,100.0],[2.0,2.0],[2.0,2.0],74.0,0.1,false,false],[1.5,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]],"grpY":[[0.0,541.0,0.0,0.0,33.33,100.0,false,false],[0.0667,541.0,-0.0001,-0.0001,0.1,30.33,false,false],[0.1,540.9951,-0.2896,-0.2896,36.33,2.0,false,false],[0.9,539.2421,-3.6891,-3.6891,53.0,55.0,false,false],[1.2333,538.0,-7.3488,-7.3488,26.0,33.33,false,false],[1.3333,535.5,-30.4056,-30.4056,33.33,59.0,false,false],[1.5,521.0,-135.0147,-135.0147,45.0,33.33,false,false]],"markers":[[0.0667,"card on"],[0.2333,"re-flow"],[0.4333,"grid set"],[1.2333,"scroll out"]]},"prompt":{"at":63,"dur":2.5,"bg":"#FBF1E6","items":[{"k":"icon","name":"Ideas_Icon","file":"bulb","x":240.0,"y":200.0,"w":44.0,"h":56.0,"blur":true},{"k":"text","name":"Ideas_Text","str":"Ideas","weight":450,"size":46,"color":"#141414","track":-10.0,"x":306.0,"y":244.5625,"just":"left","blur":true},{"k":"box","name":"Chip_1_BG","x":246.0,"y":318.0,"w":633.3906,"h":102.0,"r":51,"blur":true,"fill":"#EFE9E1"},{"k":"icon","name":"Chip_1_Icon","file":"doc","x":290.0,"y":346.0,"w":36.0,"h":46.0,"blur":true},{"k":"text","name":"Chip_1_Text","str":"Export itinerary to doc","weight":450,"size":47,"color":"#141414","track":-12.0,"x":352.0,"y":386.0312,"just":"left","blur":true},{"k":"box","name":"Chip_2_BG","x":1032.0,"y":318.0,"w":620.0,"h":102.0,"r":51,"blur":true,"fill":"#EFE9E1"},{"k":"icon","name":"Chip_2_Icon","file":"sheet","x":1076.0,"y":346.0,"w":36.0,"h":46.0,"blur":true},{"k":"text","name":"Chip_2_Text","str":"Share with travel group","weight":450,"size":47,"color":"#141414","track":-12.0,"x":1138.0,"y":386.0312,"just":"left","blur":true},{"k":"icon","name":"Chip_More_Icon","file":"chev","x":1632.0,"y":345.0,"w":30.0,"h":46.0,"blur":true},{"k":"box","name":"Prompt_Card","x":213.0,"y":468.0,"w":1467.0,"h":407.0,"r":22,"blur":true,"fill":"#FFFFFF"},{"k":"text","name":"PromptText","str":"Plan a 5-day trip to Lisbon for two.","weight":450,"size":52,"color":"#141414","track":-18.0,"x":261.0,"y":564.375,"just":"left","blur":true},{"k":"icon","name":"Plus_Icon","file":"plus_36","x":263.0,"y":768.0,"w":36.0,"h":36.0,"blur":true},{"k":"icon","name":"Wayfold_Mark","file":"mark","x":363.0,"y":760.0,"w":52.0,"h":52.0,"blur":true},{"k":"text","name":"Wayfold_Label","str":"Wayfold","weight":450,"size":46,"color":"#141414","track":-10.0,"x":433.0,"y":802.5625,"just":"left","blur":true},{"k":"text","name":"Action_Label","str":"Plan","weight":450,"size":46,"color":"#141414","track":-10.0,"x":1289.0,"y":800.5625,"just":"left","blur":true},{"k":"icon","name":"Mic_Icon","file":"mic","x":1443.0,"y":758.0,"w":40.0,"h":52.0,"blur":true}],"textName":"PromptText","fade":{"x":1032,"y":318,"w":620,"h":102,"completion":13,"feather":111.6},"fadeTargets":["Chip_2_BG","Chip_2_Icon","Chip_2_Text"],"caretGap":3.0,"caretLift":45.375,"caret":{"k":"box","name":"Caret","x":1082,"y":519,"w":3,"h":54,"fill":"#1A1A1A"},"caretOp":[[0,100],[1.4333,0],[1.7,100],[1.9667,0],[2.2333,100]],"sendC":[1595.0,786.0],"cold":"#0B0B0B","hot":"#E28C04","sendBox":{"k":"box","name":"Send_Button","x":1539,"y":732,"w":112,"h":108,"r":12,"fill":"#0B0B0B"},"up":{"k":"icon","name":"Send_Arrow","file":"up","x":1569.0,"y":760.0,"w":52.0,"h":52.0,"blur":true},"cursor":{"pts":[[66,4],[108,128],[64,104],[12,124]]},"curIn":1.1667,"camX":[[0.0,0.0,0.0,0.0,33.33,92.0,false,false],[0.8667,0.0,-0.1146,-0.1146,0.1,33.33,false,false],[0.9,-5.3223,-249.6686,-249.6686,33.33,50.0,false,false],[1.1333,-36.0,-420.2818,-420.2818,43.0,33.33,false,true],[1.1667,-1538.4,-315.0526,-315.0526,33.33,18.0,true,false],[1.6333,-1586.4,-11.16,-11.16,75.0,0.1,false,false],[2.4667,-1586.4,0.0,0.0,100.0,33.33,false,false]],"camY":[[0.0,62.0,-0.0,-0.0,33.33,100.0,false,false],[0.0333,62.0,-1.7303,-1.7303,0.1,33.33,false,false],[0.0667,21.0,-228.721,-228.721,33.33,16.0,false,false],[0.3,4.9111,-23.3654,-23.3654,20.0,7.0,false,false],[0.6667,4.5,-0.0225,-0.0225,100.0,33.33,false,false],[0.7,3.3333,-60.0,-60.0,33.33,33.33,false,false],[0.7333,1.1667,-60.0,-60.0,33.33,7.0,false,false],[1.1333,0.0,0.0,0.0,100.0,33.33,false,true],[1.1667,-711.2,0.0,0.0,33.33,0.1,true,false],[2.1333,-711.2,0.0,0.0,0.1,100.0,false,false],[2.1667,-711.2,11.2481,11.2481,0.1,62.0,false,false],[2.4667,-687.2,157.5215,157.5215,10.0,33.33,false,false]],"camS":[[0.0,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,10.0,false,false],[1.1333,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,true],[1.1667,[160.0,160.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[2.4667,[160.0,160.0],[0.0,0.0],[0.0,0.0],50.0,33.33,false,false]],"typed":[[0.0,30.0,0.0,0.0,33.33,100.0,false,false],[0.0667,30.0,0.0365,0.0365,0.1,33.33,false,false],[0.1,32.0915,115.2439,115.2439,33.33,88.0,false,false],[0.1667,48.0,151.244,151.244,30.33,28.0,false,false],[0.2667,57.3674,105.0603,105.0603,75.0,73.0,false,false],[0.4,74.0,96.4344,96.4344,26.0,33.33,false,false],[0.4667,79.0,94.7811,94.7811,33.33,33.33,false,false],[0.5,83.0,51.499,51.499,33.33,0.1,false,false],[0.7333,91.0,42.8662,42.8662,18.0,15.0,false,false],[0.9,100.0,14.9971,14.9971,55.0,0.1,false,false],[2.4667,100.0,0.0,0.0,90.0,33.33,false,false]],"heat":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[1.3,0.0,0.0,0.0,0.1,100.0,false,false],[1.3333,0.0,22.4984,22.4984,0.1,30.33,false,false],[1.6,20.0,159.3836,159.3836,13.0,33.33,false,false],[1.6667,42.0,277.9378,277.9378,33.33,33.33,false,false],[1.7333,58.0,266.6666,266.6666,33.33,46.0,false,false],[1.9333,100.0,37.4898,37.4898,53.0,0.1,false,false],[2.4667,100.0,0.0,0.0,80.0,33.33,false,false]],"press":[[0.0,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[1.8667,[100.0,100.0],[0.0,0.0],[0.0,0.0],0.1,100.0,false,false],[1.9,[100.0,100.0],[-7.4968,-7.4968],[-7.4968,-7.4968],0.1,67.0,false,false],[2.0667,[90.0,90.0],[-72.003,-72.003],[-72.003,-72.003],58.0,33.33,false,false],[2.1333,[86.0,86.0],[-60.027,-60.027],[-60.027,-60.027],33.33,33.33,false,false],[2.1667,[84.0,84.0],[-0.0475,-0.0475],[-0.0475,-0.0475],33.33,33.33,false,false],[2.2,[84.6667,84.6667],[35.0,35.0],[35.0,35.0],33.33,58.0,false,false],[2.3667,[95.6136,95.6136],[71.5909,71.5909],[71.5909,71.5909],37.0,25.0,false,false],[2.4667,[97.0,97.0],[0.0,0.0],[0.0,0.0],75.0,33.33,false,false]],"curX":[[1.1667,554.0,1378.1016,1378.1016,33.33,33.33,false,false],[1.2333,645.86,974.6055,974.6055,33.33,33.33,false,false],[1.3,696.092,881.7748,881.7748,33.33,33.33,false,false],[1.3333,730.022,580.6586,580.6586,33.33,23.0,false,false],[1.9667,841.631,133.762,133.762,2.1,12.0,false,false],[2.1333,872.0802,101.1042,101.1042,68.0,33.33,false,false],[2.1667,875.0,0.0622,0.0622,33.33,33.33,false,false],[2.2,874.0146,-51.4612,-51.4612,33.33,75.0,false,false],[2.4667,849.9733,-40.6684,-40.6684,100.0,33.33,false,false]],"curY":[[1.1667,818.0,-1190.3387,-1190.3387,33.33,33.33,false,false],[1.2333,738.656,-832.7175,-832.7175,33.33,33.33,false,false],[1.3,695.968,-738.8701,-738.8701,33.33,33.33,false,false],[1.3333,667.896,-462.8488,-462.8488,33.33,24.0,false,false],[1.9333,583.9645,-61.0642,-61.0642,2.1,24.0,false,false],[2.1667,553.0,11.1955,11.1955,30.0,0.1,false,false],[2.4667,598.1765,191.9332,191.9332,99.0,33.33,false,false]],"curS":[[1.1667,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,5.0,false,false],[1.8667,[100.0,100.0],[0.0,0.0],[0.0,0.0],90.0,100.0,false,false],[1.9,[100.0,100.0],[-20.2441,-20.2441],[-20.2441,-20.2441],0.1,50.0,false,false],[2.1333,[82.7,82.7],[-48.4781,-48.4781],[-48.4781,-48.4781],68.0,33.33,false,false],[2.1667,[81.3,81.3],[-0.0298,-0.0298],[-0.0298,-0.0298],33.33,33.33,false,false],[2.2,[81.7725,81.7725],[24.675,24.675],[24.675,24.675],33.33,0.1,false,false],[2.2667,[83.6654,83.6654],[34.812,34.812],[34.812,34.812],17.0,95.0,false,false],[2.3333,[90.7,90.7],[38.2985,38.2985],[38.2985,38.2985],32.0,15.0,false,false],[2.4667,[93.3,93.3],[19.5,19.5],[19.5,19.5],98.0,33.33,false,false]],"markers":[[1.1667,"CUT close-up"],[1.3333,"button heats"],[1.9,"press"]]},"audit":{"at":138,"dur":4.3667,"darkCol":"#1B1B1B","listing":{"ox":300,"oy":200,"w":2400,"h":1500,"items":[{"k":"box","name":"Image_BG_1","x":150.0,"y":160.0,"w":1000.0,"h":440.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_1","file":"lounge","x":150.0,"y":160.0,"w":1000.0,"h":440.0},{"k":"box","name":"Add_Button_1","x":1110.0,"y":512.0,"w":58.0,"h":58.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"icon","name":"Add_Icon_1","file":"plus_30","x":1124.0,"y":526.0,"w":30.0,"h":30.0,"blur":true},{"k":"text","name":"Stay_Name_1","str":"LOFT \u00b7 BAIRRO ALTO","weight":500,"size":25,"color":"#222222","track":100.0,"x":162.0,"y":690.2188,"just":"left","blur":true},{"k":"text","name":"Price_A","str":"\u20ac168 / night","weight":400,"size":22,"color":"#8A8A8A","track":60.0,"x":162.0,"y":747.3125,"just":"left","blur":true},{"k":"text","name":"Option_A_1","str":"1N","weight":400,"size":25,"color":"#222222","track":50.0,"x":162.0,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_A_2","str":"2N","weight":400,"size":25,"color":"#222222","track":50.0,"x":225.5156,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_A_3","str":"3N","weight":400,"size":25,"color":"#222222","track":50.0,"x":294.1094,"y":808.2188,"just":"left","blur":true},{"k":"box","name":"Badge_BG_A","x":150.0,"y":886.0,"w":271.375,"h":46.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"text","name":"Badge_A","str":"Breakfast included","weight":400,"size":25,"color":"#222222","track":60.0,"x":162.0,"y":918.2188,"just":"left","blur":true},{"k":"box","name":"Image_BG_2","x":150.0,"y":952.0,"w":1000.0,"h":520.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_2","file":"room","x":150.0,"y":952.0,"w":1000.0,"h":520.0},{"k":"box","name":"Image_BG_3","x":1190.0,"y":160.0,"w":1000.0,"h":440.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_3","file":"pool","x":1190.0,"y":160.0,"w":1000.0,"h":440.0},{"k":"box","name":"Add_Button_3","x":2150.0,"y":512.0,"w":58.0,"h":58.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"icon","name":"Add_Icon_3","file":"plus_30","x":2164.0,"y":526.0,"w":30.0,"h":30.0,"blur":true},{"k":"text","name":"Stay_Name_3","str":"CASA ALFAMA \u00b7 SEA VIEW","weight":500,"size":25,"color":"#222222","track":100.0,"x":1202.0,"y":690.2188,"just":"left","blur":true},{"k":"box","name":"Price_Select_BG","x":1198.0,"y":724.0,"w":147.6406,"h":30.0,"r":0,"blur":true,"fill":"#1F6FE5","fop":13,"op":0},{"k":"text","name":"Price_B","str":"\u20ac149 / night","weight":400,"size":22,"color":"#8A8A8A","track":60.0,"x":1202.0,"y":747.3125,"just":"left","blur":true},{"k":"text","name":"Price_B_Selected","str":"\u20ac149 / night","weight":400,"size":22,"color":"#1F6FE5","track":60.0,"x":1202.0,"y":747.3125,"just":"left","blur":true,"op":0},{"k":"text","name":"Option_B_1","str":"1N","weight":400,"size":25,"color":"#222222","track":50.0,"x":1202.0,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_2","str":"2N","weight":400,"size":25,"color":"#222222","track":50.0,"x":1265.5156,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_3","str":"3N","weight":400,"size":25,"color":"#222222","track":50.0,"x":1334.1094,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_4","str":"4N","weight":400,"size":25,"color":"#222222","track":50.0,"x":1402.8906,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_5","str":"5N","weight":400,"size":25,"color":"#222222","track":50.0,"x":1472.3906,"y":808.2188,"just":"left","blur":true},{"k":"box","name":"Badge_BG_B","x":1190.0,"y":886.0,"w":254.4219,"h":46.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"text","name":"Badge_B","str":"3 nights for \u20ac390","weight":400,"size":25,"color":"#222222","track":60.0,"x":1202.0,"y":918.2188,"just":"left","blur":true},{"k":"box","name":"Image_BG_4","x":1190.0,"y":952.0,"w":1000.0,"h":520.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_4","file":"pool","x":1190.0,"y":952.0,"w":1000.0,"h":520.0}],"select":{"names":["Price_Select_BG","Price_B","Price_B_Selected"],"keys":[[[0,0],[0.7333,100]],[[0,100],[0.7333,0]],[[0,0],[0.7333,100]]]}},"checkout":{"ox":100,"oy":100,"w":1200,"h":1200,"items":[{"k":"box","name":"Promo_Field","x":100.0,"y":60.0,"w":900.0,"h":172.0,"r":22,"blur":true,"stroke":"#3A3A3A","sw":2},{"k":"text","name":"Promo_Placeholder","str":"Promo code or gift card","weight":400,"size":40,"color":"#6C6C6C","track":0,"x":134.0,"y":168.75,"just":"left","blur":true},{"k":"box","name":"Back_Button","x":100.0,"y":282.0,"w":820.0,"h":114.0,"r":22,"blur":true,"stroke":"#3D3D3D","sw":2},{"k":"icon","name":"Back_Icon","file":"card","x":132.0,"y":319.0,"w":40.0,"h":40.0,"blur":true},{"k":"text","name":"Back_Text","str":"Back to your stay","weight":650,"size":40,"color":"#FFFFFF","track":0,"x":188.0,"y":353.25,"just":"left","blur":true},{"k":"text","name":"Subtotal","str":"Subtotal","weight":400,"size":41,"color":"#FFFFFF","track":0,"x":100.0,"y":479.7188,"just":"left","blur":true},{"k":"text","name":"Fee","str":"Service fee","weight":400,"size":41,"color":"#FFFFFF","track":0,"x":100.0,"y":553.7188,"just":"left","blur":true},{"k":"icon","name":"Fee_Help_Icon","file":"help","x":335.9062,"y":524.0,"w":30.0,"h":30.0,"blur":true},{"k":"text","name":"Total","str":"Total","weight":700,"size":54,"color":"#FFFFFF","track":0,"x":100.0,"y":679.3125,"just":"left","blur":true},{"k":"box","name":"Tax_Highlight","x":94.0,"y":710.0,"w":486.0625,"h":58.0,"fill":"#F08A24","fop":28},{"k":"text","name":"Tax_Line","str":"Including \u20ac18.40 city tax","weight":400,"size":41,"color":"#6C6C6C","track":0,"x":100.0,"y":753.7188,"just":"left","blur":true},{"k":"text","name":"Tax_Line_Hot","str":"Including \u20ac18.40 city tax","weight":400,"size":41,"color":"#D9813A","track":0,"x":100.0,"y":753.7188,"just":"left","blur":true,"op":0},{"k":"text","name":"Help","str":"HELP","weight":700,"size":32,"color":"#FFFFFF","track":60.0,"x":620.0,"y":716.0,"just":"left","blur":true},{"k":"box","name":"Pay_Button","x":100.0,"y":935.0,"w":820.0,"h":140.0,"r":26,"blur":true,"stroke":"#3D3D3D","sw":2}],"hlName":"Tax_Highlight","hotName":"Tax_Line_Hot","hlKeys":[[0.0,[0.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[2.2,[0.0,100.0],[0.0,0.0],[0.0,0.0],0.1,100.0,false,false],[2.2333,[0.0,100.0],[187.5,0.0],[187.5,0.0],0.1,0.1,false,false],[2.5,[100.0,100.0],[187.5,0.0],[187.5,0.0],0.1,0.1,false,false],[4.3333,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]],"hotKeys":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[2.2,0.0,0.0,0.0,0.1,100.0,false,false],[2.2333,0.0,187.5,187.5,0.1,0.1,false,false],[2.5,100.0,187.5,187.5,0.1,0.1,false,false],[4.3333,100.0,0.0,0.0,100.0,33.33,false,false]]},"white":{"w":1000,"h":1080,"items":[{"k":"text","name":"Panel_Text_1_1","str":"ADD TO WISHLIST","weight":400,"size":25,"color":"#141414","track":20.0,"x":106.0,"y":320.2188,"just":"left","blur":true},{"k":"box","name":"Panel_Box_2","x":105.0,"y":360.0,"w":800.0,"h":78.0,"r":0,"blur":true,"fill":"#141414"},{"k":"text","name":"Panel_Text_3_1","str":"RESERVE NOW","weight":400,"size":24,"color":"#FFFFFF","track":20.0,"x":415.0,"y":407.25,"just":"center","blur":true},{"k":"box","name":"Panel_Box_4","x":105.0,"y":500.0,"w":800.0,"h":175.0,"r":0,"blur":true,"fill":"#9EAE9C"},{"k":"text","name":"Panel_Text_5_1","str":"STAY 3 NIGHTS","weight":400,"size":24,"color":"#FFFFFF","track":20.0,"x":415.0,"y":577.25,"just":"center","blur":true},{"k":"text","name":"Panel_Text_5_2","str":"AND SAVE 15%","weight":400,"size":24,"color":"#FFFFFF","track":20.0,"x":415.0,"y":611.25,"just":"center","blur":true}]},"dL":[[0.0,-960.0,0.0,0.0,33.33,5.0,false,false],[0.9333,-960.0,0.0,0.0,100.0,100.0,false,false],[0.9667,-960.0,9.5987,9.5987,0.1,19.0,false,false],[1.4667,-876.0,770.6794,770.6794,20.0,76.0,false,false],[1.6667,-50.88,433.1319,433.1319,46.0,19.0,false,false],[2.7667,93.2803,697.6849,697.6849,22.0,98.0,false,false],[2.8333,418.56,4709.0043,4709.0043,40.0,33.33,false,false],[2.9,618.24,293.0675,293.0675,33.33,4.0,false,false],[3.1,638.2711,20.8195,20.8195,63.0,10.0,false,false],[3.7667,639.9401,1.6819,1.6819,23.0,52.0,false,false],[3.8,640.0,8.4591,8.4591,0.1,99.0,false,false],[4.3333,700.0,675.3709,675.3709,2.1,33.33,false,false]],"dR":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[0.9333,0.0,0.0,0.0,0.1,100.0,false,false],[0.9667,0.0,9.5987,9.5987,0.1,19.0,false,false],[1.4667,84.0,770.6794,770.6794,20.0,26.0,false,false],[1.5333,219.9286,2713.2762,2713.2762,11.0,65.0,false,false],[1.6667,909.12,433.1319,433.1319,62.0,15.0,false,false],[2.6333,975.04,133.2267,133.2267,22.0,7.0,false,false],[2.8,1025.28,842.5945,842.5945,16.0,11.0,false,false],[2.9,1269.12,146.5338,146.5338,68.0,4.0,false,false],[3.1,1279.1356,10.4097,10.4097,63.0,10.0,false,false],[3.7667,1279.97,0.841,0.841,23.0,46.0,false,false],[3.8,1280.0,7.9791,7.9791,0.1,99.0,false,false],[4.3333,1340.0,675.3709,675.3709,2.1,33.33,false,false]],"wR":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[2.2667,0.0,0.0,0.0,0.1,100.0,false,false],[2.3,0.0,19.1981,19.1981,0.1,76.0,false,false],[2.8,130.56,1685.1889,1685.1889,6.0,28.0,false,false],[2.8667,555.1463,3244.3042,3244.3042,91.0,33.33,false,false],[2.9,618.24,293.0675,293.0675,33.33,20.0,false,false],[3.3333,639.3562,2.1002,2.1002,17.0,33.33,false,false],[3.7667,639.9401,1.6819,1.6819,33.33,52.0,false,false],[3.8,640.0,8.4591,8.4591,0.1,99.0,false,false],[4.3333,700.0,675.3709,675.3709,2.1,33.33,false,false]],"gx":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[0.9333,0.0,0.0,0.0,0.1,100.0,false,false],[0.9667,0.0,5.6192,5.6192,0.1,19.0,false,false],[1.4667,49.175,451.1686,451.1686,20.0,11.0,false,false],[1.5667,195.014,2478.3758,2478.3758,33.33,33.33,false,false],[1.6333,510.296,1067.2899,1067.2899,33.33,7.0,false,false],[2.7667,579.9273,134.0863,134.0863,30.0,59.0,false,false],[2.9,680.818,56.3239,56.3239,67.0,4.0,false,false],[3.1,684.6677,4.0012,4.0012,63.0,10.0,false,false],[3.7667,684.9885,0.3232,0.3232,23.0,24.0,false,false],[3.8,685.0,7.6837,7.6837,0.1,99.0,false,false],[4.3333,745.0,675.3709,675.3709,2.1,33.33,false,false]],"gy":[[0.0,-140.0,1470.551,1470.551,33.33,33.33,false,false],[0.0333,-81.8125,1745.6247,1745.6247,33.33,32.33,false,false],[0.1333,-28.0,249.7146,249.7146,60.0,33.33,false,false],[0.1667,-18.2,80.3946,80.3946,33.33,0.1,false,false],[0.5667,0.0,15.4008,15.4008,53.0,0.1,false,false],[0.7333,0.0,-0.0145,-0.0145,0.1,33.33,false,false],[0.7667,-0.8571,-48.2143,-48.2143,33.33,41.0,false,false],[0.9667,-22.8421,-51.5789,-51.5789,73.0,10.0,false,false],[1.4,-27.0,-3.7497,-3.7497,41.0,0.1,false,false],[4.3333,-27.0,0.0,0.0,98.0,33.33,false,false]],"cx":[[0.0,-576.0,0.0,0.0,33.33,0.1,false,false],[0.9333,-576.0,0.0,0.0,90.0,100.0,false,false],[0.9667,-576.0,9.5987,9.5987,0.1,19.0,false,false],[1.4667,-492.0,770.6794,770.6794,20.0,26.0,false,false],[1.5333,-356.0714,2713.2762,2713.2762,11.0,65.0,false,false],[1.6667,333.12,433.1319,433.1319,62.0,15.0,false,false],[2.6333,408.393,216.0771,216.0771,21.0,7.0,false,false],[2.8,489.876,1366.5829,1366.5829,16.0,11.0,false,false],[2.9,885.354,237.6595,237.6595,68.0,4.0,false,false],[3.1,901.598,16.8833,16.8833,63.0,10.0,false,false],[3.7667,902.9514,1.3639,1.3639,23.0,51.0,false,false],[3.8,903.0,8.2776,8.2776,0.1,99.0,false,false],[4.3333,963.0,675.3709,675.3709,2.1,33.33,false,false]],"wx":[[0.0,-640.0,0.0,0.0,33.33,0.1,false,false],[2.2667,-640.0,0.0,0.0,90.0,100.0,false,false],[2.3,-640.0,19.1981,19.1981,0.1,76.0,false,false],[2.8,-509.44,1685.1889,1685.1889,6.0,28.0,false,false],[2.8667,-84.8537,3244.3042,3244.3042,91.0,33.33,false,false],[2.9,-21.76,293.0675,293.0675,33.33,20.0,false,false],[3.3333,-0.6438,2.1002,2.1002,17.0,33.33,false,false],[3.7667,-0.0599,1.6819,1.6819,33.33,52.0,false,false],[3.8,0.0,8.4591,8.4591,0.1,99.0,false,false],[4.3333,60.0,675.3709,675.3709,2.1,33.33,false,false]],"notes":[{"name":"Blue","side":"left","str":"Night picker is unclear","size":25,"weight":500,"h":50,"r":25,"col":"#1F6FE5","border":0,"tx":22.0,"base":35.2188,"inAt":0.0,"textOp":[[0.0,100]],"kx":[[0.0,1249.0,-1719.0649,-1719.0649,33.33,7.0,false,false],[1.0,1045.3396,9.674,9.674,99.0,2.1,false,false],[1.5,1142.176,1235.2995,1235.2995,15.0,74.0,false,false],[1.6,1423.4177,6208.4125,6208.4125,24.0,33.33,false,false],[1.6333,1569.296,1067.2899,1067.2899,33.33,7.0,false,false],[2.7667,1638.9273,134.0863,134.0863,30.0,59.0,false,false],[2.9,1739.818,56.3239,56.3239,67.0,4.0,false,false],[3.1,1743.6677,4.0012,4.0012,63.0,10.0,false,false],[3.7667,1743.9885,0.3232,0.3232,23.0,24.0,false,false],[3.8,1744.0,7.6837,7.6837,0.1,99.0,false,false],[4.3333,1804.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[0.0,536.0,1063.404,1063.404,33.33,33.33,false,false],[0.0667,606.865,204.8471,204.8471,33.33,33.33,false,false],[0.1333,614.07,139.6918,139.6918,33.33,48.0,false,false],[0.2333,620.595,28.7059,28.7059,100.0,14.0,false,false],[0.4667,628.64,15.1016,15.1016,100.0,55.0,false,false],[0.5667,631.0,-2.2982,-2.2982,5.0,70.0,false,false],[1.0333,595.2918,29.876,29.876,40.0,33.33,false,false],[1.2667,604.7544,-4.7368,-4.7368,39.0,87.0,false,false],[1.4,604.0,-3.7497,-3.7497,4.0,0.1,false,false],[4.3333,604.0,0.0,0.0,98.0,33.33,false,false]],"kw":[[0.0,[102.96,50.0],[1404.3778,0.0],[1404.3778,0.0],33.33,58.0,false,false],[0.1333,[224.64,50.0],[446.0229,0.0],[446.0229,0.0],85.0,33.33,false,false],[0.1667,[240.24,50.0],[280.958,0.0],[280.958,0.0],33.33,19.0,false,false],[0.6333,[289.3429,50.0],[44.5714,0.0],[44.5714,0.0],30.0,33.33,false,false],[0.6667,[290.16,50.0],[0.0004,0.0],[0.0004,0.0],33.33,33.33,false,false],[0.7,[289.3488,50.0],[-44.928,0.0],[-44.928,0.0],33.33,33.33,false,false],[0.8,[283.1712,50.0],[-44.928,0.0],[-44.928,0.0],33.33,33.33,false,false],[0.8333,[282.36,50.0],[-0.0116,0.0],[-0.0116,0.0],33.33,30.33,false,false],[0.8667,[282.5154,50.0],[9.0968,0.0],[9.0968,0.0],36.33,100.0,false,false],[1.2333,[312.0,50.0],[30.4076,0.0],[30.4076,0.0],43.0,0.1,false,false],[4.3333,[312.0,50.0],[0.0,0.0],[0.0,0.0],93.0,33.33,false,false]]},{"name":"Orange","side":"right","str":"Surprise city tax","size":25,"weight":500,"h":54,"r":27,"col":"#F08A24","border":2,"tx":24.0,"base":37.2188,"inAt":1.6333,"textOp":[[1.6333,100]],"kx":[[1.6333,385.68,4484.23,4484.23,33.33,33.33,false,false],[1.6667,511.92,1554.3152,1554.3152,33.33,15.0,false,false],[2.7667,771.6445,565.7789,565.7789,23.0,98.0,false,false],[2.8333,1035.426,3818.7081,3818.7081,40.0,33.33,false,false],[2.9,1197.354,237.6595,237.6595,33.33,24.0,false,false],[3.2,1214.1785,2.8718,2.8718,10.0,33.33,false,false],[3.7667,1214.9514,1.3639,1.3639,33.33,51.0,false,false],[3.8,1215.0,8.2776,8.2776,0.1,99.0,false,false],[4.3333,1275.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[1.6333,823.0,-1260.7296,-1260.7296,33.33,33.33,false,false],[1.6667,781.0,-530.2894,-530.2894,33.33,26.0,false,false],[1.8,747.82,-238.8465,-238.8465,22.0,33.33,false,false],[1.8333,737.845,-141.3628,-141.3628,33.33,14.0,false,false],[2.1667,718.0,-22.0504,-22.0504,19.0,0.1,false,false],[2.2,718.0,0.0,0.0,100.0,100.0,false,false],[2.2333,718.0,2.6992,2.6992,0.1,0.1,false,false],[2.4667,719.98,8.5901,8.5901,0.1,36.33,false,false],[2.5667,720.52,-0.0037,-0.0037,100.0,33.33,false,false],[2.6,720.3284,-9.7984,-9.7984,33.33,100.0,false,false],[2.8333,718.0,-13.5086,-13.5086,65.0,0.1,false,false],[4.3333,718.0,0.0,0.0,100.0,33.33,false,false]],"kw":[[1.6333,[162.91,52.0],[789.1011,0.0],[789.1011,0.0],33.33,30.33,false,false],[1.7333,[204.974,52.0],[178.5368,0.0],[178.5368,0.0],85.0,33.33,false,false],[1.8,[214.534,52.0],[186.0126,0.0],[186.0126,0.0],33.33,33.33,false,false],[1.8333,[222.66,52.0],[142.0152,0.0],[142.0152,0.0],33.33,37.0,false,false],[1.9667,[232.22,52.0],[74.6169,0.0],[74.6169,0.0],21.0,17.0,false,false],[2.1333,[241.2222,52.0],[30.2771,0.0],[30.2771,0.0],100.0,33.33,false,false],[2.2,[241.78,52.0],[0.0,0.0],[0.0,0.0],57.0,100.0,false,false],[2.2333,[241.78,52.0],[-5.5058,0.0],[-5.5058,0.0],0.1,51.0,false,false],[2.4667,[213.7945,52.0],[-42.9163,0.0],[-42.9163,0.0],92.0,36.0,false,false],[2.5667,[212.3266,52.0],[0.0181,0.0],[0.0181,0.0],100.0,33.33,false,false],[2.6,[213.3458,52.0],[55.597,0.0],[55.597,0.0],33.33,51.0,false,false],[2.7333,[228.8147,52.0],[78.2196,0.0],[78.2196,0.0],58.0,33.33,false,false],[2.8,[232.8354,52.0],[78.9734,0.0],[78.9734,0.0],33.33,36.33,false,false],[2.8333,[237.0,52.0],[62.7602,0.0],[62.7602,0.0],7.0,0.1,false,false],[4.3333,[237.0,52.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"name":"Pink","side":"left","str":"Should go to checkout","size":22,"weight":500,"h":44,"r":25,"col":"#D4148C","border":0,"tx":22.0,"base":32.3125,"inAt":2.8333,"textOp":[[2.8333,100]],"kx":[[2.8333,83.56,4852.6133,4852.6133,33.33,33.33,false,false],[2.9,293.32,441.8276,441.8276,33.33,15.0,false,false],[3.9667,348.3298,33.3333,33.3333,57.0,98.0,false,false],[4.3333,405.0,675.3709,675.3709,3.1,33.33,false,false]],"ky":[[2.8333,907.0,-699.3056,-699.3056,33.33,79.0,false,false],[3.1333,764.18,-221.9717,-221.9717,54.0,0.1,false,false],[3.9,722.0,-7.4003,-7.4003,89.0,0.1,false,false],[4.3333,722.0,0.0,0.0,80.0,33.33,false,false]],"kw":[[2.8333,[73.92,44.0],[1029.0745,0.0],[1029.0745,0.0],33.33,33.33,false,false],[2.9,[142.52,44.0],[879.9552,0.0],[879.9552,0.0],33.33,2.1,false,false],[3.0,[220.08,44.0],[390.9528,0.0],[390.9528,0.0],4.0,15.0,false,false],[3.6333,[280.0,44.0],[13.6473,0.0],[13.6473,0.0],35.33,0.1,false,false],[4.3333,[280.0,44.0],[0.0,0.0],[0.0,0.0],97.0,33.33,false,false]]}],"cursors":[{"name":"Blue","col":"#1F6FE5","pts":[[2.1212,2.1212],[63.6364,27.5758],[35.0,35.0],[27.5758,63.6364]],"inAt":0,"kx":[[0.0,1185.0,-1719.0649,-1719.0649,33.33,7.0,false,false],[1.0,981.3396,9.674,9.674,99.0,2.1,false,false],[1.5,1078.176,1235.2995,1235.2995,15.0,74.0,false,false],[1.6,1359.4177,6208.4125,6208.4125,24.0,33.33,false,false],[1.6333,1505.296,1067.2899,1067.2899,33.33,7.0,false,false],[2.7667,1574.9273,134.0863,134.0863,30.0,59.0,false,false],[2.9,1675.818,56.3239,56.3239,67.0,4.0,false,false],[3.1,1679.6677,4.0012,4.0012,63.0,10.0,false,false],[3.7667,1679.9885,0.3232,0.3232,23.0,24.0,false,false],[3.8,1680.0,7.6837,7.6837,0.1,99.0,false,false],[4.3333,1740.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[0.0,480.0,1063.404,1063.404,33.33,33.33,false,false],[0.0667,550.865,204.8471,204.8471,33.33,33.33,false,false],[0.1333,558.07,139.6918,139.6918,33.33,48.0,false,false],[0.2333,564.595,28.7059,28.7059,100.0,14.0,false,false],[0.4667,572.64,15.1016,15.1016,100.0,55.0,false,false],[0.5667,575.0,-2.2982,-2.2982,5.0,70.0,false,false],[1.0333,539.2918,29.876,29.876,40.0,33.33,false,false],[1.2667,548.7544,-4.7368,-4.7368,39.0,87.0,false,false],[1.4,548.0,-3.7497,-3.7497,4.0,0.1,false,false],[4.3333,548.0,0.0,0.0,98.0,33.33,false,false]]},{"name":"Orange","col":"#F08A24","pts":[[2.1212,2.1212],[63.6364,27.5758],[35.0,35.0],[27.5758,63.6364]],"inAt":1.6333,"kx":[[1.6333,373.68,4484.23,4484.23,33.33,33.33,false,false],[1.6667,499.92,1554.3152,1554.3152,33.33,15.0,false,false],[2.7667,759.6445,565.7789,565.7789,23.0,98.0,false,false],[2.8333,1023.426,3818.7081,3818.7081,40.0,33.33,false,false],[2.9,1185.354,237.6595,237.6595,33.33,24.0,false,false],[3.2,1202.1785,2.8718,2.8718,10.0,33.33,false,false],[3.7667,1202.9514,1.3639,1.3639,33.33,51.0,false,false],[3.8,1203.0,8.2776,8.2776,0.1,99.0,false,false],[4.3333,1263.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[1.6333,753.0,-1260.7296,-1260.7296,33.33,33.33,false,false],[1.6667,711.0,-530.2894,-530.2894,33.33,26.0,false,false],[1.8,677.82,-238.8465,-238.8465,22.0,33.33,false,false],[1.8333,667.845,-141.3628,-141.3628,33.33,14.0,false,false],[2.1667,648.0,-22.0504,-22.0504,19.0,0.1,false,false],[4.3333,648.0,0.0,0.0,100.0,33.33,false,false]],"ks":[[1.6333,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[2.2,[100.0,100.0],[0.0,0.0],[0.0,0.0],50.0,100.0,false,false],[2.2333,[100.0,100.0],[-14.9956,-14.9956],[-14.9956,-14.9956],0.1,61.0,false,false],[2.4,[91.0,91.0],[-39.9972,-39.9972],[-39.9972,-39.9972],55.0,33.33,false,false],[2.4667,[89.0,89.0],[-47.723,-47.723],[-47.723,-47.723],33.33,33.33,false,false],[2.5,[86.0,86.0],[-0.1111,-0.1111],[-0.1111,-0.1111],33.33,0.1,false,false],[2.5667,[86.0,86.0],[0.0207,0.0207],[0.0207,0.0207],0.1,33.33,false,false],[2.6,[87.0645,87.0645],[54.4355,54.4355],[54.4355,54.4355],33.33,41.0,false,false],[2.6667,[91.0,91.0],[41.555,41.555],[41.555,41.555],10.0,33.33,false,false],[2.8,[95.0,95.0],[54.084,54.084],[54.084,54.084],20.0,36.33,false,false],[2.8333,[100.0,100.0],[75.048,75.048],[75.048,75.048],11.0,0.1,false,false],[4.3333,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"name":"Pink","col":"#D4148C","pts":[[2.1212,2.1212],[63.6364,27.5758],[35.0,35.0],[27.5758,63.6364]],"inAt":2.8333,"kx":[[2.8333,38.56,4852.6133,4852.6133,33.33,33.33,false,false],[2.9,248.32,441.8276,441.8276,33.33,15.0,false,false],[3.9667,303.3298,33.3333,33.3333,57.0,98.0,false,false],[4.3333,360.0,675.3709,675.3709,3.1,33.33,false,false]],"ky":[[2.8333,847.0,-699.3056,-699.3056,33.33,79.0,false,false],[3.1333,704.18,-221.9717,-221.9717,54.0,0.1,false,false],[3.9,662.0,-7.4003,-7.4003,89.0,0.1,false,false],[4.3333,662.0,0.0,0.0,80.0,33.33,false,false]]}],"markers":[[0.9667,"dark panel creeps in"],[1.5667,"whip"],[2.3,"white panel creeps in"],[2.8333,"whip"],[3.8,"ease off right"]]}},{"tag":"B","name":"Alps","collage":{"at":269,"dur":0.5667,"tiles":[{"file":"peaks","x":489,"y":495,"w":261,"h":252,"inAt":0.0,"kx":[[0.0,777.6,0.0,0.0,33.33,100.0,false,false],[0.0333,777.6,0.0,0.0,0.1,33.33,false,true],[0.0667,674.74,0.0,0.0,33.33,0.1,true,false],[0.1,674.74,0.0,0.0,20.0,33.33,false,true],[0.1333,634.715,0.0,0.0,33.33,33.33,true,true],[0.1667,619.5,0.0,0.0,33.33,0.1,true,false],[0.5333,619.5,0.0,0.0,0.1,33.33,false,false]],"ky":[[0.0,844.8,0.0,0.0,33.33,0.1,false,false],[0.0333,844.8,0.0,0.0,50.0,33.33,false,true],[0.0667,752.52,0.0,0.0,33.33,0.1,true,false],[0.1,752.52,0.0,0.0,20.0,33.33,false,true],[0.1333,666.57,0.0,0.0,33.33,33.33,true,true],[0.1667,621.0,0.0,0.0,33.33,0.1,true,false],[0.5333,621.0,0.0,0.0,0.1,33.33,false,false]],"ks":[[0.0,[18.3744,18.3744],[94.0539,94.0539],[94.0539,94.0539],33.33,33.33,false,false],[0.0333,[21.5064,21.5064],[0.1878,0.1878],[0.1878,0.1878],33.33,33.33,false,true],[0.0667,[24.012,24.012],[0.0,0.0],[0.0,0.0],33.33,15.0,true,false],[0.1,[24.012,24.012],[0.0,0.0],[0.0,0.0],25.0,33.33,false,true],[0.1333,[25.317,25.317],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[26.1,26.1],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[26.1,26.1],[0.0,0.0],[0.0,0.0],90.0,33.33,false,false]]},{"file":"cabin","x":594,"y":219,"w":180,"h":176,"inAt":0.0,"kx":[[0.0,939.2,0.0,0.0,33.33,0.1,false,false],[0.0333,939.2,0.0,0.0,30.0,33.33,false,true],[0.0667,811.08,0.0,0.0,33.33,90.0,true,false],[0.1,811.08,0.0,0.0,100.0,33.33,false,true],[0.1333,735.78,0.0,0.0,33.33,33.33,true,true],[0.1667,684.0,0.0,0.0,33.33,0.1,true,false],[0.5333,684.0,0.0,0.0,50.0,33.33,false,false]],"ky":[[0.0,483.6,0.0,0.0,33.33,0.1,false,false],[0.0333,483.6,0.0,0.0,0.1,33.33,false,true],[0.0667,386.64,0.0,0.0,33.33,0.1,true,false],[0.1,386.64,0.0,0.0,20.0,33.33,false,true],[0.1333,323.49,0.0,0.0,33.33,33.33,true,true],[0.1667,307.0,0.0,0.0,33.33,0.1,true,false],[0.5333,307.0,0.0,0.0,0.1,33.33,false,false]],"ks":[[0.0,[12.672,12.672],[64.8647,64.8647],[64.8647,64.8647],33.33,33.33,false,false],[0.0333,[14.832,14.832],[0.1295,0.1295],[0.1295,0.1295],33.33,33.33,false,true],[0.0667,[16.56,16.56],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.1,[16.56,16.56],[0.0,0.0],[0.0,0.0],5.0,33.33,false,true],[0.1333,[17.46,17.46],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[18.0,18.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[18.0,18.0],[0.0,0.0],[0.0,0.0],15.0,33.33,false,false]]},{"file":"lake","x":726,"y":783,"w":156,"h":192,"inAt":0.0667,"kx":[[0.0667,858.48,0.0,0.0,33.33,0.1,false,false],[0.1,858.48,0.0,0.0,80.0,33.33,false,true],[0.1333,820.68,0.0,0.0,33.33,33.33,true,true],[0.1667,804.0,0.0,0.0,33.33,0.1,true,false],[0.5333,804.0,0.0,0.0,10.0,33.33,false,false]],"ky":[[0.0667,898.88,0.0,0.0,33.33,0.1,false,false],[0.1,898.88,0.0,0.0,90.0,33.33,false,true],[0.1333,871.33,0.0,0.0,33.33,33.33,true,true],[0.1667,879.0,0.0,0.0,33.33,5.0,true,false],[0.5333,879.0,0.0,0.0,80.0,33.33,false,false]],"ks":[[0.0667,[15.5443,15.5443],[79.5674,79.5674],[79.5674,79.5674],33.33,33.33,false,false],[0.1,[18.1939,18.1939],[0.1589,0.1589],[0.1589,0.1589],33.33,33.33,false,true],[0.1333,[18.624,18.624],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[19.2,19.2],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[19.2,19.2],[0.0,0.0],[0.0,0.0],10.0,33.33,false,false]]},{"file":"forest","x":960,"y":714,"w":324,"h":363,"inAt":0.0667,"kx":[[0.0667,1228.04,0.0,0.0,33.33,0.1,false,false],[0.1,1228.04,0.0,0.0,5.0,33.33,false,true],[0.1333,1167.64,0.0,0.0,33.33,33.33,true,true],[0.1667,1122.0,0.0,0.0,33.33,0.1,true,false],[0.5333,1122.0,0.0,0.0,15.0,33.33,false,false]],"ky":[[0.0667,1019.06,0.0,0.0,33.33,0.1,false,false],[0.1,1019.06,0.0,0.0,0.1,33.33,false,true],[0.1333,939.835,0.0,0.0,33.33,33.33,true,true],[0.1667,895.5,0.0,0.0,33.33,15.0,true,false],[0.5333,895.5,0.0,0.0,100.0,33.33,false,false]],"ks":[[0.0667,[29.3885,29.3885],[150.4321,150.4321],[150.4321,150.4321],33.33,33.33,false,false],[0.1,[34.3979,34.3979],[0.3004,0.3004],[0.3004,0.3004],33.33,33.33,false,true],[0.1333,[35.211,35.211],[0.0,0.0],[0.0,0.0],33.33,33.33,true,true],[0.1667,[36.3,36.3],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.5333,[36.3,36.3],[0.0,0.0],[0.0,0.0],0.1,33.33,false,false]]},{"file":"balloon","x":860,"y":60,"w":200,"h":185,"inAt":0.1333,"kx":[[0.1333,975.5,0.0,0.0,33.33,33.33,false,true],[0.1667,960.0,0.0,0.0,33.33,0.1,true,false],[0.5333,960.0,0.0,0.0,60.0,33.33,false,false]],"ky":[[0.1333,226.125,0.0,0.0,33.33,33.33,false,true],[0.1667,152.5,0.0,0.0,33.33,0.1,true,false],[0.5333,152.5,0.0,0.0,33.33,33.33,false,false]],"ks":[[0.1333,[17.072,17.072],[0.0,0.0],[0.0,0.0],33.33,33.33,false,true],[0.1667,[20.6,20.6],[-0.036,-0.036],[-0.036,-0.036],33.33,35.33,true,false],[0.2,[20.0,20.0],[-9.009,-9.009],[-9.009,-9.009],14.0,0.1,false,false],[0.5333,[20.0,20.0],[0.0,0.0],[0.0,0.0],80.0,33.33,false,false]]},{"file":"dunes","x":1140,"y":177,"w":234,"h":224,"inAt":0.1333,"kx":[[0.1333,1295.09,0.0,0.0,33.33,33.33,false,true],[0.1667,1257.0,0.0,0.0,33.33,0.1,true,false],[0.5333,1257.0,0.0,0.0,80.0,33.33,false,false]],"ky":[[0.1333,316.53,0.0,0.0,33.33,33.33,false,true],[0.1667,289.0,0.0,0.0,33.33,0.1,true,false],[0.5333,289.0,0.0,0.0,0.1,33.33,false,false]],"ks":[[0.1333,[19.9742,19.9742],[0.0,0.0],[0.0,0.0],33.33,33.33,false,true],[0.1667,[24.102,24.102],[-0.0421,-0.0421],[-0.0421,-0.0421],33.33,35.33,true,false],[0.2,[23.4,23.4],[-10.5405,-10.5405],[-10.5405,-10.5405],14.0,0.1,false,false],[0.5333,[23.4,23.4],[0.0,0.0],[0.0,0.0],80.0,33.33,false,false]]},{"file":"city","x":1203,"y":519,"w":261,"h":222,"inAt":0.1667,"kx":[[0.1667,1333.5,0.0,0.0,33.33,33.33,false,false]],"ky":[[0.1667,630.0,0.0,0.0,33.33,33.33,false,false]],"ks":[[0.1667,[22.968,22.968],[117.5673,117.5673],[117.5673,117.5673],33.33,33.33,false,false],[0.2,[26.883,26.883],[0.0939,0.0939],[0.0939,0.0939],33.33,35.33,false,false],[0.2333,[26.1,26.1],[-11.7567,-11.7567],[-11.7567,-11.7567],14.0,0.1,false,false],[0.5333,[26.1,26.1],[0.0,0.0],[0.0,0.0],95.0,33.33,false,false]]}],"cam":[[0.0,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.1333,[100.0,100.0],[0.0,0.0],[0.0,0.0],15.0,100.0,false,false],[0.1667,[100.0,100.0],[3.0,3.0],[3.0,3.0],0.1,0.1,false,false],[0.5333,[102.2,102.2],[6.0,6.0],[6.0,6.0],99.0,33.33,false,false]],"markers":[[0,"pairs pop on (0, 2, 4)"],[0.16666666666666666,"jump to places, slow push-in"]]},"phone":{"at":286,"dur":1.5333,"tiles":[{"file":"cabin","x":590,"y":383,"w":150,"h":200,"mask":[[0.0,750.0,1000.0,"hold","hold"],[0.2333,697.75,1000.0,"hold","linear"],[0.2667,678.75,1000.0,"linear","linear"],[0.3,670.3213,1000.0,"linear","linear"],[0.3333,664.5,1000.0,"linear","linear"],[0.3667,659.5125,1000.0,"linear","linear"],[0.4,655.0,1000.0,"linear","hold"],[0.4333,560.0,1000.0,"hold","hold"]],"kx":[[0.0,665.0,0.0,0.0,33.33,0.1,false,false],[0.2,665.0,0.0,0.0,5.0,33.33,false,true],[0.2333,698.275,363.1543,363.1543,33.33,24.0,true,false],[0.4,725.5,90.7409,90.7409,91.0,33.33,false,true],[0.4333,779.91,60.0445,60.0445,33.33,20.0,true,false],[0.6667,786.0,3.4794,3.4794,81.0,0.1,false,false],[1.5,786.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,483.0,0.0,0.0,33.33,40.0,false,false],[0.2,483.0,0.0,0.0,100.0,33.33,false,true],[0.2333,470.35,-138.0587,-138.0587,33.33,24.0,true,false],[0.4,460.0,-34.4966,-34.4966,91.0,33.33,false,true],[0.4333,433.395,35.5436,35.5436,33.33,20.0,true,false],[0.6667,437.0,2.0596,2.0596,81.0,0.1,false,false],[1.2,437.0,0.0,0.0,80.0,100.0,false,false],[1.2333,437.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,397.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[20.0,20.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[20.0,20.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[20.0,20.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.4,[20.0,20.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.4333,[20.7,20.7],[-6.9017,-6.9017],[-6.9017,-6.9017],33.33,20.0,true,false],[0.6667,[20.0,20.0],[-0.3999,-0.3999],[-0.3999,-0.3999],81.0,0.1,false,false],[1.5,[20.0,20.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"forest","x":816,"y":297,"w":288,"h":224,"mask":[[0.0,1000.0,777.7778,"hold","hold"],[0.2333,1000.0,815.5259,"hold","linear"],[0.2667,1000.0,833.3333,"linear","linear"],[0.3,1000.0,842.1701,"linear","linear"],[0.3333,1000.0,848.659,"linear","linear"],[0.3667,1000.0,854.4911,"linear","linear"],[0.4,1000.0,860.0,"linear","hold"],[0.4333,933.3333,1000.0,"hold","hold"]],"kx":[[0.0,960.0,0.0,0.0,33.33,0.1,false,false],[0.2,960.0,0.0,0.0,30.0,33.33,false,true],[0.2333,912.15,-522.2219,-522.2219,33.33,24.0,true,false],[0.4,873.0,-130.487,-130.487,91.0,33.33,false,true],[0.4333,779.91,60.0445,60.0445,33.33,20.0,true,false],[0.6667,786.0,3.4794,3.4794,81.0,0.1,false,false],[1.5,786.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,409.0,0.0,0.0,33.33,0.1,false,false],[0.2,409.0,0.0,0.0,100.0,33.33,false,true],[0.2333,464.0,600.2551,600.2551,33.33,24.0,true,false],[0.4,509.0,149.985,149.985,91.0,33.33,false,true],[0.4333,611.415,-23.8108,-23.8108,33.33,20.0,true,false],[0.6667,609.0,-1.3797,-1.3797,81.0,0.1,false,false],[1.2,609.0,0.0,0.0,80.0,100.0,false,false],[1.2333,609.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,569.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[28.8,28.8],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[28.8,28.8],[0.0,0.0],[0.0,0.0],100.0,33.33,false,true],[0.2333,[23.96,23.96],[-52.8224,-52.8224],[-52.8224,-52.8224],33.33,24.0,true,false],[0.4,[20.0,20.0],[-13.1987,-13.1987],[-13.1987,-13.1987],91.0,33.33,false,true],[0.4333,[12.42,12.42],[-4.141,-4.141],[-4.141,-4.141],33.33,20.0,true,false],[0.6667,[12.0,12.0],[-0.24,-0.24],[-0.24,-0.24],81.0,0.1,false,false],[1.5,[12.0,12.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"lake","x":1152,"y":315,"w":150,"h":236,"mask":[[0.0,635.5932,1000.0,"hold","hold"],[0.2333,677.8903,1000.0,"hold","linear"],[0.2667,695.7055,1000.0,"linear","linear"],[0.3,704.0994,1000.0,"linear","linear"],[0.3333,710.0862,1000.0,"linear","linear"],[0.3667,715.3441,1000.0,"linear","linear"],[0.4,720.2073,1000.0,"linear","hold"],[0.4333,853.3333,1000.0,"hold","hold"]],"kx":[[0.0,1227.0,0.0,0.0,33.33,0.1,false,false],[0.2,1227.0,0.0,0.0,5.0,33.33,false,true],[0.2333,1107.925,-1299.5522,-1299.5522,33.33,24.0,true,false],[0.4,1010.5,-324.7175,-324.7175,91.0,33.33,false,true],[0.4333,788.19,57.2838,57.2838,33.33,20.0,true,false],[0.6667,794.0,3.3194,3.3194,81.0,0.1,false,false],[1.5,794.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,433.0,0.0,0.0,33.33,0.1,false,false],[0.2,433.0,0.0,0.0,0.1,33.33,false,true],[0.2333,521.825,969.4119,969.4119,33.33,24.0,true,false],[0.4,594.5,242.2258,242.2258,91.0,33.33,false,true],[0.4333,763.56,-74.538,-74.538,33.33,20.0,true,false],[0.6667,756.0,-4.3192,-4.3192,81.0,0.1,false,false],[1.2,756.0,0.0,0.0,80.0,100.0,false,false],[1.2333,756.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,716.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[23.6,23.6],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[23.6,23.6],[0.0,0.0],[0.0,0.0],100.0,33.33,false,true],[0.2333,[21.235,21.235],[-25.811,-25.811],[-25.811,-25.811],33.33,24.0,true,false],[0.4,[19.3,19.3],[-6.4494,-6.4494],[-6.4494,-6.4494],91.0,33.33,false,true],[0.4333,[15.525,15.525],[-5.1763,-5.1763],[-5.1763,-5.1763],33.33,20.0,true,false],[0.6667,[15.0,15.0],[-0.2999,-0.2999],[-0.2999,-0.2999],81.0,0.1,false,false],[1.5,[15.0,15.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"peaks","x":610,"y":617,"w":160,"h":180,"mask":[[0.0,888.8889,1000.0,"hold","hold"],[0.2333,930.3905,1000.0,"hold","linear"],[0.2667,945.8689,1000.0,"linear","linear"],[0.3,952.8034,1000.0,"linear","linear"],[0.3333,957.6174,1000.0,"linear","linear"],[0.3667,961.758,1000.0,"linear","linear"],[0.4,965.5172,1000.0,"linear","hold"],[0.4333,1000.0,954.5455,"hold","hold"]],"kx":[[0.0,690.0,0.0,0.0,33.33,0.1,false,false],[0.2,690.0,0.0,0.0,10.0,33.33,false,true],[0.2333,759.85,762.3239,762.3239,33.33,24.0,true,false],[0.4,817.0,190.481,190.481,91.0,33.33,false,true],[0.4333,943.44,5.5213,5.5213,33.33,28.33,true,false],[0.5667,943.936,0.9932,0.9932,63.0,10.0,false,false],[1.5,944.0,0.0,0.0,91.0,33.33,false,false]],"ky":[[0.0,707.0,0.0,0.0,33.33,0.1,false,false],[0.2,707.0,0.0,0.0,40.0,33.33,false,true],[0.2333,625.05,-894.38,-894.38,33.33,24.0,true,false],[0.4,558.0,-223.4777,-223.4777,91.0,33.33,false,true],[0.4333,404.415,45.2059,45.2059,33.33,20.0,true,false],[0.6667,409.0,2.6195,2.6195,81.0,0.1,false,false],[1.2,409.0,0.0,0.0,80.0,100.0,false,false],[1.2333,409.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,369.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[18.0,18.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[18.0,18.0],[0.0,0.0],[0.0,0.0],5.0,33.33,false,true],[0.2333,[17.67,17.67],[-3.6015,-3.6015],[-3.6015,-3.6015],33.33,24.0,true,false],[0.4,[17.4,17.4],[-0.8999,-0.8999],[-0.8999,-0.8999],91.0,33.33,false,true],[0.4333,[18.216,18.216],[-6.0735,-6.0735],[-6.0735,-6.0735],33.33,20.0,true,false],[0.6667,[17.6,17.6],[-0.3519,-0.3519],[-0.3519,-0.3519],81.0,0.1,false,false],[1.5,[17.6,17.6],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"balloon","x":800,"y":539,"w":320,"h":262,"mask":[[0.0,1000.0,818.75,"hold","hold"],[0.2333,1000.0,826.1569,"hold","linear"],[0.2667,1000.0,829.4062,"linear","linear"],[0.3,1000.0,830.9651,"linear","linear"],[0.3333,1000.0,832.0881,"linear","linear"],[0.3667,1000.0,833.0821,"linear","linear"],[0.4,1000.0,834.0081,"linear","hold"],[0.4333,1000.0,862.069,"hold","hold"]],"kx":[[0.0,960.0,0.0,0.0,33.33,0.1,false,false],[0.2,960.0,0.0,0.0,30.0,33.33,false,true],[0.2333,956.425,-39.0166,-39.0166,33.33,24.0,true,false],[0.4,953.5,-9.749,-9.749,91.0,33.33,false,true],[0.4333,946.545,4.4861,4.4861,33.33,20.0,true,false],[0.6667,947.0,0.26,0.26,81.0,0.1,false,false],[1.5,947.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,670.0,0.0,0.0,33.33,0.1,false,false],[0.2,670.0,0.0,0.0,15.0,33.33,false,true],[0.2333,645.25,-270.1148,-270.1148,33.33,24.0,true,false],[0.4,625.0,-67.4933,-67.4933,91.0,33.33,false,true],[0.4333,581.4,-13.8033,-13.8033,33.33,20.0,true,false],[0.6667,580.0,-0.7999,-0.7999,81.0,0.1,false,false],[1.2,580.0,0.0,0.0,80.0,100.0,false,false],[1.2333,580.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,540.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[32.0,32.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[32.0,32.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[27.985,27.985],[-43.8186,-43.8186],[-43.8186,-43.8186],33.33,24.0,true,false],[0.4,[24.7,24.7],[-10.9489,-10.9489],[-10.9489,-10.9489],91.0,33.33,false,true],[0.4333,[18.009,18.009],[-6.0045,-6.0045],[-6.0045,-6.0045],33.33,20.0,true,false],[0.6667,[17.4,17.4],[-0.3479,-0.3479],[-0.3479,-0.3479],81.0,0.1,false,false],[1.5,[17.4,17.4],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"city","x":1144,"y":587,"w":140,"h":206,"mask":[[0.0,679.6117,1000.0,"hold","hold"],[0.2333,726.9201,1000.0,"hold","linear"],[0.2667,745.6954,1000.0,"linear","linear"],[0.3,754.3206,1000.0,"linear","linear"],[0.3333,760.3886,1000.0,"linear","linear"],[0.3667,765.6613,1000.0,"linear","linear"],[0.4,770.4918,1000.0,"linear","hold"],[0.4333,887.5,1000.0,"hold","hold"]],"kx":[[0.0,1214.0,0.0,0.0,33.33,0.1,false,false],[0.2,1214.0,0.0,0.0,0.1,33.33,false,true],[0.2333,1142.775,-777.3303,-777.3303,33.33,24.0,true,false],[0.4,1084.5,-194.2306,-194.2306,91.0,33.33,false,true],[0.4333,954.825,1.7254,1.7254,33.33,33.33,true,false],[0.5,954.94,0.8907,0.8907,33.33,9.0,false,false],[1.5,955.0,0.0,0.0,85.0,33.33,false,false]],"ky":[[0.0,690.0,0.0,0.0,33.33,0.1,false,false],[0.2,690.0,0.0,0.0,10.0,33.33,false,true],[0.2333,705.675,171.0727,171.0727,33.33,24.0,true,false],[0.4,718.5,42.7457,42.7457,91.0,33.33,false,true],[0.4333,754.245,-71.4323,-71.4323,33.33,20.0,true,false],[0.6667,747.0,-4.1392,-4.1392,81.0,0.1,false,false],[1.2,747.0,0.0,0.0,80.0,100.0,false,false],[1.2333,747.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,707.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[20.6,20.6],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[20.6,20.6],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[19.335,19.335],[-13.8059,-13.8059],[-13.8059,-13.8059],33.33,24.0,true,false],[0.4,[18.3,18.3],[-3.4497,-3.4497],[-3.4497,-3.4497],91.0,33.33,false,true],[0.4333,[16.56,16.56],[-5.5213,-5.5213],[-5.5213,-5.5213],33.33,20.0,true,false],[0.6667,[16.0,16.0],[-0.3199,-0.3199],[-0.3199,-0.3199],81.0,0.1,false,false],[1.5,[16.0,16.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"dunes","x":620,"y":827,"w":150,"h":150,"mask":[[0.0,1000.0,1000.0,"hold","hold"],[0.2333,859.3518,1000.0,"hold","linear"],[0.2667,815.4506,1000.0,"linear","linear"],[0.3,797.0197,1000.0,"linear","linear"],[0.3333,784.6411,1000.0,"linear","linear"],[0.3667,774.2549,1000.0,"linear","linear"],[0.4,765.0273,1000.0,"linear","hold"],[0.4333,601.8519,1000.0,"hold","hold"]],"kx":[[0.0,695.0,0.0,0.0,33.33,0.1,false,false],[0.2,695.0,0.0,0.0,30.0,33.33,false,true],[0.2333,809.95,1254.5331,1254.5331,33.33,24.0,true,false],[0.4,904.0,313.4687,313.4687,91.0,33.33,false,true],[0.4333,1118.355,-52.7978,-52.7978,33.33,20.0,true,false],[0.6667,1113.0,-3.0594,-3.0594,81.0,0.1,false,false],[1.5,1113.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,902.0,0.0,0.0,33.33,0.1,false,false],[0.2,902.0,0.0,0.0,100.0,33.33,false,true],[0.2333,769.175,-1449.616,-1449.616,33.33,24.0,true,false],[0.4,660.5,-362.2138,-362.2138,91.0,33.33,false,true],[0.4333,414.765,41.7551,41.7551,33.33,20.0,true,false],[0.6667,419.0,2.4196,2.4196,81.0,0.1,false,false],[1.2,419.0,0.0,0.0,80.0,100.0,false,false],[1.2333,419.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,379.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[15.0,15.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[15.0,15.0],[0.0,0.0],[0.0,0.0],30.0,33.33,false,true],[0.2333,[16.815,16.815],[19.8084,19.8084],[19.8084,19.8084],33.33,24.0,true,false],[0.4,[18.3,18.3],[4.9495,4.9495],[4.9495,4.9495],91.0,33.33,false,true],[0.4333,[22.356,22.356],[-7.4538,-7.4538],[-7.4538,-7.4538],33.33,20.0,true,false],[0.6667,[21.6,21.6],[-0.4319,-0.4319],[-0.4319,-0.4319],81.0,0.1,false,false],[1.5,[21.6,21.6],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"canal","x":850,"y":823,"w":220,"h":150,"mask":[[0.0,1000.0,681.8182,"hold","hold"],[0.2333,1000.0,733.5065,"hold","linear"],[0.2667,1000.0,756.1644,"linear","linear"],[0.3,1000.0,767.0307,"linear","linear"],[0.3333,1000.0,774.8571,"linear","linear"],[0.3667,1000.0,781.7839,"linear","linear"],[0.4,1000.0,788.2353,"linear","hold"],[0.4333,1000.0,983.3333,"hold","hold"]],"kx":[[0.0,960.0,0.0,0.0,33.33,0.1,false,false],[0.2,960.0,0.0,0.0,30.0,33.33,false,true],[0.2333,1004.0,480.2041,480.2041,33.33,24.0,true,false],[0.4,1040.0,119.988,119.988,91.0,33.33,false,true],[0.4333,1125.6,-55.2133,-55.2133,33.33,20.0,true,false],[0.6667,1120.0,-3.1994,-3.1994,81.0,0.1,false,false],[1.5,1120.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,898.0,0.0,0.0,33.33,0.1,false,false],[0.2,898.0,0.0,0.0,80.0,33.33,false,true],[0.2333,815.5,-900.3826,-900.3826,33.33,24.0,true,false],[0.4,748.0,-224.9775,-224.9775,91.0,33.33,false,true],[0.4333,600.03,-20.0148,-20.0148,33.33,20.0,true,false],[0.6667,598.0,-1.1598,-1.1598,81.0,0.1,false,false],[1.2,598.0,0.0,0.0,80.0,100.0,false,false],[1.2333,598.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,558.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[22.0,22.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[22.0,22.0],[0.0,0.0],[0.0,0.0],15.0,33.33,false,true],[0.2333,[19.25,19.25],[-30.0128,-30.0128],[-30.0128,-30.0128],33.33,24.0,true,false],[0.4,[17.0,17.0],[-7.4993,-7.4993],[-7.4993,-7.4993],91.0,33.33,false,true],[0.4333,[12.42,12.42],[-4.141,-4.141],[-4.141,-4.141],33.33,20.0,true,false],[0.6667,[12.0,12.0],[-0.24,-0.24],[-0.24,-0.24],81.0,0.1,false,false],[1.5,[12.0,12.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"file":"island","x":1132,"y":811,"w":150,"h":160,"mask":[[0.0,937.5,1000.0,"hold","hold"],[0.2333,868.75,1000.0,"hold","linear"],[0.2667,843.75,1000.0,"linear","linear"],[0.3,832.6596,1000.0,"linear","linear"],[0.3333,825.0,1000.0,"linear","linear"],[0.3667,818.4375,1000.0,"linear","linear"],[0.4,812.5,1000.0,"linear","hold"],[0.4333,687.5,1000.0,"hold","hold"]],"kx":[[0.0,1207.0,0.0,0.0,33.33,0.1,false,false],[0.2,1207.0,0.0,0.0,5.0,33.33,false,true],[0.2333,1187.75,-210.0893,-210.0893,33.33,24.0,true,false],[0.4,1172.0,-52.4948,-52.4948,91.0,33.33,false,true],[0.4333,1143.195,-61.0798,-61.0798,33.33,20.0,true,false],[0.6667,1137.0,-3.5393,-3.5393,81.0,0.1,false,false],[1.5,1137.0,0.0,0.0,100.0,33.33,false,false]],"ky":[[0.0,891.0,0.0,0.0,33.33,0.1,false,false],[0.2,891.0,0.0,0.0,60.0,33.33,false,true],[0.2333,851.95,-426.1811,-426.1811,33.33,24.0,true,false],[0.4,820.0,-106.4894,-106.4894,91.0,33.33,false,true],[0.4333,756.315,-72.1224,-72.1224,33.33,20.0,true,false],[0.6667,749.0,-4.1792,-4.1792,81.0,0.1,false,false],[1.2,749.0,0.0,0.0,80.0,100.0,false,false],[1.2333,749.0,-29.9964,-29.9964,0.1,71.0,false,false],[1.5,709.0,-300.0405,-300.0405,8.0,33.33,false,false]],"ks":[[0.0,[16.0,16.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[0.2,[16.0,16.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.2333,[16.0,16.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[0.4,[16.0,16.0],[0.0,0.0],[0.0,0.0],0.1,33.33,false,true],[0.4333,[16.56,16.56],[-5.5213,-5.5213],[-5.5213,-5.5213],33.33,20.0,true,false],[0.6667,[16.0,16.0],[-0.3199,-0.3199],[-0.3199,-0.3199],81.0,0.1,false,false],[1.5,[16.0,16.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]}],"header":[{"k":"icon","name":"Phone_Back_Icon","file":"back","x":786.0,"y":175.0,"w":18.0,"h":18.0,"blur":true},{"k":"icon","name":"Phone_Bell_Icon","file":"bell","x":1080.0,"y":175.0,"w":18.0,"h":18.0,"blur":true},{"k":"icon","name":"Phone_Gear_Icon","file":"gear","x":1116.0,"y":175.0,"w":18.0,"h":18.0,"blur":true},{"k":"text","name":"Phone_App_Name","str":"WAYFOLD","weight":600,"size":14,"color":"#141414","track":20.0,"x":822.0,"y":189.0625,"just":"left","blur":true},{"k":"text","name":"Phone_Title_1","str":"PICK A WEEKEND ESCAPE","weight":600,"size":21,"color":"#141414","track":-5.0,"x":784.0,"y":245.3438,"just":"left","blur":true}],"bar":[{"k":"box","name":"Bar_Button_Plus","x":778.0,"y":866.0,"w":46.0,"h":46.0,"r":12,"blur":true,"fill":"#F1F1F1"},{"k":"box","name":"Bar_Button_Search","x":832.0,"y":866.0,"w":46.0,"h":46.0,"r":12,"blur":true,"fill":"#F1F1F1"},{"k":"box","name":"Bar_CTA","x":886.0,"y":866.0,"w":256.0,"h":46.0,"r":12,"blur":true,"fill":"#F1F1F1"},{"k":"icon","name":"Bar_Plus_Icon","file":"plus_22","x":790.0,"y":878.0,"w":22.0,"h":22.0,"blur":true},{"k":"icon","name":"Bar_Search_Icon","file":"search","x":844.0,"y":878.0,"w":22.0,"h":22.0,"blur":true},{"k":"icon","name":"Bar_Bag_Icon","file":"bag","x":902.0,"y":879.0,"w":20.0,"h":20.0,"blur":true},{"k":"icon","name":"Bar_Arrow_Icon","file":"arrow","x":934.0,"y":879.0,"w":20.0,"h":20.0,"blur":true},{"k":"text","name":"Bar_CTA_Text","str":"SAVE TRIP","weight":900,"size":18,"color":"#141414","track":0,"x":966.0,"y":895.9375,"just":"left","blur":true}],"cardIn":0.0667,"card":{"k":"box","name":"Phone_Card","x":760,"y":147,"w":400,"h":786,"r":26,"fill":"#FFFFFF"},"matte":{"k":"box","name":"MATTE_PhoneScreen","x":760,"y":147,"w":400,"h":786,"r":26,"fill":"#FFFFFF"},"matteSize":[[0,[4000,4000]],[0.0667,[400,786]]],"shadow":{"col":"#785A32","op":14,"dist":18,"soft":50},"grpS":[[0.0,[92.5,92.5],[0.0,0.0],[0.0,0.0],33.33,100.0,false,false],[0.0667,[92.5,92.5],[0.0029,0.0029],[0.0029,0.0029],0.1,33.33,false,false],[0.1,[92.6571,92.6571],[8.4025,8.4025],[8.4025,8.4025],33.33,100.0,false,false],[0.2333,[93.7,93.7],[9.9618,9.9618],[9.9618,9.9618],0.1,33.33,false,false],[0.2667,[94.4,94.4],[9.9616,9.9616],[9.9616,9.9616],33.33,20.0,false,false],[0.4,[95.5,95.5],[20.2991,20.2991],[20.2991,20.2991],27.0,33.33,false,false],[0.4333,[98.1,98.1],[31.5042,31.5042],[31.5042,31.5042],33.33,9.0,false,false],[0.6667,[100.0,100.0],[2.0,2.0],[2.0,2.0],74.0,0.1,false,false],[1.5,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]],"grpY":[[0.0,541.0,0.0,0.0,33.33,100.0,false,false],[0.0667,541.0,-0.0001,-0.0001,0.1,30.33,false,false],[0.1,540.9951,-0.2896,-0.2896,36.33,2.0,false,false],[0.9,539.2421,-3.6891,-3.6891,53.0,55.0,false,false],[1.2333,538.0,-7.3488,-7.3488,26.0,33.33,false,false],[1.3333,535.5,-30.4056,-30.4056,33.33,59.0,false,false],[1.5,521.0,-135.0147,-135.0147,45.0,33.33,false,false]],"markers":[[0.0667,"card on"],[0.2333,"re-flow"],[0.4333,"grid set"],[1.2333,"scroll out"]]},"prompt":{"at":332,"dur":2.5,"bg":"#FBF1E6","items":[{"k":"icon","name":"Ideas_Icon","file":"bulb","x":240.0,"y":200.0,"w":44.0,"h":56.0,"blur":true},{"k":"text","name":"Ideas_Text","str":"Ideas","weight":450,"size":46,"color":"#141414","track":-10.0,"x":306.0,"y":244.5625,"just":"left","blur":true},{"k":"box","name":"Chip_1_BG","x":246.0,"y":318.0,"w":648.25,"h":102.0,"r":51,"blur":true,"fill":"#EFE9E1"},{"k":"icon","name":"Chip_1_Icon","file":"doc","x":290.0,"y":346.0,"w":36.0,"h":46.0,"blur":true},{"k":"text","name":"Chip_1_Text","str":"Add packing list to doc","weight":450,"size":47,"color":"#141414","track":-12.0,"x":352.0,"y":386.0312,"just":"left","blur":true},{"k":"box","name":"Chip_2_BG","x":1032.0,"y":318.0,"w":620.0,"h":102.0,"r":51,"blur":true,"fill":"#EFE9E1"},{"k":"icon","name":"Chip_2_Icon","file":"sheet","x":1076.0,"y":346.0,"w":36.0,"h":46.0,"blur":true},{"k":"text","name":"Chip_2_Text","str":"Split costs in a sheet","weight":450,"size":47,"color":"#141414","track":-12.0,"x":1138.0,"y":386.0312,"just":"left","blur":true},{"k":"icon","name":"Chip_More_Icon","file":"chev","x":1632.0,"y":345.0,"w":30.0,"h":46.0,"blur":true},{"k":"box","name":"Prompt_Card","x":213.0,"y":468.0,"w":1467.0,"h":407.0,"r":22,"blur":true,"fill":"#FFFFFF"},{"k":"text","name":"PromptText","str":"Find a quiet cabin weekend near the Alps.","weight":450,"size":52,"color":"#141414","track":-18.0,"x":261.0,"y":564.375,"just":"left","blur":true},{"k":"icon","name":"Plus_Icon","file":"plus_36","x":263.0,"y":768.0,"w":36.0,"h":36.0,"blur":true},{"k":"icon","name":"Wayfold_Mark","file":"mark","x":363.0,"y":760.0,"w":52.0,"h":52.0,"blur":true},{"k":"text","name":"Wayfold_Label","str":"Wayfold","weight":450,"size":46,"color":"#141414","track":-10.0,"x":433.0,"y":802.5625,"just":"left","blur":true},{"k":"text","name":"Action_Label","str":"Plan","weight":450,"size":46,"color":"#141414","track":-10.0,"x":1289.0,"y":800.5625,"just":"left","blur":true},{"k":"icon","name":"Mic_Icon","file":"mic","x":1443.0,"y":758.0,"w":40.0,"h":52.0,"blur":true}],"textName":"PromptText","fade":{"x":1032,"y":318,"w":620,"h":102,"completion":13,"feather":111.6},"fadeTargets":["Chip_2_BG","Chip_2_Icon","Chip_2_Text"],"caretGap":3.0,"caretLift":45.375,"caret":{"k":"box","name":"Caret","x":1258.484375,"y":519,"w":3,"h":54,"fill":"#1A1A1A"},"caretOp":[[0,100],[1.4333,0],[1.7,100],[1.9667,0],[2.2333,100]],"sendC":[1595.0,786.0],"cold":"#0B0B0B","hot":"#E28C04","sendBox":{"k":"box","name":"Send_Button","x":1539,"y":732,"w":112,"h":108,"r":12,"fill":"#0B0B0B"},"up":{"k":"icon","name":"Send_Arrow","file":"up","x":1569.0,"y":760.0,"w":52.0,"h":52.0,"blur":true},"cursor":{"pts":[[66,4],[108,128],[64,104],[12,124]]},"curIn":1.1667,"camX":[[0.0,0.0,0.0,0.0,33.33,92.0,false,false],[0.8667,0.0,-0.1146,-0.1146,0.1,33.33,false,false],[0.9,-5.3223,-249.6686,-249.6686,33.33,50.0,false,false],[1.1333,-36.0,-420.2818,-420.2818,43.0,33.33,false,true],[1.1667,-1538.4,-315.0526,-315.0526,33.33,18.0,true,false],[1.6333,-1586.4,-11.16,-11.16,75.0,0.1,false,false],[2.4667,-1586.4,0.0,0.0,100.0,33.33,false,false]],"camY":[[0.0,62.0,-0.0,-0.0,33.33,100.0,false,false],[0.0333,62.0,-1.7303,-1.7303,0.1,33.33,false,false],[0.0667,21.0,-228.721,-228.721,33.33,16.0,false,false],[0.3,4.9111,-23.3654,-23.3654,20.0,7.0,false,false],[0.6667,4.5,-0.0225,-0.0225,100.0,33.33,false,false],[0.7,3.3333,-60.0,-60.0,33.33,33.33,false,false],[0.7333,1.1667,-60.0,-60.0,33.33,7.0,false,false],[1.1333,0.0,0.0,0.0,100.0,33.33,false,true],[1.1667,-711.2,0.0,0.0,33.33,0.1,true,false],[2.1333,-711.2,0.0,0.0,0.1,100.0,false,false],[2.1667,-711.2,11.2481,11.2481,0.1,62.0,false,false],[2.4667,-687.2,157.5215,157.5215,10.0,33.33,false,false]],"camS":[[0.0,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,10.0,false,false],[1.1333,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,true],[1.1667,[160.0,160.0],[0.0,0.0],[0.0,0.0],33.33,0.1,true,false],[2.4667,[160.0,160.0],[0.0,0.0],[0.0,0.0],50.0,33.33,false,false]],"typed":[[0.0,30.0,0.0,0.0,33.33,100.0,false,false],[0.0667,30.0,0.0365,0.0365,0.1,33.33,false,false],[0.1,32.0915,115.2439,115.2439,33.33,88.0,false,false],[0.1667,48.0,151.244,151.244,30.33,28.0,false,false],[0.2667,57.3674,105.0603,105.0603,75.0,73.0,false,false],[0.4,74.0,96.4344,96.4344,26.0,33.33,false,false],[0.4667,79.0,94.7811,94.7811,33.33,33.33,false,false],[0.5,83.0,51.499,51.499,33.33,0.1,false,false],[0.7333,91.0,42.8662,42.8662,18.0,15.0,false,false],[0.9,100.0,14.9971,14.9971,55.0,0.1,false,false],[2.4667,100.0,0.0,0.0,90.0,33.33,false,false]],"heat":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[1.3,0.0,0.0,0.0,0.1,100.0,false,false],[1.3333,0.0,22.4984,22.4984,0.1,30.33,false,false],[1.6,20.0,159.3836,159.3836,13.0,33.33,false,false],[1.6667,42.0,277.9378,277.9378,33.33,33.33,false,false],[1.7333,58.0,266.6666,266.6666,33.33,46.0,false,false],[1.9333,100.0,37.4898,37.4898,53.0,0.1,false,false],[2.4667,100.0,0.0,0.0,80.0,33.33,false,false]],"press":[[0.0,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[1.8667,[100.0,100.0],[0.0,0.0],[0.0,0.0],0.1,100.0,false,false],[1.9,[100.0,100.0],[-7.4968,-7.4968],[-7.4968,-7.4968],0.1,67.0,false,false],[2.0667,[90.0,90.0],[-72.003,-72.003],[-72.003,-72.003],58.0,33.33,false,false],[2.1333,[86.0,86.0],[-60.027,-60.027],[-60.027,-60.027],33.33,33.33,false,false],[2.1667,[84.0,84.0],[-0.0475,-0.0475],[-0.0475,-0.0475],33.33,33.33,false,false],[2.2,[84.6667,84.6667],[35.0,35.0],[35.0,35.0],33.33,58.0,false,false],[2.3667,[95.6136,95.6136],[71.5909,71.5909],[71.5909,71.5909],37.0,25.0,false,false],[2.4667,[97.0,97.0],[0.0,0.0],[0.0,0.0],75.0,33.33,false,false]],"curX":[[1.1667,554.0,1378.1016,1378.1016,33.33,33.33,false,false],[1.2333,645.86,974.6055,974.6055,33.33,33.33,false,false],[1.3,696.092,881.7748,881.7748,33.33,33.33,false,false],[1.3333,730.022,580.6586,580.6586,33.33,23.0,false,false],[1.9667,841.631,133.762,133.762,2.1,12.0,false,false],[2.1333,872.0802,101.1042,101.1042,68.0,33.33,false,false],[2.1667,875.0,0.0622,0.0622,33.33,33.33,false,false],[2.2,874.0146,-51.4612,-51.4612,33.33,75.0,false,false],[2.4667,849.9733,-40.6684,-40.6684,100.0,33.33,false,false]],"curY":[[1.1667,818.0,-1190.3387,-1190.3387,33.33,33.33,false,false],[1.2333,738.656,-832.7175,-832.7175,33.33,33.33,false,false],[1.3,695.968,-738.8701,-738.8701,33.33,33.33,false,false],[1.3333,667.896,-462.8488,-462.8488,33.33,24.0,false,false],[1.9333,583.9645,-61.0642,-61.0642,2.1,24.0,false,false],[2.1667,553.0,11.1955,11.1955,30.0,0.1,false,false],[2.4667,598.1765,191.9332,191.9332,99.0,33.33,false,false]],"curS":[[1.1667,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,5.0,false,false],[1.8667,[100.0,100.0],[0.0,0.0],[0.0,0.0],90.0,100.0,false,false],[1.9,[100.0,100.0],[-20.2441,-20.2441],[-20.2441,-20.2441],0.1,50.0,false,false],[2.1333,[82.7,82.7],[-48.4781,-48.4781],[-48.4781,-48.4781],68.0,33.33,false,false],[2.1667,[81.3,81.3],[-0.0298,-0.0298],[-0.0298,-0.0298],33.33,33.33,false,false],[2.2,[81.7725,81.7725],[24.675,24.675],[24.675,24.675],33.33,0.1,false,false],[2.2667,[83.6654,83.6654],[34.812,34.812],[34.812,34.812],17.0,95.0,false,false],[2.3333,[90.7,90.7],[38.2985,38.2985],[38.2985,38.2985],32.0,15.0,false,false],[2.4667,[93.3,93.3],[19.5,19.5],[19.5,19.5],98.0,33.33,false,false]],"markers":[[1.1667,"CUT close-up"],[1.3333,"button heats"],[1.9,"press"]]},"audit":{"at":407,"dur":4.3667,"darkCol":"#1B1B1B","listing":{"ox":300,"oy":200,"w":2400,"h":1500,"items":[{"k":"box","name":"Image_BG_1","x":150.0,"y":160.0,"w":1000.0,"h":440.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_1","file":"hearth","x":150.0,"y":160.0,"w":1000.0,"h":440.0},{"k":"box","name":"Add_Button_1","x":1110.0,"y":512.0,"w":58.0,"h":58.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"icon","name":"Add_Icon_1","file":"plus_30","x":1124.0,"y":526.0,"w":30.0,"h":30.0,"blur":true},{"k":"text","name":"Stay_Name_1","str":"LARCH STUDIO \u00b7 VALLEY","weight":500,"size":25,"color":"#222222","track":100.0,"x":162.0,"y":690.2188,"just":"left","blur":true},{"k":"text","name":"Price_A","str":"\u20ac168 / night","weight":400,"size":22,"color":"#8A8A8A","track":60.0,"x":162.0,"y":747.3125,"just":"left","blur":true},{"k":"text","name":"Option_A_1","str":"1N","weight":400,"size":25,"color":"#222222","track":50.0,"x":162.0,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_A_2","str":"2N","weight":400,"size":25,"color":"#222222","track":50.0,"x":225.5156,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_A_3","str":"3N","weight":400,"size":25,"color":"#222222","track":50.0,"x":294.1094,"y":808.2188,"just":"left","blur":true},{"k":"box","name":"Badge_BG_A","x":150.0,"y":886.0,"w":271.375,"h":46.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"text","name":"Badge_A","str":"Breakfast included","weight":400,"size":25,"color":"#222222","track":60.0,"x":162.0,"y":918.2188,"just":"left","blur":true},{"k":"box","name":"Image_BG_2","x":150.0,"y":952.0,"w":1000.0,"h":520.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_2","file":"hearth","x":150.0,"y":952.0,"w":1000.0,"h":520.0},{"k":"box","name":"Image_BG_3","x":1190.0,"y":160.0,"w":1000.0,"h":440.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_3","file":"lounge","x":1190.0,"y":160.0,"w":1000.0,"h":440.0},{"k":"box","name":"Add_Button_3","x":2150.0,"y":512.0,"w":58.0,"h":58.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"icon","name":"Add_Icon_3","file":"plus_30","x":2164.0,"y":526.0,"w":30.0,"h":30.0,"blur":true},{"k":"text","name":"Stay_Name_3","str":"PINE HOLLOW CABIN","weight":500,"size":25,"color":"#222222","track":100.0,"x":1202.0,"y":690.2188,"just":"left","blur":true},{"k":"box","name":"Price_Select_BG","x":1198.0,"y":724.0,"w":146.625,"h":30.0,"r":0,"blur":true,"fill":"#1F6FE5","fop":13,"op":0},{"k":"text","name":"Price_B","str":"\u20ac212 / night","weight":400,"size":22,"color":"#8A8A8A","track":60.0,"x":1202.0,"y":747.3125,"just":"left","blur":true},{"k":"text","name":"Price_B_Selected","str":"\u20ac212 / night","weight":400,"size":22,"color":"#1F6FE5","track":60.0,"x":1202.0,"y":747.3125,"just":"left","blur":true,"op":0},{"k":"text","name":"Option_B_1","str":"FRI","weight":400,"size":25,"color":"#222222","track":50.0,"x":1202.0,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_2","str":"SAT","weight":400,"size":25,"color":"#222222","track":50.0,"x":1275.3125,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_3","str":"SUN","weight":400,"size":25,"color":"#222222","track":50.0,"x":1358.375,"y":808.2188,"just":"left","blur":true},{"k":"text","name":"Option_B_4","str":"MON","weight":400,"size":25,"color":"#222222","track":50.0,"x":1447.6094,"y":808.2188,"just":"left","blur":true},{"k":"box","name":"Badge_BG_B","x":1190.0,"y":886.0,"w":253.9531,"h":46.0,"r":0,"blur":true,"fill":"#FFFFFF"},{"k":"text","name":"Badge_B","str":"2 nights for \u20ac399","weight":400,"size":25,"color":"#222222","track":60.0,"x":1202.0,"y":918.2188,"just":"left","blur":true},{"k":"box","name":"Image_BG_4","x":1190.0,"y":952.0,"w":1000.0,"h":520.0,"r":0,"blur":true,"fill":"#ECECEC"},{"k":"art","name":"Image_4","file":"room","x":1190.0,"y":952.0,"w":1000.0,"h":520.0}],"select":{"names":["Price_Select_BG","Price_B","Price_B_Selected"],"keys":[[[0,0],[0.7333,100]],[[0,100],[0.7333,0]],[[0,0],[0.7333,100]]]}},"checkout":{"ox":100,"oy":100,"w":1200,"h":1200,"items":[{"k":"box","name":"Promo_Field","x":100.0,"y":60.0,"w":900.0,"h":172.0,"r":22,"blur":true,"stroke":"#3A3A3A","sw":2},{"k":"text","name":"Promo_Placeholder","str":"Promo code or gift card","weight":400,"size":40,"color":"#6C6C6C","track":0,"x":134.0,"y":168.75,"just":"left","blur":true},{"k":"box","name":"Back_Button","x":100.0,"y":282.0,"w":820.0,"h":114.0,"r":22,"blur":true,"stroke":"#3D3D3D","sw":2},{"k":"icon","name":"Back_Icon","file":"card","x":132.0,"y":319.0,"w":40.0,"h":40.0,"blur":true},{"k":"text","name":"Back_Text","str":"Back to your cabin","weight":650,"size":40,"color":"#FFFFFF","track":0,"x":188.0,"y":353.25,"just":"left","blur":true},{"k":"text","name":"Subtotal","str":"Subtotal","weight":400,"size":41,"color":"#FFFFFF","track":0,"x":100.0,"y":479.7188,"just":"left","blur":true},{"k":"text","name":"Fee","str":"Cleaning fee","weight":400,"size":41,"color":"#FFFFFF","track":0,"x":100.0,"y":553.7188,"just":"left","blur":true},{"k":"icon","name":"Fee_Help_Icon","file":"help","x":360.0469,"y":524.0,"w":30.0,"h":30.0,"blur":true},{"k":"text","name":"Total","str":"Total","weight":700,"size":54,"color":"#FFFFFF","track":0,"x":100.0,"y":679.3125,"just":"left","blur":true},{"k":"box","name":"Tax_Highlight","x":94.0,"y":710.0,"w":588.1875,"h":58.0,"fill":"#F08A24","fop":28},{"k":"text","name":"Tax_Line","str":"Including \u20ac35.00 cleaning fee","weight":400,"size":41,"color":"#6C6C6C","track":0,"x":100.0,"y":753.7188,"just":"left","blur":true},{"k":"text","name":"Tax_Line_Hot","str":"Including \u20ac35.00 cleaning fee","weight":400,"size":41,"color":"#D9813A","track":0,"x":100.0,"y":753.7188,"just":"left","blur":true,"op":0},{"k":"text","name":"Help","str":"HELP","weight":700,"size":32,"color":"#FFFFFF","track":60.0,"x":620.0,"y":716.0,"just":"left","blur":true},{"k":"box","name":"Pay_Button","x":100.0,"y":935.0,"w":820.0,"h":140.0,"r":26,"blur":true,"stroke":"#3D3D3D","sw":2}],"hlName":"Tax_Highlight","hotName":"Tax_Line_Hot","hlKeys":[[0.0,[0.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[2.2,[0.0,100.0],[0.0,0.0],[0.0,0.0],0.1,100.0,false,false],[2.2333,[0.0,100.0],[187.5,0.0],[187.5,0.0],0.1,0.1,false,false],[2.5,[100.0,100.0],[187.5,0.0],[187.5,0.0],0.1,0.1,false,false],[4.3333,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]],"hotKeys":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[2.2,0.0,0.0,0.0,0.1,100.0,false,false],[2.2333,0.0,187.5,187.5,0.1,0.1,false,false],[2.5,100.0,187.5,187.5,0.1,0.1,false,false],[4.3333,100.0,0.0,0.0,100.0,33.33,false,false]]},"white":{"w":1000,"h":1080,"items":[{"k":"text","name":"Panel_Text_1_1","str":"SAVE FOR LATER","weight":400,"size":25,"color":"#141414","track":20.0,"x":106.0,"y":320.2188,"just":"left","blur":true},{"k":"box","name":"Panel_Box_2","x":105.0,"y":360.0,"w":800.0,"h":78.0,"r":0,"blur":true,"fill":"#141414"},{"k":"text","name":"Panel_Text_3_1","str":"BOOK THIS CABIN","weight":400,"size":24,"color":"#FFFFFF","track":20.0,"x":415.0,"y":407.25,"just":"center","blur":true},{"k":"box","name":"Panel_Box_4","x":105.0,"y":500.0,"w":800.0,"h":175.0,"r":0,"blur":true,"fill":"#9EAE9C"},{"k":"text","name":"Panel_Text_5_1","str":"LATE SUNDAY CHECKOUT","weight":400,"size":24,"color":"#FFFFFF","track":20.0,"x":415.0,"y":577.25,"just":"center","blur":true},{"k":"text","name":"Panel_Text_5_2","str":"ON THE HOUSE","weight":400,"size":24,"color":"#FFFFFF","track":20.0,"x":415.0,"y":611.25,"just":"center","blur":true}]},"dL":[[0.0,-960.0,0.0,0.0,33.33,5.0,false,false],[0.9333,-960.0,0.0,0.0,100.0,100.0,false,false],[0.9667,-960.0,9.5987,9.5987,0.1,19.0,false,false],[1.4667,-876.0,770.6794,770.6794,20.0,76.0,false,false],[1.6667,-50.88,433.1319,433.1319,46.0,19.0,false,false],[2.7667,93.2803,697.6849,697.6849,22.0,98.0,false,false],[2.8333,418.56,4709.0043,4709.0043,40.0,33.33,false,false],[2.9,618.24,293.0675,293.0675,33.33,4.0,false,false],[3.1,638.2711,20.8195,20.8195,63.0,10.0,false,false],[3.7667,639.9401,1.6819,1.6819,23.0,52.0,false,false],[3.8,640.0,8.4591,8.4591,0.1,99.0,false,false],[4.3333,700.0,675.3709,675.3709,2.1,33.33,false,false]],"dR":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[0.9333,0.0,0.0,0.0,0.1,100.0,false,false],[0.9667,0.0,9.5987,9.5987,0.1,19.0,false,false],[1.4667,84.0,770.6794,770.6794,20.0,26.0,false,false],[1.5333,219.9286,2713.2762,2713.2762,11.0,65.0,false,false],[1.6667,909.12,433.1319,433.1319,62.0,15.0,false,false],[2.6333,975.04,133.2267,133.2267,22.0,7.0,false,false],[2.8,1025.28,842.5945,842.5945,16.0,11.0,false,false],[2.9,1269.12,146.5338,146.5338,68.0,4.0,false,false],[3.1,1279.1356,10.4097,10.4097,63.0,10.0,false,false],[3.7667,1279.97,0.841,0.841,23.0,46.0,false,false],[3.8,1280.0,7.9791,7.9791,0.1,99.0,false,false],[4.3333,1340.0,675.3709,675.3709,2.1,33.33,false,false]],"wR":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[2.2667,0.0,0.0,0.0,0.1,100.0,false,false],[2.3,0.0,19.1981,19.1981,0.1,76.0,false,false],[2.8,130.56,1685.1889,1685.1889,6.0,28.0,false,false],[2.8667,555.1463,3244.3042,3244.3042,91.0,33.33,false,false],[2.9,618.24,293.0675,293.0675,33.33,20.0,false,false],[3.3333,639.3562,2.1002,2.1002,17.0,33.33,false,false],[3.7667,639.9401,1.6819,1.6819,33.33,52.0,false,false],[3.8,640.0,8.4591,8.4591,0.1,99.0,false,false],[4.3333,700.0,675.3709,675.3709,2.1,33.33,false,false]],"gx":[[0.0,0.0,0.0,0.0,33.33,0.1,false,false],[0.9333,0.0,0.0,0.0,0.1,100.0,false,false],[0.9667,0.0,5.6192,5.6192,0.1,19.0,false,false],[1.4667,49.175,451.1686,451.1686,20.0,11.0,false,false],[1.5667,195.014,2478.3758,2478.3758,33.33,33.33,false,false],[1.6333,510.296,1067.2899,1067.2899,33.33,7.0,false,false],[2.7667,579.9273,134.0863,134.0863,30.0,59.0,false,false],[2.9,680.818,56.3239,56.3239,67.0,4.0,false,false],[3.1,684.6677,4.0012,4.0012,63.0,10.0,false,false],[3.7667,684.9885,0.3232,0.3232,23.0,24.0,false,false],[3.8,685.0,7.6837,7.6837,0.1,99.0,false,false],[4.3333,745.0,675.3709,675.3709,2.1,33.33,false,false]],"gy":[[0.0,-140.0,1470.551,1470.551,33.33,33.33,false,false],[0.0333,-81.8125,1745.6247,1745.6247,33.33,32.33,false,false],[0.1333,-28.0,249.7146,249.7146,60.0,33.33,false,false],[0.1667,-18.2,80.3946,80.3946,33.33,0.1,false,false],[0.5667,0.0,15.4008,15.4008,53.0,0.1,false,false],[0.7333,0.0,-0.0145,-0.0145,0.1,33.33,false,false],[0.7667,-0.8571,-48.2143,-48.2143,33.33,41.0,false,false],[0.9667,-22.8421,-51.5789,-51.5789,73.0,10.0,false,false],[1.4,-27.0,-3.7497,-3.7497,41.0,0.1,false,false],[4.3333,-27.0,0.0,0.0,98.0,33.33,false,false]],"cx":[[0.0,-576.0,0.0,0.0,33.33,0.1,false,false],[0.9333,-576.0,0.0,0.0,90.0,100.0,false,false],[0.9667,-576.0,9.5987,9.5987,0.1,19.0,false,false],[1.4667,-492.0,770.6794,770.6794,20.0,26.0,false,false],[1.5333,-356.0714,2713.2762,2713.2762,11.0,65.0,false,false],[1.6667,333.12,433.1319,433.1319,62.0,15.0,false,false],[2.6333,408.393,216.0771,216.0771,21.0,7.0,false,false],[2.8,489.876,1366.5829,1366.5829,16.0,11.0,false,false],[2.9,885.354,237.6595,237.6595,68.0,4.0,false,false],[3.1,901.598,16.8833,16.8833,63.0,10.0,false,false],[3.7667,902.9514,1.3639,1.3639,23.0,51.0,false,false],[3.8,903.0,8.2776,8.2776,0.1,99.0,false,false],[4.3333,963.0,675.3709,675.3709,2.1,33.33,false,false]],"wx":[[0.0,-640.0,0.0,0.0,33.33,0.1,false,false],[2.2667,-640.0,0.0,0.0,90.0,100.0,false,false],[2.3,-640.0,19.1981,19.1981,0.1,76.0,false,false],[2.8,-509.44,1685.1889,1685.1889,6.0,28.0,false,false],[2.8667,-84.8537,3244.3042,3244.3042,91.0,33.33,false,false],[2.9,-21.76,293.0675,293.0675,33.33,20.0,false,false],[3.3333,-0.6438,2.1002,2.1002,17.0,33.33,false,false],[3.7667,-0.0599,1.6819,1.6819,33.33,52.0,false,false],[3.8,0.0,8.4591,8.4591,0.1,99.0,false,false],[4.3333,60.0,675.3709,675.3709,2.1,33.33,false,false]],"notes":[{"name":"Blue","side":"left","str":"Dates are hard to tap","size":25,"weight":500,"h":50,"r":25,"col":"#1F6FE5","border":0,"tx":22.0,"base":35.2188,"inAt":0.0,"textOp":[[0.0,100]],"kx":[[0.0,1249.0,-1719.0649,-1719.0649,33.33,7.0,false,false],[1.0,1045.3396,9.674,9.674,99.0,2.1,false,false],[1.5,1142.176,1235.2995,1235.2995,15.0,74.0,false,false],[1.6,1423.4177,6208.4125,6208.4125,24.0,33.33,false,false],[1.6333,1569.296,1067.2899,1067.2899,33.33,7.0,false,false],[2.7667,1638.9273,134.0863,134.0863,30.0,59.0,false,false],[2.9,1739.818,56.3239,56.3239,67.0,4.0,false,false],[3.1,1743.6677,4.0012,4.0012,63.0,10.0,false,false],[3.7667,1743.9885,0.3232,0.3232,23.0,24.0,false,false],[3.8,1744.0,7.6837,7.6837,0.1,99.0,false,false],[4.3333,1804.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[0.0,536.0,1063.404,1063.404,33.33,33.33,false,false],[0.0667,606.865,204.8471,204.8471,33.33,33.33,false,false],[0.1333,614.07,139.6918,139.6918,33.33,48.0,false,false],[0.2333,620.595,28.7059,28.7059,100.0,14.0,false,false],[0.4667,628.64,15.1016,15.1016,100.0,55.0,false,false],[0.5667,631.0,-2.2982,-2.2982,5.0,70.0,false,false],[1.0333,595.2918,29.876,29.876,40.0,33.33,false,false],[1.2667,604.7544,-4.7368,-4.7368,39.0,87.0,false,false],[1.4,604.0,-3.7497,-3.7497,4.0,0.1,false,false],[4.3333,604.0,0.0,0.0,98.0,33.33,false,false]],"kw":[[0.0,[96.69,50.0],[1318.8548,0.0],[1318.8548,0.0],33.33,58.0,false,false],[0.1333,[210.96,50.0],[418.8613,0.0],[418.8613,0.0],85.0,33.33,false,false],[0.1667,[225.61,50.0],[263.8484,0.0],[263.8484,0.0],33.33,19.0,false,false],[0.6333,[271.7226,50.0],[41.8571,0.0],[41.8571,0.0],30.0,33.33,false,false],[0.6667,[272.49,50.0],[0.0004,0.0],[0.0004,0.0],33.33,33.33,false,false],[0.7,[271.7282,50.0],[-42.192,0.0],[-42.192,0.0],33.33,33.33,false,false],[0.8,[265.9268,50.0],[-42.192,0.0],[-42.192,0.0],33.33,33.33,false,false],[0.8333,[265.165,50.0],[-0.0109,0.0],[-0.0109,0.0],33.33,30.33,false,false],[0.8667,[265.311,50.0],[8.5428,0.0],[8.5428,0.0],36.33,100.0,false,false],[1.2333,[293.0,50.0],[28.5558,0.0],[28.5558,0.0],43.0,0.1,false,false],[4.3333,[293.0,50.0],[0.0,0.0],[0.0,0.0],93.0,33.33,false,false]]},{"name":"Orange","side":"right","str":"Cleaning fee added late","size":25,"weight":500,"h":54,"r":27,"col":"#F08A24","border":2,"tx":24.0,"base":37.2188,"inAt":1.6333,"textOp":[[1.6333,100]],"kx":[[1.6333,385.68,4484.23,4484.23,33.33,33.33,false,false],[1.6667,511.92,1554.3152,1554.3152,33.33,15.0,false,false],[2.7667,771.6445,565.7789,565.7789,23.0,98.0,false,false],[2.8333,1035.426,3818.7081,3818.7081,40.0,33.33,false,false],[2.9,1197.354,237.6595,237.6595,33.33,24.0,false,false],[3.2,1214.1785,2.8718,2.8718,10.0,33.33,false,false],[3.7667,1214.9514,1.3639,1.3639,33.33,51.0,false,false],[3.8,1215.0,8.2776,8.2776,0.1,99.0,false,false],[4.3333,1275.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[1.6333,823.0,-1260.7296,-1260.7296,33.33,33.33,false,false],[1.6667,781.0,-530.2894,-530.2894,33.33,26.0,false,false],[1.8,747.82,-238.8465,-238.8465,22.0,33.33,false,false],[1.8333,737.845,-141.3628,-141.3628,33.33,14.0,false,false],[2.1667,718.0,-22.0504,-22.0504,19.0,0.1,false,false],[2.2,718.0,0.0,0.0,100.0,100.0,false,false],[2.2333,718.0,2.6992,2.6992,0.1,0.1,false,false],[2.4667,719.98,8.5901,8.5901,0.1,36.33,false,false],[2.5667,720.52,-0.0037,-0.0037,100.0,33.33,false,false],[2.6,720.3284,-9.7984,-9.7984,33.33,100.0,false,false],[2.8333,718.0,-13.5086,-13.5086,65.0,0.1,false,false],[4.3333,718.0,0.0,0.0,100.0,33.33,false,false]],"kw":[[1.6333,[223.63,52.0],[1079.6488,0.0],[1079.6488,0.0],33.33,30.33,false,false],[1.7333,[281.182,52.0],[244.2741,0.0],[244.2741,0.0],85.0,33.33,false,false],[1.8,[294.262,52.0],[254.5025,0.0],[254.5025,0.0],33.33,33.33,false,false],[1.8333,[305.38,52.0],[194.3053,0.0],[194.3053,0.0],33.33,37.0,false,false],[1.9667,[318.46,52.0],[102.0909,0.0],[102.0909,0.0],21.0,17.0,false,false],[2.1333,[330.7769,52.0],[41.4252,0.0],[41.4252,0.0],100.0,33.33,false,false],[2.2,[331.54,52.0],[0.0,0.0],[0.0,0.0],57.0,100.0,false,false],[2.2333,[331.54,52.0],[-7.533,0.0],[-7.533,0.0],0.1,51.0,false,false],[2.4667,[293.2503,52.0],[-58.7181,0.0],[-58.7181,0.0],92.0,36.0,false,false],[2.5667,[291.2418,52.0],[0.0247,0.0],[0.0247,0.0],100.0,33.33,false,false],[2.6,[292.6363,52.0],[76.0679,0.0],[76.0679,0.0],33.33,51.0,false,false],[2.7333,[313.8009,52.0],[107.0201,0.0],[107.0201,0.0],58.0,33.33,false,false],[2.8,[319.302,52.0],[108.0514,0.0],[108.0514,0.0],33.33,36.33,false,false],[2.8333,[325.0,52.0],[85.8685,0.0],[85.8685,0.0],7.0,0.1,false,false],[4.3333,[325.0,52.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"name":"Pink","side":"left","str":"Needs one clear CTA","size":22,"weight":500,"h":44,"r":25,"col":"#D4148C","border":0,"tx":22.0,"base":32.3125,"inAt":2.8333,"textOp":[[2.8333,100]],"kx":[[2.8333,83.56,4852.6133,4852.6133,33.33,33.33,false,false],[2.9,293.32,441.8276,441.8276,33.33,15.0,false,false],[3.9667,348.3298,33.3333,33.3333,57.0,98.0,false,false],[4.3333,405.0,675.3709,675.3709,3.1,33.33,false,false]],"ky":[[2.8333,907.0,-699.3056,-699.3056,33.33,79.0,false,false],[3.1333,764.18,-221.9717,-221.9717,54.0,0.1,false,false],[3.9,722.0,-7.4003,-7.4003,89.0,0.1,false,false],[4.3333,722.0,0.0,0.0,80.0,33.33,false,false]],"kw":[[2.8333,[70.224,44.0],[977.6208,0.0],[977.6208,0.0],33.33,33.33,false,false],[2.9,[135.394,44.0],[835.9575,0.0],[835.9575,0.0],33.33,2.1,false,false],[3.0,[209.076,44.0],[371.4052,0.0],[371.4052,0.0],4.0,15.0,false,false],[3.6333,[266.0,44.0],[12.965,0.0],[12.965,0.0],35.33,0.1,false,false],[4.3333,[266.0,44.0],[0.0,0.0],[0.0,0.0],97.0,33.33,false,false]]}],"cursors":[{"name":"Blue","col":"#1F6FE5","pts":[[2.1212,2.1212],[63.6364,27.5758],[35.0,35.0],[27.5758,63.6364]],"inAt":0,"kx":[[0.0,1185.0,-1719.0649,-1719.0649,33.33,7.0,false,false],[1.0,981.3396,9.674,9.674,99.0,2.1,false,false],[1.5,1078.176,1235.2995,1235.2995,15.0,74.0,false,false],[1.6,1359.4177,6208.4125,6208.4125,24.0,33.33,false,false],[1.6333,1505.296,1067.2899,1067.2899,33.33,7.0,false,false],[2.7667,1574.9273,134.0863,134.0863,30.0,59.0,false,false],[2.9,1675.818,56.3239,56.3239,67.0,4.0,false,false],[3.1,1679.6677,4.0012,4.0012,63.0,10.0,false,false],[3.7667,1679.9885,0.3232,0.3232,23.0,24.0,false,false],[3.8,1680.0,7.6837,7.6837,0.1,99.0,false,false],[4.3333,1740.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[0.0,480.0,1063.404,1063.404,33.33,33.33,false,false],[0.0667,550.865,204.8471,204.8471,33.33,33.33,false,false],[0.1333,558.07,139.6918,139.6918,33.33,48.0,false,false],[0.2333,564.595,28.7059,28.7059,100.0,14.0,false,false],[0.4667,572.64,15.1016,15.1016,100.0,55.0,false,false],[0.5667,575.0,-2.2982,-2.2982,5.0,70.0,false,false],[1.0333,539.2918,29.876,29.876,40.0,33.33,false,false],[1.2667,548.7544,-4.7368,-4.7368,39.0,87.0,false,false],[1.4,548.0,-3.7497,-3.7497,4.0,0.1,false,false],[4.3333,548.0,0.0,0.0,98.0,33.33,false,false]]},{"name":"Orange","col":"#F08A24","pts":[[2.1212,2.1212],[63.6364,27.5758],[35.0,35.0],[27.5758,63.6364]],"inAt":1.6333,"kx":[[1.6333,373.68,4484.23,4484.23,33.33,33.33,false,false],[1.6667,499.92,1554.3152,1554.3152,33.33,15.0,false,false],[2.7667,759.6445,565.7789,565.7789,23.0,98.0,false,false],[2.8333,1023.426,3818.7081,3818.7081,40.0,33.33,false,false],[2.9,1185.354,237.6595,237.6595,33.33,24.0,false,false],[3.2,1202.1785,2.8718,2.8718,10.0,33.33,false,false],[3.7667,1202.9514,1.3639,1.3639,33.33,51.0,false,false],[3.8,1203.0,8.2776,8.2776,0.1,99.0,false,false],[4.3333,1263.0,675.3709,675.3709,2.1,33.33,false,false]],"ky":[[1.6333,753.0,-1260.7296,-1260.7296,33.33,33.33,false,false],[1.6667,711.0,-530.2894,-530.2894,33.33,26.0,false,false],[1.8,677.82,-238.8465,-238.8465,22.0,33.33,false,false],[1.8333,667.845,-141.3628,-141.3628,33.33,14.0,false,false],[2.1667,648.0,-22.0504,-22.0504,19.0,0.1,false,false],[4.3333,648.0,0.0,0.0,100.0,33.33,false,false]],"ks":[[1.6333,[100.0,100.0],[0.0,0.0],[0.0,0.0],33.33,0.1,false,false],[2.2,[100.0,100.0],[0.0,0.0],[0.0,0.0],50.0,100.0,false,false],[2.2333,[100.0,100.0],[-14.9956,-14.9956],[-14.9956,-14.9956],0.1,61.0,false,false],[2.4,[91.0,91.0],[-39.9972,-39.9972],[-39.9972,-39.9972],55.0,33.33,false,false],[2.4667,[89.0,89.0],[-47.723,-47.723],[-47.723,-47.723],33.33,33.33,false,false],[2.5,[86.0,86.0],[-0.1111,-0.1111],[-0.1111,-0.1111],33.33,0.1,false,false],[2.5667,[86.0,86.0],[0.0207,0.0207],[0.0207,0.0207],0.1,33.33,false,false],[2.6,[87.0645,87.0645],[54.4355,54.4355],[54.4355,54.4355],33.33,41.0,false,false],[2.6667,[91.0,91.0],[41.555,41.555],[41.555,41.555],10.0,33.33,false,false],[2.8,[95.0,95.0],[54.084,54.084],[54.084,54.084],20.0,36.33,false,false],[2.8333,[100.0,100.0],[75.048,75.048],[75.048,75.048],11.0,0.1,false,false],[4.3333,[100.0,100.0],[0.0,0.0],[0.0,0.0],100.0,33.33,false,false]]},{"name":"Pink","col":"#D4148C","pts":[[2.1212,2.1212],[63.6364,27.5758],[35.0,35.0],[27.5758,63.6364]],"inAt":2.8333,"kx":[[2.8333,38.56,4852.6133,4852.6133,33.33,33.33,false,false],[2.9,248.32,441.8276,441.8276,33.33,15.0,false,false],[3.9667,303.3298,33.3333,33.3333,57.0,98.0,false,false],[4.3333,360.0,675.3709,675.3709,3.1,33.33,false,false]],"ky":[[2.8333,847.0,-699.3056,-699.3056,33.33,79.0,false,false],[3.1333,704.18,-221.9717,-221.9717,54.0,0.1,false,false],[3.9,662.0,-7.4003,-7.4003,89.0,0.1,false,false],[4.3333,662.0,0.0,0.0,80.0,33.33,false,false]]}],"markers":[[0.9667,"dark panel creeps in"],[1.5667,"whip"],[2.3,"white panel creeps in"],[2.8333,"whip"],[3.8,"ease off right"]]}}],"end":{"at":538,"dur":2.0667,"out":2.0,"str":"wayfold","size":112,"weight":600,"track":-20.0,"x":960,"base":578.26,"cx":960,"cy":537.76,"glows":[[10,70,"#FFFFFF"],[34,45,"#FFFFFF"],[90,35,"#E6E6E6"]],"halo":"#2D2D2D","haloR":700,"wordS":[[0.0,[251.8269,251.8269],[-778.9892,-778.9892],[-778.9892,-778.9892],33.33,33.33,false,false],[0.0667,[199.9038,199.9038],[-492.7073,-492.7073],[-492.7073,-492.7073],33.33,14.0,false,false],[1.8667,[107.4808,107.4808],[-169.1057,-169.1057],[-169.1057,-169.1057],19.0,1.0,false,false],[1.9667,[80.2348,80.2348],[-298.4863,-298.4863],[-298.4863,-298.4863],95.0,33.33,false,false],[2.0333,[75.2885,75.2885],[0.0,0.0],[0.0,0.0],91.0,33.33,false,false]],"haloS":[[0.0,[194.0,110.8571],[-600.1102,-342.9201],[-600.1102,-342.9201],33.33,33.33,false,false],[0.0667,[154.0,88.0],[-379.5671,-216.8955],[-379.5671,-216.8955],33.33,14.0,false,false],[1.8667,[82.8,47.3143],[-130.2741,-74.4423],[-130.2741,-74.4423],19.0,1.0,false,false],[1.9667,[61.8105,35.3203],[-229.945,-131.3972],[-229.945,-131.3972],95.0,33.33,false,false],[2.0333,[58.0,33.1429],[0.0,0.0],[0.0,0.0],91.0,33.33,false,false]],"op":[[0.0,100.0,0.0,0.0,33.33,0.1,false,false],[1.8667,100.0,0.0,0.0,0.1,100.0,false,false],[1.9,100.0,-510.0,-510.0,0.1,0.1,false,false],[1.9667,32.0,-1020.0,-1020.0,100.0,33.33,false,false],[2.0333,15.0,0.0,0.0,91.0,33.33,false,false]],"blurK":[[0.0,10.0,-80.016,-80.016,33.33,46.0,false,false],[0.1667,0.5778,-16.0,-16.0,69.0,85.0,false,false],[0.2,0.0,-9.998,-9.998,1.1,0.1,false,false],[2.0333,0.0,0.0,0.0,100.0,33.33,false,false]],"markers":[[0,"lands"],[1.0,"settled"],[1.5333,"shrinks away"]]}};

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
