import { html, type SafeHtml } from '@shared/html';
import { formatDate, titleCase } from '@shared/format';
import { documentStatusBadgeClass, documentStatusLabel, isOcrEligible } from '@shared/index';
import { adviserService } from '../services/adviser';
import { emptyState, pageHeading } from '../components/ui';

export function renderDashboardDocumentsPage(): SafeHtml {
  const docs = adviserService.getDocuments();
  const pending = docs.filter((d) => !d.is_verified).length;
  const inReview = docs.filter((d) => d.processing_status === 'under_review').length;

  return html`
    <div class="space-y-6">
      ${pageHeading('Document Register', `${docs.length} documents in the vault${pending ? ` · ${pending} awaiting verification` : ''}. Open a client to upload on their behalf.`)}

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <button data-doc-filter="all" class="px-3 py-1.5 rounded-full border font-semibold bg-[#0A192F] text-amber-300 border-[#0A192F]">All</button>
        <button data-doc-filter="review" class="px-3 py-1.5 rounded-full border font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50">Under review${inReview ? ` (${inReview})` : ''}</button>
        <button data-doc-filter="pending" class="px-3 py-1.5 rounded-full border font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50">Awaiting verification</button>
        <input id="doc-search-input" type="text" placeholder="Filter by client or file name..." class="ml-auto w-64 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden" />
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        ${docs.length === 0
          ? emptyState('The vault is empty', 'Documents uploaded by clients, or by you for a client, are listed here.')
          : html`
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr><th class="py-3.5 px-4">Document</th><th class="py-3.5 px-4">Client</th><th class="py-3.5 px-4">Type</th><th class="py-3.5 px-4">Uploaded</th><th class="py-3.5 px-4">By</th><th class="py-3.5 px-4">Status</th><th class="py-3.5 px-4 text-right">Actions</th></tr>
                </thead>
                <tbody id="documents-table-body" class="divide-y divide-slate-100">
                  ${docs.map(
                    (d) => html`
                      <tr class="hover:bg-slate-50/80" data-verified="${d.is_verified}" data-status="${d.processing_status}" data-search="${`${d.name} ${adviserService.clientName(d.client_id)}`.toLowerCase()}">
                        <td class="py-3 px-4 font-semibold text-slate-900">${d.name}</td>
                        <td class="py-3 px-4"><button data-dash-nav="client-detail" data-id="${d.client_id}" class="font-semibold text-blue-700 hover:underline">${adviserService.clientName(d.client_id)}</button></td>
                        <td class="py-3 px-4">${titleCase(d.document_type)}</td>
                        <td class="py-3 px-4 text-slate-500">${formatDate(d.created_at)}</td>
                        <td class="py-3 px-4 text-slate-500">${adviserService.profileName(d.uploaded_by)}</td>
                        <td class="py-3 px-4"><span class="${documentStatusBadgeClass(d)}">${documentStatusLabel(d)}</span>${d.escalated_at ? html` <span class="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Escalated</span>` : ''}${d.confidence_score !== null ? html` <span class="text-[10px] text-slate-400">${Math.round(d.confidence_score * 100)}%</span>` : ''}</td>
                        <td class="py-3 px-4 text-right whitespace-nowrap">
                          <button data-action="open-doc" data-id="${d.id}" class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-100">Open</button>
                          <button data-action="review-doc" data-id="${d.id}" class="ml-1 px-2.5 py-1 rounded-lg font-semibold ${d.processing_status === 'under_review' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}">Review</button>
                          ${isOcrEligible(d.document_type) ? '' : html`<button data-action="verify-doc" data-id="${d.id}" data-verified="${d.is_verified ? 'false' : 'true'}" class="ml-1 px-2.5 py-1 rounded-lg font-semibold ${d.is_verified ? 'text-slate-500 hover:bg-slate-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}">${d.is_verified ? 'Unverify' : 'Verify'}</button>`}
                        </td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </div>
          `}
      </div>
    </div>
  `;
}
