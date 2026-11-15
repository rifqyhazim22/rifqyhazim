#!/bin/sh
# Recipes for the cafe loops in public/audio (ffmpeg + python3/numpy). 112 kb/s mp3, about -19 LUFS.
# Both files are whole-file loops: the site plays them from 0:00 and loops back to 0:00 (no loopStart).
#
# day   : audio-loop.sh day OLD71.mp3 public/audio/cafe-day.mp3
#         OLD71 = the first 71 s day loop (git show 9cfe23d:public/audio/cafe-day.mp3). Rifqy picked 0:00-1:08 of it.
#         Output is 68.0 s and uses only OLD71 0:00-1:08: 0:00-1:05 untouched (so it starts exactly at the old 0:00),
#         then 1:05-1:08 crossfaded (3 s, qsin) with 0:59.4-1:02.4. 1:02.4 is the same phrase as 0:00 (the track repeats
#         every 4.8 s, 100 bpm), so the end runs back into 0:00 like the night loop does. The last 15 ms blend into
#         0:00-0:00.015 reversed so the wrap has no click. +0.4 dB makes up what the mp3 re-encode loses, so the
#         loudness matches OLD71 (-18.9 LUFS).
# night : audio-loop.sh night SRC.mp3 public/audio/cafe-night.mp3   (SRC = the original generation)
#         Source 3-74 s with source 0-3 s crossfaded onto its tail -> 71 s whole-file loop.
set -e
MODE="$1"; IN="$2"; OUT="$3"; T=/tmp/_loop
ffmpeg -y -hide_banner -loglevel error -i "$IN" -ar 44100 -ac 2 $T.wav
if [ "$MODE" = day ]; then
  ffmpeg -y -hide_banner -loglevel error -i $T.wav -t 65 ${T}_h.wav
  ffmpeg -y -hide_banner -loglevel error -ss 65 -to 68 -i $T.wav -ss 59.4 -to 62.4 -i $T.wav -filter_complex "[0:a][1:a]acrossfade=d=3:c1=qsin:c2=qsin" ${T}_x.wav
  ffmpeg -y -hide_banner -loglevel error -i ${T}_h.wav -i ${T}_x.wav -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1,asetpts=N/SR/TB" -f f32le ${T}_s.f32
  ffmpeg -y -hide_banner -loglevel error -i $T.wav -f f32le ${T}_o.f32
  python3 - "$T" <<'PY'
import sys, wave, numpy as np
t = sys.argv[1]; sr = 44100
s = np.fromfile(t + '_s.f32', dtype=np.float32).reshape(-1, 2).astype(np.float64)
o = np.fromfile(t + '_o.f32', dtype=np.float32).reshape(-1, 2).astype(np.float64)
n = int(0.015 * sr); w = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n)))[:, None]
s[-n:] = s[-n:] * (1 - w) + o[1:n + 1][::-1] * w
with wave.open(t + '_d.wav', 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(sr)
    f.writeframes(np.clip(np.round(s * 32767), -32768, 32767).astype('<i2').tobytes())
PY
  ffmpeg -y -hide_banner -loglevel error -i ${T}_d.wav -af volume=0.4dB -c:a libmp3lame -b:a 112k "$OUT"
else
  ffmpeg -y -hide_banner -loglevel error -ss 3 -to 74 -i $T.wav -t 3 -i $T.wav -filter_complex "[0:a][1:a]acrossfade=d=3:c1=qsin:c2=qsin[x];[x]dynaudnorm=f=750:g=41:m=4,loudnorm=I=-19:TP=-2:LRA=11,aresample=44100[o]" -map "[o]" -ac 2 -c:a libmp3lame -b:a 112k "$OUT"
fi
