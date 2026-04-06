import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../src/lib/api';
import { OwnerListingCard } from '../src/components/listing/OwnerListingCard';
import { EmptyState } from '../src/components/ui';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { borderRadius, fontFamily, space } from '../src/theme';
import type { Listing, Offer } from '../src/types';

type SortKey = 'newest' | 'offers' | 'budget' | 'expires';

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: '#1A8754' },
  pending: { label: 'Onay Bekliyor', color: '#D4940A' },
  rejected: { label: 'Reddedildi', color: '#C93B3B' },
  completed: { label: 'Tamamlandı', color: '#1B2B4B' },
  expired: { label: 'Süresi Doldu', color: '#7A7668' },
};

const tabs = [
  { value: 'active', label: 'Aktif' },
  { value: 'pending', label: 'Onay Bekliyor' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'completed', label: 'Tamamlanan' },
  { value: 'expired', label: 'Süresi Dolan' },
];

export default function BuyerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const { data: listings = [], isLoading, isRefetching, refetch } = useQuery<Listing[]>({
    queryKey: ['buyer-dashboard', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/listings', { params: { buyerId: user!.id } });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ['buyer-dashboard-offers', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/offers', { params: { role: 'buyer' } });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await api.delete(`/api/listings/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
  });

  const tabCounts = useMemo(() => ({
    active: listings.filter((listing) => listing.status === 'active').length,
    pending: listings.filter((listing) => listing.status === 'pending').length,
    rejected: listings.filter((listing) => listing.status === 'rejected').length,
    completed: listings.filter((listing) => listing.status === 'completed').length,
    expired: listings.filter((listing) => listing.status === 'expired').length,
  }), [listings]);

  const pendingOfferCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    offers
      .filter((offer) => offer.status === 'pending')
      .forEach((offer) => {
        counts[offer.listingId] = (counts[offer.listingId] || 0) + 1;
      });
    return counts;
  }, [offers]);

  const totals = useMemo(() => ({
    active: tabCounts.active,
    totalOffers: offers.length,
    totalPending: offers.filter((offer) => offer.status === 'pending').length,
    completed: tabCounts.completed,
  }), [offers, tabCounts.active, tabCounts.completed]);

  const filtered = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');
    const next = listings
      .filter((listing) => listing.status === activeTab)
      .filter((listing) => !pendingOnly || (pendingOfferCounts[listing.id] || 0) > 0)
      .filter((listing) => {
        if (!normalizedQuery) return true;
        return [listing.title, listing.category, listing.city]
          .filter(Boolean)
          .some((field) => field.toLocaleLowerCase('tr-TR').includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sortBy === 'offers') return b.offerCount - a.offerCount;
        if (sortBy === 'budget') return b.budgetMax - a.budgetMax;
        if (sortBy === 'expires') {
          const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return next;
  }, [activeTab, listings, pendingOfferCounts, pendingOnly, searchQuery, sortBy]);

  const actionableCount = useMemo(
    () => listings.filter((listing) => (pendingOfferCounts[listing.id] || 0) > 0 || ['rejected', 'expired'].includes(listing.status)).length,
    [listings, pendingOfferCounts],
  );

  const handleDelete = useCallback((listing: Listing) => {
    Alert.alert(
      'İlanı Sil',
      `"${listing.title}" ilanini silmek istedigine emin misin? Bu islem geri alinamaz.`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(listing.id),
        },
      ],
    );
  }, [deleteMutation]);

  const renderItem = useCallback(({ item }: { item: Listing }) => {
    const status = statusConfig[item.status] ?? statusConfig.active;
    const recreateLabel =
      item.status === 'rejected'
        ? 'Yeniden Olustur'
        : item.status === 'expired'
          ? 'Yeniden Yayınla'
          : 'Benzer İlan Aç';

    return (
      <OwnerListingCard
        listing={item}
        statusLabel={status.label}
        statusColor={status.color}
        pendingOfferCount={pendingOfferCounts[item.id] || 0}
        onOpen={() => router.push(`/listing/${item.id}` as any)}
        onEdit={() => router.push(`/listing-edit/${item.id}` as any)}
        onViewOffers={item.status === 'active' ? () => router.push(`/listing/${item.id}` as any) : undefined}
        onCompare={item.status === 'active' && item.offerCount > 1 ? () => router.push(`/listing-compare/${item.id}` as any) : undefined}
        onRecreate={['rejected', 'expired', 'completed'].includes(item.status) ? () => router.push({ pathname: '/(tabs)/create', params: { cloneId: item.id } } as any) : undefined}
        recreateLabel={recreateLabel}
        onDelete={() => handleDelete(item)}
      />
    );
  }, [handleDelete, pendingOfferCounts, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.DEFAULT} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroOverline}>İlan Yönetimi</Text>
          <Text style={styles.heroTitle}>İlanlarını ve tekliflerini tek ekranda yönet</Text>
          <Text style={styles.heroText}>
            Tum owner aksiyonlarini bu merkezde topladik. Aktif, reddedilen ve suresi dolan ilanlarini buradan takip edebilirsin.
          </Text>
        </View>
        <TouchableOpacity style={styles.heroAction} onPress={() => router.push('/(tabs)/create' as any)} activeOpacity={0.86}>
          <Ionicons name="add" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Başlık, kategori veya şehir ara"
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent.DEFAULT}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[styles.filterChip, pendingOnly && styles.filterChipActive]}
            onPress={() => setPendingOnly((prev) => !prev)}
            activeOpacity={0.82}
          >
            <Ionicons
              name="flash-outline"
              size={14}
              color={pendingOnly ? colors.white : colors.warning.DEFAULT}
            />
            <Text style={[styles.filterChipText, pendingOnly && styles.filterChipTextActive]}>
              Bekleyen teklifli
            </Text>
          </TouchableOpacity>
          {[
            { key: 'newest', label: 'En yeni' },
            { key: 'offers', label: 'Teklif' },
            { key: 'budget', label: 'Bütçe' },
            { key: 'expires', label: 'Süre' },
          ].map((item) => {
            const active = sortBy === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSortBy(item.key as SortKey)}
                activeOpacity={0.82}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryBanner}>
          <Text style={styles.summaryTitle}>Aksiyon gereken ilanlar: {actionableCount}</Text>
          <Text style={styles.summaryText}>
            Bekleyen teklifleri olan, reddedilen veya suresi dolan talepleri bu ekrandan hizlica yonetebilirsin.
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Aktif İlan" value={totals.active} accent={colors.accent.DEFAULT} styles={styles} />
        <StatCard label="Toplam Teklif" value={totals.totalOffers} accent={colors.primary.DEFAULT} styles={styles} />
        <StatCard label="Bekleyen Teklif" value={totals.totalPending} accent={colors.warning.DEFAULT} styles={styles} />
        <StatCard label="Tamamlanan" value={totals.completed} accent={colors.success.DEFAULT} styles={styles} />
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          renderItem={({ item }) => {
            const count = tabCounts[item.value as keyof typeof tabCounts];
            const active = activeTab === item.value;

            return (
              <TouchableOpacity
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(item.value)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                  {count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.DEFAULT}
            colors={[colors.accent.DEFAULT]}
          />
        )}
        ListEmptyComponent={(
          <EmptyState
            icon="briefcase-outline"
            title={
              activeTab === 'active'
                ? 'Aktif ilan yok'
                : activeTab === 'pending'
                  ? 'Onay bekleyen ilan yok'
                  : activeTab === 'rejected'
                    ? 'Reddedilen ilan yok'
                    : activeTab === 'completed'
                      ? 'Tamamlanan ilan yok'
                      : 'Süresi dolan ilan yok'
            }
            subtitle="Yeni bir talep ac ve satici tekliflerini toplamaya basla."
          />
        )}
      />
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  accent,
  styles,
}: {
  label: string;
  value: string | number;
  accent: string;
  styles: any;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  heroCopy: { flex: 1 },
  heroOverline: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    marginTop: 6,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 8,
  },
  heroAction: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  toolbar: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  summaryBanner: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  summaryText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: fontFamily.extraBold,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsScroll: {
    paddingHorizontal: space.lg,
    gap: space.xs,
  },
  tab: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
  },
  list: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 110,
  },
});
