# No speech-to-text model is reachable here (Hugging Face is blocked), so: forced alignment by pauses.
# Speech islands from silencedetect, text chunks split at punctuation, monotone DP matching groups of islands to groups
# of chunks by duration; words inside a group get time in proportion to their vowel-weighted letter counts.
import re, json, subprocess, numpy as np
e = subprocess.run(["ffmpeg","-i","voice.wav","-af","silencedetect=n=-36dB:d=0.12","-f","null","-"],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r"silence_start: ([0-9.]+)",e)]; en=[float(x) for x in re.findall(r"silence_end: ([0-9.]+)",e)]
dur=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","voice.wav"],capture_output=True,text=True).stdout)
isl=[]; cur=0.0
for a,b in zip(st,en):
    if a-cur>0.05: isl.append((cur,a))
    cur=b
if dur-cur>0.05: isl.append((cur,dur))
text=open("script.txt").read().replace("\n"," ")
chunks=[c.strip() for c in re.split(r"(?<=[.,:?!])\s+|\.\.\.\s*", text) if c.strip()]
def wt(w):
    w=re.sub(r"[^a-z']","",w.lower()); return 1.0+len(w)*0.35+len(re.findall(r"[aeiouy]+",w))*0.6
cw=[sum(wt(w) for w in c.split()) for c in chunks]
rate=sum(b-a for a,b in isl)/sum(cw)
N,M=len(isl),len(chunks); INF=1e18
D=np.full((N+1,M+1),INF); P={}
D[0,0]=0
for i in range(N+1):
  for j in range(M+1):
    if D[i,j]>=INF: continue
    for di in (1,2,3):
      for dj in (1,2,3):
        if i+di>N or j+dj>M: continue
        d=isl[i+di-1][1]-isl[i][0]; p=sum(cw[j:j+dj])*rate
        c=D[i,j]+(np.log(d/p))**2+0.15*(di-1)+0.1*(dj-1)
        if c<D[i+di,j+dj]: D[i+di,j+dj]=c; P[(i+di,j+dj)]=(i,j)
k=(N,M); groups=[]
while k!=(0,0):
    pi,pj=P[k]; groups.append((pi,k[0],pj,k[1])); k=(pi,pj)
groups.reverse()
W=[]
for i0,i1,j0,j1 in groups:
    ws=" ".join(chunks[j0:j1]).split()
    # time available = islands i0..i1 (skip the gaps inside)
    segs=isl[i0:i1]; tot=sum(b-a for a,b in segs)
    wts=[wt(w) for w in ws]; acc=0; S=sum(wts)
    def at(x):  # x in speech-seconds -> clock
        for a,b in segs:
            if x<=b-a+1e-9: return a+x
            x-=b-a
        return segs[-1][1]
    for w,q in zip(ws,wts):
        s=at(acc/S*tot); acc+=q; W.append({"w":w,"s":round(s,3),"e":round(at(acc/S*tot),3)})
json.dump(W,open("words.json","w"),indent=0)
for i0,i1,j0,j1 in groups: print(f"{isl[i0][0]:6.2f}-{isl[i1-1][1]:6.2f}  {' | '.join(chunks[j0:j1])}")
print(len(W),"words; islands",N,"chunks",M)
