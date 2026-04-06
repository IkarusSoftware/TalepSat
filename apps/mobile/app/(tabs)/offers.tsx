import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';
import { fontFamily, space, borderRadius } from '../../src/theme';

type OfferItem = {
  id: string;
  price: number;
  deliveryDays: number;
  note?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  listingCity: string;
  buyerName?: string | null;
  sellerName?: string | null;
  sellerId: string;
  counterPrice?: number | null;
  counterDays?: number | null;
  counterNote?: string | null;
  rejectedReason?: string | null;
};

const tabs = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'accepted', label: 'Kabul Edilen' },
  { value: 'rejected', label: 'Reddedilen' },
  { value: 'counter_offered', label: 'Karşı Teklif' },
  { value: 'withdrawn', label: 'Geri Çekilen' },
] as const;

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'oldest', label: 'En Eski' },
  { value: 'price-high', label: 'Fiyat ↓' },
  { value: 'price-low', label: 'Fiyat ↑' },
] as const;

function formatPrice(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} g önce`;
}

export default function OffersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['value']>('all');
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('newest');

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Bekliyor', color: colors.warning.DEFAULT, bg: colors.warning.light },
    accepted: { label: 'Kabul Edildi', color: colors.success.DEFAULT, bg: colors.success.light },
    rejected: { label: 'Reddedildi', color: colors.error.DEFAULT, bg: colors.error.light },
    counter_offered: { label: 'Karşı Teklif', color: colors.primary.DEFAULT, bg: colors.primary.lighter },
    withdrawn: { label: 'Geri Çekildi', color: colors.textSecondary, bg: colors.surfaceRaised },
    completed: { label: 'Tamamlandı', color: colors.success.DEFAULT, bg: colors.success.light },
  };

  const { data: offers = [], isLoading, refetch, isRefetching } = useQuery<OfferItem[]>({
    queryKey: ['my-offers'],
    queryFn: async () => {
      const res = await api.get('/api/offers', { params: { role: 'seller' } });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ offerId, action }: { offerId: string; action: 'withdraw' | 'accept' | 'reject' }) => {
      const payload = action === 'reject'
        ? { action, rejectedReason: 'Karşı teklif satıcı tarafından reddedildi.' }
        : { action };
      const { data } = await api.patch(`/api/offers/${offerId}`, payload);
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-offers'] }),
        queryClient.invalidateQueries({ queryKey: ['offer-detail', variables.offerId] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Teklif işlemi tamamlanamadı.');
    },
  });

  const filteredOffers = useMemo(() => {
    const scoped = activeTab === 'all'
      ? [...offers]
      : offers.filter((offer) => offer.status === activeTab);

    switch (sortBy) {
      case 'oldest':
        scoped.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-high':
        scoped.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        scoped.sort((a, b) => a.price - b.price);
        break;
      default:
        scoped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return scoped;
  }, [activeTab, offers, sortBy]);

  const tabCounts = useMemo(() => ({
    all: offers.length,
    pending: offers.filter((offer) => offer.status === 'pending').length,
    accepted: offers.filter((offer) => offer.status === 'accepted').length,
    rejected: offers.filter((offer) => offer.status === 'rejected').length,
    counter_offered: offers.filter((offer) => offer.status === 'counter_offered').length,
    withdrawn: offers.filter((offer) => offer.status === 'withdrawn').length,
  }), [offers]);

  const activeOrdersCount = offers.filter((offer) => ['accepted', 'completed'].includes(offer.status)).length;

  function confirmAction(offerId: string, action: 'withdraw' | 'accept' | 'reject') {
    const copy = {
      withdraw: {
        title: 'Teklifi geri çek',
        message: 'Bu teklifi geri çekmek istediğine emin misin?',
      },
      accept: {
        title: 'Karşı teklifi kabul et',
        message: 'Alıcıdan gelen karşı teklifi kabul etmek istediğine emin misin?',
      },
      reject: {
        title: 'Karşı teklifi reddet',
        message: 'Karşı teklifi reddedersen teklif kapanır. Devam edilsin mi?',
      },
    }[action];

    Alert.alert(copy.title, copy.message, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: action === 'reject' ? 'Reddet' : 'Devam et',
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: () => actionMutation.mutate({ offerId, action }),
      },
    ]);
  }

  function renderItem({ item: offer }: { item: OfferItem }) {
    const status = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
    const counterpartLabel = offer.sellerId === user?.id
      ? `Alıcı: ${offer.buyerName ?? '—'}`
      : `Satıcı: ${offer.sellerName ?? '—'}`;
    const isMutating = actionMutation.isPending && actionMutation.variables?.offerId === offer.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push(`/offer/${offer.id}` as any)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.date}>{timeAgo(offer.createdAt)}</Text>
        </View>

        <Text style={styles.categoryPill}>{offer.listingCategory}</Text>
        <Text style={styles.listingTitle} numberOfLines={2}>{offer.listingTitle || 'İlan'}</Text>

        <View style={styles.metaRow}>
          <View style={styles.priceWrap}>
            <Ionicons name="pricetag-outline" size={14} color={colors.primary.DEFAULT} />
            <Text style={styles.price}>{formatPrice(offer.price)}</Text>
          </View>
          <Text style={styles.deliveryText}>{offer.deliveryDays} gün teslimat</Text>
        </View>

        <View style={styles.counterpart}>
          <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.counterpartText}>{counterpartLabel}</Text>
        </View>

        <View style={styles.counterpart}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.counterpartText}>{offer.listingCity}</Text>
        </View>

        {!!offer.note && (
          <Text style={styles.note} numberOfLines={2}>{offer.note}</Text>
        )}

        {offer.status === 'counter_offered' && (
          <View style={styles.counterOfferBox}>
            <Text style={styles.counterOfferTitle}>Alıcıdan karşı teklif geldi</Text>
            <Text style={styles.counterOfferValue}>
              {offer.counterPrice ? formatPrice(offer.counterPrice) : 'Tutar aynı kalsın'}
              {offer.counterDays ? ` · ${offer.counterDays} gün` : ''}
            </Text>
            {!!offer.counterNote && <Text style={styles.counterOfferNote}>{offer.counterNote}</Text>}
          </View>
        )}

        {offer.status === 'rejected' && !!offer.rejectedReason && (
          <View style={styles.rejectedBox}>
            <Text style={styles.rejectedTitle}>Red sebebi</Text>
            <Text style={styles.rejectedText}>{offer.rejectedReason}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Button
            title="Detay"
            variant="secondary"
            onPress={() => router.push(`/offer/${offer.id}` as any)}
            style={styles.actionButton}
          />
          {offer.status === 'pending' && (
            <Button
              title="Geri Çek"
              variant="ghost"
              onPress={() => confirmAction(offer.id, 'withdraw')}
              loading={isMutating}
              style={styles.actionButton}
            />
          )}
          {offer.status === 'counter_offered' && (
            <>
              <Button
                title="Kabul Et"
                onPress={() => confirmAction(offer.id, 'accept')}
                loading={isMutating}
                style={styles.actionButton}
              />
              <Button
                title="Reddet"
                variant="destructive"
                onPress={() => confirmAction(offer.id, 'reject')}
                loading={isMutating}
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const emptyTitle = activeTab === 'all' ? 'Henüz teklifin yok' : 'Bu sekmede teklif görünmüyor';
  const emptySubtitle = activeTab === 'all'
    ? 'İlanları keşfet ve ilk teklifini ver.'
    : 'Farklı bir filtre seçebilir veya teklif detaylarını siparişlerden takip edebilirsin.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tekliflerim</Text>
          <Text style={styles.headerSubtitle}>{filteredOffers.length} teklif · {offers.length} toplam</Text>
        </View>
        <TouchableOpacity style={styles.ordersBtn} onPress={() => router.push('/orders' as any)} activeOpacity={0.85}>
          <Ionicons name="cube-outline" size={16} color={colors.success.DEFAULT} />
          <Text style={styles.ordersBtnText}>Siparişler{activeOrdersCount > 0 ? ` (${activeOrdersCount})` : ''}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {tabs.map((tab) => {
          const active = tab.value === activeTab;
          const count = tabCounts[tab.value];
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveTab(tab.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {tab.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
        {sortOptions.map((option) => {
          const active = option.value === sortBy;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => setSortBy(option.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary.DEFAULT} />}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="pricetag-outline" size={32} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.emptyText}>{emptyTitle}</Text>
              <Text style={styles.emptySubtext}>{emptySubtitle}</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)' as any)} activeOpacity={0.85}>
                <Text style={styles.exploreBtnText}>İlanları Keşfet</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary.light} />
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  headerTitle: { fontSize: 24, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  headerSubtitle: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success.light,
    borderWidth: 1,
    borderColor: colors.success.DEFAULT + '25',
  },
  ordersBtnText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.success.DEFAULT },
  tabsRow: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.sm },
  sortRow: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.md },
  filterChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  filterChipText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  filterChipTextActive: { color: colors.white },
  sortChip: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.accent.lighter,
    borderColor: colors.accent.DEFAULT + '40',
  },
  sortChipText: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textSecondary },
  sortChipTextActive: { color: colors.accent.DEFAULT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: space.lg, paddingBottom: 120, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, fontFamily: fontFamily.bold },
  date: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  categoryPill: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.primary.DEFAULT,
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  listingTitle: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.textPrimary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontSize: 17, fontFamily: fontFamily.bold, color: colors.primary.DEFAULT },
  deliveryText: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textSecondary },
  counterpart: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  counterpartText: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  note: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, lineHeight: 18 },
  counterOfferBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT + '20',
    backgroundColor: colors.primary.lighter,
    padding: space.md,
    gap: 4,
  },
  counterOfferTitle: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.primary.DEFAULT },
  counterOfferValue: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.textPrimary },
  counterOfferNote: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.regular, color: colors.textSecondary },
  rejectedBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error.DEFAULT + '22',
    backgroundColor: colors.error.light,
    padding: space.md,
    gap: 4,
  },
  rejectedTitle: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.error.DEFAULT },
  rejectedText: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.regular, color: colors.error.DEFAULT },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: 2 },
  actionButton: { flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyText: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: space.sm },
  emptySubtext: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: space.lg },
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
  exploreBtnText: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.primary.light },
});
