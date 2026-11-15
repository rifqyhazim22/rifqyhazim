// HTTP security headers: one list used by vercel.json (production) and by `vite preview` (local testing).
// No third-party origins at all: the site loads only its own files (no trackers, no CDNs, no fonts from Google).
const csp = (prod) => [
  "default-src 'self'",
  "script-src 'self'",                 // no inline scripts (theme bootstrap is /theme-init.js); JSON-LD is data, not script
  "style-src 'self' 'unsafe-inline'",  // style="--var:…" attributes in the markup + GSAP animation styles
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(prod ? ['upgrade-insecure-requests'] : []), // off for http://127.0.0.1 preview
].join('; ');

export const securityHeaders = (prod = true) => ({
  'Content-Security-Policy': csp(prod),
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
});

/** vercel.json content (written at build so it never drifts from the list above). */
export const vercelConfig = () => ({
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  redirects: [{ source: '/en', destination: '/en/', permanent: true }],
  headers: [
    { source: '/(.*)', headers: Object.entries(securityHeaders(true)).map(([key, value]) => ({ key, value })) },
    { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    // auto-update check: always fresh
    { source: '/version.json', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] },
    // cafe music loops (renamed if they ever change)
    { source: '/audio/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    // desk photo and any other static images in /img (filenames change when the asset changes)
    { source: '/img/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    // unhashed icons and share images: 30 days (not immutable, so a replacement is picked up)
    { source: '/favicon.svg', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/favicon-16.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/favicon-32.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/favicon-32-dark.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/apple-touch-icon.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/icon-192.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/icon-512.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/icon-512-maskable.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/og-image.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    { source: '/og-image-en.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
  ],
});
