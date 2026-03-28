import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily, space } from '../../theme';

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <View style={styles.line} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
});
