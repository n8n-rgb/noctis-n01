import './styles.css';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { initScroll, lenis } from './modules/scroll.js';
import { runLoader } from './modules/loader.js';
import { preloadFrames, preloadImage } from './modules/preload.js';
import { initHero, heroPushIn } from './modules/hero.js';
import { initCursor } from './modules/cursor.js';
import { initMagnetic } from './modules/magnetic.js';
import { initNav } from './modules/nav.js';
import { initSpecs } from './modules/specs.js';
import { initParts } from './modules/parts.js';
import {
  prepareReveals, revealGroup, revealOnScroll, driveWidthAxis,
} from './modules/reveal.js';
import { scrambleAll } from './modules/scramble.js';
import { prefersReducedMotion, useFrameSequence } from './modules/env.js';

const LOADER_SRC = '/media/loader.mp4';
const POSTER_SRC = '/media/hero-poster.webp';

const heroReveals = prepareReveals(document.getElementById('hero'));
// The spec numbers reveal on their own trigger alongside the count-up.
const specReveals = prepareReveals(document.querySelector('.spec')).filter(
  (n) => !n.classList.contains('spec__num') && !n.classList.contains('spec__label')
);
const partReveals = prepareReveals(document.querySelector('.parts'));
const footReveals = prepareReveals(document.querySelector('.foot'));

document.getElementById('heroPoster')?.setAttribute('src', POSTER_SRC);

function bootInteractions() {
  initCursor();
  initNav();
  initMagnetic(document.getElementById('cta'));
  initSpecs();
  initParts();
  revealOnScroll([...partReveals, ...specReveals, ...footReveals]);
}

function enterHero() {
  heroPushIn();
  revealGroup(heroReveals, { delay: 0.15, stagger: 0.09 });
  driveWidthAxis(document.querySelector('.hero__title'), { delay: 0.2 });
  scrambleAll(document.getElementById('hero'), { duration: 1.05, delay: 0.35 });
  lenis?.start();
  document.documentElement.removeAttribute('data-loading');
  ScrollTrigger.refresh();
}

async function boot() {
  initScroll();
  bootInteractions();

  // Reduced motion skips the loader entirely — no film, no gate.
  if (prefersReducedMotion) {
    initHero([]);
    document.documentElement.removeAttribute('data-loading');
    ScrollTrigger.refresh();
    return;
  }

  document.documentElement.setAttribute('data-loading', '');
  lenis?.stop();

  await runLoader({
    loaderSrc: LOADER_SRC,
    // The loader's runtime is the frame sequence's download window.
    preload: async (onProgress) => {
      if (!useFrameSequence) {
        await preloadImage(POSTER_SRC);
        onProgress(1);
        initHero([]);
        return;
      }
      const frames = await preloadFrames(onProgress);
      initHero(frames);
    },
    onDone: enterHero,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// Fonts change metrics; re-measure once they land.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
