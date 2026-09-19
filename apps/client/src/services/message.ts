import { dataStore, hydrateRemoteState, supabase } from '@supabase-pkg/client';
import type { Message } from '@shared/types/message';
import { clientService } from './client';

export const messageService = {
  getThread(): Message[] {
    const client = clientService.getCurrentClient();
    return dataStore.getState().messages.filter((m) => m.client_id === client?.id);
  },

  getUnreadCount(): number {
    return this.getThread().filter((m) => m.direction === 'royal_to_client' && !m.is_read).length;
  },

  async send(body: string, context?: { requestId?: string; claimId?: string }): Promise<void> {
    const { error } = await supabase.rpc('send_message', {
      p_body: body,
      p_request_id: context?.requestId ?? null,
      p_claim_id: context?.claimId ?? null,
    });
    if (error) throw new Error(error.message);
    await hydrateRemoteState();
  },

  async markRead(): Promise<void> {
    if (this.getUnreadCount() === 0) return;
    const { error } = await supabase.rpc('mark_thread_read', { p_client_id: null });
    if (error) throw new Error(error.message);
    await hydrateRemoteState();
  },
};
