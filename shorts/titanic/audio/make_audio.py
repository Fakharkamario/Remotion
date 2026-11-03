# Soundtrack for "Why the Titanic Was Horrifying": synthesized SFX on the picture's event frames, an original score
# (ominous night pads, a diegetic ragtime for the band that sours as the ship goes down, a quiet chorale at the end),
# ducked under the voice, mixed to the skill's standard (music +3 dB, SFX -6 dB, voice unchanged), exact picture
# length (1350 frames @ 30 fps), 48 kHz stereo.
# Run from this folder: python3 make_audio.py  -> mix.wav + stems/ + cues.md
import os
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, curve, pan, st, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, write_wav, phase, modal
from instruments import m2f, brass, glock, vibes, musicbox, pluck, snare, snare_roll, cymbal, timpani, pad, whistle, triangle
from sfx_gen import creak, clink, whoosh, splash_big, bubbles, whoa, babble, breeze, stroll_step, boot, hammer_hit, water_bed, CHAIN, TIMBER
from dsp import smooth_noise, colored

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 1350
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(1912)
cues = []


def cue(t, what):
    cues.append((t, what))


def buf():
    return np.zeros((2, N))


# ------------------------------------------------------------------ picture events (frames, from story.ts / cast.ts)
FLASH = fr(80)
HORRIFY = fr(33)
SCRAPE = [fr(173), fr(184), fr(196)]
ROLL = fr(241)
KNOCKS = [fr(342), fr(347)]
NOW = fr(380)
DRILL = fr(454)
DONT = fr(533)
BAND0, BAND1 = fr(558), fr(637)
LOWER0, LOWER1 = fr(637), fr(704)
FLOOD0, FLOOD1 = fr(704), fr(777)
HITS = fr(802)
PANIC0, PANIC1 = fr(822), fr(887)
LIGHTS_OUT = fr(891)
NOMOON, BLACK = fr(919), fr(939)
SNAP0, BREAK = fr(968), fr(1005)
CALM, COLD = fr(1046), fr(1108)
END0 = fr(1178)
CUTS = [80, 150, 215, 260, 300, 357, 400, 433, 472, 492, 530, 558, 637, 704, 777, 822, 887, 968, 1005, 1046, 1108, 1178]


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


def hum(dur, r, f0=46.0, muff=1.0):
    """the ship's engines and generators: low drone with a slow beat"""
    t = tt(dur)
    x = (np.sin(phase(np.full(len(t), f0))) + 0.5 * np.sin(phase(np.full(len(t), f0 * 2.01))) + 0.25 * np.sin(phase(np.full(len(t), f0 * 3.02))))
    x *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t)
    return x * 0.35 + lp(r.standard_normal(len(t)), 220 * muff, 2) * 0.5


def grind(dur, r):
    """ice on steel: grinding stick-slip scrape + deep rumble"""
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    scr = bp(r.standard_normal(len(t)), 300, 2400, 1) * (0.5 + 0.5 * np.abs(smooth_noise(len(t), r, 18.0)))
    rum = lp(colored(len(t), r, 2.0), 140, 2) * 2.2
    cr = creak(dur, r, rate0=40, rate1=28, modes=[(f * 0.6, q, g) for f, q, g in TIMBER], rough=0.3, noise=0.05) * 0.8
    return (scr * 0.7 + rum + cr[: len(t)]) * env


def knock(r):
    t = tt(0.35)
    body = modal(0.35, [(180, 1.0, 0.05), (410, 0.6, 0.03), (900, 0.3, 0.015)], r)
    return body * 1.4 + bp(r.standard_normal(len(t)), 800, 4000, 1) * np.exp(-t / 0.006) * 0.5


def rustle(r, dur=0.6):
    t = tt(dur)
    return bp(r.standard_normal(len(t)), 1500, 7000, 1) * np.sin(np.pi * t / dur) ** 2 * 0.25 * (0.6 + 0.4 * np.abs(smooth_noise(len(t), r, 12.0)))


def power_down(r):
    """generators failing: the hum glides down, electrical fizz, a final clunk"""
    t = tt(2.4)
    f = 46 * np.exp(-t / 0.9) + 12
    x = np.sin(phase(f)) * np.exp(-t / 0.8) * 0.8
    fizz = bp(r.standard_normal(len(t)), 2500, 9000, 1) * (np.abs(smooth_noise(len(t), r, 30.0)) > 0.5) * np.exp(-t / 0.3) * 0.4
    cl = np.zeros(len(t)); c = knock(r) * 1.3; cl[: len(c)] += c
    return x + fizz + cl


