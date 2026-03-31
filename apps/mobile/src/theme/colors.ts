/**
 * TalepSat Mobile Color Tokens
 * Matches the web design system (indigo-based dark theme)
 */

export const colors = {
  // ── Dark Surfaces ──────────────────────────────────────────────────────
  background:    '#0f0f1a',
  surface:       '#1a1a2e',
  surfaceRaised: '#252540',
  border:        '#2d2d4e',

  // ── Text ──────────────────────────────────────────────────────────────
  textPrimary:   '#f1f1f3',
  textSecondary: '#9898b3',
  textTertiary:  '#6666a0',

  // ── Primary / Accent (Indigo — matches web) ───────────────────────────
  primary: {
    DEFAULT: '#6366f1',
    light:   '#818cf8',
    lighter: '#6366f122',
    dark:    '#4f46e5',
  },
  accent: {
    DEFAULT: '#6366f1',
    light:   '#818cf8',
    lighter: '#6366f122',
    dark:    '#4f46e5',
  },

  // ── Semantic ──────────────────────────────────────────────────────────
  success: {
    DEFAULT: '#22c55e',
    light:   '#22c55e22',
    dark:    '#16a34a',
  },
  warning: {
    DEFAULT: '#f59e0b',
    light:   '#f59e0b22',
    dark:    '#d97706',
  },
  error: {
    DEFAULT: '#ef4444',
    light:   '#ef444422',
    dark:    '#dc2626',
  },

  // ── Neutral ───────────────────────────────────────────────────────────
  neutral: {
    0:   '#ffffff',
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  // ── Utility ───────────────────────────────────────────────────────────
  transparent: 'transparent',
  white:       '#ffffff',
  black:       '#000000',
  overlay:     'rgba(0,0,0,0.6)',
} as const;

export type Colors = typeof colors;

// ── Light Theme ────────────────────────────────────────────────────────────
export const lightColors = {
  background:    '#f5f5fc',
  surface:       '#ffffff',
  surfaceRaised: '#ededf9',
  border:        '#ddddf0',

  textPrimary:   '#0f0f1a',
  textSecondary: '#4a4a72',
  textTertiary:  '#7878a8',

  primary: {
    DEFAULT: '#6366f1',
    light:   '#4f46e5',
    lighter: '#6366f118',
    dark:    '#4338ca',
  },
  accent: {
    DEFAULT: '#6366f1',
    light:   '#4f46e5',
    lighter: '#6366f118',
    dark:    '#4338ca',
  },

  success: {
    DEFAULT: '#16a34a',
    light:   '#16a34a22',
    dark:    '#166534',
  },
  warning: {
    DEFAULT: '#d97706',
    light:   '#d9770622',
    dark:    '#92400e',
  },
  error: {
    DEFAULT: '#dc2626',
    light:   '#dc262622',
    dark:    '#991b1b',
  },

  neutral: {
    0:   '#ffffff',
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  transparent: 'transparent',
  white:       '#ffffff',
  black:       '#000000',
  overlay:     'rgba(0,0,0,0.45)',
} as const;

export type LightColors = typeof lightColors;
