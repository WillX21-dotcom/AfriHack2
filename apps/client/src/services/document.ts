import { dataStore } from '@supabase-pkg/client';
import { openDocument, uploadClientDocument } from '@supabase-pkg/helpers';
import type { DocumentRecord, DocumentType } from '@shared/types/document';
import { clientService } from './client';

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'id_document', label: 'Identity document (ID / passport)' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'driver_license', label: "Driver's licence" },
  { value: 'vehicle_registration', label: 'Vehicle registration' },
  { value: 'policy_document', label: 'Policy document' },
  { value: 'investment_statement', label: 'Investment statement' },
  { value: 'financial_statement', label: 'Financial statement' },
  { value: 'beneficiary_document', label: 'Beneficiary document' },
  { value: 'other', label: 'Other' },
];

export const documentService = {
  getDocuments(): DocumentRecord[] {
    const client = clientService.getCurrentClient();
    return dataStore.getState().documents.filter((d) => d.client_id === client?.id);
  },

  async uploadDocument(file: File, documentType: DocumentType): Promise<DocumentRecord> {
    const client = clientService.getCurrentClient();
    if (!client) throw new Error('No client file is linked to this account.');
    return uploadClientDocument({ clientId: client.id, file, documentType });
  },

  open(doc: DocumentRecord): Promise<void> {
    return openDocument(doc);
  },
};
