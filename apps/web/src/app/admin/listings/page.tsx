'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, FileText, MoreVertical, CheckCircle, XCircle,
  Clock, Eye, Loader2, AlertTriangle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminListing {
  id: string;
  title: string;
  category: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  status: string;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  offerCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date: string | null) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  return `${Math.floor(hours / 24)}g`;
}

function formatBudget(min: number, max: number) {
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(n);
  return `₺${fmt(min)} – ₺${fmt(max)}`;
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'Beklemede',    color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   dot: 'bg-amber-500'   },
  active:   { label: 'Aktif',        color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500' },
  rejected: { label: 'Reddedildi',   color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-500/10',       dot: 'bg-red-500'     },
  expired:  { label: 'Süresi Doldu', color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-700/30', dot: 'bg-neutral-400' },
};

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { value: 'all',      label: 'Tümü'          },
  { value: 'pending',  label: 'Beklemede'      },
  { value: 'active',   label: 'Aktif'          },
  { value: 'rejected', label: 'Reddedildi'     },
  { value: 'expired',  label: 'Süresi Doldu'   },
];

// ── Action dropdown ───────────────────────────────────────────────────────────
function ActionMenu({
  listing,
  onAction,
  onClose,
}: {
  listing: AdminListing;
  onAction: (listingId: string, action: string) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function act(action: string) {
    setBusy(true);
    await onAction(listing.id, action);
    setBusy(false);
    onClose();
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl z-20 overflow-hidden"
    >
      {busy && (
        <div className="absolute inset-0 bg-white/70 dark:bg-dark-surface/70 flex items-center justify-center z-10 rounded-xl">
          <Loader2 size={18} className="animate-spin text-primary" />
        </div>
      )}

      {/* View */}
      <div className="p-1.5">
        <Link
          href={`/listing/${listing.id}`}
          onClick={onClose}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
        >
          <Eye size={14} className="text-neutral-400" /> İlanı Görüntüle
        </Link>
      </div>

      <div className="border-t border-neutral-100 dark:border-dark-border" />

      {/* Actions */}
      <div className="p-1.5 space-y-0.5">
        {listing.status === 'pending' && (
          <>
            <button
              onClick={() => act('approve')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            >
              <CheckCircle size={14} /> Onayla
            </button>
            <button
              onClick={() => act('reject')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <XCircle size={14} /> Reddet
            </button>
          </>
        )}
        {listing.status === 'active' && (
          <button
            onClick={() => act('expire')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
          >
            <Clock size={14} className="text-neutral-400" /> Pasife Al
          </button>
        )}
        {(listing.status === 'rejected' || listing.status === 'expired') && (
          <button
            onClick={() => act('approve')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            <CheckCircle size={14} /> Onayla
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-neutral-50 dark:border-dark-border/50 last:border-0">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-md w-2/5" />
            <div className="h-3 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-md w-1/4" />
          </div>
          <div className="h-3.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-md w-24" />
          <div className="h-3.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-md w-16" />
          <div className="h-6 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-full w-20" />
          <div className="h-7 w-7 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminListingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await fetch(`/api/admin/listings?${params}`);
      if (res.ok) {
        setListings(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setFetchError((data as { error?: string }).error || `Hata: ${res.status}`);
        if (res.status === 401) window.location.href = '/admin/login';
      }
    } catch {
      setFetchError('Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  async function handleAction(listingId: string, action: string) {
    const res = await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, action }),
    });
    if (res.ok) fetchListings();
  }

  // Tab counts (using all fetched data without filter — recompute from full set)
  const pendingCount = listings.filter((l) => l.status === 'pending').length;

  const tabCounts: Record<string, number> = {
    all:      listings.length,
    pending:  listings.filter((l) => l.status === 'pending').length,
    active:   listings.filter((l) => l.status === 'active').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
    expired:  listings.filter((l) => l.status === 'expired').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
          İlanlar
          <span className="text-body-sm font-medium text-neutral-400 bg-neutral-100 dark:bg-dark-surfaceRaised px-2.5 py-1 rounded-full">
            {listings.length}
          </span>
          {pendingCount > 0 && (
            <span className="text-body-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
              {pendingCount} bekliyor
            </span>
          )}
        </h1>
        <p className="mt-1 text-body-lg text-neutral-500">İlanları yönetin, onaylayın veya reddedin.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((tab) => {
            const count = tabCounts[tab.value] ?? 0;
            const isPending = tab.value === 'pending';
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3.5 py-2 rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.value
                    ? 'bg-primary text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value
                      ? 'bg-white/20 text-white'
                      : isPending
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-neutral-200 dark:bg-dark-surfaceRaised text-neutral-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İlan başlığı ara..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-body-sm flex items-center gap-2">
          <AlertTriangle size={15} />
          {fetchError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-dark-border bg-neutral-50/50 dark:bg-dark-surfaceRaised/30">
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-6 py-3.5">İlan</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Alıcı</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Kategori / Şehir</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Bütçe</th>
                    <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Teklif Sayısı</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Tarih</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Durum</th>
                    <th className="px-4 py-3.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, index) => {
                    const st = statusConfig[listing.status] || statusConfig.active;
                    return (
                      <motion.tr
                        key={listing.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.025 }}
                        className="border-b border-neutral-50 dark:border-dark-border/50 last:border-0 hover:bg-neutral-50/60 dark:hover:bg-dark-surfaceRaised/40 transition-colors"
                      >
                        {/* Title */}
                        <td className="px-6 py-3.5 max-w-[220px]">
                          <Link
                            href={`/listing/${listing.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-primary transition-colors truncate block"
                            title={listing.title}
                          >
                            {listing.title.length > 48
                              ? `${listing.title.slice(0, 48)}…`
                              : listing.title}
                          </Link>
                        </td>

                        {/* Buyer */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/profile/${listing.buyerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:text-primary transition-colors"
                          >
                            <span className="text-body-sm font-medium text-neutral-800 dark:text-dark-textPrimary block">{listing.buyerName}</span>
                            <span className="text-[11px] text-neutral-400 block">{listing.buyerEmail}</span>
                          </Link>
                        </td>

                        {/* Category / City */}
                        <td className="px-4 py-3.5">
                          <span className="text-body-sm text-neutral-700 dark:text-dark-textPrimary block">{listing.category}</span>
                          <span className="text-[11px] text-neutral-400 block">{listing.city}</span>
                        </td>

                        {/* Budget */}
                        <td className="px-4 py-3.5">
                          <span className="text-body-sm font-medium text-neutral-700 dark:text-dark-textPrimary">
                            {formatBudget(listing.budgetMin, listing.budgetMax)}
                          </span>
                        </td>

                        {/* Offer count */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-body-sm text-neutral-500">{listing.offerCount}</span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5">
                          <span className="text-body-sm text-neutral-400">{timeAgo(listing.createdAt)}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === listing.id ? null : listing.id)}
                              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                            >
                              <MoreVertical size={16} className="text-neutral-400" />
                            </button>
                            <AnimatePresence>
                              {openMenuId === listing.id && (
                                <ActionMenu
                                  listing={listing}
                                  onAction={handleAction}
                                  onClose={() => setOpenMenuId(null)}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {listings.length === 0 && (
              <div className="py-16 text-center">
                <FileText size={32} className="mx-auto mb-3 text-neutral-300" />
                <p className="text-body-lg text-neutral-500">İlan bulunamadı</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
