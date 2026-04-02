'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  ExternalLink,
  Filter,
  LayoutDashboard,
  Loader2,
  MapPinned,
  Sparkles,
  Star,
  Target,
  TriangleAlert,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { OfferStatusBadge } from '@/components/offers/offer-status-badge';
import { realtimeWindowEventName } from '@/components/realtime-provider';
import { analyticsTierFeatureTitle } from '../../../../../../shared/plan-analytics';
import {
  getSellerDashboardDerived,
  type SellerDashboardComparisonCard,
  type SellerDashboardInsight,
  type SellerDashboardKpi,
  type SellerDashboardListingRow,
  type SellerDashboardSignal,
} from '../../../../../../shared/seller-analytics-dashboard';
import type { SellerAnalyticsSnapshot } from '../../../../../../shared/seller-analytics';

type RangeValue = '7d' | '30d' | '90d' | 'custom';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
}

function formatValue(value: number, format: 'number' | 'currency' | 'percent' | 'score') {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `%${value}`;
  if (format === 'score') return value > 0 ? value.toFixed(1) : '-';
  return value.toLocaleString('tr-TR');
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Az once';
  if (hours < 24) return `${hours} saat once`;
  return `${Math.floor(hours / 24)} gun once`;
}

function deltaClass(value: number) {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-neutral-500';
}

