export { auth as middleware } from '@/lib/auth';

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
