import { localStore, supabase } from '@supabase-pkg/client';
import { clientService } from './client';
import { DocumentRecord } from '@shared/types/document';

export const documentService = {
  getDocuments(): DocumentRecord[] {
    const client = clientService.getCurrentClient();
    const state = localStore.getState();
    return state.documents.filter((d) => d.client_id === client?.id);
  },

  async uploadDocument(file: File, documentType: string) {
    const client = clientService.getCurrentClient();
    const path = `${client?.id || 'client'}/${Date.now()}_${file.name}`;
    const res = await supabase.storage.from('client-documents').upload(path, file);
    return res.data;
  },
};
