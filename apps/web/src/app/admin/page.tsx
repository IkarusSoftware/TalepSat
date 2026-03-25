'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users, FileText, ShoppingBag, TrendingUp, UserPlus,
  Activity, Flag, Clock, ArrowUpRight, BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { adminStats, adminReports, adminUsers } from '@/lib/mock-data';

function formatNumber(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n);
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n);
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

const statCards = [
  { label: 'Toplam Kullanıcı', value: adminStats.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Toplam İlan', value: adminStats.totalListings, icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Toplam Teklif', value: adminStats.totalOffers, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Toplam Gelir', value: adminStats.totalRevenue, icon: TrendingUp, color: 'text-success', bg: 'bg-emerald-500/10', isCurrency: true },
];

const quickStats = [
  { label: 'Aktif Kullanıcı (30g)', value: adminStats.activeUsers30d, icon: Activity },
  { label: 'Bugün Yeni Kayıt', value: adminStats.newUsersToday, icon: UserPlus },
  { label: 'Bekleyen Rapor', value: adminStats.pendingReports, icon: Flag, alert: true },
  { label: 'İlan Onayı Bekleyen', value: adminStats.pendingListingApprovals, icon: Clock, alert: true },
];

export default function AdminDashboard() {
  const pendingReports = adminReports.filter((r) => r.status === 'pending');
  const recentUsers = adminUsers.slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Gösterge Paneli</h1>
        <p className="mt-1 text-body-lg text-neutral-500">Platform genel durumu ve son aktiviteler.</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-dark-textPrimary">
              {stat.isCurrency ? `₺${formatPrice(stat.value)}` : formatNumber(stat.value)}
            </p>
            <p className="text-body-sm text-neutral-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            className="flex items-center gap-3 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-4"
          >
            <stat.icon size={18} className={stat.alert && stat.value > 0 ? 'text-amber-500' : 'text-neutral-400'} />
            <div>
              <p className={`text-lg font-bold ${stat.alert && stat.value > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                {stat.value}
              </p>
              <p className="text-body-sm text-neutral-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pending reports */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="lg:col-span-3 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-dark-border">
            <h2 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
              <Flag size={18} className="text-amber-500" />
              Bekleyen Raporlar
              {pendingReports.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 text-[11px] font-bold flex items-center justify-center">
                  {pendingReports.length}
                </span>
              )}
            </h2>
            <Link href="/admin/reports" className="text-body-sm text-accent font-medium hover:text-accent-600 flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-dark-border/50">
            {pendingReports.slice(0, 4).map((report) => (
              <div key={report.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  report.priority === 'high' ? 'bg-red-50 dark:bg-red-500/10' :
                  report.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-500/10' :
                  'bg-neutral-100 dark:bg-neutral-500/10'
                }`}>
                  {report.priority === 'high' ? <AlertTriangle size={16} className="text-error" /> :
                   <Flag size={16} className={report.priority === 'medium' ? 'text-amber-500' : 'text-neutral-400'} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary truncate">{report.reason}</p>
                  <p className="text-body-sm text-neutral-400 truncate">{report.targetTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    report.type === 'listing' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' :
                    report.type === 'user' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' :
                    report.type === 'offer' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' :
                    'bg-neutral-100 dark:bg-neutral-500/10 text-neutral-500'
                  }`}>
                    {report.type === 'listing' ? 'İlan' : report.type === 'user' ? 'Kullanıcı' : report.type === 'offer' ? 'Teklif' : 'Mesaj'}
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{timeAgo(report.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent users */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-dark-border">
            <h2 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
              <Users size={18} className="text-neutral-400" />
              Son Kullanıcılar
            </h2>
            <Link href="/admin/users" className="text-body-sm text-accent font-medium hover:text-accent-600 flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-dark-border/50">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-neutral-900 dark:text-dark-textPrimary truncate">{user.name}</p>
                  <p className="text-[11px] text-neutral-400">{user.email}</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  user.status === 'active' ? 'bg-success' :
                  user.status === 'suspended' ? 'bg-amber-400' : 'bg-error'
                }`} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.6 }}
        className="mt-6 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
      >
        <h2 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-neutral-400" />
          Platform Aktivitesi (Son 7 Gün)
        </h2>
        <div className="flex items-end gap-3 h-40">
          {[65, 42, 78, 55, 90, 72, 85].map((val, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ duration: 0.6, delay: 0.7 + i * 0.05, ease: 'easeOut' }}
              className="flex-1 rounded-t-lg bg-accent/80 hover:bg-accent transition-colors relative group"
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-neutral-900 dark:bg-dark-surfaceRaised text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {val} işlem
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div key={day} className="flex-1 text-center text-[11px] text-neutral-400">{day}</div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
