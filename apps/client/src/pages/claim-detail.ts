import { CLAIM_STAGES, claimStageIndex, formatDate, formatDateTime, html, titleCase, type SafeHtml } from '@shared/index';
import { claimService } from '../services/claim';
import { renderStatusBadge } from '../components/status-badge';
import { renderClaimTimeline } from '../components/timeline';

export function renderClaimDetailPage(claimId: string): SafeHtml {
  const { claim, timeline, vehicles, witnesses, documents } = claimService.getClaimDetail(claimId);

  if (!claim) {
    return html`<div class="rsc-card px-6 py-10 text-center">
      <p class="rsc-heading">Claim not found</p>
      <button data-nav="claims" class="rsc-btn rsc-btn-primary rsc-btn-sm mt-5">Back to claims</button>
    </div>`;
  }

  const stageIndex = claimStageIndex(claim.status);
  const closedOutcome = claim.status === 'rejected' || claim.status === 'cancelled';
  const pct = stageIndex >= 0 ? Math.round(((stageIndex + 1) / CLAIM_STAGES.length) * 100) : 0;
  const vehicleName = claim.metadata?.insured_vehicle as string | undefined;

  return html`
    <div class="space-y-4 pb-4">
      <section class="rsc-card p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="rsc-ref !text-[12px]">Claim ${claim.claim_number}</p>
            <h2 class="text-base font-semibold text-slate-900 mt-0.5">${vehicleName || 'Motor claim'}</h2>
            <p class="rsc-muted mt-0.5">Insurer: ${claim.provider_name || 'To be confirmed'}${claim.insurer_reference ? ` (ref ${claim.insurer_reference})` : ''}</p>
          </div>
          ${renderStatusBadge(claim.status)}
        </div>

        ${closedOutcome
          ? html`<p class="rsc-text mt-4 pt-4 rsc-divider">This claim was ${claim.status === 'rejected' ? 'declined by the insurer' : 'withdrawn'}. Message your adviser if you have questions.</p>`
          : html`<div class="mt-4 pt-4 rsc-divider">
              <div class="flex justify-between items-center mb-1.5">
                <span class="rsc-eyebrow">Progress</span>
                <span class="rsc-num text-xs font-semibold text-slate-700">Stage ${Math.max(1, stageIndex + 1)} of ${CLAIM_STAGES.length}</span>
              </div>
              <div class="rsc-progress"><span style="width: ${Math.max(6, pct)}%"></span></div>
              <div class="flex overflow-x-auto gap-1.5 mt-3 pb-1">
                ${CLAIM_STAGES.map((stage, i) => html`<span class="shrink-0 rsc-badge ${i === stageIndex ? '!bg-[#0A192F] !text-white' : i < stageIndex ? 'rsc-badge-green' : 'rsc-badge-slate !text-slate-400'}">${i + 1}. ${stage.clientLabel}</span>`)}
              </div>
            </div>`}
      </section>

      <div class="grid grid-cols-2 gap-3">
        <section class="rsc-card p-4">
          <p class="rsc-eyebrow">Claims handler</p>
          <h4 class="text-[13px] font-semibold text-slate-900 mt-1.5">${claim.handler_name || 'Not assigned yet'}</h4>
          ${claim.handler_contact ? html`<p class="rsc-muted mt-0.5">${claim.handler_contact}</p>` : ''}
          ${claim.assessment_date ? html`<p class="rsc-muted mt-1">Assessment: ${formatDateTime(claim.assessment_date)}</p>` : ''}
        </section>
        <section class="rsc-card p-4">
          <p class="rsc-eyebrow">Repairs</p>
          <h4 class="text-[13px] font-semibold text-slate-900 mt-1.5">${claim.repairer_name || 'Not booked yet'}</h4>
          <p class="text-xs font-medium mt-0.5 ${claim.repair_authorised ? 'text-emerald-700' : 'text-slate-500'}">${claim.repair_authorised ? 'Repairs authorised' : 'Awaiting authorisation'}</p>
          ${claim.repair_date ? html`<p class="rsc-muted mt-1">Repair date: ${formatDate(claim.repair_date)}</p>` : ''}
        </section>
      </div>

      ${claim.hire_car_required && claim.hire_car_provider
        ? html`<section class="rsc-card p-4">
            <p class="rsc-eyebrow">Courtesy vehicle</p>
            <h4 class="text-[13px] font-semibold text-slate-900 mt-1.5">${claim.hire_car_provider}</h4>
            ${claim.hire_car_start || claim.hire_car_end
              ? html`<p class="rsc-muted mt-0.5">${claim.hire_car_start ? formatDate(claim.hire_car_start) : 'Start date to be confirmed'}${claim.hire_car_end ? ` to ${formatDate(claim.hire_car_end)}` : ''}</p>`
              : html`<p class="rsc-muted mt-0.5">Dates to be confirmed</p>`}
          </section>`
        : ''}

      <section class="rsc-card p-4 space-y-3">
        <h3 class="rsc-eyebrow">Incident</h3>
        <p class="rsc-text rsc-inset p-3 whitespace-pre-wrap">${claim.incident_description}</p>
        <div class="grid grid-cols-2 gap-3">
          <div><p class="rsc-muted">Date</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${formatDate(claim.incident_date)}</p></div>
          <div><p class="rsc-muted">Location</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${claim.incident_location || '—'}</p></div>
          <div class="col-span-2"><p class="rsc-muted">SAPS case</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${claim.police_case_number ? `${claim.police_case_number}${claim.police_station ? ` (${claim.police_station})` : ''}` : 'Not reported yet'}</p></div>
        </div>
      </section>

      <section class="rsc-card p-4">
        <h3 class="rsc-eyebrow mb-3">Timeline</h3>
        ${renderClaimTimeline(timeline)}
      </section>

      ${vehicles.length > 0
        ? html`<section class="rsc-card p-4 space-y-2">
            <h3 class="rsc-eyebrow">Vehicles involved</h3>
            ${vehicles.map((v) => html`<div class="rsc-inset p-3">
              <div class="flex justify-between gap-2"><span class="text-[13px] font-medium text-slate-900">${[v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'} (${v.registration_number || 'no registration'})</span><span class="rsc-badge rsc-badge-slate shrink-0">${v.is_client_vehicle ? 'Yours' : 'Third party'}</span></div>
              <p class="rsc-muted mt-1">Driver: ${v.driver_name || 'Not provided'}${v.insurer_name ? ` · Insurer: ${v.insurer_name}` : ''}</p>
            </div>`)}
          </section>`
        : ''}

      ${witnesses.length > 0
        ? html`<section class="rsc-card p-4 space-y-2">
            <h3 class="rsc-eyebrow">Witnesses</h3>
            ${witnesses.map((w) => html`<div class="rsc-inset p-3"><span class="text-[13px] font-medium text-slate-900">${w.full_name}</span>${w.phone ? html` <span class="rsc-muted">· ${w.phone}</span>` : ''}${w.statement ? html`<p class="rsc-muted mt-1">${w.statement}</p>` : ''}</div>`)}
          </section>`
        : ''}

      ${documents.length > 0
        ? html`<section class="rsc-card">
            <h3 class="rsc-eyebrow px-4 pt-4">Photos and documents</h3>
            <div class="px-4 pb-1 divide-y divide-slate-100 mt-1">
              ${documents.map((doc) => html`<button data-action="open-doc" data-id="${doc.id}" class="w-full flex items-center justify-between py-3 text-left gap-3"><span class="min-w-0"><span class="text-[13px] font-medium text-slate-900 block truncate">${doc.name}</span><span class="rsc-muted">${titleCase(doc.document_type)} · ${formatDate(doc.created_at)}</span></span><span class="rsc-link shrink-0">Open</span></button>`)}
            </div>
          </section>`
        : ''}

      <button data-nav="messages" data-context-claim="${claim.id}" class="rsc-btn rsc-btn-secondary rsc-btn-block">Message your adviser about this claim</button>
    </div>
  `;
}
