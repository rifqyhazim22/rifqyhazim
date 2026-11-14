import { t, onLang } from './i18n.js';

// Signature cursor: pointer:fine only, native on touch / reduced-motion / data-cursor="native".
export function initCursor() {
  const fine = matchMedia('(pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return null;

  const root = document.querySelector('.cursor');
  const dot = root.querySelector('.cursor-dot');
  const ring = root.querySelector('.cursor-frame');
  const label = root.querySelector('.cursor-label');
  document.documentElement.classList.add('has-cursor');

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const d = { x: mouse.x, y: mouse.y };
  const r = { x: mouse.x, y: mouse.y };
  let state = 'default';
  let external = null; // state forced by the 3D scene (hovering a character)

  const labelFor = (s) => ({ link: t('cur.link'), card: t('cur.card'), cta: t('cur.cta'), iklan: t('v.ads'), agen: t('v.agent') }[s] || '');

  function apply(s) {
    if (s === state) return;
    root.classList.remove('is-' + state);
    state = s;
    root.classList.add('is-' + s);
    const l = labelFor(s);
    label.textContent = l;
    root.classList.toggle('has-label', !!l);
  }
  onLang(() => { label.textContent = labelFor(state); });

  function resolve(target) {
    const el = target && target.closest && target.closest('[data-cursor], a, button');
    if (!el) return 'default';
    if (el.dataset.cursor === 'native') return 'native';
    if (el.dataset.cursor) return el.dataset.cursor;
    return 'link';
  }
  let hoverState = 'default';
  addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    hoverState = resolve(e.target);
    root.classList.toggle('is-hidden', hoverState === 'native');
    apply(external || (hoverState === 'native' ? 'default' : hoverState));
  }, { passive: true });
  // click pulse: brackets/carets snap in on press, spring back out on release
  addEventListener('pointerdown', () => root.classList.add('is-press'), { passive: true });
  addEventListener('pointerup', () => setTimeout(() => root.classList.remove('is-press'), 90), { passive: true });
  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => root.classList.remove('is-hidden'));

  function loop() {
    d.x += (mouse.x - d.x) * 0.6; d.y += (mouse.y - d.y) * 0.6;
    r.x += (mouse.x - r.x) * 0.42; r.y += (mouse.y - r.y) * 0.42; // shell stays close to the dot
    dot.style.transform = `translate3d(${d.x}px, ${d.y}px, 0)`;
    ring.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
    requestAnimationFrame(loop);
  }
  loop();

  return {
    setExternal(s) { external = s; apply(s || hoverState); },
  };
}
