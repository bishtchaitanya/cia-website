/*
 * Turns the nested content file into the flat model every section renders from.
 * Pure functions only: runs in Node at build time.
 *
 * Vocabulary:
 *   leader    the top of the org (a Managing Director, or co-leads)
 *   sub-team  an organization under a leader, run by a manager (a Director)
 *   team      what a member leads once they have `reports`; it gets a deck step
 *   roster    the people shown beside a deck step, grouped under each manager
 */

/**
 * @typedef {{ name: string, role: string, bio?: string, skills?: string[], funFact?: string,
 *   email?: string, chat?: string, location?: string, photo?: string, id?: string,
 *   team?: string, teamMission?: string, reports?: PersonInput[] }} PersonInput
 * @typedef {{ id: string, name: string, color: string, mission?: string,
 *   manager: PersonInput, members: PersonInput[] }} SubTeamInput
 * @typedef {PersonInput & { subTeams: SubTeamInput[] }} LeaderInput
 * @typedef {Record<string, any> & { leaders: LeaderInput[], projects: any[] }} SiteContent
 */

/** "Tomás O'Neil" -> "tomas-oneil" */
export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "Ryan O'Connell" -> "RO" */
export function initialsOf(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export const personId = (p) => p.id || slugify(p.name);

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Build the derived model. Assumes validate() found no errors. */
export function buildModel(content) {
  /** @type {Map<string, any>} */
  const people = new Map();
  const subTeams = [];
  const groups = [];
  const leaders = [];
  const edges = [];

  const addPerson = (input, extra) => {
    const id = personId(input);
    const person = {
      id,
      name: input.name,
      role: input.role,
      bio: input.bio || '',
      skills: input.skills || [],
      funFact: input.funFact || '',
      email: input.email || '',
      chat: input.chat || '',
      location: input.location || '',
      photo: input.photo || '',
      initials: initialsOf(input.name),
      directReports: [],
      projects: [],
      coLeads: [],
      leads: [],
      depth: 0,
      team: null,
      ...extra,
    };
    people.set(id, person);
    return person;
  };

  /** Everyone below `person`, in reading order. */
  const below = (person) => person.directReports.flatMap((id) => [id, ...below(people.get(id))]);

  /** Adds `inputs` (and their own reports, recursively) under `parent`. */
  const addReports = (parent, inputs, context) => {
    for (const input of inputs || []) {
      const person = addPerson(input, {
        level: 'member',
        subTeam: context.subTeam,
        color: context.color,
        reportsTo: parent.id,
        depth: parent.depth + 1,
        team: context.team,
      });
      parent.directReports.push(person.id);
      edges.push({ from: parent.id, to: person.id, kind: 'member' });
      addReports(person, input.reports, context);
    }
  };

  /**
   * The people beside a deck step: people with no reports of their own come first,
   * then each manager followed by everyone beneath them.
   */
  const rosterFor = (head) => {
    const leaves = [];
    const clusters = [];
    for (const id of head.directReports) {
      const person = people.get(id);
      if (person.directReports.length) {
        clusters.push({ id, head: true }, ...below(person).map((x) => ({ id: x, head: false })));
      } else {
        leaves.push({ id, head: false });
      }
    }
    return [...leaves, ...clusters];
  };

  for (const leaderInput of content.leaders) {
    const leader = addPerson(leaderInput, {
      level: 'leader',
      subTeam: 'leadership',
      color: 'brand',
      reportsTo: null,
      team: 'leadership',
    });
    leaders.push(leader);

    for (const st of leaderInput.subTeams) {
      const subTeam = {
        id: st.id,
        name: st.name,
        color: st.color,
        mission: st.mission || '',
        leaderId: leader.id,
        managerId: null,
        memberIds: [],
        groupIds: [],
        size: 0,
      };
      const manager = addPerson(st.manager, {
        level: 'manager',
        subTeam: st.id,
        color: st.color,
        reportsTo: leader.id,
        depth: 1,
      });
      subTeam.managerId = manager.id;
      leader.directReports.push(manager.id);
      leader.leads.push(st.id);
      edges.push({ from: leader.id, to: manager.id, kind: 'leader' });

      for (const m of st.members) {
        const leadsTeam = Boolean(m.reports?.length);
        const member = addPerson(m, {
          level: 'member',
          subTeam: st.id,
          color: st.color,
          reportsTo: manager.id,
          depth: 2,
          team: leadsTeam ? personId(m) : null,
        });
        manager.directReports.push(member.id);
        subTeam.memberIds.push(member.id);
        edges.push({ from: manager.id, to: member.id, kind: 'member' });
        addReports(member, m.reports, { subTeam: st.id, color: st.color, team: member.team });

        if (leadsTeam) {
          groups.push({
            id: member.id,
            name: m.team || `${member.name}’s team`,
            color: st.color,
            mission: m.teamMission || '',
            subTeam: st.id,
            headId: member.id,
            size: below(member).length,
          });
          subTeam.groupIds.push(member.id);
        }
      }
      subTeam.size = below(manager).length;
      subTeams.push(subTeam);
    }
  }

  // Leaders with no one above them are peers (co-leads).
  if (leaders.length > 1) {
    for (const l of leaders) l.coLeads = leaders.filter((o) => o !== l).map((o) => o.id);
    for (let i = 0; i < leaders.length - 1; i++) {
      edges.push({ from: leaders[i].id, to: leaders[i + 1].id, kind: 'colead' });
    }
  }

  const groupsById = new Map(groups.map((g) => [g.id, g]));
  const teamsById = new Map(subTeams.map((t) => [t.id, t]));
  for (const g of groups) teamsById.set(g.id, g);
  teamsById.set('leadership', {
    id: 'leadership',
    name: content.leadership?.name || 'Leadership',
    color: 'brand',
    mission: content.leadership?.mission || '',
  });

  const projects = content.projects.map((p) => ({
    ...p,
    id: p.id || slugify(p.title),
    people: p.people || [],
    methods: p.methods || [],
    color: teamsById.get(p.subTeam)?.color || 'brand',
  }));
  for (const project of projects) {
    for (const pid of project.people) people.get(pid)?.projects.push(project.id);
  }

  // One step per team, in page order. A sub-team whose members lead no teams
  // becomes a step of its own, so nobody is left out.
  const leadershipRows =
    leaders.length > 1
      ? leaders.map((l) => ({
          id: l.id,
          head: false,
          note: `Leads ${l.leads.map((id) => teamsById.get(id).name).join(', ')}`,
        }))
      : subTeams.flatMap((t) => {
          const alone = t.groupIds.length
            ? t.memberIds.filter((id) => !people.get(id).directReports.length).map((id) => ({ id, head: false }))
            : [];
          return [{ id: t.managerId, head: true, note: `${t.name} · ${plural(t.size, 'person', 'people')}` }, ...alone];
        });

  const deckSteps = [
    {
      id: 'leadership',
      name: content.leadership?.name || 'Leadership',
      mission: content.leadership?.mission || '',
      color: 'brand',
      cardPeople: leaders.map((l) => l.id),
      rows: leadershipRows,
      isLeadership: true,
    },
  ];
  for (const t of subTeams) {
    if (t.groupIds.length) {
      for (const gid of t.groupIds) {
        const g = groupsById.get(gid);
        const head = people.get(g.headId);
        deckSteps.push({
          id: g.id,
          name: g.name,
          mission: g.mission || `Led by ${head.name}, ${head.role}.`,
          color: g.color,
          cardPeople: [head.id],
          rows: rosterFor(head),
          isLeadership: false,
        });
      }
    } else {
      deckSteps.push({
        id: t.id,
        name: t.name,
        mission: t.mission,
        color: t.color,
        cardPeople: [t.managerId],
        rows: rosterFor(people.get(t.managerId)),
        isLeadership: false,
      });
    }
  }

  const auto = {
    people: people.size,
    subTeams: subTeams.length,
    teams: deckSteps.length - 1,
    projects: projects.length,
    leaders: leaders.length,
    managers: subTeams.length,
  };
  const stats = (content.stats || []).map((s) => {
    if (typeof s.value === 'string' && s.value.startsWith('auto:')) {
      return { ...s, value: auto[s.value.slice(5)] ?? 0, auto: true };
    }
    return { ...s };
  });

  return { content, people, leaders, subTeams, groups, groupsById, teamsById, edges, projects, deckSteps, stats, auto };
}

/** Compact JSON the browser needs for the profile panel. */
export function panelData(model) {
  const people = {};
  for (const [id, p] of model.people) {
    people[id] = {
      name: p.name,
      role: p.role,
      bio: p.bio,
      skills: p.skills,
      funFact: p.funFact,
      email: p.email,
      chat: p.chat,
      location: p.location,
      photo: p.photo,
      initials: p.initials,
      level: p.level,
      subTeam: p.subTeam,
      team: p.team,
      color: p.color,
      reportsTo: p.reportsTo,
      directReports: p.directReports,
      coLeads: p.coLeads,
      projects: p.projects,
    };
  }
  const teams = {};
  for (const [id, t] of model.teamsById) teams[id] = { name: t.name, color: t.color };
  const projects = {};
  for (const p of model.projects) projects[p.id] = { title: p.title, year: p.year };
  return { people, teams, projects };
}
