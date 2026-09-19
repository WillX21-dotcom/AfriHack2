import { NotificationChannel, NotificationType } from '../constants/notification-types';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string | null;
  request_id: string | null;
  claim_id: string | null;
  reminder_id: string | null;
  document_id: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string | null;
  auth_key: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}
