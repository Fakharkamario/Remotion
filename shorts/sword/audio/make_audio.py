# Soundtrack for "How Sharp Can a Sword Get?": synthesized SFX on the picture's event frames (read from
# src/videos/sword/story.ts, object B), an original score (koto-like plucks in a Japanese in-scale over taiko for
# the yard, marimba + log drums for the Aztec plaza, glassy arps for the lab and the atoms, a warm koto lullaby for
# the golden ending), ducked under the voice; mix to the skill's standard (music +3 dB, SFX -6 dB, voice unchanged),
# exact picture length, 48 kHz stereo. Run: python3 make_audio.py -> mix.wav + stems/ + cues.md
import os, re
import numpy as np
from scipy.signal import lfilter
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, curve, pan, st, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, write_wav, phase, modal, colored
from instruments import m2f, brass, glock, vibes, musicbox, pluck, snare, cymbal, timpani, pad, triangle
from sfx_gen import clink, whoosh, bird_chirps, breeze, stroll_step, hammer_hit

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..", "..")
story = open(os.path.join(ROOT, "src", "videos", "sword", "story.ts")).read()
FPS = 30
TOTAL = int(re.search(r"export const TOTAL = (\d+)", story).group(1))
Bsrc = story[story.index("export const B = {"):]
Bsrc = Bsrc[:Bsrc.index("};")]
B = {k: int(v) for k, v in re.findall(r"(\w+): (\d+)", Bsrc)}
SHOT_A = [int(a) for a in re.findall(r"\{ id: \d+, a: (\d+), b:", story)]
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(2026)
cues = []
cue = lambda t, w: cues.append((t, w))
buf = lambda: np.zeros((2, N))


# ------------------------------------------------------------------ sound design
def shing(r, f0=2900, dur=1.4):
    """sword ring: inharmonic steel modes with a slow shimmer"""
    t = tt(dur)
    y = modal(dur, [(f0, 1.0, 0.5), (f0 * 1.51, 0.6, 0.35), (f0 * 2.29, 0.4, 0.25), (f0 * 3.07, 0.25, 0.18), (f0 * 0.5, 0.3, 0.3)], r)
    y *= 1 + 0.15 * np.sin(2 * np.pi * 6 * t)
    nz = r.standard_normal(len(t))
    return fades(y * 0.5 + hp(nz, 4000) * np.exp(-t / 0.05) * 0.4, 0.002, 0.2)


def scrape(r, dur=0.28, f_lo=1500, f_hi=6000, wet=True):
    t = tt(dur)
    x = bp(r.standard_normal(len(t)), f_lo, f_hi, 1) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2
    if wet:
        x += 0.25 * bp(r.standard_normal(len(t)), 300, 1200, 1) * np.sin(np.pi * np.clip(t / dur, 0, 1))
    return x * 0.5


def anvil(r):
    d = 1.6
    t = tt(d)
    ring = modal(d, [(1180, 1.0, 0.6), (2730, 0.6, 0.35), (4210, 0.4, 0.2), (6100, 0.2, 0.1)], r)
    nz = r.standard_normal(len(t))
    return fades(ring * 0.6 + bp(nz, 800, 7000, 1) * np.exp(-t / 0.006) * 1.2 + np.sin(phase(90 * (1 + np.exp(-t / 0.01)))) * np.exp(-t / 0.06), 0, 0.2)


def crackle(dur, r, rate=24):
    out = np.zeros(ns(dur))
    n = int(dur * rate)
    for _ in range(n):
        t0 = r.uniform(0, dur - 0.05)
        t = tt(0.03)
        x = hp(r.standard_normal(len(t)), 1500) * np.exp(-t / r.uniform(0.002, 0.008)) * r.uniform(0.2, 1)
        i = ns(t0); out[i:i + len(x)] += x
    out += 0.2 * lp(r.standard_normal(len(out)), 300) * 0.5
    return out


