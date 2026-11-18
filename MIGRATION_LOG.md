# Migration log: vanilla JS → React

This file records the migration of the site and its admin page from vanilla JavaScript to React:
what was there, what changed and why, how it was checked against the original, and what is still
open. The original implementation is the specification throughout; nothing was redesigned.

**Status:** complete. Every page, component and interaction of the public site and the admin page runs on React; the original vanilla code has been removed. Every stage was checked against the original, an independent verification round found nine edge-case differences in the admin and its server, all of them were fixed and re-proven against the original, and a final independent verification of the finished state ran last (§15).

## Summary

- **Public site.** Every page and section is a React component, rendered to HTML at build time
  (as before, so the page is complete without JavaScript) and hydrated in the browser. The markup is
  DOM-identical to the original, the CSS is the original's byte for byte except one added rule, and
  every interaction runs as React state and hooks around the original's animation code.
- **Admin page.** A React app with the original's markup, styles, texts and behavior, built by Vite
  and served by the same admin server.
- **Admin server and data.** Unchanged except for two things: it builds and serves the React admin,
  and its trial build before each save renders with React. Passwords, sessions, limits, the API,
  validation, conflict checks, atomic writes, backups and rebuilds are as before. The four JSON files
  in `src/content/data/` are still the only source of truth; their schema and location are unchanged.
- **How equality was proven.** Before changing anything, the original was copied aside, built, run
  through its own test suites and screenshotted twice (to measure its own run-to-run noise). Every
  stage was then compared against it with tools that diff the DOM, the CSS cascade, the profile
  markup, screenshots, and the live DOM and event order after scripted interactions in Chromium.

## 1. The original application (audit)

Audited from the source (every file in `src/`, `admin/`, `scripts/`, `plugins/`, the HTML templates, the
config and the workflow), from the built output, and by running the original's own test suites and screenshots
in headless Chromium. Nothing below is inferred from appearance alone.

### Frontend

| Aspect | Original implementation |
|---|---|
| Framework | None. Vite 8 (rolldown) builds vanilla ES modules. |
| Rendering | Build time only: `plugins/prerender.js` runs `scripts/render-worker.mjs` in a worker thread, which validates the content and renders HTML strings with the templates in `src/render/*.js` into `index.html` / `404.html` (`<!--app:head-->`, `<!--app:body-->`). The page is complete without JavaScript. |
| Runtime | `src/js/main.js`: Lenis smooth scrolling on GSAP's ticker, GSAP ScrollTrigger + SplitText animations, one `gsap.matchMedia()` for all breakpoint/motion-dependent behavior; UI modules in `src/js/ui/` (menu, hash links, profile panel, copy buttons, toasts, year). |
| Pages / routes | `index.html` (one page with in-page sections `#top`, `#about`, `#what-we-do`, `#at-a-glance`, `#team`, `#people`, `#work`, `#contact`); `404.html` (served for any missing path by `npm run serve`, the admin server and GitHub Pages); `/admin/` (admin server only). No client-side router. |
| Sections | Hero (headline fitted to the width, highlighted phrases, CTAs, scroll cue) · Mission (scroll-lit statement) · What we do (sticky heading, numbered pillars, current-pillar emphasis) · At a glance (count-up figures, auto-counted values) · Meet the team (org chart: chart or collapsible tree, SVG reporting lines, chain highlight, color legend) · Meet the teams (deck pinned on large screens: stacked cards, rosters, dense layout past 6 people, jump buttons, counter) · Projects (pinned sideways track, generated SVG covers, team chip, people avatars, counter + bar) · Contact (masked headline lines, email button, contact list with copy buttons). |
| Shared chrome | Skip link, fixed graph-paper background, progress bar, portal loader (globe GIF), portal header (black bar + navy section links; full-screen menu ≤ 1024 px), portal footer (Explore / Get in touch / Locations, © year, white logo), profile panel (native `<dialog>`: drawer ≥ 768 px, bottom sheet below), two toast live regions, ring cursor. |
| Styling | Plain CSS: `src/styles/tokens.css`, `base.css`, `components.css`, `sections/*.css`. Themes through `html[data-theme]` (light / dark / brand), crossfaded by scroll. Neue Plak brand font (`public/fonts`, linked only when present) with Barlow Condensed / Jost fallbacks (`@fontsource`). |
| Assets | `public/brand/` (mark, white logo, OG image), `public/fonts/` (5 woff + css), `public/loaders/` (globe GIF), favicons, `public/people/` (optional photos). |
| Responsive rules | Menu ≤ 1024 px; work pin ≥ 1024 × 700; deck pin ≥ 1180 × 720 (and `subgrid` support); org chart when ≥ 1024 px and ≥ 176 px per column, else tree; reduced motion and `?motion=off` disable smooth scrolling, loader, pins and scrubbing. |

### Backend

