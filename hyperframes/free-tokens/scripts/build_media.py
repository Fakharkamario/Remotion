#!/usr/bin/env python3
"""Build the media for the fable-reel edit.

  python3 scripts/build_media.py <raw_take.mp4> <words.json>

- Tightens the take: every pause the voice leaves is cut down to a short breath (jump cut).
- Grades the take (warm, a touch of contrast and bite) -> assets/aroll.mp4 (1080x1080 square, as shot; 30 fps, no audio)
- Writes the cut voice -> assets/voice.wav (48 kHz mono)
- Re-times the ASR words onto the cut timeline -> assets/words.js
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")

raw, words_path = sys.argv[1:3]


def run(cmd):
    subprocess.run(cmd, check=True)


def silences(path, noise="-38dB", d=0.18):
    out = subprocess.run(["ffmpeg", "-i", path, "-af", f"silencedetect=noise={noise}:d={d}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    res, s = [], None
    for line in out.splitlines():
        if "silence_start:" in line:
            s = float(line.split("silence_start:")[1].split()[0])
        elif "silence_end:" in line and s is not None:
            e = float(line.split("silence_end:")[1].split("|")[0])
            res.append((s, e)); s = None
    return res


dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw],
                           capture_output=True, text=True).stdout)

# keep a short breath either side of each cut
PAD = 0.06
keep, t = [], 0.0
for s, e in silences(raw):
    a, b = s + PAD, e - PAD
    if b - a < 0.08:
        continue
    keep.append((t, a)); t = b
keep.append((t, dur))

# frame-align the cuts (30 fps output) so audio and picture cut on the same instant
FPS = 30
segs = []
acc = 0.0
for a, b in keep:
    n = round((b - a) * FPS)
    b2 = a + n / FPS
    segs.append({"src": round(a, 4), "end": round(b2, 4), "at": round(acc, 4)})
    acc += n / FPS
total = acc
print(f"take {dur:.2f}s -> {total:.2f}s in {len(segs)} pieces")


def remap(x):
    for sg in segs:
        if x < sg["end"] + 1e-6:
            return sg["at"] + max(0.0, x - sg["src"])
    return total


# --- picture: trim + concat + grade
vf_parts, af_parts = [], []
for i, sg in enumerate(segs):
    vf_parts.append(f"[0:v]trim={sg['src']}:{sg['end']},setpts=PTS-STARTPTS,fps={FPS}[v{i}]")
    af_parts.append(f"[0:a]atrim={sg['src']}:{sg['end']},asetpts=PTS-STARTPTS,"
                    f"afade=t=in:d=0.012,afade=t=out:st={max(0, sg['end'] - sg['src'] - 0.012):.4f}:d=0.012[a{i}]")
n = len(segs)
grade = ("eq=contrast=1.07:brightness=0.012:saturation=1.10:gamma=0.98,"
         "colorbalance=rs=0.03:gs=0.005:bs=-0.035:rm=0.025:bm=-0.03:rh=0.01:bh=-0.02,"
         "unsharp=5:5:0.45:5:5:0.0,noise=c0s=5:c0f=t+u")
fc = ";".join(vf_parts + af_parts) + ";" + "".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[vc];" \
     + "".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[ac];[vc]{grade},format=yuv420p[vo]"
run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-filter_complex", fc,
     "-map", "[vo]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-g", "30", "-movflags", "+faststart",
     os.path.join(A, "aroll.mp4"),
     "-map", "[ac]", "-ar", "48000", "-ac", "1", os.path.join(A, "voice.wav")])

# --- words on the cut timeline (spelling fixed: the model is "Fable")
fix = {"Metaslama,": "Meta's Llama,"}
words = json.load(open(words_path))
out = []
for w in words:
    txt = fix.get(w["w"], w["w"])
    out.append({"w": txt, "s": round(remap(w["s"]), 3), "e": round(remap(w["e"]), 3)})
with open(os.path.join(A, "words.js"), "w") as f:
    f.write("// ASR words (faster-whisper medium, word timestamps) re-timed onto the cut take.\n")
    f.write(f"window.TAKE = {{ duration: {total:.4f}, cuts: {json.dumps([s['at'] for s in segs[1:]])} }};\n")
    f.write("window.WORDS = " + json.dumps(out, ensure_ascii=False) + ";\n")

