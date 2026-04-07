'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle,
  Crown,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Star,
  UserCheck,
  Users,
  UserX,
  Zap,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  badge: string;
  verified: boolean;
  status: string;
  score: number;
  completedDeals: number;
  createdAt: string;
  lastSeen: string | null;
  listingCount: number;
  offerCount: number;
  reportCount: number;
}

const statusConfig: Record<string, { label: string; text: string; bg: string }> = {
  active: { label: 'Aktif', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  suspended: { label: 'Askida', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  banned: { label: 'Yasakli', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  deactivated: { label: 'Devre Disi', text: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-500/10' },
};

const badgeConfig: Record<string, { label: string; icon: typeof Star; className: string }> = {
  free: { label: 'Baslangic', icon: Star, className: 'text-neutral-500' },
  basic: { label: 'Basic', icon: Zap, className: 'text-blue-500' },
  plus: { label: 'Plus', icon: Crown, className: 'text-amber-500' },
  pro: { label: 'Pro', icon: Shield, className: 'text-violet-500' },
};

const tabs = [
  { value: 'all', label: 'Tumu' },
  { value: 'verified', label: 'Dogrulanmis' },
  { value: 'unverified', label: 'Dogrulanmamis' },
  { value: 'suspended', label: 'Askida' },
  { value: 'banned', label: 'Yasakli' },
  { value: 'deactivated', label: 'Devre Disi' },
];

const planOptions = ['free', 'basic', 'plus', 'pro'] as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(date: string | null) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az once';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  return `${Math.floor(hours / 24)}g`;
}

function roleLabel(role: string) {
  switch (role) {
    case 'buyer':
      return 'Alici';
    case 'seller':
      return 'Satici';
    case 'both':
      return 'Alici & Satici';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (activeTab !== 'all') params.set('status', activeTab);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Hata: ${res.status}`);
      }

      setUsers(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Sunucuya ulasilamadi.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const counts = useMemo(
    () => ({
      all: users.length,
      verified: users.filter((user) => user.verified).length,
      unverified: users.filter((user) => !user.verified).length,
      suspended: users.filter((user) => user.status === 'suspended').length,
      banned: users.filter((user) => user.status === 'banned').length,
      deactivated: users.filter((user) => user.status === 'deactivated').length,
    }),
    [users],
  );

  async function runAction(userId: string, action: string, badge?: string) {
    setPendingUserId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, badge }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Islem tamamlanamadi.');
      }

      await fetchUsers();
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Islem tamamlanamadi.');
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Kullanicilar
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-body-sm font-medium text-neutral-400 dark:bg-dark-surfaceRaised">
            {users.length}
          </span>
        </h1>
        <p className="mt-1 text-body-lg text-neutral-500">Kullanici durumlari, planlar ve deaktivasyon akislarini buradan yonet.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-body-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised'
              }`}
            >
              {tab.label}
              {counts[tab.value as keyof typeof counts] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-500 dark:bg-dark-surfaceRaised'
                }`}>
                  {counts[tab.value as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Isim veya e-posta ara..."
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-body-md placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-surface"
          />
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <AlertTriangle size={15} />
          {fetchError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200/50 bg-white dark:border-dark-border dark:bg-dark-surface">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-body-lg text-neutral-500">Kullanici bulunamadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 dark:border-dark-border dark:bg-dark-surfaceRaised/30">
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Kullanici</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Rol</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Plan</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Durum</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Ilan</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Teklif</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Rapor</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Son Aktif</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const status = statusConfig[user.status] || statusConfig.active;
                  const badge = badgeConfig[user.badge] || badgeConfig.free;
                  const BadgeIcon = badge.icon;

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 dark:border-dark-border/50 dark:hover:bg-dark-surfaceRaised/40 ${
                        user.status === 'banned' || user.status === 'deactivated' ? 'opacity-70' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{user.name}</span>
                              {user.verified && <CheckCircle size={12} className="shrink-0 text-success" />}
                            </div>
                            <span className="text-[11px] text-neutral-400">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-body-sm text-neutral-500">{roleLabel(user.role)}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-700 dark:bg-dark-surfaceRaised dark:text-dark-textSecondary">
                          <BadgeIcon size={11} className={badge.className} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-body-sm text-neutral-500">{user.listingCount}</td>
                      <td className="px-4 py-3.5 text-center text-body-sm text-neutral-500">{user.offerCount}</td>
                      <td className="px-4 py-3.5 text-center text-body-sm font-medium">
                        <span className={user.reportCount > 0 ? 'text-error' : 'text-neutral-400'}>{user.reportCount}</span>
                      </td>
                      <td className="px-4 py-3.5 text-body-sm text-neutral-400">{timeAgo(user.lastSeen)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/profile/${user.id}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-body-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
                          >
                            <Eye size={13} />
                            Profil
                          </Link>

                          <ActionButton
                            disabled={pendingUserId === user.id}
                            onClick={() => runAction(user.id, user.verified ? 'unverify' : 'verify')}
                            icon={user.verified ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                            label={user.verified ? 'Dogrulamayi Kaldir' : 'Dogrula'}
                          />

                          {planOptions.map((plan) => (
                            <ActionButton
                              key={plan}
                              disabled={pendingUserId === user.id || user.badge === plan || (plan === 'free' && !user.badge)}
                              onClick={() => runAction(user.id, 'setBadge', plan)}
                              icon={<BadgeCheck size={13} />}
                              label={`Plan: ${plan}`}
                            />
                          ))}

                          {user.status === 'active' && (
                            <>
                              <ActionButton
                                disabled={pendingUserId === user.id}
                                onClick={() => runAction(user.id, 'suspend')}
                                icon={<AlertTriangle size={13} />}
                                label="Askıya Al"
                                tone="warn"
                              />
                              <ActionButton
                                disabled={pendingUserId === user.id}
                                onClick={() => runAction(user.id, 'ban')}
                                icon={<Ban size={13} />}
                                label="Yasakla"
                                tone="danger"
                              />
                            </>
                          )}

                          {user.status === 'suspended' && (
                            <ActionButton
                              disabled={pendingUserId === user.id}
                              onClick={() => runAction(user.id, 'unsuspend')}
                              icon={<UserCheck size={13} />}
                              label="Askıyı Kaldır"
                              tone="success"
                            />
                          )}

                          {user.status === 'banned' && (
                            <ActionButton
                              disabled={pendingUserId === user.id}
                              onClick={() => runAction(user.id, 'unban')}
                              icon={<UserX size={13} />}
                              label="Yasagi Kaldir"
                              tone="success"
                            />
                          )}

                          {user.status === 'deactivated' && (
                            <ActionButton
                              disabled={pendingUserId === user.id}
                              onClick={() => runAction(user.id, 'reactivate')}
                              icon={<RotateCcw size={13} />}
                              label="Yeniden Ac"
                              tone="success"
                            />
                          )}

                          {pendingUserId === user.id && (
                            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-body-sm text-neutral-500 dark:border-dark-border dark:text-dark-textSecondary">
                              <Loader2 size={13} className="animate-spin" />
                              Isleniyor
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'warn' | 'danger' | 'success';
}) {
  const toneClass =
    tone === 'warn'
      ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/10'
      : tone === 'danger'
        ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10'
        : tone === 'success'
          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-body-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
