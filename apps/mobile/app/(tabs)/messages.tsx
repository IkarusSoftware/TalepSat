import React from 'react';
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
import { colors, fontFamily, space, borderRadius } from '../../src/theme';

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

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: conversations = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/api/conversations');
      return res.data;
    },
    enabled: !!user,
  });

  const getOtherParticipant = (conv: any) => {
    const other = conv.participants?.find((p: any) => p.userId !== user?.id);
    return other?.user || { name: 'Bilinmeyen', id: '' };
  };

  const renderItem = ({ item: conv }: { item: any }) => {
    const other = getOtherParticipant(conv);
    const lastMsg = conv.messages?.[0];
    const unread = conv.participants?.find((p: any) => p.userId === user?.id)?.unreadCount || 0;
    const initials = other.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <TouchableOpacity
        style={styles.convRow}
        activeOpacity={0.75}
        onPress={() => router.push(`/conversation/${conv.id}` as any)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <Text style={styles.convName} numberOfLines={1}>{other.name}</Text>
            <Text style={styles.convTime}>{lastMsg ? timeAgo(lastMsg.createdAt) : ''}</Text>
          </View>
          {conv.listingTitle && (
            <Text style={styles.convListing} numberOfLines={1}>📋 {conv.listingTitle}</Text>
          )}
          <Text style={[styles.convLast, unread > 0 && styles.convLastUnread]} numberOfLines={1}>
            {lastMsg?.text || 'Henüz mesaj yok'}
          </Text>
        </View>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.emptyText}>Henüz mesajın yok</Text>
              <Text style={styles.emptySubtext}>
                İlanlara teklif ver veya alıcılarla iletişime geç
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 100 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: space.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.primary.light,
  },
  convContent: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  convName: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  convTime: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  convListing: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.primary.DEFAULT,
    marginBottom: 2,
  },
  convLast: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  convLastUnread: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: space.sm,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
