/*
 * Generated "data-art" covers for project cards. These are decorative, not data:
 * no axes, numbers or legends, and the SVG is aria-hidden. Each cover uses one
 * sub-team color family (tone on tone), seeded by the project id so a cover
 * never changes between builds.
 *
 * Animated parts carry classes the motion layer looks for:
 *   .art-draw    stroke drawn in (pathLength=1, optional data-len for arcs)
 *   .art-grow-y  bar grows up from its baseline
 *   .art-grow-x  bar grows out from its center
 *   .art-pop     dot scales in
 *   .art-fade    area fades in
 */
import { TEAM_COLORS } from '../lib/palette.js';

const W = 400;
const H = 300;
const r1 = (n) => Math.round(n * 10) / 10;

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small deterministic PRNG. */
function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts) {
  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0])},${r1(c1[1])} ${r1(c2[0])},${r1(c2[1])} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function guides(ink, ys, base) {
  const lines = ys.map((y) => `<line x1="32" x2="368" y1="${y}" y2="${y}"/>`).join('');
  const baseLine = base ? `<line x1="32" x2="368" y1="${base}" y2="${base}" stroke-opacity=".28"/>` : '';
  return `<g stroke="${ink}" stroke-opacity=".1" stroke-width="1" fill="none">${lines}${baseLine}</g>`;
}

const ART = {
  sparkline(rand, c) {
    const n = 13;
    let y = 205 + rand() * 25;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = 40 + (i * 320) / (n - 1);
      y = clamp(y + (rand() - 0.62) * 40, 72, 236);
      pts.push([x, y]);
    }
    const line = smoothPath(pts);
    const [lx, ly] = pts[pts.length - 1];
    const area = `${line} L${r1(lx)},252 L40,252 Z`;
    return (
      guides(c.ink, [92, 152, 212], 252) +
      `<path class="art-fade" d="${area}" fill="${c.mark}" fill-opacity=".16"/>` +
      `<path class="art-draw" d="${line}" pathLength="1" fill="none" stroke="${c.mark}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle class="art-pop" cx="${r1(lx)}" cy="${r1(ly)}" r="9" fill="${c.mark}" stroke="${c.tint}" stroke-width="4"/>`
    );
  },

  wave(rand, c) {
    const layers = [
      { base: 150, fill: c.mark, opacity: 0.22 },
      { base: 188, fill: c.bright || c.mark, opacity: 0.55 },
      { base: 226, fill: c.deep, opacity: 0.9 },
    ];
    let out = '';
    let topLine = '';
    layers.forEach((layer, k) => {
      const amp = 18 + rand() * 18;
      const freq = 1 + rand() * 1.3;
      const phase = rand() * Math.PI * 2;
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const x = (i * W) / 8;
        const yy = layer.base + Math.sin((x / W) * freq * Math.PI * 2 + phase) * amp + (rand() - 0.5) * 8;
        pts.push([x, yy]);
      }
      const d = smoothPath(pts);
      out += `<path class="art-fade" d="${d} L${W},${H} L0,${H} Z" fill="${layer.fill}" fill-opacity="${layer.opacity}"/>`;
      if (k === 0) topLine = `<path class="art-draw" d="${d}" pathLength="1" fill="none" stroke="${c.mark}" stroke-width="3" stroke-linecap="round"/>`;
    });
    return guides(c.ink, [70, 120], 0) + out + topLine;
  },

  bars(rand, c) {
    const n = 9;
    const w = 26;
    const gap = 12;
    const x0 = (W - (n * w + (n - 1) * gap)) / 2;
    const base = 248;
    const heights = Array.from({ length: n }, (_, i) => 50 + rand() * 120 + i * 6);
    const hi = heights.indexOf(Math.max(...heights));
    const radius = 6;
    let bars = '';
    heights.forEach((h, i) => {
      const x = x0 + i * (w + gap);
      const y = base - h;
      const d = `M${r1(x)},${base} V${r1(y + radius)} Q${r1(x)},${r1(y)} ${r1(x + radius)},${r1(y)} H${r1(x + w - radius)} Q${r1(x + w)},${r1(y)} ${r1(x + w)},${r1(y + radius)} V${base} Z`;
      const isHi = i === hi;
      bars += `<path class="art-grow-y" d="${d}" fill="${c.mark}" fill-opacity="${isHi ? 1 : 0.4}"/>`;
    });
    return guides(c.ink, [88, 138, 188], base) + bars;
  },

  dots(rand, c) {
    const cols = 14;
    const rows = 9;
    const step = 25;
    const x0 = (W - (cols - 1) * step) / 2;
    const y0 = (H - (rows - 1) * step) / 2;
    const p1 = rand() * 6;
    const p2 = rand() * 6;
    let out = '';
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v = clamp((Math.sin(i * 0.55 + p1) + Math.cos(j * 0.75 + p2) + 2) / 4 + (rand() - 0.5) * 0.35, 0, 1);
        const rr = 2.5 + v * 7.5;
        const strong = v > 0.86;
        out += `<circle class="art-pop" cx="${r1(x0 + i * step)}" cy="${r1(y0 + j * step)}" r="${r1(rr)}" fill="${strong ? c.deep : c.mark}" fill-opacity="${strong ? 1 : r1(0.25 + v * 0.6)}"/>`;
      }
    }
    return out;
  },

  funnel(rand, c) {
    const fractions = [1, 0.78, 0.6, 0.44, 0.3].map((f, i) => (i === 0 ? f : clamp(f + (rand() - 0.5) * 0.08, 0.2, 0.95)));
    const h = 30;
    const gap = 12;
    const y0 = (H - (5 * h + 4 * gap)) / 2;
    const max = 320;
    let out = '';
    fractions.forEach((f, i) => {
      const w = max * f;
      out += `<rect class="art-grow-x" x="${r1((W - w) / 2)}" y="${r1(y0 + i * (h + gap))}" width="${r1(w)}" height="${h}" rx="6" fill="${i === 4 ? c.deep : c.mark}" fill-opacity="${i === 4 ? 1 : r1(1 - i * 0.16)}"/>`;
    });
    return out;
  },

  rings(rand, c) {
    const cx = 200;
    const cy = 150;
    const radii = [112, 86, 60, 34];
    const colors = [c.mark, c.deep, c.bright || c.mark, c.mark];
    let out = '';
    radii.forEach((r, i) => {
      const len = r1(0.35 + rand() * 0.55);
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.ink}" stroke-opacity=".1" stroke-width="16"/>`;
      out += `<circle class="art-draw" data-len="${len}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="16" stroke-linecap="round" pathLength="1" stroke-dasharray="${len} 1" transform="rotate(-90 ${cx} ${cy})"/>`;
    });
    return out;
  },
};

/** SVG cover for a project. */
export function projectArt(project) {
  const c = TEAM_COLORS[project.color] || TEAM_COLORS.brand;
  const type = ART[project.art] ? project.art : 'sparkline';
  const rand = makeRandom(hash(project.id + ':' + type));
  return `<svg class="art art--${type}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-art><rect width="${W}" height="${H}" fill="${c.tint}"/>${ART[type](rand, c)}</svg>`;
}
