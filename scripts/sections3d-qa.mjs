// 3D sections QA: tier per device (desktop / touchscreen laptop = full, iPad = tablet, phone = lite, all with 3D),
// screenshots of every section's 3D corner (desktop 1440 / iPad 1024x1366 / phone 390, light / dark) plus
// forward/reverse determinism of the camera (same scroll position down and back up = same pose).
// Needs `npm run preview`. Screenshots go to /workspace/shots/3d-<device>-<scheme>-<section>.png.
import { chromium } from 'playwright';
const O = process.env.SHOTS || '/workspace/shots/3d-'; const URL = process.env.QA_URL || 'http://127.0.0.1:4173';
const only = process.argv[2]; // optional: desk | tablet | phone | touchlaptop
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = []; const res = [];
const ok = (n, pass, info = '') => { res.push(pass); console.log(pass ? 'PASS' : 'FAIL', n, info); };
const desk = { viewport: { width: 1440, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const tablet = { viewport: { width: 1024, height: 1366 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const touchlaptop = { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: true, deviceScaleFactor: 1, touchLaptop: true }; // touchscreen laptop: touch + mouse/trackpad
const TOUCH_LAPTOP = () => { const real = window.matchMedia.bind(window); const fake = { '(pointer: fine)': true, '(any-pointer: fine)': true, '(hover: hover)': true, '(any-hover: hover)': true, '(pointer: coarse)': false, '(any-pointer: coarse)': true };
  window.matchMedia = (q) => { const k = q.trim(); if (k in fake) { const m = real(q); const noop = { value() {} }; return Object.create(m, { matches: { value: fake[k] }, media: { value: q }, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop }); } return real(q); }; };
const wantTier = { desk: 'full', touchlaptop: 'full', tablet: 'tablet', phone: 'lite' };
async function open(opts) {
  const { touchLaptop, ...ctxOpts } = opts;
  const ctx = await b.newContext(ctxOpts);
  // touchscreen laptop: Chromium's touch emulation reports a coarse-only pointer, so report what real touch laptops do
  // (primary pointer fine + hover, touch as an extra coarse pointer)
  if (opts.touchLaptop) await ctx.addInitScript(TOUCH_LAPTOP);
  await ctx.addInitScript(() => { try { localStorage.setItem('rh-music', 'no'); sessionStorage.setItem('rh-music-back', '1'); } catch {} }); // answered, and the welcome-back card already seen: clean shots
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL + '/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
  // first interaction (loads the deferred 3D the same way a visitor does: pointer on desktop, a tap on touch screens)
  if (opts.hasTouch) await p.touchscreen.tap(opts.viewport.width - 8, 120).catch(() => {});
  await p.mouse.move(200, 200).catch(() => {}); await p.evaluate(() => window.dispatchEvent(new Event('pointermove')));
  return { ctx, p };
}
const to = (p, y) => p.evaluate((y) => { window.scrollTo(0, y); }, y);
const settle = (p, ms = 2200) => p.waitForTimeout(ms);
// where each section's corner is at rest (= world.js stop: top - 10vh); foto also at its zoom
async function marks(p) {
  return p.evaluate(() => {
    const vh = innerHeight, top = (el) => el.getBoundingClientRect().top + scrollY;
    const m = [];
    const k = document.querySelector('#kerja'); if (document.documentElement.classList.contains('has-world')) m.push(['kerja', top(k) + k.offsetHeight * 0.55 - vh]);
    document.querySelectorAll('[data-s3d]').forEach((el) => { m.push([el.dataset.s3d, Math.max(0, top(el) - vh * 0.1)]); });
    const f = document.querySelector('#foto'); m.push(['foto-wide', top(f) - vh * 0.45], ['foto-zoom', top(f) + vh * 0.12]);
    if (document.documentElement.classList.contains('has-world')) { const c = document.querySelector('#ngobrol'); m.push(['ngobrol', top(c) + (c.offsetHeight - vh) / 2]); }
    return m;
  });
}
for (const [dev, opts] of [['desk', desk], ['touchlaptop', touchlaptop], ['tablet', tablet], ['phone', phone]]) {
  if (only && only !== dev) continue;
  for (const scheme of dev === 'touchlaptop' ? ['light'] : ['light', 'dark']) {
    const { ctx, p } = await open({ ...opts, colorScheme: scheme });
    const blankHero = await p.evaluate(() => getComputedStyle(document.querySelector('.scene2d')).display === 'none' && !document.documentElement.classList.contains('three-ready'));
    ok(`${dev}-${scheme}: hero never blank before the 3D arrives`, !blankHero);
    await p.waitForFunction(() => document.querySelector('#world')?.classList.contains('is-ready'), null, { timeout: 120000 }).catch(() => {});
    const state = await p.evaluate(() => ({ tier: document.documentElement.dataset.tier, cls: document.documentElement.className, scene: !!window.__scene, world: !!window.__world, ready: document.querySelector('#world')?.classList.contains('is-ready') }));
    console.log(dev, scheme, JSON.stringify(state));
    ok(`${dev}-${scheme}: tier ${wantTier[dev]}`, state.tier === wantTier[dev], state.tier);
    ok(`${dev}-${scheme}: 3D hero + world rendered`, state.scene && state.world && state.ready, JSON.stringify(state));
    ok(`${dev}-${scheme}: ${dev === 'phone' ? 'lite stations (no studio world)' : 'desktop world (has-world)'}`, dev === 'phone' ? /\blite\b/.test(state.cls) && !/has-world/.test(state.cls) : /has-world/.test(state.cls));
    if (dev === 'touchlaptop') { await ctx.close(); continue; }
    const info = await p.evaluate(() => window.__world?.info());
    console.log(dev, scheme, JSON.stringify(info));
    const ms = await marks(p);
    const pose = () => p.evaluate(() => { const c = window.__world.cam(); return c.map((v) => Math.round(v * 1000) / 1000).join(','); });
    // a slow software renderer can lag the scrub by seconds: wait until the camera stops moving (max 20 s)
    const steady = async () => { let a = await pose(), same = 0; for (let i = 0; i < 50; i++) { await p.waitForTimeout(500); const c = await pose(); same = c === a ? same + 1 : 0; if (same >= 3) return c; a = c; } return a; }; // 3 equal reads: a starved frame loop can look still for a moment
    // software GL can stall the compositor for a while after a long jump: give the shot time, and retake a blank (background-only) frame
    const shot = async (path) => { await steady(); await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {}); for (let i = 0; i < 3; i++) { const buf = await p.screenshot({ path, timeout: 90000 }).catch(() => null); if (buf && buf.length > 20000) return; await settle(p, 3000); } };
    for (const [name, y] of ms) { await to(p, y); await settle(p); await shot(`${O}${dev}-${scheme}-${name}.png`); }
    // determinism: pose at a mid point reached going down equals the pose there coming back up
    const mid = ms.find((m) => m[0] === 'tanya')[1] + 200;
    await to(p, mid - 1500); await settle(p); await to(p, mid); await settle(p, 2600); const down = await steady();
    await to(p, mid + 2500); await settle(p); await to(p, mid); await settle(p, 2600); const up = await steady();
    const dmax = Math.max(...down.split(',').map((v, i) => Math.abs(v - up.split(',')[i]))); // scrub/pointer easing tails: allow 1 cm
    ok(`${dev}-${scheme}: same pose down vs up`, dmax < 0.01, `${down} | ${up}`);
    if (scheme === 'light') ok(`${dev}: dpr`, info && info.dpr >= 1 && info.dpr <= (dev === 'desk' ? 2 : 1.5), JSON.stringify(info?.dpr));
    await ctx.close();
  }
}
console.log('errors', JSON.stringify(errs));
console.log(`${res.filter(Boolean).length}/${res.length} passed`);
await b.close();
process.exit(res.every(Boolean) && !errs.length ? 0 : 1);
