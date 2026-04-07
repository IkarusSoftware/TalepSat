import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../src/lib/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { Button, EmptyState } from '../src/components/ui';
import { borderRadius, fontFamily, space } from '../src/theme';
import type { BillingSnapshot, Plan } from '../src/types';
import {
  enrichPlans,
  formatPlanPrice,
  includedFeatures,
  planLabel,
} from '../src/features/plan-catalog';

type BillingCycle = 'monthly' | 'yearly';

function formatDate(value?: string | null) {
  if (!value) return 'Belirlenmedi';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusLabel(status?: string | null) {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'pending':
      return 'Beklemede';
    case 'canceled':
      return 'İptal edildi';
    case 'past_due':
      return 'Ödeme bekliyor';
    case 'expired':
      return 'Sona erdi';
    default:
      return 'Free';
  }
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { plan: selectedPlanSlug, cycle } = useLocalSearchParams<{ plan?: string; cycle?: BillingCycle }>();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    data: rawPlans = [],
    isLoading: plansLoading,
    refetch: refetchPlans,
    isRefetching: plansRefetching,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/api/plans')).data,
  });

  const {
    data: billingSnapshot,
    isLoading: billingLoading,
    refetch: refetchBilling,
    isRefetching: billingRefetching,
  } = useQuery<BillingSnapshot>({
    queryKey: ['billing-subscription'],
    queryFn: async () => (await api.get('/api/billing/subscription')).data,
    enabled: !!user,
  });

  const plans = useMemo(() => enrichPlans(rawPlans), [rawPlans]);
  const currentPlanSlug = billingSnapshot?.currentPlan?.slug || user?.badge || 'free';
  const currentPlan = plans.find((item) => item.slug === currentPlanSlug) || plans[0];
  const selectedPlan = plans.find((item) => item.slug === selectedPlanSlug) || null;
  const selectedCycle: BillingCycle = cycle === 'monthly' ? 'monthly' : 'yearly';
  const focusPlan = selectedPlan || currentPlan;
  const activeSubscription = billingSnapshot?.subscription;

  const refreshAll = async () => {
    await Promise.all([refetchPlans(), refetchBilling()]);
  };

  const checkoutMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/api/billing/checkout', {
          planSlug: focusPlan?.slug,
          billingCycle: selectedCycle,
        })
      ).data as { checkoutUrl?: string; message?: string; mode?: string },
    onSuccess: async (data) => {
      await refetchBilling();
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      if (data.mode === 'noop') {
        Alert.alert('Plan zaten aktif', data.message || 'Mevcut planın zaten kullanılıyor.');
        return;
      }
      if (!data.checkoutUrl) {
        Alert.alert('Hazırlanamadı', 'Ödeme bağlantısı oluşturulamadı.');
        return;
      }
      await Linking.openURL(data.checkoutUrl).catch(() => {
        Alert.alert('Açılamadı', 'Ödeme bağlantısı açılamadı.');
      });
    },
    onError: (error: any) => {
      Alert.alert('Ödeme başlatılamadı', error?.response?.data?.error || 'Bir hata oluştu.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => (await api.post('/api/billing/cancel')).data,
    onSuccess: async () => {
      await refetchBilling();
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      Alert.alert('İptal planlandı', 'Aboneliğin dönem sonunda sona erecek.');
    },
    onError: (error: any) => {
      Alert.alert('İşlem başarısız', error?.response?.data?.error || 'İptal isteği tamamlanamadı.');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => (await api.post('/api/billing/resume')).data,
    onSuccess: async () => {
      await refetchBilling();
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      Alert.alert('Abonelik devam ediyor', 'Otomatik yenileme yeniden açıldı.');
    },
    onError: (error: any) => {
      Alert.alert('İşlem başarısız', error?.response?.data?.error || 'Devam ettirme isteği tamamlanamadı.');
    },
  });

  if (plansLoading || billingLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan || !billingSnapshot) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="card-outline"
            title="Abonelik bilgisi bulunamadı"
            subtitle="Plan veya abonelik verisi şu an yüklenemedi. Biraz sonra tekrar deneyebilirsin."
          />
        </View>
      </SafeAreaView>
    );
  }

  const offersUsed = billingSnapshot.usage.totalOffers || 0;
  const offersLimit = currentPlan.offersPerMonth;
  const offersRatio = offersLimit ? Math.min(offersUsed / offersLimit, 1) : 0.14;
  const price =
    focusPlan && selectedCycle === 'yearly' ? focusPlan.priceYearly : focusPlan?.priceMonthly || 0;
  const canCheckout =
    focusPlan &&
    focusPlan.slug !== 'free' &&
    billingSnapshot.iyzicoConfigured &&
    (selectedCycle === 'monthly' ? focusPlan.iyzicoMonthlyPlanRef : focusPlan.iyzicoYearlyPlanRef);
  const missingProfileFields = billingSnapshot.requiredProfileFields;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={plansRefetching || billingRefetching}
            onRefresh={refreshAll}
            tintColor={colors.accent.DEFAULT}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor: `${currentPlan.meta.accent}35` }]}>
          <View style={[styles.heroIcon, { backgroundColor: currentPlan.meta.accentSoft }]}>
            <Ionicons name={currentPlan.meta.icon} size={26} color={currentPlan.meta.accent} />
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.overline}>Aktif plan</Text>
            <Text style={styles.heroTitle}>{currentPlan.name} Plan</Text>
            <Text style={styles.heroText}>
              {activeSubscription
                ? `${statusLabel(activeSubscription.status)} • ${activeSubscription.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'} faturalama`
                : 'Şu anda ücretsiz plandasın. İstersen hemen ücretli plana geçebilirsin.'}
            </Text>
          </View>

          <View style={styles.heroPriceWrap}>
            <Text style={styles.heroPrice}>
              {currentPlan.priceMonthly === 0 ? 'Ücretsiz' : `₺${formatPlanPrice(currentPlan.priceMonthly)}`}
            </Text>
            {currentPlan.priceMonthly > 0 && <Text style={styles.heroPriceSub}>/ay</Text>}
          </View>
        </View>

        {focusPlan && focusPlan.slug !== currentPlan.slug && (
          <View style={styles.noticeCard}>
            <Ionicons name="sparkles-outline" size={18} color={colors.accent.DEFAULT} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{focusPlan.name} planına geçiş hazırlığı</Text>
              <Text style={styles.noticeText}>
                {price === 0 ? 'Ücretsiz plan için ödeme gerekmez.' : `${selectedCycle === 'yearly' ? 'Yıllık' : 'Aylık'} ücret: ₺${formatPlanPrice(price)}`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Kullanım</Text>
            <TouchableOpacity onPress={() => router.push('/plans' as any)} activeOpacity={0.8}>
              <Text style={styles.linkText}>Planları karşılaştır</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Toplam teklif</Text>
            <Text style={styles.usageValue}>
              {offersUsed}
              {offersLimit ? ` / ${offersLimit}` : ' (Sınırsız)'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(offersRatio * 100)}%` }]} />
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{billingSnapshot.usage.listingCount || 0}</Text>
              <Text style={styles.summaryLabel}>İlan</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{billingSnapshot.usage.acceptedOffers || 0}</Text>
              <Text style={styles.summaryLabel}>Kabul</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{billingSnapshot.usage.reviewCount || 0}</Text>
              <Text style={styles.summaryLabel}>Değerlendirme</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan özellikleri</Text>
          <View style={styles.featureList}>
            {includedFeatures(focusPlan || currentPlan).map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success.DEFAULT} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Abonelik durumu</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Plan etiketi" value={planLabel(currentPlanSlug)} />
            <InfoRow
              label="Durum"
              value={activeSubscription ? statusLabel(activeSubscription.status) : 'Ücretsiz'}
            />
            <InfoRow
              label="Dönem sonu"
              value={activeSubscription?.currentPeriodEnd ? formatDate(activeSubscription.currentPeriodEnd) : '—'}
            />
            <InfoRow
              label="Otomatik yenileme"
              value={
                activeSubscription
                  ? activeSubscription.cancelAtPeriodEnd
                    ? 'Kapalı'
                    : 'Açık'
                  : 'Yok'
              }
            />
          </View>

          {missingProfileFields.length > 0 && (
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={18} color={colors.warning.DEFAULT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Ödeme öncesi profilini tamamla</Text>
                <Text style={styles.warningText}>
                  iyzico için şu alanlar gerekli: {missingProfileFields.join(', ')}.
                </Text>
              </View>
            </View>
          )}

          {!billingSnapshot.iyzicoConfigured && (
            <View style={styles.warningCard}>
              <Ionicons name="construct-outline" size={18} color={colors.warning.DEFAULT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Ödeme ortamı hazır değil</Text>
                <Text style={styles.warningText}>
                  Bu ortamda iyzico anahtarları tanımlı olmadığı için checkout başlatılamıyor.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actionStack}>
            {focusPlan && focusPlan.slug !== currentPlan.slug && focusPlan.slug !== 'free' && (
              <Button
                title="iyzico ile devam et"
                onPress={() => {
                  if (missingProfileFields.length > 0) {
                    Alert.alert(
                      'Profil eksik',
                      `Önce şu alanları tamamla: ${missingProfileFields.join(', ')}`,
                      [
                        { text: 'Sonra', style: 'cancel' },
                        { text: 'Ayarlara git', onPress: () => router.push('/settings' as any) },
                      ],
                    );
                    return;
                  }
                  checkoutMutation.mutate();
                }}
                disabled={!canCheckout}
                loading={checkoutMutation.isPending}
                icon={<Ionicons name="card-outline" size={16} color={colors.white} />}
                fullWidth
              />
            )}

            {focusPlan?.slug === 'free' && focusPlan.slug !== currentPlan.slug && activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
              <Button
                title="Dönem sonunda free plana dön"
                variant="secondary"
                onPress={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
                fullWidth
              />
            )}

            {activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
              <Button
                title="Dönem sonunda iptal et"
                variant="secondary"
                onPress={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
                fullWidth
              />
            )}

            {activeSubscription?.cancelAtPeriodEnd && (
              <Button
                title="Otomatik yenilemeyi aç"
                variant="secondary"
                onPress={() => resumeMutation.mutate()}
                loading={resumeMutation.isPending}
                fullWidth
              />
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hızlı işlemler</Text>
          <View style={styles.quickList}>
            <QuickLink
              icon="diamond-outline"
              label="Tüm planları gör"
              onPress={() => router.push('/plans' as any)}
              colors={colors}
            />
            <QuickLink
              icon="settings-outline"
              label="Hesap ayarları"
              onPress={() => router.push('/settings' as any)}
              colors={colors}
            />
            {(user?.role === 'seller' || user?.role === 'both') && (
              <QuickLink
                icon="speedometer-outline"
                label="Satıcı paneli"
                onPress={() => router.push('/seller-dashboard' as any)}
                colors={colors}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={stylesStatic.infoRow}>
      <Text style={stylesStatic.infoLabel}>{label}</Text>
      <Text style={stylesStatic.infoValue}>{value}</Text>
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
      <View style={[stylesStatic.quickIcon, { backgroundColor: colors.primary.lighter }]}>
        <Ionicons name={icon} size={18} color={colors.primary.DEFAULT} />
      </View>
      <Text style={[stylesStatic.quickLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const stylesStatic = StyleSheet.create({
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm + 2 },
  quickIcon: { width: 38, height: 38, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: 15, fontFamily: fontFamily.medium },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  infoLabel: { fontSize: 13, fontFamily: fontFamily.medium, color: '#6b7280' },
  infoValue: { fontSize: 13, fontFamily: fontFamily.bold, color: '#111827' },
});

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, paddingBottom: 120, gap: space.md },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: space.lg,
  },
  heroIcon: { width: 54, height: 54, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  heroBody: { flex: 1 },
  overline: { fontSize: 11, fontFamily: fontFamily.bold, color: colors.accent.DEFAULT, textTransform: 'uppercase' },
  heroTitle: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.textPrimary, marginTop: 4 },
  heroText: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 6 },
  heroPriceWrap: { alignItems: 'flex-end' },
  heroPrice: { fontSize: 24, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  heroPriceSub: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textTertiary },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.lighter,
  },
  noticeTitle: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  noticeText: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  cardTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  linkText: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageLabel: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textSecondary },
  usageValue: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.textPrimary },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.DEFAULT,
  },
  summaryGrid: { flexDirection: 'row', gap: space.sm },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  summaryValue: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  summaryLabel: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary, marginTop: 2 },
  featureList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontSize: 14, fontFamily: fontFamily.medium, color: colors.textPrimary },
  infoCard: {
    gap: space.sm,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warning.lighter,
  },
  warningTitle: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  warningText: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  actionStack: { gap: space.sm },
  quickList: { gap: 4 },
});
