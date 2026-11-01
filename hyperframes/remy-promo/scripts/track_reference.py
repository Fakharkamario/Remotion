# per-frame similarity transforms of the reference, optionally tracking only features inside a y-band (854x480 space).
# writes motion.js: SEG name -> {a, b, d: [[dx, dy, s] per frame f in (a, b]]} where entry k maps frame a+k-1 -> a+k
import cv2, numpy as np, json, sys
SEGS = [  # name, a, b, ymin, ymax
  ("A1", 36, 132, 0, 480), ("A2", 132, 199, 350, 480), ("B", 201, 297, 0, 210), ("C", 297, 349, 0, 480),
  ("M", 400, 459, 0, 480), ("E", 462, 501, 0, 480), ("F1", 501, 576, 0, 480), ("F2", 576, 650, 385, 480),
  ("G", 651, 719, 300, 480), ("Z", 720, 745, 0, 480), ("H", 746, 846, 0, 480),
  ("A2f", 132, 199, 0, 480), ("Bf", 201, 297, 200, 480), ("F2f", 576, 650, 0, 400), ("Gf", 651, 719, 0, 330)]
cap = cv2.VideoCapture(sys.argv[2] if len(sys.argv) > 2 else "reference.mp4"); fr = []
while True:
    ok, f = cap.read()
    if not ok: break
    fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
out = {}
for name, a, b, y0, y1 in SEGS:
    rows = []
    for f in range(a + 1, b + 1):
        p, g = fr[f - 1], fr[f]
        mask = np.zeros_like(p); mask[y0:y1, :] = 255
        pts = cv2.goodFeaturesToTrack(p, 500, 0.008, 5, mask=mask)
        r = None
        if pts is not None and len(pts) >= 10:
            n, st, _ = cv2.calcOpticalFlowPyrLK(p, g, pts, None, winSize=(25, 25), maxLevel=4)
            A, B = pts[st[:, 0] == 1], n[st[:, 0] == 1]
            if len(A) >= 10:
                M, inl = cv2.estimateAffinePartial2D(A, B, method=cv2.RANSAC, ransacReprojThreshold=1.2)
                if M is not None and inl.sum() >= 10:
                    s = float(np.hypot(M[0, 0], M[1, 0]))
                    cx, cy = 427, 240
                    r = [float(M[0, 0] * cx + M[0, 1] * cy + M[0, 2] - cx), float(M[1, 0] * cx + M[1, 1] * cy + M[1, 2] - cy), s]
                    if abs(np.log(s)) > 0.2 or abs(r[0]) > 80 or abs(r[1]) > 80: r = None
        rows.append(r)
    # fill gaps by interpolation, then light smoothing in (dx, dy, log s)
    arr = np.array([[np.nan] * 3 if r is None else [r[0], r[1], np.log(r[2])] for r in rows])
    bad = np.isnan(arr[:, 0]); print(name, "missing", int(bad.sum()), "of", len(rows))
    idx = np.arange(len(arr))
    for c in range(3):
        if (~bad).sum(): arr[bad, c] = np.interp(idx[bad], idx[~bad], arr[~bad, c])
        else: arr[:, c] = 0
    sm = arr.copy()
    for k in range(1, len(arr) - 1): sm[k] = 0.25 * arr[k - 1] + 0.5 * arr[k] + 0.25 * arr[k + 1]
    out[name] = {"a": a, "b": b, "d": [[round(x, 3), round(y, 3), round(float(np.exp(z)), 5)] for x, y, z in sm]}
open(sys.argv[1], "w").write("// measured per-frame motion of the reference (scripts/track_reference.py)\nwindow.REFMO = " + json.dumps(out, separators=(",", ":")) + ";\n")
