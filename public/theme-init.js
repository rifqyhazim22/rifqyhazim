// Runs before first paint (external file so the Content-Security-Policy needs no inline script).
// 1) Theme: always starts on Auto (system preference). Manual picks are not stored.
// 2) 3D tier + layout classes, decided up front so the page never shifts when the (deferred) 3D arrives:
//    full = desktop (3D hero + the whole 3D world), lite = phones/tablets (2D desk + 2D kerja sprites, no three.js),
//    off = reduced motion / save-data / weak device.
(function () {
  var root = document.documentElement, mq = function (q) { return matchMedia(q).matches; };
  try { localStorage.removeItem('rh-theme'); } catch (e) {}
  root.dataset.theme = mq('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  root.dataset.themePref = 'auto';
  var conn = navigator.connection || {};
  var weak = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || (navigator.deviceMemory && navigator.deviceMemory < 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  var param = new URLSearchParams(location.search).get('tier');
  var tier = param || (mq('(prefers-reduced-motion: reduce)') ? 'off' : (mq('(max-width: 900px)') || mq('(pointer: coarse)')) ? (weak ? 'off' : 'lite') : 'full');
  // (no WebGL probe here: it would block first paint; main.js falls back to 2D if WebGL is missing)
  root.dataset.tier = tier;
  if (tier === 'full') {
    root.classList.add('three-pending', 's3d', 'has-world');
  } else {
    root.classList.add('no-webgl');
    if (tier === 'lite') root.classList.add('lite');
  }
})();
