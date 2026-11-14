// Visitor-local time (their own time zone): analog clocks with teal hands and a coral sweeping second hand,
// the signature date "<Sabtu•14 Nov 2026>", and a small line with Rifqy's time in Jakarta (WIB) when the visitor is elsewhere.
import { lang, onLang } from './i18n.js';

export const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
const JKT = 'Asia/Jakarta';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mk = (tz) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric' });
const fmtLocal = mk(ZONE), fmtJkt = mk(JKT);
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAYS = { id: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
const MONTHS = { id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };

/** Time parts in a zone (visitor-local by default); ms comes from the local clock (zones share milliseconds). */
export function parts(now = new Date(), f = fmtLocal) {
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month - 1, d: +p.day, wd: WD[p.weekday], h: +p.hour % 24, m: +p.minute, s: +p.second, ms: now.getMilliseconds() };
}
export function dateParts(l = lang()) { const n = parts(); return { day: DAYS[l][n.wd], date: `${n.d} ${MONTHS[l][n.mo]} ${n.y}` }; }
export const hhmm = () => { const n = parts(); return `${String(n.h).padStart(2, '0')}:${String(n.m).padStart(2, '0')}`; };
const city = (tz) => (tz.split('/').pop() || tz).replace(/_/g, ' ');
/** Visitor zone label, e.g. "Jakarta · WIB", "London · GMT", "New York · EST". */
export function zoneLabel(l = lang()) {
  if (ZONE === JKT) return 'Jakarta · WIB';
  const get = (loc) => new Intl.DateTimeFormat(loc, { timeZone: ZONE, timeZoneName: 'short' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName')?.value || '';
  const cands = ['en-US', 'en-GB', 'en-AU', 'en-IN'].map(get); // prefer a letter abbreviation (EST, CET, AEST) over "GMT+1"
  const abbr = (cands.find((x) => x && !/^(GMT|UTC)[+-−]/.test(x)) || cands[0]).replace(/^(GMT|UTC)[+-−]0$/, '$1');
  return `${city(ZONE)} · ${abbr}`;
}
/** "Di Jakarta: 13.27 WIB" / "In Jakarta: 1:27 PM WIB"; empty when the visitor's clock already shows Jakarta time. */
export function jakartaLine(l = lang()) {
  const now = new Date(), a = parts(now), b = parts(now, fmtJkt);
  if (ZONE === JKT || (a.h === b.h && a.m === b.m && a.d === b.d)) return '';
  const mm = String(b.m).padStart(2, '0');
  return l === 'id' ? `Di Jakarta: ${String(b.h).padStart(2, '0')}.${mm} WIB` : `In Jakarta: ${b.h % 12 || 12}:${mm} ${b.h < 12 ? 'AM' : 'PM'} WIB`;
}
/** Hand angles (deg); the second hand sweeps smoothly (ticks once a second under reduced motion). */
export function angles() {
  const n = parts(); const s = n.s + (reduced ? 0 : n.ms / 1000), m = n.m + s / 60, h = (n.h % 12) + m / 60;
  return { h: h * 30, m: m * 6, s: s * 6 };
}
// Intro: hands spin up from 12 (minute 1 turn, second 2 turns) and settle on the time with a small overshoot.
const backOut = (p, k = 1.9) => 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2);
export function introAngles(start, dur = 1.5) {
  const a = angles(); if (reduced || start == null) return a;
  const p = Math.min(1, (performance.now() - start) / (dur * 1000)); if (p >= 1) return a;
  const k = p <= 0 ? 0 : backOut(p);
  return { h: a.h * k, m: (a.m + 360) * k, s: (a.s + 720) * k };
}

export function clockSVG(cls = '') {
  const ticks = Array.from({ length: 12 }, (_, i) => { const long = i % 3 === 0;
    return `<line x1="50" y1="${long ? 9 : 11}" x2="50" y2="${long ? 18 : 15}" transform="rotate(${i * 30} 50 50)" class="ck-tick${long ? ' ck-major' : ''}"/>`; }).join('');
  return `<svg class="ck ${cls}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" class="ck-face"/>${ticks}
    <line x1="50" y1="56" x2="50" y2="29" class="ck-h"/><line x1="50" y1="57" x2="50" y2="17" class="ck-m"/>
    <g class="ck-sg"><line x1="50" y1="64" x2="50" y2="13" class="ck-s"/><circle cx="50" cy="50" r="3.8" class="ck-pin"/></g></svg>`;
}

// date text: scramble-decode on first reveal, per-letter flip when the language changes
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789•<>/';
const shell = (inner) => `<i class="wm-br">&lt;</i>${inner}<i class="wm-br">&gt;</i>`;
function dateHTML(day, date, flip = false) {
  const txt = `${day}•${date}`;
  if (!flip) return shell(txt.replace('•', '<i class="wm-dot">•</i>'));
  return shell([...txt].map((ch, i) => ch === '•' ? `<i class="wm-dot">•</i>` : `<span class="dt-l" style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join(''));
}
function scramble(el, day, date, dur = 900) {
  const target = `${day}•${date}`, start = performance.now();
  const step = () => {
    const p = Math.min(1, (performance.now() - start) / dur), done = Math.floor(p * target.length);
    let out = '';
    for (let i = 0; i < target.length; i++) { const ch = target[i]; out += (i < done || ch === ' ' || ch === '•') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
    el.innerHTML = shell(out.replace('•', '<i class="wm-dot">•</i>'));
    if (p < 1) requestAnimationFrame(step); else el.innerHTML = dateHTML(day, date);
  };
  step();
}

export function initClocks() {
  const clocks = [...document.querySelectorAll('[data-clock]')];
  clocks.forEach((el) => { el.innerHTML = clockSVG(`ck-${el.dataset.clock}`); el.setAttribute('role', 'img'); });
  const hands = clocks.map((el) => ({ el, h: el.querySelector('.ck-h'), m: el.querySelector('.ck-m'), s: el.querySelector('.ck-sg'), start: null, seen: false }));
  const dates = [...document.querySelectorAll('[data-wib-date]')].map((el) => ({ el, seen: false }));
  const times = [...document.querySelectorAll('[data-wib-time]')];
  const zones = [...document.querySelectorAll('[data-wib-zone]')];
  const jkt = [...document.querySelectorAll('[data-wib-jkt]')];
  let ready = false, lastMin = -1;
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (!en.isIntersecting) return;
    const hc = hands.find((x) => x.el === en.target); if (hc && !hc.seen && ready) { hc.seen = true; hc.start = performance.now(); }
    const dc = dates.find((x) => x.el === en.target); if (dc && !dc.seen && ready) { dc.seen = true; const { day, date } = dateParts(); if (!reduced) scramble(dc.el, day, date); }
  }));
  const renderText = (flip = false) => {
    const { day, date } = dateParts(); const zl = zoneLabel(), jl = jakartaLine(), t = hhmm();
    dates.forEach((d) => { d.el.innerHTML = dateHTML(day, date, flip && !reduced); d.el.setAttribute('aria-label', `${day}, ${date}`); });
    zones.forEach((el) => { el.textContent = zl; }); times.forEach((el) => { el.textContent = t; });
    jkt.forEach((el) => { el.textContent = jl; el.hidden = !jl; });
    clocks.forEach((el) => el.setAttribute('aria-label', `${zl} ${t}`));
  };
  const loop = () => {
    hands.forEach((c) => { const a = c.seen || !ready ? introAngles(c.start) : { h: 0, m: 0, s: 0 };
      c.h.setAttribute('transform', `rotate(${a.h} 50 50)`); c.m.setAttribute('transform', `rotate(${a.m} 50 50)`); c.s.setAttribute('transform', `rotate(${a.s} 50 50)`); });
    const n = parts();
    if (n.m !== lastMin) {
      const first = lastMin === -1; lastMin = n.m; renderText();
      if (!first && !reduced) clocks.forEach((el) => { el.classList.remove('ck-pulse'); void el.offsetWidth; el.classList.add('ck-pulse'); });
    }
    requestAnimationFrame(loop);
  };
  onLang(() => renderText(true));
  renderText(); loop();
  return {
    /** call once the preloader has lifted: clocks spin up and dates decode as they come into view */
    reveal() { ready = true; if (reduced) { hands.forEach((c) => { c.seen = true; }); return; }
      hands.forEach((c) => io.observe(c.el)); dates.forEach((d) => io.observe(d.el)); },
  };
}

// Canvas version for the 3D scene's wall clock.
export function drawClock(ctx, size, dark, start) {
  const a = introAngles(start, 1.8), c = size / 2, r = size * 0.44;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = dark ? '#24201C' : '#FFFFFF'; ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.fill();
  for (let i = 0; i < 12; i++) { const ang = i * Math.PI / 6, long = i % 3 === 0;
    ctx.strokeStyle = dark ? '#B4AAA0' : '#1A1916'; ctx.lineWidth = size * (long ? 0.028 : 0.014); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c + Math.sin(ang) * r * (long ? 0.7 : 0.78), c - Math.cos(ang) * r * (long ? 0.7 : 0.78)); ctx.lineTo(c + Math.sin(ang) * r * 0.86, c - Math.cos(ang) * r * 0.86); ctx.stroke(); }
  const hand = (deg, len, w, col, tail = 0.12) => { const ang = deg * Math.PI / 180; ctx.strokeStyle = col; ctx.lineWidth = size * w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c - Math.sin(ang) * r * tail, c + Math.cos(ang) * r * tail); ctx.lineTo(c + Math.sin(ang) * r * len, c - Math.cos(ang) * r * len); ctx.stroke(); };
  const teal = dark ? '#4CB8B0' : '#0F6E6A';
  hand(a.h, 0.5, 0.055, teal); hand(a.m, 0.72, 0.038, teal); hand(a.s, 0.8, 0.016, '#E87862', 0.22);
  ctx.fillStyle = '#E87862'; ctx.beginPath(); ctx.arc(c, c, size * 0.032, 0, 7); ctx.fill();
}
