"""Builds assets/audio.m4a: the voice (cleaned up, -14 LUFS master) plus synthesized sound design cued to the frames
in assets/scene.js and a soft pad bed that ducks under the voice.

Everything here is generated (seeded noise and sine partials), so there are no third-party samples to license.

    python3 scripts/build_audio.py        # needs numpy and ffmpeg
"""
import os
import subprocess
import wave

import numpy as np

SR = 48000
FPS = 30
DUR = 1644 / FPS
HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(7)
N = int(DUR * SR)


def lp(x, cut):
    """One-pole lowpass (cut may be an array, Hz), vectorised in chunks via a running filter."""
    k = 1 - np.exp(-2 * np.pi * np.broadcast_to(np.asarray(cut, dtype=np.float64), x.shape) / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += k[i] * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(dur=0.42, lo=300, hi=6000, peak=0.6, g=0.5):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    cut = lo * (hi / lo) ** np.sin(np.pi / 2 * np.minimum(u / peak, 1)) * np.where(u > peak, 1 - 0.7 * (u - peak) / (1 - peak), 1)
    band = lp(noise, cut) - lp(noise, cut * 0.2)
    shape = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak) * 5))
    return g * band * shape


def pop(freq=900, dur=0.12, g=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 0.8 * np.exp(-t / 0.012))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return g * np.sin(ph) * np.exp(-t / 0.035) * np.minimum(1, t / 0.002)


def tick(freq=3200, g=0.12):
    n = int(0.025 * SR)
    t = np.arange(n) / SR
    burst = rng.standard_normal(n) * np.exp(-t / 0.0025)
    return g * ((burst - lp(burst, 1800)) * 0.7 + np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.006) * 0.5)


def printer(dur=0.3, g=0.16):
    n = int(dur * SR)
    out = np.zeros(n)
    step = int(SR / 55)
    for i in range(0, n - 1200, step):
        tk = tick(2200 + rng.uniform(-300, 300), 1.0)
        out[i:i + len(tk)] += tk * rng.uniform(0.6, 1.0)
    return g * out


def hit(g=0.6):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    noise = rng.standard_normal(n)
    crack = lp(noise, 3500) * np.exp(-t / 0.03) * 0.5
    return g * (body + crack)


def ding(g=0.32):
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * fr * t) * np.exp(-t / d) for fr, a, d in [(1568, 1, 0.5), (2093, 0.6, 0.35), (3136, 0.3, 0.2), (4186, 0.15, 0.12)])
    return g * s * np.minimum(1, t / 0.003)


def riser(dur=0.5, g=0.25):
    return whoosh(dur, 200, 4500, 0.92, g)


def add(buf, sig, frame, gain=1.0):
    i = int(frame / FPS * SR)
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    buf[i:j] += gain * sig[: j - i]


def bed():
    """Soft pad: Am - F - C - G, two bars each at 96 bpm, sine partials with slow attack, plus a gentle pulse."""
    t = np.arange(N) / SR
    bar = 4 * 60 / 96
    chords = [[57, 60, 64], [53, 57, 60], [48, 55, 60, 64], [55, 59, 62]]
    out = np.zeros(N)
    seg = 2 * bar
    for ci in range(int(DUR / seg) + 1):
        notes = chords[ci % 4]
        a, b = ci * seg, (ci + 1) * seg
        i0, i1 = int(a * SR), min(N, int((b + 1.2) * SR))
        if i0 >= N:
            break
        tt = t[i0:i1] - a
        env = np.minimum(1, tt / 0.9) * np.exp(-np.maximum(0, tt - seg) / 0.5)
        for m in notes:
            fr = 440 * 2 ** ((m - 69) / 12)
            out[i0:i1] += env * (np.sin(2 * np.pi * fr * tt) + 0.3 * np.sin(2 * np.pi * 2 * fr * tt + 0.3) + 0.12 * np.sin(2 * np.pi * 3 * fr * tt)) / len(notes)
        root = 440 * 2 ** ((notes[0] - 12 - 69) / 12)
        for k in range(8):
            bt = k * bar / 4
            j0 = i0 + int(bt * SR)
            if j0 >= N:
                break
            n = min(int(0.35 * SR), N - j0)
            tb = np.arange(n) / SR
            out[j0:j0 + n] += 0.5 * np.sin(2 * np.pi * root * tb) * np.exp(-tb / 0.18) * np.minimum(1, tb / 0.01)
    return out / np.max(np.abs(out))


