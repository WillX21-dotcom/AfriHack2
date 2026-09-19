import { localStore, supabase, hydrateRemoteState } from '@supabase-pkg/client';
import { clientService } from './client';
import { Request } from '@shared/types/request';
import { RequestWorkflow } from '@shared/types/workflow';

export const requestService = {
  getRequests(): Request[] {
    const client = clientService.getCurrentClient();
    const state = localStore.getState();
    return state.requests.filter((r) => r.client_id === client?.id);
  },

  getRequestById(id: string): { request: Request | null; workflows: RequestWorkflow[] } {
    const state = localStore.getState();
    const request = state.requests.find((r) => r.id === id) || null;
    const workflows = state.request_workflows.filter((w) => w.request_id === id);
    return { request, workflows };
  },

  async createRequest(params: {
    requestType: string;
    title: string;
    description: string;
    priority?: string;
    metadata?: Record<string, any>;
  }) {
    const res = await supabase.rpc('create_client_request', {
      p_request_type: params.requestType,
      p_title: params.title,
      p_description: params.description,
      p_priority: params.priority || 'normal',
      p_metadata: params.metadata || {},
    });
    if (res.error) throw res.error;
    await hydrateRemoteState();
    return res.data;
  },
};
