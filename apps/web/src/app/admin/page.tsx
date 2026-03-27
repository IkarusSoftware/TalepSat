'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users, FileText, ShoppingBag, TrendingUp, UserPlus,
  Activity, Flag, Clock, ArrowUpRight, Loader2,
  CreditCard, Star, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayValue { date: string; value: number }
interface NameValue { name: string; value: number }

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalOffers: number;
  totalRevenue: number;
  activeListings: number;
  pendingReports: number;
  pendingListings: number;
  newUsersMonth: number;
  activeUsers24h: number;
  completedDeals: number;
  weeklyActivity: number[];
  totalBoostRevenue: number;
  userGrowth: DayValue[];
  listingGrowth: DayValue[];
  salesGrowth: DayValue[];
  boostRevenue: DayValue[];
  offerStatusData: NameValue[];
  topCategories: NameValue[];
  topCities: NameValue[];
  userRoleData: NameValue[];
}

interface Report {
  id: string; reason: string; detail: string; status: string; createdAt: string;
  reporter: { id: string; name: string };
  reported: { id: string; name: string };
}

interface User {
  id: string; name: string; email: string; role: string;
  status: string; createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return new Intl.NumberFormat('tr-TR').format(n); }
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Chart color palette ───────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#94a3b8', '#3b82f6'];
const ROLE_COLORS = ['#6366f1', '#f59e0b', '#22c55e'];

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean; payload?: { value: number }[]; label?: string; currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg shadow-lg">
      <p className="text-neutral-400 mb-0.5">{label}</p>
      <p className="font-semibold">{currency ? fmtCurrency(payload[0].value) : fmt(payload[0].value)}</p>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <h2 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
      <Icon size={18} className="text-neutral-400" />
      {title}
    </h2>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, reportsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/reports?status=pending'),
          fetch('/api/admin/users?limit=5&sort=recent'),
        ]);
        const [statsData, reportsData, usersData] = await Promise.all([
          statsRes.json(),
          reportsRes.json(),
          usersRes.json(),
        ]);
        if (statsData && !statsData.error) setStats(statsData);
        setReports(Array.isArray(reportsData) ? reportsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  // Main stat cards
  const statCards = [
    { label: 'Toplam Kullanıcı', value: fmt(stats.totalUsers), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Toplam İlan', value: fmt(stats.totalListings), icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Toplam Teklif', value: fmt(stats.totalOffers), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Platform Geliri', value: fmtCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-success', bg: 'bg-emerald-500/10' },
  ];

  const quickStats = [
    { label: 'Aktif Kullanıcı (24s)', value: stats.activeUsers24h, icon: Activity },
    { label: 'Yeni Kayıt (30g)', value: stats.newUsersMonth, icon: UserPlus },
    { label: 'Bekleyen Rapor', value: stats.pendingReports, icon: Flag, alert: true },
    { label: 'Aktif İlan', value: stats.activeListings, icon: Clock },
    { label: 'Tamamlanan İş', value: stats.completedDeals, icon: Star },
    { label: 'Boost Geliri', value: fmtCurrency(stats.totalBoostRevenue), icon: CreditCard, isStr: true },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Gösterge Paneli</h1>
        <p className="mt-1 text-body-lg text-neutral-500">Platform genel durumu ve analizler.</p>
      </div>

      {/* ── Action required cards ── */}
      {(stats.pendingListings > 0 || stats.pendingReports > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.pendingListings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0 }}
              className="flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Onay Bekleyen İlanlar</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Yayına geçmeden önce incelemeniz gerekiyor</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="min-w-[2rem] h-8 px-2.5 rounded-lg bg-amber-500 text-white text-sm font-bold flex items-center justify-center">
                  {fmt(stats.pendingListings)}
                </span>
                <Link
                  href="/admin/listings"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors whitespace-nowrap"
                >
                  Görüntüle <ArrowUpRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}

          {stats.pendingReports > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Flag size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Açık Raporlar</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Kullanıcı raporları inceleme bekliyor</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="min-w-[2rem] h-8 px-2.5 rounded-lg bg-amber-500 text-white text-sm font-bold flex items-center justify-center">
                  {fmt(stats.pendingReports)}
                </span>
                <Link
                  href="/admin/reports"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors whitespace-nowrap"
                >
                  Görüntüle <ArrowUpRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Main stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="text-2xl font-bold text-neutral-900 dark:text-dark-textPrimary">{stat.value}</p>
            <p className="text-body-sm text-neutral-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
            className="flex items-center gap-3 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-4"
          >
            <stat.icon
              size={18}
              className={stat.alert && typeof stat.value === 'number' && stat.value > 0 ? 'text-amber-500' : 'text-neutral-400'}
            />
            <div>
              <p className={`text-lg font-bold leading-tight ${stat.alert && typeof stat.value === 'number' && stat.value > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                {stat.isStr ? stat.value : fmt(stat.value as number)}
              </p>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 1: User Growth + Listing Growth ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={Users} title="Kullanıcı Büyümesi (30 Gün)" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.userGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#userGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Listing growth */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.45 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={FileText} title="İlan Grafiği (30 Gün)" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.listingGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="listGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#listGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Row 2: Sales + Boost Revenue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={ShoppingBag} title="Tamamlanan Satışlar (30 Gün)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.salesGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Boost/subscription revenue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.55 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={CreditCard} title="Boost Geliri (30 Gün, ₺)" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.boostRevenue} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip currency />} />
              <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Row 3: Offer Status + User Roles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offer status pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={ShoppingBag} title="Teklif Durumu Dağılımı" />
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={stats.offerStatusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.offerStatusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [fmt(Number(v)), 'Teklif']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {stats.offerStatusData.filter((d) => d.value > 0).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-body-sm text-neutral-600 dark:text-dark-textSecondary">{item.name}</span>
                  </div>
                  <span className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* User role distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.65 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={Users} title="Kullanıcı Rol Dağılımı" />
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={stats.userRoleData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.userRoleData.map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [fmt(Number(v)), 'Kullanıcı']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {stats.userRoleData.map((item, i) => {
                const pct = stats.totalUsers > 0 ? Math.round((item.value / stats.totalUsers) * 100) : 0;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ROLE_COLORS[i] }} />
                        <span className="text-body-sm text-neutral-600 dark:text-dark-textSecondary">{item.name}</span>
                      </div>
                      <span className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{fmt(item.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: ROLE_COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Row 4: Top Categories + Top Cities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top categories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.7 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={FileText} title="En Aktif Kategoriler" />
          {stats.topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.topCategories} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-body-sm text-neutral-400 py-8 text-center">Henüz ilan yok</p>
          )}
        </motion.div>

        {/* Top cities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.75 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6"
        >
          <SectionTitle icon={Activity} title="En Aktif Şehirler" />
          {stats.topCities.length > 0 ? (
            <div className="space-y-3 mt-2">
              {stats.topCities.map((city, i) => {
                const max = stats.topCities[0]?.value ?? 1;
                const pct = Math.round((city.value / max) * 100);
                const colors = ['#6366f1','#f59e0b','#22c55e','#3b82f6','#a855f7','#ef4444'];
                return (
                  <div key={city.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium text-neutral-700 dark:text-dark-textPrimary">{city.name}</span>
                      <span className="text-body-sm text-neutral-400">{fmt(city.value)} ilan</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: colors[i] ?? '#6366f1' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-body-sm text-neutral-400 py-8 text-center">Henüz ilan yok</p>
          )}
        </motion.div>
      </div>

      {/* ── Row 5: Pending Reports + Recent Users ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pending reports */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.8 }}
          className="lg:col-span-3 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-dark-border">
            <h2 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
              <Flag size={18} className="text-amber-500" />
              Bekleyen Raporlar
              {reports.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 text-[11px] font-bold flex items-center justify-center">
                  {reports.length}
                </span>
              )}
            </h2>
            <Link href="/admin/reports" className="text-body-sm text-accent font-medium hover:text-accent-600 flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-dark-border/50">
            {reports.length === 0 ? (
              <p className="px-6 py-8 text-body-sm text-neutral-400 text-center">Bekleyen rapor yok 🎉</p>
            ) : (
              reports.slice(0, 4).map((report) => (
                <div key={report.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 shrink-0">
                    <Flag size={16} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary truncate">{report.reason}</p>
                    <p className="text-body-sm text-neutral-400 truncate">{report.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-body-sm text-neutral-500"><span className="text-neutral-400">Raporlayan:</span> {report.reporter.name}</p>
                    <p className="text-body-sm text-neutral-500"><span className="text-neutral-400">Raporlanan:</span> {report.reported.name}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{timeAgo(report.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent users */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.85 }}
          className="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-dark-border">
            <h2 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
              <Users size={18} className="text-neutral-400" />
              Son Kayıtlar
            </h2>
            <Link href="/admin/users" className="text-body-sm text-accent font-medium hover:text-accent-600 flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-dark-border/50">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-neutral-900 dark:text-dark-textPrimary truncate">{user.name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
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
    </div>
  );
}
