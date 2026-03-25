'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Clock, MessageSquare, MapPin, Eye, Plus, ArrowRight,
  Calendar, FileText,
} from 'lucide-react';
import { mockListings, mockOffers, currentUser } from '@/lib/mock-data';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

const tabs = [
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tamamlanan' },
  { value: 'expired', label: 'Süresi Dolan' },
];

const statusConfig = {
  active: { label: 'Aktif', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  completed: { label: 'Tamamlandı', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  expired: { label: 'Süresi Doldu', bg: 'bg-neutral-100 dark:bg-neutral-500/10', text: 'text-neutral-500 dark:text-neutral-400' },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('active');

  const myListings = useMemo(() => {
    let result = mockListings.filter((l) => l.buyerId === currentUser.id);
    if (activeTab !== 'all') {
      result = result.filter((l) => l.status === activeTab);
    }
    return result;
  }, [activeTab]);

  // Count offers per listing
  const offerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockOffers.forEach((o) => {
      counts[o.listingId] = (counts[o.listingId] || 0) + 1;
    });
    return counts;
  }, []);

  // Pending offers count per listing
  const pendingOfferCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockOffers.filter((o) => o.status === 'pending').forEach((o) => {
      counts[o.listingId] = (counts[o.listingId] || 0) + 1;
    });
    return counts;
  }, []);

  const allMyListings = mockListings.filter((l) => l.buyerId === currentUser.id);
  const tabCounts = {
    active: allMyListings.filter((l) => l.status === 'active').length,
    completed: allMyListings.filter((l) => l.status === 'completed').length,
    expired: allMyListings.filter((l) => l.status === 'expired').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
            İlanlarım
          </h1>
          <p className="mt-2 text-body-lg text-neutral-500">
            Oluşturduğun ilanları yönet, gelen teklifleri incele.
          </p>
        </div>
        <Link
          href="/create"
          className="hidden sm:inline-flex items-center gap-2 h-11 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all shadow-sm"
        >
          <Plus size={18} />
          Yeni İlan
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Aktif İlan', value: tabCounts.active, color: 'text-accent' },
          { label: 'Toplam Teklif', value: Object.values(offerCounts).reduce((a, b) => a + b, 0), color: 'text-primary' },
          { label: 'Bekleyen Teklif', value: Object.values(pendingOfferCounts).reduce((a, b) => a + b, 0), color: 'text-amber-600' },
          { label: 'Tamamlanan', value: tabCounts.completed, color: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4">
            <p className="text-body-sm text-neutral-500">{stat.label}</p>
            <p className={`text-h2 font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {tabs.map((tab) => {
          const count = tabCounts[tab.value as keyof typeof tabCounts];
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 rounded-lg text-body-md font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-body-sm ${activeTab === tab.value ? 'text-white/70' : 'text-neutral-400'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Listing cards */}
      {myListings.length > 0 ? (
        <div className="space-y-4">
          {myListings.map((listing, index) => {
            const offerCount = offerCounts[listing.id] || 0;
            const pendingCount = pendingOfferCounts[listing.id] || 0;
            const config = statusConfig[listing.status];

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">
                        {listing.category}
                      </span>
                      <span className={`px-2 py-0.5 text-body-sm font-medium rounded-sm ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                    </div>

                    <Link
                      href={`/listing/${listing.id}`}
                      className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors line-clamp-2 mb-2 block"
                    >
                      {listing.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {listing.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> {listing.deliveryUrgency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={13} /> {listing.viewCount}
                      </span>
                      {listing.status === 'active' && (
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          <Clock size={13} /> {getTimeLeft(listing.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                    <p className="text-body-sm text-neutral-400">Bütçe</p>
                    <p className="text-h4 font-bold text-accent">
                      {formatCurrency(listing.budgetMin)} — {formatCurrency(listing.budgetMax)}
                    </p>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-body-md font-semibold text-accent">
                      <MessageSquare size={16} />
                      {offerCount} teklif
                      {pendingCount > 0 && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {offerCount > 1 && listing.status === 'active' && (
                      <Link
                        href={`/listing/${listing.id}/compare`}
                        className="h-9 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center gap-2"
                      >
                        Karşılaştır
                      </Link>
                    )}
                    <Link
                      href={`/listing/${listing.id}`}
                      className="h-9 px-4 rounded-lg bg-accent/10 text-accent text-body-sm font-semibold hover:bg-accent/20 transition-colors flex items-center gap-2"
                    >
                      Teklifleri Gör <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <FileText size={28} className="text-neutral-400" />
          </div>
          <h3 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">
            Henüz ilanın yok
          </h3>
          <p className="text-body-lg text-neutral-500 mb-6">
            İlk ilanını oluştur ve tedarikçilerden teklif almaya başla!
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            <Plus size={18} /> İlan Oluştur
          </Link>
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/create"
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-accent-600 active:scale-95 transition-all z-20"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
