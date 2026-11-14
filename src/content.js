// Verified public content (Nov 2026). Numbers are copied verbatim, never computed:
// ID uses comma decimals (ROAS 5,82), EN uses dot decimals (5.82).
import { KEYWORD_COPY, PROPOSALS } from './keyword-copy.js';
export const FLAGS = {
  freelanceLine: true, // confirmed Nov 2026
  upwork: true,        // confirmed Nov 2026
  cvDownload: true,         // public CV (no phone/TTL); the public PDF is at public/cv/CV-Rifqy-Hazim-2026.pdf
  portfolioDownload: true, // ON once the public PDF is at public/portofolio/Portofolio-Rifqy-Hazim-2026.pdf
};
// Download buttons (header, contact, mobile menu). Flag OFF = disabled chip with "segera".
export const DOWNLOADS = [
  { key: 'cv', flag: 'cvDownload', href: '/cv/CV-Rifqy-Hazim-2026.pdf', label: { id: 'Unduh CV', en: 'Download CV' }, short: { id: 'CV', en: 'CV' } },
  { key: 'porto', flag: 'portfolioDownload', href: '/portofolio/Portofolio-Rifqy-Hazim-2026.pdf', label: { id: 'Unduh Portofolio', en: 'Download Portfolio' }, short: { id: 'Porto', en: 'Porto' } },
];

