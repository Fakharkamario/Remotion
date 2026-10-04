"""Builds assets/motion.js for the benchlane hire clip.

The card field is an original layout (benchlane names, seeded) seen by a camera that orbits a pivot at
mid-depth: near cards sweep one way and far cards the other, as in the reference. The orbit's yaw and
pitch per frame (ORBIT, 0-based 30 fps frames) come from feature tracks on the reference cut and are
smoothed so every frame moves (no 24 fps holds). The pull-back into the "and … hire" cluster is a zoom-out sized per
frame to the reference's measured card extents (BOX).

    python3 scripts/gen_motion.py
"""
import json
import math
import os
import random

import numpy as np

F = 1400.0  # focal length in px (camera fit)
CX, CY = 960.0, 540.0
N_FRAMES = 75  # frames 0-74 of the clip (calendar scene)

D = 1400.0  # orbit radius: cards at this depth hold still, nearer ones move against farther ones

# frame, yaw (deg), pitch (deg). Fast whip at the start that eases out, a hold, then a slow swing back.
ORBIT = [[0, -28.7, 1.7], [2, -20.9, 1.66], [3, -16.2, 1.66], [4, -12.2, 1.63], [5, -8.8, 1.53], [7, -5.8, 1.38], [8, -2.9, 1.22], [9, -0.06, 1.03],
         [10, 2.54, 0.82], [12, 4.99, 0.57], [13, 7.32, 0.27], [14, 8.85, 0.08], [15, 8.96, 0.11], [17, 8.22, 0.26], [18, 7.37, 0.4], [19, 6.53, 0.53],
         [20, 5.66, 0.64], [22, 4.75, 0.76], [23, 3.85, 0.88], [24, 2.95, 1.02], [25, 1.98, 1.22], [27, 0.99, 1.44], [28, 0.06, 1.72], [29, -0.74, 1.99],
         [30, -1.51, 2.15], [32, -2.35, 2.18], [33, -3.21, 2.2], [34, -3.96, 2.21], [35, -4.59, 2.17], [37, -5.04, 2.09], [38, -5.29, 2.03], [39, -5.5, 2.02],
         [40, -5.78, 2.03], [42, -6.11, 2.13], [43, -6.38, 2.36], [44, -6.55, 2.57]]

# reference card extents during the pull-back: frame, x 1st/99th pct, y 1st/99th pct
BOX = [[45, 118, 1705, 19, 1070], [47, 165, 1659, 28, 1073], [48, 210, 1634, 66, 1065], [49, 263, 1616, 10, 1064], [50, 352, 1603, 20, 1060],
       [52, 419, 1569, 61, 1037], [53, 478, 1527, 104, 991], [54, 528, 1501, 132, 966], [55, 575, 1469, 152, 948], [57, 595, 1458, 168, 932],
       [58, 611, 1435, 183, 918], [59, 619, 1429, 195, 905], [60, 621, 1419, 207, 893], [62, 626, 1405, 218, 881], [63, 631, 1390, 231, 867],
       [64, 641, 1370, 242, 853], [65, 651, 1343, 255, 836], [67, 658, 1320, 265, 824], [68, 669, 1305, 275, 819], [69, 672, 1299, 289, 812],
       [70, 680, 1281, 302, 801], [72, 695, 1251, 317, 781], [73, 718, 1222, 338, 767], [74, 759, 1157, 390, 707]]


CARD_W, CARD_H = 315.0, 110.0  # card size at scale 1 (depth F)
# motion-blur strength (blur px per px/frame of speed) through the scene: the opening whip smears, the steady
# sweep only softens the fastest cards, the cards stay crisp while they gather, then smear again before the cut
BLUR = [(0, 0.09), (11, 0.09), (20, 0.03), (44, 0.03), (48, 0.02), (60, 0.02), (66, 0.05), (74, 0.05)]
N_INNER, N_OUTER = 18, 18  # cards in the sweep; cards waiting just off frame for the pull-back


