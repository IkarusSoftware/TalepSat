'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Layers, FileText,
  Banknote, Image as ImageIcon, Eye, X, Upload, Loader2,
  Sofa, Monitor, Shirt, Wrench, Utensils, Building2,
  Package, Truck, Palette, Stethoscope, GraduationCap, Leaf,
  Sparkles, PartyPopper, AlertCircle, Crown, Clock,
} from 'lucide-react';

const categories = [
  { id: 'mobilya', label: 'Mobilya', icon: Sofa },
  { id: 'elektronik', label: 'Elektronik', icon: Monitor },
  { id: 'tekstil', label: 'Tekstil', icon: Shirt },
  { id: 'endustriyel', label: 'Endüstriyel', icon: Wrench },
  { id: 'gida', label: 'Gıda', icon: Utensils },
  { id: 'insaat', label: 'İnşaat', icon: Building2 },
  { id: 'ambalaj', label: 'Ambalaj', icon: Package },
  { id: 'lojistik', label: 'Lojistik', icon: Truck },
  { id: 'reklam-baski', label: 'Reklam & Baskı', icon: Palette },
  { id: 'medikal', label: 'Medikal', icon: Stethoscope },
  { id: 'egitim', label: 'Eğitim', icon: GraduationCap },
  { id: 'tarim', label: 'Tarım', icon: Leaf },
];

const steps = [
  { label: 'Kategori', icon: Layers },
  { label: 'Detaylar', icon: FileText },
  { label: 'Bütçe', icon: Banknote },
  { label: 'Görseller', icon: ImageIcon },
  { label: 'Önizleme', icon: Eye },
];

const deliveryOptions = [
  { value: 'urgent', label: 'Acil (1-3 gün)' },
  { value: 'week', label: '1 Hafta' },
  { value: 'two_weeks', label: '2 Hafta' },
  { value: 'month', label: '1 Ay' },
  { value: 'flexible', label: 'Esnek' },
];

