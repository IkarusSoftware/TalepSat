'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, ArrowLeft,
  ShoppingBag, Store, Repeat,
  Check,
} from 'lucide-react';

type Role = 'buyer' | 'seller' | 'both';

const roles: { value: Role; icon: typeof ShoppingBag; title: string; desc: string }[] = [
  { value: 'buyer', icon: ShoppingBag, title: 'Alıcıyım', desc: 'İlan oluştur, teklif al' },
  { value: 'seller', icon: Store, title: 'Satıcıyım', desc: 'İlanları keşfet, teklif ver' },
  { value: 'both', icon: Repeat, title: 'Her İkisi', desc: 'Hem al hem sat' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: role, 2: form
  const [role, setRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleNext = () => {
    if (!role) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.fullName || form.fullName.length < 2) newErrors.fullName = 'İsim en az 2 karakter olmalı';
    if (!form.email) newErrors.email = 'Email adresi gerekli';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Geçerli bir email girin';
    if (!form.phone) newErrors.phone = 'Telefon numarası gerekli';
    else if (!/^(\+90|0)?[0-9]{10}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Geçerli bir telefon numarası girin';
    if (!form.password) newErrors.password = 'Şifre gerekli';
    else if (form.password.length < 8) newErrors.password = 'En az 8 karakter';
    else if (!/[A-Z]/.test(form.password)) newErrors.password = 'En az bir büyük harf içermeli';
    else if (!/[0-9]/.test(form.password)) newErrors.password = 'En az bir rakam içermeli';
    if (!acceptTerms) newErrors.terms = 'Kullanım şartlarını kabul etmelisiniz';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || 'Kayıt başarısız oldu.' });
        setLoading(false);
        return;
      }

      // Auto sign in after register
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErrors({ form: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  // Password strength
  const strength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="w-full max-w-[480px]"
    >
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-bold transition-colors ${
              step >= s ? 'bg-accent text-white' : 'bg-neutral-200 dark:bg-dark-surfaceRaised text-neutral-400'
            }`}>
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 2 && <div className={`w-12 h-0.5 rounded transition-colors ${step > 1 ? 'bg-accent' : 'bg-neutral-200 dark:bg-dark-border'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
                Nasıl Kullanacaksın?
              </h1>
              <p className="mt-2 text-body-lg text-neutral-500">
                Rolünü seç, deneyimini buna göre kişiselleştirelim.
              </p>
            </div>

            <div className="space-y-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-normal text-left ${
                    role === r.value
                      ? 'border-accent bg-accent-lighter dark:bg-accent/10 shadow-sm'
                      : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    role === r.value ? 'bg-accent/15 text-accent' : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-500'
                  }`}>
                    <r.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      {r.title}
                    </p>
                    <p className="text-body-md text-neutral-500">{r.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    role === r.value ? 'border-accent bg-accent' : 'border-neutral-300 dark:border-dark-border'
                  }`}>
                    {role === r.value && <Check size={12} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!role}
              className="w-full mt-6 h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-fast flex items-center justify-center gap-2"
            >
              Devam Et
              <ArrowRight size={18} />
            </button>

            <p className="mt-6 text-center text-body-md text-neutral-500">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="text-accent font-semibold hover:text-accent-600 transition-colors">
                Giriş Yap
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
                Hesabını Oluştur
              </h1>
              <p className="mt-2 text-body-lg text-neutral-500">
                Bilgilerini gir ve hemen başla.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.form && (
                  <div className="p-3 rounded-lg bg-error-light dark:bg-red-500/10 border border-error/20 text-body-sm text-error font-medium">
                    {errors.form}
                  </div>
                )}
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Ad Soyad</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input id="fullName" type="text" value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.fullName ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-body-sm text-error">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input id="email" type="email" value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="ornek@email.com"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.email ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
                    />
                  </div>
                  {errors.email && <p className="text-body-sm text-error">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Telefon</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input id="phone" type="tel" value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="0532 123 45 67"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.phone ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
                    />
                  </div>
                  {errors.phone && <p className="text-body-sm text-error">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Şifre</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="En az 8 karakter"
                      className={`w-full h-11 pl-10 pr-11 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.password ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={showPassword ? 'Gizle' : 'Göster'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="flex gap-1.5 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          strength >= i
                            ? strength <= 1 ? 'bg-error' : strength <= 2 ? 'bg-warning' : 'bg-success'
                            : 'bg-neutral-200 dark:bg-dark-border'
                        }`} />
                      ))}
                    </div>
                  )}
                  {errors.password && <p className="text-body-sm text-error">{errors.password}</p>}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 pt-1 cursor-pointer">
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => { setAcceptTerms(e.target.checked); setErrors({ ...errors, terms: '' }); }}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-accent focus:ring-accent/20"
                  />
                  <span className="text-body-sm text-neutral-500">
                    <Link href="/terms" className="text-accent hover:underline">Kullanım Şartları</Link>&apos;nı ve{' '}
                    <Link href="/privacy" className="text-accent hover:underline">Gizlilik Politikası</Link>&apos;nı okudum, kabul ediyorum.
                  </span>
                </label>
                {errors.terms && <p className="text-body-sm text-error">{errors.terms}</p>}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="h-12 px-5 border border-neutral-200 dark:border-dark-border rounded-lg text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Geri
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-fast flex items-center justify-center gap-2">
                    {loading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <>Kayıt Ol<ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <p className="mt-6 text-center text-body-md text-neutral-500">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="text-accent font-semibold hover:text-accent-600 transition-colors">
                Giriş Yap
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
