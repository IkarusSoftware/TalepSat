import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { getSettingsDirect } from './site-settings';
import { isActiveUserStatus, isInactiveUserStatus } from './user-status';

// Only use PrismaAdapter when Google OAuth is configured
// Adapter + Credentials + JWT can conflict — adapter tries to create sessions
const googleProviderConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const useAdapter = googleProviderConfigured;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...(useAdapter ? { adapter: PrismaAdapter(prisma) } : {}),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [settings, user] = await Promise.all([
          getSettingsDirect(),
          prisma.user.findUnique({
            where: { email: credentials.email as string },
          }),
        ]);

        if (!user || !user.hashedPassword) {
          return null;
        }

        if (isInactiveUserStatus(user.status)) {
          return null;
        }

        if (settings.email_verification_required && user.role !== 'admin' && !user.verified) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(googleProviderConfigured
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const settings = await getSettingsDirect();

      if (account?.provider === 'google') {
        if (!googleProviderConfigured || !settings.google_login_enabled) {
          return false;
        }

        if (!user.email) {
          return false;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, status: true },
        });

        if (!existingUser && !settings.registration_open) {
          return false;
        }

        if (existingUser?.status && !isActiveUserStatus(existingUser.status)) {
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // Login — encode user data into JWT once
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: {
            role: true,
            verified: true,
            badge: true,
            companyName: true,
            phone: true,
            city: true,
            status: true,
          },
        });
        token.id = user.id;
        token.role = dbUser?.role ?? 'buyer';
        token.verified = dbUser?.verified ?? false;
        token.badge = dbUser?.badge ?? null;
        token.companyName = dbUser?.companyName ?? null;
        token.phone = dbUser?.phone ?? null;
        token.city = dbUser?.city ?? null;
        token.status = dbUser?.status ?? 'active';
      }
      if (trigger === 'update') {
        // Profile update — refresh from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, verified: true, badge: true, companyName: true, phone: true, city: true, status: true },
        });
        if (dbUser) Object.assign(token, dbUser);
      }
      return token;
    },
    async session({ session, token }) {
      const user = session.user as unknown as Record<string, unknown>;
      user.id = token.id;
      user.role = token.role;
      user.verified = token.verified;
      user.badge = token.badge;
      user.companyName = token.companyName;
      user.phone = token.phone;
      user.city = token.city;
      user.status = token.status;
      return session;
    },
  },
});
