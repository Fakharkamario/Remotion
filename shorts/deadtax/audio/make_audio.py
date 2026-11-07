# Soundtrack for "The Man Who Taxed the Dead": synthesized SFX on the picture's event frames (src/videos/deadtax/
# story.ts W cues + cast.ts), an original score in D minor with a Russian flavour (tremolo "balalaika" plucks,
# tuba oom-pah, accordion-ish pad), ducked under the voice, standard mix (music +3 dB, SFX -6 dB, voice unchanged),
# exact picture length (1690 frames @ 30 fps), 48 kHz stereo.
# Run from this folder: python3 make_audio.py  -> mix.wav + stems/ + cues.md
import os
import numpy as np
from scipy.signal import lfilter
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, curve, pan, st, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, write_wav, phase, modal
from instruments import m2f, brass, glock, vibes, musicbox, pluck, snare, snare_roll, cymbal, timpani, pad, triangle
from sfx_gen import clink, whoosh, whoa, bird_chirps, breeze, boot, hammer_hit, crickets, oof, stroll_step

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 1690
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(1724)
cues = []
cue = lambda t, w: cues.append((t, w))
buf = lambda: np.zeros((2, N))

# ------------------------------------------------------------------ picture events (frames)
W = dict(account=82, taxes1=194, gold=258, massive1=289, problem=307, dying=341, year=362, wiping=389, rolls=430,
         solution=447, warfare=508, written=568, census1=593, alive=650, next=711, twenty=805, dropped=871, dead2=881,
         pay=960, taxes2=987, farming=1065, absurd=1100, secretly=1158, buying=1174, rights=1207, thousands=1219,
         ghost=1284, collateral=1319, massive2=1350, loans=1374, die=1493, century=1538, mistake=1609, make=1642)
T = {k: fr(v) for k, v in W.items()}
CUTS = [50, 95, 138, 192, 213, 273, 305, 322, 375, 442, 484, 525, 611, 648, 668, 709, 755, 830, 869, 913, 1000, 1082, 1118, 1171, 1219, 1274, 1338, 1347, 1387, 1445, 1490, 1508, 1560, 1606]
GOLDEN = [(1115, 1387), (1504, TOTAL)]


# ------------------------------------------------------------------ SFX
def coin_clink(r, f0=None):
    f0 = f0 or r.uniform(2600, 3400)
    return modal(0.5, [(f0, 1.0, 0.18), (f0 * 2.76, 0.5, 0.08), (f0 * 5.4, 0.25, 0.04)], r) * 0.5


def jingle(r, n=10, spread=0.5):
    out = np.zeros(ns(spread + 0.6))
    for k in range(n):
        x = coin_clink(r)
        i = ns(r.uniform(0, spread))
        out[i:i + len(x)] += x * r.uniform(0.4, 1.0)
    return out


def thud(r, big=1.0):
    t = tt(0.6)
    body = np.sin(phase(62 * (1 + 0.8 * np.exp(-t / 0.03)))) * np.exp(-t / 0.12) * 1.3 * big
    return body + bp(r.standard_normal(len(t)), 120, 1200, 1) * np.exp(-t / 0.03) * 0.5


def poof(r, d=0.35):
    t = tt(d)
    return bp(r.standard_normal(len(t)), 500, 3500, 1) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * 0.35


def ghost_woo(r, d=1.2, f0=520):
    """theremin-ish 'wooo': sine with wide slow vibrato, gliding down"""
    t = tt(d)
    f = f0 * (1.25 - 0.35 * t / d) * (1 + 0.03 * np.sin(2 * np.pi * 5.5 * t))
    env = np.clip(t / 0.15, 0, 1) * np.clip((d - t) / 0.3, 0, 1)
    return (np.sin(phase(f)) + 0.2 * np.sin(2 * phase(f))) * env * 0.35


def paper_slap(r):
    t = tt(0.3)
    nz = r.standard_normal(len(t))
    return hp(nz, 900) * np.exp(-t / 0.018) * 0.9 + bp(nz, 300, 2000, 1) * np.exp(-t / 0.05) * 0.4


def stamp(r):
    t = tt(0.5)
    nz = r.standard_normal(len(t))
    return np.sin(phase(70 * (1 + np.exp(-t / 0.02)))) * np.exp(-t / 0.09) * 1.4 + bp(nz, 300, 2500, 1) * np.exp(-t / 0.02) * 0.6 + hammer_hit(r, 0.6)[: len(t)] * 0.6


