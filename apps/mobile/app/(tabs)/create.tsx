import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, TextInput, LayoutAnimation, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../src/lib/api';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button, Input } from '../../src/components/ui';
import { borderRadius, fontFamily, space } from '../../src/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type StepKey = 'category' | 'details' | 'budget' | 'preview';
type BudgetType = 'range' | 'fixed';

const STEPS: Array<{ key: StepKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'category', label: 'Kategori', icon: 'grid-outline' },
  { key: 'details', label: 'Detay', icon: 'document-text-outline' },
  { key: 'budget', label: 'Butce', icon: 'wallet-outline' },
  { key: 'preview', label: 'Onizleme', icon: 'eye-outline' },
];

const CATEGORIES = [
  { label: 'Mobilya', slug: 'mobilya', icon: 'bed-outline' as const },
  { label: 'Elektronik', slug: 'elektronik', icon: 'desktop-outline' as const },
  { label: 'Tekstil', slug: 'tekstil', icon: 'shirt-outline' as const },
  { label: 'Gida', slug: 'gida', icon: 'restaurant-outline' as const },
  { label: 'Insaat', slug: 'insaat', icon: 'business-outline' as const },
  { label: 'Otomotiv', slug: 'otomotiv', icon: 'car-sport-outline' as const },
  { label: 'Tarim', slug: 'tarim', icon: 'leaf-outline' as const },
  { label: 'Saglik', slug: 'saglik', icon: 'medkit-outline' as const },
  { label: 'Hizmet', slug: 'hizmet', icon: 'briefcase-outline' as const },
  { label: 'Diger', slug: 'diger', icon: 'apps-outline' as const },
];

const URGENCY_OPTIONS = [
  { value: 'urgent', label: 'Acil', hint: '1-3 gun', icon: 'flash-outline' as const },
  { value: 'normal', label: 'Normal', hint: 'Standart surec', icon: 'time-outline' as const },
  { value: 'flexible', label: 'Esnek', hint: 'Uygun teklif odakli', icon: 'calendar-outline' as const },
];

const DURATION_OPTIONS = [7, 14, 30];

function formatPreviewPrice(value?: string) {
  if (!value) return '—';
  const parsed = Number(value.replace(',', '.'));
  if (Number.isNaN(parsed)) return value;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(parsed);
}

