import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
import numpy as np, subprocess
aud = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i","voice.wav","-ar","16000","-ac","1","-f","f32le","-"],capture_output=True).stdout, dtype=np.float32)
segs, info = m.transcribe(aud, word_timestamps=True, beam_size=5)
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(words, open("words.json", "w"), indent=0)
print(len(words), "words")
