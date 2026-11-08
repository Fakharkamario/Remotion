"""Builds his cutout for the frames where words stand behind him: 240-268 (CREATORS), 1203-1229 (BEST PART?),
1555-1588 ($1).

Mattes come from BiRefNet-portrait (rembg's ONNX release), one grey PNG per even frame (m0240.png ...). Odd frames
use the average of their two neighbours' mattes over their own pixels. Each cutout is the frame with the matte as
alpha, saved as lossy WebP, plus assets/cutouts.js listing the frames.

    python3 scripts/build_cutouts.py assets/aroll.mp4 <matte dir>     # needs numpy + opencv
    # mattes: rembg's birefnet-portrait session, remove(img, only_mask=True), one process per frame (it leaks memory)
"""
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "cut")
RANGES = [(240, 268), (1203, 1229), (1555, 1588)]


def matte(mattes, i):
    p = os.path.join(mattes, f"m{i:04d}.png")
    if os.path.exists(p):
        return cv2.imread(p, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    nb = [os.path.join(mattes, f"m{j:04d}.png") for j in (i - 1, i + 1)]
    nb = [cv2.imread(q, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255 for q in nb if os.path.exists(q)]
    return sum(nb) / len(nb) if nb else None


def main(src, mattes):
    os.makedirs(OUT, exist_ok=True)
    want = {i for a, b in RANGES for i in range(a, b + 1)}
    cap = cv2.VideoCapture(src)
    done, i = [], 0
    while True:
        ok, fr = cap.read()
        if not ok or i > max(want):
            break
        if i in want:
            m = matte(mattes, i)
            if m is not None:
                a = np.clip((m - 0.04) / 0.9, 0, 1)
                rgba = np.dstack([fr, (a * 255).astype(np.uint8)])
                cv2.imwrite(os.path.join(OUT, f"c{i:04d}.webp"), rgba, [cv2.IMWRITE_WEBP_QUALITY, 86])
                done.append(i)
        i += 1
    with open(os.path.join(HERE, "..", "assets", "cutouts.js"), "w") as f:
        f.write("// frames that have a cutout of him in assets/cut/ (scripts/build_cutouts.py)\n")
        f.write(f"window.CUTOUTS = {done};\n")
    print(len(done), "cutouts")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
