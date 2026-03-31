import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button, Input } from '../../src/components/ui';
import { fontFamily, space, borderRadius } from '../../src/theme';

const roles = [
  { key: 'buyer' as const, label: 'Alıcı', icon: 'cart-outline' as const, desc: 'Ürün/hizmet talep et' },
  { key: 'seller' as const, label: 'Satıcı', icon: 'storefront-outline' as const, desc: 'Teklif ver' },
  { key: 'both' as const, label: 'Her İkisi', icon: 'swap-horizontal-outline' as const, desc: 'Hem al hem sat' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Ad, e-posta ve şifre zorunlu');
      return;
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined, role });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Kayıt başarısız. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>TalepSat'a katılın</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.form}>
              <Input
                label="Ad Soyad" placeholder="Adınız Soyadınız"
                value={name} onChangeText={setName}
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
              />
              <Input
                label="E-posta" placeholder="ornek@email.com"
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
              />
              <Input
                label="Telefon (Opsiyonel)" placeholder="05XX XXX XX XX"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18} color={colors.textSecondary} />}
              />
              <Input
                label="Şifre" placeholder="En az 8 karakter"
                value={password} onChangeText={setPassword} isPassword
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
              />

              {/* Role Selection */}
              <View style={styles.roleSection}>
                <Text style={styles.roleLabel}>Hesap Türü</Text>
                <View style={styles.roleGrid}>
                  {roles.map((r) => (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setRole(r.key)}
                      style={[styles.roleCard, role === r.key && styles.roleCardSelected]}
                    >
                      <Ionicons
                        name={r.icon} size={22}
                        color={role === r.key ? colors.accent.DEFAULT : colors.textSecondary}
                      />
                      <Text style={[styles.roleCardTitle, role === r.key && styles.roleCardTitleSelected]}>
                        {r.label}
                      </Text>
                      <Text style={styles.roleCardDesc}>{r.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button title="Kayıt Ol" onPress={handleRegister} loading={loading} fullWidth size="lg" />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Giriş Yap</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: space.lg, paddingVertical: space.xl },
  header: { marginBottom: space.lg },
  title: { fontSize: 26, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  subtitle: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: space.lg,
  },
  form: { gap: space.md },
  roleSection: { gap: 8 },
  roleLabel: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textPrimary },
  roleGrid: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, gap: 4,
  },
  roleCardSelected: { borderColor: colors.accent.DEFAULT, backgroundColor: colors.accent.lighter },
  roleCardTitle: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  roleCardTitleSelected: { color: colors.accent.DEFAULT },
  roleCardDesc: { fontSize: 10, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
  error: {
    fontSize: 13, fontFamily: fontFamily.regular, color: colors.error.DEFAULT,
    textAlign: 'center', backgroundColor: colors.error.light,
    padding: space.sm, borderRadius: 8, overflow: 'hidden',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: space.lg },
  footerText: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
});
