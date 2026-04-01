import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { SearchBar } from '../../src/components/ui';
import { Conversation } from '../../src/types';
import { fontFamily, space, borderRadius } from '../../src/theme';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk`;
  if (hours < 24) return `${hours}sa`;
  return `${days}g`;
}

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 60000;
}

const avatarPalette = [
  { bg: '#10b981', text: '#ecfdf5' },
  { bg: '#3b82f6', text: '#eff6ff' },
  { bg: '#8b5cf6', text: '#f5f3ff' },
  { bg: '#ef4444', text: '#fef2f2' },
  { bg: '#f59e0b', text: '#fffbeb' },
  { bg: '#06b6d4', text: '#ecfeff' },
];

function getAvatarColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const { data: conversations = [], isLoading, refetch } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/api/conversations');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 6000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!user) return;
    const ping = () => api.post('/api/users/heartbeat').catch(() => {});
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) =>
      conv.participantName.toLowerCase().includes(q) ||
      (conv.listingTitle || '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    [conversations]
  );

  async function handleManualRefresh() {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  }

  const renderItem = ({ item: conv }: { item: Conversation }) => {
    const avatar = getAvatarColors(conv.participantName);
    const hasAcceptedOrder = conv.acceptedOfferId && conv.acceptedOfferStatus === 'accepted';
    const hasCompletedOrder = conv.acceptedOfferId && conv.acceptedOfferStatus === 'completed';

    return (
      <TouchableOpacity
        style={styles.convRow}
        activeOpacity={0.75}
        onPress={() => router.push(`/conversation/${conv.id}` as any)}
      >
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Text style={[styles.avatarText, { color: avatar.text }]}>{conv.participantInitials}</Text>
          {conv.unreadCount > 0 && (
            <View style={styles.avatarUnread}>
              <Text style={styles.avatarUnreadText}>{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</Text>
            </View>
          )}
          {isOnline(conv.participantLastSeen) && conv.unreadCount === 0 && (
            <View style={styles.onlineDot} />
          )}
        </View>

        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <View style={styles.nameWrap}>
              <Text style={styles.convName} numberOfLines={1}>{conv.participantName}</Text>
              {conv.participantVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.success.DEFAULT} />
              )}
              {conv.muted && (
                <Ionicons name="volume-mute-outline" size={14} color={colors.textTertiary} />
              )}
            </View>
            <Text style={[styles.convTime, conv.unreadCount > 0 && styles.convTimeUnread]}>
              {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
            </Text>
          </View>

          {conv.listingTitle && (
            <Text style={styles.convListing} numberOfLines={1}>{conv.listingTitle}</Text>
          )}

          <Text style={[styles.convLast, conv.unreadCount > 0 && styles.convLastUnread]} numberOfLines={1}>
            {conv.lastMessage || 'Henüz mesaj yok'}
          </Text>

          {(hasAcceptedOrder || hasCompletedOrder) && (
            <View style={styles.orderChip}>
              <Ionicons
                name={hasAcceptedOrder ? 'cube-outline' : 'star-outline'}
                size={12}
                color={hasAcceptedOrder ? colors.accent.DEFAULT : colors.warning.DEFAULT}
              />
              <Text
                style={[
                  styles.orderChipText,
                  { color: hasAcceptedOrder ? colors.accent.DEFAULT : colors.warning.DEFAULT },
                ]}
              >
                {hasAcceptedOrder ? 'Aktif sipariş var' : 'Tamamlanan sipariş var'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          activeOpacity={0.82}
          onPress={() => router.push(`/user/${conv.participantId}` as any)}
        >
          <Ionicons name="person-circle-outline" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <Text style={styles.headerSubtitle}>
          {totalUnread > 0 ? `${totalUnread} okunmamış mesaj` : 'Tüm konuşmaların burada'}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Kullanıcı veya ilan ara..." />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleManualRefresh} tintColor={colors.primary.DEFAULT} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.emptyText}>{search ? 'Konuşma bulunamadı' : 'Henüz mesajın yok'}</Text>
              <Text style={styles.emptySubtext}>
                {search ? 'Farklı bir arama deneyebilirsin.' : 'İlanlara teklif ver veya alıcılarla iletişime geç.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md },
  headerTitle: { fontSize: 24, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  headerSubtitle: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 3 },
  searchWrap: { paddingHorizontal: space.lg, paddingBottom: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 100 },
  convRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: space.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
  },
  avatarText: { fontSize: 16, fontFamily: fontFamily.bold },
  avatarUnread: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarUnreadText: { fontSize: 10, fontFamily: fontFamily.bold, color: colors.white },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success.DEFAULT,
    borderWidth: 2,
    borderColor: colors.background,
  },
  convContent: { flex: 1 },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, paddingRight: space.sm },
  convName: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.textPrimary, flexShrink: 1 },
  convTime: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  convTimeUnread: { color: colors.accent.DEFAULT, fontFamily: fontFamily.semiBold },
  convListing: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.primary.DEFAULT, marginBottom: 2 },
  convLast: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary },
  convLastUnread: { color: colors.textPrimary, fontFamily: fontFamily.semiBold },
  orderChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
  },
  orderChipText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.md,
  },
  emptyText: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: space.sm },
  emptySubtext: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
