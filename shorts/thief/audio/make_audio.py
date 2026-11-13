# Soundtrack for "The Gentleman Thief": the supplied voice-over (unchanged), an original sneaky caper score (pizzicato
# walking bass, brushed snare, plucked/vibes melody in D minor, brighter F-major newspaper section, a night suspense
# section with ticking clock, a music-box callback at the end) and synthesized SFX on the picture's event frames
# (src/videos/thief/story.ts / cast.ts). Mix standard: music +3 dB, SFX -6 dB, voice unchanged; -14 LUFS, <= -1 dBTP.
# Run from this folder: python3 make_audio.py  -> mix.wav + stems/ + cues.md
import os
import numpy as np
from scipy.signal import lfilter
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, curve, pan, st, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, phase, modal, write_wav
from instruments import m2f, brass, glock, vibes, musicbox, pluck, snare, snare_roll, cymbal, timpani, pad, triangle, brush
from sfx_gen import clink, whoosh, babble, bird_chirps, crickets, breeze, stroll_step, vox, vowel_track, _track, applause, creak, WOOD

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 2650
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(300)
cues = []
cue = lambda t, w: cues.append((t, w))
buf = lambda: np.zeros((2, N))

# picture events (frames)
CUTS = [40, 80, 178, 230, 266, 288, 318, 360, 380, 402, 436, 474, 512, 532, 570, 598, 634, 694, 724, 768, 823, 872, 948, 998, 1055, 1112, 1176,
        1228, 1268, 1330, 1378, 1415, 1464, 1520, 1576, 1612, 1652, 1694, 1728, 1795, 1842, 1898, 1952, 2002, 2044, 2096, 2125, 2176, 2222,
        2294, 2368, 2410, 2456, 2490, 2564, 2600]
FLASH = fr(178)
LIFT, POST1, POST2 = fr(259), fr(322), fr(2318)
ITEMS = [fr(360), fr(380), fr(402), fr(450)]
NOTE_UP, NOTE_IN, WALLET_SHUT = fr(576), fr(640), fr(676)
WRITE0 = fr(726)
PAPER_SPIN, PAPER_HIT, GENT = fr(786), fr(823), fr(845)
RETURNING, LOL2 = fr(998), fr(1028)
PILE = [fr(1330), fr(1378), fr(1415)]
NIGHT0, CLONES, ALL = fr(1464), fr(1522), fr(1578)
GLINT_WIN, KEY_IN, KEY_TURN, DOOR_OPEN = fr(1624), fr(1700), fr(1716), fr(1728)
KITCHEN0, BILLS = fr(1795), fr(1952)
ID_OUT, KEY_OUT, GLINT = fr(2098), fr(2138), fr(2182)
SOAP0, PRESS0, PRESS1 = fr(2222), fr(2232), fr(2262)
LOCKUP = fr(2428)
END0 = fr(2564)


# ------------------------------------------------------------------ SFX
def laugh(r, dur=1.4, base=None):
    """a man's belly laugh: pulsed 'ha' syllables, falling pitch"""
    base = base or r.uniform(110, 160)
    n = ns(dur)
    t = np.arange(n) / SR
    f0 = base * _track(n, [(0, 1.35), (dur * 0.5, 1.15), (dur, 0.95)], t)
    rate = r.uniform(5.5, 7.0)
    pulse = np.clip(np.sin(2 * np.pi * rate * t) * 1.4, 0, 1) ** 1.5
    amp = pulse * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.2, 0, 1)
    forms = vowel_track(n, [(0, "a"), (dur, "A")])
    return vox(f0, forms, amp, r, r.uniform(0.95, 1.08), tilt=1.0, breath=0.45)


def swipe(r):
    return whoosh(0.28, r, peak=0.12, f_lo=1500, f_hi=7000, width=0.5)


def paper_slide(r, d=0.25):
    t = tt(d)
    x = bp(r.standard_normal(len(t)), 1500, 8000, 1) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    return x * 0.5


