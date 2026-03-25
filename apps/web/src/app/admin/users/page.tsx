'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, MoreVertical, CheckCircle,
  AlertTriangle, Shield, Crown, Zap, Star,
  Ban, UserCheck, Eye, Mail,
} from 'lucide-react';
import { adminUsers } from '@/lib/mock-data';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

const statusConfig = {
  active: { label: 'Aktif', color: 'text-success', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
  suspended: { label: 'Askıya Alındı', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: AlertTriangle },
  banned: { label: 'Yasaklı', color: 'text-error', bg: 'bg-red-50 dark:bg-red-500/10', icon: Ban },
};

const planConfig = {
  free: { label: 'Başlangıç', icon: Star, color: 'text-neutral-400' },
  basic: { label: 'Basic', icon: Zap, color: 'text-blue-500' },
  plus: { label: 'Plus', icon: Crown, color: 'text-amber-500' },
  pro: { label: 'Pro', icon: Shield, color: 'text-accent' },
};

const roleLabels: Record<string, string> = { buyer: 'Alıcı', seller: 'Satıcı', both: 'Alıcı & Satıcı' };

const tabs = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Askıda' },
  { value: 'banned', label: 'Yasaklı' },
];

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = adminUsers;
    if (activeTab !== 'all') result = result.filter((u) => u.status === activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTab, searchQuery]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
            Kullanıcılar
            <span className="text-body-sm font-medium text-neutral-400 bg-neutral-100 dark:bg-dark-surfaceRaised px-2.5 py-1 rounded-full">
              {adminUsers.length}
            </span>
          </h1>
          <p className="mt-1 text-body-lg text-neutral-500">Kullanıcıları yönetin, durumlarını değiştirin.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-body-md font-medium transition-colors ${
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
            placeholder="İsim veya e-posta ara..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-dark-border">
                <th className="text-left text-body-sm font-semibold text-neutral-500 px-6 py-3.5">Kullanıcı</th>
                <th className="text-left text-body-sm font-semibold text-neutral-500 px-4 py-3.5">Rol</th>
                <th className="text-left text-body-sm font-semibold text-neutral-500 px-4 py-3.5">Plan</th>
                <th className="text-left text-body-sm font-semibold text-neutral-500 px-4 py-3.5">Durum</th>
                <th className="text-center text-body-sm font-semibold text-neutral-500 px-4 py-3.5">İlan</th>
                <th className="text-center text-body-sm font-semibold text-neutral-500 px-4 py-3.5">Teklif</th>
                <th className="text-center text-body-sm font-semibold text-neutral-500 px-4 py-3.5">Rapor</th>
                <th className="text-left text-body-sm font-semibold text-neutral-500 px-4 py-3.5">Son Aktif</th>
                <th className="px-4 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => {
                const status = statusConfig[user.status];
                const plan = planConfig[user.plan];
                const StatusIcon = status.icon;
                const PlanIcon = plan.icon;

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="border-b border-neutral-50 dark:border-dark-border/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                          {user.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{user.name}</span>
                            {user.verified && <CheckCircle size={12} className="text-success" />}
                          </div>
                          <span className="text-body-sm text-neutral-400">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-body-sm text-neutral-600 dark:text-dark-textSecondary">{roleLabels[user.role]}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <PlanIcon size={14} className={plan.color} />
                        <span className="text-body-sm font-medium text-neutral-700 dark:text-dark-textSecondary">{plan.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-body-sm text-neutral-600 dark:text-dark-textSecondary">{user.listingsCount}</td>
                    <td className="px-4 py-3.5 text-center text-body-sm text-neutral-600 dark:text-dark-textSecondary">{user.offersCount}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-body-sm font-medium ${user.reportsCount > 0 ? 'text-error' : 'text-neutral-400'}`}>
                        {user.reportsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-body-sm text-neutral-400">{timeAgo(user.lastActiveAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                        >
                          <MoreVertical size={16} className="text-neutral-400" />
                        </button>
                        {actionMenuId === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl z-10 py-1.5">
                            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-body-sm text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                              <Eye size={14} className="text-neutral-400" /> Profili Görüntüle
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-body-sm text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                              <Mail size={14} className="text-neutral-400" /> E-posta Gönder
                            </button>
                            <hr className="my-1 border-neutral-100 dark:border-dark-border" />
                            {user.status === 'active' && (
                              <button className="w-full flex items-center gap-2.5 px-4 py-2 text-body-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                                <AlertTriangle size={14} /> Askıya Al
                              </button>
                            )}
                            {user.status === 'suspended' && (
                              <button className="w-full flex items-center gap-2.5 px-4 py-2 text-body-sm text-success hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                                <UserCheck size={14} /> Aktifleştir
                              </button>
                            )}
                            {user.status !== 'banned' && (
                              <button className="w-full flex items-center gap-2.5 px-4 py-2 text-body-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <Ban size={14} /> Yasakla
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-body-lg text-neutral-500">Kullanıcı bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
