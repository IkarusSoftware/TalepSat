import { adminAuth } from './admin-auth';
import { prisma } from './prisma';

export type AdminRole = 'superadmin' | 'staff';

export type AdminSession = {
  adminId: string;
  role: AdminRole;
  status: string;
  name: string;
  email: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await adminAuth();
  const user = session?.user as { adminId?: string } | null;

  if (!user?.adminId) {
    return null;
  }

  const admin = await prisma.adminAccount.findUnique({
    where: { id: user.adminId },
    select: {
      id: true,
      role: true,
      status: true,
      name: true,
      email: true,
    },
  });

  if (!admin || admin.status !== 'active') {
    return null;
  }

  return {
    adminId: admin.id,
    role: admin.role as AdminRole,
    status: admin.status,
    name: admin.name,
    email: admin.email,
  };
}

export function isSuperadmin(session: AdminSession | null) {
  return session?.role === 'superadmin';
}
