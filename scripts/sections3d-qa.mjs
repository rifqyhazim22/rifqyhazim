// 3D sections QA: screenshots of every section's 3D corner (desktop 1440 / phone 390, light / dark) plus
// forward/reverse determinism of the camera (same scroll position down and back up = same pose).
// Needs `npm run preview`. Screenshots go to /workspace/shots/3d-<device>-<scheme>-<section>.png.
import { chromium } from 'playwright';
const O = process.env.SHOTS || '/workspace/shots/3d-'; const URL = process.env.QA_URL || 'http://127.0.0.1:4173';
const only = process.argv[2]; // optional: desk | phone
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = []; const res = [];
const ok = (n, pass, info = '') => { res.push(pass); console.log(pass ? 'PASS' : 'FAIL', n, info); };
const desk = { viewport: { width: 1440, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
async function open(opts) {
  const ctx = await b.newContext(opts);
  await ctx.addInitScript(() => { try { localStorage.setItem('rh-music', 'no'); } catch {} });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL + '/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
  await p.mouse.move(200, 200).catch(() => {}); await p.evaluate(() => window.dispatchEvent(new Event('pointermove')));
  await p.waitForFunction(() => document.querySelector('#world')?.classList.contains('is-ready'), null, { timeout: 120000 });
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
    const f = document.querySelector('#foto'); m.push(['foto-wide', top(f) - vh * 0.75], ['foto-zoom', top(f) + vh * 0.12]);
    if (document.documentElement.classList.contains('has-world')) { const c = document.querySelector('#ngobrol'); m.push(['ngobrol', top(c) + (c.offsetHeight - vh) / 2]); }
    return m;
  });
}
for (const [dev, opts] of [['desk', desk], ['phone', phone]]) {
  if (only && only !== dev) continue;
  for (const scheme of ['light', 'dark']) {
    const { ctx, p } = await open({ ...opts, colorScheme: scheme });
    const info = await p.evaluate(() => window.__world?.info());
    console.log(dev, scheme, JSON.stringify(info));
    const ms = await marks(p);
    for (const [name, y] of ms) { await to(p, y); await settle(p); await p.screenshot({ path: `${O}${dev}-${scheme}-${name}.png` }); }
    // determinism: pose at a mid point reached going down equals the pose there coming back up
    const mid = ms.find((m) => m[0] === 'tanya')[1] + 200;
    const pose = () => p.evaluate(() => { const c = window.__world.cam(); return c.map((v) => Math.round(v * 1000) / 1000).join(','); });
    await to(p, mid - 1500); await settle(p); await to(p, mid); await settle(p, 2600); const down = await pose();
    await to(p, mid + 2500); await settle(p); await to(p, mid); await settle(p, 2600); const up = await pose();
    const dmax = Math.max(...down.split(',').map((v, i) => Math.abs(v - up.split(',')[i]))); // scrub/pointer easing tails: allow 1 cm
    ok(`${dev}-${scheme}: same pose down vs up`, dmax < 0.01, `${down} | ${up}`);
    if (scheme === 'light') ok(`${dev}: dpr`, info && info.dpr >= (dev === 'desk' ? 1 : 1.5), JSON.stringify(info?.dpr));
    await ctx.close();
  }
}
console.log('errors', JSON.stringify(errs));
console.log(`${res.filter(Boolean).length}/${res.length} passed`);
await b.close();
process.exit(res.every(Boolean) && !errs.length ? 0 : 1);
