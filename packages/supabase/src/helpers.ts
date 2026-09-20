import { dataStore, hydrateRemoteState, supabase, unwrap, type ClientRecord } from './client';
import type { DocumentRecord, DocumentType } from '../../shared/src/types/document';
import { isOcrEligible } from '../../shared/src/rules/documentRules';

export const DOCUMENT_BUCKET = 'client-documents';

export interface DocumentProcessingResponse {
  status: DocumentRecord['processing_status'];
  confidence?: number | null;
  reason?: string;
  escalated?: boolean;
  error?: string;
}

/** The signed-in user's own client file (clients only). Never falls back to someone else's record. */
export function getCurrentClient(): ClientRecord | null {
  const state = dataStore.getState();
  const userId = state.currentUser?.id;
  if (!userId) return null;
  return state.clients.find((c) => c.profile_id === userId) ?? null;
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'adviser' || role === 'compliance';
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned || 'file';
}

/**
 * Upload a file into the client's private vault folder and register it in `documents`.
 * The storage path is `<client_id>/<timestamp>_<file name>`, which is what the storage policies key on.
 */
export async function uploadClientDocument(options: {
  clientId: string;
  file: File | Blob;
  fileName?: string;
  documentType: DocumentType;
  requestId?: string | null;
  claimId?: string | null;
  metadata?: Record<string, unknown>;
  startProcessing?: boolean;
}): Promise<DocumentRecord> {
  const uploader = dataStore.getState().currentUser;
  if (!uploader) throw new Error('You must be signed in to upload documents.');

  const name = options.fileName || (options.file instanceof File ? options.file.name : 'upload');
  const path = `${options.clientId}/${Date.now()}_${safeFileName(name)}`;
  const contentType = options.file.type || 'application/octet-stream';

  const upload = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, options.file, { contentType, upsert: false });
  if (upload.error) throw new Error(`Upload failed: ${upload.error.message}`);

  const insert = await supabase
    .from('documents')
    .insert({
      client_id: options.clientId,
      uploaded_by: uploader.id,
      document_type: options.documentType,
      name,
      storage_path: path,
      mime_type: contentType,
      file_size: options.file.size,
      request_id: options.requestId ?? null,
      claim_id: options.claimId ?? null,
      metadata: options.metadata ?? {},
    })
    .select('*')
    .single();

  if (insert.error) {
    // Do not leave an orphaned file behind if the record could not be created.
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    throw new Error(insert.error.message);
  }

  await hydrateRemoteState();
  const record = insert.data as DocumentRecord;
  if (isOcrEligible(record.document_type) && options.startProcessing !== false) void startDocumentProcessing(record.id);
  return record;
}

/**
 * Kick off OCR + rules for an uploaded document without holding up the upload. The function writes
 * status changes as it goes and realtime refreshes both apps; if it is unreachable the document simply
 * stays "Pending" and an adviser can still verify it by hand.
 */
export async function startDocumentProcessing(documentId: string): Promise<DocumentProcessingResponse | null> {
  const { data, error } = await supabase.functions.invoke<DocumentProcessingResponse>('process-document', { body: { documentId } });
  if (error) {
    let detail = error.message;
    const response = (error as { context?: Response }).context;
    if (response) {
      try {
        const body = await response.clone().text();
        if (body) detail += ` (${body})`;
      } catch {
        // The response body is optional diagnostic context.
      }
    }
    console.warn('Document processing could not start:', detail);
    await hydrateRemoteState();
    return null;
  }
  await hydrateRemoteState();
  return data;
}

const TERMINAL_PROCESSING_STATUSES = new Set<DocumentRecord['processing_status']>(['auto_completed', 'successful', 'under_review', 'rejected']);

export async function waitForDocumentProcessing(documentId: string, timeoutMs = 45_000, intervalMs = 1_500): Promise<DocumentRecord | null> {
  const deadline = Date.now() + timeoutMs;
  do {
    const { data, error } = await supabase.from('documents').select('*').eq('id', documentId).maybeSingle();
    if (error) throw new Error(error.message);
    const document = data as DocumentRecord | null;
    if (!document || TERMINAL_PROCESSING_STATUSES.has(document.processing_status)) {
      await hydrateRemoteState();
      return document;
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  } while (Date.now() < deadline);

  await hydrateRemoteState();
  return (dataStore.getState().documents.find((document) => document.id === documentId) as DocumentRecord | undefined) ?? null;
}

/** Open a short-lived signed link to a document in a new tab. */
export async function openDocument(doc: Pick<DocumentRecord, 'storage_path' | 'name'>): Promise<void> {
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.storage_path, 60);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Unable to open this document.');
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  unwrap(await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', ids));
  await hydrateRemoteState();
}
