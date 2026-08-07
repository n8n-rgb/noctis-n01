import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { ENTER } from './ease.js';
import { Spring, clamp } from './spring.js';
import { lenis } from './scroll.js';
import { prefersReducedMotion, useFrameSequence } from './env.js';
import { HOLD_FRAME } from './frames.js';

const IDLE_FPS = 5.5;       // the rotation is already alive before you scroll
const HANDOVER = 1.15;      // seconds to hand the wheel over to the scroll
const SCROLL_SPAN = 4.2;    // viewport heights of pin
const MAX_SKEW = 2.4;       // degrees

export function initHero(frames) {
  const stage = document.getElementById('heroStage');
  const skew = document.getElementById('heroSkew');
  const canvas = document.getElementById('heroCanvas');
  const poster = document.getElementById('heroPoster');
  const hint = document.getElementById('heroHint');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const total = frames.filter(Boolean).length ? frames.length : 0;

  // ── state ───────────────────────────────────────────────────────────
  let mode = 'idle';
  let idleFrame = 0;
  let offset = 0;        // where idle left off, decayed away after handover
  let handoverAt = 0;
  let progress = 0;
  let display = 0;
  let lastPainted = -1;
  let cw = 0;
  let ch = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.round(r.width * dpr));
    ch = Math.max(1, Math.round(r.height * dpr));
    canvas.width = cw;
    canvas.height = ch;
    ctx.imageSmoothingQuality = 'high';
    lastPainted = -1; // the resize wiped the buffer; force a repaint
    drawIndex(display);
  }

  /** cover-fit, centred — the car never changes size, so neither does this */
  function paint(img) {
    if (!img) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    const ca = cw / ch;
    const ia = img.naturalWidth / img.naturalHeight;
    let dw;
    let dh;
    if (ia > ca) {
      dh = ch;
      dw = ch * ia;
    } else {
      dw = cw;
      dh = cw / ia;
    }
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function drawIndex(f) {
    if (!total) return;
    let i = Math.round(f) % total;
    if (i < 0) i += total;
    if (i === lastPainted) return;
    const img = frames[i];
    if (!img) return;
    lastPainted = i;
    paint(img);
  }

  // ── no frame sequence: hold a poster and let the page scroll ────────
  if (!useFrameSequence || !total) {
    canvas.style.display = 'none';
    if (poster) poster.style.display = 'block';
    if (hint) hint.style.display = 'none';
    return;
  }

  // Reduced motion: hold one well-chosen frame, page scrolls normally.
  if (prefersReducedMotion) {
    display = HOLD_FRAME;
    resize();
    window.addEventListener('resize', resize);
    if (hint) hint.style.display = 'none';
    return;
  }

  // ── idle → scroll handover ──────────────────────────────────────────
  let last = performance.now();

  const skewSpring = new Spring(0, { stiffness: 120, damping: 18 });

  function handover() {
    if (mode !== 'idle') return;
    mode = 'scroll';
    offset = display;
    handoverAt = performance.now();
    if (hint) {
      gsap.to(hint, { opacity: 0, x: 18, duration: 0.6, ease: ENTER, overwrite: true });
    }
  }

  ['wheel', 'touchstart', 'keydown'].forEach((ev) =>
    window.addEventListener(ev, handover, { passive: true, once: true })
  );

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: () => `+=${window.innerHeight * SCROLL_SPAN}`,
    pin: stage,
    pinSpacing: true,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      progress = self.progress;
      if (self.progress > 0.0004) handover();
    },
  });

  // ── frame loop ──────────────────────────────────────────────────────
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;

    let target;
    if (mode === 'idle') {
      idleFrame += IDLE_FPS * dt;
      target = idleFrame;
    } else {
      // decay the idle offset out so the handover is a slide, not a cut
      const t = clamp((now - handoverAt) / 1000 / HANDOVER, 0, 1);
      const carry = offset * (1 - easeOutExpo(t));
      target = progress * (total - 1) + carry;
    }

    // gentle chase so a violent scroll flick doesn't strobe the sequence
    display += (target - display) * (1 - Math.pow(0.0025, dt));
    drawIndex(display);

    // Lenis velocity → clamped skew on the pinned hero
    const v = lenis ? lenis.velocity || 0 : 0;
    skewSpring.target = clamp(v * 0.055, -MAX_SKEW, MAX_SKEW);
    const s = skewSpring.step(dt);
    if (skew) {
      skew.style.transform = `skewY(${s.toFixed(3)}deg) scale(${(1 + Math.abs(s) * 0.006).toFixed(4)})`;
    }

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    ScrollTrigger.refresh();
  });
  requestAnimationFrame(frame);
}

/** The push-in that the loader hands off to. */
export function heroPushIn() {
  const skew = document.getElementById('heroSkew');
  const hint = document.getElementById('heroHint');
  if (skew) {
    gsap.fromTo(
      skew,
      { scale: 1.14 },
      { scale: 1, duration: 1.5, ease: ENTER, clearProps: 'scale' }
    );
  }
  if (hint && !prefersReducedMotion) {
    gsap.fromTo(
      hint,
      { opacity: 0, x: 24 },
      { opacity: 1, x: 0, duration: 1, delay: 0.7, ease: ENTER }
    );
    gsap.fromTo(
      hint.querySelector('.hero__hintline'),
      { scaleX: 0 },
      { scaleX: 1, duration: 1.1, delay: 0.8, ease: ENTER }
    );
  }
}
