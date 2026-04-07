'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ADMIN_AUTH_BASE_PATH, MARKETPLACE_AUTH_BASE_PATH } from '@/lib/auth-cookies';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/admin') ? ADMIN_AUTH_BASE_PATH : MARKETPLACE_AUTH_BASE_PATH;

  return (
    <NextAuthSessionProvider key={basePath} basePath={basePath}>
      {children}
    </NextAuthSessionProvider>
  );
}
