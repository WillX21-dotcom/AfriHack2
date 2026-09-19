import { CLAIM_STAGES, claimStageIndex, formatDate, formatDateTime, html, titleCase, type SafeHtml } from '@shared/index';
import { claimService } from '../services/claim';
import { renderStatusBadge } from '../components/status-badge';
import { renderClaimTimeline } from '../components/timeline';

export function renderClaimDetailPage(claimId: string): SafeHtml {
  const { claim, timeline, vehicles, witnesses, documents } = claimService.getClaimDetail(claimId);

  if (!claim) {
    return html`<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <p class="text-sm font-semibold text-slate-800">Claim not found</p>
      <button data-nav="claims" class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs rounded-xl font-bold">Back to claims</button>
    </div>`;
  }

  const stageIndex = claimStageIndex(claim.status);
  const closedOutcome = claim.status === 'rejected' || claim.status === 'cancelled';
  const pct = stageIndex >= 0 ? Math.round(((stageIndex + 1) / CLAIM_STAGES.length) * 100) : 0;
  const vehicleName = claim.metadata?.insured_vehicle as string | undefined;

  return html`
    <div class="space-y-4 pb-24">
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Claim ${claim.claim_number}</span>
            <h2 class="text-sm font-bold text-slate-900 mt-0.5">${vehicleName || 'Motor claim'}</h2>
            <p class="text-xs text-slate-500 mt-0.5">Insurer: ${claim.provider_name || 'To be confirmed'}${claim.insurer_reference ? ` (ref ${claim.insurer_reference})` : ''}</p>
          </div>
          ${renderStatusBadge(claim.status)}
        </div>

        ${closedOutcome
          ? html`<p class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">This claim was ${claim.status === 'rejected' ? 'declined by the insurer' : 'withdrawn'}. Message your adviser if you have questions.</p>`
          : html`<div class="mt-4 pt-3 border-t border-slate-100">
              <div class="flex justify-between items-center text-xs mb-1.5">
                <span class="font-semibold text-slate-700">Progress</span>
                <span class="font-bold text-amber-600 font-mono">Stage ${Math.max(1, stageIndex + 1)} of ${CLAIM_STAGES.length}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="bg-gradient-to-r from-[#0A192F] via-amber-500 to-emerald-500 h-2.5 rounded-full" style="width: ${Math.max(6, pct)}%"></div></div>
              <div class="flex overflow-x-auto gap-2 py-2 mt-2 text-[10px]">
                ${CLAIM_STAGES.map((stage, i) => html`<span class="shrink-0 px-2 py-0.5 rounded-md font-medium ${i === stageIndex ? 'bg-[#0A192F] text-amber-300 font-bold' : i < stageIndex ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">${i + 1}. ${stage.clientLabel}</span>`)}
              </div>
            </div>`}
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-[10px] text-slate-400 uppercase font-semibold block">Claims handler</span>
          <h4 class="text-xs font-bold text-slate-800 mt-1">${claim.handler_name || 'Not assigned yet'}</h4>
          ${claim.handler_contact ? html`<p class="text-[11px] text-slate-500 mt-0.5">${claim.handler_contact}</p>` : ''}
          ${claim.assessment_date ? html`<p class="text-[11px] text-slate-500 mt-1">Assessment: ${formatDateTime(claim.assessment_date)}</p>` : ''}
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-[10px] text-slate-400 uppercase font-semibold block">Repairs</span>
          <h4 class="text-xs font-bold text-slate-800 mt-1">${claim.repairer_name || 'Repairer not booked yet'}</h4>
          <p class="text-[11px] ${claim.repair_authorised ? 'text-emerald-600' : 'text-slate-500'} font-semibold mt-0.5">${claim.repair_authorised ? 'Repairs authorised' : 'Awaiting authorisation'}</p>
          ${claim.repair_date ? html`<p class="text-[11px] text-slate-500 mt-1">Repair date: ${formatDate(claim.repair_date)}</p>` : ''}
        </div>
      </div>

      ${claim.hire_car_required && claim.hire_car_provider
        ? html`<div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Courtesy vehicle</span>
            <h4 class="font-bold text-slate-800 mt-1">${claim.hire_car_provider}</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">${formatDate(claim.hire_car_start)} to ${formatDate(claim.hire_car_end)}</p>
          </div>`
        : ''}

      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Incident</h3>
        <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">${claim.incident_description}</p>
        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
          <div><span class="text-[10px] text-slate-400 block">Date</span><span class="font-semibold text-slate-700">${formatDate(claim.incident_date)}</span></div>
          <div><span class="text-[10px] text-slate-400 block">Location</span><span class="font-semibold text-slate-700">${claim.incident_location || '—'}</span></div>
          <div class="col-span-2"><span class="text-[10px] text-slate-400 block">SAPS case</span><span class="font-semibold text-slate-700 font-mono">${claim.police_case_number ? `${claim.police_case_number}${claim.police_station ? ` (${claim.police_station})` : ''}` : 'Not reported yet'}</span></div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Timeline</h3>
        ${renderClaimTimeline(timeline)}
      </div>

      ${vehicles.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Vehicles involved</h3>
            ${vehicles.map((v) => html`<div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div class="flex justify-between font-bold text-slate-800 gap-2"><span>${[v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'} (${v.registration_number || 'no registration'})</span><span class="text-[10px] uppercase text-slate-500">${v.is_client_vehicle ? 'Yours' : 'Third party'}</span></div>
              <p class="text-[11px] text-slate-500 mt-1">Driver: ${v.driver_name || 'Not provided'}${v.insurer_name ? ` · Insurer: ${v.insurer_name}` : ''}</p>
            </div>`)}
          </div>`
        : ''}

      ${witnesses.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Witnesses</h3>
            ${witnesses.map((w) => html`<div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"><span class="font-bold text-slate-800">${w.full_name}</span>${w.phone ? html` <span class="text-slate-500">· ${w.phone}</span>` : ''}${w.statement ? html`<p class="text-[11px] text-slate-500 mt-1">${w.statement}</p>` : ''}</div>`)}
          </div>`
        : ''}

      ${documents.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Photos and documents</h3>
            <div class="space-y-2">
              ${documents.map((doc) => html`<button data-action="open-doc" data-id="${doc.id}" class="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-left gap-2"><span class="min-w-0"><span class="font-semibold text-slate-800 block truncate">${doc.name}</span><span class="text-[10px] text-slate-400">${titleCase(doc.document_type)} · ${formatDate(doc.created_at)}</span></span><span class="text-blue-600 font-semibold shrink-0">Open</span></button>`)}
            </div>
          </div>`
        : ''}

      <button data-nav="messages" data-context-claim="${claim.id}" class="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Message your adviser about this claim</button>
    </div>
  `;
}
