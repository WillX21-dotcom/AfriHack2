import { formatDate, html, titleCase, type SafeHtml } from '@shared/index';
import { documentService, DOCUMENT_TYPE_OPTIONS } from '../services/document';

export function renderDocumentsPage(): SafeHtml {
  const documents = documentService.getDocuments();

  return html`
    <div class="space-y-4 pb-24">
      <div>
        <h2 class="text-base font-bold text-slate-900">Document vault</h2>
        <p class="text-xs text-slate-500">Private storage shared only with you and your Royal Square adviser. Files up to 10 MB (PDF, images, Word, Excel).</p>
      </div>

      <form id="doc-upload-form" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="doc-type-select">Document type</label>
            <select id="doc-type-select" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              ${DOCUMENT_TYPE_OPTIONS.map((o) => html`<option value="${o.value}">${o.label}</option>`)}
            </select>
          </div>
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="doc-upload-input">File</label>
            <input id="doc-upload-input" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt,.csv" class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0A192F] file:text-amber-300" />
          </div>
        </div>
        <button type="submit" class="px-4 py-2 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Upload to vault</button>
      </form>

      ${documents.length === 0
        ? html`<div class="p-8 text-center bg-white rounded-2xl border border-slate-200"><p class="text-xs text-slate-400">Nothing in your vault yet. Upload your ID and proof of address to complete onboarding.</p></div>`
        : html`<div class="space-y-3">
            ${documents.map(
              (doc) => html`<div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <h4 class="text-xs font-bold text-slate-800 leading-snug truncate">${doc.name}</h4>
                  <div class="flex items-center flex-wrap gap-x-2 text-[10px] text-slate-400 mt-0.5">
                    <span>${formatDate(doc.created_at)}</span><span>•</span><span class="uppercase">${titleCase(doc.document_type)}</span>
                    ${doc.is_verified ? html`<span class="text-emerald-600 font-semibold bg-emerald-50 px-1.5 rounded-md">✓ Verified by Royal Square</span>` : html`<span class="text-amber-700 bg-amber-50 px-1.5 rounded-md">Awaiting verification</span>`}
                  </div>
                </div>
                <button data-action="open-doc" data-id="${doc.id}" aria-label="Open ${doc.name}" class="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
              </div>`
            )}
          </div>`}
    </div>
  `;
}
