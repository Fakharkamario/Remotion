# Shorten every pause in the ElevenLabs read to <=0.2 s (keeps 0.1 s of room tone each side), then speed 4 %.
import subprocess, re, numpy as np, sys
src = "original.mp3"
e = subprocess.run(["ffmpeg","-i",src,"-af","silencedetect=n=-35dB:d=0.2","-f","null","-"],capture_output=True,text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", e)]
en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", e)]
raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar","48000","-f","f32le","-"],capture_output=True).stdout
x = np.frombuffer(raw, np.float32); sr = 48000
KEEP, FADE = 0.2, int(0.01*sr)
parts, cur = [], 0
for a, b in zip(st, en):
    if b - a <= KEEP: continue
    cut_a, cut_b = a + KEEP/2, b - KEEP/2
    seg = x[int(cur*sr):int(cut_a*sr)].copy(); parts.append(seg); cur = cut_b
parts.append(x[int(cur*sr):].copy())
# tiny crossfade between parts
out = parts[0]
for p in parts[1:]:
    f = min(FADE, len(out), len(p)); r = np.linspace(0,1,f,dtype=np.float32)
    out = np.concatenate([out[:-f], out[-f:]*(1-r)+p[:f]*r, p[f:]])
# trim lead-in to 0.15 s and tail to 0.4 s
nz = np.where(np.abs(out) > 0.01)[0]
out = out[max(0, nz[0]-int(.15*sr)): nz[-1]+int(.4*sr)]
out.tofile("tight.f32")
subprocess.run(["ffmpeg","-y","-v","error","-f","f32le","-ar","48000","-ac","1","-i","tight.f32","-af","atempo=1.04","-ar","48000","-c:a","pcm_s16le","voice.wav"],check=True)
print(len(out)/sr/1.04)
