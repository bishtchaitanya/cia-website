import { esc, pad2, chip, ICONS } from './util.js';
import { avatar } from './avatar.js';

const people = (n) => `${n} ${n === 1 ? 'person' : 'people'}`;

/** `size`: how many people are below this one, shown when they lead anyone. */
function orgNode(p, level, size = 0) {
  const count = size ? `<span class="org-node__count">${people(size)}</span>` : '';
  return `<button class="org-node org-node--${level}" type="button" data-person="${esc(p.id)}" data-node="${esc(p.id)}" data-color="${esc(p.color)}" aria-haspopup="dialog">${avatar(p, { size: level === 'member' ? 'xs' : 'sm' })}<span class="org-node__text"><span class="org-node__name">${esc(p.name)}</span><span class="org-node__role">${esc(p.role)}</span>${count}</span></button>`;
}

export function renderOrg(model) {
  const { team = {} } = model.content;
  const legendTeams = [model.teamsById.get('leadership'), ...model.subTeams];
  const leaders = model.leaders
    .map((leader) => {
      const teams = leader.leads.map((id) => model.teamsById.get(id));
      const teamItems = teams
        .map((t) => {
          const manager = model.people.get(t.managerId);
          const members = t.memberIds
            .map((id) => `<li class="org__member">${orgNode(model.people.get(id), 'member', model.groupsById.get(id)?.size)}</li>`)
            .join('');
          return `
            <li class="org__team" data-team="${esc(t.id)}" data-color="${esc(t.color)}">
              ${orgNode(manager, 'manager', t.size)}
              <button class="org__toggle" type="button" aria-expanded="true" aria-controls="org-${esc(t.id)}" hidden><span class="sr-only">${esc(manager.name)}'s direct reports: </span><span>${t.memberIds.length} direct ${t.memberIds.length === 1 ? 'report' : 'reports'}</span>${ICONS.chevron}</button>
              <ul class="org__members" id="org-${esc(t.id)}" aria-label="Reports to ${esc(manager.name)}">${members}</ul>
            </li>`;
        })
        .join('');
      return `
        <li class="org__leader" style="--span: ${teams.length}">
          ${orgNode(leader, 'leader', model.leaders.length === 1 ? model.auto.people - 1 : 0)}
          <ul class="org__teams" aria-label="Reports to ${esc(leader.name)}">${teamItems}
          </ul>
        </li>`;
    })
    .join('');

  return `
<section class="team" id="team" data-theme="light" data-nav="team" aria-labelledby="team-title">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">${esc(team.eyebrow || 'Meet the team')}</p>
      <h2 class="display h2" id="team-title" data-reveal-lines>${esc(team.title || 'Who we are')}</h2>
      ${team.lede ? `<p class="lede">${esc(team.lede)}</p>` : ''}
    </div>
    <ul class="legend" aria-label="Organization colors">${legendTeams.map((t) => chip(t, 'li')).join('')}</ul>
    <div class="org" data-org style="--cols: ${model.subTeams.length}">
      <svg class="org__lines" aria-hidden="true" focusable="false" data-org-lines></svg>
      <ul class="org__leaders" aria-label="${model.leaders.length > 1 ? 'Co-leads' : 'Leadership'}">${leaders}
      </ul>
      ${model.leaders.length > 1 ? '<span class="org__colead" aria-hidden="true" data-colead-label>Co-leads</span>' : ''}
    </div>
  </div>
</section>`;
}

function managerCard(person, team) {
  return `
          <div class="deck-card" data-color="${esc(person.color)}">
            <button class="deck-card__btn" type="button" data-person="${esc(person.id)}" aria-haspopup="dialog">
              <span class="deck-card__portrait">${avatar(person, { size: 'xl' })}</span>
              <span class="deck-card__meta">
                <span class="deck-card__team">${esc(team.name)}</span>
                <span class="deck-card__name">${esc(person.name)}</span>
                <span class="deck-card__role">${esc(person.role)}</span>
              </span>
              <span class="deck-card__cta" aria-hidden="true">View profile ${ICONS.arrowRight}</span>
            </button>
          </div>`;
}

