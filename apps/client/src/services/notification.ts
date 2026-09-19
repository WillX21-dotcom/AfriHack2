import { localStore } from '@supabase-pkg/client';
import { Notification } from '@shared/types/notification';

export const notificationService = {
  getNotifications(): Notification[] {
    const state = localStore.getState();
    const userId = state.currentUser?.id;
    return state.notifications.filter((n) => n.user_id === userId);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.is_read).length;
  },

  markAllAsRead(): void {
    const state = localStore.getState();
    const userId = state.currentUser?.id;
    state.notifications.forEach((n) => {
      if (n.user_id === userId) {
        n.is_read = true;
        n.read_at = new Date().toISOString();
      }
    });
    localStore.saveState();
  },

  markAsRead(id: string): void {
    const state = localStore.getState();
    const notif = state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      notif.read_at = new Date().toISOString();
      localStore.saveState();
    }
  },
};
