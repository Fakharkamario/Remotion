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
DUR = 442 / 30
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

    # A: the small lines pop, 思考 flashes in
    for f in (6, 21, 26):
        at(f, pop(760, 230), 0.07)
    at(37, hit(0.4), 0.22)
    at(37, pop(900, 260), 0.10)
    # B: into the dark room; letters land; the card opens from inside the word
    at(47 - 0.4 * 0.55 * FPS, whoosh(0.4), 0.30)
    for f in (48, 53, 57, 61, 66, 71):
        at(f, click(2600, 0.02), 0.08)
    at(76, whoosh(0.35, 400, 5000, 0.6), 0.20)
    at(77, riser(0.4, 300, 900), 0.06)
    for f in (78, 82, 88, 91, 98, 102):
        at(f, click(2600, 0.02), 0.08)
    # C: back to camera; 但是呢 用 pop; 逆向思维 flips in; 的方式
    at(108 - 0.3 * 0.55 * FPS, whoosh(0.3), 0.16)
    for f in (113, 123, 131, 161):
        at(f, pop(760, 230), 0.07)
    at(138, hit(0.45), 0.26)
    at(138, whoosh(0.22, 1500, 8000, 0.3), 0.14)
    # D: punch in; thin words tick on; 更 / 简 / 单
    at(171, pop(400, 120, 0.12), 0.12)
    for f in (177, 181, 186, 190, 197, 201):
        at(f, click(3000, 0.02), 0.06)
    for f in (206, 213, 219):
        at(f, pop(700, 190, 0.11), 0.13)
    # E: wide; the pill types; the 5 hits; wash to white
    at(237, pop(400, 120, 0.12), 0.10)
    for f in (237, 242, 248, 253, 257, 260):
        at(f, click(2800, 0.025), 0.09)
    at(253, hit(), 0.34)
    at(264, riser(0.38, 400, 1400), 0.08)
    # F: white card; small words; the box opens and darkens; letters typed
    for f in (277, 281, 284, 288, 295, 300):
        at(f, click(3000, 0.02), 0.06)
    at(306, pop(1200, 400, 0.06), 0.12)
    at(307, whoosh(0.2, 1500, 7000, 0.4), 0.10)
    for f in (310, 313, 316, 320, 323):
        at(f, click(2600, 0.02), 0.09)
    # G: flash back to camera; the cascade writes on
    at(336.5, whoosh(0.3, 2000, 9000, 0.25), 0.16)
    for f in (338, 347, 361, 372, 379):
        at(f, click(3000, 0.02), 0.07)
    # H: punch in; 全部 / 都会; 忘光光 flashes in, then dissolves
    at(390, pop(400, 120, 0.12), 0.12)
    for f in (390, 397):
        at(f, pop(760, 230), 0.07)
    at(406, hit(0.45), 0.26)
    at(423, whoosh(0.6, 5000, 600, 0.15), 0.14)

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
