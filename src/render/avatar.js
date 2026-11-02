import { esc } from './util.js';

/**
 * Initials avatar tinted by sub-team color, or the person's photo when set.
 * Avatars are decorative (aria-hidden); the person's name is always next to them
 * or in the parent button's accessible name.
 */
export function avatar(person, { size = 'md', className = '' } = {}) {
  const cls = ['avatar', `avatar--${size}`, className].filter(Boolean).join(' ');
  if (person.photo) {
    return `<span class="${cls} avatar--photo" data-color="${esc(person.color)}" aria-hidden="true"><img src="./${esc(person.photo)}" alt="" loading="lazy" decoding="async"></span>`;
  }
  return `<span class="${cls}" data-color="${esc(person.color)}" aria-hidden="true">${esc(person.initials)}</span>`;
}
