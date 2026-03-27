import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lightweight public endpoint — middleware polls this to check maintenance mode.
// No auth required — must stay fast and unauthenticated.
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'maintenance_mode' },
    });
    return NextResponse.json({ active: setting?.value === 'true' });
  } catch {
    return NextResponse.json({ active: false }); // fail open
  }
}
