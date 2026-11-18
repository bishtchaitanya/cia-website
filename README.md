# Customer Insights & Analytics: team site

A single-page site in three parts:

1. **Intro**: the landing page (a "Hello <name>" greeting and the six key figures in the left two thirds, the headline, intro and buttons in the right third), the mission statement and what the team does.
2. **Meet the team**: the org chart (managing director, directors and their direct reports), a deck that steps through leadership and each team, and a profile panel for every person.
3. **Dashboards**: every dashboard the team publishes, grouped by driver, with a viewer that shows the one you pick. [More below.](#the-dashboards-section)

The sections are inspired by [lenis.dev](https://lenis.dev/) and Google's [Team USA](https://sports.withgoogle.com/teamusa/) site. The header, footer, loader and 404 page follow the United Data Hub portal ([cbs_udh_datalake_analyticsui](https://github.com/United-Airlines-Org/cbs_udh_datalake_analyticsui)), so the site can sit alongside it; its sign-in (OAuth, IAM) isn't part of this site yet. It uses the brand palette and the Neue Plak typeface.

**The people and the dashboards are real; the intro copy is placeholder.** The content lives in JSON files in [`src/content/data/`](src/content/data/README.md), which you can edit by hand or with the [admin page](#the-admin-page). People currently have only a name and job title, so profiles show those and who they report to.

## Quick start

```bash
npm install
npm run build      # writes the static site to dist/
npm run serve      # serves dist/ on port 3001
```

On this code server, open the forwarded port. Keep the trailing slash:

```
https://marsgateway.dev.bos.aws.ual.com/bos-u437590-web-work-prd/proxy/3001/
```

The site needs no server code. To host it, copy `dist/` to any static host. All paths are relative, so it also works under a sub-path.

**GitHub Pages.** Pushing to `main` deploys to `https://bishtchaitanya.github.io/cia-website/` (`.github/workflows/deploy.yml`). That build sets `BASE_PATH=/cia-website/`, which makes the paths absolute. GitHub serves `404.html` at whatever address was missing, at any depth, and only absolute paths load from there. If the address changes (a custom domain or a renamed repo), update `BASE_PATH` in the workflow and `site.url` in the content file.

## Editing content

1. In one terminal, run `npm run watch`. It rebuilds whenever you save.
2. In a second terminal, run `npm run serve`.
3. Edit the JSON files in `src/content/data/` and save. Then hard-refresh the browser. [`src/content/data/README.md`](src/content/data/README.md) lists every field (people and reporting lines, links, contact details).

Or skip the files and use [the admin page](#the-admin-page).

**Contact details** live in `site.json`: `email`, `phone` and `chat`. Each appears once it is filled in: in the Contact section as a clickable link (`mailto:` or `tel:`) with a Copy button, and in the footer's "Get in touch" column. Leave a field empty to hide it. People can have the same three fields; they show in their profile.

`npm run check` reports content problems in plain English, for example: `color "purpel" is not one of blue, red, … Did you mean "purple"?`. The build stops with the same report.

**People and reporting lines** come from nesting. You never write "reports to":

```
leaders             the top of the org (the Managing Director)
 └ subTeams         the organizations under a leader: one per Director
    ├ manager       the Director
    └ members       the Director's direct reports
       └ reports    anyone's direct reports, nested as deep as you like
```

- **Org chart:** the leader, each Director, and the Director's direct reports. People who lead a team show how many people are below them. Clicking a member who has direct reports opens them under that member in the chart (click again to fold them); their reports open in turn, as deep as the content goes. A small profile button on the same card opens the profile panel, and a member with no reports opens their profile when clicked.
- **Deck ("Meet the teams"):** a Leadership step, then one step for each member who has `reports`. The step lists everyone below that person, with managers shown above their own people. A sub-team whose members have no reports gets one step of its own.
- **Profiles:** open from anywhere. "Reports to" and "Direct reports" move through the whole tree.

| Field | Notes |
|---|---|
| `name`, `role` | Required for every person. The person's id is made from their name, e.g. `priya-raman`. If two people share a name, give one an `id: 'priya-raman-2'`. |
| `reports` | A list of the people who report to this person. A member with `reports` leads a team. |
| `team`, `teamMission` | Optional, for someone who leads a team: its name (default "Name's team") and the line under it in the deck. |
| `bio`, `skills`, `funFact`, `email`, `phone`, `chat`, `location` | Shown in the profile panel. Email and phone are clickable, and email, phone and chat have a Copy button. A phone can include an extension, like `'+1 312 555 0100 ext. 12'`. |
| `photo` | Optional. Put a square image in `public/people/` and set `photo: 'people/priya-raman.jpg'`. Without a photo, the person's initials are shown. |
| sub-team `color` | One of `blue`, `red`, `purple`, `yellow`, `burgundy`, `green`, from the secondary palette. Everyone in the organization, and their team, uses it. |

**Size limits.** The chart is designed for up to 6 direct reports per Director. Teams of any size fit the deck: past 6 people the list switches to a denser two-column layout, which fits 22 people on a 1280×720 screen.

**Pinning.** The deck pins and scrolls through its steps on screens at least 1180 × 720. Smaller desktop windows show the steps stacked, because the list of teams and the rosters need the room.

## The Dashboards section

The section after the team (header link "Dashboards", address `#dashboards`) lists every dashboard in [`dashboards.json`](src/content/data/README.md#dashboards) and shows the one you pick.

- **Directory.** A search card (a search box, a Driver list and a count) above the dashboards, grouped under their drivers. Searching or choosing a driver narrows the list.
- **Drivers fold.** Each driver's heading is a button that folds its dashboards away; "Collapse all" and "Expand all" do it for every driver. Everything starts open, so the page is complete without scripts. Searching, choosing a driver, or selecting a dashboard (for example from a link) opens what you asked for. The search card does not fold.
- **Viewer.** The dashboard you pick opens beside the list (below it on screens narrower than 1100px). Power BI, Spotfire and the other hosts that allow it are shown inside the page; the others (and any that fail to load) show an "Open in a new tab" button. Nothing is loaded before you pick one. On wide screens the search card and the viewer stay under the header while the list scrolls.
- **Links to one dashboard.** Picking a dashboard puts it in the address as `#dashboards/<id>` (for example `#dashboards/cabin-cleanliness`), so it can be linked to, and Back and Forward step through the choices. Going to another section with the header's links keeps the dashboard open. The old `dashboards.html` page is gone; `dashboards.html` and `dashboards.html#<id>` still lead to the section and the dashboard.
- **Which links may be framed** is decided by `dashboard-hosts.json` (a developer's list of approved hosts, not edited in the admin). A link to a host nobody approved is a build error.
- **Editing.** Add, change, remove or import dashboards in the admin's "Dashboard Management" tab, or import a CSV with `npm run dashboards:import -- path/to/Dashboards.csv` (add `--write` to apply it).

## The admin page

`/admin/` edits all the content in a browser: the site and contact details, the About us text (hero, mission, what we do, section headings, contact text), the dashboards (the Dashboard Management tab), and the whole org chart (people, titles, who reports to whom). It reads and writes the JSON files in `src/content/data/`, so those stay the one source of truth.

```bash
ADMIN_PASSWORD='a long password' npm run admin     # then open http://127.0.0.1:3001/admin/
```

It's a small Node server that serves the site and the admin together. It needs no packages beyond the site's own build tools (Vite and React):

- **The admin page is built when the server starts.** It is a small React app in `admin/src/`. The server builds it into `admin/dist/` when that folder is missing or was built from different sources (it keeps a fingerprint of their contents), then serves it from there. `npm run build:admin` builds it by hand; such a build has no fingerprint, so the server builds it once more at its next start.
- **The password is checked on the server.** Without `ADMIN_PASSWORD` (8+ characters) or `ADMIN_PASSWORD_HASH` the server refuses to start. To avoid keeping the plain password in settings, run `npm run admin:hash` and set `ADMIN_PASSWORD_HASH` to what it prints.
- **Sign-in is limited.** Five wrong passwords from one address block it for 15 minutes. The session lasts 8 hours (a cookie the page's scripts can't read, not sent from other sites) and ends when you sign out.
- **Saving checks first.** The content is validated and a trial page is built from it; a problem is shown in plain English and nothing is written. If the file changed on the server since you opened it, the save is refused so nobody overwrites anyone else.
- **Then it writes the file and rebuilds the site**, so the edit shows on the real pages in a few seconds. The previous version of each file is kept in `.admin-backups/` (the last 20).
- **Renaming a person keeps their id**, so it stays what it was.

Settings (environment variables): `PORT` (3001), `HOST` (127.0.0.1; use `0.0.0.0` to accept other machines), `TRUST_PROXY=1` behind a reverse proxy, `BASE_PATH` (asset base for rebuilds, `./`), `DIST_DIR`, `CIA_CONTENT_DIR`.

**Put HTTPS in front of it if it is reachable beyond your machine.** The server speaks plain HTTP; without HTTPS the password and the session cookie travel unencrypted. Behind a proxy that terminates HTTPS, set `TRUST_PROXY=1` so the cookie is marked secure.

**The admin does not run on GitHub Pages**, which only hosts static files, and it is not part of the published site. Edits made on an admin server change that server's files. To publish them to GitHub Pages, commit the changed JSON files in `src/content/data/` and push.

`npm run test:admin` starts the server on a copy of the content and checks the password, the API, saving, the rebuild and the editor in a browser (49 checks). `npm run test:admin:dashboards` does the same for the Dashboard Management tab, and `npm run test:dashboards` for the dashboards data and the CSV importer.

## Brand font

Neue Plak is a licensed Monotype font. The five `.woff` files in `public/fonts/` are the portal's copies; [public/fonts/README.md](public/fonts/README.md) lists them. Without them the site falls back to Barlow Condensed for headlines and Jost for text.

**This repo is public**, so pushing publishes the font files and the portal's loader GIF. Check the font license (and that sharing portal assets is fine) before you push.

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | Builds the site into `dist/`. |
| `npm run watch` | Builds again on every save. |
| `npm run serve` | Serves `dist/` at port 3001. Like GitHub Pages, a missing address gets the custom 404 page. |
| `npm run admin` | The site plus the password-protected [admin page](#the-admin-page) at `/admin/`. |
| `npm run admin:hash` | Makes a value for `ADMIN_PASSWORD_HASH`. |
| `npm run build:admin` | Builds the admin page into `admin/dist/`. `npm run admin` does this by itself when needed. |
| `npm run test:admin` | Tests the admin server and page (49 checks). |
| `npm run test:admin:dashboards` | Tests the Dashboard Management tab and how a saved change reaches the site. |
| `npm run test:dashboards` | Tests the dashboards data, its checks and the CSV importer. |
| `npm run dashboards:import -- file.csv` | Reads a CSV export of the dashboard list and reports what would change (`--write` replaces `dashboards.json`). |
| `npm run check` | Validates the content files only. |
| `npm run smoke` | Runs 72 checks on `dist/`, comparing the page with the content file: the landing page's key figures and greeting, the header's user area, people count, org shape, deck rosters, that everyone appears, links, ids, button names, relative paths. On both pages it also checks titles, meta descriptions, icons, the logo link, real `mailto:`/`tel:` links, placeholder text and the copyright year, that the Dashboards section lists every dashboard once under foldable drivers, that there are no projects and no "At a glance" row left, and that the three sticky heading bars are there. |
| `npm run verify` | Runs `check`, `build` and `smoke`. |
| `npm run shots` | Takes screenshots at 5 screen sizes into `.shots/` and runs 119 checks in Chromium: the loading globe, the landing page (two thirds and a third, the greeting above the figures, the headline in its column, every figure in order, fitting the first screen on a laptop, stacked on a tablet and a phone), the header's user area (placement, order, the placeholder messages, the copy in the phone menu), the largest roster and the dashboards' search card and viewer fitting at 1280×720, nav, deck, panel, resize, keyboard focus, deep links, the fixed header, the org chart opening members (one level, nested, the lines, the highlight, the profile button, the keyboard, the tree layout), the locked section headings (through the org chart, the whole pinned deck, the dashboards, and on a phone), the Dashboards section (choosing, keeping the choice through header links, folding drivers, searching, links to one dashboard, the old `dashboards.html` address, phones), the mobile menu, copy success and error messages, no sideways overflow from 320px to 1440px, and the 404 page. |
| `npm run dev` | Vite dev server. It works only on direct `localhost`, not through the code-server proxy. |

**Headless browser.** `npm run shots` uses a headless Chromium stored in `../.tools/`, outside this folder. The machine lacks Chromium's system libraries, so they were unpacked there without root:

```bash
npx playwright install --only-shell chromium   # with PLAYWRIGHT_BROWSERS_PATH=../.tools/ms-playwright
apt-get download <libs> && dpkg -x <deb> ../.tools/sysroot
```

**Slow startup.** Every Node command starts slowly on this code server, about 10 s, even `node -e 1`. Builds themselves take about 1 s.

## How it's built

- **React, rendered at build time.** Every section is a React component (`src/sections/`, `src/components/`). `plugins/prerender.js` renders both pages with React (`src/entry-server.jsx`) into `index.html` and `404.html` at build time, in a worker thread so watch mode always uses the latest files, and adds the content as a small JSON block (`#page-data`). In the browser, `src/main.jsx` hydrates the same components from it. The page is fully readable without JavaScript.
- **Motion** lives in `src/motion/` and starts once the page has hydrated (`src/hooks/useSiteMotion.js`). Lenis handles smooth scrolling, driven by GSAP's ticker, and GSAP's ScrollTrigger and SplitText handle the animations.
  - Pinning, which keeps a section fixed while you scroll, is used only on screens at least 1024 × 700.
  - The team deck pins on screens at least 1180 × 720. Elsewhere it stacks. (The Dashboards section never pins: its search card and viewer stick under the header on screens from 1100px, with plain CSS.)
  - With *reduced motion* turned on, there is no smooth scrolling, loader, pinning or scroll-scrubbing.
  - **Locked headings.** The org chart ("Who we are"), the team deck ("Meet the teams") and the Dashboards each keep their title in sight while you scroll through them: once the big heading has scrolled away, a compact bar with the same words sticks under the header until the section ends (`src/components/StickyHead.jsx`; plain CSS `position: sticky`, plus a small hook that shows the bar only when it is needed). It takes 44px on phones and 52px on desktop (`--bar-h`), and the pinned deck and the dashboards' search card and viewer start below it. It repeats the real heading, so screen readers skip it.
  - `?motion=off` in the URL forces the same.
- **Header (portal style).** A fixed black bar with the globe and team name (which link back to the top), then the section links in a navy bar; the link for the section on screen is underlined. In-page links land just below the header. At the right of the black bar is a **user area, a placeholder** until sign-in exists: a bell, the name "Chaitanya Bisht" with a person icon, and a Logout button. The bell and Logout only show a note ("not connected yet"); nobody is signed in or out. The name lives in one place, `src/utils/user.js`, and also greets the visitor on the landing page. Up to 1024px the bar is 64px and the links, with a copy of the user area at their end, move into a full-screen black menu behind the Menu button. Esc or picking a link closes it. Without JavaScript the navy link bar stays visible.
- **Loader (portal style).** The portal's spinning globe GIF over a dimmed page, until the fonts and page have loaded (4 seconds at most). It fades in only if loading takes more than a moment, and is skipped for deep links (`#team`) and reduced motion.
- **Footer (portal style).** Link columns on dark blue (Explore, Get in touch, Locations), a divider, then the copyright and the white logo. The big "Let's find the answer" statement above it is the Contact section.
- **Messages.** Copy buttons and profiles report back in a small message at the bottom of the screen: "Email address copied", or an error that spells out the address when the browser blocks copying. Messages go to a live region, so screen readers announce them.
- **404 page (portal style).** `404.html` has the same header and footer, breadcrumbs on desktop, and the portal's centered "404 / Page Not Found / Go to Home".
- **Themes.** As you scroll, sections switch the page theme. Light uses Light Tonal Gray, dark uses Dark Blue, and brand uses United Blue. The colors crossfade.
- **Accessibility.**
  - Every person is a button that opens a native `<dialog>`, which traps focus and closes with Esc.
  - Inactive deck steps are `inert`.
  - In-page links move focus to the target heading.
  - The org chart is a nested list with labelled groups and a color legend.
  - Organization colors always appear next to the organization name, never on their own.

**Palette notes.**

- **Hex values.** Where the brand sheet's RGB and hex disagreed, the hex value is used:
  - Medium Blue #276EF1
  - Medium Tonal Gray #D7D7D4
  - Dark Tonal Gray #B7B7B7
  - Light Green #DCFAE6
- **Contrast.** The sub-team marks pass contrast (at least 3:1) and color-blind separation on both light and dark backgrounds.
- **Visual weight.** Yellow-green and burgundy fall outside the ideal lightness and saturation range. The brand has no mid-tone shades for those families, which is why labels always accompany the colors.

## Structure

```
src/content/data/*.json       the content (edit these, or use the admin page)
src/content/site-content.js   reads the content files into one object
src/content/files.js          which sections belong to which file
src/lib/                      model (derives the org), validation, palette
src/entry-server.jsx          build-time rendering of both pages: head tags, markup, page data
src/main.jsx, not-found.jsx   the browser entries: styles, then hydration
src/pages/ src/sections/      the two pages and their sections (React components)
src/components/               header, footer, profile panel, messages, buttons, avatars, the dashboard list and viewer
src/context/ src/hooks/       shared state (scroller, messages, profile panel, in-page links), hooks
src/motion/                   motion and scroll behavior (GSAP, Lenis)
src/utils/                    formatting, copying, page data, nav links
src/styles/                   tokens, base, components, sections
admin/                        the admin page: React (admin/src/), built into admin/dist/
plugins/prerender.js          build-time rendering (index.html and 404.html)
scripts/                      check, smoke test, screenshots, admin server and its tests
public/fonts/ public/people/  brand font slot, optional photos
public/brand/                 header globe mark, white logo (footer) and the link-preview image
public/loaders/               the portal's loading globe GIF
public/favicon.*              favicon (.ico and .png) and apple-touch-icon.png, from the logo's globe
```
