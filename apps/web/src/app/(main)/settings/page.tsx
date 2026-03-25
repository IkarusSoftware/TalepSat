'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Building2, Bell, Shield, Save, Camera,
  Mail, Phone, MapPin, FileText, Lock, Trash2,
} from 'lucide-react';
import { mockUserProfile } from '@/lib/mock-data';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: mockUserProfile.name,
    email: mockUserProfile.email,
    phone: mockUserProfile.phone,
    bio: mockUserProfile.bio,
    companyName: mockUserProfile.companyName || '',
    taxNumber: mockUserProfile.taxNumber || '',
    city: mockUserProfile.city,
    address: mockUserProfile.address || '',
  });

  const [notifications, setNotifications] = useState(mockUserProfile.notifications);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-h2">
                {mockUserProfile.initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent-600 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">{mockUserProfile.name}</p>
              <p className="text-body-sm text-neutral-500">Pro Üye · {mockUserProfile.city}</p>
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
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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

          <button onClick={handleSave} className="mt-4 h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all flex items-center gap-2">
            <Save size={16} /> {saved ? 'Kaydedildi!' : 'Kaydet'}
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

          <div className="mt-4 space-y-1.5">
            <label className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary flex items-center gap-1.5">
              <MapPin size={14} /> Adres
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <button onClick={handleSave} className="mt-4 h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all flex items-center gap-2">
            <Save size={16} /> {saved ? 'Kaydedildi!' : 'Kaydet'}
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
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    notifications[item.key] ? 'translate-x-5.5 left-[1px]' : 'left-0.5'
                  }`}
                  style={{ transform: notifications[item.key] ? 'translateX(22px)' : 'translateX(0)' }}
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
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors text-left">
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
    </div>
  );
}
