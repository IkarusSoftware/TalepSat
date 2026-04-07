import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { sendSmtpTestEmail, getEmailConfigurationStatus } from '@/lib/email';
import { getSettingsDirect } from '@/lib/site-settings';
import { normalizeEmail } from '@/lib/security';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const explicitTo = typeof body?.to === 'string' ? normalizeEmail(body.to) : '';
  const settings = await getSettingsDirect();
  const fallbackEmail = settings.admin_notification_email?.trim() || session.email || '';
  const to = explicitTo || fallbackEmail;

  if (!to) {
    return NextResponse.json({ error: 'Test e-postasi icin hedef adres gerekli' }, { status: 400 });
  }

  const config = getEmailConfigurationStatus(settings);
  if (!config.ready) {
    return NextResponse.json({
      error: 'SMTP ayarlari eksik',
      details: config.details,
    }, { status: 400 });
  }

  const result = await sendSmtpTestEmail(to);
  if (!result.ok) {
    return NextResponse.json({
      error: result.reason === 'send_failed' ? 'Test e-postasi gonderilemedi' : 'SMTP ayarlari hazir degil',
      details: result.details,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    sentTo: to,
  });
}
