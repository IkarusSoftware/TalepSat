import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/contexts/ThemeContext';
import { ListingCard } from '../src/components/listing/ListingCard';
import { EmptyState } from '../src/components/ui';
import { useFavoriteIds, useFavoriteListings, useToggleFavorite } from '../src/hooks/useListings';
import type { Listing } from '../src/types';
import { fontFamily, space } from '../src/theme';

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data: listings = [], isLoading, refetch, isRefetching } = useFavoriteListings(!!user);
  const { data: remoteFavIds = [] } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const [localFavs, setLocalFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalFavs(new Set(remoteFavIds));
  }, [remoteFavIds]);

  function handleFavoriteToggle(listingId: string) {
    const wasFavorited = localFavs.has(listingId);
    setLocalFavs((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    toggleFavorite.mutate({ listingId, favorited: wasFavorited });
  }

  const renderItem = ({ item }: { item: Listing }) => (
    <ListingCard
      listing={item}
      isFavorited={localFavs.has(item.id)}
      onFavoriteToggle={handleFavoriteToggle}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorilerim</Text>
        <Text style={styles.subtitle}>
          {listings.length > 0
            ? `${listings.length} kaydedilen ilan`
            : 'Kaydettiğin ilanları burada takip edebilirsin'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent.DEFAULT}
            />
          }
          ListEmptyComponent={(
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="heart-outline"
                title="Henüz favori ilan yok"
                subtitle="Beğendiğin ilanları kalp butonuyla kaydet, burada tekrar bul."
              />
              <TouchableOpacity
                style={styles.cta}
                onPress={() => router.push('/(tabs)' as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={16} color={colors.white} />
                <Text style={styles.ctaText}>İlanları Keşfet</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md },
  title: { fontSize: 26, fontFamily: fontFamily.extraBold, color: colors.textPrimary },
  subtitle: { fontSize: 13, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: space.lg, paddingBottom: 120 },
  emptyWrap: { paddingTop: space.xl },
  cta: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: 999,
    backgroundColor: colors.accent.DEFAULT,
  },
  ctaText: { fontSize: 14, fontFamily: fontFamily.semiBold, color: colors.white },
});
