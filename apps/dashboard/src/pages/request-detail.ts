import { html, type SafeHtml } from '@shared/html';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { formatDateTime, fullName, isOpenRequest, titleCase } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge, renderPriorityBadge } from '../components/status-badge';
import { INPUT_CLASS, notFound } from '../components/ui';
import { renderDocumentRow, renderUploadForm } from './client-detail';

export function renderDashboardRequestDetailPage(requestId: string): SafeHtml {
  const { request, workflows, client, documents } = adviserService.getRequestDetail(requestId);
  if (!request) return notFound('Request', 'requests', 'Back to Requests');

  const open = isOpenRequest(request.status);
  const currentStep = workflows.find((w) => w.status === 'in_progress') || workflows.find((w) => w.status === 'pending');
  const isLast = !!currentStep && !workflows.some((w) => w.step_number > currentStep.step_number);

  return html`
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center flex-wrap gap-2">
              <span class="font-mono text-xs font-bold text-slate-400">${request.request_number}</span>
              ${renderDashboardStatusBadge(request.status)} ${renderPriorityBadge(request.priority)}
            </div>
            <h2 class="text-lg font-bold text-slate-900 mt-1">${request.title}</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              ${REQUEST_TYPE_LABELS[request.request_type as RequestType] || request.request_type} ·
              Client: <button data-dash-nav="client-detail" data-id="${request.client_id}" class="font-bold text-blue-700 hover:underline">${fullName(client?.profile, 'Unknown client')}</button>
              (${client?.client_number || '—'}) · Assigned to <strong>${adviserService.profileName(request.assigned_to)}</strong>
            </p>
          </div>
          <button data-dash-nav="communications" data-id="${request.client_id}" data-request="${request.id}" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold shrink-0">✉ Message client</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Workflow pipeline</h3>
            <div class="space-y-3">
              ${workflows.map((wf) => {
                const isCurrent = wf.status === 'in_progress';
                const isDone = wf.status === 'completed';
                return html`
                  <div class="p-4 rounded-xl border transition-all ${isCurrent ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-100' : isDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-100 bg-slate-50 opacity-70'}">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center space-x-2">
                        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-[#0A192F] text-amber-300' : 'bg-slate-200 text-slate-500'}">${isDone ? '✓' : wf.step_number}</span>
                        <h4 class="text-xs font-bold text-slate-900">${wf.step_name}</h4>
                      </div>
                      <span class="text-[10px] font-bold uppercase ${isDone ? 'text-emerald-700' : isCurrent ? 'text-amber-800' : 'text-slate-400'}">${titleCase(wf.status)}</span>
                    </div>
                    ${wf.notes ? html`<p class="text-xs text-slate-600 mt-2 pl-8 leading-relaxed">${wf.notes}</p>` : ''}
                    ${wf.completed_at ? html`<p class="text-[10px] text-slate-400 mt-1 pl-8">Completed ${formatDateTime(wf.completed_at)}</p>` : ''}
                  </div>
                `;
              })}
            </div>

            ${open && currentStep
              ? html`
                <form id="advance-request-form" data-request="${request.id}" class="pt-3 border-t border-slate-100 space-y-3">
                  <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Note for step ${currentStep.step_number} (visible to the client)</span>
                    <textarea name="notes" rows="2" placeholder="e.g. Documents verified, submitted to the provider" class="${INPUT_CLASS}"></textarea>
                  </label>
                  <div class="flex flex-wrap items-center gap-2">
                    <button type="submit" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs">
                      ${isLast ? '✓ Complete request & notify client' : `✓ Complete step ${currentStep.step_number} & advance`}
                    </button>
                  </div>
                </form>
              `
              : html`<div class="pt-3 border-t border-slate-100"><span class="text-xs font-bold ${request.status === 'completed' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'} px-3 py-1.5 rounded-xl">${request.status === 'completed' ? '✓ Workflow fully resolved' : 'Request cancelled'}</span></div>`}
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Documents for this request</h3>
            <div class="space-y-2">
              ${documents.length === 0 ? html`<p class="text-[11px] text-slate-400">Nothing attached. Uploading a document here delivers it to the client's vault and notifies them.</p>` : documents.map((d) => renderDocumentRow(d))}
            </div>
            ${renderUploadForm(request.client_id, { requestId: request.id })}
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Request information</h3>
            <div class="text-xs space-y-3">
              <div><span class="text-slate-400 block text-[10px] uppercase">Client's description</span>
                <p class="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">${request.description || 'No description provided'}</p></div>
              <div><span class="text-slate-400 block text-[10px] uppercase">Submitted</span><span class="font-medium text-slate-700">${formatDateTime(request.created_at)}</span></div>
              <div><span class="text-slate-400 block text-[10px] uppercase">SLA target</span><span class="font-medium text-amber-700 font-mono">${formatDateTime(request.due_date)}</span></div>
              ${request.completed_at ? html`<div><span class="text-slate-400 block text-[10px] uppercase">Resolved</span><span class="font-medium text-emerald-700">${formatDateTime(request.completed_at)}</span></div>` : ''}
            </div>
          </div>

          ${open
            ? html`
              <form id="request-status-form" data-request="${request.id}" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Change status</h3>
                <select name="status" class="${INPUT_CLASS}">
                  ${[['in_progress', 'In progress'], ['waiting_client', 'Waiting on client'], ['waiting_provider', 'Waiting on provider'], ['cancelled', 'Cancel request']].map(
                    ([v, l]) => html`<option value="${v}" ${v === request.status ? 'selected' : ''}>${l}</option>`
                  )}
                </select>
                <textarea name="note" rows="2" placeholder="Reason / what you need from the client" class="${INPUT_CLASS}"></textarea>
                <button type="submit" class="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs">Update status</button>
              </form>
            `
            : ''}
        </div>
      </div>
    </div>
  `;
}
