import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env.js';

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;

export function initScroll() {
  if (prefersReducedMotion) {
    // Native scroll, no smoothing. ScrollTrigger still drives the counters.
    ScrollTrigger.refresh();
    return null;
  }

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor links go through Lenis so they inherit the same easing.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? document.body : document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    });
  });

  return lenis;
}

/** Smoothed, clamped scroll velocity in the range [-1, 1]. */
export function velocityNormalised() {
  if (!lenis) return 0;
  const v = lenis.velocity || 0;
  return Math.max(-1, Math.min(1, v / 55));
}

export { gsap, ScrollTrigger };
