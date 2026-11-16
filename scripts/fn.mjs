// Functional QA: preloader, skip link, keyboard focus, nav wipe, project detail (Esc/back/button/swipe), theme 3-state,
// ID/EN, clock (visitor TZ + Jakarta line), cursor states, mailto, mobile menu, tap feedback, CV flag.
import { chromium } from 'playwright';
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const b = await chromium.launch({ args });
const CSP_HOOK = () => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`));
const res = []; const errs = [];
const ok = (name, pass, info = '') => { res.push({ name, pass, info }); console.log(pass ? 'PASS' : 'FAIL', name, info); };
const watch = (p, t) => { p.on('pageerror', (e) => errs.push(`[${t}] ${e.message}`)); p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`[${t}] ${m.text()}`); }); };
const st = (p) => p.evaluate(() => ({ y: scrollY, hidden: document.getElementById('detail').hidden, hash: location.hash }));
const go = (p, id) => p.evaluate((id) => { const y = document.getElementById(id).getBoundingClientRect().top + scrollY - 70; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }, id);
// ---------- desktop
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', timezoneId: 'America/New_York', acceptDownloads: true });
  const p = await ctx.newPage(); await p.addInitScript(CSP_HOOK); watch(p, 'desk');
  await p.goto('http://127.0.0.1:4173/');
  await p.waitForTimeout(400);
  ok('preloader shows on load', await p.locator('#preloader').isVisible().catch(() => false));
  await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); ok('preloader removes itself', true);
  await p.waitForTimeout(2500);
  await p.keyboard.press('Tab'); await p.waitForTimeout(400);
  const sk = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { cls: a.className, top: r.top, vis: r.top >= 0 && r.bottom > 0 }; });
  ok('skip link is first Tab stop and becomes visible', sk.cls.includes('skip') && sk.vis, JSON.stringify(sk));
  const foc = [];
  for (let i = 0; i < 18; i++) { await p.keyboard.press('Tab'); foc.push(await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return `${a.tagName.toLowerCase()}${a.className ? '.' + String(a.className).split(' ')[0] : ''}|${cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'}`; })); }
  ok('keyboard Tab reaches nav, toggles, chips with visible focus', foc.every((f) => f.endsWith('|true')), foc.join(' '));
  // clock
  const ck = await p.evaluate(() => ({ zone: document.querySelector('.tc-zone').textContent, jkt: document.querySelector('.tc-jkt').textContent, hidden: document.querySelector('.tc-jkt').hidden }));
  ok('clock uses visitor TZ (New York) + Jakarta line', /New York · E[SD]T/.test(ck.zone) && /Di Jakarta: \d\d\.\d\d WIB/.test(ck.jkt) && !ck.hidden, JSON.stringify(ck));
  // cursor states
  await p.evaluate(() => { document.activeElement.blur(); window.__lenis.scrollTo(0, { immediate: true, force: true }); }); await p.waitForTimeout(800);
  const cur = async (sel) => { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(500); const bx = await p.locator(sel).first().boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 4 }); await p.waitForTimeout(300); return p.evaluate(() => document.querySelector('.cursor').className); };
  const c1 = await cur('.nav a[href="#kerja"]'), c2 = await cur('.vchip[data-version="agen"]');
  ok('cursor states: link + versi', /is-link/.test(c1) && /is-agen/.test(c2), `${c1} | ${c2}`);
  await p.mouse.move(700, 600);
  // nav wipe
  await p.click('.nav a[href="#jejak"]'); await p.waitForTimeout(400);
  const wiping = await p.evaluate(() => document.getElementById('wipe').classList.contains('run'));
  await p.waitForTimeout(1600);
  const jy = await p.evaluate(() => Math.abs(document.getElementById('jejak').getBoundingClientRect().top - 70));
  ok('nav click runs full-screen wipe and lands on section', wiping && jy < 30, `wipe=${wiping} offset=${jy}`);
  // detail
  await go(p, 'proyek'); await p.waitForTimeout(1200);
  await p.click('[data-project] >> nth=0'); await p.waitForTimeout(1600);
  let s = await st(p); ok('project card opens detail + pushes #proyek/a', !s.hidden && s.hash === '#proyek/a', JSON.stringify(s));
  ok('detail focus moves to back button', await p.waitForFunction(() => document.activeElement.id === 'dBack', null, { timeout: 4000 }).then(() => true, () => false));
  await p.keyboard.press('Escape'); await p.waitForTimeout(1300); s = await st(p); ok('Esc closes detail', s.hidden && s.hash === '', JSON.stringify(s));
  await p.click('[data-project] >> nth=1'); await p.waitForTimeout(1600); await p.goBack(); await p.waitForTimeout(1300); s = await st(p); ok('browser back closes detail', s.hidden, JSON.stringify(s));
  await p.click('[data-project] >> nth=2'); await p.waitForTimeout(1600);
  const cLinks = await p.evaluate(() => ({ n: document.querySelectorAll('#dLinks a').length, hidden: document.getElementById('dLinksRow').hidden, text: document.getElementById('dRes').innerText }));
  ok('MediMart detail has no demo or repo links', cLinks.n === 0 && cLinks.hidden && !/demo|repo/i.test(cLinks.text), JSON.stringify(cLinks));
  await p.click('#dNext'); await p.waitForTimeout(1500); s = await st(p); ok('next project cycles to A', s.hash === '#proyek/a');
  await p.click('#dBack'); await p.waitForFunction(() => document.getElementById('detail').hidden, null, { timeout: 5000 }).catch(() => {}); s = await st(p); ok('back button closes detail', s.hidden, JSON.stringify(s));
  await p.goto('about:blank'); await p.goto('http://127.0.0.1:4173/#proyek/b'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(2500);
  s = await st(p); ok('deep link #proyek/b opens detail', !s.hidden, JSON.stringify(s));
  await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
  await p.goto('http://127.0.0.1:4173/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(1500);
  // theme
  const th = async () => p.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.dataset.themePref].join('/'));
  await p.click('.site-header [data-theme-btn="dark"]'); await p.waitForTimeout(300); const t1 = await th();
  await p.click('.site-header [data-theme-btn="light"]'); await p.waitForTimeout(300); const t2 = await th();
  await p.click('.site-header [data-theme-btn="auto"]'); await p.emulateMedia({ colorScheme: 'dark' }); await p.waitForTimeout(300); const t3 = await th();
  await p.reload(); await p.waitForTimeout(800); const t4 = await th();
  ok('theme 3-state (dark, light, auto follows system, reload = auto)', t1 === 'dark/dark' && t2 === 'light/light' && t3 === 'dark/auto' && t4 === 'dark/auto', [t1, t2, t3, t4].join(' '));
  ok('no theme in localStorage', await p.evaluate(() => localStorage.getItem('rh-theme') === null));
  await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(1500);
  // lang
  await p.click('.site-header [data-lang-btn="en"]'); await p.waitForTimeout(700);
  const en = await p.evaluate(() => ({ lang: document.documentElement.lang, nav: document.querySelector('.nav a[href="#proyek"]').textContent, card: document.querySelector('[data-pc="a.lead"]').textContent, jkt: document.querySelector('.tc-jkt').textContent }));
  ok('EN switch: lang attr, nav, content, Jakarta line', en.lang === 'en' && en.nav === 'projects' && /3\.20×/.test(en.card) && /In Jakarta: \d{1,2}:\d\d (AM|PM) WIB/.test(en.jkt), JSON.stringify(en));
  await p.click('.site-header [data-lang-btn="id"]'); await p.waitForTimeout(500);
  // mailto + CV flag
  const m = await p.evaluate(() => ({ mail: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')),
    dl: [...document.querySelectorAll('[data-dl] [data-dl-key]')].map((e) => `${e.closest('[data-dl]').dataset.dl}:${e.dataset.dlKey}:${e.tagName}:${e.getAttribute('href') || ''}:${e.hasAttribute('download')}:${e.getAttribute('aria-disabled') || ''}:${e.textContent.trim()}`) }));
  ok('mailto links point to rifqyhazim22@gmail.com', m.mail.length >= 3 && m.mail.every((h) => h === 'mailto:rifqyhazim22@gmail.com'), m.mail.join(' '));
  const cvs = m.dl.filter((x) => x.includes(':cv:')), portos = m.dl.filter((x) => x.includes(':porto:'));
  ok('CV button live in header + contact + menu (href, download attr, no "segera")', cvs.length === 3 && cvs.every((x) => /:A:\/cv\/CV-Rifqy-Hazim-2026\.pdf:true::/.test(x) && !/segera/.test(x)), cvs.join(' | '));
  ok('Portfolio button live in header + contact + menu (href, download attr, no "segera")', portos.length === 3 && portos.every((x) => /:A:\/portofolio\/Portofolio-Rifqy-Hazim-2026\.pdf:true::/.test(x) && !/segera/.test(x)), portos.join(' | '));
  ok('no "segera"/"soon" placeholder anywhere (ID)', await p.evaluate(() => document.querySelectorAll('.is-soon, [data-dl] .soon').length === 0 && ![...document.querySelectorAll('[data-dl]')].some((g) => /segera/i.test(g.textContent))));
  await go(p, 'ngobrol'); await p.waitForTimeout(1500);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-dl="contact"] a[data-dl-key="cv"]')]);
  const fpath = await dl.path(); const size = (await import('node:fs')).statSync(fpath).size;
  ok('clicking Unduh CV downloads CV-Rifqy-Hazim-2026.pdf', dl.suggestedFilename() === 'CV-Rifqy-Hazim-2026.pdf' && size === 861279, `${dl.suggestedFilename()} ${size}B`);
  const pdfResp = await p.request.get('http://127.0.0.1:4173/cv/CV-Rifqy-Hazim-2026.pdf');
  ok('CV served 200 application/pdf', pdfResp.status() === 200 && pdfResp.headers()['content-type'] === 'application/pdf', `${pdfResp.status()} ${pdfResp.headers()['content-type']}`);
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-dl="contact"] a[data-dl-key="porto"]')]);
  const size2 = (await import('node:fs')).statSync(await dl2.path()).size;
  ok('clicking Unduh Portofolio downloads Portofolio-Rifqy-Hazim-2026.pdf', dl2.suggestedFilename() === 'Portofolio-Rifqy-Hazim-2026.pdf' && size2 === 2572319, `${dl2.suggestedFilename()} ${size2}B`);
  const pr2 = await p.request.get('http://127.0.0.1:4173/portofolio/Portofolio-Rifqy-Hazim-2026.pdf');
  ok('Portfolio served 200 application/pdf', pr2.status() === 200 && pr2.headers()['content-type'] === 'application/pdf', `${pr2.status()} ${pr2.headers()['content-type']}`);
  await p.click('.site-header [data-lang-btn="en"]'); await p.waitForTimeout(600);
  const enDl = await p.evaluate(() => [...document.querySelectorAll('[data-dl="contact"] [data-dl-key]')].map((e) => e.textContent.trim()).join(' | '));
  ok('EN labels Download CV / Download Portfolio, no "soon"', /Download CV/.test(enDl) && /Download Portfolio/.test(enDl) && !/soon/i.test(enDl), enDl);
  await p.click('.site-header [data-lang-btn="id"]'); await p.waitForTimeout(400);
  // SEO URLs: /en/ is its own English page, the toggle keeps the URL in sync, unknown paths get the 404 page
  await p.goto('http://127.0.0.1:4173/en/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(800);
  const enp = await p.evaluate(() => ({ lang: document.documentElement.lang, canon: document.querySelector('link[rel=canonical]').href, nav: document.querySelector('.nav a[href="#proyek"]').textContent }));
  ok('/en/ opens in English with its own canonical', enp.lang === 'en' && enp.canon.endsWith('/en/') && enp.nav === 'projects', JSON.stringify(enp));
  await p.click('.site-header [data-lang-btn="id"]'); await p.waitForTimeout(500);
  const idp = await p.evaluate(() => ({ path: location.pathname, lang: document.documentElement.lang, canon: document.querySelector('link[rel=canonical]').href }));
  ok('switching to ID moves the URL to / and updates canonical', idp.path === '/' && idp.lang === 'id' && /vercel\.app\/$/.test(idp.canon), JSON.stringify(idp));
  const r404 = await p.request.get('http://127.0.0.1:4173/halaman-tidak-ada');
  ok('unknown path returns the 404 page with status 404', r404.status() === 404 && /Halaman ini tidak ada/.test(await r404.text()), String(r404.status()));
  const hdr = (await p.request.get('http://127.0.0.1:4173/')).headers();
  ok('security headers present (CSP, HSTS, nosniff, referrer, permissions, XFO, COOP)', ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options', 'cross-origin-opener-policy'].every((k) => hdr[k]), Object.keys(hdr).filter((k) => /policy|security|options/.test(k)).join(','));
  await ctx.close();
}
// ---------- mobile
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light', timezoneId: 'Asia/Jakarta' });
  const p = await ctx.newPage(); await p.addInitScript(CSP_HOOK); watch(p, 'mob');
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await p.goto('http://127.0.0.1:4173/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(3000);
  const ck = await p.evaluate(() => ({ zone: document.querySelector('.tc-zone').textContent, hidden: document.querySelector('.tc-jkt').hidden, cursor: document.documentElement.classList.contains('has-cursor') }));
  ok('mobile: Jakarta visitor sees "Jakarta · WIB", no duplicate Jakarta line, no custom cursor', /^Jakarta · WIB/.test(ck.zone) && ck.hidden && !ck.cursor, JSON.stringify(ck));
  await p.tap('.vchip[data-version="agen"]'); await p.waitForTimeout(600);
  ok('tap Versi Agen marks chip', await p.evaluate(() => document.querySelector('.vchip[data-version="agen"]').classList.contains('is-active')));
  await touch('touchStart', 200, 300); await touch('touchEnd');
  ok('tap feedback ripple appears', await p.evaluate(() => document.querySelectorAll('.tap-ripple').length > 0));
  await p.tap('#menuBtn'); await p.waitForTimeout(1200);
  const mo = await p.evaluate(() => ({ open: !document.getElementById('menu').hidden, exp: document.getElementById('menuBtn').getAttribute('aria-expanded'), focus: document.activeElement.closest('#menu') !== null }));
  ok('menu opens (aria-expanded, focus inside)', mo.open && mo.exp === 'true' && mo.focus, JSON.stringify(mo));
  await p.tap('#menu a[href="#proyek"]'); await p.waitForTimeout(2200);
  const ml = await p.evaluate(() => ({ menu: document.getElementById('menu').hidden, off: Math.round(document.getElementById('proyek').getBoundingClientRect().top) }));
  ok('menu link hands over to wipe and lands on section', ml.menu && Math.abs(ml.off - 70) < 40, JSON.stringify(ml));
  await p.tap('[data-project] >> nth=0'); await p.waitForTimeout(1800);
  await touch('touchStart', 195, 120); for (let i = 1; i <= 10; i++) { await touch('touchMove', 195, 120 + i * 45); await p.waitForTimeout(20); } await touch('touchEnd'); await p.waitForTimeout(1500);
  ok('swipe down closes detail', await p.evaluate(() => document.getElementById('detail').hidden));
  const tt = await p.evaluate(() => [...document.querySelectorAll('a, button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden], .skip, .detail') && (r.width < 44 || r.height < 44); }).map((e) => e.className || e.textContent.trim()));
  ok('tap targets ≥44px (visible)', tt.length === 0, tt.join(', '));
  await ctx.close();
}
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no console errors');
console.log(`${res.filter((r) => r.pass).length}/${res.length} passed`);
await b.close();
