/**
 * TalepSat Mobile Color Tokens
 * Matches the web design system exactly (navy primary + orange accent)
 * Web refs: globals.css --color-primary, --color-accent, --color-dark-*
 */

export const colors = {
  // ── Dark Surfaces (mirrors web dark-* tokens) ──────────────────────────
  background:    '#121212',   // web: --color-dark-bg
  surface:       '#1E1E1C',   // web: --color-dark-surface
  surfaceRaised: '#2A2A28',   // web: --color-dark-surfaceRaised
  border:        '#3A3A37',   // web: --color-dark-border

  // ── Text ──────────────────────────────────────────────────────────────
  textPrimary:   '#F0EFEB',   // web: --color-dark-textPrimary
  textSecondary: '#9A9790',   // web: --color-dark-textSecondary
  textTertiary:  '#6B6860',

  // ── Primary (Navy — matches web) ─────────────────────────────────────
  primary: {
    DEFAULT: '#1B2B4B',       // web: --color-primary
    light:   '#2D4A7A',       // web: --color-primary-light
    lighter: '#1B2B4B26',     // semi-transparent overlay on dark bg
    dark:    '#0F1A2E',
  },

  // ── Accent (Orange — matches web) ─────────────────────────────────────
  accent: {
    DEFAULT: '#E8683A',       // web: --color-accent
    light:   '#FCEEE8',       // web: --color-accent-light
    lighter: '#E8683A26',     // semi-transparent overlay on dark bg
    dark:    '#D4521F',       // web: --color-accent-600
  },

  // ── Semantic ──────────────────────────────────────────────────────────
  success: {
    DEFAULT: '#1A8754',       // web: --color-success
    light:   '#1A875426',
    dark:    '#126B42',       // web: --color-success-dark
  },
  warning: {
    DEFAULT: '#D4940A',       // web: --color-warning
    light:   '#D4940A26',
    dark:    '#A87608',       // web: --color-warning-dark
  },
  error: {
    DEFAULT: '#C93B3B',       // web: --color-error
    light:   '#C93B3B26',
    dark:    '#A12F2F',       // web: --color-error-dark
  },

  // ── Neutral (warm grays — matches web neutral scale) ──────────────────
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAF8',
    100: '#F3F2EF',
    200: '#E5E3DE',
    300: '#C8C5BD',
    400: '#A8A59C',
    500: '#7A7668',
    600: '#5C584C',
    700: '#3D3A33',
    800: '#28261F',
    900: '#1A1815',
  },

  // ── Utility ───────────────────────────────────────────────────────────
  transparent: 'transparent',
  white:       '#ffffff',
  black:       '#000000',
  overlay:     'rgba(0,0,0,0.6)',
} as const;

export type Colors = typeof colors;

// ── Light Theme (mirrors web light palette) ────────────────────────────────
export const lightColors = {
  background:    '#FAFAF8',   // web: --color-neutral-50
  surface:       '#FFFFFF',
  surfaceRaised: '#F3F2EF',   // web: --color-neutral-100
  border:        '#E5E3DE',   // web: --color-neutral-200

  textPrimary:   '#1A1815',   // web: --color-neutral-900
  textSecondary: '#7A7668',   // web: --color-neutral-500
  textTertiary:  '#A8A59C',   // web: --color-neutral-400

  primary: {
    DEFAULT: '#1B2B4B',
    light:   '#2D4A7A',
    lighter: '#E8EDF4',       // web: --color-primary-lighter
    dark:    '#0F1A2E',
  },
  accent: {
    DEFAULT: '#E8683A',
    light:   '#FCEEE8',
    lighter: '#FEF7F4',       // web: --color-accent-lighter
    dark:    '#D4521F',
  },

  success: {
    DEFAULT: '#1A8754',
    light:   '#E6F5ED',
    dark:    '#126B42',
  },
  warning: {
    DEFAULT: '#D4940A',
    light:   '#FDF4E0',
    dark:    '#A87608',
  },
  error: {
    DEFAULT: '#C93B3B',
    light:   '#FCEAEA',
    dark:    '#A12F2F',
  },

  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAF8',
    100: '#F3F2EF',
    200: '#E5E3DE',
    300: '#C8C5BD',
    400: '#A8A59C',
    500: '#7A7668',
    600: '#5C584C',
    700: '#3D3A33',
    800: '#28261F',
    900: '#1A1815',
  },

  transparent: 'transparent',
  white:       '#ffffff',
  black:       '#000000',
  overlay:     'rgba(0,0,0,0.45)',
} as const;

export type LightColors = typeof lightColors;
