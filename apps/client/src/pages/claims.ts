import { claimService } from '../services/claim';
import { renderStatusBadge } from '../components/status-badge';
import { formatSimpleDate } from '../utils/date';

export function renderClaimsPage(): string {
  const claims = claimService.getClaims();

  return `
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Motor & Asset Claims</h2>
          <p class="text-xs text-slate-500">Live insurer tracking, quotes, and panel beater status</p>
        </div>
        <button data-nav="report-accident" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-1">
          <span>🚨 Report Loss</span>
        </button>
      </div>

      <div class="space-y-3">
        ${
          claims.length === 0
            ? `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p class="text-xs text-slate-400">No insurance claims logged.</p>
              </div>`
            : claims
                .map(
                  (claim) => `
            <div data-nav="claim-detail" data-id="${claim.id}" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer">
              <div class="flex items-start justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Ref: ${claim.claim_number}</span>
                ${renderStatusBadge(claim.status)}
              </div>
              <h3 class="text-xs font-bold text-slate-800">Motor Loss: 2023 BMW X5 xDrive30d (CA 849-291)</h3>
              <p class="text-xs text-slate-500 mt-1 line-clamp-2">${claim.incident_description}</p>
              
              <div class="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                <div>
                  <span class="text-[10px] text-slate-400 block">Incident Date</span>
                  <span class="font-medium text-slate-700">${formatSimpleDate(claim.incident_date)}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block">Police SAPS Case</span>
                  <span class="font-medium text-slate-700 font-mono">${claim.police_case_number || 'N/A'}</span>
                </div>
              </div>

              ${
                claim.handler_name
                  ? `<div class="mt-2 text-[11px] bg-amber-50/70 p-2 rounded-lg text-amber-900 flex justify-between items-center">
                      <span>Assessor: <strong>${claim.handler_name}</strong></span>
                      <span class="font-semibold text-amber-700">Track 17 Stages →</span>
                    </div>`
                  : ''
              }
            </div>
          `
                )
                .join('')
        }
      </div>
    </div>
  `;
}
