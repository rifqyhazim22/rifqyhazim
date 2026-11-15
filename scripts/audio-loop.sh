#!/bin/sh
# mkloop.sh in.mp3 out.mp3 : seamless 71 s loop (tail crossfaded into the head), loudness-normalised for background play
set -e
ffmpeg -y -hide_banner -loglevel error -i "$1" -ar 44100 /tmp/_loop.wav
ffmpeg -y -hide_banner -loglevel error -ss 3 -to 74 -i /tmp/_loop.wav -t 3 -i /tmp/_loop.wav -filter_complex "[0:a][1:a]acrossfade=d=3:c1=qsin:c2=qsin[x];[x]dynaudnorm=f=750:g=41:m=4,loudnorm=I=-19:TP=-2:LRA=11,aresample=44100[o]" -map "[o]" -ac 2 -c:a libmp3lame -b:a 112k "$2"
