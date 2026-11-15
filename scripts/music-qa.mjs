// Music QA: waiter greeting (first visit, ID/EN, light/dark, desktop/phone), answer persistence, Esc = session-only,
// stacking with the update toast, volume popover/long-press/menu slider + persistence. Needs `npm run preview`.
// Screenshots go to /workspace/shots/.
import { chromium } from 'playwright';
const O = '/workspace/shots/'; const URL = 'http://127.0.0.1:4173';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const res = []; const errs = [];
const ok = (n, pass, info = '') => { res.push(pass); console.log(pass ? 'PASS' : 'FAIL', n, info); };
async function page(opts, path = '/') {
  const ctx = await b.newContext(opts); const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL + path); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
  return { ctx, p };
}
const desk = { viewport: { width: 1440, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
// screenshots: greeting in 8 variants
for (const [dev, opts] of [['desk', desk], ['phone', phone]]) for (const scheme of ['light', 'dark']) for (const path of ['/', '/en/']) {
  const { ctx, p } = await page({ ...opts, colorScheme: scheme }, path);
  const shown = await p.waitForSelector('.waiter', { timeout: 8000 }).then(() => true).catch(() => false);
  await p.waitForTimeout(700);
  const lang = path === '/' ? 'id' : 'en';
  await p.screenshot({ path: `${O}greet-${dev}-${lang}-${scheme}.png` });
  const txt = shown ? await p.evaluate(() => document.querySelector('.waiter').innerText.replace(/\n+/g, ' | ')) : '';
  ok(`greeting shows ${dev} ${lang} ${scheme}`, shown && (lang === 'id' ? /Selamat datang/.test(txt) : /Welcome in/.test(txt)), txt);
  await ctx.close();
}
// behaviour (desktop)
{
  const { ctx, p } = await page(desk);
  await p.waitForSelector('.waiter', { timeout: 8000 });
  const a11y = await p.evaluate(() => { const w = document.querySelector('.waiter'); return { role: w.getAttribute('role'), modal: w.getAttribute('aria-modal'), focus: document.activeElement.className }; });
  ok('greeting is a non-modal dialog and focuses the primary button', a11y.role === 'dialog' && a11y.modal === 'false' && /wt-yes/.test(a11y.focus), JSON.stringify(a11y));
  const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 600); await p.waitForTimeout(800);
  ok('page still scrolls with the greeting open', (await p.evaluate(() => scrollY)) > y0 + 100);
  await p.evaluate(() => window.__lenis.scrollTo(0, { immediate: true, force: true }));
  // stacking with the update toast
  await p.evaluate(() => { const t = document.createElement('div'); t.className = 'upd-toast'; t.textContent = 'Ada versi baru situs ini (test)'; document.getElementById('dock').prepend(t); });
  await p.waitForTimeout(200); await p.screenshot({ path: O + 'greet-stack-with-update-toast.png' });
  const ov = await p.evaluate(() => { const a = document.querySelector('.upd-toast').getBoundingClientRect(), w = document.querySelector('.waiter').getBoundingClientRect(); return a.bottom <= w.top + 1; });
  ok('update toast stacks above the greeting (no overlap)', ov);
  await p.evaluate(() => document.querySelector('.upd-toast').remove());
  await p.click('.wt-yes'); await p.waitForTimeout(2500);
  const st = await p.evaluate(() => ({ choice: localStorage.getItem('rh-music'), pressed: document.getElementById('soundBtn').getAttribute('aria-pressed'), card: !!document.querySelector('.waiter') }));
  ok('"Boleh" starts music, saves yes, closes card', st.choice === 'yes' && st.pressed === 'true' && !st.card, JSON.stringify(st));
  // volume popover on hover
  await p.hover('#soundBtn'); await p.waitForTimeout(300);
  const vis = await p.evaluate(() => getComputedStyle(document.querySelector('.toggles .vol-pop')).visibility);
  ok('volume popover opens on hover', vis === 'visible', vis);
  ok('default volume is 35', (await p.inputValue('.toggles [data-vol]')) === '35');
  await p.fill('.toggles [data-vol]', '60'); await p.waitForTimeout(200);
  await p.screenshot({ path: O + 'volume-desk-popover.png', clip: { x: 760, y: 0, width: 680, height: 160 } });
  ok('volume saved', (await p.evaluate(() => localStorage.getItem('rh-music-vol'))) === '0.6');
  // reload: no greeting, volume restored, music resumes on first click
  await p.reload(); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(3500);
  ok('answered: greeting not shown again', !(await p.$('.waiter')));
  ok('volume restored after reload', (await p.inputValue('.toggles [data-vol]')) === '60');
  await p.mouse.click(700, 500); await p.waitForTimeout(800);
  ok('returning "yes" visitor: music resumes on first click', (await p.getAttribute('#soundBtn', 'aria-pressed')) === 'true');
  await ctx.close();
}
{ // "no" is remembered; Esc is session-only
  const { ctx, p } = await page(desk);
  await p.waitForSelector('.waiter', { timeout: 8000 }); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok('Esc closes', !(await p.$('.waiter')));
  ok('Esc stores nothing permanent', (await p.evaluate(() => localStorage.getItem('rh-music'))) === null);
  await p.reload(); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(3500);
  ok('Esc: not shown again this session', !(await p.$('.waiter')));
  const p2 = await ctx.newPage(); await p2.goto(URL + '/'); await p2.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
  ok('Esc: shown again in a new session (new tab)', await p2.waitForSelector('.waiter', { timeout: 8000 }).then(() => true).catch(() => false));
  await p2.click('.wt-no'); await p2.waitForTimeout(400);
  ok('"Nggak usah" saves no and keeps music off', (await p2.evaluate(() => localStorage.getItem('rh-music'))) === 'no' && (await p2.getAttribute('#soundBtn', 'aria-pressed')) === 'false');
  await ctx.close();
}
{ // phone: long-press the music button for the volume, menu slider
  const { ctx, p } = await page(phone);
  await p.waitForSelector('.waiter', { timeout: 8000 }); await p.tap('.wt-yes'); await p.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(p);
  const bx = await p.locator('#soundBtnM').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bx.x + 22, y: bx.y + 22 }] }); await p.waitForTimeout(700);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(400);
  const st = await p.evaluate(() => ({ open: document.querySelector('.sound-wrap-m').classList.contains('open'), pressed: document.getElementById('soundBtnM').getAttribute('aria-pressed') }));
  ok('phone: long-press opens volume, music keeps playing', st.open && st.pressed === 'true', JSON.stringify(st));
  await p.screenshot({ path: O + 'volume-phone-longpress.png', clip: { x: 0, y: 0, width: 390, height: 200 } });
  await p.tap('#menuBtn'); await p.waitForTimeout(1200);
  await p.screenshot({ path: O + 'volume-phone-menu.png' });
  ok('phone: volume slider in the menu', await p.locator('.menu-vol [data-vol]').isVisible());
  await ctx.close();
}
{ // reduced motion still greets (no animation)
  const { ctx, p } = await page({ ...desk, reducedMotion: 'reduce' });
  ok('reduced motion: greeting shows', await p.waitForSelector('.waiter', { timeout: 8000 }).then(() => true).catch(() => false));
  await ctx.close();
}
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no console errors');
console.log(`${res.filter(Boolean).length}/${res.length} passed`);
await b.close();
