"""Stand-in narration: espeak-ng + MBROLA us2, one phrase per call, joined with fixed gaps.
Writes voice.wav (48 kHz mono) and words.json [{w, s, e}] (word times spread by letter count inside each phrase)."""
import json, subprocess, wave, os, re
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
PHRASES = [  # (text, gap after in seconds)
    ("In nineteen nineteen, Boston was hit by a tidal wave of molasses.", 0.45),
    ("A giant tank on the waterfront held two point three million gallons of syrup.", 0.30),
    ("It leaked so badly, the company painted it brown, so nobody would notice.", 0.35),
    ("It groaned.", 0.20),
    ("Its rivets popped like gunshots.", 0.30),
    ("Then it burst.", 0.45),
    ("A brown wave, twenty five feet high, rolled through the streets at thirty five miles an hour.", 0.40),
    ("Luckily, molasses is slow.", 0.25),
    ("Unluckily, not this time.", 0.40),
    ("Cold syrup turns thick, like honey from the fridge.", 0.25),
    ("In the freezing air, the wave set like glue around everyone it caught.", 0.40),
    ("Afterwards, engineers had to sign off on their designs.", 0.35),
    ("And on hot days, locals swear the street still smells sweet.", 0.0),
]
def synth(text):
    raw = subprocess.run(["espeak-ng", "-v", "mb-us2", "-s", "205", "-p", "45", "--stdout", text],
                         capture_output=True, check=True).stdout
    tmp = os.path.join(HERE, "_p.wav"); open(tmp, "wb").write(raw)
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", tmp, "-ar", str(SR), "-ac", "1", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    os.remove(tmp)
    x = np.frombuffer(pcm, np.float32).copy()
    nz = np.where(np.abs(x) > 0.01)[0]
    return x[nz[0]:nz[-1] + 1] if len(nz) else x
lead = 0.25
out, words, t = [np.zeros(int(lead * SR), np.float32)], [], lead
for text, gap in PHRASES:
    x = synth(text); d = len(x) / SR
    toks = text.split(); L = [len(re.sub(r"\W", "", w)) + 1.5 for w in toks]; tot = sum(L); c = t
    for w, l in zip(toks, L):
        dd = d * l / tot; words.append({"w": re.sub(r"[^\w']", "", w), "s": round(c, 3), "e": round(c + dd, 3)}); c += dd
    out += [x, np.zeros(int(gap * 0.75 * SR), np.float32)]; t += d + gap * 0.75
y = np.concatenate(out + [np.zeros(int(0.6 * SR), np.float32)])
y = y / (np.abs(y).max() + 1e-9) * 0.7
with wave.open(os.path.join(HERE, "voice.wav"), "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((y * 32767).astype(np.int16).tobytes())
json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=0)
print(f"voice {len(y)/SR:.2f}s, {len(words)} words")
for w in words:
    if w["w"] in ("molasses", "syrup", "brown", "groaned", "gunshots", "burst", "wave", "slow", "time", "fridge", "glue", "designs", "sweet"):
        print(w["w"], w["s"], round(w["s"]*30))
