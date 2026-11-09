# Soundtrack for "The Canary": synthesized SFX on the picture's event frames (src/videos/canary/story.ts + cast.ts),
# the three-note whistle motif (old man, canary, the whole crew), an original folk score that follows the story,
# ducked under the voice; mix to the standard (music +3 dB, SFX -6 dB, voice unchanged), exact picture length.
# Run from this folder: python3 make_audio.py -> mix.wav + stems/ + cues.md
import os
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, fades, st, pan, place, make_ir, convolve_st, integrated, norm_to, true_peak, dbg, read_wav, write_wav, phase, smooth_noise
from instruments import m2f, brass, glock, vibes, musicbox, pluck, snare, snare_roll, cymbal, timpani, pad, whistle, triangle
from sfx_gen import creak, clink, whoosh, bird_chirps, breeze, stroll_step, boot

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 1845
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
R = rng(1911)
cues = []
def cue(t, what): cues.append((t, what))
def buf(): return np.zeros((2, N))

MOTIF = [79, 76, 84]  # G5 E5 C6: the old man's morning call
MINE0, TOP0, END0 = fr(305), fr(1085), fr(1670)

def whistle_at(B, t, midis, step=0.24, dur=0.2, gain=1.0, p=0.0, r=R, falter=None, **kw):
    notes = [(t + i * step, dur, m, 0.9) for i, m in enumerate(midis)]
    t0, y = whistle(notes, r, falter=falter, **kw)
    place(B, pan(y, p), t0, gain)

def canary(B, t, midis, gain=0.8, p=0.1, r=R):
    """the bird: fast trill-y chirps an octave up, each note a little warble"""
    for i, m in enumerate(midis):
        f0 = m2f(m + 12)
        d = 0.16
        tn = tt(d)
        f = f0 * (1 + 0.04 * np.sin(2 * np.pi * 28 * tn)) * (1 + 0.08 * np.exp(-tn / 0.02))
        y = np.sin(phase(f)) * np.minimum(1, tn / 0.01) * np.exp(-np.maximum(0, tn - 0.1) / 0.03)
        place(B, pan(fades(y, 0.004, 0.02), p), t + i * 0.2, gain)

def thud(r, big=1.0, dur=0.6):
    t = tt(dur)
    y = np.sin(phase(70 * (1 + 0.5 * np.exp(-t / 0.03)))) * np.exp(-t / 0.12) * 1.5 * big + lp(r.standard_normal(len(t)), 600) * np.exp(-t / 0.05) * big
    return fades(y)

def pick_hit(r, big=1.0):
    t = tt(0.5)
    nz = r.standard_normal(len(t))
    tink = sum(np.sin(phase(f0 * r.uniform(0.98, 1.02))) * np.exp(-t / tau) for f0, tau in ((2350, 0.05), (3700, 0.03), (5200, 0.02))) * 0.25
    crunch = bp(nz, 400, 4000, 1) * np.exp(-t / 0.035) * 0.9
    knock = np.sin(phase(110)) * np.exp(-t / 0.05) * 0.8
    return fades((tink + crunch + knock) * big)

def cough(r):
    t = tt(0.45)
    nz = r.standard_normal(len(t))
    env = np.exp(-t / 0.09) * np.minimum(1, t / 0.008)
    y = bp(nz, 250, 2500, 2) * env * 1.4 + np.sin(phase(150 * (1 - 0.3 * t))) * env * 0.4
    return fades(y)

def breath(r, dur=0.55):
    t = tt(dur)
    env = np.sin(np.pi * np.minimum(1, t / dur)) ** 1.5
    return fades(bp(r.standard_normal(len(t)), 500, 3500, 1) * env * 0.5)

def tick(r):
    t = tt(0.06)
    return fades(np.sin(phase(3200)) * np.exp(-t / 0.006) * 0.6 + hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.003) * 0.3)

