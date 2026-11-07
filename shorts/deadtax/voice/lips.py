# Per-frame mouth openness (0..3) for the narrator's lip sync, from the voice RMS (30 fps) -> src/videos/deadtax/lips.ts
import subprocess, numpy as np
SR = 48000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.wav", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
n = int(np.ceil(len(x) / SR * 30)) + 45
hop = SR // 30
rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(x) else 0 for i in range(n)])
db = 20 * np.log10(rms + 1e-6)
ref = np.percentile(db[db > -50], 90)
lv = np.zeros(n, int)
# open on syllable peaks: level relative to the local max over +-4 frames, gated by speech presence
for i, d in enumerate(db):
    if d - ref < -26: continue
    loc = db[max(0, i - 4):i + 5].max()
    r = d - loc
    lv[i] = 3 if r > -1.5 and d - ref > -8 else 2 if r > -5 else 1
# no 1-frame flickers: a closed frame between two open ones opens a little
for i in range(1, n - 1):
    if lv[i] == 0 and lv[i - 1] > 0 and lv[i + 1] > 0: lv[i] = 1
s = "".join(map(str, lv))
open("../../../src/videos/deadtax/lips.ts", "w").write(
    "// narrator mouth openness per frame (0 shut .. 3 wide), from the voice RMS (shorts/deadtax/voice/lips.py)\n"
    f'const L = "{s}";\nexport const lipAt = (f: number) => (f >= 0 && f < L.length ? +L[f] : 0);\n')
print(n, s[:120])
