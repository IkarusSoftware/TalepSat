import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ListingMediaHeader } from './ListingMediaHeader';
import { useThemeColors } from '../../contexts/ThemeContext';
import { borderRadius, fontFamily, shadows, space } from '../../theme';
import type { Listing } from '../../types';

interface OwnerListingCardProps {
  listing: Listing;
  statusLabel: string;
  statusColor: string;
  onOpen: () => void;
  onDelete: () => void;
}

const deliveryLabels: Record<string, string> = {
  urgent: 'Acil (1-3 gün)',
  week: '1 Hafta',
  two_weeks: '2 Hafta',
  month: '1 Ay',
  flexible: 'Esnek',
  normal: 'Normal',
};

function formatBudget(min: number, max: number) {
  if (min === 0 && max === 0) return 'Teklif Bekliyor';
  const formatter = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  if (min === max) return formatter(min);
  return `${formatter(min)} - ${formatter(max)}`;
}

function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return '';
  const days = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000));
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

export function OwnerListingCard({
  listing,
  statusLabel,
  statusColor,
  onOpen,
  onDelete,
}: OwnerListingCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <ListingMediaHeader
        listingId={listing.id}
        title={listing.title}
        category={listing.category}
        images={listing.images}
        onPress={onOpen}
      />

      <TouchableOpacity activeOpacity={0.86} onPress={onOpen} style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{listing.category}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {listing.status === 'active' && !!listing.expiresAt && (
            <Text style={styles.daysLeft}>{daysLeft(listing.expiresAt)}</Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.budget}>{formatBudget(listing.budgetMin, listing.budgetMax)}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{listing.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{deliveryLabels[listing.deliveryUrgency] ?? listing.deliveryUrgency}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{listing.viewCount}</Text>
          </View>
        </View>

        {listing.status === 'pending' && (
          <Text style={styles.pendingBanner}>Admin onayı bekleniyor - 24 saat içinde sonuçlanır.</Text>
        )}
        {listing.status === 'rejected' && (
          <Text style={styles.rejectedBanner}>İlan reddedildi. Düzenleyip yeniden gönderebilirsin.</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.offerInfo}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.accent.DEFAULT} />
          <Text style={styles.offerCount}>{listing.offerCount} teklif</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={onOpen} activeOpacity={0.82}>
            <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.editText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.82}>
            <Ionicons name="trash-outline" size={15} color={colors.error.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  content: {
    padding: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginBottom: space.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.primary.DEFAULT,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  daysLeft: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#D4940A',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  budget: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
    marginBottom: space.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  pendingBanner: {
    marginTop: space.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning.light,
    color: colors.warning.DEFAULT,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamily.medium,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  rejectedBanner: {
    marginTop: space.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error.light,
    color: colors.error.DEFAULT,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamily.medium,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.sm,
  },
  offerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerCount: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.accent.DEFAULT,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error.light,
    backgroundColor: colors.error.light,
  },
});
