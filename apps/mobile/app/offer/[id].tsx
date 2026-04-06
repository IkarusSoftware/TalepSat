import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';
import { getOfferActionState } from '../../src/features/offer-actions';
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
  updatedAt: string;
  listingId: string;
  counterPrice?: number | null;
  counterDays?: number | null;
  counterNote?: string | null;
  rejectedReason?: string | null;
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

  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} g önce`;
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editNote, setEditNote] = useState('');

  const { data: offer, isLoading, refetch, isRefetching } = useQuery<OfferDetail>({
    queryKey: ['offer-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/offers/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      rejectedReason,
      price,
      deliveryDays,
      note,
    }: {
      action: 'confirm' | 'withdraw' | 'accept' | 'reject' | 'edit';
      rejectedReason?: string;
      price?: number;
      deliveryDays?: number;
      note?: string;
    }) => {
      const payload: Record<string, unknown> = { action };
      if (rejectedReason) payload.rejectedReason = rejectedReason;
      if (typeof price === 'number') payload.price = price;
      if (typeof deliveryDays === 'number') payload.deliveryDays = deliveryDays;
      if (note !== undefined) payload.note = note;
      const { data } = await api.patch(`/api/offers/${id}`, payload);
      return data;
    },
    onSuccess: async (_data, variables) => {
      if (variables.action === 'edit') {
        setEditModalOpen(false);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['offer-detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['my-offers'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['offers'] }),
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Teklif işlemi tamamlanamadı.');
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
      Alert.alert('Başarılı', 'Değerlendirmen kaydedildi.');
      setComment('');
      setRating(0);
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      Alert.alert('Hata', error?.response?.data?.error || 'Değerlendirme gönderilemedi.');
    },
  });

  useEffect(() => {
    if (!offer || !editModalOpen) return;
    setEditPrice(String(offer.price));
    setEditDays(String(offer.deliveryDays));
    setEditNote(offer.note || '');
  }, [editModalOpen, offer]);

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
  const myReview = offer.reviews.find((review) => review.reviewer.id === user?.id);
  const actionState = getOfferActionState({
    status: offer.status,
    isSeller,
    isBuyer,
    myConfirmed,
  });

  const statusConfig = {
    pending: { label: 'Bekliyor', bg: colors.warning.light, color: colors.warning.DEFAULT },
    accepted: { label: 'Kabul Edildi', bg: colors.success.light, color: colors.success.DEFAULT },
    rejected: { label: 'Reddedildi', bg: colors.error.light, color: colors.error.DEFAULT },
    counter_offered: { label: 'Karşı Teklif', bg: colors.primary.lighter, color: colors.primary.DEFAULT },
    withdrawn: { label: 'Geri Çekildi', bg: colors.surfaceRaised, color: colors.textSecondary },
    completed: { label: 'Tamamlandı', bg: colors.success.light, color: colors.success.DEFAULT },
  }[offer.status] || { label: offer.status, bg: colors.surfaceRaised, color: colors.textSecondary };

  const otherParty = isBuyer
    ? {
        id: offer.seller.id,
        name: offer.seller.name,
        verified: offer.seller.verified,
        score: offer.seller.score,
        role: 'Satıcı',
      }
    : {
        id: offer.listing.buyer.id,
        name: offer.listing.buyer.name,
        verified: offer.listing.buyer.verified,
        score: offer.listing.buyer.score,
        role: 'Alıcı',
      };

  function confirmAction(action: 'withdraw' | 'accept' | 'reject' | 'confirm') {
    const copy = {
      withdraw: {
        title: 'Teklifi geri çek',
        message: 'Bu teklifi geri çekmek istediğine emin misin?',
      },
      accept: {
        title: 'Karşı teklifi kabul et',
        message: 'Bu karşı teklifi kabul etmek istediğine emin misin?',
      },
      reject: {
        title: 'Karşı teklifi reddet',
        message: 'Karşı teklifi reddedersen teklif kapanır. Devam edilsin mi?',
      },
      confirm: {
        title: 'Teslimatı onayla',
        message: 'Teslimat tamamlandıysa siparişi onaylamak istediğine emin misin?',
      },
    }[action];

    Alert.alert(copy.title, copy.message, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: action === 'reject' ? 'Reddet' : 'Devam et',
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: () => actionMutation.mutate({
          action,
          rejectedReason: action === 'reject' ? 'Karşı teklif satıcı tarafından reddedildi.' : undefined,
        }),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.DEFAULT} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            <Text style={styles.heroDate}>{timeAgo(offer.completedAt || offer.updatedAt || offer.createdAt)}</Text>
          </View>

          <Text style={styles.heroTitle}>{offer.listing.title}</Text>
          <Text style={styles.heroMeta}>{offer.listing.category} · {offer.listing.city}</Text>

          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Teklif Tutarı</Text>
              <Text style={styles.statValue}>{formatPrice(offer.price)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Teslimat</Text>
              <Text style={styles.statValue}>{offer.deliveryDays} gün</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Karşı Taraf</Text>
          <TouchableOpacity
            style={styles.partyCard}
            activeOpacity={0.88}
            onPress={() => router.push(`/user/${otherParty.id}` as any)}
          >
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
              <Text style={styles.partyMeta}>{otherParty.role} · {otherParty.score.toFixed(1)} puan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {offer.status === 'counter_offered' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Karşı Teklif Detayı</Text>
            <View style={styles.counterCard}>
              <Text style={styles.counterLabel}>Yeni öneri</Text>
              <Text style={styles.counterValue}>
                {offer.counterPrice ? formatPrice(offer.counterPrice) : formatPrice(offer.price)}
                {offer.counterDays ? ` · ${offer.counterDays} gün teslimat` : ''}
              </Text>
              {!!offer.counterNote && <Text style={styles.counterNote}>{offer.counterNote}</Text>}

              {actionState.canRespondCounter && (
                <View style={styles.actionStack}>
                  <Button
                    title="Karşı Teklifi Kabul Et"
                    onPress={() => confirmAction('accept')}
                    loading={actionMutation.isPending}
                    fullWidth
                  />
                  <Button
                    title="Teklifimi Revize Et"
                    variant="secondary"
                    onPress={() => setEditModalOpen(true)}
                    style={styles.inlineAction}
                    fullWidth
                  />
                  <Button
                    title="Karşı Teklifi Reddet"
                    variant="destructive"
                    onPress={() => confirmAction('reject')}
                    loading={actionMutation.isPending}
                    fullWidth
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {actionState.showOrderStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sipariş Durumu</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusLine}>
                <Ionicons
                  name={offer.buyerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={offer.buyerConfirmed ? colors.success.DEFAULT : colors.textTertiary}
                />
                <Text style={styles.statusLineText}>Alıcı {offer.buyerConfirmed ? 'onayladı' : 'bekliyor'}</Text>
              </View>
              <View style={styles.statusLine}>
                <Ionicons
                  name={offer.sellerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={offer.sellerConfirmed ? colors.success.DEFAULT : colors.textTertiary}
                />
                <Text style={styles.statusLineText}>Satıcı {offer.sellerConfirmed ? 'onayladı' : 'bekliyor'}</Text>
              </View>

              {actionState.needsConfirmation && (
                <View style={styles.noticeBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.accent.DEFAULT} />
                  <Text style={styles.noticeText}>
                    {otherConfirmed ? 'Karşı taraf teslimatı onayladı. Şimdi sıra sende.' : 'Teslimat tamamlandıysa bu ekrandan onaylayabilirsin.'}
                  </Text>
                </View>
              )}

              {actionState.needsConfirmation && (
                <Button
                  title="Teslimatı Onayla"
                  onPress={() => confirmAction('confirm')}
                  loading={actionMutation.isPending}
                  icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />}
                  fullWidth
                />
              )}
            </View>
          </View>
        )}

        {offer.status === 'rejected' && !!offer.rejectedReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Red Sebebi</Text>
            <View style={styles.rejectedCard}>
              <Text style={styles.rejectedText}>{offer.rejectedReason}</Text>
            </View>
          </View>
        )}

        {!!offer.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teklif Notu</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{offer.note}</Text>
            </View>
          </View>
        )}

        {actionState.canEditOffer && (
          <View style={styles.section}>
            <Button
              title={offer.status === 'counter_offered' ? 'Teklifimi Revize Et' : 'Teklifi Düzenle'}
              variant="secondary"
              onPress={() => setEditModalOpen(true)}
              fullWidth
            />
          </View>
        )}

        {actionState.canWithdraw && (
          <View style={styles.section}>
            <Button
              title="Teklifi Geri Çek"
              variant="ghost"
              onPress={() => confirmAction('withdraw')}
              loading={actionMutation.isPending}
              fullWidth
            />
          </View>
        )}

        {actionState.canCreateNewOffer && (
          <View style={styles.section}>
            <Button
              title="İlana Yeniden Git"
              onPress={() => router.push(`/listing/${offer.listing.id}` as any)}
              fullWidth
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İlan Açıklaması</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{offer.listing.description}</Text>
          </View>
        </View>

        {actionState.canReview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Değerlendirme</Text>

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
                <Text style={styles.reviewDoneText}>Bu siparişi değerlendirdin</Text>
                {!!myReview.comment && <Text style={styles.reviewComment}>{myReview.comment}</Text>}
              </View>
            ) : (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewPrompt}>Karşı tarafı puanla</Text>
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
                  placeholder="İstersen kısa bir yorum da ekleyebilirsin"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={styles.commentInput}
                  selectionColor={colors.accent.DEFAULT}
                />
                <Button
                  title="Puanı Gönder"
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
            title="İlana Git"
            variant="secondary"
            onPress={() => router.push(`/listing/${offer.listing.id}` as any)}
            style={{ flex: 1 }}
          />
          <Button
            title={offer.status === 'accepted' || offer.status === 'completed' ? 'Siparişlere Dön' : 'Tekliflere Dön'}
            onPress={() => router.push((offer.status === 'accepted' || offer.status === 'completed' ? '/orders' : '/(tabs)/offers') as any)}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>

      <Modal visible={editModalOpen} transparent animationType="fade" onRequestClose={() => setEditModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setEditModalOpen(false)}>
          <Pressable style={styles.editCard}>
            <Text style={styles.editTitle}>{offer.status === 'counter_offered' ? 'Teklifimi Revize Et' : 'Teklifi Düzenle'}</Text>
            <Text style={styles.editSubtitle}>
              {offer.status === 'counter_offered'
                ? 'Karşı teklife göre fiyat, teslimat veya notunu güncelleyebilirsin.'
                : 'Bekleyen teklifini düzenleyip alıcıya daha net bir teklif sunabilirsin.'}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Teklif Tutarı</Text>
              <TextInput
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
                placeholder="Örn. 1500"
                placeholderTextColor={colors.textTertiary}
                style={styles.fieldInput}
                selectionColor={colors.accent.DEFAULT}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Teslimat Süresi (gün)</Text>
              <TextInput
                value={editDays}
                onChangeText={setEditDays}
                keyboardType="number-pad"
                placeholder="Örn. 3"
                placeholderTextColor={colors.textTertiary}
                style={styles.fieldInput}
                selectionColor={colors.accent.DEFAULT}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Teklif Notu</Text>
              <TextInput
                value={editNote}
                onChangeText={setEditNote}
                multiline
                placeholder="Teklifinle ilgili kısa bir not bırakabilirsin"
                placeholderTextColor={colors.textTertiary}
                style={styles.noteInput}
                selectionColor={colors.accent.DEFAULT}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Vazgeç"
                variant="secondary"
                onPress={() => setEditModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Güncelle"
                onPress={() => {
                  const normalizedPrice = Number(String(editPrice).replace(/\./g, '').replace(',', '.'));
                  const normalizedDays = Number(editDays);

                  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
                    Alert.alert('Hata', 'Geçerli bir teklif tutarı gir.');
                    return;
                  }

                  if (!Number.isInteger(normalizedDays) || normalizedDays < 1) {
                    Alert.alert('Hata', 'Teslimat süresi en az 1 gün olmalı.');
                    return;
                  }

                  actionMutation.mutate({
                    action: 'edit',
                    price: normalizedPrice,
                    deliveryDays: normalizedDays,
                    note: editNote.trim(),
                  });
                }}
                loading={actionMutation.isPending}
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
  statusText: { fontSize: 11, fontFamily: fontFamily.bold },
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
  counterCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  counterLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textTertiary },
  counterValue: { fontSize: 18, fontFamily: fontFamily.extraBold, color: colors.primary.DEFAULT },
  counterNote: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  actionStack: { gap: space.sm },
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
  rejectedCard: {
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.error.DEFAULT + '24',
    padding: space.md,
  },
  rejectedText: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.error.DEFAULT },
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
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  editCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  editTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  editSubtitle: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.regular, color: colors.textSecondary },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  fieldInput: {
    height: 46,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space.md,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 100,
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
  modalActions: { flexDirection: 'row', gap: space.sm },
  inlineAction: { marginTop: 0 },
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
