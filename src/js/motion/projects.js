/*
 * Projects: on desktop with motion the stage pins and vertical scroll moves the
 * card track sideways (both inspiration sites). Covers draw in as cards arrive.
 * Elsewhere the cards sit in a grid and covers draw in on scroll (or stay static).
 */
import { gsap } from 'gsap';
import { pad2 } from '../../render/util.js';

/** Draw-in for one generated cover. */
function coverTimeline(card, scrollTrigger) {
  const svg = card.querySelector('[data-art]');
  if (!svg) return null;
  const draws = svg.querySelectorAll('.art-draw');
  draws.forEach((p) => {
    const len = parseFloat(p.dataset.len || '1');
    gsap.set(p, { strokeDasharray: `${len} 1`, strokeDashoffset: len });
  });
  const tl = gsap.timeline({ scrollTrigger: { ...scrollTrigger, toggleActions: 'play none none none' } });
  const parts = (sel) => [...svg.querySelectorAll(sel)];
  const fades = parts('.art-fade');
  const growY = parts('.art-grow-y');
  const growX = parts('.art-grow-x');
  const pops = parts('.art-pop');
  if (fades.length) tl.fromTo(fades, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0);
  if (draws.length) tl.to(draws, { strokeDashoffset: 0, duration: 1.4, ease: 'expo.out', stagger: 0.08 }, 0);
  if (growY.length) tl.fromTo(growY, { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 100%', duration: 1.1, ease: 'expo.out', stagger: 0.05 }, 0.05);
  if (growX.length) tl.fromTo(growX, { scaleX: 0 }, { scaleX: 1, transformOrigin: '50% 50%', duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0.05);
  if (pops.length) tl.fromTo(pops, { scale: 0 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)', stagger: { each: 0.005, from: 'random' } }, 0.15);
  return tl;
}

export function initProjects({ scroller, pin, motion }) {
  const work = document.querySelector('.work');
  if (!work) return () => {};
  const stage = work.querySelector('[data-work-stage]');
  const viewport = work.querySelector('[data-work-viewport]');
  const track = work.querySelector('[data-work-track]');
  const cards = [...track.querySelectorAll('[data-project]')];
  const current = work.querySelector('[data-work-current]');
  const bar = work.querySelector('[data-work-bar]');
  const cleanups = [];

  if (pin) {
    work.classList.add('is-pinned');
    const visibleWidth = () => {
      const cs = getComputedStyle(viewport);
      return viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    };
    const distance = () => Math.max(0, track.scrollWidth - visibleWidth());

    if (distance() < 40) {
      work.classList.remove('is-pinned');
    } else {
      const n = cards.length;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: stage,
          pin: true,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (current) current.textContent = pad2(Math.round(self.progress * (n - 1)) + 1);
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      if (motion) {
        cards.forEach((card) => coverTimeline(card, { trigger: card, containerAnimation: tween, start: 'left 92%' }));
      }

      // Keyboard: the track moves by transform, so bring a focused card into view ourselves.
      const onFocus = (e) => {
        const card = e.target.closest?.('[data-project]');
        const st = tween.scrollTrigger;
        if (!card || !st) return;
        const offset = card.offsetLeft - cards[0].offsetLeft;
        const x = -gsap.getProperty(track, 'x');
        const width = visibleWidth();
        if (offset >= x && offset + card.offsetWidth <= x + width) return;
        const p = Math.min(1, Math.max(0, offset / distance()));
        scroller.scrollTo(st.start + p * (st.end - st.start), { immediate: true });
      };
      track.addEventListener('focusin', onFocus);
      cleanups.push(() => track.removeEventListener('focusin', onFocus));
    }
  } else if (motion) {
    cards.forEach((card) => coverTimeline(card, { trigger: card, start: 'top 88%' }));
  }

  return () => {
    cleanups.forEach((fn) => fn());
    work.classList.remove('is-pinned');
    gsap.set(track, { clearProps: 'transform' });
    if (current) current.textContent = '01';
    if (bar) bar.style.transform = '';
  };
}