def shiver_breath(r):
    d = 0.9
    t = tt(d)
    x = bp(r.standard_normal(len(t)), 500, 3500, 1) * np.sin(np.pi * t / d) ** 2
    x *= 0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 11 * t))  # teeth-chattering flutter
    return x * 0.3


def sfx():
    S = buf()
    # the ship at night: engine hum + calm sea (outside), muffled hum (inside)
    place(S, st(hum(fr(215), R)), 0.0, 0.55)
    place(S, water_bed(fr(215), R, close=0.4, slosh_rate=0.4), 0.0, 0.35)
    place(S, st(whoosh(0.6, R, peak=0.25, f_lo=500, f_hi=4000)), FLASH - 0.3, 0.6)
    cue(0.0, "engine hum + calm sea"); cue(FLASH - 0.3, "flash whoosh")
    # the iceberg: grinding along the hull, three jolts, ice chunks clattering on the deck
    place(S, st(grind(fr(215 - 168), R)), fr(168), 1.0)
    for t0 in SCRAPE:
        place(S, st(crack(R, 0.6)), t0, 0.55)
    for k in range(10):
        place(S, pan(clink(R, f0=R.uniform(1800, 3400), dur=0.25, bright=0.9), R.uniform(-0.6, 0.6)), SCRAPE[0] + 0.35 + k * 0.11 + R.uniform(0, 0.05), 0.4)
    cue(SCRAPE[0], "grinding scrape + jolts + ice clatter")
    # cabin: muffled hum, sheets as the sleeper rolls over
    place(S, st(hum(fr(300 - 215), R, muff=0.5)), fr(215), 0.35)
    place(S, pan(rustle(R, 0.7), -0.2), ROLL - 0.1, 0.8)
    cue(ROLL, "sheet rustle")
    # corridor: a knock, two raps; footsteps
    place(S, st(hum(fr(400 - 300), R, muff=0.5)), fr(300), 0.3)
    for t0 in KNOCKS:
        place(S, pan(knock(R), -0.15), t0, 0.9)
    for k in range(4):
        place(S, pan(stroll_step(R, 0.3), 0.1), fr(372) + k * 0.32, 0.25)
    cue(KNOCKS[0], "knock knock")
    # deck: cold breeze, murmuring crowd, sea
    d = fr(887) - fr(400)
    place(S, st(breeze(d, R, 0.6, gust=0.2, bright=1100)), fr(400), 0.5)
    place(S, water_bed(d, R, close=0.3, slosh_rate=0.3), fr(400), 0.25)
    for k, b in enumerate((150, 120, 210, 180)):
        place(S, pan(babble(fr(637 - 400), R, b, 1.0), (-0.6, 0.5, -0.2, 0.3)[k]), fr(400), 0.07)
    cue(fr(400), "breeze + crowd murmur on deck")
    # lowering a boat: pulley squeaks, rope creaks
    for k in range(6):
        place(S, pan(creak(0.35, R, rate0=180, rate1=260, rough=0.1, scale=0.9), 0.3), LOWER0 + 0.2 + k * 0.36, 0.5)
    cue(LOWER0, "davit rope creaks")
    # flooded corridor: water running, bubbling, the hull groaning
    place(S, water_bed(fr(777 - 704), R, close=1.2, slosh_rate=1.5), FLOOD0, 0.8)
    place(S, st(metal_groan(1.6, R)), FLOOD0 + 0.6, 0.5)
    cue(FLOOD0, "water rushing down the hallway + hull groan")
    # panic: shouting crowd
    for k in range(6):
        place(S, pan(babble(fr(887 - 800), R, 160 + 30 * k, 1.1, rate=6.0, active=0.9), R.uniform(-0.7, 0.7)), fr(800), 0.12)
    for t0 in (PANIC0 + 0.3, PANIC0 + 1.0, PANIC0 + 1.6):
        place(S, pan(whoa(R), R.uniform(-0.5, 0.5)), t0, 0.3)
    cue(PANIC0, "panicking crowd")
    # lights out: the generators die
    place(S, st(power_down(R)), LIGHTS_OUT - 0.05, 0.9)
    place(S, st(breeze(fr(968 - 891), R, 0.5, gust=0.15, bright=700)), LIGHTS_OUT, 0.4)
    cue(LIGHTS_OUT, "power down: hum glides away, fizz, clunk")
    # the snap: rising groan, the break, debris splashes
    place(S, st(metal_groan(fr(1005 - 968) + 0.3, R)), SNAP0, 0.9)
    place(S, st(crack(R, 1.8)), BREAK, 1.0)
    place(S, st(crack(R, 1.0)), BREAK + 0.25, 0.5)
    for k in range(5):
        place(S, pan(splash_big(R), R.uniform(-0.6, 0.6)), BREAK + 0.5 + k * 0.28, 0.35)
    cue(BREAK, "SNAP: crack + boom + debris splashes")
    # calm sea: gentle lapping; the cold: breath, shivering, small splashes
    place(S, water_bed(fr(1350 - 1046), R, close=0.35, slosh_rate=0.25), CALM, 0.4)
    place(S, st(breeze(fr(1350 - 1046), R, 0.4, gust=0.1, bright=800)), CALM, 0.3)
    for k in range(7):
        place(S, pan(shiver_breath(R), R.uniform(-0.6, 0.6)), COLD + 0.1 + k * 0.32, 0.5)
    place(S, water_bed(fr(1178 - 1108), R, close=1.0, slosh_rate=1.2), COLD, 0.4)
    cue(CALM, "calm lapping"); cue(COLD, "shivering breath + splashes")
    return S


