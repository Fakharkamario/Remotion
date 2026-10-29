#!/usr/bin/env python3
"""
build_ae.py - writes ../Wayfold_Rebuild.jsx, the After Effects rebuild of the Wayfold film.

Source of truth: the HyperFrames build. export_from_html.cjs dumps its layout (measured text baselines, boxes,
icons) and the motion profiles from assets/scene.js into layout.json. This script ports each animated channel
of scene.js to Python, fits After Effects keys to it (keys on whole frames, speeds from the source, influences
searched until the AE bezier matches the source at every frame and 8 sub-frames per frame), checks every fit,
and emits the build script = ae_build_lib.jsx + DATA + build_body.jsx.

  node export_from_html.cjs && python3 build_ae.py
"""
import json, math, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
SKILL_LIB = os.environ.get("AE_LIB", "/root/.claude/skills/synced/ae9a2f56-52d7-4ff5-9bed-69e68e21fc5f_d49f9a9a-0e12-47db-b717-bd72ad9ac531/ae-builder/assets/ae_build_lib.jsx")
L = json.load(open(os.path.join(HERE, "layout.json")))
C = L["consts"]; PR = C["P"]; COPY = L["copy"]
FPS = 30; LOOP = C["LOOP"]; END = C["END"]; FRAMES = C["FRAMES"]
TOL = 0.015          # max error per channel, as a fraction of the channel's whole move
REPORT = []          # (channel, keys, max error %)
CHECKS = []          # sampled source channels to compare with the keys the script really writes (verify_dump.py)
DUMPS = {}           # channel name -> "Comp > Layer > property" as the mock dumps it


# ---------------------------------------------------------------- the source's own interpolation (port of keys() in scene.js)
def _slope(p, i): return (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0])
def _tan(p, k):
    n = len(p)
    if n < 2: return 0.0
    if k == 0: return _slope(p, 0)
    if k == n - 1: return _slope(p, n - 2)
    d0, d1 = _slope(p, k - 1), _slope(p, k)
    if d0 * d1 <= 0: return 0.0
    h0, h1 = p[k][0] - p[k - 1][0], p[k + 1][0] - p[k][0]
    w0, w1 = 2 * h1 + h0, h1 + 2 * h0
    return (w0 + w1) / (w0 / d0 + w1 / d1)
def keys(f, p):
    if f <= p[0][0]: return p[0][1]
    for i in range(1, len(p)):
        if f <= p[i][0]:
            x0, y0 = p[i - 1]; x1, y1 = p[i]; h = x1 - x0; t = (f - x0) / h; t2 = t * t; t3 = t2 * t
            return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * _tan(p, i - 1) + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * _tan(p, i)
    return p[-1][1]
def K(name, f): return keys(f, PR[name])
def lerp(a, b, t): return a + (b - a) * t


# ---------------------------------------------------------------- fitting AE keys to a channel
GRID = np.array([0.1, 5, 10, 15, 20, 25, 30, 33.33, 40, 50, 60, 70, 80, 90, 100]) / 100
SS = np.linspace(0, 1, 160)
B0, B1, B2, B3 = (1 - SS) ** 3, 3 * (1 - SS) ** 2 * SS, 3 * (1 - SS) * SS ** 2, SS ** 3

def bez(T, va, vb, so, fo, si, fi, ts):
    """AE temporal bezier between two keys, sampled at times ts (0..T, frames). Speeds are per frame."""
    x = B1 * fo * T + B2 * (T - fi * T) + B3 * T
    y = B0 * va + B1 * (va + so * fo * T) + B2 * (vb - si * fi * T) + B3 * vb
    return np.interp(ts, x, y)

def fit_interval(fn, a, b, sa, sb, sub):
    ts = np.linspace(a, b, int(round((b - a) * sub)) + 1)
    src = np.array([fn(t) for t in ts]); T = b - a
    va, vb = fn(a), fn(b)
    best = (33.33, 33.33, 1e18, None)
    for fo in GRID:
        for fi in GRID:
            e = np.abs(bez(T, va, vb, sa, fo, sb, fi, ts - a) - src)
            m = e.max()
            if m < best[2]: best = (fo * 100, fi * 100, m, ts[e.argmax()])
    fo0, fi0 = best[0] / 100, best[1] / 100
    for fo in np.clip(np.arange(fo0 - 0.05, fo0 + 0.0501, 0.01), 0.001, 1):
        for fi in np.clip(np.arange(fi0 - 0.05, fi0 + 0.0501, 0.01), 0.001, 1):
            e = np.abs(bez(T, va, vb, sa, fo, sb, fi, ts - a) - src)
            m = e.max()
            if m < best[2]: best = (fo * 100, fi * 100, m, ts[e.argmax()])
    return best

def deriv(fn, t, lo, hi, h=1e-3):
    if t - h < lo: return (fn(t + h) - fn(t)) / h
    if t + h > hi: return (fn(t) - fn(t - h)) / h
    return (fn(t + h) - fn(t - h)) / (2 * h)

