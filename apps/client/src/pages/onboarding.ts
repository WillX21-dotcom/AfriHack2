import { fullName, html, reuploadsRemaining, type DocumentRecord, type SafeHtml } from '@shared/index';
import { clientService } from '../services/client';
import { icon } from '../components/icons';
import { documentService } from '../services/document';

/** Where a required document stands: done, or what happens next, driven by its processing status. */
function documentStep(documents: DocumentRecord[], type: DocumentRecord['document_type']): { done: boolean; detail: string } {
  const ofType = documents.filter((d) => d.document_type === type);
  const verified = ofType.find((d) => d.is_verified);
  if (verified) {
    return { done: true, detail: verified.processing_status === 'auto_completed' ? 'Verified automatically' : 'Verified by Royal Square' };
  }
  const latest = ofType.reduce<DocumentRecord | null>((a, d) => (!a || d.created_at > a.created_at ? d : a), null);
  if (!latest) return { done: false, detail: 'Not uploaded yet' };
  switch (latest.processing_status) {
    case 'processing':
      return { done: false, detail: 'Reading your document…' };
    case 'under_review':
      return { done: false, detail: 'Under review by your adviser' };
    case 'rejected': {
      const left = reuploadsRemaining(latest.reupload_count);
      return { done: false, detail: `${latest.rejection_reason ?? 'Please upload a clearer copy.'} (${left} attempt${left === 1 ? '' : 's'} left)` };
    }
    default:
      return { done: false, detail: 'Uploaded, waiting to be checked' };
  }
}

/** A real checklist derived from the client's file, uploads and adviser sign-off. */
export function getOnboardingSteps() {
  const client = clientService.getCurrentClient();
  const adviser = clientService.getAdviser();
  const documents = documentService.getDocuments();

  const detailsDone = Boolean(client?.id_number && client?.date_of_birth && client?.address_line_1);
  const idStep = documentStep(documents, 'id_document');
  const addressStep = documentStep(documents, 'proof_of_address');

  return [
    { title: 'Complete your personal details', detail: detailsDone ? 'Done' : 'Add your ID number, date of birth and address on your profile', done: detailsDone, nav: 'profile' },
    { title: 'Upload your ID document', detail: idStep.detail, done: idStep.done, nav: 'documents' },
    { title: 'Upload proof of address', detail: addressStep.detail, done: addressStep.done, nav: 'documents' },
    { title: 'Adviser assigned', detail: adviser ? fullName(adviser) : 'An adviser will be assigned to you shortly', done: Boolean(adviser), nav: 'messages' },
    { title: 'Onboarding signed off by Royal Square', detail: client?.onboarding_completed ? 'Complete' : 'Your adviser signs this off once the steps above are done', done: Boolean(client?.onboarding_completed), nav: '' },
  ];
}

export function renderOnboardingPage(): SafeHtml {
  const steps = getOnboardingSteps();
  const completed = steps.filter((s) => s.done).length;

  return html`
    <div class="space-y-5 pb-4">
      <div>
        <h2 class="rsc-title">Onboarding</h2>
        <p class="rsc-subtitle mt-0.5">The steps Royal Square needs to complete before your adviser can act for you</p>
      </div>

      <section class="rsc-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="rsc-eyebrow">Progress</span>
          <span class="rsc-num text-xs font-semibold text-slate-700">${completed} of ${steps.length} complete</span>
        </div>
        <div class="rsc-progress"><span style="width: ${Math.round((completed / steps.length) * 100)}%"></span></div>

        <div class="mt-3 divide-y divide-slate-100">
          ${steps.map(
            (step, i) => html`<button ${step.nav ? html`data-nav="${step.nav}"` : 'disabled'} class="w-full py-3.5 flex items-center gap-3 text-left ${step.nav ? 'hover:bg-slate-50' : ''}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${step.done ? 'bg-[#0A192F] text-white' : 'border border-slate-300 text-slate-400'}">${step.done ? icon('check', 'w-3.5 h-3.5', 3) : i + 1}</span>
              <span class="min-w-0 flex-1"><span class="block text-[13px] font-medium ${step.done ? 'text-slate-500' : 'text-slate-900'}">${step.title}</span><span class="block rsc-muted">${step.detail}</span></span>
              ${step.nav && !step.done ? html`<span class="text-slate-400 shrink-0">${icon('chevronRight', 'w-4 h-4', 2)}</span>` : ''}
            </button>`
          )}
        </div>
      </section>
    </div>
  `;
}
