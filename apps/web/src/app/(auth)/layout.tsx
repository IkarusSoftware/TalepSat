import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex flex-col">
      {/* Minimal header */}
      <header className="h-16 flex items-center justify-center border-b border-neutral-200/50 dark:border-dark-border bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold text-neutral-900 dark:text-dark-textPrimary">
            TalepSat
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="py-6 text-center text-body-sm text-neutral-400">
        &copy; {new Date().getFullYear()} TalepSat. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
