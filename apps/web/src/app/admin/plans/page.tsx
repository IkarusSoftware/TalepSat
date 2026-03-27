'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Zap, Crown, Shield, Save, Loader2,
  CheckCircle, ToggleLeft, ToggleRight, Infinity,
  TrendingUp, Gift, Headphones, BadgeCheck, Palette,
  Clock, AlertTriangle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  offersPerMonth: number | null;
  boostPerMonth: number | null;
  maxListings: number | null;
  analytics: boolean;
  prioritySupport: boolean;
  verifiedBadge: boolean;
  customProfile: boolean;
  responseTime: string;
  sortOrder: number;
  updatedAt: string;
}

// ── Plan meta ──────────────────────────────────────────────────────────────────
const PLAN_META: Record<string, {
  icon: typeof Star;
  gradient: string;
  ring: string;
  iconBg: string;
  iconColor: string;
  label: string;
}> = {
  free: {
    icon: Star,
    gradient: 'from-neutral-50 to-neutral-100 dark:from-neutral-800/40 dark:to-neutral-800/20',
    ring: 'ring-neutral-200 dark:ring-neutral-700',
    iconBg: 'bg-neutral-100 dark:bg-neutral-700/50',
    iconColor: 'text-neutral-500',
    label: 'Başlangıç',
  },
  basic: {
    icon: Zap,
    gradient: 'from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10',
    ring: 'ring-blue-200 dark:ring-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600',
    label: 'Basic',
  },
  plus: {
    icon: Crown,
    gradient: 'from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-amber-900/10',
    ring: 'ring-amber-200 dark:ring-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600',
    label: 'Plus',
  },
  pro: {
    icon: Shield,
    gradient: 'from-violet-50 to-violet-50/50 dark:from-violet-900/20 dark:to-violet-900/10',
    ring: 'ring-violet-200 dark:ring-violet-800/50',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600',
    label: 'Pro',
  },
};

// ── Feature toggle row ─────────────────────────────────────────────────────────
function FeatureToggle({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Star;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised/60 transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="text-neutral-400 shrink-0" />
        <span className="text-body-sm text-neutral-600 dark:text-dark-textSecondary">{label}</span>
      </div>
      {value
        ? <ToggleRight size={22} className="text-primary shrink-0" />
        : <ToggleLeft size={22} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
      }
    </button>
  );
}

// ── Limit input ────────────────────────────────────────────────────────────────
function LimitInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Star;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  const isUnlimited = value === null;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Icon size={14} className="text-neutral-400 shrink-0" />
      <span className="text-body-sm text-neutral-600 dark:text-dark-textSecondary flex-1 min-w-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(isUnlimited ? 0 : null)}
          title={isUnlimited ? 'Limitsiz' : 'Sınır koy'}
          className={`p-1 rounded transition-colors ${isUnlimited ? 'text-primary' : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-400'}`}
        >
          <Infinity size={15} />
        </button>
        {isUnlimited ? (
          <span className="text-body-sm font-medium text-primary w-16 text-right">Sınırsız</span>
        ) : (
          <input
            type="number"
            min={0}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={placeholder ?? '0'}
            className="w-16 h-7 text-right text-body-sm rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>
    </div>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  onSave,
}: {
  plan: Plan;
  onSave: (slug: string, data: Partial<Plan>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Plan>({ ...plan });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const meta = PLAN_META[plan.slug] ?? PLAN_META.free;
  const Icon = meta.icon;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(plan);

  function set<K extends keyof Plan>(key: K, value: Plan[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(plan.slug, draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-b ${meta.gradient} ring-1 ${meta.ring} rounded-2xl overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={18} className={meta.iconColor} />
          </div>
          <div>
            <p className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{draft.name}</p>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide">{plan.slug}</p>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wide block mb-1">Aylık (₺)</label>
            <input
              type="number"
              min={0}
              value={draft.priceMonthly}
              onChange={(e) => set('priceMonthly', Number(e.target.value))}
              className="w-full h-8 px-2.5 text-body-sm font-semibold rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wide block mb-1">Yıllık (₺)</label>
            <input
              type="number"
              min={0}
              value={draft.priceYearly}
              onChange={(e) => set('priceYearly', Number(e.target.value))}
              className="w-full h-8 px-2.5 text-body-sm font-semibold rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="px-2 py-1 border-b border-black/5 dark:border-white/5 space-y-0.5">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Limitler</p>
        <LimitInput
          icon={TrendingUp}
          label="Aylık teklif"
          value={draft.offersPerMonth}
          onChange={(v) => set('offersPerMonth', v)}
        />
        <LimitInput
          icon={Zap}
          label="Aylık öne çıkarma"
          value={draft.boostPerMonth}
          onChange={(v) => set('boostPerMonth', v)}
        />
        <LimitInput
          icon={Gift}
          label="Aktif ilan"
          value={draft.maxListings}
          onChange={(v) => set('maxListings', v)}
        />

        {/* Response time */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <Clock size={14} className="text-neutral-400 shrink-0" />
          <span className="text-body-sm text-neutral-600 dark:text-dark-textSecondary flex-1">Yanıt süresi</span>
          <input
            type="text"
            value={draft.responseTime}
            onChange={(e) => set('responseTime', e.target.value)}
            className="w-20 h-7 text-right text-body-sm rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Features */}
      <div className="px-2 py-1 flex-1 space-y-0.5">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Özellikler</p>
        <FeatureToggle icon={TrendingUp}   label="Analitik"             value={draft.analytics}       onChange={(v) => set('analytics', v)} />
        <FeatureToggle icon={Headphones}   label="Öncelikli destek"    value={draft.prioritySupport} onChange={(v) => set('prioritySupport', v)} />
        <FeatureToggle icon={BadgeCheck}   label="Onaylı rozet"        value={draft.verifiedBadge}   onChange={(v) => set('verifiedBadge', v)} />
        <FeatureToggle icon={Palette}      label="Özel profil"         value={draft.customProfile}   onChange={(v) => set('customProfile', v)} />
      </div>

      {/* Save */}
      <div className="px-5 py-4 border-t border-black/5 dark:border-white/5">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`w-full h-9 rounded-xl text-body-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            saved
              ? 'bg-success/10 text-success'
              : isDirty
                ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <><CheckCircle size={15} /> Kaydedildi</>
          ) : (
            <><Save size={15} /> Kaydet</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/plans')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
        else setError(data.error || 'Planlar yüklenemedi');
      })
      .catch(() => setError('Sunucuya ulaşılamadı'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(slug: string, data: Partial<Plan>) {
    const res = await fetch('/api/admin/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlans((prev) => prev.map((p) => (p.slug === slug ? updated : p)));
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Kaydetme başarısız');
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Plan Yönetimi
        </h1>
        <p className="mt-1 text-body-lg text-neutral-500">
          Abonelik planlarının fiyatlarını, limitlerini ve özelliklerini düzenleyin.
          Değişiklikler anında geçerli olur.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-body-sm">
        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
        <span>
          Limit değişiklikleri yeni işlemlerden itibaren geçerli olur. Mevcut kullanıcıların aktif
          teklifleri veya ilanları etkilenmez.
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-error py-8">
          <AlertTriangle size={18} />
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.slug} plan={plan} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
