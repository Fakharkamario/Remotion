"""
Synthesises the Plantea promo soundtrack: an original music bed plus UI/motion
sound effects. Everything is generated from oscillators and noise - no samples.

    python3 scripts/generate-audio.py

Writes 48 kHz stereo WAVs to public/audio/. Cue placement lives in
src/audio/SoundDesign.tsx, so timing can be tweaked without regenerating.
"""
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS = 30
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, d=0.1, s=0.0, r=0.05, dur=None):
    """ADSR envelope of n samples (times in seconds)."""
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    sus_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)) ** 1.5,
        np.linspace(1, s, max(d_n, 1)) if d_n else np.array([]),
        np.full(sus_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    e = np.pad(e, (0, max(0, n - len(e))))[:n]
    return e


def exp_decay(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100) / (SR / 2), "low", output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), "high", output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def sweep_filter(x, f_start, f_end, q_width=0.6, steps=64, kind="band"):
    """Time-varying band/low-pass, done in short overlapping blocks."""
    out = np.zeros_like(x)
    n = len(x)
    block = int(np.ceil(n / steps))
    win = np.hanning(block * 2)
    for i in range(steps * 2 - 1):
        start = i * block // 2
        seg = x[start:start + block * 2]
        if len(seg) == 0:
            break
        pos = min(1.0, start / max(n - 1, 1))
        f = f_start * (f_end / f_start) ** pos
        if kind == "band":
            y = bp(seg, max(40, f * (1 - q_width)), min(SR / 2 - 200, f * (1 + q_width)))
        else:
            y = lp(seg, f)
        out[start:start + len(seg)] += y * win[:len(seg)] * 0.5
    return out


def reverb_ir(dur=2.0, damp=4000, seed=1):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    left = r.standard_normal(n) * exp_decay(n, dur / 6)
    right = r.standard_normal(n) * exp_decay(n, dur / 6)
    return lp(left, damp), lp(right, damp)


IR_SMALL = reverb_ir(0.8, 6000, 2)
IR_BIG = reverb_ir(3.0, 3500, 3)


def stereo_verb(mono, wet=0.25, ir=IR_SMALL):
    l = fftconvolve(mono, ir[0])[: len(mono)]
    r = fftconvolve(mono, ir[1])[: len(mono)]
    norm = np.max(np.abs(np.concatenate([l, r]))) + 1e-9
    peak = np.max(np.abs(mono)) + 1e-9
    l, r = l / norm * peak, r / norm * peak
    return np.stack([mono * (1 - wet) + l * wet, mono * (1 - wet) + r * wet], axis=1)


def pad_tail(x, sec):
    return np.concatenate([x, np.zeros(int(sec * SR))])


def save(name, data, peak_db=-1.0):
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    peak = np.max(np.abs(data)) + 1e-9
    data = data / peak * 10 ** (peak_db / 20)
    # 4 ms fade to avoid clicks
    f = int(0.004 * SR)
    data[:f] *= np.linspace(0, 1, f)[:, None]
    data[-f:] *= np.linspace(1, 0, f)[:, None]
    os.makedirs(OUT, exist_ok=True)
    wavfile.write(os.path.join(OUT, name), SR, (data * 32767).astype(np.int16))
    print(f"  {name:22s} {len(data) / SR:5.2f}s")


def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# ---------------------------------------------------------------- SFX
def whoosh(dur=0.6, f0=300, f1=3000, peak=0.55, bright=1.0):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    x = sweep_filter(noise, f0, f1, 0.5)
    shape = np.sin(np.pi * np.clip(np.linspace(0, 1, n) / peak, 0, 1) * 0.5) ** 2
    shape *= np.where(np.linspace(0, 1, n) > peak,
                      np.cos(np.pi * 0.5 * (np.linspace(0, 1, n) - peak) / (1 - peak)) ** 2, 1)
    x = x * shape
    if bright < 1:
        x = lp(x, 2000 + 6000 * bright)
    return stereo_verb(pad_tail(x, 0.4), 0.3)


