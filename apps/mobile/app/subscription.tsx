import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import api from '../src/lib/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { Button, EmptyState } from '../src/components/ui';
import { borderRadius, fontFamily, space } from '../src/theme';
import type { Plan } from '../src/types';
import {
  enrichPlans,
  formatPlanPrice,
  includedFeatures,
  planLabel,
} from '../src/features/plan-catalog';

type UsageData = {
  listingCount?: number;
  totalOffers?: number;
  acceptedOffers?: number;
  reviewCount?: number;
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { plan: selectedPlanSlug } = useLocalSearchParams<{ plan?: string }>();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data: rawPlans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/api/plans')).data,
  });

  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ['subscription-usage', user?.id],
    queryFn: async () => (await api.get(`/api/users/${user?.id}`)).data,
    enabled: !!user?.id,
  });

  const plans = useMemo(() => enrichPlans(rawPlans), [rawPlans]);
  const currentPlanSlug = user?.badge || 'free';
  const currentPlan = plans.find((item) => item.slug === currentPlanSlug) || plans[0];
  const selectedPlan = plans.find((item) => item.slug === selectedPlanSlug);

  if (plansLoading || usageLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="card-outline"
            title="Abonelik bilgisi bulunamadı"
            subtitle="Plan verisi şu an yüklenemedi. Biraz sonra tekrar deneyebilirsin."
          />
        </View>
      </SafeAreaView>
    );
  }

  const offersUsed = usage?.totalOffers || 0;
  const offersLimit = currentPlan.offersPerMonth;
  const offersRatio = offersLimit ? Math.min(offersUsed / offersLimit, 1) : 0.14;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: currentPlan.meta.accent + '35' }]}>
          <View style={[styles.heroIcon, { backgroundColor: currentPlan.meta.accentSoft }]}>
            <Ionicons name={currentPlan.meta.icon} size={26} color={currentPlan.meta.accent} />
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.overline}>Aktif plan</Text>
            <Text style={styles.heroTitle}>{currentPlan.name} Plan</Text>
            <Text style={styles.heroText}>{currentPlan.meta.description}</Text>
          </View>

          <View style={styles.heroPriceWrap}>
            <Text style={styles.heroPrice}>
              {currentPlan.priceMonthly === 0 ? 'Ücretsiz' : `₺${formatPlanPrice(currentPlan.priceMonthly)}`}
            </Text>
            {currentPlan.priceMonthly > 0 && <Text style={styles.heroPriceSub}>/ay</Text>}
          </View>
        </View>

        {selectedPlan && selectedPlan.slug !== currentPlan.slug && (
          <View style={styles.noticeCard}>
            <Ionicons name="sparkles-outline" size={18} color={colors.accent.DEFAULT} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{selectedPlan.name} planını inceliyorsun</Text>
              <Text style={styles.noticeText}>
                Ödeme entegrasyonu henüz aktif değil. Yükseltme akışı hazır olduğunda bu ekrandan gerçek işlemi yönetebileceksin.
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
              <Text style={styles.summaryValue}>{usage?.listingCount || 0}</Text>
              <Text style={styles.summaryLabel}>İlan</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{usage?.acceptedOffers || 0}</Text>
              <Text style={styles.summaryLabel}>Kabul</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{usage?.reviewCount || 0}</Text>
              <Text style={styles.summaryLabel}>Değerlendirme</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan özellikleri</Text>
          <View style={styles.featureList}>
            {includedFeatures(currentPlan).map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success.DEFAULT} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ödeme</Text>
          <View style={styles.paymentCard}>
            <Ionicons name="card-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.paymentTitle}>Ödeme entegrasyonu yakında aktif olacak</Text>
            <Text style={styles.paymentText}>
              Web tarafındaki mevcut durumu koruyoruz. Şimdilik plan yükseltme ve tahsilat akışı bilgilendirme seviyesinde.
            </Text>
            <Button
              title="Destek ile iletişime geç"
              variant="secondary"
              onPress={() => Linking.openURL('mailto:destek@talepsat.com?subject=Plan%20Yukseltme').catch(() => {})}
              fullWidth
            />
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

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteLabel}>Plan etiketi</Text>
          <Text style={styles.footerNoteValue}>{planLabel(currentPlanSlug)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  paymentCard: {
    alignItems: 'center',
    gap: space.sm,
    padding: space.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  paymentTitle: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.textPrimary, textAlign: 'center' },
  paymentText: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
  quickList: { gap: 4 },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
  },
  footerNoteLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textTertiary, textTransform: 'uppercase' },
  footerNoteValue: { fontSize: 13, fontFamily: fontFamily.bold, color: colors.textPrimary },
});
