// Local SEO validator for the built site (dist/): JSON-LD (schema.org shape + @id references + verified-only facts),
// head tags, hreflang reciprocity, headings, links, sitemap/robots/manifest/llms. Exit code 1 on any error.
import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import { SITE_URL } from '../site.config.js';
import { PROJECTS } from '../src/content.js';
const errors = [], warns = [], info = [];
const E = (m) => errors.push(m), W = (m) => warns.push(m);
// Extra forbidden words (e.g. private names) can be passed without committing them: FORBID_EXTRA="word1,word2"
const EXTRA = (process.env.FORBID_EXTRA || '').split(',').map((w) => w.trim()).filter(Boolean).map((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
const FORBID = [/ROAS naik/i, /\bRp\.?\s?\d/i, /rupiah/i, /\bClaude\b(?!Bot)/i, /ChatGPT/i, /lorem/i, /\bTODO\b/, /Tiga Pilar/i, /Tiga Pillar/i, /BEP(?:\s*ROAS)?\s*5\b/i, /BlendAi/i, ...EXTRA];
// schema.org properties allowed per type (subset we use), so typos and invented props are caught
const ALLOWED = {
  WebSite: ['@type', '@id', 'url', 'name', 'inLanguage', 'publisher'],
  ProfilePage: ['@type', '@id', 'url', 'name', 'description', 'inLanguage', 'isPartOf', 'mainEntity', 'about', 'dateModified', 'hasPart'],
  Person: ['@type', '@id', 'name', 'url', 'image', 'description', 'address', 'jobTitle', 'email', 'worksFor', 'alumniOf', 'knowsAbout', 'sameAs'],
  CreativeWork: ['@type', '@id', 'name', 'description', 'dateCreated', 'inLanguage', 'keywords', 'creator', 'url', 'sameAs'],
  FAQPage: ['@type', '@id', 'url', 'name', 'inLanguage', 'mainEntity', 'isPartOf'],
};
const REQUIRED = { WebSite: ['url', 'name'], ProfilePage: ['url', 'name', 'mainEntity'], Person: ['name', 'url'], CreativeWork: ['name', 'description', 'creator'], FAQPage: ['name', 'mainEntity'] };
const isAbs = (u) => /^https:\/\/[^\s]+$/.test(u) || /^mailto:[^\s@]+@[^\s@]+$/.test(u);

function checkPage(file, lang, path) {
  const html = fs.readFileSync(file, 'utf8');
  const { document: d } = parseHTML(html);
  const tag = `${path}:`;
  const q = (s) => d.querySelector(s), qa = (s) => [...d.querySelectorAll(s)];
  if (d.documentElement.getAttribute('lang') !== lang) E(`${tag} <html lang> is ${d.documentElement.getAttribute('lang')}`);
  const title = q('title')?.textContent || ''; if (!title) E(`${tag} no <title>`); if (title.length > 70) W(`${tag} title ${title.length} chars (>70 may be truncated)`);
  const desc = q('meta[name="description"]')?.getAttribute('content') || ''; if (desc.length < 70 || desc.length > 180) W(`${tag} description ${desc.length} chars`);
  info.push(`${tag} title ${title.length} chars, description ${desc.length} chars`);
  const canon = q('link[rel="canonical"]')?.getAttribute('href'); if (canon !== SITE_URL + path) E(`${tag} canonical ${canon}`);
  const alts = Object.fromEntries(qa('link[rel="alternate"][hreflang]').map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]));
  if (alts.id !== SITE_URL + '/' || alts.en !== SITE_URL + '/en/' || !alts['x-default']) E(`${tag} hreflang set ${JSON.stringify(alts)}`);
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale']) if (!q(`meta[property="${p}"]`)) E(`${tag} missing ${p}`);
  if (q('meta[property="og:url"]')?.getAttribute('content') !== SITE_URL + path) E(`${tag} og:url mismatch`);
  if (!q('meta[name="twitter:card"]')) E(`${tag} missing twitter:card`);
  if (!q('link[rel="manifest"]')) E(`${tag} missing manifest link`);
  if (qa('meta[name="theme-color"]').length < 1) E(`${tag} missing theme-color`);
  const h1 = qa('h1'); if (h1.length !== 1) E(`${tag} ${h1.length} <h1>`); else if (!/Rifqy Hazim/.test(h1[0].textContent)) W(`${tag} h1 has no name`);
  // headings order (no skipped levels from h1 → h3 without h2 in between)
  let prev = 1; qa('h1,h2,h3,h4').forEach((h) => { const n = +h.tagName[1]; if (n > prev + 1) W(`${tag} heading jump h${prev}→h${n}: ${h.textContent.trim().slice(0, 40)}`); prev = n; });
  qa('img').forEach((i) => { if (!i.hasAttribute('alt')) E(`${tag} img without alt`); });
  qa('a[href]').forEach((a) => {
    const name = (a.getAttribute('aria-label') || a.textContent).trim();
    if (!name) E(`${tag} link without text: ${a.getAttribute('href')}`);
    if (/^(klik di sini|click here|here|di sini|link)$/i.test(name)) W(`${tag} vague link text "${name}"`);
    if (a.getAttribute('target') === '_blank' && !/noopener/.test(a.getAttribute('rel') || '')) E(`${tag} _blank without noopener: ${a.getAttribute('href')}`);
    if (a.getAttribute('target') === '_blank' && !/noreferrer/.test(a.getAttribute('rel') || '')) E(`${tag} _blank without noreferrer: ${a.getAttribute('href')}`);
  });
  // critical content present in the static HTML (no JS)
  const text = d.body.textContent.replace(/\s+/g, ' ');
  const must = ['Rifqy', 'Ads & E-commerce Specialist · AI Agent Orchestrator', 'MediMart', lang === 'en' ? 'Private company' : 'Perusahaan swasta', 'The Circle Digital (TCD)', 'Ads Operation', 'UIN Syarif Hidayatullah Jakarta', 'rifqyhazim22@gmail.com', 'LinkedIn', 'GitHub', PROJECTS.a[lang].title, PROJECTS.b[lang].title, PROJECTS.c[lang].title, lang === 'en' ? 'Based in Jakarta, Indonesia' : 'Berbasis di Jakarta, Indonesia', lang === 'en' ? 'Download Portfolio' : 'Unduh Portofolio'];
  must.push(lang === 'en' ? 'FAQ' : 'Tanya jawab', lang === 'en' ? 'Who is Rifqy?' : 'Siapa Rifqy?');
  must.forEach((m) => { if (!text.includes(m)) E(`${tag} static HTML is missing "${m}"`); });
  FORBID.forEach((r) => { if (r.test(text) || r.test(d.head.innerHTML)) E(`${tag} forbidden copy ${r}`); });
  if (/\[[^\]\n]{2,40}\]/.test(text)) E(`${tag} bracket placeholder left: ${text.match(/\[[^\]\n]{2,40}\]/)[0]}`);
  // inline scripts (CSP: script-src 'self')
  qa('script').forEach((s) => { if (!s.getAttribute('src') && s.getAttribute('type') !== 'application/ld+json') E(`${tag} inline executable <script> (blocked by CSP)`); });
  // JSON-LD
  const blocks = qa('script[type="application/ld+json"]');
  if (blocks.length !== 1) E(`${tag} ${blocks.length} JSON-LD blocks`);
  blocks.forEach((b) => {
    let j; try { j = JSON.parse(b.textContent); } catch (e) { E(`${tag} JSON-LD parse error ${e.message}`); return; }
    if (j['@context'] !== 'https://schema.org') E(`${tag} @context`);
    const nodes = j['@graph'] || [], ids = new Set(nodes.map((n) => n['@id']));
    const types = nodes.map((n) => n['@type']);
    ['WebSite', 'ProfilePage', 'Person', 'FAQPage'].forEach((t) => { if (!types.includes(t)) E(`${tag} JSON-LD missing ${t}`); });
    if (types.filter((t) => t === 'CreativeWork').length !== 3) E(`${tag} expected 3 CreativeWork projects`);
    const refs = []; const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (Object.keys(o).length === 1 && o['@id']) refs.push(o['@id']); Object.values(o).forEach(walk); } }; walk(nodes);
    refs.forEach((r) => { if (!ids.has(r)) E(`${tag} JSON-LD dangling @id ${r}`); });
    nodes.forEach((n) => {
      const t = n['@type'];
      if (!ALLOWED[t]) { E(`${tag} unexpected @type ${t}`); return; }
      Object.keys(n).forEach((k) => { if (!ALLOWED[t].includes(k)) E(`${tag} ${t} has unexpected property ${k}`); });
      REQUIRED[t].forEach((k) => { if (n[k] == null || n[k] === '') E(`${tag} ${t} missing ${k}`); });
      ['url', 'image', 'email'].forEach((k) => { if (n[k] && !isAbs(n[k])) E(`${tag} ${t}.${k} not absolute: ${n[k]}`); });
      [].concat(n.sameAs || []).forEach((u) => { if (!isAbs(u)) E(`${tag} sameAs not absolute: ${u}`); });
      if (n['@id'] && !n['@id'].startsWith(SITE_URL)) E(`${tag} @id outside SITE_URL: ${n['@id']}`);
    });
    const person = nodes.find((n) => n['@type'] === 'Person');
    const expectSame = ['https://www.linkedin.com/in/rifqyhazim/', 'https://github.com/rifqyhazim22', 'https://www.upwork.com/freelancers/~01e5a18464e476bfa5'];
    if (JSON.stringify(person.sameAs) !== JSON.stringify(expectSame)) E(`${tag} Person.sameAs ${JSON.stringify(person.sameAs)}`);
    // location: city + country only, never a street, postal code or phone (privacy rule)
    const ad = person.address || {};
    if (ad['@type'] !== 'PostalAddress' || ad.addressLocality !== 'Jakarta' || ad.addressCountry !== 'ID' || Object.keys(ad).some((k) => !['@type', 'addressLocality', 'addressCountry'].includes(k))) E(`${tag} Person.address must be only Jakarta, ID: ${JSON.stringify(ad)}`);
    if (/streetAddress|postalCode|telephone|birthDate/.test(b.textContent)) E(`${tag} JSON-LD has private fields`);
    FORBID.forEach((r) => { if (r.test(b.textContent)) E(`${tag} forbidden copy in JSON-LD ${r}`); });
    info.push(`${tag} JSON-LD OK: ${types.join(', ')}`);
  });
}

