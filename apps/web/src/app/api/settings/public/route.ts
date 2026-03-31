import { NextResponse } from 'next/server';
import { getSettingsDirect, toPublicSiteSettings } from '@/lib/site-settings';

export async function GET() {
  const settings = await getSettingsDirect();
  return NextResponse.json(toPublicSiteSettings(settings));
}
