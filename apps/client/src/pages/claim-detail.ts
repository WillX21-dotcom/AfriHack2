import { claimService } from '../services/claim';
import { renderStatusBadge } from '../components/status-badge';
import { renderClaimTimeline } from '../components/timeline';
import { formatSimpleDate } from '../utils/date';
import { CLAIM_STATUSES } from '@shared/constants/statuses';

const ALL_17_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'reported', label: 'Reported' },
  { key: 'submitted', label: 'Validated' },
  { key: 'insurer_received', label: 'Insurer Received' },
  { key: 'handler_assigned', label: 'Handler Assigned' },
  { key: 'assessment_pending', label: 'Assessment Due' },
  { key: 'assessment_complete', label: 'Assessed' },
  { key: 'quotes_pending', label: 'Quotes Pending' },
  { key: 'authorisation_pending', label: 'Auth Pending' },
  { key: 'authorised', label: 'Authorised' },
  { key: 'repair_booked', label: 'Repair Booked' },
  { key: 'repair_in_progress', label: 'In Repair Bay' },
  { key: 'vehicle_ready', label: 'Vehicle Ready' },
  { key: 'hire_car_returned', label: 'Hire Car Returned' },
  { key: 'completed', label: 'Settled & Closed' },
];

export function renderClaimDetailPage(claimId: string): string {
  const { claim, timeline, vehicles, witnesses } = claimService.getClaimDetail(claimId);

  if (!claim) {
    return `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <p class="text-sm font-semibold text-slate-800">Claim not found</p>
      <button data-nav="claims" class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs rounded-xl font-bold">Back to Claims</button>
    </div>`;
  }

  const currentStageIndex = ALL_17_STAGES.findIndex((s) => s.key === claim.status);

  return `
    <div class="space-y-4 pb-24">
      <!-- Top Card -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Claim ID: ${claim.claim_number}</span>
            <h2 class="text-sm font-bold text-slate-900 mt-0.5">2023 BMW X5 xDrive30d (CA 849-291)</h2>
            <p class="text-xs text-slate-500 font-mono mt-0.5">Insurer: Santam Insurance (${claim.insurer_reference || 'Ref Pending'})</p>
          </div>
          ${renderStatusBadge(claim.status)}
        </div>

        <!-- 17-Stage Progress Bar Summary -->
        <div class="mt-4 pt-3 border-t border-slate-100">
          <div class="flex justify-between items-center text-xs mb-1.5">
            <span class="font-semibold text-slate-700">17-Stage Insurer Lifecycle</span>
            <span class="font-bold text-amber-600 font-mono">Stage ${Math.max(1, currentStageIndex + 1)} of 15</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="bg-gradient-to-r from-[#0A192F] via-amber-500 to-emerald-500 h-2.5 rounded-full" style="width: ${Math.max(10, Math.round(((currentStageIndex + 1) / ALL_17_STAGES.length) * 100))}%"></div>
          </div>
          <div class="flex overflow-x-auto gap-2 py-2 mt-2 scrollbar-none text-[10px]">
            ${ALL_17_STAGES.map((st, i) => {
              const done = i <= currentStageIndex;
              const current = i === currentStageIndex;
              return `<span class="shrink-0 px-2 py-0.5 rounded-md font-medium ${
                current
                  ? 'bg-[#0A192F] text-amber-300 font-bold'
                  : done
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }">${i + 1}. ${st.label}</span>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Handler & Courtesy Car Strip -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-[10px] text-slate-400 uppercase font-semibold block">Appointed Assessor</span>
          <h4 class="text-xs font-bold text-slate-800 mt-1">${claim.handler_name || 'Assessor Pending'}</h4>
          <p class="text-[11px] text-slate-500 mt-0.5">${claim.handler_contact || 'Santam Claims Desk'}</p>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span class="text-[10px] text-slate-400 uppercase font-semibold block">Courtesy Vehicle</span>
          <h4 class="text-xs font-bold text-slate-800 mt-1">${claim.hire_car_provider || 'Europcar Sandton'}</h4>
          <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">Authorised Class D</p>
        </div>
      </div>

      <!-- Incident & Police SAPS Data -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Incident Circumstances</h3>
        <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">${claim.incident_description}</p>
        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
          <div>
            <span class="text-[10px] text-slate-400 block">Incident Date</span>
            <span class="font-semibold text-slate-700">${formatSimpleDate(claim.incident_date)}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">SAPS Case Ref</span>
            <span class="font-semibold text-slate-700 font-mono">${claim.police_case_number} (${claim.police_station || 'Sandton'})</span>
          </div>
        </div>
      </div>

      <!-- Chronological Claim Updates -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Live Timeline Feed</h3>
        ${renderClaimTimeline(timeline)}
      </div>

      <!-- Third Parties & Witnesses if logged -->
      ${
        vehicles.length > 0
          ? `
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Involved Vehicles</h3>
          ${vehicles
            .map(
              (v) => `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div class="flex justify-between font-bold text-slate-800">
                <span>${v.make} ${v.model} (${v.registration_number || 'No Reg'})</span>
                <span class="text-[10px] uppercase text-slate-500">${v.is_client_vehicle ? 'Insured' : 'Third Party'}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Driver: ${v.driver_name || 'Not provided'} • Damage: ${v.damage_description || 'Contact damage'}</p>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
    </div>
  `;
}
