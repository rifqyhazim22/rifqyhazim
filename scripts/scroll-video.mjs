// Scroll capture for review: frames of the 3D world while scrolling from the studio down to contact and back up
// (one screenshot per scroll step, so it is smooth however slow the renderer is). Needs `npm run preview`.
// Frames go to $VFRAMES (default /tmp/vframes); turn them into an mp4 with ffmpeg. Usage: [PART=down|up] node scripts/scroll-video.mjs [light|dark] [steps]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const dir = process.env.VFRAMES || '/tmp/vframes'; mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
// always close the browser, also on errors (a leftover software-GL Chrome is heavy on the box)
const done = async (code) => { try { await b.close(); } catch {} process.exit(code); };
process.on('uncaughtException', (e) => { console.error(e); done(1); }); process.on('unhandledRejection', (e) => { console.error(e); done(1); });
const W = Number(process.env.VW || 1024), H = Number(process.env.VH || 640), scheme = process.argv[2] || 'light';
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: scheme });
await ctx.addInitScript(() => localStorage.setItem('rh-music', 'no'));
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:4173/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
await p.mouse.move(W - 40, H - 40);
await p.waitForFunction(() => document.querySelector('#world')?.classList.contains('is-ready'), null, { timeout: 120000 });
const { start, end } = await p.evaluate(() => { const k = document.querySelector('#kerja'), c = document.querySelector('#ngobrol'), top = (e) => e.getBoundingClientRect().top + scrollY; return { start: top(k) - innerHeight * 0.6, end: top(c) + (c.offsetHeight - innerHeight) / 2 }; });
// MODE=tour: ease from one section's 3D corner to the next and hold on each (down, then the same stops back up), so
// every station is on screen long enough to see. Each frame file is linked HOLD times (moves) or DWELL times (stops).
if (process.env.MODE === 'tour') {
  const { linkSync, rmSync, readdirSync } = await import('fs');
  readdirSync(dir).forEach((n) => rmSync(`${dir}/${n}`));
  const SEG = Number(process.env.SEG || 14), HOLD = Number(process.env.HOLD || 2), DWELL = Number(process.env.DWELL || 20);
  const keys = await p.evaluate(() => {
    const vh = innerHeight, top = (el) => el.getBoundingClientRect().top + scrollY, k = document.querySelector('#kerja'), c = document.querySelector('#ngobrol'), f = document.querySelector('#foto');
    return [top(k) - vh * 0.6, top(k) + k.offsetHeight * 0.55 - vh, ...[...document.querySelectorAll('[data-s3d]')].flatMap((el) => el.id === 'foto' ? [top(f) - vh * 0.68, top(f) + vh * 0.12] : [Math.max(0, top(el) - vh * 0.1)]), top(c) + (c.offsetHeight - vh) / 2];
  });
  let out = 0, n = 0; const emit = async (times) => { const src = `${dir}/u${String(out++).padStart(4, '0')}.jpg`; await p.screenshot({ path: src, type: 'jpeg', quality: 84 }); for (let i = 0; i < times; i++) linkSync(src, `${dir}/f${String(n++).padStart(5, '0')}.jpg`); };
  const go = async (y, ms) => { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(ms); };
  // PART=down: kerja -> ngobrol, PART=up: back up the same stops (each half in its own run, joined with ffmpeg)
  const part = process.env.PART || 'all';
  const tour = part === 'down' ? keys : part === 'up' ? keys.slice().reverse() : [...keys, ...keys.slice(0, -1).reverse()];
  await go(tour[0], 2500); await emit(part === 'up' ? Math.round(DWELL / 2) : DWELL);
  for (let i = 1; i < tour.length; i++) {
    const a = tour[i - 1], z = tour[i];
    for (let j = 1; j <= SEG; j++) { const t = j / SEG; await go(a + (z - a) * (0.5 - 0.5 * Math.cos(Math.PI * t)), 120); await emit(HOLD); }
    await p.waitForTimeout(1500); await emit(DWELL); // settled at the stop
  }
  console.log('unique', out, 'frames', n, 'keys', keys.length);
  await done(0);
}
const N = Number(process.argv[3] || 260);
const ys = []; for (let i = 0; i <= N; i++) { const t = i / N; ys.push(start + (end - start) * (0.5 - 0.5 * Math.cos(Math.PI * t))); }
// PART=down|up renders one half in its own browser (run both in parallel; frames are numbered so they concatenate)
const part = process.env.PART || 'all';
const down = [...ys, ...Array(8).fill(end)], up = [...ys.slice().reverse(), ...Array(8).fill(start)];
const path = part === 'down' ? down : part === 'up' ? up : [...down, ...up];
let f = part === 'up' ? down.length : 0;
await p.evaluate((y) => scrollTo(0, y), path[0]); await p.waitForTimeout(2500);
for (const y of path) {
  await p.evaluate((y) => scrollTo(0, y), y);
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${dir}/f${String(f++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 82 });
}
console.log('frames', f);
await done(0);
