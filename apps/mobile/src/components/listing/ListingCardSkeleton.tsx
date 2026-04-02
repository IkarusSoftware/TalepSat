import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../ui';
import { useThemeColors } from '../../contexts/ThemeContext';
import { space, borderRadius, shadows } from '../../theme';

export function ListingCardSkeleton() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={188} borderRadius={0} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.tags}>
            <Skeleton width={72} height={22} borderRadius={borderRadius.full} />
            <Skeleton width={84} height={24} borderRadius={borderRadius.full} />
          </View>
          <Skeleton width={28} height={14} borderRadius={borderRadius.full} />
        </View>
        <Skeleton width="88%" height={18} borderRadius={borderRadius.sm} style={{ marginBottom: space.xs }} />
        <Skeleton width="62%" height={18} borderRadius={borderRadius.sm} style={{ marginBottom: space.md }} />
        <View style={styles.bottomRow}>
          <View style={styles.buyerInfo}>
            <Skeleton width={28} height={28} borderRadius={14} />
            <View>
              <Skeleton width={92} height={14} borderRadius={borderRadius.sm} style={{ marginBottom: 4 }} />
              <Skeleton width={52} height={12} borderRadius={borderRadius.sm} />
            </View>
          </View>
          <Skeleton width={54} height={26} borderRadius={borderRadius.full} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginBottom: space.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  content: {
    padding: space.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  tags: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  buyerInfo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
