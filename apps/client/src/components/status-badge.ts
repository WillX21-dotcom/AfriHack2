export function renderStatusBadge(status: string): string {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    // Requests
    draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
    submitted: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Submitted' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
    waiting_client: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Action Required' },
    waiting_provider: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'With Provider' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Cancelled' },

    // Claims
    reported: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Incident Logged' },
    insurer_received: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Insurer Received' },
    handler_assigned: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Assessor Assigned' },
    assessment_pending: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Assessment Due' },
    assessment_complete: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Assessed' },
    authorised: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Repairs Authorised' },
    repair_in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Repair Bay' },
    vehicle_ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Ready for Collection' },
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
  };

  const item = map[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status.replace(/_/g, ' ') };

  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.bg} ${item.text} border border-current/10">
    <span class="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
    ${item.label}
  </span>`;
}
