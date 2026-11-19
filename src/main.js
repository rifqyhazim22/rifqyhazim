import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import 'lenis/dist/lenis.css';
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { initLang, setLang, onLang, t, lang } from './i18n.js';
import { initCursor } from './cursor.js';
import { ADS, AGENT, spriteSVG, LAMP_SVG } from './sprites.js';
import { setSound, isOn, tick, whoosh, setMusicMode, isMusicPlaying, getVolume, setVolume, isRunning } from './sound.js';
import { initWaiter, musicChoice, saveMusicChoice } from './waiter.js';
import { initUpdates, takeRestore } from './update.js';
import { initClocks } from './clock.js';
import { initContent, fillProject, project } from './render-content.js';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('smooth', 'M0,0 C0.6,0 0.25,1 1,1'); // = cubic-bezier(.6,0,.25,1), the 0.5s route ease
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 900px)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
// 3D tier: full (desktop/laptop), tablet (iPad and up: desktop world, touch controls), lite (phones), off (reduced motion, save-data, weak device, no WebGL)
const conn = navigator.connection || {};
const weak = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || (navigator.deviceMemory && navigator.deviceMemory < 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
const tierParam = new URLSearchParams(location.search).get('tier');
// same rule as /theme-init.js (which normally decides it before first paint): screen size + input + capability, never touch alone
const mm = (q) => matchMedia(q).matches;
const desk = mm('(any-pointer: fine)') || mm('(any-hover: hover)');
const bigTouch = Math.min(screen.width, screen.height) >= 768 && (innerWidth > 900 || mm('(orientation: landscape)'));
const tier = root.dataset.tier || tierParam || (reduced ? 'off'
  : desk && innerWidth > 900 ? 'full'
  : !desk && bigTouch ? (weak ? 'off' : 'tablet')
  : weak ? 'off' : 'lite');
root.dataset.tier = tier;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- i18n
initLang();
initContent();
$$('[data-lang-btn]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.langBtn); tick(660); }));
const stickerText = $('#stickerText');
const syncSticker = () => { stickerText.textContent = `${t('avail')} · ${t('avail')} ·`; };
onLang(syncSticker); syncSticker();

// ---------- Theme
let scene = null, world = null;
function applyTheme(mode, instant) {
  root.dataset.theme = mode;
  setMusicMode(mode === 'dark' ? 'night' : 'day'); // cafe music follows the theme (day loop / night loop)
  scene?.setTheme(mode === 'dark', instant);
  world?.setTheme(mode === 'dark');
  syncStage();
}
// studio stage (kerja): night = dark neon stage (dark header + light cursor over it); day = bright, the header stays as is
var stageActive = false; // (var: applyTheme may run before this line)
function syncStage() {
  const night = stageActive && root.dataset.theme === 'dark';
  document.querySelector('.site-header')?.classList.toggle('on-stage', night); root.classList.toggle('cursor-light', night);
}
// 3-state theme: Auto (default, follows prefers-color-scheme live) / Light / Dark.
// A manual pick lasts only for this page session (no storage); a reload is back on Auto.
const sysDark = matchMedia('(prefers-color-scheme: dark)');
let themePref = 'auto';
const switches = $$('.theme-switch');
function syncSwitches() {
  switches.forEach((sw) => {
    sw.dataset.pref = themePref; sw.dataset.mode = root.dataset.theme;
    $$('[data-theme-btn]', sw).forEach((b) => { const on = b.dataset.themeBtn === themePref; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    const btn = $(`[data-theme-btn="${themePref}"]`, sw), th = $('.ts-thumb', sw);
    if (btn && th && btn.offsetWidth) { th.style.width = btn.offsetWidth + 'px'; th.style.transform = `translateX(${btn.offsetLeft}px)`; }
  });
}
function setThemePref(pref, instant) {
  themePref = pref; root.dataset.themePref = pref;
  applyTheme(pref === 'auto' ? (sysDark.matches ? 'dark' : 'light') : pref, instant);
  syncSwitches();
}
switches.forEach((sw) => {
  const btns = $$('[data-theme-btn]', sw);
  btns.forEach((b) => b.addEventListener('click', () => { if (b.dataset.themeBtn !== themePref) { setThemePref(b.dataset.themeBtn); tick(b.dataset.themeBtn === 'dark' ? 440 : b.dataset.themeBtn === 'light' ? 620 : 520); } }));
  sw.addEventListener('keydown', (e) => { // radiogroup keys: arrows move and select, Home/End jump
    const i = btns.findIndex((b) => b.dataset.themeBtn === themePref);
    const n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: btns.length - 1 }[e.key];
    if (n === undefined) return; e.preventDefault();
    const b = btns[(n + btns.length) % btns.length]; setThemePref(b.dataset.themeBtn); tick(560); b.focus();
  });
});
sysDark.addEventListener('change', () => { if (themePref === 'auto') setThemePref('auto'); });
addEventListener('resize', syncSwitches); onLang(() => requestAnimationFrame(syncSwitches)); document.fonts.ready.then(syncSwitches);
setThemePref('auto', true);

// ---------- Sound + cafe music (off by default; header button on desktop, its twin next to the menu button on mobile)
const soundBtns = $$('[data-sound-btn]');
function syncSoundBtns() {
  const v = isOn();
  soundBtns.forEach((b) => { b.setAttribute('aria-pressed', String(v)); b.dataset.i18nAria = v ? 'sound.off' : 'sound.on'; b.setAttribute('aria-label', t(b.dataset.i18nAria)); b.title = t(b.dataset.i18nAria); });
}
let waiter = null; // first-visit greeting (set up below)
function startMusic() { setSound(true); syncSoundBtns(); }
soundBtns.forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.lp === '1') { b.dataset.lp = ''; return; } // that press was a long-press that opened the volume
  const v = !isOn(); setSound(v); syncSoundBtns(); tick(v ? 990 : 440);
  saveMusicChoice(v ? 'yes' : 'no'); waiter?.dismiss(); // the button counts as an answer too
}));
onLang(syncSoundBtns);
// Volume: header popover on hover/focus (desktop), long-press on the phone button, and a slider in the mobile menu.
const volInputs = $$('[data-vol]');
function syncVol() {
  const v = Math.round(getVolume() * 100);
  volInputs.forEach((i) => { if (+i.value !== v) i.value = v; i.style.setProperty('--vol', v + '%'); i.setAttribute('aria-valuetext', v + '%'); });
  $$('.vol-val').forEach((e) => { e.textContent = v; });
}
volInputs.forEach((i) => i.addEventListener('input', () => { setVolume(i.value / 100); syncVol(); }));
syncVol();
$$('.sound-wrap').forEach((w) => {
  const btn = $('[data-sound-btn]', w);
  let lp = 0;
  const closeOut = (e) => { if (!w.contains(e.target)) { w.classList.remove('open'); removeEventListener('pointerdown', closeOut, true); } };
  btn.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    lp = setTimeout(() => { btn.dataset.lp = '1'; w.classList.add('open'); try { navigator.vibrate?.(10); } catch { /* n/a */ } addEventListener('pointerdown', closeOut, true); }, 450);
  }, { passive: true });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => btn.addEventListener(ev, () => clearTimeout(lp)));
  btn.addEventListener('contextmenu', (e) => { if (btn.dataset.lp === '1') e.preventDefault(); });
  w.addEventListener('keydown', (e) => { if (e.key === 'Escape') { w.classList.remove('open'); btn.focus(); } });
});
// Returning visitor who said yes: the music comes back on their first click/tap/key (browsers need that gesture).
if (musicChoice() === 'yes') {
  const evs = ['click', 'keydown', 'touchend'];
  const go = (e) => {
    if (isOn()) { evs.forEach((n) => removeEventListener(n, go, true)); return; }
    if (e.target.closest?.('[data-sound-btn], .vol-pop, .waiter')) return; // those controls decide for themselves
    if (waiter?.busy) return; // the welcome-back card asks first (once per session)
    startMusic();
    setTimeout(() => { if (isRunning()) evs.forEach((n) => removeEventListener(n, go, true)); else { setSound(false); syncSoundBtns(); } }, 400);
  };
  evs.forEach((n) => addEventListener(n, go, true));
}

