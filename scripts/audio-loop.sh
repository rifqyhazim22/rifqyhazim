#!/bin/sh
# Recipes for the cafe loops in public/audio (ffmpeg). 112 kb/s mp3, about -19 LUFS.
# Both files are whole-file loops: the site plays them from 0:00 and loops back to 0:00 (no loopStart).
#
# day   : audio-loop.sh day OLD71.mp3 public/audio/cafe-day.mp3
#         OLD71 = the first 71 s day loop (git show 9cfe23d:public/audio/cafe-day.mp3). Rifqy picked 0:00-1:08 of it.
#         Output = OLD71 0:00-1:08 as is (start untouched), cut at exactly 68.0 s with a 0.4 s fade-out at the end
#         (67.6-68.0 s). No crossfade or blending. +0.4 dB only makes up what the mp3 re-encode loses, so the
#         loudness matches OLD71 (-18.9 LUFS).
# night : audio-loop.sh night SRC.mp3 public/audio/cafe-night.mp3   (SRC = the original generation)
#         Source 3-74 s with source 0-3 s crossfaded onto its tail -> 71 s whole-file loop.
set -e
MODE="$1"; IN="$2"; OUT="$3"; T=/tmp/_loop
ffmpeg -y -hide_banner -loglevel error -i "$IN" -ar 44100 -ac 2 $T.wav
if [ "$MODE" = day ]; then
  ffmpeg -y -hide_banner -loglevel error -i $T.wav -t 68 -af "afade=t=out:st=67.6:d=0.4,volume=0.4dB" -c:a libmp3lame -b:a 112k "$OUT"
else
  ffmpeg -y -hide_banner -loglevel error -ss 3 -to 74 -i $T.wav -t 3 -i $T.wav -filter_complex "[0:a][1:a]acrossfade=d=3:c1=qsin:c2=qsin[x];[x]dynaudnorm=f=750:g=41:m=4,loudnorm=I=-19:TP=-2:LRA=11,aresample=44100[o]" -map "[o]" -ac 2 -c:a libmp3lame -b:a 112k "$OUT"
fi
