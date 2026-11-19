// QA matrix: widths × light/dark × ID/EN (+ reduced motion): console errors, overflow, forbidden copy, links, alt, axe.
import { chromium } from 'playwright';
import fs from 'node:fs';
const axeSrc = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const W = [[360, 740], [390, 844], [768, 1024], [1024, 768], [1180, 820], [1440, 900], [1920, 1080]];
// Extra forbidden words (e.g. private names) can be passed without committing them: FORBID_EXTRA="word1,word2"
const EXTRA = (process.env.FORBID_EXTRA || '').split(',').map((w) => w.trim()).filter(Boolean).map((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
const FORBID = [...EXTRA, /ROAS naik/i, /\bRp\.?\s?\d/i, /rupiah/i, /\bClaude\b/i, /\bChatGPT\b/i, /\bGPT-?\d/i, /\[[^\]\n]{2,40}\]/, /lorem/i, /TODO/, /Tiga Pilar/i, /Tiga Pillar/i, /BEP(?:\s*ROAS)?\s*5\b/i];
const b = await chromium.launch({ args });
const CSP_HOOK = () => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`));
const out = []; const errs = [];
async function scan(p, tag) {
  return p.evaluate((F) => {
    const txt = document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label],[title],[alt]')].map((e) => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || '') + ' ' + (e.getAttribute('alt') || '')).join(' ') + ' ' + document.title + ' ' + document.querySelector('meta[name=description]').content;
    const bad = F.map((s) => new RegExp(s.src, s.fl)).filter((r) => r.test(txt)).map((r) => r.source + ' → ' + (txt.match(r) || [])[0]);
    const imgsNoAlt = [...document.querySelectorAll('img:not([alt])')].length;
    const svgsUnlabeled = [...document.querySelectorAll('svg')].filter((s) => !s.closest('[aria-hidden="true"]') && s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('role') && !s.closest('button,a,[role=img]')).length;
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const badLinks = links.filter((h) => h.startsWith('#') && h.length > 1 && !document.getElementById(h.slice(1).split('/')[0]));
    const blankNoRel = [...document.querySelectorAll('a[target=_blank]')].filter((a) => !/noopener/.test(a.rel)).length;
    const hiddenReveal = [...document.querySelectorAll('[data-reveal]')].filter((e) => !(document.documentElement.classList.contains('has-world') && e.classList.contains('holo-card')) && +getComputedStyle(e).opacity < 0.5).length;
    return { hiddenReveal, overflow: document.documentElement.scrollWidth - innerWidth, bad, imgsNoAlt, svgsUnlabeled, badLinks, blankNoRel, lang: document.documentElement.lang, mailto: links.filter((h) => h.startsWith('mailto:')).length };
  }, FORBID.map((r) => ({ src: r.source, fl: r.flags })));
}
async function axe(p) {
  await p.evaluate(axeSrc); // evaluate via DevTools (an injected inline <script> would be blocked by our CSP, as it should)
  return p.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'] }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) })); });
}
const runs = [];
for (const [w, h] of W) for (const scheme of ['light', 'dark']) runs.push({ w, h, scheme, reduced: false });
for (const [w, h] of W) runs.push({ w, h, scheme: 'light', reduced: true });
for (const r of runs) {
  const mobile = r.w < 1000;
  const ctx = await b.newContext({ viewport: { width: r.w, height: r.h }, isMobile: mobile && r.w < 800, hasTouch: mobile, colorScheme: r.scheme, reducedMotion: r.reduced ? 'reduce' : 'no-preference', timezoneId: r.w === 1440 ? 'Europe/London' : 'Asia/Jakarta' });
  const p = await ctx.newPage(); await p.addInitScript(CSP_HOOK); const tag = `${r.w}-${r.scheme}${r.reduced ? '-reduced' : ''}`;
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`[${tag}] ${m.text()}`); }); p.on('pageerror', (e) => errs.push(`[${tag}] ${e.message}`));
  p.on('requestfailed', (q) => errs.push(`[${tag}] request failed ${q.url()}`));
  p.on('response', (q) => { if (q.status() >= 400 && q.url().startsWith('http://127.0.0.1')) errs.push(`[${tag}] ${q.status()} ${q.url()}`); });
  await p.goto('http://127.0.0.1:4173/');
  await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 }); await p.waitForTimeout(2500);
  // scroll through the page so every reveal runs
  await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += innerHeight * 0.7) { (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y)); await new Promise((r) => setTimeout(r, 250)); } (window.__lenis ? window.__lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0)); });
  await p.waitForTimeout(800);
  const id = await scan(p, tag);
  const clock = await p.evaluate(() => ({ zone: document.querySelector('.tc-zone')?.textContent, jkt: document.querySelector('.tc-jkt')?.hidden ? '(hidden)' : document.querySelector('.tc-jkt')?.textContent, date: document.querySelector('.tc-date')?.textContent, theme: document.documentElement.dataset.theme, tier: document.documentElement.dataset.tier }));
  await p.click('.site-header [data-lang-btn="en"]', { force: true }).catch(async () => { await p.evaluate(() => document.querySelector('[data-lang-btn="en"]').click()); });
  await p.waitForTimeout(900);
  const en = await scan(p, tag);
  let ax = null;
  if ((r.w === 1440 || r.w === 390) && !r.reduced) { await p.evaluate(() => document.querySelector('[data-lang-btn="id"]').click()); await p.waitForTimeout(600); ax = await axe(p); }
  out.push({ tag, clock, id, en, axe: ax });
  console.log(tag, JSON.stringify({ hid: id.hiddenReveal, ov: [id.overflow, en.overflow], bad: [...id.bad, ...en.bad], lang: [id.lang, en.lang], noAlt: id.imgsNoAlt, svg: id.svgsUnlabeled, badLinks: id.badLinks, clock, axe: ax && ax.map((v) => `${v.id}(${v.impact})x${v.n}`) }));
  await ctx.close();
}
fs.mkdirSync('reports', { recursive: true }); fs.writeFileSync('reports/qa-report.json', JSON.stringify({ out, errs }, null, 1));
console.log(errs.length ? errs.join('\n') : 'no console errors'); await b.close();
