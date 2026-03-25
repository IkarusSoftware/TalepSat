import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { LiveFeedSection } from '@/components/landing/live-feed';
import { CategoriesSection } from '@/components/landing/categories-section';
import { StatsSection } from '@/components/landing/stats-section';
import { FeaturedListingsSection } from '@/components/landing/featured-listings';
import { SellerCtaSection } from '@/components/landing/seller-cta-section';
import { TrustSection } from '@/components/landing/trust-section';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <LiveFeedSection />
        <CategoriesSection />
        <StatsSection />
        <FeaturedListingsSection />
        <SellerCtaSection />
        <TrustSection />
      </main>
      <Footer />
    </>
  );
}
