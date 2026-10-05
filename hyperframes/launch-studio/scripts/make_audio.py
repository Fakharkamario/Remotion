"""
Synthesises the Launch Studio soundtrack: a 120 bpm pulse (kick, hats, bass, pad) with whooshes on
the cuts and ticks under the counters. Oscillators and noise only (no samples).

    python3 scripts/make_audio.py   # writes assets/audio.wav, then: ffmpeg -i assets/audio.wav -c:a aac -b:a 192k assets/audio.m4a
"""
import os
import wave

import numpy as np

SR = 48000
DUR = 30.0
N = int(DUR * SR)
rng = np.random.default_rng(5)
L = np.zeros(N)
R = np.zeros(N)
BEAT = 0.5  # 120 bpm


def tx(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i : i + len(sig)] += sig * gain * (1 + min(0, pan))


def kick():
    t = tx(0.4)
    f = 45 + 110 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)


def hat():
    t = tx(0.06)
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # crude high-pass
    return n * np.exp(-t / 0.012) * 0.5


def bass(freq, d):
    t = tx(d)
    s = np.sign(np.sin(2 * np.pi * freq * t)) * 0.3 + np.sin(2 * np.pi * freq * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t / 0.25)


def pad(freqs, d):
    t = tx(d)
    s = sum(np.sin(2 * np.pi * f * t + i) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) for i, f in enumerate(freqs))
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return s * env / len(freqs)


def whoosh(d=0.45, rise=True):
    t = tx(d)
    n = rng.standard_normal(len(t))
    k = np.cumsum(n)
    k -= np.convolve(k, np.ones(40) / 40, mode="same")  # band-ish
    env = (t / d) ** 2 if rise else (1 - t / d) ** 2
    return k / (np.abs(k).max() + 1e-9) * env


def tick():
    t = tx(0.03)
    return np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006)


def boom():
    t = tx(1.6)
    f = 38 + 60 * np.exp(-t / 0.08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6)


# ---------------------------------------------------------------- bed
roots = [55.0, 43.65, 49.0, 41.2]  # A1 F1 G1 E1
chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9]]
for bar in range(int(DUR / (4 * BEAT)) + 1):
    t0 = bar * 4 * BEAT
    if t0 >= 29.2:
        break
    c = bar % 4
    place(pad(chords[c], 4 * BEAT + 0.6), t0, 0.08)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb < 1.6 or tb > 29.0:
            continue
        place(kick(), tb, 0.55)
        place(bass(roots[c], BEAT * 0.9), tb + BEAT / 2, 0.14)
        place(hat(), tb + BEAT / 2, 0.22, 0.3)
        place(hat(), tb + BEAT / 4 * 3, 0.1, -0.3)

# ---------------------------------------------------------------- hits on the cuts
for at in [2.0, 4.6, 7.0, 10.0, 12.6, 16.0, 19.4, 23.4, 26.4]:
    place(whoosh(0.4), at - 0.4, 0.35)
for at in [20.4, 21.4, 22.4]:
    place(whoosh(0.2), at - 0.2, 0.25)
place(whoosh(0.3), 23.05, 0.4)
place(boom(), 0.1, 0.5)
place(boom(), 28.0, 0.45)
for f in range(0, 30):  # counters
    place(tick(), 16.4 + f * 0.035, 0.12, 0.2)
    if f < 22:
        place(tick(), 23.65 + f * 0.045, 0.12, -0.2)
for i in range(13):  # wordmark letters locking
    place(tick(), 0.62 + i * 0.065, 0.1)
    place(tick(), 27.95 + i * 0.055, 0.1)

# ---------------------------------------------------------------- master
fade = np.ones(N)
fe = int(0.6 * SR)
fade[-fe:] = np.linspace(1, 0, fe)
mix = np.stack([L, R], 1) * fade[:, None]
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix /= np.abs(mix).max() + 1e-9
mix *= 0.85
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "assets", "audio.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
