# python scripts/sheet.py out.jpg a.jpg b.jpg ...  -> side-by-side contact sheet (labels = file stems)
import sys
from PIL import Image, ImageDraw
out, ims = sys.argv[1], [Image.open(p) for p in sys.argv[2:]]
w, h = ims[0].size; cols = min(4, len(ims)); rows = (len(ims) + cols - 1) // cols
c = Image.new("RGB", (w * cols, h * rows), "white"); d = ImageDraw.Draw(c)
for i, (im, p) in enumerate(zip(ims, sys.argv[2:])):
    x, y = (i % cols) * w, (i // cols) * h; c.paste(im.resize((w, h)), (x, y)); d.text((x + 6, y + 6), p.split("/")[-1], fill=(255, 0, 0))
c.save(out, quality=85)
