import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../ui';
import { colors, space, borderRadius, shadows } from '../../theme';

export function ListingCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Top row: category badge + city */}
      <View style={styles.topRow}>
        <View style={styles.tags}>
          <Skeleton width={72} height={18} borderRadius={borderRadius.sm} />
          <Skeleton width={60} height={14} borderRadius={borderRadius.sm} />
        </View>
        <Skeleton width={20} height={20} borderRadius={borderRadius.full} />
      </View>

      {/* Title */}
      <Skeleton width="90%" height={18} borderRadius={borderRadius.sm} style={{ marginBottom: space.xs }} />

      {/* Budget */}
      <Skeleton width={160} height={16} borderRadius={borderRadius.sm} style={{ marginBottom: space.sm + 4 }} />

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View style={styles.buyerInfo}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={80} height={14} borderRadius={borderRadius.sm} />
        </View>
        <View style={styles.meta}>
          <Skeleton width={56} height={18} borderRadius={borderRadius.sm} />
          <Skeleton width={40} height={14} borderRadius={borderRadius.sm} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: space.md,
    marginBottom: space.sm + 4,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
