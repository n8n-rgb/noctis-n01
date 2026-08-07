import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { ENTER } from './ease.js';
import { prefersReducedMotion } from './env.js';

const HIDDEN = 'inset(-15% -30% 100% -5%)';
const SHOWN = 'inset(-15% -30% -15% -5%)';

/** Every [data-reveal] gets an inner element we can translate under the mask. */
function normalise(node) {
  if (node.querySelector(':scope > .line__in')) {
    return node.querySelector(':scope > .line__in');
  }
  const span = document.createElement('span');
  span.className = 'line__in';
  while (node.firstChild) span.appendChild(node.firstChild);
  node.appendChild(span);
  return span;
}

export function prepareReveals(root = document) {
  const nodes = [...root.querySelectorAll('[data-reveal]')];
  nodes.forEach((n) => {
    const inner = normalise(n);
    if (prefersReducedMotion) return;
    gsap.set(n, { clipPath: HIDDEN });
    gsap.set(inner, { yPercent: 108 });
  });
  return nodes;
}

/** Lines rise into place on a stagger. No opacity-only fades anywhere. */
export function revealGroup(nodes, { delay = 0, stagger = 0.085 } = {}) {
  if (prefersReducedMotion || !nodes.length) return gsap.timeline();
  const tl = gsap.timeline({ delay });
  tl.to(nodes, { clipPath: SHOWN, duration: 1.15, ease: ENTER, stagger }, 0);
  tl.to(
    nodes.map((n) => n.querySelector(':scope > .line__in')),
    { yPercent: 0, duration: 1.25, ease: ENTER, stagger },
    0
  );
  return tl;
}

/**
 * Drive Archivo's variable width axis on the way in — the line arrives
 * narrow and widens into its final expanded setting.
 */
export function driveWidthAxis(el, { from = 74, to = 125, duration = 1.6, delay = 0 } = {}) {
  if (!el || prefersReducedMotion) return;
  const axis = { wdth: from };
  gsap.to(axis, {
    wdth: to,
    duration,
    delay,
    ease: ENTER,
    onUpdate: () => {
      el.style.fontVariationSettings = `"wdth" ${axis.wdth.toFixed(1)}, "wght" 900`;
      el.style.fontStretch = `${axis.wdth.toFixed(1)}%`;
    },
    onComplete: () => {
      el.style.fontVariationSettings = '';
      el.style.fontStretch = '';
    },
  });
}

/** Below-the-fold reveals fire on their own scroll trigger. */
export function revealOnScroll(nodes) {
  if (prefersReducedMotion) return;
  nodes.forEach((n, i) => {
    ScrollTrigger.create({
      trigger: n,
      start: 'top 88%',
      once: true,
      onEnter: () => revealGroup([n], { delay: i * 0.04 }),
    });
  });
}
