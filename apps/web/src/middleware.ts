import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  adminSessionCookieNames,
  getAdminAuthSecret,
  marketplaceSessionCookieNames,
} from '@/lib/auth-cookies';

// ── Maintenance mode cache ────────────────────────────────────────────────────
let maintenanceCache: { active: boolean; ts: number } | null = null;
const MAINTENANCE_TTL = 8000;

async function isMaintenanceActive(requestUrl: string): Promise<boolean> {
  if (maintenanceCache && Date.now() - maintenanceCache.ts < MAINTENANCE_TTL) {
    return maintenanceCache.active;
  }
  try {
    const res = await fetch(
      new URL('/api/settings/maintenance', requestUrl).toString(),
      { cache: 'no-store' }
    );
    const { active } = await res.json();
    maintenanceCache = { active, ts: Date.now() };
    return active;
  } catch {
    return false;
  }
}

async function readTokenFromCookies(
  request: NextRequest,
  secret: string | undefined,
  cookieNames: string[],
) {
  for (const cookieName of cookieNames) {
    const token = await getToken({
      req: request,
      secret,
      cookieName,
      salt: cookieName,
      secureCookie: cookieName.startsWith('__Secure-'),
    }).catch(() => null);

    if (token) {
      return token;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Her zaman geç: API rotaları, static dosyalar, auth, bakım sayfası
  const isApiRoute       = pathname.startsWith('/api/');
  const isNextInternal   = pathname.startsWith('/_next') || pathname.includes('.');
  const isMaintenancePg  = pathname === '/maintenance';
  const isAdminPath      = pathname.startsWith('/admin');

  // ── Bakım modu: sadece gerçek sayfa isteklerinde kontrol et ───────────────
  if (!isApiRoute && !isNextInternal && !isMaintenancePg && !isAdminPath) {
    const maintenance = await isMaintenanceActive(request.url);
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // ── Auth kontrolü ─────────────────────────────────────────────────────────
  const isAdminLoginRoute = pathname === '/admin/login';
  const isAdminRoute = isAdminPath && !isAdminLoginRoute;
  const isMarketplaceProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/offers') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/create') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/seller-dashboard');

  if (!isAdminPath && !isMarketplaceProtectedRoute) return NextResponse.next();

  if (isAdminPath) {
    const adminToken = await readTokenFromCookies(request, getAdminAuthSecret(), adminSessionCookieNames);
    const adminStatus = typeof adminToken?.adminStatus === 'string' ? adminToken.adminStatus : 'disabled';

    if (isAdminLoginRoute) {
      if (adminToken && adminStatus === 'active') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    if (!adminToken || adminStatus !== 'active') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  const userToken = await readTokenFromCookies(request, process.env.AUTH_SECRET, marketplaceSessionCookieNames);
  if (!userToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Sadece sayfa rotaları — API, static, _next kesinlikle hariç
    '/((?!api|_next/static|_next/image|favicon\\.ico).*)',
  ],
};
