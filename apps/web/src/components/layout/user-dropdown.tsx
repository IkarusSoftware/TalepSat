'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User, Settings, BarChart3, LogOut } from 'lucide-react';

export function UserDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!session?.user) return null;

  const user = session.user as Record<string, unknown>;
  const name = (user.name as string) || 'Kullanıcı';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const role = (user.role as string) || 'buyer';
  const roleLabel =
    role === 'both'
      ? 'Alıcı & Satıcı'
      : role === 'buyer'
        ? 'Alıcı'
        : 'Satıcı';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm hover:bg-primary/20 transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-dark-border">
            <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{name}</p>
            <p className="text-body-sm text-neutral-500 capitalize">{roleLabel}</p>
          </div>

          {/* Links */}
          <div className="py-1.5">
            <Link
              href={`/profile/${user.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-body-md text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
            >
              <User size={16} className="text-neutral-400" /> Profilim
            </Link>
            <Link
              href="/seller-dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-body-md text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
            >
              <BarChart3 size={16} className="text-neutral-400" /> Satıcı Paneli
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-body-md text-neutral-700 dark:text-dark-textPrimary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
            >
              <Settings size={16} className="text-neutral-400" /> Ayarlar
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-neutral-100 dark:border-dark-border py-1.5">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: '/login' });
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} /> Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