def rotm(rv_deg):
    v = np.radians(np.array(rv_deg, float))
    th = np.linalg.norm(v)
    if th < 1e-12:
        return np.eye(3)
    k = v / th
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + math.sin(th) * K + (1 - math.cos(th)) * K @ K


def _smooth(v, sigma):
    """Gaussian smoothing with the ends held (edge padded)."""
    r = int(math.ceil(sigma * 3))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    return np.convolve(np.pad(v, r, mode="edge"), k, mode="valid")


_G = np.arange(0, 45)
_ORB = np.array(ORBIT, float)
_YAW = _smooth(np.interp(_G, _ORB[:, 0], _ORB[:, 1]), 0.8)
_PITCH = _smooth(np.interp(_G, _ORB[:, 0], _ORB[:, 2]), 1.5)


def _keyed(g):
    g = min(max(g, 0), 44)
    return [float(np.interp(g, _G, _YAW)), float(np.interp(g, _G, _PITCH))]


# yaw speed (deg/frame) after the opening whip: the orbit keeps turning the same way, slower, then picks up
# into the pull-back (speeds set from the reference's mean optical flow per frame)
LATE_YAW = [[15, 3.5], [19, 3.1], [23, 2.4], [28, 2.6], [33, 4.6], [38, 3.5], [43, 6.6], [46, 4.0], [52, 1.5], [74, 0.5]]


def _lerp(rows, g):
    if g <= rows[0][0]:
        return rows[0][1]
    for (a, va), (b, vb) in zip(rows, rows[1:]):
        if g <= b:
            return va + (vb - va) * (g - a) / (b - a)
    return rows[-1][1]


def orbit_at(g):
    """(yaw, pitch) in degrees for any frame.

    The opening whip follows the measured keys up to frame 14 (scaled up 1.5x: the fit's camera also slid
    sideways, which this pure orbit does without); after that the yaw keeps turning at LATE_YAW speeds.
    """
    yaw0, pitch = _keyed(min(g, 44))
    yaw = 1.5 * yaw0 if g <= 14 else 1.5 * _keyed(14)[0] + sum(_lerp(LATE_YAW, k) for k in range(15, g + 1))
    return yaw, pitch


def cam_at(g):
    """Rotation (world -> camera) and camera position for the orbit round the pivot (0, 0, D)."""
    yaw, pitch = orbit_at(g)
    R = rotm([pitch, 0, 0]) @ rotm([0, yaw, 0])
    C = np.array([0, 0, D]) - R.T @ np.array([0, 0, D])
    return R, C


def project(X, g):
    R, t = cam_at(g)
    P = (R @ (X - t).T).T
    z = P[:, 2]
    return CX + F * P[:, 0] / z, CY + F * P[:, 1] / z, F / z


# ------------------------------------------------------------------ layout
NAMES = ["Iris", "Rosa", "Kai", "Jonah", "June", "Dev", "Sana", "Lena", "Marco", "Theo", "Nina", "Omar", "Priya", "Felix", "Mila",
         "Hugo", "Leo", "Yara", "Nico", "Esme", "Tariq", "Bram", "Cleo", "Ava", "Remy", "Ines", "Otto", "Zara", "Pia", "Ezra"]
VERBS = ["Chat with", "Sync with", "Meet with", "Interview:", "Call with"]


