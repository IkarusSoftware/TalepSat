export const ACTIVE_USER_STATUS = 'active' as const;

export type UserStatus = 'active' | 'suspended' | 'banned' | 'deactivated';

export function isActiveUserStatus(status: string | null | undefined): status is typeof ACTIVE_USER_STATUS {
  return status === ACTIVE_USER_STATUS;
}

export function isInactiveUserStatus(status: string | null | undefined) {
  return status === 'suspended' || status === 'banned' || status === 'deactivated';
}

export function getBlockedUserMessage(status: string | null | undefined) {
  switch (status) {
    case 'banned':
      return 'Hesabınız yasaklanmıştır.';
    case 'suspended':
      return 'Hesabınız askıya alınmıştır.';
    case 'deactivated':
      return 'Hesabınız devre dışı bırakılmıştır.';
    default:
      return 'Hesabınıza erişilemiyor.';
  }
}
