'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Repeat,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react';
import { usePublicSettings } from '@/hooks/use-public-settings';

type Role = 'buyer' | 'seller' | 'both';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const roles: { value: Role; icon: typeof ShoppingBag; title: string; desc: string }[] = [
  { value: 'buyer', icon: ShoppingBag, title: 'Aliciyim', desc: 'Ilan olustur, teklif al' },
  { value: 'seller', icon: Store, title: 'Saticiyim', desc: 'Ilanlari kesfet, teklif ver' },
  { value: 'both', icon: Repeat, title: 'Her Ikisi', desc: 'Hem al hem sat' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = usePublicSettings();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [form, setForm] = useState<FormState>({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNext = () => {
    if (!role) {
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!form.fullName || form.fullName.trim().length < 2) nextErrors.fullName = 'Isim en az 2 karakter olmali';
    if (!form.email) nextErrors.email = 'Email adresi gerekli';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Gecerli bir email girin';
    if (!form.phone) nextErrors.phone = 'Telefon numarasi gerekli';
    else if (!/^(\+90|0)?[0-9]{10}$/.test(form.phone.replace(/\s/g, ''))) nextErrors.phone = 'Gecerli bir telefon numarasi girin';
    if (!form.password) nextErrors.password = 'Sifre gerekli';
    else if (form.password.length < 8) nextErrors.password = 'En az 8 karakter olmali';
    else if (!/[A-Z]/.test(form.password)) nextErrors.password = 'En az bir buyuk harf icermeli';
    else if (!/[0-9]/.test(form.password)) nextErrors.password = 'En az bir rakam icermeli';
    if (!acceptTerms) nextErrors.terms = 'Kullanim sartlarini kabul etmelisiniz';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || 'Kayit basarisiz oldu.' });
        return;
      }

      if (data.requiresVerification) {
        setSuccessMessage(data.message || 'Hesabiniz olusturuldu. Giris yapmadan once hesabinizin dogrulanmasi gerekiyor.');
        return;
      }

      const result = await signIn('credentials', {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrors({ form: 'Bir hata olustu. Lutfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const strength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;

  if (!settingsLoading && !settings.registration_open) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
        className="w-full max-w-[480px]"
      >
        <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
            <Lock size={22} />
          </div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Yeni Kayitlar Kapali</h1>
          <p className="mt-3 text-body-lg text-neutral-500">
            Su anda yeni kullanici kaydi alinmiyor. Daha sonra tekrar deneyebilir veya mevcut hesabinizla giris yapabilirsiniz.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-6 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            Giris Yap
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    );
  }

  if (successMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
        className="w-full max-w-[480px]"
      >
        <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
            <Check size={22} />
          </div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Hesabin Olusturuldu</h1>
          <p className="mt-3 text-body-lg text-neutral-500">{successMessage}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-6 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            Giris Sayfasina Git
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="w-full max-w-[480px]"
    >
      <div className="flex items-center gap-2 mb-8 justify-center">
        {[1, 2].map((currentStep) => (
          <div key={currentStep} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-bold transition-colors ${
                step >= currentStep
                  ? 'bg-accent text-white'
                  : 'bg-neutral-200 dark:bg-dark-surfaceRaised text-neutral-400'
              }`}
            >
              {step > currentStep ? <Check size={16} /> : currentStep}
            </div>
            {currentStep < 2 && (
              <div
                className={`w-12 h-0.5 rounded transition-colors ${
                  step > 1 ? 'bg-accent' : 'bg-neutral-200 dark:bg-dark-border'
                }`}
              />
            )}
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
              <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Nasil Kullanacaksin?</h1>
              <p className="mt-2 text-body-lg text-neutral-500">Rolunu sec, deneyimini buna gore kisisellestirelim.</p>
            </div>

            <div className="space-y-3">
              {roles.map((currentRole) => (
                <button
                  key={currentRole.value}
                  onClick={() => setRole(currentRole.value)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-normal text-left ${
                    role === currentRole.value
                      ? 'border-accent bg-accent-lighter dark:bg-accent/10 shadow-sm'
                      : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      role === currentRole.value
                        ? 'bg-accent/15 text-accent'
                        : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-500'
                    }`}
                  >
                    <currentRole.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      {currentRole.title}
                    </p>
                    <p className="text-body-md text-neutral-500">{currentRole.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      role === currentRole.value ? 'border-accent bg-accent' : 'border-neutral-300 dark:border-dark-border'
                    }`}
                  >
                    {role === currentRole.value && <Check size={12} className="text-white" />}
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
              Zaten hesabin var mi?{' '}
              <Link href="/login" className="text-accent font-semibold hover:text-accent-600 transition-colors">
                Giris Yap
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
              <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Hesabini Olustur</h1>
              <p className="mt-2 text-body-lg text-neutral-500">Bilgilerini gir ve hemen basla.</p>
            </div>

            <div className="bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200/50 dark:border-dark-border/80 shadow-sm dark:shadow-lg dark:shadow-black/20 p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {settings.email_verification_required && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-body-sm text-warning font-medium">
                    Kayittan sonra giris yapabilmeniz icin hesabinizin dogrulanmasi gerekir.
                  </div>
                )}
                {errors.form && (
                  <div className="p-3 rounded-lg bg-error-light dark:bg-red-500/10 border border-error/20 text-body-sm text-error font-medium">
                    {errors.form}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Adiniz Soyadiniz"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        errors.fullName ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-body-sm text-error">{errors.fullName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="ornek@email.com"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        errors.email ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-body-sm text-error">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Telefon
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="0532 123 45 67"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        errors.phone ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-body-sm text-error">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Sifre
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="En az 8 karakter"
                      className={`w-full h-11 pl-10 pr-11 rounded-lg border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        errors.password ? 'border-error' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={showPassword ? 'Gizle' : 'Goster'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="flex gap-1.5 mt-2">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength >= index
                              ? strength <= 1
                                ? 'bg-error'
                                : strength <= 2
                                  ? 'bg-warning'
                                  : 'bg-success'
                              : 'bg-neutral-200 dark:bg-dark-border'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {errors.password && <p className="text-body-sm text-error">{errors.password}</p>}
                </div>

                <label className="flex items-start gap-3 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      setErrors((prev) => ({ ...prev, terms: '' }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-accent focus:ring-accent/20"
                  />
                  <span className="text-body-sm text-neutral-500">
                    <Link href="/terms" className="text-accent hover:underline">
                      Kullanim Sartlari
                    </Link>
                    {" "}ve{" "}
                    <Link href="/privacy" className="text-accent hover:underline">
                      Gizlilik Politikasi
                    </Link>
                    {" "}kabul ediyorum.
                  </span>
                </label>
                {errors.terms && <p className="text-body-sm text-error">{errors.terms}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-5 border border-neutral-200 dark:border-dark-border rounded-lg text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={loading || settingsLoading}
                    className="flex-1 h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-fast flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <>
                        Kayit Ol
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <p className="mt-6 text-center text-body-md text-neutral-500">
              Zaten hesabin var mi?{' '}
              <Link href="/login" className="text-accent font-semibold hover:text-accent-600 transition-colors">
                Giris Yap
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
