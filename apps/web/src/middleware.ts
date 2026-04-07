import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isSecureRequest =
    request.nextUrl.protocol === 'https:' || forwardedProto === 'https';

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
  const isAdminRoute = isAdminPath && !pathname.startsWith('/admin/login');

  const isProtectedRoute =
    isAdminRoute ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/offers') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/create') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/seller-dashboard');

  if (!isProtectedRoute) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    salt: isSecureRequest ? '__Secure-authjs.session-token' : 'authjs.session-token',
    secureCookie: isSecureRequest,
  });

  if (!token) {
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
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
