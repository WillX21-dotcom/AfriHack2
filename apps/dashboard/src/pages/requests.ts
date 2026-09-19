import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { formatDateTime } from '../utils/formatters';

export function renderDashboardRequestsPage(): string {
  const requests = adviserService.getRequests();

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Service Requests Dispatch Desk</h2>
          <p class="text-xs text-slate-500">Track and advance multi-step client requests according to practice SLAs</p>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="py-3.5 px-4">Ref Number</th>
                <th class="py-3.5 px-4">Category</th>
                <th class="py-3.5 px-4">Subject Title</th>
                <th class="py-3.5 px-4">Priority</th>
                <th class="py-3.5 px-4">Workflow Status</th>
                <th class="py-3.5 px-4">SLA Deadline</th>
                <th class="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${requests
                .map(
                  (req) => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${req.request_number}</td>
                  <td class="py-3.5 px-4 font-semibold uppercase text-[10px] text-slate-500">${req.request_type.replace(/_/g, ' ')}</td>
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-900 block">${req.title}</span>
                    <span class="text-[11px] text-slate-400 line-clamp-1">${req.description || ''}</span>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      req.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : req.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }">
                      ${req.priority}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">${renderDashboardStatusBadge(req.status)}</td>
                  <td class="py-3.5 px-4 text-slate-500 font-mono">${formatDateTime(req.due_date)}</td>
                  <td class="py-3.5 px-4 text-right">
                    <button data-dash-nav="request-detail" data-id="${req.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">
                      Advance Step →
                    </button>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