// ---------- Auto-update: a new deploy is picked up without a manual refresh (see update.js)
const restore = takeRestore();
initUpdates({ t, onLang, isBusy: () => !!openKey || menuOpen || wiping, isPlaying: isMusicPlaying });
waiter = initWaiter({ t, onLang, reduced, onYes: () => { startMusic(); tick(990); }, onNo: () => { if (isOn()) { setSound(false); syncSoundBtns(); } }, isBlocked: () => !!openKey || menuOpen || wiping });

// ---------- 2D fallback art
$('#spriteAds').innerHTML = spriteSVG(ADS, 'Versi Iklan');
$('#spriteAgent').innerHTML = spriteSVG(AGENT, 'Versi Agen');
$('#lampArt').innerHTML = LAMP_SVG;
const fillCast = (el, data) => {
  if (!el) return;
  el.innerHTML = spriteSVG(data, '');
  const svg = el.querySelector('svg');
  if (svg) { svg.setAttribute('aria-hidden', 'true'); svg.removeAttribute('role'); svg.removeAttribute('aria-label'); }
};
fillCast($('#castSpriteAds'), ADS);
fillCast($('#castSpriteAgent'), AGENT);

const cursor = initCursor();
const clocks = initClocks();

// ---------- Smooth scroll (Lenis, lerp 0.08 like the reference)
// Deferred so the initial JS task does not also parse and construct Lenis (helps mobile TBT).
let lenis = null;
window.__gsap = gsap; // exposed for local screenshot scripts only
if (!reduced) {
  requestAnimationFrame(() => {
    import('lenis').then((mod) => {
      if (lenis) return;
      lenis = new mod.default({ lerp: 0.08, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;
    });
  });
}
const jump = (y) => { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); };

// ---------- Version chips
const chips = $$('.vchip');
function markChip(v) { chips.forEach((c) => { const on = c.dataset.version === v; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); }); }
// The visitor's pick (chip click or tapping a character) holds while they read on; scrolling back up to the hero
// after leaving it puts the desk back to its first-load state (Versi Iklan, camera on the wide shot) to pick again.
const DEFAULT_V = chips.find((c) => c.classList.contains('is-active'))?.dataset.version || 'iklan';
let picked = false;
/** The visitor picks a version (chip, character tap, or dropping a character in the middle on touch). */
function pick(v, sound = 700) { picked = true; markChip(v); scene?.setActive(v); scene?.setFocus(v); scene?.hello(v); tick(sound); }
function resetPick() {
  if (!picked && chips.find((c) => c.classList.contains('is-active'))?.dataset.version === DEFAULT_V) return;
  picked = false;
  markChip(DEFAULT_V);
  cursor?.setExternal(null);
  scene?.reset();
}

