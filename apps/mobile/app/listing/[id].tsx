import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { ListingMediaHeader } from '../../src/components/listing/ListingMediaHeader';
import { isRenderableAppImageUrl, resolveAppMediaUrl, resolveAppMediaUrls } from '../../src/lib/media';
import { Button } from '../../src/components/ui';
import { borderRadius, fontFamily, space } from '../../src/theme';
import type { Listing } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

function fmt(n: number) {
  return n.toLocaleString('tr-TR');
}

type SellerSummary = {
  id: string;
  name: string;
  score?: number;
  verified?: boolean;
};

type ListingDetail = Listing & {
  buyer?: {
    id: string;
    name: string;
    score?: number;
    verified?: boolean;
    image?: string | null;
    city?: string | null;
    completedDeals?: number;
  };
  offers?: Array<{
    id: string;
    price: number;
    deliveryDays: number;
    note?: string | null;
    status: string;
    sellerId: string;
    seller?: SellerSummary;
  }>;
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const galleryRef = useRef<FlatList<string>>(null);

  const [offerModal, setOfferModal] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [note, setNote] = useState('');

  const urgencyLabels: Record<string, { label: string; color: string }> = {
    urgent: { label: 'Acil', color: colors.error.DEFAULT },
    week: { label: '1 Hafta', color: colors.primary.DEFAULT },
    two_weeks: { label: '2 Hafta', color: colors.primary.DEFAULT },
    month: { label: '1 Ay', color: colors.warning.DEFAULT },
    normal: { label: 'Normal', color: colors.primary.DEFAULT },
    flexible: { label: 'Esnek', color: colors.success.DEFAULT },
  };

  const { data: listing, isLoading } = useQuery<ListingDetail>({
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
        deliveryDays: parseInt(deliveryDays, 10),
        note: note || undefined,
      });
    },
    onSuccess: () => {
      setOfferModal(false);
      setPrice('');
      setDeliveryDays('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['offers', id] });
      Alert.alert('Başarılı', 'Teklifiniz gönderildi!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err.message || 'Teklif gönderilemedi.';
      Alert.alert('Hata', msg);
    },
  });

  const galleryImages = useMemo(
    () => resolveAppMediaUrls(listing?.images).filter((item) => isRenderableAppImageUrl(item)),
    [listing?.images],
  );
  const buyerImage = resolveAppMediaUrl(listing?.buyerImage ?? listing?.buyer?.image ?? null);

  function openGallery(startIndex = 0) {
    if (!galleryImages.length) return;
    setGalleryIndex(startIndex);
    setGalleryOpen(true);
  }

  function handleGalleryScroll(index: number) {
    if (index !== galleryIndex) {
      setGalleryIndex(index);
    }
  }

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
        <Text style={styles.notFoundText}>İlan bulunamadı</Text>
      </View>
    );
  }

  const isOwner = user?.id === listing.buyerId;
  const urgency = urgencyLabels[listing.deliveryUrgency] || urgencyLabels.normal;
  const daysLeft = listing.expiresAt
    ? Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000))
    : 0;
  const myOffer = (offers as any[]).find((offer) => offer.sellerId === user?.id);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ListingMediaHeader
          listingId={listing.id}
          title={listing.title}
          category={listing.category}
          images={galleryImages}
          onPress={() => openGallery(0)}
        />

        <View style={styles.body}>
          <View style={styles.statusRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{listing.category}</Text>
            </View>
            <View style={[styles.urgencyBadge, { backgroundColor: `${urgency.color}20` }]}>
              <View style={[styles.dot, { backgroundColor: urgency.color }]} />
              <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
            </View>
            <Text style={styles.daysLeft}>{daysLeft} gün kaldı</Text>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.infoGrid}>
            <InfoCard icon="cash-outline" label="Min Bütçe" value={`₺${fmt(listing.budgetMin)}`} colors={colors} styles={styles} />
            <InfoCard icon="trending-up-outline" label="Max Bütçe" value={`₺${fmt(listing.budgetMax)}`} colors={colors} styles={styles} />
            <InfoCard icon="location-outline" label="Şehir" value={listing.city} colors={colors} styles={styles} />
            <InfoCard icon="chatbubble-outline" label="Teklif" value={`${listing.offerCount ?? offers.length}`} colors={colors} styles={styles} />
          </View>

          <TouchableOpacity
            style={styles.buyerCard}
            activeOpacity={0.88}
            onPress={() => listing.buyer?.id && router.push(`/user/${listing.buyer.id}` as any)}
          >
            <View style={styles.buyerAvatar}>
              {buyerImage ? (
                <Image source={buyerImage} style={styles.buyerAvatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.buyerAvatarText}>
                  {listing.buyer?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.buyerName}>{listing.buyer?.name}</Text>
              <View style={styles.buyerMeta}>
                {listing.buyerVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success.DEFAULT} />
                    <Text style={styles.verifiedText}>Doğrulanmış</Text>
                  </View>
                )}
                <Text style={styles.buyerScore}>⭐ {(listing.buyer?.score ?? listing.buyerScore ?? 0).toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.msgBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary.DEFAULT} />
            </View>
          </TouchableOpacity>

          {offers.length > 0 && (
            <View style={styles.offersSection}>
              <Text style={styles.sectionTitle}>Teklifler ({offers.length})</Text>
              {(offers as any[]).map((offer) => (
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
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {isOwner ? (
          <View style={styles.ownerActions}>
            <Button
              title="Düzenle"
              variant="secondary"
              onPress={() => router.push(`/listing-edit/${id}` as any)}
              size="lg"
              style={styles.ownerEditBtn}
            />
            {offers.length > 0 ? (
              <Button
                title={`Teklifleri Karşılaştır (${offers.length})`}
                onPress={() => router.push(`/listing-compare/${id}` as any)}
                size="lg"
                style={styles.ownerPrimaryBtn}
              />
            ) : (
              <View style={[styles.myOfferBanner, styles.ownerPrimaryBtn]}>
                <Ionicons name="hourglass-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.myOfferText, { color: colors.textSecondary }]}>Henüz karşılaştıracak teklif yok</Text>
              </View>
            )}
          </View>
        ) : myOffer ? (
          <View style={styles.myOfferBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.DEFAULT} />
            <Text style={styles.myOfferText}>Teklifiniz gönderildi — ₺{fmt(myOffer.price)}</Text>
          </View>
        ) : (
          <Button title="Teklif Ver" onPress={() => setOfferModal(true)} size="lg" fullWidth />
        )}
      </View>

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

      <Modal visible={galleryOpen} animationType="fade" transparent onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.galleryOverlay}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity style={styles.galleryHeaderBtn} onPress={() => setGalleryOpen(false)} activeOpacity={0.85}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.galleryCount}>
              <Ionicons name="images-outline" size={14} color={colors.white} />
              <Text style={styles.galleryCountText}>{galleryIndex + 1} / {galleryImages.length}</Text>
            </View>
          </View>

          <FlatList
            ref={galleryRef}
            data={galleryImages}
            horizontal
            pagingEnabled
            initialScrollIndex={galleryIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            keyExtractor={(item, index) => `${item}-${index}`}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              handleGalleryScroll(nextIndex);
            }}
            renderItem={({ item }) => (
              <Pressable style={styles.gallerySlide} onPress={() => setGalleryOpen(false)}>
                <Image source={item} style={styles.galleryImage} contentFit="contain" transition={180} />
              </Pressable>
            )}
          />

          {galleryImages.length > 1 && (
            <View style={styles.galleryDots}>
              {galleryImages.map((image, index) => (
                <TouchableOpacity
                  key={`${image}-gallery-dot-${index}`}
                  style={[styles.galleryDot, index === galleryIndex && styles.galleryDotActive]}
                  onPress={() => {
                    setGalleryIndex(index);
                    galleryRef.current?.scrollToIndex({ index, animated: true });
                  }}
                  activeOpacity={0.85}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  label,
  value,
  colors,
  styles,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  styles: any;
}) {
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
  scroll: { paddingBottom: space.xxl },
  body: { padding: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  notFoundText: { color: colors.textSecondary, fontFamily: fontFamily.regular },
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
    overflow: 'hidden',
  },
  buyerAvatarImage: {
    width: '100%',
    height: '100%',
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
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
  },
  ownerEditBtn: {
    width: 120,
  },
  ownerPrimaryBtn: {
    flex: 1,
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
  galleryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 18, 0.96)',
    justifyContent: 'center',
  },
  galleryHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 52,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  galleryHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  galleryCountText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
  },
  gallerySlide: {
    width: SCREEN_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  galleryImage: {
    width: '100%',
    height: '78%',
  },
  galleryDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  galleryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  galleryDotActive: {
    width: 18,
    backgroundColor: colors.white,
  },
});
