import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';
import { fontFamily, space, borderRadius } from '../../src/theme';

function fmt(n: number) { return n.toLocaleString('tr-TR'); }

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const [offerModal, setOfferModal] = useState(false);
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [note, setNote] = useState('');

  const urgencyLabels: Record<string, { label: string; color: string }> = {
    urgent:   { label: 'Acil',   color: colors.error.DEFAULT   },
    normal:   { label: 'Normal', color: colors.primary.DEFAULT },
    flexible: { label: 'Esnek', color: colors.success.DEFAULT  },
  };

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/api/listings/${id}`);
      return res.data;
    },
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers', id],
    queryFn: async () => {
      const res = await api.get(`/api/offers?listingId=${id}`);
      return res.data;
    },
    enabled: !!listing,
  });

  const submitOffer = useMutation({
    mutationFn: async () => {
      if (!price || !deliveryDays) throw new Error('Fiyat ve teslimat günü gerekli');
      return api.post('/api/offers', {
        listingId: id,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays),
        note: note || undefined,
      });
    },
    onSuccess: () => {
      setOfferModal(false);
      setPrice(''); setDeliveryDays(''); setNote('');
      queryClient.invalidateQueries({ queryKey: ['offers', id] });
      Alert.alert('Başarılı', 'Teklifiniz gönderildi!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err.message || 'Teklif gönderilemedi.';
      Alert.alert('Hata', msg);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular }}>İlan bulunamadı</Text>
      </View>
    );
  }

  const isOwner = user?.id === listing.buyerId;
  const urgency = urgencyLabels[listing.deliveryUrgency] || urgencyLabels.normal;
  const daysLeft = Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000));
  const myOffer = offers.find((o: any) => o.sellerId === user?.id);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Row */}
        <View style={styles.statusRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{listing.category}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '20' }]}>
            <View style={[styles.dot, { backgroundColor: urgency.color }]} />
            <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
          </View>
          <Text style={styles.daysLeft}>{daysLeft} gün kaldı</Text>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.description}>{listing.description}</Text>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          <InfoCard icon="cash-outline" label="Min Bütçe" value={`₺${fmt(listing.budgetMin)}`} colors={colors} styles={styles} />
          <InfoCard icon="trending-up-outline" label="Max Bütçe" value={`₺${fmt(listing.budgetMax)}`} colors={colors} styles={styles} />
          <InfoCard icon="location-outline" label="Şehir" value={listing.city} colors={colors} styles={styles} />
          <InfoCard icon="chatbubble-outline" label="Teklif" value={`${listing._count?.offers ?? offers.length}`} colors={colors} styles={styles} />
        </View>

        {/* Buyer */}
        <TouchableOpacity
          style={styles.buyerCard}
          activeOpacity={0.88}
          onPress={() => listing.buyer?.id && router.push(`/user/${listing.buyer.id}` as any)}
        >
          <View style={styles.buyerAvatar}>
            <Text style={styles.buyerAvatarText}>
              {listing.buyer?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.buyerName}>{listing.buyer?.name}</Text>
            <View style={styles.buyerMeta}>
              {listing.buyer?.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success.DEFAULT} />
                  <Text style={styles.verifiedText}>Doğrulanmış</Text>
                </View>
              )}
              <Text style={styles.buyerScore}>⭐ {listing.buyer?.score?.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.msgBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary.DEFAULT} />
          </View>
        </TouchableOpacity>

        {/* Offers */}
        {offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>Teklifler ({offers.length})</Text>
            {offers.map((offer: any) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <View style={styles.offerAvatar}>
                    <Text style={styles.offerAvatarText}>
                      {offer.seller?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.offerProfileLink}
                    activeOpacity={0.82}
                    onPress={() => offer.seller?.id && router.push(`/user/${offer.seller.id}` as any)}
                  >
                    <Text style={styles.offerSeller}>{offer.seller?.name}</Text>
                    <Text style={styles.offerStatus}>{offer.status === 'pending' ? 'Beklemede' : offer.status}</Text>
                  </TouchableOpacity>
                  <Text style={styles.offerPrice}>₺{fmt(offer.price)}</Text>
                </View>
                <View style={styles.offerMeta}>
                  <Text style={styles.offerMetaText}>🕐 {offer.deliveryDays} gün teslimat</Text>
                  {offer.note && <Text style={styles.offerNote} numberOfLines={2}>{offer.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
          {isOwner ? (
            offers.length > 0 ? (
              <Button
                title={`Teklifleri Karsilastir (${offers.length})`}
                onPress={() => router.push(`/listing-compare/${id}` as any)}
                size="lg"
                fullWidth
              />
            ) : (
              <View style={styles.myOfferBanner}>
                <Ionicons name="hourglass-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.myOfferText, { color: colors.textSecondary }]}>Henuz karsilastiracak teklif yok</Text>
              </View>
            )
          ) : myOffer ? (
            <View style={styles.myOfferBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success.DEFAULT} />
              <Text style={styles.myOfferText}>Teklifiniz gönderildi — ₺{fmt(myOffer.price)}</Text>
            </View>
          ) : (
            <Button title="Teklif Ver" onPress={() => setOfferModal(true)} size="lg" fullWidth />
          )}
      </View>

      {/* Offer Modal */}
      <Modal visible={offerModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Teklif Ver</Text>
              <Text style={styles.modalSubtitle}>
                Bütçe: ₺{fmt(listing.budgetMin)} – ₺{fmt(listing.budgetMax)}
              </Text>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Teklifiniz (₺)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="5000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  selectionColor={colors.accent.DEFAULT}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Teslimat Günü</Text>
                <TextInput
                  style={styles.modalInput}
                  value={deliveryDays}
                  onChangeText={setDeliveryDays}
                  placeholder="7"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  selectionColor={colors.accent.DEFAULT}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Not (opsiyonel)</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ek bilgi, teslimat detayları..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  selectionColor={colors.accent.DEFAULT}
                />
              </View>

              <View style={styles.modalBtns}>
                <Button
                  title="İptal"
                  variant="secondary"
                  onPress={() => setOfferModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Gönder"
                  onPress={() => submitOffer.mutate()}
                  loading={submitOffer.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, value, colors, styles }: { icon: any; label: string; value: string; colors: any; styles: any }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={18} color={colors.primary.DEFAULT} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  categoryBadge: {
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.primary.light,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  urgencyText: { fontSize: 12, fontFamily: fontFamily.semiBold },
  daysLeft: {
    marginLeft: 'auto',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  title: {
    fontSize: 22,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    marginBottom: space.md,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: space.lg,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.lg,
    gap: space.md,
  },
  buyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerAvatarText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.primary.light,
  },
  buyerName: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  buyerMeta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verifiedText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.success.DEFAULT,
  },
  buyerScore: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  msgBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offersSection: { marginBottom: space.lg },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: space.md,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.sm,
  },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  offerProfileLink: { flex: 1 },
  offerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerAvatarText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  offerSeller: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  offerStatus: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  offerPrice: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.primary.light,
  },
  offerMeta: { gap: 4 },
  offerMetaText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  offerNote: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  myOfferBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md,
  },
  myOfferText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.success.DEFAULT,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: space.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: space.lg,
  },
  modalField: { marginBottom: space.md },
  modalLabel: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 4,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    minHeight: 50,
  },
  modalBtns: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
});
