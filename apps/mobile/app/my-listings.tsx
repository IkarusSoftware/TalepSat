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

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');

  const { data: listings = [], isLoading, isRefetching, refetch } = useQuery<Listing[]>({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/listings', { params: { buyerId: user!.id } });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });

  const handleDelete = useCallback((listing: Listing) => {
    Alert.alert(
      'İlanı Sil',
      `"${listing.title}" ilanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
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

  const filtered = useMemo(
    () => listings.filter((listing) => listing.status === activeTab),
    [listings, activeTab],
  );

  const tabCounts = useMemo(() => ({
    active: listings.filter((listing) => listing.status === 'active').length,
    pending: listings.filter((listing) => listing.status === 'pending').length,
    completed: listings.filter((listing) => listing.status === 'completed').length,
    expired: listings.filter((listing) => listing.status === 'expired').length,
  }), [listings]);

  const stats = useMemo(() => ({
    active: tabCounts.active,
    completed: tabCounts.completed,
  }), [tabCounts]);

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İlanlarım</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.DEFAULT} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlanlarım</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(tabs)/create' as any)}>
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.accent.DEFAULT }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Aktif İlan</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCenter]}>
          <Text style={[styles.statNum, { color: colors.primary.DEFAULT }]}>{listings.length}</Text>
          <Text style={styles.statLabel}>Toplam İlan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.success.DEFAULT }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
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
            icon="document-text-outline"
            title={
              activeTab === 'active'
                ? 'Aktif ilan yok'
                : activeTab === 'pending'
                ? 'Onay bekleyen ilan yok'
                : activeTab === 'completed'
                ? 'Tamamlanan ilan yok'
                : 'Süresi dolan ilan yok'
            }
            subtitle="İlk ilanını oluştur ve teklif almaya başla!"
          />
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: space.md,
  },
  statCardCenter: {},
  statNum: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: fontFamily.extraBold,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
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
    paddingBottom: 100,
  },
});
