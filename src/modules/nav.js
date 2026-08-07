import { Spring } from './spring.js';
import { prefersReducedMotion } from './env.js';

/**
 * Underlines wipe in from the left on the same spring as everything else,
 * rather than a CSS transition, so the whole page shares one feel.
 */
export function initNav() {
  if (prefersReducedMotion) return;

  const links = [...document.querySelectorAll('.nav__links a, .foot__meta a')];
  if (!links.length) return;

  const entries = links.map((el) => {
    const rule = document.createElement('i');
    rule.className = 'rule';
    el.appendChild(rule);
    const s = new Spring(0, { stiffness: 220, damping: 24 });
    el.addEventListener('pointerenter', () => {
      s.target = 1;
    });
    el.addEventListener('pointerleave', () => {
      s.target = 0;
    });
    el.addEventListener('focus', () => {
      s.target = 1;
    });
    el.addEventListener('blur', () => {
      s.target = 0;
    });
    return { rule, s };
  });

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    entries.forEach(({ rule, s }) => {
      const v = Math.max(0, s.step(dt));
      rule.style.transform = `scaleX(${v.toFixed(4)})`;
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
