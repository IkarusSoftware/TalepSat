'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, Search, AlertTriangle, CheckCircle, XCircle,
  Eye, FileText, User, MessageSquare, ShoppingBag,
  Clock, X,
} from 'lucide-react';
import { adminReports, type AdminReport } from '@/lib/mock-data';

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

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
  reviewed: { label: 'İnceleniyor', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Eye },
  resolved: { label: 'Çözüldü', color: 'text-success', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
  dismissed: { label: 'Reddedildi', color: 'text-neutral-500', bg: 'bg-neutral-100 dark:bg-neutral-500/10', icon: XCircle },
};

const typeConfig = {
  listing: { label: 'İlan', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  user: { label: 'Kullanıcı', icon: User, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  offer: { label: 'Teklif', icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  message: { label: 'Mesaj', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
};

const priorityConfig = {
  high: { label: 'Yüksek', color: 'text-error', bg: 'bg-red-50 dark:bg-red-500/10', dot: 'bg-error' },
  medium: { label: 'Orta', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', dot: 'bg-amber-400' },
  low: { label: 'Düşük', color: 'text-neutral-500', bg: 'bg-neutral-100 dark:bg-neutral-500/10', dot: 'bg-neutral-400' },
};

const tabs = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'reviewed', label: 'İncelenen' },
  { value: 'resolved', label: 'Çözülen' },
  { value: 'dismissed', label: 'Reddedilen' },
];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  const filtered = useMemo(() => {
    let result = adminReports;
    if (activeTab !== 'all') result = result.filter((r) => r.status === activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) => r.reason.toLowerCase().includes(q) || r.targetTitle.toLowerCase().includes(q) || r.reportedBy.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTab, searchQuery]);

  const pendingCount = adminReports.filter((r) => r.status === 'pending').length;

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

      {/* Reports list */}
      <div className="space-y-3">
        {filtered.map((report, index) => {
          const status = statusConfig[report.status];
          const type = typeConfig[report.type];
          const priority = priorityConfig[report.priority];
          const StatusIcon = status.icon;
          const TypeIcon = type.icon;

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
                <div className="relative">
                  <div className={`w-11 h-11 rounded-xl ${type.bg} flex items-center justify-center`}>
                    <TypeIcon size={20} className={type.color} />
                  </div>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${priority.dot} border-2 border-white dark:border-dark-surface`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">{report.reason}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${type.bg} ${type.color}`}>
                      {type.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priority.bg} ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-body-sm text-neutral-500 mb-2 line-clamp-1">{report.description}</p>
                  <div className="flex items-center gap-4 text-body-sm text-neutral-400">
                    <span>Hedef: <span className="text-neutral-600 dark:text-dark-textSecondary font-medium">{report.targetTitle}</span></span>
                    <span>Raporlayan: <span className="text-neutral-600 dark:text-dark-textSecondary font-medium">{report.reportedBy}</span></span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.color}`}>
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

      {filtered.length === 0 && (
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
                    <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">{selectedReport.reason}</p>
                  </div>

                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Açıklama</label>
                    <p className="text-body-md text-neutral-700 dark:text-dark-textSecondary leading-relaxed">{selectedReport.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Tür</label>
                      <div className="flex items-center gap-2">
                        {(() => { const t = typeConfig[selectedReport.type]; const TI = t.icon; return <><TI size={16} className={t.color} /><span className="text-body-md text-neutral-900 dark:text-dark-textPrimary">{t.label}</span></>; })()}
                      </div>
                    </div>
                    <div>
                      <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Öncelik</label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${priorityConfig[selectedReport.priority].dot}`} />
                        <span className="text-body-md text-neutral-900 dark:text-dark-textPrimary">{priorityConfig[selectedReport.priority].label}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Durum</label>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig[selectedReport.status].bg} ${statusConfig[selectedReport.status].color}`}>
                        {statusConfig[selectedReport.status].label}
                      </span>
                    </div>
                    <div>
                      <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Tarih</label>
                      <span className="text-body-md text-neutral-900 dark:text-dark-textPrimary">{timeAgo(selectedReport.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Hedef</label>
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border">
                      <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">{selectedReport.targetTitle}</p>
                      <p className="text-body-sm text-neutral-400">ID: {selectedReport.targetId}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-body-sm font-medium text-neutral-400 mb-1.5 block">Raporlayan</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px]">
                        {selectedReport.reportedByInitials}
                      </div>
                      <span className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">{selectedReport.reportedBy}</span>
                    </div>
                  </div>

                  {selectedReport.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-dark-border">
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="flex-1 h-11 rounded-xl bg-success text-white text-body-md font-semibold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} /> Çözüldü İşaretle
                      </button>
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> Reddet
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
