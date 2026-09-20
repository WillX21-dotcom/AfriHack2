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

export type DocumentProcessingStatus =
  | 'pending'
  | 'processing'
  | 'auto_completed'
  | 'under_review'
  | 'successful'
  | 'rejected';

export interface DocumentEvent {
  id: string;
  document_id: string;
  client_id: string;
  event_type: string;
  payload: Record<string, any>;
  actor: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  client_id: string;
  uploaded_by: string | null;
  document_type: DocumentType;
  name: string;
  storage_path: string;
  request_id: string | null;
  claim_id: string | null;
  mime_type: string | null;
  file_size: number | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  processing_status: DocumentProcessingStatus;
  confidence_score: number | null;
  extracted_fields: Record<string, any>;
  human_review_required: boolean;
  rejection_reason: string | null;
  reupload_count: number;
  escalated_at: string | null;
  last_processed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