def sfx():
    S, r = buf(), rng(7)
    # ---- dawn at the pithead: breeze + birds
    place(S, breeze(MINE0 + 0.5, r, 0.7), 0, 0.5)
    place(S, st(bird_chirps(MINE0, r, 0.4)), 0, 0.35)
    whistle_at(S, 0.18, MOTIF, gain=1.0, p=-0.15); cue(0.18, "old man whistles the three notes")
    canary(S, fr(74), MOTIF); cue(fr(74), "canary whistles them back")
    # ---- the gallery: room tone, drips, timber creaks
    n = N - ns(MINE0)
    tone = lp(r.standard_normal(n), 140) * 0.35 + bp(r.standard_normal(n), 300, 900) * 0.03
    tone *= (0.8 + 0.2 * smooth_noise(n, r, 0.3))
    mine = np.zeros(n); mine[: ns(TOP0 - MINE0)] = 1
    tone *= np.minimum(1, np.convolve(mine, np.ones(ns(0.2)) / ns(0.2), "same"))
    place(S, st(tone), MINE0, 0.8)
    for k in range(18):
        place(S, pan(clink(r, r.uniform(1800, 3000), 0.15, 0.6), r.uniform(-0.6, 0.6)), MINE0 + 0.7 + k * 1.45 + r.uniform(0, 0.6), 0.12)
    for t0 in (fr(380), fr(600), fr(900)):
        place(S, pan(creak(1.2, r, 80, 120, scale=0.8), -0.4), t0, 0.25)
    # pick strikes (exact frames of the drawn strikes)
    hits = []
    def strikes(f0, per, a, b, p, g):
        f = f0
        while f > a: f -= per
        while f < b:
            if f >= a: hits.append((f, p, g))
            f += per
    for i, (per, p) in enumerate(zip([27, 31, 25], [-0.5, 0.4, 0.2])):
        strikes(327 + 6 * i, per, 305, 392, p, 0.5); strikes(327 + 6 * i, per, 432, 715, p, 0.35)
    strikes(327, 29, 305, 392, 0.0, 0.6); strikes(327, 29, 432, 715, 0.0, 0.4)
    strikes(330, 30, 305, 392, -0.2, 0.6)
    for f, p, g in hits: place(S, pan(pick_hit(r, 1.0), p), fr(f) - 0.01, g * 1.1)
    place(S, pan(pick_hit(r, 1.6), 0), fr(326), 0.5); cue(fr(326), "'hit' a new seam: big pick strike")
    # the old man's whistles that get no answer
    whistle_at(S, fr(470), [79], dur=0.3, gain=0.6, p=-0.1)
    whistle_at(S, fr(482), [76], dur=0.3, gain=0.6, p=-0.1)
    whistle_at(S, fr(521), [79], dur=0.4, gain=0.95, p=-0.1); cue(fr(521), "'One note'")
    whistle_at(S, fr(553), [76], dur=0.45, gain=0.95, p=-0.1); cue(fr(553), "'Two'")
    cue(fr(583), "'Nothing': silence, no answer")
    # pick dropped, clang on the rock floor
    place(S, st(pick_hit(r, 1.4)), fr(695), 0.8); place(S, st(thud(r, 0.6)), fr(695), 0.6); cue(fr(695), "pick lands")
    # footsteps: shoving out, the drag, the walk back
    for k in range(int((fr(1085) - fr(715)) / 0.31)):
        tk = fr(715) + k * 0.31
        if fr(780) <= tk < fr(860): continue
        place(S, pan(stroll_step(r, 0.7), r.uniform(-0.3, 0.3)), tk, 0.35)
    # lamps dim: a sinking hum + flicker
    t = tt(2.0)
    hum = (np.sin(phase(110 * (1 - 0.25 * np.minimum(1, t / 1.2)))) + 0.4 * np.sin(phase(220 * (1 - 0.25 * np.minimum(1, t / 1.2))))) * np.exp(-t / 0.9)
    hum *= 0.6 + 0.4 * (np.sin(2 * np.pi * 9 * t) > 0)
    place(S, st(fades(hum * 0.4)), fr(978), 0.6); cue(fr(978), "lamps dim")
    for f in (1022, 1061):
        place(S, st(thud(r, 1.0)), fr(f), 0.9); place(S, pan(boot(r, 0.8), 0.1), fr(f) - 0.15, 0.4); cue(fr(f), "a man stumbles")
    # ---- at the top: breeze, birds, coughs, breaths, the revival
    place(S, breeze(DUR - TOP0, r, 0.6), TOP0, 0.5)
    place(S, st(bird_chirps(DUR - TOP0, r, 0.3)), TOP0, 0.3)
    for f in (1123, 1134, 1147, 1160, 1186, 1214):
        place(S, pan(cough(r), 0.2), fr(f), 0.7)
    cue(fr(1123), "Tommy coughing")
    for f in (1271, 1295):
        place(S, st(breath(r)), fr(f), 0.8); cue(fr(f), "breath into the bird")
    canary(S, fr(1324), MOTIF, gain=0.9); cue(fr(1324), "the canary sings: three notes")
    for f in (1372, 1398, 1424):
        canary(S, fr(f), [MOTIF[0], MOTIF[2]], gain=0.45, p=0.3)
    place(S, st(whoosh(1.6, r, 0.5, 200, 900)), fr(1462), 0.25); cue(fr(1462), "the gas drifts in (soft)")
    for k in range(int((fr(1670) - fr(1632)) / 0.5)):
        place(S, pan(tick(r), -0.3), fr(1632) + k * 0.5, 0.6)
    cue(fr(1632), "pocket watch ticks: 'you had minutes'")
    # ---- the ending: the whole crew whistles, Tommy loudest
    for i in range(6):
        for rep in range(3):
            whistle_at(S, fr(1704) + rep * 0.9 + 0.02 * i, MOTIF, gain=0.35, p=-0.6 + 0.24 * i, r=rng(40 + i), detune=0.1 * (i - 2.5))
    for rep in range(3):
        whistle_at(S, fr(1774) + rep * 0.8, MOTIF, gain=1.0 + 0.1 * rep, p=0.0, r=rng(77), bright=0.06)
    canary(S, fr(1808), MOTIF, gain=0.6, p=0.4)
    cue(fr(1704), "crew whistles"); cue(fr(1774), "Tommy whistles loudest")
    return S

