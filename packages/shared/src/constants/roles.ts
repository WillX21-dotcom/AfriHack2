export const USER_ROLES = {
  CLIENT: 'client',
  ADVISER: 'adviser',
  ADMIN: 'admin',
  COMPLIANCE: 'compliance',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
