// "Waiter" greeting: a small non-modal card that asks, like a cafe waiter would, whether the visitor would like some
// cafe music.
//  - First visit: shown until answered (answer kept in localStorage).
//  - Returning visitor (answered before): a "welcome back" card once per session (sessionStorage) that asks again,
//    with their previous choice as the highlighted, focused button.
// Buttons:
//  - "Boleh, nyalakan" -> music starts (this click is the user gesture browsers need), soft volume, 2 s fade-in;
//  - "Nggak usah, makasih" -> remembered, never asked again;
//  - X / Esc -> "not now" for this session only.
// It never blocks scrolling, takes focus only if nothing else has it, and shares the bottom dock with the
// auto-update toast so the two stack instead of overlapping.
export const CHOICE_KEY = 'rh-music';
const SESSION_KEY = 'rh-music-greet';
const BACK_KEY = 'rh-music-back'; // welcome-back card already shown this session
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

export function initWaiter({ t, onLang, onYes, onNo, onLater, reduced, isBlocked = () => false }) {
  let card = null, lastFocus = null, pending = false;
  const answered = () => !!musicChoice();
  let mode = 'first'; // 'first' | 'back'
  const k = (key) => t(mode === 'back' ? key.replace('greet.', 'greetBack.') : key);
  function label() {
    if (!card) return;
    const prev = musicChoice();
    card.querySelector('.wt-title').textContent = k('greet.title');
    card.querySelector('.wt-msg').textContent = mode === 'back' ? t(prev === 'yes' ? 'greetBack.msgYes' : 'greetBack.msgNo') : t('greet.msg');
    card.querySelector('.wt-note').textContent = mode === 'back' ? t(prev === 'yes' ? 'greetBack.noteYes' : 'greetBack.noteNo') : t('greet.note');
    card.querySelector('.wt-yes').textContent = k('greet.yes');
    card.querySelector('.wt-no').textContent = k('greet.no');
    card.querySelector('.wt-x').setAttribute('aria-label', t('greet.close'));
  }
  function close(how) {
    if (!card) return; const c = card; card = null;
    removeEventListener('keydown', onKey);
    if (how === 'yes' || how === 'no') store.set(BACK_KEY, '1', sessionStorage); // just answered: no welcome-back this session
    if (how === 'yes') { saveMusicChoice('yes'); onYes(); }
    else if (how === 'no') { saveMusicChoice('no'); onNo?.(); }
    else if (mode === 'first') store.set(SESSION_KEY, '1', sessionStorage);
    else onLater?.();
    const refocus = c.contains(document.activeElement) && lastFocus && document.contains(lastFocus);
    const done = () => { c.remove(); if (refocus) lastFocus.focus({ preventScroll: true }); };
    if (reduced) done();
    else c.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(18px) scale(.97)', filter: 'blur(2px)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).onfinish = done;
  }
  function onKey(e) { if (e.key === 'Escape' && card && !isBlocked()) close('later'); }
  // first visit: until answered (or "later" this session); returning visitor: the welcome-back card once per session
  const due = () => (answered() ? (store.get(BACK_KEY, sessionStorage) ? null : 'back') : (store.get(SESSION_KEY, sessionStorage) ? null : 'first'));
  function show() {
    if (card) return; const m = due(); if (!m) return; mode = m;
    if (isBlocked()) { pending = true; setTimeout(() => { pending = false; show(); }, 1500); return; } // project sheet / menu open: wait a moment
    if (mode === 'back') store.set(BACK_KEY, '1', sessionStorage); // at most once per session, answered or not
    card = document.createElement('div');
    card.className = 'waiter' + (mode === 'back' ? ' is-back' : ''); card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-labelledby', 'wtTitle'); card.setAttribute('aria-describedby', 'wtMsg');
    // previous choice first and highlighted (welcome back); first visit: "yes" is the highlighted one
    const prevNo = mode === 'back' && musicChoice() === 'no';
    const yes = `<button type="button" class="btn btn-small wt-yes${prevNo ? '' : ' is-default'}"></button>`, no = `<button type="button" class="btn btn-small wt-no${prevNo ? ' is-default' : ''}"></button>`;
    card.innerHTML = `<div class="wt-head"><div class="wt-ico">${CUP}</div><div class="wt-text"><p class="wt-title serif" id="wtTitle"></p><p class="wt-msg" id="wtMsg"></p></div></div>`
      + `<p class="wt-note mono"></p><div class="wt-actions">${prevNo ? no + yes : yes + no}</div>`
      + '<button type="button" class="wt-x"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    label();
    card.querySelector('.wt-yes').addEventListener('click', () => close('yes'));
    card.querySelector('.wt-no').addEventListener('click', () => close('no'));
    card.querySelector('.wt-x').addEventListener('click', () => close('later'));
    dock().append(card);
    addEventListener('keydown', onKey);
    if (!reduced) {
      card.animate([{ opacity: 0, transform: 'translateY(28px) scale(.96)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1.08)' });
      card.querySelectorAll('.wt-ico, .wt-text, .wt-note, .wt-actions').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 120 + i * 60, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }));
    }
    // take focus only when the visitor isn't already somewhere (no focus theft mid-interaction)
    if (!document.activeElement || document.activeElement === document.body) { lastFocus = document.activeElement; card.querySelector('.wt-actions .is-default').focus({ preventScroll: true }); }
  }
  onLang(label);
  return {
    /** schedule the greeting (after the intro) */
    schedule(ms = 1600) { if (due()) { pending = true; setTimeout(() => { pending = false; show(); }, ms); } },
    /** a card is scheduled or on screen (the returning "yes" music auto-start waits for it) */
    get busy() { return pending || !!card || !!due(); },
    /** the visitor answered some other way (music button): drop the card without asking */
    dismiss() { store.set(BACK_KEY, '1', sessionStorage); if (card) { const c = card; card = null; removeEventListener('keydown', onKey); c.remove(); } },
    get open() { return !!card; },
  };
}
