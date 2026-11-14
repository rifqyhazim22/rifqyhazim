// Single source of truth for the public address and the (optional) search-engine keys.
// Switching to rifqyhazim.com later = change SITE_URL here (or set the SITE_URL env var in Vercel) and rebuild:
// canonical, hreflang, Open Graph, JSON-LD, sitemap.xml, robots.txt and llms.txt all follow it.
// These values are read at BUILD time only (Node), never shipped in the JS bundle.
const env = process.env;
export const SITE_URL = (env.SITE_URL || 'https://rifqyhazim.vercel.app').replace(/\/+$/, '');

// Verification codes: leave empty until you have them (Search Console / Bing Webmaster give you the value).
// Empty = the meta tag is not emitted at all.
export const GOOGLE_SITE_VERIFICATION = env.GOOGLE_SITE_VERIFICATION || ''; // <meta name="google-site-verification">
export const BING_SITE_VERIFICATION = env.BING_SITE_VERIFICATION || '';     // <meta name="msvalidate.01">
export const YANDEX_VERIFICATION = env.YANDEX_VERIFICATION || '';           // <meta name="yandex-verification"> (optional)

// IndexNow (Bing, Yandex, Seznam, Naver...): set INDEXNOW_KEY (8-128 chars: a-z A-Z 0-9 -) and the build writes
// /<key>.txt. Then run `node scripts/indexnow-ping.mjs` after each deploy. Empty = no key file.
export const INDEXNOW_KEY = env.INDEXNOW_KEY || '';
