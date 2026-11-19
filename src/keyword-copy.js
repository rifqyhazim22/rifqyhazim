// Keyword strategy (see KEYWORDS.md): VISIBLE copy proposals, OFF until Rifqy approves them.
// Flip KEYWORD_COPY to true and rebuild to apply every proposal below (ID + EN, headings and body copy).
// Facts are unchanged: these only name the platforms already stated in the verified project context
// (Shopee Iklan Produk / Product Ads, Tokopedia/TikTok GMV Max). No numbers are touched.
// now.s1 is not included: the approved "Lagi ngerjain apa" copy lives only in i18n.js.
export const KEYWORD_COPY = true;

export const PROPOSALS = {
  dict: {
    id: {
      'tools.title': 'Alat & platform yang sering dipakai',
    },
    en: {
      'tools.title': 'Tools & platforms I use a lot',
    },
  },
  projects: {
    a: { id: { title: 'Scale-up 3 toko marketplace' }, en: { title: 'Scaling 3 marketplace stores' } },
    b: { id: { title: 'Tim AI agent untuk 3 toko' }, en: { title: 'An AI agent team for 3 stores' } },
  },
};
