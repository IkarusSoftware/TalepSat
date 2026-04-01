import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Avatar } from '../ui';
import { useThemeColors } from '../../contexts/ThemeContext';
import { fontFamily, space, borderRadius, shadows } from '../../theme';
import { formatPrice, urgencyLabel, daysRemaining } from '../../lib/formatters';
import type { Listing } from '../../types';

interface ListingCardProps {
  listing: Listing;
  onFavoriteToggle?: (id: string) => void;
  isFavorited?: boolean;
}

export function ListingCard({ listing, onFavoriteToggle, isFavorited }: ListingCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const days = daysRemaining(listing.expiresAt);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/listing/${listing.id}` as any)}
      style={styles.card}
    >
      {/* Top row: category + city + urgent badge + fav */}
      <View style={styles.topRow}>
        <View style={styles.tags}>
          <Badge label={listing.category} variant="accent" size="sm" />
          <Text style={styles.city}>
            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
            {' '}{listing.city}
          </Text>
          {listing.deliveryUrgency === 'urgent' && (
            <Badge label={urgencyLabel(listing.deliveryUrgency)} variant="error" size="sm" />
          )}
        </View>
        {onFavoriteToggle && (
          <TouchableOpacity onPress={() => onFavoriteToggle(listing.id)} hitSlop={10}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorited ? colors.error.DEFAULT : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

      {/* Budget */}
      <Text style={styles.budget}>
        {listing.budgetMin === 0 && listing.budgetMax === 0
          ? 'Teklif Bekliyor'
          : listing.budgetMin === listing.budgetMax
          ? formatPrice(listing.budgetMin)
          : `${formatPrice(listing.budgetMin)} — ${formatPrice(listing.budgetMax)}`}
      </Text>

      {/* Footer: buyer + meta */}
      <View style={styles.bottomRow}>
        <View style={styles.buyerInfo}>
          <Avatar
            name={listing.buyerName}
            image={listing.buyerImage}
            size="sm"
            verified={listing.buyerVerified}
          />
          <Text style={styles.buyerName} numberOfLines={1}>{listing.buyerName}</Text>
        </View>
        <View style={styles.meta}>
          {listing.offerCount > 0 && (
            <View style={styles.offerBadge}>
              <Ionicons name="chatbubble-outline" size={11} color={colors.accent.DEFAULT} />
              <Text style={styles.offerText}>{listing.offerCount}</Text>
            </View>
          )}
          {days !== null && (
            <Text style={[styles.daysText, days <= 3 && { color: colors.error.DEFAULT }]}>
              {days}g
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: space.sm + 4,   // 12px — tighter than before (was space.md = 16)
    marginBottom: space.sm,  // 8px gap
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xs + 2,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    flexShrink: 1,
  },
  city: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: space.xs,
    lineHeight: 21,
  },
  budget: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
    marginBottom: space.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    flexShrink: 1,
  },
  buyerName: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    maxWidth: 110,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.lighter,
  },
  offerText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.accent.DEFAULT,
  },
  daysText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
});
