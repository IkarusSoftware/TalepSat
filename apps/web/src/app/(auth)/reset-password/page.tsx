'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle size={48} className="text-error" />
        </div>
        <p className="text-body-md text-neutral-700 dark:text-dark-textPrimary font-medium">
          Geçersiz sıfırlama bağlantısı.
        </p>
        <p className="text-body-sm text-neutral-500 dark:text-dark-textSecondary">
          Bu bağlantı geçersiz veya süresi dolmuş olabilir. Lütfen yeniden sıfırlama isteği gönderin.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block mt-2 text-body-md text-accent font-semibold hover:text-accent-600 transition-colors"
        >
          Yeni Bağlantı İste
        </Link>
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.password) {
      newErrors.password = 'Şifre gerekli.';
    } else if (form.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır.';
    }
    if (!form.confirm) {
      newErrors.confirm = 'Şifre tekrarı gerekli.';
    } else if (form.password !== form.confirm) {
      newErrors.confirm = 'Şifreler eşleşmiyor.';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || 'Bir hata oluştu.' });
      } else {
        setSuccess(true);
      }
    } catch {
      setErrors({ form: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <p className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
          Şifreniz başarıyla güncellendi.
        </p>
        <p className="text-body-sm text-neutral-500 dark:text-dark-textSecondary">
          Giriş sayfasına yönlendiriliyorsunuz...
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.form && (
        <div className="p-3 rounded-lg bg-error-light dark:bg-red-500/10 border border-error/20 text-body-sm text-error font-medium">
          {errors.form}
        </div>
      )}

      {/* New password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
          Yeni Şifre
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
            placeholder="En az 6 karakter"
            className={`w-full h-11 pl-10 pr-11 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              errors.password ? 'border-error focus:ring-error/20 focus:border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-body-sm text-error">{errors.password}</p>}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
          Şifre Tekrarı
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            value={form.confirm}
            onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setErrors({ ...errors, confirm: '' }); }}
            placeholder="Şifreni tekrar gir"
            className={`w-full h-11 pl-10 pr-11 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              errors.confirm ? 'border-error focus:ring-error/20 focus:border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showConfirm ? 'Şifreyi gizle' : 'Şifreyi göster'}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirm && <p className="text-body-sm text-error">{errors.confirm}</p>}
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
          'Şifremi Güncelle'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="text-center mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Yeni Şifre Belirle
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500 dark:text-dark-textSecondary">
          Hesabın için güçlü bir şifre seç.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-body-md text-neutral-500">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-accent font-semibold hover:text-accent-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Giriş sayfasına dön
        </Link>
      </p>
    </motion.div>
  );
}