function leadershipCard(step, model) {
  const halves = step.cardPeople
    .map((id) => {
      const p = model.people.get(id);
      return `<button class="deck-card__btn deck-card__half" type="button" data-person="${esc(p.id)}" aria-haspopup="dialog"><span class="deck-card__portrait">${avatar(p, { size: 'lg' })}</span><span class="deck-card__meta"><span class="deck-card__name">${esc(p.name)}</span><span class="deck-card__role">${esc(p.role)}</span></span></button>`;
    })
    .join('');
  return `
          <div class="deck-card deck-card--split" data-color="brand">
            <span class="deck-card__team deck-card__team--top">${esc(step.name)}</span>
            <div class="deck-card__halves">${halves}</div>
          </div>`;
}

/** A roster row: `head` rows are managers, and the people beneath them follow. */
function miniCard(person, row) {
  const note = row.note ? `<span class="mini__note">${esc(row.note)}</span>` : '';
  return `<li${row.head ? ' class="is-head"' : ''}><button class="mini" type="button" data-person="${esc(person.id)}" aria-haspopup="dialog">${avatar(person, { size: 'sm' })}<span class="mini__text"><span class="mini__name">${esc(person.name)}</span><span class="mini__role">${esc(person.role)}</span>${note}</span></button></li>`;
}

/** Long rosters get a denser, two-column layout so a whole team fits on one screen. */
const DENSE_AFTER = 6;

export function renderDeck(model) {
  const { people: copy = {} } = model.content;
  const steps = model.deckSteps;
  const n = steps.length;
  const items = steps
    .map((step, i) => {
      const team = model.teamsById.get(step.id);
      const lead = model.people.get(step.cardPeople[0]);
      const card =
        step.isLeadership && step.cardPeople.length > 1
          ? leadershipCard(step, model)
          : managerCard(lead, step.isLeadership ? { name: step.name } : team);
      const rows = step.rows;
      const label = !step.isLeadership
        ? `Team · ${rows.length} people`
        : step.cardPeople.length > 1
          ? 'Co-leads'
          : `Reporting to ${lead.name}`;
      const dense = rows.length > DENSE_AFTER;
      return `
      <li class="deck-step" data-step="${i}" data-color="${esc(step.color)}" style="--i: ${i}; --row: ${i + 2}">
        <div class="deck-step__head">
          <h3 class="deck-step__title"><span class="deck-step__num" aria-hidden="true">${pad2(i + 1)}</span><span class="deck-step__name">${esc(step.name)}</span></h3>
          <p class="deck-step__mission">${esc(step.mission)}</p>
          <button class="deck-step__jump" type="button" data-deck-jump="${i}" hidden><span class="sr-only">Show ${esc(step.name)}</span></button>
        </div>
        <div class="deck-step__card">${card}
        </div>
        <div class="deck-step__people">
          <p class="deck-step__label">${esc(label)}</p>
          <ul class="deck-people${rows.some((r) => r.head) ? ' has-heads' : ''}" data-density="${dense ? 'dense' : 'roomy'}">${rows.map((r) => miniCard(model.people.get(r.id), r)).join('')}</ul>
        </div>
      </li>`;
    })
    .join('');

  return `
<section class="people" id="people" data-theme="dark" data-nav="team" aria-labelledby="people-title">
  <div class="container section-head">
    <p class="eyebrow">${esc(copy.eyebrow || 'Up close')}</p>
    <h2 class="display h2" id="people-title" data-reveal-lines>${esc(copy.title || 'Meet the sub-teams')}</h2>
    ${copy.lede ? `<p class="lede">${esc(copy.lede)}</p>` : ''}
  </div>
  <div class="deck" data-deck style="--steps: ${n}">
    <div class="deck__stage" data-deck-stage>
      <div class="container deck__frame">
        <ol class="deck__steps">${items}
        </ol>
        <p class="deck__counter" aria-hidden="true"><span data-deck-current>01</span> / ${pad2(n)}</p>
      </div>
    </div>
  </div>
</section>`;
}
