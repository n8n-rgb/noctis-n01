import gsap from 'gsap';
import { ENTER } from './ease.js';
import { Spring, Spring2, clamp, lerp } from './spring.js';
import { prefersReducedMotion } from './env.js';

const BONE = [242, 239, 233];
const DIM = [64, 68, 72];
const NAME_PUSH = 38; // px the component name slides toward the preview
const MAX_TILT = 13; // degrees the preview swings off the pointer's travel

/**
 * Anatomy list. Running the cursor down the rows swings a component plate
 * along with it: the plate wipes between parts, leans into the direction of
 * travel, the hovered name slides out and lights up while the rest drop back.
 * Every value here comes off the same spring integrator as the rest of the page.
 */
export function initParts() {
  const section = document.getElementById('parts');
  if (!section) return;

  const list = section.querySelector('.parts__list');
  const rows = [...section.querySelectorAll('.parts__row')];
  const preview = section.querySelector('.parts__preview');
  const figures = [...section.querySelectorAll('.parts__fig')];
  if (!list || !rows.length || !preview) return;

  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (coarse || prefersReducedMotion) {
    section.dataset.static = '';
    return;
  }

  const pos = new Spring2(-9999, -9999, { stiffness: 130, damping: 21 });
  const scale = new Spring(0, { stiffness: 210, damping: 23 });
  const tilt = new Spring(0, { stiffness: 95, damping: 15 });
  const hot = new Spring(0, { stiffness: 150, damping: 20 }); // whole-list focus
  const rowHot = rows.map(() => new Spring(0, { stiffness: 155, damping: 17 }));

  let active = -1;
  let lastX = 0;
  let placed = false;

  function setActive(i) {
    if (active === i) return;
    active = i;
    figures.forEach((fig, k) => {
      gsap.to(fig, {
        clipPath: k === i ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
        duration: 0.72,
        ease: ENTER,
        overwrite: true,
      });
    });
  }

  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => {
      rowHot[i].target = 1;
      hot.target = 1;
      scale.target = 1;
      setActive(i);
    });
    row.addEventListener('pointerleave', () => {
      rowHot[i].target = 0;
    });
  });

  list.addEventListener('pointerleave', () => {
    hot.target = 0;
    scale.target = 0;
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!placed) {
        pos.set(e.clientX, e.clientY);
        placed = true;
      }
      pos.setTarget(e.clientX, e.clientY);
      tilt.target = clamp(tilt.target + (e.clientX - lastX) * 0.5, -MAX_TILT, MAX_TILT);
      lastX = e.clientX;
    },
    { passive: true }
  );

  const rgb = (t) =>
    `rgb(${Math.round(lerp(DIM[0], BONE[0], t))}, ${Math.round(
      lerp(DIM[1], BONE[1], t)
    )}, ${Math.round(lerp(DIM[2], BONE[2], t))})`;

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;

    const [x, y] = pos.step(dt);
    const s = Math.max(0, scale.step(dt));
    const t = tilt.step(dt);
    tilt.target *= 0.85; // settle back to level once the pointer stops
    const h = clamp(hot.step(dt), 0, 1);

    preview.style.transform =
      `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) ` +
      `scale(${s.toFixed(3)}) rotate(${t.toFixed(2)}deg)`;

    rows.forEach((row, i) => {
      const v = clamp(rowHot[i].step(dt), 0, 1);
      row.style.setProperty('--hot', v.toFixed(4));
      const name = row.querySelector('.parts__name');
      const idx = row.querySelector('.parts__idx');
      const note = row.querySelector('.parts__note');
      if (name) {
        name.style.transform = `translate3d(${(v * NAME_PUSH).toFixed(2)}px, 0, 0)`;
        // unhovered rows drop back only while the list itself is in focus
        name.style.color = rgb(1 - h * (1 - v));
      }
      if (idx) idx.style.transform = `translate3d(${(v * 10).toFixed(2)}px, 0, 0)`;
      if (note) note.style.transform = `translate3d(${(v * -14).toFixed(2)}px, 0, 0)`;
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
