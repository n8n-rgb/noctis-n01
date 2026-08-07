import { Spring, Spring2 } from './spring.js';
import { prefersReducedMotion } from './env.js';

/**
 * One dot, blend-mode difference. Over a link or the primary button it grows
 * and the difference blend does the inversion for free.
 */
export function initCursor() {
  const el = document.querySelector('.cursor');
  if (!el || prefersReducedMotion) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const pos = new Spring2(window.innerWidth / 2, window.innerHeight / 2, {
    stiffness: 340,
    damping: 30,
  });
  const scale = new Spring(1, { stiffness: 260, damping: 20 });

  let visible = false;
  let last = performance.now();

  window.addEventListener(
    'pointermove',
    (e) => {
      pos.setTarget(e.clientX, e.clientY);
      if (!visible) {
        visible = true;
        pos.set(e.clientX, e.clientY);
        el.style.opacity = '1';
      }
    },
    { passive: true }
  );

  window.addEventListener('pointerleave', () => {
    visible = false;
    el.style.opacity = '0';
  });

  const enter = (v) => () => {
    scale.target = v;
  };
  const leave = () => {
    scale.target = 1;
  };

  document.querySelectorAll('[data-cursor]').forEach((node) => {
    const grow = node.dataset.cursor === 'invert' ? 6.2 : 3.4;
    node.addEventListener('pointerenter', enter(grow));
    node.addEventListener('pointerleave', leave);
  });

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    const [x, y] = pos.step(dt);
    const s = scale.step(dt);
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s.toFixed(3)})`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