# ------------------------------------------------------------------ music: original score
def music():
    M = buf()
    r = rng(14)
    # hook: low ominous pad, timpani hit on "horrifying", cymbal swell into the flash
    place(M, st(pad([m2f(38), m2f(45), m2f(50)], FLASH + 0.5, 0.45, r, att=0.4, rel=0.4, warm=500)), 0.0, 0.6)
    place(M, st(timpani(m2f(38), 0.9, r, 2.0)), HORRIFY, 0.8)
    place(M, st(brass(m2f(26), 0.8, 0.7, r, "tuba")), HORRIFY, 0.6)
    place(M, st(cymbal(0.7, r, 2.2)), FLASH, 0.5)
    # night at sea: still, cold pad (D minor add9), a lonely glock figure
    place(M, st(pad([m2f(50), m2f(57), m2f(64), m2f(65)], fr(215) - FLASH, 0.35, r, att=0.8, rel=0.3, warm=1100)), FLASH, 0.5)
    for i, nn in enumerate([74, 76, 77, 69]):
        place(M, pan(glock(m2f(nn), 0.45, r, 1.6), 0.2), FLASH + 0.2 + i * 0.5, 0.35)
    # the scrape: dissonant brass cluster
    for nn in (37, 38, 44):
        place(M, st(brass(m2f(nn), 1.2, 0.8, r, "tuba", scoop=-50)), SCRAPE[0], 0.5)
    # cabin: a music-box lullaby, slightly out of tune
    tune = [76, 74, 72, 74, 76, 76, 76, 74, 74, 74, 76, 79]
    for i, nn in enumerate(tune):
        place(M, pan(musicbox(m2f(nn) * (1 + 0.004 * r.standard_normal()), 0.5, r, 1.2), 0.15), fr(215) + 0.2 + i * 0.24, 0.45)
    # corridor: ticking pizzicato building to "Now"
    t, k = fr(300), 0
    while t < NOW - 0.05:
        place(M, pan(pluck(m2f(62 if k % 2 else 57), 0.5 + 0.03 * k, r, 0.3, 0.4), -0.2), t, 0.45)
        t += 0.25; k += 1
    place(M, st(brass(m2f(38), 0.5, 0.9, r, "tuba")), NOW, 0.7)
    place(M, st(timpani(m2f(38), 0.9, r, 1.5)), NOW, 0.6)
    # deck, unaware: light plucked figure over a soft pad
    place(M, st(pad([m2f(53), m2f(57), m2f(60)], BAND0 - fr(400), 0.3, r, att=0.5, rel=0.3, warm=1000)), fr(400), 0.4)
    t, k = fr(402), 0
    fig = [65, 69, 72, 69, 67, 70, 74, 70]
    while t < DONT - 0.2:
        place(M, pan(pluck(m2f(fig[k % 8]), 0.45, r, 0.6, 0.5), 0.2), t, 0.4)
        t += 0.3; k += 1
    # "You don't.": a cheeky glock wink
    for i, nn in enumerate([84, 88]):
        place(M, pan(glock(m2f(nn), 0.6, r, 1.0), 0.1), DONT + 0.1 + i * 0.15, 0.45)
    # the band: cheerful ragtime (diegetic: a little roomy), which sours as the boats leave half empty
    t, bar = BAND0, 0
    roots = [41, 36, 41, 36, 46, 41, 36, 41, 46, 43, 36, 41]
    mel = [[72, 74, 76, 77], [79, 77, 76, 74], [72, 76, 79, 84], [83, 81, 79, 77], [77, 81, 82, 84], [84, 82, 81, 79],
           [79, 76, 74, 72], [72, 74, 76, 72], [70, 74, 77, 82], [81, 79, 77, 76], [74, 76, 77, 79], [77, 72, 72, 72]]
    BEAT = 0.42
    while t < FLOOD1 - 0.2:
        b = bar % len(roots)
        sour = np.clip((t - LOWER0) / (FLOOD1 - LOWER0), 0, 1)
        vel = 0.65 * (1 - 0.45 * sour)
        place(M, st(brass(m2f(roots[b] - (1 if sour > 0.5 and bar % 2 else 0)), 0.3, vel, r, "tuba")), t, 0.6)
        place(M, st(brass(m2f(roots[b] + 7), 0.26, vel * 0.8, r, "tuba")), t + 2 * BEAT, 0.5)
        for k, nn in enumerate(mel[b]):
            det = 1 - 0.012 * sour * (k % 2)
            place(M, pan(pluck(m2f(nn - (3 if sour > 0.6 and k == 2 else 0)) * det, 0.55 * (1 - 0.4 * sour), r, 0.5), 0.25), t + k * BEAT, 0.5)
        for k in range(4):
            place(M, pan(snare(0.22 if k % 2 else 0.15, r, 0.15), -0.1), t + k * BEAT + BEAT / 2, 0.3 * (1 - sour))
        t += 4 * BEAT * (1 + 0.15 * sour); bar += 1
    # it hits you: heartbeat timpani + rising low brass, through the panic
    for k in range(int((LIGHTS_OUT - HITS) / 0.55)):
        place(M, st(timpani(m2f(38), 0.55 + 0.02 * k, r, 0.5)), HITS + k * 0.55, 0.6)
        place(M, st(timpani(m2f(38), 0.35 + 0.02 * k, r, 0.4)), HITS + k * 0.55 + 0.18, 0.4)
    place(M, st(pad([m2f(38), m2f(44), m2f(49), m2f(53)], LIGHTS_OUT - HITS, 0.55, r, att=1.5, rel=0.05, warm=900)), HITS, 0.6)
    place(M, st(brass(m2f(26), 2.5, 0.7, r, "tuba", scoop=-30)), PANIC0, 0.5)
    # lights out: silence, only a cold low drone on "Pitch black"
    place(M, st(pad([m2f(26), m2f(33)], SNAP0 - BLACK + 0.3, 0.4, r, att=0.6, rel=0.3, warm=300)), BLACK, 0.6)
    # the snap: snare roll + timpani to the break, a huge hit
    for t0, v in snare_roll(SNAP0 + 0.2, BREAK - 0.03, 0.15, 1.0, r, rate=24):
        place(M, pan(snare(v * 0.5, r, 0.12, buzz=True), -0.1), t0, 0.5)
    place(M, st(timpani(m2f(33), 1.0, r, 2.5)), BREAK, 1.0)
    place(M, st(cymbal(1.0, r, 3.0, 1.1)), BREAK, 0.7)
    place(M, st(brass(m2f(21), 1.6, 1.0, r, "tuba")), BREAK, 0.8)
    # "Luckily": a gentle glock; "Unluckily": low stab and an icy cluster
    for i, nn in enumerate([81, 84, 88]):
        place(M, pan(glock(m2f(nn), 0.5, r, 1.4), 0.2), CALM + 0.1 + i * 0.2, 0.45)
    place(M, st(brass(m2f(26), 0.7, 0.9, r, "tuba")), fr(1110), 0.8)
    place(M, st(pad([m2f(62), m2f(63), m2f(69)], END0 - fr(1110), 0.3, r, att=0.4, rel=0.4, warm=2500)), fr(1110), 0.35)
    # the empty seats: an original slow chorale (D minor -> F), fading out with the picture
    ch = [[50, 57, 62, 65], [46, 53, 62, 65], [48, 55, 60, 64], [45, 52, 61, 64], [50, 57, 62, 65], [41, 53, 60, 65]]
    for i, chord in enumerate(ch):
        t0 = END0 + i * 0.95
        place(M, st(pad([m2f(n) for n in chord], 1.25, 0.45, r, att=0.35, rel=0.6, warm=1200)), t0, 0.55)
    for i, nn in enumerate([74, 72, 72, 73, 74, 77, 76, 74]):
        place(M, pan(vibes(m2f(nn), 0.4, r, 1.6), 0.2), END0 + 0.2 + i * 0.7, 0.35)
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
    mix = fades(mix, 0.002, 1.0)
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
