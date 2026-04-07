'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, Mail, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Cloud SVG — görseldeki gibi çok katmanlı teal/blue bulut ─────────────────
function Cloud({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 90" className={className} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`cg-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#93c5fd" stopOpacity="0.95" />
          <stop offset="40%"  stopColor="#60a5fa" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3730a3" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`ch-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="white"   stopOpacity="0.5" />
          <stop offset="100%" stopColor="white"   stopOpacity="0"   />
        </linearGradient>
        <clipPath id={`cc-${id}`}>
          {/* flat bottom clip */}
          <rect x="0" y="0" width="200" height="78" />
        </clipPath>
      </defs>

      {/* --- puff shapes (clipped to flat bottom) --- */}
      <g clipPath={`url(#cc-${id})`}>
        {/* base bar */}
        <rect x="10" y="60" width="180" height="20" rx="10" fill={`url(#cg-${id})`} />
        {/* bumps left→right */}
        <circle cx="32"  cy="58" r="22" fill={`url(#cg-${id})`} />
        <circle cx="65"  cy="46" r="28" fill={`url(#cg-${id})`} />
        <circle cx="100" cy="42" r="30" fill={`url(#cg-${id})`} />
        <circle cx="138" cy="48" r="25" fill={`url(#cg-${id})`} />
        <circle cx="168" cy="55" r="20" fill={`url(#cg-${id})`} />

        {/* highlight layer */}
        <circle cx="32"  cy="58" r="22" fill={`url(#ch-${id})`} opacity="0.6" />
        <circle cx="65"  cy="46" r="28" fill={`url(#ch-${id})`} opacity="0.5" />
        <circle cx="100" cy="42" r="30" fill={`url(#ch-${id})`} opacity="0.5" />
        <circle cx="138" cy="48" r="25" fill={`url(#ch-${id})`} opacity="0.5" />
        <circle cx="168" cy="55" r="20" fill={`url(#ch-${id})`} opacity="0.6" />

        {/* bright top-edge specular on each bump */}
        <ellipse cx="60"  cy="26" rx="10" ry="5"  fill="white" opacity="0.25" transform="rotate(-10,60,26)" />
        <ellipse cx="96"  cy="22" rx="12" ry="5"  fill="white" opacity="0.22" />
        <ellipse cx="134" cy="28" rx="9"  ry="4"  fill="white" opacity="0.2"  transform="rotate(8,134,28)" />
      </g>

      {/* soft bottom shadow */}
      <ellipse cx="100" cy="78" rx="90" ry="8" fill="#1e1b4b" opacity="0.25" />
    </svg>
  );
}

