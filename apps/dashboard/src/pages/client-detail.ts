import { adviserService } from '../services/adviser';
import { formatCurrencyZAR, formatDateTime } from '../utils/formatters';
import { renderDashboardStatusBadge } from '../components/status-badge';

export function renderClientDetailPage(clientId: string): string {
  const data = adviserService.getClientById(clientId);
  const client = data.client;

  if (!client) {
    return `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <h3 class="text-sm font-bold text-slate-800">Client profile not found</h3>
      <button data-dash-nav="clients" class="mt-3 px-4 py-2 bg-[#0A192F] text-amber-300 rounded-xl text-xs font-bold">Back to Directory</button>
    </div>`;
  }

  const totalAssets = data.assets.reduce((s, a) => s + Number(a.current_value), 0);
  const totalLiab = data.liabilities.reduce((s, l) => s + Number(l.outstanding_balance), 0);
  const totalInv = data.investments.reduce((s, i) => s + Number(i.current_value), 0);
  const netWorth = totalAssets + totalInv - totalLiab;

  return `
    <div class="space-y-6">
      <!-- Client Header Bar -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-2xl bg-[#0A192F] text-amber-300 font-serif-royal font-bold text-xl flex items-center justify-center shadow-md">
              SD
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-lg font-bold text-slate-900">${client.profile ? `${client.profile.first_name || ''} ${client.profile.last_name || ''}`.trim() : 'Profile unavailable'}</h2>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✓ FICA Verified
                </span>
              </div>
              <div class="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                <span class="font-mono font-semibold text-slate-700">${client.client_number}</span>
                <span>•</span>
                <span class="font-mono">ID: ${client.id_number}</span>
                <span>•</span>
                <span>Risk: <strong class="text-slate-800 uppercase">${client.risk_profile}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <div class="text-right pr-4 border-r border-slate-200">
              <span class="text-[10px] text-slate-400 uppercase tracking-wide block">Estimated Net Worth</span>
              <span class="text-lg font-bold font-mono text-slate-900">${formatCurrencyZAR(netWorth)}</span>
            </div>
            <button data-action="generate-border-letter" data-client="${client.id}" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors">
              📄 Cross-Border Letter
            </button>
            <button data-action="generate-tax-cert" data-client="${client.id}" class="px-3 py-2 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors">
              📊 Tax Schedule
            </button>
          </div>
        </div>
      </div>

      <!-- Financial Pillars Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Tangible Assets -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Tangible Assets</h3>
            <span class="text-xs font-bold text-slate-900 font-mono">${formatCurrencyZAR(totalAssets)}</span>
          </div>
          <div class="space-y-2 mt-3">
            ${data.assets
              .map(
                (a) => `
              <div class="p-2.5 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span class="font-semibold text-slate-800">${a.name}</span>
                  <span class="text-[10px] text-slate-400 block">${a.asset_type}</span>
                </div>
                <span class="font-mono font-bold text-slate-700">${formatCurrencyZAR(a.current_value)}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Managed Investments -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Investments</h3>
            <span class="text-xs font-bold text-slate-900 font-mono">${formatCurrencyZAR(totalInv)}</span>
          </div>
          <div class="space-y-2 mt-3">
            ${data.investments
              .map(
                (i) => `
              <div class="p-2.5 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span class="font-semibold text-slate-800">${i.investment_name}</span>
                  <span class="text-[10px] text-slate-400 block">${i.provider_name}</span>
                </div>
                <span class="font-mono font-bold text-slate-700">${formatCurrencyZAR(i.current_value)}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Liabilities -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Liabilities</h3>
            <span class="text-xs font-bold text-rose-700 font-mono">${formatCurrencyZAR(totalLiab)}</span>
          </div>
          <div class="space-y-2 mt-3">
            ${data.liabilities
              .map(
                (l) => `
              <div class="p-2.5 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span class="font-semibold text-slate-800">${l.name}</span>
                  <span class="text-[10px] text-slate-400 block">${l.liability_type}</span>
                </div>
                <span class="font-mono font-bold text-rose-700">${formatCurrencyZAR(l.outstanding_balance)}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- In-Force Policies & Claims -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Policies -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">In-Force Policies</h3>
          <div class="space-y-3">
            ${data.policies
              .map(
                (p) => `
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <h4 class="font-bold text-slate-800">${p.policy_type}</h4>
                  <span class="text-[11px] text-slate-400 font-mono">${p.provider_name} • ${p.policy_number}</span>
                </div>
                <div class="text-right">
                  <span class="font-mono font-bold text-slate-800 block">${formatCurrencyZAR(p.sum_assured)}</span>
                  <span class="text-[10px] text-slate-400">${formatCurrencyZAR(p.premium)}/mo</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Active Requests & Claims -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Active In-Flight Workflows</h3>
          <div class="space-y-2.5">
            ${data.claims
              .map(
                (clm) => `
              <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div>
                  <span class="font-mono font-bold text-slate-900">${clm.claim_number}</span>
                  <p class="text-slate-600 text-[11px] mt-0.5">Motor Loss: 2023 BMW X5</p>
                </div>
                <button data-dash-nav="claim-detail" data-id="${clm.id}" class="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700">
                  Manage Claim →
                </button>
              </div>
            `
              )
              .join('')}
            ${data.requests
              .map(
                (req) => `
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span class="font-mono font-bold text-slate-900">${req.request_number}</span>
                  <p class="text-slate-600 text-[11px] mt-0.5">${req.title}</p>
                </div>
                <button data-dash-nav="request-detail" data-id="${req.id}" class="px-3 py-1 bg-slate-800 text-white rounded-lg font-bold text-[11px] hover:bg-slate-900">
                  Advance →
                </button>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Compliance Audit Trail -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">FAIS Regulatory Record of Advice Audit Log</h3>
        <div class="space-y-2 text-xs">
          ${data.auditLogs
            .map(
              (aud) => `
            <div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
              <span class="font-semibold text-slate-800">${aud.action}</span>
              <span class="font-mono text-slate-400">${formatDateTime(aud.created_at)}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}
