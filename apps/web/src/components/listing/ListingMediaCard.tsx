'use client';

import type { PointerEvent as ReactPointerEvent, ReactNode, UIEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  ImageIcon,
  MapPin,
  MessageSquare,
  Star,
} from 'lucide-react';
import { isRenderableImageUrl } from '../../../../../shared/media';

type CardVariant = 'full' | 'compact';

type ListingCardRecord = {
  id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  expiresAt?: string | null;
  offerCount: number;
  buyerId?: string;
  buyerName?: string;
  buyerInitials?: string;
  buyerScore?: number;
  buyerVerified?: boolean;
  buyerImage?: string | null;
  images?: string[];
};

type OwnerListingRecord = {
  id: string;
  title: string;
  category: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  deliveryUrgency: string;
  viewCount: number;
  status: string;
  expiresAt: string;
  offerCount: number;
  images?: string[];
};

interface ListingMediaCardProps {
  listing: ListingCardRecord;
  variant?: CardVariant;
  href?: string;
  isFavorited?: boolean;
  onFavoriteToggle?: (listingId: string) => void;
}

interface ListingOwnerCardProps {
  listing: OwnerListingRecord;
  status: { label: string; dotClassName: string; textClassName: string };
  deliveryLabel: string;
  href?: string;
  infoBanner?: ReactNode;
  footerLead: ReactNode;
  footerActions?: ReactNode;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBudget(min: number, max: number) {
  if (min === 0 && max === 0) return 'Teklif Bekliyor';
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

function getTimeLeft(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days === 0) return 'Bugun bitiyor';
  return `${days} gun kaldi`;
}

function getValidImages(images?: string[]) {
  return (images ?? [])
    .filter((item) => isRenderableImageUrl(item));
}

function getCategoryTone(category: string) {
  const normalized = category.toLocaleLowerCase('tr-TR');

  if (normalized.includes('elektronik')) {
    return {
      background: 'from-sky-600 via-primary to-slate-950',
      surface: 'bg-white/15',
      text: 'text-white',
    };
  }

  if (normalized.includes('tekstil') || normalized.includes('moda')) {
    return {
      background: 'from-fuchsia-700 via-rose-500 to-orange-400',
      surface: 'bg-white/15',
      text: 'text-white',
    };
  }

  if (normalized.includes('gida') || normalized.includes('ambalaj')) {
    return {
      background: 'from-emerald-700 via-emerald-500 to-lime-300',
      surface: 'bg-black/10',
      text: 'text-white',
    };
  }

  if (normalized.includes('insaat') || normalized.includes('endustri')) {
    return {
      background: 'from-stone-700 via-zinc-600 to-amber-300',
      surface: 'bg-black/15',
      text: 'text-white',
    };
  }

  return {
    background: 'from-primary via-primary-light to-accent',
    surface: 'bg-white/15',
    text: 'text-white',
  };
}

function BuyerIdentity({
  listing,
  compact = false,
}: {
  listing: ListingCardRecord;
  compact?: boolean;
}) {
  const initials = listing.buyerInitials || listing.buyerName?.slice(0, 2)?.toUpperCase() || 'TS';

  const avatar = (
    <div className="relative shrink-0">
      <div className={clsx(
        'overflow-hidden rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised flex items-center justify-center text-neutral-600 dark:text-dark-textSecondary font-semibold',
        compact ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-[11px]',
      )}>
        {listing.buyerImage ? (
          <img
            src={listing.buyerImage}
            alt={listing.buyerName || 'Kullanici'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          initials
        )}
      </div>
      {listing.buyerVerified && (
        <CheckCircle2
          size={compact ? 12 : 13}
          className="absolute -right-1 -bottom-0.5 text-success fill-white dark:fill-dark-surface"
        />
      )}
    </div>
  );

  const meta = (
    <div className="min-w-0">
      {!compact && listing.buyerName && (
        <p className="text-body-sm font-medium text-neutral-700 dark:text-dark-textPrimary truncate">
          {listing.buyerName}
        </p>
      )}
      {typeof listing.buyerScore === 'number' ? (
        <div className="flex items-center gap-1 text-body-sm text-neutral-400">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          {listing.buyerScore}
        </div>
      ) : !compact ? (
        <p className="text-body-sm text-neutral-400">Yeni alici</p>
      ) : null}
    </div>
  );

  if (!listing.buyerId) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {avatar}
        {meta}
      </div>
    );
  }

