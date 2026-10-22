import sys, json
import numpy as np
from PIL import Image
from collections import deque
D=sys.argv[1]; K=4
def comps(mask, minarea):
    h,w=mask.shape; seen=np.zeros_like(mask,bool); out=[]
    ys,xs=np.nonzero(mask)
    for y0,x0 in zip(ys,xs):
        if seen[y0,x0]: continue
        q=deque([(y0,x0)]); seen[y0,x0]=True; a=0; x1=x2=x0; y1=y2=y0
        while q:
            y,x=q.popleft(); a+=1
            x1=min(x1,x);x2=max(x2,x);y1=min(y1,y);y2=max(y2,y)
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny,nx=y+dy,x+dx
                if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True; q.append((ny,nx))
        if a>=minarea: out.append([int(x1*K),int(y1*K),int((x2+1)*K),int((y2+1)*K),int(a*K*K)])
    return sorted(out,key=lambda c:c[1])
res={}
for f in range(293):
    im=np.asarray(Image.open(f"{D}/f{f+1:03d}.png").convert('RGB').resize((480,270),Image.BOX)).astype(int)
    R,G,B=im[...,0],im[...,1],im[...,2]
    white=(R>222)&(G-R<12)
    blue=(B>200)&(B-R>90)
    green=(G>170)&(G-R>70)&(G-B>20)
    res[f]={'w':comps(white,60),'b':comps(blue,8),'g':comps(green,30)}
json.dump(res,open(sys.argv[2],'w'))