export const CONTACT = {
  email: 'rifqyhazim22@gmail.com',
  links: [
    { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/rifqyhazim/' },
    { key: 'github', label: 'GitHub', href: 'https://github.com/rifqyhazim22' },
    { key: 'upwork', label: 'Upwork', href: 'https://www.upwork.com/freelancers/~01e5a18464e476bfa5', flag: 'upwork' },
  ],
};

export const PROJECTS = {
  a: {
    year: '2026',
    id: {
      title: 'Scale-up 3 toko marketplace dengan profit',
      lead: 'Omzet riil rata-rata per bulan 3,20×, dengan ROAS riil 5,82 yang di atas titik balik modal setiap bulan.',
      stats: [['3,20×', 'omzet riil / bulan'], ['5,82', 'ROAS riil'], ['+86,8%', 'invoice / bulan']],
      ctx: ['Perusahaan material geotekstil & konstruksi. Sejak April 2026 aku pegang penuh iklan & penjualan 3 toko di Shopee (Iklan Produk) dan Tokopedia/TikTok (GMV Max).'],
      did: ['Struktur kampanye per brand & platform.', 'ROAS dihitung dari invoice asli, bukan cuma dashboard iklan.', 'Tiap kampanye diukur pakai patokan balik modal yang jelas.'],
      resNote: 'Mei–Okt 2026 dibanding Jan–Mar 2026',
      res: ['Omzet riil rata-rata per bulan 3,20×', 'Invoice per bulan +86,8%', 'ROAS riil 5,82, di atas titik balik modal setiap bulan (rentang 5,15–6,68)', 'Margin profit bersih sekitar 24%', 'Tingkat batal 7,70%'],
    },
    en: {
      title: 'Scaling 3 marketplace stores, profitably',
      lead: 'Average monthly real revenue 3.20×, with a real ROAS of 5.82 that stayed above break-even every month.',
      stats: [['3.20×', 'real revenue / month'], ['5.82', 'real ROAS'], ['+86.8%', 'invoices / month']],
      ctx: ['A geotextile & construction materials company. Since April 2026 I have fully owned ads & sales for 3 stores on Shopee (Product Ads) and Tokopedia/TikTok (GMV Max).'],
      did: ['Campaign structure per brand & platform.', 'ROAS calculated from real invoices, not just the ads dashboard.', 'Every campaign measured against a clear break-even target.'],
      resNote: 'May–Oct 2026 vs Jan–Mar 2026',
      res: ['Average monthly real revenue 3.20×', 'Invoices per month +86.8%', 'Real ROAS 5.82, above break-even every month (range 5.15–6.68)', 'Net profit margin about 24%', 'Cancellation rate 7.70%'],
    },
  },
  b: {
    year: '2026',
    id: {
      title: 'Tim AI agent buat operasional iklan',
      lead: 'Operasional harian 3 toko dijalankan tim AI agent yang aku rancang. 168 salah input data tertangkap.',
      stats: [['6', 'routine otomatis'], ['168', 'salah input tertangkap'], ['34 / 73', 'file Sheets / tab']],
      ctx: ['Operasional harian 3 toko dijalankan tim AI agent yang aku rancang & arahkan.'],
      did: ['Aturan main sistemnya: ROAS riil dari invoice.', 'Data bolong dicatat, tidak ditimpa tebakan.', 'Perubahan data yang sudah ditutup harus nunggu persetujuanku.', 'Agent bantu cek dan lapor, keputusan tetap di aku.'],
      res: ['6 routine otomatis: sinkron penjualan, cek kelengkapan data iklan, audit harian & mingguan, perbandingan metrik mingguan, tutup bulan', 'Mengelola 34 file Google Sheets / 73 tab', '168 salah input data tertangkap', 'Oktober 2026 jadi tutup bulan pertama lewat routine otomatis'],
    },
    en: {
      title: 'An AI agent team for ad operations',
      lead: 'Daily operations for 3 stores run on an AI agent team I designed. 168 data entry errors caught.',
      stats: [['6', 'automated routines'], ['168', 'entry errors caught'], ['34 / 73', 'Sheets files / tabs']],
      ctx: ['Daily operations for 3 stores are run by an AI agent team I designed & direct.'],
      did: ['The system rules: real ROAS from invoices.', 'Missing data gets logged, never overwritten with guesses.', 'Changes to closed data have to wait for my approval.', 'Agents check and report; the decisions stay with me.'],
      res: ['6 automated routines: sales sync, ad data completeness check, daily & weekly audits, weekly metric comparison, month-end close', 'Manages 34 Google Sheets files / 73 tabs', '168 data entry errors caught', 'October 2026 was the first month-end close done through the automated routine'],
    },
  },
  c: {
    year: '2026',
    links: [['Demo', 'https://medimart-adv.vercel.app'], ['Repo', 'https://github.com/rifqyhazim22/medimart.adv']],
    id: {
      title: 'MediMart, e-commerce full-stack',
      lead: 'Marketplace apotek online dengan peran admin, seller, dan buyer, plus chat realtime.',
      stats: [['Admin · Seller · Buyer', 'tiga peran'], ['Live', 'demo + repo']],
      ctx: ['Marketplace apotek online, dibuat Jan–Mar 2026.'],
      did: ['Peran admin, seller, dan buyer.', 'Katalog, keranjang, checkout, chat realtime, integrasi pembayaran.'],
      res: ['Demo yang jalan dan repo publik, tautannya di bawah.'],
    },
    en: {
      title: 'MediMart, full-stack e-commerce',
      lead: 'An online pharmacy marketplace with admin, seller, and buyer roles, plus realtime chat.',
      stats: [['Admin · Seller · Buyer', 'three roles'], ['Live', 'demo + repo']],
      ctx: ['An online pharmacy marketplace, built Jan–Mar 2026.'],
      did: ['Admin, seller, and buyer roles.', 'Catalog, cart, checkout, realtime chat, payment integration.'],
      res: ['A working demo and a public repo, links below.'],
    },
  },
};

if (KEYWORD_COPY) for (const [k, v] of Object.entries(PROPOSALS.projects)) for (const l of ['id', 'en']) Object.assign(PROJECTS[k][l], v[l]); // keyword copy proposals (off by default)

// Journey, exactly as verified (order kept).
export const JOURNEY = [
  { yr: { id: '2008–2015', en: '2008–2015' }, org: 'SDIT Tunas Harapan Ilahi' },
  { yr: { id: '2015–2018', en: '2015–2018' }, org: 'MTs Husnul Khotimah' },
  { yr: { id: '2018–2021', en: '2018–2021' }, org: 'MA Husnul Khotimah' },
  { yr: { id: '2022–2025', en: '2022–2025' }, org: 'UIN Syarif Hidayatullah Jakarta, FDI' },
  { yr: { id: 'Sep 2024 – Apr 2026', en: 'Sep 2024 – Apr 2026' }, org: 'PT. Tiga Pilar Utama Karya Sentosa', role: { id: 'Strategy & Networking / Vice Director / Marketing Executive', en: 'Strategy & Networking / Vice Director / Marketing Executive' } },
  { yr: { id: 'Apr – Mei 2025', en: 'Apr – May 2025' }, org: 'PT. Lautan Berlian Utama Motors (Mitsubishi)', role: { id: 'Intern Sales Consultant', en: 'Intern Sales Consultant' } },
  { yr: { id: 'Jul – Nov 2025', en: 'Jul – Nov 2025' }, org: 'The Social Linked', role: { id: 'AI Content Creator · Prompt & Context Engineer', en: 'AI Content Creator · Prompt & Context Engineer' } },
  { yr: { id: 'Jan – Mar 2026', en: 'Jan – Mar 2026' }, org: 'Hacktiv8 Full Stack Developer Bootcamp', role: { id: 'Sertifikat partisipasi', en: 'Participation certificate' } },
  { yr: { id: 'Apr 2026 – sekarang', en: 'Apr 2026 – present' }, org: 'PT. Tiga Pilar Utama Karya Sentosa', role: { id: 'Ads & E-commerce Specialist · Vice Director (Freelance, Hybrid)', en: 'Ads & E-commerce Specialist · Vice Director (Freelance, Hybrid)' }, now: true },
];