def pop(f_hi=1100, f_lo=380, dur=0.09):
    t = t_axis(dur)
    f = f_lo + (f_hi - f_lo) * np.exp(-t / 0.012)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * exp_decay(len(t), 0.025)
    click = hp(rng.standard_normal(len(t)), 3000) * exp_decay(len(t), 0.002) * 0.25
    return stereo_verb(pad_tail(body + click, 0.25), 0.18)


def tick(f=3200, dur=0.04):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * f * t) * exp_decay(len(t), 0.006)
    x += hp(rng.standard_normal(len(t)), 5000) * exp_decay(len(t), 0.0015) * 0.4
    return stereo_verb(pad_tail(x, 0.15), 0.15)


def tap():
    """Finger tap on a glass button: click + soft low body + bright blip."""
    t = t_axis(0.25)
    n = len(t)
    click = hp(rng.standard_normal(n), 2500) * exp_decay(n, 0.0025) * 0.6
    body = np.sin(2 * np.pi * 180 * t) * exp_decay(n, 0.03) * 0.8
    blip_t = np.clip(t - 0.035, 0, None)
    blip = np.sin(2 * np.pi * note(88) * blip_t) * exp_decay(n, 0.07) * (t > 0.035) * 0.35
    blip += np.sin(2 * np.pi * note(95) * blip_t) * exp_decay(n, 0.05) * (t > 0.035) * 0.15
    return stereo_verb(pad_tail(click + body + blip, 0.4), 0.22)