def music():
    M, r = buf(), rng(3)
    beat = 60 / 96
    # A: morning folk (C major): plucked bass + chords, music-box melody of the motif
    prog = [(48, [60, 64, 67]), (53, [60, 65, 69]), (55, [59, 62, 67]), (48, [60, 64, 67])]
    t, k = 0.0, 0
    while t < MINE0 - 0.3:
        root, ch = prog[(k // 4) % 4]
        place(M, st(pluck(m2f(root - 12 if k % 2 == 0 else root - 5), 0.7, r, 0.8)), t, 0.6)
        if k % 2 == 1:
            for j, nn in enumerate(ch): place(M, pan(pluck(m2f(nn), 0.4, r, 0.6), 0.25), t + 0.01 * j, 0.35)
        t += beat; k += 1
    for i, nn in enumerate([79, 76, 84, 79, 76, 84, 83, 79]):
        place(M, pan(musicbox(m2f(nn), 0.45, r, 1.0), -0.2), 4.2 + i * beat, 0.35)
    # B: the gallery (A minor), sparse and low; tension from "Nothing"
    place(M, st(pad([m2f(45), m2f(52), m2f(57)], fr(583) - MINE0, 0.4, r, att=1.0, rel=0.5, warm=500)), MINE0, 0.5)
    for i, nn in enumerate([69, 72, 76, 74, 72, 69, 67, 69]):
        place(M, pan(pluck(m2f(nn), 0.35, r, 1.2), 0.2), MINE0 + 0.8 + i * 1.3, 0.3)
    place(M, st(pad([m2f(44), m2f(50), m2f(53)], fr(690) - fr(583), 0.5, r, att=0.8, rel=0.3, warm=420)), fr(583), 0.55)
    for k in range(int((fr(690) - fr(583)) / 0.75)):
        place(M, st(timpani(m2f(33), 0.45, r, 0.6)), fr(583) + k * 0.75, 0.6)
    # C: the rush out (D minor, 132 bpm) until the top
    b2, t, k = 60 / 132, fr(688), 0
    run = [38, 38, 41, 38, 36, 36, 34, 33]
    place(M, st(cymbal(0.6, r, 2.0)), fr(688), 0.4)
    while t < TOP0 - 0.1:
        root = run[(k // 4) % 8]
        if k % 2 == 0: place(M, st(brass(m2f(root), 0.18, 0.7, r, "tuba")), t, 0.6)
        place(M, pan(snare(0.4 if k % 2 else 0.25, r, 0.12), -0.1), t, 0.35)
        if fr(978) < t < fr(1070) and k % 4 == 0: place(M, st(timpani(m2f(31), 0.7, r, 0.8)), t, 0.6)
        t += b2 / 2; k += 1
    place(M, st(timpani(m2f(33), 1.0, r, 2.0)), TOP0, 0.8); place(M, st(cymbal(0.7, r, 2.5)), TOP0, 0.4)
    # D: the top, the bird in his hands (F major hush) -> revival chord
    place(M, st(pad([m2f(53), m2f(57), m2f(60)], fr(1322) - TOP0, 0.4, r, att=1.2, rel=0.6, warm=600)), TOP0 + 0.3, 0.45)
    for j, nn in enumerate([72, 76, 79, 84]):
        place(M, pan(glock(m2f(nn), 0.6, r, 1.6), 0.15), fr(1326) + 0.09 * j, 0.45)
    place(M, st(pad([m2f(48), m2f(55), m2f(64)], 1.8, 0.4, r, att=0.2, rel=0.8, warm=900)), fr(1326), 0.45)
    # E: the explanation: curious light pizzicato + vibes (F major) until "When the singing stopped"
    t, k = fr(1362), 0
    bass = [41, 41, 48, 48, 46, 46, 41, 43]
    while t < fr(1600):
        place(M, st(pluck(m2f(bass[(k // 2) % 8] - 12 + (7 if k % 2 else 0)), 0.55, r, 0.7)), t, 0.5)
        if k % 4 == 2: place(M, pan(vibes(m2f([69, 72, 74, 72][(k // 4) % 4]), 0.4, r, 1.2), 0.3), t, 0.3)
        t += beat / 2 * 2; k += 1
    place(M, st(pad([m2f(41), m2f(48), m2f(56)], fr(1670) - fr(1600), 0.35, r, att=0.4, rel=0.4, warm=450)), fr(1600), 0.4)
    # F: reprise: the morning tune, warm and full, under the crew's whistle
    t, k = END0, 0
    while t < DUR - 0.6:
        root, ch = prog[(k // 4) % 4]
        place(M, st(pluck(m2f(root - 12 if k % 2 == 0 else root - 5), 0.75, r, 0.8)), t, 0.6)
        if k % 2 == 1:
            for j, nn in enumerate(ch): place(M, pan(pluck(m2f(nn), 0.45, r, 0.6), 0.25), t + 0.01 * j, 0.4)
        if k % 4 == 0: place(M, st(brass(m2f(ch[0]), beat * 3.5, 0.4, r, "horn")), t, 0.25)
        t += beat; k += 1
    place(M, st(pad([m2f(48), m2f(55), m2f(64), m2f(72)], 1.2, 0.5, r, att=0.1, rel=0.6)), DUR - 1.4, 0.4)
    place(M, pan(glock(m2f(84), 0.6, r, 1.4), 0.2), DUR - 1.3, 0.4)
    return M

def main():
    v, vsr = read_wav(os.path.join(HERE, "..", "voice", "voice.wav"))
    v = st(v)
    V = np.zeros((2, N)); n = min(N, v.shape[1]); V[:, :n] = v[:, :n]
    S, M = sfx(), music()
    rev = make_ir(1.1, 3, hf=0.6)
    M = 0.85 * M + 0.15 * convolve_st(M, rev)[:, :N]
    S = 0.88 * S + 0.12 * convolve_st(S, rev)[:, :N]
    V = norm_to(V, -16.0, "integrated")
    M = norm_to(M, -21.0, "integrated") * dbg(3.0)
    S = norm_to(S, -21.0, "integrated") * dbg(-6.0)
    from scipy.signal import lfilter
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
    mix = fades(mix, 0.002, 0.3)
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
