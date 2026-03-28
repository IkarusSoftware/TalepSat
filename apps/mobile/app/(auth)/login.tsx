import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button, Input, Divider } from '../../src/components/ui';
import { colors, fontFamily, space, typeScale } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre gerekli');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Giriş başarısız. Tekrar deneyin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="swap-horizontal" size={28} color={colors.white} />
            </View>
            <Text style={styles.brandName}>TalepSat</Text>
            <Text style={styles.brandTag}>Ters Pazar Yeri</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Giriş Yap</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

            <View style={styles.form}>
              <Input
                label="E-posta"
                placeholder="ornek@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={
                  <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                }
              />

              <Input
                label="Şifre"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                }
              />

              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
                <Text style={styles.forgotLink}>Şifremi unuttum</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title="Giriş Yap"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            <Divider label="veya" />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Hesabınız yok mu? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Kayıt Ol</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: space.xl,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  brandName: {
    ...typeScale.h2,
    color: colors.textPrimary,
  },
  brandTag: {
    ...typeScale.bodySm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  title: {
    ...typeScale.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typeScale.bodyMd,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: space.lg,
  },
  form: {
    gap: space.md,
  },
  forgotLink: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.accent.DEFAULT,
    textAlign: 'right',
  },
  error: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.error.DEFAULT,
    textAlign: 'center',
    backgroundColor: colors.error.light,
    padding: space.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.md,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.accent.DEFAULT,
  },
});
