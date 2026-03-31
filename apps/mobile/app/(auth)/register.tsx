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
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { usePublicSettings } from '../../src/hooks/usePublicSettings';
import { Button, Input } from '../../src/components/ui';
import { borderRadius, fontFamily, space } from '../../src/theme';

const roles = [
  { key: 'buyer' as const, label: 'Alici', icon: 'cart-outline' as const, desc: 'Urun veya hizmet talep et' },
  { key: 'seller' as const, label: 'Satici', icon: 'storefront-outline' as const, desc: 'Teklif ver' },
  { key: 'both' as const, label: 'Her Ikisi', icon: 'swap-horizontal-outline' as const, desc: 'Hem al hem sat' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const { settings, loading: settingsLoading } = usePublicSettings();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const registrationDisabled = !settings.registration_open || settings.maintenance_mode;

  const handleRegister = async () => {
    if (registrationDisabled) {
      setError(settings.maintenance_mode ? settings.maintenance_message || 'Uygulama su an bakimda.' : 'Yeni kayitlar su an kapali.');
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Ad, e-posta ve sifre zorunlu');
      return;
    }

    if (password.length < 8) {
      setError('Sifre en az 8 karakter olmali');
      return;
    }

    setError('');
    setNotice('');
    setLoading(true);

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
      });

      if (result.requiresVerification) {
        setNotice(result.message || 'Hesabiniz olusturuldu. Giris yapmadan once hesabinizin dogrulanmasi gerekiyor.');
        setPassword('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Kayit basarisiz. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Kayit Ol</Text>
            <Text style={styles.subtitle}>TalepSat&apos;a katilin</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.form}>
              {settings.maintenance_mode && !settingsLoading ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    {settings.maintenance_message || 'Uygulama su an bakimda.'}
                  </Text>
                </View>
              ) : null}

              {!settings.registration_open && !settingsLoading ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>Yeni kayitlar su an kapali.</Text>
                </View>
              ) : null}

              {settings.email_verification_required && !settingsLoading ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Kayittan sonra giris yapabilmek icin hesabinizin dogrulanmasi gerekir.
                  </Text>
                </View>
              ) : null}

              {notice ? <Text style={styles.success}>{notice}</Text> : null}

              <Input
                label="Ad Soyad"
                placeholder="Adiniz Soyadiniz"
                value={name}
                onChangeText={setName}
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
              />
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
                label="Telefon (Opsiyonel)"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18} color={colors.textSecondary} />}
              />
              <Input
                label="Sifre"
                placeholder="En az 8 karakter"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
              />

              <View style={styles.roleSection}>
                <Text style={styles.roleLabel}>Hesap Turu</Text>
                <View style={styles.roleGrid}>
                  {roles.map((currentRole) => (
                    <TouchableOpacity
                      key={currentRole.key}
                      onPress={() => setRole(currentRole.key)}
                      style={[styles.roleCard, role === currentRole.key && styles.roleCardSelected]}
                    >
                      <Ionicons
                        name={currentRole.icon}
                        size={22}
                        color={role === currentRole.key ? colors.accent.DEFAULT : colors.textSecondary}
                      />
                      <Text style={[styles.roleCardTitle, role === currentRole.key && styles.roleCardTitleSelected]}>
                        {currentRole.label}
                      </Text>
                      <Text style={styles.roleCardDesc}>{currentRole.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title={settingsLoading ? 'Ayarlar Yukleniyor...' : 'Kayit Ol'}
                onPress={handleRegister}
                loading={loading}
                disabled={settingsLoading || registrationDisabled}
                fullWidth
                size="lg"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabiniz var mi? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Giris Yap</Text>
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  form: { gap: space.md },
  roleSection: { gap: 8 },
  roleLabel: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textPrimary },
  roleGrid: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    gap: 4,
  },
  roleCardSelected: { borderColor: colors.accent.DEFAULT, backgroundColor: colors.accent.lighter },
  roleCardTitle: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  roleCardTitleSelected: { color: colors.accent.DEFAULT },
  roleCardDesc: { fontSize: 10, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
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
  success: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.success.DEFAULT,
    textAlign: 'center',
    backgroundColor: colors.success.light,
    padding: space.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  infoBox: {
    padding: space.sm,
    borderRadius: 8,
    backgroundColor: colors.accent.lighter,
  },
  infoText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.accent.DEFAULT,
    textAlign: 'center',
  },
  warningBox: {
    padding: space.sm,
    borderRadius: 8,
    backgroundColor: colors.warning.light,
  },
  warningText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.warning.DEFAULT,
    textAlign: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: space.lg },
  footerText: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
});
