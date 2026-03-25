export const duration = {
  fast: '150ms',
  normal: '250ms',
  moderate: '350ms',
  slow: '500ms',
} as const;

export const easing = {
  default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
} as const;

/** Framer Motion transition presets */
export const transitions = {
  fast: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  normal: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  moderate: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  enter: { duration: 0.35, ease: [0, 0, 0.2, 1] },
  exit: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
} as const;

/** Stagger delay between children */
export const stagger = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
} as const;

export type Duration = typeof duration;
export type Easing = typeof easing;
