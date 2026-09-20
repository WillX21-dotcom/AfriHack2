import type { DocumentProcessingStatus, DocumentRecord } from '../types/document';

const BADGE = 'text-[10px] font-bold px-2 py-0.5 rounded-full';

const STATUS_META: Record<DocumentProcessingStatus, { label: string; clientLabel: string; tone: string }> = {
  pending: { label: 'Pending', clientLabel: 'Pending', tone: 'text-slate-600 bg-slate-100' },
  processing: { label: 'Processing', clientLabel: 'Processing', tone: 'text-sky-700 bg-sky-50' },
  auto_completed: { label: 'Auto-completed', clientLabel: 'Auto-completed', tone: 'text-emerald-700 bg-emerald-50' },
  under_review: { label: 'Under review', clientLabel: 'Under review', tone: 'text-amber-700 bg-amber-50' },
  successful: { label: 'Successful', clientLabel: 'Verified', tone: 'text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Rejected', clientLabel: 'Re-upload required', tone: 'text-rose-700 bg-rose-50' },
};

type StatusSubject = Pick<DocumentRecord, 'processing_status'>;

export function documentStatusLabel(doc: StatusSubject, audience: 'client' | 'staff' = 'staff'): string {
  const meta = STATUS_META[doc.processing_status] ?? STATUS_META.pending;
  return audience === 'client' ? meta.clientLabel : meta.label;
}

/** Tailwind classes for a status pill. */
export function documentStatusBadgeClass(doc: StatusSubject): string {
  return `${BADGE} ${(STATUS_META[doc.processing_status] ?? STATUS_META.pending).tone}`;
}
