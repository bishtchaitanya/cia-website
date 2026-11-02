import { esc } from './util.js';
import { renderChromeTop, renderChromeBottom } from './chrome.js';
import { renderHero, renderMission, renderPillars, renderStats } from './intro.js';
import { renderOrg, renderDeck } from './team.js';
import { renderWork } from './work.js';
import { renderFooter } from './footer.js';
import { panelData } from '../lib/model.js';

/** JSON that is safe to inline inside <script type="application/json">. */
const inlineJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * @param {ReturnType<import('../lib/model.js').buildModel>} model
 * @param {{ brandFontCss?: string | null }} opts  relative href of the brand font CSS, if its files exist
 */
export function renderPage(model, opts = {}) {
  const { site } = model.content;
  const head = [
    `<title>${esc(site.teamName)}</title>`,
    `<meta name="description" content="${esc(site.description || site.tagline || '')}">`,
    `<meta property="og:title" content="${esc(site.teamName)}">`,
    `<meta property="og:description" content="${esc(site.tagline || '')}">`,
    opts.brandFontCss ? `<link rel="stylesheet" href="${esc(opts.brandFontCss)}">` : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  const body = [
    renderChromeTop(model),
    '<main id="main" tabindex="-1">',
    renderHero(model),
    renderMission(model),
    renderPillars(model),
    renderStats(model),
    renderOrg(model),
    renderDeck(model),
    renderWork(model),
    '</main>',
    renderFooter(model),
    renderChromeBottom(model, inlineJson(panelData(model))),
  ].join('\n');

  return { head, body };
}
