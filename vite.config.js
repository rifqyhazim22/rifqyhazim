import { resolve } from 'node:path';
import sitePlugin from './vite-plugin-site.js';
import { securityHeaders } from './security-headers.js';

export default {
  appType: 'mpa', // real 404s (no SPA fallback): / and /en/ are separate prerendered pages
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  // `vite preview` mirrors the production security headers (minus upgrade-insecure-requests on http)
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, headers: securityHeaders(false) } /* also applied to HTML by vite-plugin-site.js */,
  build: {
    sourcemap: false, // no source maps in production
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html') } },
  },
  plugins: [sitePlugin()],
};
