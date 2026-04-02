import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';
import { fontFamily, space, borderRadius } from '../../src/theme';

const roleLabels: Record<string, string> = {
  buyer: 'Alıcı',
  seller: 'Satıcı',
  both: 'Alıcı & Satıcı',
};

const badgeColors: Record<string, string> = {
  basic: '#3b82f6',
  plus: '#8b5cf6',
  pro: '#f59e0b',
};

const badgeLabels: Record<string, string> = {
  basic: 'Basic',
  plus: 'Plus',
  pro: 'Pro',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function openSupport() {
    Linking.openURL('mailto:destek@talepsat.com?subject=TalepSat%20Mobil%20Destek').catch(() => {
      Alert.alert('Hata', 'Destek adresi açılamadı.');
    });
  }

  function handleLogout() {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <Text style={styles.headerSubtitle}>Hesabını, favorilerini ve yasal alanları buradan yönet.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {user.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabels[user.role] || user.role}</Text>
            </View>
            {user.badge && (
              <View style={[styles.planBadge, { backgroundColor: badgeColors[user.badge] + '24' }]}>
                <Text style={[styles.planBadgeText, { color: badgeColors[user.badge] }]}>
                  {badgeLabels[user.badge]}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.score?.toFixed(1) ?? '0.0'}</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.completedDeals ?? 0}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            {user.city && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue} numberOfLines={1}>{user.city}</Text>
                  <Text style={styles.statLabel}>Şehir</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Kısayollar</Text>
        <View style={styles.menuSection}>
          <MenuItem icon="grid-outline" label="Alıcı Paneli" onPress={() => router.push('/dashboard' as any)} colors={colors} />
          <MenuItem icon="document-text-outline" label="İlanlarım" onPress={() => router.push('/my-listings' as any)} colors={colors} />
          <MenuItem icon="heart-outline" label="Favorilerim" onPress={() => router.push('/saved' as any)} colors={colors} />
          <MenuItem icon="cube-outline" label="Siparişlerim" onPress={() => router.push('/orders' as any)} colors={colors} />
          <MenuItem icon="notifications-outline" label="Bildirimler" onPress={() => router.push('/notifications' as any)} colors={colors} />
          <MenuItem icon="diamond-outline" label="Planlar" onPress={() => router.push('/plans' as any)} colors={colors} />
          <MenuItem icon="card-outline" label="Abonelik" onPress={() => router.push('/subscription' as any)} colors={colors} />
          {(user.role === 'seller' || user.role === 'both') && (
            <MenuItem icon="speedometer-outline" label="Satıcı Paneli" onPress={() => router.push('/seller-dashboard' as any)} colors={colors} />
          )}
          <MenuItem
            icon="person-outline"
            label="Profili Düzenle"
            onPress={() => router.push({ pathname: '/settings', params: { section: 'profile' } } as any)}
            colors={colors}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Şifre Değiştir"
            onPress={() => router.push({ pathname: '/settings', params: { section: 'password' } } as any)}
            colors={colors}
          />
          <MenuItem icon="settings-outline" label="Ayarlar" onPress={() => router.push('/settings' as any)} colors={colors} last />
        </View>

        <Text style={styles.sectionLabel}>Görünüm</Text>
        <View style={styles.menuSection}>
          <View style={styles.switchRow}>
            <View style={styles.menuIconWrap}>
              <Ionicons
                name={isDark ? 'moon-outline' : 'sunny-outline'}
                size={20}
                color={colors.primary.DEFAULT}
              />
            </View>
            <View style={styles.menuItemCenter}>
              <Text style={styles.menuLabel}>Karanlık Mod</Text>
              <Text style={styles.menuSub}>{isDark ? 'Açık' : 'Kapalı'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary.DEFAULT }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Yardım ve Yasal</Text>
        <View style={styles.menuSection}>
          <MenuItem icon="help-circle-outline" label="Yardım & Destek" onPress={openSupport} colors={colors} />
          <MenuItem icon="document-text-outline" label="Kullanım Şartları" onPress={() => router.push('/terms' as any)} colors={colors} />
          <MenuItem icon="shield-outline" label="Gizlilik Politikası" onPress={() => router.push('/privacy' as any)} colors={colors} />
          <MenuItem icon="document-lock-outline" label="KVKK Aydınlatma" onPress={() => router.push('/kvkk' as any)} colors={colors} />
          <MenuItem icon="albums-outline" label="Çerez Politikası" onPress={() => router.push('/cookies' as any)} colors={colors} last />
        </View>

        <Text style={styles.version}>TalepSat v1.0.0</Text>

        <Button
          title="Çıkış Yap"
          variant="destructive"
          onPress={handleLogout}
          loading={loggingOut}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  last,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: colors.border,
          gap: space.md,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={{
        width: 36,
        height: 36,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primary.lighter,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      }}
      >
        <Ionicons name={icon} size={20} color={colors.primary.DEFAULT} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontFamily: fontFamily.medium, color: colors.textPrimary }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: space.lg, paddingBottom: 100, paddingTop: space.md },
  header: { marginBottom: space.lg },
  headerTitle: { fontSize: 26, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  headerSubtitle: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.lg,
  },
  avatarWrap: { position: 'relative', marginBottom: space.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontFamily: fontFamily.extraBold, color: colors.white },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: { fontSize: 20, fontFamily: fontFamily.extraBold, color: colors.textPrimary, marginBottom: 4 },
  email: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, marginBottom: space.md },
  badgesRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  roleBadge: {
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.primary.DEFAULT },
  planBadge: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  planBadgeText: { fontSize: 12, fontFamily: fontFamily.bold },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.md,
    padding: space.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  statLabel: { fontSize: 11, fontFamily: fontFamily.regular, color: colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: space.sm,
    marginTop: space.md,
    paddingHorizontal: 2,
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: space.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemCenter: { flex: 1 },
  menuLabel: { fontSize: 15, fontFamily: fontFamily.medium, color: colors.textPrimary },
  menuSub: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary, marginTop: 1 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
    marginVertical: space.lg,
  },
});
