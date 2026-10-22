import json, sys
r = {int(k): v for k, v in json.load(open(sys.argv[1])).items()}
T = lambda n: round((n - (n + 4) // 5) * 1.25, 2)   # true 24 fps sample time, in 30 fps frames
real = [n for n in range(293) if n % 5 != 1]
def chat(n):
    # left-column chat bubbles: white comps, not the top-right glow, not the small badge
    cs = [c for c in r[n]['w'] if not (c[0] >= 1500 and c[3] <= 340) and (c[2]-c[0]) > 200 and (c[3]-c[1]) > 120 and c[3]-c[1] < 600]
    return sorted(cs, key=lambda c: c[1])
out = {}
# b1 0..106, b2 32..196, b3 78..197 with widths for clipped boxes
W = {}
rows = {'b1': [], 'b2': [], 'b3': []}
for n in real:
    cs = chat(n)
    if n <= 31: names = ['b1']
    elif n <= 77: names = ['b1', 'b2']
    else: names = ['b1', 'b2', 'b3']
    if 104 <= n <= 116:
        cs = sorted([c for c in r[n]['w'] if c[0] == 0 and c[2] > 20 and c[3] > 40], key=lambda c: c[3])
        for c in cs:
            x1, y1, x2, y2 = c[:4]
            nm = min(['b1', 'b2', 'b3'], key=lambda q: abs(rows[q][-1][3] - (y2 - 90)) if rows[q] else 1e9)
            hk = 192 if nm == 'b1' else (186 if nm == 'b2' else 180)
            rows[nm].append([T(n), x2 - W[nm], x2, (y2 - hk / 2) if y1 == 0 else (y1 + y2) / 2, hk])
        continue
    if n >= 117 and n <= 151: continue
    if n >= 197: continue
    if n >= 152:
        cs = [c for c in r[n]['w'] if not (c[0] >= 1500 and c[3] <= 340) and c[3]-c[1] > 140 and c[3]-c[1] < 600 and c[2]-c[0] > 20]
        pairs = []
        for c in cs:
            cy = (c[1]+c[3])/2
            nm = 'b1' if cy < 300 else ('b2' if cy < 520 else 'b3')
            pairs.append((nm, c))
        for nm, c in pairs:
            x1, y1, x2, y2 = c[:4]
            if x1 > 0 and x2 < 1920: W[nm] = x2 - x1
            elif x1 <= 0: x1 = x2 - W.get(nm, 0)
            rows[nm].append([T(n), x1, x2, (y1 + y2) / 2, y2 - y1])
        continue
    if len(cs) < len(names):
        # the top ones may have left frame; align from bottom
        names = names[len(names)-len(cs):]
    for nm, c in zip(names, cs[-len(names):] if cs else []):
        x1, y1, x2, y2 = c[:4]
        if x1 > 0: W[nm] = x2 - x1
        else: x1 = x2 - W.get(nm, x2)
        rows[nm].append([T(n), x1, x2, (y1 + y2) / 2, y2 - y1])
for nm in rows: out[nm] = [q for q in rows[nm] if not (nm == 'b1' and 120 < q[0] < 157)]
# blue bubble
blue, bw = [], None
for n in real:
    bs = [c for c in r[n]['b'] if c[2]-c[0] > 300 or (c[3]-c[1] > 180 and c[2]-c[0] > 100 and n < 200)]
    if not bs or n < 104 or n > 199: continue
    c = max(bs, key=lambda c: (c[2]-c[0])*(c[3]-c[1])); x1, y1, x2, y2 = c[:4]
    h = y2 - y1
    if 0 < x1 and x2 < 1920: bw = x2 - x1
    if x2 >= 1920: x2 = x1 + 548
    if x1 <= 0 and bw: x1 = x2 - bw
    blue.append([T(n), x1, x2, (y1+y2)/2, h])
out['blue'] = blue
# badge (small white square near the blue bubble)
badge = []
for n in real:
    if n < 137 or n > 199: continue
    cs = [c for c in r[n]['w'] if 40 <= c[2]-c[0] <= 200 and 40 <= c[3]-c[1] <= 200 and c[1] > 300]
    if cs: c = cs[0]; badge.append([T(n), (c[0]+c[2])/2, (c[1]+c[3])/2, c[2]-c[0]])
out['badge'] = badge
# cursor tip (top-left of the arrow's box)
cur = []
for n in real:
    if n < 162 or n > 236: continue
    cs = [c for c in r[n]['b'] if 60 <= c[2]-c[0] <= 130 and 60 <= c[3]-c[1] <= 130]
    if cs: c = cs[0]; cur.append([T(n), c[0], c[1], c[2]-c[0], c[2], c[3]])
out['cur'] = cur
json.dump(out, open(sys.argv[2], 'w'))
for k, v in out.items():
    print(k, len(v)); print('  ', v[:3], '...', v[-3:])
