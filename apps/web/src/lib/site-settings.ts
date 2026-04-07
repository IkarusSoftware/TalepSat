import { prisma } from '@/lib/prisma';

export type SiteSettings = {
  site_name: string;
  site_tagline: string;
  site_url: string;
  contact_email: string;
  support_phone: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  registration_open: boolean;
  email_verification_required: boolean;
  google_login_enabled: boolean;
  listing_default_days: number;
  listing_max_images: number;
  listing_requires_approval: boolean;
  listing_max_budget: number;
  offer_min_amount: number;
  offer_max_revisions: number;
  commission_rate: number;
  email_notifications_enabled: boolean;
  admin_notification_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_reply_to: string;
  seo_title: string;
  seo_description: string;
  seo_og_image: string;
  maintenance_mode: boolean;
  maintenance_message: string;
};

export type PublicSiteSettings = Pick<
  SiteSettings,
  | 'site_name'
  | 'site_tagline'
  | 'site_url'
  | 'contact_email'
  | 'support_phone'
  | 'registration_open'
  | 'email_verification_required'
  | 'google_login_enabled'
  | 'maintenance_mode'
  | 'maintenance_message'
> & {
  google_login_available: boolean;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  site_name: 'TalepSat',
  site_tagline: 'İhtiyacını Yaz, Satıcılar Yarışsın',
  site_url: 'http://localhost:3000',
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
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_pass: '',
  smtp_from_email: '',
  smtp_from_name: 'TalepSat',
  smtp_reply_to: '',
  seo_title: '',
  seo_description: '',
  seo_og_image: '',
  maintenance_mode: false,
  maintenance_message: 'Sitemiz şu an bakımda. Lütfen daha sonra tekrar deneyin.',
};

const SITE_SETTING_KEYS = Object.keys(DEFAULT_SITE_SETTINGS) as (keyof SiteSettings)[];

function parseSettingValue<K extends keyof SiteSettings>(key: K, rawValue?: string): SiteSettings[K] {
  const fallback = DEFAULT_SITE_SETTINGS[key];
  const normalizedValue = rawValue?.trim();

  if (rawValue == null) {
    return fallback;
  }

  if (typeof fallback === 'boolean') {
    if (!normalizedValue) {
      return fallback;
    }

    return (normalizedValue === 'true') as SiteSettings[K];
  }

  if (typeof fallback === 'number') {
    if (!normalizedValue) {
      return fallback;
    }

    const parsed = Number(normalizedValue);
    return (Number.isFinite(parsed) ? parsed : fallback) as SiteSettings[K];
  }

  return rawValue as SiteSettings[K];
}

function parseSiteSettings(map: Record<string, string>): SiteSettings {
  const settings = { ...DEFAULT_SITE_SETTINGS } as SiteSettings;
  const mutableSettings = settings as Record<string, SiteSettings[keyof SiteSettings]>;

  for (const key of SITE_SETTING_KEYS) {
    mutableSettings[key as string] = parseSettingValue(key, map[key as string]);
  }

  return settings;
}

function serializeSettingValue(value: SiteSettings[keyof SiteSettings]): string {
  return typeof value === 'string' ? value : String(value);
}

export function siteSettingsToRecord(settings: SiteSettings): Record<string, string> {
  const record: Record<string, string> = {};

  for (const key of SITE_SETTING_KEYS) {
    record[key as string] = serializeSettingValue(settings[key]);
  }

  return record;
}

export function toPublicSiteSettings(settings: SiteSettings): PublicSiteSettings {
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return {
    site_name: settings.site_name,
    site_tagline: settings.site_tagline,
    site_url: settings.site_url,
    contact_email: settings.contact_email,
    support_phone: settings.support_phone,
    registration_open: settings.registration_open,
    email_verification_required: settings.email_verification_required,
    google_login_enabled: settings.google_login_enabled,
    google_login_available: settings.google_login_enabled && googleConfigured,
    maintenance_mode: settings.maintenance_mode,
    maintenance_message: settings.maintenance_message,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map: Record<string, string> = {};

    for (const row of rows) {
      map[row.key] = row.value;
    }

    return parseSiteSettings(map);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export const getSettingsDirect = getSiteSettings;
