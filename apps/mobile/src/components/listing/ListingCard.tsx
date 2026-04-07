import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Avatar } from '../ui';
import { useThemeColors } from '../../contexts/ThemeContext';
import { borderRadius, fontFamily, shadows, space } from '../../theme';
import { daysRemaining, formatPrice, urgencyLabel } from '../../lib/formatters';
import { ListingMediaHeader } from './ListingMediaHeader';
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

  const openListing = () => {
    router.push(`/listing/${listing.id}` as any);
  };

  return (
    <View style={styles.card}>
      <ListingMediaHeader
        listingId={listing.id}
        title={listing.title}
        category={listing.category}
        images={listing.images}
        onPress={openListing}
        onFavoriteToggle={onFavoriteToggle}
        isFavorited={isFavorited}
      />

      <TouchableOpacity activeOpacity={0.86} onPress={openListing} style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.tags}>
            <Badge label={listing.category} variant="accent" size="sm" />
            <View style={styles.cityChip}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.cityText}>{listing.city}</Text>
            </View>
            {listing.deliveryUrgency === 'urgent' && (
              <Badge label={urgencyLabel(listing.deliveryUrgency)} variant="error" size="sm" />
            )}
          </View>
          {days !== null && (
            <Text style={[styles.daysText, days <= 3 && { color: colors.error.DEFAULT }]}>
              {days === 0 ? 'Bugün' : `${days}g`}
            </Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

        <Text style={styles.budget}>
          {listing.budgetMin === 0 && listing.budgetMax === 0
            ? 'Teklif Bekliyor'
            : listing.budgetMin === listing.budgetMax
            ? formatPrice(listing.budgetMin)
            : `${formatPrice(listing.budgetMin)} - ${formatPrice(listing.budgetMax)}`}
        </Text>

        <View style={styles.footer}>
          <View style={styles.buyerInfo}>
            <Avatar
              name={listing.buyerName}
              image={listing.buyerImage}
              size="sm"
              verified={listing.buyerVerified}
            />
            <View style={styles.buyerMeta}>
              <Text style={styles.buyerName} numberOfLines={1}>{listing.buyerName}</Text>
              <View style={styles.scoreRow}>
                <Ionicons name="star" size={11} color="#F7B500" />
                <Text style={styles.scoreText}>{listing.buyerScore?.toFixed?.(1) ?? listing.buyerScore}</Text>
              </View>
            </View>
          </View>

          <View style={styles.offerBadge}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.accent.DEFAULT} />
            <Text style={styles.offerText}>{listing.offerCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
    gap: space.sm,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
  },
  cityText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  daysText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: space.xs + 2,
  },
  budget: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
    marginBottom: space.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    gap: space.sm,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    flex: 1,
    minWidth: 0,
  },
  buyerMeta: {
    flex: 1,
    minWidth: 0,
  },
  buyerName: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  scoreText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.lighter,
  },
  offerText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.accent.DEFAULT,
  },
});
