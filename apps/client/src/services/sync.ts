export const syncService = {
  queueOfflineAction(action: string, payload: any) {
    try {
      const queue = JSON.parse(localStorage.getItem('rsf_offline_queue') || '[]');
      queue.push({ id: Date.now(), action, payload, queuedAt: new Date().toISOString() });
      localStorage.setItem('rsf_offline_queue', JSON.stringify(queue));
    } catch (e) {
      console.error(e);
    }
  },

  getPendingCount(): number {
    try {
      const queue = JSON.parse(localStorage.getItem('rsf_offline_queue') || '[]');
      return queue.length;
    } catch {
      return 0;
    }
  },
};
