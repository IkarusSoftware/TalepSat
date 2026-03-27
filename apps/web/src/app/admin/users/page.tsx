'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Users, MoreVertical, CheckCircle, AlertTriangle,
  Shield, Crown, Zap, Star, Ban, UserCheck, Eye, Loader2,
  UserX, ShieldOff, ShieldCheck, BadgeCheck,
} from 'lucide-react';

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

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string; name: string; email: string; image: string | null;
  role: string; badge: string; verified: boolean; status: string;
  score: number; completedDeals: number;
  createdAt: string; lastSeen: string | null;
  listingCount: number; offerCount: number; reportCount: number;
}

// ── Config maps ───────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: 'Aktif',          color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500' },
  suspended: { label: 'Askıya Alındı',  color: 'text-amber-700  dark:text-amber-400',   bg: 'bg-amber-50   dark:bg-amber-500/10',   dot: 'bg-amber-500'   },
  banned:    { label: 'Yasaklandı',     color: 'text-red-700    dark:text-red-400',     bg: 'bg-red-50     dark:bg-red-500/10',     dot: 'bg-red-500'     },
};

const badgeConfig: Record<string, { label: string; icon: typeof Star; color: string; bg: string }> = {
  free:  { label: 'Başlangıç', icon: Star,   color: 'text-neutral-400',         bg: 'bg-neutral-100 dark:bg-neutral-700/30'          },
  basic: { label: 'Basic',     icon: Zap,    color: 'text-blue-600',             bg: 'bg-blue-50 dark:bg-blue-500/10'                 },
  plus:  { label: 'Plus',      icon: Crown,  color: 'text-amber-600',            bg: 'bg-amber-50 dark:bg-amber-500/10'               },
  pro:   { label: 'Pro',       icon: Shield, color: 'text-violet-600',           bg: 'bg-violet-50 dark:bg-violet-500/10'             },
};

const roleLabels: Record<string, string> = { buyer: 'Alıcı', seller: 'Satıcı', both: 'Alıcı & Satıcı', admin: 'Admin' };

const TABS = [
  { value: 'all',        label: 'Tümü'           },
  { value: 'verified',   label: 'Doğrulanmış'    },
  { value: 'unverified', label: 'Doğrulanmamış'  },
  { value: 'suspended',  label: 'Askıya Alınan'  },
  { value: 'banned',     label: 'Yasaklı'        },
];

const PLANS: { value: string; label: string; icon: typeof Star; color: string }[] = [
  { value: 'free',  label: 'Başlangıç', icon: Star,   color: 'text-neutral-500' },
  { value: 'basic', label: 'Basic',     icon: Zap,    color: 'text-blue-500'    },
  { value: 'plus',  label: 'Plus',      icon: Crown,  color: 'text-amber-500'   },
  { value: 'pro',   label: 'Pro',       icon: Shield, color: 'text-violet-500'  },
];

