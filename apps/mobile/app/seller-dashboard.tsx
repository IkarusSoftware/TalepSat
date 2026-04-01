import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import api from '../src/lib/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { Button, EmptyState } from '../src/components/ui';
import { borderRadius, fontFamily, space } from '../src/theme';
import type { Offer } from '../src/types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Az önce';
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data: offers = [], isLoading, refetch, isRefetching } = useQuery<Offer[]>({
    queryKey: ['seller-dashboard-offers'],
    queryFn: async () => (await api.get('/api/offers', { params: { role: 'seller' } })).data,
    enabled: !!user,
  });

  if (user?.role !== 'seller' && user?.role !== 'both') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="storefront-outline"
            title="Satıcı paneli sana açık değil"
            subtitle="Bu panel teklif veren satıcı hesapları için hazırlanmıştır."
          />
        </View>
      </SafeAreaView>
    );
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

  const total = offers.length;
  const accepted = offers.filter((offer) => offer.status === 'accepted' || offer.status === 'completed').length;
  const pending = offers.filter((offer) => offer.status === 'pending').length;
  const counterOffered = offers.filter((offer) => offer.status === 'counter_offered').length;
  const totalEarnings = offers
    .filter((offer) => offer.status === 'accepted' || offer.status === 'completed')
    .reduce((sum, offer) => sum + offer.price, 0);
  const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const recentOffers = [...offers]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.DEFAULT} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Satıcı Paneli</Text>
          <Text style={styles.headerSubtitle}>Teklif performansını, kazancını ve son hareketleri buradan takip et.</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="time-outline"
            label="Aktif Teklifler"
            value={String(pending)}
            tone={colors.warning.DEFAULT}
            bg={colors.warning.light}
            colors={colors}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Kabul Oranı"
            value={total > 0 ? `%${acceptRate}` : '—'}
            tone={colors.success.DEFAULT}
            bg={colors.success.light}
            colors={colors}
          />
          <StatCard
            icon="cash-outline"
            label="Toplam Kazanç"
            value={formatCurrency(totalEarnings)}
            tone={colors.accent.DEFAULT}
            bg={colors.accent.lighter}
            colors={colors}
          />
          <StatCard
            icon="star-outline"
            label="Ortalama Puan"
            value={user?.score ? user.score.toFixed(1) : '—'}
            tone={colors.warning.DEFAULT}
            bg={colors.warning.light}
            colors={colors}
          />
        </View>

        {offers.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={28} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz teklif vermedin</Text>
            <Text style={styles.emptyText}>İlanları keşfet ve ilk teklifini vererek paneli doldurmaya başla.</Text>
            <Button title="İlanları Keşfet" onPress={() => router.push('/(tabs)' as any)} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Son Teklifler</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/offers' as any)} activeOpacity={0.8}>
                  <Text style={styles.sectionLink}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.offerList}>
                {recentOffers.map((offer) => (
                  <TouchableOpacity
                    key={offer.id}
                    style={styles.offerCard}
                    activeOpacity={0.86}
                    onPress={() => router.push(`/offer/${offer.id}` as any)}
                  >
                    <View style={styles.offerTop}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.offerMetaRow}>
                          <View style={styles.categoryPill}>
                            <Text style={styles.categoryPillText}>{offer.listingCategory || 'İlan'}</Text>
                          </View>
                          <StatusBadge status={offer.status} colors={colors} />
                        </View>
                        <Text style={styles.offerTitle}>{offer.listingTitle || 'Teklif'}</Text>
                        <Text style={styles.offerTime}>{timeAgo(offer.updatedAt)}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.offerPrice}>{formatCurrency(offer.price)}</Text>
                        <Text style={styles.offerDays}>{offer.deliveryDays} gün</Text>
                      </View>
                    </View>

                    {offer.status === 'counter_offered' && offer.counterPrice && (
                      <View style={styles.counterStrip}>
                        <Ionicons name="swap-horizontal-outline" size={15} color={colors.accent.DEFAULT} />
                        <Text style={styles.counterStripText}>
                          Karşı teklif: {formatCurrency(offer.counterPrice)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performans Özeti</Text>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Kabul Oranı</Text>
                <Text style={styles.performanceValue}>%{acceptRate}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${acceptRate}%` }]} />
              </View>
              <View style={styles.performanceList}>
                <MetricRow label="Toplam Teklif" value={String(total)} colors={colors} />
                <MetricRow label="Kabul Edilen" value={String(accepted)} colors={colors} />
                <MetricRow label="Karşı Teklif Bekleyen" value={String(counterOffered)} colors={colors} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
              <QuickLink icon="search-outline" label="Yeni İlanları Keşfet" onPress={() => router.push('/(tabs)' as any)} colors={colors} />
              <QuickLink icon="pricetag-outline" label="Bekleyen Teklifleri Gör" onPress={() => router.push('/(tabs)/offers' as any)} colors={colors} />
              <QuickLink icon="settings-outline" label="Profil Ayarları" onPress={() => router.push('/settings' as any)} colors={colors} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  bg,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: string;
  bg: string;
  colors: any;
}) {
  return (
    <View style={[stylesStatic.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[stylesStatic.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={tone} />
      </View>
      <Text style={[stylesStatic.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[stylesStatic.statValue, { color: tone }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MetricRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={stylesStatic.metricRow}>
      <Text style={[stylesStatic.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[stylesStatic.metricValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity style={stylesStatic.quickLink} onPress={onPress} activeOpacity={0.82}>
      <View style={[stylesStatic.quickIcon, { backgroundColor: colors.accent.lighter }]}>
        <Ionicons name={icon} size={18} color={colors.accent.DEFAULT} />
      </View>
      <Text style={[stylesStatic.quickText, { color: colors.textPrimary }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Bekliyor', color: colors.warning.DEFAULT, bg: colors.warning.light },
    accepted: { label: 'Kabul', color: colors.success.DEFAULT, bg: colors.success.light },
    completed: { label: 'Tamamlandı', color: colors.success.DEFAULT, bg: colors.success.light },
    rejected: { label: 'Reddedildi', color: colors.error.DEFAULT, bg: colors.error.light },
    counter_offered: { label: 'Karşı Teklif', color: colors.accent.DEFAULT, bg: colors.accent.lighter },
  };
  const current = map[status] || map.pending;
  return (
    <View style={[stylesStatic.statusBadge, { backgroundColor: current.bg }]}>
      <Text style={[stylesStatic.statusText, { color: current.color }]}>{current.label}</Text>
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: borderRadius.xl,
    padding: space.md,
    gap: 8,
    borderWidth: 1,
  },
  statIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontFamily: fontFamily.medium },
  statValue: { fontSize: 20, fontFamily: fontFamily.extraBold },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabel: { fontSize: 14, fontFamily: fontFamily.regular },
  metricValue: { fontSize: 15, fontFamily: fontFamily.bold },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm + 2 },
  quickIcon: { width: 38, height: 38, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  quickText: { flex: 1, fontSize: 15, fontFamily: fontFamily.medium },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, fontFamily: fontFamily.bold },
});

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, paddingBottom: 120, gap: space.md },
  header: { marginBottom: 4 },
  headerTitle: { fontSize: 26, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  headerSubtitle: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: space.lg },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  sectionLink: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  offerList: { gap: space.sm },
  offerCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.lg,
    padding: space.md,
    gap: space.sm,
  },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  offerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryPill: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lighter,
  },
  categoryPillText: { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.primary.DEFAULT },
  offerTitle: { fontSize: 15, lineHeight: 21, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  offerTime: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary, marginTop: 4 },
  offerPrice: { fontSize: 18, fontFamily: fontFamily.extraBold, color: colors.accent.DEFAULT },
  offerDays: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textTertiary, marginTop: 3 },
  counterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  counterStripText: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  performanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  performanceLabel: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textSecondary },
  performanceValue: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.textPrimary },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.success.DEFAULT,
  },
  performanceList: { gap: 10, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
