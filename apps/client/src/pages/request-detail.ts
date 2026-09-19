import { formatDate, html, titleCase, type SafeHtml } from '@shared/index';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { requestService } from '../services/request';
import { renderStatusBadge } from '../components/status-badge';
import { renderWorkflowStepper } from '../components/workflow-stepper';

export function renderRequestDetailPage(requestId: string): SafeHtml {
  const { request, workflows, documents } = requestService.getRequestById(requestId);

  if (!request) {
    return html`<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <p class="text-sm font-semibold text-slate-800">Request not found</p>
      <button data-nav="requests" class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs rounded-xl font-bold">Back to requests</button>
    </div>`;
  }

  const label = REQUEST_TYPE_LABELS[request.request_type as RequestType] || request.request_type;

  return html`
    <div class="space-y-4 pb-24">
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">${label}</span>
            <h2 class="text-sm font-bold text-slate-900 mt-0.5">${request.title}</h2>
            <span class="font-mono text-xs text-slate-400 block mt-0.5">${request.request_number}</span>
          </div>
          ${renderStatusBadge(request.status)}
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Progress</span>
          ${renderWorkflowStepper(workflows)}
        </div>
        ${request.status === 'waiting_client'
          ? html`<div class="mt-3 rounded-xl bg-purple-50 border border-purple-100 p-3 text-xs text-purple-900">Your adviser needs something from you. Check the notes below or <button data-nav="messages" data-context-request="${request.id}" class="font-bold underline">send a message</button>.</div>`
          : ''}
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Details</h3>
        <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">${request.description || 'No additional details were given.'}</p>
        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
          <div><span class="text-[10px] text-slate-400 block">Submitted</span><span class="font-semibold text-slate-700">${formatDate(request.created_at)}</span></div>
          <div><span class="text-[10px] text-slate-400 block">${request.completed_at ? 'Completed' : 'Target date'}</span><span class="font-semibold text-slate-700">${formatDate(request.completed_at || request.due_date)}</span></div>
        </div>
      </div>

      ${documents.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Documents</h3>
            <div class="space-y-2">
              ${documents.map((doc) => html`<button data-action="open-doc" data-id="${doc.id}" class="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-left gap-2">
                <span class="min-w-0"><span class="font-semibold text-slate-800 block truncate">${doc.name}</span><span class="text-[10px] text-slate-400">${titleCase(doc.document_type)} · ${formatDate(doc.created_at)}</span></span>
                <span class="text-blue-600 font-semibold shrink-0">Open</span>
              </button>`)}
            </div>
          </div>`
        : ''}

      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Step notes</h3>
        <div class="space-y-2">
          ${workflows.map((wf) => {
            const tone =
              wf.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : wf.status === 'in_progress' ? 'text-amber-800 bg-amber-50 border-amber-200'
              : 'text-slate-400 bg-slate-50 border-slate-100';
            return html`<div class="p-3 rounded-xl border text-xs ${tone}">
              <div class="flex justify-between items-center font-semibold gap-2"><span>Step ${wf.step_number}: ${wf.step_name}</span><span class="text-[10px] uppercase shrink-0">${titleCase(wf.status)}</span></div>
              ${wf.notes ? html`<p class="text-[11px] mt-1 opacity-90 whitespace-pre-wrap">${wf.notes}</p>` : ''}
            </div>`;
          })}
        </div>
      </div>
    </div>
  `;
}
