"""
Synthesises the benchlane promo soundtrack: a soft music bed plus sound effects placed on
the video's cuts, clicks, keystrokes and pops. Oscillators and noise only (no samples).

    python3 scripts/make_audio.py        # writes assets/audio.wav, then encode to assets/audio.m4a
"""
import os
import wave

import numpy as np

SR = 48000
DUR = 48.57
rng = np.random.default_rng(11)
N = int(DUR * SR)
L = np.zeros(N)
R = np.zeros(N)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i : i + len(sig)] += sig * gain * (1 + min(0, pan))


def lp(x, a):
    """one-pole low-pass, a in (0, 1]"""
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += a * (x[k] - acc)
        y[k] = acc
    return y


def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR / decay)


# ------------------------------------------------------------------ sounds
def blip(freq=1800, d=0.05, decay=0.012):
    t = t_axis(d)
    return np.sin(2 * np.pi * freq * t) * env_exp(len(t), decay)


def click(d=0.03):
    n = int(d * SR)
    s = rng.standard_normal(n) * env_exp(n, 0.003)
    t = np.arange(n) / SR
    return s * 0.6 + np.sin(2 * np.pi * 2400 * t) * env_exp(n, 0.006) * 0.5


def key(d=0.04):
    n = int(d * SR)
    s = rng.standard_normal(n) * env_exp(n, 0.004)
    return np.diff(np.concatenate([[0], s])) * 0.8


def whoosh(d=0.45, up=True):
    n = int(d * SR)
    noise = rng.standard_normal(n)
    a = np.linspace(0.02, 0.35, n) if up else np.linspace(0.35, 0.02, n)
    out = np.empty(n)
    acc = 0.0
    for k in range(n):
        acc += a[k] * (noise[k] - acc)
        out[k] = acc
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return out * shape * 2.2


def impact(d=0.5, f0=90):
    t = t_axis(d)
    f = f0 * (1 + 1.5 * np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_exp(len(t), 0.12) + rng.standard_normal(len(t)) * env_exp(len(t), 0.01) * 0.3


def riser(d=0.45):
    t = t_axis(d)
    f = 300 + 1500 * (t / d) ** 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * 0.4 + rng.standard_normal(len(t)) * 0.15) * (t / d) ** 2


def pop(f=520):
    t = t_axis(0.12)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t / 0.02))) / SR
    return np.sin(ph) * env_exp(len(t), 0.04)


def chime(freqs, d=1.6):
    t = t_axis(d)
    s = sum(np.sin(2 * np.pi * f * t) * (0.9 ** i) for i, f in enumerate(freqs))
    return s * env_exp(len(t), 0.6) * np.minimum(1, t / 0.005)


# ------------------------------------------------------------------ music bed
def pad(freqs, d):
    t = t_axis(d)
    s = np.zeros(len(t))
    for f in freqs:
        for det in (-0.6, 0.6):
            s += np.sin(2 * np.pi * (f + det) * t) + 0.25 * np.sin(2 * np.pi * 2 * (f + det) * t)
    att = np.minimum(1, t / 0.25)
    rel = np.minimum(1, (d - t) / 0.3)
    return s * att * np.clip(rel, 0, 1) / len(freqs)


def note(n):
    return 440 * 2 ** ((n - 69) / 12)


prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
bar = 2.0
t0 = 0.0
k = 0
while t0 < 45.9:
    ch = prog[k % 4]
    place(pad([note(n) for n in ch], bar + 0.3), t0, 0.05)
    place(pad([note(ch[0] - 12)], bar + 0.3), t0, 0.06)
    t0 += bar
    k += 1
# soft pulse (kick + hat) from the first dark cut, thinning in the calm sections
beat = 0.5
for i in range(int(1.8 / beat), int(45.9 / beat)):
    tb = i * beat
    if 30.53 <= tb < 31.57:
        continue
    place(impact(0.25, 55), tb, 0.16)
    place(key(0.02), tb + beat / 2, 0.05, pan=0.3)
# resolve chord at the end
place(chime([note(57), note(64), note(69), note(72)], 2.6), 45.97, 0.12)

