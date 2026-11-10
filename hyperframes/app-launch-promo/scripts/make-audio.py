#!/usr/bin/env python3
"""Builds the two soundtracks for the promo (21 s, 44.1 kHz stereo).

  assets/voiceover.mp3  the supplied read, cut into its five phrases and re-spaced so each phrase lands on its shot
  assets/music.mp3      an original bed synthesised here (100 BPM, F major) plus soft sound effects on the moves;
                        it ducks under the voice and opens up in the pauses

Usage: python3 scripts/make-audio.py path/to/source-voiceover.mp3
Needs numpy and ffmpeg.
"""
import subprocess, sys, os, wave
import numpy as np

SR, FPS, DUR = 44100, 30, 21.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(7)


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def encode(path, stereo):
    tmp = path + ".wav"
    with wave.open(tmp, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(stereo, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-c:a", "libmp3lame", "-b:a", "192k", path], check=True)
    os.remove(tmp)


# ---------- voiceover: (source in, source out, frame the phrase's first sound lands on, source time of that sound)
SEGS = [(0.00, 1.17, 18, 0.00), (1.20, 2.98, 69, 1.37), (3.00, 8.72, 150, 3.24), (8.75, 12.05, 362, 8.97), (12.08, 13.40, 505, 12.25)]
src = decode(sys.argv[1])
vo = np.zeros(N)
for a, b, frame, onset in SEGS:
    seg = src[int(a * SR):int(b * SR)].copy()
    fade = int(0.02 * SR)
    seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    at = int((frame / FPS - (onset - a)) * SR)
    vo[at:at + len(seg)] += seg
vo *= 0.9 / np.max(np.abs(vo))
encode(os.path.join(ASSETS, "voiceover.mp3"), np.stack([vo, vo], 1))

# ---------- music
L, R = np.zeros(N), np.zeros(N)
BEAT = 0.6
BAR = 4 * BEAT
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def add(buf_l, buf_r, sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i] * gain
    buf_l[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    buf_r[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def shaped_noise(n, lo, hi):
    """White noise band-limited with soft edges (frequency-domain mask)."""
    spec = np.fft.rfft(rng.standard_normal(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    mask = 1 / (1 + (lo / np.maximum(fr, 1)) ** 4) / (1 + (fr / hi) ** 4)
    return np.fft.irfft(spec * mask, n)


def lowpass(x, cut):
    spec = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(spec / (1 + (fr / cut) ** 4), len(x))


def keys_note(f, dur, bright=1.0):  # warm electric-piano style tone
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(t / 0.012, 1) * np.exp(-t / (dur * 0.45))
    tone = np.sin(2 * np.pi * f * t + 1.4 * bright * np.exp(-t / 0.18) * np.sin(2 * np.pi * 2 * f * t))
    tone += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.25)
    return tone * env


def pluck(f, dur=0.5):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(t / 0.004, 1) * np.exp(-t / 0.13)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.05) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.03)) * env


def pad(f, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(t / 0.7, 1) * np.minimum((dur - t) / 0.9, 1)
    return sum(np.sin(2 * np.pi * f * d * t + ph) for d, ph in [(0.997, 0), (1.003, 1.3), (2.001, 2.1)]) / 3 * env


def kick():
    t = np.arange(int(0.32 * SR)) / SR
    return np.sin(2 * np.pi * (46 * t + 60 * 0.045 * (1 - np.exp(-t / 0.045)))) * np.exp(-t / 0.11) * np.minimum(t / 0.003, 1)


def snap():
    n = int(0.16 * SR); t = np.arange(n) / SR
    return shaped_noise(n, 1400, 5200) * np.exp(-t / 0.035)


def shaker():
    n = int(0.07 * SR); t = np.arange(n) / SR
    return shaped_noise(n, 6000, 12000) * np.exp(-t / 0.018) * np.minimum(t / 0.004, 1)


def whoosh(dur, lo=500, hi=5000, peak=0.6):
    n = int(dur * SR); t = np.arange(n) / n
    env = np.where(t < peak, (t / peak) ** 2.2, ((1 - t) / (1 - peak)) ** 1.6)
    return shaped_noise(n, lo, hi) * env


def click():
    n = int(0.09 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.006) * 0.6 + np.sin(2 * np.pi * 170 * t) * np.exp(-t / 0.03)


def bell(f, dur=1.4):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.2)) * np.exp(-t / (dur * 0.3)) * np.minimum(t / 0.003, 1)


# Fmaj9 | Am7 | Dm9 | Bbmaj7, twice, then F to finish
CHORDS = [[53, 57, 60, 64, 67], [57, 60, 64, 67, 72], [50, 53, 57, 60, 64], [58, 62, 65, 69, 72]]
BASS = [41, 45, 38, 46]
ARP = [0, 2, 4, 3, 1, 3, 4, 2]
bars = int(np.ceil(DUR / BAR))
for b in range(bars):
    t0 = b * BAR
    ch = CHORDS[b % 4] if b < 8 else CHORDS[0]
    full = 2 <= b < 8  # drums and bass join when the product shot starts
    for i, m in enumerate(ch):  # soft pad
        add(L, R, pad(midi(m), BAR + 0.8), t0, pan=(i - 2) * 0.25, gain=0.035)
    for hit, g in ([(0, 1.0), (1.5, 0.6), (2.5, 0.75)] if b < 8 else [(0, 1.0)]):  # keys
        for i, m in enumerate(ch[:4]):
            add(L, R, keys_note(midi(m), 1.6 if b < 8 else 4.0), t0 + hit * BEAT + i * 0.012, pan=(i - 1.5) * 0.2, gain=0.085 * g)
    if b < 8:
        for s in range(8):  # eighth-note plucks, an octave up, with a quiet echo
            f = midi(ch[ARP[s]] + 12)
            g = 0.075 if b >= 1 else 0.045
            add(L, R, pluck(f), t0 + s * BEAT / 2, pan=0.5 * (-1) ** s, gain=g)
            add(L, R, pluck(f), t0 + s * BEAT / 2 + BEAT * 0.75, pan=-0.5 * (-1) ** s, gain=g * 0.3)
    if full:
        for beat in (0, 2, 2.5 if b % 2 else 99):
            if beat < 4: add(L, R, kick(), t0 + beat * BEAT, gain=0.5)
        for beat in (1, 3):
            add(L, R, snap(), t0 + beat * BEAT, pan=0.1, gain=0.16)
        for s in range(8):
            add(L, R, shaker(), t0 + s * BEAT / 2, pan=0.35, gain=0.05 if s % 2 else 0.028)
        t = np.arange(int(BEAT * 1.9 * SR)) / SR
        for beat, m in ((0, BASS[b % 4]), (2, BASS[b % 4]), (3.5, BASS[b % 4] + 7)):
            d = t[:int((0.5 if beat == 3.5 else 1.4) * BEAT * SR)]
            add(L, R, (np.sin(2 * np.pi * midi(m) * d) + 0.2 * np.sin(4 * np.pi * midi(m) * d)) * np.minimum(d / 0.01, 1) * np.exp(-d / 0.5), t0 + beat * BEAT, gain=0.2)
    elif b == 8:
        add(L, R, kick(), t0, gain=0.5)
        t = np.arange(int(3.0 * SR)) / SR
        add(L, R, np.sin(2 * np.pi * midi(41) * t) * np.exp(-t / 0.9) * np.minimum(t / 0.01, 1), t0, gain=0.2)

# sound effects, placed on the picture (frames)
F = lambda fr: fr / FPS
add(L, R, whoosh(1.1, 300, 3000), F(0), pan=0.4, gain=0.10)           # pointer glides in
for i, fr in enumerate((86, 91, 96)):                                   # chips
    add(L, R, bell(midi(84 + [0, 4, 7][i]), 0.7), F(fr), pan=(-0.5, 0.5, -0.3)[i], gain=0.05)
add(L, R, click(), F(119), gain=0.22)
add(L, R, whoosh(1.0, 200, 4000, 0.7), F(120), gain=0.16)              # into the icon
add(L, R, whoosh(0.9, 400, 5000), F(204), pan=-0.3, gain=0.09)         # push into the phone
for i in range(5):                                                      # stars
    add(L, R, bell(midi(79 + 2 * i), 0.5), F(272 + i * 6), pan=-0.2 + 0.1 * i, gain=0.04)
add(L, R, bell(midi(84), 1.6), F(329), gain=0.07); add(L, R, bell(midi(89), 1.6), F(332), pan=0.3, gain=0.06)  # goal reached
add(L, R, whoosh(1.2, 250, 4500, 0.5), F(338), gain=0.16)              # wipe
add(L, R, click(), F(447), gain=0.22)
for i in range(8):                                                      # counter ticks, rising
    add(L, R, pluck(midi(77 + i), 0.2), F(456 + i * 4), pan=-0.4 + 0.1 * i, gain=0.03)
add(L, R, bell(midi(96), 1.2), F(476), pan=0.2, gain=0.05)             # downloaded
add(L, R, whoosh(1.2, 250, 4500, 0.5), F(484), gain=0.16)              # wipe
add(L, R, whoosh(0.8, 500, 5000), F(540), pan=0.4, gain=0.05)
add(L, R, click(), F(575), gain=0.24)
for i, m in enumerate((84, 88, 91, 96)):                                # closing sparkle
    add(L, R, bell(midi(m), 2.2), F(577) + i * 0.07, pan=-0.45 + 0.3 * i, gain=0.055)

mus = np.stack([lowpass(L, 9000), lowpass(R, 9000)], 1)

# duck under the voice: follow its level, hold a little, release slowly
win = int(0.03 * SR)
level = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, "same"))
gate = (level > 0.02).astype(float)
hold = int(0.35 * SR)
gate = np.minimum(np.convolve(gate, np.ones(hold), "same"), 1)
smooth = int(0.3 * SR)
gate = np.convolve(gate, np.hanning(smooth) / np.hanning(smooth).sum(), "same")
duck = 1 - 0.52 * gate
t = np.arange(N) / SR
master = np.minimum(t / 0.25, 1) * np.minimum((DUR - t) / 1.6, 1)
mus *= (duck * master)[:, None]
mus *= 0.62 / np.max(np.abs(mus))
encode(os.path.join(ASSETS, "music.mp3"), mus)
print("wrote assets/voiceover.mp3 and assets/music.mp3")
