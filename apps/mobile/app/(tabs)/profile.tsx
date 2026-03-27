import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/Button';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

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
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
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
  };

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {user.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
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
              <View style={[styles.planBadge, { backgroundColor: badgeColors[user.badge] + '30' }]}>
                <Text style={[styles.planBadgeText, { color: badgeColors[user.badge] }]}>
                  {badgeLabels[user.badge]}
                </Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.score.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.completedDeals}</Text>
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

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem icon="person-outline" label="Profili Düzenle" onPress={() => {}} />
          <MenuItem icon="lock-closed-outline" label="Şifre Değiştir" onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Bildirimler" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Yardım & Destek" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Kullanım Şartları" onPress={() => {}} />
          <MenuItem icon="shield-outline" label="Gizlilik Politikası" onPress={() => {}} />
        </View>

        {/* App Version */}
        <Text style={styles.version}>TalepSat v1.0.0</Text>

        {/* Logout */}
        <Button
          title="Çıkış Yap"
          variant="danger"
          onPress={handleLogout}
          loading={loggingOut}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.lg },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.white },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surface,
  },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md },
  badgesRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  planBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  planBadgeText: { fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.text },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.lg },
  logoutBtn: { marginHorizontal: 0 },
});
