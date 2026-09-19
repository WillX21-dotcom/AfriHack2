import { documentService } from '../services/document';
import { formatSimpleDate } from '../utils/date';

export function renderDocumentsPage(): string {
  const documents = documentService.getDocuments();

  return `
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Encrypted Document Vault</h2>
          <p class="text-xs text-slate-500">POPIA-compliant storage for FICA, policies & statements</p>
        </div>
        <label class="px-3 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer">
          <span>+ Upload</span>
          <input id="doc-upload-input" type="file" class="hidden" />
        </label>
      </div>

      <div class="space-y-3">
        ${
          documents.length === 0
            ? `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p class="text-xs text-slate-400">No documents in vault.</p>
              </div>`
            : documents
                .map(
                  (doc) => `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-800 font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-800 leading-snug">${doc.name}</h4>
                  <div class="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                    <span>${formatSimpleDate(doc.created_at)}</span>
                    <span>•</span>
                    <span class="uppercase">${doc.document_type.replace(/_/g, ' ')}</span>
                    ${
                      doc.is_verified
                        ? `<span class="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-md">✓ FICA Verified</span>`
                        : ''
                    }
                  </div>
                </div>
              </div>
              <button data-action="download-doc" data-name="${doc.name}" class="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </button>
            </div>
          `
                )
                .join('')
        }
      </div>
    </div>
  `;
}
