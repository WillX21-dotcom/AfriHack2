import { html, type SafeHtml } from '@shared/html';
import { formatDateTime } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge, renderPriorityBadge } from '../components/status-badge';
import { INPUT_CLASS, emptyState, pageHeading } from '../components/ui';

/** Client picker + create button used by the tasks and reminders pages. */
export function newRecordControl(table: 'tasks' | 'reminders', label: string): SafeHtml {
  const clients = adviserService.getClients();
  return html`
    <div class="flex items-center gap-2">
      <select id="new-record-client" class="${INPUT_CLASS} !w-56" aria-label="Client">
        ${clients.length === 0 ? html`<option value="">No clients yet</option>` : clients.map((c) => html`<option value="${c.id}">${adviserService.clientName(c.id)}</option>`)}
      </select>
      <button data-action="edit-record" data-table="${table}" data-client="__select__" data-id="" ${clients.length === 0 ? 'disabled' : ''} class="px-3.5 py-2.5 bg-[#0A192F] text-amber-300 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap">${label}</button>
    </div>
  `;
}

export function renderDashboardTasksPage(): SafeHtml {
  const me = adviserService.getMe();
  const tasks = adviserService.getTasks();
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'completed' || t.status === 'cancelled').slice(0, 15);
  const now = Date.now();
  // Mine first, then by due date
  const sorted = [...open].sort((a, b) => Number(b.assigned_to === me?.id) - Number(a.assigned_to === me?.id) || (a.due_date || '9').localeCompare(b.due_date || '9'));

  const row = (t: (typeof tasks)[number]) => {
    const overdue = !!t.due_date && new Date(t.due_date).getTime() < now && (t.status === 'pending' || t.status === 'in_progress');
    return html`
      <div class="p-3.5 rounded-xl border ${overdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 bg-slate-50'} flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-slate-900">${t.title}</span>
            ${renderPriorityBadge(t.priority)} ${renderDashboardStatusBadge(t.status)}
          </div>
          <p class="text-[11px] text-slate-500 mt-1">
            ${t.client_id ? html`<button data-dash-nav="client-detail" data-id="${t.client_id}" class="font-semibold text-blue-700 hover:underline">${adviserService.clientName(t.client_id)}</button> · ` : ''}
            ${t.request_id ? html`<button data-dash-nav="request-detail" data-id="${t.request_id}" class="text-blue-700 hover:underline">Request</button> · ` : ''}
            ${t.claim_id ? html`<button data-dash-nav="claim-detail" data-id="${t.claim_id}" class="text-blue-700 hover:underline">Claim</button> · ` : ''}
            ${adviserService.profileName(t.assigned_to)} · ${t.due_date ? `due ${formatDateTime(t.due_date)}${overdue ? ' (overdue)' : ''}` : 'no due date'}
          </p>
        </div>
        <div class="flex gap-2 shrink-0">
          ${t.status === 'pending' ? html`<button data-action="task-status" data-id="${t.id}" data-status="in_progress" class="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100">Start</button>` : ''}
          ${t.status === 'pending' || t.status === 'in_progress'
            ? html`<button data-action="task-status" data-id="${t.id}" data-status="completed" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">✓ Done</button>`
            : html`<button data-action="task-status" data-id="${t.id}" data-status="pending" class="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100">Reopen</button>`}
        </div>
      </div>
    `;
  };

  return html`
    <div class="space-y-6">
      ${pageHeading('Adviser Tasks', 'Created automatically for every client request and claim; add your own follow-ups too.', newRecordControl('tasks', '+ New task'))}

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Open (${sorted.length})</h3>
        ${sorted.length === 0 ? emptyState('All caught up', 'No open tasks.') : sorted.map(row)}
      </div>

      ${done.length
        ? html`<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"><h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Recently closed</h3>${done.map(row)}</div>`
        : ''}
    </div>
  `;
}
