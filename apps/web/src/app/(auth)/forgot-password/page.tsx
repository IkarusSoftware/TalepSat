'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('E-posta adresi gerekli.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setSubmitted(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
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
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Şifremi Unuttum
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500 dark:text-dark-textSecondary">
          E-posta adresini gir, sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <p className="text-body-md text-neutral-700 dark:text-dark-textPrimary">
              Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.
            </p>

            {devResetUrl && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30">
                <p className="text-body-sm text-yellow-700 dark:text-yellow-400 font-medium mb-1">
                  Geliştirici Modu — Sıfırlama Bağlantısı:
                </p>
                <Link
                  href={devResetUrl}
                  className="text-body-sm text-accent hover:text-accent-600 underline break-all transition-colors"
                >
                  {devResetUrl}
                </Link>
              </div>
            )}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-error-light dark:bg-red-500/10 border border-error/20 text-body-sm text-error font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="ornek@email.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-neutral-300"
                />
              </div>
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
                  Sıfırlama Bağlantısı Gönder
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
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
