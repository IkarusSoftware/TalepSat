import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../src/lib/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { Button, EmptyState } from '../src/components/ui';
import { borderRadius, fontFamily, space } from '../src/theme';
import type { SellerAnalyticsSnapshot } from '../../../shared/seller-analytics';
import { analyticsTierFeatureTitle } from '../../../shared/plan-analytics';
import { getSellerDashboardDerived } from '../../../shared/seller-analytics-dashboard';

type RangeValue = '7d' | '30d' | '90d' | 'custom';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Az once';
  if (hours < 24) return `${hours} saat once`;
  return `${Math.floor(hours / 24)} gun once`;
}

function formatMetric(value: number, format: 'number' | 'currency' | 'percent' | 'score') {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `%${value}`;
  if (format === 'score') return value > 0 ? value.toFixed(1) : '-';
  return value.toLocaleString('tr-TR');
}

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [range, setRange] = useState<RangeValue>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [listingId, setListingId] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  const analyticsQuery = useQuery<SellerAnalyticsSnapshot>({
    queryKey: ['seller-analytics', range, customFrom, customTo, listingId, category, city],
    enabled: !!user && (user.role === 'seller' || user.role === 'both' || user.role === 'admin'),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('range', range);
      if (range === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      }
      if (listingId) params.set('listingId', listingId);
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      return (await api.get(`/api/analytics/seller?${params.toString()}`)).data;
    },
  });

  if (user?.role !== 'seller' && user?.role !== 'both' && user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState icon="storefront-outline" title="Satici paneli sana acik degil" subtitle="Bu panel sadece satici hesaplari icin hazirlanmistir." />
        </View>
      </SafeAreaView>
    );
  }

  if (analyticsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent.DEFAULT} /></View>
      </SafeAreaView>
    );
  }

  if (!analyticsQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState icon="bar-chart-outline" title="Panel yuklenemedi" subtitle="Analitik bilgileri su an alinamadi." />
        </View>
      </SafeAreaView>
    );
  }

  const snapshot = analyticsQuery.data;
  const derived = getSellerDashboardDerived(snapshot);
  const pro = snapshot.tier === 'pro';
  const advanced = snapshot.tier === 'plus' || snapshot.tier === 'pro';
  const cards = (advanced ? derived.kpis : derived.kpis.slice(0, 4)).map((item) => ({
    label: item.label,
    value: formatMetric(item.value, item.format),
    icon:
      item.key === 'totalOffers'
        ? 'time-outline'
        : item.key === 'acceptedOffers'
          ? 'checkmark-circle-outline'
          : item.key === 'pendingOffers'
            ? 'flash-outline'
            : item.key === 'totalRevenue'
              ? 'cash-outline'
              : item.key === 'acceptanceRate'
                ? 'flag-outline'
                : item.key === 'totalViews'
                  ? 'eye-outline'
                  : item.key === 'averageScore'
                    ? 'star-outline'
                    : 'grid-outline',
    tone:
      item.tone === 'success'
        ? colors.success.DEFAULT
        : item.tone === 'warning'
          ? colors.warning.DEFAULT
          : item.tone === 'danger'
            ? colors.error.DEFAULT
            : item.tone === 'accent'
              ? colors.accent.DEFAULT
              : colors.textPrimary,
    bg:
      item.tone === 'success'
        ? colors.success.light
        : item.tone === 'warning'
          ? colors.warning.light
          : item.tone === 'danger'
            ? colors.error.light
            : item.tone === 'accent'
              ? colors.accent.lighter
              : colors.surfaceRaised,
    hint: item.hint,
  }));

  async function handleExport() {
    const params = new URLSearchParams();
    params.set('format', 'csv');
    params.set('range', range);
    if (range === 'custom') {
      if (customFrom) params.set('from', customFrom);
      if (customTo) params.set('to', customTo);
    }
    if (listingId) params.set('listingId', listingId);
    if (category) params.set('category', category);
    if (city) params.set('city', city);

    const response = await api.get(`/api/analytics/seller/export?${params.toString()}`, {
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    await Share.share({
      title: 'seller-analytics.csv',
      message: response.data,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={analyticsQuery.isRefetching} onRefresh={analyticsQuery.refetch} tintColor={colors.accent.DEFAULT} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.badge}><Ionicons name="analytics-outline" size={14} color={colors.accent.DEFAULT} /><Text style={styles.badgeText}>{analyticsTierFeatureTitle(snapshot.tier)}</Text></View>
          <Text style={styles.headerTitle}>Satici Paneli</Text>
          <Text style={styles.headerSubtitle}>Teklif performansini ve planina acilan raporlari burada gor.</Text>
        </View>

        {snapshot.tier === 'none' ? (
          <View style={styles.upgradeCard}>
            <Ionicons name="sparkles-outline" size={28} color={colors.accent.DEFAULT} />
            <Text style={styles.upgradeTitle}>Analitik icin plan yukseltilmeli</Text>
            <Text style={styles.upgradeText}>Basic temel satis takibi, Plus trendler ve kirilimlar, Pro ise gelismis raporlama aciyor.</Text>
            <View style={styles.actionRow}>
              <Button title="Planlari Incele" onPress={() => router.push('/plans' as any)} />
              <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push('/subscription' as any)}><Text style={styles.ghostBtnText}>Abonelik</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {advanced ? (
              <View style={styles.heroPanel}>
                <Text style={styles.heroTitle}>{pro ? 'Pro Yonetim ve Analitik Merkezi' : 'Plus Performans Merkezi'}</Text>
                <Text style={styles.heroText}>{pro ? 'Kritik filtreler, karsilastirmalar ve operasyonel tablolarla daha derin bir seller paneli.' : 'Trendler, kategori momentumu ve ilan performanslarini tek panelde toplayan daha zengin gorunum.'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
                  {(['7d', '30d', '90d'] as RangeValue[]).map((item) => (
                    <TouchableOpacity key={item} style={[styles.heroChip, range === item && styles.heroChipActive]} onPress={() => setRange(item)}><Text style={[styles.heroChipText, range === item && styles.heroChipTextActive]}>{item}</Text></TouchableOpacity>
                  ))}
                  {pro && <TouchableOpacity style={[styles.heroChip, range === 'custom' && styles.heroChipActive]} onPress={() => setRange('custom')}><Text style={[styles.heroChipText, range === 'custom' && styles.heroChipTextActive]}>Ozel tarih</Text></TouchableOpacity>}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.signalRow}>
                  {derived.signals.map((signal) => (
                    <View key={`${signal.title}-${signal.value}`} style={styles.signalCard}>
                      <Text style={styles.signalLabel}>{signal.title}</Text>
                      <Text style={[styles.signalValue, { color: signal.tone === 'success' ? colors.success.DEFAULT : signal.tone === 'warning' ? colors.warning.DEFAULT : signal.tone === 'danger' ? colors.error.DEFAULT : signal.tone === 'accent' ? colors.accent.DEFAULT : colors.textPrimary }]}>{signal.value}</Text>
                      <Text style={styles.signalHint}>{signal.subtitle}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {snapshot.tier === 'pro' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gelismis filtreler</Text>
                <View style={styles.formGrid}>
                  <TextInput value={customFrom} onChangeText={setCustomFrom} placeholder="Baslangic YYYY-MM-DD" placeholderTextColor={colors.textTertiary} style={styles.input} />
                  <TextInput value={customTo} onChangeText={setCustomTo} placeholder="Bitis YYYY-MM-DD" placeholderTextColor={colors.textTertiary} style={styles.input} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity style={[styles.filterChip, !listingId && styles.filterChipActive]} onPress={() => setListingId('')}><Text style={[styles.filterChipText, !listingId && styles.filterChipTextActive]}>Tum ilanlar</Text></TouchableOpacity>
                  {snapshot.breakdowns?.topListings?.map((item) => <TouchableOpacity key={item.listingId} style={[styles.filterChip, listingId === item.listingId && styles.filterChipActive]} onPress={() => setListingId(item.listingId)}><Text style={[styles.filterChipText, listingId === item.listingId && styles.filterChipTextActive]}>{item.title}</Text></TouchableOpacity>)}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity style={[styles.filterChip, !category && styles.filterChipActive]} onPress={() => setCategory('')}><Text style={[styles.filterChipText, !category && styles.filterChipTextActive]}>Tum kategoriler</Text></TouchableOpacity>
                  {snapshot.breakdowns?.byCategory?.map((item) => <TouchableOpacity key={item.key} style={[styles.filterChip, category === item.key && styles.filterChipActive]} onPress={() => setCategory(item.key)}><Text style={[styles.filterChipText, category === item.key && styles.filterChipTextActive]}>{item.label}</Text></TouchableOpacity>)}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity style={[styles.filterChip, !city && styles.filterChipActive]} onPress={() => setCity('')}><Text style={[styles.filterChipText, !city && styles.filterChipTextActive]}>Tum sehirler</Text></TouchableOpacity>
                  {snapshot.breakdowns?.byCity?.map((item) => <TouchableOpacity key={item.key} style={[styles.filterChip, city === item.label && styles.filterChipActive]} onPress={() => setCity(item.label)}><Text style={[styles.filterChipText, city === item.label && styles.filterChipTextActive]}>{item.label}</Text></TouchableOpacity>)}
                </ScrollView>
                <View style={styles.actionRow}>
                  <Button title="Filtreyi Uygula" onPress={() => analyticsQuery.refetch()} />
                  <TouchableOpacity style={styles.ghostBtn} onPress={handleExport}><Text style={styles.ghostBtnText}>CSV</Text></TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.statsGrid}>
              {cards.map((card) => (
                <View key={card.label} style={[styles.statCard, advanced && styles.statCardWide]}>
                  <View style={[styles.statIcon, { backgroundColor: card.bg }]}><Ionicons name={card.icon as any} size={20} color={card.tone} /></View>
                  <Text style={styles.statLabel}>{card.label}</Text>
                  <Text style={[styles.statValue, { color: card.tone }]} numberOfLines={1}>{card.value}</Text>
                  {card.hint ? <Text style={styles.statHint}>{card.hint}</Text> : null}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performans ozeti</Text>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Kabul orani</Text><Text style={styles.metricValue}>%{snapshot.summary.acceptanceRate}</Text></View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${snapshot.summary.acceptanceRate}%` }]} /></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Reddedilen</Text><Text style={styles.metricValue}>{snapshot.summary.rejectedOffers}</Text></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Karsi teklif</Text><Text style={styles.metricValue}>{snapshot.summary.counterOffers}</Text></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Ortalama puan</Text><Text style={styles.metricValue}>{snapshot.summary.averageScore > 0 ? snapshot.summary.averageScore.toFixed(1) : '-'}</Text></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Goruntulenme</Text><Text style={styles.metricValue}>{snapshot.summary.totalViews}</Text></View>
            </View>

            {advanced && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Donusum huni</Text>
                  {[
                    { label: 'Goruntulenme', value: derived.funnel.views, width: 100, color: colors.primary.DEFAULT, note: 'Ilk dikkat seviyesi' },
                    { label: 'Teklif', value: derived.funnel.offers, width: Math.max(12, derived.funnel.offerToViewRate), color: colors.accent.DEFAULT, note: `%${derived.funnel.offerToViewRate} teklif donusumu` },
                    { label: 'Kabul', value: derived.funnel.accepted, width: Math.max(12, derived.funnel.acceptanceRate), color: colors.success.DEFAULT, note: `%${derived.funnel.acceptanceRate} kabul orani` },
                  ].map((item) => (
                    <View key={item.label} style={styles.funnelBlock}>
                      <View style={styles.metricRow}><Text style={styles.metricValue}>{item.label}</Text><Text style={styles.metricLabel}>{item.value.toLocaleString('tr-TR')}</Text></View>
                      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${item.width}%`, backgroundColor: item.color }]} /></View>
                      <Text style={styles.funnelNote}>{item.note}</Text>
                    </View>
                  ))}
                  <View style={styles.metricRow}><Text style={styles.metricLabel}>Kabul edilen is basi gelir</Text><Text style={[styles.metricValue, { color: colors.accent.DEFAULT }]}>{formatCurrency(derived.funnel.revenuePerAccepted)}</Text></View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Durum dagilimi</Text>
                  {derived.statusShares.length === 0 ? <Text style={styles.emptyText}>Henuz yeterli teklif verisi yok.</Text> : derived.statusShares.map((item) => (
                    <View key={item.key} style={styles.barGroup}>
                      <View style={styles.metricRow}><Text style={styles.metricValue}>{item.label}</Text><Text style={styles.metricLabel}>{item.count} adet · %{item.share}</Text></View>
                      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(8, item.share)}%`, backgroundColor: colors.warning.DEFAULT }]} /></View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {snapshot.trends && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trendler</Text>
                {[{ label: 'Teklif trendi', data: snapshot.trends.offers, field: 'offers' }, { label: 'Gelir trendi', data: snapshot.trends.revenue, field: 'revenue' }].map((block) => {
                  const max = Math.max(...block.data.map((item: any) => item[block.field]), 1);
                  return (
                    <View key={block.label} style={styles.trendBlock}>
                      <Text style={styles.trendTitle}>{block.label}</Text>
                      {block.data.slice(-6).map((item: any) => (
                        <View key={`${block.label}-${item.label}`} style={styles.trendRow}>
                          <View style={styles.trendTextRow}><Text style={styles.trendLabel}>{item.label}</Text><Text style={styles.trendValue}>{block.field === 'revenue' ? formatCurrency(item[block.field]) : item[block.field]}</Text></View>
                          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(10, (item[block.field] / max) * 100)}%`, backgroundColor: block.field === 'revenue' ? colors.warning.DEFAULT : colors.accent.DEFAULT }]} /></View>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Son teklifler</Text>
              {snapshot.recentOffers.length === 0 ? <Text style={styles.emptyText}>Henuz teklif yok.</Text> : snapshot.recentOffers.map((offer) => (
                <TouchableOpacity key={offer.id} style={styles.offerCard} activeOpacity={0.86} onPress={() => router.push(`/offer/${offer.id}` as any)}>
                  <View style={styles.offerTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.offerMetaRow}>
                        <View style={styles.categoryPill}><Text style={styles.categoryPillText}>{offer.listingCategory}</Text></View>
                        <Text style={styles.offerStatus}>{offer.status}</Text>
                      </View>
                      <Text style={styles.offerTitle}>{offer.listingTitle}</Text>
                      <Text style={styles.offerTime}>{timeAgo(offer.updatedAt)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.offerPrice}>{formatCurrency(offer.price)}</Text>
                      <Text style={styles.offerDays}>{offer.deliveryDays} gun</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {snapshot.breakdowns && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kategori kirilimi</Text>
                {derived.categoryShares.slice(0, 5).map((item) => (
                  <View key={item.key} style={styles.breakdownCard}>
                    <View style={styles.metricRow}><Text style={styles.metricValue}>{item.label}</Text><Text style={styles.metricLabel}>{item.count} teklif · %{item.share}</Text></View>
                    <Text style={styles.breakdownRevenue}>{formatCurrency(item.revenue)}</Text>
                  </View>
                ))}
              </View>
            )}

            {advanced && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{pro ? 'Kritik ilan performansi' : 'En guclu ilanlar'}</Text>
                {derived.listingRows.length === 0 ? <Text style={styles.emptyText}>Henuz ilan performansi verisi yok.</Text> : derived.listingRows.slice(0, pro ? 6 : 4).map((item) => (
                  <TouchableOpacity key={item.listingId} style={styles.listingPerformanceCard} activeOpacity={0.86} onPress={() => router.push(`/listing/${item.listingId}` as any)}>
                    <View style={styles.metricRow}><Text style={styles.listingPerformanceTitle}>{item.title}</Text><Text style={styles.listingPerformanceRevenue}>{formatCurrency(item.revenue)}</Text></View>
                    <Text style={styles.listingPerformanceMeta}>{item.category} · {item.city}</Text>
                    <View style={styles.listingPerformanceGrid}>
                      <View><Text style={styles.metricLabel}>Teklif</Text><Text style={styles.metricValue}>{item.count}</Text></View>
                      <View><Text style={styles.metricLabel}>Kabul</Text><Text style={styles.metricValue}>%{item.acceptanceRate}</Text></View>
                      <View><Text style={styles.metricLabel}>Goruntulenme</Text><Text style={styles.metricValue}>{item.views}</Text></View>
                      <View><Text style={styles.metricLabel}>Pay</Text><Text style={styles.metricValue}>%{item.revenueShare}</Text></View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {advanced && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yonetim notlari</Text>
                {derived.insights.length === 0 ? <Text style={styles.emptyText}>Su an icin belirgin bir risk veya firsat sinyali yok.</Text> : derived.insights.map((item) => (
                  <View key={item.title} style={styles.insightCard}>
                    <View style={styles.metricRow}><Text style={styles.insightTitle}>{item.title}</Text><Text style={[styles.insightTone, { color: item.tone === 'success' ? colors.success.DEFAULT : item.tone === 'warning' ? colors.warning.DEFAULT : item.tone === 'danger' ? colors.error.DEFAULT : colors.accent.DEFAULT }]}>{item.tone === 'success' ? 'Firsat' : item.tone === 'danger' ? 'Risk' : item.tone === 'warning' ? 'Dikkat' : 'Sinyal'}</Text></View>
                    <Text style={styles.insightBody}>{item.body}</Text>
                  </View>
                ))}
              </View>
            )}

            {snapshot.comparison && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Onceki donem</Text>
                {derived.comparisonCards.map((item) => (
                  <View key={item.label} style={styles.metricRow}>
                    <Text style={styles.metricLabel}>{item.label}</Text>
                    <Text style={[styles.metricValue, { color: item.delta > 0 ? colors.success.DEFAULT : item.delta < 0 ? colors.error.DEFAULT : colors.textPrimary }]}>
                      {item.delta > 0 ? '+' : ''}
                      {item.format === 'percent' ? `${item.delta} puan` : `${item.delta}%`}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {pro && derived.cityShares.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sehir kirilimi</Text>
                {derived.cityShares.slice(0, 5).map((item) => (
                  <View key={item.key} style={styles.barGroup}>
                    <View style={styles.metricRow}><Text style={styles.metricValue}>{item.label}</Text><Text style={styles.metricLabel}>{item.count} teklif · %{item.share}</Text></View>
                    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(8, item.share)}%`, backgroundColor: colors.primary.DEFAULT }]} /></View>
                    <Text style={styles.funnelNote}>{formatCurrency(item.revenue)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hizli islemler</Text>
              <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)' as any)}><Ionicons name="search-outline" size={16} color={colors.accent.DEFAULT} /><Text style={styles.quickLinkText}>Yeni ilanlari kesfet</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(tabs)/offers' as any)}><Ionicons name="pricetag-outline" size={16} color={colors.warning.DEFAULT} /><Text style={styles.quickLinkText}>Teklifleri yonet</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/subscription' as any)}><Ionicons name="sparkles-outline" size={16} color={colors.primary.DEFAULT} /><Text style={styles.quickLinkText}>{pro ? 'Pro araclarini ve plani yonet' : 'Planini guclendir'}</Text></TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
    content: { padding: space.lg, gap: space.lg },
    header: { gap: space.sm },
    badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.accent.lighter },
    badgeText: { fontFamily: fontFamily.semiBold, fontSize: 11, color: colors.accent.DEFAULT, textTransform: 'uppercase' },
    headerTitle: { fontFamily: fontFamily.bold, fontSize: 28, color: colors.textPrimary },
    headerSubtitle: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    heroPanel: { backgroundColor: colors.textPrimary, borderRadius: borderRadius.xl, padding: space.lg, gap: space.md },
    heroTitle: { fontFamily: fontFamily.bold, fontSize: 24, color: colors.white, lineHeight: 30 },
    heroText: { fontFamily: fontFamily.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 21 },
    upgradeCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: space.lg, gap: space.md },
    upgradeTitle: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.textPrimary },
    upgradeText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
    actionRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
    ghostBtn: { height: 44, paddingHorizontal: 18, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    ghostBtnText: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.textPrimary },
    rangeRow: { gap: space.sm, paddingBottom: 4 },
    heroChip: { height: 40, paddingHorizontal: 16, borderRadius: borderRadius.lg, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    heroChipActive: { backgroundColor: colors.white },
    heroChipText: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.white },
    heroChipTextActive: { color: colors.textPrimary },
    signalRow: { gap: space.sm, paddingBottom: 4 },
    signalCard: { width: 220, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: space.md, gap: 6 },
    signalLabel: { fontFamily: fontFamily.semiBold, fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase' },
    signalValue: { fontFamily: fontFamily.bold, fontSize: 20 },
    signalHint: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    rangeChip: { height: 40, paddingHorizontal: 16, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
    rangeChipActive: { backgroundColor: colors.textPrimary },
    rangeChipText: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.textSecondary },
    rangeChipTextActive: { color: colors.white },
    section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: space.lg, gap: space.md },
    sectionTitle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.textPrimary },
    formGrid: { gap: space.sm },
    input: { height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: 14, color: colors.textPrimary, backgroundColor: colors.background, fontFamily: fontFamily.medium },
    filterScroll: { gap: space.sm, paddingBottom: 2 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: borderRadius.full, backgroundColor: colors.surfaceRaised },
    filterChipActive: { backgroundColor: colors.primary.DEFAULT },
    filterChipText: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.textSecondary },
    filterChipTextActive: { color: colors.white },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
    statCard: { width: '47%', minWidth: 150, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: space.lg },
    statCardWide: { width: '47%' },
    statIcon: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
    statLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    statValue: { fontFamily: fontFamily.bold, fontSize: 22 },
    statHint: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textTertiary, marginTop: 6, lineHeight: 17 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
    metricLabel: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.textSecondary },
    metricValue: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary },
    progressTrack: { height: 9, borderRadius: borderRadius.full, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: borderRadius.full, backgroundColor: colors.success.DEFAULT },
    funnelBlock: { gap: 8, marginBottom: space.md },
    funnelNote: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textTertiary },
    barGroup: { gap: 8, marginBottom: space.md },
    trendBlock: { gap: space.sm },
    trendTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.textPrimary },
    trendRow: { gap: 6 },
    trendTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trendLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
    trendValue: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.textPrimary },
    offerCard: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: space.md, backgroundColor: colors.surface },
    offerTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
    offerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 6 },
    categoryPill: { backgroundColor: colors.primary.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.md },
    categoryPillText: { fontFamily: fontFamily.medium, fontSize: 11, color: colors.primary.DEFAULT },
    offerStatus: { fontFamily: fontFamily.semiBold, fontSize: 11, color: colors.textSecondary, textTransform: 'capitalize' },
    offerTitle: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary },
    offerTime: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    offerPrice: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.accent.DEFAULT },
    offerDays: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    emptyText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.textSecondary },
    breakdownCard: { backgroundColor: colors.surfaceRaised, borderRadius: borderRadius.lg, padding: space.md, gap: 6 },
    breakdownRevenue: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.accent.DEFAULT },
    listingPerformanceCard: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: space.md, backgroundColor: colors.surface, gap: 8 },
    listingPerformanceTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary },
    listingPerformanceRevenue: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.accent.DEFAULT },
    listingPerformanceMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textTertiary },
    listingPerformanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: 6 },
    insightCard: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: space.md, backgroundColor: colors.surface, gap: 8 },
    insightTitle: { flex: 1, fontFamily: fontFamily.bold, fontSize: 14, color: colors.textPrimary },
    insightTone: { fontFamily: fontFamily.semiBold, fontSize: 12 },
    insightBody: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
    quickLink: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10 },
    quickLinkText: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.textPrimary },
  });
}
