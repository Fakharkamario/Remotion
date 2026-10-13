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
DUR = 726 / 30
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

    # S1: small words pop, five chips pop, 筛选股票 flashes in
    for f in (9, 18):
        at(f, pop(760, 230), 0.07)
    for i, f in enumerate((34, 36, 38, 40, 42)):
        at(f, pop(900 + 120 * i, 300, 0.05), 0.09)
    at(52, hit(0.4), 0.22)
    # S2: punch in; pops; 死拿 lands and grips
    at(83, pop(400, 120, 0.12), 0.12)
    for f in (85, 101, 123):
        at(f, pop(760, 230), 0.07)
    at(137, hit(0.45), 0.26)
    at(144, hit(0.25), 0.14)
    # S3: lower third: bullet, title ticks, rule, mono sub
    at(166, pop(1300, 500, 0.04), 0.10)
    for f in (169, 173, 177, 184, 187):
        at(f, click(3000, 0.02), 0.06)
    at(172, whoosh(0.3, 2000, 8000, 0.3), 0.07)
    for f in range(176, 196, 2):
        at(f, click(4200, 0.012), 0.04)
    # S4: into the dark; circle pops; pixels; the arrow swings down on 跌
    at(197 - 0.35 * 0.55 * FPS, whoosh(0.35), 0.24)
    at(198, pop(700, 200, 0.1), 0.14)
    for f in np.arange(200, 214, 0.8):
        at(f, click(5200, 0.01), 0.03)
    at(222, whoosh(0.18, 3000, 300, 0.2), 0.20)
    at(223, hit(0.4), 0.24)
    # S5: thin words, 预期空间
    for f in (259, 263, 268, 274, 281):
        at(f, click(3000, 0.02), 0.06)
    for f in (285, 290, 295, 299):
        at(f, pop(700, 190, 0.11), 0.11)
    # S6: 卖掉
    at(306, pop(400, 120, 0.12), 0.12)
    for f in (310, 317):
        at(f, pop(760, 230), 0.07)
    at(326, hit(0.45), 0.26)
    # S7: 砍掉, the slash
    for f in (344, 353, 384, 394):
        at(f, pop(760, 230), 0.07)
    at(405, hit(0.45), 0.24)
    at(409, whoosh(0.14, 1800, 9000, 0.25), 0.28)
    at(411, click(1500, 0.04), 0.14)
    # S8: thin words, 谈恋爱, the heart, the scrawl
    for f in (418, 423, 429, 432, 441, 445, 448, 454, 459):
        at(f, click(3000, 0.02), 0.05)
    for f in (465, 468, 472):
        at(f, pop(700, 190, 0.11), 0.11)
    at(470, riser(0.4, 500, 900), 0.04)
    at(481, whoosh(0.18, 1200, 6000, 0.4), 0.14)
    # S9: cards slide; the pill types; the good card lands
    at(488 - 0.35 * 0.55 * FPS, whoosh(0.35), 0.24)
    for f in (490, 495, 501, 504, 510, 513, 517):
        at(f, click(2800, 0.025), 0.08)
    for f in (509, 517):
        at(f, whoosh(0.25, 500, 4000, 0.5), 0.14)
    at(519, ding(1568, 0.6), 0.10)
    # S10: the ring turns
    at(526, riser(0.7, 300, 700), 0.05)
    for f in (529, 533, 540, 544):
        at(f, pop(700, 190, 0.1), 0.10)
    # S11: chips light up one by one
    for f in (555, 564):
        at(f, pop(760, 230), 0.07)
    for i, f in enumerate((573, 576, 579, 582, 585)):
        at(f, ding(880 * 2 ** (i * 2 / 12), 0.35), 0.07)
    # S12: 飙股 shoots up
    at(590, pop(400, 120, 0.12), 0.12)
    for f in (592, 600, 619):
        at(f, pop(760, 230), 0.07)
    at(636, riser(0.12, 400, 1600), 0.12)
    at(639, hit(0.45), 0.26)
    # S13: the clock: ring draws, hands race and slow
    at(661 - 0.35 * 0.55 * FPS, whoosh(0.35), 0.22)
    at(662, whoosh(0.4, 600, 5000, 0.5), 0.08)
    for f in np.arange(666, 700, 1.5):
        at(f, click(5200, 0.008), 0.04)
    for f in (693, 699, 706, 709):
        at(f, pop(700, 190, 0.1), 0.10)
    at(715, ding(1046.5, 1.0), 0.10)

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
