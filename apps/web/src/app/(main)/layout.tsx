import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getSiteSettings } from '@/lib/site-settings';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <>
      <Header siteName={settings.site_name} logoUrl={settings.logo_url} />
      <main className="min-h-screen pt-20">{children}</main>
      <Footer siteName={settings.site_name} />
    </>
  );
}
