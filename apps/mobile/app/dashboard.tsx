import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
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
import type { Listing } from '../src/types';

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

  const { data: listings = [], isLoading, isRefetching, refetch } = useQuery<Listing[]>({
    queryKey: ['buyer-dashboard', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/listings', { params: { buyerId: user!.id } });
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
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const filtered = useMemo(
    () => listings.filter((listing) => listing.status === activeTab),
    [activeTab, listings],
  );

  const tabCounts = useMemo(() => ({
    active: listings.filter((listing) => listing.status === 'active').length,
    pending: listings.filter((listing) => listing.status === 'pending').length,
    completed: listings.filter((listing) => listing.status === 'completed').length,
    expired: listings.filter((listing) => listing.status === 'expired').length,
  }), [listings]);

  const totals = useMemo(() => {
    const totalOfferCount = listings.reduce((sum, listing) => sum + (listing.offerCount ?? 0), 0);
    const liveBudget = listings
      .filter((listing) => listing.status === 'active')
      .reduce((sum, listing) => sum + (listing.budgetMax ?? 0), 0);

    return {
      active: tabCounts.active,
      totalOfferCount,
      liveBudget,
    };
  }, [listings, tabCounts.active]);

  const handleDelete = useCallback((listing: Listing) => {
    Alert.alert(
      'İlanı Sil',
      `"${listing.title}" ilanını silmek istediğine emin misin? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
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

    return (
      <OwnerListingCard
        listing={item}
        statusLabel={status.label}
        statusColor={status.color}
        onOpen={() => router.push(`/listing/${item.id}` as any)}
        onDelete={() => handleDelete(item)}
      />
    );
  }, [handleDelete, router]);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.heroOverline}>Alıcı Paneli</Text>
          <Text style={styles.heroTitle}>İlanlarını ve teklif trafiğini buradan yönet</Text>
          <Text style={styles.heroText}>
            Web tarafındaki ilan yönetimi mantığını mobile taşıyoruz. Aktif, tamamlanan ve süresi dolan ilanların tek yerde.
          </Text>
        </View>
        <TouchableOpacity style={styles.heroAction} onPress={() => router.push('/(tabs)/create' as any)} activeOpacity={0.86}>
          <Ionicons name="add" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Aktif İlan" value={totals.active} accent={colors.accent.DEFAULT} styles={styles} />
        <StatCard label="Toplam Teklif" value={totals.totalOfferCount} accent={colors.primary.DEFAULT} styles={styles} />
        <StatCard label="Açık Bütçe" value={`₺${totals.liveBudget.toLocaleString('tr-TR')}`} accent={colors.success.DEFAULT} styles={styles} />
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
                  : activeTab === 'completed'
                    ? 'Tamamlanan ilan yok'
                    : 'Süresi dolan ilan yok'
            }
            subtitle="Yeni bir talep aç ve satıcı tekliflerini toplamaya başla."
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
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  statCard: {
    flex: 1,
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
