"""Builds his cutout for the shots where words stand behind him (CUT_FRAMES, comma separated).

Mattes come from BiRefNet-portrait (rembg's ONNX release), one grey PNG per frame. Each cutout is the source
frame with the matte as alpha, saved as lossy WebP with alpha, plus assets/cutouts.js listing the frames.

    CUT_FRAMES=0,1,... python3 scripts/build_cutouts.py <source video> <matte dir>     # needs numpy + opencv
"""
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "cut")
FRAMES = [int(x) for x in os.environ.get("CUT_FRAMES", "").split(",") if x]


def main(src, mattes):
    os.makedirs(OUT, exist_ok=True)
    cap = cv2.VideoCapture(src)
    done = []
    i = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        if i in FRAMES:
            path = os.path.join(mattes, f"m{i:04d}.png")
            if os.path.exists(path):
                m = cv2.imread(path, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
            else:  # a frame not matted yet: average its neighbours
                nb = [os.path.join(mattes, f"m{j:04d}.png") for j in (i - 1, i + 1)]
                nb = [cv2.imread(p, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255 for p in nb if os.path.exists(p)]
                if not nb:
                    i += 1
                    continue
                m = sum(nb) / len(nb)
            # firm the edge a little: drop the faint halo, keep the hair's soft falloff
            a = np.clip((m - 0.04) / 0.9, 0, 1)
            rgba = np.dstack([fr, (a * 255).astype(np.uint8)])
            cv2.imwrite(os.path.join(OUT, f"c{i:04d}.webp"), rgba, [cv2.IMWRITE_WEBP_QUALITY, 88])
            done.append(i)
        i += 1
    with open(os.path.join(HERE, "..", "assets", "cutouts.js"), "w") as f:
        f.write("// frames that have a cutout of him in assets/cut/ (scripts/build_cutouts.py)\n")
        f.write(f"window.CUTOUTS = {done};\n")
    print(len(done), "cutouts")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
