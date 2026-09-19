import { dataStore, hydrateRemoteState, supabase } from '@supabase-pkg/client';
import { uploadClientDocument } from '@supabase-pkg/helpers';
import type { Request } from '@shared/types/request';
import type { RequestWorkflow } from '@shared/types/workflow';
import type { DocumentRecord, DocumentType } from '@shared/types/document';
import { clientService } from './client';

const ATTACHMENT_TYPE: Record<string, DocumentType> = {
  driver_license: 'driver_license',
  policy_document: 'policy_document',
  insurance_certificate: 'insurance_certificate',
  change_beneficiary: 'beneficiary_document',
  balance_sheet: 'financial_statement',
  income_statement: 'financial_statement',
};

export const requestService = {
  getRequests(): Request[] {
    const client = clientService.getCurrentClient();
    return dataStore.getState().requests.filter((r) => r.client_id === client?.id);
  },

  getRequestById(id: string): { request: Request | null; workflows: RequestWorkflow[]; documents: DocumentRecord[] } {
    const state = dataStore.getState();
    const client = clientService.getCurrentClient();
    const request = state.requests.find((r) => r.id === id && r.client_id === client?.id) || null;
    return {
      request,
      workflows: state.request_workflows.filter((w) => w.request_id === id),
      documents: state.documents.filter((d) => d.request_id === id),
    };
  },

  async createRequest(params: {
    requestType: string;
    title: string;
    description: string;
    priority?: string;
    attachment?: File | null;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_client_request', {
      p_request_type: params.requestType,
      p_title: params.title,
      p_description: params.description,
      p_priority: params.priority || 'normal',
      p_metadata: {},
    });
    if (error) throw new Error(error.message);

    const requestId = String(data);
    const client = clientService.getCurrentClient();
    if (params.attachment && client) {
      try {
        await uploadClientDocument({
          clientId: client.id,
          file: params.attachment,
          documentType: ATTACHMENT_TYPE[params.requestType] || 'other',
          requestId,
        });
      } catch (uploadError) {
        // The request itself exists; report the attachment problem without losing the id.
        await hydrateRemoteState();
        throw Object.assign(
          new Error(`Request submitted, but the attachment could not be uploaded: ${(uploadError as Error).message}`),
          { requestId }
        );
      }
    }

    await hydrateRemoteState();
    return requestId;
  },
};
