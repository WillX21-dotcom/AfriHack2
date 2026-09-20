import { documentStatusLabel, formatDate, html, reuploadsRemaining, titleCase, type DocumentRecord, type SafeHtml } from '@shared/index';
import { documentService, DOCUMENT_TYPE_OPTIONS } from '../services/document';
import { icon } from '../components/icons';

const STATUS_TONE: Record<string, string> = {
  pending: 'rsc-badge-slate',
  processing: 'rsc-badge-blue',
  auto_completed: 'rsc-badge-green',
  under_review: 'rsc-badge-amber',
  successful: 'rsc-badge-green',
  rejected: 'rsc-badge-red',
};

function statusDetail(doc: DocumentRecord, isLatestOfType: boolean): SafeHtml | '' {
  if (doc.processing_status === 'rejected') {
    const left = reuploadsRemaining(doc.reupload_count);
    return html`<p class="text-xs text-red-700 mt-1.5">${doc.rejection_reason ?? 'This document could not be accepted.'} ${isLatestOfType && left > 0 ? `You can upload again (${left} attempt${left === 1 ? '' : 's'} left).` : ''}</p>`;
  }
  if (doc.processing_status === 'under_review') {
    return html`<p class="rsc-muted mt-1.5">${doc.escalated_at ? 'Your adviser is reviewing this document personally.' : 'Your adviser will review this shortly.'}</p>`;
  }
  return '';
}

export function renderDocumentsPage(): SafeHtml {
  const documents = documentService.getDocuments();
  const latestByType = new Map<string, DocumentRecord>();
  for (const d of documents) {
    const current = latestByType.get(d.document_type);
    if (!current || d.created_at > current.created_at) latestByType.set(d.document_type, d);
  }

  return html`
    <div class="space-y-5 pb-4">
      <div>
        <h2 class="rsc-title">Document vault</h2>
        <p class="rsc-subtitle mt-0.5">Private storage shared only with you and your Royal Square adviser. Files up to 10 MB (PDF, images, Word, Excel). ID and proof of address are checked automatically; use a PDF or a clear photo.</p>
      </div>

      <form id="doc-upload-form" class="rsc-card p-4 space-y-3">
        <h3 class="rsc-heading">Upload a document</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="rsc-label" for="doc-type-select">Document type</label>
            <select id="doc-type-select" class="rsc-input">
              ${DOCUMENT_TYPE_OPTIONS.map((o) => html`<option value="${o.value}">${o.label}</option>`)}
            </select>
          </div>
          <div>
            <label class="rsc-label" for="doc-upload-input">File</label>
            <input id="doc-upload-input" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt,.csv" class="rsc-input" />
          </div>
        </div>
        <button type="submit" class="rsc-btn rsc-btn-primary rsc-btn-sm">${icon('upload', 'w-4 h-4', 2)}Upload to vault</button>
      </form>

      ${documents.length === 0
        ? html`<div class="rsc-card px-6 py-10 text-center"><h3 class="rsc-heading">Nothing in your vault yet</h3><p class="rsc-muted max-w-xs mx-auto mt-1.5">Upload your ID and proof of address to complete onboarding.</p></div>`
        : html`<div class="space-y-3">
            ${documents.map(
              (doc) => html`<div class="rsc-card p-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h4 class="text-[13px] font-semibold text-slate-900 truncate">${doc.name}</h4>
                  <div class="flex items-center flex-wrap gap-x-2 gap-y-1 rsc-muted mt-1">
                    <span>${titleCase(doc.document_type)}</span><span aria-hidden="true">·</span><span>${formatDate(doc.created_at)}</span>
                    <span class="rsc-badge ${STATUS_TONE[doc.processing_status] || 'rsc-badge-slate'}">${documentStatusLabel(doc, 'client')}</span>
                  </div>
                  ${statusDetail(doc, latestByType.get(doc.document_type)?.id === doc.id)}
                </div>
                <button data-action="open-doc" data-id="${doc.id}" aria-label="Open ${doc.name}" class="rsc-btn rsc-btn-secondary rsc-btn-sm !p-2 shrink-0">${icon('download', 'w-[18px] h-[18px]', 2)}</button>
              </div>`
            )}
          </div>`}
    </div>
  `;
}
