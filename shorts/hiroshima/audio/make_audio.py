# Soundtrack for "60 Seconds" (Hiroshima, 6 Aug 1945): synthesized SFX on the picture's event frames (story.ts W),
# an original score (koto-like plucks in the In scale over soft pads, darkening as the planes come, a heartbeat for the
# last beats), ducked under the voice, mixed to the skill standard (music +3 dB, SFX -6 dB, voice unchanged), exact
# picture length (1650 frames @ 30 fps), 48 kHz stereo.  Run: python3 make_audio.py -> mix.wav + stems/ + cues.md
import os
import numpy as np
from scipy.signal import lfilter
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, curve, pan, st, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, write_wav, phase, modal, smooth_noise, colored
from instruments import m2f, pluck, pad, glock, timpani, musicbox
from sfx_gen import creak, clink, rattle, whoosh, bird_chirps, breeze, stroll_step, babble, WOOD

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 1650
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(1945)
cues = []
cue = lambda t, w: cues.append((t, w))
buf = lambda: np.zeros((2, N))

# ------------------------------------------------------------------ picture events (frames, story.ts)
W = dict(hiroshima=28, sips=212, tea=237, orSo=313, fifty=362, laughs=457, children=500, klass=565, forty=585, drone=618, above=669,
         planes=717, thirty=764, drone2=785, heavier=804, pushes=843, open=867, silver=883, glint=912, twenty=959, pats=1027,
         sit=1054, ten=1099, slips=1153, plane=1181, falls=1204, sunBright=1230, five=1264, stands=1290, three=1326, takes=1348,
         one=1376, then=1401, white=1445, year=1482, gone=1577)
FLASH = fr(1403)
SHOT_A = [0, 62, 142, 253, 362, 451, 500, 585, 687, 764, 828, 883, 959, 1054, 1099, 1181, 1230, 1264, 1326, 1376, 1401, 1462, TOTAL]
ROOM = {3, 5, 6, 10, 13, 14, 18, 19, 20}
OUTSIDE = {1, 4, 7, 9, 11, 17}
shot_t = lambda i: (fr(SHOT_A[i - 1]), fr(SHOT_A[i]))

