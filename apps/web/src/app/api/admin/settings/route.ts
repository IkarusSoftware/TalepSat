import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';

function isAdmin(session: Session | null) {
  return !!((session?.user as { role?: string })?.role === 'admin' && session?.user?.id);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const body: Record<string, string> = await req.json();

  // Upsert each key
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
