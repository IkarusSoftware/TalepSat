import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../src/lib/api';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Button } from '../src/components/ui';
import { Order } from '../src/types';
import { borderRadius, fontFamily, space } from '../src/theme';

type OrderTab = 'buyer' | 'seller' | 'completed';

function formatPrice(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Az once';
  if (mins < 60) return `${mins} dk once`;
  if (hours < 24) return `${hours} sa once`;
  return `${days} g once`;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<OrderTab>('buyer');
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders');
      return data;
    },
    enabled: !!user,
  });

  const confirmDelivery = useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.patch(`/api/offers/${orderId}`, { action: 'confirm' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer-detail'] });
    },
  });

  const counts = useMemo(() => ({
    buyer: orders.filter((order) => order.isBuyer).length,
    seller: orders.filter((order) => !order.isBuyer).length,
    completed: orders.filter((order) => order.status === 'completed').length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    if (tab === 'buyer') return orders.filter((order) => order.isBuyer);
    if (tab === 'seller') return orders.filter((order) => !order.isBuyer);
    return orders.filter((order) => order.status === 'completed');
  }, [orders, tab]);

  const tabs: { key: OrderTab; label: string }[] = [
    { key: 'buyer', label: 'Aldiklarim' },
    { key: 'seller', label: 'Sattiklarim' },
    { key: 'completed', label: 'Tamamlanan' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Siparislerim</Text>
        <Text style={styles.headerSubtitle}>Kabul edilen teklifleri ve tamamlanan siparisleri buradan yonet</Text>
      </View>

      <View style={styles.tabsRow}>
        {tabs.map((item) => {
          const active = item.key === tab;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(item.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {item.label} {counts[item.key] > 0 ? `(${counts[item.key]})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
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
          {filteredOrders.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cube-outline" size={30} color={colors.accent.DEFAULT} />
              </View>
              <Text style={styles.emptyTitle}>Bu alanda siparis yok</Text>
              <Text style={styles.emptyText}>Bir teklif kabul edildiginde veya tamamlandiginda burada gorunecek.</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const myConfirmed = order.isBuyer ? order.buyerConfirmed : order.sellerConfirmed;
              const otherConfirmed = order.isBuyer ? order.sellerConfirmed : order.buyerConfirmed;
              const needsConfirmation = order.status === 'accepted' && !myConfirmed;
              const counterpartRole = order.isBuyer ? 'Satici' : 'Alici';
              const counterpartName = order.isBuyer ? order.sellerName : order.buyerName;
              const reviewSummary = order.hasMyReview
                ? `${order.myReviewRating || 0}/5 puan verdin`
                : 'Henuz puan vermedin';

              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => router.push(`/offer/${order.id}` as any)}
                >
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, order.status === 'completed' ? styles.statusCompleted : styles.statusActive]}>
                      <Text style={[styles.statusText, order.status === 'completed' ? styles.statusTextCompleted : styles.statusTextActive]}>
                        {order.status === 'completed' ? 'Tamamlandi' : 'Aktif'}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{timeAgo(order.updatedAt || order.completedAt || order.createdAt)}</Text>
                  </View>

                  <Text style={styles.listingTitle}>{order.listingTitle}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{order.listingCategory}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{order.listingCity}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{order.deliveryDays} gun teslimat</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.counterpartCard}
                    activeOpacity={0.88}
                    onPress={() => {
                      const userId = order.isBuyer ? order.sellerId : order.buyerId;
                      if (userId) router.push(`/user/${userId}` as any);
                    }}
                  >
                    <View style={styles.counterpartAvatar}>
                      <Text style={styles.counterpartInitials}>{initialsOf(counterpartName || '?')}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.counterpartRole}>{counterpartRole}</Text>
                      <Text style={styles.counterpartName}>{counterpartName}</Text>
                    </View>
                    <Text style={styles.price}>{formatPrice(order.price)}</Text>
                  </TouchableOpacity>

                  <View style={styles.confirmationRow}>
                    <View style={styles.confirmItem}>
                      <Ionicons
                        name={order.buyerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={order.buyerConfirmed ? colors.success.DEFAULT : colors.textTertiary}
                      />
                      <Text style={styles.confirmText}>Alici {order.buyerConfirmed ? 'onayladi' : 'bekliyor'}</Text>
                    </View>
                    <View style={styles.confirmItem}>
                      <Ionicons
                        name={order.sellerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={order.sellerConfirmed ? colors.success.DEFAULT : colors.textTertiary}
                      />
                      <Text style={styles.confirmText}>Satici {order.sellerConfirmed ? 'onayladi' : 'bekliyor'}</Text>
                    </View>
                  </View>

                  {order.status === 'completed' && (
                    <View style={styles.reviewBox}>
                      <Ionicons
                        name={order.hasMyReview ? 'star' : 'star-outline'}
                        size={15}
                        color={order.hasMyReview ? colors.warning.DEFAULT : colors.textTertiary}
                      />
                      <Text style={[styles.reviewText, order.hasMyReview && { color: colors.warning.DEFAULT }]}>
                        {reviewSummary}
                      </Text>
                      {(order.totalReviews || 0) > 0 && (
                        <Text style={styles.reviewCount}>({order.totalReviews} degerlendirme)</Text>
                      )}
                    </View>
                  )}

                  {needsConfirmation && (
                    <View style={styles.alertBox}>
                      <Ionicons name="alert-circle-outline" size={16} color={colors.accent.DEFAULT} />
                      <Text style={styles.alertText}>
                        {otherConfirmed ? 'Karsi taraf onayladi, simdi sira sende.' : 'Teslimat tamamlandiysa sen de onaylayabilirsin.'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.actions}>
                    {needsConfirmation ? (
                      <Button
                        title="Teslimati Onayla"
                        onPress={() => confirmDelivery.mutate(order.id)}
                        loading={confirmDelivery.isPending && confirmDelivery.variables === order.id}
                        icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />}
                        style={{ flex: 1 }}
                      />
                    ) : order.status === 'completed' && !order.hasMyReview ? (
                      <Button
                        title="Puan Ver"
                        onPress={() => router.push(`/offer/${order.id}` as any)}
                        icon={<Ionicons name="star-outline" size={16} color={colors.white} />}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}

                    <Button
                      title="Detay"
                      variant="secondary"
                      onPress={() => router.push(`/offer/${order.id}` as any)}
                      style={{ flex: 1 }}
                    />
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
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md },
  headerTitle: { fontSize: 24, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  headerSubtitle: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  tabsRow: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginBottom: space.md },
  tab: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent.lighter,
    borderWidth: 1,
    borderColor: colors.accent.DEFAULT + '22',
  },
  tabText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.textSecondary },
  tabTextActive: { color: colors.accent.DEFAULT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.lg, paddingBottom: 120, gap: space.md },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.lighter,
    marginBottom: space.md,
  },
  emptyTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusActive: { backgroundColor: colors.warning.light },
  statusCompleted: { backgroundColor: colors.success.light },
  statusText: { fontSize: 11, fontFamily: fontFamily.bold },
  statusTextActive: { color: colors.warning.DEFAULT },
  statusTextCompleted: { color: colors.success.DEFAULT },
  dateText: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  listingTitle: { fontSize: 17, fontFamily: fontFamily.bold, color: colors.textPrimary, lineHeight: 23 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaText: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary },
  metaDot: { fontSize: 14, color: colors.textTertiary },
  counterpartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  counterpartAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lighter,
  },
  counterpartInitials: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.primary.DEFAULT },
  counterpartRole: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textTertiary, textTransform: 'uppercase' },
  counterpartName: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary, marginTop: 2 },
  price: { fontSize: 18, fontFamily: fontFamily.extraBold, color: colors.accent.DEFAULT },
  confirmationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingTop: 2 },
  confirmItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary },
  reviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  reviewText: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  reviewCount: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.lighter,
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: fontFamily.medium, color: colors.accent.DEFAULT, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: 2 },
});
