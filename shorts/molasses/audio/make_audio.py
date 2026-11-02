# Soundtrack for "The Sweetest Disaster" (molasses short): synthesized SFX on the picture's event frames, an original
# ragtime-march score that follows the story beats, ducked under the voice, mixed to the skill's standard
# (music +3 dB, SFX -6 dB, voice unchanged), exact picture length (930 frames @ 30 fps), 48 kHz stereo.
# Run from this folder: python3 make_audio.py  -> mix.wav + stems/ + cues.md
import os
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, curve, pan, st, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, write_wav, phase, modal
from instruments import m2f, brass, glock, vibes, musicbox, pluck, snare, snare_roll, cymbal, timpani, pad, whistle, triangle
from sfx_gen import creak, clink, whoosh, splash_big, bubbles, whoa, babble, bird_chirps, breeze, stroll_step, boot, hammer_hit, CHAIN, TIMBER

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 930
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(1919)
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


# ------------------------------------------------------------------ picture events (frames, from story.ts / cast.ts)
FLASH = fr(88)
LEAK, PAINT0, PAINT1, NOTICE = fr(193), 228, 262, fr(254)
GROAN = fr(292)
RIVETS = [fr(323), fr(342), fr(343)]
BURST = fr(371)
LUCKILY, UNLUCKILY = fr(505), fr(544)
JAR_POKE = fr(618)
GLUE0 = fr(658)
STAMPS = [fr(772), fr(793)]
GOLD0 = fr(810)
SNIFF = fr(868)
CRANE = fr(888)
CUTS = [88, 186, 252, 288, 313, 362, 390, 505, 544, 590, 658, 742, 770, 810, 864, 888]

# ------------------------------------------------------------------ SFX
def roar(dur, r, swell):
    """the wave: deep churning rumble + thick slosh + gloop bubbles"""
    n = ns(dur)
    lo = lp(r.standard_normal(n), 120, 2) * 3.0
    mid = bp(r.standard_normal(n), 180, 900, 1)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * np.arange(n) / SR + r.uniform(0, 6))
    x = (lo + 0.7 * mid * mod) * swell[:n]
    gl = bubbles(dur, r, rate=14, f_lo=90, f_hi=420, tau=(0.02, 0.06))
    return x + 0.5 * gl[:n] * swell[:n]


def crack(r, big=1.0):
    t = tt(1.2)
    nz = r.standard_normal(len(t))
    snap = hp(nz, 1200) * np.exp(-t / 0.004) * 1.2
    body = bp(nz, 150, 2500, 1) * np.exp(-t / 0.06)
    boom = np.sin(phase(48 * (1 + 0.6 * np.exp(-t / 0.05)))) * np.exp(-t / 0.35) * 2.0 * big
    ring = modal(1.2, [(f, g, d) for f, _q, g in CHAIN[:5] for d in [0.25]], r) * 0.35
    return snap + body + boom + ring


def gunshot_rivet(r):
    t = tt(0.9)
    nz = r.standard_normal(len(t))
    bang = (hp(nz, 600) * np.exp(-t / 0.012) * 1.4 + bp(nz, 120, 900, 1) * np.exp(-t / 0.05))
    ping = modal(0.9, [(2600, 1.0, 0.18), (4100, 0.5, 0.09), (6200, 0.3, 0.05)], r) * 0.5
    zing = np.sin(phase(3200 * np.exp(-t / 0.35))) * np.exp(-t / 0.25) * 0.15
    return bang + ping + zing


def metal_groan(dur, r):
    return creak(dur, r, rate0=34, rate1=22, modes=[(f * 0.55, q, g) for f, q, g in TIMBER], rough=0.2, noise=0.02) * 1.6


def drip(r):
    t = tt(0.25)
    f = r.uniform(380, 620)
    return np.sin(phase(f * (1 + 0.8 * (1 - np.exp(-t / 0.03))))) * np.exp(-t / 0.05) * 0.6


