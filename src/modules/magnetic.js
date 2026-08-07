import { Spring2 } from './spring.js';
import { prefersReducedMotion } from './env.js';

/**
 * Primary button leans toward the cursor while it is inside a radius around
 * the button, and springs back when it leaves. The label lags the shell
 * slightly so the movement reads as weight rather than a shared translate.
 */
export function initMagnetic(
  el,
  { radius = 150, strength = 0.42, labelStrength = 0.22 } = {}
) {
  if (!el || prefersReducedMotion) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const label = el.querySelector('.btn__label');
  const shell = new Spring2(0, 0, { stiffness: 190, damping: 17 });
  const inner = new Spring2(0, 0, { stiffness: 150, damping: 16 });
  let last = performance.now();

  window.addEventListener(
    'pointermove',
    (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) / 2 + radius;

      if (Math.hypot(dx, dy) < reach) {
        shell.setTarget(dx * strength, dy * strength);
        inner.setTarget(dx * labelStrength, dy * labelStrength);
      } else {
        shell.setTarget(0, 0);
        inner.setTarget(0, 0);
      }
    },
    { passive: true }
  );

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    const [x, y] = shell.step(dt);
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    if (label) {
      const [lx, ly] = inner.step(dt);
      label.style.transform = `translate3d(${lx.toFixed(2)}px, ${ly.toFixed(2)}px, 0)`;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
