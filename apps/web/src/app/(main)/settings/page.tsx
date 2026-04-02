'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  User, Building2, Bell, Shield, Save, Camera,
  Mail, Phone, MapPin, FileText, Lock, Trash2, Loader2,
  Eye, EyeOff, X, Check,
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

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', phone: '', bio: '',
    companyName: '', taxNumber: '', city: '', image: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Notification prefs (localStorage)
  const [notifications, setNotifications] = useState({
    emailNewOffer: true,
    emailStatusChange: true,
    emailExpiry: true,
    push: false,
  });

  useEffect(() => {
    // Load notification prefs from localStorage
    const stored = localStorage.getItem('talepsat_notif_prefs');
    if (stored) {
      try { setNotifications(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('talepsat_notif_prefs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (!session?.user?.id) return;
    // Fetch full profile from user API
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          name: data.name || '',
          email: data.email || (session.user as Record<string, string>).email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          companyName: data.companyName || '',
          taxNumber: data.taxNumber || '',
          city: data.city || '',
          image: data.image || '',
        });
      })
      .finally(() => setLoading(false));
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
          phone: profile.phone,
          bio: profile.bio,
          companyName: profile.companyName,
          taxNumber: profile.taxNumber,
          city: profile.city,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydetme başarısız');
      }

      // Refresh NextAuth session to pick up changes
      await updateSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Yükleme başarısız');
      const { urls } = await uploadRes.json();

      const updateRes = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: urls[0] }),
      });
      if (!updateRes.ok) throw new Error('Profil güncellenemedi');

      setProfile((prev) => ({ ...prev, image: urls[0] }));
      await updateSession();
    } catch {
      setError('Fotoğraf yüklenemedi');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPass.length < 8) {
      setPasswordError('Yeni şifre en az 8 karakter olmalı');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.newPass,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Şifre değiştirilemedi');
      }

      setShowPasswordModal(false);
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Ayarlar
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500">
          Hesap ve profil bilgilerini yönet.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error-light border border-error/20 text-body-sm text-error font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar + Name Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
        >
          <h2 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
            <User size={18} className="text-primary" />
            Kişisel Bilgiler
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {profile.image ? (
                <img src={profile.image} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-h2">
                  {getInitials(profile.name || 'U')}
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <div>
              <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">{profile.name}</p>
              <p className="text-body-sm text-neutral-500">
                {(session?.user as Record<string, string>)?.badge ? `${(session?.user as Record<string, string>).badge} Üye` : 'Üye'} · {profile.city || 'Şehir belirtilmemiş'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
                <User size={14} /> Ad Soyad
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-surfaceRaised text-body-md text-neutral-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
                <Phone size={14} /> Telefon
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
                <MapPin size={14} /> Şehir
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">Hakkımda</label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="mt-4 h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
          </button>
        </motion.div>

        {/* Company Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
        >
          <h2 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            Şirket Bilgileri
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
                <Building2 size={14} /> Şirket Adı
              </label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
                <FileText size={14} /> Vergi Numarası
              </label>
              <input
                type="text"
                value={profile.taxNumber}
                onChange={(e) => setProfile({ ...profile, taxNumber: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="mt-4 h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
          </button>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
        >
          <h2 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Bildirim Tercihleri
          </h2>

          <div className="space-y-4">
            {[
              { key: 'emailNewOffer' as const, label: 'Yeni teklif geldiğinde', desc: 'İlanlarınıza yeni teklif geldiğinde email ile bilgilendirilirsiniz.' },
              { key: 'emailStatusChange' as const, label: 'Teklif durumu değiştiğinde', desc: 'Teklifleriniz kabul/red edildiğinde bildirim alırsınız.' },
              { key: 'emailExpiry' as const, label: 'İlan süresi dolmak üzereyken', desc: 'İlanlarınızın süresinin dolmasına 24 saat kala uyarı alırsınız.' },
              { key: 'push' as const, label: 'Push bildirimleri', desc: 'Tarayıcı üzerinden anlık bildirim alırsınız.' },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <div>
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">{item.label}</p>
                  <p className="text-body-sm text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                    notifications[item.key] ? 'bg-accent' : 'bg-neutral-200 dark:bg-dark-border'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform`}
                  style={{ transform: notifications[item.key] ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account / Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
        >
          <h2 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Hesap
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors text-left"
            >
              <Lock size={16} className="text-neutral-500" />
              <div>
                <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">Şifre Değiştir</p>
                <p className="text-body-sm text-neutral-500">Hesap güvenliği için şifrenizi düzenli güncelleyin.</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-100 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
              <Trash2 size={16} className="text-error" />
              <div>
                <p className="text-body-md font-medium text-error">Hesabı Sil</p>
                <p className="text-body-sm text-neutral-500">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinir.</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">
                  Şifre Değiştir
                </h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors">
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 rounded-lg bg-error-light border border-error/20 text-body-sm text-error font-medium">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">Mevcut Şifre</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full h-11 px-4 pr-11 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                    <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">Yeni Şifre</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordForm.newPass}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                      className="w-full h-11 px-4 pr-11 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full h-11 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  {passwordSaving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