// ---------- Nav: active section, sliding coloured pill
const header = $('.site-header');
const nav = $('.nav');
const links = $$('.nav a');
const pill = document.createElement('span'); pill.className = 'nav-pill is-off'; nav.prepend(pill);
function movePill() {
  const a = links.find((l) => l.getAttribute('aria-current') === 'true');
  if (!a) { pill.classList.add('is-off'); return; } // on the hero (beranda): no section is highlighted yet
  const wasOff = pill.classList.contains('is-off');
  if (wasOff) pill.style.transition = 'opacity .35s, scale .35s'; // appear in place instead of sliding in from the left
  pill.style.width = a.offsetWidth + 'px';
  pill.style.transform = `translateX(${a.offsetLeft}px)`;
  if (wasOff) { void pill.offsetWidth; pill.classList.remove('is-off'); requestAnimationFrame(() => { pill.style.transition = ''; }); }
}
const sectionIds = ['foto', 'sekarang', 'kerja', 'proyek', 'tanya', 'jejak', 'ngobrol'];
function setActive(id) {
  if ((header.dataset.active || '') === (id || '')) return;
  header.dataset.active = id || '';
  links.forEach((a) => (a.getAttribute('href') === '#' + id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  movePill();
}
sectionIds.forEach((id) => {
  ScrollTrigger.create({ trigger: '#' + id, start: 'top 45%', end: 'bottom 45%', onToggle: (st) => st.isActive && setActive(id) });
});
// the hero is "beranda" (home), not a nav section: while it fills the view the nav shows no pill
ScrollTrigger.create({ trigger: '#beranda', start: 'top top', end: 'bottom 45%', onToggle: (st) => st.isActive && setActive(null) });
header.dataset.active = 'x'; setActive(null); onLang(() => requestAnimationFrame(movePill)); addEventListener('resize', movePill);
document.fonts.ready.then(movePill);

// ---------- Full-screen wipe between sections (0.5s, cubic-bezier(.6,0,.25,1))
const wipe = $('#wipe'), wipeSheet = $('.wipe-sheet'), wipeNum = $('#wipeNum'), wipeTitle = $('#wipeTitle');
const wipeColors = {
  beranda: ['#0F6E6A', '#FFFFFF'], foto: ['#F0EBE3', '#1A1916'], sekarang: ['#0F6E6A', '#FFFFFF'], kerja: ['#1E3A38', '#F0EBE3'], proyek: ['#F0D36A', '#1A1916'],
  tanya: ['#A888D4', '#1A1916'], jejak: ['#5EC4A8', '#1A1916'], ngobrol: ['#E87862', '#1A1916'],
};
const navKey = { beranda: 'nav.home', foto: 'nav.me', sekarang: 'nav.now', kerja: 'nav.work', proyek: 'nav.projects', tanya: 'nav.ask', jejak: 'nav.journey', ngobrol: 'nav.talk' };
function targetY(id) {
  const el = document.getElementById(id);
  if (id === 'beranda') return 0;
  // layout position: ignore a section's own entrance offset (it is translated down until it has come in)
  const top = el.getBoundingClientRect().top + scrollY - (Number(gsap.getProperty(el, 'y')) || 0);
  if (id === 'kerja' && root.classList.contains('has-world')) return top + (el.offsetHeight - innerHeight) * 0.62; // land mid-scan, cards visible
  return top - 70;
}
let wiping = false;
// after a jump, make sure anything now on screen is revealed (belt and braces for scroll triggers)
function revealInView() {
  const els = $$('[data-reveal]').filter((e) => { if (root.classList.contains('has-world') && e.classList.contains('holo-card')) return false; const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && getComputedStyle(e).opacity < 0.5; });
  if (els.length) gsap.to(els, { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.15, overwrite: 'auto' });
}
function wipeTo(id, covered) {
  if (!document.getElementById(id)) return;
  if (reduced) { covered?.(); jump(targetY(id)); return; }
  if (wiping) return; wiping = true;
  const [bg, ink] = wipeColors[id] || wipeColors.beranda;
  wipeSheet.style.setProperty('--wipe', bg); wipeSheet.style.setProperty('--wipe-ink', ink);
  wipeNum.textContent = `${String(sectionIds.indexOf(id) + 1).padStart(2, '0')} / ${String(sectionIds.length).padStart(2, '0')}`;
  wipeTitle.textContent = t(navKey[id]);
  wipe.classList.add('run'); whoosh(true); world?.hold('wipe', true); // the sheet is coming over the page: no 3D frames until the jump
  gsap.timeline({ onComplete: () => { wipe.classList.remove('run'); wiping = false; world?.hold('wipe', false); } })
    .set(wipeSheet, { yPercent: 102, borderRadius: '48px 48px 0 0' })
    .to(wipeSheet, { yPercent: 0, duration: 0.5, ease: 'smooth' })
    .fromTo([wipeNum, wipeTitle], { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.05 }, 0.18)
    .add(() => { covered?.(); jump(targetY(id)); ScrollTrigger.update(); requestAnimationFrame(revealInView); world?.hold('wipe', false); }, 0.52)
    .to({}, { duration: 0.28 })
    .add(() => whoosh(false))
    .set(wipeSheet, { borderRadius: '0 0 48px 48px' })
    .to([wipeNum, wipeTitle], { y: -40, opacity: 0, duration: 0.25, ease: 'power2.in' })
    .to(wipeSheet, { yPercent: -102, duration: 0.5, ease: 'smooth' }, '<0.05');
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.classList.contains('skip')) return;
  const id = a.getAttribute('href').slice(1);
  if (!document.getElementById(id) || a.closest('#detail')) return;
  e.preventDefault(); tick(760);
  if (a.closest('#menu')) { // the menu sheet hands over to the section wipe
    menuBusy = false; menuOpen = false; menuBtn.setAttribute('aria-expanded', 'false'); root.classList.remove('menu-open'); lenis?.start();
    menuBtn.dataset.i18nAria = 'menu.open'; menuBtn.setAttribute('aria-label', t('menu.open'));
    wipeTo(id, () => { menu.hidden = true; }); return;
  }
  wipeTo(id);
});

// ---------- Mobile menu: full-screen sheet with the same rounded wipe
const menu = $('#menu'), menuSheet = $('.menu-sheet'), menuBtn = $('#menuBtn');
let menuOpen = false, menuBusy = false;
function setMenu(open, then) {
  if (menuBusy || open === menuOpen) { then?.(); return; }
  menuOpen = open; menuBusy = true;
  menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.dataset.i18nAria = open ? 'menu.close' : 'menu.open'; menuBtn.setAttribute('aria-label', t(menuBtn.dataset.i18nAria));
  root.classList.toggle('menu-open', open);
  const items = $$('.menu-nav a, .menu-foot > *', menu);
  const fin = () => { menuBusy = false; if (!open) menu.hidden = true; else $('.menu-nav a', menu)?.focus({ preventScroll: true }); then?.(); };
  if (open) { menu.hidden = false; lenis?.stop(); syncSwitches(); } else lenis?.start();
  if (reduced) { fin(); return; }
  whoosh(open);
  if (open) gsap.timeline({ onComplete: fin })
    .set(menuSheet, { yPercent: 102, borderRadius: '40px 40px 0 0' })
    .to(menuSheet, { yPercent: 0, borderRadius: '0px 0px 0 0', duration: 0.5, ease: 'smooth' })
    .fromTo(items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.04 }, 0.2);
  else gsap.timeline({ onComplete: fin })
    .to(items, { y: -16, opacity: 0, duration: 0.18, ease: 'power1.in', stagger: 0.015 })
    .to(menuSheet, { yPercent: -102, borderRadius: '0 0 40px 40px', duration: 0.45, ease: 'smooth' }, 0.1);
}
menuBtn.addEventListener('click', () => { tick(600); setMenu(!menuOpen); });
menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false, () => menuBtn.focus()); });
addEventListener('resize', () => { if (menuOpen && innerWidth > 900) setMenu(false); });

