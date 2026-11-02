/*
 * One scrolling API for the whole page. With motion allowed it is Lenis, driven by
 * GSAP's ticker so ScrollTrigger and Lenis share a frame. With reduced motion it
 * is native scrolling (Lenis would still smooth the wheel), with the same methods.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const expo = (t) => Math.min(1, 1.001 - 2 ** (-10 * t));

function resolveY(target, offset = 0) {
  if (typeof target === 'number') return target + offset;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return null;
  return el.getBoundingClientRect().top + window.scrollY + offset;
}

export function createScroller({ smooth }) {
  const listeners = new Set();
  const emit = (state) => listeners.forEach((fn) => fn(state));
  let lenis = null;

  if (smooth) {
    lenis = new Lenis({ autoRaf: false, duration: 1.2, easing: expo, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', (l) => emit({ scroll: l.scroll, progress: l.progress || 0, direction: l.direction }));
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    let last = window.scrollY;
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const direction = y > last ? 1 : y < last ? -1 : 0;
        last = y;
        emit({ scroll: y, progress: max > 0 ? y / max : 0, direction });
      },
      { passive: true },
    );
  }

  return {
    lenis,
    smooth: Boolean(lenis),
    /** Subscribe to scroll updates; returns an unsubscribe function. */
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    scrollTo(target, opts = {}) {
      if (lenis) {
        lenis.scrollTo(target, { force: true, ...opts });
        return;
      }
      const y = resolveY(target, opts.offset);
      if (y == null) return;
      window.scrollTo({ top: y, behavior: 'auto' });
      opts.onComplete?.();
    },
    stop() {
      if (lenis) lenis.stop();
      else document.documentElement.style.overflow = 'hidden';
    },
    start() {
      if (lenis) lenis.start();
      else document.documentElement.style.overflow = '';
    },
    get scroll() {
      return lenis ? lenis.scroll : window.scrollY;
    },
  };
}
