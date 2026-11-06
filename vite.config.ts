import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the build works on
// Vercel, Netlify and GitHub Pages (including project sub-paths).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
