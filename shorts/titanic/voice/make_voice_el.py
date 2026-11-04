"""ElevenLabs voice-over (el/voice_el.mp3, the user's recording) -> voice.wav + words.json + warp.json.

1. el/el_words.json: word times from pocketsphinx forced alignment of the script (el/align.py).
2. Silences are tightened: pauses between phrases are kept short (scaled from the old stand-in gaps, so the dramatic
   beats still breathe), pauses inside a phrase shrink to ~0.1 s. Every cut sits inside a measured silence and gets a
   10 ms crossfade, so no word is touched.
3. warp.json: anchor pairs [new_s, old_s] mapping the new voice timeline onto the timeline the picture and sound were
   built on (the stand-in words.json, kept as words_old.json). Bridge.tsx plays the picture through this map; make_audio
   moves every sound cue through it.
"""
import json, os, re, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
LEAD, OLD_TAIL = 0.25, 1.45  # silence before the first word; time after the last word (as in the old cut)
PUNCH = {"horrifying", "taught", "grinding", "shudder", "lights", "hits", "knows", "band", "rolled", "Only", "knock", "Now", "drill", "don't", "panics", "empty", "hallways", "out", "moon", "black", "snaps", "Unluckily", "degrees", "made"}

import ast  # same phrase list and gaps as the stand-in (read without running make_voice.py)
_src = open(os.path.join(HERE, "make_voice.py")).read()
PHRASES = ast.literal_eval(_src[_src.index("PHRASES = [") + 10:_src.index("]\ndef synth") + 1])

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "el", "voice_el.mp3"), "-ar", str(SR), "-ac", "1", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32).copy()
W = json.load(open(os.path.join(HERE, "el", "el_words.json")))
OLD = json.load(open(os.path.join(HERE, "words_old.json")))
assert len(W) == len(OLD) == 141

# phrase index of each word
ph, n = [], 0
for k, (text, gap) in enumerate(PHRASES):
    c = len(text.split()); ph += [k] * c; n += c
assert n == len(W), n

# silences from the signal itself (-40 dB, >= 0.1 s), 10 ms RMS frames
hop = int(0.01 * SR)
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same"))[::hop]
quiet = rms < 10 ** (-40 / 20)
sil, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= 10: sil.append((i * 0.01, j * 0.01))
        i = j
    else: i += 1

# keep-list of (src_a, src_b) segments
keep, cur = [], 0.0
first = W[0]["s"]
cur = max(0.0, first - 0.04)
for a, b in sil:
    if b <= cur or a < first: continue
    # which word boundary is this silence in?
    k = max(i for i in range(len(W)) if W[i]["s"] < a + 0.05) if any(w["s"] < a + 0.05 for w in W) else 0
    if k >= len(W) - 1: break
    end_phrase = ph[k] != ph[k + 1]
    tgt = float(np.clip(PHRASES[ph[k]][1] * 0.75, 0.2, 0.5)) if end_phrase else 0.1
    if b - a <= tgt: continue
    keep.append((cur, a + tgt * 0.4)); cur = b - tgt * 0.6
last_e = W[-1]["e"] + 0.12
keep.append((cur, min(last_e, len(x) / SR)))

# build with 10 ms crossfades
xf = int(0.01 * SR)
out = np.zeros(int(LEAD * SR), np.float32)
src2new = []  # (src_a, new_a, src_b) per segment
for a, b in keep:
    seg = x[int(a * SR):int(b * SR)].copy()
    t0 = len(out) / SR
    if len(out) > xf and len(seg) > xf:
        r = np.linspace(0, 1, xf, dtype=np.float32)
        out[-xf:] = out[-xf:] * (1 - r) + seg[:xf] * r
        seg = seg[xf:]; t0 -= xf / SR
        src2new.append((a, t0, b))
    else: src2new.append((a, t0, b))
    out = np.concatenate([out, seg])

def to_new(s):
    for a, t0, b in src2new:
        if a - 1e-6 <= s <= b + 1e-6: return t0 + (s - a)
    # inside a removed span: snap to the next segment start
    for a, t0, b in src2new:
        if s < a: return t0
    return src2new[-1][1] + src2new[-1][2] - src2new[-1][0]

