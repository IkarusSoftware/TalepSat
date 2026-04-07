'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const adminSession = session?.user as {
    kind?: string;
    adminStatus?: string;
  } | undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && adminSession?.kind === 'admin' && adminSession.adminStatus === 'active') {
      router.replace('/admin');
      router.refresh();
    }
  }, [adminSession?.adminStatus, adminSession?.kind, router, status]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email || !password) {
      setError('E-posta ve sifre gerekli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/admin',
      });

      if (result?.error) {
        setError('Admin girisi basarisiz. Bilgilerinizi kontrol edin.');
        return;
      }

      window.location.assign(result?.url || '/admin');
    } catch {
      setError('Admin girisi su an tamamlanamiyor. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#13072e]">
        <Loader2 size={28} className="animate-spin text-violet-300" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#3b0764,_#1e1b4b_45%,_#0f172a_100%)] px-6 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/10 bg-[#121a32]/90 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(124,58,237,0.25),rgba(14,165,233,0.08))] px-8 py-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-violet-200">
            <Shield size={22} />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Girisi</h1>
          <p className="mt-2 text-sm text-violet-100/80">
            Yonetim paneli ayri bir kimlik sistemi ile korunur. Yalnizca aktif admin hesaplari girebilir.
          </p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-sm font-medium text-slate-200">
                E-posta
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@ornek.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-medium text-slate-200">
                Sifre
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200"
                  aria-label={showPassword ? 'Sifreyi gizle' : 'Sifreyi goster'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#7c3aed,#0891b2)] text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  Admin Panele Gir
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
