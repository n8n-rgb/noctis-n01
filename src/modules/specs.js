import ScrollTrigger from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { ENTER } from './ease.js';
import { revealGroup } from './reveal.js';
import { prefersReducedMotion } from './env.js';
import { Spring } from './spring.js';

/** Tracking travel on the numerals, in em, from the resting -0.05em. */
const TRACK_REST = -0.05;
const TRACK_OPEN = 0.038;
const LABEL_PUSH = 26; // px the label drifts away from the number

const format = (v, dec) =>
  dec > 0
    ? v.toFixed(dec)
    : Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');

/** Each number counts up as its row enters the viewport. */
export function initSpecs() {
  document.querySelectorAll('.spec__item').forEach((item, i) => {
    const numWrap = item.querySelector('.spec__num');
    const label = item.querySelector('.spec__label');
    const num = numWrap?.querySelector(':scope > .line__in') || numWrap;
    if (!num) return;

    const to = parseFloat(numWrap.dataset.count);
    const dec = parseInt(numWrap.dataset.dec || '0', 10);

    if (prefersReducedMotion) {
      num.textContent = format(to, dec);
      return;
    }

    num.textContent = format(0, dec);

    ScrollTrigger.create({
      trigger: item,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        revealGroup([numWrap, label].filter(Boolean), { delay: i * 0.03 });
        const counter = { v: 0 };
        gsap.to(counter, {
          v: to,
          duration: 2.1,
          ease: ENTER,
          delay: i * 0.03 + 0.1,
          onUpdate: () => {
            num.textContent = format(counter.v, dec);
          },
        });
      },
    });

    gsap.fromTo(
      item,
      { '--rule': 0 },
      {
        '--rule': 1,
        duration: 1.4,
        ease: ENTER,
        scrollTrigger: { trigger: item, start: 'top 85%', once: true },
      }
    );
  });

  initSpecHover();
}

/**
 * Cursor over a spec row: the numerals open their tracking, the label drifts
 * away from them, and a bone rule wipes across the row from the left. One
 * spring per row, same integrator as the cursor and the magnetic button.
 */
function initSpecHover() {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const rows = [...document.querySelectorAll('.spec__item')].map((item) => {
    const spring = new Spring(0, { stiffness: 140, damping: 17 });
    item.addEventListener('pointerenter', () => {
      spring.target = 1;
    });
    item.addEventListener('pointerleave', () => {
      spring.target = 0;
    });
    return {
      item,
      num: item.querySelector('.spec__num'),
      label: item.querySelector('.spec__label'),
      spring,
    };
  });
  if (!rows.length) return;

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    rows.forEach(({ item, num, label, spring }) => {
      const v = Math.max(0, spring.step(dt));
      item.style.setProperty('--hover', v.toFixed(4));
      if (num) {
        num.style.letterSpacing = `${(TRACK_REST + v * TRACK_OPEN).toFixed(4)}em`;
      }
      if (label) {
        label.style.transform = `translate3d(${(v * LABEL_PUSH).toFixed(2)}px, 0, 0)`;
      }
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
