/**
 * TalepSat Mobile Shadow Tokens
 * Platform-specific shadows (iOS shadowXxx / Android elevation)
 */

import { Platform, ViewStyle } from 'react-native';

const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ViewStyle => {
  if (Platform.OS === 'android') {
    return { elevation };
  }
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
};

export const shadows = {
  none: createShadow(0, 0, 0, 0),
  sm: createShadow(1, 2, 0.05, 2),
  md: createShadow(4, 12, 0.08, 4),
  lg: createShadow(8, 24, 0.12, 8),
  xl: createShadow(16, 48, 0.16, 16),
} as const;

export type Shadows = typeof shadows;
