import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../src/lib/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { EmptyState } from '../src/components/ui';
import { Notification } from '../src/types';
import { borderRadius, fontFamily, space } from '../src/theme';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  if (days < 7) return `${days} g önce`;

  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
  });
}

function mapNotificationLink(link?: string | null) {
  if (!link) return null;
  if (link.startsWith('/listing/')) return link;
  if (link === '/orders') return '/orders';
  if (link.startsWith('/offers/')) return link.replace('/offers/', '/offer/');
  if (link.startsWith('/dashboard')) return '/(tabs)';
  return null;
}

function getNotificationMeta(type: string, colors: any) {
  switch (type) {
    case 'offer_received':
      return {
        icon: 'pricetag-outline' as const,
        bg: colors.accent.lighter,
        color: colors.accent.DEFAULT,
      };
    case 'offer_accepted':
    case 'offer_rejected':
    case 'counter_offer':
      return {
        icon: 'swap-horizontal-outline' as const,
        bg: colors.warning.light,
        color: colors.warning.DEFAULT,
      };
    case 'message':
      return {
        icon: 'chatbubble-ellipses-outline' as const,
        bg: colors.primary.lighter,
        color: colors.primary.DEFAULT,
      };
    default:
      return {
        icon: 'notifications-outline' as const,
        bg: colors.surfaceRaised,
        color: colors.textSecondary,
      };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/api/notifications');
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/api/notifications', { markAllRead: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch('/api/notifications', { id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handlePress = async (item: Notification) => {
    if (!item.read) {
      await markOneRead.mutateAsync(item.id);
    }

    const target = mapNotificationLink(item.link);
    if (target) {
      router.push(target as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bildirimler</Text>
          <Text style={styles.subtitle}>Teklif, sipariş ve sistem hareketlerini burada görürsün</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => markAllRead.mutate()}
            activeOpacity={0.8}
            disabled={markAllRead.isPending}
          >
            <Text style={styles.markAllText}>
              {markAllRead.isPending ? 'İşleniyor...' : 'Tümünü Okundu Yap'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.DEFAULT} />}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="notifications-off-outline"
                title="Henüz bildirim yok"
                subtitle="Yeni teklif, sipariş veya sistem hareketleri olduğunda burada görünecek."
              />
            </View>
          ) : (
            notifications.map((item) => {
              const meta = getNotificationMeta(item.type, colors);
              const target = mapNotificationLink(item.link);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, !item.read && styles.cardUnread]}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                  </View>

                  <View style={styles.body}>
                    <View style={styles.rowTop}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardText}>{item.description}</Text>
                    <View style={styles.footer}>
                      <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                      {target && (
                        <View style={styles.linkChip}>
                          <Text style={styles.linkChipText}>Detaya git</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  markAllButton: {
    marginTop: 2,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.lighter,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: 120,
    gap: space.md,
  },
  emptyWrap: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    borderColor: colors.accent.DEFAULT + '33',
    backgroundColor: colors.surfaceRaised,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.DEFAULT,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textTertiary,
  },
  linkChip: {
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.lighter,
  },
  linkChipText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.accent.DEFAULT,
  },
});
