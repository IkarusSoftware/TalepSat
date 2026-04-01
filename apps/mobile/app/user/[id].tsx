import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { Avatar, Button, EmptyState } from '../../src/components/ui';
import type { Review, User } from '../../src/types';
import { borderRadius, fontFamily, space } from '../../src/theme';

const badgeColors: Record<string, { bg: string; text: string }> = {
  basic: { bg: '#dbeafe', text: '#2563eb' },
  plus: { bg: '#ede9fe', text: '#7c3aed' },
  pro: { bg: '#fef3c7', text: '#d97706' },
};

const badgeLabels: Record<string, string> = {
  basic: 'Basic',
  plus: 'Plus',
  pro: 'Pro',
};

function roleLabel(role: string) {
  if (role === 'buyer') return 'Alıcı';
  if (role === 'seller') return 'Satıcı';
  return 'Alıcı & Satıcı';
}

function formatMemberSince(date?: string) {
  if (!date) return 'Üye';
  return new Date(date).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ['user-profile', id],
    queryFn: async () => (await api.get(`/api/users/${id}`)).data,
    enabled: !!id,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ['user-reviews', id],
    queryFn: async () => (await api.get(`/api/users/${id}/reviews`)).data,
    enabled: !!id,
  });

  const sendMessage = useMutation({
    mutationFn: async () => (await api.post('/api/conversations', {
      participantId: id,
      message: messageText.trim(),
    })).data,
    onSuccess: (data) => {
      setMessageModalOpen(false);
      setMessageText('');
      router.push(`/conversation/${data.id}` as any);
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            icon="person-outline"
            title="Kullanıcı bulunamadı"
            subtitle="Bu profil artık erişilebilir olmayabilir."
          />
        </View>
      </SafeAreaView>
    );
  }

  const ownProfile = user?.id === profile.id;
  const badge = profile.badge ? badgeColors[profile.badge] : null;
  const canShowSellerStats = profile.role === 'seller' || profile.role === 'both';
  const canShowBuyerStats = profile.role === 'buyer' || profile.role === 'both';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Avatar
              name={profile.name}
              image={profile.image}
              size="lg"
              verified={profile.verified}
            />
            <View style={styles.heroBody}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile.name}</Text>
                {profile.verified && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success.DEFAULT} />
                )}
              </View>
              {!!profile.companyName && <Text style={styles.company}>{profile.companyName}</Text>}
              <Text style={styles.meta}>
                {roleLabel(profile.role)} • {formatMemberSince(profile.createdAt)} üyesi
              </Text>
              {!!profile.city && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.locationText}>{profile.city}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroBadges}>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{roleLabel(profile.role)}</Text>
            </View>
            {badge && (
              <View style={[styles.badgeChip, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>
                  {badgeLabels[profile.badge as string] || profile.badge}
                </Text>
              </View>
            )}
          </View>

          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {!ownProfile && (
            <Button
              title="Mesaj Gönder"
              onPress={() => setMessageModalOpen(true)}
              icon={<Ionicons name="chatbubble-outline" size={16} color={colors.white} />}
              fullWidth
            />
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={18} color={colors.warning.DEFAULT} />
            <Text style={styles.statValue}>{profile.score.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Ortalama Puan</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.success.DEFAULT} />
            <Text style={styles.statValue}>{profile.reviewCount ?? 0}</Text>
            <Text style={styles.statLabel}>Değerlendirme</Text>
          </View>
          {canShowSellerStats && (
            <View style={styles.statCard}>
              <Ionicons name="briefcase-outline" size={18} color={colors.accent.DEFAULT} />
              <Text style={styles.statValue}>{profile.completedDeals}</Text>
              <Text style={styles.statLabel}>Tamamlanan İş</Text>
            </View>
          )}
          {canShowSellerStats && (
            <View style={styles.statCard}>
              <Ionicons name="thumbs-up-outline" size={18} color={colors.primary.DEFAULT} />
              <Text style={styles.statValue}>%{profile.acceptRate ?? 0}</Text>
              <Text style={styles.statLabel}>Kabul Oranı</Text>
            </View>
          )}
          {canShowBuyerStats && (
            <View style={styles.statCard}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary.DEFAULT} />
              <Text style={styles.statValue}>{profile.listingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Toplam İlan</Text>
            </View>
          )}
          {profile.verified && (
            <View style={styles.statCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.success.DEFAULT} />
              <Text style={styles.statValue}>Evet</Text>
              <Text style={styles.statLabel}>Doğrulandı</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
          {reviewsLoading ? (
            <ActivityIndicator size="small" color={colors.accent.DEFAULT} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="star-outline" size={24} color={colors.textTertiary} />
              <Text style={styles.emptyReviewsTitle}>Henüz değerlendirme yok</Text>
              <Text style={styles.emptyReviewsText}>
                Tamamlanan siparişler sonrasında bu alanda yorumlar görünecek.
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <TouchableOpacity
                  style={styles.reviewTop}
                  onPress={() => router.push(`/user/${review.reviewer.id}` as any)}
                  activeOpacity={0.8}
                >
                  <Avatar
                    name={review.reviewer.name}
                    image={review.reviewer.image}
                    size="md"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewAuthor}>{review.reviewer.name}</Text>
                    <View style={styles.reviewStars}>
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
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </TouchableOpacity>

                {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}

                <TouchableOpacity
                  style={styles.reviewListing}
                  onPress={() => router.push(`/listing/${review.offer.listing.id}` as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pricetag-outline" size={14} color={colors.accent.DEFAULT} />
                  <Text style={styles.reviewListingText}>{review.offer.listing.title}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={messageModalOpen} transparent animationType="fade" onRequestClose={() => setMessageModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMessageModalOpen(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{profile.name} ile Mesajlaş</Text>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Mesajını yaz..."
              placeholderTextColor={colors.textTertiary}
              multiline
              style={styles.modalInput}
              selectionColor={colors.accent.DEFAULT}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="İptal"
                variant="secondary"
                onPress={() => setMessageModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Gönder"
                onPress={() => sendMessage.mutate()}
                disabled={!messageText.trim()}
                loading={sendMessage.isPending}
                icon={<Ionicons name="send-outline" size={16} color={colors.white} />}
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
  content: { padding: space.lg, paddingBottom: 120, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  heroTop: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  heroBody: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.extraBold, color: colors.textPrimary, flexShrink: 1 },
  company: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textSecondary },
  meta: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textTertiary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textSecondary },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.lighter,
  },
  roleChipText: { fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.primary.DEFAULT },
  badgeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontFamily: fontFamily.bold },
  bio: { fontSize: 14, lineHeight: 22, fontFamily: fontFamily.regular, color: colors.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 6,
  },
  statValue: { fontSize: 20, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  statLabel: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  sectionTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  emptyReviews: { alignItems: 'center', paddingVertical: space.lg, gap: 6 },
  emptyReviewsTitle: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  emptyReviewsText: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
  reviewCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.lg,
    padding: space.md,
    gap: space.sm,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  reviewAuthor: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewDate: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textTertiary },
  reviewComment: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular, color: colors.textSecondary },
  reviewListing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewListingText: { flex: 1, fontSize: 13, fontFamily: fontFamily.medium, color: colors.accent.DEFAULT },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: space.lg },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  modalTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary },
  modalInput: {
    minHeight: 130,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: space.sm },
});