def fit_channel(name, fn, a, b, steps=(), sub=8, tol=TOL):
    """Keys for frames a..b. steps = frames where the value jumps (the key before holds).
    Returns ('static', v) or a list of [frame, v, speedIn, speedOut, inflIn, inflOut, holdIn, holdOut] (speeds per second)."""
    samples = [fn(t) for t in np.arange(a, b + 1e-9, 1 / sub)]
    rng = max(samples) - min(samples)
    if rng < 1e-6:
        return ("static", samples[0])
    bounds = [a] + sorted(s for s in steps if a < s <= b) + [b + 1]
    out, worst = [], 0.0
    for si in range(len(bounds) - 1):
        s0, s1 = bounds[si], bounds[si + 1] - 1
        last_seg = si == len(bounds) - 2
        if s1 <= s0:
            out.append([s0, fn(s0), 0.0, 0.0, 33.33, 33.33, si > 0, not last_seg]); continue
        # knots: segment ends + every frame where the motion starts, stops or turns
        fr = np.arange(s0, s1 + 1)
        d = np.array([deriv(fn, t, s0, s1) for t in fr])
        eps = 1e-4 * rng
        sg = np.where(d > eps, 1, np.where(d < -eps, -1, 0))
        knots = {s0, s1}
        for i in range(1, len(fr)):
            if sg[i] != sg[i - 1]:
                knots.add(int(fr[i - 1]) if sg[i] == 0 else int(fr[i]) if sg[i - 1] == 0 else int(fr[i]))
                if sg[i - 1] == 0 and i - 1 > 0: knots.add(int(fr[i - 1]))
        knots = sorted(knots)
        while True:
            fits = []
            for ka, kb in zip(knots[:-1], knots[1:]):
                fits.append(fit_interval(fn, ka, kb, deriv(fn, ka, s0, s1), deriv(fn, kb, s0, s1), sub))
            errs = [f[2] for f in fits]; wi = int(np.argmax(errs))
            if errs[wi] <= tol * rng: break
            ka, kb = knots[wi], knots[wi + 1]
            cand = int(round(fits[wi][3]))
            if cand <= ka or cand >= kb: cand = (ka + kb) // 2
            if cand <= ka or cand >= kb: break
            knots = sorted(knots + [cand])
        worst = max(worst, max(errs) / rng)
        for i, kf in enumerate(knots):
            sp = deriv(fn, kf, s0, s1) * FPS
            out.append([kf, fn(kf), sp, sp, fits[i - 1][1] if i > 0 else 33.33, fits[i][0] if i < len(fits) else 33.33,
                        si > 0 and i == 0, (not last_seg) and i == len(knots) - 1])
    REPORT.append((name, len(out), worst * 100))
    return out


# ---------------------------------------------------------------- emit keys in comp time, mapped to AE values
def emit(name, fn, a, b, start, steps=(), mapv=None, maps=None, static_ok=True):
    """mapv: value -> AE value (e.g. v -> [v, v] for Scale). maps: speed -> AE speed per dimension."""
    r = fit_channel(name, fn, a, b, steps)
    mapv = mapv or (lambda v: v); maps = maps or (lambda s: s)
    key = dump_key(name)
    if key and not isinstance(r, tuple):
        holds = [(k[0], r[i + 1][0]) for i, k in enumerate(r[:-1]) if k[7]]
        sm = []
        for lf in np.arange(a, b + 1e-9, 1 / 8):
            if any(h0 <= lf < h1 for h0, h1 in holds): continue
            v = mapv(fn(lf)); sm.append([round((lf - start) / FPS, 5), round(float(v[0] if isinstance(v, list) else v), 4)])
        CHECKS.append({"channel": name, "key": key, "samples": sm})
    if isinstance(r, tuple):
        return [[rnd((a - start) / FPS), rnd(mapv(r[1])), rnd(maps(0.0)), rnd(maps(0.0)), 33.33, 33.33, False, False]]
    return [[rnd((k[0] - start) / FPS), rnd(mapv(k[1])), rnd(maps(k[2])), rnd(maps(k[3])), round(k[4], 2), round(k[5], 2), bool(k[6]), bool(k[7])] for k in r]

def dump_key(name):
    """Mock dump name for the channels checked against the written keys (sliders share the name '1', so they are checked generator-side only)."""
    m = re.match(r"(S\d)([AB])? ?(.*)", name)
    if not m: return None
    sc, ps, rest = m.group(1), m.group(2) or "", m.group(3)
    nm = {"A": "Lisbon", "B": "Alps"}.get(ps, "")
    comp = {"S1": "S1%s_Collage_%s", "S2": "S2%s_Phone_%s", "S3": "S3%s_Prompt_%s", "S4": "S4%s_UXAudit_%s"}.get(sc)
    comp = comp % (ps, nm) if comp else "S9_EndCard"
    prop = lambda ch: {"x": "ADBE Position_0", "y": "ADBE Position_1", "scale": "ADBE Scale", "width": "ADBE Vector Rect Size"}[ch]
    mm = re.match(r"(Postcard_\d|Tile_\d) (x|y|scale)$", rest)
    if mm: return None if sc == "S1" and False else "%s > %s > %s" % (comp, find_layer(sc, ps, mm.group(1)), prop(mm.group(2)))
    mm = re.match(r"cursor (\w+) (x|y|scale)$", rest)
    if mm: return "%s > CURSOR_%s > %s" % (comp, mm.group(1), prop(mm.group(2)))
    mm = re.match(r"note (\w+) (x|y|width)$", rest)
    if mm: return "%s > NOTE_%s > %s" % (comp, mm.group(1), prop(mm.group(2)))
    simple = {"cam scale": ("CAM_Collage" if sc == "S1" else "CAM_Prompt", "ADBE Scale"), "cam x": ("CAM_Prompt", "ADBE Position_0"), "cam y": ("CAM_Prompt", "ADBE Position_1"),
              "phone scale": ("GRP_Phone", "ADBE Scale"), "phone y": ("GRP_Phone", "ADBE Position_1"), "send press": ("GRP_Send", "ADBE Scale"),
              "cursor x": ("CURSOR_Click", "ADBE Position_0"), "cursor y": ("CURSOR_Click", "ADBE Position_1"), "cursor scale": ("CURSOR_Click", "ADBE Scale"),
              "listing x": ("Listing", "ADBE Position_0"), "listing y": ("Listing", "ADBE Position_1"), "checkout x": ("Checkout", "ADBE Position_0"),
              "white x": ("WhitePanel", "ADBE Position_0"), "word scale": ("Wordmark", "ADBE Scale"), "halo scale": ("Halo", "ADBE Scale"), "fade": ("Wordmark", "ADBE Opacity")}
    if rest in simple: return "%s > %s > %s" % (comp, simple[rest][0], simple[rest][1])
    return None

