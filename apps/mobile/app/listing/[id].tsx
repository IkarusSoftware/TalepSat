import React, { useState } from 'react';
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
import { Button } from '../../src/components/Button';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

function fmt(n: number) { return n.toLocaleString('tr-TR'); }

const urgencyLabels: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Acil', color: COLORS.error },
  normal: { label: 'Normal', color: COLORS.primary },
  flexible: { label: 'Esnek', color: COLORS.success },
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [offerModal, setOfferModal] = useState(false);
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [note, setNote] = useState('');

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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.textSecondary }}>İlan bulunamadı</Text>
      </View>
    );
  }

  const isOwner = user?.id === listing.buyerId;
  const urgency = urgencyLabels[listing.deliveryUrgency] || urgencyLabels.normal;
  const daysLeft = Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000));
  const myOffer = offers.find((o: any) => o.sellerId === user?.id);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Bar */}
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
          <InfoCard icon="cash-outline" label="Min Bütçe" value={`₺${fmt(listing.budgetMin)}`} />
          <InfoCard icon="trending-up-outline" label="Max Bütçe" value={`₺${fmt(listing.budgetMax)}`} />
          <InfoCard icon="location-outline" label="Şehir" value={listing.city} />
          <InfoCard icon="chatbubble-outline" label="Teklif" value={`${listing._count?.offers || offers.length}`} />
        </View>

        {/* Buyer */}
        <View style={styles.buyerCard}>
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
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={styles.verifiedText}>Doğrulanmış</Text>
                </View>
              )}
              <Text style={styles.buyerScore}>⭐ {listing.buyer?.score?.toFixed(1)}</Text>
            </View>
          </View>
          {!isOwner && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/messages` as any)}
              style={styles.msgBtn}
            >
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerSeller}>{offer.seller?.name}</Text>
                    <Text style={styles.offerStatus}>{offer.status === 'pending' ? 'Beklemede' : offer.status}</Text>
                  </View>
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
      {!isOwner && (
        <View style={styles.bottomBar}>
          {myOffer ? (
            <View style={styles.myOfferBanner}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.myOfferText}>Teklifiniz gönderildi — ₺{fmt(myOffer.price)}</Text>
            </View>
          ) : (
            <Button title="Teklif Ver" onPress={() => setOfferModal(true)} size="lg" style={{ flex: 1 }} />
          )}
        </View>
      )}

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
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Teslimat Günü</Text>
                <TextInput
                  style={styles.modalInput}
                  value={deliveryDays}
                  onChangeText={setDeliveryDays}
                  placeholder="7"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Not (opsiyonel)</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ek bilgi, teslimat detayları..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
              </View>

              <View style={styles.modalBtns}>
                <Button title="İptal" variant="outline" onPress={() => setOfferModal(false)} style={{ flex: 1 }} />
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

function InfoCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  categoryBadge: {
    backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.sm,
    paddingVertical: 3, borderRadius: RADIUS.full,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm,
    paddingVertical: 3, borderRadius: RADIUS.full, gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  urgencyText: { fontSize: 12, fontWeight: '600' },
  daysLeft: { marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md, lineHeight: 28 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.lg },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  infoCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  infoLabel: { fontSize: 11, color: COLORS.textMuted },
  infoValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  buyerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg, gap: SPACING.md,
  },
  buyerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  buyerAvatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  buyerName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  buyerMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verifiedText: { fontSize: 12, color: COLORS.success },
  buyerScore: { fontSize: 12, color: COLORS.textSecondary },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  offersSection: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  offerCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm,
  },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  offerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  offerAvatarText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  offerSeller: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  offerStatus: { fontSize: 12, color: COLORS.textMuted },
  offerPrice: { fontSize: 18, fontWeight: '800', color: COLORS.primaryLight },
  offerMeta: { gap: 4 },
  offerMetaText: { fontSize: 13, color: COLORS.textSecondary },
  offerNote: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
  bottomBar: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  myOfferBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md,
  },
  myOfferText: { fontSize: 15, fontWeight: '600', color: COLORS.success },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xxl,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  modalField: { marginBottom: SPACING.md },
  modalLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6 },
  modalInput: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4,
    fontSize: 16, color: COLORS.text, minHeight: 50,
  },
  modalBtns: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
});
