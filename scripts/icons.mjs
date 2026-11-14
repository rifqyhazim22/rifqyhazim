// Renders the manifest icons from public/favicon.svg (192, 512, and a 512 maskable with a safe-zone pad).
import { chromium } from 'playwright';
import fs from 'node:fs';
const svg = fs.readFileSync('public/favicon.svg', 'utf8');
const b = await chromium.launch();
const p = await b.newPage();
for (const [name, size, pad, bg] of [['icon-192.png', 192, 0, null], ['icon-512.png', 512, 0, null], ['icon-512-maskable.png', 512, 0.2, '#F0EBE3']]) {
  await p.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await p.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg || 'transparent'}"><div style="width:${inner}px;height:${inner}px">${svg.replace('<svg', `<svg width="${inner}" height="${inner}"`)}</div></body></html>`);
  await p.screenshot({ path: `public/${name}`, omitBackground: !bg });
  console.log('ok', name);
}
await b.close();
