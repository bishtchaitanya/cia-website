import { esc, ICONS } from './util.js';

export const NAV_ITEMS = [
  { id: 'about', label: 'About', href: '#about' },
  { id: 'team', label: 'Team', href: '#team' },
  { id: 'work', label: 'Projects', href: '#work' },
  { id: 'contact', label: 'Contact', href: '#contact' },
];

export function renderChromeTop(model) {
  const { site } = model.content;
  const chars = Array.from(site.shortName);
  return `
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-bg" aria-hidden="true"></div>
<div class="progress" aria-hidden="true"><span class="progress__bar" data-progress></span></div>
<div class="loader" data-loader data-surface="brand" aria-hidden="true">
  <p class="loader__word">${chars.map((c) => `<span class="loader__mask"><span class="loader__char">${esc(c)}</span></span>`).join('')}</p>
  <p class="loader__caption">${esc(site.teamName)}</p>
</div>
<header class="site-header" data-header>
  <div class="site-header__pill">
    <a class="site-header__brand" href="#top" aria-label="${esc(site.teamName)}, back to top">
      <span class="brand-tile" aria-hidden="true">${esc(site.shortName)}</span>
      <span class="site-header__name" aria-hidden="true">${esc(site.teamName)}</span>
    </a>
    <nav class="pillnav" aria-label="Sections">
      <ul class="pillnav__list">
        ${NAV_ITEMS.map((n) => `<li><a class="pillnav__link" href="${n.href}" data-nav-link="${n.id}">${esc(n.label)}</a></li>`).join('')}
      </ul>
      <span class="pillnav__follower" aria-hidden="true" data-nav-follower></span>
    </nav>
  </div>
</header>`;
}

export function renderChromeBottom(model, panelJson) {
  return `
<dialog class="panel" data-panel data-surface="light" data-lenis-prevent aria-labelledby="panel-name">
  <div class="panel__sheet">
    <button class="panel__close" type="button" data-panel-close aria-label="Close profile">${ICONS.close}</button>
    <div class="panel__content" data-panel-content></div>
  </div>
</dialog>
<div class="cursor" aria-hidden="true" data-cursor></div>
<script type="application/json" id="panel-data">${panelJson}</script>`;
}
