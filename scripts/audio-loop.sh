#!/bin/sh
# audio-loop.sh in.mp3 out.mp3 [START] [END] [XFADE]
# Seamless background loop of in.mp3 from START to END seconds (defaults 3 74 3), loudness-normalised (about -19 LUFS)
# and encoded at 112 kb/s. The XFADE seconds of audio right after END fade out over the head of the loop, so the jump
# from the end back to the start is continuous. The loop is exactly END-START seconds long. Needs XFADE s of audio after END.
#
# Current files (sources: the original ElevenLabs takes):
#   cafe-day.mp3   = audio-loop.sh day-raw.mp3   cafe-day.mp3 3 71    -> 68 s: plays 0:00-1:08 of the earlier 71 s day loop
#   cafe-night.mp3 = earlier recipe: source 3-74 s with source 0-3 s crossfaded onto its tail -> 71 s (unchanged)
set -e
IN="$1"; OUT="$2"; S="${3:-3}"; E="${4:-74}"; X="${5:-3}"
ffmpeg -y -hide_banner -loglevel error -i "$IN" -ar 44100 /tmp/_loop.wav
ffmpeg -y -hide_banner -loglevel error -ss "$E" -t "$X" -i /tmp/_loop.wav -ss "$S" -to "$E" -i /tmp/_loop.wav \
  -filter_complex "[0:a][1:a]acrossfade=d=$X:c1=qsin:c2=qsin[x];[x]dynaudnorm=f=750:g=41:m=4,loudnorm=I=-19:TP=-2:LRA=11,aresample=44100[o]" \
  -map "[o]" -ac 2 -c:a libmp3lame -b:a 112k "$OUT"
