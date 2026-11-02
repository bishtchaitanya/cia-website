/*
 * Page chrome: theme switching per section, the floating pill nav (active pill,
 * hide on scroll down / show on scroll up), the progress bar and the ring cursor.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const THEME_BG = { light: '#F7F4F2', dark: '#051464', brand: '#1414D2' };

/** Each [data-theme] section sets the page theme while it crosses the middle of the screen. */
export function initThemes() {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const setTheme = (theme) => {
    if (root.dataset.theme === theme) return;
    root.dataset.theme = theme;
    if (meta && THEME_BG[theme]) meta.content = THEME_BG[theme];
  };
  const sections = gsap.utils.toArray('[data-theme]').filter((el) => el !== root);
  const triggers = sections.map((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => self.isActive && setTheme(section.dataset.theme),
    }),
  );
  return () => triggers.forEach((t) => t.kill());
}

/** Active-section pill with a sliding follower. */
export function initNavActive() {
  const nav = document.querySelector('.pillnav');
  if (!nav) return () => {};
  const follower = nav.querySelector('[data-nav-follower]');
  const links = new Map([...nav.querySelectorAll('[data-nav-link]')].map((a) => [a.dataset.navLink, a]));
  let active = null;

  const place = () => {
    const link = active && links.get(active);
    links.forEach((a, id) => {
      a.classList.toggle('is-active', id === active);
      if (id === active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (!link) {
      follower.classList.remove('is-visible');
      return;
    }
    follower.style.setProperty('--x', `${link.offsetLeft}px`);
    follower.style.setProperty('--w', `${link.offsetWidth}px`);
    follower.classList.add('is-visible');
  };
  const setActive = (id) => {
    if (active === id) return;
    active = id;
    place();
  };

  const triggers = [];
  for (const id of links.keys()) {
    const group = gsap.utils.toArray(`[data-nav="${id}"]`);
    if (!group.length) continue;
    triggers.push(
      ScrollTrigger.create({
        trigger: group[0],
        endTrigger: group[group.length - 1],
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) setActive(id);
          else if (active === id) setActive(null);
        },
      }),
    );
  }
  const ro = new ResizeObserver(place);
  ro.observe(nav);
  return () => {
    triggers.forEach((t) => t.kill());
    ro.disconnect();
  };
}

/** Hide the nav while scrolling down, show it on scroll up, near the top, or on focus. */
export function initNavVisibility(scroller) {
  const header = document.querySelector('[data-header]');
  if (!header) return () => {};
  let hidden = false;
  let focusInside = false;
  let pointerNear = false;
  const set = (hide) => {
    const next = hide && !focusInside && !pointerNear;
    if (next === hidden) return;
    hidden = next;
    header.classList.toggle('is-hidden', hidden);
  };
  const off = scroller.on(({ scroll, direction }) => {
    if (scroll < window.innerHeight * 0.6) set(false);
    else if (direction === 1) set(true);
    else if (direction === -1) set(false);
  });
  const onMove = (e) => {
    const near = e.clientY < 96;
    if (near !== pointerNear) {
      pointerNear = near;
      if (near) set(false);
    }
  };
  const onFocusIn = () => {
    focusInside = true;
    set(false);
  };
  const onFocusOut = (e) => {
    if (!header.contains(e.relatedTarget)) focusInside = false;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  header.addEventListener('focusin', onFocusIn);
  header.addEventListener('focusout', onFocusOut);
  return () => {
    off();
    window.removeEventListener('pointermove', onMove);
    header.removeEventListener('focusin', onFocusIn);
    header.removeEventListener('focusout', onFocusOut);
    header.classList.remove('is-hidden');
  };
}

export function initProgress(scroller) {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return () => {};
  return scroller.on(({ progress }) => {
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  });
}

/** 40px ring that trails the mouse and halves over links and buttons (mouse users only). */
export function initCursor() {
  const el = document.querySelector('[data-cursor]');
  if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
  let shown = false;
  const move = (e) => {
    if (document.documentElement.classList.contains('panel-open')) return;
    if (!shown) {
      gsap.set(el, { x: e.clientX, y: e.clientY });
      el.classList.add('is-visible');
      shown = true;
    }
    xTo(e.clientX);
    yTo(e.clientY);
  };
  const over = (e) => {
    const hit = e.target.closest?.('a, button, [role="button"], label, input, select, textarea');
    gsap.to(el, { scale: hit ? 0.5 : 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
  };
  const hide = () => {
    el.classList.remove('is-visible');
    shown = false;
  };
  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', over);
  document.documentElement.addEventListener('pointerleave', hide);
  return () => {
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerover', over);
    document.documentElement.removeEventListener('pointerleave', hide);
    hide();
  };
}
