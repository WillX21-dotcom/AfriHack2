export type DocumentType =
  | 'id_document'
  | 'proof_of_address'
  | 'policy_document'
  | 'investment_statement'
  | 'driver_license'
  | 'vehicle_registration'
  | 'insurance_certificate'
  | 'claim_document'
  | 'financial_statement'
  | 'beneficiary_document'
  | 'compliance_document'
  | 'other';

export interface DocumentRecord {
  id: string;
  client_id: string;
  uploaded_by: string | null;
  document_type: DocumentType;
  name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
