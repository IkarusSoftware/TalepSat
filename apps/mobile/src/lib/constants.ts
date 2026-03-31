import Constants from 'expo-constants';
import { borderRadius, colors, space } from '../theme';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();

export const API_URL =
  envApiUrl || (debuggerHost ? `http://${debuggerHost}:3000` : 'http://10.0.2.2:3000');

// Backward-compatible alias for older API helpers.
export const API_BASE = API_URL;

// Backward-compatible theme aliases used by legacy mobile components.
export const COLORS = {
  background: colors.background,
  surface: colors.surface,
  surfaceLight: colors.surfaceRaised,
  border: colors.border,
  text: colors.textPrimary,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textTertiary,
  primary: colors.primary.DEFAULT,
  primaryLight: colors.primary.light,
  accent: colors.accent.DEFAULT,
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,
  error: colors.error.DEFAULT,
  white: colors.white,
  black: colors.black,
  overlay: colors.overlay,
} as const;

export const SPACING = {
  xs: space.xs,
  sm: space.sm,
  md: space.md,
  lg: space.lg,
  xl: space.xl,
  xxl: space.xxl,
} as const;

export const RADIUS = {
  none: borderRadius.none,
  sm: borderRadius.sm,
  md: borderRadius.md,
  lg: borderRadius.lg,
  xl: borderRadius.xl,
  full: borderRadius.full,
} as const;
