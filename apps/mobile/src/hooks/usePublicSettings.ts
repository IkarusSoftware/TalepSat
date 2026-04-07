import { useEffect, useState } from 'react';
import api from '../lib/api';

export type PublicSiteSettings = {
  site_name: string;
  site_tagline: string;
  site_url: string;
  contact_email: string;
  support_phone: string;
  registration_open: boolean;
  email_verification_required: boolean;
  google_login_enabled: boolean;
  google_login_available: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
};

const DEFAULT_PUBLIC_SETTINGS: PublicSiteSettings = {
  site_name: 'TalepSat',
  site_tagline: 'İhtiyacını Yaz, Satıcılar Yarışsın',
  site_url: 'http://localhost:3000',
  contact_email: '',
  support_phone: '',
  registration_open: true,
  email_verification_required: false,
  google_login_enabled: false,
  google_login_available: false,
  maintenance_mode: false,
  maintenance_message: '',
};

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await api.get('/api/settings/public');
        if (!cancelled) {
          setSettings({ ...DEFAULT_PUBLIC_SETTINGS, ...res.data });
        }
      } catch {
        if (!cancelled) {
          setSettings(DEFAULT_PUBLIC_SETTINGS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