# ------------------------------------------------------------------ effects
for t in [1.80, 4.50, 10.67, 12.67, 14.23, 16.93, 21.27, 26.40, 30.53, 31.57, 36.97, 39.07, 40.47, 42.97]:
    place(impact(0.5, 80), t, 0.35)
    place(whoosh(0.35, up=False), t, 0.18)
for t in [1.5, 4.2, 10.4, 16.65, 21.0, 26.1, 30.25, 36.7, 38.8, 42.7]:
    place(whoosh(0.3, up=True), t, 0.16)

words = [0.10, 0.50, 0.63, 0.77, 1.80, 1.90, 5.07, 5.10, 5.13, 5.16, 6.60, 6.73, 6.87, 7.47, 7.67, 7.73, 8.33, 8.40, 8.47, 8.53, 11.87, 11.93,
         14.27, 14.33, 14.40, 30.53, 30.73, 30.93, 40.55, 40.6, 40.77, 40.89, 42.0, 42.97, 43.17, 43.37, 45.97, 46.03, 46.07]
for i, t in enumerate(words):
    place(blip(1500 + 220 * (i % 4), 0.06, 0.015), t, 0.1, pan=(-0.3 if i % 2 else 0.3))

for k in range(18):  # glyph scramble
    place(blip(2600 + rng.integers(0, 1600), 0.03, 0.006), 4.5 + k / 30, 0.05, pan=rng.uniform(-0.6, 0.6))
for k in range(16):  # code confetti
    place(click(0.02), 6.6 + rng.uniform(0, 1.7), 0.06, pan=rng.uniform(-0.8, 0.8))
place(riser(0.45), 9.6, 0.25)
place(impact(0.6, 70), 10.07, 0.3)
for i in range(9):
    place(key(0.03), 10.73 + i * 0.036, 0.2)
    place(key(0.03), 44.67 + i * 0.03, 0.15)
for i, t in enumerate([0.97, 1.3, 1.64, 1.77, 2.04, 2.17, 2.3, 2.37, 2.44]):
    place(pop(380 + 40 * i), 14.23 + t, 0.18, pan=(-0.4 if i % 2 else 0.4))
for t in [17.48, 20.38, 22.27, 29.67]:
    place(click(0.04), t, 0.45)
place(riser(0.2), 18.4, 0.15)
place(whoosh(0.2, up=True), 19.5, 0.3)
place(chime([note(76), note(83)], 0.5), 20.6, 0.08)
for i in range(61):
    place(key(0.025), 24.75 + i / 41 + rng.uniform(-0.006, 0.006), 0.22, pan=rng.uniform(-0.2, 0.2))
place(impact(0.3, 120), 24.07, 0.2)
place(riser(0.3), 29.75, 0.18)
place(whoosh(0.45, up=True), 30.05, 0.3)
for t in [32.64, 34.21, 35.61]:
    place(whoosh(0.35, up=True), t, 0.2)
for k in range(4):
    place(blip(900, 0.08, 0.03), 36.4 + k * 0.12, 0.06)
hum_t = t_axis(1.9)
place(np.sin(2 * np.pi * 220 * hum_t) * 0.3 * np.sin(np.pi * hum_t / 1.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * hum_t)), 37.15, 0.05)
for t in [0, 0.06, 0.13, 0.26, 0.4, 0.73, 1.13, 1.33]:
    place(blip(1200, 0.05, 0.02), 39.07 + t, 0.12)
place(whoosh(1.4, up=True), 40.5, 0.18)
place(whoosh(0.6, up=False), 42.35, 0.25)
place(impact(0.6, 60), 44.4, 0.3)
place(chime([note(69), note(76)], 1.2), 44.9, 0.1)

# ------------------------------------------------------------------ master
mix = np.stack([L, R], 1)
fade = np.ones(N)
fn = int(1.2 * SR)
fade[-fn:] = np.linspace(1, 0, fn)
mix *= fade[:, None]
mix /= max(1e-9, np.abs(mix).max()) / 0.89
out = os.path.join(os.path.dirname(__file__), "..", "assets", "audio.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
