'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { usePublicSettings } from '@/hooks/use-public-settings';

export default function LoginPage() {
  const { settings, loading: settingsLoading } = usePublicSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!form.email) nextErrors.email = 'Email adresi gerekli';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Gecerli bir email girin';
    if (!form.password) nextErrors.password = 'Sifre gerekli';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({
          form: settings.email_verification_required
            ? 'Giris basarisiz. Bilgilerinizi veya dogrulama durumunuzu kontrol edin.'
            : 'E-posta veya sifre hatali.',
        });
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setErrors({ form: 'Bir hata olustu. Lutfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="text-center mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Tekrar Hos Geldin</h1>
        <p className="mt-2 text-body-lg text-neutral-500 dark:text-dark-textSecondary">
          Hesabina giris yap ve kaldigin yerden devam et.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {settings.email_verification_required && !settingsLoading && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-body-sm text-warning font-medium">
              E-posta dogrulamasi zorunlu. Dogrulanmamis hesaplar giris yapamaz.
            </div>
          )}
          {errors.form && (
            <div className="p-3 rounded-lg bg-error-light dark:bg-red-500/10 border border-error/20 text-body-sm text-error font-medium">
              {errors.form}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
              Email Adresi
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                  setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="ornek@email.com"
                className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.email
                    ? 'border-error focus:ring-error/20 focus:border-error'
                    : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                }`}
              />
            </div>
            {errors.email && <p className="text-body-sm text-error">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                Sifre
              </label>
              <Link href="/forgot-password" className="text-body-sm text-accent hover:text-accent-600 font-medium transition-colors">
                Sifremi Unuttum
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, password: e.target.value }));
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                className={`w-full h-11 pl-10 pr-11 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.password
                    ? 'border-error focus:ring-error/20 focus:border-error'
                    : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={showPassword ? 'Sifreyi gizle' : 'Sifreyi goster'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-body-sm text-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-fast shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                Giris Yap
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {settings.google_login_available && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-dark-border" />
              </div>
              <div className="relative flex justify-center text-body-sm">
                <span className="px-3 bg-white dark:bg-dark-surfaceRaised text-neutral-400">veya</span>
              </div>
            </div>

            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full h-11 border border-neutral-200 dark:border-dark-border rounded-lg text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google ile Giris Yap
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-body-md text-neutral-500">
        Hesabin yok mu?{' '}
        {settings.registration_open ? (
          <Link href="/register" className="text-accent font-semibold hover:text-accent-600 transition-colors">
            Ucretsiz Kayit Ol
          </Link>
        ) : (
          <span className="font-semibold text-neutral-400">Kayit su an kapali</span>
        )}
      </p>
    </motion.div>
  );
}
