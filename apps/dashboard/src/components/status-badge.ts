export function renderDashboardStatusBadge(status: string): string {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    // Requests
    draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Progress' },
    waiting_client: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Client Action' },
    waiting_provider: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'With Insurer' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Resolved' },
    cancelled: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Cancelled' },

    // Claims
    reported: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Incident Logged' },
    insurer_received: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Insurer Notified' },
    handler_assigned: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Assessor Assigned' },
    assessment_pending: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Assessment Due' },
    assessment_complete: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Assessed' },
    authorised: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Repairs Authorised' },
    repair_in_progress: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Repair Bay' },
    vehicle_ready: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Vehicle Ready' },
    active: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Active' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  };

  const item = map[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status.replace(/_/g, ' ') };

  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.bg} ${item.text}">
    ${item.label}
  </span>`;
}
