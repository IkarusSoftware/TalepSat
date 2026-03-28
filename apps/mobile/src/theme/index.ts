export { colors } from './colors';
export type { Colors } from './colors';

export { spacing, space, borderRadius } from './spacing';
export type { Spacing, Space, BorderRadius } from './spacing';

export { fontFamily, fontWeights, typeScale } from './typography';
export type { TypeScale } from './typography';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

// Animation durations (ms)
export const duration = {
  fast: 150,
  normal: 250,
  moderate: 350,
  slow: 500,
} as const;

// Stagger delays between children (ms)
export const stagger = {
  fast: 30,
  normal: 50,
  slow: 80,
} as const;
