import { dataStore, hydrateRemoteState, supabase, unwrap, type ClientRecord } from './client';
import type { DocumentRecord, DocumentType } from '../../shared/src/types/document';

export const DOCUMENT_BUCKET = 'client-documents';

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
  return insert.data as DocumentRecord;
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
