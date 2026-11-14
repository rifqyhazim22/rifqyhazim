// Optional sound, OFF by default. Pure WebAudio synthesis: no audio files, nothing copyrighted.
let ctx = null, master = null, pad = null, on = false;
function ensure() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  // warm ambient pad: detuned sines through a low-pass with a slow LFO
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(master);
  pad = ctx.createGain(); pad.gain.value = 0.05; pad.connect(lp);
  [196, 246.94, 293.66, 392].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6;
    const g = ctx.createGain(); g.gain.value = 0.22; o.connect(g); g.connect(pad); o.start();
  });
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08; const lg = ctx.createGain(); lg.gain.value = 350;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
}
export function isOn() { return on; }
export function setSound(v) {
  on = v;
  if (v) { ensure(); ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.6); }
  else if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); }
}
export function tick(freq = 880) {
  if (!on || !ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.14);
}
export function whoosh(up = true) {
  if (!on || !ctx) return;
  const len = 0.6, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(up ? 300 : 2200, ctx.currentTime); bp.frequency.exponentialRampToValueAtTime(up ? 2200 : 300, ctx.currentTime + len);
  const g = ctx.createGain(); g.gain.value = 0.18;
  src.connect(bp); bp.connect(g); g.connect(master); src.start();
}
