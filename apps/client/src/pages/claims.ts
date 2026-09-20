import { formatDate, html, type SafeHtml } from '@shared/index';
import { claimService } from '../services/claim';
import { renderStatusBadge } from '../components/status-badge';
import { renderEmptyState } from '../components/empty-state';
import { icon } from '../components/icons';

export function renderClaimsPage(): SafeHtml {
  const claims = claimService.getClaims();

  return html`
    <div class="space-y-5 pb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="rsc-title">Claims</h2>
          <p class="rsc-subtitle mt-0.5">Follow each claim from report to settlement</p>
        </div>
        <button data-nav="report-accident" class="rsc-btn rsc-btn-danger rsc-btn-sm shrink-0">${icon('alert', 'w-4 h-4', 2)}Report accident</button>
      </div>

      ${claims.length === 0
        ? renderEmptyState('No claims', 'If you are in an accident, report it here and your adviser will take it from there.')
        : html`<div class="space-y-3">
            ${claims.map(
              (claim) => html`<button data-nav="claim-detail" data-id="${claim.id}" class="rsc-card rsc-card-link p-4 block">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="rsc-ref !text-[12px]">${claim.claim_number}</p>
                    <h3 class="rsc-heading mt-0.5">Motor claim${claim.metadata?.insured_vehicle ? html`: ${claim.metadata.insured_vehicle}` : ''}</h3>
                  </div>
                  ${renderStatusBadge(claim.status)}
                </div>
                ${claim.incident_description ? html`<p class="rsc-muted mt-2 line-clamp-2">${claim.incident_description}</p>` : ''}
                <div class="grid grid-cols-2 gap-3 mt-3 pt-3 rsc-divider">
                  <div><p class="rsc-muted">Incident date</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${formatDate(claim.incident_date)}</p></div>
                  <div><p class="rsc-muted">SAPS case</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${claim.police_case_number || 'Not provided'}</p></div>
                </div>
                ${claim.handler_name ? html`<p class="rsc-muted mt-3">Handler: <span class="font-semibold text-slate-800">${claim.handler_name}</span></p>` : ''}
              </button>`
            )}
          </div>`}
    </div>
  `;
}
