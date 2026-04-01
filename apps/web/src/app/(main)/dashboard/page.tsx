'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Clock, MessageSquare, MapPin, Eye, Plus, ArrowRight,
  Calendar, FileText, Loader2, XCircle, AlertCircle, TrendingUp,
} from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

const deliveryLabels: Record<string, string> = {
  urgent:    'Acil (1-3 gün)',
  week:      '1 Hafta',
  two_weeks: '2 Hafta',
  month:     '1 Ay',
  flexible:  'Esnek',
  normal:    'Normal',
};

function formatBudget(min: number, max: number) {
  if (min === 0 && max === 0) return 'Teklif Bekliyor';
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} — ${formatCurrency(max)}`;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

const tabs = [
  { value: 'active',    label: 'Aktif' },
  { value: 'pending',   label: 'Onay Bekliyor' },
  { value: 'rejected',  label: 'Reddedildi' },
  { value: 'completed', label: 'Tamamlanan' },
  { value: 'expired',   label: 'Süresi Dolan' },
];

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  active:    { label: 'Aktif',         dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  pending:   { label: 'Onay Bekliyor', dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  rejected:  { label: 'Reddedildi',    dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400' },
  completed: { label: 'Tamamlandı',    dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
  expired:   { label: 'Süresi Doldu',  dot: 'bg-neutral-400', text: 'text-neutral-500 dark:text-neutral-400' },
};

interface Listing {
  id: string;
  title: string;
  category: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  deliveryUrgency: string;
  viewCount: number;
  status: string;
  expiresAt: string;
  offerCount: number;
  createdAt: string;
}

interface Offer {
  id: string;
  listingId: string;
  status: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/listings?buyerId=${session.user.id}`).then((r) => r.json()),
      fetch('/api/offers?role=buyer').then((r) => r.json()),
    ])
      .then(([listingsData, offersData]) => {
        setListings(listingsData);
        setOffers(Array.isArray(offersData) ? offersData : []);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const filtered = useMemo(() => listings.filter((l) => l.status === activeTab), [listings, activeTab]);

  const pendingOfferCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    offers.filter((o) => o.status === 'pending').forEach((o) => {
      counts[o.listingId] = (counts[o.listingId] || 0) + 1;
    });
    return counts;
  }, [offers]);

  const tabCounts = {
    active:    listings.filter((l) => l.status === 'active').length,
    pending:   listings.filter((l) => l.status === 'pending').length,
    rejected:  listings.filter((l) => l.status === 'rejected').length,
    completed: listings.filter((l) => l.status === 'completed').length,
    expired:   listings.filter((l) => l.status === 'expired').length,
  };

  const totalOffers  = offers.length;
  const totalPending = offers.filter((o) => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">İlanlarım</h1>
          <p className="mt-1 text-body-md text-neutral-500">Oluşturduğun ilanları yönet, gelen teklifleri incele.</p>
        </div>
        <Link
          href="/create"
          className="hidden sm:inline-flex items-center gap-2 h-10 px-4 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all shadow-sm"
        >
          <Plus size={16} /> Yeni İlan
        </Link>
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Aktif İlan',      value: tabCounts.active,    color: 'text-accent',      icon: <FileText size={14} /> },
          { label: 'Toplam Teklif',   value: totalOffers,         color: 'text-primary',     icon: <MessageSquare size={14} /> },
          { label: 'Bekleyen Teklif', value: totalPending,        color: 'text-amber-600',   icon: <Clock size={14} /> },
          { label: 'Tamamlanan',      value: tabCounts.completed, color: 'text-success',     icon: <TrendingUp size={14} /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 px-4 py-3 flex items-center gap-3">
            <div className={`${stat.color} opacity-60`}>{stat.icon}</div>
            <div>
              <p className={`text-h3 font-bold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="text-body-sm text-neutral-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const count = tabCounts[tab.value as keyof typeof tabCounts];
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg text-body-md font-medium transition-colors ${
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

      {/* ── Listing grid ───────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((listing, index) => {
            const pendingCount = pendingOfferCounts[listing.id] || 0;
            const config = statusConfig[listing.status] || statusConfig.active;

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 transition-all flex flex-col"
              >
                {/* Top badges + time */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">
                    {listing.category}
                  </span>
                  <span className={`flex items-center gap-1 text-body-sm font-medium ${config.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>
                  {listing.status === 'active' && (
                    <span className="ml-auto flex items-center gap-1 text-body-sm text-amber-500 font-medium whitespace-nowrap">
                      <Clock size={12} />{getTimeLeft(listing.expiresAt)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <Link
                  href={`/listing/${listing.id}`}
                  className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors line-clamp-2 mb-2 block leading-snug"
                >
                  {listing.title}
                </Link>

                {/* Budget */}
                <p className="text-body-md font-bold text-accent mb-3">
                  {formatBudget(listing.budgetMin, listing.budgetMax)}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-neutral-400 mb-3">
                  <span className="flex items-center gap-1"><MapPin size={12} />{listing.city}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} />{deliveryLabels[listing.deliveryUrgency] ?? listing.deliveryUrgency}</span>
                  <span className="flex items-center gap-1"><Eye size={12} />{listing.viewCount}</span>
                </div>

                {/* Info banners (compact) */}
                {listing.status === 'pending' && (
                  <p className="text-body-sm text-amber-600 dark:text-amber-400 mb-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
                    Admin onayı bekleniyor — 24 saat içinde sonuçlanır.
                  </p>
                )}
                {listing.status === 'rejected' && (
                  <p className="text-body-sm text-red-600 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
                    İlan reddedildi.{' '}
                    <a href="mailto:destek@talepsat.com" className="underline font-medium">İletişime geç</a>
                  </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-dark-border flex items-center justify-between">
                  {listing.status === 'active' ? (
                    <span className="flex items-center gap-1.5 text-body-md font-semibold text-accent">
                      <MessageSquare size={14} />
                      {listing.offerCount} teklif
                      {pendingCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-body-sm text-neutral-400">
                      <AlertCircle size={13} />
                      {listing.status === 'completed' ? `${listing.offerCount} teklif` : '—'}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {listing.offerCount > 1 && listing.status === 'active' && (
                      <Link
                        href={`/listing/${listing.id}/compare`}
                        className="h-8 px-3 rounded-lg border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center"
                      >
                        Karşılaştır
                      </Link>
                    )}
                    {listing.status === 'active' && (
                      <Link
                        href={`/listing/${listing.id}`}
                        className="h-8 px-3 rounded-lg bg-accent/10 text-accent text-body-sm font-semibold hover:bg-accent/20 transition-colors flex items-center gap-1.5"
                      >
                        Teklifleri Gör <ArrowRight size={13} />
                      </Link>
                    )}
                    {listing.status === 'rejected' && (
                      <Link
                        href="/create"
                        className="h-8 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-body-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                      >
                        Yeniden Oluştur <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <FileText size={24} className="text-neutral-400" />
          </div>
          <h3 className="text-h4 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">
            {activeTab === 'active' ? 'Henüz aktif ilanın yok'
              : activeTab === 'pending' ? 'Onay bekleyen ilan yok'
              : activeTab === 'rejected' ? 'Reddedilen ilan yok'
              : activeTab === 'completed' ? 'Tamamlanan ilan yok'
              : 'Süresi dolan ilan yok'}
          </h3>
          <p className="text-body-md text-neutral-500 mb-5">
            İlk ilanını oluştur ve tedarikçilerden teklif almaya başla!
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            <Plus size={16} /> İlan Oluştur
          </Link>
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/create"
        className="sm:hidden fixed bottom-6 right-6 w-13 h-13 bg-accent text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-accent-600 active:scale-95 transition-all z-20"
      >
        <Plus size={22} />
      </Link>
    </div>
  );
}
