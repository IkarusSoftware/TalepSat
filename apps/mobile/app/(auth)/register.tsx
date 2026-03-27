import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

type Role = 'buyer' | 'seller' | 'both';

const roles: { value: Role; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'buyer', label: 'Alıcı', desc: 'İlan oluştur, teklif al', icon: 'bag-outline' },
  { value: 'seller', label: 'Satıcı', desc: 'Teklif ver, satış yap', icon: 'storefront-outline' },
  { value: 'both', label: 'Her İkisi', desc: 'Hem al hem sat', icon: 'swap-horizontal-outline' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('both');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Ad soyad gerekli';
    if (!email) e.email = 'E-posta gerekli';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Geçerli bir e-posta girin';
    if (!password) e.password = 'Şifre gerekli';
    else if (password.length < 6) e.password = 'Şifre en az 6 karakter olmalı';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone || undefined, role });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Kayıt yapılamadı. Lütfen tekrar deneyin.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>TalepSat'a katıl, piyasayı keşfet</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Input
              label="Ad Soyad"
              value={name}
              onChangeText={setName}
              placeholder="Adınız Soyadınız"
              leftIcon="person-outline"
              error={errors.name}
            />
            <Input
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              leftIcon="mail-outline"
              error={errors.email}
            />
            <Input
              label="Telefon (opsiyonel)"
              value={phone}
              onChangeText={setPhone}
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
            <Input
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="En az 6 karakter"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            {/* Role selection */}
            <Text style={styles.roleLabel}>Hesap Türü</Text>
            <View style={styles.roleRow}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setRole(r.value)}
                  style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                >
                  <Ionicons
                    name={r.icon}
                    size={22}
                    color={role === r.value ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.roleCardTitle, role === r.value && styles.roleCardTitleActive]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roleCardDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Kayıt Ol" onPress={handleRegister} loading={loading} size="lg" style={styles.btn} />

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
              <Text style={styles.loginText}>Zaten hesabın var mı? </Text>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl, paddingTop: SPACING.md },
  backBtn: { alignSelf: 'flex-start', marginBottom: SPACING.md },
  logoIcon: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoLetter: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  roleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 4,
  },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  roleCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  roleCardTitleActive: { color: COLORS.primary },
  roleCardDesc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  btn: { marginTop: SPACING.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  loginText: { fontSize: 15, color: COLORS.textSecondary },
  loginLink: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
});
