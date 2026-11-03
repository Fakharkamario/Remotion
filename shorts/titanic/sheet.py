"""Contact sheet: python sheet.py out.jpg cols w img1 img2 ... (labels = file stem)"""
import sys, os
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in fs]; h = int(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * h), (255, 0, 255)); d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * h
    S.paste(im.resize((w, h)), (x, y)); d.text((x + 5, y + 5), os.path.basename(f).split(".")[0], fill=(255, 255, 0))
S.save(out, quality=88)