function toneClasses(tone: 'accent' | 'success' | 'warning' | 'danger' | 'neutral') {
  switch (tone) {
    case 'accent':
      return { icon: 'text-accent', soft: 'bg-accent/10 text-accent', card: 'from-accent/[0.14] via-white to-white dark:from-accent/10 dark:via-dark-surface dark:to-dark-surface' };
    case 'success':
      return { icon: 'text-emerald-600 dark:text-emerald-400', soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', card: 'from-emerald-500/[0.12] via-white to-white dark:from-emerald-500/10 dark:via-dark-surface dark:to-dark-surface' };
    case 'warning':
      return { icon: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', card: 'from-amber-500/[0.12] via-white to-white dark:from-amber-500/10 dark:via-dark-surface dark:to-dark-surface' };
    case 'danger':
      return { icon: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', card: 'from-rose-500/[0.12] via-white to-white dark:from-rose-500/10 dark:via-dark-surface dark:to-dark-surface' };
    default:
      return { icon: 'text-neutral-700 dark:text-dark-textSecondary', soft: 'bg-neutral-100 text-neutral-700 dark:bg-dark-surfaceRaised dark:text-dark-textSecondary', card: 'from-neutral-100 via-white to-white dark:from-dark-surfaceRaised dark:via-dark-surface dark:to-dark-surface' };
  }
}

function MetricCard({ item }: { item: SellerDashboardKpi }) {
  const styles = toneClasses(item.tone);
  const Icon = item.key === 'totalOffers' ? Clock3 : item.key === 'acceptedOffers' ? CheckCircle2 : item.key === 'pendingOffers' ? Zap : item.key === 'totalRevenue' ? Banknote : item.key === 'acceptanceRate' ? Target : item.key === 'totalViews' ? Eye : item.key === 'averageScore' ? Star : LayoutDashboard;
  return (
    <div className={`rounded-3xl border border-neutral-200/70 bg-gradient-to-br p-5 dark:border-dark-border/80 ${styles.card}`}>
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${styles.soft}`}><Icon size={19} className={styles.icon} /></div>
      <p className="text-body-sm text-neutral-500">{item.label}</p>
      <p className={`mt-1 text-h2 font-bold ${styles.icon}`}>{formatValue(item.value, item.format)}</p>
      {item.hint ? <p className="mt-2 text-body-sm text-neutral-500">{item.hint}</p> : null}
    </div>
  );
}

function SignalCard({ signal }: { signal: SellerDashboardSignal }) {
  const styles = toneClasses(signal.tone);
  return (
    <div className={`rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur dark:border-dark-border/70 dark:bg-dark-surface/80 ${styles.card}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">{signal.title}</p>
      <p className={`mt-3 text-h3 font-bold ${styles.icon}`}>{signal.value}</p>
      <p className="mt-2 text-body-sm text-neutral-500">{signal.subtitle}</p>
    </div>
  );
}

function TrendColumns({ title, data, field }: { title: string; data: { label: string; offers: number; revenue: number }[]; field: 'offers' | 'revenue' }) {
  const max = Math.max(...data.map((item) => item[field]), 1);
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">{title}</h3>
          <p className="mt-1 text-body-sm text-neutral-500">Son dilimlerin ritmini hizli okumak icin sade trend gorunumu.</p>
        </div>
        <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${field === 'revenue' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-accent/10 text-accent'}`}>{field === 'revenue' ? 'Gelir' : 'Teklif'}</div>
      </div>
      <div className="flex h-52 items-end gap-3">
        {data.slice(-8).map((item) => {
          const height = Math.max(12, (item[field] / max) * 100);
          return (
            <div key={`${field}-${item.label}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end"><div className={`w-full rounded-t-2xl ${field === 'revenue' ? 'bg-gradient-to-t from-amber-500 to-amber-300' : 'bg-gradient-to-t from-accent to-accent-400'}`} style={{ height: `${height}%` }} /></div>
              <div className="text-center"><p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{field === 'revenue' ? formatCurrency(item[field]) : item[field]}</p><p className="mt-1 text-[11px] text-neutral-500">{item.label}</p></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistributionCard({ title, items, tone = 'accent' }: { title: string; items: { key: string; label: string; count: number; share: number }[]; tone?: 'accent' | 'warning' }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? <div className="rounded-2xl bg-neutral-50 p-4 text-body-sm text-neutral-500 dark:bg-dark-surfaceRaised">Henuz yeterli veri yok.</div> : items.map((item) => (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3"><p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{item.label}</p><p className="text-body-sm text-neutral-500">{item.count} adet · %{item.share}</p></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised"><div className={`h-full rounded-full ${tone === 'warning' ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-accent to-accent-400'}`} style={{ width: `${Math.max(8, item.share)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelCard({ views, offers, accepted, revenue, offerToViewRate, acceptanceRate, revenuePerAccepted }: { views: number; offers: number; accepted: number; revenue: number; offerToViewRate: number; acceptanceRate: number; revenuePerAccepted: number }) {
  const stages = [
    { key: 'views', label: 'Goruntulenme', value: views, note: 'Talebi ilk yakalayan seviye', width: 100, color: 'from-sky-500 to-sky-300' },
    { key: 'offers', label: 'Teklif', value: offers, note: `%${offerToViewRate} donusum`, width: Math.max(18, offerToViewRate), color: 'from-accent to-accent-400' },
    { key: 'accepted', label: 'Kabul', value: accepted, note: `%${acceptanceRate} kabul`, width: Math.max(18, acceptanceRate), color: 'from-emerald-500 to-emerald-300' },
  ];

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Donusum huni</h3>
          <p className="mt-1 text-body-sm text-neutral-500">Operasyonun daraldigi katmani hizli okumak icin.</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-right dark:bg-dark-surfaceRaised"><p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Kabul edilen is basi gelir</p><p className="mt-2 text-body-lg font-bold text-neutral-900 dark:text-dark-textPrimary">{formatCurrency(revenuePerAccepted)}</p></div>
      </div>
      <div className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.key} className="rounded-2xl bg-neutral-50 p-4 dark:bg-dark-surfaceRaised">
            <div className="mb-2 flex items-center justify-between gap-3"><p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{stage.label}</p><p className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{stage.value.toLocaleString('tr-TR')}</p></div>
            <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-dark-surface"><div className={`h-full rounded-full bg-gradient-to-r ${stage.color}`} style={{ width: `${stage.width}%` }} /></div>
            <p className="mt-2 text-body-sm text-neutral-500">{stage.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-4 dark:border-dark-border"><div className="flex items-center justify-between gap-3"><p className="text-body-sm text-neutral-500">Toplam gelir</p><p className="text-body-lg font-bold text-accent">{formatCurrency(revenue)}</p></div></div>
    </div>
  );
}

function InsightCard({ insights }: { insights: SellerDashboardInsight[] }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-accent/10 p-3 text-accent"><Sparkles size={18} /></div><div><h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Yonetim notlari</h3><p className="mt-1 text-body-sm text-neutral-500">Paneldeki sayilari karara ceviren kisa yorumlar.</p></div></div>
      <div className="space-y-3">
        {insights.length === 0 ? <div className="rounded-2xl bg-neutral-50 p-4 text-body-sm text-neutral-500 dark:bg-dark-surfaceRaised">Su an icin dikkat ceken bir risk ya da firsat sinyali olusmadi.</div> : insights.map((item) => {
          const styles = toneClasses(item.tone);
          return (
            <div key={item.title} className="rounded-2xl border border-neutral-200/70 p-4 dark:border-dark-border">
              <div className="mb-2 flex items-center gap-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles.soft}`}>{item.tone === 'success' ? 'Firsat' : item.tone === 'danger' ? 'Risk' : item.tone === 'warning' ? 'Dikkat' : 'Sinyal'}</span><p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{item.title}</p></div>
              <p className="text-body-sm text-neutral-500">{item.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonCard({ cards }: { cards: SellerDashboardComparisonCard[] }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-neutral-900 p-3 text-white dark:bg-dark-surfaceRaised"><Activity size={18} /></div><div><h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Onceki donem karsilastirmasi</h3><p className="mt-1 text-body-sm text-neutral-500">Pro seviyesinde karar vermeyi hizlandiran degisim tablosu.</p></div></div>
      <div className="space-y-3">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl bg-neutral-50 p-4 dark:bg-dark-surfaceRaised">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{item.label}</p><p className="mt-1 text-body-sm text-neutral-500">Onceki: {formatValue(item.previous, item.format)} · Simdi: {formatValue(item.current, item.format)}</p></div>
              <p className={`text-body-md font-bold ${deltaClass(item.delta)}`}>{item.delta > 0 ? '+' : ''}{item.format === 'percent' ? `${item.delta} puan` : `${item.delta}%`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityCard({ items }: { items: { key: string; label: string; count: number; share: number; revenue: number }[] }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-primary-lighter p-3 text-primary dark:bg-primary/20 dark:text-blue-300"><MapPinned size={18} /></div><div><h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Sehir kirilimi</h3><p className="mt-1 text-body-sm text-neutral-500">Pazar yogunlugunu lokal bazda okumak icin.</p></div></div>
      <div className="space-y-3">
        {items.length === 0 ? <div className="rounded-2xl bg-neutral-50 p-4 text-body-sm text-neutral-500 dark:bg-dark-surfaceRaised">Sehir bazli anlamli veri henuz olusmadi.</div> : items.slice(0, 6).map((item) => (
          <div key={item.key} className="rounded-2xl border border-neutral-200/70 p-4 dark:border-dark-border">
            <div className="flex items-center justify-between gap-3"><p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{item.label}</p><p className="text-body-sm text-neutral-500">%{item.share}</p></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised"><div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400" style={{ width: `${Math.max(8, item.share)}%` }} /></div>
            <div className="mt-2 flex items-center justify-between gap-3 text-body-sm text-neutral-500"><span>{item.count} teklif</span><span>{formatCurrency(item.revenue)}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingTable({ rows, pro }: { rows: SellerDashboardListingRow[]; pro: boolean }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">{pro ? 'Kritik ilan performansi tablosu' : 'En guclu ilanlar'}</h3><p className="mt-1 text-body-sm text-neutral-500">{pro ? 'Gelir, goruntulenme, teklif ve kabul dengesini ayni tabloda okuyabilirsin.' : 'Plus seviyesinde en cok is ureten ilanlarini karsilastir.'}</p></div>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-body-sm font-semibold text-accent">Ilanlarim<ArrowRight size={14} /></Link>
      </div>
      {rows.length === 0 ? <div className="rounded-2xl bg-neutral-50 p-4 text-body-sm text-neutral-500 dark:bg-dark-surfaceRaised">Henuz yeterli ilan performans verisi yok.</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-dark-border">
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Ilan</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Teklif</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Kabul</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Goruntulenme</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Donusum</th>
                <th className="pb-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Gelir</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, pro ? 8 : 5).map((row) => (
                <tr key={row.listingId} className="border-b border-neutral-100 align-top dark:border-dark-border/60">
                  <td className="py-4 pr-4"><Link href={`/listing/${row.listingId}`} className="block font-semibold text-neutral-900 hover:text-accent dark:text-dark-textPrimary">{row.title}</Link><p className="mt-1 text-body-sm text-neutral-500">{row.category} · {row.city}</p></td>
                  <td className="py-4 pr-4 text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{row.count}</td>
                  <td className="py-4 pr-4 text-body-md font-semibold text-emerald-600 dark:text-emerald-400">{row.accepted} <span className="text-body-sm text-neutral-500">(%{row.acceptanceRate})</span></td>
                  <td className="py-4 pr-4 text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{row.views}</td>
                  <td className="py-4 pr-4"><div className="min-w-[120px]"><div className="mb-1 flex items-center justify-between gap-3 text-body-sm"><span className="text-neutral-500">Teklif/goruntulenme</span><span className="font-semibold text-neutral-900 dark:text-dark-textPrimary">%{row.offerToViewRate}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised"><div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-400" style={{ width: `${Math.max(8, row.offerToViewRate)}%` }} /></div></div></td>
                  <td className="py-4 text-body-md font-bold text-accent">{formatCurrency(row.revenue)}<div className="mt-1 text-body-sm font-medium text-neutral-500">%{row.revenueShare} pay</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentOffersCard({ snapshot }: { snapshot: SellerAnalyticsSnapshot }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Son teklifler</h3><p className="mt-1 text-body-sm text-neutral-500">Hareketli islerin son durumu.</p></div><Link href="/offers" className="inline-flex items-center gap-1 text-body-sm font-semibold text-accent">Teklifler<ArrowRight size={14} /></Link></div>
      {snapshot.recentOffers.length === 0 ? <div className="rounded-2xl bg-neutral-50 p-4 text-body-sm text-neutral-500 dark:bg-dark-surfaceRaised">Henuz teklif yok.</div> : <div className="space-y-3">{snapshot.recentOffers.map((offer) => (
        <div key={offer.id} className="rounded-2xl border border-neutral-200/70 p-4 dark:border-dark-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><span className="rounded-md bg-primary-lighter px-2 py-0.5 text-body-sm font-medium text-primary dark:bg-primary/20 dark:text-blue-300">{offer.listingCategory}</span><OfferStatusBadge status={offer.status} /></div><Link href={`/offer/${offer.id}`} className="block truncate text-body-md font-semibold text-neutral-900 hover:text-accent dark:text-dark-textPrimary">{offer.listingTitle}</Link><p className="mt-1 text-body-sm text-neutral-400">{offer.listingCity} · {timeAgo(offer.updatedAt)}</p></div>
            <div className="shrink-0 text-right"><p className="text-body-lg font-bold text-accent">{formatCurrency(offer.price)}</p><p className="text-body-sm text-neutral-400">{offer.deliveryDays} gun</p></div>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}

function QuickActionsCard({ pro }: { pro: boolean }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
      <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Hizli islemler</h3>
      <div className="mt-4 space-y-2">
        <Link href="/explore" className="flex items-center gap-3 rounded-2xl p-3 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised"><ExternalLink size={16} className="text-accent" /><span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">Yeni ilanlari kesfet</span></Link>
        <Link href="/offers" className="flex items-center gap-3 rounded-2xl p-3 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised"><Clock3 size={16} className="text-amber-500" /><span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">Teklifleri yonet</span></Link>
        <Link href="/subscription" className="flex items-center gap-3 rounded-2xl p-3 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised"><Sparkles size={16} className="text-primary" /><span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">{pro ? 'Pro araclarini ve plani yonet' : 'Planini guclendir'}</span></Link>
      </div>
    </div>
  );
}

function BasicSellerDashboard({ snapshot }: { snapshot: SellerAnalyticsSnapshot }) {
  const summaryCards = [
    { label: 'Toplam teklif', value: String(snapshot.summary.totalOffers), icon: Clock3, tone: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Kabul edilen', value: String(snapshot.summary.acceptedOffers), icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Bekleyen', value: String(snapshot.summary.pendingOffers), icon: Zap, tone: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Toplam kazanc', value: formatCurrency(snapshot.summary.totalRevenue), icon: Banknote, tone: 'text-accent', bg: 'bg-accent-lighter dark:bg-accent/10' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent"><TrendingUp size={14} />{analyticsTierFeatureTitle(snapshot.tier)}</div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Satici Paneli</h1>
          <p className="mt-2 text-body-lg text-neutral-500">Basic plan icin sade satis takibi gorunumu.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}><item.icon size={18} className={item.tone} /></div>
            <p className="mb-1 text-body-sm text-neutral-500">{item.label}</p>
            <p className={`text-h2 font-bold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <RecentOffersCard snapshot={snapshot} />
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 dark:border-dark-border/80 dark:bg-dark-surface">
            <h2 className="mb-4 text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">Performans ozeti</h2>
            <div className="mb-4"><div className="mb-2 flex items-center justify-between"><span className="text-body-sm text-neutral-500">Kabul orani</span><span className="text-body-sm font-bold text-neutral-900 dark:text-dark-textPrimary">%{snapshot.summary.acceptanceRate}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${snapshot.summary.acceptanceRate}%` }} /></div></div>
            <div className="space-y-3 border-t border-neutral-100 pt-4 dark:border-dark-border">
              <div className="flex items-center justify-between"><span className="text-body-md text-neutral-500">Reddedilen</span><span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.summary.rejectedOffers}</span></div>
              <div className="flex items-center justify-between"><span className="text-body-md text-neutral-500">Karsi teklif</span><span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.summary.counterOffers}</span></div>
              <div className="flex items-center justify-between"><span className="text-body-md text-neutral-500">Ortalama puan</span><span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.summary.averageScore > 0 ? snapshot.summary.averageScore.toFixed(1) : '-'}</span></div>
              <div className="flex items-center justify-between"><span className="text-body-md text-neutral-500">Goruntulenme</span><span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.summary.totalViews}</span></div>
            </div>
          </div>
          <QuickActionsCard pro={false} />
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  const [snapshot, setSnapshot] = useState<SellerAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeValue>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [listingId, setListingId] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('range', range);
    if (range === 'custom') {
      if (customFrom) params.set('from', customFrom);
      if (customTo) params.set('to', customTo);
    }
    if (listingId) params.set('listingId', listingId);
    if (category) params.set('category', category);
    if (city) params.set('city', city);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/seller?${params.toString()}`, { cache: 'no-store', credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Satici paneli yuklenemedi.');
      setSnapshot(data);
    } catch (err: any) {
      setError(err?.message || 'Satici paneli yuklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [category, city, customFrom, customTo, listingId, range]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onRealtime(event: Event) {
      const detail = (event as CustomEvent<{ type?: string }>).detail;
      if (detail?.type === 'subscription.updated') load();
    }
    window.addEventListener(realtimeWindowEventName, onRealtime as EventListener);
    return () => window.removeEventListener(realtimeWindowEventName, onRealtime as EventListener);
  }, [load]);

  const derived = useMemo(() => (snapshot ? getSellerDashboardDerived(snapshot) : null), [snapshot]);
  const listingOptions = useMemo(() => derived?.listingRows || [], [derived]);
  const categoryOptions = useMemo(() => derived?.categoryShares || [], [derived]);
  const cityOptions = useMemo(() => derived?.cityShares || [], [derived]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  if (error || !snapshot || !derived) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <div className="mb-3 flex items-center gap-3"><TriangleAlert size={20} /><h1 className="text-h4 font-semibold">Panel hazir degil</h1></div>
          <p className="text-body-md">{error || 'Satici paneli yuklenemedi.'}</p>
        </div>
      </div>
    );
  }

  if (snapshot.tier === 'none') {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.08] to-white p-8 dark:to-dark-surface">
          <div className="mb-4 inline-flex rounded-2xl bg-accent/10 p-3 text-accent"><Sparkles size={22} /></div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Satici Analitik Merkezi</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-neutral-600 dark:text-dark-textSecondary">Free planda analitik acik degil. Basic temel satis takibi, Plus orta seviye kirilimlar ve Pro kritik yonetim panellerini acar.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/pricing" className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-body-md font-semibold text-white hover:bg-accent-600">Planlari incele<ArrowRight size={14} /></Link>
            <Link href="/subscription" className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 px-5 text-body-md font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised">Abonelik</Link>
          </div>
        </div>
      </div>
    );
  }

  if (snapshot.tier === 'basic') return <BasicSellerDashboard snapshot={snapshot} />;

  const pro = snapshot.tier === 'pro';

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <section className="overflow-hidden rounded-[32px] border border-neutral-200/70 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 p-7 text-white dark:border-dark-border/80">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90"><BarChart3 size={14} />{analyticsTierFeatureTitle(snapshot.tier)}</div>
            <h1 className="max-w-2xl text-[clamp(2rem,4vw,3.4rem)] font-bold leading-tight">{pro ? 'Pro Yonetim ve Analitik Merkezi' : 'Plus Performans ve Gelir Kontrol Paneli'}</h1>
            <p className="mt-3 max-w-2xl text-body-lg text-white/70">{pro ? 'Filtreler, karsilastirmalar, sehir ve ilan tablolariyla daha kritik operasyon kararlarini buradan yonet.' : 'Trend, kategori ve ilan bazli sinyalleri tek sayfada toplayan daha zengin seller paneli.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {(['7d', '30d', '90d'] as RangeValue[]).map((item) => <button key={item} type="button" onClick={() => setRange(item)} className={`h-11 rounded-2xl px-4 text-body-sm font-semibold transition ${range === item ? 'bg-white text-neutral-900' : 'bg-white/10 text-white hover:bg-white/16'}`}>{item}</button>)}
              {pro ? <button type="button" onClick={() => setRange('custom')} className={`h-11 rounded-2xl px-4 text-body-sm font-semibold transition ${range === 'custom' ? 'bg-white text-neutral-900' : 'bg-white/10 text-white hover:bg-white/16'}`}>Ozel tarih</button> : null}
              <button type="button" onClick={load} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 px-4 text-body-sm font-semibold text-white hover:bg-white/10"><TrendingUp size={14} />Yenile</button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">{derived.signals.map((signal) => <SignalCard key={`${signal.title}-${signal.value}`} signal={signal} />)}</div>
        </div>
      </section>

      {pro ? (
        <section className="mt-6 rounded-3xl border border-neutral-200/70 bg-white p-5 dark:border-dark-border/80 dark:bg-dark-surface">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">Pro komuta katmani</h2><p className="mt-1 text-body-sm text-neutral-500">Tum filtreler, karsilastirma odaklari ve CSV export tek yerde.</p></div>
            <button type="button" onClick={() => { const params = new URLSearchParams(); params.set('format', 'csv'); params.set('range', range); if (range === 'custom') { if (customFrom) params.set('from', customFrom); if (customTo) params.set('to', customTo); } if (listingId) params.set('listingId', listingId); if (category) params.set('category', category); if (city) params.set('city', city); window.location.href = `/api/analytics/seller/export?${params.toString()}`; }} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-neutral-200 px-4 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"><Download size={14} />CSV indir</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-12 rounded-2xl border border-neutral-200 bg-white px-3 text-body-sm dark:border-dark-border dark:bg-dark-bg" />
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-12 rounded-2xl border border-neutral-200 bg-white px-3 text-body-sm dark:border-dark-border dark:bg-dark-bg" />
            <select value={listingId} onChange={(e) => setListingId(e.target.value)} className="h-12 rounded-2xl border border-neutral-200 bg-white px-3 text-body-sm dark:border-dark-border dark:bg-dark-bg"><option value="">Tum ilanlar</option>{listingOptions.map((item) => <option key={item.listingId} value={item.listingId}>{item.title}</option>)}</select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 rounded-2xl border border-neutral-200 bg-white px-3 text-body-sm dark:border-dark-border dark:bg-dark-bg"><option value="">Tum kategoriler</option>{categoryOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
            <div className="flex gap-3"><select value={city} onChange={(e) => setCity(e.target.value)} className="h-12 flex-1 rounded-2xl border border-neutral-200 bg-white px-3 text-body-sm dark:border-dark-border dark:bg-dark-bg"><option value="">Tum sehirler</option>{cityOptions.map((item) => <option key={item.key} value={item.label}>{item.label}</option>)}</select><button type="button" onClick={load} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-4 text-body-sm font-semibold text-white dark:bg-dark-surfaceRaised dark:text-dark-textPrimary"><Filter size={14} /></button></div>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{derived.kpis.map((item) => <MetricCard key={item.key} item={item} />)}</section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">{snapshot.trends ? <><TrendColumns title="Teklif trendi" data={snapshot.trends.offers} field="offers" /><TrendColumns title="Gelir trendi" data={snapshot.trends.revenue} field="revenue" /></> : null}</div>
          <div className="grid gap-6 xl:grid-cols-2"><FunnelCard {...derived.funnel} /><DistributionCard title="Durum dagilimi" items={derived.statusShares} tone="warning" /></div>
          <div className="grid gap-6 xl:grid-cols-2"><DistributionCard title="Kategori momentumu" items={derived.categoryShares.map((item) => ({ key: item.key, label: item.label, count: item.count, share: item.share }))} /><RecentOffersCard snapshot={snapshot} /></div>
          <ListingTable rows={derived.listingRows} pro={pro} />
        </div>
        <div className="space-y-6">
          <InsightCard insights={derived.insights} />
          {pro && derived.comparisonCards.length ? <ComparisonCard cards={derived.comparisonCards as SellerDashboardComparisonCard[]} /> : null}
          {pro ? <CityCard items={derived.cityShares} /> : null}
          <QuickActionsCard pro={pro} />
        </div>
      </section>
    </div>
  );
}
