'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Gosterge Paneli', icon: LayoutDashboard },
  { href: '/admin/admins', label: 'Admin Hesaplari', icon: Shield },
  { href: '/admin/users', label: 'Kullanicilar', icon: Users },
  { href: '/admin/listings', label: 'Ilanlar', icon: FileText },
  { href: '/admin/plans', label: 'Planlar', icon: CreditCard },
  { href: '/admin/reports', label: 'Raporlar', icon: Flag },
  { href: '/admin/settings', label: 'Site Ayarlari', icon: Settings },
];

function getInitials(name?: string | null) {
  if (!name) return 'A';
  return name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const adminUser = session?.user as {
    kind?: string;
    adminRole?: string;
    adminStatus?: string;
  } | undefined;

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    if (status === 'unauthenticated') {
      router.replace('/admin/login');
      return;
    }

    if (status === 'authenticated' && (adminUser?.kind !== 'admin' || adminUser.adminStatus !== 'active')) {
      router.replace('/admin/login');
    }
  }, [adminUser?.adminStatus, adminUser?.kind, isLoginPage, router, status]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-dark-bg">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (adminUser?.kind !== 'admin' || adminUser.adminStatus !== 'active') {
    return null;
  }

  const userName = session?.user?.name ?? 'Admin';
  const userEmail = session?.user?.email ?? '';
  const roleLabel = adminUser.adminRole === 'superadmin' ? 'Superadmin' : 'Staff';

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300 dark:border-dark-border dark:bg-dark-surface ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        <div className={`shrink-0 border-b border-neutral-100 dark:border-dark-border ${collapsed ? 'p-2.5' : 'p-4'}`}>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised ${collapsed ? 'justify-center p-1.5' : 'p-2'}`}
              title={collapsed ? userName : undefined}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[13px] font-bold text-white shadow-sm">
                {getInitials(userName)}
              </div>

              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-body-sm font-semibold leading-tight text-neutral-900 dark:text-dark-textPrimary">{userName}</p>
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-neutral-400">{userEmail}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{roleLabel}</p>
                  </div>
                  <ChevronDown
                    size={15}
                    className={`shrink-0 text-neutral-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-dark-border dark:bg-dark-surface ${
                    collapsed ? 'left-full top-0 ml-2 w-52' : 'left-0 right-0 top-full mt-1.5'
                  }`}
                >
                  <div className="border-b border-neutral-100 px-4 py-3 dark:border-dark-border">
                    <p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">{userName}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">{userEmail}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{roleLabel}</p>
                  </div>

                  <div className="space-y-0.5 p-1.5">
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-neutral-600 transition-colors hover:bg-neutral-50 dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
                    >
                      <ExternalLink size={15} className="text-neutral-400" />
                      Siteye Don
                    </Link>

                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut({ redirect: false, callbackUrl: '/admin/login' });
                        router.replace('/admin/login');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-error transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut size={15} />
                      Cikis Yap
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-md font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised'
                }`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon size={20} className={isActive ? 'text-primary' : 'text-neutral-400'} />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-neutral-100 p-2.5 dark:border-dark-border">
          <div className={`flex items-center gap-2.5 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary shrink-0">
              <Shield size={13} className="text-white" />
            </div>
            {!collapsed && <span className="text-body-sm font-bold text-neutral-500">TalepSat Admin</span>}
          </div>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-body-md text-neutral-400 transition-colors hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && 'Daralt'}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[260px]'}`}>
        {children}
      </main>
    </div>
  );
}
