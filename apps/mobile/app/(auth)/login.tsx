import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { usePublicSettings } from '../../src/hooks/usePublicSettings';
import { Button, Divider, Input } from '../../src/components/ui';
import { fontFamily, space } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { settings, loading: settingsLoading } = usePublicSettings();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loginDisabled = settings.maintenance_mode;

  const handleLogin = async () => {
    if (loginDisabled) {
      setError(settings.maintenance_message || 'Uygulama su an bakimda.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('E-posta ve sifre gerekli');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Giris basarisiz. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="swap-horizontal" size={28} color={colors.white} />
            </View>
            <Text style={styles.brandName}>TalepSat</Text>
            <Text style={styles.brandTag}>Ters Pazar Yeri</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Giris Yap</Text>
            <Text style={styles.subtitle}>Hesabiniza giris yapin</Text>

            <View style={styles.form}>
              {settings.maintenance_mode && !settingsLoading ? (
                <Text style={styles.warning}>{settings.maintenance_message || 'Uygulama su an bakimda.'}</Text>
              ) : null}

              {settings.email_verification_required && !settingsLoading ? (
                <Text style={styles.info}>E-posta dogrulamasi zorunlu. Dogrulanmamis hesaplar giris yapamaz.</Text>
              ) : null}

              <Input
                label="E-posta"
                placeholder="ornek@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
              />
              <Input
                label="Sifre"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
              />
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
                <Text style={styles.forgotLink}>Sifremi unuttum</Text>
              </TouchableOpacity>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title={settingsLoading ? 'Ayarlar Yukleniyor...' : 'Giris Yap'}
                onPress={handleLogin}
                loading={loading}
                disabled={settingsLoading || loginDisabled}
                fullWidth
                size="lg"
              />
            </View>

            <Divider label="veya" />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Hesabiniz yok mu? </Text>
              {settings.registration_open ? (
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Kayit Ol</Text>
                  </TouchableOpacity>
                </Link>
              ) : (
                <Text style={styles.footerMuted}>Kayit kapali</Text>
              )}
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
  },
  brand: { alignItems: 'center', marginBottom: space.xl },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  brandName: { fontSize: 26, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  brandTag: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  title: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: space.lg,
  },
  form: { gap: space.md },
  forgotLink: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.accent.DEFAULT,
    textAlign: 'right',
  },
  info: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.accent.DEFAULT,
    textAlign: 'center',
    backgroundColor: colors.accent.lighter,
    padding: space.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  warning: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.warning.DEFAULT,
    textAlign: 'center',
    backgroundColor: colors.warning.light,
    padding: space.sm,
    borderRadius: 8,
    overflow: 'hidden',
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: space.md },
  footerText: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  footerMuted: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textTertiary },
  orb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#6366f114',
    top: -100,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#6366f10e',
    bottom: 80,
    left: -70,
  },
  orb3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#818cf80a',
    top: '45%',
    right: '5%',
  },
});
