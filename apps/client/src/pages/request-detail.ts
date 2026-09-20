import { formatDate, html, titleCase, type SafeHtml } from '@shared/index';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { requestService } from '../services/request';
import { renderStatusBadge } from '../components/status-badge';
import { renderWorkflowStepper } from '../components/workflow-stepper';

export function renderRequestDetailPage(requestId: string): SafeHtml {
  const { request, workflows, documents } = requestService.getRequestById(requestId);

  if (!request) {
    return html`<div class="rsc-card px-6 py-10 text-center">
      <p class="rsc-heading">Request not found</p>
      <button data-nav="requests" class="rsc-btn rsc-btn-primary rsc-btn-sm mt-5">Back to requests</button>
    </div>`;
  }

  const label = REQUEST_TYPE_LABELS[request.request_type as RequestType] || request.request_type;

  return html`
    <div class="space-y-4 pb-4">
      <section class="rsc-card p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="rsc-muted">${label}</p>
            <h2 class="text-base font-semibold text-slate-900 mt-0.5">${request.title}</h2>
            <p class="rsc-ref !text-[12px] mt-0.5">${request.request_number}</p>
          </div>
          ${renderStatusBadge(request.status, 'request')}
        </div>
        <div class="mt-4 pt-4 rsc-divider">
          <h3 class="rsc-eyebrow">Progress</h3>
          ${renderWorkflowStepper(workflows)}
        </div>
        ${request.status === 'waiting_client'
          ? html`<div class="rsc-notice rsc-notice-info mt-4">Your adviser needs something from you. Check the step notes below or <button data-nav="messages" data-context-request="${request.id}" class="font-semibold underline">send a message</button>.</div>`
          : ''}
      </section>

      <section class="rsc-card p-4 space-y-3">
        <h3 class="rsc-eyebrow">Details</h3>
        <p class="rsc-text rsc-inset p-3 whitespace-pre-wrap">${request.description || 'No additional details were given.'}</p>
        <div class="grid grid-cols-2 gap-3">
          <div><p class="rsc-muted">Submitted</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${formatDate(request.created_at)}</p></div>
          <div><p class="rsc-muted">${request.completed_at ? 'Completed' : 'Target date'}</p><p class="text-[13px] font-medium text-slate-800 mt-0.5">${formatDate(request.completed_at || request.due_date)}</p></div>
        </div>
      </section>

      ${documents.length > 0
        ? html`<section class="rsc-card">
            <h3 class="rsc-eyebrow px-4 pt-4">Documents</h3>
            <div class="px-4 pb-1 divide-y divide-slate-100 mt-1">
              ${documents.map((doc) => html`<button data-action="open-doc" data-id="${doc.id}" class="w-full flex items-center justify-between py-3 text-left gap-3">
                <span class="min-w-0"><span class="text-[13px] font-medium text-slate-900 block truncate">${doc.name}</span><span class="rsc-muted">${titleCase(doc.document_type)} · ${formatDate(doc.created_at)}</span></span>
                <span class="rsc-link shrink-0">Open</span>
              </button>`)}
            </div>
          </section>`
        : ''}

      <section class="rsc-card p-4">
        <h3 class="rsc-eyebrow mb-3">Step notes</h3>
        <div class="space-y-2">
          ${workflows.map((wf) => {
            const tone = wf.status === 'completed' ? 'rsc-badge-green' : wf.status === 'in_progress' ? 'rsc-badge-amber' : 'rsc-badge-slate';
            return html`<div class="rsc-inset p-3">
              <div class="flex justify-between items-center gap-2"><span class="text-[13px] font-medium text-slate-900">Step ${wf.step_number}: ${wf.step_name}</span><span class="rsc-badge ${tone} shrink-0">${titleCase(wf.status)}</span></div>
              ${wf.notes ? html`<p class="rsc-text mt-1.5 whitespace-pre-wrap">${wf.notes}</p>` : ''}
            </div>`;
          })}
        </div>
      </section>

      <button data-nav="messages" data-context-request="${request.id}" class="rsc-btn rsc-btn-secondary rsc-btn-block">Message your adviser about this request</button>
    </div>
  `;
}
