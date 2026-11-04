"""Remove silences: keep speech islands (pad 50 ms), shrink every gap to GAP s (longer at a few dramatic spots),
equal-power 15 ms crossfades. Writes voice.wav (48 kHz mono) + words.json remapped, edits.json."""
import json, subprocess, re, numpy as np, wave
SR = 48000
GAP = 0.09
pcm = subprocess.run(["ffmpeg","-v","error","-i","raw.mp3","-ar",str(SR),"-ac","1","-f","f32le","-"],capture_output=True,check=True).stdout
x = np.frombuffer(pcm, np.float32).copy()
log = subprocess.run(["ffmpeg","-hide_banner","-i","raw.mp3","-af","silencedetect=noise=-42dB:d=0.10","-f","null","-"],capture_output=True,text=True).stderr
ss = [float(v) for v in re.findall(r"silence_start: ([\d.]+)", log)]
se = [float(v) for v in re.findall(r"silence_end: ([\d.]+)", log)]
dur = len(x)/SR
if len(se) < len(ss): se.append(dur)
sil = list(zip(ss, se))
# speech islands
isl, t = [], 0.0
for a, b in sil:
    if a > t: isl.append([t, a])
    t = b
if t < dur: isl.append([t, dur])
PAD = 0.05
isl = [[max(0, a - PAD), min(dur, b + PAD)] for a, b in isl]
words = json.load(open("words_raw.json"))
# longer gap before these words (dramatic): word -> gap
LONG = {"then": 0.30}
def gap_before(t0):
    for w in words:
        if abs(w["s"] - t0) < 0.25 and w["w"] in LONG: return LONG[w["w"]]
    return GAP
out, edits, T = [], [], 0.0
XF = int(0.015 * SR)
for i, (a, b) in enumerate(isl):
    seg = x[int(a*SR):int(b*SR)].copy()
    if i > 0:
        g = gap_before(a + PAD)
        out.append(np.zeros(int(g*SR), np.float32)); T += g
    seg[:XF] *= np.sin(np.linspace(0, np.pi/2, XF))**1; seg[-XF:] *= np.cos(np.linspace(0, np.pi/2, XF))
    edits.append({"src0": a, "src1": b, "dst0": T}); out.append(seg); T += (b - a)
y = np.concatenate(out + [np.zeros(int(0.15*SR), np.float32)])
def remap(t):
    for e in edits:
        if e["src0"] - 1e-3 <= t <= e["src1"] + 1e-3: return e["dst0"] + (t - e["src0"])
    # in a removed gap: snap to the next island start
    nxt = [e for e in edits if e["src0"] > t]
    return nxt[0]["dst0"] if nxt else T
W = []
for w in words:
    s, e = remap(w["s"]), remap(w["e"])
    W.append({"w": re.sub(r"\(\d\)", "", w["w"]), "s": round(s, 3), "e": round(max(e, s + 0.05), 3)})
json.dump(W, open("words.json","w"), indent=0)
json.dump(edits, open("edits.json","w"), indent=0)
y = np.clip(y, -1, 1)
with wave.open("voice.wav","wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype(np.int16).tobytes())
print("islands", len(isl), "dur", round(len(y)/SR, 2), "from", round(dur, 2))
