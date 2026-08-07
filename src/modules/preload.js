import { FRAME_COUNT, framePath } from './frames.js';

const CONCURRENCY = 12;

/**
 * Pulls the whole frame sequence into memory before the hero becomes
 * interactive. Resolves with a dense array of decoded HTMLImageElements.
 * A frame that fails to load is left null and skipped at draw time rather
 * than deadlocking the loader.
 */
export function preloadFrames(onProgress = () => {}) {
  const images = new Array(FRAME_COUNT).fill(null);
  if (!FRAME_COUNT) {
    onProgress(1);
    return Promise.resolve(images);
  }

  let done = 0;
  let next = 0;

  const loadOne = (i) =>
    new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        images[i] = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = framePath(i);
    });

  const worker = async () => {
    while (next < FRAME_COUNT) {
      const i = next++;
      await loadOne(i);
      done++;
      onProgress(done / FRAME_COUNT);
    }
  };

  return Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, FRAME_COUNT) }, worker)
  ).then(() => images);
}

/** Single-image preload used for the mobile / reduced-motion poster. */
export function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
