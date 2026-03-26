'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { label: 'Elektronik', slug: 'elektronik' },
  { label: 'Tekstil & Konfeksiyon', slug: 'tekstil' },
  { label: 'Gıda', slug: 'gida' },
  { label: 'Yapı Malzemeleri', slug: 'yapi-malzemeleri' },
  { label: 'Makine & Ekipman', slug: 'makine-ekipman' },
  { label: 'Otomotiv', slug: 'otomotiv' },
  { label: 'Mobilya', slug: 'mobilya' },
  { label: 'Kimyasal Ürünler', slug: 'kimyasal' },
  { label: 'Tarım', slug: 'tarim' },
  { label: 'Diğer', slug: 'diger' },
];

const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana',
  'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir',
  'Trabzon', 'Samsun', 'Denizli', 'Sakarya', 'Diğer',
];

const deliveryOptions = [
  { value: 'urgent', label: 'Acil (1-3 gün)' },
  { value: 'week', label: '1 Hafta' },
  { value: 'two_weeks', label: '2 Hafta' },
  { value: 'month', label: '1 Ay' },
  { value: 'flexible', label: 'Esnek' },
];

interface ListingData {
  id: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  deliveryUrgency: string;
  buyerId: string;
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<ListingData | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [city, setCity] = useState('');
  const [deliveryUrgency, setDeliveryUrgency] = useState('two_weeks');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/listings/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: ListingData) => {
        setListing(data);
        setTitle(data.title);
        setDescription(data.description);
        setCategorySlug(data.categorySlug || '');
        setBudgetMin(data.budgetMin > 0 ? String(data.budgetMin) : '');
        setBudgetMax(data.budgetMax > 0 ? String(data.budgetMax) : '');
        setCity(data.city);
        setDeliveryUrgency(data.deliveryUrgency);
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  // Redirect non-owners
  useEffect(() => {
    if (sessionStatus === 'loading' || loading) return;
    if (!listing || !session?.user?.id || session.user.id !== listing.buyerId) {
      router.replace(`/listing/${params.id}`);
    }
  }, [sessionStatus, loading, listing, session, params.id, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title || title.length < 10) newErrors.title = 'Başlık en az 10 karakter olmalı';
    if (!description || description.length < 50) newErrors.description = 'Açıklama en az 50 karakter olmalı';
    if (!city) newErrors.city = 'Şehir seçin';
    if (!categorySlug) newErrors.categorySlug = 'Kategori seçin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !listing) return;

    setSaving(true);
    const selectedCat = categories.find((c) => c.slug === categorySlug);

    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        category: selectedCat?.label || listing.category,
        categorySlug,
        budgetMin: budgetMin ? parseFloat(budgetMin) : 0,
        budgetMax: budgetMax ? parseFloat(budgetMax) : 0,
        city,
        deliveryUrgency,
      }),
    });

    setSaving(false);
    if (res.ok) {
      router.push(`/listing/${listing.id}`);
    } else {
      const err = await res.json();
      alert(err.error || 'İlan güncellenemedi');
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">İlan Bulunamadı</h2>
        <p className="text-body-lg text-neutral-500 mb-6">Bu ilan silinmiş veya mevcut değil.</p>
        <Link href="/explore" className="h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={16} /> İlanlara Dön
        </Link>
      </div>
    );
  }

  const isOwner = session?.user?.id === listing.buyerId;
  if (!isOwner) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/listing/${listing.id}`}
          className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-dark-border flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
        >
          <ArrowLeft size={18} className="text-neutral-600 dark:text-dark-textSecondary" />
        </Link>
        <div>
          <h1 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">İlanı Düzenle</h1>
          <p className="text-body-md text-neutral-500">Aşağıdaki bilgileri güncelleyebilirsiniz.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6 md:p-8 space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: '' })); }}
              maxLength={120}
              placeholder="İlan başlığı"
              className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.title ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
            />
            {errors.title && <p className="text-body-sm text-error">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary flex items-center gap-2">
              Açıklama
              <span className="text-body-sm text-neutral-400 font-normal">({description.length}/5000)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((p) => ({ ...p, description: '' })); }}
              rows={5}
              maxLength={5000}
              placeholder="İhtiyacınızı, teknik özellikleri, beklentilerinizi detaylı yazın..."
              className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.description ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
            />
            {errors.description && <p className="text-body-sm text-error">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Kategori</label>
            <select
              value={categorySlug}
              onChange={(e) => { setCategorySlug(e.target.value); if (errors.categorySlug) setErrors((p) => ({ ...p, categorySlug: '' })); }}
              className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-colors ${errors.categorySlug ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
            >
              <option value="">Kategori seçin</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
            {errors.categorySlug && <p className="text-body-sm text-error">{errors.categorySlug}</p>}
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Minimum Bütçe (₺)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Örn: 10000"
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Maksimum Bütçe (₺)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Örn: 50000"
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* City & Delivery */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Şehir</label>
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors((p) => ({ ...p, city: '' })); }}
                className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-colors ${errors.city ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
              >
                <option value="">Şehir seçin</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <p className="text-body-sm text-error">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Teslimat Beklentisi</label>
              <select
                value={deliveryUrgency}
                onChange={(e) => setDeliveryUrgency(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-colors"
              >
                {deliveryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/listing/${listing.id}`}
            className="h-11 px-6 border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors inline-flex items-center gap-2"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-fast shadow-sm flex items-center gap-2"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</>
            ) : (
              <><Save size={16} /> Değişiklikleri Kaydet</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
