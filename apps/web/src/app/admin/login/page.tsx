'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const role = (session?.user as { role?: string } | undefined)?.role;

    if (status === 'authenticated') {
      router.replace(role === 'admin' ? '/admin' : '/');
      return;
    }

    router.replace('/login?callbackUrl=/admin');
  }, [router, session, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Shield size={26} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Admin Girisi</h1>
          <p className="text-sm text-neutral-300">
            Guvenli giris ekranina yonlendiriliyorsun.
          </p>
        </div>
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    </div>
  );
}
