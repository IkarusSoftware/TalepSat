import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button, EmptyState } from '../../src/components/ui';
import { borderRadius, fontFamily, space } from '../../src/theme';

type CompareOffer = {
  id: string;
  price: number;
  deliveryDays: number;
  note: string | null;
  status: string;
  boosted?: boolean;
  revisionCount?: number;
  seller: {
    id: string;
    name: string;
    score: number;
    verified: boolean;
    badge: string | null;
    completedDeals: number;
    companyName: string | null;
  };
};

type ListingCompareData = {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  offers: CompareOffer[];
};

type SortValue = 'price-low' | 'price-high' | 'delivery' | 'score';

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'price-low', label: 'Fiyata Göre' },
  { value: 'price-high', label: 'En Yüksek Fiyat' },
  { value: 'delivery', label: 'En Hızlı Teslimat' },
  { value: 'score', label: 'En Yüksek Puan' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ListingCompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const qc = useQueryClient();
  const [sortBy, setSortBy] = useState<SortValue>('price-low');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDays, setCounterDays] = useState('');
  const [counterNote, setCounterNote] = useState('');

  const { data: listing, isLoading, refetch, isRefetching } = useQuery<ListingCompareData>({
    queryKey: ['listing-compare', id],
    queryFn: async () => (await api.get(`/api/listings/${id}`)).data,
    enabled: !!id,
  });

  const offers = useMemo(() => {
    const source = listing?.offers ?? [];
    const active = source.filter((offer) => !['withdrawn', 'rejected'].includes(offer.status));
    switch (sortBy) {
      case 'price-high':
        return [...active].sort((a, b) => b.price - a.price);
      case 'delivery':
        return [...active].sort((a, b) => a.deliveryDays - b.deliveryDays);
      case 'score':
        return [...active].sort((a, b) => (b.seller?.score ?? 0) - (a.seller?.score ?? 0));
      default:
        return [...active].sort((a, b) => a.price - b.price);
    }
  }, [listing?.offers, sortBy]);

  const bestPrice = offers.length > 0 ? Math.min(...offers.map((offer) => offer.price)) : 0;
  const bestDelivery = offers.length > 0 ? Math.min(...offers.map((offer) => offer.deliveryDays)) : 0;
  const bestScore = offers.length > 0 ? Math.max(...offers.map((offer) => offer.seller?.score ?? 0)) : 0;
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) || null;

  const acceptOffer = useMutation({
    mutationFn: async () => (await api.patch(`/api/offers/${selectedOfferId}`, { action: 'accept' })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-compare', id] });
      qc.invalidateQueries({ queryKey: ['listing', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['offers'] });
      if (selectedOfferId) router.push(`/offer/${selectedOfferId}` as any);
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Teklif kabul edilemedi.');
    },
  });

  const counterOffer = useMutation({
    mutationFn: async () => (await api.patch(`/api/offers/${selectedOfferId}`, {
      action: 'counter',
      counterPrice: parseFloat(counterPrice),
      counterDays: counterDays ? parseInt(counterDays, 10) : undefined,
      counterNote: counterNote.trim() || undefined,
    })).data,
    onSuccess: () => {
      setCounterOpen(false);
      setCounterPrice('');
      setCounterDays('');
      setCounterNote('');
      qc.invalidateQueries({ queryKey: ['listing-compare', id] });
      qc.invalidateQueries({ queryKey: ['listing', id] });
      Alert.alert('Karşı teklif gönderildi', 'Seçtiğin satıcıya yeni şartlar iletildi.');
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Karşı teklif gönderilemedi.');
    },
  });

  function openCounterModal() {
    if (!selectedOffer) return;
    setCounterPrice(String(selectedOffer.price));
    setCounterDays(String(selectedOffer.deliveryDays));
    setCounterNote('');
    setCounterOpen(true);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="git-compare-outline"
            title="İlan bulunamadı"
            subtitle="Karşılaştırma ekranı için ilan verisi yüklenemedi."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: selectedOffer ? 180 : 120 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.DEFAULT} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Teklifleri Karşılaştır</Text>
          <Text style={styles.summaryText}>{listing.title}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryPill}>
              <Ionicons name="cash-outline" size={14} color={colors.accent.DEFAULT} />
              <Text style={styles.summaryPillText}>{formatCurrency(listing.budgetMin)} - {formatCurrency(listing.budgetMax)}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.summaryPillText}>{offers.length} teklif</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORT_OPTIONS.map((option) => {
            const active = sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => setSortBy(option.value)}
                activeOpacity={0.82}
              >
                <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {offers.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="git-compare-outline"
              title="Karşılaştırılacak teklif yok"
              subtitle="Reddedilmiş veya geri çekilmiş teklifler hariç aktif teklif geldiğinde burada göreceksin."
            />
          </View>
        ) : (
          <View style={styles.offerList}>
            {offers.map((offer) => {
              const selected = selectedOfferId === offer.id;
              const bestPriceHit = offer.price === bestPrice;
              const bestDeliveryHit = offer.deliveryDays === bestDelivery;
              const bestScoreHit = (offer.seller?.score ?? 0) === bestScore;
              return (
                <TouchableOpacity
                  key={offer.id}
                  style={[
                    styles.offerCard,
                    selected && styles.offerCardSelected,
                    offer.boosted && !selected && styles.offerCardBoosted,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedOfferId(selected ? null : offer.id)}
                >
                  {offer.boosted && <View style={styles.boostBadge}><Text style={styles.boostBadgeText}>Öne Çıkan</Text></View>}

                  <View style={styles.offerHeader}>
                    <View style={styles.selectCircle}>
                      {selected && <View style={styles.selectInner} />}
                    </View>

                    <TouchableOpacity
                      style={styles.sellerWrap}
                      activeOpacity={0.82}
                      onPress={() => router.push(`/user/${offer.seller.id}` as any)}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initialsOf(offer.seller.companyName || offer.seller.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.sellerNameRow}>
                          <Text style={styles.sellerName} numberOfLines={1}>{offer.seller.companyName || offer.seller.name}</Text>
                          {offer.seller.verified && (
                            <Ionicons name="checkmark-circle" size={15} color={colors.success.DEFAULT} />
                          )}
                        </View>
                        <Text style={styles.sellerMeta}>
                          {offer.seller.completedDeals} iş tamamladı
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.offerMetrics}>
                    <MetricBadge
                      label="Fiyat"
                      value={formatCurrency(offer.price)}
                      highlight={bestPriceHit}
                      colors={colors}
                    />
                    <MetricBadge
                      label="Teslimat"
                      value={`${offer.deliveryDays} gün`}
                      highlight={bestDeliveryHit}
                      colors={colors}
                    />
                    <MetricBadge
                      label="Puan"
                      value={offer.seller.score.toFixed(1)}
                      highlight={bestScoreHit}
                      colors={colors}
                    />
                  </View>

                  <View style={styles.statusRow}>
                    <StatusBadge status={offer.status} colors={colors} />
                    {offer.seller.badge && (
                      <View style={styles.planTag}>
                        <Text style={styles.planTagText}>{offer.seller.badge.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>

                  {!!offer.note && <Text style={styles.offerNote}>{offer.note}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {selectedOffer && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomTitle} numberOfLines={1}>
              {selectedOffer.seller.companyName || selectedOffer.seller.name}
            </Text>
            <Text style={styles.bottomMeta}>
              {formatCurrency(selectedOffer.price)} · {selectedOffer.deliveryDays} gün
            </Text>
          </View>
          <View style={styles.bottomActions}>
            <Button
              title="Detay"
              size="sm"
              variant="secondary"
              onPress={() => router.push(`/offer/${selectedOffer.id}` as any)}
              style={{ flex: 1 }}
            />
            <Button
              title="Karşı Teklif"
              size="sm"
              variant="secondary"
              onPress={openCounterModal}
              style={{ flex: 1 }}
            />
            <Button
              title="Kabul Et"
              size="sm"
              onPress={() => acceptOffer.mutate()}
              loading={acceptOffer.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      <Modal visible={counterOpen} transparent animationType="fade" onRequestClose={() => setCounterOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCounterOpen(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Karşı Teklif Gönder</Text>
            <Text style={styles.modalText}>
              Seçtiğin satıcıya yeni fiyat ve teslimat şartlarını buradan iletebilirsin.
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Yeni Fiyat</Text>
              <TextInput
                style={styles.input}
                value={counterPrice}
                onChangeText={setCounterPrice}
                keyboardType="numeric"
                placeholder="25000"
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.accent.DEFAULT}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Teslimat Günü</Text>
              <TextInput
                style={styles.input}
                value={counterDays}
                onChangeText={setCounterDays}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.accent.DEFAULT}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Not</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={counterNote}
                onChangeText={setCounterNote}
                placeholder="Teslimat, kalite veya kapsam notu..."
                placeholderTextColor={colors.textTertiary}
                multiline
                selectionColor={colors.accent.DEFAULT}
              />
            </View>

            <View style={styles.modalActions}>
              <Button title="İptal" variant="secondary" onPress={() => setCounterOpen(false)} style={{ flex: 1 }} />
              <Button
                title="Gönder"
                onPress={() => counterOffer.mutate()}
                loading={counterOffer.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function MetricBadge({
  label,
  value,
  highlight,
  colors,
}: {
  label: string;
  value: string;
  highlight: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        stylesStatic.metricCard,
        { backgroundColor: colors.surfaceRaised },
        highlight && { borderColor: colors.success.DEFAULT, backgroundColor: colors.success.light },
      ]}
    >
      <Text style={[stylesStatic.metricLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[stylesStatic.metricValue, { color: highlight ? colors.success.DEFAULT : colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Bekliyor', color: colors.warning.DEFAULT, bg: colors.warning.light },
    accepted: { label: 'Kabul', color: colors.success.DEFAULT, bg: colors.success.light },
    counter_offered: { label: 'Karşı Teklif', color: colors.accent.DEFAULT, bg: colors.accent.lighter },
    completed: { label: 'Tamamlandı', color: colors.success.DEFAULT, bg: colors.success.light },
  };
  const current = config[status] || config.pending;
  return (
    <View style={[stylesStatic.statusBadge, { backgroundColor: current.bg }]}>
      <Text style={[stylesStatic.statusText, { color: current.color }]}>{current.label}</Text>
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  metricCard: {
    flex: 1,
    padding: space.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  metricLabel: { fontSize: 11, fontFamily: fontFamily.medium, marginBottom: 3 },
  metricValue: { fontSize: 15, fontFamily: fontFamily.bold },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, fontFamily: fontFamily.bold },
});

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.md },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  summaryTitle: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  summaryText: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  summaryStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
  },
  summaryPillText: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textPrimary },
  sortRow: { gap: space.sm },
  sortChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.accent.lighter,
    borderColor: colors.accent.DEFAULT,
  },
  sortChipText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  sortChipTextActive: { color: colors.accent.DEFAULT },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.xl,
  },
  offerList: { gap: space.md },
  offerCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  offerCardSelected: {
    borderColor: colors.accent.DEFAULT,
    backgroundColor: colors.accent.lighter + '66',
  },
  offerCardBoosted: {
    borderColor: colors.accent.DEFAULT + '35',
  },
  boostBadge: {
    position: 'absolute',
    top: -11,
    right: space.lg,
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: borderRadius.full,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  boostBadgeText: { fontSize: 10, fontFamily: fontFamily.bold, color: colors.white, textTransform: 'uppercase' },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent.DEFAULT },
  sellerWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.primary.DEFAULT },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerName: { flex: 1, fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  sellerMeta: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },
  offerMetrics: { flexDirection: 'row', gap: space.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  planTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
  },
  planTagText: { fontSize: 11, fontFamily: fontFamily.bold, color: colors.textSecondary },
  offerNote: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary },
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: space.sm,
  },
  bottomSummary: { gap: 2 },
  bottomTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  bottomMeta: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary },
  bottomActions: { flexDirection: 'row', gap: space.sm },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  modalTitle: { fontSize: 20, fontFamily: fontFamily.bold, color: colors.textPrimary },
  modalText: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textPrimary },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: space.sm },
});
