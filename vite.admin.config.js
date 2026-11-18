import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The admin page (admin/index.html + admin/src/), built into admin/dist/ by `npm run build:admin`,
// or by the admin server when admin/dist/ is missing or older than its sources. It is served only
// by scripts/admin-server.mjs, at /admin/, and never goes into the site's dist/.
// index.html marks ../favicon.ico and ../fonts/neue-plak.css with vite-ignore: they stay relative
// URLs that load from the site the server serves next to the admin.
export default defineConfig({
  root: fileURLToPath(new URL('./admin', import.meta.url)), // 'admin', from any working directory
  base: './',
  publicDir: false,
  plugins: [react()],
  // admin.css is served as written (no minifier rewriting its rules), as it was before the build step
  build: { outDir: 'dist', emptyOutDir: true, cssMinify: false },
});