LAYER_NAMES = {}
def find_layer(sc, ps, base):
    return LAYER_NAMES.get((sc, ps, base), base)

def rnd(v):
    if isinstance(v, (list, tuple)): return [rnd(x) for x in v]
    return round(float(v), 4)

SC = lambda v: [v, v]                     # uniform Scale
SCS = lambda s: [s, s]

def hexc(css):
    m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", css)
    return "#%02X%02X%02X" % tuple(int(x) for x in m.groups()) if m else css


# ---------------------------------------------------------------- measured layout -> AE items
def text_item(name, ln, dx=0, dy=0, color=None, op=None, just="left", x=None):
    s = ln["text"].upper() if ln.get("transform") == "uppercase" else ln["text"]
    it = {"k": "text", "name": name, "str": s, "weight": ln["weight"], "size": ln["size"], "color": color or hexc(ln["color"]),
          "track": round(ln["ls"] * 1000, 2), "x": rnd(ln["x"] + dx if x is None else x), "y": rnd(ln["base"] + dy), "just": just, "blur": True}
    if op is not None: it["op"] = op
    return it
def icon_item(name, file, b, dx=0, dy=0):
    return {"k": "icon", "name": name, "file": file, "x": rnd(b["x"] + dx), "y": rnd(b["y"] + dy), "w": rnd(b["w"]), "h": rnd(b["h"]), "blur": True}
def box_item(name, b, dx=0, dy=0, fill=None, r=0, stroke=None, sw=0, fop=None, op=None):
    it = {"k": "box", "name": name, "x": rnd(b["x"] + dx), "y": rnd(b["y"] + dy), "w": rnd(b["w"]), "h": rnd(b["h"]), "r": r, "blur": True}
    if fill: it["fill"] = fill
    if fop is not None: it["fop"] = fop
    if sw: it["stroke"] = stroke; it["sw"] = sw
    if op is not None: it["op"] = op
    return it
def art_item(name, file, b, dx=0, dy=0):
    return {"k": "art", "name": name, "file": file, "x": rnd(b["x"] + dx), "y": rnd(b["y"] + dy), "w": rnd(b["w"]), "h": rnd(b["h"])}
def css_rgba(css):
    m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)", css)
    if not m: return None, 0
    a = float(m.group(4)) if m.group(4) else 1.0
    return "#%02X%02X%02X" % tuple(int(m.group(i)) for i in (1, 2, 3)), a


# ---------------------------------------------------------------- scenes
def collage(si):
    start = si * LOOP
    tiles = []
    for i, (x, y, w, h, a) in enumerate(C["CT"]):
        cx, cy, base = x + w / 2, y + h / 2, max(w, h) / 1000
        def step(lf): return 0 if lf < 2 else 1 if lf < 4 else 2 if lf < 5 else 3
        def tr(lf, i=i, cx=cx, cy=cy):
            st = step(lf)
            if st < 3:
                S = C["STEPS"][st]; dx = S["dx"] + C["JIT"][i][0] * S["j"]; dy = S["dy"] + C["JIT"][i][1] * S["j"]; s = S["s"]
            else: dx = dy = 0; s = 1
            return dx, dy, s
        pop = lambda lf, a=a: keys(lf - a, [[0, 0.88], [1, 1.03], [2, 1]])
        steps = [s for s in (2, 4, 5) if s > a]
        nm = "S1%s Postcard_%d" % ("AB"[si], i + 1)
        LAYER_NAMES[("S1", "AB"[si], "Postcard_%d" % (i + 1))] = "Postcard_%d_%s" % (i + 1, COPY[si]["collage"][i])
        tiles.append({"file": COPY[si]["collage"][i], "x": x, "y": y, "w": w, "h": h, "inAt": rnd(a / FPS),
            "kx": emit(nm + " x", lambda lf, cx=cx, tr=tr: cx + (cx - 960) * (tr(lf)[2] - 1) + tr(lf)[0], a, 16, 0, steps),
            "ky": emit(nm + " y", lambda lf, cy=cy, tr=tr: cy + (cy - 540) * (tr(lf)[2] - 1) + tr(lf)[1], a, 16, 0, steps),
            "ks": emit(nm + " scale", lambda lf, tr=tr, pop=pop, base=base: 100 * base * tr(lf)[2] * pop(lf), a, 16, 0, steps, SC, SCS)})
    cam = emit("S1%s cam scale" % "AB"[si], lambda lf: 100 if lf < 5 else 100 * keys(lf, [[5, 1], [16, 1.022]]), 0, 16, 0, (), SC, SCS)
    return {"at": start, "dur": rnd(17 / FPS), "tiles": tiles, "cam": cam,
            "markers": [[0, "pairs pop on (0, 2, 4)"], [5 / FPS, "jump to places, slow push-in"]]}