// ---------- Touch: tap feedback ripple (the custom cursor is desktop pointer:fine only)
const tapLayer = $('#tapLayer');
if (!matchMedia('(pointer: fine)').matches) {
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || reduced || root.classList.contains('touch-fx')) return; // touch.js draws its own
    const target = e.target.closest('a, button, [data-project], .vchip, canvas');
    const r = document.createElement('span'); r.className = 'tap-ripple' + (target ? ' on-target' : '');
    r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; tapLayer.append(r);
    r.addEventListener('animationend', () => r.remove());
  }, { passive: true });
}

// ---------- Project detail: full-screen sheet with 3D media stage, back transition, browser back
const projects = {
  a: { tag: 'tag.ads', title: 'p.a', bg: '#1E3A38', tagBg: '#FBF3D4', media: '#E6F3F2', art: 'bars' },
  b: { tag: 'tag.agent', title: 'p.b', bg: '#2E2838', tagBg: '#EEE7F8', media: '#EEE7F8', art: 'net' },
  c: { tag: 'tag.ecom', title: 'p.c', bg: '#3E2722', tagBg: '#FBE4DF', media: '#FBE4DF', art: 'win' },
};
const order = ['a', 'b', 'c'];
const detail = $('#detail'), dSheet = $('#dSheet'), dDim = $('.detail-dim'), dMedia = $('#dMedia'), dStage = $('#dStage');
let openKey = null, lastFocus = null, dBusy = false, pendingClose = false;
function artHTML(kind) {
  const art = {
    bars: '<div class="t-bars big"><i style="--h:40%;--c:#F0D36A"></i><i style="--h:72%;--c:#0F6E6A"></i><i style="--h:55%;--c:#E87862"></i><i style="--h:90%;--c:#5EC4A8"></i></div>',
    net: '<svg class="t-net" viewBox="0 0 120 70" style="width:70%"><path d="M30 30 L70 18 M30 30 L64 50 M70 18 L96 40 M64 50 L96 40" stroke="#A888D4" stroke-width="1.2"/><circle cx="30" cy="30" r="6" fill="#A888D4"/><circle cx="70" cy="18" r="5" fill="#5EC4A8"/><circle cx="64" cy="50" r="5" fill="#5AA3C8"/><circle cx="96" cy="40" r="4" fill="#F0D36A"/></svg>',
    win: '<div class="t-win" style="width:56%;height:56%"><span></span><b></b><b></b></div>',
  }[kind];
  return `<div class="layer" data-z="0"><div class="panel"></div></div><div class="layer" data-z="70">${art}</div>`
    + `<div class="layer" data-z="140"><span class="tag float-chip" style="position:absolute;left:8%;top:12%">${t(projects[openKey].tag)}</span><span class="mono float-chip" style="position:absolute;right:9%;bottom:14%;background:#1A1916;color:#F0EBE3;padding:6px 10px;border-radius:8px;font-size:12px">${project(openKey).stats[0][0]} · ${project(openKey).stats[0][1]}</span></div>`;
}
function fillDetail(key) {
  openKey = key; const p = projects[key];
  dSheet.style.setProperty('--dbg', p.bg); dSheet.style.setProperty('--dmedia', p.media); dSheet.style.setProperty('--dtag', p.tagBg);
  $('#dTag').textContent = t(p.tag); fillProject(key);
  $('#dCount').textContent = `${String(order.indexOf(key) + 1).padStart(2, '0')} / 03`;
  dStage.innerHTML = artHTML(p.art);
  $$('.layer', dStage).forEach((l) => { l.style.transform = `translateZ(${l.dataset.z}px)`; });
}
onLang(() => { if (openKey) fillDetail(openKey); });
function openDetail(key, push = true) {
  if (dBusy || openKey === key) return; dBusy = true;
  lastFocus = document.activeElement;
  fillDetail(key);
  detail.hidden = false; lenis?.stop(); world?.hold('detail', true); // the sheet covers the page: pause the 3D behind it
  if (push) history.pushState({ p: key }, '', '#proyek/' + key);
  whoosh(true);
  const copy = $$('.d-copy > *, .d-facts > div', detail);
  const tl = gsap.timeline({ onComplete: () => { dBusy = false; if (pendingClose) { pendingClose = false; closeDetail(); return; } $('#dBack').focus({ preventScroll: true }); } });
  if (reduced) { gsap.set(dDim, { opacity: 1 }); gsap.set([dSheet, dMedia], { yPercent: 0 }); tl.progress(1); return; }
  tl.set(dSheet, { yPercent: 100 }).set(dMedia, { yPercent: 35 }).set(copy, { y: 30, opacity: 0 })
    .to(dDim, { opacity: 1, duration: 0.15, ease: 'power1.out' })
    .to(dSheet, { yPercent: 0, duration: 0.5, ease: 'smooth' }, 0.06)
    .to(copy, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, 0.38)
    .to(dMedia, { yPercent: 0, duration: 0.7, ease: 'smooth' }, 0.42)
    .from($$('.layer', dStage), { z: -260, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, 0.6);
}
function closeDetail() {
  if (!openKey) return; if (dBusy) { pendingClose = true; return; } dBusy = true; whoosh(false);
  const done = () => { world?.hold('detail', false); detail.hidden = true; openKey = null; dBusy = false; lenis?.start(); lastFocus?.focus?.({ preventScroll: true }); };
  if (reduced) { done(); return; }
  gsap.timeline({ onComplete: done })
    .to($$('.d-copy > *, .d-facts > div', detail), { opacity: 0, y: -10, duration: 0.15, ease: 'power1.in' })
    .to(dSheet, { yPercent: 100, duration: 0.5, ease: 'smooth' }, 0.05)
    .to(dDim, { opacity: 0, duration: 0.25 }, 0.35);
}
function nextDetail() {
  if (dBusy) return; dBusy = true;
  const nk = order[(order.indexOf(openKey) + 1) % 3];
  history.replaceState({ p: nk }, '', '#proyek/' + nk); whoosh(true);
  gsap.timeline({ onComplete: () => { dBusy = false; if (pendingClose) { pendingClose = false; closeDetail(); } } })
    .to(dSheet, { yPercent: -100, duration: 0.5, ease: 'smooth' })
    .add(() => { fillDetail(nk); dSheet.scrollTop = 0; })
    .set(dSheet, { yPercent: 100 })
    .to(dSheet, { yPercent: 0, duration: 0.5, ease: 'smooth' })
    .from($$('.layer', dStage), { z: -260, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.15');
}
$$('[data-project]').forEach((card, i) => {
  const key = order[i];
  card.setAttribute('aria-haspopup', 'dialog');
  card.addEventListener('click', () => { tick(700); openDetail(key); });
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(key); } });
});
$('#dBack').addEventListener('click', () => { tick(500); if (history.state?.p) history.back(); else closeDetail(); });
$('#dNext').addEventListener('click', () => { tick(800); nextDetail(); });
$('#dCta').addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', location.pathname); closeDetail(); setTimeout(() => wipeTo('ngobrol'), 560); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && openKey) { if (history.state?.p) history.back(); else closeDetail(); } });
addEventListener('popstate', (e) => { if (e.state?.p) openDetail(e.state.p, false); else closeDetail(); });
// Swipe down (touch) on the sheet's top bar, or anywhere when scrolled to the top, closes the detail
{
  let sy = null, sx = 0, dy = 0;
  const back = () => { if (history.state?.p) history.back(); else closeDetail(); };
  dSheet.addEventListener('touchstart', (e) => { if (dBusy || dSheet.scrollTop > 2) { sy = null; return; } sy = e.touches[0].clientY; sx = e.touches[0].clientX; dy = 0; }, { passive: true });
  dSheet.addEventListener('touchmove', (e) => {
    if (sy === null) return; dy = e.touches[0].clientY - sy;
    if (Math.abs(e.touches[0].clientX - sx) > Math.abs(dy) && dy < 30) { sy = null; gsap.to(dSheet, { y: 0, duration: 0.3 }); return; }
    if (dy > 0) { gsap.set(dSheet, { y: dy * 0.9 }); gsap.set(dDim, { opacity: Math.max(0.3, 1 - dy / 600) }); }
  }, { passive: true });
  dSheet.addEventListener('touchend', () => {
    if (sy === null) return; sy = null;
    if (dy > 110) { gsap.to(dSheet, { y: 0, duration: 0.01, delay: 0.55 }); tick(500); back(); }
    else { gsap.to(dSheet, { y: 0, duration: 0.35, ease: 'power3.out' }); gsap.to(dDim, { opacity: 1, duration: 0.3 }); }
  });
}
dMedia.addEventListener('pointermove', (e) => {
  const r = dMedia.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(dStage, { rotateY: x * 16, rotateX: -y * 12, duration: 0.6, ease: 'power3.out' });
});
dMedia.addEventListener('pointerleave', () => gsap.to(dStage, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'power3.out' }));

