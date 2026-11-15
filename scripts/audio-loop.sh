#!/bin/sh
# Recipes for the cafe loops in public/audio (ffmpeg). Both end around -19 LUFS, 112 kb/s mp3.
#
# day   : audio-loop.sh day OLD71.mp3 public/audio/cafe-day.mp3
#         OLD71 = the earlier 71 s day loop (git show 9cfe23d:public/audio/cafe-day.mp3). Rifqy picked 0:00-1:08 of it.
#         Output = exactly 0:00-1:08 of OLD71 and nothing outside it: 0:00-1:05 as is, then 1:05-1:08 crossfaded into
#         0:00-0:03. The site plays it from 0:00 once, then loops from 0:03 (LOOP_START.day = 3 in src/sound.js).
# night : audio-loop.sh night SRC.mp3 public/audio/cafe-night.mp3   (SRC = the original generation)
#         Source 3-74 s with source 0-3 s crossfaded onto its tail -> 71 s whole-file loop.
set -e
MODE="$1"; IN="$2"; OUT="$3"; T=/tmp/_loop
ffmpeg -y -hide_banner -loglevel error -i "$IN" -ar 44100 $T.wav
if [ "$MODE" = day ]; then
  ffmpeg -y -hide_banner -loglevel error -i $T.wav -t 65 ${T}_a.wav
  ffmpeg -y -hide_banner -loglevel error -ss 65 -to 68 -i $T.wav -t 3 -i $T.wav -filter_complex "[0:a][1:a]acrossfade=d=3:c1=qsin:c2=qsin" ${T}_x.wav
  ffmpeg -y -hide_banner -loglevel error -i ${T}_a.wav -i ${T}_x.wav -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1,asetpts=N/SR/TB,loudnorm=I=-19:TP=-2:LRA=11,aresample=44100" -ac 2 -c:a libmp3lame -b:a 112k "$OUT"
else
  ffmpeg -y -hide_banner -loglevel error -ss 3 -to 74 -i $T.wav -t 3 -i $T.wav -filter_complex "[0:a][1:a]acrossfade=d=3:c1=qsin:c2=qsin[x];[x]dynaudnorm=f=750:g=41:m=4,loudnorm=I=-19:TP=-2:LRA=11,aresample=44100[o]" -map "[o]" -ac 2 -c:a libmp3lame -b:a 112k "$OUT"
fi
