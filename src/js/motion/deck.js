/*
 * Sub-team deck (Team USA's athlete section): the stage pins and scroll picks the
 * active step. Cards deal from a pile; the list and people columns follow.
 * Only on desktop with motion and subgrid support; otherwise steps simply stack.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pad2 } from '../../render/util.js';

const STEP_VH = 0.75; // scroll length per step, in viewport heights

export function initDeck({ scroller, pin }) {
  const deck = document.querySelector('[data-deck]');
  if (!deck || !pin || !CSS.supports('grid-template-rows', 'subgrid')) return () => {};
  const stage = deck.querySelector('[data-deck-stage]');
  const steps = [...deck.querySelectorAll('.deck-step')];
  const jumps = [...deck.querySelectorAll('[data-deck-jump]')];
  const counter = deck.querySelector('[data-deck-current]');
  const n = steps.length;
  let current = -1;

  deck.classList.add('is-pinned');
  jumps.forEach((b) => (b.hidden = false));
  steps.forEach((s, i) => {
    s.style.setProperty('--tilt', i % 2 ? '1.5deg' : '-1.5deg');
    s.style.setProperty('--tilt-past', i % 2 ? '-2.6deg' : '2.4deg');
  });

  const setStep = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, j) => {
      const depth = i - j;
      const state = j === i ? 'active' : j < i ? (depth > 3 ? 'gone' : 'past') : 'next';
      s.dataset.state = state;
      s.style.setProperty('--depth', String(Math.max(0, depth)));
      s.style.setProperty('--z', String(j === i ? 20 : j < i ? 20 - depth : 0));
      s.classList.toggle('is-active', j === i);
      if (j === i) s.setAttribute('aria-current', 'step');
      else s.removeAttribute('aria-current');
      const inactive = j !== i;
      s.querySelector('.deck-step__card').inert = inactive;
      s.querySelector('.deck-step__people').inert = inactive;
    });
    if (counter) counter.textContent = pad2(i + 1);
  };
  setStep(0);

  const st = ScrollTrigger.create({
    trigger: stage,
    pin: true,
    start: 'top top',
    end: () => `+=${Math.round(n * STEP_VH * window.innerHeight)}`,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => setStep(Math.min(n - 1, Math.floor(self.progress * n))),
  });

  const onClick = (e) => {
    const btn = e.target.closest?.('[data-deck-jump]');
    if (!btn) return;
    const i = Number(btn.dataset.deckJump);
    scroller.scrollTo(st.start + ((i + 0.5) / n) * (st.end - st.start), { duration: 1 });
  };
  deck.addEventListener('click', onClick);

  return () => {
    st.kill(true);
    deck.removeEventListener('click', onClick);
    deck.classList.remove('is-pinned');
    jumps.forEach((b) => (b.hidden = true));
    steps.forEach((s) => {
      delete s.dataset.state;
      s.classList.remove('is-active');
      s.removeAttribute('aria-current');
      ['--depth', '--z', '--tilt', '--tilt-past'].forEach((p) => s.style.removeProperty(p));
      s.querySelector('.deck-step__card').inert = false;
      s.querySelector('.deck-step__people').inert = false;
    });
    if (counter) counter.textContent = '01';
  };
}
