# Splice the 2K chunks and the re-rendered fix ranges frame-accurately, re-encode once, mux the soundtrack.
import subprocess
C = "out/sword/chunks/"
chunks = {(0, 424): "c_0-424", (425, 849): "c_425-849", (850, 1274): "c_850-1274", (1275, 1694): "c_1275-1694"}
fixes = [(746, 849), (863, 952), (1085, 1197), (1328, 1499), (1595, 1694)]
segs, f = [], 0
while f <= 1694:
    fx = next((r for r in fixes if r[0] <= f <= r[1]), None)
    if fx:
        segs.append((f"fix_{fx[0]}-{fx[1]}", f - fx[0], fx[1] - fx[0] + 1)); f = fx[1] + 1; continue
    (a, b), name = next((k, v) for k, v in chunks.items() if k[0] <= f <= k[1])
    end = min([b] + [r[0] - 1 for r in fixes if r[0] > f])
    segs.append((name, f - a, end - a + 1)); f = end + 1
files = sorted({s[0] for s in segs})
args, fl = ["ffmpeg", "-v", "error", "-y"], []
for n in files: args += ["-i", C + n + ".mp4"]
for i, (n, s0, s1) in enumerate(segs):
    fl.append(f"[{files.index(n)}:v]trim=start_frame={s0}:end_frame={s1},setpts=PTS-STARTPTS[v{i}]")
fl.append("".join(f"[v{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0[out]")
args += ["-filter_complex", ";".join(fl), "-map", "[out]", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "30", "out/sword/video.mp4"]
print(segs); subprocess.run(args, check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/sword/video.mp4", "-i", "shorts/sword/audio/mix.wav", "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", "out/sword/how_sharp_can_a_sword_get.mp4"], check=True)
print("assembled")
