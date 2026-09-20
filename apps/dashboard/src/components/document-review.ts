import { html, type SafeHtml } from '@shared/html';
import { formatDateTime, titleCase } from '@shared/format';
import { REQUIRED_FIELDS, documentStatusBadgeClass, documentStatusLabel, isOcrEligible, reuploadsRemaining } from '@shared/index';
import type { DocumentEvent, DocumentRecord } from '@shared/types/document';
import { INPUT_CLASS } from './ui';

export interface DocumentReviewState {
  docId: string;
  /** null while the trace is loading */
  events: DocumentEvent[] | null;
}

const EVENT_LABELS: Record<string, string> = {
  ocr_started: 'OCR started',
  fields_extracted: 'Fields extracted',
  rule_outcome: 'Rule outcome',
  review_required: 'Human review required',
  unsupported_file_type: 'Unsupported file type',
  processing_failed: 'Processing failed',
  approved: 'Approved by adviser',
  rejected: 'Rejected by adviser',
};

function eventDetail(event: DocumentEvent): string {
  const p = event.payload ?? {};
  switch (event.event_type) {
    case 'fields_extracted':
      return typeof p.confidence === 'number' ? `confidence ${Math.round(p.confidence * 100)}%` : 'no confidence reported';
    case 'rule_outcome':
      return `${titleCase(String(p.status ?? ''))}${p.reason ? `: ${p.reason}` : ''}`;
    case 'review_required':
      return String(p.reason ?? '');
    case 'processing_failed':
      return String(p.error ?? '');
    case 'approved':
      return Array.isArray(p.edited_fields) && p.edited_fields.length ? `edited ${p.edited_fields.join(', ')}` : 'no edits';
    case 'rejected':
      return String(p.reason ?? '');
    default:
      return '';
  }
}

function fieldKeys(doc: DocumentRecord): string[] {
  const required = isOcrEligible(doc.document_type) ? [...REQUIRED_FIELDS[doc.document_type]] : [];
  const extra = Object.keys(doc.extracted_fields ?? {}).filter((k) => !required.includes(k));
  return [...required, ...extra];
}

function trace(events: DocumentEvent[] | null): SafeHtml {
  if (events === null) return html`<p class="text-[11px] text-slate-400">Loading trace…</p>`;
  if (events.length === 0) return html`<p class="text-[11px] text-slate-400">No engine activity recorded for this document.</p>`;
  return html`<ol class="space-y-1.5">
    ${events.map(
      (e) => html`<li class="text-[11px] flex gap-2">
        <span class="text-slate-400 shrink-0 w-28">${formatDateTime(e.created_at)}</span>
        <span><span class="font-semibold text-slate-700">${EVENT_LABELS[e.event_type] ?? titleCase(e.event_type)}</span>${eventDetail(e) ? html` <span class="text-slate-500">· ${eventDetail(e)}</span>` : ''}</span>
      </li>`
    )}
  </ol>`;
}

/** Adviser review lane: OCR result, editable fields, approve / reject, and the engine trace. */
export function renderDocumentReviewModal(doc: DocumentRecord, state: DocumentReviewState): SafeHtml {
  const keys = fieldKeys(doc);
  const canDecide = doc.processing_status !== 'processing';
  const reviewReason = doc.rejection_reason ?? (doc.metadata?.review_reason as string | undefined) ?? null;

  return html`
    <div id="dash-modal" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div data-action="close-doc-review" class="absolute inset-0 bg-slate-900/60"></div>
      <div class="relative bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-slate-900 truncate">${doc.name}</h3>
            <p class="text-[11px] text-slate-500">${titleCase(doc.document_type)} · uploaded ${formatDateTime(doc.created_at)}</p>
          </div>
          <button type="button" data-action="close-doc-review" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg" aria-label="Close">✕</button>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="${documentStatusBadgeClass(doc)}">${documentStatusLabel(doc)}</span>
          ${doc.confidence_score !== null ? html`<span class="text-[11px] text-slate-600">Confidence <strong>${Math.round(doc.confidence_score * 100)}%</strong></span>` : ''}
          ${doc.escalated_at ? html`<span class="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Escalated after ${doc.reupload_count} re-uploads</span>` : ''}
          ${doc.processing_status === 'rejected' ? html`<span class="text-[11px] text-slate-500">${reuploadsRemaining(doc.reupload_count)} re-uploads left for the client</span>` : ''}
          <button type="button" data-action="open-doc" data-id="${doc.id}" class="ml-auto px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-100">Open file</button>
        </div>

        ${reviewReason ? html`<div class="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl">${reviewReason}</div>` : ''}

        ${keys.length > 0
          ? html`<div>
              <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Extracted fields</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${keys.map(
                  (k) => html`<label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">${titleCase(k)}</span>
                    <input id="review-field-${k}" data-review-field="${k}" type="text" value="${String(doc.extracted_fields?.[k] ?? '')}" class="${INPUT_CLASS}" /></label>`
                )}
              </div>
            </div>`
          : ''}

        <div>
          <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Reason to show the client if you reject</span>
            <input id="review-reject-reason" type="text" placeholder="e.g. The photo is blurry, please upload a clearer copy" class="${INPUT_CLASS}" /></label>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button type="button" data-action="reject-doc" data-id="${doc.id}" ${canDecide ? '' : 'disabled'} class="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl disabled:opacity-40">Reject / request re-upload</button>
          <button type="button" data-action="approve-doc" data-id="${doc.id}" ${canDecide ? '' : 'disabled'} class="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-40">Approve</button>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Engine trace</h4>
          ${trace(state.events)}
        </div>
      </div>
    </div>
  `;
}
