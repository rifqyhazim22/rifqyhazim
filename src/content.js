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
      title: 'Scale-up 3 toko marketplace',
      lead: 'Omzet riil rata-rata per bulan 3,20×, dengan ROAS riil 5,82 yang di atas titik balik modal setiap bulan.',
      stats: [['3,20×', 'omzet riil / bulan'], ['5,82', 'ROAS riil'], ['+86,8%', 'invoice / bulan']],
      ctx: ['Perusahaan material geotekstil & konstruksi. Sejak April 2026 aku pegang penuh iklan & penjualan 3 toko di Shopee (Iklan Produk) dan Tokopedia/TikTok (GMV Max).'],
      did: ['Struktur kampanye per brand & platform.', 'ROAS dihitung dari invoice asli, bukan cuma dashboard iklan.', 'Tiap kampanye diukur pakai patokan balik modal yang jelas.'],
      resNote: 'Mei–Okt 2026 dibanding Jan–Mar 2026',
      res: ['Omzet riil rata-rata per bulan 3,20×', 'Invoice per bulan +86,8%', 'ROAS riil 5,82, di atas titik balik modal setiap bulan (rentang 5,15–6,68)', '~7,8× rata-rata biaya iklan per bulan (basis Jan–Mar 2026)', 'Margin profit bersih sekitar 24%', 'Tingkat batal 7,70%'],
    },
    en: {
      title: 'Scaling 3 marketplace stores',
      lead: 'Average monthly real revenue 3.20×, with a real ROAS of 5.82 that stayed above break-even every month.',
      stats: [['3.20×', 'real revenue / month'], ['5.82', 'real ROAS'], ['+86.8%', 'invoices / month']],
      ctx: ['A geotextile & construction materials company. Since April 2026 I have fully owned ads & sales for 3 stores on Shopee (Product Ads) and Tokopedia/TikTok (GMV Max).'],
      did: ['Campaign structure per brand & platform.', 'ROAS calculated from real invoices, not just the ads dashboard.', 'Every campaign measured against a clear break-even target.'],
      resNote: 'May–Oct 2026 vs Jan–Mar 2026',
      res: ['Average monthly real revenue 3.20×', 'Invoices per month +86.8%', 'Real ROAS 5.82, above break-even every month (range 5.15–6.68)', '~7.8× average monthly ad spend (Jan–Mar 2026 baseline)', 'Net profit margin about 24%', 'Cancellation rate 7.70%'],
    },
  },
  b: {
    year: '2026',
    id: {
      title: 'Tim AI agent untuk 3 toko',
      lead: 'Operasional harian 3 toko dijalankan tim AI agent yang aku rancang, dengan 168 salah input data tertangkap.',
      stats: [['6', 'routine otomatis'], ['168', 'salah input tertangkap'], ['34 / 73', 'file Sheets / tab']],
      ctx: ['Operasional harian 3 toko dijalankan tim AI agent yang aku rancang & arahkan.'],
      did: ['Aturan main sistemnya: ROAS riil dari invoice.', 'Data bolong dicatat, tidak ditimpa tebakan.', 'Perubahan data yang sudah ditutup harus nunggu persetujuanku.', 'Agent bantu cek dan lapor, keputusan tetap di aku.'],
      res: ['6 routine otomatis: sinkron penjualan, cek kelengkapan data iklan, audit harian & mingguan, perbandingan metrik mingguan, tutup bulan', 'Mengelola 34 file Google Sheets / 73 tab', '168 salah input data tertangkap', 'Oktober 2026 jadi tutup bulan pertama lewat routine otomatis'],
    },
    en: {
      title: 'An AI agent team for 3 stores',
      lead: 'Daily operations for 3 stores run on an AI agent team I designed, with 168 data entry errors caught.',
      stats: [['6', 'automated routines'], ['168', 'entry errors caught'], ['34 / 73', 'Sheets files / tabs']],
      ctx: ['Daily operations for 3 stores are run by an AI agent team I designed & direct.'],
      did: ['The system rules: real ROAS from invoices.', 'Missing data gets logged, never overwritten with guesses.', 'Changes to closed data have to wait for my approval.', 'Agents check and report; the decisions stay with me.'],
      res: ['6 automated routines: sales sync, ad data completeness check, daily & weekly audits, weekly metric comparison, month-end close', 'Manages 34 Google Sheets files / 73 tabs', '168 data entry errors caught', 'October 2026 was the first month-end close done through the automated routine'],
    },
  },
  c: {
    year: '2026',
    // Demo and repo links removed: the repo is private and the Vercel project is paused.
    id: {
      title: 'MediMart, marketplace apotek',
      lead: 'Marketplace apotek online dengan peran admin, seller, dan buyer, plus chat realtime.',
      stats: [['3', 'peran'], ['Chat', 'realtime'], ['Q1', 'dibuat 2026']],
      ctx: ['Marketplace apotek online, dibuat Jan–Mar 2026.'],
      did: ['Peran admin, seller, dan buyer.', 'Katalog, keranjang, checkout, chat realtime, integrasi pembayaran.'],
      res: ['Katalog, keranjang, checkout, chat realtime, dan integrasi pembayaran.'],
    },
    en: {
      title: 'MediMart, pharmacy marketplace',
      lead: 'An online pharmacy marketplace with admin, seller, and buyer roles, plus realtime chat.',
      stats: [['3', 'roles'], ['Chat', 'realtime'], ['Q1', 'built 2026']],
      ctx: ['An online pharmacy marketplace, built Jan–Mar 2026.'],
      did: ['Admin, seller, and buyer roles.', 'Catalog, cart, checkout, realtime chat, payment integration.'],
      res: ['Catalog, cart, checkout, realtime chat, and payment integration.'],
    },
  },
};

