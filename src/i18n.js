import { KEYWORD_COPY, PROPOSALS } from './keyword-copy.js';
// UI copy. Project, journey and contact facts live in content.js (verified, numbers verbatim).
export const dict = {
  id: {
    skip: 'Lompat ke konten',
    'nav.home': 'beranda', 'nav.me': 'aku', 'nav.now': 'sekarang', 'nav.work': 'kerja', 'nav.projects': 'proyek', 'nav.ask': 'tanya', 'nav.journey': 'jejak', 'nav.talk': 'ngobrol',
    'theme.auto': 'Tema: Auto (ikut sistem)', 'theme.light': 'Tema: Terang', 'theme.dark': 'Tema: Gelap', 'theme.label': 'Tema tampilan', 'theme.auto.s': 'Auto', 'theme.light.s': 'Terang', 'theme.dark.s': 'Gelap', 'lang.label': 'Bahasa',
    avail: 'Open buat kolaborasi',
    'title.a': 'Iklan', 'title.b': '& Agen',
    lead: 'Dua versi diri, satu meja kerja. Yang kiri urus iklan dan toko. Yang kanan nata agen AI biar kerjaannya rapi.',
    'v.ads': 'Versi Iklan', 'v.agent': 'Versi Agen',
    'stage.alt': 'Ilustrasi meja kerja Rifqy Hazim: versi iklan dengan dasbor iklan marketplace, dan versi agen dengan jaringan AI agent', 'scr.ads': 'DASBOR IKLAN', 'scr.agent': 'JARING AGEN',
    'bubble.ads': 'Lagi urus iklan', 'bubble.agent': 'Lagi nata agen',
    'scene.hint': 'geser kursor ke karakter · scroll buat masuk',
    'now.title': 'Lagi ngerjain apa', 'now.eyebrow': 'Lagi dikerjain',
    'now.s1': 'Lagi pegang iklan dan penjualan 3 toko marketplace bareng tim AI agent yang aku rancang sendiri, dengan ROAS dihitung dari invoice asli, bukan feeling.',
    'now.s2': 'Sambil itu, aku juga mulai buka jasa freelance sebagai AI Agent Orchestrator & Data Specialist.',
    'mark.a': 'Iklan & marketplace', 'mark.b': 'Operasi toko', 'mark.c': 'Tim AI agent',
    'now.updated': 'Diperbarui Nov 2026',
    'work.title': 'Cara aku kerja',
    'w1.h': 'Angka dari invoice, bukan feeling', 'w1.p': 'ROAS dihitung dari invoice asli, bukan cuma dari dashboard iklan. Tiap kampanye diukur pakai patokan balik modal yang jelas.',
    'w2.h': 'Data bolong dicatat, bukan ditebak', 'w2.p': 'Data yang kurang dicatat apa adanya, tidak ditimpa tebakan. Data yang sudah ditutup baru boleh diubah setelah aku setuju.',
    'w3.h': 'Agen jaga ritme, aku pegang keputusan', 'w3.p': 'Kerjaan harian diurus tim AI agent. Mereka bantu cek dan lapor, keputusan tetap di aku.',
    'w4.h': 'Tutup bulan jalan otomatis', 'w4.p': 'Rekap akhir bulan dijalankan routine otomatis. Aku tinggal cek hasilnya dan ambil keputusan.',
    'proj.title': 'Proyek pilihan',
    'tag.ads': 'Iklan & marketplace', 'tag.agent': 'Tim AI agent', 'tag.ecom': 'E-commerce', 'p.open': 'Lihat detail',
    'tools.title': 'Alat yang sering dipakai',
    't1': 'Shopee Iklan Produk', 't2': 'GMV Max Tokopedia/TikTok', 't3': 'Google Sheets', 't4': 'Orkestrasi AI agent', 't5': 'Routine otomatis', 't6': 'Full-stack web',
    'ask.title': 'Tanya aja soal',
    'a1': 'Scale-up toko marketplace', 'a2': 'ROAS riil dari invoice', 'a3': 'Patokan BEP ROAS', 'a4': 'Struktur kampanye per brand', 'a5': 'Tim AI agent buat operasional', 'a6': 'Routine tutup bulan otomatis',
    'jr.title': 'Perjalanan', 'jr.now': 'sekarang',
    'photo.title': 'Ini aku', 'photo.alt': 'Rifqy Hazim di meja kerja dengan laptop',
    'talk.title': 'Yuk ngobrol', 'talk.h': 'Punya brief, toko, atau ide agen? Kirim aja.', 'talk.loc': 'Berbasis di Jakarta, Indonesia',
    'cta.send': 'Kirim pesan', 'cta.cv': 'Unduh CV', 'cta.cvShort': 'CV', 'cta.cvAria': 'Unduh CV (PDF)', 'cta.soon': 'segera', 'cta.cvSoon': 'CV menyusul, segera', top: 'Ke atas', 'links.label': 'Profil',
    'cur.link': 'Buka', 'cur.card': 'Lihat', 'cur.cta': 'Kirim', 'menu.open': 'Buka menu', 'menu.close': 'Tutup menu', 'menu.label': 'Menu navigasi', 'swipe': 'geser ke bawah buat tutup',
    loading: 'Menyiapkan meja kerja',
    'kerja.scan': 'Memindai versi diri', back: 'Kembali', 'cta.next': 'Proyek berikutnya',
    'detail.ctx': 'Konteks', 'detail.did': 'Yang aku kerjain', 'detail.res': 'Hasil', 'detail.links': 'Tautan',
    'sound.on': 'Nyalakan musik kafe', 'sound.off': 'Matikan musik',
    'vol.label': 'Volume musik', 'vol.short': 'Volume musik',
    'greet.title': 'Selamat datang!', 'greet.msg': 'Mau ditemani musik kafe sambil lihat-lihat?', 'greet.yes': 'Boleh, nyalakan', 'greet.no': 'Nggak usah, makasih', 'greet.close': 'Tutup', 'greet.note': 'Mulainya pelan kok, volumenya bisa diatur di tombol musik.',
    'greetBack.title': 'Selamat datang lagi!', 'greetBack.msgYes': 'Musik kafenya mau dinyalakan lagi?', 'greetBack.msgNo': 'Mau coba ditemani musik kafe kali ini?', 'greetBack.yes': 'Nyalakan musik', 'greetBack.no': 'Tanpa musik', 'greetBack.noteYes': 'Pilihan terakhirmu: dengan musik.', 'greetBack.noteNo': 'Pilihan terakhirmu: tanpa musik.',
    'upd.msg': 'Ada versi baru situs ini', 'upd.btn': 'Muat ulang', 'upd.later': 'Nanti', 'upd.auto': 'Otomatis dimuat ulang sebentar lagi',
  },
  en: {
    skip: 'Skip to content',
    'nav.home': 'home', 'nav.me': 'me', 'nav.now': 'now', 'nav.work': 'work', 'nav.projects': 'projects', 'nav.ask': 'ask', 'nav.journey': 'journey', 'nav.talk': 'talk',
    'theme.auto': 'Theme: Auto (follows system)', 'theme.light': 'Theme: Light', 'theme.dark': 'Theme: Dark', 'theme.label': 'Display theme', 'theme.auto.s': 'Auto', 'theme.light.s': 'Light', 'theme.dark.s': 'Dark', 'lang.label': 'Language',
    avail: 'Open for collabs',
    'title.a': 'Ads', 'title.b': '& Agents',
    lead: 'Two versions of me, one desk. The left one runs ads and stores. The right one sets up AI agents so the work stays tidy.',
    'v.ads': 'Ads Version', 'v.agent': 'Agent Version',
    'stage.alt': "Illustration of Rifqy Hazim's desk: the ads version with a marketplace ads dashboard, and the agent version with an AI agent network", 'scr.ads': 'ADS DASHBOARD', 'scr.agent': 'AGENT NETWORK',
    'bubble.ads': 'Running ads', 'bubble.agent': 'Setting up agents',
    'scene.hint': 'hover a character · scroll to enter',
    'now.title': "What I'm working on", 'now.eyebrow': 'In progress',
    'now.s1': "Running ads and sales for 3 marketplace stores with an AI agent team I designed myself, with ROAS calculated from real invoices, not gut feeling.",
    'now.s2': "On the side, I've also started taking freelance work as an AI Agent Orchestrator & Data Specialist.",
    'mark.a': 'Ads & marketplace', 'mark.b': 'Store ops', 'mark.c': 'AI agent team',
    'now.updated': 'Updated Nov 2026',
    'work.title': 'How I work',
    'w1.h': 'Numbers from invoices, not vibes', 'w1.p': 'ROAS is calculated from real invoices, not just the ads dashboard. Every campaign is measured against a clear break-even target.',
    'w2.h': 'Log the gaps, never guess', 'w2.p': 'Missing data gets logged as is, never overwritten with guesses. Closed data only changes after I approve it.',
    'w3.h': 'Agents keep the rhythm, I make the calls', 'w3.p': 'An AI agent team handles the daily work. They check and report; the decisions stay with me.',
    'w4.h': 'Month-end close runs itself', 'w4.p': 'The month-end recap is run by an automated routine. I just check the results and make the calls.',
    'proj.title': 'Selected projects',
    'tag.ads': 'Ads & marketplace', 'tag.agent': 'AI agent team', 'tag.ecom': 'E-commerce', 'p.open': 'View details',
    'tools.title': 'Tools I use a lot',
    't1': 'Shopee Product Ads', 't2': 'Tokopedia/TikTok GMV Max', 't3': 'Google Sheets', 't4': 'AI agent orchestration', 't5': 'Automated routines', 't6': 'Full-stack web',
    'ask.title': 'Ask me about',
    'a1': 'Scaling marketplace stores', 'a2': 'Real ROAS from invoices', 'a3': 'BEP ROAS benchmarks', 'a4': 'Campaign structure per brand', 'a5': 'AI agent teams for operations', 'a6': 'Automated month-end close',
    'jr.title': 'Journey', 'jr.now': 'now',
    'photo.title': 'This is me', 'photo.alt': 'Rifqy Hazim at his desk with a laptop',
    'talk.title': "Let's talk", 'talk.h': 'Got a brief, a store, or an agent idea? Just send it.', 'talk.loc': 'Based in Jakarta, Indonesia',
    'cta.send': 'Send a message', 'cta.cv': 'Download CV', 'cta.cvShort': 'CV', 'cta.cvAria': 'Download CV (PDF)', 'cta.soon': 'soon', 'cta.cvSoon': 'CV coming soon', top: 'Back to top', 'links.label': 'Profiles',
    'cur.link': 'Open', 'cur.card': 'View', 'cur.cta': 'Send', 'menu.open': 'Open menu', 'menu.close': 'Close menu', 'menu.label': 'Navigation menu', 'swipe': 'swipe down to close',
    loading: 'Setting up the desk',
    'kerja.scan': 'Scanning both versions', back: 'Back', 'cta.next': 'Next project',
    'detail.ctx': 'Context', 'detail.did': 'What I did', 'detail.res': 'Results', 'detail.links': 'Links',
    'sound.on': 'Turn on cafe music', 'sound.off': 'Turn music off',
    'vol.label': 'Music volume', 'vol.short': 'Music volume',
    'greet.title': 'Welcome in!', 'greet.msg': 'Care for some cafe music while you look around?', 'greet.yes': 'Yes, please', 'greet.no': 'No, thanks', 'greet.close': 'Close', 'greet.note': 'It starts soft, and the music button has a volume control.',
    'greetBack.title': 'Welcome back!', 'greetBack.msgYes': 'Shall I put the cafe music on again?', 'greetBack.msgNo': 'Care to try some cafe music this time?', 'greetBack.yes': 'Play the music', 'greetBack.no': 'No music', 'greetBack.noteYes': 'Your last choice: with music.', 'greetBack.noteNo': 'Your last choice: without music.',
    'upd.msg': 'A new version of this site is ready', 'upd.btn': 'Reload', 'upd.later': 'Later', 'upd.auto': 'Reloads by itself in a moment',
  },
};

