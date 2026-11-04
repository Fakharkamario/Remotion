import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(sys.argv[1], word_timestamps=True)
out = []
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(out, open(sys.argv[2], "w"), indent=0)
print(" ".join(f"{o['w']}[{o['s']}-{o['e']}]" for o in out))
