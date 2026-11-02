# Customer Insights & Analytics: team site

A single-page site in three parts:

1. **Intro**: the hero, the mission statement, what the team does, and key numbers.
2. **Meet the team**: the org chart (managing director, directors and their direct reports), a deck that steps through leadership and each team, and a profile panel for every person.
3. **Projects**: cards that scroll sideways as you scroll down.

It is inspired by [lenis.dev](https://lenis.dev/) and Google's [Team USA](https://sports.withgoogle.com/teamusa/) site. It uses the brand palette and the Neue Plak typeface.

**The people are real; the intro copy and projects are placeholders.** Everything lives in one file: [`src/content/site-content.js`](src/content/site-content.js). People currently have only a name and job title, so profiles show those and who they report to.

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

## Editing content

1. In one terminal, run `npm run watch`. It rebuilds whenever you save.
2. In a second terminal, run `npm run serve`.
3. Edit `src/content/site-content.js` and save. Then hard-refresh the browser.

`npm run check` reports content problems in plain English, for example: `color "purpel" is not one of blue, red, … Did you mean "purple"?`. The build stops with the same report.

**People and reporting lines** come from nesting. You never write "reports to":

```
leaders             the top of the org (the Managing Director)
 └ subTeams         the organizations under a leader: one per Director
    ├ manager       the Director
    └ members       the Director's direct reports
       └ reports    anyone's direct reports, nested as deep as you like
```

- **Org chart:** the leader, each Director, and the Director's direct reports. People who lead a team show how many people are below them.
- **Deck ("Meet the teams"):** a Leadership step, then one step for each member who has `reports`. The step lists everyone below that person, with managers shown above their own people. A sub-team whose members have no reports gets one step of its own.
- **Profiles:** open from anywhere. "Reports to" and "Direct reports" move through the whole tree.

| Field | Notes |
|---|---|
| `name`, `role` | Required for every person. The person's id is made from their name, e.g. `priya-raman`. If two people share a name, give one an `id: 'priya-raman-2'`. |
| `reports` | A list of the people who report to this person. A member with `reports` leads a team. |
| `team`, `teamMission` | Optional, for someone who leads a team: its name (default "Name's team") and the line under it in the deck. |
| `bio`, `skills`, `funFact`, `email`, `chat`, `location` | Shown in the profile panel. |
| `photo` | Optional. Put a square image in `public/people/` and set `photo: 'people/priya-raman.jpg'`. Without a photo, the person's initials are shown. |
| sub-team `color` | One of `blue`, `red`, `purple`, `yellow`, `burgundy`, `green`, from the secondary palette. Everyone in the organization, and their team, uses it. |
| project `subTeam` | Optional. A sub-team id, or the id of someone who leads a team (like `carleton-smith`). It adds a colored chip. |
| project `people` | Optional person ids. A typo gets a "did you mean" suggestion. |
| project `art` | Generated cover style: `sparkline`, `wave`, `bars`, `dots`, `funnel` or `rings`. |
| `stats` | Numbers or `auto:people` / `auto:teams` / `auto:subTeams` / `auto:projects`, which are counted for you. `placeholder: true` adds an asterisk. |

**Size limits.** The chart is designed for up to 6 direct reports per Director. Teams of any size fit the deck: past 6 people the list switches to a denser two-column layout, which fits 22 people on a 1280×720 screen.

**Pinning.** The deck pins and scrolls through its steps on screens at least 1180 × 720. Smaller desktop windows show the steps stacked, because the list of teams and the rosters need the room.

## Brand font

Neue Plak is a licensed Monotype font. Add the `.woff2` files to `public/fonts/`; [public/fonts/README.md](public/fonts/README.md) lists the file names. Then run `npm run build`.

Until the files are there, the site uses free fallbacks: Barlow Condensed for headlines and Jost for text.

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | Builds the site into `dist/`. |
| `npm run watch` | Builds again on every save. |
| `npm run serve` | Serves `dist/` at port 3001. |
| `npm run check` | Validates the content file only. |
| `npm run smoke` | Runs 27 structural checks on `dist/`, comparing the page with the content file: people count, org shape, deck rosters, that everyone appears, links, ids, button names, relative paths. |
| `npm run verify` | Runs `check`, `build` and `smoke`. |
| `npm run shots` | Takes screenshots at 5 screen sizes into `.shots/`, checks the largest roster fits at 1280×720, and runs 15 interaction checks (nav, deck, panel, resize, keyboard focus, deep links). |
| `npm run dev` | Vite dev server. It works only on direct `localhost`, not through the code-server proxy. |

**Headless browser.** `npm run shots` uses a headless Chromium stored in `../.tools/`, outside this folder. The machine lacks Chromium's system libraries, so they were unpacked there without root:

```bash
npx playwright install --only-shell chromium   # with PLAYWRIGHT_BROWSERS_PATH=../.tools/ms-playwright
apt-get download <libs> && dpkg -x <deb> ../.tools/sysroot
```

**Slow startup.** Every Node command starts slowly on this code server, about 10 s, even `node -e 1`. Builds themselves take about 1 s.

## How it's built

- **Content in the HTML.** `plugins/prerender.js` renders every section from the content file into `index.html` at build time, in a worker thread so watch mode always uses the latest files. The page is fully readable without JavaScript.
- **Motion** lives in `src/js/motion/`. Lenis handles smooth scrolling, driven by GSAP's ticker, and GSAP's ScrollTrigger and SplitText handle the animations.
  - Pinning, which keeps a section fixed while you scroll, is used only on screens at least 1024 × 700.
  - The projects track pins there, and the deck pins on screens at least 1180 × 720. Elsewhere they stack.
  - With *reduced motion* turned on, there is no smooth scrolling, loader, pinning or scroll-scrubbing.
  - `?motion=off` in the URL forces the same.
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
src/content/site-content.js   the content (edit this)
src/lib/                      model (derives the org), validation, palette
src/render/                   HTML templates for each section, avatars, cover art, profile panel
src/js/                       motion and interaction (main.js is the entry)
src/styles/                   tokens, base, components, sections
plugins/prerender.js          build-time rendering
scripts/                      check, smoke test, screenshots
public/fonts/ public/people/  brand font slot, optional photos
```
