export const MARKETPLACE_AUTH_BASE_PATH = '/api/auth';
export const ADMIN_AUTH_BASE_PATH = '/api/admin/auth';

const MARKETPLACE_COOKIE_NAMESPACE = 'authjs';
const ADMIN_COOKIE_NAMESPACE = 'admin-authjs';

function withSecurePrefix(name: string, secure: boolean) {
  return secure ? `__Secure-${name}` : name;
}

export function isSecureAuthEnvironment() {
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || '';
  return authUrl.startsWith('https://');
}

function createCookieDefinition(baseName: string, options: { httpOnly?: boolean } = {}) {
  const secure = isSecureAuthEnvironment();

  return {
    name: withSecurePrefix(baseName, secure),
    options: {
      httpOnly: options.httpOnly ?? true,
      sameSite: 'lax' as const,
      path: '/',
      secure,
    },
  };
}

export function createAdminAuthCookies() {
  return {
    sessionToken: createCookieDefinition(`${ADMIN_COOKIE_NAMESPACE}.session-token`),
    callbackUrl: createCookieDefinition(`${ADMIN_COOKIE_NAMESPACE}.callback-url`, { httpOnly: false }),
    csrfToken: createCookieDefinition(`${ADMIN_COOKIE_NAMESPACE}.csrf-token`),
  };
}

export function getAdminAuthSecret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.AUTH_SECRET;
}

export const marketplaceSessionCookieNames = [
  withSecurePrefix(`${MARKETPLACE_COOKIE_NAMESPACE}.session-token`, true),
  withSecurePrefix(`${MARKETPLACE_COOKIE_NAMESPACE}.session-token`, false),
];

export const adminSessionCookieNames = [
  withSecurePrefix(`${ADMIN_COOKIE_NAMESPACE}.session-token`, true),
  withSecurePrefix(`${ADMIN_COOKIE_NAMESPACE}.session-token`, false),
];