def rustle(r, d=0.5):
    t = tt(d)
    x = bp(r.standard_normal(len(t)), 900, 7000, 1)
    g = np.abs(lp(r.standard_normal(len(t)), 30)) * 3
    return x * np.clip(g, 0, 1) * np.sin(np.pi * t / d) * 0.6


def thunk(r, f=90, big=1.0):
    t = tt(0.5)
    nz = r.standard_normal(len(t))
    return (np.sin(phase(f * (1 + 0.8 * np.exp(-t / 0.02)))) * np.exp(-t / 0.08) * 1.2 + bp(nz, 200, 2500, 1) * np.exp(-t / 0.015) * 0.5) * big


def snap(r):
    t = tt(0.15)
    return hp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.01) * 0.9 + np.sin(phase(400 * np.ones(len(t)))) * np.exp(-t / 0.02) * 0.4


def click(r, f0=3200):
    t = tt(0.12)
    nz = r.standard_normal(len(t))
    return hp(nz, 2000) * np.exp(-t / 0.004) * 1.0 + modal(0.12, [(f0, 1.0, 0.03), (f0 * 1.7, 0.5, 0.02)], r) * 0.5


def poof(r):
    t = tt(0.45)
    return lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.12) * np.clip(t / 0.01, 0, 1) * 0.9 + whoosh(0.45, r, peak=0.1, f_lo=300, f_hi=1500)[: len(t)] * 0.6


def ding(r, f=1760, d=1.5):
    return glock(f, 0.7, r, d)


def tick(r, hi=True):
    t = tt(0.06)
    return modal(0.06, [((2600 if hi else 2100), 1.0, 0.012), (4800, 0.4, 0.008)], r) * 0.6 + hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.002) * 0.3


def scratch_pen(r, d):
    t = tt(d)
    x = bp(r.standard_normal(len(t)), 2500, 9000, 1)
    g = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * t + 2 * np.sin(2 * np.pi * 2.3 * t))
    return x * g * 0.25


def squish(r):
    t = tt(0.5)
    f = 120 * (1 + 0.6 * np.clip(t / 0.4, 0, 1))
    return np.sin(phase(f)) * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) * 0.5 + lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.1) * 0.25


def gasp(r):
    d = 0.35
    t = tt(d)
    return bp(r.standard_normal(len(t)), 900, 5000, 1) * np.sin(np.pi * t / d) ** 2 * 0.5


def door_creak(r, d=1.1):
    return creak(d, r, rate0=60, rate1=140, modes=[(f * 1.2, q, g) for f, q, g in WOOD], rough=0.15, noise=0.03) * 0.7


def wallet_rain(r, d=0.6, n=10):
    out = np.zeros(ns(d + 0.5))
    for k in range(n):
        x = thunk(r, f=r.uniform(120, 220), big=r.uniform(0.25, 0.5))
        i = ns(r.uniform(0, d))
        out[i:i + len(x)] += x[: len(out) - i]
    return out


def pop(r):
    t = tt(0.12)
    return np.sin(phase(900 * np.exp(-t / 0.03) + 300)) * np.exp(-t / 0.03) * 0.6


