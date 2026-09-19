import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { formatDateTime } from '../utils/formatters';

export function renderDashboardRequestDetailPage(requestId: string): string {
  const { request, workflows, client } = adviserService.getRequestDetail(requestId);

  if (!request) {
    return `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <h3 class="text-sm font-bold text-slate-800">Request not found</h3>
      <button data-dash-nav="requests" class="mt-3 px-4 py-2 bg-[#0A192F] text-amber-300 rounded-xl text-xs font-bold">Back to Requests</button>
    </div>`;
  }

  const currentStep = workflows.find((w) => w.status === 'in_progress') || workflows[0];

  return `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-slate-400">${request.request_number}</span>
              ${renderDashboardStatusBadge(request.status)}
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">${request.priority}</span>
            </div>
            <h2 class="text-lg font-bold text-slate-900 mt-1">${request.title}</h2>
            <p class="text-xs text-slate-500 mt-0.5">Client: <strong>${client?.profile ? `${client.profile.first_name || ''} ${client.profile.last_name || ''}`.trim() : 'Profile unavailable'}</strong> (${client?.client_number || '—'})</p>
          </div>

          <div class="flex items-center space-x-2">
            ${
              request.status !== 'completed' && currentStep
                ? `
              <button
                id="dash-advance-step-btn"
                data-req-id="${request.id}"
                data-step="${currentStep.step_number}"
                class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5"
              >
                <span>✓ Complete Step ${currentStep.step_number} & Advance</span>
              </button>
            `
                : '<span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">✓ Workflow Fully Resolved</span>'
            }
          </div>
        </div>
      </div>

      <!-- Pipeline Stepper Details -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Multi-Step Pipeline Status</h3>
          
          <div class="space-y-3">
            ${workflows
              .map((wf) => {
                const isCurrent = wf.status === 'in_progress';
                const isDone = wf.status === 'completed';
                return `
                <div class="p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-50/50 shadow-xs ring-2 ring-amber-100'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }">
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                      <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDone ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-[#0A192F] text-amber-300' : 'bg-slate-200 text-slate-500'
                      }">
                        ${isDone ? '✓' : wf.step_number}
                      </span>
                      <h4 class="text-xs font-bold text-slate-900">${wf.step_name}</h4>
                    </div>
                    <span class="text-[10px] font-bold uppercase ${isDone ? 'text-emerald-700' : isCurrent ? 'text-amber-800' : 'text-slate-400'}">
                      ${wf.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  ${wf.notes ? `<p class="text-xs text-slate-600 mt-2 pl-8 leading-relaxed">${wf.notes}</p>` : ''}
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- Request Details Sidebar -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Request Information</h3>
          <div class="text-xs space-y-3">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">Description & Context</span>
              <p class="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">${request.description || 'No description'}</p>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">Created At</span>
              <span class="font-medium text-slate-700">${formatDateTime(request.created_at)}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">SLA Target Date</span>
              <span class="font-medium text-amber-700 font-mono">${formatDateTime(request.due_date)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
