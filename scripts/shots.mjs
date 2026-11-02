#!/usr/bin/env node
/*
 * Best-effort screenshots of dist/ with headless Chromium (Playwright).
 *   npm run build && npm run shots          -> PNGs in .shots/
 * Browser + libraries live in ../.tools (see README, "Screenshots").
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.join(root, '.shots');
const tools = path.resolve(root, '..', '.tools');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(tools, 'ms-playwright');
const libs = [path.join(tools, 'sysroot/usr/lib/x86_64-linux-gnu'), path.join(tools, 'sysroot/lib/x86_64-linux-gnu')].join(':');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i -D playwright');
  process.exit(1);
}
if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.map': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(dist, url.endsWith('/') ? `${url}index.html` : url);
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  env: { ...process.env, LD_LIBRARY_PATH: [libs, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
});
const problems = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(viewport, { query = '?debug', reducedMotion = 'no-preference', loader = false } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`${viewport.width}px console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`${viewport.width}px pageerror: ${e.message}`));
  if (!loader) await page.addInitScript(() => sessionStorage.setItem('ciaLoaderSeen', '1'));
  await page.goto(base + query, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await wait(1800);
  return { page, context };
}

/** Scroll to a y position (or a pin progress) and let animations settle. */
async function scrollTo(page, y, settle = 1300) {
  await page.evaluate((top) => {
    const s = window.__site;
    if (s?.scroller?.lenis) s.scroller.scrollTo(top, { immediate: true });
    else window.scrollTo(0, top);
  }, y);
  await wait(settle);
}
const yOf = (page, selector, offset = 0) =>
  page.evaluate(([sel, off]) => document.querySelector(sel).getBoundingClientRect().top + window.scrollY + off, [selector, offset]);
const pinY = (page, selector, progress) =>
  page.evaluate(([sel, p]) => {
    const st = window.__site.ScrollTrigger.getAll().find((t) => t.pin && t.trigger.matches(sel));
    return st ? st.start + p * (st.end - st.start) : null;
  }, [selector, progress]);

async function shot(page, name) {
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(`  ${name}.png`);
}

