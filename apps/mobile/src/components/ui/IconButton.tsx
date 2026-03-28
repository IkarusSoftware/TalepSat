import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, borderRadius } from '../../theme';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function IconButton({
  name,
  size = 22,
  color = colors.textPrimary,
  backgroundColor = colors.surfaceRaised,
  onPress,
  style,
  disabled,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        { backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
