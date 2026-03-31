import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../../contexts/ThemeContext';
import { fontFamily, space, borderRadius } from '../../theme';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: colors.primary.lighter, text: colors.primary.DEFAULT },
    accent:  { bg: colors.accent.lighter,  text: colors.accent.DEFAULT  },
    success: { bg: colors.success.light,   text: colors.success.DEFAULT },
    warning: { bg: colors.warning.light,   text: colors.warning.DEFAULT },
    error:   { bg: colors.error.light,     text: colors.error.DEFAULT   },
    neutral: { bg: colors.surfaceRaised,   text: colors.textSecondary   },
  };

  const v = variantMap[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: v.bg },
        isSmall ? styles.sm : styles.md,
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: v.text }, isSmall ? styles.textSm : styles.textMd]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (_colors: any) => StyleSheet.create({
  base: { alignSelf: 'flex-start', borderRadius: borderRadius.sm },
  sm: { paddingHorizontal: space.sm, paddingVertical: 2 },
  md: { paddingHorizontal: space.sm + 4, paddingVertical: 4 },
  text: { fontFamily: fontFamily.semiBold },
  textSm: { fontSize: 11, lineHeight: 14 },
  textMd: { fontSize: 12, lineHeight: 16 },
});
