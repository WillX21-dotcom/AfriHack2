import { formatDate, html, type SafeHtml } from '@shared/index';
import { claimService } from '../services/claim';
import { renderStatusBadge } from '../components/status-badge';
import { renderEmptyState } from '../components/empty-state';

export function renderClaimsPage(): SafeHtml {
  const claims = claimService.getClaims();

  return html`
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Claims</h2>
          <p class="text-xs text-slate-500">Follow each claim from report to settlement</p>
        </div>
        <button data-nav="report-accident" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs">🚨 Report accident</button>
      </div>

      ${claims.length === 0
        ? renderEmptyState('No claims', 'If you are in an accident, report it here and your adviser will take it from there.')
        : html`<div class="space-y-3">
            ${claims.map(
              (claim) => html`<div data-nav="claim-detail" data-id="${claim.id}" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer">
                <div class="flex items-start justify-between mb-2 gap-2">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">${claim.claim_number}</span>
                  ${renderStatusBadge(claim.status)}
                </div>
                <h3 class="text-xs font-bold text-slate-800">Motor claim${claim.metadata?.insured_vehicle ? `: ${claim.metadata.insured_vehicle}` : ''}</h3>
                <p class="text-xs text-slate-500 mt-1 line-clamp-2">${claim.incident_description || ''}</p>
                <div class="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <div><span class="text-[10px] text-slate-400 block">Incident date</span><span class="font-medium text-slate-700">${formatDate(claim.incident_date)}</span></div>
                  <div><span class="text-[10px] text-slate-400 block">SAPS case</span><span class="font-medium text-slate-700 font-mono">${claim.police_case_number || 'Not provided'}</span></div>
                </div>
                ${claim.handler_name ? html`<div class="mt-2 text-[11px] bg-amber-50/70 p-2 rounded-lg text-amber-900">Handler: <strong>${claim.handler_name}</strong></div>` : ''}
              </div>`
            )}
          </div>`}
    </div>
  `;
}
