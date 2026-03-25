export const fontFamily = {
  sans: [
    'Plus Jakarta Sans',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
} as const;

export const fontSize = {
  // Display — Hero headings
  display: ['3rem', { lineHeight: '3.5rem', fontWeight: '800', letterSpacing: '-0.02em' }],
  // H1 — Page titles
  h1: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700', letterSpacing: '-0.01em' }],
  // H2 — Section titles
  h2: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
  // H3 — Card titles
  h3: ['1.375rem', { lineHeight: '1.875rem', fontWeight: '600' }],
  // H4 — Subtitles
  h4: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '500' }],
  // Body Large
  'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
  // Body Medium
  'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
  // Body Small
  'body-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
