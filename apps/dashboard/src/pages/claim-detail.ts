import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { formatDateTime } from '../utils/formatters';

const ALL_17_STAGES = [
  { key: 'reported', label: 'Incident Logged' },
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

export function renderDashboardClaimDetailPage(claimId: string): string {
  const { claim, timeline, vehicles, witnesses, client } = adviserService.getClaimDetail(claimId);

  if (!claim) {
    return `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <h3 class="text-sm font-bold text-slate-800">Claim not found</h3>
      <button data-dash-nav="claims" class="mt-3 px-4 py-2 bg-[#0A192F] text-amber-300 rounded-xl text-xs font-bold">Back to Claims</button>
    </div>`;
  }

  const currentIndex = ALL_17_STAGES.findIndex((s) => s.key === claim.status);
  const nextStage = ALL_17_STAGES[currentIndex + 1];

  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-slate-400">${claim.claim_number}</span>
              ${renderDashboardStatusBadge(claim.status)}
              <span class="text-xs font-semibold text-slate-500">Santam Insurance</span>
            </div>
            <h2 class="text-lg font-bold text-slate-900 mt-1">2023 BMW X5 xDrive30d (CA 849-291)</h2>
            <p class="text-xs text-slate-500 mt-0.5">Insured Client: <strong>${client?.profile ? `${client.profile.first_name || ''} ${client.profile.last_name || ''}`.trim() : 'Profile unavailable'}</strong> (${client?.client_number || '—'})</p>
          </div>

          <div class="flex items-center space-x-2">
            ${
              nextStage
                ? `
              <button
                id="dash-advance-claim-btn"
                data-claim-id="${claim.id}"
                data-next-status="${nextStage.key}"
                data-stage-label="${nextStage.label}"
                class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5"
              >
                <span>Advance to Stage: <strong>${nextStage.label}</strong></span>
                <span>→</span>
              </button>
            `
                : '<span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">✓ Final Stage Reached</span>'
            }
          </div>
        </div>

        <!-- 17 Stage Horizontal Strip -->
        <div class="mt-5 pt-4 border-t border-slate-100">
          <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Stage Progression (${Math.max(1, currentIndex + 1)} of ${ALL_17_STAGES.length})</div>
          <div class="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
            ${ALL_17_STAGES.map((st, i) => {
              const isPast = i < currentIndex;
              const isCurrent = i === currentIndex;
              return `
              <div class="shrink-0 p-2.5 rounded-xl border text-xs min-w-[130px] ${
                isCurrent
                  ? 'border-amber-400 bg-amber-50/70 font-bold text-amber-900 ring-2 ring-amber-100'
                  : isPast
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              }">
                <div class="flex items-center justify-between text-[10px] mb-1 opacity-75">
                  <span>Step ${i + 1}</span>
                  ${isPast ? '<span>✓</span>' : ''}
                </div>
                <div class="truncate">${st.label}</div>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Timeline Feed -->
        <div class="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Claims Audit Trail & Chronology</h3>
            <span class="text-xs text-slate-400 font-mono">${timeline.length} Updates</span>
          </div>

          <div class="space-y-3">
            ${timeline
              .map(
                (tl) => `
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-slate-900">${tl.title}</span>
                  <span class="text-[11px] text-slate-400 font-mono">${formatDateTime(tl.created_at)}</span>
                </div>
                ${tl.description ? `<p class="text-slate-600 text-[11px] leading-relaxed">${tl.description}</p>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Meta & Assessor Panel -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Assessor & Provider Meta</h3>
          
          <div class="space-y-3">
            <div class="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
              <span class="text-[10px] uppercase font-bold text-amber-800 block">Appointed Loss Adjuster</span>
              <h4 class="font-bold text-slate-900 mt-0.5">${claim.handler_name || 'Sarah Van Der Merwe'}</h4>
              <p class="text-slate-500 text-[11px]">${claim.handler_contact || '011 380 4000 (Santam Sandton Desk)'}</p>
            </div>

            <div class="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60">
              <span class="text-[10px] uppercase font-bold text-blue-800 block">Panel Beater / Repairer</span>
              <h4 class="font-bold text-slate-900 mt-0.5">${claim.repairer_name || 'Renew-It Sandton (BMW Approved)'}</h4>
              <p class="text-slate-500 text-[11px]">Authorised Repair Bay #4</p>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">SAPS Police Information</span>
              <p class="font-semibold text-slate-800 mt-0.5 font-mono">${claim.police_case_number} (${claim.police_station || 'Sandton SAPS'})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
