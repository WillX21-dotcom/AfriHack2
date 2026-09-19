export const NOTIFICATION_TYPES = {
  REQUEST: 'request',
  CLAIM: 'claim',
  REMINDER: 'reminder',
  DOCUMENT: 'document',
  MESSAGE: 'message',
  GOAL: 'goal',
  SYSTEM: 'system',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  PUSH: 'push',
  EMAIL: 'email',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];
