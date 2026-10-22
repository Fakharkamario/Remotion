# Turn the measured tracks into smoothed key tables for the scene: assets/ref-keys.js
import json, sys
k = json.load(open(sys.argv[1]))
T = lambda n: round((n - (n + 4) // 5) * 1.25, 2)
def segs(rows, gap=4):
    out, cur = [], []
    for r in rows:
        if cur and r[0] - cur[-1][0] > gap: out.append(cur); cur = []
        cur.append(list(r))
    if cur: out.append(cur)
    return out
def smooth(rows, cols, passes=1):
    res = []
    for s in segs(rows):
        for _ in range(passes):
            s = [r if i in (0, len(s) - 1) else [r[0]] + [(0.25 * s[i-1][j] + 0.5 * r[j] + 0.25 * s[i+1][j]) if j in cols else r[j] for j in range(1, len(r))] for i, r in enumerate(s)]
        res += s
    return res
R = lambda rows, nd=1: [[round(v, nd) for v in r] for r in rows]
out = {}
# chat bubbles: [t, x1, x2, cy, h]
for nm in ('b1', 'b2', 'b3'):
    rows = sorted(k[nm])
    rows = smooth(rows, (1, 2, 3)); rows = smooth(rows, (4,), 2)
    out[nm] = R(rows)
# extend b1/b3 off-screen with b2's motion after their last whip key, and lead the pull-back in from off-screen
def extend_after(nm, ref, t0, t1):
    rows = out[nm]; last = [r for r in rows if r[0] <= t0][-1]
    rb = {r[0]: r for r in out[ref]}; base = [r for r in out[ref] if r[0] <= last[0]][-1]
    add = [[r[0], last[1] + r[1] - base[1], last[2] + r[2] - base[2], last[3] + r[3] - base[3], last[4]] for r in out[ref] if last[0] < r[0] <= t1]
    out[nm] = sorted(rows + add)
extend_after('b1', 'b2', 120, 116); extend_after('b3', 'b2', 120, 116)
def lead_in(nm, t_first_after=150, back=4.0):
    rows = out[nm]; i = next(i for i, r in enumerate(rows) if r[0] > t_first_after)
    a, b = rows[i], rows[i + 1]; dt = b[0] - a[0]
    v = [(b[j] - a[j]) / dt for j in range(5)]
    pre = [a[0] - back] + [a[j] - v[j] * back * 1.15 for j in range(1, 5)]
    pre[4] = a[4]
    out[nm] = sorted(rows[:i] + [R([pre])[0]] + rows[i:])
for nm in ('b1', 'b2', 'b3'): lead_in(nm)
# blue: [t, x1, x2, cy, h]
blue = smooth(sorted(k['blue']), (1, 2, 3)); blue = smooth(blue, (4,), 2)
out['blue'] = R(blue)
# badge: [t, cx, cy, w]
out['badge'] = R(smooth(sorted(k['badge']), (1, 2, 3)))
# cursor tip: [t, x, y, w]
out['cur'] = R(smooth([[r[0], r[1] + 4, r[2] + 4, r[3]] for r in sorted(k['cur'])], (1, 2)))
# board: To do column's left edge (read off the tracks; 196–198 hidden under the held message, interpolated)
out['board'] = [[184, 2080], [187.5, 1930], [190, 1790], [192.5, 1604], [195, 1428], [196.25, 1190], [197.5, 950], [198.75, 776], [200, 700], [201.25, 620], [202.5, 556], [203.75, 508], [205, 464], [206.25, 432], [207.5, 408], [208.75, 390], [210, 374], [211.25, 362], [212.5, 352], [213.75, 349], [215, 350], [225, 352], [226.25, 356], [227.5, 360], [228.75, 365], [230, 375], [231.25, 388], [232.5, 404], [233.75, 422], [235, 444], [236.25, 472], [237.5, 504], [238.75, 540], [240, 580], [241.25, 628], [242.5, 680], [243.75, 744], [245, 812], [246.25, 892], [247.5, 984], [248.75, 1088], [250, 1212], [251.25, 1364], [252.5, 1552], [253.75, 1800], [255, 2100]]
# end line: left edge of the word (ref word is 1004 px wide), centre y, fill front (0..1 of the word)
right = {247: 112, 248: 440, 249: 636, 250: 776, 252: 888, 253: 984, 254: 1064, 255: 1132, 257: 1192, 258: 1240, 259: 1280, 260: 1320, 262: 1348, 263: 1376, 264: 1396, 265: 1416, 267: 1432, 268: 1436, 269: 1448, 270: 1456, 272: 1460, 274: 1460, 277: 1466, 280: 1468}
out['endx'] = R(smooth([[T(n), v - 1004] for n, v in sorted(right.items()) if n >= 247], (1,)))
ys = {270: 542, 272: 542, 274: 538, 277: 534, 278: 524, 279: 506, 280: 494, 282: 476, 283: 462, 284: 458, 285: 438, 287: 414, 288: 388, 289: 354, 290: 314, 292: 262}
out['endy'] = R(smooth([[T(n), v] for n, v in sorted(ys.items())], (1,)))
front = {249: 0.12, 252: 0.27, 253: 0.29, 254: 0.31, 255: 0.37, 257: 0.39, 258: 0.42, 259: 0.46, 260: 0.5, 262: 0.52, 263: 0.55, 264: 0.59, 265: 0.63, 267: 0.65, 268: 0.68, 269: 0.72, 270: 0.74, 272: 0.78, 273: 0.8, 274: 0.84, 275: 0.87, 277: 0.9, 278: 0.94, 279: 0.97, 280: 1.0}
out['fill'] = R(smooth([[T(n), v] for n, v in sorted(front.items())], (1,)), 3)
js = "// Measured from the reference edit, one row per real (24 fps) frame, times in 30 fps frames. Generated; see README.\nwindow.REF = " + json.dumps(out, separators=(',', ':')) + ";\n"
open(sys.argv[2], 'w').write(js)
print({kk: len(v) for kk, v in out.items()}, len(js))
