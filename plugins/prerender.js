/*
 * Prerender plugin: renders every section from src/content/site-content.js into
 * index.html at build time. Rendering runs in a worker thread, which has its own
 * module cache, so watch-mode rebuilds always see the latest files.
 */
import { Worker } from 'node:worker_threads';
import { readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerFile = path.join(root, 'scripts', 'render-worker.mjs');
const WATCH_DIRS = ['src/content', 'src/lib', 'src/render', 'public/fonts', 'public/people'];

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

function renderInWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile);
    worker.once('message', (result) => {
      resolve(result);
      worker.terminate();
    });
    worker.once('error', reject);
    worker.once('exit', (code) => code !== 0 && code !== 1 && reject(new Error(`Render worker exited with code ${code}`)));
  });
}

export default function prerender() {
  return {
    name: 'cia-prerender',
    buildStart() {
      for (const dir of WATCH_DIRS) {
        for (const file of listFiles(path.join(root, dir))) this.addWatchFile(file);
      }
    },
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        if (!html.includes('<!--app:head-->') || !html.includes('<!--app:body-->')) {
          throw new Error('index.html must keep the <!--app:head--> and <!--app:body--> placeholders.');
        }
        const result = await renderInWorker();
        if (!result.ok) {
          const list = result.errors.map((e) => `  • ${e}`).join('\n');
          throw new Error(`The page could not be built from src/content/site-content.js:\n${list}`);
        }
        for (const note of result.notes) console.log(`\n  ${note}`);
        for (const warning of result.warnings) console.warn(`  ⚠ ${warning}`);
        return html.replace('<!--app:head-->', result.head).replace('<!--app:body-->', result.body);
      },
    },
  };
}
