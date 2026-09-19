import { html, type SafeHtml } from '@shared/html';
import { CLAIM_STAGE_LABELS } from '@shared/constants/claim-types';
import { formatDateTime, fullName, isOpenClaim } from '@shared/format';
import { adviserService, CLAIM_PIPELINE } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { INPUT_CLASS, notFound } from '../components/ui';
import { toDateTimeLocal } from '../services/records';
import { renderDocumentRow, renderUploadForm } from './client-detail';

function input(name: string, label: string, value: unknown, type = 'text'): SafeHtml {
  const shown = type === 'datetime-local' ? toDateTimeLocal(value) : (value ?? '');
  return html`<label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">${label}</span><input name="${name}" type="${type}" value="${shown}" class="${INPUT_CLASS}" /></label>`;
}

export function renderDashboardClaimDetailPage(claimId: string): SafeHtml {
  const { claim, timeline, vehicles, witnesses, client, documents } = adviserService.getClaimDetail(claimId);
  if (!claim) return notFound('Claim', 'claims', 'Back to Claims');

  const currentIndex = CLAIM_PIPELINE.findIndex((s) => s.key === claim.status);
  const nextStage = currentIndex >= 0 ? CLAIM_PIPELINE[currentIndex + 1] : undefined;
  const open = isOpenClaim(claim.status);
  const vehicle = (claim.metadata as any)?.insured_vehicle as string | undefined;

  return html`
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center flex-wrap gap-2">
              <span class="font-mono text-xs font-bold text-slate-400">${claim.claim_number}</span>
              ${renderDashboardStatusBadge(claim.status)}
              <span class="text-xs font-semibold text-slate-500">${claim.provider_name || 'Insurer not assigned'}</span>
            </div>
            <h2 class="text-lg font-bold text-slate-900 mt-1">${vehicle || 'Insured vehicle not specified'}</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Insured client: <button data-dash-nav="client-detail" data-id="${claim.client_id}" class="font-bold text-blue-700 hover:underline">${fullName(client?.profile, 'Unknown client')}</button> (${client?.client_number || '—'})
            </p>
          </div>
          <button data-dash-nav="communications" data-id="${claim.client_id}" data-claim="${claim.id}" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold shrink-0">✉ Message client</button>
        </div>

        <div class="mt-5 pt-4 border-t border-slate-100">
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            ${currentIndex >= 0 ? `Stage ${currentIndex + 1} of ${CLAIM_PIPELINE.length}` : CLAIM_STAGE_LABELS[claim.status] || claim.status}
          </div>
          <div class="flex overflow-x-auto gap-2 pb-2">
            ${CLAIM_PIPELINE.map((st, i) => {
              const isPast = i < currentIndex;
              const isCurrent = i === currentIndex;
              return html`
                <div class="shrink-0 p-2.5 rounded-xl border text-xs min-w-[120px] ${isCurrent ? 'border-amber-400 bg-amber-50/70 font-bold text-amber-900 ring-2 ring-amber-100' : isPast ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800' : 'border-slate-100 bg-slate-50 text-slate-400'}">
                  <div class="flex items-center justify-between text-[10px] mb-1 opacity-75"><span>Step ${i + 1}</span>${isPast ? html`<span>✓</span>` : ''}</div>
                  <div class="truncate">${st.label}</div>
                </div>
              `;
            })}
          </div>
        </div>

        <form id="claim-status-form" data-claim="${claim.id}" class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3 items-end">
          <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Move claim to</span>
            <select name="status" class="${INPUT_CLASS}">
              ${CLAIM_PIPELINE.map((s) => html`<option value="${s.key}" ${(nextStage ? s.key === nextStage.key : s.key === claim.status) ? 'selected' : ''}>${s.label}${s.key === claim.status ? ' (current)' : ''}</option>`)}
              <option value="rejected" ${claim.status === 'rejected' ? 'selected' : ''}>Repudiated (rejected)</option>
              <option value="cancelled" ${claim.status === 'cancelled' ? 'selected' : ''}>Withdrawn (cancelled)</option>
            </select>
          </label>
          <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Update for the client (shown on their timeline)</span>
            <input name="description" type="text" placeholder="${open ? 'e.g. Assessor booked for Thursday 09:00' : 'Reason for reopening'}" class="${INPUT_CLASS}" />
          </label>
          <button type="submit" class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs">Update stage</button>
        </form>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Claim chronology</h3>
              <span class="text-xs text-slate-400 font-mono">${timeline.length} updates</span>
            </div>
            <div class="space-y-3">
              ${timeline.map(
                (tl) => html`
                  <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div class="flex justify-between items-center mb-1 gap-2">
                      <span class="font-bold text-slate-900">${tl.title}${tl.is_client_visible ? '' : ' (internal)'}</span>
                      <span class="text-[11px] text-slate-400 font-mono shrink-0">${formatDateTime(tl.created_at)}</span>
                    </div>
                    ${tl.description ? html`<p class="text-slate-600 text-[11px] leading-relaxed">${tl.description}</p>` : ''}
                  </div>
                `
              )}
            </div>
          </div>

          <form id="claim-note-form" data-claim="${claim.id}" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Internal note <span class="normal-case font-medium text-slate-400">(staff only, never shown to the client)</span></h3>
            <textarea name="note" rows="2" required placeholder="e.g. Insurer wants a second quote; client contacted by phone" class="${INPUT_CLASS}"></textarea>
            <button type="submit" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl">Add internal note</button>
          </form>

          <form id="claim-details-form" data-claim="${claim.id}" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Claim details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${input('insurer_reference', 'Insurer claim reference', claim.insurer_reference)}
              <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Insurer</span>
                <select name="provider_id" class="${INPUT_CLASS}"><option value="">Not assigned</option>${adviserService.getProviders().map((p) => html`<option value="${p.id}" ${p.id === claim.provider_id ? 'selected' : ''}>${p.name}</option>`)}</select>
              </label>
              ${input('handler_name', 'Assessor / handler', claim.handler_name)}
              ${input('handler_contact', 'Handler contact', claim.handler_contact)}
              ${input('assessment_date', 'Assessment date', claim.assessment_date, 'datetime-local')}
              ${input('repairer_name', 'Panel beater / repairer', claim.repairer_name)}
              ${input('repair_date', 'Repair date', claim.repair_date, 'datetime-local')}
              ${input('hire_car_provider', 'Courtesy vehicle provider', claim.hire_car_provider)}
              ${input('hire_car_start', 'Courtesy vehicle from', claim.hire_car_start, 'datetime-local')}
              ${input('hire_car_end', 'Courtesy vehicle until', claim.hire_car_end, 'datetime-local')}
              ${input('police_case_number', 'SAPS case number', claim.police_case_number)}
              ${input('police_station', 'Police station', claim.police_station)}
            </div>
            <label class="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" name="hire_car_required" ${claim.hire_car_required ? 'checked' : ''} class="rounded border-slate-300" /> Courtesy vehicle required</label>
            <button type="submit" class="px-5 py-2.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Save claim details</button>
          </form>
        </div>

        <div class="space-y-6 text-xs">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Incident</h3>
            <div><span class="text-[10px] uppercase text-slate-400 block">When / where</span><p class="text-slate-700 mt-0.5">${formatDateTime(claim.incident_date)}<br />${claim.incident_location || '—'}</p></div>
            <div><span class="text-[10px] uppercase text-slate-400 block">Client's account</span><p class="text-slate-700 mt-0.5 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">${claim.incident_description || '—'}</p></div>
            <div><span class="text-[10px] uppercase text-slate-400 block">SAPS</span><p class="font-semibold text-slate-800 font-mono">${claim.police_case_number || 'Not reported'}${claim.police_station ? ` (${claim.police_station})` : ''}</p></div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Third parties & witnesses</h3>
            ${vehicles.length + witnesses.length === 0 ? html`<p class="text-[11px] text-slate-400">None recorded by the client.</p>` : ''}
            ${vehicles.map(
              (v) => html`<div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><span class="font-bold text-slate-800">${[v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'} ${v.registration_number ? `(${v.registration_number})` : ''}</span>
                <p class="text-[11px] text-slate-500 mt-0.5">${v.is_client_vehicle ? 'Insured vehicle' : 'Third party'} · Driver: ${v.driver_name || 'not given'}${v.insurer_name ? ` · Insurer: ${v.insurer_name}` : ''}</p></div>`
            )}
            ${witnesses.map(
              (w) => html`<div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><span class="font-bold text-slate-800">${w.full_name || 'Witness'}</span><p class="text-[11px] text-slate-500 mt-0.5">${w.phone || ''} ${w.statement || ''}</p></div>`
            )}
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Photos & documents</h3>
            <div class="space-y-2">${documents.length === 0 ? html`<p class="text-[11px] text-slate-400">No files attached to this claim.</p>` : documents.map((d) => renderDocumentRow(d))}</div>
            ${renderUploadForm(claim.client_id, { claimId: claim.id }, 'claim_document')}
          </div>
        </div>
      </div>
    </div>
  `;
}
