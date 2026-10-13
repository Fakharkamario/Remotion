"""Builds assets/audio.m4a: the original voice plus synthesized sound design, cued to the frames in assets/scene.js.

Everything is generated here (seeded noise and sine partials), so there are no third-party samples to license.

    python3 scripts/build_audio.py        # needs numpy and ffmpeg
"""
import math
import os
import subprocess
import wave

import numpy as np

SR = 48000
FPS = 30
DUR = 7.0
SFX_GAIN = 0.7  # master level of the sound design under the voice (voice peaks ~0.6)
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(5)


def t_of(frame):
    return frame / FPS


def env(n, attack, release):
    a = np.clip(np.arange(n) / max(1, attack * SR), 0, 1)
    r = np.exp(-np.arange(n) / max(1, release * SR))
    return a * r


def one_pole(x, cut):
    """Lowpass with a per-sample cutoff (Hz)."""
    y = np.empty_like(x)
    k = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR)
    k = np.broadcast_to(k, x.shape)
    acc = 0.0
    for i in range(len(x)):
        acc += k[i] * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(dur=0.38, lo=250, hi=5200, peak=0.55):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    u = np.linspace(0, 1, n)
    sweep = lo * (hi / lo) ** np.sin(np.pi * np.clip(u / (peak * 2), 0, 0.5)) * (1 - 0.6 * np.clip((u - peak) / (1 - peak), 0, 1))
    band = one_pole(noise, sweep) - one_pole(noise, sweep * 0.25)
    shape = np.where(u < peak, (u / peak) ** 2.2, np.exp(-(u - peak) / (1 - peak) * 4.5))
    return band * shape


def click(freq=2600, dur=0.03):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    burst = rng.standard_normal(n) * np.exp(-tt / 0.002)
    tone = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.008)
    return 0.6 * (burst - one_pole(burst, 1500)) + 0.5 * tone


def pop(f0=900, f1=220, dur=0.09):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    fr = f1 + (f0 - f1) * np.exp(-tt / 0.018)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * env(n, 0.002, 0.03)


def hit(dur=0.55):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    fr = 48 + 70 * np.exp(-tt / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.003, 0.18)
    snap = rng.standard_normal(n) * np.exp(-tt / 0.012)
    return 0.9 * body + 0.25 * (snap - one_pole(snap, 900))


def ding(f=1318.5, dur=0.7):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / (0.32 / m)) for m, a in [(1, 1.0), (1.5, 0.45), (2.0, 0.3), (3.01, 0.12)])
    return s * env(n, 0.003, 10)


def riser(dur=0.75, f0=260, f1=820):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    u = tt / dur
    fr = f0 * (f1 / f0) ** u
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    return s * (u ** 1.6) * (1 - np.clip((u - 0.92) / 0.08, 0, 1)) * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * tt))


def read_voice(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR, "voice.wav must be 48 kHz"
        ch = w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    return a.reshape(-1, ch).mean(axis=1)


def main():
    total = int(DUR * SR)
    sfx = np.zeros(total + SR)

    def at(frame, sig, gain):
        i = int(round(t_of(frame) * SR))
        sfx[i:i + len(sig)] += gain * sig / (np.max(np.abs(sig)) + 1e-9)

    # cuts into the animated scenes get a full whoosh (peaking on the cut), cuts back to camera a lighter one
    for f, g, d in [(48, 0.30, 0.40), (70, 0.16, 0.30), (102, 0.30, 0.40), (139, 0.16, 0.30), (173, 0.32, 0.45)]:
        at(f - d * 0.55 * FPS, whoosh(d), g)
    # beat 1: the four big characters land
    for f in (18, 22, 30, 34):
        at(f, pop(700, 200), 0.10)
    # beat 2: typing, then the highlighter swipe
    for f in (50, 53, 57, 61, 64, 67):
        at(f, click(2400 + 150 * (f % 3)), 0.16)
    at(64, whoosh(0.18, 900, 7000, 0.5), 0.12)
    # beat 3: the 5 hits, the rest pops in, the strike swipes
    at(75, hit(), 0.34)
    for f in (81, 86, 89):
        at(f, pop(800, 240), 0.10)
    at(92, whoosh(0.2, 1200, 8000, 0.35), 0.18)
    # beat 4: the dot pops, the chart rises, the tip lands
    at(102, pop(1100, 300), 0.16)
    at(108, pop(600, 160, 0.12), 0.12)
    at(111, riser(0.74), 0.07)
    at(132, ding(1568), 0.12)
    # beat 5: 高 / 于
    for f in (163, 167):
        at(f, pop(760, 210), 0.11)
    # beat 6: the grid fills, the counter ticks as the digits change, the top row lights, the tag pops
    for f in np.arange(173, 183, 0.75):
        at(f, pop(1400 + 30 * (f - 173), 500, 0.04), 0.035)
    last = 0
    for f in np.arange(175, 194, 0.25):
        p = min(1, max(0, (f - 175) / (193 - 175)))
        v = round(90 * (1 - (1 - p) ** 3))
        if v // 6 != last // 6:
            at(f, click(3200, 0.02), 0.10)
        last = v
    at(191, ding(1318.5, 0.9), 0.16)
    at(199, pop(950, 320), 0.14)

    voice = read_voice(os.path.join(ASSETS, "voice.wav"))
    mix = np.zeros(total)
    mix[: min(total, len(voice))] += voice[:total]
    mix += SFX_GAIN * sfx[:total]
    mix = np.clip(mix, -1, 1)
    tmp = os.path.join(ASSETS, "_mix.wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    out = os.path.join(ASSETS, "audio.m4a")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2",
                    "-c:a", "aac", "-b:a", "192k", out], check=True)
    os.remove(tmp)
    print("wrote", out)


if __name__ == "__main__":
    main()
