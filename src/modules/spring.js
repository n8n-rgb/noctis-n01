/**
 * Minimal critically-dampable spring integrator.
 * Every micro-interaction on the page runs off one of these so the motion
 * shares a single physical character instead of a pile of tween easings.
 */
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 22, mass = 1 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  set(v) {
    this.value = this.target = v;
    this.velocity = 0;
  }

  /** dt in seconds, clamped so a tab-switch stall can't explode the system. */
  step(dt) {
    const h = Math.min(dt, 1 / 30);
    const force = -this.stiffness * (this.value - this.target);
    const drag = -this.damping * this.velocity;
    this.velocity += ((force + drag) / this.mass) * h;
    this.value += this.velocity * h;
    return this.value;
  }
}

/** Vector-2 convenience wrapper — cursor, magnetic pull. */
export class Spring2 {
  constructor(x = 0, y = 0, opts) {
    this.x = new Spring(x, opts);
    this.y = new Spring(y, opts);
  }
  setTarget(x, y) {
    this.x.target = x;
    this.y.target = y;
  }
  set(x, y) {
    this.x.set(x);
    this.y.set(y);
  }
  step(dt) {
    return [this.x.step(dt), this.y.step(dt)];
  }
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