try {
  // 1. Desktop, motion on
  console.log('desktop 1440×900');
  {
    const { page, context } = await open({ width: 1440, height: 900 });
    await shot(page, 'd01-hero');
    await scrollTo(page, (await yOf(page, '.mission')) + 900 * 0.75, 1500);
    await shot(page, 'd02-mission');
    await scrollTo(page, (await yOf(page, '.pillars')) + 900 * 0.9);
    await shot(page, 'd03-pillars');
    await scrollTo(page, (await yOf(page, '.stats')) - 120, 2200);
    await shot(page, 'd04-stats');
    await scrollTo(page, (await yOf(page, '.team .legend')) - 160, 1800);
    await shot(page, 'd05-org');
    await page.hover('.org-node--manager');
    await wait(500);
    await shot(page, 'd06-org-highlight');
    // Steps: 0 leadership, then each team in order (4 is the largest roster, 8 has three managers).
    const n = await page.evaluate(() => document.querySelectorAll('.deck-step').length);
    for (const i of [...new Set([0, 3, 4, 8, n - 1])]) {
      const y = await pinY(page, '[data-deck-stage]', (Math.min(i, n - 1) + 0.5) / n);
      if (y != null) {
        await scrollTo(page, y, 1400);
        await shot(page, `d07-deck-step${i}`);
      }
    }
    for (const [label, p] of [['start', 0.02], ['mid', 0.5], ['end', 0.99]]) {
      const y = await pinY(page, '[data-work-stage]', p);
      if (y != null) {
        await scrollTo(page, y, 1600);
        await shot(page, `d08-work-${label}`);
      }
    }
    await scrollTo(page, await page.evaluate(() => document.documentElement.scrollHeight), 1800);
    await shot(page, 'd09-footer');
    await scrollTo(page, (await yOf(page, '.team .legend')) - 160, 900);
    await page.click('.org-node--member');
    await wait(900);
    await shot(page, 'd10-panel');
    await page.keyboard.press('Escape');
    await wait(900);
    const closed = await page.evaluate(() => !document.querySelector('[data-panel]').open);
    if (!closed) problems.push('panel did not close on Escape');
    await context.close();
  }

  // 2. Loader (first visit)
  console.log('loader');
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '?debug', { waitUntil: 'load' });
    await wait(1300);
    await shot(page, 'l01-loader');
    await wait(2600);
    await shot(page, 'l02-after-loader');
    await context.close();
  }

  // 3. Laptop 1366×768
  console.log('laptop 1366×768');
  {
    const { page, context } = await open({ width: 1366, height: 768 });
    await shot(page, 'm01-hero');
    const n = await page.evaluate(() => document.querySelectorAll('.deck-step').length);
    const deck = await pinY(page, '[data-deck-stage]', Math.min(4, n - 1) / n + 0.5 / n);
    if (deck != null) {
      await scrollTo(page, deck, 1400);
      await shot(page, 'm02-deck');
    }
    const work = await pinY(page, '[data-work-stage]', 0.3);
    if (work != null) {
      await scrollTo(page, work, 1500);
      await shot(page, 'm03-work');
    }
    await context.close();
  }

  // 3b. Smallest laptop that still pins the deck: the largest roster has to fit.
  console.log('small laptop 1280×720');
  {
    const { page, context } = await open({ width: 1280, height: 720 });
    const n = await page.evaluate(() => document.querySelectorAll('.deck-step').length);
    for (const i of [4, 8]) {
      const y = await pinY(page, '[data-deck-stage]', (i + 0.5) / n);
      if (y != null) {
        await scrollTo(page, y, 1400);
        await shot(page, `s-deck-step${i}`);
        const fit = await page.evaluate(() => {
          const stage = document.querySelector('[data-deck-stage]').getBoundingClientRect();
          const list = document.querySelector('.deck-step.is-active .deck-people').getBoundingClientRect();
          const steps = document.querySelector('.deck__steps');
          return { top: Math.round(list.top - stage.top), bottom: Math.round(stage.bottom - list.bottom), overflow: steps.scrollHeight > steps.clientHeight + 1 };
        });
        const ok = fit.top >= 56 && fit.bottom >= 0 && !fit.overflow;
        console.log(`  ${ok ? '✔' : '✖'} step ${i} roster fits at 1280×720 (${fit.top}px below the top, ${fit.bottom}px above the bottom)`);
        if (!ok) problems.push(`deck step ${i} roster does not fit at 1280×720`);
      }
    }
    await context.close();
  }

  // 4. Reduced motion, full page
  console.log('reduced motion');
  {
    const { page, context } = await open({ width: 1440, height: 900 }, { reducedMotion: 'reduce' });
    await page.screenshot({ path: path.join(out, 'r01-reduced-full.png'), fullPage: true });
    console.log('  r01-reduced-full.png');
    await context.close();
  }

  // 5. Tablet + phone
  for (const [name, vp] of [['t', { width: 820, height: 1180 }], ['p', { width: 390, height: 844 }]]) {
    console.log(`${name === 't' ? 'tablet' : 'phone'} ${vp.width}×${vp.height}`);
    const { page, context } = await open(vp);
    await shot(page, `${name}01-hero`);
    for (const sel of ['.pillars', '.team', '.people', '.work', '.footer']) {
      await scrollTo(page, (await yOf(page, sel)) + 40, 1300);
      await shot(page, `${name}-${sel.slice(1)}`);
    }
    await scrollTo(page, (await yOf(page, '.team .org')) - 100, 900);
    await page.click('.org__toggle');
    await wait(600);
    await shot(page, `${name}-org-expanded`);
    await page.click('.org-node--leader');
    await wait(900);
    await shot(page, `${name}-panel`);
    await context.close();
  }
  // 6. Interaction checks (recorded as problems when they fail)
  console.log('interaction checks');
  {
    const expect = (ok, message) => {
      console.log(`  ${ok ? '✔' : '✖'} ${message}`);
      if (!ok) problems.push(`check failed: ${message}`);
    };
    const { page, context } = await open({ width: 1440, height: 900 });

    // Nav link scrolls to the section and moves focus to its heading.
    await page.click('.pillnav__link[href="#team"]');
    await wait(2200);
    const nav = await page.evaluate(() => ({
      top: Math.round(document.getElementById('team').getBoundingClientRect().top),
      focus: document.activeElement?.id,
      hash: location.hash,
    }));
    expect(Math.abs(nav.top) < 4, `nav "Team" scrolls to #team (section top at ${nav.top}px)`);
    expect(nav.focus === 'team-title', `focus moves to the Team heading (got "${nav.focus}")`);
    expect(nav.hash === '#team', 'URL hash updates to #team');

    // Deck: jump buttons change the step; inactive steps are inert.
    const y0 = await pinY(page, '[data-deck-stage]', 0.02);
    await scrollTo(page, y0, 900);
    await page.focus('[data-deck-jump="3"]');
    await page.keyboard.press('Enter');
    await wait(1800);
    const deck = await page.evaluate(() => ({
      current: document.querySelector('.deck-step[aria-current="step"]')?.dataset.step,
      inertOthers: [...document.querySelectorAll('.deck-step:not([aria-current]) .deck-step__card')].every((el) => el.inert),
    }));
    expect(deck.current === '3', `deck jump to step 4 (aria-current on step ${Number(deck.current) + 1})`);
    expect(deck.inertOthers, 'inactive deck steps are inert');

    // Panel: open from a deck mini card, follow "Reports to", close with Escape, focus returns.
    await page.click('.deck-step[aria-current="step"] .mini');
    await wait(900);
    const opened = await page.evaluate(() => document.querySelector('#panel-name')?.textContent);
    await page.click('.panel__block .panel__person');
    await wait(500);
    const swapped = await page.evaluate(() => document.querySelector('#panel-name')?.textContent);
    expect(opened && swapped && opened !== swapped, `"Reports to" swaps the profile (${opened} → ${swapped})`);
    await page.keyboard.press('Escape');
    await wait(900);
    const after = await page.evaluate(() => ({
      open: document.querySelector('[data-panel]').open,
      focusIsMini: document.activeElement?.classList.contains('mini'),
      stopped: document.documentElement.classList.contains('lenis-stopped'),
    }));
    expect(!after.open, 'Escape closes the panel');
    expect(after.focusIsMini, 'focus returns to the button that opened the panel');
    expect(!after.stopped, 'page scrolling resumes after closing');

    // Resize to tablet: pins are removed and layouts stack.
    await page.setViewportSize({ width: 820, height: 1180 });
    await wait(1500);
    const tablet = await page.evaluate(() => ({
      deckPinned: document.querySelector('[data-deck]').classList.contains('is-pinned'),
      workPinned: document.querySelector('.work').classList.contains('is-pinned'),
      orgChart: document.querySelector('[data-org]').classList.contains('is-chart'),
      pins: window.__site.ScrollTrigger.getAll().filter((t) => t.pin).length,
    }));
    expect(!tablet.deckPinned && !tablet.workPinned && tablet.pins === 0, 'resizing to tablet removes both pins');
    expect(!tablet.orgChart, 'org chart switches to the compact tree on tablet');
    await page.setViewportSize({ width: 1440, height: 900 });
    await wait(1500);
    const back = await page.evaluate(() => ({
      pins: window.__site.ScrollTrigger.getAll().filter((t) => t.pin).length,
      orgChart: document.querySelector('[data-org]').classList.contains('is-chart'),
    }));
    expect(back.pins === 2 && back.orgChart, 'resizing back to desktop restores pins and the chart');

    // Keyboard focus on an off-screen project card brings it into view.
    const w0 = await pinY(page, '[data-work-stage]', 0);
    await scrollTo(page, w0, 900);
    // Cards with no people or link have nothing to focus, so give this one a button to test with.
    await page.evaluate(() => {
      const card = document.querySelector('[data-project]:nth-child(7)');
      if (card.querySelector('a, button')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'test';
      card.querySelector('.project__foot').appendChild(b);
    });
    await page.focus('[data-project]:nth-child(7) a, [data-project]:nth-child(7) button');
    await wait(700);
    const card = await page.evaluate(() => {
      const r = document.querySelector('[data-project]:nth-child(7)').getBoundingClientRect();
      const stage = document.querySelector('[data-work-stage]');
      return { left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, stageScroll: stage.scrollLeft };
    });
    expect(card.left >= 0 && card.right <= card.vw && card.stageScroll === 0, `focused 7th project card is in view (${card.left}–${card.right}px of ${card.vw})`);

    // Wheel scrolling hides the nav going down and shows it going up.
    await scrollTo(page, (await yOf(page, '.pillars')) + 200, 600);
    await page.mouse.move(700, 600);
    await page.mouse.wheel(0, 500);
    await wait(900);
    const hiddenDown = await page.evaluate(() => document.querySelector('[data-header]').classList.contains('is-hidden'));
    await page.mouse.wheel(0, -300);
    await wait(900);
    const shownUp = await page.evaluate(() => !document.querySelector('[data-header]').classList.contains('is-hidden'));
    expect(hiddenDown && shownUp, 'nav hides on scroll down and returns on scroll up');
    await context.close();
  }

  // Deep link: loading with #work lands on the projects section.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base + '?debug#work', { waitUntil: 'load' });
    await wait(2500);
    const top = await page.evaluate(() => Math.round(document.getElementById('work').getBoundingClientRect().top));
    const loaderGone = await page.evaluate(() => !document.querySelector('[data-loader]'));
    const ok = Math.abs(top) < 4 && loaderGone;
    console.log(`  ${ok ? '✔' : '✖'} deep link #work lands on Projects without the loader (top at ${top}px)`);
    if (!ok) problems.push('deep link #work did not land on Projects');
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exitCode = 1;
} else {
  console.log('\nNo console errors.');
}
