import { html, type SafeHtml } from '@shared/html';
import { formatDateTime, isOpenClaim } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { emptyState, pageHeading } from '../components/ui';

export function renderDashboardClaimsPage(): SafeHtml {
  const claims = adviserService.getClaims();

  return html`
    <div class="space-y-6">
      ${pageHeading('Claims Centre', 'Motor claims reported by clients. Every stage you set is shown to the client with a notification.')}

      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        ${claims.length === 0
          ? emptyState('No claims reported', 'Claims appear here the moment a client reports an accident in the app.')
          : html`
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-3.5 px-4">Claim ref</th><th class="py-3.5 px-4">Client / vehicle</th><th class="py-3.5 px-4">Insurer</th><th class="py-3.5 px-4">Stage</th>
                    <th class="py-3.5 px-4">Handler</th><th class="py-3.5 px-4">Incident</th><th class="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${claims.map(
                    (c) => html`
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${c.claim_number}</td>
                        <td class="py-3.5 px-4">
                          <span class="font-bold text-slate-900 block">${adviserService.clientName(c.client_id)}</span>
                          <span class="text-[11px] text-slate-400">${(c.metadata as any)?.insured_vehicle || 'Vehicle not specified'}</span>
                        </td>
                        <td class="py-3.5 px-4">
                          <span class="font-semibold text-slate-800 block">${c.provider_name || 'Not assigned'}</span>
                          <span class="text-[11px] text-slate-400 font-mono">${c.insurer_reference || 'Ref pending'}</span>
                        </td>
                        <td class="py-3.5 px-4">${renderDashboardStatusBadge(c.status)}</td>
                        <td class="py-3.5 px-4 font-medium text-slate-700">${c.handler_name || 'Unassigned'}</td>
                        <td class="py-3.5 px-4 font-mono text-slate-500">${formatDateTime(c.incident_date)}</td>
                        <td class="py-3.5 px-4 text-right">
                          <button data-dash-nav="claim-detail" data-id="${c.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">${isOpenClaim(c.status) ? 'Manage →' : 'View →'}</button>
                        </td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </div>
          `}
      </div>
    </div>
  `;
}