def build_layout(seed, n, n_outer):
    """n cards spread over the frames of the sweep, plus n_outer cards just outside the frame at frame 44.

    The outer cards stay hidden until the pull-back, which draws them in from the edges so the
    "and … hire" cluster packs as densely as the reference's.
    """
    rnd = random.Random(seed)
    cards = []
    placed = []  # (g, x, y, w, h) on screen at birth frame, for spacing
    tries = 0
    while len(cards) < n + n_outer and tries < 40000:
        tries += 1
        outer = len(cards) >= n
        if outer:
            g = 44
            u = rnd.uniform(-1700, 3600)
            v = rnd.uniform(-1100, 2200)
            if -150 < u < 2070 and -100 < v < 1180:  # off frame only
                continue
        else:
            g = rnd.choice([0, 0, 0, 8, 15, 22, 30, 38, 44])
            u = rnd.uniform(-250, 2170)
            v = rnd.uniform(-60, 1140)
        # mostly mid-sized cards (scale 0.5-1.0) with about a third near and large (1.2-2.1), like the reference's spread
        s = rnd.uniform(1.2, 2.1) if rnd.random() < 0.3 else rnd.uniform(0.5, 1.0)
        z = F / s
        w, h = CARD_W * s, CARD_H * s
        # keep cards from stacking exactly on top of each other at their birth frame
        ok = True
        for (pg, px, py, pw, ph) in placed:
            if pg == g and abs(px - u) < (pw + w) * 0.42 and abs(py - v) < (ph + h) * 0.42:
                ok = False
                break
        if not ok:
            continue
        R, t = cam_at(g)
        Pc = np.array([(u - CX) * z / F, (v - CY) * z / F, z])
        X = R.T @ Pc + t
        placed.append((g, u, v, w, h))
        i = len(cards)
        h0 = 9 + rnd.randrange(8)
        m = rnd.choice(["00", "30"])
        cards.append({
            "X": X,
            "outer": outer,
            "t": f"{VERBS[rnd.randrange(len(VERBS))]} {NAMES[i % len(NAMES)]}",
            "tm": f"{h0}:{m} – {h0 + 1}:{m}",
            "c": "p" if rnd.random() < 0.45 else "o",
        })
    return cards


def coverage(xs, ys, ss, sx=1.0):
    """Fraction of the frame covered by cards (quarter-res raster) and the 1st/99th pct extents."""
    m = np.zeros((270, 480), bool)
    for x, y, s in zip(xs, ys, ss):
        w, h = CARD_W * s * sx / 4, CARD_H * s / 4
        x0, x1 = int(max(0, (x / 4) - w / 2)), int(min(480, (x / 4) + w / 2))
        y0, y1 = int(max(0, (y / 4) - h / 2)), int(min(270, (y / 4) + h / 2))
        if x1 > x0 and y1 > y0:
            m[y0:y1, x0:x1] = True
    ys_, xs_ = np.nonzero(m)
    if len(xs_) == 0:
        return 0, None
    return m.mean(), (np.percentile(xs_, 1) * 4, np.percentile(xs_, 99) * 4, np.percentile(ys_, 1) * 4, np.percentile(ys_, 99) * 4)


