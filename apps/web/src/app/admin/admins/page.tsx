'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  Plus,
  ShieldCheck,
  UserCog,
  UserRoundX,
} from 'lucide-react';

type AdminRole = 'superadmin' | 'staff';
type AdminStatus = 'active' | 'disabled';

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
}

interface AdminResponse {
  viewerRole: AdminRole;
  admins: AdminAccount[];
}

function roleLabel(role: AdminRole) {
  return role === 'superadmin' ? 'Superadmin' : 'Staff';
}

function statusLabel(status: AdminStatus) {
  return status === 'active' ? 'Aktif' : 'Devre Disi';
}

function timeLabel(date: string | null) {
  if (!date) return 'Hic giris yok';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function AdminAdminsPage() {
  const [viewerRole, setViewerRole] = useState<AdminRole>('staff');
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as AdminRole,
  });

  async function fetchAdmins() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admins');
      const data = (await res.json().catch(() => null)) as AdminResponse | { error?: string } | null;
      if (!res.ok || !data || !('admins' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Admin hesaplari yuklenemedi.');
      }

      setViewerRole(data.viewerRole);
      setAdmins(data.admins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin hesaplari yuklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  const hasDisabledAdmins = useMemo(
    () => admins.some((admin) => admin.status === 'disabled'),
    [admins],
  );

  async function handleCreateAdmin(event: React.FormEvent) {
    event.preventDefault();
    setSaving('create');
    setError(null);

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Admin hesabi olusturulamadi.');
      }

      setForm({ name: '', email: '', password: '', role: 'staff' });
      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin hesabi olusturulamadi.');
    } finally {
      setSaving(null);
    }
  }

  async function runAction(adminId: string, action: 'setRole' | 'activate' | 'disable', role?: AdminRole) {
    setSaving(`${action}:${adminId}`);
    setError(null);

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, action, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Islem tamamlanamadi.');
      }

      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Islem tamamlanamadi.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Admin Hesaplari</h1>
        <p className="mt-1 text-body-lg text-neutral-500">
          Ayrik admin kimlikleri burada yonetilir. Marketplace kullanicilari ile ayni session veya rol yapisini paylasmazlar.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {viewerRole === 'superadmin' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateAdmin}
          className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-dark-border dark:bg-dark-surface"
        >
          <div className="mb-4 flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            <h2 className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">Yeni Admin Hesabi</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ad Soyad"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg"
            />
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="admin@ornek.com"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg"
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="En az 8 karakter"
              className="h-11 rounded-xl border border-neutral-200 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg"
            />
            <div className="flex gap-3">
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as AdminRole }))}
                className="h-11 flex-1 rounded-xl border border-neutral-200 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg"
              >
                <option value="staff">Staff</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <button
                type="submit"
                disabled={saving === 'create'}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-body-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {saving === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Olustur
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {viewerRole !== 'superadmin' && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-body-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          Bu sayfayi goruntuleyebilirsiniz, ancak admin hesaplarinda degisiklik yapma yetkisi yalnizca superadmin rollerindedir.
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200/60 bg-white dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-dark-border">
          <div>
            <h2 className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">Kayitli Adminler</h2>
            <p className="text-body-sm text-neutral-500">
              {admins.length} hesap, {hasDisabledAdmins ? 'pasif hesaplar dahil' : 'tum hesaplar aktif'}
            </p>
          </div>
          {loading && <Loader2 size={18} className="animate-spin text-primary" />}
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-dark-border">
          {admins.map((admin) => {
            const rowSaving = saving?.endsWith(`:${admin.id}`);
            return (
              <div key={admin.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{admin.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      admin.role === 'superadmin'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300'
                    }`}>
                      {roleLabel(admin.role)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      admin.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    }`}>
                      {statusLabel(admin.status)}
                    </span>
                    {admin.twoFactorEnabled && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        2FA Hazir
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-body-sm text-neutral-500">{admin.email}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-neutral-400">
                    <span>Son giris: {timeLabel(admin.lastLoginAt)}</span>
                    <span>Olusturma: {timeLabel(admin.createdAt)}</span>
                  </div>
                </div>

                {viewerRole === 'superadmin' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={admin.role}
                      onChange={(event) => runAction(admin.id, 'setRole', event.target.value as AdminRole)}
                      disabled={!!rowSaving}
                      className="h-10 rounded-xl border border-neutral-200 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg"
                    >
                      <option value="staff">Staff</option>
                      <option value="superadmin">Superadmin</option>
                    </select>

                    {admin.status === 'active' ? (
                      <button
                        onClick={() => runAction(admin.id, 'disable')}
                        disabled={!!rowSaving}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 px-3 text-body-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:border-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/10"
                      >
                        {rowSaving ? <Loader2 size={14} className="animate-spin" /> : <UserRoundX size={14} />}
                        Devre Disi Birak
                      </button>
                    ) : (
                      <button
                        onClick={() => runAction(admin.id, 'activate')}
                        disabled={!!rowSaving}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 px-3 text-body-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        {rowSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Yeniden Aktif Et
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-body-sm text-neutral-500 dark:border-dark-border dark:text-dark-textSecondary">
                    <UserCog size={14} />
                    Salt okunur
                  </div>
                )}
              </div>
            );
          })}

          {!loading && admins.length === 0 && (
            <div className="px-5 py-10 text-center text-body-sm text-neutral-500">
              Henuz admin hesabi yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
