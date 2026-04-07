import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/session-provider';
import { RealtimeProvider } from '@/components/realtime-provider';
import { getSiteSettings } from '@/lib/site-settings';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name || 'TalepSat';
  const tagline = settings.site_tagline || 'İhtiyacını Yaz, Satıcılar Yarışsın';
  const title = settings.seo_title || `${siteName} — ${tagline}`;
  const description =
    settings.seo_description ||
    "Türkiye'nin ilk talep odaklı ticaret platformu. İlanını aç, teklifler gelsin, en uygununu seç. Reverse marketplace ile alıcı odaklı ticaret.";

  return {
    title,
    description,
    keywords: [
      'reverse marketplace',
      'talep odaklı ticaret',
      'toptan satın alma',
      'teklif al',
      'B2B marketplace',
      'ilan aç teklif al',
    ],
    icons: settings.favicon_url
      ? { icon: settings.favicon_url, shortcut: settings.favicon_url }
      : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'tr_TR',
      ...(settings.seo_og_image ? { images: [{ url: settings.seo_og_image }] } : {}),
    },
  };
}

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
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
