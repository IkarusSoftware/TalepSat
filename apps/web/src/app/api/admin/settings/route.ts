import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { getSettingsDirect, siteSettingsToRecord } from '@/lib/site-settings';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const settings = await getSettingsDirect();
  return NextResponse.json(siteSettingsToRecord(settings));
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const body: Record<string, string> = await req.json();

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    ),
  );

  const updatedSettings = await getSettingsDirect();

  return NextResponse.json({
    success: true,
    settings: siteSettingsToRecord(updatedSettings),
  });
}
