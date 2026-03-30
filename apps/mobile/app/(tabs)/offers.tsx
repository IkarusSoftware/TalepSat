import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, fontFamily, space, borderRadius } from '../../src/theme';

function formatPrice(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk önce`;
  if (hours < 24) return `${hours}sa önce`;
  return `${days}g önce`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Bekliyor',   color: colors.warning.DEFAULT, bg: colors.warning.light },
  accepted: { label: 'Kabul',      color: colors.success.DEFAULT, bg: colors.success.light },
  rejected: { label: 'Reddedildi', color: colors.error.DEFAULT,   bg: colors.error.light   },
  completed:{ label: 'Tamamlandı', color: colors.success.DEFAULT, bg: colors.success.light },
};

export default function OffersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: offers = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-offers'],
    queryFn: async () => {
      const res = await api.get('/api/offers/mine');
      return res.data;
    },
    enabled: !!user,
  });

  const renderItem = ({ item: offer }: { item: any }) => {
    const status = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/listing/${offer.listingId}` as any)}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Listing Title */}
        <Text style={styles.listingTitle} numberOfLines={2}>{offer.listing?.title ?? 'İlan'}</Text>

        {/* Price & Date */}
        <View style={styles.row}>
          <View style={styles.priceWrap}>
            <Ionicons name="pricetag-outline" size={14} color={colors.primary.DEFAULT} />
            <Text style={styles.price}>{formatPrice(offer.price)}</Text>
          </View>
          <Text style={styles.date}>{timeAgo(offer.createdAt)}</Text>
        </View>

        {/* Note */}
        {offer.note ? (
          <Text style={styles.note} numberOfLines={2}>{offer.note}</Text>
        ) : null}

        {/* Counterpart */}
        <View style={styles.counterpart}>
          <Ionicons
            name={offer.sellerId === user?.id ? 'storefront-outline' : 'person-outline'}
            size={14}
            color={colors.textTertiary}
          />
          <Text style={styles.counterpartText}>
            {offer.sellerId === user?.id
              ? `Alıcı: ${offer.listing?.user?.name ?? '—'}`
              : `Satıcı: ${offer.seller?.name ?? '—'}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teklifler</Text>
        {!isLoading && offers.length > 0 && (
          <Text style={styles.headerSubtitle}>{offers.length} teklif</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="pricetag-outline" size={32} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.emptyText}>Henüz teklif yok</Text>
              <Text style={styles.emptySubtext}>
                İlanlara göz at ve teklif vermeye başla
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>İlanları Keşfet</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary.light} />
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: space.lg, paddingBottom: 100, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  listingTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.primary.DEFAULT,
  },
  date: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  note: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  counterpart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterpartText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: space.sm,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: space.lg,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    backgroundColor: colors.primary.lighter,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  exploreBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.primary.light,
  },
});
