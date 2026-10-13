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

    # hard cuts: a full whoosh into each dark scene, lighter ones back to camera
    for f, g, d in [(48, 0.30, 0.40), (70, 0.16, 0.30), (173, 0.30, 0.45)]:
        at(f - d * 0.55 * FPS, whoosh(d), g)
    # beat A: the key word flashes in
    at(18, hit(0.4), 0.22)
    at(18, pop(900, 260), 0.10)
    # beat B: typing; the cut wide; the highlighter; the smear out
    for f in (48, 53, 57, 61, 64, 67):
        at(f, click(2400 + 150 * (f % 3)), 0.17)
    at(63, whoosh(0.16, 900, 7000, 0.5), 0.12)
    at(66.5, whoosh(0.22, 600, 6000, 0.7), 0.18)
    # beat C: 避开这 pops, the 5 hits, the strike swipes
    for f in (70, 71):
        at(f, pop(760, 230), 0.08)
    at(75, hit(), 0.34)
    at(90, whoosh(0.2, 1200, 8000, 0.35), 0.18)
    # beat D: thin words tick on, the box opens, the picture washes out, flashes back in for E
    for f in (105, 109):
        at(f, click(3000, 0.02), 0.08)
    at(114, pop(1200, 400, 0.06), 0.12)
    at(116, whoosh(0.18, 1500, 7000, 0.4), 0.09)
    at(124, riser(0.47, 400, 1400), 0.08)
    at(138.5, whoosh(0.3, 2000, 9000, 0.25), 0.16)
    # beat E: the thin words, then the huge 高 / 于
    for f in (142, 149, 155):
        at(f, click(3000, 0.02), 0.07)
    for f in (163, 167):
        at(f, pop(700, 190, 0.11), 0.14)
    # beat F: the dot, the square, each split cracks open, the caret and typing, the dim sweep, the green row
    at(173, pop(1300, 500, 0.05), 0.12)
    at(175, pop(500, 160, 0.14), 0.12)
    for f in (179, 182, 186):
        at(f, click(1800, 0.03), 0.14)
        at(f, pop(1500, 900, 0.04), 0.06)
    for f in (185, 186, 187, 194, 200):
        at(f, click(2800, 0.025), 0.12)
    at(194, whoosh(0.3, 300, 2500, 0.4), 0.08)
    at(199, ding(1318.5, 0.9), 0.16)

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
