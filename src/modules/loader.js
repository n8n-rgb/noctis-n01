import gsap from 'gsap';
import { ENTER, EXIT } from './ease.js';

const MIN_VISIBLE = 1000; // the loader should be seen, not blinked past
const VIDEO_TIMEOUT = 7000;

const el = {
  root: document.getElementById('loader'),
  videoA: document.getElementById('loaderVideo'),
  videoB: document.getElementById('loaderVideoB'),
  fill: document.getElementById('loaderFill'),
  count: document.getElementById('loaderCount'),
};
el.mark = el.root?.querySelector('.loader__mark');
el.bar = el.root?.querySelector('.loader__bar');

/** Wait for the macro clip to be genuinely playable — it gates the loader. */
function readyVideo(src) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(t);
      resolve();
    };
    const t = setTimeout(finish, VIDEO_TIMEOUT);

    const targets = [el.videoA, el.videoB].filter(Boolean);
    if (!targets.length) return finish();

    let pending = targets.length;
    targets.forEach((v) => {
      const ok = () => {
        if (--pending <= 0) finish();
      };
      v.addEventListener('canplaythrough', ok, { once: true });
      v.addEventListener('error', ok, { once: true });
      v.src = src;
      v.load();
    });
  });
}

/** Park the split seam exactly on the progress line. */
function setSplit() {
  if (!el.bar || !el.root) return;
  const r = el.bar.getBoundingClientRect();
  el.root.style.setProperty('--split', `${Math.round(r.top + r.height / 2)}px`);
}

export async function runLoader({ loaderSrc, preload, onDone }) {
  if (!el.root) {
    await preload(() => {});
    onDone?.();
    return;
  }

  const started = performance.now();

  // 1 — the macro clip is the only asset gating the loader.
  await readyVideo(loaderSrc);
  [el.videoA, el.videoB].forEach((v) => v && v.play().catch(() => {}));

  el.root.dataset.state = 'running';
  setSplit();
  window.addEventListener('resize', setSplit);

  gsap.fromTo(
    [el.mark, el.bar, el.count],
    { yPercent: 45, clipPath: 'inset(-30% -30% 100% -30%)' },
    {
      yPercent: 0,
      clipPath: 'inset(-30% -30% -30% -30%)',
      duration: 0.95,
      stagger: 0.075,
      ease: ENTER,
    }
  );

  // 2 — the loader's runtime is the frame sequence's download window.
  const shown = { v: 0 };
  const render = () => {
    if (el.fill) el.fill.style.width = `${shown.v * 100}%`;
    if (el.count) {
      el.count.textContent = String(Math.round(shown.v * 100)).padStart(3, '0');
    }
  };
  const toProgress = gsap.quickTo(shown, 'v', {
    duration: 0.55,
    ease: ENTER,
    onUpdate: render,
  });

  await preload((p) => toProgress(p));
  toProgress(1);

  const elapsed = performance.now() - started;
  if (elapsed < MIN_VISIBLE) {
    await new Promise((r) => setTimeout(r, MIN_VISIBLE - elapsed));
  }
  shown.v = 1;
  render();

  // 3 — one continuous movement into the hero.
  await exit(onDone);
}

/** Line goes full width → screen splits on it → halves slide away. ~1.5s. */
function exit(onDone) {
  const top = el.root.querySelector('.loader__half--top');
  const bottom = el.root.querySelector('.loader__half--bottom');

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        el.root.dataset.state = 'done';
        el.root.style.display = 'none';
        window.removeEventListener('resize', setSplit);
        resolve();
      },
    });

    tl.to(
      [el.mark, el.count],
      {
        yPercent: -70,
        clipPath: 'inset(-30% -30% 100% -30%)',
        duration: 0.45,
        ease: EXIT,
      },
      0
    );

    tl.to(el.bar, { width: '100vw', duration: 0.6, ease: ENTER }, 0.04);

    tl.to(top, { yPercent: -100, duration: 0.9, ease: EXIT }, 0.44);
    tl.to(bottom, { yPercent: 100, duration: 0.9, ease: EXIT }, 0.44);
    tl.to(el.bar, { opacity: 0, duration: 0.45, ease: EXIT }, 0.62);

    // …as the hero pushes in.
    tl.add(() => onDone?.(), 0.44);
  });
}
