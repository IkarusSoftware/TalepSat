'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  MessageSquare,
  Menu,
  X,
  Plus,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Sun,
  Moon,
  Package,
  Bookmark,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UserDropdown } from './user-dropdown';
import { useTheme } from '@/components/theme-provider';

const navLinks = [
  { href: '/explore', label: 'İlanları Keşfet', icon: Search },
  { href: '/create', label: 'İlan Oluştur', icon: Plus },
  { href: '/dashboard', label: 'İlanlarım', icon: LayoutDashboard },
  { href: '/offers', label: 'Tekliflerim', icon: FileText },
  { href: '/orders', label: 'Siparişlerim', icon: Package },
  { href: '/saved', label: 'Kaydedilenler', icon: Bookmark },
  { href: '/messages', label: 'Mesajlar', icon: MessageSquare },
];

interface HeaderProps {
  siteName?: string;
  logoUrl?: string;
}

export function Header({ siteName = 'TalepSat', logoUrl = '' }: HeaderProps) {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLoggedIn = !!session?.user;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/unread-count');
        if (res.ok) {
          const data = await res.json();
          setUnreadMessages(data.messages ?? 0);
          setUnreadNotifications(data.notifications ?? 0);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-normal ${
        scrolled
          ? 'h-16 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl shadow-sm border-b border-neutral-200/50 dark:border-dark-border/50'
          : 'h-20 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={120}
              height={36}
              className={`object-contain transition-all duration-normal ${scrolled ? 'h-8' : 'h-9'}`}
              unoptimized
            />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {siteName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className={`font-bold transition-all duration-normal ${
                  scrolled ? 'text-lg' : 'text-xl'
                } text-neutral-900 dark:text-dark-textPrimary`}
              >
                {siteName}
              </span>
            </>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-body-md font-medium text-neutral-600 hover:text-neutral-900 dark:text-dark-textSecondary dark:hover:text-dark-textPrimary rounded-md hover:bg-neutral-100 dark:hover:bg-dark-surface transition-colors duration-fast flex items-center gap-1.5"
            >
              {link.label}
              {link.href === '/messages' && unreadMessages > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold leading-none">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-dark-textSecondary dark:hover:text-dark-textPrimary hover:bg-neutral-100 dark:hover:bg-dark-surface transition-colors duration-fast"
            aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {isLoggedIn ? (
            <>
              <Link
                href="/notifications"
                className="relative p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-dark-surface transition-colors duration-fast"
                aria-label="Bildirimler"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
                )}
              </Link>
              <UserDropdown />
              <Link
                href="/create"
                className="ml-2 inline-flex items-center gap-2 h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-full hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast shadow-sm hover:shadow-md"
              >
                <Plus size={16} />
                İlan Oluştur
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary hover:text-neutral-900 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-full hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast shadow-sm hover:shadow-md"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-dark-surface border-b border-neutral-200 dark:border-dark-border shadow-lg"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-lg font-medium text-neutral-700 hover:bg-neutral-100 dark:text-dark-textPrimary dark:hover:bg-dark-surfaceRaised transition-colors"
                >
                  {link.icon && <link.icon size={20} />}
                  {link.label}
                  {link.href === '/messages' && unreadMessages > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              ))}
              <hr className="my-2 border-neutral-200 dark:border-dark-border" />
              <Link
                href="/seller-dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-lg font-medium text-neutral-700 hover:bg-neutral-100 dark:text-dark-textPrimary dark:hover:bg-dark-surfaceRaised transition-colors"
              >
                <BarChart3 size={20} /> Satıcı Paneli
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-lg font-medium text-neutral-700 hover:bg-neutral-100 dark:text-dark-textPrimary dark:hover:bg-dark-surfaceRaised transition-colors"
              >
                <Settings size={20} /> Ayarlar
              </Link>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-lg font-medium text-neutral-700 hover:bg-neutral-100 dark:text-dark-textPrimary dark:hover:bg-dark-surfaceRaised transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
              </button>
              <hr className="my-2 border-neutral-200 dark:border-dark-border" />
              <Link
                href="/create"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 h-12 bg-accent text-white rounded-lg font-semibold hover:bg-accent-600 transition-colors"
              >
                <Plus size={18} />
                İlan Oluştur
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
