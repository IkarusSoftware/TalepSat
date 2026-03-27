import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  ShoppingBag,
  Users,
  CheckCircle,
  PenLine,
  BarChart2,
  Handshake,
  MapPin,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return n.toString();
}

function formatBudget(min: number, max: number) {
  const f = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.floor(n / 1000)}K`;
    return n.toString();
  };
  return `₺${f(min)} – ₺${f(max)}`;
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function getPageData() {
  const [
    activeListings,
    totalUsers,
    completedDeals,
    totalOffers,
    recentListings,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: 'active' } }),
    prisma.user.count(),
    prisma.offer.count({ where: { status: 'completed' } }),
    prisma.offer.count(),
    prisma.listing.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        category: true,
        city: true,
        budgetMin: true,
        budgetMax: true,
        expiresAt: true,
        _count: { select: { offers: true } },
      },
    }),
  ]);

  return { activeListings, totalUsers, completedDeals, totalOffers, recentListings };
}

// ── Components ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/60 dark:border-dark-border p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon size={24} className={color} />
      </div>
      <p className="text-3xl font-extrabold text-neutral-900 dark:text-dark-textPrimary tracking-tight mb-1">
        {value}
      </p>
      <p className="text-sm text-neutral-500 dark:text-dark-textSecondary">{label}</p>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
  color,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="relative mb-6">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon size={28} className="text-white" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-dark-textSecondary leading-relaxed max-w-xs">{description}</p>
    </div>
  );
}

function ListingCard({
  listing,
}: {
  listing: {
    id: string;
    title: string;
    category: string;
    city: string;
    budgetMin: number;
    budgetMax: number;
    expiresAt: Date;
    _count: { offers: number };
  };
}) {
  const daysLeft = Math.max(0, Math.floor((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000));

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/60 dark:border-dark-border p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-semibold">
          {listing.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-400">
          <Clock size={11} />
          {daysLeft === 0 ? 'Bugün bitiyor' : `${daysLeft}g`}
        </span>
      </div>
      <h3 className="font-semibold text-neutral-900 dark:text-dark-textPrimary group-hover:text-primary transition-colors line-clamp-2 leading-snug">
        {listing.title}
      </h3>
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <MapPin size={12} />
          {listing.city}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <MessageSquare size={12} />
            {listing._count.offers}
          </span>
          <span className="text-sm font-bold text-primary">
            {formatBudget(listing.budgetMin, listing.budgetMax)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const { activeListings, totalUsers, completedDeals, totalOffers, recentListings } =
    await getPageData();

  const stats = [
    { icon: FileText, value: fmt(activeListings), label: 'Aktif İlan', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Users, value: fmt(totalUsers), label: 'Kayıtlı Kullanıcı', color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { icon: CheckCircle, value: fmt(completedDeals), label: 'Tamamlanan Anlaşma', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: ShoppingBag, value: fmt(totalOffers), label: 'Verilen Teklif', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const steps = [
    {
      step: 1,
      icon: PenLine,
      title: 'İlanını Oluştur',
      description: 'Ne almak istediğini, bütçeni ve teslimat beklentini belirt. Birkaç dakikada ilan aç.',
      color: 'from-primary to-violet-500',
    },
    {
      step: 2,
      icon: BarChart2,
      title: 'Teklifleri Değerlendir',
      description: 'Satıcılar sana teklif gönderir. Fiyat, süre ve profile göre karşılaştır.',
      color: 'from-sky-500 to-blue-600',
    },
    {
      step: 3,
      icon: Handshake,
      title: 'Anlaşmayı Tamamla',
      description: 'En uygun teklifi kabul et, güvenli ödeme yap ve işini yaptır.',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 dark:from-primary/10 dark:via-transparent dark:to-violet-500/10 py-24 md:py-32">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Türkiye&apos;nin Reverse Marketplace&apos;i
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 dark:text-dark-textPrimary leading-tight tracking-tight mb-6">
            İhtiyacını Yaz,
            <br />
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              Satıcılar Yarışsın
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-600 dark:text-dark-textSecondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Siz ilan açın, satıcılar size teklif getirsin. Fiyatı siz belirleyin, en iyi anlaşmayı yapın.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 text-base"
            >
              İlan Oluştur <ArrowRight size={18} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border text-neutral-700 dark:text-dark-textPrimary font-semibold hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors text-base"
            >
              İlanları Keşfet
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ── */}
      <section className="py-20 bg-white dark:bg-dark-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-dark-textPrimary mb-3">
              Nasıl Çalışır?
            </h2>
            <p className="text-neutral-500 dark:text-dark-textSecondary text-base max-w-xl mx-auto">
              3 basit adımda istediğin ürün veya hizmet için en iyi teklifi al.
            </p>
          </div>

          {/* Steps with connector lines */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-primary/30 via-sky-400/30 to-emerald-400/30" />

            {steps.map((step) => (
              <StepCard key={step.step} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Listings ── */}
      {recentListings.length > 0 && (
        <section className="py-20 bg-neutral-50 dark:bg-dark-bg">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-dark-textPrimary mb-2">
                  Son İlanlar
                </h2>
                <p className="text-neutral-500 dark:text-dark-textSecondary text-base">
                  Yeni eklenen alım taleplerini keşfet ve teklif ver.
                </p>
              </div>
              <Link
                href="/explore"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Tüm İlanları Gör <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 dark:border-dark-border text-sm font-semibold text-neutral-700 dark:text-dark-textPrimary hover:bg-white dark:hover:bg-dark-surface transition-colors"
              >
                Tüm İlanları Gör <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-primary to-violet-600 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Hemen Başla
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto">
            Alıcılar için ücretsiz. İlanını oluştur ve dakikalar içinde teklifler almaya başla.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-colors shadow-lg text-base"
            >
              İlan Oluştur <ArrowRight size={18} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors text-base"
            >
              İlanları Keşfet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
