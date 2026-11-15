// Scroll capture for review: frames of the 3D world while scrolling from the studio down to contact and back up
// (one screenshot per scroll step, so it is smooth however slow the renderer is). Needs `npm run preview`.
// Frames go to /tmp/vframes; turn them into an mp4 with ffmpeg. Usage: node scripts/scroll-video.mjs [light|dark] [steps]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const dir = process.env.VFRAMES || '/tmp/vframes'; mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const W = Number(process.env.VW || 1024), H = Number(process.env.VH || 640), scheme = process.argv[2] || 'light';
const ctx = await b.newContext({ viewport: { width: W, height: H }, colorScheme: scheme });
await ctx.addInitScript(() => localStorage.setItem('rh-music', 'no'));
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:4173/'); await p.waitForSelector('#preloader', { state: 'detached', timeout: 90000 });
await p.mouse.move(W - 40, H - 40);
await p.waitForFunction(() => document.querySelector('#world')?.classList.contains('is-ready'), null, { timeout: 120000 });
const { start, end } = await p.evaluate(() => { const k = document.querySelector('#kerja'), c = document.querySelector('#ngobrol'), top = (e) => e.getBoundingClientRect().top + scrollY; return { start: top(k) - innerHeight * 0.6, end: top(c) + (c.offsetHeight - innerHeight) / 2 }; });
const N = Number(process.argv[3] || 260);
const ys = []; for (let i = 0; i <= N; i++) { const t = i / N; ys.push(start + (end - start) * (0.5 - 0.5 * Math.cos(Math.PI * t))); }
const path = [...ys, ...Array(8).fill(end), ...ys.slice().reverse(), ...Array(8).fill(start)];
let f = 0;
await p.evaluate((y) => scrollTo(0, y), start); await p.waitForTimeout(2500);
for (const y of path) {
  await p.evaluate((y) => scrollTo(0, y), y);
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${dir}/f${String(f++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 82 });
}
console.log('frames', f);
await b.close();
