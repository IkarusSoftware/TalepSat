'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Flag,
  ChevronLeft, ChevronRight, Shield, LogOut,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Gösterge Paneli', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/reports', label: 'Raporlar & Şikayetler', icon: Flag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-dark-bg">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col bg-white dark:bg-dark-surface border-r border-neutral-200 dark:border-dark-border transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-neutral-100 dark:border-dark-border shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">TalepSat</span>
              <span className="block text-[11px] text-neutral-400 -mt-0.5">Admin Panel</span>
            </div>
          )}
        </div>

        {/* Nav links */}
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

        {/* Bottom */}
        <div className="border-t border-neutral-100 dark:border-dark-border p-2.5 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
            title={collapsed ? 'Siteye Dön' : undefined}
          >
            <LogOut size={20} className="text-neutral-400" />
            {!collapsed && 'Siteye Dön'}
          </Link>
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
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-[68px]' : 'ml-[260px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
