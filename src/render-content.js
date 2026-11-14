// Puts the verified content (content.js) into the page and keeps it in sync with ID/EN.
// Structure is built once (so scroll reveals keep their state); only text is swapped on a language change.
import { FLAGS, CONTACT, PROJECTS, JOURNEY, DOWNLOADS } from './content.js';
import { lang, onLang, dict } from './i18n.js';

const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ul = (items) => `<ul class="d-list">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
const stats = (list) => list.map(([v, l]) => `<li${v.length > 8 ? ' class="wide"' : ''}><b class="mono">${esc(v)}</b><span>${esc(l)}</span></li>`).join('');
const COLORS = ['var(--teal)', 'var(--butter)', 'var(--coral)', 'var(--lilac)', 'var(--mint)', 'var(--sky)'];

export const project = (key, l = lang()) => ({ ...PROJECTS[key][l], year: PROJECTS[key].year, links: PROJECTS[key].links || [] });

/** Fill the detail sheet for one project. */
export function fillProject(key) {
  const p = project(key), $ = (id) => document.getElementById(id);
  $('dTitle').textContent = p.title; $('dLead').textContent = p.lead; $('dYear').textContent = p.year;
  $('dStats').innerHTML = stats(p.stats);
  $('dCtx').innerHTML = p.ctx.length > 1 ? ul(p.ctx) : esc(p.ctx[0]);
  $('dDid').innerHTML = ul(p.did); $('dRes').innerHTML = ul(p.res);
  $('dNote').textContent = p.resNote ? `· ${p.resNote}` : '';
  $('dLinksRow').hidden = !p.links.length;
  $('dLinks').innerHTML = p.links.map(([label, href]) => `<a class="d-link" href="${href}" target="_blank" rel="noopener noreferrer" data-cursor="link">${esc(label)} <span class="mono">${esc(href.replace(/^https?:\/\//, ''))}</span> ↗</a>`).join('');
}

const DL_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';
const SOON = { id: 'segera', en: 'soon' };
/** CV + Portfolio buttons. Built per language; a disabled "segera" chip until each flag is on. */
function renderDownloads(l, doc = document) {
  doc.querySelectorAll('[data-dl]').forEach((g) => {
    const where = g.getAttribute('data-dl'), compact = where === 'header';
    const cls = { header: 'dl-chip mono', contact: 'btn btn-ghost dl-btn', menu: 'btn dl-btn dl-on-teal' }[where];
    g.innerHTML = DOWNLOADS.map((d) => {
      const text = compact ? d.short[l] : d.label[l], full = (d.label[l].includes(text) ? '' : `${text}: `) + `${d.label[l]} (PDF)`; // accessible name contains the visible label
      if (FLAGS[d.flag]) {
        const file = d.href.split('/').pop();
        return `<a class="${cls}" href="${d.href}" download="${file}" data-cursor="link" aria-label="${full}" data-dl-key="${d.key}">${DL_ICON}<span>${text}</span></a>`;
      }
      return `<button type="button" class="${cls} is-soon" aria-disabled="true" aria-label="${full}, ${SOON[l]}" data-dl-key="${d.key}"><span>${text}</span><span class="soon mono">${SOON[l]}</span></button>`;
    }).join('');
  });
}

const ICONS = {
  linkedin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/></svg>',
  github: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
  upwork: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 6v6a4 4 0 0 0 8 0V9m0 0c1 4 3 7 6 7a3.5 3.5 0 0 0 0-7c-2.5 0-4 2-5 5l-2 7"/></svg>',
};

function renderText(l = lang(), doc = document) {
  renderDownloads(l, doc);
  doc.querySelectorAll('[data-pc]').forEach((el) => { const [k, f] = el.getAttribute('data-pc').split('.'); el.textContent = PROJECTS[k][l][f]; });
  doc.querySelectorAll('[data-project]').forEach((c, i) => { const k = 'abc'[i]; c.setAttribute('aria-label', `${PROJECTS[k][l].title}. ${l === 'id' ? 'Buka detail proyek' : 'Open project details'}`); });
  doc.querySelectorAll('[data-stats]').forEach((el) => { el.innerHTML = stats(PROJECTS[el.getAttribute('data-stats')][l].stats); el.setAttribute('aria-label', l === 'id' ? 'Angka kunci' : 'Key numbers'); });
  doc.querySelectorAll('#journey li').forEach((li, i) => {
    const j = JOURNEY[i];
    li.querySelector('.yr').textContent = j.yr[l];
    const r = li.querySelector('.jr-role'); if (r) r.textContent = j.role[l];
    const n = li.querySelector('.jr-now'); if (n) n.textContent = l === 'id' ? 'sekarang' : 'now';
  });
  const st = doc.getElementById('stickerText'); if (st) st.textContent = `${dict[l].avail} · ${dict[l].avail} ·`;
}

/** Build all content-driven markup into doc for language l. Runs at build time (prerendered HTML for / and /en/)
 *  and again in the browser (idempotent), so search engines and no-JS visitors get the full page. */
export function renderStatic(doc, l) {
  doc.querySelectorAll('[data-flag]').forEach((el) => { if (FLAGS[el.getAttribute('data-flag')]) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); });
  doc.querySelectorAll('[data-flag-off]').forEach((el) => { if (FLAGS[el.getAttribute('data-flag-off')]) el.setAttribute('hidden', ''); else el.removeAttribute('hidden'); });
  doc.getElementById('journey').innerHTML = JOURNEY.map((j, i) => `<li data-reveal${j.now ? ' class="is-now"' : ''}><span class="jdot" style="--c:${COLORS[i % COLORS.length]}"></span><span class="num mono">${String(i + 1).padStart(2, '0')}</span><span class="mono yr"></span>`
    + `<span class="role"><span class="jr-org">${esc(j.org)}</span>${j.now ? ' <span class="jr-now mono"></span>' : ''}${j.role ? '<span class="jr-role"></span>' : ''}</span></li>`).join('');
  doc.getElementById('profileLinks').innerHTML = CONTACT.links.filter((x) => !x.flag || FLAGS[x.flag])
    .map((x) => `<li><a class="profile-link" href="${x.href}" target="_blank" rel="me noopener noreferrer" data-cursor="link">${ICONS[x.key]}<span>${x.label}</span><span class="arr" aria-hidden="true">↗</span></a></li>`).join('');
  renderText(l, doc);
}

export function initContent() {
  renderStatic(document, lang());
  onLang((l) => renderText(l));
}
