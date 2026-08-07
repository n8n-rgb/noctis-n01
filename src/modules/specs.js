import ScrollTrigger from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { ENTER } from './ease.js';
import { revealGroup } from './reveal.js';
import { prefersReducedMotion } from './env.js';

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
}
