import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import prerender from './plugins/prerender.js';

// `npm run watch` passes --watch. Polling is more reliable than file events on the
// NFS-mounted workspace. (Setting build.watch unconditionally would make every build watch.)
const watching = process.argv.includes('--watch') || process.argv.includes('-w');

export default defineConfig({
  // Relative asset paths by default, so the build works under any sub-path (e.g. the
  // code-server proxy). The GitHub Pages deploy sets BASE_PATH=/cia-website/: GitHub serves
  // 404.html at whatever URL was missing, and only absolute paths load from every depth.
  base: process.env.BASE_PATH || './',
  // React (JSX, Fast Refresh in dev), then the build-time render of the pages.
  plugins: [react(), prerender()],
  build: {
    sourcemap: true,
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        notFound: fileURLToPath(new URL('./404.html', import.meta.url)),
      },
    },
    ...(watching ? { watch: { buildDelay: 150, watcher: { usePolling: true, pollInterval: 400 } } } : {}),
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
