import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SearchBar, EmptyState } from '../../src/components/ui';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { ListingCardSkeleton } from '../../src/components/listing/ListingCardSkeleton';
import { CategoryFilter } from '../../src/components/listing/CategoryFilter';
import { useListings, useToggleFavorite, useFavoriteIds } from '../../src/hooks/useListings';
import { colors, fontFamily, space } from '../../src/theme';
import type { Listing } from '../../src/types';

const CATEGORIES = ['Elektronik', 'Tekstil', 'G\u0131da', '\u0130n\u015faat', 'Hizmet', 'Di\u011fer'];

type SortOption = 'newest' | 'budget_desc' | 'most_offers';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'En Yeni',
  budget_desc: 'B\u00FCtçe',
  most_offers: 'En Çok Teklif',
};

const SORT_CYCLE: SortOption[] = ['newest', 'budget_desc', 'most_offers'];

export default function ExploreScreen() {
  // ── Search with debounce ───────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchInput]);

  // ── Filters & Sort ─────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortIndex, setSortIndex] = useState(0);
  const currentSort = SORT_CYCLE[sortIndex];

  const cycleSort = useCallback(() => {
    setSortIndex((prev) => (prev + 1) % SORT_CYCLE.length);
  }, []);

  // ── Data ───────────────────────────────────────────────────────────────
  const {
    data: listings = [],
    isLoading,
    refetch,
    isRefetching,
  } = useListings({
    search: debouncedSearch || undefined,
    category: selectedCategory,
    sort: currentSort,
  });

  // ── Favorites ──────────────────────────────────────────────────────────
  const { data: remoteFavIds = [] } = useFavoriteIds();
  const toggleFavMutation = useToggleFavorite();
  const [localFavs, setLocalFavs] = useState<Set<string>>(new Set());

  // Sync remote favorites into local set
  useEffect(() => {
    if (remoteFavIds.length > 0) {
      setLocalFavs(new Set(remoteFavIds));
    }
  }, [remoteFavIds]);

  const handleFavoriteToggle = useCallback((id: string) => {
    const wasFavorited = localFavs.has(id);
    setLocalFavs((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(id);
      else next.add(id);
      return next;
    });
    toggleFavMutation.mutate({ listingId: id, favorited: wasFavorited });
  }, [localFavs, toggleFavMutation]);

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: Listing }) => (
    <ListingCard
      listing={item}
      onFavoriteToggle={handleFavoriteToggle}
      isFavorited={localFavs.has(item.id)}
    />
  ), [handleFavoriteToggle, localFavs]);

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const ListHeader = useMemo(() => (
    <View>
      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{'\u0130'}lanlar{'\u0131'} Ke\u015ffet</Text>
        {!isLoading && (
          <Text style={styles.headerSubtitle}>{listings.length} aktif ilan</Text>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="\u0130lan ara..."
        />
      </View>

      {/* Category Filter */}
      <CategoryFilter
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Sort Button */}
      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortButton} onPress={cycleSort} activeOpacity={0.7}>
          <Ionicons name="swap-vertical-outline" size={16} color={colors.accent.DEFAULT} />
          <Text style={styles.sortLabel}>{SORT_LABELS[currentSort]}</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [searchInput, selectedCategory, currentSort, isLoading, listings.length, cycleSort]);

  // ── Loading state: show skeletons ──────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {ListHeader}
        <View style={styles.listPadding}>
          {[1, 2, 3, 4].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={listings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.DEFAULT}
            colors={[colors.accent.DEFAULT]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="\u0130lan bulunamad\u0131"
            subtitle="Farkl\u0131 bir arama veya kategori deneyin"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortLabel: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.accent.DEFAULT,
  },
  listPadding: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
});
