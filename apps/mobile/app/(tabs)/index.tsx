import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { ListingCard } from '../../src/components/ListingCard';
import { COLORS, RADIUS, SPACING } from '../../src/lib/constants';

const CATEGORIES = ['Tümü', 'Elektronik', 'Tekstil', 'Gıda', 'İnşaat', 'Hizmet', 'Diğer'];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');

  const { data: listings = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['listings', search, selectedCategory],
    queryFn: async () => {
      const params: Record<string, string> = { status: 'active' };
      if (search) params.search = search;
      if (selectedCategory !== 'Tümü') params.category = selectedCategory;
      const res = await api.get('/api/listings', { params });
      return res.data;
    },
  });

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>İlanları Keşfet</Text>
        <Text style={styles.headerSubtitle}>{listings.length} aktif ilan</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İlan ara..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item)}
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={listings}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>İlan bulunamadı</Text>
            <Text style={styles.emptySubtext}>Farklı bir arama yapmayı deneyin</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, paddingVertical: SPACING.sm + 4, fontSize: 15, color: COLORS.text },
  categoriesContainer: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryChipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.sm },
});