checkPage('dist/index.html', 'id', '/');
checkPage('dist/en/index.html', 'en', '/en/');
// sitemap
const sm = fs.readFileSync('dist/sitemap.xml', 'utf8');
const { document: sx } = parseHTML(sm.replace(/<\?xml[^>]*\?>/, ''));
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (JSON.stringify(locs) !== JSON.stringify([SITE_URL + '/', SITE_URL + '/en/'])) E(`sitemap locs ${locs}`);
if ((sm.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length !== 2) E('sitemap lastmod');
if ((sm.match(/<url>/g) || []).length !== (sm.match(/<\/url>/g) || []).length) E('sitemap not well-formed');
if (!sm.includes('xmlns:xhtml')) E('sitemap xhtml namespace');
// robots
const rb = fs.readFileSync('dist/robots.txt', 'utf8');
if (!rb.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) E('robots.txt sitemap line');
if (/Disallow:\s*\/\s*$/m.test(rb)) E('robots.txt blocks the site');
['Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Applebot', 'GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'].forEach((b) => { if (!rb.includes(`User-agent: ${b}`)) E(`robots.txt missing ${b}`); });
// manifest + icons
const mf = JSON.parse(fs.readFileSync('dist/site.webmanifest', 'utf8'));
mf.icons.forEach((i) => { if (!fs.existsSync('dist' + i.src)) E(`manifest icon missing ${i.src}`); });
// llms.txt + 404
const ll = fs.readFileSync('dist/llms.txt', 'utf8'); FORBID.forEach((r) => { if (r.test(ll)) E(`llms.txt forbidden ${r}`); }); if (!ll.startsWith('# Rifqy Hazim')) E('llms.txt header');
if (!/noindex/.test(fs.readFileSync('dist/404.html', 'utf8'))) E('404.html should be noindex');
if (fs.readdirSync('dist/assets').some((f) => f.endsWith('.map'))) E('source maps in dist');

console.log(info.map((x) => 'ok   ' + x).join('\n'));
if (warns.length) console.log(warns.map((x) => 'warn ' + x).join('\n'));
if (errors.length) { console.log(errors.map((x) => 'ERR  ' + x).join('\n')); process.exit(1); }
console.log(`SEO validation passed (${SITE_URL})`);