def shimmer(dur=1.0, base=84, count=26, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    out = np.zeros((n, 2))
    scale = [0, 2, 4, 7, 9, 12, 14, 16, 19]
    for i in range(count):
        start = int(r.uniform(0, 0.75) * n)
        f = note(base + r.choice(scale))
        ln = n - start
        tt = np.arange(ln) / SR
        g = np.sin(2 * np.pi * f * tt) * exp_decay(ln, r.uniform(0.08, 0.25)) * r.uniform(0.3, 1)
        pan = r.uniform(0.2, 0.8)
        out[start:, 0] += g * (1 - pan)
        out[start:, 1] += g * pan
    swell = np.sin(np.pi * np.linspace(0, 1, n)) ** 0.7
    out *= swell[:, None]
    l = stereo_verb(pad_tail(out[:, 0], 0.8), 0.45, IR_BIG)
    rr = stereo_verb(pad_tail(out[:, 1], 0.8), 0.45, IR_BIG)
    return np.stack([l[:, 0], rr[:, 1]], axis=1)


def thump(f0=110, f1=42, dur=0.6):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * exp_decay(len(t), 0.18)
    x += lp(rng.standard_normal(len(t)), 400) * exp_decay(len(t), 0.03) * 0.3
    return stereo_verb(pad_tail(np.tanh(x * 1.4), 0.4), 0.2, IR_BIG)


def scan(dur=1.4):
    """Soft digital scanner: filtered hum with tremolo + down/up sweep + data ticks."""
    t = t_axis(dur)
    n = len(t)
    hum = (np.sin(2 * np.pi * 220 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * 0.25
    hum *= 0.6 + 0.4 * np.sin(2 * np.pi * 18 * t)
    # Sweep follows the scan line: down (high -> low) then back up
    pos = np.interp(t, [0, dur * 0.5, dur], [1, 0, 0.8])
    f = 600 + pos * 1400
    sw = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18
    air = sweep_filter(rng.standard_normal(n), 2500, 5000, 0.3) * 0.25
    x = (hum + sw + air) * env(n, 0.12, 0.0, 1.0, 0.35)
    for k in np.arange(0.05, dur - 0.1, 0.09):
        i = int(k * SR)
        ln = int(0.02 * SR)
        x[i:i + ln] += np.sin(2 * np.pi * rng.choice([2600, 3100, 3500]) * np.arange(ln) / SR) \
            * exp_decay(ln, 0.004) * 0.12
    return stereo_verb(pad_tail(x, 0.5), 0.3)


def typing(count=8, gap=0.066):
    n = int((count * gap + 0.3) * SR)
    x = np.zeros(n)
    for i in range(count):
        s = int(i * gap * SR + rng.uniform(-0.006, 0.006) * SR)
        s = max(s, 0)
        k = tick(rng.uniform(2400, 3600), 0.03)[:, 0] * rng.uniform(0.5, 1)
        x[s:s + len(k)] += k[: n - s]
    return stereo_verb(x, 0.15)


def bell(midi, dur=1.6, ratio=3.5, index=2.0):
    t = t_axis(dur)
    fc = note(midi)
    mod = np.sin(2 * np.pi * fc * ratio * t) * index * exp_decay(len(t), 0.25)
    return np.sin(2 * np.pi * fc * t + mod) * exp_decay(len(t), 0.5)


def chime():
    """Two-note 'diagnosis ready' success chime."""
    dur = 1.8
    n = int(dur * SR)
    x = np.zeros(n)
    for delay, m, g in [(0.0, 81, 0.8), (0.11, 88, 1.0), (0.11, 76, 0.35)]:
        s = int(delay * SR)
        b = bell(m, dur - delay)
        x[s:s + len(b)] += b * g
    return stereo_verb(x, 0.4, IR_BIG)


def rise(dur=0.4, f0=500, f1=1500):
    t = t_axis(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.05, 0, 1, 0.2) * 0.4
    return stereo_verb(pad_tail(x, 0.3), 0.3)


def reverse_swell(dur=0.45):
    """Reversed-reverb style swell that sucks into the logo hit."""
    n = int(dur * SR)
    noise = sweep_filter(rng.standard_normal(n), 400, 6000, 0.6)
    tone = sum(np.sin(2 * np.pi * note(m) * np.arange(n) / SR) for m in (62, 69, 74)) * 0.2
    x = (noise * 0.6 + tone) * np.linspace(0, 1, n) ** 3
    return stereo_verb(x, 0.4, IR_BIG)


def logo_hit():
    dur = 2.4
    t = t_axis(dur)
    n = len(t)
    chord = np.zeros(n)
    for m, g in [(50, 0.9), (57, 0.6), (62, 0.6), (66, 0.45), (69, 0.4), (74, 0.3), (78, 0.2)]:
        f = note(m)
        chord += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * g
    chord = lp(chord, 3500) * exp_decay(n, 0.9) * env(n, 0.01, 0, 1, 0.3)
    bel = bell(86, dur) * 0.35 + bell(81, dur) * 0.25
    sub = thump(90, 38, dur)[:n, 0] * 0.8
    return stereo_verb(chord * 0.5 + bel + sub, 0.35, IR_BIG)


# ---------------------------------------------------------------- music
BPM = 96
BEAT = 60 / BPM


def pluck(midi, dur=0.5, bright=2500, amp=1.0):
    t = t_axis(dur)
    f = note(midi)
    saw = 2 * ((f * t) % 1) - 1
    tri = 2 * np.abs(2 * ((f * t + 0.25) % 1) - 1) - 1
    x = 0.4 * saw + 0.6 * tri
    cutoff_env = exp_decay(len(t), 0.08)
    x = lp(x, bright) * 0.5 + lp(x, 600) * 0.5 * (1 - cutoff_env)
    return x * exp_decay(len(t), 0.22) * env(len(t), 0.003, 0, 1, 0.05) * amp


def pad(midis, dur, cutoff=1200):
    t = t_axis(dur)
    x = np.zeros(len(t))
    for m in midis:
        for det in (-0.08, 0.0, 0.08):
            f = note(m + det)
            x += 2 * ((f * t + rng.uniform()) % 1) - 1
    x = lp(x, cutoff, 2) / (len(midis) * 3)
    return x * env(len(t), 0.4, 0, 1, 0.6)


def kick():
    t = t_axis(0.35)
    f = 45 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * exp_decay(len(t), 0.12)


def hat():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n), 7000) * exp_decay(n, 0.012)


def music(total):
    n = int(total * SR)
    mel = np.zeros(n)
    pads = np.zeros(n)
    drums = np.zeros(n)

    def put(buf, x, sec, gain=1.0):
        s = int(sec * SR)
        if s >= n:
            return
        e = min(n, s + len(x))
        buf[s:e] += x[: e - s] * gain

    # Sections (seconds), aligned to the picture.
    room_in = 60 / FPS     # 2.0s room reveal
    diag = 194 / FPS       # 6.47s diagnosis
    logo = 338 / FPS       # 11.27s logo hit

    # Intro: sparse, slightly sad plucks (B minor)
    for i, m in enumerate([71, 74, 78, 76]):
        put(mel, pluck(m, 0.7, 1800, 0.55), 0.05 + i * BEAT)
    put(pads, pad([47, 54, 59, 62], room_in + 0.3, 900), 0.0, 0.5)

    # Room + scan: Bm -> G pulse, ticking hats
    chords = [[47, 54, 59, 62], [43, 50, 55, 59], [47, 54, 59, 62], [45, 52, 57, 61]]
    t0 = room_in
    k = 0
    while t0 < diag - 0.05:
        ch = chords[k % 4]
        put(pads, pad(ch, BEAT * 2 + 0.6, 1100), t0, 0.7)
        for j in range(4):
            put(mel, pluck(ch[2] + 12 if j % 2 == 0 else ch[3] + 12, 0.35, 2200, 0.35), t0 + j * BEAT / 2)
            put(drums, hat(), t0 + j * BEAT / 2 + BEAT / 4, 0.25)
        t0 += BEAT * 2
        k += 1

    # Diagnosis -> rooms -> tagline: brighter D major, kick on beats
    bright = [[50, 57, 62, 66], [45, 52, 57, 61], [47, 54, 59, 62], [43, 50, 55, 59]]
    arp = [0, 2, 3, 2, 1, 3, 2, 3]
    t0 = diag
    k = 0
    while t0 < logo - 0.35:
        ch = bright[k % 4]
        put(pads, pad(ch, BEAT * 2 + 0.6, 1800), t0, 0.8)
        for j in range(8):
            ts = t0 + j * BEAT / 4
            if ts < logo - 0.35:
                put(mel, pluck(ch[arp[j]] + 12, 0.4, 3200, 0.45), ts)
        for j in range(2):
            put(drums, kick(), t0 + j * BEAT, 0.9)
            put(drums, hat(), t0 + j * BEAT + BEAT / 2, 0.35)
        t0 += BEAT * 2
        k += 1

    # Logo: resolve on a held D major bloom
    put(pads, pad([50, 57, 62, 66, 69], total - logo + 0.2, 2200), logo, 0.9)
    put(mel, pluck(74, 1.2, 2600, 0.5), logo)
    put(mel, pluck(78, 1.2, 2600, 0.35), logo + BEAT / 2)
    put(mel, pluck(81, 1.4, 2600, 0.3), logo + BEAT)

    mix = stereo_verb(mel, 0.35, IR_BIG) * 0.9
    mix += stereo_verb(pads, 0.5, IR_BIG) * 0.8
    mix += stereo_verb(drums, 0.1) * 0.7
    # Soft master: gentle saturation + fades
    mix = np.tanh(mix * 1.2)
    fade_in = int(0.3 * SR)
    mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    fade_out = int(0.6 * SR)
    mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5
    return mix


if __name__ == "__main__":
    total = 370 / FPS
    print("Generating audio ->", os.path.abspath(OUT))
    save("music.wav", music(total), -3)
    save("whoosh-soft.wav", whoosh(0.5, 600, 4000, 0.6, 0.5))
    save("whoosh-in.wav", whoosh(0.55, 400, 3500, 0.75))
    save("whoosh-big.wav", whoosh(0.8, 200, 2500, 0.8))
    save("whoosh-out.wav", whoosh(0.5, 2500, 500, 0.3, 0.6))
    save("whoosh-pan.wav", whoosh(1.4, 300, 1800, 0.5, 0.4))
    save("pop.wav", pop())
    save("pop-high.wav", pop(1600, 650, 0.07))
    save("tick.wav", tick())
    save("tap.wav", tap())
    save("shimmer.wav", shimmer(1.0, 84, 26, 1))
    save("sparkle.wav", shimmer(0.6, 91, 14, 2))
    save("thump.wav", thump())
    save("scan.wav", scan(1.4))
    save("typing.wav", typing(8, 0.066))
    save("chime.wav", chime())
    save("rise.wav", rise())
    save("reverse-swell.wav", reverse_swell())
    save("logo-hit.wav", logo_hit())