| Aspect | Original implementation |
|---|---|
| Server | `scripts/admin-server.mjs`, Node `http`, no dependencies. Serves `dist/` (with the custom 404) and `/admin/`. |
| Authentication | `ADMIN_PASSWORD` (≥ 8 characters, SHA-256 + `timingSafeEqual`) or `ADMIN_PASSWORD_HASH` (scrypt, from `npm run admin:hash`); refuses to start without one. |
| Sessions | In-memory, random 32-byte tokens, 8 h, cookie `cia_admin` `HttpOnly; SameSite=Strict; Path=/` (+ `Secure` over HTTPS or with `TRUST_PROXY=1`); sign-out deletes the session. |
| Abuse limits | 5 wrong passwords per address per 15 min → 429 with `Retry-After`; 500 ms delay on failures; 2 MB body limit (413); API requests need `content-type: application/json` and `x-admin: 1` (400 otherwise). |
| Headers | `cache-control: no-store`, `x-frame-options: DENY`, `nosniff`, `referrer-policy`, `x-robots-tag`, strict CSP (`default-src 'self'; script-src 'self'; style-src 'self'; …`). |
| API | `GET session` · `POST login` · `POST logout` · `GET content` (all four files + version hashes + build state) · `GET build` · `POST rebuild` · `PUT content/:name` (`{ data, baseVersion }`). |
| Save pipeline | Unknown file → 404; non-object → 422; keys of another file → 422; version mismatch → 409; `validate()` + a trial render → 422 with plain-English errors; then backup (last 20 per file in `.admin-backups/`), atomic write (temp file + rename), rebuild. |
| Rebuild | `vite build --outDir dist-next`, then swap `dist-next` → `dist` (requests see the old or the new build, never half); edits during a build trigger one more build; state exposed as `build`. |
| Configuration | `PORT`, `HOST`, `TRUST_PROXY`, `BASE_PATH`, `DIST_DIR`, `CIA_CONTENT_DIR`, `ADMIN_BACKUP_DIR`, `ADMIN_PASSWORD(_HASH)`. |
| Deployment | GitHub Pages (`.github/workflows/deploy.yml`: `npm ci`, `npm run check`, `npm run build` with `BASE_PATH=/cia-website/`). The admin is not deployed there; it runs wherever `npm run admin` runs. |

### JSON data

| Aspect | Original implementation |
|---|---|
| Files | `src/content/data/site.json`, `about.json`, `projects.json`, `org.json` (the source of truth). |
| Schema | `src/content/files.js` maps top-level keys to files (`site`; `hero, mission, whatWeDo, pillars, stats, team, people, leadership, contact`; `work, projects`; `leaders`). The org is a tree: `leaders[] → subTeams[] → manager + members[] → reports[]…`; ids derive from names unless pinned. |
| Readers | Build time only (render worker, `npm run check`, smoke test) through `src/content/site-content.js` (`CIA_CONTENT_DIR` override); the browser only received the derived profile data inlined as `#panel-data`. |
| Writers | Only the admin server (`PUT content/:name`), after validation and a trial render. |
| How the public site sees edits | The admin server rebuilds `dist/` after each save; pages served from the new build. GitHub Pages sees edits only after the changed JSON is committed and pushed. |
| Validation | `src/lib/validate.js`: required fields, ids, colors with "did you mean", art types, safe links, email/phone formats, stats values, unknown people/teams in projects, photo paths; warnings for placeholders and missing bios. |

### Tests and tooling that already existed

`npm run check` (content report), `npm run smoke` (55 checks on the built HTML), `npm run shots`
(48 screenshots at 5 sizes + 37 interaction checks in Chromium), `npm run test:admin` (47 checks: password,
API, saving, rebuild, the editor in a browser), `npm run verify`.

Baseline results on the original, recorded before the migration: smoke **55/55**, shots **37/37**, no console
errors, test:admin **47/47**. Two screenshot runs of the original differ by at most 106 px per image (the
animated scroll cue and the cursor ring), which is the noise floor used for the visual comparison.

## 2. Architecture before and after

