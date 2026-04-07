import React, { useMemo, useState } from 'react';
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
import type { BillingSnapshot, Plan } from '../src/types';
import {
  enrichPlans,
  featureRows,
  formatPlanPrice,
  planFaqs,
  planLabel,
} from '../src/features/plan-catalog';

type BillingCycle = 'monthly' | 'yearly';

export default function PlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

  const {
    data: rawPlans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/api/plans')).data,
  });

  const { data: billingSnapshot } = useQuery<BillingSnapshot>({
    queryKey: ['billing-subscription'],
    queryFn: async () => (await api.get('/api/billing/subscription')).data,
    enabled: !!user,
  });

  const plans = useMemo(() => enrichPlans(rawPlans), [rawPlans]);
  const currentSlug = billingSnapshot?.currentPlan?.slug || user?.badge || 'free';
  const comparison = useMemo(() => featureRows(plans), [plans]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="diamond-outline"
            title="Planlar yüklenemedi"
            subtitle="Plan bilgileri şu an alınamadı. Daha sonra tekrar deneyebilirsin."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.DEFAULT}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>İşletmene uygun planı seç</Text>
          <Text style={styles.heroText}>
            Planları karşılaştır, sonra iyzico ile güvenli ödeme akışından aboneliğini başlat
            ya da mevcut planını yönet.
          </Text>

          <View style={styles.billingSwitch}>
            {([
              ['monthly', 'Aylık'],
              ['yearly', 'Yıllık'],
            ] as const).map(([value, label]) => {
              const active = billingCycle === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.billingBtn, active && styles.billingBtnActive]}
                  onPress={() => setBillingCycle(value)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.billingBtnText, active && styles.billingBtnTextActive]}>
                    {label}
                  </Text>
                  {value === 'yearly' && <Text style={styles.billingPromo}>2 ay avantaj</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.currentStrip}>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>Mevcut planın</Text>
            <Text style={styles.currentValue}>{planLabel(currentSlug)}</Text>
          </View>
          <Button
            title="Aboneliği Aç"
            size="sm"
            onPress={() => router.push('/subscription' as any)}
            icon={<Ionicons name="arrow-forward" size={14} color={colors.white} />}
          />
        </View>

        <View style={styles.planGrid}>
          {plans.map((plan) => {
            const active = plan.slug === currentSlug;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const planConfigured =
              plan.slug === 'free' ||
              Boolean(
                billingCycle === 'monthly' ? plan.iyzicoMonthlyPlanRef : plan.iyzicoYearlyPlanRef,
              );
            const canCheckout = active || (billingSnapshot?.iyzicoConfigured && planConfigured);

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  active && { borderColor: plan.meta.accent, backgroundColor: `${plan.meta.accentSoft}55` },
                ]}
              >
                {plan.meta.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>En Popüler</Text>
                  </View>
                )}

                <View style={[styles.planIconWrap, { backgroundColor: plan.meta.accentSoft }]}>
                  <Ionicons name={plan.meta.icon} size={22} color={plan.meta.accent} />
                </View>

                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.meta.description}</Text>

                <View style={styles.priceWrap}>
                  <Text style={styles.priceValue}>
                    {price === 0 ? 'Ücretsiz' : `₺${formatPlanPrice(price)}`}
                  </Text>
                  {price > 0 && (
                    <Text style={styles.priceSub}>/{billingCycle === 'monthly' ? 'ay' : 'yıl'}</Text>
                  )}
                </View>

                {billingCycle === 'yearly' && price > 0 && (
                  <Text style={styles.priceHint}>
                    Aylık yaklaşık ₺{formatPlanPrice(Math.round(price / 12))}
                  </Text>
                )}

                <View style={styles.featureList}>
                  {[
                    `${plan.offersPerMonth === null ? 'Sınırsız' : plan.offersPerMonth} teklif / ay`,
                    `${plan.boostPerMonth === null ? 'Sınırsız' : plan.boostPerMonth} öne çıkarma`,
                    `${plan.maxListings === null ? 'Sınırsız' : plan.maxListings} aktif ilan`,
                    plan.responseTime || 'Standart destek',
                  ].map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color={colors.success.DEFAULT}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  title={
                    active
                      ? 'Mevcut Planın'
                      : canCheckout
                        ? 'Planı Seç'
                        : 'Yapılandırma Bekleniyor'
                  }
                  variant={active ? 'secondary' : 'primary'}
                  disabled={!active && !canCheckout}
                  onPress={() =>
                    router.push({
                      pathname: '/subscription',
                      params: { plan: plan.slug, cycle: billingCycle },
                    } as any)
                  }
                  fullWidth
                />
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detaylı plan karşılaştırması</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.compareTable}>
              <View style={styles.compareHeaderRow}>
                <View style={[styles.compareLabelCell, styles.compareHeaderCell]}>
                  <Text style={styles.compareHeaderLabel}>Özellik</Text>
                </View>
                {plans.map((plan) => (
                  <View key={plan.id} style={[styles.compareValueCell, styles.compareHeaderCell]}>
                    <Text style={styles.compareHeaderLabel}>{plan.name}</Text>
                  </View>
                ))}
              </View>

              {comparison.map((row) => (
                <View key={row.label} style={styles.compareRow}>
                  <View style={styles.compareLabelCell}>
                    <Text style={styles.compareLabel}>{row.label}</Text>
                  </View>
                  {row.values.map((value, index) => (
                    <View key={`${row.label}-${plans[index].id}`} style={styles.compareValueCell}>
                      {typeof value === 'boolean' ? (
                        <Ionicons
                          name={value ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={value ? colors.success.DEFAULT : colors.textTertiary}
                        />
                      ) : (
                        <Text style={styles.compareValue}>{value}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sıkça sorulan sorular</Text>
          <View style={styles.faqList}>
            {planFaqs.map((faq) => (
              <View key={faq.question} style={styles.faqCard}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </View>
        </View>

        {!billingSnapshot?.iyzicoConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ödeme kurulumu bekleniyor</Text>
            <Text style={styles.heroText}>
              Bu ortamda iyzico erişim bilgileri tanımlı değilse planları görebilir ama ödeme
              başlatamazsın.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, paddingBottom: 120, gap: space.lg },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  heroTitle: { fontSize: 26, lineHeight: 34, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  heroText: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  billingSwitch: {
    flexDirection: 'row',
    gap: space.sm,
    padding: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
  },
  billingBtn: {
    flex: 1,
    borderRadius: borderRadius.full,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  billingBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billingBtnText: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  billingBtnTextActive: { color: colors.textPrimary },
  billingPromo: { fontSize: 10, fontFamily: fontFamily.bold, color: colors.success.DEFAULT },
  currentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.accent.lighter,
  },
  currentLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.accent.DEFAULT, textTransform: 'uppercase' },
  currentValue: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.textPrimary, marginTop: 4 },
  planGrid: { gap: space.md },
  planCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  popularBadge: {
    position: 'absolute',
    top: -11,
    right: space.lg,
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: borderRadius.full,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  popularBadgeText: { fontSize: 10, fontFamily: fontFamily.bold, color: colors.white, textTransform: 'uppercase' },
  planIconWrap: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontSize: 20, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  planDescription: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary },
  priceWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 },
  priceValue: { fontSize: 28, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  priceSub: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textTertiary, marginBottom: 3 },
  priceHint: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  featureList: { gap: 8, marginVertical: space.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontSize: 13, fontFamily: fontFamily.medium, color: colors.textPrimary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  sectionTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  compareTable: { minWidth: 760, borderRadius: borderRadius.lg, overflow: 'hidden' },
  compareHeaderRow: { flexDirection: 'row', backgroundColor: colors.surfaceRaised },
  compareRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  compareHeaderCell: { paddingVertical: space.md },
  compareLabelCell: {
    width: 190,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  compareValueCell: {
    width: 142,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.md,
  },
  compareHeaderLabel: { fontSize: 13, fontFamily: fontFamily.bold, color: colors.textPrimary },
  compareLabel: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.medium, color: colors.textPrimary },
  compareValue: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textSecondary, textAlign: 'center' },
  faqList: { gap: space.md },
  faqCard: {
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
    gap: 6,
  },
  faqQuestion: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  faqAnswer: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary },
});
