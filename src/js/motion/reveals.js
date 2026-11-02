/*
 * Scroll reveals: masked line-by-line headlines (Lenis), the scroll-lit mission
 * statement (Team USA), pillar emphasis, and stat count-ups.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { compactNumber } from '../../render/util.js';

/** Headlines rise line by line out of masks once they are in view. */
export function initHeadlines() {
  const splits = gsap.utils.toArray('[data-reveal-lines]').map((el) =>
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      tag: 'span',
      aria: 'auto',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }),
    }),
  );
  gsap.utils.toArray('[data-reveal-masked]').forEach((el) => {
    gsap.from(el.querySelectorAll('[data-line]'), {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.15,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
  return () => splits.forEach((s) => s.revert());
}

/** Characters light up with scroll, led by an accent-colored edge. */
export function initStatement() {
  const el = document.querySelector('[data-lit]');
  const section = el?.closest('.mission');
  if (!el || !section) return () => {};
  const split = SplitText.create(el, {
    type: 'words,chars',
    wordsClass: 'lit-word',
    charsClass: 'lit-char',
    tag: 'span',
    aria: 'none', // the statement is read from its sr-only copy
    autoSplit: true,
    onSplit: (self) => {
      gsap.set(self.chars, { '--lit': 0, '--flash': 0 });
      return gsap
        .timeline({
          scrollTrigger: { trigger: section, start: 'top 45%', end: 'bottom 85%', scrub: 0.6 },
        })
        .to(self.chars, {
          keyframes: { '--lit': [0, 1], '--flash': [0, 1, 0], easeEach: 'none' },
          duration: 1,
          ease: 'none',
          stagger: 0.05,
        });
    },
  });
  return () => split.revert();
}

/** Nearest pillar is emphasized; others dim (desktop, where the heading is sticky). */
export function initPillars({ desktop }) {
  const section = document.querySelector('.pillars');
  if (!section) return () => {};
  const items = gsap.utils.toArray('[data-pillar]');
  items.forEach((item) =>
    gsap.from(item, { y: 24, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: item, start: 'top 90%', once: true } }),
  );
  if (!desktop) return () => {};
  section.classList.add('is-live');
  const triggers = items.map((item) =>
    ScrollTrigger.create({ trigger: item, start: 'top 62%', end: 'bottom 38%', toggleClass: 'is-current' }),
  );
  return () => {
    section.classList.remove('is-live');
    items.forEach((i) => i.classList.remove('is-current'));
    triggers.forEach((t) => t.kill());
  };
}

/** Format a running value in the same unit as its final value (1.2M counts 0.1M, 0.2M, ...). */
function formatterFor(target) {
  const abs = Math.abs(target);
  if (abs >= 1e9) return (v) => `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (abs >= 1e6) return (v) => `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1e4) return (v) => `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return (v) => Math.round(v).toLocaleString('en-US');
}

export function initStats() {
  const nums = gsap.utils.toArray('.stat__num[data-count]');
  nums.forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const format = formatterFor(target);
    const state = { v: 0 };
    el.textContent = format(0);
    gsap.to(state, {
      v: target,
      duration: 1.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => {
        el.textContent = format(state.v);
      },
      onComplete: () => {
        el.textContent = compactNumber(target);
      },
    });
  });
  return () => nums.forEach((el) => (el.textContent = compactNumber(parseFloat(el.dataset.count))));
}
