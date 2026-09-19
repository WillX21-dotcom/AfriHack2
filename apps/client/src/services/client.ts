import { localStore } from '@supabase-pkg/client';
import { Client } from '@shared/types/client';

export const clientService = {
  getCurrentClient(): Client | null {
    const state = localStore.getState();
    const currentUserId = state.currentUser?.id;
    return state.clients.find((c) => c.profile_id === currentUserId) || state.clients[0] || null;
  },

  updateProfile(updates: Partial<Client>): void {
    const state = localStore.getState();
    const client = this.getCurrentClient();
    if (client) {
      Object.assign(client, updates, { updated_at: new Date().toISOString() });
      localStore.saveState();
    }
  },

  getDependants(clientId: string) {
    const state = localStore.getState();
    return state.dependants.filter((d) => d.client_id === clientId);
  },

  getBeneficiaries(clientId: string) {
    const state = localStore.getState();
    return state.beneficiaries.filter((b) => b.client_id === clientId);
  },
};