def brush_stroke(r, up):
    t = tt(0.28)
    x = bp(r.standard_normal(len(t)), 900 if up else 600, 5000 if up else 3600, 1)
    return x * np.sin(np.pi * np.clip(t / 0.28, 0, 1)) ** 1.5 * 0.5


def squelch(r):
    t = tt(0.35)
    f = r.uniform(90, 160)
    body = np.sin(phase(f * (1 + 1.2 * np.clip(t / 0.25, 0, 1)))) * np.sin(np.pi * np.clip(t / 0.35, 0, 1)) * 0.6
    return body + 0.3 * lp(r.standard_normal(len(t)), 700) * np.exp(-t / 0.08)


def boing(r, t0=0.0):
    t = tt(0.9)
    f = 520 * (1 + 0.06 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.3))
    return np.sin(phase(f)) * np.exp(-t / 0.3) * 0.5


def stamp(r):
    t = tt(0.5)
    nz = r.standard_normal(len(t))
    return np.sin(phase(70 * (1 + np.exp(-t / 0.02)))) * np.exp(-t / 0.09) * 1.4 + bp(nz, 300, 2500, 1) * np.exp(-t / 0.02) * 0.6 + hammer_hit(r, 0.6)[: len(t)] * 0.6


def sniff(r):
    out = np.zeros(ns(0.7))
    for k in range(2):
        d = 0.18
        t = tt(d)
        x = bp(r.standard_normal(len(t)), 1800, 7000, 1) * np.sin(np.pi * t / d) ** 2 * 0.35
        out[ns(k * 0.26): ns(k * 0.26) + len(x)] += x
    return out


def gull(r):
    d = 0.6
    t = tt(d)
    f = 1500 + 500 * np.sin(np.pi * t / d) - 600 * t
    return np.sin(phase(f)) * np.sin(np.pi * t / d) ** 2 * 0.12 + 0.05 * bp(r.standard_normal(len(t)), 2000, 5000) * np.sin(np.pi * t / d) ** 2