def sfx():
    S = buf()
    # cuts: a light swish on each hard cut
    for f in CUTS:
        place(S, st(whoosh(0.3, R, peak=0.15, f_lo=700, f_hi=5000, width=0.4)), fr(f) - 0.15, 0.22)
    # police laughter
    for t0, t1 in ((0.0, 2.6), (fr(872), fr(948)), (LOL2, fr(1055))):
        k = 0
        while t0 + k * 0.5 < t1:
            place(S, pan(laugh(R, min(1.5, t1 - t0 - k * 0.5 + 0.2)), R.uniform(-0.6, 0.6)), t0 + k * 0.5 + R.uniform(0, 0.15), 0.35)
            k += 1
    place(S, st(babble(fr(80), R, 140, 1.0)), 0.0, 0.08)
    cue(0.0, "police belly laughs"); cue(fr(872), "laughs again"); cue(LOL2, "laughs (lost property)")
    # night hook: crickets, flash whoosh
    place(S, st(crickets(fr(178 - 80), R)), fr(80), 0.35)
    place(S, st(whoosh(0.7, R, peak=0.3, f_lo=400, f_hi=5000)), FLASH - 0.35, 0.6)
    # day street ambience
    for a, b in ((fr(178), fr(288)), (fr(694), fr(1228)), (fr(2410), fr(2490))):
        place(S, st(bird_chirps(b - a, R, density=0.4)), a, 0.25)
        place(S, pan(babble(b - a, R, 130, 1.0), 0.3), a, 0.06)
    for k in range(12):
        place(S, pan(stroll_step(R, 0.4), R.uniform(-0.3, 0.3)), fr(230) + k * 0.36, 0.25)
    place(S, pan(swipe(R), 0.2), LIFT - 0.1, 0.6); place(S, pan(snap(R), 0.2), LIFT, 0.4)
    cue(LIFT, "pickpocket swipe")
    # post box (evening birds)
    for t0 in (POST1, POST2):
        place(S, st(breeze(2.4, R, 0.4)), t0 - 1.0, 0.3)
        place(S, pan(paper_slide(R, 0.3), 0.2), t0 - 0.25, 0.6)
        place(S, pan(thunk(R, 70, 0.8), 0.2), t0 + 0.05, 0.6)
        cue(t0, "envelope into the post box: slide + thunk")
    # desk inserts
    for t0 in ITEMS:
        place(S, pan(paper_slide(R), R.uniform(-0.3, 0.3)), t0, 0.6)
    place(S, pan(rustle(R, 0.6), 0.0), ITEMS[3], 0.6)
    place(S, st(rustle(R, 0.4)), NOTE_UP, 0.5); place(S, st(paper_slide(R, 0.5)), NOTE_IN, 0.6); place(S, st(snap(R)), WALLET_SHUT, 0.7)
    place(S, st(scratch_pen(R, 1.0)), WRITE0, 0.6)
    cue(ITEMS[0], "cash / cards / photos / crumpled receipt slides"); cue(WALLET_SHUT, "wallet snaps shut"); cue(WRITE0, "pen scratch (note)")
    # newspapers
    place(S, pan(babble(1.6, R, 190, 1.15, rate=6), -0.2), fr(768), 0.25)
    place(S, st(whoosh(1.2, R, peak=0.7, f_lo=300, f_hi=3000)), PAPER_SPIN, 0.6)
    place(S, st(rustle(R, 0.35)), PAPER_HIT, 0.8)
    place(S, st(poof(R)), GENT - 0.02, 0.6); place(S, st(ding(R, 2093)), GENT, 0.4)
    cue(PAPER_SPIN, "spinning newspaper whoosh"); cue(GENT, "poof + ding: gentleman")
    # parade footsteps
    for k in range(40):
        place(S, pan(stroll_step(R, 0.5), R.uniform(-0.6, 0.6)), fr(1055) + k * 0.15 + R.uniform(0, 0.05), 0.2)
    # dinner party
    place(S, st(babble(fr(1330 - 1228), R, 150, 1.05, rate=5)), fr(1228), 0.25)
    place(S, pan(babble(fr(1330 - 1228), R, 210, 1.15, rate=5), 0.4), fr(1228), 0.2)
    for k in range(3):
        place(S, pan(clink(R, f0=R.uniform(2500, 3500), dur=0.6, bright=0.8), R.uniform(-0.5, 0.5)), fr(1232) + k * 0.4, 0.4)
    place(S, st(gasp(R)), fr(1270), 0.6); place(S, st(applause(1.5, R, people=6)), fr(1280), 0.4)
    place(S, pan(laugh(R, 1.2, 150), 0.4), fr(1275), 0.3)
    cue(fr(1228), "dinner party chatter, clinks, gasp, applause")
    # wallet pile
    for i, t0 in enumerate(PILE):
        place(S, st(wallet_rain(R, 0.4 + 0.2 * i, 8 + 6 * i)), t0 - 0.05, 0.5 + 0.15 * i)
    place(S, st(cymbal(0.5, R, 1.4)), PILE[2], 0.3)
    cue(PILE[0], "wallets thud onto the pile (x3, bigger each time)")
    # night: crickets, distant dog, clones pop, all at once
    place(S, st(crickets(fr(1795 - 1464), R)), NIGHT0, 0.35)
    place(S, st(breeze(fr(1795 - 1464), R, 0.5)), NIGHT0, 0.25)
    for k in range(14):
        place(S, pan(pop(R), R.uniform(-0.8, 0.8)), CLONES + k * 0.1, 0.5)
    for k in range(16):
        place(S, pan(click(R, R.uniform(2600, 3800)), R.uniform(-0.9, 0.9)), ALL + 0.06 + R.uniform(0, 0.08), 0.5)
    place(S, st(thunk(R, 50, 1.4)), ALL + 0.08, 0.8)
    cue(CLONES, "clones pop in"); cue(ALL, "ALL AT ONCE: a volley of lock clicks + boom")
    place(S, pan(ding(R, 3136, 1.0), 0.0), GLINT_WIN + 0.3, 0.3)
    # the lock
    place(S, st(bp(R.standard_normal(ns(0.35)), 2000, 8000) * 0.3), KEY_IN, 0.5)
    place(S, st(click(R, 2400)), KEY_TURN + 0.15, 0.9); place(S, st(click(R, 1800)), KEY_TURN + 0.3, 0.7)
    place(S, st(door_creak(R, 1.1)), DOOR_OPEN, 0.6)
    cue(KEY_IN, "key in"); cue(KEY_TURN, "click-clack"); cue(DOOR_OPEN, "door creaks open")
    # kitchen clock
    k = 0
    while KITCHEN0 + k * 0.5 < fr(1952):
        place(S, pan(tick(R, k % 2 == 0), 0.3), KITCHEN0 + k * 0.5, 0.35)
        k += 1
    place(S, st(gasp(R)), fr(1900), 0.6)
    # money flutter
    place(S, st(rustle(R, 1.4)), BILLS, 0.4)
    # ID, key, glint, soap, stopwatch
    place(S, st(paper_slide(R)), ID_OUT, 0.6); place(S, st(paper_slide(R, 0.4)), KEY_OUT, 0.5)
    place(S, st(clink(R, f0=3000, dur=0.3)), KEY_OUT + 0.2, 0.4)
    place(S, st(ding(R, 2637, 1.2)), GLINT, 0.4)
    k = 0
    while SOAP0 + k * 0.25 < fr(2294):
        place(S, pan(tick(R, k % 2 == 0), -0.3), SOAP0 + k * 0.25, 0.3)
        k += 1
    place(S, st(squish(R)), PRESS0, 0.8); place(S, st(squish(R)), PRESS1, 0.4); place(S, st(ding(R, 2349, 1.0)), fr(2290), 0.4)
    cue(SOAP0, "stopwatch ticking"); cue(PRESS0, "soap squish")
    place(S, st(click(R, 2600)), LOCKUP, 0.6)
    place(S, st(crickets(fr(2564 - 2490), R)), fr(2490), 0.35)
    # ending: letters rustle, heart pops
    place(S, st(rustle(R, 0.8)), END0 + 0.1, 0.5)
    for k in range(6):
        place(S, pan(pop(R), R.uniform(-0.5, 0.5)), END0 + 0.4 + k * 0.42, 0.25)
    return S


