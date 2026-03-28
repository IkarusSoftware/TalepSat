/**
 * TalepSat Mobile Typography Tokens
 * Font: Plus Jakarta Sans — mirrored from @talepsat/tokens
 */

import { TextStyle } from 'react-native';

// Font family names (loaded via @expo-google-fonts/plus-jakarta-sans)
export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

// Weight mapping for dynamic usage
export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
} as const;

// Type scale — rem values converted to px (1rem = 16px)
export const typeScale = {
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fontFamily.extraBold,
    letterSpacing: -0.32,
  } as TextStyle,
  h1: {
    fontSize: 36,
    lineHeight: 44,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.16,
  } as TextStyle,
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: fontFamily.semiBold,
  } as TextStyle,
  h3: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: fontFamily.semiBold,
  } as TextStyle,
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: fontFamily.medium,
  } as TextStyle,
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamily.regular,
  } as TextStyle,
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
  } as TextStyle,
  bodySm: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.regular,
  } as TextStyle,
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamily.regular,
  } as TextStyle,
} as const;

export type TypeScale = typeof typeScale;