def main():
    with wave.open(os.path.join(A, "voice.wav")) as w:
        v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    voice = np.zeros(N)
    voice[: min(N, len(v))] = v[:N]

    sfx = np.zeros(N)
    for fr in [40, 146, 268, 606, 756, 935, 1050, 1194, 1226, 1380, 1486]:
        add(sfx, whoosh(), fr - 6)
    add(sfx, riser(0.6, 0.3), 600)
    for fr, f0 in [(48, 520), (100, 620), (112, 900), (290, 760), (322, 520), (422, 980), (482, 700), (600, 1100),
                   (973, 1050), (1060, 600), (1105, 600), (1184, 1100), (1231, 520), (1336, 1050), (1354, 900),
                   (1387, 520), (1424, 980), (1470, 1200), (1586, 760)]:
        add(sfx, pop(f0), fr)
    for i in range(6):
        add(sfx, pop(700 + i * 110, g=0.28), 1009 + i * 4)
    for i in range(3):
        add(sfx, pop(640 + i * 90, g=0.25), 1443 + i * 5)
    # the title typing out
    keys = [[344, 0], [361, 7], [374, 12], [398, 16], [413, 21]]
    prev = 0
    for f in range(344, 414):
        n = int(round(np.interp(f, [k[0] for k in keys], [k[1] for k in keys])))
        if n > prev:
            add(sfx, tick(3000 + rng.uniform(-400, 400), 0.16), f)
        prev = n
    # voice-prompt words, counter clicks
    for f in [1146, 1153, 1160, 1170, 1177, 1188]:
        add(sfx, tick(2600, 0.1), f)
    prev = 0
    for f in range(503, 541):
        n = int(round(15 * (1 - (1 - min(1, (f - 503) / 37)) ** 3)))
        if n > prev:
            add(sfx, tick(2400 + n * 60, 0.14), f)
        prev = n
    for f in range(576, 599, 2):
        add(sfx, tick(1900, 0.08), f)
    # receipt: it slides up, the rows print, the total rolls and dings
    add(sfx, whoosh(0.6, 200, 3000, 0.4, 0.55), 610)
    for f in [686, 736, 801, 844, 898]:
        add(sfx, printer(0.3), f)
    for f in range(848, 875, 2):
        add(sfx, tick(3400, 0.09), f)
    add(sfx, ding(), 876)
    add(sfx, ding(0.22), 1325)
    # words behind him
    for f in [241, 1205, 1557]:
        add(sfx, hit(), f)
    add(sfx, whoosh(0.3, 800, 7000, 0.3, 0.3), 1315)
    add(sfx, tick(1800, 0.3), 1604)
    add(sfx, pop(1300, g=0.3), 1605)

    # pad bed, ducked under the voice
    env = np.convolve(np.abs(voice), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
    duck = 1 - 0.55 * np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
    duck = np.convolve(duck, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode="same")
    pad = bed() * duck * 0.07
    t = np.arange(N) / SR
    pad *= np.minimum(1, t / 1.0) * np.clip((DUR - t) / 1.5, 0, 1)

    mix = voice * 1.0 + sfx * 0.45 + pad
    mix *= np.clip((DUR - t) / 0.45, 0, 1)
    tmp = os.path.join(A, "_mix.wav")
    with wave.open(tmp, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix / max(1.0, np.max(np.abs(mix)) * 1.05), -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                    "highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-14:TP=-1.5:LRA=9",
                    "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "256k", os.path.join(A, "audio.m4a")], check=True)
    os.remove(tmp)
    print("wrote assets/audio.m4a")


if __name__ == "__main__":
    main()