# ------------------------------------------------------------------ music: original sneaky caper, 128 bpm
BPM = 128
B = 60 / BPM


def walking(M, r, t0, t1, roots, mel=None, vol=1.0, brushes=True):
    """pizzicato walking bass (+ optional vibes motif) from t0 to t1, one root per bar"""
    t, k = t0, 0
    while t < t1 - 0.05:
        bar = (k // 4) % len(roots)
        root = roots[bar]
        step = [0, 3, 7, 5][k % 4] if (k // 4) % 2 == 0 else [0, 7, 5, 4][k % 4]
        place(M, pan(pluck(m2f(root + step - 12), 0.75, r, 0.6, bright=0.3), -0.15), t, 0.75 * vol)
        if brushes:
            place(M, pan(brush(0.35 if k % 2 else 0.22, r, 0.25, swish=k % 2 == 0), 0.2), t, 0.35 * vol)
            place(M, pan(brush(0.15, r, 0.12), 0.2), t + B * 0.66, 0.25 * vol)
        if mel is not None:
            nn = mel[k % len(mel)]
            if nn:
                place(M, pan(pluck(m2f(nn), 0.6, r, 0.5, bright=0.6), 0.3), t + (B * 0.5 if k % 4 == 3 else 0), 0.45 * vol)
        t += B
        k += 1


def music():
    M = buf()
    r = rng(11)
    Dm = [38, 38, 34, 36]                                    # Dm Dm Bb C (bars)
    sneak = [74, 0, 72, 69, 0, 69, 70, 72, 74, 0, 77, 76, 74, 72, 69, 0]
    # hook: comic stabs on the laughs, then a low suspense hit for "robbed the whole city"
    for t0 in (0.05, 1.0, 1.5):
        place(M, st(brass(m2f(50), 0.15, 0.6, r, "horn")), t0, 0.4)
    place(M, st(pad([m2f(38), m2f(45), m2f(50), m2f(53)], FLASH - fr(80), 0.5, r, att=0.6, rel=0.3, warm=500)), fr(80), 0.5)
    place(M, st(timpani(m2f(38), 0.8, r, 1.6)), fr(80), 0.6)
    for t0, v in snare_roll(fr(130), FLASH - 0.02, 0.1, 0.7, r, rate=24):
        place(M, pan(snare(v * 0.6, r, 0.1, buzz=True), -0.1), t0, 0.5)
    place(M, st(cymbal(0.9, r, 2.2)), FLASH, 0.5)
    # the caper: walking bass + sneaky melody through the wallet routine (flash .. papers)
    walking(M, r, FLASH, fr(768), Dm, sneak)
    for t0 in (POST1, ITEMS[0], ITEMS[1], ITEMS[2], ITEMS[3]):
        place(M, pan(vibes(m2f(81), 0.4, r, 1.0), 0.2), t0, 0.35)
    place(M, pan(glock(m2f(86), 0.6, r, 1.4), 0.0), NOTE_UP + 0.5, 0.4)
    # newspapers: brighter F major bounce + glock
    F = [41, 46, 41, 36]
    walking(M, r, fr(768), fr(872), F, [77, 0, 81, 84, 81, 0, 77, 0, 79, 0, 82, 86, 84, 0, 0, 0], vol=1.0)
    place(M, st(brass(m2f(53), 0.25, 0.7, r, "horn")), GENT, 0.4); place(M, st(brass(m2f(57), 0.25, 0.7, r, "horn")), GENT, 0.35)
    # police laugh again + question: back to the caper, sparse
    walking(M, r, fr(872), fr(1055), Dm, [74, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0, 70, 0, 72, 0], vol=0.85)
    place(M, st(brass(m2f(43), 0.5, 0.6, r, "tuba", fall=-200)), fr(1050), 0.5)          # "lost property?" trombone-ish fall
    # parade + party: fuller, swinging
    walking(M, r, fr(1055), fr(1330), [38, 43, 34, 45], sneak, vol=1.05)
    # counting: three rising brass hits on the piles
    for i, t0 in enumerate(PILE):
        for nn in ([50, 57, 62], [52, 59, 64], [53, 60, 65, 69])[i]:
            place(M, st(brass(m2f(nn), 0.35, 0.75, r, "horn")), t0, 0.45)
        place(M, st(timpani(m2f(38 + 2 * i), 0.7, r, 1.0)), t0, 0.5)
    walking(M, r, PILE[0] + 0.3, NIGHT0 - 0.1, [38, 40, 41], None, vol=0.7)
    # night: suspense pad, heartbeat timpani, clock-like celesta, snare roll into "all at once"
    place(M, st(pad([m2f(38), m2f(44), m2f(50)], ALL - NIGHT0, 0.45, r, att=1.0, rel=0.2, warm=500)), NIGHT0, 0.5)
    k = 0
    while NIGHT0 + k * 0.75 < ALL - 0.2:
        place(M, st(timpani(m2f(38), 0.45, r, 0.6)), NIGHT0 + k * 0.75, 0.45)
        k += 1
    for t0, v in snare_roll(CLONES, ALL - 0.03, 0.1, 0.9, r, rate=26):
        place(M, pan(snare(v * 0.6, r, 0.1, buzz=True), -0.1), t0, 0.55)
    place(M, st(cymbal(1.0, r, 3.0, 1.2)), ALL, 0.6)
    for nn in (38, 50, 53, 57):
        place(M, st(brass(m2f(nn), 0.8, 0.9, r, "tuba" if nn < 45 else "horn")), ALL, 0.5)
    # the clean job: quiet pizzicato, then the kitchen reveal pad
    walking(M, r, ALL + 1.2, KITCHEN0, [38, 34], [0, 0, 74, 0, 0, 0, 72, 0], vol=0.6, brushes=False)
    place(M, st(pad([m2f(38), m2f(45), m2f(50), m2f(53)], fr(1952) - KITCHEN0, 0.4, r, att=0.8, rel=0.5, warm=600)), KITCHEN0, 0.45)
    place(M, pan(vibes(m2f(74), 0.5, r, 2.0), 0.1), fr(1844), 0.4); place(M, pan(vibes(m2f(77), 0.5, r, 2.0), 0.1), fr(1900), 0.4)
    # explanation: the caper again (cleaner), with stings on the two things
    walking(M, r, fr(1952), fr(2368), Dm, sneak, vol=0.95)
    for t0 in (ID_OUT, KEY_OUT):
        place(M, pan(vibes(m2f(86), 0.5, r, 1.4), 0.2), t0, 0.4)
    # reveal + ending: music-box version of the sneak tune over a warm pad, final glock + triangle
    walking(M, r, fr(2368), END0, [41, 46, 41, 45], None, vol=0.7)
    tune = [74, 72, 69, 69, 70, 72, 74, 77, 76, 74, 72, 74]
    for i, nn in enumerate(tune):
        place(M, pan(musicbox(m2f(nn + 12), 0.55, r, 1.4), 0.15), END0 + 0.1 + i * 0.22, 0.5)
    place(M, st(pad([m2f(50), m2f(53), m2f(57), m2f(62)], DUR - END0, 0.45, r, att=0.4, rel=1.0, warm=1200)), END0, 0.45)
    place(M, pan(glock(m2f(86), 0.8, r, 2.0), 0.0), fr(2620), 0.5)
    place(M, st(triangle(0.5, r, 2.0)), fr(2620), 0.35)
    return M


# ------------------------------------------------------------------ mix
def main():
    v, vsr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
    assert vsr == SR, vsr
    v = st(v)
    V = np.zeros((2, N)); n = min(N, v.shape[1]); V[:, :n] = v[:, :n]
    S, M = sfx(), music()
    rev = make_ir(1.1, 3, hf=0.6)
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
    mix = fades(mix, 0.002, 0.25)
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