export default function CreateListingScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [city, setCity] = useState('');
  const [budgetType, setBudgetType] = useState<BudgetType>('range');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [fixedBudget, setFixedBudget] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [durationDays, setDurationDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCategory = useMemo(
    () => CATEGORIES.find((item) => item.slug === categorySlug) || null,
    [categorySlug]
  );

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function animateStepChange(nextStep: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep(nextStep);
  }

  function validateStep(stepIndex: number) {
    const nextErrors: Record<string, string> = {};

    if (stepIndex === 0 && !categorySlug) {
      nextErrors.category = 'Bir kategori secmelisin.';
    }

    if (stepIndex === 1) {
      if (!title.trim()) nextErrors.title = 'Baslik gerekli.';
      else if (title.trim().length < 10) nextErrors.title = 'Baslik en az 10 karakter olmali.';

      if (!description.trim()) nextErrors.description = 'Aciklama gerekli.';
      else if (description.trim().length < 30) nextErrors.description = 'Aciklama en az 30 karakter olmali.';

      if (!city.trim()) nextErrors.city = 'Sehir gerekli.';
    }

    if (stepIndex === 2) {
      if (budgetType === 'range') {
        if (!budgetMin.trim()) nextErrors.budgetMin = 'Minimum butce gerekli.';
        if (!budgetMax.trim()) nextErrors.budgetMax = 'Maksimum butce gerekli.';

        const min = Number(budgetMin.replace(',', '.'));
        const max = Number(budgetMax.replace(',', '.'));
        if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
          nextErrors.budgetMax = 'Maksimum butce minimumden kucuk olamaz.';
        }
      }

      if (budgetType === 'fixed' && !fixedBudget.trim()) {
        nextErrors.fixedBudget = 'Sabit butce gerekli.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    animateStepChange(Math.min(currentStep + 1, STEPS.length - 1));
  }

  function handleBack() {
    animateStepChange(Math.max(currentStep - 1, 0));
  }

  async function handlePublish() {
    if (!validateStep(2)) {
      animateStepChange(2);
      return;
    }

    if (!selectedCategory) {
      animateStepChange(0);
      return;
    }

    const minValue = budgetType === 'fixed' ? fixedBudget : budgetMin;
    const maxValue = budgetType === 'fixed' ? fixedBudget : budgetMax;

    setLoading(true);
    try {
      const { data } = await api.post('/api/listings', {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory.label,
        categorySlug: selectedCategory.slug,
        city: city.trim(),
        budgetMin: Number(minValue.replace(',', '.')),
        budgetMax: Number(maxValue.replace(',', '.')),
        deliveryUrgency: urgency,
        expiresInDays: durationDays,
      });

      Alert.alert(
        'Basarili',
        data?.requiresApproval
          ? 'Ilanin onaya gonderildi. Onaylandiginda yayina alinacak.'
          : 'Ilanin basariyla yayina alindi.',
      );

      setCurrentStep(0);
      setTitle('');
      setDescription('');
      setCategorySlug('');
      setCity('');
      setBudgetType('range');
      setBudgetMin('');
      setBudgetMax('');
      setFixedBudget('');
      setUrgency('normal');
      setDurationDays(14);
      setErrors({});
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.error || 'Ilan olusturulamadi.');
    } finally {
      setLoading(false);
    }
  }

  function renderCategoryStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Kategori sec</Text>
        <Text style={styles.stepSubtitle}>Ihtiyacini en iyi anlatan kategoriyle basla.</Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((item) => {
            const active = item.slug === categorySlug;
            return (
              <TouchableOpacity
                key={item.slug}
                style={[styles.categoryCard, active && styles.categoryCardActive]}
                onPress={() => {
                  setCategorySlug(item.slug);
                  setErrors((prev) => ({ ...prev, category: '' }));
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.categoryIconWrap, active && styles.categoryIconWrapActive]}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={active ? colors.accent.DEFAULT : colors.textSecondary}
                  />
                </View>
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>
    );
  }

  function renderDetailsStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Ilan detaylari</Text>
        <Text style={styles.stepSubtitle}>Web tarafindaki gibi once ihtiyaci netlestiriyoruz.</Text>

        <Input
          label="Baslik"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="Orn: 500 adet ergonomik ofis sandalyesi"
          error={errors.title}
          leftIcon={<Ionicons name="sparkles-outline" size={18} color={colors.textSecondary} />}
        />

        <View style={styles.textareaWrap}>
          <Text style={styles.fieldLabel}>Aciklama</Text>
          <View style={[styles.textarea, errors.description && styles.textareaError]}>
            <TextInput
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Urun, miktar, kalite beklentisi ve teslimat detaylarini yaz..."
              placeholderTextColor={colors.textTertiary}
              multiline
              style={styles.textareaInput}
              textAlignVertical="top"
              selectionColor={colors.accent.DEFAULT}
            />
          </View>
          {!!errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <Input
          label="Sehir"
          value={city}
          onChangeText={(value) => {
            setCity(value);
            if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
          }}
          placeholder="Istanbul, Ankara..."
          error={errors.city}
          leftIcon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />}
        />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Teslimat aciliyeti</Text>
          <View style={styles.urgencyGrid}>
            {URGENCY_OPTIONS.map((option) => {
              const active = option.value === urgency;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.urgencyCard, active && styles.urgencyCardActive]}
                  onPress={() => setUrgency(option.value)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={active ? colors.accent.DEFAULT : colors.textSecondary}
                  />
                  <Text style={[styles.urgencyLabel, active && styles.urgencyLabelActive]}>{option.label}</Text>
                  <Text style={styles.urgencyHint}>{option.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  function renderBudgetStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Butce ve sure</Text>
        <Text style={styles.stepSubtitle}>Mobilde de daha net teklif almak icin butceyi adimli kuruyoruz.</Text>

        <View style={styles.toggleRow}>
          {[
            { key: 'range', label: 'Aralik' },
            { key: 'fixed', label: 'Sabit' },
          ].map((item) => {
            const active = budgetType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                onPress={() => {
                  setBudgetType(item.key as BudgetType);
                  setErrors((prev) => ({ ...prev, budgetMin: '', budgetMax: '', fixedBudget: '' }));
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {budgetType === 'range' ? (
          <View style={styles.budgetRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Min. butce"
                value={budgetMin}
                onChangeText={(value) => {
                  setBudgetMin(value);
                  if (errors.budgetMin) setErrors((prev) => ({ ...prev, budgetMin: '' }));
                }}
                placeholder="10000"
                keyboardType="numeric"
                error={errors.budgetMin}
                leftIcon={<Ionicons name="trending-down-outline" size={18} color={colors.textSecondary} />}
              />
            </View>
            <View style={{ width: space.md }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Max. butce"
                value={budgetMax}
                onChangeText={(value) => {
                  setBudgetMax(value);
                  if (errors.budgetMax) setErrors((prev) => ({ ...prev, budgetMax: '' }));
                }}
                placeholder="50000"
                keyboardType="numeric"
                error={errors.budgetMax}
                leftIcon={<Ionicons name="trending-up-outline" size={18} color={colors.textSecondary} />}
              />
            </View>
          </View>
        ) : (
          <Input
            label="Sabit butce"
            value={fixedBudget}
            onChangeText={(value) => {
              setFixedBudget(value);
              if (errors.fixedBudget) setErrors((prev) => ({ ...prev, fixedBudget: '' }));
            }}
            placeholder="25000"
            keyboardType="numeric"
            error={errors.fixedBudget}
            leftIcon={<Ionicons name="wallet-outline" size={18} color={colors.textSecondary} />}
          />
        )}

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Ilan suresi</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((days) => {
              const active = durationDays === days;
              return (
                <TouchableOpacity
                  key={days}
                  style={[styles.durationChip, active && styles.durationChipActive]}
                  onPress={() => setDurationDays(days)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.durationChipText, active && styles.durationChipTextActive]}>{days} gun</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="sparkles-outline" size={18} color={colors.accent.DEFAULT} />
          <Text style={styles.tipText}>
            Web akisindaki gibi butceyi netlestirmek daha kaliteli teklif almani saglar.
          </Text>
        </View>
      </View>
    );
  }

  function renderPreviewStep() {
    const priceSummary = budgetType === 'fixed'
      ? formatPreviewPrice(fixedBudget)
      : `${formatPreviewPrice(budgetMin)} - ${formatPreviewPrice(budgetMax)}`;

    const urgencyLabel = URGENCY_OPTIONS.find((item) => item.value === urgency)?.label || 'Normal';

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Son kontrol</Text>
        <Text style={styles.stepSubtitle}>Yayinlamadan once mobil onizlemeyi kontrol et.</Text>

        <View style={styles.previewCard}>
          <View style={styles.previewBadge}>
            <Ionicons name={selectedCategory?.icon || 'apps-outline'} size={14} color={colors.accent.DEFAULT} />
            <Text style={styles.previewBadgeText}>{selectedCategory?.label || 'Kategori secilmedi'}</Text>
          </View>

          <Text style={styles.previewTitle}>{title || 'Ilan basligi burada gorunecek'}</Text>
          <Text style={styles.previewDescription}>{description || 'Ilan aciklamasi burada gorunecek.'}</Text>

          <View style={styles.previewGrid}>
            <View style={styles.previewInfoBox}>
              <Text style={styles.previewInfoLabel}>Butce</Text>
              <Text style={styles.previewInfoValue}>{priceSummary}</Text>
            </View>
            <View style={styles.previewInfoBox}>
              <Text style={styles.previewInfoLabel}>Sehir</Text>
              <Text style={styles.previewInfoValue}>{city || 'Sehir yok'}</Text>
            </View>
            <View style={styles.previewInfoBox}>
              <Text style={styles.previewInfoLabel}>Aciliyet</Text>
              <Text style={styles.previewInfoValue}>{urgencyLabel}</Text>
            </View>
            <View style={styles.previewInfoBox}>
              <Text style={styles.previewInfoLabel}>Yayinda kalma</Text>
              <Text style={styles.previewInfoValue}>{durationDays} gun</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const currentStepKey = STEPS[currentStep].key;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ilan olustur</Text>
            <Text style={styles.headerSubtitle}>Web deneyimindeki gibi adim adim ilerleyelim.</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              {STEPS.map((step, index) => {
                const active = index === currentStep;
                const completed = index < currentStep;
                return (
                  <TouchableOpacity
                    key={step.key}
                    style={styles.progressStep}
                    disabled={!completed}
                    onPress={() => completed && animateStepChange(index)}
                    activeOpacity={0.85}
                  >
                    <View style={[
                      styles.progressCircle,
                      active && styles.progressCircleActive,
                      completed && styles.progressCircleDone,
                    ]}
                    >
                      {completed ? (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      ) : (
                        <Ionicons
                          name={step.icon}
                          size={16}
                          color={active ? colors.white : colors.textTertiary}
                        />
                      )}
                    </View>
                    <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>
                      {step.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.stepCard}>
            {currentStepKey === 'category' && renderCategoryStep()}
            {currentStepKey === 'details' && renderDetailsStep()}
            {currentStepKey === 'budget' && renderBudgetStep()}
            {currentStepKey === 'preview' && renderPreviewStep()}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Geri"
            variant="secondary"
            onPress={handleBack}
            disabled={currentStep === 0 || loading}
            style={{ flex: 1 }}
          />

          {currentStep < STEPS.length - 1 ? (
            <Button
              title="Ileri"
              onPress={handleNext}
              iconRight={<Ionicons name="arrow-forward" size={16} color={colors.white} />}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              title="Ilani Yayinla"
              onPress={handlePublish}
              loading={loading}
              icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 140 },
  header: { marginBottom: space.lg },
  headerTitle: { fontSize: 28, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
    gap: space.md,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressStep: { flex: 1, alignItems: 'center', gap: 6 },
  progressCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  progressCircleActive: { backgroundColor: colors.accent.DEFAULT },
  progressCircleDone: { backgroundColor: colors.success.DEFAULT },
  progressLabel: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textTertiary },
  progressLabelActive: { color: colors.textPrimary },
  progressBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent.DEFAULT,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  stepContent: { gap: space.md },
  stepTitle: { fontSize: 22, fontFamily: fontFamily.bold, color: colors.textPrimary },
  stepSubtitle: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  categoryCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: 10,
  },
  categoryCardActive: {
    borderColor: colors.accent.DEFAULT,
    backgroundColor: colors.accent.lighter,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  categoryIconWrapActive: { backgroundColor: colors.white },
  categoryLabel: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  categoryLabelActive: { color: colors.accent.DEFAULT },
  errorText: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.error.DEFAULT },
  textareaWrap: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textPrimary },
  textarea: {
    minHeight: 130,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  textareaError: { borderColor: colors.error.DEFAULT },
  textareaInput: {
    minHeight: 104,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  fieldBlock: { gap: 8 },
  urgencyGrid: { gap: space.sm },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  urgencyCardActive: {
    borderColor: colors.accent.DEFAULT,
    backgroundColor: colors.accent.lighter,
  },
  urgencyLabel: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  urgencyLabelActive: { color: colors.accent.DEFAULT },
  urgencyHint: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: space.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: space.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent.lighter,
    borderColor: colors.accent.DEFAULT,
  },
  toggleBtnText: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  toggleBtnTextActive: { color: colors.accent.DEFAULT },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start' },
  durationRow: { flexDirection: 'row', gap: space.sm },
  durationChip: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  durationChipActive: {
    backgroundColor: colors.accent.lighter,
    borderWidth: 1,
    borderColor: colors.accent.DEFAULT,
  },
  durationChipText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  durationChipTextActive: { color: colors.accent.DEFAULT },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.lighter,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: fontFamily.medium, color: colors.accent.DEFAULT },
  previewCard: {
    gap: space.md,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.lighter,
  },
  previewBadgeText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  previewTitle: { fontSize: 20, lineHeight: 28, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  previewDescription: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  previewInfoBox: {
    width: '48%',
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  previewInfoLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textTertiary, marginBottom: 4 },
  previewInfoValue: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: Platform.OS === 'ios' ? space.lg : space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
