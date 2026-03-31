import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '../ui';
import { space } from '../../theme';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip
        label="Tümü"
        selected={selected === null}
        onPress={() => onSelect(null)}
      />
      {categories.map((cat) => (
        <Chip
          key={cat}
          label={cat}
          selected={selected === cat}
          onPress={() => onSelect(selected === cat ? null : cat)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.sm,
  },
});
