'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, Search, CheckCircle, XCircle,
  Eye, User, Clock, X, Loader2, AlertTriangle,
} from 'lucide-react';

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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const reasonLabels: Record<Report['reason'], string> = {
  spam: 'Spam',
  harassment: 'Taciz',
  fraud: 'Dolandırıcılık',
  inappropriate: 'Uygunsuz İçerik',
  other: 'Diğer',
};

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
  reviewed: { label: 'İnceleniyor', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Eye },
  resolved: { label: 'Çözüldü', color: 'text-success', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
};

const tabs = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'reviewed', label: 'İncelenen' },
  { value: 'resolved', label: 'Çözülen' },
];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });
      if (res.ok) {
        setSelectedReport(null);
        await fetchReports();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
          Raporlar & Şikayetler
          {pendingCount > 0 && (
            <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 text-body-sm font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </h1>
        <p className="mt-1 text-body-lg text-neutral-500">Kullanıcı şikayetlerini inceleyin ve yönetin.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-body-md font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rapor ara..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* Reports list */}
      {!loading && (
        <div className="space-y-3">
          {reports.map((report, index) => {
            const status = statusConfig[report.status];
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                onClick={() => setSelectedReport(report)}
                className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">
                        {reasonLabels[report.reason]}
                      </h3>
                    </div>
                    <p className="text-body-sm text-neutral-500 mb-2 line-clamp-1">{report.detail}</p>
                    <div className="flex items-center gap-4 text-body-sm text-neutral-400">
                      <span>
                        Raporlayan:{' '}
                        <span className="text-neutral-600 dark:text-dark-textSecondary font-medium">
                          {report.reporter.name}
                        </span>
                      </span>
                      <span>
                        Raporlanan:{' '}
                        <span className="text-neutral-600 dark:text-dark-textSecondary font-medium">
                          {report.reported.name}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.color}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-1.5">{timeAgo(report.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="py-20 text-center">
          <Flag size={32} className="mx-auto mb-3 text-neutral-300" />
          <h3 className="text-h4 font-semibold text-neutral-500 mb-1">Rapor bulunamadı</h3>
          <p className="text-body-md text-neutral-400">
            {activeTab === 'pending' ? 'Bekleyen rapor yok.' : 'Filtrelere uygun rapor bulunamadı.'}
          </p>
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedReport(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-white dark:bg-dark-surface border-l border-neutral-200 dark:border-dark-border shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">Rapor Detayı</h2>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                  >
                    <X size={20} className="text-neutral-400" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Sebep</label>
                    <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      {reasonLabels[selectedReport.reason]}
                    </p>
                  </div>

                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Detay</label>
                    <p className="text-body-md text-neutral-700 dark:text-dark-textSecondary leading-relaxed">
                      {selectedReport.detail}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Durum</label>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig[selectedReport.status].bg} ${statusConfig[selectedReport.status].color}`}
                      >
                        {statusConfig[selectedReport.status].label}
                      </span>
                    </div>
                    <div>
                      <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Tarih</label>
                      <span className="text-body-md text-neutral-900 dark:text-dark-textPrimary">
                        {timeAgo(selectedReport.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Raporlayan</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px]">
                        {getInitials(selectedReport.reporter.name)}
                      </div>
                      <div>
                        <span className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary block">
                          {selectedReport.reporter.name}
                        </span>
                        <span className="text-body-sm text-neutral-400">{selectedReport.reporter.email}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Raporlanan</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-[11px]">
                        {getInitials(selectedReport.reported.name)}
                      </div>
                      <div>
                        <span className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary block">
                          {selectedReport.reported.name}
                        </span>
                        <span className="text-body-sm text-neutral-400">{selectedReport.reported.email}</span>
                      </div>
                    </div>
                  </div>

                  {selectedReport.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-dark-border">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleAction(selectedReport.id, 'resolve')}
                        className="flex-1 h-11 rounded-xl bg-success text-white text-body-md font-semibold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Çözüldü İşaretle
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleAction(selectedReport.id, 'dismiss')}
                        className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
