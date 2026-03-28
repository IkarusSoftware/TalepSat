import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fontFamily, space, borderRadius } from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent.DEFAULT,
    borderColor: colors.accent.DEFAULT,
  },
  text: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.white,
  },
});