if (KEYWORD_COPY) for (const [k, v] of Object.entries(PROPOSALS.projects)) for (const l of ['id', 'en']) Object.assign(PROJECTS[k][l], v[l]); // keyword copy proposals (off by default)

/** Org label for a language. Most are the same in ID/EN; a few are a `{ id, en }` pair. */
export function orgName(j, l = 'en') {
  return typeof j.org === 'string' ? j.org : j.org[l];
}

// Public FAQ (third person, so AI engines can quote it). Calvin's verified copy, with public rules applied: no BEP number, no bot names, no 5,15–6,68 range.
export const FAQ = [
  {
    q: { id: 'Siapa Rifqy?', en: 'Who is Rifqy?' },
    a: {
      id: 'Rifqy Hazim adalah Ads & E-commerce Specialist dan AI Agent Orchestrator. Ia menumbuhkan penjualan marketplace lewat iklan berbasis data, dan merancang serta mengarahkan tim AI agent untuk menjalankan operasinya. Sejak 16 Nov 2026 ia juga Ads Operation di The Circle Digital (TCD).',
      en: 'Rifqy Hazim is an Ads & E-commerce Specialist and AI Agent Orchestrator. He grows marketplace sales through data-led advertising, and designs and directs an AI-agent team to run those operations. Since 16 November 2026, he has also been in Ads Operation at The Circle Digital (TCD).',
    },
  },
  {
    q: { id: 'Apa itu ROAS riil dari invoice?', en: 'What is real ROAS from invoices?' },
    a: {
      id: 'ROAS riil dihitung dari omzet invoice dibagi biaya iklan, bukan dari angka di dashboard. Dashboard masih memasukkan pesanan yang kemudian batal, jadi angkanya bisa lebih tinggi daripada uang yang benar-benar masuk.',
      en: 'Real ROAS is invoice revenue divided by ad spend, not the dashboard figure. Dashboards still include orders that are later cancelled, so they can read higher than the revenue that actually comes in.',
    },
  },
  {
    q: { id: 'Gimana orkestrasi AI agent-nya?', en: 'How does the AI-agent orchestration work?' },
    a: {
      id: 'Ia merancang tim AI agent, menetapkan aturannya, dan mengarahkan kerja mereka: agen koordinator, agen toko yang hanya membaca data, dan agen asisten karier. Keputusan iklan tetap di tangannya. Aturan utamanya: ROAS riil dari invoice, target di atas titik balik modal, dan data yang sudah ditutup hanya diubah dengan persetujuan manusia.',
      en: 'He designs the AI-agent team, sets the rules, and directs their work: a coordinator agent, read-only store agents, and a career-assistant agent. Ad decisions stay with him. Core rules: real ROAS from invoices, staying above break-even, and closed-period data changed only with human approval.',
    },
  },
  {
    q: { id: 'Keahlian?', en: 'What is his expertise?' },
    a: {
      id: 'Iklan marketplace (Shopee Ads dan Tokopedia/TikTok GMV Max), analisis ROAS dan profit, pengelolaan multi-toko, orkestrasi AI agent, serta prompt dan context engineering.',
      en: 'Marketplace ads (Shopee Ads and Tokopedia/TikTok GMV Max), ROAS and profit analysis, multi-store management, AI-agent orchestration, and prompt and context engineering.',
    },
  },
  {
    q: { id: 'Hasil scale-up?', en: 'What were the scale-up results?' },
    a: {
      id: 'Pada Mei–Okt 2026, dibanding rata-rata Jan–Mar 2026, omzet riil per bulan 3,2×, invoice per bulan +86,8%, dan profit setelah iklan per bulan +107,6%. ROAS riil periode itu 5,82, di atas titik balik modal setiap bulan. Ini scale-up penjualan yang tetap menguntungkan, bukan klaim bahwa ROAS meningkat.',
      en: 'From May–Oct 2026, versus the Jan–Mar 2026 monthly average, real monthly revenue was 3.2×, invoices per month were up 86.8%, and profit after ads per month was up 107.6%. Real ROAS for the period was 5.82, above break-even every month. This is a profitable sales scale-up, not a claim that ROAS increased.',
    },
  },
];

