// Optional sound, OFF by default (browsers block autoplay anyway; only a click turns it on).
// Turning it on plays a cozy cafe loop that follows the site theme: a warm bossa/acoustic loop for light mode
// ("day") and a mellow lo-fi piano loop for dark mode ("night"), crossfading when the theme changes. The loops are
// original instrumentals generated for this site, decoded once and looped gaplessly through WebAudio.
// UI ticks/whooshes are tiny WebAudio synths. If a loop can't load, a soft synth pad plays instead.
let ctx = null, master = null, musicBus = null, pad = null, on = false;
let mode = 'day', cur = null; // cur = { src, gain, mode }
const TRACKS = { day: '/audio/cafe-day.mp3', night: '/audio/cafe-night.mp3' };
const buffers = {};
const listeners = new Set();
const PAD_LEVEL = 0.05, MUSIC_LEVEL = 1;
// Listening volume (0..1): starts soft (0.35) so nobody gets startled, fades in over ~2 s, remembered per browser.
const VOL_KEY = 'rh-music-vol', DEFAULT_VOL = 0.35;
let volume = (() => { try { const v = parseFloat(localStorage.getItem(VOL_KEY)); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_VOL; } catch { return DEFAULT_VOL; } })();
export function getVolume() { return volume; }
export function setVolume(v, save = true) {
  volume = Math.min(1, Math.max(0, +v || 0));
  if (save) { try { localStorage.setItem(VOL_KEY, String(Math.round(volume * 100) / 100)); } catch { /* private mode */ } }
  if (ctx && on && !document.hidden) ramp(master.gain, volume, 0.12);
  emit();
}
/** true once the audio context is actually running (a browser may refuse to start it without a click) */
export function isRunning() { return !!ctx && ctx.state === 'running'; }

function ensure() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = MUSIC_LEVEL; musicBus.connect(master);
  // fallback ambient pad: detuned sines through a low-pass with a slow LFO (silent while a loop plays)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(master);
  pad = ctx.createGain(); pad.gain.value = 0; pad.connect(lp);
  [196, 246.94, 293.66, 392].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6;
    const g = ctx.createGain(); g.gain.value = 0.22; o.connect(g); g.connect(pad); o.start();
  });
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08; const lg = ctx.createGain(); lg.gain.value = 350;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
}
const ramp = (param, to, secs) => { const t = ctx.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(to, t + secs); };
export function setPadLevel(v, secs = 1) { if (pad) ramp(pad.gain, v, secs); }

function load(m) {
  buffers[m] ||= fetch(TRACKS[m]).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((a) => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej)))
    .catch((e) => { delete buffers[m]; throw e; });
  return buffers[m];
}
function stopCur(secs) {
  if (!cur) return; const c = cur; cur = null;
  ramp(c.gain.gain, 0, secs); setTimeout(() => { try { c.src.stop(); } catch { /* already stopped */ } c.src.disconnect(); c.gain.disconnect(); }, secs * 1000 + 100);
}
async function play(m, fade) {
  let buf;
  try { buf = await load(m); } catch { if (on && !cur) setPadLevel(PAD_LEVEL, 1.2); return; }
  if (!on || m !== mode || cur?.mode === m) return;
  const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus);
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(g); src.start();
  stopCur(fade);
  ramp(g.gain, 1, fade); setPadLevel(0, 1);
  cur = { src, gain: g, mode: m };
  emit();
  // warm the other loop in the background so a theme flip crossfades without a wait
  const other = m === 'day' ? 'night' : 'day';
  setTimeout(() => (window.requestIdleCallback || setTimeout)(() => load(other).catch(() => {})), 4000);
}
function emit() { listeners.forEach((f) => f({ on, mode, playing: !!cur, volume })); }
export function onSoundChange(f) { listeners.add(f); }

export function isOn() { return on; }
export function isMusicPlaying() { return on && !!cur; }
export function setSound(v) {
  on = v;
  if (v) {
    ensure(); ctx.resume(); ramp(master.gain, volume, 2); // from silence (master sits at 0 while off)
    play(mode, 1.6);
  } else if (ctx) {
    ramp(master.gain, 0, 0.5); stopCur(0.5); setPadLevel(0, 0.3);
  }
  emit();
}
/** 'day' (light theme) or 'night' (dark theme). Crossfades if music is on. */
export function setMusicMode(m) {
  if (m === mode) return; mode = m;
  if (on && ctx) play(m, 2.5);
  emit();
}
// Pause in background tabs, resume when the visitor comes back
document.addEventListener('visibilitychange', () => {
  if (!ctx || !on) return;
  if (document.hidden) { ramp(master.gain, 0, 0.3); setTimeout(() => { if (document.hidden) ctx.suspend(); }, 350); }
  else { ctx.resume(); ramp(master.gain, volume, 0.8); }
});

export function tick(freq = 880) {
  if (!on || !ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.14);
}
export function whoosh(up = true) {
  if (!on || !ctx) return;
  const len = 0.6, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(up ? 300 : 2200, ctx.currentTime); bp.frequency.exponentialRampToValueAtTime(up ? 2200 : 300, ctx.currentTime + len);
  const g = ctx.createGain(); g.gain.value = 0.36;
  src.connect(bp); bp.connect(g); g.connect(master); src.start();
}
