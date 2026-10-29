#!/usr/bin/env python3
"""verify_dump.py - compare the keys the build script really writes (mock dump) with the film's own motion.

  DUMP_KEYS=keys.json node ae_mock_dryrun.js ../Wayfold_Rebuild.jsx
  python3 verify_dump.py keys.json checks.json
Rebuilds AE's temporal bezier from the dumped keys and eases and measures it against the source channel sampled
at every frame and 8 sub-frames per frame (hold stretches are skipped). Exit 1 if any channel is off by more
than 2 % of its move."""
import json, sys
import numpy as np

def ae_value(rec, t, dim=0):
    K, E = rec["keys"], rec["eases"]
    pick = lambda v: v[dim] if isinstance(v, list) else v
    if t <= K[0]["t"]: return pick(K[0]["v"])
    for i in range(len(K) - 1):
        a, b = K[i], K[i + 1]
        if t <= b["t"] + 1e-9:
            T = b["t"] - a["t"]; va, vb = pick(a["v"]), pick(b["v"])
            eo, ei = E.get(str(i + 1)), E.get(str(i + 2))
            so, fo = eo[1][min(dim, len(eo[1]) - 1)]; si, fi = ei[0][min(dim, len(ei[0]) - 1)]
            s = np.linspace(0, 1, 400)
            x = 3 * (1 - s) ** 2 * s * (fo / 100 * T) + 3 * (1 - s) * s ** 2 * (T - fi / 100 * T) + s ** 3 * T
            y = (1 - s) ** 3 * va + 3 * (1 - s) ** 2 * s * (va + so * fo / 100 * T) + 3 * (1 - s) * s ** 2 * (vb - si * fi / 100 * T) + s ** 3 * vb
            return float(np.interp(t - a["t"], x, y))
    return pick(K[-1]["v"])

dump, checks = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
bad, worst, n = 0, (0, ""), 0
for c in checks:
    rec = dump.get(c["key"])
    if rec is None: print("MISSING", c["key"]); bad += 1; continue
    ts = np.array([s[0] for s in c["samples"]]); vs = np.array([s[1] for s in c["samples"]])
    rng = max(1e-9, vs.max() - vs.min())
    ae = np.array([ae_value(rec, t) for t in ts])
    e = np.abs(ae - vs).max() / rng * 100; n += 1
    if e > worst[0]: worst = (e, c["key"])
    if e > 2: bad += 1; print("BAD %5.2f%%  %s" % (e, c["key"]))
print("checked %d channels against the written keys; worst %.2f%% (%s)" % (n, worst[0], worst[1]))
sys.exit(1 if bad else 0)
