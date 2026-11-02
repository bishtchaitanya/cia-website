// Fallback fonts (bundled locally; Neue Plak takes over when its files are added).
import '@fontsource-variable/jost';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/sections/intro.css';
import '../styles/sections/team.css';
import '../styles/sections/work.css';
import '../styles/sections/footer.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { createScroller } from './motion/scroller.js';
import { initFit, runIntro } from './motion/intro.js';
import { initThemes, initNavActive, initNavVisibility, initProgress, initCursor } from './motion/chrome.js';
import { initHeadlines, initStatement, initPillars, initStats } from './motion/reveals.js';
import { initOrg } from './motion/org.js';
import { initDeck } from './motion/deck.js';
import { initProjects } from './motion/projects.js';
import { initPanel } from './ui/panel.js';
import { initAnchors, restoreHash } from './ui/anchors.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const forcedOff = /[?&]motion=off\b/.test(location.search); // handy for demos and screenshots
const motionAtLoad = !forcedOff && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Layout and interaction that work with or without motion.
const scroller = createScroller({ smooth: motionAtLoad });
const refit = initFit();
const org = initOrg();
initPanel({ scroller });
initAnchors({ scroller });
initProgress(scroller);
initNavVisibility(scroller);

// Motion, by breakpoint and preference. Pins are created first (in page order) so every
// later trigger measures the page with the pinned scroll lengths in place.
const mm = gsap.matchMedia();
mm.add(
  {
    desktop: '(min-width: 1024px) and (min-height: 700px)',
    // The deck lists many teams and rosters, so it pins only when there is room for them.
    deckRoom: '(min-width: 1180px) and (min-height: 720px)',
    wide: '(min-width: 1024px)',
    motion: '(prefers-reduced-motion: no-preference)',
  },
  (ctx) => {
    const motion = Boolean(ctx.conditions.motion) && !forcedOff;
    root.classList.toggle('motion-ok', motion);
    root.classList.toggle('motion-off', !motion);
    const pin = Boolean(ctx.conditions.desktop) && motion;

    const cleanups = [initDeck({ scroller, pin: pin && Boolean(ctx.conditions.deckRoom) }), initProjects({ scroller, pin, motion }), initThemes(), initNavActive()];
    if (motion) {
      cleanups.push(
        initHeadlines(),
        initStatement(),
        initPillars({ desktop: Boolean(ctx.conditions.wide) }),
        initStats(),
        org ? org.animate() : () => {},
        initCursor(),
      );
    }
    return () => cleanups.forEach((fn) => fn?.());
  },
);

runIntro({ scroller, motion: motionAtLoad });
root.dataset.ready = 'true';

// ?debug exposes handles for the screenshot script (scripts/shots.mjs).
if (/[?&]debug\b/.test(location.search)) window.__site = { scroller, ScrollTrigger, gsap };

document.fonts?.ready.then(() => {
  refit();
  ScrollTrigger.refresh();
});
window.addEventListener(
  'load',
  () => {
    ScrollTrigger.refresh();
    requestAnimationFrame(() => restoreHash(scroller));
  },
  { once: true },
);
