import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors, borderRadius, shadows, space } from '../../theme';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
}

const paddingMap: Record<CardPadding, number> = {
  none: 0,
  sm: space.sm,
  md: space.md,
  lg: space.lg,
};

export function Card({ children, padding = 'md', onPress, style }: CardProps) {
  const cardStyle = [
    styles.base,
    shadows.sm,
    { padding: paddingMap[padding] },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
});
