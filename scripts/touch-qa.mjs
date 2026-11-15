// Touch QA (Chromium touch emulation): ripple, card swipe + long-press peek, hero drag-to-pick, chip throw, sticker spin, scroll-back reset. Needs `npm run build && npm run preview`. Screenshots go to /workspace/shots/.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const O = '/workspace/shots/touch-'; const errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const cdp = await ctx.newCDPSession(p);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
async function drag(x, y, dx, dy, { steps = 10, hold = 0, end = true, shot } = {}) {
  await touch('touchStart', x, y); if (hold) await p.waitForTimeout(hold);
  for (let i = 1; i <= steps; i++) { await touch('touchMove', x + dx * i / steps, y + dy * i / steps); await p.waitForTimeout(16); }
  if (shot) await p.screenshot({ path: O + shot });
  if (end) await touch('touchEnd');
}
const box = (sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel);
const scrollTo = (sel, off = 0.3) => p.evaluate(([s, o]) => { const el = document.querySelector(s); const y = el.getBoundingClientRect().top + scrollY - innerHeight * o; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }, [sel, off]);
await p.goto('http://127.0.0.1:4173/');
await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
await touch('touchStart', 380, 830); await touch('touchEnd');
await p.waitForFunction(() => document.documentElement.classList.contains('touch-fx'), null, { timeout: 10000 });
await p.waitForFunction(() => window.__scene, null, { timeout: 60000 }).catch(() => console.log('no 3D scene'));
await p.waitForTimeout(5000);
console.log('tier', await p.evaluate(() => document.documentElement.dataset.tier + ' ' + document.documentElement.className));
// 1 ripple
await touch('touchStart', 200, 300); await p.waitForTimeout(120); await p.screenshot({ path: O + '1-ripple.png' }); await touch('touchEnd');
console.log('ripples', await p.evaluate(() => [...document.querySelectorAll('.tap-ripple.fx')].map((r) => r.style.getPropertyValue('--rc')).join(',')));
// 3 hero 3D drag: find ads char screen pos via hitTest scan
const hit = await p.evaluate(() => { const c = document.getElementById('heroCanvas').getBoundingClientRect(); for (let y = c.top + 10; y < c.bottom; y += 8) for (let x = c.left + 5; x < c.left + c.width / 2; x += 8) if (window.__scene.hitTest(x, y) === 'iklan') return { x, y }; return null; });
console.log('ads hit', hit);
if (hit) {
  await drag(hit.x, hit.y, 60, 4, { end: false }); await p.screenshot({ path: O + '3a-hero-drag-small.png' }); await touch('touchEnd'); await p.waitForTimeout(1200);
  console.log('after small drop chip', await p.evaluate(() => document.querySelector('.vchip.is-active').dataset.version));
  // agent to the centre
  const hitA = await p.evaluate(() => { const c = document.getElementById('heroCanvas').getBoundingClientRect(); for (let y = c.top + 10; y < c.bottom; y += 8) for (let x = c.right - 5; x > c.left + c.width / 2; x -= 8) if (window.__scene.hitTest(x, y) === 'agen') return { x, y }; return null; });
  await drag(hitA.x, hitA.y, -150, 6, { end: false }); await p.screenshot({ path: O + '3b-hero-drag-agent-centre.png' }); await touch('touchEnd'); await p.waitForTimeout(1400);
  await p.screenshot({ path: O + '3c-hero-agent-picked.png' });
  console.log('after centre drop chip', await p.evaluate(() => document.querySelector('.vchip.is-active').dataset.version));
}
// 2 card swipe
await scrollTo('#proyek .card', 0.25); await p.waitForTimeout(1500);
let c = await box('#proyek .card');
await drag(c.x, c.y, 120, 6, { end: false }); await p.screenshot({ path: O + '2a-card-swipe.png' });
console.log('card x during', await p.evaluate(() => window.__gsap.getProperty('#proyek .card', 'x')));
await touch('touchEnd'); await p.waitForTimeout(1400);
console.log('card x after', await p.evaluate(() => window.__gsap.getProperty('#proyek .card', 'x')), 'detail hidden', await p.evaluate(() => document.getElementById('detail').hidden));
// vertical swipe on a card still scrolls
const y0 = await p.evaluate(() => scrollY); await drag(c.x, c.y + 100, 0, -200, { steps: 12 }); await p.waitForTimeout(800);
console.log('vertical swipe scroll delta', (await p.evaluate(() => scrollY)) - y0);
await scrollTo('#proyek .card', 0.25); await p.waitForTimeout(800); c = await box('#proyek .card');
// 6 long-press peek
await touch('touchStart', c.x, c.y); await p.waitForTimeout(800); await p.screenshot({ path: O + '6-peek.png' });
console.log('peek open', await p.evaluate(() => !!document.querySelector('.peek')));
await touch('touchEnd'); await p.waitForTimeout(600);
console.log('peek closed', await p.evaluate(() => !document.querySelector('.peek')), 'detail hidden after long-press', await p.evaluate(() => document.getElementById('detail').hidden));
// tap opens detail
await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(1200);
console.log('tap opens detail', await p.evaluate(() => !document.getElementById('detail').hidden)); await p.screenshot({ path: O + '6b-tap-detail.png' });
await p.evaluate(() => history.back()); await p.waitForTimeout(1200);
// 5 chips
await scrollTo('#tanya .topics', 0.4); await p.waitForTimeout(1500);
const ch = await box('#tanya .topic');
await drag(ch.x, ch.y, 80, 40, { end: false }); await p.screenshot({ path: O + '5a-chip-drag.png' }); await touch('touchEnd');
await p.waitForTimeout(150); await p.screenshot({ path: O + '5b-chip-thrown.png' }); await p.waitForTimeout(1500);
console.log('chip home', await p.evaluate(() => window.__gsap.getProperty('#tanya .topic', 'x') + ',' + window.__gsap.getProperty('#tanya .topic', 'y')));
// 4 sticker
await scrollTo('.sticker', 0.5); await p.waitForTimeout(1500);
const s = await box('.sticker');
await touch('touchStart', s.x, s.y - s.h * 0.4);
const pts = 14; for (let i = 1; i <= pts; i++) { const a = -Math.PI / 2 + (i / pts) * Math.PI; await touch('touchMove', s.x + Math.cos(a) * s.w * 0.4, s.y + Math.sin(a) * s.h * 0.4); await p.waitForTimeout(12); }
await touch('touchEnd'); await p.waitForTimeout(200); await p.screenshot({ path: O + '4-sticker-spin.png' });
const r1 = await p.evaluate(() => window.__gsap.getProperty('.sticker-spin', 'rotation')); await p.waitForTimeout(1500);
console.log('sticker rotation', r1, '->', await p.evaluate(() => window.__gsap.getProperty('.sticker-spin', 'rotation')), 'outer', await p.evaluate(() => window.__gsap.getProperty('.sticker', 'rotation')));
// scroll-back reset after touch pick
await p.evaluate(() => window.__lenis.scrollTo(0, { duration: 1.2, force: true })); await p.waitForTimeout(2500);
console.log('back top chip', await p.evaluate(() => document.querySelector('.vchip.is-active').dataset.version)); await p.screenshot({ path: O + '7-back-top-reset.png' });
console.log('ERRORS', errs); await b.close();
