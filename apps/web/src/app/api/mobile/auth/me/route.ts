import { NextRequest, NextResponse } from 'next/server';
import { getMobileSession, getMobileUser } from '@/lib/mobile-auth';
import { normalizeResponseMediaUrl } from '@/lib/media';
import { isActiveUserStatus } from '@/lib/user-status';

export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const user = await getMobileUser(session.sub);
  if (!user) {
    return NextResponse.json({ error: 'Kullanici bulunamadi' }, { status: 404 });
  }

  if (!isActiveUserStatus(user.status)) {
    return NextResponse.json({ error: 'Oturumunuz artik aktif degil.' }, { status: 401 });
  }

  return NextResponse.json({
    ...user,
    image: normalizeResponseMediaUrl(user.image, req),
  });
}
