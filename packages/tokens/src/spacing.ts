/** Base unit: 4px */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.375rem',    // 6px — badge, chip, tag
  md: '0.5rem',      // 8px — input, small buttons
  lg: '0.75rem',     // 12px — cards, modal
  xl: '1rem',        // 16px — large cards, hero elements
  '2xl': '1.5rem',   // 24px — feature cards
  full: '9999px',    // pill buttons, avatar
} as const;

export const boxShadow = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.16)',
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type BoxShadow = typeof boxShadow;