def hiss(r, dur=1.8):
    t = tt(dur)
    x = colored(len(t), r, 0.0)
    x = hp(x, 2500) * (np.clip(t / 0.02, 0, 1) * np.exp(-t / 0.6))
    return x * 0.8 + 0.4 * bubbles_lo(dur, r)


def bubbles_lo(dur, r):
    out = np.zeros(ns(dur))
    for _ in range(int(dur * 30)):
        t0 = r.uniform(0, dur * 0.7); f = r.uniform(300, 900); d = 0.05
        t = tt(d); x = np.sin(phase(f * (1 + 2 * t / d))) * np.exp(-t / 0.015) * np.exp(-t0 / 0.6)
        i = ns(t0); out[i:i + len(x)] += x
    return out


def paper_rustle(r, dur=0.4):
    t = tt(dur)
    x = bp(r.standard_normal(len(t)), 1500, 9000, 1)
    g = (np.abs(lp(r.standard_normal(len(t)), 30)) * 3) ** 2
    return x * g * np.sin(np.pi * t / dur) * 0.4


def boing(r, f=300, dur=0.6, down=False):
    t = tt(dur)
    ff = f * (1 + (-0.5 if down else 0.08) * np.clip(t / dur, 0, 1)) * (1 + 0.05 * np.sin(2 * np.pi * 10 * t))
    return np.sin(phase(ff)) * np.exp(-t / (dur * 0.5)) * 0.5


def slice_(r, dur=0.25):
    t = tt(dur)
    return (hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.04) * 0.7 + bp(r.standard_normal(len(t)), 600, 3000, 1) * np.exp(-t / 0.02) * 0.5)


def squish(r):
    t = tt(0.3)
    return np.sin(phase(180 * (1 + 1.5 * t / 0.3))) * np.exp(-t / 0.08) * 0.5 + lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.05) * 0.4


def thud(r, f=70, big=1.0):
    t = tt(0.6)
    return (np.sin(phase(f * (1 + 0.8 * np.exp(-t / 0.02)))) * np.exp(-t / 0.12) + bp(r.standard_normal(len(t)), 200, 1500, 1) * np.exp(-t / 0.02) * 0.5) * big


def ting(r, f=6500, dur=0.5):
    return modal(dur, [(f, 1, 0.12), (f * 1.62, 0.5, 0.07)], r) * 0.4


def crumple(dur, r):
    out = np.zeros(ns(dur))
    for _ in range(int(dur * 70)):
        t0 = r.uniform(0, dur - 0.03); t = tt(0.02)
        x = bp(r.standard_normal(len(t)), 1500, 8000, 1) * np.exp(-t / 0.004) * r.uniform(0.2, 1)
        i = ns(t0); out[i:i + len(x)] += x
    return out * 0.6


def bamboo_knock(r):
    d = 0.6
    return modal(d, [(420, 1.0, 0.12), (980, 0.6, 0.06), (1650, 0.3, 0.03)], r) + thud(r, 110, 0.6)[: ns(d)] * 0.5


def clang(r, big=1.0):
    d = 1.8
    t = tt(d)
    y = modal(d, [(620, 1.0, 0.5), (1430, 0.8, 0.4), (2350, 0.6, 0.3), (3570, 0.4, 0.2), (5200, 0.3, 0.12)], r)
    nz = r.standard_normal(len(t))
    return fades((y * 0.7 + bp(nz, 500, 8000, 1) * np.exp(-t / 0.01) * 1.3) * big, 0, 0.3)


def shatter(r, dur=1.4):
    out = np.zeros(ns(dur))
    t = tt(dur)
    out += hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.08) * 0.8
    for _ in range(40):
        t0 = abs(r.normal(0, 0.25)); f = r.uniform(3000, 9000); d = 0.25
        x = modal(d, [(f, 1, r.uniform(0.02, 0.08)), (f * 1.4, 0.4, 0.03)], r) * r.uniform(0.2, 0.7)
        i = ns(t0)
        if i + len(x) < len(out): out[i:i + len(x)] += x
    return out


