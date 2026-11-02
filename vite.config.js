import { defineConfig } from 'vite';
import prerender from './plugins/prerender.js';

// `npm run watch` passes --watch. Polling is more reliable than file events on the
// NFS-mounted workspace. (Setting build.watch unconditionally would make every build watch.)
const watching = process.argv.includes('--watch') || process.argv.includes('-w');

export default defineConfig({
  // Relative asset paths, so the build works under any sub-path (e.g. the code-server proxy).
  base: './',
  plugins: [prerender()],
  build: {
    sourcemap: true,
    ...(watching ? { watch: { buildDelay: 150, watcher: { usePolling: true, pollInterval: 400 } } } : {}),
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
