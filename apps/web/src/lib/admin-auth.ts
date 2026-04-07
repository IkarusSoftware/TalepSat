import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { createAdminAuthCookies, getAdminAuthSecret } from './auth-cookies';
import type { AdminRole } from './admin-session';
import { consumeRateLimit } from './rate-limit';
import { getClientIp, normalizeEmail, sleep } from './security';

export const { handlers: adminHandlers, signIn: adminSignIn, signOut: adminSignOut, auth: adminAuth } = NextAuth({
  secret: getAdminAuthSecret(),
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  cookies: createAdminAuthCookies(),
  providers: [
    Credentials({
      name: 'admin-credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Sifre', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          await sleep(250);
          return null;
        }

        const email = normalizeEmail(credentials.email as string);
        const ip = getClientIp(request);
        const ipLimit = consumeRateLimit({
          key: `admin-login:ip:${ip}`,
          limit: 10,
          windowMs: 10 * 60 * 1000,
        });
        const emailLimit = consumeRateLimit({
          key: `admin-login:email:${email}`,
          limit: 6,
          windowMs: 10 * 60 * 1000,
        });

        if (!ipLimit.success || !emailLimit.success) {
          await sleep(500);
          return null;
        }

        const admin = await prisma.adminAccount.findUnique({
          where: { email },
        });

        if (!admin || admin.status !== 'active') {
          await sleep(250);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password as string, admin.hashedPassword);
        if (!valid) {
          await sleep(250);
          return null;
        }

        await prisma.adminAccount.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const adminId = (user?.id as string | undefined) ?? (token.adminId as string | undefined);

      if (!adminId) {
        return token;
      }

      const admin = await prisma.adminAccount.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      token.kind = 'admin';
      token.adminId = adminId;
      token.adminRole = (admin?.role ?? 'staff') as AdminRole;
      token.adminStatus = admin?.status ?? 'disabled';

      if (admin?.name) token.name = admin.name;
      if (admin?.email) token.email = admin.email;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.kind = 'admin';
        session.user.adminId = token.adminId as string | undefined;
        session.user.adminRole = token.adminRole as AdminRole | undefined;
        session.user.adminStatus = token.adminStatus as string | undefined;
      }
      return session;
    },
  },
});