def click(r):
    t = tt(0.15)
    return bp(r.standard_normal(len(t)), 2500, 9000, 1) * np.exp(-t / 0.003) * 1.2 + modal(0.15, [(4800, 0.5, 0.03)], r)


def hum(dur, r, f=110):
    t = np.arange(ns(dur)) / SR
    y = np.sin(2 * np.pi * f * t) * 0.3 + np.sin(2 * np.pi * f * 2.01 * t) * 0.15 + np.sin(2 * np.pi * f * 3 * t) * 0.05
    return y * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t)) + 0.05 * lp(r.standard_normal(len(t)), 600)


def pop(r):
    t = tt(0.6)
    return np.sin(phase(900 * np.exp(-t / 0.05) + 150)) * np.exp(-t / 0.06) * 0.7 + thud(r, 90, 0.7)[: len(t)]


def sfx():
    S = buf()
    # 1 hook: blade shing on the glint, a little "huh?" boing on the shrug
    place(S, pan(shing(R), 0.1), fr(6), 0.7); cue(fr(6), "sword shing")
    place(S, pan(boing(R, 420, 0.5), 0.0), fr(B["shrug"]), 0.35)
    # 2 sharpening strokes (one per 9-frame stroke), sparkle tings, a whoosh into the flash
    for k in range(int((B["why"] - 6 - B["sharpen0"]) / 4.5)):
        place(S, pan(scrape(R, 0.14, 2500, 8000, False), 0.1 if k % 2 else -0.1), fr(70 + k * 4.5), 0.45)
    place(S, pan(shing(R, 3300, 1.0), 0.0), fr(B["why"] - 4), 0.6)
    place(S, st(whoosh(0.55, R, peak=0.4, f_lo=500, f_hi=4500)), fr(163) - 0.42, 0.7)
    cue(fr(B["sharpen0"]), "whetstone strokes"); cue(fr(161), "flash whoosh")
    # 3 forge: fire crackle bed, hammer on anvil x3, quench hiss + bubbles, handover cloth whoosh
    place(S, st(crackle(fr(207 - 163), R)), fr(163), 0.35)
    for h in ("hit1", "hit2", "hit3"):
        place(S, pan(anvil(R), -0.1), fr(B[h]), 0.9); cue(fr(B[h]), "hammer on anvil")
    place(S, pan(hiss(R), 0.1), fr(B["quench"]), 0.9); cue(fr(B["quench"]), "quench hiss")
    place(S, st(whoosh(0.4, R, peak=0.15, f_lo=400, f_hi=2000)), fr(236), 0.3)
    # 4 dull: paper rustle, a deflating boing as the paper just bends
    place(S, pan(paper_rustle(R, 0.5), -0.2), fr(286), 0.5)
    place(S, pan(paper_rustle(R, 0.35), -0.2), fr(B["paper"]), 0.6)
    place(S, pan(boing(R, 260, 0.7, down=True), 0.0), fr(B["paper"] + 4), 0.45); cue(fr(B["paper"]), "paper bends + sad boing")
    # 5 polisher: wet stone strokes (one per 15-frame stroke), getting finer (higher, softer); glint tings on the stones
    for k in range(int((497 - 322) / 7.5)):
        t0 = fr(322 + k * 7.5); g = k / ((497 - 322) / 7.5)
        place(S, pan(scrape(R, 0.22, 900 + 3000 * g, 3500 + 6000 * g), -0.15), t0, 0.45 * (1 - 0.5 * g))
    for i in range(5):
        place(S, pan(ting(R, 4000 + i * 700), -0.4 + i * 0.2), fr(444 + i * 10.4 + 3), 0.35)
    cue(fr(322), "polishing strokes"); cue(fr(444), "stone glint tings")
    # 6 tomato: swoosh, slice, then the halves fall apart
    place(S, st(whoosh(0.3, R, peak=0.22, f_lo=800, f_hi=5000)), fr(522) - 0.18, 0.5)
    place(S, pan(slice_(R), 0.0), fr(530), 0.6)
    place(S, pan(squish(R), -0.1), fr(B["halved"]), 0.6); place(S, pan(squish(R), 0.1), fr(B["halved"] + 4), 0.5)
    cue(fr(530), "slice"); cue(fr(B["halved"]), "tomato halves squish")
    # 7 mat: big swing whoosh, clean slice, top half slides and thuds
    place(S, st(whoosh(0.45, R, peak=0.3, f_lo=400, f_hi=5000, width=1.0)), fr(630) - 0.3, 0.8)
    place(S, pan(slice_(R, 0.4), 0.0), fr(630), 0.8)
    place(S, pan(scrape(R, 0.35, 600, 2500), 0.1), fr(B["slide"]), 0.4)
    place(S, pan(thud(R, 80, 0.8), 0.1), fr(B["slide"] + 22), 0.5)
    cue(fr(630), "mat cut"); cue(fr(B["slide"]), "top half slides off + thud")
    # 8 hair: razor shing, pluck "tik", the hair splits with a tiny ting
    place(S, pan(shing(R, 3800, 1.2), 0.0), fr(B["razor"]), 0.6)
    place(S, pan(click(R), -0.2), fr(806), 0.4)
    place(S, pan(ting(R, 8000, 0.6), 0.0), fr(B["split"]), 0.6); cue(fr(B["split"]), "hair split ting")
    # 9 bamboo: swing whoosh, clang + hollow knock, foil crumple, sad trombone (music)
    place(S, st(whoosh(0.4, R, peak=0.3, f_lo=400, f_hi=4500)), fr(B["hit"]) - 0.32, 0.8)
    place(S, pan(clang(R, 0.9), 0.2), fr(B["hit"]), 0.8); place(S, pan(bamboo_knock(R), 0.25), fr(B["hit"]), 0.8)
    place(S, pan(crumple(0.8, R), 0.0), fr(B["crumple"] - 4), 0.7)
    cue(fr(B["hit"]), "CLANG on bamboo"); cue(fr(B["crumple"]), "foil crumple")
    # 10 obsidian (Aztec plaza): toss whoosh + clatter, knap click, nanometre sparkle
    place(S, st(breeze(DUR - fr(953) if False else fr(1198 - 953), R, 0.5)), fr(953), 0.4)
    place(S, st(whoosh(0.5, R, peak=0.2, f_lo=500, f_hi=3000)), fr(958), 0.5)
    place(S, pan(clang(R, 0.4), 0.6), fr(986), 0.3)
    place(S, pan(click(R), 0.0), fr(B["knap"]), 0.9); place(S, pan(ting(R, 5200), 0.0), fr(B["knap"]), 0.4)
    place(S, pan(ting(R, 9000, 0.8), 0.0), fr(B["nm"]), 0.5); cue(fr(B["knap"]), "knap click"); cue(fr(B["nm"]), "edge sparkle")
    # 11 macuahuitl: swing whoosh, steel clang, obsidian shatters
    place(S, st(whoosh(0.5, R, peak=0.4, f_lo=300, f_hi=3500, width=1.0)), fr(B["steel"]) - 0.42, 0.8)
    place(S, pan(clang(R, 1.0), 0.0), fr(B["steel"]), 0.9)
    place(S, pan(shatter(R), 0.1), fr(B["steel"] + 2), 0.9); cue(fr(B["steel"]), "clang + obsidian shatter")
    # 12 lab: room hum, footsteps, needle twinkle, zoom-in riser
    place(S, st(hum(fr(1328 - 1190), R, 120)), fr(1190), 0.15)
    for k in range(5):
        place(S, pan(stroll_step(R, 0.3), 0.1), fr(1200) + k * 0.28, 0.3)
    place(S, pan(ting(R, 7000, 0.8), 0.0), fr(B["needle"]), 0.4)
    place(S, st(whoosh(2.4, R, peak=2.3, f_lo=300, f_hi=6000, tail=0.15)), fr(1250), 0.5)
    cue(fr(1250), "zoom riser into the needle")
    # 13 nano: deep atom hum, chime on "single atom", slab whoosh down, bump pop + scatter tinkles
    place(S, st(hum(fr(1440 - 1324), R, 82)), fr(1324), 0.2)
    place(S, pan(ting(R, 5000, 1.2), 0.0), fr(B["atom"]), 0.5)
    place(S, st(whoosh(0.7, R, peak=0.65, f_lo=200, f_hi=1500, tail=0.08)), fr(B["bump"]) - 0.66, 0.6)
    place(S, pan(pop(R), 0.0), fr(B["bump"]), 0.9)
    for k in range(14):
        place(S, pan(ting(R, R.uniform(3000, 8000), 0.4), R.uniform(-0.7, 0.7)), fr(B["bump"]) + 0.05 + k * 0.045, 0.25)
    cue(fr(B["bump"]), "BUMP pop + atoms scatter")
    # 14-16 golden: birds, slow wet strokes then stop, morph swell, final shing
    place(S, st(bird_chirps(DUR - fr(1440), R, density=0.5)), fr(1440), 0.35)
    for k in range(int((B["stop"] - 1440) / 7.5)):
        place(S, pan(scrape(R, 0.22, 3000, 9000), -0.1), fr(1440 + k * 7.5), 0.25)
    place(S, st(whoosh(1.2, R, peak=0.8, f_lo=250, f_hi=1500)), fr(B["round"]), 0.35)
    place(S, pan(shing(R, 2600, 1.8), 0.0), fr(1616), 0.6)
    place(S, st(whoosh(1.6, R, peak=0.6, f_lo=250, f_hi=1500)), fr(1640), 0.35)
    cue(fr(1616), "final shing"); cue(fr(1640), "crane whoosh")
    return S


