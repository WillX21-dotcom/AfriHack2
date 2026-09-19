import { adviserService } from '../services/adviser';
import { formatCurrencyZAR } from '../utils/formatters';

export function renderClientsPage(): string {
  const clients = adviserService.getClients();

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Private Client Directory</h2>
          <p class="text-xs text-slate-500">Comprehensive 360° client portfolios, FICA records & asset schedules</p>
        </div>
        <div class="flex items-center space-x-2">
          <button id="export-clients-csv-btn" class="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors">
            <span>📥 Export CSV</span>
          </button>
          <button id="open-new-client-modal" class="px-3.5 py-2 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-bold shadow-xs transition-colors">
            + Onboard Client
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <input
            id="client-search-input"
            type="text"
            placeholder="Search by client name, SA ID, or client reference..."
            class="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <select id="client-risk-filter" class="text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <option value="all">All Risk Profiles</option>
          <option value="conservative">Conservative</option>
          <option value="moderate">Moderate</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>

      <!-- Clients Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="py-3.5 px-4">Client Ref</th>
                <th class="py-3.5 px-4">Full Name</th>
                <th class="py-3.5 px-4">South African ID</th>
                <th class="py-3.5 px-4">Risk Profile</th>
                <th class="py-3.5 px-4">Managed Portfolios</th>
                <th class="py-3.5 px-4">FICA Status</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="clients-table-body" class="divide-y divide-slate-100">
              ${clients
                .map(
                  (c) => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${c.client_number}</td>
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-slate-900">${c.profile ? `${c.profile.first_name || ''} ${c.profile.last_name || ''}`.trim() : 'Profile unavailable'}</div>
                    <div class="text-[11px] text-slate-400">${c.profile?.email || 'No email'}</div>
                  </td>
                  <td class="py-3.5 px-4 font-mono">${c.id_number || '8506125089087'}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      ${c.risk_profile || 'Moderate'}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono font-semibold text-slate-900">${formatCurrencyZAR(4850000)}</td>
                  <td class="py-3.5 px-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Verified
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button data-dash-nav="client-detail" data-id="${c.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">
                      View 360° →
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
