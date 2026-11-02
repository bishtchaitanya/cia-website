// Small helpers shared by the build-time templates and the browser panel.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for HTML content and attribute values. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const pad2 = (n) => String(n).padStart(2, '0');

/** Escape `text`, then wrap each phrase from `phrases` in <mark>. */
export function highlight(text, phrases = []) {
  let html = esc(text);
  for (const phrase of phrases) {
    const safe = esc(phrase);
    if (safe && html.includes(safe)) html = html.replace(safe, `<mark>${safe}</mark>`);
  }
  return html;
}

/** 27 -> "27", 1200000 -> "1.2M", 5400 -> "5.4K" (auto-compact). */
export function compactNumber(n) {
  const abs = Math.abs(n);
  const fmt = (v, unit) => `${Number(v.toFixed(1)).toString()}${unit}`;
  if (abs >= 1e9) return fmt(n / 1e9, 'B');
  if (abs >= 1e6) return fmt(n / 1e6, 'M');
  if (abs >= 1e4) return fmt(n / 1e3, 'K');
  return Math.round(n).toLocaleString('en-US');
}

export const ICONS = {
  arrowDown:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 4v15m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowRight:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 12h15m0 0-6-6m6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowUp:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 20V5m0 0-6 6m6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mail:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/**
 * Lenis-style button: the fill wipes down on hover and the label rolls to a copy.
 * The copy is aria-hidden so screen readers hear the label once.
 */
export function button({ label, href, variant = 'primary', icon = 'arrowRight', attrs = '' }) {
  return `<a class="btn btn--${variant}" href="${esc(href)}"${attrs ? ' ' + attrs : ''}><span class="btn__label"><span class="btn__roll"><span>${esc(label)}</span><span aria-hidden="true">${esc(label)}</span></span></span><span class="btn__icon">${ICONS[icon] || ''}</span></a>`;
}

/** Sub-team chip: a colored dot next to the sub-team name (color is never the only cue). */
export function chip(team, tag = 'span') {
  return `<${tag} class="chip" data-color="${esc(team.color)}"><span class="dot" aria-hidden="true"></span>${esc(team.name)}</${tag}>`;
}