def main():
    cards = build_layout(1207, N_INNER, N_OUTER)
    X = np.array([c["X"] for c in cards])
    inner = np.array([not c["outer"] for c in cards])
    frames = []
    for g in range(N_FRAMES):
        frames.append(list(project(X, g)))
    # a card the orbit swings behind or right up against the lens is dropped for that frame
    gone = [(f[2] <= 0) | (f[2] > 3.2) for f in frames]

    # pull-back: the field zooms out about its centre at frame 44 into the reference's measured card extents,
    # and the cards settle into one compact blob: each keeps its direction from the centre and its radial order,
    # but the radii are spread evenly over an ellipse, so the cards that were off frame are packed in with the
    # rest and the middle (where "and … hire" sits) fills like the reference's.
    x, y, s = frames[44]
    vis = inner & (s > 0) & (x > -200) & (x < 2120) & (y > -150) & (y < 1230)
    _, (sx0, sx1, sy0, sy1) = coverage(x[vis], y[vis], s[vis])
    W0, H0, scx, scy = sx1 - sx0, sy1 - sy0, (sx0 + sx1) / 2, (sy0 + sy1) / 2
    bx = np.array(BOX, float)
    gg = np.arange(45, N_FRAMES)
    ext = np.stack([_smooth(np.interp(gg, bx[:, 0], bx[:, c]), 1.0) for c in range(1, 5)], 1)
    box = {int(g): ext[i] for i, g in enumerate(gg)}

    x, y, s = frames[52]
    u, v = (x - scx) / (W0 / 2), (y - scy) / (H0 / 2)
    live = ~gone[52]
    order = np.argsort(np.where(live, np.hypot(u, v), np.inf))
    rank = np.empty(len(order))
    rank[order] = np.arange(len(order))
    n_live = int(live.sum())
    r_t = np.sqrt((np.minimum(rank, n_live - 1) + 0.5) / n_live)
    th = np.arctan2(v, u)
    ut, vt = r_t * np.cos(th), r_t * np.sin(th)

    for g in range(45, N_FRAMES):
        rx0, rx1, ry0, ry1 = box[g]
        w = min(1.0, (g - 45) / 10)
        w = w * w * (3 - 2 * w)
        x, y, s = frames[g]
        u, v = (x - scx) / (W0 / 2), (y - scy) / (H0 / 2)
        uu, vv = (1 - w) * u + w * ut, (1 - w) * v + w * vt
        k = math.sqrt((rx1 - rx0) / W0 * (ry1 - ry0) / H0)
        # pulling back shrinks near cards faster than far ones, so the size spread narrows as it goes
        s = np.where(s > 0, np.abs(s) ** (1 - 0.6 * w), s)
        frames[g] = [(rx0 + rx1) / 2 + (rx1 - rx0) / 2 * uu, (ry0 + ry1) / 2 + (ry1 - ry0) / 2 * vv, s * k * (1 + 0.4 * w)]

    # per-card tracks: x, y, scale, blur along x and along y (px), shown
    out = []
    for i, c in enumerate(cards):
        tr = []
        for g in range(N_FRAMES):
            x, y, s = (frames[g][0][i], frames[g][1][i], frames[g][2][i])
            a, b = frames[max(g - 1, 0)], frames[min(g + 1, N_FRAMES - 1)]
            span = min(g + 1, N_FRAMES - 1) - max(g - 1, 0)
            vx = (b[0][i] - a[0][i]) / span
            vy = (b[1][i] - a[1][i]) / span
            w, h = CARD_W * s, CARD_H * s
            on = (g >= 45 or not c["outer"]) and not gone[g][i] and s > 0 and x + w / 2 > -40 and x - w / 2 < 1960 and y + h / 2 > -40 and y - h / 2 < 1120
            # each card smears along its own motion, lightly, so only the fast ones read as blurred; the nearest are a touch soft
            dof = max(0.0, (s - 2.8) * 1.0)
            kb = float(np.interp(g, *zip(*BLUR)))
            bxx = min(8.0, abs(vx) * kb) + dof
            byy = min(5.0, abs(vy) * kb) + dof
            tr.append([round(float(x), 1), round(float(y), 1), round(float(s), 4), round(float(bxx), 2), round(float(byy), 2), 1 if on else 0])
        out.append({"t": c["t"], "tm": c["tm"], "c": c["c"], "z": round(float(F / np.median([f[2][i] for f in frames[:45]])), 1), "tr": tr})

    # report coverage against the reference (16-23 %)
    for g in (0, 8, 20, 32, 44):
        x, y, s = frames[g]
        cv, _ = coverage(x[inner], y[inner], s[inner])
        print(f"frame {g}: coverage {cv:.3f}")

    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, "..", "assets", "motion.js")
    with open(path, "w") as fh:
        fh.write("// Generated by scripts/gen_motion.py: card-field tracks for the calendar scene, one entry per 30 fps frame.\n")
        fh.write("// card: t title, tm time, c colour (p purple / o orange), z depth; tr[frame] = [x, y, scale, blur x px, blur y px, on].\n")
        fh.write("window.MOTION = " + json.dumps({"cards": out}, separators=(",", ":")) + ";\n")
    print("wrote", os.path.normpath(path), len(out), "cards")


if __name__ == "__main__":
    main()
