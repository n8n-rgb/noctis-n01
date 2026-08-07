export const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/**
 * Phones and tablets never download the frame sequence — they get the poster.
 * Coarse pointer OR narrow viewport OR a metered/slow connection all opt out.
 */
export const isMobile = (() => {
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const conn = navigator.connection;
  const stingy = !!conn && (conn.saveData || /2g/.test(conn.effectiveType || ''));
  return coarse || narrow || stingy;
})();

/** Mobile and reduced-motion both fall back to a single held frame. */
export const useFrameSequence = !isMobile && !prefersReducedMotion;
