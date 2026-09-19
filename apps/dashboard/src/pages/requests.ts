import { html, type SafeHtml } from '@shared/html';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { formatDateTime, isOpenRequest } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge, renderPriorityBadge } from '../components/status-badge';
import { emptyState, pageHeading } from '../components/ui';

export function renderDashboardRequestsPage(): SafeHtml {
  const requests = adviserService.getRequests();
  const now = Date.now();

  return html`
    <div class="space-y-6">
      ${pageHeading('Service Requests Desk', 'Requests raised by clients in the app. Progressing a step notifies the client instantly.')}

      <div class="flex flex-wrap gap-2 text-xs" id="request-filters">
        ${[
          ['all', 'All'],
          ['open', 'Open'],
          ['overdue', 'Past SLA'],
          ['completed', 'Resolved'],
        ].map(([key, label]) => html`<button data-request-filter="${key}" class="px-3 py-1.5 rounded-full border font-semibold ${key === 'open' ? 'bg-[#0A192F] text-amber-300 border-[#0A192F]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}">${label}</button>`)}
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        ${requests.length === 0
          ? emptyState('No requests yet', 'When a client submits a request in the app it shows up here immediately.')
          : html`
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-3.5 px-4">Ref</th><th class="py-3.5 px-4">Client</th><th class="py-3.5 px-4">Request</th><th class="py-3.5 px-4">Priority</th>
                    <th class="py-3.5 px-4">Status</th><th class="py-3.5 px-4">Assigned</th><th class="py-3.5 px-4">SLA deadline</th><th class="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody id="requests-table-body" class="divide-y divide-slate-100">
                  ${requests.map((req) => {
                    const open = isOpenRequest(req.status);
                    const overdue = open && !!req.due_date && new Date(req.due_date).getTime() < now;
                    return html`
                      <tr class="hover:bg-slate-50/80 transition-colors" data-open="${open}" data-overdue="${overdue}" data-status="${req.status}">
                        <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${req.request_number}</td>
                        <td class="py-3.5 px-4 font-semibold text-slate-800">${adviserService.clientName(req.client_id)}</td>
                        <td class="py-3.5 px-4">
                          <span class="font-bold text-slate-900 block">${req.title}</span>
                          <span class="text-[10px] uppercase text-slate-400">${REQUEST_TYPE_LABELS[req.request_type as RequestType] || req.request_type}</span>
                        </td>
                        <td class="py-3.5 px-4">${renderPriorityBadge(req.priority)}</td>
                        <td class="py-3.5 px-4">${renderDashboardStatusBadge(req.status)}</td>
                        <td class="py-3.5 px-4">${adviserService.profileName(req.assigned_to)}</td>
                        <td class="py-3.5 px-4 font-mono ${overdue ? 'text-rose-700 font-bold' : 'text-slate-500'}">${formatDateTime(req.due_date)}${overdue ? ' ⚠' : ''}</td>
                        <td class="py-3.5 px-4 text-right">
                          <button data-dash-nav="request-detail" data-id="${req.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">${open ? 'Process →' : 'View →'}</button>
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          `}
      </div>
    </div>
  `;
}
