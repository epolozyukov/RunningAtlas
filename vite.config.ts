import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content Security Policy for the built site. Only our own scripts run, and the page
// may only talk to Groq (trip planner) and Open-Meteo (weather). Injected at build
// time only: the dev server relies on inline scripts for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.groq.com https://archive-api.open-meteo.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  };
}

// `base: './'` keeps asset paths relative so the build works on
// Vercel, Netlify and GitHub Pages (including project sub-paths).
export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
