import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAdminSession, isSuperadmin } from '@/lib/admin-session';
import { normalizeEmail } from '@/lib/security';

function serializeAdmin(admin: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  twoFactorEnabled: boolean;
}) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    twoFactorEnabled: admin.twoFactorEnabled,
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const admins = await prisma.adminAccount.findMany({
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      twoFactorEnabled: true,
    },
  });

  return NextResponse.json({
    viewerRole: session.role,
    admins: admins.map(serializeAdmin),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  if (!isSuperadmin(session)) {
    return NextResponse.json({ error: 'Sadece superadmin yeni admin hesap acabilir.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = body?.role === 'superadmin' ? 'superadmin' : 'staff';

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Ad, e-posta ve sifre gerekli.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Sifre en az 8 karakter olmali.' }, { status: 400 });
  }

  const existing = await prisma.adminAccount.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: 'Bu e-posta ile bir admin hesabi zaten var.' }, { status: 409 });
  }

  const admin = await prisma.adminAccount.create({
    data: {
      name,
      email,
      hashedPassword: await bcrypt.hash(password, 10),
      role,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      twoFactorEnabled: true,
    },
  });

  return NextResponse.json(serializeAdmin(admin), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  if (!isSuperadmin(session)) {
    return NextResponse.json({ error: 'Sadece superadmin admin hesaplarini yonetebilir.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const adminId = typeof body?.adminId === 'string' ? body.adminId : '';
  const action = typeof body?.action === 'string' ? body.action : '';

  if (!adminId || !action) {
    return NextResponse.json({ error: 'adminId ve action gerekli.' }, { status: 400 });
  }

  const target = await prisma.adminAccount.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!target) {
    return NextResponse.json({ error: 'Admin hesabi bulunamadi.' }, { status: 404 });
  }

  const activeSuperadminCount = await prisma.adminAccount.count({
    where: {
      role: 'superadmin',
      status: 'active',
    },
  });

  if (action === 'setRole') {
    const role = body?.role === 'superadmin' ? 'superadmin' : body?.role === 'staff' ? 'staff' : '';
    if (!role) {
      return NextResponse.json({ error: 'Gecerli bir rol secin.' }, { status: 400 });
    }
    if (target.id === session.adminId) {
      return NextResponse.json({ error: 'Kendi admin rolunuzu bu ekrandan degistiremezsiniz.' }, { status: 400 });
    }
    if (target.role === 'superadmin' && role !== 'superadmin' && activeSuperadminCount <= 1) {
      return NextResponse.json({ error: 'En az bir aktif superadmin kalmali.' }, { status: 400 });
    }

    const updated = await prisma.adminAccount.update({
      where: { id: adminId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json(serializeAdmin(updated));
  }

  if (action === 'activate') {
    const updated = await prisma.adminAccount.update({
      where: { id: adminId },
      data: { status: 'active' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json(serializeAdmin(updated));
  }

  if (action === 'disable') {
    if (target.id === session.adminId) {
      return NextResponse.json({ error: 'Kendi admin hesabinizi devre disi birakamazsiniz.' }, { status: 400 });
    }
    if (target.role === 'superadmin' && target.status === 'active' && activeSuperadminCount <= 1) {
      return NextResponse.json({ error: 'Son aktif superadmin devre disi birakilamaz.' }, { status: 400 });
    }

    const updated = await prisma.adminAccount.update({
      where: { id: adminId },
      data: { status: 'disabled' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json(serializeAdmin(updated));
  }

  return NextResponse.json({ error: 'Gecersiz aksiyon.' }, { status: 400 });
}
