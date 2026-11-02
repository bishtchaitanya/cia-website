/*
 * Content checks with plain-English messages. Runs at build time and in `npm run check`.
 * Returns { errors, warnings }; any error stops the build.
 */
import { personId } from './model.js';
import { SUBTEAM_COLOR_KEYS, ART_TYPES } from './palette.js';

const AUTO_STATS = ['people', 'subTeams', 'teams', 'projects', 'leaders', 'managers'];

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function suggest(value, options) {
  let best = null;
  let bestD = Infinity;
  for (const o of options) {
    const d = distance(String(value), o);
    if (d < bestD) [best, bestD] = [o, d];
  }
  return best && bestD <= Math.max(3, Math.floor(String(value).length / 3)) ? ` Did you mean "${best}"?` : '';
}

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * @param {any} content
 * @param {{ fileExists?: (relPath: string) => boolean }} [opts]
 */
export function validate(content, opts = {}) {
  const errors = [];
  const warnings = [];
  const err = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);

  if (!content || typeof content !== 'object') {
    return { errors: ['The content file must export an object (export default { ... }).'], warnings };
  }

  // Site + hero
  if (!isNonEmptyString(content.site?.teamName)) err('site.teamName is missing.');
  if (!isNonEmptyString(content.site?.shortName)) err('site.shortName is missing (used in the loader and favicon).');
  const headline = content.hero?.headline;
  if (!Array.isArray(headline) || !headline.length || !headline.every(isNonEmptyString)) {
    err('hero.headline must be a list of one or more lines, for example ["Customer insights", "& analytics"].');
  }
  for (const phrase of content.hero?.highlights || []) {
    if (!String(content.hero?.intro || '').includes(phrase)) {
      warn(`hero.highlights: "${phrase}" does not appear in hero.intro, so it won't be highlighted.`);
    }
  }
  if (!isNonEmptyString(content.mission?.statement)) err('mission.statement is missing.');

  // People and sub-teams
  const ids = new Map();
  const teamIds = new Set();
  const teamLeadIds = [];
  let noBio = 0;
  const checkPerson = (p, where) => {
    if (!p || typeof p !== 'object') {
      err(`${where} is missing.`);
      return;
    }
    if (!isNonEmptyString(p.name)) err(`${where} has no name.`);
    if (!isNonEmptyString(p.role)) err(`${where} (${p.name || 'unnamed'}) has no role.`);
    if (!isNonEmptyString(p.bio)) noBio++;
    if (p.skills && !Array.isArray(p.skills)) err(`${p.name}: skills must be a list, like ['SQL', 'Python'].`);
    if (p.photo) {
      if (/^(\/|https?:)/.test(p.photo)) {
        err(`${p.name}: photo must be a relative path inside public/, like 'people/${personId(p)}.jpg'.`);
      } else if (opts.fileExists && !opts.fileExists(p.photo)) {
        err(`${p.name}: photo file public/${p.photo} was not found.`);
      }
    }
    if (isNonEmptyString(p.name)) {
      const id = personId(p);
      if (ids.has(id)) {
        err(`Two people share the id "${id}" (${ids.get(id)} and ${where}). Give one of them a unique id: '...'.`);
      } else {
        ids.set(id, where);
      }
    }
    if (p.reports !== undefined && !Array.isArray(p.reports)) {
      err(`${p.name || where}: reports must be a list of people.`);
    } else {
      (p.reports || []).forEach((r, i) => checkPerson(r, `${where}.reports[${i}]`));
    }
  };

  if (!Array.isArray(content.leaders) || !content.leaders.length) {
    err('leaders must list at least one leader.');
  } else {
    content.leaders.forEach((leader, li) => {
      const lw = `leaders[${li}]`;
      checkPerson(leader, lw);
      if (!Array.isArray(leader?.subTeams) || !leader.subTeams.length) {
        err(`${leader?.name || lw} has no subTeams.`);
        return;
      }
      leader.subTeams.forEach((st, si) => {
        const sw = `${lw}.subTeams[${si}]`;
        if (!isNonEmptyString(st?.id)) err(`${sw} has no id.`);
        else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(st.id)) err(`${sw}: id "${st.id}" should use lowercase letters, numbers and hyphens only.`);
        else if (teamIds.has(st.id) || st.id === 'leadership') err(`Sub-team id "${st.id}" is used twice (or is reserved).`);
        else teamIds.add(st.id);
        if (!isNonEmptyString(st?.name)) err(`${sw} has no name.`);
        if (!SUBTEAM_COLOR_KEYS.includes(st?.color)) {
          err(`${st?.name || sw}: color "${st?.color}" is not one of ${SUBTEAM_COLOR_KEYS.join(', ')}.${suggest(st?.color, SUBTEAM_COLOR_KEYS)}`);
        }
        checkPerson(st?.manager, `${sw}.manager`);
        if (!Array.isArray(st?.members)) err(`${st?.name || sw}: members must be a list.`);
        else {
          if (!st.members.length) warn(`${st.name} has no members yet.`);
          if (st.members.length > 6) warn(`${st.name} has ${st.members.length} members; the org chart is designed for up to 6 per manager.`);
          st.members.forEach((m, mi) => {
            checkPerson(m, `${sw}.members[${mi}]`);
            if (m?.reports?.length && isNonEmptyString(m.name)) teamLeadIds.push([personId(m), m.name]);
          });
        }
      });
    });
    // A member with reports leads a team, which uses that member's id. Teams and sub-teams share one id space.
    for (const [id, name] of teamLeadIds) {
      if (teamIds.has(id)) err(`${name} leads a team, but the id "${id}" is also a sub-team id. Give the person an id: '...' of their own.`);
      teamIds.add(id);
    }
    const usedColors = content.leaders.flatMap((l) => (l.subTeams || []).map((s) => s.color));
    const dupes = usedColors.filter((c, i) => usedColors.indexOf(c) !== i);
    if (dupes.length) warn(`More than one sub-team uses ${[...new Set(dupes)].join(', ')}; colors are easier to tell apart when unique.`);
  }

  if (noBio) warn(`${noBio} of ${ids.size} people have no bio yet. Their profiles show a name and role only.`);

  // Pillars
  (content.pillars || []).forEach((p, i) => {
    if (!isNonEmptyString(p.title)) err(`pillars[${i}] has no title.`);
    for (const t of p.teams || []) {
      if (!teamIds.has(t)) err(`Pillar "${p.title}": unknown sub-team "${t}".${suggest(t, [...teamIds])}`);
    }
  });

  // Stats
  (content.stats || []).forEach((s, i) => {
    if (!isNonEmptyString(s.label)) err(`stats[${i}] has no label.`);
    if (typeof s.value === 'string') {
      const key = s.value.replace(/^auto:/, '');
      if (!s.value.startsWith('auto:') || !AUTO_STATS.includes(key)) {
        err(`stats[${i}]: value "${s.value}" should be a number or one of ${AUTO_STATS.map((k) => 'auto:' + k).join(', ')}.`);
      }
    } else if (typeof s.value !== 'number' || !Number.isFinite(s.value)) {
      err(`stats[${i}] (${s.label}): value must be a number.`);
    }
  });

  // Projects
  const projectIds = new Set();
  if (!Array.isArray(content.projects)) err('projects must be a list.');
  else {
    content.projects.forEach((p, i) => {
      const pw = `Project "${p.title || `#${i + 1}`}"`;
      if (!isNonEmptyString(p.title)) err(`projects[${i}] has no title.`);
      const pid = p.id || (p.title ? personId({ name: p.title }) : '');
      if (pid && projectIds.has(pid)) err(`${pw}: another project has the same id "${pid}".`);
      projectIds.add(pid);
      if (p.subTeam && !teamIds.has(p.subTeam)) err(`${pw}: unknown subTeam "${p.subTeam}".${suggest(p.subTeam, [...teamIds])}`);
      if (!ART_TYPES.includes(p.art)) err(`${pw}: art "${p.art}" should be one of ${ART_TYPES.join(', ')}.${suggest(p.art, ART_TYPES)}`);
      for (const person of p.people || []) {
        if (!ids.has(person)) err(`${pw}: no person with id "${person}".${suggest(person, [...ids.keys()])}`);
      }
      if (p.link && !/^(https?:\/\/|\.\/|[a-z0-9])/i.test(p.link)) warn(`${pw}: link "${p.link}" looks unusual.`);
      if (!isNonEmptyString(p.summary)) warn(`${pw} has no summary.`);
    });
  }

  return { errors, warnings };
}
