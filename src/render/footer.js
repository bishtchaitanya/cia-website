import { esc, button, ICONS } from './util.js';

export function renderFooter(model) {
  const { site, footer = {} } = model.content;
  const lines = (footer.headline || ["Let's talk"])
    .map((l, i) => `<span class="footer__mask${i % 2 ? ' footer__mask--end' : ''}"><span class="footer__line" data-line>${esc(l)}</span></span>`)
    .join(' ');
  const year = new Date().getFullYear();
  return `
<footer class="footer" id="contact" data-theme="brand" data-nav="contact" aria-labelledby="footer-title">
  <div class="container footer__inner">
    <div class="footer__top">
      <p class="eyebrow">${esc(footer.eyebrow || 'Get in touch')}</p>
      <h2 class="footer__title display" id="footer-title" data-reveal-masked>${lines}</h2>
    </div>
    <div class="footer__bottom">
      <p class="footer__text">${esc(footer.text || '')}</p>
      <div class="footer__actions">
        ${button({ label: 'Email the team', href: `mailto:${site.email}`, variant: 'light', icon: 'mail' })}
        <p class="footer__chat">Chat with us in <strong>${esc(site.chat)}</strong></p>
      </div>
    </div>
    <div class="footer__legal">
      <p>© ${year} ${esc(site.teamName)}${site.location ? ` · ${esc(site.location)}` : ''}</p>
      ${footer.notice ? `<p>${esc(footer.notice)}</p>` : ''}
      <a class="link footer__top-link" href="#top">Back to top <span aria-hidden="true">${ICONS.arrowUp}</span></a>
    </div>
  </div>
</footer>`;
}
