import { html, titleCase, type SafeHtml } from '@shared/index';
import { CLAIM_STAGES } from '@shared/constants/claim-stages';

const STYLES: Record<string, { bg: string; text: string; label?: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700' },
  submitted: { bg: 'bg-blue-50', text: 'text-blue-700' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700' },
  waiting_client: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Action required' },
  waiting_provider: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'With provider' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Declined' },
  reported: { bg: 'bg-amber-50', text: 'text-amber-700' },
  insurer_received: { bg: 'bg-blue-50', text: 'text-blue-700' },
  handler_assigned: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  assessment_pending: { bg: 'bg-purple-50', text: 'text-purple-700' },
  assessment_complete: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  authorised: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  repair_in_progress: { bg: 'bg-amber-50', text: 'text-amber-700' },
  vehicle_ready: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

export function statusLabel(status: string): string {
  return STYLES[status]?.label || CLAIM_STAGES.find((s) => s.key === status)?.clientLabel || titleCase(status);
}

export function renderStatusBadge(status: string): SafeHtml {
  const style = STYLES[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  return html`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}">
    <span class="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>${statusLabel(status)}
  </span>`;
}
