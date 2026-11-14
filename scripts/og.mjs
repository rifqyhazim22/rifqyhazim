// OG share images 1200x630, one per language (ID → public/og-image.png, EN → public/og-image-en.png), 3D loaded.
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [path, file] of [['/', 'og-image.png'], ['/en/', 'og-image-en.png']]) {
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light', timezoneId: 'Asia/Jakarta' });
  await p.goto('http://127.0.0.1:4173' + path); await p.waitForSelector('#preloader', { state: 'detached', timeout: 60000 });
  await p.mouse.move(600, 300); // first interaction starts the deferred 3D
  await p.waitForFunction(() => document.documentElement.classList.contains('three-ready'), null, { timeout: 60000 });
  await p.waitForTimeout(7000);
  await p.addStyleTag({ content: '.cursor,.scene-hint{opacity:0 !important}' });
  await p.mouse.move(1199, 629); await p.waitForTimeout(800);
  await p.screenshot({ path: 'public/' + file });
  await p.close(); console.log('og ok', file);
}
await b.close();
