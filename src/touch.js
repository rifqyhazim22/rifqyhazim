// Touch-only interactions (loaded on coarse pointers, never under prefers-reduced-motion):
// colourful tap ripples, swipeable project cards with long-press peek, draggable hero characters (drop toward the
// middle = pick that version), a finger-spun contact sticker and throwable topic chips.
// Every drag is axis-locked: a gesture that starts vertical is left to the browser (touch-action: pan-y), so page
// scrolling is never blocked. A gesture that turned into a drag swallows the click that follows it.
import { gsap } from 'gsap';

const PALETTE = ['var(--teal)', 'var(--coral)', 'var(--butter)', 'var(--lilac)', 'var(--mint)', 'var(--sky)'];
const buzz = (ms = 8) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

let swallowUntil = 0;
addEventListener('click', (e) => { if (performance.now() < swallowUntil) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
const swallowClick = () => { swallowUntil = performance.now() + 450; };

/** Axis-locked touch gesture. Starts only when the first ~8px of travel are mostly horizontal (or `free` and the
 * element was held still for a beat). Reports offsets from the start and a release velocity (px/s). */
function gesture(el, { onStart, onMove, onEnd, onDown, onCancel }) {
  let id = null, x0 = 0, y0 = 0, live = false, samples = [];
  const reset = () => { id = null; live = false; samples = []; };
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || id !== null) return;
    if (onDown && onDown(e) === false) return;
    id = e.pointerId; x0 = e.clientX; y0 = e.clientY; live = false; samples = [{ x: x0, y: y0, t: e.timeStamp }];
  }, { passive: true });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (!live) {
      if (Math.hypot(dx, dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { onCancel?.(); reset(); return; } // vertical: it's a scroll
      live = true; try { el.setPointerCapture(id); } catch { /* fine */ }
      onStart?.(e);
    }
    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp }); if (samples.length > 6) samples.shift();
    onMove?.(dx, dy, e);
  }, { passive: true });
  const up = (e) => {
    if (e.pointerId !== id) return;
    const wasLive = live; const a = samples[0], b = samples[samples.length - 1]; const dt = Math.max(16, b.t - a.t);
    const v = { x: ((b.x - a.x) / dt) * 1000, y: ((b.y - a.y) / dt) * 1000 };
    const dx = e.clientX - x0, dy = e.clientY - y0; reset();
    if (wasLive) { swallowClick(); onEnd?.(dx, dy, v, e); } else onCancel?.(e);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.style.touchAction = 'pan-y';
}

