import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../src/lib/api';
import { Button, Input } from '../../src/components/ui';
import { colors, fontFamily, space, typeScale } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('E-posta adresi gerekli');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/forgot-password', { email: email.trim() });
      setSent(true);
    } catch {
      setSent(true); // Güvenlik için her zaman başarılı göster
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name={sent ? 'checkmark-circle-outline' : 'key-outline'}
                size={48}
                color={sent ? colors.success.DEFAULT : colors.accent.DEFAULT}
              />
            </View>

            <Text style={styles.title}>
              {sent ? 'E-posta Gönderildi' : 'Şifremi Unuttum'}
            </Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
                : 'E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.'}
            </Text>

            {!sent ? (
              <View style={styles.form}>
                <Input
                  label="E-posta"
                  placeholder="ornek@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button
                  title="Gönder"
                  onPress={handleSubmit}
                  loading={loading}
                  fullWidth
                  size="lg"
                />
              </View>
            ) : null}

            <Button
              title={sent ? 'Giriş Sayfasına Dön' : 'Geri'}
              onPress={() => router.back()}
              variant="ghost"
              fullWidth
              style={{ marginTop: space.md }}
            />
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: space.md,
  },
  title: {
    ...typeScale.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typeScale.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: space.lg,
    lineHeight: 20,
  },
  form: {
    width: '100%',
    gap: space.md,
  },
  error: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.error.DEFAULT,
    textAlign: 'center',
  },
});