# ------------------------------------------------------------------ sources
def cicadas(dur, r, level=1.0):
    """Japanese summer cicadas (aburazemi sizzle + minmin calls): band noise in pulsing phrases"""
    n = ns(dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for v in range(4):
        fc = r.uniform(3800, 6200)
        sizzle = bp(r.standard_normal(n), fc * 0.8, fc * 1.25, 2)
        am = 0.55 + 0.45 * np.sin(2 * np.pi * r.uniform(35, 60) * t + r.uniform(0, 6))
        phrase = 0.35 + 0.65 * np.clip(smooth_noise(n, r, r.uniform(0.15, 0.35)) * 1.6, 0, 1)
        y += sizzle * am * phrase * r.uniform(0.5, 1.0)
    # one minmin-zemi call: "meen meen" tone pulses
    tm = r.uniform(0.5, 2.0)
    while tm < dur - 1.0:
        for k in range(r.integers(4, 8)):
            L = 0.32; tl = tt(L)
            f = 3400 * (1 + 0.06 * np.sin(np.pi * tl / L))
            c = np.sin(phase(f)) * (0.5 + 0.5 * np.sin(2 * np.pi * 90 * tl)) * np.sin(np.pi * tl / L) ** 2
            i0 = ns(tm + k * 0.36)
            if i0 + len(c) < n: y[i0:i0 + len(c)] += 0.5 * c
        tm += r.uniform(5, 9)
    return y * level

def engines(dur, r, env):
    """B-29 drone: four 18-cylinder radials, prop blade-rate hums slightly detuned (beating), exhaust rumble"""
    n = ns(dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for k, f0 in enumerate([41.0, 41.6, 40.4, 42.1]):
        wob = 1 + 0.004 * np.sin(2 * np.pi * r.uniform(0.1, 0.3) * t)
        ph = phase(f0 * wob)
        for h, a in [(1, 1.0), (2, 0.6), (3, 0.45), (4, 0.3), (6, 0.18), (8, 0.1)]:
            y += a * np.sin(h * ph + r.uniform(0, 6)) / 4
    y += 0.8 * lp(colored(n, r, 1.0), 260, 2)
    return lp(y, 900, 2) * env[:n]

def heartbeat(r, big=1.0):
    t = tt(0.5)
    th = lambda d: np.sin(phase(52 * (1 + 0.6 * np.exp(-t / 0.02)))) * np.exp(-t / 0.09) * (t >= 0)
    a = th(0); b = np.zeros_like(a); s = ns(0.2); b[s:] = a[:-s] * 0.65
    return lp(a + b, 180, 2) * big

def tick(r, hi=True):
    return modal(0.12, [(2900 if hi else 2400, 1.0, 0.012), (5200 if hi else 4300, 0.5, 0.008), (1300, 0.4, 0.02)], r) * 0.6 + \
        hp(r.standard_normal(ns(0.12)), 2000) * np.exp(-tt(0.12) / 0.002) * 0.25

def cup_clink(r):
    return modal(0.6, [(1780, 1.0, 0.25), (3150, 0.6, 0.15), (4820, 0.35, 0.08)], r) * 0.5

def rustle(dur, r):
    n = ns(dur)
    x = bp(r.standard_normal(n), 1500, 7000, 1) * (0.3 + 0.7 * np.clip(smooth_noise(n, r, 9) * 2, 0, 1))
    return fades(x * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.7 * 0.35, 0.01, 0.05)

def shoji_slide(dur, r):
    n = ns(dur)
    roll = bp(r.standard_normal(n), 250, 2400, 1) * 0.35
    clk = rattle(dur, r, 26, np.ones(n) * 0.5, heavy=True) * 0.6
    y = (roll + clk) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.6
    stop = modal(0.3, [(420, 1.0, 0.04), (900, 0.6, 0.03)], r) * 0.7
    out = np.zeros(n + ns(0.3)); out[:n] += y; out[n - ns(0.03):n - ns(0.03) + len(stop)] += stop
    return out

def release_clunk(r):
    t = tt(1.2)
    m = modal(1.2, [(180, 1.0, 0.2), (410, 0.7, 0.15), (920, 0.5, 0.08), (1830, 0.3, 0.05)], r)
    return m + np.sin(phase(65 * (1 + np.exp(-t / 0.02)))) * np.exp(-t / 0.15) * 0.8

def flash_crack(r):
    t = tt(2.5)
    nz = r.standard_normal(len(t))
    return hp(nz, 1500) * np.exp(-t / 0.05) * 0.6 + np.sin(phase(4200 * np.exp(-t / 3))) * np.exp(-t / 1.2) * 0.15

def ring(dur):
    t = tt(dur)
    return np.sin(2 * np.pi * 3600 * t) * np.exp(-t / (dur / 2.2)) * 0.1

def boom(r, dur=7.0):
    """the blast reaching us: a cracking front, then a long low roll"""
    n = ns(dur); t = np.arange(n) / SR
    nz = r.standard_normal(n)
    front = bp(nz, 60, 2500, 1) * np.exp(-t / 0.18) * 1.2
    sub = np.sin(phase(34 * (1 + 0.8 * np.exp(-t / 0.4)))) * np.exp(-t / 2.2) * 1.6
    roll = lp(colored(n, r, 1.5), 180, 2) * (1 - np.exp(-t / 0.3)) * np.exp(-t / 2.6) * 3
    crackle = hp(nz, 800) * (np.abs(smooth_noise(n, r, 30)) > 0.7) * np.exp(-t / 1.0) * 0.3
    return fades(front + sub + roll + crackle, 0.0005, 0.5)

# ------------------------------------------------------------------ SFX
def sfx():
    S = buf()
    # ambience per shot: cicadas + sparrows outside, the same muffled through the walls inside, a soft street murmur
    for i in range(1, 23):
        a, b = shot_t(i)
        if i >= 21: continue
        d = b - a + 0.08
        if i in OUTSIDE or i in (2, 8, 12):
            lev = 0.5 if i in (2,) else 0.9
            c = cicadas(d, R, lev)
            place(S, st(fades(c, 0.02, 0.04)) * np.array([[0.9], [1.0]]), a, 2.2)
            place(S, pan(fades(bird_chirps(d, R, 0.6), 0.02, 0.04), R.uniform(-0.6, 0.6)), a, 0.7)
            if i in (1, 4, 7, 9):
                place(S, pan(fades(babble(d, R, 140, 1.0) * 0.5, 0.02, 0.04), 0.3), a, 0.4)
        elif i in ROOM:
            c = lp(cicadas(d, R, 0.6), 2600, 2)
            place(S, st(fades(c, 0.02, 0.04)), a, 1.4)
            place(S, st(fades(lp(colored(ns(d), R, 1.0), 500) * 0.15, 0.02, 0.04)), a, 1.2)
    cue(0, "summer: cicadas, sparrows, street murmur (muffled indoors)")
    # the clock under everything: one tick a second until the flash, louder toward the end
    k = 0; t0 = 0.05
    while t0 < FLASH - 0.05:
        g = 0.6 + 1.2 * (t0 / FLASH) ** 2
        place(S, pan(tick(R, k % 2 == 0), 0.15), t0, g)
        t0 += 1.0; k += 1
    cue(0.05, "clock tick every second until the flash")
    # breakfast
    place(S, pan(rustle(0.7, R), 0.35), fr(146), 1.4); cue(fr(146), "newspaper rustle")
    place(S, pan(cup_clink(R), -0.2), fr(W["sips"] - 2), 1.1); cue(fr(W["sips"]), "cup lifted (clink)")
    place(S, pan(lp(R.standard_normal(ns(0.35)), 2500) * np.sin(np.pi * np.linspace(0, 1, ns(0.35))) * 0.12, -0.1), fr(W["tea"]), 1.5); cue(fr(W["tea"]), "sip")
    place(S, pan(rustle(0.6, R), 0.3), fr(366), 1.1)
    # kids running past
    for k in range(26):
        place(S, pan(stroll_step(R, 0.3), R.uniform(-0.5, 0.5)), fr(W["children"]) + k * 0.13 + R.uniform(-0.02, 0.02), 0.7 * (1 - k / 30))
    cue(fr(W["children"]), "kids' running feet")
    # the drone: from a whisper at "drone", heavier on "heavier", loud with the bombers, roaring alongside the plane
    d0 = fr(W["drone"] - 12)
    env_pts = [(0, 0), (fr(669) - d0, 0.25), (fr(764) - d0, 0.3), (fr(W["heavier"]) - d0, 0.55), (fr(W["silver"]) - d0, 0.8),
               (fr(958) - d0, 0.75), (fr(959) - d0, 0.35), (fr(1098) - d0, 0.4), (fr(1099) - d0, 0.85), (fr(1180) - d0, 0.85),
               (fr(1181) - d0, 0.35), (fr(1264) - d0, 0.22), (FLASH - d0, 0.22), (FLASH + 0.01 - d0, 0)]
    dd = FLASH - d0 + 0.05
    env = curve(ns(dd), env_pts)
    # inside the room the drone is muffled
    eng = engines(dd, R, env)
    place(S, st(eng), d0, 1.6)
    cue(d0, "B-29 drone: faint -> heavier -> roaring alongside -> distant")
    place(S, st(breeze(fr(1181 - 1099), R, 0.9, bright=1600)), fr(1099), 0.6); cue(fr(1099), "wind at altitude")
    place(S, pan(shoji_slide(fr(W["open"] - W["pushes"] + 4), R), 0.1), fr(W["pushes"] - 4), 1.6); cue(fr(W["pushes"]), "shoji slides open")
    for k in range(3):
        place(S, pan(glock(m2f(96 + 2 * k), 0.4, R, 0.8), -0.3 + 0.3 * k), fr(W["glint"] + k * 5), 0.6)
    cue(fr(W["glint"]), "glint shimmer")
    for k in range(2):
        place(S, pan(lp(R.standard_normal(ns(0.08)), 900) * np.exp(-tt(0.08) / 0.02) * 0.6, -0.2), fr(W["pats"]) + k * 0.36, 1.2)
    place(S, st(release_clunk(R)), fr(W["slips"] - 2), 1.6); cue(fr(W["slips"]), "bomb bay release clunk")
    place(S, st(whoosh(fr(1264 - 1181), R, peak=0.75, f_lo=300, f_hi=2600, tail=0.1)), fr(1181), 0.7); cue(fr(1181), "the fall: rising wind")
    place(S, pan(creak(0.7, R, 70, 120, WOOD, rough=0.15), 0.2), fr(W["stands"]), 0.9); cue(fr(W["stands"]), "tatami creak as he stands")
    # heartbeat for the last ten seconds, faster and louder
    t0, k = fr(W["ten"]), 0
    while t0 < FLASH - 0.15:
        u = (t0 - fr(W["ten"])) / (FLASH - fr(W["ten"]))
        place(S, st(heartbeat(R)), t0, 1.2 + 1.4 * u)
        t0 += 0.95 - 0.35 * u; k += 1
    cue(fr(W["ten"]), "heartbeat to the flash")
    # the flash: a bright crack and a ring through the white; the blast arrives a beat later and rolls on
    place(S, st(flash_crack(R)), FLASH, 0.9)
    place(S, st(ring(4.0)), FLASH, 0.8)
    place(S, st(lp(boom(R, 9.0), 900)), fr(1428), 1.05)
    cue(FLASH, "flash crack + ring"); cue(fr(1428), "the blast: boom and long roll")
    # aftermath: hot wind on the hill, distant crackle
    place(S, st(fades(breeze(DUR - fr(1462), R, 1.0, gust=0.25, bright=700), 1.5, 2.0)), fr(1462), 1.3)
    cue(fr(1462), "aftermath wind")
    return S

# ------------------------------------------------------------------ music
IN = [62, 63, 67, 69, 70, 74, 75, 79, 81, 82]  # D In scale (D Eb G A Bb), two octaves
def koto(f, vel, r, dur=1.4):
    return pluck(f, vel, r, dur, bright=0.75, pos=0.12)

def music():
    M = buf(); r = rng(806)
    # opening: calm, a little hopeful: koto figure + soft pad (D minor add9) over the morning (0 .. "forty")
    place(M, st(pad([m2f(50), m2f(57), m2f(62), m2f(64)], fr(585) + 0.6, 0.35, r, att=1.5, rel=1.2, warm=700)), 0.0, 0.45)
    figure = [74, 70, 69, 67, 69, 70, 74, 75, 74, 70, 67, 63]
    t, i = 0.45, 0
    while t < fr(585) - 0.4:
        nn = figure[i % len(figure)]
        place(M, pan(koto(m2f(nn), 0.5, r), 0.2), t, 0.55)
        if i % 4 == 0: place(M, pan(koto(m2f(nn - 12), 0.4, r, 2.0), -0.25), t, 0.45)
        t += 0.62 if i % 4 != 3 else 0.93
        i += 1
    cue(0.45, "score: koto figure in D In scale over a soft pad")
    # FORTY .. TEN: the figure thins, the pad darkens (Eb over D), low pulses
    place(M, st(pad([m2f(38), m2f(50), m2f(51), m2f(58)], fr(1099 - 585), 0.42, r, att=1.0, rel=0.4, warm=500)), fr(585), 0.5)
    t, i = fr(590), 0
    while t < fr(1099) - 0.3:
        place(M, pan(koto(m2f([62, 63, 62, 58][i % 4]), 0.35, r, 2.2), -0.15), t, 0.45)
        t += 1.24; i += 1
    for t0 in np.arange(fr(764), fr(1099) - 0.2, 0.62):
        place(M, st(timpani(m2f(38), 0.25, r, 0.6)), t0, 0.3)
    cue(fr(585), "score darkens: Eb over D, low pulses from 'thirty'")
    # TEN .. ONE: a rising swell, the heartbeat carries it; single koto notes on 5 / 3 / 1
    sw = pad([m2f(38), m2f(45), m2f(51), m2f(57), m2f(63)], FLASH - fr(1099), 0.5, r, att=6.0, rel=0.02, warm=1400)
    place(M, sw, fr(1099), 0.55)
    for f0, nn in [(1264, 75), (1326, 74), (1376, 70)]:
        place(M, st(koto(m2f(nn), 0.7, r, 2.4)), fr(f0), 0.6)
        place(M, st(koto(m2f(nn - 12), 0.6, r, 2.4)), fr(f0), 0.5)
    cue(fr(1099), "swell to the flash; koto on five / three / one")
    # aftermath: a slow lament, sparse low koto and a cold pad, into the fade
    place(M, st(pad([m2f(38), m2f(45), m2f(50), m2f(53)], DUR - fr(1470), 0.4, r, att=2.5, rel=1.5, warm=600)), fr(1470), 0.5)
    for k, nn in enumerate([62, 58, 57, 55, 50]):
        place(M, pan(koto(m2f(nn), 0.5, r, 3.0), 0.1), fr(1490) + k * 1.6, 0.5)
    place(M, st(musicbox(m2f(74), 0.25, r, 3.0)), fr(1600), 0.25)
    cue(fr(1470), "lament into the fade")
    # hard cut on the flash: no music through the white
    M[:, ns(FLASH):ns(fr(1470))] = 0
    return M

# ------------------------------------------------------------------ mix
def main():
    v, vsr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
    v = st(v) if v.ndim == 1 else v
    V = np.zeros((2, N)); n = min(N, v.shape[1]); V[:, :n] = v[:, :n]
    S, M = sfx(), music()
    rev = make_ir(1.6, 3, hf=0.55)
    M = 0.8 * M + 0.2 * convolve_st(M, rev)[:, :N]
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
    if tp > -1.0: mix *= dbg(-1.0 - tp)
    mix = fades(mix, 0.002, 0.4)
    os.makedirs(os.path.join(HERE, "stems"), exist_ok=True)
    for name, x in (("voice", V), ("music", M * g), ("sfx", S)):
        write_wav(os.path.join(HERE, "stems", f"{name}.wav"), x)
    write_wav(os.path.join(HERE, "mix.wav"), mix)
    with open(os.path.join(HERE, "cues.md"), "w") as fh:
        fh.write("# Sound cues (s, frame @30)\n\n")
        for t0, w in sorted(cues): fh.write(f"- {t0:6.2f} s (f {round(t0 * FPS):4d}): {w}\n")
    print(f"mix {mix.shape[1] / SR:.3f} s, integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP")

if __name__ == "__main__":
    main()
