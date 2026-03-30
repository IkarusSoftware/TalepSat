import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, Input } from '../../src/components/ui';
import api from '../../src/lib/api';
import { colors, fontFamily, space, borderRadius } from '../../src/theme';

const CATEGORIES = [
  'Elektronik', 'Tekstil', 'Gıda & İçecek', 'İnşaat & Yapı',
  'Mobilya', 'Otomotiv', 'Tarım', 'Sağlık', 'Hizmet', 'Diğer',
];

const CATEGORY_SLUGS: Record<string, string> = {
  'Elektronik': 'elektronik',
  'Tekstil': 'tekstil',
  'Gıda & İçecek': 'gida',
  'İnşaat & Yapı': 'insaat',
  'Mobilya': 'mobilya',
  'Otomotiv': 'otomotiv',
  'Tarım': 'tarim',
  'Sağlık': 'saglik',
  'Hizmet': 'hizmet',
  'Diğer': 'diger',
};

const URGENCY = [
  { value: 'urgent', label: 'Acil', icon: 'flash-outline' as const },
  { value: 'normal', label: 'Normal', icon: 'time-outline' as const },
  { value: 'flexible', label: 'Esnek', icon: 'calendar-outline' as const },
];

export default function CreateListingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Başlık gerekli';
    if (!description.trim()) e.description = 'Açıklama gerekli';
    if (!category) e.category = 'Kategori seçin';
    if (!city.trim()) e.city = 'Şehir gerekli';
    if (!budgetMin) e.budgetMin = 'Min bütçe gerekli';
    if (!budgetMax) e.budgetMax = 'Max bütçe gerekli';
    if (budgetMin && budgetMax && parseFloat(budgetMin) > parseFloat(budgetMax)) {
      e.budgetMax = 'Max bütçe, min bütçeden büyük olmalı';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/api/listings', {
        title: title.trim(),
        description: description.trim(),
        category,
        categorySlug: CATEGORY_SLUGS[category] || 'diger',
        city: city.trim(),
        budgetMin: parseFloat(budgetMin),
        budgetMax: parseFloat(budgetMax),
        deliveryUrgency: urgency,
      });
      Alert.alert('Başarılı', 'İlanınız oluşturuldu!', [
        { text: 'Tamam', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'İlan oluşturulamadı.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>İlan Oluştur</Text>
            <Text style={styles.headerSubtitle}>İhtiyacını belirt, teklifler gelsin</Text>
          </View>

          <View style={styles.card}>
            <Input
              label="İlan Başlığı"
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: 500 adet beyaz t-shirt"
              leftIcon={<Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />}
              error={errors.title}
            />

            {/* Description — manual textarea */}
            <View style={styles.textareaWrapper}>
              <Text style={styles.inputLabel}>
                Açıklama
                {errors.description ? <Text style={styles.errorInline}> — {errors.description}</Text> : null}
              </Text>
              <View style={[styles.textarea, errors.description ? styles.textareaError : null]}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Detayları belirt: miktar, özellikler, teslimat koşulları..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  style={styles.textareaInput}
                  textAlignVertical="top"
                  selectionColor={colors.accent.DEFAULT}
                />
              </View>
            </View>

            {/* Category */}
            <View>
              <Text style={styles.inputLabel}>
                Kategori
                {errors.category ? <Text style={styles.errorInline}> — {errors.category}</Text> : null}
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.categoryItem, category === cat && styles.categoryItemActive]}
                  >
                    <Text style={[styles.categoryItemText, category === cat && styles.categoryItemTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Şehir"
              value={city}
              onChangeText={setCity}
              placeholder="İstanbul, Ankara..."
              leftIcon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />}
              error={errors.city}
            />

            <View style={styles.budgetRow}>
              <View style={styles.budgetField}>
                <Input
                  label="Min Bütçe (₺)"
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder="1000"
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="trending-down-outline" size={18} color={colors.textSecondary} />}
                  error={errors.budgetMin}
                />
              </View>
              <View style={styles.budgetSpacer} />
              <View style={styles.budgetField}>
                <Input
                  label="Max Bütçe (₺)"
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder="5000"
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="trending-up-outline" size={18} color={colors.textSecondary} />}
                  error={errors.budgetMax}
                />
              </View>
            </View>

            {/* Urgency */}
            <View>
              <Text style={styles.inputLabel}>Teslimat Aciliyeti</Text>
              <View style={styles.urgencyRow}>
                {URGENCY.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    onPress={() => setUrgency(u.value)}
                    style={[styles.urgencyItem, urgency === u.value && styles.urgencyItemActive]}
                  >
                    <Ionicons
                      name={u.icon}
                      size={20}
                      color={urgency === u.value ? colors.primary.DEFAULT : colors.textTertiary}
                    />
                    <Text style={[styles.urgencyLabel, urgency === u.value && styles.urgencyLabelActive]}>
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="İlanı Yayınla" onPress={handleCreate} loading={loading} size="lg" fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: space.lg, paddingBottom: 100 },
  header: { marginBottom: space.lg },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  errorInline: {
    fontFamily: fontFamily.regular,
    color: colors.error.DEFAULT,
    fontSize: 12,
  },
  textareaWrapper: { gap: 6 },
  textarea: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: space.md,
    minHeight: 100,
  },
  textareaError: {
    borderColor: colors.error.DEFAULT,
  },
  textareaInput: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    minHeight: 80,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryItemActive: {
    backgroundColor: colors.primary.lighter,
    borderColor: colors.primary.DEFAULT,
  },
  categoryItemText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  categoryItemTextActive: {
    color: colors.primary.light,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start' },
  budgetField: { flex: 1 },
  budgetSpacer: { width: space.md },
  urgencyRow: { flexDirection: 'row', gap: space.sm },
  urgencyItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
  },
  urgencyItemActive: {
    backgroundColor: colors.primary.lighter,
    borderColor: colors.primary.DEFAULT,
  },
  urgencyLabel: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textTertiary,
  },
  urgencyLabelActive: {
    color: colors.primary.light,
  },
});
