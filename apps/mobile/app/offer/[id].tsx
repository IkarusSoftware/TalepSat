import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';
import { borderRadius, fontFamily, space } from '../../src/theme';

type OfferDetail = {
  id: string;
  price: number;
  deliveryDays: number;
  note: string | null;
  status: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  completedAt: string | null;
  createdAt: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    description: string;
    category: string;
    city: string;
    buyer: {
      id: string;
      name: string;
      score: number;
      verified: boolean;
    };
  };
  seller: {
    id: string;
    name: string;
    score: number;
    verified: boolean;
    badge: string | null;
    completedDeals: number;
    companyName: string | null;
    createdAt: string;
    city: string | null;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    reviewer: {
      id: string;
      name: string;
    };
  }>;
};

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

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: offer, isLoading, refetch, isRefetching } = useQuery<OfferDetail>({
    queryKey: ['offer-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/offers/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const confirmDelivery = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/api/offers/${id}`, { action: 'confirm' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/reviews', {
        offerId: id,
        rating,
        comment: comment.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      Alert.alert('Basarili', 'Degerlendirmen kaydedildi.');
      setComment('');
      setRating(0);
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Degerlendirme gonderilemedi.');
    },
  });

  if (isLoading || !offer) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  const isBuyer = offer.listing.buyer.id === user?.id;
  const isSeller = offer.seller.id === user?.id;
  const myConfirmed = isBuyer ? offer.buyerConfirmed : offer.sellerConfirmed;
  const otherConfirmed = isBuyer ? offer.sellerConfirmed : offer.buyerConfirmed;
  const needsConfirmation = offer.status === 'accepted' && !myConfirmed;
  const myReview = offer.reviews.find((review) => review.reviewer.id === user?.id);
  const otherParty = isBuyer
    ? {
        id: offer.seller.id,
        name: offer.seller.name,
        verified: offer.seller.verified,
        score: offer.seller.score,
        role: 'Satici',
      }
    : {
        id: offer.listing.buyer.id,
        name: offer.listing.buyer.name,
        verified: offer.listing.buyer.verified,
        score: offer.listing.buyer.score,
        role: 'Alici',
      };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.DEFAULT} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.statusBadge, offer.status === 'completed' ? styles.statusCompleted : styles.statusActive]}>
              <Text style={[styles.statusText, offer.status === 'completed' ? styles.statusTextCompleted : styles.statusTextActive]}>
                {offer.status === 'completed' ? 'Tamamlandi' : 'Aktif Siparis'}
              </Text>
            </View>
            <Text style={styles.heroDate}>{timeAgo(offer.completedAt || offer.createdAt)}</Text>
          </View>

          <Text style={styles.heroTitle}>{offer.listing.title}</Text>
          <Text style={styles.heroMeta}>{offer.listing.category} • {offer.listing.city}</Text>

          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Teklif Tutari</Text>
              <Text style={styles.statValue}>{formatPrice(offer.price)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Teslimat</Text>
              <Text style={styles.statValue}>{offer.deliveryDays} gun</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Karsi Taraf</Text>
          <View style={styles.partyCard}>
            <View style={styles.partyAvatar}>
              <Text style={styles.partyAvatarText}>{initialsOf(otherParty.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.partyNameRow}>
                <Text style={styles.partyName}>{otherParty.name}</Text>
                {otherParty.verified && (
                  <Ionicons name="checkmark-circle" size={15} color={colors.success.DEFAULT} />
                )}
              </View>
              <Text style={styles.partyMeta}>{otherParty.role} • {otherParty.score.toFixed(1)} puan</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Siparis Durumu</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusLine}>
              <Ionicons
                name={offer.buyerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={offer.buyerConfirmed ? colors.success.DEFAULT : colors.textTertiary}
              />
              <Text style={styles.statusLineText}>Alici {offer.buyerConfirmed ? 'onayladi' : 'bekliyor'}</Text>
            </View>
            <View style={styles.statusLine}>
              <Ionicons
                name={offer.sellerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={offer.sellerConfirmed ? colors.success.DEFAULT : colors.textTertiary}
              />
              <Text style={styles.statusLineText}>Satici {offer.sellerConfirmed ? 'onayladi' : 'bekliyor'}</Text>
            </View>

            {needsConfirmation && (
              <View style={styles.noticeBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.accent.DEFAULT} />
                <Text style={styles.noticeText}>
                  {otherConfirmed ? 'Karsi taraf teslimati onayladi. Simdi sira sende.' : 'Teslimat tamamlandiysa bu ekrandan onaylayabilirsin.'}
                </Text>
              </View>
            )}

            {needsConfirmation && (
              <Button
                title="Teslimati Onayla"
                onPress={() => confirmDelivery.mutate()}
                loading={confirmDelivery.isPending}
                icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />}
                fullWidth
              />
            )}
          </View>
        </View>

        {!!offer.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teklif Notu</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{offer.note}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ilan Aciklamasi</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{offer.listing.description}</Text>
          </View>
        </View>

        {offer.status === 'completed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Degerlendirme</Text>

            {myReview ? (
              <View style={styles.reviewCard}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Ionicons
                      key={value}
                      name={value <= myReview.rating ? 'star' : 'star-outline'}
                      size={18}
                      color={colors.warning.DEFAULT}
                    />
                  ))}
                </View>
                <Text style={styles.reviewDoneText}>Bu siparisi degerlendirdin</Text>
                {!!myReview.comment && <Text style={styles.reviewComment}>{myReview.comment}</Text>}
              </View>
            ) : (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewPrompt}>Karsi tarafi puanla</Text>
                <View style={styles.starSelector}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setRating(value)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={value <= rating ? 'star' : 'star-outline'}
                        size={28}
                        color={colors.warning.DEFAULT}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Istersen kisa bir yorum da ekleyebilirsin"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={styles.commentInput}
                  selectionColor={colors.accent.DEFAULT}
                />
                <Button
                  title="Puani Gonder"
                  onPress={() => submitReview.mutate()}
                  disabled={rating === 0}
                  loading={submitReview.isPending}
                  icon={<Ionicons name="star-outline" size={16} color={colors.white} />}
                  fullWidth
                />
              </View>
            )}

            {offer.reviews.length > 0 && (
              <View style={styles.reviewList}>
                {offer.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewItemTop}>
                      <Text style={styles.reviewItemName}>{review.reviewer.name}</Text>
                      <View style={styles.reviewItemStars}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Ionicons
                            key={value}
                            name={value <= review.rating ? 'star' : 'star-outline'}
                            size={13}
                            color={colors.warning.DEFAULT}
                          />
                        ))}
                      </View>
                    </View>
                    {!!review.comment && <Text style={styles.reviewItemComment}>{review.comment}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.footerActions}>
          <Button
            title="Ilana Git"
            variant="secondary"
            onPress={() => router.push(`/listing/${offer.listing.id}` as any)}
            style={{ flex: 1 }}
          />
          <Button
            title="Siparislere Don"
            onPress={() => router.push('/orders' as any)}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, paddingBottom: 120, gap: space.md },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusActive: { backgroundColor: colors.warning.light },
  statusCompleted: { backgroundColor: colors.success.light },
  statusText: { fontSize: 11, fontFamily: fontFamily.bold },
  statusTextActive: { color: colors.warning.DEFAULT },
  statusTextCompleted: { color: colors.success.DEFAULT },
  heroDate: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textTertiary },
  heroTitle: { fontSize: 22, fontFamily: fontFamily.extraBold, color: colors.textPrimary, lineHeight: 30 },
  heroMeta: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textSecondary },
  heroStats: { flexDirection: 'row', gap: space.sm },
  statCard: {
    flex: 1,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceRaised,
  },
  statLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textTertiary, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  section: { gap: space.sm },
  sectionTitle: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.textPrimary },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  partyAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lighter,
  },
  partyAvatarText: { fontSize: 16, fontFamily: fontFamily.bold, color: colors.primary.DEFAULT },
  partyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partyName: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  partyMeta: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLineText: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textPrimary },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: space.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.lighter,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: fontFamily.medium, color: colors.accent.DEFAULT },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  noteText: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  starRow: { flexDirection: 'row', gap: 4 },
  reviewDoneText: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.warning.DEFAULT },
  reviewComment: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  reviewPrompt: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  starSelector: { flexDirection: 'row', gap: 8 },
  commentInput: {
    minHeight: 110,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  reviewList: { gap: space.sm },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 6,
  },
  reviewItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  reviewItemName: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  reviewItemStars: { flexDirection: 'row', gap: 2 },
  reviewItemComment: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.regular, color: colors.textSecondary },
  footerActions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});
