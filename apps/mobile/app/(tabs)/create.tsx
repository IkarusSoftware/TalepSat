import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import api from '../../src/lib/api';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

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
      const res = await api.post('/api/listings', {
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
              leftIcon="document-text-outline"
              error={errors.title}
            />

            <Input
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              placeholder="Detayları belirt: miktar, özellikler, teslimat koşulları..."
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
              leftIcon="list-outline"
              error={errors.description}
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>Kategori {errors.category ? <Text style={styles.errorInline}>— {errors.category}</Text> : null}</Text>
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

            <Input
              label="Şehir"
              value={city}
              onChangeText={setCity}
              placeholder="İstanbul, Ankara..."
              leftIcon="location-outline"
              error={errors.city}
            />

            <View style={styles.budgetRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Min Bütçe (₺)"
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder="1000"
                  keyboardType="numeric"
                  leftIcon="trending-down-outline"
                  error={errors.budgetMin}
                />
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Max Bütçe (₺)"
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder="5000"
                  keyboardType="numeric"
                  leftIcon="trending-up-outline"
                  error={errors.budgetMax}
                />
              </View>
            </View>

            {/* Urgency */}
            <Text style={styles.fieldLabel}>Teslimat Aciliyeti</Text>
            <View style={styles.urgencyRow}>
              {URGENCY.map((u) => (
                <TouchableOpacity
                  key={u.value}
                  onPress={() => setUrgency(u.value)}
                  style={[styles.urgencyItem, urgency === u.value && styles.urgencyItemActive]}
                >
                  <Ionicons name={u.icon} size={20} color={urgency === u.value ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.urgencyLabel, urgency === u.value && styles.urgencyLabelActive]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="İlanı Yayınla" onPress={handleCreate} loading={loading} size="lg" style={styles.btn} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.lg },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  errorInline: { color: COLORS.error, fontWeight: '400', fontSize: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  categoryItem: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  categoryItemActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  categoryItemText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryItemTextActive: { color: COLORS.primary },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start' },
  urgencyRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  urgencyItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 4,
  },
  urgencyItemActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  urgencyLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  urgencyLabelActive: { color: COLORS.primary },
  btn: {},
});
