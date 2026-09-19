import { dataStore } from '@supabase-pkg/client';
import { markNotificationsRead } from '@supabase-pkg/helpers';
import type { Notification } from '@shared/types/notification';

export const notificationService = {
  getNotifications(): Notification[] {
    const state = dataStore.getState();
    const userId = state.currentUser?.id;
    return state.notifications.filter((n) => n.user_id === userId);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.is_read).length;
  },

  async markAllAsRead(): Promise<void> {
    await markNotificationsRead(this.getNotifications().filter((n) => !n.is_read).map((n) => n.id));
  },

  async markAsRead(id: string): Promise<void> {
    await markNotificationsRead([id]);
  },
};
