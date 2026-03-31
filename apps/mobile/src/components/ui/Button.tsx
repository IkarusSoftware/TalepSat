import React, { useMemo } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { useThemeColors } from '../../contexts/ThemeContext';
import { borderRadius, fontFamily, space } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  pill?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon, iconRight,
  fullWidth = false, pill = false, style, textStyle,
}: ButtonProps) {
  const colors = useThemeColors();

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: { backgroundColor: colors.accent.DEFAULT },
      text: { color: colors.white },
    },
    secondary: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary.DEFAULT },
      text: { color: colors.primary.DEFAULT },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: colors.textSecondary },
    },
    destructive: {
      container: { backgroundColor: colors.error.DEFAULT },
      text: { color: colors.white },
    },
  };

  const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: { container: { height: 36, paddingHorizontal: space.md }, text: { fontSize: 13, fontFamily: fontFamily.medium } },
    md: { container: { height: 44, paddingHorizontal: space.lg }, text: { fontSize: 15, fontFamily: fontFamily.semiBold } },
    lg: { container: { height: 52, paddingHorizontal: space.xl }, text: { fontSize: 16, fontFamily: fontFamily.semiBold } },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        vs.container,
        ss.container,
        pill && styles.pill,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'secondary' ? colors.primary.DEFAULT : colors.white}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[vs.text, ss.text, textStyle]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { borderRadius: borderRadius.full },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
});