// Journey, exactly as verified (order kept).
export const JOURNEY = [
  { yr: { id: '2008–2015', en: '2008–2015' }, org: 'SDIT Tunas Harapan Ilahi' },
  { yr: { id: '2015–2018', en: '2015–2018' }, org: 'MTs Husnul Khotimah' },
  { yr: { id: '2018–2021', en: '2018–2021' }, org: 'MA Husnul Khotimah' },
  { yr: { id: '2022–2025', en: '2022–2025' }, org: 'UIN Syarif Hidayatullah Jakarta, FDI' },
  { yr: { id: 'Sep 2024 – Apr 2026', en: 'Sep 2024 – Apr 2026' }, org: 'Tiga Pilar Utama Karya Sentosa', role: { id: 'Strategy & Networking / Vice Director / Marketing Executive', en: 'Strategy & Networking / Vice Director / Marketing Executive' } },
  { yr: { id: 'Apr – Mei 2025', en: 'Apr – May 2025' }, org: 'PT. Lautan Berlian Utama Motors (Mitsubishi)', role: { id: 'Intern Sales Consultant', en: 'Intern Sales Consultant' } },
  { yr: { id: 'Jul – Nov 2025', en: 'Jul – Nov 2025' }, org: 'The Social Linked', role: { id: 'AI Content Creator · Prompt & Context Engineer', en: 'AI Content Creator · Prompt & Context Engineer' } },
  { yr: { id: 'Jan – Mar 2026', en: 'Jan – Mar 2026' }, org: 'Hacktiv8 Full Stack Developer Bootcamp', role: { id: 'Sertifikat partisipasi', en: 'Participation certificate' } },
  { yr: { id: 'Apr 2026 – sekarang', en: 'Apr 2026 – present' }, org: 'Tiga Pilar Utama Karya Sentosa', role: { id: 'Ads & E-commerce Specialist · Vice Director (Freelance)', en: 'Ads & E-commerce Specialist · Vice Director (Freelance)' }, now: true },
  { yr: { id: 'Nov 2026 – sekarang', en: 'Nov 2026 – present' }, org: 'The Circle Digital (TCD)', role: { id: 'Ads Operation (Hybrid)', en: 'Ads Operation (Hybrid)' }, now: true },
];