const listeners = new Set();
let current = 'id';
export const t = (k) => dict[current][k] ?? dict.id[k] ?? k;
export const lang = () => current;
export function onLang(fn) { listeners.add(fn); }
/** Apply UI copy for language l to any document (the live page, or the build-time prerender). */
export function applyDict(doc, l) {
  const tr = (k) => dict[l][k] ?? dict.id[k] ?? k;
  doc.documentElement.setAttribute('lang', l);
  doc.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.getAttribute('data-i18n')); });
  doc.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', tr(el.getAttribute('data-i18n-aria'))); });
  doc.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.setAttribute('alt', tr(el.getAttribute('data-i18n-alt'))); });
  doc.querySelectorAll('[data-lang-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-btn') === l)));
}
if (KEYWORD_COPY) for (const l of ['id', 'en']) Object.assign(dict[l], PROPOSALS.dict[l]); // keyword copy proposals (off by default)
// Each language has its own indexable URL: / (Indonesian) and /en/ (English).
export const langPath = (l) => (l === 'en' ? '/en/' : '/');
export const pathLang = (p) => (/^\/en(\/|$)/.test(p) ? 'en' : 'id');
// Page title + descriptions per language (used by the build-time prerender and on a live language switch).
export const SEO = {
  id: {
    title: 'Rifqy Hazim · Ads & E-commerce Specialist · AI Agent Orchestrator',
    desc: 'Rifqy Hazim, Ads & E-commerce Specialist · AI Agent Orchestrator. Iklan Shopee & GMV Max Tokopedia/TikTok di 3 toko bareng tim AI agent, ROAS dari invoice asli.',
    ogDesc: 'Ads & E-commerce Specialist di Jakarta: iklan & penjualan 3 toko marketplace di Shopee dan Tokopedia/TikTok bareng tim AI agent, dengan ROAS dihitung dari invoice asli.',
    ogAlt: 'Rifqy Hazim, Ads & E-commerce Specialist dan AI Agent Orchestrator: meja kerja 3D dengan dua versi diri, versi iklan dan versi agen AI',
    locale: 'id_ID',
  },
  en: {
    title: 'Rifqy Hazim · Ads & E-commerce Specialist · AI Agent Orchestrator',
    desc: 'Rifqy Hazim, Ads & E-commerce Specialist · AI Agent Orchestrator. Shopee Ads & Tokopedia/TikTok GMV Max for 3 stores with AI agents, ROAS from real invoices.',
    ogDesc: 'Ads & e-commerce specialist based in Jakarta: ads & sales for 3 marketplace stores on Shopee and Tokopedia/TikTok with an AI agent team, with ROAS calculated from real invoices.',
    ogAlt: 'Rifqy Hazim, Ads & E-commerce Specialist and AI Agent Orchestrator: a 3D desk with two versions of him, the ads version and the AI agent version',
    locale: 'en_US',
  },
};
export function setLang(l, { push = true } = {}) {
  current = l === 'en' ? 'en' : 'id';
  applyDict(document, current);
  // keep the address bar on the matching language URL (same page, no reload), and the head in sync
  if (push && pathLang(location.pathname) !== current) history.replaceState(history.state, '', langPath(current) + location.search + location.hash);
  document.querySelector('meta[name="description"]')?.setAttribute('content', SEO[current].desc);
  const alt = document.querySelector(`link[rel="alternate"][hreflang="${current}"]`);
  if (alt) document.querySelector('link[rel="canonical"]')?.setAttribute('href', alt.getAttribute('href'));
  document.title = SEO[current].title;
  listeners.forEach((fn) => fn(current));
}
export function initLang() {
  // the URL decides the language (so / and /en/ are stable for search engines); the old saved choice is cleared
  try { localStorage.removeItem('rh-lang'); } catch {}
  setLang(pathLang(location.pathname), { push: false });
}
