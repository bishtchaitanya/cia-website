/*
 * Hero headline fitting (layout) and the intro: Lenis-style loader where the
 * short name's letters rise one by one, then the overlay slides up and the hero
 * lines rise out of their masks.
 */
import { gsap } from 'gsap';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Size the hero headline so its longest line fills the container width. */
export function initFit() {
  const title = document.querySelector('[data-fit]');
  if (!title) return () => {};
  const lines = [...title.querySelectorAll('.hero__line')];
  let lastWidth = 0;
  const fit = () => {
    title.style.removeProperty('--fit-size');
    if (window.innerWidth < 600) return;
    const available = title.clientWidth;
    const widest = Math.max(...lines.map((l) => l.offsetWidth));
    if (!available || !widest) return;
    const base = parseFloat(getComputedStyle(title).fontSize);
    const size = Math.min((base * available) / widest, 440) * 0.995;
    title.style.setProperty('--fit-size', `${size.toFixed(2)}px`);
  };
  fit();
  const ro = new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w !== lastWidth) {
      lastWidth = w;
      fit();
    }
  });
  ro.observe(title.parentElement);
  return fit;
}

function heroTimeline() {
  const lines = gsap.utils.toArray('[data-hero-line]');
  const reveals = gsap.utils.toArray('[data-hero-reveal]');
  const marks = gsap.utils.toArray('.hero mark');
  return gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.2 })
    .to(reveals, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.35)
    .to(marks, { '--mark-size': '100%', duration: 1, ease: 'expo.inOut', stagger: 0.15 }, 0.8);
}

/**
 * @param {{ scroller: ReturnType<import('./scroller.js').createScroller>, motion: boolean }} opts
 */
export async function runIntro({ scroller, motion }) {
  const root = document.documentElement;
  const loader = document.querySelector('[data-loader]');
  const useLoader = motion && loader && !root.classList.contains('no-loader');

  if (!motion) {
    root.classList.add('is-ready');
    loader?.remove();
    return;
  }

  // Take over the pre-JS holding state with identical inline values, then release the CSS.
  // y: 0 matters: GSAP would otherwise read the CSS holding transform as a px offset
  // and keep it after yPercent animates back to 0.
  gsap.set('[data-hero-line]', { y: 0, yPercent: 105 });
  gsap.set('[data-hero-reveal]', { autoAlpha: 0, y: 20 });
  gsap.set('.hero mark', { '--mark-size': '0%' });
  root.classList.add('is-ready');

  if (!useLoader) {
    loader?.remove();
    heroTimeline();
    return;
  }

  loader.style.animation = 'none'; // cancel the CSS failsafe; JS is in charge now
  root.classList.add('is-loading');
  scroller.stop();
  window.scrollTo(0, 0);
  const chars = loader.querySelectorAll('.loader__char');
  const caption = loader.querySelector('.loader__caption');
  gsap.set(chars, { yPercent: 110 });
  gsap.set(caption, { autoAlpha: 0, y: 12 });

  await Promise.race([document.fonts?.ready, wait(1200)]);

  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .to(chars, { yPercent: 0, duration: 1.5, stagger: 0.075 })
    .to(caption, { autoAlpha: 1, y: 0, duration: 1 }, 0.35)
    .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 1.25)
    .add(heroTimeline(), 1.75)
    .add(() => root.classList.remove('is-loading'), 1.3)
    .add(() => {
      loader.remove();
      scroller.start();
      try {
        sessionStorage.setItem('ciaLoaderSeen', '1');
      } catch {
        /* private mode: the loader simply plays again next time */
      }
    }, 2.4);
}
