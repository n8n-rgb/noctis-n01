const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>_■';

/**
 * One pass of character scramble that resolves left to right, then settles.
 * Length is preserved so the line doesn't reflow while it runs.
 */
export function scramble(el, { duration = 1.15, delay = 0 } = {}) {
  const final = el.textContent;
  const chars = [...final];
  const start = performance.now() + delay * 1000;
  const holds = chars.map((_, i) => i / chars.length);

  return new Promise((resolve) => {
    function tick(now) {
      const t = (now - start) / (duration * 1000);
      if (t < 0) return requestAnimationFrame(tick);
      if (t >= 1) {
        el.textContent = final;
        return resolve();
      }
      el.textContent = chars
        .map((c, i) => {
          if (c === ' ') return ' ';
          // each character locks in once the wave has passed it
          if (t > holds[i] + 0.32) return c;
          return CHARS[(Math.random() * CHARS.length) | 0];
        })
        .join('');
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

export function scrambleAll(root = document, opts = {}) {
  const nodes = [...root.querySelectorAll('[data-scramble]')];
  return Promise.all(
    nodes.map((n, i) => scramble(n, { ...opts, delay: (opts.delay || 0) + i * 0.09 }))
  );
}