// ---------- Text decode (subtitle types in, like a terminal)
function decode(el, dur = 1.1) {
  const final = el.textContent, glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&·/<>_';
  const st = { p: 0 };
  return gsap.to(st, { p: 1, duration: dur, ease: 'none', onUpdate: () => {
    const n = Math.floor(final.length * st.p);
    el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0])).join('').slice(0, Math.max(0, Math.min(8, final.length - n)));
  }, onComplete: () => { el.textContent = final; } });
}

// ---------- Boot
const pre = $('#preloader');
// Wordmark <Rifqy•Hazim>: split letters so hover can ripple them (CSS does the motion; reduced-motion disables it).
document.querySelectorAll('.wm-name').forEach((el) => {
  let i = 0;
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 3) { const frag = document.createDocumentFragment(); [...n.textContent].forEach((ch) => { const s = document.createElement('span'); s.className = 'wm-l'; s.style.setProperty('--i', i++); s.setAttribute('aria-hidden', 'true'); s.textContent = ch; frag.append(s); }); n.replaceWith(frag); }
    else if (n.classList?.contains('wm-dot')) n.style.setProperty('--i', i++);
  });
});
// ---------- 3D, deferred: the page paints and becomes interactive with the 2D desk first.
// Three.js + the scene load after the intro (so never before first paint), on the first interaction / scroll towards
// the studio, or once the browser is idle a few seconds after load, and are built in steps (yielding to the main thread).
// The 2D desk is on screen until then and crossfades into the 3D one when it is ready. Layout is decided up front.
// full = desktop/laptop (incl. touchscreen laptops), tablet = the desktop world with touch controls (pixel ratio capped
// at 1.5, fewer floaters), lite = phones (lighter 3D: hero + section stations).
const want3D = tier !== 'off';
const tablet = tier === 'tablet';
const yieldMain = () => new Promise((r) => (window.scheduler?.yield ? window.scheduler.yield().then(r) : setTimeout(r, 0)));
let studioP = 0, worldReady = false;
// scroll position fed to the 3D world, smoothed by a ScrollTrigger scrub (the camera eases after the page, both ways)
const drive = { y: scrollY };
function fallback2D() {
  root.classList.remove('three-pending', 'lite', 'tablet', 'has-world', 's3d'); root.classList.add('no-webgl');
  if (!root.classList.contains('motion')) return;
  $$('.holo-card').forEach((c) => { c.classList.add('on'); gsap.to(c, { opacity: 1, y: 0, duration: 0.5 }); });
  ScrollTrigger.refresh();
}
let started3D = false;
async function load3D() {
  if (started3D) return; started3D = true;
  const mod = await import('./scene.js').catch(() => null);
  if (!mod || !mod.webglOK()) { fallback2D(); return; }
  await yieldMain();
  const lite = tier === 'lite';
  try {
    scene = mod.createScene({
      canvas: $('#heroCanvas'), hero: lite ? $('.hero-stage') : $('.hero'), bubble: $('#bubble'), lite, tablet,
      onCharTap: (k) => { const v = k || (chips.find((c) => c.classList.contains('is-active'))?.dataset.version === 'iklan' ? 'agen' : 'iklan'); pick(v, v === 'iklan' ? 620 : 840); },
      onCharHover: (k) => { cursor?.setExternal(k); scene.setFocus(k); if (k) { markChip(k); tick(k === 'iklan' ? 620 : 840); } },
    });
  } catch { fallback2D(); return; }
  scene.setTheme(root.dataset.theme === 'dark', true);
  window.__scene = scene;
  await yieldMain();
  await scene.ready;
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6, onUpdate: (st) => scene.setScroll(st.progress) });
  const active = chips.find((c) => c.classList.contains('is-active'))?.dataset.version;
  if (active && active !== 'iklan') scene.setActive(active);
  // crossfade 2D -> 3D, then the camera swoops in
  root.classList.add('three-ready');
  scene.playIntro();
  setTimeout(() => root.classList.remove('three-pending'), 900);
  if (!root.classList.contains('s3d')) return;
  await yieldMain();
  const { createWorld } = await import('./world.js');
  await yieldMain();
  const sections = Object.fromEntries($$('[data-s3d]').map((el) => [el.dataset.s3d, el]));
  try {
    world = createWorld({
      canvas: $('#worldCanvas'), worldEl: $('#world'), studioEl: lite ? null : $('#kerja'), contactEl: lite ? null : $('#ngobrol'),
      sections, getScroll: () => drive.y, lite, tablet, journeyCount: $$('#journey li').length, photoUrl: '/img/rifqy-desk.webp',
    });
  } catch { return; }
  window.__world = world;
  if (openKey) world.hold('detail', true); // deep link: the detail opened before the 3D arrived
  world.setTheme(root.dataset.theme === 'dark');
  world.setStudio(studioP);
  ScrollTrigger.addEventListener('refresh', () => world.refresh());
  await world.ready;
  worldReady = true;
  $('#world').classList.add('is-ready');
}
function schedule3D() {
  if (!want3D) return;
  const go = () => { evs.forEach((e) => removeEventListener(e, go)); io.disconnect(); load3D(); };
  const evs = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
  evs.forEach((e) => addEventListener(e, go, { passive: true }));
  // scrolling towards the studio stage loads it before it is on screen
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) go(); }, { rootMargin: '0px 0px 60% 0px' });
  io.observe($('#kerja'));
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
  const later = () => setTimeout(() => idle(go, { timeout: 2000 }), 3500);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
}