def quill(r, d):
    t = tt(d)
    nz = bp(r.standard_normal(len(t)), 2500, 9000, 1)
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * t) ** 2
    return nz * strokes * 0.18 * np.clip(t / 0.05, 0, 1) * np.clip((d - t) / 0.05, 0, 1)


def flap(r):
    t = tt(0.18)
    return bp(r.standard_normal(len(t)), 700, 5000, 1) * np.exp(-t / 0.04) * (1 + 0.6 * np.sin(2 * np.pi * 38 * t)) * 0.35


def tick(r, hi=True):
    return modal(0.08, [(3200 if hi else 2400, 1.0, 0.012), (5400, 0.4, 0.008)], r) * 0.6


def boing(r):
    t = tt(0.8)
    f = 300 * (1 + 0.5 * np.exp(-t / 0.2)) * (1 + 0.08 * np.sin(2 * np.pi * 11 * t) * np.exp(-t / 0.3))
    return np.sin(phase(f)) * np.exp(-t / 0.3) * 0.5


def sfx():
    S = buf()
    # hook on the street: village air, a cockerel-free breeze, birds
    place(S, st(breeze(fr(213), R, 0.6)), 0.0, 0.5)
    place(S, st(bird_chirps(fr(213), R, density=0.4)), 0.0, 0.3)
    place(S, st(whoosh(0.35, R, peak=0.2)), fr(48), 0.35)
    # "account": phone buzz
    for k in range(3):
        place(S, pan(lp(np.sin(2 * np.pi * 180 * tt(0.12)) * np.sign(np.sin(2 * np.pi * 30 * tt(0.12))), 2000) * 0.25, 0.2), fr(66) + k * 0.16, 0.6)
    cue(fr(66), "phone buzz")
    place(S, st(whoosh(0.6, R, peak=0.3, f_lo=300, f_hi=1800)), fr(93), 0.5)
    # graveyard: the ghost rises (poof + woo), the bill slaps on "taxes"
    place(S, pan(poof(R, 0.6), -0.2), fr(141), 0.8)
    place(S, pan(ghost_woo(R, 1.3), -0.2), fr(146), 0.7)
    place(S, pan(paper_slap(R), 0.1), T["taxes1"], 0.9)
    place(S, st(thud(R, 0.5)), T["taxes1"], 0.4)
    cue(fr(141), "ghost rises: poof + woo"); cue(T["taxes1"], "bill slap")
    place(S, st(whoosh(0.5, R, peak=0.3, f_lo=500, f_hi=4000)), fr(213) - 0.3, 0.7); cue(fr(210), "flash whoosh")
    # palace: the last coin falls into the empty chest
    place(S, pan(coin_clink(R, 3000), -0.2), fr(W["gold"] + 4), 0.9)
    place(S, pan(coin_clink(R, 2700), -0.2), fr(W["gold"] + 8), 0.5)
    place(S, pan(coin_clink(R, 2900), -0.2), fr(W["gold"] + 11), 0.3)
    cue(fr(W["gold"] + 4), "last coin clinks in the empty chest")
    # field: two peasants keel over
    for c in (W["dying"] + 4, W["year"] + 4):
        place(S, pan(oof(R), 0.1), fr(c), 0.5)
        place(S, pan(thud(R), 0.0), fr(c + 7), 0.8)
        place(S, pan(poof(R), 0.0), fr(c + 7), 0.4)
        cue(fr(c), "oof + thud")
    # tax roll: names vanish, one poof each
    for i in range(12):
        place(S, pan(poof(R, 0.2), R.uniform(-0.3, 0.3)), fr(W["wiping"] - 2 + i * 3.2), 0.35)
    cue(T["wiping"], "12 little poofs")
    # census: quill scratching, then the stamp
    place(S, pan(quill(R, fr(592 - 540)), 0.1), fr(540), 0.8)
    place(S, pan(stamp(R), 0.0), T["census1"], 0.9)
    place(S, pan(stamp(R), 0.0), T["alive"], 1.0)
    cue(fr(540), "quill scratch"); cue(T["census1"], "stamp"); cue(T["alive"], "ALIVE stamp")
    place(S, st(whoosh(0.4, R, peak=0.25)), fr(W["next"] - 4), 0.5)
    # 15-20 years: pages flapping past, a racing clock
    for k in range(40):
        place(S, pan(flap(R), R.uniform(-0.8, 0.8)), fr(755) + k * 0.06 + R.uniform(0, 0.03), 0.4)
    for k in range(int((830 - 755) / 30 / 0.09)):
        place(S, pan(tick(R, k % 2 == 0), 0.3), fr(755) + k * 0.09, 0.35)
    place(S, pan(boing(R), 0.0), T["twenty"], 0.6)
    cue(fr(755), "pages flapping + racing clock"); cue(T["twenty"], "dazed boing")
    # grandpa drops
    place(S, st(breeze(fr(913 - 830), R, 0.5)), fr(830), 0.4)
    place(S, pan(oof(R, kind="oof"), 0.1), fr(W["dropped"] + 2), 0.5)
    place(S, pan(thud(R, 1.2), 0.1), T["dead2"], 0.9)
    for k in range(4):
        place(S, pan(glock(m2f(96 + (k % 2) * 3), 0.3, R, 0.6), 0.2), T["dead2"] + 0.15 + k * 0.12, 0.3)
    cue(T["dead2"], "grandpa thud + twinkle stars")
    # family pays: coin tosses
    for c in (W["pay"] - 2 + 12, W["taxes2"] - 4 + 12):
        place(S, pan(whoosh(0.25, R, peak=0.1, f_lo=1500, f_hi=6000), 0.2), fr(c - 12), 0.3)
        place(S, pan(jingle(R, 4, 0.1), 0.3), fr(c), 0.7)
        cue(fr(c), "coin caught")
    # ghost farming: hoe chops + woo
    for k in range(9):
        place(S, pan(thud(R, 0.25) + bp(R.standard_normal(ns(0.6)), 400, 2500, 1) * np.exp(-tt(0.6) / 0.04) * 0.3, 0.1), fr(1004) + k * 0.6 * 1.2566, 0.35)
    place(S, pan(ghost_woo(R, 1.4, 600), 0.0), fr(1010), 0.45)
    place(S, st(bird_chirps(fr(1082 - 1000), R, density=0.4)), fr(1000), 0.25)
    # facepalm slap
    place(S, pan(paper_slap(R), 0.0), fr(W["absurd"] + 2), 0.6)
    cue(fr(W["absurd"] + 2), "facepalm slap")
    # golden: crickets, the sneaky deal, the crane, the ghost crowd
    place(S, st(crickets(fr(1387 - 1118), R)), fr(1118), 0.35)
    place(S, pan(jingle(R, 8, 0.4), 0.1), fr(W["buying"] + 4), 0.7)
    place(S, pan(paper_slap(R), -0.1), fr(W["buying"] + 8), 0.5)
    place(S, st(whoosh(1.6, R, peak=0.45, f_lo=200, f_hi=1400)), fr(1219), 0.5)
    place(S, st(breeze(fr(1274 - 1219), R, 0.9, gust=0.3)), fr(1219), 0.5)
    for k in range(5):
        place(S, pan(ghost_woo(R, 1.6, R.uniform(380, 640)), R.uniform(-0.7, 0.7)), fr(1278) + k * 0.25, 0.3)
    cue(fr(1174), "coin bag handover"); cue(fr(1219), "crane whoosh"); cue(fr(1278), "ghost choir woo")
    # massive loan: coin explosion + coin rain
    place(S, st(thud(R, 1.0)), T["massive2"], 0.7)
    place(S, st(jingle(R, 40, 1.4)), T["massive2"], 0.9)
    cue(T["massive2"], "coin explosion + rain")
    # back to the street
    place(S, st(breeze(fr(1508 - 1387), R, 0.5)), fr(1387), 0.4)
    place(S, st(thud(R, 0.8)), T["die"], 0.6)
    # finale: golden graveyard, ghost grandpa pops up
    place(S, st(crickets(DUR - fr(1508), R)), fr(1508), 0.3)
    place(S, pan(poof(R, 0.5), -0.2), fr(W["mistake"] - 2), 0.8)
    place(S, pan(ghost_woo(R, 1.2, 560), -0.2), T["mistake"], 0.55)
    cue(T["mistake"], "ghost grandpa pops up")
    # hard-cut accents: a soft whoosh on each cut that is not already covered
    for c in CUTS:
        if c in (213, 95, 1219):
            continue
        place(S, st(whoosh(0.22, R, peak=0.12, f_lo=600, f_hi=5000)), fr(c) - 0.12, 0.18)
    return S