// ── Hot Air Balloon — görseldeki gibi şeritli ─────────────────────────────────
function Balloon({ id, stripes, className }: {
  id: string;
  stripes: [string, string];   // [light, dark] alternating stripe pair
  className?: string;
}) {
  const [light, dark] = stripes;
  // 6 vertical stripe segments on the ellipse
  const W = 60, H = 80, cx = 30, cy = 36;
  const rx = 22, ry = 30;
  // Build stripe paths via clip-path columns
  const stripeW = W / 6;

  return (
    <svg viewBox="0 0 60 110" className={className} style={{ overflow: 'visible' }}>
      <defs>
        {/* Envelope clip */}
        <clipPath id={`ec-${id}`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        {/* Sheen gradient */}
        <radialGradient id={`sh-${id}`} cx="30%" cy="25%" r="55%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.35" />
          <stop offset="60%"  stopColor="white" stopOpacity="0.05" />
          <stop offset="100%" stopColor="black" stopOpacity="0.15" />
        </radialGradient>
        {/* Outer glow */}
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Subtle outer glow */}
      <ellipse cx={cx} cy={cy} rx={rx+4} ry={ry+4} fill={light} opacity="0.12" />

      {/* --- Stripes (clipped to envelope ellipse) --- */}
      <g clipPath={`url(#ec-${id})`}>
        {/* Fill all with dark first */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={dark} />
        {/* Light stripes every other column */}
        {[0, 2, 4].map((col) => (
          <rect
            key={col}
            x={col * stripeW}
            y={cy - ry}
            width={stripeW}
            height={ry * 2}
            fill={light}
          />
        ))}
        {/* Vertical divider lines */}
        {[1,2,3,4,5].map((col) => (
          <line
            key={col}
            x1={col * stripeW} y1={cy - ry}
            x2={col * stripeW} y2={cy + ry}
            stroke="black" strokeWidth="0.5" opacity="0.15"
          />
        ))}
        {/* Horizontal belt lines */}
        <ellipse cx={cx} cy={cy - ry * 0.4} rx={rx} ry="2" fill="black" opacity="0.12" />
        <ellipse cx={cx} cy={cy + ry * 0.35} rx={rx} ry="2" fill="black" opacity="0.12" />
      </g>

      {/* Sheen overlay */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#sh-${id})`} />

      {/* Top cap */}
      <ellipse cx={cx} cy={cy - ry} rx={rx * 0.55} ry="4" fill={dark} opacity="0.85" />
      <ellipse cx={cx} cy={cy - ry} rx={rx * 0.4}  ry="2.5" fill="white" opacity="0.3" />

      {/* Bottom opening */}
      <ellipse cx={cx} cy={cy + ry} rx={rx * 0.45} ry="3.5" fill={dark} opacity="0.8" />

      {/* Ropes */}
      <line x1={cx - 6} y1={cy + ry + 2} x2={cx - 9}  y2={cy + ry + 14} stroke={dark} strokeWidth="1.2" opacity="0.75" />
      <line x1={cx + 6} y1={cy + ry + 2} x2={cx + 9}  y2={cy + ry + 14} stroke={dark} strokeWidth="1.2" opacity="0.75" />
      <line x1={cx - 3} y1={cy + ry + 2} x2={cx - 4}  y2={cy + ry + 14} stroke={dark} strokeWidth="0.8" opacity="0.5" />
      <line x1={cx + 3} y1={cy + ry + 2} x2={cx + 4}  y2={cy + ry + 14} stroke={dark} strokeWidth="0.8" opacity="0.5" />

      {/* Basket */}
      <rect x={cx - 11} y={cy + ry + 13} width="22" height="11" rx="3" fill={dark} />
      <rect x={cx - 11} y={cy + ry + 13} width="22" height="4"  rx="2" fill={light} opacity="0.5" />
      <line x1={cx - 4} y1={cy + ry + 13} x2={cx - 4} y2={cy + ry + 24} stroke="black" strokeWidth="0.8" opacity="0.2" />
      <line x1={cx + 4} y1={cy + ry + 13} x2={cx + 4} y2={cy + ry + 24} stroke="black" strokeWidth="0.8" opacity="0.2" />
      <line x1={cx - 11} y1={cy + ry + 19} x2={cx + 11} y2={cy + ry + 19} stroke="black" strokeWidth="0.8" opacity="0.2" />
    </svg>
  );
}

// ── Mountain silhouette ───────────────────────────────────────────────────────
function Mountains({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 300" className={className} preserveAspectRatio="xMidYMax slice">
      {/* Back mountains */}
      <polygon points="0,300 150,80 300,300" fill="#1e1b4b" opacity="0.6" />
      <polygon points="100,300 300,50 500,300" fill="#1e1b4b" opacity="0.5" />
      <polygon points="300,300 500,90 700,300" fill="#1e1b4b" opacity="0.6" />
      <polygon points="500,300 700,60 900,300" fill="#1e1b4b" opacity="0.5" />
      {/* Front mountains */}
      <polygon points="-50,300 100,130 260,300" fill="#2d1b69" opacity="0.9" />
      <polygon points="80,300 250,100 420,300" fill="#312e81" opacity="0.95" />
      <polygon points="250,300 430,120 610,300" fill="#2d1b69" opacity="0.9" />
      <polygon points="450,300 620,110 800,300" fill="#312e81" opacity="0.95" />
      <polygon points="620,300 780,140 950,300" fill="#2d1b69" opacity="0.9" />
    </svg>
  );
}

// ── Star field ────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i, cx: Math.random() * 100, cy: Math.random() * 60,
  r: Math.random() * 1.2 + 0.4,
  delay: Math.random() * 4,
}));

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as { role?: string })?.role === 'admin') {
      router.replace('/admin');
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    if (status === 'authenticated') {
      await signOut({ redirect: false });
    }
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('E-posta veya şifre hatalı.');
      setLoading(false);
      return;
    }
    const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
    const sessionData = await sessionRes.json().catch(() => null);
    if ((sessionData?.user as { role?: string } | undefined)?.role !== 'admin') {
      setError('Bu hesap admin yetkisine sahip değil.');
      setLoading(false);
      return;
    }
    window.location.href = '/admin';
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a0a3e]">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #2e1065 0%, #3b0764 40%, #1e1b4b 100%)' }}
    >
      {/* ── Background mountains (subtle breathing) ── */}
      <motion.div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        animate={{ scaleY: [1, 1.008, 1], scaleX: [1, 1.003, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'bottom center' }}
      >
        <Mountains className="w-full h-[55vh] opacity-80" />
      </motion.div>

      {/* ── Background stars ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
        {STARS.map((s) => (
          <motion.circle
            key={s.id} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2.5 + s.delay, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          />
        ))}
      </svg>

      {/* ── Login card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        className="w-full max-w-[400px] relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}
      >
        {/* ── Top: animated scene ── */}
        <div
          className="relative overflow-hidden"
          style={{
            height: 220,
            background: 'linear-gradient(180deg, #0f0728 0%, #1e0a4a 40%, #2d1b69 100%)',
          }}
        >
          {/* CSS keyframes for perfectly smooth cloud loops */}
          <style>{`
            @keyframes cloudR { from { transform: translateX(-220px); } to { transform: translateX(460px); } }
            @keyframes cloudL { from { transform: translateX(460px); } to { transform: translateX(-220px); } }
          `}</style>
          {/* Stars in card */}
          <svg className="absolute inset-0 w-full h-full">
            {STARS.slice(0, 20).map((s) => (
              <motion.circle
                key={s.id} cx={`${s.cx}%`} cy={`${s.cy * 0.7}%`} r={s.r * 0.9} fill="white"
                animate={{ opacity: [0.15, 0.9, 0.15] }}
                transition={{ duration: 2 + s.delay, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
              />
            ))}
          </svg>

          {/* Mountains inside card */}
          <div className="absolute inset-x-0 bottom-0">
            <Mountains className="w-full h-28" />
          </div>

          {/* Cloud layer 1 — back, slow, rightward */}
          <div className="absolute top-4 pointer-events-none opacity-70"
            style={{ animation: 'cloudR 30s linear infinite' }}>
            <Cloud id="c1" className="w-32" />
          </div>
          <div className="absolute top-4 pointer-events-none opacity-70"
            style={{ animation: 'cloudR 30s linear infinite', animationDelay: '-15s' }}>
            <Cloud id="c2" className="w-32" />
          </div>

          {/* Cloud layer 2 — mid, leftward */}
          <div className="absolute top-12 pointer-events-none opacity-80"
            style={{ animation: 'cloudL 22s linear infinite' }}>
            <Cloud id="c3" className="w-40" />
          </div>
          <div className="absolute top-12 pointer-events-none opacity-80"
            style={{ animation: 'cloudL 22s linear infinite', animationDelay: '-11s' }}>
            <Cloud id="c4" className="w-40" />
          </div>

          {/* Cloud layer 3 — front, rightward, fast */}
          <div className="absolute top-20 pointer-events-none opacity-90"
            style={{ animation: 'cloudR 16s linear infinite' }}>
            <Cloud id="c5" className="w-44" />
          </div>
          <div className="absolute top-20 pointer-events-none opacity-90"
            style={{ animation: 'cloudR 16s linear infinite', animationDelay: '-8s' }}>
            <Cloud id="c6" className="w-44" />
          </div>

          {/* ── Balloon 1 — big center ── */}
          <motion.div className="absolute pointer-events-none" style={{ left: '38%', top: 8 }}
            animate={{ y: [0, -11, 0], rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}>
            <Balloon id="b1" stripes={['#fde68a', '#7c3aed']} className="w-16 drop-shadow-lg" />
          </motion.div>

          {/* ── Balloon 2 — left small ── */}
          <motion.div className="absolute pointer-events-none" style={{ left: '6%', top: 24 }}
            animate={{ y: [0, -8, 0], rotate: [1, -1, 1] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror', delay: 1 }}>
            <Balloon id="b2" stripes={['#fcd34d', '#6d28d9']} className="w-10" />
          </motion.div>

          {/* ── Balloon 3 — right ── */}
          <motion.div className="absolute pointer-events-none" style={{ right: '7%', top: 16 }}
            animate={{ y: [0, -10, 0], rotate: [-1, 1.5, -1] }}
            transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror', delay: 2.5 }}>
            <Balloon id="b3" stripes={['#fef08a', '#4338ca']} className="w-12" />
          </motion.div>

          {/* ── Balloon 4 — tiny ── */}
          <motion.div className="absolute pointer-events-none" style={{ right: '32%', top: 44 }}
            animate={{ y: [0, -5, 0], rotate: [0, 1, 0] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror', delay: 1.8 }}>
            <Balloon id="b4" stripes={['#fde68a', '#4f46e5']} className="w-7 opacity-80" />
          </motion.div>

          {/* Divider icon */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-[#1e2235] border border-white/10 flex items-center justify-center shadow-lg">
              <ChevronDown size={18} className="text-neutral-400" />
            </div>
          </div>
        </div>

        {/* ── Bottom: login form ── */}
        <div className="bg-[#1a1f35] px-8 pt-10 pb-8">
          <h2 className="text-center text-sm font-bold tracking-[0.2em] text-neutral-300 uppercase mb-7">
            Admin Girişi
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-POSTA"
                autoComplete="username"
                required
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-neutral-600 placeholder:text-xs placeholder:tracking-widest text-sm focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ŞİFRE"
                autoComplete="current-password"
                required
                className="w-full h-11 pl-11 pr-11 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-neutral-600 placeholder:text-xs placeholder:tracking-widest text-sm focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 rounded-xl font-bold text-sm tracking-widest uppercase text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none mt-2"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-[11px] text-neutral-700 mt-6 tracking-wide">
            Yalnızca yetkili yöneticiler erişebilir
          </p>
        </div>
      </motion.div>
    </div>
  );
}
