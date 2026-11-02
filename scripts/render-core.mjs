/*
 * Shared by the CLI (render-page.mjs) and the build worker (render-worker.mjs):
 * load the content file, validate it, and render the page HTML.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate } from '../src/lib/validate.js';
import { buildModel } from '../src/lib/model.js';
import { renderPage } from '../src/render/page.js';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPath = path.join(root, 'src', 'content', 'site-content.js');

/** The brand font stylesheet is linked only when at least one of its font files exists. */
function brandFontStatus() {
  const cssPath = path.join(root, 'public', 'fonts', 'neue-plak.css');
  if (!existsSync(cssPath)) {
    return { available: false, missing: [], message: 'Brand font: public/fonts/neue-plak.css not found; using fallback fonts.' };
  }
  const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const files = [...css.matchAll(/url\(\s*['"]?\.\/([^'")]+)['"]?\s*\)/g)].map((m) => m[1]);
  const present = files.filter((f) => existsSync(path.join(root, 'public', 'fonts', f)));
  const missing = files.filter((f) => !present.includes(f));
  if (!present.length) {
    return {
      available: false,
      missing,
      message: 'Brand font: Neue Plak files not added yet, so the fallbacks (Barlow Condensed, Jost) are used. See public/fonts/README.md.',
    };
  }
  return { available: true, missing, message: `Brand font: Neue Plak linked (${present.length} of ${files.length} files present).` };
}

/**
 * @returns {Promise<{ ok: boolean, errors: string[], warnings: string[], notes: string[],
 *   summary?: string, head?: string, body?: string }>}
 */
export async function renderSite({ checkOnly = false } = {}) {
  let content;
  try {
    // Cache-busting query: always read the file as it is on disk right now.
    ({ default: content } = await import(`${pathToFileURL(contentPath).href}?t=${Date.now()}`));
  } catch (error) {
    return {
      ok: false,
      errors: [`src/content/site-content.js could not be read. Check for a missing comma, quote or bracket.\n\n${error.stack || error}`],
      warnings: [],
      notes: [],
    };
  }

  const { errors, warnings } = validate(content, {
    fileExists: (rel) => existsSync(path.join(root, 'public', rel)),
  });
  if (errors.length) return { ok: false, errors, warnings, notes: [] };

  const font = brandFontStatus();
  const allWarnings = [...warnings, ...(font.available && font.missing.length ? [`Neue Plak files missing: ${font.missing.join(', ')}`] : [])];
  const model = buildModel(content);
  const summary = `${model.people.size} people, ${model.subTeams.length} organizations, ${model.deckSteps.length - 1} teams, ${model.projects.length} projects`;
  if (checkOnly) return { ok: true, errors: [], warnings: allWarnings, notes: [font.message], summary };

  const { head, body } = renderPage(model, { brandFontCss: font.available ? './fonts/neue-plak.css' : null });
  return { ok: true, errors: [], warnings: allWarnings, notes: [font.message], summary, head, body };
}

export function formatErrors(errors) {
  return `✖ ${errors.length} problem${errors.length > 1 ? 's' : ''} in src/content/site-content.js:\n${errors.map((e) => `  • ${e}`).join('\n')}`;
}