NW = [{"w": o["w"], "s": round(to_new(w["s"]), 3), "e": round(to_new(w["e"]), 3)} for o, w in zip(OLD, W)]
total = round(NW[-1]["e"] + OLD_TAIL, 2)
y = np.concatenate([out, np.zeros(max(0, int(total * SR) - len(out)), np.float32)])[: int(total * SR)]
y = y / (np.abs(y).max() + 1e-9) * 0.89
import wave
with wave.open(os.path.join(HERE, "voice.wav"), "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((y * 32767).astype(np.int16).tobytes())
json.dump(NW, open(os.path.join(HERE, "words.json"), "w"), indent=0)

# warp anchors: phrase starts/ends + punch words, [new, old]
A = [[0.0, 0.0]]
for i, (nw, ow) in enumerate(zip(NW, OLD)):
    if i == 0 or ph[i] != ph[i - 1] or nw["w"] in PUNCH: A.append([nw["s"], ow["s"]])
    if i == len(NW) - 1 or ph[i] != ph[i + 1]: A.append([nw["e"], ow["e"]])
A.append([total, 45.0])
A = sorted({round(a, 3): b for a, b in A}.items())
# keep strictly increasing on both axes
B = [A[0]]
for a, b in A[1:]:
    if a > B[-1][0] + 0.02 and b > B[-1][1] + 0.02: B.append((a, b))
json.dump({"total": total, "anchors": [[round(a, 3), round(b, 3)] for a, b in B]}, open(os.path.join(HERE, "warp.json"), "w"))

# per-frame mouth openness for the host's lip-sync (0..1, 30 fps, new timeline)
env = np.sqrt(np.convolve(y ** 2, np.ones(int(0.04 * SR)) / int(0.04 * SR), "same"))
fr = np.array([env[int(min(len(env) - 1, (k + 0.5) / 30 * SR))] for k in range(int(round(total * 30)))])
ref = np.percentile(fr[fr > 0.01], 90)
mouth = np.clip((fr / ref) ** 0.7, 0, 1)
json.dump([round(float(v), 2) for v in mouth], open(os.path.join(HERE, "mouth.json"), "w"))
slopes = [(b2 - b1) / (a2 - a1) for (a1, b1), (a2, b2) in zip(B, B[1:])]
print(f"voice {total:.2f}s (was {len(x)/SR:.2f}s), {len(B)} anchors, picture speed {min(slopes):.2f}..{max(slopes):.2f}")

# smooth the map so the picture never jumps in speed at a shortened pause: g(new) -> old, gaussian sigma 0.28 s
dt = 0.005
tn = np.arange(0, total + dt / 2, dt)
g = np.interp(tn, [a for a, b in B], [b for a, b in B])
sig = int(0.28 / dt); k = np.exp(-0.5 * (np.arange(-4 * sig, 4 * sig + 1) / sig) ** 2); k /= k.sum()
pad = 4 * sig
gp = np.concatenate([g[0] - (g[1] - g[0]) * np.arange(pad, 0, -1), g, g[-1] + (g[-1] - g[-2]) * np.arange(1, pad + 1)])
gs = np.convolve(gp, k, "same")[pad:-pad]
gs[0] = 0.0; gs = np.maximum.accumulate(gs); gs *= 45.0 / gs[-1]
NF = int(round(total * 30))
frames = [round(float(np.interp(f / 30, tn, gs)) * 30, 3) for f in range(NF)]
err = [abs(np.interp(a, tn, gs) - b) * 30 for a, b in B]
sl = np.diff(frames)
json.dump({"total": total, "frames": NF, "old": frames, "anchors": [[round(a, 3), round(b, 3)] for a, b in B]},
          open(os.path.join(HERE, "warp.json"), "w"))
print(f"smoothed: speed {sl.min():.2f}..{sl.max():.2f}, anchor error max {max(err):.1f} f, mean {np.mean(err):.1f} f")
for (a, b), e in zip(B, err):
    if e > 3: print("  off", a, b, round(e, 1))

# picture side: generated TS table (story.ts imports it)
TS = os.path.join(HERE, "..", "..", "..", "src", "videos", "titanic", "voicemap.ts")
with open(TS, "w") as f:
    f.write("// GENERATED by shorts/titanic/voice/make_voice_el.py - do not edit.\n")
    f.write("/** output frame -> story frame (the timeline the shots were built on) */\n")
    f.write(f"export const WARP_OLD: number[] = {json.dumps(frames)};\n")
    f.write("/** host mouth openness per output frame, 0..1, from the voice envelope */\n")
    f.write(f"export const MOUTH: number[] = {json.dumps([round(float(v), 2) for v in mouth])};\n")
    f.write("/** word onsets in output frames */\n")
    f.write(f"export const WORDS: [string, number][] = {json.dumps([[w['w'], round(w['s'] * 30, 1)] for w in NW])};\n")
print("wrote", TS)
