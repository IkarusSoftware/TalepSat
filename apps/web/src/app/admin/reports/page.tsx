'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  Eye, MoreVertical, Search, User, Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: 'spam' | 'harassment' | 'fraud' | 'inappropriate' | 'other';
  detail: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  reporter: ReportUser;
  reported: ReportUser;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  return `${Math.floor(hours / 24)}g`;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Config maps ───────────────────────────────────────────────────────────────
const reasonLabels: Record<Report['reason'], string> = {
  spam: 'Spam',
  harassment: 'Taciz',
  fraud: 'Dolandırıcılık',
  inappropriate: 'Uygunsuz İçerik',
  other: 'Diğer',
};

const statusConfig: Record<Report['status'], { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'Bekleyen',  color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   dot: 'bg-amber-500'   },
  reviewed: { label: 'İncelendi', color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10',     dot: 'bg-blue-500'    },
  resolved: { label: 'Çözüldü',   color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500' },
};

const TABS = [
  { value: 'all',      label: 'Tümü'      },
  { value: 'pending',  label: 'Bekleyen'  },
  { value: 'reviewed', label: 'İncelendi' },
  { value: 'resolved', label: 'Çözüldü'  },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-50 dark:border-dark-border/50">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded bg-neutral-100 dark:bg-dark-surfaceRaised animate-pulse" style={{ width: i === 0 || i === 1 ? '120px' : i === 6 ? '64px' : '80px' }} />
        </td>
      ))}
      <td className="px-4 py-3.5 w-10">
        <div className="h-7 w-7 rounded-lg bg-neutral-100 dark:bg-dark-surfaceRaised animate-pulse" />
      </td>
    </tr>
  );
}

// ── Action dropdown ───────────────────────────────────────────────────────────
function ActionMenu({
  report,
  onAction,
  onClose,
}: {
  report: Report;
  onAction: (reportId: string, action: 'resolve' | 'review' | 'dismiss') => Promise<void>;
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

  async function act(action: 'resolve' | 'review' | 'dismiss') {
    setBusy(true);
    await onAction(report.id, action);
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
      className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl z-20 overflow-hidden"
    >
      {busy && (
        <div className="absolute inset-0 bg-white/70 dark:bg-dark-surface/70 flex items-center justify-center z-10 rounded-xl">
          <Loader2 size={18} className="animate-spin text-primary" />
        </div>
      )}

      <div className="p-1.5 space-y-0.5">
        {report.status === 'pending' && (
          <>
            <button
              onClick={() => act('review')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <Eye size={14} /> İncele
            </button>
            <button
              onClick={() => act('resolve')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            >
              <CheckCircle size={14} /> Çöz
            </button>
            <button
              onClick={() => act('dismiss')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <XCircle size={14} /> Reddet
            </button>
          </>
        )}
        {report.status === 'reviewed' && (
          <button
            onClick={() => act('resolve')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            <CheckCircle size={14} /> Çöz
          </button>
        )}
        {report.status === 'resolved' && (
          <p className="px-3 py-2 text-body-sm text-neutral-400">İşlem yok</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ name, variant = 'primary' }: { name: string; variant?: 'primary' | 'red' }) {
  const cls = variant === 'red'
    ? 'bg-red-500/10 text-red-500'
    : 'bg-primary/10 text-primary';
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${cls}`}>
      {getInitials(name)}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [activeTab, setActiveTab]     = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const [reports, setReports]         = useState<Report[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.ok) {
        setReports(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setFetchError(data.error || `Hata: ${res.status}`);
        if (res.status === 401) window.location.href = '/admin/login';
      }
    } catch {
      setFetchError('Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleAction(reportId: string, action: 'resolve' | 'review' | 'dismiss') {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    });
    if (res.ok) fetchReports();
  }

  // Counts for tabs
  const allReports     = reports;
  const pendingCount   = allReports.filter((r) => r.status === 'pending').length;
  const reviewedCount  = allReports.filter((r) => r.status === 'reviewed').length;
  const resolvedCount  = allReports.filter((r) => r.status === 'resolved').length;

  const tabCounts: Record<string, number> = {
    all:      allReports.length,
    pending:  pendingCount,
    reviewed: reviewedCount,
    resolved: resolvedCount,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
          Raporlar
          {pendingCount > 0 && (
            <span className="text-body-sm font-medium text-amber-600 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
              {pendingCount} bekleyen
            </span>
          )}
        </h1>
        <p className="mt-1 text-body-lg text-neutral-500">Kullanıcı şikayetlerini inceleyin ve yönetin.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <Shield size={18} className="text-neutral-500" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Toplam</p>
            <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{allReports.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Bekleyen</p>
            <p className="text-h3 font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Çözüldü</p>
            <p className="text-h3 font-bold text-emerald-600">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((tab) => {
            const count = tabCounts[tab.value];
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
            placeholder="İsim veya detay ara..."
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-dark-border bg-neutral-50/50 dark:bg-dark-surfaceRaised/30">
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-6 py-3.5">Şikayet Eden</th>
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Şikayet Edilen</th>
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Neden</th>
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Detay</th>
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Tarih</th>
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Durum</th>
                <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                reports.map((report, index) => {
                  const st = statusConfig[report.status];

                  return (
                    <motion.tr
                      key={report.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.025 }}
                      className="border-b border-neutral-50 dark:border-dark-border/50 last:border-0 hover:bg-neutral-50/60 dark:hover:bg-dark-surfaceRaised/40 transition-colors"
                    >
                      {/* Reporter */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={report.reporter.name} variant="primary" />
                          <div className="min-w-0">
                            <p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary truncate max-w-[120px]">
                              {report.reporter.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Reported */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={report.reported.name} variant="red" />
                          <div className="min-w-0">
                            <p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary truncate max-w-[120px]">
                              {report.reported.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5">
                        <span className="text-body-sm text-neutral-700 dark:text-dark-textSecondary whitespace-nowrap">
                          {reasonLabels[report.reason]}
                        </span>
                      </td>

                      {/* Detail (truncated) */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-body-sm text-neutral-500 truncate" title={report.detail}>
                          {report.detail || '—'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-body-sm text-neutral-400 whitespace-nowrap">
                        {timeAgo(report.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${st.bg} ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                          >
                            <MoreVertical size={16} className="text-neutral-400" />
                          </button>
                          <AnimatePresence>
                            {openMenuId === report.id && (
                              <ActionMenu
                                report={report}
                                onAction={handleAction}
                                onClose={() => setOpenMenuId(null)}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="py-16 text-center">
            <Shield size={32} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-body-lg font-semibold text-neutral-500">Rapor bulunamadı</p>
            <p className="text-body-md text-neutral-400 mt-1">
              {activeTab === 'pending' ? 'Bekleyen şikayet yok.' : 'Filtrelere uygun rapor bulunamadı.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
