// Runs before first paint (external file so the Content-Security-Policy needs no inline script).
// 1) Theme: always starts on Auto (system preference). Manual picks are not stored.
// 2) 3D tier + layout classes, decided up front so the page never shifts when the (deferred) 3D arrives:
//    full = desktop/laptop incl. touchscreen laptops (3D hero + the whole 3D world),
//    tablet = iPad and large tablets (the same desktop world, touch controls, pixel ratio capped at 1.5, fewer floaters),
//    lite = phones / small tablets (2D desk first, then a lighter three.js hero + section stations, loaded after first paint),
//    off = reduced motion / save-data / weak device (2D only).
(function () {
  var root = document.documentElement, mq = function (q) { return matchMedia(q).matches; };
  try { localStorage.removeItem('rh-theme'); } catch (e) {}
  root.dataset.theme = mq('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  root.dataset.themePref = 'auto';
  var conn = navigator.connection || {};
  var weak = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || (navigator.deviceMemory && navigator.deviceMemory < 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  var param = new URLSearchParams(location.search).get('tier');
  // Tier from screen size + input + capability (touch alone never decides it):
  //  - any fine pointer or hover (mouse/trackpad, incl. touchscreen laptops) on a window wider than 900 px -> full desktop
  //  - touch-only, short screen side >= 768 px, and wider than 900 px or landscape (iPad and up) -> tablet
  //  - everything else (phones, narrow windows) -> lite; weak devices -> off
  var desk = mq('(any-pointer: fine)') || mq('(any-hover: hover)');
  var bigTouch = Math.min(screen.width, screen.height) >= 768 && (innerWidth > 900 || mq('(orientation: landscape)'));
  var tier = param || (mq('(prefers-reduced-motion: reduce)') ? 'off'
    : desk && innerWidth > 900 ? 'full'
    : !desk && bigTouch ? (weak ? 'off' : 'tablet')
    : weak ? 'off' : 'lite');
  // (no WebGL probe here: it would block first paint; main.js falls back to 2D if WebGL is missing)
  root.dataset.tier = tier;
  if (tier === 'tablet') root.classList.add('tablet');
  if (tier === 'off') root.classList.add('no-webgl');
  else root.classList.add('three-pending', 's3d'); // 2D desk shows until the 3D is ready; 3D windows at the top of the sections
  if (tier === 'lite') root.classList.add('lite');
  if (tier === 'full' || tier === 'tablet') root.classList.add('has-world'); // tablet = the desktop world, touch controls
})();
