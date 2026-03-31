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
      <View style={styles.topRow}>
        <View style={styles.tags}>
          <Badge label={listing.category} variant="accent" size="sm" />
          <Text style={styles.city}>📍 {listing.city}</Text>
          {listing.deliveryUrgency === 'urgent' && (
            <Badge label={urgencyLabel(listing.deliveryUrgency)} variant="error" size="sm" />
          )}
        </View>
        {onFavoriteToggle && (
          <TouchableOpacity onPress={() => onFavoriteToggle(listing.id)} hitSlop={8}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorited ? colors.error.DEFAULT : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

      <Text style={styles.budget}>
        {formatPrice(listing.budgetMin)} — {formatPrice(listing.budgetMax)}
      </Text>

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
            <Badge label={`${listing.offerCount} teklif`} variant="primary" size="sm" />
          )}
          {days !== null && (
            <Text style={[styles.daysText, days <= 3 && { color: colors.error.DEFAULT }]}>
              {days} gün
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
    padding: space.md,
    marginBottom: space.sm + 4,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: space.sm,
  },
  tags: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  city: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary },
  title: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.textPrimary, marginBottom: space.xs },
  budget: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.accent.DEFAULT, marginBottom: space.sm + 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerInfo: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  buyerName: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textSecondary, maxWidth: 120 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  daysText: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textSecondary },
});