# ------------------------------------------------------------------ music
def koto(f, vel=0.6, r=None, dur=1.2):
    """plucked koto-ish string: bright attack, quick decay, slight pitch bend down at the start"""
    r = r or rng(0)
    t = tt(dur)
    ph = phase(f * (1 + 0.012 * np.exp(-t / 0.03)))
    y = (np.sin(ph) + 0.5 * np.sin(2 * ph) * np.exp(-t / 0.25) + 0.3 * np.sin(3 * ph) * np.exp(-t / 0.15) + 0.15 * np.sin(5 * ph) * np.exp(-t / 0.06)) * np.exp(-t / 0.45)
    y += hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.3
    return fades(y * vel, 0.001, 0.05)


def taiko(vel=0.8, r=None, big=False):
    r = r or rng(0)
    d = 1.0 if big else 0.6
    t = tt(d)
    f0 = 58 if big else 85
    y = np.sin(phase(f0 * (1 + 0.6 * np.exp(-t / 0.03)))) * np.exp(-t / (0.3 if big else 0.16))
    y += bp(r.standard_normal(len(t)), 150, 1500, 1) * np.exp(-t / 0.015) * 0.5
    return y * vel


def rim(vel=0.5, r=None):
    r = r or rng(0)
    t = tt(0.12)
    return (bp(r.standard_normal(len(t)), 1500, 6000, 1) * np.exp(-t / 0.006) + modal(0.12, [(1700, 0.6, 0.02)], r)) * vel


