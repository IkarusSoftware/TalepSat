export const colors = {
  // Primary
  primary: {
    DEFAULT: '#1B2B4B',
    light: '#2D4A7A',
    lighter: '#E8EDF4',
    50: '#F0F3F8',
    100: '#D6DEE9',
    200: '#ADBDD4',
    300: '#849CBE',
    400: '#5B7BA9',
    500: '#3D5F8F',
    600: '#2D4A7A',
    700: '#1B2B4B',
    800: '#142038',
    900: '#0D1525',
  },

  // Accent
  accent: {
    DEFAULT: '#E8683A',
    light: '#FCEEE8',
    lighter: '#FEF7F4',
    50: '#FEF7F4',
    100: '#FCEEE8',
    200: '#F9D5C6',
    300: '#F4B49A',
    400: '#EE8E63',
    500: '#E8683A',
    600: '#D4521F',
    700: '#A93F18',
    800: '#7E2F12',
    900: '#531F0C',
  },

  // Semantic
  success: {
    DEFAULT: '#1A8754',
    light: '#E6F5ED',
    dark: '#126B42',
  },
  warning: {
    DEFAULT: '#D4940A',
    light: '#FDF4E0',
    dark: '#A87608',
  },
  error: {
    DEFAULT: '#C93B3B',
    light: '#FCEAEA',
    dark: '#A12F2F',
  },

  // Neutral (warm grays)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF8',
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

  // Dark mode surfaces
  dark: {
    bg: '#121212',
    surface: '#1C1C1A',
    surfaceRaised: '#2A2A28',
    border: '#3A3A37',
    textPrimary: '#F0EFEB',
    textSecondary: '#9A9790',
  },
} as const;

export type Colors = typeof colors;
