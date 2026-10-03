"""
Synthesises the LUNARO soundtrack (38.65 s): a soft piano-ish pulse and pad,
plus ticks for word pops, typing clicks, whooshes and glitch hits that follow
the cue times in the compositions. Oscillators and noise only - no samples.

    python3 scripts/soundtrack.py   # writes assets/soundtrack.m4a (needs ffmpeg)
"""
import os
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 38.65
N = int(DUR * SR)
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(3)

L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def ta(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f):
    return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def note(freq, d=1.6, bright=0.35):
    t = ta(d)
    env = np.exp(-t * 3.2) * (1 - np.exp(-t * 400))
    s = np.sin(2 * np.pi * freq * t) + bright * np.sin(4 * np.pi * freq * t) * np.exp(-t * 6) + 0.12 * np.sin(6 * np.pi * freq * t) * np.exp(-t * 9)
    return s * env


def pad(freqs, d):
    t = ta(d)
    env = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.2)
    s = sum(np.sin(2 * np.pi * f * t + i) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) for i, f in enumerate(freqs))
    return lp(s, 1400) * env / len(freqs)


def tick(f=2600, d=0.03):
    t = ta(d)
    return bp(rng.standard_normal(len(t)), f * 0.7, f * 1.3) * np.exp(-t * 180) + 0.4 * np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t * 120)


def whoosh(d=0.6, f0=300, f1=3500):
    t = ta(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    seg = 512
    for k in range(0, len(n), seg):
        f = f0 + (f1 - f0) * (k / len(n)) ** 1.5
        out[k : k + seg] = bp(n[k : k + seg], f * 0.6, min(f * 1.6, 20000))
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return out * env


def glitch(d=0.25):
    t = ta(d)
    sq = np.sign(np.sin(2 * np.pi * 110 * t * (1 + 3 * t)))
    crunch = np.round(rng.standard_normal(len(t)) * 3) / 3
    gate = (np.floor(t * 40) % 2).astype(float)
    return lp(0.5 * sq + 0.6 * crunch * gate, 5000) * np.exp(-t * 9)


def boom(d=2.5):
    t = ta(d)
    f = 70 * np.exp(-t * 1.5) + 38
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)


# ------------------------------------------------------------- music bed
# D major-ish progression; quiet under the typography, opening up in the reel.
D, E, Fs, G, A, B = 146.83, 164.81, 185.0, 196.0, 220.0, 246.94
chords = [[D, Fs, A, 2 * E], [B / 2, D, Fs, A], [G / 2 * 1, B, D * 2, Fs * 2 / 2], [A / 2, E, A, 2 * Fs / 2 * 1]]
bar = 2.4  # 100 bpm, 4 beats
t0 = 0.0
k = 0
while t0 < 37.4:
    ch = chords[k % 4]
    gain = 0.16 if t0 < 22.4 else 0.24
    add(pad(ch, bar + 1.2), t0, gain, 0)
    k += 1
    t0 += bar

# Plucked pulse on eighth notes, sparse at first.
arp = [2, 1, 3, 2, 0, 3, 1, 2]
t = 0.0
i = 0
while t < 37.3:
    ch = chords[int(t // bar) % 4]
    f = ch[arp[i % 8] % len(ch)] * 2
    if t < 22.4:
        g = 0.07 if i % 2 == 0 else 0.0
    elif t < 33.0:
        g = 0.1
    else:
        g = 0.08
    if g:
        add(note(f, 1.2, 0.3), t, g, -0.3 if i % 2 else 0.3)
    t += 0.3
    i += 1

# Soft kick under the reel.
kt = 23.4
while kt < 33.0:
    add(boom(0.45) * 0.7, kt, 0.35)
    kt += 0.6

# ------------------------------------------------------------- sound effects
pops = [0.08, 0.2, 0.62, 1.18, 3.0, 3.1, 3.38, 4.3, 10.2, 10.52, 12.0, 12.16, 12.28, 12.4,
        13.08, 13.14, 15.1, 15.72, 15.82, 15.92, 16.02, 16.62, 19.3, 19.42, 26.9, 27.02, 29.95, 30.18]
for j, p in enumerate(pops):
    add(tick(2200 + (j % 4) * 300), p, 0.22, (j % 3 - 1) * 0.3)

def typed(start, n, cps, jitter=True, seed=0):
    r = np.random.default_rng(seed)
    at = start
    for _ in range(n):
        add(tick(4200, 0.018), at, 0.1, r.uniform(-0.4, 0.4))
        at += (1 / cps) * (0.6 + r.random() * 0.8 if jitter else 1)

typed(5.0, 18, 22, seed=1)
typed(9.1, 5, 38, False)
typed(21.05, 17, 13, seed=2)
typed(1.2, 3, 30, False)

# Card flips
for c in [13.66, 13.88, 14.18]:
    add(whoosh(0.18, 900, 4000), c - 0.04, 0.18)
    add(tick(1500, 0.04), c, 0.25)

# Transitions
add(whoosh(0.7, 200, 3000), 1.42, 0.12)
add(whoosh(1.0, 150, 2500), 6.1, 0.16)
add(whoosh(1.6, 100, 1800), 22.6, 0.18)
add(whoosh(2.4, 80, 1200), 24.3, 0.2)
add(whoosh(0.35, 400, 5000), 26.85, 0.14, -0.6)
for g in [27.55, 29.2, 30.7]:
    add(glitch(0.22), g, 0.22)
add(glitch(0.3), 33.1, 0.3)
add(boom(3.0), 33.15, 0.6)
add(whoosh(4.0, 120, 900), 33.3, 0.12)
add(glitch(0.3), 37.33, 0.3)
add(note(D * 4, 3.0, 0.2), 37.4, 0.12)

# ------------------------------------------------------------- master
mix = np.stack([L, R], axis=1)
fade = np.ones(N)
fo = int(1.0 * SR)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
wav = os.path.join(OUT, "soundtrack.wav")
wavfile.write(wav, SR, (mix * 32767).astype(np.int16))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "192k", os.path.join(OUT, "soundtrack.m4a")], check=True)
os.remove(wav)
print("wrote assets/soundtrack.m4a")
