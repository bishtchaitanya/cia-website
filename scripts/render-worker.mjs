// Runs in a worker thread for each build: a fresh module cache every time, so
// watch-mode rebuilds always pick up edits to the content, templates and lib.
import { parentPort } from 'node:worker_threads';
import { renderSite } from './render-core.mjs';

renderSite().then(
  (result) => parentPort.postMessage(result),
  (error) => parentPort.postMessage({ ok: false, errors: [String(error?.stack || error)], warnings: [], notes: [] }),
);
