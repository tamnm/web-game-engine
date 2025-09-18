export type EasingFunction = (t: number) => number;

export const linear: EasingFunction = (t) => t;
export const easeInQuad: EasingFunction = (t) => t * t;
export const easeOutQuad: EasingFunction = (t) => t * (2 - t);
export const easeInOutQuad: EasingFunction = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

export const Easings = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
} as const;