  return (
    <Link
      href={`/profile/${listing.buyerId}`}
      className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity"
      data-stop-link="true"
      onClick={(event) => event.stopPropagation()}
    >
      {avatar}
      {meta}
    </Link>
  );
}

function ListingCardMedia({
  listingId,
  title,
  category,
  images,
  href,
  variant = 'full',
  isFavorited,
  onFavoriteToggle,
}: {
  listingId: string;
  title: string;
  category: string;
  images?: string[];
  href: string;
  variant?: CardVariant;
  isFavorited?: boolean;
  onFavoriteToggle?: (listingId: string) => void;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{ x: number; y: number; scrollLeft: number } | null>(null);
  const draggingRef = useRef(false);
  const validImages = useMemo(() => getValidImages(images), [images]);
  const previewImages = useMemo(() => validImages.slice(0, 5), [validImages]);
  const tone = useMemo(() => getCategoryTone(category), [category]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    if (scrollerRef.current) {
      scrollerRef.current.scrollLeft = 0;
    }
  }, [previewImages.length, listingId]);

  const scrollToIndex = (nextIndex: number) => {
    const node = scrollerRef.current;
    if (!node) return;
    const safeIndex = Math.max(0, Math.min(nextIndex, previewImages.length - 1));
    node.scrollTo({ left: node.clientWidth * safeIndex, behavior: 'smooth' });
    setActiveIndex(safeIndex);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStateRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: scrollerRef.current?.scrollLeft ?? 0,
    };
    draggingRef.current = false;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerStateRef.current) return;
    const scrollLeft = scrollerRef.current?.scrollLeft ?? 0;
    const deltaX = Math.abs(event.clientX - pointerStateRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerStateRef.current.y);
    const scrollDelta = Math.abs(scrollLeft - pointerStateRef.current.scrollLeft);

    if (deltaX > 6 || deltaY > 6 || scrollDelta > 6) {
      draggingRef.current = true;
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) {
      router.push(href);
    }
    pointerStateRef.current = null;
    requestAnimationFrame(() => {
      draggingRef.current = false;
    });
  };

  const handlePointerCancel = () => {
    pointerStateRef.current = null;
    draggingRef.current = false;
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    if (!node.clientWidth) return;
    const nextIndex = Math.round(node.scrollLeft / node.clientWidth);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  return (
    <div className={clsx('relative overflow-hidden', variant === 'compact' ? 'aspect-[16/9]' : 'aspect-video')}>
      {previewImages.length > 0 ? (
        <div
          ref={scrollerRef}
          className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
        >
          {previewImages.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-full w-full shrink-0 snap-start bg-neutral-100 dark:bg-dark-surfaceRaised">
              <img
                src={image}
                alt={`${title} gorsel ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => router.push(href)}
          className={clsx(
            'relative w-full h-full bg-gradient-to-br text-left overflow-hidden',
            tone.background,
          )}
        >
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute left-6 bottom-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <span className={clsx(
              'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
              tone.surface,
              tone.text,
            )}>
              <ImageIcon size={12} />
              Gorsel yok
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
                {category}
              </p>
              <p className="mt-1 text-body-lg font-semibold text-white line-clamp-2 max-w-[80%]">
                {title}
              </p>
            </div>
          </div>
        </button>
      )}

      {previewImages.length > 0 && (
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <ImageIcon size={11} />
          {validImages.length}
        </div>
      )}

      {onFavoriteToggle && (
        <button
          type="button"
          data-stop-link="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavoriteToggle(listingId);
          }}
          className={clsx(
            'absolute right-3 top-3 z-10 rounded-full border p-2 backdrop-blur-sm transition-colors',
            isFavorited
              ? 'border-red-200/60 bg-red-50 text-red-500'
              : 'border-white/60 bg-white/85 text-neutral-500 hover:text-red-400',
          )}
          aria-label={isFavorited ? 'Favorilerden cikar' : 'Favorile'}
        >
          <Heart size={variant === 'compact' ? 14 : 15} className={isFavorited ? 'fill-red-500' : ''} />
        </button>
      )}

      {previewImages.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 px-4">
          {previewImages.map((image, index) => (
            <button
              key={`${image}-dot-${index}`}
              type="button"
              data-stop-link="true"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                scrollToIndex(index);
              }}
              className={clsx(
                'rounded-full transition-all',
                index === activeIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/55 hover:bg-white/80',
              )}
              aria-label={`${index + 1}. gorsele git`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingMediaCard({
  listing,
  variant = 'full',
  href = `/listing/${listing.id}`,
  isFavorited,
  onFavoriteToggle,
}: ListingMediaCardProps) {
  const timeLeft = getTimeLeft(listing.expiresAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm transition-all duration-normal hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg dark:border-dark-border/80 dark:bg-dark-surface dark:hover:border-neutral-500">
      <ListingCardMedia
        listingId={listing.id}
        title={listing.title}
        category={listing.category}
        images={listing.images}
        href={href}
        variant={variant}
        isFavorited={isFavorited}
        onFavoriteToggle={onFavoriteToggle}
      />

      <div className={clsx('flex flex-1 flex-col', variant === 'compact' ? 'p-3.5' : 'p-4')}>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary-lighter px-2.5 py-1 text-body-sm font-semibold text-primary dark:bg-primary/20 dark:text-blue-300">
            {listing.category}
          </span>
          {timeLeft && (
            <span className="ml-auto inline-flex items-center gap-1 text-body-sm text-neutral-400">
              <Clock size={12} />
              {timeLeft}
            </span>
          )}
        </div>

        <Link
          href={href}
          className={clsx(
            'font-semibold text-neutral-900 transition-colors hover:text-accent dark:text-dark-textPrimary',
            variant === 'compact' ? 'text-body-md line-clamp-2' : 'text-body-lg line-clamp-2',
          )}
        >
          {listing.title}
        </Link>

        <p className={clsx(
          'font-bold text-accent',
          variant === 'compact' ? 'mt-2 text-body-md' : 'mt-2.5 text-body-lg',
        )}>
          {formatBudget(listing.budgetMin, listing.budgetMax)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {listing.city}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-dark-border">
          <BuyerIdentity listing={listing} compact={variant === 'compact'} />
          <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-accent">
            <MessageSquare size={13} />
            {listing.offerCount} teklif
          </span>
        </div>
      </div>
    </article>
  );
}

export function ListingOwnerCard({
  listing,
  status,
  deliveryLabel,
  href = `/listing/${listing.id}`,
  infoBanner,
  footerLead,
  footerActions,
}: ListingOwnerCardProps) {
  const timeLeft = listing.status === 'active' ? getTimeLeft(listing.expiresAt) : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm transition-all duration-normal hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg dark:border-dark-border/80 dark:bg-dark-surface dark:hover:border-neutral-500">
      <ListingCardMedia
        listingId={listing.id}
        title={listing.title}
        category={listing.category}
        images={listing.images}
        href={href}
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary-lighter px-2.5 py-1 text-body-sm font-semibold text-primary dark:bg-primary/20 dark:text-blue-300">
            {listing.category}
          </span>
          <span className={clsx('inline-flex items-center gap-1 text-body-sm font-medium', status.textClassName)}>
            <span className={clsx('h-1.5 w-1.5 rounded-full', status.dotClassName)} />
            {status.label}
          </span>
          {timeLeft && (
            <span className="ml-auto inline-flex items-center gap-1 text-body-sm font-medium text-amber-500">
              <Clock size={12} />
              {timeLeft}
            </span>
          )}
        </div>

        <Link
          href={href}
          className="text-body-lg font-semibold text-neutral-900 transition-colors hover:text-accent dark:text-dark-textPrimary line-clamp-2"
        >
          {listing.title}
        </Link>

        <p className="mt-2.5 text-body-lg font-bold text-accent">
          {formatBudget(listing.budgetMin, listing.budgetMax)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {listing.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            {deliveryLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={12} />
            {listing.viewCount}
          </span>
        </div>

        {infoBanner ? <div className="mt-3">{infoBanner}</div> : null}

        <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-dark-border">
          {footerLead}
          {footerActions ? <div className="flex items-center gap-2">{footerActions}</div> : null}
        </div>
      </div>
    </article>
  );
}
