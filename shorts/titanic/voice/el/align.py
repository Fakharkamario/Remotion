"""Forced alignment of the script to voice_el.mp3 (pocketsphinx, bundled en-us model) -> el_words.json."""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
from pocketsphinx import Decoder
old = json.load(open(os.path.join(HERE, "..", "words_old.json")))
words = [re.sub(r"[^a-z']", "", w["w"].lower()) for w in old]
words = [("pajamas" if w == "pyjamas" else w) for w in words]
d = Decoder(samprate=16000, bestpath=False)
d.add_word("unluckily", "AH N L AH K AH L IY", True)
for w in set(words):
    if d.lookup_word(w) is None: print("missing", w)
d.set_align_text(" ".join(words))
buf = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "voice_el.mp3"), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
d.start_utt(); d.process_raw(buf, full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ("<s>", "</s>", "<sil>")]
print(len(segs), len(words))
out = [{"w": o["w"], "s": round(s, 3), "e": round(e, 3)} for o, (_, s, e) in zip(old, segs)]
json.dump(out, open(os.path.join(HERE, "el_words.json"), "w"), indent=0)
for o in out: print(o["w"], o["s"], o["e"])
