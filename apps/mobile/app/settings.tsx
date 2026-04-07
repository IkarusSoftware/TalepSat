import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../src/lib/api';
import { syncPushPreference } from '../src/lib/push';
import { useAuth, type AuthUser } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { Avatar, Button, EmptyState, Input } from '../src/components/ui';
import { borderRadius, fontFamily, space } from '../src/theme';

type NotificationPrefs = {
  emailNewOffer: boolean;
  emailStatusChange: boolean;
  emailExpiry: boolean;
  push: boolean;
};

const defaultNotificationPrefs: NotificationPrefs = {
  emailNewOffer: true,
  emailStatusChange: true,
  emailExpiry: true,
  push: false,
};

export default function SettingsScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { user, refreshUser, logout } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [notificationPrefsLoaded, setNotificationPrefsLoaded] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');

  const { data: authUser, isLoading, refetch } = useQuery<AuthUser>({
    queryKey: ['auth-user'],
    queryFn: async () => (await api.get('/api/mobile/auth/me')).data,
    enabled: !!user,
  });

  useEffect(() => {
    let active = true;

    api.get('/api/users/preferences')
      .then((prefsRes) => {
        if (!active) return;
        setNotificationPrefs({
          emailNewOffer: typeof prefsRes?.data?.emailNewOffer === 'boolean' ? prefsRes.data.emailNewOffer : defaultNotificationPrefs.emailNewOffer,
          emailStatusChange: typeof prefsRes?.data?.emailStatusChange === 'boolean' ? prefsRes.data.emailStatusChange : defaultNotificationPrefs.emailStatusChange,
          emailExpiry: typeof prefsRes?.data?.emailExpiry === 'boolean' ? prefsRes.data.emailExpiry : defaultNotificationPrefs.emailExpiry,
          push: typeof prefsRes?.data?.push === 'boolean' ? prefsRes.data.push : defaultNotificationPrefs.push,
        });
      })
      .catch(() => {
        if (!active) return;
        setNotificationPrefs(defaultNotificationPrefs);
      })
      .finally(() => {
        if (active) {
          setNotificationPrefsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notificationPrefsLoaded || !user?.id) return;

    syncPushPreference(notificationPrefs.push).catch(() => {
      // Preference save stays local even if device registration cannot complete right now.
    });
  }, [notificationPrefs.push, notificationPrefsLoaded, user?.id]);

  async function handleNotificationToggle(key: keyof NotificationPrefs, value: boolean) {
    const previous = notificationPrefs;
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));

    try {
      const { data } = await api.patch('/api/users/preferences', {
        [key]: value,
      });

      setNotificationPrefs({
        emailNewOffer: Boolean(data.emailNewOffer),
        emailStatusChange: Boolean(data.emailStatusChange),
        emailExpiry: Boolean(data.emailExpiry),
        push: Boolean(data.push),
      });
    } catch (error: any) {
      setNotificationPrefs(previous);
      Alert.alert('Hata', error?.response?.data?.error || 'Bildirim tercihi kaydedilemedi.');
    }
  }

  useEffect(() => {
    if (!authUser) return;
    setName(authUser.name || '');
    setPhone(authUser.phone || '');
    setBio(authUser.bio || '');
    setCity(authUser.city || '');
    setCompanyName(authUser.companyName || '');
    setTaxNumber(authUser.taxNumber || '');
    setImage(authUser.image || null);
  }, [authUser]);

  useEffect(() => {
    if (section === 'password') {
      setPasswordModalOpen(true);
    }
    if (section === 'deactivate') {
      setDeactivateModalOpen(true);
    }
  }, [section]);

  const saveProfile = useMutation({
    mutationFn: async () => (await api.patch(`/api/users/${user?.id}`, {
      name: name.trim(),
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      city: city.trim() || null,
      companyName: companyName.trim() || null,
      taxNumber: taxNumber.trim() || null,
      image,
    })).data,
    onSuccess: async () => {
      await refreshUser();
      await refetch();
      qc.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      Alert.alert('Kaydedildi', 'Profil bilgileriniz güncellendi.');
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Bilgiler kaydedilemedi.');
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => (await api.post('/api/users/change-password', {
      currentPassword,
      newPassword,
    })).data,
    onSuccess: () => {
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Şifre Güncellendi', 'Yeni şifren kaydedildi.');
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Şifre değiştirilemedi.');
    },
  });

  const deactivateAccount = useMutation({
    mutationFn: async () => (await api.post('/api/users/deactivate', {
      currentPassword: deactivatePassword,
    })).data,
    onSuccess: () => {
      setDeactivateModalOpen(false);
      setDeactivatePassword('');
      Alert.alert(
        'Hesap Kapatıldı',
        'Hesabın devre dışı bırakıldı. Tekrar giriş için yönetici desteği gerekiyor.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              void logout();
            },
          },
        ],
        { cancelable: false },
      );
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Hesap kapatılamadı.');
    },
  });

  async function handleAvatarPick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Profil fotoğrafı seçmek için galeri izni vermelisin.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('files', {
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    } as any);

    try {
      const { data } = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = data.urls[0];
      setImage(uploadedUrl);
      await api.patch(`/api/users/${user?.id}`, { image: uploadedUrl });
      await refreshUser();
      qc.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      Alert.alert('Güncellendi', 'Profil fotoğrafınız yenilendi.');
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.error || 'Fotoğraf yüklenemedi.');
    }
  }

  function handlePasswordSubmit() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm şifre alanlarını doldurun.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Geçersiz şifre', 'Yeni şifre en az 8 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Uyuşmuyor', 'Yeni şifre alanları birbiriyle eşleşmiyor.');
      return;
    }
    changePassword.mutate();
  }

  function handleDeactivateSubmit() {
    if (!deactivatePassword.trim()) {
      Alert.alert('Eksik bilgi', 'Hesabı kapatmak için mevcut şifreni girmen gerekiyor.');
      return;
    }

    deactivateAccount.mutate();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="settings-outline"
            title="Ayarlar yüklenemedi"
            subtitle="Oturum bilgisi güncellenemediği için ayarlar ekranı açılmadı."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profil Fotoğrafı</Text>
          <View style={styles.avatarRow}>
            <Avatar name={name || authUser.name} image={image} size="lg" verified={authUser.verified} />
            <View style={{ flex: 1 }}>
              <Text style={styles.avatarName}>{name || authUser.name}</Text>
              <Text style={styles.avatarHint}>Hesabında görünen fotoğraf ve temel görünüm bilgisi.</Text>
            </View>
            <TouchableOpacity style={styles.avatarAction} onPress={handleAvatarPick} activeOpacity={0.85}>
              <Ionicons name="camera-outline" size={18} color={colors.accent.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          <View style={styles.formGrid}>
            <Input label="Ad Soyad" value={name} onChangeText={setName} />
            <Input label="E-posta" value={authUser.email} editable={false} />
            <Input label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Şehir" value={city} onChangeText={setCity} />
            <View style={styles.textareaWrap}>
              <Text style={styles.fieldLabel}>Hakkımda</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Kendinizden kısaca bahsedin"
                placeholderTextColor={colors.textTertiary}
                multiline
                style={styles.textarea}
                selectionColor={colors.accent.DEFAULT}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Şirket Bilgileri</Text>
          <View style={styles.formGrid}>
            <Input label="Şirket Adı" value={companyName} onChangeText={setCompanyName} />
            <Input label="Vergi Numarası" value={taxNumber} onChangeText={setTaxNumber} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bildirim Tercihleri</Text>
          {[
            {
              key: 'emailNewOffer' as const,
              title: 'Yeni teklif geldiğinde',
              description: 'İlanlarına teklif geldiğinde mobil tercihini burada tut.',
            },
            {
              key: 'emailStatusChange' as const,
              title: 'Teklif durumu değiştiğinde',
              description: 'Kabul, red ve karşı teklif hareketlerini takip et.',
            },
            {
              key: 'emailExpiry' as const,
              title: 'İlan süresi dolarken',
              description: 'Süresi yaklaşan ilanlar için hatırlatma sakla.',
            },
            {
              key: 'push' as const,
              title: 'Mobil push bildirimleri',
              description: 'Tarayıcı push yok. Bu ayar yalnızca mobil cihaz bildirim teslimatını kontrol eder.',
            },
          ].map((item, index, arr) => (
            <View
              key={item.key}
              style={[styles.preferenceRow, index < arr.length - 1 && styles.preferenceBorder]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitle}>{item.title}</Text>
                <Text style={styles.preferenceText}>{item.description}</Text>
              </View>
              <Switch
                value={notificationPrefs[item.key]}
                onValueChange={(value) => handleNotificationToggle(item.key, value)}
                trackColor={{ false: colors.border, true: colors.accent.DEFAULT }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Güvenlik</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => setPasswordModalOpen(true)} activeOpacity={0.85}>
            <View style={styles.actionIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.accent.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Şifre Değiştir</Text>
              <Text style={styles.actionText}>Hesap güvenliği için mevcut şifreni güncelle.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.85}
            onPress={() => {
              setDeactivatePassword('');
              setDeactivateModalOpen(true);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.error.DEFAULT + '18' }]}>
              <Ionicons name="trash-outline" size={18} color={colors.error.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.error.DEFAULT }]}>Hesabı Kapat</Text>
              <Text style={styles.actionText}>Hesabın devre dışı bırakılır ve yeniden açma işlemi şu an yönetici desteği gerektirir.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Button
          title="Değişiklikleri Kaydet"
          onPress={() => saveProfile.mutate()}
          loading={saveProfile.isPending}
          icon={<Ionicons name="save-outline" size={16} color={colors.white} />}
          fullWidth
        />
      </ScrollView>

      <Modal visible={passwordModalOpen} transparent animationType="fade" onRequestClose={() => setPasswordModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPasswordModalOpen(false)}>
          <Pressable style={styles.passwordCard}>
            <Text style={styles.passwordTitle}>Şifre Değiştir</Text>
            <Input label="Mevcut Şifre" value={currentPassword} onChangeText={setCurrentPassword} isPassword />
            <Input label="Yeni Şifre" value={newPassword} onChangeText={setNewPassword} isPassword />
            <Input label="Yeni Şifre (Tekrar)" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />
            <View style={styles.passwordActions}>
              <Button
                title="İptal"
                variant="secondary"
                onPress={() => setPasswordModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Güncelle"
                onPress={handlePasswordSubmit}
                loading={changePassword.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={deactivateModalOpen} transparent animationType="fade" onRequestClose={() => setDeactivateModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setDeactivateModalOpen(false)}>
          <Pressable style={[styles.passwordCard, styles.dangerCard]}>
            <View style={styles.dangerHeader}>
              <View style={styles.dangerIcon}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passwordTitle}>Hesabı Kapat</Text>
                <Text style={styles.dangerText}>Bu işlem hesabı silmez; devre dışı bırakır ve mevcut oturumu kapatır.</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                İçeriklerin korunur ancak tekrar erişmek için şu an yönetici desteği gerekir.
              </Text>
            </View>

            <Input
              label="Mevcut Şifre"
              value={deactivatePassword}
              onChangeText={setDeactivatePassword}
              isPassword
            />

            <View style={styles.passwordActions}>
              <Button
                title="Vazgeç"
                variant="secondary"
                onPress={() => {
                  setDeactivateModalOpen(false);
                  setDeactivatePassword('');
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Hesabı Kapat"
                variant="destructive"
                onPress={handleDeactivateSubmit}
                loading={deactivateAccount.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: 120, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  sectionTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatarName: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  avatarHint: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  avatarAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.lighter,
  },
  formGrid: { gap: space.md },
  fieldLabel: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textPrimary, marginBottom: 6 },
  textareaWrap: { gap: 4 },
  textarea: {
    minHeight: 110,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 4 },
  preferenceBorder: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: space.md },
  preferenceTitle: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  preferenceText: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.lighter,
  },
  actionTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  actionText: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: space.lg },
  passwordCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  passwordTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  passwordActions: { flexDirection: 'row', gap: space.sm },
  dangerCard: {
    borderColor: colors.error.DEFAULT + '26',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  dangerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error.DEFAULT + '14',
  },
  dangerText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
  },
  warningBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error.DEFAULT + '24',
    backgroundColor: colors.error.DEFAULT + '10',
    padding: space.md,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.medium,
    color: colors.error.DEFAULT,
  },
});