export function initTouch({ root, onPick, getScene, tick }) {
  root.classList.add('touch-fx');
  const $$ = (s) => [...document.querySelectorAll(s)];

  // 1) Ripples in the site palette at every touch
  const layer = document.getElementById('tapLayer');
  let pi = 0;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const c = PALETTE[pi++ % PALETTE.length];
    for (let i = 0; i < 2; i++) {
      const r = document.createElement('span'); r.className = 'tap-ripple fx';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      r.style.setProperty('--rc', i ? PALETTE[(pi + 2) % PALETTE.length] : c); r.style.animationDelay = i * 90 + 'ms';
      layer.append(r); r.addEventListener('animationend', () => r.remove());
    }
  }, { passive: true });

  // 2 + 6) Project cards: sideways swipe with spring back; long-press peek
  let peekEl = null;
  const closePeek = () => {
    if (!peekEl) return; const p = peekEl; peekEl = null;
    gsap.to(p, { opacity: 0, duration: 0.2, onComplete: () => p.remove() });
    gsap.to(p.querySelector('.peek-card'), { scale: 0.85, y: 20, duration: 0.2, ease: 'power2.in' });
  };
  const openPeek = (card) => {
    buzz(14); tick?.(880);
    const p = document.createElement('div'); p.className = 'peek'; p.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('div'); inner.className = 'peek-card';
    const th = card.querySelector('.thumb').cloneNode(true);
    const meta = card.querySelector('.meta').cloneNode(true);
    const h = document.createElement('h3'); h.className = 'serif'; h.textContent = card.querySelector('h3').textContent;
    const lead = document.createElement('p'); lead.textContent = card.querySelector('p').textContent;
    inner.append(th, meta, h, lead); p.append(inner); document.body.append(p); peekEl = p;
    const r = card.getBoundingClientRect();
    gsap.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(inner, { scale: r.width / Math.min(innerWidth * 0.86, 420), y: r.top + r.height / 2 - innerHeight / 2 },
      { scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' });
  };
  $$('#proyek [data-project]').forEach((card) => {
    let timer = 0, peeking = false;
    card.addEventListener('contextmenu', (e) => e.preventDefault());
    const endPeek = () => { clearTimeout(timer); if (peeking) { peeking = false; swallowClick(); closePeek(); } };
    gesture(card, {
      onDown: (e) => { timer = setTimeout(() => { peeking = true; openPeek(card); try { card.setPointerCapture(e.pointerId); } catch { /* fine */ } }, 450); },
      onStart: () => { clearTimeout(timer); if (peeking) return; buzz(8); gsap.killTweensOf(card, 'x,rotation'); },
      onMove: (dx) => { if (peeking) return; const d = dx * 0.65; gsap.set(card, { x: d, rotation: d * 0.04 }); },
      onEnd: (dx, dy, v) => {
        if (peeking) { endPeek(); return; }
        const fling = gsap.utils.clamp(-90, 90, v.x * 0.06);
        gsap.timeline().to(card, { x: `+=${fling}`, duration: 0.15, ease: 'power2.out' })
          .to(card, { x: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
        if (Math.abs(dx) > 60) buzz(6);
      },
      onCancel: endPeek,
    });
    card.addEventListener('pointerup', endPeek); card.addEventListener('pointercancel', endPeek);
    // a finger resting still past the long-press must not scroll-cancel the peek
    card.addEventListener('touchmove', (e) => { if (peeking) e.preventDefault(); }, { passive: false });
  });

  // 3) Hero characters: 2D sprites (no-WebGL / before 3D) and the 3D pair on the canvas
  const pickIfCentred = (key, dx, width) => {
    const toward = key === 'iklan' ? dx : -dx; // ads sits left, agent right: "toward the middle" has opposite signs
    if (toward > width * 0.18) { buzz(12); onPick(key); return true; }
    return false;
  };
  [['#spriteAds', 'iklan'], ['#spriteAgent', 'agen']].forEach(([sel, key]) => {
    const el = document.querySelector(sel); if (!el) return;
    gesture(el, {
      onStart: () => { buzz(8); gsap.killTweensOf(el); el.classList.add('is-grab'); },
      onMove: (dx) => gsap.set(el, { x: dx, rotation: dx * 0.05, scale: 1.06 }),
      onEnd: (dx) => {
        el.classList.remove('is-grab');
        pickIfCentred(key, dx, el.parentElement.getBoundingClientRect().width);
        gsap.to(el, { x: 0, rotation: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      },
    });
  });
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    let grabbed = null;
    gesture(canvas, {
      onDown: (e) => { const s = getScene(); grabbed = s?.hitTest?.(e.clientX, e.clientY) || null; return !!grabbed; },
      onStart: () => buzz(8),
      onMove: (dx) => { if (grabbed) getScene()?.dragChar(grabbed, dx); },
      onEnd: (dx) => { const k = grabbed; grabbed = null; if (!k) return; getScene()?.releaseChar(k); pickIfCentred(k, dx, canvas.getBoundingClientRect().width); },
      onCancel: () => { if (grabbed) getScene()?.releaseChar(grabbed); grabbed = null; },
    });
  }

  // 4) Contact sticker: spin with the finger, then coast to a stop. Lives on an inner wrapper so the scroll-driven
  // `rotate` on .sticker keeps working; the two simply add up.
  const sticker = document.querySelector('.sticker');
  if (sticker) {
    const spin = document.createElement('div'); spin.className = 'sticker-spin';
    spin.append(...sticker.childNodes); sticker.append(spin);
    const st = { r: 0 }; let last = 0, vel = 0, lastT = 0, coast = null;
    const ang = (e) => { const b = sticker.getBoundingClientRect(); return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI; };
    gesture(sticker, {
      onDown: (e) => { coast?.kill(); last = ang(e); lastT = e.timeStamp; vel = 0; },
      onStart: () => buzz(6),
      onMove: (dx, dy, e) => {
        const a = ang(e); let d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360;
        st.r += d; last = a; const dt = Math.max(8, e.timeStamp - lastT); vel = vel * 0.6 + (d / dt) * 1000 * 0.4; lastT = e.timeStamp;
        gsap.set(spin, { rotation: st.r });
      },
      onEnd: () => {
        const v = gsap.utils.clamp(-1800, 1800, vel); // deg/s
        coast = gsap.to(st, { r: st.r + v * 0.6, duration: Math.min(2.4, 0.6 + Math.abs(v) / 900), ease: 'power3.out', onUpdate: () => gsap.set(spin, { rotation: st.r }) });
        if (Math.abs(v) > 600) buzz(10);
      },
    });
  }

  // 5) Topic chips: grab, throw, and they spring home like fridge magnets (a plain tap still follows the link)
  $$('#tanya .topic').forEach((chip) => {
    gesture(chip, {
      onStart: () => { buzz(6); gsap.killTweensOf(chip); chip.classList.add('is-grab'); },
      onMove: (dx, dy) => gsap.set(chip, { x: dx, y: dy, rotation: dx * 0.08, scale: 1.08 }),
      onEnd: (dx, dy, v) => {
        chip.classList.remove('is-grab');
        const tx = gsap.utils.clamp(-140, 140, dx + v.x * 0.12), ty = gsap.utils.clamp(-140, 140, dy + v.y * 0.12);
        gsap.timeline().to(chip, { x: tx, y: ty, rotation: tx * 0.12, duration: 0.25, ease: 'power2.out' })
          .to(chip, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
      },
    });
  });
}
