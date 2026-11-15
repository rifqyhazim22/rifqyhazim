// Auto-update. Every build writes /version.json (never cached) and bakes the same id into this bundle.
// The page checks it every few minutes, when the tab comes back into view and when the network returns.
// When a new deploy is live:
//  - tab in the background            -> reloads quietly, so the visitor comes back to the new version;
//  - tab in view                      -> a small toast offers "Reload", and the page reloads by itself once the
//                                        visitor has been idle for a bit (or leaves the tab);
//  - project sheet / menu open, or cafe music playing -> never reloads on its own, the toast just waits.
// After the reload the visitor lands at the same scroll position, without the intro.
/* global __BUILD_ID__ */
const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const KEY = 'rh-restore';
const EVERY = 5 * 60 * 1000, IDLE = 45 * 1000;

/** Scroll position saved by an auto-update reload (only if fresh), consumed once. */
export function takeRestore() {
  try {
    const raw = sessionStorage.getItem(KEY); if (!raw) return null; sessionStorage.removeItem(KEY);
    const r = JSON.parse(raw); return Date.now() - r.t < 60000 && r.path === location.pathname ? r : null;
  } catch { return null; }
}

export function initUpdates({ t, onLang, isBusy = () => false, isPlaying = () => false }) {
  if (import.meta.env.DEV || CURRENT === 'dev') return;
  let pending = false, lastCheck = 0, toast = null, idleTimer = 0, checking = false;

  const reload = () => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ y: scrollY, path: location.pathname, t: Date.now() })); } catch { /* private mode */ }
    location.reload();
  };
  const canAuto = () => !isBusy() && !isPlaying();

  async function check() {
    if (pending || checking || !navigator.onLine) return;
    checking = true; lastCheck = Date.now();
    try {
      const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) { const { v } = await r.json(); if (v && v !== CURRENT) { pending = true; found(); } }
    } catch { /* offline or blocked: try again later */ }
    checking = false;
  }
  function found() {
    if (document.hidden && canAuto()) { reload(); return; }
    showToast(); armIdle();
  }
  function armIdle() {
    clearTimeout(idleTimer);
    if (!pending) return;
    idleTimer = setTimeout(() => { if (canAuto() && !document.hidden) reload(); else armIdle(); }, IDLE);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((e) => addEventListener(e, () => { if (pending) armIdle(); }, { passive: true }));

  function label() {
    if (!toast) return;
    toast.querySelector('.upd-msg').textContent = t('upd.msg');
    toast.querySelector('small').textContent = canAuto() ? t('upd.auto') : '';
    toast.querySelector('.upd-go').textContent = t('upd.btn');
    toast.querySelector('.upd-x').textContent = t('upd.later');
  }
  function showToast() {
    if (toast) return;
    toast = document.createElement('div'); toast.className = 'upd-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="upd-dot" aria-hidden="true"></span><p><span class="upd-msg"></span><small></small></p><button type="button" class="upd-go"></button><button type="button" class="upd-x"></button>';
    toast.querySelector('.upd-go').addEventListener('click', reload);
    toast.querySelector('.upd-x').addEventListener('click', () => { toast.remove(); toast = null; }); // still reloads on leaving the tab
    label(); document.body.append(toast);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) toast.animate([{ opacity: 0, transform: 'translate(-50%, 24px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  onLang(label);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (pending && canAuto()) reload(); return; }
    if (Date.now() - lastCheck > 60000) check();
  });
  addEventListener('online', check);
  addEventListener('focus', () => { if (Date.now() - lastCheck > 60000) check(); });
  setInterval(() => { if (!document.hidden) check(); }, EVERY);
  setTimeout(check, 20000);
}
