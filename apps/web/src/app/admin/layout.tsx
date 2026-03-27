'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Flag, CreditCard, Settings,
  ChevronLeft, ChevronRight, Shield, LogOut, Loader2,
  ExternalLink, ChevronDown, FileText,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin',           label: 'Gösterge Paneli',       icon: LayoutDashboard },
  { href: '/admin/users',     label: 'Kullanıcılar',           icon: Users           },
  { href: '/admin/listings',  label: 'İlanlar',                icon: FileText        },
  { href: '/admin/plans',     label: 'Planlar',                icon: CreditCard      },
  { href: '/admin/reports',   label: 'Raporlar & Şikayetler',  icon: Flag            },
  { href: '/admin/settings',  label: 'Site Ayarları',          icon: Settings        },
];

function getInitials(name?: string | null) {
  if (!name) return 'A';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (status === 'unauthenticated') {
      router.replace('/admin/login');
    } else if (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'admin') {
      router.replace('/');
    }
  }, [status, session, router, isLoginPage]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-dark-bg">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'admin') {
    return null;
  }

  const userName = session?.user?.name ?? 'Admin';
  const userEmail = session?.user?.email ?? '';

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-dark-bg">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col bg-white dark:bg-dark-surface border-r border-neutral-200 dark:border-dark-border transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        {/* ── Profile area (top) ── */}
        <div className={`border-b border-neutral-100 dark:border-dark-border shrink-0 ${collapsed ? 'p-2.5' : 'p-4'}`}>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-full flex items-center gap-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors ${collapsed ? 'justify-center p-1.5' : 'p-2'}`}
              title={collapsed ? userName : undefined}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-sm">
                {getInitials(userName)}
              </div>

              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary truncate leading-tight">{userName}</p>
                    <p className="text-[11px] text-neutral-400 truncate leading-tight mt-0.5">{userEmail}</p>
                  </div>
                  <ChevronDown
                    size={15}
                    className={`text-neutral-400 shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute z-50 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden ${
                    collapsed ? 'left-full ml-2 top-0 w-52' : 'left-0 right-0 top-full mt-1.5'
                  }`}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-dark-border">
                    <p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{userName}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{userEmail}</p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
                    >
                      <ExternalLink size={15} className="text-neutral-400" />
                      Siteye Dön
                    </Link>

                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut({ redirect: false });
                        router.replace('/admin/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} />
                      Çıkış Yap
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Nav links ── */}
        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:text-primary'
                    : 'text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised'
                }`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon size={20} className={isActive ? 'text-primary' : 'text-neutral-400'} />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom: logo + collapse ── */}
        <div className="border-t border-neutral-100 dark:border-dark-border p-2.5 space-y-1">
          {/* Logo row */}
          <div className={`flex items-center gap-2.5 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Shield size={13} className="text-white" />
            </div>
            {!collapsed && (
              <span className="text-body-sm font-bold text-neutral-500">TalepSat Admin</span>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-neutral-400 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && 'Daralt'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[260px]'}`}>
        {children}
      </main>
    </div>
  );
}
