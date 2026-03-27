// Geliştirme sırasında bilgisayarının IP adresini veya localhost kullan
// Expo Go için: bilgisayarının yerel IP adresi (örn: http://192.168.1.x:3001)
// Android Emülatör için: http://10.0.2.2:3001
// iOS Simulator için: http://localhost:3001

import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();

export const API_URL = debuggerHost
  ? `http://${debuggerHost}:3001`
  : 'http://10.0.2.2:3001'; // Android emülatör fallback

export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#252540',
  border: '#2d2d4e',
  text: '#f1f1f3',
  textSecondary: '#9898b3',
  textMuted: '#6666a0',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
