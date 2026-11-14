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
  ],
});
