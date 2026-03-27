'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Globe, Palette, Lock, FileText, Handshake,
  Bell, Search, Wrench, Save, Loader2, CheckCircle,
  AlertTriangle, ToggleLeft, ToggleRight, ChevronRight,
  Mail, Phone, Link, Image, Percent, Hash, Calendar,
  MessageSquare, Shield, RefreshCw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Settings = Record<string, string>;

// ── Section definitions ────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'genel',       label: 'Genel',           icon: Globe      },
  { id: 'gorunum',     label: 'Görünüm',          icon: Palette    },
  { id: 'auth',        label: 'Kayıt & Giriş',   icon: Lock       },
  { id: 'ilan',        label: 'İlan Ayarları',   icon: FileText   },
  { id: 'teklif',      label: 'Teklif Ayarları', icon: Handshake  },
  { id: 'bildirim',    label: 'Bildirimler',      icon: Bell       },
  { id: 'seo',         label: 'SEO',              icon: Search     },
  { id: 'bakim',       label: 'Bakım Modu',       icon: Wrench     },
];

// ── UI primitives ──────────────────────────────────────────────────────────────
function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">{children}</div>;
}

function Field({
  label, hint, children, full,
}: {
  label: string; hint?: string; children: React.ReactNode; full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-body-sm font-semibold text-neutral-700 dark:text-dark-textPrimary mb-1.5">{label}</label>
      {hint && <p className="text-[12px] text-neutral-400 mb-2 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, icon: Icon, type = 'text',
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: typeof Globe; type?: string;
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-9 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-body-sm text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${Icon ? 'pl-9 pr-3' : 'px-3'}`}
      />
    </div>
  );
}

function NumberInput({
  value, onChange, placeholder, min, max, suffix,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-3 pr-10 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-body-sm text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400 pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

function Toggle({
  value, onChange, label, description,
}: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-4 p-3.5 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors text-left"
    >
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-neutral-800 dark:text-dark-textPrimary">{label}</p>
        {description && <p className="text-[12px] text-neutral-400 mt-0.5 leading-snug">{description}</p>}
      </div>
      {value
        ? <ToggleRight size={28} className="text-primary shrink-0" />
        : <ToggleLeft  size={28} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
      }
    </button>
  );
}

function TextareaInput({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-body-sm text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
    />
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({
  id, icon: Icon, title, description, children, onSave, saving, saved,
}: {
  id: string; icon: typeof Globe; title: string; description: string;
  children: React.ReactNode;
  onSave: () => void; saving: boolean; saved: boolean;
}) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/60 dark:border-dark-border overflow-hidden">
        {/* Section header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/8 dark:bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{title}</h2>
              <p className="text-[12px] text-neutral-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-body-sm font-semibold transition-all ${
              saved
                ? 'bg-success/10 text-success'
                : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" />
              : saved ? <CheckCircle size={14} />
              : <Save size={14} />}
            {saving ? 'Kaydediliyor…' : saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </div>

        {/* Section body */}
        <div className="px-6 py-6 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState<Record<string, boolean>>({});
  const [saved, setSaved]       = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState('genel');
  const contentRef = useRef<HTMLDivElement>(null);

  // Load all settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSettings(data);
      })
      .catch(() => setError('Sunucuya ulaşılamadı'))
      .finally(() => setLoading(false));
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { root: container, rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [loading]);

  function get(key: string, fallback = '') { return settings[key] ?? fallback; }
  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }
  function bool(key: string) { return get(key) === 'true'; }
  function setBool(key: string, value: boolean) { set(key, String(value)); }

  const saveSection = useCallback(async (sectionId: string, keys: string[]) => {
    setSaving((p) => ({ ...p, [sectionId]: true }));
    const payload: Settings = {};
    for (const k of keys) payload[k] = settings[k] ?? '';
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved((p) => ({ ...p, [sectionId]: true }));
        setTimeout(() => setSaved((p) => ({ ...p, [sectionId]: false })), 2500);
      }
    } finally {
      setSaving((p) => ({ ...p, [sectionId]: false }));
    }
  }, [settings]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="p-8 flex items-center gap-2 text-error">
      <AlertTriangle size={18} />{error}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left sticky nav ─────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-neutral-100 dark:border-dark-border bg-white dark:bg-dark-surface overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2.5 px-2 py-3 mb-2">
            <Settings size={17} className="text-primary" />
            <span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">Site Ayarları</span>
          </div>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised dark:text-dark-textSecondary'
                  }`}
                >
                  <s.icon size={15} className={isActive ? 'text-primary' : 'text-neutral-400'} />
                  <span className="flex-1 text-left">{s.label}</span>
                  {isActive && <ChevronRight size={13} className="text-primary" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Main scrollable content ──────────────────────────────────────────── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">

          {/* ── 1. Genel ──────────────────────────────────────────────────────── */}
          <Section
            id="genel" icon={Globe} title="Genel Ayarlar"
            description="Sitenin temel kimliği ve iletişim bilgileri"
            onSave={() => saveSection('genel', ['site_name', 'site_tagline', 'site_url', 'contact_email', 'support_phone'])}
            saving={!!saving.genel} saved={!!saved.genel}
          >
            <FieldRow>
              <Field label="Site Adı" hint="Tüm sayfa başlıklarında görünür">
                <TextInput value={get('site_name')} onChange={(v) => set('site_name', v)} placeholder="TalepSat" icon={Globe} />
              </Field>
              <Field label="Slogan" hint="Ana sayfada görünecek kısa açıklama">
                <TextInput value={get('site_tagline')} onChange={(v) => set('site_tagline', v)} placeholder="Ters pazar yeri" icon={MessageSquare} />
              </Field>
              <Field label="Site URL" hint="Tam domain adresi (trailing slash olmadan)">
                <TextInput value={get('site_url')} onChange={(v) => set('site_url', v)} placeholder="https://talepsat.com" icon={Link} />
              </Field>
              <Field label="İletişim E-postası" hint="Kullanıcılara gösterilen destek adresi">
                <TextInput value={get('contact_email')} onChange={(v) => set('contact_email', v)} placeholder="destek@talepsat.com" icon={Mail} type="email" />
              </Field>
              <Field label="Destek Telefonu" hint="İsteğe bağlı, boş bırakılabilir">
                <TextInput value={get('support_phone')} onChange={(v) => set('support_phone', v)} placeholder="+90 555 000 00 00" icon={Phone} />
              </Field>
            </FieldRow>
          </Section>

          {/* ── 2. Görünüm ────────────────────────────────────────────────────── */}
          <Section
            id="gorunum" icon={Palette} title="Görünüm"
            description="Logo, favicon ve marka rengi"
            onSave={() => saveSection('gorunum', ['logo_url', 'favicon_url', 'primary_color'])}
            saving={!!saving.gorunum} saved={!!saved.gorunum}
          >
            <FieldRow>
              <Field label="Logo URL" hint="PNG/SVG — önerilen 200×60px">
                <TextInput value={get('logo_url')} onChange={(v) => set('logo_url', v)} placeholder="https://…/logo.png" icon={Image} />
              </Field>
              <Field label="Favicon URL" hint="ICO veya 32×32 PNG">
                <TextInput value={get('favicon_url')} onChange={(v) => set('favicon_url', v)} placeholder="https://…/favicon.ico" icon={Image} />
              </Field>
              <Field label="Ana Renk (HEX)" hint="Buton, link ve vurgu rengi">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-dark-border shrink-0"
                    style={{ background: get('primary_color', '#6366f1') }}
                  />
                  <TextInput value={get('primary_color')} onChange={(v) => set('primary_color', v)} placeholder="#6366f1" />
                </div>
              </Field>
            </FieldRow>
          </Section>

          {/* ── 3. Kayıt & Giriş ──────────────────────────────────────────────── */}
          <Section
            id="auth" icon={Lock} title="Kayıt & Giriş"
            description="Kullanıcı kayıt ve kimlik doğrulama ayarları"
            onSave={() => saveSection('auth', ['registration_open', 'email_verification_required', 'google_login_enabled'])}
            saving={!!saving.auth} saved={!!saved.auth}
          >
            <div className="space-y-3">
              <Toggle
                value={bool('registration_open')}
                onChange={(v) => setBool('registration_open', v)}
                label="Yeni Kayıt Açık"
                description="Kapatıldığında yeni kullanıcılar kayıt olamaz."
              />
              <Toggle
                value={bool('email_verification_required')}
                onChange={(v) => setBool('email_verification_required', v)}
                label="E-posta Doğrulama Zorunlu"
                description="Aktifleştirildiğinde kullanıcılar e-postalarını onaylayana kadar tam erişim alamaz."
              />
              <Toggle
                value={bool('google_login_enabled')}
                onChange={(v) => setBool('google_login_enabled', v)}
                label="Google ile Giriş"
                description="OAuth2 — GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET env değişkenleri gereklidir."
              />
            </div>
          </Section>

          {/* ── 4. İlan Ayarları ──────────────────────────────────────────────── */}
          <Section
            id="ilan" icon={FileText} title="İlan Ayarları"
            description="İlan oluşturma kuralları ve limitleri"
            onSave={() => saveSection('ilan', ['listing_default_days', 'listing_max_images', 'listing_requires_approval', 'listing_max_budget'])}
            saving={!!saving.ilan} saved={!!saved.ilan}
          >
            <FieldRow>
              <Field label="Varsayılan İlan Süresi" hint="İlan kaç gün sonra sona erer?">
                <NumberInput value={get('listing_default_days')} onChange={(v) => set('listing_default_days', v)} min={1} max={365} suffix="gün" />
              </Field>
              <Field label="Maksimum Resim Sayısı" hint="Bir ilana en fazla kaç fotoğraf eklenebilir?">
                <NumberInput value={get('listing_max_images')} onChange={(v) => set('listing_max_images', v)} min={1} max={20} suffix="adet" />
              </Field>
              <Field label="Maksimum Bütçe Limiti" hint="Bütçe alanına girilebilecek üst sınır">
                <NumberInput value={get('listing_max_budget')} onChange={(v) => set('listing_max_budget', v)} min={0} suffix="₺" />
              </Field>
            </FieldRow>
            <div className="space-y-3 pt-1">
              <Toggle
                value={bool('listing_requires_approval')}
                onChange={(v) => setBool('listing_requires_approval', v)}
                label="İlan Onayı Gerekli"
                description="Aktifleştirildiğinde yeni ilanlar admin onayından sonra yayınlanır."
              />
            </div>
          </Section>

          {/* ── 5. Teklif Ayarları ────────────────────────────────────────────── */}
          <Section
            id="teklif" icon={Handshake} title="Teklif Ayarları"
            description="Teklif verme ve işlem kuralları"
            onSave={() => saveSection('teklif', ['offer_min_amount', 'offer_max_revisions', 'commission_rate'])}
            saving={!!saving.teklif} saved={!!saved.teklif}
          >
            <FieldRow>
              <Field label="Minimum Teklif Tutarı" hint="Satıcıların girebileceği en düşük fiyat">
                <NumberInput value={get('offer_min_amount')} onChange={(v) => set('offer_min_amount', v)} min={0} suffix="₺" />
              </Field>
              <Field label="Maksimum Revizyon Hakkı" hint="Bir teklifte kaç revizyon talep edilebilir?">
                <NumberInput value={get('offer_max_revisions')} onChange={(v) => set('offer_max_revisions', v)} min={0} max={20} suffix="adet" />
              </Field>
              <Field label="Komisyon Oranı" hint="Tamamlanan işlemlerden alınan komisyon (%)">
                <NumberInput value={get('commission_rate')} onChange={(v) => set('commission_rate', v)} min={0} max={100} suffix="%" />
              </Field>
            </FieldRow>
          </Section>

          {/* ── 6. Bildirimler ────────────────────────────────────────────────── */}
          <Section
            id="bildirim" icon={Bell} title="Bildirimler"
            description="E-posta bildirimi ayarları"
            onSave={() => saveSection('bildirim', ['email_notifications_enabled', 'admin_notification_email'])}
            saving={!!saving.bildirim} saved={!!saved.bildirim}
          >
            <div className="space-y-3">
              <Toggle
                value={bool('email_notifications_enabled')}
                onChange={(v) => setBool('email_notifications_enabled', v)}
                label="E-posta Bildirimleri"
                description="Kapatıldığında sistem hiçbir e-posta göndermez."
              />
            </div>
            <Field label="Admin Bildirim E-postası" hint="Önemli sistem olayları bu adrese iletilir">
              <TextInput value={get('admin_notification_email')} onChange={(v) => set('admin_notification_email', v)} placeholder="admin@talepsat.com" icon={Mail} type="email" />
            </Field>
          </Section>

          {/* ── 7. SEO ────────────────────────────────────────────────────────── */}
          <Section
            id="seo" icon={Search} title="SEO"
            description="Arama motoru ve sosyal medya meta etiketleri"
            onSave={() => saveSection('seo', ['seo_title', 'seo_description', 'seo_og_image'])}
            saving={!!saving.seo} saved={!!saved.seo}
          >
            <FieldRow>
              <Field label="Meta Başlık" hint="Tarayıcı sekmesinde ve arama sonuçlarında görünür" full>
                <TextInput value={get('seo_title')} onChange={(v) => set('seo_title', v)} placeholder="TalepSat - Ters Pazar Yeri" icon={Search} />
              </Field>
              <Field label="Meta Açıklama" hint="Arama sonuçlarında görünecek kısa açıklama (160 karakter önerilir)" full>
                <TextareaInput value={get('seo_description')} onChange={(v) => set('seo_description', v)} placeholder="Alıcıların talep oluşturduğu, satıcıların teklif verdiği modern pazar yeri." rows={2} />
              </Field>
              <Field label="OG Görsel URL" hint="Facebook/Twitter paylaşımlarında görünecek kapak görseli" full>
                <TextInput value={get('seo_og_image')} onChange={(v) => set('seo_og_image', v)} placeholder="https://…/og-image.jpg" icon={Image} />
              </Field>
            </FieldRow>
          </Section>

          {/* ── 8. Bakım Modu ─────────────────────────────────────────────────── */}
          <Section
            id="bakim" icon={Wrench} title="Bakım Modu"
            description="Siteyi geçici olarak bakıma alın"
            onSave={() => saveSection('bakim', ['maintenance_mode', 'maintenance_message'])}
            saving={!!saving.bakim} saved={!!saved.bakim}
          >
            <AnimatePresence>
              {bool('maintenance_mode') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-body-sm mb-4">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>Bakım modu <strong>açık</strong>. Normal kullanıcılar siteye erişemez. Admin paneli erişilebilir kalmaya devam eder.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <Toggle
                value={bool('maintenance_mode')}
                onChange={(v) => setBool('maintenance_mode', v)}
                label="Bakım Modunu Aktifleştir"
                description="Aktif olduğunda ziyaretçilere bakım sayfası gösterilir."
              />
              <Field label="Bakım Mesajı" hint="Ziyaretçilere gösterilecek açıklama">
                <TextareaInput
                  value={get('maintenance_message')}
                  onChange={(v) => set('maintenance_message', v)}
                  placeholder="Sitemiz şu an bakımda. Lütfen daha sonra tekrar deneyin."
                  rows={3}
                />
              </Field>
            </div>
          </Section>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
