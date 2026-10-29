"""
Synthesises the grovr promo soundtrack: a 120 BPM bed (kick, hats, bass, a warm chord pad) plus effects placed on
the video's cuts and slams. Oscillators and noise only, no samples.

    python3 scripts/make_audio.py      # writes assets/audio.wav and encodes assets/audio.m4a (needs ffmpeg)
"""
import os
import subprocess
import wave

import numpy as np

SR = 48000
FPS = 30
DUR = 35.4
N = int(DUR * SR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i : i + len(sig)] += sig * gain * (1 + min(0, pan))


def env(n, decay):
    return np.exp(-np.arange(n) / SR / decay)


def lowpass(x, cutoff):
    # one-pole low-pass via an FFT-free recursive filter, vectorised in blocks
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += a * (x[k] - acc)
        y[k] = acc
    return y


def kick():
    t = t_axis(0.45)
    f = 48 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(len(t), 0.16) + 0.25 * rng.standard_normal(len(t)) * env(len(t), 0.004)


def hat(d=0.06):
    n = int(d * SR)
    s = rng.standard_normal(n)
    s = np.diff(np.concatenate([[0], s]))
    return s * env(n, 0.012) * 0.5


def clap():
    n = int(0.25 * SR)
    s = rng.standard_normal(n)
    e = np.zeros(n)
    for o in (0, 0.009, 0.018):
        i = int(o * SR)
        e[i:] += env(n - i, 0.02 if o < 0.018 else 0.09)
    return lowpass(s * e, 4500) * 0.9


def bass(freq, d):
    t = t_axis(d)
    s = np.sign(np.sin(2 * np.pi * freq * t)) * 0.4 + np.sin(2 * np.pi * freq * t)
    a = np.minimum(1, t / 0.008) * np.exp(-t / (d * 0.9))
    return lowpass(s * a, 520) * 0.9


def pad(freqs, d):
    t = t_axis(d)
    s = sum(np.sin(2 * np.pi * f * t + i) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) for i, f in enumerate(freqs))
    a = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.4)
    return s * a / len(freqs)


def whoosh(d=0.35, rise=True):
    n = int(d * SR)
    noise = rng.standard_normal(n)
    cut = np.linspace(400, 5000, n) if rise else np.linspace(5000, 400, n)
    y = np.empty(n)
    acc = 0.0
    for k in range(n):
        a = 1 - np.exp(-2 * np.pi * cut[k] / SR)
        acc += a * (noise[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 1.6 * 1.6


def impact():
    t = t_axis(0.7)
    f = 40 + 90 * np.exp(-t / 0.06)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.25)
    return body + lowpass(rng.standard_normal(len(t)), 1800) * env(len(t), 0.05) * 1.2


def tick(freq=2600):
    t = t_axis(0.05)
    return np.sin(2 * np.pi * freq * t) * env(len(t), 0.01)


def pop(freq=700):
    t = t_axis(0.12)
    f = freq * (1 + 1.2 * np.exp(-t / 0.015))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.04)


def chime(freq):
    t = t_axis(1.6)
    return sum(np.sin(2 * np.pi * freq * m * t) / m for m in (1, 2.01, 3.02)) * env(len(t), 0.5)


# ------------------------------------------------------------------ music bed: 120 BPM, A minor-ish, 4 bars per phrase
BEAT = 0.5
ROOTS = [55.0, 43.65, 65.41, 49.0]  # A1, F1, C2, G1
CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]
end_music = 32.4
b = 0
while b * BEAT < end_music:
    at = b * BEAT
    bar = b // 4
    if b % 4 == 0:
        place(pad(CHORDS[bar % 4], 4 * BEAT + 0.3), at, 0.08, 0.0)
    place(kick(), at, 0.55)
    if b % 2 == 1:
        place(clap(), at, 0.22, 0.1)
    place(hat(), at + BEAT / 2, 0.16, -0.3)
    if at > 3.9:
        place(hat(0.03), at + BEAT / 4, 0.07, 0.3)
        place(hat(0.03), at + 3 * BEAT / 4, 0.07, 0.3)
    root = ROOTS[bar % 4]
    place(bass(root * (2 if b % 2 else 1), BEAT * 0.9), at, 0.32)
    b += 1

# end card: a final kick, a chord ringing out
place(impact(), 972 / FPS, 0.6)
place(pad([220, 277.2, 329.6, 440], 3.0), 972 / FPS, 0.14)
place(chime(880), 986 / FPS, 0.12, 0.2)

# ------------------------------------------------------------------ effects on the cuts
fr = lambda f: f / FPS
for f in (56, 120, 168, 290, 392, 478, 540, 650, 700, 728, 762, 816, 866, 916):
    place(whoosh(0.3), fr(f) - 0.24, 0.32, 0.2 if f % 2 else -0.2)
for f in (78, 84, 90, 96, 249, 322, 936):
    place(impact(), fr(f), 0.45)
for i, f in enumerate(range(392, 440, 6)):
    place(tick(2000 + 120 * i), fr(f), 0.18, -0.4 + 0.1 * i)
for i in range(8):
    place(pop(600 + 60 * i), fr(102 + i * 1.6), 0.16, -0.6 + 0.17 * i)
for i in range(5):
    place(tick(1600), fr(i * 4), 0.15)
for f in (31, 36, 292, 298, 304, 446, 506, 652, 654, 656, 700, 708, 716, 918, 924):
    place(pop(900), fr(f), 0.14)
place(whoosh(0.8), fr(556), 0.25)
place(whoosh(0.6, rise=False), fr(632), 0.3)
for f in (733, 745, 756):
    place(tick(3000), fr(f), 0.14)
for i in range(10):
    place(tick(3200 + i * 50), fr(768 + i * 3.2), 0.05)

mix = np.stack([L, R], axis=1)
mix *= 0.85 / max(1e-9, np.max(np.abs(mix)))
fade = int(0.4 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

here = os.path.dirname(os.path.abspath(__file__))
wav = os.path.join(here, "..", "assets", "audio.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
m4a = os.path.join(here, "..", "assets", "audio.m4a")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "192k", m4a], check=True)
print("wrote", m4a)
