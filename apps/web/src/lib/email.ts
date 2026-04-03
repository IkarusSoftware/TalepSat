import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { getSettingsDirect, type SiteSettings } from './site-settings';

export type UserEmailPreferenceKey =
  | 'emailNewOfferEnabled'
  | 'emailStatusChangeEnabled'
  | 'emailExpiryEnabled';

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  respectGlobalToggle?: boolean;
  settings?: SiteSettings;
};

type SendResult =
  | { ok: true }
  | { ok: false; reason: 'smtp_not_configured' | 'email_notifications_disabled' | 'send_failed'; details?: string[] };

type AppEmailOptions = {
  subject: string;
  heading: string;
  intro: string;
  body: string;
  ctaUrl?: string | null;
  ctaLabel?: string;
  footer?: string;
};

type NotificationEmailOptions = {
  userId: string;
  preferenceKey: UserEmailPreferenceKey;
  subject: string;
  heading?: string;
  intro?: string;
  body: string;
  ctaUrl?: string | null;
  ctaLabel?: string;
};

type PasswordResetEmailOptions = {
  to: string;
  name?: string | null;
  resetUrl: string;
};

function normalizeBaseUrl(settings: SiteSettings) {
  return settings.site_url?.trim() || process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000';
}

function absolutizeUrl(url: string | null | undefined, settings: SiteSettings) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  try {
    return new URL(url, normalizeBaseUrl(settings)).toString();
  } catch {
    return null;
  }
}

export function getEmailConfigurationStatus(settings: SiteSettings) {
  const details: string[] = [];

  if (!settings.smtp_host.trim()) details.push('SMTP host girilmedi.');
  if (!Number.isFinite(settings.smtp_port) || settings.smtp_port <= 0) details.push('SMTP port gecersiz.');
  if (!settings.smtp_from_email.trim()) details.push('Gonderici e-posta adresi eksik.');
  if (settings.smtp_user.trim() && !settings.smtp_pass.trim()) details.push('SMTP sifresi eksik.');
  if (settings.smtp_pass.trim() && !settings.smtp_user.trim()) details.push('SMTP kullanici adi eksik.');

  return {
    ready: details.length === 0,
    details,
  };
}

function buildAppEmail(options: AppEmailOptions, settings: SiteSettings) {
  const siteName = settings.site_name || 'TalepSat';
  const ctaUrl = absolutizeUrl(options.ctaUrl, settings);
  const ctaLabel = options.ctaLabel || "TalepSat'i Ac";
  const footer = options.footer || `Bu e-posta ${siteName} tarafindan gonderildi.`;

  const html = `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 32px;border-bottom:1px solid #f1f5f9;background:linear-gradient(135deg,#fff7ed 0%,#ffffff 100%);">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ea580c;">${siteName}</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;color:#0f172a;">${options.heading}</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">${options.intro}</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#475569;">${options.body}</p>
          ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;">${ctaLabel}</a>` : ''}
          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">${footer}</p>
        </div>
      </div>
    </div>
  `;

  const textParts = [options.heading, '', options.intro, '', options.body];
  if (ctaUrl) {
    textParts.push('', `${ctaLabel}: ${ctaUrl}`);
  }
  textParts.push('', footer);

  return {
    subject: options.subject,
    html,
    text: textParts.join('\n'),
  };
}

async function getSettingsForEmail(settings?: SiteSettings) {
  return settings ?? getSettingsDirect();
}

export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  const settings = await getSettingsForEmail(options.settings);
  const config = getEmailConfigurationStatus(settings);

  if (!config.ready) {
    return { ok: false, reason: 'smtp_not_configured', details: config.details };
  }

  if (options.respectGlobalToggle && !settings.email_notifications_enabled) {
    return { ok: false, reason: 'email_notifications_disabled' };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host.trim(),
    port: settings.smtp_port,
    secure: settings.smtp_secure,
    auth: settings.smtp_user.trim()
      ? {
          user: settings.smtp_user.trim(),
          pass: settings.smtp_pass,
        }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from: settings.smtp_from_name.trim()
        ? `"${settings.smtp_from_name.trim()}" <${settings.smtp_from_email.trim()}>`
        : settings.smtp_from_email.trim(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || settings.smtp_reply_to.trim() || undefined,
    });

    return { ok: true };
  } catch (error) {
    console.error('[email] send failed', error);
    return { ok: false, reason: 'send_failed' };
  }
}

export async function sendNotificationEmailToUser(options: NotificationEmailOptions) {
  const settings = await getSettingsDirect();
  const user = await prisma.user.findUnique({
    where: { id: options.userId },
    select: {
      name: true,
      email: true,
      status: true,
      emailNewOfferEnabled: true,
      emailStatusChangeEnabled: true,
      emailExpiryEnabled: true,
    },
  });

  if (!user || user.status !== 'active' || !user.email || !user[options.preferenceKey]) {
    return { ok: false as const, skipped: true };
  }

  const payload = buildAppEmail(
    {
      subject: options.subject,
      heading: options.heading || options.subject,
      intro: options.intro || `Merhaba ${user.name.split(' ')[0] || user.name},`,
      body: options.body,
      ctaUrl: options.ctaUrl,
      ctaLabel: options.ctaLabel,
    },
    settings,
  );

  return sendEmail({
    to: user.email,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    respectGlobalToggle: true,
    settings,
  });
}

export async function sendPasswordResetEmail(options: PasswordResetEmailOptions) {
  const settings = await getSettingsDirect();
  const payload = buildAppEmail(
    {
      subject: 'Sifre sifirlama baglantiniz',
      heading: 'Sifre sifirlama talebiniz hazir',
      intro: options.name ? `Merhaba ${options.name.split(' ')[0]},` : 'Merhaba,',
      body: 'Sifrenizi yenilemek icin asagidaki baglantiyi kullanabilirsiniz. Bu baglanti 1 saat boyunca gecerli kalir.',
      ctaUrl: options.resetUrl,
      ctaLabel: 'Sifreyi yenile',
      footer: 'Bu istegi siz yapmadiysaniz e-postayi gormezden gelebilirsiniz.',
    },
    settings,
  );

  return sendEmail({
    to: options.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    respectGlobalToggle: false,
    settings,
  });
}

export async function sendSmtpTestEmail(to: string) {
  const settings = await getSettingsDirect();
  const payload = buildAppEmail(
    {
      subject: 'TalepSat SMTP testi basarili',
      heading: 'SMTP baglantisi calisiyor',
      intro: 'Admin panelinden gonderilen test e-postasina bakiyorsunuz.',
      body: 'Bu mesaj geldiyse SMTP ayarlariniz kaydedilmis ve sistem gercek e-posta teslimati yapabiliyor demektir.',
      ctaUrl: normalizeBaseUrl(settings),
      ctaLabel: 'Siteyi ac',
    },
    settings,
  );

  return sendEmail({
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    respectGlobalToggle: false,
    settings,
  });
}
