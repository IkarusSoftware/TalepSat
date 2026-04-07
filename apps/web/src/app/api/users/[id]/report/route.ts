import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_REPORT_DETAIL_LENGTH = 1500;
const VALID_REASONS = new Set(['spam', 'harassment', 'fraud', 'inappropriate', 'other']);

// POST /api/users/[id]/report - report user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const rateLimit = consumeRateLimit({
    key: `user-report:${userId}:${getClientIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik sikayet gonderiyorsunuz.');
  }

  const { id: reportedId } = await params;
  const body = await req.json().catch(() => null);

  if (reportedId === userId) {
    return NextResponse.json({ error: 'Kendinizi sikayet edemezsiniz' }, { status: 400 });
  }

  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: 'Gecersiz sikayet nedeni' }, { status: 400 });
  }

  const detail = typeof body?.detail === 'string' ? body.detail.trim().slice(0, MAX_REPORT_DETAIL_LENGTH) : null;
  const existing = await prisma.userReport.findFirst({
    where: {
      reporterId: userId,
      reportedId,
      reason,
      status: 'pending',
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.userReport.create({
    data: {
      reporterId: userId,
      reportedId,
      reason,
      detail,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