# ------------------------------------------------------------------ music: original, D minor, 144 bpm two-step
BPM = 144
BEAT = 60 / BPM


def balalaika(f, dur, vel, r):
    """tremolo-picked string: repeated plucks ~12/s"""
    out = np.zeros(ns(dur + 0.5))
    k, t = 0, 0.0
    while t < dur:
        x = pluck(f, vel * (0.75 + 0.25 * (k % 2)), r, 0.35, bright=0.7, pos=0.12)
        i = ns(t)
        out[i:i + len(x)] += x[: len(out) - i]
        t += 1 / 12.5
        k += 1
    return out


def music():
    M = buf()
    r = rng(5)
    # Hook (0 .. flash): low tuba pulse + pizz, minor, a cheeky question
    roots = [38, 38, 45, 38, 43, 38, 45, 38]  # D D A D G D A D
    mel = [[74, 77, 76, 74], [72, 74, 70, 69], [69, 73, 76, 79], [77, 76, 74, 74], [79, 77, 76, 74], [77, 76, 74, 72], [73, 76, 79, 76], [74, 74, 74, 74]]

    def section(t0, t1, bar0=0, lead=True, lead_inst="bal", vel=0.6, drums=True, pan_l=0.25):
        t, bar = t0, bar0
        while t < t1 - BEAT:
            b = bar % 8
            place(M, st(brass(m2f(roots[b]), BEAT * 0.8, vel, r, "tuba")), t, 0.7)
            place(M, st(brass(m2f(roots[b] + 7), BEAT * 0.6, vel * 0.8, r, "tuba")), t + 2 * BEAT, 0.55)
            # off-beat chord plucks (oom-PAH)
            for k in (1, 3):
                for nn in ([62, 65, 69] if roots[b] == 38 else [61, 64, 69] if roots[b] == 45 else [62, 67, 70]):
                    place(M, pan(pluck(m2f(nn), 0.35, r, 0.3, bright=0.6), -0.3), t + k * BEAT, 0.4)
            if lead:
                for k, nn in enumerate(mel[b]):
                    if t + k * BEAT >= t1: break
                    if lead_inst == "bal":
                        place(M, pan(balalaika(m2f(nn), BEAT * 0.85, 0.5, r), pan_l), t + k * BEAT, 0.55)
                    else:
                        place(M, pan(musicbox(m2f(nn), 0.5, r, 1.2), pan_l), t + k * BEAT, 0.5)
            if drums:
                for k in range(4):
                    place(M, pan(snare(0.22 if k % 2 else 0.12, r, 0.12), -0.1), t + k * BEAT + BEAT / 2, 0.3)
            t += 4 * BEAT
            bar += 1
        return bar

    section(0.0, fr(213), 0)
    place(M, st(cymbal(0.8, r, 2.4)), fr(213), 0.5)
    place(M, st(timpani(m2f(38), 0.9, r, 1.5)), fr(213), 0.8)
    # Peter's theme: pompous, slower brass fanfare + snare (213 .. 442)
    t = fr(213) + 0.1
    fan = [(62, 1), (69, 1), (74, 2), (72, 1), (70, 1), (69, 2), (67, 1), (69, 1), (65, 1), (62, 1)]
    for nn, l in fan * 3:
        if t > fr(375) - 0.2: break
        place(M, st(brass(m2f(nn), BEAT * l * 0.9, 0.6, r, "horn")), t, 0.45)
        place(M, st(brass(m2f(nn - 12), BEAT * l * 0.9, 0.5, r, "tuba")), t, 0.45)
        t += BEAT * l
    place(M, st(brass(m2f(38), 0.5, 0.9, r, "stab")), T["massive1"], 0.6)
    place(M, st(brass(m2f(39), 0.6, 0.9, r, "stab")), T["problem"], 0.7)
    # names vanishing: pizz descending scale
    for i, nn in enumerate([86, 84, 82, 81, 79, 77, 76, 74, 72, 70, 69, 67]):
        place(M, pan(pluck(m2f(nn), 0.5, r, 0.4, bright=0.8), 0.2), fr(W["wiping"] - 2 + i * 3.2), 0.4)
    # "His solution": sinister low brass + timpani, then the nervous tremolo
    for i, nn in enumerate([38, 39, 38, 37]):
        place(M, st(brass(m2f(nn), 0.5, 0.75, r, "tuba")), T["solution"] + i * 0.42, 0.7)
    place(M, st(pad([m2f(50), m2f(53), m2f(56)], fr(525 - 484), 0.4, r, att=0.2, rel=0.3, trem=lambda t: 0.7 + 0.3 * np.sin(2 * np.pi * 8 * t))), fr(484), 0.5)
    # census + ALIVE: march resumes (525 .. 755)
    section(fr(525), fr(650), 0)
    for nn in (62, 66, 69, 74):
        place(M, st(brass(m2f(nn), 0.7, 0.8, r, "horn")), T["alive"], 0.4)
    place(M, st(cymbal(0.7, r, 2.0)), T["alive"], 0.4)
    section(fr(668), fr(755), 2)
    # years flying: fast ticking pizz ostinato, rising
    t, k = fr(755), 0
    while t < fr(830) - 0.1:
        place(M, pan(pluck(m2f(62 + (k % 8) + 2 * (k // 16)), 0.4, r, 0.25, bright=0.8), 0.25 * (-1) ** k), t, 0.4)
        t += BEAT / 2
        k += 1
    # grandpa + family + ghost farming: the main tune again, a little sadder (musicbox lead)
    section(fr(830), fr(W["dropped"]), 0)
    place(M, st(brass(m2f(38), 0.9, 0.6, r, "tuba", fall=-5)), fr(W["dead2"]), 0.6)
    section(fr(913), fr(1082), 4, lead_inst="box")
    place(M, st(brass(m2f(43), 0.4, 0.7, r, "stab")), fr(W["absurd"]), 0.5)
    # golden: sneaky pizzicato tiptoe in D minor (1118 .. 1387)
    t, k = fr(1118), 0
    sneak = [50, 57, 53, 57, 50, 57, 52, 57, 49, 57, 52, 57, 50, 57, 53, 57]
    while t < fr(1338) - 0.1:
        place(M, pan(pluck(m2f(sneak[k % 16]), 0.5, r, 0.4), -0.2), t, 0.5)
        if k % 4 == 0:
            place(M, st(brass(m2f(38 - 12 * 0 + (k // 16) % 2 * 5), 0.25, 0.4, r, "soft")), t, 0.5)
        t += BEAT / 2
        k += 1
    place(M, st(pad([m2f(50), m2f(57), m2f(62), m2f(65)], fr(1338 - 1219), 0.4, r, att=0.6, rel=0.5, warm=1100)), fr(1219), 0.4)
    # massive loan: fanfare
    for nn in (62, 66, 69, 74, 78):
        place(M, st(brass(m2f(nn), 0.9, 0.85, r, "horn")), T["massive2"], 0.4)
    place(M, st(cymbal(0.9, r, 2.6)), T["massive2"], 0.5)
    for i in range(6):
        place(M, pan(glock(m2f(86 + (i % 3) * 3), 0.4, r, 0.8), 0.2), T["massive2"] + 0.2 + i * 0.1, 0.3)
    # back on the street: march, punch on "die"
    section(fr(1387), fr(W["die"]), 0)
    place(M, st(brass(m2f(38), 0.6, 1.0, r, "stab")), T["die"], 0.8)
    place(M, st(timpani(m2f(38), 1.0, r, 1.6)), T["die"], 0.8)
    # finale: slow balalaika tremolo + pad, the tune's last phrase, tuba button on "make"
    place(M, st(pad([m2f(50), m2f(57), m2f(62)], DUR - fr(1508), 0.45, r, att=0.8, rel=0.8, warm=1000)), fr(1508), 0.45)
    t = fr(1512)
    for nn, l in [(74, 2), (77, 2), (76, 2), (74, 2), (72, 2), (69, 2), (70, 2), (69, 2), (74, 4)]:
        if t > fr(W["make"]) - 0.1: break
        place(M, pan(balalaika(m2f(nn), BEAT * l * 0.95, 0.45, r), 0.2), t, 0.5)
        t += BEAT * l
    place(M, st(brass(m2f(45), 0.2, 0.8, r, "tuba")), fr(W["make"] + 8), 0.8)
    place(M, st(brass(m2f(38), 0.5, 0.9, r, "tuba")), fr(W["make"] + 8) + 0.32, 0.9)
    place(M, pan(pluck(m2f(62), 0.6, r, 0.6), 0.0), fr(W["make"] + 8) + 0.32, 0.5)
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
