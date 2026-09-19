import { requestService } from '../services/request';
import { renderStatusBadge } from '../components/status-badge';
import { renderWorkflowStepper } from '../components/workflow-stepper';
import { formatSimpleDate } from '../utils/date';
import { REQUEST_TYPE_LABELS, RequestType } from '@shared/constants/request-types';

export function renderRequestDetailPage(requestId: string): string {
  const { request, workflows } = requestService.getRequestById(requestId);

  if (!request) {
    return `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <p class="text-sm font-semibold text-slate-800">Request not found</p>
      <button data-nav="requests" class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs rounded-xl font-bold">Back to Requests</button>
    </div>`;
  }

  const categoryLabel = REQUEST_TYPE_LABELS[request.request_type as RequestType] || request.request_type;

  return `
    <div class="space-y-4 pb-24">
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">${categoryLabel}</span>
            <h2 class="text-sm font-bold text-slate-900 mt-0.5">${request.title}</h2>
            <span class="font-mono text-xs text-slate-400 block mt-0.5">${request.request_number}</span>
          </div>
          ${renderStatusBadge(request.status)}
        </div>

        <!-- 4-Step Visual Stepper -->
        <div class="mt-4 pt-3 border-t border-slate-100">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Processing Pipeline</span>
          ${renderWorkflowStepper(workflows)}
        </div>
      </div>

      <!-- Description & Metadata -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Request Details</h3>
        <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">${request.description || 'No additional details specified.'}</p>
        
        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
          <div>
            <span class="text-[10px] text-slate-400 block">Submitted On</span>
            <span class="font-semibold text-slate-700">${formatSimpleDate(request.created_at)}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">Target Resolution</span>
            <span class="font-semibold text-slate-700">${formatSimpleDate(request.due_date)}</span>
          </div>
        </div>
      </div>

      <!-- Step Logs & Notes -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Workflow Audit Log</h3>
        <div class="space-y-2">
          ${workflows
            .map((wf) => {
              const statusClass =
                wf.status === 'completed'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : wf.status === 'in_progress'
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-slate-400 bg-slate-50 border-slate-100';

              return `
              <div class="p-3 rounded-xl border text-xs ${statusClass}">
                <div class="flex justify-between items-center font-semibold">
                  <span>Step ${wf.step_number}: ${wf.step_name}</span>
                  <span class="text-[10px] uppercase">${wf.status.replace(/_/g, ' ')}</span>
                </div>
                ${wf.notes ? `<p class="text-[11px] mt-1 opacity-90">${wf.notes}</p>` : ''}
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    </div>
  `;
}
