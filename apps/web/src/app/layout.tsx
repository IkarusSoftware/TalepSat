import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/session-provider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'TalepSat — İhtiyacını Yaz, Satıcılar Yarışsın',
  description:
    'Türkiye\'nin ilk talep odaklı ticaret platformu. İlanını aç, teklifler gelsin, en uygununu seç. Reverse marketplace ile alıcı odaklı ticaret.',
  keywords: [
    'reverse marketplace',
    'talep odaklı ticaret',
    'toptan satın alma',
    'teklif al',
    'B2B marketplace',
    'ilan aç teklif al',
  ],
  openGraph: {
    title: 'TalepSat — İhtiyacını Yaz, Satıcılar Yarışsın',
    description: 'İlanını aç, teklifler gelsin, en uygununu seç.',
    type: 'website',
    locale: 'tr_TR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-neutral-50 dark:bg-dark-bg font-sans antialiased dark:text-dark-textPrimary">
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
