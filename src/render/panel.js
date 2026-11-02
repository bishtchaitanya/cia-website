// Profile panel content. Runs in the browser, reading the JSON the build inlines.
import { esc, chip } from './util.js';
import { avatar } from './avatar.js';

function personRef(id, data) {
  const q = data.people[id];
  if (!q) return '';
  return `<li><button class="panel__person" type="button" data-person="${esc(id)}">${avatar(q, { size: 'xs' })}<span class="panel__person-text"><span class="panel__person-name">${esc(q.name)}</span><span class="panel__person-role">${esc(q.role)}</span></span></button></li>`;
}

function block(title, inner) {
  return inner ? `<section class="panel__block"><h3 class="panel__label">${esc(title)}</h3>${inner}</section>` : '';
}

/** @param {string} id @param {{ people: Record<string, any>, teams: Record<string, any>, projects: Record<string, any> }} data */
export function renderPanel(id, data) {
  const p = data.people[id];
  if (!p) return '';
  const team = data.teams[p.team || p.subTeam];
  const refs = (ids) => (ids && ids.length ? `<ul class="panel__people">${ids.map((x) => personRef(x, data)).join('')}</ul>` : '');
  const skills = p.skills?.length ? `<ul class="panel__skills">${p.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
  const projects = p.projects?.length
    ? `<ul class="panel__projects">${p.projects
        .map((pid) => data.projects[pid])
        .filter(Boolean)
        .map((pr) => `<li><span>${esc(pr.title)}</span><span class="panel__muted">${esc(pr.year)}</span></li>`)
        .join('')}</ul>`
    : '';
  const contact = [
    p.email ? `<li><span class="panel__muted">Email</span><a class="link" href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>` : '',
    p.chat ? `<li><span class="panel__muted">Chat</span><span>${esc(p.chat)}</span></li>` : '',
    p.location ? `<li><span class="panel__muted">Based in</span><span>${esc(p.location)}</span></li>` : '',
  ].join('');

  return `
    <header class="panel__header" data-color="${esc(p.color)}">
      ${avatar(p, { size: 'xl', className: 'panel__avatar' })}
      <div class="panel__titles">
        ${team ? chip(team) : ''}
        <h2 class="panel__name" id="panel-name" tabindex="-1">${esc(p.name)}</h2>
        <p class="panel__role">${esc(p.role)}</p>
      </div>
    </header>
    ${p.bio ? `<p class="panel__bio">${esc(p.bio)}</p>` : ''}
    ${block('Reports to', p.reportsTo ? refs([p.reportsTo]) : '')}
    ${block('Co-lead', refs(p.coLeads))}
    ${block(`Direct reports (${p.directReports?.length || 0})`, refs(p.directReports))}
    ${block('Skills', skills)}
    ${block('Fun fact', p.funFact ? `<p>${esc(p.funFact)}</p>` : '')}
    ${block('Projects', projects)}
    ${block('Contact', contact ? `<ul class="panel__contact">${contact}</ul>` : '')}`;
}
