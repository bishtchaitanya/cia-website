#!/usr/bin/env node
/*
 * Smoke test on the built page (no browser needed): structure, people, links,
 * accessibility basics and relative asset paths.  Run after `npm run build`.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseHTML } from 'linkedom';
import { buildModel } from '../src/lib/model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const htmlPath = path.join(dist, 'index.html');
if (!existsSync(htmlPath)) {
  console.error('✖ dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}
// What the page should contain, worked out from the content file itself.
const { default: content } = await import(pathToFileURL(path.join(root, 'src', 'content', 'site-content.js')).href);
const model = buildModel(content);
const html = readFileSync(htmlPath, 'utf8');
const { document } = parseHTML(html);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });

// Structure
check('exactly one h1', $$('h1').length === 1, `found ${$$('h1').length}`);
const themes = $$('main > section[data-theme], body > footer[data-theme]').map((s) => s.getAttribute('data-theme'));
const expected = ['light', 'dark', 'light', 'brand', 'light', 'dark', 'light', 'brand'];
check('section themes in order', JSON.stringify(themes) === JSON.stringify(expected), themes.join(' / '));
for (const id of ['top', 'about', 'team', 'people', 'work', 'contact', 'main']) {
  check(`#${id} exists`, document.getElementById(id));
}

// People + org structure
const personIds = new Set($$('[data-person]').map((b) => b.getAttribute('data-person')));
const expectedPeople = model.people.size;
check(`${expectedPeople} unique people`, personIds.size === expectedPeople, `found ${personIds.size}`);
const leaders = $$('.org__leader');
check(`${model.leaders.length} leader(s) in the org chart`, leaders.length === model.leaders.length, `found ${leaders.length}`);
const teamsPerLeader = leaders.map((l) => $$('.org__team', l).length);
const expectedTeams = model.leaders.map((l) => l.leads.length);
check('each leader has their sub-teams in the chart', JSON.stringify(teamsPerLeader) === JSON.stringify(expectedTeams), JSON.stringify(teamsPerLeader));
const membersPerTeam = $$('.org__team').map((t) => $$('.org__member', t).length);
const expectedMembers = model.subTeams.map((t) => t.memberIds.length);
check('each sub-team lists its direct reports', JSON.stringify(membersPerTeam) === JSON.stringify(expectedMembers), JSON.stringify(membersPerTeam));
const steps = $$('.deck-step');
check(`${model.deckSteps.length} deck steps`, steps.length === model.deckSteps.length, `found ${steps.length}`);
const rosterSizes = steps.map((s) => $$('.deck-people > li', s).length);
check('each deck step lists its whole roster', JSON.stringify(rosterSizes) === JSON.stringify(model.deckSteps.map((s) => s.rows.length)), JSON.stringify(rosterSizes));
const shown = new Set([...$$('.org [data-person]'), ...$$('.deck [data-person]')].map((b) => b.getAttribute('data-person')));
const missing = [...model.people.keys()].filter((id) => !shown.has(id));
check('everyone appears in the org chart or the deck', missing.length === 0, missing.join(', '));

// Projects
const projects = $$('[data-project]');
check(`${content.projects.length} project cards`, projects.length === content.projects.length, `found ${projects.length}`);
check('every project card has a cover SVG', projects.every((p) => p.querySelector('svg[data-art]')));

// Panel data
let panelOk = false;
try {
  const data = JSON.parse(document.getElementById('panel-data')?.textContent || '{}');
  panelOk = Object.keys(data.people || {}).length === expectedPeople && [...personIds].every((id) => data.people[id]);
} catch {
  panelOk = false;
}
check('panel data covers every person', panelOk);

// Links and ids
const ids = $$('[id]').map((el) => el.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
check('no duplicate ids', dupes.length === 0, dupes.join(', '));
const badAnchors = $$('a[href^="#"]')
  .map((a) => a.getAttribute('href'))
  .filter((h) => h.length > 1 && !document.getElementById(decodeURIComponent(h.slice(1))));
check('every #link has a target', badAnchors.length === 0, badAnchors.join(', '));
const refs = $$('[aria-labelledby],[aria-controls]').flatMap((el) =>
  ['aria-labelledby', 'aria-controls'].flatMap((a) => (el.getAttribute(a) || '').split(/\s+/).filter(Boolean)),
);
const missingRefs = refs.filter((id) => !document.getElementById(id) && id !== 'panel-name');
check('aria references resolve', missingRefs.length === 0, missingRefs.join(', '));

// Accessible names
const nameOf = (el) =>
  (el.getAttribute('aria-label') || '').trim() ||
  (el.textContent || '').replace(/\s+/g, ' ').trim() ||
  (el.getAttribute('aria-labelledby') ? 'labelled' : '');
const unnamed = $$('button, a[href]').filter((el) => !nameOf(el));
check('every button and link has a name', unnamed.length === 0, unnamed.map((el) => el.outerHTML.slice(0, 80)).join(' | '));
const imgsNoAlt = $$('img').filter((img) => !img.hasAttribute('alt'));
check('every img has alt', imgsNoAlt.length === 0, `${imgsNoAlt.length} missing`);

// Assets: relative paths only, and each local reference exists
const absolute = [...html.matchAll(/\s(?:src|href)="\/(?!\/)[^"]*"/g)].map((m) => m[0].trim());
check('no absolute asset paths in index.html', absolute.length === 0, absolute.join(', '));
const local = $$('[src],link[href]')
  .map((el) => el.getAttribute('src') || el.getAttribute('href'))
  .filter((u) => u && !/^(https?:|mailto:|data:|#)/.test(u));
const missingFiles = local.filter((u) => !existsSync(path.join(dist, u.replace(/^\.\//, '').split(/[?#]/)[0])));
check('referenced files exist in dist/', missingFiles.length === 0, missingFiles.join(', '));
const cssFiles = readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.css'));
const cssAbsolute = cssFiles.filter((f) => /url\(\s*['"]?\/(?!\/)/.test(readFileSync(path.join(dist, 'assets', f), 'utf8')));
check('no absolute url() in CSS', cssAbsolute.length === 0, cssAbsolute.join(', '));

// Report
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? '✔' : '✖'} ${r.name}${!r.ok || process.argv.includes('-v') ? (r.detail ? `  (${r.detail})` : '') : ''}`);
console.log(failed.length ? `\n${failed.length} of ${results.length} checks failed.` : `\nAll ${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
