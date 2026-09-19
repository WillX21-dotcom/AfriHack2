import { fullName, html, type SafeHtml } from '@shared/index';
import { clientService } from '../services/client';
import { documentService } from '../services/document';

/** A real checklist derived from the client's file, uploads and adviser sign-off. */
export function getOnboardingSteps() {
  const client = clientService.getCurrentClient();
  const adviser = clientService.getAdviser();
  const documents = documentService.getDocuments();

  const detailsDone = Boolean(client?.id_number && client?.date_of_birth && client?.address_line_1);
  const hasId = documents.some((d) => d.document_type === 'id_document');
  const hasAddress = documents.some((d) => d.document_type === 'proof_of_address');
  const idVerified = documents.some((d) => d.document_type === 'id_document' && d.is_verified);
  const addressVerified = documents.some((d) => d.document_type === 'proof_of_address' && d.is_verified);

  return [
    { title: 'Complete your personal details', detail: detailsDone ? 'Done' : 'Add your ID number, date of birth and address on your profile', done: detailsDone, nav: 'profile' },
    { title: 'Upload your ID document', detail: idVerified ? 'Verified by Royal Square' : hasId ? 'Uploaded, awaiting verification' : 'Not uploaded yet', done: idVerified, nav: 'documents' },
    { title: 'Upload proof of address', detail: addressVerified ? 'Verified by Royal Square' : hasAddress ? 'Uploaded, awaiting verification' : 'Not uploaded yet', done: addressVerified, nav: 'documents' },
    { title: 'Adviser assigned', detail: adviser ? fullName(adviser) : 'An adviser will be assigned to you shortly', done: Boolean(adviser), nav: 'messages' },
    { title: 'Onboarding signed off by Royal Square', detail: client?.onboarding_completed ? 'Complete' : 'Your adviser signs this off once the steps above are done', done: Boolean(client?.onboarding_completed), nav: '' },
  ];
}

export function renderOnboardingPage(): SafeHtml {
  const steps = getOnboardingSteps();
  const completed = steps.filter((s) => s.done).length;

  return html`
    <div class="space-y-4 pb-24">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Onboarding checklist</span>
        <h2 class="text-base font-bold text-slate-900 mt-1">${completed} of ${steps.length} steps complete</h2>
        <div class="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden"><div class="bg-emerald-500 h-2 rounded-full" style="width: ${Math.round((completed / steps.length) * 100)}%"></div></div>

        <div class="space-y-3 mt-4">
          ${steps.map(
            (step, i) => html`<button ${step.nav ? html`data-nav="${step.nav}"` : 'disabled'} class="w-full p-3 border rounded-xl flex items-center justify-between text-xs text-left gap-3 ${step.done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}">
              <span class="min-w-0"><span class="font-medium block ${step.done ? 'text-emerald-900' : 'text-slate-800'}">${i + 1}. ${step.title}</span><span class="text-[11px] ${step.done ? 'text-emerald-700' : 'text-slate-500'}">${step.detail}</span></span>
              <span class="font-bold shrink-0 ${step.done ? 'text-emerald-700' : 'text-slate-400'}">${step.done ? '✓' : '○'}</span>
            </button>`
          )}
        </div>
      </div>
    </div>
  `;
}
