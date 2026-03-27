import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../lib/constants';

type Listing = {
  id: string;
  title: string;
  category: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  offerCount: number;
  status: string;
  images?: string[];
  buyerName: string;
  deliveryUrgency: string;
  expiresAt: string;
};

const urgencyColors: Record<string, string> = {
  urgent: '#ef4444',
  normal: '#6366f1',
  flexible: '#22c55e',
};

const urgencyLabels: Record<string, string> = {
  urgent: 'Acil',
  normal: 'Normal',
  flexible: 'Esnek',
};

function fmt(n: number) {
  return n.toLocaleString('tr-TR');
}

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000)
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/listing/${listing.id}`)}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{listing.category}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors[listing.deliveryUrgency] + '20' }]}>
          <View style={[styles.urgencyDot, { backgroundColor: urgencyColors[listing.deliveryUrgency] }]} />
          <Text style={[styles.urgencyText, { color: urgencyColors[listing.deliveryUrgency] }]}>
            {urgencyLabels[listing.deliveryUrgency]}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

      {/* Meta */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{listing.city}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{daysLeft} gün</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="chatbubble-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{listing.offerCount} teklif</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.budgetLabel}>Bütçe</Text>
          <Text style={styles.budget}>
            ₺{fmt(listing.budgetMin)} – ₺{fmt(listing.budgetMax)}
          </Text>
        </View>
        <View style={styles.buyerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {listing.buyerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.buyerName} numberOfLines={1}>{listing.buyerName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  categoryBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  categoryText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  urgencyDot: { width: 6, height: 6, borderRadius: 3 },
  urgencyText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, lineHeight: 22 },
  meta: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  budgetLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  budget: { fontSize: 15, fontWeight: '700', color: COLORS.primaryLight },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 120 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  buyerName: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
});
