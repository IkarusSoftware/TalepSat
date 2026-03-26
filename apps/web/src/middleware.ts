import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const isProduction = process.env.NODE_ENV === 'production';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    // NextAuth v5 uses "authjs.session-token" as salt
    salt: isProduction
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
    secureCookie: isProduction,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/offers/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/subscription/:path*',
    '/create/:path*',
    '/notifications/:path*',
    '/seller-dashboard/:path*',
  ],
};
