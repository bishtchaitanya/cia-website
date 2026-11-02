/*
 * Org chart. Layout and lines work with or without motion; only the
 * scroll-drawn lines need motion.
 *  - Chart layout when every manager column gets at least MIN_COL px, otherwise an
 *    indented tree whose teams collapse behind a toggle.
 *  - One SVG path per reporting line, positioned from the laid-out DOM (offsets
 *    ignore transforms) and recomputed on resize and font changes.
 *  - Hover/focus on a person highlights their chain upwards plus direct reports.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_COL = 176;
const R = 12; // corner radius of the elbows

function box(el, container) {
  let x = 0;
  let y = 0;
  let n = el;
  while (n && n !== container) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function elbow(sx, sy, ex, ey) {
  const midY = sy + (ey - sy) / 2;
  const dx = ex - sx;
  if (Math.abs(dx) < 1) return `M${sx},${sy} V${ey}`;
  const r = Math.min(R, Math.abs(dx) / 2, (ey - sy) / 2);
  const dir = Math.sign(dx);
  return `M${sx},${sy} V${midY - r} Q${sx},${midY} ${sx + dir * r},${midY} H${ex - dir * r} Q${ex},${midY} ${ex},${midY + r} V${ey}`;
}

function spine(sx, sy, ex, ey) {
  const r = Math.min(R, (ey - sy) / 2, (ex - sx) / 2);
  return `M${sx},${sy} V${ey - r} Q${sx},${ey} ${sx + r},${ey} H${ex}`;
}

export function initOrg() {
  const org = document.querySelector('[data-org]');
  if (!org) return null;
  const svg = org.querySelector('[data-org-lines]');
  const label = org.querySelector('[data-colead-label]');
  const mqDesktop = window.matchMedia('(min-width: 1024px)');

  // Structure from the DOM: leaders -> teams (manager + members)
  const leaders = [...org.querySelectorAll('.org__leader')].map((li) => ({
    node: li.querySelector(':scope > .org-node'),
    teams: [...li.querySelectorAll(':scope > .org__teams > .org__team')].map((team) => ({
      el: team,
      node: team.querySelector(':scope > .org-node'),
      toggle: team.querySelector(':scope > .org__toggle'),
      members: [...team.querySelectorAll(':scope > .org__members > .org__member > .org-node')],
    })),
  }));

  const parentOf = new Map();
  const childrenOf = new Map();
  const edges = [];
  const addEdge = (from, to, kind) => {
    const path = document.createElementNS(SVG_NS, 'path');
    // pathLength=1 lets the draw-in survive resizes; not on the dashed co-lead line,
    // where it would rescale the dash pattern.
    if (kind !== 'colead') path.setAttribute('pathLength', '1');
    path.classList.add(`is-${kind}`);
    svg.appendChild(path);
    edges.push({ from, to, kind, path });
    if (kind !== 'colead') {
      parentOf.set(to, from);
      if (!childrenOf.has(from)) childrenOf.set(from, []);
      childrenOf.get(from).push(to);
    }
  };
  leaders.forEach((l, i) => {
    if (i > 0) addEdge(leaders[i - 1].node, l.node, 'colead');
    l.teams.forEach((t) => {
      addEdge(l.node, t.node, 'leader');
      t.members.forEach((m) => addEdge(t.node, m, 'member'));
    });
  });

  // Layout + geometry
  let isChart = null; // unknown until the first layout pass, so that pass always applies
  let compactInitialized = false;
  let frame = 0;
  const geometry = () => {
    frame = 0;
    if (!isChart) return;
    svg.setAttribute('width', org.scrollWidth);
    svg.setAttribute('height', org.scrollHeight);
    for (const e of edges) {
      const a = box(e.from, org);
      const b = box(e.to, org);
      let d;
      if (e.kind === 'colead') {
        d = `M${a.x + a.w + 8},${a.y + a.h / 2} H${b.x - 8}`;
        if (label) {
          label.style.left = `${(a.x + a.w + b.x) / 2}px`;
          label.style.top = `${a.y + a.h / 2}px`;
        }
      } else if (e.kind === 'leader') {
        d = elbow(a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y);
      } else {
        const sx = b.x - 13;
        d = spine(sx, a.y + a.h - 2, b.x, b.y + b.h / 2);
      }
      e.path.setAttribute('d', d);
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(geometry);
  };

  const setCollapsed = (team, collapsed) => {
    team.el.classList.toggle('is-collapsed', collapsed);
    team.toggle?.setAttribute('aria-expanded', String(!collapsed));
  };

  const layout = () => {
    const cols = leaders.reduce((n, l) => n + l.teams.length, 0) || 1;
    const chart = mqDesktop.matches && org.clientWidth / cols >= MIN_COL;
    if (chart !== isChart) {
      isChart = chart;
      org.classList.toggle('is-chart', chart);
      for (const l of leaders) {
        for (const t of l.teams) if (t.toggle) t.toggle.hidden = chart;
      }
      if (!chart && !compactInitialized) {
        // Phones and narrow screens start with teams collapsed.
        compactInitialized = true;
        leaders.forEach((l) => l.teams.forEach((t) => setCollapsed(t, true)));
      }
      if (ScrollTrigger.getAll().length) ScrollTrigger.refresh();
    }
    schedule();
  };

  leaders.forEach((l) =>
    l.teams.forEach((t) =>
      t.toggle?.addEventListener('click', () => {
        setCollapsed(t, !t.el.classList.contains('is-collapsed'));
        ScrollTrigger.refresh();
      }),
    ),
  );

  // Highlight the reporting chain
  const nodes = [...org.querySelectorAll('.org-node')];
  const clear = () => {
    org.classList.remove('is-highlighting');
    nodes.forEach((n) => n.classList.remove('is-hot'));
    edges.forEach((e) => e.path.classList.remove('is-hot'));
  };
  const highlight = (node) => {
    const hot = new Set([node]);
    for (let p = parentOf.get(node); p; p = parentOf.get(p)) hot.add(p);
    for (const c of childrenOf.get(node) || []) hot.add(c);
    org.classList.add('is-highlighting');
    nodes.forEach((n) => n.classList.toggle('is-hot', hot.has(n)));
    edges.forEach((e) => e.path.classList.toggle('is-hot', e.kind !== 'colead' && hot.has(e.from) && hot.has(e.to)));
  };
  org.addEventListener('pointerover', (e) => {
    const node = e.target.closest?.('.org-node');
    if (node && isChart) highlight(node);
  });
  org.addEventListener('pointerleave', clear);
  org.addEventListener('focusin', (e) => {
    const node = e.target.closest?.('.org-node');
    if (node && isChart) highlight(node);
  });
  org.addEventListener('focusout', (e) => {
    if (!org.contains(e.relatedTarget)) clear();
  });

  layout();
  new ResizeObserver(layout).observe(org);
  mqDesktop.addEventListener('change', layout);
  document.fonts?.addEventListener?.('loadingdone', schedule);
  document.fonts?.ready.then(schedule);

  return {
    /** Scroll-drawn lines and node entrance (motion only). */
    animate() {
      const drawn = edges.filter((e) => e.kind !== 'colead').map((e) => e.path);
      const colead = edges.filter((e) => e.kind === 'colead').map((e) => e.path);
      drawn.forEach((p) => (p.style.strokeDasharray = '1 1'));
      const leaderPaths = edges.filter((e) => e.kind === 'leader').map((e) => e.path);
      const memberPaths = edges.filter((e) => e.kind === 'member').map((e) => e.path);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: org, start: 'top 78%', end: 'center 55%', scrub: 0.5 },
      });
      tl.fromTo([...colead, label].filter(Boolean), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0)
        .fromTo(leaderPaths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, stagger: 0.04, ease: 'none' }, 0.1)
        .fromTo(memberPaths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.012, ease: 'none' }, 0.45);
      // fromTo with explicit end values: the nodes have CSS transitions on opacity and
      // transform (hover, dimming), which would otherwise corrupt values GSAP re-reads
      // on refresh. Transitions pause while it runs; inline styles are cleared after.
      org.classList.add('is-entering');
      const entrance = gsap.fromTo(
        nodes,
        { y: 18, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.015,
          clearProps: 'transform,translate,rotate,scale,opacity,visibility',
          onComplete: () => org.classList.remove('is-entering'),
          scrollTrigger: { trigger: org, start: 'top 82%', once: true },
        },
      );
      return () => {
        tl.scrollTrigger?.kill();
        tl.revert();
        entrance.scrollTrigger?.kill();
        entrance.revert();
        org.classList.remove('is-entering');
        drawn.forEach((p) => (p.style.strokeDasharray = ''));
      };
    },
  };
}