async function boot() {
  if (!reduced) root.classList.add('motion');
  if (want3D) {
    root.classList.add('three-pending', 's3d');
    root.classList.remove('no-webgl');
    if (tier === 'lite') { root.classList.add('lite'); root.classList.remove('has-world'); $('.hero-stage').prepend($('#heroCanvas'), $('#bubble')); }
    else { root.classList.add('has-world'); root.classList.remove('lite'); root.classList.toggle('tablet', tablet); }
  } else {
    root.classList.add('no-webgl');
    root.classList.remove('three-pending', 's3d', 'has-world', 'tablet');
  }

  if (root.classList.contains('has-world')) {
    // Studio stage: scroll progress, header/cursor styling, overlay sync. Works before the world arrives
    // (cards follow the scroll thresholds); once it is ready, tags and connectors track the 3D characters.
    const worldEl = $('#world');
    const cards = ['#hc1', '#hc2', '#hc3', '#hc4'].map((s) => $(s));
    const cn = ['#cn1', '#cn2', '#cn3', '#cn4'].map((s) => $(s));
    const tagA = $('#tagAds'), tagB = $('#tagAgent'), num = $('#scanNum');
    ScrollTrigger.create({
      trigger: '#kerja', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (st) => { studioP = st.progress; world?.setStudio(studioP); },
      onToggle: (st) => { stageActive = st.isActive; syncStage(); },
    });
    worldEl.dataset.zone = $('#foto[data-s3d]') ? 'room' : 'studio'; // the first 3D window after the hero is the photo corner
    const btnSend = $('.contact .btn-primary');
    btnSend.addEventListener('pointerenter', () => world?.setCTA(true)); btnSend.addEventListener('pointerleave', () => world?.setCTA(false));
    btnSend.addEventListener('focus', () => world?.setCTA(true)); btnSend.addEventListener('blur', () => world?.setCTA(false));
    const thresholds = [0.26, 0.40, 0.54, 0.66];
    gsap.ticker.add(() => {
      if (!root.classList.contains('has-world')) return;
      if (!stageActive && studioP <= 0) return;
      const scan = Math.round(THREE_clamp((studioP - 0.15) / 0.65) * 100);
      num.textContent = String(scan).padStart(3, '0');
      const an = worldReady ? world.anchors() : null;
      const ok = an && [an.ads.x, an.ads.y, an.agent.x, an.agent.y].every(Number.isFinite);
      const showTags = ok && studioP > 0.18;
      tagA.classList.toggle('on', showTags); tagB.classList.toggle('on', showTags);
      if (ok) { tagA.style.left = an.ads.x + 'px'; tagA.style.top = (an.ads.y - 120) + 'px'; tagB.style.left = an.agent.x + 'px'; tagB.style.top = (an.agent.y - 120) + 'px'; }
      cards.forEach((c, i) => {
        const on = studioP > thresholds[i] && studioP < 0.995;
        c.classList.toggle('on', on); cn[i].classList.toggle('on', on && ok);
        if (!ok) return;
        const r = c.getBoundingClientRect(), host = c.offsetParent.getBoundingClientRect();
        const a = (i === 0 || i === 2) ? an.ads : an.agent; // 01+03 → ads, 02+04 → agent
        const fromLeft = r.left + r.width / 2 < a.x;
        const sx = (fromLeft ? r.right : r.left) - host.left, sy = r.top + 30 - host.top;
        // top row meets the head, bottom row is lower, so the two lines on each side never merge
        const eyOff = (i === 2 ? innerHeight * 0.12 : i === 3 ? innerHeight * 0.1 : 0);
        const ex = a.x - host.left + (fromLeft ? -40 : 40), ey = a.y - host.top + eyOff;
        cn[i].setAttribute('d', `M${sx},${sy} L${(sx + ex) / 2},${sy} L${ex},${ey}`);
      });
    });
  } else {
    // lite / no-world: the same card-to-character connectors, aimed at the 2D sprites
    const cards = ['#hc1', '#hc2', '#hc3', '#hc4'].map((s) => $(s));
    const cn = ['#cn1', '#cn2', '#cn3', '#cn4'].map((s) => $(s));
    const adsEl = $('#castAds'), agentEl = $('#castAgent');
    const hostEl = $('.stage-studio .stage-sticky');
    const spriteBox = (fig) => (fig.querySelector('.studio-sprite') || fig).getBoundingClientRect();
    const paintLiteConnectors = () => {
      if (!adsEl || !agentEl || !hostEl) return;
      const host = hostEl.getBoundingClientRect();
      const ads = adsEl.getBoundingClientRect(), ag = agentEl.getBoundingClientRect();
      const adsS = spriteBox(adsEl), agS = spriteBox(agentEl);
      if (adsS.width < 2 || agS.width < 2 || host.width < 2) return;
      // 01 → ads shoulder, 02 → agent head, 03 → ads lower/book, 04 → agent orbs
      const anchors = [
        { x: adsS.left + adsS.width * 0.72, y: adsS.top + adsS.height * 0.32, mid: ads.left + ads.width / 2 },
        { x: agS.left + agS.width * 0.50, y: agS.top + agS.height * 0.18, mid: ag.left + ag.width / 2 },
        { x: adsS.left + adsS.width * 0.28, y: adsS.top + adsS.height * 0.72, mid: ads.left + ads.width / 2 },
        { x: agS.left + agS.width * 0.96, y: agS.top + agS.height * 0.52, mid: ag.left + ag.width / 2 },
      ];
      const rnd = (n) => Math.round(n * 10) / 10;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const visible = r.width > 0 && +getComputedStyle(c).opacity >= 0.4;
        cn[i].classList.toggle('on', visible);
        if (!visible) return;
        const a = anchors[i];
        const fromLeft = r.left + r.width / 2 < a.mid;
        const sx = (fromLeft ? r.right : r.left) - host.left;
        // if the card sits above or below the character, start the line at that edge so the elbow stays short
        const above = r.bottom < a.y + 8;
        const below = r.top > a.y - 8;
        const sy = (below ? r.top + 12 : above ? r.bottom - 8 : r.top + Math.min(26, r.height * 0.22)) - host.top;
        const ex = a.x - host.left, ey = a.y - host.top;
        const mx = above || below ? (fromLeft ? sx : (sx * 2 + ex) / 3) : (sx + ex) / 2;
        const my = above || below ? (sy + ey) / 2 : sy;
        cn[i].setAttribute('d', `M${rnd(sx)},${rnd(sy)} L${rnd(mx)},${rnd(my)} L${rnd(ex)},${rnd(ey)}`);
      });
    };
    paintLiteConnectors();
    addEventListener('resize', paintLiteConnectors);
    onLang(paintLiteConnectors);
    gsap.ticker.add(paintLiteConnectors);
  }

  if (root.classList.contains('s3d')) {
    // the 3D world's camera input: document scroll, scrubbed (0.8 s catch-up), recomputed on every layout refresh
    gsap.to(drive, { y: () => ScrollTrigger.maxScroll(window), ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.8, invalidateOnRefresh: true } });
    // backdrop colour behind the canvas: dark scan stage, the room (follows the theme), the contact corner
    const worldEl = $('#world'), zone = (z) => { worldEl.dataset.zone = z; };
    const zones = [...(root.classList.contains('has-world') ? [['#kerja', 'studio']] : []), ...$$('[data-s3d]').map((el) => [el, 'room']), ...(root.classList.contains('has-world') ? [['#ngobrol', 'contact']] : [])];
    zones.forEach(([el, z]) => ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => st.isActive && zone(z) }));
  }

  chips.forEach((c) => {
    const v = c.dataset.version;
    const enter = () => { markChip(v); scene?.setFocus(v); };
    const leave = () => scene?.setFocus(null);
    c.addEventListener('pointerenter', enter); c.addEventListener('focus', enter);
    c.addEventListener('pointerleave', leave); c.addEventListener('blur', leave);
    c.addEventListener('click', () => pick(v, undefined));
  });
  // Pick reset: armed once the hero is mostly scrolled away, fired on the way back in (works with or without 3D,
  // and with reduced motion, where the scene reset is instant).
  // (plain scroll check rather than onEnterBack: it survives the layout refresh when the 3D scene arrives or falls back)
  {
    const heroEl = $('.hero'); let armed = false;
    const check = () => {
      const r = heroEl.getBoundingClientRect(), passed = r.top + r.height * 0.55 < 0;
      if (passed) armed = true; else if (armed) { armed = false; resetPick(); }
    };
    addEventListener('scroll', check, { passive: true });
  }

  // touch-screen extras (ripples, swipe/peek cards, draggable characters, sticker spin, throwable chips)
  if (!reduced && (coarse || matchMedia('(any-pointer: coarse)').matches) && !matchMedia('(pointer: fine)').matches) {
    import('./touch.js').then(({ initTouch }) => initTouch({ root, onPick: (v) => pick(v, v === 'iklan' ? 620 : 840), getScene: () => scene, tick }));
  }

  // deep link to a project
  const m = location.hash.match(/^#proyek\/([abc])$/);

  await document.fonts.ready;
  if (reduced) { pre.remove(); clocks.reveal(); if (m) openDetail(m[1], false); if (want3D) schedule3D(); if (restore) jump(restore.y); else waiter.schedule(1500); return; }

  // 01 Intro: the <Rifqy•Hazim> wordmark ripples in with a 000-100 counter, then the sheet lifts (rounded bottom).
  // (2D on purpose: the 3D wordmark pulled Three.js onto the critical path.)
  const counter = document.createElement('span'); counter.className = 'pre-count mono'; counter.textContent = '000'; pre.append(counter);
  pre.classList.add('pre-2d');
  const c = { v: 0 };
  const tl = gsap.timeline();
  tl.fromTo('.pre-name .wm-l, .pre-name .wm-dot', { yPercent: -140, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'bounce.out', stagger: 0.045 }, 0.1)
    .fromTo('.pre-name .wm-name > .wm-br', { x: (i) => (i ? 40 : -40), opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.75)
    .fromTo('.pre-name .wm-sub', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 1.1);
  // Original intro timing on every device (phones slightly shorter, as before the 15 Nov speed pass).
  const countDur = small ? 1.1 : 1.5, liftDur = small ? 0.6 : 0.8, liftDelay = small ? '+=0.15' : '+=0.35';
  tl.to(c, { v: 100, duration: countDur, ease: 'power2.inOut', onUpdate: () => { counter.textContent = String(Math.round(c.v)).padStart(3, '0'); } }, 0)
    .to(pre, { yPercent: -100, borderBottomLeftRadius: 48, borderBottomRightRadius: 48, duration: liftDur, ease: 'smooth' }, liftDelay)
    .add(() => { pre.remove(); if (want3D) schedule3D(); bindScrollFX(); })
    .from('.identity .line > span', { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.12 }, '-=0.5')
    .to('[data-hero]', { opacity: 1, duration: 0.01 }, '<')
    .add(() => clocks.reveal(), '<0.5')
    .fromTo('.avail, .positioning, .lead, .version-chips, .time-card', { y: 24, clipPath: 'inset(-30% -30% 100% -30%)' }, { y: 0, clipPath: 'inset(-30% -30% -30% -30%)', duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'clipPath' }, '<0.2')
    .fromTo('.scene2d', { y: 16, clipPath: 'inset(0% 0% 100% 0%)' }, { y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.out', clearProps: 'transform,clipPath' }, '<')
    .add(() => decode($('.positioning'), 1.0), '<0.1')
    .add(() => { if (m) openDetail(m[1], false); if (!restore) waiter.schedule(1700); });

  function bindScrollFX() {
    if (bindScrollFX.done) return; bindScrollFX.done = true;
    gsap.to('.hero-copy', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  // holo cards are driven by the studio stage when the world layout is on; otherwise they reveal like any card
  ScrollTrigger.batch(root.classList.contains('has-world') ? '[data-reveal]:not(.holo-card)' : '[data-reveal]', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: 'auto' }),
    onLeave: (els) => gsap.set(els, { opacity: 1, y: 0, rotateX: 0, scale: 1, overwrite: 'auto' }),
    onEnterBack: (els) => gsap.to(els, { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.4, overwrite: 'auto' }),
    // scrolling back up past the start hides them again, so the reveal replays on the next scroll down
    onLeaveBack: (els) => gsap.to(els, { opacity: 0, y: 28, duration: 0.35, ease: 'power2.in', stagger: 0.04, overwrite: 'auto' }),
  });
  if (!root.classList.contains('has-world')) {
    // fallback: studio cards are normal reveal cards
    $$('.holo-card').forEach((c) => c.classList.add('on'));
  }
  gsap.utils.toArray('.sec-title').forEach((el) => {
    if (el.closest('.stage-studio') && root.classList.contains('has-world')) return;
    if (el.closest('#foto') && root.classList.contains('has-world')) return;
    gsap.from(el.querySelectorAll('.rule'), { scaleX: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
    gsap.from(el.querySelector('h2'), { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
  });
  // Project cards: thumb scales 0.8 -> 1 while the art settles 1.2 -> 1 (0.4s power1.out)
  $$('#proyek .card').forEach((card) => {
    gsap.fromTo($('.thumb', card), { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'power1.out', scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' } });
    gsap.fromTo($('.thumb > *', card), { scale: 1.2 }, { scale: 1, duration: 0.5, ease: 'power1.out', scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' } });
  });
  gsap.set('#proyek .grid3 > .card, .no-webgl .grid3 > .card', { rotateX: -18, transformOrigin: '50% 100%' });
  // overwrite 'auto' (not true) so the scroll spin only takes over `rotate` and leaves the sticker's entrance alone
  ScrollTrigger.create({ trigger: '.contact', start: 'top bottom', end: 'bottom top', onUpdate: (st) => gsap.to('.sticker', { rotate: st.progress * 120, duration: 0.4, overwrite: 'auto' }) });

  // ---------- Section-level entrances (replay on reverse scroll)
  // Each section container rises in and its edges open from a rounded inset; scrolling back up above it plays the
  // move backwards, so it comes in again on the way down. Children keep their own [data-reveal] timing on top.
  // The studio stage is sticky in the world layout, so it never gets a transform: only its heading eases in.
  const withWorld = root.classList.contains('has-world');
  const secs = ['.now', '#proyek', '.tools', '#tanya', '#jejak', '#faq', '#ngobrol', '.site-footer'];
  if (!withWorld) { secs.unshift('#foto'); secs.splice(2, 0, '#kerja'); }
  secs.map((s) => $(s)).filter(Boolean).forEach((sec) => {
    const clip = !small; // phones: transform + opacity only (no clip-path repaint of big boxes)
    gsap.fromTo(sec,
      { y: 56, opacity: 0.2, ...(clip && { clipPath: 'inset(0% 3% 0% 3% round 32px)' }) },
      { y: 0, opacity: 1, ...(clip && { clipPath: 'inset(0% 0% 0% 0% round 0px)' }), duration: 0.9, ease: 'power3.out',
        // clip off once settled, so hover lifts and shadows are never cut
        onComplete: () => { sec.style.clipPath = ''; },
        scrollTrigger: { trigger: sec, start: sec.matches('.site-footer') ? 'top bottom' : 'top 94%', toggleActions: 'play none none reverse' } });
  });
  if (withWorld) gsap.fromTo('.studio-head', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '#kerja', start: 'top 60%', toggleActions: 'play none none reverse' } });

  // Tools strip: label then marquee slide up
  gsap.fromTo(['.tools-title', '.marquee'], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.tools', start: 'top 90%', toggleActions: 'play none none reverse' } });
  // Contact sticker pops in (scale/opacity; its rotation stays with the scroll spin above)
  gsap.fromTo('.sticker', { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.8)',
    scrollTrigger: { trigger: '.sticker', start: 'top 92%', toggleActions: 'play none none reverse' } });
  // Footer contents, staggered
  gsap.fromTo('.footer-inner > *', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger: '.site-footer', start: 'top bottom', toggleActions: 'play none none reverse' } });
  } // bindScrollFX

  // back from an auto-update reload: skip the intro and land where the visitor was
  if (restore) { tl.progress(1); requestAnimationFrame(() => { ScrollTrigger.refresh(); jump(restore.y); }); }
}
const THREE_clamp = (x) => Math.min(1, Math.max(0, x));

// ---------- Card tilt
if (!reduced && matchMedia('(pointer: fine)').matches) {
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: x * 8, rotateX: -y * 8, y: -6, duration: 0.4, ease: 'power3.out' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.6, ease: 'power3.out' }));
  });
}

// Clock: subtle 3D tilt following the pointer (desktop)
if (!reduced && matchMedia('(pointer: fine)').matches) {
  $$('.time-card, .hdr-clock').forEach((el) => {
    const ck = el.matches('.hdr-clock') ? el : $('.tc-clock', el);
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(ck, { rotateY: x * 34, rotateX: -y * 30, scale: 1.06, duration: 0.4, ease: 'power3.out', transformPerspective: 260 }); });
    el.addEventListener('pointerleave', () => gsap.to(ck, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' }));
  });
}

// Tools: a gentle running strip (the set is cloned once, aria-hidden, for a seamless loop). Reduced motion keeps
// the static wrapped chips.
if (!reduced) {
  const mq = $('#marquee');
  mq.append(...[...mq.children].map((n) => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c; }));
  mq.parentElement.classList.add('is-running');
}

boot();