// ── Action dropdown ───────────────────────────────────────────────────────────
function ActionMenu({
  user,
  onAction,
  onClose,
}: {
  user: AdminUser;
  onAction: (userId: string, action: string, badge?: string) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function act(action: string, badge?: string) {
    setBusy(true);
    await onAction(user.id, action, badge);
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
      className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl z-20 overflow-hidden"
    >
      {busy && (
        <div className="absolute inset-0 bg-white/70 dark:bg-dark-surface/70 flex items-center justify-center z-10 rounded-xl">
          <Loader2 size={18} className="animate-spin text-primary" />
        </div>
      )}

      {/* Profile */}
      <div className="p-1.5">
        <Link
          href={`/profile/${user.id}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
        >
          <Eye size={14} className="text-neutral-400" /> Profili Görüntüle
        </Link>
      </div>

      <div className="border-t border-neutral-100 dark:border-dark-border" />

      {/* Verify */}
      <div className="p-1.5 space-y-0.5">
        {user.verified ? (
          <button onClick={() => act('unverify')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
            <ShieldOff size={14} /> Doğrulamayı Kaldır
          </button>
        ) : (
          <button onClick={() => act('verify')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
            <ShieldCheck size={14} /> Doğrula
          </button>
        )}
      </div>

      <div className="border-t border-neutral-100 dark:border-dark-border" />

      {/* Plan change */}
      <div className="p-1.5">
        <button
          onClick={() => setPlanOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-body-sm text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
        >
          <span className="flex items-center gap-2.5"><BadgeCheck size={14} className="text-violet-500" /> Plan Değiştir</span>
          <span className="text-[10px] text-neutral-400">{planOpen ? '▲' : '▼'}</span>
        </button>
        {planOpen && (
          <div className="mt-1 space-y-0.5 pl-2">
            {PLANS.map((p) => {
              const current = user.badge === p.value || (p.value === 'free' && !user.badge);
              return (
                <button
                  key={p.value}
                  onClick={() => act('setBadge', p.value)}
                  disabled={current}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
                    current
                      ? 'bg-primary/10 text-primary font-semibold cursor-default'
                      : 'text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised'
                  }`}
                >
                  <p.icon size={13} className={p.color} />
                  {p.label}
                  {current && <span className="ml-auto text-[10px] text-primary">Mevcut</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-100 dark:border-dark-border" />

      {/* Ban / Suspend */}
      <div className="p-1.5 space-y-0.5">
        {user.status === 'active' && (
          <>
            <button onClick={() => act('suspend')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
              <AlertTriangle size={14} /> Askıya Al
            </button>
            <button onClick={() => act('ban')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Ban size={14} /> Yasakla
            </button>
          </>
        )}
        {user.status === 'suspended' && (
          <>
            <button onClick={() => act('unsuspend')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
              <UserCheck size={14} /> Askıyı Kaldır
            </button>
            <button onClick={() => act('ban')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Ban size={14} /> Yasakla
            </button>
          </>
        )}
        {user.status === 'banned' && (
          <button onClick={() => act('unban')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
            <UserX size={14} /> Yasağı Kaldır
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        setUsers(await res.json());
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
  }, [searchQuery, activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleAction(userId: string, action: string, badge?: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, badge }),
    });
    if (res.ok) fetchUsers();
  }

  // Tab counts
  const counts = {
    all:        users.length,
    verified:   users.filter((u) => u.verified).length,
    unverified: users.filter((u) => !u.verified).length,
    suspended:  users.filter((u) => u.status === 'suspended').length,
    banned:     users.filter((u) => u.status === 'banned').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
          Kullanıcılar
          <span className="text-body-sm font-medium text-neutral-400 bg-neutral-100 dark:bg-dark-surfaceRaised px-2.5 py-1 rounded-full">
            {users.length}
          </span>
        </h1>
        <p className="mt-1 text-body-lg text-neutral-500">Kullanıcıları yönetin, durumlarını ve planlarını değiştirin.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((tab) => {
            const count = counts[tab.value as keyof typeof counts];
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
                    activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-dark-surfaceRaised text-neutral-500'
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
            placeholder="İsim veya e-posta ara..."
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
          <div className="py-16 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-dark-border bg-neutral-50/50 dark:bg-dark-surfaceRaised/30">
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-6 py-3.5">Kullanıcı</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Rol</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Plan</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Durum</th>
                    <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">İlan</th>
                    <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Teklif</th>
                    <th className="text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Rapor</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-4 py-3.5">Son Aktif</th>
                    <th className="px-4 py-3.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const st = statusConfig[user.status] || statusConfig.active;
                    const bd = badgeConfig[user.badge] || badgeConfig.free;
                    const BdIcon = bd.icon;

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.025 }}
                        className={`border-b border-neutral-50 dark:border-dark-border/50 last:border-0 hover:bg-neutral-50/60 dark:hover:bg-dark-surfaceRaised/40 transition-colors ${
                          user.status === 'banned' ? 'opacity-60' : ''
                        }`}
                      >
                        {/* User */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{user.name}</span>
                                {user.verified && <CheckCircle size={12} className="text-success shrink-0" />}
                              </div>
                              <span className="text-[11px] text-neutral-400">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <span className="text-body-sm text-neutral-500">{roleLabels[user.role] || user.role}</span>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${bd.bg} ${bd.color}`}>
                            <BdIcon size={11} />
                            {bd.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>

                        {/* Counts */}
                        <td className="px-4 py-3.5 text-center text-body-sm text-neutral-500">{user.listingCount}</td>
                        <td className="px-4 py-3.5 text-center text-body-sm text-neutral-500">{user.offerCount}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-body-sm font-medium ${user.reportCount > 0 ? 'text-error' : 'text-neutral-400'}`}>
                            {user.reportCount}
                          </span>
                        </td>

                        {/* Last seen */}
                        <td className="px-4 py-3.5 text-body-sm text-neutral-400">{timeAgo(user.lastSeen)}</td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                            >
                              <MoreVertical size={16} className="text-neutral-400" />
                            </button>
                            <AnimatePresence>
                              {openMenuId === user.id && (
                                <ActionMenu
                                  user={user}
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

            {users.length === 0 && (
              <div className="py-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-neutral-300" />
                <p className="text-body-lg text-neutral-500">Kullanıcı bulunamadı</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
