/*
 * Profile panel: a native <dialog> (focus trap, Esc, inert page) styled as a side
 * drawer (>= 768px) or bottom sheet. Any [data-person] button opens it. Inside the
 * panel, "Reports to" and direct-report buttons swap the profile in place.
 */
import { renderPanel } from '../../render/panel.js';

export function initPanel({ scroller }) {
  const dialog = document.querySelector('[data-panel]');
  const dataEl = document.getElementById('panel-data');
  if (!dialog || !dataEl || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('[data-panel-content]');
  const sheet = dialog.querySelector('.panel__sheet');
  const data = JSON.parse(dataEl.textContent);
  const root = document.documentElement;
  let opener = null;
  let closing = null;

  const show = (id) => {
    content.innerHTML = renderPanel(id, data);
    sheet.scrollTop = 0;
    content.querySelector('#panel-name')?.focus({ preventScroll: true });
  };

  const open = (id, trigger) => {
    if (!data.people[id]) return;
    if (dialog.open) {
      show(id);
      return;
    }
    opener = trigger;
    scroller.stop();
    root.classList.add('panel-open');
    dialog.showModal();
    show(id);
    requestAnimationFrame(() => dialog.classList.add('is-open'));
  };

  const finish = () => {
    if (dialog.open) dialog.close();
  };

  const close = () => {
    if (!dialog.open || closing) return;
    dialog.classList.remove('is-open');
    if (root.classList.contains('motion-off')) {
      finish();
      return;
    }
    const done = () => {
      clearTimeout(closing);
      sheet.removeEventListener('transitionend', onEnd);
      closing = null;
      finish();
    };
    const onEnd = (e) => e.target === sheet && done();
    sheet.addEventListener('transitionend', onEnd);
    closing = setTimeout(done, 650);
  };

  // All cleanup lives here: Chrome can skip `cancel` on a repeated Esc and close directly.
  dialog.addEventListener('close', () => {
    clearTimeout(closing);
    closing = null;
    dialog.classList.remove('is-open');
    root.classList.remove('panel-open');
    scroller.start();
    opener?.focus?.({ preventScroll: true });
    opener = null;
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close(); // backdrop
  });
  dialog.querySelector('[data-panel-close]')?.addEventListener('click', close);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-person]');
    if (!btn) return;
    e.preventDefault();
    if (dialog.contains(btn)) show(btn.dataset.person);
    else open(btn.dataset.person, btn);
  });
}
