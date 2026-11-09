import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
import numpy as np, subprocess
raw = subprocess.run(["ffmpeg","-loglevel","error","-i","voice.wav","-f","f32le","-ac","1","-ar","16000","-"],capture_output=True).stdout
audio = np.frombuffer(raw, np.float32)
segs, _ = m.transcribe(audio, word_timestamps=True, language="en")
out = []
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(out, open("words.json", "w"), indent=0)
print(" ".join(f"{x['w']}@{x['s']}" for x in out))