def marimba(f, vel=0.6, r=None):
    r = r or rng(0)
    d = 0.9
    return modal(d, [(f, 1.0, 0.35), (f * 4.0, 0.25, 0.06), (f * 10, 0.05, 0.01)], r) * vel


def log_drum(f, vel=0.6, r=None):
    r = r or rng(0)
    return modal(0.5, [(f, 1.0, 0.12), (f * 2.3, 0.4, 0.05)], r) * vel


def music():
    M = buf()
    r = rng(5)
    BEAT = 60 / 128
    # in-scale on D: D Eb G A Bb (miyako-bushi)
    scale = [62, 63, 67, 69, 70, 74, 75, 79, 81, 82]
    # hook: taiko roll building into the flash, big hit + cymbal on the flash
    for k in range(int(fr(160) / (BEAT / 2))):
        t0 = k * BEAT / 2
        v = 0.25 + 0.6 * (t0 / fr(160)) ** 2
        place(M, st(taiko(v, r)), t0, 0.6 if k % 2 == 0 else 0.35)
    for i, nn in enumerate([74, 75, 79, 81, 82, 86]):
        place(M, pan(koto(m2f(nn), 0.5, r), 0.2), fr(110) + i * BEAT / 2, 0.45)
    place(M, st(taiko(1.0, r, big=True)), fr(163), 0.9); place(M, st(cymbal(0.8, r, 2.0)), fr(163), 0.45)
    # yard groove 163 .. bamboo hit: koto ostinato + taiko/rim pattern
    t, k = fr(163), 0
    ost = [62, 69, 70, 69, 74, 70, 69, 67]
    mel = [None, 81, None, 79, 82, None, 81, 79, None, 74, None, 75, 79, None, 74, None]
    end = fr(B["hit"])
    while t < end - 0.05:
        nn = ost[k % 8] + (5 if (k // 32) % 2 else 0)
        place(M, pan(koto(m2f(nn - 12), 0.55, r, 0.6), -0.25), t, 0.45)
        m = mel[k % 16]
        if m and (k // 16) % 2 == 1:
            place(M, pan(koto(m2f(m), 0.5, r), 0.3), t, 0.4)
        if k % 4 == 0:
            place(M, st(taiko(0.7, r)), t, 0.55)
        if k % 4 == 2:
            place(M, pan(rim(0.5, r), 0.1), t, 0.35)
        if k % 8 == 7:
            place(M, st(taiko(0.45, r)), t, 0.4)
        t += BEAT / 2; k += 1
    # bamboo hit: stop dead, a sad trombone fall on the crumple
    for i, (nn, d) in enumerate([(58, 0.32), (57, 0.32), (56, 0.32), (55, 0.9)]):
        place(M, st(brass(m2f(nn), d, 0.6, r, "horn", fall=(-2.0 if i == 3 else 0.0))), fr(B["crumple"] + 2) + i * 0.34, 0.55)
    # Aztec plaza: marimba + log drums, 128 bpm, A minor pentatonic
    t, k = fr(953), 0
    mar = [57, 64, 67, 69, 72, 69, 67, 64]
    while t < fr(B["steel"]) - 0.05:
        place(M, pan(marimba(m2f(mar[k % 8] + (0 if (k // 16) % 2 == 0 else 3)), 0.6, r), 0.25), t, 0.45)
        if k % 2 == 0:
            place(M, pan(log_drum(m2f(45 + (k // 2) % 2 * 7), 0.7, r), -0.2), t, 0.5)
        if k % 4 == 2:
            place(M, st(taiko(0.5, r)), t, 0.4)
        t += BEAT / 2; k += 1
    place(M, st(cymbal(1.0, r, 2.5, 1.2)), fr(B["steel"]), 0.5); place(M, st(taiko(1.0, r, big=True)), fr(B["steel"]), 0.8)
    # lab + nano: glassy arps over a soft pad, rising into the atom
    place(M, st(pad([m2f(50), m2f(57), m2f(62), m2f(66)], fr(1386 - 1198), 0.4, r, att=0.6, rel=0.3, warm=1800)), fr(1198), 0.4)
    t, k = fr(1198), 0
    arp = [74, 78, 81, 85, 86, 85, 81, 78]
    while t < fr(B["bump"]) - 0.05:
        place(M, pan(glock(m2f(arp[k % 8] + (2 if t > fr(1330) else 0)), 0.35, r, 0.9), 0.3 if k % 2 else -0.3), t, 0.35)
        t += BEAT / 2; k += 1
    place(M, st(glock(m2f(98), 0.7, r, 2.0)), fr(B["atom"]), 0.5)
    place(M, st(taiko(0.9, r, big=True)), fr(B["bump"]), 0.6)
    place(M, st(pad([m2f(49), m2f(56), m2f(61)], fr(1440 - B["bump"]), 0.35, r, att=0.1, rel=0.3, warm=700)), fr(B["bump"]), 0.4)
    # golden ending: koto lullaby of the opening figure over a warm pad, resolve on D
    place(M, st(pad([m2f(50), m2f(57), m2f(62), m2f(69)], DUR - fr(1440), 0.45, r, att=1.0, rel=1.2, warm=1300)), fr(1440), 0.45)
    lull = [74, 70, 69, 67, 69, 70, 74, None, 75, 74, 70, 69, 67, None, 62, None]
    t, k = fr(1444), 0
    while t < DUR - 1.6:
        m = lull[k % 16]
        if m: place(M, pan(koto(m2f(m), 0.5, r, 1.6), 0.15), t, 0.42)
        if k % 4 == 0: place(M, pan(koto(m2f(50 if (k // 8) % 2 == 0 else 55), 0.45, r, 1.8), -0.25), t, 0.35)
        t += BEAT; k += 1
    for nn in (62, 69, 74, 81):
        place(M, pan(koto(m2f(nn), 0.55, r, 2.5), 0.0), DUR - 1.55 + (nn - 62) * 0.006, 0.4)
    place(M, st(triangle(0.4, r, 2.0)), DUR - 1.5, 0.3)
    return M


# ------------------------------------------------------------------ mix
def main():
    v, vsr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
    v = st(v)
    V = np.zeros((2, N)); n = min(N, v.shape[1]); V[:, :n] = v[:, :n]
    S, M = sfx(), music()
    rev = make_ir(1.0, 3, hf=0.6)
    M = 0.85 * M + 0.15 * convolve_st(M, rev)[:, :N]
    S = 0.9 * S + 0.1 * convolve_st(S, rev)[:, :N]
    V = norm_to(V, -16.0, "integrated")
    M = norm_to(M, -21.0, "integrated") * dbg(3.0)
    S = norm_to(S, -21.0, "integrated") * dbg(-6.0)
    env = np.abs(V).max(axis=0)
    rl = np.exp(-1 / (0.25 * SR))
    pk = lfilter([1 - rl], [1, -rl], (env > 0.02).astype(float))
    g = dbg(-7.0 * np.clip(pk * 1.6, 0, 1))
    mix = V + M * g + S * (0.6 + 0.4 * g)
    for _ in range(3):
        mix = norm_to(mix, -14.0, "integrated")
        lim = dbg(-1.5)
        pkx = np.abs(mix).max(axis=0)
        la = ns(0.005)
        pkx = np.maximum.reduce([np.roll(pkx, -k) for k in range(0, la, 8)])
        gr = np.minimum(1.0, lim / np.maximum(pkx, 1e-9))
        rel = np.exp(-1 / (0.12 * SR))
        gs = lfilter([1 - rel], [1, -rel], 1 - gr)
        mix = mix * np.clip(1 - np.maximum(gs, 1 - gr), 0, 1)
    tp = true_peak(mix)
    if tp > -1.0:
        mix *= dbg(-1.0 - tp)
    mix = fades(mix, 0.002, 0.3)
    os.makedirs(os.path.join(HERE, "stems"), exist_ok=True)
    for name, x in (("voice", V), ("music", M * g), ("sfx", S)):
        write_wav(os.path.join(HERE, "stems", f"{name}.wav"), x)
    write_wav(os.path.join(HERE, "mix.wav"), mix)
    with open(os.path.join(HERE, "cues.md"), "w") as fh:
        fh.write("# Sound cues (s, frame @30)\n\n")
        for t0, w in sorted(cues):
            fh.write(f"- {t0:6.2f} s (f {round(t0 * FPS):4d}): {w}\n")
    print(f"mix {mix.shape[1] / SR:.3f} s, integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP")


if __name__ == "__main__":
    main()
