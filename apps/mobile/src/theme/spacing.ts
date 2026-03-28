/**
 * TalepSat Mobile Spacing Tokens
 * Base unit: 4px — mirrored from @talepsat/tokens
 */

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Semantic spacing aliases
export const space = {
  xs: spacing[1],     // 4
  sm: spacing[2],     // 8
  md: spacing[4],     // 16
  lg: spacing[6],     // 24
  xl: spacing[8],     // 32
  xxl: spacing[12],   // 48
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,      // badges, chips, tags
  md: 8,      // inputs, small buttons
  lg: 12,     // cards, modals
  xl: 16,     // large cards
  '2xl': 24,  // feature cards
  full: 9999, // pill buttons, avatars
} as const;

export type Spacing = typeof spacing;
export type Space = typeof space;
export type BorderRadius = typeof borderRadius;
