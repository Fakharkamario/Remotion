"""Builds assets/audio.m4a: the cut voice, sound design cued from assets/plan.js, and a quiet music bed.

Everything besides the voice is synthesized here (seeded noise and sine partials): no third-party samples.

    python3 scripts/build_audio.py        # needs numpy and ffmpeg
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(11)

plan_src = open(os.path.join(A, "plan.js")).read()
PLAN = json.loads(plan_src[plan_src.index("{"): plan_src.rindex("}") + 1])
DUR = PLAN["duration"]
CUE = PLAN["sfx"]


def env(n, attack, release):
    a = np.clip(np.arange(n) / max(1, attack * SR), 0, 1)
    return a * np.exp(-np.arange(n) / max(1, release * SR))


def lp(x, cut):
    """one-pole lowpass, per-sample cutoff allowed (vectorised in blocks)."""
    y = np.empty_like(x)
    k = np.broadcast_to(1 - np.exp(-2 * np.pi * np.asarray(cut, dtype=float) / SR), x.shape)
    acc = 0.0
    for i in range(len(x)):
        acc += k[i] * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(dur=0.34, lo=300, hi=6000, peak=0.6):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    u = np.linspace(0, 1, n)
    sweep = lo * (hi / lo) ** np.clip(u / peak, 0, 1)
    band = lp(noise, sweep) - lp(noise, sweep * 0.3)
    shape = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak) * 5))
    return band * shape


def pop(f0=1100, f1=300, dur=0.08):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    fr = f1 + (f0 - f1) * np.exp(-tt / 0.015)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.001, 0.025)


def click(freq=2600, dur=0.03):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    burst = rng.standard_normal(n) * np.exp(-tt / 0.0015)
    return 0.7 * (burst - lp(burst, 1800)) + 0.4 * np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.006)


def hit(dur=0.6):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    fr = 45 + 80 * np.exp(-tt / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.002, 0.2)
    snap = rng.standard_normal(n) * np.exp(-tt / 0.01)
    return body + 0.3 * (snap - lp(snap, 1200))


def ding(f=1567.98, dur=0.6):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / (0.25 / m)) for m, a in [(1, 1), (2, 0.35), (3.01, 0.12)]) * env(n, 0.002, 10)


def riser(dur=0.7, f0=300, f1=1400):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    u = tt / dur
    ph = 2 * np.pi * np.cumsum(f0 * (f1 / f0) ** u) / SR
    noise = rng.standard_normal(n)
    air = noise - lp(noise, 3000)
    return (0.6 * np.sin(ph) + 0.4 * air) * u ** 2


def thud(dur=0.12):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(90 + 120 * np.exp(-tt / 0.02)) / SR) * env(n, 0.001, 0.04)


# ------------------------------------------------------------------ music bed: soft keys + kick/shaker, 100 bpm
def music(total):
    bpm = 100
    beat = 60 / bpm
    out = np.zeros(total)
    # Am  F  C  G  (one bar each)
    chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = 4 * beat
    nbars = int(DUR / bar) + 2
    for b in range(nbars):
        ch = chords[b % 4]
        for hit_beat in (0, 1.5, 2.5):  # syncopated stabs
            t0 = b * bar + hit_beat * beat
            i0 = int(t0 * SR)
            n = int(beat * 1.6 * SR)
            if i0 >= total:
                continue
            tt = np.arange(n) / SR
            s = np.zeros(n)
            for m in ch:
                f = hz(m)
                s += (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.45)
            s *= env(n, 0.006, 10) * (0.9 if hit_beat == 0 else 0.6)
            seg = out[i0:i0 + n]
            seg += s[: len(seg)] * 0.05
        # bass on beat 1
        i0 = int(b * bar * SR)
        n = int(bar * 0.9 * SR)
        if i0 < total:
            tt = np.arange(n) / SR
            s = np.sin(2 * np.pi * hz(ch[0] - 12) * tt) * env(n, 0.01, 0.9)
            seg = out[i0:i0 + n]
            seg += s[: len(seg)] * 0.09
        for q in range(4):  # kick + shaker
            i0 = int((b * bar + q * beat) * SR)
            if i0 >= total:
                continue
            k = thud(0.18) * 0.15
            seg = out[i0:i0 + len(k)]
            seg += k[: len(seg)]
            j0 = int((b * bar + (q + 0.5) * beat) * SR)
            sh = rng.standard_normal(int(0.05 * SR))
            sh = (sh - lp(sh, 6000)) * np.exp(-np.arange(len(sh)) / (0.012 * SR)) * 0.05
            seg = out[j0:j0 + len(sh)]
            seg += sh[: len(seg)]
    # gentle fade in/out
    fade = np.ones(total)
    fi = int(0.4 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fo = int(1.2 * SR)
    fade[-fo:] = np.linspace(1, 0, fo)
    return out * fade


def read_wav(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        return a.reshape(-1, w.getnchannels()).mean(axis=1)


def main():
    total = int(DUR * SR)
    sfx = np.zeros(total + SR * 2)

    def at(t, sig, gain):
        i = int(round(t * SR))
        if i < 0:
            sig = sig[-i:]; i = 0
        sfx[i:i + len(sig)] += gain * sig / (np.max(np.abs(sig)) + 1e-9)

    for t in CUE["whoosh"]:
        at(t - 0.2, whoosh(0.32), 0.22)
    for t in CUE["hit"]:
        at(t, hit(), 0.42)
    for t in CUE["pop"]:
        at(t, pop(1000 + rng.uniform(-150, 150), 280), 0.16)
    for t in CUE["click"]:
        at(t, click(), 0.2)
    for t in CUE["ding"]:
        at(t, ding(), 0.11)
    for t in CUE["bounce"]:
        at(t, thud(), 0.3)
    for t, d in CUE["riser"]:
        at(t, riser(d), 0.1)
    for t in CUE.get("alarm", []):
        for k in range(3):
            at(t + k * 0.13, pop(1500, 1200, 0.09), 0.13)
    a, b = CUE["type"]
    t = a
    while t < b:
        at(t, click(2200 + rng.uniform(-300, 300), 0.02), 0.09)
        t += rng.uniform(0.06, 0.11)
    for t in PLAN["flash"]:
        at(t - 0.25, whoosh(0.3, 800, 9000, 0.8), 0.12)

    # voice: high-pass, gentle presence lift, compression, then loudness-match
    vtmp = os.path.join(A, "_v.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(A, "voice.wav"), "-af",
                    "highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-1.5,"
                    "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3,alimiter=limit=0.9",
                    "-ar", str(SR), "-ac", "1", vtmp], check=True)
    voice = read_wav(vtmp)
    os.remove(vtmp)
    voice = np.pad(voice, (0, max(0, total - len(voice))))[:total]

    bed = music(total)
    # duck the bed under the voice (envelope follower)
    lev = np.abs(voice)
    k = 1 - np.exp(-1 / (0.08 * SR))
    acc, envv = 0.0, np.empty(total)
    for i in range(0, total, 64):
        m = lev[i:i + 64].max()
        acc += (m - acc) * (1 - (1 - k) ** 64)
        envv[i:i + 64] = acc
    duck = 1 - 0.55 * np.clip(envv / 0.25, 0, 1)
    mix = voice + 0.7 * sfx[:total] + 0.75 * bed * duck
    mix = mix / max(1.0, np.max(np.abs(mix)) / 0.98)
    tmp = os.path.join(A, "_mix.wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", "48000", "-ac", "2",
                    "-c:a", "aac", "-b:a", "192k", os.path.join(A, "audio.m4a")], check=True)
    os.remove(tmp)
    print("wrote assets/audio.m4a")


if __name__ == "__main__":
    main()