def phone(si):
    start, s0 = si * LOOP + 17, 17
    P = L["sets"][si]["phone"]; ox, oy = 760, 147
    PA, PL0 = C["PA"], C["PL"][0]
    def box(i, lf):
        if lf < 24: return PA[i]
        if lf < 30:
            t = 0.5 * keys(lf, [[24, 0.55], [25, 0.75], [27, 0.9], [29, 1]]); return [lerp(PA[i][k], PL0[i][k], t) for k in range(4)]
        return PL0[i]
    settle = lambda lf: keys(lf, [[30, 1.035], [32, 1.012], [34, 1.004], [37, 1]]) if lf >= 30 else 1
    out = lambda lf: K("GRID_OUT", lf)
    tiles = []
    for i in range(9):
        def cxf(lf, i=i):
            b = box(i, lf); return ox + 200 + (b[0] + b[2] / 2 - 200) * settle(lf)
        def cyf(lf, i=i):
            b = box(i, lf); return oy + 393 + out(lf) + (b[1] + b[3] / 2 - 393) * settle(lf)
        def scf(lf, i=i):
            b = box(i, lf); return 100 * max(b[2], b[3]) / 1000 * settle(lf)
        nm = "S2%s Tile_%d" % ("AB"[si], i + 1)
        LAYER_NAMES[("S2", "AB"[si], "Tile_%d" % (i + 1))] = "Tile_%d_%s" % (i + 1, COPY[si]["phone"][i])
        mk = []
        for lf in [17] + list(range(24, 31)):
            b = box(i, lf); base = max(b[2], b[3]) / 1000
            tin = "linear" if 25 <= lf <= 29 else "hold"; tout = "linear" if 24 <= lf <= 28 else "hold"
            mk.append([rnd((lf - s0) / FPS), rnd(b[2] / base), rnd(b[3] / base), tin, tout])
        b0 = box(i, 17)
        tiles.append({"file": COPY[si]["phone"][i], "x": ox + b0[0], "y": oy + b0[1], "w": b0[2], "h": b0[3], "mask": mk,
            "kx": emit(nm + " x", cxf, 17, 62, s0, (24, 30)), "ky": emit(nm + " y", cyf, 17, 62, s0, (24, 30)),
            "ks": emit(nm + " scale", scf, 17, 62, s0, (24, 30), SC, SCS)})
    header = []
    names = ["Back", "Bell", "Gear"]
    for j, b in enumerate(P["top"]["icons"]): header.append(icon_item("Phone_" + names[j] + "_Icon", ["back", "bell", "gear"][j], b, ox, oy))
    for j, ln in enumerate(P["top"]["lines"]): header.append(text_item("Phone_App_Name", ln, ox, oy))
    for j, ln in enumerate(P["title"]): header.append(text_item("Phone_Title_%d" % (j + 1), ln, ox, oy))
    bar = []
    bb = P["bar"]["boxes"]
    bar.append(box_item("Bar_Button_Plus", bb[0], ox, oy, "#F1F1F1", 12)); bar.append(box_item("Bar_Button_Search", bb[1], ox, oy, "#F1F1F1", 12))
    bar.append(box_item("Bar_CTA", bb[2], ox, oy, "#F1F1F1", 12))
    for j, b in enumerate(P["bar"]["icons"]): bar.append(icon_item("Bar_" + ["Plus", "Search", "Bag", "Arrow"][j] + "_Icon", ["plus_22", "search", "bag", "arrow"][j], b, ox, oy))
    for ln in P["bar"]["lines"]: bar.append(text_item("Bar_CTA_Text", ln, ox, oy))
    return {"at": start, "dur": rnd(46 / FPS), "tiles": tiles, "header": header, "bar": bar, "cardIn": rnd(2 / FPS),
            "card": {"k": "box", "name": "Phone_Card", "x": ox, "y": oy, "w": 400, "h": 786, "r": 26, "fill": "#FFFFFF"},
            "matte": {"k": "box", "name": "MATTE_PhoneScreen", "x": ox, "y": oy, "w": 400, "h": 786, "r": 26, "fill": "#FFFFFF"},
            "matteSize": [[0, [4000, 4000]], [rnd(2 / FPS), [400, 786]]],
            "shadow": {"col": "#785A32", "op": 14, "dist": 18, "soft": 50},
            "grpS": emit("S2%s phone scale" % "AB"[si], lambda lf: 100 * K("PHONE_S", lf), 17, 62, s0, (), SC, SCS),
            "grpY": emit("S2%s phone y" % "AB"[si], lambda lf: 540 + K("PHONE_Y", lf), 17, 62, s0),
            "markers": [[rnd(2 / FPS), "card on"], [rnd(7 / FPS), "re-flow"], [rnd(13 / FPS), "grid set"], [rnd(37 / FPS), "scroll out"]]}

