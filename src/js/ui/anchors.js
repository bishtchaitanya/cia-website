/*
 * In-page links scroll with the page's scroller, then move focus to the target
 * heading so keyboard and screen-reader users land in the right place.
 */
function focusTarget(target) {
  const el =
    target.matches('main, h1, h2, h3') ? target : target.querySelector('h1, h2') || target;
  if (!el.hasAttribute('tabindex') && !el.matches('a, button, input, select, textarea')) {
    el.setAttribute('tabindex', '-1');
  }
  el.focus({ preventScroll: true });
}

export function initAnchors({ scroller }) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest?.('a[href^="#"]');
    if (!link || e.defaultPrevented) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    const toTop = hash === '#top' || hash === '#main';
    scroller.scrollTo(toTop ? 0 : target, {
      duration: 1.4,
      onComplete: () => focusTarget(toTop ? document.getElementById('main') || target : target),
    });
    if (hash !== '#main') history.replaceState(null, '', toTop ? location.pathname + location.search : hash);
  });
}

/** Land on the URL's #hash once pins have added their scroll length. */
export function restoreHash(scroller) {
  const id = location.hash.slice(1);
  const target = id && document.getElementById(decodeURIComponent(id));
  if (target && id !== 'top') scroller.scrollTo(target, { immediate: true });
}
