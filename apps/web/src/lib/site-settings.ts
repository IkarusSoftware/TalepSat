import { prisma } from '@/lib/prisma';

export type SiteSettings = {
  // Genel
  site_name: string;
  site_tagline: string;
  site_url: string;
  contact_email: string;
  support_phone: string;
  // Görünüm
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  // Kayıt & Giriş
  registration_open: boolean;
  email_verification_required: boolean;
  google_login_enabled: boolean;
  // İlan
  listing_default_days: number;
  listing_max_images: number;
  listing_requires_approval: boolean;
  listing_max_budget: number;
  // Teklif
  offer_min_amount: number;
  offer_max_revisions: number;
  commission_rate: number;
  // Bildirimler
  email_notifications_enabled: boolean;
  admin_notification_email: string;
  // SEO
  seo_title: string;
  seo_description: string;
  seo_og_image: string;
  // Bakım
  maintenance_mode: boolean;
  maintenance_message: string;
};

const DEFAULTS: SiteSettings = {
  site_name: 'TalepSat',
  site_tagline: 'İhtiyacını Yaz, Satıcılar Yarışsın',
  site_url: 'http://localhost:3001',
  contact_email: '',
  support_phone: '',
  logo_url: '',
  favicon_url: '',
  primary_color: '#6366f1',
  registration_open: true,
  email_verification_required: false,
  google_login_enabled: false,
  listing_default_days: 30,
  listing_max_images: 5,
  listing_requires_approval: false,
  listing_max_budget: 1000000,
  offer_min_amount: 1,
  offer_max_revisions: 3,
  commission_rate: 0,
  email_notifications_enabled: true,
  admin_notification_email: '',
  seo_title: '',
  seo_description: '',
  seo_og_image: '',
  maintenance_mode: false,
  maintenance_message: 'Sitemiz şu an bakımda. Lütfen daha sonra tekrar deneyin.',
};

function parse(map: Record<string, string>): SiteSettings {
  const bool = (key: keyof SiteSettings) =>
    key in map ? map[key as string] === 'true' : DEFAULTS[key] as boolean;
  const num = (key: keyof SiteSettings) =>
    key in map ? parseFloat(map[key as string]) || (DEFAULTS[key] as number) : DEFAULTS[key] as number;
  const str = (key: keyof SiteSettings) =>
    key in map ? map[key as string] : DEFAULTS[key] as string;

  return {
    site_name: str('site_name'),
    site_tagline: str('site_tagline'),
    site_url: str('site_url'),
    contact_email: str('contact_email'),
    support_phone: str('support_phone'),
    logo_url: str('logo_url'),
    favicon_url: str('favicon_url'),
    primary_color: str('primary_color'),
    registration_open: bool('registration_open'),
    email_verification_required: bool('email_verification_required'),
    google_login_enabled: bool('google_login_enabled'),
    listing_default_days: num('listing_default_days'),
    listing_max_images: num('listing_max_images'),
    listing_requires_approval: bool('listing_requires_approval'),
    listing_max_budget: num('listing_max_budget'),
    offer_min_amount: num('offer_min_amount'),
    offer_max_revisions: num('offer_max_revisions'),
    commission_rate: num('commission_rate'),
    email_notifications_enabled: bool('email_notifications_enabled'),
    admin_notification_email: str('admin_notification_email'),
    seo_title: str('seo_title'),
    seo_description: str('seo_description'),
    seo_og_image: str('seo_og_image'),
    maintenance_mode: bool('maintenance_mode'),
    maintenance_message: str('maintenance_message'),
  };
}

// Her zaman DB'den taze veri okur — cache yok
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return parse(map);
  } catch {
    return DEFAULTS;
  }
}

// API route'ları için alias (aynı fonksiyon)
export const getSettingsDirect = getSiteSettings;
