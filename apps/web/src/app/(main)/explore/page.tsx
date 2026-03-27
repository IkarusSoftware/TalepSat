'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search, SlidersHorizontal, MapPin, Clock, MessageSquare,
  X, ChevronDown, Star, Loader2, Heart,
} from 'lucide-react';

const categories = [
  'Tümü', 'Mobilya', 'Elektronik', 'Tekstil', 'Endüstriyel',
  'Gıda', 'İnşaat', 'Ambalaj', 'Reklam & Baskı',
];

const cities = ['Tümü', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Gaziantep'];

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'budget-high', label: 'En Yüksek Bütçe' },
  { value: 'most-offers', label: 'En Çok Teklif' },
  { value: 'ending-soon', label: 'Süresi Dolmak Üzere' },
];

function formatBudget(min: number, max: number) {
  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.floor(n / 1000)}K`;
    return n.toString();
  };
  return `₺${fmt(min)} - ₺${fmt(max)}`;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

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
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/listings/favorites')
      .then((r) => r.ok ? r.json() : [])
      .then((data: ListingItem[]) => {
        if (Array.isArray(data)) {
          setFavorites(new Set(data.map((l) => l.id)));
        }
      })
      .catch(() => {});
  }, [session?.user]);

  const toggleFavorite = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) return;
    const res = await fetch(`/api/listings/${listingId}/favorite`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setFavorites((prev) => {
        const next = new Set(prev);
        if (data.favorited) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    }
  };

  const filteredListings = useMemo(() => {
    let result = listings.filter((l) => l.status === 'active');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'Tümü') result = result.filter((l) => l.category === selectedCategory);
    if (selectedCity !== 'Tümü') result = result.filter((l) => l.city === selectedCity);

    switch (sortBy) {
      case 'budget-high': result.sort((a, b) => b.budgetMax - a.budgetMax); break;
      case 'most-offers': result.sort((a, b) => b.offerCount - a.offerCount); break;
      case 'ending-soon': result.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()); break;
      default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [listings, searchQuery, selectedCategory, selectedCity, sortBy]);

  const activeFilterCount = [selectedCategory !== 'Tümü', selectedCity !== 'Tümü'].filter(Boolean).length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">İlanları Keşfet</h1>
        <p className="mt-2 text-body-lg text-neutral-500">Gerçek talepleri incele, teklif ver, satışını yap.</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İlan ara... (ör: sandalye, laptop, kumaş)"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`h-11 px-4 rounded-lg border text-body-md font-medium flex items-center gap-2 transition-colors ${showFilters || activeFilterCount > 0 ? 'border-accent bg-accent-lighter text-accent' : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised'}`}>
            <SlidersHorizontal size={16} /> Filtrele
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-11 pl-4 pr-9 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-700 dark:text-dark-textPrimary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
              {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-5 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-body-sm font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Kategori</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Şehir</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${selectedCity === city ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-200'}`}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => { setSelectedCategory('Tümü'); setSelectedCity('Tümü'); }} className="mt-4 text-body-sm text-accent font-medium hover:text-accent-600 flex items-center gap-1">
              <X size={14} /> Filtreleri Temizle
            </button>
          )}
        </motion.div>
      )}

      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory !== 'Tümü' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-body-sm font-medium rounded-lg">
              {selectedCategory} <button onClick={() => setSelectedCategory('Tümü')} className="hover:text-primary-700"><X size={14} /></button>
            </span>
          )}
          {selectedCity !== 'Tümü' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-body-sm font-medium rounded-lg">
              {selectedCity} <button onClick={() => setSelectedCity('Tümü')} className="hover:text-primary-700"><X size={14} /></button>
            </span>
          )}
        </div>
      )}

      <p className="text-body-md text-neutral-500 mb-4">
        <strong className="text-neutral-700 dark:text-dark-textPrimary">{filteredListings.length}</strong> aktif ilan bulundu
      </p>

      {/* Listing grid */}
      {filteredListings.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing, index) => (
            <motion.article key={listing.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.05, ease: [0, 0, 0.2, 1] }}>
              <div className="group relative h-full rounded-xl border border-neutral-200/50 dark:border-dark-border/80 bg-white dark:bg-dark-surface hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 hover:scale-[1.01] transition-all duration-normal">
                {session?.user && (
                  <button
                    onClick={(e) => toggleFavorite(e, listing.id)}
                    className={`absolute top-4 right-4 z-10 p-1.5 rounded-full transition-all duration-fast ${
                      favorites.has(listing.id)
                        ? 'text-red-500 bg-red-50 dark:bg-red-500/10'
                        : 'text-neutral-300 hover:text-red-400 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border'
                    }`}
                    aria-label={favorites.has(listing.id) ? 'Favorilerden çıkar' : 'Favorile'}
                  >
                    <Heart size={16} className={favorites.has(listing.id) ? 'fill-red-500' : ''} />
                  </button>
                )}
                <Link href={`/listing/${listing.id}`} className="block p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">{listing.category}</span>
                    <span className="text-body-sm text-neutral-400 flex items-center gap-1"><Clock size={13} />{getTimeLeft(listing.expiresAt)}</span>
                  </div>
                  <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-2 line-clamp-2 group-hover:text-accent transition-colors">{listing.title}</h3>
                  <p className="text-body-lg font-bold text-accent mb-3">{formatBudget(listing.budgetMin, listing.budgetMax)}</p>
                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400 mb-4">
                    <span className="flex items-center gap-1"><MapPin size={13} /> {listing.city}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {listing.deliveryUrgency}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${listing.buyerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised flex items-center justify-center text-[11px] font-semibold text-neutral-600 dark:text-dark-textSecondary hover:ring-2 hover:ring-accent/30 transition-all"
                      >
                        {listing.buyerInitials}
                      </Link>
                      <div className="flex items-center gap-1 text-body-sm text-neutral-500"><Star size={12} className="text-amber-400 fill-amber-400" />{listing.buyerScore}</div>
                    </div>
                    <span className="flex items-center gap-1 text-body-sm font-semibold text-accent"><MessageSquare size={14} />{listing.offerCount} teklif</span>
                  </div>
                </Link>
              </div>
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
            {listings.length === 0 ? 'İlk ilanı oluşturan sen ol!' : 'Filtrelerinizi değiştirmeyi veya arama kelimesini güncellemeyi deneyin.'}
          </p>
          {listings.length > 0 && (
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('Tümü'); setSelectedCity('Tümü'); }} className="inline-flex items-center gap-2 h-10 px-5 border border-neutral-200 rounded-lg text-body-md font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
              <X size={16} /> Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
