import { NextRequest, NextResponse } from 'next/server';
import { getMobileSession, getMobileUser } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const user = await getMobileUser(session.sub);
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  return NextResponse.json(user);
}
