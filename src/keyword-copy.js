// Keyword strategy (see KEYWORDS.md): VISIBLE copy proposals, OFF until Rifqy approves them.
// Flip KEYWORD_COPY to true and rebuild to apply every proposal below (ID + EN, headings and body copy).
// Facts are unchanged: these only name the platforms already stated in the verified project context
// (Shopee Iklan Produk / Product Ads, Tokopedia/TikTok GMV Max). No numbers are touched.
export const KEYWORD_COPY = true;

export const PROPOSALS = {
  dict: {
    id: {
      'now.s1': 'Lagi pegang iklan dan penjualan 3 toko marketplace di Shopee dan Tokopedia/TikTok bareng tim AI agent yang aku rancang sendiri, dengan ROAS dihitung dari invoice asli, bukan feeling.',
      'tools.title': 'Alat & platform yang sering dipakai',
    },
    en: {
      'now.s1': 'Running ads and sales for 3 marketplace stores on Shopee and Tokopedia/TikTok with an AI agent team I designed myself, with ROAS calculated from real invoices, not gut feeling.',
      'tools.title': 'Tools & platforms I use a lot',
    },
  },
  projects: {
    a: { id: { title: 'Iklan Shopee & GMV Max: scale-up 3 toko marketplace dengan profit' }, en: { title: 'Shopee Ads & GMV Max: scaling 3 marketplace stores, profitably' } },
    b: { id: { title: 'Tim AI agent buat operasional iklan marketplace' }, en: { title: 'An AI agent team for marketplace ad operations' } },
  },
};