def sfx():
    S = buf()
    # hook: the wave bearing down, fleeing feet, a few "whoa"s, then the flash whoosh
    sw = curve(ns(FLASH + 0.2), [(0, 0.5), (1.5, 0.8), (FLASH, 1.3), (FLASH + 0.2, 0)])
    place(S, pan(roar(FLASH + 0.2, R, sw), -0.1), 0.0, 0.9)
    for k in range(18):
        place(S, pan(boot(R, 0.8), R.uniform(-0.6, 0.6)), 0.1 + k * 0.155 + R.uniform(-0.02, 0.02), 0.35)
    for t0 in (0.6, 1.4, 2.1):
        place(S, pan(whoa(R), R.uniform(-0.5, 0.5)), t0, 0.35)
    place(S, st(whoosh(0.6, R, peak=0.25, f_lo=500, f_hi=4000)), FLASH - 0.3, 0.7)
    cue(0.0, "wave roar + running feet + whoas (hook)"); cue(FLASH - 0.3, "flash whoosh")
    # waterfront: harbour air, gulls, street murmur
    place(S, st(breeze(fr(186 - 88), R, 0.5)), FLASH, 0.5)
    for t0 in (FLASH + 0.4, FLASH + 1.6, FLASH + 2.4):
        place(S, pan(gull(R), R.uniform(-0.7, 0.7)), t0, 0.8)
    place(S, pan(babble(fr(290 - 88), R, 120, 1.0), 0.2), FLASH, 0.12)
    cue(FLASH, "harbour air, gulls, distant street murmur")
    # leak drips, painter's brush strokes (one per 9-frame cycle), his innocent whistle
    for k in range(9):
        place(S, pan(drip(R), 0.15), LEAK + k * 0.27, 0.5)
    for k in range(int((PAINT1 - PAINT0) / 4.5)):
        place(S, pan(brush_stroke(R, k % 2 == 0), 0.2), fr(PAINT0 + k * 4.5), 0.45)
    s0, w = whistle([(0.0, 0.22, 79, 0.7), (0.24, 0.2, 76, 0.6), (0.46, 0.22, 81, 0.7), (0.7, 0.35, 79, 0.6)], R)
    place(S, pan(w, 0.1), NOTICE + s0, 0.35)
    cue(LEAK, "drips"); cue(fr(PAINT0), "brush strokes"); cue(NOTICE, "innocent whistle")
    # the groan, rivets like gunshots
    place(S, st(metal_groan(1.4, R)), GROAN - 0.1, 0.9)
    for t0 in RIVETS:
        place(S, pan(gunshot_rivet(R), R.uniform(-0.3, 0.3)), t0, 0.8)
    cue(GROAN, "steel groan"); [cue(t0, "rivet gunshot") for t0 in RIVETS]
    # burst: crack + boom, plates clanging, then the roar of the wave through the street
    place(S, st(crack(R, 1.4)), BURST, 1.0)
    place(S, st(splash_big(R)), BURST + 0.05, 0.8)
    for k in range(6):
        place(S, pan(clink(R, f0=R.uniform(300, 700), dur=0.6, bright=0.6), R.uniform(-0.8, 0.8)), BURST + 0.4 + k * 0.17, 0.5)
    d = fr(590) - BURST
    sw = curve(ns(d), [(0, 0.3), (0.3, 1.3), (fr(505) - BURST, 1.0), (LUCKILY - BURST + 0.1, 0.25), (UNLUCKILY - BURST, 0.3), (UNLUCKILY - BURST + 0.15, 1.4), (d - 0.15, 1.2), (d, 0)])
    place(S, pan(roar(d, R, sw), 0.0), BURST, 0.9)
    for k in range(22):
        place(S, pan(boot(R, 0.8), R.uniform(-0.6, 0.6)), fr(392) + k * 0.15, 0.3)
    for t0 in (fr(400), fr(445), fr(480), UNLUCKILY + 0.2):
        place(S, pan(whoa(R), R.uniform(-0.5, 0.5)), t0, 0.35)
    for f in (404, 456, 544):
        place(S, st(whoosh(0.5, R, peak=0.3)), fr(f) - 0.2, 0.45)
    cue(BURST, "BURST: crack + boom + splash + plates"); cue(BURST + 0.3, "wave roar (ducks for 'Luckily', swells on 'Unluckily')")
    # honey: spoon poke boing
    place(S, pan(clink(R, f0=2400, dur=0.3), 0.2), JAR_POKE, 0.5)
    place(S, pan(boing(R), 0.2), JAR_POKE + 0.02, 0.6)
    cue(JAR_POKE, "spoon poke + boing")
    # glue: cold wind, squelches as they wriggle, puffs of breath
    place(S, st(breeze(fr(742 - 658), R, 0.9, gust=0.3, bright=1400)), GLUE0, 0.6)
    for k in range(12):
        place(S, pan(squelch(R), R.uniform(-0.6, 0.6)), GLUE0 + 0.2 + k * 0.23 + R.uniform(0, 0.08), 0.5)
    cue(GLUE0, "cold wind + squelches")
    # engineer's stamps
    for t0 in STAMPS:
        place(S, pan(stamp(R), -0.1), t0, 0.9)
        cue(t0, "stamp")
    # golden summer: birds, strollers, the sniff, crane whoosh
    place(S, st(bird_chirps(DUR - GOLD0, R, density=0.6)), GOLD0, 0.5)
    for k in range(18):
        place(S, pan(stroll_step(R, 0.4), R.uniform(-0.5, 0.5)), GOLD0 + 0.2 + k * 0.33, 0.18)
    place(S, pan(sniff(R), 0.0), SNIFF, 0.9)
    place(S, st(whoosh(1.2, R, peak=0.4, f_lo=250, f_hi=1500)), CRANE, 0.5)
    cue(GOLD0, "summer birds + footsteps"); cue(SNIFF, "sniff sniff"); cue(CRANE, "crane whoosh")
    return S


# ------------------------------------------------------------------ music: original ragtime march, 120 bpm
BEAT = 0.5


