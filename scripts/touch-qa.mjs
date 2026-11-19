// Touch QA (Chromium touch emulation): phone must get the lite 3D hero and iPad the tablet tier (desktop world, touch drag); ripple, card swipe + long-press peek, hero drag-to-pick, chip throw, sticker spin, scroll-back reset. Needs `npm run build && npm run preview`. Screenshots go to /workspace/shots/.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const O = '/workspace/shots/touch-'; const errs = []; const fails = [];
const must = (name, pass, info = '') => { console.log(pass ? 'PASS' : 'FAIL', name, info); if (!pass) fails.push(name); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
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
const scanHit = (kind, mode) => ({ kind, mode, fn: ({ kind, mode }) => {
  const s = window.__scene, el = document.getElementById('heroCanvas');
  if (!s?.hitTest || !el) return null;
  const c = el.getBoundingClientRect();
  const y0 = Math.max(0, c.top) + 10, y1 = Math.min(innerHeight, c.bottom);
  for (let y = y0; y < y1; y += 8) {
    if (mode === 'left') { for (let x = c.left + 5; x < c.left + c.width / 2; x += 8) if (s.hitTest(x, y) === kind) return { x, y }; }
    else if (mode === 'right') { for (let x = c.right - 5; x > c.left + c.width / 2; x -= 8) if (s.hitTest(x, y) === kind) return { x, y }; }
    else { for (let x = c.left + 5; x < c.right - 5; x += 8) if (s.hitTest(x, y) === kind) return { x, y }; }
  }
  return null;
}});
async function waitHit(page, kind, mode, timeout = 10000) {
  const start = Date.now();
  const { fn, ...arg } = { ...scanHit(kind, mode) };
  while (Date.now() - start < timeout) {
    const hit = await page.evaluate(fn, arg);
    if (hit) return hit;
    await page.waitForTimeout(250);
  }
  return null;
}

await p.goto('http://127.0.0.1:4173/');
await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
await touch('touchStart', 380, 830); await touch('touchEnd');
await p.waitForFunction(() => document.documentElement.classList.contains('touch-fx'), null, { timeout: 10000 });
await p.waitForFunction(() => window.__scene, null, { timeout: 60000 }).catch(() => console.log('no 3D scene'));
await p.waitForFunction(() => document.documentElement.classList.contains('three-ready'), null, { timeout: 60000 }).catch(() => {});
console.log('tier', await p.evaluate(() => document.documentElement.dataset.tier + ' ' + document.documentElement.className));
must('phone: lite tier with the 3D hero', await p.evaluate(() => document.documentElement.dataset.tier === 'lite' && !!window.__scene && document.documentElement.classList.contains('three-ready')));
// 1 ripple
await touch('touchStart', 200, 300); await p.waitForTimeout(120); await p.screenshot({ path: O + '1-ripple.png' }); await touch('touchEnd');
console.log('ripples', await p.evaluate(() => [...document.querySelectorAll('.tap-ripple.fx')].map((r) => r.style.getPropertyValue('--rc')).join(',')));
// 3 hero 3D drag: poll until intro ends and the ads char is hittable (up to 10s)
const hit = await waitHit(p, 'iklan', 'left');
console.log('ads hit', hit); must('phone: 3D characters can be grabbed', !!hit);
if (hit) {
  await drag(hit.x, hit.y, 60, 4, { end: false }); await p.screenshot({ path: O + '3a-hero-drag-small.png' }); await touch('touchEnd'); await p.waitForTimeout(1200);
  console.log('after small drop chip', await p.evaluate(() => document.querySelector('.vchip.is-active').dataset.version));
  // agent to the centre
  const hitA = await waitHit(p, 'agen', 'right');
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
// iPad: the tablet tier (desktop world) with touch controls: drag a 3D character to pick it
{
  const tctx = await b.newContext({ viewport: { width: 1024, height: 1366 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const tp = await tctx.newPage();
  tp.on('pageerror', (e) => errs.push(e.message));
  await tp.goto('http://127.0.0.1:4173/');
  await tp.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
  await tp.touchscreen.tap(1016, 120);
  await tp.waitForFunction(() => window.__scene && document.documentElement.classList.contains('three-ready'), null, { timeout: 60000 }).catch(() => {});
  const st = await tp.evaluate(() => ({ tier: document.documentElement.dataset.tier, cls: document.documentElement.className, scene: !!window.__scene }));
  must('ipad: tablet tier, desktop world, 3D hero', st.tier === 'tablet' && /has-world/.test(st.cls) && /tablet/.test(st.cls) && st.scene, JSON.stringify(st));
  const tcdp = await tctx.newCDPSession(tp);
  const tt = (type, x, y) => tcdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  // poll until hero intro finishes and the agent is hittable (intro lasts ~4.3s; up to 10s)
  const th = await waitHit(tp, 'agen', 'full');
  must('ipad: 3D characters can be grabbed', !!th, JSON.stringify(th));
  if (th) {
    await tt('touchStart', th.x, th.y); for (let i = 1; i <= 10; i++) { await tt('touchMove', th.x - 20 * i, th.y); await tp.waitForTimeout(16); }
    await tp.screenshot({ path: O + 'ipad-drag.png' }); await tt('touchEnd'); await tp.waitForTimeout(1500);
    console.log('ipad chip after drag', await tp.evaluate(() => document.querySelector('.vchip.is-active').dataset.version));
  }
  await tctx.close();
}
console.log('ERRORS', errs); await b.close();
console.log(fails.length ? `FAILED: ${fails.join(' | ')}` : 'touch QA: all checks passed');
process.exit(fails.length || errs.length ? 1 : 0);
