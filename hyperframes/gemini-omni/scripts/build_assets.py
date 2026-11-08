"""Builds the small derived assets the scene reads:

- assets/stills/ref1..6.jpg  face crops of the take (the "6 reference images" beat), out.jpg (the output frame),
  avatar.jpg (the follow card)
- assets/env.js              the voice's loudness per video frame (drives the live waveform)

    python3 scripts/build_assets.py        # needs numpy, opencv and ffmpeg
"""
import os
import subprocess
import wave

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "..", "assets")
FPS, FRAMES = 30, 1644


def grab(t):
    cap = cv2.VideoCapture(os.path.join(A, "aroll.mp4"))
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * FPS))
    ok, fr = cap.read()
    return fr


def main():
    os.makedirs(os.path.join(A, "stills"), exist_ok=True)
    # head-and-shoulders crops: x 250..830, y 330..1070 of the 1080x1920 take
    for i, t in enumerate([2.4, 12.2, 19.0, 26.6, 37.4, 44.0], 1):
        fr = grab(t)[330:1070, 250:830]
        cv2.imwrite(os.path.join(A, "stills", f"ref{i}.jpg"), cv2.resize(fr, (290, 370), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    fr = grab(32.6)[300:1100, 200:880]
    cv2.imwrite(os.path.join(A, "stills", "out.jpg"), cv2.resize(fr, (680, 800), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    fr = grab(5.0)[380:900, 280:800]
    cv2.imwrite(os.path.join(A, "stills", "avatar.jpg"), cv2.resize(fr, (220, 220), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])

    with wave.open(os.path.join(A, "voice.wav")) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    hop = sr // FPS
    env = []
    for f in range(FRAMES):
        seg = x[f * hop:(f + 1) * hop]
        env.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
    env = np.array(env)
    env = np.clip(env / np.percentile(env, 98), 0, 1)
    with open(os.path.join(A, "env.js"), "w") as f:
        f.write("// voice loudness per frame, 0..1 (scripts/build_assets.py)\n")
        f.write("window.VOICE_ENV = [" + ",".join(f"{v:.2f}" for v in env) + "];\n")


if __name__ == "__main__":
    main()
