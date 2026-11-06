import json
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe("voice.wav", word_timestamps=True, language="en")
W = [{"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)} for s in segs for w in s.words]
json.dump(W, open("words.json","w"), indent=0)
print(" ".join(f"{w['w']}@{w['s']}" for w in W))
