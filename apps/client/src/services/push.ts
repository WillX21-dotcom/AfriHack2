export const pushService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  },

  isSubscribed(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  },
};
