import { html, titleCase, type SafeHtml } from '@shared/index';
import { CLAIM_STAGES } from '@shared/constants/claim-stages';

type Tone = 'slate' | 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'indigo' | 'cyan';

// Same tones as the adviser dashboard, so both sides describe a record the same way.
const STYLES: Record<string, { tone: Tone; label?: string }> = {
  draft: { tone: 'slate' },
  submitted: { tone: 'blue' },
  in_progress: { tone: 'amber' },
  waiting_client: { tone: 'purple', label: 'Action required' },
  waiting_provider: { tone: 'indigo', label: 'With provider' },
  completed: { tone: 'green' },
  cancelled: { tone: 'red' },
  rejected: { tone: 'red', label: 'Declined' },
  reported: { tone: 'amber' },
  insurer_received: { tone: 'blue' },
  handler_assigned: { tone: 'indigo' },
  assessment_pending: { tone: 'purple' },
  assessment_complete: { tone: 'cyan' },
  authorised: { tone: 'green' },
  repair_in_progress: { tone: 'amber' },
  vehicle_ready: { tone: 'green' },
};

export type StatusKind = 'request' | 'claim';

// A few statuses exist for both requests and claims but mean different things ("submitted" for a
// request is just "Submitted"; for a claim it is "Checked by Royal Square"), so wording is per kind.
const REQUEST_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_progress: 'In progress',
  waiting_client: 'Action required',
  waiting_provider: 'With provider',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function statusLabel(status: string, kind: StatusKind = 'claim'): string {
  if (kind === 'request') return REQUEST_LABELS[status] || titleCase(status);
  return STYLES[status]?.label || CLAIM_STAGES.find((s) => s.key === status)?.clientLabel || titleCase(status);
}

export function renderStatusBadge(status: string, kind: StatusKind = 'claim'): SafeHtml {
  const tone = STYLES[status]?.tone ?? 'slate';
  return html`<span class="rsc-badge rsc-badge-${tone}">${statusLabel(status, kind)}</span>`;
}

/** Badge for anything that is not a request / claim status (documents, onboarding...). */
export function renderToneBadge(label: string, tone: Tone): SafeHtml {
  return html`<span class="rsc-badge rsc-badge-${tone}">${label}</span>`;
}
