import { html, type SafeHtml } from '@shared/html';
import { titleCase } from '@shared/format';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  // Requests
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Progress' },
  waiting_client: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Client Action' },
  waiting_provider: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'With Provider' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Resolved' },
  cancelled: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Cancelled' },
  // Claims
  reported: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Incident Logged' },
  insurer_received: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Insurer Notified' },
  handler_assigned: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Assessor Assigned' },
  assessment_pending: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Assessment Due' },
  assessment_complete: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Assessed' },
  quotes_pending: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Quotes Pending' },
  authorisation_pending: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Auth Pending' },
  authorised: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Repairs Authorised' },
  repair_booked: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Repair Booked' },
  repair_in_progress: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Repair Bay' },
  vehicle_ready: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Vehicle Ready' },
  hire_car_returned: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Hire Car Returned' },
  rejected: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Repudiated' },
  // Generic
  active: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Active' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  verified: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Verified' },
  partial: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Partially Verified' },
};

export function renderDashboardStatusBadge(status: string): SafeHtml {
  const style = STATUS_STYLES[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: titleCase(status) };
  return html`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}">${style.label}</span>`;
}

export function renderPriorityBadge(priority: string): SafeHtml {
  const cls =
    priority === 'urgent' ? 'bg-red-100 text-red-800' : priority === 'high' ? 'bg-amber-100 text-amber-800' : priority === 'low' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700';
  return html`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cls}">${priority}</span>`;
}
