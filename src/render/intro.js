import { esc, pad2, highlight, button, chip, compactNumber } from './util.js';

export function renderHero(model) {
  const { hero } = model.content;
  const lines = hero.headline
    .map(
      (line, i) =>
        `<span class="hero__mask${i % 2 ? ' hero__mask--end' : ''}"><span class="hero__line" data-hero-line>${esc(line)}</span></span>`,
    )
    .join(' ');
  const ctas = (hero.ctas || [])
    .map((c, i) => button({ label: c.label, href: c.href, variant: i === 0 ? 'primary' : 'ghost', icon: 'arrowDown' }))
    .join('');
  return `
<section class="hero" id="top" data-theme="light" data-nav="top" aria-labelledby="hero-title">
  <div class="container hero__inner">
    <p class="eyebrow hero__eyebrow" data-hero-reveal>${esc(hero.eyebrow)}</p>
    <h1 class="hero__title" id="hero-title" data-fit>${lines}</h1>
    <div class="hero__bottom">
      <p class="hero__cue" data-hero-reveal><span class="hero__cue-bar" aria-hidden="true"></span><span>Scroll<br>to explore</span></p>
      <p class="hero__intro" data-hero-reveal>${highlight(hero.intro, hero.highlights)}</p>
      <div class="hero__ctas" data-hero-reveal>${ctas}</div>
    </div>
  </div>
</section>`;
}

export function renderMission(model) {
  const { mission } = model.content;
  return `
<section class="mission" id="about" data-theme="dark" data-nav="about" aria-labelledby="mission-title">
  <div class="mission__sticky">
    <div class="container mission__inner">
      <h2 class="eyebrow mission__eyebrow" id="mission-title">${esc(mission.eyebrow || 'Our mission')}</h2>
      <p class="mission__statement">
        <span class="sr-only">${esc(mission.statement)}</span>
        <span class="mission__lit" aria-hidden="true" data-lit>${esc(mission.statement)}</span>
      </p>
    </div>
  </div>
</section>`;
}

export function renderPillars(model) {
  const { pillars = [], whatWeDo = {} } = model.content;
  const items = pillars
    .map((p, i) => {
      const teams = (p.teams || []).map((id) => model.teamsById.get(id)).filter(Boolean);
      const chips = teams.length
        ? `<ul class="chips" aria-label="Led by">${teams.map((t) => chip(t, 'li')).join('')}</ul>`
        : '';
      return `
      <li class="pillar" data-pillar>
        <span class="pillar__num" aria-hidden="true">${pad2(i + 1)}</span>
        <div class="pillar__body">
          <h3 class="pillar__title">${esc(p.title)}</h3>
          <p class="pillar__text">${esc(p.text)}</p>
          ${chips}
        </div>
      </li>`;
    })
    .join('');
  return `
<section class="pillars" id="what-we-do" data-theme="light" data-nav="about" aria-labelledby="pillars-title">
  <div class="container pillars__grid">
    <div class="pillars__aside">
      <div class="pillars__sticky">
        <p class="eyebrow">${esc(whatWeDo.eyebrow || 'What we do')}</p>
        <h2 class="display h2" id="pillars-title" data-reveal-lines>${esc(whatWeDo.title || 'What we do')}</h2>
        ${whatWeDo.lede ? `<p class="lede">${esc(whatWeDo.lede)}</p>` : ''}
      </div>
    </div>
    <ol class="pillars__list">${items}
    </ol>
  </div>
</section>`;
}

export function renderStats(model) {
  const stats = model.stats;
  const hasPlaceholder = stats.some((s) => s.placeholder);
  const tiles = stats
    .map((s) => {
      const text = compactNumber(s.value);
      const flag = s.placeholder ? '<span class="stat__flag" aria-hidden="true">*</span>' : '';
      const srFlag = s.placeholder ? ' (placeholder)' : '';
      return `
      <div class="stat">
        <dt class="stat__label">${esc(s.label)}</dt>
        <dd class="stat__value">
          <span class="sr-only">${esc(text)}${srFlag}</span>
          <span class="stat__visual" aria-hidden="true"><span class="stat__sizer">${esc(text)}</span><span class="stat__num" data-count="${s.value}">${esc(text)}</span>${flag}</span>
        </dd>
      </div>`;
    })
    .join('');
  return `
<section class="stats" id="at-a-glance" data-theme="brand" data-nav="about" aria-labelledby="stats-title">
  <div class="container">
    <h2 class="eyebrow stats__eyebrow" id="stats-title">At a glance</h2>
    <dl class="stats__grid">${tiles}
    </dl>
    ${hasPlaceholder ? '<p class="stats__note"><span aria-hidden="true">* </span>Placeholder figure.</p>' : ''}
  </div>
</section>`;
}
