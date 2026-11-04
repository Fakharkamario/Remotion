import json, wave, sys
from pocketsphinx import Decoder
text = open("script.txt").read().split()
d = Decoder(samprate=16000, bestpath=False)
d.set_align_text(" ".join(text))
with wave.open("raw16.wav","rb") as w: pcm = w.readframes(w.getnframes())
d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
out=[]
for s in d.seg():
    if s.word in ("<s>","</s>","<sil>","(NULL)"): continue
    out.append({"w":s.word,"s":round(s.start_frame/100,3),"e":round((s.end_frame+1)/100,3)})
json.dump(out, open("words_raw.json","w"))
print(len(out), len(text)); print(" ".join(f"{o['w']}@{o['s']}-{o['e']}" for o in out))
