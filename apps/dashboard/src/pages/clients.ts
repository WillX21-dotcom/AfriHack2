import { html, type SafeHtml } from '@shared/html';
import { formatZAR, fullName } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { emptyState, pageHeading } from '../components/ui';

export function renderClientsPage(): SafeHtml {
  const clients = adviserService.getClients();
  const riskProfiles = [...new Set(clients.map((c) => c.risk_profile).filter(Boolean))] as string[];

  return html`
    <div class="space-y-6">
      ${pageHeading(
        'Private Client Directory',
        'Every client who has registered, with FICA status and consolidated wealth',
        html`
          <button id="copy-signup-link-btn" class="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs">🔗 Copy client sign-up link</button>
          <button id="export-clients-csv-btn" class="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs">📥 Export CSV</button>
        `
      )}

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <input id="client-search-input" type="text" placeholder="Filter by name, email, SA ID or client reference..." class="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <select id="client-risk-filter" class="text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <option value="all">All risk profiles</option>
          ${riskProfiles.map((r) => html`<option value="${r.toLowerCase()}">${r}</option>`)}
          <option value="unrated">Not yet rated</option>
        </select>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        ${clients.length === 0
          ? emptyState('No clients yet', 'Clients appear here as soon as they register in the client app. Use "Copy client sign-up link" to invite them.')
          : html`
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-3.5 px-4">Client Ref</th><th class="py-3.5 px-4">Name</th><th class="py-3.5 px-4">SA ID</th><th class="py-3.5 px-4">Risk Profile</th>
                    <th class="py-3.5 px-4">Adviser</th><th class="py-3.5 px-4">Net Worth</th><th class="py-3.5 px-4">FICA</th><th class="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="clients-table-body" class="divide-y divide-slate-100">
                  ${clients.map((c) => {
                    const totals = adviserService.clientTotals(c.id);
                    return html`
                      <tr class="hover:bg-slate-50/80 transition-colors" data-risk="${(c.risk_profile || 'unrated').toLowerCase()}">
                        <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${c.client_number || '—'}</td>
                        <td class="py-3.5 px-4">
                          <div class="font-bold text-slate-900">${fullName(c.profile, 'Profile unavailable')}</div>
                          <div class="text-[11px] text-slate-400">${c.profile?.email || 'No email'}</div>
                        </td>
                        <td class="py-3.5 px-4 font-mono">${c.id_number || '—'}</td>
                        <td class="py-3.5 px-4">
                          ${c.risk_profile
                            ? html`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${c.risk_profile}</span>`
                            : html`<span class="text-slate-400">Not yet rated</span>`}
                        </td>
                        <td class="py-3.5 px-4">${c.adviser ? fullName(c.adviser) : html`<span class="text-amber-700 font-semibold">Unassigned</span>`}</td>
                        <td class="py-3.5 px-4 font-mono font-semibold text-slate-900">${formatZAR(totals.netWorth)}</td>
                        <td class="py-3.5 px-4">${renderDashboardStatusBadge(adviserService.ficaStatus(c.id))}</td>
                        <td class="py-3.5 px-4 text-right">
                          <button data-dash-nav="client-detail" data-id="${c.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">View 360° →</button>
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
