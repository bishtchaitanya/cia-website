import { esc, pad2, chip, ICONS } from './util.js';
import { avatar } from './avatar.js';
import { projectArt } from './art.js';

function projectCard(project, model) {
  const team = model.teamsById.get(project.subTeam);
  const titleId = `project-${project.id}`;
  const title = project.link
    ? `<a class="project__link" href="${esc(project.link)}">${esc(project.title)}<span class="project__arrow" aria-hidden="true">${ICONS.arrowRight}</span></a>`
    : esc(project.title);
  const people = project.people
    .map((id) => model.people.get(id))
    .filter(Boolean)
    .map(
      (p) =>
        `<li><button class="project__person" type="button" data-person="${esc(p.id)}" aria-haspopup="dialog" aria-label="${esc(p.name)}, ${esc(p.role)}">${avatar(p, { size: 'xs' })}</button></li>`,
    )
    .join('');
  const methods = project.methods.map((m) => `<li>${esc(m)}</li>`).join('');
  const impact = project.impact?.value
    ? `<p class="project__impact"><strong>${esc(project.impact.value)}</strong> <span>${esc(project.impact.label)}</span></p>`
    : '';
  return `
        <li class="project" data-project data-color="${esc(project.color)}">
          <article class="project__card${project.link ? ' project__card--link' : ''}" aria-labelledby="${esc(titleId)}">
            <div class="project__cover">${projectArt(project)}</div>
            <div class="project__body">
              <div class="project__meta">${team ? chip(team) : ''}<span class="project__year">${esc(project.year)}</span></div>
              <h3 class="project__title" id="${esc(titleId)}">${title}</h3>
              <p class="project__summary">${esc(project.summary)}</p>
              ${impact}
              <div class="project__foot">
                <ul class="project__methods" aria-label="Methods">${methods}</ul>
                ${people ? `<ul class="project__people" aria-label="People">${people}</ul>` : ''}
              </div>
            </div>
          </article>
        </li>`;
}

export function renderWork(model) {
  const { work = {} } = model.content;
  const n = model.projects.length;
  return `
<section class="work" id="work" data-theme="light" data-nav="work" aria-labelledby="work-title">
  <div class="work__stage" data-work-stage>
    <div class="container work__head">
      <div class="work__intro">
        <p class="eyebrow">${esc(work.eyebrow || 'Selected work')}</p>
        <h2 class="display h2" id="work-title" data-reveal-lines>${esc(work.title || 'Projects')}</h2>
        ${work.lede ? `<p class="lede">${esc(work.lede)}</p>` : ''}
      </div>
      <div class="work__progress" aria-hidden="true">
        <span class="work__count"><span data-work-current>01</span> / ${pad2(n)}</span>
        <span class="work__bar"><span data-work-bar></span></span>
      </div>
    </div>
    <div class="work__viewport" data-work-viewport>
      <ul class="work__track" data-work-track>${model.projects.map((p) => projectCard(p, model)).join('')}
      </ul>
    </div>
  </div>
</section>`;
}
