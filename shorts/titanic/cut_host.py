"""Cut the host's poses out of the character sheet (flat grey background -> alpha) into public/titanic/host_*.png."""
import sys
from collections import deque
import numpy as np
from PIL import ImageFilter
from PIL import Image
src = sys.argv[1]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
H, W, _ = im.shape
# crop boxes in the 2048 x 1152 sheet (x0, y0, x1, y1)
BOX = {
  "front": (150, 50, 575, 1110), "three": (660, 50, 1030, 1120),
  "smile": (1150, 70, 1478, 470), "shock": (1492, 70, 1830, 485),
  "think": (1130, 505, 1470, 1000), "laugh": (1485, 535, 1840, 1000),
}
for name, (x0, y0, x1, y1) in BOX.items():
  c = im[y0:y1, x0:x1]; h, w, _ = c.shape
  bg = np.zeros((h, w), bool)
  grey = (np.abs(c[..., 0] - c[..., 1]) < 9) & (np.abs(c[..., 1] - c[..., 2]) < 9) & (c[..., 0] > 178)
  q = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
  while q:
    y, x = q.popleft()
    if y < 0 or x < 0 or y >= h or x >= w or bg[y, x] or not grey[y, x]: continue
    bg[y, x] = True
    q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
  # keep only the largest connected figure (drops bits of the neighbouring pose)
  lab = np.zeros((h, w), np.int32); best, bn, n = 0, 0, 0
  fg = ~bg
  for sy, sx in zip(*np.where(fg)):
    if lab[sy, sx]: continue
    n += 1; cnt = 0; q2 = [(sy, sx)]; lab[sy, sx] = n
    while q2:
      y, x = q2.pop(); cnt += 1
      for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= yy < h and 0 <= xx < w and fg[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; q2.append((yy, xx))
    if cnt > bn: bn, best = cnt, n
  a = (lab == best).astype(np.float32)
  # soften the 1 px fringe: pixels next to background get partial alpha by how dark they are
  from PIL import ImageFilter
  am = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
  edge = (a > 0) & (np.asarray(am) == 0)
  lum = c.mean(-1) / 255.0
  a[edge] = np.clip((0.82 - lum[edge]) / 0.5, 0, 1)
  ys, xs = np.where(a > 0.05)
  rgba = np.dstack([c.astype(np.uint8), (a * 255).astype(np.uint8)])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
  im2 = Image.fromarray(rgba, "RGBA")
  k = 2 if name in ("front", "three") else 3  # upscale for the 2K close-ups (Lanczos + light unsharp mask)
  im2 = im2.resize((im2.width * k, im2.height * k), Image.LANCZOS)
  rgb = im2.convert("RGB").filter(ImageFilter.UnsharpMask(radius=2.5, percent=60, threshold=2))
  im2 = Image.merge("RGBA", (*rgb.split(), im2.split()[3]))
  im2.save(f"public/titanic/host_{name}.png")
  print(name, rgba.shape)
