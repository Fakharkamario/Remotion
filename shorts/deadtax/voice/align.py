# Forced alignment of script.txt to voice (16 kHz copy) with pocketsphinx's bundled en-us model -> words.json
# (times in seconds of voice.wav). Words: {"w","s","e"}.
import json, re, wave
from pocketsphinx import Decoder
txt = open("script.txt").read()
words = re.findall(r"[A-Za-z']+", txt)
d = Decoder(samprate=16000, loglevel="ERROR")
d.add_word("tsarist", "Z AA R IH S T", True)
d.set_align_text(" ".join(w.lower() for w in words))
with wave.open("v16k.wav") as w:
    data = w.readframes(w.getnframes())
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg()]
out = []; wi = 0
for w, s, e in segs:
    if w in ("<s>", "</s>", "<sil>", "[NOISE]") or w.startswith("+"): continue
    base = w.split("(")[0]
    assert base == words[wi].lower(), (base, words[wi], wi)
    out.append({"w": words[wi], "s": round(s, 3), "e": round(e, 3)}); wi += 1
assert wi == len(words), (wi, len(words))
json.dump(out, open("words.json", "w"), indent=0)
for i, o in enumerate(out): print(i, o["w"], o["s"], o["e"])
