"""Stand-in narration: espeak-ng + MBROLA us2, one phrase per call, joined with fixed gaps.
Writes voice.wav (48 kHz mono) and words.json [{w, s, e}] (word times spread by letter count inside each phrase)."""
import json, subprocess, wave, os, re
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
PHRASES = [  # (text, gap after in seconds)
    ("The Titanic was way more horrifying than you were taught.", 0.55),
    ("It's eleven forty at night, and you're asleep.", 0.35),
    ("Then, a long, grinding shudder.", 0.45),
    ("Most people just rolled over and went back to sleep.", 0.45),
    ("Twenty five minutes later, a knock.", 0.25),
    ("Top deck. Now.", 0.4),
    ("You go up in your pyjamas, thinking it's a drill.", 0.4),
    ("The crew already knows the ship is sinking.", 0.25),
    ("You don't.", 0.45),
    ("A band plays cheerful music, so nobody panics.", 0.3),
    ("The first lifeboats leave half empty.", 0.45),
    ("Below you, seawater creeps down the hallways.", 0.45),
    ("By two a m, it hits you.", 0.25),
    ("There are only enough boats for half of you.", 0.5),
    ("The lights go out.", 0.3),
    ("No moon.", 0.25),
    ("Pitch black.", 0.5),
    ("At two eighteen, the ship snaps in half.", 0.6),
    ("Luckily, the sea is perfectly calm.", 0.3),
    ("Unluckily, it's twenty eight degrees.", 0.6),
    ("The lifeboats had room for nearly twelve hundred people.", 0.35),
    ("Only about seven hundred made it.", 0.0),
]
def synth(text):
    raw = subprocess.run(["espeak-ng", "-v", "mb-us2", "-s", "185", "-p", "40", "--stdout", text],
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
    out += [x, np.zeros(int(gap * 1.1 * SR), np.float32)]; t += d + gap * 1.1
y = np.concatenate(out); y = np.concatenate([y, np.zeros(max(0, int(45.0 * SR) - len(y)), np.float32)])[: int(45.0 * SR)]
y = y / (np.abs(y).max() + 1e-9) * 0.7
with wave.open(os.path.join(HERE, "voice.wav"), "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((y * 32767).astype(np.int16).tobytes())
json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=0)
print(f"voice {len(y)/SR:.2f}s, {len(words)} words")
for w in words: print(w["w"], w["s"], round(w["s"]*30))
