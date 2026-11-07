# Tighten the ElevenLabs voiceover: every pause >= 0.15 s (at -40 dB) is cut down to KEEP s,
# with 10 ms equal-power crossfades at each join. Output voice.wav (48 kHz mono) + cutmap.json.
import json, re, subprocess, sys
import numpy as np
SRC = "original.mp3"; KEEP = 0.11; SR = 48000; TEMPO = 1.04  # slight speed-up for pace
log = subprocess.run(["ffmpeg", "-i", SRC, "-af", "silencedetect=n=-40dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
dur = len(x) / SR
# segments of speech to keep
keep, t = [], 0.0
for s, e in zip(st, en):
    if e - s <= KEEP: continue
    lead = 0.04 if s > 0.05 else 0.0
    keep.append((t, s + KEEP / 2)); t = e - KEEP / 2
keep.append((t, dur))
keep = [(max(0, a), min(dur, b)) for a, b in keep if b > a]
fade = int(0.01 * SR); out = []; cmap = []; pos = 0.0
for a, b in keep:
    seg = x[int(a * SR):int(b * SR)].copy()
    seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    cmap.append({"src": [round(a, 4), round(b, 4)], "dst": round(pos, 4)})
    out.append(seg); pos += len(seg) / SR
y = np.concatenate(out)
# start with 0.08 s of silence-free head: trim leading silence below -40 dB
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", f"atempo={TEMPO}", "-c:a", "pcm_s16le", "voice.wav"], input=y.tobytes())
json.dump(cmap, open("cutmap.json", "w"), indent=1)
print(f"orig {dur:.2f}s -> {pos/TEMPO:.2f}s, {len(keep)} segments")
