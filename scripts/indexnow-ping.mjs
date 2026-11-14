// Tell IndexNow search engines (Bing, Yandex, Seznam, Naver, Yep…) that the pages changed.
// Run AFTER a deploy:  INDEXNOW_KEY=<your key> node scripts/indexnow-ping.mjs
// Needs the same INDEXNOW_KEY to have been set for the build (so https://<site>/<key>.txt is live). Sends only URLs.
import { SITE_URL, INDEXNOW_KEY } from '../site.config.js';
if (!INDEXNOW_KEY) { console.error('Set INDEXNOW_KEY first (same value as in the Vercel build env).'); process.exit(1); }
const host = new URL(SITE_URL).host;
const keyUrl = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const live = await fetch(keyUrl).then((r) => r.ok && r.text()).catch(() => false);
if (live?.trim() !== INDEXNOW_KEY) { console.error(`Key file not live yet: ${keyUrl}`); process.exit(1); }
const body = { host, key: INDEXNOW_KEY, keyLocation: keyUrl, urlList: [`${SITE_URL}/`, `${SITE_URL}/en/`] };
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log(`IndexNow: HTTP ${r.status} (200/202 = accepted)`);