export default function CreateListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [publishResult, setPublishResult] = useState<{ requiresApproval: boolean } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<{
    message: string;
    limitReached?: boolean;
    limit?: number;
    used?: number;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    quantity: '',
    unit: 'adet',
    deliveryUrgency: 'two_weeks',
    city: '',
    budgetType: 'range' as 'fixed' | 'range' | 'open',
    budgetMin: '',
    budgetMax: '',
    budgetFixed: '',
    includesVat: false,
    images: [] as { url: string; name: string; preview: string }[],
    docs: [] as { url: string; name: string }[],
    durationDays: '14',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const updatePriceField = (field: string, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const formatted = digits ? Number(digits).toLocaleString('tr-TR') : '';
    updateForm(field, formatted);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    switch (currentStep) {
      case 0:
        if (!form.categoryId) newErrors.categoryId = 'Kategori seçin';
        break;
      case 1:
        if (!form.title || form.title.length < 10) newErrors.title = 'Başlık en az 10 karakter olmalı';
        if (!form.description || form.description.length < 50) newErrors.description = 'Açıklama en az 50 karakter olmalı';
        if (!form.city) newErrors.city = 'Şehir seçin';
        break;
      case 2:
        if (form.budgetType === 'range') {
          if (!form.budgetMin) newErrors.budgetMin = 'Minimum bütçe girin';
          if (!form.budgetMax) newErrors.budgetMax = 'Maksimum bütçe girin';
        }
        if (form.budgetType === 'fixed' && !form.budgetFixed) newErrors.budgetFixed = 'Bütçe girin';
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep((s) => Math.min(s + 1, 4));
  };
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleFileUpload = async (files: FileList, type: 'images' | 'docs') => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Yükleme başarısız');
      return;
    }
    const { urls } = await res.json() as { urls: string[] };

    if (type === 'images') {
      const newImages = urls.map((url: string, i: number) => ({
        url,
        name: files[i].name,
        preview: URL.createObjectURL(files[i]),
      }));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages].slice(0, 10) }));
    } else {
      const newDocs = urls.map((url: string, i: number) => ({ url, name: files[i].name }));
      setForm((prev) => ({ ...prev, docs: [...prev.docs, ...newDocs].slice(0, 5) }));
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeDoc = (index: number) => {
    setForm((prev) => ({ ...prev, docs: prev.docs.filter((_, i) => i !== index) }));
  };

  const stripDots = (v: string) => v.replace(/\./g, '');

  const handlePublish = async () => {
    setPublishError(null);
    setPublishing(true);
    const selectedCat = categories.find((c) => c.id === form.categoryId);
    const budgetMin = stripDots(form.budgetType === 'range' ? form.budgetMin : form.budgetType === 'fixed' ? form.budgetFixed : '0');
    const budgetMax = stripDots(form.budgetType === 'range' ? form.budgetMax : form.budgetType === 'fixed' ? form.budgetFixed : '0');

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: selectedCat?.label || '',
        categorySlug: form.categoryId,
        budgetMin,
        budgetMax,
        city: form.city,
        deliveryUrgency: form.deliveryUrgency,
        images: [...form.images.map((i) => i.url), ...form.docs.map((d) => d.url)],
        expiresInDays: parseInt(form.durationDays),
      }),
    });

    setPublishing(false);
    if (res.ok) {
      const data = await res.json();
      setPublishResult({ requiresApproval: data.requiresApproval ?? false });
    } else {
      const err = await res.json();
      setPublishError({
        message: err.error || 'İlan oluşturulamadı. Lütfen tekrar deneyin.',
        limitReached: err.limitReached ?? false,
        limit: err.limit,
        used: err.used,
      });
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  if (publishResult) {
    const isPending = publishResult.requiresApproval;
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {isPending ? (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Clock size={36} className="text-amber-500" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-light flex items-center justify-center">
              <PartyPopper size={36} className="text-success" />
            </div>
          )}

          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-3">
            {isPending ? 'İlanınız Onaya Gönderildi!' : 'İlanınız Yayında!'}
          </h1>
          <p className="text-body-lg text-neutral-500 mb-6">
            {isPending
              ? 'İlanınız ekibimiz tarafından inceleniyor. Onaylandıktan sonra yayına alınacak ve sizi e-posta ile bilgilendireceğiz.'
              : 'Tebrikler! İlanınız başarıyla oluşturuldu. Satıcılar tekliflerini göndermeye başladığında sizi bilgilendireceğiz.'}
          </p>

          {isPending && (
            <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-left space-y-2">
              <p className="text-body-sm font-semibold text-amber-800 dark:text-amber-300">Süreç nasıl işler?</p>
              <ul className="text-body-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li>• İlanınız genellikle <strong>24 saat</strong> içinde incelenir</li>
                <li>• Onaylandığında yayına alınır ve satıcılar teklif gönderebilir</li>
                <li>• Durumu <strong>İlanlarım</strong> sayfasından takip edebilirsiniz</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/dashboard"
              className="h-12 px-6 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 transition-colors flex items-center justify-center gap-2"
            >
              İlanlarıma Git
            </a>
            <a
              href="/create"
              className="h-12 px-6 border border-neutral-200 dark:border-dark-border text-body-lg font-medium text-neutral-700 dark:text-dark-textSecondary rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center justify-center gap-2"
            >
              Yeni İlan Oluştur
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, i) => (
            <button
              key={step.label}
              onClick={() => i < currentStep && setCurrentStep(i)}
              className={`flex items-center gap-2 text-body-sm font-medium transition-colors ${
                i <= currentStep ? 'text-accent' : 'text-neutral-400'
              } ${i < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-bold transition-all ${
                i < currentStep
                  ? 'bg-accent text-white'
                  : i === currentStep
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'bg-neutral-200 dark:bg-dark-surfaceRaised text-neutral-400'
              }`}>
                {i < currentStep ? <Check size={14} /> : i + 1}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>
        <div className="h-1.5 bg-neutral-200 dark:bg-dark-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* STEP 0 — Category */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">Kategori Seçin</h2>
              <p className="text-body-lg text-neutral-500 mb-8">İhtiyacınız hangi kategoriye uyuyor?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateForm('categoryId', cat.id)}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-normal ${
                      form.categoryId === cat.id
                        ? 'border-accent bg-accent-lighter dark:bg-accent/10 shadow-sm'
                        : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-neutral-300'
                    }`}
                  >
                    <cat.icon size={28} className={form.categoryId === cat.id ? 'text-accent' : 'text-neutral-500'} />
                    <span className={`text-body-md font-medium ${form.categoryId === cat.id ? 'text-accent' : 'text-neutral-700 dark:text-dark-textPrimary'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.categoryId && <p className="mt-3 text-body-sm text-error">{errors.categoryId}</p>}
            </div>
          )}

          {/* STEP 1 — Details */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">İlan Detayları</h2>
              <p className="text-body-lg text-neutral-500 mb-8">İhtiyacınızı detaylı şekilde açıklayın.</p>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary flex items-center gap-2">
                    Başlık
                    <span className="text-body-sm text-neutral-400 font-normal">({form.title.length}/120)</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    maxLength={120}
                    placeholder="Örn: 500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt"
                    className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.title ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
                  />
                  {/* AI suggestion */}
                  {form.title.length > 5 && form.title.length < 20 && (
                    <button
                      type="button"
                      onClick={() => {
                        const cat = categories.find(c => c.id === form.categoryId);
                        const catLabel = cat?.label || '';
                        const qty = form.quantity ? `${form.quantity} ${form.unit}` : '';
                        const base = form.title.trim();
                        const suggestions = [
                          `${qty} ${base} — ${catLabel} Tedarik Talebi`.trim(),
                          `${base} ${qty ? `(${qty})` : ''} — Toptan ${catLabel}`.trim(),
                          `${catLabel}: ${qty} ${base} Alım Talebi`.trim(),
                        ];
                        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)].replace(/\s+/g, ' ').slice(0, 120);
                        updateForm('title', suggestion);
                      }}
                      className="flex items-center gap-1.5 text-body-sm text-accent font-medium mt-1 hover:text-accent-600 transition-colors"
                    >
                      <Sparkles size={14} /> AI başlık önerisi al
                    </button>
                  )}
                  {errors.title && <p className="text-body-sm text-error">{errors.title}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary flex items-center gap-2">
                    Açıklama
                    <span className="text-body-sm text-neutral-400 font-normal">({form.description.length}/5000)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows={5}
                    maxLength={5000}
                    placeholder="İhtiyacınızı, teknik özellikleri, beklentilerinizi detaylı yazın..."
                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.description ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
                  />
                  {errors.description && <p className="text-body-sm text-error">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Miktar</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => updateForm('quantity', e.target.value)}
                        placeholder="500"
                        className="flex-1 h-11 px-4 rounded-l-lg border border-r-0 border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                      <select
                        value={form.unit}
                        onChange={(e) => updateForm('unit', e.target.value)}
                        className="w-24 h-11 px-2 rounded-r-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-surfaceRaised text-body-md text-neutral-700 dark:text-dark-textPrimary focus:outline-none"
                      >
                        <option>adet</option>
                        <option>kg</option>
                        <option>ton</option>
                        <option>metre</option>
                        <option>m²</option>
                        <option>litre</option>
                        <option>paket</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Teslimat Beklentisi</label>
                    <select
                      value={form.deliveryUrgency}
                      onChange={(e) => updateForm('deliveryUrgency', e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-colors"
                    >
                      {deliveryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Şehir</label>
                  <select
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-colors ${errors.city ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
                  >
                    <option value="">Şehir seçin</option>
                    {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Gaziantep', 'Trabzon', 'Adana', 'Mersin'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.city && <p className="text-body-sm text-error">{errors.city}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Budget */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">Bütçe Belirle</h2>
              <p className="text-body-lg text-neutral-500 mb-8">Bütçe bilgisi satıcıların doğru teklif vermesini sağlar.</p>

              <div className="flex gap-3 mb-6">
                {[
                  { value: 'range', label: 'Aralık' },
                  { value: 'fixed', label: 'Sabit Fiyat' },
                  { value: 'open', label: 'Teklif Bekliyorum' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateForm('budgetType', opt.value)}
                    className={`flex-1 h-11 rounded-lg border-2 text-body-md font-medium transition-all ${
                      form.budgetType === opt.value
                        ? 'border-accent bg-accent-lighter text-accent'
                        : 'border-neutral-200 dark:border-dark-border text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.budgetType === 'range' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Minimum (₺)</label>
                    <input type="text" value={form.budgetMin} onChange={(e) => updatePriceField('budgetMin', e.target.value)} placeholder="100.000"
                      className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.budgetMin ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
                    />
                    {errors.budgetMin && <p className="text-body-sm text-error">{errors.budgetMin}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Maksimum (₺)</label>
                    <input type="text" value={form.budgetMax} onChange={(e) => updatePriceField('budgetMax', e.target.value)} placeholder="200.000"
                      className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.budgetMax ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
                    />
                    {errors.budgetMax && <p className="text-body-sm text-error">{errors.budgetMax}</p>}
                  </div>
                </div>
              )}

              {form.budgetType === 'fixed' && (
                <div className="space-y-1.5 mb-4">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Sabit Bütçe (₺)</label>
                  <input type="text" value={form.budgetFixed} onChange={(e) => updatePriceField('budgetFixed', e.target.value)} placeholder="150.000"
                    className={`w-full h-11 px-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.budgetFixed ? 'border-error' : 'border-neutral-200 dark:border-dark-border'}`}
                  />
                  {errors.budgetFixed && <p className="text-body-sm text-error">{errors.budgetFixed}</p>}
                </div>
              )}

              {form.budgetType === 'open' && (
                <div className="p-4 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg mb-4 text-body-md text-neutral-500">
                  Bütçe belirtmeden ilan oluşturabilirsiniz. Satıcılar kendi fiyatlarını teklif edecek.
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.includesVat} onChange={(e) => updateForm('includesVat', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-accent focus:ring-accent/20" />
                <span className="text-body-md text-neutral-600 dark:text-dark-textSecondary">KDV dahil</span>
              </label>

              {/* Smart tip */}
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary/10 rounded-lg flex items-start gap-3">
                <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-body-md text-primary-700 dark:text-blue-300">
                  Bu kategoride ortalama bütçe <strong>₺120.000 — ₺280.000</strong> arasında. Gerçekçi bütçe belirlemek daha fazla teklif almanızı sağlar.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 — Images */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">Görseller & Dokümanlar</h2>
              <p className="text-body-lg text-neutral-500 mb-8">Referans görseller eklemek tekliflerinizin kalitesini artırır.</p>

              {/* Hidden file inputs */}
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'images')} />
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'docs')} />

              {/* Image upload area */}
              <div
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-accent'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-accent'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-accent');
                  if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files, 'images');
                }}
                className="border-2 border-dashed border-neutral-300 dark:border-dark-border rounded-xl p-10 text-center hover:border-accent/50 transition-colors cursor-pointer mb-4"
              >
                <Upload size={36} className="mx-auto mb-3 text-neutral-400" />
                <p className="text-body-lg font-medium text-neutral-700 dark:text-dark-textPrimary mb-1">
                  Görselleri sürükleyip bırakın veya tıklayın
                </p>
                <p className="text-body-md text-neutral-400">
                  PNG, JPG veya WEBP — max 10 görsel, 5MB/dosya
                </p>
              </div>

              {/* Image previews */}
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-dark-border">
                      <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate">{img.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Document upload area */}
              <div
                onClick={() => docInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-200 dark:border-dark-border rounded-xl p-8 text-center hover:border-neutral-300 transition-colors cursor-pointer"
              >
                <FileText size={32} className="mx-auto mb-2 text-neutral-400" />
                <p className="text-body-md text-neutral-500">
                  Teknik şartname, katalog veya doküman ekleyin (PDF, DOC — max 5 dosya)
                </p>
              </div>

              {/* Document list */}
              {form.docs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.docs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg">
                      <FileText size={18} className="text-neutral-400 shrink-0" />
                      <span className="text-body-md text-neutral-700 dark:text-dark-textPrimary truncate flex-1">{doc.name}</span>
                      <button onClick={() => removeDoc(i)} className="text-neutral-400 hover:text-error transition-colors"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Preview */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">Önizleme & Yayınla</h2>
              <p className="text-body-lg text-neutral-500 mb-8">İlanınızı kontrol edin ve yayınlayın.</p>

              <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6 space-y-5">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-primary-lighter text-primary text-body-sm font-medium rounded-sm">
                    {selectedCategory?.label || 'Kategori'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">
                  {form.title || 'İlan başlığı'}
                </h3>

                {/* Description */}
                <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary whitespace-pre-line">
                  {form.description || 'İlan açıklaması...'}
                </p>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg">
                    <p className="text-body-sm text-neutral-400">Miktar</p>
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{form.quantity || '-'} {form.unit}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg">
                    <p className="text-body-sm text-neutral-400">Şehir</p>
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{form.city || '-'}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg">
                    <p className="text-body-sm text-neutral-400">Teslimat</p>
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      {deliveryOptions.find((d) => d.value === form.deliveryUrgency)?.label}
                    </p>
                  </div>
                  <div className="p-3 bg-accent-lighter/50 dark:bg-accent/10 rounded-lg">
                    <p className="text-body-sm text-neutral-400">Bütçe</p>
                    <p className="text-body-md font-bold text-accent">
                      {form.budgetType === 'range' ? `₺${form.budgetMin} - ₺${form.budgetMax}` :
                       form.budgetType === 'fixed' ? `₺${form.budgetFixed}` : 'Teklif bekleniyor'}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="pt-4 border-t border-neutral-100 dark:border-dark-border">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary mb-2 block">İlan Süresi</label>
                  <div className="flex gap-3">
                    {['7', '14', '30'].map((d) => (
                      <button
                        key={d}
                        onClick={() => updateForm('durationDays', d)}
                        className={`flex-1 h-10 rounded-lg border-2 text-body-md font-medium transition-all ${
                          form.durationDays === d
                            ? 'border-accent bg-accent-lighter text-accent'
                            : 'border-neutral-200 dark:border-dark-border text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        {d} Gün
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Publish Error Banner */}
      {publishError && (
        <div className={`mt-6 rounded-xl border p-4 flex gap-3 ${
          publishError.limitReached
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        }`}>
          {publishError.limitReached ? (
            <Crown size={20} className="text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold mb-1 ${
              publishError.limitReached ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {publishError.limitReached ? 'İlan Limitine Ulaştınız' : 'İlan Oluşturulamadı'}
            </p>
            <p className={`text-sm ${
              publishError.limitReached ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {publishError.message}
            </p>
            {publishError.limitReached && (
              <div className="mt-3 flex gap-2">
                <a
                  href="/subscription"
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                >
                  <Crown size={13} /> Planı Yükselt
                </a>
                <button
                  onClick={() => setPublishError(null)}
                  className="h-8 px-3 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
          {!publishError.limitReached && (
            <button onClick={() => setPublishError(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-dark-border">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="h-11 px-5 border border-neutral-200 dark:border-dark-border rounded-lg text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Geri
        </button>

        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            className="h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast flex items-center gap-2"
          >
            İleri <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="h-12 px-8 bg-accent text-white text-body-lg font-bold rounded-lg hover:bg-accent-600 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none transition-all duration-fast shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {publishing ? <><Loader2 size={18} className="animate-spin" /> Yayınlanıyor...</> : <><Check size={18} /> İlanı Yayınla</>}
          </button>
        )}
      </div>
    </div>
  );
}
