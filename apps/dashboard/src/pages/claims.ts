import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { formatDateTime } from '../utils/formatters';

export function renderDashboardClaimsPage(): string {
  const claims = adviserService.getClaims();

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Motor & Asset Claims Center</h2>
          <p class="text-xs text-slate-500">17-Stage Santam insurer lifecycle tracking, assessor coordination & panel beater logistics</p>
        </div>
      </div>

      <!-- Claims Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="py-3.5 px-4">Claim Ref</th>
                <th class="py-3.5 px-4">Insured Asset</th>
                <th class="py-3.5 px-4">Insurer & Policy</th>
                <th class="py-3.5 px-4">Current Stage</th>
                <th class="py-3.5 px-4">Assessor / Handler</th>
                <th class="py-3.5 px-4">Incident Date</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${claims
                .map(
                  (c) => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${c.claim_number}</td>
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-900 block">2023 BMW X5 xDrive30d</span>
                    <span class="text-[11px] text-slate-400 font-mono">Reg: CA 849-291</span>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="font-semibold text-slate-800 block">Santam Insurance</span>
                    <span class="text-[11px] text-slate-400 font-mono">${c.insurer_reference || 'Ref Pending'}</span>
                  </td>
                  <td class="py-3.5 px-4">${renderDashboardStatusBadge(c.status)}</td>
                  <td class="py-3.5 px-4 font-medium text-slate-700">${c.handler_name || 'Unassigned'}</td>
                  <td class="py-3.5 px-4 font-mono text-slate-500">${formatDateTime(c.incident_date)}</td>
                  <td class="py-3.5 px-4 text-right">
                    <button data-dash-nav="claim-detail" data-id="${c.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">
                      Manage 17-Stages →
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
