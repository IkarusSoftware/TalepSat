'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { ChevronDown, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { ListingMediaCard } from '@/components/listing/ListingMediaCard';

const categories = [
  'Tümü',
  'Mobilya',
  'Elektronik',
  'Tekstil',
  'Endüstriyel',
  'Gıda',
  'İnşaat',
  'Ambalaj',
  'Reklam & Baskı',
];

const cities = ['Tümü', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Gaziantep'];

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'budget-high', label: 'En Yüksek Bütçe' },
  { value: 'most-offers', label: 'En Çok Teklif' },
  { value: 'ending-soon', label: 'Süresi Dolmak Üzere' },
];

interface ListingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  deliveryUrgency: string;
  viewCount: number;
  offerCount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  buyerInitials: string;
  buyerScore: number;
  buyerVerified?: boolean;
  buyerImage?: string | null;
  images: string[];
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedCity, setSelectedCity] = useState('Tümü');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/listings')
      .then((response) => response.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    fetch('/api/listings/favorites')
      .then((response) => (response.ok ? response.json() : []))
      .then((data: ListingItem[]) => {
        if (Array.isArray(data)) {
          setFavorites(new Set(data.map((listing) => listing.id)));
        }
      })
      .catch(() => {});
  }, [session?.user]);

  const toggleFavorite = async (listingId: string) => {
    if (!session?.user) return;

    const response = await fetch(`/api/listings/${listingId}/favorite`, { method: 'POST' });
    if (!response.ok) return;

    const data = await response.json();
    setFavorites((previous) => {
      const next = new Set(previous);
      if (data.favorited) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
  };

  const filteredListings = useMemo(() => {
    const result = listings.filter((listing) => listing.status === 'active');

    const queried = searchQuery
      ? result.filter((listing) => {
          const query = searchQuery.toLowerCase();
          return listing.title.toLowerCase().includes(query) || listing.description.toLowerCase().includes(query);
        })
      : result;

    const categoryFiltered = selectedCategory !== 'Tümü'
      ? queried.filter((listing) => listing.category === selectedCategory)
      : queried;

    const cityFiltered = selectedCity !== 'Tümü'
      ? categoryFiltered.filter((listing) => listing.city === selectedCity)
      : categoryFiltered;

    switch (sortBy) {
      case 'budget-high':
        return [...cityFiltered].sort((left, right) => right.budgetMax - left.budgetMax);
      case 'most-offers':
        return [...cityFiltered].sort((left, right) => right.offerCount - left.offerCount);
      case 'ending-soon':
        return [...cityFiltered].sort(
          (left, right) => new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime(),
        );
      default:
        return [...cityFiltered].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
    }
  }, [listings, searchQuery, selectedCategory, selectedCity, sortBy]);

  const activeFilterCount = [selectedCategory !== 'Tümü', selectedCity !== 'Tümü'].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">İlanları Keşfet</h1>
        <p className="mt-2 text-body-lg text-neutral-500">Gerçek talepleri incele, teklif ver, satışını yap.</p>
      </div>

      <div className="flex flex-col gap-3 mb-6 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="İlan ara... (ör: sandalye, laptop, kumaş)"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((previous) => !previous)}
            className={`h-11 px-4 rounded-lg border text-body-md font-medium flex items-center gap-2 transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-accent bg-accent-lighter text-accent'
                : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 pl-4 pr-9 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-700 dark:text-dark-textPrimary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-5 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-body-sm font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Kategori</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-body-sm font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Şehir</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                      selectedCity === city
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Tümü');
                setSelectedCity('Tümü');
              }}
              className="mt-4 text-body-sm text-accent font-medium hover:text-accent-600 flex items-center gap-1"
            >
              <X size={14} />
              Filtreleri Temizle
            </button>
          )}
        </motion.div>
      )}

      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory !== 'Tümü' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-body-sm font-medium rounded-lg">
              {selectedCategory}
              <button type="button" onClick={() => setSelectedCategory('Tümü')} className="hover:text-primary-700">
                <X size={14} />
              </button>
            </span>
          )}
          {selectedCity !== 'Tümü' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-body-sm font-medium rounded-lg">
              {selectedCity}
              <button type="button" onClick={() => setSelectedCity('Tümü')} className="hover:text-primary-700">
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      <p className="text-body-md text-neutral-500 mb-4">
        <strong className="text-neutral-700 dark:text-dark-textPrimary">{filteredListings.length}</strong> aktif ilan bulundu
      </p>

      {filteredListings.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredListings.map((listing, index) => (
            <motion.article
              key={listing.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04, ease: [0, 0, 0.2, 1] }}
            >
              <ListingMediaCard
                listing={listing}
                isFavorited={favorites.has(listing.id)}
                onFavoriteToggle={session?.user ? toggleFavorite : undefined}
              />
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <Search size={28} className="text-neutral-400" />
          </div>
          <h3 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">
            {listings.length === 0 ? 'Henüz ilan yok' : 'Aramanızla eşleşen ilan bulunamadı'}
          </h3>
          <p className="text-body-lg text-neutral-500 mb-6">
            {listings.length === 0
              ? 'İlk ilanı oluşturan sen ol!'
              : 'Filtrelerinizi değiştirmeyi veya arama kelimesini güncellemeyi deneyin.'}
          </p>
          {listings.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tümü');
                setSelectedCity('Tümü');
              }}
              className="inline-flex items-center gap-2 h-10 px-5 border border-neutral-200 rounded-lg text-body-md font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <X size={16} />
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
