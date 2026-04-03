'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Bell,
  Building2,
  Camera,
  Check,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Smartphone,
  Trash2,
  User,
  X,
} from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  companyName: string;
  taxNumber: string;
  city: string;
  image: string;
}

type NotificationState = {
  emailNewOffer: boolean;
  emailStatusChange: boolean;
  emailExpiry: boolean;
  push: boolean;
};

const initialProfile: ProfileData = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  companyName: '',
  taxNumber: '',
  city: '',
  image: '',
};

const initialNotifications: NotificationState = {
  emailNewOffer: true,
  emailStatusChange: true,
  emailExpiry: true,
  push: false,
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [notifications, setNotifications] = useState<NotificationState>(initialNotifications);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPush, setSavingPush] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    let active = true;

    Promise.all([
      fetch(`/api/users/${session.user.id}`, { cache: 'no-store' }),
      fetch('/api/users/preferences', { cache: 'no-store' }),
    ])
      .then(async ([profileRes, preferencesRes]) => {
        const profileData = await profileRes.json().catch(() => null);
        const preferencesData = await preferencesRes.json().catch(() => null);
        if (!active) return;

        setProfile({
          name: profileData?.name || '',
          email: profileData?.email || (session.user as Record<string, string>).email || '',
          phone: profileData?.phone || '',
          bio: profileData?.bio || '',
          companyName: profileData?.companyName || '',
          taxNumber: profileData?.taxNumber || '',
          city: profileData?.city || '',
          image: profileData?.image || '',
        });

        setNotifications((prev) => ({
          ...prev,
          push: Boolean(preferencesData?.push),
        }));
      })
      .catch(() => {
        if (!active) return;
        setError('Ayarlar yuklenemedi.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone || null,
          bio: profile.bio || null,
          companyName: profile.companyName || null,
          taxNumber: profile.taxNumber || null,
          city: profile.city || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Kaydetme basarisiz');
      }

      await updateSession();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata olustu');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setUploadingAvatar(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('files', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Fotograf yuklenemedi');
      }

      const { urls } = await uploadRes.json();
      const image = urls?.[0];
      if (!image) {
        throw new Error('Fotograf yuklenemedi');
      }

      const updateRes = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      if (!updateRes.ok) {
        throw new Error('Profil guncellenemedi');
      }

      setProfile((prev) => ({ ...prev, image }));
      await updateSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fotograf yuklenemedi');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');

    if (passwordForm.next.length < 8) {
      setPasswordError('Yeni sifre en az 8 karakter olmali.');
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Sifreler eslesmiyor.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Sifre degistirilemedi');
      }

      setShowPasswordModal(false);
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Bir hata olustu');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePushToggle = async () => {
    const nextValue = !notifications.push;
    setSavingPush(true);
    setError('');

    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ push: nextValue }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bildirim tercihi kaydedilemedi');
      }

      setNotifications((prev) => ({ ...prev, push: nextValue }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bildirim tercihi kaydedilemedi');
    } finally {
      setSavingPush(false);
    }
  };

  const handleDeactivate = async (event: FormEvent) => {
    event.preventDefault();
    setDeactivateError('');

    if (!deactivatePassword) {
      setDeactivateError('Mevcut sifrenizi girin.');
      return;
    }

    setDeactivateSaving(true);
    try {
      const res = await fetch('/api/users/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: deactivatePassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Hesap kapatilamadi');
      }

      await signOut({ callbackUrl: '/login?deactivated=1' });
    } catch (err) {
      setDeactivateError(err instanceof Error ? err.message : 'Hesap kapatilamadi');
    } finally {
      setDeactivateSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Ayarlar</h1>
        <p className="mt-2 text-body-lg text-neutral-500">Hesap, bildirim ve guvenlik alanlarini gercek davranisa gore yonet.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error-light p-3 text-body-sm font-medium text-error">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border/80 dark:bg-dark-surface"
        >
          <h2 className="mb-5 flex items-center gap-2 text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">
            <User size={18} className="text-primary" />
            Kisisel Bilgiler
          </h2>

          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              {profile.image ? (
                <img src={profile.image} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-h2 font-bold text-primary">
                  {getInitials(profile.name || 'U')}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-md transition-colors hover:bg-accent-600 disabled:opacity-50"
              >
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>

            <div>
              <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">{profile.name || 'Profil'}</p>
              <p className="text-body-sm text-neutral-500">
                {(session?.user as Record<string, string>)?.badge ? `${(session?.user as Record<string, string>).badge} uye` : 'Uye'} ·{' '}
                {profile.city || 'Sehir belirtilmedi'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad Soyad" icon={<User size={14} />} value={profile.name} onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))} />
            <Field label="E-posta" icon={<Mail size={14} />} value={profile.email} disabled />
            <Field label="Telefon" icon={<Phone size={14} />} value={profile.phone} onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))} />
            <Field label="Sehir" icon={<MapPin size={14} />} value={profile.city} onChange={(value) => setProfile((prev) => ({ ...prev, city: value }))} />
          </div>

          <div className="mt-4 space-y-1.5">
            <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">Hakkimda</label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
              className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-4 py-3 text-body-md text-neutral-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-surfaceRaised dark:text-dark-textPrimary"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border/80 dark:bg-dark-surface"
        >
          <h2 className="mb-5 flex items-center gap-2 text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">
            <Building2 size={18} className="text-primary" />
            Sirket Bilgileri
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sirket Adi" icon={<Building2 size={14} />} value={profile.companyName} onChange={(value) => setProfile((prev) => ({ ...prev, companyName: value }))} />
            <Field label="Vergi Numarasi" icon={<FileText size={14} />} value={profile.taxNumber} onChange={(value) => setProfile((prev) => ({ ...prev, taxNumber: value }))} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-body-md font-semibold text-white transition-all hover:bg-accent-600 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border/80 dark:bg-dark-surface"
        >
          <h2 className="mb-5 flex items-center gap-2 text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">
            <Bell size={18} className="text-primary" />
            Bildirim Tercihleri
          </h2>

          <div className="space-y-4">
            {[
              {
                key: 'emailNewOffer' as const,
                label: 'Yeni teklif e-postalari',
                desc: 'E-posta teslim kurallari bu fazda devrede degil. Bu satir daha sonra hesap ayarina donecek.',
                interactive: false,
              },
              {
                key: 'emailStatusChange' as const,
                label: 'Durum degisimi e-postalari',
                desc: 'Teklif ve siparis hareketleri icin e-posta tercihi daha sonra yonetilecek.',
                interactive: false,
              },
              {
                key: 'emailExpiry' as const,
                label: 'Sure hatirlatma e-postalari',
                desc: 'Suresi dolacak ilanlar icin e-posta akisi simdilik kapali.',
                interactive: false,
              },
              {
                key: 'push' as const,
                label: 'Mobil push bildirimleri',
                desc: 'Tarayici push yok. Bu ayar yalnizca mobil cihaz bildirim teslimatini kontrol eder.',
                interactive: true,
              },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">{item.label}</p>
                    {!item.interactive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500 dark:bg-dark-surfaceRaised dark:text-dark-textSecondary">
                        <Info size={11} />
                        Yakinda
                      </span>
                    )}
                    {item.interactive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                        <Smartphone size={11} />
                        Ortak ayar
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-body-sm text-neutral-500">{item.desc}</p>
                </div>
                <button
                  onClick={item.interactive ? handlePushToggle : undefined}
                  disabled={!item.interactive || savingPush}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-accent' : 'bg-neutral-200 dark:bg-dark-border'
                  } ${!item.interactive ? 'cursor-not-allowed opacity-50' : ''} ${savingPush && item.interactive ? 'cursor-wait opacity-60' : ''}`}
                >
                  <div
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: notifications[item.key] ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border/80 dark:bg-dark-surface"
        >
          <h2 className="mb-5 flex items-center gap-2 text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">
            <Shield size={18} className="text-primary" />
            Hesap
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:bg-neutral-50 dark:border-dark-border dark:hover:bg-dark-surfaceRaised"
            >
              <Lock size={16} className="text-neutral-500" />
              <div>
                <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">Sifre Degistir</p>
                <p className="text-body-sm text-neutral-500">Hesap guvenligi icin sifreni guncelle.</p>
              </div>
            </button>

            <button
              onClick={() => {
                setDeactivatePassword('');
                setDeactivateError('');
                setShowDeactivateModal(true);
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-red-100 p-3 text-left transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
            >
              <Trash2 size={16} className="text-error" />
              <div>
                <p className="text-body-md font-medium text-error">Hesabi Kapat</p>
                <p className="text-body-sm text-neutral-500">Hesabin devre disi birakilir. Yeniden acma islemi yalnizca admin tarafindan yapilir.</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      {showPasswordModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-dark-border dark:bg-dark-surface">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">Sifre Degistir</h3>
                <button onClick={() => setShowPasswordModal(false)} className="rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised">
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 rounded-lg border border-error/20 bg-error-light p-3 text-body-sm font-medium text-error">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <PasswordField
                  label="Mevcut Sifre"
                  value={passwordForm.current}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, current: value }))}
                  visible={showCurrentPass}
                  onToggleVisibility={() => setShowCurrentPass((prev) => !prev)}
                />
                <PasswordField
                  label="Yeni Sifre"
                  value={passwordForm.next}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
                  visible={showNewPass}
                  onToggleVisibility={() => setShowNewPass((prev) => !prev)}
                />
                <Field
                  label="Yeni Sifre (Tekrar)"
                  value={passwordForm.confirm}
                  type="password"
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
                />

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-body-md font-semibold text-white transition-all hover:bg-accent-600 disabled:opacity-50"
                >
                  {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  {passwordSaving ? 'Degistiriliyor...' : 'Sifreyi Degistir'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}

      {showDeactivateModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowDeactivateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-red-100 bg-white p-6 shadow-xl dark:border-red-500/20 dark:bg-dark-surface">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-error dark:bg-red-500/10">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">Hesabi Kapat</h3>
                  <p className="text-body-sm text-neutral-500">Bu islem hesabi silmez, devre disi birakir ve oturumu kapatir.</p>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-body-sm text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                Iceriklerin korunur ancak tekrar erismek icin admin tarafindan yeniden etkinlestirme gerekir.
              </div>

              {deactivateError && (
                <div className="mb-4 rounded-lg border border-error/20 bg-error-light p-3 text-body-sm font-medium text-error">
                  {deactivateError}
                </div>
              )}

              <form onSubmit={handleDeactivate} className="space-y-4">
                <Field
                  label="Mevcut Sifre"
                  value={deactivatePassword}
                  type="password"
                  onChange={setDeactivatePassword}
                  icon={<Lock size={14} />}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeactivateModal(false)}
                    className="h-11 flex-1 rounded-lg border border-neutral-200 text-body-md font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
                  >
                    Vazgec
                  </button>
                  <button
                    type="submit"
                    disabled={deactivateSaving}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-error text-body-md font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {deactivateSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {deactivateSaving ? 'Kapatiliyor...' : 'Hesabi Kapat'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  disabled = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  icon?: JSX.Element;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className={`h-11 w-full rounded-lg border px-4 text-body-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          disabled
            ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-dark-border dark:bg-dark-surfaceRaised'
            : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 focus:border-primary dark:border-dark-border dark:bg-dark-surfaceRaised dark:text-dark-textPrimary'
        }`}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 pr-11 text-body-md text-neutral-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-surfaceRaised dark:text-dark-textPrimary"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
