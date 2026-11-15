// First-visit "waiter" greeting: a small non-modal card that asks, like a cafe waiter would, whether the visitor
// would like some cafe music. Shown once per browser until answered (answer kept in localStorage):
//  - "Boleh, nyalakan" -> music starts (this click is the user gesture browsers need), soft volume, 2 s fade-in;
//  - "Nggak usah, makasih" -> remembered, never asked again;
//  - X / Esc -> "not now" for this session only.
// It never blocks scrolling, takes focus only if nothing else has it, and shares the bottom dock with the
// auto-update toast so the two stack instead of overlapping.
export const CHOICE_KEY = 'rh-music';
const SESSION_KEY = 'rh-music-greet';
const store = {
  get: (k, s = localStorage) => { try { return s.getItem(k); } catch { return null; } },
  set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch { /* private mode */ } },
};
export const musicChoice = () => store.get(CHOICE_KEY); // 'yes' | 'no' | null
export const saveMusicChoice = (v) => store.set(CHOICE_KEY, v);

/** Bottom dock shared by the greeting and the update toast (column, newest on top). */
export function dock() {
  let d = document.getElementById('dock');
  if (!d) { d = document.createElement('div'); d.id = 'dock'; d.className = 'dock'; document.body.append(d); }
  return d;
}

const CUP = `<svg class="wt-cup" viewBox="0 0 64 64" aria-hidden="true">
  <g class="wt-steam" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M24 14c-3 4 3 6 0 10"/><path d="M32 10c-3 4 3 6 0 10"/><path d="M40 14c-3 4 3 6 0 10"/></g>
  <path d="M14 30h34v8a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z" fill="var(--butter)" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M48 33h3a6 6 0 0 1 0 12h-4" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M8 56h48" stroke="var(--teal)" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M27 39l3 3 3-3 3 3" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function initWaiter({ t, onLang, onYes, onNo, reduced, isBlocked = () => false }) {
  let card = null, lastFocus = null;
  const answered = () => !!musicChoice();
  function label() {
    if (!card) return;
    card.querySelector('.wt-title').textContent = t('greet.title');
    card.querySelector('.wt-msg').textContent = t('greet.msg');
    card.querySelector('.wt-note').textContent = t('greet.note');
    card.querySelector('.wt-yes').textContent = t('greet.yes');
    card.querySelector('.wt-no').textContent = t('greet.no');
    card.querySelector('.wt-x').setAttribute('aria-label', t('greet.close'));
  }
  function close(how) {
    if (!card) return; const c = card; card = null;
    removeEventListener('keydown', onKey);
    if (how === 'yes') { saveMusicChoice('yes'); onYes(); }
    else if (how === 'no') { saveMusicChoice('no'); onNo?.(); }
    else store.set(SESSION_KEY, '1', sessionStorage);
    const refocus = c.contains(document.activeElement) && lastFocus && document.contains(lastFocus);
    const done = () => { c.remove(); if (refocus) lastFocus.focus({ preventScroll: true }); };
    if (reduced) done();
    else c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.97)' }], { duration: 220, easing: 'ease-in' }).onfinish = done;
  }
  function onKey(e) { if (e.key === 'Escape' && card && !isBlocked()) close('later'); }
  function show() {
    if (card || answered() || store.get(SESSION_KEY, sessionStorage)) return;
    if (isBlocked()) { setTimeout(show, 1500); return; } // project sheet / menu open: wait a moment
    card = document.createElement('div');
    card.className = 'waiter'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-labelledby', 'wtTitle'); card.setAttribute('aria-describedby', 'wtMsg');
    card.innerHTML = `<div class="wt-ico">${CUP}</div><div class="wt-body"><p class="wt-title serif" id="wtTitle"></p><p class="wt-msg" id="wtMsg"></p>`
      + '<p class="wt-note mono"></p><div class="wt-actions"><button type="button" class="btn btn-primary btn-small wt-yes"></button><button type="button" class="btn btn-small wt-no"></button></div></div>'
      + '<button type="button" class="wt-x"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    label();
    card.querySelector('.wt-yes').addEventListener('click', () => close('yes'));
    card.querySelector('.wt-no').addEventListener('click', () => close('no'));
    card.querySelector('.wt-x').addEventListener('click', () => close('later'));
    dock().append(card);
    addEventListener('keydown', onKey);
    if (!reduced) card.animate([{ opacity: 0, transform: 'translateY(24px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.25,1.15)' });
    // take focus only when the visitor isn't already somewhere (no focus theft mid-interaction)
    if (!document.activeElement || document.activeElement === document.body) { lastFocus = document.activeElement; card.querySelector('.wt-yes').focus({ preventScroll: true }); }
  }
  onLang(label);
  return {
    /** schedule the greeting (after the intro) */
    schedule(ms = 1600) { if (!answered() && !store.get(SESSION_KEY, sessionStorage)) setTimeout(show, ms); },
    /** the visitor answered some other way (music button): drop the card without asking */
    dismiss() { if (card) { const c = card; card = null; removeEventListener('keydown', onKey); c.remove(); } },
    get open() { return !!card; },
  };
}