| | Original | React version |
|---|---|---|
| Rendering | String templates (`src/render/*.js`) rendered at build time in a worker thread | React components rendered with `renderToString` at build time in the same worker (`src/entry-server.jsx`, loaded through Vite's `runnerImport`) |
| Browser | `src/js/main.js` wires the prerendered DOM | `src/main.jsx` hydrates the same React tree from `#page-data`, then starts the same motion code from hooks |
| Profile data | `<script id="panel-data">` (derived data) | `<script id="page-data">` (the content, Vite's base, the build year); profiles are derived in the browser with the unchanged `src/lib/model.js` |
| Interaction | Event listeners on the prerendered DOM | React state and handlers: menu, in-page links, active nav link, profile panel, copy buttons, messages, org chart toggles, footer year, loader |
| Motion | `src/js/motion/*.js` (GSAP, Lenis) | `src/motion/*.js`: the same modules, started and cleaned up by React hooks (`src/hooks/useSiteMotion.js` and friends) in the original order |
| CSS | `src/styles/**` | The same files; one rule added: `#root { display: contents; }` |
| Admin UI | Vanilla ES modules served as-is (`admin/*.js`) | React app in `admin/src/`, built by Vite (`vite.admin.config.js`) into `admin/dist/` |
| Admin server | `scripts/admin-server.mjs` | The same file with two changes (§6) |
| Build/deploy | `vite build`, GitHub Pages workflow | Unchanged commands and workflow; `@vitejs/plugin-react` added to the Vite config |

Why build-time rendering + hydration (and not a client-only React app): the original page is fully
readable without JavaScript, has its content in the HTML for search and link previews, and its
smoke test checks the built HTML. A client-only app would have removed all three.

Why the motion code was kept as imperative modules: GSAP's ScrollTrigger pins, SplitText and the
scroll-driven classes need synchronous access to the DOM in a fixed creation order (pins first, top
down). The React components render the static markup and never re-render it; hooks start the original
modules once hydration has committed and revert them on cleanup. Each DOM attribute has exactly one
owner (React state or the motion layer), so they never fight.

## 3. Method

The migration ran in stages, each leaving the site fully working and each checked against the original
before the next began:

| Stage | What moved to React | Gate |
|---|---|---|
| S1 | All rendering (SSR + hydration); the original runtime kept running through a temporary bridge | DOM diff, profile-markup diff, smoke, shots, screenshots |
| S2a | Messages, copy buttons, the profile panel | + scripted equivalence: 99 steps, 129 on synthetic content |
| S2b | Mobile menu, in-page links, active nav link, footer year, org chart | + 193 steps, two content variants (49, 53 steps), `?motion=off` (107 steps) |
| S2c | The motion layer and the bridge removed | + the whole motion layer in 7 configurations and 3 content variants, the loader lifecycle, 8 deliberately broken builds that the checks must catch |
| Admin (parallel) | The admin page | 140 scripted states, DOM and pixels; the admin test suite |
| Verification | Independent agents re-ran everything and reviewed the code adversarially | admin round: 20 agents, 9 findings confirmed by skeptics, all fixed; final round: §15 |

The tools (outside the repo, in `/opt/spark/migration-work/tools/`): `dom-diff.mjs` (built pages:
html/body attributes, `<head>`, body DOM, hydration data, CSS cascade), `panel-diff.mjs` (every
profile's markup, plus synthetic people with every optional field), `pixel-compare.mjs`,
`extra-shots.mjs` (no-JS, hover, focus, breakpoint edges), `admin-parity.mjs`, `admin-e2e.mjs`,
`admin-default-wiring.mjs`; each stage also wrote scripted equivalence checks
(`/opt/spark/migration-work/results/<stage>/`).

## 4. What was migrated

### Public site

| Original | React |
|---|---|
| `src/render/page.js` (head, page assembly) | `src/entry-server.jsx`, `src/pages/HomePage.jsx` |
| `src/render/chrome.js` (header, loader, panel shell, toasts) | `src/components/SiteHeader.jsx`, `Loader.jsx`, `ProgressBar.jsx`, `Cursor.jsx`, `ProfilePanel.jsx`, `ToastRegion.jsx` |
| `src/render/intro.js` | `src/sections/Hero.jsx`, `Mission.jsx`, `Pillars.jsx`, `Stats.jsx` |
| `src/render/team.js` | `src/sections/OrgChart.jsx`, `Deck.jsx` |
| `src/render/work.js`, `art.js` | `src/sections/Work.jsx`, `src/components/ProjectArt.jsx`, `src/utils/art.js` |
| `src/render/footer.js` | `src/sections/Contact.jsx`, `src/components/SiteFooter.jsx` |
| `src/render/panel.js` | `src/components/ProfileContent.jsx` |
| `src/render/avatar.js`, `util.js` | `src/components/Avatar.jsx`, `Button.jsx`, `Chip.jsx`, `CopyButton.jsx`, `Icon.jsx`, `PersonButton.jsx`; `src/utils/format.js`, `highlight.jsx` |
| `src/render/not-found.js` | `src/pages/NotFoundPage.jsx` |
| `src/js/main.js`, `not-found.js` | `src/main.jsx`, `src/not-found.jsx`, `src/hooks/useSiteMotion.js` |
| `src/js/ui/toast.js` | `src/context/toasts.jsx` |
| `src/js/ui/copy.js` | `src/utils/copy.js` (+ `CopyButton.jsx`) |
| `src/js/ui/panel.js` | `src/context/profile-panel.jsx` |
| `src/js/ui/menu.js` | `src/hooks/useMobileMenu.js` |
| `src/js/ui/anchors.js` | `src/utils/hash-links.js`, `src/context/hash-links.js` |
| `src/js/ui/year.js` | `SiteFooter.jsx` (state) |
| `src/js/motion/chrome.js` | `src/motion/chrome.js`, `src/hooks/useActiveSection.js` |
| `src/js/motion/org.js` | `src/motion/org.js`, `src/hooks/useOrgChart.js`, `OrgChart.jsx` (toggle state) |
| `src/js/motion/intro.js` | `src/motion/intro.js`, `src/hooks/useHeroFit.js` |
| `src/js/motion/{scroller,reveals,deck,projects}.js` | `src/motion/` (same logic) |
| — | `src/context/scroller.js`, `src/utils/page-data.js`, `src/utils/nav.js` |

Unchanged: `src/lib/` (model, validation, palette), `src/content/`, `src/styles/` (plus the one rule),
`public/`, the fonts, images and icons.

### Admin page

| Original | React |
|---|---|
| `admin/admin.js` | `admin/src/state.js` (the controller: state and server flows, ported line for line), `App.jsx`, `Editor.jsx`, `Login.jsx`, `Toast.jsx`, `api.js` |
| `admin/fields.js` | `admin/src/fields.jsx` |
| `admin/org.js` | `admin/src/org.jsx` |
| `admin/schema.js` | `admin/src/schema.js` |
| `admin/h.js` | `admin/src/util.js`, `hooks.js`, `Panel.jsx` |
| `admin/index.html` | Vite entry (same head and body) |
| `admin/admin.css` | Unchanged; copied byte for byte into the build |

## 5. Admin functionality preserved

All of it, with the same markup, texts and timing: sign-in (wrong password, rate limit, session
end → sign in again with the drafts kept), the four tabs (`?tab=`/`#tab`), every field type, lists
(add, move, remove with confirms), the org editor (leaders, organizations, directors, people, direct
reports, "N people below" badges, search, Expand/Collapse all, rename keeps the id), dirty tracking,
Save/Discard, problems and warnings, 409 conflicts, the build banner and its polling, messages,
`beforeunload`. Each tab's form is kept while you switch tabs, and rebuilt only on discard or (for
Projects and About) after an org chart save, as before.

Evidence: `admin-parity.mjs` drove 70 scripted steps at 1280×900 and 390×844 in the original and
the React admin: 140 states, 0 DOM or behavior differences, 0 pixel differences, identical console
output (no CSP violations), 60 identical API requests and 24 identical save bodies, the content files
identical after every step, toasts 40 vs 40 with the same texts and durations. Typing on the org tab
with all 96 nodes open: median 0.7 ms per keypress. An independent verifier then re-ran all of this in its own copy, compared every API route, status, header and body with the original server (133 requests), checked startup with and without passwords and hashes, proxies (`TRUST_PROXY`), the admin build at startup, memory and timing, and a second reviewer read the code line by line. Their nine findings are in §11 (all fixed).

## 6. Backend changes

Only these, both required by the React admin and the React rendering:

1. **The admin page is built and served from `admin/dist/`.** On start, after the password check, the
   server builds the admin (Vite, in-process) when `admin/dist/` is missing or older than its sources,
   into `admin/dist-next/`, then swaps it in by rename, as the site rebuild does. A failed build stops
   the server with the error; the old build is kept. `/admin/*` is served from there with the same
   headers and CSP.
2. **The trial build before each save renders with React** (`renderContent()` from
   `scripts/render-core.mjs`, the same function the build uses), so a save is refused exactly when the
   real build would fail. Same error message as before.

Plus one side effect fixed: Vite's in-process build sets `NODE_ENV=production` for the whole process;
the server restores it afterwards (as `render-core.mjs` does after `runnerImport`), so later site
rebuilds behave the same whether or not the admin was rebuilt at start.

Everything else in `scripts/admin-server.mjs` is unchanged (diffed against the original).

## 7. JSON storage and persistence

Unchanged. The four files in `src/content/data/` (schema in `src/content/files.js`) are read at build
time; the admin writes them through the same API (`PUT /admin/api/content/:name`): validation, a trial
render, the version check (409), a backup of the previous file (`.admin-backups/`, last 20), an atomic
write (temp file + rename), then a site rebuild with an atomic swap of `dist/`. The public site shows
the edit as soon as the rebuild finishes; the files survive refreshes and restarts because they are
the files. GitHub Pages still needs the changed JSON committed and pushed.

Real use during the migration: on 2026-11-14 at 06:44:44 the owner removed the "KING" sub-team
through the new React admin. The server backed up the previous file
(`.admin-backups/org-2026-11-14T06-44-44-098Z.json`), wrote `org.json` (now byte-identical to the
committed version) and rebuilt the site, which no longer shows the team. That sub-team had been added
through the original admin on 2026-11-13 at 13:50, before the migration; it was preserved untouched
until the owner removed it.

The brief's mandatory end-to-end test (14 steps) is scripted in
`/opt/spark/migration-work/tools/admin-e2e.mjs`. It ran against the original first (the reference: all 15
checks passed) and then against the React version, on temporary copies of the content, where all 15 checks
passed with the same evidence step by step: open the admin, sign in (a wrong password first), the editor
shows the files' data, edit a project and a person, save, the files on disk changed, the public site shows
the edits, they survive a refresh and a server restart, add a project and a person, delete them, invalid
values (an unsafe link, a bad email, a misspelled color with "Did you mean", malformed JSON, non-object
data, sections of another file, a stale version, a corrupt file on disk), and access without signing in
(no cookie, a forged cookie, no admin header, after signing out, the rate limit).

Why a copy of the content rather than the live files: the owner was using the admin on those files during
the migration (the 06:44 save above). A test editing them could have mixed its edits into one of the owner's
saves, or written an old version back over a new one. The copy goes through exactly the same code (only
`CIA_CONTENT_DIR` points elsewhere). That the default configuration reads and writes the real
`src/content/data/` was checked separately and read-only (`admin-default-wiring.mjs`, 6 of 6), and the
06:44 save is the real-data case. The script can also run on the live files at a quiet moment
(`--real-data`): it snapshots them, restores them byte for byte afterwards, and never overwrites a file that
someone else changed during the run.

## 8. Files

**Created (66).**
- Public site: `src/entry-server.jsx`, `src/main.jsx`, `src/not-found.jsx`;
  `src/pages/` (`HomePage.jsx`, `NotFoundPage.jsx`);
  `src/sections/` (`Hero`, `Mission`, `Pillars`, `Stats`, `OrgChart`, `Deck`, `Work`, `Contact`);
  `src/components/` (`Avatar`, `Button`, `Chip`, `CopyButton`, `Cursor`, `Icon`, `Loader`, `PersonButton`,
  `ProfileContent`, `ProfilePanel`, `ProgressBar`, `ProjectArt`, `SiteFooter`, `SiteHeader`, `ToastRegion`);
  `src/context/` (`hash-links.js`, `profile-panel.jsx`, `scroller.js`, `toasts.jsx`);
  `src/hooks/` (`useActiveSection`, `useHeroFit`, `useMobileMenu`, `useOrgChart`, `useSiteMotion`);
  `src/motion/` (`chrome`, `deck`, `intro`, `org`, `projects`, `reveals`, `scroller`);
  `src/utils/` (`art.js`, `copy.js`, `format.js`, `hash-links.js`, `highlight.jsx`, `nav.js`, `page-data.js`).
- Admin: `admin/src/` (`App.jsx`, `Editor.jsx`, `Login.jsx`, `Panel.jsx`, `Toast.jsx`, `api.js`,
  `fields.jsx`, `hooks.js`, `main.jsx`, `org.jsx`, `schema.js`, `state.js`, `util.js`), `vite.admin.config.js`.
- This file. (`admin/dist/` is build output, ignored by git like `dist/`.)

**Modified (17).**
| File | Change |
|---|---|
| `index.html`, `404.html` | Body only: `<div id="root">`, the page-data placeholder, the `.jsx` entry. `<head>` unchanged. |
| `vite.config.js` | `@vitejs/plugin-react` added before the prerender plugin. |
| `plugins/prerender.js` | Renders with React; three placeholders; watches `src/`. |
| `scripts/render-core.mjs` | `renderContent()` renders React through Vite's `runnerImport` (cached per process, `NODE_ENV` restored); `renderSite()` keeps its result shape. |
| `scripts/render-page.mjs`, `scripts/render-worker.mjs` | Comments only. |
| `scripts/admin-server.mjs` | §6, plus the fixes listed in §11. |
| `scripts/smoke.mjs`, `scripts/shots.mjs` | Three checks adapted (§11). |
| `src/styles/base.css` | The `#root` rule. |
| `src/styles/components.css` | Four comments that named the old files (the built CSS is unchanged). |
| `admin/index.html` | Vite entry. |
| `package.json`, `package-lock.json` | `react`, `react-dom`, `@vitejs/plugin-react`; the `build:admin` script. |
| `README.md` | Describes the React implementation. |
| `.gitignore` | The admin build's temporary folders (`dist-next-*/`, `dist-old-*/`). |

**Removed (31)**, after their replacements were validated (they remain in git history):
`src/js/` (15 files: `main.js`, `not-found.js`, `motion/*.js`, `ui/*.js`), `src/render/` (11 files), and the
vanilla admin `admin/admin.js`, `fields.js`, `h.js`, `org.js`, `schema.js`.

**Unchanged:** `src/lib/`, `src/content/` (code and data), the rest of `src/styles/`, `public/`,
`scripts/admin-hash.mjs`, `scripts/serve.mjs`, `scripts/static-server.mjs`, `scripts/admin-test.mjs`,
`.github/workflows/deploy.yml`.

## 9. Tests

| Check | Original (before) | React (final) |
|---|---|---|
| `npm run check` | ✔ | ✔ |
| `npm run smoke` | 55/55 | 55/55 |
| `npm run shots` | 37/37, no console errors | 37/37, no console errors; every check line identical to the original's |
| `npm run test:admin` | 47/47 | 47/47 |
| DOM diff of both built pages (`dom-diff.mjs`) | — | identical (2,182 and 91 nodes, `<head>`, attributes, hydration data); CSS identical except the `#root` rule; also for the GitHub Pages build |
| Profile markup (`panel-diff.mjs`) | — | 99/99 identical |
| Content variants, original renderer vs React (`trial-diff`) | — | 2,501 variants: same accept/refuse and identical markup for all |
| Messages, copy, profile panel (scripted, 3 configs) | — | 99 + 129 steps identical |
| Menu, links, nav, year, org chart | — | 193 + 49 + 53 + 107 steps identical |
| Motion layer (7 configs, 3 content variants) | — | identical; 8 of 8 deliberately broken builds detected |
| Loader lifecycle (9 scenarios × 4 runs) | — | identical |
| Admin parity (70 steps × 2 sizes) | — | 140 states: 0 DOM, 0 pixel differences |
| Admin end-to-end (14 steps) | 15/15 | 15/15, same evidence |
| Admin API parity (133 requests) | — | identical status, headers and bodies (by-design exceptions in §11) |
| Dev server, watch mode, GitHub Pages build | ✔ | ✔ |

Final independent verification of the finished state: see §15.

## 10. Visual comparison

`npm run shots` (48 screenshots at 5 sizes) and 41 supplementary screenshots (no JavaScript, hover and
keyboard focus, the breakpoint edges 1179/1180 and 1023/1024, 1920, 360, a landscape phone, the menu on a
tablet, long profiles, reduced motion and `?motion=off` full pages) were compared pixel by pixel with the
original's. The original's own run-to-run noise was measured first (two runs: at most 106 px per image, in the
animated scroll cue and the cursor ring).

Result: every screenshot is within that noise except the loader one, where the loading globe GIF is caught on
another frame (344 px). The GIF's frame depends on when the page first paints; the original shows another
frame in about a third of its own runs, and the React page's startup task is about 30 ms longer (about one GIF
frame). No layout, color, font, spacing or content difference was found. The admin: 140 screenshot pairs,
0 pixel differences.

The final independent verification repeated this comparison on the finished state: see §15.

## 11. Intentional differences

Everything not listed here is the same as the original.

**Markup and build**
1. **`<div id="root">`** holds the React tree, with one added CSS rule, `#root { display: contents; }`, so the
   404 page's body layout (a flex column) and every fixed element behave exactly as before.
2. **`#page-data` replaces `#panel-data`.** The page carries the content it was built from (11.6 KB) instead
   of the derived profile data (33.8 KB); profiles are derived in the browser with the unchanged model. The
   original's "Sorry, profiles couldn't be loaded" case no longer exists: without that data the page can't
   hydrate at all.
3. **React 19's image preload links** (it adds one per image to server output) are removed from the build,
   because they would land inside `#root`.
4. **Placeholders are filled with replacer functions.** The original's string replacement expanded `$&`,
   `$'` and similar in content; such text now comes out literally.
5. **Highlighted phrases** in the hero text match on the text. Phrases that matched inside an HTML entity or a
   tag in the original's escaped HTML are not reproduced (13 such contrived cases in the fuzzing; real
   phrases are identical).

