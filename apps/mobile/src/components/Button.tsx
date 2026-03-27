import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../lib/constants';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title, onPress, loading, disabled, variant = 'primary', size = 'md', style, textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  size_sm: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, minHeight: 48 },
  size_lg: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, minHeight: 56 },
  variant_primary: { backgroundColor: COLORS.primary },
  variant_outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: COLORS.error },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600', textAlign: 'center' },
  text_primary: { color: COLORS.white },
  text_outline: { color: COLORS.primary },
  text_ghost: { color: COLORS.primary },
  text_danger: { color: COLORS.white },
  textSize_sm: { fontSize: 14 },
  textSize_md: { fontSize: 16 },
  textSize_lg: { fontSize: 17 },
});
