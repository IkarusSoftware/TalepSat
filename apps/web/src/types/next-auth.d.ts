import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string;
      role?: string;
      verified?: boolean;
      badge?: string | null;
      companyName?: string | null;
      phone?: string | null;
      city?: string | null;
      status?: string;
      kind?: 'user' | 'admin';
      adminId?: string;
      adminRole?: 'superadmin' | 'staff';
      adminStatus?: string;
    };
  }

  interface User {
    id?: string;
    role?: string;
    verified?: boolean;
    badge?: string | null;
    companyName?: string | null;
    phone?: string | null;
    city?: string | null;
    status?: string;
    kind?: 'user' | 'admin';
    adminId?: string;
    adminRole?: 'superadmin' | 'staff';
    adminStatus?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    verified?: boolean;
    badge?: string | null;
    companyName?: string | null;
    phone?: string | null;
    city?: string | null;
    status?: string;
    kind?: 'user' | 'admin';
    adminId?: string;
    adminRole?: 'superadmin' | 'staff';
    adminStatus?: string;
  }
}
