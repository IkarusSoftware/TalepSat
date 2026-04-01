import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../src/lib/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { fontFamily, space, borderRadius, shadows } from '../src/theme';
import { EmptyState } from '../src/components/ui';
import type { Listing } from '../src/types';

const deliveryLabels: Record<string, string> = {
  urgent:    'Acil (1-3 gün)',
  week:      '1 Hafta',
  two_weeks: '2 Hafta',
  month:     '1 Ay',
  flexible:  'Esnek',
  normal:    'Normal',
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active:    { label: 'Aktif',         color: '#1A8754' },
  pending:   { label: 'Onay Bekliyor', color: '#D4940A' },
  rejected:  { label: 'Reddedildi',    color: '#C93B3B' },
  completed: { label: 'Tamamlandı',    color: '#1B2B4B' },
  expired:   { label: 'Süresi Doldu',  color: '#7A7668' },
};

const TABS = [
  { value: 'active',    label: 'Aktif' },
  { value: 'pending',   label: 'Onay Bekliyor' },
  { value: 'completed', label: 'Tamamlanan' },
  { value: 'expired',   label: 'Süresi Dolan' },
];

function formatBudget(min: number, max: number): string {
  if (min === 0 && max === 0) return 'Teklif Bekliyor';
  const fmt = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
  if (min === max) return fmt(min);
  return `${fmt(min)} — ${fmt(max)}`;
}

function daysLeft(expiresAt: string | null): string {
  if (!expiresAt) return '';
  const days = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000));
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

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
      const res = await api.get('/api/listings', { params: { buyerId: user!.id } });
      return res.data;
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
      ]
    );
  }, [deleteMutation]);

  const filtered = useMemo(
    () => listings.filter((l) => l.status === activeTab),
    [listings, activeTab]
  );

  const tabCounts = useMemo(() => ({
    active:    listings.filter((l) => l.status === 'active').length,
    pending:   listings.filter((l) => l.status === 'pending').length,
    completed: listings.filter((l) => l.status === 'completed').length,
    expired:   listings.filter((l) => l.status === 'expired').length,
  }), [listings]);

  const stats = useMemo(() => ({
    active:    tabCounts.active,
    completed: tabCounts.completed,
  }), [tabCounts]);

  const renderItem = useCallback(({ item }: { item: Listing }) => {
    const cfg = statusConfig[item.status] ?? statusConfig.active;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() => router.push(`/listing/${item.id}` as any)}
      >
        {/* Badges */}
        <View style={styles.cardTop}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {item.status === 'active' && item.expiresAt && (
            <Text style={styles.daysLeft}>{daysLeft(item.expiresAt)}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

        {/* Budget */}
        <Text style={styles.budget}>{formatBudget(item.budgetMin, item.budgetMax)}</Text>

        {/* Meta */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{deliveryLabels[item.deliveryUrgency] ?? item.deliveryUrgency}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.viewCount}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.offerInfo}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.accent.DEFAULT} />
            <Text style={styles.offerCount}>{item.offerCount} teklif</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/listing/${item.id}` as any)}
            >
              <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.editText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={14} color={colors.error.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, styles, router, handleDelete]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İlanlarım</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.DEFAULT} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlanlarım</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/(tabs)/create' as any)}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.accent.DEFAULT }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Aktif İlan</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMid]}>
          <Text style={[styles.statNum, { color: colors.primary.DEFAULT }]}>{listings.length}</Text>
          <Text style={styles.statLabel}>Toplam İlan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.success.DEFAULT }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          data={TABS}
          keyExtractor={(t) => t.value}
          renderItem={({ item: tab }) => {
            const cnt = tabCounts[tab.value as keyof typeof tabCounts];
            const active = activeTab === tab.value;
            return (
              <TouchableOpacity
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.value)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}{cnt > 0 ? ` (${cnt})` : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.DEFAULT}
            colors={[colors.accent.DEFAULT]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={
              activeTab === 'active' ? 'Aktif ilan yok' :
              activeTab === 'pending' ? 'Onay bekleyen ilan yok' :
              activeTab === 'completed' ? 'Tamamlanan ilan yok' :
              'Süresi dolan ilan yok'
            }
            subtitle="İlk ilanını oluştur ve teklif almaya başla!"
          />
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.lg, paddingVertical: space.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:     { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  newBtn:      {
    width: 36, height: 36, borderRadius: borderRadius.md,
    backgroundColor: colors.accent.DEFAULT,
    justifyContent: 'center', alignItems: 'center',
  },

  // Stats
  statsRow:    {
    flexDirection: 'row', paddingHorizontal: space.lg,
    paddingVertical: space.md, gap: space.sm,
  },
  statCard:    {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: space.md, alignItems: 'center',
  },
  statCardMid: {},
  statNum:     { fontSize: 22, fontFamily: fontFamily.extraBold, lineHeight: 26 },
  statLabel:   { fontSize: 11, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },

  // Tabs
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsScroll:    { paddingHorizontal: space.lg, gap: space.xs },
  tab:           {
    paddingHorizontal: space.md, paddingVertical: space.sm + 2,
    borderRadius: borderRadius.md,
  },
  tabActive:     { backgroundColor: colors.primary.DEFAULT },
  tabText:       { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textSecondary },
  tabTextActive: { color: colors.white, fontFamily: fontFamily.semiBold },

  // List
  list:          { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
    ...shadows.sm,
  },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs + 2 },
  badgeRow:     { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, flexShrink: 1 },
  categoryBadge: {
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  categoryText: { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.primary.DEFAULT },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusText:   { fontSize: 12, fontFamily: fontFamily.medium },
  daysLeft:     { fontSize: 11, fontFamily: fontFamily.medium, color: '#D4940A' },
  title:        { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary, lineHeight: 21, marginBottom: 4 },
  budget:       { fontSize: 14, fontFamily: fontFamily.bold, color: colors.accent.DEFAULT, marginBottom: space.sm },
  meta:         { flexDirection: 'row', gap: space.md, marginBottom: space.sm + 2, flexWrap: 'wrap' },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 11, fontFamily: fontFamily.regular, color: colors.textSecondary },

  // Footer
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  offerInfo:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  offerCount:   { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  actions:      { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  editBtn:      {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  editText:     { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textSecondary },
  deleteBtn:    {
    width: 30, height: 30, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.error.light,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.error.light,
  },
});
