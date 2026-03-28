import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../../theme';

interface PriceTextProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: TextStyle;
}

const formatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return formatter.format(amount);
}

export function PriceText({
  amount,
  size = 'md',
  color = colors.accent.DEFAULT,
  style,
}: PriceTextProps) {
  return (
    <Text style={[styles.base, sizeStyles[size], { color }, style]}>
      {formatPrice(amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.bold,
  },
});

const sizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: 14 },
  md: { fontSize: 18 },
  lg: { fontSize: 24 },
};