**Runtime**
6. **Hydration runs synchronously** (`flushSync`), so the page's setup happens in the same task as the
   original's script did (otherwise the headline sizing and the first paint moved). The page reaches
   `data-ready` about 30 ms later (the hydration itself).
7. **Footer year:** the build year is rendered during hydration and switches to the current year right after.
8. **In-page links** have React click handlers (one shared handler) instead of one document-wide listener; the
   mobile menu closes first (capture phase), then the scroll starts, as before.
9. **The active nav link** is a tiny store read with `useSyncExternalStore`, so it updates in the same task as
   the original's class changes did.
10. **The org chart creates its media query first** (`useInsertionEffect`), so media-query listeners fire in the
    original's order (it matters when the window crosses 1024 px with the menu open).
11. **The loader is removed through React state** (in the same tick as the original's `loader.remove()`).
12. **The motion modules take their elements from React refs and return cleanups**; their logic, thresholds,
    durations and easing are the original's.
13. **`window.__site`** (only with `?debug`) also has `openProfile`, for the test harness.
14. **The org chart's SVG** always gets 1310×595 (the original sometimes kept 625 from a measurement before
    the brand font arrived). It is transparent; nothing visible changes.

**Tests** (only checks that inspected a replaced implementation detail)
15. `smoke`: "panel data covers every person" now reads `#page-data`; "message regions" looks inside `#root`.
16. `shots`: "a profile that cannot open shows an error message" calls `window.__site.openProfile('nobody-here')`
    instead of injecting a raw `<button data-person>` (React's person buttons have their own handlers).

**Admin page and server**
17. **The admin page is built by Vite** into `admin/dist/` (hashed asset names, the CSS copied byte for byte,
    `../favicon.ico` and `../fonts/neue-plak.css` kept as runtime links). Generated ids are React's (`_r_1_`)
    instead of `f1`; labels still point at their inputs. `/admin/admin.js` and the other old files are gone.
18. **The admin server needs Vite and React** (installed by `npm install`) to build the admin page and for its
    trial build. It uses about 230 MB more memory (they are loaded in the server process).
19. **Fixed after the independent verification** (each one reproduced against both servers first, then proven
    to behave like the original):
    - two saves of one file from the same version sent a few milliseconds apart: the second is refused (409)
      again, as in the original. The last check and the write now run one save at a time (about 2 ms each).
      For saves 0-2 ms apart the original sometimes kept only the second or answered 500 (both writes used the
      same temporary file); the React server always refuses the second with the same 409;
    - site rebuilds always run with the `NODE_ENV` the server started with (Vite changes it for a moment while
      it loads the renderer);
    - a request path that leads out of `admin/` gets the original's empty 403;
    - the admin page is rebuilt when its sources' **content** changed: a fingerprint of every source file is
      kept in `admin/dist/.sources` (never served), instead of comparing file dates. Editors' lock and swap
      files, broken links and unreadable entries are ignored; each server builds in its own temporary folder
      (`admin/dist-next-<pid>/`, ignored by git), so two servers starting at the same moment can't break each
      other's build. A build made with `npm run build:admin` has no fingerprint, so the next server start
      builds once more;
    - an error while a form is built (hand-edited broken content) shows the original's messages and keeps the
      previous screen, instead of a blank page. Where the original's message is written by the browser engine
      and names the original's own variables (for example "people.map is not a function"), the React admin's
      names its own; the one such message the original's org search produces is reproduced word for word;
    - values from the content that aren't text (an object, `true`, a list) are shown exactly as the original
      showed them, in the admin and on the site, instead of being refused.

**Documentation**
20. README updated for the React implementation; its smoke count corrected (it said 54; the suite had 55
    before the migration too). One code comment (`compactNumber`) corrected to match its code.

## 12. Original behavior kept on purpose

These are quirks of the original that the migration reproduces exactly, because the brief was to
preserve behavior. They are candidates for separate fixes:

1. **Profile panel, repeated Esc.** When Chrome force-closes the panel on a second Esc, the listener
   waiting for the slide-out stays attached, and the next profile opened closes itself when its slide-in
   ends (about 650 ms later).
2. **Pinned projects track, avatar clicks.** On mousedown on a project's avatar, the keep-in-view focus
   handler moves the track, so the mouseup lands elsewhere and the click is lost.
3. **Org chart entrance.** Focus doesn't return to an opener that the entrance animation still hides.
4. **Admin, organization name.** Typing an organization's name doesn't update its title in the list
   until something else redraws it.
5. **Admin, emptied direct reports.** After the last direct report of someone is removed, the save
   bar's dirty state isn't re-checked until the next edit.
6. **Hero headline under reduced motion.** Its fitted size depends on whether the brand font had
   loaded before the first fit (204.77 px or 205.86 px at 1440 px wide, varying between runs of the
   original itself).
7. **Late brand font.** With reduced motion, if the brand font finishes after both refreshes, the
   page grows (about 62 px) and the scroll triggers below stay slightly off until the next resize.

## 13. Outstanding issues, limitations and what was not verified

- **Browsers:** everything was tested in headless Chromium (as the original's own tests were). Firefox, Safari,
  touch devices and screen readers were not tested.
- **GitHub Pages:** the Pages build (`BASE_PATH=/cia-website/`) was built, compared with the original's and
  served locally under `/cia-website/`; the deploy workflow itself runs on GitHub and was not run here.
- **Timing the original also has:** a brand font that loads late can leave scroll triggers slightly off until
  the next resize; the loader GIF's frame; the cursor ring at load; deep links landing 1 px differently in
  rare runs. Both versions show these at similar rates.
- **The real-data end-to-end run** was done on copies (§7); run `admin-e2e.mjs --real-data` against the live
  files at a quiet moment if you want that too.
- **After updating the code, restart `npm run admin`**: a server keeps the renderer it loaded at start (as the
  original kept its templates) and builds the admin page again when its sources changed.
- **Pre-existing, unrelated:** `public/people/README.md` says photos are set in `src/content/site-content.js`;
  they are set in `org.json`. Left unchanged (not part of the migration).
- **Hand-edited invalid content, error wording:** both versions refuse a contact headline that is not a list,
  but the message quotes different code (`(contact.headline || ["Let's talk"]).map is not a function` vs
  `lines.map is not a function`), because the engine writes it from the source.
- **Oversized save under load:** a save over 2 MB is answered 413 by both servers, but under heavy load the
  React server's heavier process sometimes loses a pre-existing race in the unchanged request reader and the
  client sees a dropped connection instead (also seen with the code before the fixes; 30 of 30 isolated tries
  got 413 on both).
- **The first trial build** after a start whose content had problems loads the page renderer during a save;
  Vite switches `NODE_ENV` to "development" for about a third of a second meanwhile, so that trial render uses
  React's development build (same output). Site rebuilds are not affected (§11).
- Seven behaviors of the original were kept on purpose (§12).

## 14. Commands

```bash
npm install
npm run dev          # Vite dev server on 127.0.0.1:5173 (prerendered + hydrated, React Fast Refresh)
npm run build        # dist/ (relative paths); BASE_PATH=/cia-website/ npm run build for GitHub Pages
npm run watch        # rebuild on every save
npm run serve        # serve dist/ on 127.0.0.1:3001
ADMIN_PASSWORD='…' npm run admin   # the site + /admin/ (builds admin/dist/ when needed)
npm run build:admin  # build the admin page by hand
npm run check        # content report        npm run smoke   # 55 checks on dist/
npm run shots        # screenshots + 37 checks in Chromium
npm run test:admin   # 47 admin checks       npm run verify  # check + build + smoke
```

Deployment is unchanged: pushing to `main` runs `.github/workflows/deploy.yml` (`npm ci`,
`npm run check`, `BASE_PATH=/cia-website/ npm run build`) and publishes `dist/` to GitHub Pages. The
admin server is not part of that deploy; run it with `npm run admin` where the files should be edited,
and restart it after updating the code (it builds the admin page again when its sources changed).

## 15. Final independent verification

Running at the time of writing (independent agents, each in its own copy of the finished repo, comparing against the original; every reported problem re-checked by two skeptics). The results are recorded here when it completes.

## 16. After the migration: projects replaced by the Dashboards section

Made after the migration was complete, on the React code (so this is a change to the site, not part of the migration).

- **Projects are gone.** The Projects section, its header link, `projects.json`, the cover-art components, the pinned sideways track
  (`motion/projects.js`), the profile panel's "Projects" list, the admin's Projects tab and the "Projects featured here" figure were
  removed. The data is in git history (the commit before this change).
- **Dashboards are a section of the home page**, between the team deck and the contact section, in the place the projects had. It is
  `src/sections/Dashboards.jsx` with the directory, viewer and frame components of the former `dashboards.html` page, which no longer
  exists as a page: `public/dashboards.html` is a few lines that send old links (`dashboards.html#<id>`) to `#dashboards/<id>`.
  The header's "Dashboards" link is now a section link like the others; the header and footer lost their "page item" handling.
- **The selection** (`hooks/useDashboardSelection.js`) is state mirrored from the address as `#dashboards/<id>`, not read from it: on the
  home page the header's links rewrite the address with `history.replaceState` (no event), and must not clear the open dashboard.
- **The home page now needs the approved hosts** (`dashboard-hosts.json`) to build the section's catalog, as the dashboards page did, and
  its page data carries `catalog` next to `content`. `renderContent` reads and checks them for the home page; the 404 page needs neither.
- **Each driver's heading folds its list** (`components/DashboardDirectory.jsx`), with "Collapse all" and "Expand all"; the search card
  does not fold. Everything starts open, so the prerendered page and a visitor without scripts see every dashboard.
- **The sections below move when the list changes height**, so the section re-measures the page's scroll triggers
  (`ScrollTrigger.refresh()`, debounced) when the list is searched or folded.
- **Tests:** the browser suite lost its project checks and gained dashboards checks (selection, folding, deep links, the old address,
  phone); the admin tests use `about.json` where they used `projects.json` as "another file"; the dashboards suite's rendering section
  describes the home page. The wording "the Dashboards page" in the admin's hints and messages was left as it was.
- **"At a glance" is gone** (the row of counted figures: people, organizations, teams, dashboards): the section, `stats` in `about.json`,
  its validation and count-up motion, its admin "Numbers" section and its styles were removed.
- **Locked headings.** The org chart, the team deck and the Dashboards each have a `StickyHead` bar (`components/StickyHead.jsx`,
  `hooks/useStuck.js`, "Sticky section heading" in `styles/components.css`): it sticks under the header once the section's big heading
  has scrolled away and stays until the section ends. The pinned deck's stage and the dashboards' search card and viewer start below it
  (`--bar-h`). On a 720px-high screen the 22-person roster's rows are a little tighter to make room for the bar.
- **The org chart opens members.** A member with direct reports is a card with two buttons (`OrgNode` in `sections/OrgChart.jsx`):
  the card opens their reports under them (`ul.org__reports`, nested as deep as the content goes), a small button opens the profile. Opened
  reports are indented lists with CSS connectors, in the chart layout too; the chart's own SVG lines are drawn again when someone opens
  (`relayout()` in `motion/org.js`), and the highlight finds opened people in the page when it needs them. Directors and people without
  reports still open their profile when clicked.
- **The landing page is two columns.** The right third holds the eyebrow, the headline (sized to fill that column by `initFit`, which needs the
  headline's grid track capped with `minmax(0, 1fr)`: otherwise its unbroken lines widen the track and the fit measures the overflow), the intro and
  the buttons; the left two thirds hold a "Hello <name>" greeting and `hero.kpis` from `about.json` (`div.hero__panel` > `p.hero__greeting` +
  `<dl class="kpis">` in `sections/Hero.jsx`, "Key figures" in `styles/sections/intro.css`). (It was the other way round first: words left, figures
  right; the user then asked for the greeting and the figures on the left, and "Total Pax" was dropped, so there are six figures, 3 + 3.) The words
  stay first in the markup, so the headline is what a screen reader meets first; CSS `order` puts the panel on the left. Under 1024px the columns
  stack, the words first, then the greeting and the figures (three to a row, then two on a phone, a last odd one across both).
- **Vercel deploy.** `vercel.json` (framework "vite", `npm ci`, `npm run build`, output `dist`, `nosniff` on everything, a year of caching for the
  hashed files in `/assets/`) and one line in `vite.config.js`: `base` is `/` when `VERCEL` is set (Vercel sets it in its builds), `./` otherwise,
  `BASE_PATH` still wins. The reason is the custom 404 page: Vercel, like GitHub Pages, serves `404.html` at the address that was missing, and
  relative asset paths fail there at any depth (checked: at `/no/such/deep/page` the default build's 404 page loses its CSS, scripts and logo; the
  `VERCEL=1` build keeps all of them). The Vite preset in `@vercel/frameworks` has no `defaultRoutes` (no catch-all rewrite to `index.html`), so
  missing addresses still reach `404.html`; there is deliberately no `rewrites` in `vercel.json`, and no `cleanUrls`, so `/dashboards.html` still
  redirects into the section. Not changed: `site.url` stays whatever `site.json` says (it feeds the canonical link and link previews), to be
  set to the Vercel address after the first deploy. `vercel.json` was checked with Vercel's own `@vercel/routing-utils` and its published JSON schema.
- **The landing page was then tuned to the user's own browser edits** (from a screenshot at about 1900px wide): a larger, bold greeting
  (`clamp(30px, 3.75vw, 76px)`) with about 100px (`5.2vw`) between it and the figures; larger bold labels (`1.35vw`); boxes with more room above
  the label and between label and figure, less under the figure; the two columns start at the same height (`align-items: start` with
  `align-content: center`, so the pair is still centered on the screen); and the headline's last line is left-aligned, set in by `0.24em`,
  not right-aligned.
- **The header has a user area, a placeholder** (`components/UserMenu.jsx`): a bell, the name with a person icon, and Logout, in the black bar from
  1025px, and the same three at the end of the opened menu below that (the bar has no room). The bell and Logout show an `info` note through
  the toast system (`src/context/toasts.jsx`; `ToastRegion` on the 404 page too) saying they are not connected yet. The name comes from
  `PLACEHOLDER_USER` in `src/utils/user.js`, which the greeting reads as well; replace it when sign-in (OAuth, IAM) exists. To fit it, the title's
  size is a smaller clamp and `--portal-gutter` is narrower on narrow desktops.
- **The landing page's figures are compact boxes** (a box is as tall as its label and figure, with the figure right under the label) and the
  two columns are centered on the screen, so a tall window leaves space around them, not inside them. The headline is "Welcome to /
  Customer Insights / & Analytics": the longest line sets the headline's size, so the opening words have a line of their own to keep it
  large, and the last line is the one in the accent color. `initFit` (`motion/intro.js`) checks its first guess and takes the headline
  back in if the line came out wider than the column. On a laptop screen the scroll hint is hidden so the whole page fits.

