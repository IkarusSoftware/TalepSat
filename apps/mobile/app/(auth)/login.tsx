import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'E-posta gerekli';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Geçerli bir e-posta girin';
    if (!password) e.password = 'Şifre gerekli';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Giriş yapılamadı. Lütfen tekrar deneyin.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <Text style={styles.logoText}>TalepSat</Text>
            <Text style={styles.tagline}>İhtiyacını Yaz, Satıcılar Yarışsın</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giriş Yap</Text>
            <Text style={styles.cardSubtitle}>Hesabına erişmek için bilgilerini gir</Text>

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
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Şifremi unuttum</Text>
            </TouchableOpacity>

            <Button title="Giriş Yap" onPress={handleLogin} loading={loading} size="lg" style={styles.btn} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerRow}>
              <Text style={styles.registerText}>Hesabın yok mu? </Text>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  logoSection: { alignItems: 'center', marginBottom: SPACING.xl },
  logoIcon: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoLetter: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  logoText: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  forgotRow: { alignItems: 'flex-end', marginTop: -SPACING.sm, marginBottom: SPACING.md },
  forgotText: { fontSize: 13, color: COLORS.primaryLight },
  btn: { marginTop: SPACING.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg, gap: SPACING.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textMuted },
  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerText: { fontSize: 15, color: COLORS.textSecondary },
  registerLink: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
});