def music():
    M = buf()
    r = rng(7)
    # hook: timpani roll building to the flash, cymbal + low brass stab on the flash
    for t0, v in snare_roll(0.2, FLASH - 0.05, 0.15, 0.8, r, rate=22):
        place(M, timpani(m2f(38), v * 0.5, r, 0.4), t0, 0.5)
    place(M, st(cymbal(0.9, r, 2.6)), FLASH, 0.6)
    place(M, st(brass(m2f(38), 0.5, 0.9, r, "tuba")), FLASH, 0.8)
    # jaunty oom-pah in F major for the setting and the painter (FLASH .. 9.6 s)
    t, bar = FLASH + BEAT, 0
    roots = [41, 36, 41, 36, 46, 41, 36, 41, 46, 43, 36, 41]
    mel = [[72, 74, 76, 77], [79, 77, 76, 74], [72, 76, 79, 84], [83, 81, 79, 77], [77, 81, 82, 84], [84, 82, 81, 79],
           [79, 76, 74, 72], [72, 74, 76, 72], [70, 74, 77, 82], [81, 79, 77, 76], [74, 76, 77, 79], [77, 72, 72, 72]]
    while t < fr(288) - 0.1:
        b = bar % len(roots)
        place(M, st(brass(m2f(roots[b]), 0.35, 0.65, r, "tuba")), t, 0.7)
        place(M, st(brass(m2f(roots[b] + 7), 0.3, 0.55, r, "tuba")), t + 2 * BEAT, 0.6)
        for k, (nn) in enumerate(mel[b]):
            place(M, pan(pluck(m2f(nn), 0.55, r, 0.5), 0.25), t + k * BEAT, 0.5)
            if k % 2 == 1:
                place(M, pan(pluck(m2f(nn - 12 + 4), 0.35, r, 0.3), -0.25), t + k * BEAT, 0.35)
        for k in range(4):
            place(M, pan(snare(0.25 if k % 2 else 0.18, r, 0.15), -0.1), t + k * BEAT + BEAT / 2, 0.35)
        t += 4 * BEAT
        bar += 1
    # tension (groan + rivets): low pad, heartbeat timpani, snare roll to the burst
    place(M, st(pad([m2f(37), m2f(44), m2f(49)], BURST - fr(288) + 0.2, 0.5, r, att=0.4, rel=0.2, warm=600)), fr(288), 0.6)
    for k in range(int((BURST - fr(288)) / 0.6)):
        place(M, st(timpani(m2f(37), 0.5, r, 0.5)), fr(288) + k * 0.6, 0.6)
    for t0, v in snare_roll(fr(330), BURST - 0.02, 0.2, 1.0, r, rate=26):
        place(M, pan(snare(v * 0.6, r, 0.12, buzz=True), -0.1), t0, 0.6)
    # burst + chase: crash, then a galloping minor march at 150 bpm until "Luckily"
    place(M, st(cymbal(1.0, r, 3.0, 1.2)), BURST, 0.7)
    place(M, st(timpani(m2f(33), 1.0, r, 2.0)), BURST, 1.0)
    b2, t = 0.4, BURST + 0.4
    chase = [45, 45, 48, 45, 43, 43, 41, 40]
    k = 0
    while t < LUCKILY - 0.05:
        root = chase[(k // 4) % len(chase)]
        if k % 2 == 0:
            place(M, st(brass(m2f(root - 12), 0.18, 0.75, r, "tuba")), t, 0.7)
        place(M, pan(snare(0.5 if k % 2 else 0.3, r, 0.14), -0.1), t, 0.45)
        if k % 4 == 3:
            place(M, pan(brass(m2f(root + 12), 0.15, 0.6, r, "horn"), 0.3), t, 0.45)
        t += b2 / 2
        k += 1
    # "Luckily": the band stops, a carefree glock figure
    for i, nn in enumerate([84, 88, 91]):
        place(M, pan(glock(m2f(nn), 0.6, r, 1.2), 0.2), LUCKILY + 0.15 + i * 0.18, 0.5)
    # "Unluckily": low brass stab, then the chase resumes, heavier
    place(M, st(brass(m2f(33), 0.6, 1.0, r, "tuba")), UNLUCKILY, 0.9)
    place(M, st(cymbal(0.8, r, 2.0)), UNLUCKILY, 0.5)
    t, k = UNLUCKILY + 0.4, 0
    while t < fr(590) - 0.1:
        if k % 2 == 0:
            place(M, st(brass(m2f(33 + (k // 4) % 2 * 3), 0.2, 0.8, r, "tuba")), t, 0.75)
        place(M, pan(snare(0.55 if k % 2 else 0.35, r, 0.14), -0.1), t, 0.5)
        t += 0.2
        k += 1
    # explanation + glue: slow sticky waltz-time plod in D minor (tuba + vibes), 80 bpm
    t, k = fr(590), 0
    plod = [38, 45, 41, 45, 36, 43, 40, 43, 38, 45, 41, 45, 33, 40, 37, 40]
    vib = [74, 77, 81, 77, 72, 76, 79, 76, 74, 77, 81, 77, 69, 73, 76, 73]
    while t < fr(742) - 0.2:
        place(M, st(brass(m2f(plod[k % 16]), 0.55, 0.55, r, "tuba", scoop=-40)), t, 0.6)
        place(M, pan(vibes(m2f(vib[k % 16]), 0.4, r, 1.2), 0.25), t + 0.1, 0.35)
        t += 0.75
        k += 1
    # engineers: bright resolving brass chord on each stamp
    for i, t0 in enumerate(STAMPS):
        for nn in ([41, 48, 53, 57] if i == 0 else [36, 48, 52, 55]):
            place(M, st(brass(m2f(nn), 0.5 if i == 0 else 0.9, 0.55, r, "horn")), t0, 0.35)
    place(M, st(pad([m2f(53), m2f(57), m2f(60)], fr(810) - STAMPS[0], 0.4, r, att=0.3, rel=0.4)), STAMPS[0], 0.4)
    # golden callback: music box lullaby of the opening tune, final "sweet" glock + triangle
    tune = [72, 74, 76, 77, 79, 77, 76, 74, 72, 76, 79, 84]
    for i, nn in enumerate(tune):
        place(M, pan(musicbox(m2f(nn), 0.55, r, 1.4), 0.15), GOLD0 + 0.3 + i * 0.36, 0.5)
    place(M, st(pad([m2f(53), m2f(57), m2f(60), m2f(65)], DUR - GOLD0, 0.45, r, att=1.0, rel=1.2, warm=1200)), GOLD0, 0.45)
    place(M, pan(glock(m2f(89), 0.8, r, 2.0), 0.0), fr(879), 0.6)
    place(M, st(triangle(0.5, r, 2.0)), fr(879), 0.4)
    return M


# ------------------------------------------------------------------ mix
def main():
    v, vsr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
    v = st(v)
    V = np.zeros((2, N)); n = min(N, v.shape[1]); V[:, :n] = v[:, :n]
    S, M = sfx(), music()
    rev = make_ir(1.1, 3, hf=0.6)
    M = 0.85 * M + 0.15 * convolve_st(M, rev)[:, :N]
    S = 0.9 * S + 0.1 * convolve_st(S, rev)[:, :N]
    # stem levels: voice as recorded at -16 LUFS; music and SFX beds at -21 LUFS, then the standard offsets
    V = norm_to(V, -16.0, "integrated")
    M = norm_to(M, -21.0, "integrated") * dbg(3.0)
    S = norm_to(S, -21.0, "integrated") * dbg(-6.0)
    # duck music + SFX beds 7 dB under speech (40 ms attack, 250 ms release)
    env = np.abs(V).max(axis=0)
    a, rl = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.25 * SR))
    e = np.zeros(N); y = 0.0
    from scipy.signal import lfilter
    pk = lfilter([1 - rl], [1, -rl], (env > 0.02).astype(float))
    g = dbg(-7.0 * np.clip(pk * 1.6, 0, 1))
    mix = V + M * g + S * (0.6 + 0.4 * g)
    for _ in range(3):  # loudness target with a peak limiter (5 ms look-ahead, 120 ms release)
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
