import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../src/lib/api';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) { Alert.alert('Hata', 'E-posta adresinizi girin'); return; }
    setLoading(true);
    try {
      await api.post('/api/forgot-password', { email });
      setSent(true);
    } catch {
      setSent(true); // Güvenlik için her zaman başarılı göster
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="lock-open-outline" size={40} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.'
            : 'Kayıtlı e-posta adresini gir, şifre sıfırlama bağlantısı gönderelim.'}
        </Text>

        {!sent ? (
          <View style={styles.card}>
            <Input
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />
            <Button title="Bağlantı Gönder" onPress={handleSend} loading={loading} size="lg" />
          </View>
        ) : (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.successText}>Kontrol edin</Text>
            <Button title="Giriş Yap" onPress={() => router.replace('/(auth)/login')} variant="outline" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  backBtn: { marginBottom: SPACING.lg },
  iconWrap: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  successCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', gap: SPACING.md,
  },
  successText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
});