def prompt(si):
    start, s0 = si * LOOP + 63, 63
    P = L["sets"][si]["prompt"]; SEND = C["SEND"]
    BL = lambda lf: 876 + 48 * K("ZOOM_IN", lf); BT = lambda lf: 460 + K("ZOOM_OUT", lf)
    camx = lambda lf: K("CARD_X", lf) if lf < 98 else BL(lf) - 1.6 * (SEND[0] - 56)
    camy = lambda lf: K("CARD_Y", lf) if lf < 98 else BT(lf) - 1.6 * (SEND[1] - 54)
    cs = lambda lf: K("CUR_PRESS", lf); press = lambda lf: (1 - cs(lf)) / (1 - 0.813)
    items = [icon_item("Ideas_Icon", "bulb", P["ideas"]["icon"])] + [text_item("Ideas_Text", ln) for ln in P["ideas"]["lines"]]
    for j, ch in enumerate(P["chips"]):
        items.append(box_item("Chip_%d_BG" % (j + 1), ch["box"], 0, 0, "#EFE9E1", 51))
        items.append(icon_item("Chip_%d_Icon" % (j + 1), ["doc", "sheet"][j], ch["icon"]))
        for ln in ch["lines"]: items.append(text_item("Chip_%d_Text" % (j + 1), ln))
    items.append(icon_item("Chip_More_Icon", "chev", P["chev"]))
    items.append(box_item("Prompt_Card", P["card"], 0, 0, "#FFFFFF", 22))
    items.append(text_item("PromptText", P["text"][0]))
    items.append(icon_item("Plus_Icon", "plus_36", P["plus"]))
    items.append(icon_item("Wayfold_Mark", "mark", P["mark"]["icon"]))
    for ln in P["mark"]["lines"]: items.append(text_item("Wayfold_Label", ln))
    for ln in P["action"]: items.append(text_item("Action_Label", ln))
    items.append(icon_item("Mic_Icon", "mic", P["mic"]))
    t = P["text"][0]; car = P["caret"]; ch2 = P["chips"][1]["box"]
    cursor_pts = [[66, 4], [108, 128], [64, 104], [12, 124]]
    return {"at": start, "dur": rnd(75 / FPS), "bg": "#FBF1E6", "items": items, "textName": "PromptText",
            "fade": {"x": ch2["x"], "y": ch2["y"], "w": ch2["w"], "h": ch2["h"], "completion": 13, "feather": rnd(0.18 * ch2["w"])},
            "fadeTargets": ["Chip_2_BG", "Chip_2_Icon", "Chip_2_Text"],
            "caretGap": rnd(car["x"] - (t["x"] + t["w"])), "caretLift": rnd(t["base"] - car["y"]),
            "caret": {"k": "box", "name": "Caret", "x": car["x"], "y": car["y"], "w": car["w"], "h": car["h"], "fill": "#1A1A1A"},
            "caretOp": [[0, 100]] + [[rnd((lf - s0) / FPS), 0 if ((lf - 98) // 8) % 2 else 100] for lf in range(106, 138, 8)],
            "sendC": [rnd(SEND[0]), rnd(SEND[1])], "cold": "#0B0B0B", "hot": "#E28C04",
            "sendBox": {"k": "box", "name": "Send_Button", "x": P["send"]["x"], "y": P["send"]["y"], "w": P["send"]["w"], "h": P["send"]["h"], "r": 12, "fill": "#0B0B0B"},
            "up": icon_item("Send_Arrow", "up", P["up"]),
            "cursor": {"pts": cursor_pts}, "curIn": rnd((98 - s0) / FPS),
            "camX": emit("S3%s cam x" % "AB"[si], camx, 63, 137, s0, (98,)), "camY": emit("S3%s cam y" % "AB"[si], camy, 63, 137, s0, (98,)),
            "camS": emit("S3%s cam scale" % "AB"[si], lambda lf: 100 if lf < 98 else 160, 63, 137, s0, (98,), SC, SCS),
            "typed": emit("S3%s typed pct" % "AB"[si], lambda lf: 100 * K("TYPE", lf), 63, 137, s0),
            "heat": emit("S3%s heat pct" % "AB"[si], lambda lf: 100 * K("BTN_HEAT", lf), 63, 137, s0),
            "press": emit("S3%s send press" % "AB"[si], lambda lf: 100 * K("BTN_PRESS", lf), 63, 137, s0, (), SC, SCS),
            "curX": emit("S3%s cursor x" % "AB"[si], lambda lf: BL(lf) - 40 - 330 * K("CUR_IN", lf) + 39 * press(lf), 98, 137, s0),
            "curY": emit("S3%s cursor y" % "AB"[si], lambda lf: BT(lf) + 126 + 232 * K("CUR_IN", lf) - 33 * press(lf), 98, 137, s0),
            "curS": emit("S3%s cursor scale" % "AB"[si], lambda lf: 100 * cs(lf), 98, 137, s0, (), SC, SCS),
            "markers": [[rnd(35 / FPS), "CUT close-up"], [rnd(40 / FPS), "button heats"], [rnd(57 / FPS), "press"]]}

def audit(si):
    start, s0 = si * LOOP + 138, 138
    A = L["sets"][si]["audit"]
    p1 = lambda lf: K("PUSH1", lf); p2 = lambda lf: K("PUSH2", lf); ex = lambda lf: K("EXIT", lf)
    dL = lambda lf: -960 * (1 - p1(lf)) + 640 * p2(lf) + ex(lf)
    dR = lambda lf: 960 * p1(lf) + 320 * p2(lf) + ex(lf)
    wR = lambda lf: 640 * p2(lf) + ex(lf)
    gx = lambda lf: 562 * p1(lf) + 123 * p2(lf) + ex(lf)
    gy = lambda lf: -140 * K("LIST_IN", lf) + K("LIST_DRIFT", lf)
    rel = lambda lf: 384 - 121 * p2(lf)
    T = lambda lf: dL(lf) + rel(lf)
    pills = A["pills"]
    # ---- listing precomp
    LO = {"ox": 300, "oy": 200, "w": 2400, "h": 1500}
    items, select = [], {"names": [], "keys": []}
    on = rnd((160 - s0) / FPS)
    col_i = 0
    for e in A["grid"]:
        b = e["box"]; cls = e["cls"]; dx, dy = LO["ox"], LO["oy"]
        if cls == "pimg":
            col_i += 1
            items.append(box_item("Image_BG_%d" % col_i, b, dx, dy, "#ECECEC"))
            items.append(art_item("Image_%d" % col_i, COPY[si]["imgsTop" if col_i in (1, 3) else "imgsLow"][0 if col_i <= 2 else 1], b, dx, dy))
        elif cls == "plus":
            items.append(box_item("Add_Button_%d" % col_i, b, dx, dy, "#FFFFFF")); items.append(icon_item("Add_Icon_%d" % col_i, "plus_30", e["icons"][0], dx, dy))
        elif cls == "pname":
            items.append(text_item("Stay_Name_%d" % col_i, e["lines"][0], dx, dy))
        elif cls == "pprice":
            ln = e["lines"][0]; col = "B" if b["x"] > 400 else "A"
            if col == "B":
                items.append(box_item("Price_Select_BG", b, dx, dy, "#1F6FE5", 0, fop=13, op=0))
                items.append(text_item("Price_" + col, ln, dx, dy, "#8A8A8A"))
                items.append(text_item("Price_" + col + "_Selected", ln, dx, dy, "#1F6FE5", op=0))
                select["names"] += ["Price_Select_BG", "Price_" + col, "Price_" + col + "_Selected"]
                select["keys"] += [[[0, 0], [on, 100]], [[0, 100], [on, 0]], [[0, 0], [on, 100]]]
            else: items.append(text_item("Price_" + col, ln, dx, dy))
        elif cls == "psizes":
            for k, sp in enumerate(e["spans"]): items.append(text_item("Option_%s_%d" % ("A" if b["x"] < 400 else "B", k + 1), sp[0], dx, dy))
        elif cls == "pbadge":
            items.append(box_item("Badge_BG_%s" % ("A" if b["x"] < 400 else "B"), b, dx, dy, "#FFFFFF"))
            items.append(text_item("Badge_%s" % ("A" if b["x"] < 400 else "B"), e["lines"][0], dx, dy))
    # fix the art order: the HTML draws top image, then (later) the lower image for each column
    # ---- checkout precomp (content origin = left edge of 'Total')
    CO = {"ox": 100, "oy": 100, "w": 1200, "h": 1200}
    citems = []; dx, dy = CO["ox"], CO["oy"]
    for e in A["dark"]:
        b = e["box"]; cls = e["cls"].replace("dk ", "")
        if cls == "dk-in": citems.append(box_item("Promo_Field", b, dx, dy, None, 22, "#3A3A3A", 2))
        elif cls == "dk-back":
            citems.append(box_item("Back_Button", b, dx, dy, None, 22, "#3D3D3D", 2)); citems.append(icon_item("Back_Icon", "card", e["icons"][0], dx, dy))
            citems.append(text_item("Back_Text", e["lines"][0], dx, dy))
        elif cls == "dk-cta": citems.append(box_item("Pay_Button", b, dx, dy, None, 26, "#3D3D3D", 2))
        elif cls == "dk-tax":
            hb = {"k": "box", "name": "Tax_Highlight", "x": rnd(b["x"] + dx), "y": rnd(b["y"] + dy), "w": rnd(b["w"]), "h": rnd(b["h"]), "fill": "#F08A24", "fop": 28}
            citems.append(hb)
            citems.append(text_item("Tax_Line", e["lines"][0], dx, dy, "#6C6C6C"))
            citems.append(text_item("Tax_Line_Hot", e["lines"][0], dx, dy, "#D9813A", op=0))
        elif cls == "dk-row":
            nm = "Subtotal" if b["y"] < 380 else "Fee"
            citems.append(text_item(nm, e["lines"][0], dx, dy))
            if e["icons"]: citems.append(icon_item(nm + "_Help_Icon", "help", e["icons"][0], dx, dy))
        else:
            nm = {"dk-ph": "Promo_Placeholder", "dk-total": "Total", "dk-help": "Help"}[cls]
            citems.append(text_item(nm, e["lines"][0], dx, dy))
    hl = lambda lf: keys(lf, [[205, 0], [213, 1]])
    # ---- white panel precomp
    witems = []
    for j, e in enumerate(A["white"]):
        b = e["box"]; bg, a = css_rgba(e["bg"])
        if e["lines"]:
            for k, ln in enumerate(e["lines"]):
                just = "center" if ln["align"] == "center" else "left"
                witems.append(text_item("Panel_Text_%d_%d" % (j + 1, k + 1), ln, 0, 0, None, None, just, x=(b["x"] + b["w"] / 2) if just == "center" else None))
        elif a > 0: witems.append(box_item("Panel_Box_%d" % (j + 1), b, 0, 0, bg))
    # ---- notes + cursors
    bx = lambda lf: 995 + gx(lf) + 190 * K("B_IN", lf) + K("B_HOVER_X", lf)
    by = lambda lf: 575 + gy(lf) + 45 * K("B_IN", lf) + K("B_HOVER_Y", lf)
    ox_ = lambda lf: T(lf) + 300 - 222 * K("O_IN", lf)
    oy_ = lambda lf: 648 + 105 * K("O_IN", lf)
    sq = lambda lf: K("O_SQ", lf)
    ow = lambda lf: pills[1]["w"] * K("O_W", lf) * (0.85 + 0.15 * sq(lf))
    kx = lambda lf: wR(lf) - 640 + 300 - 40 * K("P_IN", lf)
    ky = lambda lf: 662 + 185 * K("P_IN", lf)
    W2 = lambda h: (lambda v: [v, h]); S2 = lambda s: [s, 0]
    tag = "S4" + "AB"[si]
    def note(name, pi, side, inAt, fx, fy, fw, col):
        pl = pills[pi]; bd = int(float(pl["border"].replace("px", "")))
        return {"name": name, "side": side, "str": pl["text"]["text"], "size": pl["text"]["size"], "weight": pl["text"]["weight"], "h": pl["h"],
                "r": pl["radius"], "col": col, "border": bd, "tx": rnd(pl["text"]["x"]), "base": rnd(pl["text"]["base"]),
                "inAt": rnd((inAt - s0) / FPS), "textOp": [[rnd((inAt - s0) / FPS), 100]],
                "kx": emit(tag + " note " + name + " x", fx, inAt, 268, s0), "ky": emit(tag + " note " + name + " y", fy, inAt, 268, s0),
                "kw": emit(tag + " note " + name + " width", lambda lf: fw(lf) - bd, inAt, 268, s0, (), W2(pl["h"] - bd), S2)}
    CUR = [[2 * 70 / 66, 2 * 70 / 66], [60 * 70 / 66, 26 * 70 / 66], [33 * 70 / 66, 33 * 70 / 66], [26 * 70 / 66, 60 * 70 / 66]]
    notes = [note("Blue", 0, "left", 138, lambda lf: bx(lf) + 64, lambda lf: by(lf) + 56, lambda lf: pills[0]["w"] * K("B_W", lf), "#1F6FE5"),
             note("Orange", 1, "right", 187, lambda lf: ox_(lf) + 12, lambda lf: oy_(lf) + 70 + (1 - sq(lf)) * 18, ow, "#F08A24"),
             note("Pink", 2, "left", 223, lambda lf: kx(lf) + 45, lambda lf: ky(lf) + 60, lambda lf: pills[2]["w"] * K("P_W", lf), "#D4148C")]
    cursors = [{"name": "Blue", "col": "#1F6FE5", "pts": rnd(CUR), "inAt": 0, "kx": emit(tag + " cursor Blue x", bx, 138, 268, s0), "ky": emit(tag + " cursor Blue y", by, 138, 268, s0)},
               {"name": "Orange", "col": "#F08A24", "pts": rnd(CUR), "inAt": rnd((187 - s0) / FPS), "kx": emit(tag + " cursor Orange x", ox_, 187, 268, s0),
                "ky": emit(tag + " cursor Orange y", oy_, 187, 268, s0), "ks": emit(tag + " cursor Orange scale", lambda lf: 100 * sq(lf), 187, 268, s0, (), SC, SCS)},
               {"name": "Pink", "col": "#D4148C", "pts": rnd(CUR), "inAt": rnd((223 - s0) / FPS), "kx": emit(tag + " cursor Pink x", kx, 223, 268, s0), "ky": emit(tag + " cursor Pink y", ky, 223, 268, s0)}]
    CO.update({"items": citems, "hlName": "Tax_Highlight", "hotName": "Tax_Line_Hot",
               "hlKeys": emit(tag + " tax highlight", lambda lf: 100 * hl(lf), 138, 268, s0, (), lambda v: [v, 100], lambda s: [s, 0]),
               "hotKeys": emit(tag + " tax hot", lambda lf: 100 * hl(lf), 138, 268, s0)})
    LO.update({"items": items, "select": select})
    return {"at": start, "dur": rnd(131 / FPS), "darkCol": "#1B1B1B", "listing": LO, "checkout": CO, "white": {"w": 1000, "h": 1080, "items": witems},
            "dL": emit(tag + " dark left", dL, 138, 268, s0), "dR": emit(tag + " dark right", dR, 138, 268, s0), "wR": emit(tag + " white right", wR, 138, 268, s0),
            "gx": emit(tag + " listing x", gx, 138, 268, s0), "gy": emit(tag + " listing y", gy, 138, 268, s0),
            "cx": emit(tag + " checkout x", T, 138, 268, s0), "wx": emit(tag + " white x", lambda lf: wR(lf) - 640, 138, 268, s0),
            "notes": notes, "cursors": cursors,
            "markers": [[rnd((167 - s0) / FPS), "dark panel creeps in"], [rnd((185 - s0) / FPS), "whip"], [rnd((207 - s0) / FPS), "white panel creeps in"],
                        [rnd((223 - s0) / FPS), "whip"], [rnd((252 - s0) / FPS), "ease off right"]]}

def endcard():
    s0 = END; Wd = L["word"]; fit = 540 / Wd["w"]
    cy = 540 + (0.5 - 0.52) * Wd["h"]; base_off = Wd["line"]["base"] - 540 - Wd["h"] / 2
    LOGO = PR["LOGO"]
    return {"at": END, "dur": rnd((FRAMES - END) / FPS), "out": rnd((598 - s0) / FPS), "str": "wayfold", "size": Wd["line"]["size"], "weight": Wd["line"]["weight"],
            "track": round(Wd["line"]["ls"] * 1000, 2), "x": 960, "base": rnd(cy + base_off), "cx": 960, "cy": rnd(cy),
            "glows": [[10, 70, "#FFFFFF"], [34, 45, "#FFFFFF"], [90, 35, "#E6E6E6"]], "halo": "#2D2D2D", "haloR": 700,
            "wordS": emit("S9 word scale", lambda f: 100 * fit * keys(f, LOGO), END, FRAMES - 1, s0, (), SC, SCS),
            "haloS": emit("S9 halo scale", lambda f: 100 * keys(f, LOGO), END, FRAMES - 1, s0, (), lambda v: [v, v * 800 / 1400], lambda s: [s, s * 800 / 1400]),
            "op": emit("S9 fade", lambda f: 100 * keys(f, [[595, 1], [597.5, 0.15]]), END, FRAMES - 1, s0),
            "blurK": emit("S9 land blur", lambda f: keys(f, [[538, 10], [541, 2], [544, 0]]), END, FRAMES - 1, s0),
            "markers": [[0, "lands"], [rnd((568 - s0) / FPS), "settled"], [rnd((584 - s0) / FPS), "shrinks away"]]}


# ---------------------------------------------------------------- build
def main():
    passes = []
    for si, (tag, nm) in enumerate([("A", "Lisbon"), ("B", "Alps")]):
        D = {"tag": tag, "name": nm, "collage": collage(si), "phone": phone(si), "prompt": prompt(si), "audit": audit(si)}
        passes.append(D)
    beats = []
    for si, D in enumerate(passes):
        b = si * LOOP
        for f, t in [(0, "collage"), (17, "phone"), (63, "prompt"), (98, "send close-up"), (120, "press"), (138, "listing"), (185, "checkout whip"), (223, "white panel whip")]:
            beats.append([rnd((b + f) / FPS), D["tag"] + ": " + t])
    beats.append([rnd(END / FPS), "end card"])
    DATA = {"fps": FPS, "w": 1920, "h": 1080, "dur": rnd(FRAMES / FPS), "guide": True, "totalComps": 18, "beats": beats,
            "paper": {"base": "#F8EEDF", "ramp": [[960, 594], "#FCF5EA", [2110, 594], "#F4E8D6"], "rings": 7, "ring0": 140, "gap": 150, "speed": 18,
                      "ringCol": "#785F3C", "ringOp": 6, "count": 30, "life": 7, "spread": 2, "onMin": 65, "onSpread": 30, "drift": 18, "sizeMin": 12,
                      "sizeMax": 24, "orange": 72, "cols": ["#F4A53C", "#F7B84A", "#DCD7CF"]},
            "passes": passes, "end": endcard()}
    lib = open(SKILL_LIB).read()
    body = open(os.path.join(HERE, "build_body.jsx")).read()
    data = "// ---------------------------------------------------------------- DATA (generated by generator/build_ae.py from the HTML build; do not edit by hand)\n" \
           "// Keys: [time (s), value, speed in, speed out, influence in %, influence out %, hold in, hold out], fitted to the film's own curves.\n" \
           "var DATA = " + json.dumps(DATA, separators=(",", ":")) + ";\n\n"
    out = os.path.join(OUT, "Wayfold_Rebuild.jsx")
    open(out, "w").write(lib + "\n" + data + body)
    json.dump(CHECKS, open(os.path.join(HERE, "checks.json"), "w"))
    # fit report
    worst = max(REPORT, key=lambda r: r[2])
    nkeys = sum(r[1] for r in REPORT)
    json.dump([{"channel": r[0], "keys": r[1], "max_err_pct": round(r[2], 3)} for r in REPORT], open(os.path.join(HERE, "fit_report.json"), "w"), indent=1)
    print("channels fitted:", len(REPORT), " keys:", nkeys, " worst:", worst[0], "%.2f%%" % worst[2])
    bad = [r for r in REPORT if r[2] > 2]
    for r in bad: print("OVER 2%:", r)
    print("wrote", out, os.path.getsize(out) // 1024, "KB")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
